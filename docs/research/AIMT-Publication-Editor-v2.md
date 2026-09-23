# AIMT Publication Editor v2 — AI Synthesis + Deterministic Validation

Status: **shadow mode / dry-run only**. Nothing described in this document
publishes anything, approves anything, or writes to the database.

Scope of this pilot: **hair-cycle only**. The other five v1 pilot concepts
(hair-loss, shedding-vs-hair-loss, androgenetic-alopecia, telogen-effluvium,
alopecia-areata) are deliberately not wired into v2 yet — see
"Why hair-cycle first" below.

## Architecture

```
Rick / AIMT-Research-Harvester
  → CLAIM_VERIFIED research (research_claims / research_sources)
  → Publication Editor v1 deterministic gate (docs/research/AIMT-Publication-Editor-v1.md)
  → NEEDS_SYNTHESIS  ─────────────────────────────────────────────┐
                                                                    │
  Publication Editor v2 (this document):                           │
    1. synthesis evidence loader   ← resolves v1's synthesis_packet IDs
       (publication-synthesis-evidence.mjs)     into real claim/source content
    2. AI synthesis client         → one Anthropic Messages API call,
       (publication-synthesis-client.mjs)         strict JSON-schema output
    3. deterministic post-synthesis validator    → mechanically checks the
       (publication-synthesis-validator.mjs)        AI's proposal against the
                                                      same evidence bundle
  → AUTO_READY | HUMAN_REVIEW | SYNTHESIS_FAILED  (shadow-only labels)
```

Every arrow above is one-directional and read-only with respect to AIMT's
data: v1 and v2 both only ever *read* `research_claims`/`research_sources`
(via the same read-only loader v1 already uses,
`publication-readiness-loader.mjs`), and v2's own network call (to
Anthropic) writes nothing to any AIMT system — it returns a proposal that
the validator then either certifies or rejects.

## Model used

**Provider:** Anthropic. **Model:** `claude-sonnet-5`, registered as
`CANDIDATE` (not `APPROVED`) in a new, isolated registry:
`functions/_lib/research/publication-editor-model-config.mjs`.

