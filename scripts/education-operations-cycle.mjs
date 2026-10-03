#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — orchestration entry point
   ---------------------------------------------------------------
   ONE complete scheduled iteration. Owns the full decision pipeline
   (topic selection -> intent planning -> Publication Editor synthesis
   -> Education Writer -> Education Reviewer -> generated-diff
   allowlist) and, only in --publish mode with autopublish explicitly
   enabled, the publication steps (branch/PR/merge/live-verify/DB write).

   MODES:
     --shadow            (SCHEDULED DEFAULT) runs the full decision
                pipeline against real evidence, produces a run report,
                and stops BEFORE any file is written or any git/GitHub
                action is taken. Proves the architecture safely.
     --prepare  runs everything --shadow does, and if the result is
                SHADOW_CANDIDATE_READY, additionally writes the
                generated content locally (Page Plan artifact + article
                HTML + hub card + sitemap entry) and opens a branch/PR
                -- but performs ZERO writes to research_public_pages
                and NEVER merges. This is where "create Page #3" would
                actually happen, which is exactly why this task never
                invokes --prepare against a real selected topic (see
                docs/education/AIMT-EDUCATION-OPERATIONS-v1.md).
     --persist-clearance  consumes an ALREADY-MERGED prepared artifact
                and persists it to research_public_pages as a
                NON-PUBLIC ready_for_page_builder row (clearance_mode
                AUTO_READY). Does NOT merge a PR, wait for Cloudflare,
                verify the live route, touch sitemap.xml/noindex, or
                call publishClearanceRecord() -- it never sets
                status='published'. Does not, and structurally cannot,
                trigger a new synthesis call (see
                education-synthesis-cache.mjs). Refuses to run at all
                unless AIMT_EDUCATION_AUTOPUBLISH_ENABLED is exactly
                "true" (this is still a real, if non-public, production
                database write, and stays behind the same gate).
     --publish  RESERVED for the future FULL autonomous-publication
                state machine (merge -> wait for Cloudflare -> verify
                the live route -> publishClearanceRecord()). NOT
                IMPLEMENTED. Always refuses to run, unconditionally,
                regardless of AIMT_EDUCATION_AUTOPUBLISH_ENABLED --
                that variable does not yet grant this capability. Kept
                as a recognized flag only so a future implementation
                has a stable name to fill in; running it today can
                never write anything anywhere.

   PRODUCTION SAFETY DEFAULT: AIMT_EDUCATION_AUTOPUBLISH_ENABLED absent
   or not exactly "true" means NO production publication, in ANY mode
   -- --persist-clearance refuses to run at all without it, --publish
   refuses to run at all regardless of it, and the scheduled workflow's
   own default invocation is --shadow, never --persist-clearance or
   --publish.
   ═══════════════════════════════════════════════════════════════ */

import { randomUUID } from 'node:crypto';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchTopicEvidenceLive, selectTopicEvidenceFromRows } from '../functions/_lib/research/publication-readiness-loader.mjs';
import { assessTopicReadiness } from '../functions/_lib/research/publication-readiness.mjs';
import { selectNextTopic } from '../functions/_lib/education-ops/education-topic-selector.mjs';
import {
  PUBLICATION_CLUSTERS, PUBLICATION_CONCEPTS, getPublicationConcept, publicationRouteFor, controlledTopicsForConcepts,
} from '../functions/_lib/education-ops/education-publication-registry.mjs';
import { fetchPublishedTopicSlugsLive, countPagesPublishedThisWeekLive } from '../functions/_lib/education-ops/education-published-state-loader.mjs';
import { checkEducationOpsCredential } from '../functions/_lib/education-ops/education-ops-model-config.mjs';
import { planPageIntent } from '../functions/_lib/education-ops/education-intent-planner-client.mjs';
import { validateIntentPlan } from '../functions/_lib/education-ops/education-intent-planner-validator.mjs';
import { prepareTopicArtifact, publishPreparedArtifact } from '../functions/_lib/education-ops/education-synthesis-cache.mjs';
import { writeEducationPagePlan } from '../functions/_lib/education-ops/education-writer-client.mjs';
import { validateEducationPagePlan } from '../functions/_lib/education-ops/education-page-plan-validator.mjs';
import { repairDeterministicPagePlanViolations } from '../functions/_lib/education-ops/education-page-plan-repair.mjs';
import { reviewEducationPagePlan } from '../functions/_lib/education-ops/education-reviewer-client.mjs';
import { aggregateReviewOutcome, REVIEW_OUTCOME } from '../functions/_lib/education-ops/education-reviewer-validator.mjs';
import { repairReviewerFramingFailures } from '../functions/_lib/education-ops/education-reviewer-framing-repair.mjs';
import { renderEducationPageHtml } from '../functions/_lib/education-ops/education-page-renderer.mjs';
import { checkGeneratedDiffAllowlist } from '../functions/_lib/education-ops/education-diff-allowlist.mjs';
import { checkAllPublishedTopicsFreshness, FRESHNESS_STATE } from '../functions/_lib/education-ops/education-freshness-monitor.mjs';
import { buildRunReport, RUN_FINAL_STATE, MAX_EDUCATION_OPS_MODEL_CALLS_PER_RUN } from '../functions/_lib/education-ops/education-run-ledger.mjs';
import { surfaceExceptionIfNeeded } from '../functions/_lib/education-ops/education-exception-reporter.mjs';
import { writeClearanceRecord, replaceNonPublicClearanceRecord, publishClearanceRecord } from '../functions/_lib/research/publication-clearance-writer.mjs';
import { verifyStoredClearanceIntegrity } from '../functions/_lib/research/publication-clearance-fingerprint.mjs';
import { buildHubCardHtml, insertHubCard, hubContainsRoute, resolveHubForRoute, isEmptyHub } from '../functions/_lib/education-ops/education-hub-updater.mjs';
import { insertSitemapRoute, sitemapContainsRoute } from '../functions/_lib/education-ops/education-sitemap-updater.mjs';
import {
  PUBLICATION_STATE, buildPublicationManifest, advancePublicationManifest, validatePublicationManifestShape,
  isManifestForSameCandidate, computePreparedArtifactDigest, determinePublicationResumeStage,
} from '../functions/_lib/education-ops/education-publication-state.mjs';
import {
  checkCandidateReadyForPublication, verifyGeneratedPrStillExpectedBeforeMerge,
  checkExistingClearanceRowConsistency, verifyLivePagePublication, verifyPostWritePublishedRow,
} from '../functions/_lib/education-ops/education-publish-verification.mjs';
import { waitForCloudflareProductionDeployment } from './_lib/education-cloudflare-deploy-io.mjs';
import { buildTrustedSources } from '../functions/_lib/education-ops/education-source-authority.mjs';
import { buildEducationRelatedLinks } from '../functions/_lib/education-ops/education-related-links.mjs';
import { checkRouteNotAlreadyPublished } from '../functions/_lib/education-ops/education-route-guard.mjs';
import { getPageBuilderRoute } from '../functions/_lib/page-builder/page-builder-route-registry.mjs';
import {
  buildCandidateBundle, advanceCandidateBundle, verifyCandidateBundleIntegrity,
  resolveCandidateResumeFreshness, determineResumeStage, RESUME_STAGE,
} from '../functions/_lib/education-ops/education-candidate-bundle.mjs';
import { sanitizePublicationValidatorViolations } from '../functions/_lib/research/publication-violation-sanitizer.mjs';
import {
  loadActiveResearchGapsBySlug, upsertEvidenceInsufficiencyGap, resolveResearchGapByTopic,
} from '../functions/_lib/education-ops/education-research-gap-queue.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

export const LIVE_VERIFY_MAX_ATTEMPTS = 12;
export const LIVE_VERIFY_RETRY_DELAY_MS = 5 * 1000;

/** Convert a canonical Education route to its repository HTML path.
 * Example: /education/hair-loss/alopecia-areata ->
 * education/hair-loss/alopecia-areata.html.
 * Fails closed instead of ever creating education/education/... . */
export function educationArticlePathFromRoute(route) {
  if (typeof route !== 'string' || !route.startsWith('/education/')) {
    throw new Error(`educationArticlePathFromRoute: expected an /education/... route, got "${route}".`);
  }
  return `${route.slice(1)}.html`;
}

/**
 * Default (real) artifact reader for resolveTrustedSiblingPages() below.
 * Reads functions/_data/education-page-plans/<slug>.json and validates
 * it carries everything a trusted route requires. Never guesses --
 * every failure mode returns a specific `reason`, never a silent skip.
 *
 * @param {string} slug
 * @returns {{ok: true, route: string, h1: string} | {ok: false, reason: string}}
 */
function readEducationPageArtifact(slug) {
  const artifactPath = path.join(ROOT, 'functions/_data/education-page-plans', `${slug}.json`);
  if (!existsSync(artifactPath)) {
    return { ok: false, reason: 'not in the legacy Page Builder route registry and no persisted Page Plan artifact exists' };
  }
  let data;
  try {
    data = JSON.parse(readFileSync(artifactPath, 'utf8'));
  } catch (err) {
    return { ok: false, reason: `persisted Page Plan artifact is not valid JSON (${err.message})` };
  }
  if (!data || typeof data !== 'object' || !data.plan || typeof data.plan !== 'object') {
    return { ok: false, reason: 'persisted Page Plan artifact has no `plan` object' };
  }
  if (typeof data.plan.route !== 'string' || !data.plan.route.trim()) {
    return { ok: false, reason: 'persisted Page Plan artifact has no valid `plan.route`' };
  }
  if (typeof data.plan.h1 !== 'string' || !data.plan.h1.trim()) {
    return { ok: false, reason: 'persisted Page Plan artifact has no valid `plan.h1`' };
  }
  // topic_slug consistency, checked wherever the field is actually
  // present (the artifact's own top-level topic_slug, written by
  // prepareGeneratedArtifacts(), and/or the embedded plan's own field).
  if (typeof data.topic_slug === 'string' && data.topic_slug !== slug) {
    return { ok: false, reason: `artifact topic_slug "${data.topic_slug}" does not match the published slug "${slug}"` };
  }
  if (typeof data.plan.topic_slug === 'string' && data.plan.topic_slug !== slug) {
    return { ok: false, reason: `artifact plan.topic_slug "${data.plan.topic_slug}" does not match the published slug "${slug}"` };
  }
  return { ok: true, route: data.plan.route, h1: data.plan.h1 };
}

/**
 * Durable candidate bundle location -- see education-candidate-
 * bundle.mjs and docs/education/AIMT-EDUCATION-OPERATIONS-v1.md's
 * "Durable candidate persistence + resume" section. One JSON file per
 * topic, gitignored locally (research-import/), uploaded/downloaded as
 * a named GitHub Actions artifact by the workflow so it survives across
 * separate CI job runs -- the same cross-run durability gap this
 * module's own header comment used to flag as NOT YET BUILT for
 * --prepare's artifact.
 */
function candidateBundlePath(topicSlug) {
  return path.join(ROOT, 'research-import', 'education-ops', 'candidates', topicSlug, 'candidate.json');
}

/**
 * Real (disk-based) candidate bundle loader. Never throws on a missing
 * or corrupt file -- both are ordinary, expected states the caller must
 * handle explicitly (no bundle yet vs. a bundle that failed to parse),
 * never treated the same as "no bundle" (a parse failure is reported as
 * an INFRA_REVIEW-class anomaly by the caller, never silently ignored).
 *
 * @param {string} topicSlug
 * @returns {{found: boolean, bundle: object|null, parseError?: string}}
 */
export function loadCandidateBundle(topicSlug) {
  const filePath = candidateBundlePath(topicSlug);
  if (!existsSync(filePath)) return { found: false, bundle: null };
  try {
    return { found: true, bundle: JSON.parse(readFileSync(filePath, 'utf8')) };
  } catch (err) {
    return { found: true, bundle: null, parseError: err.message };
  }
}

/** Real (disk-based) candidate bundle writer. Creates the per-topic
    directory if needed. Returns the path written. */
export function writeCandidateBundle(topicSlug, bundle) {
  const filePath = candidateBundlePath(topicSlug);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(bundle, null, 2));
  return filePath;
}

/**
 * FAIL-CLOSED CORRECTION: research_public_pages is the runtime
 * authority that a topic is published -- this function used to
 * silently OMIT any published, active-cluster topic that couldn't be
 * mapped to a trusted route (missing/malformed artifact, etc.). That is
 * unsafe: the incomplete result fed route-collision protection,
 * related-link generation, and the Writer's sibling context, all of
 * which would then have operated on a published-route set the database
 * itself disagrees with. It now FAILS CLOSED instead -- every currently
 * published, active-cluster topic MUST resolve through either the
 * legacy Page Builder route registry OR a valid persisted Page Plan
 * artifact, or the whole resolution fails (see readEducationPageArtifact
 * above for exactly what "valid" requires). Two published topics
 * resolving to the SAME route is also a failure, never a silent
 * dedup.
 *
 * MULTI-CLUSTER: with clusterKey null/omitted (what the orchestrator now
 * passes), EVERY registered concept in EVERY cluster is resolved, so
 * route-collision protection and duplicate-route detection cover the
 * whole public Education surface, not one cluster. A published slug
 * that is not a registered publication concept at all is ignored, as an
 * out-of-cluster slug always was. Each returned page carries its
 * registered `cluster`, so callers can narrow sibling context to one
 * cluster without re-resolving.
 *
 * @param {string[]} publishedTopicSlugs - the LIVE published set (any cluster)
 * @param {string|null} [clusterKey] - optional: narrow to one cluster
 * @param {{getPageBuilderRouteFn?: Function, readArtifactFn?: Function}} [io]
 *   test-only overrides; the real caller never supplies them
 * @returns {{ok: true, pages: Array<{topic_slug: string, route: string, label: string}>} | {ok: false, violations: string[]}}
 */
export function resolveTrustedSiblingPages(publishedTopicSlugs, clusterKey, io = {}) {
  const getRoute = io.getPageBuilderRouteFn || getPageBuilderRoute;
  const readArtifact = io.readArtifactFn || readEducationPageArtifact;
  const resolved = [];
  const violations = [];

  for (const slug of publishedTopicSlugs) {
    const concept = getPublicationConcept(slug);
    if (!concept) continue; // not a registered publication concept -- not this function's concern
    if (clusterKey && concept.cluster !== clusterKey) continue; // explicitly narrowed to another cluster

    try {
      const { route } = getRoute(slug);
      resolved.push({ topic_slug: slug, cluster: concept.cluster, route, label: concept.seo_page_concept });
      continue;
    } catch (_err) {
      // Not in the legacy registry -- fall through to a persisted Page
      // Plan artifact, the trusted source for a future generated page.
    }

    const artifactResult = readArtifact(slug);
    if (!artifactResult.ok) {
      violations.push(`UNRESOLVABLE_PUBLISHED_ROUTE:${slug}:${artifactResult.reason}`);
      continue;
    }
    resolved.push({ topic_slug: slug, cluster: concept.cluster, route: artifactResult.route, label: artifactResult.h1 });
  }

  // Duplicate-route detection across everything that DID resolve --
  // two published topics can never legitimately share one route.
  const routeOwners = new Map();
  for (const page of resolved) {
    if (routeOwners.has(page.route)) {
      violations.push(`DUPLICATE_PUBLISHED_ROUTE:${page.route}:${routeOwners.get(page.route)},${page.topic_slug}`);
    } else {
      routeOwners.set(page.route, page.topic_slug);
    }
  }

  if (violations.length > 0) return { ok: false, violations };
  return { ok: true, pages: resolved };
}

export const AUTOPUBLISH_ENV_VAR = 'AIMT_EDUCATION_AUTOPUBLISH_ENABLED';
export const MAX_PAGES_PER_WEEK_ENV_VAR = 'AIMT_EDUCATION_MAX_PAGES_PER_WEEK';
export const DEFAULT_MAX_PAGES_PER_WEEK = 4;
// RESEARCH-GAP FEEDBACK LOOP v1: a NEW production operational DB write
// (research_verification_queue, lane=publication_evidence_gap) --
// behind its own explicit gate, same fail-closed default posture as
// AUTOPUBLISH_ENV_VAR ("anything other than literal 'true' = disabled").
// Never enabled from code; never implied by AUTOPUBLISH_ENV_VAR or vice
// versa -- the two flags are completely independent.
export const RESEARCH_GAP_LOOP_ENV_VAR = 'AIMT_RESEARCH_GAP_LOOP_ENABLED';

export function isAutopublishEnabled(env) {
  return String(env && env[AUTOPUBLISH_ENV_VAR]).trim().toLowerCase() === 'true';
}

export function isResearchGapLoopEnabled(env) {
  return String(env && env[RESEARCH_GAP_LOOP_ENV_VAR]).trim().toLowerCase() === 'true';
}

export function resolveMaxPagesPerWeek(env) {
  const raw = env && env[MAX_PAGES_PER_WEEK_ENV_VAR];
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_PAGES_PER_WEEK;
}

/** Weekly cap is a CEILING, never a requirement -- a run that finds zero
    eligible topics is NO_OP_SUCCESS regardless of how far under the cap
    the week is. */
export function checkWeeklyCap(pagesPublishedThisWeek, maxPerWeek) {
  return { withinCap: pagesPublishedThisWeek < maxPerWeek, pagesPublishedThisWeek, maxPerWeek };
}

