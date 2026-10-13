import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import path from 'node:path';
import { computePreparedArtifactDigest, validatePublicationManifestShape, isManifestForSameCandidate, advancePublicationManifest } from '../../functions/_lib/education-ops/education-publication-state.mjs';
import { verifyCandidateBundleIntegrity } from '../../functions/_lib/education-ops/education-candidate-bundle.mjs';
import { SCALP_HANDOFF } from './education-exact-candidate.mjs';

// A recovery of this one approved publication, not permission to adopt arbitrary
// edits, rebase commits, or another PR. Original files are read from Git objects.
export const SCALP_PR = Object.freeze({ number: 77, branch: 'education-ops/publish-scalp-microbiome',
  head: '32872ba547032a345d75f5e93d260c1c35ff77c2',
  files: ['education/scalp-health/scalp-microbiome.html', 'functions/_data/education-page-plans/scalp-microbiome.json',
    'education/scalp-health.html', 'sitemap.xml'] });
const repo = 'brandrice-dev/aimt-site';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (code) => { throw new Error(code); };
const sameFiles = (files) => files.length === 4 && new Set(files).size === 4 && SCALP_PR.files.every((f) => files.includes(f));

export async function verifyPrHeadReconciliation(manifest, bundle, proof, { verifyIntegrityFn = verifyCandidateBundleIntegrity } = {}) {
  if (!validatePublicationManifestShape(manifest).valid) fail('RECONCILIATION_INVALID_MANIFEST');
  const digest = await computePreparedArtifactDigest(bundle.prepared_artifact);
  if (!(await verifyIntegrityFn(bundle)).valid || bundle.topic_slug !== SCALP_HANDOFF.topic
    || bundle.generation_source_hash !== SCALP_HANDOFF.generation_source_hash
    || manifest.cluster !== bundle.cluster || manifest.candidate_originating_run_id !== bundle.originating_run_id
    || !isManifestForSameCandidate(manifest, { topicSlug: bundle.topic_slug, route: bundle.route,
      generationSourceHash: bundle.generation_source_hash, preparedArtifactDigest: digest }).matches) fail('RECONCILIATION_CANDIDATE_MISMATCH');
  const g = manifest.generated, pr = proof.pr;
  if (manifest.state !== 'PR_OPEN' || manifest.merge.merged || manifest.clearance.persisted
    || manifest.live_verification.passed || manifest.db_publish.attempted || manifest.db_publish.verified
    || manifest.deployment.state || manifest.merge.merge_commit_sha) fail('RECONCILIATION_REQUIRES_UNMERGED_PR_OPEN');
  if (g.pr_number !== SCALP_PR.number || g.branch !== SCALP_PR.branch || g.expected_head_sha !== SCALP_PR.head
    || g.pr_url !== `https://github.com/${repo}/pull/77`
    || !sameFiles([g.article_path, g.plan_artifact_path, g.hub_path, g.sitemap_path])
    || pr.number !== g.pr_number || pr.html_url !== g.pr_url || pr.state !== 'open' || pr.merged || pr.draft
    || pr.base?.ref !== 'main' || pr.base?.repo?.full_name !== repo
    || pr.head?.ref !== g.branch || pr.head?.repo?.full_name !== repo) fail('RECONCILIATION_PR_IDENTITY_MISMATCH');
  if (!/^[a-f0-9]{40}$/.test(proof.mainSha || '') || proof.mainSha !== proof.releaseHead
    || proof.checkoutHead !== proof.releaseHead || proof.newHead !== pr.head.sha
    || proof.newHead === SCALP_PR.head || !/^[a-f0-9]{40}$/.test(proof.newHead || '')
    || JSON.stringify(proof.parents) !== JSON.stringify([SCALP_PR.head, proof.mainSha])) fail('RECONCILIATION_NOT_EXACT_MAIN_MERGE');
  if (!sameFiles(proof.diffPaths) || !sameFiles(proof.originalDiffPaths)
    || !sameFiles(Object.keys(proof.originalFiles)) || !sameFiles(Object.keys(proof.newFiles))) fail('RECONCILIATION_DIFF_MISMATCH');
  const fileDigests = {};
  for (const file of SCALP_PR.files) {
    if (!Buffer.from(proof.originalFiles[file]).equals(Buffer.from(proof.newFiles[file]))) fail('RECONCILIATION_GENERATED_BYTES_CHANGED');
    fileDigests[file] = hash(proof.originalFiles[file]);
  }
  return { old_head_sha: SCALP_PR.head, new_head_sha: proof.newHead, main_sha: proof.mainSha,
    pr_number: g.pr_number, pr_url: g.pr_url, generation_source_hash: bundle.generation_source_hash,
    prepared_artifact_digest: digest, file_sha256: fileDigests };
}

