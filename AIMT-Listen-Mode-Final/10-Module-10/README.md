# Module 10 -- Owner-Editing Staging (v2, strict-fidelity rebuild)

**Status: RAW generation complete, EDIT.wav conversion complete, both
validated.** This replaces the v1 (locked-standard, pre-strict-fidelity)
audio -- v1's RAW/EDIT files are archived, not deleted, at
`archive-loose-v1/` in this same folder. **Do not use the v1 files.**

Source: `docs/course-audit/listen-mode/tts-final/module-10/` (tracked in
git -- manifest.json + one .txt per batch, the exact validated TTS
payload). Full script: `docs/course-audit/listen-mode/module-10-listen-script.md`
(v2). Fidelity audit: `docs/course-audit/listen-mode/module-10-fidelity-coverage-audit.md`
(v2, PASS).

**Why v1 was rejected:** "answer above" instead of "answer below"
(Section F), the "Reset Under Pressure" interaction narrating its own
verdict before the student could act (Section I.2), and both checkpoints
narrated back-to-back with no gate between them (Section I.1). See the
script doc's "Why v1 was rejected" section for the full account.

Fifteen batches, generated 2026-09-18, `Y3ZPRGOSIxbV4Rbb3WiA` (Jane) /
`eleven_v3`, one flow (`Bq0eJRIXil5pBJF4nXnq`) for the whole module. Every
`-EDIT.wav` validated against its ElevenLabs-reported source duration
(`docs/course-audit/listen-mode/tts-final/GENERATION-LOG.json`) and
matched within 0.05 seconds -- see `scripts/aimt-listen-edit-wav-validate.mjs`.

**Pronunciation correction (A1 only):** the owner listened to the first
generation and reported "AIMT" -- spoken in the locked course-wide
single-spaced form, "A I M T" -- rendering as "Am-tee." Root cause: A-I-M
spells the real word "aim," and `eleven_v3` collapses toward that word.
Fixed by respelling both occurrences as comma-separated "A, I, M, T" /
"A, I, M, T's" (confirmed by ear against a `[slowly]`-tag alternative,
which the owner rejected). A1 was regenerated with the fix; the original
mispronounced take is archived at `archive-mispronounced-aimt/` in this
folder, not deleted. **This is the only "AIMT" mention in Module 10 --
no other batch needed this fix.** See the script/audit docs'
"Pronunciation correction" sections for the full account, including the
flagged course-wide implication for every other module's existing
single-spaced "A I M T" audio.

| Batch | Chunks | Duration | Chars | Checkpoint |
|---|---|---:|---:|---|
| `M10-BATCH-A1` | M10-01, M10-02 | 4:04 | 2958 | -- |
| `M10-BATCH-A2` | M10-03 | 3:03 | 2223 | -- |
| `M10-BATCH-A3` | M10-04 | 2:16 | 1482 | -- |
| `M10-BATCH-A4` | M10-05 (interaction prompt + 5 options) | 1:11 | 903 | -- |
| `M10-BATCH-A4fb0` | M10-05-fb0 (option 1 feedback) | 0:17 | 254 | -- |
| `M10-BATCH-A4fb1` | M10-05-fb1 (option 2 feedback) | 0:11 | 165 | -- |
| `M10-BATCH-A4fb2` | M10-05-fb2 (option 3 feedback) | 0:10 | 165 | -- |
| `M10-BATCH-A4fb3` | M10-05-fb3 (option 4 feedback) | 0:09 | 147 | -- |
| `M10-BATCH-A4fb4` | M10-05-fb4 (option 5 feedback) | 0:10 | 173 | -- |
| `M10-BATCH-B1` | M10-06 | 2:48 | 1945 | -- |
| `M10-BATCH-B2` | M10-07 | 2:13 | 1755 | -- |
| `M10-BATCH-B3` | M10-08 (checkpoint 1 alone) | 0:27 | 342 | m9cp1 |
| `M10-BATCH-B4` | M10-09 (post-pass transition, tiny) | 0:02 | 30 | m9cp1 |
| `M10-BATCH-B5` | M10-10 (checkpoint 2 alone) | 0:22 | 319 | m9cp2 |
| `M10-BATCH-C1` | M10-11 (completion + handoff) | 0:29 | 365 | m9cp2 |

**Module total:** 15 batches, 17:58, $2.18, 13,226 chars.

Each batch has three files:

```
M10-BATCH-<id>-RAW.mp3     immutable ElevenLabs source -- NEVER edit, rename, or delete
M10-BATCH-<id>-EDIT.wav    lossless CapCut input -- import THIS into CapCut, not the RAW mp3
```

`-PROCESSED.wav` lands here once the owner returns a CapCut export -- not
yet present for this module.

This directory (and the audio in it) is gitignored -- only this README
travels with the repo. See `AIMT-Listen-Mode-Final/README.md` at the
staging root and `AIMT-Listen-Mode-Final/MASTER-CAPCUT-WORKLIST.md` for
the full cut-order/processing instructions, including the interaction and
checkpoint cut boundaries specific to this module (`M10-BATCH-A4` must be
cut apart from its five feedback batches at the natural pauses; `B3`/`B4`/
`B5` are three separate short clips, not one combined recording, so no
cutting is needed there beyond trimming silence).