/** The SAME actual-call-counting rule buildRunReport() uses for the hard
    ceiling -- duplicated here (not imported) because it must be checked
    BEFORE modelCalls is handed to buildRunReport(), to decide whether
    there is room left in THIS run's budget for the one Reviewer retry
    the framing repair is permitted to spend. */
function sumActualModelCalls(modelCalls) {
  return modelCalls.reduce((sum, c) => sum + (typeof c.actual_call_count === 'number' ? c.actual_call_count : 1), 0);
}

/**
 * ONE-TIME, BOUNDED framing-removal repair (docs/education/AIMT-
 * EDUCATION-OPERATIONS-v1.md's "Deterministic FRAMING-removal repair").
 * Called from exactly two places in runDecisionPipeline(): the
 * RESUME_STAGE.EDITORIAL_REVIEW branch (resuming a durable candidate
 * whose Reviewer verdict already failed in an EARLIER run) and the
 * fresh-run SUBSTANTIVE_FAIL branch (the Reviewer just failed THIS run).
 * Both call sites share identical eligibility/one-attempt/ceiling/
 * revalidation/retry logic -- only what surrounds the call (which other
 * model stages ran this run) differs.
 *
 * Never mutates `bundleDraft`; every outcome that persists state returns
 * a NEW bundle (via advanceCandidateBundle) that the caller must adopt.
 *
 * @returns {
 *   {attempted: false} |
 *   {attempted: true, callFailed: true, exceptionReason: string} |
 *   {attempted: true, bundleDraft: object, finalState: string, reviewResult: object, plan: object, exceptionReason?: string}
 * }
 */
async function attemptReviewerFramingRepair(env, {
  bundleDraft, plan, clearedSnapshot, validationContext, reviewFn, writeBundleFn, topicSlug, modelCalls, fns = {},
}) {
  const alreadyAttempted = !!(bundleDraft.reviewer_framing_repair && bundleDraft.reviewer_framing_repair.attempted === true);
  if (alreadyAttempted) return { attempted: false };

  const repairFn = fns.repairFramingFn || repairReviewerFramingFailures;
  const repair = repairFn(plan, bundleDraft.review_result);
  if (!repair.eligible) return { attempted: false };

  // MODEL-CALL CEILING GUARD: this repair may add at most ONE Reviewer
  // call, and the global ceiling (MAX_EDUCATION_OPS_MODEL_CALLS_PER_RUN)
  // is never raised for it. In the rare compound worst case where
  // Publication Editor's own bounded pipeline already spent its maximum
  // 3 calls this run, there is no room left for a retry THIS run --
  // rather than exceed the ceiling, the repair is simply not attempted
  // (never marked attempted:true), so a LATER run resumes at
  // RESUME_STAGE.EDITORIAL_REVIEW and performs the identical repair
  // needing only this ONE call, comfortably inside the ceiling.
  if (sumActualModelCalls(modelCalls) + 1 > MAX_EDUCATION_OPS_MODEL_CALLS_PER_RUN) {
    return { attempted: false };
  }

  const validateFn = fns.validateEducationPagePlanFn || validateEducationPagePlan;
  const revalidation = validateFn(repair.repairedPlan, clearedSnapshot, validationContext);
  if (!revalidation.valid) {
    const nextBundle = advanceCandidateBundle(bundleDraft, {
      reviewerFramingRepair: {
        attempted: true,
        removed_unit_count: repair.removedUnitCount,
        deterministic_validation_passed: false,
        originating_review_summary: bundleDraft.review_result.summary,
        resulting_review_outcome: null,
      },
    });
    writeBundleFn(topicSlug, nextBundle);
    return {
      attempted: true,
      bundleDraft: nextBundle,
      finalState: RUN_FINAL_STATE.EDITORIAL_REVIEW,
      reviewResult: nextBundle.review_result,
      plan: nextBundle.page_plan,
      exceptionReason: `Framing-removal repair produced an invalid Page Plan (${revalidation.violations.join(', ')}) -- preserving the original Reviewer verdict, no Reviewer retry.`,
    };
  }

  const reviewRetry = await reviewFn(env, { plan: repair.repairedPlan, clearedSnapshot, intentPlan: bundleDraft.intent_plan });
  if (!reviewRetry.ok) {
    // Infra/config failure on the retry call itself -- never a completed
    // repair attempt, so the one-attempt guard is NOT consumed and the
    // bundle is left untouched, exactly like the existing (pre-repair)
    // Reviewer-call-failure handling elsewhere in this pipeline.
    return { attempted: true, callFailed: true, exceptionReason: `Reviewer retry call failed: ${reviewRetry.reason}` };
  }
  modelCalls.push({ role: 'education_reviewer_framing_retry', actual_call_count: 1, ...reviewRetry.usage });
  const outcome2 = aggregateReviewOutcome(reviewRetry.output);
  const nextBundle = advanceCandidateBundle(bundleDraft, {
    pagePlan: repair.repairedPlan,
    reviewResult: outcome2,
    reviewerFramingRepair: {
      attempted: true,
      removed_unit_count: repair.removedUnitCount,
      deterministic_validation_passed: true,
      originating_review_summary: bundleDraft.review_result.summary,
      resulting_review_outcome: outcome2.outcome,
    },
  });
  writeBundleFn(topicSlug, nextBundle);
  return {
    attempted: true,
    bundleDraft: nextBundle,
    finalState: outcome2.outcome === REVIEW_OUTCOME.PASS ? RUN_FINAL_STATE.SHADOW_CANDIDATE_READY : RUN_FINAL_STATE.EDITORIAL_REVIEW,
    reviewResult: outcome2,
    plan: repair.repairedPlan,
  };
}

/**
 * The full decision pipeline, shared by --shadow and --prepare. Never
 * writes a file or takes a git/GitHub action itself -- callers decide
 * what to do with a SHADOW_CANDIDATE_READY result.
 *
 * ORDER OF OPERATIONS (deliberate -- see the runtime-wiring correction
 * that introduced this ordering): every READ-ONLY, no-model-required
 * step runs FIRST, so a missing Education Ops model credential never
 * erases the useful read-only part of a run. Only once the pipeline
 * reaches a step that genuinely needs a model call (intent planning)
 * is the credential required at all.
 *   1. load the LIVE published-topic set (never a hardcoded constant)
 *   2. count real publications this week (LIVE, never caller-supplied
 *      in production -- options.pagesPublishedThisWeek/
 *      options.publishedTopicSlugs remain available for tests only)
 *   3. run the freshness scan against the live published set (no model
 *      call) -- ALWAYS, independent of the weekly cap or new-page lane
 *      outcome, so a stale-page signal is never suppressed by cap
 *      exhaustion or an empty candidate pool
 *   4. weekly cap gate
 *   5. topic selection/readiness (uses the live published set for
 *      exclusion + cannibalization)
 *   6. Education Ops credential check (first point a model is needed)
 *   7. intent planning -> synthesis -> writer -> reviewer (unchanged)
 *
 * @param {Object} env
 * @param {{clusterKey?: string, pagesPublishedThisWeek?: number, publishedTopicSlugs?: string[], fns?: object}} [options]
 *   pagesPublishedThisWeek/publishedTopicSlugs are TEST-ONLY overrides;
 *   the real CLI never supplies them, so the live loaders below always
 *   run in production.
 * @returns {Promise<object>} a buildRunReport() result
 */
