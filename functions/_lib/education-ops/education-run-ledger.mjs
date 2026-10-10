/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — run ledger
   ---------------------------------------------------------------
   PURE. Builds the structured report every scheduler iteration
   produces, and defines the explicit final-state vocabulary the
   orchestrator must resolve to. A run's report is the durable record
   of what the system decided and why -- written to
   research-import/education-ops/ (gitignored locally; uploaded as a
   CI artifact by the GitHub Actions workflow) regardless of outcome,
   including NO_OP_SUCCESS.
   ═══════════════════════════════════════════════════════════════ */

// MODEL-CALL-CEILING CORRECTION: docs/reports previously called this
// "4 conceptual roles" (intent planner, Publication Editor, writer,
// reviewer) as if that were the hard ceiling on actual API calls. It is
// not -- Publication Editor's own bounded pipeline may itself issue up
// to 3 real model calls (1 initial + <=1 reconciliation + <=1 full
// retry, unchanged, existing behavior). The TRUE maximum actual API
// requests in one run is therefore 1 (intent planner) + 3 (Publication
// Editor, worst case) + 1 (writer) + 1 (reviewer) = 6, never 4. This
// constant is the one true ceiling; buildRunReport() below enforces it
// mechanically rather than merely documenting it.
export const MAX_EDUCATION_OPS_MODEL_CALLS_PER_RUN = 6;

export const RUN_FINAL_STATE = Object.freeze({
  NO_OP_SUCCESS: 'NO_OP_SUCCESS',
  SHADOW_CANDIDATE_READY: 'SHADOW_CANDIDATE_READY',
  CONFIG_BLOCKED: 'CONFIG_BLOCKED',
  PROVIDER_FAILED: 'PROVIDER_FAILED',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  SYNTHESIS_FAILED: 'SYNTHESIS_FAILED',
  HUMAN_REVIEW: 'HUMAN_REVIEW',
  EDITORIAL_REVIEW: 'EDITORIAL_REVIEW',
  INFRA_REVIEW: 'INFRA_REVIEW',
  FRESHNESS_FLAGGED: 'FRESHNESS_FLAGGED',
  PUBLISH_FAILED: 'PUBLISH_FAILED',
  PUBLISHED: 'PUBLISHED',
  // RESEARCH-GAP FEEDBACK LOOP v1: Publication Editor's own validated
  // HUMAN_REVIEW / EVIDENCE_INSUFFICIENCY outcome, routed to the
  // automated Rick research-gap queue instead of the owner's
  // human-review lane (see education-research-gap-queue.mjs). Never
  // creates a GitHub Issue -- deliberately absent from
  // education-exception-reporter.mjs's FINAL_STATE_TO_LABEL map. Only
  // ever produced when AIMT_RESEARCH_GAP_LOOP_ENABLED === "true"; with
  // the loop disabled, EVIDENCE_INSUFFICIENCY still maps to the ordinary
  // HUMAN_REVIEW state above, unchanged.
  RESEARCH_GAP_QUEUED: 'RESEARCH_GAP_QUEUED',
  // PRODUCTION PUBLISH LANE: a publish run reached (or was already at)
  // PR_OPEN -- candidate verified, artifacts generated, PR open/resumed
  // -- and stopped there because AIMT_EDUCATION_AUTOPUBLISH_ENABLED is
  // not exactly "true". This is a NORMAL, expected, routine stop (the
  // whole point of the gate), never a failure -- deliberately absent
  // from education-exception-reporter.mjs's FINAL_STATE_TO_LABEL map so
  // it never creates a GitHub Issue, exactly like NO_OP_SUCCESS/
  // SHADOW_CANDIDATE_READY/PUBLISHED.
  AUTOPUBLISH_GATE_CLOSED: 'AUTOPUBLISH_GATE_CLOSED',
});

// Operational outcome is independent of publication progress: a prepared
// candidate or open PR is partial completion, never a completed publication.
export const OPERATIONAL_OUTCOME = Object.freeze({
  NO_OP: 'NO_OP', COMPLETED: 'COMPLETED', PROVIDER_FAILURE: 'PROVIDER_FAILURE',
  INVALID_RESPONSE: 'INVALID_RESPONSE', CONFIGURATION_FAILURE: 'CONFIGURATION_FAILURE',
  PARTIAL_COMPLETION: 'PARTIAL_COMPLETION', REVIEW_REQUIRED: 'REVIEW_REQUIRED',
});

export function synthesisFailureFinalState(reason) {
  if (reason === 'missing_api_key') return RUN_FINAL_STATE.CONFIG_BLOCKED;
  if (reason === 'request_failed') return RUN_FINAL_STATE.PROVIDER_FAILED;
  if (['truncated', 'unparseable_output', 'unresolved_mechanical_or_accounting_violation',
    'human_review_justification_retry_still_invalid'].includes(reason) || String(reason).startsWith('invalid_')) {
    return RUN_FINAL_STATE.INVALID_RESPONSE;
  }
  // Unknown failures remain failures; they require infrastructure review.
  return RUN_FINAL_STATE.SYNTHESIS_FAILED;
}

