# Ask Cadence × Research Library — real-traffic validation of the narrow scope

Branch `feature/cadence-research-judge-shadow` · 2026-10-01 · **shadow / offline only.**
Aggregate data: [`real-traffic-validation-2026-10-01.json`](real-traffic-validation-2026-10-01.json).
That file is anonymized. Raw student text exists only in the gitignored
`research-import/private/` folder on the evaluator's machine.

**Verdict.**

| Family | Verdict |
|---|---|
| A, ingredient/product safety and contact reactions | **KEEP OFF.** Insufficient real traffic: 0 eligible questions. |
| B, evidence about a named treatment, supplement or practice | **KEEP OFF.** Insufficient real traffic: 0 eligible questions. |

Neither family could be validated, because AIMT is pre-launch and almost no real Ask Cadence
traffic exists. No examples were fabricated, and nothing was tuned.

## Freeze

The scope router (`functions/_lib/cadence/research-scope.mjs`), the validator
(`scripts/cadence-research-real-traffic.mjs`) and all retrieval and judge code were committed at
`3c0cbee` **before any transcript was read**. They are unchanged since.

## Data available (read-only)

`cadence_messages` (role = user) joined to `cadence_threads.module_id`. The reads were GET-only,
through a guard limited to those two tables. No user id, email or profile field was selected.

| | Count |
|---|---|
| User messages, total | 98, from 14 threads |
| `mode = checkpoint` (answers to checkpoint prompts) | 96 |
| `mode = ask_cadence` (real student questions) | **2**, dated 2026-09-21 and 2026-09-23 |
| Real questions eligible for Family A | **0** |
| Real questions eligible for Family B | **0** |
| Real control questions | 2 |

The targets were 30+ eligible questions (15+ per family) and 15–25 controls; neither was met.

`course_progress.state`, the client app state that may hold older client-side Cadence chat memory,
is not a transcript table. It was **not** read; that would need separate owner approval.

## Results

| Measure | Family A | Family B |
|---|---|---|
| Eligible real questions | 0 | 0 |
| Selected-claim usefulness (gate ≥90%) | n/a | n/a |
| Coverage (gate ≥80%) | n/a | n/a |
| Research on/off accuracy (gate ≥95%) | n/a | n/a |
| Abstention accuracy (gate ≥90%) | n/a | n/a |
| **Gate** | **not met (no data)** | **not met (no data)** |

**Controls** (real, anonymized):

| Case | Kind | Scope decision | Research used |
|---|---|---|---|
| `rq-4d09fde4bd` | general medical / referral: a contraindication question about a symptomatic scalp | off (`excluded_concept:folliculitis`) | no |
| `rq-6c185a6ffd` | course navigation / technical problem | off (`decision_off`, `no_library_concept`) | no |

Control false-positive rate: **0/2**. That is too small to carry weight.

**Boundary.** All 96 checkpoint-mode messages were treated as an open checkpoint. Historical
messages carry no server-verified status, so the check fails closed. Every one was skipped
before any research read: 0 candidates, 0 judge calls.

**Trust and safety.**
- **Trust:** no candidate or final claim was below CLAIM_VERIFIED.
- **Prompt injection:** no real message triggered the injection signal.
- **Mixed evidence:** no eligible question, so there was nothing to assess.

**Judge and cost.** 0 judge calls, $0.00 of the $1.00 cap.

## Nothing student-facing changed

- No transcript row was written, annotated or exported to Git.
- `git diff` against `main` is empty for `functions/api/cadence/`, `ask-cadence.mjs`, checkpoint,
  certification, Module 12, `headspa-mastery.html` and `_routes.json`.
- `tests/cadence-research-judge.test.mjs` follows the live `ask.js` import graph and asserts it
  never reaches `research-context`, `research-judge`, `research-scope`, `research-lexicon` or
  `_lib/research/`. It also asserts nothing under `functions/` imports the judge or the scope
  router.

## What would make this decidable

After launch, once real Ask Cadence questions accumulate, run the same frozen validator
unchanged:

```
node scripts/cadence-research-real-traffic.mjs extract
node scripts/cadence-research-real-traffic.mjs run
node scripts/cadence-research-real-traffic.mjs report --labels <private labels>
```

A rough threshold is at least 15 eligible questions per family plus 15–25 controls. Hand-label
privately and judge each family against its own gate. Until then, both families stay off and
Ask Cadence answers exactly as it does today.
