// Cadence model lifecycle — Sonnet 5 promoted CANDIDATE -> APPROVED for
// CADENCE_GRADING_MODEL only (registry v3).
//
// Sonnet 5's grading regression program (docs/course-audit/
// cadence-sonnet5-grading-regression.md Sections 8-12) ended with a clean
// 72/72 full suite, a clean 17/17 sentinel, a clean repeated stability
// sentinel, and a clean targeted retest of the one corrected fixture --
// all 100% agreement, 0 infra failures, 0 parse/truncation failures,
// exceeding the locked promotion gate (>=95% overall, 100% safety,
// 100% injection/leakage, acceptable language performance, zero parse
// failures, stable). This file proves the resulting registry change is
// exactly what a "grading-only promotion" must be: a new, immutable
// registry version; CADENCE_GRADING_MODEL alone moved to APPROVED; the
// exact model identifier and validated execution config pinned and
// traceable to the real evidence files; CADENCE_CHAT_MODEL provably
// unaffected, including through the one code path (env-override status)
// that could otherwise have let grading's approval leak into chat's;
// a real, testable rollback path; and zero collateral changes to
// checkpoint content, Module 12, or chat's own behavior.
//
// No Anthropic API calls. Run: node tests/cadence-grading-promotion.test.mjs

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getCadenceModelRegistry,
  resolveCadenceModel,
  describeCadenceModelStatus,
  CadenceModelConfigError,
} from '../functions/_lib/cadence/model-config.mjs';
import { GRADING_MAX_TOKENS, GRADING_EFFORT, rubricVersionTag } from '../functions/_lib/cadence/checkpoint-evaluation.mjs';
import { loadCheckpointRubrics } from '../scripts/cadence-model-regression/load-checkpoint-rubrics.mjs';
import { GRADING_DATASET } from '../scripts/cadence-model-regression/grading-dataset.mjs';
import { CHAT_DATASET } from '../scripts/cadence-model-regression/chat-dataset.mjs';
import { bankVersion, SOURCE_HASHES, knowledgeBank, caseBank, interviewBank } from '../functions/_lib/certification/content-bank.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

// PINNED, not "current": this file is a fixed historical snapshot of the
// grading-only promotion moment (v4 -- the last registry version where
// grading was APPROVED and chat was still CANDIDATE-only). Chat has
// since completed its own independent live validation program and was
// promoted to APPROVED in a later registry version (v5) -- see
// tests/cadence-chat-promotion.test.mjs for the current, up-to-date
// lifecycle contract. Explicitly fetching v4 by name here (rather than
// getCadenceModelRegistry()'s no-arg "whatever is current" default)
// keeps this file's entire "grading promoted, chat still separate"
// narrative stable and correct forever, immune to later registry bumps
// that are true but out of this file's own historical scope.
const CURRENT_VERSION = 'cadence-model-registry-v4';
const registry = getCadenceModelRegistry(CURRENT_VERSION);

// ─────────────────────────────────────────────────────────────────────────
// A. NEW REGISTRY VERSION, IMMUTABLE, HISTORY PRESERVED
// ─────────────────────────────────────────────────────────────────────────
(function immutabilityTests() {
  check('IMMUTABLE VERSIONING', 'The current registry version is the new v3 (a new version was added, not an in-place edit)',
    registry.version === CURRENT_VERSION);

  const v2 = getCadenceModelRegistry('cadence-model-registry-v2');
  check('IMMUTABLE VERSIONING', 'Historical v2, fetched explicitly, still records claude-sonnet-5 as CANDIDATE (global status) -- unmutated by the v3 promotion',
    v2.models['claude-sonnet-5'] && v2.models['claude-sonnet-5'].status === 'CANDIDATE');
  check('IMMUTABLE VERSIONING', 'Historical v2 still records approved:null for BOTH roles -- unmutated (this is the exact pre-promotion state)',
    v2.roles.CADENCE_CHAT_MODEL.approved === null && v2.roles.CADENCE_GRADING_MODEL.approved === null);
  check('IMMUTABLE VERSIONING', 'Historical v2 still records candidate:claude-sonnet-5 for both roles -- unmutated',
    v2.roles.CADENCE_CHAT_MODEL.candidate === 'claude-sonnet-5' && v2.roles.CADENCE_GRADING_MODEL.candidate === 'claude-sonnet-5');

  const v1 = getCadenceModelRegistry('cadence-model-registry-v1');
  check('IMMUTABLE VERSIONING', 'Historical v1 (the pre-correction state) is still preserved unmutated',
    v1.roles.CADENCE_CHAT_MODEL.approved === 'claude-sonnet-4-20250514' && v1.roles.CADENCE_GRADING_MODEL.approved === 'claude-sonnet-4-20250514');

  check('IMMUTABLE VERSIONING', 'Fetching an unknown registry version still throws rather than silently returning something',
    (() => { try { getCadenceModelRegistry('cadence-model-registry-v99'); return false; } catch (e) { return e instanceof CadenceModelConfigError; } })());
})();

