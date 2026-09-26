// AIMT Education Operations v1 — deterministic tests for exception
// surfacing/dedup (functions/_lib/education-ops/
// education-exception-reporter.mjs). io is ALWAYS mocked -- no real
// GitHub API call anywhere in this file.
//
// Run: node tests/education-exception-reporter.test.mjs

import { surfaceExceptionIfNeeded, buildDedupMarker, EXCEPTION_LABELS } from '../functions/_lib/education-ops/education-exception-reporter.mjs';
import { buildRunReport, RUN_FINAL_STATE } from '../functions/_lib/education-ops/education-run-ledger.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

async function testNormalSuccessNeverCreatesAnIssue() {
  let listCalls = 0, createCalls = 0;
  const report = buildRunReport({ run_id: 'r1', mode: 'shadow', final_state: RUN_FINAL_STATE.NO_OP_SUCCESS });
  const result = await surfaceExceptionIfNeeded(report, {
    listIssuesFn: async () => { listCalls += 1; return []; },
    createIssueFn: async () => { createCalls += 1; return {}; },
  });
  check('NORMAL_SUCCESS', 'action is NONE', result.action === 'NONE');
  check('NORMAL_SUCCESS', 'never lists issues', listCalls === 0);
  check('NORMAL_SUCCESS', 'never creates an issue', createCalls === 0);
}

async function testShadowCandidateReadyNeverCreatesAnIssue() {
  const report = buildRunReport({ run_id: 'r1', mode: 'shadow', final_state: RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, selected_topic: 'x' });
  const result = await surfaceExceptionIfNeeded(report, { listIssuesFn: async () => [], createIssueFn: async () => ({}) });
  check('CANDIDATE_READY_NO_ISSUE', 'action is NONE (a good candidate is not an exception)', result.action === 'NONE');
}

async function testHumanReviewCreatesAnIssue() {
  let createdWith = null;
  const report = buildRunReport({ run_id: 'r1', mode: 'shadow', final_state: RUN_FINAL_STATE.HUMAN_REVIEW, selected_topic: 'androgenetic-alopecia', exception_reason: 'Genuine unresolved contradiction.' });
  const result = await surfaceExceptionIfNeeded(report, {
    listIssuesFn: async () => [],
    createIssueFn: async (input) => { createdWith = input; return { number: 42, title: input.title, url: 'https://github.com/x/x/issues/42' }; },
  });
  check('HUMAN_REVIEW_ISSUE', 'action is CREATED', result.action === 'CREATED');
  check('HUMAN_REVIEW_ISSUE', 'correct label', result.label === EXCEPTION_LABELS.RISK_OR_HUMAN_REVIEW);
  check('HUMAN_REVIEW_ISSUE', 'title contains the dedup marker', createdWith.title.includes(buildDedupMarker('androgenetic-alopecia', 'Genuine unresolved contradiction.')));
}

async function testDedupReusesExistingOpenIssue() {
  const marker = buildDedupMarker('androgenetic-alopecia', 'HUMAN_REVIEW');
  const report = buildRunReport({ run_id: 'r2', mode: 'shadow', final_state: RUN_FINAL_STATE.HUMAN_REVIEW, selected_topic: 'androgenetic-alopecia', exception_reason: 'HUMAN_REVIEW' });
  let createCalls = 0;
  const result = await surfaceExceptionIfNeeded(report, {
    listIssuesFn: async () => [{ number: 7, title: `[HUMAN_REVIEW] androgenetic-alopecia ${marker}`, state: 'open' }],
    createIssueFn: async () => { createCalls += 1; return {}; },
  });
  check('DEDUP_REUSE', 'action is REUSED', result.action === 'REUSED');
  check('DEDUP_REUSE', 'reuses the existing issue number', result.issue.number === 7);
  check('DEDUP_REUSE', 'never creates a duplicate', createCalls === 0);
}

async function testClosedIssueWithSameMarkerIsNotReused() {
  const marker = buildDedupMarker('androgenetic-alopecia', 'HUMAN_REVIEW');
  const report = buildRunReport({ run_id: 'r3', mode: 'shadow', final_state: RUN_FINAL_STATE.HUMAN_REVIEW, selected_topic: 'androgenetic-alopecia', exception_reason: 'HUMAN_REVIEW' });
  let createCalls = 0;
  const result = await surfaceExceptionIfNeeded(report, {
    listIssuesFn: async () => [{ number: 7, title: `[HUMAN_REVIEW] androgenetic-alopecia ${marker}`, state: 'closed' }],
    createIssueFn: async () => { createCalls += 1; return { number: 9 }; },
  });
  check('CLOSED_NOT_REUSED', 'a closed issue with the same marker is not reused', result.action === 'CREATED');
  check('CLOSED_NOT_REUSED', 'creates a fresh issue', createCalls === 1);
}

async function testEveryExceptionFinalStateMapsToALabel() {
  for (const state of ['HUMAN_REVIEW', 'EDITORIAL_REVIEW', 'INFRA_REVIEW', 'FRESHNESS_FLAGGED', 'CONFIG_BLOCKED', 'PUBLISH_FAILED']) {
    const report = buildRunReport({ run_id: 'r1', mode: 'shadow', final_state: state, exception_reason: 'x' });
    const result = await surfaceExceptionIfNeeded(report, { listIssuesFn: async () => [], createIssueFn: async () => ({ number: 1 }) });
    check('ALL_EXCEPTION_STATES_LABELED', `${state} produces a labeled action`, result.action === 'CREATED' && !!result.label, state);
  }
}

const tests = [testNormalSuccessNeverCreatesAnIssue, testShadowCandidateReadyNeverCreatesAnIssue, testHumanReviewCreatesAnIssue, testDedupReusesExistingOpenIssue, testClosedIssueWithSameMarkerIsNotReused, testEveryExceptionFinalStateMapsToALabel];
for (const t of tests) await t();

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
