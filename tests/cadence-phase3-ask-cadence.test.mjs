// Phase 3 regression tests — AIMT Cadence Launch Sweep (Sonnet 5
// validation + Ask Cadence shared-shell integration).
// See docs/course-audit/00-cadence-launch-sweep-build-contract.md and the
// Phase 3 task prompt (Sections 16-38).
//
// Covers:
//  1. functions/_lib/cadence/ask-cadence.mjs — guardrail text, server-
//     VERIFIED checkpoint status (never trusts a client claim), Module 12
//     exam-integrity check, and the model call using the same
//     CADENCE_CHAT_MODEL fail-safe role as everything else.
//  2. functions/api/cadence/ask.js — the real endpoint, mocked transport:
//     mode=ask_cadence persistence, no grader ever invoked, checkpoint/
//     course_progress state never touched, idempotent replay, retry-
//     preserves-message-on-failure, rate limiting, Module 12 active-
//     assessment block, active-checkpoint guardrail injection.
//  3. Static structural checks: cadence-shell.js exposes openAskCadence
//     and never calls commitCheckpointPass/Revise from the ask_cadence
//     path; headspa-mastery.html's pill opens the shared shell (not the
//     old #guidePanel) and hides during Module 12; the regression dataset
//     is not shipped to the browser bundle.
//  4. Model regression harness/dataset sanity: all 22 checkpoints resolve,
//     dataset size in the "roughly 60-90" range, safety-critical coverage
//     non-empty, CADENCE_CHAT_MODEL/CADENCE_GRADING_MODEL both have a
//     registered CANDIDATE (not silently APPROVED) per the locked
//     lifecycle rule.
//
// Run: node tests/cadence-phase3-ask-cadence.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { getVerifiedCheckpointStatus, isModule12AssessmentActive, buildActiveCheckpointGuardrail, askCadenceServerSide, ASK_CADENCE_BASE_GUARDRAIL } from '../functions/_lib/cadence/ask-cadence.mjs';
import { CadenceModelConfigError } from '../functions/_lib/cadence/model-config.mjs';
import { _resetRateLimitBucketsForTests } from '../functions/_lib/cadence/rate-limit.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
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

// ─────────────────────────────────────────────────────────────────────────
// Shared mock transport (Supabase REST + Anthropic), reusing the exact
// store/URL-matching shape tests/cadence-thread-api.test.mjs already
// established for cadence_threads/cadence_messages.
// ─────────────────────────────────────────────────────────────────────────

