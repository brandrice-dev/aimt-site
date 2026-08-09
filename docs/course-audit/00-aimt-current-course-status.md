# AIMT Current Course Status

**Repository:** `aimt-site`
**Active branch:** `course-audit-build`
**Production branch:** `main`
**Last updated:** August 8, 2026

---

## Repository position

- Repository: `aimt-site`
- Active branch: `course-audit-build`
- Production branch: `main`
- Latest controlling commit: (pending) — "Extract Module 6 for external audit" (see `git log` for the hash once committed)
- Branch preview remains the audit environment.
- No merge or production deployment is authorized.

---

## Current source of truth

The audit build remains isolated from production.

`aimtrichology.com` may continue showing the current `main` version until the audit branch is intentionally reviewed, approved, and deployed.

Do not merge or deploy yet.

---

## Module status

| Module | Status |
|---|---|
| Welcome Module / technical Module 0 | Implemented — manual QA approved |
| Module 1 | Implemented — manual QA approved |
| Module 2 | Implemented — manual QA approved |
| Module 3 | Implemented — manual QA approved |
| Module 4 | Implemented — manual QA approved |
| Module 5 | Implemented — manual QA approved |
| Modules 6–11 | Pending |
| Module 12 | Planned — do not begin |

**Latest approved module: Module 5** — approved August 8, 2026.

---

## Module 4 approved semantic baseline

Established from Module 1's already-shipped correct/incorrect pair and applied across Modules 0–4, and reused by Module 5's implementation:

- Green (correct / accepted): `#3a5a3a`
- Green light: `#e8ede8`
- Red (incorrect / prohibited): `#7a3030`
- Red light: `#f0e8e8`

---

## Module 4 deferred QA

Manually approved, but the following still require later or manual review — not resolved by the completed manual pass:

- live-model grading QA;
- screen-reader QA;
- physical-keyboard QA;
- real touch-device QA;
- medical/dermatological review;
- privacy/legal review of the saved-image consent workflow;
- future replacement of the illustrative microscopy images with authenticated, consented, de-identified clinical captures.

---

## Task just completed

**Module 6 source extraction for external audit (lifecycle step 10) — August 8, 2026.** Created `docs/course-audit/modules/module-06-source.md` — a complete, neutral, verbatim extraction of the current Module 6 ("Conditions & Disorders") student experience: module identity, full curriculum in student encounter order, all four ungraded interactions (dry-vs-dandruff comparison toggle, wrong-product cycle selector, Malassezia spectrum slider, trigger accordion), both checkpoints (`m6cp1`, `m6cp2`) with displayed and evaluated question strings captured independently, Cadence configuration (checkpoint rubric, guide system, quick prompts, greeting, memory tags), completion/Module 7 gating behavior, asset inventory (zero real assets — all placeholder graphics, matching Module 5's current state), a claims/technical-content inventory, an accessibility/responsive inventory, Listen Mode and Guided Completion Path notes, a full source map, and a confirmed-findings/assumptions list — and `docs/course-audit/modules/module-06.md`, the empty external-audit scaffold (`Status: Awaiting external audit`, matching Module 5's full pre-audit heading set, every section reading `_Pending external audit._`), per the established per-module extraction-task convention. This is documentation and extraction only — no production file (`headspa-mastery.html`, `assets/js/headspa-state.js`, `assets/js/aimt-progress-sync.js`) was modified, no correction was made, and no audit judgment was rendered.

**Module 6 is NOT audited, NOT approved, and NOT implemented.** The extraction preserves current findings without correcting them, including: mismatched displayed/evaluated checkpoint questions (both `m6cp1` and `m6cp2`); a single shared `M6.system` rubric rather than per-checkpoint rubrics; no module-specific checkpoint network-error text; missing `aria-label`/`aria-live` on both checkpoints; three of Module 6's four interactions (`.vs-card`, `.cycle-step`, `.trigger-item`) using plain `<div onclick>` elements with zero keyboard/ARIA semantics; the old course name ("HeadSpa Mastery") and a personal-practitioner-experience claim still present in Cadence prompts; a missing "6.2" section number; a duplicated/inconsistent tap-interaction hint; an unverified sebum/temperature percentage claim duplicated verbatim from Module 5; and no standalone, always-visible referral/stop-service section (the module's only referral sentence is gated behind a specific spectrum-slider position). None of these were corrected — they are recorded for the external audit to evaluate.

**Content grounding:** every fact recorded was sourced directly from `headspa-mastery.html` and `assets/js/headspa-state.js` at commit `b10a939921d17d1117ec835af1c45bc76f4a09cb`, cross-checked against the `module-05-source.md` and `module-04-source.md` extraction precedents for structure and depth. No content was inferred from another module.

### Prior task (unchanged, recorded for continuity)

**Module 5 video-source creation (lifecycle step 9) — August 8, 2026.** Created `docs/course-video-sources/module-05-video-source.md`, the approved primary authority for a future, separately scoped video-production task. Status recorded: `Approved for video production`. See Step 36 in `implementation-log.md` for full detail; unchanged by this task.

