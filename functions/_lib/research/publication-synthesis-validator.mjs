/* ═══════════════════════════════════════════════════════════════
   AIMT Publication Editor v2 — deterministic post-synthesis validator
   ---------------------------------------------------------------
   STEP 6. PURE. Zero I/O, zero model calls. Treats the AI synthesis
   layer's structured output as an untrusted PROPOSAL and mechanically
   checks it against the same evidence bundle the model was given, plus
   the original v1 result/packet. Nothing here can be talked out of a
   violation by the model's own stated confidence or reasoning text --
   every check is a lookup or a set-membership test against real data.

   This is what makes "AI Publication Editor" and "decides what gets
   auto-cleared" two different things: the model proposes, this module
   (and only this module) can certify a proposal as AUTO_READY-eligible.
   ═══════════════════════════════════════════════════════════════ */

import { baselineRiskForTopic, hasSufficientCitationMetadata, RISK_TIER, READINESS_STATUS } from './publication-readiness.mjs';
import { DISPOSITIONS, CONFIDENCE_LEVELS, CLAIM_ROLES, EXCLUSION_REASON_CODES } from './publication-synthesis-schema.mjs';

export const POST_SYNTHESIS_VALIDATOR_VERSION = 'publication-synthesis-validator-v1';

const VERIFIED_STATUSES = ['CLAIM_VERIFIED', 'AIMT_APPROVED'];
const NON_CANDIDATE_USE_STATUSES = ['excluded', 'superseded'];

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}
function isStringArray(v) {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

/**
 * STEP 6, rule 14: shape/type validation, independent of and prior to any
 * semantic (grounding) check below. A response that fails this can never
 * become AUTO_READY or HUMAN_REVIEW from a validated proposal -- it maps
 * to SYNTHESIS_FAILED in determineShadowDisposition() because the model
 * did not produce a usable structured decision at all.
 */
export function validateSchemaShape(aiOutput) {
  const errors = [];
  if (!aiOutput || typeof aiOutput !== 'object' || Array.isArray(aiOutput)) {
    return { valid: false, errors: ['OUTPUT_NOT_AN_OBJECT'] };
  }

  if (!isNonEmptyString(aiOutput.topic_slug)) errors.push('MISSING_OR_INVALID:topic_slug');
  if (!isNonEmptyString(aiOutput.page_concept)) errors.push('MISSING_OR_INVALID:page_concept');
  if (!DISPOSITIONS.includes(aiOutput.recommended_disposition)) errors.push('MISSING_OR_INVALID:recommended_disposition');
  if (!CONFIDENCE_LEVELS.includes(aiOutput.confidence)) errors.push('MISSING_OR_INVALID:confidence');

  const scope = aiOutput.page_scope;
  if (!scope || typeof scope !== 'object' || !isStringArray(scope.include) || !isStringArray(scope.exclude)) {
    errors.push('MISSING_OR_INVALID:page_scope');
  }

  if (!Array.isArray(aiOutput.selected_claims)) {
    errors.push('MISSING_OR_INVALID:selected_claims');
  } else {
    aiOutput.selected_claims.forEach((c, i) => {
      if (!c || !isNonEmptyString(c.claim_id) || !CLAIM_ROLES.includes(c.role) || !isNonEmptyString(c.reason)) {
        errors.push(`MISSING_OR_INVALID:selected_claims[${i}]`);
      }
    });
  }

  if (!Array.isArray(aiOutput.excluded_claims)) {
    errors.push('MISSING_OR_INVALID:excluded_claims');
  } else {
    aiOutput.excluded_claims.forEach((c, i) => {
      if (!c || !isNonEmptyString(c.claim_id) || !EXCLUSION_REASON_CODES.includes(c.reason_code) || !isNonEmptyString(c.reason)) {
        errors.push(`MISSING_OR_INVALID:excluded_claims[${i}]`);
      }
    });
  }

  if (!Array.isArray(aiOutput.resolved_synthesis_signals)) {
    errors.push('MISSING_OR_INVALID:resolved_synthesis_signals');
  } else {
    aiOutput.resolved_synthesis_signals.forEach((s, i) => {
      if (!s || !isNonEmptyString(s.signal) || !isNonEmptyString(s.resolution) || !isStringArray(s.claim_ids)) {
        errors.push(`MISSING_OR_INVALID:resolved_synthesis_signals[${i}]`);
      }
    });
  }

  if (!isStringArray(aiOutput.unresolved_issues)) errors.push('MISSING_OR_INVALID:unresolved_issues');

  const framing = aiOutput.public_framing;
  if (!framing || typeof framing !== 'object') {
    errors.push('MISSING_OR_INVALID:public_framing');
  } else {
    if (!Array.isArray(framing.core_points)) {
      errors.push('MISSING_OR_INVALID:public_framing.core_points');
    } else {
      framing.core_points.forEach((p, i) => {
        if (!p || !isNonEmptyString(p.statement) || !isStringArray(p.supporting_claim_ids)) {
          errors.push(`MISSING_OR_INVALID:public_framing.core_points[${i}]`);
        }
      });
    }
    if (!Array.isArray(framing.limitations)) {
      errors.push('MISSING_OR_INVALID:public_framing.limitations');
    } else {
      framing.limitations.forEach((p, i) => {
        if (!p || !isNonEmptyString(p.statement) || !isStringArray(p.supporting_claim_ids)) {
          errors.push(`MISSING_OR_INVALID:public_framing.limitations[${i}]`);
        }
      });
    }
    if (typeof framing.scope_note !== 'string') errors.push('MISSING_OR_INVALID:public_framing.scope_note');
  }

  return { valid: errors.length === 0, errors };
}

function isCandidateClaimRecord(claim) {
  return !!claim
    && VERIFIED_STATUSES.includes(claim.verification_status)
    && !NON_CANDIDATE_USE_STATUSES.includes(claim.use_status);
}

/**
 * STEP 6 semantic (grounding) rules. Only meaningful once
 * validateSchemaShape() has already passed -- callers should check that
 * first (validateSynthesisOutput() below does this for you).
 *
 * @param {object} params
 * @param {object} params.v1Result - full assessTopicReadiness() output
 * @param {{claims: object[], sources: object[]}} params.evidenceBundle - the
 *   exact bundle sent to the model (publication-synthesis-evidence.mjs)
 * @param {object} params.aiOutput - schema-valid parsed model output
 * @returns {{valid: boolean, violations: string[]}}
 */
export function validateSynthesisSemantics({ v1Result, evidenceBundle, aiOutput }) {
  const violations = [];
  const packet = v1Result && v1Result.synthesis_packet;
  if (!packet) {
    return { valid: false, violations: ['NO_SYNTHESIS_PACKET_ON_V1_RESULT'] };
  }

  // Rule 13: cannot elevate a non-NEEDS_SYNTHESIS v1 result.
  if (v1Result.readiness_status !== READINESS_STATUS.NEEDS_SYNTHESIS) {
    violations.push('V1_RESULT_NOT_NEEDS_SYNTHESIS');
  }
  // Rule 10 (part 1 of "all v1 evidence-completeness requirements still
  // pass"): a topic with any outstanding evidence_gaps should never have
  // reached synthesis in the first place.
  if (Array.isArray(v1Result.evidence_gaps) && v1Result.evidence_gaps.length > 0) {
    violations.push('V1_EVIDENCE_GAPS_PRESENT');
  }
  // Rule 13/12 (defense in depth): HIGH-risk topics never eligible.
  if (v1Result.risk_tier === RISK_TIER.HIGH) {
    violations.push('HIGH_RISK_TOPIC_CANNOT_AUTO_CLEAR');
  }
  // Structural consistency: none of this packet's controlled_topics should
  // themselves resolve to HIGH risk (would mean a HIGH-risk topic's
  // material silently entered a LOWER/MODERATE-labeled packet).
  const controlledTopics = Array.isArray(packet.controlled_topics) ? packet.controlled_topics : [];
  if (controlledTopics.some((t) => baselineRiskForTopic(t) === RISK_TIER.HIGH)) {
    violations.push('HIGH_RISK_TOPIC_IN_PACKET_CONTROLLED_TOPICS');
  }

  const claimById = new Map((evidenceBundle.claims || []).map((c) => [c.claim_id, c]));
  const sourceById = new Map((evidenceBundle.sources || []).map((s) => [s.source_id, s]));
  const allBundleClaimIds = new Set(claimById.keys());

  const selected = Array.isArray(aiOutput.selected_claims) ? aiOutput.selected_claims : [];
  const excluded = Array.isArray(aiOutput.excluded_claims) ? aiOutput.excluded_claims : [];
  const selectedIds = new Set();
  const excludedIds = new Set();

  // Rule 1: every selected claim_id must exist in the evidence bundle.
  for (const sel of selected) {
    if (!allBundleClaimIds.has(sel.claim_id)) {
      violations.push(`SELECTED_CLAIM_NOT_IN_EVIDENCE_BUNDLE:${sel.claim_id}`);
      continue;
    }
    selectedIds.add(sel.claim_id);
  }
  // Rule 2: every excluded claim_id must exist in the evidence bundle.
  for (const exc of excluded) {
    if (!allBundleClaimIds.has(exc.claim_id)) {
      violations.push(`EXCLUDED_CLAIM_NOT_IN_EVIDENCE_BUNDLE:${exc.claim_id}`);
      continue;
    }
    excludedIds.add(exc.claim_id);
  }

  // Rule 4/18: full accounting -- every bundle claim disposed exactly once.
  for (const id of allBundleClaimIds) {
    const inSelected = selectedIds.has(id);
    const inExcluded = excludedIds.has(id);
    if (!inSelected && !inExcluded) violations.push(`CLAIM_MISSING_DISPOSITION:${id}`);
    if (inSelected && inExcluded) violations.push(`CLAIM_DOUBLE_DISPOSITION:${id}`);
  }

  // Rule 3: every selected claim must still meet v1's own candidacy rule
  // (verification_status CLAIM_VERIFIED-or-better, use_status not
  // excluded/superseded), re-checked against the actual bundle record
  // rather than trusted from the model's selection alone.
  for (const id of selectedIds) {
    const record = claimById.get(id);
    if (!isCandidateClaimRecord(record)) violations.push(`SELECTED_CLAIM_FAILS_CANDIDACY:${id}`);
  }

  // Rule 6/5: every core-point/limitation statement needs >=1 supporting
  // claim, every supporting claim_id must exist AND have been selected.
  const framing = aiOutput.public_framing || {};
  const corePoints = Array.isArray(framing.core_points) ? framing.core_points : [];
  const limitations = Array.isArray(framing.limitations) ? framing.limitations : [];

  for (const point of corePoints) {
    if (!Array.isArray(point.supporting_claim_ids) || point.supporting_claim_ids.length === 0) {
      violations.push('CORE_POINT_WITHOUT_SUPPORT');
      continue;
    }
    for (const cid of point.supporting_claim_ids) {
      if (!allBundleClaimIds.has(cid)) violations.push(`SUPPORTING_CLAIM_NOT_IN_EVIDENCE_BUNDLE:${cid}`);
      else if (!selectedIds.has(cid)) violations.push(`SUPPORTING_CLAIM_NOT_SELECTED:${cid}`);
      // Rule 11: an excluded claim must never resurface as public support.
      if (excludedIds.has(cid)) violations.push(`EXCLUDED_CLAIM_REAPPEARS_IN_OUTPUT:${cid}`);
    }
  }
  for (const point of limitations) {
    for (const cid of point.supporting_claim_ids || []) {
      if (!allBundleClaimIds.has(cid)) violations.push(`SUPPORTING_CLAIM_NOT_IN_EVIDENCE_BUNDLE:${cid}`);
      else if (!selectedIds.has(cid)) violations.push(`SUPPORTING_CLAIM_NOT_SELECTED:${cid}`);
      if (excludedIds.has(cid)) violations.push(`EXCLUDED_CLAIM_REAPPEARS_IN_OUTPUT:${cid}`);
    }
  }

  // Rule 7: every cited source (via a selected claim) resolves to a real,
  // citeable record in the evidence bundle.
  for (const id of selectedIds) {
    const claim = claimById.get(id);
    if (!claim) continue;
    const source = sourceById.get(claim.source_id);
    if (!source) {
      violations.push(`CITED_SOURCE_UNRESOLVED:${claim.source_id}`);
    } else if (!hasSufficientCitationMetadata(source)) {
      violations.push(`CITED_SOURCE_INCOMPLETE_METADATA:${claim.source_id}`);
    }
  }

  // Rule 8: at least one genuine limitation preserved -- a limitations
  // entry backed by a claim whose own claim_type is 'limitation'.
  const limitationClaimIdsInBundle = new Set(
    [...claimById.values()].filter((c) => c.claim_type === 'limitation').map((c) => c.claim_id)
  );
  const preservedLimitation = limitations.some((p) =>
    (p.supporting_claim_ids || []).some((cid) => limitationClaimIdsInBundle.has(cid)));
  if (limitationClaimIdsInBundle.size > 0 && (limitations.length === 0 || !preservedLimitation)) {
    violations.push('LIMITATIONS_NOT_PRESERVED');
  }

  // Rule 9: no unresolved issue may remain if the model claims AUTO_READY.
  if (aiOutput.recommended_disposition === DISPOSITIONS[0] /* AUTO_READY */
    && Array.isArray(aiOutput.unresolved_issues) && aiOutput.unresolved_issues.length > 0) {
    violations.push('UNRESOLVED_ISSUES_WITH_AUTO_READY');
  }

  // AUTO_READY needs at least one actual point for a page to be built from.
  if (aiOutput.recommended_disposition === 'AUTO_READY' && corePoints.length === 0) {
    violations.push('AUTO_READY_WITHOUT_CORE_POINTS');
  }

  // Every declared conflict signal from the packet should be addressed
  // (not necessarily "resolved as no conflict" -- just not silently
  // ignored) before a topic can be considered fully synthesized.
  const requiredFlags = Array.isArray(packet.synthesis_required_flags) ? packet.synthesis_required_flags : [];
  if (requiredFlags.length > 0 && (!Array.isArray(aiOutput.resolved_synthesis_signals) || aiOutput.resolved_synthesis_signals.length === 0)) {
    violations.push('SYNTHESIS_SIGNAL_NOT_ADDRESSED');
  }

  // HIGH-risk topics can never be AUTO_READY regardless of anything above.
  if (v1Result.risk_tier === RISK_TIER.HIGH && aiOutput.recommended_disposition === 'AUTO_READY') {
    violations.push('HIGH_RISK_CANNOT_AUTO_READY');
  }

  return { valid: violations.length === 0, violations };
}

/**
 * Full validation: schema shape, then (only if shape passes) semantics.
 * @returns {{valid: boolean, schemaValid: boolean, violations: string[]}}
 */
export function validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput }) {
  const shape = validateSchemaShape(aiOutput);
  if (!shape.valid) {
    return { valid: false, schemaValid: false, violations: shape.errors };
  }
  const semantics = validateSynthesisSemantics({ v1Result, evidenceBundle, aiOutput });
  return { valid: semantics.valid, schemaValid: true, violations: semantics.violations };
}

