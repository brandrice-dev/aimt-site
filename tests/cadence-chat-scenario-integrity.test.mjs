// Ask Cadence (Chat) — scenario-fact integrity, per the final two-case live
// retest (docs/course-audit/cadence-sonnet5-chat-final-two-case-raw.json,
// preserved unmodified).
//
// chat-16 PASSED cleanly: the continuity fix from the prior task holds --
// no fabricated "you mentioned" language, nothing to change here.
//
// chat-13 remained conceptually strong (correctly avoided inventing a
// numeric timeframe this time, correctly preserved "plausible pattern, not
// confirmed cause") but stated: "you're observing diffuse shedding without
// a scalp-condition pattern (no scarring, no patchiness, no scalp
// irritation)" -- findings the student never supplied anywhere in the
// fixture (the student only asked a conceptual question about two fevers
// making shedding look continuous). Cadence invented scenario facts and
// used them to support a service recommendation.
//
// This file locks the fix: Cadence may reason conceptually and use
// conditional language about what she doesn't know, but may never state an
// unsupplied client/student/business/scenario detail as established fact.
// Structural/textual checks only -- never exact canned response wording.
//
// No Anthropic API calls. Run: node tests/cadence-chat-scenario-integrity.test.mjs

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
// A/B. CANNOT STATE AN ABSENT CLIENT FINDING OR SYMPTOM ABSENCE AS FACT
// ─────────────────────────────────────────────────────────────────────────
(function noInventedFindingsTests() {
  check('A/B. NO INVENTED FINDINGS', 'Base guardrail requires scenario details to actually be supplied -- in the current message, visible prior conversation, or explicit turn context',
    /Never state a specific detail about the student's, a client's, or a business's actual situation as an established fact unless it was actually supplied/.test(BASE));
  for (const category of ['symptoms', 'the stated absence of symptoms', 'client history', 'the service setting', 'business facts', 'prior actions', 'observed findings', 'goals and preferences']) {
    check('A/B. NO INVENTED FINDINGS', `Base guardrail names "${category}" as a category that cannot be invented`, BASE.includes(category));
  }
  check('A/B. NO INVENTED FINDINGS', 'Names chat-13\'s exact failure pattern directly -- stating absence of scarring/patchiness/irritation as fact when never supplied',
    /if the student never said the scalp has no scarring, patchiness, or irritation, you do not know that/.test(BASE) && /"you're observing diffuse shedding with no patchiness\.\.\." is not something you can say as fact/.test(BASE));
  check('A/B. NO INVENTED FINDINGS', 'Explicitly closes the "but it supports a reasonable recommendation" loophole chat-13 used',
    /even when it is only being used to support a reasonable-sounding next step/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// C. CONDITIONAL LANGUAGE ABOUT MISSING FINDINGS REMAINS ALLOWED
// ─────────────────────────────────────────────────────────────────────────
(function conditionalLanguageAllowedTests() {
  check('C. CONDITIONAL LANGUAGE ALLOWED', 'Base guardrail gives the natural conditional-language escape hatch as an explicit example',
    /if there's no patchiness, irritation, or other referral flag, then\.\.\./.test(BASE));
  check('C. CONDITIONAL LANGUAGE ALLOWED', 'Explicitly frames this as natural conversation, not a formal disclaimer to recite',
    /This is not a formal disclaimer to recite -- it is simply not inventing the client in front of you/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// D. CADENCE MAY ASK FOR MISSING SCENARIO INFORMATION
// ─────────────────────────────────────────────────────────────────────────
(function mayAskForMissingInfoTests() {
  check('D. MAY ASK FOR MISSING INFO', 'Base guardrail explicitly permits asking what is actually present',
    /asking what is actually present are all still fully allowed/.test(BASE));
  check('D. MAY ASK FOR MISSING INFO', 'Gives the natural "next thing I\'d want to know" example',
    /the next thing I'd want to know is whether the shedding is diffuse or patchy/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// E. CONCEPTUAL INFERENCE / EXPLANATION REMAINS ALLOWED
// ─────────────────────────────────────────────────────────────────────────
(function conceptualInferenceAllowedTests() {
  check('E. CONCEPTUAL INFERENCE ALLOWED', 'Base guardrail explicitly preserves conceptual inference, reasonable connections, and discussing possibilities',
    /Conceptual inference, drawing reasonable connections, discussing possibilities/.test(BASE));
  check('E. CONCEPTUAL INFERENCE ALLOWED', 'The overlapping-shedding-pattern explanation (chat-13\'s genuinely good content) remains explicitly preserved from the prior task\'s fix',
    /two separate triggers could plausibly produce an overlapping or continuous-looking shedding pattern/.test(BASE) && /keep it a plausible pattern, not a confirmed cause or a precise timeline/.test(BASE));
})();

await (async function scenarioIntegrityEndToEndTests() {
  const capture = {};
  const mock = async (url, options) => {
    capture.system = JSON.parse(options.body).system;
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: 'A reply.' }], stop_reason: 'end_turn', model: 'claude-sonnet-5' }) };
  };
  // Mirrors chat-13's real fixture shape exactly: a prior telogen-mechanism
  // exchange, then the two-fevers follow-up question -- no scalp findings
  // supplied anywhere.
  const priorMessages = [
    { role: 'user', content: 'Why can shedding appear months after an illness?' },
    { role: 'assistant', content: 'Because a major stressor like a fever can push a batch of follicles into the resting (telogen) phase early — the actual shedding shows up weeks to months later when those follicles release, not at the time of the illness itself.' },
  ];
  await withMockFetch(mock, () => askCadenceServerSide(
    { ANTHROPIC_API_KEY: 'mock-key', CADENCE_CHAT_MODEL: 'claude-sonnet-5' },
    { guideSystemPrompt: 'MODULE 3 GUIDE TEXT', boundedContext: priorMessages, studentMessage: 'Okay that makes sense. So if a client had TWO fevers a few months apart, could that make the shedding look kind of continuous instead of one clear episode?', activeCheckpointGuardrailText: null }
  ));
  check('A/B. NO INVENTED FINDINGS', 'The scenario-fact integrity rule is present in the system prompt for chat-13\'s exact real case shape',
    capture.system.includes('Never state a specific detail about the student\'s, a client\'s, or a business\'s actual situation as an established fact'));
})();

// ─────────────────────────────────────────────────────────────────────────
// F. ZONE A GENERAL EDUCATIONAL FREEDOM REMAINS UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function zoneAUnchangedTests() {
  check('F. ZONE A UNCHANGED', 'Zone A permission to use accurate general knowledge freely is unchanged',
    /use accurate general knowledge freely: explain why something happens, clarify terminology, make connections, use analogies, add useful background context/.test(BASE));
  check('F. ZONE A UNCHANGED', '"General knowledge may help explain AIMT. It may not silently create AIMT policy." is unchanged',
    /General knowledge may help explain AIMT\. It may not silently create AIMT policy\./.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// G. ZONE B RULES REMAIN UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function zoneBUnchangedTests() {
  check('G. ZONE B UNCHANGED', 'Zone B high-stakes category list is unchanged',
    /diagnosis, differential diagnosis, prescribing or treating a medical condition, contraindications, referral thresholds/.test(BASE));
  check('G. ZONE B UNCHANGED', 'Zone B\'s exact-numeric-timing clause from the prior task is unchanged',
    /a specific "three-to-four-month" delay, a stated "expected window" before something warrants referral, and similar are exactly this/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// H. CONTINUITY RULES REMAIN UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function continuityUnchangedTests() {
  check('H. CONTINUITY UNCHANGED', 'Relational-phrasing grounding requirement is unchanged',
    /use that phrasing only when the fact it references is explicitly present in the prior messages supplied above or in the student's current message/.test(BASE));
  check('H. CONTINUITY UNCHANGED', 'Hypothetical/general-future language carve-out is unchanged',
    /if you're planning to work in a spa/.test(BASE) && /because they describe a possibility, not a memory/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// I. ACTIVE CHECKPOINT BEHAVIOR UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function activeCheckpointUnchangedTests() {
  check('I. ACTIVE CHECKPOINT UNCHANGED', 'buildActiveCheckpointGuardrail() output unchanged -- exact known-good permitted/forbidden text still present',
    /You may: clarify terminology, explain the broader underlying concept at an abstract level/.test(ACTIVE) &&
    /HIGHER LEVEL OF ABSTRACTION than the checkpoint/.test(ACTIVE) &&
    /"wants" them to conclude/.test(ACTIVE));
  check('I. ACTIVE CHECKPOINT UNCHANGED', 'Base guardrail\'s general checkpoint-answer refusal clause unchanged',
    /Never provide, write, dictate, or spell out the qualifying answer to any required checkpoint question/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// J. SONNET CHAT CONFIG UNCHANGED: adaptive / low / 2048
// ─────────────────────────────────────────────────────────────────────────
(function sonnetChatConfigUnchangedTests() {
  check('J. SONNET CHAT CONFIG UNCHANGED', 'CHAT_MAX_TOKENS still exactly 2048', CHAT_MAX_TOKENS === 2048);
  check('J. SONNET CHAT CONFIG UNCHANGED', 'CHAT_EFFORT still exactly "low"', CHAT_EFFORT === 'low');
  const cfg = resolveChatExecutionConfig('claude-sonnet-5');
  check('J. SONNET CHAT CONFIG UNCHANGED', 'resolveChatExecutionConfig("claude-sonnet-5") still returns thinking:adaptive, effort:low, maxTokens:2048',
    cfg.thinking.type === 'adaptive' && cfg.outputConfig.effort === 'low' && cfg.maxTokens === 2048);
})();

// ─────────────────────────────────────────────────────────────────────────
// K. SONNET GRADING REMAINS APPROVED: adaptive / medium / 4096
// ─────────────────────────────────────────────────────────────────────────
(function gradingUnchangedTests() {
  const registry = getCadenceModelRegistry();
  check('K. GRADING UNCHANGED', 'CADENCE_GRADING_MODEL.approved still exactly claude-sonnet-5', registry.roles.CADENCE_GRADING_MODEL.approved === 'claude-sonnet-5');
  check('K. GRADING UNCHANGED', 'GRADING_MAX_TOKENS still exactly 4096', GRADING_MAX_TOKENS === 4096);
  check('K. GRADING UNCHANGED', 'GRADING_EFFORT still exactly "medium"', GRADING_EFFORT === 'medium');
  const cfg = registry.roles.CADENCE_GRADING_MODEL.gradingExecutionConfig;
  check('K. GRADING UNCHANGED', 'Registry-recorded grading execution config unchanged (adaptive/medium/4096)',
    cfg.thinking.type === 'adaptive' && cfg.outputConfigEffort === 'medium' && cfg.maxTokens === 4096);
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
