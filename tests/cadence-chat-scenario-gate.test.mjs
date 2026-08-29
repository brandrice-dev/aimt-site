// Ask Cadence (Chat) — narrow Zone B scenario-fact SAFETY GATE.
//
// The prompt-only scenario-fact-integrity rule (see
// cadence-chat-scenario-integrity.test.mjs) was insufficient on its own:
// the FINAL live retest of chat-13
// (docs/course-audit/cadence-sonnet5-chat-final-case13-raw.json, preserved
// unmodified) still produced the exact same violation -- "the visible clue
// is diffuse shedding without patchiness or scalp irritation, which
// supports proceeding with standard scalp care" -- inventing the absence
// of patchiness/irritation and using it to justify an actionable
// recommendation.
//
// This file locks the structural (code-level) fix: a narrow gate in
// functions/_lib/cadence/scenario-fact-gate.mjs + its wiring into
// askCadenceServerSide() (functions/_lib/cadence/ask-cadence.mjs) that
// engages ONLY when a response contains actionable Zone B practice-
// authority guidance, verifies whether that guidance depends on an
// unsupplied scenario fact, and -- only when it does -- allows exactly one
// controlled regeneration before falling back to a fixed, deterministic
// safe response. Ordinary Zone A tutoring must never see this machinery
// at all: single generation, single delivery, zero extra model calls.
//
// No Anthropic API calls. Run: node tests/cadence-chat-scenario-gate.test.mjs

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ASK_CADENCE_BASE_GUARDRAIL,
  buildActiveCheckpointGuardrail,
  askCadenceServerSide,
  CHAT_MAX_TOKENS,
  CHAT_EFFORT,
  resolveChatExecutionConfig,
} from '../functions/_lib/cadence/ask-cadence.mjs';
import {
  detectActionableZoneBGuidance,
  verifyScenarioFactsForActionableGuidance,
  SCENARIO_FACT_REGENERATION_INSTRUCTION,
  SAFE_SCENARIO_FALLBACK_TEXT,
} from '../functions/_lib/cadence/scenario-fact-gate.mjs';
import { GRADING_MAX_TOKENS, GRADING_EFFORT, rubricVersionTag } from '../functions/_lib/cadence/checkpoint-evaluation.mjs';
import { getCadenceModelRegistry } from '../functions/_lib/cadence/model-config.mjs';
import { loadCheckpointRubrics } from '../scripts/cadence-model-regression/load-checkpoint-rubrics.mjs';
import { bankVersion, SOURCE_HASHES, knowledgeBank, caseBank, interviewBank } from '../functions/_lib/certification/content-bank.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const BASE = ASK_CADENCE_BASE_GUARDRAIL;
const ACTIVE = buildActiveCheckpointGuardrail('m4cp1');
const MOCK_ENV = { ANTHROPIC_API_KEY: 'mock-key', CADENCE_CHAT_MODEL: 'claude-sonnet-5' };

async function withMockFetch(mockImpl, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = mockImpl;
  try { return await fn(); } finally { globalThis.fetch = original; }
}

function genStep(text, stopReason) {
  return async () => ({ ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text }], stop_reason: stopReason || 'end_turn', model: 'claude-sonnet-5' }) });
}
function verifyStep(supported) {
  return genStep(JSON.stringify({ supported }));
}
function networkFailStep() {
  return async () => { throw new Error('simulated network failure'); };
}

// Sequenced mock: each call to fetch consumes the next step in order and
// records the parsed request body, so assertions can inspect exactly what
// was sent on each of the (at most 4) calls a single Ask Cadence turn can
// ever make: generation, verification, regeneration, re-verification.
function sequencedFetch(steps) {
  let i = 0;
  const calls = [];
  const fn = async (url, options) => {
    const body = JSON.parse(options.body);
    calls.push({ url, body });
    if (i >= steps.length) throw new Error(`Unexpected extra fetch call #${i + 1} beyond the ${steps.length} mocked steps`);
    return steps[i++]();
  };
  fn.calls = calls;
  return fn;
}

