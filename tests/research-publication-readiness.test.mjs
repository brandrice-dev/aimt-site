// AIMT Publication Editor v1 — deterministic unit tests for the pure
// topic-readiness engine (functions/_lib/research/publication-
// readiness.mjs). SHADOW MODE: this suite uses only synthetic fixtures
// defined inline below -- no production research data, no network calls,
// no database access of any kind.
//
// Covers the revised 4-state model (READY / NOT_READY / NEEDS_SYNTHESIS /
// HUMAN_REVIEW) per the governance correction: a safety_conclusion claim
// or a supports_effect/no_effect split in a LOWER/MODERATE topic routes to
// NEEDS_SYNTHESIS (for the future AI Publication Editor), NOT automatically
// to HUMAN_REVIEW. HUMAN_REVIEW is reserved for HIGH-risk topics and
// claims already externally flagged use_status=needs_review.
//
// Run: node tests/research-publication-readiness.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { assessTopicReadiness, RISK_TIER, READINESS_STATUS } from '../functions/_lib/research/publication-readiness.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

let seq = 0;
function claim(overrides = {}) {
  seq += 1;
  return {
    claim_id: `synthetic-claim-${seq}`,
    source_id: 'synthetic-source-1',
    claim_type: 'finding',
    direction: 'descriptive',
    topics: ['hair-cycle'],
    population_or_scope: null,
    verification_status: 'CLAIM_VERIFIED',
    use_status: 'active',
    ...overrides
  };
}

