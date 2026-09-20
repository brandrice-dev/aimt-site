# AIMT Listen Mode -- Master CapCut Worklist

**Status: RAW generation complete (all 71 batches) and EDIT.wav conversion
complete (all 71 batches). Awaiting owner CapCut pass.**
Generated 2026-09-14; Module 1 rebuilt to the strict-fidelity standard and
EDIT.wav files added 2026-09-15. One consolidated worklist for every module
-- not scattered per-module docs, per the task's explicit instruction.

## Canonical CapCut settings -- `CADENCE_CAPCUT_FINISH_PRESET_V1`

The active, owner-locked finishing preset (see
`docs/course-audit/listen-mode/module-01-production-standard-LOCKED.md`
Section 3 -- reused verbatim here, not reinterpreted). Apply identically
to every RAW file below, one CapCut pass per file:

**CapCut Basic:**
- Volume: 0.0 dB
- Fade in: 0.0 seconds
- Fade out: 0.0 seconds
- Normalize loudness: ON
- CapCut-displayed normalization target: -23 LUFS

**CapCut Enhancement:**
- Enhance voice: ON
- Enhance voice intensity: 75
- Reduce noise: ON
- Isolate voice: OFF
- Audio translator: OFF
- Voice changer: OFF
- Speed: unchanged / 1.0x

**No additional processing of any kind**: no EQ preset, no pitch change, no
reverb, no voice effect, no silence removal, no manual cuts, no fades beyond
the 0.0s settings above, no separate dynamics/mastering chain afterward.

## Provenance naming convention -- three files per batch

```
M<n>-BATCH-<id>-RAW.mp3        immutable ElevenLabs source -- do not edit/rename/delete
M<n>-BATCH-<id>-EDIT.wav       lossless CapCut input -- IMPORT THIS, not the RAW mp3
M<n>-BATCH-<id>-PROCESSED.wav  owner's CapCut export -- next pass's integration source
```
**Import the `-EDIT.wav` file into CapCut, never the `-RAW.mp3`.** Some RAW
files were found to import into CapCut roughly 10 seconds short of their
real length (inconsistent across files, always full-length everywhere else)
-- almost certainly a VBR/Xing-header duration mismatch in the source MP3
that CapCut's importer trusts over the actual audio. Every RAW file has a
validated, full-length `-EDIT.wav` sibling (PCM, 44.1kHz, mono, 16-bit,
decoded with no normalization/EQ/trimming of any kind) specifically to avoid
that importer bug -- see `scripts/aimt-listen-edit-wav-validate.mjs` for the
per-file validation against each batch's real ElevenLabs-reported duration.
RAW and EDIT files are never overwritten once a PROCESSED file exists for the
same batch -- keep all three side by side in the same module folder.

---

## Welcome Module

Folder: `AIMT-Listen-Mode-Final/00-Welcome/`

| Batch | Import into CapCut (EDIT.wav) | Chunks | Duration | Chars | Checkpoint | Cut order / notes |
|---|---|---|---:|---:|---|---|
| A1a | `M0-BATCH-A1a-EDIT.wav` | M0-01, M0-01b, M0-02 | 3:49 | 2922 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A1b | `M0-BATCH-A1b-EDIT.wav` | M0-03, M0-04 | 2:39 | 1899 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A2 | `M0-BATCH-A2-EDIT.wav` | M0-05, M0-06, M0-07, M0-08 | 4:35 | 3584 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A3 | `M0-BATCH-A3-EDIT.wav` | M0-09, M0-10, M0-11 | 3:58 | 2956 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A4 | `M0-BATCH-A4-EDIT.wav` | M0-12, M0-13, M0-14 | 2:19 | 1745 | m0cp1 | Cut boundary: checkpoint stop at end of this batch's last chunk (m0cp1) -- natural seam, cut here. |
| B1 | `M0-BATCH-B1-EDIT.wav` | M0-15 | 0:52 | 701 | m0cp1 | Cut boundary: checkpoint stop at end of this batch's last chunk (m0cp1) -- natural seam, cut here. |

**Module total:** 6 batches, 18:13, $2.28.

---

## Module 1 -- Role of the Head Spa Technician

Folder: `AIMT-Listen-Mode-Final/01-Module-1/`

