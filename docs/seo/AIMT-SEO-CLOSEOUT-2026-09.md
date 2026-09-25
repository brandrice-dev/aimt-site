# AIMT SEO Build/Audit Closeout — September 2026

Final audit/remediation pass for the AIMT SEO project, branch
`seo/final-seo-closeout`, based on commit `5d69d9798b8c257568aa85d37c1946c14f77d54b`.
This record summarizes the completed workstreams and the state verified
during this closeout pass. Status is assigned only where this pass (or
direct inspection of current repo/production state) produced actual
evidence — historical PR references are cited for provenance, but the
COMPLETE/OPEN determination below reflects what was independently
re-verified now, not what an old report claimed.

## Workstreams

### SEO-01 — Canonical & Crawl Foundation
Historical work: PR #12 (`seo/canonical-crawl-foundation`, "SEO
foundation: normalize canonical tags, sitemap, and internal links").
**Re-verified this pass:** every sitemap URL (15 total) returns a
correct, extensionless, apex (`aimtrichology.com`) self-referencing
canonical tag; `robots.txt` is a minimal `Allow: /` with a sitemap
reference and no accidental disallow rules; Cloudflare Pages'
`.html`-stripping behavior is confirmed uniform across every static
page in the repo (not just the ones with explicit `_redirects` rules).
**STATUS: COMPLETE.**

### SEO-02 — Private Resource Index Hygiene
Historical work: PR #13 (`seo/private-index-hygiene`, "SEO: exclude
private course resources from indexing").
**Re-verified this pass (fresh inspection, not the old report):** all 4
PDF files in the repo have matching `X-Robots-Tag: noindex, nofollow`
rules in `_headers`, confirmed actually served locally via
`wrangler pages dev`; `aimt-service-timer.html`, `admin.html`,
`my-aimt.html`, `student-access.html`, and `success.html` all carry
`<meta name="robots" content="noindex...">`; `robots.txt` has no
`Disallow` rules that would prevent a crawler from seeing those noindex
directives (a `Disallow` there would be a real hazard — crawlers can't
honor a noindex on a page they're blocked from fetching — and none
exists).
**STATUS: COMPLETE.**

### SEO-03 — Entity & Structured Data
Historical work: PR #14 (`seo/entity-schema-foundation`, "SEO:
establish AIMT entity structured data").
**Re-verified this pass:** JSON-LD parses cleanly on every page checked
(homepage, About, Education Library, Hair Loss hub, both Education
articles, Head Spa Certification course page); the `Organization` `@id`
(`https://aimtrichology.com/#organization`) is byte-identical across
every page's structured data; the `Course` schema on
`/head-spa-certification` contains no fabricated rating, review, date,
or award fields — only name, description, provider, course mode, and a
real price/currency offer.
**Open observation (not a defect):** `/courses` has no structured data
at all. Not required, and the task's own instruction is not to add
schema merely to raise a count — noted as a future enhancement
opportunity only.
**STATUS: COMPLETE** (courses.html schema gap logged as a non-blocking
open item, see below).

### SEO-04 — Homepage Search Intent Separation
Historical work: PR #15 (`seo/homepage-metadata-separation`, "SEO:
separate homepage search intent").
**Re-verified this pass:** homepage title/meta description target
institutional + head-spa-education intent distinctly from
`/head-spa-certification`'s transactional/course intent; no duplicate
title/description pair found between the two.
**STATUS: COMPLETE.**

