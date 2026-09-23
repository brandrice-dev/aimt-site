# AIMT Publication Editor v1 — Shadow-Mode Topic Readiness Engine

Status: **shadow mode / dry-run only**. Nothing described in this document
publishes anything, approves anything, or writes to the database.

## What it does

Publication Editor v1 answers a topic-level question that AIMT-Research-
Harvester (Rick) does not: **given the claims that have already cleared
Rick's own trust ladder, what should happen next for this topic on the
path toward publication?**

The intended model is **not** "gate everything for a human":

> deterministic gate → AI synthesis when needed → deterministic
> validation → automatic progression for safe lower/moderate content →
> humans only for true exceptions

Humans review exceptions, not the normal publication flow. Most
LOWER/MODERATE-risk topics with real synthesis work to do (a safety claim
that needs scope framing, or verified findings that look like they
disagree) are expected to eventually clear **without** a human touching
them, once a v2 synthesis layer and its deterministic post-synthesis
validator exist (see "Future auto-clear contract" below). v1 does not
build that layer -- it builds the gate in front of it and hands it a
clean, structured packet of exactly what needs reconciling.

It does this deterministically, in three layers (see "Files" below):

1. Groups CLAIM_VERIFIED-or-better research by topic.
2. Assesses corroboration (distinct sources, evidence-type mix, presence of
   higher-authority evidence).
3. Detects conflict indicators (safety claims, disagreeing findings,
   single-source topics, claims already flagged `needs_review`) —
   **without** assuming every such indicator means the topic is unsafe or
   requires a human. A `supports_effect` claim and a `no_effect` claim
   may address different interventions, populations, or questions
   entirely; a safety claim may simply need scope-appropriate framing
   rather than exclusion.
4. Classifies publication risk (LOWER / MODERATE / HIGH) from an explicit,
   hand-authored topic table — never a model guess.
5. Assesses evidence completeness (citation metadata, limitations/context).
6. Outputs one of four REPORTING-ONLY labels: `READY`, `NOT_READY`,
   `NEEDS_SYNTHESIS`, `HUMAN_REVIEW`.
7. For every `NEEDS_SYNTHESIS` result, assembles a **synthesis packet** —
   the exact claim/source IDs, direction/population detail, and
   deterministic rules a future AI Publication Editor (v2) needs to
   attempt reconciliation, without a human in the loop for the normal
   case.

## The four states

| State | Meaning | Who/what acts on it next |
|---|---|---|
| `READY` | Evidence complete, LOWER/MODERATE risk, no synthesis issue remains. | A page-generation system (not built here) could consume the candidate evidence directly. |
| `NOT_READY` | An evidence/citation/limitations/corroboration gap exists. | More Harvester work or citation cleanup — a data-completeness problem, not a judgment call. |
| `NEEDS_SYNTHESIS` | Evidence is sufficiently complete and the topic is LOWER/MODERATE risk, but claim relationships, scope, or safety framing need semantic reconciliation before page generation. | The future AI Publication Editor (v2), via the `synthesis_packet` on the result — **not automatically a human**. |
| `HUMAN_REVIEW` | Genuinely HIGH-risk subject matter, a claim already externally flagged `use_status=needs_review`, or (once v2 exists) an unresolved conflict/low-confidence synthesis output. | A human editor — reserved for true exceptions. |

## What it deliberately does NOT do

- **Does not change research data.** Read-only in every mode (see
  "Shadow-mode guarantee" below).
- **Does not change claim statuses.** `verification_status` on
  `research_claims`/`research_sources` is Rick's ladder
  (`DISCOVERED -> SOURCE_VERIFIED -> CLAIM_VERIFIED -> AIMT_APPROVED`,
  `supabase/migrations/20260920_create_research_library.sql`). This engine
  reads that ladder; it never writes to it.
- **Does not set `AIMT_APPROVED`, `public_eligible`, or `published`** on
  `research_sources`/`research_claims`, and does not create rows in
  `research_public_pages`. Its own `READY` / `NOT_READY` /
  `NEEDS_SYNTHESIS` / `HUMAN_REVIEW` labels are a *different, v1-only
  reporting vocabulary* — they are not aliases for those DB columns and
  must never be mapped onto them by a future automation without a
  deliberate, reviewed decision to do so.
