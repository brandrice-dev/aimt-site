/* ═══════════════════════════════════════════════════════════════
   AIMT Publication Editor v2.1 — bounded synthesis orchestrator
   ---------------------------------------------------------------
   Ties the synthesis client (I/O), the deterministic validator (pure),
   and the reconciliation module (pure) into ONE bounded pipeline:

     initial synthesis
       -> valid?                                   -> done
       -> only CLAIM_MISSING_DISPOSITION violations?
            -> targeted reconciliation (>=1 call, <=1 call)
                 -> shape invalid / call failed     -> SYNTHESIS_FAILED
                 -> all resolutions non-material     -> merge -> re-validate -> done
                 -> any resolution material          -> ONE bounded full retry
                                                            -> re-validate -> done
       -> only HUMAN_REVIEW_MISSING_JUSTIFICATION violation (GOVERNANCE FIX)?
            -> ONE bounded justification retry (fresh full synthesis)
                 -> call failed / invalid schema     -> SYNTHESIS_FAILED
                 -> valid (AUTO_READY or justified HUMAN_REVIEW) -> done
                 -> still unjustified/invalid         -> SYNTHESIS_FAILED
                    (never a permanent, unexplained HUMAN_REVIEW -- see
                    publication-synthesis-reconciliation.mjs's
                    RETRYABLE_INDETERMINATE bucket)
       -> any substantive violation                 -> HUMAN_REVIEW (no repair attempted)
       -> any other (non-repairable-mechanical)      -> SYNTHESIS_FAILED (no repair attempted)

   "done" always means: schema-invalid -> SYNTHESIS_FAILED; valid ->
   AUTO_READY/HUMAN_REVIEW per the model's own declared disposition
   (HIGH risk always forces HUMAN_REVIEW regardless); still-invalid ->
   substantive violations present -> HUMAN_REVIEW, else SYNTHESIS_FAILED.

   NEVER more than one reconciliation call and one full-retry call per
   topic run -- no loops, no re-reconciling a retry's own output. A
   violation that survives the retry (even a bare accounting one) is
   SYNTHESIS_FAILED, never routed back into reconciliation again (see
   STEP 5/12 of the originating request: "repeated accounting failure
   after bounded retry -> SYNTHESIS_FAILED, never infinite retry").

   Every function this module CALLS (synthesizeFn/reconcileFn/retryFn)
   is injectable, defaulting to the real client -- this is what makes
   the whole bounded state machine testable with zero live/model calls
   (tests/research-publication-synthesis-orchestrator.test.mjs).
   ═══════════════════════════════════════════════════════════════ */

import { RISK_TIER } from './publication-readiness.mjs';
import { validateSynthesisOutput } from './publication-synthesis-validator.mjs';
import {
  synthesizeTopic as defaultSynthesizeTopic,
  reconcileMissingClaims as defaultReconcileMissingClaims,
  retrySynthesisWithReconciliation as defaultRetrySynthesisWithReconciliation,
  retrySynthesisForJustification as defaultRetrySynthesisForJustification,
} from './publication-synthesis-client.mjs';
import {
  classifyValidatorViolations,
  validateReconciliationShape,
  determineReconciliationOutcome,
  mergeReconciliationIntoSynthesis,
} from './publication-synthesis-reconciliation.mjs';

function emptyMetrics() {
  return { model_calls: 0, reconciliation_calls: 0, full_retries: 0, total_input_tokens: 0, total_output_tokens: 0, calls: [], model_info: null };
}

function recordCall(metrics, label, callResult) {
  metrics.model_calls += 1;
  const usage = callResult && callResult.ok ? callResult.usage : null;
  metrics.total_input_tokens += (usage && usage.input_tokens) || 0;
  metrics.total_output_tokens += (usage && usage.output_tokens) || 0;
  metrics.calls.push({
    label,
    ok: !!(callResult && callResult.ok),
    reason: callResult && !callResult.ok ? callResult.reason : null,
    input_tokens: usage ? usage.input_tokens : null,
    output_tokens: usage ? usage.output_tokens : null,
  });
  // Tracks the most recent successful call's model info -- whichever call
  // actually produced the final output (initial, reconciliation, or
  // retry) is what a page evidence brief's provenance should cite.
  if (callResult && callResult.ok && callResult.modelInfo) {
    metrics.model_info = callResult.modelInfo;
  }
}

/** The model's own declared disposition, filtered through v1's risk tier
    -- a HIGH-risk topic is never eligible regardless of what the model
    or the validator concluded (this should already be structurally
    impossible for a NEEDS_SYNTHESIS input, but checked directly anyway). */
