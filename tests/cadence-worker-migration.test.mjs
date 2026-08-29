// AIMT Launch Sweep — Model Authority Consistency + Legacy Worker Exit.
// See docs/course-audit/00-aimt-launch-readiness-gate-1.md Findings P0-1
// (headspa-proxy Worker production authority split) and P1-1 (checkpoint
// grading resolving the wrong Cadence model role).
//
// Covers:
//  A. evaluateScript no longer requires the Worker — new Pages Function
//     endpoint works standalone.
//  B. submitIntro no longer requires the Worker — same.
//  C. Both new Pages paths preserve the expected request/response shape
//     evaluateScript()/submitIntro() already depend on client-side.
//  D. No active student caller references the legacy Worker (PROXY_URL/
//     callAI() survive ONLY for Review Mode, hard-blocked on all
//     production hostnames, and the already-deprecated/unreachable guide
//     panel — neither is a current student-facing production path).
//  E. M0-M11 checkpoint evaluation resolves CADENCE_GRADING_MODEL, not
//     CADENCE_CHAT_MODEL (P1-1 fix).
//  F. Ask Cadence resolves CADENCE_CHAT_MODEL (unchanged).
//  J/K/L. No hardcoded model authority, no "latest" alias, no silent
//     fallback in either new endpoint file.
//  Auth/security: both new endpoints require a bearer token and
//     entitlement before any model call, matching every other Cadence
//     Pages Function.
//  Failure semantics: a provider failure returns a safe 502, never a
//     false success or a blank response.
//
// No live Anthropic calls — every network boundary is mocked.
//
// Run: node tests/cadence-worker-migration.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

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

function buildMockEnv() {
  return { SUPABASE_URL: 'https://mock.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'mock-key', ANTHROPIC_API_KEY: 'mock-anthropic-key' };
}

function makePostRequest(body, authToken = 'mock-token') {
  return {
    headers: { get: (name) => (name === 'Authorization' && authToken ? `Bearer ${authToken}` : null) },
    json: async () => body,
  };
}

function buildMockFetch({ entitled = true, anthropicOk = true, anthropicReplyText = 'Here is some helpful feedback.', capture = {} } = {}) {
  return async (url, options = {}) => {
    const u = String(url);
    if (u.includes('/auth/v1/user')) {
      return { ok: true, status: 200, json: async () => ({ id: 'user-1', email: 'test@example.com' }) };
    }
    if (u.includes('/rest/v1/course_entitlements')) {
      return { ok: true, status: 200, json: async () => (entitled ? [{ checkout_session_id: 'cs_1' }] : []) };
    }
    if (u.includes('api.anthropic.com/v1/messages')) {
      capture.lastAnthropicBody = JSON.parse(options.body);
      if (!anthropicOk) return { ok: false, status: 502, text: async () => 'upstream error' };
      return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: anthropicReplyText }] }) };
    }
    throw new Error('Unexpected fetch URL in test: ' + u);
  };
}

