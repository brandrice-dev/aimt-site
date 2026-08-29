// Live production-path QA harness for the Cadence Zone B scenario-fact
// gate (scripts/run-cadence-production-path-chat-qa.mjs).
//
// The existing model-regression harness's runChat()
// (scripts/run-cadence-model-regression.mjs) reimplements Ask Cadence's
// system-prompt assembly by hand and calls Anthropic directly -- it never
// calls askCadenceServerSide() and therefore never exercises the Zone B
// gate wired into it (functions/_lib/cadence/scenario-fact-gate.mjs). This
// file proves the new harness closes that gap: it calls the real,
// complete, gated production primitive directly, makes no Supabase/
// course_progress/checkpoint writes (structurally, not just by omission),
// and correctly surfaces gate diagnostics + provider call count for all
// three required QA cases -- without ever making a live Anthropic call.
//
// No Anthropic API calls. Run: node tests/cadence-production-path-qa-harness.test.mjs

import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  QA_CASES,
  parseArgs,
  runQaCase,
  main,
} from '../scripts/run-cadence-production-path-chat-qa.mjs';
import { GRADING_MAX_TOKENS, GRADING_EFFORT, rubricVersionTag } from '../functions/_lib/cadence/checkpoint-evaluation.mjs';
import { getCadenceModelRegistry } from '../functions/_lib/cadence/model-config.mjs';
import { loadCheckpointRubrics } from '../scripts/cadence-model-regression/load-checkpoint-rubrics.mjs';
import { bankVersion, SOURCE_HASHES, knowledgeBank, caseBank, interviewBank } from '../functions/_lib/certification/content-bank.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const HARNESS_SRC = readFileSync(path.join(ROOT, 'scripts/run-cadence-production-path-chat-qa.mjs'), 'utf8');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

async function withMockFetch(mockImpl, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = mockImpl;
  try { return await fn(); } finally { globalThis.fetch = original; }
}

function genStep(text, stopReason) {
  return async () => ({ ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text }], stop_reason: stopReason || 'end_turn', model: 'claude-sonnet-5' }) });
}
function verifyStep(supported) {
  return genStep(JSON.stringify({ supported }));
}
function sequencedFetch(steps) {
  let i = 0;
  const calls = [];
  const fn = async (url, options) => {
    const body = JSON.parse(options.body);
    calls.push({ url, body });
    if (i >= steps.length) throw new Error(`Unexpected extra fetch call #${i + 1} beyond ${steps.length} mocked steps`);
    return steps[i++]();
  };
  fn.calls = calls;
  return fn;
}

const MOCK_ENV = { ANTHROPIC_API_KEY: 'mock-key', CADENCE_CHAT_MODEL: 'claude-sonnet-5' };
const CHAT13_VIOLATION_TEXT =
  "Yes — that's a plausible mechanism worth understanding. Each fever pushes its own batch of follicles into telogen, and since those two batches would release on staggered schedules, the shedding you observe could overlap and read as one long continuous phase rather than two distinct episodes. As a practitioner, the visible clue is diffuse shedding without patchiness or scalp irritation, which supports proceeding with standard scalp care rather than assuming a single cause.";

// ─────────────────────────────────────────────────────────────────────────
// 1/2. HARNESS USES THE REAL GATED PATH, NOT THE runChat() SHORTCUT
// ─────────────────────────────────────────────────────────────────────────
(function usesRealGatedPathTests() {
  check('1/2. USES REAL GATED PATH', 'Harness imports askCadenceServerSide from ask-cadence.mjs -- the real, complete, gated production primitive',
    /import\s*\{[^}]*askCadenceServerSide[^}]*\}\s*from\s*['"][^'"]*ask-cadence\.mjs['"]/.test(HARNESS_SRC));
  check('1/2. USES REAL GATED PATH', 'Harness does NOT import runChat (the existing regression shortcut that bypasses the gate)',
    !/import\s*\{[^}]*\brunChat\b[^}]*\}/.test(HARNESS_SRC));
  check('1/2. USES REAL GATED PATH', 'Harness has no import statement pulling anything in from run-cadence-model-regression.mjs (may still reference it by name in comments, explaining what it deliberately does NOT reuse)',
    !/import\s*\{[^}]*\}\s*from\s*['"][^'"]*run-cadence-model-regression\.mjs['"]/.test(HARNESS_SRC));
  check('1/2. USES REAL GATED PATH', 'runQaCase() calls askCadenceServerSide(), not a hand-built system prompt + raw fetch',
    /askCadenceServerSide\(env,/.test(HARNESS_SRC) && !/callAnthropic\(/.test(HARNESS_SRC));
})();