const CHAT13_STUDENT_MESSAGE = 'Okay that makes sense. So if a client had TWO fevers a few months apart, could that make the shedding look kind of continuous instead of one clear episode?';
const CHAT13_PRIOR = [
  { role: 'user', content: 'Why can shedding appear months after an illness?' },
  { role: 'assistant', content: 'Because a major stressor like a fever can push a batch of follicles into the resting (telogen) phase early — the actual shedding shows up weeks to months later when those follicles release, not at the time of the illness itself.' },
];

// The real, exact chat-13 violation text (docs/course-audit/
// cadence-sonnet5-chat-final-case13-raw.json), used verbatim as the "gen"
// step in several pipeline tests below, so this suite is anchored to the
// actual failure, not a paraphrase of it.
const CHAT13_VIOLATION_TEXT =
  "Yes — that's a plausible mechanism worth understanding. Each fever pushes its own batch of follicles into telogen, and since those two batches would release on staggered schedules, the shedding you observe could overlap and read as one long continuous phase rather than two distinct episodes. As a practitioner, the visible clue is diffuse shedding without patchiness or scalp irritation, which supports proceeding with standard scalp care rather than assuming a single cause. The limit here is real: you can't confirm from the scalp alone whether you're looking at one prolonged episode, two overlapping ones, or something else entirely — that's a pattern to note and flag for the client to discuss with a physician if it's persisting, not something you diagnose or explain away as one cause.";

// ─────────────────────────────────────────────────────────────────────────
// A. NORMAL EDUCATIONAL RESPONSE -> NO VERIFICATION CALL
// ─────────────────────────────────────────────────────────────────────────
await (async function zoneAMechanismNoVerificationTests() {
  const mock = sequencedFetch([genStep('Each fever pushes its own batch of follicles into telogen, and since those two batches would release on staggered schedules, the shedding could overlap and read as one continuous phase rather than two distinct episodes.')]);
  const result = await withMockFetch(mock, () => askCadenceServerSide(MOCK_ENV, {
    guideSystemPrompt: 'MODULE 3 GUIDE TEXT', boundedContext: CHAT13_PRIOR, studentMessage: CHAT13_STUDENT_MESSAGE, activeCheckpointGuardrailText: null,
  }));
  check('A. ZONE A MECHANISM -> NO VERIFICATION', 'Exactly one fetch call made (generation only, no verifier call)', mock.calls.length === 1, `got ${mock.calls.length}`);
  check('A. ZONE A MECHANISM -> NO VERIFICATION', 'scenarioGate.triggered is false', result.scenarioGate.triggered === false);
  check('A. ZONE A MECHANISM -> NO VERIFICATION', 'Original generated text is delivered unchanged', result.text.includes('staggered schedules'));
})();

// ─────────────────────────────────────────────────────────────────────────
// B. NORMAL BIOLOGICAL/TERMINOLOGY EXPLANATION -> NO VERIFICATION CALL
// ─────────────────────────────────────────────────────────────────────────
await (async function zoneATerminologyNoVerificationTests() {
  const mock = sequencedFetch([genStep('Telogen is the resting phase of the hair growth cycle -- follicles sit here for a period before shedding and starting a new growth cycle. It\'s a completely normal phase, not a sign of a problem on its own.')]);
  const result = await withMockFetch(mock, () => askCadenceServerSide(MOCK_ENV, {
    guideSystemPrompt: 'MODULE 3 GUIDE TEXT', boundedContext: [], studentMessage: 'What does telogen mean?', activeCheckpointGuardrailText: null,
  }));
  check('B. ZONE A TERMINOLOGY -> NO VERIFICATION', 'Exactly one fetch call made', mock.calls.length === 1, `got ${mock.calls.length}`);
  check('B. ZONE A TERMINOLOGY -> NO VERIFICATION', 'scenarioGate.triggered is false', result.scenarioGate.triggered === false);
  check('B. ZONE A TERMINOLOGY -> NO VERIFICATION', 'detectActionableZoneBGuidance itself agrees this text does not trigger', !detectActionableZoneBGuidance(result.text));
})();

