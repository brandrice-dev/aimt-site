# AIMT Listen Mode — Editorial Standard (course-wide)

**Status:** LOCKED, effective this pass. Applies to Modules 0–12 going
forward, not only Module 1. Module 1 is the first module revised under this
standard (see `module-01-listen-script-draft.md` v4).
**Date:** 2026-08-31.
**Origin:** owner review of a real, completed Module 1 listen-through —
findings surfaced editorial, synchronization, continuity, and UI issues that
are structural, not Module-1-specific, so they're captured here once rather
than re-derived per module.

**Addendum, 2026-09-16:** Sections F, G, and H below were added this pass
(launch-hygiene session, `course-audit-build` branch). F and G are new
permanent, LOCKED rules — same standing as A–E — for Modules 8–12 and any
future rebuild of an earlier module. H is an informational note only and
codifies no new rule.

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

## F. Checkpoint-closing directional language ("above" is always wrong)

Locked rule, effective this pass, applies to Modules 0–12 (including any
future rebuild of an already-shipped module).

If a checkpoint's closing narration uses a directional cue pointing the
student at the response field at all, it must never say **"answer above"**
(or any equivalent — "your answer is above," "respond above," "response
above," etc.) — the student's response text area sits **below** the
checkpoint prompt on screen in the live player, never above it. Telling the
student to look "above" points them in the wrong direction.

- If a closing directional cue is used, the only approved wording is
  **"Take your time, and answer below."** (or an equivalent phrase that says
  "below" — never "above").
- A checkpoint's closing narration may also omit a directional cue entirely;
  that is acceptable and does not require adding one.
- This is enforced automatically going forward by
  `scripts/aimt-listen-tts-preflight.mjs`, which rejects (exit code 1) any
  ElevenLabs batch payload containing "answer above"/"respond
  above"/"response above"/"your answer is above" phrasing before that batch
  is ever sent to ElevenLabs — see the `DIRECTIONAL_ABOVE` check in that
  script. Modules 8–12 (and any future rebuild) cannot silently reintroduce
  this defect through that gate.

## G. Mandatory end-of-module fidelity re-check before audio generation

Locked rule, effective this pass, applies to every future Listen Mode module
rebuild (Modules 8–12 now, and any later revisit of an earlier module).

Added in direct response to a real quality issue found in the Module 6
rebuild: the owner caught, on review, a substantive on-screen headline that
had been silently skipped even though its body content was narrated — the
coverage-map audit process at the time didn't force an explicit accounting
of every heading, and (per the Module 7 fidelity audit's own framing of the
incident) the pattern was specifically a **last-item-in-a-sequence** drop
near the end of the module, not something the first coverage pass caught on
its own. Nobody caught it until owner review.

Going forward, before any audio generation for a module rebuild:

1. A **second, dedicated fidelity pass** must be performed specifically over
   the **final third of the module** — re-reading the live page's final
   third side by side with the narration's final third, independently of
   the full coverage-map pass over the whole module.
2. That pass must explicitly check for: headline/card/list thinning,
   paraphrase creep, exact completion-language match against the live page,
   and exact checkpoint placement (immediately after the element it gates,
   in live DOM order).
3. That pass must be documented in the module's own coverage-audit file
   (`module-NN-fidelity-coverage-audit.md`) as its own explicit section
   titled **"END-OF-MODULE FIDELITY CHECK"**, ending in a stated
   **PASS/FAIL** result for that check. A FAIL must be fixed and the
   check re-run (and the batch files regenerated from the corrected source)
   before the module is considered ready for audio generation.

Module 7's rebuild was the first to actually apply this rule — see
`module-07-fidelity-coverage-audit.md`'s "END-OF-MODULE FIDELITY CHECK"
section (scoped to Section 7.4 through module completion, chunks M7-05
through M7-09; result: PASS, after two small drifts caught by that specific
pass were fixed before the batches were generated).

## H. Known non-compliant already-shipped audio (informational — no action taken here)

Informational note only; codifies no new rule and authorizes no fix.

A preflight sweep this session (2026-09-16) found the exact "answer above"
defect described in Section F above already present in **15 already-shipped
batch files across 9 modules** (00, 02, 03, 05, 06, 08, 09, 10, 11) —
including Modules 5 and 6, whose audio is already generated and
owner-approved. Full detail and the per-file list live in
`module-07-fidelity-coverage-audit.md` (drift row #12).

Fixing any of that already-shipped narration/audio is a separate,
not-yet-decided owner action. It is explicitly out of scope of this
document and was not attempted as part of adding Sections F and G — this
entry exists only so the defect is recorded once, centrally, rather than
re-discovered independently per module.

## I. Never reveal an answer or resolution before the student acts

Locked rule, effective this pass (`course-audit-build`, launch-hygiene
session, 2026-09-17). Applies to Module 9 forward and any future module
rebuild. Module 8 is owner-approved, final for launch, and explicitly out
of scope of any retrofit under this section — it is not touched by this
rule. Modules 1/4/5/6/7 are owner-locked and likewise not touched by this
rule; their existing narration already happens to satisfy the checkpoint
half of it (see below) and is left exactly as shipped.

**Principle:** Listen Mode must never let a student hear which answer is
correct, what a graded checkpoint's result is, or which option "wins" an
ungraded scenario before that student has actually acted on screen. This
applies identically whether the interaction is graded (a required Cadence
Check) or ungraded (a signature interaction / practice scenario /
multiple-choice compare-and-decide block) — the spoiler risk is the same
either way, only the underlying state the player watches differs.

### I.1 Required Cadence Checks (graded checkpoints)

This was already true of the shipped mechanism before this section existed
to name it; this subsection formalizes it as a locked, permanent rule
rather than an incidental property of `gateType: 'checkpoint-stop'` /
`'post-pass'`:

1. The checkpoint becomes visible on screen (`visualTarget` scrolls it into
   view) before Cadence narrates its prompt.
2. Cadence reads the checkpoint prompt only — never the grading rubric,
   never the result, never any answer-dependent branch.
3. Playback halts the instant that narration ends (`checkpoint-stop`) and
   waits — it does not auto-advance, and it does not poll or reveal
   anything about a wrong attempt.
4. The student answers using the existing on-screen checkpoint UI
   (`submitCheckpoint()` and its grading pipeline in
   `headspa-mastery.html`) — Listen Mode never grades, never writes
   `APP_STATE`, and only ever reads whether a pass has been recorded
   (`engine.isCheckpointPassed`).
5. Nothing narrated reveals grading/result/feedback before a genuine pass
   is recorded — a wrong attempt simply leaves the player paused,
   continuing to wait, exactly as if nothing had happened yet.
6. Only once a pass is detected does the player resume — via an explicit
   "Continue Listening" affordance (`resumeAfterPass`), not a surprise
   auto-play, into the `post-pass` chunk.

Reference implementation: `assets/js/aimt-listen-mode-player.js`'s
`isCheckpointPassed`, `isChunkPlayable`, `resolveAfterEnd`,
`enterAwaitingCheckpoint`, `offerContinue`. Proven by
`tests/aimt-listen-mode-module1-pilot.test.mjs`.

Checkpoint closing language remains governed by Section F above (never
"answer above") — unchanged by this section.

### I.2 Ungraded interactive scenarios (signature interactions, practice
    scenarios, multiple-choice compare-and-decide blocks)

These are the sitewide `m5Decide`/`m8Protect`/`m9Cwp`/`m10RupSelect`-family
single-select-with-per-option-feedback pattern: a block of `.bq-opt`
option buttons (each carrying `aria-pressed` and a `data-choice` index) and
a `.bq-feedback` region, entirely client-side, explicitly ungraded, and
never written to `APP_STATE` or persisted. Before this section, Listen
Mode had no gating mechanism for these at all — an interaction's narration
was authored and generated as one continuous chunk that read the prompt,
every option, AND every option's rationale back to back (naming which
option "protects the flow"/"is the strongest response"/etc. before an
audio-only student could have chosen anything). That is now a defect under
this rule and must not be repeated in any Module 9-forward narration.

