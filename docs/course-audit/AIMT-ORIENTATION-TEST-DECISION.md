# Module 0 orientation test decision — "Before you begin" relocation

Investigates the ~10 failing assertions in `tests/module-02-rebuild.test.mjs`'s
`I. MODULE 0` section. A prior triage pass suspected the failures were caused
by the "Before you begin" orientation content moving from `#module0Wrap` into
a new `#howAimtWorksView`, but did not verify that claim in full or attempt a
fix. This pass did both.

## Verdict: C — a mixture

8 of the original 10 assertions are **stale** (content genuinely relocated
and reworded, substance intact) and have been re-targeted. 2 are a **genuine,
still-open content gap** — real reassurance copy that existed in the old
`module0Wrap` orientation block and does not exist anywhere in the current
live page. Those 2 were **not** touched, per instructions, and remain
failing on purpose.

## How the relocation happened (verified via `git log -p`)

| Commit | Date | What it did |
|---|---|---|
| `817d3f5` | 2026-08-31 | Added the original "Before you begin" Listen Mode orientation block **inside `#module0Wrap`**, right before `0.1 — Welcome`. This is the block the original ~10 assertions were written against. |
| `2a56bf5` | 2026-09-10 | **"Add How AIMT Works course orientation."** Commit message, verbatim: *"Moves the redundant Listen Mode explainer out of Module 0 into the new page."* Diff confirms: the entire `sec-eyebrow="Before you begin"` block, the "How listening works" info-card, the 4-control concept-grid, and the closing key-point line were all **deleted** from `#module0Wrap` in this commit. A new `#howAimtWorksView`, a one-time pre-Welcome interstitial, was added in the same commit. |
| `7314f5a`, `3a668d7`, `2d42c72`, `c76dfa8` | 2026-09-10 – 09-11 | Copy alignment, expansion into a full platform walkthrough (course navigation, Cadence, practice vs. Cadence Check, completion, tools/resources — not just Listen Mode), and polish passes. This is why current `#howAimtWorksView` copy doesn't match the original 817d3f5 text verbatim even where the same idea survives — it was rewritten multiple times after the move, not just cut-and-pasted. |

Routing (`headspa-mastery.html`, read-only, not modified):
- `shouldShowOrientation()` / `enterCourseHomeOrOrientation()` (~line 13856)
  show `#howAimtWorksView` once, for any student with `introComplete` but not
  yet `orientationComplete`.
- `completeOrientationAndEnterWelcome()` (~line 13881) persists
  `orientationComplete: true` (additive `student` field, confirmed to never
  touch `progress`/checkpoints) and calls `openModuleById(0)` directly — i.e.
  the orientation still renders immediately **before** the Welcome Module,
  same sequencing the original assertion protected, just via view routing
  instead of DOM position inside one wrap.
- `#module0Wrap` no longer contains "Before you begin" anywhere — confirmed
  by direct inspection (line 6987 `mo-footer-soon` is immediately followed by
  line 6991 `0.1 — Welcome`, with nothing in between).

A companion test file, `tests/how-aimt-works-orientation.test.js`, was added
in the same 2a56bf5 commit. It only covers the `orientationComplete` **state
field** (persistence through `sanitizeState()`/`load()`/`save()`, and that it
never touches `progress`/checkpoint state) — its own header comment says the
DOM-dependent show/hide routing "was verified by live QA... not here." It
does **not** cover the orientation's actual copy/content, which is exactly
the gap `module-02-rebuild.test.mjs`'s `I. MODULE 0` section was filling
(unintentionally, as of the relocation) and now needs re-targeting for.

## Per-assertion trace (all ~10, individually)

1. **"the new 'Before you begin' orientation block renders, positioned right
   after the opener and before 0.1"** — STALE. The structural premise (one
   DOM wrap) is gone by design, but the underlying guarantee (orientation
   shown before Welcome Module content) is intact via routing. Re-targeted
   to check `#howAimtWorksView` contains "Before you begin" before its CTA,
   the CTA calls `completeOrientationAndEnterWelcome()`, that function opens
   Module 0, and `module0Wrap` no longer duplicates the block. **Now passes.**