| Batch | Import into CapCut (EDIT.wav) | Chunks | Duration | Chars | Checkpoint | Cut order / notes |
|---|---|---|---:|---:|---|---|
| A1 | `M1-BATCH-A1-EDIT.wav` | M1-01, M1-02, M1-03 | 3:38 | 2701 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A2 | `M1-BATCH-A2-EDIT.wav` | M1-04, M1-05 | 4:42 | 3657 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A3 | `M1-BATCH-A3-EDIT.wav` | M1-06, M1-07 | 2:16 | 1866 | m1cp1 | Cut boundary: checkpoint stop at end of this batch's last chunk (m1cp1) -- natural seam, cut here. |
| B1 | `M1-BATCH-B1-EDIT.wav` | M1-08, M1-09, M1-10, M1-11 | 3:52 | 2658 | m1cp1 | Cut boundary: checkpoint stop at end of this batch's last chunk (m1cp1) -- natural seam, cut here. |
| B2 | `M1-BATCH-B2-EDIT.wav` | M1-12, M1-13 | 2:00 | 1492 | m1cp2 | Cut boundary: checkpoint stop at end of this batch's last chunk (m1cp2) -- natural seam, cut here. |
| C1 | `M1-BATCH-C1-EDIT.wav` | M1-14 | 0:44 | 559 | m1cp2 | Cut boundary: checkpoint stop at end of this batch's last chunk (m1cp2) -- natural seam, cut here. |

**Module total:** 6 batches, 17:13, $2.13.

---

## Module 2 -- Welcoming Your Client

Folder: `AIMT-Listen-Mode-Final/02-Module-2/`

| Batch | Import into CapCut (EDIT.wav) | Chunks | Duration | Chars | Checkpoint | Cut order / notes |
|---|---|---|---:|---:|---|---|
| A1 | `M2-BATCH-A1-EDIT.wav` | M2-01, M2-02, M2-03 | 3:03 | 2535 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A2 | `M2-BATCH-A2-EDIT.wav` | M2-04, M2-05 | 3:49 | 2801 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A3 | `M2-BATCH-A3-EDIT.wav` | M2-06, M2-07, M2-08 | 4:22 | 3359 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A4 | `M2-BATCH-A4-EDIT.wav` | M2-09, M2-10, M2-11 | 3:11 | 2446 | m2cp1 | Cut boundary: checkpoint stop at end of this batch's last chunk (m2cp1) -- natural seam, cut here. |
| B1 | `M2-BATCH-B1-EDIT.wav` | M2-12 | 0:29 | 429 | m2cp1 | Cut boundary: checkpoint stop at end of this batch's last chunk (m2cp1) -- natural seam, cut here. |

**Module total:** 5 batches, 14:55, $1.91.

---

## Module 3 -- Hair & Scalp Anatomy

Folder: `AIMT-Listen-Mode-Final/03-Module-3/`

| Batch | Import into CapCut (EDIT.wav) | Chunks | Duration | Chars | Checkpoint | Cut order / notes |
|---|---|---|---:|---:|---|---|
| A1 | `M3-BATCH-A1-EDIT.wav` | M3-01, M3-02, M3-03 | 4:02 | 3014 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A2 | `M3-BATCH-A2-EDIT.wav` | M3-04 | 3:57 | 2945 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A3 | `M3-BATCH-A3-EDIT.wav` | M3-05, M3-06 | 2:43 | 2006 | cp1 | Cut boundary: checkpoint stop at end of this batch's last chunk (cp1) -- natural seam, cut here. |
| B1 | `M3-BATCH-B1-EDIT.wav` | M3-07, M3-08 | 5:06 | 3734 | cp1 | Cut boundary: checkpoint stop at end of this batch's last chunk (cp1) -- natural seam, cut here. |
| B2 | `M3-BATCH-B2-EDIT.wav` | M3-09, M3-10 | 3:24 | 2472 | cp2 | Cut boundary: checkpoint stop at end of this batch's last chunk (cp2) -- natural seam, cut here. |
| C1 | `M3-BATCH-C1-EDIT.wav` | M3-11 | 0:45 | 599 | cp2 | Cut boundary: checkpoint stop at end of this batch's last chunk (cp2) -- natural seam, cut here. |

**Module total:** 6 batches, 19:56, $2.44.

---

## Module 4 -- Microscopy & Scalp Assessment

Folder: `AIMT-Listen-Mode-Final/04-Module-4/`

