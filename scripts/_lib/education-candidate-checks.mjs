import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
export const PUBLICATION_TEST_WORKFLOW = '.github/workflows/aimt-education-validation.yml';
export const PUBLICATION_TEST_JOB = 'Publication candidate tests';

export function verifyCandidateHeadTests(run, jobs, { repo, headSha, prNumber }, proof = null) {
  const violations = [];
  const prEvent = run?.event === 'pull_request' && run.head_sha === headSha
    && run.pull_requests?.some((p) => p.number === prNumber && p.head?.sha === headSha);
  const dispatch = run?.event === 'workflow_dispatch' && run.head_branch === 'main'
    && proof?.version === 'education-head-tests-v1' && proof.repository === repo && proof.pr_number === prNumber
    && proof.head_sha === headSha && proof.run_id === run.id && proof.workflow_source_sha === run.head_sha
    && proof.workflow_ref === `${repo}/${PUBLICATION_TEST_WORKFLOW}@refs/heads/main`;
  if (!run || run.path !== PUBLICATION_TEST_WORKFLOW || run.repository?.full_name !== repo
    || run.head_repository?.full_name !== repo || !(prEvent || dispatch)) violations.push('UNTRUSTED_OR_STALE_TEST_RUN');
  if (run?.status !== 'completed' || run?.conclusion !== 'success') violations.push('CANDIDATE_TEST_RUN_NOT_SUCCESSFUL');
  const matching = (jobs || []).filter((j) => j.name === PUBLICATION_TEST_JOB && j.run_id === run?.id);
  if (matching.length !== 1 || matching[0].status !== 'completed' || matching[0].conclusion !== 'success') violations.push('CANDIDATE_TEST_JOB_NOT_SUCCESSFUL');
  return { ok: violations.length === 0, violations, run_id: run?.id || null };
}

export function readCandidateHeadTests({ repo, headSha, prNumber, dispatchRunId }) {
  const gh = (args) => JSON.parse(execFileSync('gh', args, { encoding: 'utf8' }));
  const listed = gh(['run', 'list', '--repo', repo, '--workflow', 'aimt-education-validation.yml', '--commit', headSha,
    '--event', 'pull_request', '--limit', '20', '--json', 'databaseId,createdAt']);
  listed.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.databaseId - a.databaseId);
  if (!listed.length) {
    const artifacts = gh(['api', '--paginate', '--slurp', `repos/${repo}/actions/artifacts?name=education-head-tests-${prNumber}-${headSha}&per_page=100`]);
    const artifact = artifacts.flatMap(p=>p.artifacts).filter(a=>!a.expired).sort((a,b)=>b.id-a.id)[0];
    if (!artifact) {
      if (dispatchRunId) {
        const pending=gh(['api',`repos/${repo}/actions/runs/${dispatchRunId}`]);
        if (pending.status === 'action_required') return {ok:false,violations:['GITHUB_WORKFLOW_APPROVAL_REQUIRED'],run_url:pending.html_url};
        if (pending.status === 'completed' && pending.conclusion !== 'success') return {ok:false,violations:['CANDIDATE_TEST_RUN_NOT_SUCCESSFUL'],run_url:pending.html_url};
      }
      return { ok: false, violations: ['CANDIDATE_HEAD_TESTS_MISSING'] };
    }
    const run = gh(['api', `repos/${repo}/actions/runs/${artifact.workflow_run.id}`]);
    const archive = execFileSync('gh',['api',`repos/${repo}/actions/artifacts/${artifact.id}/zip`]);
    if (artifact.digest !== `sha256:${createHash('sha256').update(archive).digest('hex')}`) return {ok:false,violations:['UNTRUSTED_OR_STALE_TEST_RUN']};
    const proof = JSON.parse(execFileSync('python3',['-c', "import zipfile,sys,io;z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()));assert z.namelist()==['candidate-head.json'];sys.stdout.buffer.write(z.read('candidate-head.json'))"],{input:archive,encoding:'utf8'}));
    const pr = gh(['api',`repos/${repo}/pulls/${prNumber}`]);
    if (pr.state !== 'open' || pr.head?.sha !== headSha || pr.head?.repo?.full_name !== repo || pr.base?.ref !== 'main') return {ok:false,violations:['UNTRUSTED_OR_STALE_TEST_RUN']};
    const jobs=gh(['api',`repos/${repo}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`]);
    return verifyCandidateHeadTests(run,jobs.jobs,{repo,headSha,prNumber},proof);
  }
  const run = gh(['api', `repos/${repo}/actions/runs/${listed[0].databaseId}`]);
  if (run.status === 'action_required') return {ok:false,violations:['GITHUB_WORKFLOW_APPROVAL_REQUIRED'],run_url:run.html_url};
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
    if (result.violations.includes('GITHUB_WORKFLOW_APPROVAL_REQUIRED') || result.violations.includes('UNTRUSTED_OR_STALE_TEST_RUN') || nowFn() - started >= timeoutMs) return result;
    await sleepFn(intervalMs);
  }
}

export async function ensureCandidateHeadTests(args, overrides = {}) {
  const read = overrides.readFn || readCandidateHeadTests;
  const first = read(args);
  if (first.ok || first.violations.includes('GITHUB_WORKFLOW_APPROVAL_REQUIRED')) return first;
  args = {...args};
  if (first.violations.includes('CANDIDATE_HEAD_TESTS_MISSING') && !args.dispatchRequested) {
    args.recordDispatch?.({requested:true}); // reserve before dispatch, never duplicate an ambiguous request
    const dispatch = overrides.dispatchFn || ((a) => {
      const response=JSON.parse(execFileSync('gh',['api','--method','POST',`repos/${a.repo}/actions/workflows/aimt-education-validation.yml/dispatches`,'--input','-'],
        {input:JSON.stringify({ref:'main',return_run_details:true,inputs:{candidate_pr:String(a.prNumber),candidate_head:a.headSha}}),encoding:'utf8'}));
      if (!Number.isSafeInteger(response.workflow_run_id)) throw new Error('CI_DISPATCH_RUN_ID_REQUIRED');
      return response.workflow_run_id;
    });
    const id=dispatch(args); args.dispatchRequested=true;
    if(id){args.dispatchRunId=id;args.recordDispatch?.({requested:true,runId:id});}
  }
  return waitForCandidateHeadTests(args, {...overrides, readFn:read});
}
