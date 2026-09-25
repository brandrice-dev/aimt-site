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
  HUMAN_REVIEW: 'HUMAN_REVIEW',
  EDITORIAL_REVIEW: 'EDITORIAL_REVIEW',
  INFRA_REVIEW: 'INFRA_REVIEW',
  FRESHNESS_FLAGGED: 'FRESHNESS_FLAGGED',
  PUBLISH_FAILED: 'PUBLISH_FAILED',
  PUBLISHED: 'PUBLISHED',
});

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
    final_state,
    exception_reason,
  };
}
