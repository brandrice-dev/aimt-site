// Regression coverage for the Module 12 Cadence grading-path hardening
// (functions/_lib/certification/cadence-grader.mjs).
//
// Context: cadence-grader.mjs previously carried its own older, weaker
// Anthropic integration -- `data.content[0].text` (silently breaking on any
// response with a leading non-text block), a greedy `/\{[\s\S]*\}/` regex
// parser over arbitrary prose, no `stop_reason` truncation check, and a
// 1000-token output cap -- instead of the shared, already-validated
// infrastructure Module 0-11 checkpoint grading uses (functions/_lib/
// cadence/anthropic-response.mjs, functions/_lib/cadence/
// checkpoint-evaluation.mjs). This file proves the fix end-to-end against
// the real production evaluator functions with a mocked Anthropic
// transport -- no live Anthropic call, no production database write, no
// real student attempt.
//
// Run: node --test tests/cadence-module12-grader-hardening.test.mjs

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { evaluateStructuredCasePart, evaluateInterviewTurn } from '../functions/_lib/certification/cadence-grader.mjs';
import { GRADING_MAX_TOKENS, GRADING_EFFORT } from '../functions/_lib/cadence/checkpoint-evaluation.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ENV = { ANTHROPIC_API_KEY: 'mock-anthropic-key' };
const ENV_WITH_OVERRIDE = { ANTHROPIC_API_KEY: 'mock-anthropic-key', CADENCE_GRADING_MODEL: 'claude-sonnet-5' };

const CASE_PART = {
  id: 'p1',
  type: 'structured-short-response',
  prompt: 'Describe the appropriate intake follow-up for this scenario.',
  rubric: { requiredElements: ['asks about medical history', 'flags contraindication'] },
};
const CASE_SCENARIO = 'A 34-year-old client reports a recent scalp procedure.';

const INTERVIEW_DEF = {
  id: 'INT-TEST',
  primaryPrompt: 'Walk me through your intake process for a new client.',
  rubricCriteria: [
    { id: 'c1', label: 'Intake thoroughness', guidance: 'Covers medical history.' },
    { id: 'c2', label: 'Contraindication awareness', guidance: 'Flags red flags before proceeding.' },
  ],
};

function jsonResponse(body) {
  return { ok: true, status: 200, json: async () => body };
}

function textBlockResponse(payload, { stopReason = 'end_turn', extraBlocks = [] } = {}) {
  return jsonResponse({
    content: [...extraBlocks, { type: 'text', text: JSON.stringify(payload) }],
    stop_reason: stopReason,
  });
}

function mockFetchOnce(t, responder) {
  let capturedBody = null;
  let callCount = 0;
  t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
    callCount++;
    if (String(url).includes('api.anthropic.com/v1/messages')) {
      capturedBody = JSON.parse(options.body);
      return responder(capturedBody, callCount);
    }
    throw new Error(`Unexpected fetch in test: ${url}`);
  });
  return { getBody: () => capturedBody, getCallCount: () => callCount };
}

const VALID_CASE_PAYLOAD = { correctnessScore: 0.75, explicitUnsafe: false, patternTag: null };
const VALID_INTERVIEW_PAYLOAD = {
  criterionScores: { c1: 2, c2: 1 },
  explicitUnsafeDomains: [],
  patternTags: {},
  needsFollowUp: false,
  followUpPrompt: null,
  transitionLine: 'Thanks — let\'s continue.',
};

// ---------------------------------------------------------------------------
// 1. Model resolution
// ---------------------------------------------------------------------------

test('model resolution: valid ANTHROPIC_API_KEY, no CADENCE_GRADING_MODEL override -> resolves the registry\'s approved claude-sonnet-5', async (t) => {
  const mock = mockFetchOnce(t, () => textBlockResponse(VALID_CASE_PAYLOAD));
  const result = await evaluateStructuredCasePart(ENV, { scenario: CASE_SCENARIO, part: CASE_PART, studentResponse: 'A response.' });
  assert.equal(result.modelInfo.modelName, 'claude-sonnet-5');
  assert.equal(result.modelInfo.status, 'APPROVED');
  assert.equal(result.modelInfo.source, 'approved-default');
  assert.equal(mock.getBody().model, 'claude-sonnet-5');
});

// ---------------------------------------------------------------------------
// 2. Thinking-first response — the exact bug shape this hardening fixes
// ---------------------------------------------------------------------------