// ─────────────────────────────────────────────────────────────────────────
// B. GRADING: APPROVED, EXACT MODEL PINNED
// ─────────────────────────────────────────────────────────────────────────
(function gradingApprovedTests() {
  check('GRADING APPROVED', 'CADENCE_GRADING_MODEL.approved is exactly the string "claude-sonnet-5" -- a pinned identifier, not a pattern/prefix/alias',
    registry.roles.CADENCE_GRADING_MODEL.approved === 'claude-sonnet-5' && typeof registry.roles.CADENCE_GRADING_MODEL.approved === 'string');
  check('GRADING APPROVED', 'claude-sonnet-5\'s registry entry has status APPROVED',
    registry.models['claude-sonnet-5'].status === 'APPROVED');

  const resolved = resolveCadenceModel({}, 'CADENCE_GRADING_MODEL', { version: CURRENT_VERSION });
  check('GRADING APPROVED', 'resolveCadenceModel() with no override now resolves claude-sonnet-5 by default (the promotion actually taking functional effect, not just a data-shape change)',
    resolved.modelName === 'claude-sonnet-5' && resolved.status === 'APPROVED' && resolved.source === 'approved-default' && resolved.registryVersion === CURRENT_VERSION);

  const status = describeCadenceModelStatus({}, CURRENT_VERSION);
  check('GRADING APPROVED', 'describeCadenceModelStatus() reports CADENCE_GRADING_MODEL resolved with no fail-safe triggered',
    status.roles.CADENCE_GRADING_MODEL.failSafeTriggered === false && status.roles.CADENCE_GRADING_MODEL.approvedStatus === 'APPROVED');
})();

// ─────────────────────────────────────────────────────────────────────────
// C. CHAT: STILL CANDIDATE AT THIS PINNED SNAPSHOT (v4), PROVABLY UNAFFECTED
// BY GRADING'S PROMOTION. Chat's OWN later promotion (v5) is real and
// intentional -- see tests/cadence-chat-promotion.test.mjs -- this section
// is pinned history, not a claim about the current registry.
// ─────────────────────────────────────────────────────────────────────────
(function chatUnaffectedTests() {
  check('CHAT UNCHANGED', 'CADENCE_CHAT_MODEL.approved is still null at this pinned v4 snapshot',
    registry.roles.CADENCE_CHAT_MODEL.approved === null);
  check('CHAT UNCHANGED', 'CADENCE_CHAT_MODEL.candidate is still claude-sonnet-5 (unchanged)',
    registry.roles.CADENCE_CHAT_MODEL.candidate === 'claude-sonnet-5');

  let chatFailSafe = null;
  try { resolveCadenceModel({}, 'CADENCE_CHAT_MODEL', { version: CURRENT_VERSION }); } catch (e) { chatFailSafe = e; }
  check('CHAT UNCHANGED', 'resolveCadenceModel(CADENCE_CHAT_MODEL) with no override still throws at this pinned v4 snapshot -- fails safe exactly as before grading\'s promotion',
    chatFailSafe instanceof CadenceModelConfigError);

  const status = describeCadenceModelStatus({}, CURRENT_VERSION);
  check('CHAT UNCHANGED', 'describeCadenceModelStatus() still reports CADENCE_CHAT_MODEL failSafeTriggered:true at this pinned v4 snapshot',
    status.roles.CADENCE_CHAT_MODEL.failSafeTriggered === true);

  // The one path that COULD have let grading's approval leak into chat:
  // claude-sonnet-5's global model status is now APPROVED. An env override
  // of CADENCE_CHAT_MODEL to claude-sonnet-5 must still resolve as a
  // CANDIDATE override for chat -- never APPROVED -- because chat's own
  // role.approved is still null at this pinned v4 snapshot. This is the
  // concrete, executable proof of "do not infer Chat approval from
  // Grading approval."
  const chatOverride = resolveCadenceModel({ CADENCE_CHAT_MODEL: 'claude-sonnet-5' }, 'CADENCE_CHAT_MODEL', { version: CURRENT_VERSION });
  check('CHAT UNCHANGED', 'Overriding CADENCE_CHAT_MODEL with claude-sonnet-5 (globally APPROVED, via grading) still resolves status CANDIDATE / source env-override-candidate for chat at this pinned v4 snapshot',
    chatOverride.status === 'CANDIDATE' && chatOverride.source === 'env-override-candidate');
})();