**Required shape going forward, mirroring the checkpoint mechanism above:**

1. The interaction becomes visible on screen before Cadence narrates it.
2. Cadence reads the prompt and every option's label — and *only* the
   label; never any option's rationale, verdict, or "this is the response
   that protects the flow"-style tell. This is one narration chunk,
   `gateType: 'interaction-stop'`.
3. Playback halts the instant that chunk ends and polls the interaction's
   own DOM state (read-only — `interactionId` + `interactionOptionsSelector`,
   scoped the same duplicate-id-safe way `visualTarget` is) for a selected
   option, the same way a checkpoint-stop chunk polls course state for a
   pass. Nothing about which option is "correct" is narrated during this
   wait.
4. Only once the student selects an option (any option — this is
   ungraded, so there is no "wrong attempt stays paused" branch the way a
   checkpoint has; a selection is itself the resolution) does the player
   play that *one* option's own dedicated feedback clip
   (`interactionFeedback[n]`, matched by `optionIndex`) — never any other
   option's feedback, and never the narration that would have played had a
   different option been picked.
5. If the interaction has multiple scenarios in sequence (e.g. three
   compare-and-decide scenarios under one "Signature interaction"
   heading), each scenario is its own `interaction-stop` chunk with its
   own `interactionFeedback` set — the player naturally chains through
   them via the same `afterIndex` resume mechanism, never collapsing them
   into one narrated block the way pre-this-section scripts did.
