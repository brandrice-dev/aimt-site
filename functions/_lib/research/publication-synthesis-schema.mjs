/* ═══════════════════════════════════════════════════════════════
   AIMT Publication Editor v2 — structured synthesis output contract
   ---------------------------------------------------------------
   STEP 4. The JSON Schema below is sent as `output_config.format` on
   the Anthropic Messages API call (see publication-synthesis-client.mjs),
   the same structured-outputs mechanism functions/_lib/cadence/
   checkpoint-evaluation.mjs already uses -- kept to that file's own
   documented supported subset (basic types, enum/anyOf,
   additionalProperties:false; no minLength/numeric constraints, no
   recursive $ref). This is what makes "no freeform prose outside the
   structured result" a property of the API contract, not just an
   instruction the model might ignore.

   No claim_id/source_id enum is embedded in the schema itself (the
   candidate ID set differs per topic/run) -- the deterministic
   post-synthesis validator (publication-synthesis-validator.mjs) is
   what actually rejects a hallucinated ID, deliberately, because
   Anthropic's structured-outputs subset here does not support a
   dynamic enum built from that run's own evidence bundle. The schema's
   job is shape; the validator's job is grounding.
   ═══════════════════════════════════════════════════════════════ */

export const SYNTHESIS_OUTPUT_CONTRACT_VERSION = 'publication-synthesis-v1';

export const DISPOSITIONS = Object.freeze(['AUTO_READY', 'HUMAN_REVIEW']);
export const CONFIDENCE_LEVELS = Object.freeze(['high', 'medium', 'low']);
export const CLAIM_ROLES = Object.freeze(['core_finding', 'supporting_context', 'limitation']);

// GOVERNANCE FIX (seo/education-page-2-generalization pilot): a live
// telogen-effluvium run surfaced that recommended_disposition:
// 'HUMAN_REVIEW' carried NO required justification at all -- the schema's
// only free-text vehicle, unresolved_issues, is never checked for being
// non-empty when HUMAN_REVIEW is declared, so a model could (and, on one
// run, effectively did) emit a bare HUMAN_REVIEW that no downstream code
// could mechanically distinguish from a genuine substantive exception. A
// bare, unjustified HUMAN_REVIEW must never be treated as an authoritative
// human-review finding -- see publication-synthesis-validator.mjs's
// HUMAN_REVIEW_MISSING_JUSTIFICATION rule and publication-synthesis-
// orchestrator.mjs's bounded retry lane for it.
export const HUMAN_REVIEW_REASON_CODES = Object.freeze([
  'NOT_APPLICABLE', // required value when recommended_disposition is AUTO_READY
  'HIGH_RISK_CONTENT',
  'UNRESOLVED_CONTRADICTION',
  'SAFETY_OR_SCOPE_CONCERN',
  'EVIDENCE_INSUFFICIENCY',
  'OTHER_SUBSTANTIVE_EXCEPTION',
]);

// Reason codes for an excluded claim. Not exhaustive of every possible
// judgment a model could reach, but names the specific out-of-scope
// pattern this pilot exists to test for (hair-cycle's treatment-effect
// claims sharing the topic tag) plus the other mechanically-plausible
// reasons, with OTHER as an explicit escape hatch rather than forcing a
// bad fit.
//
// NON-CORE CONFLICT EXCLUSION (seo/education-page-2-generalization,
// telogen-effluvium vitamin-D review): a HUMAN_REVIEW caused by claims
// that genuinely disagree with each other is not always a page-blocking
// event. When the disagreement is isolated to a SECONDARY/example-level
// detail -- not required to answer the page's core informational
// purpose, its main practitioner distinction, or a safety boundary --
// the principled move is neither to pick the favorable side nor to stop
// for human review over a detail the page doesn't need. It is to exclude
// EVERY claim on both sides of that specific disagreement and let the
// page stand on its unconflicted material. UNRESOLVED_NON_CORE_CONFLICT
// names that disposition explicitly, so it is never confused with an
// ordinary scope/relevance/duplication exclusion, and so a HUMAN_REVIEW
// that exists ONLY because of a conflict already fully excluded this way
// does not need to recur. A conflict that instead touches the page's
// central answer, safety boundary, or main practitioner interpretation
// is NOT eligible for this code -- that stays UNRESOLVED_CONTRADICTION
// under human_review_justification, unchanged.
export const EXCLUSION_REASON_CODES = Object.freeze([
  'OUT_OF_SCOPE_TREATMENT_OR_INTERVENTION',
  'OUT_OF_SCOPE_UNRELATED_CONDITION',
  'DUPLICATE_OR_REDUNDANT',
  'INSUFFICIENT_RELEVANCE_TO_PAGE_INTENT',
  'LOW_EXTRACTION_CONFIDENCE',
  'UNRESOLVED_NON_CORE_CONFLICT',
  'OTHER',
]);

