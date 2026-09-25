// AIMT Education Operations v1 — deterministic tests for the run
// ledger (functions/_lib/education-ops/education-run-ledger.mjs).
//
// Run: node tests/education-run-ledger.test.mjs

import { buildRunReport, RUN_FINAL_STATE, MAX_EDUCATION_OPS_MODEL_CALLS_PER_RUN } from '../functions/_lib/education-ops/education-run-ledger.mjs';

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

// ─────────────────────────────────────────────────────────────────────────
// MODEL-CALL-CEILING CORRECTION: "4 conceptual roles" is not the same
// as "4 actual API calls" -- Publication Editor's own bounded pipeline
// may issue up to 3 real calls on its own. The ledger must track the
// TRUE actual count and refuse to report a run that structurally
// shouldn't be possible.
// ─────────────────────────────────────────────────────────────────────────
(function testFourRolesEachOneCallEqualsFour() {
  const report = buildRunReport({
    run_id: 'r1', mode: 'shadow', final_state: RUN_FINAL_STATE.SHADOW_CANDIDATE_READY,
    model_calls: [
      { role: 'intent_planner', actual_call_count: 1, input_tokens: 10, output_tokens: 10 },
      { role: 'publication_editor', actual_call_count: 1, input_tokens: 10, output_tokens: 10 },
      { role: 'education_writer', actual_call_count: 1, input_tokens: 10, output_tokens: 10 },
      { role: 'education_reviewer', actual_call_count: 1, input_tokens: 10, output_tokens: 10 },
    ],
  });
  check('FOUR_ROLES_FOUR_CALLS', 'total_roles_invoked is 4', report.model_calls.total_roles_invoked === 4);
  check('FOUR_ROLES_FOUR_CALLS', 'actual_model_call_count is 4 (best case: PE made exactly 1 call)', report.model_calls.actual_model_call_count === 4);
  check('FOUR_ROLES_FOUR_CALLS', 'total_calls alias matches actual_model_call_count', report.model_calls.total_calls === 4);
})();

(function testFourRolesWithPublicationEditorWorstCaseEqualsSix() {
  const report = buildRunReport({
    run_id: 'r2', mode: 'shadow', final_state: RUN_FINAL_STATE.SHADOW_CANDIDATE_READY,
    model_calls: [
      { role: 'intent_planner', actual_call_count: 1, input_tokens: 10, output_tokens: 10 },
      { role: 'publication_editor', actual_call_count: 3, input_tokens: 30, output_tokens: 30 }, // worst case: 1 initial + reconciliation + full retry
      { role: 'education_writer', actual_call_count: 1, input_tokens: 10, output_tokens: 10 },
      { role: 'education_reviewer', actual_call_count: 1, input_tokens: 10, output_tokens: 10 },
    ],
  });
  check('WORST_CASE_SIX_CALLS', 'total_roles_invoked is still only 4 (roles, not calls)', report.model_calls.total_roles_invoked === 4);
  check('WORST_CASE_SIX_CALLS', 'actual_model_call_count is the TRUE 6, not 4', report.model_calls.actual_model_call_count === 6, report.model_calls.actual_model_call_count);
  check('WORST_CASE_SIX_CALLS', 'exactly at the declared ceiling', report.model_calls.actual_model_call_count === MAX_EDUCATION_OPS_MODEL_CALLS_PER_RUN);
})();

(function testExceedingTheCeilingFailsClosed() {
  let threw = false;
  let message = '';
  try {
    buildRunReport({
      run_id: 'r3', mode: 'shadow', final_state: RUN_FINAL_STATE.SHADOW_CANDIDATE_READY,
      model_calls: [
        { role: 'intent_planner', actual_call_count: 1 },
        { role: 'publication_editor', actual_call_count: 3 },
        { role: 'education_writer', actual_call_count: 1 },
        { role: 'education_reviewer', actual_call_count: 2 }, // simulated architecture drift: 7 total
      ],
    });
  } catch (e) {
    threw = true;
    message = e.message;
  }
  check('EXCEEDS_CEILING_FAILS_CLOSED', 'buildRunReport throws rather than silently reporting a 7-call run', threw);
  check('EXCEEDS_CEILING_FAILS_CLOSED', 'the error names the ceiling', message.includes(String(MAX_EDUCATION_OPS_MODEL_CALLS_PER_RUN)), message);
})();

(function testMissingActualCallCountDefaultsToOnePerEntry() {
  // A role entry that doesn't explicitly set actual_call_count (e.g. an
  // older/simpler test fixture) is assumed to be exactly 1 real call --
  // never silently 0, which would undercount the true ceiling.
  const report = buildRunReport({
    run_id: 'r4', mode: 'shadow', final_state: RUN_FINAL_STATE.NO_OP_SUCCESS,
    model_calls: [{ role: 'intent_planner' }],
  });
  check('DEFAULT_ONE_PER_ENTRY', 'defaults to 1 actual call when unset', report.model_calls.actual_model_call_count === 1);
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
