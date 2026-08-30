# Module 1 Listen Mode — LOCKED Production Standard

**Status: LOCKED by owner decision, 2026-08-30.** This document is the
single source of truth for how Cadence Listen Mode audio gets produced
going forward. It supersedes the exploratory framing in every prior
comparison doc in this directory (cohesion, finishing, de-ess calibration,
Master V2/V3, Auphonic comparison, parallel blend) — those remain on file
as the evidence this standard was chosen from, not as competing options.

---

## 1. Chunking standard (locked)

**Chunk by natural teaching section, not by arbitrary duration.**

The ElevenLabs Creative connector used for generation exposes no `seed`,
`previous_text`/`next_text`, prior-generation chaining, or any other
continuity mechanism (confirmed directly against the connector's schema
and OpenAPI-equivalent documentation, not assumed) — every generation is
fully independent. More chunks therefore means more independent
generation events, each a fresh opportunity for voice/tone drift. Fewer,
well-chosen chunks is the safer default.

- **Preferred ordinary range:** ~45–100 seconds.
- **Normal acceptable range:** up to ~120 seconds.
- **Over ~120 seconds:** review, don't automatically split.
- **Split a >120s chunk only when BOTH** (A) there's a clean natural
  teaching break, **and** (B) the long generation audibly degrades enough
  that splitting produces a *meaningful* improvement — not a hypothetical
  one.
- Short checkpoint/resume chunks (M1-07, M1-08, M1-13, M1-14) are exempt —
  their instructional/gating function requires them to be short and
  separate from the surrounding narration.
- Never create a tiny fragment purely to hit a duration number.

## 2. M1-04 — final decision (locked)

**M1-04 stays ONE production chunk.** The A/B split tested in the cohesion
round did not produce a meaningful audible improvement, and every
independent generation carries its own drift risk — splitting a chunk
that doesn't need it trades a real cost (more generations, more
continuity risk) for a benefit the owner didn't actually hear. The
manifest was never changed to `m1-04a`/`m1-04b` at any point in this
process; there is nothing to revert. The split test files remain on disk
under `tts/module-01/cohesion-test/` as QA evidence for *why* this was
decided, not as production candidates.

## 3. `CADENCE_AUDIO_MASTER_PRESET_V1` (locked definition)

```
RAW ElevenLabs (Jane / eleven_v3)
  → Auphonic conservative Voice AutoEQ finish
  → align RAW and Auphonic (verify offset, correct for it)
  → blend 75% Auphonic / 25% RAW (linear-domain weights, amix normalize=0)
  → two-pass loudness normalization (I=-18 LUFS, LRA=7, TP=-2 dBTP)
  → canonical production MP3 (44.1kHz, mono, 128kbps)
```

**Auphonic settings** — the exact, unmodified configuration from the
approved comparison reference (`module-01-audio-finishing-review.md`),
reused verbatim, not reinterpreted:

```json
{
  "filtering": true, "filtermethod": "autoeq",
  "leveler": true, "compressor_speech": "soft",
  "normloudness": true, "loudnesstarget": -18, "maxpeak": -2,
  "loudnessmethod": "dialog",
  "denoise": false, "deverbamount": 0, "debreathamount": -1,
  "silence_cutter": false, "filler_cutter": false,
  "cough_cutter": false, "music_cutter": false
}
```

Known, disclosed caveat (unchanged from the original finding, repeated
here because it's load-bearing for this locked preset): `leveler` is ON
with `compressor_speech: "soft"` — the approved sound is the *combination*
of AutoEQ filtering and this gentle leveler, not AutoEQ alone. This is
being reused exactly as tested, not modified, per instruction.

No Studio Voice, no additional de-essing beyond what's in the Auphonic
config above, no new compressor, no denoise, no dereverb, no
enhancement/restoration, no bandwidth extension. The approved sound comes
from the tested chain and only the tested chain.

**Blend mixing method:** `ffmpeg amix` with `normalize=0` (disabling its
default auto-gain, which would otherwise silently override the intended
ratio) and explicit `weights='0.75 0.25'` — proven correct in the parallel
blend test (no clipping, no phase/comb artifact, confirmed via
cross-correlation alignment check before mixing).

**Alignment step is mandatory, every chunk, every time.** Auphonic's
processing does not guarantee sample-accurate duration/timing parity with
the RAW input (the M1-04 reference showed a clean, constant ~6.4s offset,
believed to be a free-tier intro/outro artifact) — every future chunk must
be re-verified, not assumed to match M1-04's exact offset.

## 4. Raw preservation (locked, universal)

Every ElevenLabs generation is saved to
`assets/audio/listen/headspa-mastery/module-01/raw/<chunk>.mp3` **before**
any finishing step, and is never modified afterward. Canonical production
audio lives at `assets/audio/listen/headspa-mastery/module-01/<chunk>.mp3`
and is derived from — never a substitute for — the raw file. This lets any
future remaster happen without spending ElevenLabs credits again. All 5
previously-generated chunks' raw copies were backfilled from their
existing (currently RAW-equivalent) canonical files as part of locking
this standard — see the production report for confirmation.

## 5. `qaStatus` discipline (locked)

`GENERATED` is only set once a chunk has: valid raw, valid Auphonic
processing under the settings above, valid verified alignment, valid
75/25 blend, valid final loudness-normalized production MP3. **Claude
never sets `APPROVED`** — that remains the owner's call after listening,
via Review Mode.

---

## Current blocker (as of this document's creation)

**`AUPHONIC_API_KEY` is not available in this session.** Per this task's
own explicit instruction ("If Auphonic key is unavailable in the Claude
process: STOP BEFORE processing the remaining batch and report the exact
blocker. Do not silently fall back to FFmpeg-only finishing."), no chunk
was pushed through the Auphonic/blend stage of this pipeline in this
session. What *was* done:

- This standard is locked and documented (this file).
- The reusable production script (`scripts/cadence-audio-produce.mjs`)
  implements the full pipeline above, end to end, and is ready to run the
  moment a key is available — see that script and the production report
  for what was and wasn't exercised without live Auphonic access.
- The 9 previously-ungenerated Module 1 chunks (M1-05, 06, 08–14) had
  their RAW ElevenLabs audio generated and preserved this session (see
  the production report) — raw generation does not require Auphonic and
  was not blocked.
- **No chunk's canonical production MP3 reflects the locked
  `CADENCE_AUDIO_MASTER_PRESET_V1` pipeline yet** — the 5
  previously-existing canonical files (M1-01/02/03/04/07) are still their
  original RAW ElevenLabs generations (never processed by Auphonic or
  blended), and the 9 newly-generated chunks have raw audio only, no
  canonical file yet. `qaStatus` was left as-is for all 14 rather than
  claiming compliance with a pipeline that hasn't actually run — see the
  production report for the exact current state of every chunk.

**To unblock:** provide `AUPHONIC_API_KEY` the same way as before (e.g. a
temporary file this session can read and then delete, or export it
directly in the terminal that launches this session) and ask for the
batch to run.
