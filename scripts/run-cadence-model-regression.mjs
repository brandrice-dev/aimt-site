#!/usr/bin/env node
// AIMT Cadence model-evaluation harness — reusable whenever AIMT evaluates
// a candidate model for either Cadence role. Chat and Grading are
// INDEPENDENT roles/results — this script never combines their outcomes
// into one number, per the launch-sweep build contract.
//
// Usage:
//   node scripts/run-cadence-model-regression.mjs --role=grading [--live] [--repeat=3] [--out=path.json]
//   node scripts/run-cadence-model-regression.mjs --role=chat    [--live] [--out-dir=path]
//   node scripts/run-cadence-model-regression.mjs --help
//
// Case filtering (for a targeted sentinel/retest instead of the full
// dataset): --cases=id1,id2,id3 (exact, comma-separated dataset "id"
// values) or --sentinel (the locked 17-case grading sentinel from
// scripts/cadence-model-regression/sentinel.mjs). A filtered run never
// writes to the historical full-suite raw-evidence filename -- see
// --help for the exact default paths and copy/paste example commands.
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
import { CHECKPOINT_EVAL_INSTRUCTION, CHECKPOINT_EVALUATION_JSON_SCHEMA, GRADING_MAX_TOKENS, GRADING_EFFORT, decideCheckpointOutcome, buildCheckpointEvaluationRecord, rubricVersionTag } from '../functions/_lib/cadence/checkpoint-evaluation.mjs';
import { resolveCadenceModel, getCadenceModelRegistry, CadenceModelConfigError } from '../functions/_lib/cadence/model-config.mjs';
import { ASK_CADENCE_BASE_GUARDRAIL, buildActiveCheckpointGuardrail, CHAT_MAX_TOKENS, CHAT_EFFORT } from '../functions/_lib/cadence/ask-cadence.mjs';
import { extractAnthropicTextSafe, fetchAnthropicMessages } from '../functions/_lib/cadence/anthropic-response.mjs';
import { selectCases, CaseSelectionError } from './cadence-model-regression/case-selection.mjs';
import { GRADING_SENTINEL_CASE_IDS, CHAT_TARGETED_CASE_IDS } from './cadence-model-regression/sentinel.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const USAGE = 'Usage: node scripts/run-cadence-model-regression.mjs --role=grading|chat ' +
  '[--live] [--repeat=N] [--model=NAME] [--out=path.json] [--cases=id1,id2,...] [--sentinel] [--help]';

export function parseArgs(argv) {
  const args = { role: null, live: false, repeat: 1, model: null, out: null, outDir: null, cases: null, sentinel: false, help: false };
  for (const raw of argv) {
    if (raw === '--help' || raw === '-h') { args.help = true; continue; }
    const [k, v] = raw.replace(/^--/, '').split('=');
    if (k === 'role') args.role = v;
    else if (k === 'live') args.live = true;
    else if (k === 'repeat') args.repeat = Math.max(1, parseInt(v, 10) || 1);
    else if (k === 'model') args.model = v;
    else if (k === 'out') args.out = v;
    else if (k === 'out-dir') args.outDir = v;
    else if (k === 'cases') args.cases = String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (k === 'sentinel') args.sentinel = true;
  }
  return args;
}

/**
 * Resolves the raw-evidence output path. A filtered (--cases/--sentinel)
 * run never silently lands on the historical full-suite filename -- if no
 * --out was given it gets its own distinct default, and an explicit --out
 * that collides with the historical default is rejected outright rather
 * than quietly overwriting real prior evidence.
 */
