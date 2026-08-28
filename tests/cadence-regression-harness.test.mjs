// Cadence model-regression harness — case-filtering regression tests.
//
// Covers the --cases/--sentinel CLI addition (task: "Add targeted Cadence
// regression filtering"). Imports the harness module directly rather than
// spawning a subprocess -- run-cadence-model-regression.mjs guards its
// main() behind an isMainModule check specifically so this import is safe
// and never executes the CLI (never touches the network, never touches
// process.argv, never writes docs/course-audit's historical evidence).
//
// Run: node tests/cadence-regression-harness.test.mjs

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, resolveOutputPath } from '../scripts/run-cadence-model-regression.mjs';
import { selectCases, CaseSelectionError } from '../scripts/cadence-model-regression/case-selection.mjs';
import { GRADING_SENTINEL_CASE_IDS, CHAT_TARGETED_CASE_IDS } from '../scripts/cadence-model-regression/sentinel.mjs';
import { GRADING_DATASET } from '../scripts/cadence-model-regression/grading-dataset.mjs';
import { CHAT_DATASET } from '../scripts/cadence-model-regression/chat-dataset.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

// ─────────────────────────────────────────────────────────────────────────
// 1. selectCases() — the pure filtering primitive
// ─────────────────────────────────────────────────────────────────────────
(function selectCasesTests() {
  check('SELECT CASES', 'Selecting exact IDs returns exactly those cases, in dataset order',
    (() => {
      const { selected } = selectCases(GRADING_DATASET, ['m6cp1-competent', 'm1cp1-unsafe']);
      return selected.length === 2 && selected.every((c) => ['m6cp1-competent', 'm1cp1-unsafe'].includes(c.id));
    })());

  check('SELECT CASES', 'Selected count matches the requested ID count exactly',
    selectCases(GRADING_DATASET, GRADING_SENTINEL_CASE_IDS).selected.length === GRADING_SENTINEL_CASE_IDS.length);

  check('SELECT CASES', 'An unknown ID is rejected with a CaseSelectionError naming the bad ID', (() => {
    try { selectCases(GRADING_DATASET, ['m1cp1-unsafe', 'not-a-real-id']); return false; }
    catch (e) { return e instanceof CaseSelectionError && e.message.includes('not-a-real-id'); }
  })());

  check('SELECT CASES', 'An empty selection is rejected, not silently treated as "everything"', (() => {
    try { selectCases(GRADING_DATASET, []); return false; }
    catch (e) { return e instanceof CaseSelectionError && /empty/i.test(e.message); }
  })());

  check('SELECT CASES', 'Grading filter works against the real grading dataset',
    (() => { const { selected, filtered } = selectCases(GRADING_DATASET, ['m0cp1-incomplete']); return filtered === true && selected.length === 1 && selected[0].checkpointId === 'm0cp1'; })());

  check('SELECT CASES', 'Chat filter works against the real chat dataset',
    (() => { const { selected, filtered } = selectCases(CHAT_DATASET, ['chat-09-medical-diagnostic-request']); return filtered === true && selected.length === 1 && selected[0].moduleId === 6; })());

  check('SELECT CASES', 'null/undefined ids means unfiltered — normal behavior is unchanged when --cases is omitted',
    (() => { const { selected, filtered } = selectCases(GRADING_DATASET, null); return filtered === false && selected === GRADING_DATASET && selected.length === 72; })());

  check('SELECT CASES', 'Duplicate IDs in the request are deduplicated, not double-counted',
    selectCases(GRADING_DATASET, ['m1cp1-unsafe', 'm1cp1-unsafe']).selected.length === 1);

  check('SELECT CASES', 'selectCases never mutates the dataset it is given',
    (() => { const before = GRADING_DATASET.length; selectCases(GRADING_DATASET, ['m1cp1-unsafe']); return GRADING_DATASET.length === before; })());
})();

// ─────────────────────────────────────────────────────────────────────────
// 2. The locked sentinel lists themselves
// ─────────────────────────────────────────────────────────────────────────
(function sentinelListTests() {
  check('SENTINEL LIST', 'GRADING_SENTINEL_CASE_IDS selects exactly 17 cases',
    GRADING_SENTINEL_CASE_IDS.length === 17);
  check('SENTINEL LIST', 'GRADING_SENTINEL_CASE_IDS has no duplicate entries',
    new Set(GRADING_SENTINEL_CASE_IDS).size === GRADING_SENTINEL_CASE_IDS.length);
  check('SENTINEL LIST', 'Every grading sentinel ID exists in the real grading dataset',
    (() => { const valid = new Set(GRADING_DATASET.map((c) => c.id)); return GRADING_SENTINEL_CASE_IDS.every((id) => valid.has(id)); })());
  check('SENTINEL LIST', 'The sentinel filters the real dataset down to exactly 17 without error',
    selectCases(GRADING_DATASET, GRADING_SENTINEL_CASE_IDS).selected.length === 17);

  check('SENTINEL LIST', 'CHAT_TARGETED_CASE_IDS has no duplicate entries',
    new Set(CHAT_TARGETED_CASE_IDS).size === CHAT_TARGETED_CASE_IDS.length);
  check('SENTINEL LIST', 'Every targeted chat ID exists in the real chat dataset (no invented cases)',
    (() => { const valid = new Set(CHAT_DATASET.map((c) => c.id)); return CHAT_TARGETED_CASE_IDS.every((id) => valid.has(id)); })());
})();