// ─────────────────────────────────────────────────────────────────────────
// D. ROLES REMAIN INDEPENDENTLY PROMOTABLE
// ─────────────────────────────────────────────────────────────────────────
(function independentPromotionTests() {
  check('ROLE INDEPENDENCE', 'CADENCE_GRADING_MODEL.approved differs from CADENCE_CHAT_MODEL.approved at this pinned v4 snapshot (one is set, the other is null) -- promoting one role did not promote the other',
    registry.roles.CADENCE_GRADING_MODEL.approved !== registry.roles.CADENCE_CHAT_MODEL.approved);
  check('ROLE INDEPENDENCE', 'Both roles still independently expose their own approved/candidate fields (schema supports fully independent per-role promotion, not a shared flag)',
    'approved' in registry.roles.CADENCE_CHAT_MODEL && 'candidate' in registry.roles.CADENCE_CHAT_MODEL &&
    'approved' in registry.roles.CADENCE_GRADING_MODEL && 'candidate' in registry.roles.CADENCE_GRADING_MODEL);
  check('ROLE INDEPENDENCE', 'resolveCadenceModel() resolves each role from that role\'s OWN roles[roleName] entry, never cross-reading the other role (grading resolves, chat still throws at this pinned v4 snapshot, in the same registry fetch)',
    (() => {
      let gradingOk = false, chatThrew = false;
      try { gradingOk = resolveCadenceModel({}, 'CADENCE_GRADING_MODEL', { version: CURRENT_VERSION }).status === 'APPROVED'; } catch (_) {}
      try { resolveCadenceModel({}, 'CADENCE_CHAT_MODEL', { version: CURRENT_VERSION }); } catch (_) { chatThrew = true; }
      return gradingOk && chatThrew;
    })());
})();

// ─────────────────────────────────────────────────────────────────────────
// E. VALIDATED GRADING EXECUTION CONFIG -- PINNED AND CROSS-CHECKED
// ─────────────────────────────────────────────────────────────────────────
(function executionConfigTests() {
  const cfg = registry.roles.CADENCE_GRADING_MODEL.gradingExecutionConfig;
  check('EXECUTION CONFIG', 'Registry records the validated grading execution config on the CADENCE_GRADING_MODEL role',
    !!cfg);
  check('EXECUTION CONFIG', 'Recorded thinking config is exactly { type: "adaptive" }',
    cfg && cfg.thinking && cfg.thinking.type === 'adaptive' && Object.keys(cfg.thinking).length === 1);
  check('EXECUTION CONFIG', 'Recorded output_config.effort is exactly "medium"',
    cfg && cfg.outputConfigEffort === 'medium');
  check('EXECUTION CONFIG', 'Recorded max_tokens is exactly 4096',
    cfg && cfg.maxTokens === 4096);

  // Cross-check against the REAL exported constants that actually drive
  // the grading request (functions/_lib/cadence/checkpoint-evaluation.mjs)
  // -- proves the registry's audit-trail record can never silently
  // diverge from the code that actually executes grading.
  check('EXECUTION CONFIG', 'Registry-recorded maxTokens matches the real exported GRADING_MAX_TOKENS constant',
    cfg.maxTokens === GRADING_MAX_TOKENS);
  check('EXECUTION CONFIG', 'Registry-recorded outputConfigEffort matches the real exported GRADING_EFFORT constant',
    cfg.outputConfigEffort === GRADING_EFFORT);
})();

