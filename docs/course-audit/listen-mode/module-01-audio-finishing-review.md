# Module 1 — Audio Finishing A/B Review (de-ess + loudness normalization)

**Status:** Evidence for the owner to review. **`CADENCE_AUDIO_FINISHING_PRESET_V1`
is proposed, not locked.** Nothing has been approved. No other clip besides
this one test file has been processed. Canonical `m1-04.mp3` is unchanged.

This exists because the owner noticed slightly harsh sibilance on some "S"
sounds in the Jane/Eleven v3 generations, and wants one automatic, reusable
finishing step — not a manual audio-editor workflow — applied consistently
after every future generation.

---

## Tool used

**FFmpeg 7.1**, built with `libmp3lame` (MP3 encoding), `--enable-gpl`, and
the filters this needed (`deesser`, `loudnorm`). Not preinstalled and no
Homebrew/MacPorts available on this machine, so it was obtained via
`pip3 install --user imageio-ffmpeg` — a free, MIT-licensed PyPI package
that bundles the standard static ffmpeg binary. Nothing paid was installed;
nothing was downloaded from an unvetted source (PyPI is the same trusted
channel `pip` always uses). Both required filters were confirmed present
and inspected (`-h filter=deesser`, `-h filter=loudnorm`) before anything
was generated.

If the owner's own machine already has ffmpeg (e.g. via Homebrew), the
finishing script prefers that automatically and never touches the
Python package — see `scripts/cadence-audio-finish.mjs`'s `resolveFfmpeg()`.

---

## Filters used, and why nothing else

**A. De-essing — ffmpeg's built-in `deesser` filter:**
```
deesser=i=0.22:m=0.4:f=0.5
```
- `i=0.22` (intensity, 0–1 scale) — calibrated, not guessed. The filter's
  own "ess-only" monitoring mode (`s=e`, which outputs *just* the removed
  sibilant signal so it can be checked in isolation) showed the filter was
  essentially inactive below `i≈0.18` (near-digital-silence in the
  extracted ess signal) and clearly engaged by `i=0.3` (extracted ess RMS
  within ~5dB of the track's overall RMS — a lot more aggressive).
  `i=0.22` sits in between: measurably active, well short of the point
  where it starts consuming a large share of the track's energy.
- `m=0.4` (max deessing ceiling) — caps how much any single sibilant
  moment can be attenuated, specifically so the filter can never fully
  remove a consonant (guards against the "no lisping" requirement by
  construction, not just by ear).
- `f=0.5` — left at the filter's own default (its normalized detection
  frequency), no evidence to justify moving it.

**B. Loudness — ffmpeg's built-in `loudnorm` filter, two-pass:**
```
Pass 1 (measure): loudnorm=I=-18:LRA=7:TP=-2:print_format=json
Pass 2 (apply):    loudnorm=I=-18:LRA=7:TP=-2:measured_I=<from pass 1>:
                    measured_TP=<...>:measured_LRA=<...>:measured_thresh=<...>:
                    linear=true
```
- Two-pass (measure the real file, then apply using those exact
  measurements) rather than loudnorm's single-pass real-time mode — this
  is ffmpeg's own recommended usage and is materially more accurate.
- `I=-18` LUFS integrated target — a moderate narration/e-learning level,
  deliberately *not* a hot podcast target (-16 or louder), consistent with
  "we are not trying to create a radio/podcast sound."
- `TP=-2` dBTP true-peak ceiling and `LRA=7` loudness-range target are
  ffmpeg's own sane defaults for spoken content; left unchanged.
- For this specific file, ffmpeg's own safety logic selected "Dynamic"
  normalization rather than pure linear gain, because the raw
  generation's peaks already sit close to the ceiling (measured true peak
  −3.5 dBTP against a −2 dBTP target) — a straight linear gain lift would
  have pushed peaks past 0 dBFS. This is `loudnorm` protecting against
  clipping, not a separate compressor bolted on: the resulting loudness
  range only tightened from 6.3 LU to 4.6 LU (a real but modest change,
  nowhere near the kind of squashing "heavy compression" implies).

**Nothing else was applied.** No separate compressor/limiter plugin, no
EQ beyond what de-essing itself does, no reverb, no noise gate, no
exciter/enhancer — matching the explicit "keep processing subtle"
instruction.

