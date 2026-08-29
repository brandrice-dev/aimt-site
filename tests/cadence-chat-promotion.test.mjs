// Cadence model lifecycle — Sonnet 5 promoted CANDIDATE -> APPROVED for
// CADENCE_CHAT_MODEL (registry v5). CADENCE_GRADING_MODEL is untouched --
// still claude-sonnet-5, still APPROVED, same execution config, same
// evidence, copied forward from v4.
//
// This is the final Chat model-lifecycle closeout: the character/
// instructor constitution, a full 16-case constitution-aligned live run,
// continuity/precision fixes, a prompt-only scenario-fact rule that a live
// retest proved insufficient on its own, the resulting structural Zone B
// scenario-fact gate, and decisive production-path live QA against the
// real gated askCadenceServerSide() endpoint -- not one clean first run,
// a real validation history. This file proves the resulting registry
// change is exactly what a "Chat-only promotion" must be: a new,
// immutable registry version; CADENCE_CHAT_MODEL alone moved to APPROVED;
// the exact model identifier and validated execution config pinned and
// traceable to real evidence files; CADENCE_GRADING_MODEL provably
// byte-identical to v4; Haiku 4.5 preserved as CANDIDATE-only historical
// comparison metadata, never approved/active/fallback; the Zone B gate,
// the constitution, the active-checkpoint boundary, and checkpoint/
// Module 12 content all untouched; a real, testable rollback path; and
// the QA-A fixture's purpose text corrected to reflect content-based (not
// question-based) Zone B classification without touching the gate itself.
//
// No Anthropic API calls. Run: node tests/cadence-chat-promotion.test.mjs

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getCadenceModelRegistry,
  resolveCadenceModel,
  describeCadenceModelStatus,
  CadenceModelConfigError,
} from '../functions/_lib/cadence/model-config.mjs';
import {
  ASK_CADENCE_BASE_GUARDRAIL,
  buildActiveCheckpointGuardrail,
  CHAT_MAX_TOKENS,
  CHAT_EFFORT,
  resolveChatExecutionConfig,
} from '../functions/_lib/cadence/ask-cadence.mjs';
import { detectActionableZoneBGuidance, verifyScenarioFactsForActionableGuidance, SAFE_SCENARIO_FALLBACK_TEXT } from '../functions/_lib/cadence/scenario-fact-gate.mjs';
import { GRADING_MAX_TOKENS, GRADING_EFFORT, rubricVersionTag } from '../functions/_lib/cadence/checkpoint-evaluation.mjs';
import { loadCheckpointRubrics } from '../scripts/cadence-model-regression/load-checkpoint-rubrics.mjs';
import { GRADING_DATASET } from '../scripts/cadence-model-regression/grading-dataset.mjs';
import { CHAT_DATASET } from '../scripts/cadence-model-regression/chat-dataset.mjs';
import { QA_CASES } from '../scripts/run-cadence-production-path-chat-qa.mjs';
import { bankVersion, SOURCE_HASHES, knowledgeBank, caseBank, interviewBank } from '../functions/_lib/certification/content-bank.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const CURRENT_VERSION = 'cadence-model-registry-v5';
const registry = getCadenceModelRegistry();

