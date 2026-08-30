# Module 1 Listen Mode — LOCKED Production Standard

**Status: LOCKED by owner decision, 2026-08-30 (chunking + `CADENCE_AUDIO_MASTER_PRESET_V1`), updated 2026-08-30 (finishing direction moved to `CADENCE_CAPCUT_FINISH_PRESET_V1`).** This document is the
single source of truth for how Cadence Listen Mode audio gets produced
going forward. It supersedes the exploratory framing in every prior
comparison doc in this directory (cohesion, finishing, de-ess calibration,
Master V2/V3, Auphonic comparison, parallel blend, CapCut proof rounds) —
those remain on file as the evidence this standard was chosen from, not as
competing options.

---

## 1. Chunking standard (locked, unchanged)

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

This chunking standard governs semantic granularity only. It is
independent of the finishing pipeline below — cross-chunk tonal
consistency is now handled by finishing the whole module in one pass
(Section 4), not by generating fewer/larger ElevenLabs chunks.

## 2. M1-04 — final decision (locked, unchanged)

**M1-04 stays ONE production chunk.** The A/B split tested in the cohesion
round did not produce a meaningful audible improvement, and every
independent generation carries its own drift risk — splitting a chunk
that doesn't need it trades a real cost (more generations, more
continuity risk) for a benefit the owner didn't actually hear. The
manifest was never changed to `m1-04a`/`m1-04b` at any point in this
process; there is nothing to revert. The split test files remain on disk
under `tts/module-01/cohesion-test/` as QA evidence for *why* this was
decided, not as production candidates.

## 3. `CADENCE_CAPCUT_FINISH_PRESET_V1` — ACTIVE finishing preset (locked 2026-08-30)

**This is the active AIMT Listen Mode finishing direction**, chosen after
a real CapCut round-trip proof (raw → CapCut Enhance Voice → automatic
position-anchored re-split) passed technically and the owner preferred the
result over every Auphonic/FFmpeg alternative tested (see Section 6 for
why those are now historical).

The exact, owner-approved manual CapCut settings — reused verbatim, not
reinterpreted, on every future module:

**CapCut Basic:**
- Volume: **0.0 dB**
- Fade in: **0.0 seconds**
- Fade out: **0.0 seconds**
- Normalize loudness: **ON**
- CapCut-displayed normalization target: **−23 LUFS**

**CapCut Enhancement:**
- Enhance voice: **ON**
- Enhance voice intensity: **75**
- Reduce noise: **ON**
- Isolate voice: **OFF**
- Audio translator: **OFF**
- Voice changer: **OFF**
- Speed: **unchanged / 1.0x**

**No additional processing of any kind:** no EQ preset, no pitch change,
no reverb, no voice effect, no silence removal, no manual cuts, no fades
beyond the 0.0s settings above, no separate dynamics processing.

**IMPORTANT — do not chain the old Auphonic master onto a CapCut export.**
The owner approved the sound of the CapCut result exactly as heard, with
Normalize Loudness ON at CapCut's own displayed −23 LUFS target. Applying
`CADENCE_AUDIO_MASTER_PRESET_V1`'s −18 LUFS pass (or any other loudness
change) after CapCut would change the approved sound and is not part of
this preset.

## 4. Active production flow (locked 2026-08-30)

```
approved narration
  → ElevenLabs Jane / eleven_v3 generates semantic raw chunks
  → preserve every raw chunk (Section 5 — never overwritten)
  → concatenate ALL of a module's raw chunks into ONE temporary master
  → insert deterministic 2.0s digital-silence boundary markers between
    chunks only (none before the first chunk, none after the last)
  → owner runs ONE CapCut pass on the whole module master, using
    CADENCE_CAPCUT_FINISH_PRESET_V1 exactly as documented above
  → owner exports one lossless (FLAC or WAV) processed master
  → automatic position-anchored boundary detection locates the markers
    (scripts/cadence-capcut-resplit.mjs — see Section 7)
  → automatic re-split recovers the original semantic chunks
  → technical verification (duration/drift/no-speech-loss/no-clipping)
  → install as canonical production MP3s
  → qaStatus = GENERATED
  → owner does final listening QA on the canonical chunks
  → owner explicitly marks APPROVED or REGENERATE (Claude never sets
    APPROVED — see Section 8)
```

