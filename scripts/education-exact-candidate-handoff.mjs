import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { restoreExactScalpCandidate, verifyScalpCandidate, verifyScalpFreshness, SCALP_HANDOFF } from './_lib/education-exact-candidate.mjs';
import { fetchTopicEvidenceLive } from '../functions/_lib/research/publication-readiness-loader.mjs';
import { fetchPublishedTopicSlugsLive, countPagesPublishedThisWeekLive } from '../functions/_lib/education-ops/education-published-state-loader.mjs';
import { runPublicationPipeline, resolveTrustedSiblingPages, resolveMaxPagesPerWeek, AUTOPUBLISH_ENV_VAR } from './education-operations-cycle.mjs';
const ROOT = fileURLToPath(new URL('..', import.meta.url));

export function requireExplicitPublicationApproval(env) {
  if (env.PUBLICATION_OPERATION !== 'publish' || env.APPROVE_PUBLICATION !== 'true'
    || env.GITHUB_EVENT_NAME !== 'workflow_dispatch' || env.GITHUB_REF !== 'refs/heads/main'
    || env.GITHUB_REPOSITORY !== 'brandrice-dev/aimt-site'
    || !/^[a-f0-9]{40}$/.test(env.RELEASE_HEAD || '') || env.RELEASE_HEAD !== env.GITHUB_SHA) throw new Error('EXPLICIT_EXACT_RELEASE_APPROVAL_REQUIRED');
}

// Dependencies are injectable for offline tests; the CLI always uses these real
// validators and I/O. Authorization is local to the final publisher invocation.
export async function runExactCandidateHandoff(env, overrides = {}) {
  const io = {
    restore: (args) => restoreExactScalpCandidate(ROOT, args),
    verifyCandidate: verifyScalpCandidate,
    fetchEvidence: fetchTopicEvidenceLive,
    fetchPublished: fetchPublishedTopicSlugsLive,
    verifyFreshness: verifyScalpFreshness,
    resolveSiblings: resolveTrustedSiblingPages,
    countWeekly: countPagesPublishedThisWeekLive,
    fetchRoute: fetch,
    checkoutHead: () => execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(),
    publish: runPublicationPipeline,
    writeReport: (name, report) => {
      const directory = path.join(ROOT, 'research-import', 'education-ops', 'runs');
      mkdirSync(directory, { recursive: true });
      writeFileSync(path.join(directory, name), JSON.stringify(report, null, 2));
      console.log(JSON.stringify(report, null, 2));
    },
    ...overrides,
  };
  const args = { topic: env.TOPIC_INPUT, runId: env.SOURCE_RUN_ID, artifactId: env.CANDIDATE_ARTIFACT_ID };
  if (!['verify', 'publish'].includes(env.PUBLICATION_OPERATION)) throw new Error('EXPLICIT_OPERATION_REQUIRED');
  if (env.PUBLICATION_OPERATION === 'publish') requireExplicitPublicationApproval(env);
  const restored = await io.restore(args);
  const { bundle } = await io.verifyCandidate(restored.directory);
  // Dedicated read-only queries; no paid credentials or model calls.
  const evidence = await io.fetchEvidence(env, ['scalp-microbiome']);
  const published = await io.fetchPublished(env);
  const freshness = io.verifyFreshness(bundle, restored.directory, evidence, published);
  const siblingResolution = io.resolveSiblings(published, null);
  const weeklyCount = (await io.countWeekly(env)).count;
  const routeResponse = await io.fetchRoute(`https://aimtrichology.com${bundle.route}`, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
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
  io.writeReport('exact-candidate-verification.json', report);
  if (!clear) return report;
  if (env.PUBLICATION_OPERATION === 'publish') {
    // All exact-source/digest, candidate, evidence and route validators above
    // must pass before granting this one invocation. Never mutate process.env
    // or the repository variable; scheduled publication retains its own gate.
    requireExplicitPublicationApproval(env);
    if (io.checkoutHead() !== env.RELEASE_HEAD) throw new Error('EXACT_RELEASE_CHECKOUT_MISMATCH');
    const result = await io.publish({ ...env, [AUTOPUBLISH_ENV_VAR]: 'true' }, { topicSlug: bundle.topic_slug });
    io.writeReport('exact-candidate-publication.json', result);
    return result;
  }
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runExactCandidateHandoff(process.env).then((result) => {
    process.exitCode = ['PUBLISHED', 'CANDIDATE_VERIFIED_FOR_OWNER_APPROVAL'].includes(result.final_state) ? 0 : 1;
  }).catch(() => { console.error('EXACT_CANDIDATE_HANDOFF_FAILED: identity, integrity, permission, or read-only precheck failed; no error body exposed.'); process.exitCode = 1; });
}
