# AIMT Listen Mode — Course-Wide Production Log (Modules 0, 2-12)

**Status:** In progress. One running log for the whole batch, updated per
module as generation completes — leaner than Module 1's many separate
review docs, per the task's "don't repeat the v1→v5 exploratory process"
instruction. Voice/model locked throughout: **Jane — Bright, Smooth and
Friendly** (`Y3ZPRGOSIxbV4Rbb3WiA`), **eleven_v3**, same as the frozen
Module 1 reference implementation.

**Method:** each module's script (`module-NN-listen-script.md`) is
generated as a small number of ElevenLabs pieces (checkpoint boundary >
section transition > major teaching break, never mid-sentence), each
under the connector's 5,000-char practical ceiling. Pieces are downloaded,
concatenated with `ffmpeg -c copy` at natural checkpoint boundaries into
CapCut-sized parts (kept under 13-14 min, hard ceiling 15:00), then
converted to CapCut-ready PCM WAV (`-ar 44100 -ac 1 -c:a pcm_s16le`).
Natural internal cut points (for eventual player-segment splitting, done
post-CapCut per Module 1's own precedent) are estimated via
`scripts/aimt-listen-cut-finder.mjs` (character-offset position estimate
snapped to the nearest real detected silence). Raw pieces and CapCut
masters are gitignored (reproducible local artifacts); prompt texts and
this log are tracked.

---

## Module 0 — Welcome

Script: `module-00-listen-script.md`. 5 ElevenLabs generations, 1 flow
(`7iRL8a1n01PV7F97V3NK`).

| Piece | Chars | Duration | Credits | Cost | Generation ID |
|---|---:|---:|---:|---:|---|
| A1 (briefing→0.1→0.2→0.3) | 3,622 | 288.16s | 3,622 | $0.598 | `1aYj8xjJSHCStXk3vzOa` |
| A2 (0.4→0.5→Practice→0.6) | 3,590 | 268.96s | 3,590 | $0.592 | `UsPRjGQVyMNH1fgTb2PJ` |
| A3 (0.7→0.8→0.9) | 2,976 | 251.28s | 2,956 | $0.488 | `UVnKmHRpAknBZGZcClxk` |
| A4 (0.10→0.11→checkpoint) | 1,751 | 141.68s | 1,745 | $0.288 | `GQz1wa9enLC80butRvux` |
| B1 (post-pass recap) | 707 | 57.20s | 701 | $0.117 | `qWGEFViAFqCo5XZKpYWY` |
| **Total** | **12,646** | **1,007.28s (16:47)** | **12,614** | **$2.08** | |

**CapCut masters** (`assets/audio/listen/headspa-mastery/module-00/capcut-masters/`):
- `module-00-part-1-capcut.wav` — 9:17 — Opening → 0.6 (A1+A2)
- `module-00-part-2-capcut.wav` — 6:33 — 0.7 → checkpoint prompt (A3+A4)
- `module-00-part-3-capcut.wav` — 0:57 — post-pass recap/handoff (B1)

Player segments (14, per script's chunk map): to be finalized post-CapCut
once the owner's processed audio is back and real cut points are
confirmed against it (Module 1 precedent).

### Module 0 — v2 update (2026-08-31): "Before you begin" Listen Mode orientation

A new, permanent Listen Mode orientation block was added to the live page
right after the module opener. Per the task's "safe partial replacement"
instruction, only piece **A1** was regenerated — it already covered the
briefing through Section 0.3 and had headroom under the char cap; A2–B1
are untouched, still their original v1 audio. See
`module-00-listen-script.md`'s v2 update note for the full rationale
(including the "AIMT" → `A-I-M-T` pronunciation fix applied to A1's one
existing occurrence in the same pass).

| Piece | Duration | Credits | Cost | Generation ID |
|---|---:|---:|---:|---|
| A1 (v2, regenerated) | 375.52s | 4,829 | $0.797 | `daIoIomPoLDJB1ReFMuC` |

**New CapCut master** (FLAC, per this delivery's explicit instruction —
`assets/audio/listen/headspa-mastery/module-00/capcut-masters/`):
- `module-00-part-1-capcut-v2.flac` — 10:45 — Opening → Before you begin → 0.1 → 0.2 → 0.3 → 0.4 → 0.5 → Practice → 0.6 (A1-v2 + A2)

This **replaces** the old `module-00-part-1-capcut.wav` (same content
range, old A1 wording) as the file the owner should process going
forward. `module-00-part-2-capcut.wav` and `module-00-part-3-capcut.wav`
are unaffected and unchanged.

## Module 2 — Welcoming Your Client — SUPERSEDED, see v2 below

~~Script: `module-02-listen-script.md` (v1). 5 ElevenLabs generations, 1
flow (`dkAS5dmJDA0Q3tnn3qOq`). $1.61.~~ **Obsolete.** The Module 2
curriculum was rebuilt 2026-08-31 (see
`docs/course-audit/modules/module-02-curriculum-rebuild-2026-08.md`) to
align with Module 8's relaxation-first doctrine — the old arrival-
sequence/repeated-permission-asking curriculum this v1 audio narrated no
longer exists on the live page. Not reused; no longer installed as
canonical audio at any point. See "Module 2 — Welcoming Your Client (v2,
rebuilt curriculum)" below for the current, real production entry.

## Module 2 — Welcoming Your Client (v2, rebuilt curriculum)

Script: `module-02-listen-script.md` (v2, fully rewritten). 5 ElevenLabs
generations, 1 flow (`BCNqRhmSqozvNehdafeZ`).

| Piece | Duration | Credits | Cost | Generation ID |
|---|---:|---:|---:|---|
| A1 (briefing→governing principle→2.1) | 171.36s | 2,535 | $0.418 | `VqJewsrhKJfIcbfUniLc` |
| A2 (2.2→2.3+before/during) | 232.40s | 2,801 | $0.462 | `DixFKvOTKpdq0fSmsWar` |
| A3 (downloadable→2.4→2.5) | 250.80s | 3,390 | $0.559 | `eH5rjn1AfFkxEn9aem4u` |
| A4 (2.6→2.7+recap→checkpoint) | 207.92s | 2,981 | $0.492 | `QnYp3Dj4oNe3b1uAruKB` |
| B1 (post-pass recap) | 36.64s | 529 | $0.087 | `visngDyBaLUotB0uJkQd` |
| **Total** | **899.12s (14:59)** | **12,236** | **$2.02** | |

**CapCut masters** (FLAC, per this delivery's explicit instruction —
`assets/audio/listen/headspa-mastery/module-02/capcut-masters/`):
- `module-02-part-1-capcut.flac` — 6:44 — Opening → end of 2.3/before-during (A1+A2)
- `module-02-part-2-capcut.flac` — 7:39 — downloadable → checkpoint prompt (A3+A4)
- `module-02-part-3-capcut.flac` — 0:37 — post-pass recap/handoff (B1)

Player segments (12, per script's chunk map): finalized post-CapCut,
same as every other new module this pass.

## Module 3 — Hair & Scalp Anatomy

Script: `module-03-listen-script.md`. Generated and CapCut-mastered this
pass (see `assets/audio/listen/headspa-mastery/module-03/`); generation
IDs/costs were not captured to this log before the mid-session context
compaction — durations below are read directly from the installed files
as the authoritative record.

**CapCut masters** (`assets/audio/listen/headspa-mastery/module-03/capcut-masters/`):
- `module-03-part-1-capcut.wav` — 10:31
- `module-03-part-2-capcut.wav` — 8:10
- `module-03-part-3-capcut.wav` — 0:46

See the script doc for the full chunk/section map.

## Module 4 — Microscopy & Scalp Assessment

Script: `module-04-listen-script.md`. Generated and CapCut-mastered this
pass; see note under Module 3 above (same gap — generation IDs not
logged before compaction, durations authoritative from installed files).

**CapCut masters** (`assets/audio/listen/headspa-mastery/module-04/capcut-masters/`):
- `module-04-part-1-capcut.wav` — 9:30
- `module-04-part-2-capcut.wav` — 10:33
- `module-04-part-3-capcut.wav` — 0:46

## Module 5 — Scalp Patterns & Service Adaptation

Script: `module-05-listen-script.md`. Generated and CapCut-mastered this
pass; see note under Module 3 above.

**CapCut masters** (`assets/audio/listen/headspa-mastery/module-05/capcut-masters/`):
- `module-05-part-1-capcut.wav` — 10:37
- `module-05-part-2-capcut.wav` — 8:16
- `module-05-part-3-capcut.wav` — 0:48

## Module 7 — Equipment & Room Setup

Script: `module-07-listen-script.md`. Generated and CapCut-mastered this
pass; see note under Module 3 above.

**CapCut masters** (`assets/audio/listen/headspa-mastery/module-07/capcut-masters/`):
- `module-07-part-1-capcut.wav` — 11:58
- `module-07-part-2-capcut.wav` — 0:24 (only 2 parts for this module — see script doc's 4-generation plan)

## Module 6 — Conditions & Disorders

Script: `module-06-listen-script.md`. 6 ElevenLabs generations, 1 flow
(`iSYQCi2PoMcrWjrigsdu`).

| Piece | Duration | Credits | Cost | Generation ID |
|---|---:|---:|---:|---|
| A1 (briefing→6.1→6.2) | 182.32s | 2326 | $0.384 | `M6aqenwOCZt5SqUEHpGT` |
| A2 (6.3) | 138.72s | 1722 | $0.284 | `NbqbNcwiKBKZCtrlWfZD` |
| A3 (6.4→checkpoint 1) | 261.84s | 3190 | $0.526 | `EOZ4IKiOQ89h6GnPPOiK` |
| B1 (6.5-6.6→sort interaction) | 186.64s | 2279 | $0.376 | `cHQiEs6PjY2qAGLS0qyh` |
| B2 (6.7→6.8→checkpoint 2) | 222.16s | 2842 | $0.469 | `J64raTxT00OAVgoIb4Js` |
| C1 (post-pass recap) | 30.96s | 402 | $0.066 | `DqdQpzBvaophDAiWuZrU` |
| **Total** | **1022.64s (17:03)** | **12,761** | **$2.11** | |

**CapCut masters** (`assets/audio/listen/headspa-mastery/module-06/capcut-masters/`):
- `module-06-part-1-capcut.wav` — 9:43 — Opening → checkpoint 1 prompt (A1+A2+A3)
- `module-06-part-2-capcut.wav` — 6:49 — Post-pass 6.5 → checkpoint 2 prompt (B1+B2)
- `module-06-part-3-capcut.wav` — 0:31 — post-pass recap/handoff (C1)

## Module 8 — The Head Spa Service

Script: `module-08-listen-script.md`. 5 ElevenLabs generations, 1 flow
(`wP5b64q0WbHhz6uaDXnp`).

| Piece | Duration | Credits | Cost | Generation ID |
|---|---:|---:|---:|---|
| A1 (briefing→phases→8.1) | 268.08s | 3320 | $0.548 | `pp6tIR1KNpPQmy5RKDGR` |
| A2 (8.2 chapters 1-5) | 204.32s | 2595 | $0.428 | `OB6rrjpLeLPp4x1Gbr11` |
| A3 (8.2 chapters 6-9 + Timer) | 144.80s | 2056 | $0.339 | `pG8fe7LZRUn4bibrxz9F` |
| B1 (8.3→Protect the Flow→cp1+cp2) | 238.40s | 3025 | $0.499 | `1xNDCd3Ru40iSCQnTAg5` |
| C1 (post-pass recap) | 24.24s | 309 | $0.051 | `1ws1EwxSqYAimSX6h71i` |
| **Total** | **879.84s (14:40)** | **11,305** | **$1.87** | |

**CapCut masters** (`assets/audio/listen/headspa-mastery/module-08/capcut-masters/`):
- `module-08-part-1-capcut.wav` — 10:17 — Opening → end of service map (A1+A2+A3)
- `module-08-part-2-capcut.wav` — 3:58 — 8.3 → both checkpoints (B1)
- `module-08-part-3-capcut.wav` — 0:24 — post-pass recap/handoff (C1)

## Module 9 — Checkout, Client Closing & Pricing Strategy

Script: `module-09-listen-script.md`. Checkpoint ids on this module
(`m10cp1`, `m10cp2`) carry their historical prefix from the Module 9/10
reorder — intentional, not touched (see
`module-09-reorder-migration-plan.md` §11). 6 ElevenLabs generations,
1 flow (`ms46I3ypqJ8Dnqtjchf2`).

| Piece | Duration | Credits | Cost | Generation ID |
|---|---:|---:|---:|---|
| A1 (briefing→9.1→interaction) | 219.92s | 2864 | $0.473 | `4eXVnFD9GVtTeE8KYX2w` |
| A2 (9.2-9.3) | 115.68s | 1397 | $0.231 | `5DmnwT7aSLg9M6xjUK0I` |
| A3 (9.4-9.7→checkpoint 1) | 268.40s | 3350 | $0.553 | `Gd6tM6kzrfhX6TCc22i4` |
| B1 (9.8) | 96.72s | 1125 | $0.186 | `QIBivjMiyALeqcqHXxQK` |
| B2 (9.9→checkpoint 2) | 99.76s | 1099 | $0.181 | `KHQrhufNZxAny0QOIAwh` |
| C1 (post-pass recap) | 20.64s | 275 | $0.045 | `nW0etSetZhb5DAvhTGO6` |
| **Total** | **821.12s (13:41)** | **10,110** | **$1.67** | |

**CapCut masters** (`assets/audio/listen/headspa-mastery/module-09/capcut-masters/`):
- `module-09-part-1-capcut.wav` — 10:04 — Opening → checkpoint 1 prompt (A1+A2+A3)
- `module-09-part-2-capcut.wav` — 3:17 — Post-pass 9.8 → checkpoint 2 prompt (B1+B2)
- `module-09-part-3-capcut.wav` — 0:21 — post-pass recap/handoff (C1)

## Module 10 — Sanitation & Reset Systems

Script: `module-10-listen-script.md`. Checkpoint ids on this module
(`m9cp1`, `m9cp2`) carry the same historical-reorder prefix as Module 9
above, mirrored. 6 ElevenLabs generations, 1 flow (`VpB7m4FDqxa5qSXSdITu`).

| Piece | Duration | Credits | Cost | Generation ID |
|---|---:|---:|---:|---|
| A1 (briefing→intro→10.1) | 211.84s | 2667 | $0.440 | `I0sMksSZYvtmhx3nsX4x` |
| A2 (10.2) | 182.48s | 2174 | $0.359 | `xtSGdXPG4D7iI4TJ8CZn` |
| A3 (10.3→Reset Under Pressure) | 181.28s | 2261 | $0.373 | `4Ve1CHgFMn1hbvnvYqBy` |
| B1 (10.4) | 156.24s | 1905 | $0.314 | `x4ZWc733GW2HT5JEIYF8` |
| B2 (10.5→cp1→cp2) | 189.36s | 2354 | $0.388 | `DhipVPnYGqawpnzqOFNq` |
| C1 (post-pass recap) | 29.68s | 364 | $0.060 | `jPOIM5YuJF9csIqSzwaU` |
| **Total** | **950.88s (15:51)** | **11,725** | **$1.93** | |

**CapCut masters** (`assets/audio/listen/headspa-mastery/module-10/capcut-masters/`):
- `module-10-part-1-capcut.wav` — 9:36 — Opening → end of 10.3/interaction (A1+A2+A3)
- `module-10-part-2-capcut.wav` — 5:46 — 10.4 → both checkpoints (B1+B2)
- `module-10-part-3-capcut.wav` — 0:30 — post-pass recap/handoff (C1)

## Module 11 — AI / Modern Practice Tools

Script: `module-11-listen-script.md`. Checkpoint ids `m11cp1`/`m11cp2` are
this module's own native ids (no cross-numbering). 6 ElevenLabs
generations, 1 flow (`Gs0mGfRQh6OkG8KQGCnR`).

| Piece | Duration | Credits | Cost | Generation ID |
|---|---:|---:|---:|---|
| A1 (briefing→intro→11.1) | 184.88s | 2083 | $0.344 | `7VyqYomU0tDrDlbzAvoS` |
| A2 (11.2 B.R.I.E.F.) | 127.68s | 1506 | $0.248 | `ldeBpKZdwWlFYve525E2` |
| A3 (11.3→11.4) | 181.76s | 2051 | $0.338 | `5MYi1DTzDsRnySoP2iEh` |
| B1 (11.5→checkpoint 1) | 127.44s | 1580 | $0.261 | `ZK6bWyksRmWGp88r9PaH` |
| B2 (11.6-11.8→checkpoint 2) | 240.32s | 2831 | $0.467 | `CgIsLL36Dm1tk9NRKUPE` |
| C1 (post-pass recap) | 26.32s | 319 | $0.053 | `9OTcy2rie78swO2rsewa` |
| **Total** | **888.40s (14:48)** | **10,370** | **$1.71** | |

**CapCut masters** (`assets/audio/listen/headspa-mastery/module-11/capcut-masters/`):
- `module-11-part-1-capcut.wav` — 8:14 — Opening → end of 11.4 (A1+A2+A3)
- `module-11-part-2-capcut.wav` — 6:08 — 11.5 → both checkpoints (B1+B2)
- `module-11-part-3-capcut.wav` — 0:26 — post-pass recap/handoff (C1)

## Module 12 — Course Completion & Certification (pre-exam orientation only)

Script: `module-12-listen-script.md`. **Special scope**: narrates only the
pre-exam State A orientation screen in `assets/js/module12-certification.js`
(`renderStateA`) — never the scored exam itself. Wired as a real, working
"Listen with Cadence" entry on that screen (safe because
`AIMTListenMode.mount()` already refuses real playback to production
students until every chunk is `qaStatus: 'APPROVED'`), and explicitly
torn down (`AIMTListenMode.unmount()`) the instant "Start Final Exam" is
tapped, before any attempt is created server-side. 1 ElevenLabs
generation, 1 flow (`xyHEzSdteG7sA0Ug0BFC`).

| Piece | Duration | Credits | Cost | Generation ID |
|---|---:|---:|---:|---|
| A1 (full State A orientation) | 276.96s | 3981 | $0.657 | `AIj2MNjoZKc2B9lHCDbh` |

**CapCut masters** (`assets/audio/listen/headspa-mastery/module-12/capcut-masters/`):
- `module-12-part-1-capcut.wav` — 4:37 — full pre-exam orientation, single part, no checkpoint

---

**Running total so far:** 30 generations logged with full detail in the
prior pass (Modules 6, 8, 9, 10, 11, 12) — $9.29 — plus the original
Module 0 and v1 Module 2 passes ($3.69, Module 2's now superseded) and
Modules 3, 4, 5, 7 produced and CapCut-mastered but not individually
cost-logged. **This pass** (Module 2 curriculum rebuild + Module 0
orientation) adds 6 more generations — Module 0's A1 regeneration
($0.797) and Module 2's full 5-piece v2 re-production ($2.02) — **$2.82**,
bringing the running total to **$15.80** across all Listen Mode
production this session. **10 of 11 new modules (0, 2, 3, 4, 5, 6, 7, 8,
9, 10, 11) plus the Module 12 pre-exam orientation are audio-produced
through CapCut-master stage** — raw audio generated, CapCut masters
built locally — none owner-processed or canonical-installed yet. All
new-module manifest/qaStatus wiring stays `GENERATED`, never `APPROVED`,
until the owner's CapCut pass and real listen-through (Module 1's own
precedent).
