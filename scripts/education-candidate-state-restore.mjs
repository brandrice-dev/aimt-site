import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import path from 'node:path';
const e=process.env, repo=`repos/${e.GITHUB_REPOSITORY}`;
const gh=(...args)=>execFileSync('gh',args,{maxBuffer:32*1024*1024});
const name=e.DIAGNOSTIC==='true'?'education-candidate-bundles-diagnostic':'education-candidate-bundles';
const pages=JSON.parse(gh('api','--paginate','--slurp',`${repo}/actions/artifacts?name=${name}&per_page=100`));
const artifact=pages.flatMap(p=>p.artifacts).filter(a=>!a.expired).sort((a,b)=>b.id-a.id)[0];
if(e.SOURCE_RUN_ID && String(artifact?.workflow_run.id)!==e.SOURCE_RUN_ID)throw new Error('STALE_CONTINUATION_SOURCE_REJECTED');
if(artifact){
 const run=JSON.parse(gh('api',`${repo}/actions/runs/${artifact.workflow_run.id}`));
 if(run.repository?.full_name!==e.GITHUB_REPOSITORY || run.path!=='.github/workflows/aimt-education-operations.yml'
   || run.status!=='completed' || (e.DIAGNOSTIC!=='true' && run.head_branch!=='main'))throw new Error('UNTRUSTED_CANDIDATE_STATE_SOURCE');
 const bytes=gh('api',`${repo}/actions/artifacts/${artifact.id}/zip`);
 if(artifact.digest!==`sha256:${createHash('sha256').update(bytes).digest('hex')}`)throw new Error('CANDIDATE_ARCHIVE_DIGEST_MISMATCH');
 const root='research-import/education-ops/candidates';mkdirSync(root,{recursive:true});const zip='research-import/education-ops/candidates.zip';writeFileSync(zip,bytes);
 execFileSync('python3',['-c',`import zipfile,pathlib,re,sys,stat,json
with zipfile.ZipFile(sys.argv[1]) as z:
 names=z.namelist();assert len(names)==len(set(names))
 for i in z.infolist():
  assert re.fullmatch(r'(?:[a-z0-9]+(?:-[a-z0-9]+)*/(?:candidate|attempts|intent)\\.json|continuation\\.json)',i.filename)
  assert not stat.S_ISLNK(i.external_attr>>16)
  json.loads(z.read(i))
 for n in names:
  p=pathlib.Path(sys.argv[2])/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(n))`,zip,root]);
 appendFileSync(e.GITHUB_ENV,`CANDIDATE_STATE_ARTIFACT_ID=${artifact.id}\n`);
}
appendFileSync(e.GITHUB_OUTPUT,'restored=true\n');
