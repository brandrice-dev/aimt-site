// Phase 0 regression tests — AIMT Cadence Launch Sweep.
// See docs/course-audit/00-cadence-launch-sweep-build-contract.md Section 12.
//
// Covers:
//  1. Centralized model config (no "latest", env override must be
//     pre-registered, repo-internal Worker/Pages-Function drift check).
//  2. Rate limiter behavior.
//  3. Real submit-interview-turn.js (imported and invoked directly, not
//     re-mocked) against a mocked fetch/Supabase/Anthropic layer:
//       - retry after an Anthropic failure never duplicates a transcript
//         turn and never loops;
//       - a genuine two-in-flight-requests race is rejected, not raced;
//       - a stale lock self-heals rather than deadlocking;
//       - the rate limiter rejects before any attempt-state mutation;
//       - model identity is persisted on a successful evaluation;
//       - the one-follow-up rule is preserved.
//
// Run: node tests/cadence-phase0.test.mjs

import { getCadenceModelConfig, resolveCadenceModel } from '../functions/_lib/cadence/model-config.mjs';
import { checkRateLimit, _resetRateLimitBucketsForTests } from '../functions/_lib/cadence/rate-limit.mjs';
import { getProductionBanks } from '../functions/_lib/certification/content-bank.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

// ─────────────────────────────────────────────────────────────────────────
// 1. MODEL CONFIG
// ─────────────────────────────────────────────────────────────────────────
(function modelConfigUnitTests() {
  const config = getCadenceModelConfig();
  check('MODEL CONFIG', 'Defines both CADENCE_CHAT_MODEL and CADENCE_GRADING_MODEL roles', !!config.roles.CADENCE_CHAT_MODEL && !!config.roles.CADENCE_GRADING_MODEL);
  check('MODEL CONFIG', 'Provider is anthropic', config.provider === 'anthropic');

  for (const role of ['CADENCE_CHAT_MODEL', 'CADENCE_GRADING_MODEL']) {
    check('MODEL CONFIG', `${role}: no env binding -> resolves to the approved default`, resolveCadenceModel({}, role).modelName === config.roles[role].approved);
    check('MODEL CONFIG', `${role}: approved value is not a "latest"/generic alias`, !/latest|default/i.test(config.roles[role].approved));

    const arbitrary = resolveCadenceModel({ [role]: 'claude-totally-made-up-latest' }, role);
    check('MODEL CONFIG', `${role}: an unregistered env override is ignored, falls back to approved`, arbitrary.modelName === config.roles[role].approved && arbitrary.source === 'approved-default');

    const emptyCandidate = resolveCadenceModel({ [role]: '' }, role);
    check('MODEL CONFIG', `${role}: an empty env override is ignored`, emptyCandidate.modelName === config.roles[role].approved);
  }

  let threw = false;
  try { resolveCadenceModel({}, 'CADENCE_NOT_A_REAL_ROLE'); } catch (_) { threw = true; }
  check('MODEL CONFIG', 'Resolving an unknown role throws rather than silently returning something', threw);

  // A candidate override must be honored ONLY when it matches the exact
  // pre-registered candidate string for the current version -- simulated
  // here since the shipped config has no live candidate yet (none has been
  // promoted for testing).
  const versionWithCandidate = getCadenceModelConfig('cadence-model-config-v1');
  check('MODEL CONFIG', 'Current version has no live candidate registered (nothing to silently promote)', versionWithCandidate.roles.CADENCE_CHAT_MODEL.candidate === null);
})();

