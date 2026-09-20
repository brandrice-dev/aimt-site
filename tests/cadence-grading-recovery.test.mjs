// Cadence grading output-budget + infra-failure-semantics regression
// tests. See docs/course-audit/cadence-sonnet5-grading-regression.md --
// a live 17-case sentinel showed adaptive-thinking output exhausting the
// old 400-token grading budget, and the harness/production code both
// mis-recorded the resulting truncation as a student "revise" and a
// transient 503 as a model disagreement. This file proves the fix:
//
//   A. complete structured PASS -> pass
//   B. complete structured unsafe response -> revise + unsafeReasoning true
//   C. stop_reason=max_tokens + partial JSON -> recoverable evaluator
//      error -> NO pass/revise mutation
//   D. malformed structured response -> recoverable evaluator error
//   E. provider 503 then success -> safe limited retry -> exactly one
//      authoritative evaluation result
//   F. persistent 503 -> recoverable error -> no student grading result
//   G. 401 -> fail fast -> no inappropriate retry loop
//   H. regression harness excludes infra errors from the model-agreement
//      denominator and reports them separately
//   I. grading request configuration has enough explicit token
//      budget/effort for Sonnet 5
//   J. Chat configuration remains independently controlled
//
// No Anthropic API calls are made -- every network boundary is mocked.
//
// Run: node tests/cadence-grading-recovery.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  buildCheckpointEvaluationRecord,
  parseCheckpointEvaluation,
  evaluateCheckpointServerSide,
  GRADING_MAX_TOKENS,
  GRADING_EFFORT,
} from '../functions/_lib/cadence/checkpoint-evaluation.mjs';
import { fetchAnthropicMessages, AnthropicRequestError } from '../functions/_lib/cadence/anthropic-response.mjs';
import { runGrading } from '../scripts/run-cadence-model-regression.mjs';

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

function textResponse(payload, extra = {}) {
  return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: JSON.stringify(payload) }], ...extra }) };
}

// ─────────────────────────────────────────────────────────────────────────
// A / B. Complete structured responses -- genuine decisions still work
// ─────────────────────────────────────────────────────────────────────────
(function completeResponseTests() {
  const passPayload = { requiredElementsDemonstrated: ['a', 'b'], requiredElementsMissing: [], unsafeReasoning: false, unsafeReasoningDescription: null, feedback: 'Meets the standard.' };
  const passRecord = buildCheckpointEvaluationRecord({ checkpointId: 'm0cp1', rubricVersion: 'r1', rawText: JSON.stringify(passPayload), modelInfo: { modelName: 'claude-sonnet-5' } });
  check('A. COMPLETE PASS', 'A complete structured response with no missing elements and unsafeReasoning:false decides pass',
    passRecord.decision === 'pass' && passRecord.malformed === false);

  const unsafePayload = { requiredElementsDemonstrated: [], requiredElementsMissing: ['a'], unsafeReasoning: true, unsafeReasoningDescription: 'Diagnoses the client, which is prohibited.', feedback: 'This must be corrected.' };
  const unsafeRecord = buildCheckpointEvaluationRecord({ checkpointId: 'm1cp1', rubricVersion: 'r2', rawText: JSON.stringify(unsafePayload), modelInfo: { modelName: 'claude-sonnet-5' } });
  check('B. COMPLETE UNSAFE', 'A complete structured unsafe response decides revise with unsafeReasoning true (not swallowed as a parse failure)',
    unsafeRecord.decision === 'revise' && unsafeRecord.unsafeReasoning === true && unsafeRecord.reason === 'unsafe_reasoning' && unsafeRecord.malformed === false);
})();