export function operationalOutcome(finalState) {
  if (finalState === RUN_FINAL_STATE.NO_OP_SUCCESS) return OPERATIONAL_OUTCOME.NO_OP;
  if (finalState === RUN_FINAL_STATE.PUBLISHED) return OPERATIONAL_OUTCOME.COMPLETED;
  if (finalState === RUN_FINAL_STATE.PROVIDER_FAILED) return OPERATIONAL_OUTCOME.PROVIDER_FAILURE;
  if (finalState === RUN_FINAL_STATE.INVALID_RESPONSE) return OPERATIONAL_OUTCOME.INVALID_RESPONSE;
  if (finalState === RUN_FINAL_STATE.CONFIG_BLOCKED) return OPERATIONAL_OUTCOME.CONFIGURATION_FAILURE;
  if ([RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, RUN_FINAL_STATE.AUTOPUBLISH_GATE_CLOSED,
    RUN_FINAL_STATE.RESEARCH_GAP_QUEUED].includes(finalState)) return OPERATIONAL_OUTCOME.PARTIAL_COMPLETION;
  return OPERATIONAL_OUTCOME.REVIEW_REQUIRED;
}

export function runExitCode(report) {
  return [RUN_FINAL_STATE.PROVIDER_FAILED, RUN_FINAL_STATE.INVALID_RESPONSE,
    RUN_FINAL_STATE.SYNTHESIS_FAILED, RUN_FINAL_STATE.CONFIG_BLOCKED,
    RUN_FINAL_STATE.INFRA_REVIEW, RUN_FINAL_STATE.PUBLISH_FAILED].includes(report.final_state) ? 1 : 0;
}

/**
 * @param {object} fields - see FINAL REPORT fields in the originating
 *   task; every field is optional except run_id/mode/final_state, so a
 *   ledger can be built incrementally as a run progresses and
 *   finalized once at the end.
 *
 *   published_topics/pages_published_this_week/weekly_ceiling/
 *   credential_available/stopped_before_model_stage were added by the
 *   runtime-wiring correction round: a run must record the LIVE
 *   published-topic set and weekly count it actually resolved (never a
 *   hardcoded constant), whether the Education Ops model credential was
 *   available, and whether execution stopped before reaching any step
 *   that needs a model call -- so a missing credential never erases the
 *   read-only work (published state, weekly cap, freshness, candidate
 *   selection) a run already did.
 * @returns {object} a plain, JSON-serializable run report
 */
export function buildRunReport(fields) {
  const {
    run_id, started_at, finished_at, mode,
    candidate_topics = [], selected_topic = null, selection_reason = null,
    seo_signal_type = 'SEARCH_OPPORTUNITY_HEURISTIC',
    readiness_result = null, risk_tier = null,
    published_topics = [], pages_published_this_week = null, weekly_ceiling = null,
    publication_editor_result = null, writer_result = null, review_result = null,
    freshness_scan_summary = null,
    credential_available = null, stopped_before_model_stage = false,
    model_calls = [], planned_route = null,
    diff_allowlist_result = null, publication_action = null,
    candidate_resume = null,
    research_gap_action = null,
    final_state, exception_reason = null,
  } = fields;

  if (!run_id || !mode || !final_state) {
    throw new Error('buildRunReport: run_id, mode, and final_state are required.');
  }
  if (!Object.values(RUN_FINAL_STATE).includes(final_state)) {
    throw new Error(`buildRunReport: unrecognized final_state "${final_state}".`);
  }

  const totalInputTokens = model_calls.reduce((sum, c) => sum + (c.input_tokens || 0), 0);
  const totalOutputTokens = model_calls.reduce((sum, c) => sum + (c.output_tokens || 0), 0);
  // actual_call_count on a Publication Editor entry may legitimately be
  // up to 3 (its own internal bounded retry count); every other role's
  // entry defaults to 1 if not given explicitly.
  const actualModelCallCount = model_calls.reduce((sum, c) => sum + (typeof c.actual_call_count === 'number' ? c.actual_call_count : 1), 0);
  if (actualModelCallCount > MAX_EDUCATION_OPS_MODEL_CALLS_PER_RUN) {
    throw new Error(
      `buildRunReport: actual_model_call_count (${actualModelCallCount}) exceeds the hard ceiling of ${MAX_EDUCATION_OPS_MODEL_CALLS_PER_RUN} -- this should be structurally impossible under the normal pipeline (1 intent planner + <=3 Publication Editor + 1 writer + 1 reviewer = 6 max); refusing to report a run that violates its own model-call budget rather than silently accepting it.`
    );
  }

  return {
    run_id,
    started_at,
    finished_at: finished_at || null,
    mode,
    candidate_topics,
    selected_topic,
    selection_reason,
    seo_signal_type,
    readiness_result,
    risk_tier,
    published_topics,
    pages_published_this_week,
    weekly_ceiling,
    publication_editor_result,
    writer_result,
    review_result,
    freshness_scan_summary,
    credential_available,
    stopped_before_model_stage,
    model_calls: {
      calls: model_calls,
      // Distinct roles invoked this run (max 4: intent planner,
      // Publication Editor, writer, reviewer) -- NOT the actual API
      // call count; see actual_model_call_count for that.
      total_roles_invoked: model_calls.length,
      // The TRUE actual-API-call count (max 6, see
      // MAX_EDUCATION_OPS_MODEL_CALLS_PER_RUN above).
      actual_model_call_count: actualModelCallCount,
      // Kept as an alias of actual_model_call_count for backward
      // compatibility with earlier reports/tests that read total_calls
      // -- prefer actual_model_call_count in new code.
      total_calls: actualModelCallCount,
      total_input_tokens: totalInputTokens,
      total_output_tokens: totalOutputTokens,
    },
    planned_route,
    diff_allowlist_result,
    publication_action,
    candidate_resume,
    research_gap_action,
    final_state,
    operational_outcome: operationalOutcome(final_state),
    exception_reason,
  };
}