function successMapping(v1Result, aiOutput) {
  if (v1Result.risk_tier === RISK_TIER.HIGH) return { status: 'HUMAN_REVIEW', reason: 'high_risk_topic' };
  if (!aiOutput || aiOutput.recommended_disposition === 'HUMAN_REVIEW') return { status: 'HUMAN_REVIEW', reason: 'model_declared_human_review' };
  if (aiOutput.recommended_disposition === 'AUTO_READY') return { status: 'AUTO_READY', reason: 'validated' };
  return { status: 'HUMAN_REVIEW', reason: 'unrecognized_disposition' };
}

/** STEP 5/6 -- the ONLY place a validation failure becomes a final
    status. A substantive violation (genuine exception) -> HUMAN_REVIEW.
    Anything else still standing at this point -- a non-repairable
    mechanical defect, or an accounting gap that survived the bounded
    repair policy -- -> SYNTHESIS_FAILED, never HUMAN_REVIEW. This is
    what keeps ordinary model-output defects out of the human queue. */
function mapViolationsToTerminalStatus(violations) {
  const classification = classifyValidatorViolations(violations);
  if (classification.substantive.length > 0) {
    return { status: 'HUMAN_REVIEW', reason: 'substantive_validator_violation', violations, classification };
  }
  return { status: 'SYNTHESIS_FAILED', reason: 'unresolved_mechanical_or_accounting_violation', violations, classification };
}

/**
 * Runs the full bounded v2.1 pipeline for one NEEDS_SYNTHESIS topic.
 *
 * @param {Object} env
 * @param {object} params
 * @param {string} params.topic_slug
 * @param {object} params.v1Result - full assessTopicReadiness() output (must be NEEDS_SYNTHESIS)
 * @param {{claims: object[], sources: object[]}} params.evidenceBundle
 * @param {object} [params.fns] - injectable I/O functions for testing:
 *   { synthesizeFn, reconcileFn, retryFn, justifyRetryFn }, each defaulting
 *   to the real publication-synthesis-client.mjs implementation.
 * @returns {Promise<{
 *   status: 'AUTO_READY'|'HUMAN_REVIEW'|'SYNTHESIS_FAILED',
 *   reason: string,
 *   stage: 'initial'|'reconciliation'|'reconciliation-merge'|'full_retry',
 *   finalOutput: object|null,
 *   violations: string[]|undefined,
 *   reconciliation: object|null,
 *   initial: {output: object, violations: string[]}|null,
 *   metrics: object
 * }>}
 */
