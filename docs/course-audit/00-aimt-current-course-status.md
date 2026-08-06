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
- Latest controlling commit: "Integrate Module 5 teaching images" (this file is updated inside that same commit, so it cannot self-cite its own hash — see `git log` on `course-audit-build`); the last hash citable here is `b96fd3eff70d86d89d0ec1c8386a6049b124bead` — "Add Module 5 visual asset plan"
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

Module 5 visual asset plan and teaching-image integration (a focused pre-QA visual polish; Module 5 remains awaiting manual QA).

`docs/course-audit/modules/module-05.md` gained an approved "Amendment — Module 5 visual asset addendum" recording five source photographs as four teaching moments (regional crown/hairline comparison, targeted crown cleansing, gentle hairline adaptation, client communication), their purpose, the controlling non-diagnostic caution, and the approved heading/caption/alt-text copy. `docs/course-audit/modules/module-05-assets.md` was created with the full file inventory. Optimized WebP production derivatives (1360×1020, downscaled from 1448×1086 sources, never upscaled) were generated and integrated into `headspa-mastery.html` at the four approved placements using a large editorial case-study spread and full-width photo breaks — deliberately distinct from Module 4's five-point stepper, appearance gallery, and card-grid presentation. The approved downloadable (`AIMT Regional Service Adaptation Guide`) remains recommended with production deferred; nothing was created or linked. No auth, entitlement, progress, certificate, payment, or Review Mode code changed, and Module 4's markup is unchanged. Module 5 has not yet been manually approved.

### Visual integration summary

- Four placements implemented exactly as specified: after Section 5.4 (comparison pair), after Section 5.5 (targeted cleansing), within/after Section 5.7 (gentle adaptation), and within Section 5.8 (client communication).
- Every image uses `<picture>` (WebP source + PNG fallback), explicit `width="1360" height="1020"`, `loading="lazy"`, a real `<figcaption>`, and non-diagnostic alt text — no teaching text is baked into any image.
- Validation: file-existence/broken-path scan, WebP-derivative dimension/format validation (confirmed via in-browser decode and `<picture>` source resolution), HTML tag-balance and duplicate-ID scans, JS-syntax check, desktop side-by-side and phone stacked-order layout checks (via `getBoundingClientRect`), zero horizontal overflow at both widths, and full regression checks (interaction, checkpoints, Cadence, completion, Module 6 gating, and Module 4's untouched markup) — all passed.
- Deferred, consistent with every prior module: live-model grading, screen-reader QA, physical-keyboard QA, real touch-device QA, a real human visual/scroll pass (sandbox tooling limitation, unchanged from Step 30 — see `implementation-log.md` Step 31), medical/dermatological review, legal/scope review, and production of the still-deferred downloadable.

---

## Current gate

Module 5 manual QA.

---

## Exact next task

Push the outstanding Module 5 commits (implementation plus this visual-asset pass), locate the `course-audit-build` preview, and complete Module 5 desktop and phone manual QA against `docs/course-audit/00-aimt-manual-qa-master-checklist.md` and `module-05.md`'s acceptance criteria (including the visual placements, captions, and alt text added in this pass). Do not mark Module 5 "Implemented — manual QA approved" until that manual pass is complete.

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

- (pending) — Integrate Module 5 teaching images (**latest controlling commit** — created together with this file; see `git log` for the hash)
- `b96fd3eff70d86d89d0ec1c8386a6049b124bead` — Add Module 5 visual asset plan
- `7f2b3fbb9d63d1a197b03dc7b58eeb9ec0ae322f` — Advance course status to Module 5 manual QA
- `a5879dc1dcb527a2b4ef1315d5dd73120410e41e` — Implement Module 5 approved audit
- `7ec2bf40ce7f8b508ab71f9762c1cdb2c1b933f5` — Add approved Module 5 audit specification
- `586e891` — Extract Module 5 for external audit
- `b4ee099` — Align semantic colors to Module 1 baseline
- `32665ea` — Polish Module 4 terminology and semantic colors
- `42d9aaa` — Implement Module 4 approved audit
- `4256b1e` — Add initial module video source pack

Update this section whenever a new controlling commit is approved.
