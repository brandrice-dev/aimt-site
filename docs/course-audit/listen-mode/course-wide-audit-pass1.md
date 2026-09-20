# AIMT Listen Mode — Course-Wide Audit, Pass 1 (Modules 0, 2-12)

**Status:** Research/audit only — no Listen scripts written, no audio
generated in this pass. Companion to
`module-01-reference-implementation-FROZEN.md` (the locked standard this
audit measures every module against) and
`00-listen-mode-editorial-standard.md`.
**Date:** 2026-08-31.

This maps each module's real, current numbered-section structure and
checkpoint positions directly from `headspa-mastery.html` (never assumed
from a prior draft), as the editorial standard's "applying this standard to
a module already scripted" section requires before any script is written.
Curriculum authority is the approved written course as it exists today —
nothing here proposes new testable content.

---

## Section maps (source of truth for future Listen script chunk maps)

| Module | Numbered sections | Non-numbered landmarks | Checkpoints (displayed position) |
|---|---|---|---|
| 0 | 0.1–0.11 (11) | Practice (ungraded) | m0cp1 — after 0.11, end of module |
| 2 | none numbered 2.1–2.5 (see note) | The arrival sequence, Test your judgment, Your voice, Practitioner insight | m2cp1 — after 2.7, end of module |
| 3 | 3.1–3.8 (8) | Anatomy to action, Predict before you reveal | cp1 — mid-module; cp2 — end of module (positions not re-verified line-by-line this pass; flagged below) |
| 4 | 4.1–4.10 (10) | Observation discipline, Similar image/different story | m4cp1 — after 4.5/Observation discipline; m4cp2 — after 4.10, end of module |
| 5 | 5.1–5.9 (9) | Signature interaction | m5cp1 — after 5.5; m5cp2 — after 5.9, end of module |
| 6 | 6.1–6.8 (8) | Signature interaction | m6cp1 — after 6.4 (mid-module, before Malassezia/seborrheic content); m6cp2 — after 6.8, end of module |
| 7 | 7.1–7.4 (4) | Signature interaction | m7cp1, m7cp2 — both immediately after 7.4/Signature interaction, back to back |
| 8 | 8.1–8.3 (3) | Think in phases, Signature interaction, Take the Service Into Practice | m8cp1, m8cp2 — both immediately after Signature interaction, before the closing "Take the Service Into Practice" section |
| 9 | 9.1–9.9 (9) | Close Without Pressure | checkpoints displayed here are internally id'd m10cp1/m10cp2 — see Finding 1 |
| 10 | 10.1–10.5 (5) | Building on Your Licensure, Reset Under Pressure | checkpoints displayed here are internally id'd m9cp1/m9cp2 — see Finding 1 |
| 11 | 11.1–11.8 (8) | none | m11cp1 — after 11.5; m11cp2 — after 11.8, end of module |
| 12 | none — real, scored certification exam (see Finding 3) | Take a moment, What you built, We are still here, Before you go | not applicable — real exam lives in `assets/js/module12-certification.js`, not static checkpoint divs |

Module 2's real section numbering in the live page uses **2.6 and 2.7**
as the only numeric labels ("2.6 — What goes wrong", "2.7 —
Consistency"); the four sections before them ("The arrival sequence,"
"Test your judgment," "Your voice," "Practitioner insight") are
unnumbered on screen. A future Listen script for Module 2 should announce
only the two that are actually numbered on screen, per the editorial
standard's Section A ("use the real, on-screen section number... never a
paraphrase").

Module 3 has no dedicated `id="module3Wrap"` div — its content is the
*default* markup already sitting inside `#lessonView` at page load (see
`let module3HTML = null; ... module3HTML = wrap.innerHTML;` and
`STATIC_MODULES[3]` in `headspa-mastery.html`), captured into a JS
variable once and restored on re-navigation. This doesn't affect Listen
Mode's `.lesson-wrap` scoping (still resolves correctly, verified for
Module 1), but a future script/audit pass on Module 3 should know its
content lives at a different structural location than every other module.

---

## Findings

### Finding 1 — Modules 9/10 checkpoint id/content mismatch (owner input needed)

`module9Wrap` (displayed content: "Module 9 · Checkout, Client Closing &
Pricing Strategy") contains checkpoint elements with ids `m10cp1`/`m10cp2`.
`module10Wrap` (displayed content: "Module 10 · Sanitation & Reset
Systems") contains checkpoint elements with ids `m9cp1`/`m9cp2`. This
looks like a leftover from a past module renumbering (see CLAUDE.md's
"rename-proofing" work in a prior session) where the displayed module
number moved but the internal checkpoint id didn't.

**Not fixed in this pass.** Renaming a checkpoint id risks breaking
whatever downstream code keys off it (grading rubric lookup, `APP_STATE`
checkpoint tracking, any already-stored student progress records) without
a full trace of every reference — exactly the kind of checkpoint-authority
change the task's own rules reserve for explicit, separate justification.
**This needs owner input**: confirm whether this is intentional
(e.g. the ids were deliberately kept stable across a renumbering to avoid
invalidating in-progress students' stored checkpoint state) or a genuine
bug, before anything touches it.

### Finding 2 — Checkpoint placement otherwise looks sound

Every other module's checkpoints sit after the teaching they evaluate and
before what logically follows, matching the pattern Module 1 was
corrected to. Modules 7 and 8 both stack two checkpoints back-to-back
right after their one "Signature interaction" section rather than
alternating with more numbered sections — this matches those modules'
real structure (few numbered sections, more interaction-driven), not a
misplacement.

Module 3's checkpoint positions (`cp1`, `cp2` — note the un-prefixed
naming, unlike every other module's `mNcpX` convention) were not
re-verified against exact line position in this pass given its unusual
`#lessonView`-seeded structure; flag for the next audit pass before
writing its Listen script.

### Finding 3 — Module 12 is a real certification exam, not static content

`module12Wrap`'s static HTML ("Take a moment," "What you built," "We are
still here," "Before you go") is completion/congratulations copy shown
*after* certification. The actual scored assessment — 40 knowledge
questions (50%), 4 applied practitioner cases (30%), and additional parts
— is mounted dynamically by `assets/js/module12-certification.js` against
`functions/api/certification/*.js` (server-authoritative; the client
never computes a local pass/fail). This is why Module 12's Module Opener
was **not** added this pass (see the propagation commit) — inserting
static markup into a module whose real content is a multi-state exam
flow needs to be placed correctly relative to that state machine, which
needs owner input, not a guess. Whatever Listen Mode narration Module 12
eventually gets must never narrate exam question content, answer choices,
or scoring — only the orientation copy this file already documents.

---

## Not yet done (next steps, in order)

1. Owner decision on Finding 1 (Modules 9/10 checkpoint ids).
2. Owner decision on where a Module 12 opener/Listen entry can safely
   live relative to `module12-certification.js`'s state machine.
3. Reference Voice landmark audit per module (which cards/lists get the
   word-for-word treatment) — deferred; requires the same close read
   Module 1's script draft did section-by-section.
4. Listen script drafts (Modules 0, 2-11) — deferred, real authorship
   effort at Module 1's quality bar (v1→v5 revision history), not
   attempted this pass to avoid shipping a rushed script under Module 1's
   name as the reference standard.
5. ElevenLabs generation, CapCut production, and canonical audio install
   — blocked on #4.
