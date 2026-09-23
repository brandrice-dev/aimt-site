/* ═══════════════════════════════════════════════════════════════
   AIMT Publication Editor v1 — pure topic-readiness engine
   ---------------------------------------------------------------
   SHADOW MODE. This module computes a REPORTING-ONLY readiness
   opinion about a topic's CLAIM_VERIFIED (or better) research. It
   never reads or writes Supabase itself (see publication-readiness-
   loader.mjs for the read-only data layer) and its output never
   feeds back into the database -- nothing here sets AIMT_APPROVED,
   public_eligible, published, or any research_public_pages row.

   What this is NOT:
     - Not the Harvester / Rick. Rick's trust ladder (DISCOVERED ->
       SOURCE_VERIFIED -> CLAIM_VERIFIED -> AIMT_APPROVED, see
       functions/_lib/research/schema.mjs) asks "is this claim's
       wording faithful to its own source?" This module asks a
       different, topic-level question: "given the claims that have
       already cleared that ladder, is the TOPIC as a whole ready for
       a human editor to consider for public framing?" It reads the
       ladder; it never changes it.
     - Not an AI synthesis layer. Every rule below is an explicit,
       deterministic check against real schema fields (see
       supabase/migrations/20260920_create_research_library.sql /
       functions/_lib/research/schema.mjs for field names). No model
       call, no free-text interpretation of claim_text. A v2 synthesis
       layer can sit ON TOP of this after these hard safety/governance
       checks, never instead of them (see docs/research/
       AIMT-Publication-Editor-v1.md).

   Design stance, per the originating request: when a rule can't
   confidently place a topic in LOWER or MODERATE risk, it defaults
   to HIGH / NEEDS_REVIEW. Never guess downward.
   ═══════════════════════════════════════════════════════════════ */

import { CONTROLLED_TOPICS } from './schema.mjs';

export const RISK_TIER = Object.freeze({ LOWER: 'LOWER', MODERATE: 'MODERATE', HIGH: 'HIGH' });
export const READINESS_STATUS = Object.freeze({
  READY: 'READY',
  NOT_READY: 'NOT_READY',
  NEEDS_REVIEW: 'NEEDS_REVIEW'
});

/* Claims only ever count toward a topic's evidence base once they have
   cleared Rick's ladder at CLAIM_VERIFIED or above (AIMT_APPROVED is
   strictly further along the same ladder, so it counts too). */
const VERIFIED_STATUSES = ['CLAIM_VERIFIED', 'AIMT_APPROVED'];

/* A claim that is CLAIM_VERIFIED but has since been marked excluded or
   superseded (research_claims.use_status) is deliberately withheld from
   candidacy -- Rick verified the wording once, but AIMT's own workflow
   has already said "don't use this one." Provisional/needs_review claims
   ARE current, in-use material in the live corpus (see below) and remain
   candidates; needs_review additionally trips a conflict flag. */
const NON_CANDIDATE_USE_STATUSES = ['excluded', 'superseded'];

/* Evidence types the schema itself distinguishes as higher-authority
   synthesis/consensus work (supabase/migrations/...#research_sources_
   evidence_type_check). RCTs are primary research, not synthesis, but
   are grouped here per the originating request's own "systematic_review,
   meta_analysis, clinical_guideline, ... RCT if represented" framing. */
export const SYSTEMATIC_TIER_EVIDENCE_TYPES = Object.freeze([
  'systematic_review', 'meta_analysis', 'clinical_guideline', 'rct'
]);

/* "Professional consensus" per the originating request: a professional
   body's own position (evidence_type=professional_org) or a source whose
   role IS a guideline (source_role=guideline), distinct from the
   systematic-review/meta-analysis/RCT evidence-type tier above but still
   higher-authority than a single narrative review or observational study. */
function isProfessionalConsensusSource(source) {
  return source.evidence_type === 'professional_org' || source.source_role === 'guideline';
}

