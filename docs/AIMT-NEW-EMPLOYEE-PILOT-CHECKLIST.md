# AIMT New Employee Pilot Checklist

**Purpose:** get one real new employee through the entire HeadSpa Mastery
course end-to-end on production (or a production-equivalent branch preview),
using the Admin MVP manual-grant flow, so Brandon gets real signal on the
course before opening it to paying students.

**Status of this pilot as of this document:** not yet run. Nothing in this
checklist has been executed. Running step 2 onward requires the Admin MVP
migration to be applied and `AIMT_OWNER_EMAIL` to be set (owner-only actions
— see `docs/admin/AIMT-ADMIN-ACTIVATION-RUNBOOK.md` §1–§2). **Do not invite a
real employee or mutate production Supabase without Brandon's explicit
go-ahead for each mutating step**, per that runbook's risk categorization.

Every step below is written for **Brandon** (steps 1–4, 17) or **the
employee** (steps 5–16, 18) to actually do. "Automatic" means the product
does it without anyone clicking an admin action; "Admin/owner action" means
Brandon has to do something in `/admin.html` or Supabase first.

---

## The flow

| # | Step | Expected behavior | Automatic or admin/owner action | What the employee should report if confusing |
|---|---|---|---|---|
| 1 | Brandon signs into Admin as owner | `/admin.html` → sign in with the `AIMT_OWNER_EMAIL` account → sidebar loads (Overview/Students/Activity Log) | Owner action (requires migration + env var already set — see above) | N/A (Brandon's step) |
| 2 | Admin → Grant Course Access | Brandon clicks **Grant course access**, enters the employee's real email, first/last name | Owner action | N/A (Brandon's step) |
| 3 | Source = staff | Brandon selects **Staff** as the enrollment source before submitting | Owner action | N/A (Brandon's step) |
| 4 | Employee receives the branded manual-grant onboarding email | If the grant created a brand-new account, `sendManualGrantInviteEmail()` fires automatically via Resend, using `docs/email-templates/custom-resend/invite-manual-grant.html`. If Brandon's response notice says the email didn't send (Resend failure surfaces as a warning, entitlement is still created either way), he relays the manual fallback instruction himself. | Automatic (email send) once grant is submitted | Whether the email arrived, whether it looked broken/unbranded, whether the subject line was confusing |
| 5 | Employee establishes account access | Employee opens the invite email, follows its link/instruction to **Student Access → "Forgot your password?"** (Admin MVP never sets a password directly) | Employee action | Whether the reset-password flow was confusing, whether the reset email arrived, whether the new-password form had any issues |
| 6 | Employee signs into normal AIMT | Employee goes to `/student-access.html`, signs in with their new password | Employee action | Any login error, unclear error messaging |
| 7 | My AIMT shows Head Spa Certification | After sign-in, `/my-aimt.html` loads and shows the Head Spa Certification course as an active enrollment (not "not enrolled") | Automatic | If the course doesn't show up, or shows the wrong access type |
| 8 | Employee enters `/head-spa-certification` | Employee clicks Continue/Enter from My AIMT (or types the clean URL) | Employee action, page load automatic | Any broken link, wrong destination, or landing on the sales page instead of the course |
| 9 | Orientation / How AIMT Works | First-time entry shows the one-time `#howAimtWorksView` orientation (course navigation, Cadence, Listen Mode explainer, practice vs. Cadence Check, completion, tools/resources) before Module 0 | Automatic (shown once per account) | Anything unclear about how the course works, anything that felt like it assumed prior knowledge |
| 10 | Welcome (Module 0) | After orientation, Module 0 ("Welcome") opens automatically | Automatic | Anything confusing in the welcome/orientation content itself |
| 11 | Listen Mode | Employee tries **Listen with Cadence** on any module where it's available (Modules 1, 4, 5, 6, 7 once integrated — see note below). Confirms Resume Listening, Listen Again, speed control, and Minimize/Restore all work as expected. | Employee action (manual opt-in — Listen Mode never autoplays) | Any mismatch between narration and on-screen content, audio that cuts off or stutters, controls that don't respond, checkpoint stops in the wrong place |
| 12 | Checkpoints ("Cadence Check") | At each required checkpoint, narration/reading pauses and the employee must answer in their own words in the Cadence chat before continuing | Automatic gate, employee provides the answer | Any checkpoint that feels unclear about what it's asking, or that seems to accept a clearly wrong answer, or that won't let a clearly correct answer through |
| 13 | Progress / dashboard | Employee checks `/my-aimt.html` periodically and confirms progress % updates to reflect modules actually completed | Automatic (synced via `aimt-progress-sync.js`) | Progress that looks frozen, wrong, or lower than expected after finishing a module |
| 14 | Service Timer | Employee uses `/aimt-service-timer.html` (linked from the course) to time a practice service | Employee action | Any timer bug, confusing controls, or the login-return path (`?next=`) landing somewhere wrong after a forced sign-in |
| 15 | Module 12 final assessment | Employee reaches the final certification assessment after completing Modules 0–11 and takes it | Automatic gate (requires full course progress), employee provides answers | Anything confusing about how the assessment is scored or presented, unclear time limits or instructions |
| 16 | Pass / remediation behavior | On a pass, employee sees a clear pass result and next step (certificate). On a fail, employee sees clear remediation/retry guidance, not a dead end. | Automatic | Whether the pass/fail result and next step were clear either way |
| 17 | Certificate | On a genuine pass, a certificate is issued (`issue-certificate.js`'s 4 gates: entitlement, idempotency, progress ≥ 1200, certification pass) and appears on My AIMT / is downloadable | Automatic (server-gated — cannot be granted by Admin) | If the certificate doesn't appear after a real pass, or shows wrong name/date/course info |
| 18 | Public certificate verification | Employee (or Brandon) opens `/verify.html`, enters the certificate's credential ID, confirms it resolves to the employee's real name/course/date | Automatic, public, read-only | Any mismatch between the certificate and the verification page, or a "not found" result for a real credential |

**Note on step 11 (updated 2026-09-17):** Listen Mode is now fully wired
into the live player for Modules 1, 4, 5, 6, and 7 — verified this pass
(every chunk's audio URL resolves, checkpoint gating/Resume/Close→Resume/
Listen Again/speed/minimize all confirmed working). Step 11 is fully
testable for those five modules. Modules 2 and 3 intentionally have no
Listen Mode entry point yet (narration accepted as-is for launch, per the
Master Launch Checklist) — that is expected, not a bug, and doesn't need
flagging in feedback.

---

## Employee feedback (keep it short)

Ask the employee to answer these after finishing (or after getting as far as
they get):

1. **Anything confusing?** Where, specifically — which screen or step.
2. **Anything broken?** What did you click/do, what happened, what did you
   expect instead.
3. **Anything repetitive?** Where did the course feel like it was repeating
   itself unnecessarily.
4. **Unclear instructions?** Any checkpoint, exercise, or assessment prompt
   that wasn't clear about what it wanted.
5. **Listen Mode mismatch?** Did the narration ever say something different
   from what was on screen, or reference something (a button, a section)
   that didn't match what you saw?
6. **Checkpoint confusion?** Did any Cadence Check feel like it graded you
   wrong, or was unclear about what counted as a good answer?
7. **Navigation difficulty?** Anything hard to find, or any point where you
   weren't sure how to get back to where you were.
8. **Mobile issues?** If you tried it on a phone — anything broken or hard
   to use at that size.
9. **Certificate/assessment confusion?** Anything unclear about how the
   final assessment or certificate worked.

That's it — nine short answers, not a survey. Free text is fine; it doesn't
need to be formal.