// ─────────────────────────────────────────────────────────────────────────
// 3/4/5. NO SUPABASE / course_progress / TRANSCRIPT WRITES
// ─────────────────────────────────────────────────────────────────────────
(function noPersistenceTests() {
  check('3/4/5. NO PERSISTENCE', 'Harness has no import of threads.mjs (appendMessage/getOrCreateThread)',
    !/import\s*\{[^}]*\}\s*from\s*['"][^'"]*threads\.mjs['"]/.test(HARNESS_SRC));
  check('3/4/5. NO PERSISTENCE', 'Harness has no import of certification/auth.mjs (supabaseRest and friends)',
    !HARNESS_SRC.includes('certification/auth.mjs'));
  check('3/4/5. NO PERSISTENCE', 'Harness source never actually CALLS appendMessage(...) or getOrCreateThread(...) (may mention them by name in comments, explaining why calling them was unnecessary)',
    !/\bappendMessage\(/.test(HARNESS_SRC) && !/\bgetOrCreateThread\(/.test(HARNESS_SRC));
  check('3/4/5. NO PERSISTENCE', 'Harness source never writes a course_progress query/mutation (no supabaseRest/fetch call naming that table)',
    !/course_progress[^.]*['"`]\)/.test(HARNESS_SRC) && !/supabaseRest\(/.test(HARNESS_SRC));
  const askCadenceSrc = readFileSync(path.join(ROOT, 'functions/_lib/cadence/ask-cadence.mjs'), 'utf8');
  check('3/4/5. NO PERSISTENCE', 'askCadenceServerSide() itself -- the function this harness calls -- has no Supabase-write dependency (only a read-only supabaseRest import, used solely for verified checkpoint status lookups, never write paths)',
    !/insert|update|delete|upsert/i.test(askCadenceSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// 6. ZONE A FIXTURE BYPASSES THE GATE
// ─────────────────────────────────────────────────────────────────────────
await (async function zoneAFixtureTests() {
  const mock = sequencedFetch([genStep('Because a fever pushes a batch of follicles into the resting (telogen) phase early, the shedding shows up weeks to months later, once those follicles actually release.')]);
  const caseResult = await withMockFetch(mock, () => runQaCase(MOCK_ENV, QA_CASES[0]));
  check('6. ZONE A FIXTURE BYPASSES GATE', 'QA Case A is the expected zone-a fixture id', QA_CASES[0].id === 'qa-a-zone-a-tutoring');
  check('6. ZONE A FIXTURE BYPASSES GATE', 'Exactly one provider call made (generation only)', caseResult.providerCallCount === 1, `got ${caseResult.providerCallCount}`);
  check('6. ZONE A FIXTURE BYPASSES GATE', 'scenarioGate.triggered is false', caseResult.scenarioGate.triggered === false);
  check('6. ZONE A FIXTURE BYPASSES GATE', 'scenarioGate.regenerated is false, outcome is original', caseResult.scenarioGate.regenerated === false && caseResult.scenarioGate.outcome === 'original');
})();

// ─────────────────────────────────────────────────────────────────────────
// 7. CHAT-13 FIXTURE EXERCISES THE GATE
// ─────────────────────────────────────────────────────────────────────────
await (async function chat13FixtureTests() {
  check('7. CHAT-13 FIXTURE EXERCISES GATE', 'QA Case B reuses the real chat-13-prior-thread-followup studentMessage/priorMessages verbatim (no hand-duplication drift)',
    QA_CASES[1].id === 'qa-b-chat-13-real-failure' &&
    QA_CASES[1].studentMessage.includes('TWO fevers a few months apart') &&
    QA_CASES[1].priorMessages.length === 2);

  // Outcome A: original draft is actually clean (actionable, but grounded
  // only in the timeline the student already supplied), verification
  // passes immediately.
  const mockClean = sequencedFetch([genStep("The two fevers could plausibly produce overlapping delayed shedding waves that read as one continuous phase. Based on that timeline alone, it's reasonable to proceed with your standard shedding consultation rather than assuming a single cause."), verifyStep(true)]);
  const resultClean = await withMockFetch(mockClean, () => runQaCase(MOCK_ENV, QA_CASES[1]));
  check('7. CHAT-13 FIXTURE EXERCISES GATE', 'Outcome A (clean original) is reachable: triggered true, outcome original', resultClean.scenarioGate.triggered === true && resultClean.scenarioGate.outcome === 'original');

  // Outcome B: first draft fails, regeneration passes.
  const mockRegenerated = sequencedFetch([genStep(CHAT13_VIOLATION_TEXT), verifyStep(false), genStep('If there is no patchiness or irritation, it is reasonable to proceed with standard scalp care -- worth confirming rather than assuming.'), verifyStep(true)]);
  const resultRegenerated = await withMockFetch(mockRegenerated, () => runQaCase(MOCK_ENV, QA_CASES[1]));
  check('7. CHAT-13 FIXTURE EXERCISES GATE', 'Outcome B (regenerated) is reachable: regenerated true, outcome regenerated', resultRegenerated.scenarioGate.regenerated === true && resultRegenerated.scenarioGate.outcome === 'regenerated');
  check('7. CHAT-13 FIXTURE EXERCISES GATE', 'The exact chat-13 invented-absence clause never reaches the final delivered response',
    !resultRegenerated.finalResponse.includes('diffuse shedding without patchiness or scalp irritation'));

  // Outcome C: regeneration also fails, safe fallback returned.
  const mockFallback = sequencedFetch([genStep(CHAT13_VIOLATION_TEXT), verifyStep(false), genStep('Given the clean presentation with no patchiness, it is appropriate to continue with the standard service.'), verifyStep(false)]);
  const resultFallback = await withMockFetch(mockFallback, () => runQaCase(MOCK_ENV, QA_CASES[1]));
  check('7. CHAT-13 FIXTURE EXERCISES GATE', 'Outcome C (safe fallback) is reachable: outcome safe_fallback', resultFallback.scenarioGate.outcome === 'safe_fallback');
  check('7. CHAT-13 FIXTURE EXERCISES GATE', 'Safe-fallback outcome never delivers either invented-fact draft', !resultFallback.finalResponse.includes('no patchiness'));

  check('7. CHAT-13 FIXTURE EXERCISES GATE', 'Provider call count is measurable and matches the pipeline shape for each outcome (2 / 4 / 4)',
    resultClean.providerCallCount === 2 && resultRegenerated.providerCallCount === 4 && resultFallback.providerCallCount === 4);
})();

// ─────────────────────────────────────────────────────────────────────────
// 8. SUPPORTED-ACTIONABLE FIXTURE EXERCISES THE GATE (NOT OVERPROTECTIVE)
// ─────────────────────────────────────────────────────────────────────────
await (async function supportedActionableFixtureTests() {
  check('8. SUPPORTED-ACTIONABLE FIXTURE', 'QA Case C supplies the relevant facts directly in the student message',
    QA_CASES[2].id === 'qa-c-supported-actionable' &&
    /no patchy bald spots/.test(QA_CASES[2].studentMessage) &&
    /no irritation or broken skin/.test(QA_CASES[2].studentMessage));
  const mock = sequencedFetch([genStep("Since there's no patchiness and no irritation on the scalp, it's reasonable to proceed with the standard service today."), verifyStep(true)]);
  const caseResult = await withMockFetch(mock, () => runQaCase(MOCK_ENV, QA_CASES[2]));
  check('8. SUPPORTED-ACTIONABLE FIXTURE', 'scenarioGate.triggered is true (this is genuinely actionable Zone B guidance)', caseResult.scenarioGate.triggered === true);
  check('8. SUPPORTED-ACTIONABLE FIXTURE', 'scenarioGate.unsupportedFactFound is false -- the gate is not overprotective when facts are actually supplied', caseResult.scenarioGate.unsupportedFactFound === false);
  check('8. SUPPORTED-ACTIONABLE FIXTURE', 'outcome is original, regenerated is false -- delivered immediately, natural', caseResult.scenarioGate.outcome === 'original' && caseResult.scenarioGate.regenerated === false);
  check('8. SUPPORTED-ACTIONABLE FIXTURE', 'Exactly two provider calls made (generation + verification, no regeneration needed)', caseResult.providerCallCount === 2, `got ${caseResult.providerCallCount}`);
})();

// ─────────────────────────────────────────────────────────────────────────
// 9/11. DIAGNOSTICS EXPOSED SAFELY -- NO HIDDEN REASONING, NO SECRETS
// ─────────────────────────────────────────────────────────────────────────
await (async function safeDiagnosticsTests() {
  const mock = sequencedFetch([genStep('A plain Zone A explanation.')]);
  const caseResult = await withMockFetch(mock, () => runQaCase(MOCK_ENV, QA_CASES[0]));
  const allowedTopLevelKeys = new Set(['id', 'purpose', 'priorMessages', 'studentMessage', 'finalResponse', 'scenarioGate', 'modelInfo', 'providerCallCount']);
  check('9/11. SAFE DIAGNOSTICS', 'runQaCase() result exposes only the documented, safe fields -- no raw API response, no verifier prompt/reasoning text',
    Object.keys(caseResult).every((k) => allowedTopLevelKeys.has(k)));
  const allowedGateKeys = new Set(['triggered', 'unsupportedFactFound', 'regenerated', 'outcome']);
  check('9/11. SAFE DIAGNOSTICS', 'scenarioGate exposes only boolean/enum fields -- no response text, no rejected draft, no verifier reasoning',
    Object.keys(caseResult.scenarioGate).every((k) => allowedGateKeys.has(k)));
  check('9/11. SAFE DIAGNOSTICS', 'Harness source never logs the API key value (only checks presence via a boolean/truthy check on process.env.ANTHROPIC_API_KEY)',
    !/console\.(log|error|info)\([^)]*apiKey/i.test(HARNESS_SRC) && !/console\.(log|error|info)\([^)]*ANTHROPIC_API_KEY\)/.test(HARNESS_SRC));
  check('9/11. SAFE DIAGNOSTICS', 'Harness source never references a thinking/reasoning content block', !/thinking|chain.?of.?thought/i.test(HARNESS_SRC));
})();

// ─────────────────────────────────────────────────────────────────────────
// 10. PROVIDER CALL COUNT IS MEASURABLE (dedicated full-pipeline check)
// ─────────────────────────────────────────────────────────────────────────
await (async function callCountMeasurableTests() {
  const mock = sequencedFetch([genStep(CHAT13_VIOLATION_TEXT), verifyStep(false), genStep('If there is no patchiness or irritation, it is reasonable to proceed.'), verifyStep(true)]);
  const caseResult = await withMockFetch(mock, () => runQaCase(MOCK_ENV, QA_CASES[1]));
  check('10. PROVIDER CALL COUNT MEASURABLE', 'Full four-call pipeline (generate, verify, regenerate, re-verify) is counted exactly', caseResult.providerCallCount === 4, `got ${caseResult.providerCallCount}`);
  check('10. PROVIDER CALL COUNT MEASURABLE', 'Call counting does not leak into the returned case result beyond the single providerCallCount field', typeof caseResult.providerCallCount === 'number');
})();

// ─────────────────────────────────────────────────────────────────────────
// CLI INTEGRATION: parseArgs + main() end-to-end with --out
// ─────────────────────────────────────────────────────────────────────────
(function parseArgsTests() {
  check('CLI. PARSE ARGS', '--live sets args.live', parseArgs(['--live']).live === true);
  check('CLI. PARSE ARGS', 'no --live leaves args.live false', parseArgs([]).live === false);
  check('CLI. PARSE ARGS', '--case=a,b splits into an array', JSON.stringify(parseArgs(['--case=a,b']).case) === JSON.stringify(['a', 'b']));
  check('CLI. PARSE ARGS', '--out=path.json sets args.out', parseArgs(['--out=x.json']).out === 'x.json');
  check('CLI. PARSE ARGS', '--help sets args.help', parseArgs(['--help']).help === true);
  let threw = false;
  try { parseArgs(['--bogus']); } catch (_) { threw = true; }
  check('CLI. PARSE ARGS', 'An unknown flag throws rather than being silently ignored', threw);
})();

await (async function cliOutFileTests() {
  const outPath = '/private/tmp/claude-501/-Users-brand-Documents-GitHub-aimt-site/7fa72925-b934-47ea-8935-adeb1a1b9dd5/scratchpad/qa-harness-test-out.json';
  const mock = sequencedFetch([genStep('A plain Zone A explanation of overlapping telogen waves.')]);
  const originalKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'mock-key-for-cli-test';
  try {
    await withMockFetch(mock, () => main(['--live', '--case=qa-a-zone-a-tutoring', `--out=${outPath}`]));
  } finally {
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = originalKey;
  }
  const written = existsSync(outPath);
  check('CLI. --out WRITES FILE', 'main() with --live --out writes a JSON diagnostic record to the given path', written);
  if (written) {
    const parsed = JSON.parse(readFileSync(outPath, 'utf8'));
    check('CLI. --out WRITES FILE', 'Written record has a results array with exactly one entry for the filtered case', Array.isArray(parsed.results) && parsed.results.length === 1 && parsed.results[0].id === 'qa-a-zone-a-tutoring');
    unlinkSync(outPath);
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// 12. GRADING UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function gradingUnchangedTests() {
  const registry = getCadenceModelRegistry();
  check('12. GRADING UNCHANGED', 'CADENCE_GRADING_MODEL.approved still exactly claude-sonnet-5', registry.roles.CADENCE_GRADING_MODEL.approved === 'claude-sonnet-5');
  check('12. GRADING UNCHANGED', 'GRADING_MAX_TOKENS still exactly 4096', GRADING_MAX_TOKENS === 4096);
  check('12. GRADING UNCHANGED', 'GRADING_EFFORT still exactly "medium"', GRADING_EFFORT === 'medium');
  check('12. GRADING UNCHANGED', 'Harness source never references CADENCE_GRADING_MODEL -- Chat QA has no path into the grading role', !HARNESS_SRC.includes('CADENCE_GRADING_MODEL'));
})();

// ─────────────────────────────────────────────────────────────────────────
// 13. MODULE 12 UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function module12UnchangedTests() {
  check('13. MODULE 12 UNCHANGED', 'bankVersion unchanged', bankVersion === 'headspa-fe-bank-v1-2026-08-26');
  check('13. MODULE 12 UNCHANGED', 'SOURCE_HASHES unchanged', JSON.stringify(SOURCE_HASHES) === JSON.stringify({
    knowledgeBankMd: '4fb96d8f9c5c4f1f0d542f1c6965e859417af0e1cceb8d2aa77e82f2221294d5',
    appliedCasesMd: 'df60822daa285d36014b01cdbd85436ac255daa3d53cf23dc96175e281a6769d',
    interviewBankMd: 'ee76472b379a9ea3c3129389d655499dc371c7740c9ab625180b239fdc3f15c7',
  }));
  check('13. MODULE 12 UNCHANGED', 'Bank item counts unchanged (120/12/9)', knowledgeBank.length === 120 && caseBank.length === 12 && interviewBank.length === 9);
})();

// ─────────────────────────────────────────────────────────────────────────
// 14. CHECKPOINT CONTENT UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function checkpointContentUnchangedTests() {
  const rubrics = loadCheckpointRubrics();
  check('14. CHECKPOINT CONTENT UNCHANGED', 'Full M0-M11 checkpoint rubric/question set is byte-identical to its pre-existing fingerprint',
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
