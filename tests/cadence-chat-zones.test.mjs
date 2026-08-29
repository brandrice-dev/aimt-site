// Ask Cadence (Chat) — Zone A / Zone B implementation, per the Cadence
// Character & Instruction Constitution
// (docs/course-audit/00-cadence-character-instruction-constitution.md).
//
// The prior ASK_CADENCE_BASE_GUARDRAIL required every substantive claim to
// trace to exactly one of three sources (module guide text, the visible
// conversation, or "safe general reasoning that adds no new professional
// claim") and stated outright that "a missing course fact is never
// permission to complete the answer from pretrained/general knowledge."
// That closed-corpus rule was identified, via the constitution, as the
// actual over-correction: it flagged accurate, safe, in-scope explanations
// (chat-01's shedding-mechanism answer) as failures, because Ask Cadence's
// only supplied curriculum content is a terse per-module topic paragraph,
// never the real lesson text a genuine explanation would need to ground
// itself in literally.
//
// This file proves the replacement: ordinary tutoring (Zone A) may use
// accurate general knowledge freely, while diagnosis/prescribing/referral/
// exact-threshold material (Zone B) still requires strict grounding or
// deference, and the active-checkpoint boundary (Zone C, a separate task's
// work, untouched here) remains fully intact. Structural/textual checks
// only -- never exact canned response wording or personality keywords
// ("great question," specific empathetic phrases), since a live model's
// actual phrasing is not something a deterministic test can or should pin.
//
// No Anthropic API calls. Run: node tests/cadence-chat-zones.test.mjs

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

async function withMockFetch(mockImpl, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = mockImpl;
  try { return await fn(); } finally { globalThis.fetch = original; }
}

