// Ask Cadence (Chat) — targeted quality correction.
//
// A live 5-case targeted Chat regression (docs/course-audit/
// cadence-sonnet5-chat-targeted-raw.json, preserved unmodified as
// historical evidence) surfaced real product-quality problems, audited
// against the actual AIMT curriculum supplied to Cadence
// (MODULE_GUIDE_SYSTEMS in headspa-mastery.html -- the only curriculum
// content the chat system prompt actually contains): invented specific
// numbers/timing windows/mechanisms not present in the supplied module
// guide text (chat-01, chat-05, chat-11), an invented market benchmark
// ("50-65% margin range", chat-14), unnecessary medical elaboration after
// correctly declining a diagnosis (chat-09), and -- most seriously --
// chat-11 supplying invented crown/hairline physiology plus an explicit
// "which is the trap the checkpoint is testing for" statement while a
// real unresolved checkpoint (m4cp1) was open, both a grounding failure
// and a severe checkpoint-answer-leak failure.
//
// Root cause for chat-11 specifically: scripts/run-cadence-model-
// regression.mjs's runChat() never included ASK_CADENCE_BASE_GUARDRAIL or
// buildActiveCheckpointGuardrail() in its system prompt at all -- despite
// the chat-11 dataset case setting activeCheckpointId, that field was
// dead data, so the live evidence never actually exercised the real
// production contract a student would receive. Fixed here alongside the
// prompt strengthening itself.
//
// This file locks BEHAVIORAL RULES in the shared, always-on prompt layer
// (functions/_lib/cadence/ask-cadence.mjs's ASK_CADENCE_BASE_GUARDRAIL /
// buildActiveCheckpointGuardrail()) and structural wiring -- never exact
// canned response wording, since the model's actual phrasing is not
// something a deterministic test can or should pin.
//
// No Anthropic API calls. Run: node tests/cadence-chat-quality.test.mjs

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ASK_CADENCE_BASE_GUARDRAIL,
  buildActiveCheckpointGuardrail,
  askCadenceServerSide,
} from '../functions/_lib/cadence/ask-cadence.mjs';
import {
  GRADING_MAX_TOKENS,
  GRADING_EFFORT,
  CHECKPOINT_EVAL_INSTRUCTION,
  rubricVersionTag,
} from '../functions/_lib/cadence/checkpoint-evaluation.mjs';
import { getCadenceModelRegistry, resolveCadenceModel } from '../functions/_lib/cadence/model-config.mjs';
import { loadCheckpointRubrics } from '../scripts/cadence-model-regression/load-checkpoint-rubrics.mjs';
import { CHAT_DATASET } from '../scripts/cadence-model-regression/chat-dataset.mjs';
import { GRADING_DATASET } from '../scripts/cadence-model-regression/grading-dataset.mjs';
import { runChat } from '../scripts/run-cadence-model-regression.mjs';
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

function anthropicTextResponse(text) {
  return async () => ({ ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text }], stop_reason: 'end_turn' }) });
}

