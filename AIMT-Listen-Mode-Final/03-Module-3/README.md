# Module 3 -- Owner-Editing Staging

Source: `docs/course-audit/listen-mode/tts-final/module-03/` (tracked in git -- manifest.json + one .txt per batch, the exact validated TTS payload).

Once generation resumes, raw ElevenLabs output lands here in listening order, one file per batch:

- `M3-BATCH-A1-RAW.mp3` -- chunks M3-01, M3-02, M3-03 (3014 chars)
- `M3-BATCH-A2-RAW.mp3` -- chunks M3-04 (2945 chars)
- `M3-BATCH-A3-RAW.mp3` -- chunks M3-05, M3-06 (2006 chars, checkpoint: cp1)
- `M3-BATCH-B1-RAW.mp3` -- chunks M3-07, M3-08 (3734 chars, checkpoint: cp1)
- `M3-BATCH-B2-RAW.mp3` -- chunks M3-09, M3-10 (2472 chars, checkpoint: cp2)
- `M3-BATCH-C1-RAW.mp3` -- chunks M3-11 (599 chars, checkpoint: cp2)

This directory (and the audio in it) is gitignored -- only this README travels with the repo. See `AIMT-Listen-Mode-Final/README.md` at the staging root, and `docs/course-audit/listen-mode/tts-final/RESUME.md`, for the full resume procedure.
