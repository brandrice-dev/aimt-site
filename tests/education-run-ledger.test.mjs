// AIMT Education Operations v1 — deterministic tests for the run
// ledger (functions/_lib/education-ops/education-run-ledger.mjs).
//
// Run: node tests/education-run-ledger.test.mjs

import { buildRunReport, RUN_FINAL_STATE } from '../functions/_lib/education-ops/education-run-ledger.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

(function testMinimalReportBuilds() {
  const report = buildRunReport({ run_id: 'r1', started_at: 'x', mode: 'shadow', final_state: RUN_FINAL_STATE.NO_OP_SUCCESS });
  check('MINIMAL', 'builds without throwing', !!report);
  check('MINIMAL', 'final_state preserved', report.final_state === RUN_FINAL_STATE.NO_OP_SUCCESS);
  check('MINIMAL', 'model_calls defaults to zero', report.model_calls.total_calls === 0);
})();

(function testRequiredFieldsEnforced() {
  let threw = false;
  try { buildRunReport({ mode: 'shadow', final_state: RUN_FINAL_STATE.NO_OP_SUCCESS }); } catch (e) { threw = true; }
  check('REQUIRED_FIELDS', 'throws without run_id', threw);
})();

(function testUnknownFinalStateRejected() {
  let threw = false;
  try { buildRunReport({ run_id: 'r1', mode: 'shadow', final_state: 'NOT_A_REAL_STATE' }); } catch (e) { threw = true; }
  check('UNKNOWN_STATE', 'throws on an unrecognized final_state', threw);
})();

(function testModelCallsAggregated() {
  const report = buildRunReport({
    run_id: 'r1', mode: 'shadow', final_state: RUN_FINAL_STATE.SHADOW_CANDIDATE_READY,
    model_calls: [{ role: 'a', input_tokens: 100, output_tokens: 50 }, { role: 'b', input_tokens: 200, output_tokens: 150 }],
  });
  check('AGGREGATION', 'total_calls counted', report.model_calls.total_calls === 2);
  check('AGGREGATION', 'input tokens summed', report.model_calls.total_input_tokens === 300);
  check('AGGREGATION', 'output tokens summed', report.model_calls.total_output_tokens === 200);
})();

(function testEveryDocumentedFinalStateIsBuildable() {
  for (const state of Object.values(RUN_FINAL_STATE)) {
    const report = buildRunReport({ run_id: 'r1', mode: 'shadow', final_state: state });
    check('ALL_STATES_BUILDABLE', `${state} builds`, report.final_state === state);
  }
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
