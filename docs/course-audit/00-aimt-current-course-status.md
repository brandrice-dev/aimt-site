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
- Latest controlling commit: `ebe30a2e44a40b583da8a5b7d3a8ffc99c6706bc` — "Strengthen Module 5 common-mistake guidance"
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

Focused Module 5 correction: added "Better move" corrective lines to Section 5.9's eight common-mistake cards, identified during manual QA. Module 5 remains `Implemented — awaiting manual QA`.

Manual QA found that Section 5.9 ("Errors that make protocols less intelligent") — the final instructional section before checkpoint `m5cp2` — named eight common practitioner mistakes but stopped after naming each error, with no explicit corrective behavior. `docs/course-audit/modules/module-05.md` and `headspa-mastery.html` each gained one **Better move** line per existing mistake card, in the exact approved wording, distilled entirely from concepts already taught and approved elsewhere in Module 5 — no new curriculum was introduced. The section eyebrow, headline, all eight mistake titles, all eight existing mistake descriptions, and the closing summary card ("A strong protocol is explainable.") are unchanged. Checkpoint questions/rubrics, completion-card copy, Cadence configuration, all five approved Module 5 images and their captions/alt text, progress architecture, and Module 6 gating were not touched, and Section 5.10 (removed in the prior polish pass) did not return.

### Mistake-guidance validation summary

- Content: all eight mistake cards confirmed programmatically to carry exactly one "The mistake" row and one "Better move" row each, matching the approved copy exactly; the summary card is unchanged; `m5cp2` still follows Section 5.9 directly with no reintroduced recap section.
- Completion behavior: with a cleared test state, passing only one mocked checkpoint left `#m5Complete` hidden; passing both revealed it with the same supporting line and competency copy from the prior recap-polish step, and Module 6 correctly unlocked.
- Regression: both checkpoint questions remain byte-identical between display and evaluation; rubrics, Cadence config, and the ungraded interaction (still writes no progress) are unchanged; all 5 Module 5 images unchanged; no duplicate IDs or malformed HTML introduced; no horizontal overflow at 1440px, 1024px, 768px, or 390px; Module 4 reopened unchanged; no auth, entitlement, certificate, progress, or Review Mode architecture changed.
- This was static and mocked browser validation only — it does not replace or claim real-device or live-preview manual QA.

---

## Current gate

Module 5 manual QA.

---

## Exact next task

Push the outstanding Module 5 commits (implementation, visual-asset integration, the recap correction, and this mistake-guidance polish) if necessary, reopen/refresh the updated `course-audit-build` branch preview, and continue Module 5 desktop and phone manual QA from Section 5.9 against `docs/course-audit/00-aimt-manual-qa-master-checklist.md` and `module-05.md`'s acceptance criteria — including confirming each mistake card's new "Better move" line, the completion card's supporting line, and the absence of any post-checkpoint recap. Do not perform QA against an older preview. Do not mark Module 5 "Implemented — manual QA approved" until that manual pass is complete.

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

- `ebe30a2e44a40b583da8a5b7d3a8ffc99c6706bc` — Strengthen Module 5 common-mistake guidance (**latest controlling commit**)
- `4428e511264966c2e8848603af69a7b953db9b50` — Remove Module 5 post-checkpoint recap
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
