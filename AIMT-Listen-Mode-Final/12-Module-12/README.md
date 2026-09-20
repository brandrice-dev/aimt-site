# Module 12 -- Owner-Editing Staging (verified/corrected, 2026-09-20)

**Status: RAW generation complete, EDIT.wav conversion complete, both
validated.** Module 12 is the Final Certification Assessment -- Listen
Mode here is scoped *exclusively* to the safe, non-scored State A
(pre-exam orientation) screen. Nothing about the scored Knowledge bank,
Applied Cases, Practitioner Conversation, rubrics, or scoring is narrated
or referenced. See `docs/course-audit/listen-mode/module-12-listen-script.md`
and `docs/course-audit/listen-mode/module-12-fidelity-coverage-audit.md`
(the latter proves both 100% safe-content coverage AND 0% scored-content
leakage -- required reading before touching this module again).

**This replaces TWO earlier takes** -- both archived, not deleted.
**Do not use either of them.**
1. The original v1 take (`archive-superseded-aimt-pronunciation/`) used
   the course-wide single-spaced "AIMT" pronunciation (the same form
   Module 10's owner-confirmed listening pass found rendering as
   "Am-tee" on this exact voice/model) and omitted the module title and
   the checkpoint-history lead sentence, both present in the live
   `COPY.stateA` source.
2. The first correction fixed those 3 issues using comma-separated
   "A, I, M, T" -- but the owner then reported that form caused
   Jane/`eleven_v3` to pause too heavily between letters and sound
   choppy. That take is archived at `archive-superseded-aimt-spacing/`.

**Current take:** single-spaced "A I M T," no punctuation at all --
confirmed as the intentional, permanent course-wide form (natural
connected speech, four distinct letters, never the word "aim," never
over-paused). Every other line matches the original v1 exactly,
including its already-correct first-person Cadence narration (this v1
predates and already satisfied the Section J narrator-perspective rule).
Verified byte-level that the second AIMT correction changed nothing else
in the payload.

Source: `docs/course-audit/listen-mode/tts-final/module-12/` (tracked in
git -- manifest.json + one .txt per batch, the exact validated TTS
payload).

| Batch | Chunks | Duration | Chars | Checkpoint |
|---|---|---:|---:|---|
| `M12-BATCH-A1` | M12-01 (full State A orientation, single chunk, no gate) | 4:58 | 4,083 | -- |

**Module total:** 1 batch, 4:58, $0.67, 4,083 chars.

Each batch has two files:

```
M12-BATCH-<id>-RAW.mp3     immutable ElevenLabs source -- NEVER edit, rename, or delete
M12-BATCH-<id>-EDIT.wav    lossless CapCut input -- import THIS into CapCut, not the RAW mp3
```

`-PROCESSED.wav` lands here once the owner returns a CapCut export -- not
yet present for this module.

**Player/assessment boundary (already live, verified but not built by
this pass):** `renderStateA()` already mounts the "Listen with Cadence"
button (`window.AIMTListenMode.mount({..., moduleId: 12, ...})`), and
`onStartExam()` already calls `window.AIMTListenMode.unmount()` as its
first action before any scored attempt starts -- confirmed by reading
`assets/js/module12-certification.js`, not modified. Real playback on
the live site additionally stays gated behind this manifest's own
`qaStatus: 'APPROVED'` flag until the owner marks it so.

This directory (and the audio in it) is gitignored -- only this README
travels with the repo. See `AIMT-Listen-Mode-Final/README.md` at the
staging root for the full resume procedure. This is the final module in
the Listen Mode production run (Modules 0-12).
