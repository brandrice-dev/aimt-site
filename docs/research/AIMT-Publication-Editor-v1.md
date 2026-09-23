# AIMT Publication Editor v1 — Shadow-Mode Topic Readiness Engine

Status: **shadow mode / dry-run only**. Nothing described in this document
publishes anything, approves anything, or writes to the database.

## What it does

Publication Editor v1 answers a topic-level question that AIMT-Research-
Harvester (Rick) does not: **given the claims that have already cleared
Rick's own trust ladder, is this whole TOPIC ready for a human editor to
consider for public framing?**

It does this deterministically, in three layers (see files below):

1. Groups CLAIM_VERIFIED-or-better research by topic.
2. Assesses corroboration (distinct sources, evidence-type mix, presence of
   higher-authority evidence).
3. Detects conflict indicators (safety claims, disagreeing findings,
   single-source topics, claims already flagged `needs_review`).
4. Classifies publication risk (LOWER / MODERATE / HIGH) from an explicit,
   hand-authored topic table — never a model guess.
5. Assesses evidence completeness (citation metadata, limitations/context).
6. Outputs one of three REPORTING-ONLY labels: `READY`, `NOT_READY`,
   `NEEDS_REVIEW`.

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
  `research_public_pages`. Its own `READY` / `NOT_READY` / `NEEDS_REVIEW`
  labels are a *different, v1-only reporting vocabulary* — they are not
  aliases for those DB columns and must never be mapped onto them by a
  future automation without a deliberate, reviewed decision to do so.
- **Does not publish `/education` pages** or anything else public-facing.
- **Does not call another AI model.** Every rule is an explicit check
  against real, named schema fields (see "Fields used" below). This is
  intentional for v1: the governance/risk logic needs to be validated on
  its own, independent of another model's subjective synthesis. See
  "Publication Editor v2" below for where a synthesis layer belongs.
- **Does not touch Harvester prompts, Rick's trust ladder, ingestion, or
  Cadence.** It only reads `research_claims`/`research_sources` after
  Rick has already written to them.
- **Does not add a schedule, cron, or Pages Function.** v1 ships as a
  local CLI only (`scripts/research-publication-editor-shadow.mjs`).

## How it differs from Rick / Harvester

| | Rick / Harvester | Publication Editor v1 |
|---|---|---|
| Question asked | Is this claim's wording faithful to its own source? | Given already-verified claims, is this *topic* ready for a human to consider for public framing? |
| Unit of judgment | One claim against one source | A topic's whole CLAIM_VERIFIED-or-better evidence set |
| Output | Moves a claim up Rick's ladder (`DISCOVERED` → … → `CLAIM_VERIFIED`) | A reporting label (`READY`/`NOT_READY`/`NEEDS_REVIEW`) that never touches the ladder |
| Can it approve for publication? | No — `AIMT_APPROVED` is human-only | No — v1 has no path to `AIMT_APPROVED`/`public_eligible`/`published` at all |
| Model calls | Yes (harvesting/verification) | No — deterministic rules only in v1 |

## Files

- `functions/_lib/research/publication-readiness.mjs` — the **pure**
  engine. `assessTopicReadiness(input) -> result`. No imports of `node:fs`
  or `fetch`; a unit test in `tests/research-publication-readiness.test.mjs`
  enforces this structurally so the module stays safely reusable (see
  "How this plugs into later automation").
- `functions/_lib/research/publication-readiness-loader.mjs` — **read-only**
  data access. `fetchTopicEvidenceLive()` (live Supabase, GET/SELECT only)
  and `loadExportFromDisk()` (the local validated export) both return the
  same `{ claims, sources }` shape. Also holds `PILOT_TOPIC_CONCEPTS`, the
  registry mapping a publication/SEO concept to the `research_topics.topic`
  value(s) it is built from.
- `scripts/research-publication-editor-shadow.mjs` — the CLI/report
  wrapper. Loads evidence for each pilot concept, runs the engine, writes
  a JSON + Markdown report. Contains zero business logic of its own.
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
| Verification status | `research_claims.verification_status`, `research_claims.use_status` (`active`/`provisional`/`superseded`/`excluded`/`needs_review`) |
| Limitations | Presence of a `claim_type = 'limitation'` claim in the candidate set |
| Publication date/year | `research_sources.year`, `research_sources.date_published` |
| Citation metadata | `research_sources.title`, `.doi`, `.url`, `.pmid`, `.pmcid` |
| Review/verification timestamps | `research_sources.year`/`date_published` (staleness only; `verified_on`/`last_reviewed_on` are available but not yet wired into a v1 rule — see "Recommended adjustments") |

**Observed data reality that shaped the rules:** in the live 2026-09-20
export, every `CLAIM_VERIFIED` claim across the pilot topics carries
`use_status = 'provisional'` — `'active'` does not appear anywhere in the
export. Candidacy is therefore `verification_status IN (CLAIM_VERIFIED,
AIMT_APPROVED)` **and** `use_status NOT IN (excluded, superseded)`, not a
naive `use_status = 'active'` check, which would have zeroed out every
real topic.

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
downward for something it doesn't recognize.

Risk tier is independent of, and evaluated separately from, per-topic
conflict signals (e.g. a `safety_conclusion` claim showing up in a
MODERATE-baseline topic doesn't change its `risk_tier`, but it does force
`NEEDS_REVIEW` — see below). This keeps "how sensitive is this subject
matter in general" and "does this topic's actual evidence need a human
right now" as two separate, individually-auditable signals.

## Readiness rules

A topic can only report `READY` when **all** of the following hold:

1. At least one `CLAIM_VERIFIED`-or-better claim of type `finding` or
   `recommendation` exists (not just limitations/method notes).
2. Corroboration: at least 2 distinct sources; MODERATE-risk topics
   additionally need at least one systematic-tier source
   (`systematic_review`/`meta_analysis`/`clinical_guideline`/`rct`) or a
   professional-consensus source (`evidence_type = professional_org` or
   `source_role = guideline`).
3. At least one `CLAIM_VERIFIED`-or-better `limitation` claim is present.
4. Every candidate source resolves to a real `research_sources` row with a
   title, a year/date, and at least one follow-able identifier
   (doi/url/pmid/pmcid).
5. `risk_tier` is not HIGH.
6. No unresolved conflict flag is present (safety claim, disagreeing
   findings, or a claim already marked `needs_review`).
7. Practitioner-scope framing — **not currently derivable from any
   research-schema field**; v1 assumes this is always satisfiable via
   AIMT's existing scope language (see
   `docs/brand/AIMT-INSTITUTIONAL-POSITIONING.md`) and surfaces this
   assumption explicitly in `metrics.scope_framing_assumed_available`
   rather than silently baking it in. Flagged for v2.

Failing (1)–(4) with no active conflict → `NOT_READY` (an evidence-gap
problem a Harvester run or citation cleanup could fix). Failing (5)–(6) →
`NEEDS_REVIEW` (a human-judgment problem, not a data-completeness one) —
and `NEEDS_REVIEW` always wins over `NOT_READY` when both would otherwise
apply, since a human needs to look regardless of what else is missing.

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
  reports `write_operations_performed: 0` in its own JSON output.
- No new Cloudflare Pages Function, schedule, or public route was added by
  this module. It runs only as a manually invoked local script.

## How this is intended to plug into later automation

- **A scheduled publication-review cycle** can import
  `assessTopicReadiness` + `PILOT_TOPIC_CONCEPTS` (or its own concept
  registry built the same way) directly — the engine takes no I/O
  dependency, so wrapping it in a cron-triggered Cloudflare Function later
  is an additive change, not a rewrite.
- **A page generator** would consume a `READY` result's
  `candidate_claim_ids`/`candidate_source_ids` as the vetted material to
  draft a `research_public_pages` row from — but only after a human
  reviewer, not this engine, sets `AIMT_APPROVED`/`public_eligible` on the
  underlying claims/sources per the existing DB constraints.
- **A future SEO priority loop** can rank `NOT_READY` topics by how close
  they are (fewest `evidence_gaps`) to becoming realistic Harvester
  targets.
- **Cadence/curriculum tooling** could use the same risk classification
  (`TOPIC_RISK_BASELINE`) to decide which topics it can synthesize answers
  from more freely versus which need a stronger citation-only posture.

## Pilot run (2026-09-20 validated export, read-only)

The owner declined a live-Supabase run for this initial pilot (Step 10's
own fallback clause: "if read-only access is unavailable, use the most
recent validated export and clearly state that limitation" — here it was
available but not yet authorized, so the same fallback was used out of
caution). The committed pilot output is:

- `docs/research/publication-editor-shadow-pilot-report-2026-09-23.json`
  (machine-readable, includes `candidate_claim_ids`/`candidate_source_ids`)
- `docs/research/publication-editor-shadow-pilot-report-2026-09-23.md`
  (human-readable summary)

Re-run against the local export at any time with:

```
node scripts/research-publication-editor-shadow.mjs
```

Re-run against live Supabase (once authorized) with:

```
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/research-publication-editor-shadow.mjs --live
```

## Recommended adjustments (from the real pilot output)

See the pilot report above for the full run, but in short: every one of
the six pilot concepts came back `NEEDS_REVIEW` in the 2026-09-20 export,
driven almost entirely by two rules tripping on real data —
`safety_conclusion` claims present in 3 of 4 direct topics, and a single
`no_effect` finding sitting alongside several `supports_effect` findings
in the other 3. Before a v2:

1. **Distinguish claim-count-weighted conflicts from single-outlier
   ones.** Right now one `no_effect` claim against six `supports_effect`
   claims trips the same flag as a genuine 50/50 split. Both correctly
   route to `NEEDS_REVIEW` today, but a weighted signal (e.g. a ratio or
   count alongside the flag) would help a human triage which
   `NEEDS_REVIEW` topics are actually close to resolved.
2. **Give `verified_on`/`last_reviewed_on` a staleness role.** v1's
   staleness rule only looks at publication year; AIMT's own last-review
   date on a source is sitting in the schema unused.
3. **Decide whether `population_or_scope` should factor into
   corroboration** (e.g. two sources on different populations
   corroborating the same topic slug may not be as strong as the raw
   count suggests).
4. **Give practitioner-scope framing (readiness rule 7) a real signal**
   instead of the current always-true placeholder — likely a manually
   curated per-topic scope-language reference, not a derived field.

## Recommended Publication Editor v2 step

Once the owner has reviewed a shadow run's `NEEDS_REVIEW` output and is
comfortable with the deterministic rules above, v2's natural next step is
an **AI synthesis layer that runs strictly after these hard checks, never
instead of them**: given a `NEEDS_REVIEW` topic's candidate claims, draft
the human-facing synthesis (e.g. reconciling a `supports_effect`/
`no_effect` split, or turning a `safety_conclusion` claim into
practitioner-scope-safe language) as a *proposal* for a human editor to
accept, edit, or reject — never as an automatic promotion to
`AIMT_APPROVED`. That keeps the same governance shape this document
describes: deterministic safety/readiness gate first, model synthesis
second, human approval always last.
