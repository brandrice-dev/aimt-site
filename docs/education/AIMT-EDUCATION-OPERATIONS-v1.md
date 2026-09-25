# AIMT Education Operations v1

Status as of this writing: **the scheduler exists and is wired end-to-end, but it has never processed a real topic past the decision-pipeline stage, and AUTOPUBLISH is OFF.** Nothing in this document describes a system that has published anything autonomously. It describes an architecture that has been built and proven safe with fixtures/mocks and one live, read-only topic-selection dry run — not one that has been exercised for real beyond that.

## What this is

The automation layer that sits AROUND the existing, unmodified Publication Editor and Page Builder architecture (evidence verification, deterministic readiness assessment, bounded AI synthesis, deterministic post-synthesis validation, clearance fingerprinting/integrity, guarded writers). This project did not touch any of that governance — it built a scheduler, a topic selector, an intent planner, a writer, a reviewer, a freshness monitor, and a generated-diff safety net around it.

## Architecture

```
scripts/education-operations-cycle.mjs        (orchestrator entry point, CLI)
functions/_lib/education-ops/
  education-topic-selector.mjs                (Phase 2: which topic, if any)
  education-ops-model-config.mjs              (isolated model registry + credential check)
  education-ops-client-base.mjs               (shared Anthropic call plumbing)
  education-intent-planner-schema.mjs          |
  education-intent-planner-validator.mjs       |-- Phase 3: automatic page-intent planning
  education-intent-planner-client.mjs          |
  education-synthesis-cache.mjs                (Phase 4: exact-artifact persistence fix)
  education-page-plan-schema.mjs               |
  education-page-plan-validator.mjs            |-- Phase 5: generic Page Plan
  education-writer-prompt.mjs                   |
  education-writer-client.mjs                  |-- Phase 6: Education Writer
  education-reviewer-schema.mjs                |
  education-reviewer-validator.mjs             |-- Phase 7: automated fidelity/editorial review
  education-reviewer-client.mjs                |
  education-page-renderer.mjs                  (Phase 8: generic HTML renderer)
  education-hub-updater.mjs                    (cluster hub card insertion)
  education-diff-allowlist.mjs                 (Phase 9: generated-diff allowlist)
  education-freshness-monitor.mjs              (Phase 10: freshness, no model call)
  education-exception-reporter.mjs             (Phase 11: GitHub Issues, deduped)
  education-run-ledger.mjs                     (Phase 14: run report shape)
.github/workflows/aimt-education-operations.yml (Phase 12: scheduler)
```

## Scheduler cadence

Weekdays, once per day, via GitHub Actions `schedule: cron: '0 14 * * 1-5'` (14:00 UTC). The exact hour is not load-bearing — the concurrency group (`aimt-education-operations`) ensures only one run is ever in flight, and evidence readiness, not the clock, decides whether anything happens. `workflow_dispatch` is also available for a manual trigger.

## Safety states

