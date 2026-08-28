#!/usr/bin/env node
// AIMT Cadence model-evaluation harness — reusable whenever AIMT evaluates
// a candidate model for either Cadence role. Chat and Grading are
// INDEPENDENT roles/results — this script never combines their outcomes
// into one number, per the launch-sweep build contract.
//
// Usage:
//   node scripts/run-cadence-model-regression.mjs --role=grading [--live] [--repeat=3] [--out=path.json]
//   node scripts/run-cadence-model-regression.mjs --role=chat    [--live] [--out-dir=path]
//
// --live requires ANTHROPIC_API_KEY in the environment and calls the real
// Anthropic API through the exact same server-side contract production
// uses (functions/_lib/cadence/checkpoint-evaluation.mjs's
// parseCheckpointEvaluation/decideCheckpointOutcome for grading; the same
// module-aware guide-system prompt assembly headspa-mastery.html's
// getGuideSystem() uses for chat). This is TEST-ONLY use of a CANDIDATE
// model (build contract Section 15) — it never writes to the production
// model registry and never touches course_progress/Supabase.
//
// Without --live (or without a usable key), the harness runs a
// deterministic-layer-only validation: confirms every dataset case
// resolves against the real rubric/system-prompt source, and (grading
// only) exercises decideCheckpointOutcome() — the actual AIMT decision
// function — against evidence reconstructed from each case's own
// human-authored expected outcome. This validates the harness+dataset+
// AIMT-decision-function pairing; it is explicitly NOT a live-model
// result and is labeled as such in every output, per the launch-sweep
// instruction to never fake live-model success.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadCheckpointRubrics, loadModuleGuideSystems, loadSharedToneConstants } from './cadence-model-regression/load-checkpoint-rubrics.mjs';
import { resolveCheckpointDefinition } from './cadence-model-regression/checkpoint-map.mjs';
import { GRADING_DATASET } from './cadence-model-regression/grading-dataset.mjs';
import { CHAT_DATASET } from './cadence-model-regression/chat-dataset.mjs';
import { CHECKPOINT_EVAL_INSTRUCTION, parseCheckpointEvaluation, decideCheckpointOutcome, buildCheckpointEvaluationRecord, rubricVersionTag } from '../functions/_lib/cadence/checkpoint-evaluation.mjs';
import { resolveCadenceModel, getCadenceModelRegistry, CadenceModelConfigError } from '../functions/_lib/cadence/model-config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = { role: null, live: false, repeat: 1, model: null, out: null, outDir: null };
  for (const raw of argv) {
    const [k, v] = raw.replace(/^--/, '').split('=');
    if (k === 'role') args.role = v;
    else if (k === 'live') args.live = true;
    else if (k === 'repeat') args.repeat = Math.max(1, parseInt(v, 10) || 1);
    else if (k === 'model') args.model = v;
    else if (k === 'out') args.out = v;
    else if (k === 'out-dir') args.outDir = v;
  }
  return args;
}

function resolveHarnessModel(env, roleName, explicitModel) {
  // Test-only candidate use (Section 15): an explicit --model is honored
  // as long as it's a REGISTERED model (APPROVED or CANDIDATE) — never an
  // arbitrary string. Default: the role's registered CANDIDATE, since a
  // regression run's whole purpose is testing the not-yet-approved
  // candidate. This mirrors resolveCadenceModel()'s own env-override
  // contract, reusing the exact same production module rather than a
  // separate/parallel resolution path.
  const registry = getCadenceModelRegistry();
  if (explicitModel) {
    return resolveCadenceModel({ [roleName]: explicitModel }, roleName);
  }
  const role = registry.roles[roleName];
  const candidate = role && role.candidate;
  if (!candidate) throw new CadenceModelConfigError(`No CANDIDATE registered for ${roleName} — nothing to regression-test.`);
  return resolveCadenceModel({ [roleName]: candidate }, roleName);
}

async function callAnthropic({ apiKey, model, system, messages, maxTokens }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Anthropic request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return (data && data.content && data.content[0] && data.content[0].text) || '';
}

// ── GRADING ROLE ──

/**
 * Deterministic-layer-only self-check (no model call): builds the evidence
 * shape a well-behaved model call to Sonnet 5 would need to have returned
 * for decideCheckpointOutcome() to reach this case's own human-authored
 * expectedDecision/expectUnsafeFlag, then runs the REAL, unmodified
 * decideCheckpointOutcome() against it. This proves the dataset's expected
 * outcomes are self-consistent with the actual AIMT decision function —
 * it does not and cannot tell you whether Sonnet 5 will actually produce
 * that evidence from the student text. Labeled `mode: 'dry-run'` in output.
 */
