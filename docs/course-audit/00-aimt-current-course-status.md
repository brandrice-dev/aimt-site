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
- Latest controlling commit: (pending) — "Add approved Module 6 audit specification" (see `git log` for the hash once committed)
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
| Module 6 | Externally audited — approved specification added; awaiting implementation |
| Modules 7–11 | Pending |
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

**Module 6 external audit (lifecycle step 3 of the per-module cycle) — August 8, 2026.** Replaced the empty scaffold in `docs/course-audit/modules/module-06.md` with the completed, approved audit specification, using `module-06-source.md` as the authoritative record of the current student experience and `module-05.md` as a structural/quality precedent only (not a source of curriculum content). Status set to **Approved for controlled implementation**. Approved title: **Conditions & Disorders** (resolved the "Common Conditions & Disorders" hero-eyebrow drift by dropping "Common" everywhere).

**External evidence used:** AAD's seborrheic dermatitis overview; Borda & Wikramanayake's "Seborrheic Dermatitis and Dandruff: A Comprehensive Review" (PMC4852869); DermNet NZ; Cunliffe et al. 1970 (*Br J Dermatol*) on local skin temperature and sebum excretion rate; and current OTC/prescription concentration data for ketoconazole shampoo (1% OTC, 2% prescription). Full citations and how each shaped a decision are recorded in `module-06.md`'s "Research and evidence sources" section.

**Major decisions:** the core dry-scalp-vs-dandruff distinction and the dandruff-to-seborrheic-dermatitis "spectrum" framing are both scientifically supported and were **kept**, with their stated mechanisms softened from single-cause certainty to the multifactorial framing the evidence actually supports. Diet and stress trigger claims were softened to match their actual (weaker, more individual) evidence strength. A new Section 6.2 ("What you can and cannot conclude from appearance alone") and a new standalone, always-visible Section 6.6 ("When to pause or refer," with an approved referral script) were added — Module 6 previously had no referral section not gated behind a specific interaction state. A new signature ungraded interaction, "Sort three presentations" (proceed/modify/refer triage), was added. Both checkpoints were kept (they test genuinely different competencies) with question-parity fixed, per-checkpoint rubrics added, and checkpoint placement changed to a two-stage mid/end structure. The `scope-awareness` memory tag (declared but unreachable) was resolved by removal rather than by adding a redundant regex branch.

**Same-day re-audit, before the commit was pushed, corrected four items.** The "10% per 1.8°F" sebum/temperature claim was re-examined against its primary source's actual limitations — 9 subjects, forehead skin rather than scalp, surface sebum excretion rather than gland production, and the source authors' own alternative explanation for their result — and was **removed** from student-facing curriculum, not further hedged; no numeric replacement was substituted, only qualitative, actionable language. The ketoconazole evidence base was upgraded from commercial retail sources (GoodRx/Drugs.com) to primary DailyMed/FDA labeling, which also corrected an imprecise 2%-strength indication description, and Section 6.7 now carries an explicit "a product-category recommendation is not a diagnosis and not a prescription" scope statement. The visual asset plan was re-opened and now resolves each of the four existing placeholder slots explicitly: two are replaced with a **required** non-diagnostic comparative illustration in Section 6.3; two are **removed** from Section 6.5 with no replacement required (an optional future gradient diagram is noted but not required). Interaction density was re-checked against the governing learning-rhythm standard: the cycle-step selector and trigger accordion were found to be revealing information rather than requiring judgment and were simplified to static content (all curriculum content preserved, only the click-to-reveal mechanic removed); the comparison toggle and spectrum slider were confirmed to have distinct instructional jobs and were kept as interactions. Module 6's final ungraded-interaction count is three, down from the initial pass's five.

**Module 6 is now externally audited and has an approved specification. It is NOT implemented, NOT manually QA'd, and NOT approved for release.** No production file (`headspa-mastery.html`, `assets/js/headspa-state.js`, `assets/js/aimt-progress-sync.js`) was modified by this task.

### Prior task (unchanged, recorded for continuity)

**Module 6 source extraction for external audit (lifecycle step 10) — August 8, 2026.** Created `docs/course-audit/modules/module-06-source.md` — a complete, neutral, verbatim extraction of the current Module 6 ("Conditions & Disorders") student experience: module identity, full curriculum in student encounter order, all four ungraded interactions (dry-vs-dandruff comparison toggle, wrong-product cycle selector, Malassezia spectrum slider, trigger accordion), both checkpoints (`m6cp1`, `m6cp2`) with displayed and evaluated question strings captured independently, Cadence configuration (checkpoint rubric, guide system, quick prompts, greeting, memory tags), completion/Module 7 gating behavior, asset inventory (zero real assets — all placeholder graphics, matching Module 5's current state), a claims/technical-content inventory, an accessibility/responsive inventory, Listen Mode and Guided Completion Path notes, a full source map, and a confirmed-findings/assumptions list — and the (now superseded) empty `module-06.md` scaffold. This was documentation and extraction only — no production file was modified, no correction was made, and no audit judgment was rendered.

**Content grounding:** every fact recorded was sourced directly from `headspa-mastery.html` and `assets/js/headspa-state.js` at commit `b10a939921d17d1117ec835af1c45bc76f4a09cb`, cross-checked against the `module-05-source.md` and `module-04-source.md` extraction precedents for structure and depth. No content was inferred from another module.

### Prior task (unchanged, recorded for continuity)

**Module 5 video-source creation (lifecycle step 9) — August 8, 2026.** Created `docs/course-video-sources/module-05-video-source.md`, the approved primary authority for a future, separately scoped video-production task. Status recorded: `Approved for video production`. See Step 36 in `implementation-log.md` for full detail; unchanged by this task.

### Downloadable decision (unchanged)

`AIMT Regional Service Adaptation Guide` (Module 5) — recommended; production deferred. Not created, not linked. Module 6's own downloadable-resource opportunity has not yet been evaluated — that decision belongs to the Module 6 external audit, not this extraction. The emerging centralized dashboard Resources Library direction remains a future architecture note only; not built.

---

## Current gate

Module 6 implementation.

Per the governing module lifecycle (`00-aimt-course-audit-master-instructions.md`: source extraction → external audit → approved specification → implementation → static/mocked validation → manual QA → manual approval → video-source creation → next module begins), Module 6 has now cleared source extraction (step 10) and external audit / approved specification (steps 3–4 of the per-module lifecycle). `module-06.md` is the implementation authority. Module 6 implementation may begin as its own separate task.

---

## Exact next task

Implement the approved Module 6 specification (`docs/course-audit/modules/module-06.md`) in `headspa-mastery.html` (and `assets/js/headspa-state.js` only for the `MODULE_MEMORY_TAGS[6]` correction), then perform static and mocked validation — matching the implementation pattern already used for Modules 0–5. Module 6 is not manually approved and must not be treated as such until it clears manual QA per `00-aimt-manual-qa-master-checklist.md`.

---

## Do not begin

- Module 6 manual QA or manual approval (implementation and static/mocked validation must happen first)
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

- (pending) — Add approved Module 6 audit specification (**latest controlling commit** — created together with this file; see `git log` for the hash)
- `8f67c6af1d256a9085455f72d55eca722998c9f8` — Extract Module 6 for external audit
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