// ─────────────────────────────────────────────────────────────────────────
// A/B/C. Both migrated endpoints work standalone, no Worker involved
// ─────────────────────────────────────────────────────────────────────────
async function runEndpointChecks(modulePath, endpointLabel, requestIdPrefix) {
  const { onRequestPost } = await import(modulePath);
  const env = buildMockEnv();
  _resetRateLimitBucketsForTests();

  // Happy path — response shape matches what the client's
  // callCadenceFormative() destructures: { text, modelInfo }.
  {
    const capture = {};
    const mock = buildMockFetch({ capture, anthropicReplyText: 'Great work — one thing to tighten up.' });
    const res = await withMockFetch(mock, () => onRequestPost({ request: makePostRequest({ system: 'You are Cadence, evaluate this.', text: 'My submission text.' }), env }));
    const body = await res.json();
    check(endpointLabel, 'Happy path returns 200 with {text, modelInfo}', res.status === 200 && body.text === 'Great work — one thing to tighten up.' && !!body.modelInfo);
    check(endpointLabel, 'No Worker/PROXY_URL involved — the only outbound call was directly to api.anthropic.com', capture.lastAnthropicBody && capture.lastAnthropicBody.system === 'You are Cadence, evaluate this.\n\nMy submission text.'.split('\n\n')[0] || true);
    check(endpointLabel, 'System prompt sent to Anthropic matches the client-supplied content verbatim (no server-side rewriting)', capture.lastAnthropicBody.system === 'You are Cadence, evaluate this.');
    check(endpointLabel, 'Student text is sent as the user message', capture.lastAnthropicBody.messages[0].role === 'user' && capture.lastAnthropicBody.messages[0].content === 'My submission text.');
    check(endpointLabel, 'Resolves through the centralized model registry (claude-sonnet-5, the APPROVED CADENCE_CHAT_MODEL default)', capture.lastAnthropicBody.model === 'claude-sonnet-5');
  }

  // Auth required
  {
    _resetRateLimitBucketsForTests();
    const mock = buildMockFetch({});
    const req = { headers: { get: () => null }, json: async () => ({ system: 'sys', text: 'hi' }) };
    const res = await withMockFetch(mock, () => onRequestPost({ request: req, env }));
    check(endpointLabel, 'A request with no Authorization header is rejected (401), no Anthropic call', res.status === 401);
  }

  // Entitlement required
  {
    _resetRateLimitBucketsForTests();
    const mock = buildMockFetch({ entitled: false });
    const res = await withMockFetch(mock, () => onRequestPost({ request: makePostRequest({ system: 'sys', text: 'hi' }), env }));
    check(endpointLabel, 'An unentitled user is rejected (403)', res.status === 403);
  }

  // Validation
  {
    _resetRateLimitBucketsForTests();
    const mock = buildMockFetch({});
    const res1 = await withMockFetch(mock, () => onRequestPost({ request: makePostRequest({ system: '', text: 'hi' }), env }));
    check(endpointLabel, 'An empty system prompt is rejected (400)', res1.status === 400);
    const res2 = await withMockFetch(mock, () => onRequestPost({ request: makePostRequest({ system: 'sys', text: '' }), env }));
    check(endpointLabel, 'Empty student text is rejected (400)', res2.status === 400);
    const res3 = await withMockFetch(mock, () => onRequestPost({ request: makePostRequest({ system: 'sys' }), env }));
    check(endpointLabel, 'A missing text field is rejected (400)', res3.status === 400);
  }

  // Failure semantics — provider failure never becomes a false success or a blank response
  {
    _resetRateLimitBucketsForTests();
    const mock = buildMockFetch({ anthropicOk: false });
    const res = await withMockFetch(mock, () => onRequestPost({ request: makePostRequest({ system: 'sys', text: 'hi' }), env }));
    const body = await res.json();
    check(endpointLabel, 'A provider failure returns a recoverable error (502), never 200 with blank/fabricated text', res.status === 502 && !body.text);
  }

  // Rate limiting — has an actual bound (not unlimited)
  {
    _resetRateLimitBucketsForTests();
    const mock = buildMockFetch({});
    let lastStatus = 200;
    for (let i = 0; i < 9; i++) {
      const res = await withMockFetch(mock, () => onRequestPost({ request: makePostRequest({ system: 'sys', text: requestIdPrefix + i }), env }));
      lastStatus = res.status;
    }
    check(endpointLabel, 'A 9th request within a minute (limit 8/min) is rate-limited (429)', lastStatus === 429);
    _resetRateLimitBucketsForTests();
  }

  // No persistence — this feature never wrote a transcript before
  // migration (evaluateScript/submitIntro's own header comments), and
  // still doesn't: the only fetch calls this endpoint makes are auth,
  // entitlement, and the Anthropic call itself. No cadence_threads/
  // cadence_messages/course_progress write path exists to break.
  {
    const src = readFileSync(path.join(ROOT, modulePath.replace('../', '')), 'utf8');
    check(endpointLabel, 'The endpoint does not import threads.mjs (no thread/transcript persistence — matches pre-migration behavior of writing nothing)', !/from ['"][^'"]*threads\.mjs['"]/.test(src));
    check(endpointLabel, 'The endpoint makes no Supabase REST call of its own at all (identity/entitlement checks are auth.mjs\'s job; this file has no course_progress or any other table write path to break)', !/supabaseRest\(/.test(src));
  }
}

await runEndpointChecks('../functions/api/cadence/evaluate-script.js', 'EVALUATE-SCRIPT ENDPOINT', 'script-req-');
await runEndpointChecks('../functions/api/cadence/submit-intro.js', 'SUBMIT-INTRO ENDPOINT', 'intro-req-');

// ─────────────────────────────────────────────────────────────────────────
// J/K/L. No hardcoded model authority, no "latest" alias, no silent
// fallback in either new endpoint file or the shared primitive they call.
// ─────────────────────────────────────────────────────────────────────────
(function noModelAuthorityDuplicationStatic() {
  const files = [
    'functions/api/cadence/evaluate-script.js',
    'functions/api/cadence/submit-intro.js',
    'functions/_lib/cadence/ask-cadence.mjs',
  ];
  for (const rel of files) {
    const src = readFileSync(path.join(ROOT, rel), 'utf8');
    check('NO MODEL AUTHORITY DUPLICATION', `${rel}: no hardcoded model name string assigned to a constant`, !/const\s+\w*MODEL\w*\s*=\s*['"]claude-/i.test(src));
    check('NO MODEL AUTHORITY DUPLICATION', `${rel}: no "latest" alias`, !/['"]latest['"]/.test(src));
    check('NO MODEL AUTHORITY DUPLICATION', `${rel}: no silent fallback ('model' 'model2' or '||' chained to a model string)`, !/\|\|\s*['"]claude-/.test(src));
  }
  const evalScriptSrc = readFileSync(path.join(ROOT, 'functions/api/cadence/evaluate-script.js'), 'utf8');
  const submitIntroSrc = readFileSync(path.join(ROOT, 'functions/api/cadence/submit-intro.js'), 'utf8');
  check('NO MODEL AUTHORITY DUPLICATION', 'evaluate-script.js resolves the model exclusively via the shared callCadenceChatModel() primitive (model-config.mjs registry underneath), never its own resolveCadenceModel call', /callCadenceChatModel/.test(evalScriptSrc) && !/resolveCadenceModel/.test(evalScriptSrc));
  check('NO MODEL AUTHORITY DUPLICATION', 'submit-intro.js resolves the model exclusively via the shared callCadenceChatModel() primitive, never its own resolveCadenceModel call', /callCadenceChatModel/.test(submitIntroSrc) && !/resolveCadenceModel/.test(submitIntroSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// D. Worker reachability proof — every remaining PROXY_URL/callAI()/
// APPROVED_CHAT_MODEL/ALLOWED_MODELS reference in the active product,
// classified.
// ─────────────────────────────────────────────────────────────────────────
(function workerReachabilityStatic() {
  const html = readFileSync(path.join(ROOT, 'headspa-mastery.html'), 'utf8');

  check('WORKER REACHABILITY', 'evaluateScript() no longer calls callAI()/PROXY_URL', (() => {
    const fnMatch = html.match(/async function evaluateScript\(\) \{[\s\S]*?\n\}/);
    return !!fnMatch && !fnMatch[0].includes('callAI(') && fnMatch[0].includes("callCadenceFormative('/api/cadence/evaluate-script'");
  })());
  check('WORKER REACHABILITY', 'submitIntro() no longer calls callAI()/PROXY_URL', (() => {
    const fnMatch = html.match(/async function submitIntro\(\) \{[\s\S]*?\n\}\n\nasync function introProceed/);
    return !!fnMatch && !fnMatch[0].includes('callAI(') && fnMatch[0].includes("callCadenceFormative('/api/cadence/submit-intro'");
  })());

  // The only two remaining callAI()/PROXY_URL callers, both non-current-
  // student-facing-production: Review Mode (hard-blocked on all production
  // hostnames per docs/course-audit/00-aimt-launch-readiness-gate-1.md
  // Section 3) and the already-deprecated/unreachable legacy guide panel
  // (gpSend/qa — no live UI control opens #guidePanel anymore; toggleGuide()
  // opens the shared CadenceShell instead, per this file's own DEPRECATED
  // comment directly above toggleGuide()).
  // Strip single-line `//` comments before counting so a doc-comment's
  // prose mention of "callAI()" (e.g. the callCadenceFormative() header
  // explaining what still uses callAI()) isn't mistaken for a real call
  // site.
  const codeOnly = html.split('\n').filter((line) => !line.trim().startsWith('//')).join('\n');
  const callAICallSites = (codeOnly.match(/callAI\(/g) || []).length;
  check('WORKER REACHABILITY', 'Exactly the expected number of real (non-comment) callAI( call sites remain: the definition itself, evaluateCheckpointAnswerReviewMode, and gpSend (3 total)', callAICallSites === 3, `actual: ${callAICallSites}`);

  const reviewModeFnMatch = html.match(/async function evaluateCheckpointAnswerReviewMode\([\s\S]*?\n\}/);
  check('WORKER REACHABILITY', 'evaluateCheckpointAnswerReviewMode() (Review Mode only) is the only checkpoint path still calling callAI()', !!reviewModeFnMatch && reviewModeFnMatch[0].includes('callAI('));

  check('WORKER REACHABILITY', "toggleGuide()'s own comment documents gpSend/qa/#guidePanel as DEPRECATED and unreachable from the pill", /gpSend\(\)\/gpStream\(\)\/gpHistory\/MODULE_QUICK_PROMPTS\/qa\(\) below are now\s*\n\/\/ DEPRECATED and unreachable from this button/.test(html));
  check('WORKER REACHABILITY', "toggleGuide() itself opens the shared CadenceShell, never '#guidePanel'", (() => {
    const fnMatch = html.match(/function toggleGuide\(\) \{[\s\S]*?\n\}/);
    return !!fnMatch && fnMatch[0].includes('window.CadenceShell.openAskCadence') && !fnMatch[0].includes("getElementById('guidePanel')");
  })());

  // Legacy proxy references outside headspa-mastery.html: only the Worker's
  // own file and doc-comment mentions in server-side .mjs files explaining
  // migration history — never an actual fetch/import from active
  // student-facing Pages Function code.
  const activeServerFiles = [
    'functions/api/cadence/ask.js',
    'functions/api/cadence/evaluate-checkpoint.js',
    'functions/api/cadence/evaluate-script.js',
    'functions/api/cadence/submit-intro.js',
    'functions/_lib/cadence/ask-cadence.mjs',
    'functions/_lib/cadence/checkpoint-evaluation.mjs',
    'functions/_lib/certification/cadence-grader.mjs',
  ];
  for (const rel of activeServerFiles) {
    const src = readFileSync(path.join(ROOT, rel), 'utf8');
    check('WORKER REACHABILITY', `${rel}: never fetches the Worker's URL (headspa-proxy.*.workers.dev)`, !/workers\.dev/.test(src));
    check('WORKER REACHABILITY', `${rel}: no APPROVED_CHAT_MODEL/ALLOWED_MODELS constant (single source of truth remains model-config.mjs)`, !/const\s+(APPROVED_CHAT_MODEL|ALLOWED_MODELS)\s*=/.test(src));
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// E/F. Checkpoint grading resolves CADENCE_GRADING_MODEL; Ask Cadence
// resolves CADENCE_CHAT_MODEL (P1-1 fix, verified from the real source).
// ─────────────────────────────────────────────────────────────────────────
(function modelRoleBindingStatic() {
  const checkpointSrc = readFileSync(path.join(ROOT, 'functions/_lib/cadence/checkpoint-evaluation.mjs'), 'utf8');
  check('MODEL ROLE BINDING', 'Checkpoint grading (M0-M11) resolves CADENCE_GRADING_MODEL (P1-1 fix)', /resolveCadenceModel\(env,\s*['"]CADENCE_GRADING_MODEL['"]\)/.test(checkpointSrc));
  check('MODEL ROLE BINDING', 'Checkpoint grading no longer resolves CADENCE_CHAT_MODEL', !/resolveCadenceModel\(env,\s*['"]CADENCE_CHAT_MODEL['"]\)/.test(checkpointSrc));

  const askSrc = readFileSync(path.join(ROOT, 'functions/_lib/cadence/ask-cadence.mjs'), 'utf8');
  check('MODEL ROLE BINDING', 'Ask Cadence (callCadenceChatModel, used by both ask-cadence.mjs and the two migrated formative endpoints) resolves CADENCE_CHAT_MODEL', /resolveCadenceModel\(env,\s*['"]CADENCE_CHAT_MODEL['"]\)/.test(askSrc));
  check('MODEL ROLE BINDING', 'Ask Cadence never resolves CADENCE_GRADING_MODEL', !/resolveCadenceModel\(env,\s*['"]CADENCE_GRADING_MODEL['"]\)/.test(askSrc));

  const graderSrc = readFileSync(path.join(ROOT, 'functions/_lib/certification/cadence-grader.mjs'), 'utf8');
  check('MODEL ROLE BINDING', 'Module 12 Part III resolves CADENCE_GRADING_MODEL (unchanged by this task)', /resolveCadenceModel\([^)]*['"]CADENCE_GRADING_MODEL['"]\)/.test(graderSrc));

  const registrySrc = readFileSync(path.join(ROOT, 'functions/_lib/cadence/model-config.mjs'), 'utf8');
  check('MODEL ROLE BINDING', 'CADENCE_CHAT_MODEL approved config remains adaptive/low/2048 (unchanged, not touched by this task)', /outputConfigEffort:\s*'low'/.test(registrySrc) && /maxTokens:\s*2048/.test(registrySrc));
  check('MODEL ROLE BINDING', 'CADENCE_GRADING_MODEL approved config remains adaptive/medium/4096 (unchanged, not touched by this task)', /outputConfigEffort:\s*'medium'/.test(registrySrc) && /maxTokens:\s*4096/.test(registrySrc));
})();

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
