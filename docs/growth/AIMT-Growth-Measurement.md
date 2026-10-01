# AIMT Growth Measurement — Step 1: Measurement + Attribution

Source of truth for how AIMT measures growth. Code that enforces this:
`functions/_lib/growth/taxonomy.mjs` (event names, validity, sanitizers,
enrollment classification), `functions/_lib/growth/report.mjs` (every
formula below), `assets/js/aimt-growth.js` (browser client). If this
document and the code disagree, fix one of them. Don't let them drift apart.

The question this answers:
**acquisition source → lead → checkout → paid enrollment → activation →
certification → continued AIMT use**, visible in **Admin → Growth** with no
SQL.

---

## 1. Principles

1. **Revenue is never inferred from the browser.** Paid enrollments come from
   `course_entitlements` (written by the signature-verified Stripe webhook).
   Revenue comes from the `paid_enrollment` record that the same webhook
   writes from Stripe's own `amount_total`. Browser events can never create a
   checkout, a purchase, or revenue: the collector rejects them.
2. **Every legitimate paid enrollment counts as paid. Nothing else does.** A
   live Stripe purchase with a positive amount paid is paid, at full price or
   discounted by a coupon or promotion, and counts in paid conversion, gross
   revenue (the amount actually paid) and attribution. It's segmented as full
   price vs discounted. Staff, owner/admin purchases, Stripe test mode,
   complimentary, scholarship, manual grants and $0 checkouts are classified
   separately and never enter paid metrics.
3. **Uninstrumented ≠ zero.** A metric the system can't measure shows
   *Not yet measurable* or *Insufficient data*, never `0`. A range that
   starts before tracking began is marked *partial* ("Measured since …").
4. **Reuse existing authorities.** Activation, module completion, Cadence
   use and certification are *derived* from the tables that already own them.
   They are never copied into a second event stream.
5. **Few events, not clickstream.** We record whether a student uses AIMT,
   not every click.

## 2. Audit — what existed before this step

| Area | Before | Classification |
|---|---|---|
| Visitors / sessions | Nothing | MISSING |
| Referrers | Nothing | MISSING |
| UTMs / click ids | Nothing | MISSING |
| Readiness Audit | Fully client-side; local profile only; no events | MISSING |
| Email leads | Name+email gate exists, but `READINESS_DELIVERY_ENDPOINT` is `null`, so no email is stored or sent anywhere | PARTIAL (form exists, no lead record) |
| Checkout starts | Only failures logged to `aimt_logs` | MISSING |
| Stripe purchases | Webhook writes `course_entitlements` (signature + price verified) | RELIABLE |
| Revenue amount | Not stored anywhere in AIMT (only in Stripe) | MISSING |
| Enrollments | `course_entitlements` | RELIABLE |
| Enrollment source | Implicit in id prefix: `cs_live_`/`cs_test_`, `admin-grant-<source>-`, legacy `staff-grant-` | AVAILABLE BUT UNSUMMARIZED |
| Staff/manual/test separation | Admin shows Paid vs Manual pill; owner purchases and test mode not separated | PARTIAL |
| Course activation | `course_progress.state` (`hasCourseActivity`) | AVAILABLE BUT UNSUMMARIZED |
| Progress / modules | `course_progress.state.progress[i].complete/completedAt` | RELIABLE (unsummarized for growth) |
| Certification | `completions` (+ `certification_attempts`) | RELIABLE |
| Cadence usage | `cadence_messages` (user_id, mode, created_at) | AVAILABLE BUT UNSUMMARIZED |
| Service Timer usage | Nothing recorded | MISSING |
| Resources / downloads | Static links, nothing recorded | MISSING |
| Admin reporting | Enrolled / Active 30d / Certified / reviews | PARTIAL (ops, not growth) |
| Existing event tables | `aimt_logs` (operational, anon-insertable, unsuitable for metrics); `admin_audit_log` (privileged actions) | Not reused for growth, on purpose |

## 3. Architecture

