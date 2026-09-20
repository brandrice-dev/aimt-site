# AIMT Listen Mode -- Full Regeneration -- Owner-Editing Staging

**Status: RAW generation complete, EDIT.wav conversion complete.** All 71
batches, all 13 modules, generated 2026-09-14; a lossless `-EDIT.wav`
counterpart for every RAW file was added 2026-09-15 (see "CapCut import
fix" below -- required before this pass's CapCut import worked reliably).
See `MASTER-CAPCUT-WORKLIST.md` in this directory for the complete
file-by-file processing worklist (real durations, real filenames,
checkpoint cut boundaries) and
`docs/course-audit/listen-mode/tts-final/GENERATION-LOG.json` for the raw
per-generation record (generation ids, cost, credits). Next step is the
owner's CapCut pass, importing the **`-EDIT.wav`** files (not the
`-RAW.mp3` files directly) -- see `MASTER-CAPCUT-WORKLIST.md`'s "Cut
order / processing instructions" section.

## CapCut import fix -- three-stage file naming (added 2026-09-15)

Some `-RAW.mp3` files were importing into CapCut roughly 10 seconds
shorter than their real length (inconsistent across files, always played
full-length everywhere else) -- almost certainly a VBR/Xing-header
duration mismatch that CapCut's importer trusts over the actual decoded
audio. Every RAW file now has a `-EDIT.wav` sibling, decoded with macOS
`afconvert` (this environment has no ffmpeg) using
`--prime-override ? ? ?` to force a full decode regardless of any
embedded (possibly wrong) gapless-playback metadata -- PCM WAV, 44.1kHz,
mono, 16-bit, no normalization/EQ/compression/trimming of any kind. Every
one of the 71 EDIT.wav files was validated against its ElevenLabs-
reported source duration (`GENERATION-LOG.json`) and matched within
0.05 seconds -- see `scripts/aimt-listen-edit-wav-validate.mjs`.

The workflow is now three files per batch, not two:

```
M<n>-BATCH-<id>-RAW.mp3         immutable ElevenLabs source -- NEVER edit, rename, or delete
M<n>-BATCH-<id>-EDIT.wav        lossless CapCut input -- import THIS into CapCut, not the RAW mp3
M<n>-BATCH-<id>-PROCESSED.wav   owner's CapCut export -- the second-pass integration source
```

Final production MP3 player chunks are cut from `-PROCESSED.wav`, never
directly from CapCut and never from `-RAW.mp3`.

Gitignored working directory for the course-wide Listen Mode full
regeneration pass (Welcome through Module 12). See
`docs/course-audit/listen-mode/tts-final/RESUME.md` for how this pass was
paused and resumed.

## Structure

```
AIMT-Listen-Mode-Final/
├── 00-Welcome/ .. 12-Module-12/   one folder per module: RAW.mp3 + EDIT.wav
│                                  now present for every batch, in listening
│                                  order (see each folder's own README.md
│                                  for its exact batch list); PROCESSED.wav
│                                  lands here once the owner returns it
├── manifests/                     (not yet created -- see tts-final/)
├── source-scripts/                (not yet created -- validated source
│                                   already lives in
│                                   docs/course-audit/listen-mode/tts-final/,
│                                   which IS tracked in git)
└── MASTER-CAPCUT-WORKLIST.md      processing settings + cut order,
                                   pre-filled; actual filenames/durations
                                   fill in after generation
```

## What's gitignored here, what isn't

Only generated audio (`*.mp3`/`*.wav`/`*.flac`) under this directory is
gitignored. Every `.md` file here (this one, each module's README, and
`MASTER-CAPCUT-WORKLIST.md`) is a plain text production document and
stays tracked in git, same as the rest of `docs/course-audit/`.

## Provenance chain

```
validated narration source (docs/course-audit/listen-mode/tts-final/module-NN/*.txt)
  -> ElevenLabs batch generation (Jane / eleven_v3)
  -> RAW file, this directory:       M<n>-BATCH-<id>-RAW.mp3   (immutable)
  -> lossless decode (afconvert):    M<n>-BATCH-<id>-EDIT.wav  (CapCut input)
  -> owner CapCut pass (CADENCE_CAPCUT_FINISH_PRESET_V1)
  -> owner's CapCut export:          M<n>-BATCH-<id>-PROCESSED.wav
  -> position-anchored re-split (scripts/cadence-capcut-resplit.mjs)
  -> final player chunks -> assets/audio/listen/headspa-mastery/module-NN/
```

RAW and EDIT files are never overwritten once a PROCESSED file exists for
the same batch -- all three are preserved side by side.
