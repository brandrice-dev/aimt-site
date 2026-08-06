# AIMT Current Course Status

**Repository:** `aimt-site`
**Active branch:** `course-audit-build`
**Production branch:** `main`
**Last updated:** August 6, 2026

---

## Repository position

- Repository: `aimt-site`
- Active branch: `course-audit-build`
- Production branch: `main`
- Latest controlling commit: `a5879dc1dcb527a2b4ef1315d5dd73120410e41e` — "Implement Module 5 approved audit"
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
| Module 5 | Implemented — awaiting manual QA |
| Modules 6–11 | Pending |
| Module 12 | Planned — do not begin |

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

Module 5 implementation and static/mocked validation.

The approved specification in `docs/course-audit/modules/module-05.md` was implemented in `headspa-mastery.html`: the module title/subtitle/hero now read "Scalp Patterns & Service Adaptation"; the fixed five-scalp-type grid, the eight fake microscopy placeholders, and the dead "Tap each type" hint were removed; the approved section order (5.1–5.10) replaced the pre-audit curriculum, including the five service levers, the corrected priority order, the five service-direction pattern cards (A–E), the new ungraded "What changes first?" decision interaction, the regional preserve/modify/avoid/pause/refer builder, and the eight-item common-mistakes list; both checkpoints (`m5cp1`, `m5cp2`) now use checkpoint-specific rubrics with byte-identical displayed/evaluated questions and the approved network-error text; Cadence's identity, guide system, greeting, and quick prompts were corrected; accessibility labels/live-regions and the shared semantic-color tokens were added; and the confirmed-dead `window._m5cpsDone` assignment was removed. No production code outside `headspa-mastery.html` changed. Module 5 has not yet been manually approved.

### Module 5 implementation summary

- Module identity, curriculum, interaction, checkpoints, and Cadence config all implemented per `module-05.md`.
- Static validation: no old title/course-name/unsupported-claim remnants, JS syntax and HTML tag balance confirmed, no duplicate IDs introduced, `MODULE_CHECKPOINTS['5']` unchanged.
- Mocked browser validation (Course Review Mode, mocked `callAI`): interaction (all 4 scenarios, retry, reset, no progress write), checkpoint pass/fail/retry/network-error/Review-Mode-unsaved paths, module completion, and Module 6 unlock all verified; no horizontal overflow at mobile (375×812) or desktop widths.
- Deferred, consistent with every prior module: live-model grading, screen-reader QA, physical-keyboard QA, real touch-device QA, and a real visual scroll/screenshot pass below the hero (sandbox tooling limitation — see `implementation-log.md` Step 30 for detail).

---

## Current gate

Module 5 manual QA.

---

## Exact next task

Push the two Module 5 implementation commits, locate the `course-audit-build` preview, and complete Module 5 desktop and phone manual QA against `docs/course-audit/00-aimt-manual-qa-master-checklist.md` and `module-05.md`'s acceptance criteria. Do not mark Module 5 "Implemented — manual QA approved" until that manual pass is complete.

---

## Do not begin

- Module 6 extraction or audit
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

---

## Parallel side projects

The module-opening video workflow may continue for approved modules.

Current video-source files exist for Modules 0–3.

It must not interrupt or reorder Module 5 manual QA.

Module 4 video-source creation is not the current audit gate.

---

## Deferred review

Retained accurately, not resolved by this task:

- live-model grading QA;
- screen-reader QA;
- physical-keyboard QA;
- real touch-device QA;
- medical/dermatological review;
- legal and state-specific scope review;
- downloadable-resource production;
- authenticated clinical-image intake;
- Guided Completion and Listen Mode QA.

---

## Latest relevant commits

- `a5879dc1dcb527a2b4ef1315d5dd73120410e41e` — Implement Module 5 approved audit (**latest controlling commit**)
- `7ec2bf40ce7f8b508ab71f9762c1cdb2c1b933f5` — Add approved Module 5 audit specification
- `586e891` — Extract Module 5 for external audit
- `b4ee099` — Align semantic colors to Module 1 baseline
- `32665ea` — Polish Module 4 terminology and semantic colors
- `42d9aaa` — Implement Module 4 approved audit
- `4256b1e` — Add initial module video source pack

Update this section whenever a new controlling commit is approved.
