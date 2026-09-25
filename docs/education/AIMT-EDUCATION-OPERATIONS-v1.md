# AIMT Education Operations v1

Status as of this writing: **the orchestration CODE exists and is wired end-to-end, but it has never processed a real topic past the decision-pipeline stage, it has no active GitHub Actions schedule (the workflow file is design-complete but NOT installed in this repository), and AUTOPUBLISH is OFF.** Nothing in this document describes a system that runs unattended, on a cadence, or has published anything autonomously. It describes an architecture that has been built and proven safe with fixtures/mocks and live, read-only dry runs (topic selection, weekly count, published-topic state, freshness) — never a real intent-planning/synthesis/writer/reviewer call, and never any write.

## What this is

The automation layer that sits AROUND the existing, unmodified Publication Editor and Page Builder architecture (evidence verification, deterministic readiness assessment, bounded AI synthesis, deterministic post-synthesis validation, clearance fingerprinting/integrity, guarded writers). This project did not touch any of that governance — it built a scheduler, a topic selector, an intent planner, a writer, a reviewer, a freshness monitor, and a generated-diff safety net around it.

## Architecture

```
scripts/education-operations-cycle.mjs        (orchestrator entry point, CLI)
functions/_lib/education-ops/
  education-topic-selector.mjs                (Phase 2: which topic, if any -- PURE, takes the live published-topic set as a parameter)
  education-published-state-loader.mjs        (runtime authority: LIVE published-topic set + LIVE weekly publication count, read-only)
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

**Design-complete, NOT installed, NOT active.** The intended cadence is weekdays, once per day, via GitHub Actions `schedule: cron: '0 14 * * 1-5'` (14:00 UTC), with a concurrency group (`aimt-education-operations`) ensuring only one run is ever in flight and `workflow_dispatch` available for a manual trigger. The exact YAML for this is recorded below and in this project's pull request, but **the file does not exist in `.github/workflows/` in this repository** — the credential used to build this project could not push a workflow file (missing the GitHub OAuth `workflow` scope; see "What still requires owner input" below). Until someone with that scope adds the file, **there is no active schedule and no unattended run of any kind** — the orchestrator only ever runs when a human invokes `node scripts/education-operations-cycle.mjs --shadow` (or `--prepare`) directly. Evidence readiness, not the clock, is what will decide whether anything happens once a schedule does exist.

Intended workflow contents (for the separate, narrow PR that will add this file once a `workflow`-scoped credential is available):

```yaml
name: AIMT Education Operations
on:
  schedule:
    - cron: '0 14 * * 1-5'
  workflow_dispatch:
concurrency:
  group: aimt-education-operations
  cancel-in-progress: false
permissions:
  contents: write
  pull-requests: write
jobs:
  run-cycle:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Run Education Operations cycle
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          ANTHROPIC_EDUCATION_WRITER_API_KEY: ${{ secrets.ANTHROPIC_EDUCATION_WRITER_API_KEY }}
          AIMT_EDUCATION_AUTOPUBLISH_ENABLED: ${{ vars.AIMT_EDUCATION_AUTOPUBLISH_ENABLED }}
          AIMT_EDUCATION_MAX_PAGES_PER_WEEK: ${{ vars.AIMT_EDUCATION_MAX_PAGES_PER_WEEK }}
          GH_TOKEN: ${{ github.token }}
        run: node scripts/education-operations-cycle.mjs --shadow
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: education-ops-run-report
          path: research-import/education-ops/runs/
```

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
- **The count it is checked against is LIVE, not caller-supplied.** `education-published-state-loader.mjs#countPagesPublishedThisWeekLive()` queries `research_public_pages` for `status='published'` rows whose `published_at` falls in the **current UTC calendar week** — Monday 00:00:00 UTC through the following Monday 00:00:00 UTC, exclusive (not a rolling 7 days; the exact boundary is `computeUtcCalendarWeekBounds()`, pure and unit-tested). A real orchestrator run never accepts a caller-supplied count — `options.pagesPublishedThisWeek` exists only as a test-only override, never read by the CLI. If the count query itself fails, the run fails closed as `CONFIG_BLOCKED` rather than assuming zero or falling back to any cached value.
- One run processes **at most one** new topic.
- Per-run model-call ceiling: 4 conceptual calls (intent planner, Publication Editor's own bounded pipeline — itself capped at 3 calls internally, unchanged — Education Writer, Education Reviewer). `prepareTopicArtifact()` calls synthesis **exactly once**; there is no retry loop at the Education Operations layer on top of Publication Editor's own existing bounded retry.
- Every model call's `{role, input_tokens, output_tokens}` is recorded in the run report (`buildRunReport()`'s `model_calls`).
- Critically, **the weekly-cap query, the published-topic-state query, and the freshness scan all run BEFORE the Education Ops model credential is even checked** — see "Order of operations" below. A missing `ANTHROPIC_EDUCATION_WRITER_API_KEY` therefore still yields a run report carrying real published-topic state, a real weekly count, a real freshness scan, and (if the weekly cap allows it) a real candidate selection — `stopped_before_model_stage: true` and `credential_available: false` on the report make this explicit, rather than the credential problem erasing everything else that was already learned.