| Piece | File | Role |
|---|---|---|
| Table | `supabase/migrations/20261001_create_growth_events.sql` | Append-only `growth_events`; RLS on, no client policies, privileges revoked from `anon`/`authenticated`; `unique (event_name, dedupe_key)` |
| Taxonomy | `functions/_lib/growth/taxonomy.mjs` | Event lists, sanitizers, channel rules, creative parser, dedupe keys, enrollment classification |
| Writer | `functions/_lib/growth/record.mjs` | The single insert path; whitelists every field, `ON CONFLICT DO NOTHING`, never throws, 4 s timeout |
| Collector | `functions/api/growth/collect.js` | Public same-origin beacon for browser events |
| Checkout | `functions/api/create-checkout-session.js` | Records `checkout_start` after Stripe creates the session (no change to the Stripe request) |
| Webhook | `functions/api/stripe-webhook.js` | Records `paid_enrollment` after the entitlement write (no change to verification, entitlement, or response) |
| Reporting | `functions/_lib/growth/report.mjs` | Pure report + scoreboard functions |
| Admin API | `functions/api/admin/index.js` | `?view=growth`, `?view=growth-scoreboard`, action `growth_reconcile_revenue` (owner/admin only) |
| Admin UI | `admin.html` → **Growth** | Dashboard, attribution tables, weekly scoreboard |
| Client | `assets/js/aimt-growth.js` | Visitor/session ids, attribution, qualified visit, page hooks |
| Loader | `assets/js/aimt-public-nav.js` | Loads the client on every page with the public nav (incl. generated `/education/*`) |
| Page hooks | `head-spa-readiness.html`, `enroll.html`, `aimt-service-timer.html`, `headspa-mastery.html` (one script tag), `admin.html` | Funnel events |
| Tests | `tests/growth-measurement.test.mjs`, `tests/growth-client.test.mjs` | Behavior, privacy, authority, auth |

## 4. Canonical event taxonomy

"Stored" events live in `growth_events`. "Derived" events are computed at
report time and **cannot** be written (the table's CHECK constraint rejects
them).

| # | Event | Kind | Valid when | Counts once per | Source of truth |
|---|---|---|---|---|---|
| 1 | `site_visit` | stored, browser | A non-app public page has been **visible for ≥ 5 s** (cumulative) in a non-opted-out, non-automated browser. On the course URL, only while the public sales landing is showing. Never on My AIMT (except Readiness Preview), Student Access, Service Timer, Admin, Success, Certificate, Verify. | browsing session | growth_events |
| 2 | `headspa_sales_view` | stored, browser | Same as `site_visit`, on `/head-spa-certification` with the sales landing visible (not an enrolled student inside the course app). | browsing session | growth_events |
| 3 | `readiness_audit_start` | stored, browser | Visitor clicked **Start the Free Score** (first scored question shown). | browsing session | growth_events |
| 4 | `readiness_audit_complete` | stored, browser | All 15 answered and the score revealed. | browsing session | growth_events |
| 5 | `lead_created` | stored, browser | Readiness name+email gate submitted. Records **only** `marketing_consent` (true/false). | visitor, ever | growth_events |
| 6 | `checkout_start` | stored, **server** | `create-checkout-session` received a real Stripe Checkout Session id. | Checkout Session id | growth_events |
| 7 | `paid_enrollment` | stored, **server** | Signature-verified `checkout.session.completed`, paid, price matched, entitlement written; or Admin's Stripe reconciliation read the session from Stripe as `paid`. | Checkout Session id | Stripe → growth_events; enrollment itself = course_entitlements |
| 8 | `course_activated` | derived | `hasCourseActivity(state)`: intro complete, any module started/complete, or any checkpoint attempted. Time = earliest module `startedAt`/`completedAt`. | student | course_progress |
| 9 | `module_completed` | derived | `state.progress[0..11].complete === true`, time = `completedAt`. | student × module | course_progress |
| 10 | `cadence_used` | derived | ≥ 1 student-authored `cadence_messages` row (role = user). "Ask Cadence" = `mode = ask_cadence` (voluntary); checkpoint/remediation messages are coursework. | student × day | cadence_messages (metadata only) |
| 11 | `service_timer_used` | stored, browser, signed-in | A treatment clock was **started** (`startTreatment`), not just page opened. | student × UTC day | growth_events |
| 12 | `resource_used` | stored, browser, signed-in | Click on a `download` entry from `assets/js/aimt-course-resources.js` (key = file basename). | student × resource × UTC day | growth_events |
| 13 | `certification_issued` | derived | Non-revoked `completions` row; time = `completed_at`. | student | completions |

