# AIMT Owner Setup Sequence — Email + Stripe (2026-09-15)

One owner-executable sequence, compressed from the full audits already done
today. Full reasoning lives in `AIMT-STRIPE-EMAIL-BRANDING-AUDIT-2026-09-15.md`,
`../email-templates/AIMT-EMAIL-TEMPLATES-SETUP.md`, and
`AIMT-EMAIL-STRIPE-SETUP-CHECKLIST.md` — this file does not re-derive any of
it, just orders the clicks. Nothing below has been applied anywhere; every
step is a live action only you can take.

---

**STEP 1 — Resend: create the sending domain.**
Resend Dashboard → Domains → Add Domain → `auth.aimtrichology.com` (a
dedicated subdomain, not the root domain — its records can't touch or break
your existing `info@`/`support@`/`hello@` mail on Google Workspace).

**STEP 2 — Resend: add every DNS record the dashboard shows you, not just SPF/DKIM.**
At the moment you add the domain, Resend's screen will list the actual
records for your account (commonly SPF + 3 DKIM CNAMEs, but it may also
include an MX and/or a return-path/bounce record for this subdomain — add
whatever it actually shows, using its live values, not a value from any
doc). Add all of them at your DNS host. Also add the DMARC record Resend
recommends for this subdomain: Host `_dmarc.auth.aimtrichology.com`, Value
`v=DMARC1; p=none; rua=mailto:support@aimtrichology.com`.

**STEP 3 — Resend: generate the API key, put it in Cloudflare — not the repo.**
Resend Dashboard → API Keys → Create API Key. Then: Cloudflare Dashboard →
Pages project (aimt-site) → Settings → Environment variables → add
`RESEND_API_KEY` = that key, server-side/Production only. Never paste it into
any client-side file or commit it to the repo.

**STEP 4 — Supabase: paste the 3 branded Auth templates.**
Supabase Dashboard → Authentication → Email Templates. One tab per type,
paste full file contents, save:
- "Confirm signup" ← `docs/email-templates/supabase-auth/confirm-signup.html`
- "Reset Password" ← `docs/email-templates/supabase-auth/reset-password.html`
- "Change Email Address" ← `docs/email-templates/supabase-auth/change-email.html`
Leave "Invite user" / "Magic Link" / "Reauthentication" alone — nothing in
the app triggers them.

**STEP 5 — Supabase: configure custom SMTP with the Resend credentials.**
Supabase Dashboard → Authentication → Settings → SMTP Settings:

| Field | Value |
|---|---|
| Sender email | `no-reply@auth.aimtrichology.com` |
| Sender name | `AIMT` |
| Host | `smtp.resend.com` |
| Port | `465` or `587` |
| Username | `resend` |
| Password | the API key from Step 3 |

Check whether this screen actually exposes a Reply-to field. If it does, set
it to `support@aimtrichology.com`; if it doesn't, skip it — don't invent a
workaround. (The custom Resend send in Step 8 already sets reply-to in code
regardless of this screen.)

**STEP 6 — Supabase: password-changed notice — check before building anything.**
Look at Authentication → Email Templates for a native "password changed" /
security-notification template distinct from "Reset Password" (which is the
recovery-link email, a different event). If one exists, brand it with your
usual copy/colors. If it doesn't, leave this alone — it's a post-launch item
and no custom Cloudflare Function should be built for it now.

**STEP 7 — Google Workspace / root domain: verify, then add DMARC only.**
- SPF is already live and correct — nothing to do: `aimtrichology.com TXT
  "v=spf1 include:_spf.google.com ~all"`.
- Verify DKIM is enabled: Google Admin console → Apps → Google Workspace →
  Gmail → Authenticate email. Confirm a key is generated and status shows
  authenticating.
- Add one DMARC record: `_dmarc.aimtrichology.com TXT "v=DMARC1; p=none;
  rua=mailto:<your report address>"` — pick the report-recipient address
  yourself (e.g. an existing `support@`/`hello@` mailbox or a new one); it's
  your call, not a value to copy from a doc. `p=none` is monitor-only — it
  changes nothing about mail delivery and cannot disturb `info@`,
  `support@`, or `hello@aimtrichology.com`. Don't move past `p=none` without
  a separate, later decision once you've reviewed the reports.

**STEP 8 — Stripe: branding + confirmations.**
Settings → Business → Public details: business/display name `AIMT`, support
email `support@aimtrichology.com`.
Settings → Branding: upload
`docs/stripe-and-email/assets/aimt-stripe-icon-512.png` (512×512, ready as-is),
accent color `#262626`.
Settings → Emails: confirm "Email customers about successful payments" is set
the way you want (this is Stripe's own receipt, independent of AIMT's own
emails).
`pay.aimtrichology.com` custom Checkout domain stays optional — it may be a
paid/plan-tier-gated Stripe feature, and it is explicitly not a launch
blocker either way.

**STEP 9 — Manual-grant invite email: already built, just needs Step 3.**
Verified today, not just read from docs: `sendManualGrantInviteEmail()` is
imported and called from `grantAccess()` in `functions/api/admin/index.js`
right after `ensureAuthUser()`, gated on `account.created` (fires only for a
brand-new Auth account, never for granting an existing one more access). A
send failure returns a warning object folded into the existing
`grant_course_access` audit row and API response — it never throws and never
rolls back the entitlement already written. Idempotency key is
`admin-grant/<grantId>`, checked against `admin_audit_log` before sending.
Reply-to is `support@aimtrichology.com`, set explicitly in the Resend
payload. It writes nothing to `course_progress`, `completions`, or
`certification_attempts`.
`node --test tests/admin-manual-grant-invite.test.mjs` → **9/9 pass** (new-account
send + correct idempotency key; existing-account grant sends nothing; retried
key doesn't double-send; missing key handled safely; failed send preserves
entitlement + surfaces warning; network-error send also preserves entitlement;
role guard unchanged; zero writes to course_progress/completions/
certification_attempts; no real network call anywhere in the test file).
Nothing left to build — once Step 3 sets `RESEND_API_KEY`, this goes live
automatically on the next manual grant.

---

No live Stripe, Supabase, DNS, or Google Workspace change was made while
writing this sequence. No Stripe or Resend API was called. No code file was
touched.