export async function runSynthesisPipeline(env, { topic_slug, v1Result, evidenceBundle, fns = {} }) {
  const synthesizeFn = fns.synthesizeFn || defaultSynthesizeTopic;
  const reconcileFn = fns.reconcileFn || defaultReconcileMissingClaims;
  const retryFn = fns.retryFn || defaultRetrySynthesisWithReconciliation;
  const justifyRetryFn = fns.justifyRetryFn || defaultRetrySynthesisForJustification;
  const metrics = emptyMetrics();

  const initial = await synthesizeFn(env, { topic_slug, evidenceBundle });
  recordCall(metrics, 'initial_synthesis', initial);
  if (!initial.ok) {
    return { status: 'SYNTHESIS_FAILED', reason: initial.reason, stage: 'initial', finalOutput: null, reconciliation: null, initial: null, metrics };
  }

  // Kept on every return from here on (STEP 8 reporting requirement:
  // the initial result and its own violations must remain visible even
  // when reconciliation/retry later changes the final outcome).
  const initialValidation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput: initial.output });
  const initialSummary = { output: initial.output, violations: initialValidation.violations || [] };

  if (!initialValidation.schemaValid) {
    return { status: 'SYNTHESIS_FAILED', reason: 'invalid_schema', stage: 'initial', finalOutput: initial.output, violations: initialValidation.violations, reconciliation: null, initial: initialSummary, metrics };
  }
  if (initialValidation.valid) {
    return { ...successMapping(v1Result, initial.output), stage: 'initial', finalOutput: initial.output, reconciliation: null, initial: initialSummary, metrics };
  }

  const classification = classifyValidatorViolations(initialValidation.violations);

  // ── GOVERNANCE FIX: bare, unjustified HUMAN_REVIEW is retryable, not
  // terminal. Checked BEFORE the generic substantive/mechanical fallback
  // below, so this specific violation never falls through to an immediate
  // HUMAN_REVIEW/SYNTHESIS_FAILED mapping without first giving the model
  // one bounded chance to resolve or properly justify it. ──────────────
  if (classification.only_retryable_indeterminate) {
    const justifyResult = await justifyRetryFn(env, { topic_slug, evidenceBundle, previousOutput: initial.output });
    recordCall(metrics, 'human_review_justification_retry', justifyResult);
    metrics.full_retries += 1;
    if (!justifyResult.ok) {
      return { status: 'SYNTHESIS_FAILED', reason: justifyResult.reason, stage: 'human_review_justification_retry', finalOutput: initial.output, reconciliation: null, initial: initialSummary, metrics };
    }
    const justifyValidation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput: justifyResult.output });
    if (!justifyValidation.schemaValid) {
      return { status: 'SYNTHESIS_FAILED', reason: 'invalid_schema', stage: 'human_review_justification_retry', finalOutput: justifyResult.output, violations: justifyValidation.violations, reconciliation: null, initial: initialSummary, metrics };
    }
    if (justifyValidation.valid) {
      return { ...successMapping(v1Result, justifyResult.output), stage: 'human_review_justification_retry', finalOutput: justifyResult.output, reconciliation: null, initial: initialSummary, metrics };
    }
    // No third attempt. A violation surviving this bounded retry --
    // including another HUMAN_REVIEW_MISSING_JUSTIFICATION -- means
    // automation failed to produce a trustworthy proposal twice in a row.
    // That is SYNTHESIS_FAILED, never a permanent, unexplained
    // HUMAN_REVIEW state (per the governance fix's own rationale).
    return { status: 'SYNTHESIS_FAILED', reason: 'human_review_justification_retry_still_invalid', stage: 'human_review_justification_retry', finalOutput: justifyResult.output, violations: justifyValidation.violations, reconciliation: null, initial: initialSummary, metrics };
  }

  if (!classification.only_repairable_accounting) {
    const mapped = mapViolationsToTerminalStatus(initialValidation.violations);
    return { ...mapped, stage: 'initial', finalOutput: initial.output, reconciliation: null, initial: initialSummary, metrics };
  }

  // ── STEP 2: targeted reconciliation (exactly one attempt) ──────────
  const missingClaimIds = classification.repairable_accounting_claim_ids;
  const reconcileResult = await reconcileFn(env, { topic_slug, evidenceBundle, existingOutput: initial.output, missingClaimIds });
  recordCall(metrics, 'reconciliation', reconcileResult);
  metrics.reconciliation_calls += 1;
  if (!reconcileResult.ok) {
    return { status: 'SYNTHESIS_FAILED', reason: reconcileResult.reason, stage: 'reconciliation', finalOutput: initial.output, reconciliation: null, initial: initialSummary, metrics };
  }

  const shape = validateReconciliationShape(reconcileResult.output, missingClaimIds);
  if (!shape.valid) {
    return { status: 'SYNTHESIS_FAILED', reason: 'invalid_reconciliation_output', stage: 'reconciliation', finalOutput: initial.output, violations: shape.errors, reconciliation: reconcileResult.output, initial: initialSummary, metrics };
  }

  const outcome = determineReconciliationOutcome(reconcileResult.output.resolutions);

  if (outcome === 'SAFE_MERGE') {
    const merged = mergeReconciliationIntoSynthesis(initial.output, reconcileResult.output.resolutions);
    const mergedValidation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput: merged });
    if (!mergedValidation.schemaValid) {
      return { status: 'SYNTHESIS_FAILED', reason: 'invalid_schema_after_merge', stage: 'reconciliation-merge', finalOutput: merged, violations: mergedValidation.violations, reconciliation: reconcileResult.output, initial: initialSummary, metrics };
    }
    if (mergedValidation.valid) {
      return { ...successMapping(v1Result, merged), stage: 'reconciliation-merge', finalOutput: merged, reconciliation: reconcileResult.output, initial: initialSummary, metrics };
    }
    const mapped = mapViolationsToTerminalStatus(mergedValidation.violations);
    return { ...mapped, stage: 'reconciliation-merge', finalOutput: merged, reconciliation: reconcileResult.output, initial: initialSummary, metrics };
  }

  // ── STEP 4: bounded full retry (exactly one attempt) ────────────────
  const retryResult = await retryFn(env, {
    topic_slug,
    evidenceBundle,
    previousOutput: initial.output,
    reconciliation: reconcileResult.output,
    formerlyMissingClaimIds: missingClaimIds,
  });
  recordCall(metrics, 'full_retry', retryResult);
  metrics.full_retries += 1;
  if (!retryResult.ok) {
    return { status: 'SYNTHESIS_FAILED', reason: retryResult.reason, stage: 'full_retry', finalOutput: initial.output, reconciliation: reconcileResult.output, initial: initialSummary, metrics };
  }

  const retryValidation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput: retryResult.output });
  if (!retryValidation.schemaValid) {
    return { status: 'SYNTHESIS_FAILED', reason: 'invalid_schema', stage: 'full_retry', finalOutput: retryResult.output, violations: retryValidation.violations, reconciliation: reconcileResult.output, initial: initialSummary, metrics };
  }
  if (retryValidation.valid) {
    return { ...successMapping(v1Result, retryResult.output), stage: 'full_retry', finalOutput: retryResult.output, reconciliation: reconcileResult.output, initial: initialSummary, metrics };
  }
  const mapped = mapViolationsToTerminalStatus(retryValidation.violations);
  return { ...mapped, stage: 'full_retry', finalOutput: retryResult.output, reconciliation: reconcileResult.output, initial: initialSummary, metrics };
}
