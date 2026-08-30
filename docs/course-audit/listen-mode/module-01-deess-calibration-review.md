# Module 1 — De-Ess Calibration Review (RAW vs. Current vs. Moderate vs. Stronger)

**Status:** Evidence for the owner to review. **No preset has been approved
or renamed.** `CADENCE_AUDIO_FINISHING_PRESET_V1` still refers only to the
original candidate (`i=0.22:m=0.4:f=0.5`) — it is not reassigned to any of
these variants until the owner picks one. Canonical `m1-04.mp3` is
unchanged. Nothing is committed.

**Context:** After comparing RAW, the current FFmpeg finish, and Auphonic's
Voice AutoEQ, the owner's verdict was: RAW's sibilance is too sharp,
Auphonic is rejected outright (audible lisp/articulation change), and the
current FFmpeg finish is "clearly better, but S sounds are still a little
too intense." This round exists to find that middle ground — two stepped
increases in de-essing strength beyond the current preset, generated fresh
from the untouched raw source (not from the already-processed FFmpeg or
Auphonic files).

---

## 1. What the `deesser` filter's parameters actually mean

Documented directly from `ffmpeg -h filter=deesser` (not assumed):

```
i   set intensity (0 to 1, default 0)     — how strongly the filter reduces detected sibilance
m   set max deessing (0 to 1, default 0.5) — a ceiling: caps how much reduction can ever be
                                              applied, regardless of how high i is set. This is
                                              what prevents the filter from ever fully removing
                                              a consonant (the "no lisp" guard).
f   set frequency (0 to 1, default 0.5)   — normalized target frequency band for detection;
                                              not literal Hz. Left unchanged in this round.
s   output mode (i=input / o=output / e=ess-only) — 'e' isolates just the removed sibilant
                                              signal, used below to verify the strength ordering.
```

Only `i` (intensity) was changed for this calibration round. `m` (the
lisp-guard ceiling) and `f` were deliberately held at the current preset's
values (0.4 and 0.5) — this isolates de-essing *strength* as the one
variable under test, per the task's "calibrating de-essing only" scope.

---

## 2. The three FFmpeg presets compared

| | `i` | `m` | `f` | Loudness target |
|---|---|---|---|---|
| **Current** (existing) | 0.22 | 0.4 | 0.5 | I=-18, LRA=7, TP=-2 |
| **Moderate** (new) | 0.26 | 0.4 | 0.5 | I=-18, LRA=7, TP=-2 |
| **Stronger** (new) | 0.30 | 0.4 | 0.5 | I=-18, LRA=7, TP=-2 |

All three use identical loudness normalization settings — the owner is
comparing articulation, not being fooled by a louder or quieter file (see
Section 5 verification below).

### Exact commands used (two-pass loudnorm, same pattern as the original test)

**Moderate:**
```bash
ffmpeg -i raw/m1-04.mp3 \
  -af "deesser=i=0.26:m=0.4:f=0.5,loudnorm=I=-18:LRA=7:TP=-2:print_format=json" \
  -f null -
# → measured_I=-23.63 measured_TP=-4.55 measured_LRA=5.10 measured_thresh=-34.98

ffmpeg -i raw/m1-04.mp3 \
  -af "deesser=i=0.26:m=0.4:f=0.5,loudnorm=I=-18:LRA=7:TP=-2:measured_I=-23.63:measured_TP=-4.55:measured_LRA=5.10:measured_thresh=-34.98:linear=true" \
  -ar 44100 -ac 1 -c:a libmp3lame -b:a 128k \
  finishing-test/m1-04-finished-moderate-test.mp3
```

**Stronger:**
```bash
ffmpeg -i raw/m1-04.mp3 \
  -af "deesser=i=0.30:m=0.4:f=0.5,loudnorm=I=-18:LRA=7:TP=-2:print_format=json" \
  -f null -
# → measured_I=-26.12 measured_TP=-7.67 measured_LRA=4.20 measured_thresh=-37.32

ffmpeg -i raw/m1-04.mp3 \
  -af "deesser=i=0.30:m=0.4:f=0.5,loudnorm=I=-18:LRA=7:TP=-2:measured_I=-26.12:measured_TP=-7.67:measured_LRA=4.20:measured_thresh=-37.32:linear=true" \
  -ar 44100 -ac 1 -c:a libmp3lame -b:a 128k \
  finishing-test/m1-04-finished-stronger-test.mp3
```

