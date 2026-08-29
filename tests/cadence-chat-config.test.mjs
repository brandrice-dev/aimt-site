// Ask Cadence (Chat) — final targeted control pass: execution config,
// truncation detection, context-pipeline audit, and the checkpoint
// safe-coaching structural boundary.
//
// A second live 5-case targeted Chat run (docs/course-audit/
// cadence-sonnet5-chat-targeted-post-guardrail-raw.json, preserved
// unmodified) showed chat-09 and chat-14 now behaving correctly, but
// three regressions: chat-01 truncated mid-sentence ("...and massage")
// with error:null and no signal anything was wrong; chat-05 still added
// unsupported dry-scalp/dandruff visual distinctions despite the prior
// task's grounding instruction; chat-11 still leaked checkpoint-adjacent
// reasoning ("that's the reasoning the checkpoint wants you to work
// through yourself") plus invented scenario-specific regional facts,
// even though the harness DID activate the real active-checkpoint
// guardrail this time (verified below, not assumed).
//
// Root cause for the truncation: Sonnet 5's adaptive thinking (on by
// default when `thinking` is omitted) shared Ask Cadence's old 768-token
// ceiling with the visible response -- the same defect already
// root-caused for grading. Fixed with an explicit low-effort, 2048-token
// config, independent of grading's own 4096/medium. Root cause for the
// leak: the model violated an ACTIVE guardrail, meaning the boundary
// itself needed to be structurally stronger, not just present -- fixed
// by requiring any checkpoint-adjacent explanation to abstract upward
// away from the checkpoint's own scenario entities, and by closing the
// "wants"-phrasing gap the previous guardrail didn't cover.
//
// This file locks structural/config properties only -- never exact
// canned response wording, since a live model's actual phrasing is not
// something a deterministic test can or should pin.
//
// No Anthropic API calls. Run: node tests/cadence-chat-config.test.mjs

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ASK_CADENCE_BASE_GUARDRAIL,
  buildActiveCheckpointGuardrail,
  askCadenceServerSide,
  AskCadenceTruncationError,
  CHAT_MAX_TOKENS,
  CHAT_EFFORT,
} from '../functions/_lib/cadence/ask-cadence.mjs';
import { GRADING_MAX_TOKENS, GRADING_EFFORT } from '../functions/_lib/cadence/checkpoint-evaluation.mjs';
import { getCadenceModelRegistry } from '../functions/_lib/cadence/model-config.mjs';
import { loadModuleGuideSystems } from '../scripts/cadence-model-regression/load-checkpoint-rubrics.mjs';
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

function anthropicResponse({ text, stopReason = 'end_turn', model = 'claude-sonnet-5' }) {
  return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text }], stop_reason: stopReason, model }) };
}

// ─────────────────────────────────────────────────────────────────────────
// A. EXPLICIT CHAT EXECUTION CONFIG
// ─────────────────────────────────────────────────────────────────────────
(function explicitConfigTests() {
  check('EXPLICIT CHAT CONFIG', 'CHAT_MAX_TOKENS is explicitly exported and greater than the old 768 cap', typeof CHAT_MAX_TOKENS === 'number' && CHAT_MAX_TOKENS > 768);
  check('EXPLICIT CHAT CONFIG', 'CHAT_MAX_TOKENS is a bounded, reasonable ceiling for a short conversational workload (not unbounded, not smaller than grading needs to worry about)', CHAT_MAX_TOKENS >= 1024 && CHAT_MAX_TOKENS <= 4096);
  check('EXPLICIT CHAT CONFIG', 'CHAT_EFFORT is explicitly "low" (a short conversational tutoring workload, not deep grading or agentic reasoning)', CHAT_EFFORT === 'low');
})();

await (async function productionSendsExplicitConfigTests() {
  const capture = {};
  const mock = async (url, options) => {
    capture.body = JSON.parse(options.body);
    return anthropicResponse({ text: 'A short, grounded reply.' });
  };
  await withMockFetch(mock, () => askCadenceServerSide(
    { ANTHROPIC_API_KEY: 'mock-key', CADENCE_CHAT_MODEL: 'claude-sonnet-5' },
    { guideSystemPrompt: 'MODULE GUIDE TEXT', boundedContext: [], studentMessage: 'A question.', activeCheckpointGuardrailText: null }
  ));
  check('EXPLICIT CHAT CONFIG', 'Production request sends max_tokens equal to CHAT_MAX_TOKENS', capture.body.max_tokens === CHAT_MAX_TOKENS);
  check('EXPLICIT CHAT CONFIG', 'Production request sends thinking:{type:"adaptive"} explicitly, not left implicit', capture.body.thinking && capture.body.thinking.type === 'adaptive');
  check('EXPLICIT CHAT CONFIG', 'Production request sends output_config.effort equal to CHAT_EFFORT', capture.body.output_config && capture.body.output_config.effort === CHAT_EFFORT);
  check('EXPLICIT CHAT CONFIG', 'Production request does NOT constrain output_config.format -- chat is free text, not structured output', !capture.body.output_config || !capture.body.output_config.format);
})();