- **Does not publish `/education` pages** or anything else public-facing.
- **Does not call another AI model.** Every rule is an explicit check
  against real, named schema fields (see "Fields used" below). This is
  intentional for v1: the governance/risk logic needs to be validated on
  its own, independent of another model's subjective synthesis. See
  "Future auto-clear contract" below for where a synthesis layer belongs.
- **Does not touch Harvester prompts, Rick's trust ladder, ingestion, or
  Cadence.** It only reads `research_claims`/`research_sources` after
  Rick has already written to them.
- **Does not add a schedule, cron, or Pages Function.** v1 ships as a
  local CLI only (`scripts/research-publication-editor-shadow.mjs`).
- **Does not implement semantic claim selection.** `synthesis_candidate_
  claim_ids` on the result is structurally present but identical to
  `candidate_claim_ids` in v1 — see "Page-specific candidate selection"
  below.

## How it differs from Rick / Harvester

| | Rick / Harvester | Publication Editor v1 |
|---|---|---|
| Question asked | Is this claim's wording faithful to its own source? | Given already-verified claims, what's the next deterministic step for this *topic* toward publication? |
| Unit of judgment | One claim against one source | A topic's whole CLAIM_VERIFIED-or-better evidence set |
| Output | Moves a claim up Rick's ladder (`DISCOVERED` → … → `CLAIM_VERIFIED`) | A reporting label (`READY`/`NOT_READY`/`NEEDS_SYNTHESIS`/`HUMAN_REVIEW`) that never touches the ladder |
| Can it approve for publication? | No — `AIMT_APPROVED` is human-only | No — v1 has no path to `AIMT_APPROVED`/`public_eligible`/`published` at all |
| Model calls | Yes (harvesting/verification) | No — deterministic rules only in v1 |

## Files

- `functions/_lib/research/publication-readiness.mjs` — the **pure**
  engine. `assessTopicReadiness(input) -> result`. No imports of `node:fs`
  or `fetch`; a unit test in `tests/research-publication-readiness.test.mjs`
  enforces this structurally so the module stays safely reusable (see
  "How this plugs into later automation"). Also exports
  `buildSynthesisPacket` indirectly via the result's `synthesis_packet`
  field for `NEEDS_SYNTHESIS` results.
- `functions/_lib/research/publication-readiness-loader.mjs` — **read-only**
  data access. `fetchTopicEvidenceLive()` (live Supabase, GET/SELECT only)
  and `loadExportFromDisk()` (the local validated export) both return the
  same `{ claims, sources }` shape. Also holds `PILOT_TOPIC_CONCEPTS`, the
  registry mapping a publication/SEO concept to the `research_topics.topic`
  value(s) it is built from.
- `scripts/research-publication-editor-shadow.mjs` — the CLI/report
  wrapper. Loads evidence for each pilot concept, runs the engine, writes
  a JSON + Markdown report (with a `-live` suffix when run with `--live`,
  so a live run never overwrites the local-export comparison run from the
  same day). Contains zero business logic of its own.
- `tests/research-publication-readiness.test.mjs` — synthetic-fixture unit
  tests (no production data, no network).

## Fields used (from the real schema, not invented)

From `supabase/migrations/20260920_create_research_library.sql` /
`functions/_lib/research/schema.mjs`:

