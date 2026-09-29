/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — production publish-lane verification
   ---------------------------------------------------------------
   PURE. Zero I/O, zero network, zero model calls. Every function here
   takes ALREADY-FETCHED data (a live HTTP response's status/body, a `gh
   pr view` result, a Supabase row, etc.) and returns a deterministic
   {ok, violations} verdict. The orchestrator (scripts/education-
   operations-cycle.mjs#runPublicationPipeline) owns every actual read;
   this module never decides what to fetch, only what a fetched result
   means -- the same PURE/I/O split every other education-ops module in
   this codebase uses.
   ═══════════════════════════════════════════════════════════════ */

import { checkGeneratedDiffAllowlist } from './education-diff-allowlist.mjs';
import { RESUME_STAGE } from './education-candidate-bundle.mjs';
import { FRESHNESS_STATE } from './education-freshness-monitor.mjs';
import { GENERATION_MARKER_META_NAME } from './education-page-renderer.mjs';
import { sitemapContainsRoute } from './education-sitemap-updater.mjs';
import { hubContainsRoute } from './education-hub-updater.mjs';

const SITE_ORIGIN = 'https://aimtrichology.com';

/**
 * Step 2 of the required order: is this durable candidate actually
 * eligible to be published RIGHT NOW? Every check the caller already
 * computed (integrity, resume stage, freshness, route/week state) is
 * passed in as a plain value -- this function only aggregates them into
 * one deterministic verdict, so the SAME logic backs both a real run and
 * a test that never touches Supabase/the filesystem.
 *
 * @param {{
 *   integrityValid: boolean, integrityViolations?: string[],
 *   resumeStage: string, freshnessState: string,
 *   bundleTopicSlug: string, expectedTopicSlug: string,
 *   bundleRoute: string, expectedRoute: string,
 *   routeAlreadyPublished: boolean, withinWeeklyCap: boolean,
 * }} input
 * @returns {{ok: boolean, violations: string[]}}
 */
export function checkCandidateReadyForPublication({
  integrityValid, integrityViolations = [], resumeStage, freshnessState,
  bundleTopicSlug, expectedTopicSlug, bundleRoute, expectedRoute,
  routeAlreadyPublished, withinWeeklyCap,
}) {
  const violations = [];
  if (!integrityValid) violations.push(`INTEGRITY_INVALID:${integrityViolations.join(',')}`);
  if (resumeStage !== RESUME_STAGE.READY_FOR_PREPARE) violations.push(`REVIEWER_PASS_NOT_PERSISTED:${resumeStage}`);
  if (freshnessState !== FRESHNESS_STATE.FRESH) violations.push(`CANDIDATE_NOT_FRESH:${freshnessState}`);
  if (bundleTopicSlug !== expectedTopicSlug) violations.push(`TOPIC_SLUG_MISMATCH:${bundleTopicSlug}!=${expectedTopicSlug}`);
  if (bundleRoute !== expectedRoute) violations.push(`ROUTE_MISMATCH:${bundleRoute}!=${expectedRoute}`);
  if (routeAlreadyPublished) violations.push('ROUTE_ALREADY_PUBLISHED');
  if (!withinWeeklyCap) violations.push('WEEKLY_CEILING_REACHED');
  return { ok: violations.length === 0, violations };
}

/**
 * Step 10: before merge, revalidate that the generated PR is STILL the
 * expected one -- same number, same head SHA (never moved since this
 * manifest recorded it), and its diff is still entirely within the
 * generated-diff allowlist. A PR that changed shape since the manifest
 * was written (a force-push, an unrelated commit, a different PR number
 * entirely) fails closed -- this function never assumes the PR is still
 * safe to merge just because it still exists.
 *
 * @param {{number: number, state: string, headRefOid: string, files: Array<{path: string}>}} prInfo
 *   a `gh pr view <n> --json number,state,headRefOid,files` result
 * @param {object} manifest - the education-publication-manifest-v1
 * @returns {{ok: boolean, violations: string[]}}
 */
export function verifyGeneratedPrStillExpectedBeforeMerge(prInfo, manifest) {
  const violations = [];
  if (!prInfo) return { ok: false, violations: ['PR_NOT_FOUND'] };
  if (prInfo.number !== manifest.generated.pr_number) violations.push(`PR_NUMBER_MISMATCH:${prInfo.number}!=${manifest.generated.pr_number}`);
  if (prInfo.state !== 'OPEN') violations.push(`PR_NOT_OPEN:${prInfo.state}`);
  if (prInfo.headRefOid !== manifest.generated.expected_head_sha) violations.push(`PR_HEAD_MOVED:${prInfo.headRefOid}!=${manifest.generated.expected_head_sha}`);
  const changedPaths = (prInfo.files || []).map((f) => f.path);
  const allowlist = checkGeneratedDiffAllowlist(changedPaths);
  if (!allowlist.valid) violations.push(`UNEXPECTED_DIFF:${allowlist.violations.join(',')}`);
  return { ok: violations.length === 0, violations };
}

/**
 * Step 9's idempotency (crash-recovery requirement #9/#10): before
 * writing a fresh non-public clearance row, check whether one already
 * exists for this topic -- and if it does, whether it's the SAME
 * publication (safe to treat as already-persisted, resume idempotently)
 * or a CONFLICTING one (fail closed, never blindly overwrite).
 *
 * @param {object|null} existingRow - the live research_public_pages row
 *   for this topic_slug, or null if none exists yet
 * @param {{expectedTopicSlug: string, expectedGenerationSourceHash: string}} expected
 * @returns {{state: 'NOT_FOUND'|'MATCHES_EXPECTED'|'ALREADY_PUBLISHED'|'CONFLICT', violations: string[]}}
 */
export function checkExistingClearanceRowConsistency(existingRow, { expectedTopicSlug, expectedGenerationSourceHash }) {
  if (!existingRow) return { state: 'NOT_FOUND', violations: [] };
  if (existingRow.topic_slug !== expectedTopicSlug) {
    return { state: 'CONFLICT', violations: [`TOPIC_SLUG_MISMATCH:${existingRow.topic_slug}!=${expectedTopicSlug}`] };
  }
  if (existingRow.status === 'published') {
    return existingRow.generation_source_hash === expectedGenerationSourceHash
      ? { state: 'ALREADY_PUBLISHED', violations: [] }
      : { state: 'CONFLICT', violations: [`ALREADY_PUBLISHED_WITH_DIFFERENT_HASH:${existingRow.generation_source_hash}!=${expectedGenerationSourceHash}`] };
  }
  if (existingRow.status === 'ready_for_page_builder' && existingRow.clearance_mode === 'AUTO_READY' && existingRow.generation_source_hash === expectedGenerationSourceHash) {
    return { state: 'MATCHES_EXPECTED', violations: [] };
  }
  return {
    state: 'CONFLICT',
    violations: [`NON_MATCHING_CLEARANCE_ROW:status=${existingRow.status},clearance_mode=${existingRow.clearance_mode},generation_source_hash=${existingRow.generation_source_hash}`],
  };
}

/**
 * Step 12: is this a CONFIRMED PRODUCTION deployment for the merge
 * commit -- never a preview deployment, never generic workflow success,
 * never elapsed time, never an HTTP 200 from a stale deployment? The
 * orchestrator's I/O layer (education-cloudflare-deploy.mjs) is
 * responsible for actually finding the right GitHub Deployment(s) for
 * the commit SHA; this function only decides, given the deployment
 * objects GitHub's Deployments API returned, whether one of them counts.
 *
 * @param {Array<{id: number, environment: string, sha: string}>} deployments
 * @param {Array<{deployment_id: number, state: string}>} latestStatusesByDeployment
 *   the most recent deployment_status for each deployment id
 * @param {string} commitSha - the merge commit this run is waiting on
 * @returns {{ok: boolean, matchedDeploymentId: number|null, violations: string[]}}
 */
export function checkProductionDeploymentSucceeded(deployments, latestStatusesByDeployment, commitSha) {
  const productionForCommit = (deployments || []).filter((d) => d.sha === commitSha && typeof d.environment === 'string' && d.environment.toLowerCase() === 'production');
  if (productionForCommit.length === 0) {
    return { ok: false, matchedDeploymentId: null, violations: ['NO_PRODUCTION_DEPLOYMENT_FOR_COMMIT'] };
  }
  const statusById = new Map((latestStatusesByDeployment || []).map((s) => [s.deployment_id, s.state]));
  const succeeded = productionForCommit.find((d) => statusById.get(d.id) === 'success');
  if (!succeeded) {
    const states = productionForCommit.map((d) => statusById.get(d.id) || 'pending');
    return { ok: false, matchedDeploymentId: null, violations: [`NO_SUCCESSFUL_PRODUCTION_DEPLOYMENT:${states.join(',')}`] };
  }
  return { ok: true, matchedDeploymentId: succeeded.id, violations: [] };
}

/**
 * Step 13: LIVE VERIFY. Every check is deterministic and exact -- an
 * approximate match (a canonical URL that merely "contains" the route, a
 * hash that merely "starts with" the expected prefix) is treated the
 * same as a mismatch. A generic 404/error document masquerading as an
 * HTTP 200 is caught structurally: it cannot carry BOTH the exact
 * canonical link AND the exact generation marker this specific candidate
 * produced, so failing either check already means "this is not the
 * expected page" without a separate heuristic.
 *
 * @param {{
 *   httpStatus: number, html: string, sitemapXml: string, hubHtml: string,
 *   expectedRoute: string, expectedGenerationSourceHash: string,
 * }} input
 * @returns {{ok: boolean, violations: string[], checks: object}}
 */
export function verifyLivePagePublication({ httpStatus, html, sitemapXml, hubHtml, expectedRoute, expectedGenerationSourceHash }) {
  const violations = [];
  const expectedCanonical = `${SITE_ORIGIN}${expectedRoute}`;
  const safeHtml = typeof html === 'string' ? html : '';

  const statusOk = httpStatus === 200;
  if (!statusOk) violations.push(`UNEXPECTED_HTTP_STATUS:${httpStatus}`);

  const canonicalOk = safeHtml.includes(`<link rel="canonical" href="${expectedCanonical}">`);
  if (!canonicalOk) violations.push('CANONICAL_MISSING_OR_INCORRECT');

  const markerOk = safeHtml.includes(`<meta name="${GENERATION_MARKER_META_NAME}" content="${expectedGenerationSourceHash}">`);
  if (!markerOk) violations.push('GENERATION_MARKER_MISSING_OR_INCORRECT');

  const noindexAbsent = !safeHtml.includes('noindex');
  if (!noindexAbsent) violations.push('UNEXPECTED_NOINDEX_PRESENT');

  const sitemapOk = sitemapContainsRoute(sitemapXml, expectedRoute);
  if (!sitemapOk) violations.push('SITEMAP_MISSING_ROUTE');

  const hubOk = hubContainsRoute(hubHtml, expectedRoute);
  if (!hubOk) violations.push('HUB_MISSING_ROUTE');

  return {
    ok: violations.length === 0,
    violations,
    checks: { statusOk, canonicalOk, markerOk, noindexAbsent, sitemapOk, hubOk },
  };
}

/**
 * Step 15: post-write integrity verification. Re-reads
 * research_public_pages and requires EXACTLY the expected published
 * state -- a mismatch here is never reported as PUBLISHED, regardless of
 * what the guarded writer's own response claimed (defense in depth: this
 * function trusts a fresh re-read, not the write call's return value).
 *
 * @param {object|null} row - a fresh re-read of the row
 * @param {{expectedTopicSlug: string, expectedGenerationSourceHash: string, storedIntegrityValid: boolean}} expected
 * @returns {{ok: boolean, violations: string[]}}
 */
export function verifyPostWritePublishedRow(row, { expectedTopicSlug, expectedGenerationSourceHash, storedIntegrityValid }) {
  const violations = [];
  if (!row) return { ok: false, violations: ['ROW_NOT_FOUND'] };
  if (row.topic_slug !== expectedTopicSlug) violations.push(`TOPIC_SLUG_MISMATCH:${row.topic_slug}!=${expectedTopicSlug}`);
  if (row.status !== 'published') violations.push(`STATUS_NOT_PUBLISHED:${row.status}`);
  if (row.sitemap_eligible !== true) violations.push('SITEMAP_ELIGIBLE_NOT_TRUE');
  if (!row.published_at) violations.push('PUBLISHED_AT_NULL');
  if (row.clearance_mode !== 'AUTO_READY') violations.push(`CLEARANCE_MODE_NOT_AUTO_READY:${row.clearance_mode}`);
  if (row.generation_source_hash !== expectedGenerationSourceHash) violations.push(`GENERATION_SOURCE_HASH_MISMATCH:${row.generation_source_hash}!=${expectedGenerationSourceHash}`);
  if (!storedIntegrityValid) violations.push('STORED_CLEARANCE_INTEGRITY_FAILED');
  return { ok: violations.length === 0, violations };
}
