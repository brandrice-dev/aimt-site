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

import { fetchTopicEvidenceLive, PILOT_TOPIC_CONCEPTS } from '../functions/_lib/research/publication-readiness-loader.mjs';
import { selectNextTopic, ACTIVE_CLUSTERS, DEFAULT_ACTIVE_CLUSTER } from '../functions/_lib/education-ops/education-topic-selector.mjs';
import { fetchPublishedTopicSlugsLive, countPagesPublishedThisWeekLive } from '../functions/_lib/education-ops/education-published-state-loader.mjs';
import { checkEducationOpsCredential } from '../functions/_lib/education-ops/education-ops-model-config.mjs';
import { planPageIntent } from '../functions/_lib/education-ops/education-intent-planner-client.mjs';
import { validateIntentPlan } from '../functions/_lib/education-ops/education-intent-planner-validator.mjs';
import { prepareTopicArtifact, publishPreparedArtifact } from '../functions/_lib/education-ops/education-synthesis-cache.mjs';
import { writeEducationPagePlan } from '../functions/_lib/education-ops/education-writer-client.mjs';
import { validateEducationPagePlan } from '../functions/_lib/education-ops/education-page-plan-validator.mjs';
import { reviewEducationPagePlan } from '../functions/_lib/education-ops/education-reviewer-client.mjs';
import { aggregateReviewOutcome, REVIEW_OUTCOME } from '../functions/_lib/education-ops/education-reviewer-validator.mjs';
import { renderEducationPageHtml } from '../functions/_lib/education-ops/education-page-renderer.mjs';
import { checkGeneratedDiffAllowlist } from '../functions/_lib/education-ops/education-diff-allowlist.mjs';
import { checkAllPublishedTopicsFreshness, FRESHNESS_STATE } from '../functions/_lib/education-ops/education-freshness-monitor.mjs';
import { buildRunReport, RUN_FINAL_STATE } from '../functions/_lib/education-ops/education-run-ledger.mjs';
import { surfaceExceptionIfNeeded } from '../functions/_lib/education-ops/education-exception-reporter.mjs';
import { writeClearanceRecord, replaceNonPublicClearanceRecord } from '../functions/_lib/research/publication-clearance-writer.mjs';
import { buildHubCardHtml, insertHubCard } from '../functions/_lib/education-ops/education-hub-updater.mjs';
import { buildTrustedSources } from '../functions/_lib/education-ops/education-source-authority.mjs';
import { buildEducationRelatedLinks } from '../functions/_lib/education-ops/education-related-links.mjs';
import { checkRouteNotAlreadyPublished } from '../functions/_lib/education-ops/education-route-guard.mjs';
import { getPageBuilderRoute } from '../functions/_lib/page-builder/page-builder-route-registry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/**
 * TRUST-BOUNDARY CORRECTION: the ONLY place a currently-published
 * sibling page's route/label is resolved, from trusted data -- the
 * existing Page Builder route registry (legacy hair-cycle/
 * telogen-effluvium) or, for a future generated/published page, its own
 * persisted, git-tracked Page Plan artifact under
 * functions/_data/education-page-plans/. NEVER invents a route for a
 * slug that resolves via neither source -- that slug is silently
 * omitted rather than guessed. Feeds THREE consumers with the exact
 * same trusted data: the Writer's context-only existingClusterPages,
 * the deterministic related_links builder, and the route-collision
 * guard (via the routes it returns).
 *
 * @param {string[]} publishedTopicSlugs
 * @param {string} clusterKey
 * @returns {Array<{topic_slug: string, route: string, label: string}>}
 */
