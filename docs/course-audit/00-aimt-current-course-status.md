# AIMT Current Course Status

**Repository:** `aimt-site`
**Active branch:** `course-audit-build`
**Production branch:** `main`
**Last updated:** August 5, 2026

---

## Repository position

- Repository: `aimt-site`
- Active branch: `course-audit-build`
- Production branch: `main`
- Latest controlling commit: `7ec2bf40ce7f8b508ab71f9762c1cdb2c1b933f5` — "Add approved Module 5 audit specification"
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
| Module 5 | Externally audited — approved specification added; awaiting implementation |
| Modules 6–11 | Pending |
| Module 12 | Planned — do not begin |

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

Module 5 external audit completed.

The empty audit scaffold at `docs/course-audit/modules/module-05.md` was replaced with the approved implementation specification (approved title **Scalp Patterns & Service Adaptation**, status **Approved for controlled implementation**, source reviewed `module-05-source.md`). `docs/course-audit/modules/README.md` and `docs/course-audit/implementation-log.md` were updated to record the approval. No production code was changed. Module 5 has not yet been implemented.

### Module 5 approved corrections (recorded, not yet implemented)

- Replace the fixed five scalp-type labels with current scalp patterns and service directions.
- Align with Module 4's regional observation framework.
- Remove the unsupported compensatory-oil, follicular-obstruction, hair-growth, universal baseline-color, percentage, diet, and diagnostic claims.
- Remove the dead "Tap each type" hint and the eight fake microscopy placeholders.
- Add the ungraded "What changes first?" decision interaction.
- Add checkpoint-specific rubrics for `m5cp1` and `m5cp2`.
- Correct the displayed/evaluated question mismatch for both checkpoints.
- Correct Cadence's identity (old course name and personal-experience claim) and quick prompts.
- Add accessibility labels/live-region requirements and the shared semantic-color tokens.
- Add the competency-based completion requirement (both checkpoints passed, no read-percentage minimum).

---

## Current gate

Module 5 implementation.

---

## Exact next task

Implement the approved Module 5 specification in `docs/course-audit/modules/module-05.md`, then perform static and mocked validation. Do not mark Module 5 manually approved until the branch preview passes desktop and phone QA.

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

It must not interrupt or reorder Module 5 implementation.

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

- `7ec2bf40ce7f8b508ab71f9762c1cdb2c1b933f5` — Add approved Module 5 audit specification (**latest controlling commit**)
- `586e891` — Extract Module 5 for external audit
- `b4ee099` — Align semantic colors to Module 1 baseline
- `32665ea` — Polish Module 4 terminology and semantic colors
- `42d9aaa` — Implement Module 4 approved audit
- `4256b1e` — Add initial module video source pack

Update this section whenever a new controlling commit is approved.
