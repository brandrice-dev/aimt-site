/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — deterministic reviewer-output
   aggregation and retry policy
   ---------------------------------------------------------------
   PURE. Turns the reviewer's per-unit verdicts into ONE pass/fail
   decision, and defines the exact bounded-repair policy: at most ONE
   writer repair pass is permitted, and ONLY when every failure is
   mechanical/editorial (a PARAPHRASE that drifted in wording) rather
   than scientific/substantive (CARRIES_SCIENCE, OUTSIDE_EVIDENCE,
   CAUSALITY_DRIFT, NUMERIC_DRIFT -- these mean the writer reached
   beyond the evidence, which a second attempt at the SAME evidence is
   not guaranteed to fix, and retrying blindly risks exactly the kind
   of "different artifact each time" problem the Phase 4 fix exists to
   prevent). No repeated repair loop is ever permitted -- see
   REPAIRABLE_VERDICTS below for the complete, closed list of what
   qualifies.
   ═══════════════════════════════════════════════════════════════ */

// Only these paraphrase verdicts are considered "mechanical/editorial,
// not substantive" -- eligible for the single bounded repair.
// TOO_STRONG can go either way in principle, but is treated as
// substantive here (conservative default: a "too strong" claim is a
// content problem, not just wording) -- OTHER_FAIL is also treated as
// substantive by default since its cause is, by definition, not one of
// the named specific patterns.
const REPAIRABLE_PARAPHRASE_VERDICTS = new Set([]); // v1: no paraphrase verdict is auto-repairable; see module header
const SUBSTANTIVE_PARAPHRASE_VERDICTS = new Set(['TOO_STRONG', 'OUTSIDE_EVIDENCE', 'CAUSALITY_DRIFT', 'NUMERIC_DRIFT', 'OTHER_FAIL']);

export const REVIEW_OUTCOME = Object.freeze({
  PASS: 'PASS',
  REPAIRABLE_FAIL: 'REPAIRABLE_FAIL',
  SUBSTANTIVE_FAIL: 'SUBSTANTIVE_FAIL',
});

/**
 * @param {object} reviewerOutput - schema-valid REVIEWER_OUTPUT_JSON_SCHEMA
 * @returns {{
 *   outcome: string, failing_paraphrases: object[], failing_framings: object[],
 *   voice_fail: boolean, scope_fail: boolean, summary: string
 * }}
 */
export function aggregateReviewOutcome(reviewerOutput) {
  const failingParaphrases = (reviewerOutput.paraphrase_reviews || []).filter((r) => r.verdict !== 'ENTAILED');
  const failingFramings = (reviewerOutput.framing_reviews || []).filter((r) => r.verdict !== 'NON_FACTUAL');
  const voiceFail = reviewerOutput.voice_verdict !== 'PASS';
  const scopeFail = reviewerOutput.scope_verdict !== 'PASS';

  const anyFailure = failingParaphrases.length > 0 || failingFramings.length > 0 || voiceFail || scopeFail;
  if (!anyFailure) {
    return { outcome: REVIEW_OUTCOME.PASS, failing_paraphrases: [], failing_framings: [], voice_fail: false, scope_fail: false, summary: 'All units ENTAILED/NON_FACTUAL; voice and scope PASS.' };
  }

  // ANY framing CARRIES_SCIENCE, ANY substantive paraphrase verdict, or
  // a voice/scope FAIL makes the whole review substantive -- never
  // repairable. Only a paraphrase set consisting ENTIRELY of verdicts
  // in REPAIRABLE_PARAPHRASE_VERDICTS (currently none, see module
  // header) with zero framing failures and PASS voice/scope could ever
  // be REPAIRABLE_FAIL.
  const hasSubstantiveParaphrase = failingParaphrases.some((r) => SUBSTANTIVE_PARAPHRASE_VERDICTS.has(r.verdict) || !REPAIRABLE_PARAPHRASE_VERDICTS.has(r.verdict));
  const outcome = (failingFramings.length > 0 || hasSubstantiveParaphrase || voiceFail || scopeFail)
    ? REVIEW_OUTCOME.SUBSTANTIVE_FAIL
    : REVIEW_OUTCOME.REPAIRABLE_FAIL;

  return {
    outcome,
    failing_paraphrases: failingParaphrases,
    failing_framings: failingFramings,
    voice_fail: voiceFail,
    scope_fail: scopeFail,
    summary: `${failingParaphrases.length} paraphrase failure(s), ${failingFramings.length} framing failure(s), voice_fail=${voiceFail}, scope_fail=${scopeFail}.`,
  };
}
