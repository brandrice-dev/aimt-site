# AIMT Current Course Status

**Repository:** `aimt-site`
**Active branch:** `course-audit-build`
**Production branch:** `main`
**Last updated:** August 5, 2026

---

## Current source of truth

The audit build remains isolated from production.

`aimtrichology.com` may continue showing the current `main` version until the audit branch is intentionally reviewed, approved, and deployed.

Do not merge or deploy yet.

---

## Module status

| Module | Status |
|---|---|
| Welcome Module / technical Module 0 | Implemented and approved |
| Module 1 | Implemented and approved |
| Module 2 | Implemented and approved |
| Module 3 | Implemented and approved |
| Module 4 | Implemented and manually approved |
| Module 5 | Extracted — awaiting external audit |
| Modules 6–11 | Pending |
| Module 12 Final Exam | Planned; do not begin |

---

## Module 4 approved semantic baseline

Established from Module 1's already-shipped correct/incorrect pair and applied across Modules 0–4:

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

Module 5 source extraction.

`docs/course-audit/modules/module-05-source.md` was created: a complete, neutral, verbatim extraction of the current Module 5 experience (curriculum, checkpoints and their grading, Cadence guide system/quick prompts/greeting/memory tags, completion behavior, assets, claims inventory, adjacent-module relationships, accessibility inventory, source map, and confirmed findings separated from assumptions). `docs/course-audit/modules/module-05.md` was created as an empty external-audit scaffold only. Nothing in Module 5 was rewritten, approved, or implemented.

### Module 5 confirmed extraction findings

- Checkpoint IDs: `m5cp1`, `m5cp2`.
- Both checkpoints' displayed and evaluated questions currently mismatch (same defect class already corrected in Modules 1–4).
- Both checkpoints share one generic rubric (`M5.system`), not checkpoint-specific rubrics like Modules 1–4.
- Cadence's checkpoint prompt still uses the old course name ("HeadSpa Mastery").
- Cadence's guide system still claims personal practitioner experience ("a mentor built from nearly two decades in the head spa industry").
- The advertised "Tap each type to see the protocol" interaction is nonfunctional — no click handler exists on the scalp-type grid.
- No real media assets exist — every "photo" slot is a decorative placeholder graphic with no underlying image file.
- Unsupported physiological claims (e.g., "compensatory oil production," follicular congestion impairing hair growth) appear in the curriculum and rubric and require external audit — both are claims Module 4's own approved spec explicitly required removing for lacking support.
- Module 5 has not been rewritten, approved, or implemented.

---

## Current gate

Module 5 external audit.

Module 5 must not be implemented until an externally-reviewed, approved `module-05.md` specification exists. Module 6 must not begin.

---

## Exact next task

Externally audit `module-05-source.md` and create the approved `module-05.md` specification.

Once that specification is approved and added to the repository, Module 5 implementation may begin as its own separate task.

---

## Do not begin

- Module 5 implementation (until `module-05.md` is approved)
- Module 6 extraction or audit
- Module 12
- certificate hardening
- persistent Cadence
- Guided Completion
- Listen Mode
- final styling
- merge to `main`
- production deployment

---

## Parallel video-production track

The video workflow is allowed to run in parallel for approved modules.

Current video-source files exist for Modules 0–3.

The user and partner are beginning with Modules 0 and 1 to calibrate the production process.

Do not let video work interrupt the audit order. The video track must not be allowed to substitute for, delay, or reorder the Module 5 external-audit gate above.

Module 4 video-source creation waits until explicitly scheduled; it is not the current gate.

---

## Latest relevant commits

- `586e8919ddc71477e8401b6f300126e97caca728` — Extract Module 5 for external audit (**latest controlling commit**)
- `b4ee099` — Align semantic colors to Module 1 baseline
- `32665ea` — Polish Module 4 terminology and semantic colors
- `42d9aaa` — Implement Module 4 approved audit
- `4256b1e` — Add initial module video source pack

Update this section whenever a new controlling commit is approved.
