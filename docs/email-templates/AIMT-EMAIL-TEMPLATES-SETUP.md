# AIMT Transactional Email Templates — Setup Doc

Companion to
`docs/stripe-and-email/AIMT-STRIPE-EMAIL-BRANDING-AUDIT-2026-09-15.md`
(Part 2). This doc explains exactly where each template file gets pasted,
which template variables to use, and the exact SMTP/DNS values the owner
needs. **Nothing described here has been applied to production** —
Supabase Dashboard, DNS, and any real send are all owner actions.

## Two different delivery mechanisms — don't conflate them

Supabase Auth only ever sends email for its own fixed set of triggers
(signup confirmation, password reset, email change, invite, magic link,
reauthentication OTP) and only supports **one template per trigger type** —
there's no way to send different copy for the same trigger based on
context. Everything else AIMT wants to send (enrollment confirmation,
certificate earned, review/remediation acknowledgments, a distinctly
worded "your account is ready" invite, a security notice) is not a
Supabase Auth event at all — it's an AIMT business event, and has to be
sent by AIMT's own backend code calling an email API (Resend) directly.

This is why the templates are split into two folders:

- **`supabase-auth/`** — paste directly into Supabase Dashboard →
  Authentication → Email Templates. Supabase renders these itself, on its
  own triggers, using its own `{{ .Variable }}` syntax (Go `html/template`).
- **`custom-resend/`** — plain HTML with `{{PLACEHOLDER}}` markers meant
  for a future Cloudflare Function to string-replace and POST to Resend's
  `/emails` API directly. **No send code exists yet for any of these six**
  — see "Recommended trigger point" per template below. This mirrors the
  pattern already in this codebase where a delivery seam is deliberately
  left unwired until the owner decides to wire it.

---

## Part A — Supabase Auth Dashboard templates

Path: **Supabase Dashboard → Authentication → Email Templates**. Each
template type below is a separate tab in that screen. Paste the
corresponding file's full HTML into that tab's editor and save. Supabase
strips `<script>` tags from these regardless of what you paste, so none of
the templates use one.

### 1. "Confirm signup" → `supabase-auth/confirm-signup.html`

- **Real trigger, active today:** `success.html` calls
  `supabaseClient.auth.signUp(...)` after a successful Stripe checkout.
  If your project has "Enable email confirmations" on (Authentication →
  Providers → Email), this fires immediately.
- **Variable used:** `{{ .ConfirmationURL }}` — the only one needed. Do
  not rename or wrap it; Supabase substitutes it verbatim.
- Other variables Supabase makes available here if you want them later:
  `{{ .SiteURL }}`, `{{ .Email }}`, `{{ .Token }}` (6-digit OTP form of
  the same link), `{{ .TokenHash }}`.

### 2. "Reset Password" → `supabase-auth/reset-password.html`

- **Real trigger, active today:** the "Forgot your password?" link on
  `student-access.html` calls `resetPasswordForEmail(email, { redirectTo:
  ".../student-access.html" })`. `student-access.html` already has full
  recovery-link handling built in (`exchangeCodeForSession`,
  `verifyOtp({type:'recovery'})`, then `updateUser({password})`) — this
  template just needs to link back into that existing flow.
- **Variable used:** `{{ .ConfirmationURL }}`.

### 3. "Change Email Address" → `supabase-auth/change-email.html`

- **Not currently triggered by anything in the app.** Grepped the whole
  repo for `updateUser({ email: ...})` — it doesn't exist. There is no
  "change your email" UI today. This template is prepared so that the
  *instant* someone adds that feature, Supabase already has correct,
  on-brand copy waiting — it costs nothing to paste in now, and Supabase
  ships this template slot by default regardless.
- **Variables:** `{{ .ConfirmationURL }}` and `{{ .NewEmail }}` (shows the
  address being confirmed).

**Not included, and why:**
- **"Invite user"** — Supabase's built-in invite template fires only when
  code calls the admin `inviteUserByEmail` endpoint. `grantAccess()` in
  `functions/api/admin/index.js` does not call that — it calls
  `admin/users` (`createUser`) directly with `email_confirm: true`, which
  sends **no email at all**. Pasting copy into Supabase's native Invite
  template would do nothing for this flow. See `custom-resend/
  invite-manual-grant.html` instead — that's the one that actually matches
  what this app does.