// ─────────────────────────────────────────────────────────────────────────
// C. max_tokens truncation -- recoverable error, never revise
// ─────────────────────────────────────────────────────────────────────────
(function maxTokensTruncationTests() {
  // A real fingerprint of the bug: a well-formed-looking JSON object cut
  // off mid-string by max_tokens, exactly as the live sentinel captured
  // (e.g. m1cp1-competent's rawDiagnostic textPreview).
  const truncated = '{"requiredElementsDemonstrated":["a","b"],"requiredElementsMissing":[],"unsafeReasoning":false,"unsafeReasoningDescription":null,"feedback":"This response meets the standard. You correctly avoid na';
  const parsed = parseCheckpointEvaluation(truncated);
  check('C. MAX_TOKENS TRUNCATION', 'Truncated JSON is marked malformed by the parser', parsed.malformed === true);

  const record = buildCheckpointEvaluationRecord({ checkpointId: 'm1cp1', rubricVersion: 'r3', rawText: truncated, modelInfo: { modelName: 'claude-sonnet-5' } });
  check('C. MAX_TOKENS TRUNCATION', 'buildCheckpointEvaluationRecord never mutates truncated evidence into pass or revise',
    record.decision !== 'pass' && record.decision !== 'revise' && record.decision === 'error');
  check('C. MAX_TOKENS TRUNCATION', 'The record is explicitly flagged malformed/incomplete, not silently defaulted',
    record.malformed === true && record.reason === 'evaluation_incomplete');

  // Same fingerprint for the genuinely-unsafe case that got swallowed:
  // the model DID set unsafeReasoning:true before truncation cut it off.
  // The fallback must not silently report unsafeReasoning:false.
  const unsafeTruncated = '{"requiredElementsDemonstrated":[],"requiredElementsMissing":["a"],"unsafeReasoning":true,"unsafeReasoningDescription":"The response diagnoses the client with alopecia areata and promises';
  const unsafeRecord = buildCheckpointEvaluationRecord({ checkpointId: 'm1cp1', rubricVersion: 'r3', rawText: unsafeTruncated, modelInfo: { modelName: 'claude-sonnet-5' } });
  check('C. MAX_TOKENS TRUNCATION', 'A truncated unsafe-diagnosis response is a recoverable error, not a false "safe" revise -- the safety signal was never actually lost, it is preserved as "not yet decided," not misreported as false',
    unsafeRecord.decision === 'error' && unsafeRecord.malformed === true);
})();

// ─────────────────────────────────────────────────────────────────────────
// D. Malformed (non-JSON) structured response -- recoverable error
// ─────────────────────────────────────────────────────────────────────────
(function malformedResponseTests() {
  const record = buildCheckpointEvaluationRecord({ checkpointId: 'm0cp1', rubricVersion: 'r4', rawText: 'I think this answer looks pretty good actually!', modelInfo: { modelName: 'claude-sonnet-5' } });
  check('D. MALFORMED RESPONSE', 'Non-JSON prose is a recoverable error, not revise', record.decision === 'error' && record.malformed === true);

  const emptyRecord = buildCheckpointEvaluationRecord({ checkpointId: 'm0cp1', rubricVersion: 'r4', rawText: '', modelInfo: { modelName: 'claude-sonnet-5' } });
  check('D. MALFORMED RESPONSE', 'A textless response (e.g. only a thinking block, no text block extracted) is a recoverable error, not revise',
    emptyRecord.decision === 'error' && emptyRecord.malformed === true);

  const missingFieldsRecord = buildCheckpointEvaluationRecord({ checkpointId: 'm0cp1', rubricVersion: 'r4', rawText: JSON.stringify({ requiredElementsDemonstrated: ['a'] }), modelInfo: { modelName: 'claude-sonnet-5' } });
  check('D. MALFORMED RESPONSE', 'Valid JSON missing required structured fields (unsafeReasoning, requiredElementsMissing) is a recoverable error, not revise',
    missingFieldsRecord.decision === 'error' && missingFieldsRecord.malformed === true);
})();

