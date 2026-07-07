# AIMT — Operational Audit & Launch Readiness Plan
**Audited:** July 5, 2026 · Full project zip (230 files, 120MB)
**Scope:** aimt-site (deployable), HeadSpa Mastery content, backend functions, Supabase schema, holding files

---

## Executive Summary

The technical foundation is stronger than most first-course launches: Stripe checkout works, Supabase auth works, durable entitlements exist with proper row-level security, the QA matrix in LAUNCH-READINESS.md was actually run, and error observability is in place. The access-flow engineering is genuinely done.

What's *not* done falls into four buckets: **(1)** sensitive personal data sitting inside the project, **(2)** missing course content (Module 8 videos), **(3)** the cross-device progress problem that undercuts your core "AI tutor that knows you" promise, and **(4)** the business wrapper — legal pages, support contact, production email, custom domain — that a $497 certification product needs to be credible and compliant.

**Verdict: not launch-ready yet, but the remaining work is 2–4 focused weeks, and most of it is content and configuration, not engineering.**

---

## 🔴 CRITICAL — Blockers. Do not launch until these are done.

### 1. Remove tax/financial documents from the project — TODAY
`HeadSpa Mastery/AIMT HOLDING FILES/2025 taxes/` + `2025 taxes.zip` contain:
- Wells Fargo business checking & savings statements (BLCS LLC)
- Personal Amex and Apple Card statements (12 months each)
- Robinhood 1099 + consolidated transactions
- Square W-2, 1099-NEC forms
- Chase business credit card statements (Haus Blanc LLC)
- A "Cady Personal" folder

**Action:** Move the entire `2025 taxes` folder and zip to a dedicated, encrypted location (e.g., a "BLCS Finance" folder in a personal drive, never inside a web project). These files must never sit next to anything that gets zipped, shared with contractors, or deployed.

### 2. Module 8 service videos — the product is missing its core
- All 12 entries in `STEP_VIDEO_IDS` are `null` (Steps 01–17 of the service).
- Course media folders are nearly empty: Module 0 and 2 are empty, Module 1 has one slide PNG and one voiceover MP3.
- The code expects Vimeo IDs.

**Action:** Film and upload the 17-step service demonstration to Vimeo (set videos to **Private/Unlisted with domain-level embed restriction** so they only play on your domain), then populate the ID array. You already have a director's shoot guide from earlier planning — this is now the critical path. If you launch without them, you are selling a practitioner certification without demonstrating the practice, and refund requests will tell you so.

### 3. Sync progress + Cadence memory to Supabase
Currently everything lives in `localStorage`:
- Module/checkpoint progress
- Cadence's learned memory of the student (roles, goals, hesitations)

Consequences: no cross-device resume, cleared browser = total loss, "lifetime access" promise is only true for one browser profile. This also breaks your #1 differentiator vs. USTI/IAT — the AI tutor's relationship with the student evaporates on a new device.

**Action:** Add a `course_progress` table (user_id, course_slug, state JSONB, updated_at) with RLS matching `course_entitlements`. Write-through on checkpoint completion; read on login. Keep localStorage as the offline cache. This is roughly a day of work given your existing Supabase wiring, and it also becomes the data source for the student dashboard (below).

### 4. Secure the Cadence AI proxy
`callAI()` posts to `https://headspa-proxy.brandrice.workers.dev/` with **no authentication** — no token, no session check in the request. If the Worker doesn't strictly validate origin (and origin headers are spoofable outside browsers), anyone who views source can use your Anthropic API key's budget as a free Claude endpoint.

**Action (in the Worker):**
- Require the Supabase JWT in a header; verify it against Supabase before forwarding.
- Check entitlement (or at least a valid authenticated user) server-side.
- Add per-user rate limiting (e.g., N requests/minute) and a daily cap.
- Restrict CORS to your production domain only.