export async function runDecisionPipeline(env, options = {}) {
  const runId = options.runId || randomUUID();
  const startedAt = new Date().toISOString();
  const modelCalls = [];
  // MULTI-CLUSTER: no default cluster. Every registered cluster is
  // evaluated unless a test/diagnostic explicitly narrows it; the
  // selected candidate's own registered cluster drives everything after
  // selection (intent, route, hub, related links, research gap).
  const clusterKeys = options.clusterKeys || (options.clusterKey ? [options.clusterKey] : null);
  const fns = options.fns || {};
  const common = {};

  // NOTE: __internal is deliberately NOT part of buildRunReport()'s
  // typed field list (it's the SHADOW_CANDIDATE_READY case's own
  // in-memory handoff to prepareGeneratedArtifacts() -- preparedArtifact
  // is far too large/sensitive to belong in the durable, persisted run
  // report). buildRunReport() returns a plain literal of only its own
  // named fields, so __internal must be attached AFTER, never passed
  // through it (passing it through would silently drop it).
  const finish = (fields) => {
    const { __internal, ...reportFields } = fields;
    const report = buildRunReport({
      run_id: runId, started_at: startedAt, finished_at: new Date().toISOString(),
      mode: options.mode || 'shadow', model_calls: modelCalls, ...common, ...reportFields,
    });
    if (__internal) report.__internal = __internal;
    return report;
  };

  // --- 1. Live published-topic state (fail closed -- never fall back
  //        to a hardcoded constant for a real run) --------------------
  let publishedTopicSlugs;
  if (Array.isArray(options.publishedTopicSlugs)) {
    publishedTopicSlugs = options.publishedTopicSlugs;
  } else {
    const fetchPublished = fns.fetchPublishedTopicSlugsFn || fetchPublishedTopicSlugsLive;
    try {
      publishedTopicSlugs = await fetchPublished(env);
    } catch (err) {
      return finish({ final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: `Published-topic state query failed: ${err.message}`, stopped_before_model_stage: true, credential_available: null });
    }
  }
  common.published_topics = publishedTopicSlugs;

  // --- 1.5. Trusted sibling-page resolution (FAILS CLOSED) -------------
  // Feeds the Writer's context, the deterministic related_links
  // builder, and the route-collision guard below. If ANY currently
  // published, active-cluster topic cannot be mapped to a trusted route
  // (legacy registry or a valid persisted Page Plan artifact), or two
  // resolve to the same route, this is an architecture-safety anomaly --
  // published DB state and trusted route/artifact state disagree -- and
  // the run stops as INFRA_REVIEW before any model call, never
  // silently continuing with an incomplete published-route set. See
  // resolveTrustedSiblingPages()'s own header comment.
  const resolveSiblingPages = fns.resolveTrustedSiblingPagesFn || resolveTrustedSiblingPages;
  // Resolved across ALL clusters (clusterKey null): route-collision
  // protection must see every live Education route, not just the
  // selected candidate's cluster.
  const siblingResolution = resolveSiblingPages(publishedTopicSlugs, null);
  if (!siblingResolution.ok) {
    return finish({
      final_state: RUN_FINAL_STATE.INFRA_REVIEW,
      exception_reason: `Published DB state and trusted route/artifact state disagree: ${siblingResolution.violations.join(', ')}`,
      stopped_before_model_stage: true,
      credential_available: null,
    });
  }
  const allTrustedPublishedPages = siblingResolution.pages;
  const trustedPublishedRoutes = allTrustedPublishedPages.map((p) => p.route);

  // --- 2. Live weekly publication count -------------------------------
  let pagesPublishedThisWeek;
  if (typeof options.pagesPublishedThisWeek === 'number') {
    pagesPublishedThisWeek = options.pagesPublishedThisWeek;
  } else {
    const countPublished = fns.countPagesPublishedThisWeekFn || countPagesPublishedThisWeekLive;
    try {
      pagesPublishedThisWeek = (await countPublished(env)).count;
    } catch (err) {
      return finish({ final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: `Weekly publication count query failed: ${err.message}`, stopped_before_model_stage: true, credential_available: null });
    }
  }
  const maxPerWeek = resolveMaxPagesPerWeek(env);
  common.pages_published_this_week = pagesPublishedThisWeek;
  common.weekly_ceiling = maxPerWeek;
  const capCheck = checkWeeklyCap(pagesPublishedThisWeek, maxPerWeek);

  // --- 3. Freshness scan (read-only, no model call) -- ALWAYS runs,
  //        independent of the weekly cap / new-page lane outcome ------
  const checkFreshness = fns.checkFreshnessFn || checkAllPublishedTopicsFreshness;
  common.freshness_scan_summary = await checkFreshness(env, publishedTopicSlugs);

  // --- 4. Weekly cap gate ----------------------------------------------
  if (!capCheck.withinCap) {
    return finish({ final_state: RUN_FINAL_STATE.NO_OP_SUCCESS, selection_reason: `Weekly cap reached (${pagesPublishedThisWeek}/${maxPerWeek}).`, stopped_before_model_stage: true, credential_available: null });
  }

  // --- 5. Topic selection (read-only Supabase query for evidence) -----
  const fetchEvidence = fns.fetchEvidenceFn || fetchTopicEvidenceLive;
  let evidencePool;
  try {
    // Fetch the union of every evaluated registered concept's
    // controlled_topics (all clusters) in one pass so selectNextTopic()
    // can assess every candidate across clusters.
    const evaluatedConcepts = clusterKeys ? PUBLICATION_CONCEPTS.filter((c) => clusterKeys.includes(c.cluster)) : PUBLICATION_CONCEPTS;
    evidencePool = await fetchEvidence(env, controlledTopicsForConcepts(evaluatedConcepts));
  } catch (err) {
    return finish({ final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: `Evidence fetch failed: ${err.message}`, stopped_before_model_stage: true, credential_available: null });
  }

  // --- RESEARCH-GAP FEEDBACK LOOP: load active gaps (read-only) --------
  // Only queried when the loop is enabled -- with it disabled, this is
  // a zero-cost no-op ({}) and selectNextTopic()'s hold check never
  // fires, so existing behavior is byte-for-byte unchanged (section 10:
  // "When disabled: existing HUMAN_REVIEW behavior remains exactly as it
  // is today").
  const researchGapLoopEnabled = isResearchGapLoopEnabled(env);
  let activeResearchGapsBySlug = {};
  if (researchGapLoopEnabled) {
    const loadGapsFn = fns.loadActiveResearchGapsBySlugFn || loadActiveResearchGapsBySlug;
    try {
      activeResearchGapsBySlug = await loadGapsFn(env);
    } catch (err) {
      return finish({ final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: `Research-gap queue read failed: ${err.message}`, stopped_before_model_stage: true, credential_available: null });
    }
  }

  const selection = selectNextTopic(evidencePool, { clusterKeys, publishedTopicSlugs, activeResearchGapsBySlug });
  const candidateTopics = selection.candidates.map((c) => ({ topic_slug: c.topic_slug, cluster: c.cluster, eligible: c.eligible, reason: c.ineligible_reason, risk_tier: c.v1_result.risk_tier, opportunity_score: c.opportunity.score }));

  if (!selection.selected) {
    // RESEARCH-GAP FEEDBACK LOOP observability: make it obvious when the
    // reason NOTHING was selected is a pending research gap (section 4),
    // not just an empty/exhausted candidate pool.
    const heldCandidate = candidateTopics.find((c) => c.reason === 'RESEARCH_GAP_PENDING');
    if (heldCandidate) {
      const heldGap = activeResearchGapsBySlug[heldCandidate.topic_slug];
      common.research_gap_action = {
        enabled: true, action: 'SKIPPED_PENDING', gap_id: heldGap ? heldGap.queue_id : null,
        topic_slug: heldCandidate.topic_slug, attempt_count: heldGap && heldGap.extras ? heldGap.extras.attempt_count : null,
      };
    }
    return finish({
      candidate_topics: candidateTopics,
      final_state: RUN_FINAL_STATE.NO_OP_SUCCESS,
      selection_reason: selection.selection_reason,
      stopped_before_model_stage: true,
      credential_available: null,
    });
  }

  const selected = selection.selected;
  const existingGapForSelectedTopic = activeResearchGapsBySlug[selected.topic_slug] || null;

  // The selected concept's REGISTERED cluster and route -- never chosen
  // by a model, never derived from a research packet.
  const clusterKey = selected.concept.cluster;
  const cluster = PUBLICATION_CLUSTERS[clusterKey];
  const registeredRoute = publicationRouteFor(selected.topic_slug);
  // Same-cluster published pages only: Writer/planner sibling context
  // and related links stay within the candidate's own cluster.
  const trustedSiblingPages = allTrustedPublishedPages.filter((p) => p.cluster === clusterKey);

  // --- 6. Education Ops credential check -- the FIRST point a model is
  //        genuinely needed. Everything above is preserved in `common`
  //        regardless of what happens here. ---------------------------
  const credCheck = checkEducationOpsCredential(env);
  common.credential_available = credCheck.ok;
  if (!credCheck.ok) {
    return finish({ candidate_topics: candidateTopics, selected_topic: selected.topic_slug, selection_reason: selection.selection_reason, risk_tier: selected.v1_result.risk_tier, readiness_result: selected.v1_result.readiness_status, final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: credCheck.reason, stopped_before_model_stage: true });
  }

  // Real, trusted route+label data -- see resolveTrustedSiblingPages().
  // Renamed from `page_concept` to `label` to match what it actually is
  // now (a route registry/persisted-artifact value, not a re-derived
  // PILOT_TOPIC_CONCEPTS lookup) -- CONTEXT ONLY for the Writer; it never
  // authors an href itself (see education-related-links.mjs). Needed by
  // both a fresh intent-planner call AND the Writer call below
  // regardless of whether this run resumes from a durable candidate.
  const existingClusterPages = trustedSiblingPages.map((p) => ({ topic_slug: p.topic_slug, route: p.route, label: p.label }));

  // --- DURABLE CANDIDATE BUNDLE: load + verify + maybe resume ----------
  // See functions/_lib/education-ops/education-candidate-bundle.mjs and
  // docs/education/AIMT-EDUCATION-OPERATIONS-v1.md's "Durable candidate
  // persistence + resume" section. THE FIX (real GitHub Actions shadow
  // regression, Run #3 -> Run #4): once Publication Editor produces an
  // AUTO_READY artifact for a topic, it must never be called again for
  // that SAME topic while a valid, FRESH candidate bundle for it already
  // exists -- Publication Editor's synthesis step is intentionally
  // nondeterministic, and a later, different (possibly FAILED) synthesis
  // result must never erase a previously-valid, unchanged candidate.
  const loadBundleFn = fns.loadCandidateBundleFn || loadCandidateBundle;
  const writeBundleFn = fns.writeCandidateBundleFn || writeCandidateBundle;
  const verifyBundleIntegrityFn = fns.verifyCandidateBundleIntegrityFn || verifyCandidateBundleIntegrity;
  const resolveBundleFreshnessFn = fns.resolveCandidateResumeFreshnessFn || resolveCandidateResumeFreshness;
  // Hoisted above its first (resume-path) use so the bounded framing-
  // removal repair can call the Reviewer without re-declaring this --
  // reused, unchanged, by the fresh-run Reviewer call further below.
  const reviewFn = fns.reviewFn || reviewEducationPagePlan;

  const candidateResume = {
    found: false, reused: false, contract_version: null, originating_run_id: null,
    resumed_from_stage: null, integrity_valid: null, freshness_state: null,
  };
  // Mutated in place from here on -- `common` carries the SAME object
  // reference, so every finish() call from this point forward reports
  // whatever the current state is, without needing to be threaded
  // through each individual return statement below.
  common.candidate_resume = candidateResume;

  let bundleDraft = null; // non-null only when a valid, FRESH prior bundle is being resumed from (or was just created this run, see below)

  const loaded = loadBundleFn(selected.topic_slug);
  candidateResume.found = loaded.found;

  if (loaded.found) {
    if (!loaded.bundle) {
      return finish({
        candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
        final_state: RUN_FINAL_STATE.INFRA_REVIEW,
        exception_reason: `Durable candidate bundle for "${selected.topic_slug}" could not be parsed (${loaded.parseError || 'invalid JSON'}) -- refusing to resume or silently regenerate over it.`,
      });
    }
    candidateResume.contract_version = loaded.bundle.contract_version || null;
    candidateResume.originating_run_id = loaded.bundle.originating_run_id || null;

    const integrity = await verifyBundleIntegrityFn(loaded.bundle);
    candidateResume.integrity_valid = integrity.valid;
    if (!integrity.valid) {
      return finish({
        candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
        final_state: RUN_FINAL_STATE.INFRA_REVIEW,
        exception_reason: `Durable candidate bundle for "${selected.topic_slug}" failed integrity verification (${integrity.violations.join(', ')}) -- refusing to resume or silently regenerate over it.`,
      });
    }

    // REGISTRY CONSISTENCY: a durable candidate must still target the
    // selected concept's registered cluster and route. A bundle whose
    // cluster/route disagrees with the registry (e.g. created before a
    // registry edit) is never resumed or silently overwritten.
    if (loaded.bundle.cluster !== clusterKey || loaded.bundle.route !== registeredRoute) {
      return finish({
        candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
        final_state: RUN_FINAL_STATE.INFRA_REVIEW,
        exception_reason: `Durable candidate bundle for "${selected.topic_slug}" targets ${loaded.bundle.cluster} ${loaded.bundle.route}, but the publication registry assigns ${clusterKey} ${registeredRoute} -- refusing to resume or silently regenerate over it.`,
      });
    }

    // Freshness against the EXACT claim set considered at clearance --
    // reuses THIS run's own topic-selection evidence fetch
    // (selected.v1_result.candidate_claim_ids), never a second live
    // fetch, since it is the same "current candidate set" value the
    // rest of this run already trusts.
    const freshness = resolveBundleFreshnessFn(loaded.bundle, selected.v1_result.candidate_claim_ids);
    candidateResume.freshness_state = freshness.state;
    if (freshness.state === FRESHNESS_STATE.FRESHNESS_CHECK_FAILED) {
      return finish({
        candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
        final_state: RUN_FINAL_STATE.INFRA_REVIEW,
        exception_reason: `Durable candidate bundle freshness check failed for "${selected.topic_slug}" (${freshness.reason}) -- refusing to reuse or regenerate in the same run.`,
      });
    }

    if (freshness.state === FRESHNESS_STATE.FRESH) {
      bundleDraft = loaded.bundle;
      candidateResume.reused = true;
      const stage = determineResumeStage(bundleDraft);
      candidateResume.resumed_from_stage = stage;

      if (stage === RESUME_STAGE.EDITORIAL_REVIEW) {
        // BOUNDED FRAMING-REMOVAL REPAIR (docs/education/AIMT-EDUCATION-
        // OPERATIONS-v1.md): a durable EDITORIAL_REVIEW candidate whose
        // Reviewer verdict failed ONLY on removable FRAMING gets exactly
        // one deterministic repair + one Reviewer retry here, with ZERO
        // Intent Planner / Publication Editor / Writer calls -- this is
        // precisely the "resume THIS existing durable bundle, finish the
        // candidate already generated" case the repair exists for.
        const framingRepairOutcome = await attemptReviewerFramingRepair(env, {
          bundleDraft,
          plan: bundleDraft.page_plan,
          clearedSnapshot: bundleDraft.fingerprint_input,
          validationContext: { expectedTopicSlug: selected.topic_slug, expectedCluster: clusterKey, expectedRoute: bundleDraft.route },
          reviewFn, writeBundleFn, topicSlug: selected.topic_slug, modelCalls, fns,
        });
        if (framingRepairOutcome.callFailed) {
          return finish({
            candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
            publication_editor_result: { status: 'AUTO_READY', generation_source_hash: bundleDraft.generation_source_hash },
            writer_result: { valid: true, ...(bundleDraft.deterministic_repair ? { deterministic_repair: bundleDraft.deterministic_repair } : {}) },
            final_state: RUN_FINAL_STATE.CONFIG_BLOCKED,
            exception_reason: framingRepairOutcome.exceptionReason,
          });
        }
        if (framingRepairOutcome.attempted) {
          bundleDraft = framingRepairOutcome.bundleDraft;
          return finish({
            candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
            publication_editor_result: { status: 'AUTO_READY', generation_source_hash: bundleDraft.generation_source_hash },
            writer_result: { valid: true, ...(bundleDraft.deterministic_repair ? { deterministic_repair: bundleDraft.deterministic_repair } : {}) },
            review_result: framingRepairOutcome.reviewResult,
            final_state: framingRepairOutcome.finalState,
            exception_reason: framingRepairOutcome.exceptionReason || framingRepairOutcome.reviewResult.summary,
            ...(framingRepairOutcome.finalState === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY ? {
              planned_route: bundleDraft.route,
              __internal: { preparedArtifact: bundleDraft.prepared_artifact, plan: framingRepairOutcome.plan, intentPlan: bundleDraft.intent_plan, route: bundleDraft.route },
            } : {}),
          });
        }

        // Not repairable (or already attempted) -- a governed, non-PASS
        // Reviewer verdict is already persisted; preserve it exactly,
        // never auto-retry any model for it.
        return finish({
          candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
          publication_editor_result: { status: 'AUTO_READY', generation_source_hash: bundleDraft.generation_source_hash },
          writer_result: { valid: true, ...(bundleDraft.deterministic_repair ? { deterministic_repair: bundleDraft.deterministic_repair } : {}) },
          review_result: bundleDraft.review_result,
          final_state: RUN_FINAL_STATE.EDITORIAL_REVIEW,
          exception_reason: bundleDraft.review_result.summary,
        });
      }
      if (stage === RESUME_STAGE.READY_FOR_PREPARE) {
        // Reviewer PASS is already persisted -- ZERO further model
        // calls needed; ready for a future --prepare exactly as-is.
        return finish({
          candidate_topics: candidateTopics, selected_topic: selected.topic_slug, selection_reason: selection.selection_reason,
          risk_tier: selected.v1_result.risk_tier, readiness_result: selected.v1_result.readiness_status,
          publication_editor_result: { status: 'AUTO_READY', generation_source_hash: bundleDraft.generation_source_hash },
          writer_result: { valid: true, ...(bundleDraft.deterministic_repair ? { deterministic_repair: bundleDraft.deterministic_repair } : {}) },
          review_result: bundleDraft.review_result,
          planned_route: bundleDraft.route,
          final_state: RUN_FINAL_STATE.SHADOW_CANDIDATE_READY,
          __internal: { preparedArtifact: bundleDraft.prepared_artifact, plan: bundleDraft.page_plan, intentPlan: bundleDraft.intent_plan, route: bundleDraft.route },
        });
      }
      // NEEDS_WRITER or NEEDS_REVIEWER -- fall through below. Intent
      // Planner + Publication Editor are skipped entirely (their exact
      // trusted output is reused from bundleDraft); NEEDS_REVIEWER
      // additionally skips the Writer (its already-validated, possibly
      // repaired Page Plan is reused verbatim too).
    }
    // else: POTENTIAL_EVIDENCE_CHANGE -- bundleDraft stays null. The
    // stored candidate is legitimately stale (the underlying research
    // changed), never resumed, never blocking -- falls through to a
    // completely fresh pipeline run below, exactly as if no bundle had
    // ever existed for this topic. A fresh AUTO_READY later in THIS run
    // will simply overwrite it (see buildCandidateBundle below) -- that
    // overwrite is legitimate staleness-driven regeneration, not the
    // "later bad run erases a good candidate" failure mode this feature
    // exists to prevent (which is fully prevented by the FRESH branch
    // above never calling Publication Editor again in the first place).
  }

  let intentPlan, route, preparedArtifact, clearedSnapshot;

  if (!bundleDraft) {
    // --- 7. Intent planning ----------------------------------------------
    const planIntentFn = fns.planIntentFn || planPageIntent;
    const candidateEvidenceInventory = selected.v1_result.candidate_claim_ids.map((id) => ({ claim_id: id }));

    const intentResult = await planIntentFn(env, {
      topicSlug: selected.topic_slug,
      seoPageConcept: selected.concept.seo_page_concept,
      riskTier: selected.v1_result.risk_tier,
      cluster: clusterKey,
      routePrefix: cluster.route_prefix,
      registeredRouteSlug: selected.concept.route_slug,
      candidateEvidenceInventory,
      existingClusterPages,
    });
    if (intentResult.ok) modelCalls.push({ role: 'intent_planner', actual_call_count: 1, ...intentResult.usage });
    if (!intentResult.ok) {
      return finish({ candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier, final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: `Intent planner call failed: ${intentResult.reason}` });
    }

    const intentValidation = validateIntentPlan(intentResult.output, {
      expectedTopicSlug: selected.topic_slug, expectedCluster: clusterKey,
    });
    if (!intentValidation.valid) {
      // A planner reaching outside the publication registry (a topic,
      // cluster, or route the registry did not assign) is an
      // architecture-safety failure -- INFRA_REVIEW, same class as the
      // route-collision guard below -- never a content-scope judgment.
      const registryBoundaryCodes = ['UNREGISTERED_PUBLICATION_CONCEPT', 'CLUSTER_NOT_REGISTERED_FOR_TOPIC', 'ROUTE_SLUG_NOT_REGISTERED'];
      const isRegistryBoundary = intentValidation.violations.some((v) => registryBoundaryCodes.includes(v));
      return finish({
        candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
        final_state: isRegistryBoundary ? RUN_FINAL_STATE.INFRA_REVIEW : RUN_FINAL_STATE.HUMAN_REVIEW,
        exception_reason: isRegistryBoundary
          ? `Intent plan reached outside the publication registry: ${intentValidation.violations.join(', ')}`
          : `Intent plan requested unsupported scope: ${intentValidation.violations.join(', ')}`,
      });
    }
    intentPlan = intentResult.output;
    // The registry's deterministic route; validateIntentPlan() has
    // already required intentPlan.route_slug to equal the registered
    // route_slug, so this is the same value -- but the authority is the
    // registry, never the model's echo.
    route = registeredRoute;

    // --- ROUTE-COLLISION GUARD (before spending a synthesis call) --------
    // A planner choosing a route_slug that happens to match a CURRENTLY
    // LIVE page (e.g. "telogen-effluvium" for an unrelated topic) would
    // otherwise compute the exact route/file the real, live page already
    // occupies -- and the generated-diff allowlist alone would not catch
    // it, since that path is still inside education/**. Checked here,
    // early, against the SAME trusted route data used for related_links
    // (never a guess), so a colliding candidate fails cheaply as
    // INFRA_REVIEW rather than after 1-3 more model calls are spent on it.
    const routeGuard = checkRouteNotAlreadyPublished(route, trustedPublishedRoutes);
    if (!routeGuard.valid) {
      return finish({
        candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
        final_state: RUN_FINAL_STATE.INFRA_REVIEW, exception_reason: `Route collision: ${routeGuard.violations.join(', ')}`,
      });
    }

    // --- Publication Editor synthesis (EXACTLY ONCE; see education-synthesis-cache.mjs) ---
    // HARDENING (real GitHub Actions shadow-run failure): prepareTopicArtifact()
    // / runSynthesisPipeline() must never be allowed to throw uncaught here --
    // the exact failure this guards against is a topic with no registered
    // page synthesis intent and no (or a malformed) explicit pageIntent,
    // which used to crash main() BEFORE persistRunReport() ever ran, leaving
    // the workflow with no run ledger at all. A governed model OUTCOME
    // (HUMAN_REVIEW, SYNTHESIS_FAILED) never reaches this catch -- those are
    // already returned as normal tagged results by prepareTopicArtifact()
    // and handled by the `!synthesisResult.ok` branch below. This is for
    // genuinely THROWN architecture/configuration exceptions only.
    let synthesisResult;
    try {
      synthesisResult = await prepareTopicArtifact(env, {
        topicSlug: selected.topic_slug,
        controlledTopic: selected.concept.controlled_topics.length === 1 ? selected.concept.controlled_topics[0] : null,
        v1Result: selected.v1_result,
        pageIntent: { page_concept: intentPlan.page_concept, public_intent: intentPlan.public_intent, in_scope_concepts: intentPlan.in_scope_concepts, out_of_scope_concepts: intentPlan.out_of_scope_concepts },
        evidenceRows: evidencePool,
      }, fns);
    } catch (err) {
      const isConfigError = err && (err.name === 'PublicationEditorModelConfigError' || err.name === 'EducationOpsModelConfigError');
      return finish({
        candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
        final_state: isConfigError ? RUN_FINAL_STATE.CONFIG_BLOCKED : RUN_FINAL_STATE.INFRA_REVIEW,
        exception_reason: `Publication Editor bridge threw an unexpected exception (${err && err.name || 'Error'}): ${err && err.message}`,
      });
    }
    if (synthesisResult.pipelineMetrics) {
      modelCalls.push({
        role: 'publication_editor',
        // Publication Editor's OWN bounded pipeline may issue up to 3 real
        // model calls (1 initial + <=1 reconciliation + <=1 full retry,
        // unchanged, existing behavior) -- actual_call_count carries that
        // TRUE count, never assumed to be 1, so the run ledger's ceiling
        // enforcement (MAX_EDUCATION_OPS_MODEL_CALLS_PER_RUN) reflects
        // reality rather than "4 conceptual roles".
        actual_call_count: synthesisResult.pipelineMetrics.model_calls,
        model_calls: synthesisResult.pipelineMetrics.model_calls,
        input_tokens: synthesisResult.pipelineMetrics.total_input_tokens,
        output_tokens: synthesisResult.pipelineMetrics.total_output_tokens,
      });
    }

    if (!synthesisResult.ok) {
      const isHumanReview = synthesisResult.status === 'HUMAN_REVIEW';
      const humanReviewReasonCode = synthesisResult.humanReviewJustification && synthesisResult.humanReviewJustification.reason_code;
      const isEvidenceInsufficiency = isHumanReview && humanReviewReasonCode === 'EVIDENCE_INSUFFICIENCY';

      // RESEARCH-GAP FEEDBACK LOOP v1 (section 3): a VALIDATED
      // EVIDENCE_INSUFFICIENCY is not a scientific/safety/institutional
      // exception -- it is ordinary evidence acquisition. With the loop
      // enabled, route it to Rick (research_verification_queue, lane=
      // publication_evidence_gap) instead of the owner's human-review
      // queue. Every OTHER HUMAN_REVIEW reason_code (UNRESOLVED_
      // CONTRADICTION, SAFETY_OR_SCOPE_CONCERN, HIGH_RISK_CONTENT,
      // OTHER_SUBSTANTIVE_EXCEPTION, ...) is completely unaffected --
      // still routes to the normal human-review path below, unchanged.
      if (isEvidenceInsufficiency && researchGapLoopEnabled) {
        const upsertFn = fns.upsertEvidenceInsufficiencyGapFn || upsertEvidenceInsufficiencyGap;
        // FAIL CLOSED (correction): a queue WRITE failure here is an
        // infrastructure fault, never silently swallowed and never
        // reported as if the gap were actually queued. No model retry --
        // stop the run here, exactly like the PE-bridge hardening above.
        let upsertResult;
        try {
          upsertResult = await upsertFn(env, {
            topicSlug: selected.topic_slug,
            cluster: clusterKey,
            pageConcept: intentPlan.page_concept,
            publicIntent: intentPlan.public_intent,
            inScopeConcepts: intentPlan.in_scope_concepts,
            gapSummary: synthesisResult.humanReviewJustification.reason,
            originatingRunId: runId,
            originatingPageIntent: intentPlan,
            baselineCandidateClaimIds: selected.v1_result.candidate_claim_ids,
            // CORRECTION 1: the exact controlled research topics this
            // page concept covers, stored on the gap so a later targeted
            // research submission can be checked for RELEVANCE (see
            // education-research-gap-queue.mjs#hasRelevantVerifiedClaim)
            // -- an accepted claim about a completely different topic
            // must never be mistaken for having filled this gap.
            controlledTopics: selected.concept.controlled_topics,
          });
        } catch (err) {
          return finish({
            candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
            final_state: RUN_FINAL_STATE.INFRA_REVIEW,
            exception_reason: `Research-gap queue upsert failed for "${selected.topic_slug}" (${err && err.name || 'Error'}): ${err && err.message} -- refusing to report RESEARCH_GAP_QUEUED for a write that did not actually happen.`,
          });
        }
        const { row: gapRow, action: gapAction } = upsertResult;
        common.research_gap_action = {
          enabled: true, action: gapAction, gap_id: gapRow.queue_id,
          topic_slug: selected.topic_slug, attempt_count: gapRow.extras.attempt_count,
        };
        // Deliberately NO GitHub Issue for this state (section 3.5) --
        // RESEARCH_GAP_QUEUED is absent from education-exception-
        // reporter.mjs's FINAL_STATE_TO_LABEL map by construction.
        return finish({
          candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
          publication_editor_result: { status: synthesisResult.status, reason: synthesisResult.reason, validator_violation_codes: [], human_review_justification: synthesisResult.humanReviewJustification },
          final_state: RUN_FINAL_STATE.RESEARCH_GAP_QUEUED,
          exception_reason: `Routed to the research-gap queue (${gapRow.queue_id}, attempt ${gapRow.extras.attempt_count}): ${synthesisResult.humanReviewJustification.reason}`,
        });
      }

      // RELEASE (section 5, CORRECTED): Publication Editor returning a
      // VALID governed outcome that is NOT EVIDENCE_INSUFFICIENCY is only
      // proof the evidence-insufficiency blocker is resolved when that
      // outcome is itself a genuine HUMAN_REVIEW verdict (a different
      // valid reason_code -- UNRESOLVED_CONTRADICTION,
      // SAFETY_OR_SCOPE_CONCERN, HIGH_RISK_CONTENT,
      // OTHER_SUBSTANTIVE_EXCEPTION, ...). A mechanical/accounting
      // SYNTHESIS_FAILED proves NOTHING about whether evidence is now
      // sufficient -- it is infrastructure/model-output noise, and
      // resolving the gap on it would silently lose the research-
      // feedback state for no reason. isHumanReview is already known
      // false here to mean SYNTHESIS_FAILED (isEvidenceInsufficiency,
      // the only other HUMAN_REVIEW case, already returned above).
      if (researchGapLoopEnabled && existingGapForSelectedTopic && isHumanReview) {
        const resolveFn = fns.resolveResearchGapByTopicFn || resolveResearchGapByTopic;
        try {
          await resolveFn(env, selected.topic_slug);
        } catch (err) {
          return finish({
            candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
            final_state: RUN_FINAL_STATE.INFRA_REVIEW,
            exception_reason: `Research-gap queue resolve failed for "${selected.topic_slug}" (${err && err.name || 'Error'}): ${err && err.message} -- refusing to report a HUMAN_REVIEW outcome that assumed the gap was resolved when the write did not actually happen.`,
          });
        }
        common.research_gap_action = {
          enabled: true, action: 'RESOLVED', gap_id: existingGapForSelectedTopic.queue_id,
          topic_slug: selected.topic_slug, attempt_count: existingGapForSelectedTopic.extras.attempt_count,
        };
      }

      // OBSERVABILITY (real recurring shadow-run failure, alopecia-areata
      // Runs #4-#6: repeated SYNTHESIS_FAILED /
      // unresolved_mechanical_or_accounting_violation with no visibility
      // into WHICH deterministic validator rule(s) actually fired):
      // prepareTopicArtifact() already threads the orchestrator's raw
      // internal violations through as synthesisResult.violations --
      // sanitized here (CODE only, never a claim id/source id suffix)
      // before it ever reaches a run report or a GitHub Issue.
      return finish({
        candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
        publication_editor_result: {
          status: synthesisResult.status,
          reason: synthesisResult.reason,
          validator_violation_codes: sanitizePublicationValidatorViolations(synthesisResult.violations),
          human_review_justification: synthesisResult.humanReviewJustification,
        },
        final_state: isHumanReview ? RUN_FINAL_STATE.HUMAN_REVIEW : RUN_FINAL_STATE.NO_OP_SUCCESS,
        exception_reason: isHumanReview ? `HUMAN_REVIEW: ${synthesisResult.humanReviewJustification && synthesisResult.humanReviewJustification.reason}` : synthesisResult.reason,
      });
    }

    // RELEASE (section 5): Publication Editor reached AUTO_READY -- any
    // pre-existing gap for this topic is resolved; the run continues
    // normally (Writer/Reviewer) exactly as it always has. FAIL CLOSED
    // (correction): a write failure here stops the run immediately,
    // BEFORE Writer/Reviewer ever spend a model call, rather than
    // continuing on an inconsistent research-gap state.
    if (researchGapLoopEnabled && existingGapForSelectedTopic) {
      const resolveFn = fns.resolveResearchGapByTopicFn || resolveResearchGapByTopic;
      try {
        await resolveFn(env, selected.topic_slug);
      } catch (err) {
        return finish({
          candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
          final_state: RUN_FINAL_STATE.INFRA_REVIEW,
          exception_reason: `Research-gap queue resolve failed for "${selected.topic_slug}" (${err && err.name || 'Error'}): ${err && err.message} -- refusing to proceed to Writer/Reviewer on an inconsistent research-gap state.`,
        });
      }
      common.research_gap_action = {
        enabled: true, action: 'RESOLVED', gap_id: existingGapForSelectedTopic.queue_id,
        topic_slug: selected.topic_slug, attempt_count: existingGapForSelectedTopic.extras.attempt_count,
      };
    }

    preparedArtifact = synthesisResult.preparedArtifact;
    clearedSnapshot = preparedArtifact.record.publication_clearance.fingerprint_input;

    // Publication Editor just succeeded FRESH -- durably persist the
    // candidate immediately, before anything else in this run can fail.
    // A LATER run (even if THIS run fails at Writer/Reviewer) must never
    // re-invoke Publication Editor for this topic again; see the
    // module header / Run #3 -> Run #4 regression this feature fixes.
    bundleDraft = buildCandidateBundle({ runId, topicSlug: selected.topic_slug, cluster: clusterKey, route, intentPlan, preparedArtifact });
    writeBundleFn(selected.topic_slug, bundleDraft);
  } else {
    // Resuming at NEEDS_WRITER or NEEDS_REVIEWER -- Publication Editor's
    // exact artifact is already durably persisted; reuse it verbatim,
    // never re-derive or re-call anything for it (EXACT-ARTIFACT RULE).
    intentPlan = bundleDraft.intent_plan;
    route = bundleDraft.route;
    preparedArtifact = bundleDraft.prepared_artifact;
    clearedSnapshot = preparedArtifact.record.publication_clearance.fingerprint_input;
  }

  // --- Education Writer ---------------------------------------------------
  let plan, deterministicRepair;

  if (bundleDraft.page_plan && bundleDraft.writer_validation && bundleDraft.writer_validation.valid === true) {
    // NEEDS_REVIEWER resume: the exact, already-validated (and, if it
    // needed one, already-repaired) Page Plan is reused verbatim --
    // never re-derived independently, never re-validated from scratch
    // (it already was, the run that produced it).
    plan = bundleDraft.page_plan;
    deterministicRepair = bundleDraft.deterministic_repair || null;
  } else {
    const writeFn = fns.writeFn || writeEducationPagePlan;
    const writerResult = await writeFn(env, { intentPlan, clearedSnapshot, route, cluster: clusterKey, existingClusterPages });
    if (writerResult.ok) modelCalls.push({ role: 'education_writer', actual_call_count: 1, ...writerResult.usage });
    if (!writerResult.ok) {
      return finish({ candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier, publication_editor_result: { status: 'AUTO_READY' }, final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: `Writer call failed: ${writerResult.reason}` });
    }

    // SOURCE/LINK AUTHORITY CORRECTION: the model's own output NEVER
    // carries sources/related_links (see EDUCATION_WRITER_OUTPUT_JSON_SCHEMA
    // -- there is no schema slot for either). Both are attached here,
    // deterministically, from trusted data only: sources from the cleared
    // snapshot's own citation_map (education-source-authority.mjs), links
    // from the trusted sibling-page data already resolved above
    // (education-related-links.mjs). The model never sees either value
    // and cannot influence it.
    plan = {
      ...writerResult.output,
      sources: buildTrustedSources(clearedSnapshot),
      related_links: buildEducationRelatedLinks({
        clusterLabel: cluster.label,
        clusterRoutePrefix: cluster.route_prefix,
        siblingPages: trustedSiblingPages,
      }),
    };

    // ROUTE-COLLISION CORRECTION (Page Plan validator context): the plan
    // is never validated in isolation from the orchestration decision --
    // the model cannot redirect the page by disagreeing with its own
    // topic_slug/cluster/route. A mismatch here is an architecture-safety
    // signal (INFRA_REVIEW), not a content-quality one (EDITORIAL_REVIEW).
    const planValidation = validateEducationPagePlan(plan, clearedSnapshot, {
      expectedTopicSlug: selected.topic_slug, expectedCluster: clusterKey, expectedRoute: route,
    });
    deterministicRepair = null;
    if (!planValidation.valid) {
      const isRouteCollisionClass = planValidation.violations.some((v) => v.startsWith('PLAN_TOPIC_SLUG_MISMATCH') || v.startsWith('PLAN_CLUSTER_MISMATCH') || v.startsWith('PLAN_ROUTE_MISMATCH'));
      if (isRouteCollisionClass) {
        return finish({
          candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
          publication_editor_result: { status: 'AUTO_READY' }, writer_result: { valid: false, violations: planValidation.violations },
          final_state: RUN_FINAL_STATE.INFRA_REVIEW,
          exception_reason: `Page Plan failed deterministic validation: ${planValidation.violations.join(', ')}`,
        });
      }

      // NUMERIC-FIDELITY REPAIR LANE: a Writer defect where a digit-bearing
      // unit is a PARAPHRASE (or a VERBATIM unit whose text drifted) is
      // deterministically repairable ONLY when EVERY violation on the plan
      // is an UNSUPPORTED_NUMERIC_CLAIM -- any other violation (ungrounded
      // claim, dropped scope_note, duplicate text, etc.) is never touched
      // by this lane and falls straight through to EDITORIAL_REVIEW below,
      // exactly as before this repair lane existed. The repair never asks
      // a model to rewrite anything (education-page-plan-repair.mjs is
      // pure/zero-network) and never weakens the validator: the repaired
      // plan is re-validated in full, from scratch, by the same
      // validateEducationPagePlan() used everywhere else.
      const allNumericFidelity = planValidation.violations.every((v) => v.startsWith('UNSUPPORTED_NUMERIC_CLAIM:'));
      const repairFn = fns.repairFn || repairDeterministicPagePlanViolations;
      const repairOutcome = allNumericFidelity ? repairFn(plan, clearedSnapshot, planValidation.violations) : null;
      const revalidation = repairOutcome ? validateEducationPagePlan(repairOutcome.repairedPlan, clearedSnapshot, {
        expectedTopicSlug: selected.topic_slug, expectedCluster: clusterKey, expectedRoute: route,
      }) : null;

      if (revalidation && revalidation.valid) {
        plan = repairOutcome.repairedPlan;
        deterministicRepair = { attempted: true, repaired_locations: repairOutcome.repairReport.repaired_locations, repair_type: repairOutcome.repairReport.repair_type };
      } else {
        // Writer stage did not resolve to a valid plan this run --
        // CRITICAL RULE: still durably persist bundleDraft AS-IS (page_plan
        // stays null, writer_validation records the failure) so a LATER
        // run retries ONLY the Writer, never Publication Editor again.
        bundleDraft = advanceCandidateBundle(bundleDraft, {
          pagePlan: null,
          writerValidation: {
            valid: false,
            violations: (revalidation || planValidation).violations,
            ...(repairOutcome ? { deterministic_repair: { attempted: true, repaired_locations: repairOutcome.repairReport.repaired_locations, unresolved_locations: repairOutcome.repairReport.unresolved_locations, reason: repairOutcome.repairReport.reason } } : {}),
          },
          deterministicRepair: null,
        });
        writeBundleFn(selected.topic_slug, bundleDraft);
        return finish({
          candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
          publication_editor_result: { status: 'AUTO_READY' },
          writer_result: {
            valid: false,
            violations: (revalidation || planValidation).violations,
            ...(repairOutcome ? { deterministic_repair: { attempted: true, repaired_locations: repairOutcome.repairReport.repaired_locations, unresolved_locations: repairOutcome.repairReport.unresolved_locations, reason: repairOutcome.repairReport.reason } } : {}),
          },
          final_state: RUN_FINAL_STATE.EDITORIAL_REVIEW,
          exception_reason: `Page Plan failed deterministic validation: ${planValidation.violations.join(', ')}`,
        });
      }
    }

    // Writer stage resolved to a VALID plan (directly or via repair)
    // this run -- advance and persist the durable candidate before
    // moving on to the Reviewer, so a later run that never reaches the
    // Reviewer this run (e.g. the Reviewer call itself fails) still
    // resumes at NEEDS_REVIEWER next time, never redoing the Writer.
    bundleDraft = advanceCandidateBundle(bundleDraft, {
      pagePlan: plan,
      writerValidation: { valid: true },
      deterministicRepair,
    });
    writeBundleFn(selected.topic_slug, bundleDraft);
  }

  // --- Education Reviewer --------------------------------------------------
  const reviewResult = await reviewFn(env, { plan, clearedSnapshot, intentPlan });
  if (reviewResult.ok) modelCalls.push({ role: 'education_reviewer', actual_call_count: 1, ...reviewResult.usage });
  if (!reviewResult.ok) {
    return finish({ candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier, publication_editor_result: { status: 'AUTO_READY' }, writer_result: { valid: true, ...(deterministicRepair ? { deterministic_repair: deterministicRepair } : {}) }, final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: `Reviewer call failed: ${reviewResult.reason}` });
  }
  const outcome = aggregateReviewOutcome(reviewResult.output);
  if (outcome.outcome !== REVIEW_OUTCOME.PASS) {
    bundleDraft = advanceCandidateBundle(bundleDraft, { reviewResult: outcome });
    writeBundleFn(selected.topic_slug, bundleDraft);

    // FRESH-RUN FRAMING-REMOVAL REPAIR (section 8): the identical bounded
    // repair as the EDITORIAL_REVIEW resume branch above, so a framing-
    // only CARRIES_SCIENCE failure never needs a second GitHub Actions
    // run just to perform this safe, deterministic removal.
    const framingRepairOutcome = await attemptReviewerFramingRepair(env, {
      bundleDraft,
      plan,
      clearedSnapshot,
      validationContext: { expectedTopicSlug: selected.topic_slug, expectedCluster: clusterKey, expectedRoute: route },
      reviewFn, writeBundleFn, topicSlug: selected.topic_slug, modelCalls, fns,
    });
    if (framingRepairOutcome.callFailed) {
      return finish({
        candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
        publication_editor_result: { status: 'AUTO_READY' }, writer_result: { valid: true, ...(deterministicRepair ? { deterministic_repair: deterministicRepair } : {}) },
        final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: framingRepairOutcome.exceptionReason,
      });
    }
    if (framingRepairOutcome.attempted) {
      bundleDraft = framingRepairOutcome.bundleDraft;
      return finish({
        candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
        publication_editor_result: { status: 'AUTO_READY' }, writer_result: { valid: true, ...(deterministicRepair ? { deterministic_repair: deterministicRepair } : {}) },
        review_result: framingRepairOutcome.reviewResult,
        final_state: framingRepairOutcome.finalState,
        exception_reason: framingRepairOutcome.exceptionReason || framingRepairOutcome.reviewResult.summary,
        ...(framingRepairOutcome.finalState === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY ? {
          selection_reason: selection.selection_reason, readiness_result: selected.v1_result.readiness_status,
          planned_route: route,
          __internal: { preparedArtifact, plan: framingRepairOutcome.plan, intentPlan, route },
        } : {}),
      });
    }

    return finish({
      candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
      publication_editor_result: { status: 'AUTO_READY' }, writer_result: { valid: true, ...(deterministicRepair ? { deterministic_repair: deterministicRepair } : {}) },
      review_result: outcome, final_state: RUN_FINAL_STATE.EDITORIAL_REVIEW, exception_reason: outcome.summary,
    });
  }

  // --- Everything passed: this is a SHADOW_CANDIDATE_READY result --------
  bundleDraft = advanceCandidateBundle(bundleDraft, { reviewResult: outcome });
  writeBundleFn(selected.topic_slug, bundleDraft);
  return finish({
    candidate_topics: candidateTopics,
    selected_topic: selected.topic_slug,
    selection_reason: selection.selection_reason,
    risk_tier: selected.v1_result.risk_tier,
    readiness_result: selected.v1_result.readiness_status,
    publication_editor_result: { status: 'AUTO_READY', generation_source_hash: preparedArtifact.record.generation_source_hash },
    writer_result: { valid: true, ...(deterministicRepair ? { deterministic_repair: deterministicRepair } : {}) },
    review_result: outcome,
    planned_route: route,
    final_state: RUN_FINAL_STATE.SHADOW_CANDIDATE_READY,
    // Not part of buildRunReport's typed fields, but useful for --prepare
    // to consume without re-deriving anything -- attached separately.
    __internal: { preparedArtifact, plan, intentPlan, route },
  });
}