| Need | Field(s) used |
|---|---|
| Topic grouping | `research_claims.topics text[]` (matched against `research_topics.topic` / `CONTROLLED_TOPICS`) |
| Claim status | `research_claims.verification_status` (`CLAIM_VERIFIED`, `AIMT_APPROVED` count as candidates) |
| Source IDs | `research_claims.source_id` → `research_sources.source_id` |
| Source evidence type | `research_sources.evidence_type` (`systematic_review`, `meta_analysis`, `rct`, `clinical_guideline`, `observational`, `narrative_review`, `textbook_chapter`, `professional_org`, `technical_report`, `other`) and `research_sources.source_role` (`guideline` used for "professional consensus") |
| Claim type | `research_claims.claim_type` (`finding`, `limitation`, `recommendation`, `safety_conclusion`, `method_note`, `other`, `method`) |
| Claim direction | `research_claims.direction` (`supports_effect`, `no_effect`, `association`, `descriptive`, `precaution`, `unclear`, …) |
| Claim scope | `research_claims.population_or_scope` — carried into the synthesis packet per-claim so a v2 layer can see whether two disagreeing claims actually address the same population/intervention |
| Verification status | `research_claims.verification_status`, `research_claims.use_status` (`active`/`provisional`/`superseded`/`excluded`/`needs_review`) |
| Limitations | Presence of a `claim_type = 'limitation'` claim in the candidate set |
| Publication date/year | `research_sources.year`, `research_sources.date_published` |
| Citation metadata | `research_sources.title`, `.doi`, `.url`, `.pmid`, `.pmcid` |
| Review/verification timestamps | `research_sources.year`/`date_published` (staleness only; `verified_on`/`last_reviewed_on` are available but not yet wired into a v1 rule — see "Recommended adjustments") |

**Observed data reality that shaped the rules:** in the live 2026-09-20
export (and confirmed identical in the live production corpus — see
"Pilot run" below), every `CLAIM_VERIFIED` claim across the pilot topics
carries `use_status = 'provisional'` — `'active'` does not appear anywhere
in the export. Candidacy is therefore `verification_status IN
(CLAIM_VERIFIED, AIMT_APPROVED)` **and** `use_status NOT IN (excluded,
superseded)`, not a naive `use_status = 'active'` check, which would have
zeroed out every real topic.

## Risk-classification rules

`TOPIC_RISK_BASELINE` in `publication-readiness.mjs` hand-maps all 24
`CONTROLLED_TOPICS` values to LOWER / MODERATE / HIGH, grounded in the
originating request's own worked examples wherever one was given (anatomy/
hair-cycle/definitions → LOWER; shedding patterns, condition
characteristics, dandruff/seborrheic dermatitis, scalp microbiome →
MODERATE; medications, contraindications, anything a public error could
materially harm someone → HIGH). A concept spanning multiple controlled
topics takes the **most severe** of its constituents' baselines — never
diluted by averaging. Any topic not in the table (a future addition to
`CONTROLLED_TOPICS`) defaults to **HIGH**: the engine never guesses
downward for something it doesn't recognize, and an unrecognized topic
always routes straight to `HUMAN_REVIEW`.

Risk tier is independent of, and evaluated separately from, per-topic
conflict signals: a `safety_conclusion` claim or a direction split showing
up in a MODERATE-baseline topic doesn't change its `risk_tier`. What it
changes is whether that topic needs semantic synthesis before it can be
considered settled — see "Safety and mixed-direction rules" below. This
keeps "how sensitive is this subject matter in general" (risk
classification) and "does this topic's actual evidence need reconciling
right now" (synthesis need) as two separate, individually-auditable
signals, which is exactly what makes it possible to route the second one
to an AI synthesis layer instead of a human without touching the first.

## Safety and mixed-direction rules (the governance correction)

An earlier version of this engine treated *any* `safety_conclusion` claim,
or *any* `supports_effect`/`no_effect` split, anywhere in a topic's
candidate set as an automatic block requiring a human. That over-blocks:
a `supports_effect` claim about one intervention and a `no_effect` claim
about a completely different one are not a disagreement at all, and a
safety claim may just need scope-appropriate framing, not exclusion. The
live pilot run (see below) makes this concrete — real
`supports_effect`/`no_effect` splits in the corpus turn out to span
distinct interventions (PRP vs. LLLT vs. herbal vs. dutasteride/
finasteride) and distinct populations (men vs. postmenopausal women, mild
vs. severe alopecia areata), which a synthesis layer has a real chance of
reconciling without ever needing a human to look.

The revised rule:

| Risk tier | `safety_conclusion` present | `supports_effect` + `no_effect` both present |
|---|---|---|
| LOWER / MODERATE | → `NEEDS_SYNTHESIS` (surfaced via `synthesis_packet.safety_claim_ids`, not blocking) | → `NEEDS_SYNTHESIS` (surfaced via `synthesis_packet.finding_direction_detail`, never called a contradiction) |
| HIGH | → `HUMAN_REVIEW` (but the topic was already going to `HUMAN_REVIEW` on risk tier alone) | → `HUMAN_REVIEW` (same — risk tier alone already forces it) |