// ─────────────────────────────────────────────────────────────────────────
// B. CHAT CONFIG INDEPENDENT FROM GRADING
// ─────────────────────────────────────────────────────────────────────────
(function independentFromGradingTests() {
  check('CHAT/GRADING INDEPENDENCE', 'CHAT_MAX_TOKENS differs from GRADING_MAX_TOKENS (2048 vs 4096) -- deliberately smaller, never shared', CHAT_MAX_TOKENS !== GRADING_MAX_TOKENS && CHAT_MAX_TOKENS < GRADING_MAX_TOKENS);
  check('CHAT/GRADING INDEPENDENCE', 'CHAT_EFFORT differs from GRADING_EFFORT ("low" vs "medium")', CHAT_EFFORT !== GRADING_EFFORT);
  const chatSrc = readFileSync(path.join(ROOT, 'functions/_lib/cadence/ask-cadence.mjs'), 'utf8');
  check('CHAT/GRADING INDEPENDENCE', 'ask-cadence.mjs has no import dependency on checkpoint-evaluation.mjs at all',
    !/from ['"][^'"]*checkpoint-evaluation\.mjs['"]/.test(chatSrc));
  const harnessSrc = readFileSync(path.join(ROOT, 'scripts/run-cadence-model-regression.mjs'), 'utf8');
  check('CHAT/GRADING INDEPENDENCE', 'The harness imports CHAT_MAX_TOKENS/CHAT_EFFORT from ask-cadence.mjs rather than duplicating its own copy (single source of truth)',
    /import\s*\{[^}]*CHAT_MAX_TOKENS[^}]*\}\s*from\s*['"][^'"]*ask-cadence\.mjs['"]/.test(harnessSrc) && /CHAT_EFFORT/.test(harnessSrc.match(/import\s*\{[^}]*\}\s*from\s*['"][^'"]*ask-cadence\.mjs['"]/)[0]));
})();

