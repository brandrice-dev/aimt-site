/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations — deterministic topic selector
   ---------------------------------------------------------------
   PURE. Zero I/O, zero model calls. Given the full claims/sources
   arrays already fetched for the registered concepts' controlled
   topics (publication-readiness-loader.mjs#fetchTopicEvidenceLive or
   the local export), decides which ONE topic (if any) is eligible for a
   new autonomous page this run.

   Scope: GOVERNED MULTI-CLUSTER. Every autonomously-selectable concept
   in the authoritative publication registry
   (education-publication-registry.mjs), across EVERY registered public
   cluster, is evaluated in the same run, and AT MOST ONE is selected.
   (Historical: v1 was restricted to the single Hair Loss & Shedding
   pilot cluster and the six PILOT_TOPIC_CONCEPTS -- that restriction is
   retired.) Adding a cluster or concept is still an owner/registry
   edit; this selector never invents one, and a research packet never
   becomes a candidate by itself -- packets only add evidence to the
   registered concepts whose controlled_topics they are tagged with.

   SEO opportunity: this repo has no real Search Console/keyword-tool
   integration yet (see docs/seo/AIMT-SEO-OPERATING-MODEL.md). Every
   score this module produces is explicitly labeled
   SEARCH_OPPORTUNITY_HEURISTIC -- never presented as a measured metric.
   The scoring function accepts an optional injected real-signal
   provider so a future Search Console integration can be plugged in
   without rewriting this module's selection logic.
   ═══════════════════════════════════════════════════════════════ */

import { selectTopicEvidenceFromRows } from '../research/publication-readiness-loader.mjs';
import { assessTopicReadiness, READINESS_STATUS, RISK_TIER } from '../research/publication-readiness.mjs';
import { isTopicHeldByResearchGap } from './education-research-gap-queue.mjs';
import { PUBLICATION_CLUSTERS, PUBLICATION_CONCEPTS } from './education-publication-registry.mjs';

/* Backwards-compatible view of the registry's clusters, in the shape
   older callers/tests expect ({label, route_prefix, member_topic_slugs}).
   Derived -- never edited independently of the registry. */
export const ACTIVE_CLUSTERS = Object.freeze(Object.fromEntries(
  Object.values(PUBLICATION_CLUSTERS).map((cluster) => [cluster.key, Object.freeze({
    label: cluster.label,
    route_prefix: cluster.route_prefix,
    hub_file: cluster.hub_file,
    member_topic_slugs: Object.freeze(PUBLICATION_CONCEPTS.filter((c) => c.cluster === cluster.key).map((c) => c.topic_slug)),
  })]),
));

// HISTORICAL: the v1 pilot's single active cluster. Retained as an
// export for older tests/scripts only -- selectNextTopic() no longer
// defaults to one cluster; it evaluates every registered cluster.
export const DEFAULT_ACTIVE_CLUSTER = 'hair-loss-shedding';

// Topics with a live, published Education page, AS OF THE LAST TIME
// THIS FILE WAS EDITED. This is a FIXTURE/HISTORY DEFAULT for pure unit
// tests only -- it is NOT operational truth. The real CLI
// (scripts/education-operations-cycle.mjs) always resolves the current
// published-topic set live, from research_public_pages
// (status='published' AND sitemap_eligible=true) via
// education-published-state-loader.mjs#fetchPublishedTopicSlugsLive,
// and passes it into checkCannibalization/selectNextTopic explicitly
// below -- so a newly published page is excluded from new-page
// selection automatically on the next run, with no edit to this
// constant required. A topic here does NOT become eligible again just
// because it's in this list; it may still be considered by the
// FRESHNESS monitor (a different lane, see
// education-freshness-monitor.mjs), never by this selector.
export const PUBLISHED_TOPIC_SLUGS = Object.freeze(['hair-cycle', 'telogen-effluvium']);

export class TopicSelectionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TopicSelectionError';
  }
}

/**
 * Every registered, autonomously-selectable, not-yet-published concept
 * -- optionally narrowed to an explicit list of cluster keys (tests /
 * diagnostics only; the real orchestrator evaluates all clusters).
 */