### 5. Legal & compliance pages
The site has **no Terms of Service, no Privacy Policy, no Refund Policy, and no support contact anywhere** (zero `mailto:` links across all pages). For a paid product this is a Stripe/card-network requirement, not a nice-to-have — refund/cancellation terms must be accessible pre-purchase.

**Action:** Create `terms.html`, `privacy.html`, `refunds.html` + footer links on every page + a support email (e.g., support@ your domain) in the footer and on success.html. Your refund policy is also a positioning weapon: USTI's payments are explicitly non-refundable — a clean, confident guarantee ("14-day, no-hoops") differentiates you instantly.

### 6. Production email (Supabase SMTP)
Signup confirmations and password resets currently run on Supabase's **default SMTP, which is rate-limited to a handful of emails per hour and intended for development only.** At launch volume, students will not receive password reset emails, and your recovery flow dies.

**Action:** Configure custom SMTP in Supabase (Resend, Postmark, or SES) on your domain with SPF/DKIM. Test reset + confirmation deliverability to Gmail/iCloud/Yahoo. ~1 hour of work, catastrophic if skipped.

### 7. Custom domain
og:image URLs reveal the site lives at `aimt-site.pages.dev`. A certification institute charging $497 cannot launch on a `.pages.dev` subdomain — it undermines trust at the exact moment of purchase.

**Action:** Attach your custom domain in Cloudflare Pages, update og:image/canonical URLs, update Stripe success/cancel URLs (they're origin-relative in the function, so they'll follow automatically — verify), update the Cadence Worker CORS allowlist, and update the Supabase auth redirect allowlist.

---

## 🟠 HIGH — Strongly recommended before launch

### 8. Add a Stripe webhook for entitlements
Entitlement currently depends on the *client* completing the claim flow on success.html. Your own LAUNCH-READINESS doc flags the remaining race condition. A `checkout.session.completed` webhook that writes the entitlement server-side makes purchase → access unconditional, even if the buyer closes the tab, loses connection, or success.html errors.

**Action:** New Pages function `functions/api/stripe-webhook.js`, verify signature, upsert into `course_entitlements`. Keep the existing claim flow as the account-linking step (attaching `user_id` to the row).

### 9. Validate product in claim-course-access
The endpoint verifies a session is *paid* but not *what was purchased*. With one SKU it's harmless; the moment Scalp Science Foundations launches, any $30 checkout session ID would grant HeadSpa Mastery access.

**Action:** Check `line_items` price ID matches the course being claimed. Fix it now while it's a 5-line change, not a refund incident.

### 10. Get the staff allowlist out of client code
`STAFF_EMAIL_ALLOWLIST` hardcodes three personal Gmail addresses in the public HTML of two pages — exposing your and Cady's personal emails to scrapers, and letting anyone see exactly which accounts have elevated access.

**Action:** Move staff access into `course_entitlements` (just insert entitlement rows for staff accounts) and delete the allowlist from the client. Zero new infrastructure needed.

### 11. Decide the content-exposure posture (eyes open)
The **entire 12-module course — every lesson, checkpoint, and script — ships inside the public `headspa-mastery.html`** (501KB). The gate is client-side JavaScript; anyone can View Source and read the full paid curriculum. Vimeo domain-restriction protects the videos, but the written curriculum is free to anyone who knows right-click.

Options:
- **A. Accept for v1 (defensible):** the written content alone without Cadence, checkpoints, videos, and the certificate is a fraction of the value. Most buyers won't pirate; most pirates wouldn't buy.
- **B. Fix properly (post-launch project):** move module content to Supabase rows/Storage, fetch after auth + entitlement check. Pairs naturally with the progress-sync work.

Recommendation: **A now, B within 60 days** — and B becomes mandatory before you raise prices or sell to institutions. Either way, add `<meta name="robots" content="noindex">`… actually no — the page is also your sales page, so instead ensure the embedded course markup is not crawlable as content (move course DOM into JS-injected templates, which it largely already is) and don't let this page's course text cannibalize SEO.

