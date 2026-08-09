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
- Latest controlling Module 5 implementation/polish commit: `27397ca7bbc7823c205cd1764ac7ba6205dafb5f` — "Finalize Module 5 \"What changes first?\" answer-reveal behavior"
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

**Module 5 manually approved — August 8, 2026.** The owner reviewed the updated `course-audit-build` branch preview and explicitly approved Module 5 (**Scalp Patterns & Service Adaptation**) after manual QA. Module 5 status changes from `Implemented — awaiting manual QA` to `Implemented — manual QA approved`. This is documentation-only; no course production code was modified by this task. The code and specification changes this approval covers were already committed separately (`27397ca7bbc7823c205cd1764ac7ba6205dafb5f`, "Finalize Module 5 \"What changes first?\" answer-reveal behavior") before this approval was recorded.

### Manual QA summary

**Environment/preview:** the updated `course-audit-build` preview was reviewed; the production site was not used as the branch QA environment; current Module 5 polish (recap removal, "Better move" cards, and the finalized interaction behavior) was visible in the preview; an earlier stale-preview concern was identified and resolved before QA continued.

**Passed:**
- Desktop visual review — hero and section hierarchy, approved section order, no old fixed scalp-type material, readable spacing and text width, no overlap or horizontal overflow, image sharpness and proportions, captions and labels, semantic presentation, completion-card layout.
- Module ending correction — standalone `5.10 — Recap` removed; Section 5.9 remains the final instructional summary; "Assessment becomes skill when it changes the service responsibly." preserved as completion-card supporting copy.
- Section 5.9 polish — all eight common-mistake cards carry an approved "Better move" statement built from already-approved Module 5 concepts; the existing summary card ("A strong protocol is explainable.") remained intact.
- Image review — paired crown/hairline regional comparison after Section 5.4 (correctly arranged on desktop), targeted crown-cleansing image after Section 5.5, gentle hairline-adaptation image after Section 5.7, regional client-conversation image inside Section 5.8; all images sharp, not stretched, illustrative and non-diagnostic; consultation-photo background material in the client-conversation image confirmed not represented as AIMT terminology, real documentation, or authenticated clinical evidence.
- "What changes first?" interaction — final approved behavior: an incorrect selection marks only the selected option "Not quite" and shows its own choice-specific explanatory feedback; the approved answer is never automatically revealed; retry is allowed; a correct selection receives the green "Correct answer" state with its explanation beginning "Correct."; feedback is text-based as well as semantically styled; the interaction remains ungraded, writes no progress, and does not gate completion. A similar pre-existing answer-reveal pattern was observed in earlier approved modules (Module 3's predict-then-reveal and Module 4's classification interaction) and was intentionally **not** changed in this Module 5 task — recorded below as a deferred regression item, not silently folded into scope.
- Completion/regression review — corrected completion-card presentation, no leftover Section 5.10, previously approved modules (0–4) open normally, global navigation functional, visible progress behavior normal, Review Mode intact, no unrelated visual regression.
- Mobile responsive review — completed at approximately 390px using browser device emulation: layout, stacking, text fit, imagery, and completion-card presentation all passed with no horizontal overflow or clipping. **This is browser device-emulation review, not physical-device QA.**

**Deferred — not completed by this approval:**
- live-model checkpoint grading QA;
- live Cadence response QA;
- screen-reader QA;
- physical-keyboard QA;
- real touch-device QA;
- medical/dermatological review;
- legal/state-specific scope review.

Review Mode in the current audit environment does not wire through to live Cadence grading, so live checkpoint response-quality testing was not performed during this module's manual pass. Static/mocked validation already covered checkpoint wiring, question identity, rubric implementation, state logic, completion logic, and Module 6 gating.

**Deferred regression item (not part of Module 5's scope):** Module 3's predict-then-reveal interaction and Module 4's "Say only what the image earned" classification interaction share the same pre-existing answer-reveal pattern that was corrected in Module 5 — both already-approved modules still unconditionally reveal/tag the correct answer regardless of which option is clicked. This was intentionally left unchanged during Module 5's task and remains open for a future, separately scoped task.

### Downloadable decision

`AIMT Regional Service Adaptation Guide` — recommended; production deferred. Not created, not linked. The emerging architectural direction — that approved student downloads may ultimately live in a centralized dashboard Resources Library rather than being duplicated across module pages — is preserved as a future direction only; the Resources Library was not built.

---

## Current gate

Module 5 video-source creation.

Per the governing module lifecycle (`00-aimt-course-audit-master-instructions.md`: source extraction → external audit → approved specification → implementation → static/mocked validation → manual QA → manual approval → video-source creation → next module begins), Module 5 has now cleared manual approval (step 8). `module-05-video-source.md` must be created (step 9) before Module 6 source extraction (step 10) may begin.

---

## Exact next task

Create `module-05-video-source.md` using the governing module-opening video workflow and the now-approved Module 5 specification. After that file is complete and documented, Module 6 source extraction may begin.

---

## Do not begin

- Module 6 extraction or audit (until Module 5 video-source creation is complete)
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

Current video-source files exist for Modules 0–3.

Module 5's own video-source file is now the current gate (see "Exact next task" above), not a side track.

Module 4 video-source creation remains available in parallel but is not the current audit gate.

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

- (pending) — Approve Module 5 manual QA (**latest controlling commit** — created together with this file; see `git log` for the hash)
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