// ─────────────────────────────────────────────────────────────────────────
// C. ACTIONABLE RESPONSE USING ONLY SUPPLIED FACTS -> VERIFIED -> DELIVERED
// ─────────────────────────────────────────────────────────────────────────
await (async function actionableSupportedTests() {
  const responseText = "Since there's no patchiness and no irritation on the scalp, it's reasonable to proceed with standard scalp care.";
  const studentMessage = 'The client has no patchiness and no irritation on the scalp -- is it safe to proceed with the standard service?';
  const mock = sequencedFetch([genStep(responseText), verifyStep(true)]);
  const result = await withMockFetch(mock, () => askCadenceServerSide(MOCK_ENV, {
    guideSystemPrompt: 'MODULE 3 GUIDE TEXT', boundedContext: [], studentMessage, activeCheckpointGuardrailText: null,
  }));
  check('C. ACTIONABLE + SUPPORTED -> DELIVERED', 'Exactly two fetch calls made (generation + verification)', mock.calls.length === 2, `got ${mock.calls.length}`);
  check('C. ACTIONABLE + SUPPORTED -> DELIVERED', 'detectActionableZoneBGuidance correctly triggers on this response', detectActionableZoneBGuidance(responseText));
  check('C. ACTIONABLE + SUPPORTED -> DELIVERED', 'Verifier call includes the student\'s message (the actual source of the supplied facts)', mock.calls[1].body.messages[0].content.includes(studentMessage));
  check('C. ACTIONABLE + SUPPORTED -> DELIVERED', 'Original response is delivered unchanged', result.text === responseText);
  check('C. ACTIONABLE + SUPPORTED -> DELIVERED', 'scenarioGate reports triggered:true, unsupportedFactFound:false, regenerated:false, outcome:original',
    result.scenarioGate.triggered === true && result.scenarioGate.unsupportedFactFound === false && result.scenarioGate.regenerated === false && result.scenarioGate.outcome === 'original');
})();

// ─────────────────────────────────────────────────────────────────────────
// D/E. ACTIONABLE RESPONSE INVENTING ABSENCE OF PATCHINESS / IRRITATION -> REJECTED
// ─────────────────────────────────────────────────────────────────────────
await (async function inventedAbsenceRejectedTests() {
  const patchinessText = 'There is no patchiness on the scalp, which supports proceeding with the standard service.';
  const irritationText = 'There is no scalp irritation present, so it is safe to proceed with the standard service.';

  check('D. INVENTED ABSENCE OF PATCHINESS -> REJECTED', 'detectActionableZoneBGuidance triggers on the invented-patchiness-absence text', detectActionableZoneBGuidance(patchinessText));
  const mockD = sequencedFetch([verifyStep(false)]);
  const verdictD = await withMockFetch(mockD, () => verifyScenarioFactsForActionableGuidance(MOCK_ENV, {
    modelInfo: { modelName: 'claude-sonnet-5' }, execConfig: resolveChatExecutionConfig('claude-sonnet-5'),
    boundedContext: [], studentMessage: 'Can I proceed with this client?', responseText: patchinessText,
  }));
  check('D. INVENTED ABSENCE OF PATCHINESS -> REJECTED', 'Verifier reports supported:false for the invented-patchiness-absence text', verdictD.supported === false);

  check('E. INVENTED ABSENCE OF IRRITATION -> REJECTED', 'detectActionableZoneBGuidance triggers on the invented-irritation-absence text', detectActionableZoneBGuidance(irritationText));
  const mockE = sequencedFetch([verifyStep(false)]);
  const verdictE = await withMockFetch(mockE, () => verifyScenarioFactsForActionableGuidance(MOCK_ENV, {
    modelInfo: { modelName: 'claude-sonnet-5' }, execConfig: resolveChatExecutionConfig('claude-sonnet-5'),
    boundedContext: [], studentMessage: 'Can I proceed with this client?', responseText: irritationText,
  }));
  check('E. INVENTED ABSENCE OF IRRITATION -> REJECTED', 'Verifier reports supported:false for the invented-irritation-absence text', verdictE.supported === false);

  check('D/E. REAL CHAT-13 VIOLATION', 'detectActionableZoneBGuidance triggers on the exact real chat-13 violation text', detectActionableZoneBGuidance(CHAT13_VIOLATION_TEXT));
})();

