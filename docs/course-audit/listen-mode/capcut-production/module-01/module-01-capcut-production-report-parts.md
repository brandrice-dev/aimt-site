# Module 1 — Two-Part CapCut Masters: Preparation Report

**Status:** Preparation only. Both parts are built, verified bit-exact,
and their unprocessed dry-run re-splits passed. No CapCut processing has
happened yet — this document will be updated once the owner returns both
processed exports (see `CAPCUT-MODULE-01-INSTRUCTIONS.md`).

**Why this exists:** CapCut refuses Enhance Voice on a clip 15:00 or
longer. The original full 14-chunk master (`module-01-capcut-master.wav`,
~16:32) exceeds that — see `module-01-capcut-production-report.md`,
now historical. This report covers the replacement two-part split, per
`module-01-production-standard-LOCKED.md` Section 4.

---

## 1. Split decision

Split at the **M1-07/M1-08 checkpoint boundary** — the highest-priority
split point per the locked rule (an existing checkpoint beats any other
natural break), and the student already experiences an intentional
interruption there, so a production-side seam at the same point adds
nothing new.

| | Chunks | Speech | Separators | Total duration |
|---|---|---|---|---|
| Part A | M1-01–M1-07 (7) | 616.80s | 6 × 2.0s = 12.0s | **628.80s = 10:28.80** |
| Part B | M1-08–M1-14 (7) | 349.68s | 6 × 2.0s = 12.0s | **361.68s = 6:01.68** |

Both comfortably under the 15:00 hard limit and the ~13–14 minute
preferred safety target — no need to split either part further.

## 2. Master construction

Same method as the original full master: `ffmpeg`'s `concat` filter over
native-format (44.1kHz, mono, 16-bit PCM) decodes of the same raw MP3s
already used for the full master, with the same exact 2.0s digital-silence
segment inserted between chunks only — none before the first chunk of a
part, none after its last, and (per the locked rule) no separator between
M1-07 and M1-08 since they now belong to different parts.

**Verified bit-exact:** every chunk segment and every separator segment in
both built masters was compared byte-for-byte against its source decode /
the silence reference immediately after construction. Part A: 13/13
comparisons passed (7 chunks + 6 separators). Part B: 13/13 comparisons
passed. No pitch, speed, loudness, EQ, or dynamics change was applied
anywhere in either build.

## 3. Dry-run re-split (against the UNPROCESSED masters)

`scripts/cadence-capcut-resplit.mjs` was run against each part's own
unprocessed master (simulating a CapCut pass that changed nothing) before
handing anything to the owner.

**Part A: PASS.** All 6 separators recovered within 0.000s–0.055s of
their expected positions. All 7 chunks re-split successfully. Two natural
mid-speech pauses inside M1-04 and one inside M1-06 (carried over from
the original full-master evidence) fall in the same 1.0s–3.2s
duration-plausible window as real markers — position-anchored matching
correctly rejected all three; none is within 10s of any expected
separator.

**Part B: PASS.** All 6 separators recovered, four of them with zero
drift and two within 0.013s–0.051s. All 7 chunks re-split successfully.
No natural-pause decoys were found in Part B's silence detection at all.

Neither run required any change to the matching logic — the
position-anchored approach locked in Section 8 of the production standard
carried over unmodified.

## 4. What this task did NOT do

- Did not touch canonical production audio.
- Did not change `qaStatus` for any chunk.
- Did not call ElevenLabs, Auphonic, or any other provider.
- Did not process either master with CapCut (that's the owner's two passes).
- Did not delete or invalidate the original full-master evidence.
- Did not change the semantic Listen Mode chunk set or checkpoint
  architecture in `assets/js/aimt-listen-mode-data.js`.

## 5. Next step

Owner runs two CapCut passes — one per part, identical
`CADENCE_CAPCUT_FINISH_PRESET_V1` settings both times — per
`CAPCUT-MODULE-01-INSTRUCTIONS.md`, exporting to:

```
intake/module-01-capcut-master-part-a-processed.flac
intake/module-01-capcut-master-part-b-processed.flac
```

Once both files exist, ask Claude to run the real re-split validation
against each.
