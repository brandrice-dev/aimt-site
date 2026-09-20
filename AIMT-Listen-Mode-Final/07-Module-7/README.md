# Module 7 -- Owner-Editing Staging (v2, strict-fidelity rebuild)

Source: `docs/course-audit/listen-mode/tts-final/module-07/` (tracked in git
-- manifest.json + one .txt per batch, the exact validated TTS payload).
Fidelity audit: `docs/course-audit/listen-mode/module-07-fidelity-coverage-audit.md`.
Narration script: `docs/course-audit/listen-mode/module-07-listen-script.md`.

The rejected v1 pass (4 batches) is archived at `archive-loose-v1/` in this
same folder -- nothing was destroyed. v1's source doc, batch texts, and
manifest are archived under `docs/course-audit/listen-mode/archive-loose-v1/`
and `docs/course-audit/listen-mode/tts-final/module-07/archive-loose-v1/`.

Generated 2026-09-16, owner-approved standard, Jane (`Y3ZPRGOSIxbV4Rbb3WiA`) /
`eleven_v3`, sequential real generations only, `generations_count:1`
throughout. 7 batches, listening order:

| Batch | Chunks | Checkpoint | Chars | RAW/EDIT duration | Real cost |
|---|---|---|---:|---:|---:|
| A1 | M7-01, M7-02 | -- | 3,944 | 290.586122s | $0.6508 |
| A2 | M7-03 | -- | 3,101 | 252.682449s | $0.5117 |
| A3 | M7-04, M7-05 | -- | 3,975 | 328.907755s | $0.6559 |
| A4 | M7-06 | -- | 1,839 | 138.684082s | $0.3034 |
| A5 | M7-07 | m7cp1 (STOP) | 209 | 13.635918s | $0.0345 |
| B1 | M7-08 | m7cp2 (STOP, opens with the m7cp1 resume transition) | 308 | 21.629388s | $0.0508 |
| C1 | M7-09 | m7cp2 (resume), post-pass completion | 346 | 28.839184s | $0.0571 |

**Totals:** 13,722 chars, 1,074.964898s runtime (17 min 55 sec), **$2.2641
actual ElevenLabs cost** (real per-generation pricing at
`generations_count:1` -- notably lower than the tool's own pre-generation
`estimate_only` figure of ~$5.01 for the same 13,722 chars, the same
estimate-vs-real discrepancy noted in Modules 5 and 6's own READMEs).

Each `M7-BATCH-*-RAW.mp3` has a matching `M7-BATCH-*-EDIT.wav` (PCM, 44.1kHz,
mono, 16-bit, no normalization/EQ/compression/trim/speed-change -- pure
format conversion via `afconvert`). Every EDIT WAV's decoded duration was
validated against its RAW source and matches exactly (0.000s difference on
all 7 pairs, via `afinfo`). Owner works from the EDIT WAV files in CapCut;
RAW MP3s are the untouched ElevenLabs output.

This directory (and the audio in it) is gitignored -- only this README
travels with the repo. See `AIMT-Listen-Mode-Final/README.md` at the
staging root for the general resume procedure.

**Not yet done (owner review gate):** cutting final player chunks, writing
into the live Listen Mode manifest, or activating this audio in
`assets/audio/listen/`. Per the owner's standing instruction, that happens
only after the owner has listened to this corrected Module 7 narration in
full.