### SEO-05 — Information Architecture Strategy
Historical work: `b74d476` ("Launch AIMT Education Library
architecture"), shipped via PR #22.
**Re-verified this pass:** the `/education` → `/education/{cluster}` →
`/education/{cluster}/{article}` route shape is live, coherent, and
extensionless at every level; both current Education articles resolve
correctly under it; the shape has now been proven twice (hair-cycle,
telogen-effluvium) without needing structural changes for the second
topic.
**STATUS: COMPLETE.**

### SEO-06 — Public Authority Foundation
Historical work: PR #16 (`seo/public-authority-foundation`, "SEO:
build AIMT public authority foundation"), plus PR #21
(`seo/research-standards-clearance-alignment`).
**Re-verified this pass:** `/about`, `/about/standards`, and
`/about/research-standards` all live, correctly titled/described,
correctly canonicalized, and (as of this pass) reciprocally linked with
the Education cluster.
**Found and fixed this pass:** `/about/research-standards` still said
the library had launched with "its first cleared topic," naming only
the hair-cycle page — stale as of telogen-effluvium's publication.
Corrected to accurately describe both cleared topics.
**STATUS: COMPLETE** (after the correction made in this pass — see
Phase 3 in the audit summary below).

### Publication Editor / clearance architecture
Deterministic v1 readiness assessment → bounded AI synthesis (max 3
model calls) → deterministic post-synthesis validator → clearance
write, with a guarded, atomic write path
(`replaceNonPublicClearanceRecord`, `publishClearanceRecord`) that
never accepts a caller-supplied arbitrary record and never touches
`clearance_mode`/`generation_source_hash`/`publication_clearance` on a
publish transition. HUMAN_REVIEW now requires structured justification;
a genuine non-core evidence conflict is resolved via symmetric
exclusion, never a one-sided pick. 197 tests
(`tests/research-publication-clearance.test.mjs`) + 52 + 46 + 35 across
the synthesis validator/orchestrator/reconciliation suites, all passing
as of this pass.
**STATUS: COMPLETE** for the two topics it has processed; this is a
proven, tested mechanism, not a one-off script.

### Page Builder
Generic, non-topic-branching draft assembly
(`classifyCoreFactualPoints`, `resolveEditorialUnit`,
`buildPageDraft`/`validatePageDraft`) proven across two independently
re-synthesized evidence shapes for telogen-effluvium (the original
synthesis and a corrected re-synthesis after the non-core-conflict
narrowing), each landing in genuinely different classifier buckets, with
only the topic's own template needing rebuilding each time — the shared
mechanism itself required zero topic-specific branches. 159 tests
passing.
**STATUS: COMPLETE.**

### AIMT Education editorial voice
VERBATIM/PARAPHRASE/FRAMING model, "framing cannot carry science" rule,
enforced by a deterministic editorial audit script
(`scripts/page-builder-editorial-audit.mjs`). Proven on both published
articles; a real framing violation (a framing sentence that had drifted
into asserting a causal/mechanical claim) was caught and corrected on
telogen-effluvium before launch.
**STATUS: COMPLETE.**

### Education Library launch
`/education` hub, `/education/hair-loss` topic cluster, both live,
correctly linked to each other and to both articles. Confirmed this
pass: also now linked FROM every other major public page's footer (see
Phase 8 finding/fix below) — previously reachable only via sitemap and
the cluster's own internal links.
**STATUS: COMPLETE** (internal-linking gap found and fixed this pass).

### Hair Cycle publication
`/education/hair-loss/hair-growth-cycle` — live, indexable, in sitemap,
unchanged by this closeout pass (verified byte-identical to its
approved, published state; this closeout touched zero article prose).
**STATUS: COMPLETE.**

### Telogen Effluvium generalization/publication
`/education/hair-loss/telogen-effluvium` — live, indexable, in sitemap,
clearance published (`status=published`, `sitemap_eligible=true`,
integrity-verified). Proved the Publication Editor + Page Builder
architecture generalizes to a second, independently-selected topic,
including two governance corrections (telogen/exogen semantic fix,
non-core vitamin-D conflict exclusion) built as reusable mechanisms
rather than one-off patches.
**STATUS: COMPLETE.**

### Soft-404 remediation
See the full audit below.
**STATUS: COMPLETE** (fix implemented and verified locally; production
deployment requires merging this PR, which this closeout explicitly
does not do).

### Final crawl/index audit
See the full audit below.
**STATUS: COMPLETE.**

## Audit summary (this pass)