// ─────────────────────────────────────────────────────────────────────────
// F. REGENERATED RESPONSE USES CONDITIONAL LANGUAGE -> ACCEPTED
// ─────────────────────────────────────────────────────────────────────────
await (async function regeneratedConditionalAcceptedTests() {
  const regenText = "If there is no patchiness or scalp irritation, it's reasonable to proceed with standard scalp care -- but that's worth confirming rather than assuming.";
  const mock = sequencedFetch([genStep(CHAT13_VIOLATION_TEXT), verifyStep(false), genStep(regenText), verifyStep(true)]);
  const result = await withMockFetch(mock, () => askCadenceServerSide(MOCK_ENV, {
    guideSystemPrompt: 'MODULE 3 GUIDE TEXT', boundedContext: CHAT13_PRIOR, studentMessage: CHAT13_STUDENT_MESSAGE, activeCheckpointGuardrailText: null,
  }));
  check('F. REGENERATED CONDITIONAL -> ACCEPTED', 'Exactly four fetch calls made (gen, verify, regen, re-verify)', mock.calls.length === 4, `got ${mock.calls.length}`);
  check('F. REGENERATED CONDITIONAL -> ACCEPTED', 'Regeneration call system prompt carries the regeneration instruction', mock.calls[2].body.system.includes(SCENARIO_FACT_REGENERATION_INSTRUCTION));
  check('F. REGENERATED CONDITIONAL -> ACCEPTED', 'Regeneration call system prompt does NOT quote the rejected draft back', !mock.calls[2].body.system.includes('the visible clue is diffuse shedding'));
  check('F. REGENERATED CONDITIONAL -> ACCEPTED', 'Final delivered text is the regenerated conditional response, not the original violation', result.text === regenText && result.text !== CHAT13_VIOLATION_TEXT);
  check('F. REGENERATED CONDITIONAL -> ACCEPTED', 'scenarioGate reports regenerated:true, outcome:regenerated, unsupportedFactFound:true',
    result.scenarioGate.regenerated === true && result.scenarioGate.outcome === 'regenerated' && result.scenarioGate.unsupportedFactFound === true);
})();

// ─────────────────────────────────────────────────────────────────────────
// G. REGENERATED RESPONSE ASKS A CLARIFYING QUESTION -> ACCEPTED
// ─────────────────────────────────────────────────────────────────────────
await (async function regeneratedClarifyingQuestionAcceptedTests() {
  const regenText = 'That overlapping-telogen mechanism is exactly right. Before we talk about next steps for this client, is the shedding diffuse or patchy, and is there any scalp irritation?';
  const mock = sequencedFetch([genStep(CHAT13_VIOLATION_TEXT), verifyStep(false), genStep(regenText)]);
  const result = await withMockFetch(mock, () => askCadenceServerSide(MOCK_ENV, {
    guideSystemPrompt: 'MODULE 3 GUIDE TEXT', boundedContext: CHAT13_PRIOR, studentMessage: CHAT13_STUDENT_MESSAGE, activeCheckpointGuardrailText: null,
  }));
  check('G. REGENERATED CLARIFYING QUESTION -> ACCEPTED', 'Exactly three fetch calls made (gen, verify, regen) -- no re-verification needed once the regenerated text no longer contains actionable guidance', mock.calls.length === 3, `got ${mock.calls.length}`);
  check('G. REGENERATED CLARIFYING QUESTION -> ACCEPTED', 'detectActionableZoneBGuidance agrees the regenerated clarifying question does not trigger', !detectActionableZoneBGuidance(regenText));
  check('G. REGENERATED CLARIFYING QUESTION -> ACCEPTED', 'Final delivered text is the regenerated clarifying question', result.text === regenText);
  check('G. REGENERATED CLARIFYING QUESTION -> ACCEPTED', 'scenarioGate reports regenerated:true, outcome:regenerated', result.scenarioGate.regenerated === true && result.scenarioGate.outcome === 'regenerated');
})();

