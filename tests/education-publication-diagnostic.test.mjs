import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { runDiagnosticCycle } from '../scripts/education-publication-diagnostic.mjs';
import { buildGhPrMergeArgs } from '../scripts/education-operations-cycle.mjs';

test('diagnostic without explicit model approval exits before service calls', () => {
  const result = spawnSync(process.execPath, ['scripts/education-publication-diagnostic.mjs'], { encoding: 'utf8', env: { PATH: process.env.PATH } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /explicit --allow-model-calls approval/);
});
test('diagnostic overrides inherited production flags and disables research-gap I/O', async () => {
  let gapCalls = 0;
  const env = { AIMT_EDUCATION_AUTOPUBLISH_ENABLED: 'true', AIMT_RESEARCH_GAP_LOOP_ENABLED: 'true' };
  const report = await runDiagnosticCycle(env, {
    publishedTopicSlugs: [], pagesPublishedThisWeek: 0,
    fns: {
      fetchEvidenceFn: async (effectiveEnv) => {
        assert.equal(effectiveEnv.AIMT_EDUCATION_AUTOPUBLISH_ENABLED, 'false');
        assert.equal(effectiveEnv.AIMT_RESEARCH_GAP_LOOP_ENABLED, 'false');
        return { claims: [], sources: [] };
      },
      checkFreshnessFn: async () => [],
      loadActiveResearchGapsFn: async () => { gapCalls++; throw new Error('must not query gaps'); },
      upsertResearchGapFn: async () => { gapCalls++; throw new Error('must not write gaps'); },
    },
  });
  assert.equal(report.final_state, 'NO_OP_SUCCESS');
  assert.equal(report.model_calls.total_calls, 0);
  assert.equal(gapCalls, 0);
  assert.equal(env.AIMT_EDUCATION_AUTOPUBLISH_ENABLED, 'true');
});
test('diagnostic is manual, bounded by workflow, and cannot satisfy scheduled publication origin', () => {
  const workflow = readFileSync('.github/workflows/aimt-education-operations.yml', 'utf8');
  const publisher = readFileSync('.github/workflows/aimt-education-publish.yml', 'utf8');
  const script = readFileSync('scripts/education-publication-diagnostic.mjs', 'utf8');
  assert.match(workflow, /timeout-minutes: 30/);
  assert.match(workflow, /education-candidate-bundles-diagnostic/);
  assert.match(script, /'scalp-microbiome'/);
  assert.match(workflow, /github.event_name == 'workflow_dispatch' && inputs.diagnostic/);
  assert.match(publisher, /github.event.workflow_run.event == 'schedule'/);
  assert.doesNotMatch(script, /runPublicationPipeline|surfaceExceptionIfNeeded|execFileSync|--publish/);
});
test('merge requires an exact expected head and passes it to the GitHub atomic guard', () => {
  const sha = 'a'.repeat(40);
  assert.deepEqual(buildGhPrMergeArgs(10, sha), ['pr', 'merge', '10', '--merge', '--delete-branch', '--match-head-commit', sha]);
  for (const invalid of [undefined, '', 'main', 'abc']) assert.throws(() => buildGhPrMergeArgs(10, invalid), /exact expected PR head/);
});