export function candidateConceptsForSelection({ publishedTopicSlugs, clusterKeys = null, concepts = PUBLICATION_CONCEPTS, clusters = PUBLICATION_CLUSTERS }) {
  if (clusterKeys) {
    for (const key of clusterKeys) {
      if (!clusters[key]) throw new TopicSelectionError(`Unknown publication cluster "${key}".`);
    }
  }
  const clusterFilter = clusterKeys ? new Set(clusterKeys) : null;
  return concepts.filter((c) => c.autonomously_selectable === true
    && clusters[c.cluster]
    && (!clusterFilter || clusterFilter.has(c.cluster))
    && !publishedTopicSlugs.includes(c.topic_slug));
}

/**
 * Deterministic, explicitly-labeled-heuristic opportunity score. Higher
 * is better. Built entirely from measurable, already-available signals
 * -- no invented search volume, CPC, keyword difficulty, or ranking
 * data anywhere in this function.
 *
 * @param {object} v1Result - assessTopicReadiness() output
 * @returns {{score: number, signal_type: 'SEARCH_OPPORTUNITY_HEURISTIC', basis: string[]}}
 */
export function scoreSearchOpportunityHeuristic(v1Result) {
  const basis = [];
  let score = 0;
  const m = v1Result.metrics;

  // Evidence depth is the strongest proxy this repo has for "AIMT can
  // say something substantive here" -- deeper evidence -> more likely
  // to produce a genuinely useful page, independent of any real
  // keyword signal.
  score += Math.min(m.distinct_source_count, 20) * 2;
  basis.push(`distinct_source_count=${m.distinct_source_count}`);
  score += Math.min(m.candidate_claim_count, 100) * 0.5;
  basis.push(`candidate_claim_count=${m.candidate_claim_count}`);

  // Prefer ordinary risk over maximal complexity, mirroring the
  // hand-run selection rationale used for telogen-effluvium: LOWER/
  // MODERATE preferred, and within MODERATE, lower apparent
  // treatment/diagnosis-term density (approximated here by evidence_gaps
  // being empty and no unresolved conflict flags) is preferred over a
  // denser, riskier candidate.
  if (v1Result.risk_tier === RISK_TIER.LOWER) { score += 15; basis.push('risk_tier=LOWER (+15)'); }
  else if (v1Result.risk_tier === RISK_TIER.MODERATE) { score += 8; basis.push('risk_tier=MODERATE (+8)'); }

  if (Array.isArray(v1Result.conflict_flags) && v1Result.conflict_flags.length === 0) {
    score += 5; basis.push('no conflict flags (+5)');
  }

  return { score, signal_type: 'SEARCH_OPPORTUNITY_HEURISTIC', basis };
}

/**
 * CLUSTER-AWARE cannibalization check: is this candidate's substantive
 * public answer already fully covered by pages that are live?
 *
 * Detects genuinely redundant PUBLIC PAGE INTENT, not shared evidence:
 *
 *   1. SAME_CLUSTER_COMPOSITION -- within the candidate's own cluster,
 *      the candidate's controlled_topics are fully covered by the union
 *      of published concepts that are each NARROWER-OR-EQUAL to it
 *      (every published concept counted has controlled_topics that are
 *      a subset of the candidate's). This is the original pilot case:
 *      "shedding-vs-hair-loss" (telogen-effluvium + hair-cycle) when
 *      both telogen-effluvium and hair-cycle are already live as their
 *      own pages -- a reader finds nothing new.
 *   2. IDENTICAL_INTENT -- any published concept, in ANY cluster, built
 *      from exactly the same controlled-topic set (defense in depth;
 *      the registry itself already refuses to register two such
 *      concepts).
 *
 * Deliberately NOT cannibalization: a candidate that merely SHARES a
 * controlled research topic with a published page in a DIFFERENT
 * cluster (e.g. Product Science "surfactants" vs. a live Scalp Health
 * "scalp-barrier-ph" page that also draws on surfactant evidence), or
 * with a BROADER published concept (a direct page is never blocked by a
 * published umbrella/constructed page that merely includes its topic).
 * Those are different useful public contexts; evidence reuse across
 * them is expected. Such overlaps are reported in shared_evidence_with
 * for observability only.
 *
 * @param {object} concept - a registry concept (education-publication-registry.mjs)
 * @param {string[]} [publishedTopicSlugs] - the CURRENT published-topic
 *   set; defaults to the PUBLISHED_TOPIC_SLUGS fixture constant for pure
 *   unit tests, but the real orchestrator always passes the live-loaded
 *   set explicitly (see this module's header comment).
 * @param {{concepts?: object[]}} [options] - test-only registry override
 * @returns {{cannibalizes: boolean, basis: string|null, overlapping_with: string[], shared_evidence_with: string[]}}
 */
