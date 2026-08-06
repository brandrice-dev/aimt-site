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
| Module 4 | Implemented in commit `42d9aaa`; terminology and semantic-color polish underway; manual QA pending |
| Module 5 | Do not begin |
| Modules 6–11 | Pending |
| Module 12 Final Exam | Planned; do not begin |

---

## Current active task

Claude is completing one focused Module 4 polish pass:

1. Replace student-facing `station/stations` language with:
   - AIMT Five-Point Scalp Assessment
   - assessment areas
   - assessment points
   - baseline views
   - regions
   - five-point scan

2. Normalize shared semantic colors across Modules 0–4:
   - green for correct / accepted / success;
   - red for incorrect / needs revision / prohibited;
   - warm ochre or amber for caution;
   - charcoal or taupe for neutral information;
   - meaning never depends on color alone.

Expected commit:

`Polish Module 4 terminology and semantic colors`

---

## Current gate

Module 4 manual QA.

Do not mark Module 4 approved until the polish commit is pushed and the branch preview is reviewed on desktop and phone.

---

## Exact next steps

1. Review Claude’s polish report.
2. Push the commit through GitHub Desktop if CLI push fails.
3. Locate the `course-audit-build` preview URL.
4. Review Module 4 on desktop.
5. Review Module 4 on phone.
6. Test:
   - five-point scan;
   - direct area selection;
   - previous and next;
   - image enlargement;
   - observation-classification interaction;
   - semantic success/error states;
   - appearance gallery;
   - oil-versus-residue comparison;
   - `m4cp1`;
   - `m4cp2`;
   - Cadence prompts;
   - completion card;
   - Module 5 unlock behavior.
7. Mark Module 4 approved only after the visual and functional review passes.
8. Create `module-04-video-source.md`.
9. Begin Module 5 extraction.

---

## Do not begin

- Module 5 extraction
- Module 5 audit
- Module 12
- certificate hardening
- persistent Cadence
- Guided Completion
- Listen Mode
- final styling
- merge to `main`
- production deployment

---

## Module 4 deferred QA

Still requiring later or manual review:

- live-model grading;
- screen-reader testing;
- physical-keyboard testing;
- real touch-device testing;
- medical/dermatological review;
- privacy/legal review of saved-image consent workflow;
- future replacement of illustrative microscopy images with authenticated clinical captures.

---

## Parallel video-production track

The video workflow is allowed to run in parallel for approved modules.

Current video-source files exist for Modules 0–3.

The user and partner are beginning with Modules 0 and 1 to calibrate the production process.

Do not let video work interrupt the audit order.

Module 4 video-source creation waits until Module 4 manual QA approval.

---

## Latest relevant commits

- `42d9aaa` — Implement Module 4 approved audit
- `4256b1e` — Add initial module video source pack

Update this section whenever a new controlling commit is approved.
