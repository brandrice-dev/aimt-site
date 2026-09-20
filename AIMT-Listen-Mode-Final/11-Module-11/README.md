# Module 11 -- Owner-Editing Staging (v2, strict-fidelity rebuild)

**Status: RAW generation complete, EDIT.wav conversion complete, both
validated.** This replaces the v1 (pre-strict-fidelity) audio -- v1's
RAW/EDIT files are archived, not deleted, at `archive-loose-v1/` in this
same folder. **Do not use the v1 files.**

Source: `docs/course-audit/listen-mode/tts-final/module-11/` (tracked in
git -- manifest.json + one .txt per batch, the exact validated TTS
payload). Full script: `docs/course-audit/listen-mode/module-11-listen-script.md`
(v2). Fidelity audit: `docs/course-audit/listen-mode/module-11-fidelity-coverage-audit.md`
(v2, PASS, including the mandatory END-OF-MODULE FIDELITY CHECK).

**Why v1 was rejected:** "answer above" instead of "answer below"
(Section F), both checkpoints ungated with no `checkpoint-stop`/
`post-pass` split (Section I.1), hyphenated "A-I-M-T" pronunciation,
the module title/tagline never spoken, "In this module" folded into one
run-on sentence, and the B.R.I.E.F. workspace's own distinct helper text
never narrated. See the script doc's "Why v1 was rejected" section for
the full account.

**Post-generation narrator-perspective correction (2026-09-20,
`A2` only):** this v2 rebuild's *first* `A2` take preserved the live
page's third-person Cadence description verbatim ("...through
Cadence...Cadence is an AI learning-support tool..."). Owner correction:
Cadence, as Listen Mode's narrator, must speak about herself in first
person, matching the course-wide "I'm Cadence" convention -- only
grammatical person changed ("through Cadence" -> "through me", "Cadence
is" -> "I'm"), no facts changed. The original take (`generationId
5DdArQtokYFD2nmkvDJn`) is archived, not deleted, at
`archive-superseded-narrator-fix/` in this folder -- **do not use it.**
The corrected take (`generationId oGLfDoyhRE8iEFjIQ7aj`) is the current
`A2` audio below. No other batch in this module contained a third-person
Cadence self-reference (checked fresh against every chunk).

Twelve batches total (3 regenerated once each -- `A2`, `A3`, `B4`),
`Y3ZPRGOSIxbV4Rbb3WiA` (Jane) / `eleven_v3`, one flow
(`XjRXM05qVuKcfXcfFCbr`) for the whole module.
Every `-EDIT.wav` validated against its ElevenLabs-reported source
duration (`docs/course-audit/listen-mode/tts-final/GENERATION-LOG.json`)
and matched within 0.05 seconds -- see `scripts/aimt-listen-edit-wav-validate.mjs`.

**AIMT pronunciation:** this module uses the comma-separated "A, I, M, T"
form (not this task's literal single-spaced instruction) for the same
reason Module 10's audio does -- Module 10's owner listening pass on
this exact voice/model found the single-spaced form rendering as
"Am-tee." Affected batches: A2, B4.

**Post-generation B.R.I.E.F.-pronunciation correction (2026-09-20, `A3`
and `B4` only):** the framework NAME was originally spoken
comma-separated ("B, R, I, E, F") as a precaution against the same
letter-collision risk as AIMT. Owner correction: since "B.R.I.E.F."
spells the ordinary word "brief" exactly (no collision risk to guard
against), the framework name is now simply spoken as "brief" --
"Give AI a Better B.R.I.E.F." -> "Give AI a better brief"; "Build Your
B.R.I.E.F." -> "Build your brief"; "B.R.I.E.F. prompt framework" ->
"brief prompt framework." **Not touched:** the individual-letter
teaching sequence in `A3` ("B, Background... R, Request...") -- Cadence
still spells those letters individually because she's teaching what each
one stands for. The original `A3`/`B4` takes are archived, not deleted,
at `archive-superseded-pronunciation-fix/` in this folder -- **do not use
them.** Visible course text/UI was never touched by this correction.

| Batch | Chunks | Duration | Chars | Checkpoint |
|---|---|---:|---:|---|
| `M11-BATCH-A1` | M11-01 (module briefing) | 1:00 | 815 | -- |
| `M11-BATCH-A2` | M11-02 (AIMT/Cadence framing + AIMT position + 11.1) | 1:54 | 1377 | -- |
| `M11-BATCH-A3` | M11-03 (11.2, full B.R.I.E.F. framework + workspace + example) | 2:41 | 1871 | -- |
| `M11-BATCH-A4` | M11-04 (11.3, all 3 authority levels) | 1:33 | 999 | -- |
| `M11-BATCH-A5` | M11-05 (11.4, scalp/hair analysis) | 1:20 | 1049 | -- |
| `M11-BATCH-A6` | M11-06 (11.5, client-supplied AI) | 1:52 | 1337 | -- |
| `M11-BATCH-B1` | M11-07 (checkpoint 1 alone) | 0:22 | 304 | m11cp1 |
| `M11-BATCH-B2` | M11-08 (post-pass transition + 11.6) | 1:05 | 751 | m11cp1 |
| `M11-BATCH-B3` | M11-09 (11.7, all 6 leverage categories) | 1:06 | 708 | -- |
| `M11-BATCH-B4` | M11-10 (11.8 + Toolkit) | 1:37 | 1090 | -- |
| `M11-BATCH-B5` | M11-11 (checkpoint 2 alone) | 0:27 | 338 | m11cp2 |
| `M11-BATCH-C1` | M11-12 (post-pass recap/handoff) | 0:26 | 319 | m11cp2 |

**Module total (current, valid audio):** 12 batches, 15:22, $1.81,
10,958 chars. **Actual total spend today, including all 3 superseded
takes (`A2` narrator-fix, `A3`/`B4` brief-pronunciation-fix):** $2.53
(12 original generations $1.814, plus 3 regenerations: `A2` $0.227,
`A3` $0.309, `B4` $0.180).

Each batch has two files:

```
M11-BATCH-<id>-RAW.mp3     immutable ElevenLabs source -- NEVER edit, rename, or delete
M11-BATCH-<id>-EDIT.wav    lossless CapCut input -- import THIS into CapCut, not the RAW mp3
```

`-PROCESSED.wav` lands here once the owner returns a CapCut export -- not
yet present for this module.

This directory (and the audio in it) is gitignored -- only this README
travels with the repo. See `AIMT-Listen-Mode-Final/README.md` at the
staging root and `AIMT-Listen-Mode-Final/MASTER-CAPCUT-WORKLIST.md` for
the full cut-order/processing instructions. This module has no
select/feedback interaction (the B.R.I.E.F. workspace is an ungraded
free-text exercise, not gated audio), so no interaction-feedback cut
points apply here -- `B1`/`B2`/`B5`/`C1` are the only checkpoint-adjacent
clips and are already four separate short recordings, not one combined
take needing to be split.
