> **STATUS: EDITORIAL EXEMPLAR / OWNER REVIEW.** This document is NOT yet a
> permanent canonical brand document. It records what was tried, and why,
> on ONE page — `/education/hair-loss/hair-growth-cycle` — so the owner
> can review a concrete example before any of this becomes a reusable
> rule. It does not override, and is subordinate to,
> `docs/brand/AIMT-INSTITUTIONAL-POSITIONING.md`, which remains the
> canonical institutional authority.
>
> **This becomes the basis for an automated AIMT Education writing layer
> ONLY after owner approval of this first page.** Nothing here is wired
> into an automatic, unreviewed pipeline — see "Governance" below.

## Why this exists

The first hair-cycle Education page proved the evidence/clearance/Page
Builder pipeline works: a real cleared snapshot, integrity-checked,
validated, rendered. But the prose itself read like an assembly of
research statements — accurate, but not AIMT teaching.

`docs/brand/AIMT-INSTITUTIONAL-POSITIONING.md` says AIMT exists to change
how professionals learn, that depth should become more efficient (not
shallower), and that learning should lead to judgment, not just
information transfer. A page that just concatenates cleared statements
doesn't do that. This pass is a first, deliberately small attempt at
writing one page the way AIMT actually wants to teach — while keeping
every factual claim traceable to the governed cleared snapshot.

## The three-layer writing model

Every visible sentence on the page is exactly one of these:

### 1. Evidence-backed factual copy (VERBATIM or PARAPHRASE)

Statements about hair biology, timing, mechanisms, normal variation,
shedding. These always carry `supporting_claim_ids` traceable to the
cleared snapshot's `core_factual_points` / `limitations`, and always stay
inside `selected_claim_ids`.

- **VERBATIM** — the rendered text is byte-identical to its cleared
  statement. Still required wherever a statement carries a number or
  duration (`page-builder-validator.mjs`'s `UNSUPPORTED_NUMERIC_CLAIM`
  rule requires this — a paraphrased number is exactly the kind of drift
  that rule exists to catch).
- **PARAPHRASE** — a conservative, meaning-preserving rewrite. Never
  strengthens certainty, turns association into causation, invents a
  number, or introduces treatment/diagnosis language. Inherits the
  source statement's own `supporting_claim_ids` automatically (never
  hand-typed) so a paraphrase can never end up citing claims its source
  doesn't actually carry.

### 2. Editorial / teaching bridges (FRAMING)

Short, non-factual connective or interpretive writing — "Understanding
that baseline gives those observations context." These carry no
`supporting_claim_ids` and must never smuggle in a new scientific
assertion. They exist to create rhythm, transition, and "so what,"
between evidence-backed statements. Used sparingly — this page has 2–3
per section, not one per sentence.

### 3. Scope / limitations (protected)

The cleared `scope_note` and both cleared `limitations` statements. Not
touched in this pass at all — rendered exactly as they were before this
editorial exemplar (see "What was deliberately left alone" below).

## Worked example: "Why the hair growth cycle matters"

This was the specific section the owner flagged as answering "who is
this for" instead of "why does this matter."

**Before:**

> *This overview is designed for beauty and scalp-care professionals who
> want a clear reference for the normal hair-growth cycle, its stages,
> typical timing, and normal variation.*

(Framing only — no evidence, never actually answered the question.)

**After** (4 units — see `functions/_lib/page-builder/page-builder-template-registry.mjs`, `why_it_matters.units`):

1. **FRAMING** (unchanged): *"This overview is designed for beauty and
   scalp-care professionals who want a clear reference for the normal
   hair-growth cycle, its stages, typical timing, and normal
   variation."*
2. **PARAPHRASE**: *"Hair follicles don't move through the cycle in
   lockstep — each one progresses on its own timeline."*
3. **FRAMING**: *"Understanding that baseline gives those observations
   context."*
4. **PARAPHRASE**: *"That's exactly why distinguishing normal cycle
   variation from abnormal cycling is relevant for practitioners
   assessing scalp health — and why making that distinction depends on
   objective morphological criteria."*