**Phase 1/2 — soft-404 root cause and fix.** Confirmed empirically
against production: `/this-page-definitely-does-not-exist` returned
HTTP 200 with homepage content and homepage `<title>`. Root cause: no
root-level `404.html` existed in the repo, so Cloudflare Pages' default
static-asset fallback served `index.html` for any unmatched path.
Fix: added `404.html` at repo root, built from the existing design
system (`aimt-design-system.css` / `aimt-supporting-pages.css` /
`aimt-public-nav.css`, same nav/footer/mark as every other page — no new
visual language), `<meta name="robots" content="noindex, follow">`, not
added to sitemap, links back to Home / Education Library / Courses /
About.

**Missing-route regression tests (via `wrangler pages dev`, not a
generic static server):**
| URL | Result |
|---|---|
| `/definitely-not-real` | 404 |
| `/education/not-real` | 404 |
| `/education/hair-loss/not-real` | 404 |
| `/about/not-real` | 404 |
| `/random/deep/path/not-real` | 404 |

Real routes re-confirmed still 200 after the fix, including nested
extensionless Education routes and the `/head-spa-certification`
rewrite.

**Phase 3 — public crawl/indexability sweep.** All 15 sitemap URLs:
200, correct body (not the soft-404 fallback), correct extensionless
apex canonical, no accidental noindex, sensible title, meta description,
exactly one H1 each — **except `/head-spa-certification`, which has 2**
(a second `<h1 class="mo-title">` inside an in-page course-preview
mockup section, `headspa-mastery.html`). Logged as an open item, not
fixed — `headspa-mastery.html` is explicitly a surgical-edits-only file
per this repo's own CLAUDE.md, and this is a pre-existing, low-severity
issue, not the defect this closeout was scoped to fix. Both Education
articles indexable, both in sitemap, hub links to both, articles link
back to hub/library, Research Standards page corrected to reference
current live library state (was naming only the hair-cycle page), no
`noindex`/preview-only metadata remains on either article.

**Phase 4 — private/non-indexable resource audit.** See SEO-02 above.
No gaps found; no changes needed.

**Phase 5 — redirect/canonical regression sweep.** `www` → apex
confirmed live in production (308, handled at the Cloudflare zone level,
outside this repo — no rule found or needed in `_redirects`).
`headspa-mastery.html`/`headspa-mastery` → `/head-spa-certification`
(301, single hop, no loop). Found and fixed:
`/cadence-intro-preview.html` was redirecting to `/index.html`, which
Cloudflare Pages itself then 308s to `/` — a needless two-hop chain to
the same destination. Changed the target to `/` directly. Confirmed
Cloudflare's automatic `.html`-stripping applies to every top-level
`.html` file uniformly, so no other page in the repo has a
duplicate-content risk from its own filename.

**Phase 6 — sitemap/robots final audit.** `sitemap.xml`: 15 entries, all
public, all indexable, all extensionless, no `<priority>` values, no
private/student resource, no dead route, no redirecting URL (every
entry is already the direct canonical destination). `robots.txt`: `Allow: /`
plus sitemap reference; no rule blocks public content; privacy is
enforced by `noindex`/`X-Robots-Tag`, not by `robots.txt` disallow
rules (correct — a disallow would hide those pages' own noindex
directives from crawlers).

**Phase 7 — structured data final audit.** See SEO-03 above.

**Phase 8 — internal link/orphan check.** Found: zero pages outside the
Education cluster itself linked to `/education` anywhere — homepage,
About, About/Standards, About/Research Standards, Courses, Terms,
Privacy, Refunds, Verify, and Head Spa Readiness all had no path into
the Education Library except via `sitemap.xml`. Fixed: added an
`/education` link to each of those pages' existing footer link list (no
new visual pattern — each page's own established footer format was
reused verbatim), plus a link in the homepage's and Courses' existing
footer columns. Global top navigation was deliberately NOT changed —
this is footer-link parity restoration, not a navigation redesign, and
it closes a genuine crawlability gap rather than adding an SEO-only nav
item. `headspa-mastery.html`'s footer (copyright-only, no other links
either) was deliberately left untouched, consistent with this repo's
own "surgical edits only" rule for that file.

