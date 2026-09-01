// Ask Cadence (Chat) — final trust + precision cleanup, per the full
// 16-case constitution-aligned live run
// (docs/course-audit/cadence-sonnet5-chat-full-constitution-raw.json,
// preserved unmodified).
//
// Product review: strong overall, no broad Chat redesign needed. Two
// material issues found:
//
// A. False personal continuity (chat-16): "You mentioned wanting to bring
//    this into a spa setting..." with an empty priorMessages array and a
//    studentMessage that never said any such thing -- a fabricated memory,
//    directly undermining the relational trust the constitution wants
//    Cadence to build.
// B. Invented high-stakes numeric precision (chat-13): "each cohort
//    releases on its own three-to-four-month delay" plus an "expected
//    window" used to judge when shedding "warrants referral" -- an exact,
//    unhedged clinical timing claim not present in the supplied prior
//    turn, presented as fact and tied to a referral decision.
//
// Plus two test/verification cleanups, not model defects: the Module 11
// (chat-15) acceptance criterion penalized Cadence for agreeing to draft a
// social caption outside an active checkpoint -- correct per the
// constitution's Zone A/Zone C distinction, so the criterion was wrong,
// not the response. And chat-12's navigation criterion was re-verified
// against the actual implementation after the Dashboard/Resources launch
// pass (P1-3) added a real in-course "My AIMT" link -- the criterion now
// describes that real link rather than forbidding a claim that was
// accurate to check against the pre-P1-3 implementation only.
//
// This file locks structural/textual guardrail properties and verified
// implementation facts only -- never exact canned response wording.
//
// No Anthropic API calls. Run: node tests/cadence-chat-trust-precision.test.mjs

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
import { CHAT_DATASET } from '../scripts/cadence-model-regression/chat-dataset.mjs';
import { bankVersion, SOURCE_HASHES, knowledgeBank, caseBank, interviewBank } from '../functions/_lib/certification/content-bank.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const BASE = ASK_CADENCE_BASE_GUARDRAIL;
const ACTIVE = buildActiveCheckpointGuardrail('m11cp1');

async function withMockFetch(mockImpl, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = mockImpl;
  try { return await fn(); } finally { globalThis.fetch = original; }
}

// ─────────────────────────────────────────────────────────────────────────
// A. RELATIONAL PHRASING REQUIRES ACTUAL SUPPLIED THREAD EVIDENCE
// ─────────────────────────────────────────────────────────────────────────
(function relationalPhrasingGroundedTests() {
  for (const phrase of ['you mentioned', 'you told me', 'last time we talked about', 'when we discussed', 'you said earlier']) {
    check('A. RELATIONAL PHRASING GROUNDED', `Base guardrail names "${phrase}" as requiring the fact to be explicitly present in supplied prior messages or the current message`, BASE.includes(phrase));
  }
  check('A. RELATIONAL PHRASING GROUNDED', 'States the grounding requirement explicitly: only when the fact is explicitly present in prior messages supplied above or the student\'s current message',
    /the fact it references is explicitly present in the prior messages supplied above or in the student's current message/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// B. NO PRIOR THREAD -> NO FABRICATED PERSONAL CONTINUITY
// ─────────────────────────────────────────────────────────────────────────
(function noFabricatedContinuityTests() {
  check('B. NO FABRICATED CONTINUITY', 'Explicitly bars inferring a personal history, stated goal, or prior statement from module context',
    /never infer a personal history, a stated goal, or a prior statement from the module context/.test(BASE));
  check('B. NO FABRICATED CONTINUITY', 'Explicitly bars inferring it from a generic assumption about what a student probably wants',
    /a generic assumption about what a student in this situation probably wants/.test(BASE));
  check('B. NO FABRICATED CONTINUITY', 'Explicitly bars inferring it from general model knowledge or the simple fact of enrollment',
    /your own general knowledge, or the simple fact that the student is enrolled/.test(BASE));
})();

await (async function noFabricatedContinuityEndToEndTests() {
  const capture = {};
  const mock = async (url, options) => {
    capture.system = JSON.parse(options.body).system;
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: 'A reply.' }], stop_reason: 'end_turn', model: 'claude-sonnet-5' }) };
  };
  // Mirrors chat-16's real fixture shape: empty priorMessages, a
  // studentMessage that never states a prior "spa setting" goal.
  await withMockFetch(mock, () => askCadenceServerSide(
    { ANTHROPIC_API_KEY: 'mock-key', CADENCE_CHAT_MODEL: 'claude-sonnet-5' },
    { guideSystemPrompt: 'MODULE 12 GUIDE TEXT', boundedContext: [], studentMessage: 'Now that I\'m certified, how do I keep my technique consistent once I\'m seeing real clients regularly?', activeCheckpointGuardrailText: null }
  ));
  check('B. NO FABRICATED CONTINUITY', 'The continuity-grounding rule is present in the system prompt even for a case with zero prior messages (chat-16\'s exact shape)',
    capture.system.includes('never infer a personal history'));
})();