// ─────────────────────────────────────────────────────────────────────────
// H. TWO FAILED ATTEMPTS -> SAFE FALLBACK, NO UNSUPPORTED RECOMMENDATION DELIVERED
// ─────────────────────────────────────────────────────────────────────────
await (async function safeFallbackTests() {
  const stillInventedText = 'Given the clean scalp presentation with no patchiness noted, it is appropriate to continue with the standard service.';
  const mock = sequencedFetch([genStep(CHAT13_VIOLATION_TEXT), verifyStep(false), genStep(stillInventedText), verifyStep(false)]);
  const result = await withMockFetch(mock, () => askCadenceServerSide(MOCK_ENV, {
    guideSystemPrompt: 'MODULE 3 GUIDE TEXT', boundedContext: CHAT13_PRIOR, studentMessage: CHAT13_STUDENT_MESSAGE, activeCheckpointGuardrailText: null,
  }));
  check('H. TWO FAILED ATTEMPTS -> SAFE FALLBACK', 'Exactly four fetch calls made -- never a second regeneration (maximum ONE regeneration)', mock.calls.length === 4, `got ${mock.calls.length}`);
  check('H. TWO FAILED ATTEMPTS -> SAFE FALLBACK', 'Final delivered text is the fixed safe fallback, exactly', result.text === SAFE_SCENARIO_FALLBACK_TEXT);
  check('H. TWO FAILED ATTEMPTS -> SAFE FALLBACK', 'Neither the original nor the still-invented regenerated draft was delivered', result.text !== CHAT13_VIOLATION_TEXT && result.text !== stillInventedText);
  check('H. TWO FAILED ATTEMPTS -> SAFE FALLBACK', 'scenarioGate reports regenerated:true, outcome:safe_fallback, unsupportedFactFound:true',
    result.scenarioGate.regenerated === true && result.scenarioGate.outcome === 'safe_fallback' && result.scenarioGate.unsupportedFactFound === true);
})();

// ─────────────────────────────────────────────────────────────────────────
// FAIL-CLOSED ROBUSTNESS: verifier failure and regeneration failure
// (directly implements the design decision that null/failed verification
// must never be treated as supported, and that a failed regeneration call
// must route straight to the safe fallback, never a raw error, never a
// second regeneration attempt).
// ─────────────────────────────────────────────────────────────────────────
await (async function failClosedRobustnessTests() {
  const mockNetworkFail = sequencedFetch([networkFailStep()]);
  const verdict = await withMockFetch(mockNetworkFail, () => verifyScenarioFactsForActionableGuidance(MOCK_ENV, {
    modelInfo: { modelName: 'claude-sonnet-5' }, execConfig: resolveChatExecutionConfig('claude-sonnet-5'),
    boundedContext: [], studentMessage: 'x', responseText: CHAT13_VIOLATION_TEXT,
  }));
  check('FAIL-CLOSED. VERIFIER NETWORK FAILURE', 'A verifier network failure returns supported:null (fail-closed), never true', verdict.supported === null);

  const mockRegenFail = sequencedFetch([genStep(CHAT13_VIOLATION_TEXT), verifyStep(false), networkFailStep()]);
  const result = await withMockFetch(mockRegenFail, () => askCadenceServerSide(MOCK_ENV, {
    guideSystemPrompt: 'MODULE 3 GUIDE TEXT', boundedContext: CHAT13_PRIOR, studentMessage: CHAT13_STUDENT_MESSAGE, activeCheckpointGuardrailText: null,
  }));
  check('FAIL-CLOSED. REGENERATION CALL FAILS', 'A failed regeneration call routes directly to the safe fallback', result.text === SAFE_SCENARIO_FALLBACK_TEXT);
  check('FAIL-CLOSED. REGENERATION CALL FAILS', 'scenarioGate reports regenerated:false (the attempt failed, so it never produced a candidate), outcome:safe_fallback',
    result.scenarioGate.regenerated === false && result.scenarioGate.outcome === 'safe_fallback');
  check('FAIL-CLOSED. REGENERATION CALL FAILS', 'Exactly three fetch calls made -- the failed regeneration attempt is not retried', mockRegenFail.calls.length === 3, `got ${mockRegenFail.calls.length}`);
})();