6. Once the selected option's feedback finishes, the player resumes the
   main narration sequence exactly where it would have continued had the
   interaction not existed.

**Script-authoring implication for Module 9 forward:** an interaction's
prompt/options chunk and its per-option feedback are separate TTS batches,
never one combined batch — the batch/chunk map for any module's
interactive scenario must show this split explicitly (see each module's
own interaction/checkpoint timing map, produced before audio generation
per Section G).

Reference implementation: `assets/js/aimt-listen-mode-data.js`'s
`interaction-stop` gate type, `interactionId`, `interactionOptionsSelector`,
and `interactionFeedback` schema fields (with `validateManifest`/
`isProductionReady` coverage — a module is never production-ready if any
option's feedback branch isn't itself `APPROVED`, even if the prompt/
options chunk is); `assets/js/aimt-listen-mode-player.js`'s
`engine.resolveSelectedOption`, `resolveAfterEnd`'s `interaction-stop`
branch, `enterAwaitingInteraction`, `playInteractionFeedback`. Proven by
`tests/aimt-listen-mode-interaction-gate.test.mjs` against a synthetic
fixture (deliberately not tied to any real module's manifest — no new
audio was generated and no shipped/locked module was touched to build or
prove this mechanism).

## J. Narrator perspective — Cadence never refers to herself in third person

Locked rule, effective this pass (`course-audit-build`, 2026-09-20).
Applies to Module 11 forward and any future module rebuild. Codifies a
principle that was already implicit and already correctly followed
course-wide (Module 0/0-v2's "I'm Cadence" self-introductions, Module 4's
"From Cadence:" quote attribution) but had never been written down as an
explicit rule — the gap surfaced when Module 11's v2 rebuild initially
preserved a page paragraph's third-person Cadence description verbatim
("...through Cadence...Cadence is an AI learning-support tool...") on the
mistaken theory that Reference Voice must never adapt grammatical person.
The owner correction: it must, specifically for this one thing.

**Principle:** Cadence is the Listen Mode narrator. When narration is
Cadence describing herself — what she is, what she does, what she's
built from — she speaks in first person, even where the live page's
visible copy (written for a reading student, not voiced by Cadence)
describes her in third person. This is a **narrator-perspective
adaptation only** — it changes grammatical person, never factual
substance. "Cadence is an AI learning-support tool built around that
curriculum" becomes "I'm an AI learning-support tool built around that
curriculum"; "through Cadence" becomes "through me." Everything else in
the sentence is preserved exactly.

**This is not blanket permission to rewrite every "Cadence" mention.**
Distinguish two cases before touching any occurrence:

- **Narrator self-reference (must adapt to first person):** the visible
  text is describing Cadence herself — what she is, what she can do,
  what built her — in a sentence a reading student would understand as
  "this is what this AI tutor is." This is the case Section J corrects.
- **Legitimate third-person reference (leave as-is):** the visible text
  names a distinct product/feature by its proper name rather than
  describing the narrator generically — e.g. "Listen with Cadence" vs.
  "Ask Cadence" (two different named features being distinguished from
  each other), "Practitioner Conversation with Cadence" (a named
  assessment component), or "From Cadence:" (a quote-attribution label).
  These stay third person because they are naming things, not Cadence
  describing herself.

**Do not blind-string-replace.** A pattern match alone cannot make this
distinction — judgment is required for every match. Accordingly, the
automated preflight check for this (see below) only **flags** matches
for human/editorial review; it never auto-rewrites and never fails the
build on its own.

**Enforcement:** `scripts/aimt-listen-tts-preflight.mjs`'s
`CADENCE_THIRD_PERSON` check scans every batch payload for
`Cadence is`/`Cadence can`/`Cadence helps`/`through Cadence` (and similar
constructions) and prints a non-blocking `NOTE` (not a `FAIL`) for each
match, so a human reviews it against the two cases above before that
batch is generated. Module 11's `M11-02` is the reference example this
check exists to catch.

## K. B.R.I.E.F. (and any similarly-spelled framework name) — spoken as the ordinary word, not letter-by-letter

Locked rule, effective this pass (`course-audit-build`, 2026-09-20).
Applies to Module 11 forward and any future module that names a
framework whose letters spell a real word.