**Output format:** re-encoded to the same production spec as every
existing chunk — MP3, 44.1kHz, mono, 128kbps (`libmp3lame`). Verified with
`file(1)` after writing.

---

## Files

| | Path |
|---|---|
| Raw (untouched) generation | `assets/audio/listen/headspa-mastery/module-01/raw/m1-04.mp3` |
| Canonical production file (unchanged, still the raw generation) | `assets/audio/listen/headspa-mastery/module-01/m1-04.mp3` |
| **ORIGINAL** for A/B listening | `docs/course-audit/listen-mode/tts/module-01/finishing-test/m1-04-original-reference.mp3` (identical bytes to the raw file above, just placed next to the finished test for convenience) |
| **FINISHED** for A/B listening | `docs/course-audit/listen-mode/tts/module-01/finishing-test/m1-04-finished-test.mp3` |

The raw and canonical files are byte-identical right now (verified by
SHA-256) — nothing has diverged yet. The `raw/` folder exists specifically
so that once finishing *is* approved and applied to the canonical path,
the untouched original stays available for future re-tuning without
spending more ElevenLabs credits.

## Exact command to reproduce this test

```bash
node scripts/cadence-audio-finish.mjs \
  --in=assets/audio/listen/headspa-mastery/module-01/raw/m1-04.mp3 \
  --out=docs/course-audit/listen-mode/tts/module-01/finishing-test/m1-04-finished-test.mp3
```

This is the actual, tested, reusable script — not a one-off shell
invocation. Running it twice on the same input produces byte-identical
output (verified).

---

## Owner review — listen for

Play `m1-04-original-reference.mp3`, then `m1-04-finished-test.mp3`,
ideally back to back more than once.

- [ ] Harsh S sounds reduced?
- [ ] Jane still sounds open/bright (not dulled)?
- [ ] No lisping?
- [ ] No dull/muffled tone?
- [ ] No obvious processing — doesn't sound "produced" or "podcast-y"?
- [ ] Volume feels controlled (consistent, not pumping or uneven)?
- [ ] Personality unchanged — still recognizably Jane/Cadence?

**Claude has not approved this preset.** No file was marked `APPROVED`,
and `qaStatus` for m1-04 in the manifest is untouched (`GENERATED`) — this
review is a precondition for the owner to decide, not a decision already
made.

---

## Proposed `CADENCE_AUDIO_FINISHING_PRESET_V1`

Defined once, in code, at the top of `scripts/cadence-audio-finish.mjs`:

```js
const PRESET = {
  name: 'CADENCE_AUDIO_FINISHING_PRESET_V1',
  deesser: { i: 0.22, m: 0.4, f: 0.5 },
  loudnorm: { I: -18, LRA: 7, TP: -2 },
  output: { sampleRateHz: 44100, channels: 1, codec: 'libmp3lame', bitrateKbps: 128 }
};
```

If the owner approves this A/B test, "locking" the preset means: leave
these constants as-is and start actually invoking the script as a real
step in the generation pipeline (see below) — no code change needed to
"activate" it beyond that decision. If the owner wants it tuned further,
only these five numbers need to move; the script's structure (two-pass
loudnorm, de-ess before loudnorm, same output spec) doesn't need to
change for a re-tune.

---

## How this becomes the automatic pipeline (Section 8 design, not yet wired up)

The intended future batch/single-chunk generation flow, once approved:

```
generate chunk (ElevenLabs)
  → download to raw/<chunk>.mp3           (preserve, never touched again)
  → node scripts/cadence-audio-finish.mjs --in=raw/<chunk>.mp3 --out=<chunk>.mp3
  → verify output exists and is non-zero  (the script already does this itself)
  → set that chunk's qaStatus = 'GENERATED' in assets/js/aimt-listen-mode-data.js
  → owner listens to the FINISHED canonical file
  → owner sets qaStatus = 'APPROVED' or 'REGENERATE'
```

No separate owner action between generation and processing — the finishing
step runs automatically as part of producing each canonical file, and the
owner's only manual step stays exactly what it already is today: listening
and flipping `qaStatus`. This task did not wire that automation up or run
it on anything beyond the one M1-04 test file — that's deliberately saved
for after this review.
