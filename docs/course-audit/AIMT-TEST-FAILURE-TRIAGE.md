# AIMT Test Failure Triage — 2026-09-15/16

Fresh investigation of the 4 persistent failures in the deterministic suite,
run directly (`node --test <file>`), reading real failure output and the
exercised source — not trusting any prior summary. Two fixes were applied,
both narrow, single-constant/single-assertion edits to test files only.
No product code, no Module 2/3/6 content, and no assertion's protective
intent was weakened.

Method note: historical-state comparisons below used only
`git show <rev>:<path>`, `git diff HEAD -- <path>`, `git log -p`, and
disposable `git worktree add /tmp/... <rev>` checkouts (removed after use
with `git worktree remove`). `git stash` was never used, per this round's
ban.

---

## 1. `tests/aimt-dashboard-resources-launch.test.mjs`

**Status: FIXED.**

**Exact failing assertions (before fix):**
- `[FAIL] N. HISTORICAL PASS UNCHANGED` — *"The 22-checkpoint rubric/question
  extraction from headspa-mastery.html hashes to the exact pre-task
  fingerprint -- no checkpoint content anywhere was touched"*
- `[FAIL] P. 22 CHECKPOINT GATE MAP UNCHANGED` — *"Full extracted
  rubric/question set still hashes to the pre-task fingerprint"*

Both asserted `rubricVersionTag(JSON.stringify(loadCheckpointRubrics())) ===
'rubric-efe55590'`.

**Root cause:** `rubricVersionTag()` is a deterministic FNV-1a hash
(`functions/_lib/cadence/checkpoint-evaluation.mjs`) over the M0–M11
checkpoint rubric/question objects extracted live from
`headspa-mastery.html` by `scripts/cadence-model-regression/load-checkpoint-rubrics.mjs`.
Computing the hash against the actual current `headspa-mastery.html`
(both in the working tree and at committed `HEAD`, in an isolated
`git worktree`) produces `rubric-e0ea1714`, not the pinned
`rubric-efe55590` — the two literally never matched.

Bisected with disposable worktrees across every commit between the pin's
introduction and `HEAD`:

| commit | hash |
|---|---|
| `7a78d17` "Fix Module 1 launch regressions" (pin introduced here, correct at the time) | `rubric-efe55590` |
| `28e935a` "Fix bulk-audit launch regressions" (next commit) | `rubric-e0ea1714` |
| every commit `28e935a..HEAD` | `rubric-e0ea1714` (stable) |

