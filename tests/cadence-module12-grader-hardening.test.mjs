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
// CORRECTION (post-review): the first version of this file's INTERVIEW_DEF
// fixture had rubric criteria with no `criticalDomainEvidence` at all, and
// its patternTags/explicitUnsafeDomains fixtures used criterion ids ('c1',
// 'c2') where they should have used critical-domain ids ('D1'-'D4'). That
// hid the exact defect it should have caught: cadence-grader.mjs's
// interview-turn structured-output schema built patternTags' keys from
// rubricCriteria[].id instead of the union of rubricCriteria[].
// criticalDomainEvidence. A criterion-keyed schema doesn't reject anything
// -- it just produces well-formed JSON keyed the wrong way, which
// scoring.mjs's evaluatorFlags[domainId] lookup then silently fails to
// find, defeating the D1-D4 Type A/B safety gates without ever throwing.
// INTERVIEW_DEF now carries realistic criticalDomainEvidence (mirroring
// production content-bank.mjs's INT-01..INT-09 shape, where a criterion's
// own `id` and the domain(s) it provides evidence for are two different id
// spaces), and every fixture below uses D1/D2 for domain-keyed fields.
//
// Run: node --test tests/cadence-module12-grader-hardening.test.mjs

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { evaluateStructuredCasePart, evaluateInterviewTurn } from '../functions/_lib/certification/cadence-grader.mjs';
import { GRADING_MAX_TOKENS, GRADING_EFFORT } from '../functions/_lib/cadence/checkpoint-evaluation.mjs';
import { scoreInterviewConversation, interviewEvaluatorFlagsFromState, evaluateCriticalDomains } from '../functions/_lib/certification/scoring.mjs';
import { HEAD_SPA_CRITICAL_DOMAINS } from '../functions/_lib/certification/critical-domains.mjs';

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

// Two criteria touching two DIFFERENT critical domains -- deliberately not
// "both touch D1" (like most real single-domain interviews), so that any
// test here reusing a criterion id ('c1') where a domain id ('D1') was
// meant would fail loudly rather than accidentally still passing (c1 !=
// D1 as strings, but a same-shaped single-domain fixture could still
// coincidentally line up and mask the bug). Mirrors real content-bank.mjs
// interview INT-09's shape (multiple domains across one interview's
// criteria).
const INTERVIEW_DEF = {
  id: 'INT-TEST',
  primaryPrompt: 'Walk me through your intake process for a new client.',
  rubricCriteria: [
    {
      id: 'c1',
      label: 'Intake thoroughness',
      guidance: 'Covers medical history.',
      criticalDomainEvidence: ['D1'],
      explicitUnsafeRule: { description: 'confirming a named diagnosis as fact.' },
    },
    {
      id: 'c2',
      label: 'Contraindication awareness',
      guidance: 'Flags red flags before proceeding.',
      criticalDomainEvidence: ['D2'],
    },
  ],
};