export function checkCannibalization(concept, publishedTopicSlugs = PUBLISHED_TOPIC_SLUGS, options = {}) {
  const concepts = options.concepts || PUBLICATION_CONCEPTS;
  // A concept passed in from the backwards-compatible PILOT_TOPIC_CONCEPTS
  // projection carries no `cluster` field -- resolve it from the registry.
  const registered = concepts.find((c) => c.topic_slug === concept.topic_slug);
  const conceptCluster = concept.cluster || (registered && registered.cluster) || null;
  // A topic that is itself already published is (trivially) covered --
  // it matches itself under IDENTICAL_INTENT below, as it always has.
  const publishedConcepts = concepts.filter((c) => publishedTopicSlugs.includes(c.topic_slug));
  const candidateTopics = new Set(concept.controlled_topics);
  const sharesTopic = (published) => published.controlled_topics.some((t) => candidateTopics.has(t));

  const sameCluster = publishedConcepts.filter((c) => c.cluster === conceptCluster);
  const overlapping = sameCluster.filter(sharesTopic).map((c) => c.topic_slug);
  const sharedEvidence = publishedConcepts.filter((c) => c.cluster !== conceptCluster && sharesTopic(c)).map((c) => c.topic_slug);

  const narrowerSameCluster = sameCluster.filter((c) => c.controlled_topics.every((t) => candidateTopics.has(t)));
  const narrowerUnion = new Set(narrowerSameCluster.flatMap((c) => c.controlled_topics));
  const composedOfPublished = concept.controlled_topics.length > 0
    && concept.controlled_topics.every((t) => narrowerUnion.has(t));

  const identical = publishedConcepts.filter((c) => c.controlled_topics.length === concept.controlled_topics.length
    && c.controlled_topics.every((t) => candidateTopics.has(t)));

  let basis = null;
  let overlappingWith = overlapping;
  if (identical.length > 0) {
    basis = 'IDENTICAL_INTENT';
    overlappingWith = [...new Set([...overlapping, ...identical.map((c) => c.topic_slug)])];
  } else if (composedOfPublished) {
    basis = 'SAME_CLUSTER_COMPOSITION';
  }
  return { cannibalizes: basis !== null, basis, overlapping_with: overlappingWith, shared_evidence_with: sharedEvidence };
}

/**
 * Runs the full selection pipeline across EVERY registered public
 * cluster against an already-fetched {claims, sources} pool (the caller
 * is responsible for I/O -- see education-operations-cycle.mjs). Pure
 * and synchronous. Returns AT MOST ONE selected topic.
 *
 * @param {{claims: object[], sources: object[]}} evidencePool - the
 *   FULL claims/sources rows already fetched for this run (any topic)
 * @param {{clusterKeys?: string[], clusterKey?: string, publishedTopicSlugs?: string[], activeResearchGapsBySlug?: object, concepts?: object[]}} [options]
 *   clusterKeys/clusterKey optionally narrow evaluation to specific
 *   clusters (tests/diagnostics only -- the real orchestrator passes
 *   neither, so every registered cluster is evaluated).
 *   publishedTopicSlugs defaults to the PUBLISHED_TOPIC_SLUGS fixture
 *   constant for pure unit tests; the real orchestrator always passes
 *   the live-loaded set explicitly (see this module's header comment).
 *   activeResearchGapsBySlug (RESEARCH-GAP FEEDBACK LOOP: education-
 *   research-gap-queue.mjs) defaults to {} -- maps topic_slug -> its
 *   active publication_evidence_gap queue row, for topics (in ANY
 *   cluster) that currently have one.
 * @returns {{
 *   cluster: string|null,
 *   clusters_evaluated: string[],
 *   candidates: Array<{topic_slug: string, cluster: string, concept: object, v1_result: object, opportunity: object, cannibalization: object, eligible: boolean, ineligible_reason: string|null}>,
 *   selected: object|null,
 *   selection_reason: string
 * }}
 */
