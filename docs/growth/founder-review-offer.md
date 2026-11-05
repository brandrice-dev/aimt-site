# Founder Blueprint Review — implementation contract

Owner-approved initial release: five 45-minute private founder reviews. Monday and Tuesday booking window 09:00–14:00 America/New_York (last possible start 13:15). This is a five-review total release, not five every month. Availability must respect calendar conflicts and daylight saving time.

## Approved student journey

- Blueprint drafts stay in the student's browser; editable download and PDF export remain available. No general Blueprint collection or marketing use.
- Five qualifying paid purchases receive a durable bonus reservation. Retries cannot consume extra reservations. Show real availability and stop advertising allocation when exhausted. Existing course access/refund rules stay intact.
- The My AIMT card explains the reserved review before graduation. Actual server-issued certification unlocks booking; client-side progress alone cannot authorize it.
- Eligible students schedule a call and upload a Blueprint PDF plus optional review material/questions. Only bonus recipients can submit. Private storage; owner-only review access; bounded file count/size and retention to be set before activation.
- Show booking details and confirm reservation/material receipt. Prevent double redemption and conflicting bookings. Preserve reservations across delays to graduation; define rescheduling and cancellation before launch.
- Present the founder review near the first enrollment button, in a substantial section with the Service Timer, and in the final offer summary. No popup, invented monetary value, fake countdown or guaranteed financial outcome.

## Current delivery boundary

This draft implements device-only Blueprint autosave, restore and clear, plus a disabled dashboard card and authenticated review/material/question APIs. Material access requires a server-held reservation and actual non-revoked certification. Owner-only API returns 60-second download links. Proposed schema lives in founder-review-schema.sql; it is not a generated or applied migration. No live schema, storage bucket, or environment flag has been changed.

The initial upload boundary is one Blueprint plus two optional PDFs, each at most 5 MiB (75 MiB across five recipients). Fixed object paths replace prior versions instead of accumulating submissions. This is not a malware scanner; files are for download by the owner, never embedded as public HTML.

This draft does not activate or advertise the bonus, alter checkout, issue purchase reservations, book calendar events, or send confirmations. FOUNDER_REVIEW_ENABLED defaults off. Reservation allocation, account linking, provider booking verification/one-use enforcement, retention cleanup, and owner management UI remain unfinished. Retention will be visible before any upload is allowed in production. No claim of end-to-end verification.

The existing Google Calendar connection is an assistant tool, not a deployable website scheduling credential. There is no existing booking integration in the repository. A supported scheduling destination or runtime calendar integration must be resolved before implementing the booking path. Do not insert an unprotected public booking URL and treat it as bonus authorization.

## Acceptance before activation

Verify simultaneous final-slot purchases cannot exceed five, retries are idempotent, only eligible certified students can book/upload, files are private and bounded, Monday/Tuesday slots obey Eastern time and conflicts, cancellation/reschedule behavior is explicit, confirmations reflect actual successful writes, and refunds do not silently recreate previously promised capacity. Test the full path in an isolated environment before launch.

No new paid provider authorization. No database, calendar, checkout or storage changes in the first draft. Keep launch disabled until fulfillment works and owner reviews the complete offer.