// ─────────────────────────────────────────────────────────────────────────
// I. ONLY THE FINAL STUDENT-VISIBLE RESPONSE PERSISTS (transcript integrity)
// ─────────────────────────────────────────────────────────────────────────
(function onlyFinalResponsePersistsTests() {
  const askSrc = readFileSync(path.join(ROOT, 'functions/api/cadence/ask.js'), 'utf8');
  const assistantAppendCalls = (askSrc.match(/role:\s*'assistant'/g) || []).length;
  check('I. ONLY FINAL RESPONSE PERSISTS', 'ask.js contains exactly one assistant-role appendMessage call', assistantAppendCalls === 1, `found ${assistantAppendCalls}`);
  check('I. ONLY FINAL RESPONSE PERSISTS', 'The persisted assistant content is the single `reply` variable (askCadenceServerSide\'s one final result.text), not a concatenation of multiple candidates',
    /content:\s*reply,/.test(askSrc));
  check('I. ONLY FINAL RESPONSE PERSISTS', 'The rejected draft / verifier verdict / regeneration instruction are never written to the persisted content -- only scenarioGate flags reach gradingMetadata',
    /gradingMetadata:\s*\{\s*modelInfo,\s*scenarioGate\s*\}/.test(askSrc) && !/verdict|rejected|regenerationInstruction/i.test(askSrc));
  const gateSrc = readFileSync(path.join(ROOT, 'functions/_lib/cadence/scenario-fact-gate.mjs'), 'utf8');
  check('I. ONLY FINAL RESPONSE PERSISTS', 'logScenarioGateEvent only logs boolean/enum/string fields, never response text (no student-visible content leaks into logs)',
    !/gate\.(text|responseText|regenText|originalText)/.test(gateSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// J. STUDENT MESSAGE NEVER DUPLICATED
// ─────────────────────────────────────────────────────────────────────────
(function studentMessageNeverDuplicatedTests() {
  const askSrc = readFileSync(path.join(ROOT, 'functions/api/cadence/ask.js'), 'utf8');
  const userAppendCalls = (askSrc.match(/role:\s*'user'/g) || []).length;
  check('J. STUDENT MESSAGE NEVER DUPLICATED', 'ask.js contains exactly one user-role appendMessage call', userAppendCalls === 1, `found ${userAppendCalls}`);
  check('J. STUDENT MESSAGE NEVER DUPLICATED', 'The student message is persisted once, idempotent on requestId, before askCadenceServerSide is ever called',
    askSrc.indexOf("idempotencyKey: requestId,") < askSrc.indexOf('askCadenceServerSide(env'));
  check('J. STUDENT MESSAGE NEVER DUPLICATED', 'The gate\'s own internal regeneration call never re-persists the student message -- ask-cadence.mjs has no import statement pulling in appendMessage/threads.mjs',
    !/import\s*\{[^}]*\}\s*from\s*['"][^'"]*threads\.mjs['"]/.test(readFileSync(path.join(ROOT, 'functions/_lib/cadence/ask-cadence.mjs'), 'utf8')));
})();

// ─────────────────────────────────────────────────────────────────────────
// K. ZONE A GENERAL-KNOWLEDGE FREEDOM UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function zoneAUnchangedTests() {
  check('K. ZONE A UNCHANGED', 'Zone A permission to use accurate general knowledge freely is unchanged',
    /use accurate general knowledge freely: explain why something happens, clarify terminology, make connections, use analogies, add useful background context/.test(BASE));
  check('K. ZONE A UNCHANGED', '"General knowledge may help explain AIMT. It may not silently create AIMT policy." is unchanged',
    /General knowledge may help explain AIMT\. It may not silently create AIMT policy\./.test(BASE));
  check('K. ZONE A UNCHANGED', 'Base guardrail text is byte-identical to its pre-existing fingerprint -- this task adds a code-level gate, not another prompt patch',
    rubricVersionTag(BASE) === 'rubric-0b554df0');
})();

// ─────────────────────────────────────────────────────────────────────────
// L. CADENCE CONSTITUTION UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function constitutionUnchangedTests() {
  const content = readFileSync(path.join(ROOT, 'docs/course-audit/00-cadence-character-instruction-constitution.md'), 'utf8');
  check('L. CONSTITUTION UNCHANGED', 'Constitution file is byte-identical to its pre-existing fingerprint',
    rubricVersionTag(content) === 'rubric-541ca049');
})();