| Batch | Import into CapCut (EDIT.wav) | Chunks | Duration | Chars | Checkpoint | Cut order / notes |
|---|---|---|---:|---:|---|---|
| A1 | `M4-BATCH-A1-EDIT.wav` | M4-01, M4-02 | 3:30 | 2643 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A2 | `M4-BATCH-A2-EDIT.wav` | M4-03 | 1:47 | 1261 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A3 | `M4-BATCH-A3-EDIT.wav` | M4-04, M4-05 | 4:20 | 3091 | m4cp1 | Cut boundary: checkpoint stop at end of this batch's last chunk (m4cp1) -- natural seam, cut here. |
| B1 | `M4-BATCH-B1-EDIT.wav` | M4-06 | 3:25 | 2445 | m4cp1 | Cut boundary: checkpoint stop at end of this batch's last chunk (m4cp1) -- natural seam, cut here. |
| B2 | `M4-BATCH-B2-EDIT.wav` | M4-07, M4-08 | 3:44 | 2704 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| B3 | `M4-BATCH-B3-EDIT.wav` | M4-09, M4-10 | 3:08 | 2392 | m4cp2 | Cut boundary: checkpoint stop at end of this batch's last chunk (m4cp2) -- natural seam, cut here. |
| C1 | `M4-BATCH-C1-EDIT.wav` | M4-11 | 0:48 | 596 | m4cp2 | Cut boundary: checkpoint stop at end of this batch's last chunk (m4cp2) -- natural seam, cut here. |

**Module total:** 7 batches, 20:45, $2.50.

---

## Module 5 -- Scalp Patterns & Service Adaptation

Folder: `AIMT-Listen-Mode-Final/05-Module-5/`

| Batch | Import into CapCut (EDIT.wav) | Chunks | Duration | Chars | Checkpoint | Cut order / notes |
|---|---|---|---:|---:|---|---|
| A1 | `M5-BATCH-A1-EDIT.wav` | M5-01, M5-02 | 3:40 | 2899 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A2 | `M5-BATCH-A2-EDIT.wav` | M5-03, M5-04 | 4:34 | 3246 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A3 | `M5-BATCH-A3-EDIT.wav` | M5-05, M5-06 | 1:54 | 1420 | m5cp1 | Cut boundary: checkpoint stop at end of this batch's last chunk (m5cp1) -- natural seam, cut here. |
| B1 | `M5-BATCH-B1-EDIT.wav` | M5-07, M5-08 | 3:37 | 2787 | m5cp1 | Cut boundary: checkpoint stop at end of this batch's last chunk (m5cp1) -- natural seam, cut here. |
| B2 | `M5-BATCH-B2-EDIT.wav` | M5-09, M5-10 | 4:26 | 3234 | m5cp2 | Cut boundary: checkpoint stop at end of this batch's last chunk (m5cp2) -- natural seam, cut here. |
| C1 | `M5-BATCH-C1-EDIT.wav` | M5-11 | 0:52 | 603 | m5cp2 | Cut boundary: checkpoint stop at end of this batch's last chunk (m5cp2) -- natural seam, cut here. |

**Module total:** 6 batches, 19:04, $2.34.

---

## Module 6 -- Conditions & Disorders

Folder: `AIMT-Listen-Mode-Final/06-Module-6/`

| Batch | Import into CapCut (EDIT.wav) | Chunks | Duration | Chars | Checkpoint | Cut order / notes |
|---|---|---|---:|---:|---|---|
| A1 | `M6-BATCH-A1-EDIT.wav` | M6-01, M6-02 | 3:04 | 2326 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A2 | `M6-BATCH-A2-EDIT.wav` | M6-03 | 2:04 | 1722 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A3 | `M6-BATCH-A3-EDIT.wav` | M6-04, M6-05 | 4:08 | 3190 | m6cp1 | Cut boundary: checkpoint stop at end of this batch's last chunk (m6cp1) -- natural seam, cut here. |
| B1 | `M6-BATCH-B1-EDIT.wav` | M6-06, M6-07 | 2:57 | 2279 | m6cp1 | Cut boundary: checkpoint stop at end of this batch's last chunk (m6cp1) -- natural seam, cut here. |
| B2 | `M6-BATCH-B2-EDIT.wav` | M6-08, M6-09 | 3:58 | 2842 | m6cp2 | Cut boundary: checkpoint stop at end of this batch's last chunk (m6cp2) -- natural seam, cut here. |
| C1 | `M6-BATCH-C1-EDIT.wav` | M6-10 | 0:28 | 402 | m6cp2 | Cut boundary: checkpoint stop at end of this batch's last chunk (m6cp2) -- natural seam, cut here. |