**Phase 9 — Search Console closeout.** No authenticated Search Console
access is available in this environment (no credentials, no browser
session). No Search Console observations are reported — none were
fabricated. Owner follow-up (minimal, precise):
1. Inspect `/education` in Search Console URL Inspection.
2. Inspect `/education/hair-loss`.
3. Inspect `/education/hair-loss/hair-growth-cycle`.
4. Inspect `/education/hair-loss/telogen-effluvium`.
5. Confirm `sitemap.xml` still shows "Success" status under Sitemaps.

That's the full list. Normal sitemap discovery should surface future
articles automatically — the owner should not need to manually submit
every new page individually if the above stays healthy.

**Phase 10 — performance sanity check.** Viewport meta present on every
page checked. Both Education articles and the hub/library pages are
small (8–17 KB HTML, zero `<img>` tags — no CLS risk from missing image
dimensions, because there are no images). No obviously broken font
loading or missing-viewport pages found. `headspa-mastery.html` remains
a very large single file (~1 MB) — pre-existing, unrelated to this
closeout, explicitly out of scope to redesign here. **Core Web Vitals
were not measured** — this environment has no Lighthouse/PageSpeed
Insights access, and no score is reported rather than inventing one.

## Files changed this pass
- `404.html` (new)
- `_redirects` (cadence-intro-preview redirect: removed a redundant hop)
- `about.html`, `about/standards.html`, `about/research-standards.html`,
  `courses.html`, `head-spa-readiness.html`, `index.html`, `refunds.html`,
  `terms.html`, `verify.html` (added an `/education` link to each
  page's existing footer)
- `about/research-standards.html` (also: corrected stale "first cleared
  topic" language)
- `docs/seo/AIMT-SEO-OPERATING-MODEL.md` (new)
- `docs/seo/AIMT-SEO-CLOSEOUT-2026-09.md` (new, this file)

No changes to: Education article prose, `sitemap.xml` content beyond
what was already correct, `robots.txt`, Publication Editor / Page
Builder / clearance code, Rick/Harvester, Cadence, Stripe, auth, student
access/course progress/certification systems. Zero Anthropic calls made
during this closeout.

## Open follow-up items (non-blocking)

1. `/head-spa-certification` has two `<h1>` elements (one real page
   headline, one inside an in-page course-preview mockup). Low severity;
   requires a careful, surgical edit inside `headspa-mastery.html`
   specifically, which this closeout deliberately did not touch.
2. `/courses` has no structured data. Not a defect; an enhancement
   opportunity only, deliberately not added here per the instruction not
   to add schema merely to raise a count.
3. `about.html` describes "The AIMT Education Library" under a
   `Future` tag in its roadmap section — stale now that the library has
   launched. This is marketing/editorial copy on the About page, not a
   crawl/index defect, and was deliberately left for an explicit
   owner/editorial decision rather than rewritten unilaterally here.
4. The autonomous publishing scheduler referenced in the operating
   model does not exist yet — confirmed, separate, future project, not
   a closeout blocker.
5. No real keyword/Search Console data has ever been available for
   topic-selection decisions to date; every SEO-opportunity assessment
   used an explicitly labeled heuristic. Once Search Console access
   exists, topic selection should incorporate real query data per the
   operating model.

## SEO BUILD/AUDIT STATUS: READY TO CLOSE

The known soft-404 defect is fixed and regression-tested. Every sitemap
URL passes a fresh indexability sweep. Private resources remain
protected, re-verified against current files/headers rather than an old
report. Redirects and canonicals are clean, with one small chain fixed.
Structured data is valid and consistent sitewide. The internal-link gap
that left the Education cluster reachable only via sitemap has been
found and closed. All five open items above are explicitly non-blocking:
one is a low-severity pre-existing issue in a file this repo's own rules
protect from casual editing, one is an optional enhancement, one is an
editorial call outside this closeout's remit, and two are already-known,
already-separated future work. This closeout's own code changes are
tested (489 existing tests unaffected, plus manual route-by-route
verification via `wrangler pages dev`) and are staged in an open,
unmerged PR for owner review before anything reaches production.