/** Writes a run report to research-import/education-ops/ (gitignored). */
export function persistRunReport(report) {
  const dir = path.join(ROOT, 'research-import', 'education-ops', 'runs');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${report.run_id}.json`);
  writeFileSync(filePath, JSON.stringify(report, null, 2));
  return filePath;
}

/**
 * --prepare's file-writing step. Called ONLY when a decision pipeline
 * run resolved to SHADOW_CANDIDATE_READY. Writes:
 *   - the article HTML (education/<cluster route>/<slug>.html)
 *   - the Page Plan data artifact (functions/_data/education-page-plans/<slug>.json)
 *   - an updated cluster hub file (one new card, existing pattern)
 * Deliberately does NOT touch sitemap.xml -- a --prepare'd page is
 * noindex/nofollow and NOT yet owner-approved, matching every prior
 * Education page's own launch sequence (sitemap entry is a LAUNCH-time
 * action, not a prepare-time one -- see docs/seo/AIMT-SEO-CLOSEOUT-2026-09.md).
 * Runs the generated-diff allowlist check before returning success --
 * any unexpected touched file is an INFRA_REVIEW, and this function
 * throws rather than letting the caller proceed to a commit.
 *
 * @param {object} report - a SHADOW_CANDIDATE_READY runDecisionPipeline() result
 * @returns {{articlePath: string, planArtifactPath: string, hubPath: string, allowlistResult: object}}
 */
export function prepareGeneratedArtifacts(report) {
  if (report.final_state !== RUN_FINAL_STATE.SHADOW_CANDIDATE_READY || !report.__internal) {
    throw new Error('prepareGeneratedArtifacts: report is not a SHADOW_CANDIDATE_READY result.');
  }
  const { preparedArtifact, plan, route } = report.__internal;

  const relativeArticlePath = educationArticlePathFromRoute(route);
  const articlePath = path.join(ROOT, relativeArticlePath);
  const relativePlanPath = `functions/_data/education-page-plans/${plan.topic_slug}.json`;
  const planArtifactPath = path.join(ROOT, relativePlanPath);

  // ROUTE-COLLISION CORRECTION (file-existence gate, checked BEFORE any
  // write): runDecisionPipeline() already checked the computed route
  // against currently LIVE (published) pages, but that says nothing
  // about a STALE local file left behind by a prior, never-merged
  // --prepare run for this exact topic/route -- e.g. this same CLI
  // invoked twice against an uncommitted worktree. Never overwrite an
  // existing page in this new-page lane; a future freshness/update lane
  // that intentionally replaces an existing page is an explicit,
  // separate contract, not built here.
  if (existsSync(articlePath)) {
    throw new Error(`prepareGeneratedArtifacts: INFRA_REVIEW -- target article file already exists, refusing to overwrite: ${relativeArticlePath}`);
  }
  if (existsSync(planArtifactPath)) {
    throw new Error(`prepareGeneratedArtifacts: INFRA_REVIEW -- target Page Plan artifact already exists, refusing to overwrite: ${relativePlanPath}`);
  }

  mkdirSync(path.dirname(articlePath), { recursive: true });
  writeFileSync(articlePath, renderEducationPageHtml(plan));

  mkdirSync(path.dirname(planArtifactPath), { recursive: true });
  writeFileSync(planArtifactPath, JSON.stringify({
    topic_slug: plan.topic_slug,
    page_plan_version: 'education-page-plan-v1',
    plan,
    generation_source_hash: preparedArtifact.record.generation_source_hash,
    prepared_at: preparedArtifact.prepared_at,
    writer_provenance: { contract_version: 'education-writer-v1' },
  }, null, 2));

  // Cluster hub: resolved from the publication registry for this
  // route's cluster (e.g. /education/scalp-health/<slug> ->
  // education/scalp-health.html) -- never string surgery on the route.
  const { hubFile: relativeHubPath, hubRoute } = resolveHubForRoute(route);
  const hubPath = path.join(ROOT, relativeHubPath);
  const hubHtml = readFileSync(hubPath, 'utf8');
  const cardHtml = buildHubCardHtml({ route, h1: plan.h1, meta_description: plan.meta_description, sourceCount: plan.sources.length });
  writeFileSync(hubPath, insertHubCard(hubHtml, cardHtml, { hubRoute }));

  const changedPaths = execFileSync('git', ['diff', '--name-only'], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  const allowlistResult = checkGeneratedDiffAllowlist(changedPaths);
  if (!allowlistResult.valid) {
    throw new Error(`prepareGeneratedArtifacts: generated diff touched unexpected path(s), INFRA_REVIEW: ${allowlistResult.violations.join(', ')}`);
  }

  return { articlePath: relativeArticlePath, planArtifactPath: relativePlanPath, hubPath: relativeHubPath, allowlistResult };
}

/**
 * Creates a branch, commits the artifacts prepareGeneratedArtifacts()
 * wrote, pushes it, and opens a PR targeting main -- never merges.
 * Uses the same git/gh CLI invocations as every other branch in this
 * repo's history, via execFileSync (argument arrays, never a shell
 * string) so no path/title value can be interpreted as a shell command.
 */
export function openPreparedPr({ topicSlug, articlePath, planArtifactPath, hubPath, runId }) {
  const branch = `education-ops/${topicSlug}-${runId.slice(0, 8)}`;
  execFileSync('git', ['checkout', '-b', branch], { cwd: ROOT, stdio: 'inherit' });
  execFileSync('git', ['add', articlePath, planArtifactPath, hubPath], { cwd: ROOT, stdio: 'inherit' });
  execFileSync('git', ['commit', '-m', `Education Operations: prepare ${topicSlug} (shadow-validated, not yet approved)`], { cwd: ROOT, stdio: 'inherit' });
  execFileSync('git', ['push', '-u', 'origin', branch], { cwd: ROOT, stdio: 'inherit' });
  const prUrl = execFileSync('gh', [
    'pr', 'create', '--base', 'main', '--head', branch,
    '--title', `[Education Operations] Prepared: ${topicSlug} (DO NOT MERGE without owner review)`,
    '--body', `Autonomously prepared by AIMT Education Operations v1 (run ${runId}). Passed topic selection, intent planning, Publication Editor synthesis, Education Writer, Education Reviewer, and the generated-diff allowlist. NOT owner-approved -- noindex/nofollow, not in sitemap. Requires human review before AUTOPUBLISH would ever merge this automatically.`,
  ], { cwd: ROOT, encoding: 'utf8' }).trim();
  return { branch, prUrl };
}

/* ═══════════════════════════════════════════════════════════════
   PRODUCTION PUBLISH LANE (--publish)
   ---------------------------------------------------------------
   See docs/education/AIMT-EDUCATION-OPERATIONS-v1.md's "Production
   publish lane" section for the full narrative. Summary: this is the
   ONLY code in this file allowed to merge a PR, wait for a Cloudflare
   production deployment, verify a live route, or call
   publishClearanceRecord(). It NEVER imports the intent planner,
   Publication Editor, Writer, or Reviewer client modules -- the durable
   candidate bundle it loads read-only is the ONLY source of the plan,
   Publication Editor's exact artifact, and the Reviewer PASS verdict.
   runPublicationPipeline() is therefore structurally incapable of a
   model call, regardless of what state it resumes from.
   ═══════════════════════════════════════════════════════════════ */

/** Durable publication-manifest location -- same one-file-per-topic,
    upload/download-as-a-named-GitHub-Actions-artifact pattern as
    candidateBundlePath() above (see education-publication-state.mjs). */
function publicationManifestPath(topicSlug) {
  return path.join(ROOT, 'research-import', 'education-ops', 'publications', topicSlug, 'manifest.json');
}

export function loadPublicationManifest(topicSlug) {
  const filePath = publicationManifestPath(topicSlug);
  if (!existsSync(filePath)) return { found: false, manifest: null };
  try {
    return { found: true, manifest: JSON.parse(readFileSync(filePath, 'utf8')) };
  } catch (err) {
    return { found: true, manifest: null, parseError: err.message };
  }
}

export function writePublicationManifest(topicSlug, manifest) {
  const filePath = publicationManifestPath(topicSlug);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(manifest, null, 2));
  return filePath;
}

/**
 * LAUNCH-READY generation -- same shape as prepareGeneratedArtifacts()
 * above, but for the production publish lane: the article HTML omits
 * the preview noindex tag and carries the deterministic generation
 * marker (education-page-renderer.mjs), and sitemap.xml gains the route
 * (education-sitemap-updater.mjs) -- a narrow, deterministic "launch
 * prep" transform, never a redesign; every existing file-existence /
 * generated-diff-allowlist guard applies exactly as it does for
 * --prepare.
 *
 * @param {{preparedArtifact: object, plan: object, route: string}} args
 * @returns {{articlePath: string, planArtifactPath: string, hubPath: string, sitemapPath: string, allowlistResult: object}}
 */
export function prepareLaunchArtifacts({ preparedArtifact, plan, route }) {
  const relativeArticlePath = educationArticlePathFromRoute(route);
  const articlePath = path.join(ROOT, relativeArticlePath);
  const relativePlanPath = `functions/_data/education-page-plans/${plan.topic_slug}.json`;
  const planArtifactPath = path.join(ROOT, relativePlanPath);
  const relativeSitemapPath = 'sitemap.xml';
  const sitemapPath = path.join(ROOT, relativeSitemapPath);

  if (existsSync(articlePath)) {
    throw new Error(`prepareLaunchArtifacts: INFRA_REVIEW -- target article file already exists, refusing to overwrite: ${relativeArticlePath}`);
  }
  if (existsSync(planArtifactPath)) {
    throw new Error(`prepareLaunchArtifacts: INFRA_REVIEW -- target Page Plan artifact already exists, refusing to overwrite: ${relativePlanPath}`);
  }

  mkdirSync(path.dirname(articlePath), { recursive: true });
  writeFileSync(articlePath, renderEducationPageHtml(plan, { launchReady: true, generationSourceHash: preparedArtifact.record.generation_source_hash }));

  mkdirSync(path.dirname(planArtifactPath), { recursive: true });
  writeFileSync(planArtifactPath, JSON.stringify({
    topic_slug: plan.topic_slug,
    page_plan_version: 'education-page-plan-v1',
    plan,
    generation_source_hash: preparedArtifact.record.generation_source_hash,
    prepared_at: preparedArtifact.prepared_at,
    writer_provenance: { contract_version: 'education-writer-v1' },
  }, null, 2));

  const { hubFile: relativeHubPath, hubRoute } = resolveHubForRoute(route);
  const hubPath = path.join(ROOT, relativeHubPath);
  const hubHtml = readFileSync(hubPath, 'utf8');
  const hubWasEmpty = isEmptyHub(hubHtml);
  const cardHtml = buildHubCardHtml({ route, h1: plan.h1, meta_description: plan.meta_description, sourceCount: plan.sources.length });
  writeFileSync(hubPath, insertHubCard(hubHtml, cardHtml, { hubRoute }));

  let sitemapXml = readFileSync(sitemapPath, 'utf8');
  // A cluster hub that was empty (noindex) until this card becomes
  // indexable with it (insertHubCard removes the marker) -- list it in
  // the sitemap in the same commit, exactly as the Hair Loss hub is.
  if (hubWasEmpty && !sitemapContainsRoute(sitemapXml, hubRoute)) {
    sitemapXml = insertSitemapRoute(sitemapXml, hubRoute);
  }
  writeFileSync(sitemapPath, insertSitemapRoute(sitemapXml, route));

  const changedPaths = execFileSync('git', ['diff', '--name-only'], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  const allowlistResult = checkGeneratedDiffAllowlist(changedPaths);
  if (!allowlistResult.valid) {
    throw new Error(`prepareLaunchArtifacts: generated diff touched unexpected path(s), INFRA_REVIEW: ${allowlistResult.violations.join(', ')}`);
  }

  return { articlePath: relativeArticlePath, planArtifactPath: relativePlanPath, hubPath: relativeHubPath, sitemapPath: relativeSitemapPath, allowlistResult };
}

/**
 * Opens the production publish PR on a DETERMINISTIC branch name (never
 * runId-suffixed, unlike openPreparedPr() above) -- so a later, separate
 * run can always find the SAME branch/PR for this topic via
 * ghPrListForBranch() and resume it, never opening a duplicate. Never
 * merges.
 */
/**
 * PURE command-argument construction for `gh pr create` -- separated
 * from openLaunchPr()'s actual execFileSync calls specifically so a
 * test can assert on the constructed argument array without shelling
 * out. `gh pr create` does NOT support `--json` (unlike `gh pr view`/
 * `gh pr list`) -- passing it is a runtime error, not a supported
 * interface. This function must never include `--json` in its output;
 * see the test asserting exactly that (the regression this guards
 * against actually shipped once).
 */
export function buildGhPrCreateArgs({ topicSlug, branch, runId }) {
  return [
    'pr', 'create', '--base', 'main', '--head', branch,
    '--title', `[Education Operations] Publish: ${topicSlug} (merges only when AUTOPUBLISH is enabled)`,
    '--body', `Autonomously prepared for PRODUCTION PUBLICATION by AIMT Education Operations v1 (run ${runId}). Removes the preview noindex tag and adds the route to sitemap.xml. Merges ONLY when AIMT_EDUCATION_AUTOPUBLISH_ENABLED === "true"; the DB row is never marked published without a subsequent confirmed live-route verification.`,
  ];
}

export function openLaunchPr({ topicSlug, articlePath, planArtifactPath, hubPath, sitemapPath, runId }) {
  const branch = publicationBranchName(topicSlug);
  execFileSync('git', ['checkout', '-b', branch], { cwd: ROOT, stdio: 'inherit' });
  execFileSync('git', ['add', articlePath, planArtifactPath, hubPath, sitemapPath], { cwd: ROOT, stdio: 'inherit' });
  execFileSync('git', ['commit', '-m', `Education Operations: publish ${topicSlug} (AUTOPUBLISH-gated, launch-ready)`], { cwd: ROOT, stdio: 'inherit' });
  execFileSync('git', ['push', '-u', 'origin', branch], { cwd: ROOT, stdio: 'inherit' });
  // `gh pr create` prints the created PR's URL as PLAIN TEXT on success
  // (it has no --json support at all) -- the structured identifiers
  // (number/headRefOid) are fetched via a SEPARATE, supported `gh pr
  // view` call against that URL immediately afterward.
  let prUrl;
  try {
    prUrl = execFileSync('gh', buildGhPrCreateArgs({ topicSlug, branch, runId }), { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch (err) {
    // The generated branch is owned by this publication attempt. If PR
    // creation itself fails (for example, repository Actions settings
    // disallow PR creation), remove the just-pushed orphan branch so a
    // later retry starts cleanly instead of hitting a non-fast-forward
    // push against stale generated bytes.
    try {
      execFileSync('git', ['push', 'origin', '--delete', branch], { cwd: ROOT, stdio: 'inherit' });
    } catch (_cleanupErr) {
      // Preserve the ORIGINAL PR-create failure. A later run will still
      // fail closed rather than pretending the PR exists.
    }
    throw err;
  }
  const created = ghPrView(prUrl);
  return { branch, prNumber: created.number, prUrl: created.url || prUrl, headRefOid: created.headRefOid };
}

function publicationBranchName(topicSlug) {
  return `education-ops/publish-${topicSlug}`;
}

function ghPrListForBranch(branch) {
  const out = execFileSync('gh', ['pr', 'list', '--head', branch, '--json', 'number,state,headRefOid,url', '--limit', '1'], { cwd: ROOT, encoding: 'utf8' });
  const rows = JSON.parse(out);
  return rows[0] || null;
}

/** `gh pr view` DOES support --json (unlike `gh pr create`, see
    buildGhPrCreateArgs() below) -- accepts a PR number, URL, or branch
    name interchangeably, so this same function serves both the
    post-create lookup and every later re-view. */
function ghPrView(prNumberOrUrl) {
  const out = execFileSync('gh', ['pr', 'view', String(prNumberOrUrl), '--json', 'number,url,state,headRefOid,files,mergeCommit'], { cwd: ROOT, encoding: 'utf8' });
  const raw = JSON.parse(out);
  return { number: raw.number, url: raw.url, state: raw.state, headRefOid: raw.headRefOid, files: raw.files || [], mergeCommitOid: raw.mergeCommit ? raw.mergeCommit.oid : null };
}

function ghPrMerge(prNumber) {
  execFileSync('gh', ['pr', 'merge', String(prNumber), '--merge', '--delete-branch'], { cwd: ROOT, stdio: 'inherit' });
  return ghPrView(prNumber);
}

/**
 * PURE regeneration of the article HTML + Page Plan JSON from the
 * SAME persisted plan/artifact, using the CURRENT deterministic
 * renderer/serialization code -- never re-derives the plan itself
 * (Intent Planner/Publication Editor/Writer/Reviewer are never
 * touched). Deliberately does NOT regenerate the hub card or sitemap
 * entry: neither is a function of the renderer (a fix like the
 * empty-section correction never changes them), and re-inserting either
 * would trip its own duplicate-route guard on a second pass. Returns
 * the newly-rendered contents WITHOUT writing anything -- the caller
 * decides what actually changed.
 */
export function regenerateLaunchArtifactContents({ preparedArtifact, plan }) {
  const articleHtml = renderEducationPageHtml(plan, { launchReady: true, generationSourceHash: preparedArtifact.record.generation_source_hash });
  const planArtifactJson = JSON.stringify({
    topic_slug: plan.topic_slug,
    page_plan_version: 'education-page-plan-v1',
    plan,
    generation_source_hash: preparedArtifact.record.generation_source_hash,
    prepared_at: preparedArtifact.prepared_at,
    writer_provenance: { contract_version: 'education-writer-v1' },
  }, null, 2);
  return { articleHtml, planArtifactJson };
}

/**
 * Safely refreshes an ALREADY-OPEN generated publish PR's article HTML
 * / Page Plan JSON in place, using regenerateLaunchArtifactContents()'s
 * CURRENT deterministic output. Checks out the EXISTING branch from
 * origin (never `checkout -b`, which would fail -- the branch already
 * exists), overwrites the two renderer-derived files, and only
 * commits+pushes if the regenerated bytes actually differ from what
 * the PR branch already has AND the resulting diff stays entirely
 * inside the generated-diff allowlist. A regeneration that produces
 * byte-identical output is a pure no-op -- no commit, no push, no head
 * SHA change. Never opens a second PR, never touches the hub card or
 * sitemap entry (see regenerateLaunchArtifactContents()'s own header).
 *
 * @returns {{changed: boolean, headRefOid: string, changedPaths: string[]}}
 */
export function refreshLaunchPrArticle({ topicSlug, branch, articlePath, planArtifactPath, preparedArtifact, plan, runId }) {
  execFileSync('git', ['fetch', 'origin', branch], { cwd: ROOT, stdio: 'inherit' });
  execFileSync('git', ['checkout', '-B', branch, `origin/${branch}`], { cwd: ROOT, stdio: 'inherit' });

  const { articleHtml, planArtifactJson } = regenerateLaunchArtifactContents({ preparedArtifact, plan });
  writeFileSync(path.join(ROOT, articlePath), articleHtml);
  writeFileSync(path.join(ROOT, planArtifactPath), planArtifactJson);

  const changedPaths = execFileSync('git', ['diff', '--name-only'], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  if (changedPaths.length === 0) {
    const headRefOid = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
    return { changed: false, headRefOid, changedPaths: [] };
  }

  const allowlistResult = checkGeneratedDiffAllowlist(changedPaths);
  if (!allowlistResult.valid) {
    // Never commit an unexpected change -- restore the working tree to
    // exactly what origin already has before returning.
    execFileSync('git', ['checkout', '--', '.'], { cwd: ROOT, stdio: 'inherit' });
    throw new Error(`refreshLaunchPrArticle: regenerated diff touched unexpected path(s), INFRA_REVIEW: ${allowlistResult.violations.join(', ')}`);
  }

  execFileSync('git', ['add', articlePath, planArtifactPath], { cwd: ROOT, stdio: 'inherit' });
  execFileSync('git', ['commit', '-m', `Education Operations: regenerate ${topicSlug} launch artifacts (deterministic renderer refresh, run ${runId})`], { cwd: ROOT, stdio: 'inherit' });
  execFileSync('git', ['push', 'origin', branch], { cwd: ROOT, stdio: 'inherit' });
  const headRefOid = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  return { changed: true, headRefOid, changedPaths };
}

/**
 * PR_OPEN + AUTOPUBLISH-false REFRESH -- the narrowest safe path for a
 * deterministic renderer/serialization fix to reach an ALREADY-OPEN
 * generated PR without opening a replacement, merging, writing
 * clearance, or touching the durable candidate/Writer/Reviewer/
 * Publication Editor in any way. See docs/education/AIMT-EDUCATION-
 * OPERATIONS-v1.md's "Production publish lane" section.
 *
 * FAILS CLOSED (never blindly blesses a changed PR head): reuses the
 * EXACT SAME pre-merge revalidation (verifyGeneratedPrStillExpectedBeforeMerge)
 * step 10 already uses -- same PR number, still OPEN, head SHA
 * unchanged since last recorded, existing diff still allowlisted. Any
 * violation (an unrelated human edit that moved the head, the PR closed
 * or merged out from under the manifest, ...) is INFRA_REVIEW, never a
 * silent skip and never a blind overwrite.
 *
 * @returns {Promise<{failed: boolean, finalState?: string, reason?: string}>}
 */
async function attemptPrOpenArtifactRefresh(env, { bundle, manifest, io, persistManifest, runId }) {
  let prInfo;
  try {
    prInfo = io.ghPrViewFn(manifest.generated.pr_number);
  } catch (err) {
    return { failed: true, finalState: RUN_FINAL_STATE.INFRA_REVIEW, reason: `Could not read PR #${manifest.generated.pr_number} to refresh it: ${err.message}` };
  }
  const revalidation = verifyGeneratedPrStillExpectedBeforeMerge(prInfo, manifest);
  if (!revalidation.ok) {
    return {
      failed: true, finalState: RUN_FINAL_STATE.INFRA_REVIEW,
      reason: `Refusing to refresh PR #${manifest.generated.pr_number}: ${revalidation.violations.join(', ')} -- never blindly updating a PR that changed unexpectedly.`,
    };
  }

  // Deterministic from the bundle alone -- never read from the manifest,
  // which may not have recorded them if this PR was adopted via crash
  // recovery rather than freshly opened by THIS pipeline.
  const articlePath = educationArticlePathFromRoute(bundle.route);
  const planArtifactPath = `functions/_data/education-page-plans/${bundle.page_plan.topic_slug}.json`;

  let refreshResult;
  try {
    refreshResult = await io.refreshLaunchPrArticleFn({
      topicSlug: bundle.topic_slug, branch: manifest.generated.branch,
      articlePath, planArtifactPath,
      preparedArtifact: bundle.prepared_artifact, plan: bundle.page_plan, runId,
    });
  } catch (err) {
    return { failed: true, finalState: RUN_FINAL_STATE.INFRA_REVIEW, reason: `Regeneration for PR #${manifest.generated.pr_number} failed: ${err.message}` };
  }

  if (refreshResult.changed) {
    persistManifest({ generated: { expected_head_sha: refreshResult.headRefOid } });
  }
  return { failed: false };
}

/** Direct PostgREST read -- the SAME read publishClearanceRecord() does
    internally, exposed here so the pipeline can check idempotency
    (step 9) and post-write integrity (step 15) without a second,
    differently-shaped reader. Never writes anything. */
async function fetchClearanceRowByTopicSlug(env, topicSlug) {
  if (!env || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('fetchClearanceRowByTopicSlug: missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.');
  }
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/research_public_pages?topic_slug=eq.${encodeURIComponent(topicSlug)}&select=*`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) throw new Error(`fetchClearanceRowByTopicSlug: query failed (${res.status})`);
  const rows = await res.json();
  return rows[0] || null;
}

const LIVE_SITE_ORIGIN = 'https://aimtrichology.com';

/** Real live-site fetch for step 13 -- the article route itself, the
    live sitemap.xml, and the cluster hub page, all from the production
    domain (never the local git checkout), so a PASS here proves the
    ACTUAL deployed site reflects the publication, not merely that the
    merge succeeded. */
async function fetchLivePublicationArtifacts({ route, clusterKey }) {
  const hubFile = PUBLICATION_CLUSTERS[clusterKey].hub_file;
  const [articleRes, sitemapRes, hubRes] = await Promise.all([
    fetch(`${LIVE_SITE_ORIGIN}${route}`),
    fetch(`${LIVE_SITE_ORIGIN}/sitemap.xml`),
    fetch(`${LIVE_SITE_ORIGIN}/${hubFile}`),
  ]);
  const html = await articleRes.text();
  const sitemapXml = sitemapRes.ok ? await sitemapRes.text() : '';
  const hubHtml = hubRes.ok ? await hubRes.text() : '';
  return { httpStatus: articleRes.status, html, sitemapXml, hubHtml };
}

/** Real I/O for runPublicationPipeline() -- every field here is
    individually overridable via options.io in tests; none of these real
    implementations are ever invoked by this repo's own test suite. */
/**
 * Resolves the CURRENT candidate claim id set for ONE specific topic,
 * completely independent of new-page eligibility. Deliberately never
 * routed through selectNextTopic()/candidateConceptsForCluster()
 * (education-topic-selector.mjs), which intentionally EXCLUDES any
 * already-published topic from candidacy entirely -- calling THAT for
 * an already-published topic returns no candidate entry at all, which
 * would make a freshness check see an empty claim set and misreport
 * "everything changed" for a topic whose evidence may not have moved at
 * all. This calls the SAME underlying per-topic readiness computation
 * (assessTopicReadiness) directly, for exactly the one topic asked
 * about, regardless of its published status.
 *
 * @param {{claims: object[], sources: object[]}} evidencePool
 * @param {string} clusterKey
 * @param {string} topicSlug
 * @returns {string[]} candidate_claim_ids, or [] if this topic has no
 *   registered concept in this cluster (defensive; should be unreachable
 *   given the caller already validated clusterKey/topicSlug membership)
 */
function resolveCurrentCandidateClaimIds(evidencePool, clusterKey, topicSlug) {
  const concept = getPublicationConcept(topicSlug);
  if (!concept || concept.cluster !== clusterKey) return [];
  const { claims, sources } = selectTopicEvidenceFromRows(concept.controlled_topics, evidencePool);
  const v1Result = assessTopicReadiness({
    topic_slug: concept.topic_slug, seo_page_concept: concept.seo_page_concept,
    controlled_topics: concept.controlled_topics, claims, sources,
  });
  return v1Result.candidate_claim_ids;
}

function buildRealPublishIo(env) {
  return {
    loadCandidateBundleFn: loadCandidateBundle,
    loadPublicationManifestFn: loadPublicationManifest,
    writePublicationManifestFn: writePublicationManifest,
    fetchEvidenceFn: fetchTopicEvidenceLive,
    fetchPublishedTopicSlugsFn: fetchPublishedTopicSlugsLive,
    countPagesPublishedThisWeekFn: countPagesPublishedThisWeekLive,
    resolveTrustedSiblingPagesFn: resolveTrustedSiblingPages,
    verifyCandidateBundleIntegrityFn: verifyCandidateBundleIntegrity,
    resolveCandidateResumeFreshnessFn: resolveCandidateResumeFreshness,
    prepareLaunchArtifactsFn: prepareLaunchArtifacts,
    openLaunchPrFn: openLaunchPr,
    refreshLaunchPrArticleFn: refreshLaunchPrArticle,
    ghPrListForBranchFn: ghPrListForBranch,
    ghPrViewFn: ghPrView,
    ghPrMergeFn: ghPrMerge,
    fetchClearanceRowFn: fetchClearanceRowByTopicSlug,
    writeClearanceRecordFn: writeClearanceRecord,
    publishClearanceRecordFn: publishClearanceRecord,
    verifyStoredClearanceIntegrityFn: verifyStoredClearanceIntegrity,
    waitForDeploymentFn: (args) => waitForCloudflareProductionDeployment(args, {}),
    fetchLiveArtifactsFn: fetchLivePublicationArtifacts,
    sleepFn: (ms) => new Promise((resolve) => { setTimeout(resolve, ms); }),
  };
}

/**
 * Bounded post-deploy live verification. Cloudflare's successful check
 * run proves the exact merge commit finished deploying, but the custom
 * domain's edge cache can still expose mixed propagation for a few
 * seconds (for example, the new article + sitemap are current while the
 * cluster hub is momentarily stale). Every attempt repeats the FULL
 * verification contract; nothing is weakened or selectively waived.
 * The DB remains non-public until one attempt passes every check.
 */
export async function waitForLivePublicationVerification({
  fetchLiveArtifactsFn, sleepFn, route, clusterKey, expectedGenerationSourceHash,
  maxAttempts = LIVE_VERIFY_MAX_ATTEMPTS, retryDelayMs = LIVE_VERIFY_RETRY_DELAY_MS,
}) {
  let lastVerification = null;
  let lastFetchError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const liveArtifacts = await fetchLiveArtifactsFn({ route, clusterKey });
      lastFetchError = null;
      lastVerification = verifyLivePagePublication({
        httpStatus: liveArtifacts.httpStatus,
        html: liveArtifacts.html,
        sitemapXml: liveArtifacts.sitemapXml,
        hubHtml: liveArtifacts.hubHtml,
        expectedRoute: route,
        expectedGenerationSourceHash,
      });
      if (lastVerification.ok) {
        return { ok: true, attempts: attempt, verification: lastVerification, fetchError: null };
      }
    } catch (err) {
      lastFetchError = err;
    }

    if (attempt < maxAttempts) await sleepFn(retryDelayMs);
  }

  return {
    ok: false,
    attempts: maxAttempts,
    verification: lastVerification,
    fetchError: lastFetchError,
  };
}

/**
 * The production publish state machine (--publish). Enforces,
 * mechanically, the exact order documented in docs/education/
 * AIMT-EDUCATION-OPERATIONS-v1.md's "Production publish lane" section:
 * verify the already-cleared durable candidate -> generate launch
 * artifacts -> open/resume the generated PR -> (AUTOPUBLISH gate) ->
 * persist non-public clearance -> revalidate -> merge -> wait for a
 * confirmed Cloudflare PRODUCTION deployment -> live-verify -> guarded
 * publishClearanceRecord() -> post-write integrity -> PUBLISHED.
 *
 * Idempotent and crash-tolerant: every stage transition is persisted to
 * the durable publication manifest BEFORE the next stage runs, and
 * determinePublicationResumeStage() (never a raw `state` string alone)
 * decides where a later invocation actually continues from -- see
 * education-publication-state.mjs's own header for why a PUBLISH_FAILED
 * manifest must remain retryable rather than permanently parked.
 *
 * STRUCTURALLY incapable of a model call: it never imports the intent
 * planner, Publication Editor, Writer, or Reviewer client modules --
 * only an ALREADY-CLEARED durable candidate bundle (loaded read-only)
 * feeds this function, and modelCalls therefore always stays [] here.
 *
 * @param {Object} env
 * @param {{topicSlug: string, runId?: string, io?: object}} options
 * @returns {Promise<object>} a buildRunReport()-shaped result
 */
export async function runPublicationPipeline(env, options = {}) {
  const runId = options.runId || randomUUID();
  const startedAt = new Date().toISOString();
  const modelCalls = []; // NEVER populated -- see function header
  const io = { ...buildRealPublishIo(env), ...(options.io || {}) };
  const topicSlug = options.topicSlug;

  const finish = (fields) => buildRunReport({
    run_id: runId, started_at: startedAt, finished_at: new Date().toISOString(),
    mode: 'publish', model_calls: modelCalls, selected_topic: topicSlug, ...fields,
  });

  if (!topicSlug) {
    return finish({ final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: '--publish requires --topic=<slug> -- refusing to guess which candidate to publish.' });
  }

  // --- Load + shape-check any existing durable publication manifest ----
  const manifestLoaded = io.loadPublicationManifestFn(topicSlug);
  if (manifestLoaded.found && !manifestLoaded.manifest) {
    return finish({
      final_state: RUN_FINAL_STATE.INFRA_REVIEW,
      exception_reason: `Publication manifest for "${topicSlug}" could not be parsed (${manifestLoaded.parseError || 'invalid JSON'}) -- refusing to resume or silently regenerate over it.`,
    });
  }
  let manifest = manifestLoaded.found ? manifestLoaded.manifest : null;
  if (manifest) {
    const shape = validatePublicationManifestShape(manifest);
    if (!shape.valid) {
      return finish({ final_state: RUN_FINAL_STATE.INFRA_REVIEW, exception_reason: `Publication manifest for "${topicSlug}" failed shape validation: ${shape.violations.join(', ')}.` });
    }
  }

  // --- STEPS 1-2: load + verify the SAME durable, already-cleared candidate ---
  const loadedBundle = io.loadCandidateBundleFn(topicSlug);
  if (!loadedBundle.found || !loadedBundle.bundle) {
    return finish({
      final_state: RUN_FINAL_STATE.INFRA_REVIEW,
      exception_reason: `No durable candidate bundle found for "${topicSlug}" -- refusing to publish without an already Reviewer-PASS candidate. This never regenerates Intent Planner/Publication Editor/Writer to create one.`,
    });
  }
  const bundle = loadedBundle.bundle;
  const integrity = await io.verifyCandidateBundleIntegrityFn(bundle);
  const resumeStage = determineResumeStage(bundle);

  const registeredConcept = getPublicationConcept(topicSlug);
  if (!registeredConcept) {
    return finish({ final_state: RUN_FINAL_STATE.INFRA_REVIEW, exception_reason: `Topic "${topicSlug}" is not a registered publication concept in any cluster.` });
  }
  const clusterKey = registeredConcept.cluster;
  // The durable candidate must target exactly the registry's cluster and
  // route for this topic -- a bundle whose route was chosen any other way
  // is never published.
  const registeredRoute = publicationRouteFor(topicSlug);
  if (bundle.cluster !== clusterKey || bundle.route !== registeredRoute) {
    return finish({ final_state: RUN_FINAL_STATE.INFRA_REVIEW, exception_reason: `Durable candidate bundle for "${topicSlug}" targets ${bundle.cluster} ${bundle.route}, but the publication registry assigns ${clusterKey} ${registeredRoute} -- refusing to publish.` });
  }

  let evidencePool;
  try {
    const clusterConcepts = PUBLICATION_CONCEPTS.filter((c) => c.cluster === clusterKey);
    evidencePool = await io.fetchEvidenceFn(env, controlledTopicsForConcepts(clusterConcepts));
  } catch (err) {
    return finish({ final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: `Evidence fetch failed: ${err.message}` });
  }
  let publishedTopicSlugs;
  try {
    publishedTopicSlugs = await io.fetchPublishedTopicSlugsFn(env);
  } catch (err) {
    return finish({ final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: `Published-topic state query failed: ${err.message}` });
  }

  // FAIL CLOSED (matches the shadow lane's own posture -- see
  // resolveTrustedSiblingPages()'s own header and runDecisionPipeline()'s
  // identical check above): a published DB state that cannot be mapped
  // to trusted routes is an architecture-safety anomaly, never silently
  // downgraded to "treat it as if nothing were published".
  // All clusters: route-collision protection covers every live route.
  const siblingResolution = io.resolveTrustedSiblingPagesFn(publishedTopicSlugs, null);
  if (!siblingResolution.ok) {
    return finish({
      final_state: RUN_FINAL_STATE.INFRA_REVIEW,
      exception_reason: `Published DB state and trusted route/artifact state disagree: ${siblingResolution.violations.join(', ')} -- refusing to prepare/open a PR/write clearance/merge on an unresolved published-route set.`,
    });
  }
  const trustedPublishedRoutes = siblingResolution.pages.map((p) => p.route);
  const routeGuard = checkRouteNotAlreadyPublished(bundle.route, trustedPublishedRoutes);
  const routeAlreadyPublished = !routeGuard.valid;

  const preparedArtifactDigest = await computePreparedArtifactDigest(bundle.prepared_artifact);

  // REAL-STATE RESUME CORRECTION: once this EXACT publication has
  // actually reached status='published', the live published-topic set
  // (routeAlreadyPublished, publishedTopicSlugs) legitimately includes
  // it -- and that is NOT a reason to refuse resuming/re-verifying it.
  // The full "new candidate" eligibility gate below (fresh, not already
  // published, within the weekly cap) exists to decide whether it is
  // SAFE to publish something NOT YET published; it does not apply once
  // the DB has already legitimately moved to published for this exact
  // route. Only the SAME durable manifest -- matched on topic_slug,
  // route, generation_source_hash, and prepared_artifact_digest -- may
  // take this path; an arbitrary already-published route is never
  // treated as safe merely because a route matches.
  if (routeAlreadyPublished) {
    if (!manifest) {
      return finish({
        final_state: RUN_FINAL_STATE.INFRA_REVIEW, planned_route: bundle.route,
        exception_reason: `"${topicSlug}" (${bundle.route}) is already published live, but no durable publication manifest exists for it -- refusing to treat an arbitrary already-published route as this publication.`,
      });
    }
    const consistency = isManifestForSameCandidate(manifest, {
      topicSlug, route: bundle.route, generationSourceHash: bundle.generation_source_hash, preparedArtifactDigest,
    });
    if (!consistency.matches) {
      return finish({
        final_state: RUN_FINAL_STATE.INFRA_REVIEW, planned_route: bundle.route,
        exception_reason: `"${topicSlug}" (${bundle.route}) is already published live, but the durable manifest does not match this exact candidate (${consistency.violations.join(', ')}) -- refusing to resume a different publication under an already-published route.`,
      });
    }
    if (!integrity.valid) {
      return finish({
        final_state: RUN_FINAL_STATE.INFRA_REVIEW, planned_route: bundle.route,
        exception_reason: `Candidate bundle integrity check failed while resuming an already-published manifest: ${integrity.violations.join(', ')}`,
      });
    }
    // Falls through to the ordinary manifest-driven resume-stage
    // dispatch below, which idempotently re-verifies and finishes
    // PUBLISHED (or fails closed on a genuine post-write mismatch)
    // without ever re-merging/re-writing/re-deploying -- see
    // determinePublicationResumeStage()/the LIVE_VERIFIED tail block.
  } else {
    // NOT-yet-published candidate: the full "new candidate" eligibility
    // gate applies exactly as before. currentCandidateClaimIds is
    // resolved for THIS SPECIFIC topic directly (assessTopicReadiness),
    // never through selectNextTopic()/candidateConceptsForCluster(),
    // which intentionally EXCLUDES already-published topics from
    // candidacy entirely -- a freshness check must never see an empty
    // claim set merely because a selector built for a DIFFERENT purpose
    // (picking the next NEW page) doesn't consider this topic anymore.
    const currentCandidateClaimIds = resolveCurrentCandidateClaimIds(evidencePool, clusterKey, topicSlug);
    const freshness = io.resolveCandidateResumeFreshnessFn(bundle, currentCandidateClaimIds);

    let pagesPublishedThisWeek;
    try {
      pagesPublishedThisWeek = (await io.countPagesPublishedThisWeekFn(env)).count;
    } catch (err) {
      return finish({ final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: `Weekly publication count query failed: ${err.message}` });
    }
    const weeklyCap = checkWeeklyCap(pagesPublishedThisWeek, resolveMaxPagesPerWeek(env));

    const eligibility = checkCandidateReadyForPublication({
      integrityValid: integrity.valid, integrityViolations: integrity.violations,
      resumeStage, freshnessState: freshness.state,
      bundleTopicSlug: bundle.topic_slug, expectedTopicSlug: topicSlug,
      bundleRoute: bundle.route, expectedRoute: bundle.route,
      routeAlreadyPublished,
      withinWeeklyCap: weeklyCap.withinCap,
    });
    if (!eligibility.ok) {
      return finish({ final_state: RUN_FINAL_STATE.INFRA_REVIEW, planned_route: bundle.route, exception_reason: `Candidate not ready for publication: ${eligibility.violations.join(', ')}` });
    }

    if (manifest) {
      const consistency = isManifestForSameCandidate(manifest, {
        topicSlug, route: bundle.route, generationSourceHash: bundle.generation_source_hash, preparedArtifactDigest,
      });
      if (!consistency.matches) {
        return finish({
          final_state: RUN_FINAL_STATE.INFRA_REVIEW,
          exception_reason: `Publication manifest for "${topicSlug}" no longer matches the current candidate (${consistency.violations.join(', ')}) -- refusing to continue publishing a candidate that changed underneath it.`,
        });
      }
    } else {
      manifest = buildPublicationManifest({
        runId, topicSlug, route: bundle.route, cluster: clusterKey,
        generationSourceHash: bundle.generation_source_hash, preparedArtifactDigest,
        candidateOriginatingRunId: bundle.originating_run_id,
      });
      io.writePublicationManifestFn(topicSlug, manifest);
    }
  }

  const persistManifest = (updates) => {
    manifest = advancePublicationManifest(manifest, updates);
    io.writePublicationManifestFn(topicSlug, manifest);
    return manifest;
  };
  const stage = () => determinePublicationResumeStage(manifest);

  // --- STEPS 3-8: prepare (ZERO model calls) + open/resume the generated PR ---
  if (stage() === PUBLICATION_STATE.PREPARED) {
    const branch = publicationBranchName(topicSlug);
    const existingPr = io.ghPrListForBranchFn(branch);
    if (existingPr) {
      // CRASH RECOVERY: a prior run pushed the branch/opened the PR but
      // died before persisting the manifest -- resume it, never open a
      // duplicate.
      persistManifest({
        state: PUBLICATION_STATE.PR_OPEN,
        generated: { branch, pr_number: existingPr.number, pr_url: existingPr.url, expected_head_sha: existingPr.headRefOid },
      });
    } else {
      let artifacts;
      let opened;
      try {
        artifacts = io.prepareLaunchArtifactsFn({ preparedArtifact: bundle.prepared_artifact, plan: bundle.page_plan, route: bundle.route });
        opened = io.openLaunchPrFn({ topicSlug, ...artifacts, runId });
      } catch (err) {
        persistManifest({ lastFailure: { stage: 'PREPARE', reason: err.message, at: new Date().toISOString() } });
        return finish({ final_state: RUN_FINAL_STATE.PUBLISH_FAILED, planned_route: bundle.route, exception_reason: `Failed to generate launch artifacts / open the publish PR: ${err.message}` });
      }
      persistManifest({
        state: PUBLICATION_STATE.PR_OPEN,
        generated: {
          branch: opened.branch, pr_number: opened.prNumber, pr_url: opened.prUrl, expected_head_sha: opened.headRefOid,
          article_path: artifacts.articlePath, plan_artifact_path: artifacts.planArtifactPath, hub_path: artifacts.hubPath, sitemap_path: artifacts.sitemapPath,
        },
      });
    }
  }

  // --- AUTOPUBLISH GATE: everything from here on is a real production
  //     side effect (DB write, merge, deploy wait, live verify, DB
  //     publish). Checked ONCE, upfront -- nothing past this point ever
  //     runs unless the variable is EXACTLY "true". -----------------
  if (!isAutopublishEnabled(env)) {
    // PR_OPEN REFRESH (bounded, optional): while the gate is closed, an
    // already-open generated PR MAY be brought up to date with the
    // CURRENT deterministic renderer/serialization code for the SAME
    // persisted candidate -- e.g. a renderer bug fix landing after the
    // PR was opened. Never opens a second PR, never merges, never
    // writes clearance, never calls a model. See
    // attemptPrOpenArtifactRefresh()'s own header for the fail-closed
    // guards.
    if (stage() === PUBLICATION_STATE.PR_OPEN) {
      const refreshOutcome = await attemptPrOpenArtifactRefresh(env, { bundle, manifest, io, persistManifest, runId });
      if (refreshOutcome.failed) {
        return finish({ final_state: refreshOutcome.finalState, planned_route: bundle.route, exception_reason: refreshOutcome.reason });
      }
    }
    return finish({
      final_state: RUN_FINAL_STATE.AUTOPUBLISH_GATE_CLOSED,
      planned_route: bundle.route,
      publication_action: { enabled: false, state: manifest.state, pr_number: manifest.generated.pr_number, pr_url: manifest.generated.pr_url },
      exception_reason: `${AUTOPUBLISH_ENV_VAR} is not "true" -- candidate verified and PR ${manifest.generated.pr_number ? `#${manifest.generated.pr_number} ` : ''}is open, but clearance/merge/deploy/publish all stay blocked until the gate is explicitly enabled.`,
    });
  }

  // --- STEP 9: persist the NON-PUBLIC clearance row, idempotently ------
  if (stage() === PUBLICATION_STATE.PR_OPEN) {
    let existingRow;
    try {
      existingRow = await io.fetchClearanceRowFn(env, topicSlug);
    } catch (err) {
      return finish({ final_state: RUN_FINAL_STATE.INFRA_REVIEW, exception_reason: `Pre-clearance-write read failed: ${err.message}` });
    }
    const rowConsistency = checkExistingClearanceRowConsistency(existingRow, { expectedTopicSlug: topicSlug, expectedGenerationSourceHash: bundle.generation_source_hash });
    if (rowConsistency.state === 'CONFLICT') {
      return finish({
        final_state: RUN_FINAL_STATE.INFRA_REVIEW,
        exception_reason: `Existing clearance row for "${topicSlug}" conflicts with this publication (${rowConsistency.violations.join(', ')}) -- refusing to overwrite blindly.`,
      });
    }

    // HARD-CRASH RECOVERY: the live DB may already be correctly
    // published even when the latest downloadable manifest artifact is
    // stale at PR_OPEN (for example, the prior runner died after the DB
    // publish succeeded but before its final artifact upload). Never
    // attempt to "catch the manifest up" by merging the recorded PR
    // again. The routeAlreadyPublished branch above has already proven
    // this manifest belongs to the SAME topic/route/hash/digest. From
    // here, require the published row's own stored integrity AND a fresh
    // custom-domain live verification; only then fast-forward the
    // manifest to PUBLISHED idempotently.
    if (rowConsistency.state === 'ALREADY_PUBLISHED') {
      if (!routeAlreadyPublished) {
        return finish({
          final_state: RUN_FINAL_STATE.INFRA_REVIEW,
          exception_reason: `research_public_pages says "${topicSlug}" is published with the expected hash, but the live published-route state does not include ${bundle.route} -- refusing to reconcile inconsistent publication authorities.`,
        });
      }

      const rowIntegrity = await io.verifyStoredClearanceIntegrityFn(existingRow);
      const postWrite = verifyPostWritePublishedRow(existingRow, {
        expectedTopicSlug: topicSlug,
        expectedGenerationSourceHash: bundle.generation_source_hash,
        storedIntegrityValid: rowIntegrity.valid,
      });
      if (!postWrite.ok) {
        return finish({
          final_state: RUN_FINAL_STATE.INFRA_REVIEW,
          exception_reason: `Existing published row failed idempotent recovery verification: ${postWrite.violations.join(', ')}.`,
        });
      }

      let liveArtifacts;
      try {
        liveArtifacts = await io.fetchLiveArtifactsFn({ route: bundle.route, clusterKey });
      } catch (err) {
        return finish({ final_state: RUN_FINAL_STATE.PUBLISH_FAILED, exception_reason: `Idempotent recovery live verification fetch failed: ${err.message}` });
      }
      const liveVerification = verifyLivePagePublication({
        httpStatus: liveArtifacts.httpStatus,
        html: liveArtifacts.html,
        sitemapXml: liveArtifacts.sitemapXml,
        hubHtml: liveArtifacts.hubHtml,
        expectedRoute: bundle.route,
        expectedGenerationSourceHash: bundle.generation_source_hash,
      });
      if (!liveVerification.ok) {
        return finish({
          final_state: RUN_FINAL_STATE.PUBLISH_FAILED,
          exception_reason: `Existing published row could not be reconciled with the live site: ${liveVerification.violations.join(', ')}.`,
        });
      }

      persistManifest({
        state: PUBLICATION_STATE.PUBLISHED,
        clearance: { persisted: true, mode: 'AUTO_READY', persisted_at: manifest.clearance.persisted_at || existingRow.published_at },
        liveVerification: { passed: true, checked_at: new Date().toISOString(), checks: liveVerification.checks },
        dbPublish: { attempted: true, verified: true, published_at: existingRow.published_at },
        lastFailure: null,
      });
      return finish({
        final_state: RUN_FINAL_STATE.PUBLISHED,
        planned_route: bundle.route,
        publication_action: {
          pr_number: manifest.generated.pr_number,
          merge_commit_sha: manifest.merge.merge_commit_sha,
          published_at: existingRow.published_at,
          idempotent_recovery_from_published_row: true,
        },
      });
    }

    if (rowConsistency.state === 'NOT_FOUND') {
      try {
        await io.writeClearanceRecordFn(env, bundle.prepared_artifact.record);
      } catch (err) {
        persistManifest({ lastFailure: { stage: 'CLEARANCE_PERSIST', reason: err.message, at: new Date().toISOString() } });
        return finish({ final_state: RUN_FINAL_STATE.PUBLISH_FAILED, exception_reason: `Clearance write failed: ${err.message}` });
      }
    }
    // MATCHES_EXPECTED (idempotent resume) or freshly written -- either
    // way the non-public row is now confirmed in the expected state.
    persistManifest({ state: PUBLICATION_STATE.CLEARANCE_PERSISTED, clearance: { persisted: true, mode: 'AUTO_READY', persisted_at: new Date().toISOString() } });
  }

  // --- STEP 10-11: revalidate, then merge (AUTOPUBLISH already confirmed true) ---
  if (stage() === PUBLICATION_STATE.CLEARANCE_PERSISTED) {
    let prInfo;
    try {
      prInfo = io.ghPrViewFn(manifest.generated.pr_number);
    } catch (err) {
      return finish({ final_state: RUN_FINAL_STATE.INFRA_REVIEW, exception_reason: `Could not read PR #${manifest.generated.pr_number}: ${err.message}` });
    }
    const revalidation = verifyGeneratedPrStillExpectedBeforeMerge(prInfo, manifest);
    if (!revalidation.ok) {
      persistManifest({ lastFailure: { stage: 'PRE_MERGE_REVALIDATION', reason: revalidation.violations.join(', '), at: new Date().toISOString() } });
      return finish({ final_state: RUN_FINAL_STATE.PUBLISH_FAILED, exception_reason: `Pre-merge revalidation failed: ${revalidation.violations.join(', ')}` });
    }
    let merged;
    try {
      merged = io.ghPrMergeFn(manifest.generated.pr_number);
    } catch (err) {
      persistManifest({ lastFailure: { stage: 'MERGE', reason: err.message, at: new Date().toISOString() } });
      return finish({ final_state: RUN_FINAL_STATE.PUBLISH_FAILED, exception_reason: `PR merge failed: ${err.message}` });
    }
    if (!merged || !merged.mergeCommitOid) {
      persistManifest({ lastFailure: { stage: 'MERGE', reason: 'merge reported success but no mergeCommit.oid was returned', at: new Date().toISOString() } });
      return finish({ final_state: RUN_FINAL_STATE.PUBLISH_FAILED, exception_reason: 'PR merge did not yield a merge commit SHA -- refusing to proceed to deployment wait without one.' });
    }
    persistManifest({ state: PUBLICATION_STATE.MERGED, merge: { merged: true, merge_commit_sha: merged.mergeCommitOid, merged_at: new Date().toISOString() } });
  }

  // --- STEP 12: wait for a CONFIRMED Cloudflare PRODUCTION deployment --
  if (stage() === PUBLICATION_STATE.MERGED && manifest.deployment.state !== 'success') {
    persistManifest({ state: PUBLICATION_STATE.DEPLOYING });
    const repo = env.GITHUB_REPOSITORY || process.env.GITHUB_REPOSITORY;
    const deployResult = await io.waitForDeploymentFn({ repo, commitSha: manifest.merge.merge_commit_sha });
    if (!deployResult.ok) {
      persistManifest({ deployment: { state: deployResult.state }, lastFailure: { stage: 'DEPLOYMENT', reason: deployResult.violations.join(', '), at: new Date().toISOString() } });
      return finish({ final_state: RUN_FINAL_STATE.PUBLISH_FAILED, exception_reason: `Cloudflare production deployment did not succeed (${deployResult.state}): ${deployResult.violations.join(', ')}` });
    }
    persistManifest({ deployment: { state: 'success', check_run_id: deployResult.checkRunId, checked_at: new Date().toISOString() } });
  }

  // --- STEP 13-15: LIVE VERIFY (always fresh, never a cached result --
  //     see the crash-recovery rule "retry the guarded DB transition
  //     only after re-verifying the live page") -> guarded
  //     publishClearanceRecord() -> post-write integrity ---------------
  if ((stage() === PUBLICATION_STATE.MERGED && manifest.deployment.state === 'success') || stage() === PUBLICATION_STATE.LIVE_VERIFIED) {
    const liveWait = await waitForLivePublicationVerification({
      fetchLiveArtifactsFn: io.fetchLiveArtifactsFn,
      sleepFn: io.sleepFn,
      route: bundle.route,
      clusterKey,
      expectedGenerationSourceHash: bundle.generation_source_hash,
    });
    if (!liveWait.ok) {
      const liveVerification = liveWait.verification;
      const reason = liveWait.fetchError && !liveVerification
        ? `Live verification fetch failed after ${liveWait.attempts} attempt(s): ${liveWait.fetchError.message}`
        : `Live verification failed after ${liveWait.attempts} attempt(s): ${(liveVerification && liveVerification.violations || []).join(', ')} -- the DB row is never published without this passing.`;
      persistManifest({
        liveVerification: {
          passed: false,
          checked_at: new Date().toISOString(),
          checks: liveVerification ? liveVerification.checks : null,
        },
        lastFailure: { stage: 'LIVE_VERIFY', reason, at: new Date().toISOString() },
      });
      return finish({ final_state: RUN_FINAL_STATE.PUBLISH_FAILED, exception_reason: reason });
    }
    const liveVerification = liveWait.verification;
    persistManifest({ state: PUBLICATION_STATE.LIVE_VERIFIED, liveVerification: { passed: true, checked_at: new Date().toISOString(), checks: liveVerification.checks } });

    // Idempotency (test #25 / crash-recovery #6): a row already
    // correctly published with the matching hash is NEVER re-submitted
    // to publishClearanceRecord() (whose own precondition requires
    // status='ready_for_page_builder' and would otherwise throw on a
    // legitimate retry) -- it is simply re-verified.
    let rowBeforePublish;
    try {
      rowBeforePublish = await io.fetchClearanceRowFn(env, topicSlug);
    } catch (err) {
      return finish({ final_state: RUN_FINAL_STATE.PUBLISH_FAILED, exception_reason: `Pre-publish-transition read failed: ${err.message}` });
    }
    const alreadyPublishedWithMatchingHash = rowBeforePublish && rowBeforePublish.status === 'published' && rowBeforePublish.generation_source_hash === bundle.generation_source_hash;
    if (!alreadyPublishedWithMatchingHash) {
      try {
        await io.publishClearanceRecordFn(env, topicSlug, { requireCurrentHash: bundle.generation_source_hash });
      } catch (err) {
        persistManifest({ dbPublish: { attempted: true }, lastFailure: { stage: 'DB_PUBLISH', reason: err.message, at: new Date().toISOString() } });
        return finish({ final_state: RUN_FINAL_STATE.PUBLISH_FAILED, exception_reason: `publishClearanceRecord failed: ${err.message}` });
      }
    }
    persistManifest({ dbPublish: { attempted: true } });

    // STEP 15: post-write integrity -- a fresh re-read, never trusting
    // the write call's own return value.
    let freshRow;
    try {
      freshRow = await io.fetchClearanceRowFn(env, topicSlug);
    } catch (err) {
      return finish({ final_state: RUN_FINAL_STATE.PUBLISH_FAILED, exception_reason: `Post-write re-read failed: ${err.message}` });
    }
    const rowIntegrity = freshRow ? await io.verifyStoredClearanceIntegrityFn(freshRow) : { valid: false, violations: ['ROW_NOT_FOUND'] };
    const postWrite = verifyPostWritePublishedRow(freshRow, {
      expectedTopicSlug: topicSlug, expectedGenerationSourceHash: bundle.generation_source_hash, storedIntegrityValid: rowIntegrity.valid,
    });
    if (!postWrite.ok) {
      persistManifest({ lastFailure: { stage: 'POST_WRITE_INTEGRITY', reason: postWrite.violations.join(', '), at: new Date().toISOString() } });
      return finish({ final_state: RUN_FINAL_STATE.PUBLISH_FAILED, exception_reason: `Post-write integrity check failed: ${postWrite.violations.join(', ')} -- never reporting a false PUBLISHED.` });
    }

    let livePublishedTopicsIncludesTopic = null;
    try {
      livePublishedTopicsIncludesTopic = (await io.fetchPublishedTopicSlugsFn(env)).includes(topicSlug);
    } catch (_err) {
      livePublishedTopicsIncludesTopic = null; // observational only -- never fails an otherwise-verified publish
    }

    persistManifest({ state: PUBLICATION_STATE.PUBLISHED, dbPublish: { verified: true, published_at: freshRow.published_at } });
    return finish({
      final_state: RUN_FINAL_STATE.PUBLISHED,
      planned_route: bundle.route,
      publication_action: {
        pr_number: manifest.generated.pr_number, merge_commit_sha: manifest.merge.merge_commit_sha,
        published_at: freshRow.published_at, live_published_topic_loader_includes_topic: livePublishedTopicsIncludesTopic,
      },
    });
  }

  // --- Already PUBLISHED on a prior run -- idempotent re-verify --------
  if (stage() === PUBLICATION_STATE.PUBLISHED) {
    let freshRow;
    try {
      freshRow = await io.fetchClearanceRowFn(env, topicSlug);
    } catch (err) {
      return finish({ final_state: RUN_FINAL_STATE.INFRA_REVIEW, exception_reason: `Idempotent re-verify read failed: ${err.message}` });
    }
    const rowIntegrity = freshRow ? await io.verifyStoredClearanceIntegrityFn(freshRow) : { valid: false, violations: ['ROW_NOT_FOUND'] };
    const postWrite = verifyPostWritePublishedRow(freshRow, {
      expectedTopicSlug: topicSlug, expectedGenerationSourceHash: bundle.generation_source_hash, storedIntegrityValid: rowIntegrity.valid,
    });
    if (!postWrite.ok) {
      return finish({ final_state: RUN_FINAL_STATE.INFRA_REVIEW, exception_reason: `Manifest claims PUBLISHED but the live row no longer verifies: ${postWrite.violations.join(', ')}` });
    }
    return finish({
      final_state: RUN_FINAL_STATE.PUBLISHED,
      planned_route: bundle.route,
      publication_action: { pr_number: manifest.generated.pr_number, merge_commit_sha: manifest.merge.merge_commit_sha, published_at: freshRow.published_at, idempotent_reverify: true },
    });
  }

  // Unreachable -- every PUBLICATION_STATE value determinePublicationResumeStage()
  // can return is handled above. Fail closed rather than returning nothing.
  return finish({ final_state: RUN_FINAL_STATE.INFRA_REVIEW, exception_reason: `Unhandled publication resume stage for "${topicSlug}".` });
}

export function parseArgs(argv) {
  const args = { mode: 'shadow' };
  for (const a of argv) {
    if (a === '--shadow') args.mode = 'shadow';
    else if (a === '--prepare') args.mode = 'prepare';
    else if (a === '--persist-clearance') args.mode = 'persist-clearance';
    else if (a === '--publish') args.mode = 'publish';
    else if (a.startsWith('--from-prepared=')) args.fromPrepared = a.split('=')[1];
    else if (a.startsWith('--topic=')) args.topic = a.split('=')[1];
  }
  return args;
}

/**
 * --persist-clearance: consumes an already-prepared, already-approved
 * clearance artifact (--from-prepared=<path>, written by a prior
 * --prepare run) and persists it to research_public_pages as a
 * NON-PUBLIC ready_for_page_builder row. This is what the CLI used to
 * call "--publish" -- renamed because it never merges a PR, waits for
 * Cloudflare, verifies a live route, or sets status='published' (see
 * this file's header comment and the "Correct the --publish semantics"
 * correction that introduced this function). Still gated behind
 * AIMT_EDUCATION_AUTOPUBLISH_ENABLED === "true" -- this is a real,
 * production database write, even though the row it writes is
 * non-public.
 *
 * Structurally cannot call synthesis a second time
 * (publishPreparedArtifact() has no synthesize-capable parameter --
 * see education-synthesis-cache.mjs) and structurally cannot set
 * status='published' (writeClearanceRecord/replaceNonPublicClearanceRecord
 * both refuse any status other than 'ready_for_page_builder' -- see
 * publication-clearance-writer.mjs's assertWritableClearanceRecord()).
 *
 * @param {Object} env
 * @param {{fromPreparedPath: string, io?: {writeFn?: Function}}} options
 * @returns {Promise<{ok: boolean, ran: boolean, reason?: string, result?: object}>}
 */
export async function runPersistClearanceAction(env, { fromPreparedPath, io = {} } = {}) {
  if (!isAutopublishEnabled(env)) {
    return { ok: false, ran: false, reason: `${AUTOPUBLISH_ENV_VAR} is not "true" -- refusing to run --persist-clearance. This is the correct, safe default.` };
  }
  if (!fromPreparedPath || !existsSync(fromPreparedPath)) {
    return { ok: false, ran: false, reason: '--persist-clearance requires --from-prepared=<path to a prepared artifact JSON file>.' };
  }
  const preparedArtifact = JSON.parse(readFileSync(fromPreparedPath, 'utf8'));
  const writeFn = io.writeFn || ((record) => (preparedArtifact.__replace
    ? replaceNonPublicClearanceRecord(env, record, { requireCurrentHash: preparedArtifact.__replace.requireCurrentHash })
    : writeClearanceRecord(env, record)));
  const result = await publishPreparedArtifact(preparedArtifact, { writeFn });
  return { ok: result.ok, ran: true, result };
}

/**
 * Real GitHub Issues I/O for surfaceExceptionIfNeeded() -- the ONLY
 * place in this file that shells out to `gh issue`. Never called by
 * runDecisionPipeline (which stays injectable-mock-only for tests);
 * only main() below wires it in, and only for a real --shadow/--prepare
 * CLI invocation. A failure here (e.g. the `education-*` labels not yet
 * existing in this repository -- a known remaining setup step, see
 * docs/education/AIMT-EDUCATION-OPERATIONS-v1.md) is caught by the
 * caller and logged, never allowed to fail the run itself -- an
 * exception-surfacing problem must never be mistaken for the run's own
 * outcome.
 */
function buildGithubIssueIo() {
  return {
    listIssuesFn: async (label) => {
      const out = execFileSync('gh', ['issue', 'list', '--label', label, '--state', 'open', '--json', 'number,title,state', '--limit', '100'], { cwd: ROOT, encoding: 'utf8' });
      return JSON.parse(out);
    },
    createIssueFn: async ({ title, body, labels }) => {
      const args = ['issue', 'create', '--title', title, '--body', body];
      for (const l of labels) args.push('--label', l);
      const url = execFileSync('gh', args, { cwd: ROOT, encoding: 'utf8' }).trim();
      const match = url.match(/\/issues\/(\d+)/);
      return { number: match ? Number(match[1]) : null, title, url };
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`=== AIMT Education Operations v1 (mode: --${args.mode}) ===`);

  if (args.mode === 'publish') {
    if (!args.topic) {
      console.log('--publish requires --topic=<slug> -- refusing to guess which already-cleared candidate to publish.');
      process.exit(1);
    }
    const report = await runPublicationPipeline(process.env, { topicSlug: args.topic });
    const reportPath = persistRunReport(report);
    console.log(`[report] ${report.final_state} -- written to ${path.relative(ROOT, reportPath)}`);
    console.log(JSON.stringify(report, null, 2));
    try {
      const io = buildGithubIssueIo();
      const outcome = await surfaceExceptionIfNeeded(report, io);
      if (outcome.action !== 'NONE') console.log(`[exception] ${outcome.action} issue for final_state=${report.final_state}: ${outcome.issue && outcome.issue.url}`);
    } catch (err) {
      console.warn(`[exception] surfacing failed (this never fails the run itself): ${err.message}`);
    }
    process.exit(report.final_state === RUN_FINAL_STATE.PUBLISH_FAILED || report.final_state === RUN_FINAL_STATE.INFRA_REVIEW || report.final_state === RUN_FINAL_STATE.CONFIG_BLOCKED ? 1 : 0);
  }

  if (args.mode === 'persist-clearance') {
    const outcome = await runPersistClearanceAction(process.env, { fromPreparedPath: args.fromPrepared });
    if (!outcome.ran) {
      console.log(outcome.reason);
      process.exit(0);
    }
    console.log(JSON.stringify(outcome.result, null, 2));
    process.exit(outcome.result.ok ? 0 : 1);
  }

  // --shadow and --prepare share the decision pipeline.
  const report = await runDecisionPipeline(process.env, { mode: args.mode });
  const reportPath = persistRunReport(report);
  console.log(`[report] ${report.final_state} -- written to ${path.relative(ROOT, reportPath)}`);
  console.log(JSON.stringify({ ...report, __internal: undefined }, null, 2));

  // --- Exception surfacing (GitHub Issues, deduped) ---------------------
  // Two independent lanes, per the runtime-wiring correction: the
  // primary new-page-lane outcome (if it's one of the exception final
  // states), and freshness (POTENTIAL_EVIDENCE_CHANGE never blocks or
  // gets blocked by the new-page lane -- it is surfaced on its own).
  try {
    const io = buildGithubIssueIo();
    const primaryOutcome = await surfaceExceptionIfNeeded(report, io);
    if (primaryOutcome.action !== 'NONE') console.log(`[exception] ${primaryOutcome.action} issue for final_state=${report.final_state}: ${primaryOutcome.issue && primaryOutcome.issue.url}`);

    for (const freshnessResult of report.freshness_scan_summary || []) {
      if (freshnessResult.state !== FRESHNESS_STATE.POTENTIAL_EVIDENCE_CHANGE) continue;
      const freshnessReport = buildRunReport({
        run_id: report.run_id, started_at: report.started_at, finished_at: report.finished_at, mode: report.mode,
        final_state: RUN_FINAL_STATE.FRESHNESS_FLAGGED,
        selected_topic: freshnessResult.topic,
        exception_reason: `Freshness scan found POTENTIAL_EVIDENCE_CHANGE for "${freshnessResult.topic}": ${freshnessResult.new_claim_ids.length} new, ${freshnessResult.removed_claim_ids.length} removed claim id(s) since clearance.`,
      });
      const freshnessOutcome = await surfaceExceptionIfNeeded(freshnessReport, io);
      if (freshnessOutcome.action !== 'NONE') console.log(`[exception] ${freshnessOutcome.action} issue for freshness on "${freshnessResult.topic}": ${freshnessOutcome.issue && freshnessOutcome.issue.url}`);
    }
  } catch (err) {
    console.warn(`[exception] surfacing failed (this never fails the run itself): ${err.message}`);
  }

  if (args.mode === 'prepare' && report.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY) {
    console.log('\n[prepare] Writing generated artifacts (article HTML, Page Plan data artifact, cluster hub card)...');
    const artifacts = prepareGeneratedArtifacts(report);
    console.log(`[prepare] wrote ${artifacts.articlePath}, ${artifacts.planArtifactPath}, ${artifacts.hubPath}`);
    console.log(`[prepare] diff allowlist: ${artifacts.allowlistResult.valid ? 'PASS' : 'FAIL'} (${artifacts.allowlistResult.allowed.length} allowed path(s))`);

    const preparedArtifactPath = path.join(ROOT, 'research-import', 'education-ops', 'prepared', `${report.selected_topic}-${report.run_id}.json`);
    mkdirSync(path.dirname(preparedArtifactPath), { recursive: true });
    writeFileSync(preparedArtifactPath, JSON.stringify(report.__internal.preparedArtifact, null, 2));
    console.log(`[prepare] prepared clearance artifact (for a future --persist-clearance): ${path.relative(ROOT, preparedArtifactPath)}`);

    const { branch, prUrl } = openPreparedPr({ topicSlug: report.selected_topic, ...artifacts, runId: report.run_id });
    console.log(`[prepare] opened branch "${branch}": ${prUrl}`);
    console.log('[prepare] DO NOT MERGE without owner review. No research_public_pages write has occurred.');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Education Operations cycle failed:', err);
    process.exit(1);
  });
}
