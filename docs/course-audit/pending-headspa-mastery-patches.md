# `headspa-mastery.html` patches — APPLIED 2026-09-15

**Status update:** Module 5 Listen Mode source/generation work concluded and
`headspa-mastery.html` was unfrozen. All three patches below were applied
exactly as specified, verified against the live file immediately before
applying (each `old text` string still matched exactly once at the cited
line), and confirmed via `git diff` to be isolated, non-curriculum, 3-line
changes with no other content touched. This document is kept for the audit
trail; the patches are no longer pending.

Original framing preserved below for history:

`headspa-mastery.html` is off-limits for direct writes in this task — it is the
single source-of-truth file a separate, in-progress "Listen Mode" audio
narration rebuild of Module 5 is actively working from. Every edit below was
identified, verified against the live file, and written out here as an exact
diff for the owner (or the Listen Mode session, once it's done with the file)
to apply by hand.

---

## Patch set: Clean Course URL SEO completion (Task 3)

**Context:** `_redirects` now serves `/head-spa-certification` as the public
canonical route for the course (rule 1: rewrite `/head-spa-certification` →
`headspa-mastery.html`, 200; rule 3: legacy `/headspa-mastery.html` → 301 to
the clean URL). Every other page in the repo (`index.html`, `courses.html`,
`my-aimt.html`, `refunds.html`, `head-spa-readiness.html`, `verify.html`,
`privacy.html`, `terms.html`, `student-access.html`, `success.html`) has
already been updated in this branch's working tree to link/reference
`head-spa-certification` directly instead of `headspa-mastery.html`.

I grepped the full repo (`grep -rn "headspa-mastery\.html\|head-spa-certification" --include="*.html" .`, plus targeted checks of every `canonical` and `og:url` tag site-wide) to find the "three previously-deferred references" the task described. **All three turned out to live inside `headspa-mastery.html` itself** — there were not two outside it as the task briefing assumed. I'm reporting that honestly rather than inventing edits elsewhere; see the closure report for confirmation of the exhaustive search. So this file contains all three, and nothing was eligible to apply directly outside the protected file.

### Patch 1 of 3 — `<link rel="canonical">` (line 9)

**File:** `headspa-mastery.html`
**Exact old text:**
```html
<link rel="canonical" href="https://aimtrichology.com/headspa-mastery.html">
```
**Exact new text:**
```html
<link rel="canonical" href="https://aimtrichology.com/head-spa-certification">
```
**Reasoning:** The canonical tag should point at the public canonical route
(`/head-spa-certification`), not the legacy filename, so search engines
consolidate signals on the clean URL directly instead of following the 301
every time. This does not touch the physical filename, the rewrite rule, or
any query-param-driven behavior — text-only change inside `<head>`.

### Patch 2 of 3 — `og:url` meta tag (line 14)

**File:** `headspa-mastery.html`
**Exact old text:**
```html
<meta property="og:url" content="https://aimtrichology.com/headspa-mastery.html">
```
**Exact new text:**
```html
<meta property="og:url" content="https://aimtrichology.com/head-spa-certification">
```
**Reasoning:** Same rationale as Patch 1 — social platforms and crawlers that
read `og:url` should resolve straight to the canonical clean URL rather than
a legacy path that immediately 301s. Purely a content-attribute change; no
structural or behavioral impact.

### Patch 3 of 3 — internal self-link in the page footer (line 4405)

**File:** `headspa-mastery.html`
**Exact old text:**
```html
          <a href="headspa-mastery.html">Head Spa Certification</a>
```
**Exact new text:**
```html
          <a href="head-spa-certification">Head Spa Certification</a>
```
**Reasoning:** This is the "Education" footer link inside the course/sales
page's own footer — the page linking to itself by the legacy filename
instead of the clean URL, the same pattern already fixed in every other
page's footer (e.g. `courses.html` line 555, `index.html` line 1393,
`refunds.html`/`privacy.html`/`terms.html`/`verify.html`'s shared legal-nav
line all now read `href="head-spa-certification"`). Applying this patch
makes `headspa-mastery.html`'s footer consistent with the rest of the site
and stops sending visitors through an avoidable 301 hop from a link the page
controls itself. This is a plain anchor with no query string and no
`onclick` — does not touch `?enter=1`, `?cert=1`, Review Mode, or any
authenticated-routing behavior.

---

### Verification performed (without editing the file)

- Confirmed via `grep -c` that each `old text` string above appears **exactly
  once** in `headspa-mastery.html` at the line numbers cited, so each patch
  is unambiguous to apply with a straightforward find-and-replace.
- Confirmed no other `<link rel="canonical">`, `og:url`, or
  `href="headspa-mastery.html"` (live anchor, not a code comment) exists
  anywhere else in the repo pointing at the legacy course URL — this really
  is the complete set of three.
- Confirmed `_redirects` rule 1 rewrites `/head-spa-certification` →
  `headspa-mastery.html` (200, proxy-style, query string passed through
  untouched) and rule 3 redirects the legacy filename → the clean URL (301),
  so once these three patches are applied, `headspa-mastery.html`'s own
  canonical/og:url/self-link will point straight at the route rule 1 already
  serves — no redirect loop, no behavior change to `?enter=1`, `?cert=1`,
  Review Mode, or authenticated routing.
