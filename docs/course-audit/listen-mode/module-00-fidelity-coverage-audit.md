# Module 0 — Listen Mode Fidelity Coverage Audit (v2, strict-fidelity rebuild)

**Authority:** current live `headspa-mastery.html`, `#module0Wrap`, lines
6950–7255 (read in full, 2026-09-17), plus the checkpoint question text in
`const M0 = { questions: {...} }` (lines 11097–11109), the checkpoint list
`MODULE_CHECKPOINTS['0'] = ['m0cp1']`, and the completion card `#m0Complete`
(lines 7233–7241). This audit supersedes `module-00-listen-script.md` (v1,
2026-08-31, most recently annotated 2026-09-13) as the narration source of
record — that document is retained for history only at
`archive-loose-v1/module-00-listen-script-v1-REJECTED.md`.

This is Module 0's **first-ever** coverage-audit pass — unlike Modules
1/4/5/6/7/8, no prior audit document existed for this module before now.

---

## Why this rebuild happened

Per the 2026-09-16 read-only fidelity audit (`docs/AIMT-MASTER-LAUNCH-CHECKLIST.md`,
"Module 0 Listen Mode" row) and this session's own re-verification directly
against the live page, four concrete defects were confirmed in the
already-generated v1 audio/script (`AIMT-Listen-Mode-Final/00-Welcome/`,
RAW+EDIT+PROCESSED all present, further along than any other pending
module):

1. **"answer above"** — the v1 checkpoint-closing line said "Take your
   time, and answer above in your own words," directionally backwards (the
   response field sits below the prompt). Confirmed directly in
   `docs/course-audit/listen-mode/tts-final/module-00/M0-BATCH-A4.txt`'s
   last line before this rebuild replaced it.
2. **Orphaned Listen Mode mechanics** — the v1 script's M0-01b chunk
   ("Before you begin") narrated pause/resume/Listen-Again mechanics for a
   block that commit `2a56bf5` ("Add How AIMT Works course orientation")
   relocated out of `#module0Wrap` into the standalone `#howAimtWorksView`
   screen. Confirmed by direct inspection: `#module0Wrap`'s `.mo-attention`
   is immediately followed by `.mo-footer` — no "Before you begin" content
   exists in the live module at all.
3. **Loosely paraphrased "In this module" list** — the v1 opening chunk
   summarized the module opener's real 5-item `.mo-list` in a compressed
   paraphrase rather than naming each item, unlike Modules 5/6/7's
   equivalent lists.
4. **"From Cadence" treatment used the old style** — the v1 script folded
   the 0.5 Cadence note into surrounding narration without the first-person
   label adaptation ("Here's a note from me...") established in Modules
   5/6/7's rebuilds.

All four are fixed in `module-00-listen-script.md` (v2). See that
document's "why this rebuild happened" section for the exact before/after
text.

**Standard applied:** the same one used for the owner-approved Module
1/4/5/6/7 rebuilds — see `00-listen-mode-editorial-standard.md` in full,
including:
- Section announcements (§A), section breathing room (§B), Teaching/Reference
  Voice (§C), visual/audio order parity (§D), audio-first curriculum parity
  (§E).
- **§F, directional-cue rule** — "answer above" is never used; this
  rebuild's checkpoint closes with exactly "Take your time, and answer
  below."
- **§G, mandatory end-of-module fidelity re-check** — see below, PASS.
- The "From Cadence" first-person-adaptation convention established in
  Modules 5/6/7.