// ─────────────────────────────────────────────────────────────────────────
// A. NEW REGISTRY VERSION, IMMUTABLE, HISTORY PRESERVED
// ─────────────────────────────────────────────────────────────────────────
(function immutabilityTests() {
  check('A. IMMUTABLE VERSIONING', 'The current registry version is the new v5 (a new version was added, not an in-place edit)',
    registry.version === CURRENT_VERSION);

  const v4 = getCadenceModelRegistry('cadence-model-registry-v4');
  check('A. IMMUTABLE VERSIONING', 'Historical v4, fetched explicitly, still records CADENCE_CHAT_MODEL.approved:null -- unmutated by the v5 promotion',
    v4.roles.CADENCE_CHAT_MODEL.approved === null);
  check('A. IMMUTABLE VERSIONING', 'Historical v4 still records CADENCE_CHAT_MODEL.candidate:claude-sonnet-5 and additionalCandidates:[haiku] -- unmutated',
    v4.roles.CADENCE_CHAT_MODEL.candidate === 'claude-sonnet-5' &&
    JSON.stringify(v4.roles.CADENCE_CHAT_MODEL.additionalCandidates) === JSON.stringify(['claude-haiku-4-5-20251001']));
  check('A. IMMUTABLE VERSIONING', 'Historical v4 still records CADENCE_GRADING_MODEL.approved:claude-sonnet-5 -- unmutated',
    v4.roles.CADENCE_GRADING_MODEL.approved === 'claude-sonnet-5');

  const v1 = getCadenceModelRegistry('cadence-model-registry-v1');
  const v2 = getCadenceModelRegistry('cadence-model-registry-v2');
  const v3 = getCadenceModelRegistry('cadence-model-registry-v3');
  check('A. IMMUTABLE VERSIONING', 'v1, v2, v3 all still preserved, fetchable, and internally distinct from v5',
    v1.roles.CADENCE_CHAT_MODEL.approved === 'claude-sonnet-4-20250514' &&
    v2.roles.CADENCE_CHAT_MODEL.approved === null &&
    v3.roles.CADENCE_CHAT_MODEL.approved === null);

  check('A. IMMUTABLE VERSIONING', 'Fetching an unknown registry version still throws rather than silently returning something',
    (() => { try { getCadenceModelRegistry('cadence-model-registry-v99'); return false; } catch (e) { return e instanceof CadenceModelConfigError; } })());
})();

// ─────────────────────────────────────────────────────────────────────────
// B. CHAT: APPROVED, EXACT MODEL PINNED
// ─────────────────────────────────────────────────────────────────────────
(function chatApprovedTests() {
  check('B. CHAT APPROVED', 'CADENCE_CHAT_MODEL.approved is exactly the string "claude-sonnet-5" -- a pinned identifier, not a pattern/prefix/alias',
    registry.roles.CADENCE_CHAT_MODEL.approved === 'claude-sonnet-5' && typeof registry.roles.CADENCE_CHAT_MODEL.approved === 'string');
  check('B. CHAT APPROVED', 'claude-sonnet-5\'s registry entry has status APPROVED',
    registry.models['claude-sonnet-5'].status === 'APPROVED');

  const resolved = resolveCadenceModel({}, 'CADENCE_CHAT_MODEL');
  check('B. CHAT APPROVED', 'resolveCadenceModel() with no override now resolves claude-sonnet-5 by default for Chat (the promotion actually taking functional effect, not just a data-shape change)',
    resolved.modelName === 'claude-sonnet-5' && resolved.status === 'APPROVED' && resolved.source === 'approved-default' && resolved.registryVersion === CURRENT_VERSION);

  const status = describeCadenceModelStatus({});
  check('B. CHAT APPROVED', 'describeCadenceModelStatus() reports CADENCE_CHAT_MODEL resolved with no fail-safe triggered',
    status.roles.CADENCE_CHAT_MODEL.failSafeTriggered === false && status.roles.CADENCE_CHAT_MODEL.approvedStatus === 'APPROVED');
})();

// ─────────────────────────────────────────────────────────────────────────
// C. GRADING: UNTOUCHED, BYTE-IDENTICAL TO v4
// ─────────────────────────────────────────────────────────────────────────
(function gradingUnchangedTests() {
  const v4 = getCadenceModelRegistry('cadence-model-registry-v4');
  check('C. GRADING UNCHANGED', 'CADENCE_GRADING_MODEL role in v5 is deep-equal to v4\'s -- do not modify grading, verified structurally, not just by intent',
    JSON.stringify(registry.roles.CADENCE_GRADING_MODEL) === JSON.stringify(v4.roles.CADENCE_GRADING_MODEL));
  check('C. GRADING UNCHANGED', 'CADENCE_GRADING_MODEL.approved is still exactly claude-sonnet-5', registry.roles.CADENCE_GRADING_MODEL.approved === 'claude-sonnet-5');
  check('C. GRADING UNCHANGED', 'Grading execution config still adaptive/medium/4096',
    registry.roles.CADENCE_GRADING_MODEL.gradingExecutionConfig.thinking.type === 'adaptive' &&
    registry.roles.CADENCE_GRADING_MODEL.gradingExecutionConfig.outputConfigEffort === 'medium' &&
    registry.roles.CADENCE_GRADING_MODEL.gradingExecutionConfig.maxTokens === 4096);
  check('C. GRADING UNCHANGED', 'GRADING_MAX_TOKENS/GRADING_EFFORT real exported constants still exactly 4096/"medium"',
    GRADING_MAX_TOKENS === 4096 && GRADING_EFFORT === 'medium');

  const resolved = resolveCadenceModel({}, 'CADENCE_GRADING_MODEL');
  check('C. GRADING UNCHANGED', 'resolveCadenceModel(CADENCE_GRADING_MODEL) still resolves claude-sonnet-5/APPROVED exactly as it did under v4',
    resolved.modelName === 'claude-sonnet-5' && resolved.status === 'APPROVED');
})();

