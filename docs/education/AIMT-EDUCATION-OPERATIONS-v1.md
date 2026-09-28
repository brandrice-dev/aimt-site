# AIMT Education Operations v1

Status as of this writing: **the orchestration CODE exists and is wired end-to-end, but it has never processed a real topic past the decision-pipeline stage, it has no active GitHub Actions schedule (the workflow file is design-complete but NOT installed in this repository), and AUTOPUBLISH is OFF.** Nothing in this document describes a system that runs unattended, on a cadence, or has published anything autonomously. It describes an architecture that has been built and proven safe with fixtures/mocks and live, read-only dry runs (topic selection, weekly count, published-topic state, freshness) — never a real intent-planning/synthesis/writer/reviewer call, and never any write.

**Trust-boundary correction applied:** a final review found the model was trusted with several things it should never have been -- authoring source metadata (title/authors/year/doi/url) and related-link destinations, and a route/file collision path that the generated-diff allowlist alone could not catch. Both are now closed mechanically (never by discipline alone) -- see "Route-collision guard" and "Source and related-link authority" below.

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
  education-source-authority.mjs               (deterministic sources -- never the model)
  education-related-links.mjs                  (deterministic related_links -- never the model)
  education-route-guard.mjs                     (route-collision guard, before any synthesis call)
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

**Installed as a shadow-only workflow.** `.github/workflows/aimt-education-operations.yml` runs weekdays at `cron: '0 14 * * 1-5'` (14:00 UTC) and supports a bare `workflow_dispatch` with no mode inputs. The workflow's only operational command is:

```
node scripts/education-operations-cycle.mjs --shadow
```

Concurrency is `aimt-education-operations` with `cancel-in-progress: false`; timeout is 30 minutes. Permissions are deliberately narrow: `contents: read` and `issues: write` only. There is no `contents: write` or `pull-requests: write`, so this scheduled workflow cannot create a generated-page branch/PR even though the local CLI has a separately implemented `--prepare` capability.

The workflow passes only the required read/model credentials and the existing repository variables. It always uploads `research-import/education-ops/runs/` as `education-ops-shadow-${{ github.run_id }}` with 30-day retention. It never uploads or consumes `research-import/education-ops/prepared/`.

Required Actions secrets:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_PUBLICATION_EDITOR_API_KEY`
- `ANTHROPIC_EDUCATION_WRITER_API_KEY`

Required repository variables:
- `AIMT_EDUCATION_AUTOPUBLISH_ENABLED=false`
- `AIMT_EDUCATION_MAX_PAGES_PER_WEEK=4`

A missing required secret causes the run to stop safely; it does not authorize fallback to Cadence or another Anthropic credential.

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
- **Model-call ceiling correction: 4 model ROLES is not the same as a 4-call ceiling.** There are 4 conceptual roles (intent planner, Publication Editor, Education Writer, Education Reviewer), but Publication Editor's own bounded pipeline may itself issue up to 3 real API calls (1 initial + ≤1 reconciliation + ≤1 full retry, unchanged, existing behavior). The TRUE actual-API-call ceiling for one run is therefore **6** (1 + 3 + 1 + 1), exported as `MAX_EDUCATION_OPS_MODEL_CALLS_PER_RUN` (`education-run-ledger.mjs`). `prepareTopicArtifact()` still calls synthesis **exactly once** per run (no retry loop at the Education Operations layer on top of Publication Editor's own bounded retry) — the ceiling is about Publication Editor's *own* internal call count, not an Education-Operations-level multiplier.
- The run ledger tracks the REAL count, not an assumption: each `model_calls` entry carries an explicit `actual_call_count` (1 for every role except Publication Editor, which carries its own real `pipelineMetrics.model_calls`, 1–3). `buildRunReport()` sums these into `model_calls.actual_model_call_count` and **throws** if the total ever exceeds 6 — a hard, mechanical refusal to report a run that violates its own budget, rather than silently under-reporting it as "4 calls." `model_calls.total_roles_invoked` (max 4) and `model_calls.actual_model_call_count` (max 6) are both present and distinct; `total_calls` is kept only as a backward-compatible alias of the latter.
- Every model call's `{role, input_tokens, output_tokens}` is recorded in the run report (`buildRunReport()`'s `model_calls.calls`).
- Critically, **the weekly-cap query, the published-topic-state query, and the freshness scan all run BEFORE the Education Ops model credential is even checked** — see "Order of operations" below. A missing `ANTHROPIC_EDUCATION_WRITER_API_KEY` therefore still yields a run report carrying real published-topic state, a real weekly count, a real freshness scan, and (if the weekly cap allows it) a real candidate selection — `stopped_before_model_stage: true` and `credential_available: false` on the report make this explicit, rather than the credential problem erasing everything else that was already learned.

## Topic selection

`education-topic-selector.mjs`. Restricted to the ONE active cluster registered for v1 — **Hair Loss & Shedding** (`ACTIVE_CLUSTERS['hair-loss-shedding']`). Activating a second cluster is an explicit future owner/strategy decision, not something this selector or a future run can do on its own.

**The published-topic set used for exclusion and cannibalization is LIVE, not hardcoded.** `education-topic-selector.mjs`'s own `PUBLISHED_TOPIC_SLUGS` constant (`['hair-cycle', 'telogen-effluvium']`) is now explicitly documented as a **fixture/history default for pure unit tests only** — every function that uses it (`candidateConceptsForCluster`, `checkCannibalization`, `selectNextTopic`) accepts an explicit `publishedTopicSlugs` parameter, and the real orchestrator (`scripts/education-operations-cycle.mjs`) always resolves this live from `research_public_pages` (`status='published' AND sitemap_eligible=true`) via `education-published-state-loader.mjs#fetchPublishedTopicSlugsLive()` and passes it through explicitly. This means a newly published page (a future Page #3) is excluded from new-page selection, folded into cannibalization checks, and included in the freshness scan automatically on the very next run — **with no code change required.** Proven in `tests/education-topic-selector.test.mjs`'s `DYNAMIC_PUBLISHED_SET` fixture and `tests/education-operations-cycle.test.mjs`'s `DYNAMIC_PUBLISHED_EXCLUSION` fixture, both of which inject a published set that does NOT match the constant and confirm the selector still excludes correctly.

