# AIMT Automated Publication Clearance — the AUTO_READY → Page Builder bridge

Status: **shadow/preview only in this phase**. No production write has been
performed. No public page exists. No `research_public_pages` row has been
persisted. This document describes a write path that has been built and
tested, but not yet exercised against production, and not yet authorized
to be.

## What this is

Publication Editor v1 (topic readiness) and v2/v2.1 (AI synthesis +
deterministic validation + bounded reconciliation) produce a **shadow-only
reporting label** (`AUTO_READY` / `HUMAN_REVIEW` / `SYNTHESIS_FAILED`) and,
for `AUTO_READY`, a **page evidence brief** — but neither persists
anything. This layer answers the next question: *how does AIMT truthfully
record that one specific page's evidence brief passed the automated
publication standard*, without ever implying a human set `AIMT_APPROVED`?

## Step 1 findings: does the existing schema already support this?

Inspected before writing any migration: `supabase/migrations/
20260920_create_research_library.sql`, `research_public_pages`'s columns/
constraints/RLS, `functions/api/research-query.js`, and Publication
Editor v1/v2's evidence-brief output shape.

**1. Can `research_public_pages` already represent page-level automated
clearance truthfully, with no schema change?** No. It has exactly the
fields a clearance record's *content* needs (see reuse table below), but
nothing on it distinguishes *how* a page's evidence was cleared —
automated vs. human — which is the entire point of this phase. Writing
into the existing columns alone would be truthful about content but
silent about provenance, which is not honest enough for a governance
bridge.

**2. Are any existing constraints actually blocking a page from being
generated from `CLAIM_VERIFIED` + `AUTO_READY` evidence?** No. The table
has no constraint that requires `AIMT_APPROVED`, human review, or
anything upstream before a row can exist — its only hard constraint is
`published` requires `published_at`, and this phase never sets either.
`status`'s CHECK constraint is the only thing that needed *widening*
(never weakening — see below), because none of its five existing values
(`draft`, `in_review`, `approved`, `published`, `archived`) accurately
names "an automated pipeline believes this is ready for the next stage,"
and no honest description of the truth could give a page-level clearance
record.

**3. Which constraints are claim-level vs. page-level?**
`research_claims`/`research_sources`'s `verification_status`,
`public_eligible`, `published`, and `AIMT_APPROVED`-gating constraints
(`research_claims_public_requires_approved`, etc.) are **claim-level** —
untouched by this migration, still exactly as strict as before.
`research_public_pages`'s `status`/`published`/`published_at` constraints
are **page-level** — this is the only table this migration touches.

## Governance principle (preserved, not weakened)

| Signal | Meaning | Who/what sets it |
|---|---|---|
| `CLAIM_VERIFIED` | Rick/Harvester verified this claim against its source. | Automated (Rick), unchanged |
| `AIMT_APPROVED` | Explicit human AIMT approval, claim/source-level. | **Human only**, unchanged |
| `AUTO_READY` (v2) | Publication Editor v1+v2 synthesis + deterministic validator passed for one page evidence brief. | Automated, shadow-only, unchanged |
| `clearance_mode = 'AUTO_READY'` (this phase) | The above, now recorded at the page level. | Automated — **never** aliased to or capable of setting `AIMT_APPROVED` |
| `clearance_mode = 'HUMAN_APPROVED'` | A human explicitly reviewed and approved this page's evidence. | **Human only** — no code in this repo can set this value; it exists in the CHECK constraint for a future human-authenticated path only |

`functions/_lib/research/publication-clearance.mjs`'s only entry point,
`buildAutoReadyClearanceRecord()`, has no parameter that can request
`HUMAN_APPROVED` or touch `research_claims`/`research_sources` at all —
it has no reference to either table.

## Fields reused vs. added

