# Full Listen Mode Regeneration -- PAUSED, resume instructions

**Paused:** 2026-09-13, before any ElevenLabs generation was sent, at the
owner's explicit request (Claude usage at 97%, resets in ~2 hours; owner
did not want a 71-batch paid run interrupted mid-flight or partially
documented). **Zero ElevenLabs generations were sent this session.**
**Zero credits spent.** Repo HEAD unchanged throughout
(`6b36a58f5aebf009a638951d961c490e6d28c59c`, `course-audit-build`, clean
except the new files listed below -- nothing on `main` touched, nothing
pushed).

The approved scope, confirmed by the owner and unchanged by this pause:
**full fresh regeneration of Welcome through Module 12**, explicitly
including Module 1 (overriding its prior FROZEN/live-student status for
this run only), using Jane (`Y3ZPRGOSIxbV4Rbb3WiA`) / `eleven_v3`
throughout, "AIMT" always spoken as "A I M T", first-person Cadence
narration, all 71 validated batches below, landing in the gitignored
owner-editing staging folder (`AIMT-Listen-Mode-Final/`) for the owner's
CapCut pass -- nothing gets cut into final player chunks, nothing
overwrites existing production audio (including Module 1's), and nothing
gets wired into the live manifest/course until the owner explicitly
confirms processed audio is ready for that second pass.

## What's already done (safe to build on, nothing here needs redoing)

1. **Full narration source pack**, all 13 modules -- reconciled against
   the current live `headspa-mastery.html` and the two source-freeze
   commits named in the task (`7184086`, `6b36a58`). Module 8 was
   substantively rewritten (not just re-normalized) to match the real,
   current checkpoint/Timer order -- see "Module 8 restructuring" below.
2. **AIMT pronunciation normalized** everywhere: "AIMT" / "A-I-M-T" ->
   "A I M T", automated (not manual), verified by script.
3. **71 ElevenLabs generation batches** built, grouped by the same
   "player chunks != ElevenLabs batches" principle the prior session
   established -- checkpoint/section boundaries respected, none split
   mid-thought.
4. **154,290 total normalized characters**, largest single batch 3,732
   chars -- every batch comfortably under the 5,000-char hard ceiling
   (safety-flagged at 4,500; none tripped it).
5. **Automated preflight validator**, not just a one-time manual check --
   rerun it before generating anything if any source file changes:
   ```
   node scripts/aimt-listen-tts-preflight.mjs
   ```
   Checks (per batch payload): under the char ceiling with safety margin;
   no standalone "AIMT"; no hyphenated "A-I-M-T"; no un-narrated
   structural/editorial brackets (`[SECTION PAUSE]`, `[VISUAL CUE]`,
   `[CHECKPOINT STOP...]`, `[PLAY ONLY AFTER...]`, etc. -- these were
   stripped from Module 1's older draft convention during extraction);
   no literal chunk IDs embedded in the spoken text. **All 71 currently
   pass.**
6. **Voice confirmed independently**, not taken on faith from the task
   brief: `creative_list_voices` search for "Jane" returned an exact
   match -- "Jane - Bright, Smooth and Friendly", `voice_id
   Y3ZPRGOSIxbV4Rbb3WiA` -- as the first result, confirming the brief's
   voice ID rather than assuming it.
7. **Real price check done** (`estimate_only: true`, no charge, nothing
   generated): one representative batch (Module 12, 3,966 chars) priced
   at **$1.4476** (~$0.000365/char). Extrapolated across all 154,290
   validated characters: **approximately $56** total for the full
   71-batch run -- notably higher per-character than the ~$0.000165/char
   the prior session's own production log recorded for the same voice/
   model, which is *why* this paused for a cost confirmation rather than
   just running. The owner has this number; no further estimate call is
   needed unless the source pack changes.
8. **Owner-editing staging folder** created and gitignored (audio only --
   the READMEs below stay tracked): `AIMT-Listen-Mode-Final/` with one
   subfolder per module, each pre-populated with a README listing its
   exact expected raw filenames, chunk coverage, and char counts.

## Files on disk right now

```
scripts/aimt-listen-source-extract.mjs   -- parses a module-NN-listen-script.md,
                                             extracts spoken text per chunk,
                                             normalizes AIMT. (Modules 0, 2-7,
                                             9-12 -- clean lowercase-tag format.)
scripts/aimt-listen-batch-build.mjs      -- groups chunks into batches per the
                                             hardcoded table inside it, writes
                                             one .txt payload + manifest.json
                                             per module.
scripts/aimt-listen-tts-preflight.mjs    -- automated preflight, see above.
scripts/aimt-listen-staging-init.mjs     -- (re)writes the per-module staging
                                             READMEs from the manifest.

docs/course-audit/listen-mode/tts-final/
  ALL-MODULES-MANIFEST.json              -- every module's batches in one file
  module-00/ .. module-12/
    manifest.json                        -- this module's batches + chunk
                                             metadata (gateType, checkpointId,
                                             char counts, first/last line)
    M<n>-BATCH-<id>.txt                  -- the EXACT, validated TTS payload
                                             to send for that batch, verbatim

AIMT-Listen-Mode-Final/                  -- gitignored (audio only); staging
  README.md, 00-Welcome/ .. 12-Module-12/  destination once generation runs
  (each with its own README.md)

.gitignore                               -- new entry added for
                                             AIMT-Listen-Mode-Final/**/*.{mp3,wav,flac}
```

Module 1 and Module 8's source text did NOT come from the automated
extractor (see "Special cases" below) -- their normalized chunk JSON was
hand-built and reviewed, then run through the same `aimt-listen-batch-build.mjs`
batching/writing step as everything else. Nothing about their *output*
format differs from the other 11 modules.

## Special cases handled this pass

- **Module 1**: the script doc (`module-01-listen-script-draft.md`, v5)
  uses an older, ALL-CAPS structural-cue convention
  (`[SECTION PAUSE]`, `[VISUAL CUE]`, `[CHECKPOINT STOP -- PLAYBACK
  PAUSES]`, `[PLAY ONLY AFTER AUTHORITATIVE CHECKPOINT PASS]`,
  `[SHORT PAUSE]`, `[EMPHASIZE]`, `[SLOW SLIGHTLY]`, `[WARM]`,
  `[LET THIS LAND]`) that Modules 0/2-12 already replaced with clean,
  valid `eleven_v3` delivery tags (`[warmly]`/`[firmly]`/`[slowly]`) or
  no tag at all. All 14 Module 1 chunks were hand-normalized to match:
  structural/editorial brackets removed entirely (never spoken, never
  valid v3 syntax); `[WARM]` -> `[warmly]`; the 4 `[SHORT PAUSE]` markers
  in the practice-interaction chunk (M1-06) became a plain `...` beat
  between each statement and its reveal, preserving the functional pause
  without a stray bracket. The one literal "AIMT" in M1-03 ("AIMT
  certification documents...") is normalized to "A I M T" like
  everywhere else. No wording, teaching content, or checkpoint text was
  changed beyond this cleanup -- content is v5, verbatim.
- **Module 8**: real content change, not just cleanup. Verified directly
  against the live `headspa-mastery.html` (~line 8848-8994): the AIMT
  Service Timer section now sits **between** `m8cp1` and `m8cp2`
  (confirmed by the page's own code comment at line 8871, "Section-order
  fix... the AIMT Service Timer now sits between m8cp1 and the FINAL
  Cadence Check"), not after both as the old script assumed. Old
  `M8-08` (one combined "Checkpoint 1 + Checkpoint 2" beat) is now three
  chunks:
  - `M8-08a` -- checkpoint 1 (`m8cp1`) alone, `gateType: checkpoint-stop`
  - `M8-08b` -- new post-pass beat (`resumeAfterPass`, checkpointId
    `m8cp1`) introducing the Timer, rewritten from the real live
    `#m8TimerFeature` copy ("Take the service into practice... the real
    A I M T Service Timer... included with your certification...")
    rather than the old script's pre-move wording
  - `M8-08c` -- checkpoint 2 (`m8cp2`) alone, `gateType: checkpoint-stop`
  `M8-05`'s old closing Timer paragraph was removed (moved to `M8-08b`
  in its new, correct position) -- everything else in `M8-05` (chapters
  6-9) is unchanged, verbatim v3 script content.

## Batch/character/pricing summary, all 13 modules

| Module | Batches | Normalized chars |
|---|---:|---:|
| 00 Welcome | 6 | 13,819 |
| 01 | 6 | 14,001 |
| 02 | 5 | 11,570 |
| 03 | 6 | 14,770 |
| 04 | 7 | 15,132 |
| 05 | 6 | 14,189 |
| 06 | 6 | 12,761 |
| 07 | 4 | 9,236 |
| 08 | 6 | 12,636 |
| 09 | 6 | 10,116 |
| 10 | 6 | 11,731 |
| 11 | 6 | 10,363 |
| 12 | 1 | 3,966 |
| **Total** | **71** | **154,290** |

## Exact resume procedure

1. **Re-run preflight first** (cheap, catches any drift if source files
   were touched between now and resume):
   ```
   node scripts/aimt-listen-tts-preflight.mjs
   ```
   Must print "All passed." before generating anything.

2. **Re-verify HEAD hasn't moved unexpectedly** and the new files are
   still present:
   ```
   git status --short
   ```
   Expect: the same untracked files listed above, nothing else.

3. **Generate each of the 71 batches, in order, one at a time** (Section
   28's no-uncontrolled-parallel-generation rule -- do this sequentially,
   not in parallel, so a mid-run failure is easy to isolate and retry).
   For each batch file `docs/course-audit/listen-mode/tts-final/module-NN/M<n>-BATCH-<id>.txt`:
   - Read the file's exact contents (do not retype/paraphrase it).
   - Call `mcp__8223b913-edc5-4be1-a9c8-01a574e4b943__creative_generate_speech` with:
     - `prompt`: the file's exact contents
     - `model_id`: `"eleven_v3"`
     - `voice_id`: `"Y3ZPRGOSIxbV4Rbb3WiA"`
     - `generations_count`: `1` (**do not leave this at the default of 4**
       -- one deterministic take per batch, not four paid variations)
     - `flow_id`: reuse one flow per module (create on that module's
       first batch, pass it to the rest) so a module's batches stay
       grouped
     - `context`: e.g. `"AIMT Listen Mode full regeneration, Module 00
       batch A1a, checkpoint: none"`
   - **Before running batch 1**, confirm exactly how to retrieve/download
     the generated audio bytes from this connector (the tool description
     only documents `flow_id`/`node_id`/`session_ids` plus a UI view --
     it does not document a raw download call in the schema fetched this
     session). Resolve this on the very first batch before running the
     other 70, not after.
   - Save the retrieved audio as
     `AIMT-Listen-Mode-Final/<module-folder>/M<n>-BATCH-<id>-RAW.mp3`
     (never into the live `assets/audio/listen/` tree -- that's the
     staging folder, not production).
   - Log each result (generation id, actual cost/credits charged,
     runtime) somewhere durable -- e.g. append to a new
     `docs/course-audit/listen-mode/course-wide-production-log.md`-style
     entry for this pass, or a fresh log file -- so the eventual "GENERATION"
     section of the final report has real numbers, not estimates.

4. **After all 71 are generated and saved**, validate the raw files
   (exist, non-zero, decode, plausible duration) before considering the
   raw-generation phase done.

5. **Build `AIMT-Listen-Mode-Final/MASTER-CAPCUT-WORKLIST.md`** -- one
   consolidated, owner-facing worklist (not scattered per-module docs)
   listing every raw file, the exact `CADENCE_CAPCUT_FINISH_PRESET_V1`
   settings (Normalize Loudness ON / -23 LUFS displayed / Enhance Voice
   ON at 75 / Reduce Noise ON / Isolate Voice OFF / Speed 1.0x / no other
   processing -- see
   `docs/course-audit/listen-mode/module-01-production-standard-LOCKED.md`
   Section 3, already the live locked standard, no invention needed),
   cut order, checkpoint boundaries, and final destination filenames.

6. **STOP at that point** -- per the task's explicit instruction, do not
   cut final player chunks, do not touch `assets/js/aimt-listen-mode-data.js`,
   do not overwrite Module 1's existing production audio, and do not
   activate any module's Listen entry until the owner returns processed
   audio and explicitly confirms the second integration pass.

7. Only then (separate future task, after owner confirmation): validate
   processed files against the worklist, cut/export final player chunks,
   install to `assets/audio/listen/headspa-mastery/module-NN/`, update
   the manifest, activate modules one at a time, add/extend the test
   coverage in Section 43 of the original task brief, and write up the
   full FINAL REPORT the original task asked for.

## Explicit non-actions (still true, re-confirm before resuming)

Nothing was reset, merged, deployed, or pushed. `main` was never touched.
No file under `assets/audio/listen/` was created or modified. No file
under `assets/js/aimt-listen-mode-data.js` was modified. No secrets were
printed, logged, or written anywhere.
