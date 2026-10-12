import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { verifyCandidateBundleIntegrity, determineResumeStage, resolveCandidateResumeFreshness } from '../../functions/_lib/education-ops/education-candidate-bundle.mjs';
import { validateEducationPagePlan } from '../../functions/_lib/education-ops/education-page-plan-validator.mjs';
import { buildTrustedSources } from '../../functions/_lib/education-ops/education-source-authority.mjs';
import { getPublicationConcept, publicationRouteFor } from '../../functions/_lib/education-ops/education-publication-registry.mjs';
import { assessTopicReadiness } from '../../functions/_lib/research/publication-readiness.mjs';
import { topicAttemptFingerprint } from './education-topic-attempts.mjs';

export const SCALP_HANDOFF = Object.freeze({
  topic: 'scalp-microbiome', run_id: 38265572713, artifact_id: 11754847436,
  source_head: '64075183783f4f910d63b6d489acdbb9ee75d512',
  artifact_name: 'education-candidate-bundles-diagnostic',
  archive_sha256: '4aedc88a2c88b39a802278d72567fd3d2be2b7ef2787441e27f9af3117815409',
  candidate_sha256: 'c5a8dbb459e531e8da99c98fc69907aed827b3aab552082619180709f648356e',
  generation_source_hash: '3ab7319f8c91ec471e59929037ddbcbac16d4862763324e1c4ef2bb0ca23597a',
});
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

export function verifyExactSource({ topic, runId, artifactId }, artifact, run) {
  const h = SCALP_HANDOFF;
  if (topic !== h.topic || Number(runId) !== h.run_id || Number(artifactId) !== h.artifact_id
    || artifact.id !== h.artifact_id || artifact.expired || artifact.name !== h.artifact_name
    || artifact.digest !== `sha256:${h.archive_sha256}`
    || artifact.workflow_run?.id !== h.run_id || artifact.workflow_run?.head_sha !== h.source_head
    || artifact.workflow_run?.repository_id !== 1215962458
    || run.id !== h.run_id || run.head_sha !== h.source_head || run.status !== 'completed'
    || run.conclusion !== 'success' || run.event !== 'workflow_dispatch'
    || run.path !== '.github/workflows/aimt-education-operations.yml'
    || run.repository?.full_name !== 'brandrice-dev/aimt-site') throw new Error('EXACT_CANDIDATE_SOURCE_MISMATCH');
  return true;
}

export function restoreExactScalpCandidate(root, args, { gh = (...argv) => execFileSync('gh', argv, { maxBuffer: 16 * 1024 * 1024 }) } = {}) {
  const repo = 'repos/brandrice-dev/aimt-site';
  const artifact = JSON.parse(gh('api', `${repo}/actions/artifacts/${SCALP_HANDOFF.artifact_id}`).toString());
  const run = JSON.parse(gh('api', `${repo}/actions/runs/${SCALP_HANDOFF.run_id}`).toString());
  verifyExactSource(args, artifact, run);
  const archive = gh('api', `${repo}/actions/artifacts/${SCALP_HANDOFF.artifact_id}/zip`);
  if (hash(archive) !== SCALP_HANDOFF.archive_sha256) throw new Error('ARTIFACT_ARCHIVE_DIGEST_MISMATCH');
  const local = path.join(root, 'research-import', 'education-ops', 'candidates');
  mkdirSync(local, { recursive: true });
  const zipPath = path.join(local, 'exact-scalp-candidate.zip');
  writeFileSync(zipPath, archive);
  // Extract only the three known files. No traversal, symlinks, extra topics,
  // or ZIP-supplied destination paths can enter the publication checkout.
  execFileSync('python3', ['-c', `import zipfile,pathlib,sys
root=pathlib.Path(sys.argv[2])
with zipfile.ZipFile(sys.argv[1]) as z:
 expected={'scalp-microbiome/candidate.json','scalp-microbiome/attempts.json','scalp-microbiome/intent.json'}
 assert set(z.namelist())==expected and len(z.namelist())==3
 for name in expected:
  dest=root/name
  dest.parent.mkdir(parents=True,exist_ok=True)
  dest.write_bytes(z.read(name))`, zipPath, local]);
  const directory = path.join(local, SCALP_HANDOFF.topic);
  return { directory, artifactId: artifact.id, runId: run.id };
}

export async function verifyScalpCandidate(directory) {
  const bytes = readFileSync(path.join(directory, 'candidate.json'));
  if (hash(bytes) !== SCALP_HANDOFF.candidate_sha256) throw new Error('CANDIDATE_BYTES_CHANGED');
  const bundle = JSON.parse(bytes);
  const integrity = await verifyCandidateBundleIntegrity(bundle);
  const planValidation = validateEducationPagePlan(bundle.page_plan, bundle.fingerprint_input, {
    expectedTopicSlug: SCALP_HANDOFF.topic, expectedCluster: 'scalp-health', expectedRoute: publicationRouteFor(SCALP_HANDOFF.topic),
  });
  if (!integrity.valid || !planValidation.valid || bundle.generation_source_hash !== SCALP_HANDOFF.generation_source_hash
    || bundle.selected_claim_ids.length !== 49 || new Set(bundle.selected_claim_ids).size !== 49
    || bundle.source_ids.length !== 15 || new Set(bundle.source_ids).size !== 15
    || JSON.stringify(bundle.page_plan.sources) !== JSON.stringify(buildTrustedSources(bundle.fingerprint_input))
    || determineResumeStage(bundle) !== 'READY_FOR_PREPARE' || bundle.review_result?.outcome !== 'PASS'
    || bundle.review_result.voice_fail || bundle.review_result.scope_fail
    || bundle.review_result.failing_paraphrases.length || bundle.review_result.failing_framings.length) throw new Error('CANDIDATE_VALIDATION_FAILED');
  return { bundle, integrity, planValidation };
}

export function verifyScalpFreshness(bundle, directory, evidence, publishedSlugs) {
  const concept = getPublicationConcept(SCALP_HANDOFF.topic);
  const readiness = assessTopicReadiness({ topic_slug: concept.topic_slug,
    seo_page_concept: concept.seo_page_concept, controlled_topics: concept.controlled_topics, ...evidence });
  const freshness = resolveCandidateResumeFreshness(bundle, readiness.candidate_claim_ids);
  const original = JSON.parse(readFileSync(path.join(directory, 'attempts.json')));
  const exactEvidenceUnchanged = topicAttemptFingerprint(concept, evidence) === original.fingerprint;
  const unpublished = !publishedSlugs.includes(SCALP_HANDOFF.topic);
  return { ok: freshness.state === 'FRESH' && exactEvidenceUnchanged && unpublished
    && ['READY', 'NEEDS_SYNTHESIS'].includes(readiness.readiness_status) && readiness.evidence_gaps.length === 0,
    freshness_state: freshness.state, exact_evidence_unchanged: exactEvidenceUnchanged,
    route_unpublished_in_database: unpublished, current_candidate_claim_count: readiness.candidate_claim_ids.length,
    readiness_status: readiness.readiness_status };
}
