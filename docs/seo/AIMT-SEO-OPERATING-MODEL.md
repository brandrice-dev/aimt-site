# AIMT SEO Operating Model

Status: current as of 2026-09-25 (final SEO closeout).
This document describes the steady-state process AFTER the SEO
build/audit project closes — not a plan for further foundational work.
It is operational and intentionally short.

**Update (AIMT Education Operations v1):** the automation code described
in the OWNER INVOLVEMENT section below now EXISTS —
`scripts/education-operations-cycle.mjs` plus the supporting modules
under `functions/_lib/education-ops/`. **The scheduled trigger does
NOT exist yet.** `.github/workflows/aimt-education-operations.yml` is
design-complete (its exact contents are recorded in
`docs/education/AIMT-EDUCATION-OPERATIONS-v1.md`) but is not present in
this repository's `.github/workflows/` directory and has never been
installed — the push credential used to build this code lacked the
GitHub OAuth `workflow` scope required to add or update a workflow
file, so **no GitHub Actions schedule is active, and no unattended run
of this code has ever occurred.** Running the orchestrator today
requires an explicit, manual, local invocation (`node
scripts/education-operations-cycle.mjs --shadow`); it does not run on
any cadence by itself. Adding the workflow file with a credential that
does carry `workflow` scope is a required, separate, remaining step. In
addition, autonomous production publishing remains disabled
(`AIMT_EDUCATION_AUTOPUBLISH_ENABLED` is not set to `true` anywhere) —
even once the workflow is installed and running on a schedule, it
would still only run in `--shadow` mode by default, and full autonomous
publication is not implemented regardless of that variable (see
`docs/education/AIMT-EDUCATION-OPERATIONS-v1.md`'s "Corrected CLI
command semantics" section). It has never published a page. Both
Education pages live today (hair-cycle, telogen-effluvium) were
produced through a manually triggered, owner-reviewed run of the
Publication Editor / Page Builder pipeline, before this scheduler
existed. See `docs/education/AIMT-EDUCATION-OPERATIONS-v1.md` for the
full architecture, exactly what the scheduler does today (a safe,
file-write-free decision-pipeline dry run, run manually), and the
specific remaining steps before it runs unattended, let alone before
autonomous publishing could be switched on.

## Research

Research accumulates into the research library on an ongoing basis —
new claims and sources are added over time, independent of any specific
publication decision. Research growth and publication are decoupled:
adding a claim to the library does not itself schedule anything, and a
page's clearance is a snapshot of the evidence available at synthesis
time, not a live query.

## Topic selection

A topic is selected for a page based on:

- **SEO opportunity** — real signal (search-console query data, real
  keyword-tool data) when available. When no real data exists, any
  opportunity estimate must be explicitly labeled as a heuristic (e.g.
  "SEARCH-OPPORTUNITY HEURISTIC") — never presented as a measured
  metric. This repo has never had real keyword-volume data available;
  every topic selection to date used the labeled-heuristic path.
- **Evidence readiness** — governed by `publication-readiness.mjs`'s
  deterministic v1 assessment (candidate claim count, distinct source
  count, risk tier, evidence gaps). A topic with unresolved evidence
  gaps is not eligible for synthesis regardless of SEO opportunity.
- **Practitioner value** — does the topic answer a real question a
  working practitioner or prospective student has, not just a
  keyword-shaped phrase.
- **Risk** — `TOPIC_RISK_BASELINE` classifies topics LOWER / MODERATE /
  HIGH. Only LOWER/MODERATE risk is eligible for automated (AUTO_READY)
  clearance; HIGH risk always requires human review, by design, with no
  automated path around it.

No fabricated keyword metrics, ever, in any topic-selection record.

## Publication

- Only evidence-ready topics are published — clearance is the gate, not
  a calendar.
- No arbitrary publishing quota. A cadence target exists only as a
  ceiling on how much evidence-ready work gets processed, never as a
  floor that forces publication of an under-evidenced topic.
- Initial target cadence, once the autonomous scheduler is actually
  wired: approximately 3–5 strong pages/week. A pace of roughly 1/day
  may become reasonable later, but only after the scheduler's quality
  and indexing performance are proven at the lower cadence first —
  cadence increases are earned by observed results, not assumed.
- Evidence readiness always overrides calendar quota. A quiet week with
  zero evidence-ready topics is the correct outcome, not a gap to be
  filled.

## Quality

Every page that reaches AUTO_READY passed through:

- **Publication Editor governance** — deterministic v1 readiness
  assessment, then bounded AI synthesis (max 3 model calls: 1 initial +
  ≤1 reconciliation + ≤1 full retry) validated by a deterministic,
  non-AI post-synthesis validator (`publication-synthesis-validator.mjs`)
  that mechanically checks claim grounding, source citation, numeric
  fidelity, and scope — nothing here trusts the model's own stated
  confidence.
- **HUMAN_REVIEW exception behavior** — a model-declared HUMAN_REVIEW
  disposition requires a structured justification (`reason_code` from a
  fixed enum, a substantive reason, related claim IDs). A HUMAN_REVIEW
  with no valid justification is treated as an indeterminate model
  defect and routed through one bounded justification retry — never
  silently accepted as authoritative, and never silently converted to
  AUTO_READY either.
- **Symmetric non-core conflict exclusion** — when two claims genuinely
  disagree on a secondary, non-central detail, both (all) sides of that
  specific disagreement are excluded together
  (`UNRESOLVED_NON_CORE_CONFLICT`), never just the less-favorable side.
  The validator mechanically enforces that every claim named as a
  conflict partner is itself excluded under the same code. A disagreement
  that touches the page's core answer, a safety boundary, or the main
  practitioner interpretation is NOT eligible for this path and remains
  a genuine HUMAN_REVIEW.
- **AIMT Education voice** — VERBATIM (byte-identical, required for any
  numeric/digit-bearing claim) / PARAPHRASE (conservative rewrite,
  inherits real `supporting_claim_ids`, never hand-typed) / FRAMING
  (non-factual editorial orientation; must be removable without changing
  the page's scientific meaning — framing never carries a claim).
- **Factual fidelity** — a deterministic post-draft check
  (`checkDraftFidelity`) plus a human editorial-audit pass
  (`scripts/page-builder-editorial-audit.mjs`) before a page is treated
  as launch-ready.
- **No SEO sludge** — no generic AI-blog language, no journal-abstract
  tone, no fabricated practitioner implications, no keyword-stuffed
  headings. Clear before comprehensive; teach meaning, not just facts.

## Visuals

Optional, never mandatory. A visual (diagram or reference photography) is
warranted only when it teaches something more clearly or quickly than
prose would — evaluated per page, explicitly, as a `VISUAL_RECOMMENDATION`
(`NONE` / `DIAGRAM` / `REFERENCE_PHOTOGRAPHY`) with a one-paragraph
justification. Decorative stock imagery is never added merely to "fill"
a page. Both currently published Education pages have zero images;
that is the correct, evidence-driven outcome for their content, not an
oversight.

## SEO monitoring

Once real Search Console access exists for this site (see the closeout
record's Phase 9 section for current status), ongoing monitoring should
cover:

- Search Console index coverage (are published URLs actually indexed,
  not just crawled)
- Query/page performance (what queries actually surface each page, and
  with what impressions/clicks/position)
- Cannibalization (two AIMT pages competing for the same query when one
  should be canonical for it)
- Crawl errors (4xx/5xx Search Console reports for URLs it has seen)
- Sitemap health (accepted status, discovered-vs-submitted delta)
- Internal linking (every publicly indexable page reachable through a
  real link path, not sitemap-only discovery — see the closeout
  record's Phase 8 finding and fix)
- Content freshness (see below)

## Freshness

Research can evolve after a page is published — new claims, new
sources, or a correction to existing evidence can enter the library at
any time. A published page's `generation_source_hash` and
`publication_clearance` are a frozen snapshot of the evidence that
earned that page its clearance; they do not change automatically as the
underlying research library changes. **Clearance integrity is not the
same claim as evidence freshness** — a page can pass
`verifyStoredClearanceIntegrity()` perfectly (proving its stored content
matches what was actually cleared) while the underlying research has
since moved on (proving nothing about whether that content is still the
best available synthesis).

There is currently no automated freshness monitor or rerun trigger. A
future need: a mechanism that flags a published page's topic when
materially new evidence enters the library for its `controlled_topics`,
so a human (or, eventually, a governed automated process) can decide
whether the page merits a re-synthesis. This is explicitly deferred, not
built as part of this closeout.

## Owner involvement

**Desired future state**, once the scheduler above is wired and its
quality is proven:

- The owner does not start individual page builds.
- The owner does not select ordinary topics.
- The owner does not review normal (LOWER/MODERATE-risk, cleanly
  AUTO_READY, no HUMAN_REVIEW trigger) claims.
- Ordinary-risk pages move through selection → clearance → page
  generation → launch automatically.
- The owner receives genuine exceptions: HIGH-risk topics, HUMAN_REVIEW
  dispositions with a valid substantive reason, any decision that
  touches brand voice or a major practitioner-facing claim, and any
  system-level anomaly (e.g. a repeated non-deterministic result on
  identical evidence, as happened once during telogen-effluvium's
  development and was fixed at the governance layer rather than
  papered over).

**Current actual state:** every step above still requires an explicit
owner-initiated conversation to trigger. This document describes where
the system is designed to go, not where it is today.