Both generated directly from `assets/audio/listen/headspa-mastery/module-01/raw/m1-04.mp3`
(the untouched ElevenLabs source, re-verified byte-identical to the
original before this round started) — never from the already-processed
"current" FFmpeg file or the Auphonic file.

---

## 3. Sanity check: is Moderate actually stronger than Current, and Stronger actually stronger than Moderate?

Per instruction, this is a mechanical check only — **not** how the winner
gets picked. Using the de-esser's own `s=e` ("ess-only") monitoring mode,
which isolates *just* the sibilant content the filter removed, measured
against the raw source's overall RMS of −24.53 dB:

| Preset | Isolated ess-signal RMS | Isolated ess-signal peak |
|---|---|---|
| Current (i=0.22) | −43.08 dB | −13.70 dB |
| Moderate (i=0.26) | −33.59 dB | −6.70 dB |
| Stronger (i=0.30) | −29.46 dB | −4.43 dB |

Confirmed: **Current < Moderate < Stronger**, monotonically, by a clear
margin at each step (~9.5 dB more removed content from Current→Moderate,
~4.1 dB more from Moderate→Stronger) — not a trivial or accidental
difference. Nothing was maxed out; both new values stay well short of 1.0,
and Stronger (0.30) sits at the same intensity this task's own prior
calibration work flagged as "approaching aggressive" — deliberately not
pushed further into where Auphonic's rejected lisp territory was.

---

## 4. Loudness verification (Section 5 requirement)

Freshly re-measured (single-pass) on the actual output files, independent
of the two-pass generation numbers above:

| File | Integrated | True Peak | LRA |
|---|---|---|---|
| Raw (unprocessed) | −20.3 LUFS | −2.1 dBTP | 7.2 LU |
| Current | −19.0 LUFS | −2.0 dBTP | 4.7 LU |
| Moderate | −18.8 LUFS | −2.0 dBTP | 4.2 LU |
| Stronger | −18.7 LUFS | −1.9 dBTP | 3.9 LU |

Current/Moderate/Stronger land within 0.3 LUFS of each other and at an
identical true-peak ceiling — loudness-matched, as required. (Raw is
intentionally excluded from that match — it's the unprocessed control.)

**Durations:** all four files (raw, current, moderate, stronger) measure
identically at 00:02:26.13 — no accidental cuts, no added intro/outro.

---

## 5. Files

| | Path |
|---|---|
| A — RAW | `assets/audio/listen/headspa-mastery/module-01/raw/m1-04.mp3` |
| B — Current FFmpeg | `docs/course-audit/listen-mode/tts/module-01/finishing-test/m1-04-finished-test.mp3` |
| C — Moderate | `docs/course-audit/listen-mode/tts/module-01/finishing-test/m1-04-finished-moderate-test.mp3` |
| D — Stronger | `docs/course-audit/listen-mode/tts/module-01/finishing-test/m1-04-finished-stronger-test.mp3` |

Auphonic's rejected test file is untouched and still available at
`docs/course-audit/listen-mode/tts/module-01/auphonic-test/m1-04-auphonic-autoeq-test.mp3`
for reference, though it's no longer a production candidate.

```bash
open "assets/audio/listen/headspa-mastery/module-01/raw/m1-04.mp3"
open "docs/course-audit/listen-mode/tts/module-01/finishing-test/m1-04-finished-test.mp3"
open "docs/course-audit/listen-mode/tts/module-01/finishing-test/m1-04-finished-moderate-test.mp3"
open "docs/course-audit/listen-mode/tts/module-01/finishing-test/m1-04-finished-stronger-test.mp3"
```

---

## 6. Owner review

Listen to A, B, C, D — ideally more than once, in that order and then
mixed up.

- Harsh S reduction?
- Any lisp?
- Any dullness?
- Jane's brightness preserved?
- Intelligibility?
- Overall listening comfort?
- Is the processing itself noticeable?
- Which would be easiest to listen to for 15–30 minutes straight?

**Claude has not chosen a winner.** No file is approved, `CADENCE_AUDIO_FINISHING_PRESET_V1`
has not been reassigned to any of these three candidates, the manifest is
untouched, and nothing has been committed. Once the owner picks A, B, C, or
D (or asks for a different step size entirely), that choice — and only
that choice — becomes the locked preset.