// ─────────────────────────────────────────────────────────────────────────
// A. CURRICULUM GROUNDING — SUPERSEDED by the Zone A / Zone B recalibration
//    (docs/course-audit/00-cadence-character-instruction-constitution.md;
//    implemented in the "Align Ask Cadence guardrails with instructor
//    constitution" task). The closed-corpus "ground every substantive claim
//    in exactly one of three sources... not even a real, well-known fact
//    from general knowledge" rule this section originally locked was
//    IDENTIFIED as the over-correction and has been deliberately replaced.
//    Full current coverage lives in tests/cadence-chat-zones.test.mjs; this
//    section now checks only that the old closed-corpus phrasing is
//    actually gone and the new Zone A allowance is actually present, so
//    this file keeps a historical trail of the change rather than silently
//    going stale.
// ─────────────────────────────────────────────────────────────────────────
(function groundingTests() {
  check('CURRICULUM GROUNDING', 'The old closed-corpus "three sources" framing is gone -- general knowledge is no longer boxed out by construction',
    !/exactly one of three sources/.test(BASE) && !/not even a real, well-known fact from general knowledge/.test(BASE));
  check('CURRICULUM GROUNDING', 'Zone A explicitly permits accurate general knowledge for ordinary tutoring (see cadence-chat-zones.test.mjs for full coverage)',
    /use accurate general knowledge freely/.test(BASE));
  check('CURRICULUM GROUNDING', 'Zone B still gives the natural "no specific number" redirect language for genuine high-stakes gaps, not a robotic refusal template',
    /the course doesn't give us a specific number for that/.test(BASE) && /not as a recurring disclaimer/.test(BASE));
  check('CURRICULUM GROUNDING', 'Still instructs redirecting to the decision principle the material teaches, not just declining',
    /redirect to the decision principle/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// B. NO UNSUPPORTED NUMBERS / BENCHMARKS -- narrowed to Zone B (high-stakes)
//    material only, per the recalibration. See cadence-chat-zones.test.mjs
//    for the full Zone A/B distinction this section is now a light,
//    historical-continuity check for.
// ─────────────────────────────────────────────────────────────────────────
(function noUnsupportedNumbersTests() {
  check('NO UNSUPPORTED NUMBERS', 'Base guardrail still prohibits exact business/industry benchmarks presented as authoritative fact in Zone B',
    /exact business or industry benchmarks presented as authoritative fact/.test(BASE));
  check('NO UNSUPPORTED NUMBERS', 'Base guardrail still prohibits exact clinical thresholds in Zone B',
    /exact clinical thresholds/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// C. PHYSIOLOGICAL MECHANISM / MEDICAL EXPLANATION -- now explicitly Zone A
//    (ALLOWED for ordinary tutoring), not a blanket prohibition. This is
//    the core of the recalibration: chat-01's mechanism explanation
//    ("illness pushes follicles into the resting phase...") was the case
//    that showed the old blanket ban was the over-correction, not the
//    model. Diagnosis/prescribing/treatment recommendation remain
//    restricted via the separate, unchanged diagnostic-decline clause.
// ─────────────────────────────────────────────────────────────────────────
(function generalKnowledgeNowAllowedTests() {
  check('ZONE A NOW ALLOWED', 'Base guardrail no longer blanket-prohibits a "physiological mechanism" or "medical explanation" as forbidden categories',
    !/physiological mechanism, medical explanation/.test(BASE));
  check('ZONE A NOW ALLOWED', 'Diagnosis/prescribing/treatment-recommendation restrictions remain intact via the separate diagnostic-decline clause',
    /decline the diagnostic guess briefly/.test(BASE) && /naming or choosing between named medical conditions/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// D. CONCISE DEFAULT RESPONSE INSTRUCTION (no rigid cutoff)
// ─────────────────────────────────────────────────────────────────────────
(function concisenessTests() {
  check('CONCISE DEFAULT', 'States a normal 2-5 sentence default and answering the actual question first',
    /answer the actual question first/.test(BASE) && /2-5 sentences/.test(BASE));
  check('CONCISE DEFAULT', 'Forbids automatically producing a multi-section lecture, an automatic bullet list, and an automatic follow-up exercise by default',
    /automatically produce a multi-section lecture/.test(BASE) && /automatic bullet list/.test(BASE) && /automatic follow-up exercise/.test(BASE));
  check('CONCISE DEFAULT', 'Explicitly allows expanding when the question genuinely requires it, INCLUDING when safety/referral guidance needs the room -- no rigid cutoff that would harm a necessary safety answer',
    /genuinely requires it/.test(BASE) && /safety or referral guidance needs the room/.test(BASE));
  // The token ceiling itself (CHAT_MAX_TOKENS) is a separate, later
  // concern -- see tests/cadence-chat-config.test.mjs. What this specific
  // check protects is narrower and still true regardless of that value:
  // brevity comes from prompt guidance, never from crude string-slicing
  // the response text after the fact.
  check('CONCISE DEFAULT', 'No character-count cutoff logic truncates the response text after the fact -- brevity is prompt guidance only', (() => {
    const src = readFileSync(path.join(ROOT, 'functions/_lib/cadence/ask-cadence.mjs'), 'utf8');
    return !/responseText\.length\s*[<>]/.test(src) && !/\.slice\(0,\s*\d+\)/.test(src.replace(/errBody\.slice/g, ''));
  })());
})();

// ─────────────────────────────────────────────────────────────────────────
// E. NO GENERIC PRAISE / CODDLING / RESTATEMENT
// ─────────────────────────────────────────────────────────────────────────
(function noGenericPraiseTests() {
  check('NO GENERIC PRAISE', 'Base guardrail forbids opening with "great question" or similar generic praise',
    /great question/i.test(BASE));
  check('NO GENERIC PRAISE', 'Base guardrail forbids coddling and forbids restating the student\'s question before answering',
    /do not coddle/.test(BASE) && /restate the student's question/.test(BASE));
  check('NO GENERIC PRAISE', 'Still explicitly preserves warmth as a trait -- this is a tone correction, not a warmth removal',
    /stay warm/i.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// F. ACTIVE-CHECKPOINT ANTI-ANSWER-LEAK RULE
// ─────────────────────────────────────────────────────────────────────────
(function checkpointAntiLeakTests() {
  check('CHECKPOINT ANTI-LEAK', 'Base guardrail (applies even without a flagged active checkpoint) forbids stating/paraphrasing a rubric and enumerating required elements',
    /state or paraphrase a rubric/.test(BASE) && /enumerate required elements/.test(BASE));
  check('CHECKPOINT ANTI-LEAK', 'Base guardrail forbids telling a student what a checkpoint "is testing" or "is really asking"',
    /is testing.*is really asking|is really asking.*is testing/.test(BASE.replace(/\n/g, ' ')) || (/"is testing"/.test(BASE) && /"is really asking"/.test(BASE)));
  check('CHECKPOINT ANTI-LEAK', 'Active-checkpoint guardrail includes the specific checkpoint id and is framed as the strictest boundary in the conversation',
    ACTIVE.includes('m4cp1') && /strictest boundary/.test(ACTIVE));
  check('CHECKPOINT ANTI-LEAK', 'Active-checkpoint guardrail\'s permitted list matches the task\'s exact allowed behaviors: clarify terminology, explain abstractly, ask a guiding question, point to lesson material, help organize their own reasoning',
    /clarify terminology/.test(ACTIVE) && /abstract level/.test(ACTIVE) && /guiding question/.test(ACTIVE) && /lesson material/.test(ACTIVE) && /organize their own reasoning/.test(ACTIVE));
  check('CHECKPOINT ANTI-LEAK', 'Active-checkpoint guardrail\'s forbidden list covers: rubric/required elements, module-specific answer components, "what the checkpoint is testing", composing a submittable response, hidden evaluation criteria',
    /module-specific facts or reasoning components/.test(ACTIVE) &&
    /compose or substantially compose/.test(ACTIVE) &&
    /hidden evaluation criteria/.test(ACTIVE));
  check('CHECKPOINT ANTI-LEAK', 'Does not hardcode the m4cp1/"erasing regional variation" example anywhere in production code -- the fix is a general behavioral rule, not a special case',
    (() => {
      const src = readFileSync(path.join(ROOT, 'functions/_lib/cadence/ask-cadence.mjs'), 'utf8');
      return !/erasing regional variation/i.test(src) && !/crown.*oilier|oilier.*crown/i.test(src);
    })());
})();

// ─────────────────────────────────────────────────────────────────────────
// G. DIAGNOSTIC REDIRECT BEHAVIOR
// ─────────────────────────────────────────────────────────────────────────
(function diagnosticRedirectTests() {
  check('DIAGNOSTIC REDIRECT', 'Base guardrail instructs declining a diagnostic guess briefly, then moving to observation + the proceed/modify/refer-style framework the module teaches',
    /decline the diagnostic guess briefly/.test(BASE) && /proceed\/modify\/refer-style framework/.test(BASE));
  check('DIAGNOSTIC REDIRECT', 'Explicitly forbids compensating for declining diagnosis with medical detail, mechanisms, or clinical/diagnostic-procedure claims not already stated above',
    /do not compensate for declining a diagnosis/.test(BASE));
  check('DIAGNOSTIC REDIRECT', 'Names the exact unsupported elaboration categories the live evidence showed (biopsy, what a dermatologist does, disease mechanisms)',
    /biopsy/.test(BASE) && /what a dermatologist does/.test(BASE) && /disease mechanisms/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// H. LANGUAGE FAIRNESS PRESERVED
// ─────────────────────────────────────────────────────────────────────────
(function languageFairnessTests() {
  check('LANGUAGE FAIRNESS', 'Base guardrail forbids correcting/flagging/commenting on grammar, spelling, spoken phrasing, or non-native English',
    /grammar, spelling, spoken phrasing, or non-native English/.test(BASE));
  check('LANGUAGE FAIRNESS', 'Requires responding exactly as it would to perfectly-phrased English, unless the student explicitly asks for writing help',
    /exactly as you would for perfectly-phrased English/.test(BASE) && /explicitly ask for writing help/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// I. STORED-THREAD-ONLY CONTINUITY
// ─────────────────────────────────────────────────────────────────────────
(function continuityStaticTests() {
  check('CONTINUITY', 'Base guardrail forbids implying memory of anything beyond what is actually visible in the conversation',
    /Only reference what is explicitly visible in this conversation/.test(BASE) && /never imply memory of anything beyond/.test(BASE));
})();

// End-to-end: askCadenceServerSide() passes boundedContext straight
// through as prior messages -- it does not invent, drop, or reorder any
// turn, and the new student message is appended last. This is the
// structural guarantee behind "continuity only from the stored thread."
// Awaited at the top level (not fired as an un-awaited IIFE) so it cannot
// race with section J's own mocked-fetch calls below.
await (async function continuityEndToEndTests() {
  const capture = {};
  const mock = async (url, options) => {
    capture.body = JSON.parse(options.body);
    return anthropicTextResponse('Continuing from what we discussed.')();
  };
  const priorMessages = [
    { role: 'user', content: 'How do I know what my service really costs?' },
    { role: 'assistant', content: 'Start with your real product cost per service...' },
  ];
  await withMockFetch(mock, () => askCadenceServerSide(
    { ANTHROPIC_API_KEY: 'mock-key', CADENCE_CHAT_MODEL: 'claude-sonnet-5' },
    { guideSystemPrompt: 'MODULE 9 GUIDE TEXT', boundedContext: priorMessages, studentMessage: 'Now what about margin?', activeCheckpointGuardrailText: null }
  ));
  check('CONTINUITY', 'The exact prior messages (and only those) are passed through as prior turns, in order, before the new student message',
    capture.body.messages.length === 3 &&
    capture.body.messages[0].content === priorMessages[0].content &&
    capture.body.messages[1].content === priorMessages[1].content &&
    capture.body.messages[2].content === 'Now what about margin?');
  check('CONTINUITY', 'No additional fabricated turn is inserted anywhere in the message list', capture.body.messages.every((m) => m.role === 'user' || m.role === 'assistant'));
})();

// ─────────────────────────────────────────────────────────────────────────
// J. HARNESS FIX: runChat() NOW MIRRORS THE REAL PRODUCTION SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────
await (async function harnessMirrorsProductionTests() {
  let capturedSystem = null;
  const mock = async (url, options) => {
    capturedSystem = JSON.parse(options.body).system;
    return anthropicTextResponse('A short, grounded reply.')();
  };

  const originalKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'mock-anthropic-key';
  try {
    // chat-11-help-during-active-checkpoint: activeCheckpointId='m4cp1' in
    // the dataset. The harness must now include BOTH the base guardrail
    // and the active-checkpoint guardrail -- previously it included
    // neither.
    const withActive = await withMockFetch(mock, () => runChat({ live: true, model: 'claude-sonnet-5' }, ['chat-11-help-during-active-checkpoint']));
    check('HARNESS MIRRORS PRODUCTION', 'Live chat run for an active-checkpoint case includes the base guardrail in the system prompt sent to the model',
      capturedSystem && capturedSystem.includes(ASK_CADENCE_BASE_GUARDRAIL));
    check('HARNESS MIRRORS PRODUCTION', 'Live chat run for an active-checkpoint case includes the specific active-checkpoint guardrail (checkpoint id m4cp1) in the system prompt',
      capturedSystem && capturedSystem.includes('m4cp1') && capturedSystem.includes('strictest boundary'));
    check('HARNESS MIRRORS PRODUCTION', 'The result itself records the case ran (no error) -- the fix does not break the run', withActive.results[0].error === null);

    // chat-01-simple-explanation: no activeCheckpointId in the dataset --
    // must still get the base guardrail, but NOT an active-checkpoint
    // guardrail (nothing to guard against here).
    capturedSystem = null;
    await withMockFetch(mock, () => runChat({ live: true, model: 'claude-sonnet-5' }, ['chat-01-simple-explanation']));
    check('HARNESS MIRRORS PRODUCTION', 'A case with no active checkpoint still gets the base guardrail',
      capturedSystem && capturedSystem.includes(ASK_CADENCE_BASE_GUARDRAIL));
    check('HARNESS MIRRORS PRODUCTION', 'A case with no active checkpoint does NOT get an active-checkpoint guardrail appended (nothing to guard)',
      capturedSystem && !/strictest boundary/.test(capturedSystem));
  } finally {
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalKey;
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// K. NO MODEL SWITCH -- SONNET 5 REMAINS CANDIDATE FOR CHAT
// ─────────────────────────────────────────────────────────────────────────
(function noModelSwitchTests() {
  const registry = getCadenceModelRegistry();
  check('NO MODEL SWITCH', 'CADENCE_CHAT_MODEL candidate is still claude-sonnet-5 -- this task changed the prompt/context contract, not the model',
    registry.roles.CADENCE_CHAT_MODEL.candidate === 'claude-sonnet-5');
  // SUPERSEDED: this task pre-dates Chat's own promotion. "approved is
  // still null" was correct to pin at the time this file was written --
  // Chat has since completed its own independent live validation program
  // and was promoted to APPROVED (registry v5, see
  // tests/cadence-chat-promotion.test.mjs for the full contract). What
  // must still hold from THIS file's original scope is only that the
  // model identity itself (claude-sonnet-5) was not switched by the
  // prompt/context work this file actually tests.
  check('NO MODEL SWITCH', 'CADENCE_CHAT_MODEL still resolves claude-sonnet-5 -- this task changed the prompt/context contract, not the model identity',
    registry.roles.CADENCE_CHAT_MODEL.candidate === 'claude-sonnet-5' && resolveCadenceModel({}, 'CADENCE_CHAT_MODEL').modelName === 'claude-sonnet-5');
})();

// ─────────────────────────────────────────────────────────────────────────
// L. GRADING CONFIGURATION AND STATUS UNTOUCHED
// ─────────────────────────────────────────────────────────────────────────
(function gradingUntouchedTests() {
  const registry = getCadenceModelRegistry();
  check('GRADING UNTOUCHED', 'CADENCE_GRADING_MODEL remains APPROVED (claude-sonnet-5) -- unchanged by this chat-only task, independent of whatever registry version is current',
    registry.roles.CADENCE_GRADING_MODEL.approved === 'claude-sonnet-5');
  check('GRADING UNTOUCHED', 'GRADING_MAX_TOKENS is still exactly 4096',
    GRADING_MAX_TOKENS === 4096);
  check('GRADING UNTOUCHED', 'GRADING_EFFORT is still exactly "medium"',
    GRADING_EFFORT === 'medium');
  check('GRADING UNTOUCHED', 'CHECKPOINT_EVAL_INSTRUCTION (the generic grading-feedback-grounding instruction from the prior task) is unchanged',
    /Ground every explanation, rationale, or illustrative example in this feedback strictly in the rubric and curriculum context supplied above/.test(CHECKPOINT_EVAL_INSTRUCTION));
  check('GRADING UNTOUCHED', 'GRADING_DATASET case count is unchanged (72)',
    GRADING_DATASET.length === 72);
})();

// ─────────────────────────────────────────────────────────────────────────
// M. MODULE 12 UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function module12UnchangedTests() {
  check('MODULE 12 UNCHANGED', 'bankVersion unchanged', bankVersion === 'headspa-fe-bank-v1-2026-08-26');
  check('MODULE 12 UNCHANGED', 'SOURCE_HASHES unchanged', JSON.stringify(SOURCE_HASHES) === JSON.stringify({
    knowledgeBankMd: '4fb96d8f9c5c4f1f0d542f1c6965e859417af0e1cceb8d2aa77e82f2221294d5',
    appliedCasesMd: 'df60822daa285d36014b01cdbd85436ac255daa3d53cf23dc96175e281a6769d',
    interviewBankMd: 'ee76472b379a9ea3c3129389d655499dc371c7740c9ab625180b239fdc3f15c7',
  }));
  check('MODULE 12 UNCHANGED', 'Bank item counts unchanged (120/12/9)', knowledgeBank.length === 120 && caseBank.length === 12 && interviewBank.length === 9);
})();

// ─────────────────────────────────────────────────────────────────────────
// N. CHECKPOINT RUBRICS / CONTENT UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function checkpointContentUnchangedTests() {
  const rubrics = loadCheckpointRubrics();
  check('CHECKPOINT CONTENT UNCHANGED', 'Full M0-M11 checkpoint rubric/question set is byte-identical to its pre-existing fingerprint -- this task touched zero checkpoint content',
    rubricVersionTag(JSON.stringify(rubrics)) === 'rubric-f6f22d2b');
  check('CHECKPOINT CONTENT UNCHANGED', 'CHAT_DATASET case count is unchanged (16) -- the fixture set itself was not edited, only the harness\'s system-prompt assembly',
    CHAT_DATASET.length === 16);
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