export const SYNTHESIS_OUTPUT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    topic_slug: { type: 'string' },
    page_concept: { type: 'string' },
    recommended_disposition: { type: 'string', enum: [...DISPOSITIONS] },
    confidence: { type: 'string', enum: [...CONFIDENCE_LEVELS] },
    page_scope: {
      type: 'object',
      properties: {
        include: { type: 'array', items: { type: 'string' } },
        exclude: { type: 'array', items: { type: 'string' } },
      },
      required: ['include', 'exclude'],
      additionalProperties: false,
    },
    selected_claims: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          claim_id: { type: 'string' },
          role: { type: 'string', enum: [...CLAIM_ROLES] },
          reason: { type: 'string' },
        },
        required: ['claim_id', 'role', 'reason'],
        additionalProperties: false,
      },
    },
    excluded_claims: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          claim_id: { type: 'string' },
          reason_code: { type: 'string', enum: [...EXCLUSION_REASON_CODES] },
          reason: { type: 'string' },
          // Required on every entry (mirrors human_review_justification's
          // always-present, empty-when-not-applicable pattern). Populated
          // ONLY when reason_code is UNRESOLVED_NON_CORE_CONFLICT, with
          // every OTHER claim_id this one specifically disagrees with --
          // the deterministic validator uses this to require that BOTH
          // (all) sides of a non-core conflict are excluded together,
          // never just the less-favorable one.
          related_conflict_claim_ids: { type: 'array', items: { type: 'string' } },
        },
        required: ['claim_id', 'reason_code', 'reason', 'related_conflict_claim_ids'],
        additionalProperties: false,
      },
    },
    resolved_synthesis_signals: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          signal: { type: 'string' },
          resolution: { type: 'string' },
          claim_ids: { type: 'array', items: { type: 'string' } },
        },
        required: ['signal', 'resolution', 'claim_ids'],
        additionalProperties: false,
      },
    },
    unresolved_issues: { type: 'array', items: { type: 'string' } },
    human_review_justification: {
      type: 'object',
      properties: {
        reason_code: { type: 'string', enum: [...HUMAN_REVIEW_REASON_CODES] },
        reason: { type: 'string' },
        related_claim_ids: { type: 'array', items: { type: 'string' } },
      },
      required: ['reason_code', 'reason', 'related_claim_ids'],
      additionalProperties: false,
    },
    public_framing: {
      type: 'object',
      properties: {
        core_points: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              supporting_claim_ids: { type: 'array', items: { type: 'string' } },
            },
            required: ['statement', 'supporting_claim_ids'],
            additionalProperties: false,
          },
        },
        limitations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              supporting_claim_ids: { type: 'array', items: { type: 'string' } },
            },
            required: ['statement', 'supporting_claim_ids'],
            additionalProperties: false,
          },
        },
        scope_note: { type: 'string' },
      },
      required: ['core_points', 'limitations', 'scope_note'],
      additionalProperties: false,
    },
  },
  required: [
    'topic_slug', 'page_concept', 'recommended_disposition', 'confidence',
    'page_scope', 'selected_claims', 'excluded_claims',
    'resolved_synthesis_signals', 'unresolved_issues',
    'human_review_justification', 'public_framing',
  ],
  additionalProperties: false,
};

/** Builds the synthesis instruction text (STEP 3 + STEP 5). Every rule
    here is enforced again, mechanically, by publication-synthesis-
    validator.mjs -- this prompt is what asks the model to comply, the
    validator is what refuses to trust it blindly. */