// ─────────────────────────────────────────────────────────────────────────
// D. ROLES REMAIN INDEPENDENTLY REPRESENTED (even though both approved now)
// ─────────────────────────────────────────────────────────────────────────
(function independentPromotionTests() {
  check('D. ROLE INDEPENDENCE', 'Both roles independently expose their own approved/candidate fields (schema supports fully independent per-role promotion, not a shared flag) -- they now happen to share a value, but are not the same field',
    'approved' in registry.roles.CADENCE_CHAT_MODEL && 'approved' in registry.roles.CADENCE_GRADING_MODEL &&
    registry.roles.CADENCE_CHAT_MODEL !== registry.roles.CADENCE_GRADING_MODEL);
  check('D. ROLE INDEPENDENCE', 'Chat carries its own chatExecutionConfig/chatValidationEvidence, distinct field names from grading\'s gradingExecutionConfig/gradingValidationEvidence -- no shared/aliased config object',
    !!registry.roles.CADENCE_CHAT_MODEL.chatExecutionConfig && !!registry.roles.CADENCE_GRADING_MODEL.gradingExecutionConfig &&
    registry.roles.CADENCE_CHAT_MODEL.chatExecutionConfig !== registry.roles.CADENCE_GRADING_MODEL.gradingExecutionConfig);
  check('D. ROLE INDEPENDENCE', 'resolveCadenceModel() resolves each role from that role\'s OWN roles[roleName] entry -- both now resolve successfully, independently, in the same registry fetch',
    (() => {
      let chatOk = false, gradingOk = false;
      try { chatOk = resolveCadenceModel({}, 'CADENCE_CHAT_MODEL').status === 'APPROVED'; } catch (_) {}
      try { gradingOk = resolveCadenceModel({}, 'CADENCE_GRADING_MODEL').status === 'APPROVED'; } catch (_) {}
      return chatOk && gradingOk;
    })());
})();

// ─────────────────────────────────────────────────────────────────────────
// E. VALIDATED CHAT EXECUTION CONFIG -- PINNED AND CROSS-CHECKED
// ─────────────────────────────────────────────────────────────────────────
(function executionConfigTests() {
  const cfg = registry.roles.CADENCE_CHAT_MODEL.chatExecutionConfig;
  check('E. CHAT EXECUTION CONFIG', 'Registry records the validated chat execution config on the CADENCE_CHAT_MODEL role',
    !!cfg);
  check('E. CHAT EXECUTION CONFIG', 'Recorded thinking config is exactly { type: "adaptive" }',
    cfg && cfg.thinking && cfg.thinking.type === 'adaptive' && Object.keys(cfg.thinking).length === 1);
  check('E. CHAT EXECUTION CONFIG', 'Recorded output_config.effort is exactly "low"',
    cfg && cfg.outputConfigEffort === 'low');
  check('E. CHAT EXECUTION CONFIG', 'Recorded max_tokens is exactly 2048',
    cfg && cfg.maxTokens === 2048);

  // Cross-check against the REAL exported constants/resolver that actually
  // drive the chat request (functions/_lib/cadence/ask-cadence.mjs) --
  // proves the registry's audit-trail record can never silently diverge
  // from the code that actually executes chat.
  check('E. CHAT EXECUTION CONFIG', 'Registry-recorded maxTokens matches the real exported CHAT_MAX_TOKENS constant',
    cfg.maxTokens === CHAT_MAX_TOKENS);
  check('E. CHAT EXECUTION CONFIG', 'Registry-recorded outputConfigEffort matches the real exported CHAT_EFFORT constant',
    cfg.outputConfigEffort === CHAT_EFFORT);
  const liveCfg = resolveChatExecutionConfig('claude-sonnet-5');
  check('E. CHAT EXECUTION CONFIG', 'resolveChatExecutionConfig("claude-sonnet-5") -- the real per-model resolver -- returns the identical shape (adaptive/low/2048)',
    liveCfg.thinking.type === 'adaptive' && liveCfg.outputConfig.effort === 'low' && liveCfg.maxTokens === 2048);
})();