function source(overrides = {}) {
  return {
    source_id: 'synthetic-source-1',
    title: 'A Synthetic Reference Title',
    year: 2022,
    date_published: null,
    doi: '10.9999/synthetic',
    url: null,
    pmid: null,
    pmcid: null,
    evidence_type: 'narrative_review',
    source_role: 'synthesis',
    verification_status: 'SOURCE_VERIFIED',
    use_status: 'active',
    ...overrides
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Fixture 1 — Lower-risk clean topic, sufficient corroboration -> READY
// ─────────────────────────────────────────────────────────────────────────
(function fixtureLowerCleanReady() {
  const claims = [
    claim({ source_id: 's1', claim_type: 'finding', direction: 'descriptive' }),
    claim({ source_id: 's2', claim_type: 'finding', direction: 'descriptive' }),
    claim({ source_id: 's1', claim_type: 'limitation', direction: null })
  ];
  const sources = [
    source({ source_id: 's1', evidence_type: 'narrative_review' }),
    source({ source_id: 's2', evidence_type: 'observational' })
  ];
  const result = assessTopicReadiness({ topic_slug: 'hair-cycle', controlled_topics: ['hair-cycle'], claims, sources });

  check('LOWER_CLEAN_READY', 'risk_tier is LOWER', result.risk_tier === RISK_TIER.LOWER, result.risk_tier);
  check('LOWER_CLEAN_READY', 'readiness_status is READY', result.readiness_status === READINESS_STATUS.READY, result.readiness_status);
  check('LOWER_CLEAN_READY', 'no conflict flags', result.conflict_flags.length === 0, JSON.stringify(result.conflict_flags));
  check('LOWER_CLEAN_READY', 'no evidence gaps', result.evidence_gaps.length === 0, JSON.stringify(result.evidence_gaps));
  check('LOWER_CLEAN_READY', 'no synthesis packet on a READY result', result.synthesis_packet === null);
})();

// ─────────────────────────────────────────────────────────────────────────
// Fixture 2 — One-source topic -> NOT_READY
// ─────────────────────────────────────────────────────────────────────────
(function fixtureOneSourceNotReady() {
  const claims = [
    claim({ source_id: 's1', claim_type: 'finding', direction: 'descriptive' }),
    claim({ source_id: 's1', claim_type: 'limitation', direction: null })
  ];
  const sources = [source({ source_id: 's1' })];
  const result = assessTopicReadiness({ topic_slug: 'hair-cycle', controlled_topics: ['hair-cycle'], claims, sources });

  check('ONE_SOURCE', 'readiness_status is NOT_READY', result.readiness_status === READINESS_STATUS.NOT_READY, result.readiness_status);
  check('ONE_SOURCE', 'insufficient_source_corroboration gap present', result.evidence_gaps.includes('insufficient_source_corroboration'), JSON.stringify(result.evidence_gaps));
  check('ONE_SOURCE', 'SINGLE_SOURCE_ONLY conflict flag present', result.conflict_flags.includes('SINGLE_SOURCE_ONLY'), JSON.stringify(result.conflict_flags));
})();

// ─────────────────────────────────────────────────────────────────────────
// Fixture 3 — High-risk topic -> HUMAN_REVIEW (even with otherwise-perfect evidence)
// ─────────────────────────────────────────────────────────────────────────
(function fixtureHighRiskHumanReview() {
  const claims = [
    claim({ source_id: 's1', claim_type: 'finding', direction: 'descriptive', topics: ['contraindications'] }),
    claim({ source_id: 's2', claim_type: 'finding', direction: 'descriptive', topics: ['contraindications'] }),
    claim({ source_id: 's1', claim_type: 'limitation', direction: null, topics: ['contraindications'] })
  ];
  const sources = [
    source({ source_id: 's1', evidence_type: 'clinical_guideline' }),
    source({ source_id: 's2', evidence_type: 'systematic_review' })
  ];
  const result = assessTopicReadiness({ topic_slug: 'contraindications', controlled_topics: ['contraindications'], claims, sources });

  check('HIGH_RISK', 'risk_tier is HIGH', result.risk_tier === RISK_TIER.HIGH, result.risk_tier);
  check('HIGH_RISK', 'readiness_status is HUMAN_REVIEW', result.readiness_status === READINESS_STATUS.HUMAN_REVIEW, result.readiness_status);
  check('HIGH_RISK', 'HIGH_RISK_TOPIC conflict flag present', result.conflict_flags.includes('HIGH_RISK_TOPIC'), JSON.stringify(result.conflict_flags));
  check('HIGH_RISK', 'forced review despite zero evidence gaps', result.evidence_gaps.length === 0, JSON.stringify(result.evidence_gaps));
  check('HIGH_RISK', 'no synthesis packet -- HIGH risk skips synthesis entirely', result.synthesis_packet === null);
})();

// ─────────────────────────────────────────────────────────────────────────
// Fixture 4 — Moderate + safety_conclusion -> NEEDS_SYNTHESIS (governance correction)
// ─────────────────────────────────────────────────────────────────────────
(function fixtureModerateSafetyConclusionNeedsSynthesis() {
  const claims = [
    claim({ source_id: 's1', claim_type: 'finding', direction: 'descriptive', topics: ['androgenetic-alopecia'] }),
    claim({ source_id: 's2', claim_type: 'finding', direction: 'descriptive', topics: ['androgenetic-alopecia'] }),
    claim({ source_id: 's1', claim_type: 'limitation', direction: null, topics: ['androgenetic-alopecia'] }),
    claim({ source_id: 's2', claim_type: 'safety_conclusion', direction: 'precaution', topics: ['androgenetic-alopecia'] })
  ];
  const sources = [
    source({ source_id: 's1', evidence_type: 'systematic_review' }),
    source({ source_id: 's2', evidence_type: 'meta_analysis' })
  ];
  const result = assessTopicReadiness({ topic_slug: 'androgenetic-alopecia', controlled_topics: ['androgenetic-alopecia'], claims, sources });

  check('MODERATE_SAFETY_CONCLUSION', 'risk_tier is MODERATE (baseline, not auto-escalated)', result.risk_tier === RISK_TIER.MODERATE, result.risk_tier);
  check('MODERATE_SAFETY_CONCLUSION', 'readiness_status is NEEDS_SYNTHESIS, not HUMAN_REVIEW', result.readiness_status === READINESS_STATUS.NEEDS_SYNTHESIS, result.readiness_status);
  check('MODERATE_SAFETY_CONCLUSION', 'SAFETY_CONCLUSION_PRESENT conflict flag present', result.conflict_flags.includes('SAFETY_CONCLUSION_PRESENT'), JSON.stringify(result.conflict_flags));
  check('MODERATE_SAFETY_CONCLUSION', 'synthesis_packet is populated', !!result.synthesis_packet);
  check('MODERATE_SAFETY_CONCLUSION', 'synthesis_packet.safety_claim_ids includes the safety_conclusion claim', result.synthesis_packet && result.synthesis_packet.safety_claim_ids.includes(claims[3].claim_id), JSON.stringify(result.synthesis_packet && result.synthesis_packet.safety_claim_ids));
})();

// ─────────────────────────────────────────────────────────────────────────
// Fixture 5 — High + safety_conclusion -> HUMAN_REVIEW (risk tier alone already forces it)
// ─────────────────────────────────────────────────────────────────────────
(function fixtureHighSafetyConclusionHumanReview() {
  const claims = [
    claim({ source_id: 's1', claim_type: 'finding', direction: 'descriptive', topics: ['contraindications'] }),
    claim({ source_id: 's2', claim_type: 'finding', direction: 'descriptive', topics: ['contraindications'] }),
    claim({ source_id: 's1', claim_type: 'limitation', direction: null, topics: ['contraindications'] }),
    claim({ source_id: 's2', claim_type: 'safety_conclusion', direction: 'precaution', topics: ['contraindications'] })
  ];
  const sources = [
    source({ source_id: 's1', evidence_type: 'clinical_guideline' }),
    source({ source_id: 's2', evidence_type: 'systematic_review' })
  ];
  const result = assessTopicReadiness({ topic_slug: 'contraindications', controlled_topics: ['contraindications'], claims, sources });

  check('HIGH_SAFETY_CONCLUSION', 'readiness_status is HUMAN_REVIEW', result.readiness_status === READINESS_STATUS.HUMAN_REVIEW, result.readiness_status);
  check('HIGH_SAFETY_CONCLUSION', 'both HIGH_RISK_TOPIC and SAFETY_CONCLUSION_PRESENT flags present', result.conflict_flags.includes('HIGH_RISK_TOPIC') && result.conflict_flags.includes('SAFETY_CONCLUSION_PRESENT'), JSON.stringify(result.conflict_flags));
  check('HIGH_SAFETY_CONCLUSION', 'no synthesis packet -- HIGH risk routes straight to human review', result.synthesis_packet === null);
})();

// ─────────────────────────────────────────────────────────────────────────
// Fixture 6 — Moderate mixed direction -> NEEDS_SYNTHESIS (governance correction)
// ─────────────────────────────────────────────────────────────────────────
(function fixtureModerateMixedDirectionNeedsSynthesis() {
  const claims = [
    claim({ source_id: 's1', claim_type: 'finding', direction: 'supports_effect', topics: ['androgenetic-alopecia'], population_or_scope: 'adult men' }),
    claim({ source_id: 's2', claim_type: 'finding', direction: 'no_effect', topics: ['androgenetic-alopecia'], population_or_scope: 'postmenopausal women' }),
    claim({ source_id: 's1', claim_type: 'limitation', direction: null, topics: ['androgenetic-alopecia'] })
  ];
  const sources = [
    source({ source_id: 's1', evidence_type: 'systematic_review' }),
    source({ source_id: 's2', evidence_type: 'rct' })
  ];
  const result = assessTopicReadiness({ topic_slug: 'androgenetic-alopecia', controlled_topics: ['androgenetic-alopecia'], claims, sources });

  check('MODERATE_MIXED_DIRECTION', 'readiness_status is NEEDS_SYNTHESIS, not HUMAN_REVIEW', result.readiness_status === READINESS_STATUS.NEEDS_SYNTHESIS, result.readiness_status);
  check('MODERATE_MIXED_DIRECTION', 'POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS flag present (not a "contradiction" label)', result.conflict_flags.includes('POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS'), JSON.stringify(result.conflict_flags));
  check('MODERATE_MIXED_DIRECTION', 'no flag literally calls it a contradiction', !result.conflict_flags.some((f) => /CONTRADICTION/.test(f)), JSON.stringify(result.conflict_flags));
  check('MODERATE_MIXED_DIRECTION', 'synthesis_packet finding_direction_detail records population_or_scope for both claims', result.synthesis_packet
    && result.synthesis_packet.finding_direction_detail.some((d) => d.population_or_scope === 'adult men')
    && result.synthesis_packet.finding_direction_detail.some((d) => d.population_or_scope === 'postmenopausal women'));
  check('MODERATE_MIXED_DIRECTION', 'synthesis_packet.supports_effect_claim_ids and no_effect_claim_ids are populated', result.synthesis_packet
    && result.synthesis_packet.supports_effect_claim_ids.includes(claims[0].claim_id)
    && result.synthesis_packet.no_effect_claim_ids.includes(claims[1].claim_id));
})();

// ─────────────────────────────────────────────────────────────────────────
// Fixture 7 — Moderate clean topic + strong (systematic-tier) evidence -> READY
// ─────────────────────────────────────────────────────────────────────────
(function fixtureModerateCleanStrongEvidenceReady() {
  const claims = [
    claim({ source_id: 's1', claim_type: 'finding', direction: 'descriptive', topics: ['telogen-effluvium'] }),
    claim({ source_id: 's2', claim_type: 'finding', direction: 'descriptive', topics: ['telogen-effluvium'] }),
    claim({ source_id: 's1', claim_type: 'limitation', direction: null, topics: ['telogen-effluvium'] })
  ];
  const sources = [
    source({ source_id: 's1', evidence_type: 'systematic_review' }),
    source({ source_id: 's2', evidence_type: 'meta_analysis' })
  ];
  const result = assessTopicReadiness({ topic_slug: 'telogen-effluvium', controlled_topics: ['telogen-effluvium'], claims, sources });

  check('MODERATE_CLEAN_STRONG_READY', 'risk_tier is MODERATE', result.risk_tier === RISK_TIER.MODERATE, result.risk_tier);
  check('MODERATE_CLEAN_STRONG_READY', 'readiness_status is READY', result.readiness_status === READINESS_STATUS.READY, result.readiness_status);
  check('MODERATE_CLEAN_STRONG_READY', 'systematic_tier_evidence_present is true', result.metrics.systematic_tier_evidence_present === true);
  check('MODERATE_CLEAN_STRONG_READY', 'no conflict flags', result.conflict_flags.length === 0, JSON.stringify(result.conflict_flags));
})();

// ─────────────────────────────────────────────────────────────────────────
// Fixture 8 — Moderate topic without higher-tier evidence -> NOT_READY
// ─────────────────────────────────────────────────────────────────────────
(function fixtureModerateNoHigherTierNotReady() {
  const claims = [
    claim({ source_id: 's1', claim_type: 'finding', direction: 'descriptive', topics: ['telogen-effluvium'] }),
    claim({ source_id: 's2', claim_type: 'finding', direction: 'descriptive', topics: ['telogen-effluvium'] }),
    claim({ source_id: 's1', claim_type: 'limitation', direction: null, topics: ['telogen-effluvium'] })
  ];
  const sources = [
    source({ source_id: 's1', evidence_type: 'narrative_review', source_role: 'synthesis' }),
    source({ source_id: 's2', evidence_type: 'observational', source_role: 'primary_research' })
  ];
  const result = assessTopicReadiness({ topic_slug: 'telogen-effluvium', controlled_topics: ['telogen-effluvium'], claims, sources });

  check('MODERATE_NO_HIGHER_TIER', 'risk_tier is MODERATE', result.risk_tier === RISK_TIER.MODERATE, result.risk_tier);
  check('MODERATE_NO_HIGHER_TIER', 'readiness_status is NOT_READY', result.readiness_status === READINESS_STATUS.NOT_READY, result.readiness_status);
  check('MODERATE_NO_HIGHER_TIER', 'missing_higher_tier_evidence_for_moderate_topic gap present', result.evidence_gaps.includes('missing_higher_tier_evidence_for_moderate_topic'), JSON.stringify(result.evidence_gaps));
  check('MODERATE_NO_HIGHER_TIER', 'no conflict flags (this is a gap, not a conflict)', result.conflict_flags.length === 0, JSON.stringify(result.conflict_flags));
})();

// ─────────────────────────────────────────────────────────────────────────
// Fixture 9 — Missing citation metadata -> NOT_READY
// ─────────────────────────────────────────────────────────────────────────
(function fixtureMissingCitationNotReady() {
  const claims = [
    claim({ source_id: 's1', claim_type: 'finding', direction: 'descriptive' }),
    claim({ source_id: 's2', claim_type: 'finding', direction: 'descriptive' }),
    claim({ source_id: 's1', claim_type: 'limitation', direction: null })
  ];
  const sources = [
    source({ source_id: 's1' }),
    // s2 has a title and year but no doi/url/pmid/pmcid -- no identifier a
    // reader could actually follow.
    source({ source_id: 's2', doi: null, url: null, pmid: null, pmcid: null })
  ];
  const result = assessTopicReadiness({ topic_slug: 'hair-cycle', controlled_topics: ['hair-cycle'], claims, sources });

  check('MISSING_CITATION', 'readiness_status is NOT_READY', result.readiness_status === READINESS_STATUS.NOT_READY, result.readiness_status);
  check('MISSING_CITATION', 'missing_citation_metadata gap present', result.evidence_gaps.includes('missing_citation_metadata'), JSON.stringify(result.evidence_gaps));
})();

// ─────────────────────────────────────────────────────────────────────────
// Fixture 10 — Missing limitations/context -> NOT_READY
// ─────────────────────────────────────────────────────────────────────────
(function fixtureMissingLimitationsNotReady() {
  const claims = [
    claim({ source_id: 's1', claim_type: 'finding', direction: 'descriptive' }),
    claim({ source_id: 's2', claim_type: 'finding', direction: 'descriptive' })
    // no claim_type: 'limitation' claim anywhere
  ];
  const sources = [
    source({ source_id: 's1' }),
    source({ source_id: 's2' })
  ];
  const result = assessTopicReadiness({ topic_slug: 'hair-cycle', controlled_topics: ['hair-cycle'], claims, sources });

  check('MISSING_LIMITATIONS', 'readiness_status is NOT_READY', result.readiness_status === READINESS_STATUS.NOT_READY, result.readiness_status);
  check('MISSING_LIMITATIONS', 'missing_limitations_context gap present', result.evidence_gaps.includes('missing_limitations_context'), JSON.stringify(result.evidence_gaps));
})();

// ─────────────────────────────────────────────────────────────────────────
// Fixture 11 — Unknown/unrecognized topic -> HUMAN_REVIEW (defaults HIGH risk)
// ─────────────────────────────────────────────────────────────────────────
(function fixtureUnrecognizedTopicHumanReview() {
  const claims = [claim({ source_id: 's1', topics: ['some-future-topic-not-yet-mapped'] })];
  const sources = [source({ source_id: 's1' })];
  const result = assessTopicReadiness({ topic_slug: 'future-concept', controlled_topics: ['some-future-topic-not-yet-mapped'], claims, sources });
  check('UNRECOGNIZED_TOPIC', 'unrecognized topic defaults to HIGH risk (never guesses downward)', result.risk_tier === RISK_TIER.HIGH, result.risk_tier);
  check('UNRECOGNIZED_TOPIC', 'unrecognized topic routes to HUMAN_REVIEW', result.readiness_status === READINESS_STATUS.HUMAN_REVIEW, result.readiness_status);
})();

// ─────────────────────────────────────────────────────────────────────────
// Fixture 12 — needs_review-flagged claim -> HUMAN_REVIEW even at LOWER risk
// (already-identified exception, not routed into synthesis)
// ─────────────────────────────────────────────────────────────────────────
(function fixtureNeedsReviewFlaggedClaimHumanReview() {
  const claims = [
    claim({ source_id: 's1', claim_type: 'finding', direction: 'descriptive' }),
    claim({ source_id: 's2', claim_type: 'finding', direction: 'descriptive', use_status: 'needs_review' }),
    claim({ source_id: 's1', claim_type: 'limitation', direction: null })
  ];
  const sources = [source({ source_id: 's1' }), source({ source_id: 's2' })];
  const result = assessTopicReadiness({ topic_slug: 'hair-cycle', controlled_topics: ['hair-cycle'], claims, sources });

  check('NEEDS_REVIEW_FLAGGED', 'LOWER risk topic still routes to HUMAN_REVIEW', result.readiness_status === READINESS_STATUS.HUMAN_REVIEW, result.readiness_status);
  check('NEEDS_REVIEW_FLAGGED', 'CANDIDATE_CLAIMS_FLAGGED_NEEDS_REVIEW conflict flag present', result.conflict_flags.includes('CANDIDATE_CLAIMS_FLAGGED_NEEDS_REVIEW'), JSON.stringify(result.conflict_flags));
  check('NEEDS_REVIEW_FLAGGED', 'no synthesis packet -- already-flagged exceptions skip synthesis', result.synthesis_packet === null);
})();

// ─────────────────────────────────────────────────────────────────────────
// Fixture 13 — synthesis packet contains required IDs/metadata (Task E)
// ─────────────────────────────────────────────────────────────────────────
(function fixtureSynthesisPacketShape() {
  const claims = [
    claim({ source_id: 's1', claim_type: 'finding', direction: 'supports_effect', topics: ['alopecia-areata'], population_or_scope: 'patchy scalp AA' }),
    claim({ source_id: 's2', claim_type: 'finding', direction: 'no_effect', topics: ['alopecia-areata'], population_or_scope: 'alopecia totalis' }),
    claim({ source_id: 's1', claim_type: 'limitation', direction: null, topics: ['alopecia-areata'] }),
    claim({ source_id: 's2', claim_type: 'safety_conclusion', direction: 'precaution', topics: ['alopecia-areata'] })
  ];
  const sources = [
    source({ source_id: 's1', evidence_type: 'systematic_review', title: 'AA Systematic Review', year: 2021, doi: '10.1/aa' }),
    source({ source_id: 's2', evidence_type: 'meta_analysis', title: 'AA Meta-Analysis', year: 2023, doi: '10.2/aa' })
  ];
  const result = assessTopicReadiness({
    topic_slug: 'alopecia-areata',
    seo_page_concept: 'Alopecia Areata Overview',
    controlled_topics: ['alopecia-areata'],
    claims,
    sources
  });

  check('SYNTHESIS_PACKET_SHAPE', 'result is NEEDS_SYNTHESIS', result.readiness_status === READINESS_STATUS.NEEDS_SYNTHESIS, result.readiness_status);
  const sp = result.synthesis_packet;
  check('SYNTHESIS_PACKET_SHAPE', 'packet exists', !!sp);
  check('SYNTHESIS_PACKET_SHAPE', 'packet.seo_page_concept carried through', sp && sp.seo_page_concept === 'Alopecia Areata Overview', sp && sp.seo_page_concept);
  check('SYNTHESIS_PACKET_SHAPE', 'packet.controlled_topics present', sp && Array.isArray(sp.controlled_topics) && sp.controlled_topics.includes('alopecia-areata'));
  check('SYNTHESIS_PACKET_SHAPE', 'packet.risk_tier present', sp && sp.risk_tier === RISK_TIER.MODERATE, sp && sp.risk_tier);
  check('SYNTHESIS_PACKET_SHAPE', 'packet.candidate_claim_ids includes all 4 claims', sp && sp.candidate_claim_ids.length === 4, sp && sp.candidate_claim_ids.length);
  check('SYNTHESIS_PACKET_SHAPE', 'packet.candidate_source_ids includes both sources', sp && sp.candidate_source_ids.length === 2, sp && sp.candidate_source_ids.length);
  check('SYNTHESIS_PACKET_SHAPE', 'packet.safety_claim_ids identifies the safety_conclusion claim', sp && sp.safety_claim_ids.length === 1 && sp.safety_claim_ids[0] === claims[3].claim_id);
  check('SYNTHESIS_PACKET_SHAPE', 'packet.supports_effect_claim_ids / no_effect_claim_ids populated', sp && sp.supports_effect_claim_ids.includes(claims[0].claim_id) && sp.no_effect_claim_ids.includes(claims[1].claim_id));
  check('SYNTHESIS_PACKET_SHAPE', 'packet.limitation_claim_ids populated', sp && sp.limitation_claim_ids.includes(claims[2].claim_id));
  check('SYNTHESIS_PACKET_SHAPE', 'packet.source_evidence_type keyed by source_id', sp && sp.source_evidence_type.s1 === 'systematic_review' && sp.source_evidence_type.s2 === 'meta_analysis');
  check('SYNTHESIS_PACKET_SHAPE', 'packet.population_or_scope_by_claim records both populations', sp && sp.population_or_scope_by_claim[claims[0].claim_id] === 'patchy scalp AA' && sp.population_or_scope_by_claim[claims[1].claim_id] === 'alopecia totalis');
  check('SYNTHESIS_PACKET_SHAPE', 'packet.citation_metadata has one entry per candidate source with title/doi', sp && sp.citation_metadata.length === 2 && sp.citation_metadata.every((c) => c.title && c.doi));
  check('SYNTHESIS_PACKET_SHAPE', 'packet.synthesis_required_flags names the exact flags requiring synthesis', sp && sp.synthesis_required_flags.includes('SAFETY_CONCLUSION_PRESENT') && sp.synthesis_required_flags.includes('POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS'));
  check('SYNTHESIS_PACKET_SHAPE', 'packet.post_synthesis_validation_rules is a non-empty list of rule strings', sp && Array.isArray(sp.post_synthesis_validation_rules) && sp.post_synthesis_validation_rules.length > 0 && sp.post_synthesis_validation_rules.every((r) => typeof r === 'string'));
})();

// ─────────────────────────────────────────────────────────────────────────
// Additional coverage: candidacy filtering and shadow-mode purity
// ─────────────────────────────────────────────────────────────────────────
(function fixtureExcludedAndDiscoveredClaimsAreNotCandidates() {
  const claims = [
    claim({ source_id: 's1', claim_type: 'finding', direction: 'descriptive' }),
    claim({ source_id: 's2', claim_type: 'finding', direction: 'descriptive' }),
    claim({ source_id: 's1', claim_type: 'limitation', direction: null }),
    // Should never count as a candidate: below CLAIM_VERIFIED.
    claim({ source_id: 's3', claim_type: 'finding', direction: 'supports_effect', verification_status: 'DISCOVERED' }),
    // Should never count as a candidate: excluded despite being verified.
    claim({ source_id: 's4', claim_type: 'finding', direction: 'no_effect', verification_status: 'CLAIM_VERIFIED', use_status: 'excluded' })
  ];
  const sources = [
    source({ source_id: 's1' }),
    source({ source_id: 's2' }),
    source({ source_id: 's3' }),
    source({ source_id: 's4' })
  ];
  const result = assessTopicReadiness({ topic_slug: 'hair-cycle', controlled_topics: ['hair-cycle'], claims, sources });

  check('CANDIDACY_FILTER', 'DISCOVERED claim excluded from candidate_claim_ids', !result.candidate_claim_ids.includes(claims[3].claim_id));
  check('CANDIDACY_FILTER', 'excluded-use_status claim excluded from candidate_claim_ids', !result.candidate_claim_ids.includes(claims[4].claim_id));
  check('CANDIDACY_FILTER', 'excluded CLAIM_VERIFIED material surfaced as informational flag', result.conflict_flags.includes('VERIFICATION_STATE_CONTAMINATION_EXCLUDED_MATERIAL_PRESENT'), JSON.stringify(result.conflict_flags));
  check('CANDIDACY_FILTER', 'the mixed-direction claims (s3 DISCOVERED, s4 excluded) do NOT trigger POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS', !result.conflict_flags.includes('POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS'), JSON.stringify(result.conflict_flags));
  check('CANDIDACY_FILTER', 'readiness_status is READY (candidate set alone is clean)', result.readiness_status === READINESS_STATUS.READY, result.readiness_status);
})();

(function fixtureEngineIsPureNoIO() {
  // Structural guarantee: the pure engine module never imports fs, node:fs,
  // or fetch -- it must stay a pure function with zero I/O so it can be
  // reused by a scheduled job, a page generator, or Cadence tooling later
  // without inheriting a hidden side effect.
  const src = fileURLToPath(new URL('../functions/_lib/research/publication-readiness.mjs', import.meta.url));
  const text = readFileSync(src, 'utf8');
  check('PURITY', 'engine module never imports node:fs', !/from ['"]node:fs['"]/.test(text));
  check('PURITY', 'engine module never references global fetch', !/\bfetch\(/.test(text));
})();

// ---- Report ----
const byFixture = new Map();
for (const r of results) {
  if (!byFixture.has(r.fixtureName)) byFixture.set(r.fixtureName, []);
  byFixture.get(r.fixtureName).push(r);
}
let anyFail = false;
for (const [fixtureName, checks] of byFixture) {
  const failed = checks.filter((c) => !c.pass);
  if (failed.length > 0) anyFail = true;
  console.log(`[${failed.length === 0 ? 'PASS' : 'FAIL'}] ${fixtureName} (${checks.length - failed.length}/${checks.length})`);
  for (const f of failed) console.log(`    FAILED: ${f.label}${f.detail ? ' — ' + f.detail : ''}`);
}
console.log(`\nTotal: ${results.length}, Passed: ${results.filter((r) => r.pass).length}, Failed: ${results.filter((r) => !r.pass).length}`);
if (anyFail) process.exitCode = 1;
