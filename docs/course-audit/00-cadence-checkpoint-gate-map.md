# Cadence Checkpoint Gate Map

**Status:** Phase 1 authority document. Inventories every current required
checkpoint across Modules 0–11 exactly as implemented today. **Does not
change any gating behavior** — this is Phase 2 preparatory work per
`docs/course-audit/00-cadence-launch-sweep-build-contract.md` Section 9;
Phase 2's full-screen shell / checkpoint migration reads this document as
its starting map rather than rediscovering the current behavior from
scratch.

## How gating actually works today (verified, not assumed)

There is **no mid-module content-hiding gate anywhere in this codebase.**
Grepped for any mechanism that hides a later section of the *same* module
behind an earlier checkpoint — none exists. All of a module's instructional
content is visible/scrollable regardless of checkpoint status. What
checkpoints actually gate is narrower and uniform across every module:

1. **A checkpoint's own resolved state** — `applyCheckpointInputState()`
   (`headspa-mastery.html:8028`) disables that checkpoint's input/button
   once `checkpointMeta[cpId].status === 'passed'`. This is per-checkpoint,
   not per-section.
2. **The next module's unlock** — `assets/js/headspa-state.js:782`:
   `mod.unlocked = i === 0 || this.isModuleComplete(i - 1)`. A module is
   `complete` (`_isModuleFullyComplete`) only once **every** checkpoint in
   `MODULE_CHECKPOINTS[moduleId]` is passed **and** the read-progress
   threshold is met (`updateLessonProgress()`'s weighted 70% read / 30%
   checkpoint formula, `headspa-mastery.html:8279`). Module *N+1* does not
   unlock until module *N* is complete.
3. **Module 12 eligibility** — `functions/_lib/certification/auth.mjs`'s
   `hasCompletedInstructionalModules()` reads the server-synced
   `course_progress.state.progress['0'..'11'].complete` directly, the same
   fields above, server-side (never a client-trusted flag).

So: every checkpoint below has an identical *mechanism* (pass it → its own
input locks → contributes to its module's completion → gates the next
module). What differs per checkpoint is only the *competency* and which
module it belongs to — recorded below. Per this document's own instruction,
this is stated explicitly rather than assumed: **no checkpoint here hides
"everything afterward" within its own module — that mechanic does not exist
today, in any module.**

## Checkpoint inventory

