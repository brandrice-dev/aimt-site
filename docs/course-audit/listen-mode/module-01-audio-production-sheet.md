# Module 1 — Listen Mode Audio Production & QA Sheet

**Status:** Owner handoff document. 3 of 14 chunks (M1-01, M1-04, M1-07)
have real generated audio as of 2026-08-30, produced as an authorized
pipeline-validation pilot (Eleven v3, Jane) — see Section 3a. **None of the
14 chunks are APPROVED** — GENERATED still requires the owner's own
listening review before Listen Mode can go live for real students (Section
4 still applies in full). The remaining 11 chunks are untouched at
`NOT_GENERATED`.
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
| M1-02 | NOT_GENERATED |
| M1-03 | NOT_GENERATED |
| M1-04 | **GENERATED — OWNER REVIEW REQUIRED** |
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

## 3a. Real-audio pipeline validation pilot (M1-01, M1-04, M1-07)

**Date generated:** 2026-08-30. **Voice:** Jane — Bright, Smooth and Friendly
(`voice_id: Y3ZPRGOSIxbV4Rbb3WiA`). **Model:** `eleven_v3`. **Output:**
confirmed MP3, 44.1 kHz, 128 kbps, mono (verified directly against each
downloaded file with `file(1)` — matches the production spec in Section 5
below exactly). Generated via the connected ElevenLabs Creative flow
platform, one shared flow for review:
[elevenlabs.io/app/flows/fp2ZnP1Hfna5trlQ3bYD](https://elevenlabs.io/app/flows/fp2ZnP1Hfna5trlQ3bYD).

| Chunk | File | Duration | Chars (incl. tags) | Actual credits | Actual cost (USD) |
|---|---|---|---|---|---|
| M1-01 | `assets/audio/listen/headspa-mastery/module-01/m1-01.mp3` | 65.44s | 964 | 964 | $0.15906 |
| M1-04 | `assets/audio/listen/headspa-mastery/module-01/m1-04.mp3` | 146.08s | 1,841 | 1,841 | $0.30377 |
| M1-07 | `assets/audio/listen/headspa-mastery/module-01/m1-07.mp3` | 38.72s | 490 | 490 | $0.08085 |
| **Total** | | **250.24s (~4:10)** | **3,295** | **3,295** | **$0.54368** |

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

## 4. Why the player won't show Listen Mode yet

`AIMTListenModeData.isProductionReady()` requires **every** chunk's
`qaStatus` to be `APPROVED`. Right now 3 are `GENERATED` (M1-01, M1-04,
M1-07) and 11 are `NOT_GENERATED` — none are `APPROVED` — so
`AIMTListenMode.mount()` still returns early and never renders the "Listen
to this module" entry point for real students, confirmed directly against
the real installed files in this pilot (a `throwingDoc` test proved
`mount()` never touches the DOM in this state). There is nothing to disable
or hide manually. A `?listenQA=1` URL flag exists for internal preview of
`GENERATED`-or-better chunks, showing a "QA preview" badge so it's never
mistaken for the real, released experience — this is how the 3 real files
were exercised end-to-end in the player during this pilot.

---

## 5. Owner generation steps (see also the final task report for the same steps)

**For M1-01, M1-04, and M1-07 — already generated, review only:**
1. Listen to the three files directly at `assets/audio/listen/headspa-mastery/module-01/m1-01.mp3`, `m1-04.mp3`, `m1-07.mp3`.
2. Score each against the QA checklist in Section 3 above.
3. In `assets/js/aimt-listen-mode-data.js`, change that chunk's `qaStatus`
   from `'GENERATED'` to `'APPROVED'` if it passes, or `'REGENERATE'` if it
   doesn't (then regenerate from its `.txt` file and re-review).

**For the remaining 11 chunks (M1-02, M1-03, M1-05, M1-06, M1-08 through
M1-13 excluding M1-07, M1-14) — not yet generated:**
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
