// Cost estimates use standard Sonnet 5 rates verified October 12, 2026:
// https://platform.claude.com/docs/en/models/sonnet-5/overview
// Reservations are conservative estimates, NOT measured provider charges.
export const PUBLICATION_ATTEMPT_BUDGET_USD = 2;
export const PUBLICATION_INPUT_TOKEN_LIMIT = 256000;
export const PUBLICATION_OUTPUT_TOKEN_LIMIT = 64000;
export const PUBLICATION_RATE_USD_PER_MTOK = Object.freeze({ input: 2, output: 10 });

export function estimatedTokenCost(inputTokens, outputTokens) {
  return (inputTokens * 2 + outputTokens * 10) / 1000000;
}

export function createPublicationCostControl({ previous = null, persist = () => {} } = {}) {
  let reserved = 0, measured = 0, requests = 0, unknownUsage = 0;
  const restore = (state) => {
    if (!state) return;
    for (const key of ['reserved_cost_estimate_usd', 'reported_usage_cost_estimate_usd', 'requests', 'requests_with_unknown_usage']) {
      if (!Number.isFinite(state[key]) || state[key] < 0) throw new Error('INVALID_DURABLE_COST_STATE');
    }
    if (!Number.isSafeInteger(state.requests) || !Number.isSafeInteger(state.requests_with_unknown_usage)
      || state.requests_with_unknown_usage > state.requests) throw new Error('INVALID_DURABLE_COST_STATE');
    reserved = Math.max(reserved, state.reserved_cost_estimate_usd);
    measured = Math.max(measured, state.reported_usage_cost_estimate_usd);
    requests = Math.max(requests, state.requests);
    unknownUsage = Math.max(unknownUsage, state.requests_with_unknown_usage);
  };
  restore(previous);
  const control = {
    resume: restore,
    setPersistence(fn) { const previousPersist = persist; persist = (summary) => { previousPersist(summary); fn(summary); }; },
    maxAffordableOutputTokens(body, ceiling) {
      if (requests >= 6) return 0;
      const input = new TextEncoder().encode(JSON.stringify({...body,stream:true})).length + 1024;
      return Math.max(0, Math.min(ceiling, Math.floor((PUBLICATION_ATTEMPT_BUDGET_USD - reserved - estimatedTokenCost(input,0)) * 100000)));
    },
    reserve(body) {
      // UTF-8 byte count plus schema overhead allowance is a conservative
      // local input estimate; no paid token-counting request is made.
      const inputUpperEstimate = new TextEncoder().encode(JSON.stringify(body)).length + 1024;
      if (body.model !== 'claude-sonnet-5' || !Number.isInteger(body.max_tokens)
        || body.max_tokens <= 0 || body.max_tokens > PUBLICATION_OUTPUT_TOKEN_LIMIT
        || inputUpperEstimate > PUBLICATION_INPUT_TOKEN_LIMIT) {
        throw Object.assign(new Error('Publication token limit exceeded.'), { code: 'TOKEN_LIMIT' });
      }
      const estimate = estimatedTokenCost(inputUpperEstimate, body.max_tokens);
      if (requests >= 6 || reserved + estimate > PUBLICATION_ATTEMPT_BUDGET_USD) {
        throw Object.assign(new Error('Publication attempt spend reservation limit exceeded.'), { code: 'SPEND_LIMIT' });
      }
      reserved += estimate;
      requests++;
      unknownUsage++;
      persist(control.summary()); // Durable reservation BEFORE any paid request.
      return estimate;
    },
    recordUsage(usage) {
      if (Number.isSafeInteger(usage?.input_tokens) && Number.isSafeInteger(usage?.output_tokens)
        && usage.input_tokens >= 0 && usage.output_tokens >= 0) {
        measured += estimatedTokenCost(usage.input_tokens, usage.output_tokens);
        unknownUsage = Math.max(0, unknownUsage - 1);
        persist(control.summary());
      }
    },
    summary() { return { budget_usd: PUBLICATION_ATTEMPT_BUDGET_USD,
      reserved_cost_estimate_usd: Number(reserved.toFixed(6)),
      reported_usage_cost_estimate_usd: Number(measured.toFixed(6)),
      requests, requests_with_unknown_usage: unknownUsage,
      input_token_limit: PUBLICATION_INPUT_TOKEN_LIMIT, output_token_limit: PUBLICATION_OUTPUT_TOKEN_LIMIT,
      cost_basis: 'Standard Sonnet 5 token rates; estimate, not provider invoice. Failed-request usage may be unknown.' }; },
  };
  return control;
}
