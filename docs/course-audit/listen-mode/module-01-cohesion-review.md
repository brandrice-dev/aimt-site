# Module 1 — Voice Cohesion & Chunk-Length Review (owner listening sheet)

**Status:** Evidence for the owner to review. **No approval or architecture
decision has been made.** Nothing here is APPROVED, and the production
manifest still points M1-04 at the single, un-split 146-second file — that
has not changed and won't change until the owner decides.
**Voice:** Jane — Bright, Smooth and Friendly (`Y3ZPRGOSIxbV4Rbb3WiA`).
**Model:** `eleven_v3`. **Continuity mechanism used:** none — the connected
ElevenLabs tool does not expose one (see "Continuity capabilities" below).
Every file below was generated as a fully independent call, exactly like
every other Module 1 chunk.

This exists because the owner noticed M1-04 (146s) sounded "noticeably
flatter, slightly different voice/tone" than M1-01 (65s, "strong/natural")
or M1-07 (39s, "good"). Two questions are open: (1) does Jane's voice drift
between ordinary separate generations at all, or was M1-04 specifically
off? (2) does a long chunk flatten regardless, such that splitting it would
help? Test A answers the first question, Test B answers the second.

---

## Continuity capabilities (checked before generating anything)

The connected ElevenLabs tool (`creative_generate_speech` / TTS node on
`eleven_v3`) was inspected directly via `creative_get_model_schema` and
`creative_get_model_guide`. It exposes exactly four inputs: `prompt`,
`voice_id`, `model_id`, `language_code` (plus a deprecated `voice_id` alias).
**There is no `previous_text`, `next_text`, previous-request/generation-ID
chaining, seed, or any other documented continuity/context parameter.**
Nothing was guessed or assumed — every chunk in this task, including the
A/B split pair, was generated as a fully independent call with no awareness
of any other generation. If a genuine continuity mechanism becomes
available on a future platform/connector, it's worth revisiting this
question, but it is not available here today.

---

## Exact files to play

All files are local, already downloaded, and playable directly (Finder,
QuickTime, VLC, or your browser).

**Test A:**
```
assets/audio/listen/headspa-mastery/module-01/m1-01.mp3
assets/audio/listen/headspa-mastery/module-01/m1-02.mp3
assets/audio/listen/headspa-mastery/module-01/m1-03.mp3
```

**Test B:**
```
CONTROL (unchanged, current production file):
assets/audio/listen/headspa-mastery/module-01/m1-04.mp3

TEST (temporary, comparison only — not a production path):
docs/course-audit/listen-mode/tts/module-01/cohesion-test/m1-04a-cohesion-test.mp3
docs/course-audit/listen-mode/tts/module-01/cohesion-test/m1-04b-cohesion-test.mp3
```

## Recommended listening order

1. M1-01 → M1-02 → M1-03, back to back, no gaps (Test A).
2. M1-04 (control), alone, start to finish.
3. Pause. Reset your ear for a moment.
4. M1-04a-cohesion-test → M1-04b-cohesion-test, back to back (Test B).
5. Optional: go back and re-listen to M1-04 (control) immediately after the
   split pair, so the comparison is fresh.

---

## TEST A — Generation-to-generation consistency

Play `m1-01.mp3` → `m1-02.mp3` → `m1-03.mp3` in order, back to back.

Listen for:
- Is it the same recognizable Jane throughout?
- Same energy?
- Same pace?
- Same apparent age/timbre?
- Any abrupt shift right at a chunk boundary?
- Does it feel like one instructor continuing the lesson, or three
  different takes stitched together?

**Reference data** (measured, not a substitute for listening):

| Chunk | Duration | Words | Words/min (actual) |
|---|---|---|---|
| M1-01 | 65.44s | 170 | 155.9 |
| M1-02 | 76.80s | 151 | 118.0 |
| M1-03 | 92.16s | 209 | 136.0 |