2. **"explains manual opt-in / never autoplay"** (`/never starts on its
   own/`) — **GENUINE GAP.** Grepped the entire file: this phrase, "autoplay",
   and any equivalent explicit reassurance do not appear anywhere in
   `#howAimtWorksView`. The closest match found is in a completely different
   context — the pre-purchase sales-page FAQ ("What is Listen Mode?", line
   4345: *"It is a manual, optional way to hear supported course content. It
   does not autoplay."*) — which a paying, logged-in student doing the
   in-course orientation never sees. **Left untouched, still fails.**

3. **"explains pause/resume and leave-and-return"** — STALE. The
   `#howAimtWorksView` "Play / Pause" control description ("Start or stop the
   narration") plus the persisted Resume Listening flow ("the entry reads
   **Resume Listening** and picks up right where you left off") cover the
   same pause-anytime / leave-and-return guarantee, just described through
   the player UI rather than in a standalone sentence. Re-targeted. **Now
   passes.**

4. **"explains required checkpoints stop listening and must be completed
   personally"** — STALE, reworded with the course-wide "checkpoint" →
   "Cadence Check" terminology (same rename this file's own `D. CHECKPOINT`
   section already documents for Module 2, from commit 6b36a58). Current
   text: *"When narration reaches a required Cadence Check, it pauses and
   waits. Complete the check yourself, in your own words..."* Re-targeted.
   **Now passes.**

5. **"explains listening never grants competency or checkpoint credit"** —
   STALE. Current text: *"Listening alone never passes a competency check."*
   Same claim, reworded. Re-targeted. **Now passes.**

6. **"explains Continue Listening appears after an authoritative pass"** —
   STALE. Current text: *"once you pass, **Continue Listening** appears..."*
   ("appears" vs. "becomes available" — same meaning). Re-targeted. **Now
   passes.**

7. **"explains Listen Again replays from the opening"** — STALE, and the
   closest of all eight to verbatim. Current text: *"Listen Again starts
   that module's narration over from the beginning."* Re-targeted. **Now
   passes.**

8. **"all four controls (Resume Listening / Start Over / Continue Listening /
   Listen Again) are named"** — STALE for 3 of 4 exactly, and the 4th is a
   capitalization difference, not a dropped control: "Resume Listening",
   "Continue Listening", and "Listen Again" all appear verbatim;
   "Start Over" now appears as the icon-button label "↺ Start over"
   (lowercase "over"), same restart-from-beginning control. Re-targeted to
   match the current casing/context. **Now passes.**

9. **"distinguishes Listen with Cadence from Ask Cadence"** — STALE. The
   literal sentence ("Listen with Cadence is the narrated course experience.
   Ask Cadence is separate...") isn't there, but the distinction itself is —
   they're two clearly separate, separately-numbered sections ("02 — Read or
   listen with Cadence" vs. "03 — Cadence is with you throughout AIMT"), and
   the latter explicitly states *"Ask Cadence is optional and is never
   graded."* Re-targeted to check both section headers plus that line.
   **Now passes.**

10. **"closes with the required line"** (exact string *"Read, listen, or
    move between both. The curriculum is the same."*) — **GENUINE GAP.**
    Grepped the entire file: this line, and any equivalent explicit
    parity/equivalence guarantee between reading and listening, does not
    exist anywhere in the current page. The closest related text is
    `#howAimtWorksView`'s section 02 opener ("Every lesson can be read on
    screen. When Listen with Cadence is available in a module, Cadence
    narrates it out loud...") which implies but does not state the
    equivalence guarantee the original line made explicit. **Left
    untouched, still fails.**

## What changed in `tests/module-02-rebuild.test.mjs`

- Added `const howAimtWorksWrap = extractWrap(courseSrc, 'howAimtWorksView');`
  next to the existing `module0Wrap`/`module2Wrap` extraction.
- Added a new fixture group, **`I2. ORIENTATION (How AIMT Works)`**, holding
  the 8 re-targeted assertions (items 1, 3–9 above), each checking
  `howAimtWorksWrap`'s current live copy for the same substance the original
  assertion protected, with an inline comment explaining the relocation and
  the specific before/after wording. All 8 pass.
- Items 2 and 10 (the genuine gaps) were **left completely unchanged** in
  place in the `I. MODULE 0` fixture group, still checking `module0Wrap`
  (where the content used to live) — per instructions, no fake pass was
  invented for either. A comment was added directly above them explaining
  why they're intentionally still red and pointing at this document. They
  remain the only 2 failing assertions in the file.
- No assertion was weakened, deleted, or had its regex loosened to pass
  against unrelated text. Every one of the original ~10 checks is still
  individually represented — 8 as passing re-targets, 2 as documented,
  still-failing gaps.
- `headspa-mastery.html` was not modified (read-only for this task, and also
  off-limits per the Listen Mode narration work happening concurrently in
  this repo).

### Secondary finding (not changed, flagged for awareness)

A third, currently-*passing* check in the same section — `'does not display
"Module 0" anywhere in the new orientation text...'` (originally line 265) —
is now **vacuous**, not meaningfully protective. It slices
`module0Wrap` between `indexOf('Before you begin')` and `indexOf('0.1 —
Welcome')`; since `'Before you begin'` no longer exists in `module0Wrap`,
`indexOf` returns `-1` and the slice is effectively empty, so the check
passes trivially regardless of what the page actually contains. This wasn't
one of the ~10 failing assertions in scope for this pass, and the check was
intentionally left untouched to keep this change narrowly scoped to the
failing checks — but it has the same root cause as the other 8 and would be
a one-line fix (retarget to `howAimtWorksWrap`, where "Module 0" also does
not appear, confirming "Welcome Module" naming is preserved there too) if
someone wants it addressed in a follow-up.

## Test counts

**`tests/module-02-rebuild.test.mjs` alone:**

| | Total assertions | Passed | Failed |
|---|---|---|---|
| Before | 91 | 81 | 10 |
| After | 92 | 90 | 2 |

(92 vs. 91: one new sanity check — `howAimtWorksWrap extracted successfully`
— was added alongside the re-targeted group.)

**Full suite, `node --test tests/*.test.mjs tests/*.test.js` (114 files):**

| | Files run | Files passed | Files failed |
|---|---|---|---|
| Before | 114 | 112 | 2 |
| After | 114 | 112 | 2 |

The same 2 files fail before and after: `tests/aimt-listen-mode-module1-pilot.test.mjs`
(pre-existing, protected, untouched — 465/481 assertions passing, 16 failing,
identical in both runs) and `tests/module-02-rebuild.test.mjs` itself (now
failing only because of the 2 documented, intentionally-unfixed gap
assertions, down from 10). No other file's pass/fail counts changed between
the before and after runs — confirmed by diffing the full before/after logs
line by line. No regressions were introduced.

(Both before/after full-suite runs were captured by temporarily swapping in
the original pre-edit file content, running the suite, then restoring the
edited version and re-running — confirmed byte-identical to the final edited
file afterward. `headspa-mastery.html` and all Listen Mode files were never
touched at any point.)

## Recommendation for the two genuine gaps

Both are copy-only gaps in the live `#howAimtWorksView` orientation, not
missing engineering/functionality — the underlying behaviors (Listen Mode is
manual and does not autoplay; reading and listening cover identical
curriculum content) are still true of the shipped product, per the sales-page
FAQ and the section-02 framing respectively. What's missing is the explicit,
student-facing reassurance sentence for each, inside the actual in-course
orientation a paying student sees. Suggest the owner decide whether/where to
reinstate:

1. An explicit "Listen Mode is manual — it never starts on its own" line,
   likely in `#howAimtWorksView` section "02 — Read or listen with Cadence."
2. An explicit closing equivalence line (e.g. the original "Read, listen, or
   move between both. The curriculum is the same."), likely as the closing
   line of `#howAimtWorksView` before its CTA.

No feature was built and no copy was added to `headspa-mastery.html` in this
pass, per instructions.