Every run resolves to exactly one of (`education-run-ledger.mjs`'s `RUN_FINAL_STATE`):

| State | Meaning |
|---|---|
| `NO_OP_SUCCESS` | Nothing eligible this run — a completely normal, expected outcome (weekly cap reached, empty/exhausted candidate pool, or every candidate ineligible). |
| `SHADOW_CANDIDATE_READY` | Everything passed: selection, intent planning, Publication Editor synthesis (AUTO_READY), Education Writer, Education Reviewer. In `--shadow` mode this is where the run stops. |
| `CONFIG_BLOCKED` | A required credential/config is missing (never a silent fallback to another subsystem's key). |
| `HUMAN_REVIEW` | Publication Editor synthesis returned a genuinely justified `HUMAN_REVIEW` (structured `reason_code` + substantive reason — see the existing governance contract, unchanged by this project). |
| `EDITORIAL_REVIEW` | The Page Plan failed deterministic validation OR the model-assisted reviewer found a substantive fidelity/voice/scope problem. |
| `INFRA_REVIEW` | The generated-diff allowlist was violated, or the shared architecture proved insufficient for this topic. Never let an autonomous run patch its own governance code to route around this. |
| `FRESHNESS_FLAGGED` | A published topic's freshness scan found `POTENTIAL_EVIDENCE_CHANGE`. |
| `PUBLISH_FAILED` | Cloudflare deployment or live-route verification failed after a merge — the DB row is never marked published in this case. |
| `PUBLISHED` | The full 17-step order (see below) completed and the DB row is confirmed published. Has never occurred — AUTOPUBLISH is off. |

## Weekly ceiling / model-call budget

- `AIMT_EDUCATION_MAX_PAGES_PER_WEEK` (default 4) is a **ceiling**, checked before any other work happens in a run. It is never a floor or a requirement — `checkWeeklyCap()` returning "within cap" only means the run is *allowed* to proceed if evidence readiness also says yes.
- One run processes **at most one** new topic.
- Per-run model-call ceiling: 4 conceptual calls (intent planner, Publication Editor's own bounded pipeline — itself capped at 3 calls internally, unchanged — Education Writer, Education Reviewer). `prepareTopicArtifact()` calls synthesis **exactly once**; there is no retry loop at the Education Operations layer on top of Publication Editor's own existing bounded retry.
- Every model call's `{role, input_tokens, output_tokens}` is recorded in the run report (`buildRunReport()`'s `model_calls`).

## Topic selection

`education-topic-selector.mjs`. Restricted to the ONE active cluster registered for v1 — **Hair Loss & Shedding** (`ACTIVE_CLUSTERS['hair-loss-shedding']`). Activating a second cluster is an explicit future owner/strategy decision, not something this selector or a future run can do on its own.

Within the cluster: `hair-cycle` and `telogen-effluvium` (already published) are excluded from NEW-page candidacy. `shedding-vs-hair-loss` is excluded via cannibalization (its controlled_topics are fully covered by the UNION of the two already-published topics — proven both in tests and in the live canary run below). The remaining candidates (`hair-loss`, `androgenetic-alopecia`, `alopecia-areata`) are scored on a `SEARCH_OPPORTUNITY_HEURISTIC` built entirely from real, already-available signals (distinct source count, candidate claim count, risk tier, conflict-flag cleanliness) — **never** a fabricated keyword metric. The highest-scoring eligible candidate wins; ties break alphabetically by `topic_slug` for full determinism.

**Known v1 limitation, disclosed rather than silently accepted:** the live canary run below found `hair-loss`, `androgenetic-alopecia`, and `alopecia-areata` tied at the SAME heuristic score (98) against the real corpus, because the score's evidence-depth terms are capped (source count capped at 20, claim count capped at 100) and all three candidates exceed both caps. The tie was broken correctly and deterministically (alphabetically), but this means the heuristic currently has limited discriminating power once a topic is "deep enough." This is a tuning question for the heuristic's weights/caps, not a correctness defect — and per the operating model, real Search Console/keyword data should replace or supplement this heuristic before it needs to discriminate more finely.

## Automatic page-intent planning

`education-intent-planner-*.mjs`. A structured, model-assisted step that produces the SAME kind of scope decision a human hand-wrote for hair-cycle/telogen-effluvium (`publication-page-intent.mjs`'s existing entries — untouched, still canonical for those two pages). The planner receives ONLY a candidate evidence *inventory* (claim IDs/types/topics, never claim text) — it is choosing scope, not summarizing evidence. Deterministically validated: no digit/statistic may appear anywhere in its output (a hard proxy for "never invent evidence"), out-of-scope must explicitly exclude diagnosis and treatment, topic_slug/cluster must match what was requested, and the route slug must be URL-safe. Any violation is `FAIL -> HUMAN_REVIEW`, never silently corrected.

## Exact-artifact persistence (the Phase 4 fix)

`education-synthesis-cache.mjs`. The defect found during telogen-effluvium development — one synthesis call during preview, an independent second call during `--write`, so the validated artifact and the persisted artifact were not provably the same object — is fixed structurally, not just by discipline:

- `prepareTopicArtifact()` is the **only** function that may call a synthesis function. It calls it exactly once and, only on AUTO_READY, builds the exact clearance record from that one in-memory result.
- `publishPreparedArtifact()` has no synthesize-capable parameter at all — it cannot call synthesis even if a future edit wanted it to, short of adding a new parameter (a visible, reviewable code change, not a silent behavior drift). It only re-verifies the artifact's own integrity (pure, no I/O) and persists it.
- Proven by `tests/education-synthesis-cache.test.mjs`'s `ROUND_TRIP` fixture: a full prepare-then-publish round trip, with an injected call-counting mock, asserts the counter is exactly 1 after both phases.

## Generic Page Plan

`education-page-plan-schema.mjs` / `education-page-plan-validator.mjs`. Free-form: no DEFINITION/TIMING/MECHANISM/FACTORS/PRACTITIONER_RELEVANCE/OTHER bucket taxonomy, no forced section headings — the Writer organizes sections however the cleared evidence actually supports, exactly as the telogen-effluvium re-synthesis round already proved is necessary (its own evidence landed in different classifier buckets across two synthesis runs of the SAME topic). Every visible unit is VERBATIM/PARAPHRASE/FRAMING with the same fidelity rules as the hand-authored pages, generalized:

- VERBATIM/PARAPHRASE must carry real `supporting_claim_ids`, all within the clearance's own `selected_claim_ids` — never invented.
- Any digit-bearing unit must be VERBATIM and byte-identical to a real cleared statement.
- FRAMING must carry zero claim IDs and zero source statements (structural check only — whether it *also* avoids smuggling in unattributed science is the model-assisted reviewer's job, not this deterministic check's).
- `scope_note` must match the cleared `scope_language.scope_note` byte-for-byte.
- No duplicate factual text across the page, **except** `key_takeaways`, which are an intentional recap (same exemption the original Page Builder's `findDuplicateFactualText` already carries).

The Page Plan is persisted as a git-tracked data artifact under `functions/_data/education-page-plans/<topic-slug>.json` — verified safe because `functions/` is Cloudflare Pages Functions *source*, never served as a static asset (the same reason `functions/_lib/` already safely holds service-role-key-using code); a claim ID never becomes a publicly-fetchable URL this way.

## Education Writer

`education-writer-prompt.mjs` / `education-writer-client.mjs`. Input is restricted to EXACTLY the cleared, immutable `fingerprint_input` snapshot plus the approved voice rules plus the page intent — never the full/rejected research pool, never unverified claims, never Cadence or student data. Uses its own dedicated credential (`ANTHROPIC_EDUCATION_WRITER_API_KEY`), never Cadence's or Publication Editor's own key — a missing credential is `CONFIG_BLOCKED`, never a silent substitution.

## Automated fidelity/editorial review

`education-reviewer-*.mjs`. This is what replaces the owner's manual review for ordinary pages — the explicit gap `docs/brand/AIMT-EDUCATION-EDITORIAL-VOICE-v0.md` names ("there is still no real, deterministic (or model-assisted) entailment check standing in for the human editorial review"). Runs on top of, never instead of, the deterministic Page Plan validator. Per-unit verdicts:

- Paraphrase: `ENTAILED` / `TOO_STRONG` / `OUTSIDE_EVIDENCE` / `CAUSALITY_DRIFT` / `NUMERIC_DRIFT` / `OTHER_FAIL`.
- Framing: `NON_FACTUAL` / `CARRIES_SCIENCE`.
- Page-level: `voice_verdict` and `scope_verdict`, each `PASS`/`FAIL`.

**Retry policy (exact, as required):** `aggregateReviewOutcome()` classifies every possible failure combination. In v1, the set of "mechanically repairable" paraphrase verdicts is **empty by design** — every single failure mode (any non-ENTAILED paraphrase, any CARRIES_SCIENCE framing, any voice/scope FAIL) is `SUBSTANTIVE_FAIL`, which routes straight to `EDITORIAL_REVIEW`. The `REPAIRABLE_FAIL` outcome and its one-bounded-writer-repair mechanism exist in the type system and the orchestrator's branching is ready for it, but nothing in v1 can actually produce it — enabling a specific verdict as repairable is a deliberate, reviewable future code change, not something that can happen by accident. No failure is ever retried automatically more than the (currently zero) allowance, and nothing loops.

## Generic renderer

`education-page-renderer.mjs`. Reuses `assets/css/aimt-education.css`, the existing nav/footer markup, and the existing orbital-mark SVG symbol exactly — same hero/badge/sticky-TOC/scope-callout/takeaways/sources/related-links structure as the two hand-built pages. No new CSS class anywhere in this module. If a topic's Page Plan needs something this renderer cannot express, that is by definition an `INFRA_REVIEW` — the renderer never invents a new visual pattern to route around a limitation.

## Generated-diff allowlist

`education-diff-allowlist.mjs`. An ordinary `--prepare` run may only touch: `education/**` (the new article + the cluster hub file), `sitemap.xml`, `functions/_data/education-page-plans/**`, and its own gitignored run-report/prepared-artifact files. Anything else — Publication Editor source, Page Builder source, validators, shared CSS, research schema, Cadence, auth, Stripe, course files, any unrelated institutional page — fails the check and the run stops as `INFRA_REVIEW` before a commit is ever made.

## Freshness monitor (v1)

`education-freshness-monitor.mjs`. Explicitly distinct from `verifyStoredClearanceIntegrity()`: integrity asks "does the stored page still match what was cleared?" (a question about the row); freshness asks "has the relevant research corpus materially changed SINCE that clearance?" (a question about the corpus). v1 makes **no model call** — it reconstructs the current candidate claim set for a published topic and diffs it against the claim set the clearance actually considered (selected + excluded, both already recorded on the persisted row). `FRESH` / `POTENTIAL_EVIDENCE_CHANGE` / `FRESHNESS_CHECK_FAILED`. A `POTENTIAL_EVIDENCE_CHANGE` means "consider this page for re-synthesis," never "this page is wrong," and never triggers a re-synthesis by itself. No new database table or migration was needed or proposed — the delta is derived fresh each run from data that already exists.

## Exception surfacing

`education-exception-reporter.mjs`. Only `HUMAN_REVIEW`, `EDITORIAL_REVIEW`, `INFRA_REVIEW`, `FRESHNESS_FLAGGED`, `CONFIG_BLOCKED`, and `PUBLISH_FAILED` ever create a GitHub Issue (labels: `education-review`, `education-infra`, `education-freshness`, `education-config`). `NO_OP_SUCCESS` and `SHADOW_CANDIDATE_READY` never do. Dedup: a title-embedded marker (`buildDedupMarker(topic, reason)`) is checked against currently-OPEN issues with the matching label before creating a new one — a closed issue with the same marker does NOT suppress a fresh one (the exception may be recurring).

## Exact publication ordering (built, never exercised in this task)

1. Choose one eligible topic (topic selector)
2. Plan intent (intent planner)
3. Publication Editor synthesis (unchanged, existing bounded pipeline)
4. Deterministic clearance validation (unchanged)
5. Persist the exact validated AUTO_READY artifact **locally** (`prepareTopicArtifact`)
6. Education Writer
7. Deterministic Page Plan validation
8. Education Reviewer
9. Generated-diff allowlist check
10. Create branch/PR (`--prepare`, `openPreparedPr()`) — **never merges**
11. Run tests
12. Merge (only ever with AUTOPUBLISH explicitly enabled and human-reviewed)
13. Wait for Cloudflare production deployment success
14. Live route verification
15. `publishClearanceRecord()` / `replaceNonPublicClearanceRecord()` (existing guarded writer, unmodified)
16. Verify post-write integrity
17. Log success (`PUBLISHED`)

DB `published_at` is only ever set at step 15/16, strictly after step 13's live confirmation — a Cloudflare or live-verification failure at step 13/14 means step 15 never runs (`PUBLISH_FAILED`, no DB write).

## What happens automatically today

- The scheduled workflow runs `--shadow` every weekday. Nothing about that run touches a file, a branch, a PR, or the database.
- `--prepare` mode is fully implemented (renders the article, writes the Page Plan artifact, updates the cluster hub, opens a branch/PR) but has never been invoked against a real selected topic in this project — doing so would create a real, if unmerged, PR proposing a new Education page, which this project's task explicitly forbade ("Do not create or publish Page #3").
- `--publish` mode refuses to run at all unless `AIMT_EDUCATION_AUTOPUBLISH_ENABLED` is exactly `"true"` — which it is not, anywhere, by default.

## What still requires owner input before AUTOPUBLISH can safely be switched on

1. **Run `--prepare` for real, at least once**, against a real selected topic, and have the owner review the resulting PR the same way hair-cycle and telogen-effluvium were reviewed (including the responsive/browser QA this project's earlier SEO/publication rounds did by hand — the automated reviewer covers fidelity/voice/scope, not visual rendering).
2. **Provision the two required GitHub repository secrets** (`ANTHROPIC_EDUCATION_WRITER_API_KEY`, plus the already-existing `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` as repository secrets available to Actions) and the two repository variables (`AIMT_EDUCATION_AUTOPUBLISH_ENABLED`, `AIMT_EDUCATION_MAX_PAGES_PER_WEEK`) — none of these exist in the repository yet; this project only wrote the code that reads them.
3. **Confirm GitHub Actions' write/PR permissions and branch protection** actually allow the workflow's own `GITHUB_TOKEN` to push a branch and open a PR in this repository (untested in this project — no workflow run has ever executed, scheduled or dispatched). If branch protection would block an eventual autonomous merge, that needs to be surfaced and decided explicitly, never bypassed with `--admin`.
4. **Decide the merge mechanism for step 12** — this project builds everything through step 11 (PR open, tests run) and stops; it does not implement an autonomous merge step at all. That is a deliberate omission, not an oversight: merging is the single highest-consequence action in the whole pipeline, and per the originating task's own instruction ("Do NOT assume GitHub Actions can self-merge safely... Build the capability behind AUTOPUBLISH_ENABLED"), building and testing that specific step is left as explicit follow-up work for when the rest of the pipeline has already been proven on real, owner-reviewed pages.
5. **Watch at least one real freshness scan result** against the two already-published pages in a live run (not just the pure-function tests) before trusting `FRESHNESS_FLAGGED` in production.
6. **Only then**, with the above proven, set `AIMT_EDUCATION_AUTOPUBLISH_ENABLED=true` as a deliberate, explicit, reversible repository variable change — never a code change.
