// Cadence model lifecycle — Haiku 4.5 registered as a Chat comparison
// CANDIDATE (registry v4), alongside the documented Sonnet 5 Chat
// prompt/config stop-loss.
//
// The final targeted Sonnet 5 Chat control run (docs/course-audit/
// cadence-sonnet5-chat-targeted-final-control-raw.json, preserved
// unmodified) came back 5/5 returned, 0/5 truncated -- execution config
// is fully healthy -- but chat-01 (grounding) and chat-11 (active-
// checkpoint answer leakage) still failed behaviorally. Per the
// documented stop-loss rule (cadence-sonnet5-chat-review.md), that rules
// out a third Sonnet 5 prompt patch and calls for evaluating a different
// Chat model candidate instead. This file proves the resulting change is
// exactly what "add a comparison candidate" must be: a new immutable
// registry version; Haiku 4.5 CANDIDATE for CADENCE_CHAT_MODEL only,
// never touching CADENCE_GRADING_MODEL; Sonnet 5 kept as a full Chat
// candidate with its history intact, not replaced; model-specific
// execution config (no adaptive thinking, no effort knob for Haiku) that
// leaves Sonnet's and grading's own configs untouched; the identical
// prompt/context/guardrails used for both models being compared, so the
// comparison is actually valid; and no dynamic per-message routing of
// any kind.
//
// No Anthropic API calls. Run: node tests/cadence-haiku-candidate.test.mjs

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getCadenceModelRegistry,
  resolveCadenceModel,
  CadenceModelConfigError,
} from '../functions/_lib/cadence/model-config.mjs';
import {
  CHAT_MAX_TOKENS,
  CHAT_EFFORT,
  resolveChatExecutionConfig,
  ASK_CADENCE_BASE_GUARDRAIL,
  buildActiveCheckpointGuardrail,
} from '../functions/_lib/cadence/ask-cadence.mjs';
import { GRADING_MAX_TOKENS, GRADING_EFFORT, rubricVersionTag } from '../functions/_lib/cadence/checkpoint-evaluation.mjs';
import { loadCheckpointRubrics } from '../scripts/cadence-model-regression/load-checkpoint-rubrics.mjs';
import { runChat } from '../scripts/run-cadence-model-regression.mjs';
import { bankVersion, SOURCE_HASHES, knowledgeBank, caseBank, interviewBank } from '../functions/_lib/certification/content-bank.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const HAIKU_ID = 'claude-haiku-4-5-20251001';
const CURRENT_VERSION = 'cadence-model-registry-v4';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const registry = getCadenceModelRegistry();

async function withMockFetch(mockImpl, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = mockImpl;
  try { return await fn(); } finally { globalThis.fetch = original; }
}

function anthropicResponse(text, model) {
  return async () => ({ ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text }], stop_reason: 'end_turn', model }) });
}

// ─────────────────────────────────────────────────────────────────────────
// A. HAIKU EXACT IDENTIFIER PINNED
// ─────────────────────────────────────────────────────────────────────────
(function haikuPinnedTests() {
  check('HAIKU PINNED', 'The current registry is v4 (a new version, not an in-place edit)', registry.version === CURRENT_VERSION);
  check('HAIKU PINNED', 'claude-haiku-4-5-20251001 is registered by its exact, fully-dated identifier -- not a pattern, alias, or partial string',
    !!registry.models[HAIKU_ID] && Object.keys(registry.models).includes(HAIKU_ID));
  check('HAIKU PINNED', 'The identifier contains no "latest" alias', !/latest/i.test(HAIKU_ID));
})();