| Checkpoint ID | Module (slot) | Competency label (as shown to the student) | Content visible before | Content unlocked after (module N+1) | Persistence key |
|---|---|---|---|---|---|
| `m0cp1` | 0 — Welcome Module | Before you move on (leading vs. performing a service) | All of Module 0 | Module 1 | `progress['0'].checkpointMeta.m0cp1` |
| `m1cp1` | 1 — Role of the Head Spa Technician | Apply the boundary (hair-loss / diagnosis boundary) | All of Module 1 | — (2 checkpoints required) | `progress['1'].checkpointMeta.m1cp1` |
| `m1cp2` | 1 | Demonstrate the role (technician vs. step-follower) | All of Module 1 | Module 2 | `progress['1'].checkpointMeta.m1cp2` |
| `m2cp1` | 2 — Welcoming Your Client | Apply the arrival framework (stressed/late-client consent sequence) | All of Module 2 | Module 3 | `progress['2'].checkpointMeta.m2cp1` |
| `cp1` | 3 — Hair & Scalp Anatomy | Apply the timing (delayed shedding / hair-growth cycle) | All of Module 3 | — (2 checkpoints required) | `progress['3'].checkpointMeta.cp1` |
| `cp2` | 3 | Turn anatomy into a decision (scalp barrier / product history) | All of Module 3 | Module 4 | `progress['3'].checkpointMeta.cp2` |
| `m4cp1` | 4 — Microscopy & Scalp Assessment | Read the full scan (regional five-point-scan documentation) | All of Module 4 | — (2 checkpoints required) | `progress['4'].checkpointMeta.m4cp1` |
| `m4cp2` | 4 | Know when the image ends the service (stop-service-on-lesion) | All of Module 4 | Module 5 | `progress['4'].checkpointMeta.m4cp2` |
| `m5cp1` | 5 — Scalp Patterns & Service Adaptation | Midpoint check (mixed regional presentation) | All of Module 5 | — (2 checkpoints required) | `progress['5'].checkpointMeta.m5cp1` |
| `m5cp2` | 5 | Final check (stinging/tenderness → modify or refer) | All of Module 5 | Module 6 | `progress['5'].checkpointMeta.m5cp2` |
| `m6cp1` | 6 — Conditions & Disorders | Real scenario | All of Module 6 | — (2 checkpoints required) | `progress['6'].checkpointMeta.m6cp1` |
| `m6cp2` | 6 | Final check | All of Module 6 | Module 7 | `progress['6'].checkpointMeta.m6cp2` |
| `m7cp1` | 7 — Equipment & Room Setup | Planning check | All of Module 7 | — (2 checkpoints required) | `progress['7'].checkpointMeta.m7cp1` |
| `m7cp2` | 7 | Final check | All of Module 7 | Module 8 | `progress['7'].checkpointMeta.m7cp2` |
| `m8cp1` | 8 — The Head Spa Service | Adaptation check | All of Module 8 | — (2 checkpoints required) | `progress['8'].checkpointMeta.m8cp1` |
| `m8cp2` | 8 | Client question | All of Module 8 | Module 9 | `progress['8'].checkpointMeta.m8cp2` |
| `m10cp1` | 9 — Checkout, Client Closing & Pricing Strategy¹ | Pricing and menu reasoning | All of Module 9 | — (2 checkpoints required) | `progress['9'].checkpointMeta.m10cp1` |
| `m10cp2` | 9¹ | Price feedback and client closing | All of Module 9 | Module 10 | `progress['9'].checkpointMeta.m10cp2` |
| `m9cp1` | 10 — Sanitation & Reset Systems¹ | Between-client reset reasoning | All of Module 10 | — (2 checkpoints required) | `progress['10'].checkpointMeta.m9cp1` |
| `m9cp2` | 10¹ | Post-service concern response | All of Module 10 | Module 11 | `progress['10'].checkpointMeta.m9cp2` |
| `m11cp1` | 11 — AI / Modern Practice Tools | Responding to a client's AI result | All of Module 11 | — (2 checkpoints required) | `progress['11'].checkpointMeta.m11cp1` |
| `m11cp2` | 11 | A real AI request, with real verification | All of Module 11 | Module 12 (Final Exam eligibility) | `progress['11'].checkpointMeta.m11cp2` |
| — | 12 — Final Certification Assessment | No required checkpoints in this sense — gated instead by `hasCompletedInstructionalModules()` (modules 0–11 complete) and then by the entire Module 12 certification engine (`certification_attempts`, three-part assessment, independent of the checkpoint mechanism above) | Modules 0–11 all complete | Certificate issuance | `certification_attempts` (separate system — see `docs/course-audit/modules/module-12.md`) |

¹ **Checkpoint IDs were never renamed during the Module 9↔10 structural
reorder** (`docs/course-audit/modules/module-09-reorder-migration-plan.md`)
— only which *slot* requires them changed. `m10cp1`/`m10cp2` (historically
authored for the old "Module 10" content) now belong to student-facing
**Module 9**; `m9cp1`/`m9cp2` now belong to student-facing **Module 10**.
`MODULE_CHECKPOINTS['9'] = ['m10cp1','m10cp2']` and
`MODULE_CHECKPOINTS['10'] = ['m9cp1','m9cp2']` (`headspa-mastery.html:7796`)
record this explicitly. Any Phase 2 work must preserve this exact mapping —
renaming these IDs to "fix" the historical mismatch would break the saved
progress of every student who passed them under the old IDs.

## Migration implications for Phase 2

