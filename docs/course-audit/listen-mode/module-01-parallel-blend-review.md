# Module 1 — Auphonic/RAW Parallel Blend Review (FINAL post-processing experiment)

**Status:** Evidence for the owner to review. **No candidate has been
approved.** Canonical `m1-04.mp3` is unchanged. Nothing is committed.
**This is the final audio-processing experiment in this arc** — per
instruction, if none of these three is an obvious improvement, no further
blend ratios, EQ stages, or cloud platforms will be tried. See the
STOP-LOSS rule at the bottom.

**Why this round exists:** RAW is recognizably Jane but too sibilant for
long-form listening. Every local FFmpeg de-essing approach so far
(single-band, dual-band, hybrid, broad/deep) improved it "somewhat" but
not enough. Auphonic's Voice AutoEQ produced a noticeably cleaner, more
polished overall sound and did control sibilance — but far enough to
create an audible lisp. This round tests a different idea entirely: rather
than processing the audio further, **blend the two signals together in
parallel** — Auphonic contributing its overall polish/tonal balance/
sibilance reduction, RAW contributing back its natural consonant
articulation, Jane identity, and original brightness.

---

## 1–2. Source verification

| | Path | Status |
|---|---|---|
| RAW | `assets/audio/listen/headspa-mastery/module-01/raw/m1-04.mp3` | Verified: 44.1kHz mono MP3, 146.08s (146.13s container), byte-for-byte identical to the version committed at HEAD — genuinely untouched. |
| Auphonic | `docs/course-audit/listen-mode/tts/module-01/auphonic-test/m1-04-auphonic-autoeq-test.mp3` | Verified: 44.1kHz mono MP3, 158.93s. Same file used in the original Auphonic comparison — not reprocessed. |

Both decode cleanly and contain the complete spoken content (confirmed via
the alignment analysis below, which wouldn't produce a strong match if
either file were truncated or corrupted).

## 3. Auphonic settings actually used (verified against the original generation record)

Pulled directly from `module-01-audio-finishing-review.md`'s documented
API response — not re-derived from memory:

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

**Important finding, exactly per instruction:** `leveler` was **ON**
(`compressor_speech: "soft"`) in the file being used as "B — 100%
Auphonic" and as the Auphonic component of every blend. **This means the
lisp-like articulation change cannot be attributed to Voice AutoEQ
filtering alone** — Auphonic's own adaptive leveler/compressor was also
active and may have contributed. This is disclosed, not corrected, in this
round: no new Auphonic API key/session was available in this task (the
prior task's key was deleted per explicit instruction, and none was
re-supplied here), so per the task's own fallback instruction ("if the
existing Auphonic test already used essentially those settings: reuse
it... if not practical: reuse existing evidence and note the limitation
clearly") the **existing file was reused**, with this caveat now on
record. If a future task supplies API access again, a leveler-off
AutoEQ-only reference would isolate which mechanism actually caused the
lisp.

## 4. Alignment (mandatory, verified before any mixing)

Used local cross-correlation (numpy, installed locally — no cloud
service), not just duration comparison:

- **Naive full-waveform correlation was unreliable** (normalized peak
  ≈ −0.08, essentially noise) — expected, since Auphonic's EQ/dynamics
  processing reshapes the waveform's fine time-domain structure even when
  the underlying speech timing is unchanged. Raw-sample correlation is the
  wrong tool for this comparison.
- **Amplitude-envelope correlation** (20ms RMS windows, log-compressed) is
  robust to that kind of processing difference and found a clean, sharp
  peak: **normalized correlation 0.96** at a **6.400-second offset**
  (Auphonic's timeline = RAW's timeline + 6.400s) — a huge margin over the
  next-best candidate offset (0.24).
- **Drift check across the whole file:** the same 6.400s offset was
  independently confirmed at four separate points spanning the file (RAW
  segments 3–20s, 40–60s, 80–100s, 120–140s), each with strong correlation
  (0.945–0.971) and **exactly the same 6.400s shift every time.** This
  offset is constant, not drifting — the difference is entirely explained
  by Auphonic prepending roughly 6.4 seconds of non-speech content (almost
  certainly the free-tier jingle previously flagged) before the aligned
  narration begins, then appending a further ~6.4s tail after it ends
  (158.93 − 6.400 − 146.08 ≈ 6.45s, consistent with a matching outro).
- **Correction applied:** the Auphonic file was trimmed to
  `[6.400s, 6.400s + 146.08s]` and its timestamps reset to start at 0
  (`atrim=start=6.400:duration=146.08,asetpts=PTS-STARTPTS`) — a
  comparison copy only, never touching the original Auphonic test file.
  Re-running the correlation on the trimmed copy against RAW at zero
  offset confirmed **0.9631** — matching the pre-trim peak, validating the
  correction.
- **No meaningful nonlinear drift exists** — the STOP condition in Section
  4 of the task ("if meaningful nonlinear time drift exists: STOP") was
  not triggered.

## 5. Mixing method — technically correct gain scaling