**Manual workload goal: approximately ONE CapCut processing/export action
per module** — not one per chunk. The temporary boundary markers are a
production-only artifact of this pipeline; they never exist in canonical
student-facing audio, and CapCut processing must never alter checkpoint
architecture, chunk semantic identity, transcript text, course progress,
or grading authority (all of that lives in `assets/js/aimt-listen-mode-data.js`
and the course app, untouched by anything in this pipeline).

## 5. Raw preservation (locked, universal, unchanged)

Every ElevenLabs generation is saved to
`assets/audio/listen/headspa-mastery/module-01/raw/<chunk>.mp3` **before**
any finishing step, and is never modified afterward — this file remains
the authoritative source for any future remaster, on any finishing
pipeline, without spending ElevenLabs credits again. Canonical production
audio lives at `assets/audio/listen/headspa-mastery/module-01/<chunk>.mp3`
and is derived from — never a substitute for — the raw file.

## 6. `CADENCE_AUDIO_MASTER_PRESET_V1` — HISTORICAL QA / SUPERSEDED (2026-08-30)

This preset (RAW → Auphonic conservative Voice AutoEQ → alignment →
75/25 Auphonic/RAW blend → −18 LUFS loudnorm) was the first locked
finishing standard, chosen on 2026-08-30 after the Auphonic/RAW parallel
blend comparison round. It **is no longer the active production path** —
the owner tested it against a real CapCut round-trip and preferred
CapCut's result, so `CADENCE_CAPCUT_FINISH_PRESET_V1` (Section 3)
replaces it for all new production work.

**Nothing about this supersession deletes or invalidates the evidence
that produced it.** All of the following remain on disk, unmodified, as
historical QA / audit record — not as candidates for new production:

- `module-01-audio-finishing-review.md` (FFmpeg de-ess/loudnorm A/B)
- `module-01-deess-calibration-review.md` (Moderate/Stronger de-ess)
- `module-01-auphonic-comparison-review.md` (Auphonic AutoEQ test)
- `module-01-master-v2-review.md`, `module-01-master-v3-review.md`
  (local dynamic-EQ candidates)
- `module-01-parallel-blend-review.md` (Auphonic/RAW blend ratios —
  the round that produced `CADENCE_AUDIO_MASTER_PRESET_V1` itself)
- `scripts/cadence-audio-finish.mjs`, `scripts/cadence-audio-master-v2.mjs`,
  `scripts/cadence-audio-master-v3.mjs`, `scripts/cadence-audio-produce.mjs`
  (the FFmpeg/Auphonic production scripts these rounds built)

The original preset definition, reproduced here for the audit record only
(not for reuse):

```
RAW ElevenLabs (Jane / eleven_v3)
  → Auphonic conservative Voice AutoEQ finish
  → align RAW and Auphonic (verify offset, correct for it)
  → blend 75% Auphonic / 25% RAW (linear-domain weights, amix normalize=0)
  → two-pass loudness normalization (I=-18 LUFS, LRA=7, TP=-2 dBTP)
  → canonical production MP3 (44.1kHz, mono, 128kbps)
```

No chunk was ever installed to canonical audio under this preset —
`AUPHONIC_API_KEY` was unavailable for the entire time it was active, so
this supersession discards no in-progress production work.

## 7. Boundary recovery must remain position-anchored (locked 2026-08-30)

`scripts/cadence-capcut-resplit.mjs` locates each expected separator by
searching near its **manifest-predicted position** (±10s) for the nearest
duration-plausible silence (1.0s–3.2s), rather than filtering for
duration-plausible silences globally across the whole file. This is not
optional: real CapCut Enhance Voice / Reduce Noise processing has been
observed to push natural mid-speech pauses below the silence-detection
noise floor at rates that a flat global filter cannot distinguish from
the deliberate 2.0s markers (confirmed on both the 4-chunk and 14-chunk
Module 1 masters — see the CapCut production report). A separator with no
plausible match near its expected position is reported unmatched and the
script stops rather than guessing.

## 8. `qaStatus` discipline (locked, unchanged)

`GENERATED` is only set once a chunk has: valid raw, a valid CapCut pass
under `CADENCE_CAPCUT_FINISH_PRESET_V1`, valid position-anchored
boundary recovery, valid technical verification (duration/drift/no
speech loss/no clipping), and a valid final canonical production MP3.
**Claude never sets `APPROVED`** — that remains the owner's call after
listening, via Review Mode.
