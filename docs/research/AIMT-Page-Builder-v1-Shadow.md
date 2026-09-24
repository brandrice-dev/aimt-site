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
  scope_note,
  answer_summary: { text, supporting_claim_ids },
  sections: [ { section_id, heading, paragraphs: [ { text, supporting_claim_ids, is_framing? } ] } ],
  limitations: [ { text, supporting_claim_ids } ],
  key_takeaways: [ { text, supporting_claim_ids } ],
  sources: [ { source_id, title, authors, year, doi, url } ],
  related_links: [ { href, label, relation } ],
  provenance: { page_builder_version, generated_at, generation_source_hash, fingerprint_algorithm, risk_tier, selected_claim_ids, classification_method, template_topic, metadata },
}
```

**`scope_note` is its own field, separate from `seo.meta_description`**
(corrected this revision — see "Scope note vs. SEO meta description"
below). Both are populated, but they serve different purposes and are
validated by different rules.

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

### Classification (generic) vs. presentation (topic-specific template) — corrected split

An earlier revision of this document, and of `page-builder-draft.mjs`
itself, blurred two genuinely different things together: the CLASSIFIER
(truly generic) and the HEADINGS/SECTION LAYOUT (not generic at all,
even though the code once pretended otherwise). This is corrected now:

- **Classification is generic.**
  `page-builder-draft.mjs#classifyCoreFactualPoints()` assigns each
  `core_factual_point` to exactly one of five topic-agnostic thematic
  buckets — `TIMING`, `MECHANISM`, `FACTORS`, `PRACTITIONER_RELEVANCE`,
  `DEFINITION` — via ordered, first-match-wins keyword matching against
  its own statement text (`TIMING` checked before `DEFINITION`'s broader
  "phases/stages" pattern, so a statement mentioning both a duration and
  "phases" doesn't get misclassified). **No `topic_slug` branching exists
  anywhere in this function.**
- **Presentation is NOT generic, and does not pretend to be.**
  `functions/_lib/page-builder/page-builder-template-registry.mjs` is a
  small, explicit, hand-written per-topic template: which buckets become
  which named section, in what order, under what heading, plus the
  topic's SEO meta description and any topic-specific provenance note.
  Only `hair-cycle` is registered. Adding a second topic to Page Builder
  v1 means adding a template here (and a route entry in
  `page-builder-route-registry.mjs`) — it does **not** mean editing
  `buildPageDraft()`'s generic assembly logic.

**No claim is made that this classification mechanism generalizes to a
genuinely different topic's evidence shape.** The keyword patterns were
informed by reviewing hair-cycle's real cleared statements — the only
cleared snapshot that exists as of this revision. v1 remains a
**one-topic pilot**. Whether the same five buckets, or this exact
keyword set, correctly classify a differently-worded topic's
`core_factual_points` is an open question this phase does not answer and
does not claim to have answered — that validation will happen only after
a second topic earns a real page-level clearance and is run through this
same pipeline, not before.

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
instead (per the hair-cycle template), and this is recorded explicitly
in the draft's own
`provenance.metadata.combined_stage_headings_note`.

### No-duplicate-text contract (this revision)

An earlier version could render the same `DEFINITION` statement three
times: once as `answer_summary`, again under a standalone "What is the
hair growth cycle?" body section, and again inside the "stages" section.
That was technically safe (every copy still carried its real claim IDs)
but poor public-page output. `buildPageDraft()` now tracks which cleared
statement `answer_summary` used and excludes it from every subsequent
template-defined section — the standalone "What is...?" section is gone
entirely (its only content was the exact statement already promoted to
`answer_summary`), and the "stages" section for hair-cycle now shows only
the `TIMING` statement, since the single `DEFINITION` statement was
already used above. `key_takeaways` are explicitly exempt from this rule
— they are a deliberate recap, not a first presentation of a fact — and
`page-builder-content-units.mjs#findDuplicateFactualText()` enforces the
distinction is actually respected (checked by
`page-builder-validator.mjs`'s `DUPLICATE_FACTUAL_TEXT` rule).

### hair-cycle's actual generated section plan (from its registered template)

| section_id | heading | source bucket(s) |
|---|---|---|
| — (top-level) | *(answer_summary — no heading, rendered first)* | `DEFINITION` (first point only) |
| `why-it-matters` | Why the hair growth cycle matters | framing (verbatim `public_intent`, no claim IDs required) |
| `stages` | The stages of the hair growth cycle | `TIMING` (the `DEFINITION` point already used by `answer_summary` is excluded here) |
| `cycle-vs-shedding` | Hair cycle vs. normal shedding | `PRACTITIONER_RELEVANCE` |
| `for-professionals` | What professionals should understand | `MECHANISM` + `FACTORS` |
| `limitations` | What this information cannot tell you | both cleared limitations, verbatim, plus the cleared `scope_note` rendered visibly alongside them |

Plus top-level `key_takeaways` (3 cleared statements reused verbatim,
allowed to recap), `sources` (all 12 cleared sources from
`citation_map`), and `related_links` (see route registry below).

## Route registry

`functions/_lib/page-builder/page-builder-route-registry.mjs` — mirrors
`publication-page-intent.mjs`'s own per-topic registry pattern. Only
`hair-cycle` is registered (`/education/hair-loss/hair-growth-cycle`,
not live — confirmed against this repo's own `_redirects`, which has no
`/education` entry at all). `related_links` are drawn from this registry
too, and are limited to routes that actually exist today:
`/head-spa-certification`, `/about/research-standards`, `/courses` —
never an invented sibling education page.

## Rendered factual units — one shared definition (this revision's core fix)

An earlier version of both the validator and the fidelity checker only
inspected `draft.sections[].paragraphs`. The renderer also outputs
`answer_summary` and `key_takeaways` as visible factual content, and
neither was being checked for claim support, fidelity, numeric-claim
protection, or treatment/diagnosis drift — a real validation blind spot.
`functions/_lib/page-builder/page-builder-content-units.mjs
#collectRenderedFactualUnits(draft)` is now the single shared definition
of "every rendered factual unit" (`answer_summary`, every non-framing
section paragraph, every `key_takeaway`), used by BOTH
`page-builder-validator.mjs` and `page-builder-fidelity.mjs`, so the two
can never quietly disagree about what counts as rendered content. The
same module also provides `computeRenderedSupportClaimIds()` (the
honest, actually-computed union of claim IDs attached to non-framing
rendered units) and `findDuplicateFactualText()`.

## Validator (deterministic, "untrusted until proven")

`functions/_lib/page-builder/page-builder-validator.mjs
#validatePageDraft(draft, snapshot, { integrityResult })` — every rule is
a real structural/syntactic check, never an LLM judgment call. Returns
`{ valid, violations, report }`, where `report` explicitly surfaces
`rendered_support_claim_ids`, `rendered_support_claim_count`,
`selected_claim_count`, `duplicate_factual_text`, `route_check`
(`{route_ok, canonical_ok, h1_ok, topic_slug_ok}`), and
`scope_note_preserved` — so a caller never has to re-derive these from
the violation strings.

1. **Claim authority** — every `supporting_claim_id` on any RENDERED
   FACTUAL UNIT (not just section paragraphs) must belong to
   `snapshot.selected_claim_ids` (`UNSUPPORTED_CLAIM_ID`). Excluded/
   unselected claims are structurally unreachable in the first place.
2. **Factual support** — every rendered factual unit not explicitly
   marked `is_framing: true` must carry ≥1 supporting claim ID
   (`FACTUAL_PARAGRAPH_MISSING_SUPPORT`).
3. **Source authority** — every cited source must exist in
   `snapshot.source_ids`/`citation_map` (`UNSUPPORTED_SOURCE`).
4. **Limitation preservation** — every cleared limitation statement must
   appear, verbatim, in `draft.limitations`
   (`MISSING_REQUIRED_LIMITATION`).
5. **Scope note preservation (corrected this revision)** — `draft.scope_note`
   must equal `snapshot.scope_language.scope_note` exactly
   (`SCOPE_NOTE_NOT_PRESERVED`). This is now a dedicated field, no longer
   coupled to the SEO meta description — see "Scope note vs. SEO meta
   description" below.
6. **Meta description safety (new this revision)** — `seo.meta_description`
   must be present, ≤160 characters (`META_DESCRIPTION_TOO_LONG`),
   contain no digits (`META_DESCRIPTION_UNSUPPORTED_NUMERIC`), no
   treatment/diagnosis terms (`META_DESCRIPTION_TREATMENT_DRIFT`), and no
   transactional terms (`META_DESCRIPTION_TRANSACTIONAL`). It is NOT
   required to equal the scope note.
7. **Risk ceiling** — `snapshot.risk_tier === 'HIGH'` fails outright,
   independent of any upstream gate (`HIGH_RISK_MATERIAL_INTRODUCED`).
8. **Exact route/page-identity enforcement (corrected this revision)** —
   an earlier version only checked that `draft.route` started with
   `/education/`, so a draft for the wrong education page would have
   passed. Now requires, exactly: `draft.topic_slug === snapshot.topic_slug`
   (`TOPIC_SLUG_MISMATCH`), `draft.route === getPageBuilderRoute(snapshot.topic_slug).route`
   (`ROUTE_MISMATCH`), `draft.seo.canonical_url === getCanonicalUrl(snapshot.topic_slug)`
   (`CANONICAL_URL_MISMATCH`), and `draft.seo.h1 === snapshot.page_concept`
   (`H1_PAGE_CONCEPT_MISMATCH`). A draft for `/education/wrong-page` now
   fails even though it starts with `/education/`.
9. **No transactional cannibalization** — no sales-intent phrase
   ("enroll now", "buy now", a literal price, …) anywhere in rendered
   factual content (`TRANSACTIONAL_CANNIBALIZATION`) — a related link to
   `/head-spa-certification` is fine; folding its pitch into this page's
   own prose is not.
10. **Numeric-claim verification** — any rendered factual unit containing
    a digit must be an exact verbatim match to a cleared statement,
    proving the number itself was never altered, rounded differently, or
    invented during drafting (`UNSUPPORTED_NUMERIC_CLAIM`).
11. **Treatment/diagnosis drift** — a fixed denylist (minoxidil, PRP,
    LLLT, "prescribe", "diagnos-", "treatment efficacy", …) is checked
    against every rendered unit, framing included
    (`TREATMENT_OR_DIAGNOSIS_DRIFT`).
12. **No `AIMT_APPROVED` dependency** — the literal string must never
    appear anywhere in the serialized draft
    (`AIMT_APPROVED_DEPENDENCY_INTRODUCED`); page-level `AUTO_READY`/
    `HUMAN_APPROVED` clearance is already a sufficient, independent
    basis, per the corrected Page Builder contract in
    `AIMT-Automated-Publication-Clearance.md`.
13. **Integrity-context requirement** — the validator refuses to trust
    any draft not accompanied by a `verifyStoredClearanceIntegrity()`
    result that itself returned `valid: true`
    (`MISSING_INTEGRITY_CONTEXT` / `STALE_OR_FAILED_INTEGRITY`).
14. **No duplicate factual text (new this revision)** — no exact-text
    duplicate may exist across `answer_summary` + body sections
    (`DUPLICATE_FACTUAL_TEXT`); `key_takeaways` are explicitly exempt.

## Scope note vs. SEO meta description (corrected this revision)

These were previously (incorrectly) coupled — the validator required
`seo.meta_description === scope_note`. They are different concepts and
are no longer equated:

- **`scope_note`** is evidence/governance content: the cleared
  `scope_language.scope_note`, preserved verbatim as its own draft field
  and rendered visibly in the limitations/scope area of the page. Rule 5
  above enforces this exactly, unweakened.
- **`seo.meta_description`** is search-result presentation copy. It comes
  from the topic's registered template (`page-builder-template-registry.mjs`),
  hand-authored and closely anchored to the cleared `page_concept`/
  `public_intent` wording rather than freely invented, and is checked by
  rule 6 above for length/safety — never compared for equality against
  the scope note, because the two serve different purposes.

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

See `docs/research/AIMT-Publication-Editor-Cost-Baseline.md`'s "Page
Builder cost architecture" section for the full principle and the real
hair-cycle run's recorded numbers.
`functions/_lib/page-builder/page-builder-cost.mjs#buildCostMetrics()`
never fabricates a token count or dollar figure it doesn't have real
data for — `estimated_cost_usd` stays `null` until a real provider rate
table exists.

**Corrected this revision:** `candidate_claim_count` used to be a
hardcoded `128` literal at the call site
(`scripts/page-builder-shadow.mjs`) — correct for hair-cycle today,
silently wrong for any other topic tomorrow. It is now read from the
real persisted record, `record.publication_clearance.candidate_claim_count`,
and reported as `null` (never guessed) if that field is ever absent.
`selected_claim_count` (the size of the cleared `selected_claim_ids`
SET — everything made *available* to Page Builder) and
`rendered_support_claim_count` (the number of UNIQUE claim IDs that
actually ended up attached to rendered content) are now reported as two
distinct numbers, never conflated.

The real hair-cycle v1 shadow run's actual cost and coverage:
**0 model calls, 0 tokens, 0 dollars**; 11 deterministic per-unit
fidelity checks; 40 selected claims were made available, of which
**27 unique claim IDs actually ended up attached to rendered content**
(the remaining 13 selected claims contributed to Publication Editor's
overall claim selection/synthesis but were not individually cited as
`supporting_claim_ids` on any specific `core_factual_point`/`limitation`
statement — a real, expected property of the underlying data, not a
bug). This is reported honestly as `rendered_support_claim_count: 27`,
never as "40 claims used."

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

## Status: one-topic pilot, not yet a generalization claim

To state this plainly, in one place: **Page Builder v1's core assembly
mechanism (loader → generic classifier → template → validator →
fidelity check) is architecturally generic, but hair-cycle is still the
only topic it has ever actually run against.** The classifier's keyword
patterns were derived by reading hair-cycle's real cleared statements.
Whether they correctly bucket a differently-worded topic's evidence —
whether five buckets are even the right number for every topic, whether
a topic without a clean `DEFINITION`/`TIMING` split degrades gracefully
— is genuinely unknown and not claimed to be solved here. Adding a
second topic requires: (1) that topic earning a real page-level
`AUTO_READY`/`HUMAN_APPROVED` clearance through the existing Publication
Editor + clearance bridge (no shortcut), (2) a new entry in
`page-builder-route-registry.mjs`, and (3) a new, hand-written entry in
`page-builder-template-registry.mjs` — deliberately not automated,
because presentation choices (headings, section order, meta description)
are editorial decisions, not something this phase believes should be
inferred. Only after a second real topic goes through this pipeline
would there be any actual evidence about how well the generic
classification mechanism holds up outside hair-cycle — this document
does not pre-claim that result.

## What this phase does NOT do

No `/education` route was created. No sitemap change was made. No
`research_public_pages` row was modified (Page Builder has no write path
at all — no module in this set contains a `POST`/`PATCH`/`PUT`/`DELETE`
call, verified structurally by `tests/page-builder-v1.test.mjs`'s
`NO_PRODUCTION_WRITE_PATH` fixture). No Anthropic call was made. No
change to Rick/Harvester, Cadence, Stripe, auth, course, or student
systems.
