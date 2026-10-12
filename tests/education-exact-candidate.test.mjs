import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyExactSource, SCALP_HANDOFF } from '../scripts/_lib/education-exact-candidate.mjs';
import { requireExplicitPublicationApproval, runExactCandidateHandoff } from '../scripts/education-exact-candidate-handoff.mjs';
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
  const env = { PUBLICATION_OPERATION: 'publish', APPROVE_PUBLICATION: 'true', RELEASE_HEAD: 'a'.repeat(40), GITHUB_SHA: 'a'.repeat(40), GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REF: 'refs/heads/main', GITHUB_REPOSITORY: 'brandrice-dev/aimt-site' };
  requireExplicitPublicationApproval(env);
  for (const changes of [{ PUBLICATION_OPERATION: 'verify' }, { APPROVE_PUBLICATION: 'false' }, { RELEASE_HEAD: 'b'.repeat(40) }, { RELEASE_HEAD: '' }, { GITHUB_REF: 'refs/heads/codex/test' }, { GITHUB_EVENT_NAME: 'workflow_run' }, { GITHUB_REPOSITORY: 'other/repo' }]) {
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

function handoffFixture(envChanges = {}, ioChanges = {}) {
  const env = Object.freeze({ PUBLICATION_OPERATION: 'publish', APPROVE_PUBLICATION: 'true',
    RELEASE_HEAD: 'a'.repeat(40), GITHUB_SHA: 'a'.repeat(40), GITHUB_REF: 'refs/heads/main',
    GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REPOSITORY: 'brandrice-dev/aimt-site',
    AIMT_EDUCATION_AUTOPUBLISH_ENABLED: 'false', TOPIC_INPUT: SCALP_HANDOFF.topic,
    SOURCE_RUN_ID: String(SCALP_HANDOFF.run_id), CANDIDATE_ARTIFACT_ID: String(SCALP_HANDOFF.artifact_id), ...envChanges });
  const calls = [], bundle = { topic_slug: SCALP_HANDOFF.topic, route: '/education/scalp-health/scalp-microbiome',
    generation_source_hash: SCALP_HANDOFF.generation_source_hash };
  const io = {
    restore: (args) => { const exact = source(); verifyExactSource(args, exact.artifact, exact.run); calls.push('source/digest'); return { directory: 'offline' }; },
    verifyCandidate: async () => { calls.push('integrity/reviewer'); return { bundle }; },
    fetchEvidence: async () => ({}), fetchPublished: async () => [],
    verifyFreshness: () => { calls.push('evidence'); return { ok: true }; },
    resolveSiblings: () => ({ ok: true, pages: [] }), countWeekly: async () => ({ count: 0 }),
    fetchRoute: async () => { calls.push('route'); return { status: 404 }; },
    checkoutHead: () => { calls.push('checkout'); return env.RELEASE_HEAD; },
    publish: async (localEnv, options) => { calls.push('publisher'); return { final_state: 'PUBLISHED', localEnv, options }; },
    writeReport: () => {}, ...ioChanges,
  };
  return { env, io, calls };
}
test('approved pinned handoff enables only its invocation after all validators while global autopublishing remains disabled', async () => {
  const f = handoffFixture();
  const result = await runExactCandidateHandoff(f.env, f.io);
  assert.equal(result.final_state, 'PUBLISHED');
  assert.deepEqual(f.calls, ['source/digest', 'integrity/reviewer', 'evidence', 'route', 'checkout', 'publisher']);
  assert.equal(result.localEnv.AIMT_EDUCATION_AUTOPUBLISH_ENABLED, 'true');
  assert.equal(f.env.AIMT_EDUCATION_AUTOPUBLISH_ENABLED, 'false');
  assert.notEqual(result.localEnv, f.env);
  assert.deepEqual(result.options, { topicSlug: SCALP_HANDOFF.topic });
});
test('verification and every failed release precheck refuse per-invocation publication authorization', async () => {
  const cases = [
    [{ PUBLICATION_OPERATION: 'verify' }, {}, false],
    [{ APPROVE_PUBLICATION: 'false' }, {}, true],
    [{ GITHUB_REF: 'refs/heads/codex/test' }, {}, true],
    [{ RELEASE_HEAD: 'b'.repeat(40) }, {}, true],
    [{ SOURCE_RUN_ID: '1' }, {}, true],
    [{ CANDIDATE_ARTIFACT_ID: '1' }, {}, true],
    [{ TOPIC_INPUT: 'trichology' }, {}, true],
    [{}, { restore: () => { throw new Error('ARTIFACT_ARCHIVE_DIGEST_MISMATCH'); } }, true],
    [{}, { verifyCandidate: () => { throw new Error('CANDIDATE_VALIDATION_FAILED'); } }, true],
    [{}, { verifyFreshness: () => ({ ok: false }) }, false],
    [{}, { resolveSiblings: () => ({ ok: false, pages: [] }) }, false],
    [{}, { resolveSiblings: () => ({ ok: true, pages: [{ route: '/education/scalp-health/scalp-microbiome' }] }) }, false],
    [{}, { fetchRoute: async () => ({ status: 200 }) }, false],
    [{}, { fetchRoute: async () => ({ status: 503 }) }, false],
    [{}, { countWeekly: async () => ({ count: 100 }) }, false],
    [{}, { checkoutHead: () => 'b'.repeat(40) }, true],
  ];
  for (const [envChanges, ioChanges, throws] of cases) {
    const f = handoffFixture(envChanges, ioChanges);
    if (throws) await assert.rejects(runExactCandidateHandoff(f.env, f.io));
    else {
      const result = await runExactCandidateHandoff(f.env, f.io);
      assert.equal(result.final_state, envChanges.PUBLICATION_OPERATION === 'verify' ? 'CANDIDATE_VERIFIED_FOR_OWNER_APPROVAL' : 'PUBLICATION_PRECHECK_FAILED');
    }
    assert.equal(f.calls.includes('publisher'), false);
    assert.equal(f.env.AIMT_EDUCATION_AUTOPUBLISH_ENABLED, 'false');
  }
});