Neither signal is ever silently dropped: both are recorded in full detail
(claim IDs, source IDs, `population_or_scope`, evidence type) precisely so
a future synthesis layer — not this engine — can decide whether the
material should be excluded from public use, included with scope framing,
or genuinely escalated.

## Page-specific candidate selection

A topic-wide candidate set (everything CLAIM_VERIFIED-or-better tagged
with a concept's controlled topics) is useful for *discovery* but too
broad for *publication*: a `hair-cycle` page about phases and normal
shedding timing should not be blocked or diluted by an unrelated
treatment-effect claim that merely happens to share the `hair-cycle` topic
tag. v1 does not implement that narrowing — doing so requires real
semantic judgment about what a specific page actually needs — but the
result shape is ready for it: `synthesis_candidate_claim_ids` is exposed
alongside `candidate_claim_ids` today as an identical passthrough. A v2
selection pass can populate it with a genuinely narrower subset without
changing this function's contract; callers that care about "what should
this specific page actually use" should already read from
`synthesis_candidate_claim_ids`, not `candidate_claim_ids`, in
anticipation of that.

## Synthesis packet schema

For every `NEEDS_SYNTHESIS` result, `assessTopicReadiness()` attaches a
`synthesis_packet` object (`null` for every other state) with:

```
{
  seo_page_concept,             // human-readable page concept name
  topic_slug,
  controlled_topics,            // research_topics.topic value(s)
  risk_tier,                    // LOWER | MODERATE (never HIGH here)
  candidate_claim_ids,          // all CLAIM_VERIFIED+ candidate claims
  candidate_source_ids,
  safety_claim_ids,             // claim_type = safety_conclusion
  supports_effect_claim_ids,    // finding claims, direction = supports_effect
  no_effect_claim_ids,          // finding claims, direction = no_effect
  limitation_claim_ids,         // claim_type = limitation
  finding_direction_detail: [   // one entry per supports_effect/no_effect finding
    { claim_id, source_id, direction, claim_type, population_or_scope, evidence_type }
  ],
  source_evidence_type,         // { source_id: evidence_type }
  population_or_scope_by_claim, // { claim_id: population_or_scope } where non-null
  citation_metadata: [          // one entry per candidate source
    { source_id, title, year, date_published, doi, url, pmid, pmcid }
  ],
  synthesis_required_flags,     // subset of conflict_flags that triggered NEEDS_SYNTHESIS
  evidence_gaps,                // passthrough (empty when the topic reached NEEDS_SYNTHESIS cleanly)
  post_synthesis_validation_rules // static list, see "Future auto-clear contract"
}
```

No secrets, config, or anything beyond claim/source IDs and schema
metadata is included. This is deliberately everything (and only what) a
v2 synthesis layer needs to attempt reconciliation without re-querying the
database itself.

## Readiness rules

State determination, in priority order (highest first):

1. **HIGH risk tier → `HUMAN_REVIEW`, unconditionally.** Never auto-cleared
   by synthesis, regardless of how clean the evidence or a hypothetical
   synthesis output looks.
2. **A candidate claim already externally flagged `use_status=needs_review`
   → `HUMAN_REVIEW`.** This is an already-identified exception from a
   prior process, not ordinary synthesis material — the point of a
   `needs_review` lane state is that someone already said "look at this."
3. **Any other evidence gap → `NOT_READY`.** Evidence completeness is a
   prerequisite to synthesis, not a synthesis question: missing citation
   metadata, insufficient corroboration, no limitation claim, or no
   substantive verified claim at all.
4. **LOWER/MODERATE risk with a `safety_conclusion` claim and/or a
   `supports_effect`/`no_effect` split → `NEEDS_SYNTHESIS`.**
5. **Otherwise → `READY`.**

Concretely, `READY` requires: at least one verified `finding`/
`recommendation` claim; at least 2 distinct sources (MODERATE additionally
needs at least one systematic-tier or professional-consensus source); at
least one verified `limitation` claim; every candidate source resolving to
a real, citeable `research_sources` row; LOWER/MODERATE risk; and no
synthesis or human-review signal tripped. Practitioner-scope framing (a
7th conceptual requirement from the original spec) is **not currently
derivable from any research-schema field** — v1 assumes it is always
satisfiable via AIMT's existing scope language (see
`docs/brand/AIMT-INSTITUTIONAL-POSITIONING.md`) and surfaces this
assumption explicitly in `metrics.scope_framing_assumed_available` rather
than silently baking it in.