**Principle:** when a framework's display name is written as a
letter-acronym that also spells an ordinary English word — AIMT's
Module 11 "B.R.I.E.F." (Background / Request / Instructions / Expected
Output / Fact-check) spells "brief" — the framework's *name*, when
spoken as a whole, is pronounced as that ordinary word: "brief," not "B,
R, I, E, F" or any other letter-by-letter spelling. This is the mirror
case of the AIMT display/TTS distinction (Section governing that
pronunciation): AIMT display → spoken as separated letters (because
"AIMT" is *not* an ordinary word and reads wrong as one); B.R.I.E.F.
display → spoken as the ordinary word (because "B.R.I.E.F." *is* an
ordinary word once spoken, and reads wrong as separated letters).
**Visible course text/UI is never changed by this rule** — only the TTS
payload.

**This does not apply to the individual-letter teaching sequence.**
When Cadence is explicitly teaching what each letter stands for ("B is
for Background... R is for Request..."), those letters are spoken
individually — that is a different narration purpose (defining each
component) than naming the framework as a whole, and remains unchanged.
Test: is this sentence *naming* the framework, or *defining one of its
components*? Only the naming case takes the ordinary-word pronunciation.

**Enforcement:** `scripts/aimt-listen-tts-preflight.mjs`'s
`LETTER_SPELLED_WORD_NOTE` check flags any run of single letters
separated only by punctuation/whitespace (e.g. "B, R, I, E, F",
"B.R.I.E.F", "B-R-I-E-F") as a non-blocking `NOTE` for review. This
pattern cannot match the legitimate teaching sequence, because real
words (the component labels) sit between the letters there, not bare
punctuation — so the check does not require judgment to avoid that
false positive the way Section J's Cadence check does, but it still
only flags rather than auto-rewrites, since a human should confirm the
flagged acronym actually spells a real word.

## L. AIMT pronunciation — single-spaced letters, no punctuation

**Locked rule, effective this pass (`course-audit-build`, 2026-09-20).
Supersedes every earlier AIMT-pronunciation choice in this document's
history. Applies to all future Listen Mode production. Do not change
this rule again unless the owner explicitly changes it.**

**Rule:**

| | |
|---|---|
| Visible course text | `AIMT` |
| TTS payload | `A I M T` (single space between each letter, no other punctuation) |
| Spoken intent | Recite the four letters — A, I, M, T — naturally, as an initialism, in normal connected speech. Never pronounce it as the word "AIMT." Never exaggerate pauses between letters. |

**Invalid TTS forms (all rejected):** bare `AIMT`, hyphenated
`A-I-M-T`, dotted `A.I.M.T`, and — as of this pass — **comma-separated
`A, I, M, T`**.

**History (why this took three passes to land):**
1. The original course-wide convention was single-spaced `A I M T`. On
   this exact voice (`Y3ZPRGOSIxbV4Rbb3WiA`, Jane) and model
   (`eleven_v3`), the owner found this rendering as "Am-tee" —
   `eleven_v3` collapses the first three letters, A-I-M, toward the real
   word "aim," plus "T" (first found in Module 10, 2026-09-18).
2. The fix at the time was comma-separated `A, I, M, T`, which the owner
   confirmed by ear resolved to four distinct letters (rejecting a
   `[slowly]`-tagged alternative as "sounds crazy"). This was applied to
   Modules 10, 11, and (briefly) 12.
3. On further listening (Module 12, 2026-09-20), the owner found the
   comma-separated form caused Jane to pause too heavily between
   letters and sound choppy — the opposite failure mode from "Am-tee."
   The fix is single-spaced letters **with no punctuation of any kind**
   between them — this reads as four distinct letters in natural
   connected speech without either collapsing into "aim" or over-pausing
   on comma boundaries. Confirmed correct and locked as of this pass.

**Scope of the 2026-09-20 reversal:** applied to Module 12 only (the
only module with an in-flight AIMT correction at the time). **Not**
applied retroactively to Modules 10 or 11's already-shipped
comma-separated audio — revisiting that already-shipped audio is a
separate, not-yet-decided owner action and was not attempted here. Any
future module built from this point forward uses this Section L rule
(single-spaced, no punctuation) from the start.

**Enforcement:** `scripts/aimt-listen-tts-preflight.mjs` already rejects
bare `AIMT`, hyphenated `A-I-M-T`, and dotted `A.I.M.T`. It does not yet
reject comma-separated `A, I, M, T` as a hard failure (that form is not
"AIMT as a word," so the existing checks don't catch it) — a future
preflight update could add this as a fourth rejected pattern now that
Section L makes it invalid, but no such check exists yet as of this
pass.

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