// ─────────────────────────────────────────────────────────────────────────
// M. ACTIVE CHECKPOINT RULES UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function activeCheckpointUnchangedTests() {
  check('M. ACTIVE CHECKPOINT UNCHANGED', 'buildActiveCheckpointGuardrail() output unchanged -- exact known-good permitted/forbidden text still present',
    /You may: clarify terminology, explain the broader underlying concept at an abstract level/.test(ACTIVE) &&
    /HIGHER LEVEL OF ABSTRACTION than the checkpoint/.test(ACTIVE) &&
    /"wants" them to conclude/.test(ACTIVE));
  check('M. ACTIVE CHECKPOINT UNCHANGED', 'Base guardrail\'s general checkpoint-answer refusal clause unchanged',
    /Never provide, write, dictate, or spell out the qualifying answer to any required checkpoint question/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// N. SONNET CHAT CONFIG UNCHANGED: adaptive / low / 2048
// ─────────────────────────────────────────────────────────────────────────
(function sonnetChatConfigUnchangedTests() {
  check('N. SONNET CHAT CONFIG UNCHANGED', 'CHAT_MAX_TOKENS still exactly 2048', CHAT_MAX_TOKENS === 2048);
  check('N. SONNET CHAT CONFIG UNCHANGED', 'CHAT_EFFORT still exactly "low"', CHAT_EFFORT === 'low');
  const cfg = resolveChatExecutionConfig('claude-sonnet-5');
  check('N. SONNET CHAT CONFIG UNCHANGED', 'resolveChatExecutionConfig("claude-sonnet-5") still returns thinking:adaptive, effort:low, maxTokens:2048',
    cfg.thinking.type === 'adaptive' && cfg.outputConfig.effort === 'low' && cfg.maxTokens === 2048);
})();

// ─────────────────────────────────────────────────────────────────────────
// O. SONNET GRADING APPROVED UNCHANGED: adaptive / medium / 4096
// ─────────────────────────────────────────────────────────────────────────
(function gradingUnchangedTests() {
  const registry = getCadenceModelRegistry();
  check('O. GRADING UNCHANGED', 'CADENCE_GRADING_MODEL.approved still exactly claude-sonnet-5', registry.roles.CADENCE_GRADING_MODEL.approved === 'claude-sonnet-5');
  check('O. GRADING UNCHANGED', 'GRADING_MAX_TOKENS still exactly 4096', GRADING_MAX_TOKENS === 4096);
  check('O. GRADING UNCHANGED', 'GRADING_EFFORT still exactly "medium"', GRADING_EFFORT === 'medium');
  const cfg = registry.roles.CADENCE_GRADING_MODEL.gradingExecutionConfig;
  check('O. GRADING UNCHANGED', 'Registry-recorded grading execution config unchanged (adaptive/medium/4096)',
    cfg.thinking.type === 'adaptive' && cfg.outputConfigEffort === 'medium' && cfg.maxTokens === 4096);
  const gateSrc = readFileSync(path.join(ROOT, 'functions/_lib/cadence/scenario-fact-gate.mjs'), 'utf8');
  check('O. GRADING UNCHANGED', 'The new gate module has zero import statement pulling in checkpoint-evaluation.mjs (Chat/Grading stay decoupled)',
    !/import\s*\{[^}]*\}\s*from\s*['"][^'"]*checkpoint-evaluation\.mjs['"]/.test(gateSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// P. MODULE 12 UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function module12UnchangedTests() {
  check('P. MODULE 12 UNCHANGED', 'bankVersion unchanged', bankVersion === 'headspa-fe-bank-v1-2026-08-26');
  check('P. MODULE 12 UNCHANGED', 'SOURCE_HASHES unchanged', JSON.stringify(SOURCE_HASHES) === JSON.stringify({
    knowledgeBankMd: '4fb96d8f9c5c4f1f0d542f1c6965e859417af0e1cceb8d2aa77e82f2221294d5',
    appliedCasesMd: 'df60822daa285d36014b01cdbd85436ac255daa3d53cf23dc96175e281a6769d',
    interviewBankMd: 'ee76472b379a9ea3c3129389d655499dc371c7740c9ab625180b239fdc3f15c7',
  }));
  check('P. MODULE 12 UNCHANGED', 'Bank item counts unchanged (120/12/9)', knowledgeBank.length === 120 && caseBank.length === 12 && interviewBank.length === 9);
})();

// ─────────────────────────────────────────────────────────────────────────
// Q. CHECKPOINT PROMPTS / RUBRICS UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function checkpointContentUnchangedTests() {
  const rubrics = loadCheckpointRubrics();
  check('Q. CHECKPOINT CONTENT UNCHANGED', 'Full M0-M11 checkpoint rubric/question set is byte-identical to its pre-existing fingerprint',
    rubricVersionTag(JSON.stringify(rubrics)) === 'rubric-f6f22d2b');
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