### Downloadable decision (unchanged)

`AIMT Regional Service Adaptation Guide` (Module 5) — recommended; production deferred. Not created, not linked. Module 6's own downloadable-resource opportunity has not yet been evaluated — that decision belongs to the Module 6 external audit, not this extraction. The emerging centralized dashboard Resources Library direction remains a future architecture note only; not built.

---

## Current gate

Module 6 external audit.

Per the governing module lifecycle (`00-aimt-course-audit-master-instructions.md`: source extraction → external audit → approved specification → implementation → static/mocked validation → manual QA → manual approval → video-source creation → next module begins), Module 6 has now cleared source extraction (step 10). Module 6 external audit (step 11 of the overall workflow / step 3 of the lifecycle) may begin as its own separate task.

---

## Exact next task

Perform the external audit of Module 6 using `docs/course-audit/modules/module-06-source.md` and the governing audit standards (`00-aimt-course-audit-master-instructions.md`, `00-global-decisions.md`), then populate the existing empty `docs/course-audit/modules/module-06.md` scaffold with the approved specification only after that audit is complete. Module 6 implementation must not begin until the approved specification is populated.

---

## Do not begin

- Module 6 external audit, approved specification, or implementation (this task's output — the source extraction — is now complete; the audit itself is the next separate task, not yet started)
- Module 7 extraction or any Module 7 work
- Module 12
- completion and certificate audit
- certificate or grading trust hardening
- persistent Cadence threads
- production Cadence retry/recovery
- Guided Completion Path
- Listen Mode
- final styling
- homepage showcase
- Stripe or Supabase communication work
- monolith refactor
- merge to `main`
- production deployment
- downloadable production
- Resources Library implementation

---

## Parallel side projects

The module-opening video workflow may continue for approved modules.

Current video-source files exist for Modules 0, 1, 2, 3, and 5. `module-04-video-source.md` does not exist yet — creating it is available as a parallel side task but is not the current gate.

Module 5's actual video-production package (spoken script, 12-section package, storyboard, shot list, final assets) may proceed in a separate ChatGPT Project conversation, in parallel with the Module 6 audit — neither blocks the other. Module 6 has no video-source file yet; that step (lifecycle step 9) only becomes available after Module 6 clears manual QA approval (lifecycle step 8), which has not happened.

---

## Deferred review

Retained accurately, not resolved by this task:

- live-model grading QA;
- live Cadence response QA;
- screen-reader QA;
- physical-keyboard QA;
- real touch-device QA;
- medical/dermatological review;
- legal and state-specific scope review;
- downloadable-resource production;
- authenticated clinical-image intake;
- Guided Completion and Listen Mode QA;
- Module 3/Module 4 answer-reveal pattern (deferred regression item, see above).

The approved downloadable (`AIMT Regional Service Adaptation Guide`) remains recommended; production is still deferred and it was not created or linked by this task.

---

## Preview, push, merge, and deployment status

- Branch preview: `course-audit-build` remains the audit environment; the preview reflects all commits through this approval.
- Push status: local branch is ahead of `origin/course-audit-build` pending this task's commit — push after committing, or via GitHub Desktop if CLI credentials are unavailable.
- Merge status: no merge to `main` has occurred or is authorized.
- Deployment status: no production deployment has occurred or is authorized.

---

## Latest relevant commits

- (pending) — Extract Module 6 for external audit (**latest controlling commit** — created together with this file; see `git log` for the hash)
- `b10a939921d17d1117ec835af1c45bc76f4a09cb` — Add Module 5 video source
- `190677ebad61b957e494b208932f812ec89185a2` — Approve Module 5 manual QA
- `27397ca7bbc7823c205cd1764ac7ba6205dafb5f` — Finalize Module 5 "What changes first?" answer-reveal behavior
- `1c6c7289b7d9eeb13297fe8012dc11312ad58a65` — Record Module 5 mistake-guidance polish
- `ebe30a2e44a40b583da8a5b7d3a8ffc99c6706bc` — Strengthen Module 5 common-mistake guidance
- `92028e777e4e80050b8a6c0d26ec8f9d111db25c` — Record Module 5 recap polish
- `4428e511264966c2e8848603af69a7b953db9b50` — Remove Module 5 post-checkpoint recap
- `8a2ef4bdadd780ae7fba7849be0376a358a3c686` — Integrate Module 5 teaching images
- `b96fd3eff70d86d89d0ec1c8386a6049b124bead` — Add Module 5 visual asset plan
- `7f2b3fbb9d63d1a197b03dc7b58eeb9ec0ae322f` — Advance course status to Module 5 manual QA
- `a5879dc1dcb527a2b4ef1315d5dd73120410e41e` — Implement Module 5 approved audit
- `7ec2bf40ce7f8b508ab71f9762c1cdb2c1b933f5` — Add approved Module 5 audit specification

Update this section whenever a new controlling commit is approved.