function resolveTrustedSiblingPages(publishedTopicSlugs, clusterKey) {
  const memberSet = new Set(ACTIVE_CLUSTERS[clusterKey].member_topic_slugs);
  const pages = [];
  for (const slug of publishedTopicSlugs) {
    if (!memberSet.has(slug)) continue;
    try {
      const { route } = getPageBuilderRoute(slug);
      const concept = PILOT_TOPIC_CONCEPTS.find((c) => c.topic_slug === slug);
      pages.push({ topic_slug: slug, route, label: concept ? concept.seo_page_concept : slug });
      continue;
    } catch (_err) {
      // Not in the legacy registry -- fall through to a persisted Page
      // Plan artifact, the trusted source for a future generated page.
    }
    const artifactPath = path.join(ROOT, 'functions/_data/education-page-plans', `${slug}.json`);
    if (!existsSync(artifactPath)) continue; // no trusted source for this slug -- never guess
    try {
      const data = JSON.parse(readFileSync(artifactPath, 'utf8'));
      if (data && data.plan && typeof data.plan.route === 'string' && typeof data.plan.h1 === 'string') {
        pages.push({ topic_slug: slug, route: data.plan.route, label: data.plan.h1 });
      }
    } catch (_err) {
      // Malformed artifact -- skip rather than guess at its route.
    }
  }
  return pages;
}

export const AUTOPUBLISH_ENV_VAR = 'AIMT_EDUCATION_AUTOPUBLISH_ENABLED';
export const MAX_PAGES_PER_WEEK_ENV_VAR = 'AIMT_EDUCATION_MAX_PAGES_PER_WEEK';
export const DEFAULT_MAX_PAGES_PER_WEEK = 4;

