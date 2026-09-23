# AIMT Publication Editor v1 — Pilot Run Summary

This is the durable, versioned record of the v1 pilot. It records
**conclusions only** — no claim/source IDs, no per-claim detail, no raw
generated report content. Those live in the reproducible runtime JSON/
Markdown output under gitignored `research-import/` (see "Generated
artifacts are runtime output, not version-controlled state" in
`docs/research/AIMT-Publication-Editor-v1.md`) and can be regenerated at
any time — see "How to reproduce" below.

## What was run

- **Date:** 2026-09-23
- **Engine version:** `publication-readiness-v1` (the 4-state model —
  `READY` / `NOT_READY` / `NEEDS_SYNTHESIS` / `HUMAN_REVIEW` — described in
  `docs/research/AIMT-Publication-Editor-v1.md`)
- **Two read-only data sources, run for comparison:**
  1. The committed local validated export
     (`research-import/unpacked/aimt-research-library-export-2026-09-20/`)
  2. The **live production Supabase corpus**, read-only (`--live`: GET/
     SELECT via PostgREST and the service-role key only — confirmed
     `write_operations_performed: 0`, no `POST`/`PATCH`/`DELETE`/`PUT`
     issued at any point), run under explicit owner authorization.
- **Result:** the live and local runs produced **identical readiness
  outcomes and evidence metrics** for all six pilot concepts (same
  distinct-source counts, same candidate-claim counts, same risk tiers,
  same readiness states). The production corpus has not diverged from the
  committed 2026-09-20 export.

## State totals (both runs, identical)

| READY | NOT_READY | NEEDS_SYNTHESIS | HUMAN_REVIEW |
|---|---|---|---|
| 0 | 0 | 6 | 0 |

## Per-topic result

| Publication concept | Result |
|---|---|
| hair-loss | `NEEDS_SYNTHESIS` |
| shedding-vs-hair-loss | `NEEDS_SYNTHESIS` |
| androgenetic-alopecia | `NEEDS_SYNTHESIS` |
| telogen-effluvium | `NEEDS_SYNTHESIS` |
| alopecia-areata | `NEEDS_SYNTHESIS` |
| hair-cycle | `NEEDS_SYNTHESIS` |

## What this means

- **All six concepts had adequate evidence completeness.** Zero
  `evidence_gaps` across the board — sufficient distinct sources,
  higher-tier evidence present where required, limitations captured,
  citation metadata complete. Nothing here is blocked on more Harvester
  work or citation cleanup.
- **The blockers were synthesis signals, not missing evidence:** a
  `safety_conclusion` claim and/or a `supports_effect`/`no_effect` split
  among verified findings on 3–4 of the six concepts. Per the governance
  correction in `AIMT-Publication-Editor-v1.md`, this correctly routes to
  `NEEDS_SYNTHESIS` (for the future AI Publication Editor, v2) rather than
  an automatic `HUMAN_REVIEW`.
- **`hair-cycle` is the closest candidate to eventual autonomous
  publication:** LOWER risk tier, strong corroboration (systematic-tier
  evidence present), and only a single direction-split synthesis signal to
  resolve — no safety claim involved. Once page-specific candidate
  narrowing (documented as a v1 placeholder in
  `AIMT-Publication-Editor-v1.md`) excludes unrelated treatment-effect
  claims that merely share the topic tag, this is the most plausible first
  topic to reach a future `AUTO_READY` state.
- **Zero research rows, verification statuses, `research_public_pages`
  rows, or public pages changed** by either run. This remains a reporting-
  only, shadow-mode exercise.

## How to reproduce

```
node scripts/research-publication-editor-shadow.mjs
node scripts/research-publication-editor-shadow.mjs --live   # requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, read-only
```

Both write JSON + Markdown reports to `research-import/` (gitignored) by
default. See `docs/research/AIMT-Publication-Editor-v1.md` for the report
schema and the synthesis-packet contents these reports include.