export function resolveOutputPath({ role, explicitOut, filtered }) {
  const historicalDefault = path.join(__dirname, '..', 'docs', 'course-audit', `cadence-sonnet5-${role}-regression-raw.json`);
  if (explicitOut) {
    if (filtered && path.resolve(explicitOut) === path.resolve(historicalDefault)) {
      throw new Error(
        `--out would overwrite the historical full-suite evidence file ` +
        `(${path.relative(process.cwd(), historicalDefault)}). Choose a different --out path for a filtered/sentinel run.`
      );
    }
    return explicitOut;
  }
  if (filtered) {
    const suffix = role === 'grading' ? 'sentinel' : 'targeted';
    return path.join(__dirname, '..', 'docs', 'course-audit', `cadence-sonnet5-${role}-${suffix}-raw.json`);
  }
  return historicalDefault;
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

// Mirrors production's fetchAnthropicMessages() usage exactly -- same
// small bounded retry on transient 5xx (a live sentinel hit one isolated
// 503 among 17 otherwise-successful calls), same fail-fast on 4xx.
async function callAnthropic({ apiKey, model, system, messages, maxTokens, outputConfig, thinking }) {
  const body = { model, max_tokens: maxTokens, system, messages };
  if (outputConfig) body.output_config = outputConfig;
  if (thinking) body.thinking = thinking;
  const data = await fetchAnthropicMessages({ apiKey, body });
  return { text: extractAnthropicTextSafe(data), raw: data };
}

/**
 * QA-only diagnostic snapshot for a parse failure or empty response --
 * written into the raw regression JSON so the next live run is actually
 * debuggable instead of only showing the safe-fallback fingerprint. Never
 * captures secret values (no key material ever reaches this function),
 * never captures hidden chain-of-thought (thinking/redacted_thinking block
 * CONTENT is never read -- only its type name is recorded, same as every
 * other non-text block type), never captures HTTP headers, and never
 * touches anything student- or production-facing -- this writes only to
 * docs/course-audit/*-raw.json.
 */
function buildRawDiagnostic(raw) {
  const blocks = Array.isArray(raw && raw.content) ? raw.content : [];
  return {
    stopReason: (raw && raw.stop_reason) || null,
    modelId: (raw && raw.model) || null,
    blockTypes: blocks.map((b) => b && b.type).filter(Boolean),
    textPreview: blocks
      .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text)
      .join('')
      .slice(0, 2000),
  };
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
    mode: 'dry-run', evaluationStatus: 'completed',
    expectedDecision: testCase.expectedDecision, observedDecision: outcome.decision,
    match: outcome.decision === testCase.expectedDecision,
    expectUnsafeFlag: testCase.expectUnsafeFlag,
    infraFailureCount: 0, parseFailureCount: 0,
  };
}

/**
 * Classifies each run as exactly one of:
 *   'completed'    -- a genuine structured decision was reached (pass or
 *                      revise); usable for model-agreement comparison.
 *   'parse_failure' -- a 200 OK response that could not be turned into
 *                      usable evidence (truncated by max_tokens, malformed
 *                      JSON, missing fields, textless). buildCheckpointEvaluationRecord()
 *                      already refuses to call decideCheckpointOutcome() on
 *                      this (decision:'error'); the harness must likewise
 *                      refuse to score it as a disagreement.
 *   'infra_error'   -- the request itself never completed (network/5xx
 *                      after the shared retry was exhausted, or a
 *                      non-retryable 4xx). Not a model opinion of any kind.
 *
 * This distinction (task: "regression harness must distinguish MODEL
 * DISAGREEMENT from INFRASTRUCTURE/TRANSPORT/PARSE FAILURE") is what a
 * live 17-case sentinel needed and didn't have: it reported 64.7%
 * agreement and 1/6 safety-critical purely because 12 of 17 live calls
 * hit max_tokens truncation and 1 hit a transient 503 -- none of which
 * were the model disagreeing with anything.
 */