export function isAutopublishEnabled(env) {
  return String(env && env[AUTOPUBLISH_ENV_VAR]).trim().toLowerCase() === 'true';
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
  const clusterKey = options.clusterKey || DEFAULT_ACTIVE_CLUSTER;
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

  // Trusted sibling-page data (route+label), resolved ONCE from the
  // live published set -- feeds the Writer's context, the deterministic
  // related_links builder, and the route-collision guard below. Never
  // guessed; see resolveTrustedSiblingPages()'s own header comment.
  const trustedSiblingPages = resolveTrustedSiblingPages(publishedTopicSlugs, clusterKey);
  const trustedPublishedRoutes = trustedSiblingPages.map((p) => p.route);

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
    // Fetch the union of every cluster-member topic's controlled_topics
    // in one pass so selectNextTopic() can assess every candidate.
    const clusterConcepts = ACTIVE_CLUSTERS[clusterKey].member_topic_slugs
      .map((slug) => PILOT_TOPIC_CONCEPTS.find((c) => c.topic_slug === slug))
      .filter(Boolean);
    const allControlledTopics = [...new Set(clusterConcepts.flatMap((c) => c.controlled_topics))];
    evidencePool = await fetchEvidence(env, allControlledTopics);
  } catch (err) {
    return finish({ final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: `Evidence fetch failed: ${err.message}`, stopped_before_model_stage: true, credential_available: null });
  }

  const selection = selectNextTopic(evidencePool, { clusterKey, publishedTopicSlugs });
  const candidateTopics = selection.candidates.map((c) => ({ topic_slug: c.topic_slug, eligible: c.eligible, reason: c.ineligible_reason, risk_tier: c.v1_result.risk_tier, opportunity_score: c.opportunity.score }));

  if (!selection.selected) {
    return finish({
      candidate_topics: candidateTopics,
      final_state: RUN_FINAL_STATE.NO_OP_SUCCESS,
      selection_reason: selection.selection_reason,
      stopped_before_model_stage: true,
      credential_available: null,
    });
  }

  const selected = selection.selected;

  // --- 6. Education Ops credential check -- the FIRST point a model is
  //        genuinely needed. Everything above is preserved in `common`
  //        regardless of what happens here. ---------------------------
  const credCheck = checkEducationOpsCredential(env);
  common.credential_available = credCheck.ok;
  if (!credCheck.ok) {
    return finish({ candidate_topics: candidateTopics, selected_topic: selected.topic_slug, selection_reason: selection.selection_reason, risk_tier: selected.v1_result.risk_tier, readiness_result: selected.v1_result.readiness_status, final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: credCheck.reason, stopped_before_model_stage: true });
  }

  // --- 7. Intent planning ----------------------------------------------
  const planIntentFn = fns.planIntentFn || planPageIntent;
  // Real, trusted route+label data -- see resolveTrustedSiblingPages().
  // Renamed from `page_concept` to `label` to match what it actually is
  // now (a route registry/persisted-artifact value, not a re-derived
  // PILOT_TOPIC_CONCEPTS lookup) -- CONTEXT ONLY for the Writer; it never
  // authors an href itself (see education-related-links.mjs).
  const existingClusterPages = trustedSiblingPages.map((p) => ({ topic_slug: p.topic_slug, route: p.route, label: p.label }));
  const candidateEvidenceInventory = selected.v1_result.candidate_claim_ids.map((id) => ({ claim_id: id }));

  const intentResult = await planIntentFn(env, {
    topicSlug: selected.topic_slug,
    seoPageConcept: selected.concept.seo_page_concept,
    riskTier: selected.v1_result.risk_tier,
    cluster: clusterKey,
    routePrefix: ACTIVE_CLUSTERS[clusterKey].route_prefix,
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
    return finish({ candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier, final_state: RUN_FINAL_STATE.HUMAN_REVIEW, exception_reason: `Intent plan requested unsupported scope: ${intentValidation.violations.join(', ')}` });
  }
  const intentPlan = intentResult.output;
  const route = `${ACTIVE_CLUSTERS[clusterKey].route_prefix}/${intentPlan.route_slug}`;

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
  const synthesisResult = await prepareTopicArtifact(env, {
    topicSlug: selected.topic_slug,
    controlledTopic: selected.concept.controlled_topics.length === 1 ? selected.concept.controlled_topics[0] : null,
    v1Result: selected.v1_result,
    pageIntent: { page_concept: intentPlan.page_concept, public_intent: intentPlan.public_intent, in_scope_concepts: intentPlan.in_scope_concepts, out_of_scope_concepts: intentPlan.out_of_scope_concepts },
    evidenceRows: evidencePool,
  }, fns);
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
    return finish({
      candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
      publication_editor_result: { status: synthesisResult.status, reason: synthesisResult.reason, human_review_justification: synthesisResult.humanReviewJustification },
      final_state: isHumanReview ? RUN_FINAL_STATE.HUMAN_REVIEW : RUN_FINAL_STATE.NO_OP_SUCCESS,
      exception_reason: isHumanReview ? `HUMAN_REVIEW: ${synthesisResult.humanReviewJustification && synthesisResult.humanReviewJustification.reason}` : synthesisResult.reason,
    });
  }

  const preparedArtifact = synthesisResult.preparedArtifact;
  const clearedSnapshot = preparedArtifact.record.publication_clearance.fingerprint_input;

  // --- Education Writer ---------------------------------------------------
  // (route was already computed above, before the route-collision guard)
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
  const plan = {
    ...writerResult.output,
    sources: buildTrustedSources(clearedSnapshot),
    related_links: buildEducationRelatedLinks({
      clusterLabel: ACTIVE_CLUSTERS[clusterKey].label,
      clusterRoutePrefix: ACTIVE_CLUSTERS[clusterKey].route_prefix,
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
  if (!planValidation.valid) {
    const isRouteCollisionClass = planValidation.violations.some((v) => v.startsWith('PLAN_TOPIC_SLUG_MISMATCH') || v.startsWith('PLAN_CLUSTER_MISMATCH') || v.startsWith('PLAN_ROUTE_MISMATCH'));
    return finish({
      candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
      publication_editor_result: { status: 'AUTO_READY' }, writer_result: { valid: false, violations: planValidation.violations },
      final_state: isRouteCollisionClass ? RUN_FINAL_STATE.INFRA_REVIEW : RUN_FINAL_STATE.EDITORIAL_REVIEW,
      exception_reason: `Page Plan failed deterministic validation: ${planValidation.violations.join(', ')}`,
    });
  }

  // --- Education Reviewer --------------------------------------------------
  const reviewFn = fns.reviewFn || reviewEducationPagePlan;
  const reviewResult = await reviewFn(env, { plan, clearedSnapshot, intentPlan });
  if (reviewResult.ok) modelCalls.push({ role: 'education_reviewer', actual_call_count: 1, ...reviewResult.usage });
  if (!reviewResult.ok) {
    return finish({ candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier, publication_editor_result: { status: 'AUTO_READY' }, writer_result: { valid: true }, final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: `Reviewer call failed: ${reviewResult.reason}` });
  }
  const outcome = aggregateReviewOutcome(reviewResult.output);
  if (outcome.outcome !== REVIEW_OUTCOME.PASS) {
    return finish({
      candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier,
      publication_editor_result: { status: 'AUTO_READY' }, writer_result: { valid: true },
      review_result: outcome, final_state: RUN_FINAL_STATE.EDITORIAL_REVIEW, exception_reason: outcome.summary,
    });
  }

  // --- Everything passed: this is a SHADOW_CANDIDATE_READY result --------
  return finish({
    candidate_topics: candidateTopics,
    selected_topic: selected.topic_slug,
    selection_reason: selection.selection_reason,
    risk_tier: selected.v1_result.risk_tier,
    readiness_result: selected.v1_result.readiness_status,
    publication_editor_result: { status: 'AUTO_READY', generation_source_hash: preparedArtifact.record.generation_source_hash },
    writer_result: { valid: true },
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

  const relativeArticlePath = `education${route}.html`;
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

  // Cluster hub: derive its repo-relative path from the route prefix
  // (e.g. /education/hair-loss/<slug> -> education/hair-loss.html).
  const clusterKey = Object.keys(ACTIVE_CLUSTERS).find((k) => route.startsWith(ACTIVE_CLUSTERS[k].route_prefix));
  const relativeHubPath = `education${ACTIVE_CLUSTERS[clusterKey].route_prefix.replace('/education', '')}.html`;
  const hubPath = path.join(ROOT, relativeHubPath);
  const hubHtml = readFileSync(hubPath, 'utf8');
  const cardHtml = buildHubCardHtml({ route, h1: plan.h1, meta_description: plan.meta_description, sourceCount: plan.sources.length });
  writeFileSync(hubPath, insertHubCard(hubHtml, cardHtml));

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

export function parseArgs(argv) {
  const args = { mode: 'shadow' };
  for (const a of argv) {
    if (a === '--shadow') args.mode = 'shadow';
    else if (a === '--prepare') args.mode = 'prepare';
    else if (a === '--persist-clearance') args.mode = 'persist-clearance';
    else if (a === '--publish') args.mode = 'publish';
    else if (a.startsWith('--from-prepared=')) args.fromPrepared = a.split('=')[1];
  }
  return args;
}

/**
 * --publish is RESERVED for the future full autonomous-publication
 * state machine (merge -> Cloudflare wait -> live verification ->
 * publishClearanceRecord()). It is NOT IMPLEMENTED. This function
 * refuses UNCONDITIONALLY -- it does not even read
 * AIMT_EDUCATION_AUTOPUBLISH_ENABLED, because that variable does not
 * grant this capability yet and never implies one that doesn't exist.
 * No argument to this function could ever make it write anything.
 *
 * @returns {{ok: false, ran: false, reason: string}}
 */
export function runFullAutopublishRefusal() {
  return {
    ok: false,
    ran: false,
    reason: 'Full autonomous publishing (--publish) is not implemented. '
      + `${AUTOPUBLISH_ENV_VAR} does not grant this capability yet -- the merge / Cloudflare-wait / `
      + 'live-route-verification / DB-publish state machine has not been built (see "Exact publication '
      + 'ordering" in docs/education/AIMT-EDUCATION-OPERATIONS-v1.md). To persist an already-approved, '
      + 'prepared AUTO_READY clearance record as a NON-PUBLIC ready_for_page_builder row (never sets '
      + 'status=\'published\'), use --persist-clearance instead.',
  };
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
    const refusal = runFullAutopublishRefusal();
    console.log(refusal.reason);
    process.exit(0);
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