Within the cluster (against the current live set — `hair-cycle` and `telogen-effluvium`): those two (already published) are excluded from NEW-page candidacy. `shedding-vs-hair-loss` is excluded via cannibalization (its controlled_topics are fully covered by the UNION of the two already-published topics — proven both in tests and in the live canary run below). The remaining candidates (`hair-loss`, `androgenetic-alopecia`, `alopecia-areata`) are scored on a `SEARCH_OPPORTUNITY_HEURISTIC` built entirely from real, already-available signals (distinct source count, candidate claim count, risk tier, conflict-flag cleanliness) — **never** a fabricated keyword metric. The highest-scoring eligible candidate wins; ties break alphabetically by `topic_slug` for full determinism.

**Known v1 limitation, disclosed rather than silently accepted:** the live canary run below found `hair-loss`, `androgenetic-alopecia`, and `alopecia-areata` tied at the SAME heuristic score (98) against the real corpus, because the score's evidence-depth terms are capped (source count capped at 20, claim count capped at 100) and all three candidates exceed both caps. The tie was broken correctly and deterministically (alphabetically), but this means the heuristic currently has limited discriminating power once a topic is "deep enough." This is a tuning question for the heuristic's weights/caps, not a correctness defect — and per the operating model, real Search Console/keyword data should replace or supplement this heuristic before it needs to discriminate more finely.

## Order of operations (read-only work never erased by a missing credential)

Every real cycle runs, in this exact order:

1. Load the LIVE published-topic set (`fetchPublishedTopicSlugsLive`) — fails closed (`CONFIG_BLOCKED`) if this query fails; never silently falls back to the `PUBLISHED_TOPIC_SLUGS` constant.
2. Resolve every published, active-cluster topic to a trusted route (`resolveTrustedSiblingPages` — see "Fail-closed published-route resolution" above) — fails closed (`INFRA_REVIEW`) if any published topic can't be resolved, or two resolve to the same route. Never silently drops a sibling.
3. Count real publications this week (`countPagesPublishedThisWeekLive`) — fails closed (`CONFIG_BLOCKED`) the same way as step 1.
4. Run the freshness scan (`checkAllPublishedTopicsFreshness`) against the live published set — **always**, regardless of the weekly cap or the new-page lane's own outcome. `freshness_scan_summary` is attached to every run report from this point forward, independent of everything else.
5. Weekly cap gate — `NO_OP_SUCCESS` if reached, before any evidence fetch or model call.
6. Topic selection/readiness (uses the live published set from step 1 for exclusion + cannibalization, and the trusted routes from step 2 for the route-collision guard).
7. **Only here** — the first point a model call is genuinely needed — is the Education Ops credential (`ANTHROPIC_EDUCATION_WRITER_API_KEY`) checked.
8. Intent planning → Publication Editor synthesis → Education Writer → Education Reviewer (unchanged from before).

