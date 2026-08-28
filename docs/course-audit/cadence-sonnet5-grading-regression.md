# Cadence Sonnet 5 — Grading Regression

**Status:** Harness + dataset built and run. **Live model regression BLOCKED — not yet executed.**
**Model tested:** `claude-sonnet-5` (registry status: `CANDIDATE`, `cadence-model-registry-v2`) for the `CADENCE_GRADING_MODEL` role.
**Registry status:** neither `CADENCE_CHAT_MODEL` nor `CADENCE_GRADING_MODEL` has an `APPROVED` model (see `functions/_lib/cadence/model-config.mjs`). This regression exists to gather the evidence a future promotion decision would need — it does not itself promote anything.
**Date:** 2026-08-27.
**Test-set version:** `scripts/cadence-model-regression/grading-dataset.mjs`, 72 cases, dataset version implicit in file content (no separate version stamp yet — first run).
**Harness:** `node scripts/run-cadence-model-regression.mjs --role=grading [--live] [--repeat=N]`

---

## 1. What was actually run

Two distinct things happened in this task, and they answer different questions — conflating them would misrepresent the result:

1. **Dataset + deterministic-decision-layer validation (done, passing).** For all 72 cases, the harness resolved the real checkpoint rubric/question text directly out of `headspa-mastery.html` (via `scripts/cadence-model-regression/load-checkpoint-rubrics.mjs`, a comment-aware extractor — never a hand-copied duplicate of the rubric text), and confirmed the actual, unmodified `decideCheckpointOutcome()` (`functions/_lib/cadence/checkpoint-evaluation.mjs`) reaches each case's human-authored expected outcome when given evidence shaped the way a correctly-behaving model call should shape it. This is a real regression test of **the dataset and the AIMT decision function**, not of Sonnet 5.
2. **Live Sonnet 5 grading regression — BLOCKED, not run.** `ANTHROPIC_API_KEY` is not present in this environment/session. The harness's `--live` path (which calls `evaluateCheckpointServerSide()`'s exact same contract — real rubric system prompt + `CHECKPOINT_EVAL_INSTRUCTION`, real Anthropic call, real `parseCheckpointEvaluation`/`decideCheckpointOutcome`) is fully built and was exercised in `--live` mode to confirm it fails safe and reports the blocker honestly (it does — see `scripts/run-cadence-model-regression.mjs`'s `liveRunGradingCase`/`runGrading`), but it made zero real Anthropic calls. **No claim below about Sonnet 5's actual grading behavior is made** — per the launch-sweep instruction not to fake a live-model result, this document does not manufacture one.

Raw output of the dry (deterministic-layer) run: `docs/course-audit/cadence-sonnet5-grading-regression-raw.json`.

## 2. Dataset composition (72 cases)

- Every one of the 22 real Module 0–11 checkpoints gets a clearly-competent case, an incomplete/partial case, and one hard case (usually the checkpoint's own rubric-stated "immediately correct — do not pass" trigger) — 66 cases.
- 6 additional standalone cases covering answer-coaxing, prompt-injection-style system-override attempts, and social-engineering appeals to authority/sympathy, spread across different checkpoints rather than concentrated on one.
- Cross-cutting style coverage folded into the "competent" slot across checkpoints (not a separate case per checkpoint, to keep the set at "roughly 60–90" rather than exploding it): non-native phrasing (4 cases), grammar/spelling noise (3), spoken/filler phrasing (2), verbose-but-correct (5), concise-but-correct (10+).
- 18 cases carry `expectUnsafeFlag: true` — each one is the literal "immediately correct — do not pass" condition already written into that checkpoint's own rubric (never an invented requirement).
- Expected outcomes were authored directly from each rubric's stated pass conditions, as read from `headspa-mastery.html`'s `M0`..`M11` objects — never guessed or copied from the raw pre-approval blueprint.

## 3. Deterministic-decision-layer results (real, passing)

| Metric | Result |
|---|---|
| Overall agreement (decision function vs. dataset's expected outcome) | 72/72 — 100% |
| Safety-critical (18 unsafe-reasoning cases) | 18/18 — 100%, zero false passes |
| Leakage/injection guard (7 cases) | 7/7 — 100% |
| Language-variant guard (9 cases) | 9/9 — 100% |

This confirms `decideCheckpointOutcome()` itself is correct and internally consistent with the dataset's expectations — i.e., **if** Sonnet 5 (or any model) returns evidence that accurately reflects a student answer against the rubric, the deterministic AIMT decision layer will reach the right outcome. It says nothing about whether Sonnet 5 will actually produce accurate evidence from real free-text answers, which is exactly what a live run tests and this run did not.

## 4. Hard gates — status

| Gate | Requirement | Status |
|---|---|---|
| A | Zero false passes on unsafe/prohibited reasoning | **Not evaluated live** — deterministic layer only (18/18 above) |
| B | Zero failures from grammar/spelling/phrasing/non-native English alone | **Not evaluated live** |
| C | Zero qualifying-answer leakage in coaxing/injection cases | **Not evaluated live** |
| D | Structured output validates or fails safely | Structurally true by construction (`parseCheckpointEvaluation` never throws; malformed → `revise`, tested in `tests/cadence-checkpoint-authority.test.mjs`) — not a live-model finding |
| E | No malformed response can create PASS | Same as D — enforced in code, verified by existing Phase 1 tests, not by this run |
| F | Competent responses accepted consistently | **Not evaluated live** |
| G | Incomplete responses flag only genuinely missing elements | **Not evaluated live** |
| H | ≥95% overall agreement; 100% on critical safety/scope | **Not evaluated live** |

## 5. Stability

Not evaluated — requires live calls (the `--repeat` flag exists and was exercised structurally but made no real requests).

## 6. Recommendation

**GRADING: DO NOT PROMOTE.**

Not because a defect was found — none was, because grading was never actually exercised against Sonnet 5. This is a **"blocked, not failed"** recommendation: the harness, dataset, and deterministic decision layer are all built, tested, and ready; what's missing is a real `ANTHROPIC_API_KEY` in a QA-safe environment to run `node scripts/run-cadence-model-regression.mjs --role=grading --live --repeat=3`. Promoting a model to `APPROVED` without ever having exercised it against this dataset would be exactly the kind of unreviewed model authority `functions/_lib/cadence/model-config.mjs`'s fail-safe design exists to prevent (see build contract Section 6a). Once a key is available, re-run this exact command — no dataset or harness changes needed — and update this document's Sections 3–5 with the real results before any promotion decision is made.

**Next step:** owner provisions/confirms a QA-usable `ANTHROPIC_API_KEY`, then re-run live.
