# Module 1 — Listen Mode Manual QA Plan (owner walkthrough)

This is the manual walkthrough for the owner to run once real audio exists
and every Module 1 chunk is `APPROVED` in `assets/js/aimt-listen-mode-data.js`
(see the production sheet's Section 4 — the player will not show Listen
Mode as available until then). Steps that require real audio cannot be
completed before that point; the deterministic test suite
(`tests/aimt-listen-mode-module1-pilot.test.mjs`) already proves the gating
logic itself is correct without needing real audio, so this plan is about
the actual listening *experience*, not the mechanism.

**Before you start:** append `?listenQA=1` to the course URL while any
chunk is still `GENERATED` but not yet `APPROVED`, to preview it (a small
"QA preview" badge appears on the entry button so it's never mistaken for
the live release). Once every chunk is `APPROVED`, the flag isn't needed —
Listen Mode is simply live.

## Walkthrough

1. **Fresh in-progress student.** Use an account (or Course Review Mode)
   that has started HeadSpa Mastery but not yet touched Module 1's
   checkpoints. Open Module 1.
   - Confirm the written Module Briefing (5 bullets + "Pay attention to"
     line) renders above section 1.1, and reads clearly on its own even
     before you touch Listen Mode.
   - Confirm the "Listen to this module" entry button is visible.
2. **Start Listen Mode.** Tap the entry button. Confirm the player bar
   appears at the bottom of the screen and M1-01 (the spoken Module
   Briefing) begins loading.
3. **Pause / resume.** Tap play. Let a few seconds pass, tap pause, wait,
   tap play again. Confirm playback resumes from the paused position with
   no skip or restart.
4. **Change speed.** Tap the speed control through its cycle
   (1× → 1.25× → 1.5× → 0.75× → 1×). Confirm Jane's voice pitch doesn't
   distort and the displayed speed label matches actual playback rate.
5. **Leave / return.** Navigate to the Dashboard mid-chunk (not at a
   checkpoint), then back into Module 1. Confirm the player bar is gone on
   the Dashboard (no leaked floating player) and, back in Module 1,
   playback resumes at the same chunk and roughly the same time position
   (local resume — same browser/device only; do not expect this to follow
   the student to a different device).
6. **Reach checkpoint 1.** Let playback run (or skip forward) into M1-07.
   Confirm:
   - Cadence reads the exact `m1cp1` question text aloud, matching the
     on-screen `.cp-q` text word for word.
   - Playback stops on its own at the end of M1-07 — it does not
     auto-advance into M1-08.
   - The player shows a "checkpoint reached, answer above" state rather
     than silently going idle.
7. **Verify the stop is real, not cosmetic.** Try to force M1-08 to play
   (e.g. by manipulating the URL/state if you're comfortable doing so, or
   simply confirming there is no control that lets you skip past it).
   Confirm M1-08 genuinely will not play before `m1cp1` shows a real PASS
   in the checkpoint UI.
8. **Answer / revise / pass.** Submit a deliberately weak `m1cp1` answer
   first — confirm Cadence's normal retry flow still works exactly as it
   does outside Listen Mode (this task did not touch checkpoint grading).
   Then submit a real passing answer.
9. **Resume narration.** Confirm the player offers a "Continue Listening"
   control rather than auto-blasting audio the instant the checkpoint
   passes. Tap it. Confirm M1-08 plays, referencing the pass naturally,
   then continues into M1-09 without you having to press play again.
10. **Reach checkpoint 2.** Repeat steps 6-9 for M1-13/`m1cp2`/M1-14.
11. **Pass checkpoint 2.**
12. **Hear the final close.** Confirm M1-14 plays through the pass
    acknowledgment, the three-things recap, and the Module 2 handoff, then
    stops cleanly (no dead air, no auto-replay).
13. **Return to Dashboard.** Confirm Module 1 shows complete there exactly
    as it would have without Listen Mode ever being opened — Listen Mode
    must not be a second, competing source of truth for completion.
14. **Resume course from Dashboard.** Re-open Module 1. Confirm the
    checkpoint-passed UI state (both checkpoints marked accepted, inputs
    disabled) is identical to a student who never used Listen Mode at all.
15. **Mobile / background / headphones.**
    - On a phone browser, start playback, lock the screen. Confirm audio
      keeps playing where the OS/browser allows it, and that lock-screen
      media controls (if the OS surfaces them) show "Cadence — AIMT" with
      play/pause/seek working.
    - Connect Bluetooth headphones; confirm their hardware play/pause
      buttons control playback.
    - Switch to another app/tab, then return; confirm playback state
      (playing or paused) wasn't corrupted by backgrounding.
    - Note any platform where background audio doesn't survive — that's
      an OS/browser restriction, not a bug in this player, and should be
      documented rather than "fixed" with native-app infrastructure.

## What this plan intentionally does not test

- Checkpoint grading quality/accuracy — covered by the existing Cadence
  checkpoint test suites, untouched by this task.
- Audio voice performance quality — covered by the QA checklist in the
  production sheet, chunk by chunk, before a chunk is marked `APPROVED`.
- Any module other than Module 1 — out of scope for this pilot by design.
