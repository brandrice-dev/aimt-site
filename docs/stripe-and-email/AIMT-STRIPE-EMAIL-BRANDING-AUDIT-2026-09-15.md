# AIMT Stripe Checkout Branding + Transactional Email — Audit & Prepare (2026-09-15)

**Scope:** Audit-and-prepare only, on `course-audit-build`. No live Stripe
Dashboard, Supabase Dashboard, DNS, or Google Workspace change was made. No
Stripe API call was made (no Stripe MCP connector exists in this
environment, and no live secret key was used for anything). No real email
was sent. This document, the setup doc, and the template files under
`docs/email-templates/` are the entire deliverable — everything else stays
exactly as it was.

---

## PART 1 — STRIPE CHECKOUT BRANDING AUDIT

### 1. What was inspected

- `functions/api/create-checkout-session.js` — full read.
- `functions/api/stripe-webhook.js` — full read (entitlement write path).
- `functions/api/claim-course-access.js` — full read (claim/link path).
- `headspa-mastery.html` `:root` (lines 61–103) and
  `assets/css/aimt-design-system.css` `:root` (lines 22–90) — read-only, to
  source AIMT's real color tokens rather than invented ones.
- `favicon.svg` — the only icon/logo-shaped asset in the repo.
- Repo-wide search for a `_redirects`/clean-URL config (none found — see
  §6).

### 2. What the code currently controls vs. what is Dashboard-only

**`create-checkout-session.js` sets, today, exactly this and nothing more:**