async function liveRunGradingCase(testCase, def, { apiKey, model, repeat }) {
  const system = def.system + '\n\n' + CHECKPOINT_EVAL_INSTRUCTION;
  const messages = [{ role: 'user', content: 'Checkpoint question: ' + def.question + '\n\nStudent answer: ' + testCase.studentResponse }];
  const outputConfig = { effort: GRADING_EFFORT, format: { type: 'json_schema', schema: CHECKPOINT_EVALUATION_JSON_SCHEMA } };
  const thinking = { type: 'adaptive' };
  const runs = [];
  for (let i = 0; i < repeat; i++) {
    let record;
    let runType;
    try {
      const { text: rawText, raw } = await callAnthropic({ apiKey, model, system, messages, maxTokens: GRADING_MAX_TOKENS, outputConfig, thinking });
      record = buildCheckpointEvaluationRecord({ checkpointId: testCase.checkpointId, rubricVersion: rubricVersionTag(def.system), rawText, modelInfo: { modelName: model } });
      if (record.malformed) {
        runType = 'parse_failure';
        record.rawDiagnostic = buildRawDiagnostic(raw);
      } else {
        runType = 'completed';
      }
    } catch (e) {
      runType = 'infra_error';
      record = { decision: 'error', unsafeReasoning: false, malformedOrError: String(e.message || e) };
    }
    runs.push({ ...record, runType });
  }

  const completedRuns = runs.filter((r) => r.runType === 'completed');
  const decisions = completedRuns.map((r) => r.decision);
  const unsafeFlags = completedRuns.map((r) => !!r.unsafeReasoning);
  const stable = completedRuns.length > 0 ? new Set(decisions).size === 1 : null;
  const infraFailureCount = runs.filter((r) => r.runType === 'infra_error').length;
  const parseFailureCount = runs.filter((r) => r.runType === 'parse_failure').length;
  const evaluationStatus = completedRuns.length === 0 ? 'blocked' : (completedRuns.length < runs.length ? 'partial' : 'completed');

  return {
    id: testCase.id, checkpointId: testCase.checkpointId, category: testCase.category, mode: 'live',
    evaluationStatus,
    expectedDecision: testCase.expectedDecision,
    // Only completed runs feed observedDecisions/match/unsafeMatch -- a
    // case with zero completed runs reports match/unsafeMatch as null
    // ("we don't know, it was never evaluated"), never false ("the model
    // disagreed"), which would misrepresent an infra/parse failure as a
    // model opinion.
    observedDecisions: decisions,
    match: completedRuns.length > 0 ? decisions.every((d) => d === testCase.expectedDecision) : null,
    expectUnsafeFlag: testCase.expectUnsafeFlag,
    observedUnsafeFlags: unsafeFlags,
    unsafeMatch: completedRuns.length > 0 ? unsafeFlags.every((f) => f === testCase.expectUnsafeFlag) : null,
    stable,
    infraFailureCount, parseFailureCount,
    runs,
  };
}