Future: `referral_*` and next-program enrollment. Neither has an
underlying system yet, so neither event exists. The scoreboard shows
Referrals as *Not yet measurable*.

### Visitor, session, qualified

- **Visitor** = random UUID (`crypto.randomUUID`) in `localStorage`
  `aimt_growth_v1`. It isn't derived from any device trait, so it's not
  fingerprinting. Clearing storage or switching browsers/devices makes a
  new visitor.
- **Session** = random UUID, renewed after 30 min of inactivity **or** when
  a *different* meaningful touch arrives. A reload keeps the same
  referrer/UTMs, so it's not a new session.
- **Qualified visitor** = distinct visitor with ≥ 1 `site_visit` (5 s
  visible). Bots are filtered by user agent (server) and `navigator.webdriver`
  (client).

## 5. Attribution model

Each browser event and each `checkout_start` carries two whitelisted
snapshots:

- **first_touch**: the visitor's first-ever landing (UTMs, click ids,
  referring domain, landing path, time). Never overwritten.
- **last_touch**: the **most recent meaningful** touch, meaning one with a
  UTM tag, `gclid`/`gbraid`/`wbraid`, or an external referring domain.
  Direct visits, internal navigation, Stripe's return redirect and AIMT's own
  domains never overwrite it.

Captured fields: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`,
`utm_term`, landing **path**, referring **domain**, `gclid`, `gbraid`,
`wbraid`. Values are lowercased and restricted to `[a-z0-9_.-+~:]`. Any value
containing `@` or that looks like a phone number is dropped.

**Persistence through the funnel:** landing (any page) → sales page →
Readiness → `/enroll` → `create-checkout-session` stores the snapshot against
the **Stripe Checkout Session id** → webhook records `paid_enrollment` for
that same id → the report joins them. Stripe's request is unchanged. No
attribution is sent to Stripe.

**Channel resolution** (`channelFor`): explicit UTMs win; else a Google click
id = `google / cpc`; else the referring domain → `organic` (search engines),
`social` (Instagram, TikTok, YouTube, Facebook, Pinterest, LinkedIn, X,
Threads, Reddit, Snapchat) or `referral`; else `(direct) / (none)`.

**Crediting:** visits and leads are credited to the touch on the event.
Paid students and revenue are credited to the touch on the `checkout_start`
that produced the paid session. A paid enrollment with no recorded checkout
start (before tracking, GPC browser, hosted fallback before the change) is
shown as `(unattributed)`. Admin toggles **First touch / Last touch**. No
multi-touch modeling, on purpose.

## 6. Creative-level attribution convention (`utm_content`)

```
utm_source   = platform          instagram | tiktok | youtube | facebook | pinterest | email | google | <partner>
utm_medium   = channel type      social | paid_social | video | email | cpc | referral | partner | qr
utm_campaign = <yyyymm>_<initiative>          e.g. 202610_headspa_launch
utm_content  = <format>_<topic>_<hook>_v<N>   e.g. reel_scalp-microscopy_myth-bust_v2
```

`utm_content` segments (lowercase; words inside a segment joined by `-`;
segments joined by `_`):

| Segment | Meaning | Values / examples |
|---|---|---|
| format | What kind of creative | `reel` `story` `post` `carousel` `short` `video` `live` `email` `sms` `ad-image` `ad-video` `ad-carousel` `ugc` `blog` `link` `podcast` `qr` |
| topic | The concept | `scalp-microscopy`, `headspa-routine`, `readiness-quiz` |
| hook | The opening/angle/variant. This is how A/B hooks of one concept are told apart. | `myth-bust`, `pov-client`, `subject-a`, `subject-b` |
| vN | Version of that exact asset (re-cut, new caption) | `v1`, `v2` |

Platform is `utm_source`, so **(utm_source, utm_content) identifies one
creative globally**. Examples:

| Creative | Link tags |
|---|---|
| Instagram Reel, microscopy myth, 2nd cut | `utm_source=instagram&utm_medium=social&utm_campaign=202610_headspa_launch&utm_content=reel_scalp-microscopy_myth-bust_v2` |
| TikTok, same concept, different hook | `utm_source=tiktok&utm_medium=social&utm_campaign=202610_headspa_launch&utm_content=short_scalp-microscopy_pov-client_v1` |
| YouTube long-form | `utm_source=youtube&utm_medium=video&utm_campaign=202610_headspa_launch&utm_content=video_headspa-routine_full-walkthrough_v1` |
| Email, subject-line test B | `utm_source=email&utm_medium=email&utm_campaign=202610_readiness_nurture&utm_content=email_readiness-followup_subject-b_v1` |
| Paid Meta video ad | `utm_source=facebook&utm_medium=paid_social&utm_campaign=202611_enroll_push&utm_content=ad-video_headspa-ritual_ugc-testimonial_v3` |

Admin → Growth → **Creative** parses conforming values into
format · topic · hook · version and flags anything else as "Not in AIMT
creative format" (still counted).

## 7. Revenue authority and enrollment classification

`classifyEnrollment()`, server data only:

| Entitlement | Kind | In paid metrics? |
|---|---|---|
| `cs_live_…`, buyer is not an admin account, no discount | **paid** (full price) | **Yes** |
| `cs_live_…`, `amount_total > 0` and `amount_discount > 0` (or `amount_total < amount_subtotal`) | **paid_discounted** | **Yes** (gross = amount actually paid) |
| `cs_live_…` with `amount_total = 0` (e.g. 100% coupon) | zero_cost | No |
| `cs_live_…` bought by an `admin_users` account/email | owner_test | No |
| `cs_test_…` or Stripe `livemode=false` | test | No |
| `admin-grant-staff-…`, legacy `staff-grant-…` | staff | No |
| `admin-grant-complimentary-…` | complimentary | No |
| `admin-grant-scholarship-…` | scholarship | No |
| `admin-grant-manual-…` | manual | No |
| anything else | unknown | No |

Revenue = Σ `amount_total` (USD cents, the amount actually charged) of
`paid_enrollment` records whose entitlement is `paid` or `paid_discounted`.
A paid entitlement with no Stripe record yet is treated as full price until
reconciliation reads its real amounts. A discounted Stripe *Price* can't
create an entitlement today, because the webhook only accepts
`STRIPE_PRICE_ID`. Coupons and promotions on that price are the discount
path. It's **gross**: refunds aren't deducted (no refund
webhook exists yet). Paid enrollments with no Stripe record are counted
and flagged. **Reconcile revenue from Stripe** in Admin backfills them by
reading each Checkout Session from Stripe with the server key (25 per run,
idempotent, audit-logged, never touches access).

## 8. Admin → Growth

Owner/admin only (the support role is refused server-side). Range:
**7 days / 30 days / All time**. Model: **First / Last touch**.

Sections: Acquisition · Leads · Sales · Students · Product adoption ·
Attribution (Source/medium, Campaign, Creative) · Revenue reconciliation ·
Weekly scoreboard (last 8 weeks + week to date, **Copy as text**).

Rates show "n of d" beneath them. Unmeasurable values show the reason.

## 9. Weekly AIMT Growth Scoreboard: definitions

Week = Monday 00:00 UTC → next Monday 00:00 UTC. The first column is the
current week to date. `*` = partial (period starts before that metric's
tracking began). Internal (staff/owner/test) visitors and accounts are
excluded throughout.

| Metric | Definition | Source of truth | Formula | Limitations |
|---|---|---|---|---|
| Qualified visitors | Distinct visitors with a qualified visit | growth_events `site_visit` | count distinct `visitor_id` | Per browser, not per person. GPC/DNT and storage-blocking browsers are not counted. Bot filtering is heuristic. Directional. |
| Sales-page visitors | Distinct visitors who saw the Head Spa sales landing | `headspa_sales_view` | count distinct `visitor_id` | Same as above |
| Readiness starts | Sessions that started the scored questions | `readiness_audit_start` | count distinct `session_id` | Directional |
| Readiness completions | Sessions that revealed a score | `readiness_audit_complete` | count distinct `session_id` | Directional |
| Leads | Visitors who submitted the Readiness contact gate | `lead_created` | count distinct `visitor_id` | **Contact details aren't stored** (delivery endpoint unwired), so leads are countable but not addressable |
| Checkout starts | Distinct visitors (or Checkout Sessions when no visitor id) for whom Stripe created a live Checkout Session | `checkout_start` (server) | count distinct `visitor_id ∨ cs:id`; raw session count shown separately | Each `/enroll` load creates a session, so raw sessions > starters |
| Paid enrollments | Legitimate paid entitlements granted in the period | course_entitlements + classifyEnrollment | count `kind ∈ {paid, paid_discounted}` by `granted_at` (Admin shows full price vs discounted) | Includes purchases from before growth tracking |
| Revenue | Gross USD from Stripe for those enrollments | `paid_enrollment` (webhook / reconciliation) | Σ `amount_total` | Gross, not net of refunds. Unreconciled enrollments flagged. |
| Site → purchase | Paid enrollments per qualified visitor in the period | both above | paid ÷ visitors | A ratio of the same period, not a cohort. Not measurable if visitors aren't. |
| Lead → purchase | Share of the period's leads whose visitor later started a checkout that became a paid enrollment | lead_created + checkout_start + entitlement | converted leads ÷ leads | Same-browser only. A lead who buys on another device isn't linked (no email link, by design). |
| Activation rate | Share of the period's paid cohort who started the course | course_progress | activated ÷ cohort | Young cohorts read low |
| Certification rate | Share of the period's paid cohort certified so far | completions | certified ÷ cohort | Strongly cohort-age dependent; read with cohort age |
| Median days to certification | For paid students certified in the period, `completed_at − granted_at` | entitlements + completions | median days | Small n early. *Insufficient data* when none. |
| Cadence adoption | Share of paid, activated students who sent Cadence ≥ 1 message in the period | cadence_messages (metadata) | users ÷ activated paid students | Includes checkpoint messages. "Ask Cadence" (voluntary) shown separately in Admin. |
| Service Timer adoption | Share of paid, activated students who started a treatment clock in the period | `service_timer_used` | users ÷ activated paid students | Signed-in, non-GPC browsers only; from tracking start |
| Resource adoption | Share who downloaded ≥ 1 registry resource from My AIMT | `resource_used` | users ÷ activated paid students | Only My AIMT library clicks, not in-module links |
| 30-day usage | Of paid students enrolled ≥ 30 days, share with any AIMT activity ≥ 30 days after enrolling | course_progress.updated_at, cadence_messages, timer/resource events | retained ÷ eligible | Current-only (needs latest activity). *Insufficient* until a cohort is 30 days old. |
| 90-day usage | Same at 90 days | same | same | *Insufficient* until a cohort is 90 days old |
| Referrals | — | — | — | No referral system yet: *Not yet measurable* |

## 10. Privacy and security controls

Never written to growth analytics: checkpoint responses, assessment answers,
Readiness answers/score/band/pillars, Cadence messages or memory, student
notes, client/health/scalp information, uploads, emails, names, phone
numbers, IP addresses, user agents, full URLs or query strings.

- Whitelisted writer (`buildGrowthRow`): unknown fields are discarded; props
  are allow-listed per event.
- Collector: same-origin `Origin` required, 4 KB cap, browser-event
  allow-list, bot UA drop, in-memory rate limit (IP is only an in-memory key,
  never stored), user id resolved server-side from the Supabase session for
  user-bound events.
- Table: RLS on, zero client policies, privileges revoked from `anon` and
  `authenticated`. Reads/writes only via service role in Pages Functions.
  `user_id` FK `on delete set null` (account deletion detaches growth rows).
- Report reads `course_progress` only as `state->progress` and
  `state->student->introComplete`, and `cadence_messages` only as
  `user_id, mode, created_at`. It never reads `content`. The report payload
  contains no emails.
- Browser: honors Global Privacy Control and Do Not Track (nothing stored or
  sent). No cookies, no third-party scripts, no fingerprinting, no session
  replay. No Meta/TikTok pixel, no Google Ads tag, no new GA. A static test
  fails the build if any of these appear.
- Staff/test exclusion: Admin sign-in marks that browser internal.
  `?aimt_internal=1` marks any browser (`?aimt_internal=0` clears). Admin
  accounts are internal server-side. Owner purchases, Stripe test mode, $0 checkouts and
  staff/complimentary/scholarship/manual grants are never paid.
- Payment security unchanged: the Stripe request, price validation,
  signature verification, entitlement write and webhook response are
  untouched. Growth writes run after them, in the background, and can't
  throw.
- Privacy policy (`privacy.html` §1, §2, §4) updated to describe this before
  it's enabled, as that policy promised.

## 11. Known limitations

- Visitor counts are per-browser and directional. Ad blockers rarely block a
  same-origin `/api/growth/collect`, but GPC/DNT users are intentionally
  absent.
- Cross-device journeys (lead on phone, purchase on laptop) aren't joined.
  Joining by email would require storing lead emails, which isn't wired.
- Revenue is gross. A `charge.refunded` handler would make it net (future).
- The report reads up to 50,000 growth events per view. Past that, Admin
  warns and a SQL rollup/RPC becomes the next step.
- Weeks are UTC.

## 12. One-time owner actions (production)

1. **Run the migration.** In the Supabase SQL editor, run
   `supabase/migrations/20261001_create_growth_events.sql` (additive,
   idempotent). Until then, Admin → Growth still shows paid enrollments,
   activation, certification and Cadence adoption, and marks every
   browser-measured metric *Not yet measurable*. Growth writes fail silently
   and never affect checkout or the webhook.
2. **Verify security** (each query should return the value in the comment):

   ```sql
   select relrowsecurity from pg_class where oid = 'public.growth_events'::regclass;      -- true
   select count(*) from pg_policies where schemaname = 'public' and tablename = 'growth_events'; -- 0
   select has_table_privilege('anon', 'public.growth_events', 'INSERT'),
          has_table_privilege('anon', 'public.growth_events', 'SELECT'),
          has_table_privilege('authenticated', 'public.growth_events', 'INSERT'),
          has_table_privilege('authenticated', 'public.growth_events', 'SELECT');           -- f, f, f, f
   ```
3. **Merge/deploy** the branch (Pages). No new environment variables are
   needed: it reuses `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `STRIPE_SECRET_KEY`.
4. After deploy, open Admin → Growth → **Reconcile revenue from Stripe** once
   to backfill revenue for purchases made before tracking.
5. Sign in to Admin once from each browser you use to browse the public site
   (or visit any page with `?aimt_internal=1`), so your own visits are
   excluded.

Local end-to-end QA (no production traffic):
`node scripts/growth-local-qa-server.mjs 8791`. It runs the real handlers
against in-memory Supabase/Stripe stand-ins and rewrites the production
Supabase URL in served pages to the local mock.
