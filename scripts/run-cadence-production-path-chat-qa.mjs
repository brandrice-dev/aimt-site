#!/usr/bin/env node
// Live production-path QA harness for the Cadence Zone B scenario-fact
// gate (functions/_lib/cadence/scenario-fact-gate.mjs).
//
// The existing model-regression harness's runChat()
// (scripts/run-cadence-model-regression.mjs) reimplements Ask Cadence's
// system-prompt assembly by hand and calls Anthropic directly -- it
// never calls askCadenceServerSide() and therefore never exercises the
// Zone B gate wired into it. Before Chat can be approved, we need a
// harness that exercises the real, complete, gated server-side path --
// not a parallel reimplementation of part of it.
//
// This script calls askCadenceServerSide() directly: the one production
// primitive that already contains the entire pipeline (generation ->
// deterministic Zone B detection -> scenario-fact verification -> at
// most one controlled regeneration -> delivery or a fixed safe
// fallback). That function has zero Supabase/thread dependency (see its
// own imports in functions/_lib/cadence/ask-cadence.mjs, and
// tests/cadence-chat-scenario-gate.test.mjs "J. STUDENT MESSAGE NEVER
// DUPLICATED") -- calling it directly here cannot write a message,
// mutate course_progress, or touch checkpoint state, because there is no
// persistence code anywhere in the path being exercised.
//
// Usage:
//   node scripts/run-cadence-production-path-chat-qa.mjs --live [--case=id1,id2] [--out=path.json]
//   node scripts/run-cadence-production-path-chat-qa.mjs --help
//
// Without --live, this resolves each case's real prompt/context and
// exits -- no Anthropic call, matching the existing regression harness's
// own "never fake a live result" discipline.

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadModuleGuideSystems, loadSharedToneConstants } from './cadence-model-regression/load-checkpoint-rubrics.mjs';
import { CHAT_DATASET } from './cadence-model-regression/chat-dataset.mjs';
import { selectCases, CaseSelectionError } from './cadence-model-regression/case-selection.mjs';
import { askCadenceServerSide, AskCadenceTruncationError } from '../functions/_lib/cadence/ask-cadence.mjs';
import { getCadenceModelRegistry, resolveCadenceModel, CadenceModelConfigError } from '../functions/_lib/cadence/model-config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Pulled directly from the real dataset (never hand-duplicated) so QA
// Case B stays byte-identical to the actual chat-13 fixture the live
// violation was found against.
const CHAT13_CASE = CHAT_DATASET.find((c) => c.id === 'chat-13-prior-thread-followup');
if (!CHAT13_CASE) {
  throw new Error('chat-13-prior-thread-followup not found in CHAT_DATASET -- QA Case B depends on staying in sync with the real dataset.');
}

// The three required QA fixtures (task Sections 4/5/6). `purpose` is
// printed with every result so a reader never has to cross-reference
// back to the task spec to know why a given case exists.
export const QA_CASES = [
  {
    id: 'qa-a-zone-a-tutoring',
    purpose: 'Ordinary Zone A tutoring stays single-generation and ungated -- no verifier call, no regeneration.',
    moduleId: 3,
    priorMessages: [],
    studentMessage: 'Can you explain why shedding can show up later after someone was sick?',
  },
  {
    id: 'qa-b-chat-13-real-failure',
    purpose: 'The exact scenario that produced the live chat-13 violation -- proves unsupported scenario facts never reach the final answer, whichever of the three system-correct outcomes (clean original / regenerated / safe fallback) occurs.',
    moduleId: CHAT13_CASE.moduleId,
    priorMessages: CHAT13_CASE.priorMessages,
    studentMessage: CHAT13_CASE.studentMessage,
  },
  {
    id: 'qa-c-supported-actionable',
    purpose: 'The student supplies the relevant facts directly -- proves the gate does not become overprotective when actionable guidance is genuinely supported.',
    moduleId: 3,
    priorMessages: [],
    studentMessage: 'My client has diffuse shedding across the whole scalp -- no patchy bald spots anywhere, and no irritation or broken skin that I can see. Based on just that, is it reasonable to proceed with the standard service today?',
  },
];

