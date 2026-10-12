import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Restore the entire durable state, including other topics and completed history.
// Download by artifact ID rather than whichever same-name artifact a run returns.
export function restorePublicationState(root, env, { gh = (...args) => execFileSync('gh', args, { maxBuffer: 16 * 1024 * 1024 }) } = {}) {
  const repo = `repos/${env.GITHUB_REPOSITORY}`;
  const pages = JSON.parse(gh('api', '--paginate', '--slurp', `${repo}/actions/artifacts?name=education-publication-state&per_page=100`));
  const artifact = pages.flatMap((p) => p.artifacts).filter((a) => !a.expired).sort((a, b) => b.id - a.id)[0];
  const directory = path.join(root, 'research-import/education-ops/publications');
  mkdirSync(directory, { recursive: true });
  if (!artifact) {
    if (env.TOPIC_INPUT === 'scalp-microbiome') throw new Error('EXISTING_PUBLICATION_STATE_REQUIRED');
    return null;
  }
  const run = JSON.parse(gh('api', `${repo}/actions/runs/${artifact.workflow_run.id}`));
  // State may legitimately come from a failed release after persisting a stage.
  if (artifact.name !== 'education-publication-state' || run.status !== 'completed'
    || run.path !== '.github/workflows/aimt-education-publish.yml'
    || run.repository?.full_name !== env.GITHUB_REPOSITORY) throw new Error('UNTRUSTED_PUBLICATION_STATE_SOURCE');
  const archive = gh('api', `${repo}/actions/artifacts/${artifact.id}/zip`);
  if (artifact.digest !== `sha256:${createHash('sha256').update(archive).digest('hex')}`) throw new Error('PUBLICATION_STATE_ARCHIVE_DIGEST_MISMATCH');
  const zip = path.join(root, 'research-import/education-ops/publication-state.zip');
  writeFileSync(zip, archive);
  execFileSync('python3', ['-c', `import zipfile,pathlib,sys,re,json,stat
root=pathlib.Path(sys.argv[2])
with zipfile.ZipFile(sys.argv[1]) as z:
 names=z.namelist()
 assert names and len(names)==len(set(names))
 for item in z.infolist():
  assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*/manifest\\.json',item.filename)
  assert not stat.S_ISLNK(item.external_attr>>16)
  manifest=json.loads(z.read(item))
  assert manifest['topic_slug']==item.filename.split('/')[0]
 for name in names:
  dest=root/name
  dest.parent.mkdir(parents=True,exist_ok=True)
  dest.write_bytes(z.read(name))`, zip, directory]);
  return artifact.id;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const artifactId = restorePublicationState(fileURLToPath(new URL('..', import.meta.url)), process.env);
  if (artifactId) appendFileSync(process.env.GITHUB_ENV, `PUBLICATION_STATE_ARTIFACT_ID=${artifactId}\n`);
  appendFileSync(process.env.GITHUB_OUTPUT, 'restored=true\n');
}