test('thinking-first response: block 0 thinking, block 1 valid text -> evaluates successfully (protects against the old content[0].text assumption)', async (t) => {
  mockFetchOnce(t, () => textBlockResponse(VALID_CASE_PAYLOAD, { extraBlocks: [{ type: 'thinking', thinking: 'reasoning about the rubric' }] }));
  const result = await evaluateStructuredCasePart(ENV, { scenario: CASE_SCENARIO, part: CASE_PART, studentResponse: 'A response.' });
  assert.equal(result.correctnessScore, 0.75);
  assert.equal(result.explicitUnsafe, false);
});

test('thinking-first response also works for the interview-turn evaluator', async (t) => {
  mockFetchOnce(t, () => textBlockResponse(VALID_INTERVIEW_PAYLOAD, { extraBlocks: [{ type: 'thinking', thinking: 'reasoning about criteria' }] }));
  const result = await evaluateInterviewTurn(ENV, {
    interviewDef: INTERVIEW_DEF,
    priorTranscript: [{ role: 'assistant', content: INTERVIEW_DEF.primaryPrompt }],
    studentResponse: 'My intake process is...',
    followUpAlreadyUsed: false,
  });
  assert.deepEqual(result.criterionScores, { c1: 2, c2: 1 });
});

// ---------------------------------------------------------------------------
// 3. Multiple text blocks — handled per the shared extractor's own contract
//    (concatenation in order), not a special case bolted onto this file.
// ---------------------------------------------------------------------------

test('multiple text blocks are concatenated per the shared extractor contract', async (t) => {
  const jsonText = JSON.stringify(VALID_CASE_PAYLOAD);
  const midpoint = Math.floor(jsonText.length / 2);
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (String(url).includes('api.anthropic.com/v1/messages')) {
      return jsonResponse({
        content: [
          { type: 'text', text: jsonText.slice(0, midpoint) },
          { type: 'text', text: jsonText.slice(midpoint) },
        ],
        stop_reason: 'end_turn',
      });
    }
    throw new Error('unexpected fetch');
  });
  const result = await evaluateStructuredCasePart(ENV, { scenario: CASE_SCENARIO, part: CASE_PART, studentResponse: 'A response.' });
  assert.equal(result.correctnessScore, 0.75);
});

// ---------------------------------------------------------------------------
// 4. Hidden thinking must never leak into parsed/returned/persisted data
// ---------------------------------------------------------------------------

test('thinking-block content never appears in the returned evaluation result', async (t) => {
  const SECRET = 'SECRET_INTERNAL_REASONING_TOKEN';
  mockFetchOnce(t, () => textBlockResponse(VALID_CASE_PAYLOAD, { extraBlocks: [{ type: 'thinking', thinking: SECRET }] }));
  const result = await evaluateStructuredCasePart(ENV, { scenario: CASE_SCENARIO, part: CASE_PART, studentResponse: 'A response.' });
  assert.ok(!JSON.stringify(result).includes(SECRET), 'thinking-block text must never leak into the returned grading result');
});

// ---------------------------------------------------------------------------
// 5. Malformed response — must throw, never manufacture a grade
// ---------------------------------------------------------------------------

test('malformed (non-JSON) response throws rather than producing a fabricated grade', async (t) => {
  mockFetchOnce(t, () => jsonResponse({ content: [{ type: 'text', text: 'Sure! Here is my evaluation of the response, informally.' }], stop_reason: 'end_turn' }));
  await assert.rejects(
    evaluateStructuredCasePart(ENV, { scenario: CASE_SCENARIO, part: CASE_PART, studentResponse: 'A response.' }),
    /unparseable/i
  );
});

test('malformed (non-JSON) response throws for the interview-turn evaluator too', async (t) => {
  mockFetchOnce(t, () => jsonResponse({ content: [{ type: 'text', text: 'not json at all' }], stop_reason: 'end_turn' }));
  await assert.rejects(
    evaluateInterviewTurn(ENV, {
      interviewDef: INTERVIEW_DEF,
      priorTranscript: [{ role: 'assistant', content: INTERVIEW_DEF.primaryPrompt }],
      studentResponse: 'My intake process is...',
      followUpAlreadyUsed: false,
    }),
    /unparseable/i
  );
});

// ---------------------------------------------------------------------------
// 6. Textless response — must fail safe, never manufacture a grade
// ---------------------------------------------------------------------------