export function parseArgs(argv) {
  const args = { live: false, case: null, out: null, help: false };
  for (const raw of argv) {
    if (raw === '--live') args.live = true;
    else if (raw === '--help' || raw === '-h') args.help = true;
    else if (raw.startsWith('--case=')) args.case = raw.slice('--case='.length).split(',').map((s) => s.trim()).filter(Boolean);
    else if (raw.startsWith('--out=')) args.out = raw.slice('--out='.length);
    else throw new Error(`Unknown argument: ${raw} (see --help)`);
  }
  return args;
}

/**
 * Resolves the real CADENCE_CHAT_MODEL config for this QA run, the same
 * way scripts/run-cadence-model-regression.mjs's resolveHarnessModel()
 * does: no --model override in this harness's minimal interface, so this
 * always targets the role's registered CANDIDATE (Chat has no APPROVED
 * default yet -- test-only candidate use, build contract Section 15).
 * Reuses the real production registry/resolver rather than duplicating
 * any lookup logic, and never writes to the registry.
 */
function resolveQaEnv(apiKey) {
  const registry = getCadenceModelRegistry();
  const candidate = registry.roles.CADENCE_CHAT_MODEL && registry.roles.CADENCE_CHAT_MODEL.candidate;
  if (!candidate) throw new CadenceModelConfigError('No CANDIDATE registered for CADENCE_CHAT_MODEL -- nothing to QA.');
  resolveCadenceModel({ CADENCE_CHAT_MODEL: candidate }, 'CADENCE_CHAT_MODEL'); // fail fast, before any Anthropic call
  return { ANTHROPIC_API_KEY: apiKey, CADENCE_CHAT_MODEL: candidate };
}

/**
 * Wraps globalThis.fetch for the duration of `fn`, counting every call
 * made through it, then restores the original -- the only way to observe
 * how many Anthropic calls one askCadenceServerSide() turn actually made
 * (generation only; generation+verify; or generation+verify+regenerate+
 * re-verify) without changing the gate itself to self-report a count,
 * which this task's scope explicitly excludes ("DO NOT modify the gate
 * behavior yet").
 */
async function withCallCounting(fn) {
  const original = globalThis.fetch;
  let count = 0;
  globalThis.fetch = (...callArgs) => { count += 1; return original(...callArgs); };
  try {
    const result = await fn();
    return { result, callCount: count };
  } finally {
    globalThis.fetch = original;
  }
}

function buildGuideSystemPrompt(moduleId) {
  const guideSystems = loadModuleGuideSystems();
  const tone = loadSharedToneConstants();
  // guideSystemPrompt is MODULE CONTENT ONLY -- askCadenceServerSide()
  // appends ASK_CADENCE_BASE_GUARDRAIL itself, internally (see
  // functions/_lib/cadence/ask-cadence.mjs). Appending it again here
  // would misrepresent what this harness tests: the real function's real
  // prompt assembly, not a hand-duplicated copy of it.
  return (guideSystems[String(moduleId)] || guideSystems['0']) +
    '\n' + tone.CADENCE_RESPONSE_CONSISTENCY_ANCHOR +
    '\n' + tone.CADENCE_SELECTIVE_MEMORY_INSTRUCTION;
}

/**
 * Runs one QA case through the real, complete, gated production path --
 * askCadenceServerSide() itself, never a reimplementation of any part of
 * it. Returns the diagnostic record the task's Section 7 requires. Never
 * touches Supabase: askCadenceServerSide() has no such dependency, so
 * nothing about calling it here can write a message, mutate
 * course_progress, or touch checkpoint state.
 */
export async function runQaCase(env, testCase) {
  const guideSystemPrompt = buildGuideSystemPrompt(testCase.moduleId);
  const { result, callCount } = await withCallCounting(() =>
    askCadenceServerSide(env, {
      guideSystemPrompt,
      boundedContext: testCase.priorMessages,
      studentMessage: testCase.studentMessage,
      activeCheckpointGuardrailText: null, // none of these three fixtures simulate an active checkpoint
    })
  );
  return {
    id: testCase.id,
    purpose: testCase.purpose,
    priorMessages: testCase.priorMessages,
    studentMessage: testCase.studentMessage,
    finalResponse: result.text,
    scenarioGate: result.scenarioGate,
    modelInfo: result.modelInfo,
    providerCallCount: callCount,
  };
}