| Need | Reused existing field | New field |
|---|---|---|
| Page/topic slug | `topic_slug` (PK) | |
| Public-page concept | `summary_markdown`, `practitioner_relevance_markdown` (derived from the brief) | |
| Selected claim IDs | `key_claim_ids text[]` | |
| Source IDs | `source_ids text[]` | |
| Core factual points | `summary_markdown` (rendered as a bulleted list) | |
| Limitations | `limitations_markdown` (rendered as a bulleted list) | |
| Scope language | `practitioner_relevance_markdown` (scope_note) | |
| Evidence brief fingerprint | `generation_source_hash text` (already existed, unused until now — exactly the field this need was for) | |
| Last generated timestamp | `last_generated_at` | |
| Status / lifecycle | `status` (existing CHECK **widened**, never weakened, to add `'ready_for_page_builder'`) | |
| Clearance mode (automated vs. human) | — nothing existing captured this | **`clearance_mode text`** + CHECK (`AUTO_READY`/`HUMAN_APPROVED`/`HUMAN_REVIEW_REQUIRED`/`NULL`) |
| Excluded claims + reasons, citation map, scope include/exclude, risk tier, engine/model/validator versions, candidate/source counts | — no existing column fits a structured payload like this | **`publication_clearance jsonb`** (not `structured_data`, which is reserved for a future page's own JSON-LD/schema.org markup — a different concern; see the migration's own comment) |

Migration: `supabase/migrations/20260923_add_publication_clearance_fields.sql`.
Additive only — two new columns, one CHECK constraint added, one CHECK
constraint widened (values added, none removed). Must be run manually in
the Supabase SQL editor, same as every other migration in this repo;
committing it does not execute it.

## Page-level clearance model

One clearance record = one `research_public_pages` row, keyed on
`topic_slug` (already a page-*specific* concept in Publication Editor's
own registries — see `publication-readiness-loader.mjs#PILOT_TOPIC_CONCEPTS`
and `publication-page-intent.mjs#PAGE_SYNTHESIS_INTENT` — not every claim
in a topic globally). This is deliberate: the AI Publication Editor does
not approve every claim in a topic for public use, it curates a
page-specific subset (hair-cycle's real pilot: 20 of 128 candidate claims
selected). Clearing every underlying claim would misrepresent what
actually earned trust; clearing the page's evidence brief is the honest
claim.

`functions/_lib/research/publication-clearance.mjs#buildAutoReadyClearanceRecord()`
is the only place this shape is decided. It:
- Refuses (`ClearanceIneligibleError`) for anything other than a
  validated `AUTO_READY` pipeline result.
- Refuses for `risk_tier: HIGH` even if a caller somehow claims
  `AUTO_READY` (defense in depth — structurally shouldn't happen, but
  never trusted blindly).
- Self-checks its own output against `FORBIDDEN_CLEARANCE_FIELDS`
  (`published`, `published_at`, `sitemap_eligible`,
  `aimt_reviewed_by`/`_on`/`_notes`, `public_eligible`,
  `verification_status`, `AIMT_APPROVED`) before returning — a future
  edit that accidentally introduces one of these fails loudly.

## Fingerprint design

`functions/_lib/research/publication-clearance-fingerprint.mjs` — pure,
Web Crypto (`crypto.subtle.digest('SHA-256', …)`, matching this repo's
"Web Crypto + fetch only" convention, e.g. `stripe-webhook.js`'s signature
verification), so the identical function runs in a Node script or a
Cloudflare Function without a dependency.

Per the CRITICAL FINGERPRINT RULE: the hash covers **exactly** six
materially-relevant categories, extracted into a canonical object before
hashing — `risk_tier`, `selected_claim_ids` (sorted), `core_factual_points`
(each `{statement, supporting_claim_ids}`, array sorted by its own
canonical JSON so point *order* doesn't matter), `limitations` (same
treatment), `citation_map` (recursively key-sorted), `source_ids`
(sorted). Everything else on a brief — `review_timestamp`, `provenance`
(model/version metadata), `page_concept`/`public_intent` prose, excluded-
claim *reasons* — is deliberately excluded, which is also what makes two
semantically-identical briefs with reordered or extra fields hash
identically (tested directly:
`FINGERPRINT_IGNORES_IRRELEVANT` in `tests/research-publication-clearance.test.mjs`).

