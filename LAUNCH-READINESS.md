# AIMT Launch Readiness

> Update this file whenever major launch-relevant work is completed. New GPT/Codex chats should reference this file first before suggesting audits.

## Project Summary
- AIMT = American Institute of Modern Trichology.
- Current launch scope is a paid certification flow for HeadSpa Mastery with gated student access.
- Primary launch goal: clean purchase path, reliable entitlement + access gating, stable student resume experience.

## Current Architecture
- `courses.html` = public discovery + sales path.
- `student-access.html` = returning student entry point (sign-in, reset, re-entry).
- `headspa-mastery.html` = gated course experience.
- `success.html` = Stripe success, account creation, entitlement handoff.
- Backend/services in place: Stripe + Supabase + Cloudflare Pages.
- Entitlement infrastructure in place: `claim-course-access` endpoint + `course_entitlements` table + durable entitlement handling.

## What Is Already Done
- [x] Stripe checkout works.
- [x] Supabase signup works.
- [x] `?enter=1` direct entry flow works.
- [x] Staff access code was removed.
- [x] Staff email allowlist exists.
- [x] Returning user sign-in path was improved.
- [x] Post-purchase edge cases on `success.html` were hardened.
- [x] Durable entitlement layer exists.
- [x] `claim-course-access` endpoint exists.
- [x] `course_entitlements` table exists.
- [x] `student-access.html` is the returning student entry point.
- [x] `headspa-mastery.html` is gated.
- [x] First-login-only Cadence intro was restored.
- [x] Cadence should personalize with first name when available.
- [x] Checkout cancel returns to `courses.html?checkout=canceled`.
- [x] Public sales path should prioritize fast purchase.
- [x] Returning students should not be forced through the sales flow.

## Launch-Critical Remaining Tasks
### Must complete before launch
- [x] Validate HeadSpa Mastery public sales flow end-to-end:
  - [x] Course card click lands on the correct public enrollment page.
  - [x] Enrollment page clearly prioritizes purchase (CTA visible immediately, no confusion).
  - [x] Stripe checkout opens cleanly (no dead clicks or delays).
  - [x] Cancel returns to `courses.html?checkout=canceled`.
  - [x] No path accidentally routes new users into `student-access.html`.
  - [x] Public enrollment page does not route returning purchasers into `student-access.html` prematurely.
- [x] Validate in staging + production that course never auto-opens on browser reopen/refresh without fresh access-flow handoff through `student-access.html`.
- [x] Validate returning purchaser sign-in reliably restores access via durable entitlements (no false "no access" state, no routing to public landing page).
- [ ] Run full end-to-end QA matrix (new purchase, existing student sign-in, password reset, entitlement recovery, staff allowlist).
- [ ] Add/confirm lightweight error observability for critical failures (`create-checkout-session`, `claim-course-access`, Supabase auth failures).

### Should complete before launch
- [ ] Add a short QA runbook with exact test cases and expected outcomes for support/team handoff.
- [ ] Add clearer user-facing fallback copy for delayed entitlement sync on `student-access.html` and `success.html`.
- [ ] Confirm post-launch rollback/hotfix process on Cloudflare Pages (who deploys, where env vars live, fast revert steps).

### Can wait until after launch
- [ ] Expand structured analytics funnels for conversion and drop-off diagnostics.
- [ ] Add richer course progress/reporting dashboards for ops.
- [ ] Refine non-critical content polish on lower-priority sales-page sections.

## Important Bugs / Risks
- [x] Resolved: course no longer auto-opens on browser reopen; students re-enter through `student-access.html`.
- [ ] Entitlement sync race conditions can still create temporary “no access” confusion if claim timing is delayed.
- [ ] Any regression in gating logic could either lock out valid students or accidentally expose course entry.

## UX Rules
- Public path should optimize for fastest, cleanest purchase.
- Trust/SEO detail content can live lower on the sales page.
- Student access remains separate.
- Do not collapse gated course and sales page together.
- Returning students should go directly to `student-access.html`, not through sales friction.

## Technical Rules / Do Not Break
- Staff allowlist.
- Supabase auth.
- Durable entitlement logic.
- `success.html` claim flow.
- First-login-only Cadence intro.
- Resume behavior after proper login.
- `headspa-mastery.html` must remain gated behind explicit access-flow entry.

## Recommended Next Step
- Execute and document a focused launch gating QA pass first (especially browser reopen/refresh behavior across devices), then freeze access-flow logic unless a launch-blocking bug is found.

## Change Log
- 2026-04-21: Completed full public sales flow validation (card -> enrollment page -> Stripe -> cancel path). Confirmed no unintended routing into `student-access.html` and clean purchase-first UX.
- 2026-04-21: Removed weak `?enter=1` bypass, enforced durable entitlement checks, added session-readiness guard in `student-access.html`, fixed returning purchaser routing regression, confirmed browser reopen no longer auto-opens course, and confirmed valid returning students re-enter via `student-access.html` and route correctly into the gated course.
- 2026-04-21: Created this launch-readiness source-of-truth document and populated current known state, launch tasks, UX/technical guardrails, and priority risks.
