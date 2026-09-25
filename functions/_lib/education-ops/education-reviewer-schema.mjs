/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — automated fidelity/editorial reviewer
   ---------------------------------------------------------------
   Replaces the OWNER's manual editorial review (the honest gap
   docs/brand/AIMT-EDUCATION-EDITORIAL-VOICE-v0.md names explicitly:
   "there is still no real, deterministic (or model-assisted) entailment
   check standing in for the human editorial review this page
   received") with a governed, independent, model-assisted layer that
   runs ON TOP OF the deterministic education-page-plan-validator.mjs
   checks -- never instead of them. Any failure here means NO
   auto-publish; the page routes to EDITORIAL_REVIEW, exactly like an
   unjustified HUMAN_REVIEW in Publication Editor never gets treated as
   authoritative without a real reason.
   ═══════════════════════════════════════════════════════════════ */

export const REVIEWER_CONTRACT_VERSION = 'education-reviewer-v1';

export const PARAPHRASE_VERDICTS = Object.freeze(['ENTAILED', 'TOO_STRONG', 'OUTSIDE_EVIDENCE', 'CAUSALITY_DRIFT', 'NUMERIC_DRIFT', 'OTHER_FAIL']);
export const FRAMING_VERDICTS = Object.freeze(['NON_FACTUAL', 'CARRIES_SCIENCE']);
export const PASS_FAIL = Object.freeze(['PASS', 'FAIL']);

export const REVIEWER_OUTPUT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    paraphrase_reviews: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          location: { type: 'string' },
          verdict: { type: 'string', enum: [...PARAPHRASE_VERDICTS] },
          reason: { type: 'string' },
        },
        required: ['location', 'verdict', 'reason'],
        additionalProperties: false,
      },
    },
    framing_reviews: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          location: { type: 'string' },
          verdict: { type: 'string', enum: [...FRAMING_VERDICTS] },
          reason: { type: 'string' },
        },
        required: ['location', 'verdict', 'reason'],
        additionalProperties: false,
      },
    },
    voice_verdict: { type: 'string', enum: [...PASS_FAIL] },
    voice_reason: { type: 'string' },
    scope_verdict: { type: 'string', enum: [...PASS_FAIL] },
    scope_reason: { type: 'string' },
  },
  required: ['paraphrase_reviews', 'framing_reviews', 'voice_verdict', 'voice_reason', 'scope_verdict', 'scope_reason'],
  additionalProperties: false,
};

/**
 * @param {{plan: object, clearedSnapshot: object, intentPlan: object}} args
 */
export function buildReviewerInstruction({ plan, clearedSnapshot, intentPlan }) {
  return [
    `You are AIMT's independent Education Page Reviewer. You did not write this page -- your job is to find problems in it, not to defend it. Review EVERY PARAPHRASE and FRAMING unit in the Page Plan below against the cleared evidence snapshot it was supposedly built from.`,
    ``,
    `For every PARAPHRASE unit, compare its text against its OWN cited source_statements (the exact cleared statement text it claims to paraphrase) and determine:`,
    `- ENTAILED: the paraphrase is a faithful, conservative rewrite -- meaning fully preserved, nothing added, nothing strengthened.`,
    `- TOO_STRONG: the paraphrase states something with more certainty/scope than the cleared statement supports.`,
    `- OUTSIDE_EVIDENCE: the paraphrase includes a fact, implication, or detail the cited source_statements do not actually contain.`,
    `- CAUSALITY_DRIFT: the paraphrase turns an association/correlation into a stated causal relationship the cleared statement does not itself claim.`,
    `- NUMERIC_DRIFT: the paraphrase states, implies, or alters any number/percentage/duration -- numeric content must always be VERBATIM, never here.`,
    `- OTHER_FAIL: any other fidelity problem not covered above; explain it specifically.`,
    ``,
    `For every FRAMING unit, determine:`,
    `- NON_FACTUAL: correctly non-factual editorial orientation -- removable from the page without losing any scientific meaning.`,
    `- CARRIES_SCIENCE: the framing unit actually introduces or summarizes a biological fact, mechanism, timing, causal relationship, prevalence, or diagnostic/treatment implication -- it should have been VERBATIM or PARAPHRASE with real claim IDs instead, or removed entirely.`,
    ``,
    `Also assess VOICE (does the page read as AIMT Education voice -- clear before comprehensive, teaches meaning, professional without academic stiffness, no SEO sludge, no journal-abstract tone, no unsupported practitioner implication -- PASS or FAIL) and SCOPE (does the page stay strictly within its page_intent's in_scope_concepts and respect its out_of_scope_concepts, with no diagnosis/treatment drift -- PASS or FAIL).`,
    ``,
    `PAGE INTENT (the approved scope):`,
    JSON.stringify(intentPlan || {}, null, 2),
    ``,
    `THE CLEARED EVIDENCE SNAPSHOT the plan was supposedly built from -- cross-check every unit's source_statements against this REAL cleared text; a source_statement that does not match anything here is itself a failure (OUTSIDE_EVIDENCE):`,
    JSON.stringify(clearedSnapshot, null, 2),
    ``,
    `THE PAGE PLAN TO REVIEW:`,
    JSON.stringify(plan, null, 2),
    ``,
    `Any single TOO_STRONG, OUTSIDE_EVIDENCE, CAUSALITY_DRIFT, NUMERIC_DRIFT, OTHER_FAIL, or CARRIES_SCIENCE verdict, or a voice/scope FAIL, means this page cannot auto-publish. Be strict -- a false PASS here is far more costly than a false FAIL, since a FAIL only routes to human editorial review, never blocks the topic permanently.`,
  ].join('\n');
}
