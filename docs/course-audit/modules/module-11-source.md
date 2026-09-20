# Module 11 — AI / Modern Practice Tools — Source Extraction (Pre-Audit)

**Status:** Neutral pre-audit extraction. **Not** an external audit, not a
rewrite, not an implementation specification, not a polish pass. Per the
master instructions' module lifecycle, this is step 2 (source extraction).

**Do not treat this file as final content authority.** Per the source
hierarchy in `00-aimt-course-audit-master-instructions.md`, a
`module-XX-source.md` file is never implementation authority — it exists to
locate existing content and technical wiring for the external audit that
comes next. For Module 11, the owner's direction (recorded in full in
`module-11.md`) already functions as that external audit — this file's job
is only to document what actually exists in the repository before that
direction is implemented.

**Current technical position:** technical module `11`, student-facing
**Module 11**, freshly opened by the Module 11 → 12 structural relocation
(see `implementation-log.md` and `assets/js/headspa-state.js`'s
`migrateModule11To12IfNeeded()`). Before that relocation, technical slot
`11` held **Course Completion & Certification**, which has now moved intact
to technical slot `12`. Slot 11 has never held instructional content in
this repository's history.

---

## 1. Was there ever a pre-existing "AI in practice" curriculum?

**No.** A repository-wide search (`grep` across `headspa-mastery.html` and
every file under `assets/js/`, plus `git log --all` for any
`module-11*`/"AI module"/"AI / Modern Practice" history) found:

- No wrapper, section, checkpoint, or Cadence configuration teaching AI
  tools, scalp-scanner/imaging-analysis literacy, prompting, or related
  content anywhere in the codebase, past or present.
- No checkpoint IDs `m11cp1` or `m11cp2` anywhere in the repository before
  this task.
- No `docs/course-audit/modules/module-11.md` or `module-11-source.md`
  before this task.
- No git commit, on any branch, referencing a "Module 11" AI/modern-practice
  curriculum.

Every reference to "AI / Modern Practice Tools" that does exist is a
**forward-looking placeholder**, naming the module without building it:

- `MODULE_TITLES` (pre-relocation) never included an AI entry — Module 10's
  own completion card was the only place the phrase appeared.
- `headspa-mastery.html`, Module 10's completion card (`m10Complete`, inside
  `module10Wrap`) read: *"Up next — Module 11 (locked) / AI / Modern
  Practice Tools. This module is not yet available — it will unlock once it
  has been built."* This is the single piece of "legacy" content this
  extraction recovers — an honest placeholder, not curriculum. It will need
  updating once Module 11 has real content (see §5).
- `docs/course-audit/00-aimt-course-audit-master-instructions.md` and
  `00-global-decisions.md` both name "Module 11 — AI / Modern Practice
  Tools" only as the locked future module order, not as drafted content.

**Conclusion:** there is nothing to recover from prior implementation. The
"scalp-scanner material," "client/privacy material," "business-use
material," and "old scope framing" named in this task's own instructions do
not exist as prior AIMT content — they describe the *subject matter* the
new module should cover, not material to extract. Module 11 is being
authored fresh, directly from the owner's approved direction recorded in
`module-11.md`.

---

## 2. What the Module 11 → 12 relocation already seeded

The structural-relocation task (immediately prior to this extraction, same
overall task) added draft scaffolding for slot 11 so the technical slots
would be internally consistent while the real curriculum is written. These
are **seeds to be overwritten by the approved `module-11.md` spec**, not
extracted legacy authority:

| Element | Current seed value | Location |
|---|---|---|
| `MODULE_TITLES['11']` | `'Module 11 — AI / Modern Practice Tools'` | `headspa-mastery.html` |
| `MODULE_CHECKPOINTS['11']` | `['m11cp1', 'm11cp2']` | `headspa-mastery.html` |
| `MODULE_GUIDE_SYSTEMS[11]` | Draft Cadence system prompt — AI-literacy/modern-practice coach role, "do NOT" list matching this task's Cadence requirements | `headspa-mastery.html` |
| `MODULE_QUICK_PROMPTS[11]` | The three approved quick prompts, verbatim | `headspa-mastery.html` |
| module-open greeting (`greetings[11]`) | One-line draft greeting | `headspa-mastery.html` |
| `MODULE_MEMORY_TAGS[11]` | `['ai-literacy', 'verification-judgment', 'client-guidance', 'privacy-judgment']` | `assets/js/headspa-state.js` |
| `module11Wrap` | **Does not exist yet.** `STATIC_MODULES[11]` in `renderModule()` points at it, but with no matching DOM element the router falls through to the existing generic "Coming soon" placeholder. | `headspa-mastery.html` |

None of these have been exercised against real curriculum yet — the guide
system prompt in particular should be reviewed against the final section
structure once §11.1–§11.8 exist, since a system prompt written before the
lesson content can drift from what the lesson actually teaches.

---

## 3. Technical wiring now in place for Module 11

- `MODULE_COUNT` (`assets/js/headspa-state.js`) and `TOTAL_MODULES`
  (`headspa-mastery.html`) are both `13` — technical slots `0`–`12`.
- `canAccessModule(11)` follows the same sequential-unlock rule as every
  other module: unlocked once `isModuleComplete(10)` is true.
- `isModuleComplete(11)` will be checkpoint-gated once `m11cp1`/`m11cp2`
  exist in the DOM and are wired to `submitCheckpoint()`, exactly like every
  other numbered module (`MODULE_CHECKPOINTS['11'].length` is already
  non-zero, so `_syncDerivedState()` already treats slot 11 as
  checkpoint-gated rather than manually completed).
- Completing Module 11 will unlock Module 12 (`canAccessModule(12)` depends
  on `isModuleComplete(11)`).
- `showCertificate()` and `functions/api/issue-certificate.js` both now
  require modules `0`–`11` complete before certificate issuance — Module 11
  is a real prerequisite for certification, not an optional add-on.

---

## 4. What still needs to be built (this extraction's honest gap list)

- `module11Wrap` markup: opening section, 11.1–11.8, the ungraded B.R.I.E.F.
  interaction, `m11cp1`/`m11cp2` checkpoint UI, and a completion card
  (`m11Complete`, following the `m<N>Complete` convention every other
  module uses).
- `M11` (or equivalent) checkpoint question/rubric object, following the
  per-checkpoint `M<N>.systems.m<N>cp1`/`m<N>cp2` pattern established in
  Modules 3–5 and 9–10 (a single shared rubric is the older, superseded
  pattern).
- `submitM11CP`/`m11cpKey` submit functions, following the
  `submitM9CP`/`submitM10CP` precedent.
- Module 10's completion-card "Up next — Module 11 (locked)" text (§1 above)
  needs to change once Module 11 is real — it currently reads "not yet
  available," which becomes false the moment implementation lands.
- The `MODULE_GUIDE_SYSTEMS[11]` draft seed (§2) should be reviewed once the
  final section order and interaction are implemented, in case any detail
  drifts from the shipped lesson.

---

## 5. Recommendation

Proceed directly to `module-11.md` using the owner's full approved
direction (already provided in this task's instructions, functioning as the
external audit this module has not otherwise had) as implementation
authority — there is no conflicting legacy content to reconcile, only
placeholder scaffolding to complete.
