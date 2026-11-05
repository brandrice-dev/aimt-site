# Founder Blueprint Review — implementation contract

Owner-approved initial release: five 45-minute private founder reviews. Monday and Tuesday booking window 09:00–14:00 America/New_York (last possible start 13:15). This is a five-review total release, not five every month. Availability must respect calendar conflicts and daylight saving time.

## Approved student journey

- Blueprint drafts stay in the student's browser; editable download and PDF export remain available. No general Blueprint collection or marketing use.
- Five qualifying paid purchases receive a durable bonus reservation. Retries cannot consume extra reservations. Show real availability and stop advertising allocation when exhausted. Existing course access/refund rules stay intact.
- The My AIMT card explains the reserved review before graduation. Actual server-issued certification unlocks booking; client-side progress alone cannot authorize it.
- Eligible students schedule a call and upload a Blueprint PDF plus optional review material/questions. Only bonus recipients can submit. Private storage; owner-only review access; bounded file count/size and 30-day retention after completion or verified-refund cancellation.
- Show booking details and confirm reservation/material receipt. Prevent double redemption and conflicting bookings. Preserve reservations across delays to graduation; owner-confirmed rescheduling preserves the reservation.
- Present the founder review near the first enrollment button, in a substantial section with the Service Timer, and in the final offer summary. No popup, invented monetary value, fake countdown or guaranteed financial outcome.

## Current draft implementation

Device-only Blueprint autosave plus eligibility-gated dashboard, private PDFs and questions, inline Google booking, and owner management controls. Booking URL provided by owner: https://calendar.app.google/hrvFEPf62vHFMSMu7 . Resolved embed is pinned in booking.js; no new-tab navigation. Google supplies Meet details and its booking confirmation email. AIMT's own dashboard shows a booking only after owner verification against the purchaser email; opening the calendar is not redemption. Google is cross-origin, so its booking result is not inferred from iframe navigation or unverified messages.

Upload boundary: one Blueprint plus two optional PDFs, each at most 5 MiB, deterministic overwrite paths (75 MiB across all five recipients). No public bucket or client storage policies. Owner-only 60-second download links, no-store responses. On review completion, owner dashboard displays a deletion deadline 30 days later and a purge action for PDFs/questions. A signed daily cleanup workflow is implemented, disabled until the repository variable FOUNDER_REVIEW_CLEANUP_ENABLED is true. Requests use a short-lived body-bound HMAC; unsigned requests are rejected. Clear-booking preserves eligibility. Verified-refund cancellation retains the occupied allocation and starts the same retention period; it does not issue a refund.

Purchase path: FOUNDER_REVIEW_SALES_ENABLED defaults off. Row-locked database holds cap the initial release at five; paid/cancelled promises are not recycled. Per-tab hashed checkout request keys reuse held checkout sessions, with Stripe idempotency keys protecting creation retries. Held sessions use real 35-minute Stripe expiration. Slots release only after a signature-verified expiration event, or a definitive 4xx session-create rejection. Unknown timeouts or 5xx retain the hold for review; do not guess it is safe to free. Paid fulfillment runs after validated entitlement, is idempotent, handles delayed-payment success, and continues after sales are paused. Claim/login attaches the recorded purchase to the authenticated account. Checkout and the paid enrollment email state whether the bonus is included.

Generated migration: supabase/migrations/20261105133743_founder_review_offer.sql . No hosted schema, bucket, calendar configuration, or environment flags changed. Database campaign row starts inactive. FOUNDER_REVIEW_ENABLED separately controls student/owner review endpoints. Do not turn either flag on until reviewed and verified in an isolated deployment. No marketing name is approved; all draft labels are placeholders. The public availability endpoint and sales-page presentation are implemented but hidden while sales are disabled. Actual remaining allocation is shown near enrollment and pricing; the Service Timer is presented separately. The branch-only ?view=offer preview uses clearly labeled sample availability and disables checkout. Remove the preview route before production merge.

## Acceptance before activation