// ─────────────────────────────────────────────────────────────────────────
// C/D end-to-end via evaluateCheckpointServerSide -- confirms the
// production wrapper THROWS on a malformed/truncated evaluation, which is
// what lets functions/api/cadence/evaluate-checkpoint.js's existing
// preserve-student-response/retry path (unchanged) take over automatically.
// ─────────────────────────────────────────────────────────────────────────
await (async function endToEndRecoverableErrorTests() {
  // Checkpoint grading resolves CADENCE_GRADING_MODEL (Gate-1 Finding P1-1
  // fix) -- this override is technically redundant since that role already
  // has an APPROVED default (claude-sonnet-5), but is set explicitly so
  // this env accurately documents which role evaluateCheckpointServerSide
  // actually resolves.
  const env = { ANTHROPIC_API_KEY: 'mock-anthropic-key', CADENCE_GRADING_MODEL: 'claude-sonnet-5' };

  await withMockFetch(
    async () => textResponse({ requiredElementsDemonstrated: ['a'] }), // missing required fields -- malformed
    async () => {
      let threw = false;
      try {
        await evaluateCheckpointServerSide(env, { checkpointId: 'm0cp1', systemPrompt: 'sys', question: 'q', studentResponse: 'a' });
      } catch (e) {
        threw = true;
        check('C/D END-TO-END', 'evaluateCheckpointServerSide throws on malformed evidence (so the endpoint\'s existing preserve/retry catch handles it, never recording pass/revise)', e instanceof Error);
      }
      check('C/D END-TO-END', 'evaluateCheckpointServerSide did throw for the malformed case', threw === true);
    }
  );

  await withMockFetch(
    async () => textResponse({ requiredElementsDemonstrated: ['a'], requiredElementsMissing: [], unsafeReasoning: false, unsafeReasoningDescription: null, feedback: 'Good.' }),
    async () => {
      const record = await evaluateCheckpointServerSide(env, { checkpointId: 'm0cp1', systemPrompt: 'sys', question: 'q', studentResponse: 'a' });
      check('C/D END-TO-END', 'evaluateCheckpointServerSide does NOT throw and returns a normal decision for a genuinely complete response', record.decision === 'pass');
    }
  );
})();

// ─────────────────────────────────────────────────────────────────────────
// E. Transient 503 then success -- safe limited retry, one authoritative result
// ─────────────────────────────────────────────────────────────────────────
await (async function transientRetryTests() {
  let callCount = 0;
  const mock = async () => {
    callCount++;
    if (callCount === 1) return { ok: false, status: 503, text: async () => 'credential validation failed' };
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: 'ok' }] }) };
  };
  const data = await withMockFetch(mock, () => fetchAnthropicMessages({ apiKey: 'k', body: { model: 'claude-sonnet-5' } }));
  check('E. TRANSIENT 503 RETRY', 'A 503 followed by success eventually resolves successfully', data.content[0].text === 'ok');
  check('E. TRANSIENT 503 RETRY', 'Exactly 2 requests were made (1 failed + 1 successful) -- retried, not looped indefinitely', callCount === 2);
})();

// ─────────────────────────────────────────────────────────────────────────
// F. Persistent 503 -- recoverable error, bounded retry, no result fabricated
// ─────────────────────────────────────────────────────────────────────────
await (async function persistentFailureTests() {
  let callCount = 0;
  const mock = async () => { callCount++; return { ok: false, status: 503, text: async () => 'persistent upstream failure' }; };
  let threw = false;
  let errorRef = null;
  await withMockFetch(mock, async () => {
    try {
      await fetchAnthropicMessages({ apiKey: 'k', body: { model: 'claude-sonnet-5' } });
    } catch (e) {
      threw = true;
      errorRef = e;
    }
  });
  check('F. PERSISTENT 503', 'A persistently-failing 503 eventually throws rather than hanging or fabricating a result', threw === true);
  check('F. PERSISTENT 503', 'The thrown error is the typed AnthropicRequestError, flagged retryable', errorRef instanceof AnthropicRequestError && errorRef.retryable === true);
  check('F. PERSISTENT 503', 'The retry is bounded, not indefinite -- exactly 3 attempts total (1 initial + 2 retries)', callCount === 3);

  // Full-stack: confirm evaluateCheckpointServerSide also surfaces this as
  // a thrown error (never a synthesized grading decision).
  // Checkpoint grading resolves CADENCE_GRADING_MODEL (Gate-1 Finding P1-1
  // fix) -- this override is technically redundant since that role already
  // has an APPROVED default (claude-sonnet-5), but is set explicitly so
  // this env accurately documents which role evaluateCheckpointServerSide
  // actually resolves.
  const env = { ANTHROPIC_API_KEY: 'mock-anthropic-key', CADENCE_GRADING_MODEL: 'claude-sonnet-5' };
  let endpointThrew = false;
  await withMockFetch(mock, async () => {
    try {
      await evaluateCheckpointServerSide(env, { checkpointId: 'm0cp1', systemPrompt: 'sys', question: 'q', studentResponse: 'a' });
    } catch (_) {
      endpointThrew = true;
    }
  });
  check('F. PERSISTENT 503', 'evaluateCheckpointServerSide also throws on persistent 503 -- no student grading result is ever recorded', endpointThrew === true);
})();