// ─────────────────────────────────────────────────────────────────────────
// B. HAIKU IS CANDIDATE ONLY -- CHAT, NOT GRADING, NOT PROMOTED
// ─────────────────────────────────────────────────────────────────────────
(function haikuCandidateOnlyTests() {
  check('HAIKU CANDIDATE ONLY', 'claude-haiku-4-5-20251001 has status CANDIDATE (never APPROVED)', registry.models[HAIKU_ID].status === 'CANDIDATE');
  check('HAIKU CANDIDATE ONLY', 'CADENCE_CHAT_MODEL.additionalCandidates includes Haiku', (registry.roles.CADENCE_CHAT_MODEL.additionalCandidates || []).includes(HAIKU_ID));
  check('HAIKU CANDIDATE ONLY', 'CADENCE_CHAT_MODEL.approved is still null -- Haiku is not a default, not a promotion', registry.roles.CADENCE_CHAT_MODEL.approved === null);
  check('HAIKU CANDIDATE ONLY', 'Haiku is NOT registered anywhere in CADENCE_GRADING_MODEL (not approved, not candidate, not additionalCandidates)',
    registry.roles.CADENCE_GRADING_MODEL.approved !== HAIKU_ID &&
    registry.roles.CADENCE_GRADING_MODEL.candidate !== HAIKU_ID &&
    !(registry.roles.CADENCE_GRADING_MODEL.additionalCandidates || []).includes(HAIKU_ID));

  let chatDefaultThrew = false;
  try { resolveCadenceModel({}, 'CADENCE_CHAT_MODEL'); } catch (e) { chatDefaultThrew = e instanceof CadenceModelConfigError; }
  check('HAIKU CANDIDATE ONLY', 'With no override, CADENCE_CHAT_MODEL still fails safe (adding a comparison candidate does not create a default)', chatDefaultThrew);

  const haikuOverride = resolveCadenceModel({ CADENCE_CHAT_MODEL: HAIKU_ID }, 'CADENCE_CHAT_MODEL');
  check('HAIKU CANDIDATE ONLY', 'An explicit override naming Haiku resolves as CANDIDATE (source env-override-candidate), never APPROVED',
    haikuOverride.status === 'CANDIDATE' && haikuOverride.source === 'env-override-candidate' && haikuOverride.modelName === HAIKU_ID);
})();

// ─────────────────────────────────────────────────────────────────────────
// C. SONNET 5 GRADING REMAINS APPROVED, BYTE-FOR-BYTE UNCHANGED FROM V3
// ─────────────────────────────────────────────────────────────────────────
(function gradingUnchangedTests() {
  const v3 = getCadenceModelRegistry('cadence-model-registry-v3');
  check('GRADING UNCHANGED', 'CADENCE_GRADING_MODEL role in v4 is deep-equal to v3\'s -- copied forward, never edited',
    JSON.stringify(registry.roles.CADENCE_GRADING_MODEL) === JSON.stringify(v3.roles.CADENCE_GRADING_MODEL));
  check('GRADING UNCHANGED', 'claude-sonnet-5\'s grading-relevant status (APPROVED) is unchanged from v3', registry.models['claude-sonnet-5'].status === 'APPROVED');
  check('GRADING UNCHANGED', 'CADENCE_GRADING_MODEL.approved is still exactly claude-sonnet-5', registry.roles.CADENCE_GRADING_MODEL.approved === 'claude-sonnet-5');
  check('GRADING UNCHANGED', 'GRADING_MAX_TOKENS is still exactly 4096', GRADING_MAX_TOKENS === 4096);
  check('GRADING UNCHANGED', 'GRADING_EFFORT is still exactly "medium"', GRADING_EFFORT === 'medium');
  const resolved = resolveCadenceModel({}, 'CADENCE_GRADING_MODEL');
  check('GRADING UNCHANGED', 'resolveCadenceModel(CADENCE_GRADING_MODEL) with no override still resolves claude-sonnet-5/APPROVED by default',
    resolved.modelName === 'claude-sonnet-5' && resolved.status === 'APPROVED' && resolved.source === 'approved-default');
})();

