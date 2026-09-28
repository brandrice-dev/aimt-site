/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — deterministic numeric-fidelity repair
   ---------------------------------------------------------------
   PURE. Zero I/O, zero network, zero model calls. Runs ONLY after
   education-page-plan-validator.mjs has already found a Page Plan
   invalid, and ONLY when every violation is an UNSUPPORTED_NUMERIC_CLAIM
   (education-page-plan-validator.mjs's rule that any digit-bearing
   evidence unit must be VERBATIM and byte-identical to a real cleared
   statement -- that rule is NOT weakened or bypassed here). This module
   never asks a model to rewrite anything; it can only replace a
   Writer-authored numeric PARAPHRASE with the exact cleared statement
   that already, deterministically, supports the same claim IDs -- and
   only when that match is unambiguous. The caller (education-
   operations-cycle.mjs) is responsible for re-running
   validateEducationPagePlan() on the result; this module never
   second-guesses the validator, it only proposes a byte-exact
   substitution for the validator to re-check.
   ═══════════════════════════════════════════════════════════════ */

import { collectAllProseUnits } from './education-page-plan-schema.mjs';

const HAS_DIGIT = /\d/;
const VIOLATION_PREFIX = 'UNSUPPORTED_NUMERIC_CLAIM:';

function claimIdSetsEqual(idsA, idsB) {
  const setA = new Set(idsA || []);
  const setB = new Set(idsB || []);
  if (setA.size !== setB.size) return false;
  for (const id of setA) if (!setB.has(id)) return false;
  return true;
}

/** Authoritative candidate statements: ONLY the cleared snapshot's own
    core_factual_points + limitations -- never the Writer's output. */
function buildCandidatePool(clearedSnapshot) {
  const points = [
    ...(clearedSnapshot.core_factual_points || []),
    ...(clearedSnapshot.limitations || []),
  ];
  return points.filter((p) => HAS_DIGIT.test(p.statement));
}

/**
 * @param {object} plan - a shape-valid but semantically-invalid Education
 *   Page Plan (the exact object education-page-plan-validator.mjs was
 *   given) -- never mutated.
 * @param {object} clearedSnapshot - the same fingerprint_input the
 *   validator was given -- never mutated.
 * @param {string[]} violations - the validator's violations array. Every
 *   entry MUST be an UNSUPPORTED_NUMERIC_CLAIM:<location> violation --
 *   the caller decides eligibility for this repair lane BEFORE calling;
 *   this function refuses to touch anything else.
 * @returns {{
 *   repairedPlan: object,
 *   repairReport: {
 *     attempted: boolean,
 *     repaired_locations: string[],
 *     unresolved_locations: string[],
 *     reason: string|null,
 *     repair_type: string|null,
 *   }
 * }}
 */
export function repairDeterministicPagePlanViolations(plan, clearedSnapshot, violations) {
  const numericLocations = violations
    .filter((v) => v.startsWith(VIOLATION_PREFIX))
    .map((v) => v.slice(VIOLATION_PREFIX.length));

  if (numericLocations.length === 0) {
    return {
      repairedPlan: structuredClone(plan),
      repairReport: { attempted: false, repaired_locations: [], unresolved_locations: [], reason: null, repair_type: null },
    };
  }

  const candidatePool = buildCandidatePool(clearedSnapshot);
  const originalUnitsByLocation = new Map(collectAllProseUnits(plan).map(({ location, unit }) => [location, unit]));

  const repairedPlan = structuredClone(plan);
  const repairedUnitsByLocation = new Map(collectAllProseUnits(repairedPlan).map(({ location, unit }) => [location, unit]));

  const repairedLocations = [];
  const unresolvedLocations = [];
  let reason = null;

  for (const location of numericLocations) {
    const offendingUnit = originalUnitsByLocation.get(location);
    if (!offendingUnit) {
      unresolvedLocations.push(location);
      reason = reason || 'LOCATION_NOT_FOUND';
      continue;
    }

    const exactMatches = candidatePool.filter((c) => claimIdSetsEqual(c.supporting_claim_ids, offendingUnit.supporting_claim_ids));

    let chosen = null;
    if (exactMatches.length === 1) {
      chosen = exactMatches[0];
    } else if (exactMatches.length > 1) {
      // Optional safe disambiguation: the Writer's own source_statements
      // may narrow an ambiguous set ONLY when exactly one already-
      // authoritative candidate (i.e. one that ALSO passed the exact
      // supporting_claim_ids equality rule above) is byte-identical to
      // one of the Writer's source_statements. source_statements can
      // never introduce a candidate that isn't already in the cleared
      // snapshot -- it is used purely to pick among candidates that are
      // already there.
      const disambiguated = exactMatches.filter((c) => (offendingUnit.source_statements || []).includes(c.statement));
      if (disambiguated.length === 1) chosen = disambiguated[0];
    }

    if (chosen) {
      const repairedUnit = repairedUnitsByLocation.get(location);
      repairedUnit.kind = 'VERBATIM';
      repairedUnit.text = chosen.statement;
      repairedUnit.supporting_claim_ids = [...chosen.supporting_claim_ids];
      repairedUnit.source_statements = [chosen.statement];
      repairedLocations.push(location);
    } else {
      unresolvedLocations.push(location);
      reason = reason || (exactMatches.length === 0 ? 'NO_UNIQUE_CLEARED_STATEMENT' : 'AMBIGUOUS_CLEARED_STATEMENT');
    }
  }

  return {
    repairedPlan,
    repairReport: {
      attempted: true,
      repaired_locations: repairedLocations,
      unresolved_locations: unresolvedLocations,
      reason: unresolvedLocations.length > 0 ? reason : null,
      repair_type: repairedLocations.length > 0 ? 'NUMERIC_TO_CLEARED_VERBATIM' : null,
    },
  };
}