// ─────────────────────────────────────────────────────────────────────────
// G. 401 -- fail fast, no retry loop
// ─────────────────────────────────────────────────────────────────────────
await (async function failFastAuthTests() {
  let callCount = 0;
  const mock = async () => { callCount++; return { ok: false, status: 401, text: async () => 'invalid x-api-key' }; };
  let threw = false;
  let errorRef = null;
  await withMockFetch(mock, async () => {
    try {
      await fetchAnthropicMessages({ apiKey: 'bad-key', body: { model: 'claude-sonnet-5' } });
    } catch (e) {
      threw = true;
      errorRef = e;
    }
  });
  check('G. 401 FAIL FAST', 'A 401 throws', threw === true);
  check('G. 401 FAIL FAST', 'The error is flagged non-retryable', errorRef instanceof AnthropicRequestError && errorRef.retryable === false);
  check('G. 401 FAIL FAST', 'Exactly ONE request was made -- no retry loop on an authentication failure that retrying could never fix', callCount === 1);

  // 403 gets the identical fail-fast treatment.
  let callCount403 = 0;
  const mock403 = async () => { callCount403++; return { ok: false, status: 403, text: async () => 'forbidden' }; };
  await withMockFetch(mock403, async () => {
    try { await fetchAnthropicMessages({ apiKey: 'k', body: {} }); } catch (_) { /* expected */ }
  });
  check('G. 401 FAIL FAST', '403 gets the same fail-fast treatment as 401 -- exactly one attempt', callCount403 === 1);
})();

// ─────────────────────────────────────────────────────────────────────────
// H. Harness excludes infra/parse failures from the model-agreement
//    denominator and reports them separately -- exercised through the
//    real runGrading()/summarizeGrading() pipeline with a mocked
//    transport, not a hand-built summary object.
// ─────────────────────────────────────────────────────────────────────────
await (async function harnessMetricSeparationTests() {
  // Three real sentinel case IDs. selectCases() preserves GRADING_DATASET's
  // own order regardless of the order listed here -- verified against the
  // dataset file, the actual dispatch order is:
  //   1. m1cp1-unsafe    (safety-critical, expects revise) -> persistent
  //      503 -> 3 fetch attempts (1 initial + 2 retries), still blocked
  //   2. cp1-competent   (expects pass) -> truncated JSON (1 fetch call,
  //      200 OK, not retried) -> blocked/parse_failure
  //   3. m6cp1-competent (expects pass) -> genuine success -> completed
  const caseIds = ['m6cp1-competent', 'm1cp1-unsafe', 'cp1-competent'];
  let callIndex = 0;
  const mock = async () => {
    callIndex++;
    if (callIndex <= 3) return { ok: false, status: 503, text: async () => 'upstream failure' }; // m1cp1-unsafe: persistent 503
    if (callIndex === 4) return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: '{"requiredElementsDemonstrated":["a"' }], stop_reason: 'max_tokens' }) }; // cp1-competent: truncated
    return textResponse({ requiredElementsDemonstrated: ['a', 'b', 'c', 'd'], requiredElementsMissing: [], unsafeReasoning: false, unsafeReasoningDescription: null, feedback: 'Pass.' }); // m6cp1-competent: genuine success
  };

  const originalKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'mock-anthropic-key';
  let summary;
  try {
    summary = await withMockFetch(mock, () => runGrading({ live: true, repeat: 1, model: 'claude-sonnet-5' }, caseIds));
  } finally {
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalKey;
  }

  check('H. HARNESS METRICS', 'The run actually went live (not blocked/dry-run)', summary.mode === 'live');
  check('H. HARNESS METRICS', 'completedCases counts only the genuinely-completed case (1 of 3)', summary.completedCases === 1);
  check('H. HARNESS METRICS', 'blockedCases counts the infra + parse failures (2 of 3), listed by ID', summary.blockedCases === 2 && summary.blockedCaseIds.includes('m1cp1-unsafe') && summary.blockedCaseIds.includes('cp1-competent'));
  check('H. HARNESS METRICS', 'infraFailureCount and parseFailureCount are reported separately, not merged', summary.infraFailureCount === 1 && summary.parseFailureCount === 1);
  check('H. HARNESS METRICS', 'runStatus is INCOMPLETE_BLOCKED when any case is blocked -- never silently reported as a clean model result', summary.runStatus === 'INCOMPLETE_BLOCKED');
  check('H. HARNESS METRICS', 'overallAgreement is computed only over the 1 completed case (100%), not diluted by treating 2 unevaluated cases as disagreements (which would read as 33%)', summary.overallAgreement === 1);
  check('H. HARNESS METRICS', 'The blocked safety-critical case (m1cp1-unsafe) is excluded from safetyCritical.total, not silently counted as a failure', summary.safetyCritical.total === 0 && summary.safetyCritical.failures === 0);
})();