/* ── STEP 3: risk classification ──────────────────────────────────────
   Explicit per-topic baseline, keyed on the actual controlled vocabulary
   in functions/_lib/research/schema.mjs's CONTROLLED_TOPICS (24 values).
   Grounded in the originating request's own worked examples wherever it
   gave one (cited inline); everything else is a conservative judgment
   call flagged for owner review in docs/research/AIMT-Publication-
   Editor-v1.md. Any topic NOT in this map (e.g. a future addition to
   CONTROLLED_TOPICS that this file hasn't been updated for) falls
   through to the HIGH default in baselineRiskForTopic() below -- never
   guess downward for an unrecognized topic. */
export const TOPIC_RISK_BASELINE = Object.freeze({
  // LOWER — "anatomy, hair growth cycle, definitions, basic cosmetic
  // scalp physiology, general educational background" (originating
  // request, Step 3).
  'hair-biology': RISK_TIER.LOWER,
  'hair-cycle': RISK_TIER.LOWER,
  'trichology': RISK_TIER.LOWER,

  // MODERATE — named directly in the originating request's own examples:
  // "shedding patterns" (telogen-effluvium), "scalp microbiome",
  // "dandruff / seborrheic dermatitis education".
  'telogen-effluvium': RISK_TIER.MODERATE,
  'scalp-microbiome': RISK_TIER.MODERATE,
  'dandruff': RISK_TIER.MODERATE,
  'seborrheic-dermatitis': RISK_TIER.MODERATE,
  // MODERATE — "condition characteristics" / "look-alike / differential
  // educational framing" per the same Step 3 examples; named alopecia
  // conditions and other scalp conditions educated on descriptively,
  // not as diagnosis/treatment/medication content (claim-level rules in
  // assessTopicReadiness() escalate individual topics further when a
  // safety_conclusion claim or similar actually shows up in their real
  // evidence base).
  'androgenetic-alopecia': RISK_TIER.MODERATE,
  'alopecia-areata': RISK_TIER.MODERATE,
  'psoriasis-scalp': RISK_TIER.MODERATE,
  'folliculitis': RISK_TIER.MODERATE,
  'scalp-health': RISK_TIER.MODERATE,
  // MODERATE — cosmetic/product and technique topics: not diagnosis or
  // medication, but formulation/technique claims can carry irritancy,
  // efficacy, or safety framing that a Lower default would understate.
  'cosmetic-ingredients': RISK_TIER.MODERATE,
  'surfactants': RISK_TIER.MODERATE,
  'conditioning-agents': RISK_TIER.MODERATE,
  'essential-oils-botanicals': RISK_TIER.MODERATE,
  'treatment-modalities': RISK_TIER.MODERATE,
  'massage-circulation': RISK_TIER.MODERATE,

  // HIGH — "medications", "dosing" (actives-minoxidil is a named active
  // pharmaceutical ingredient; actives-other is the same category by
  // construction) and the topic literally named "contraindications" from
  // the originating request's own HIGH examples.
  'actives-minoxidil': RISK_TIER.HIGH,
  'actives-other': RISK_TIER.HIGH,
  'contraindications': RISK_TIER.HIGH,
  // HIGH — "anything where a public-facing error could materially harm
  // someone" (Step 3): practitioner-safety and infection-control are
  // exactly that category (a wrong public claim here is a real-world
  // safety failure, not just an inaccurate fact).
  'practitioner-safety': RISK_TIER.HIGH,
  'infection-control': RISK_TIER.HIGH,
  // HIGH — dermatology-adjacent content sits closest to diagnosis/
  // treatment scope of anything in the controlled vocabulary; cannot be
  // confidently called Lower or Moderate, so it defaults HIGH per the
  // "do not guess downward" rule.
  'adjacent-dermatology': RISK_TIER.HIGH
});

/* Fails safe: a topic outside the map above (or outside the documented
   controlled vocabulary entirely) is never assumed Lower/Moderate. */
export function baselineRiskForTopic(topic) {
  if (Object.prototype.hasOwnProperty.call(TOPIC_RISK_BASELINE, topic)) return TOPIC_RISK_BASELINE[topic];
  return RISK_TIER.HIGH;
}

const TIER_SEVERITY = { [RISK_TIER.LOWER]: 0, [RISK_TIER.MODERATE]: 1, [RISK_TIER.HIGH]: 2 };
const SEVERITY_TIER = [RISK_TIER.LOWER, RISK_TIER.MODERATE, RISK_TIER.HIGH];