// ─────────────────────────────────────────────────────────────────────────
// D. SONNET 5 CHAT STATUS/HISTORY PRESERVED
// ─────────────────────────────────────────────────────────────────────────
(function sonnetChatHistoryTests() {
  check('SONNET CHAT HISTORY', 'CADENCE_CHAT_MODEL.candidate is still exactly claude-sonnet-5 -- not replaced by Haiku', registry.roles.CADENCE_CHAT_MODEL.candidate === 'claude-sonnet-5');
  const v3 = getCadenceModelRegistry('cadence-model-registry-v3');
  check('SONNET CHAT HISTORY', 'Historical v3 registry remains fully intact and fetchable (rollback/history target)', v3.roles.CADENCE_CHAT_MODEL.candidate === 'claude-sonnet-5' && v3.roles.CADENCE_CHAT_MODEL.approved === null);
  const sonnetOverride = resolveCadenceModel({ CADENCE_CHAT_MODEL: 'claude-sonnet-5' }, 'CADENCE_CHAT_MODEL');
  check('SONNET CHAT HISTORY', 'Sonnet 5 remains fully usable as a Chat override candidate, unaffected by Haiku\'s addition', sonnetOverride.status === 'CANDIDATE' && sonnetOverride.modelName === 'claude-sonnet-5');
})();

// ─────────────────────────────────────────────────────────────────────────
// E/F. HAIKU EXECUTION CONFIG: NO ADAPTIVE THINKING, NO EFFORT KNOB
// ─────────────────────────────────────────────────────────────────────────
(function haikuExecConfigStaticTests() {
  const cfg = resolveChatExecutionConfig(HAIKU_ID);
  check('HAIKU EXEC CONFIG', 'Haiku config sends thinking: null (no adaptive thinking)', cfg.thinking === null);
  check('HAIKU EXEC CONFIG', 'Haiku config sends outputConfig: null (no effort knob)', cfg.outputConfig === null);
  check('HAIKU EXEC CONFIG', 'Haiku max_tokens is in the suggested 1024-2048 range', cfg.maxTokens >= 1024 && cfg.maxTokens <= 2048);
})();

