# Module 9 Reorder — Saved-State Migration Plan

**Course:** AIMT Head Spa Certification Course
**Scope:** technical slot 9 ↔ slot 10 content/index swap required by `module-09.md`'s "Critical technical requirement"
**Status:** **Approved migration design candidate — ready for final external approval.** The prior review pass found two concrete omissions (see "Correction history" below); both have been resolved without expanding the migration's scope beyond one version-gated migration, one 9↔10 whole-object state swap, explicit named-field pointer remaps, and narrow quarantine support (classified **SIMPLE/CONTAINED**). This document is still **not** permission to implement — it remains a technical design document awaiting explicit sign-off.
**Depends on:** `docs/course-audit/modules/module-09.md` (curriculum specification, approved in substance)
**Governs:** step 2 of `module-09.md`'s "Critical technical requirement" → "Required sequence" — this plan itself must clear step 3 (external review and explicit approval) before step 4 (implementation) may begin.

**Correction history:** an initial external review of this plan found it approvable after two narrow corrections: (1) the originally proposed `_migrationQuarantine` state-object field would have been silently discarded by `sanitizeState()`'s fixed reconstruction (§2.8) and never actually persisted — corrected to a separate `localStorage` key (§6.1); (2) two persisted numeric "which module is the student in" pointers (`guide.currentModule`, `resume.moduleId`) were omitted from the swap — corrected with an explicit, narrowly-scoped `9 → 10` / `10 → 9` remap (§3.2). Both corrections are reflected throughout this document, including the pseudocode (§7) and test matrix (§8).

This plan is grounded entirely in direct inspection of the current repository — `assets/js/headspa-state.js`, `assets/js/aimt-progress-sync.js`, and the relevant data maps in `headspa-mastery.html` — performed during this task and the prior one. No production file was edited to produce it.

---

## 1. The problem, restated precisely

Current architecture:

- technical slot 9 = Sanitation (`m9cp1`/`m9cp2`)
- technical slot 10 = Pricing (`m10cp1`/`m10cp2`)
- technical slot 11 = Course Completion & Certification

Desired student-facing order:

- slot 9 = Checkout, Client Closing & Pricing Strategy (Pricing's content, `m10cp1`/`m10cp2`)
- slot 10 = Sanitation & Reset Systems (Sanitation's content, `m9cp1`/`m9cp2`)
- slot 11 = AI / Modern Practice Tools (does not exist yet)
- slot 12 (future) = Final Exam (does not exist yet)

Because persisted student progress is keyed by numeric slot (`progress["9"]`, `progress["10"]`), a bare content swap without a state migration would let a student's genuine competency in one subject be misread as competency in the other, or vice versa. The governing rule, restated from `module-09.md`:

> **Progress follows the competency/content, not the old slot number.**

---

## 2. Persistence architecture — factual findings

### 2.1 Storage locations

- **Local/browser:** `localStorage`, key `levo_app` (`assets/js/headspa-state.js:2`, `STORAGE_KEY`). This is the authoritative in-browser copy. A second legacy key, `levo4_profile` (`headspa-state.js:3`, `LEGACY_PROFILE_KEY`), is read once by an existing one-way migration (`_migrate()`, `headspa-state.js:525–535`) that backfills only `student.name`/`introResponse`/`introComplete`/`joined` from a pre-course-launch shape — it does not touch `progress` at all and is unrelated to this reorder.
- **Remote/authenticated:** Supabase table `course_progress` (per `CLAUDE.md` and confirmed in `assets/js/aimt-progress-sync.js:23`, `TABLE = 'course_progress'`), columns `user_id`, `course_slug`, `state` (jsonb — the entire `APP_STATE` blob, not a separate remote schema), `progress_score`, `client_saved_at`, `updated_at`. Sync is initialized only after authentication and entitlement are confirmed (`AIMT_SYNC.init(supabaseClient, 'headspa-mastery')`, called from `headspa-mastery.html` after both checks pass — not inspected line-by-line in this task, but its call contract is documented in `aimt-progress-sync.js`'s header comment and matches `CLAUDE.md`).

### 2.2 Can local and remote coexist? Which wins?

Yes, by design — this is the system's normal operating mode for a signed-in student on multiple devices. Merge policy (`aimt-progress-sync.js:39–118`), confirmed by direct code reading, not inferred from comments alone:

1. **Higher `progress_score` wins.** `computeScore(state)` sums, over every key in `state.progress` (numeric-slot-agnostic — it iterates whatever keys exist and reads `mod.complete`/`mod.checkpointMeta` from each, with no awareness of which subject that slot represents): +100 per `mod.complete === true`; +5 per checkpoint with `status === 'passed'`; +1 per checkpoint with any non-empty `status` (attempted, not yet passed); +10 if `student.introComplete`.
2. **On a score tie, newer `client_saved_at` wins.**
3. On `pullAndMerge()`, if remote wins, the remote `state` blob is written directly into `localStorage[levo_app]` and then **`window.APP_STATE.load()` is called** — the exact same function used for a normal local page load (`aimt-progress-sync.js:121–138`, explicit comment: *"Write through localStorage, then let APP_STATE's own load() sanitize/migrate/derive — never bypass its rules."*). If local wins, a push is scheduled instead.

**This is the single most important architectural fact for this migration:** there is only **one** code path that ever materializes a raw state blob (whether it originated locally or from Supabase) into runtime data — `APP_STATE.load()` → `sanitizeState()` → `_migrate()` → `_syncDerivedState()`. Remote state is never applied by any separate mechanism. Any migration logic added inside this pipeline automatically covers both storage layers with no separate remote-specific migration code required.

### 2.3 Schema/version mechanism

`SCHEMA_VERSION = 2` (`headspa-state.js:4`) exists and is written into `data.schemaVersion` by both `createDefaults()` and `sanitizeState()`. **Confirmed by direct inspection: this field is currently write-only.** `sanitizeState(raw)` never reads `raw.schemaVersion` to branch on anything — it unconditionally overwrites the field with the current constant. There is no existing version-gated migration logic today; `SCHEMA_VERSION` is a label, not (yet) an active gate. `_migrate()` (the one existing migration function, for the `levo4_profile` legacy key) does not consult `schemaVersion` either — it runs unconditionally on every `load()` and is inherently idempotent because it only backfills fields that are still empty (`if (old.introComplete && !this.data.student.introComplete)`).

### 2.4 Load/save path

- `load()` (`headspa-state.js:501–514`): read `localStorage[levo_app]` → `JSON.parse` (fails safe to `null` → defaults) → `sanitizeState(parsed)` → `_migrate()` → `_syncDerivedState()` → `save()`.
- `save()` (`headspa-state.js:516–523`): calls `_syncDerivedState()` again, then writes to `localStorage` — **unless Review Mode is active, in which case it returns before writing anything** (`if (window.ReviewMode && window.ReviewMode.isActive()) return;`).
- `_syncDerivedState()` (`headspa-state.js:537–566`, confirmed by direct reading): re-sanitizes `progress` via `sanitizeProgress()`, then **for every module index 0 through `MODULE_COUNT - 1`, calls `reconcileModuleState(i)`, recomputes `mod.complete` via `_isModuleFullyComplete(i)`, and recomputes `mod.unlocked` as `i === 0 || this.isModuleComplete(i - 1)`** — every single time state loads or saves, unconditionally.
- `reconcileModuleState(moduleId)` (`headspa-state.js:586–605`): recomputes `mod.checkpoints` (the array of passed checkpoint IDs) by filtering `getRequiredCheckpointIds(moduleId)` — which reads `window.MODULE_CHECKPOINTS[String(moduleId)]`, a map declared in `headspa-mastery.html:6990–7003` — against `checkpointMeta`, keeping only IDs whose `checkpointMeta[cpId].status === 'passed'`.

**Consequence: `complete`, `unlocked`, `completedAt`, and `checkpoints` are fully derived, not independently authoritative, and are recomputed from `checkpointMeta` + `MODULE_CHECKPOINTS` on every single load/save cycle.** They do not need to be manually migrated or recomputed by migration code — they self-correct the moment `MODULE_CHECKPOINTS` (production code, changed by the eventual implementation task, not this plan) and `checkpointMeta` (persisted data, which this migration does move) are both in their post-reorder shape.

### 2.5 Review Mode

Confirmed: `AIMT_SYNC.init()` no-ops immediately if Review Mode is active (`aimt-progress-sync.js:220–223`), and `APP_STATE.save()` no-ops before any `localStorage` write if Review Mode is active (`headspa-state.js:518–519`). Review Mode's checkpoint-testing path (`submitCheckpointReviewMode`, in `headspa-mastery.html`, not `headspa-state.js`) is a separate, already-audited code path that never calls `setCheckpointResult`. **Conclusion: this migration must never run, or must be a guaranteed no-op, while Review Mode is active** — there is no real student progress to migrate in that mode, and the existing architecture already prevents any Review Mode write from reaching `localStorage` or Supabase.

### 2.6 Legacy state shapes still supported

Exactly one: the `levo4_profile` → `levo_app` intro-field backfill described in 2.3, unrelated to `progress` and unrelated to this reorder. No other legacy shape currently has support code.

### 2.7 A previously undocumented complication — numeric-ID-coupled Cadence memory logic

Direct inspection surfaced two additional places, beyond `MODULE_CHECKPOINTS` and `MODULE_TITLES`, where numeric module identity is embedded and would need correction by the **implementation** task (not this migration plan, which only moves persisted data) for the reorder to be fully correct going forward:

- **`MODULE_MEMORY_TAGS`** (`headspa-state.js:131–144`) — a slot-number-keyed map of Cadence "focus tags" per module (e.g., `9: ['sanitation-discipline', 'complaint-response', 'service-flow']`, `10: ['pricing-logic', 'positioning', 'client-explanation']`). Unlike `MODULE_CHECKPOINTS`/`MODULE_TITLES`, this map lives **inside `headspa-state.js` itself**, not in `headspa-mastery.html`.
- **`getCheckpointMemoryTags(moduleId, answer)`** (`headspa-state.js:303–360`) — not a data map but **hardcoded conditional regex logic per numeric module ID** (`if (moduleId === 9) {...sanitation regex...} else if (moduleId === 10) {...pricing regex...}`), called from `captureCheckpointMemory(moduleId, cpId)` every time a checkpoint is passed, to tag and summarize the student's answer for Cadence's memory. This is genuine code branching on the numeric slot, not a swappable config value — a materially different (and larger) change than reassigning a map.

**Why this matters for the migration plan specifically, even though it is an implementation-task concern:** the *pseudocode and test matrix below only need to move already-computed `notableAnswers` entries correctly* (see §5, §7) — those entries' `tags`/`summary` were computed at capture time from the answer's actual content, and remain valid regardless of which slot number is later attached to them. This migration does not need to recompute tags. But the **implementation task** must still update `MODULE_MEMORY_TAGS[9]`/`[10]` and the `moduleId === 9`/`=== 10` branches inside `getCheckpointMemoryTags`/`getCheckpointMemorySummary` so that *future* checkpoint submissions (post-reorder) are tagged correctly — this expands the known code-change surface for the eventual implementation beyond what `module-09.md`'s "Critical technical requirement" originally named (`MODULE_CHECKPOINTS`, `MODULE_TITLES`). Recorded here so it is not lost before implementation begins.

### 2.8 `sanitizeState()` is a fixed reconstruction, not a passthrough — confirmed by direct code reading (governs §6.1's correction)

Directly quoted, `sanitizeState(raw)` (`headspa-state.js:451–487`):

```js
function sanitizeState(raw) {
  const defaults = createDefaults();
  if (!raw || typeof raw !== 'object') return defaults;

  const state = {
    schemaVersion: SCHEMA_VERSION,
    student: { /* ...five explicit fields... */ },
    progress: sanitizeProgress(raw.progress),
    guide: { currentModule: /* ... */ },
    resume: { /* ...four explicit fields... */ }
  };

  return state;
}
```

**This function returns a hand-built object literal containing exactly five top-level keys — `schemaVersion`, `student`, `progress`, `guide`, `resume` — and nothing else.** It does not spread `...raw`, does not copy any unrecognized top-level property, and does not preserve any field outside this fixed shape. `sanitizeCadenceMemory()` (`headspa-state.js:257–274`) and `sanitizeProgress()` (`headspa-state.js:390–449`) both follow the identical pattern one level down: every sanitize function in this file reconstructs a known, fixed shape field-by-field and silently drops anything not explicitly named.

**Direct consequence, confirmed by this reading, not assumed:** if a migration step were to write a new top-level property (e.g., `rawParsedState._migrationQuarantine = {...}`) onto the object passed into `sanitizeState()`, that property would **not** appear in `sanitizeState()`'s return value — it would be silently discarded in the same `load()` call that created it, before `this.data` is ever assigned and long before `save()` ever writes anything to `localStorage`. **The original plan's `_migrationQuarantine`-as-a-state-field design, as written in the version of this document reviewed previously, does not actually survive the pipeline it depends on.** This is corrected in §6.1 below.

---

## 3. State shape inventory — `progress["9"]` and `progress["10"]`

Per `createModuleProgress()` (`headspa-state.js:163–181`) and `sanitizeProgress()` (`headspa-state.js:390–449`), each numbered slot's persisted object has the following fields. Classification (move / recompute / do-not-move / preserve-untouched) is the core input to the migration algorithm in §6.

| Field | Present today | Classification | Reasoning |
|---|---|---|---|
| `checkpoints` (array of passed checkpoint ID strings) | Yes | **Recompute** — do not hand-migrate | Fully derived by `reconcileModuleState()` from `checkpointMeta` + `MODULE_CHECKPOINTS` on every load/save (§2.4). Migrating `checkpointMeta` correctly makes this self-correct. |
| `checkpointMeta` (object keyed by checkpoint ID: `{status, feedback, answer, attempts, updatedAt}`) | Yes | **Move — this is the actual evidence of competency** | Keyed by checkpoint ID (`m9cp1`, `m10cp1`, etc.), which is *not* renamed by the reorder (`module-09.md` §"Keep unchanged"). This is the field that must travel to the slot matching its checkpoint ID's new content. |
| `complete` (boolean) | Yes | **Recompute — do not hand-migrate** | Derived every cycle (§2.4). A blind copy risks exactly the false-completion failure mode the reorder must avoid. |
| `unlocked` (boolean) | Yes | **Recompute — do not hand-migrate** | Derived purely from `isModuleComplete(id - 1)` every cycle (§2.4) — never read from storage as authoritative. |
| `startedAt` / `lastVisitedAt` / `lastScrollY` / `maxReadPercent` | Yes | **Move as a unit with the whole progress object** | Not checkpoint-specific; describes engagement with *whatever content was in that slot at the time*. Splitting these from `checkpointMeta` would create an internally inconsistent record (e.g., "spent 8 minutes reading" attached to the wrong subject). Moving the entire object as one unit keeps this metadata self-consistent with the checkpoint evidence it accompanies. |
| `completedAt` (timestamp or `null`) | Yes | **Recompute — do not hand-migrate** | Directly tied to `complete`; both are reset together in `setCheckpointResult`/`_syncDerivedState` (`headspa-state.js:596–602`, `727–733`). |
| `videoChapters: {completed: [], current: 0}` | Yes | **Do not move — irrelevant to slots 9/10** | Only Module 8 has a nonzero video-chapter requirement (`MODULE_REQUIRED_VIDEO_CHAPTERS = {'8': 9}`, `headspa-mastery.html:7014`). For slots 9/10 this field is always at its default and carries no meaning either direction. |
| Any unrecognized/additional properties | N/A | **Preserve untouched, do not invent handling** | `sanitizeProgress()` already reconstructs each module's object field-by-field from a fixed known shape (`headspa-state.js:430–446`) — it does not pass through unknown properties. The migration must not attempt to preserve properties the existing sanitizer itself discards; inventing that behavior would exceed the current architecture's own guarantees. |

**Resulting migration operation for `progress`:** swap the two **entire** module-progress objects between keys `"9"` and `"10"` (not a field-by-field merge) — this correctly moves `checkpointMeta` (the evidence) together with its self-consistent engagement metadata (`startedAt` etc.), while `complete`/`unlocked`/`completedAt`/`checkpoints` self-correct on the very next `_syncDerivedState()` call, which `load()` always performs immediately after.

### 3.1 A field this migration must also touch: `student.cadenceMemory.notableAnswers[]`

Not part of the per-module `progress` object, but keyed to a checkpoint and therefore in scope. Per `captureCheckpointMemory()` (`headspa-state.js:934–960`) and `sanitizeNotableAnswers()` (referenced from `sanitizeCadenceMemory`, `headspa-state.js:242–255` per the earlier read), each entry has the shape `{moduleId, checkpointId, summary, tags, updatedAt}`, deduplicated and looked up **by `checkpointId`**, not `moduleId` (`headspa-state.js:941`: `findIndex(entry => entry.checkpointId === cpId)`).

- `checkpointId` — **do not change.** Checkpoint IDs are not renamed.
- `summary` / `tags` — **do not recompute.** These describe the actual answer content (via `getCheckpointMemoryTags`/`getCheckpointMemorySummary`, run once at capture time) and remain valid regardless of which slot number is later attached — see §2.7.
- `moduleId` — **must be corrected** to the new slot number matching its `checkpointId` (an entry with `checkpointId: 'm9cp1'` gets `moduleId: 10`; an entry with `checkpointId: 'm10cp1'` gets `moduleId: 9`), since this field is surfaced directly to Cadence as display text (`"Module " + item.moduleId + " — " + item.summary"`, `headspa-state.js:1003`) and would otherwise show the wrong module number to the student-facing AI after the reorder.

### 3.2 Numeric navigation/content-identity pointers — corrected, previously incomplete

**This subsection was added during external review.** The original plan correctly swapped `progress["9"]`/`["10"]` and corrected `notableAnswers[].moduleId`, but omitted two other persisted numeric fields that also mean "which module the student is currently in" and are therefore subject to the identical identity confusion the reorder must avoid: a student who was last known to be in old Module 9 (Sanitation) must resume into *new* Module 10 (Sanitation) — not new Module 9 (Pricing), which the raw number `9` would otherwise point to.

Verified directly against `sanitizeState()` (`headspa-state.js:451–487`, quoted in §2.8) — this is the complete, exhaustive top-level shape; there are no other top-level fields to check beyond `schemaVersion`, `student`, `progress`, `guide`, `resume`.

| Field path | Current use, verified | Classification | Migration rule |
|---|---|---|---|
| `data.guide.currentModule` (`headspa-state.js:200–202` default; `469–474` sanitize) | The module Cadence's guide context currently treats as active. Set by `setCurrentModule(moduleId)` (`headspa-state.js:767–781`) whenever a student opens a module; read wherever the UI needs "what module is the student looking at right now." | **Content-identity pointer — remaps** | `9 → 10`, `10 → 9`, every other value (0–8, 11) unchanged. |
| `data.resume.moduleId` (`headspa-state.js:204–206` default; `475–483` sanitize) | Which module a returning student resumes into. Set alongside `guide.currentModule` in `setCurrentModule()`, and independently in `setCheckpointResult()` (`headspa-state.js:735`) and `setLessonScroll()` (`headspa-state.js:796`) — every place that touches `resume.moduleId` writes the numeric module ID directly. | **Content-identity pointer — remaps** | `9 → 10`, `10 → 9`, every other value (0–8, 11) unchanged. |
| `student.cadenceMemory.notableAnswers[].moduleId` | Already covered in §3.1 — remapped by matching each entry's `checkpointId` prefix, not by a blind numeric swap (a different, checkpoint-anchored mechanism, but the same underlying goal). | **Content-identity pointer — remaps (already specified)** | See §3.1 — driven by `checkpointId`, not by comparing the stored number directly. |

**Fields checked and explicitly ruled out — do not swap, to avoid an over-broad "swap every 9 or 10" mistake:**

- `progress[id].checkpointMeta[cpId].attempts` (an integer attempt counter) — could coincidentally equal `9` or `10` for a student who retried a checkpoint many times. This is **not** a module identity — it is a per-checkpoint counter, entirely unrelated to which slot the checkpoint occupies, and must never be touched by pointer-remap logic. (It already travels correctly as an untouched sub-field of the whole-object swap in §3.)
- `progress[id].videoChapters.current` (0-based chapter index, only meaningful for Module 8, range 0–8) — represents "which video chapter within this module," not "which module." Its value space (0–8) is unrelated to slot numbers 9/10, and it already travels correctly with its parent whole-object swap; it must never be independently remapped.
- `student.cadenceMemory.notableAnswers[].updatedAt` / any other timestamp (epoch milliseconds) — could numerically be anything; obviously not a module pointer, listed only to be explicit that timestamp fields are never in scope for this correction.
- `resume.scrollY` (pixel offset) — could coincidentally be `9` or `10` for a barely-scrolled page. Not a module identity.

**Rule, stated once, precisely:** the 9↔10 remap applies **only** to the two named fields above (`guide.currentModule`, `resume.moduleId`) plus the already-specified `notableAnswers[].moduleId` correction — never to any other numeric value anywhere in the state object merely because it happens to equal 9 or 10.

---

## 4. Checkpoint ID mapping and post-migration validation

Approved architecture (`module-09.md`, "Keep unchanged"): checkpoint ID strings are never renamed.

| Competency | Checkpoint IDs | Pre-reorder slot | Post-reorder slot |
|---|---|---|---|
| Checkout, Client Closing & Pricing Strategy | `m10cp1`, `m10cp2` | 10 | **9** |
| Sanitation & Reset Systems | `m9cp1`, `m9cp2` | 9 | **10** |

Post-reorder, `MODULE_CHECKPOINTS['9']` (production code, `headspa-mastery.html`, changed by the implementation task, not this plan) must resolve to `['m10cp1', 'm10cp2']`, and `MODULE_CHECKPOINTS['10']` must resolve to `['m9cp1', 'm9cp2']`.

**How checkpoint state is validated after relocation:** because `checkpointMeta` is keyed by checkpoint ID string and travels with its whole progress object (§3), and because `getRequiredCheckpointIds(moduleId)` reads the (separately updated) `MODULE_CHECKPOINTS` map by slot number, correctness is a straightforward cross-reference the *existing, unmodified* `reconcileModuleState()`/`_isModuleFullyComplete()` logic already performs: after migration, slot 9's `checkpointMeta` contains `m10cp1`/`m10cp2` entries, and slot 9's required IDs (once `MODULE_CHECKPOINTS` is updated by the implementation task) are also `m10cp1`/`m10cp2` — they match, and `complete` computes correctly. No new validation code is required beyond what already exists; the migration's job is solely to make the *data* match what the *already-correct* derivation logic expects.

---

## 5. Idempotent migration design

### 5.1 Marker mechanism — reuse the existing `SCHEMA_VERSION` field

Per the instruction to reuse an existing version mechanism where one exists: `SCHEMA_VERSION` already exists, is already persisted on every state object, and has been bumped exactly once before (implicitly, by its presence at `2` with no visible history of `1` in this codebase — but the *mechanism* of "a single integer gate" is the established pattern, even though no read-side branch currently exists). This is the natural, minimal, architecture-consistent choice — **do not invent a new, separate flag** (e.g., a bespoke `module9ReorderMigrated` boolean) when a version field already exists for exactly this purpose and merely needs its first real read-side consumer.

**Proposal:** bump `SCHEMA_VERSION` from `2` to `3`. Add one new, narrowly-scoped private method, `_migrateModule9Reorder()`, invoked from `load()` immediately alongside the existing `_migrate()` call. The method's own first action is to check `this.data.schemaVersion` **as read from the raw parsed input, before `sanitizeState()` overwrites it** — this requires passing the pre-sanitize raw value through, since today `sanitizeState()` unconditionally stamps the *current* `SCHEMA_VERSION` and discards whatever the raw blob said. (This is a small, disclosed change to `sanitizeState()`'s contract — it must preserve or return the raw incoming version alongside the sanitized object, or the migration must run *before* `sanitizeState()` rather than after. Both are viable; the implementation task should pick whichever fits `sanitizeState()`'s existing call sites with the least disruption. Not decided here — this is implementation detail within the approved migration algorithm, not a new design question.)

### 5.2 State classification at load time

The migration must classify incoming state into exactly one of five categories before acting:

1. **Pre-reorder** — `schemaVersion < 3` (or absent/malformed, treated as `< 3`) **and** `progress` contains recognizable module-9/module-10 data in the old shape. → run the migration (§6).
2. **Already migrated** — `schemaVersion >= 3`. → no-op; proceed normally. This is what makes the migration safe to run on every load without re-applying it.
3. **Fresh/new** — no prior `progress` data at all (a brand-new student, i.e. `raw` is `null` or has no meaningful `progress` object). → skip the migration entirely and stamp `schemaVersion = 3` directly; there is nothing to move. This must be checked **before** category 1's swap logic runs, so a fresh student is never routed through swap code that assumes pre-existing data.
4. **Partially populated** — `schemaVersion < 3`, and `progress["9"]`/`progress["10"]` exist but one or both have no meaningful `checkpointMeta` (e.g., a student who opened Sanitation but never attempted a checkpoint, and never touched Pricing at all). → still run the migration (§6) — an empty/default module-progress object swaps just as safely as a populated one; there is no special case required here, only a specific outcome to verify (see §7, "Partial Sanitation checkpoint state" / "Partial Pricing checkpoint state" test cases).
5. **Malformed/unknown** — `progress["9"]` or `progress["10"]` exists but is not a well-formed object matching the known shape (e.g., corrupted JSON survived `JSON.parse` as some other type, or a future unrelated bug produced garbage). → **fail closed** (§6.1) — do not guess a mapping; do not swap; log and leave the slot in the safest available state.

### 5.3 Why a second page load cannot swap the modules back again

Because `SCHEMA_VERSION` is bumped to `3` **as part of the same migration write** (§6, step 7) and immediately persisted via the normal `save()` call that already concludes `load()`, any subsequent `load()` call — same device, same session, next day, or a remote pull that round-trips through `localStorage` — reads `schemaVersion >= 3` and takes the category-2 (already-migrated) no-op path before any swap logic is even reached. The swap is not re-derived from content inspection on every load (which would be genuinely unsafe and could flip-flop); it is derived exactly once, gated by a durable, persisted marker, exactly like the existing `_migrate()` pattern already does for its own one-time backfill.

---

## 6. Fail-closed behavior

**Overriding rule, verbatim from the governing instruction: false incompletion is preferable to false completion.** But preserve demonstrated competency whenever the state provides enough evidence to map it safely — do not discard real evidence merely because it is convenient not to reason about it.

### 6.1 What "fail closed" means concretely here — **corrected quarantine mechanism**

**This subsection was corrected during external review.** The originally proposed design — writing quarantined data onto a new `_migrationQuarantine` property of the raw state object — was found not to survive the pipeline it depends on (§2.8: `sanitizeState()` reconstructs a fixed five-key shape and silently drops any unrecognized top-level property, in the same `load()` call, before `this.data` is ever assigned). That design is replaced below with a mechanism verified to actually persist.

**Corrected mechanism: a separate `localStorage` key, entirely outside the sanitized `levo_app` blob — following the codebase's own existing precedent.** This repository already has exactly this pattern: `LEGACY_PROFILE_KEY = 'levo4_profile'` (`headspa-state.js:3`) is a second, adjacent `localStorage` key holding data that `_migrate()` reads once, independent of `sanitizeState()`'s fixed shape. The quarantine mechanism reuses this same architecture rather than inventing a new one.

- **Exact key name:** `aimt_module9_reorder_quarantine` (matching this codebase's existing `aimt_`-prefixed key-naming convention, e.g. `REVIEW_MODE_SESSION_KEY = 'aimt_review_mode'`, `headspa-state.js:17`).
- **Exact shape (a JSON string via `localStorage.setItem`):** `{ slot9: <raw slot 9 value, verbatim, whatever it was>, slot10: <raw slot 10 value, verbatim>, quarantinedAt: <timestamp> }`.
- **When populated:** only inside the malformed-state fallback branch (§5.2 category 5) — the overwhelming majority of students never write this key at all.
- **How it is written:** a direct `localStorage.setItem('aimt_module9_reorder_quarantine', JSON.stringify(...))` call, performed as its own explicit step, **entirely independent of `sanitizeState()`/`this.data`/`save()`.** Because it never enters the `levo_app` object or the sanitize pipeline, it is not reconstructed, filtered, or dropped by anything described in §2.8 — it survives by never being subject to that pipeline in the first place, not by being added to a schema that would need to recognize it.
- **How long it remains:** indefinitely. No automatic expiry or deletion is proposed — inventing a TTL/cleanup mechanism for what should be an exceedingly rare case (corrupted JSON that survived `JSON.parse` as a non-object shape) would be unnecessary complexity. It may be manually inspected and cleared once resolved, or removed by a later, separate cleanup task. This mirrors `LEGACY_PROFILE_KEY`'s own precedent: `_migrate()` never deletes `levo4_profile` after reading it either.
- **Never interpreted as valid progress, by construction, not by convention:** no code path that computes `complete`, `unlocked`, `checkpoints`, `getOverallPct()`, or any other completion/progress value reads any `localStorage` key other than `levo_app` (and, once, `levo4_profile` for the unrelated intro-field backfill). Since `aimt_module9_reorder_quarantine` lives at a different key entirely, it is structurally impossible for it to be read into any completion/unlock calculation — there is no filtering rule to get wrong, because there is no read path to it at all from that logic.
- **Excluded from completion/unlock calculations:** see above — enforced by the absence of any read path, not by an explicit exclusion check that could be bypassed or forgotten.

Given this correction, the fail-closed behavior for a malformed slot is:

- **Do not** mark either slot `complete` as a result of the migration — automatic, since `complete` is always recomputed from `checkpointMeta` (§2.4), never written directly by the migration.
- **Do not** silently unlock slot 10 (or any downstream slot) based on an assumption about slot 9's state — automatic, since `unlocked` is always recomputed from the *previous* slot's `isModuleComplete()`, which itself derives from `checkpointMeta`.
- **Do not discard the malformed data.** Write it verbatim to `aimt_module9_reorder_quarantine` (above) before replacing `rawParsedState.progress["9"]`/`["10"]` with safe empty defaults — this keeps the door open for manual/future recovery without ever presenting it as valid progress in the meantime. A quarantined slot is treated as though it had no `checkpointMeta` at all for completion purposes (i.e., it behaves like a fresh, empty module-progress object going forward) until someone with more context resolves it.
- **Do not reset the whole course** merely because slots 9/10 are ambiguous — Modules 0–8's data is untouched by this migration entirely (§8, regression case) and must not be touched as a side effect of handling an ambiguous slot 9/10.
- Record the fact that a malformed-state fallback occurred (e.g., a console warning in the pattern already used elsewhere in this file) so it is discoverable, not silent — the quarantine key's mere existence is itself a discoverable signal, but a warning at the moment of detection is still worthwhile.

### 6.2 Safest outcome, stated as a single sentence

When in doubt, a slot ends up looking exactly like a **fresh, never-visited module** — locked or unlocked purely by the normal sequential rule applied to whatever *is* safely known about the module before it — never falsely marked complete, and never silently discarded.

---

## 7. Migration algorithm — pseudocode

**Not implemented by this plan.** Provided to make the design concrete and reviewable. **Revised to incorporate both corrections** from this review pass: the quarantine write now targets a separate `localStorage` key (§6.1) instead of a dropped state-object property, and two content-identity pointers (§3.2) are now explicitly remapped alongside `notableAnswers`.

```
function migrateModule9ReorderIfNeeded(rawParsedState):
    # Step 1: detect raw schema version BEFORE sanitization
    # (sanitizeState() would otherwise unconditionally overwrite it — §2.3)
    if rawParsedState is null or has no meaningful progress object:
        # Category 3: fresh/new student — nothing to migrate
        stamp schemaVersion = 3 on the object that will be returned
        return  # normal sanitize/defaults path continues unchanged

    version = rawParsedState.schemaVersion if present else 0

    # Step 2: classify fresh / old / migrated / malformed
    if version >= 3:
        # Category 2: already migrated — hard no-op
        return

    slot9 = rawParsedState.progress["9"]   # pre-migration: Sanitation
    slot10 = rawParsedState.progress["10"] # pre-migration: Pricing

    if slot9 is not a well-formed module-progress-shaped object
       or slot10 is not a well-formed module-progress-shaped object:
        # Category 5: malformed/unknown — fail closed, do not guess.
        # CORRECTED (§6.1): write quarantine to its OWN localStorage key,
        # never as a property of rawParsedState — a property added here
        # would be silently dropped by sanitizeState() (§2.8) before
        # save() ever runs, and would never actually persist.
        localStorage.setItem(
            'aimt_module9_reorder_quarantine',
            JSON.stringify({ slot9: slot9, slot10: slot10, quarantinedAt: now() })
        )
        rawParsedState.progress["9"] = createModuleProgress(9)   # safe, empty default
        rawParsedState.progress["10"] = createModuleProgress(10) # safe, empty default
        stamp schemaVersion = 3  # still mark handled — see note below
        log a warning identifying the quarantine key
        return

    # Step 3: preserve a safe copy/reference of pre-migration slot 9 and 10 state
    preSwapSlot9 = deepClone(slot9)
    preSwapSlot10 = deepClone(slot10)

    # Step 4: swap the whole per-slot module-progress objects (see §3 —
    # checkpointMeta + its consistent engagement metadata travel together;
    # complete/unlocked/completedAt/checkpoints are NOT hand-copied here
    # because they self-correct in step 10 below)
    rawParsedState.progress["9"] = preSwapSlot10   # Pricing's data now under slot 9
    rawParsedState.progress["10"] = preSwapSlot9   # Sanitation's data now under slot 10

    # Step 5: correct notableAnswers[].moduleId to match each entry's
    # checkpointId's NEW slot (§3.1) — tags/summary are untouched.
    for entry in rawParsedState.student.cadenceMemory.notableAnswers:
        if entry.checkpointId starts with "m9cp":
            entry.moduleId = 10
        else if entry.checkpointId starts with "m10cp":
            entry.moduleId = 9
        # any other checkpointId (other modules) is left untouched

    # Step 6: correct verified resume/current-module pointers — CORRECTED,
    # newly added (§3.2). Applies ONLY to these two named fields, never to
    # any other number that happens to equal 9 or 10 (see §3.2's explicit
    # ruled-out list — attempts counters, video-chapter indices, scrollY,
    # timestamps are never touched here).
    if rawParsedState.guide and rawParsedState.guide.currentModule == 9:
        rawParsedState.guide.currentModule = 10
    else if rawParsedState.guide and rawParsedState.guide.currentModule == 10:
        rawParsedState.guide.currentModule = 9
    # else: 0-8, 11, or absent — unchanged

    if rawParsedState.resume and rawParsedState.resume.moduleId == 9:
        rawParsedState.resume.moduleId = 10
    else if rawParsedState.resume and rawParsedState.resume.moduleId == 10:
        rawParsedState.resume.moduleId = 9
    # else: 0-8, 11, or absent — unchanged

    # Step 7: preserve malformed evidence through a quarantine mechanism
    # that survives sanitization — N/A on this branch (only the malformed
    # branch above writes quarantine data); listed here only to keep the
    # step numbering aligned with the governing instruction's 12-step list.

    # Step 8: update the migration/version marker
    rawParsedState.schemaVersion = 3

    # Step 9: allow normal sanitization to proceed — do nothing further
    # here; return control to the existing load() pipeline, which calls
    # sanitizeState(rawParsedState) immediately next.

    return  # control returns to the existing load() pipeline


# Step 10: recompute derived completion/checkpoint/unlock state.
# NOT done explicitly by this function — sanitizeState()/_syncDerivedState()
# unconditionally perform this recomputation immediately after this function
# returns, as part of the existing, unmodified load() pipeline. This
# function must run BEFORE sanitizeState()/_syncDerivedState(), not
# duplicate their work.

# Step 11: persist through the existing approved persistence path
# — no new persistence code for the progress/pointer swap. The existing
# load() → ...→ save() sequence (headspa-state.js:501–514) already writes
# the migrated, derived-state result back to localStorage via the
# unmodified save() path, which in turn triggers the unmodified
# aimt-progress-sync.js push-on-save behavior for authenticated students.
# No separate remote-write step is introduced by this migration. (The
# quarantine key from step 2's malformed branch is written directly via
# its own localStorage.setItem call, independent of this path — see §6.1.)

# Step 12: verify idempotency on subsequent load
# — covered by §5.3: schemaVersion >= 3 short-circuits to a no-op on
# every subsequent call, by construction. The quarantine key, once
# written, is never re-written on a subsequent load either, since the
# malformed-state branch is only reachable when schemaVersion < 3.
```

**Where this runs in the existing pipeline:** immediately before `sanitizeState(parsed)` is called inside `load()` (`headspa-state.js:501–514`), operating on the raw parsed object, not the already-sanitized one — because `sanitizeState()` today unconditionally overwrites `schemaVersion` and reconstructs `progress`/the entire top-level shape field-by-field (§2.3, §2.8, §3), so migration must happen on the raw shape first, then flow into the existing, unmodified sanitize → `_migrate()` → `_syncDerivedState()` sequence, which already does the recomputation this plan deliberately does not duplicate.

---

## 8. Required test matrix

Deterministic fixtures the later implementation must pass before this migration is considered validated. Each fixture is a raw `localStorage[levo_app]` JSON blob (or, for the remote cases, a `course_progress.state` row) fed into the migration function directly, not exercised through the UI — consistent with this task's read-only, no-browser-QA scope.

| # | Fixture | Pre-migration state | Expected post-migration state |
|---|---|---|---|
| 1 | Fresh student | No `progress` data at all (new account, or `localStorage` empty) | New slot 9 (Pricing) unlocked-per-normal-rule and incomplete; new slot 10 (Sanitation) locked until new slot 9 completes; `schemaVersion = 3`. |
| 2 | Old Sanitation completed only | Old slot 9 (`m9cp1`/`m9cp2`) both passed, `complete: true`; old slot 10 (`m10cp1`/`m10cp2`) empty | New slot 10 (Sanitation) retains both passed checkpoints and recomputes `complete: true`; new slot 9 (Pricing) has empty `checkpointMeta` and recomputes `complete: false` — **does not** inherit the old `complete: true` merely because it was previously true under slot 9's number. |
| 3 | Old Pricing completed only | Old slot 9 empty; old slot 10 both checkpoints passed, `complete: true` | New slot 9 (Pricing) retains both passed checkpoints, recomputes `complete: true`; new slot 10 (Sanitation) empty, recomputes `complete: false`. |
| 4 | Both completed | Both old slots fully passed/complete | Both new slots fully passed/complete under their swapped keys — competency preserved for both, attributed to the correct subject. |
| 5 | Neither completed | Both old slots empty or partially attempted-but-not-passed | Both new slots reflect the same (swapped) partial state; neither is falsely marked complete. |
| 6 | Partial Sanitation checkpoint state | Old slot 9: `m9cp1` passed, `m9cp2` never attempted | New slot 10: `m9cp1` passed, `m9cp2` never attempted — state follows Sanitation into slot 10 exactly, not recomputed or guessed. |
| 7 | Partial Pricing checkpoint state | Old slot 10: `m10cp1` passed, `m10cp2` in `retry` status with feedback/attempts recorded | New slot 9: `m10cp1` passed, `m10cp2` still `retry` with its exact feedback/attempts/answer text intact — state follows Pricing into slot 9 exactly. |
| 8 | Mixed pass/fail metadata | Old slot 9: `m9cp1` passed (attempts: 2, with feedback text and a specific `updatedAt`); old slot 10: `m10cp2` `retry` (attempts: 1) | Every field of every `checkpointMeta` entry (`status`, `feedback`, `answer`, `attempts`, `updatedAt`) is byte-identical after the swap, just filed under the new slot key — no field is dropped, defaulted, or recomputed. |
| 9 | Already-migrated state | `schemaVersion: 3`, `progress["9"]` already holds Pricing-shaped data | Migration is a hard no-op — state is returned unchanged (aside from the normal, pre-existing sanitize/derive pass every load already performs regardless of this migration). Running the fixture through the migration function twice in a row produces identical output both times. |
| 10 | Malformed/unexpected state — **corrected fixture, full-cycle required** | `progress["9"]` is a string, an array, or otherwise not the expected object shape | No swap is attempted; both slots 9 and 10 are replaced with safe empty defaults; `schemaVersion` is stamped to `3` (see note below). **This fixture must be run through the full planned cycle — migration → `sanitizeState()` → `_migrate()` → `_syncDerivedState()` → `save()` → a subsequent fresh `load()` — not merely the migration function in isolation**, specifically to prove the corrected quarantine mechanism (§6.1) actually survives: (a) `localStorage['aimt_module9_reorder_quarantine']` exists and contains the original malformed `slot9`/`slot10` values verbatim after the full cycle completes; (b) `this.data` (the in-memory sanitized state) contains no trace of the malformed data and no `_migrationQuarantine`-style property anywhere; (c) `getOverallPct()`/`isModuleComplete()`/`canAccessModule()` behave identically to a fresh student for slots 9 and 10 — no completion or unlock is falsely granted anywhere; (d) reloading a second time (simulating a new page load) leaves the quarantine key untouched and does not re-trigger the malformed-state branch (since `schemaVersion >= 3` now short-circuits first). |
| 11 | Review Mode | Review Mode active (`window.ReviewMode.isActive() === true`) | No persisted write occurs at all — confirmed by `save()`'s existing Review-Mode guard (§2.5) and `AIMT_SYNC.init()`'s existing Review-Mode guard. If the migration function is invoked at all in this context (e.g., because Review Mode still calls `load()` to read state for inspection), any resulting change stays in memory only and is never written to `localStorage` or Supabase. |
| 12 | Remote pull triggers migration | A student's remote `course_progress.state` row is still pre-reorder-shaped (`schemaVersion < 3` or absent) and wins the merge (`pullAndMerge()` decides `remoteWins: true`) | Because `applyRemoteState()` writes the remote blob into `localStorage` and then calls the same `APP_STATE.load()` (§2.2), the migration runs identically to a local pre-reorder blob — no separate remote-path test logic is required, but this fixture exists to confirm the assumption is actually exercised, not merely asserted. |
| 13 | Regression — Modules 0–8 | Any fixture from #1–#9 also carries populated `progress["0"]` through `progress["8"]` data | Every field of every module-0-through-8 progress object is confirmed byte-identical before and after the migration runs — the swap logic must only ever touch keys `"9"` and `"10"` (and the `notableAnswers`/pointer corrections in §3.1/§3.2), never iterate or mutate any other slot. |
| 14 | Resume pointer — old Sanitation — **new fixture, added during review** | `resume.moduleId = 9`, `guide.currentModule = 9` (student was last viewing old slot 9, Sanitation) | Both fields read `10` after migration — the student resumes into new slot 10, which now holds Sanitation, the actual subject they were last viewing. Never resumes into new slot 9 (Pricing) merely because the raw number was `9`. |
| 15 | Resume pointer — old Pricing — **new fixture, added during review** | `resume.moduleId = 10`, `guide.currentModule = 10` (student was last viewing old slot 10, Pricing) | Both fields read `9` after migration — the student resumes into new slot 9, which now holds Pricing, the actual subject they were last viewing. |
| 16 | Other resume pointer, unaffected — **new fixture, added during review** | `resume.moduleId = 8`, `guide.currentModule = 8` (student was last viewing Module 8) | Both fields remain `8` after migration — confirms the remap rule applies **only** to values `9`/`10`, not to every field named `moduleId`/`currentModule` regardless of value. A second variant of this fixture with `moduleId = 11` (Course Completion) must also remain `11` unchanged. |
| 17 | Ruled-out numeric fields, unaffected — **new fixture, added during review** | A checkpoint `checkpointMeta` entry with `attempts: 9`; `resume.scrollY: 10` — both fields deliberately set to values that coincidentally equal 9 or 10 but are not module pointers | Neither field is touched by the pointer-remap logic — `attempts` remains `9` and `scrollY` remains `10` exactly as they were, confirming the remap is scoped to the two named fields (§3.2) and not a blind search-and-replace of the numbers 9/10 anywhere in the state tree. |

**Note on fixture 10's `schemaVersion` stamping:** stamping `schemaVersion = 3` even in the malformed-state fallback path is a deliberate idempotency choice — it prevents the migration from re-attempting (and potentially re-quarantining, or worse, behaving inconsistently on repeated retries) the same malformed data on every subsequent load. The quarantined data, once written to its own `localStorage` key (§6.1), remains available for manual recovery regardless of the version stamp; the stamp only controls whether the *automatic* swap logic runs again.

---

## 9. Pre-implementation state-backup strategy

**Assessment: no separate, durable backup mechanism is warranted beyond what §6.1's corrected quarantine key already provides, for the following reasons, verified against the actual architecture rather than assumed:**

- **Remote persistence is already versioned by write, not merely overwritten blindly.** Supabase's `course_progress` table stores `updated_at` per row (read in `pullAndMerge()`, `aimt-progress-sync.js:77`) — Supabase's own point-in-time recovery / backup posture (a platform-level concern, not something this migration needs to duplicate) already provides a recovery path for the remote copy independent of this migration.
- **The migration is designed to be non-destructive by construction for every well-formed input** (fixtures 1–9, §8) — it relocates data, it does not delete it, for any case where the data is recognizable. The only case where original data could be *lost* to a casual reader is the malformed-state fallback (fixture 10), and §6.1 (corrected during this review) now specifies preserving that data under its own dedicated `localStorage` key, `aimt_module9_reorder_quarantine`, rather than discarding it — this **is** the backup mechanism for the one case that actually needs one, and unlike the originally proposed design, it is verified to actually survive the sanitize pipeline (§2.8).
- **A permanent, durable, separate backup table or key would create unnecessary duplicate user data** for the overwhelming majority of students (every well-formed case), which the governing instruction explicitly warns against. The one key this plan does add (`aimt_module9_reorder_quarantine`) is written only for the rare malformed-state case, not for every student — it does not duplicate well-formed progress data.

**Recommendation:** no new durable backup infrastructure beyond the one narrowly-scoped, rarely-written quarantine key already specified in §6.1. This is sufficient, minimal, and consistent with the existing architecture's own non-destructive sanitize/derive pattern and its existing `LEGACY_PROFILE_KEY` precedent for adjacent-key data.

---

## 10. Course-completion / total-module implications — safe boundary

**Can the 9↔10 migration be completed safely, independently, right now, without touching Module 11/12 architecture?** **Yes.** Verified directly:

- `TOTAL_MODULES` (`headspa-mastery.html:6988`) and `MODULE_COUNT` (`headspa-state.js:5`) are both currently `12` (technical `0`–`11`). Neither this migration nor the reorder it enables changes this number — slots 9, 10, and 11 all continue to exist exactly as they do today; only slots 9 and 10's *content and checkpoint requirements* swap. Slot 11 (Course Completion & Certification) is untouched by this migration (§ "Structural swap plan" below) and its own numeric identity does not change.
- `getOverallPct()` (`headspa-state.js:895–896`) computes `getCompletedCount() / MODULE_COUNT` — a pure count-based percentage with no awareness of which subject occupies which slot. It is unaffected by the swap's content relocation as long as the swap itself does not spuriously change how many modules are complete (which §5–§7 establish it does not).
- Certificate-issuance logic and technical Module 11's own content are explicitly out of scope for this migration and for `module-09.md`'s implementation (per its "Structural reindex boundary" section) — confirmed not to require any change as a *consequence* of the 9↔10 swap, since slot 11 is never touched by the swap operation itself.

**What must be deferred to the later AI/Final-Exam/completion architecture phase, not solved here:**

- Actually building a technical Module 11 (AI / Modern Practice Tools) — does not exist yet; out of scope for this plan and for `module-09.md`'s implementation.
- Actually building a technical Module 12 (Final Exam) — does not exist yet; `MODULE_COUNT`/`TOTAL_MODULES` would need to grow from 12 to 13 at that point, a separate, later, and materially different migration question (new slot creation, not a content swap between two existing slots) not addressed by this document.
- The eventual Sanitation-slot (new slot 10) completion-card handoff naming "Module 11 — AI / Modern Practice Tools" (per `module-09.md`'s corrected acceptance criterion 22) is a **content/copy change**, not a state-migration concern — it does not require this migration to do anything with slot 11's data, only for the implementation task to write different completion-card text into slot 10's (relocated Sanitation) markup. No live route may be built into slot 11 as part of this.

---

## 11. Structural swap plan (documented for the later implementation task — not applied here)

The following structural changes are expected **after** this migration plan clears external review (§ "Required sequence," step 3), during implementation (step 4). Documented for completeness and continuity; **none of this is performed by this task.**

- Pricing/Closing content (`module10Wrap`'s current markup) relocates to become the student-facing slot 9 wrapper.
- Sanitation content (`module9Wrap`'s current markup) relocates intact to become the student-facing slot 10 wrapper.
- `MODULE_TITLES['9']`/`['10']` swap (`headspa-mastery.html:7028–7039`).
- `MODULE_CHECKPOINTS['9']`/`['10']` swap (`headspa-mastery.html:6990–7003`) — see §4.
- **`MODULE_MEMORY_TAGS[9]`/`[10]` swap and the `getCheckpointMemoryTags`/`getCheckpointMemorySummary` numeric-branch correction** (`headspa-state.js`) — see §2.7, a previously undocumented requirement surfaced by this task's investigation.
- Cadence config placement: `MODULE_GUIDE_SYSTEMS[9]`/`[10]` and `MODULE_QUICK_PROMPTS[9]`/`[10]` swap, carrying `module-09.md`'s approved Cadence content (business-decision/client-closing coach) into slot 9, and Sanitation's existing Cadence content into slot 10.
- Completion-card handoffs: Pricing's card (relocating to slot 9) hands off to Module 10 — Sanitation; Sanitation's card (relocating to slot 10) hands off to Module 11 — AI / Modern Practice Tools, named but not live-linked (§ "Course-completion / total-module implications," §10; `module-09.md` acceptance criterion 22).
- Routing/unlock effects: no code change needed beyond the two data-map swaps above — `canAccessModule()`/`wouldBeLockedWithoutReview()` already derive purely from `isModuleComplete(id - 1)` (§2.4), which self-corrects once `MODULE_CHECKPOINTS` and the migrated `checkpointMeta` agree.
- Wrapper/module-identity consequence, disclosed explicitly (already flagged in `module-09.md`): slot 9's markup will contain `m10cp1`/`m10cp2`-prefixed element IDs, and slot 10's markup will contain `m9cp1`/`m9cp2`-prefixed element IDs — an intentional, documented mismatch between wrapper number and checkpoint-ID prefix, not a bug for a future maintainer to "fix."

**Explicitly not performed by the implementation task per this plan's boundary, and not performed by this task either:** rewriting Sanitation's own curriculum content; building any Module 11 (AI) curriculum or live route.

---

## 12. Alternatives considered

**Option A — Direct 9↔10 content/state migration (this plan's recommendation).** Physically swap the two slots' content and persisted progress objects, gated by a version marker. Pros: uses only architecture that already exists (`SCHEMA_VERSION`, the existing `load()` pipeline, the existing derive-on-every-cycle behavior for `complete`/`unlocked`); the riskiest-looking part of the problem (correctly recomputing completion/unlock state) is not actually new work, because the existing engine already does it unconditionally on every load. Cons: does create the disclosed wrapper/checkpoint-ID-prefix mismatch (§11), and touches a few more numeric-keyed structures than initially scoped (`MODULE_MEMORY_TAGS`, `getCheckpointMemoryTags`, §2.7) — though these are implementation-task concerns, not migration-plan blockers.

**Option B — An existing display-order abstraction, decoupled from technical slot number.** Investigated directly: **no such abstraction exists anywhere in the current codebase.** `MODULE_TITLES`, `MODULE_CHECKPOINTS`, `MODULE_MEMORY_TAGS`, `progress[String(id)]`, and the entire unlock chain (`mod.unlocked = i === 0 || isModuleComplete(i - 1)`) are all keyed directly and exclusively by the same numeric technical slot, with no intermediate "display position" concept found anywhere in `headspa-mastery.html` or `assets/js/headspa-state.js`. This option does not exist to choose; it is ruled out by direct evidence, not by assumption.

**Option C — Introduce a new display-order abstraction now.** Would require adding a new layer of indirection (e.g., a `DISPLAY_ORDER` array mapping position → technical slot, threaded through every place that currently assumes `moduleId` order equals display order: home-dashboard rendering, `getNextIncompleteModule()`, `getResumeModuleId()`, `canAccessModule()`'s sequential-unlock logic, and more) across a materially larger surface than Option A touches. This is a legitimate long-term architectural improvement in the abstract, but it is a large, generalized refactor undertaken to solve a problem that currently has exactly one instance (swapping two adjacent slots once) — disproportionate to the immediate need, and explicitly the kind of "large generalized refactor merely because numeric coupling is imperfect" the governing instruction says not to default to.

**Recommendation: Option A.** It is the safest minimal route to the correct course order, uses only mechanisms the architecture already has (a version field, a self-correcting derive-on-load cycle, a single shared load path for both local and remote persistence), and does not invent new abstractions to solve a problem repository evidence shows is currently narrow in scope. Option C remains available as a future, separately-scoped architectural decision if the course later needs to reorder modules more than this one time.

---

## 13. Summary of safety properties

- **Idempotent:** yes — gated by `schemaVersion >= 3`, verified by fixture 9 (§8) running the function twice with identical output both times; the quarantine key (§6.1) is also written at most once, since its only write path is unreachable once `schemaVersion >= 3`.
- **Fail-closed:** yes — malformed input never produces a false completion or a false unlock (§6); the worst case is a safely-empty slot with its original data quarantined, not deleted.
- **Quarantine data actually survives the pipeline — corrected in this review pass.** The original design (a `_migrationQuarantine` property on the state object) did not survive `sanitizeState()`'s fixed five-key reconstruction (§2.8) and has been replaced with a separate `localStorage` key (`aimt_module9_reorder_quarantine`, §6.1), verified by construction to sit entirely outside the sanitize pipeline and therefore to actually persist — proven end-to-end by fixture 10's corrected full-cycle test (§8).
- **Checkpoint-identity preserving:** yes — no checkpoint ID is renamed; `checkpointMeta` travels keyed by its own ID, cross-referenced against the (separately updated) `MODULE_CHECKPOINTS` map (§4).
- **Partial-progress preserving:** yes — every field of every `checkpointMeta` entry, in any status (`passed`, `retry`, or unset), travels intact with its whole progress object (§3, fixtures 6–8 in §8).
- **Navigation/content-identity pointers preserving — corrected in this review pass.** `guide.currentModule` and `resume.moduleId` (§3.2, previously omitted) now remap `9 → 10` and `10 → 9` explicitly, so a returning student resumes into the module actually holding the competency they were last engaged with, not into whichever content now occupies the raw number they were last pointing at. The remap is scoped to exactly these two fields plus the already-specified `notableAnswers[].moduleId` — never a blind swap of every number equal to 9 or 10 (fixtures 14–17, §8, including an explicit ruled-out-fields fixture).
- **Modules 0–8 preserving:** yes — the swap operation is scoped exclusively to keys `"9"` and `"10"` (plus the narrowly-targeted pointer corrections in §3.1/§3.2); every other module's data is never read or written by this migration (§8, fixture 13).
- **Single shared code path for local and remote:** yes — both storage layers materialize through the same `load()` pipeline (§2.2), so this migration requires no separate remote-specific logic.

---

## 14. What this plan does not do

This plan does not implement the migration, does not edit `headspa-mastery.html`, does not edit `assets/js/headspa-state.js`, does not reorder production modules, does not modify any live progress data, does not rewrite Sanitation's curriculum, and does not begin Module 10's own external audit or any Module 11 curriculum work. It is a design document awaiting external review and explicit approval, per `module-09.md`'s "Critical technical requirement" → "Required sequence," step 3.