/** A publication concept can span more than one controlled_topics value
    (see PILOT_TOPIC_CONCEPTS in publication-readiness-loader.mjs). Its
    risk tier is the MOST severe of its constituent topics' baselines --
    never diluted by averaging or by a lower-risk topic in the same
    concept. */
export function classifyTopicRisk(controlledTopics) {
  if (!Array.isArray(controlledTopics) || controlledTopics.length === 0) {
    return {
      risk_tier: RISK_TIER.HIGH,
      per_topic_baseline: {},
      reasons: ['No controlled_topics supplied for this concept; defaulting to HIGH rather than guessing.']
    };
  }
  const per_topic_baseline = {};
  let maxSeverity = 0;
  for (const topic of controlledTopics) {
    const tier = baselineRiskForTopic(topic);
    per_topic_baseline[topic] = tier;
    maxSeverity = Math.max(maxSeverity, TIER_SEVERITY[tier]);
    if (!CONTROLLED_TOPICS.includes(topic)) {
      per_topic_baseline[topic] = RISK_TIER.HIGH;
      maxSeverity = Math.max(maxSeverity, TIER_SEVERITY[RISK_TIER.HIGH]);
    }
  }
  const risk_tier = SEVERITY_TIER[maxSeverity];
  const reasons = controlledTopics.map((t) => `${t}: baseline ${per_topic_baseline[t]}`);
  return { risk_tier, per_topic_baseline, reasons };
}

/* ── STEP 4/6: corroboration thresholds ─────────────────────────────── */
/* Same distinct-source floor at every tier; HIGH-risk topics are forced
   to NEEDS_REVIEW by risk tier alone regardless of this number (see
   assessTopicReadiness) -- kept uniform here so the metric stays
   comparable across tiers instead of becoming an unsatisfiable Infinity. */
const REQUIRED_DISTINCT_SOURCES = 2;

function isCandidateClaim(claim) {
  return !!claim
    && VERIFIED_STATUSES.includes(claim.verification_status)
    && !NON_CANDIDATE_USE_STATUSES.includes(claim.use_status);
}

/* "Citations resolve to real source records with sufficient citation
   metadata" (Step 6, rule 4): a title, a year (or full date_published),
   and at least one external identifier a reader could actually follow. */
function hasSufficientCitationMetadata(source) {
  if (!source) return false;
  const hasTitle = !!source.title;
  const hasYear = !!(source.year || source.date_published);
  const hasIdentifier = !!(source.doi || source.url || source.pmid || source.pmcid);
  return hasTitle && hasYear && hasIdentifier;
}

function yearOf(source) {
  if (Number.isFinite(source.year)) return source.year;
  if (typeof source.date_published === 'string' && /^\d{4}/.test(source.date_published)) {
    return Number(source.date_published.slice(0, 4));
  }
  return null;
}

/**
 * STEP 2/5/6 — pure, deterministic topic readiness assessment.
 *
 * @param {object} input
 * @param {string} input.topic_slug - the publication/SEO concept slug (may
 *   differ from a single research_topics.topic value; see the loader's
 *   PILOT_TOPIC_CONCEPTS for how a concept maps to one or more).
 * @param {string[]} input.controlled_topics - the research_topics.topic
 *   value(s) this concept is built from. Must be non-empty.
 * @param {object[]} input.claims - candidate research_claims rows already
 *   scoped to this concept's topics (any verification_status/use_status;
 *   this function does its own filtering so the caller doesn't have to
 *   duplicate the candidacy rule).
 * @param {object[]} input.sources - research_sources rows for the
 *   source_ids referenced by `claims` (any status).
 * @param {string|Date} [input.as_of] - evaluation date for staleness;
 *   defaults to now.
 * @returns {object} deterministic readiness result (see module header).
 */