Both paraphrase units (#2 and #4) derive from — and inherit the real
`supporting_claim_ids` of — the SAME single cleared statement:

> *"Because follicles cycle individually and asynchronously,
> distinguishing normal cycle variation from abnormal cycling requires
> attention to objective morphological criteria, which is relevant for
> practitioners assessing scalp health."*
> — claim IDs: `oh-guide-hf-cycling-2016--c02`, `oh-guide-hf-cycling-2016--c03`, `tan-lim-lay-hf-modelling-2024--c01`, `wang-piezo1-hfsc-quiescence-2025--c01`

Splitting one dense sentence into two teaching beats with a bridge
between them is a presentation choice, not two different facts — and the
editorial audit (below) checks that explicitly.

## What else changed, and why

**"The stages of the hair growth cycle"** — the numeric statement (3
years / 3 weeks / 3 months / 9%) stays **VERBATIM**, unparaphrased, by
design (numbers must stay maximally close to the cleared language). Two
FRAMING bridges were added: one explaining why the numbers are worth
knowing, one connecting "exogen" (shedding) back to the cycle as a
sequential arrival rather than a separate event — read directly off the
already-verbatim-displayed phase order in the answer_summary, not a new
claim.

**"What professionals should understand"** — both statements
(mechanism: stem cells / dermal papilla / signaling pathways; factors:
hormones, stress, nutrition, sleep, inflammation, blood flow) became
**PARAPHRASE**, restructured for plainer language ("conserved" → "core";
"cycling is driven by" → "that process is directed by") without dropping
a single named factor or pathway, and without adding a practice
implication the evidence doesn't support (see below).

## What was deliberately left alone

- **Scope callout and both limitation statements** — left **VERBATIM**,
  untouched. `page-builder-validator.mjs`'s `MISSING_REQUIRED_LIMITATION`
  rule requires the top-level `draft.limitations` field to match the
  cleared statements byte-for-byte, and this content is explicitly
  protected ("do not soften, hide, or creatively rewrite away"). Depth
  came from elsewhere on the page instead.
- **Key takeaways** — left verbatim. They're an explicit recap, meant to
  be scanned, not read as prose.
- **Sources section, hero, design, nav, footer** — untouched per the
  owner's explicit instruction to keep the established visual direction.

## Where evidence didn't support more depth

For "what professionals should understand," a natural next line would
connect the mechanism/factors evidence to something a practitioner does
in the treatment room. That line was deliberately NOT written: the
cleared mechanism/factors statements describe cellular/molecular drivers
that aren't themselves practitioner-observable, and inventing a practical
"so here's what to do with this" would have overstated what the evidence
actually licenses. Depth should come from explanation, not from
manufacturing relevance the evidence doesn't support — so this section
stays a clean explanation and stops there.

## Governance: why this isn't automated yet

Nothing in this pass makes Page Builder a general paraphrase system:

- The `{ units }` override shape in `page-builder-template-registry.mjs`
  is **opt-in per section**. A section without it is completely
  unaffected — still the original, fully generic, verbatim-only
  mechanism.
- `checkDraftFidelity()` (the deterministic fidelity checker) was **not
  weakened**. It correctly reports `REWRITE_REQUIRED` for every
  PARAPHRASE unit, because it has no way to prove a paraphrase's
  entailment deterministically — and it should not silently claim
  otherwise.
- A new, separate script,
  `scripts/page-builder-editorial-audit.mjs`, reconciles each unit's
  declared editorial status against that raw fidelity result and reports
  `EDITORIAL_REVIEW_REQUIRED` for an *expected* paraphrase mismatch,
  while still treating an unexpected mismatch on a VERBATIM or FRAMING
  unit as a real, build-failing problem. `scripts/page-builder-shadow.mjs`
  — the original, fully-automated shadow script — is untouched and would
  still correctly refuse (exit 1) to treat this page's paraphrase content
  as a clean, silent PASS.
- No Anthropic call is made anywhere in this pass. Every paraphrase here
  was hand-authored and hand-reviewed against the cleared snapshot, not
  generated or polished by a model.

## What the owner still needs to approve

1. Whether this voice — "evidence → explanation → meaning → practitioner
   context," with italicized framing bridges distinguishing editorial
   voice from evidence — is the right AIMT Education voice going forward.
2. Whether the specific paraphrases in "why it matters" and "what
   professionals should understand" read as genuinely more useful without
   overstating the evidence.
3. Whether the `{ kind: 'framing' | 'verbatim' | 'paraphrase' }` template
   mechanism (opt-in, per-section, hand-authored) is an acceptable
   foundation to eventually generalize — with real safeguards (a
   real entailment check, likely model-assisted, replacing today's
   hand-review) — into a second topic, once one exists.
