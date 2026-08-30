# Module 1 — Cadence Master V2 Review (surgical dynamic-EQ de-essing)

**Status:** Evidence for the owner to review. **No preset has been
approved.** `CADENCE_AUDIO_MASTER_PRESET_V1` is not yet assigned to
anything — LIGHT and MEDIUM below are candidates only. Canonical
`m1-04.mp3` is unchanged. Nothing is committed.

**Why this round exists:** RAW's sibilance was too sharp. The original
FFmpeg de-esser (a blunt, single-band `deesser` filter) improved it but
left "a little too much" S intensity, and pushing that same blunt tool
harder (the Moderate/Stronger calibration) wasn't the right direction —
Auphonic's Voice AutoEQ proved that pushing sibilance control further
without more surgical targeting produces an audible lisp and changes
articulation. This round replaces the blunt tool with ffmpeg's
`adynamicequalizer` filter: a real dynamic EQ that only attenuates the
measured sibilant frequency band, and only *while* that band is actually
spiking — Jane stays fully open/bright the rest of the time, unlike a
filter that's always slightly engaged across the whole track.

---

## 1. Tooling confirmed

**FFmpeg 7.1** (same binary as every prior round, via the free
`imageio-ffmpeg` package — no new dependency). Filters confirmed present
before use: `adynamicequalizer`, `highpass`, `acompressor`, `loudnorm`,
`alimiter`, `astats`, `showspectrumpic` — all available, none required
stopping to report a missing tool.

## 2. How Jane's actual sibilance was located (not assumed)

A bandpass RMS/peak sweep across the raw M1-04 source (1-octave bands,
2kHz–14kHz), refined with a narrower Q=2 sweep, both directly on
`assets/audio/listen/headspa-mastery/module-01/raw/m1-04.mp3` — the file
was only read, never modified, for this analysis:

| Band center | RMS (1-oct) | Peak (1-oct) |
|---|---|---|
| 2000 Hz | −39.9 dB | −15.3 dB |
| 5000 Hz | −32.4 dB | −7.5 dB |
| 7000 Hz | −28.2 dB | −4.5 dB |
| **8000 Hz** | −27.0 dB | **−3.2 dB (loudest)** |
| **9000 Hz** | **−26.5 dB (loudest)** | −3.8 dB |
| 10000 Hz | −26.6 dB | −4.2 dB |
| 12000 Hz | −27.3 dB | −4.4 dB |

**Finding: Jane's sibilant energy peaks broadly across ~7.5–9.5 kHz, with
the sharpest concentration around 8–9 kHz** — confirmed visually in the
spectrogram (`master-v2-test/m1-04-master-v2-analysis.png`), which shows
continuous bright high-frequency content in that band throughout the file
and a hard ceiling around 15.7 kHz (the source's own natural bandwidth
limit). This is *not* the generic "4–7kHz" range often assumed for
sibilance by default — Jane's specific peak sits noticeably higher, which
is exactly why this was measured rather than assumed. **8500 Hz** was
chosen as the detection/target center — the midpoint of the measured peak
zone.

**High-pass filter: not used.** Content below 100Hz measured at −45.0dB
RMS — about 20dB below the broadband noise floor (−24.5dB). There's
nothing there to remove; adding a high-pass would have been processing for
its own sake, not because the evidence called for it.

## 3. The `adynamicequalizer` filter, documented (not guessed)

Full parameter reference pulled directly from FFmpeg's own docs
(`ffmpeg -h filter=adynamicequalizer` plus the official filter reference):

