# Module 1 -- Owner-Editing Staging

Source: `docs/course-audit/listen-mode/tts-final/module-01/` (tracked in git -- manifest.json + one .txt per batch, the exact validated TTS payload).

Once generation resumes, raw ElevenLabs output lands here in listening order, one file per batch:

- `M1-BATCH-A1-RAW.mp3` -- chunks M1-01, M1-02, M1-03 (3303 chars)
- `M1-BATCH-A2-RAW.mp3` -- chunks M1-04, M1-05 (3610 chars)
- `M1-BATCH-A3-RAW.mp3` -- chunks M1-06, M1-07 (2151 chars, checkpoint: m1cp1)
- `M1-BATCH-B1-RAW.mp3` -- chunks M1-08, M1-09, M1-10, M1-11 (2596 chars, checkpoint: m1cp1)
- `M1-BATCH-B2-RAW.mp3` -- chunks M1-12, M1-13 (1431 chars, checkpoint: m1cp2)
- `M1-BATCH-C1-RAW.mp3` -- chunks M1-14 (910 chars, checkpoint: m1cp2)

This directory (and the audio in it) is gitignored -- only this README travels with the repo. See `AIMT-Listen-Mode-Final/README.md` at the staging root, and `docs/course-audit/listen-mode/tts-final/RESUME.md`, for the full resume procedure.
