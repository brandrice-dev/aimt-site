# AIMT Page Builder v1 — the clearance → draft bridge (SHADOW MODE)

Status: **shadow mode only**. No `/education` route exists. No page has
been published. No sitemap change was made. This document describes a
draft-generation pipeline that has been built and tested against a real,
already-persisted production clearance row, but every artifact it
produces lives under gitignored `research-import/page-builder-shadow/`,
never under a route this site actually serves.

## What this is

`research_public_pages` now holds one real page-level clearance record
(`topic_slug = hair-cycle`, `clearance_mode = AUTO_READY`,
`status = ready_for_page_builder`) — the output of the automated
publication clearance bridge (see `docs/research/AIMT-Automated-
Publication-Clearance.md`). This phase answers the next question: *what
turns that persisted, immutable evidence snapshot into an actual page
draft*, without ever going back to the full topic-wide research corpus,
rerunning Publication Editor, or requiring a live model call?

## Source of truth: the persisted snapshot, not the corpus

Page Builder's only source of evidence is
`research_public_pages.publication_clearance.fingerprint_input` — the
exact canonical object Publication Editor's clearance hash was computed
from (see `functions/_lib/research/publication-clearance-fingerprint.mjs
#buildEvidenceFingerprintArtifact`). It is never `research_claims` or
`research_sources` directly, and never the full topic-wide candidate
pool (128 claims for hair-cycle) — only the already-cleared subset (40
claims for hair-cycle).

`functions/_lib/page-builder/page-builder-loader.mjs` enforces this
structurally, not just by convention:

- `fetchProductionClearanceRow()` is the only network call in the entire
  Page Builder module set, and it is a single read-only `GET` against
  `research_public_pages`, keyed on `topic_slug` — no other table is
  ever queried.
- `assertClearedRowOrThrow()` re-runs `verifyStoredClearanceIntegrity()`
  and `validatePageInvariants()` against the row and throws if either
  fails, before any evidence is touched — the exact same gates the
  clearance write path itself already enforces, run again independently
  here.
- `extractClearedSnapshot()` returns a **frozen object with exactly ten
  fields** (`CLEARED_SNAPSHOT_FIELDS`: `topic_slug`, `page_concept`,
  `public_intent`, `scope_language`, `risk_tier`, `selected_claim_ids`,
  `core_factual_points`, `limitations`, `citation_map`, `source_ids`) —
  the same ten categories `buildFingerprintInput()` itself defines.
  There is no second function anywhere in this module set that reaches
  back into the full row "for just one more field."

## Draft-generation contract

`functions/_lib/page-builder/page-builder-draft.mjs#buildPageDraft()` is
pure, synchronous, and deterministic — the same snapshot in produces the
byte-identical draft out, every time. Its output shape:

```
{
  topic_slug, route,
  seo: { title, meta_description, canonical_url, h1 },
  answer_summary: { text, supporting_claim_ids },
  sections: [ { section_id, heading, paragraphs: [ { text, supporting_claim_ids, is_framing? } ] } ],
  limitations: [ { text, supporting_claim_ids } ],
  key_takeaways: [ { text, supporting_claim_ids } ],
  sources: [ { source_id, title, authors, year, doi, url } ],
  related_links: [ { href, label, relation } ],
  provenance: { page_builder_version, generated_at, generation_source_hash, fingerprint_algorithm, risk_tier, selected_claim_ids, classification_method, metadata },
}
```

**Critical design decision, stated rather than hidden: v1 does not
paraphrase.** Every factual paragraph's `text` is the exact, verbatim
statement string Publication Editor's own synthesis + deterministic
post-synthesis validator already wrote and cleared
(`core_factual_points[i].statement` / `limitations[i].statement`). This
makes factual fidelity trivially provable without any AI call in this
phase — the text IS the cleared claim text, by construction, not a
rewrite of it. Page Builder's actual value-add in v1 is **organization**:
deciding section order, headings, and which cleared points answer which
practitioner question — never inventing or rephrasing evidence content.
A future version could add an AI "polish" pass for prose quality, but
only behind the fidelity check described below, so a paraphrase could
never silently drift from what was actually cleared.

### Section classification (deterministic, topic-agnostic mechanism)

Each `core_factual_point` is assigned to exactly one of five generic
thematic buckets via ordered, first-match-wins keyword matching against
its own statement text — `TIMING`, `MECHANISM`, `FACTORS`,
`PRACTITIONER_RELEVANCE`, `DEFINITION` (checked in that order, to avoid a
statement that mentions both a duration and "phases" being misclassified
as DEFINITION before its TIMING cue is checked). The classifier does not
branch on `topic_slug` — the keyword patterns were informed by reviewing
hair-cycle's real cleared statements (the only cleared snapshot that
exists as of this revision), but the mechanism itself is generic. A
bucket with no matching point is simply omitted from the page —
`buildPageDraft()` never forces a heading the evidence doesn't support.