// A second, independent interview item that also provides D1 evidence --
// used to prove a repeated cross-item pattern can still trip the Type B
// gate (real students see this across their multiple selected part3 items,
// e.g. INT-01 and INT-09 both touch D1).
const INTERVIEW_DEF_2 = {
  id: 'INT-TEST-2',
  primaryPrompt: 'Tell me how you would handle a similar intake scenario.',
  rubricCriteria: [
    { id: 'x1', label: 'Intake thoroughness (2)', guidance: 'Covers medical history.', criticalDomainEvidence: ['D1'] },
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

// ---------------------------------------------------------------------------
// 8b. Domain-vs-criterion id keying (the post-review correction) --
//     criterionScores stays criterion-keyed; patternTags/explicitUnsafeDomains
//     must be critical-domain-keyed, never criterion-keyed.
// ---------------------------------------------------------------------------

test('interview schema: criterionScores keys remain rubric criterion IDs, unaffected by the domain-keying fix', async (t) => {
  const mock = mockFetchOnce(t, () => textBlockResponse(VALID_INTERVIEW_PAYLOAD));
  await evaluateInterviewTurn(ENV, {
    interviewDef: INTERVIEW_DEF,
    priorTranscript: [{ role: 'assistant', content: INTERVIEW_DEF.primaryPrompt }],
    studentResponse: 'My intake process is...',
    followUpAlreadyUsed: false,
  });
  const schema = mock.getBody().output_config.format.schema;
  assert.deepEqual(Object.keys(schema.properties.criterionScores.properties).sort(), ['c1', 'c2']);
  assert.deepEqual([...schema.properties.criterionScores.required].sort(), ['c1', 'c2']);
});

test('interview schema: patternTags keys are critical-domain IDs (D1/D2), never rubric criterion IDs (c1/c2)', async (t) => {
  const mock = mockFetchOnce(t, () => textBlockResponse(VALID_INTERVIEW_PAYLOAD));
  await evaluateInterviewTurn(ENV, {
    interviewDef: INTERVIEW_DEF,
    priorTranscript: [{ role: 'assistant', content: INTERVIEW_DEF.primaryPrompt }],
    studentResponse: 'My intake process is...',
    followUpAlreadyUsed: false,
  });
  const schema = mock.getBody().output_config.format.schema;
  const patternTagKeys = Object.keys(schema.properties.patternTags.properties);
  assert.deepEqual(patternTagKeys.sort(), ['D1', 'D2']);
  assert.ok(!patternTagKeys.includes('c1') && !patternTagKeys.includes('c2'), 'rubric criterion ids must never appear as patternTags schema keys');
  assert.equal(schema.properties.patternTags.additionalProperties, false, 'additionalProperties:false means a criterion-id-keyed tag would violate this schema, not silently pass through');
});

test('interview schema: explicitUnsafeDomains is constrained to this interview\'s own critical-domain IDs, not criterion IDs or arbitrary strings', async (t) => {
  const mock = mockFetchOnce(t, () => textBlockResponse(VALID_INTERVIEW_PAYLOAD));
  await evaluateInterviewTurn(ENV, {
    interviewDef: INTERVIEW_DEF,
    priorTranscript: [{ role: 'assistant', content: INTERVIEW_DEF.primaryPrompt }],
    studentResponse: 'My intake process is...',
    followUpAlreadyUsed: false,
  });
  const schema = mock.getBody().output_config.format.schema;
  assert.deepEqual([...schema.properties.explicitUnsafeDomains.items.enum].sort(), ['D1', 'D2']);
  assert.ok(!schema.properties.explicitUnsafeDomains.items.enum.includes('c1'));
  assert.ok(!schema.properties.explicitUnsafeDomains.items.enum.includes('c2'));
});

test('interview schema: an interview whose rubric touches zero critical domains falls back to a plain (non-enum) string array, not an impossible empty enum', async (t) => {
  const noDomainInterview = {
    id: 'INT-NO-DOMAIN',
    primaryPrompt: 'Describe your general approach.',
    rubricCriteria: [{ id: 'g1', label: 'General quality', guidance: 'Overall clarity.', criticalDomainEvidence: [] }],
  };
  const mock = mockFetchOnce(t, () => textBlockResponse({
    criterionScores: { g1: 2 }, explicitUnsafeDomains: [], patternTags: {}, needsFollowUp: false, followUpPrompt: null, transitionLine: 'ok',
  }));
  await evaluateInterviewTurn(ENV, {
    interviewDef: noDomainInterview,
    priorTranscript: [{ role: 'assistant', content: noDomainInterview.primaryPrompt }],
    studentResponse: 'My approach is...',
    followUpAlreadyUsed: false,
  });
  const schema = mock.getBody().output_config.format.schema;
  assert.equal(schema.properties.explicitUnsafeDomains.items.enum, undefined);
  assert.deepEqual(schema.properties.patternTags.properties, {});
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

test('evaluateInterviewTurn preserves its exact existing contract -- criterionScores criterion-keyed, explicitUnsafeDomains/patternTags domain-keyed', async (t) => {
  mockFetchOnce(t, () => textBlockResponse({
    criterionScores: { c1: 1, c2: 2 },
    explicitUnsafeDomains: ['D1'],
    patternTags: { D2: 'skips_history_check' },
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
  assert.deepEqual(result.explicitUnsafeDomains, ['D1']);
  assert.deepEqual(result.patternTags, { D2: 'skips_history_check' });
  assert.equal(result.needsFollowUp, true);
  assert.equal(result.followUpPrompt, 'Can you elaborate on the contraindication?');
});

// ---------------------------------------------------------------------------
// 9b. End-to-end pipeline: evaluateInterviewTurn() -> persisted conversation-
//     state shape -> interviewEvaluatorFlagsFromState() ->
//     scoreInterviewConversation() -> the correct D1/D2 evidence point.
//     This is the exact chain the post-review defect broke silently
//     (well-formed but wrongly-keyed JSON, never thrown, evidence just
//     never found by domain).
// ---------------------------------------------------------------------------

test('a D1-keyed patternTag from the evaluator survives persistence and scoring as D1 evidence, not lost to a criterion-id mismatch', async (t) => {
  mockFetchOnce(t, () => textBlockResponse({
    criterionScores: { c1: 1, c2: 2 },
    explicitUnsafeDomains: [],
    patternTags: { D1: 'informal_diagnosis_workaround' },
    needsFollowUp: false,
    followUpPrompt: null,
    transitionLine: 'Thanks for walking me through that.',
  }));
  const evaluation = await evaluateInterviewTurn(ENV, {
    interviewDef: INTERVIEW_DEF,
    priorTranscript: [{ role: 'assistant', content: INTERVIEW_DEF.primaryPrompt }],
    studentResponse: 'My intake process is...',
    followUpAlreadyUsed: false,
  });

  // Mirrors exactly what functions/api/certification/submit-interview-turn.js
  // persists into part3_conversation_state on finalize (criterionScores/
  // explicitUnsafeDomains/patternTags straight from the evaluation result).
  const persistedConversationState = {
    transcript: [],
    followUpUsed: false,
    finalized: true,
    criterionScores: evaluation.criterionScores,
    explicitUnsafeDomains: evaluation.explicitUnsafeDomains,
    patternTags: evaluation.patternTags,
  };

  const flags = interviewEvaluatorFlagsFromState(persistedConversationState);
  const scored = scoreInterviewConversation(INTERVIEW_DEF, persistedConversationState.criterionScores, flags);

  const d1Evidence = scored.evidencePoints.find((e) => e.domainId === 'D1');
  assert.ok(d1Evidence, 'a D1 evidence point must exist -- INTERVIEW_DEF\'s c1 touches D1');
  assert.equal(d1Evidence.patternTag, 'informal_diagnosis_workaround', 'the D1-keyed patternTag must reach D1\'s evidence point, not be dropped because it was mis-keyed by criterion id');
  assert.equal(d1Evidence.explicitUnsafe, false);

  const d2Evidence = scored.evidencePoints.find((e) => e.domainId === 'D2');
  assert.ok(d2Evidence, 'a D2 evidence point must also exist -- INTERVIEW_DEF\'s c2 touches D2');
  assert.equal(d2Evidence.patternTag, null, 'D2 must show no pattern tag -- only D1 was flagged by the evaluator');
});

// ---------------------------------------------------------------------------
// 9c. Type B critical-domain gate is not weakened by this hardening patch:
//     repeated matching D1 pattern evidence, produced through the real
//     evaluateInterviewTurn() -> scoreInterviewConversation() chain across
//     two independent interview items, still trips evaluateCriticalDomains().
// ---------------------------------------------------------------------------

test('repeated matching D1 pattern evidence across two independent interview items still trips the Type B critical-domain gate', async (t) => {
  mockFetchOnce(t, () => textBlockResponse({
    criterionScores: { c1: 1, c2: 2 },
    explicitUnsafeDomains: [],
    patternTags: { D1: 'informal_diagnosis_workaround' },
    needsFollowUp: false, followUpPrompt: null, transitionLine: 'ok',
  }));
  const evalA = await evaluateInterviewTurn(ENV, {
    interviewDef: INTERVIEW_DEF,
    priorTranscript: [{ role: 'assistant', content: INTERVIEW_DEF.primaryPrompt }],
    studentResponse: 'turn A',
    followUpAlreadyUsed: false,
  });
  const flagsA = interviewEvaluatorFlagsFromState({ explicitUnsafeDomains: evalA.explicitUnsafeDomains, patternTags: evalA.patternTags });
  const scoredA = scoreInterviewConversation(INTERVIEW_DEF, evalA.criterionScores, flagsA);

  mockFetchOnce(t, () => textBlockResponse({
    criterionScores: { x1: 1 },
    explicitUnsafeDomains: [],
    patternTags: { D1: 'informal_diagnosis_workaround' },
    needsFollowUp: false, followUpPrompt: null, transitionLine: 'ok',
  }));
  const evalB = await evaluateInterviewTurn(ENV, {
    interviewDef: INTERVIEW_DEF_2,
    priorTranscript: [{ role: 'assistant', content: INTERVIEW_DEF_2.primaryPrompt }],
    studentResponse: 'turn B',
    followUpAlreadyUsed: false,
  });
  const flagsB = interviewEvaluatorFlagsFromState({ explicitUnsafeDomains: evalB.explicitUnsafeDomains, patternTags: evalB.patternTags });
  const scoredB = scoreInterviewConversation(INTERVIEW_DEF_2, evalB.criterionScores, flagsB);

  const allEvidencePoints = [...scoredA.evidencePoints, ...scoredB.evidencePoints];
  const domainResults = evaluateCriticalDomains(allEvidencePoints, HEAD_SPA_CRITICAL_DOMAINS);
  const d1 = domainResults.find((d) => d.domainId === 'D1');
  assert.equal(d1.cleared, false, 'two independent same-pattern D1 evidence points must fail the domain (matches HEAD_SPA_CRITICAL_DOMAINS D1 typeBThreshold)');
  assert.equal(d1.failureType, 'repeated_pattern');
  assert.equal(d1.evidenceCount, 2);

  const d2 = domainResults.find((d) => d.domainId === 'D2');
  assert.equal(d2.cleared, true, 'D2 was never flagged and must remain cleared');
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
  // The gate lives in the shared issuance authority every issuance path calls.
  const endpoint = readFileSync(path.join(REPO_ROOT, 'functions/api/issue-certificate.js'), 'utf8');
  assert.match(endpoint, /ensureCertificateIssued/);
  const src = readFileSync(path.join(REPO_ROOT, 'functions/_lib/certification/certificate-issuance.mjs'), 'utf8');
  assert.match(src, /certification_decision:\s*'eq\.pass'/);
});
