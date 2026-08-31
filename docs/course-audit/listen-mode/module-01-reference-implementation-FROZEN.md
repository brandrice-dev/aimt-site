# AIMT Listen Mode — Module 1 Reference Implementation V1 (FROZEN)

**Status:** APPROVED and FROZEN. **Date:** 2026-08-31.

**Owner verdict:** Listen Mode is highly valuable and approved as the AIMT
platform direction. The new longer-session ElevenLabs production (Jane —
Bright, Smooth and Friendly, `Y3ZPRGOSIxbV4Rbb3WiA`, `eleven_v3`, continuous
two-session recording model — see
`module-01-pass2-raw-sessions-v2-production-log.md`) sounds substantially
better than the earlier per-chunk pilot; voice continuity is acceptable.
Module 1 was approved as the platform reference implementation contingent
on two final fixes, both implemented and live-QA-verified this pass:

1. **Consistent ~4s breathing room between numbered sections** — see
   `module-01-section-gap-measurements.md` for the measured-silence
   methodology, the per-transition `transitionGapMs` table, and live
   browser verification (all 8 flagged transitions land within ~40ms of
   target, inside the locked 3.5–4.5s range).
2. **Reliable page synchronization throughout the complete listening
   experience** — Sections 1.1 and 1.2 (the two sections that weren't
   syncing) gained sync anchors; all 13 numbered-section/practice/
   checkpoint/completion landmarks now have a working `visualTarget`. A
   real bug in `scrollToVisualTarget()` (naive centering that didn't
   account for the fixed player bar's height, letting a tall card's bottom
   rest behind the bar) was found and fixed during verification.

All 14 Module 1 chunks are now `qaStatus: 'APPROVED'` in
`assets/js/aimt-listen-mode-data.js` — these are the owner-approved v2
continuous-session/CapCut files (Pass 2B install). `isProductionReady()` is
now `true`; Listen Mode presents to real students for Module 1.

**Do not reopen Module 1 architecture** unless a genuine launch-blocking
defect appears. Module 1 is the locked template for Modules 0–12.

---

## What's locked, as the reference for every future module

### Module Opener structure
Black, full-bleed opener (`.m1-opener`) replacing the old `.mod-hero` +
`.protocol-card` pairing: `MODULE NN` eyebrow → module identity/subtitle →
strong title → short orientation → divider → "In this module" (3–5 concise
outcomes) → "Pay attention to" (one key-focus line) → footer with the
Listen with Cadence entry control, real duration, and checkpoint-stop count
(computed from the manifest, never hand-typed). Uses the existing AIMT
design system tokens (`--aimt-font-mont`/`--aimt-font-mono`/`--aimt-font-serif`)
— no invented visual styles, no generic opener video.

### Listen entry
A real, static `<button>` already in the page's own markup (not a JS-only
mount point) — `mount()` attaches playback to it and never creates/removes
it, so a stale/failed player script can't make the whole control disappear.
Entry-state-aware label (`Listen with Cadence` / `Resume Listening` /
`Listen Again`) resolved once from Listen Mode's own stored position, never
from course/module completion.

### Player behavior
Bottom-fixed player bar, one instance at a time (`mount()`/`unmount()`),
Start Over / minimize / close, ⏪12s / ⏩12s skip, 0.75×–1.5× speed, seekable
progress bar, Media Session integration. Read-only with respect to course
state — never calls any APP_STATE write method (`setCheckpointResult`,
`_checkModuleComplete`, etc.); checkpoint passing remains entirely owned by
the existing checkpoint UI and grading pipeline.

### Section-gap standard
~4 seconds of breathing room (3.5–4.5s acceptable) between true numbered-
section transitions only — never inside a section, never at every chunk
boundary. Computed per transition as `target - measured natural silence`
(ffmpeg `silencedetect` against the actual canonical audio), never a blind
flat delay. Implemented as `transitionGapMs` on the manifest chunk and a
`setTimeout`-based `advanceAfterGap()` in the player, applied only on a
natural `ended → advance` auto-transition — never on manual navigation
(Start Over, Continue Listening, seek, skip). See
`module-01-section-gap-measurements.md`.

Checkpoint boundaries remain indefinite stops governed by competency, not a
timed transition. Practice/recap transitions use their own semantically
appropriate timing (not the locked 4s standard).

