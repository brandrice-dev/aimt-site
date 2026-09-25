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
     --shadow   (SCHEDULED DEFAULT) runs the full decision pipeline
                against real evidence, produces a run report, and stops
                BEFORE any file is written or any git/GitHub action is
                taken. Proves the architecture safely.
     --prepare  runs everything --shadow does, and if the result is
                SHADOW_CANDIDATE_READY, additionally writes the
                generated content locally (Page Plan artifact + article
                HTML + hub card + sitemap entry) and opens a branch/PR
                -- but performs ZERO writes to research_public_pages
                and NEVER merges. This is where "create Page #3" would
                actually happen, which is exactly why this task never
                invokes --prepare against a real selected topic (see
                docs/education/AIMT-EDUCATION-OPERATIONS-v1.md).
     --publish  consumes an ALREADY-MERGED prepared artifact and
                performs the guarded research_public_pages write. Does
                not, and structurally cannot, trigger a new synthesis
                call (see education-synthesis-cache.mjs). Refuses to
                run at all unless AIMT_EDUCATION_AUTOPUBLISH_ENABLED is
                exactly "true".

   PRODUCTION SAFETY DEFAULT: AIMT_EDUCATION_AUTOPUBLISH_ENABLED absent
   or not exactly "true" means NO production publication, in ANY mode
   -- --publish itself refuses to run at all, and the scheduled
   workflow's own default invocation is --shadow, never --publish.
   ═══════════════════════════════════════════════════════════════ */

import { randomUUID } from 'node:crypto';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchTopicEvidenceLive, PILOT_TOPIC_CONCEPTS } from '../functions/_lib/research/publication-readiness-loader.mjs';
import { selectNextTopic, ACTIVE_CLUSTERS, DEFAULT_ACTIVE_CLUSTER, PUBLISHED_TOPIC_SLUGS } from '../functions/_lib/education-ops/education-topic-selector.mjs';
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
import { checkAllPublishedTopicsFreshness } from '../functions/_lib/education-ops/education-freshness-monitor.mjs';
import { buildRunReport, RUN_FINAL_STATE } from '../functions/_lib/education-ops/education-run-ledger.mjs';
import { writeClearanceRecord, replaceNonPublicClearanceRecord } from '../functions/_lib/research/publication-clearance-writer.mjs';
import { buildHubCardHtml, insertHubCard } from '../functions/_lib/education-ops/education-hub-updater.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

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
 * @param {Object} env
 * @param {{clusterKey?: string, pagesPublishedThisWeek?: number, fns?: object}} [options]
 * @returns {Promise<object>} a buildRunReport() result
 */
export async function runDecisionPipeline(env, options = {}) {
  const runId = options.runId || randomUUID();
  const startedAt = new Date().toISOString();
  const modelCalls = [];
  const clusterKey = options.clusterKey || DEFAULT_ACTIVE_CLUSTER;
  const fns = options.fns || {};

  const finish = (fields) => buildRunReport({
    run_id: runId, started_at: startedAt, finished_at: new Date().toISOString(),
    mode: options.mode || 'shadow', model_calls: modelCalls, ...fields,
  });

  // --- Weekly cap -----------------------------------------------------
  const capCheck = checkWeeklyCap(options.pagesPublishedThisWeek || 0, resolveMaxPagesPerWeek(env));
  if (!capCheck.withinCap) {
    return finish({ final_state: RUN_FINAL_STATE.NO_OP_SUCCESS, selection_reason: `Weekly cap reached (${capCheck.pagesPublishedThisWeek}/${capCheck.maxPerWeek}).` });
  }

  // --- Credential check (fail closed, never borrow another key) -------
  const credCheck = checkEducationOpsCredential(env);
  if (!credCheck.ok) {
    return finish({ final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: credCheck.reason });
  }

  // --- Topic selection (read-only Supabase query) ----------------------
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
    return finish({ final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: `Evidence fetch failed: ${err.message}` });
  }

  const selection = selectNextTopic(evidencePool, { clusterKey });
  const candidateTopics = selection.candidates.map((c) => ({ topic_slug: c.topic_slug, eligible: c.eligible, reason: c.ineligible_reason, risk_tier: c.v1_result.risk_tier, opportunity_score: c.opportunity.score }));

  if (!selection.selected) {
    // Distinguish a genuine "nothing eligible" from a HIGH-risk/HUMAN_REVIEW-only pool for reporting clarity.
    const anyHighRisk = selection.candidates.some((c) => c.ineligible_reason === 'HIGH_RISK_NEVER_AUTONOMOUS');
    const anyHumanReview = selection.candidates.some((c) => c.ineligible_reason === 'HUMAN_REVIEW_NEVER_AUTONOMOUS');
    return finish({
      candidate_topics: candidateTopics,
      final_state: anyHighRisk ? RUN_FINAL_STATE.NO_OP_SUCCESS : anyHumanReview ? RUN_FINAL_STATE.NO_OP_SUCCESS : RUN_FINAL_STATE.NO_OP_SUCCESS,
      selection_reason: selection.selection_reason,
    });
  }

  const selected = selection.selected;

  // --- Intent planning --------------------------------------------------
  const planIntentFn = fns.planIntentFn || planPageIntent;
  const existingClusterPages = PUBLISHED_TOPIC_SLUGS.map((slug) => {
    const c = PILOT_TOPIC_CONCEPTS.find((cc) => cc.topic_slug === slug);
    return { topic_slug: slug, page_concept: c ? c.seo_page_concept : slug };
  });
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
  if (intentResult.ok) modelCalls.push({ role: 'intent_planner', ...intentResult.usage });
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

  // --- Publication Editor synthesis (EXACTLY ONCE; see education-synthesis-cache.mjs) ---
  const synthesisResult = await prepareTopicArtifact(env, {
    topicSlug: selected.topic_slug,
    controlledTopic: selected.concept.controlled_topics.length === 1 ? selected.concept.controlled_topics[0] : null,
    v1Result: selected.v1_result,
    pageIntent: { page_concept: intentPlan.page_concept, public_intent: intentPlan.public_intent, in_scope_concepts: intentPlan.in_scope_concepts, out_of_scope_concepts: intentPlan.out_of_scope_concepts },
    evidenceRows: evidencePool,
  }, fns);
  if (synthesisResult.pipelineMetrics) modelCalls.push({ role: 'publication_editor', model_calls: synthesisResult.pipelineMetrics.model_calls, input_tokens: synthesisResult.pipelineMetrics.total_input_tokens, output_tokens: synthesisResult.pipelineMetrics.total_output_tokens });

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
  const writeFn = fns.writeFn || writeEducationPagePlan;
  const route = `${ACTIVE_CLUSTERS[clusterKey].route_prefix}/${intentPlan.route_slug}`;
  const writerResult = await writeFn(env, { intentPlan, clearedSnapshot, route, cluster: clusterKey, existingClusterPages });
  if (writerResult.ok) modelCalls.push({ role: 'education_writer', ...writerResult.usage });
  if (!writerResult.ok) {
    return finish({ candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier, publication_editor_result: { status: 'AUTO_READY' }, final_state: RUN_FINAL_STATE.CONFIG_BLOCKED, exception_reason: `Writer call failed: ${writerResult.reason}` });
  }

  const planValidation = validateEducationPagePlan(writerResult.output, clearedSnapshot);
  if (!planValidation.valid) {
    return finish({ candidate_topics: candidateTopics, selected_topic: selected.topic_slug, risk_tier: selected.v1_result.risk_tier, publication_editor_result: { status: 'AUTO_READY' }, writer_result: { valid: false, violations: planValidation.violations }, final_state: RUN_FINAL_STATE.EDITORIAL_REVIEW, exception_reason: `Page Plan failed deterministic validation: ${planValidation.violations.join(', ')}` });
  }
  const plan = writerResult.output;

  // --- Education Reviewer --------------------------------------------------
  const reviewFn = fns.reviewFn || reviewEducationPagePlan;
  const reviewResult = await reviewFn(env, { plan, clearedSnapshot, intentPlan });
  if (reviewResult.ok) modelCalls.push({ role: 'education_reviewer', ...reviewResult.usage });
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
  mkdirSync(path.dirname(articlePath), { recursive: true });
  writeFileSync(articlePath, renderEducationPageHtml(plan));

  const relativePlanPath = `functions/_data/education-page-plans/${plan.topic_slug}.json`;
  const planArtifactPath = path.join(ROOT, relativePlanPath);
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