## Topic selection

`education-topic-selector.mjs`. Restricted to the ONE active cluster registered for v1 — **Hair Loss & Shedding** (`ACTIVE_CLUSTERS['hair-loss-shedding']`). Activating a second cluster is an explicit future owner/strategy decision, not something this selector or a future run can do on its own.

**The published-topic set used for exclusion and cannibalization is LIVE, not hardcoded.** `education-topic-selector.mjs`'s own `PUBLISHED_TOPIC_SLUGS` constant (`['hair-cycle', 'telogen-effluvium']`) is now explicitly documented as a **fixture/history default for pure unit tests only** — every function that uses it (`candidateConceptsForCluster`, `checkCannibalization`, `selectNextTopic`) accepts an explicit `publishedTopicSlugs` parameter, and the real orchestrator (`scripts/education-operations-cycle.mjs`) always resolves this live from `research_public_pages` (`status='published' AND sitemap_eligible=true`) via `education-published-state-loader.mjs#fetchPublishedTopicSlugsLive()` and passes it through explicitly. This means a newly published page (a future Page #3) is excluded from new-page selection, folded into cannibalization checks, and included in the freshness scan automatically on the very next run — **with no code change required.** Proven in `tests/education-topic-selector.test.mjs`'s `DYNAMIC_PUBLISHED_SET` fixture and `tests/education-operations-cycle.test.mjs`'s `DYNAMIC_PUBLISHED_EXCLUSION` fixture, both of which inject a published set that does NOT match the constant and confirm the selector still excludes correctly.

Within the cluster (against the current live set — `hair-cycle` and `telogen-effluvium`): those two (already published) are excluded from NEW-page candidacy. `shedding-vs-hair-loss` is excluded via cannibalization (its controlled_topics are fully covered by the UNION of the two already-published topics — proven both in tests and in the live canary run below). The remaining candidates (`hair-loss`, `androgenetic-alopecia`, `alopecia-areata`) are scored on a `SEARCH_OPPORTUNITY_HEURISTIC` built entirely from real, already-available signals (distinct source count, candidate claim count, risk tier, conflict-flag cleanliness) — **never** a fabricated keyword metric. The highest-scoring eligible candidate wins; ties break alphabetically by `topic_slug` for full determinism.

**Known v1 limitation, disclosed rather than silently accepted:** the live canary run below found `hair-loss`, `androgenetic-alopecia`, and `alopecia-areata` tied at the SAME heuristic score (98) against the real corpus, because the score's evidence-depth terms are capped (source count capped at 20, claim count capped at 100) and all three candidates exceed both caps. The tie was broken correctly and deterministically (alphabetically), but this means the heuristic currently has limited discriminating power once a topic is "deep enough." This is a tuning question for the heuristic's weights/caps, not a correctness defect — and per the operating model, real Search Console/keyword data should replace or supplement this heuristic before it needs to discriminate more finely.

## Order of operations (read-only work never erased by a missing credential)

Every real cycle runs, in this exact order:

1. Load the LIVE published-topic set (`fetchPublishedTopicSlugsLive`) — fails closed (`CONFIG_BLOCKED`) if this query fails; never silently falls back to the `PUBLISHED_TOPIC_SLUGS` constant.
2. Count real publications this week (`countPagesPublishedThisWeekLive`) — fails closed the same way.
3. Run the freshness scan (`checkAllPublishedTopicsFreshness`) against the live published set — **always**, regardless of the weekly cap or the new-page lane's own outcome. `freshness_scan_summary` is attached to every run report from this point forward, independent of everything else.
4. Weekly cap gate — `NO_OP_SUCCESS` if reached, before any evidence fetch or model call.
5. Topic selection/readiness (uses the live published set from step 1 for exclusion + cannibalization).
6. **Only here** — the first point a model call is genuinely needed — is the Education Ops credential (`ANTHROPIC_EDUCATION_WRITER_API_KEY`) checked.
7. Intent planning → Publication Editor synthesis → Education Writer → Education Reviewer (unchanged from before).