export function selectNextTopic(evidencePool, options = {}) {
  const clusterKeys = options.clusterKeys || (options.clusterKey ? [options.clusterKey] : null);
  const publishedTopicSlugs = options.publishedTopicSlugs || PUBLISHED_TOPIC_SLUGS;
  const activeResearchGapsBySlug = options.activeResearchGapsBySlug || {};
  const registryConcepts = options.concepts || PUBLICATION_CONCEPTS;
  const concepts = candidateConceptsForSelection({ publishedTopicSlugs, clusterKeys, concepts: registryConcepts });
  const clustersEvaluated = clusterKeys ? [...clusterKeys] : Object.keys(PUBLICATION_CLUSTERS);

  const candidates = concepts.map((concept) => {
    const { claims, sources } = selectTopicEvidenceFromRows(concept.controlled_topics, evidencePool);
    const v1Result = assessTopicReadiness({
      topic_slug: concept.topic_slug,
      seo_page_concept: concept.seo_page_concept,
      controlled_topics: concept.controlled_topics,
      claims,
      sources,
    });
    const opportunity = scoreSearchOpportunityHeuristic(v1Result);
    const cannibalization = checkCannibalization(concept, publishedTopicSlugs, { concepts: registryConcepts });

    let eligible = true;
    let ineligibleReason = null;
    // SELECTION SAFETY -- never autonomous for HIGH risk or a topic
    // whose deterministic v1 assessment already flags HUMAN_REVIEW.
    if (v1Result.risk_tier === RISK_TIER.HIGH) { eligible = false; ineligibleReason = 'HIGH_RISK_NEVER_AUTONOMOUS'; }
    else if (v1Result.readiness_status === READINESS_STATUS.HUMAN_REVIEW) { eligible = false; ineligibleReason = 'HUMAN_REVIEW_NEVER_AUTONOMOUS'; }
    else if (v1Result.readiness_status === READINESS_STATUS.NOT_READY) { eligible = false; ineligibleReason = 'NOT_READY_SKIP'; }
    else if (Array.isArray(v1Result.evidence_gaps) && v1Result.evidence_gaps.length > 0) { eligible = false; ineligibleReason = 'EVIDENCE_GAPS_SKIP'; }
    else if (v1Result.readiness_status !== READINESS_STATUS.NEEDS_SYNTHESIS) { eligible = false; ineligibleReason = `UNEXPECTED_READINESS_STATUS:${v1Result.readiness_status}`; }
    else if (cannibalization.cannibalizes) { eligible = false; ineligibleReason = `CANNIBALIZES_PUBLISHED:${cannibalization.overlapping_with.join(',')}`; }
    // RESEARCH-GAP FEEDBACK LOOP (checked LAST -- never overrides any of
    // the safety/readiness/cannibalization reasons above; only excludes
    // a topic that would otherwise be eligible). Holds a topic that
    // already has an active (pending/claimed) evidence-gap request whose
    // baseline candidate claim set has not changed since -- see
    // education-research-gap-queue.mjs#isTopicHeldByResearchGap for the
    // exact release conditions (a changed claim set, or research_received).
    else if (isTopicHeldByResearchGap(activeResearchGapsBySlug[concept.topic_slug], v1Result.candidate_claim_ids)) {
      eligible = false; ineligibleReason = 'RESEARCH_GAP_PENDING';
    }

    return { topic_slug: concept.topic_slug, cluster: concept.cluster, concept, v1_result: v1Result, opportunity, cannibalization, eligible, ineligible_reason: ineligibleReason };
  });

  const eligibleCandidates = candidates.filter((c) => c.eligible);
  if (eligibleCandidates.length === 0) {
    return { cluster: null, clusters_evaluated: clustersEvaluated, candidates, selected: null, selection_reason: 'NO_ELIGIBLE_TOPIC' };
  }

  // Highest opportunity score wins across ALL clusters; ties broken by
  // topic_slug for determinism (never by call order, cluster order, or
  // object insertion order).
  eligibleCandidates.sort((a, b) => (b.opportunity.score - a.opportunity.score) || a.topic_slug.localeCompare(b.topic_slug));
  const selected = eligibleCandidates[0];

  return {
    cluster: selected.cluster,
    clusters_evaluated: clustersEvaluated,
    candidates,
    selected,
    selection_reason: `Highest SEARCH_OPPORTUNITY_HEURISTIC score (${selected.opportunity.score}) among ${eligibleCandidates.length} eligible candidate(s) across ${clustersEvaluated.length} cluster(s); selected "${selected.topic_slug}" in ${selected.cluster}: ${selected.opportunity.basis.join('; ')}.`,
  };
}
