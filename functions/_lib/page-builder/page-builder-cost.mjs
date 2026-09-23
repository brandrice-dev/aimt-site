/* ═══════════════════════════════════════════════════════════════
   AIMT Page Builder v1 — cost metrics
   ---------------------------------------------------------------
   PURE. Builds the cost_metrics record every Page Builder run should
   carry, whether or not it made any model call. Never invents a number:
   a field this run has no real data for is null, not estimated, not
   zero-by-assumption where zero would itself be a claim.

   TARGET PRINCIPLE (see docs/research/AIMT-Publication-Editor-Cost-
   Baseline.md): Publication Editor is the expensive evidence-selection
   stage (128 candidate claims into one synthesis call, for hair-cycle).
   Page Builder should be materially cheaper because it receives only
   the already-cleared snapshot and, in v1, makes ZERO model calls at
   all -- the deterministic draft builder and deterministic fidelity
   check together cost nothing beyond ordinary compute. A future
   version's optional AI polish/fidelity pass would add real cost here,
   and this module is where that cost gets recorded once it exists --
   not before.

   CORRECTION (this revision): candidateClaimCount used to be hardcoded
   to 128 at the call site (scripts/page-builder-shadow.mjs) -- correct
   for hair-cycle today, silently wrong for any other topic tomorrow.
   This module now only ever reports whatever candidateClaimCount value
   its caller actually passes in (the caller is responsible for reading
   it from the real persisted record -- see scripts/page-builder-
   shadow.mjs's own comment). A caller with no real value passes `null`,
   and this module reports `null`, never a guess.

   Also distinguishes selectedClaimCount (the size of the cleared
   selected_claim_ids SET, i.e. what was made AVAILABLE to Page Builder)
   from renderedSupportClaimCount (the number of UNIQUE claim IDs that
   actually ended up attached to rendered content --
   page-builder-content-units.mjs#computeRenderedSupportClaimIds()'s
   output length). These can legitimately differ; this module never
   claims "N claims used" using the wrong one of the two.
   ═══════════════════════════════════════════════════════════════ */

export function buildCostMetrics({
  modelCalls = [],
  fidelityCheckCalls = 0,
  retries = 0,
  candidateClaimCount = null,
  selectedClaimCount = null,
  renderedSupportClaimCount = null,
} = {}) {
  const totalInputTokens = modelCalls.reduce((sum, c) => sum + (typeof c.input_tokens === 'number' ? c.input_tokens : 0), 0);
  const totalOutputTokens = modelCalls.reduce((sum, c) => sum + (typeof c.output_tokens === 'number' ? c.output_tokens : 0), 0);
  const anyTokensKnown = modelCalls.some((c) => typeof c.input_tokens === 'number' || typeof c.output_tokens === 'number');

  return {
    model_calls: modelCalls.length,
    calls: modelCalls.map((c) => ({
      label: c.label ?? null,
      model: c.model ?? null,
      input_tokens: typeof c.input_tokens === 'number' ? c.input_tokens : null,
      output_tokens: typeof c.output_tokens === 'number' ? c.output_tokens : null,
    })),
    fidelity_check_calls: fidelityCheckCalls,
    retries,
    total_input_tokens: modelCalls.length === 0 ? 0 : anyTokensKnown ? totalInputTokens : null,
    total_output_tokens: modelCalls.length === 0 ? 0 : anyTokensKnown ? totalOutputTokens : null,
    // Never a computed dollar figure unless a real provider rate table is
    // wired in -- not done in this task, so this stays explicitly null
    // rather than a guessed number dressed up as a metric.
    estimated_cost_usd: null,
    candidate_claim_count: candidateClaimCount,
    selected_claim_count: selectedClaimCount,
    rendered_support_claim_count: renderedSupportClaimCount,
    cost_reduction_note:
      typeof candidateClaimCount === 'number' && typeof selectedClaimCount === 'number' && candidateClaimCount > 0
        ? `Page Builder worked from ${selectedClaimCount} cleared claims, not the ${candidateClaimCount} candidate claims Publication Editor originally considered (${Math.round((1 - selectedClaimCount / candidateClaimCount) * 100)}% fewer).`
        : 'candidate_claim_count not available on the persisted record -- reduction percentage not computed rather than guessed.',
  };
}
