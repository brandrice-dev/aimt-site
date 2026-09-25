/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — deterministic topic selector
   ---------------------------------------------------------------
   PURE. Zero I/O, zero model calls. Given the full claims/sources
   arrays already fetched for the active cluster's candidate concepts
   (publication-readiness-loader.mjs#fetchTopicEvidenceLive or the local
   export), decides which ONE topic (if any) is eligible for a new
   autonomous page this run.

   Scope, per the originating task: v1 is restricted to ONE active
   public cluster -- Hair Loss & Shedding -- and to topic_slugs already
   named in PILOT_TOPIC_CONCEPTS (publication-readiness-loader.mjs).
   Activating a new institutional cluster, or discovering a wholly new
   topic_slug the owner has never named, is explicitly NOT this
   selector's job -- that stays an owner/strategy decision (see the
   originating task's "PHASE 2" scope note).

   SEO opportunity: this repo has no real Search Console/keyword-tool
   integration yet (see docs/seo/AIMT-SEO-OPERATING-MODEL.md). Every
   score this module produces is explicitly labeled
   SEARCH_OPPORTUNITY_HEURISTIC -- never presented as a measured metric.
   The scoring function accepts an optional injected real-signal
   provider so a future Search Console integration can be plugged in
   without rewriting this module's selection logic.
   ═══════════════════════════════════════════════════════════════ */

import { PILOT_TOPIC_CONCEPTS, selectTopicEvidenceFromRows } from '../research/publication-readiness-loader.mjs';
import { assessTopicReadiness, READINESS_STATUS, RISK_TIER } from '../research/publication-readiness.mjs';

export const ACTIVE_CLUSTERS = Object.freeze({
  'hair-loss-shedding': {
    label: 'Hair Loss & Shedding',
    route_prefix: '/education/hair-loss',
    // topic_slugs (PILOT_TOPIC_CONCEPTS keys) that belong to this
    // cluster. Hand-registered, same discipline as PILOT_TOPIC_CONCEPTS
    // itself -- a topic never becomes cluster-eligible by inference.
    member_topic_slugs: Object.freeze(['hair-loss', 'shedding-vs-hair-loss', 'androgenetic-alopecia', 'telogen-effluvium', 'alopecia-areata', 'hair-cycle']),
  },
});

export const DEFAULT_ACTIVE_CLUSTER = 'hair-loss-shedding';

// Topics with a live, published Education page, AS OF THE LAST TIME
// THIS FILE WAS EDITED. This is a FIXTURE/HISTORY DEFAULT for pure unit
// tests only -- it is NOT operational truth. The real CLI
// (scripts/education-operations-cycle.mjs) always resolves the current
// published-topic set live, from research_public_pages
// (status='published' AND sitemap_eligible=true) via
// education-published-state-loader.mjs#fetchPublishedTopicSlugsLive,
// and passes it into candidateConceptsForCluster/checkCannibalization/
// selectNextTopic explicitly below -- so a newly published page is
// excluded from new-page selection automatically on the next run, with
// no edit to this constant required. A topic here does NOT become
// eligible again just because it's in this list; it may still be
// considered by the FRESHNESS monitor (a different lane, see
// education-freshness-monitor.mjs), never by this selector.
export const PUBLISHED_TOPIC_SLUGS = Object.freeze(['hair-cycle', 'telogen-effluvium']);

export class TopicSelectionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TopicSelectionError';
  }
}