export function assessTopicReadiness({ topic_slug, controlled_topics, claims = [], sources = [], as_of } = {}) {
  if (!topic_slug) throw new Error('assessTopicReadiness: topic_slug is required');
  if (!Array.isArray(controlled_topics) || controlled_topics.length === 0) {
    throw new Error('assessTopicReadiness: controlled_topics must be a non-empty array');
  }

  const asOfDate = as_of ? new Date(as_of) : new Date();
  const asOfYear = asOfDate.getUTCFullYear();
  const sourceById = new Map(sources.filter((s) => s && s.source_id).map((s) => [s.source_id, s]));

  const { risk_tier, per_topic_baseline, reasons: riskReasons } = classifyTopicRisk(controlled_topics);

  const candidateClaims = claims.filter(isCandidateClaim);
  const candidateClaimIds = candidateClaims.map((c) => c.claim_id);
  const candidateSourceIds = [...new Set(candidateClaims.map((c) => c.source_id))];
  const candidateSources = candidateSourceIds.map((id) => sourceById.get(id)).filter(Boolean);
  const missingSourceRecordIds = candidateSourceIds.filter((id) => !sourceById.has(id));

  // ── STEP 4: corroboration / evidence-type distribution ──
  const evidence_type_distribution = {};
  for (const s of candidateSources) {
    const et = s.evidence_type || 'unspecified';
    evidence_type_distribution[et] = (evidence_type_distribution[et] || 0) + 1;
  }
  const systematicTierPresent = candidateSources.some((s) => SYSTEMATIC_TIER_EVIDENCE_TYPES.includes(s.evidence_type));
  const professionalConsensusPresent = candidateSources.some(isProfessionalConsensusSource);
  const higherAuthorityPresent = systematicTierPresent || professionalConsensusPresent;

  // ── STEP 5: conflict / exception detection ──
  const findingClaims = candidateClaims.filter((c) => c.claim_type === 'finding');
  const finding_direction_distribution = {};
  for (const c of findingClaims) {
    const d = c.direction || 'unspecified';
    finding_direction_distribution[d] = (finding_direction_distribution[d] || 0) + 1;
  }
  /* Direct opposition on effect direction among verified FINDING claims
     only (recommendation/limitation/etc. naturally carry different
     "directions" that are not a factual disagreement). Per the
     originating request: never call this a contradiction outright --
     label it as requiring human synthesis. */
  const mixedDirectionConflict = (finding_direction_distribution.supports_effect || 0) > 0
    && (finding_direction_distribution.no_effect || 0) > 0;

  const hasSubstantiveFinding = candidateClaims.some((c) => c.claim_type === 'finding' || c.claim_type === 'recommendation');
  const hasLimitationClaim = candidateClaims.some((c) => c.claim_type === 'limitation');
  const safetyConclusionPresent = candidateClaims.some((c) => c.claim_type === 'safety_conclusion');
  const needsReviewFlaggedClaims = candidateClaims.filter((c) => c.use_status === 'needs_review');
  /* CLAIM_VERIFIED+ material that exists for this topic but was
     deliberately withheld from candidacy (excluded/superseded) --
     informational, not blocking: it tells a human editor there is more
     history here than the candidate set alone shows. */
  const excludedOrSupersededMaterial = claims.filter((c) => c
    && VERIFIED_STATUSES.includes(c.verification_status)
    && NON_CANDIDATE_USE_STATUSES.includes(c.use_status));

  const incompleteCitationSources = candidateSources.filter((s) => !hasSufficientCitationMetadata(s));
  const missingCitationMetadata = incompleteCitationSources.length > 0 || missingSourceRecordIds.length > 0;

  /* Staleness: only asserted when the data can actually support it (real
     publication years present). A topic with zero year data anywhere
     simply isn't flagged either way -- that's a citation-metadata gap,
     not a staleness signal. */
  const years = candidateSources.map(yearOf).filter((y) => Number.isFinite(y));
  const newestEvidenceYear = years.length ? Math.max(...years) : null;
  const staleEvidence = newestEvidenceYear !== null && (asOfYear - newestEvidenceYear) > 10;

  const distinctSourceCount = candidateSourceIds.length;

  // ── STEP 6: readiness rule ──
  const evidence_gaps = [];
  if (!hasSubstantiveFinding) evidence_gaps.push('no_verified_substantive_claim');
  if (distinctSourceCount < REQUIRED_DISTINCT_SOURCES) evidence_gaps.push('insufficient_source_corroboration');
  if (risk_tier === RISK_TIER.MODERATE && !higherAuthorityPresent) evidence_gaps.push('missing_higher_tier_evidence_for_moderate_topic');
  if (!hasLimitationClaim) evidence_gaps.push('missing_limitations_context');
  if (missingCitationMetadata) evidence_gaps.push('missing_citation_metadata');

  const conflict_flags = [];
  if (risk_tier === RISK_TIER.HIGH) conflict_flags.push('HIGH_RISK_TOPIC');
  if (safetyConclusionPresent) conflict_flags.push('SAFETY_CONCLUSION_PRESENT');
  if (mixedDirectionConflict) conflict_flags.push('POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS');
  if (distinctSourceCount === 1) conflict_flags.push('SINGLE_SOURCE_ONLY');
  if (needsReviewFlaggedClaims.length > 0) conflict_flags.push('CANDIDATE_CLAIMS_FLAGGED_NEEDS_REVIEW');
  if (excludedOrSupersededMaterial.length > 0) conflict_flags.push('VERIFICATION_STATE_CONTAMINATION_EXCLUDED_MATERIAL_PRESENT');
  if (staleEvidence) conflict_flags.push('STALE_EVIDENCE');

  const forcesReview = risk_tier === RISK_TIER.HIGH
    || safetyConclusionPresent
    || mixedDirectionConflict
    || needsReviewFlaggedClaims.length > 0;

  const reasons = [...riskReasons];
  let readiness_status;
  if (forcesReview) {
    readiness_status = READINESS_STATUS.NEEDS_REVIEW;
    if (risk_tier === RISK_TIER.HIGH) {
      reasons.push('HIGH risk tier: publication requires human editorial review regardless of corroboration strength.');
    }
    if (safetyConclusionPresent) {
      reasons.push('At least one CLAIM_VERIFIED safety_conclusion claim is present; safety framing requires human synthesis before public use.');
    }
    if (mixedDirectionConflict) {
      reasons.push('Verified finding claims disagree on effect direction (supports_effect vs no_effect); flagged for human synthesis, not treated as an automatic contradiction.');
    }
    if (needsReviewFlaggedClaims.length > 0) {
      reasons.push(`${needsReviewFlaggedClaims.length} candidate claim(s) already carry use_status=needs_review.`);
    }
  } else if (evidence_gaps.length > 0) {
    readiness_status = READINESS_STATUS.NOT_READY;
    reasons.push(`Evidence gaps present: ${evidence_gaps.join(', ')}.`);
  } else {
    readiness_status = READINESS_STATUS.READY;
    reasons.push('All deterministic readiness checks passed: verified substantive claims, sufficient independent corroboration, limitations captured, citations resolve, no risk/conflict trip.');
  }

  return {
    topic_slug,
    risk_tier,
    readiness_status,
    reasons,
    metrics: {
      total_claims_considered: claims.length,
      candidate_claim_count: candidateClaims.length,
      distinct_source_count: distinctSourceCount,
      required_distinct_sources: REQUIRED_DISTINCT_SOURCES,
      evidence_type_distribution,
      systematic_tier_evidence_present: systematicTierPresent,
      professional_consensus_present: professionalConsensusPresent,
      finding_direction_distribution,
      has_substantive_finding: hasSubstantiveFinding,
      has_limitation_claim: hasLimitationClaim,
      needs_review_flagged_claim_count: needsReviewFlaggedClaims.length,
      excluded_or_superseded_material_count: excludedOrSupersededMaterial.length,
      newest_evidence_year: newestEvidenceYear,
      per_topic_risk_baseline: per_topic_baseline,
      /* Not derivable from any research schema field in v1 -- see
         docs/research/AIMT-Publication-Editor-v1.md "what this does
         NOT do". Always true today; surfaced so a v2 pass has somewhere
         to attach a real per-topic determination instead of silently
         assuming it. */
      scope_framing_assumed_available: true
    },
    conflict_flags,
    evidence_gaps,
    candidate_claim_ids: candidateClaimIds,
    candidate_source_ids: candidateSourceIds
  };
}
