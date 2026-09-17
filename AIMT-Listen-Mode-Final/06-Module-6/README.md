# Module 6 -- Owner-Editing Staging (v2, strict-fidelity rebuild)

Source: `docs/course-audit/listen-mode/tts-final/module-06/` (tracked in git
-- manifest.json + one .txt per batch, the exact validated TTS payload).
Fidelity audit: `docs/course-audit/listen-mode/module-06-fidelity-coverage-audit.md`.
Narration script: `docs/course-audit/listen-mode/module-06-listen-script.md`.

The rejected v1 pass (6 batches) is archived at `archive-loose-v1/` in this
same folder -- nothing was destroyed. v1's source doc, batch texts, and
manifest are archived under `docs/course-audit/listen-mode/archive-loose-v1/`
and `docs/course-audit/listen-mode/tts-final/module-06/archive-loose-v1/`.

Generated 2026-09-15, owner-approved standard, Jane (`Y3ZPRGOSIxbV4Rbb3WiA`) /
`eleven_v3`, sequential real generations only. 11 batches, listening order:

| Batch | Chunks | Checkpoint | Chars | RAW/EDIT duration | Real cost |
|---|---|---|---:|---:|---:|
| A1 | M6-01, M6-02 | -- | 2,575 | 191.44s | $0.4249 |
| A2 | M6-03 | -- | 2,149 | 173.60s | $0.3546 |
| A3 | M6-04 | -- | 2,064 | 164.32s | $0.3406 |
| A4 | M6-05 | -- | 2,451 | 193.60s | $0.4044 |
| A5 | M6-06 | m6cp1 (STOP) | 352 | 25.76s | $0.0581 |
| B1 | M6-07, M6-08 | m6cp1 (resume) | 1,386 | 118.32s | $0.2287 |
| B2 | M6-09, M6-10 | -- | 3,686 | 301.44s | $0.6082 |
| B3 | M6-11 | -- | 1,148 | 89.28s | $0.1894 |
| B4 | M6-12 | -- | 2,298 | 167.60s | $0.3792 |
| B5 | M6-13 | m6cp2 (STOP) | 343 | 25.04s | $0.0566 |
| C1 | M6-14 | m6cp2 (resume) | 434 | 30.80s | $0.0716 |

**Totals:** 18,886 chars, 1,481.20s runtime (24 min 41 sec), **$3.1162
actual ElevenLabs cost** (real per-generation pricing, not the
pre-generation estimate of $3.7595 for batch A1 alone at the default
4-generations-per-call rate -- the estimate tool runs noticeably higher per
character than the real single-generation rate for this voice/model, the
same discrepancy noted in Module 5's own README and the paused RESUME.md
session).

Each `M6-BATCH-*-RAW.mp3` has a matching `M6-BATCH-*-EDIT.wav` (PCM, 44.1kHz,
mono, 16-bit, no normalization/EQ/compression/trim/speed-change -- pure
format conversion via `afconvert`). Every EDIT WAV's decoded duration was
validated against its RAW source and matches within 0.05s (see the coverage
audit and the owner review package for the full table). Owner works from the
EDIT WAV files in CapCut; RAW MP3s are the untouched ElevenLabs output.

This directory (and the audio in it) is gitignored -- only this README
travels with the repo. See `AIMT-Listen-Mode-Final/README.md` at the staging
root for the general resume procedure.

**Not yet done (owner review gate):** cutting final player chunks, writing
into the live Listen Mode manifest, or activating this audio in
`assets/audio/listen/`. Per the owner's standing instruction, that happens
only after the owner has listened to this corrected Module 6 narration in
full.
