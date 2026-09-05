# AIMT Admin MVP — Working Specification

**Project:** American Institute of Modern Trichology (AIMT)  
**Repository:** `aimt-site`  
**Branch:** `course-audit-build`  
**Status:** Draft implementation authority — initial scaffold  
**Purpose:** Secure owner-operated control plane for student access, enrollment, progress visibility, certification operations, account support, and auditable manual actions.

> This document is being built against the actual `course-audit-build` implementation. It is intentionally committed first as a side-track specification so subsequent admin work has an explicit source of truth and remains isolated from the student-course experience and production deployment.

## Non-negotiable boundaries

- Work only on `course-audit-build`.
- Do not merge or deploy to `main` as part of Admin MVP work.
- Do not change approved curriculum, checkpoint questions/rubrics, module gating, or student-facing certification standards.
- Admin access must be authenticated and server-authorized; knowing the admin URL must never be sufficient.
- Stripe remains a payment source, not the definition of course access.
- Manual/staff/complimentary enrollment must grant the same student course experience as paid enrollment unless an explicit entitlement says otherwise.
- Certification eligibility remains competency-based. Admin enrollment must not directly mark modules, checkpoints, final assessment, or certification as passed.
- High-impact admin actions must be logged.

## Initial MVP scope

1. Secure owner/admin access.
2. Dashboard summary.
3. Student search and student detail.
4. Grant/revoke/reactivate course access without Stripe.
5. Progress/completion/certification visibility.
6. Basic account-support visibility/actions that do not bypass identity verification.
7. Admin activity log.

## Explicitly deferred

- Full LMS/CMS editing.
- Curriculum editing from the admin UI.
- Bulk marketing-email tools.
- Refund processing.
- Stripe charge management.
- Arbitrary progress/checkpoint overrides.
- Manual certificate issuance that bypasses competency requirements.
- Multi-organization/school tenancy.
- Advanced analytics/BI.

## Implementation note

The detailed schema, API, permission, screen, security, acceptance-test, and QA requirements will be filled in after repository inspection of the current entitlement, progress, completion, certification, authentication, and certificate-issuance paths.