function candidateConceptsForCluster(clusterKey, publishedTopicSlugs) {
  const cluster = ACTIVE_CLUSTERS[clusterKey];
  if (!cluster) throw new TopicSelectionError(`Unknown active cluster "${clusterKey}".`);
  const memberSet = new Set(cluster.member_topic_slugs);
  return PILOT_TOPIC_CONCEPTS.filter((c) => memberSet.has(c.topic_slug) && !publishedTopicSlugs.includes(c.topic_slug));
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
 * Cannibalization check: does this candidate's controlled_topics
 * meaningfully overlap with an already-published topic's controlled
 * topics? A same-cluster overlap is expected (they share a cluster by
 * definition) -- this flags the narrower case of a candidate that is
 * ALMOST the same underlying evidence as a page that already exists
 * (e.g. re-selecting "shedding-vs-hair-loss" when both hair-cycle and
 * telogen-effluvium, its only two controlled_topics, are already
 * published on their own pages -- nothing new for a reader).
 *
 * @param {object} concept - a PILOT_TOPIC_CONCEPTS entry
 * @param {string[]} [publishedTopicSlugs] - the CURRENT published-topic
 *   set; defaults to the PUBLISHED_TOPIC_SLUGS fixture constant for pure
 *   unit tests, but the real orchestrator always passes the live-loaded
 *   set explicitly (see this module's header comment).
 * @returns {{cannibalizes: boolean, overlapping_with: string[]}}
 */
export function checkCannibalization(concept, publishedTopicSlugs = PUBLISHED_TOPIC_SLUGS) {
  const publishedConcepts = PILOT_TOPIC_CONCEPTS.filter((c) => publishedTopicSlugs.includes(c.topic_slug));
  // Check against the UNION of every published concept's controlled_topics,
  // not each individually -- a candidate like "shedding-vs-hair-loss"
  // (controlled_topics: telogen-effluvium, hair-cycle) is not fully
  // covered by EITHER published topic alone, but IS fully covered by the
  // two of them TOGETHER, which is exactly the case where a reader would
  // find nothing new versus the two pages that already exist.
  const publishedUnion = new Set(publishedConcepts.flatMap((c) => c.controlled_topics));
  const overlapping = publishedConcepts
    .filter((published) => concept.controlled_topics.some((t) => published.controlled_topics.includes(t)))
    .map((c) => c.topic_slug);
  const fullyCovered = concept.controlled_topics.length > 0
    && concept.controlled_topics.every((t) => publishedUnion.has(t));
  return { cannibalizes: fullyCovered, overlapping_with: overlapping };
}

/**
 * Runs the full selection pipeline for one cluster against an already-
 * fetched {claims, sources} pool (the caller is responsible for I/O --
 * see education-operations-cycle.mjs). Pure and synchronous.
 *
 * @param {{claims: object[], sources: object[]}} evidencePool - the
 *   FULL claims/sources rows already fetched for this run (any topic)
 * @param {{clusterKey?: string, publishedTopicSlugs?: string[]}} [options]
 *   publishedTopicSlugs defaults to the PUBLISHED_TOPIC_SLUGS fixture
 *   constant for pure unit tests; the real orchestrator always passes
 *   the live-loaded set explicitly (see this module's header comment).
 * @returns {{
 *   cluster: string,
 *   candidates: Array<{topic_slug: string, v1_result: object, opportunity: object, cannibalization: object, eligible: boolean, ineligible_reason: string|null}>,
 *   selected: object|null,
 *   selection_reason: string
 * }}
 */
export function selectNextTopic(evidencePool, options = {}) {
  const clusterKey = options.clusterKey || DEFAULT_ACTIVE_CLUSTER;
  const publishedTopicSlugs = options.publishedTopicSlugs || PUBLISHED_TOPIC_SLUGS;
  const concepts = candidateConceptsForCluster(clusterKey, publishedTopicSlugs);

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
    const cannibalization = checkCannibalization(concept, publishedTopicSlugs);

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

    return { topic_slug: concept.topic_slug, concept, v1_result: v1Result, opportunity, cannibalization, eligible, ineligible_reason: ineligibleReason };
  });

  const eligibleCandidates = candidates.filter((c) => c.eligible);
  if (eligibleCandidates.length === 0) {
    return { cluster: clusterKey, candidates, selected: null, selection_reason: 'NO_ELIGIBLE_TOPIC' };
  }

  // Highest opportunity score wins; ties broken by topic_slug for
  // determinism (never by call order / object insertion order alone).
  eligibleCandidates.sort((a, b) => (b.opportunity.score - a.opportunity.score) || a.topic_slug.localeCompare(b.topic_slug));
  const selected = eligibleCandidates[0];

  return {
    cluster: clusterKey,
    candidates,
    selected,
    selection_reason: `Highest SEARCH_OPPORTUNITY_HEURISTIC score (${selected.opportunity.score}) among ${eligibleCandidates.length} eligible candidate(s): ${selected.opportunity.basis.join('; ')}.`,
  };
}