function dryRunGradingCase(testCase) {
  const evidence = testCase.expectUnsafeFlag
    ? { requiredElementsDemonstrated: [], requiredElementsMissing: [], unsafeReasoning: true }
    : testCase.expectedDecision === 'pass'
      ? { requiredElementsDemonstrated: ['reconstructed-for-dry-run'], requiredElementsMissing: [], unsafeReasoning: false }
      : { requiredElementsDemonstrated: [], requiredElementsMissing: ['reconstructed-for-dry-run'], unsafeReasoning: false };
  const outcome = decideCheckpointOutcome(evidence);
  return {
    id: testCase.id, checkpointId: testCase.checkpointId, category: testCase.category,
    mode: 'dry-run', expectedDecision: testCase.expectedDecision, observedDecision: outcome.decision,
    match: outcome.decision === testCase.expectedDecision,
    expectUnsafeFlag: testCase.expectUnsafeFlag,
  };
}

async function liveRunGradingCase(testCase, def, { apiKey, model, repeat }) {
  const system = def.system + '\n\n' + CHECKPOINT_EVAL_INSTRUCTION;
  const messages = [{ role: 'user', content: 'Checkpoint question: ' + def.question + '\n\nStudent answer: ' + testCase.studentResponse }];
  const runs = [];
  for (let i = 0; i < repeat; i++) {
    let record;
    try {
      const rawText = await callAnthropic({ apiKey, model, system, messages, maxTokens: 400 });
      record = buildCheckpointEvaluationRecord({ checkpointId: testCase.checkpointId, rubricVersion: rubricVersionTag(def.system), rawText, modelInfo: { modelName: model } });
    } catch (e) {
      record = { decision: 'error', unsafeReasoning: false, malformedOrError: String(e.message || e) };
    }
    runs.push(record);
  }
  const decisions = runs.map((r) => r.decision);
  const unsafeFlags = runs.map((r) => !!r.unsafeReasoning);
  const stable = new Set(decisions).size === 1;
  return {
    id: testCase.id, checkpointId: testCase.checkpointId, category: testCase.category, mode: 'live',
    expectedDecision: testCase.expectedDecision, observedDecisions: decisions,
    match: decisions.every((d) => d === testCase.expectedDecision),
    expectUnsafeFlag: testCase.expectUnsafeFlag, observedUnsafeFlags: unsafeFlags,
    unsafeMatch: unsafeFlags.every((f) => f === testCase.expectUnsafeFlag),
    stable, runs,
  };
}

async function runGrading(args) {
  const rubrics = loadCheckpointRubrics();
  const results = [];
  let modelInfo = null;
  let liveBlocked = null;

  if (args.live) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      liveBlocked = 'ANTHROPIC_API_KEY not set in this environment — cannot run live grading regression. See Section 34: reporting the exact blocker rather than faking a live result.';
    } else {
      modelInfo = resolveHarnessModel(process.env, 'CADENCE_GRADING_MODEL', args.model);
    }
  }

  for (const testCase of GRADING_DATASET) {
    const def = resolveCheckpointDefinition(rubrics, testCase.checkpointId);
    if (args.live && !liveBlocked) {
      results.push(await liveRunGradingCase(testCase, def, { apiKey: process.env.ANTHROPIC_API_KEY, model: modelInfo.modelName, repeat: args.repeat }));
    } else {
      results.push(dryRunGradingCase(testCase));
    }
  }

  // Only summarize as "live" if a live call actually happened for every
  // result -- if blocked (no key), every result fell through to
  // dryRunGradingCase() above regardless of the --live flag the caller
  // passed, so the summary must follow the same fallback or it will look
  // for live-only fields (unsafeMatch/stable) that were never populated.
  return summarizeGrading(results, { modelInfo, liveBlocked, live: args.live && !liveBlocked });
}

function summarizeGrading(results, { modelInfo, liveBlocked, live }) {
  const total = results.length;
  const matched = results.filter((r) => r.match).length;
  const safetyCases = results.filter((r) => r.expectUnsafeFlag === true);
  const safetyFailures = live
    ? safetyCases.filter((r) => !r.match || !r.unsafeMatch)
    : safetyCases.filter((r) => !r.match); // dry-run has no observed unsafe flag to check
  const leakageCategories = new Set(['answer-coaxing', 'prompt-injection', 'social-engineering']);
  const leakageCases = results.filter((r) => leakageCategories.has(r.category));
  const leakageFailures = leakageCases.filter((r) => !r.match);
  const styleCategories = new Set(['competent-non-native-phrasing', 'competent-grammar-errors', 'competent-spoken-phrasing']);
  const styleCases = results.filter((r) => styleCategories.has(r.category));
  const styleFailures = styleCases.filter((r) => !r.match);
  const unstable = live ? results.filter((r) => r.stable === false) : [];

  return {
    role: 'grading',
    mode: live ? (modelInfo ? 'live' : 'blocked') : 'dry-run',
    liveBlockedReason: liveBlocked,
    modelInfo,
    totalCases: total,
    overallAgreement: total ? matched / total : 0,
    safetyCritical: { total: safetyCases.length, failures: safetyFailures.length, failureIds: safetyFailures.map((r) => r.id) },
    leakageGuard: { total: leakageCases.length, failures: leakageFailures.length, failureIds: leakageFailures.map((r) => r.id) },
    languageVariantGuard: { total: styleCases.length, failures: styleFailures.length, failureIds: styleFailures.map((r) => r.id) },
    stability: live ? { rerunCases: results.length, unstableCount: unstable.length, unstableIds: unstable.map((r) => r.id) } : null,
    results,
  };
}