/**
 * STEP 7 — maps a validated (or failed) synthesis attempt to one of the
 * three SHADOW-ONLY outcomes. None of these are database statuses (see
 * docs/research/AIMT-Publication-Editor-v2.md) -- this function's return
 * value is reporting-only, exactly like v1's readiness_status.
 *
 * @param {object} params
 * @param {object} params.v1Result
 * @param {boolean} params.callFailed - true if the model call itself
 *   failed (missing key, transport error, truncation, unparseable output)
 * @param {string} [params.callFailureReason]
 * @param {object} [params.aiOutput] - present only when callFailed is false
 * @param {{valid:boolean, schemaValid:boolean, violations:string[]}} [params.validation]
 * @returns {{status: 'AUTO_READY'|'HUMAN_REVIEW'|'SYNTHESIS_FAILED', reason: string, violations?: string[]}}
 */
export function determineShadowDisposition({ v1Result, callFailed, callFailureReason, aiOutput, validation }) {
  if (callFailed) {
    return { status: 'SYNTHESIS_FAILED', reason: callFailureReason || 'model_call_failed' };
  }
  if (!validation || !validation.schemaValid) {
    return { status: 'SYNTHESIS_FAILED', reason: 'invalid_schema', violations: (validation && validation.violations) || [] };
  }
  if (!validation.valid) {
    return { status: 'HUMAN_REVIEW', reason: 'validator_rejected_proposal', violations: validation.violations };
  }
  if (v1Result && v1Result.risk_tier === RISK_TIER.HIGH) {
    return { status: 'HUMAN_REVIEW', reason: 'high_risk_topic' };
  }
  if (!aiOutput || aiOutput.recommended_disposition === 'HUMAN_REVIEW') {
    return { status: 'HUMAN_REVIEW', reason: 'model_declared_human_review' };
  }
  if (aiOutput.recommended_disposition === 'AUTO_READY') {
    return { status: 'AUTO_READY', reason: 'validated' };
  }
  return { status: 'HUMAN_REVIEW', reason: 'unrecognized_disposition' };
}
