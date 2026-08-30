# Module 1 — Listen Mode Audio Production & QA Sheet

**Status:** Owner handoff document. No audio has been generated — this task
made **no ElevenLabs API calls** (per the task's own instruction: audio
generation is owner-authorized and owner-executed, not run automatically by
this build). Every row below starts at `NOT GENERATED`.
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
| M1-01 | NOT_GENERATED |
| M1-02 | NOT_GENERATED |
| M1-03 | NOT_GENERATED |
| M1-04 | NOT_GENERATED |
| M1-05 | NOT_GENERATED |
| M1-06 | NOT_GENERATED |
| M1-07 | NOT_GENERATED |
| M1-08 | NOT_GENERATED |
| M1-09 | NOT_GENERATED |
| M1-10 | NOT_GENERATED |
| M1-11 | NOT_GENERATED |
| M1-12 | NOT_GENERATED |
| M1-13 | NOT_GENERATED |
| M1-14 | NOT_GENERATED |

---

## 4. Why the player won't show Listen Mode yet

`AIMTListenModeData.isProductionReady()` requires **every** chunk's
`qaStatus` to be `APPROVED`. Right now all 14 are `NOT_GENERATED`, so
`AIMTListenMode.mount()` returns early and never renders the "Listen to this
module" entry point for real students — there is nothing to disable or
hide manually. A `?listenQA=1` URL flag exists for internal preview once
individual chunks reach `GENERATED`, showing a "QA preview" badge so it's
never mistaken for the real, released experience.

---

## 5. Owner generation steps (see also the final task report for the same steps)

1. Open ElevenLabs, select the Jane voice and the Eleven v3 model.
2. For each chunk M1-01 through M1-14, paste the exact contents of its
   `.txt` file from `tts/module-01/` (nothing else — no headers, no chunk
   IDs, no metadata).
3. Generate, listen back against the QA checklist above.
4. Export as MP3 and save to the exact target filename in the table (create
   the `assets/audio/listen/headspa-mastery/module-01/` folder if it doesn't exist
   yet — it is not committed by this task, since no audio exists to put in
   it).
5. Update that chunk's `qaStatus` in `assets/js/aimt-listen-mode-data.js`
   to `GENERATED`, then to `APPROVED` once it passes the checklist (or
   `REGENERATE` if it doesn't, and repeat from step 2).
6. Once all 14 are `APPROVED`, Listen Mode becomes available to real
   students automatically — no other code change is required.