- **Every checkpoint shares one gating mechanism** (per-checkpoint pass →
  module completion → next-module unlock). A shared full-screen shell can
  therefore implement gating **once**, generically, rather than per
  checkpoint or per module — there is no per-checkpoint special case to
  preserve here beyond the ID-remapping footnote above.
- **No checkpoint currently hides mid-module content.** If Phase 2's
  full-screen shell introduces any new progressive-disclosure behavior
  (e.g., only showing the next lesson section after a checkpoint), that
  is a **new** product decision, not a preservation of existing behavior —
  flag it to the owner explicitly rather than assuming it's expected.
  This document's own audit found nothing to preserve on that front because
  nothing like it exists today.
- **Two checkpoints per module unlock the next one; the module's own first
  checkpoint gates nothing on its own** (both are required — passing only
  one does not partially unlock anything). A future full-screen thread UI
  should reflect this honestly (e.g., not implying progress toward
  unlocking after only the first of two checkpoints passes, if that would
  overstate what's actually gated).
- **Module 0 has one checkpoint, Module 12 has none** — asymmetric, and
  correctly so; Phase 2 should not assume a uniform "two checkpoints per
  module" pattern.
- **The Cadence thread schema already anticipates this**
  (`supabase/migrations/20260827_create_cadence_threads.sql`): one
  `cadence_threads` row per (student, course, module), `cadence_messages`
  optionally tagged with `checkpoint_id` — a module's thread can hold
  multiple checkpoints' conversations distinguished by that field, matching
  the "one visible thread per module" target with checkpoint-level
  attribution preserved underneath.
- **Module 12 is architecturally separate and must stay that way.** Its
  gate is not `checkpointMeta`-based at all — it's the full certification
  engine. Nothing in a future shared shell should attempt to unify Module
  12's gating with the Modules 0–11 mechanism described above; the build
  contract's stop-loss principle (Section 15) already establishes this.

## What this document does not do

Per this task's explicit instruction: **no gating behavior is changed by
this document.** It is a map of the current, verified state for Phase 2 to
build against — not an implementation, not a proposal to add new gates, and
not authorization to begin the full-screen UI migration.

## Phase 2 implementation notes (added post-migration)

Phase 2 (`docs/course-audit/implementation-log.md` Step 103) built the
shared full-screen shell and migrated all 22 checkpoints above onto it,
confirming every prediction this document made and changing none of the
gating mechanics it described:

- **Gating mechanism unchanged.** `wireCheckpoint()` (`assets/js/
  cadence-shell.js`) intercepts each checkpoint's existing inline
  composer/button and opens the shell in place of inline submission —
  it does not add, remove, or alter any gate. A checkpoint's pass still
  contributes to its module's completion via the exact same
  `APP_STATE.setCheckpointResult()` / `_checkModuleComplete()` sequence
  `submitCheckpoint()` always used; verified live end-to-end (a real
  pass through the new shell correctly marked Module 0 complete and
  unlocked Module 1, with no code path change to that chain).
- **The Module 9<->10 id/slot swap is preserved exactly**, including at
  the content level, not just structurally: a new deterministic test
  (`tests/cadence-phase2-shell.test.mjs`) confirms slot 9 (`m10cp1`)
  resolves pricing/closing subject matter and slot 10 (`m9cp1`) resolves
  sanitation/reset subject matter, and that the swapped ids do not also
  resolve at the wrong slot.
- **No new mid-module content-hiding gate was introduced.** The shell is
  an overlay on the existing lesson page, not a route change or a new
  progressive-disclosure mechanism — closing it returns the student to
  exactly where they were, with all of a module's content still visible
  regardless of checkpoint status, matching this document's own finding
  that no such gate exists anywhere today.
- **Module 12 confirmed untouched** by construction: `MODULE_CHECKPOINTS['12']`
  is still `[]`, so the one generic wiring call this task added
  (inside `restoreLessonState()`) never fires for Module 12, and a static
  test asserts `cadence-shell.js` never references
  `certification_attempts`, `part3_conversation_state`, or
  `/api/certification/*`.