// ─────────────────────────────────────────────────────────────────────────
// F. NO "LATEST" ALIAS, NO SILENT FALLBACK
// ─────────────────────────────────────────────────────────────────────────
(function noLatestNoFallbackTests() {
  const allVersions = ['cadence-model-registry-v1', 'cadence-model-registry-v2', 'cadence-model-registry-v3', 'cadence-model-registry-v4'];
  for (const v of allVersions) {
    const r = getCadenceModelRegistry(v);
    check('NO LATEST / NO FALLBACK', `${v}: no registered model key contains "latest"`,
      Object.keys(r.models).every((name) => !/latest/i.test(name)));
  }

  let latestOverrideThrew = false;
  try { resolveCadenceModel({ CADENCE_GRADING_MODEL: 'latest' }, 'CADENCE_GRADING_MODEL'); } catch (e) { latestOverrideThrew = e instanceof CadenceModelConfigError; }
  check('NO LATEST / NO FALLBACK', 'An explicit "latest" env override for the now-APPROVED grading role is still rejected, not silently resolved to anything',
    latestOverrideThrew);

  let unregisteredThrew = false;
  try { resolveCadenceModel({ CADENCE_GRADING_MODEL: 'claude-totally-made-up-latest' }, 'CADENCE_GRADING_MODEL'); } catch (e) { unregisteredThrew = e instanceof CadenceModelConfigError; }
  check('NO LATEST / NO FALLBACK', 'An unregistered override for grading still throws even though a default now exists -- promotion never weakens misconfiguration handling',
    unregisteredThrew);

  let legacyThrew = false;
  try { resolveCadenceModel({ CADENCE_GRADING_MODEL: 'claude-sonnet-4-20250514' }, 'CADENCE_GRADING_MODEL'); } catch (e) { legacyThrew = e instanceof CadenceModelConfigError; }
  check('NO LATEST / NO FALLBACK', 'A LEGACY override for grading is still refused, not silently honored',
    legacyThrew);

  // Structural invariant across every registry version ever defined: no
  // role's `approved` field may ever point at a model registered LEGACY.
  const allVersionsChecked = allVersions.every((v) => {
    const r = getCadenceModelRegistry(v);
    return Object.values(r.roles).every((role) => {
      if (!role.approved) return true;
      const entry = r.models[role.approved];
      return entry && entry.status !== 'LEGACY';
    });
  });
  check('NO LATEST / NO FALLBACK', 'No role in any registry version (v1-v3) has `approved` pointing at a LEGACY model',
    allVersionsChecked);
})();

