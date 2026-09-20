# Module 4 -- Owner-Editing Staging (v6, strict-fidelity rebuild)

**The v1 batches previously staged here were rejected by the owner** (skipped
content, loose paraphrase, drift from the live lesson -- unacceptable for a
scientific/technical module) and moved to `archive-loose-v1/` -- preserved,
not deleted. This is the corrected v6 pass, built the same way the
owner-approved Module 1 rebuild was: full fidelity-coverage audit first (see
`docs/course-audit/listen-mode/module-04-fidelity-coverage-audit.md`), then
generation.

Source: `docs/course-audit/listen-mode/tts-final/module-04/` (tracked in git
-- manifest.json + one .txt per batch, the exact validated TTS payload).

Raw ElevenLabs output lands here in listening order, one file per batch:

- `M4-BATCH-A1-RAW.mp3` -- chunks M4-01, M4-02, M4-03 (3040 chars)
- `M4-BATCH-A2-RAW.mp3` -- chunks M4-04, M4-05 (3134 chars)
- `M4-BATCH-A3-RAW.mp3` -- chunks M4-06, M4-07 (3220 chars)
- `M4-BATCH-A4-RAW.mp3` -- chunk M4-08 (491 chars, checkpoint: m4cp1)
- `M4-BATCH-B1-RAW.mp3` -- chunks M4-09, M4-10 (3461 chars, checkpoint: m4cp1)
- `M4-BATCH-B2-RAW.mp3` -- chunks M4-11, M4-12, M4-13 (3620 chars)
- `M4-BATCH-B3-RAW.mp3` -- chunks M4-14, M4-15 (2057 chars)
- `M4-BATCH-B4-RAW.mp3` -- chunk M4-16 (389 chars, checkpoint: m4cp2)
- `M4-BATCH-C1-RAW.mp3` -- chunk M4-17 (596 chars, checkpoint: m4cp2)

Each `*-RAW.mp3` gets a matching `*-EDIT.wav` (PCM WAV, 44.1kHz, mono,
16-bit, no trimming/normalization/EQ/enhancement) via
`scripts/aimt-listen-edit-wav-build.sh`, for CapCut editing -- see
`module-01-production-standard-LOCKED.md` for why (the RAW-MP3-into-CapCut
duration bug discovered during Module 1). Do not apply Enhance Voice before
the owner reviews.

This directory (and the audio in it) is gitignored -- only this README
travels with the repo. See `AIMT-Listen-Mode-Final/README.md` at the staging
root for the overall resume procedure.