- Verify the complete purchase, claim, certification, upload, inline booking, Google confirmation, owner confirmation, review completion and purge path in isolation.
- Independent security/payment review and hosted sandbox checks remain mandatory. Offline API tests and PGlite PostgreSQL tests do not establish live Stripe/Supabase/Google behavior or real multi-connection concurrency.
- Configure Stripe webhook subscriptions for checkout.session.completed, checkout.session.async_payment_succeeded and checkout.session.expired before launch. Unknown session-create outcomes must be reviewed before releasing holds. Do not retroactively assign existing buyers without owner instruction.
- Validate embedded booking through the appointment form on desktop/mobile without leaving the page. Google may request email verification; do not bypass provider authentication.
- Google booking links are inherently public. AIMT gates its iframe, but cannot prevent copying the underlying URL or duplicate/outside bookings. Owner verifies the five recipients and only confirms one per reservation. Hard enforcement inside Google itself would require a supported runtime calendar integration rather than hiding the link.
- Confirm retention handling, cancel/reschedule and refund handling with the owner; no refunded promise is silently offered to another buyer. Owner review precedes release. The owner approved the current 1-on-1 presentation; final naming and founder story remain deferred.

No production launch, migrations, sends, real bookings, or paid provider calls are authorized by this draft. Rollback: leave both flags off and revert the code; preserve all paid promises if sales were ever activated.

## Validation receipt (draft)

203 tests completed: 201 passed, two live surface checks skipped. Dashboard resource suite also passed its 85 assertions. Isolated PGlite PostgreSQL executed the generated migration and verified inactive-by-default, five slots, replay safety, ownership attachment, paid-hold protection, overlap rejection, and denied client table/RPC access. This uses one local PostgreSQL engine and is not a hosted multi-connection concurrency proof.

The integration test runs actual checkout, signed webhook, claim, graduation gate, upload, booking, owner reschedule/completion and signed retention cleanup handlers against local PostgreSQL. Auth, Stripe, Storage and email are simulated. It checks that completed-but-unpaid sessions do not grant access, paid-event replay is idempotent, checkout reloads reuse the held session, and a sixth purchase receives no founder bonus. Transactional email suites pass after correcting the stale allowlist for existing readiness senders.

Hosted verification remains incomplete: the only connected Supabase project is production. The owner explicitly authorized sandbox-only Stripe setup on 2026-11-05; a separate free, temporary Stripe sandbox was created. No hosted migration, production flag activation, real booking, live payment or email send occurred.

## Launch configuration (not activated)

1. Complete hosted sandbox verification and required independent payment/privacy review.
2. Apply the reviewed migration to the intended isolated environment first; verify storage and service-only grants. Production application requires release approval.
3. Subscribe the verified Stripe webhook to completed, async-payment-success and expired checkout events.
4. Set FOUNDER_REVIEW_ENABLED for review endpoints, activate the five-slot database campaign, then enable FOUNDER_REVIEW_SALES_ENABLED only for the approved launch.
5. Enable FOUNDER_REVIEW_CLEANUP_ENABLED in repository variables and confirm a dry-run followed by a due-record cleanup. The workflow uses the existing service-role secret only as an HMAC key.
6. Owner verifies Google appointments before confirming them in AIMT. Keep both course eligibility and the fixed five-recipient ledger authoritative.


## Stripe sandbox receipt — 2026-11-05

Owner authorized sandbox only. A separate temporary sandbox expires 2026-11-12; no credentials or claim links are stored in the repository. A synthetic $597 price and synthetic purchaser details were used. External API traffic was restricted to Stripe with a test-only key; local PostgreSQL handled the database and Auth/Storage/email remained simulated.

- Actual production checkout handler created six hosted sandbox sessions: five had review holds, the sixth had no bonus. Reusing a request key returned the same session. Amount and hold expiration matched the contract.
- Expired an open Stripe session, replayed expiration locally twice and verified one release; replacement checkout received the available allocation.
- Completed one hosted sandbox checkout using Stripe's 4242 test card, with Link saving disabled. Stripe confirmed status complete, payment_status paid, amount 59700 USD and livemode false. The success redirect intentionally targeted a synthetic .invalid origin, so no production success/claim page was invoked.
- Retrieved Stripe's actual completed event and replayed it through the webhook handler with a local test signing secret. Verified one course entitlement, one reserved review and one simulated email; replay did not duplicate any of them. This does not verify deployed webhook delivery/signing configuration.
- Stripe's new temporary restricted rkcs_test key initially fell back to hosted checkout because key-mode detection did not recognize it. Added explicit support and a regression test; actual embedded_page creation then succeeded with a bonus hold. No real secret appears in the test.
- Expired all remaining open test sessions and replayed actual expiration events. Only the paid bonus remained reserved locally. No real funds, production tables or student messages were affected.

Still required: hosted isolated Supabase Auth/Storage/RLS and multi-connection checks, deployed sandbox webhook delivery, complete embedded enrollment UI, actual Google appointment confirmation, and independent payment/privacy review. The sandbox receipt does not authorize launch or production changes.