// Called only after the exact owner-approved handoff's integrity, freshness and
// route prechecks. GitHub Actions serializes writers in aimt-education-publish.
// A second remote read and local byte comparison reject stale/concurrent state.
export async function reconcileScalpPrHead(root, env, bundle, overrides = {}) {
  const gh = (endpoint) => JSON.parse(execFileSync('gh', ['api', endpoint], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
  const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 });
  const file = path.join(root, 'research-import/education-ops/publications/scalp-microbiome/manifest.json');
  const io = {
    readManifest: () => readFileSync(file),
    verifyProof: verifyPrHeadReconciliation,
    readPr: () => gh(`repos/${repo}/pulls/77`),
    readMain: () => gh(`repos/${repo}/git/ref/heads/main`).object.sha,
    readLatestArtifact: () => {
      const pages = JSON.parse(execFileSync('gh', ['api', '--paginate', '--slurp', `repos/${repo}/actions/artifacts?name=education-publication-state&per_page=100`], { encoding: 'utf8' }));
      return pages.flatMap((p) => p.artifacts).filter((a) => !a.expired).sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)[0]?.id;
    },
    readProof: (pr) => {
      // Fetches objects only; never checks out, regenerates or pushes content.
      git('fetch', 'origin', 'main', SCALP_PR.branch);
      const head = pr.head.sha;
      const filesAt = (sha) => Object.fromEntries(SCALP_PR.files.map((f) => [f, git('show', `${sha}:${f}`)]));
      const paths = (...args) => git('diff', '--name-only', ...args).toString().trim().split('\n').filter(Boolean);
      return { pr, mainSha: io.readMain(), releaseHead: env.RELEASE_HEAD, checkoutHead: git('rev-parse', 'HEAD').toString().trim(),
        newHead: head, parents: git('show', '-s', '--format=%P', head).toString().trim().split(' '),
        diffPaths: paths(env.RELEASE_HEAD, head), originalDiffPaths: paths(`${SCALP_PR.head}^`, SCALP_PR.head),
        originalFiles: filesAt(SCALP_PR.head), newFiles: filesAt(head) };
    },
    persist: (next) => { const temp = `${file}.tmp`; writeFileSync(temp, JSON.stringify(next, null, 2)); renameSync(temp, file); },
    ...overrides,
  };
  const bytes = io.readManifest(), manifest = JSON.parse(bytes), pr = io.readPr();
  if (pr.head?.sha === manifest.generated?.expected_head_sha) return { reconciled: false };
  if (env.PUBLICATION_OPERATION !== 'publish' || env.APPROVE_PUBLICATION !== 'true'
    || env.GITHUB_EVENT_NAME !== 'workflow_dispatch' || env.GITHUB_REF !== 'refs/heads/main'
    || env.GITHUB_REPOSITORY !== repo || env.GITHUB_SHA !== env.RELEASE_HEAD
    || !/^[1-9][0-9]*$/.test(env.PUBLICATION_STATE_ARTIFACT_ID || '')) fail('RECONCILIATION_EXPLICIT_RELEASE_REQUIRED');
  const audit = await io.verifyProof(manifest, bundle, io.readProof(pr));
  const freshPr = io.readPr();
  if (!Buffer.from(bytes).equals(Buffer.from(io.readManifest()))
    || String(io.readLatestArtifact()) !== env.PUBLICATION_STATE_ARTIFACT_ID
    || io.readMain() !== env.RELEASE_HEAD || freshPr.head?.sha !== audit.new_head_sha
    || freshPr.state !== 'open' || freshPr.merged || freshPr.head?.ref !== SCALP_PR.branch
    || freshPr.head?.repo?.full_name !== repo || freshPr.base?.ref !== 'main'
    || freshPr.base?.repo?.full_name !== repo) fail('RECONCILIATION_STALE_OR_CONCURRENT_CHANGE');
  const at = new Date().toISOString();
  const next = advancePublicationManifest(manifest, { generated: { expected_head_sha: audit.new_head_sha }, updatedAt: at });
  next.head_reconciliations = [...(manifest.head_reconciliations || []), { ...audit,
    source_publication_artifact_id: env.PUBLICATION_STATE_ARTIFACT_ID, source_manifest_sha256: hash(bytes),
    candidate_artifact_id: SCALP_HANDOFF.artifact_id, candidate_source_run_id: SCALP_HANDOFF.run_id, workflow_run_id: env.GITHUB_RUN_ID, verified_at: at }];
  io.persist(next);
  return { reconciled: true, ...audit };
}