```
mode: 'payment'
line_items[0][price]: env.STRIPE_PRICE_ID
line_items[0][quantity]: 1
success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`
cancel_url:  `${origin}/courses.html?checkout=canceled`
```

No `payment_method_types`, `custom_text`, `customer_email`, `metadata`,
`automatic_tax`, `allow_promotion_codes`, `phone_number_collection`, or
`locale` is set. `stripe-webhook.js` and `claim-course-access.js` only ever
*read* Stripe (session + line-items fetch) — neither writes anything
Checkout-page-visible.

**Everything a customer perceives as "branding" on the Checkout page lives
in the Stripe Dashboard, at the account level, not in this API call, and I
cannot see or change any of it from here:**

| Branding element | Where it lives |
|---|---|
| Business/public name shown on Checkout | Settings → Business → Public details |
| Icon, logo, accent (brand) color | Settings → Branding |
| Whether Stripe's own "payment successful" receipt email fires | Settings → Emails (Customer emails) |
| Which payment methods appear | Settings → Payment methods |
| Custom domain for Checkout/Payment Links | Settings → Branding → Custom domains |
| Live vs. test mode, account country/currency | Account-level, not exposed via this API call |

I have **no way to read any of the above** from this repository or from any
tool available in this session — there is no Stripe MCP connector, and
calling the live Stripe API with a discovered key was explicitly out of
bounds for this task. Section 4 below is a set of *recommendations*, not a
report of current live values. Nothing in this document should be read as
"the Dashboard currently shows X" — I don't know what it currently shows.

### 3. What Stripe supports today (my knowledge — confidence flagged)

**High confidence:**
- Icon + logo + accent color are uploaded once in **Settings → Branding**
  and are then reused everywhere Stripe renders your identity: Checkout,
  Payment Links, and Stripe-hosted invoices/receipts.
- The icon is a small square mark; the logo is a wider rectangular mark
  shown near the top of the Checkout page. Both accept PNG/JPG. A
  transparent background is recommended for the icon specifically so it
  doesn't sit in a colored box.
- "Email customers about successful payments" is a single Dashboard toggle
  (Settings → Emails) that controls whether Stripe's own receipt email
  fires at all. When it fires, it's styled with the same Branding assets.
- **Custom domain for Checkout/Payment Links** is a self-serve Dashboard
  flow: Settings → Branding → Custom domains → "Add domain." You give
  Stripe a subdomain (e.g. `pay.aimtrichology.com`); Stripe then shows you
  an **account-specific CNAME target** to create at your DNS provider, and
  auto-provisions TLS once that CNAME resolves and Stripe verifies it. This
  is a single domain covering both Checkout Sessions and Payment Links.

**Medium confidence — verify live before treating as fact:**
- Stripe's stated minimum/recommended pixel dimensions and file-size caps
  for the icon/logo upload have shifted release to release; don't hardcode
  a number from training data as gospel — the live upload dialog states
  the current numbers at the moment of upload.
- Whether custom Checkout domains require the account to be fully
  activated/verified (not in a restricted/pending state) before the option
  even appears. I believe full activation is required; I'm not certain
  it's the *only* gate.
- Whether there's any plan-tier or geography restriction on custom
  domains today. **Correction (2026-09-15, later pass): treat this as
  possibly a paid or plan-tier-gated Stripe feature.** The original text
  here said "I'm not aware of a paid plan gate" — that was an
  under-confident phrasing of an unconfirmed absence, not a verified fact,
  and this repo/session has no way to check Stripe's current plan-tier
  feature matrix or this account's billing tier. Do not treat custom
  Checkout/Payment Link domains as free-and-available until the live
  Dashboard confirms it (Settings → Branding → Custom domains — if Stripe
  requires an upgrade or shows a paywall, that's the answer). Account mode,
  country, verification status, and billing tier are all unconfirmable from
  the repository.

**Bottom line on `pay.aimtrichology.com`:** the *mechanism* (subdomain +
CNAME + Stripe-issued TLS) is realistic and exactly matches how this kind
of custom-domain feature works elsewhere (e.g., Cloudflare Pages custom
domains, already in use for this site). Whether *this specific account* is
eligible for it today is something only the live Dashboard can answer —
mode and verification status are not visible from code. Action: attempt
"Add domain" in Settings → Branding → Custom domains and report what Stripe
shows.

### 4. Recommended settings, using AIMT's real tokens

Read directly from `headspa-mastery.html` `:root` (not invented):

```
--text / --accent   : #262626   (charcoal — used for every primary CTA sitewide)
--accent2 / --aimt-walnut : #4d403a / #5A4B3F   (walnut)
--muted              : #a3968d   (taupe)
--bg                 : #faf8f5   (warm ivory)
--aimt-oxblood       : #4B1E24   (reserved brand accent — see favicon note below)
```

Recommendation:

- **Accent/brand color in Stripe Branding: `#262626`.** This is the one
  color Stripe uses for the Pay button and links on its own Checkout page,
  so it should be AIMT's actual "you click this" color — matching every
  primary CTA already on the live site — not the quieter taupe, which
  reads as secondary/muted everywhere else in the design system.
- **Business name:** the site's own nav/footer wordmark is the short form
  "AIMT" (confirmed in `student-access.html` and `terms.html`'s footer
  nav). Recommend "AIMT" as the Checkout-page-visible name, with the full
  "American Institute of Modern Trichology" reserved for the Public
  business details / legal fields, matching how `terms.html` itself
  introduces the name once (`"American Institute of Modern Trichology
  ('AIMT,' 'we,' 'us')"`).
- **Icon:** the repo's only icon-shaped asset is `favicon.svg` — a circular
  follicle-orbit mark, oxblood (`#4a1f27`, essentially `--aimt-oxblood`)
  with taupe/silver linework (`#c9c4bd`). It's already circular, so it
  crops cleanly into Stripe's square icon slot with natural padding.
  **Stripe's upload accepts raster PNG/JPG, not SVG** — export this SVG to
  a transparent-background PNG (see asset spec below) rather than
  designing a new mark.
- **Logo:** there is no separate wide-format logo lockup file in the repo
  today (the "AIMT" wordmark only exists as styled live text/CSS, never as
  an exported image). Recommend either (a) skip the logo field — icon +
  business name alone renders fine on Checkout — or (b) export a simple
  "AIMT" wordmark PNG matching the site's Montserrat treatment if the
  owner wants the fuller lockup. Not required to get correct branding.