// ── CHAT ROLE ──

async function runChat(args) {
  const guideSystems = loadModuleGuideSystems();
  const tone = loadSharedToneConstants();
  let modelInfo = null;
  let liveBlocked = null;

  if (args.live) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      liveBlocked = 'ANTHROPIC_API_KEY not set in this environment — cannot run live chat regression. See Section 34: reporting the exact blocker rather than faking a live result.';
    } else {
      modelInfo = resolveHarnessModel(process.env, 'CADENCE_CHAT_MODEL', args.model);
    }
  }

  const results = [];
  for (const testCase of CHAT_DATASET) {
    const guideSystem = (guideSystems[String(testCase.moduleId)] || guideSystems['0']) +
      '\n' + tone.CADENCE_RESPONSE_CONSISTENCY_ANCHOR +
      '\n' + tone.CADENCE_SELECTIVE_MEMORY_INSTRUCTION;

    if (args.live && !liveBlocked) {
      const messages = [...testCase.priorMessages, { role: 'user', content: testCase.studentMessage }];
      let responseText = null;
      let error = null;
      try {
        responseText = await callAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY, model: modelInfo.modelName, system: guideSystem, messages, maxTokens: 512 });
      } catch (e) {
        error = String(e.message || e);
      }
      results.push({ id: testCase.id, moduleId: testCase.moduleId, mode: 'live', studentMessage: testCase.studentMessage, priorMessages: testCase.priorMessages, evaluationCriteria: testCase.evaluationCriteria, responseText, error });
    } else {
      results.push({ id: testCase.id, moduleId: testCase.moduleId, mode: 'dry-run', studentMessage: testCase.studentMessage, evaluationCriteria: testCase.evaluationCriteria, note: 'System prompt resolved successfully; no live call made.' });
    }
  }

  return { role: 'chat', mode: args.live ? (modelInfo ? 'live' : 'blocked') : 'dry-run', liveBlockedReason: liveBlocked, modelInfo, totalCases: results.length, results };
}

// ── MAIN ──

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.role !== 'grading' && args.role !== 'chat') {
    console.error('Usage: node scripts/run-cadence-model-regression.mjs --role=grading|chat [--live] [--repeat=N] [--model=NAME] [--out=path.json]');
    process.exit(1);
  }

  const summary = args.role === 'grading' ? await runGrading(args) : await runChat(args);

  const outPath = args.out || path.join(__dirname, '..', 'docs', 'course-audit', `cadence-sonnet5-${args.role}-regression-raw.json`);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(summary, null, 2));

  console.log(`\n=== Cadence ${args.role.toUpperCase()} regression — mode: ${summary.mode} ===`);
  if (summary.liveBlockedReason) console.log(`BLOCKED: ${summary.liveBlockedReason}`);
  if (summary.modelInfo) console.log(`Model: ${summary.modelInfo.modelName} (${summary.modelInfo.status}, registry ${summary.modelInfo.registryVersion})`);
  console.log(`Total cases: ${summary.totalCases}`);
  if (args.role === 'grading') {
    console.log(`Overall agreement: ${(summary.overallAgreement * 100).toFixed(1)}%`);
    console.log(`Safety-critical: ${summary.safetyCritical.total - summary.safetyCritical.failures}/${summary.safetyCritical.total} correct (failures: ${summary.safetyCritical.failureIds.join(', ') || 'none'})`);
    console.log(`Leakage/injection guard: ${summary.leakageGuard.total - summary.leakageGuard.failures}/${summary.leakageGuard.total} correct`);
    console.log(`Language-variant guard: ${summary.languageVariantGuard.total - summary.languageVariantGuard.failures}/${summary.languageVariantGuard.total} correct`);
    if (summary.stability) console.log(`Stability: ${summary.stability.unstableCount} unstable of ${summary.stability.rerunCases} rerun cases`);
  }
  console.log(`Raw output written to: ${path.relative(process.cwd(), outPath)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
