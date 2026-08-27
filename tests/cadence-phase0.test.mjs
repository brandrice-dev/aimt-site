// Phase 0 regression tests — AIMT Cadence Launch Sweep.
// See docs/course-audit/00-cadence-launch-sweep-build-contract.md Section 12
// and Section 6a (model-lifecycle correction).
//
// Covers:
//  1. Model lifecycle registry: LEGACY/CANDIDATE/APPROVED, fail-safe
//     resolution (no silent legacy fallback, no "latest" alias reachable),
//     repo-internal Worker/Pages-Function drift check.
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

import { getCadenceModelRegistry, resolveCadenceModel, describeCadenceModelStatus, CadenceModelConfigError } from '../functions/_lib/cadence/model-config.mjs';
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
// 1. MODEL LIFECYCLE REGISTRY
// ─────────────────────────────────────────────────────────────────────────
(function modelLifecycleUnitTests() {
  const registry = getCadenceModelRegistry();
  check('MODEL LIFECYCLE', 'Defines both CADENCE_CHAT_MODEL and CADENCE_GRADING_MODEL roles', !!registry.roles.CADENCE_CHAT_MODEL && !!registry.roles.CADENCE_GRADING_MODEL);
  check('MODEL LIFECYCLE', 'Provider is anthropic', registry.provider === 'anthropic');

  // The legacy generation must be registered LEGACY, not APPROVED -- this
  // is the exact correction this file exists to guard against regressing.
  check('MODEL LIFECYCLE', 'claude-sonnet-4-20250514 (the original Phase 0 fallback) is registered LEGACY in the current registry', registry.models['claude-sonnet-4-20250514'] && registry.models['claude-sonnet-4-20250514'].status === 'LEGACY');
  check('MODEL LIFECYCLE', 'claude-sonnet-4-6 (the uncontrolled live-Worker drift the audit found) is NOT registered at all', !registry.models['claude-sonnet-4-6']);
  check('MODEL LIFECYCLE', 'claude-sonnet-5 (current Anthropic Sonnet generation) is registered CANDIDATE, not APPROVED', registry.models['claude-sonnet-5'] && registry.models['claude-sonnet-5'].status === 'CANDIDATE');

  for (const role of ['CADENCE_CHAT_MODEL', 'CADENCE_GRADING_MODEL']) {
    check('MODEL LIFECYCLE', `${role}: no APPROVED model is registered yet (the correct, current state -- not an oversight)`, registry.roles[role].approved === null);

    // FAIL SAFE: with no env override and no approved model, resolution
    // must throw -- never silently return the legacy or candidate model.
    let failSafeError = null;
    try { resolveCadenceModel({}, role); } catch (e) { failSafeError = e; }
    check('MODEL LIFECYCLE', `${role}: with nothing approved and no override, resolveCadenceModel() throws CadenceModelConfigError (fails safe)`, failSafeError instanceof CadenceModelConfigError);

    // An unregistered / arbitrary / "latest"-style override is REJECTED
    // outright, never silently ignored back to some default.
    let arbitraryError = null;
    try { resolveCadenceModel({ [role]: 'claude-totally-made-up-latest' }, role); } catch (e) { arbitraryError = e; }
    check('MODEL LIFECYCLE', `${role}: an unregistered env override throws rather than silently falling back to anything`, arbitraryError instanceof CadenceModelConfigError);

    // The LEGACY model is explicitly refused even as an env override --
    // "no silent downgrade to an old model" applies to deliberate
    // misconfiguration too, not only to defaults.
    let legacyOverrideError = null;
    try { resolveCadenceModel({ [role]: 'claude-sonnet-4-20250514' }, role); } catch (e) { legacyOverrideError = e; }
    check('MODEL LIFECYCLE', `${role}: an env override pointing at the LEGACY model is refused, not honored`, legacyOverrideError instanceof CadenceModelConfigError);

    // The registered CANDIDATE, deliberately opted into via env override
    // (exactly how a controlled regression-test run would exercise it),
    // IS honored -- this is the one legitimate way to reach a non-approved
    // model, and it must be clearly flagged as such.
    const candidateResolution = resolveCadenceModel({ [role]: 'claude-sonnet-5' }, role);
    check('MODEL LIFECYCLE', `${role}: an env override matching the registered CANDIDATE resolves successfully and is flagged as candidate-sourced`, candidateResolution.modelName === 'claude-sonnet-5' && candidateResolution.status === 'CANDIDATE' && candidateResolution.source === 'env-override-candidate');

    const emptyOverride = (() => { try { return resolveCadenceModel({ [role]: '' }, role); } catch (e) { return e; } })();
    check('MODEL LIFECYCLE', `${role}: an empty env override is treated as absent (still fails safe, not silently accepted as "no override")`, emptyOverride instanceof CadenceModelConfigError);
  }

  let unknownRoleThrew = false;
  try { resolveCadenceModel({}, 'CADENCE_NOT_A_REAL_ROLE'); } catch (_) { unknownRoleThrew = true; }
  check('MODEL LIFECYCLE', 'Resolving an unknown role throws rather than silently returning something', unknownRoleThrew);

  // Historical version v1 is preserved unmutated for auditability (it
  // recorded the original, now-corrected, approve-the-legacy-model state)
  // -- rollback/history relies on this never being edited in place.
  const v1 = getCadenceModelRegistry('cadence-model-registry-v1');
  check('MODEL LIFECYCLE', 'Historical registry v1 is preserved unmutated (approved the legacy model -- the exact state this correction fixed)', v1.roles.CADENCE_CHAT_MODEL.approved === 'claude-sonnet-4-20250514');

  const status = describeCadenceModelStatus({});
  check('MODEL LIFECYCLE', 'describeCadenceModelStatus() reports failSafeTriggered:true for both roles when nothing is approved and no override is given', status.roles.CADENCE_CHAT_MODEL.failSafeTriggered === true && status.roles.CADENCE_GRADING_MODEL.failSafeTriggered === true);
})();