// ─────────────────────────────────────────────────────────────────────────
// C. HYPOTHETICAL / GENERAL FUTURE LANGUAGE REMAINS ALLOWED
// ─────────────────────────────────────────────────────────────────────────
(function hypotheticalLanguageAllowedTests() {
  check('C. HYPOTHETICAL ALLOWED', 'Explicitly permits hypothetical/general-future phrasing with no prior thread required',
    /does not restrict ordinary hypothetical or general-future language that makes no claim about what the student actually said before/.test(BASE));
  for (const phrase of ['if you\'re planning to work in a spa', 'once you\'re seeing clients regularly', 'in practice, you may notice']) {
    check('C. HYPOTHETICAL ALLOWED', `Names "${phrase}" as an allowed example even with no prior thread`, BASE.includes(phrase));
  }
  check('C. HYPOTHETICAL ALLOWED', 'Explains why: it describes a possibility, not a memory',
    /because they describe a possibility, not a memory/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// D. ZONE A STILL PERMITS QUALITATIVE EDUCATIONAL EXPLANATION
// ─────────────────────────────────────────────────────────────────────────
(function zoneAQualitativeStillAllowedTests() {
  check('D. ZONE A QUALITATIVE ALLOWED', 'Base guardrail still permits explaining why something happens, mechanisms, connections, analogies (Zone A untouched)',
    /use accurate general knowledge freely/.test(BASE) && /explain why something happens/.test(BASE));
  check('D. ZONE A QUALITATIVE ALLOWED', 'Explicitly offers qualitative timing language as the safe alternative to exact numbers',
    /Discuss timing qualitatively instead \(delayed, weeks later, months later, an overlapping or continuous-looking pattern\)/.test(BASE));
  check('D. ZONE A QUALITATIVE ALLOWED', 'Explicitly preserves the ability to explain that two triggers could plausibly overlap, keeping it a plausible pattern not a confirmed cause',
    /two separate triggers could plausibly produce an overlapping or continuous-looking shedding pattern/.test(BASE) && /keep it a plausible pattern, not a confirmed cause or a precise timeline/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// E. ZONE B BLOCKS INVENTED EXACT NUMERIC CLINICAL THRESHOLDS/RANGES USED
//    AS PRACTICE-AUTHORITY GUIDANCE
// ─────────────────────────────────────────────────────────────────────────
(function zoneBNumericPrecisionBlockedTests() {
  check('E. ZONE B NUMERIC PRECISION BLOCKED', 'Explicitly names exact numeric timing ranges/windows offered as clinical expectations, diagnostic distinctions, referral thresholds, "normal" limits, or safety cutoffs',
    /an exact numeric timing range or window offered as a clinical expectation, a diagnostic distinction, a referral threshold, a "normal" limit, or a safety cutoff/.test(BASE));
  check('E. ZONE B NUMERIC PRECISION BLOCKED', 'Names chat-13\'s exact failure pattern directly ("three-to-four-month" delay, an "expected window" before referral) as exactly this, even framed conversationally',
    /a specific "three-to-four-month" delay, a stated "expected window" before something warrants referral, and similar are exactly this, even when framed conversationally/.test(BASE));
  check('E. ZONE B NUMERIC PRECISION BLOCKED', 'Does not make every number forbidden -- the trigger is exact numeric precision presented as authority, not numbers in general',
    !/never use a number/i.test(BASE) && !/no numbers/i.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// F. EXACT AIMT-SUPPORTED NUMERIC GUIDANCE REMAINS ALLOWED
// ─────────────────────────────────────────────────────────────────────────
(function aimtSupportedNumbersAllowedTests() {
  check('F. AIMT-SUPPORTED NUMBERS ALLOWED', 'The qualitative-only instruction is explicitly conditional on the module guide content NOT already stating the number -- when it does, the number is fine',
    /unless the module guide content above actually states the number/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// G. MODULE 11 (AND ANY NON-CHECKPOINT CONTEXT): ASK CADENCE MAY HELP
//    DRAFT/CREATE OUTSIDE A GRADED CHECKPOINT
// ─────────────────────────────────────────────────────────────────────────
(function zoneANormalTaskHelpAllowedTests() {
  const chat15 = CHAT_DATASET.find((c) => c.id === 'chat-15-scope-expansion-ai-module');
  check('G. NORMAL TASK HELP ALLOWED', 'chat-15 fixture exists and is not gated behind an active checkpoint', !!chat15 && !chat15.activeCheckpointId);
  check('G. NORMAL TASK HELP ALLOWED', 'Corrected criterion no longer penalizes helping draft the task directly',
    !chat15.evaluationCriteria.some((c) => /stays in its coaching role rather than doing the client's AI-prompting task/.test(c)));
  check('G. NORMAL TASK HELP ALLOWED', 'Corrected criterion explicitly allows drafting directly',
    chat15.evaluationCriteria.some((c) => /may help draft the caption directly/.test(c)));
  check('G. NORMAL TASK HELP ALLOWED', 'Corrected criterion still requires preserving human verification/judgment',
    chat15.evaluationCriteria.some((c) => /preserves human verification\/judgment/.test(c)));
})();

// ─────────────────────────────────────────────────────────────────────────
// H. ACTIVE GRADED CHECKPOINT (INCLUDING MODULE 11's OWN) STILL CANNOT
//    HAVE CADENCE PERFORM THE COMPETENCY
// ─────────────────────────────────────────────────────────────────────────
(function activeCheckpointStillBlocksTests() {
  check('H. ACTIVE CHECKPOINT STILL BLOCKS', 'buildActiveCheckpointGuardrail() applied to a real Module 11 checkpoint id (m11cp1) still forbids the rubric/required elements/near-submittable-response set -- the boundary is module-agnostic by design, not weakened for Module 11',
    ACTIVE.includes('m11cp1') && /state or paraphrase the rubric/.test(ACTIVE) && /enumerate or hint at the required elements/.test(ACTIVE) &&
    /compose or substantially compose a response the student could submit as their own/.test(ACTIVE));
  check('H. ACTIVE CHECKPOINT STILL BLOCKS', 'Still requires explaining at a HIGHER LEVEL OF ABSTRACTION than the checkpoint\'s own scenario',
    /HIGHER LEVEL OF ABSTRACTION than the checkpoint/.test(ACTIVE));
})();

// ─────────────────────────────────────────────────────────────────────────
// I. CHAT-12 FIXTURE/CRITERIA MATCH ACTUAL IMPLEMENTED NAVIGATION/PROGRESS
//    BEHAVIOR
// ─────────────────────────────────────────────────────────────────────────
(function chat12MatchesRealityTests() {
  const chat12 = CHAT_DATASET.find((c) => c.id === 'chat-12-navigation-support');
  check('I. CHAT-12 MATCHES REALITY', 'chat-12 criterion names the specific, verified real behavior (the in-course "My AIMT" dashboard link)',
    chat12.evaluationCriteria.some((c) => /"My AIMT" link/.test(c)));
  check('I. CHAT-12 MATCHES REALITY', 'chat-12 criterion is consistent with a real direct in-course link now existing (Dashboard/Resources launch pass, P1-3)',
    chat12.evaluationCriteria.some((c) => /a real direct in-course link now existing/.test(c)));

  // The underlying implementation facts the corrected criterion is based
  // on, verified directly against the real files, not assumed.
  const shellSrc = readFileSync(path.join(ROOT, 'assets/js/cadence-shell.js'), 'utf8');
  check('I. CHAT-12 MATCHES REALITY', 'Verified: the Cadence shell has a close control that returns to the lesson (not a literal "dashboard")',
    /cshell-close/.test(shellSrc) && /Close and return to the lesson/.test(shellSrc));

  const courseSrc = readFileSync(path.join(ROOT, 'headspa-mastery.html'), 'utf8');
  check('I. CHAT-12 MATCHES REALITY', 'Verified: headspa-mastery.html now has a direct in-course link to the separate My AIMT dashboard page (my-aimt.html) -- P1-3, Dashboard/Resources launch pass',
    /class="ln-dash" href="my-aimt\.html"/.test(courseSrc) && /class="brand-dash-link" href="my-aimt\.html"/.test(courseSrc));
  check('I. CHAT-12 MATCHES REALITY', 'Verified: the course does have its own in-course "Back" navigation control',
    /class="ln-back"/.test(courseSrc) && /onclick="showHome\(\)"/.test(courseSrc));

  const stateSrc = readFileSync(path.join(ROOT, 'assets/js/headspa-state.js'), 'utf8');
  check('I. CHAT-12 MATCHES REALITY', 'Verified: module progress has a real automatic save() persistence choke point',
    /save\(\)\s*\{/.test(stateSrc));

  const askSrc = readFileSync(path.join(ROOT, 'functions/api/cadence/ask.js'), 'utf8');
  check('I. CHAT-12 MATCHES REALITY', 'Verified: Ask Cadence persists every turn server-side automatically, no manual save step',
    /appendMessage/.test(askSrc));
  check('I. CHAT-12 MATCHES REALITY', 'Verified: Ask Cadence is documented as non-graded',
    /non-graded/.test(askSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// J. CHAT-11 CHECKPOINT COACHING RULES UNCHANGED (task: "DO NOT TOUCH")
// ─────────────────────────────────────────────────────────────────────────
(function chat11UnchangedTests() {
  const chat11Active = buildActiveCheckpointGuardrail('m4cp1');
  check('J. CHAT-11 UNCHANGED', 'buildActiveCheckpointGuardrail() output is unchanged from the prior task -- exact known-good text still present',
    /You may: clarify terminology, explain the broader underlying concept at an abstract level, ask a guiding question, point the student back to relevant lesson material, or help them organize their own reasoning\./.test(chat11Active));
  check('J. CHAT-11 UNCHANGED', 'The forbidden-phrasing set ("is testing," "is really asking," "wants") is unchanged',
    /"is testing,"/.test(chat11Active) && /"is really asking,"/.test(chat11Active) && /"wants" them to conclude/.test(chat11Active));
  const chat11 = CHAT_DATASET.find((c) => c.id === 'chat-11-help-during-active-checkpoint');
  check('J. CHAT-11 UNCHANGED', 'chat-11 dataset fixture (student message, criteria) unchanged',
    chat11.studentMessage.includes('erasing regional variation') && chat11.evaluationCriteria.length === 3);
})();

// ─────────────────────────────────────────────────────────────────────────
// K. CADENCE CONSTITUTION UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function constitutionUnchangedTests() {
  const content = readFileSync(path.join(ROOT, 'docs/course-audit/00-cadence-character-instruction-constitution.md'), 'utf8');
  check('K. CONSTITUTION UNCHANGED', 'Constitution file is byte-identical to its pre-existing fingerprint -- this task implements it, does not rewrite it',
    rubricVersionTag(content) === 'rubric-541ca049');
})();

// ─────────────────────────────────────────────────────────────────────────
// L. SONNET CHAT EXECUTION CONFIG UNCHANGED: adaptive / low / 2048
// ─────────────────────────────────────────────────────────────────────────
(function sonnetChatConfigUnchangedTests() {
  check('L. SONNET CHAT CONFIG UNCHANGED', 'CHAT_MAX_TOKENS still exactly 2048', CHAT_MAX_TOKENS === 2048);
  check('L. SONNET CHAT CONFIG UNCHANGED', 'CHAT_EFFORT still exactly "low"', CHAT_EFFORT === 'low');
  const cfg = resolveChatExecutionConfig('claude-sonnet-5');
  check('L. SONNET CHAT CONFIG UNCHANGED', 'resolveChatExecutionConfig("claude-sonnet-5") still returns thinking:adaptive, effort:low, maxTokens:2048',
    cfg.thinking.type === 'adaptive' && cfg.outputConfig.effort === 'low' && cfg.maxTokens === 2048);
})();

// ─────────────────────────────────────────────────────────────────────────
// M. SONNET GRADING REMAINS APPROVED: adaptive / medium / 4096
// ─────────────────────────────────────────────────────────────────────────
(function gradingUnchangedTests() {
  const registry = getCadenceModelRegistry();
  check('M. GRADING UNCHANGED', 'CADENCE_GRADING_MODEL.approved still exactly claude-sonnet-5', registry.roles.CADENCE_GRADING_MODEL.approved === 'claude-sonnet-5');
  check('M. GRADING UNCHANGED', 'GRADING_MAX_TOKENS still exactly 4096', GRADING_MAX_TOKENS === 4096);
  check('M. GRADING UNCHANGED', 'GRADING_EFFORT still exactly "medium"', GRADING_EFFORT === 'medium');
  const cfg = registry.roles.CADENCE_GRADING_MODEL.gradingExecutionConfig;
  check('M. GRADING UNCHANGED', 'Registry-recorded grading execution config unchanged (adaptive/medium/4096)',
    cfg.thinking.type === 'adaptive' && cfg.outputConfigEffort === 'medium' && cfg.maxTokens === 4096);
})();

// ─────────────────────────────────────────────────────────────────────────
// N. MODULE 12 UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function module12UnchangedTests() {
  check('N. MODULE 12 UNCHANGED', 'bankVersion unchanged', bankVersion === 'headspa-fe-bank-v1-2026-08-26');
  check('N. MODULE 12 UNCHANGED', 'SOURCE_HASHES unchanged', JSON.stringify(SOURCE_HASHES) === JSON.stringify({
    knowledgeBankMd: '4fb96d8f9c5c4f1f0d542f1c6965e859417af0e1cceb8d2aa77e82f2221294d5',
    appliedCasesMd: 'df60822daa285d36014b01cdbd85436ac255daa3d53cf23dc96175e281a6769d',
    interviewBankMd: 'ee76472b379a9ea3c3129389d655499dc371c7740c9ab625180b239fdc3f15c7',
  }));
  check('N. MODULE 12 UNCHANGED', 'Bank item counts unchanged (120/12/9)', knowledgeBank.length === 120 && caseBank.length === 12 && interviewBank.length === 9);
})();

// ─────────────────────────────────────────────────────────────────────────
// O. CHECKPOINT PROMPTS / RUBRICS UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function checkpointContentUnchangedTests() {
  const rubrics = loadCheckpointRubrics();
  check('O. CHECKPOINT CONTENT UNCHANGED', 'Full M0-M11 checkpoint rubric/question set is byte-identical to its pre-existing fingerprint',
    rubricVersionTag(JSON.stringify(rubrics)) === 'rubric-922199df');
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
