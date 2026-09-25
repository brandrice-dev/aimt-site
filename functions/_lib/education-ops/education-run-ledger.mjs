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
      total_calls: model_calls.length,
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