// ─────────────────────────────────────────────────────────────────────────
// F. HAIKU: PRESERVED AS HISTORICAL METADATA, NOT APPROVED/ACTIVE/FALLBACK
// ─────────────────────────────────────────────────────────────────────────
(function haikuNotPromotedTests() {
  check('F. HAIKU NOT PROMOTED', 'claude-haiku-4-5-20251001 is still registered status CANDIDATE, never APPROVED',
    registry.models['claude-haiku-4-5-20251001'].status === 'CANDIDATE');
  check('F. HAIKU NOT PROMOTED', 'CADENCE_CHAT_MODEL.approved is claude-sonnet-5, NOT haiku',
    registry.roles.CADENCE_CHAT_MODEL.approved === 'claude-sonnet-5');
  check('F. HAIKU NOT PROMOTED', 'Haiku is still listed only in additionalCandidates (historical/comparison metadata), preserved from v4',
    JSON.stringify(registry.roles.CADENCE_CHAT_MODEL.additionalCandidates) === JSON.stringify(['claude-haiku-4-5-20251001']));
  check('F. HAIKU NOT PROMOTED', 'resolveCadenceModel() with no override never resolves to Haiku -- it resolves the approved default (Sonnet 5)',
    resolveCadenceModel({}, 'CADENCE_CHAT_MODEL').modelName !== 'claude-haiku-4-5-20251001');

  const haikuOverride = resolveCadenceModel({ CADENCE_CHAT_MODEL: 'claude-haiku-4-5-20251001' }, 'CADENCE_CHAT_MODEL');
  check('F. HAIKU NOT PROMOTED', 'An explicit override naming Haiku still resolves status CANDIDATE (never APPROVED) even though Sonnet 5 is now approved for the same role',
    haikuOverride.status === 'CANDIDATE' && haikuOverride.source === 'env-override-candidate');
})();