**Module total:** 6 batches, 16:39, $2.11.

---

## Module 7 -- Equipment & Room Setup

Folder: `AIMT-Listen-Mode-Final/07-Module-7/`

| Batch | Import into CapCut (EDIT.wav) | Chunks | Duration | Chars | Checkpoint | Cut order / notes |
|---|---|---|---:|---:|---|---|
| A1 | `M7-BATCH-A1-EDIT.wav` | M7-01, M7-02 | 2:54 | 2618 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A2 | `M7-BATCH-A2-EDIT.wav` | M7-03, M7-04 | 3:18 | 2543 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A3 | `M7-BATCH-A3-EDIT.wav` | M7-05, M7-06, M7-07 | 5:14 | 3788 | m7cp1,m7cp2 | Cut boundary: checkpoint stop at end of this batch's last chunk (m7cp1,m7cp2) -- natural seam, cut here. |
| B1 | `M7-BATCH-B1-EDIT.wav` | M7-08 | 0:25 | 287 | m7cp2 | Cut boundary: checkpoint stop at end of this batch's last chunk (m7cp2) -- natural seam, cut here. |

**Module total:** 4 batches, 11:51, $1.52.

---

## Module 8 -- The Head Spa Service

Folder: `AIMT-Listen-Mode-Final/08-Module-8/`

| Batch | Import into CapCut (EDIT.wav) | Chunks | Duration | Chars | Checkpoint | Cut order / notes |
|---|---|---|---:|---:|---|---|
| A1 | `M8-BATCH-A1-EDIT.wav` | M8-01, M8-02, M8-03 | 4:55 | 3345 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A2 | `M8-BATCH-A2-EDIT.wav` | M8-04 | 4:05 | 3018 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A3 | `M8-BATCH-A3-EDIT.wav` | M8-05 | 2:48 | 2481 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| B1 | `M8-BATCH-B1-EDIT.wav` | M8-06, M8-07, M8-08a | 3:23 | 2741 | m8cp1 | Cut boundary: checkpoint stop at end of this batch's last chunk (m8cp1) -- natural seam, cut here. |
| B2 | `M8-BATCH-B2-EDIT.wav` | M8-08b, M8-08c | 0:53 | 742 | m8cp1 / m8cp2 | Cut boundary: checkpoint stop at end of this batch's last chunk (m8cp1 / m8cp2) -- natural seam, cut here. |
| C1 | `M8-BATCH-C1-EDIT.wav` | M8-09 | 0:26 | 309 | m8cp2 | Cut boundary: checkpoint stop at end of this batch's last chunk (m8cp2) -- natural seam, cut here. |

**Module total:** 6 batches, 16:29, $2.08.

---

## Module 9 -- Checkout, Client Closing & Pricing Strategy

**REJECTED 2026-09-17 -- v2 audio failed owner fidelity review** (systemic
compression drift in the back half of the module — see
`module-09-fidelity-coverage-audit.md`'s "Concrete drift" table for the
full accounting). The v2 RAW/EDIT files this table used to list are
archived, not deleted, at
`AIMT-Listen-Mode-Final/09-Module-9/archive-loose-v2-REJECTED/` — **do
not use those files, do not import them into CapCut.** v1 audio remains
separately archived at `archive-loose-v1/` in that same folder.

**Current status: script + audits rebuilt to v3, awaiting owner text
review. No v3 audio exists yet — this table has nothing to import.** See
`docs/course-audit/listen-mode/module-09-listen-script.md` (v3) and
`module-09-fidelity-coverage-audit.md` (v3) for the corrected script and
the full drift/coverage accounting. Once the owner approves the v3 text,
generation will produce the same 15-batch shape (9 narration + 6
interaction-feedback branches for "Close Without Pressure") at
`AIMT-Listen-Mode-Final/09-Module-9/`, ~14,960 chars (v3 restores content
v2 had dropped, so this batch table will be rebuilt with new durations/
costs once real audio exists — the old table's numbers no longer apply
and are not reproduced here to avoid confusion with the new content).

---

## Module 10 -- Sanitation & Reset Systems