test('a response with no usable text block fails safe rather than producing a fabricated grade', async (t) => {
  mockFetchOnce(t, () => jsonResponse({ content: [{ type: 'thinking', thinking: 'only internal reasoning, no visible answer' }], stop_reason: 'end_turn' }));
  await assert.rejects(
    evaluateStructuredCasePart(ENV, { scenario: CASE_SCENARIO, part: CASE_PART, studentResponse: 'A response.' }),
    /unparseable/i
  );
});

// ---------------------------------------------------------------------------
// 7. Truncation (stop_reason === 'max_tokens') is a recoverable failure,
//    never accepted as a complete evaluation -- even when the truncated
//    text happens to still parse as valid JSON.
// ---------------------------------------------------------------------------

test('stop_reason max_tokens is rejected as a recoverable evaluator failure, even with well-formed JSON text', async (t) => {
  mockFetchOnce(t, () => textBlockResponse(VALID_CASE_PAYLOAD, { stopReason: 'max_tokens' }));
  await assert.rejects(
    evaluateStructuredCasePart(ENV, { scenario: CASE_SCENARIO, part: CASE_PART, studentResponse: 'A response.' }),
    /truncat/i
  );
});

test('stop_reason max_tokens is rejected for the interview-turn evaluator too', async (t) => {
  mockFetchOnce(t, () => textBlockResponse(VALID_INTERVIEW_PAYLOAD, { stopReason: 'max_tokens' }));
  await assert.rejects(
    evaluateInterviewTurn(ENV, {
      interviewDef: INTERVIEW_DEF,
      priorTranscript: [{ role: 'assistant', content: INTERVIEW_DEF.primaryPrompt }],
      studentResponse: 'My intake process is...',
      followUpAlreadyUsed: false,
    }),
    /truncat/i
  );
});

// ---------------------------------------------------------------------------
// 8. Execution configuration — approved Grading role, adaptive thinking,
//    medium effort, GRADING_MAX_TOKENS budget, structured-output schema.
// ---------------------------------------------------------------------------

test('the Module 12 request uses the approved grading execution configuration', async (t) => {
  const mock = mockFetchOnce(t, () => textBlockResponse(VALID_CASE_PAYLOAD));
  await evaluateStructuredCasePart(ENV_WITH_OVERRIDE, { scenario: CASE_SCENARIO, part: CASE_PART, studentResponse: 'A response.' });
  const body = mock.getBody();
  assert.equal(body.model, 'claude-sonnet-5');
  assert.deepEqual(body.thinking, { type: 'adaptive' });
  assert.equal(body.output_config.effort, 'medium');
  assert.equal(body.output_config.effort, GRADING_EFFORT);
  assert.equal(body.max_tokens, 4096);
  assert.equal(body.max_tokens, GRADING_MAX_TOKENS);
  assert.equal(body.output_config.format.type, 'json_schema');
  assert.ok(body.output_config.format.schema, 'a JSON schema must be attached to the structured-output request');
});

test('the interview-turn request schema requires every rubric criterion id and matches the same execution config', async (t) => {
  const mock = mockFetchOnce(t, () => textBlockResponse(VALID_INTERVIEW_PAYLOAD));
  await evaluateInterviewTurn(ENV, {
    interviewDef: INTERVIEW_DEF,
    priorTranscript: [{ role: 'assistant', content: INTERVIEW_DEF.primaryPrompt }],
    studentResponse: 'My intake process is...',
    followUpAlreadyUsed: false,
  });
  const body = mock.getBody();
  assert.deepEqual(body.thinking, { type: 'adaptive' });
  assert.equal(body.output_config.effort, 'medium');
  assert.equal(body.max_tokens, 4096);
  const schema = body.output_config.format.schema;
  assert.equal(schema.properties.criterionScores.required.length, 2);
  assert.ok(schema.properties.criterionScores.required.includes('c1'));
  assert.ok(schema.properties.criterionScores.required.includes('c2'));
  assert.equal(schema.properties.criterionScores.additionalProperties, false);
});

test('no unsupported numeric/string-length JSON Schema constraints appear in either structured-output schema', async (t) => {
  const mock1 = mockFetchOnce(t, () => textBlockResponse(VALID_CASE_PAYLOAD));
  await evaluateStructuredCasePart(ENV, { scenario: CASE_SCENARIO, part: CASE_PART, studentResponse: 'A response.' });
  const caseSchema = mock1.getBody().output_config.format.schema;
  assert.ok(!/minLength|maxLength|minimum|maximum|multipleOf/.test(JSON.stringify(caseSchema)));
});

