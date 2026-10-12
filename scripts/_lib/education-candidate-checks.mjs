import { execFileSync } from 'node:child_process';
export const PUBLICATION_TEST_WORKFLOW = '.github/workflows/aimt-education-validation.yml';
export const PUBLICATION_TEST_JOB = 'Publication candidate tests';

export function verifyCandidateHeadTests(run, jobs, { repo, headSha, prNumber }) {
  const violations = [];
  if (!run || run.path !== PUBLICATION_TEST_WORKFLOW || run.head_sha !== headSha
    || run.event !== 'pull_request' || run.repository?.full_name !== repo
    || run.head_repository?.full_name !== repo || !run.pull_requests?.some((p) => p.number === prNumber && p.head?.sha === headSha)) violations.push('UNTRUSTED_OR_STALE_TEST_RUN');
  if (run?.status !== 'completed' || run?.conclusion !== 'success') violations.push('CANDIDATE_TEST_RUN_NOT_SUCCESSFUL');
  const matching = (jobs || []).filter((j) => j.name === PUBLICATION_TEST_JOB && j.run_id === run?.id);
  if (matching.length !== 1 || matching[0].status !== 'completed' || matching[0].conclusion !== 'success') violations.push('CANDIDATE_TEST_JOB_NOT_SUCCESSFUL');
  return { ok: violations.length === 0, violations, run_id: run?.id || null };
}

export function readCandidateHeadTests({ repo, headSha, prNumber }) {
  const gh = (args) => JSON.parse(execFileSync('gh', args, { encoding: 'utf8' }));
  const listed = gh(['run', 'list', '--repo', repo, '--workflow', 'aimt-education-validation.yml', '--commit', headSha,
    '--event', 'pull_request', '--limit', '20', '--json', 'databaseId,createdAt']);
  listed.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.databaseId - a.databaseId);
  if (!listed.length) return { ok: false, violations: ['CANDIDATE_HEAD_TESTS_MISSING'] };
  const run = gh(['api', `repos/${repo}/actions/runs/${listed[0].databaseId}`]);
  const jobs = gh(['api', `repos/${repo}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`]);
  return verifyCandidateHeadTests(run, jobs.jobs, { repo, headSha, prNumber });
}

export async function waitForCandidateHeadTests(args, { readFn = readCandidateHeadTests,
  nowFn = Date.now, sleepFn = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  timeoutMs = 180000, intervalMs = 10000 } = {}) {
  const started = nowFn();
  while (true) {
    const result = readFn(args);
    if (result.ok) return result;
    // Missing/queued tests may arrive shortly after bot PR creation.
    // Wrong provenance or stale identity are never allowed to wait through.
    if (result.violations.includes('UNTRUSTED_OR_STALE_TEST_RUN') || nowFn() - started >= timeoutMs) return result;
    await sleepFn(intervalMs);
  }
}
