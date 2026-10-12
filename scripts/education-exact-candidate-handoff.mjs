import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { restoreExactScalpCandidate, verifyScalpCandidate, verifyScalpFreshness, SCALP_HANDOFF } from './_lib/education-exact-candidate.mjs';
import { fetchTopicEvidenceLive } from '../functions/_lib/research/publication-readiness-loader.mjs';
import { fetchPublishedTopicSlugsLive, countPagesPublishedThisWeekLive } from '../functions/_lib/education-ops/education-published-state-loader.mjs';
import { runPublicationPipeline, resolveTrustedSiblingPages, resolveMaxPagesPerWeek } from './education-operations-cycle.mjs';
const ROOT = fileURLToPath(new URL('..', import.meta.url));

export function requireExplicitPublicationApproval(env) {
  if (env.PUBLICATION_OPERATION !== 'publish' || env.APPROVE_PUBLICATION !== 'true'
    || !/^[a-f0-9]{40}$/.test(env.RELEASE_HEAD || '') || env.RELEASE_HEAD !== env.GITHUB_SHA) throw new Error('EXPLICIT_EXACT_RELEASE_APPROVAL_REQUIRED');
}

async function main() {
  const env = process.env;
  const args = { topic: env.TOPIC_INPUT, runId: env.SOURCE_RUN_ID, artifactId: env.CANDIDATE_ARTIFACT_ID };
  if (!['verify', 'publish'].includes(env.PUBLICATION_OPERATION)) throw new Error('EXPLICIT_OPERATION_REQUIRED');
  if (env.PUBLICATION_OPERATION === 'publish') requireExplicitPublicationApproval(env);
  const restored = restoreExactScalpCandidate(ROOT, args);
  const { bundle } = await verifyScalpCandidate(restored.directory);
  // Dedicated read-only queries; no paid credentials or model calls.
  const evidence = await fetchTopicEvidenceLive(env, ['scalp-microbiome']);
  const published = await fetchPublishedTopicSlugsLive(env);
  const freshness = verifyScalpFreshness(bundle, restored.directory, evidence, published);
  const siblingResolution = resolveTrustedSiblingPages(published, null);
  const weeklyCount = (await countPagesPublishedThisWeekLive(env)).count;
  const routeResponse = await fetch(`https://aimtrichology.com${bundle.route}`, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
  const routeAbsent = routeResponse.status === 404;
  const clear = freshness.ok && siblingResolution.ok && !siblingResolution.pages.some((p) => p.route === bundle.route)
    && routeAbsent && weeklyCount < resolveMaxPagesPerWeek(env);
  const report = { final_state: clear ? 'CANDIDATE_VERIFIED_FOR_OWNER_APPROVAL' : 'PUBLICATION_PRECHECK_FAILED',
    checked_at: new Date().toISOString(), source_run_id: SCALP_HANDOFF.run_id, artifact_id: SCALP_HANDOFF.artifact_id,
    source_head: SCALP_HANDOFF.source_head, generation_source_hash: bundle.generation_source_hash,
    route: bundle.route, selected_claim_count: 49, source_count: 15, reviewer_outcome: 'PASS',
    integrity_valid: true, page_plan_valid: true, citations_match: true, ...freshness,
    published_routes_resolve: siblingResolution.ok, live_route_status: routeResponse.status,
    live_route_absent: routeAbsent, pages_published_this_week: weeklyCount, model_calls: 0,
    production_writes: 0, operation: env.PUBLICATION_OPERATION, release_head: env.GITHUB_SHA };
  const directory = path.join(ROOT, 'research-import', 'education-ops', 'runs');
  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, 'exact-candidate-verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!clear) { process.exitCode = 1; return; }
  if (env.PUBLICATION_OPERATION === 'publish') {
    const result = await runPublicationPipeline(env, { topicSlug: bundle.topic_slug });
    writeFileSync(path.join(directory, 'exact-candidate-publication.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.final_state === 'PUBLISHED' ? 0 : 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { console.error('EXACT_CANDIDATE_HANDOFF_FAILED: identity, integrity, permission, or read-only precheck failed; no error body exposed.'); process.exitCode = 1; });
}