await (async function haikuExecConfigEndToEndTests() {
  const originalKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'mock-anthropic-key';
  try {
    let capturedBody = null;
    const mock = async (url, options) => {
      capturedBody = JSON.parse(options.body);
      return anthropicResponse('A short, concise reply.', HAIKU_ID)();
    };
    await withMockFetch(mock, () => runChat({ live: true, model: HAIKU_ID }, ['chat-01-simple-explanation']));
    check('HAIKU EXEC CONFIG', 'Live Haiku request does NOT include a "thinking" key at all', !('thinking' in capturedBody));
    check('HAIKU EXEC CONFIG', 'Live Haiku request does NOT include an "output_config" key at all', !('output_config' in capturedBody));
    check('HAIKU EXEC CONFIG', 'Live Haiku request uses the Haiku model identifier', capturedBody.model === HAIKU_ID);
    check('HAIKU EXEC CONFIG', 'Live Haiku request max_tokens matches resolveChatExecutionConfig', capturedBody.max_tokens === resolveChatExecutionConfig(HAIKU_ID).maxTokens);
  } finally {
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalKey;
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// G. SONNET 5 CHAT EXECUTION CONFIG UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function sonnetExecConfigUnchangedTests() {
  check('SONNET EXEC CONFIG UNCHANGED', 'CHAT_MAX_TOKENS is still exactly 2048', CHAT_MAX_TOKENS === 2048);
  check('SONNET EXEC CONFIG UNCHANGED', 'CHAT_EFFORT is still exactly "low"', CHAT_EFFORT === 'low');
  const cfg = resolveChatExecutionConfig('claude-sonnet-5');
  check('SONNET EXEC CONFIG UNCHANGED', 'resolveChatExecutionConfig("claude-sonnet-5") still returns adaptive thinking + low effort + 2048', cfg.maxTokens === 2048 && cfg.thinking.type === 'adaptive' && cfg.outputConfig.effort === 'low');
})();

// ─────────────────────────────────────────────────────────────────────────
// I/J. IDENTICAL PROMPT/CONTEXT/GUARDRAILS ACROSS THE MODEL COMPARISON,
//      INCLUDING THE ACTIVE-CHECKPOINT GUARDRAIL FOR CHAT-11
// ─────────────────────────────────────────────────────────────────────────
await (async function identicalPromptAcrossModelsTests() {
  const originalKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'mock-anthropic-key';
  try {
    let sonnetSystem = null;
    const sonnetMock = async (url, options) => { sonnetSystem = JSON.parse(options.body).system; return anthropicResponse('A Sonnet reply.', 'claude-sonnet-5')(); };
    await withMockFetch(sonnetMock, () => runChat({ live: true, model: 'claude-sonnet-5' }, ['chat-11-help-during-active-checkpoint']));

    let haikuSystem = null;
    let haikuBody = null;
    const haikuMock = async (url, options) => { haikuBody = JSON.parse(options.body); haikuSystem = haikuBody.system; return anthropicResponse('A Haiku reply.', HAIKU_ID)(); };
    const haikuRun = await withMockFetch(haikuMock, () => runChat({ live: true, model: HAIKU_ID }, ['chat-11-help-during-active-checkpoint']));

    check('IDENTICAL PROMPT ACROSS MODELS', 'The system prompt sent to Sonnet and to Haiku for the SAME case is byte-identical -- only the model-specific execution config (checked separately) differs',
      sonnetSystem !== null && haikuSystem !== null && sonnetSystem === haikuSystem);
    check('IDENTICAL PROMPT ACROSS MODELS', 'The identical system prompt still contains the base guardrail', haikuSystem.includes(ASK_CADENCE_BASE_GUARDRAIL));
    check('ACTIVE CHECKPOINT STILL ACTIVE', 'The active-checkpoint guardrail (id m4cp1, "strictest boundary") is present for chat-11 regardless of which model is being compared',
      haikuSystem.includes('m4cp1') && haikuSystem.includes('strictest boundary') && haikuSystem.includes(buildActiveCheckpointGuardrail('m4cp1')));
    check('ACTIVE CHECKPOINT STILL ACTIVE', 'The harness result records activeCheckpointGuardrailApplied:true for chat-11 under the Haiku run too', haikuRun.results[0].activeCheckpointGuardrailApplied === true);
    check('ACTIVE CHECKPOINT STILL ACTIVE', 'The Haiku request body carries no thinking/output_config even though the guardrail text is present -- prompt and execution config are independent axes',
      !('thinking' in haikuBody) && !('output_config' in haikuBody));

    // Same check for a non-checkpoint case, to prove identity isn't a
    // coincidence of one particular case's prompt.
    let sonnetSystem2 = null;
    const sonnetMock2 = async (url, options) => { sonnetSystem2 = JSON.parse(options.body).system; return anthropicResponse('A Sonnet reply.', 'claude-sonnet-5')(); };
    await withMockFetch(sonnetMock2, () => runChat({ live: true, model: 'claude-sonnet-5' }, ['chat-14-returning-days-later']));
    let haikuSystem2 = null;
    const haikuMock2 = async (url, options) => { haikuSystem2 = JSON.parse(options.body).system; return anthropicResponse('A Haiku reply.', HAIKU_ID)(); };
    await withMockFetch(haikuMock2, () => runChat({ live: true, model: HAIKU_ID }, ['chat-14-returning-days-later']));
    check('IDENTICAL PROMPT ACROSS MODELS', 'Same identity holds for a second, non-checkpoint case (chat-14)', sonnetSystem2 === haikuSystem2);
  } finally {
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalKey;
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// K. NO DYNAMIC ROUTING
// ─────────────────────────────────────────────────────────────────────────
(function noDynamicRoutingTests() {
  const chatSrc = readFileSync(path.join(ROOT, 'functions/_lib/cadence/ask-cadence.mjs'), 'utf8');
  check('NO DYNAMIC ROUTING', 'resolveChatExecutionConfig() takes only a model name, never message/student content -- it cannot route based on what was asked',
    /function resolveChatExecutionConfig\(modelName\)/.test(chatSrc));
  check('NO DYNAMIC ROUTING', 'callAnthropicForAskCadence() resolves the model exactly once via resolveCadenceModel(), not per-message branching on content',
    (chatSrc.match(/=\s*resolveCadenceModel\(/g) || []).length === 1);
  check('NO DYNAMIC ROUTING', 'No code path selects between claude-sonnet-5 and claude-haiku-4-5-20251001 based on studentMessage/boundedContext content',
    !/studentMessage[\s\S]{0,80}(sonnet|haiku)/i.test(chatSrc) && !/(sonnet|haiku)[\s\S]{0,80}studentMessage/i.test(chatSrc));

  const harnessSrc = readFileSync(path.join(ROOT, 'scripts/run-cadence-model-regression.mjs'), 'utf8');
  const runChatSrc = harnessSrc.slice(harnessSrc.indexOf('export async function runChat'), harnessSrc.indexOf('// ── MAIN ──'));
  check('NO DYNAMIC ROUTING', 'runChat() resolves modelInfo exactly ONCE per run (outside the per-case loop), not re-decided per case/message',
    (() => {
      const beforeLoop = runChatSrc.slice(0, runChatSrc.indexOf('for (const testCase of selected)'));
      return /resolveHarnessModel\(/.test(beforeLoop) && !/resolveHarnessModel\(/.test(runChatSrc.slice(runChatSrc.indexOf('for (const testCase of selected)')));
    })());
  check('NO DYNAMIC ROUTING', 'One model per run: --model is a single string, not a list/map the harness could iterate and choose from per case',
    (() => {
      const argsSrc = harnessSrc.slice(harnessSrc.indexOf('export function parseArgs'), harnessSrc.indexOf('export function parseArgs') + 1200);
      return /k === 'model'\) args\.model = v;/.test(argsSrc) && !/args\.models\s*=/.test(harnessSrc);
    })());
})();

// ─────────────────────────────────────────────────────────────────────────
// L/M. NO "LATEST" ALIAS, NO SILENT FALLBACK
// ─────────────────────────────────────────────────────────────────────────
(function noLatestNoFallbackTests() {
  check('NO LATEST / NO FALLBACK', 'No registered model key in the current registry contains "latest"',
    Object.keys(registry.models).every((name) => !/latest/i.test(name)));

  let unregisteredThrew = false;
  try { resolveCadenceModel({ CADENCE_CHAT_MODEL: 'claude-haiku-latest' }, 'CADENCE_CHAT_MODEL'); } catch (e) { unregisteredThrew = e instanceof CadenceModelConfigError; }
  check('NO LATEST / NO FALLBACK', 'An unregistered "claude-haiku-latest" style alias is rejected outright, never silently resolved to the real Haiku candidate',
    unregisteredThrew);

  let typoThrew = false;
  try { resolveCadenceModel({ CADENCE_CHAT_MODEL: 'claude-haiku-4-5' }, 'CADENCE_CHAT_MODEL'); } catch (e) { typoThrew = e instanceof CadenceModelConfigError; }
  check('NO LATEST / NO FALLBACK', 'An imprecise/undated Haiku string (missing the exact snapshot suffix) is rejected, not silently matched to the pinned identifier',
    typoThrew);
})();

// ─────────────────────────────────────────────────────────────────────────
// N. MODULE 12 UNCHANGED
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
// O. CHECKPOINT CONTENT / RUBRICS UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function checkpointContentUnchangedTests() {
  const rubrics = loadCheckpointRubrics();
  check('CHECKPOINT CONTENT UNCHANGED', 'Full M0-M11 checkpoint rubric/question set is byte-identical to its pre-existing fingerprint',
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
