# Ask Cadence × Research Library — Stage 1 (shadow) findings

Branch `feature/cadence-research-shadow` · 2026-09-30 · **shadow only**. No research reaches a
student, a model prompt, or a transcript. Live Ask Cadence (`functions/api/cadence/ask.js`,
`functions/_lib/cadence/ask-cadence.mjs`) is byte-identical to `main`.

> **Update 2026-09-30 — quality pass:** see [`QUALITY-PASS-2026-09-30.md`](QUALITY-PASS-2026-09-30.md).
> The live library equals the Sep 20 export, and an answer-usefulness gate plus intent-aware ranking
> were added. Untouched hold-out v3: 96% decisions, **72% hand-judged usefulness** (target 85%),
> 78% coverage. **Still NOT READY.** The sections below describe Stage 1 as first shipped.

## What was built

| Piece | File | Role |
|---|---|---|
| Shared query | `functions/_lib/research/query.mjs` | The one Research Library claim query. `/api/research-query` now delegates to it (behavior pinned by `tests/research-query-endpoint.test.mjs`, written against the pre-refactor endpoint). |
| Cadence retrieval layer | `functions/_lib/cadence/research-context.mjs` | Decision → lexicon query plan → shared query → trust re-check → rank / dedupe / cap → structured context. **Not imported by any live path.** |
| Eval harness | `scripts/cadence-research-shadow-eval.mjs` (+ `scripts/cadence-research-shadow/`) | 64 student questions, JSON and Markdown report. Offline by default against the local export; `--live` = read-only GETs. |
| Tests | `tests/cadence-research-context.test.mjs` | 77 assertions: trust, bounds, fail-safe, checkpoint/Module 12, import boundary. |

## Policies

**Trust.** `CLAIM_VERIFIED` or `AIMT_APPROVED` only. This is a module constant, not a parameter, so
nothing in a question can lower it. The rule is enforced twice: in the query and again locally on
every returned row. Also withheld: `use_status` values `excluded` and `superseded` (Publication
Editor's own non-candidate rule), `needs_review` (the Publication Editor routes these to humans,
and a tutor should be at least as conservative), and `verification_review_status =
reviewed_unsupported`. Quarantined records never reach `research_claims` at all. Every claim keeps
its ladder, review, direction and source metadata. Each context also carries a notice that the
evidence is not AIMT policy, not consensus and not a diagnosis.

**Retrieval method.** Deterministic, with no extra LLM call. A fixed concept lexicon (27 concepts
→ controlled topics plus synonym groups) builds the query. **The student's words never reach the
database**, which is what makes it resistant to prompt injection. Locally, each claim is ranked by:
- **Anchors:** synonym groups the student actually named.
- **Concept bridging:** claims that link two of the question's concepts.
- **Question overlap:** shared words between the question and the claim.

Then:
- **Relevance floor:** a lexicon term must appear in the claim text itself.
- **Near-duplicates** (token Jaccard ≥ 0.6) collapse to one claim.
- **At most 2 claims per source.**
- **Cap:** 5 claims by default, 6 hard maximum.
- **Mixed evidence:** if on-topic evidence in another direction exists and is at least 60% as
  relevant as the top claim, it is swapped in rather than dropped.

**Decision.** Two parts:
- **Eligibility** is hard policy and is checked first. A client-declared checkpoint that the
  server has not verified as `passed` (`unresolved` or `unknown`) turns augmentation off. This
  mirrors `ask.js`'s guardrail condition exactly. Module 12 with an active assessment is off, and
  Module 12 with unverified state is also off (it fails closed). Eligibility is checked before
  any fetch, and `force` cannot bypass it.
- **Usefulness** is heuristic and leans towards "no". Acknowledgments, navigation/admin,
  restatements, course how-tos and bare definitions skip retrieval. So do questions already
  covered by supplied module text (unless they explicitly ask for research) and questions with
  no library concept. Retrieval runs when a library concept appears with a research, mechanism,
  causal or safety cue, or in a substantive question of 8+ words. High-stakes and injection
  signals are *flagged* for later synthesis; the layer never makes a clinical decision.

**Failure.** `retrieveCadenceResearchContext()` never throws. A thrown error, timeout (2.5 s,
aborts the fetch), non-2xx response, non-JSON or malformed body, garbage rows or missing config
all return `error`, `timeout` or `empty` with zero claims. The Stage 2 contract is to treat all of
these as "no research" and answer exactly as today.

