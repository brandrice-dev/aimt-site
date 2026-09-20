# Module 1 — Cadence Master V3 Review (finding the middle ground)

**Status:** Evidence for the owner to review. **No preset has been
approved.** `CADENCE_AUDIO_MASTER_PRESET_V1` is not assigned to anything
yet. Canonical `m1-04.mp3` is unchanged. Nothing is committed.

**Why this round exists:** V2 LIGHT/MEDIUM (one dynamic-EQ band at
~8.5kHz) weren't strong enough for comfortable long-form listening.
Auphonic was strong enough — clean and crisp — but its sibilance control
went far enough to audibly alter articulation (a lisp). This round tests
three *architecturally different* ways to get more control than V2
without Auphonic's failure mode — not just "V2 turned up."

---

## 1–3. The three candidates

All three start from the same measured finding as V2: Jane's sibilant
energy concentrates broadly across **~7.5–9.5 kHz**, peaking around
**8–9 kHz** (re-confirmed against the freshly checksum-verified raw
source before any processing began).

### V3-A — Dual-band dynamic de-sibilance

**Hypothesis:** one band asked to cover the whole 2kHz-wide harsh region
has to work harder (per-band) than two bands splitting the same territory.
Two independent `adynamicequalizer` stages, each narrower and individually
gentler than V2's single band:

```
adynamicequalizer=threshold=0.035:dfrequency=7750:dqfactor=4:tfrequency=7750:tqfactor=4:attack=10:release=100:ratio=6:range=10:mode=cutabove:dftype=bandpass:tftype=bell,
adynamicequalizer=threshold=0.035:dfrequency=9250:dqfactor=4:tfrequency=9250:tqfactor=4:attack=10:release=100:ratio=6:range=10:mode=cutabove:dftype=bandpass:tftype=bell
```
Lower band centered 7750Hz, upper band centered 9250Hz — together spanning
the full measured region with some overlap around 8–8.5kHz so there's no
gap at the peak. Each band's `range` ceiling (10) is lower than V2's (12),
consistent with "each band should make a smaller reduction than an
aggressive single-band solution."

### V3-B — Dynamic EQ + very light deesser cleanup

**Hypothesis:** let the dynamic EQ do the bulk of the work (as in V2), then
use a conventional `deesser` — but genuinely light, not the old i=0.22 —
to mop up whatever peaks the dynamic EQ's threshold doesn't catch.

```
adynamicequalizer=threshold=0.04:dfrequency=8500:dqfactor=2:tfrequency=8500:tqfactor=2:attack=10:release=100:ratio=6:range=12:mode=cutabove:dftype=bandpass:tftype=bell,
deesser=i=0.19:m=0.25:f=0.5
```
The dynamic-EQ stage is identical to V2 MEDIUM. The deesser (`i=0.19`,
`m=0.25`) is substantially lighter than the old single-tool preset
(`i=0.22:m=0.4`) on both parameters — an earlier, gentler attempt at this
stage (`i=0.16`) was tested first and found to add **zero measurable
effect** on top of the dynamic EQ (a real, useful null result, not a
guess) — `i=0.19` was the value that actually started contributing
measurable cleanup without approaching the old preset's strength.

### V3-C — Broader/deeper single-stage dynamic EQ

**Hypothesis:** keep the architecture as simple as V2 (one stage), but
retune it — Q, threshold, ratio, and range together — to control the
measured region more effectively than V2 MEDIUM, with the `range` ceiling
doing explicit, deliberate duty as the articulation-protection limit.