function buildMockEnv() {
  return { SUPABASE_URL: 'https://mock.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'mock-key', ANTHROPIC_API_KEY: 'mock-anthropic-key', CADENCE_CHAT_MODEL: 'claude-sonnet-5' };
}

function buildFullMockFetch({ threadsStore, messagesStore, courseProgressStore, certificationAttemptsStore, entitled = true, anthropicReplyText = 'A helpful, curriculum-grounded reply.', capture = {} }) {
  return async (url, options = {}) => {
    const u = String(url);
    const method = (options.method || 'GET').toUpperCase();

    if (u.includes('/auth/v1/user')) {
      return { ok: true, status: 200, json: async () => ({ id: 'user-1', email: 'test@example.com' }) };
    }
    if (u.includes('/rest/v1/course_entitlements')) {
      return { ok: true, status: 200, json: async () => (entitled ? [{ checkout_session_id: 'cs_1' }] : []) };
    }
    if (u.includes('/rest/v1/course_progress')) {
      return { ok: true, status: 200, json: async () => courseProgressStore || [] };
    }
    if (u.includes('/rest/v1/certification_attempts')) {
      return { ok: true, status: 200, json: async () => certificationAttemptsStore || [] };
    }
    if (u.includes('/rest/v1/cadence_threads')) {
      if (method === 'GET') {
        const userMatch = u.match(/user_id=eq\.([^&]+)/);
        const moduleMatch = u.match(/module_id=eq\.([^&]+)/);
        const rows = threadsStore.filter((t) => (!userMatch || t.user_id === decodeURIComponent(userMatch[1])) && (!moduleMatch || t.module_id === decodeURIComponent(moduleMatch[1])));
        return { ok: true, status: 200, json: async () => rows };
      }
      if (method === 'POST') {
        const body = JSON.parse(options.body);
        const dup = threadsStore.find((t) => t.user_id === body.user_id && t.course_slug === body.course_slug && t.module_id === body.module_id);
        if (dup) return { ok: false, status: 409, json: async () => ({}) };
        const row = { id: 'thread-' + (threadsStore.length + 1), created_at: 'x', updated_at: 'x', ...body };
        threadsStore.push(row);
        return { ok: true, status: 201, json: async () => [row] };
      }
    }
    if (u.includes('/rest/v1/cadence_messages')) {
      if (method === 'GET') {
        const threadMatch = u.match(/thread_id=eq\.([^&]+)/);
        const idemMatch = u.match(/idempotency_key=eq\.([^&]+)/);
        let rows = messagesStore;
        if (threadMatch) rows = rows.filter((m) => m.thread_id === decodeURIComponent(threadMatch[1]));
        if (idemMatch) rows = rows.filter((m) => m.idempotency_key === decodeURIComponent(idemMatch[1]));
        if (u.includes('order=created_at.asc')) rows = rows.slice().sort((a, b) => a.created_at.localeCompare(b.created_at));
        return { ok: true, status: 200, json: async () => rows };
      }
      if (method === 'POST') {
        const body = JSON.parse(options.body);
        if (body.idempotency_key) {
          const dup = messagesStore.find((m) => m.thread_id === body.thread_id && m.idempotency_key === body.idempotency_key);
          if (dup) return { ok: false, status: 409, json: async () => ({}) };
        }
        const row = { id: 'msg-' + (messagesStore.length + 1), created_at: new Date(Date.now() + messagesStore.length).toISOString(), ...body };
        messagesStore.push(row);
        return { ok: true, status: 201, json: async () => [row] };
      }
    }
    if (u.includes('api.anthropic.com/v1/messages')) {
      capture.lastAnthropicBody = JSON.parse(options.body);
      if (capture.forceAnthropicError) return { ok: false, status: 502, text: async () => 'upstream error' };
      return { ok: true, status: 200, json: async () => ({ content: [{ text: anthropicReplyText }] }) };
    }
    throw new Error('Unexpected fetch URL in test: ' + u);
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 1. ask-cadence.mjs — unit tests
// ─────────────────────────────────────────────────────────────────────────
async function runLibChecks() {
  const env = buildMockEnv();

  // getVerifiedCheckpointStatus — server truth, never a client claim
  {
    const courseProgressStore = [{ state: { progress: { '4': { checkpointMeta: { m4cp1: { status: 'passed' } } } } } }];
    const mock = buildFullMockFetch({ threadsStore: [], messagesStore: [], courseProgressStore });
    const passed = await withMockFetch(mock, () => getVerifiedCheckpointStatus(env, 'user-1', 4, 'm4cp1'));
    const unresolved = await withMockFetch(mock, () => getVerifiedCheckpointStatus(env, 'user-1', 4, 'm4cp2'));
    check('VERIFIED CHECKPOINT STATUS', 'A checkpoint stored as passed in course_progress resolves to "passed"', passed === 'passed');
    check('VERIFIED CHECKPOINT STATUS', 'A checkpoint with no stored meta resolves to "unresolved" (never assumed passed)', unresolved === 'unresolved');

    const noRowMock = buildFullMockFetch({ threadsStore: [], messagesStore: [], courseProgressStore: [] });
    const noRow = await withMockFetch(noRowMock, () => getVerifiedCheckpointStatus(env, 'user-1', 4, 'm4cp1'));
    check('VERIFIED CHECKPOINT STATUS', 'No course_progress row at all resolves to "unknown", not "passed"', noRow === 'unknown');
  }

  // isModule12AssessmentActive
  {
    const scoredMock = buildFullMockFetch({ threadsStore: [], messagesStore: [], certificationAttemptsStore: [{ attempt_number: 1, certification_decision: 'pass', critical_domain_results: [], status: 'scored' }] });
    const active = await withMockFetch(scoredMock, () => isModule12AssessmentActive(env, 'user-1'));
    check('MODULE 12 ACTIVE CHECK', 'A finalized (scored) attempt is NOT considered active', active === false);

    const inProgressMock = buildFullMockFetch({ threadsStore: [], messagesStore: [], certificationAttemptsStore: [{ attempt_number: 1, certification_decision: null, critical_domain_results: [], status: 'part2_locked' }] });
    const active2 = await withMockFetch(inProgressMock, () => isModule12AssessmentActive(env, 'user-1'));
    check('MODULE 12 ACTIVE CHECK', 'A mid-assessment attempt (not yet scored) IS considered active', active2 === true);

    const noAttemptsMock = buildFullMockFetch({ threadsStore: [], messagesStore: [], certificationAttemptsStore: [] });
    const active3 = await withMockFetch(noAttemptsMock, () => isModule12AssessmentActive(env, 'user-1'));
    check('MODULE 12 ACTIVE CHECK', 'No attempts at all is NOT considered active', active3 === false);
  }

  // askCadenceServerSide — guardrail composition + fail-safe model resolution
  {
    const capture = {};
    const mock = buildFullMockFetch({ threadsStore: [], messagesStore: [], capture, anthropicReplyText: 'Here is a grounded answer.' });
    const result = await withMockFetch(mock, () => askCadenceServerSide(env, { guideSystemPrompt: 'MODULE GUIDE TEXT', boundedContext: [], studentMessage: 'Why does this matter?', activeCheckpointGuardrailText: buildActiveCheckpointGuardrail('m4cp1') }));
    check('ASK CADENCE MODEL CALL', 'Returns the model reply text', result.text === 'Here is a grounded answer.');
    check('ASK CADENCE MODEL CALL', 'System prompt includes the module guide text', capture.lastAnthropicBody.system.includes('MODULE GUIDE TEXT'));
    check('ASK CADENCE MODEL CALL', 'System prompt always includes the base non-graded/no-leakage guardrail', capture.lastAnthropicBody.system.includes(ASK_CADENCE_BASE_GUARDRAIL));
    check('ASK CADENCE MODEL CALL', 'System prompt includes the specific active-checkpoint guardrail when supplied', capture.lastAnthropicBody.system.includes('m4cp1'));
    check('ASK CADENCE MODEL CALL', 'Resolves through the CANDIDATE override, same fail-safe registry every other Cadence call site uses', capture.lastAnthropicBody.model === 'claude-sonnet-5');

    await withMockFetch(mock, () => askCadenceServerSide(env, { guideSystemPrompt: 'MODULE GUIDE TEXT', boundedContext: [], studentMessage: 'hi' }));
    check('ASK CADENCE MODEL CALL', 'No active-checkpoint guardrail text is added when none is supplied', !capture.lastAnthropicBody.system.includes('unresolved required checkpoint'));
  }

  // Fail-safe: no APPROVED model and no override -> throws, never silently runs
  {
    const envNoOverride = { SUPABASE_URL: 'x', SUPABASE_SERVICE_ROLE_KEY: 'x', ANTHROPIC_API_KEY: 'x' };
    let threw = false;
    try {
      await askCadenceServerSide(envNoOverride, { guideSystemPrompt: 'x', boundedContext: [], studentMessage: 'hi' });
    } catch (e) {
      threw = e instanceof CadenceModelConfigError;
    }
    check('ASK CADENCE FAIL-SAFE', 'With no APPROVED model and no override, Ask Cadence fails safe (throws) rather than silently running on a LEGACY model', threw);
  }
}

await runLibChecks();

// ─────────────────────────────────────────────────────────────────────────
// 2. functions/api/cadence/ask.js — real endpoint, mocked transport
// ─────────────────────────────────────────────────────────────────────────

function makePostRequest(body, authToken = 'mock-token') {
  return {
    headers: { get: (name) => (name === 'Authorization' ? `Bearer ${authToken}` : null) },
    json: async () => body,
  };
}

async function runEndpointChecks() {
  const { onRequestPost } = await import('../functions/api/cadence/ask.js');
  const env = buildMockEnv();
  // Rate-limit buckets are module-level in-memory state shared across every
  // call in this process (same pattern cadence-worker/worker.js's own
  // rateLimited() uses) -- reset before this file's checks start so an
  // earlier test file run in the same process can never bleed in.
  _resetRateLimitBucketsForTests();

  // Happy path
  {
    const threadsStore = [];
    const messagesStore = [];
    const mock = buildFullMockFetch({ threadsStore, messagesStore, anthropicReplyText: 'Great question — here is the idea.' });
    const res = await withMockFetch(mock, () => onRequestPost({ request: makePostRequest({ moduleId: 3, message: 'Why delayed shedding?', requestId: 'req-1', guideSystemPrompt: 'GUIDE TEXT' }), env }));
    const body = await res.json();
    check('ASK ENDPOINT', 'Happy path returns 200 with the reply', res.status === 200 && body.reply === 'Great question — here is the idea.');
    check('ASK ENDPOINT', 'Exactly two messages persisted (user + assistant)', messagesStore.length === 2);
    check('ASK ENDPOINT', 'Both messages are tagged mode=ask_cadence', messagesStore.every((m) => m.mode === 'ask_cadence'));
    check('ASK ENDPOINT', 'No message carries a checkpoint_id (this is not a checkpoint submission)', messagesStore.every((m) => !m.checkpoint_id));
    check('ASK ENDPOINT', 'The thread is scoped to the requested module', threadsStore.length === 1 && threadsStore[0].module_id === '3');
  }

  // No grader ever invoked / no checkpoint state touched — static import
  // check. Matches actual `import ... from '...'` statements only, not
  // mere prose mentions of the filename in a header comment (both files'
  // own docstrings legitimately explain the boundary by name).
  {
    const askSrc = readFileSync(path.join(ROOT, 'functions/api/cadence/ask.js'), 'utf8');
    const libSrc = readFileSync(path.join(ROOT, 'functions/_lib/cadence/ask-cadence.mjs'), 'utf8');
    const importsFrom = (src, needle) => new RegExp(`from ['"][^'"]*${needle}['"]`).test(src);
    check('ASK ENDPOINT', 'ask.js never imports checkpoint-evaluation.mjs (no grader call path exists here at all)', !importsFrom(askSrc, 'checkpoint-evaluation'));
    check('ASK ENDPOINT', 'ask-cadence.mjs never imports checkpoint-evaluation.mjs', !importsFrom(libSrc, 'checkpoint-evaluation'));
    // ask-cadence.mjs legitimately READS course_progress (server-verified
    // guardrail lookup) -- the invariant that matters is that neither file
    // ever WRITES to it (checkpoint pass/fail stays exclusively the
    // checkpoint path's job). supabaseRest() is only ever a write here if
    // called with an explicit POST/PATCH method.
    const writesToCourseProgress = (src) => /supabaseRest\(env,\s*`?course_progress[\s\S]{0,200}method:\s*['"](POST|PATCH)['"]/.test(src);
    check('ASK ENDPOINT', 'Neither ask.js nor ask-cadence.mjs ever WRITES to course_progress', !writesToCourseProgress(askSrc) && !writesToCourseProgress(libSrc));
  }

  // Idempotent replay
  {
    const threadsStore = [];
    const messagesStore = [];
    const mock = buildFullMockFetch({ threadsStore, messagesStore, anthropicReplyText: 'First reply.' });
    const reqBody = { moduleId: 5, message: 'hello', requestId: 'stable-req', guideSystemPrompt: 'GUIDE TEXT' };
    const res1 = await withMockFetch(mock, () => onRequestPost({ request: makePostRequest(reqBody), env }));
    const body1 = await res1.json();
    const res2 = await withMockFetch(mock, () => onRequestPost({ request: makePostRequest(reqBody), env }));
    const body2 = await res2.json();
    check('ASK ENDPOINT IDEMPOTENCY', 'A retry with the same requestId returns the cached reply, replayed=true', body2.replayed === true && body2.reply === body1.reply);
    check('ASK ENDPOINT IDEMPOTENCY', 'No duplicate messages were written on the retry', messagesStore.length === 2);
  }

  // Retry after provider failure preserves the student message, no assistant message written
  {
    const threadsStore = [];
    const messagesStore = [];
    const capture = { forceAnthropicError: true };
    const mock = buildFullMockFetch({ threadsStore, messagesStore, capture });
    const res = await withMockFetch(mock, () => onRequestPost({ request: makePostRequest({ moduleId: 6, message: 'a question', requestId: 'req-fail', guideSystemPrompt: 'GUIDE TEXT' }), env }));
    check('ASK ENDPOINT RETRY-SAFE', 'A provider failure returns 502 with preserved:true', res.status === 502);
    check('ASK ENDPOINT RETRY-SAFE', "The student's message is durably saved even though the model call failed", messagesStore.length === 1 && messagesStore[0].role === 'user');

    capture.forceAnthropicError = false;
    const res2 = await withMockFetch(mock, () => onRequestPost({ request: makePostRequest({ moduleId: 6, message: 'a question', requestId: 'req-fail', guideSystemPrompt: 'GUIDE TEXT' }), env }));
    const body2 = await res2.json();
    check('ASK ENDPOINT RETRY-SAFE', 'Retrying the same requestId after recovery succeeds and does not duplicate the student message', res2.status === 200 && !!body2.reply && messagesStore.filter((m) => m.role === 'user').length === 1);
  }

  // Rate limiting
  {
    const threadsStore = [];
    const messagesStore = [];
    const mock = buildFullMockFetch({ threadsStore, messagesStore });
    let lastStatus = 200;
    for (let i = 0; i < 13; i++) {
      const res = await withMockFetch(mock, () => onRequestPost({ request: makePostRequest({ moduleId: 2, message: 'q' + i, requestId: 'rl-req-' + i, guideSystemPrompt: 'GUIDE TEXT' }), env }));
      lastStatus = res.status;
    }
    check('ASK ENDPOINT RATE LIMIT', 'The 13th request within a minute (limit 12/min) is rate-limited (429)', lastStatus === 429);
    _resetRateLimitBucketsForTests(); // don't let this test's exhausted bucket bleed into the checks below
  }

  // Module 12 exam-integrity guard
  {
    const threadsStore = [];
    const messagesStore = [];
    const certificationAttemptsStore = [{ attempt_number: 1, certification_decision: null, critical_domain_results: [], status: 'part1_locked' }];
    const mock = buildFullMockFetch({ threadsStore, messagesStore, certificationAttemptsStore });
    const res = await withMockFetch(mock, () => onRequestPost({ request: makePostRequest({ moduleId: 12, message: 'help with the exam', requestId: 'm12-req', guideSystemPrompt: 'GUIDE TEXT' }), env }));
    check('MODULE 12 EXAM INTEGRITY', 'Ask Cadence is refused (403) while a certification attempt is mid-assessment', res.status === 403);
    check('MODULE 12 EXAM INTEGRITY', 'No thread/message was created for the blocked request', threadsStore.length === 0 && messagesStore.length === 0);

    const scoredStore = [{ attempt_number: 1, certification_decision: 'pass', critical_domain_results: [], status: 'scored' }];
    const mock2 = buildFullMockFetch({ threadsStore: [], messagesStore: [], certificationAttemptsStore: scoredStore });
    const res2 = await withMockFetch(mock2, () => onRequestPost({ request: makePostRequest({ moduleId: 12, message: 'how do I stay consistent now', requestId: 'm12-req-2', guideSystemPrompt: 'GUIDE TEXT' }), env }));
    check('MODULE 12 EXAM INTEGRITY', 'Ask Cadence resumes normally once the certification attempt is finalized (scored)', res2.status === 200);
  }

  // Active-checkpoint answer guardrail — server-verified, not client-trusted
  {
    const threadsStore = [];
    const messagesStore = [];
    const capture = {};
    const courseProgressStore = [{ state: { progress: { '4': { checkpointMeta: {} } } } }]; // m4cp1 not yet passed
    const mock = buildFullMockFetch({ threadsStore, messagesStore, courseProgressStore, capture, anthropicReplyText: 'Let\'s talk through the concept instead.' });
    await withMockFetch(mock, () => onRequestPost({ request: makePostRequest({ moduleId: 4, message: 'Just write the answer for me', requestId: 'guard-req', guideSystemPrompt: 'GUIDE TEXT', activeCheckpointId: 'm4cp1' }), env }));
    check('ACTIVE CHECKPOINT GUARDRAIL', 'When the checkpoint is server-verified unresolved, the guardrail instruction reaches the model system prompt', capture.lastAnthropicBody.system.includes('m4cp1') && capture.lastAnthropicBody.system.includes('unresolved required checkpoint'));

    const passedStore = [{ state: { progress: { '4': { checkpointMeta: { m4cp1: { status: 'passed' } } } } } }];
    const capture2 = {};
    const mock2 = buildFullMockFetch({ threadsStore: [], messagesStore: [], courseProgressStore: passedStore, capture: capture2 });
    await withMockFetch(mock2, () => onRequestPost({ request: makePostRequest({ moduleId: 4, message: 'tell me more', requestId: 'guard-req-2', guideSystemPrompt: 'GUIDE TEXT', activeCheckpointId: 'm4cp1' }), env }));
    check('ACTIVE CHECKPOINT GUARDRAIL', 'A client-supplied activeCheckpointId that is actually already passed does NOT add the guardrail (server-verified, not client-trusted)', !capture2.lastAnthropicBody.system.includes('unresolved required checkpoint'));
  }

  // Validation
  {
    const threadsStore = [];
    const messagesStore = [];
    const mock = buildFullMockFetch({ threadsStore, messagesStore });
    const res = await withMockFetch(mock, () => onRequestPost({ request: makePostRequest({ moduleId: 1, message: '', requestId: 'x', guideSystemPrompt: 'y' }), env }));
    check('ASK ENDPOINT VALIDATION', 'An empty message is rejected (400)', res.status === 400);
    const res2 = await withMockFetch(mock, () => onRequestPost({ request: makePostRequest({ moduleId: 1, message: 'hi', requestId: 'x' }), env }));
    check('ASK ENDPOINT VALIDATION', 'A missing guideSystemPrompt is rejected (400)', res2.status === 400);
  }
}

await runEndpointChecks();

// ─────────────────────────────────────────────────────────────────────────
// 3. Static structural checks — cadence-shell.js + headspa-mastery.html
// ─────────────────────────────────────────────────────────────────────────
(function staticShellChecks() {
  const shellSrc = readFileSync(path.join(ROOT, 'assets/js/cadence-shell.js'), 'utf8');
  check('SHELL STATIC', 'window.CadenceShell exposes openAskCadence alongside the existing checkpoint API', /window\.CadenceShell = \{ openCheckpoint, wireCheckpoint, openAskCadence \}/.test(shellSrc));
  check('SHELL STATIC', 'openAskCadence sets mode: \'ask_cadence\' on the session', /mode: 'ask_cadence'/.test(shellSrc));

  // The ask_cadence send path (sendAskCadenceMessage) must never call the
  // checkpoint-authority commit functions -- extract just that function
  // body and confirm neither commit function appears inside it.
  const fnMatch = shellSrc.match(/async function sendAskCadenceMessage\([\s\S]*?\n  \}/);
  check('SHELL STATIC', 'sendAskCadenceMessage() function found for isolation check', !!fnMatch);
  if (fnMatch) {
    check('SHELL STATIC', 'sendAskCadenceMessage() never calls commitCheckpointPass', !fnMatch[0].includes('commitCheckpointPass'));
    check('SHELL STATIC', 'sendAskCadenceMessage() never calls commitCheckpointRevise', !fnMatch[0].includes('commitCheckpointRevise'));
    check('SHELL STATIC', 'sendAskCadenceMessage() posts to the ask endpoint, not evaluate-checkpoint', fnMatch[0].includes('/api/cadence/ask') && !fnMatch[0].includes('evaluate-checkpoint'));
  }

  check('SHELL STATIC', 'Ask Cadence Review Mode fixtures never call the live network path except the explicit "live" fixture', /if \(key === 'live'\)/.test(shellSrc));
})();

(function staticPageChecks() {
  const html = readFileSync(path.join(ROOT, 'headspa-mastery.html'), 'utf8');
  const toggleGuideMatch = html.match(/function toggleGuide\(\) \{[\s\S]*?\n\}/);
  check('PILL STATIC', 'toggleGuide() function found', !!toggleGuideMatch);
  if (toggleGuideMatch) {
    check('PILL STATIC', 'The bottom pill now opens the shared Cadence shell (openAskCadence), not the old #guidePanel', toggleGuideMatch[0].includes('window.CadenceShell.openAskCadence'));
    check('PILL STATIC', 'toggleGuide() no longer toggles the legacy #guidePanel .open class', !toggleGuideMatch[0].includes("getElementById('guidePanel')"));
    check('PILL STATIC', 'The pill passes the real module-aware guide system prompt (getGuideSystem())', toggleGuideMatch[0].includes('getGuideSystem()'));
    check('PILL STATIC', 'returnFocusEl is NOT the pill itself (would reopen-loop) -- uses a safe non-reopening target', !/returnFocusEl: document\.getElementById\('guideBtn'\)/.test(toggleGuideMatch[0]));
  }

  check('PILL STATIC', 'The Cadence pill is hidden for the entire Module 12 view (defense-in-depth on top of the server-side exam-integrity guard)', /guideBtn'\)\.classList\.toggle\('visible', String\(id\) !== '12'\)/.test(html));

  check('SCOPE GUARD', 'Model regression datasets are not referenced anywhere in the shipped page (scripts/ tooling only, never bundled to students)', !html.includes('cadence-model-regression'));
})();

// ─────────────────────────────────────────────────────────────────────────
// 4. Model regression dataset/harness sanity
// ─────────────────────────────────────────────────────────────────────────
async function runDatasetChecks() {
  const { GRADING_DATASET } = await import('../scripts/cadence-model-regression/grading-dataset.mjs');
  const { CHAT_DATASET } = await import('../scripts/cadence-model-regression/chat-dataset.mjs');
  const { loadCheckpointRubrics } = await import('../scripts/cadence-model-regression/load-checkpoint-rubrics.mjs');
  const { CHECKPOINT_MAP, resolveCheckpointDefinition } = await import('../scripts/cadence-model-regression/checkpoint-map.mjs');
  const { getCadenceModelRegistry } = await import('../functions/_lib/cadence/model-config.mjs');

  check('REGRESSION DATASET', 'Grading dataset size is in the requested "roughly 60-90" range', GRADING_DATASET.length >= 60 && GRADING_DATASET.length <= 90, `actual: ${GRADING_DATASET.length}`);
  check('REGRESSION DATASET', 'At least one safety-critical (expectUnsafeFlag) case exists', GRADING_DATASET.some((c) => c.expectUnsafeFlag === true));
  check('REGRESSION DATASET', 'Every one of the 22 real checkpoints is covered by at least one grading case', CHECKPOINT_MAP.every((entry) => GRADING_DATASET.some((c) => c.checkpointId === entry.checkpointId)));
  check('REGRESSION DATASET', 'Chat dataset has a reasonable number of representative cases', CHAT_DATASET.length >= 10 && CHAT_DATASET.length <= 20, `actual: ${CHAT_DATASET.length}`);

  const rubrics = loadCheckpointRubrics();
  let allResolve = true;
  for (const c of GRADING_DATASET) {
    try { resolveCheckpointDefinition(rubrics, c.checkpointId); } catch (_) { allResolve = false; }
  }
  check('REGRESSION DATASET', 'Every grading case resolves against the real, unmodified rubric text in headspa-mastery.html', allResolve);

  const registry = getCadenceModelRegistry();
  check('MODEL REGISTRY', 'CADENCE_CHAT_MODEL has a registered CANDIDATE (claude-sonnet-5), not a silent APPROVED promotion', registry.roles.CADENCE_CHAT_MODEL.candidate === 'claude-sonnet-5' && registry.roles.CADENCE_CHAT_MODEL.approved === null);
  check('MODEL REGISTRY', 'CADENCE_GRADING_MODEL has a registered CANDIDATE (claude-sonnet-5), not a silent APPROVED promotion', registry.roles.CADENCE_GRADING_MODEL.candidate === 'claude-sonnet-5' && registry.roles.CADENCE_GRADING_MODEL.approved === null);
  check('MODEL REGISTRY', 'claude-sonnet-4-6 (the live Worker drift) is deliberately NOT registered', !registry.models['claude-sonnet-4-6']);
}

await runDatasetChecks();

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
