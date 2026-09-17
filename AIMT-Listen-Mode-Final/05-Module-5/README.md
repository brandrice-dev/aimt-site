# Module 5 -- Owner-Editing Staging (v2, strict-fidelity rebuild)

Source: `docs/course-audit/listen-mode/tts-final/module-05/` (tracked in git
-- manifest.json + one .txt per batch, the exact validated TTS payload).
Fidelity audit: `docs/course-audit/listen-mode/module-05-fidelity-coverage-audit.md`.
Narration script: `docs/course-audit/listen-mode/module-05-listen-script.md`.

The rejected v1 pass (6 batches) is archived at `archive-loose-v1/` in this
same folder -- nothing was destroyed. v1's source doc, batch texts, and
manifest are archived under `docs/course-audit/listen-mode/archive-loose-v1/`
and `docs/course-audit/listen-mode/tts-final/module-05/archive-loose-v1/`.

Generated 2026-09-15, owner-approved standard, Jane (`Y3ZPRGOSIxbV4Rbb3WiA`) /
`eleven_v3`, sequential real generations only. 11 batches, listening order:

| Batch | Chunks | Checkpoint | Chars | RAW/EDIT duration | Real cost |
|---|---|---|---:|---:|---:|
| A1 | M5-01, M5-02 | -- | 1,917 | 153.63s | $0.3163 |
| A2 | M5-03, M5-04 | -- | 2,976 | 232.20s | $0.4910 |
| A3 | M5-05 | -- | 4,364 | 368.85s | $0.7201 |
| A4 | M5-06 | -- | 3,990 | 320.37s | $0.6584 |
| A5 | M5-07 | -- | 1,556 | 125.96s | $0.2567 |
| A6 | M5-08 | m5cp1 (STOP) | 385 | 28.92s | $0.0635 |
| B1 | M5-09, M5-10 | m5cp1 (resume) | 1,506 | 117.00s | $0.2485 |
| B2 | M5-11, M5-12 | -- | 2,726 | 217.55s | $0.4498 |
| B3 | M5-13 | -- | 2,426 | 185.73s | $0.4003 |
| B4 | M5-14 | m5cp2 (STOP) | 344 | 23.80s | $0.0568 |
| C1 | M5-15 | m5cp2 (resume) | 470 | 39.00s | $0.0776 |

**Totals:** 22,660 chars, 1,813.00s runtime (30 min 13 sec), **$3.7389 actual
ElevenLabs cost** (real per-generation pricing, not the pre-generation
estimate of $8.27 -- the estimate tool runs noticeably higher than the real
per-character rate for this voice/model).

Each `M5-BATCH-*-RAW.mp3` has a matching `M5-BATCH-*-EDIT.wav` (PCM, 44.1kHz,
mono, 16-bit, no normalization/EQ/compression/trim/speed-change -- pure
format conversion via `afconvert`). Every EDIT WAV's decoded duration was
validated against its RAW source and matches exactly (see the coverage audit
and the owner review package for the full table). Owner works from the EDIT
WAV files in CapCut; RAW MP3s are the untouched ElevenLabs output.

This directory (and the audio in it) is gitignored -- only this README
travels with the repo. See `AIMT-Listen-Mode-Final/README.md` at the staging
root for the general resume procedure.

**Not yet done (owner review gate):** cutting final player chunks, writing
into the live Listen Mode manifest, or activating this audio in
`assets/audio/listen/`. Per the owner's standing instruction, that happens
only after the owner has listened to this corrected Module 5 narration in
full.