export function buildSynthesisInstruction({ pageConcept, publicIntent, inScopeConcepts, outOfScopeConcepts }) {
  return [
    `You are the AIMT Publication Editor, synthesizing verified research evidence into a page-evidence proposal for a SPECIFIC public education page. You do not publish anything -- your output is reviewed by a deterministic validator before it can be used for anything at all.`,
    ``,
    `PAGE CONCEPT: ${pageConcept}`,
    `PUBLIC INTENT: ${publicIntent}`,
    `IN-SCOPE for this page, only if supported by the evidence below: ${inScopeConcepts.join(', ')}.`,
    `OUT OF SCOPE for this page: ${outOfScopeConcepts.join(', ')}. A claim about one of these topics is not a contradiction of the page's subject matter merely because it shares a topic tag -- it is simply not this page's material, and should normally be excluded (reason_code OUT_OF_SCOPE_TREATMENT_OR_INTERVENTION or OUT_OF_SCOPE_UNRELATED_CONDITION) rather than treated as a conflict to resolve. Reach that conclusion from what each claim actually says, never assume it in advance.`,
    ``,
    `You are given a candidate evidence bundle: every CLAIM_VERIFIED-or-better claim (already excluding anything DISCOVERED, excluded, or superseded) tagged with this topic, plus the sources they cite. This is the ONLY evidence you may use. Hard rules, every one of them mechanically checked afterward:`,
    `- Every claim_id you reference anywhere in your output (selected, excluded, in resolved_synthesis_signals, or as a supporting_claim_id) must be one of the claim_id values in the supplied evidence bundle. Never invent or guess an ID.`,
    `- Every claim_id in the evidence bundle must appear in EXACTLY ONE of selected_claims or excluded_claims -- give every claim an explicit disposition, never leave one unaccounted for.`,
    `- Never cite a source_id that is not in the supplied evidence bundle.`,
    `- Never state a fact in public_framing without at least one supporting_claim_id, and that claim_id must be one you selected.`,
    `- Preserve at least one genuine limitation from the evidence in public_framing.limitations -- do not drop limitations for brevity.`,
    `- If a supports_effect/no_effect (or any other) disagreement exists among the claims, identify in resolved_synthesis_signals whether it's a genuine disagreement about the SAME question/population/intervention, or claims that merely look opposed because they address different interventions, populations, endpoints, or questions -- and say which, with the claim_ids involved. Never smooth over a genuine disagreement by omission.`,
    `- Never change what a claim says in a way that strengthens it: never convert "may" or "can" into "does", never convert an association into a stated causal effect, never state a numeric value that is not present in a supplied claim's text, never state a certainty the underlying claim does not itself state.`,
    `- Stay within AIMT's observation/education posture: describe, do not diagnose or prescribe.`,
    `- If you cannot resolve a signal safely from the supplied evidence alone, list it in unresolved_issues and set recommended_disposition to HUMAN_REVIEW -- do not guess to force AUTO_READY.`,
    `- recommended_disposition may only be AUTO_READY when unresolved_issues is empty and you are genuinely confident (confidence: "high" or "medium") the page framing is fully supported and in-scope.`,
    `- You must always include human_review_justification. When recommended_disposition is AUTO_READY, set reason_code to "NOT_APPLICABLE", reason to "Not applicable", and related_claim_ids to an empty array. When recommended_disposition is HUMAN_REVIEW, reason_code must be one of HIGH_RISK_CONTENT, UNRESOLVED_CONTRADICTION, SAFETY_OR_SCOPE_CONCERN, EVIDENCE_INSUFFICIENCY, or OTHER_SUBSTANTIVE_EXCEPTION (never NOT_APPLICABLE), reason must specifically explain what could not be safely resolved and why (not a generic statement), and related_claim_ids must list the specific claim_id(s) that caused the concern, if any exist. A bare HUMAN_REVIEW with a vague or missing reason is not acceptable -- if you cannot articulate a specific reason, reconsider whether the evidence actually supports AUTO_READY instead.`,
    `- NON-CORE CONFLICT EXCLUSION: if two or more claims genuinely disagree about the SAME question/population (not merely different populations, endpoints, or questions that only look opposed), first decide whether that disagreement is CORE or NON-CORE to this specific page. CORE means it would change the page's central answer, a safety boundary, or the main practitioner-relevant interpretation. NON-CORE means it concerns a secondary/example-level detail this page's core informational purpose does not depend on -- the page's central answer stays fully correct and supported even with that detail removed entirely. For a CORE conflict, do not exclude your way around it -- set recommended_disposition to HUMAN_REVIEW with reason_code UNRESOLVED_CONTRADICTION, exactly as described above. For a NON-CORE conflict, exclude EVERY claim on every side of that specific disagreement using reason_code UNRESOLVED_NON_CORE_CONFLICT -- never exclude only the less-favorable side and keep the other, and never pick whichever side seems more supportable. On every one of those exclusions, set related_conflict_claim_ids to the claim_id(s) it specifically disagrees with, and make sure each of those claim_ids is ALSO excluded with reason_code UNRESOLVED_NON_CORE_CONFLICT pointing back -- an asymmetric exclusion (one side excluded, the other still selected or excluded under a different code) is treated as a synthesis defect, not a valid resolution. If excluding a claim this way would also require dropping other, non-conflicted material bundled in the SAME evidentiary statement (e.g. two biomarkers reported together in one finding) because it cannot be cleanly separated from the conflicted part, exclude that combined material too rather than keeping the convenient half. For every OTHER excluded_claims entry (every reason_code besides UNRESOLVED_NON_CORE_CONFLICT), related_conflict_claim_ids must be an empty array.`,
  ].join('\n');
}