Used ffmpeg's `amix` filter with **`normalize=0`** (explicitly disabling
its default automatic gain compensation, which would otherwise silently
override the requested ratios) and explicit **`weights`** applied directly
in the linear amplitude domain — not an arbitrary/default `amix` call:

```
[0:a]atrim=start=6.400:duration=146.08,asetpts=PTS-STARTPTS[auph];
[auph][1:a]amix=inputs=2:duration=first:weights='<A> <B>':normalize=0[mixed]
```

| Candidate | Weights | 
|---|---|
| A (75/25) | `weights='0.75 0.25'` |
| B (65/35) | `weights='0.65 0.35'` |
| C (55/45) | `weights='0.55 0.45'` |

Then two-pass `loudnorm` (measure, then apply with the real measured
stats) to the exact same I=-18/LRA=7/TP=-2 target used throughout this
whole arc. No de-esser, dynamic EQ, broad EQ, compressor, exciter,
denoise, reverb, or restoration was applied anywhere in this chain —
loudnorm is the only processing after the blend itself, per instruction.

**Clipping/cancellation check:** pre-loudnorm peaks for all three
candidates stayed between −4.0 and −5.5 dBTP (no clipping). A level
sanity check comparing the measured mix loudness against the
coherent-sum estimate from each source's own individual level (Auphonic
aligned: −19.65dB RMS; Raw: −24.53dB RMS) landed close to the predicted
coherent combination for each ratio — **not** below it, which is what
destructive phase cancellation/comb-filtering would look like. Combined
with the strong pre-mix alignment correlation, there is no evidence of a
phase artifact in any of the three candidates.

## 6. Loudness (measured, not assumed)

| Candidate | Integrated | True Peak | LRA | Duration |
|---|---|---|---|---|
| A — 75% Auphonic / 25% Raw | −17.9 LUFS | −2.0 dBTP | 3.9 LU | 00:02:26.13 |
| B — 65% Auphonic / 35% Raw | −17.9 LUFS | −2.0 dBTP | 3.7 LU | 00:02:26.13 |
| C — 55% Auphonic / 45% Raw | −18.0 LUFS | −2.0 dBTP | 3.8 LU | 00:02:26.13 |

Matched within 0.1 LUFS, identical true-peak ceiling, identical duration
to RAW (no cuts, no drift, no added silence) — the owner is judging the
blend itself, not volume.

---

## 7. Files

| | Path |
|---|---|
| A — RAW | `assets/audio/listen/headspa-mastery/module-01/raw/m1-04.mp3` |
| B — 100% Auphonic ("clean but lispy" reference) | `docs/course-audit/listen-mode/tts/module-01/auphonic-test/m1-04-auphonic-autoeq-test.mp3` (remember: first/last ~6.4s are the jingle, not Jane) |
| C — 75% Auphonic / 25% Raw | `docs/course-audit/listen-mode/tts/module-01/parallel-blend-test/m1-04-auphonic75-raw25.mp3` |
| D — 65% Auphonic / 35% Raw | `docs/course-audit/listen-mode/tts/module-01/parallel-blend-test/m1-04-auphonic65-raw35.mp3` |
| E — 55% Auphonic / 45% Raw | `docs/course-audit/listen-mode/tts/module-01/parallel-blend-test/m1-04-auphonic55-raw45.mp3` |

```bash
open "assets/audio/listen/headspa-mastery/module-01/raw/m1-04.mp3"
open "docs/course-audit/listen-mode/tts/module-01/auphonic-test/m1-04-auphonic-autoeq-test.mp3"
open "docs/course-audit/listen-mode/tts/module-01/parallel-blend-test/m1-04-auphonic75-raw25.mp3"
open "docs/course-audit/listen-mode/tts/module-01/parallel-blend-test/m1-04-auphonic65-raw35.mp3"
open "docs/course-audit/listen-mode/tts/module-01/parallel-blend-test/m1-04-auphonic55-raw45.mp3"
```

## 8. Owner review

The target: **the owner stops noticing the S, without noticing the
processing.**

- S no longer harsh?
- No lisp?
- Jane still sounds like Jane?
- Auphonic's clean/crisp quality remains?
- No phasey/chorused/hollow sound?
- No dullness?
- Comfortable for 15–30 minutes?

**Claude has not chosen a winner.**

---

## 9. STOP-LOSS RULE — read before requesting further audio work

**This was the final planned audio-processing experiment.** If none of
Candidates C/D/E is an obvious improvement over the existing local
FFmpeg finishes and V2/V3 candidates already on file, the instruction is
explicit:

> **NO CLEAR WINNER — STOP-LOSS TRIGGERED.**
> Do not invent more blend ratios, add more EQ stages, add multiband
> compression, or test another cloud mastering platform.

The next decision at that point is a product one, not an engineering one:

**A.** Accept the best simple Jane/v3 finish already produced across this
whole arc (RAW, a local FFmpeg de-ess/dynamic-EQ variant, or one of these
blends), or
**B.** Reconsider Jane specifically for long-form narration.

No production pipeline change, `qaStatus`, or `CADENCE_AUDIO_MASTER_PRESET_V1`
assignment happens until the owner makes that call.