**Credential:** `ANTHROPIC_PUBLICATION_EDITOR_API_KEY` — a dedicated key,
separate from Cadence's own `ANTHROPIC_API_KEY`. `publication-synthesis-
client.mjs` never reads or falls back to Cadence's credential; a missing
`ANTHROPIC_PUBLICATION_EDITOR_API_KEY` fails safe to `SYNTHESIS_FAILED`
(see "Failure behavior" below), it never silently borrows another
subsystem's key.

### Step 1 finding: existing model infrastructure

This repo already has a mature model-lifecycle system for Cadence
(`functions/_lib/cadence/model-config.mjs`) — `resolveCadenceModel()`,
an `APPROVED`/`CANDIDATE`/`LEGACY`/`RETIRED` lifecycle, an env-override
mechanism, and a fail-safe default (refuses to run with no `APPROVED`
model). It is **not reused directly**: its two roles
(`CADENCE_CHAT_MODEL`, `CADENCE_GRADING_MODEL`) are Cadence-specific, the
module lives under `functions/_lib/cadence/`, and this task's explicit
instruction is not to touch Cadence. Per the task's own fallback
instruction, `publication-editor-model-config.mjs` is "the smallest
isolated adapter": it borrows the *same governance shape* (explicit
lifecycle, fail-safe on an unregistered override) without importing
anything from `functions/_lib/cadence/*`.

What **is** reused, read-only, from `functions/_lib/cadence/
anthropic-response.mjs` — generic Anthropic Messages API HTTP utilities
with zero Cadence business logic in them:
- `fetchAnthropicMessages()` — POST with a small bounded retry (2 extra
  attempts) on a retryable 5xx-class status, never retrying a 4xx.
- `extractAnthropicTextSafe()` — content-block-safe text extraction
  (never assumes the first content block is the text block).

Also reused: the **structured-outputs pattern**
(`output_config: { effort, format: { type: 'json_schema', schema } }`)
already established in `functions/_lib/cadence/checkpoint-evaluation.mjs`
for grading — a stricter, better mechanism than the older prompt+regex
JSON extraction in `functions/_lib/certification/cadence-grader.mjs`. v2
uses the newer pattern throughout.

**Why the default resolution differs from Cadence's:** Cadence roles
serve real student-facing traffic, so `resolveCadenceModel()` refuses to
run at all without a completed, recorded `APPROVED` promotion.
Publication Editor v2 is shadow-mode only — nothing it produces is ever
served to a student or the public — so requiring a full production
validation program before this shadow tool could even run would block
the exact pilot this task exists to perform.
`resolvePublicationEditorSynthesisModel()` therefore defaults to the
registered `CANDIDATE` directly (always clearly labeled as such in every
result), while still failing hard on an unregistered env override — the
same "no silent latest-model drift" property, without the "must already
be approved" gate that only makes sense for production traffic.

## Input evidence boundaries

The AI synthesis layer never sees the wider research corpus — only the
minimum evidence bundle `publication-synthesis-evidence.mjs`'s
`buildSynthesisEvidenceBundle()` resolves from v1's own
`synthesis_packet.candidate_claim_ids`/`candidate_source_ids`:

- **Never** a claim below `CLAIM_VERIFIED` (v1 already filtered these out
  before the packet was built).
- **Never** an `excluded`/`superseded` claim (same v1 candidacy filter).
- **Never** material from a different topic that merely resembles this
  one — only claims v1 already scoped to this concept's
  `controlled_topics`.

Per claim, the model receives: `claim_id`, `claim_text` (the actual
verified content — not a paraphrase or summary), `source_id`,
`claim_type`, `direction`, `population_or_scope`,
`page_or_section_locator`, `claim_origin`, `verification_status`,
`use_status`. Per source: `source_id`, `title`, `authors`, `year`,
`date_published`, `source_venue`, `doi`, `pmid`, `pmcid`, `url`,
`evidence_type`, `source_role`. Deliberately **not** forwarded:
`research_sources.verification_notes` (Rick's internal verification
methodology, not page-relevant evidence content) and any raw
`body_markdown`/`body_sections`/`extras` — the model gets exactly the
structured fields listed above, never the full internal record.

## Page-specific synthesis, not topic summarization

`publication-page-intent.mjs` registers what a specific page is actually
*for*, separate from v1's topic→controlled-topics mapping. For hair-cycle:

- **In scope:** follicular cycling (anagen/catagen/telogen/exogen where
  supported), the normal shedding relationship and typical timing,
  practical educational meaning, limitations and normal variation.
- **Out of scope:** treatment efficacy, medication effectiveness (e.g.
  minoxidil), PRP, LLLT, other cosmetic actives, therapeutic comparisons,
  disease treatment or diagnosis.

The system prompt (`publication-synthesis-schema.mjs#buildSynthesisInstruction`)
explicitly tells the model that an out-of-scope claim sharing the topic
tag is not automatically a contradiction of the page's subject matter —
but it is instructed to reach that conclusion from what each claim
actually says, never to assume it in advance. Only `hair-cycle` is
registered; the other five pilot concepts are intentionally not wired up
yet (see "Why hair-cycle first").

## Structured-output contract

`functions/_lib/research/publication-synthesis-schema.mjs` defines
`SYNTHESIS_OUTPUT_JSON_SCHEMA`, sent as `output_config.format` on the
Anthropic call — kept to the same documented supported subset
`checkpoint-evaluation.mjs` already uses (basic types, enum/anyOf,
`additionalProperties: false`; no `minLength`/numeric constraints, no
recursive `$ref`). Top-level shape:

```
{
  topic_slug, page_concept,
  recommended_disposition: "AUTO_READY" | "HUMAN_REVIEW",
  confidence: "high" | "medium" | "low",
  page_scope: { include: [string], exclude: [string] },
  selected_claims: [{ claim_id, role: "core_finding"|"supporting_context"|"limitation", reason }],
  excluded_claims: [{ claim_id, reason_code: <enum>, reason }],
  resolved_synthesis_signals: [{ signal, resolution, claim_ids: [string] }],
  unresolved_issues: [string],
  public_framing: {
    core_points: [{ statement, supporting_claim_ids: [string] }],
    limitations: [{ statement, supporting_claim_ids: [string] }],
    scope_note: string
  }
}
```

No `claim_id`/`source_id` enum is embedded in the schema itself (the
candidate set differs per run) — the JSON Schema's job is shape; the
deterministic validator's job is grounding every ID against the real
evidence bundle.

## Validator rules

`functions/_lib/research/publication-synthesis-validator.mjs` is pure —
zero I/O, zero model calls — and treats the AI's output as an untrusted
proposal. `validateSchemaShape()` runs first (independent of and prior to
any semantic check); a shape failure short-circuits straight to
`SYNTHESIS_FAILED`, never reaching the rules below. `validateSynthesisSemantics()`
then mechanically checks:

1. Every `selected_claims[].claim_id` exists in the evidence bundle.
2. Every `excluded_claims[].claim_id` exists in the evidence bundle.
3. Every selected claim still meets v1's own candidacy rule
   (`CLAIM_VERIFIED`-or-better, not `excluded`/`superseded`) — re-checked
   against the bundle record, not trusted from the model's selection.
4. Every claim in the evidence bundle is disposed **exactly once**
   (selected XOR excluded) — nothing silently unaccounted for, nothing
   double-counted.
5. Every `supporting_claim_id` in a core point or limitation exists in the
   bundle **and** was actually selected.
6. Every core point has at least one supporting claim.
7. Every selected claim's cited source resolves to a real, citeable
   record in the bundle (reuses v1's own `hasSufficientCitationMetadata()`
   — exported, not duplicated, so the two checks can never silently
   drift apart).
8. At least one genuine limitation (backed by a claim whose own
   `claim_type` is `'limitation'`) is preserved in `public_framing.limitations`.
9. No `unresolved_issues` entry may coexist with `recommended_disposition: AUTO_READY`.
10. All of v1's own evidence-completeness requirements still hold
    (`evidence_gaps` empty) — a defense-in-depth re-check, since a topic
    with any gap should never have reached `NEEDS_SYNTHESIS` in the first
    place.
11. An excluded claim can never resurface as a `supporting_claim_id`
    anywhere in `public_framing` — the specific rule this pilot exists to
    exercise (a treatment-effect claim marked excluded must not quietly
    reappear as public support).
12. A v1 result that is not itself `NEEDS_SYNTHESIS` can never produce a
    validated proposal — v2 cannot elevate a `HUMAN_REVIEW` (or any other)
    v1 result.
13. `risk_tier: HIGH` can never validate as `AUTO_READY`-eligible,
    regardless of what the model proposed (checked twice, independently,
    for a HIGH-risk topic and for a HIGH-risk topic baked into the
    packet's own `controlled_topics`).
14. `AUTO_READY` requires at least one `core_points` entry — a page needs
    something to be built from.
15. If v1's packet declared a synthesis-required flag (a safety claim or a
    direction split), the model must have addressed it in
    `resolved_synthesis_signals` — silently ignoring a declared signal is
    itself a violation, not an implicit pass.

`determineShadowDisposition()` maps validation results to one of the
three shadow-only outcomes (see below) — it is the only place that
decision is made, and it is a pure function of `{v1Result, callFailed,
aiOutput, validation}`, never of the model's own stated confidence alone.

## AUTO_READY meaning

`AUTO_READY` is a **shadow-mode reporting label only**. It means: *the v1
deterministic gate, the AI synthesis proposal, and the deterministic
post-synthesis validator all passed, and this LOWER/MODERATE topic would
be eligible for the next autonomous page-generation stage.* It does
**not** set `AIMT_APPROVED`, `public_eligible`, or `published` on any row,
and does not create a `research_public_pages` row. It is never persisted
to any production table — it exists only in this run's JSON report under
gitignored `research-import/`.

## HUMAN_REVIEW behavior

`HUMAN_REVIEW` here means the same thing it means in v1: a genuine
exception, not the default outcome of ordinary synthesis. In v2 it is
reached when: the model itself declares `recommended_disposition:
HUMAN_REVIEW` (it could not resolve something safely), the validator
finds any of the 15 violations above, the underlying `v1Result.risk_tier`
is `HIGH`, or the underlying v1 result was not actually `NEEDS_SYNTHESIS`.

## Failure behavior (STEP 12)

Every one of these maps to `SYNTHESIS_FAILED`, never a silent
`AUTO_READY`, and never a crash of the CLI script:

- Missing `ANTHROPIC_PUBLICATION_EDITOR_API_KEY` (`publication-synthesis-client.mjs` returns
  a tagged failure rather than throwing).
- A transport/HTTP failure from Anthropic (after `fetchAnthropicMessages`'s
  own bounded retry is exhausted).
- `stop_reason: max_tokens` — a truncated response, explicitly checked
  before attempting to parse it.
- Unparseable JSON (direct parse, then one fenced-block fallback, then
  fail safe — same defensive order as `checkpoint-evaluation.mjs`'s
  `parseCheckpointEvaluation()`).
- A structurally invalid schema (missing required fields, wrong enum
  value, wrong type) — `validateSchemaShape()` fails before any semantic
  check runs.

A validator rejection (structurally valid JSON, but a grounding violation
— e.g. a hallucinated claim ID) is **not** `SYNTHESIS_FAILED`: the model
did produce a usable, parseable structured decision, it just was not
trustworthy, which is exactly what `HUMAN_REVIEW` is for.

## Zero-write shadow guarantee

- The evidence loader and bundle builder are read-only/pure — same
  guarantee as v1 (`publication-readiness-loader.mjs`,
  `publication-synthesis-evidence.mjs`).
- The validator is pure — zero I/O, zero model calls
  (`publication-synthesis-validator.mjs`).
- The only network call that is not a Supabase `SELECT` is the one
  Anthropic Messages API call per run, which itself writes nothing to any
  AIMT system.
- The CLI reports `write_operations_performed: 0` in its own JSON output.
- No new Cloudflare Pages Function, schedule, or public route was added.

## How v2 plugs into the future Page Builder

An `AUTO_READY` result's **page evidence brief**
(`publication-synthesis-evidence.mjs#buildPageEvidenceBrief`) is the
package a future Page Builder would consume — not the public page itself.
It contains: the page concept and public intent, the approved-for-draft
claim IDs, the excluded claim IDs with reasons, the source IDs actually
used, the core factual points and limitations (each already
claim-grounded), scope language, a citation map, a review timestamp, the
risk tier, and full provenance (v1 engine version, synthesis model +
registry status, validator version). A Page Builder (not built here)
would still need a human to actually promote the underlying claims/
sources to `AIMT_APPROVED`/`public_eligible` before drafting a
`research_public_pages` row — this brief only tells it *what* the
evidence supports, it grants no permission of its own.

## Why this does not replace Rick

Rick (AIMT-Research-Harvester) answers "is this claim's wording faithful
to its own source?" — a claim-level, source-fidelity question. v1 answers
a topic-level readiness question. v2 answers a page-level "what should
this specific page say, and does it check out?" question. All three read
the same trust ladder (`DISCOVERED → SOURCE_VERIFIED → CLAIM_VERIFIED →
AIMT_APPROVED`); none of them writes to it. v2 in particular never
touches `verification_status`, never promotes a claim, and never gives
the AI synthesis layer editorial authority over Rick's own fidelity
judgment — it only decides, after the fact, which already-verified claims
are relevant to one page and whether that selection holds up.

## Why this does not yet publish anything

No code path in v1 or v2 writes `AIMT_APPROVED`, `public_eligible`, or
`published`, creates a `research_public_pages` row, or serves an
`/education` route. `AUTO_READY` is a shadow-only label that a human
still has to act on through a separate, not-yet-built process (the future
Page Builder plus an actual editorial approval step) before anything
becomes public. This is deliberate, per the same principle v1 already
documents: **evidence must earn its way into education**, and "an AI
synthesis layer resolved this cleanly" is not the same thing as "AIMT
approved this for the public."

## Why hair-cycle first

Per this task's explicit scope: hair-cycle is v1's only LOWER-risk pilot
concept, has the strongest corroboration (27 sources, systematic-tier
evidence present), and its only synthesis signal is a direction split
with no safety claim involved (see
`docs/research/AIMT-Publication-Editor-v1-Pilot.md`) — the architecture
is proven on the safest, closest-to-ready topic before it is ever pointed
at a topic carrying a `safety_conclusion` claim.

## Pilot result (2026-09-23, live production, read-only)

Ran against the live production corpus (`--live`; GET/SELECT only, 0
writes) using a dedicated `ANTHROPIC_PUBLICATION_EDITOR_API_KEY`. v1
returned `NEEDS_SYNTHESIS` (128 candidate claims, 27 sources, LOWER risk).
The evidence loader initially sent the model claim metadata with
`claim_text` empty for every claim — a real gap in v1's shared live-fetch
field list (`CLAIM_SELECT_FIELDS` never needed `claim_text`/
`page_or_section_locator` for its own deterministic checks, so it never
selected them). Fixed by widening that field list (additive only, no v1
behavior change — 65/65 v1 tests still pass); the model's own response to
the missing text on the first attempt was to correctly decline to
proceed with confidence rather than guess, which is itself a small
validation of the "never fabricate certainty" instruction.

With real claim text in the bundle, one full, successful synthesis run
produced: `recommended_disposition: AUTO_READY`, `confidence: high`, 23
claims selected, 103 excluded, zero `unresolved_issues`, 8 grounded core
points about follicle phases/timing/anatomy, 2 preserved limitations
(mouse-model-to-human translation caveat; narrative-review, not
treatment-evaluation, evidence base), and a `resolved_synthesis_signals`
entry that directly answers the pilot's key question (see below).

**The deterministic validator still rejected it**, for exactly one reason:
2 of the 128 candidate claims never appeared in either `selected_claims`
or `excluded_claims` — a full-accounting gap the model's own stated "high
confidence" gave no indication of. Final shadow result: **`HUMAN_REVIEW`**
(`validator_rejected_proposal`), not `AUTO_READY` — the exact behavior
this architecture exists to guarantee: the model's self-reported
confidence is never the thing that decides.

**The 6 supports_effect / 1 no_effect question, answered from evidence:**
the synthesis identified that these claims describe entirely different
interventions and endpoints — PRP, scalp massage, GLP-1 receptor
agonists, and antimitotic medications — with directionally opposite
effects on hair from each other, not from any disagreement about normal
cycle biology. All were excluded from the hair-cycle page as out-of-scope
treatment/medication material (answer **B** from the task's own A/B/C
framing), not reconciled as an on-page contradiction.

**Recommended v2 follow-up** (not implemented here): a token-budget note
— two rounds of live tuning were needed (`max_tokens` 16000 → 32000 →
64000) before a 128-claim bundle stopped truncating, since adaptive
thinking and per-claim reasoning both draw from the same ceiling; and a
process note — a "did every candidate claim_id receive a disposition?"
reconciliation pass (either a stricter prompt reminder or a targeted
follow-up turn naming exactly the missing IDs) could resolve this
specific near-miss automatically, rather than routing an otherwise
high-quality, 126/128-complete proposal to human review over 2 stragglers.

## Files

- `functions/_lib/research/publication-editor-model-config.mjs` — isolated
  model registry/resolver (see "Model used").
- `functions/_lib/research/publication-page-intent.mjs` — page-specific
  synthesis intent registry (hair-cycle only).
- `functions/_lib/research/publication-synthesis-schema.mjs` — structured
  JSON Schema output contract + system-prompt builder.
- `functions/_lib/research/publication-synthesis-evidence.mjs` — pure
  evidence bundle builder (Step 2) + page evidence brief builder (Step 10).
- `functions/_lib/research/publication-synthesis-client.mjs` — the one I/O
  module; calls Anthropic, never decides a disposition itself.
- `functions/_lib/research/publication-synthesis-validator.mjs` — pure
  deterministic post-synthesis validator (Step 6) + shadow disposition
  mapper (Step 7).
- `scripts/research-publication-editor-v2-shadow.mjs` — CLI orchestrator
  for the hair-cycle pilot.
- `tests/research-publication-synthesis-validator.test.mjs` — synthetic-
  fixture unit tests, no live/model calls.

Generated run reports follow the same policy as v1: runtime artifacts
under gitignored `research-import/`, never committed. See
`docs/research/AIMT-Publication-Editor-v1.md`'s "Generated artifacts are
runtime output, not version-controlled state" section, which applies
identically here.