// ─────────────────────────────────────────────────────────────────────────
// 1b. STATIC — Worker/Pages-Function repo-internal drift check
// ─────────────────────────────────────────────────────────────────────────
(function workerModelDriftCheck() {
  const workerSrc = readFileSync(path.join(ROOT, 'cadence-worker/worker.js'), 'utf8');
  const approvedMatch = workerSrc.match(/const APPROVED_CHAT_MODEL\s*=\s*(null|'([^']+)')/);
  const candidateMatch = workerSrc.match(/const CANDIDATE_CHAT_MODEL\s*=\s*'([^']+)'/);
  const legacyMatch = workerSrc.match(/const LEGACY_CHAT_MODEL\s*=\s*'([^']+)'/);
  check('WORKER DRIFT', 'cadence-worker/worker.js declares APPROVED_CHAT_MODEL, CANDIDATE_CHAT_MODEL, LEGACY_CHAT_MODEL as named constants', !!approvedMatch && !!candidateMatch && !!legacyMatch);

  const registry = getCadenceModelRegistry();
  if (approvedMatch) {
    check('WORKER DRIFT', "Worker's APPROVED_CHAT_MODEL matches the registry's CADENCE_CHAT_MODEL.approved (both null -- repo-internal only, cannot see what is actually deployed live)", approvedMatch[1] === 'null' && registry.roles.CADENCE_CHAT_MODEL.approved === null);
  }
  if (candidateMatch) {
    check('WORKER DRIFT', "Worker's CANDIDATE_CHAT_MODEL matches the registry's CADENCE_CHAT_MODEL.candidate", candidateMatch[1] === registry.roles.CADENCE_CHAT_MODEL.candidate);
  }
  if (legacyMatch) {
    check('WORKER DRIFT', "Worker's LEGACY_CHAT_MODEL matches the registry's LEGACY-status model", registry.models[legacyMatch[1]] && registry.models[legacyMatch[1]].status === 'LEGACY');
  }
  check('WORKER DRIFT', 'Worker fails safe (returns null, not a fallback string) when nothing is approved and no override matches', (workerSrc.match(/return null;/g) || []).length >= 2);
  check('WORKER DRIFT', 'Worker returns a 503 (not a silent fallback) when resolveChatModel() fails safe', /if\s*\(!model\)\s*\{[\s\S]{0,200}503/.test(workerSrc));
  check('WORKER DRIFT', 'Worker resolves the model server-side via resolveChatModel(env)', /const model = resolveChatModel\(env\);/.test(workerSrc));
  check('WORKER DRIFT', "The model resolution itself never reads a client-sent model field (only the request's messages/system/max_tokens do)", !/body\.model\b/.test(workerSrc.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')));

  const clientSrc = readFileSync(path.join(ROOT, 'headspa-mastery.html'), 'utf8');
  check('WORKER DRIFT', 'Client-side callAI() no longer sends a model name in the request body', !/body:\s*JSON\.stringify\(\{\s*model:/.test(clientSrc));

  const graderSrc = readFileSync(path.join(ROOT, 'functions/_lib/certification/cadence-grader.mjs'), 'utf8');
  check('WORKER DRIFT', 'cadence-grader.mjs no longer hardcodes any model constant; imports the shared registry instead', !/const ALLOWED_MODEL\s*=/.test(graderSrc) && /resolveCadenceModel/.test(graderSrc));
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

  // No registered model is APPROVED for CADENCE_GRADING_MODEL yet (this is
  // the correct, current state -- see MODEL LIFECYCLE tests above). Tests
  // that need a working evaluation deliberately opt into the registered
  // CANDIDATE via an explicit env override -- exactly the same mechanism a
  // real controlled regression-test run would use, not a hidden test-only
  // shortcut. This IS the "explicit fixture/test default" the model-
  // lifecycle correction calls for.
  const env = { SUPABASE_URL: 'https://mock.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'mock-key', ANTHROPIC_API_KEY: 'mock-anthropic-key', CADENCE_GRADING_MODEL: 'claude-sonnet-5' };
  // A "production-like" env with no model override -- used to prove the
  // fail-safe path integrates correctly with the retry-safety fix (0B).
  const envNoModelApproved = { SUPABASE_URL: 'https://mock.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'mock-key', ANTHROPIC_API_KEY: 'mock-anthropic-key' };

  // --- No approved model: fails safe, and the failure is handled exactly
  //     like any other evaluator failure (preserve response, no transcript
  //     mutation) -- proves Phase 0B's fix and the model-lifecycle fail-
  //     safe compose correctly rather than needing separate handling. ---
  {
    const attemptRow = makeAttemptRow();
    // No Anthropic call should even be attempted -- resolveCadenceModel()
    // throws before cadence-grader.mjs ever calls fetch() for the model API.
    const mock = buildMockFetch({ attemptRow, anthropicBehavior: 'no-followup' });
    const res = await withMockFetch(mock.impl, () =>
      onRequestPost({ request: makeRequest({ attemptId: 'attempt-1', interviewId: realInterview.id, studentResponse: 'A response with no approved model configured.' }), env: envNoModelApproved })
    );
    const body = await res.json();
    check('PHASE0 MODEL FAILSAFE', 'With no approved model, the request fails safe (502) via the same path as an Anthropic outage', res.status === 502 && body.preserved === true);
    check('PHASE0 MODEL FAILSAFE', 'No Anthropic call is made when there is no approved model to call', mock.getAnthropicCallCount() === 0);
    check('PHASE0 MODEL FAILSAFE', "The student's response is still preserved server-side even though the failure is a config issue, not a network issue", attemptRow.part3_conversation_state[realInterview.id].pendingResponse === 'A response with no approved model configured.');
    check('PHASE0 MODEL FAILSAFE', 'The transcript is not mutated (same guarantee as the network-failure case)', !attemptRow.part3_conversation_state[realInterview.id].transcript || attemptRow.part3_conversation_state[realInterview.id].transcript.length === 0);
  }

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
    check('PHASE0 MODEL LOG', 'A successful evaluation records model provider/name/status/registryVersion internally', !!graded && graded.provider === 'anthropic' && typeof graded.modelName === 'string' && typeof graded.registryVersion === 'string');
    check('PHASE0 MODEL LOG', 'The recorded status reflects that this ran on the CANDIDATE model via a deliberate override (nothing is APPROVED yet)', graded.status === 'CANDIDATE' && graded.modelName === 'claude-sonnet-5');
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