**Known limitation, stated rather than hidden:** hair-cycle's cleared
evidence describes all four cycle phases (anagen/catagen/telogen/exogen)
in ONE combined `DEFINITION` statement, and three of their typical
durations in ONE combined `TIMING` statement — not as four
independently-supported per-phase facts. Splitting that single statement
into four separate per-phase sentences would mean writing NEW sentences
not verbatim present in the cleared evidence, which v1 deliberately does
not do. The originating brief's suggested four-heading breakdown
(separate Anagen/Catagen/Telogen/Exogen sections) is therefore **not**
built as four separate H2s — `DEFINITION` + `TIMING` render together
under one combined "The stages of the hair growth cycle" section
instead, and this is recorded explicitly in the draft's own
`provenance.metadata.combined_stage_headings_note`.

### hair-cycle's actual generated section plan

| # | section_id | heading | source bucket(s) |
|---|---|---|---|
| — | `concise-answer` | What is the hair growth cycle? | DEFINITION |
| — | `why-it-matters` | Why the hair growth cycle matters | framing (verbatim `public_intent`, no claim IDs required) |
| — | `stages` | The stages of the hair growth cycle | DEFINITION + TIMING |
| — | `cycle-vs-shedding` | Hair cycle vs. normal shedding | PRACTITIONER_RELEVANCE |
| — | `for-professionals` | What professionals should understand | MECHANISM + FACTORS |
| — | `limitations` | What this information cannot tell you | both cleared limitations, verbatim |

Plus top-level `key_takeaways` (3 cleared statements reused verbatim —
never a new paraphrase, so no new fidelity risk), `sources` (all 12
cleared sources from `citation_map`), and `related_links` (see route
registry below).

## Route registry

`functions/_lib/page-builder/page-builder-route-registry.mjs` — mirrors
`publication-page-intent.mjs`'s own per-topic registry pattern. Only
`hair-cycle` is registered (`/education/hair-loss/hair-growth-cycle`,
not live — confirmed against this repo's own `_redirects`, which has no
`/education` entry at all). `related_links` are drawn from this registry
too, and are limited to routes that actually exist today:
`/head-spa-certification`, `/about/research-standards`, `/courses` —
never an invented sibling education page.

## Validator (deterministic, "untrusted until proven")

`functions/_lib/page-builder/page-builder-validator.mjs
#validatePageDraft(draft, snapshot, { integrityResult })` — every rule is
a real structural/syntactic check, never an LLM judgment call:

1. **Claim authority** — every `supporting_claim_id` anywhere in the
   draft must belong to `snapshot.selected_claim_ids`
   (`UNSUPPORTED_CLAIM_ID`). Excluded/unselected claims are structurally
   unreachable in the first place — the snapshot the draft was built
   from never contains them (`extractClearedSnapshot()` only ever
   extracts the ten `fingerprint_input` fields, which do not include
   `excluded_claim_ids`).
2. **Factual support** — every paragraph not explicitly marked
   `is_framing: true` must carry ≥1 supporting claim ID
   (`FACTUAL_PARAGRAPH_MISSING_SUPPORT`).
3. **Source authority** — every cited source must exist in
   `snapshot.source_ids`/`citation_map` (`UNSUPPORTED_SOURCE`).
4. **Limitation preservation** — every cleared limitation statement must
   appear, verbatim, in `draft.limitations`
   (`MISSING_REQUIRED_LIMITATION`).
5. **Scope preservation** — `seo.meta_description` must equal
   `snapshot.scope_language.scope_note` exactly
   (`SCOPE_LANGUAGE_NOT_PRESERVED`).
6. **Risk ceiling** — `snapshot.risk_tier === 'HIGH'` fails outright,
   independent of any upstream gate (`HIGH_RISK_MATERIAL_INTRODUCED`).
7. **Route integrity** — `draft.route` must start with `/education/` and
   match the topic it claims (`ROUTE_MISMATCH`).
8. **No transactional cannibalization** — no sales-intent phrase
   ("enroll now", "buy now", a literal price, …) anywhere in body
   paragraphs (`TRANSACTIONAL_CANNIBALIZATION`) — a related link to
   `/head-spa-certification` is fine; folding its pitch into this page's
   own prose is not.
9. **Numeric-claim verification** — any paragraph containing a digit must
   be an exact verbatim match to a cleared statement, proving the number
   itself was never altered, rounded differently, or invented during
   drafting (`UNSUPPORTED_NUMERIC_CLAIM`).
10. **Treatment/diagnosis drift** — a fixed denylist (minoxidil, PRP,
    LLLT, "prescribe", "diagnos-", "treatment efficacy", …) is checked
    against every paragraph in the whole draft, not just the body
    (`TREATMENT_OR_DIAGNOSIS_DRIFT`).
