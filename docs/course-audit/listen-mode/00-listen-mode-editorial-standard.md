# AIMT Listen Mode — Editorial Standard (course-wide)

**Status:** LOCKED, effective this pass. Applies to Modules 0–12 going
forward, not only Module 1. Module 1 is the first module revised under this
standard (see `module-01-listen-script-draft.md` v4).
**Date:** 2026-08-31.
**Origin:** owner review of a real, completed Module 1 listen-through —
findings surfaced editorial, synchronization, continuity, and UI issues that
are structural, not Module-1-specific, so they're captured here once rather
than re-derived per module.

This document governs how future Listen Mode scripts get written and how the
player presents them. It does not itself change any shipped audio, chunk
manifest, or checkpoint. Module-specific application (chunk maps, cut points,
visual targets) lives in each module's own script draft.

---

## A. Section announcements

Cadence announces every numbered instructional section as she reaches it.

**Pattern:** `"Section [N.N] — [actual visible section title]."`

- Use the real, on-screen section number and the real, on-screen section
  title — never a paraphrase of the title.
- Say it once, at the start of the section's narration, not repeated
  mid-section.
- Do **not** announce production/audio chunk boundaries (chunk IDs, "part 3
  of 5," etc.) — those are an engineering concept (see Section K below) and
  must never reach the student, spoken or displayed.
- Non-numbered moments (module opening, checkpoints, practice interactions,
  recap/closing) get a plain-language framing line instead of a fabricated
  section number — see Section H's player-label rule for the parallel
  on-screen treatment.

## B. Section breathing room

Add a short, natural pause at real instructional section transitions —
target **a few seconds**, not a hard silence and not long enough that
playback feels stalled.

- The pause belongs **between major sections**, not between every paragraph
  or every card within a section.
- In production terms (Section 11), this is a natural stopping point a human
  instructor would actually take — realized either as a beat of room tone
  left in the recording at that boundary, or as a deliberate short silence
  inserted at the player-chunk cut. It is not a scripted "[PAUSE]" spoken
  aloud.

## C. Two narration modes

Locked editorial rule — every script chunk should be identifiable as one or
the other at any given moment, including inside a single chunk that moves
between them.

**Cadence Teaching Voice** — explanation, transitions, context, examples,
connective narration, recap, conversational framing. Cadence may paraphrase
and sound human/natural here.

**Cadence Reference Voice** — used whenever AIMT deliberately calls
attention to a specific card, a visible list, exact professional language,
permitted/not-permitted guidance, definitions, safety language, a structured
framework, protocol steps, or other deliberate visual reference material.
While in Reference Voice:

- Follow the visible content in the **same order** it appears on screen.
- Preserve every important item — do not silently drop one.
- Word closely enough to the visible source that an audio-only student
  receives the same information an on-screen student does; use word-for-word
  narration where that's the natural way to say it.
- Never skip an item and loosely summarize it later — if it's worth showing
  on screen as a distinct card/row, it's worth naming in Reference Voice.

**Principle:** Cadence can be human between the landmarks. At the landmarks,
Cadence becomes precise.

## D. Visual/audio order must match

If Cadence is explicitly walking through visible cards, the audio sequence
must equal the screen sequence. Screen order A → B → C → D must never be
narrated B → D → A, unless the visible experience itself has been
deliberately reordered to match (i.e., fix the mismatch by aligning one to
the other — never leave them silently divergent).

## E. Audio-first curriculum parity

A student who primarily listens must still receive every important
instructional landmark — major cards, rules, distinctions, definitions,
frameworks, comparisons, recap points — without being required to watch the
screen continuously to understand them.

Listen Mode remains an **editorial audio edition**, not sentence-for-sentence
page reading. Compression (governing principle + representative examples
instead of reading every list item) remains an approved technique — but only
when representative examples are chosen so that no *required competency* is
left uncovered, and the omission is documented (see each script's coverage
map). Parity is about instructional landmarks, not word count.

---

## How these interact with production (Section 11 architecture)

These five rules describe the **finished listening experience**. They are
deliberately independent of how many ElevenLabs recording sessions or CapCut
parts produce that experience — see `module-01-listen-script-draft.md`'s
recording-session proposal for how Module 1 applies the "fewer, longer
continuous performances, cut at natural stopping points" production model
these editorial rules assume (Rule B's breathing room, in particular, is
easiest to get right when a cut already falls at a real pause rather than an
arbitrary duration).

---

## Applying this standard to a module already scripted

When revisiting an existing module's Listen Mode script under this standard:

1. Re-verify the *actual live* visible section order and card contents
   directly from `headspa-mastery.html` — never assume a prior draft's
   documented order is still current.
2. Tag each passage Teaching or Reference Voice explicitly in the script
   document (not just implicitly through phrasing).
3. Confirm every numbered section still gets an explicit announcement and a
   real visualTarget/sync anchor — a section with narration but no sync
   target is exactly the failure mode this standard exists to prevent.
4. Do not change checkpoint prompts, rubrics, or grading behavior as part of
   this pass — editorial/sync work and checkpoint-authority work are
   separate concerns even when a checkpoint's *narration framing* changes.