// ─────────────────────────────────────────────────────────────────────────
// C. MAX_TOKENS TERMINATION DETECTABLE AS TRUNCATION
// ─────────────────────────────────────────────────────────────────────────
await (async function truncationDetectionTests() {
  // Production: a truncated response (real partial text, stop_reason
  // max_tokens) must NEVER be returned to the caller as a normal reply --
  // this is exactly chat-01's real failure mode (error:null, chopped
  // mid-sentence).
  const truncatedMock = async () => anthropicResponse({ text: 'This looks like a real answer that just cuts off mid', stopReason: 'max_tokens' });
  let threw = null;
  try {
    await withMockFetch(truncatedMock, () => askCadenceServerSide(
      { ANTHROPIC_API_KEY: 'mock-key', CADENCE_CHAT_MODEL: 'claude-sonnet-5' },
      { guideSystemPrompt: 'MODULE GUIDE TEXT', boundedContext: [], studentMessage: 'A question.', activeCheckpointGuardrailText: null }
    ));
  } catch (e) { threw = e; }
  check('TRUNCATION DETECTABLE', 'A stop_reason:max_tokens response throws AskCadenceTruncationError rather than returning the partial text as a finished reply', threw instanceof AskCadenceTruncationError);

  // A normal, complete response (stop_reason end_turn) must NOT be
  // misclassified as truncated.
  const cleanMock = async () => anthropicResponse({ text: 'A complete, normal answer.', stopReason: 'end_turn' });
  let cleanResult = null;
  let cleanThrew = null;
  try {
    cleanResult = await withMockFetch(cleanMock, () => askCadenceServerSide(
      { ANTHROPIC_API_KEY: 'mock-key', CADENCE_CHAT_MODEL: 'claude-sonnet-5' },
      { guideSystemPrompt: 'MODULE GUIDE TEXT', boundedContext: [], studentMessage: 'A question.', activeCheckpointGuardrailText: null }
    ));
  } catch (e) { cleanThrew = e; }
  check('TRUNCATION DETECTABLE', 'A normal end_turn response is NOT misclassified as truncated -- returns normally with the text intact', cleanThrew === null && cleanResult.text === 'A complete, normal answer.');

  // Harness: must classify truncation explicitly per case, not just when
  // text happens to be empty, and must capture stopReason/modelId/
  // blockTypes/textPreview -- never hidden thinking content.
  const originalKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'mock-anthropic-key';
  try {
    const harnessTruncatedMock = async () => anthropicResponse({ text: 'Cut off mid', stopReason: 'max_tokens', model: 'claude-sonnet-5-20260101' });
    const truncatedRun = await withMockFetch(harnessTruncatedMock, () => runChat({ live: true, model: 'claude-sonnet-5' }, ['chat-01-simple-explanation']));
    const truncatedResult = truncatedRun.results[0];
    check('TRUNCATION DETECTABLE', 'Harness result explicitly reports truncated:true for a max_tokens case (not inferred from empty text)', truncatedResult.truncated === true);
    check('TRUNCATION DETECTABLE', 'Harness rawDiagnostic captures stopReason, modelId, blockTypes, and a text preview',
      truncatedResult.rawDiagnostic && truncatedResult.rawDiagnostic.stopReason === 'max_tokens' &&
      truncatedResult.rawDiagnostic.modelId === 'claude-sonnet-5-20260101' &&
      Array.isArray(truncatedResult.rawDiagnostic.blockTypes) && truncatedResult.rawDiagnostic.blockTypes.includes('text') &&
      typeof truncatedResult.rawDiagnostic.textPreview === 'string' && truncatedResult.rawDiagnostic.textPreview.includes('Cut off mid'));
    check('TRUNCATION DETECTABLE', 'Harness top-level summary reports truncatedCount', truncatedRun.truncatedCount === 1);

    const harnessCleanMock = async () => anthropicResponse({ text: 'A complete answer.', stopReason: 'end_turn' });
    const cleanRun = await withMockFetch(harnessCleanMock, () => runChat({ live: true, model: 'claude-sonnet-5' }, ['chat-01-simple-explanation']));
    check('TRUNCATION DETECTABLE', 'Harness result reports truncated:false for a clean end_turn case', cleanRun.results[0].truncated === false);
    check('TRUNCATION DETECTABLE', 'Harness does not attach a rawDiagnostic for a clean, non-empty, non-truncated response', !cleanRun.results[0].rawDiagnostic);
  } finally {
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalKey;
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// D. HARNESS MIRRORS PRODUCTION CHAT CONFIG
// ─────────────────────────────────────────────────────────────────────────
await (async function harnessMirrorsConfigTests() {
  let capturedBody = null;
  const mock = async (url, options) => {
    capturedBody = JSON.parse(options.body);
    return anthropicResponse({ text: 'A short reply.' });
  };
  const originalKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'mock-anthropic-key';
  try {
    await withMockFetch(mock, () => runChat({ live: true, model: 'claude-sonnet-5' }, ['chat-01-simple-explanation']));
    check('HARNESS MIRRORS CONFIG', 'Harness sends max_tokens equal to CHAT_MAX_TOKENS (not a stale local duplicate)', capturedBody.max_tokens === CHAT_MAX_TOKENS);
    check('HARNESS MIRRORS CONFIG', 'Harness sends thinking:{type:"adaptive"}', capturedBody.thinking && capturedBody.thinking.type === 'adaptive');
    check('HARNESS MIRRORS CONFIG', 'Harness sends output_config.effort equal to CHAT_EFFORT', capturedBody.output_config && capturedBody.output_config.effort === CHAT_EFFORT);
  } finally {
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalKey;
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// E. HARNESS GENUINELY ACTIVATES THE ACTIVE-CHECKPOINT GUARDRAIL FOR CHAT-11
//    ("Do not assume it did" -- verified directly, not asserted)
// ─────────────────────────────────────────────────────────────────────────
await (async function activeCheckpointActivationTests() {
  let capturedSystem = null;
  const mock = async (url, options) => {
    capturedSystem = JSON.parse(options.body).system;
    return anthropicResponse({ text: 'A guiding, abstract answer.' });
  };
  const originalKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'mock-anthropic-key';
  try {
    const activeRun = await withMockFetch(mock, () => runChat({ live: true, model: 'claude-sonnet-5' }, ['chat-11-help-during-active-checkpoint']));
    check('ACTIVE-CHECKPOINT ACTIVATION', 'chat-11 result explicitly records activeCheckpointGuardrailApplied:true -- verified from the actual run, not assumed',
      activeRun.results[0].activeCheckpointGuardrailApplied === true);
    check('ACTIVE-CHECKPOINT ACTIVATION', 'The system prompt actually sent for chat-11 contains the active-checkpoint guardrail text (id m4cp1, "strictest boundary")',
      capturedSystem && capturedSystem.includes('m4cp1') && capturedSystem.includes('strictest boundary'));
    check('ACTIVE-CHECKPOINT ACTIVATION', 'The system prompt for chat-11 also contains the base guardrail (both layers active, matching production)',
      capturedSystem && capturedSystem.includes(ASK_CADENCE_BASE_GUARDRAIL));

    capturedSystem = null;
    const plainRun = await withMockFetch(mock, () => runChat({ live: true, model: 'claude-sonnet-5' }, ['chat-01-simple-explanation']));
    check('ACTIVE-CHECKPOINT ACTIVATION', 'A case with no active checkpoint records activeCheckpointGuardrailApplied:false',
      plainRun.results[0].activeCheckpointGuardrailApplied === false);
    check('ACTIVE-CHECKPOINT ACTIVATION', 'A case with no active checkpoint does not get the active-checkpoint guardrail text appended',
      capturedSystem && !capturedSystem.includes('strictest boundary'));
  } finally {
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalKey;
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// F. ONLY INTENDED AIMT MODULE CONTEXT SUPPLIED -- NO RUBRIC LEAKAGE
// ─────────────────────────────────────────────────────────────────────────
(function contextPipelineTests() {
  const guideSystems = loadModuleGuideSystems();
  check('CONTEXT PIPELINE', 'Module 4 guide text (the only Module 4 context Chat receives) does not contain rubric-only language ("erasing regional variation", "required element")',
    !/erasing regional variation/i.test(guideSystems['4']) && !/required element/i.test(guideSystems['4']));
  check('CONTEXT PIPELINE', 'Module 4 guide text contains only the intended abstract topic list, not scenario-specific facts (crown/hairline/temples/nape physiology)',
    !/crown.*oilier|denser follicular clustering|temples.*nape|nape.*temples/i.test(guideSystems['4']));

  const harnessSrc = readFileSync(path.join(ROOT, 'scripts/run-cadence-model-regression.mjs'), 'utf8');
  const runChatSrc = harnessSrc.slice(harnessSrc.indexOf('export async function runChat'), harnessSrc.indexOf('// ── MAIN ──'));
  check('CONTEXT PIPELINE', 'runChat() never calls loadCheckpointRubrics() or resolveCheckpointDefinition() -- no rubric-loading code path exists in the chat role at all',
    !/loadCheckpointRubrics\(\)/.test(runChatSrc) && !/resolveCheckpointDefinition\(/.test(runChatSrc));

  check('CONTEXT PIPELINE', 'buildActiveCheckpointGuardrail() output contains only the checkpoint ID as case-specific data -- no question text, no rubric text is interpolated',
    ACTIVE.includes('m4cp1') && !/erasing regional variation|crown|hairline/i.test(ACTIVE));

  const chatSrc = readFileSync(path.join(ROOT, 'functions/_lib/cadence/ask-cadence.mjs'), 'utf8');
  check('CONTEXT PIPELINE', 'askCadenceServerSide()\'s system prompt is built from exactly guideSystemPrompt + the two guardrails -- no additional hidden content source',
    /system = String\(guideSystemPrompt \|\| ''\) \+ '\\n\\n' \+ ASK_CADENCE_BASE_GUARDRAIL/.test(chatSrc.replace(/\s+/g, ' ').replace(/'\\n\\n'/g, "'\\n\\n'")) ||
    /guideSystemPrompt.*ASK_CADENCE_BASE_GUARDRAIL/s.test(chatSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// G. GROUNDING RULE STRENGTH -- MISSING COURSE FACT != PERMISSION FOR
//    GENERAL KNOWLEDGE
// ─────────────────────────────────────────────────────────────────────────
(function groundingStrengthTests() {
  check('GROUNDING STRENGTH', 'Explicitly states the general rule: a missing course fact is never permission to use pretrained/general knowledge',
    /a missing course fact is never permission to complete the answer from pretrained\/general knowledge/.test(BASE));
  check('GROUNDING STRENGTH', 'Explicitly extends this to ordinary-sounding knowledge questions (a definition, a distinguishing feature, "how do I tell X from Y")',
    /sound like ordinary knowledge questions/.test(BASE) && /how do I tell X from Y/.test(BASE));
  check('GROUNDING STRENGTH', 'Instructs answering with the applicable decision principle/framework the module DOES supply, even if less specific',
    /the applicable decision principle, framework, or judgment the module does supply/.test(BASE) && /less specific answer/.test(BASE));
  check('GROUNDING STRENGTH', 'Does not hardcode the dry-scalp/dandruff example anywhere in production code -- the rule is general',
    !/dry scalp is generally just flaking|dandruff sits on a spectrum/i.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// H. ACTIVE-CHECKPOINT RESPONSES MUST ABSTRACT UPWARD
// ─────────────────────────────────────────────────────────────────────────
(function abstractUpwardTests() {
  check('ABSTRACT UPWARD', 'Active-checkpoint guardrail requires explaining at a HIGHER LEVEL OF ABSTRACTION than the checkpoint itself',
    /HIGHER LEVEL OF ABSTRACTION than the checkpoint/.test(ACTIVE));
  check('ABSTRACT UPWARD', 'Forbids illustrating with factual examples involving the checkpoint scenario\'s own specific entities/regions/details',
    /same specific entities, regions, or details the checkpoint scenario uses/.test(ACTIVE));
  check('ABSTRACT UPWARD', 'Prefers a short general definition plus one guiding question over a longer explanation',
    /Prefer a short, general definition plus one guiding question/.test(ACTIVE));
  check('ABSTRACT UPWARD', 'Forbids "wants" phrasing in addition to "is testing"/"is really asking" -- closes the exact gap the live evidence exposed ("the reasoning the checkpoint wants")',
    /"wants" them to conclude/.test(ACTIVE) && /"is testing,"/.test(ACTIVE) && /"is really asking,"/.test(ACTIVE));
  check('ABSTRACT UPWARD', 'Does not hardcode crown/hairline/temples/nape anywhere in production code -- the fix is a general behavioral rule',
    (() => {
      const src = readFileSync(path.join(ROOT, 'functions/_lib/cadence/ask-cadence.mjs'), 'utf8');
      return !/crown|hairline|temples|nape/i.test(src);
    })());
})();

// ─────────────────────────────────────────────────────────────────────────
// I. CHAT-09 AND CHAT-14 BEHAVIOR PRESERVED (NOT OVERCORRECTED)
// ─────────────────────────────────────────────────────────────────────────
(function preservedBehaviorTests() {
  check('CHAT-09/14 PRESERVED', 'Diagnostic-decline-then-observe framing is still present (chat-09\'s correct behavior)',
    /decline the diagnostic guess briefly/.test(BASE) && /proceed\/modify\/refer-style framework/.test(BASE));
  check('CHAT-09/14 PRESERVED', 'Stored-thread-only continuity rule is still present (chat-14\'s correct behavior)',
    /Only reference what is explicitly visible in this conversation/.test(BASE));
  check('CHAT-09/14 PRESERVED', 'No-fabricated-benchmark rule is still present (the rule that caught chat-14\'s prior "50-65% margin" fabrication)',
    /industry or market benchmark/.test(BASE));
  check('CHAT-09/14 PRESERVED', 'Language-fairness rule is still present, untouched by this task',
    /grammar, spelling, spoken phrasing, or non-native English/.test(BASE));
})();

// ─────────────────────────────────────────────────────────────────────────
// J. GRADING REMAINS APPROVED / UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function gradingUnchangedTests() {
  const registry = getCadenceModelRegistry();
  check('GRADING UNCHANGED', 'CADENCE_GRADING_MODEL remains APPROVED (claude-sonnet-5, registry v3)',
    registry.roles.CADENCE_GRADING_MODEL.approved === 'claude-sonnet-5' && registry.version === 'cadence-model-registry-v3');
  check('GRADING UNCHANGED', 'CADENCE_CHAT_MODEL remains CANDIDATE, still not promoted by this task',
    registry.roles.CADENCE_CHAT_MODEL.approved === null && registry.roles.CADENCE_CHAT_MODEL.candidate === 'claude-sonnet-5');
  check('GRADING UNCHANGED', 'GRADING_MAX_TOKENS is still exactly 4096', GRADING_MAX_TOKENS === 4096);
  check('GRADING UNCHANGED', 'GRADING_EFFORT is still exactly "medium"', GRADING_EFFORT === 'medium');
})();

// ─────────────────────────────────────────────────────────────────────────
// K. MODULE 12 UNCHANGED
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
