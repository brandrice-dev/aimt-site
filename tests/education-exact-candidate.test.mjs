import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyExactSource, SCALP_HANDOFF } from '../scripts/_lib/education-exact-candidate.mjs';
import { requireExplicitPublicationApproval } from '../scripts/education-exact-candidate-handoff.mjs';
import { verifyCandidateHeadTests, waitForCandidateHeadTests, PUBLICATION_TEST_WORKFLOW, PUBLICATION_TEST_JOB } from '../scripts/_lib/education-candidate-checks.mjs';

function source() {
  const h = SCALP_HANDOFF;
  return { args: { topic: h.topic, runId: h.run_id, artifactId: h.artifact_id },
    artifact: { id: h.artifact_id, expired: false, name: h.artifact_name, digest: `sha256:${h.archive_sha256}`,
      workflow_run: { id: h.run_id, head_sha: h.source_head, repository_id: 1215962458 } },
    run: { id: h.run_id, head_sha: h.source_head, status: 'completed', conclusion: 'success', event: 'workflow_dispatch',
      path: '.github/workflows/aimt-education-operations.yml', repository: { full_name: 'brandrice-dev/aimt-site' } } };
}
test('handoff accepts only the exact approved run/artifact/head/digest and rejects newest-artifact substitution', () => {
  const good = source();
  assert.equal(verifyExactSource(good.args, good.artifact, good.run), true);
  for (const mutate of [
    (x) => { x.args.artifactId++; }, (x) => { x.artifact.id++; },
    (x) => { x.artifact.expired = true; }, (x) => { x.artifact.digest = 'changed'; },
    (x) => { x.artifact.workflow_run.head_sha = 'a'.repeat(40); },
    (x) => { x.run.conclusion = 'failure'; }, (x) => { x.run.repository.full_name = 'other/repo'; },
  ]) { const x = source(); mutate(x); assert.throws(() => verifyExactSource(x.args, x.artifact, x.run)); }
});
test('publication cannot run on verification, absent approval, or a different release head', () => {
  const env = { PUBLICATION_OPERATION: 'publish', APPROVE_PUBLICATION: 'true', RELEASE_HEAD: 'a'.repeat(40), GITHUB_SHA: 'a'.repeat(40) };
  requireExplicitPublicationApproval(env);
  for (const changes of [{ PUBLICATION_OPERATION: 'verify' }, { APPROVE_PUBLICATION: 'false' }, { RELEASE_HEAD: 'b'.repeat(40) }, { RELEASE_HEAD: '' }]) {
    assert.throws(() => requireExplicitPublicationApproval({ ...env, ...changes }));
  }
});
test('only a successful trusted workflow and job on this PR exact head authorize merge', () => {
  const expected = { repo: 'brandrice-dev/aimt-site', headSha: 'a'.repeat(40), prNumber: 76 };
  const run = { id: 100, path: PUBLICATION_TEST_WORKFLOW, head_sha: expected.headSha, event: 'pull_request',
    repository: { full_name: expected.repo }, head_repository: { full_name: expected.repo },
    pull_requests: [{ number: 76, head: { sha: expected.headSha } }], status: 'completed', conclusion: 'success' };
  const jobs = [{ name: PUBLICATION_TEST_JOB, run_id: 100, status: 'completed', conclusion: 'success' }];
  assert.equal(verifyCandidateHeadTests(run, jobs, expected).ok, true);
  for (const changes of [{ head_sha: 'b'.repeat(40) }, { event: 'push' }, { path: 'untrusted.yml' },
    { conclusion: 'failure' }, { status: 'in_progress' }, { pull_requests: [] }]) {
    assert.equal(verifyCandidateHeadTests({ ...run, ...changes }, jobs, expected).ok, false);
  }
  assert.equal(verifyCandidateHeadTests(run, [{ ...jobs[0], conclusion: 'skipped' }], expected).ok, false);
  assert.equal(verifyCandidateHeadTests(run, [{ ...jobs[0], run_id: 101 }], expected).ok, false);
});
test('verification workflow supplies no model credentials and requires explicit approval for production', () => {
  const workflow = readFileSync('.github/workflows/aimt-education-publish.yml', 'utf8');
  const exactStep = workflow.split('name: Verify or publish the exact owner-selected Scalp Microbiome artifact')[1].split('name: Upload run report')[0];
  assert.doesNotMatch(exactStep, /ANTHROPIC|API_KEY/);
  assert.match(workflow, /default: verify/);
  assert.match(workflow, /test "\$GITHUB_REF_NAME" = "main"/);
  assert.match(workflow, /test "\$RELEASE_HEAD" = "\$GITHUB_SHA"/);
  const ci = readFileSync('.github/workflows/aimt-education-validation.yml', 'utf8');
  assert.match(ci, /ref: \$\{\{ github.event.pull_request.head.sha \}\}/);
  assert.match(ci, /contents: read/);
  assert.match(ci, /env -i/);
  assert.doesNotMatch(ci, /secrets\.|contents: write|pull_request_target|workflow_dispatch/);
});

 test('candidate test wait is bounded and never dispatches or accepts stale-head checks', async () => {
  let now = 0, reads = 0;
  const missing = await waitForCandidateHeadTests({}, { readFn: () => { reads++; return { ok: false, violations: ['CANDIDATE_HEAD_TESTS_MISSING'] }; }, nowFn: () => now, sleepFn: async (ms) => { now += ms; }, timeoutMs: 20, intervalMs: 10 });
  assert.equal(missing.ok, false); assert.equal(reads, 3);
  const stale = await waitForCandidateHeadTests({}, { readFn: () => ({ ok: false, violations: ['UNTRUSTED_OR_STALE_TEST_RUN'] }), sleepFn: async () => { throw new Error('must not wait'); } });
  assert.equal(stale.ok, false);
});