// ---------------------------------------------------------------------------
// 9. Contract preservation — exact field names/shapes are unchanged
// ---------------------------------------------------------------------------

test('evaluateStructuredCasePart preserves its exact existing contract: correctnessScore, explicitUnsafe, patternTag', async (t) => {
  mockFetchOnce(t, () => textBlockResponse({ correctnessScore: 0.4, explicitUnsafe: true, patternTag: 'misapplies_contraindication' }));
  const result = await evaluateStructuredCasePart(ENV, { scenario: CASE_SCENARIO, part: CASE_PART, studentResponse: 'A response.' });
  assert.deepEqual(Object.keys(result).sort(), ['correctnessScore', 'explicitUnsafe', 'modelInfo', 'patternTag'].sort());
  assert.equal(result.correctnessScore, 0.4);
  assert.equal(result.explicitUnsafe, true);
  assert.equal(result.patternTag, 'misapplies_contraindication');
});

test('evaluateInterviewTurn preserves its exact existing contract', async (t) => {
  mockFetchOnce(t, () => textBlockResponse({
    criterionScores: { c1: 1, c2: 2 },
    explicitUnsafeDomains: ['c2'],
    patternTags: { c1: 'skips_history_check' },
    needsFollowUp: true,
    followUpPrompt: 'Can you elaborate on the contraindication?',
    transitionLine: null,
  }));
  const result = await evaluateInterviewTurn(ENV, {
    interviewDef: INTERVIEW_DEF,
    priorTranscript: [{ role: 'assistant', content: INTERVIEW_DEF.primaryPrompt }],
    studentResponse: 'My intake process is...',
    followUpAlreadyUsed: false,
  });
  assert.deepEqual(Object.keys(result).sort(), ['criterionScores', 'explicitUnsafeDomains', 'followUpPrompt', 'modelInfo', 'needsFollowUp', 'patternTags', 'transitionLine'].sort());
  assert.deepEqual(result.criterionScores, { c1: 1, c2: 2 });
  assert.deepEqual(result.explicitUnsafeDomains, ['c2']);
  assert.deepEqual(result.patternTags, { c1: 'skips_history_check' });
  assert.equal(result.needsFollowUp, true);
  assert.equal(result.followUpPrompt, 'Can you elaborate on the contraindication?');
});

// ---------------------------------------------------------------------------
// 10. No duplicated shared infrastructure inside cadence-grader.mjs
// ---------------------------------------------------------------------------

test('cadence-grader.mjs imports the shared Anthropic infrastructure rather than reimplementing it', () => {
  const src = readFileSync(path.join(REPO_ROOT, 'functions/_lib/certification/cadence-grader.mjs'), 'utf8');
  assert.match(src, /from ['"]\.\.\/cadence\/anthropic-response\.mjs['"]/);
  assert.match(src, /fetchAnthropicMessages/);
  assert.match(src, /extractAnthropicTextSafe/);
  assert.match(src, /isTruncatedByMaxTokens/);
  assert.doesNotMatch(src, /const text = \(data/, 'must no longer build response text from a raw indexed content-block access (the old content[0].text assumption)');
  assert.doesNotMatch(src, /match\(\/\\\{\[\\s\\S\]\*\\\}\//, 'must no longer use the old greedy brace-matching regex to parse model output');
  assert.match(src, /from ['"]\.\.\/cadence\/checkpoint-evaluation\.mjs['"]/, 'reuses the same GRADING_MAX_TOKENS/GRADING_EFFORT constants checkpoint grading validated, rather than a second hardcoded budget');
});

// ---------------------------------------------------------------------------
// 11. Certificate trust gate untouched (sanity re-check alongside this
//     module12 hardening; full behavioral coverage lives in
//     tests/certification-module12-concurrency.test.mjs)
// ---------------------------------------------------------------------------

test('issue-certificate.js still hard-gates on a server-authoritative certification_decision=pass row', () => {
  const src = readFileSync(path.join(REPO_ROOT, 'functions/api/issue-certificate.js'), 'utf8');
  assert.match(src, /certification_decision:\s*'eq\.pass'/);
});