11. **No `AIMT_APPROVED` dependency** — the literal string must never
    appear anywhere in the serialized draft
    (`AIMT_APPROVED_DEPENDENCY_INTRODUCED`); page-level `AUTO_READY`/
    `HUMAN_APPROVED` clearance is already a sufficient, independent
    basis, per the corrected Page Builder contract in
    `AIMT-Automated-Publication-Clearance.md`.
12. **Integrity-context requirement** — the validator refuses to trust
    any draft not accompanied by a `verifyStoredClearanceIntegrity()`
    result that itself returned `valid: true`
    (`MISSING_INTEGRITY_CONTEXT` / `STALE_OR_FAILED_INTEGRITY`).

## Factual-fidelity strategy

A claim-ID attachment alone is not enough — a paragraph could cite a
real, in-scope claim while still strengthening or distorting what that
claim actually said. `functions/_lib/page-builder/page-builder-
fidelity.mjs`:

- **`checkParagraphFidelityDeterministic()`** (used in v1, always): looks
  up the exact statement text for every claim ID a paragraph cites and
  requires the paragraph's own text to be byte-identical to at least one
  of them. Because v1 never paraphrases (see above), this is a real,
  exercised check that trivially passes on genuinely verbatim content and
  genuinely flags anything that isn't (`REWRITE_REQUIRED`) — not a
  rubber stamp.
- **`checkParagraphFidelityWithModel()`** (built, unit-tested against a
  mock, **never invoked by any code path in this task**): the hook a
  future paraphrase/polish pass would use — one paragraph + its 1-3
  supporting sentences in, one of `PASS`/`REWRITE_REQUIRED`/
  `HUMAN_REVIEW` out, via the isolated Page Builder model adapter
  (below). Deliberately much smaller than a full synthesis call.

## Isolated model adapter (never called live in this task)

`functions/_lib/page-builder/page-builder-model-config.mjs` — mirrors
`publication-editor-model-config.mjs`'s own shape (explicit lifecycle
registry, fail-safe env override, one resolver), but is its own file
with its own dedicated credential, `ANTHROPIC_PAGE_BUILDER_API_KEY` —
never Cadence's key, never Publication Editor's. Default candidate model:
**Claude Haiku 4.5** — a short per-paragraph classification task does not
need a Sonnet-class model, and Page Builder is deliberately architected
to cost less than Publication Editor per page, not the same or more.

## Cost architecture

See `docs/research/AIMT-Publication-Editor-Cost-Baseline.md`'s new
"Page Builder cost architecture" section for the full principle and the
real hair-cycle run's recorded numbers:
`functions/_lib/page-builder/page-builder-cost.mjs#buildCostMetrics()`
never fabricates a token count or dollar figure it doesn't have real
data for — `estimated_cost_usd` stays `null` until a real provider rate
table exists. The hair-cycle v1 shadow run's actual cost: **0 model
calls, 0 tokens, 0 dollars** — 9 deterministic per-paragraph fidelity
checks, 40 cleared claims used out of 128 originally considered.

## Rendering + structured data

`page-builder-render.mjs` renders a validated draft to an HTML string
reusing this repo's real design system (`aimt-design-system.css` /
`aimt-supporting-pages.css` / `aimt-public-nav.css`, the same nav/eyebrow
markup pattern as `about/research-standards.html`) so the shadow preview
honestly represents what the page would look like. `page-builder-
seo.mjs#buildStructuredData()` builds a conservative JSON-LD graph with
no `datePublished`/`dateModified` (never published), no
`aggregateRating`/`review` (none exist), and no invented `author`
(institutional content, not attributed to a fabricated individual).

## Shadow artifacts (this run)

`research-import/page-builder-shadow/hair-cycle/` (gitignored):
`draft.json`, `preview.html`, `validator-report.json`,
`fidelity-report.json`, `structured-data.json`, `cost-metrics.json`,
`provenance.json`. Produced by `scripts/page-builder-shadow.mjs`, which
makes exactly one network call (the read-only clearance-row GET) and
zero Anthropic calls.

## Public Research Standards copy (carried forward, not applied)

`/about/research-standards` still describes the pre-correction,
mandatory-human-approval model. The already-approved conceptual
correction (from the automated publication clearance phase) is carried
forward here for the owner to apply before the first Education page
actually publishes — see the parent conversation's final report for the
exact proposed replacement paragraph text for the "AIMT review ladder"
section and the "How approved evidence becomes public education" opening
line. Not edited in this phase.

## What this phase does NOT do

No `/education` route was created. No sitemap change was made. No
`research_public_pages` row was modified (Page Builder has no write path
at all — no module in this set contains a `POST`/`PATCH`/`PUT`/`DELETE`
call, verified structurally by `tests/page-builder-v1.test.mjs`'s
`NO_PRODUCTION_WRITE_PATH` fixture). No Anthropic call was made. No
change to Rick/Harvester, Cadence, Stripe, auth, course, or student
systems.
