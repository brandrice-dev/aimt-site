# Founder Blueprint Review — implementation contract

Owner-approved initial release: five 45-minute private founder reviews. Monday and Tuesday booking window 09:00–14:00 America/New_York (last possible start 13:15). This is a five-review total release, not five every month. Availability must respect calendar conflicts and daylight saving time.

## Approved student journey

- Blueprint drafts stay in the student's browser; editable download and PDF export remain available. No general Blueprint collection or marketing use.
- Five qualifying paid purchases receive a durable bonus reservation. Retries cannot consume extra reservations. Show real availability and stop advertising allocation when exhausted. Existing course access/refund rules stay intact.
- The My AIMT card explains the reserved review before graduation. Actual server-issued certification unlocks booking; client-side progress alone cannot authorize it.
- Eligible students schedule a call and upload a Blueprint PDF plus optional review material/questions. Only bonus recipients can submit. Private storage; owner-only review access; bounded file count/size and retention to be set before activation.
- Show booking details and confirm reservation/material receipt. Prevent double redemption and conflicting bookings. Preserve reservations across delays to graduation; define rescheduling and cancellation before launch.
- Present the founder review near the first enrollment button, in a substantial section with the Service Timer, and in the final offer summary. No popup, invented monetary value, fake countdown or guaranteed financial outcome.

## Current draft implementation

Device-only Blueprint autosave plus eligibility-gated dashboard, private PDFs and questions, inline Google booking, and owner management controls. Booking URL provided by owner: https://calendar.app.google/hrvFEPf62vHFMSMu7 . Resolved embed is pinned in booking.js; no new-tab navigation. Google supplies Meet details and its booking confirmation email. AIMT's own dashboard shows a booking only after owner verification against the purchaser email; opening the calendar is not redemption. Google is cross-origin, so its booking result is not inferred from iframe navigation or unverified messages.

Upload boundary: one Blueprint plus two optional PDFs, each at most 5 MiB, deterministic overwrite paths (75 MiB across all five recipients). No public bucket or client storage policies. Owner-only 60-second download links, no-store responses. On review completion, owner dashboard displays a deletion deadline 30 days later and a purge action for PDFs/questions. Automatic cleanup is still required before a promise of automatic deletion is published.

Purchase path: FOUNDER_REVIEW_SALES_ENABLED defaults off. Row-locked database holds cap the initial release at five; paid/cancelled promises are not recycled. Held sessions use real 35-minute Stripe expiration. Slots release only after a signature-verified expiration event, or a definitive 4xx session-create rejection. Unknown timeouts or 5xx retain the hold for review; do not guess it is safe to free. Paid fulfillment runs after validated entitlement, is idempotent, handles delayed-payment success, and continues after sales are paused. Claim/login attaches the recorded purchase to the authenticated account. Checkout and the paid enrollment email state whether the bonus is included.

Generated migration: supabase/migrations/20261105133743_founder_review_offer.sql . No hosted schema, bucket, calendar configuration, or environment flags changed. Database campaign row starts inactive. FOUNDER_REVIEW_ENABLED separately controls student/owner review endpoints. Do not turn either flag on until reviewed and verified in an isolated deployment. No marketing name is approved; all draft labels are placeholders. The live sales page remains unchanged.

## Acceptance before activation

- Verify the complete purchase, claim, certification, upload, inline booking, Google confirmation, owner confirmation, review completion and purge path in isolation.
- Independent security/payment review and hosted sandbox checks remain mandatory. Offline API tests and PGlite PostgreSQL tests do not establish live Stripe/Supabase/Google behavior or real multi-connection concurrency.
- Configure Stripe webhook subscriptions for checkout.session.completed, checkout.session.async_payment_succeeded and checkout.session.expired before launch. Unknown session-create outcomes must be reviewed before releasing holds. Do not retroactively assign existing buyers without owner instruction.
- Validate embedded booking through the appointment form on desktop/mobile without leaving the page. Google may request email verification; do not bypass provider authentication.
- Google booking links are inherently public. AIMT gates its iframe, but cannot prevent copying the underlying URL or duplicate/outside bookings. Owner verifies the five recipients and only confirms one per reservation. Hard enforcement inside Google itself would require a supported runtime calendar integration rather than hiding the link.
- Confirm retention handling, cancel/reschedule and refund handling with the owner; no refunded promise is silently offered to another buyer. Owner review precedes release. Final copy/visual presentation are pending the owner's positioning decision.

No production launch, migrations, sends, real bookings, or paid provider calls are authorized by this draft. Rollback: leave both flags off and revert the code; preserve all paid promises if sales were ever activated.

## Validation receipt (draft)

168 focused offline tests passed; two live surface checks skipped. Dashboard resource suite also passed its 85 assertions. Isolated PGlite PostgreSQL executed the generated migration and verified inactive-by-default, five slots, replay safety, ownership attachment, paid-hold protection, overlap rejection, and denied client table/RPC access. This uses one local PostgreSQL engine and is not a hosted multi-connection concurrency proof.

A broader transactional-email rendering suite has one pre-existing stale sender allowlist: readiness profile/follow-up senders already on main are missing from that test. No new sender was added here; do not weaken the test to hide the failure. Other tested enrollment email behavior passed.
