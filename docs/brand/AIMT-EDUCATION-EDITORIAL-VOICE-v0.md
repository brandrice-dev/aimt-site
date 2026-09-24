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
per section, not one per sentence. **See "Framing is not a loophole"
below — a framing unit must be removable from the page without changing
its scientific meaning.**

### 3. Scope / limitations (protected)

The cleared `scope_note` and both cleared `limitations` statements. Not
touched in this pass at all — rendered exactly as they were before this
editorial exemplar (see "What was deliberately left alone" below).

## Framing is not a loophole

The first version of this exemplar treated "no `supporting_claim_ids`"
as sufficient proof a sentence was safe framing. It wasn't. Two of the
original framing bridges quietly restated or introduced scientific
content — accurate content, but content that should have been VERBATIM
or PARAPHRASE (with real claim IDs and a traceable source statement), not
a sentence exempt from every claim/fidelity check that governs the rest
of the page.

**The rule: a FRAMING unit must be removable from the page without
changing its scientific meaning.** Read the page with that sentence
deleted. If nothing scientific is lost, it was framing. If something is
lost, it wasn't.

A FRAMING unit may:

- orient the reader
- create rhythm
- introduce a question
- signal why the next material is useful
- create emphasis
- connect sections editorially

A FRAMING unit may **not** introduce or summarize:

- a biological fact
- a physiological sequence
- timing or duration
- a mechanism
- a causal relationship
- a prevalence or percentage
- a diagnostic or treatment implication
- any other claim that would need evidence if it stood alone

**Two corrections made under this rule** (Owner Correction Pass, after
the first version of this exemplar):

1. The original "stages" lead-in — *"Each of those phases has a typical
   length, and the numbers below are worth knowing — they set the
   baseline for what normal actually looks like."* — restated a factual
   idea ("each phase has a typical length") on its own. Deleting it would
   have deleted a (mild, but real) scientific claim. Replaced with *"The
   numbers matter because they give the cycle scale"* — this motivates
   the numbers that follow without itself stating one.
2. The original "stages" closing bridge — *"Exogen — the shedding phase
   — isn't a separate event. It's simply where the cycle arrives once a
   follicle has moved through telogen."* — asserted a sequence/mechanism
   claim (exogen follows telogen) beyond what the TIMING statement itself
   supports. **Removed outright, not paraphrased** — the evidence
   available doesn't cleanly support turning it into a claim-backed
   PARAPHRASE either, and the hero's answer_summary already identifies
   exogen as shedding of the old hair, which is sufficient for this page.
3. The original "for-professionals" lead-in — *"Here's what actually
   drives that cycle, and what can shift its timing."* — was too close to
   a summary of the two evidence paragraphs that immediately follow it.
   Replaced with *"The cycle is more than a timetable"* — orients the
   reader toward mechanism without pre-stating it.

This is a **human editorial judgment call**, not a deterministic check —
`checkDraftFidelity()` cannot detect a framing unit that smuggles in
science, because it exempts `is_framing: true` units from inspection
entirely by design. `scripts/page-builder-editorial-audit.mjs` now
reports every FRAMING unit as `FRAMING_REQUIRES_EDITORIAL_REVIEW`
(distinct from VERBATIM's deterministic `OK`) precisely so this can never
be mistaken for an automated proof.

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
design (numbers must stay maximally close to the cleared language). One
FRAMING lead-in motivates why the numbers are worth knowing without
itself stating a fact (*"The numbers matter because they give the cycle
scale."*). The section's original closing bridge about exogen/shedding
was removed under the framing rule above, not replaced — see "Framing is
not a loophole."

**"What professionals should understand"** — both statements
(mechanism: stem cells / dermal papilla / signaling pathways; factors:
hormones, stress, nutrition, sleep, inflammation, blood flow) became
**PARAPHRASE**, restructured for plainer language ("conserved" → "core";
"cycling is driven by" → "that process is directed by") without dropping
a single named factor or pathway, and without adding a practice
implication the evidence doesn't support (see below). Its FRAMING
lead-in was corrected under the framing rule — see "Framing is not a
loophole."

## Style direction that worked

Captured from this page for reuse, independent of the specific
sentences:

- Concise teaching bridges — one sentence, rarely two.
- Natural contractions are acceptable ("don't," "isn't," "here's") —
  AIMT Education voice is not a journal abstract.
- Short emphasis sentences are acceptable ("That distinction matters."),
  used sparingly.
- Practitioner relevance should be **explained**, not merely announced —
  don't just say a fact "is relevant to practitioners," say why.
- Evidence paragraphs do not need to sound like journal abstracts even
  when they stay VERBATIM or close-PARAPHRASE — plain-language synonyms
  ("core" for "conserved") are fine as long as the underlying claim is
  unchanged.
- Personality must sit **around** evidence, or faithfully **rephrase**
  it — it must never **replace** evidence's boundaries. A confident,
  warm sentence that quietly drops a limitation, hedges an uncertainty
  into certainty, or states a fact standing alone with no claim ID is not
  "voice" — it's drift, and the framing rule above exists specifically to
  catch it.

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
  declared editorial status against that raw fidelity result:
  - **VERBATIM** → `OK` — deterministic, fidelity actually proves this.
  - **PARAPHRASE** → `EDITORIAL_REVIEW_REQUIRED` for the *expected*
    fidelity mismatch (never a silent PASS).
  - **FRAMING** → `FRAMING_REQUIRES_EDITORIAL_REVIEW`, always — fidelity
    trivially exempts framing, which is not proof it carries no science
    (see "Framing is not a loophole"). Never reported as the same `OK`
    VERBATIM gets.
  An unexpected mismatch on a VERBATIM or FRAMING unit is a real,
  build-failing problem. `scripts/page-builder-shadow.mjs` — the
  original, fully-automated shadow script — is untouched and would still
  correctly refuse (exit 1) to treat this page's paraphrase content as a
  clean, silent PASS.
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