// ─────────────────────────────────────────────────────────────────────────
// I. Grading request configuration has enough explicit token budget/effort
// ─────────────────────────────────────────────────────────────────────────
(function gradingConfigTests() {
  check('I. GRADING CONFIG', 'GRADING_MAX_TOKENS is explicitly set well above the old 400-token cap that caused truncation', GRADING_MAX_TOKENS >= 2048);
  check('I. GRADING CONFIG', 'GRADING_MAX_TOKENS is not an unbounded/enormous arbitrary budget', GRADING_MAX_TOKENS <= 16000);
  check('I. GRADING CONFIG', 'GRADING_EFFORT is explicitly set (not left to an implicit high default) to a bounded-task-appropriate level', GRADING_EFFORT === 'low' || GRADING_EFFORT === 'medium');

  const src = readFileSync(path.join(ROOT, 'functions/_lib/cadence/checkpoint-evaluation.mjs'), 'utf8');
  check('I. GRADING CONFIG', 'The grading request explicitly sets thinking:{type:"adaptive"} rather than relying on an implicit per-model default', /thinking:\s*\{\s*type:\s*'adaptive'\s*\}/.test(src));
  check('I. GRADING CONFIG', 'The grading request explicitly sets output_config.effort', /output_config:\s*\{\s*effort:\s*GRADING_EFFORT/.test(src));
  check('I. GRADING CONFIG', 'The grading call site uses the shared retry-capable fetch helper, not a bare fetch with no retry', /fetchAnthropicMessages/.test(src));

  const harnessSrc = readFileSync(path.join(ROOT, 'scripts/run-cadence-model-regression.mjs'), 'utf8');
  check('I. GRADING CONFIG', 'The regression harness imports GRADING_MAX_TOKENS/GRADING_EFFORT from production rather than hardcoding its own separate values (single source of truth)',
    /GRADING_MAX_TOKENS/.test(harnessSrc) && /GRADING_EFFORT/.test(harnessSrc) && /from '\.\.\/functions\/_lib\/cadence\/checkpoint-evaluation\.mjs'/.test(harnessSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// J. Chat configuration remains independently controlled
// ─────────────────────────────────────────────────────────────────────────
(function chatConfigIndependenceTests() {
  const chatSrc = readFileSync(path.join(ROOT, 'functions/_lib/cadence/ask-cadence.mjs'), 'utf8');
  // As of a later task (Chat execution-config hardening), Ask Cadence
  // gained its own explicit thinking/effort/max_tokens config -- distinct
  // from and no longer "no output_config at all" as this file's own task
  // assumed. What must still hold, at THIS task's HEAD, is only that chat
  // never imports or shares grading's specific constants. See
  // tests/cadence-chat-config.test.mjs for the current, full assertions.
  check('J. CHAT INDEPENDENCE', 'Ask Cadence defines its own execution-config constants (CHAT_MAX_TOKENS/CHAT_EFFORT), not the grading budget',
    /CHAT_MAX_TOKENS/.test(chatSrc) && /CHAT_EFFORT/.test(chatSrc));
  check('J. CHAT INDEPENDENCE', 'Ask Cadence has no import dependency on checkpoint-evaluation.mjs at all -- the roles stay decoupled',
    !/from ['"][^'"]*checkpoint-evaluation\.mjs['"]/.test(chatSrc));
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
