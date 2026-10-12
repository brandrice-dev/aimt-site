import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildRunReport, RUN_FINAL_STATE, runExitCode, operationalOutcome } from '../functions/_lib/education-ops/education-run-ledger.mjs';
import { surfaceExceptionIfNeeded } from '../functions/_lib/education-ops/education-exception-reporter.mjs';

for (const [state, outcome, exit] of [
  ['NO_OP_SUCCESS', 'NO_OP', 0], ['PUBLISHED', 'COMPLETED', 0],
  ['PROVIDER_FAILED', 'PROVIDER_FAILURE', 1], ['INVALID_RESPONSE', 'INVALID_RESPONSE', 1],
  ['CONFIG_BLOCKED', 'CONFIGURATION_FAILURE', 1], ['SHADOW_CANDIDATE_READY', 'PARTIAL_COMPLETION', 0],
  ['AUTOPUBLISH_GATE_CLOSED', 'PARTIAL_COMPLETION', 0], ['HUMAN_REVIEW', 'REVIEW_REQUIRED', 0],
  ['SYNTHESIS_FAILED', 'UNCLASSIFIED_FAILURE', 1],
  ['PUBLISH_FAILED', 'PUBLICATION_FAILURE', 1], ['INFRA_REVIEW', 'INFRASTRUCTURE_FAILURE', 1],
  ['EDITORIAL_REVIEW', 'REVIEW_REQUIRED', 0], ['FRESHNESS_FLAGGED', 'REVIEW_REQUIRED', 0],
  ['RESEARCH_GAP_QUEUED', 'PARTIAL_COMPLETION', 0],
]) {
  test(`${state} has explicit operational outcome and CLI status`, () => {
    const report = buildRunReport({ run_id: 'fixture', mode: 'shadow', final_state: RUN_FINAL_STATE[state] });
    assert.equal(report.operational_outcome, outcome);
    assert.equal(runExitCode(report), exit);
  });
}

test('every terminal error has a failure outcome, and unknown vocabulary fails closed', () => {
  for (const state of Object.values(RUN_FINAL_STATE)) {
    if (runExitCode({ final_state: state }) === 1) {
      assert.notEqual(operationalOutcome(state), 'REVIEW_REQUIRED', state);
      assert.notEqual(operationalOutcome(state), 'NO_OP', state);
      assert.notEqual(operationalOutcome(state), 'COMPLETED', state);
      assert.notEqual(operationalOutcome(state), 'PARTIAL_COMPLETION', state);
    }
  }
  assert.throws(() => operationalOutcome('FUTURE_UNKNOWN_STATE'), /unrecognized final_state/);
});

for (const state of ['PROVIDER_FAILED', 'INVALID_RESPONSE', 'SYNTHESIS_FAILED', 'INFRA_REVIEW', 'PUBLISH_FAILED']) {
  test(`${state} reaches the existing deduplicated infrastructure review lane`, async () => {
    const report = buildRunReport({ run_id: 'fixture', mode: 'shadow', final_state: state, exception_reason: 'fixture failure' });
    const created = [];
    const io = {
      listIssuesFn: async () => created.map((i) => ({ ...i, state: 'open' })),
      createIssueFn: async (issue) => { const entry = { ...issue, number: 1 }; created.push(entry); return entry; },
    };
    assert.equal((await surfaceExceptionIfNeeded(report, io)).action, 'CREATED');
    assert.equal((await surfaceExceptionIfNeeded(report, io)).action, 'REUSED');
    assert.deepEqual(created[0].labels, ['education-infra']);
    assert.equal(created.length, 1);
  });
}

test('the existing publication handoff treats failures as failures and permits only a ready candidate', () => {
  const workflow = readFileSync(new URL('../.github/workflows/aimt-education-publish.yml', import.meta.url), 'utf8');
  const decision = workflow.match(/case "\$final_state" in[\s\S]*?\n\s*esac/)[0];
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), 'aimt-handoff-'));
  try {
    for (const state of ['PROVIDER_FAILED', 'INVALID_RESPONSE', 'SYNTHESIS_FAILED', 'CONFIG_BLOCKED', 'INFRA_REVIEW', 'PUBLISH_FAILED', 'NO_OP_SUCCESS', 'HUMAN_REVIEW', 'SHADOW_CANDIDATE_READY']) {
      const output = path.join(fixtureRoot, `${state}.txt`);
      const result = spawnSync('/bin/bash', ['-c', decision], { encoding: 'utf8', env: {
        PATH: '/usr/bin:/bin', final_state: state, selected_topic: 'fixture-topic', GITHUB_OUTPUT: output,
      }});
      const shouldFail = runExitCode({ final_state: state }) === 1;
      assert.equal(result.status, shouldFail ? 1 : 0, state);
      assert.match(readFileSync(output, 'utf8'), new RegExp(`should_publish=${state === 'SHADOW_CANDIDATE_READY' ? 'true' : 'false'}`));
      if (shouldFail) assert.ok(!result.stdout.includes('intentional no-op'), state);
    }
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