A run report always carries `published_topics`, `pages_published_this_week`, `weekly_ceiling`, `freshness_scan_summary`, `credential_available` (`null` if never reached, otherwise `true`/`false`), and `stopped_before_model_stage` (`true` for any of steps 1–5's early exits, `false` from step 7 onward) — so a `CONFIG_BLOCKED` result on a missing credential still tells you exactly what was already learned before it stopped.

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

**Now actually wired into the real orchestrator** (it previously existed as a tested module the CLI never called). `runDecisionPipeline()` runs it against the LIVE published-topic set on every real cycle (step 3 in "Order of operations" above) — unconditionally, before the weekly cap gate and before topic selection, so a stale-page signal is never suppressed by cap exhaustion or an empty candidate pool. The freshness result is attached to the run report's `freshness_scan_summary` **independently** of the new-page lane's own `final_state`: a run can report a completely ordinary `NO_OP_SUCCESS` or `SHADOW_CANDIDATE_READY` for the new-page lane while `freshness_scan_summary` simultaneously carries a `POTENTIAL_EVIDENCE_CHANGE` for an existing published page — one lane never blocks or is blocked by the other, per the originating correction's explicit instruction not to let "one stale-page signal block evaluation of a new page unless there is a substantive architectural reason." When `main()` (the real CLI, not the injectable-mock `runDecisionPipeline()`) finds a `POTENTIAL_EVIDENCE_CHANGE`, it surfaces a separate, deduped `education-freshness`-labeled GitHub Issue for that specific topic (see "Exception surfacing" below), on top of whatever issue (if any) the primary run outcome itself surfaces.

## Exception surfacing

`education-exception-reporter.mjs`. Only `HUMAN_REVIEW`, `EDITORIAL_REVIEW`, `INFRA_REVIEW`, `FRESHNESS_FLAGGED`, `CONFIG_BLOCKED`, and `PUBLISH_FAILED` ever create a GitHub Issue (labels: `education-review`, `education-infra`, `education-freshness`, `education-config`). `NO_OP_SUCCESS` and `SHADOW_CANDIDATE_READY` never do. Dedup: a title-embedded marker (`buildDedupMarker(topic, reason)`) is checked against currently-OPEN issues with the matching label before creating a new one — a closed issue with the same marker does NOT suppress a fresh one (the exception may be recurring).

**Now wired into `main()`** (`scripts/education-operations-cycle.mjs`) using a real `gh issue list`/`gh issue create` I/O implementation, for both the primary run outcome (if its `final_state` is one of the six exception states above) and, independently, one issue per topic the freshness scan flags as `POTENTIAL_EVIDENCE_CHANGE`. `runDecisionPipeline()` itself remains injectable-mock-only and never calls `gh` — only `main()`'s real CLI path does. A failure surfacing an exception (e.g. the `education-*` labels not yet existing in this GitHub repository — they have not been created, see "What still requires owner input" below) is caught and logged, and deliberately never fails the run itself. **This wiring has not been exercised against the real repository in this project** — the workflow that would trigger it unattended does not exist yet (see "Scheduler cadence" above), and this project's own live canary calls `runDecisionPipeline()` directly rather than `main()`, specifically so it never attempts a real GitHub Issue write without the labels existing and without a separate, explicit go-ahead.

## Corrected CLI command semantics

The CLI originally had a `--publish` mode that consumed a prepared artifact and persisted it to `research_public_pages` as `ready_for_page_builder` — a NON-PUBLIC write. Calling that `--publish` overstated what it did (it never merges a PR, waits for Cloudflare, verifies a live route, touches `sitemap.xml`/`noindex`, or sets `status='published'`). This has been corrected:

- **`--persist-clearance`** (renamed from the old `--publish`) does exactly what that mode always did: consumes `--from-prepared=<path>`, structurally cannot trigger a second synthesis call (`publishPreparedArtifact()` has no synthesize-capable parameter — see "Exact-artifact persistence" above), and writes a `ready_for_page_builder` row via the existing guarded `writeClearanceRecord`/`replaceNonPublicClearanceRecord`. Still gated behind `AIMT_EDUCATION_AUTOPUBLISH_ENABLED === "true"` — this is a real production database write, even though the row it writes is non-public.
- **`--publish`** is now RESERVED for the future full autonomous-publication state machine and is **NOT IMPLEMENTED**. It refuses to run **unconditionally** — `runFullAutopublishRefusal()` takes no arguments at all and does not even read `AIMT_EDUCATION_AUTOPUBLISH_ENABLED`, so setting that variable to `"true"` does not and cannot make `--publish` do anything. This is deliberate: a boolean environment variable must never be allowed to imply a capability (merge/deploy/live-verify/DB-publish) that does not exist in code.

## Exact publication ordering (built through step 11 only; steps 12–17 do not exist as code yet)

1. Choose one eligible topic (topic selector, against the LIVE published-topic set)
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
12. `--persist-clearance`: persist the NON-PUBLIC `ready_for_page_builder` row (only ever with AUTOPUBLISH explicitly enabled and, in practice today, only ever run manually against a human-reviewed, already-merged PR)
13. *(not implemented)* Merge the PR
14. *(not implemented)* Wait for Cloudflare production deployment success
15. *(not implemented)* Live route verification
16. *(not implemented)* `publishClearanceRecord()` transition to `status='published'` (existing guarded writer, unmodified, but nothing calls it automatically)
17. *(not implemented)* Verify post-write integrity and log success (`PUBLISHED`)

Steps 13–17 are the future `--publish` state machine described above. DB `published_at` would only ever be set there, strictly after a live-confirmation step that does not exist yet — today, nothing in this codebase can reach `status='published'` without the separate, always-manual, human-authenticated `publishClearanceRecord()` invocation that predates this project (used for both hair-cycle and telogen-effluvium).

## What happens automatically today

**Nothing runs unattended at all** — there is no active GitHub Actions schedule (see "Scheduler cadence" above). Running any of the below requires a human to invoke the CLI directly.

- `node scripts/education-operations-cycle.mjs --shadow`, when run manually, executes the full decision pipeline against live evidence, the live published-topic set, the live weekly count, and the live freshness scan. Nothing about that run touches a file, a branch, a PR, or the database.
- `--prepare` mode is fully implemented (renders the article, writes the Page Plan artifact, updates the cluster hub, opens a branch/PR) but has never been invoked against a real selected topic in this project — doing so would create a real, if unmerged, PR proposing a new Education page, which this project's task explicitly forbade ("Do not create or publish Page #3").
- `--persist-clearance` mode refuses to run at all unless `AIMT_EDUCATION_AUTOPUBLISH_ENABLED` is exactly `"true"` — which it is not, anywhere, by default.
- `--publish` mode refuses to run **unconditionally, regardless of any environment variable** — it is reserved for a future state machine that does not exist as code (see "Corrected CLI command semantics" above).

## What still requires owner input before scheduled shadow runs can even start

1. **Add `.github/workflows/aimt-education-operations.yml`** (exact contents recorded under "Scheduler cadence" above) using a credential/account with the GitHub OAuth `workflow` scope — the credential available while building this project did not have it. Until this file exists in `.github/workflows/`, there is no schedule of any kind, shadow or otherwise.
2. **Create the four exception-issue labels** (`education-review`, `education-infra`, `education-freshness`, `education-config`) in this GitHub repository — `education-exception-reporter.mjs`'s real `gh issue create` wiring (see "Exception surfacing" above) will fail to attach a label that does not exist yet; that failure is caught and logged, never allowed to fail a run, but no issue will actually be created until the labels exist.
3. **Provision the required GitHub repository secrets** (`ANTHROPIC_EDUCATION_WRITER_API_KEY`, plus the already-existing `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` as repository secrets available to Actions) and repository variables (`AIMT_EDUCATION_AUTOPUBLISH_ENABLED`, `AIMT_EDUCATION_MAX_PAGES_PER_WEEK`) — none of these exist in the repository yet; this project only wrote the code that reads them.
4. **Confirm GitHub Actions' write/PR permissions and branch protection** actually allow the workflow's own `GITHUB_TOKEN` to push a branch and open a PR in this repository (untested — no workflow run has ever executed, scheduled or dispatched, because the workflow file doesn't exist yet). If branch protection would block an eventual autonomous merge, that needs to be surfaced and decided explicitly, never bypassed with `--admin`.

## What still requires owner input beyond that, before AUTOPUBLISH can safely be switched on

5. **Run `--prepare` for real, at least once**, against a real selected topic, and have the owner review the resulting PR the same way hair-cycle and telogen-effluvium were reviewed (including the responsive/browser QA this project's earlier SEO/publication rounds did by hand — the automated reviewer covers fidelity/voice/scope, not visual rendering).
6. **Watch at least one real freshness scan result** against the two already-published pages in a scheduled (not just manually-invoked) run before trusting `FRESHNESS_FLAGGED` in production.
7. **Design, build, and test steps 13–17 of the "Exact publication ordering"** (merge, Cloudflare wait, live-route verification, `publishClearanceRecord()` transition, post-write integrity check) — none of this exists as code today; `--publish` refuses unconditionally specifically because this is missing. Merging is the single highest-consequence action in the whole pipeline, and per the originating task's own instruction ("Do NOT assume GitHub Actions can self-merge safely... Build the capability behind AUTOPUBLISH_ENABLED"), this is left as explicit follow-up work for when steps 1–12 have already been proven on real, owner-reviewed pages.
8. **Only then**, with all of the above proven, set `AIMT_EDUCATION_AUTOPUBLISH_ENABLED=true` as a deliberate, explicit, reversible repository variable change — never a code change — and separately implement and enable whatever `--publish` becomes once steps 13–17 exist.
