/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — deterministic FRAMING-removal repair
   ---------------------------------------------------------------
   PURE. Zero I/O, zero network, zero model calls. Runs ONLY after the
   Education Reviewer has already returned a SUBSTANTIVE_FAIL verdict
   whose ENTIRE cause is removable FRAMING (education-page-plan-schema.
   mjs's own contract: "non-factual editorial orientation that must be
   removable without changing scientific meaning" -- see docs/brand/
   AIMT-EDUCATION-EDITORIAL-VOICE-v0.md). When that -- and ONLY that --
   is true, the safest repair is not another Writer generation or a
   model-authored rewrite: it is deterministic deletion of the optional
   FRAMING units. This module never asks a model which wording to use,
   never infers claim IDs, and never converts a unit from one kind to
   another -- it only removes.

   TRUST BOUNDARY: the Reviewer's own `framing_reviews[].location` is a
   free-form string, never treated here as an authoritative structural
   identifier (the codebase's Publication Editor/reviewer modules never
   trust a model's own pointer into its own output either). Instead,
   EVERY section-level FRAMING unit is removed once eligibility is
   established -- FRAMING is, by the content model's own contract,
   removable anywhere without loss of scientific content, so removing
   all of it is no less safe than removing only the three flagged units,
   and it sidesteps ever having to resolve a free-form location string
   back to a specific unit.

   The caller (scripts/education-operations-cycle.mjs) is responsible
   for re-running validateEducationPagePlan() on the result and for the
   single permitted Reviewer retry -- this module never second-guesses
   either one, it only proposes the removal for both to re-check.
   ═══════════════════════════════════════════════════════════════ */

import { REVIEW_OUTCOME } from './education-reviewer-validator.mjs';

export const FRAMING_REPAIR_INELIGIBLE_REASON = Object.freeze({
  NOT_SUBSTANTIVE_FAIL: 'NOT_SUBSTANTIVE_FAIL',
  HAS_PARAPHRASE_FAILURES: 'HAS_PARAPHRASE_FAILURES',
  NO_FRAMING_FAILURES: 'NO_FRAMING_FAILURES',
  FRAMING_VERDICT_NOT_ALL_CARRIES_SCIENCE: 'FRAMING_VERDICT_NOT_ALL_CARRIES_SCIENCE',
  VOICE_FAIL: 'VOICE_FAIL',
  SCOPE_FAIL: 'SCOPE_FAIL',
  NO_SECTION_FRAMING_UNITS_TO_REMOVE: 'NO_SECTION_FRAMING_UNITS_TO_REMOVE',
});

/**
 * STRICT eligibility check (section 1 of the task spec). Every condition
 * must hold; anything else is NOT REPAIRABLE and must preserve normal
 * EDITORIAL_REVIEW behavior. Deliberately does not look at `plan` at
 * all -- eligibility is a property of the REVIEW RESULT only.
 *
 * @param {{outcome: string, failing_paraphrases: object[], failing_framings: object[], voice_fail: boolean, scope_fail: boolean}} reviewResult
 *   the exact aggregateReviewOutcome() return value.
 * @returns {{eligible: boolean, reason: string|null}}
 */
export function checkFramingRepairEligibility(reviewResult) {
  if (!reviewResult || reviewResult.outcome !== REVIEW_OUTCOME.SUBSTANTIVE_FAIL) {
    return { eligible: false, reason: FRAMING_REPAIR_INELIGIBLE_REASON.NOT_SUBSTANTIVE_FAIL };
  }
  if (!Array.isArray(reviewResult.failing_paraphrases) || reviewResult.failing_paraphrases.length !== 0) {
    return { eligible: false, reason: FRAMING_REPAIR_INELIGIBLE_REASON.HAS_PARAPHRASE_FAILURES };
  }
  if (!Array.isArray(reviewResult.failing_framings) || reviewResult.failing_framings.length === 0) {
    return { eligible: false, reason: FRAMING_REPAIR_INELIGIBLE_REASON.NO_FRAMING_FAILURES };
  }
  if (!reviewResult.failing_framings.every((f) => f && f.verdict === 'CARRIES_SCIENCE')) {
    return { eligible: false, reason: FRAMING_REPAIR_INELIGIBLE_REASON.FRAMING_VERDICT_NOT_ALL_CARRIES_SCIENCE };
  }
  if (reviewResult.voice_fail !== false) {
    return { eligible: false, reason: FRAMING_REPAIR_INELIGIBLE_REASON.VOICE_FAIL };
  }
  if (reviewResult.scope_fail !== false) {
    return { eligible: false, reason: FRAMING_REPAIR_INELIGIBLE_REASON.SCOPE_FAIL };
  }
  return { eligible: true, reason: null };
}

/**
 * Removes EVERY FRAMING-kind unit from every section's `units` array.
 * Never touches answer_summary, limitations, key_takeaways, sources,
 * related_links, or any VERBATIM/PARAPHRASE unit -- those are returned
 * byte-identical (structuredClone preserves reference equality of
 * nothing, but deep-equality of everything untouched). Never converts a
 * unit's `kind`; a unit is either kept exactly as-is or removed entirely.
 *
 * @param {object} plan - a shape-valid Education Page Plan, never mutated.
 * @returns {{repairedPlan: object, removedUnitCount: number}}
 */
export function removeSectionFramingUnits(plan) {
  const repairedPlan = structuredClone(plan);
  let removedUnitCount = 0;
  repairedPlan.sections = repairedPlan.sections.map((section) => {
    const keptUnits = section.units.filter((unit) => unit.kind !== 'FRAMING');
    removedUnitCount += section.units.length - keptUnits.length;
    return { ...section, units: keptUnits };
  });
  return { repairedPlan, removedUnitCount };
}

/**
 * The complete, bounded repair decision: eligibility + removal, composed.
 * Fails closed (eligible: false) whenever the strict eligibility rule
 * does not hold, OR when it holds but there is nothing to safely remove
 * (every FRAMING failure the Reviewer flagged must live somewhere this
 * deterministic removal cannot reach -- e.g. answer_summary/limitations/
 * key_takeaways -- which this repair lane is not permitted to touch; see
 * module header) -- in either case the caller must preserve normal
 * EDITORIAL_REVIEW behavior and never call the Reviewer again for it.
 *
 * @param {object} plan - a shape-valid, previously-Reviewer-failed Page Plan.
 * @param {object} reviewResult - the exact aggregateReviewOutcome() result
 *   the Reviewer verdict this repair is responding to.
 * @returns {{eligible: boolean, repairedPlan: object, removedUnitCount: number, reason: string|null}}
 */
export function repairReviewerFramingFailures(plan, reviewResult) {
  const eligibility = checkFramingRepairEligibility(reviewResult);
  if (!eligibility.eligible) {
    return { eligible: false, repairedPlan: structuredClone(plan), removedUnitCount: 0, reason: eligibility.reason };
  }

  const { repairedPlan, removedUnitCount } = removeSectionFramingUnits(plan);
  if (removedUnitCount === 0) {
    return { eligible: false, repairedPlan: structuredClone(plan), removedUnitCount: 0, reason: FRAMING_REPAIR_INELIGIBLE_REASON.NO_SECTION_FRAMING_UNITS_TO_REMOVE };
  }

  return { eligible: true, repairedPlan, removedUnitCount, reason: null };
}
