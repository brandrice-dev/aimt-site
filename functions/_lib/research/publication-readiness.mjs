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
       different, topic-level question instead: given claims that have
       already cleared that ladder, does this TOPIC's evidence support
       proceeding toward publication on its own, does it need semantic
       synthesis first, or is it a genuine human-review exception? It
       reads the ladder; it never changes it.
     - Not an AI synthesis layer (yet). Every rule below is an
       explicit, deterministic check against real schema fields (see
       supabase/migrations/20260920_create_research_library.sql /
       functions/_lib/research/schema.mjs for field names). No model
       call, no free-text interpretation of claim_text. This module's
       job is to sort topics into four buckets -- READY / NOT_READY /
       NEEDS_SYNTHESIS / HUMAN_REVIEW -- and, for NEEDS_SYNTHESIS,
       assemble the synthesis packet a v2 AI layer would consume. See
       docs/research/AIMT-Publication-Editor-v1.md for the full target
       architecture (deterministic gate -> AI synthesis -> deterministic
       post-synthesis validator -> auto-clear for LOWER/MODERATE,
       human review only for genuine HIGH/unresolved exceptions).

   GOVERNANCE CORRECTION (kept here, not just in the PR, because it
   shapes every rule below): a safety_conclusion claim or a
   supports_effect/no_effect split inside a LOWER/MODERATE topic is a
   SYNTHESIS signal, not automatically a HUMAN_REVIEW signal. Those
   claims may address different interventions, populations, endpoints,
   or questions than the page in question actually needs -- the
   deterministic engine's job is to surface that material clearly, not
   to assume it always blocks the whole topic. Humans should review
   genuine exceptions (HIGH-risk subject matter, or an unresolved
   conflict/safety concern a synthesis layer explicitly can't clear),
   not every topic that merely contains something that needs
   reconciling.

   Design stance for risk CLASSIFICATION specifically (unchanged from
   v1): when a rule can't confidently place a topic in LOWER or
   MODERATE, it defaults to HIGH. Never guess downward on subject-matter
   sensitivity. What changed in this revision is what a LOWER/MODERATE
   topic's own conflict signals resolve to (NEEDS_SYNTHESIS, not an
   automatic escalation to human review).
   ═══════════════════════════════════════════════════════════════ */

import { CONTROLLED_TOPICS } from './schema.mjs';

export const RISK_TIER = Object.freeze({ LOWER: 'LOWER', MODERATE: 'MODERATE', HIGH: 'HIGH' });

/* READY / NOT_READY / NEEDS_SYNTHESIS / HUMAN_REVIEW.
   ---------------------------------------------------------------
   READY            evidence complete, LOWER/MODERATE risk, no synthesis
                    issue remains -- a page-generation system could
                    consume the candidate evidence directly (once one
                    exists; this PR does not build one).
   NOT_READY        an evidence/citation/limitations/corroboration gap
                    exists. More Harvester work or citation cleanup
                    needed, not a judgment call.
   NEEDS_SYNTHESIS  evidence is sufficiently complete and the topic is
                    LOWER/MODERATE risk, but claim relationships, scope,
                    or safety framing require semantic synthesis before
                    page generation. Intended for the future AI
                    Publication Editor (v2), NOT automatically for a
                    human -- see synthesis_packet on the result.
   HUMAN_REVIEW     genuinely HIGH-risk subject matter, a claim already
                    externally flagged use_status=needs_review, or (once
                    a v2 synthesis layer exists) an unresolved conflict/
                    low-confidence synthesis output. Humans review
                    exceptions here, not the normal publication flow. */
export const READINESS_STATUS = Object.freeze({
  READY: 'READY',
  NOT_READY: 'NOT_READY',
  NEEDS_SYNTHESIS: 'NEEDS_SYNTHESIS',
  HUMAN_REVIEW: 'HUMAN_REVIEW'
});

/* Claims only ever count toward a topic's evidence base once they have
   cleared Rick's ladder at CLAIM_VERIFIED or above (AIMT_APPROVED is
   strictly further along the same ladder, so it counts too). */