## Evaluation (local export 2026-09-20, 992 CLAIM_VERIFIED claims; FTS approximated)

Full per-question output: [`cadence-research-shadow-report-2026-09-30-export.md`](cadence-research-shadow-report-2026-09-30-export.md).

| Set | Cases | Decision matches | Claims returned | Auto-judged on-topic |
|---|---|---|---|---|
| Tuned (rules iterated against these) | 52 | 52/52 | 122 | 118/122 (97%) |
| **Hold-out** (expectations fixed before first run, no tuning after) | 12 | 11/12 | 38 | 38/38 (auto) |

**The auto-judge overstates quality.** It checks regex topicality only. Hand review of the
hold-out set:

| Hold-out case | On-topic | Would help answer *as asked* |
|---|---|---|
| hold-02 tea tree on sensitive skin | 5/5 | 4/5 |
| hold-03 LLLT evidence | 5/5 | 3/5 |
| hold-06 why dandruff recurs | 5/5 | 1/5 (nothing on recurrence) |
| hold-07 traction ↔ hairstyles | 3/3 | 0/3 (treatment only, not causation) |
| hold-08 head spa with psoriasis flare | 5/5 | 0/5 (drug guidelines only) |
| hold-10 iron/ferritin and shedding | ~3/5 | 1/5 (missed the TE-vs-ferritin meta-analysis claim, which exists; the concept-bridging bonus ranked a vitamin D claim above it) |
| hold-11 disinfecting combs | 5/5 | 5/5 |
| hold-12 tender scalp during massage | 0/5 | 0/5 (massage-benefit claims) |
| **Total** | **~31/38 (≈82%)** | **~14/38 (≈37%)** |

Missed decision: hold-01 ("more hair on their pillow … after a high fever") matched no concept,
so nothing was retrieved.

### Strong examples
- deep-03 (rosemary vs minoxidil): all five claims are the rosemary-vs-2%-minoxidil trial and
  reviews of it, including the panel that *did not* recommend rosemary oil. Both sides are kept.
- deep-05 / deep-09 (Malassezia, dandruff microbiome): mechanistic claims such as "dysbiosis
  rather than simple overcolonization" and "M. restricta:M. globosa ratio".
- mixed-02 (PRP): positive meta-analyses plus "not statistically significant vs placebo".
  `mixed_in_selection = true` and direction metadata are intact.
- hold-11 (disinfecting tools): five precaution-grade infection-control rules.
- Prompt injection: the threshold and limit are unchanged, no DISCOVERED claim appears, and the
  injected text never reaches the query.

### Weak or incorrect examples
- **Library coverage gaps:**
  - The export has **zero** claims on trichodynia, scalp dysesthesia or contact dermatitis
    (scalp-01, scalp-02 and none-02 return empty, safely).
  - It has no biotin supplementation claims (risk-04 is empty).
  - Pregnancy questions (risk-02) only surface *drug* contraindications (finasteride,
    dutasteride), not head-spa practice.
- **Topical but not answering:** psoriasis (scalp-07, hold-08) returns treatment guidelines
  rather than practitioner watch-outs. Traction returns minoxidil outcomes.
- **Wrong concept:** "tender/sore scalp during massage" (hold-12) matches only the massage concept
  and returns benefit claims. This is a real miss for a sensitivity question.
- **Adjacent drift:** microneedling + minoxidil (deep-08) fills 3 of 5 slots with other minoxidil
  combinations (LLLT, botulinum).

## Readiness verdict

**Not ready to influence real Cadence answers.** Trust, bounds, fail-safe behavior and the
checkpoint/assessment boundaries are solid and tested. But answer-usefulness on unseen questions is
about 37%, several core scalp-condition topics have no library coverage, and FTS recall has not
been measured against live Postgres.

Recommended before Stage 2:
1. Run the harness with `--live` (read-only) to measure real `websearch_to_tsquery` recall and
   the current library contents.
2. Add library coverage for scalp dysesthesia/trichodynia and contact sensitivity (the Research
   Gap loop is the natural route).
3. Grow the lexicon from real anonymized Ask Cadence questions, and add a relevance gate that
   returns *nothing* instead of topical-but-unhelpful claims.
4. Only then design Stage 2 synthesis framing: evidence ≠ policy, mixed evidence shown, and
   high-stakes questions routed to referral language.