**Known limitation, stated rather than papered over:** a synthesis MODEL
or VERSION change alone does not move the fingerprint, only a change in
evidence content. Per the originating request's own instruction to
distinguish enforceable-now from speculative, this is not implemented —
nothing in the current brief shape marks a model/version change as
materially relevant on its own, and inventing that rule now would be
speculative.

## Invalidation rules

**Enforceable now**, via `isClearanceStale(brief, storedFingerprint)`:
recomputes the fingerprint from a freshly-generated brief and compares —
any of the six categories changing (a claim superseded/excluded changing
`selected_claim_ids`, a citation correction changing `citation_map`, a
new safety claim changing which claims got selected/excluded, a risk
reclassification changing `risk_tier`, a source set change) makes the
stored fingerprint stale, detected mechanically, not by inference.

**Not enforceable yet, named rather than guessed at:**
- *A selected source becomes retracted/unavailable* — no existing
  `research_sources` field marks this today (`use_status` has
  `superseded`/`excluded`, which already flow through v1's own candidacy
  filter and would already change `selected_claim_ids` on regeneration —
  but there is no dedicated "retracted" signal to watch for
  independently of regenerating the brief).
- *Automatic re-triggering of Publication Editor on claim change* — this
  phase adds no schedule and no trigger (explicitly out of scope). Re-
  checking staleness today means re-running the CLI and comparing
  fingerprints by hand.

## Write path

`functions/_lib/research/publication-clearance-writer.mjs` — the only I/O
in this feature. Upserts (PostgREST `POST` + `Prefer: resolution=merge-
duplicates`) to `research_public_pages` only, keyed on `topic_slug`.
Security properties, enforced in code:
- `ALLOWED_COLUMNS` is a strict allow-list; any other key present on the
  record throws before any network call (`assertWritableClearanceRecord`,
  directly unit-tested with a tampered record).
- `status` may only ever be `'ready_for_page_builder'` from this path —
  attempting `'published'` throws, and `'published'`/`'published_at'`/
  `'sitemap_eligible'` aren't even in `ALLOWED_COLUMNS`.
- Requires `SUPABASE_SERVICE_ROLE_KEY`. No Cloudflare Pages Function
  wraps this — like Publication Editor v1/v2, it is invoked only from a
  local CLI script
  (`scripts/research-publication-clearance-shadow.mjs`), never reachable
  from any route, anonymous or otherwise. No client-side Supabase key is
  ever used.

`scripts/research-publication-clearance-shadow.mjs` runs the full v1→v2.1
pipeline, and only if it reaches `AUTO_READY`, builds and **prints** the
exact record (default: preview only). `--write` performs the actual
upsert — never invoked automatically, and per the originating request,
not exercised against production without explicit, separate owner
authorization obtained in conversation first.

## Hair-cycle pilot preview (2026-09-23)

Ran the full pipeline against the local validated export (identical to
production, per Publication Editor v2's own pilot findings). Result:
`AUTO_READY` on the initial synthesis alone (no reconciliation needed
this run — LLM output naturally varies run to run; a prior live run
needed one reconciliation call for the same topic, this one didn't).

- 20 of 128 candidate claims selected; 108 excluded with individual
  reasons (treatment/intervention content, unrelated conditions,
  molecular detail beyond practitioner scope, duplicates).
- 8 sources cited, complete citation metadata for each.
- 6 core factual points, 1 limitation (mouse-model/narrative-review
  evidence-base caveat).
- Fingerprint: `9899babb9aed2aeb13569cd28e0456f287affaa13a231636b95253f17e61d9c6`.
- `clearance_mode: 'AUTO_READY'`, `status: 'ready_for_page_builder'`.
- **Not written.** Preview only, per this phase's own scope.

## Recommended Page Builder phase

Once the migration is applied and a real clearance write is authorized:
a Page Builder would read `research_public_pages` rows where
`clearance_mode = 'AUTO_READY'` and `status = 'ready_for_page_builder'`,
draft actual page copy from `key_claim_ids`/`publication_clearance`'s
citation map/scope language, and — critically — still require a human to
review the drafted page and move `key_claim_ids`' underlying claims to
`AIMT_APPROVED`/`public_eligible` before `status` could ever become
`published`. This phase does not build that; it only makes the handoff
point honest and auditable.