| Param | Meaning |
|---|---|
| `threshold` (0–100) | Detection trigger level. **Empirically calibrated** — the docs don't define its absolute units, and a sweep found the entire usable range sits between roughly 0.01 and ~0.5: `threshold=0` destroys the whole signal, everything above ~0.5 is nearly inert for this content. Both presets deliberately sit inside that narrow working band. |
| `dfrequency` / `tfrequency` | Detection center / target (cut) center, in Hz. Set to 8500 for both — the measured sibilance peak. |
| `dqfactor` / `tqfactor` | Detection / target bandwidth (Q). Set to 2 for both — narrow enough to stay specific to the sibilant band, not a broad swath of the treble. |
| `mode=cutabove` | Per ffmpeg's own docs: "cut frequencies above detection threshold" — the target band is only attenuated while the *detected* level is above `threshold`. This is the actual mechanism behind "duck only when it spikes, stay bright otherwise." |
| `dftype=bandpass` | Detector listens specifically in a band around `dfrequency`, not broadband. |
| `tftype=bell` | The cut itself is a parametric dip centered on `tfrequency` — not a shelf. A shelf would darken everything above a corner frequency permanently; `bell` returns to unity gain away from the target frequency, so it can never become "reduce the entire high end." |
| `attack=10`, `release=100` (ms) | Fast enough to catch a sibilant onset (typical "S" bursts run 50–150ms) without reacting to individual waveform cycles; release fast enough to let go before the next syllable, avoiding audible pumping/ducking of normal speech. Held constant between LIGHT and MEDIUM — only `threshold` differs between them. |
| `ratio=6`, `range=12` | Held constant between LIGHT and MEDIUM too. `range` (max cut, in the filter's own gain units) is deliberately conservative — this is the direct lisp-guard, analogous to the old deesser's `m` ceiling. |

Compressor: **not used.** Loudnorm already delivers clip-to-clip loudness
consistency, and the dynamic EQ is already a targeted dynamics processor
for the one actual problem (sibilance). A second, broadband compressor on
top wasn't shown to solve anything the above two don't already cover, and
risks reintroducing the "processed" quality the owner explicitly rejected
in Auphonic. Per instruction, it was left out rather than added
speculatively.

---

## 4. LIGHT vs. MEDIUM

Only `threshold` differs — everything else (frequency, Q, attack/release,
ratio, range, loudness target) is identical, isolating de-essing strength
as the one variable under test, same discipline as the earlier
Current/Moderate/Stronger round.

| | `threshold` | Target-band RMS (8500Hz, Q2) | Target-band peak |
|---|---|---|---|
| Raw (unprocessed) | — | −27.57 dB | −4.07 dB |
| **LIGHT** | 0.10 | −28.36 dB | −4.67 dB |
| **MEDIUM** | 0.04 | −28.99 dB | −4.92 dB |

Confirmed monotonic: **Raw < LIGHT < MEDIUM** in de-essing strength — a
real, measured step at each stage, not a guess. (This sanity check is
mechanical only, per instruction — it doesn't choose a winner.)

### Exact commands

```bash
# LIGHT
ffmpeg -i raw/m1-04.mp3 -af \
  "adynamicequalizer=threshold=0.10:dfrequency=8500:dqfactor=2:tfrequency=8500:tqfactor=2:attack=10:release=100:ratio=6:range=12:mode=cutabove:dftype=bandpass:tftype=bell,loudnorm=I=-18:LRA=7:TP=-2:print_format=json" \
  -f null -
# → measured_I=-20.91 measured_TP=-2.67 measured_LRA=6.80 measured_thresh=-32.58

ffmpeg -i raw/m1-04.mp3 -af \
  "adynamicequalizer=threshold=0.10:...:tftype=bell,loudnorm=I=-18:LRA=7:TP=-2:measured_I=-20.91:measured_TP=-2.67:measured_LRA=6.80:measured_thresh=-32.58:linear=true" \
  -ar 44100 -ac 1 -c:a libmp3lame -b:a 128k \
  master-v2-test/m1-04-master-v2-light.mp3

# MEDIUM — identical except threshold=0.04 and its own measured stats:
# measured_I=-21.44 measured_TP=-2.88 measured_LRA=6.40 measured_thresh=-33.02
```

Or, using the new reusable script (tested — its output is byte-identical
to the manual commands above):

```bash
node scripts/cadence-audio-master-v2.mjs --in=raw/m1-04.mp3 --out=<path> --preset=light
node scripts/cadence-audio-master-v2.mjs --in=raw/m1-04.mp3 --out=<path> --preset=medium
```

### Loudness (re-measured directly on the output files)

| | Integrated | True Peak | LRA | Duration |
|---|---|---|---|---|
| LIGHT | −19.2 LUFS | −1.7 dBTP | 4.6 LU | 00:02:26.13 |
| MEDIUM | −19.1 LUFS | −1.5 dBTP | 4.4 LU | 00:02:26.13 |

Matches the raw source's own duration exactly (no cuts, no added
intro/outro) and lands within 0.1 LUFS of each other — loudness-matched,
same as every prior round, so the comparison is about articulation, not
volume.

---

## 5. Files for the A/B/C/D/E review

| | Path |
|---|---|
| A — RAW | `assets/audio/listen/headspa-mastery/module-01/raw/m1-04.mp3` |
| B — Original FFmpeg finish | `docs/course-audit/listen-mode/tts/module-01/finishing-test/m1-04-finished-test.mp3` |
| C — Basic de-esser calibration family | Three variants exist from the prior round, and the owner never settled on one of them as "best" — all three are still here: `m1-04-finished-test.mp3` (same as B), `m1-04-finished-moderate-test.mp3`, `m1-04-finished-stronger-test.mp3`. If a single anchor is useful for this round's comparison, **Stronger** (`m1-04-finished-stronger-test.mp3`) is the most aggressive of that family and the closest the blunt-deesser approach got to addressing "still a little too much sibilance" — offered as a suggested reference point, not a chosen winner. |
| D — Cadence Master V2 LIGHT | `docs/course-audit/listen-mode/tts/module-01/master-v2-test/m1-04-master-v2-light.mp3` |
| E — Cadence Master V2 MEDIUM | `docs/course-audit/listen-mode/tts/module-01/master-v2-test/m1-04-master-v2-medium.mp3` |

Auphonic's rejected test file remains available, unmodified, at
`docs/course-audit/listen-mode/tts/module-01/auphonic-test/m1-04-auphonic-autoeq-test.mp3`
for reference only — it is not a production candidate.

```bash
open "assets/audio/listen/headspa-mastery/module-01/raw/m1-04.mp3"
open "docs/course-audit/listen-mode/tts/module-01/finishing-test/m1-04-finished-test.mp3"
open "docs/course-audit/listen-mode/tts/module-01/finishing-test/m1-04-finished-stronger-test.mp3"
open "docs/course-audit/listen-mode/tts/module-01/master-v2-test/m1-04-master-v2-light.mp3"
open "docs/course-audit/listen-mode/tts/module-01/master-v2-test/m1-04-master-v2-medium.mp3"
```

Spectral evidence: `docs/course-audit/listen-mode/tts/module-01/master-v2-test/m1-04-master-v2-analysis.png`

---

## 6. Owner review

- Which has the least fatiguing S?
- Is S still clearly articulated?
- Any lisp?
- Any dull/muffled quality?
- Does Jane retain her bright/open quality?
- Does the processed version sound invisible?
- Does it feel clean/crisp?
- Which would be easiest to hear for a 15–30 minute lesson?
- Which still sounds most like Cadence?

**Claude has not chosen a winner.** If the owner approves LIGHT or MEDIUM,
that exact chain becomes `CADENCE_AUDIO_MASTER_PRESET_V1` — not before.

---

## 7. Automation, if approved

```
approved TTS source
  → ElevenLabs Jane / eleven_v3
  → preserve untouched RAW
  → scripts/cadence-audio-master-v2.mjs (chosen preset)
  → verify format/loudness (the script already checks output non-empty;
    a wrapper step would additionally confirm duration and final LUFS
    before accepting the file)
  → set that chunk's qaStatus = 'GENERATED'
  → owner reviews
  → APPROVED or REGENERATE
```

Entirely local, entirely free (no cloud service, no per-minute cost, no
API key) — the whole appeal of this direction over Auphonic. Not wired
into any batch process yet; this remains a two-file, one-chunk candidate
test.