### Synchronization architecture
Every numbered section/practice/checkpoint/completion landmark declares a
`visualTarget` (a stable DOM id) in the manifest. At the start of each
chunk, `scrollToVisualTarget()` scrolls the live `.lesson-wrap` (never a
hidden module template — DOM resolution is always scoped, since hidden
`#moduleNWrap` source templates carry duplicate copies of every id) to
center the target within the space actually visible **above the fixed
player bar** (reads `--aimt-lm-bar-offset`, the same reusable offset
`#guideBtn` already coordinates against — not the raw window height).
Smooth, restrained movement; no word-level/karaoke scrolling, section/card-
level only.

For explicit multi-card visual walkthroughs (e.g. Section 1.3's Buildup →
Flaking → Irritation → Shedding/Thinning card, Section 1.4's "May fall
within scope" → "Never authorized" cards), the *narrated order must equal
the visible DOM order* — verified directly against the approved script,
never assumed. No additional timed sub-card cues were added without real
timestamp data (Section 5's "do not guess timestamps where accuracy
matters" — card-level cueing via the single section-start `visualTarget`
was sufficient in every case checked for Module 1).

### Reference/Teaching Voice
**Teaching Voice** — explanation, transitions, context, recap, connective
narration; Cadence may paraphrase. **Reference Voice** — used whenever a
specific card, list, exact professional language, or structured framework
is deliberately called out; follows the visible content in the same order,
preserves every item, words closely enough that an audio-only student
receives the same information as an on-screen student. See
`00-listen-mode-editorial-standard.md` for the full course-wide rules
(section announcements, breathing room, the two voices, visual/audio order
parity, audio-first curriculum parity).

### Checkpoint behavior
`checkpoint-stop` chunks halt playback and wait — they narrate the prompt,
never grade it; the existing checkpoint UI remains the only way to pass.
`post-pass` chunks (the continuation immediately after a checkpoint) are
gated on an authoritative pass in course state and surface as a manual
"Continue Listening" affordance, never auto-blasted audio. An
already-passed checkpoint (replay, "Listen Again") never re-requires
competency — checked synchronously, no re-grade. Checkpoint 1 (`m1cp1`)
lives physically after the practice interaction and before Section 1.5 —
verified correct, not moved this pass.

### Replay behavior
"Start Over" resets only this module's Listen Mode position (confirm-
gated) — never course progress, checkpoints, or Cadence transcripts. A
student who finished the module never resumes back into the closing recap
chunk merely because that's where their last session's stored position was
left (the `finished` bit is set only on a genuine run-off-the-end `ended`,
distinct from "paused near the end").

### Audio generation architecture
Fewest practical ElevenLabs generations under the connector's 5,000-char
cap, cut only at pre-planned pause points (checkpoint boundary > numbered-
section transition > major natural teaching break — never mid-sentence,
never balance-optimized). ElevenLabs generation ≠ player segment ≠ CapCut
part — one long continuous performance may produce multiple player
segments; never revert to one-generation-per-player-chunk.

### CapCut production architecture
Locked preset (`CADENCE_CAPCUT_FINISH_PRESET_V1` /
`module-01-production-standard-LOCKED.md`): Volume 0.0dB, Fade 0, Normalize
Loudness ON/-23 LUFS, Enhance Voice ON/75, Reduce Noise ON, Isolate Voice
OFF, Speed 1.0×, everything else OFF. No Auphonic, no post-CapCut
remastering. Raw ElevenLabs generation always preserved under `raw/` before
any finishing step. Split production masters at natural/checkpoint
boundaries to respect CapCut's <15:00 Enhance Voice limit (preferred
<13–14 min).

### Recap behavior
Folded into the final chunk alongside the post-pass-2 continuation and
completion card — Teaching Voice, closing principle, explicit handoff to
the next module. Not a separate generation/player segment for Module 1
(one continuous performance covering post-pass-2 → recap → handoff, cut
only if a later module's content requires it).

### Mobile behavior
No mobile-specific code path exists or is needed — the player bar is a
standard fixed-position flex layout with `env(safe-area-inset-bottom)`
padding, native `<audio>` element (Media Session API for lock-screen
controls), and touch-equivalent click targets (34×34px minimum). Verified
by construction, not a separate mobile QA pass this round.

---

## What future modules inherit unless a documented exception applies

The Module Opener primitive, the Listen entry pattern, the player, the
section-gap standard, the synchronization architecture, Reference/Teaching
Voice, checkpoint behavior, replay behavior, the audio-generation and
CapCut production architecture, recap behavior, and mobile behavior are all
locked as described above for Modules 0–12. A future module may deviate
only for a documented, genuine instructional requirement (e.g. Module 0
having no competency stop, Module 12's certification-integrity
constraints) — never for convenience or cosmetic preference.