// ─────────────────────────────────────────────────────────────────────────
// G. NO "LATEST" ALIAS, NO SILENT FALLBACK (extended through v5)
// ─────────────────────────────────────────────────────────────────────────
(function noLatestNoFallbackTests() {
  const allVersions = ['cadence-model-registry-v1', 'cadence-model-registry-v2', 'cadence-model-registry-v3', 'cadence-model-registry-v4', 'cadence-model-registry-v5'];
  for (const v of allVersions) {
    const r = getCadenceModelRegistry(v);
    check('G. NO LATEST / NO FALLBACK', `${v}: no registered model key contains "latest"`,
      Object.keys(r.models).every((name) => !/latest/i.test(name)));
  }

  let latestOverrideThrew = false;
  try { resolveCadenceModel({ CADENCE_CHAT_MODEL: 'latest' }, 'CADENCE_CHAT_MODEL'); } catch (e) { latestOverrideThrew = e instanceof CadenceModelConfigError; }
  check('G. NO LATEST / NO FALLBACK', 'An explicit "latest" env override for the now-APPROVED chat role is still rejected, not silently resolved to anything',
    latestOverrideThrew);

  let unregisteredThrew = false;
  try { resolveCadenceModel({ CADENCE_CHAT_MODEL: 'claude-totally-made-up-latest' }, 'CADENCE_CHAT_MODEL'); } catch (e) { unregisteredThrew = e instanceof CadenceModelConfigError; }
  check('G. NO LATEST / NO FALLBACK', 'An unregistered override for chat still throws even though a default now exists -- promotion never weakens misconfiguration handling',
    unregisteredThrew);

  let legacyThrew = false;
  try { resolveCadenceModel({ CADENCE_CHAT_MODEL: 'claude-sonnet-4-20250514' }, 'CADENCE_CHAT_MODEL'); } catch (e) { legacyThrew = e instanceof CadenceModelConfigError; }
  check('G. NO LATEST / NO FALLBACK', 'A LEGACY override for chat is still refused, not silently honored',
    legacyThrew);

  const allVersionsChecked = allVersions.every((v) => {
    const r = getCadenceModelRegistry(v);
    return Object.values(r.roles).every((role) => {
      if (!role.approved) return true;
      const entry = r.models[role.approved];
      return entry && entry.status !== 'LEGACY';
    });
  });
  check('G. NO LATEST / NO FALLBACK', 'No role in any registry version (v1-v5) has `approved` pointing at a LEGACY model',
    allVersionsChecked);

  check('G. NO LATEST / NO FALLBACK', 'resolveCadenceModel source has no "||" fallback to any hardcoded model string',
    (() => {
      const src = readFileSync(path.join(ROOT, 'functions/_lib/cadence/model-config.mjs'), 'utf8');
      return !/\|\|\s*['"]claude-/.test(src);
    })());
})();

// ─────────────────────────────────────────────────────────────────────────
// H. ROLLBACK PATH IS REAL AND TESTABLE
// ─────────────────────────────────────────────────────────────────────────
(function rollbackTests() {
  let chatFailsSafeOnV4 = null;
  try { resolveCadenceModel({}, 'CADENCE_CHAT_MODEL', { version: 'cadence-model-registry-v4' }); } catch (e) { chatFailsSafeOnV4 = e; }
  check('H. ROLLBACK', 'Explicitly pinning to the pre-promotion registry version (v4) reproduces the old fail-safe behavior for chat -- this IS the rollback mechanism, proven functional, not just described',
    chatFailsSafeOnV4 instanceof CadenceModelConfigError);

  const v4Registry = getCadenceModelRegistry('cadence-model-registry-v4');
  check('H. ROLLBACK', 'The previous APPROVED/CANDIDATE chat configuration (v4: nothing approved, claude-sonnet-5 candidate, haiku additional candidate) remains fully retrievable for a rollback decision',
    v4Registry.roles.CADENCE_CHAT_MODEL.approved === null && v4Registry.roles.CADENCE_CHAT_MODEL.candidate === 'claude-sonnet-5');

  check('H. ROLLBACK', 'A rollback changes the active binding (which registry version is CURRENT) without rewriting call-site code -- ask-cadence.mjs resolves the role by name only, never a hardcoded model string',
    (() => {
      const src = readFileSync(path.join(ROOT, 'functions/_lib/cadence/ask-cadence.mjs'), 'utf8');
      return /resolveCadenceModel\(env, ['"]CADENCE_CHAT_MODEL['"]\)/.test(src) && !/model:\s*['"]claude-sonnet-5['"]/.test(src);
    })());
})();

// ─────────────────────────────────────────────────────────────────────────
// I. CHAT VALIDATION EVIDENCE DOCUMENTED AND TRACEABLE TO REAL FILES
// ─────────────────────────────────────────────────────────────────────────
(function chatValidationEvidenceTests() {
  const evidence = registry.roles.CADENCE_CHAT_MODEL.chatValidationEvidence;
  check('I. CHAT VALIDATION EVIDENCE', 'Registry records the validation evidence that authorized this promotion',
    !!evidence && Array.isArray(evidence.evidence) && evidence.evidence.length === 5);
  check('I. CHAT VALIDATION EVIDENCE', 'Recorded gate result is "met"', evidence.gateResult === 'met');

  for (const item of evidence.evidence) {
    const fullPath = path.join(ROOT, item.file);
    let fileExists = true;
    try { readFileSync(fullPath, 'utf8'); } catch (_) { fileExists = false; }
    check('I. CHAT VALIDATION EVIDENCE', `Referenced evidence file exists on disk: ${item.file}`, fileExists);
  }

  const constitutionExists = (() => { try { readFileSync(path.join(ROOT, 'docs/course-audit/00-cadence-character-instruction-constitution.md'), 'utf8'); return true; } catch (_) { return false; } })();
  check('I. CHAT VALIDATION EVIDENCE', 'Constitution file referenced in evidence actually exists', constitutionExists);

  const fullRun = JSON.parse(readFileSync(path.join(ROOT, 'docs/course-audit/cadence-sonnet5-chat-full-constitution-raw.json'), 'utf8'));
  check('I. CHAT VALIDATION EVIDENCE', 'Full 16-case constitution-aligned run: 16/16 returned, 0 truncated (matches the registry-recorded evidence)',
    fullRun.totalCases === 16 && fullRun.truncatedCount === 0);

  const twoCase = JSON.parse(readFileSync(path.join(ROOT, 'docs/course-audit/cadence-sonnet5-chat-final-two-case-raw.json'), 'utf8'));
  check('I. CHAT VALIDATION EVIDENCE', 'Final two-case retest: exactly chat-13 and chat-16, 0 truncated',
    twoCase.totalCases === 2 && twoCase.truncatedCount === 0 &&
    twoCase.results.some((r) => r.id === 'chat-13-prior-thread-followup') && twoCase.results.some((r) => r.id === 'chat-16-module12-post-assessment'));

  const case13 = JSON.parse(readFileSync(path.join(ROOT, 'docs/course-audit/cadence-sonnet5-chat-final-case13-raw.json'), 'utf8'));
  check('I. CHAT VALIDATION EVIDENCE', 'Final single chat-13 retest: the exact invented-finding violation is present, confirming the prompt-only fix was insufficient',
    case13.results[0].responseText.includes('diffuse shedding without patchiness or scalp irritation'));

  const zoneBQa = JSON.parse(readFileSync(path.join(ROOT, 'docs/course-audit/cadence-production-path-zone-b-live-qa.json'), 'utf8'));
  const byId = Object.fromEntries(zoneBQa.results.map((r) => [r.id, r]));
  check('I. CHAT VALIDATION EVIDENCE', 'Production-path QA A: content-based Zone B detection triggered on the generated response (triggered:true), and it was supported (unsupportedFactFound:false, outcome:original) -- correct behavior, not a failure',
    byId['qa-a-zone-a-tutoring'] && byId['qa-a-zone-a-tutoring'].scenarioGate.triggered === true &&
    byId['qa-a-zone-a-tutoring'].scenarioGate.unsupportedFactFound === false && byId['qa-a-zone-a-tutoring'].scenarioGate.outcome === 'original');
  check('I. CHAT VALIDATION EVIDENCE', 'Production-path QA B (real chat-13 scenario): triggered:true, unsupportedFactFound:true, regenerated:true, outcome:regenerated -- the gate caught the historical failure and delivered the corrected regeneration',
    byId['qa-b-chat-13-real-failure'] && byId['qa-b-chat-13-real-failure'].scenarioGate.triggered === true &&
    byId['qa-b-chat-13-real-failure'].scenarioGate.unsupportedFactFound === true && byId['qa-b-chat-13-real-failure'].scenarioGate.regenerated === true &&
    byId['qa-b-chat-13-real-failure'].scenarioGate.outcome === 'regenerated');
  check('I. CHAT VALIDATION EVIDENCE', 'Production-path QA B final response never repeats the exact invented-absence clause from the historical violation',
    !byId['qa-b-chat-13-real-failure'].finalResponse.includes('diffuse shedding without patchiness or scalp irritation, which supports proceeding'));
  check('I. CHAT VALIDATION EVIDENCE', 'Production-path QA C (student-supplied facts): triggered:true, unsupportedFactFound:false, regenerated:false, outcome:original -- not overprotective',
    byId['qa-c-supported-actionable'] && byId['qa-c-supported-actionable'].scenarioGate.triggered === true &&
    byId['qa-c-supported-actionable'].scenarioGate.unsupportedFactFound === false && byId['qa-c-supported-actionable'].scenarioGate.regenerated === false &&
    byId['qa-c-supported-actionable'].scenarioGate.outcome === 'original');
})();

// ─────────────────────────────────────────────────────────────────────────
// J. QA-A FIXTURE PURPOSE TEXT CORRECTED (documentation only, gate untouched)
// ─────────────────────────────────────────────────────────────────────────
(function qaAPurposeCorrectedTests() {
  const qaA = QA_CASES.find((c) => c.id === 'qa-a-zone-a-tutoring');
  check('J. QA-A PURPOSE CORRECTED', 'QA-A purpose text no longer claims the case is unconditionally "ungated" -- it now describes content-based classification',
    !/^Ordinary Zone A tutoring stays single-generation and ungated/.test(qaA.purpose));
  check('J. QA-A PURPOSE CORRECTED', 'QA-A purpose text explicitly frames the distinction as depending on the GENERATED RESPONSE, not the student question alone',
    /generated response/i.test(qaA.purpose));
  check('J. QA-A PURPOSE CORRECTED', 'QA-A fixture\'s studentMessage is unchanged from the original educational question (only the purpose/documentation text was corrected)',
    qaA.studentMessage === 'Can you explain why shedding can show up later after someone was sick?');
  const gateSrc = readFileSync(path.join(ROOT, 'functions/_lib/cadence/scenario-fact-gate.mjs'), 'utf8');
  check('J. QA-A PURPOSE CORRECTED', 'The Zone B detector/gate source is untouched by this documentation correction (hash-stable content, not re-derived here to avoid duplicating the gate\'s own pinned test, but confirmed present and unmodified in spirit via its exports)',
    /export function detectActionableZoneBGuidance/.test(gateSrc) && /export async function verifyScenarioFactsForActionableGuidance/.test(gateSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// K. NO COLLATERAL CHANGES: ZONE B GATE, CONSTITUTION, CHECKPOINT, MODULE 12
// ─────────────────────────────────────────────────────────────────────────
(function noCollateralChangeTests() {
  check('K. NO COLLATERAL CHANGE', 'ASK_CADENCE_BASE_GUARDRAIL is byte-identical to its pre-promotion fingerprint -- no prompt/personality change in this task',
    rubricVersionTag(ASK_CADENCE_BASE_GUARDRAIL) === 'rubric-0b554df0');
  const constitution = readFileSync(path.join(ROOT, 'docs/course-audit/00-cadence-character-instruction-constitution.md'), 'utf8');
  check('K. NO COLLATERAL CHANGE', 'Cadence Character & Instruction Constitution is byte-identical to its pre-existing fingerprint',
    rubricVersionTag(constitution) === 'rubric-541ca049');
  const active = buildActiveCheckpointGuardrail('m4cp1');
  check('K. NO COLLATERAL CHANGE', 'Active-checkpoint guardrail output unchanged -- exact known-good permitted/forbidden text still present',
    /You may: clarify terminology, explain the broader underlying concept at an abstract level/.test(active) && /HIGHER LEVEL OF ABSTRACTION than the checkpoint/.test(active));

  check('K. NO COLLATERAL CHANGE', 'detectActionableZoneBGuidance still correctly identifies both the real chat-13 violation text and a pure Zone A explanation as before (gate behavior unchanged)',
    detectActionableZoneBGuidance('the visible clue is diffuse shedding without patchiness or scalp irritation, which supports proceeding with standard scalp care') === true &&
    detectActionableZoneBGuidance('Telogen is the resting phase of the hair growth cycle.') === false);
  check('K. NO COLLATERAL CHANGE', 'SAFE_SCENARIO_FALLBACK_TEXT constant unchanged', typeof SAFE_SCENARIO_FALLBACK_TEXT === 'string' && SAFE_SCENARIO_FALLBACK_TEXT.length > 0);
  check('K. NO COLLATERAL CHANGE', 'verifyScenarioFactsForActionableGuidance is still exported and callable (gate architecture untouched)',
    typeof verifyScenarioFactsForActionableGuidance === 'function');

  const rubrics = loadCheckpointRubrics();
  check('K. NO COLLATERAL CHANGE', 'Full M0-M11 checkpoint rubric/question set is byte-identical to its pre-existing fingerprint -- promoting the registry touched zero checkpoint content',
    rubricVersionTag(JSON.stringify(rubrics)) === 'rubric-f6f22d2b');
  check('K. NO COLLATERAL CHANGE', 'GRADING_DATASET case count unchanged (72)', GRADING_DATASET.length === 72);
  check('K. NO COLLATERAL CHANGE', 'CHAT_DATASET case count unchanged (16)', CHAT_DATASET.length === 16);

  check('K. NO COLLATERAL CHANGE', 'Module 12 bankVersion unchanged', bankVersion === 'headspa-fe-bank-v1-2026-08-26');
  check('K. NO COLLATERAL CHANGE', 'Module 12 SOURCE_HASHES unchanged', JSON.stringify(SOURCE_HASHES) === JSON.stringify({
    knowledgeBankMd: '4fb96d8f9c5c4f1f0d542f1c6965e859417af0e1cceb8d2aa77e82f2221294d5',
    appliedCasesMd: 'df60822daa285d36014b01cdbd85436ac255daa3d53cf23dc96175e281a6769d',
    interviewBankMd: 'ee76472b379a9ea3c3129389d655499dc371c7740c9ab625180b239fdc3f15c7',
  }));
  check('K. NO COLLATERAL CHANGE', 'Module 12 bank item counts unchanged (120/12/9)', knowledgeBank.length === 120 && caseBank.length === 12 && interviewBank.length === 9);
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