**REJECTED 2026-09-18 -- v1 audio failed the current editorial standard**
("answer above" instead of "answer below" per Section F; the "Reset Under
Pressure" interaction narrating its own verdict before the student could
act, per Section I.2; both checkpoints narrated back-to-back with no gate
between them, per Section I.1 -- see
`docs/course-audit/listen-mode/module-10-listen-script.md`'s "Why v1 was
rejected"). v1's RAW/EDIT files are archived, not deleted, at
`AIMT-Listen-Mode-Final/10-Module-10/archive-loose-v1/` -- **do not use
those files, do not import them into CapCut.**

**Current status: v2 strict-fidelity rebuild complete -- script, audit
(PASS), and audio all done.** See
`docs/course-audit/listen-mode/module-10-listen-script.md` (v2) and
`module-10-fidelity-coverage-audit.md` (v2) for the corrected script and
the full coverage/END-OF-MODULE-CHECK accounting.

**Pronunciation correction (A1 only, 2026-09-18):** the owner caught, by
ear, the locked course-wide single-spaced "A I M T" form rendering as
"Am-tee" (A-I-M spells the real word "aim," which `eleven_v3` collapses
toward). Fixed for this module by respelling both occurrences
comma-separated: "A, I, M, T" / "A, I, M, T's" -- confirmed by ear against
a rejected `[slowly]`-tag alternative. A1 was regenerated; the
mispronounced original is archived at
`AIMT-Listen-Mode-Final/10-Module-10/archive-mispronounced-aimt/`, not
deleted. **Flag for the owner:** every other already-generated module
uses the same single-spaced "A I M T" convention and has not been
re-checked by ear for this same defect -- that is out of scope here.

Folder: `AIMT-Listen-Mode-Final/10-Module-10/`

| Batch | Import into CapCut (EDIT.wav) | Chunks | Duration | Chars | Checkpoint | Cut order / notes |
|---|---|---|---:|---:|---|---|
| A1 | `M10-BATCH-A1-EDIT.wav` | M10-01, M10-02 | 4:04 | 2958 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A2 | `M10-BATCH-A2-EDIT.wav` | M10-03 | 3:03 | 2223 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A3 | `M10-BATCH-A3-EDIT.wav` | M10-04 | 2:16 | 1482 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A4 | `M10-BATCH-A4-EDIT.wav` | M10-05 (interaction prompt + 5 options only) | 1:11 | 903 | -- | Interaction stop (`m10RupDecision`) at end of this clip -- do not append any feedback branch after it; the player halts here until the student selects an option. |
| A4fb0 | `M10-BATCH-A4fb0-EDIT.wav` | M10-05-fb0 (option 1 feedback, strongest) | 0:17 | 254 | -- | Plays only if option 1 is selected -- keep as its own separate clip, never merged into A4 or another fb clip. |
| A4fb1 | `M10-BATCH-A4fb1-EDIT.wav` | M10-05-fb1 (option 2 feedback) | 0:11 | 165 | -- | Plays only if option 2 is selected. |
| A4fb2 | `M10-BATCH-A4fb2-EDIT.wav` | M10-05-fb2 (option 3 feedback) | 0:10 | 165 | -- | Plays only if option 3 is selected. |
| A4fb3 | `M10-BATCH-A4fb3-EDIT.wav` | M10-05-fb3 (option 4 feedback) | 0:09 | 147 | -- | Plays only if option 4 is selected. |
| A4fb4 | `M10-BATCH-A4fb4-EDIT.wav` | M10-05-fb4 (option 5 feedback) | 0:10 | 173 | -- | Plays only if option 5 is selected. |
| B1 | `M10-BATCH-B1-EDIT.wav` | M10-06 | 2:48 | 1945 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| B2 | `M10-BATCH-B2-EDIT.wav` | M10-07 | 2:13 | 1755 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| B3 | `M10-BATCH-B3-EDIT.wav` | M10-08 (checkpoint 1 alone) | 0:27 | 342 | m9cp1 | Checkpoint stop at end of this clip -- the player halts here until `m9cp1` passes. Already its own separate clip; no cutting needed. |
| B4 | `M10-BATCH-B4-EDIT.wav` | M10-09 (post-pass transition, tiny) | 0:02 | 30 | m9cp1 | Plays only after `m9cp1` passes -- a bare 2-second transition line, already isolated. |
| B5 | `M10-BATCH-B5-EDIT.wav` | M10-10 (checkpoint 2 alone) | 0:22 | 319 | m9cp2 | Checkpoint stop at end of this clip -- the player halts here until `m9cp2` passes. Already its own separate clip; no cutting needed. |
| C1 | `M10-BATCH-C1-EDIT.wav` | M10-11 (completion + handoff) | 0:29 | 365 | m9cp2 | Plays only after `m9cp2` passes -- final clip of the module. |

**Module total:** 15 batches, 17:58, $2.18, 13,226 chars.

---

## Module 11 -- AI / Modern Practice Tools

Folder: `AIMT-Listen-Mode-Final/11-Module-11/`

| Batch | Import into CapCut (EDIT.wav) | Chunks | Duration | Chars | Checkpoint | Cut order / notes |
|---|---|---|---:|---:|---|---|
| A1 | `M11-BATCH-A1-EDIT.wav` | M11-01, M11-02 | 2:54 | 2073 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A2 | `M11-BATCH-A2-EDIT.wav` | M11-03 | 2:05 | 1506 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| A3 | `M11-BATCH-A3-EDIT.wav` | M11-04 | 3:02 | 2051 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |
| B1 | `M11-BATCH-B1-EDIT.wav` | M11-05 | 1:56 | 1580 | m11cp1 | Cut boundary: checkpoint stop at end of this batch's last chunk (m11cp1) -- natural seam, cut here. |
| B2 | `M11-BATCH-B2-EDIT.wav` | M11-06 | 3:57 | 2834 | m11cp1,m11cp2 | Cut boundary: checkpoint stop at end of this batch's last chunk (m11cp1,m11cp2) -- natural seam, cut here. |
| C1 | `M11-BATCH-C1-EDIT.wav` | M11-07 | 0:25 | 319 | m11cp2 | Cut boundary: checkpoint stop at end of this batch's last chunk (m11cp2) -- natural seam, cut here. |

**Module total:** 6 batches, 14:18, $1.71.

---

## Module 12 -- Course Completion & Certification (pre-exam orientation only)

Folder: `AIMT-Listen-Mode-Final/12-Module-12/`

| Batch | Import into CapCut (EDIT.wav) | Chunks | Duration | Chars | Checkpoint | Cut order / notes |
|---|---|---|---:|---:|---|---|
| A1 | `M12-BATCH-A1-EDIT.wav` | M12-01 | 4:38 | 3966 | -- | No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting. |

**Module total:** 1 batches, 4:38, $0.65.

---

## Course-wide totals

- **Batches:** 71
- **Total raw runtime:** 203:25 (12205.4s)
- **Total credits charged:** 153,222
- **Total cost:** $25.28
- **Voice:** Jane - Bright, Smooth and Friendly (`Y3ZPRGOSIxbV4Rbb3WiA`)
- **Model:** eleven_v3

## Cut order / processing instructions for the owner

1. Import the `-EDIT.wav` file for each batch above into CapCut -- NOT the
   `-RAW.mp3` (see the CapCut import fix note above for why).
2. Process through CapCut using the canonical settings exactly (Section
   "Canonical CapCut settings") -- one CapCut action per file, same
   settings every time.
3. Export each processed file as WAV, named `M<n>-BATCH-<id>-PROCESSED.wav`,
   into the SAME module folder as its RAW/EDIT files -- do not delete or
   move either of them.
4. A batch spanning multiple player chunks (see the "Chunks" column) does
   NOT need to be split by you -- the next integration pass recovers the
   individual player chunks from each processed batch automatically, using
   the checkpoint/section boundaries already documented per module in
   `docs/course-audit/listen-mode/module-NN-listen-script.md`. You are only
   processing whole batch files, never manually cutting mid-batch.
5. Return the complete set of `-PROCESSED.wav` files (same folder structure) for
   the second integration pass. Nothing gets installed to the live course or
   wired into the manifest until that pass runs and you've confirmed you're
   ready for it.

## What this worklist deliberately does NOT do

- Does not cut final player-chunk MP3s (that happens after your CapCut pass,
  in the second integration pass).
- Does not touch `assets/audio/listen/` (live production audio) or
  `assets/js/aimt-listen-mode-data.js` (the live manifest).
- Does not overwrite Module 1's existing, approved, live production audio --
  that only happens once you've reviewed and approved this pass's Module 1
  replacement specifically.
- Does not activate any module's "Listen with Cadence" entry or remove any
  "coming soon" state.