A run report always carries `published_topics`, `pages_published_this_week`, `weekly_ceiling`, `freshness_scan_summary`, `credential_available` (`null` if never reached, otherwise `true`/`false`), and `stopped_before_model_stage` (`true` for any of steps 1–6's early exits, `false` from step 8 onward) — so a `CONFIG_BLOCKED`/`INFRA_REVIEW` result on a missing credential or an unresolvable published route still tells you exactly what was already learned before it stopped.

## Automatic page-intent planning

`education-intent-planner-*.mjs`. A structured, model-assisted step that produces the SAME kind of scope decision a human hand-wrote for hair-cycle/telogen-effluvium (`publication-page-intent.mjs`'s existing entries — untouched, still canonical for those two pages). The planner receives ONLY a candidate evidence *inventory* (claim IDs/types/topics, never claim text) — it is choosing scope, not summarizing evidence. Deterministically validated: no digit/statistic may appear anywhere in its output (a hard proxy for "never invent evidence"), out-of-scope must explicitly exclude diagnosis and treatment, topic_slug/cluster must match what was requested, and the route slug must be URL-safe. Any violation is `FAIL -> HUMAN_REVIEW`, never silently corrected.

## Fail-closed published-route resolution

`scripts/education-operations-cycle.mjs#resolveTrustedSiblingPages()`. `research_public_pages` is the runtime authority that a topic is published — but until this correction, a published, active-cluster topic that couldn't be mapped to a trusted route (no legacy registry entry, no persisted Page Plan artifact, or a malformed one) was silently OMITTED from the resolved sibling-page set. That is unsafe: the incomplete set feeds THREE downstream consumers — the route-collision guard below, deterministic `related_links` generation, and the Writer's sibling context — all of which would then have operated on a published-route set the database itself disagrees with, without ever being told so.

**Now fails closed instead.** For every currently-published topic that belongs to the active cluster, resolution must succeed through exactly one of:

1. the existing Page Builder route registry (`page-builder-route-registry.mjs`, legacy hair-cycle/telogen-effluvium), or
2. its own persisted, git-tracked Education Page Plan artifact (`functions/_data/education-page-plans/<slug>.json`) — which must parse as JSON, carry a `plan` object with a non-empty `plan.route` and `plan.h1`, and (wherever a `topic_slug` field is present, on the artifact itself or its embedded plan) agree with the published slug it's being resolved for.

If NEITHER succeeds for any published, active-cluster topic — or if two published topics resolve to the SAME route — the whole resolution fails: `resolveTrustedSiblingPages()` returns `{ok: false, violations: [...]}` (`UNRESOLVABLE_PUBLISHED_ROUTE:<slug>:<reason>` / `DUPLICATE_PUBLISHED_ROUTE:<route>:<slug>,<slug>`), never a partial, silently-shrunk result. A topic published OUTSIDE the active cluster is ignored normally — this check is scoped to the active cluster only, same as topic selection itself.

The orchestrator wraps this as its own gate, immediately after loading the live published-topic set and before the weekly-cap count, the freshness scan, topic selection, or any model call: a resolution failure becomes `final_state: INFRA_REVIEW`, `stopped_before_model_stage: true`, with `exception_reason` explicitly stating that "published DB state and trusted route/artifact state disagree" — never downgraded to "skip that one sibling." `published_topics` (the raw live list) is still preserved on the run report even though resolution itself failed. Zero Anthropic calls, zero file writes, zero DB writes on this path.

Today's actual production state (`hair-cycle` + `telogen-effluvium`, both legacy-registry entries) resolves normally with no change in behavior — proven directly against the real registry in `tests/education-published-route-resolution.test.mjs`'s `REAL_DEFAULTS_PRODUCTION` fixture. A future Page #3, once it has both a published DB row and a valid persisted Page Plan artifact, resolves automatically through path 2 above — no code change required.

## Route-collision guard

`education-route-guard.mjs`. Builds on the trusted, fail-closed published-route set above. A planner choosing a `route_slug` that happens to match a **currently live** page (e.g. `"telogen-effluvium"` for an entirely different topic) would make the orchestrator compute the exact route/file the real, live page already occupies — and the generated-diff allowlist alone would not catch it, since `education/hair-loss/telogen-effluvium.html` is still inside the allowed `education/**` prefix. Closed with three independent checks, all mechanical:

1. **Early, cheap check (before any synthesis call):** immediately after intent-plan validation, the orchestrator-computed route is checked against every currently-published route (resolved from the SAME trusted route data described below — never a guess). A collision routes straight to `INFRA_REVIEW` without spending a Publication Editor/Writer/Reviewer call on a doomed candidate.
2. **Page Plan validator context:** `validateEducationPagePlan(plan, clearedSnapshot, { expectedTopicSlug, expectedCluster, expectedRoute })` requires an EXACT match on all three — the model cannot redirect the page it's building by disagreeing with its own `topic_slug`/`cluster`/`route` output. A mismatch here is `PLAN_TOPIC_SLUG_MISMATCH`/`PLAN_CLUSTER_MISMATCH`/`PLAN_ROUTE_MISMATCH`, classified as `INFRA_REVIEW` (an architecture-safety failure, never `EDITORIAL_REVIEW`, which is reserved for content-quality problems).
3. **File-existence gate, in `prepareGeneratedArtifacts()` (--prepare only), checked BEFORE any write:** even a route that isn't currently *published* can collide with a STALE local file left behind by a prior, never-merged `--prepare` run — the article HTML path and the Page Plan artifact path are both checked with `existsSync()` before either is written; either existing is an `INFRA_REVIEW`-flavored throw, never an overwrite. This is a **new-page-lane-only** rule — a future freshness/update lane that intentionally replaces an existing page is an explicit, separate, not-yet-built contract.

The cluster hub insertion (`education-hub-updater.mjs#insertHubCard`) was strengthened the same way: it now refuses a second card for an already-linked route even if the new card's surrounding text (h1/description/source count) is completely different, not just a byte-identical repeat.

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
- The rendered source_id set must equal the cleared source_id set EXACTLY — every cleared source rendered (`MISSING_CLEARED_SOURCE` if not), and no extras (`UNCLEARED_SOURCE_RENDERED` if so).
- Every `related_links` href must be an internal AIMT route (`RELATED_LINK_NOT_INTERNAL` if not an absolute path starting with `/`) — defense-in-depth; see below for why the model has no path to violate this in the first place.

The Page Plan is persisted as a git-tracked data artifact under `functions/_data/education-page-plans/<topic-slug>.json` — verified safe because `functions/` is Cloudflare Pages Functions *source*, never served as a static asset (the same reason `functions/_lib/` already safely holds service-role-key-using code); a claim ID never becomes a publicly-fetchable URL this way.

## Source and related-link authority

**Trust-boundary correction:** the Education Writer model previously authored `sources[]` (title/authors/year/doi/url) and `related_links[]` (including each `href`) itself. The only deterministic check was that a rendered `source_id` was cleared — nothing confirmed the METADATA attached to it was real, so a model could pair a genuine, cleared `source_id` with an invented title or a wrong URL and still pass. `related_links` had no check against a trusted destination set at all.

**Fixed by removing the model's authority, not by trusting it harder:**

- `EDUCATION_WRITER_OUTPUT_JSON_SCHEMA` (`education-page-plan-schema.mjs`) — what the model is actually asked to produce — has **no schema slot** for `sources` or `related_links` at all. There is no field name for the model to fill in.
- `education-source-authority.mjs#buildTrustedSources(clearedSnapshot)` derives the rendered source list ENTIRELY from `clearedSnapshot.source_ids` + `clearedSnapshot.citation_map` — the same canonical, already-cleared citation data the existing Page Builder uses (`page-builder-draft.mjs#buildSourcesFromSnapshot`, same principle, generalized).
- `education-related-links.mjs#buildEducationRelatedLinks()` assembles the cluster hub, the Education Library home, and Research Standards (all fixed, trusted constants), plus each currently-published sibling page's route — resolved from either the existing Page Builder route registry (`page-builder-route-registry.mjs`, legacy hair-cycle/telogen-effluvium) or a persisted, git-tracked Education Page Plan artifact (a future generated/published page). A slug that resolves via neither source is silently omitted, never guessed.
- The orchestrator attaches both fields to the plan itself, deterministically, immediately after the Writer call and before validation — the model's own output object never even carries them.
- `existingClusterPages` (passed to the Writer for CONTEXT ONLY, so it never duplicates a sibling's content) now carries real, trusted `{topic_slug, route, label}` data from the same resolution — previously it carried no route at all.

## Education Writer

`education-writer-prompt.mjs` / `education-writer-client.mjs`. Input is restricted to EXACTLY the cleared, immutable `fingerprint_input` snapshot plus the approved voice rules plus the page intent — never the full/rejected research pool, never unverified claims, never Cadence or student data. Uses its own dedicated credential (`ANTHROPIC_EDUCATION_WRITER_API_KEY`), never Cadence's or Publication Editor's own key — a missing credential is `CONFIG_BLOCKED`, never a silent substitution. As of the source/link-authority correction above, the Writer's own output never includes `sources` or `related_links` at all.

## Automated fidelity/editorial review

`education-reviewer-*.mjs`. This is what replaces the owner's manual review for ordinary pages — the explicit gap `docs/brand/AIMT-EDUCATION-EDITORIAL-VOICE-v0.md` names ("there is still no real, deterministic (or model-assisted) entailment check standing in for the human editorial review"). Runs on top of, never instead of, the deterministic Page Plan validator. Per-unit verdicts:

- Paraphrase: `ENTAILED` / `TOO_STRONG` / `OUTSIDE_EVIDENCE` / `CAUSALITY_DRIFT` / `NUMERIC_DRIFT` / `OTHER_FAIL`.
- Framing: `NON_FACTUAL` / `CARRIES_SCIENCE`.
- Page-level: `voice_verdict` and `scope_verdict`, each `PASS`/`FAIL`.

**Retry policy (exact, as required):** `aggregateReviewOutcome()` classifies every possible failure combination. In v1, the set of "mechanically repairable" paraphrase verdicts is **empty by design** — every single failure mode (any non-ENTAILED paraphrase, any CARRIES_SCIENCE framing, any voice/scope FAIL) is `SUBSTANTIVE_FAIL`, which routes straight to `EDITORIAL_REVIEW`. The `REPAIRABLE_FAIL` outcome and its one-bounded-writer-repair mechanism exist in the type system and the orchestrator's branching is ready for it, but nothing in v1 can actually produce it — enabling a specific verdict as repairable is a deliberate, reviewable future code change, not something that can happen by accident. No failure is ever retried automatically more than the (currently zero) allowance, and nothing loops.

## Generic renderer

`education-page-renderer.mjs`. Reuses `assets/css/aimt-education.css`, the existing nav/footer markup, and the existing orbital-mark SVG symbol exactly — same hero/badge/sticky-TOC/scope-callout/takeaways/sources/related-links structure as the two hand-built pages. No new CSS class anywhere in this module. If a topic's Page Plan needs something this renderer cannot express, that is by definition an `INFRA_REVIEW` — the renderer never invents a new visual pattern to route around a limitation.

**JSON-LD correction:** the structured-data `<script type="application/ld+json">` block previously reused the same HTML-entity `escapeHtml()` helper used for the visible page (attributes/text nodes) inside a JSON context — those are not the same serialization, and doing so produced literal `"&amp;"`/`"&quot;"` INSIDE the JSON string values whenever a title/description contained `&` or a quote. Fixed with `toSafeJsonLd()`: a real JS object passed through `JSON.stringify()` (the one correct serialization), with only the `<` character additionally escaped as the valid JSON escape `<` — solely so a value containing a literal `"</script>"` can never terminate the script tag early. This never touches `&`/`"` at all. `tests/education-page-renderer.test.mjs` proves `JSON.parse()` on the rendered script contents succeeds and every value round-trips to the exact intended string, for both an ampersand-and-quotes title and a title containing a literal `</script>`.

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

## Prepared-artifact durability — current limit (documented, not built out further)

`--prepare` writes the exact prepared clearance artifact (the SAME in-memory object `prepareTopicArtifact()` validated — see "Exact-artifact persistence" above) under gitignored `research-import/education-ops/prepared/<topic>-<run_id>.json`. That is safe and sufficient for a manually-run, same-environment review flow: a human runs `--prepare`, reviews the PR, then runs `--persist-clearance --from-prepared=<that exact file>` in the SAME checkout.

**This is NOT yet safe across two separate GitHub Actions job runs.** A future scheduled `--prepare` workflow step would need to explicitly upload that JSON file as a GitHub Actions artifact (`actions/upload-artifact`) so a LATER, separate `--persist-clearance` job could download and consume the exact same bytes without re-running synthesis. That upload/download path does not exist yet. This is not currently a runtime blocker — the one workflow YAML this project designed (see "Scheduler cadence" above) runs `--shadow` only, which never reaches `--prepare` or writes this file at all — but it must not be assumed to already work once a future workflow adds a `--prepare` step. Do not claim cross-run artifact durability exists until that upload/retrieval path is implemented and tested.

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

The installed GitHub Actions workflow wakes up once each weekday at 14:00 UTC and runs the orchestrator in **shadow mode only**. A manual `workflow_dispatch` runs the exact same shadow command.

A shadow run may:
- read the live published-topic set and weekly publication count;
- run the read-only freshness monitor;
- select/rank an eligible candidate;
- if credentials are available and the run reaches model stages, execute intent planning, Publication Editor synthesis, Education Writer, and Education Reviewer;
- write the gitignored run ledger in the Actions checkout;
- upload that run ledger as a 30-day GitHub Actions artifact;
- create/dedupe GitHub Issues for genuine configured exception states.

A scheduled shadow run may **not**:
- run `--prepare`;
- create Page #3 or any article file;
- create a generated-content branch or PR;
- run `--persist-clearance`;
- run `--publish`;
- write a publication clearance or set a page to published.

`AIMT_EDUCATION_AUTOPUBLISH_ENABLED` remains `false`, and the workflow does not expose any input capable of changing modes.

## What still requires owner input before scheduled shadow runs can fully execute

The workflow itself is installed, and the four exception labels plus the two repository variables are configured. The remaining setup requirement is to provision the four Actions secret values listed under "Scheduler cadence" above. Until all required secrets exist, the workflow is expected to stop safely as a configuration problem rather than complete the model-assisted shadow pipeline.

After the secrets are configured, manually dispatch one shadow run and inspect its uploaded run ledger before relying on the weekday schedule.

## What still requires owner input beyond that, before AUTOPUBLISH can safely be switched on

5. **Run `--prepare` for real, at least once**, against a real selected topic, and have the owner review the resulting PR the same way hair-cycle and telogen-effluvium were reviewed (including the responsive/browser QA this project's earlier SEO/publication rounds did by hand — the automated reviewer covers fidelity/voice/scope, not visual rendering).
6. **Watch at least one real freshness scan result** against the two already-published pages in a scheduled (not just manually-invoked) run before trusting `FRESHNESS_FLAGGED` in production.
7. **Design, build, and test steps 13–17 of the "Exact publication ordering"** (merge, Cloudflare wait, live-route verification, `publishClearanceRecord()` transition, post-write integrity check) — none of this exists as code today; `--publish` refuses unconditionally specifically because this is missing. Merging is the single highest-consequence action in the whole pipeline, and per the originating task's own instruction ("Do NOT assume GitHub Actions can self-merge safely... Build the capability behind AUTOPUBLISH_ENABLED"), this is left as explicit follow-up work for when steps 1–12 have already been proven on real, owner-reviewed pages.
8. **Only then**, with all of the above proven, set `AIMT_EDUCATION_AUTOPUBLISH_ENABLED=true` as a deliberate, explicit, reversible repository variable change — never a code change — and separately implement and enable whatever `--publish` becomes once steps 13–17 exist.

**Before a real `--prepare` can be trusted ACROSS two separate CI job runs** (as opposed to one human running `--prepare` then `--persist-clearance` in the same checkout): implement and test the GitHub Actions artifact upload/download path described under "Prepared-artifact durability" above. Without it, a scheduled `--prepare` step and a later `--persist-clearance` step in two different job runs would have no guaranteed way to share the exact same prepared bytes.