// ─────────────────────────────────────────────────────────────────────────
// 3. parseArgs() — CLI flag parsing
// ─────────────────────────────────────────────────────────────────────────
(function parseArgsTests() {
  check('PARSE ARGS', '--cases=a,b,c parses to an exact array, comma-separated',
    (() => { const a = parseArgs(['--role=grading', '--cases=m1cp1-unsafe,m0cp1-competent']); return Array.isArray(a.cases) && a.cases.length === 2 && a.cases[0] === 'm1cp1-unsafe' && a.cases[1] === 'm0cp1-competent'; })());

  check('PARSE ARGS', '--cases trims whitespace and drops empty entries from a trailing comma',
    (() => { const a = parseArgs(['--cases= m1cp1-unsafe , m0cp1-competent ,']); return a.cases.length === 2 && a.cases[0] === 'm1cp1-unsafe'; })());

  check('PARSE ARGS', '--sentinel sets a boolean flag',
    parseArgs(['--role=grading', '--sentinel']).sentinel === true);

  check('PARSE ARGS', 'Omitting --cases and --sentinel leaves both at their unfiltered defaults',
    (() => { const a = parseArgs(['--role=grading', '--live']); return a.cases === null && a.sentinel === false; })());

  check('PARSE ARGS', '--help / -h set the help flag without requiring --role',
    parseArgs(['--help']).help === true && parseArgs(['-h']).help === true);

  check('PARSE ARGS', 'Normal flags (--role, --live, --repeat, --out) are unaffected by the new parsing branches',
    (() => { const a = parseArgs(['--role=chat', '--live', '--repeat=3', '--out=/tmp/x.json']); return a.role === 'chat' && a.live === true && a.repeat === 3 && a.out === '/tmp/x.json'; })());
})();

// ─────────────────────────────────────────────────────────────────────────
// 4. resolveOutputPath() — evidence-file preservation
// ─────────────────────────────────────────────────────────────────────────
(function resolveOutputPathTests() {
  const historicalGrading = path.join(ROOT, 'docs', 'course-audit', 'cadence-sonnet5-grading-regression-raw.json');
  const historicalChat = path.join(ROOT, 'docs', 'course-audit', 'cadence-sonnet5-chat-regression-raw.json');

  check('OUTPUT PATH', 'Unfiltered grading run with no --out resolves to the historical default filename',
    resolveOutputPath({ role: 'grading', explicitOut: null, filtered: false }) === historicalGrading);
  check('OUTPUT PATH', 'Unfiltered chat run with no --out resolves to the historical default filename',
    resolveOutputPath({ role: 'chat', explicitOut: null, filtered: false }) === historicalChat);

  check('OUTPUT PATH', 'A filtered grading run with no --out gets its own distinct default filename, not the historical one',
    (() => { const p = resolveOutputPath({ role: 'grading', explicitOut: null, filtered: true }); return p !== historicalGrading && /grading-sentinel-raw\.json$/.test(p); })());
  check('OUTPUT PATH', 'A filtered chat run with no --out gets its own distinct default filename, not the historical one',
    (() => { const p = resolveOutputPath({ role: 'chat', explicitOut: null, filtered: true }); return p !== historicalChat && /chat-targeted-raw\.json$/.test(p); })());

  check('OUTPUT PATH', 'A filtered run does not overwrite the historical default evidence — an explicit --out matching it is rejected outright', (() => {
    try { resolveOutputPath({ role: 'grading', explicitOut: historicalGrading, filtered: true }); return false; }
    catch (e) { return /overwrite the historical full-suite evidence file/.test(e.message); }
  })());
  check('OUTPUT PATH', 'The same collision guard applies to chat', (() => {
    try { resolveOutputPath({ role: 'chat', explicitOut: historicalChat, filtered: true }); return false; }
    catch (e) { return /overwrite the historical full-suite evidence file/.test(e.message); }
  })());

  check('OUTPUT PATH', 'An unfiltered run may still explicitly target the historical filename (no guard when not filtering)',
    resolveOutputPath({ role: 'grading', explicitOut: historicalGrading, filtered: false }) === historicalGrading);
  check('OUTPUT PATH', 'A filtered run with an explicit --out that does NOT collide with the historical file is honored as given',
    resolveOutputPath({ role: 'grading', explicitOut: '/tmp/my-custom-sentinel.json', filtered: true }) === '/tmp/my-custom-sentinel.json');
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