M1-02's actual pace (118 wpm) is noticeably slower than M1-01's (156 wpm)
despite being a shorter chunk by word count — worth listening for
specifically, since a pace difference alone could explain part of what
reads as "flatter" without any change in pitch/timbre.

---

## TEST B — Long chunk vs. split chunk (M1-04)

**Control:** `m1-04.mp3` — 146.08s, one continuous generation, 289 words.
**Test:** `m1-04a-cohesion-test.mp3` (80.8s, 172 words) →
`m1-04b-cohesion-test.mp3` (62.08s, 117 words) — same exact wording, split
at the natural paragraph transition explained below, played back to back.

**Split point (see full rationale below):** immediately after "...is the
appropriate next step." — the end of the "safe language" ("say this")
paragraph — and before "Language that crosses the line does the
opposite..." — the start of the "never say" paragraph. This is an existing
paragraph boundary in the approved script, not a new cut: Part A covers the
observation-vs-diagnosis boundary plus the two "say this" examples; Part B
covers the "never say" examples plus the referral-trigger closing. Zero
words were changed, added, or removed — the two files concatenate back to
the original m1-04.txt exactly, character for character (verified
programmatically).

Listen for:
- Is the split version less flat than the control?
- Is Jane more consistent with how she sounded in M1-01 during the split
  pair than during the control?
- Is the A→B transition noticeable/jarring, or does it read naturally as a
  new paragraph beginning?
- Does the split sound stitched together, or like continuous narration?
- Does the lack of a continuity mechanism (see above) show up as an
  audible seam, or not?
- Which version — the single 146s file or the two shorter files — feels
  more human overall?

**Reference data:**

| | Duration | Words | Words/min (actual) |
|---|---|---|---|
| M1-04 (control, full) | 146.08s | 289 | 118.7 |
| M1-04a (test) | 80.80s | 172 | 127.7 |
| M1-04b (test) | 62.08s | 117 | 113.1 |

For comparison, the two chunks the owner already rated favorably:

| | Duration | Words/min (actual) |
|---|---|---|
| M1-01 ("strong/natural") | 65.44s | 155.9 |
| M1-07 ("good for checkpoint use") | 38.72s | 125.5 |

M1-04's control pace (118.7 wpm) is closer to M1-04b's split pace
(113.1 wpm) than to M1-01's pace (155.9 wpm) — the split doesn't
dramatically change the measured pace on its own; whatever reads as
"flatter" in the control is not fully explained by pace alone and may be a
delivery/energy quality that only listening can judge.

### Why this split point, not another

Word counts were measured per paragraph in the source script (6 paragraphs
total, 289 words). Splitting right after the "Here's what actually
separates the two" signpost sentence (the most obvious *narrative*
transition) would have produced a 29%/71% split — the second half would
still run ~104s, not meaningfully shorter than the control and not a clean
test of "does shortening help." Splitting after the "say this" paragraph
(the point chosen) produces two chunks at 80.8s and 62.1s — both inside or
close to the duration ranges the owner already rated well (M1-01's 60-90s,
M1-07's under-60s) — while still landing on a genuine paragraph boundary
("say this" examples complete, then "never say" examples begin fresh, no
sentence needs to be cut or duplicated to make either half stand alone).

---

## What was NOT done in this task

- The production manifest (`assets/js/aimt-listen-mode-data.js`) still
  points M1-04 at the single `m1-04.mp3` file. Not changed.
- No cohesion-test file was marked `APPROVED`, `GENERATED`, or given any
  manifest entry at all — they are pure comparison audio, outside the
  manifest/player system entirely.
- M1-05, M1-06, M1-08 through M1-14 were not generated.
- No wording, chunk boundary, checkpoint text, curriculum, or player
  architecture was changed.

**The decision — split M1-04 or not, and what (if anything) the
generation-to-generation consistency test implies for the rest of the
batch — belongs to the owner, after listening.**