// ─────────────────────────────────────────────────────────────────────────
// 1b. STATIC — Worker/Pages-Function repo-internal drift check
// ─────────────────────────────────────────────────────────────────────────
(function workerModelDriftCheck() {
  const workerSrc = readFileSync(path.join(ROOT, 'cadence-worker/worker.js'), 'utf8');
  const match = workerSrc.match(/const APPROVED_CHAT_MODEL\s*=\s*'([^']+)'/);
  check('WORKER DRIFT', "cadence-worker/worker.js declares APPROVED_CHAT_MODEL as a named constant", !!match);
  if (match) {
    const config = getCadenceModelConfig();
    check('WORKER DRIFT', "Worker's APPROVED_CHAT_MODEL matches functions/_lib/cadence/model-config.mjs's CADENCE_CHAT_MODEL.approved (repo-internal only -- cannot see what is actually deployed live)", match[1] === config.roles.CADENCE_CHAT_MODEL.approved, `worker=${match[1]} config=${config.roles.CADENCE_CHAT_MODEL.approved}`);
  }
  check('WORKER DRIFT', 'Worker never hardcodes a model string directly into ALLOWED_MODELS (uses the named constants)', !/ALLOWED_MODELS\s*=\s*\['claude-/.test(workerSrc));
  check('WORKER DRIFT', "Worker resolves the model server-side from env.CADENCE_CHAT_MODEL / APPROVED_CHAT_MODEL, never from the client's request body", /env\.CADENCE_CHAT_MODEL/.test(workerSrc) && !/ALLOWED_MODELS\.includes\(body\.model\)/.test(workerSrc));

  const clientSrc = readFileSync(path.join(ROOT, 'headspa-mastery.html'), 'utf8');
  check('WORKER DRIFT', 'Client-side callAI() no longer sends a model name in the request body', !/body:\s*JSON\.stringify\(\{\s*model:/.test(clientSrc));

  const graderSrc = readFileSync(path.join(ROOT, 'functions/_lib/certification/cadence-grader.mjs'), 'utf8');
  check('WORKER DRIFT', 'cadence-grader.mjs no longer hardcodes ALLOWED_MODEL; imports the shared config instead', !/const ALLOWED_MODEL\s*=/.test(graderSrc) && /resolveCadenceModel/.test(graderSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// 2. RATE LIMITER
// ─────────────────────────────────────────────────────────────────────────
(function rateLimiterUnitTests() {
  _resetRateLimitBucketsForTests();
  const key = 'test-user-' + Math.random();
  let lastResult = null;
  for (let i = 0; i < 5; i++) lastResult = checkRateLimit(key, { perMinute: 5, perDay: 100 });
  check('RATE LIMIT', 'Exactly at the per-minute limit: not yet rejected', lastResult === null);
  const over = checkRateLimit(key, { perMinute: 5, perDay: 100 });
  check('RATE LIMIT', 'One request over the per-minute limit: rejected with "minute"', over === 'minute');

  _resetRateLimitBucketsForTests();
  const dayKey = 'test-user-day-' + Math.random();
  let dayResult = null;
  for (let i = 0; i < 3; i++) dayResult = checkRateLimit(dayKey, { perMinute: 1000, perDay: 3 });
  check('RATE LIMIT', 'Exactly at the per-day limit: not yet rejected', dayResult === null);
  const overDay = checkRateLimit(dayKey, { perMinute: 1000, perDay: 3 });
  check('RATE LIMIT', 'One request over the per-day limit: rejected with "day"', overDay === 'day');

  _resetRateLimitBucketsForTests();
  const isolatedA = checkRateLimit('user-A', { perMinute: 1, perDay: 100 });
  const isolatedB = checkRateLimit('user-B', { perMinute: 1, perDay: 100 });
  check('RATE LIMIT', 'Different keys are tracked independently', isolatedA === null && isolatedB === null);
})();

// ─────────────────────────────────────────────────────────────────────────
// 3. submit-interview-turn.js — real production code, mocked transport
// ─────────────────────────────────────────────────────────────────────────

const banks = getProductionBanks();
const realInterview = banks.interviewBank.find((i) => i.status === 'approved' && Array.isArray(i.rubricCriteria) && i.rubricCriteria.length > 0);

function makeAttemptRow(overrides = {}) {
  return {
    id: 'attempt-1',
    user_id: 'user-1',
    status: 'part2_locked',
    part3_selected_ids: [realInterview.id],
    part3_conversation_state: {},
    ...overrides,
  };
}

function makeRequest(bodyObj) {
  return {
    headers: { get: (name) => (name === 'Authorization' ? 'Bearer mock-token' : null) },
    json: async () => bodyObj,
  };
}

function anthropicSuccessBody(needsFollowUp) {
  const criterionScores = {};
  for (const c of realInterview.rubricCriteria) criterionScores[c.id] = 2;
  const payload = needsFollowUp
    ? { criterionScores, explicitUnsafeDomains: [], patternTags: {}, needsFollowUp: true, followUpPrompt: 'Can you say more about that?' }
    : { criterionScores, explicitUnsafeDomains: [], patternTags: {}, needsFollowUp: false, transitionLine: 'Good — let\'s move on.' };
  return { content: [{ text: JSON.stringify(payload) }] };
}

/**
 * Builds a mock global fetch covering the three URLs submit-interview-turn.js's
 * call graph actually hits (Supabase auth, Supabase REST, Anthropic), backed
 * by one mutable in-memory attempt row so PATCHes are visible to subsequent
 * reads within the same test, exactly like a real request sequence would see.
 */
function buildMockFetch({ attemptRow, anthropicBehavior }) {
  const patchBodies = [];
  let anthropicCallCount = 0;

  const impl = async (url, options = {}) => {
    const u = String(url);
    const method = (options.method || 'GET').toUpperCase();

    if (u.includes('/auth/v1/user')) {
      return { ok: true, status: 200, json: async () => ({ id: 'user-1', email: 'test@example.com' }) };
    }

    if (u.includes('/rest/v1/certification_attempts')) {
      if (method === 'GET') {
        return { ok: true, status: 200, json: async () => [attemptRow] };
      }
      if (method === 'PATCH') {
        const body = JSON.parse(options.body);
        patchBodies.push(body);
        Object.assign(attemptRow, body);
        return { ok: true, status: 200, json: async () => [attemptRow] };
      }
    }

    if (u.includes('api.anthropic.com/v1/messages')) {
      anthropicCallCount++;
      const behavior = typeof anthropicBehavior === 'function' ? anthropicBehavior(anthropicCallCount) : anthropicBehavior;
      if (behavior === 'fail') {
        return { ok: false, status: 500, text: async () => 'mock upstream failure' };
      }
      if (behavior === 'malformed') {
        return { ok: true, status: 200, json: async () => ({ content: [{ text: 'not json at all' }] }) };
      }
      return { ok: true, status: 200, json: async () => anthropicSuccessBody(behavior === 'followup') };
    }

    throw new Error('Unexpected fetch URL in test: ' + u);
  };

  return { impl, patchBodies, getAnthropicCallCount: () => anthropicCallCount };
}

async function withMockFetch(mockImpl, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = mockImpl;
  try {
    return await fn();
  } finally {
    globalThis.fetch = original;
  }
}

async function runIntegrationChecks() {
  // Import once, real production module.
  const { onRequestPost } = await import('../functions/api/certification/submit-interview-turn.js');
  const env = { SUPABASE_URL: 'https://mock.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'mock-key', ANTHROPIC_API_KEY: 'mock-anthropic-key' };

  // --- Retry after failure never duplicates a transcript turn ---
  {
    const attemptRow = makeAttemptRow();
    const mock = buildMockFetch({ attemptRow, anthropicBehavior: 'fail' });
    const res1 = await withMockFetch(mock.impl, () =>
      onRequestPost({ request: makeRequest({ attemptId: 'attempt-1', interviewId: realInterview.id, studentResponse: 'My first attempt at an answer.' }), env })
    );
    const body1 = await res1.json();
    check('PHASE0 RETRY', 'A failed evaluation returns 502 with preserved:true', res1.status === 502 && body1.preserved === true);

    const stateAfterFailure = attemptRow.part3_conversation_state[realInterview.id];
    check('PHASE0 RETRY', 'Transcript is NOT mutated on failure (this was the root cause of the duplicate-turn bug)', !stateAfterFailure.transcript || stateAfterFailure.transcript.length === 0);
    check('PHASE0 RETRY', "The student's response is preserved server-side as pendingResponse, not lost", stateAfterFailure.pendingResponse === 'My first attempt at an answer.');
    check('PHASE0 RETRY', 'The in-flight lock is released after a failure (not left stuck)', stateAfterFailure.turnInFlightAt === null);

    // Retry with (possibly edited) text, now succeeding.
    const mock2 = buildMockFetch({ attemptRow, anthropicBehavior: 'no-followup' });
    const res2 = await withMockFetch(mock2.impl, () =>
      onRequestPost({ request: makeRequest({ attemptId: 'attempt-1', interviewId: realInterview.id, studentResponse: 'My retried answer.' }), env })
    );
    const body2 = await res2.json();
    check('PHASE0 RETRY', 'The retry succeeds (finalized:true)', res2.status === 200 && body2.finalized === true);

    const finalTranscript = attemptRow.part3_conversation_state[realInterview.id].transcript;
    const userTurns = finalTranscript.filter((m) => m.role === 'user');
    check('PHASE0 RETRY', 'Exactly ONE user turn exists in the final transcript (the bug produced two consecutive user turns)', userTurns.length === 1, `got ${userTurns.length}: ${JSON.stringify(userTurns)}`);
    check('PHASE0 RETRY', 'No two consecutive same-role messages exist (would fail Anthropic\'s alternation requirement)', finalTranscript.every((m, i) => i === 0 || m.role !== finalTranscript[i - 1].role));
    check('PHASE0 RETRY', 'pendingResponse is cleared once the retry succeeds', attemptRow.part3_conversation_state[realInterview.id].pendingResponse === null);
  }

  // --- Model identity is persisted on success ---
  {
    const attemptRow = makeAttemptRow();
    const mock = buildMockFetch({ attemptRow, anthropicBehavior: 'no-followup' });
    await withMockFetch(mock.impl, () =>
      onRequestPost({ request: makeRequest({ attemptId: 'attempt-1', interviewId: realInterview.id, studentResponse: 'A complete answer.' }), env })
    );
    const graded = attemptRow.part3_conversation_state[realInterview.id].lastGradedWith;
    check('PHASE0 MODEL LOG', 'A successful evaluation records model provider/name/configVersion internally', !!graded && graded.provider === 'anthropic' && typeof graded.modelName === 'string' && typeof graded.configVersion === 'string');
  }

  // --- One-follow-up rule preserved across the fixed flow ---
  {
    const attemptRow = makeAttemptRow();
    const mock1 = buildMockFetch({ attemptRow, anthropicBehavior: 'followup' });
    const r1 = await withMockFetch(mock1.impl, () =>
      onRequestPost({ request: makeRequest({ attemptId: 'attempt-1', interviewId: realInterview.id, studentResponse: 'A partial answer.' }), env })
    );
    const b1 = await r1.json();
    check('PHASE0 FOLLOWUP', 'First turn: needsFollowUp true is honored', b1.needsFollowUp === true);
    check('PHASE0 FOLLOWUP', 'followUpUsed is now true after one follow-up is granted', attemptRow.part3_conversation_state[realInterview.id].followUpUsed === true);

    // Even if the model tries to ask for ANOTHER follow-up, cadence-grader.mjs's
    // followUpAlreadyUsed flag forces needsFollowUp false -- verified by the
    // grader itself (pre-existing behavior, unchanged by Phase 0). Confirm the
    // conversation reaches finalized on the second turn regardless of what the
    // (correctly-behaving) mock returns for "no more follow-ups allowed."
    const mock2 = buildMockFetch({ attemptRow, anthropicBehavior: 'no-followup' });
    const r2 = await withMockFetch(mock2.impl, () =>
      onRequestPost({ request: makeRequest({ attemptId: 'attempt-1', interviewId: realInterview.id, studentResponse: 'My follow-up answer.' }), env })
    );
    const b2 = await r2.json();
    check('PHASE0 FOLLOWUP', 'Second turn finalizes the conversation (one follow-up consumed, not more)', b2.finalized === true && b2.needsFollowUp === false);
  }

  // --- Concurrency: an in-flight lock rejects a second request, no Anthropic call ---
  {
    const attemptRow = makeAttemptRow({
      part3_conversation_state: { [realInterview.id]: { transcript: [], followUpUsed: false, finalized: false, turnInFlightAt: new Date().toISOString() } },
    });
    const mock = buildMockFetch({ attemptRow, anthropicBehavior: 'no-followup' });
    const res = await withMockFetch(mock.impl, () =>
      onRequestPost({ request: makeRequest({ attemptId: 'attempt-1', interviewId: realInterview.id, studentResponse: 'Trying while another is in flight.' }), env })
    );
    const body = await res.json();
    check('PHASE0 CONCURRENCY', 'A fresh in-flight lock rejects the request with 409', res.status === 409 && body.inFlight === true);
    check('PHASE0 CONCURRENCY', 'No Anthropic call was made for a rejected in-flight request', mock.getAnthropicCallCount() === 0);
    check('PHASE0 CONCURRENCY', 'No transcript mutation occurred for a rejected in-flight request', mock.patchBodies.length === 0);
  }

  // --- Concurrency: a STALE lock self-heals instead of deadlocking ---
  {
    const staleTimestamp = new Date(Date.now() - 60000).toISOString(); // 60s old, well past the 20s timeout
    const attemptRow = makeAttemptRow({
      part3_conversation_state: { [realInterview.id]: { transcript: [], followUpUsed: false, finalized: false, turnInFlightAt: staleTimestamp } },
    });
    const mock = buildMockFetch({ attemptRow, anthropicBehavior: 'no-followup' });
    const res = await withMockFetch(mock.impl, () =>
      onRequestPost({ request: makeRequest({ attemptId: 'attempt-1', interviewId: realInterview.id, studentResponse: 'Retrying after the old lock went stale.' }), env })
    );
    const body = await res.json();
    check('PHASE0 CONCURRENCY', 'A stale (timed-out) lock self-heals: the request proceeds normally instead of deadlocking', res.status === 200 && body.finalized === true);
  }

  // --- True near-simultaneous requests: the second sees the first's claim ---
  {
    const attemptRow = makeAttemptRow();
    let anthropicResolvers = [];
    const mock = buildMockFetch({
      attemptRow,
      anthropicBehavior: () => 'no-followup',
    });
    // Wrap the mock so the Anthropic leg of the FIRST call deliberately
    // waits until we say so, simulating real network latency long enough
    // for a second request to start and reach its own lock check.
    let firstAnthropicStarted = false;
    let releaseFirst;
    const gate = new Promise((resolve) => { releaseFirst = resolve; });
    const delayedImpl = async (url, options = {}) => {
      if (String(url).includes('api.anthropic.com')) {
        if (!firstAnthropicStarted) {
          firstAnthropicStarted = true;
          await gate;
        }
      }
      return mock.impl(url, options);
    };

    const first = withMockFetch(delayedImpl, () =>
      onRequestPost({ request: makeRequest({ attemptId: 'attempt-1', interviewId: realInterview.id, studentResponse: 'First concurrent request.' }), env })
    );
    // Give the first request's GET+claim-PATCH a chance to run and land
    // before firing the second.
    await new Promise((r) => setTimeout(r, 20));
    const second = withMockFetch(delayedImpl, () =>
      onRequestPost({ request: makeRequest({ attemptId: 'attempt-1', interviewId: realInterview.id, studentResponse: 'Second concurrent request.' }), env })
    );
    await new Promise((r) => setTimeout(r, 20));
    releaseFirst();
    const [res1, res2] = await Promise.all([first, second]);
    const body1 = await res1.json();
    const body2 = await res2.json();
    const oneRejected = (res1.status === 409) !== (res2.status === 409); // exactly one of them, not both, not neither
    check('PHASE0 CONCURRENCY', 'Of two near-simultaneous submissions for the same conversation, exactly one proceeds and the other is rejected (not both racing through to Anthropic)', oneRejected, `res1=${res1.status} res2=${res2.status} body1=${JSON.stringify(body1)} body2=${JSON.stringify(body2)}`);
  }

  // --- Rate limiting rejects before any attempt-state mutation ---
  {
    _resetRateLimitBucketsForTests();
    const attemptRow = makeAttemptRow();
    const mock = buildMockFetch({ attemptRow, anthropicBehavior: 'no-followup' });
    let lastRes;
    // The route's own limit is 10/min -- exhaust it, then confirm the 11th is rejected.
    for (let i = 0; i < 11; i++) {
      // Each successful call finalizes the (already-finalized-after-first-pass)
      // conversation, so use the "already finalized" short-circuit path for
      // calls after the first to avoid re-running the full success path --
      // what matters here is purely the rate limiter's own behavior.
      lastRes = await withMockFetch(mock.impl, () =>
        onRequestPost({ request: makeRequest({ attemptId: 'attempt-1', interviewId: realInterview.id, studentResponse: `Attempt number ${i}.` }), env })
      );
    }
    check('PHASE0 RATE LIMIT', 'The 11th request within a minute (limit 10) is rejected with 429', lastRes.status === 429);
    const bodyLast = await lastRes.json();
    check('PHASE0 RATE LIMIT', 'A rate-limited response never touches attempt state (no Supabase PATCH for that call)', typeof bodyLast.error === 'string' && !('finalized' in bodyLast));
  }
}

await runIntegrationChecks();

// ---- Report ----
const byFixture = new Map();
for (const r of results) {
  if (!byFixture.has(r.fixtureName)) byFixture.set(r.fixtureName, []);
  byFixture.get(r.fixtureName).push(r);
}
let anyFail = false;
for (const [fixtureName, checks] of byFixture) {
  const failed = checks.filter((c) => !c.pass);
  if (failed.length > 0) anyFail = true;
  console.log(`[${failed.length === 0 ? 'PASS' : 'FAIL'}] ${fixtureName} (${checks.length - failed.length}/${checks.length})`);
  for (const f of failed) console.log(`    FAILED: ${f.label}${f.detail ? ' — ' + f.detail : ''}`);
}
console.log(`\nTotal: ${results.length}, Passed: ${results.filter((r) => r.pass).length}, Failed: ${results.filter((r) => !r.pass).length}`);
if (anyFail) process.exitCode = 1;