## Shadow-mode guarantee

- The pure engine (`publication-readiness.mjs`) does no I/O at all —
  enforced by a structural unit test that fails the suite if the file ever
  imports `node:fs` or references `fetch`.
- The loader's live path (`fetchTopicEvidenceLive`) issues `GET` requests
  only, against Supabase's PostgREST `SELECT` endpoint, using the same
  service-role-over-`fetch` pattern already used by
  `functions/api/research-query.js`. It never calls `POST`/`PATCH`/
  `DELETE`/`PUT`.
- The CLI wrapper never calls `write_db`/`insert`/`update` anywhere and
  reports `write_operations_performed: 0` in its own JSON output (verified
  `0` on both the local-export and live-production runs below).
- No new Cloudflare Pages Function, schedule, or public route was added by
  this module. It runs only as a manually invoked local script.

## How this is intended to plug into later automation

- **A scheduled publication-review cycle** can import
  `assessTopicReadiness` + `PILOT_TOPIC_CONCEPTS` (or its own concept
  registry built the same way) directly — the engine takes no I/O
  dependency, so wrapping it in a cron-triggered Cloudflare Function later
  is an additive change, not a rewrite.
- **A page generator** would consume a `READY` result's
  `candidate_claim_ids`/`candidate_source_ids` (or, once populated with
  real narrowing, `synthesis_candidate_claim_ids`) as the vetted material
  to draft a `research_public_pages` row from — but only after a human
  reviewer, not this engine, sets `AIMT_APPROVED`/`public_eligible` on the
  underlying claims/sources per the existing DB constraints.
- **A future SEO priority loop** can rank `NOT_READY` topics by how close
  they are (fewest `evidence_gaps`) to becoming realistic Harvester
  targets, and `NEEDS_SYNTHESIS` topics by how large their
  `synthesis_packet` is (more claims to reconcile = more synthesis work).
- **Cadence/curriculum tooling** could use the same risk classification
  (`TOPIC_RISK_BASELINE`) to decide which topics it can synthesize answers
  from more freely versus which need a stronger citation-only posture.

## Future auto-clear contract (target v2 architecture)