- **"Magic Link"** and **"Reauthentication"** — no `signInWithOtp` call
  anywhere in the repo. Not a feature this app has today. Skipped rather
  than invented.

---

## Part B — Custom sends via Resend

**Priority (2026-09-15, later pass):** item 4 (manual-grant invite) is now
**implemented and pre-launch** — see below; it's the one genuinely
code-backed gap (a manually granted student got no email at all) and the
owner's stated preference was to close it now rather than defer it. Items
5–8 remain **not wired, and are after-launch, lower-priority work** — each
is still ready-to-use HTML with `{{PLACEHOLDER}}` tokens (plain string
markers, **not** Supabase syntax) for a future Cloudflare Function to fill
in before POSTing to Resend's API; the "recommended trigger point" for each
is where that future function call would go. None of the four were found to
be as safely wireable as item 4 in this pass — 5 (enrollment-confirmation)
would require editing `functions/api/stripe-webhook.js`, which is
explicitly off-limits to touch here (payment/entitlement logic, per
CLAUDE.md hard rule #1); 6–8 touch certification/review paths that were
out of the scope given for this pass. Item 9 (password-changed) is covered
separately above — reclassified, not built.

### 4. `custom-resend/invite-manual-grant.html` — IMPLEMENTED (2026-09-15)

- **Matches the real flow exactly:** `grantAccess()`'s own response
  already says *"Account created. Have the student open Student Access and
  use 'Forgot your password?' to set their password, then sign in
  normally."* This email says the same thing, from AIMT directly, with a
  CTA button to Student Access — closing the gap where today a manually
  granted student gets told this by a human, or not at all, instead of by
  email.
- **Send code now lives at:** `functions/_lib/admin/manual-grant-invite-email.mjs`
  (the actual `fetch()` call to Resend, the template rendering, and the
  idempotency/dedupe check — see "Idempotency" section below), called from
  `grantAccess()` in `functions/api/admin/index.js` right after
  `ensureAuthUser` returns `{ created: true }` — i.e. only for brand-new
  accounts created via manual grant, never for granting an *existing*
  account additional access (that path already has a working sign-in).
  Tests: `tests/admin-manual-grant-invite.test.mjs` (new, separate file —
  does not touch `tests/admin-mvp.test.mjs` / `tests/admin-mvp-behavior.test.mjs`).
- **Still an owner action:** generate a Resend API key and set
  `RESEND_API_KEY` in the Cloudflare Pages environment variables (Pages
  project → Settings → Environment variables). Until that's set, the code
  safely skips sending (entitlement/account creation is unaffected either
  way) and records why in the admin response and audit log — see
  "Failure semantics" below.
- **Reply-to:** `support@aimtrichology.com`, set explicitly in the Resend
  API payload (`reply_to`) — independent of whatever Supabase's own SMTP
  Reply-to field situation turns out to be (see the Reply-to correction
  above).
- **Placeholders:** `{{FIRST_NAME}}`, `{{STUDENT_ACCESS_URL}}` — same
  template file, unmodified; only the send code around it is new.

### Idempotency for custom Resend sends (item 6, 2026-09-15)

Every custom Resend send in Part B — implemented now (item 4) or wired
later (items 5–8) — must use a **deterministic idempotency key tied to the
triggering event**, so a webhook/action retry can never send the same
transactional email twice. The keys, one per trigger type:

| Trigger | Idempotency key |
|---|---|
| Manual grant (item 4, implemented) | `admin-grant/<grant-id>` |
| Stripe enrollment (item 5) | `enrollment/<checkout-session-id>` |
| Certificate issuance (item 6 template / "certification-earned.html") | `certificate/<credential-id>` |
| Review request received (item 7 template) | `review/<request-id>` |
| Educator remediation request received (item 8 template) | `remediation/<request-id>` |

**Implementation choice for item 4 (and the recommended default for
5–8 when they're built): a dedupe-before-send guard against
`admin_audit_log`, not Resend's own `Idempotency-Key` header.** Resend does
support an idempotency-key mechanism on its `/emails` endpoint (this send
still attaches one, as defense-in-depth), but this environment has no way
to place a live call against Resend's API to confirm that contract's exact
behavior — verifying it would require the real key and a real send, both
out of bounds here. Anchoring correctness to something fully verifiable in
tests — this repo's own audit-log read-before-write check — is the safer,
provable choice, versus trusting an unconfirmed third-party guarantee. See
`functions/_lib/admin/manual-grant-invite-email.mjs` (module header
comment) for the exact mechanism: before sending, it scans existing
`admin_audit_log` rows for the `grant_course_access` action, looking for
one that already recorded a successful send under the same
`admin-grant/<grant-id>` key, and skips the send if found. The result is
folded into the *same* `grant_course_access` audit row `grantAccess()`
already writes once per call — deliberately not a second row — so a
manual grant is still exactly one `admin_audit_log` row, matching the
row-count invariants the existing Admin MVP test suite already asserts.

**Failure semantics (owner's stated preference, implemented exactly this
way for item 4):** a failed Resend send, or a missing `RESEND_API_KEY`,
never rolls back the entitlement/account already created, and never
throws. The result (`sent`, `attempted`, `reason`, `warning`, etc.) is
returned in the admin API's JSON response and recorded in the
`grant_course_access` audit row's `details.inviteEmail`, so the owner can
see the invite failed and knows a manual follow-up (telling the student
directly) is needed. No auto-resend mechanism exists or is planned as part
of this — resending later is a possible future manual action, not built
here.

### 5. `custom-resend/enrollment-confirmation.html`

- **AIMT-controlled only** — this is not the Stripe receipt (that's
  Stripe's own email, governed by the Stripe Dashboard toggle in Part 1
  §6.3, and already exists independently of anything here). This is the
  "welcome, here's how to start" email.
- **Recommended trigger point:** `stripe-webhook.js`, right after
  `upsertEntitlement()` succeeds (the point where a paid purchase becomes
  a real, server-confirmed entitlement row) — this makes it fire off the
  unconditional server-side path rather than depending on the buyer ever
  reaching `success.html`.
- **Placeholders:** `{{FIRST_NAME}}`, `{{COURSE_ENTRY_URL}}`.

### 6. `custom-resend/certification-earned.html`

- **Recommended trigger point:** `functions/api/issue-certificate.js`,
  right after a new credential ID is generated (not on the idempotent
  "already issued" path — only the first time).
- **Placeholders:** `{{FIRST_NAME}}`, `{{CREDENTIAL_ID}}`,
  `{{VERIFY_URL}}` (should point at `verify.html?id=...` per the existing
  verifiable-certificate feature).

### 7. `custom-resend/review-request-received.html`

- **Real, code-backed event:** `request-review.js` inserts a
  `certification_review_requests` row with `status: 'open'` after
  validating the attempt belongs to the caller. Resolution happens
  manually, out of band — there is no code path that ever marks it
  resolved automatically, so this template is **acknowledgment-of-receipt
  only**. It deliberately does not promise a timeline the code can't back
  up.
- **Recommended trigger point:** `request-review.js`, after the insert
  succeeds.
- **Placeholders:** `{{FIRST_NAME}}`.

### 8. `custom-resend/educator-remediation-request-received.html`

- **Real, code-backed event:** `request-educator-remediation.js` inserts a
  `certification_educator_requests` row with `status: 'requested'`. Its
  own header comment says scheduling happens "manually... out of band, not
  via a student-facing API" — so again, acknowledgment-only, no invented
  "your session is scheduled for..." claim.
- **Recommended trigger point:** `request-educator-remediation.js`, after
  the insert succeeds (only on the non-`alreadyRequested` branch).
- **Placeholders:** `{{FIRST_NAME}}`.

### 9. `custom-resend/security-password-changed.html`

- **Correction (2026-09-15, later pass): a bespoke Cloudflare Function for
  this is removed from the required/recommended dev plan.** The prior
  version of this doc recommended building a brand-new Cloudflare Function
  purely so `student-access.html` could call it right after
  `updateUser({ password })` succeeds, so this custom template could be
  sent. That's new custom infrastructure duplicating a security
  notification that a proper Auth provider would normally send natively —
  worth avoiding rather than building a second, competing send path.
- **What Supabase's own template set actually offers here — checked, not
  assumed:** Part A above lists the three Supabase Auth Dashboard template
  types this repo's real flows actually use or could plausibly use:
  Confirm signup, Reset Password, Change Email Address (plus Invite user,
  Magic Link, Reauthentication — all skipped as inactive). **There is no
  distinct native "password changed" / "password was changed, wasn't you?"
  security-notification template in that list.** "Reset Password" is the
  *recovery-link* email (sent when a reset is requested) — a different
  event from a post-change confirmation notice. No MCP tool in this
  environment exposes Supabase's live Email Templates screen, so this can't
  be re-verified against the current dashboard beyond what's documented
  here and in Supabase's publicly documented template set; if a future pass
  finds the live dashboard *does* expose a relevant native template or
  toggle for this, brand that one directly (Authentication → Email
  Templates, same as Part A) instead of building anything custom.
- **Status:** reclassified alongside the other not-yet-wired custom sends
  in the "Priority" note at the top of Part B — after-launch, not
  pre-launch. `custom-resend/security-password-changed.html` stays
  prepared and on-brand for whenever this is picked up, but no send code
  and no new backend endpoint exist for it, and none should be built as
  part of the current pre-launch pass.
- **Placeholders:** `{{FIRST_NAME}}`, `{{STUDENT_ACCESS_URL}}` (as a
  "wasn't you?" link back to Student Access to reset again / contact
  support) — unchanged, template itself was not touched.

---

## Design system used (sourced from the live codebase, not invented)

Read directly, read-only, from `headspa-mastery.html` `:root` (lines
61–103) and `assets/css/aimt-design-system.css` `:root` (the fuller,
canonical token file — the actual source of truth for weights,
letter-spacing, and spacing rhythm, not just color):

| Token | Value | Used for |
|---|---|---|
| `--bg` | `#faf8f5` | Email page background (warm ivory) |
| `--white` | `#ffffff` | Content card background |
| `--border` | `rgba(0,0,0,0.06)` | Card border |
| `--text` / `--accent` | `#262626` | Headings, body text, CTA button fill |
| `--muted` | `#a3968d` | Eyebrow labels, footer text |
| `--surface` | `#f0ede8` | Credential-ID highlight box background |
| `--aimt-radius-panel` | `16px` | Card corner radius |
| `--aimt-radius-pill` / `--aimt-btn-pill-radius` | `980px` | Button shape (email uses `999px`, the universal email-safe stand-in for `980px`/full pill — functionally identical at button height) |
| `--aimt-font-serif` | `'Playfair Display', Georgia, serif` | Headline (email uses the `Georgia, serif` fallback directly — most mail clients strip `@font-face`/Google Fonts imports, so the design intentionally leans on the same fallback stack already declared in the codebase rather than assuming a webfont loads) |
| `--aimt-font-sans` | `'Outfit', -apple-system, system-ui, sans-serif` | Body copy |
| `--aimt-font-mont` | `'Montserrat', Arial, sans-serif` | Button label, eyebrow, wordmark |
| `--aimt-font-mono` | `'SF Mono', 'Fira Code', monospace` | Eyebrow labels, credential ID (email adds `Consolas` as a third fallback for Windows Outlook, since neither SF Mono nor Fira Code ship there — a legitimate email-safe extension of the real stack, not a substitution of it) |
| `--aimt-weight-semibold` | `600` | CTA button label weight |
| `--aimt-track-cta` | `0.1em` | CTA button label letter-spacing (at 12px ≈ `1.2px`) |
| `--aimt-track-label-sm` | `0.18em` | Eyebrow label letter-spacing (at 11px ≈ `2px` — templates already matched this) |
| `--aimt-color-text-primary` | `#ffffff` | Dark-mode (`prefers-color-scheme: dark`) heading/body text |
| Dark surfaces (`--hero-bg2` / `--aimt-color-bg-primary`) | `#1a1814` | `prefers-color-scheme: dark` page background |
| Dark surfaces (`--hero-bg` / `--aimt-color-bg-secondary`) | `#262626` | `prefers-color-scheme: dark` card background |

**Corrected in this pass — `--accent2` vs `--aimt-walnut` are NOT the same
token.** The prior table conflated them as interchangeable. They are two
distinct custom properties in `headspa-mastery.html`'s `:root` with two
distinct hex values:
- `--accent2: #4d403a` — used 29× sitewide, almost entirely for
  secondary-accent states (focus outlines, progress fills, active-tab
  backgrounds) — never for a text link.
- `--aimt-walnut: #5A4B3F` — used 3×, specifically and only as inline text
  **link** color (`.m11-ai-fullsize-link` and its `:visited` state, line
  3029–3030).

Since the templates use this color exclusively for hyperlinks (the raw
`{{ .ConfirmationURL }}` fallback link, `mailto:support@...`), the
semantically-correct token is `--aimt-walnut` (`#5a4b3f`), not `--accent2`
(`#4d403a`) — every template has been updated to the correct value.

**Other real-CSS-grounded corrections made in this pass** (verified against
live pages, not the prior doc's own table):
- **Wordmark size:** the header `AIMT` wordmark used `13px` — the real
  nav wordmark (`.aimt-public-nav-name` in `assets/css/aimt-public-nav.css`
  line 75) is `font-size: 0.68rem` (≈`11px`) at `font-weight: 700`,
  `letter-spacing: 0.38em`. Corrected the email wordmark to `11px` (kept
  the existing `4px` tracking, which already lands within ~1px of
  `0.38em` at this size — an exact `0.38em` value would print unevenly at
  email font-rounding precision, so the nearest clean pixel value was kept).
- **CTA button label weight/tracking:** was `font-weight:700;
  letter-spacing:1.5px`. No live button on the site actually uses weight
  700 for its label — the real page-content primary buttons
  (`success.html` `.btn-primary`, `student-access.html` `.btn-primary`)
  use `font-weight: 600` with `letter-spacing` in the `0.1–0.12em` range,
  matching the dedicated `--aimt-track-cta: 0.1em` token exactly. Corrected
  to `font-weight:600; letter-spacing:1.2px` (`0.1em` at 12px) across all
  six buttoned templates, including the Outlook/MSO `<v:roundrect>`
  fallback.
- **Dark-mode color values were invented, not sourced:** `#f5f1ea` (dark-mode
  heading/body/wordmark text) and the dark-mode button pairing
  `background:#f5f1ea` / `color:#1a1814` do not appear anywhere in the live
  CSS — grepped the whole repo, zero hits outside these email templates.
  Replaced with real tokens: heading/body/wordmark text →
  `--aimt-color-text-primary` (`#ffffff`); the dark-mode button fill/text
  pair → the actual light-button-on-dark-card pairing used in
  `success.html` (`.btn-primary { background:#f2eee8; color:#1a1714 }`,
  lines 292–293) — the one real precedent on the site for this exact
  pattern (light pill button sitting on a dark surface). Also tightened
  `certification-earned.html`'s dark-mode credential-ID box from invented
  `rgba(255,255,255,0.06)` / `0.12` to the real `--aimt-card-bg-hover`
  (`rgba(255,255,255,0.045)`) / `--aimt-border-strong` (`rgba(255,255,255,0.08)`)
  pair.
- Confirmed already-correct and left untouched: eyebrow-label tracking
  (`11px`/`2px` ≈ `--aimt-track-label-sm: 0.18em`, exact match), the
  `--aimt-warning` (`#8b5e00`) and `--aimt-error` (`#7a3030`) semantic
  colors in `security-password-changed.html`, and the credential-ID box's
  light-mode background (`#f0ede8` = `--surface`, exact match).

Note on CLAUDE.md: it describes the site's aesthetic as "Cormorant
Garamond / dark, quiet, institutional." The live `:root` tokens actually
declare **Playfair Display** as `--aimt-font-serif` (the institutional-tier
heading font used on `verify.html`/`terms.html`/`privacy.html`) — Cormorant
Garamond does not appear anywhere in the current CSS. Used the real,
currently-live token rather than the possibly-stale font name; flagging the
discrepancy rather than silently picking one.

Every template is table-based HTML (not flexbox/grid) with an inline-styled
"bulletproof button" (a `<table>`-wrapped `<a>`, MSO conditional comments
for Outlook), max-width 600px, a `prefers-color-scheme: dark` block for
clients that honor it (Apple Mail, iOS/macOS Mail, Outlook.com — not
Gmail, which ignores media queries; the light version is a safe universal
fallback there), and a plain `mailto:support@aimtrichology.com` +
Terms/Privacy footer matching the site's existing footer nav pattern
(`terms.html` line 141).

---

## AIMT mark for email

The wordmark-as-text header (`AIMT` in tracked-out Montserrat) is used
instead of a graphic logo across all nine templates — deliberately: text
always renders, never breaks on a dead image link, and needs no public
hosting URL. This is not a limitation being worked around; it's the more
reliable choice for transactional email specifically.

For the optional case where a graphic mark is wanted (e.g. inside a future
marketing send, if AIMT ever adds one within the existing scope), the real
source asset is **`favicon.svg`** (repo root) — a self-contained,
color-committed circular follicle-orbit mark: oxblood fill `#4a1f27` with
taupe/silver (`#c9c4bd`) orbit linework. This is the correct source for
email use, **not** `assets/brand/aimt-orbital-mark.svg` — that file uses
`currentColor` and depends on the *referencing* element's CSS `color` to
render (by design, for sitewide reuse across light/dark contexts); it
renders as invisible/black-on-transparent with no inherited color, which
is exactly the failure mode its own file header documents for cross-file
`<use>`. `favicon.svg` carries its own fixed colors and needs no CSS
context, which is what a raster email asset requires.

Email clients do not render inline SVG reliably (Outlook and many mobile
clients skip it entirely), so it needs a raster export. No SVG rasterizer
(`rsvg-convert`, ImageMagick, Inkscape, `cairosvg`) is installed in this
environment — but macOS's built-in QuickLook thumbnailer (`qlmanage -t`)
renders SVG faithfully and was used as a legitimate substitute. Produced
and verified (visually diffed against the source — matches exactly):

- `docs/email-templates/assets/aimt-mark-email.png` — 160×160, transparent
  background, alpha channel confirmed via `sips`.
- `docs/email-templates/assets/aimt-mark-email@2x.png` — 320×320, same
  content, for HiDPI/retina `<img>` `srcset` use.

**Before this can be used in a real send:** these PNGs need to live at a
public URL — email `<img src>` cannot reference a local repo path. Host
them under the live site (e.g. `https://aimtrichology.com/assets/...`) or
wherever the Resend send code will pull static assets from. Not done here
— no live site file was touched, per the task boundary.

As a related, already-flagged action item from the Stripe audit (Part 1
§5 of `AIMT-STRIPE-EMAIL-BRANDING-AUDIT-2026-09-15.md`): the same
`favicon.svg` source, exported the same way at 512×512, has also been
produced at `docs/stripe-and-email/assets/aimt-stripe-icon-512.png` —
ready for the owner to upload directly at Stripe Dashboard → Settings →
Branding, closing that action item's asset-prep step.

---

## Supabase SMTP configuration (Authentication → Settings → SMTP Settings)

Recommended provider: **Resend**, sending subdomain
`auth.aimtrichology.com`.

| Field | Value |
|---|---|
| Sender email | `no-reply@auth.aimtrichology.com` |
| Sender name | `AIMT` |
| Host | `smtp.resend.com` |
| Port | `465` (implicit TLS) or `587` (STARTTLS) — either works with Resend |
| Username | `resend` (literal string — Resend's SMTP username is always this) |
| Password | your Resend **API key** (starts `re_...`) — pasted as the SMTP password field, not stored anywhere in this repo |

**Reply-to — correction (2026-09-15, later pass): do not treat "Reply-to" as
a guaranteed field on this screen.** No MCP tool in this environment exposes
Supabase's live Auth SMTP configuration, so its exact current field set
cannot be confirmed from here, and the previous version of this table
listed Reply-to as if it were a certain field, which overstated what's
actually known. The correct instruction is conditional: **if** Supabase's
SMTP Settings screen shows a Reply-to (or equivalently named) field when you
actually open it, set it to `support@aimtrichology.com`; **if it doesn't**,
don't invent one or work around its absence — just leave it unset for the
three Supabase Auth templates (confirm-signup, reset-password, change-email;
Part A above). This only affects those three Supabase-triggered emails. It
does not affect the custom Resend sends in Part B (starting with the
manual-grant invite, now implemented — see that section): those are plain
`fetch()` calls this codebase controls directly, and they set
`reply_to: "support@aimtrichology.com"` explicitly in the API payload
regardless of anything in the Supabase dashboard.

Resend requires you to verify `auth.aimtrichology.com` as a **sending
domain** in the Resend dashboard first (Domains → Add Domain); it then
gives you the exact DKIM/SPF records to add, which will match the pattern
below but with Resend's real, generated DKIM public key — don't hardcode a
placeholder key as if it were real.

## DNS records for `auth.aimtrichology.com`

Verified live via `dig` (read-only, no changes made): `auth.aimtrichology.com`
currently has **no TXT records at all** — clean slate, nothing to
conflict with.

**Correction (2026-09-15, later pass): add every DNS record Resend's
dashboard shows you for this domain at the moment you add it — do not
pre-assume the record set is only SPF + DKIM + DMARC.** The example values
below are illustrative, sourced from how Resend has worked historically —
they are not a substitute for what the live dashboard displays. Resend's
domain-verification screen is the source of truth: depending on the
account/region and whatever Resend's product looks like when this is
actually done, it may also show an MX record and/or a return-path-related
record in addition to SPF/DKIM (some providers require a receiving MX on
the sending subdomain for bounce/complaint handling — this has nothing to
do with `auth.aimtrichology.com` receiving real mail, it's purely
plumbing for Resend's own delivery infrastructure). Add **every** record
the dashboard lists for `auth.aimtrichology.com`, using the **exact live
values shown at that moment** — never substitute a value from this
document or from general knowledge about Resend for what the dashboard
itself displays.

Add these at the DNS host that manages `aimtrichology.com` (whichever
registrar/DNS provider that is — not modified here). What follows is the
illustrative baseline set (SPF, DKIM, DMARC) most likely to appear —
confirm against, and add anything beyond, what Resend's dashboard actually
shows:

```
Type: TXT
Host: auth.aimtrichology.com
Value: v=spf1 include:amazonses.com ~all
```
*(Resend sends via Amazon SES infrastructure under the hood as of this
writing — confirm the exact `include:` value Resend's own dashboard shows
you when you add the domain; it has been `amazonses.com` historically but
treat Resend's dashboard as the source of truth over this document.)*

```
Type: CNAME  (Resend issues 3 of these, exact names/values from their dashboard)
Host: resend._domainkey.auth.aimtrichology.com   (example — Resend generates the real subdomain + target)
Value: <Resend-provided DKIM target>
```

```
Type: TXT
Host: _dmarc.auth.aimtrichology.com
Value: v=DMARC1; p=none; rua=mailto:support@aimtrichology.com
```

**If Resend's dashboard shows anything beyond these three** (an MX record,
a return-path/bounce CNAME, or anything else scoped to
`auth.aimtrichology.com` or one of its sub-labels), add that too, exactly
as shown. None of it can affect the root domain's Google Workspace mail —
see "Why a subdomain is safe" below — so there is no risk in adding
whatever Resend asks for under this specific subdomain.

**Why a subdomain is safe:** SPF/DKIM/DMARC are evaluated per exact
hostname in the sending domain, not inherited across subdomains. Adding
records under `auth.aimtrichology.com` cannot change how mail from
`aimtrichology.com` itself (the root domain, where `info@`/`support@`/
`hello@` live on Google Workspace, confirmed live via `dig`: `MX 10
smtp.google.com`, `TXT "v=spf1 include:_spf.google.com ~all"`) is
evaluated by receiving mail servers. This is the entire reason to use a
dedicated subdomain instead of trying to send AIMT's transactional mail
from `aimtrichology.com` directly, which would require merging Resend's
SPF `include:` into the *same* TXT record Google Workspace already needs
(fragile, and one typo away from breaking `info@`/`support@`/`hello@`).

**Correction (2026-09-15, later pass) — elevated from awareness-only to
recommended before launch:** `_dmarc.aimtrichology.com` (the root domain)
has **no DMARC record at all** today, discovered during the live `dig`
check above. This was previously flagged here only for awareness with no
urgency. Full owner steps (verify Google Workspace SPF — already confirmed
live — verify Google Workspace DKIM, then add a conservative `p=none`
root-domain DMARC record and monitor before ever tightening it) are now in
`AIMT-EMAIL-STRIPE-SETUP-CHECKLIST.md`, section "2e. Root domain
(`aimtrichology.com`) email authentication — RECOMMENDED BEFORE LAUNCH." It
remains a completely separate DNS record from `_dmarc.auth.aimtrichology.com`
above — different hostname, evaluated independently, cannot conflict with
or be satisfied by the subdomain record either way.

---

## Explicit confirmation

No template was pasted into the live Supabase Dashboard. No Resend account
was created or verified. No DNS record was added. No real email was sent.
The only network activity performed while producing this doc was read-only
public DNS lookups (`dig`, no mutations possible) and read-only Supabase
MCP calls.