const VERIFIED_STATUSES = ['CLAIM_VERIFIED', 'AIMT_APPROVED'];

/* A claim that is CLAIM_VERIFIED but has since been marked excluded or
   superseded (research_claims.use_status) is deliberately withheld from
   candidacy -- Rick verified the wording once, but AIMT's own workflow
   has already said "don't use this one." Provisional claims ARE current,
   in-use material in the live corpus (every real CLAIM_VERIFIED claim in
   the pilot topics carries use_status=provisional -- 'active' does not
   appear anywhere in the 2026-09-20 export) and remain candidates.
   needs_review is handled separately below: it is treated as an
   already-identified exception (HUMAN_REVIEW), not ordinary synthesis
   material, precisely because a prior process already flagged it. */
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
  // assessTopicReadiness() surface individual topics for synthesis, not
  // human review, when a safety_conclusion or direction split actually
  // shows up in their real evidence base -- see the governance
  // correction in the module header).
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
   to HUMAN_REVIEW by risk tier alone regardless of this number (see
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

function citationMetadataOf(source) {
  if (!source) return null;
  return {
    source_id: source.source_id,
    title: source.title ?? null,
    year: source.year ?? null,
    date_published: source.date_published ?? null,
    doi: source.doi ?? null,
    url: source.url ?? null,
    pmid: source.pmid ?? null,
    pmcid: source.pmcid ?? null
  };
}

function yearOf(source) {
  if (Number.isFinite(source.year)) return source.year;
  if (typeof source.date_published === 'string' && /^\d{4}/.test(source.date_published)) {
    return Number(source.date_published.slice(0, 4));
  }
  return null;
}

/** STEP C: per-claim detail for every candidate FINDING claim carrying
    supports_effect or no_effect, so a synthesis layer (or a human, in
    HUMAN_REVIEW packets) can see WHY two claims disagree before assuming
    they actually do -- different interventions, populations, endpoints,
    or questions are all visible here, not collapsed into a bare count. */
function findingDirectionDetail(candidateClaims, sourceById) {
  const relevant = candidateClaims.filter((c) => c.claim_type === 'finding' && (c.direction === 'supports_effect' || c.direction === 'no_effect'));
  return relevant.map((c) => {
    const source = sourceById.get(c.source_id);
    return {
      claim_id: c.claim_id,
      source_id: c.source_id,
      direction: c.direction,
      claim_type: c.claim_type,
      population_or_scope: c.population_or_scope ?? null,
      evidence_type: source ? source.evidence_type ?? null : null
    };
  });
}

/** Deterministic rules a post-synthesis validator (Publication Editor v2,
    not built here) MUST re-check before any LOWER/MODERATE topic can move
    from NEEDS_SYNTHESIS to an auto-clear state. Static/descriptive in v1
    -- there is no synthesized output yet for a validator to check against
    -- but stating them now means v2 has a fixed contract to implement
    against rather than inventing its own notion of "safe enough." */
const POST_SYNTHESIS_VALIDATION_RULES = Object.freeze([
  'Every statement in the synthesized output must map to a claim_id in candidate_claim_ids of this packet.',
  'No claim_id or source_id outside this packet\'s candidate sets may be introduced by synthesis.',
  'Any safety_claim_id must be either explicitly excluded (with a stated reason) or represented with scope-appropriate caution language, never silently dropped without a reason.',
  'A HIGH risk_tier topic must never be auto-cleared by synthesis alone -- it always routes to HUMAN_REVIEW regardless of synthesis confidence.',
  'Every citation referenced in the synthesized output must resolve to a source_id in candidate_source_ids with complete citation metadata.',
  'At least one limitation_claim_id\'s substance must remain represented in the final synthesized output, not dropped for brevity.',
  'A low-confidence synthesis output (as declared by the synthesis layer itself) must route to HUMAN_REVIEW, not auto-clear.'
]);

/** STEP E — machine-readable synthesis packet for a NEEDS_SYNTHESIS
    result. Pure function of already-computed candidate data; contains no
    secrets or config, only claim/source IDs and the schema metadata a
    synthesis layer needs to reason about them. */
function buildSynthesisPacket({ seo_page_concept, topic_slug, controlled_topics, risk_tier, candidateClaims, candidateSources, conflict_flags, evidence_gaps, directionDetail }) {
  const safetyClaims = candidateClaims.filter((c) => c.claim_type === 'safety_conclusion');
  const limitationClaims = candidateClaims.filter((c) => c.claim_type === 'limitation');
  const supportsEffectClaimIds = directionDetail.filter((d) => d.direction === 'supports_effect').map((d) => d.claim_id);
  const noEffectClaimIds = directionDetail.filter((d) => d.direction === 'no_effect').map((d) => d.claim_id);

  const sourceEvidenceType = {};
  for (const s of candidateSources) sourceEvidenceType[s.source_id] = s.evidence_type ?? null;

  const populationOrScopeByClaim = {};
  for (const c of candidateClaims) {
    if (c.population_or_scope) populationOrScopeByClaim[c.claim_id] = c.population_or_scope;
  }

  return {
    seo_page_concept: seo_page_concept ?? topic_slug,
    topic_slug,
    controlled_topics,
    risk_tier,
    candidate_claim_ids: candidateClaims.map((c) => c.claim_id),
    candidate_source_ids: candidateSources.map((s) => s.source_id),
    safety_claim_ids: safetyClaims.map((c) => c.claim_id),
    supports_effect_claim_ids: supportsEffectClaimIds,
    no_effect_claim_ids: noEffectClaimIds,
    limitation_claim_ids: limitationClaims.map((c) => c.claim_id),
    finding_direction_detail: directionDetail,
    source_evidence_type: sourceEvidenceType,
    population_or_scope_by_claim: populationOrScopeByClaim,
    citation_metadata: candidateSources.map(citationMetadataOf),
    synthesis_required_flags: conflict_flags.filter((f) => f === 'SAFETY_CONCLUSION_PRESENT' || f === 'POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS'),
    evidence_gaps,
    post_synthesis_validation_rules: POST_SYNTHESIS_VALIDATION_RULES
  };
}

/**
 * STEP 2/5/6 — pure, deterministic topic readiness assessment.
 *
 * @param {object} input
 * @param {string} input.topic_slug - the publication/SEO concept slug (may
 *   differ from a single research_topics.topic value; see the loader's
 *   PILOT_TOPIC_CONCEPTS for how a concept maps to one or more).
 * @param {string} [input.seo_page_concept] - human-readable page concept
 *   name, carried into the synthesis packet for readability. Falls back
 *   to topic_slug if omitted.
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
export function assessTopicReadiness({ topic_slug, seo_page_concept, controlled_topics, claims = [], sources = [], as_of } = {}) {
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

  /* STEP D — placeholder for page-specific candidate narrowing. v1 does
     NOT implement semantic selection: this is identical to
     candidate_claim_ids today, so a topic-wide candidate set is never
     silently treated as page-specific. A v2 synthesis/selection pass can
     populate this with a genuinely narrower subset (e.g. excluding
     treatment-effect claims from a hair-cycle physiology page that
     happen to share the topic tag) without changing this function's
     contract -- callers should already read from here, not from
     candidate_claim_ids, wherever "what should the page actually use"
     is the question being asked. */
  const synthesisCandidateClaimIds = [...candidateClaimIds];

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
     originating request: never call this a contradiction outright, and
     -- per the governance correction above -- never treat it as an
     automatic human-review trigger either. It is recorded in full detail
     (findingDirectionDetail) so a synthesis layer can determine whether
     the two sides actually address the same intervention/population/
     question at all. */
  const mixedDirectionConflict = (finding_direction_distribution.supports_effect || 0) > 0
    && (finding_direction_distribution.no_effect || 0) > 0;
  const directionDetail = findingDirectionDetail(candidateClaims, sourceById);

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

  /* ── STEP A/B/C: revised state determination ──────────────────────────
     Priority order (highest first):
       1. HIGH risk tier -> HUMAN_REVIEW, unconditionally. A HIGH-risk
          topic is never auto-cleared by synthesis alone, no matter how
          clean its evidence otherwise looks (this includes a HIGH topic
          that also happens to carry a safety_conclusion claim -- it was
          already going to HUMAN_REVIEW on risk tier alone).
       2. A claim already externally flagged use_status=needs_review ->
          HUMAN_REVIEW. This is an already-identified exception from a
          prior process, not ordinary synthesis material -- the whole
          point of "needs_review" as an operational lane state is that
          someone already said "look at this," so v1 does not attempt to
          route it back into automatic synthesis.
       3. Any other evidence gap (citation, corroboration, limitations,
          substantive-claim) -> NOT_READY. Evidence completeness is a
          prerequisite to synthesis, not a synthesis question itself --
          more Harvester/citation work is needed before there's a stable
          set of claims for a synthesis layer (v2) to reconcile.
       4. LOWER/MODERATE risk with a safety_conclusion claim and/or a
          supports_effect/no_effect split among candidate findings ->
          NEEDS_SYNTHESIS. This is the governance correction: these
          signals mean "a semantic pass is needed before this can be
          treated as a single coherent page," not "escalate to a human."
       5. Otherwise -> READY. */
  const isHighRisk = risk_tier === RISK_TIER.HIGH;
  const hasNeedsReviewFlaggedClaim = needsReviewFlaggedClaims.length > 0;
  const hasSynthesisSignal = safetyConclusionPresent || mixedDirectionConflict;

  const reasons = [...riskReasons];
  let readiness_status;
  if (isHighRisk) {
    readiness_status = READINESS_STATUS.HUMAN_REVIEW;
    reasons.push('HIGH risk tier: this topic always routes to human review, regardless of corroboration strength or synthesis outcome.');
    if (safetyConclusionPresent) {
      reasons.push('A CLAIM_VERIFIED safety_conclusion claim is also present, reinforcing (not causing) the HIGH-risk human-review routing.');
    }
  } else if (hasNeedsReviewFlaggedClaim) {
    readiness_status = READINESS_STATUS.HUMAN_REVIEW;
    reasons.push(`${needsReviewFlaggedClaims.length} candidate claim(s) already carry use_status=needs_review -- an already-identified exception, routed directly to human review rather than synthesis.`);
  } else if (evidence_gaps.length > 0) {
    readiness_status = READINESS_STATUS.NOT_READY;
    reasons.push(`Evidence gaps present: ${evidence_gaps.join(', ')}.`);
  } else if (hasSynthesisSignal) {
    readiness_status = READINESS_STATUS.NEEDS_SYNTHESIS;
    if (safetyConclusionPresent) {
      reasons.push('At least one CLAIM_VERIFIED safety_conclusion claim is present; this LOWER/MODERATE topic needs semantic synthesis (exclude, include with scope framing, or escalate) before it can proceed -- not automatic human review.');
    }
    if (mixedDirectionConflict) {
      reasons.push('Verified finding claims disagree on effect direction (supports_effect vs no_effect); flagged for synthesis to determine whether they address different interventions/populations/questions or a genuine unresolved disagreement, not treated as a contradiction or an automatic human-review trigger.');
    }
  } else {
    readiness_status = READINESS_STATUS.READY;
    reasons.push('All deterministic readiness checks passed: verified substantive claims, sufficient independent corroboration, limitations captured, citations resolve, LOWER/MODERATE risk, no synthesis signal or unresolved exception.');
  }

  const synthesis_packet = readiness_status === READINESS_STATUS.NEEDS_SYNTHESIS
    ? buildSynthesisPacket({
      seo_page_concept,
      topic_slug,
      controlled_topics,
      risk_tier,
      candidateClaims,
      candidateSources,
      conflict_flags,
      evidence_gaps,
      directionDetail
    })
    : null;

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
      finding_direction_detail: directionDetail,
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
    candidate_source_ids: candidateSourceIds,
    /* STEP D placeholder -- identical to candidate_claim_ids in v1; see
       comment above where it's computed. */
    synthesis_candidate_claim_ids: synthesisCandidateClaimIds,
    /* STEP E -- only populated for NEEDS_SYNTHESIS results. */
    synthesis_packet
  };
}