// ─────────────────────────────────────────────────────────────────────────
// A. NORMAL EDUCATIONAL EXPLANATION MAY USE ACCURATE GENERAL KNOWLEDGE
// ─────────────────────────────────────────────────────────────────────────
(function zoneAPermittedTests() {
  check('A. ZONE A PERMITTED', 'Base guardrail explicitly permits using accurate general knowledge freely for ordinary tutoring',
    /use accurate general knowledge freely/.test(BASE));
  for (const action of ['explain why something happens', 'clarify terminology', 'make connections', 'use analogies', 'add useful background context', 'reframe a concept a different way']) {
    check('A. ZONE A PERMITTED', `Base guardrail names "${action}" as a permitted Zone A action`, BASE.includes(action));
  }
  check('A. ZONE A PERMITTED', 'Explicitly frames this as normal, welcome instructor behavior, not a violation',
    /normal, welcome instructor behavior, not a violation/.test(BASE));
  check('A. ZONE A PERMITTED', 'Does not force an "the course doesn\'t say..." disclaimer on every ordinary explanation',
    /Do not announce "the course doesn't say\.\.\." every time you add ordinary explanatory context/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// B. NO LITERAL-TRACE-TO-SUPPLIED-CONTEXT REQUIREMENT
// ─────────────────────────────────────────────────────────────────────────
(function noClosedCorpusTests() {
  check('B. NO CLOSED CORPUS', 'The old "ground every substantive claim in exactly one of three sources" framing is gone',
    !/exactly one of three sources/.test(BASE));
  check('B. NO CLOSED CORPUS', 'The old "not even a real, well-known fact from general knowledge" line is gone',
    !/not even a real, well-known fact from general knowledge/.test(BASE));
  check('B. NO CLOSED CORPUS', 'The old "a missing course fact is never permission" line is gone',
    !/a missing course fact is never permission/.test(BASE));
  check('B. NO CLOSED CORPUS', 'The old blanket "physiological mechanism, medical explanation" prohibited-category pairing is gone',
    !/physiological mechanism, medical explanation/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// C. GENERAL KNOWLEDGE MAY NOT SILENTLY CREATE AIMT POLICY
// ─────────────────────────────────────────────────────────────────────────
(function noSilentPolicyTests() {
  check('C. NO SILENT POLICY', 'Carries the constitution\'s exact north-star line: general knowledge may help explain AIMT, it may not silently create AIMT policy',
    /General knowledge may help explain AIMT\. It may not silently create AIMT policy\./.test(BASE));
  check('C. NO SILENT POLICY', 'Zone A general knowledge is conditioned on staying consistent with what AIMT teaches',
    /is consistent with what AIMT teaches/.test(BASE));
  check('C. NO SILENT POLICY', 'Zone A general knowledge is conditioned on not silently becoming an AIMT standard or rule',
    /does not silently become an AIMT standard or rule/.test(BASE));
  check('C. NO SILENT POLICY', 'Zone A general knowledge is conditioned on not materially changing what the practitioner should do',
    /does not materially change what the practitioner should do/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// D. HIGH-STAKES / PRACTICE-AUTHORITY GUIDANCE STILL REQUIRES STRICT
//    GROUNDING OR DEFERENCE (ZONE B)
// ─────────────────────────────────────────────────────────────────────────
(function zoneBStillStrictTests() {
  for (const category of ['diagnosis', 'differential diagnosis', 'prescribing or treating a medical condition', 'contraindications', 'referral thresholds', 'sanitation requirements', 'legal or licensure requirements', 'safety-critical procedure rules', 'exact clinical thresholds', 'exact treatment or product-efficacy claims']) {
    check('D. ZONE B STRICT', `Base guardrail names "${category}" as requiring the stricter standard`, BASE.includes(category));
  }
  check('D. ZONE B STRICT', 'Instructs staying inside the module guide content, AIMT\'s approved curriculum, or clearly deferring to an appropriate named authority',
    /clearly defer to the appropriate authority/.test(BASE) && /a physician, a dermatologist, a licensing board, an accountant/.test(BASE));
  check('D. ZONE B STRICT', 'Explicitly bars general pretrained knowledge from silently becoming a practice rule, exact number, or policy',
    /never let general pretrained knowledge silently become a practice rule, an exact number, or a policy AIMT itself hasn't set/.test(BASE));
  check('D. ZONE B STRICT', 'The separate diagnostic-decline clause (decline briefly, redirect to observation) is unchanged and still present',
    /decline the diagnostic guess briefly/.test(BASE) && /naming or choosing between named medical conditions/.test(BASE) &&
    /do not compensate for declining a diagnosis by adding medical detail/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// E. EXACT FABRICATED BUSINESS/INDUSTRY BENCHMARKS REMAIN PROHIBITED
// ─────────────────────────────────────────────────────────────────────────
(function noFabricatedBenchmarksTests() {
  check('E. NO FABRICATED BENCHMARKS', 'Base guardrail still explicitly bars exact business or industry benchmarks presented as authoritative fact',
    /exact business or industry benchmarks presented as authoritative fact/.test(BASE));
  check('E. NO FABRICATED BENCHMARKS', 'Still gives the natural (non-robotic) redirect for a genuine Zone B gap',
    /the course doesn't give us a specific number for that/.test(BASE) && /not as a recurring disclaimer/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// F. ACTIVE-CHECKPOINT ANTI-ANSWER BOUNDARY REMAINS FULLY INTACT
// ─────────────────────────────────────────────────────────────────────────
(function checkpointBoundaryIntactTests() {
  check('F. CHECKPOINT BOUNDARY INTACT', 'General checkpoint-answer refusal clause unchanged: never spell out the qualifying answer',
    /Never provide, write, dictate, or spell out the qualifying answer to any required checkpoint question/.test(BASE));
  check('F. CHECKPOINT BOUNDARY INTACT', 'Active-checkpoint guardrail still forbids stating/paraphrasing the rubric and enumerating required elements',
    /state or paraphrase the rubric/.test(ACTIVE) && /enumerate or hint at the required elements/.test(ACTIVE));
  check('F. CHECKPOINT BOUNDARY INTACT', 'Active-checkpoint guardrail still forbids supplying module-specific facts/reasoning components that would satisfy the checkpoint',
    /supply module-specific facts or reasoning components that would themselves satisfy the checkpoint/.test(ACTIVE));
  check('F. CHECKPOINT BOUNDARY INTACT', 'Active-checkpoint guardrail still forbids "is testing," "is really asking," and "wants" phrasing',
    /"is testing,"/.test(ACTIVE) && /"is really asking,"/.test(ACTIVE) && /"wants" them to conclude/.test(ACTIVE));
  check('F. CHECKPOINT BOUNDARY INTACT', 'Active-checkpoint guardrail still forbids composing a near-submittable response or revealing hidden evaluation criteria',
    /compose or substantially compose a response the student could submit as their own/.test(ACTIVE) && /reveal any hidden evaluation criteria/.test(ACTIVE));
  check('F. CHECKPOINT BOUNDARY INTACT', 'Active-checkpoint guardrail still requires explaining at a HIGHER LEVEL OF ABSTRACTION than the checkpoint\'s own scenario',
    /HIGHER LEVEL OF ABSTRACTION than the checkpoint/.test(ACTIVE));
})();

// ─────────────────────────────────────────────────────────────────────────
// G. CADENCE MAY STILL TEACH CONCEPTS DURING AN ACTIVE CHECKPOINT
// ─────────────────────────────────────────────────────────────────────────
(function checkpointTeachingAllowedTests() {
  check('G. CHECKPOINT TEACHING ALLOWED', 'Active-checkpoint guardrail explicitly permits clarifying terminology, explaining the broader concept abstractly, asking a guiding question, pointing to lesson material, and helping organize reasoning',
    /clarify terminology/.test(ACTIVE) && /explain the broader underlying concept at an abstract level/.test(ACTIVE) &&
    /ask a guiding question/.test(ACTIVE) && /point the student back to relevant lesson material/.test(ACTIVE) &&
    /help them organize their own reasoning/.test(ACTIVE));
  check('G. CHECKPOINT TEACHING ALLOWED', 'Base guardrail frames explaining the underlying concept as welcome -- only describing the evaluation itself is not',
    /explaining the underlying concept is welcome; describing the evaluation itself is not/.test(BASE));
  check('G. CHECKPOINT TEACHING ALLOWED', 'Base guardrail instructs not refusing punitively -- explain the concept, ask a guiding question, or point to course material',
    /do not refuse punitively/.test(BASE) && /explain the underlying concept at a general level/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// H. LANGUAGE FAIRNESS UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function languageFairnessUnchangedTests() {
  check('H. LANGUAGE FAIRNESS UNCHANGED', 'Still bars correcting/flagging/commenting on grammar, spelling, spoken phrasing, or non-native English',
    /grammar, spelling, spoken phrasing, or non-native English/.test(BASE));
  check('H. LANGUAGE FAIRNESS UNCHANGED', 'Still requires responding exactly as it would to perfectly-phrased English, unless writing help is requested',
    /exactly as you would for perfectly-phrased English/.test(BASE) && /explicitly ask for writing help/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// I. CONTINUITY RULES UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function continuityUnchangedTests() {
  check('I. CONTINUITY UNCHANGED', 'Still requires referencing only what is explicitly visible in the conversation as something remembered',
    /Only reference what is explicitly visible in this conversation/.test(BASE));
  check('I. CONTINUITY UNCHANGED', 'Still bars implying memory of anything beyond what is actually shown',
    /never imply memory of anything beyond what is actually shown to you here/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// J. SONNET 5 CHAT EXECUTION CONFIG UNCHANGED: adaptive / low / 2048
// ─────────────────────────────────────────────────────────────────────────
(function sonnetExecConfigUnchangedTests() {
  check('J. SONNET CHAT CONFIG UNCHANGED', 'CHAT_MAX_TOKENS is still exactly 2048', CHAT_MAX_TOKENS === 2048);
  check('J. SONNET CHAT CONFIG UNCHANGED', 'CHAT_EFFORT is still exactly "low"', CHAT_EFFORT === 'low');
  const cfg = resolveChatExecutionConfig('claude-sonnet-5');
  check('J. SONNET CHAT CONFIG UNCHANGED', 'resolveChatExecutionConfig("claude-sonnet-5") still returns thinking:adaptive, effort:low, maxTokens:2048',
    cfg.thinking && cfg.thinking.type === 'adaptive' && cfg.outputConfig && cfg.outputConfig.effort === 'low' && cfg.maxTokens === 2048);
})();

await (async function sonnetExecConfigEndToEndTests() {
  const capture = {};
  const mock = async (url, options) => {
    capture.body = JSON.parse(options.body);
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: 'A reply.' }], stop_reason: 'end_turn', model: 'claude-sonnet-5' }) };
  };
  await withMockFetch(mock, () => askCadenceServerSide(
    { ANTHROPIC_API_KEY: 'mock-key', CADENCE_CHAT_MODEL: 'claude-sonnet-5' },
    { guideSystemPrompt: 'MODULE GUIDE TEXT', boundedContext: [], studentMessage: 'A question.', activeCheckpointGuardrailText: null }
  ));
  check('J. SONNET CHAT CONFIG UNCHANGED', 'Live request still sends max_tokens:2048, thinking:adaptive, output_config.effort:low -- the guardrail text change did not touch execution config',
    capture.body.max_tokens === 2048 && capture.body.thinking.type === 'adaptive' && capture.body.output_config.effort === 'low');
})();

// ─────────────────────────────────────────────────────────────────────────
// K. SONNET 5 GRADING REMAINS APPROVED: adaptive / medium / 4096
// ─────────────────────────────────────────────────────────────────────────
(function gradingUnchangedTests() {
  const registry = getCadenceModelRegistry();
  check('K. GRADING UNCHANGED', 'CADENCE_GRADING_MODEL.approved is still exactly claude-sonnet-5',
    registry.roles.CADENCE_GRADING_MODEL.approved === 'claude-sonnet-5');
  check('K. GRADING UNCHANGED', 'GRADING_MAX_TOKENS is still exactly 4096', GRADING_MAX_TOKENS === 4096);
  check('K. GRADING UNCHANGED', 'GRADING_EFFORT is still exactly "medium"', GRADING_EFFORT === 'medium');
  const cfg = registry.roles.CADENCE_GRADING_MODEL.gradingExecutionConfig;
  check('K. GRADING UNCHANGED', 'Registry-recorded grading execution config still shows thinking:adaptive, effort:medium, maxTokens:4096',
    cfg.thinking.type === 'adaptive' && cfg.outputConfigEffort === 'medium' && cfg.maxTokens === 4096);
  check('K. GRADING UNCHANGED', 'ask-cadence.mjs still has zero import dependency on checkpoint-evaluation.mjs (grading/chat stay decoupled)',
    (() => {
      const src = readFileSync(path.join(ROOT, 'functions/_lib/cadence/ask-cadence.mjs'), 'utf8');
      return !/from ['"][^'"]*checkpoint-evaluation\.mjs['"]/.test(src);
    })());
})();

// ─────────────────────────────────────────────────────────────────────────
// L. MODULE 12 UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function module12UnchangedTests() {
  check('L. MODULE 12 UNCHANGED', 'bankVersion unchanged', bankVersion === 'headspa-fe-bank-v1-2026-08-26');
  check('L. MODULE 12 UNCHANGED', 'SOURCE_HASHES unchanged', JSON.stringify(SOURCE_HASHES) === JSON.stringify({
    knowledgeBankMd: '4fb96d8f9c5c4f1f0d542f1c6965e859417af0e1cceb8d2aa77e82f2221294d5',
    appliedCasesMd: 'df60822daa285d36014b01cdbd85436ac255daa3d53cf23dc96175e281a6769d',
    interviewBankMd: 'ee76472b379a9ea3c3129389d655499dc371c7740c9ab625180b239fdc3f15c7',
  }));
  check('L. MODULE 12 UNCHANGED', 'Bank item counts unchanged (120/12/9)', knowledgeBank.length === 120 && caseBank.length === 12 && interviewBank.length === 9);
})();

// ─────────────────────────────────────────────────────────────────────────
// M. CHECKPOINT PROMPTS / RUBRICS UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function checkpointContentUnchangedTests() {
  const rubrics = loadCheckpointRubrics();
  check('M. CHECKPOINT CONTENT UNCHANGED', 'Full M0-M11 checkpoint rubric/question set is byte-identical to its pre-existing fingerprint',
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
