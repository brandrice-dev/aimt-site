/* ═══════════════════════════════════════════════════════════════
   AIMT Publication Editor — violation-code sanitizer
   ---------------------------------------------------------------
   PURE. Zero I/O, zero model calls. Publication Editor's deterministic
   validator (publication-synthesis-validator.mjs) and its reconciliation
   shape checker (publication-synthesis-reconciliation.mjs) both emit
   violation strings shaped `CODE` or `CODE:<claim-id>` (occasionally
   `CODE:<claim-id>-><related-claim-id>`) -- e.g.
   `SUPPORTING_CLAIM_NOT_SELECTED:c-047`. The CODE half is a safe,
   generic diagnostic signal (which deterministic rule fired); anything
   after the first colon is private research content (a claim id, a
   source id, an array-index path) that must never reach a public
   surface (a GitHub Issue, a run report an owner might screenshot,
   etc.).

   This module NEVER decides what a run's final_state/classification is
   -- that stays exactly as publication-synthesis-orchestrator.mjs
   already computes it. It only sanitizes an already-final violations
   array for REPORTING, after the fact.
   ═══════════════════════════════════════════════════════════════ */

/**
 * @param {string[]|null|undefined} violations - raw validator/
 *   reconciliation violation strings, each either `CODE` or
 *   `CODE:<private-suffix>`.
 * @returns {string[]} the CODE portion only, deduplicated, in
 *   first-occurrence (stable) order. Never throws; a non-array or
 *   non-string input is simply ignored rather than propagated.
 */
export function sanitizePublicationValidatorViolations(violations) {
  if (!Array.isArray(violations)) return [];
  const seen = new Set();
  const codes = [];
  for (const violation of violations) {
    if (typeof violation !== 'string') continue;
    const code = violation.split(':')[0];
    if (!code || seen.has(code)) continue;
    seen.add(code);
    codes.push(code);
  }
  return codes;
}
