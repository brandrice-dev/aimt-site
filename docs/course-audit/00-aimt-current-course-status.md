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
- Latest controlling commit: `190677ebad61b957e494b208932f812ec89185a2` — "Approve Module 5 manual QA"
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

**Module 5 video-source creation (lifecycle step 9) — August 8, 2026.** Created `docs/course-video-sources/module-05-video-source.md` as the concise, self-contained primary authority for a future, separately scoped ChatGPT Project conversation that will produce Module 5's actual opening-video package. This step created only that approved source brief — not the spoken script, the 12-section video package, a storyboard, a shot list, or final video assets. This is documentation-only; no course production code or module specification file was modified.

**Status recorded: `Approved for video production`.** Module 5 is implemented, manual visual QA is complete (approved August 8, 2026), and course-interface footage may now be captured where useful — this does not mean live-model grading, live Cadence response, screen-reader, physical-keyboard, real touch-device, medical/dermatological, or legal/scope QA are complete; all remain deferred and are recorded as such in the new file.

**Content grounding:** every outcome, callout, insider-knowledge point, and prohibited claim in the new file was sourced from `docs/course-audit/modules/module-05.md` (approved content authority) and `docs/course-audit/modules/module-05-assets.md` (asset identity/status); the pre-audit `module-05-source.md` was not used as content authority. All eight text callouts were verified as exact-string matches against `module-05.md` before inclusion.

### Narrow video-documentation refresh

- **`00-aimt-course-map.md`:** was stale at "Modules 0–3" for approved titles/payoffs even though Modules 4 and 5 have since completed audit, implementation, and manual approval. Added both modules' approved hero lines and payoffs; renamed the "Awaiting audit" table to start at Module 6 (Modules 6–11 and Module 12 remain listed as pending with no content invented); updated the "what comes next" example to Module 5's own approved Module 6 handoff sentence.
- **`00-aimt-video-direction.md`:** the image-authenticity sections still described all ten Module 4 images as "Unverified — awaiting Module 4 audit," which is now factually wrong. Corrected using production truth (`headspa-mastery.html`) cross-referenced against `module-04.md`'s approved corrections, since the pre-audit `module-04-assets.md` intake file was itself never updated post-implementation (flagged as a documentation gap, not fixed — out of this task's scope). Module 4's five examination-area photos are now labeled **Existing asset — approved**; its five microscopy images are labeled **Existing asset — approved, illustrative/generated** (a new category, since they're approved for use but are generated-style illustrations, always captioned as such); Module 5's five teaching photographs (real stock photography, not generated) were added to **Existing asset — approved** with their own illustrative-only caveat. No brand/visual-identity rule was touched.
- **`module-04-video-source.md` does not exist in this repository** — only Modules 0–3 have video-source files, so there was no stale "Approved for video scripting" status to correct. Creating that file from scratch would be a separately scoped task and was not performed here.
- Modules 0–3's video-source files were inspected and not revised — no factual contradiction was found.

### Downloadable decision (unchanged)

`AIMT Regional Service Adaptation Guide` — recommended; production deferred. Not created, not linked. The emerging centralized dashboard Resources Library direction remains a future architecture note only; not built.

---

## Current gate

Module 6 source extraction for external audit.

Per the governing module lifecycle (`00-aimt-course-audit-master-instructions.md`: source extraction → external audit → approved specification → implementation → static/mocked validation → manual QA → manual approval → video-source creation → next module begins), Module 5 has now cleared video-source creation (step 9). Module 6 source extraction (step 10) may begin as its own separate task.

---

## Exact next task

Module 6 source extraction for external audit — a complete, neutral, verbatim extraction of the current Module 6 experience (curriculum, checkpoints and grading, Cadence configuration, assets, claims inventory) into `docs/course-audit/modules/module-06-source.md`, following the same extraction pattern already used for Modules 0–5. Module 6 is not yet audited or implemented.

---

## Do not begin

- Module 6 audit, approved specification, or implementation (extraction only is now permitted — see "Exact next task")
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

Module 5's video-source file is complete; Module 5's actual video-production package (spoken script, 12-section package, storyboard, shot list, final assets) may now proceed in a separate ChatGPT Project conversation, in parallel with Module 6 extraction — neither blocks the other.

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

- (pending) — Add Module 5 video source (**latest controlling commit** — created together with this file; see `git log` for the hash)
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