### 12. Server-issued certificates with verification
`showCertificate()` checks localStorage and renders a certificate client-side. There is **no server record that anyone completed anything**, no credential ID, no way for an employer or state board to verify. Competitors lean on third-party certification (USTI uses AMCA) as a trust signal.

**Action:** On completion, write a `completions` row (user, course, date, generated credential ID like `AIMT-HSM-2026-00042`), print the ID on the certificate, and add a public `/verify` page that looks up an ID. This is a few hours of work that converts your certificate from a JPEG into a credential — and it's a marketing asset ("every AIMT certificate is independently verifiable").

### 13. Analytics
There is no analytics of any kind. You will launch blind: no funnel, no drop-off, no conversion rate, no idea whether courses.html → enrollment → checkout is leaking.

**Action:** Add Plausible or Fathom (privacy-friendly, no cookie banner needed) with events for: enrollment page view, checkout start, checkout success, course entry, module completion.

### 14. Performance — the 7MB hero
`courses.html` loads `aimt-hero-image.png` at **6.9MB** (and the same file is duplicated in the HeadSpa Mastery folder). `headspa-halo-preview.png` is 2MB. On mobile LTE your certifications page takes several seconds to paint its hero — directly taxing the purchase path.

**Action:** Convert both to WebP/AVIF at display resolution (~150–300KB), add `loading="lazy"` below the fold, `fetchpriority="high"` on the LCP image. Also: no favicon exists on any page — add favicon + apple-touch-icon (small, but it's the kind of detail your brand standards demand).

### 15. SEO basics
- `courses.html`, `student-access.html`, `success.html` have no meta descriptions.
- No `robots.txt`, no `sitemap.xml`, no canonical tags.
- The three "new classes" pages (Price Like a Pro, Scalp Assessment Intensive, Scalp Science Foundations) are **orphaned** — not linked from courses.html or anywhere.

**Action:** Add meta descriptions + canonicals + robots.txt + sitemap.xml. Decide launch scope for the new classes: either add them to courses.html as "Coming Soon" cards (builds the multi-course institute impression, captures waitlist emails) or keep them out of the deploy entirely. Don't ship orphaned pages.

### 16. QA runbook + rollback plan (already on your list, still open)
The two unchecked "should complete" items in LAUNCH-READINESS.md remain valid: a written QA runbook for team handoff, and a documented Cloudflare Pages rollback procedure (who deploys, where env vars live, how to revert fast). Do the rollback doc before launch day, not during the incident.

---

## 🟡 MEDIUM — First 30 days post-launch

17. **Move course content behind auth** (item 11, option B) — pairs with progress sync.
18. **Payment plan option** — USTI offers installments on everything; at $497 a 3× $166 Stripe payment-plan or Affirm/Klarna toggle will measurably lift conversion for your salon-professional audience.
19. **Post-purchase email sequence** — welcome, getting-started, mid-course nudge, completion congratulations. (Requires the transactional email from item 6.)
20. **Spanish localization** — your earlier analysis identified it as highest-ROI; USTI lists "courses in Spanish coming soon," meaning the lane is still open.
21. **Ops reporting** — completion rates, module drop-off, Cadence usage per student (the aimt_logs table is a start; add course events).
22. **Tighten aimt_logs RLS** — anon INSERT is open with `with check (true)`; fine for launch observability, but add a size cap/rate limit or move logging server-side eventually to prevent junk floods.

---

## 🧭 Student Dashboard — Recommendation (you're right to want it)

Note: CODEX_HANDOFF.md says "Do NOT add dashboard" — that was a guardrail written to stop an AI coding assistant from scope-creeping, not a product decision. You're the owner; the product need is real, and the moment course #2 exists, `student-access.html` routing straight into one course stops making sense.

**Scope it as "My AIMT" — one page, extending student-access.html post-login (don't build a new system):**

1. **Enrolled courses** — cards driven by `course_entitlements` (already exists). Each card: continue button + progress bar (driven by the new `course_progress` table from item 3 — this is why that item pays twice).
2. **Downloads** — course resources (workbooks, checklists, protocol PDFs) served as **Supabase Storage signed URLs**, gated by entitlement. This solves your "purchases and downloadable assets in one spot" requirement properly — never link raw public file URLs.
3. **Certificate** — re-view/re-download completed certificates (driven by the `completions` table from item 12).
4. **Account** — email, password change (auth flows already exist on this page).

That's it for v1. No community, no messaging, no gamification — consistent with the institute-minimal ethos. Estimated effort: **2–3 focused sessions**, because auth, entitlements, and design tokens already exist. Build it *after* items 3 and 12, since they supply its data.

---

## 🗂 Project Reorganization Plan

Current problems: 6 duplicate site zips + 4 extracted site copies inside "AIMT HOLDING FILES," an `_outdated` folder, `index.html.zip` nested inside the content folder, a 7MB hero image duplicated in two places, `CODEX_HANDOFF.md` is a *folder* containing a file of the same name, and tax documents living inside a web project.

Proposed structure:

```
AIMT/
├── site/                     ← the ONLY deployable (current aimt-site/)
│   ├── index.html, courses.html, headspa-mastery.html,
│   │   student-access.html, success.html
│   ├── terms.html, privacy.html, refunds.html      (new)
│   ├── robots.txt, sitemap.xml, favicon.ico         (new)
│   ├── assets/  functions/  supabase/
│   └── docs/
│       ├── LAUNCH-READINESS.md
│       ├── CODEX_HANDOFF.md   (file, not folder)
│       └── QA-RUNBOOK.md      (new)
├── content/                  ← course production masters
│   └── headspa-mastery/
│       ├── module-00/ … module-11/   (slides, voiceovers, scripts)
│       └── brand/                    (templates, animations)
├── future-courses/           ← the three "new classes" HTML drafts
└── archive/                  ← ALL old zips & site versions (or delete)

(elsewhere, encrypted, never in this tree)
BLCS-Finance/2025-taxes/
```

Rules going forward: `site/` is the git repo and the only thing that deploys; nothing enters `site/` that isn't meant to be public; archives get one folder or the trash, not a nesting doll of zips.

---

## 📊 Competitive Position Check

Your pricing lands well. USTI's entry point is a $599 one-day intro, with practitioner and trichologist tiers running roughly $1,899–$3,299, non-refundable, scheduled-class format. At **$497, self-paced, with a persistent AI tutor**, you undercut their entry tier while offering a fundamentally more modern delivery model. Three things will make that story land:

1. **The AI tutor must actually persist** (item 3) — it's the claim they can't copy.
2. **Verifiable certificates** (item 12) — neutralizes their third-party-certification (AMCA) trust advantage.
3. **A humane refund policy** — their payments are explicitly non-refundable; yours shouldn't be.

---

## ✅ Suggested Launch Sequence

**Week 1 — Safety & wrapper**
1. Move tax folder out (item 1) — *today*
2. Custom domain + og/canonical updates (7)
3. Legal pages + support email (5)
4. Production SMTP + deliverability test (6)
5. Secure Cadence proxy (4)
6. Favicon, meta descriptions, robots/sitemap, image compression (14, 15)

**Week 2 — Data layer**
7. Progress + Cadence memory sync to Supabase (3)
8. Stripe webhook (8) + product validation in claim (9)
9. Staff allowlist → entitlements table (10)
10. Completions table + credential IDs + /verify page (12)
11. Analytics (13)

**Weeks 2–4 — Content (parallel track)**
12. Film + upload Module 8 videos, domain-restricted Vimeo (2)
13. Populate STEP_VIDEO_IDS, full course walkthrough QA

**Week 4 — Ship**
14. "My AIMT" dashboard v1 (uses everything above)
15. QA runbook + rollback doc (16)
16. Final smoke test per LAUNCH-READINESS.md → launch

---

*Everything in "What Is Already Done" in your LAUNCH-READINESS.md checked out against the code — the access-flow engineering is solid. The gap between you and launch is content, configuration, and the business wrapper, not architecture.*
