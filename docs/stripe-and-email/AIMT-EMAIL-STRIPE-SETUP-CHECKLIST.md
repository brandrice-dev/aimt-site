# AIMT Email + Stripe — Owner Setup Checklist (2026-09-15)

**Open this one document to see everything left to do.** Everything below is
prepared and ready — templates written, assets exported, DNS state checked.
Nothing on this list has been applied anywhere; every checkbox is a live
action only the owner can take (Dashboard clicks, DNS records, or a small
follow-up code change, clearly marked as such).

Full reasoning behind every recommendation lives in the two source audits —
this file pulls the actionable parts forward and doesn't repeat their detail:
- `docs/stripe-and-email/AIMT-STRIPE-EMAIL-BRANDING-AUDIT-2026-09-15.md`
- `docs/email-templates/AIMT-EMAIL-TEMPLATES-SETUP.md`

---

## 1. Google Workspace — nothing to do

`info@` / `support@` / `hello@aimtrichology.com` already exist and are live
on Google Workspace (MX confirmed via `dig`). Do not change these.
`support@aimtrichology.com` is the address used as reply-to and as the
`mailto:` link throughout every template below — already correct, no action.

---

## 2. Resend + Supabase SMTP (transactional email)

### 2a. Resend account + sending domain
- [ ] Create/log into a Resend account.
- [ ] Domains → Add Domain → **`auth.aimtrichology.com`** (a dedicated
      subdomain, not the root domain — this is deliberate: subdomain
      SPF/DKIM/DMARC records cannot affect or break the root domain's
      existing Google Workspace mail for `info@`/`support@`/`hello@`).
- [ ] Add **every** DNS record Resend's dashboard shows you for
      `auth.aimtrichology.com` at that moment — don't assume the set is
      only SPF + DKIM. Depending on what Resend's product shows when you
      actually do this, it may also include an MX and/or a
      return-path/bounce-handling record for this subdomain. Add all of
      them, using **Resend's exact live values, not a placeholder or a
      value copied from this checklist** — DKIM keys (and any other
      record) are generated per-account. (SPF is very likely
      `v=spf1 include:amazonses.com ~all`, since Resend sends via Amazon SES,
      but confirm against what Resend shows, and don't stop adding records
      once SPF/DKIM are in if the dashboard lists more than that.)
- [ ] Add a DMARC TXT record: Host `_dmarc.auth.aimtrichology.com`, Value
      `v=DMARC1; p=none; rua=mailto:support@aimtrichology.com`
- [ ] Generate a Resend **API key** (starts `re_...`) — this becomes the SMTP
      password in step 2b. Do not commit it to the repo.
- [ ] *Separate decision, own section:* the root domain `aimtrichology.com`
      has **no DMARC record at all** today (`_dmarc.aimtrichology.com` is
      empty). Not required for the `auth.aimtrichology.com` setup above to
      work, but see **§2e below — now recommended before launch**, not
      just flagged for awareness.

### 2b. Supabase SMTP config
Dashboard: **Authentication → Settings → SMTP Settings** — fill in exactly:

| Field | Value |
|---|---|
| Sender email | `no-reply@auth.aimtrichology.com` |
| Sender name | `AIMT` |
| Host | `smtp.resend.com` |
| Port | `465` (implicit TLS) or `587` (STARTTLS) — either works |
| Username | `resend` (this literal string, always) |
| Password | your Resend API key from step 2a |
| Reply-to | `support@aimtrichology.com` **— only if this screen actually has a Reply-to field.** Not confirmed from this repo/session (no tool here can see Supabase's live SMTP settings screen). If you don't see one, skip it — don't invent a workaround. It only affects the 3 Supabase-triggered templates below (2c); the custom Resend sends (2d) set reply-to themselves in code either way. |

- [ ] Fill in and save the fields above (skip Reply-to if the field isn't there).

### 2c. Paste the 3 Supabase Auth templates
Dashboard: **Authentication → Email Templates** — one tab per type, paste
full file contents, save:

- [ ] **Confirm signup** ← `docs/email-templates/supabase-auth/confirm-signup.html`
      — real, fires today (`signUp()` in `success.html` after checkout, if
      "Enable email confirmations" is on).
- [ ] **Reset Password** ← `docs/email-templates/supabase-auth/reset-password.html`
      — real, fires today ("Forgot your password?" on `student-access.html`).
- [ ] **Change Email Address** ← `docs/email-templates/supabase-auth/change-email.html`
      — currently dormant (no email-change feature exists in the app yet);
      safe and free to paste in now so it's correct the moment that feature
      ships.
- Skip **Invite user**, **Magic Link**, **Reauthentication** — none of these
  are triggered by anything in the app today (no `signInWithOtp`, and
  `grantAccess()` doesn't call Supabase's invite endpoint — see §2d).

### 2d. Custom AIMT sends

**Update (2026-09-15, later pass): item 4 below is now implemented** —
send code exists, is tested, and just needs `RESEND_API_KEY` set (see its
own checkbox) to go live. Items 5–8 are still plain HTML with
`{{PLACEHOLDER}}` markers waiting on a Cloudflare Function to fill them in
and POST to Resend's `/emails` API — real follow-up development work,
explicitly **after-launch/lower-priority**, not required for launch. Item 9
(password-changed) was reclassified rather than built — see its own note
below; no custom Cloudflare Function should be built for it.

- [x] **`custom-resend/invite-manual-grant.html`** — send code implemented
      in `functions/_lib/admin/manual-grant-invite-email.mjs`, called from
      `grantAccess()` (`functions/api/admin/index.js`) right after
      `ensureAuthUser()` returns `{ created: true }`. Tests:
      `tests/admin-manual-grant-invite.test.mjs`. Closes the real gap
      where a manually granted student got no email at all.
  - [ ] **Owner action still required:** generate a Resend API key (step
        2a) and set it as `RESEND_API_KEY` in the Cloudflare **Pages**
        project's environment variables (not the `headspa-proxy` Worker —
        this is a Pages Function). Until this is set, the code safely
        skips sending and still creates the account/entitlement normally;
        the admin response and audit log will show why no email went out.
- [ ] `custom-resend/enrollment-confirmation.html` *(after-launch)* → would
      wire into `functions/api/stripe-webhook.js`, right after
      `upsertEntitlement()` succeeds. Not the Stripe receipt (see §3) —
      this is AIMT's own "here's how to start" email. Not attempted in the
      2026-09-15 implementation pass because `stripe-webhook.js` is
      payment/entitlement logic that stays off-limits without being
      explicitly asked (CLAUDE.md hard rule #1).
- [ ] `custom-resend/certification-earned.html` *(after-launch)* → would
      wire into `functions/api/issue-certificate.js`, right after a **new**
      credential ID is generated (not the idempotent "already issued"
      path).
- [ ] `custom-resend/review-request-received.html` *(after-launch)* → would
      wire into `request-review.js`, after the insert succeeds.
      Acknowledgment-only — no promised timeline, since resolution is
      manual/out-of-band.
- [ ] `custom-resend/educator-remediation-request-received.html`
      *(after-launch)* → would wire into `request-educator-remediation.js`,
      after the insert succeeds (non-`alreadyRequested` branch only). Also
      acknowledgment-only.
- [ ] `custom-resend/security-password-changed.html` — **reclassified, not
      built.** A bespoke new Cloudflare Function for this was removed from
      the dev plan (see `AIMT-EMAIL-TEMPLATES-SETUP.md` item 9): Supabase's
      own template set has no distinct native "password changed" security
      notice to brand instead (its Reset Password template is the
      *recovery-link* email, a different event) — if a future check of the
      live dashboard finds one, brand that instead of building a duplicate
      custom send. Template stays prepared; after-launch if pursued.

Every idempotency key for the above (item 6 of the audit) — including the
one item 4 already uses — is documented in
`AIMT-EMAIL-TEMPLATES-SETUP.md`, "Idempotency for custom Resend sends."

---

## 2e. Root domain (`aimtrichology.com`) email authentication — RECOMMENDED BEFORE LAUNCH

**Correction (2026-09-15, later pass): this moves from "optional/awareness"
to recommended-before-launch.** It was previously flagged only as a
side-discovery in §2a with no urgency attached. `_dmarc.aimtrichology.com`
(the **root** domain — not `auth.aimtrichology.com` from §2 above) has no
DMARC record at all today, confirmed via `dig`. This is a completely
separate DNS hostname/record from the `_dmarc.auth.aimtrichology.com`
record in §2a — adding or changing one has zero effect on the other, since
DMARC (like SPF/DKIM) is evaluated per exact hostname in the message's
`From` domain. Do not merge these two into one record or one decision.

Root-domain mail (`info@` / `support@` / `hello@aimtrichology.com`) already
authenticates its own way on Google Workspace — this section is about
formalizing that with DMARC, not changing how that mail sends.

- [ ] **Verify SPF (already confirmed, no action needed):** `dig TXT
      aimtrichology.com` already shows `v=spf1 include:_spf.google.com
      ~all` live today. Nothing to do here — just confirming it's correct
      before adding DMARC on top of it.
- [ ] **Verify Google Workspace DKIM is enabled and authenticating:**
      Google Admin console → Apps → Google Workspace → Gmail →
      Authenticate email. Confirm a DKIM key has been generated and its
      status shows as authenticating (not just generated-but-unpublished).
      This could not be verified from this repo/session — `dig` can't find
      a DKIM record without knowing Google's selector for this domain, and
      guessing one risks reporting a false negative, so this needs a direct
      look at the Admin console.
- [ ] **Add a DMARC TXT record for the root domain**, starting
      conservatively: Host `_dmarc.aimtrichology.com`, Value
      `v=DMARC1; p=none; rua=mailto:support@aimtrichology.com`. `p=none`
      means "monitor only" — it doesn't affect mail delivery, it just
      starts collecting aggregate reports at the `rua=` address. Do not
      jump straight to `p=quarantine` or `p=reject`.
- [ ] **Monitor before tightening.** Once the `p=none` record has been live
      for a period and the aggregate reports show Workspace mail passing
      cleanly (and nothing unexpected failing), only then consider
      tightening to `p=quarantine` — and only as a later, separate,
      deliberate decision. Not part of this checklist's scope.

## 3. Stripe Dashboard branding

- [ ] **Settings → Business → Public details** — confirm/set business name
      **"AIMT"** (short form, matching the site's own nav/footer wordmark),
      support email `support@aimtrichology.com`.
- [ ] **Settings → Branding** — upload icon:
      `docs/stripe-and-email/assets/aimt-stripe-icon-512.png` (512×512,
      transparent background, already exported from the real AIMT mark —
      ready to upload as-is, no further prep needed). Set accent/brand color
      to **`#262626`** (AIMT's real charcoal CTA color — matches every
      primary button sitewide, not the quieter taupe). Logo is optional and
      currently skippable — no wide-format logo lockup file exists in the
      repo today.
- [ ] **Settings → Emails** (Customer emails) — confirm whether "Email
      customers about successful payments" is ON. This is Stripe's own
      receipt email, independent of and complementary to the AIMT
      enrollment-confirmation email in §2d (Stripe's = payment proof,
      AIMT's = "here's how to start").
- [ ] **Settings → Branding → Custom domains** — attempt "Add domain" for
      `pay.aimtrichology.com` and see what Stripe shows. Feasibility: the
      mechanism (subdomain + Stripe-issued CNAME target + auto TLS) is the
      same pattern as the Cloudflare Pages custom domain already in use for
      this site, and DNS is confirmed clean (`pay.aimtrichology.com` has no
      existing CNAME to conflict). Whether this specific account is eligible
      today (activation/verification status) can only be confirmed by
      attempting it live in the Dashboard — if offered, Stripe will show an
      account-specific CNAME target to add at your DNS provider.
      **This may be a paid or plan-tier-gated Stripe feature — not
      confirmed free from this repo/session.** `pay.aimtrichology.com`
      stays explicitly **optional and not launch-blocking**: ship without
      it if Stripe wants an upgrade for it, and revisit post-launch.

---

## Explicit confirmation

Nothing in this checklist has been applied. No Stripe/Supabase Dashboard
setting was changed, no DNS record was added, no Resend account was
created, no real email was sent. All items above are owner (or future
development) actions.