function printCaseReport(caseResult) {
  console.log(`\n${'='.repeat(72)}`);
  console.log(`CASE ID: ${caseResult.id}`);
  console.log(`PURPOSE: ${caseResult.purpose}`);
  console.log('='.repeat(72));
  if (caseResult.priorMessages && caseResult.priorMessages.length) {
    console.log('\nPRIOR THREAD:');
    for (const m of caseResult.priorMessages) console.log(`  [${m.role}] ${m.content}`);
  } else {
    console.log('\nPRIOR THREAD: (none)');
  }
  console.log(`\nSTUDENT: ${caseResult.studentMessage}`);

  if (caseResult.error) {
    console.log(`\nERROR: ${caseResult.error}`);
    if (caseResult.truncated) console.log('TRUNCATED: yes -- the primary generation call was cut off before it finished (stop_reason: max_tokens). Never treat this as a finished answer.');
    return;
  }

  console.log(`\nFINAL CADENCE RESPONSE:\n${caseResult.finalResponse}`);
  console.log('\nGATE DIAGNOSTICS:');
  console.log(`  zoneBTriggered:        ${caseResult.scenarioGate.triggered}`);
  console.log(`  unsupportedFactFound:  ${caseResult.scenarioGate.unsupportedFactFound}`);
  console.log(`  regenerated:           ${caseResult.scenarioGate.regenerated}`);
  console.log(`  outcome:               ${caseResult.scenarioGate.outcome}`);
  console.log(`  model:                 ${caseResult.modelInfo && caseResult.modelInfo.modelName}`);
  console.log(`\nPROVIDER CALL COUNT: ${caseResult.providerCallCount}`);
}

function printHelp() {
  console.log(`
Usage: node scripts/run-cadence-production-path-chat-qa.mjs --live [--case=id1,id2] [--out=path.json]
       node scripts/run-cadence-production-path-chat-qa.mjs --help

Exercises the REAL, COMPLETE, gated Ask Cadence server-side path --
askCadenceServerSide() itself (functions/_lib/cadence/ask-cadence.mjs) --
not the existing model-regression harness's runChat(), which bypasses the
Zone B scenario-fact gate entirely.

Never writes to Supabase, never touches course_progress, never mutates
checkpoint state -- askCadenceServerSide() has no such dependency.

Cases (all three run by default):
${QA_CASES.map((c) => `  ${c.id.padEnd(28)} ${c.purpose}`).join('\n')}

Flags:
  --live            Make real Anthropic calls (requires ANTHROPIC_API_KEY
                     in the environment). Without it, resolves each case's
                     real prompt/context and exits -- no call is made.
  --case=id,id       Run only these QA case IDs (comma-separated).
  --out=path.json    Write the full diagnostic record to this path (JSON).
  --help, -h         Show this help.
`);
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) { printHelp(); return; }

  let selected;
  try {
    ({ selected } = selectCases(QA_CASES, args.case));
  } catch (e) {
    if (e instanceof CaseSelectionError) { console.error(e.message); process.exitCode = 1; return; }
    throw e;
  }

  if (!args.live) {
    console.log('Dry run (no --live): resolving prompt/context only -- no Anthropic call will be made.\n');
    for (const testCase of selected) {
      buildGuideSystemPrompt(testCase.moduleId); // throws if the real module guide content can't be extracted
      console.log(`- ${testCase.id}: system prompt resolves OK. studentMessage="${testCase.studentMessage}"`);
    }
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set in this environment -- cannot run live. Set it in your terminal QA session and re-run with --live.');
    process.exitCode = 1;
    return;
  }
  const env = resolveQaEnv(apiKey);

  const results = [];
  for (const testCase of selected) {
    let caseResult;
    try {
      caseResult = await runQaCase(env, testCase);
    } catch (e) {
      caseResult = {
        id: testCase.id, purpose: testCase.purpose, priorMessages: testCase.priorMessages, studentMessage: testCase.studentMessage,
        error: String(e.message || e),
        truncated: e instanceof AskCadenceTruncationError,
      };
    }
    printCaseReport(caseResult);
    results.push(caseResult);
  }

  if (args.out) {
    const outPath = path.isAbsolute(args.out) ? args.out : path.join(ROOT, args.out);
    writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
    console.log(`\nFull diagnostic record written to: ${path.relative(ROOT, outPath)}`);
  }
}

// Guarded so this module can be imported (e.g. by tests, for parseArgs/
// QA_CASES/runQaCase) without immediately executing the CLI against
// whatever argv the importing process happens to have.
const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