This is the intended shape of the full pipeline. **None of steps 2–8 below
mutate anything and none are implemented in this PR** — v1 builds only the
deterministic gate (step 1) and the synthesis packet (step 4's input).

1. **Deterministic v1 gate runs** (this PR): every topic lands in `READY`,
   `NOT_READY`, `NEEDS_SYNTHESIS`, or `HUMAN_REVIEW`.
2. `READY` → candidate for a future page generator.
3. `NOT_READY` → candidate for a future research-priority queue (more
   Harvester/citation work needed).
4. `NEEDS_SYNTHESIS` → the AI Publication Editor (v2, not built here)
   receives the topic's `synthesis_packet`.
5. The AI layer proposes: a relevant claim subset, reconciled evidence
   framing, limitations, scope language, any excluded claims with a
   stated reason, and a confidence score.
6. A **deterministic post-synthesis validator** (also not built here, but
   its required checks are already declared as static rules in every
   synthesis packet's `post_synthesis_validation_rules`) verifies: every
   statement in the proposal maps to a `candidate_claim_ids` entry in the
   packet; no claim/source outside the packet was introduced; a HIGH-risk
   topic is never silently cleared (moot in practice, since HIGH never
   reaches this step); citations resolve to the packet's
   `candidate_source_ids` with complete metadata; and at least one
   limitation's substance is preserved in the final output.
7. If the topic is LOWER/MODERATE and the validator passes →
   **`AUTO_READY`** (a new state v2 would add; not implemented here).
8. If HIGH (never reaches this step in practice) or the validator finds an
   unresolved problem, or the synthesis layer itself declares low
   confidence → `HUMAN_REVIEW`.

The governance shape this preserves: **deterministic safety/readiness gate
first, model synthesis second, deterministic re-validation third, human
review reserved for genuine exceptions last** — never a model call that
can promote something to `AIMT_APPROVED`/`public_eligible` on its own.

## Pilot run (2026-09-20 export, and live production — read-only)

The owner authorized a live, read-only run against the production
Supabase corpus for this pilot (SELECT/GET only, via the existing `--live`
path; zero writes). Both runs are committed for comparison:

- `docs/research/publication-editor-shadow-pilot-report-2026-09-23.{json,md}`
  — local validated 2026-09-20 export
- `docs/research/publication-editor-shadow-pilot-report-2026-09-23-live.{json,md}`
  — live production corpus, read-only

**Result: the two are identical** — same topic counts, same candidate
counts, same readiness states, for all six pilot concepts. The production
corpus has not diverged from the committed 2026-09-20 export since it was
imported.

Re-run against the local export at any time with:

```
node scripts/research-publication-editor-shadow.mjs
```

Re-run against live Supabase (read-only) with:

```
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/research-publication-editor-shadow.mjs --live
```

## Recommended adjustments (from the real pilot output)

All six pilot concepts landed in `NEEDS_SYNTHESIS` (0 `READY`, 0
`NOT_READY`, 0 `HUMAN_REVIEW`) — a meaningfully different, more useful
result than the prior engine's all-`NEEDS_REVIEW` outcome, since every one
of these topics is now routed toward the future AI synthesis layer instead
of a human queue. The synthesis packets themselves are informative: for
example, `hair-loss`'s `supports_effect`/`no_effect` split maps to at
least a dozen distinct `population_or_scope` values (PRP vs. LLLT vs.
herbal interventions, men vs. postmenopausal women, mild vs. severe
alopecia areata) — strong evidence that most of this "conflict" is
different-question material a synthesis layer should be able to resolve
without escalating. Before a v2:

1. **Distinguish claim-count-weighted conflicts from single-outlier
   ones.** One `no_effect` claim against six `supports_effect` claims
   currently trips the same flag as a genuine 50/50 split. Both correctly
   route to `NEEDS_SYNTHESIS` today (an acceptable outcome — a synthesis
   layer should look at either), but a weighted signal in the packet would
   help the future synthesis layer (or a human reviewing its output)
   triage effort.
2. **Give `verified_on`/`last_reviewed_on` a staleness role.** v1's
   staleness rule only looks at publication year; AIMT's own last-review
   date on a source is sitting in the schema unused.
3. **Use `population_or_scope` in the synthesis packet as a first-pass
   auto-partition signal.** The pilot data suggests many direction splits
   are already resolvable by population/intervention alone — a v2 could
   attempt this specific reconciliation deterministically before ever
   calling a model, only handing genuinely unresolvable splits to the AI
   layer.
4. **Give practitioner-scope framing (the 7th readiness rule) a real
   signal** instead of the current always-true placeholder — likely a
   manually curated per-topic scope-language reference, not a derived
   field.
5. **Implement real `synthesis_candidate_claim_ids` narrowing** (see
   "Page-specific candidate selection") so a topic like `hair-cycle` isn't
   handing a synthesis layer treatment-effect claims that a phases/timing
   page will never use.

## Recommended Publication Editor v2 step

Build the AI synthesis layer described in "Future auto-clear contract"
step 5, consuming exactly the `synthesis_packet` shape documented above,
and the deterministic post-synthesis validator in step 6 that checks its
output against `post_synthesis_validation_rules`. Ship them together, not
the synthesis layer alone — a synthesis proposal with no deterministic
re-check is exactly the ungated model call this v1 gate exists to precede.
Once both exist and have been validated on real `NEEDS_SYNTHESIS` output,
`AUTO_READY` (step 7) becomes the natural addition, with `HUMAN_REVIEW`
kept as the exception path it was always meant to be — never the default
outcome for ordinary publication flow.