```
adynamicequalizer=threshold=0.02:dfrequency=8500:dqfactor=3:tfrequency=8500:tqfactor=3:attack=10:release=120:ratio=9:range=16:mode=cutabove:dftype=bandpass:tftype=bell
```
Narrower Q (3, vs. V2's 2) focuses the band more tightly on the measured
region; lower threshold (0.02, vs. MEDIUM's 0.04) and higher ratio (9)
make it react more readily and more strongly once triggered; `range=16` is
a real increase over V2's ceiling but is still an explicit, finite cap —
not "no limit."

All three: same 44.1kHz/mono/128kbps MP3 output as every prior round.

---

## 4. Measured sibilance reduction by band (guardrail check, Section 8)

Peak level in three fixed 1kHz-wide bands, before final loudness
normalization (so the comparison reflects the de-essing stage itself, not
loudnorm's separate gain shift):

| | 7–8 kHz | 8–9 kHz | 9–10 kHz | Overall |
|---|---|---|---|---|
| RAW (baseline) | −7.05 dB | −5.56 dB | −6.26 dB | −2.76 dB |
| V2 MEDIUM (reference) | −7.12 (−0.07) | −6.93 (**−1.37**) | −7.15 (−0.89) | −3.55 |
| **V3-A** dual-band | −7.11 (−0.06) | −6.91 (−1.35) | −7.19 (−0.93) | −3.61 |
| **V3-B** hybrid | −7.35 (−0.30) | −7.45 (**−1.89**) | −7.51 (−1.25) | −4.10 |
| **V3-C** broad/deep | −8.47 (**−1.42**) | −6.96 (−1.40) | −7.20 (−0.94) | −3.63 |

(Values in parentheses are dB removed vs. RAW in that band — larger
magnitude = more reduction.)

**Reading this table:**
- **V3-A** lands almost exactly at V2 MEDIUM's overall strength but
  reshapes *where* the reduction happens — slightly more even across all
  three bands rather than concentrated in 8–9kHz. This is the distributed
  hypothesis actually being tested, not a stronger-or-weaker claim.
- **V3-B** is clearly the strongest in the 8–9kHz peak zone specifically
  (−1.89dB, the largest single number in the table) — the light deesser
  cleanup stage is doing real, measurable work on top of the dynamic EQ,
  not nothing.
- **V3-C** is the most *aggressive in the 7–8kHz band specifically*
  (−1.42dB, more than double V2 MEDIUM's −0.07dB there) while staying
  close to MEDIUM in 8–9kHz and 9–10kHz — its wider effective reach (from
  the retuned Q/threshold/ratio) pulls more of the lower sibilance shoulder
  under control than any other candidate.

**Disproportionate-reduction flag (required check, not a verdict):** no
candidate shows one band being cut dramatically harder than the others in
a way disconnected from the actual measured sibilance shape. The largest
single-band delta in the whole table is V3-C's 7–8kHz result (−1.42dB) —
worth the owner's attention as the single most aggressive number here, but
it's still a moderate, bounded change (not remotely approaching the
"destroy the signal" territory this filter is capable of at extreme
settings), and no automated metric was used to reject or prefer it.

## 5. Loudness (identical target, verified per candidate)

| | Integrated | True Peak | LRA | Duration |
|---|---|---|---|---|
| V3-A | −19.1 LUFS | −1.6 dBTP | 4.4 LU | 00:02:26.13 |
| V3-B | −19.0 LUFS | −1.6 dBTP | 4.5 LU | 00:02:26.13 |
| V3-C | −19.1 LUFS | −1.6 dBTP | 4.5 LU | 00:02:26.13 |

Matched within 0.1 LUFS, identical true-peak ceiling, identical duration to
the raw source (no cuts, no added intro/outro) — the owner is judging
articulation and sibilance, not volume.

## 6. Brightness check (Section 4)

Measured broadband energy above 10.5kHz — outside every candidate's
target band, so any change there reflects unintended collateral loss, not
the de-essing itself:

| | RAW | V3-A | V3-B | V3-C |
|---|---|---|---|---|
| >10.5kHz RMS | −30.16 dB | −31.08 dB | −31.36 dB | −31.42 dB |

All three show a small (~0.9–1.3dB) reduction even above their nominal
target bands. This is the natural, physically-inherent skirt of a
bell-shaped parametric filter (no IIR filter this simple has a brick-wall
edge) — not a design flaw, and not something a brightness-restoration
shelf was added to fix: that region sits ~25dB below the track's overall
level already (mostly breath/air, not consonant articulation or content
that reads as "brightness" to a listener), so the potential benefit of
correcting it didn't clear the bar of "genuinely needed" per instruction.
**No high-frequency restoration stage was used, on any candidate.**

## 7. Compressor: not used, any candidate

Same reasoning as every prior round: loudnorm already delivers
clip-to-clip consistency, and each candidate's de-essing stage(s) already
provide targeted dynamics control for the actual problem. No evidence
surfaced during this round that a broadband compressor would improve
anything a listener would notice, so — per instruction — it was left out
rather than added on the assumption that "mastering" implies one.

---

## 8. Files

| | Path |
|---|---|
| A — RAW | `assets/audio/listen/headspa-mastery/module-01/raw/m1-04.mp3` |
| B — Auphonic (historical "too far" reference) | `docs/course-audit/listen-mode/tts/module-01/auphonic-test/m1-04-auphonic-autoeq-test.mp3` |
| C — Master V3-A Dual Band | `docs/course-audit/listen-mode/tts/module-01/master-v3-test/m1-04-master-v3-a-dual-band.mp3` |
| D — Master V3-B Hybrid | `docs/course-audit/listen-mode/tts/module-01/master-v3-test/m1-04-master-v3-b-hybrid.mp3` |
| E — Master V3-C Broad/Deep | `docs/course-audit/listen-mode/tts/module-01/master-v3-test/m1-04-master-v3-c-broad-dynamic.mp3` |
| (optional) Prior best — V2 MEDIUM, "not enough" reference | `docs/course-audit/listen-mode/tts/module-01/master-v2-test/m1-04-master-v2-medium.mp3` |

```bash
open "assets/audio/listen/headspa-mastery/module-01/raw/m1-04.mp3"
open "docs/course-audit/listen-mode/tts/module-01/auphonic-test/m1-04-auphonic-autoeq-test.mp3"
open "docs/course-audit/listen-mode/tts/module-01/master-v3-test/m1-04-master-v3-a-dual-band.mp3"
open "docs/course-audit/listen-mode/tts/module-01/master-v3-test/m1-04-master-v3-b-hybrid.mp3"
open "docs/course-audit/listen-mode/tts/module-01/master-v3-test/m1-04-master-v3-c-broad-dynamic.mp3"
```

Remember for B (Auphonic): the file's first and last several seconds are
likely a free-tier jingle, not Jane — judge the middle of the file (see
`module-01-auphonic-comparison-review.md`).

## 9. Owner review

The target: **more controlled than V2, less destructive than Auphonic.**

- Which has the least fatiguing S?
- Is S still clearly articulated?
- Any lisp?
- Any dull/muffled quality?
- Does Jane retain her bright/open quality?
- Does the processed version sound invisible?
- Does it feel clean/crisp?
- Which would be easiest to hear for a 15–30 minute lesson?
- Which still sounds most like Cadence?

**Claude has not chosen a winner.** Whichever of V3-A/B/C (or a further
iteration) the owner approves becomes `CADENCE_AUDIO_MASTER_PRESET_V1`
and is fully reproducible via `scripts/cadence-audio-master-v3.mjs
--preset=<name>` — entirely local FFmpeg, no cloud service, no manual
editor, no per-file hand-tuning required by default.
