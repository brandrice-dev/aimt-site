# AIMT Publication Editor — cost baseline (for future optimization)

Purpose: a small, durable record of known per-run model-call/token cost,
so a future pass can optimize Publication Editor v2/v2.1 cost before
scaling it across many topics. Only records metrics actually observed in
a saved run artifact — never estimates or invents a number.

## hair-cycle, 2026-09-23 (live production corpus, AUTO_READY)

Source: `research-import/publication-editor-v2-shadow-report-2026-09-23-live.json`
(gitignored local runtime artifact, not itself committed — this note is
the durable record of its cost figures). Mode: live Supabase production
corpus, read-only SELECT only, zero writes. Result: `AUTO_READY`,
stage `reconciliation-merge`, reason `validated`.

| Metric | Value |
|---|---|
| Model | `claude-sonnet-5` (via `ANTHROPIC_PUBLICATION_EDITOR_API_KEY`) |
| Model calls (this run) | 2 |
| — initial synthesis | 1 call — 37,321 input / 36,302 output tokens |
| — reconciliation | 1 call — 4,284 input / 208 output tokens |
| Full retries | 0 |
| Total input tokens | 41,605 |
| Total output tokens | 36,510 |
| Candidate claims considered | 128 |
| Reconciliation missing-claim count | 1 (resolved: `EXCLUDED`, no material change) |

**Observation:** the initial synthesis call's output (36,302 tokens) is by
far the dominant cost driver, not the reconciliation step (208 tokens).
Reconciliation itself is cheap when it only needs to disposition a
handful of missing claims — the real lever for cost at scale is the
initial call's output size, which scales with candidate claim count
(128 claims here) and how much of the evidence bundle gets echoed back
into `public_framing`/`selected_claims`/`excluded_claims`.

No other hair-cycle (or other-topic) AUTO_READY run with saved
`cost_metrics` exists locally as of this note. Add a row here, from
actual saved run data only, the next time a fresh run's `cost_metrics`
are available.

## Page Builder cost architecture

Page Builder v1 (`functions/_lib/page-builder/*`, `scripts/page-builder-
shadow.mjs`) is designed around the opposite cost profile from
Publication Editor, on purpose: **Publication Editor should be the
expensive evidence-selection stage — turning a large, noisy candidate
pool into a small, cleared, page-specific snapshot. Page Builder should
be materially cheaper, because it is never handed the candidate pool at
all** — only the already-cleared snapshot Publication Editor produced.

- Page Builder's evidence input is `research_public_pages.
  publication_clearance.fingerprint_input` — for hair-cycle, 40 selected
  claims and 12 sources, not the 128 candidate claims / 27 candidate
  sources Publication Editor originally considered (a 69% reduction in
  claim volume alone, computed and recorded per-run by
  `page-builder-cost.mjs#buildCostMetrics()`'s `cost_reduction_note`).
- v1's draft generation and factual-fidelity check are both fully
  deterministic (`page-builder-draft.mjs`, `page-builder-fidelity.mjs`
  #checkDraftFidelity) — **zero model calls, zero tokens, zero dollars**
  for the hair-cycle shadow run recorded below. This is not a
  theoretical minimum; it is what the real run actually cost.
- Every cost-relevant field (`model_calls`, `fidelity_check_calls`,
  `retries`, `total_input_tokens`, `total_output_tokens`,
  `estimated_cost_usd`) is recorded by every Page Builder run via
  `buildCostMetrics()`, whether or not any model call was made.
  `estimated_cost_usd` is deliberately left `null` until a real provider
  rate table is wired in — never a guessed dollar figure.
- A future prose-polish or paraphrase pass would call
  `page-builder-fidelity.mjs#checkParagraphFidelityWithModel()` — an
  isolated adapter (`page-builder-model-config.mjs`,
  `ANTHROPIC_PAGE_BUILDER_API_KEY`, never Cadence's or Publication
  Editor's credentials) defaulting to a small model (Claude Haiku 4.5)
  for a short per-paragraph classification task, not a synthesis task.
  That call is implemented and unit-tested against a mock, but is never
  invoked by any code path in the v1 shadow architecture — it exists so
  a future version has somewhere real to record cost, not so this phase
  can claim savings from a call it never makes.

### hair-cycle, 2026-09-23 (Page Builder v1 shadow run)

Source: `research-import/page-builder-shadow/hair-cycle/cost-metrics.json`
(gitignored, not itself committed — this note is the durable record).

| Metric | Value |
|---|---|
| Model calls | 0 |
| Fidelity checks (deterministic) | 9 (one per drafted paragraph) |
| Retries | 0 |
| Total input / output tokens | 0 / 0 |
| Estimated cost | not applicable — zero model calls |
| Candidate claims (Publication Editor's original pool) | 128 |
| Selected claims (what Page Builder actually used) | 40 (69% fewer) |