// ─────────────────────────────────────────────────────────────────────────
// G. ROLLBACK PATH IS REAL AND TESTABLE
// ─────────────────────────────────────────────────────────────────────────
(function rollbackTests() {
  // "Point CURRENT_REGISTRY_VERSION at an earlier version" (the documented
  // rollback mechanism) is provably reachable: v2 is still fully intact
  // and resolveCadenceModel() accepts an explicit version override to
  // pin to it, reproducing the exact pre-promotion fail-safe behavior.
  let gradingFailsSafeOnV2 = null;
  try { resolveCadenceModel({}, 'CADENCE_GRADING_MODEL', { version: 'cadence-model-registry-v2' }); } catch (e) { gradingFailsSafeOnV2 = e; }
  check('ROLLBACK', 'Explicitly pinning to the pre-promotion registry version (v2) reproduces the old fail-safe behavior for grading -- this IS the rollback mechanism, proven functional, not just described',
    gradingFailsSafeOnV2 instanceof CadenceModelConfigError);

  const v2Registry = getCadenceModelRegistry('cadence-model-registry-v2');
  check('ROLLBACK', 'The previous APPROVED/CANDIDATE grading configuration (v2: nothing approved, claude-sonnet-5 candidate) remains fully retrievable for a rollback decision',
    v2Registry.roles.CADENCE_GRADING_MODEL.approved === null && v2Registry.roles.CADENCE_GRADING_MODEL.candidate === 'claude-sonnet-5');

  check('ROLLBACK', 'A rollback changes the active binding (which registry version is CURRENT) without rewriting checkpoint code -- checkpoint-evaluation.mjs resolves the role by name only, never a hardcoded model string',
    (() => {
      const src = readFileSync(path.join(ROOT, 'functions/_lib/cadence/checkpoint-evaluation.mjs'), 'utf8');
      return /resolveCadenceModel\(env, ['"]CADENCE_CHAT_MODEL['"]\)/.test(src) && !/model:\s*['"]claude-sonnet-5['"]/.test(src);
    })());

  check('ROLLBACK', 'No code path resolves an implicit "latest" model on failure -- resolveCadenceModel always throws rather than substituting any other registered model', (() => {
    const src = readFileSync(path.join(ROOT, 'functions/_lib/cadence/model-config.mjs'), 'utf8');
    return !/\|\|\s*['"]claude-sonnet/.test(src) && /throw new CadenceModelConfigError/.test(src);
  })());
})();

// ─────────────────────────────────────────────────────────────────────────
// H. VALIDATION EVIDENCE DOCUMENTED AND TRACEABLE TO REAL FILES
// ─────────────────────────────────────────────────────────────────────────
(function validationEvidenceTests() {
  const evidence = registry.roles.CADENCE_GRADING_MODEL.gradingValidationEvidence;
  check('VALIDATION EVIDENCE', 'Registry records the validation evidence that authorized this promotion',
    !!evidence && Array.isArray(evidence.runs) && evidence.runs.length === 4);
  check('VALIDATION EVIDENCE', 'Recorded gate result is "exceeded"',
    evidence.gateResult === 'exceeded');

  for (const run of evidence.runs) {
    const fullPath = path.join(ROOT, run.file);
    let fileExists = true;
    let data = null;
    try { data = JSON.parse(readFileSync(fullPath, 'utf8')); } catch (_) { fileExists = false; }
    check('VALIDATION EVIDENCE', `Referenced evidence file exists on disk and is valid JSON: ${run.file}`, fileExists);
    if (fileExists) {
      check('VALIDATION EVIDENCE', `${run.file}: recorded overallAgreement matches the real file's overallAgreement`,
        data.overallAgreement === run.overallAgreement);
      check('VALIDATION EVIDENCE', `${run.file}: recorded infra/parse failure counts are actually zero in the real file`,
        data.infraFailureCount === 0 && data.parseFailureCount === 0);
      check('VALIDATION EVIDENCE', `${run.file}: real file's runStatus is COMPLETE`,
        data.runStatus === 'COMPLETE');
    }
  }

  // The full 72-case suite and the 17-case sentinel/stability runs must
  // report the correct guard totals for this dataset (18 safety-critical,
  // 7 leakage/injection, 9 language-variant across all 72; 6/2/5 across
  // the locked 17-case sentinel) -- catches a silently wrong/truncated
  // evidence file being cited.
  const fullSuite = JSON.parse(readFileSync(path.join(ROOT, 'docs/course-audit/cadence-sonnet5-grading-full-post-fix-raw.json'), 'utf8'));
  check('VALIDATION EVIDENCE', 'Full 72-case suite: 18 safety-critical / 7 leakage / 9 language-variant, all zero failures',
    fullSuite.safetyCritical.total === 18 && fullSuite.safetyCritical.failures === 0 &&
    fullSuite.leakageGuard.total === 7 && fullSuite.leakageGuard.failures === 0 &&
    fullSuite.languageVariantGuard.total === 9 && fullSuite.languageVariantGuard.failures === 0 &&
    fullSuite.completedCases === 72);

  const sentinel = JSON.parse(readFileSync(path.join(ROOT, 'docs/course-audit/cadence-sonnet5-grading-sentinel-post-fixture-raw.json'), 'utf8'));
  check('VALIDATION EVIDENCE', 'Post-fixture 17-case sentinel: 6 safety-critical / 2 leakage / 5 language-variant, all zero failures',
    sentinel.safetyCritical.total === 6 && sentinel.leakageGuard.total === 2 && sentinel.languageVariantGuard.total === 5 &&
    sentinel.safetyCritical.failures === 0 && sentinel.leakageGuard.failures === 0 && sentinel.languageVariantGuard.failures === 0);

  const stability = JSON.parse(readFileSync(path.join(ROOT, 'docs/course-audit/cadence-sonnet5-grading-stability-raw.json'), 'utf8'));
  check('VALIDATION EVIDENCE', 'Stability sentinel: 0 unstable cases across 17 rerun cases',
    stability.stability && stability.stability.unstableCount === 0 && stability.stability.rerunCases === 17);

  // The historical 64.7% / 72.2% invalid runs are NOT overwritten or
  // deleted -- they remain in the regression doc's narrative (Sections
  // 8-10) as audit history, per the task's explicit instruction not to
  // erase the progression. This just confirms the doc file still exists
  // and still contains that narrative section, not that its content is
  // unchanged (it is expected to gain Section 12 in this task).
  const regressionDoc = readFileSync(path.join(ROOT, 'docs/course-audit/cadence-sonnet5-grading-regression.md'), 'utf8');
  check('VALIDATION EVIDENCE', 'The regression doc still narrates the 64.7% infrastructure-invalidated run (Section 10) -- prior failed evidence preserved as history, not erased',
    /64\.7%/.test(regressionDoc) && /## 10\./.test(regressionDoc));
})();

// ─────────────────────────────────────────────────────────────────────────
// I. NO COLLATERAL CHANGES: CHECKPOINT CONTENT, MODULE 12, CHAT BEHAVIOR
// ─────────────────────────────────────────────────────────────────────────
(function noCollateralChangeTests() {
  const rubrics = loadCheckpointRubrics();
  check('NO COLLATERAL CHANGE', 'The full M0-M11 checkpoint rubric/question set is byte-identical to its pre-existing fingerprint -- promoting the registry touched zero checkpoint content',
    rubricVersionTag(JSON.stringify(rubrics)) === 'rubric-f6f22d2b');

  check('NO COLLATERAL CHANGE', 'GRADING_DATASET case count unchanged (72)',
    GRADING_DATASET.length === 72);
  check('NO COLLATERAL CHANGE', 'CHAT_DATASET case count unchanged (16)',
    CHAT_DATASET.length === 16);

  check('NO COLLATERAL CHANGE', 'Module 12 bankVersion unchanged',
    bankVersion === 'headspa-fe-bank-v1-2026-08-26');
  check('NO COLLATERAL CHANGE', 'Module 12 SOURCE_HASHES unchanged',
    JSON.stringify(SOURCE_HASHES) === JSON.stringify({
      knowledgeBankMd: '4fb96d8f9c5c4f1f0d542f1c6965e859417af0e1cceb8d2aa77e82f2221294d5',
      appliedCasesMd: 'df60822daa285d36014b01cdbd85436ac255daa3d53cf23dc96175e281a6769d',
      interviewBankMd: 'ee76472b379a9ea3c3129389d655499dc371c7740c9ab625180b239fdc3f15c7',
    }));
  check('NO COLLATERAL CHANGE', 'Module 12 bank item counts unchanged (120/12/9)',
    knowledgeBank.length === 120 && caseBank.length === 12 && interviewBank.length === 9);

  // Chat's own execution config (CHAT_MAX_TOKENS/CHAT_EFFORT) was
  // introduced in a later task (Chat execution-config hardening) and is
  // legitimately different from the pre-existing MAX_TOKENS_CAP=768 this
  // assertion originally pinned -- what must remain true, at THIS
  // registry-promotion task's HEAD, is only that chat never imports or
  // shares grading's own constants. See tests/cadence-chat-config.test.mjs
  // for the full, current chat-execution-config assertions.
  const chatSrc = readFileSync(path.join(ROOT, 'functions/_lib/cadence/ask-cadence.mjs'), 'utf8');
  check('NO COLLATERAL CHANGE', 'Ask Cadence (chat) defines its own independent execution-config constants, not the ones this task touched',
    /CHAT_MAX_TOKENS/.test(chatSrc) && /CHAT_EFFORT/.test(chatSrc));
  check('NO COLLATERAL CHANGE', 'Ask Cadence has no import dependency on checkpoint-evaluation.mjs at all -- the only place GRADING_MAX_TOKENS/GRADING_EFFORT are defined',
    !/from ['"][^'"]*checkpoint-evaluation\.mjs['"]/.test(chatSrc));
  check('NO COLLATERAL CHANGE', 'Ask Cadence still resolves CADENCE_CHAT_MODEL (not CADENCE_GRADING_MODEL) -- role binding untouched',
    /resolveCadenceModel\([^)]*['"]CADENCE_CHAT_MODEL['"]\)/.test(chatSrc));
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
