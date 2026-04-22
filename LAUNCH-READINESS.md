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
- [x] Run full end-to-end QA matrix (new purchase, existing student sign-in, password reset, entitlement recovery, staff allowlist):
  - [x] New purchase flow manual verification
    - Test: Start at `courses.html`, open HeadSpa enrollment, run one live Stripe cancel and one live Stripe success path through `success.html` account handoff.
    - Pass if: Cancel lands at `courses.html?checkout=canceled` with correct UX, and success lands at `success.html?session_id=...` then hands off correctly toward gated entry.
  - [x] Existing student sign-in manual verification
    - Test: From signed-out state, sign in at `student-access.html` with a known entitled purchaser account.
    - Pass if: User is routed into gated `headspa-mastery.html` (not public landing) and resume state loads.
  - [x] Password reset manual verification
    - Test: Trigger reset from `student-access.html`, complete email reset flow, then sign in with new password.
    - Pass if: Reset email arrives, reset completes successfully, and post-reset sign-in follows normal access rules.
  - [x] Entitlement recovery manual verification
    - Test: Simulate/execute a pending-claim scenario, then sign in via `student-access.html` with matching purchaser identity.
    - Pass if: `claim-course-access` recovery restores durable entitlement and user gains gated access without manual DB intervention.
  - [x] Staff allowlist manual verification
    - Test: Sign in via `student-access.html` using an allowlisted staff account from signed-out state.
    - Pass if: Staff account reaches gated course access as intended, while non-entitled non-staff accounts remain blocked.
- [x] Add/confirm lightweight error observability for critical failures (`create-checkout-session`, `claim-course-access`, Supabase auth failures).
  - Note: `aimt_logs` table and migration are now in place, with a silent-fail `logAimtEvent` helper capturing launch-critical auth, checkout, and entitlement claim events without affecting UX.

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
- Course cards always route to public enrollment pages. Returning students must use `student-access.html` and are not auto-routed from course discovery pages.

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
- 2026-04-21: Added lightweight launch observability with `aimt_logs` migration and client/server `logAimtEvent` coverage for auth, entitlement recovery/claim, and checkout failure paths.
- 2026-04-21: Completed full live end-to-end QA matrix. Verified purchase flow (cancel + success), entitlement recovery, password reset, and staff allowlist, and confirmed auth now requires re-login after browser close.
- 2026-04-21: Switched Supabase auth persistence to session-scoped browser storage across student-access, success, and headspa course entry so closing the browser now requires re-authentication, while local course progress/resume and in-course memory data remain preserved.
- 2026-04-21: Enforced course-card navigation rule in launch docs after code audit confirmation: discovery card interaction remains a fixed route to public enrollment (no auth-based interception/reroute); returning access remains through `student-access.html`.
- 2026-04-21: Hardened password reset initiation by setting explicit Supabase `redirectTo` back to `student-access.html` in both student access surfaces.
- 2026-04-21: Audited new purchase flow and hardened `success.html` to prevent auto-course handoff when `session_id` is missing, routing those cases to Student Access guidance instead.
- 2026-04-21: Audited entitlement recovery path end-to-end and hardened `student-access.html` with a brief post-claim entitlement retry check to reduce timing-related false "no access" outcomes after successful claim writes.
- 2026-04-21: Corrected Stripe checkout `cancel_url` to `courses.html?checkout=canceled` (from `headspa-mastery.html?checkout=canceled`) to keep canceled users on the public sales/discovery path.
- 2026-04-21: Completed full public sales flow validation (card -> enrollment page -> Stripe -> cancel path). Confirmed no unintended routing into `student-access.html` and clean purchase-first UX.
- 2026-04-21: Removed weak `?enter=1` bypass, enforced durable entitlement checks, added session-readiness guard in `student-access.html`, fixed returning purchaser routing regression, confirmed browser reopen no longer auto-opens course, and confirmed valid returning students re-enter via `student-access.html` and route correctly into the gated course.
- 2026-04-21: Created this launch-readiness source-of-truth document and populated current known state, launch tasks, UX/technical guardrails, and priority risks.