`git diff 7a78d17 28e935a -- headspa-mastery.html` shows exactly one
content-bearing change inside any `const M{n} = {...}` rubric object: a
one-word correction in Module 4's `m4cp2` question text, *"During the crown
assessment"* → *"During the crown station"*. That commit intentionally
corrected wording (unrelated to its own stated scope, "bulk-audit launch
regressions") but never re-pinned this guard in this file. It has failed on
every run since. The change is in Module 4, not Module 2/3/6 — not
protected content.

**Classification:** stale test (assertion pinned a fingerprint that a later,
legitimate, already-shipped commit correctly invalidated, and the pin was
never updated).

**Action taken:** updated both occurrences of `'rubric-efe55590'` to
`'rubric-e0ea1714'` (lines formerly 355 and 370), with an inline comment
explaining the re-pin and pointing back to this document. No other line
changed.

---

## 2. `tests/cadence-production-path-qa-harness.test.mjs`

**Status: FIXED.**

**Exact failing assertion (before fix):**
- `[FAIL] 14. CHECKPOINT CONTENT UNCHANGED` — *"Full M0-M11 checkpoint
  rubric/question set is byte-identical to its pre-existing fingerprint"*
  — asserted the same `rubricVersionTag(...) === 'rubric-efe55590'`.

**Root cause:** identical to #1 above — this file carries its own copy of
the same stale pin, from the same source.

**Classification:** stale test, same root cause as #1.

**Action taken:** updated `'rubric-efe55590'` → `'rubric-e0ea1714'` (one
occurrence), with the same explanatory comment referencing this document.

---

## 3. `tests/module-02-rebuild.test.mjs`

**Status: PARTIALLY FIXED.** One narrow, verified stale assertion fixed
(the theorized `.cp-q` candidate). Ten further failures in the same file,
in a different section (`I. MODULE 0`), were investigated, root-caused, and
determined to be **out of scope for a narrow fix** — documented only, not
touched.

### 3a. `D. CHECKPOINT` — FIXED

**Exact failing assertion (before fix):**
- *"the on-screen .cp-q text matches the new question exactly"* — asserted
  `module2Wrap.includes('<div class="cp-q">' + newQuestion + '</div>')`.

**Root cause:** verified directly against current markup (not from the
prior theory alone). `grep -c 'class="cp-q"' headspa-mastery.html` → **0**
— the class does not exist anywhere in the file, for any module. This is
not a Module-2-specific issue: all 22 checkpoints (`grep -c 'class="checkpoint
cc-card"'` → 23 matches, one per checkpoint plus one `aria-hidden` template)
now use the "Cadence Check" card design (shipped in `HEAD`, commit
`6b36a58` "Finalize Module 8 timer and Cadence Check flow"). The full
question text is no longer statically pre-rendered into the page. Traced
the runtime path instead: `getCadenceCheckpointDefinition(moduleId, cpId)`
in `headspa-mastery.html` returns `question` (verbatim `M2.questions.m2cp1`
etc., unmodified), and `assets/js/cadence-shell.js` opens every checkpoint
by calling `appendMessageEl('assistant', session.question)` — i.e. the
exact same question text is now shown to the student as Cadence's own
opening chat message, and the same `session.question` is what
`evaluateCheckpointAnswer()` grades against. The original assertion's
protective intent — that what the student is *shown* matches what they are
*evaluated against* — is fully preserved, just through a different (later,
intentionally shipped) mechanism.

**Classification:** stale test (course-wide UI redesign, not Module 2
curriculum, not a regression).

**Action taken:** replaced the single `.cp-q` assertion with one that (a)
confirms the retired `.cp-q` markup is gone *course-wide* (proving this
isn't a Module-2-specific defect) and (b) confirms `cadence-shell.js` still
opens the checkpoint chat with `session.question` as its first message —
preserving the original display/evaluation-parity guarantee against the
actual current mechanism. No Module 2 curriculum content was touched; only
the test's own expectation about *how* the question is displayed changed.

### 3b. `I. MODULE 0` — NOT FIXED, documented only

**Exact failing assertions (10, unchanged):** all under fixture `I. MODULE
0`, e.g. *"the new 'Before you begin' orientation block renders, positioned
right after the opener and before 0.1"*, *"explains manual opt-in / never
autoplay"*, *"all four controls (Resume Listening / Start Over / Continue
Listening / Listen Again) are named"*, etc. — all check for text inside
`module0Wrap` (extracted from `headspa-mastery.html`'s `#module0Wrap`).

**Root cause:** this test's own header comment names its task as "MODULE 2
CURRICULUM REBUILD + MODULE 0 LISTEN MODE ORIENTATION" (2026-08-31). At
that time, commit `817d3f5` did add a "Before you begin" Listen Mode
orientation block directly inside `#module0Wrap` (confirmed via
`git log -S"Before you begin" -- headspa-mastery.html`, and by checking out
that commit in a worktree). A later, separate, already-shipped commit,
`2a56bf5` ("Add How AIMT Works course orientation"), intentionally
**relocated** that same content — not duplicated, moved — out of
`#module0Wrap` into a new, shared, one-time onboarding view
(`#howAimtWorksView`, shown once between the Cadence intro and the Welcome
Module for a student with `introComplete=true` but not yet
`orientationComplete`). The move is explicitly documented in an inline
comment directly above `#howAimtWorksView` in `headspa-mastery.html`:
*"The Listen Mode explainer below was MOVED here from Module 0's own
markup (not duplicated) -- Module 0 keeps only its own 'Listen with
Cadence — coming soon' status note..."* This is present at `HEAD`,
unrelated to any uncommitted work this session. All ten failing assertions
still look only inside `#module0Wrap`, which by design no longer contains
this content.

**Classification:** stale test (content intentionally relocated to a new,
correct architectural home by a later shipped commit; not missing, not a
regression, not Listen Mode WIP in the "mid-flight, expected to keep
changing" sense — it's a one-time, already-finished move).

**Why not fixed:** bringing this section back to green is not a
single-constant or single-assertion edit — it requires re-deriving which
of the ten checks should move to target `#howAimtWorksView` instead of
`#module0Wrap` (a different extraction target), re-verifying each piece of
expected copy still exists verbatim in its new home, and deciding whether
"exactly one checkpoint in `module0Wrap`" style assertions still make sense
once the orientation content is out of that wrap. That is a real, multi-line
rewrite of section `I`, not the "smallest possible edit" this task's
mandate allows for an opportunistic fix. Recommended as a scoped follow-up:
re-target section `I`'s extraction at `#howAimtWorksView` (via the same
`extractWrap()` helper already in this file) and re-verify each of the ten
copy checks against that view instead of `#module0Wrap`.

---

## 4. `tests/aimt-listen-mode-module1-pilot.test.mjs`

**Status: NOT TOUCHED**, per explicit instruction (protected content).
Byte-identical to `HEAD` — confirmed via `git status --short` before and
after this session's work.

**Exact failing assertions (16, representative sample — full list in test
output):**
- `[FAIL] O/Q/S. FULL DIFF ACCOUNTED FOR` — *"headspa-mastery.html diff
  against the starting commit is a small, bounded set of hunks ... — got
  174"*
- `[FAIL] O. CHECKPOINTS UNCHANGED` — *"m1cp1 on-screen question text
  unchanged"*, *"m1cp2 on-screen question text unchanged"*
- `[FAIL] P. CADENCE CHAT/GRADING UNCHANGED` — *"assets/js/cadence-shell.js
  is byte-identical to the starting commit"*
- `[FAIL] S. DASHBOARD NAV UNCHANGED` — *"my-aimt.html is byte-identical to
  the starting commit"*
- `[FAIL] SCOPE CONTAINMENT` — *"no files outside the Module 1 Listen Mode
  pilot scope were touched"* (lists dozens of files touched by later,
  unrelated sessions: `admin.html`, `courses.html`, `index.html`, various
  `docs/`, etc.)
- `[FAIL] AE. CHECKPOINT 1 RELOCATED` (5/13 sub-checks)

**Root cause:** this test is a point-in-time diff/byte-identity snapshot
pinned against one specific historical commit — the state immediately
after the "Module 1 Listen Mode pilot" task. It asserts the *entire*
subsequent repo diff is bounded to a short, named list of hunks, and that
several specific files (`cadence-shell.js`, `my-aimt.html`, Module 1's
on-screen checkpoint text) remain byte-identical to that starting point.
By construction, this guarantee is only ever true immediately after the
pilot task itself. Every one of the many legitimate sessions since
(dashboard/resources launch, the Cadence Check redesign, Module 2 rebuild,
the "How AIMT Works" orientation, etc.) necessarily invalidates it, because
each touched at least one of the pinned files or added new files anywhere
in the repo. This matches the exact "content that's intentionally being
rebuilt across modules" case this task's instructions call out as
explicitly protected — the failures are the expected, permanent result of
normal forward progress on a test that was never designed to stay green
past its own originating session.

**Classification:** Listen Mode WIP / protected point-in-time snapshot —
explicitly excluded from modification by this task's instructions.
Recommend, as a separate follow-up (not undertaken here — out of this
session's scope and explicitly protected), either retiring this file's
whole-repo-diff-based assertions in favor of scoped, still-relevant checks
of Module 1's actual current Listen Mode behavior, or re-baselining it
against a new starting commit if it is still meant to gate future Module 1
Listen Mode work specifically.

---

## Full-suite result

Before this session's fixes: 4 of 4 target files failing (110/114 passing,
per prior sessions' reporting, consistent with this session's individual
pre-fix runs of each file).

After this session's fixes (`node --test tests/*.test.mjs tests/*.test.js`,
run fresh on 2026-09-16 to confirm no regressions and no drift overnight):

```
ℹ tests 114
ℹ suites 0
ℹ pass 112
ℹ fail 2
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4009.194791

✖ failing tests:

test at tests/aimt-listen-mode-module1-pilot.test.mjs:1:1
✖ tests/aimt-listen-mode-module1-pilot.test.mjs (2296.393875ms)
  'test failed'

test at tests/module-02-rebuild.test.mjs:1:1
✖ tests/module-02-rebuild.test.mjs (43.900833ms)
  'test failed'
```

112/114 passing (up from 110/114), zero regressions elsewhere. The two
remaining failures are documented above (§3b, §4) with root cause and
recommended follow-up; neither was touched, per the constraints on
protected/large-scope changes.
