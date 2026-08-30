# Module 1 — Listen Mode Audio Production & QA Sheet

**Status:** Owner handoff document. 5 of 14 chunks (M1-01, M1-02, M1-03,
M1-04, M1-07) have real generated audio as of 2026-08-30 — see Section 3a.
**None of the 14 chunks are APPROVED** — GENERATED still requires the
owner's own listening review before Listen Mode can go live for real
students (Section 4 still applies in full). The remaining 9 chunks are
untouched at `NOT_GENERATED`. M1-02/M1-03 exist specifically to test
whether Jane's voice drifts between separate generations, and a temporary,
non-production split-chunk comparison for M1-04 exists to test whether its
146-second length is contributing to the flatness the owner noticed — see
[`module-01-cohesion-review.md`](./module-01-cohesion-review.md) for both,
including exact listening order and review questions. **No decision about
splitting M1-04, or about the rest of the batch, has been made** — the
canonical manifest still points M1-04 at the single 146-second file.
**Voice:** Jane — bright, smooth and friendly.
**Model:** Eleven v3.
**Course / module:** HeadSpa Mastery, Module 1 — Role, Scope & Professional
Boundaries.
**Script source of truth:** [`module-01-listen-script-draft.md`](./module-01-listen-script-draft.md) (v3).
**TTS text source of truth:** [`tts/module-01/`](./tts/module-01/) — one plain
`.txt` file per chunk, pure spoken text only (sparse v3 tags inline, no
metadata, no structural markers — see that folder's files directly).
**Manifest (machine-readable mirror of this sheet):** [`assets/js/aimt-listen-mode-data.js`](../../../assets/js/aimt-listen-mode-data.js) —
`AIMTListenModeData.manifests['headspa-mastery'][1]`. The `qaStatus` field on
each chunk there is the single source of truth the player actually reads;
this document is the human-readable production/QA record that should stay in
sync with it as the owner works through generation.

---

## 1. Production table

| Chunk | TTS text file | Target audio filename | Chars | Est. credits* | Visual target | Checkpoint/gate |
|---|---|---|---|---|---|---|
| M1-01 | `tts/module-01/m1-01.txt` | `assets/audio/listen/headspa-mastery/module-01/m1-01.mp3` | 964 | ~964 | Written briefing block | — |
| M1-02 | `tts/module-01/m1-02.txt` | `assets/audio/listen/headspa-mastery/module-01/m1-02.mp3` | 1,020 | ~1,020 | — | — |
| M1-03 | `tts/module-01/m1-03.txt` | `assets/audio/listen/headspa-mastery/module-01/m1-03.mp3` | 1,250 | ~1,250 | — | — |
| M1-04 | `tts/module-01/m1-04.txt` | `assets/audio/listen/headspa-mastery/module-01/m1-04.mp3` | 1,841 | ~1,841 | "Language that keeps you in scope" card | — |
| M1-05 | `tts/module-01/m1-05.txt` | `assets/audio/listen/headspa-mastery/module-01/m1-05.mp3` | 885 | ~885 | "May fall within scope" card | — |
| M1-06 | `tts/module-01/m1-06.txt` | `assets/audio/listen/headspa-mastery/module-01/m1-06.mp3` | 1,722 | ~1,722 | "Where is the line?" practice interaction | — |
| M1-07 | `tts/module-01/m1-07.txt` | `assets/audio/listen/headspa-mastery/module-01/m1-07.mp3` | 490 | ~490 | `m1cp1` checkpoint card | **STOP — `m1cp1`** |
| M1-08 | `tts/module-01/m1-08.txt` | `assets/audio/listen/headspa-mastery/module-01/m1-08.mp3` | 240 | ~240 | — | Plays only after `m1cp1` PASS |
| M1-09 | `tts/module-01/m1-09.txt` | `assets/audio/listen/headspa-mastery/module-01/m1-09.mp3` | 820 | ~820 | "What a head spa can support" card | — |
| M1-10 | `tts/module-01/m1-10.txt` | `assets/audio/listen/headspa-mastery/module-01/m1-10.mp3` | 537 | ~537 | — | — |
| M1-11 | `tts/module-01/m1-11.txt` | `assets/audio/listen/headspa-mastery/module-01/m1-11.mp3` | 847 | ~847 | — | — |
| M1-12 | `tts/module-01/m1-12.txt` | `assets/audio/listen/headspa-mastery/module-01/m1-12.mp3` | 1,010 | ~1,010 | — | — |
| M1-13 | `tts/module-01/m1-13.txt` | `assets/audio/listen/headspa-mastery/module-01/m1-13.mp3` | 381 | ~381 | `m1cp2` checkpoint card | **STOP — `m1cp2`** |
| M1-14 | `tts/module-01/m1-14.txt` | `assets/audio/listen/headspa-mastery/module-01/m1-14.mp3` | 918 | ~918 | Completion card | Plays only after `m1cp2` PASS |

## 1a. Duration/length classification (measured 2026-08-30)

Estimated duration = spoken words (tags excluded) ÷ 145 wpm. Actual =
measured from real generated audio where it exists. Flag bands per the
cohesion-validation task: UNDER 60 / 60–90 / 90–120 / OVER 120 seconds.

| Chunk | Words | Est. duration | Actual duration | Flag (by actual, or estimate if ungenerated) |
|---|---|---|---|---|
| M1-01 | 170 | 70.3s | **65.44s** | 60–90 sec |
| M1-02 | 151 | 62.5s | **76.80s** | 60–90 sec |
| M1-03 | 209 | 86.5s | **92.16s** | 90–120 sec |
| M1-04 | 289 | 119.6s | **146.08s** | OVER 120 sec |
| M1-05 | 143 | 59.2s | — | UNDER 60 sec |
| M1-06 | 260 | 107.6s | — | 90–120 sec |
| M1-07 | 81 | 33.5s | **38.72s** | UNDER 60 sec |
| M1-08 | 41 | 17.0s | — | UNDER 60 sec |
| M1-09 | 127 | 52.6s | — | UNDER 60 sec |
| M1-10 | 83 | 34.3s | — | UNDER 60 sec |
| M1-11 | 137 | 56.7s | — | UNDER 60 sec |
| M1-12 | 148 | 61.2s | — | 60–90 sec |
| M1-13 | 57 | 23.6s | — | UNDER 60 sec |
| M1-14 | 144 | 59.6s | — | UNDER 60 sec |

**Observation directly relevant to the owner's flatness concern:** every
chunk measured so far ran *longer* than its word-count estimate, and the
gap grows with length — M1-01 (170 words) actually ran 7% *short* of
estimate, M1-07 (81 words) ran 16% *over*, M1-02 (151 words) ran 23% over,
M1-03 (209 words) ran 6% over, and **M1-04 (289 words, the one flagged as
flat) ran 22% over its estimate — the largest overrun of any measured
chunk, and the only one that crosses the OVER-120-second line at all.**
This doesn't prove causation by itself, but it's consistent with the
owner's hypothesis that longer generations pick up extra pacing/pauses
that read as flatness — see the full A/B split evidence and listening
package in [`module-01-cohesion-review.md`](./module-01-cohesion-review.md).
M1-06 (260 words, estimated 90–120s) has not been generated yet and is the
next-longest chunk after M1-04 — worth prioritizing in the eventual
consistency/length decision since it sits in the same risk band.

---

\* **Credit assumption:** the table above assumes a **1 character ≈ 1
ElevenLabs credit** baseline (the standard input-character convention),
before any voice- or plan-specific multiplier. Eleven v3 and some
voice/plan tiers apply their own multiplier — confirm the actual
multiplier for your account in the ElevenLabs dashboard before generating;
the totals below are the pre-multiplier baseline, not a guaranteed final
credit cost.

> Note on filenames: the task brief's Section 5 example illustrates the
> convention with a `head-spa` folder segment, but this sheet and the actual
> manifest both use `headspa-mastery` instead — that's the one course slug
> CLAUDE.md requires everywhere in this repo (Supabase `course_slug`, Stripe
> metadata, `APP_STATE`, etc.), so the audio path convention follows it
> rather than introducing a second, inconsistent name for the same course.
> The manifest's `audioPath(courseSlug, moduleId, chunkId)` helper derives
> this automatically from `courseSlug` for every future module/course —
> nothing is hand-overridden per chunk.

---

## 2. Totals

- **Total characters (all 14 chunks, TTS text as written, tags included):** 13,017
- **Total estimated ElevenLabs credits** (1:1 baseline, pre-multiplier): **≈13,017**
- **Total spoken words** (tags excluded — the actual words Jane will say): 2,040
- **Estimated final audio duration** at ~145 words/minute: **≈14.1 minutes** (consistent with the script's 14–15 minute target; real duration will vary with Jane's actual pacing and the weight given to `[short pause]`/`[slowly]` tags)

---

## 3. Audio QA checklist (per chunk)

**Voice:** Jane — bright, smooth and friendly. **Model:** Eleven v3.

For every chunk, check:

- [ ] Pronunciation (including "seborrheic dermatitis," "alopecia," "dermatologist" — the clinical terms most likely to be mispronounced)
- [ ] Pacing (matches the intended teaching rhythm — checkpoint questions in particular should land deliberately, not rushed)
- [ ] Warmth (matches Cadence's voice standard — see `00-cadence-character-instruction-constitution.md`)
- [ ] Consistency with the other 13 chunks (same perceived personality, not 14 separate takes that feel like different people)
- [ ] No strange audio-tag interpretation (a `[slowly]`/`[warmly]`/`[firmly]`/`[short pause]`/`[pause]` tag rendered as spoken text instead of a performance direction is an automatic REGENERATE)
- [ ] No clipping at the start or end of the file
- [ ] No awkward chunk start/end (a clean handoff matters most for M1-07→M1-08 and M1-13→M1-14, and for every normal chunk-to-chunk boundary, since the player advances with no gap and no overlap)
- [ ] Safety-critical wording exact — M1-04's referral triggers, M1-05's "never authorized" list, M1-09's "cannot do" list, and M1-11/M1-12's referral framing must match the TTS text file verbatim, not a paraphrase introduced during generation
- [ ] Checkpoint prompt exact (M1-07, M1-13) — these are graded-question text; any drift from the `.txt` file is a REGENERATE, no exceptions
- [ ] No spoken structural tags — confirm `[CHECKPOINT STOP — PLAYBACK PAUSES]` / `[PLAY ONLY AFTER AUTHORITATIVE CHECKPOINT PASS]` never appear in the audio (they were stripped from the TTS text already, but verify nothing bled through if text was copied from the script doc instead of the `.txt` file)

### Status values

Set per-chunk status directly in `assets/js/aimt-listen-mode-data.js` (the
`qaStatus` field the player actually reads):

- `NOT_GENERATED` — default; no audio exists yet. **Every chunk starts here.**
- `GENERATED` — audio exists and has been installed at the target filename, but has not passed the checklist above yet. **Generated is not approved** — the player only ever treats `APPROVED` chunks as available to real students (see Section 4).
- `APPROVED` — passed the checklist above. Eligible for production playback once every one of the 14 chunks reaches this status.
- `REGENERATE` — failed the checklist; needs a new take before it can be approved.

| Chunk | Status |
|---|---|
| M1-01 | **GENERATED — OWNER REVIEW REQUIRED** |
| M1-02 | **GENERATED — OWNER REVIEW REQUIRED** (consistency check vs. M1-01) |
| M1-03 | **GENERATED — OWNER REVIEW REQUIRED** (consistency check vs. M1-01) |
| M1-04 | **GENERATED — OWNER REVIEW REQUIRED** (also under a separate split-vs-single cohesion question — see below) |
| M1-05 | NOT_GENERATED |
| M1-06 | NOT_GENERATED |
| M1-07 | **GENERATED — OWNER REVIEW REQUIRED** |
| M1-08 | NOT_GENERATED |
| M1-09 | NOT_GENERATED |
| M1-10 | NOT_GENERATED |
| M1-11 | NOT_GENERATED |
| M1-12 | NOT_GENERATED |
| M1-13 | NOT_GENERATED |
| M1-14 | NOT_GENERATED |

---

## 3a. Real-audio pipeline validation pilot (M1-01, M1-02, M1-03, M1-04, M1-07)

**Date generated:** 2026-08-30 (M1-01/M1-04/M1-07 first pass; M1-02/M1-03
and the M1-04 cohesion-test split added in a follow-up pass the same day).
**Voice:** Jane — Bright, Smooth and Friendly (`voice_id:
Y3ZPRGOSIxbV4Rbb3WiA`). **Model:** `eleven_v3`. **Output:** confirmed MP3,
44.1 kHz, 128 kbps, mono (verified directly against each downloaded file
with `file(1)` — matches the production spec in Section 5 below exactly).
Generated via the connected ElevenLabs Creative flow platform, one shared
flow for review:
[elevenlabs.io/app/flows/fp2ZnP1Hfna5trlQ3bYD](https://elevenlabs.io/app/flows/fp2ZnP1Hfna5trlQ3bYD).

| Chunk | File | Duration | Chars (incl. tags) | Actual credits | Actual cost (USD) |
|---|---|---|---|---|---|
| M1-01 | `assets/audio/listen/headspa-mastery/module-01/m1-01.mp3` | 65.44s | 964 | 964 | $0.15906 |
| M1-02 | `assets/audio/listen/headspa-mastery/module-01/m1-02.mp3` | 76.80s | 1,020 | 1,020 | $0.16830 |
| M1-03 | `assets/audio/listen/headspa-mastery/module-01/m1-03.mp3` | 92.16s | 1,250 | 1,250 | $0.20625 |
| M1-04 | `assets/audio/listen/headspa-mastery/module-01/m1-04.mp3` | 146.08s | 1,841 | 1,841 | $0.30377 |
| M1-07 | `assets/audio/listen/headspa-mastery/module-01/m1-07.mp3` | 38.72s | 490 | 490 | $0.08085 |
| **Total (production)** | | **419.20s (~7:00)** | **5,565** | **5,565** | **$0.91823** |

**Cohesion-test files (non-canonical, comparison only — not counted in the
production total above):**

| File | Duration | Chars | Actual credits | Actual cost (USD) |
|---|---|---|---|---|
| `.../cohesion-test/m1-04a-cohesion-test.mp3` | 80.80s | 1,060 | 1,060 | $0.17490 |
| `.../cohesion-test/m1-04b-cohesion-test.mp3` | 62.08s | 779 | 779 | $0.12854 |
| **Total (cohesion test)** | **142.88s** | **1,839** | **1,839** | **$0.30344** |

Full detail, listening order, and review questions for both the
consistency test (M1-01→02→03) and the split test
(M1-04 vs. M1-04a→M1-04b) are in
[`module-01-cohesion-review.md`](./module-01-cohesion-review.md) — that
document is the actual owner review package; this sheet just carries the
production bookkeeping.

**On credit multiplier (Section 4 of the task):** the pre-generation
*estimate* returned by this platform for these same three chunks was
~2.2 credits per character (e.g. 1,083.94 credits estimated for M1-07's
490 characters) — noticeably higher than what was **actually charged**,
which came out to a flat **1 credit per character** for every chunk
generated (964 credits for 964 characters, 1,841 for 1,841, 490 for 490,
each confirmed by `creative_get_flow_run_status` after generation
completed). In other words: **the estimate overstated the real cost by
roughly 2.2×** on this platform for Jane + Eleven v3. This does not
confirm or rule out the ~3× multiplier the owner previously saw on the
raw ElevenLabs dashboard directly — this platform's "credits" are its own
internal currency, not a verified 1:1 mirror of ElevenLabs' own billing —
but it does mean: **trust the post-generation actual price, not the
pre-generation estimate**, when budgeting the remaining 11 chunks.
Extrapolating from the actual 1-credit-per-character rate: the remaining
~9,722 characters (13,017 total − 3,295 already spent) would cost
approximately **$1.60** at this same rate, for an estimated full-module
total near **$2.15** — materially cheaper than the original 1:1-credit
*assumption* documented in Section 1 above implied once ElevenLabs' own
plan-level cent-per-credit rate is applied (that assumption was about
credit *count*, not dollar cost; this section supplies the first real
dollar figures).

**QA verification performed (not a substitute for the owner's own
listening review — see checklist below and Section 10 of the task):**
- M1-07 was independently re-transcribed (Eleven Scribe, from a freshly
  re-uploaded copy of the downloaded file — not the original generation
  node, to rule out a prompt-echo false pass) and contains **no spoken
  structural markers** and **no audible bracket tags** — `[short pause]`
  and `[slowly]` were correctly interpreted as delivery direction, never
  vocalized. The checkpoint question was transcribed **word-for-word
  identical** to `M1.questions.m1cp1`.
- M1-04 was independently re-transcribed the same way. Every safety-critical
  phrase — the two "Say this" scripts, the four "Never say" phrases, and the
  full referral-trigger list — transcribed correctly and matches the
  approved TTS text (transcription differs only in ASR punctuation
  normalization, not wording).
- All three files verified as real, playable MP3s locally: mounted in the
  actual Listen Mode player, played, paused, sought forward/backward, and
  had their speed changed successfully against the real audio (see the
  task's final report for the full player-integration results).

---

## 3b. Production standard LOCKED + remaining 9 RAW chunks generated (2026-08-30)

**`CADENCE_AUDIO_MASTER_PRESET_V1` is now locked** — see
[`module-01-production-standard-LOCKED.md`](./module-01-production-standard-LOCKED.md)
for the full, authoritative pipeline definition (RAW → Auphonic
conservative finish → align → 75% Auphonic / 25% RAW blend → two-pass
loudnorm → canonical MP3), the locked chunking standard, and the final
M1-04 single-chunk decision. That document supersedes the exploratory
framing everywhere else in this sheet.

**RAW ElevenLabs audio generated for the remaining 9 chunks** (M1-05,
M1-06, M1-08, M1-09, M1-10, M1-11, M1-12, M1-13, M1-14) — same voice
(Jane, `Y3ZPRGOSIxbV4Rbb3WiA`), same model (`eleven_v3`), exact approved
text, zero wording changes, all on the first attempt (no retries needed):

| Chunk | Duration | Credits | Raw path |
|---|---|---|---|
| M1-05 | 69.25s | 885 | `raw/m1-05.mp3` |
| M1-06 | 128.44s | 1,722 | `raw/m1-06.mp3` |
| M1-08 | 15.65s | 240 | `raw/m1-08.mp3` |
| M1-09 | 62.75s | 820 | `raw/m1-09.mp3` |
| M1-10 | 39.63s | 537 | `raw/m1-10.mp3` |
| M1-11 | 57.16s | 847 | `raw/m1-11.mp3` |
| M1-12 | 75.65s | 1,010 | `raw/m1-12.mp3` |
| M1-13 | 30.93s | 381 | `raw/m1-13.mp3` |
| M1-14 | 68.21s | 918 | `raw/m1-14.mp3` |
| **Total** | **547.67s (~9:08)** | **7,360** | |

At the confirmed actual rate (~1 credit/character, ~$0.0165/credit,
established across every generation this whole engagement): **≈$1.21**
for this batch. M1-06 (128.44s) sits above the locked standard's ~120s
review line — this is the "Where is the line?" practice interaction,
already deliberately reviewed and kept as one cohesive unit in the
original v1→v2 script compression pass specifically because its 4-part
exercise structure (with functional pauses between statements) doesn't
have a clean split point without breaking the interaction — consistent
with "review, don't automatically split," not an oversight.

**Raw preservation backfilled** for the 5 previously-generated chunks
(M1-01, M1-02, M1-03, M1-04, M1-07) — their canonical files were, and
still are, identical to untouched RAW generations, so copying them into
`raw/` simply formalizes what was already true (verified byte-identical
before and after).

**Blocked:** no chunk's canonical file reflects the locked
`CADENCE_AUDIO_MASTER_PRESET_V1` pipeline yet — `AUPHONIC_API_KEY` was not
available this session, and per the locked standard's own instruction this
script will not silently substitute a non-Auphonic finish. All 14 raw
files now exist; canonical production audio (the Auphonic+blend step) is
the next step once Auphonic access is available. `qaStatus` was left
exactly as it was for all 14 chunks — see the task's final report for the
full accounting.

---

## 4. Why the player won't show Listen Mode yet

`AIMTListenModeData.isProductionReady()` requires **every** chunk's
`qaStatus` to be `APPROVED`. Right now 5 are `GENERATED` (M1-01, M1-02,
M1-03, M1-04, M1-07) and 9 are `NOT_GENERATED` — none are `APPROVED` — so
`AIMTListenMode.mount()` still returns early and never renders the "Listen
to this module" entry point for real students, confirmed directly against
the real installed files in this pilot (a `throwingDoc` test proved
`mount()` never touches the DOM in this state). There is nothing to disable
or hide manually. A `?listenQA=1` URL flag exists for internal preview of
`GENERATED`-or-better chunks, showing a "QA preview" badge so it's never
mistaken for the real, released experience — this is how the real files
were exercised end-to-end in the player during the first pilot pass.

---

## 5. Owner generation steps (see also the final task report for the same steps)

**For M1-01, M1-02, M1-03, M1-04, and M1-07 — already generated, review
only:**
1. Listen to the five files directly at
   `assets/audio/listen/headspa-mastery/module-01/m1-01.mp3`, `m1-02.mp3`,
   `m1-03.mp3`, `m1-04.mp3`, `m1-07.mp3` — see
   [`module-01-cohesion-review.md`](./module-01-cohesion-review.md) for the
   recommended listening order (M1-01→02→03 back to back matters more than
   listening to each in isolation, since the whole point is judging
   consistency across the boundary).
2. Also review the M1-04 split-chunk comparison in that same document
   (`cohesion-test/m1-04a-cohesion-test.mp3` →
   `m1-04b-cohesion-test.mp3`) and decide whether M1-04 should be
   regenerated as two chunks or kept as one before approving it.
3. Score each against the QA checklist in Section 3 above.
4. In `assets/js/aimt-listen-mode-data.js`, change that chunk's `qaStatus`
   from `'GENERATED'` to `'APPROVED'` if it passes, or `'REGENERATE'` if it
   doesn't (then regenerate from its `.txt` file and re-review). If M1-04
   is to be split, that's a manifest/chunk-boundary change beyond a status
   flip — flag it for a follow-up task rather than hand-editing the
   manifest structure here.

**For the remaining 9 chunks (M1-05, M1-06, M1-08 through M1-14 excluding
M1-07) — not yet generated:**
1. Open ElevenLabs, select the Jane voice (`Y3ZPRGOSIxbV4Rbb3WiA`) and the
   Eleven v3 model.
2. For each chunk, paste the exact contents of its `.txt` file from
   `tts/module-01/` (nothing else — no headers, no chunk IDs, no metadata).
3. Generate, listen back against the QA checklist above.
4. Export as MP3 and save to the exact target filename in the table (the
   `assets/audio/listen/headspa-mastery/module-01/` folder now exists,
   created and committed by the pilot).
5. Update that chunk's `qaStatus` in `assets/js/aimt-listen-mode-data.js`
   to `GENERATED`, then to `APPROVED` once it passes the checklist (or
   `REGENERATE` if it doesn't, and repeat from step 2).
6. Once all 14 are `APPROVED`, Listen Mode becomes available to real
   students automatically — no other code change is required.

**Note on cost:** budget from the *actual* per-character rate observed in
Section 3a (1 credit/character for Jane + Eleven v3 on this platform, not
the higher pre-generation estimate), unless the owner's own ElevenLabs
account/dashboard reports a different multiplier directly.