export async function runGrading(args, caseIds) {
  const rubrics = loadCheckpointRubrics();
  const { selected, filtered } = selectCases(GRADING_DATASET, caseIds);
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

  for (const testCase of selected) {
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
  return summarizeGrading(results, { modelInfo, liveBlocked, live: args.live && !liveBlocked, filtered, caseIds });
}

function summarizeGrading(results, { modelInfo, liveBlocked, live, filtered, caseIds }) {
  const total = results.length;
  // Blocked cases (evaluationStatus:'blocked' -- zero completed runs) are
  // excluded from every agreement/guard denominator below. A blocked case
  // was never evaluated at all; counting it as a disagreement would
  // misrepresent an infra/parse failure as the model deciding the
  // opposite of what was expected. See liveRunGradingCase's
  // evaluationStatus classification.
  const blocked = live ? results.filter((r) => r.evaluationStatus === 'blocked') : [];
  const evaluated = live ? results.filter((r) => r.evaluationStatus !== 'blocked') : results;
  const matched = evaluated.filter((r) => r.match).length;
  const infraFailureCount = results.reduce((sum, r) => sum + (r.infraFailureCount || 0), 0);
  const parseFailureCount = results.reduce((sum, r) => sum + (r.parseFailureCount || 0), 0);

  const safetyCases = evaluated.filter((r) => r.expectUnsafeFlag === true);
  const safetyFailures = live
    ? safetyCases.filter((r) => !r.match || !r.unsafeMatch)
    : safetyCases.filter((r) => !r.match); // dry-run has no observed unsafe flag to check
  const leakageCategories = new Set(['answer-coaxing', 'prompt-injection', 'social-engineering']);
  const leakageCases = evaluated.filter((r) => leakageCategories.has(r.category));
  const leakageFailures = leakageCases.filter((r) => !r.match);
  const styleCategories = new Set(['competent-non-native-phrasing', 'competent-grammar-errors', 'competent-spoken-phrasing']);
  const styleCases = evaluated.filter((r) => styleCategories.has(r.category));
  const styleFailures = styleCases.filter((r) => !r.match);
  const unstable = live ? evaluated.filter((r) => r.stable === false) : [];

  return {
    role: 'grading',
    mode: live ? (modelInfo ? 'live' : 'blocked') : 'dry-run',
    liveBlockedReason: liveBlocked,
    modelInfo,
    totalCases: total,
    completedCases: evaluated.length,
    blockedCases: blocked.length,
    blockedCaseIds: blocked.map((r) => r.id),
    infraFailureCount,
    parseFailureCount,
    // A sentinel/run with any blocked case is incomplete evidence about
    // the model, not a negative finding about it -- report it as such
    // rather than letting a low overallAgreement number stand unexplained.
    runStatus: blocked.length > 0 ? 'INCOMPLETE_BLOCKED' : 'COMPLETE',
    overallAgreement: evaluated.length ? matched / evaluated.length : 0,
    safetyCritical: { total: safetyCases.length, failures: safetyFailures.length, failureIds: safetyFailures.map((r) => r.id) },
    leakageGuard: { total: leakageCases.length, failures: leakageFailures.length, failureIds: leakageFailures.map((r) => r.id) },
    languageVariantGuard: { total: styleCases.length, failures: styleFailures.length, failureIds: styleFailures.map((r) => r.id) },
    stability: live ? { rerunCases: evaluated.length, unstableCount: unstable.length, unstableIds: unstable.map((r) => r.id) } : null,
    caseSelection: filtered ? { count: results.length, ids: caseIds } : null,
    results,
  };
}

// ── CHAT ROLE ──

export async function runChat(args, caseIds) {
  const guideSystems = loadModuleGuideSystems();
  const tone = loadSharedToneConstants();
  const { selected, filtered } = selectCases(CHAT_DATASET, caseIds);
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
  for (const testCase of selected) {
    // Mirrors askCadenceServerSide()'s exact system-prompt assembly
    // (functions/_lib/cadence/ask-cadence.mjs), including the always-on
    // base guardrail and, when the case simulates an active unresolved
    // checkpoint, the server-verified active-checkpoint guardrail -- a
    // prior harness defect sent only the module guide + tone constants,
    // silently omitting both guardrails, so a live case like
    // chat-11-help-during-active-checkpoint (which sets activeCheckpointId
    // in the dataset) was never actually testing the real production
    // contract a student would receive. activeCheckpointGuardrailApplied
    // below records, per case, whether that guardrail was actually
    // included this run -- so a future reader never has to assume it was.
    let guideSystem = (guideSystems[String(testCase.moduleId)] || guideSystems['0']) +
      '\n' + tone.CADENCE_RESPONSE_CONSISTENCY_ANCHOR +
      '\n' + tone.CADENCE_SELECTIVE_MEMORY_INSTRUCTION +
      '\n\n' + ASK_CADENCE_BASE_GUARDRAIL;
    const activeCheckpointGuardrailApplied = !!(testCase.activeCheckpointId && testCase.activeCheckpointStatus !== 'passed');
    if (activeCheckpointGuardrailApplied) {
      guideSystem += '\n\n' + buildActiveCheckpointGuardrail(testCase.activeCheckpointId);
    }

    if (args.live && !liveBlocked) {
      const messages = [...testCase.priorMessages, { role: 'user', content: testCase.studentMessage }];
      let responseText = null;
      let error = null;
      let rawDiagnostic = null;
      let truncated = false;
      try {
        // Mirrors callAnthropicForAskCadence()'s exact execution config
        // (CHAT_MAX_TOKENS / CHAT_EFFORT / adaptive thinking) -- imported
        // from ask-cadence.mjs, never a separate hardcoded copy, so the
        // harness can never silently drift from what production sends.
        const { text, raw } = await callAnthropic({
          apiKey: process.env.ANTHROPIC_API_KEY, model: modelInfo.modelName, system: guideSystem, messages,
          maxTokens: CHAT_MAX_TOKENS, outputConfig: { effort: CHAT_EFFORT }, thinking: { type: 'adaptive' },
        });
        responseText = text;
        truncated = !!(raw && raw.stop_reason === 'max_tokens');
        // Truncation must be classified explicitly, not just detected when
        // text happens to be empty -- a partial response (chat-01's real
        // failure mode: real text, cut off mid-sentence, error:null) is
        // exactly the case a text-emptiness check alone would miss.
        if (!text || truncated) rawDiagnostic = buildRawDiagnostic(raw);
      } catch (e) {
        error = String(e.message || e);
      }
      const result = { id: testCase.id, moduleId: testCase.moduleId, mode: 'live', studentMessage: testCase.studentMessage, priorMessages: testCase.priorMessages, evaluationCriteria: testCase.evaluationCriteria, activeCheckpointGuardrailApplied, responseText, truncated, error };
      if (rawDiagnostic) result.rawDiagnostic = rawDiagnostic;
      results.push(result);
    } else {
      results.push({ id: testCase.id, moduleId: testCase.moduleId, mode: 'dry-run', studentMessage: testCase.studentMessage, evaluationCriteria: testCase.evaluationCriteria, activeCheckpointGuardrailApplied, note: 'System prompt resolved successfully; no live call made.' });
    }
  }

  const truncatedCount = results.filter((r) => r.truncated === true).length;

  return {
    role: 'chat',
    mode: args.live ? (modelInfo ? 'live' : 'blocked') : 'dry-run',
    liveBlockedReason: liveBlocked,
    modelInfo,
    totalCases: results.length,
    truncatedCount,
    caseSelection: filtered ? { count: results.length, ids: caseIds } : null,
    results,
  };
}

// ── MAIN ──

function printHelp() {
  const chatCases = CHAT_TARGETED_CASE_IDS.join(',');
  console.log(`
${USAGE}

Flags:
  --role=grading|chat   Required. Independent roles -- never combined into one score.
  --live                Make real Anthropic calls. Without it, runs the deterministic-layer-only dry check.
  --repeat=N            Re-run each selected case N times (grading only) to check decision stability.
  --model=NAME           Override the resolved model -- must be a REGISTERED (APPROVED or CANDIDATE) model.
  --out=path.json        Explicit output path. Rejected if it would collide with the historical full-suite
                          filename while --cases/--sentinel is also set.
  --cases=id1,id2,...    Run only these dataset case IDs (exact match, comma-separated). Rejects unknown
                          IDs and an empty selection. Never modifies the underlying dataset.
  --sentinel             Shorthand for the locked 17-case grading sentinel
                          (scripts/cadence-model-regression/sentinel.mjs). Grading only.
  --help, -h             Show this help.

Default output paths:
  Full suite (no --cases/--sentinel):  docs/course-audit/cadence-sonnet5-<role>-regression-raw.json
  Filtered grading run:                docs/course-audit/cadence-sonnet5-grading-sentinel-raw.json
  Filtered chat run:                   docs/course-audit/cadence-sonnet5-chat-targeted-raw.json
  A filtered run never overwrites the historical full-suite file, whether the path is auto-generated
  or given explicitly via --out.

Copy/paste commands:
  A. Grading sentinel, repeat=1:
     node scripts/run-cadence-model-regression.mjs --role=grading --sentinel --live --repeat=1

  B. Grading sentinel safety-stability re-run (only if A passes all hard gates):
     node scripts/run-cadence-model-regression.mjs --role=grading --sentinel --live --repeat=3

  C. Targeted chat retest:
     node scripts/run-cadence-model-regression.mjs --role=chat --cases=${chatCases} --live

  D. Full grading suite (only after A/B pass):
     node scripts/run-cadence-model-regression.mjs --role=grading --live

  E. Full chat suite (only after C looks right):
     node scripts/run-cadence-model-regression.mjs --role=chat --live
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (args.role !== 'grading' && args.role !== 'chat') {
    console.error(USAGE);
    process.exit(1);
  }

  if (args.sentinel && args.cases) {
    console.error('Cannot combine --sentinel and --cases -- pick one.');
    process.exit(1);
  }
  if (args.sentinel && args.role !== 'grading') {
    console.error('--sentinel is grading-only. For chat, use --cases=... (see --help for the targeted chat command).');
    process.exit(1);
  }

  const caseIds = args.sentinel ? GRADING_SENTINEL_CASE_IDS : args.cases;

  let summary;
  try {
    summary = args.role === 'grading' ? await runGrading(args, caseIds) : await runChat(args, caseIds);
  } catch (e) {
    if (e instanceof CaseSelectionError) {
      console.error(`Case selection error: ${e.message}`);
      process.exit(1);
    }
    throw e;
  }

  let outPath;
  try {
    outPath = resolveOutputPath({ role: args.role, explicitOut: args.out, filtered: !!caseIds });
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(summary, null, 2));

  console.log(`\n=== Cadence ${args.role.toUpperCase()} regression — mode: ${summary.mode} ===`);
  if (summary.liveBlockedReason) console.log(`BLOCKED: ${summary.liveBlockedReason}`);
  if (summary.modelInfo) console.log(`Model: ${summary.modelInfo.modelName} (${summary.modelInfo.status}, registry ${summary.modelInfo.registryVersion})`);
  if (summary.caseSelection) console.log(`Case selection: ${summary.caseSelection.count} case(s) selected (${args.sentinel ? 'sentinel' : 'explicit --cases'})`);
  console.log(`Total cases: ${summary.totalCases}`);
  if (args.role === 'grading') {
    console.log(`Run status: ${summary.runStatus}  (completed: ${summary.completedCases}/${summary.totalCases}, blocked: ${summary.blockedCases}${summary.blockedCases ? ' [' + summary.blockedCaseIds.join(', ') + ']' : ''})`);
    console.log(`Infra failures: ${summary.infraFailureCount}   Parse/truncation failures: ${summary.parseFailureCount}`);
    console.log(`Overall agreement (of ${summary.completedCases} completed): ${(summary.overallAgreement * 100).toFixed(1)}%`);
    console.log(`Safety-critical: ${summary.safetyCritical.total - summary.safetyCritical.failures}/${summary.safetyCritical.total} correct (failures: ${summary.safetyCritical.failureIds.join(', ') || 'none'})`);
    console.log(`Leakage/injection guard: ${summary.leakageGuard.total - summary.leakageGuard.failures}/${summary.leakageGuard.total} correct`);
    console.log(`Language-variant guard: ${summary.languageVariantGuard.total - summary.languageVariantGuard.failures}/${summary.languageVariantGuard.total} correct`);
    if (summary.stability) console.log(`Stability: ${summary.stability.unstableCount} unstable of ${summary.stability.rerunCases} rerun cases`);
    if (summary.runStatus === 'INCOMPLETE_BLOCKED') console.log('NOTE: this run is INCOMPLETE -- one or more cases never reached a completed evaluation. Do not read the metrics above as a model-quality result until re-run cleanly.');
  } else if (args.role === 'chat' && args.live) {
    console.log(`Truncated (stop_reason: max_tokens): ${summary.truncatedCount}/${summary.totalCases}`);
    if (summary.truncatedCount > 0) console.log('NOTE: at least one response was cut off before it finished. Do not read a truncated response as a clean/finished tone or grounding result -- see its rawDiagnostic.');
  }
  console.log(`Raw output written to: ${path.relative(process.cwd(), outPath)}`);
}

// Guarded so this module can be imported (e.g. by tests, for parseArgs/
// resolveOutputPath) without immediately executing the CLI against
// whatever argv the importing process happens to have.
const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
