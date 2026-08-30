# Module 1 — Full-Module CapCut Master: Preparation Report

**Status:** Preparation only. The full-module master is built and its
unprocessed dry-run re-split passed. No CapCut processing of the full
module has happened yet — this document will be updated once the owner
returns a processed export (see `CAPCUT-MODULE-01-INSTRUCTIONS.md`).

---

## 1. Source verification

All 14 Module 1 raw ElevenLabs chunks were verified present and valid
(decodable, non-zero, correct sample rate) before assembly. No ElevenLabs
generation happened in this task — every chunk was reused from
`assets/audio/listen/headspa-mastery/module-01/raw/`.

| Chunk | Duration (exact, sample-accurate) |
|---|---|
| m1-01 | 65.44s |
| m1-02 | 76.80s |
| m1-03 | 92.16s |
| m1-04 | 146.08s |
| m1-05 | 69.20s |
| m1-06 | 128.40s |
| m1-07 | 38.72s |
| m1-08 | 15.60s |
| m1-09 | 62.72s |
| m1-10 | 39.60s |
| m1-11 | 57.12s |
| m1-12 | 75.60s |
| m1-13 | 30.88s |
| m1-14 | 68.16s |

Sum of chunk durations: 966.48s. Plus 13 × 2.0s separators: **992.48s**
total master duration — matches the built file exactly.

## 2. Master construction

Built via `ffmpeg`'s `concat` filter operating on all-native-format
(44.1kHz, mono, 16-bit PCM) decodes of each raw MP3, with a
separately-generated exact 2.0s digital-silence segment
(`anullsrc=r=44100:cl=mono`, verified all-zero) inserted between every
pair of adjacent chunks — none before M1-01, none after M1-14, per the
locked standard.

**Verified bit-exact:** every one of the 14 chunk segments and all 13
separator segments in the built master were compared byte-for-byte
against their source decode / the silence reference immediately after
construction. All 27 comparisons passed. No pitch, speed, loudness, EQ,
or dynamics change was applied anywhere in this build.

## 3. Dry-run re-split (against the UNPROCESSED master)

Before involving the owner, `scripts/cadence-capcut-resplit.mjs` was run
against the master itself (i.e. simulating a CapCut pass that changed
nothing) to validate the position-anchored detection and splitting logic
at full-module scale.

**Result: PASS.** All 13 separators recovered at their exact expected
positions (drift 0.000s–0.055s, well within the small-variance
tolerance). All 14 chunks re-split successfully.

**Speech-loss verification (RMS-based, not exact-byte-match only):** a
few chunks' resplit boundaries land a handful of milliseconds off the
exact source edge (up to ~71ms on M1-08's leading edge) — expected, since
`silencedetect`'s threshold crossing doesn't land on the exact same
sample as the deliberately-inserted zero-silence boundary. Every trimmed
region across all 14 chunks was checked at the sample level: the loudest
trimmed edge measured **123/32767** peak amplitude (**−48 dBFS**), and RMS
levels of every trimmed region sit between **−52 dBFS and −71 dBFS** —
deep in the noise floor, nowhere near this project's measured speech
level (peaks around −7 to −8 dBFS elsewhere in this pipeline). No
spoken content was lost in any of the 14 chunks.

## 4. A real detection bug found and fixed at this scale

The unprocessed-master dry-run surfaced 4 natural narration pauses
(1 in M1-04's own internal pauses carried over from the earlier 4-chunk
proof, plus 3 more: one at 561.881s inside M1-06) that fall inside the
1.0s–3.2s "duration-plausible" window used to recognize a boundary
marker. **Position-anchored matching correctly rejected all of them** —
none is within 10s of any of the 13 expected separator positions, so
none was misclassified. This is exactly the failure mode Section 4/7 of
the locked standard requires the script to resist, and it was verified
working, not just asserted.

A second, purely cosmetic bug was found and fixed in the same run: the
script's separator drift log printed `undefined -> undefined` for this
manifest's `beforeChunk`/`afterChunk` field names (it was written against
the earlier 4-chunk proof's `afterChunkId`/`beforeChunkId` naming). Fixed
to recognize both manifest schemas; the underlying matching logic itself
only ever used `startSec`, so this never affected correctness — only the
readability of the log.

## 5. What this task did NOT do

- Did not touch canonical production audio.
- Did not change `qaStatus` for any chunk.
- Did not call ElevenLabs, Auphonic, or any other provider.
- Did not process the master with CapCut (that's the owner's one pass).
- Did not commit an install of any chunk.

## 6. Next step

Owner runs the one CapCut pass described in
`CAPCUT-MODULE-01-INSTRUCTIONS.md` using `CADENCE_CAPCUT_FINISH_PRESET_V1`
(see `module-01-production-standard-LOCKED.md` Section 3) and exports to
`intake/module-01-capcut-master-processed.flac`. Once that file exists,
ask Claude to run the real re-split validation against it.