### 5. Exact assets needed

| Asset | Format | Notes |
|---|---|---|
| Icon | PNG, transparent background, square, **export at 512×512** (comfortably above Stripe's stated 128×128 minimum, future-proofed against spec changes) | Source: `favicon.svg`, exported to raster — do not redesign. **Produced** in the 2026-09-15 refinement pass: `docs/stripe-and-email/assets/aimt-stripe-icon-512.png` (512×512, transparent background, alpha confirmed via `sips`, rendered via macOS `qlmanage -t` since no SVG rasterizer was installed — visually verified to match `favicon.svg` exactly). Ready for direct upload at Settings → Branding; no further export step needed. |
| Logo (optional) | PNG or JPG, rectangular, e.g. 600×160 | Not currently in repo; skip unless owner wants to invest in one |

### 6. Owner action list — Stripe Dashboard (nothing here was done for you)

1. Settings → Business → Public details: confirm/set business name
   ("AIMT"), support email (recommend `support@aimtrichology.com`, one of
   the three live Workspace addresses), support phone/URL if desired.
2. Settings → Branding: upload the exported icon PNG, set accent color to
   `#262626`, optionally upload a logo.
3. Settings → Emails (Customer emails): confirm whether "Email customers
   about successful payments" is ON. This is Stripe's own receipt — it is
   independent of, and not redundant with, the AIMT-sent enrollment
   confirmation designed in Part 2 (Stripe's email = payment proof; AIMT's
   = "here's how to start your course").
4. Settings → Branding → Custom domains: attempt "Add domain" for
   `pay.aimtrichology.com`. Stripe will display an account-specific CNAME
   target at that point — add it in DNS per §7 below. Report back whether
   the option was available/gated for this account. **This may be a paid
   or plan-tier-gated Stripe feature — confirmed uncertain, not confirmed
   free** (see §3 correction above). `pay.aimtrichology.com` stays entirely
   optional and is not launch-blocking either way; ship without it if
   Stripe gates it behind a paid tier.
5. Decide where the short "AIMT" vs. full legal name appears, for
   consistency once branding goes live.

### 7. DNS records if `pay.aimtrichology.com` is pursued

Verified live via `dig` during this audit (read-only lookups, no changes):

```
pay.aimtrichology.com   CNAME   — currently EMPTY (no conflict, clean slate)
aimtrichology.com       MX      10 smtp.google.com.   (Google Workspace — unaffected)
aimtrichology.com       TXT     "v=spf1 include:_spf.google.com ~all"  (unaffected)
```

- Add exactly **one CNAME**: `pay.aimtrichology.com` → *the exact target
  hostname Stripe shows you in Settings → Branding → Custom domains at the
  moment you click "Add domain."* I cannot supply this value — it's
  account-specific and Stripe-generated, not a fixed public constant, and
  guessing it here would risk the owner copying a wrong or stale value.
- This CNAME cannot conflict with or affect the root domain's existing
  Google Workspace mail (`MX`/`SPF` above) — it's an entirely separate
  subdomain record with no MX or TXT overlap. Same reasoning used for the
  email-sending subdomain in Part 2.

### 8. Does `create-checkout-session.js` need a code change?

- **For branding: no.** None of business name, icon, logo, accent color,
  or custom domain are Checkout Session API parameters for a standard
  (non-Connect) account — they're 100% Dashboard/account-level settings.
  No code change is needed or recommended to achieve the branding in §4.
- **Optional, non-branding enhancement that *is* API-level:**
  `custom_text.submit.message` (and `custom_text.after_submit.message`)
  can add a short reassurance line under the Pay button, e.g. "You'll get
  instant access to HeadSpa Mastery." This is a genuine, surgical,
  one-field addition to the existing `URLSearchParams` body — flagged as
  an available option, **not implemented here**, per the hard boundary
  against touching payment logic without being explicitly asked.
- **`success_url`/`cancel_url` dependency:** currently
  `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}` and
  `${origin}/courses.html?checkout=canceled`. I checked for a `_redirects`
  file or any clean-URL rewrite config — **none exists in the repo**, so
  if a "Workstream D" URL cleanup (dropping `.html` extensions) is planned,
  it has not landed yet. These two literal `.html` paths are the current,
  correct, live targets. If/when that cleanup ships, these two strings
  will need a matching one-line edit — noting the dependency, not assuming
  it's done, not touching it now.

---

## PART 2 — TRANSACTIONAL EMAIL SYSTEM

Full design, template source, and setup instructions live in
[`docs/email-templates/AIMT-EMAIL-TEMPLATES-SETUP.md`](../email-templates/AIMT-EMAIL-TEMPLATES-SETUP.md).
Summary below; see that file for the complete detail this task asked for
(template variables, SMTP fields, DNS records, paste-in locations).

### Grounding this design did NOT skip

1. **Supabase connectivity check:** the Supabase MCP connector *is*
   available and connected (project `aimt`, ref `epcnkncyxqgscrejinwr`,
   `ACTIVE_HEALTHY`, Postgres 17, `us-east-1`). Confirmed via
   `list_projects`/`get_project` (read-only). **There is no MCP tool that
   exposes Auth email-template content or SMTP configuration** — those
   tools don't exist in this connector's surface (only project metadata,
   table listings, advisors, etc.). I cannot see current Supabase email
   template/SMTP state from here; nothing in this document claims to.
2. **Grepped the actual auth flows the app triggers**, so the template
   list matches reality instead of a generic Auth-template checklist:
   - `student-access.html` — `signInWithPassword`, `resetPasswordForEmail`
     (real, active "Forgot your password?" link), `verifyOtp({type:
     'recovery'})` + `exchangeCodeForSession` (both part of that same
     recovery-link flow, not a separate feature), `updateUser({password})`.
   - `success.html` — `signUp()` after checkout.
   - **No `signInWithOtp` anywhere in the repo** — magic-link/OTP sign-in
     is not a feature this app has. Not designed, per the instruction not
     to invent email types the app doesn't trigger.
   - **No `updateUser({ email: ... })` anywhere** — there is no email-change
     UI today. A template is still prepared (Supabase ships this template
     slot by default and it would fire the instant any future code calls
     it), but it's flagged **dormant**, not active.
3. **Read `functions/api/admin/index.js`'s `grantAccess`/`ensureAuthUser`
   in full.** The real flow: `ensureAuthUser` calls Supabase's admin
   `POST /auth/v1/admin/users` with `email_confirm: true` directly — this
   creates the account **silently, with no email sent** (admin `createUser`
   never auto-emails; only `inviteUserByEmail` does, and this code doesn't
   call that). The success response's own `setupInstruction` string says
   it plainly: *"Account created. Have the student open Student Access and
   use 'Forgot your password?' to set their password, then sign in
   normally."* So today, a manually-granted student gets **no email at
   all** unless a human tells them to go do that — the invite template is
   designed to close exactly that gap (see setup doc, "Invite" design
   decision, for why it's a custom Resend send rather than Supabase's
   built-in "Invite user" template).
4. **Read `request-review.js` and `request-educator-remediation.js`** to
   confirm real states before designing notices for them: both insert a
   row (`certification_review_requests` status `'open'`,
   `certification_educator_requests` status `'requested'`) and explicitly
   say resolution/scheduling happens **manually, out of band** — there is
   no code path that ever auto-fires a "resolved" or "scheduled" email
   today. Designed acknowledgment-on-submit emails for both (real,
   code-backed events); did **not** invent "your remediation is scheduled"
   or "your review was resolved" emails, since nothing in the codebase
   triggers those states automatically.

### The 9 templates (full list + rationale in the setup doc)

**Supabase Auth Dashboard templates** (`docs/email-templates/supabase-auth/`)
— paste into Authentication → Email Templates, fire automatically on
Supabase's own fixed triggers:
1. `confirm-signup.html` — real, active (`signUp()` in success.html)
2. `reset-password.html` — real, active ("Forgot your password?")
3. `change-email.html` — prepared, **currently dormant** (no email-change UI exists yet)

**Custom sends via Resend, from Cloudflare Functions** (`docs/email-templates/custom-resend/`)
— **none of these have send code wired yet** (matches the existing pattern
already in this codebase: per your memory note, the My AIMT Preview funnel
was built with its "email delivery seam deliberately unwired." These are
the same shape of thing — the template and the recommended trigger point
are both designed and ready, the actual `fetch()` call to Resend is a
follow-up implementation task, not done here per the audit-only boundary):
4. `invite-manual-grant.html` — recommended trigger: `grantAccess()` in `functions/api/admin/index.js`, when `account.created === true`
5. `enrollment-confirmation.html` — recommended trigger: `stripe-webhook.js`, after `upsertEntitlement` succeeds
6. `certification-earned.html` — recommended trigger: `functions/api/issue-certificate.js`, after credential ID issuance
7. `review-request-received.html` — recommended trigger: `request-review.js`, after insert succeeds
8. `educator-remediation-request-received.html` — recommended trigger: `request-educator-remediation.js`, after insert succeeds
9. `security-password-changed.html` — recommended trigger: after `updateUser({password})` succeeds client-side in `student-access.html` (needs a small new backend hook to actually fire — flagged, not built)

### Architecture recommendation (detail in setup doc)

Supabase Auth + custom SMTP via **Resend**, sending subdomain
`auth.aimtrichology.com`, sender `AIMT <no-reply@auth.aimtrichology.com>`,
reply-to `support@aimtrichology.com`. This directly satisfies the existing
gap flagged in the repo's own governing audit,
`docs/AIMT-Launch-Audit.md` item 6 ("Production email (Supabase SMTP)" —
*"Signup confirmations and password resets currently run on Supabase's
default SMTP, which is rate-limited... students will not receive password
reset emails, and your recovery flow dies."*). This document and the setup
doc are the concrete follow-through on that flagged item.

### DNS — verified live, read-only (`dig`, no changes made)

```
aimtrichology.com        MX    10 smtp.google.com.
aimtrichology.com        TXT   "v=spf1 include:_spf.google.com ~all"
auth.aimtrichology.com   TXT   — currently EMPTY (clean slate, no conflict)
_dmarc.aimtrichology.com TXT   — currently EMPTY (no DMARC record at all, root or sub)
```

A subdomain's own SPF/DKIM records (`auth.aimtrichology.com`) do not
touch, override, or interact with the root domain's SPF record in any way
— SPF is looked up per exact hostname in the `From`/`Return-Path` domain,
not inherited or merged across subdomains. This is exactly why sending
transactional mail from `auth.aimtrichology.com` instead of
`aimtrichology.com` directly is the safe choice here: it cannot break
`info@`/`support@`/`hello@` on Google Workspace no matter what records get
added underneath it. Full exact record list (SPF/DKIM/DMARC for the
subdomain, plus a recommended root-domain DMARC record — currently
missing entirely) is in the setup doc.

---

## E. STRIPE + EMAIL BRANDING — final report

**Inspected:** `create-checkout-session.js`, `stripe-webhook.js`,
`claim-course-access.js`, `functions/api/admin/index.js` (`grantAccess`,
`ensureAuthUser`), `functions/api/certification/request-review.js`,
`request-educator-remediation.js`, `complete-remediation.js`,
`issue-certificate.js`, `student-access.html`, `success.html`,
`headspa-mastery.html` (`:root` tokens, read-only),
`assets/css/aimt-design-system.css` (`:root` tokens, read-only),
`favicon.svg`, `docs/AIMT-Launch-Audit.md`. Confirmed via the Supabase MCP
connector (read-only: `list_projects`, `get_project`, `list_tables`) that
the `aimt` Supabase project is live/healthy and which tables exist. Ran
read-only public DNS lookups (`dig`) against `aimtrichology.com`,
`auth.aimtrichology.com`, `pay.aimtrichology.com`, and
`_dmarc.aimtrichology.com` to ground the email/DNS recommendations in the
domain's actual current state rather than assumptions.

**Produced (new files, nothing existing was edited):**
- `docs/stripe-and-email/AIMT-STRIPE-EMAIL-BRANDING-AUDIT-2026-09-15.md` (this file)
- `docs/email-templates/AIMT-EMAIL-TEMPLATES-SETUP.md`
- `docs/email-templates/supabase-auth/confirm-signup.html`
- `docs/email-templates/supabase-auth/reset-password.html`
- `docs/email-templates/supabase-auth/change-email.html`
- `docs/email-templates/custom-resend/invite-manual-grant.html`
- `docs/email-templates/custom-resend/enrollment-confirmation.html`
- `docs/email-templates/custom-resend/certification-earned.html`
- `docs/email-templates/custom-resend/review-request-received.html`
- `docs/email-templates/custom-resend/educator-remediation-request-received.html`
- `docs/email-templates/custom-resend/security-password-changed.html`

**2026-09-15 refinement pass (same date, follow-on to the above):** all nine
template files were revisited against the live CSS more exhaustively
(`assets/css/aimt-design-system.css`'s full token set — weights,
letter-spacing/tracking presets, component tokens — not just the color
values pulled the first time), producing a handful of concrete corrections
(a token conflated with a different one, two invented dark-mode colors,
one button-label weight/tracking mismatch, one oversized wordmark). Full
before/after detail and reasoning is in the "Design system used" section of
the setup doc — not duplicated here. Also produced, this pass:
- `docs/email-templates/assets/aimt-mark-email.png` (160×160) and
  `aimt-mark-email@2x.png` (320×320) — email-safe raster export of the real
  AIMT orbital mark (`favicon.svg`), for optional future use; the templates
  themselves still use a text wordmark, which needs no hosted image.
- `docs/stripe-and-email/assets/aimt-stripe-icon-512.png` (512×512) —
  closes the icon-export step flagged but not completed in Part 1 §5 above.
No SVG rasterizer was available; both exports used macOS's built-in
`qlmanage -t` (QuickLook thumbnailer), verified visually against the
source SVGs. No file outside `docs/` was touched in this pass either.

**Owner-actions-required (nothing below was done for you):**
- *Stripe Dashboard:* business name/support email, Branding icon+color
  upload, confirm receipt-email toggle, attempt custom-domain setup for
  `pay.aimtrichology.com` and report back what Stripe shows/requires — see
  Part 1 §6.
- *Supabase Dashboard:* configure custom SMTP (Resend) under Authentication
  → Settings → SMTP Settings, paste the three Auth email templates,
  generate Resend API key/domain — see setup doc §"Supabase SMTP
  configuration."
- *DNS (owner's registrar/DNS host, not touched by me):* add the
  Resend-issued SPF/DKIM records plus a DMARC record for
  `auth.aimtrichology.com` (exact records in setup doc), and — separately,
  optional — the Stripe-issued CNAME for `pay.aimtrichology.com` if pursued.
- *Future code work (not done, explicitly out of scope here):* wire the
  six custom-Resend sends into their recommended trigger points; add
  `custom_text` to `create-checkout-session.js` if the reassurance line is
  wanted; update `success_url`/`cancel_url` only if/when a URL-cleanup
  workstream lands.

**Explicit confirmation:** no live Stripe, Supabase, DNS, or Google
Workspace change was made. No Stripe or Resend API was called. No real
email was sent. The only network activity this audit performed was
read-only public DNS lookups (`dig`) and read-only Supabase MCP calls
(`list_projects`, `get_project`, `list_tables`). No secret key was found
anywhere in the repository during this audit; all three Cloudflare
Functions read Stripe/Supabase credentials from `env` only.