function parseArgs(argv) {
  const args = { mode: 'shadow' };
  for (const a of argv) {
    if (a === '--shadow') args.mode = 'shadow';
    else if (a === '--prepare') args.mode = 'prepare';
    else if (a === '--publish') args.mode = 'publish';
    else if (a.startsWith('--from-prepared=')) args.fromPrepared = a.split('=')[1];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`=== AIMT Education Operations v1 (mode: --${args.mode}) ===`);

  if (args.mode === 'publish') {
    if (!isAutopublishEnabled(process.env)) {
      console.log(`${AUTOPUBLISH_ENV_VAR} is not "true" -- refusing to run --publish. This is the correct, safe default.`);
      process.exit(0);
    }
    if (!args.fromPrepared || !existsSync(args.fromPrepared)) {
      console.error('--publish requires --from-prepared=<path to a prepared artifact JSON file>.');
      process.exit(1);
    }
    const preparedArtifact = JSON.parse(readFileSync(args.fromPrepared, 'utf8'));
    const result = await publishPreparedArtifact(preparedArtifact, {
      writeFn: (record) => (preparedArtifact.__replace
        ? replaceNonPublicClearanceRecord(process.env, record, { requireCurrentHash: preparedArtifact.__replace.requireCurrentHash })
        : writeClearanceRecord(process.env, record)),
    });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  // --shadow and --prepare share the decision pipeline.
  const report = await runDecisionPipeline(process.env, { mode: args.mode });
  const reportPath = persistRunReport(report);
  console.log(`[report] ${report.final_state} -- written to ${path.relative(ROOT, reportPath)}`);
  console.log(JSON.stringify({ ...report, __internal: undefined }, null, 2));

  if (args.mode === 'prepare' && report.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY) {
    console.log('\n[prepare] Writing generated artifacts (article HTML, Page Plan data artifact, cluster hub card)...');
    const artifacts = prepareGeneratedArtifacts(report);
    console.log(`[prepare] wrote ${artifacts.articlePath}, ${artifacts.planArtifactPath}, ${artifacts.hubPath}`);
    console.log(`[prepare] diff allowlist: ${artifacts.allowlistResult.valid ? 'PASS' : 'FAIL'} (${artifacts.allowlistResult.allowed.length} allowed path(s))`);

    const preparedArtifactPath = path.join(ROOT, 'research-import', 'education-ops', 'prepared', `${report.selected_topic}-${report.run_id}.json`);
    mkdirSync(path.dirname(preparedArtifactPath), { recursive: true });
    writeFileSync(preparedArtifactPath, JSON.stringify(report.__internal.preparedArtifact, null, 2));
    console.log(`[prepare] prepared clearance artifact (for a future --publish): ${path.relative(ROOT, preparedArtifactPath)}`);

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