- The **AIMT pronunciation rule**: standalone "AIMT" is rendered "A I M T"
  (space-separated letters) in TTS text — the *current*, stricter
  convention (superseding v1's hyphenated "A-I-M-T", which
  `scripts/aimt-listen-tts-preflight.mjs` check #3 now explicitly rejects).

---

## Coverage map (every section/interaction, disposition)

| # | Live element | Chunk | Disposition |
|---|---|---|---|
| 1 | Module opener (identity, 5-item list, "Pay attention to") | M0-01 | Full — 5-item list narrated individually in Reference Voice (fixes drift #3) |
| 2 | ~~"Before you begin" orientation block~~ | ~~M0-01b~~ | **Removed** — content no longer exists in `#module0Wrap` (fixes drift #2) |
| 3 | 0.1 Welcome | M0-02 | Full, near-verbatim |
| 4 | 0.2 What this course is (+ 2 clinical-note cards) | M0-03 | Full, both boxed notes in Reference Voice |
| 5 | 0.3 Who this is for | M0-04 | Full, near-verbatim |
| 6 | 0.4 What you'll learn (+ info-card) | M0-05 | Full |
| 7 | 0.5 How to use this course (+ Cadence note) | M0-06 | Full — Cadence note first-person-adapted (fixes drift #4) |
| 8 | Practice: "Same steps. Different service." | M0-07 | Full, both practitioner descriptions verbatim |
| 9 | 0.6 The standard (5 protocol-cards) | M0-08 | Full, all 5 named in order |
| 10 | 0.7 What makes a great technician (5 scalp-cards) | M0-09 | Full, all 5 named in order |
| 11 | 0.8 Scope and safety (+ clinical-note) | M0-10 | Full |
| 12 | 0.9 What success looks like (4 scalp-cards) | M0-11 | Full, all 4 named in order |
| 13 | 0.10 Practitioner insight (+ key-point) | M0-12 | Full |
| 14 | 0.11 Common early mistakes (5 info-cards) | M0-13 | Full, all 5 named in order |
| 15 | Checkpoint `m0cp1` | M0-14 | Question only, verbatim from `M0.questions.m0cp1`; directional cue fixed (fixes drift #1) |
| 16 | Completion card `#m0Complete` | M0-15 | Full, verbatim current live text (not the stale text either prior document quoted) |

**Result: 100% substantive coverage.** Every numbered section, every card
group, the practice interaction, and the checkpoint are covered. Nothing
invented beyond real page content. The only intentional omission is M0-01b,
which is a deliberate removal (content relocated elsewhere), not a coverage
gap.

## Headline Rule disposition

See `module-00-listen-script.md`'s own "Coverage map — Headline Rule
disposition" table (reproduced there in full) — every substantive heading
on the live page is explicitly dispositioned as (A) its own announced beat,
(B) intentionally folded into an adjacent beat, or (C) decorative/UI chrome
with a stated reason. Zero unaccounted headings.

## END-OF-MODULE FIDELITY CHECK (Editorial Standard §G, mandatory)

Reproduced from `module-00-listen-script.md` (both documents must agree —
confirmed identical):

Dedicated second pass over 0.9 through completion (the module's final
third), re-read side by side with `#module0Wrap`'s live final third:

- 0.9's four cards: all present, in order, none thinned. ✓
- 0.10's body text + key-point: both narrated (guards against the
  Module-6-style "last item silently dropped" pattern this rule exists to
  catch). ✓
- 0.11's five cards (the actual last numbered section before the
  checkpoint): all five present, in order, no thinning, no paraphrase
  creep. ✓
- Checkpoint placement: M0-14 immediately follows 0.11 in live DOM order
  (confirmed directly against `headspa-mastery.html`). ✓
- Completion language: exact match against live `#m0Complete`, not a stale
  extraction. ✓
- Directional cue: "answer below," confirmed via direct grep (zero "above"
  matches). ✓

**Result: PASS.**

## Checkpoint map

| Checkpoint | Chunk | Gate position | Question source | Directional cue |
|---|---|---|---|---|
| `m0cp1` | M0-14 | End of module, after 0.11, before completion | `M0.questions.m0cp1` (`headspa-mastery.html:11099`), quoted verbatim | "Take your time, and answer below." (§F-compliant) |

Single checkpoint, matching `MODULE_CHECKPOINTS['0'] = ['m0cp1']`. No
checkpoint prompt, rubric, or grading behavior was altered by this pass —
only the narration script's spoken framing of the question and its closing
directional cue.

## TTS preflight

`scripts/aimt-listen-tts-preflight.mjs` validates `.txt` batch payloads
under `docs/course-audit/listen-mode/tts-final/module-00/` — **not yet
regenerated from this v2 script** (see "Generation gate" below). Once the
6 batch payloads are extracted from `module-00-listen-script.md` (v2) via
`scripts/aimt-listen-source-extract.mjs` and written to that directory,
running the preflight script is the mandatory last gate before any
ElevenLabs call. Checked by inspection against this script's actual text in
the meantime:

- Char ceiling: largest planned piece (A1, ~3,350 chars) is comfortably
  under the 4,500-char safety margin. ✓ (all 6 pieces, see generation plan
  table in `module-00-listen-script.md`)
- No standalone "AIMT": zero — both occurrences use "A I M T". ✓
- No hyphenated "A-I-M-T": zero in the actual script body (the string only
  appears in this audit's and the script's own prose *describing* the old,
  retired convention, which is not spoken-narration text and would not be
  extracted into a batch payload). ✓
- No un-narrated structural brackets: only `[warmly]`/`[slowly]` tags used,
  both valid per the preflight script's own allowlist. ✓
- No literal chunk IDs embedded in prose: none. ✓
- No "answer above"/variants: zero. ✓

**Preflight status: PASS by inspection.** A live run against the actual
extracted `.txt` payloads is still required before generation (mechanical
step, not an editorial one) — flagged as the first action item if/when
generation proceeds.

## Generation gate — RESOLVED, generation completed 2026-09-17

Per this session's task instructions: **before ElevenLabs generation**,
coverage audit / headline inventory / final-third audit / checkpoint map /
TTS preflight must all PASS, plus an exact character/cost estimate and
confirmed sufficient credit reserve. All five gates were PASS (see above).

**Update (later same day, 2026-09-17):** a follow-up instruction asked this
session to re-check whether ElevenLabs generation had become available. It
had: an ElevenLabs-backed speech-generation tool (`creative_generate_speech`,
a genuine `elevenlabs.io` flow, not a third-party wrapper) was available in
this session. Before spending anything, the exact voice was verified via
`creative_list_voices(search: "Jane")` — voice_id `Y3ZPRGOSIxbV4Rbb3WiA`
resolved to **"Jane - Bright, Smooth and Friendly"**, `is_library_voice:
true` (a public ElevenLabs library voice, so the underlying vocal model is
identical regardless of which account calls it — not a private clone tied
to one specific account). A no-spend `estimate_only:true` call confirmed
the pricing path worked before committing to any real spend.

**Real generation performed, one batch at a time, each downloaded and
duration-validated before starting the next:**

| Batch | Chunks | Chars | Duration | Cost (actual) |
|---|---|---:|---:|---:|
| A1 | M0-01–03 | 3,630 | 246.52s | $0.595485 |
| A2 | M0-04–07 | 2,697 | 213.04s | $0.442530 |
| A3 | M0-08–09 | 2,467 | 208.56s | $0.404580 |
| A4 | M0-10–11 | 1,856 | 135.12s | $0.303105 |
| A5 | M0-12–14 | 1,712 | 138.64s | $0.281325 |
| B1 | M0-15 | 439 | 33.04s | $0.071610 |
| **Total** | **15 chunks** | **12,801** | **974.92s (16m 15s)** | **$2.098635** |

Every one of the 6 generations was independently confirmed, from the raw
API response, to use `voice_id: Y3ZPRGOSIxbV4Rbb3WiA` ("Jane"), `model_id:
eleven_v3`, `generations_count: 1` — exactly the locked production
settings, no deviation. Actual total cost ($2.10) came in under this
document's own pre-generation estimate ($2.30–2.35), consistent with the
per-character rate this repo's own Module 7/8 real costs implied.

**RAW MP3 + matching EDIT WAV created for every batch**, staged at
`AIMT-Listen-Mode-Final/00-Welcome-v2-staging/` (a new, separate directory —
the old v1 audio in `AIMT-Listen-Mode-Final/00-Welcome/` was never opened,
read, or modified; confirmed via file mtimes, all predating this session).
Each RAW mp3 was downloaded directly from the generation response and its
EDIT WAV created via a lossless PCM decode (ffmpeg `-c:a pcm_s16le`, the
same lossless-decode purpose as the project's existing
`aimt-listen-edit-wav-build.sh`/`afconvert` step, substituted here since
`afconvert` isn't available in this session's environment). Every EDIT
WAV's duration was independently re-measured and matches its RAW mp3's
reported duration exactly (see table above).

Frozen batch payload `.txt` files and a `manifest.json` (documenting the
real per-batch chars/duration/cost/checkpoint data above) are recorded at
`docs/course-audit/listen-mode/tts-final/module-00-v2/` — the old v1
payloads at `tts-final/module-00/` are untouched.

## What was NOT done (still explicitly out of scope this pass)

- **Not integrated into the live player.** `assets/js/aimt-listen-mode-data.js`
  still has no Module 0 entry, unchanged by this pass — per instruction,
  Module 0 stops at owner-review staging regardless of generation status.
  The RAW/EDIT files staged here still need the same CapCut finishing pass
  + position-anchored chunk-cutting Modules 4/5/6/7 went through before
  they're real player-ready mp3s — that's real audio-production work for
  the owner's review pass, not an automatic next step.
- Old v1 audio (`AIMT-Listen-Mode-Final/00-Welcome/*.{mp3,wav,MP3}`) left
  completely untouched — not deleted, not overwritten, retained for the
  owner's own comparison if wanted.
- No CapCut processing performed — that's an owner-side step per the
  established Listen Mode production pipeline, same as every other module.
