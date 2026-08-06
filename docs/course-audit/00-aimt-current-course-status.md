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
- Latest controlling commit: `4428e511264966c2e8848603af69a7b953db9b50` — "Remove Module 5 post-checkpoint recap"
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

Focused Module 5 correction: removed the standalone post-checkpoint recap identified in manual QA. Module 5 remains `Implemented — awaiting manual QA`.

Manual QA on Module 5 found a standalone lesson section (`5.10 — Recap`) placed after the final required checkpoint (`m5cp2`), which created the impression that new instructional material continued after the student reached the final assessment — a pattern no other approved module uses. The complete `## 5.10 — Recap` section was removed from `docs/course-audit/modules/module-05.md` (Sections 5.1–5.9 were not renumbered or otherwise touched), and the matching visible block was removed from `headspa-mastery.html` so checkpoint `m5cp2` is now followed directly by the completion card, with no divider or instructional content between them — matching the existing Module 4 checkpoint-to-completion pattern. The strongest sentence from the deleted recap ("Assessment becomes skill when it changes the service responsibly.") was preserved as a new **Supporting line** in the completion-card specification and rendered as an additional `.lc-sub` line inside `#m5Complete`, directly after the "Module complete." title and before the existing primary competency statement — not as a new section, heading, checkpoint, or separate card. Section 5.9's summary card, both checkpoint questions/rubrics, the "What changes first?" interaction, all five approved images and their captions/alt text, Cadence configuration, and Module 6 gating are all unchanged. This is a narrow structural-clarity correction only.

### Recap-removal validation summary

- Structure: confirmed live that Sections 5.1–5.9 remain in order, `m5cp2` is the final visible instructional block, no "5.10" or "From pattern to plan" text remains anywhere in the student experience, and Section 5.9's summary card is unchanged.
- Completion behavior: with a cleared test state, passing only `m5cp1` (mocked) left completion hidden; passing both `m5cp1` and `m5cp2` revealed `#m5Complete` with the new supporting line in the correct position, unlocked Module 6, and correctly restored on reload.
- Regression: both checkpoint questions remain byte-identical between display and evaluation; rubrics, Cadence config, and the ungraded interaction (still writes no progress) are unchanged; no duplicate IDs or malformed HTML introduced; no JavaScript referenced the removed section; no horizontal overflow at 1440px, 1024px, 768px, or 390px; Module 4 reopened unchanged; no auth, entitlement, certificate, progress, or Review Mode architecture changed.
- This was static and mocked browser validation only — it does not replace or claim real-device or live-preview manual QA.

---

## Current gate

Module 5 manual QA.

---

## Exact next task

Push the outstanding Module 5 commits (implementation, visual-asset integration, and this recap correction) if necessary, open the updated `course-audit-build` branch preview, and resume Module 5 desktop and phone manual QA against `docs/course-audit/00-aimt-manual-qa-master-checklist.md` and `module-05.md`'s acceptance criteria — including confirming the completion card's new supporting line and the absence of any post-checkpoint recap. Do not begin preview QA against an older deployment. Do not mark Module 5 "Implemented — manual QA approved" until that manual pass is complete.

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

The approved downloadable (`AIMT Regional Service Adaptation Guide`) remains recommended; production is still deferred and it was not created or linked by this task.

---

## Latest relevant commits

- `4428e511264966c2e8848603af69a7b953db9b50` — Remove Module 5 post-checkpoint recap (**latest controlling commit**)
- `8a2ef4bdadd780ae7fba7849be0376a358a3c686` — Integrate Module 5 teaching images
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
