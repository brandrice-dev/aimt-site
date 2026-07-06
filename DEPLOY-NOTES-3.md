# Session 3 — Deploy Notes
**Contents:** My AIMT student dashboard · SEO pack (meta, robots, sitemap, favicon) · Coming Soon cards · housekeeping (git auth fix, decoy archive)

**No new env vars. No Supabase migration this time.** Files + edits + push.

---

## 1. Files → repo root (all new)
`my-aimt.html` · `favicon.svg` · `robots.txt` · `sitemap.xml` · `DEPLOY-NOTES-3.md`

## 2. Claude Code edits

### Edit A — student-access.html: land students on the dashboard after sign-in
Find (near line ~634): `window.location.href = COURSE_ENTRY_URL;`
Replace with:      `window.location.href = 'my-aimt.html';`
(Leave the COURSE_ENTRY_URL constant itself in place — other flows may
reference it. Note: students who clicked "resume" from the course page will
now land on the dashboard and click Continue — acceptable, one extra click.)

### Edit B — favicon + meta descriptions on every page
For each of: index.html, courses.html, headspa-mastery.html,
student-access.html, success.html, verify.html, terms.html, privacy.html,
refunds.html, my-aimt.html — inside <head>:
1. Add (if not present): `<link rel="icon" type="image/svg+xml" href="favicon.svg">`
2. Add meta descriptions to pages missing them:
   - courses.html: `<meta name="description" content="AIMT certification courses for beauty professionals — modern, self-paced programs with an AI study companion and verifiable credentials. Featuring HeadSpa Mastery.">`
   - student-access.html: `<meta name="description" content="Sign in to your AIMT student account to access your courses, progress, and certificates.">`
   - success.html: `<meta name="description" content="Enrollment confirmed — create your AIMT student account and begin your course.">`
3. Add `<meta name="robots" content="noindex">` to student-access.html and
   success.html (utility pages; keep them out of search).

### Edit C — courses.html: Coming Soon cards
The page already contains one card with class `course-card coming-soon future`.
Duplicate that exact markup pattern to show these three upcoming courses
(replace the existing placeholder if it's generic, or add alongside):
1. **Scalp Science Foundations** — "The anatomy, biology, and disorders knowledge base for serious scalp practitioners." — Coming soon
2. **Scalp Assessment Intensive** — "Microscopy, documentation, and consultation mastery." — Coming soon
3. **Price Like a Pro** — "Pricing strategy and service economics for beauty professionals." — Coming soon
Match existing card structure/classes exactly; no new CSS. No prices, no links
(or link to courses.html#notify if an anchor exists). Keep copy short.

### Edit D — index.html + courses.html: link to My AIMT
Wherever the header/nav currently links to student-access.html (e.g. "Student
Access" / "Sign in"), keep the link target as student-access.html but no copy
changes needed — student-access now forwards signed-in users appropriately via
Edit A. ONLY if a nav label literally says "Course Login" or similar, leave it.
(This edit is a no-op check — change nothing unless a hardcoded link points
directly at headspa-mastery.html?enter=1 in a nav; if so, point it at
student-access.html.)

### Suggested prompt for Claude Code
> Read CLAUDE.md, then DEPLOY-NOTES-3.md section 2. Apply edits A, B, C, D
> exactly as specified. Smallest diffs. Show me the diff summary, then commit
> as "Session 3: My AIMT dashboard, SEO pack, coming soon cards" and push.

## 3. Housekeeping (one-time fixes, via Claude Code)

### 3a. Fix git push credentials (kills the GitHub Desktop dance)
Tell Claude Code:
> Run `git config credential.helper osxkeychain` in this repo, then verify
> with `git push --dry-run origin main`. If it succeeds without prompting,
> credentials are fixed. If it fails, report the exact error.
GitHub Desktop already stored valid credentials in the macOS keychain;
this points command-line git at the same keychain. If dry-run still fails,
fall back to the GitHub Desktop push button as before — no harm.

### 3b. Archive the decoy folder
Tell Claude Code:
> Find the folder named aimt-site-v4 (likely in iCloud Drive or Desktop).
> Do NOT delete it. Rename it to zz-ARCHIVE-aimt-site-v4 and tell me its
> full path. If any files inside differ from the real repo in ways that look
> like unsaved work, list them before renaming.

## 4. Verify (5 min, after deploy)
- [ ] Sign in at student-access.html → lands on My AIMT dashboard
- [ ] Dashboard shows HeadSpa Mastery card with your progress % and Continue
- [ ] Continue button → enters the course
- [ ] Sign out → returns to homepage; visiting /my-aimt.html signed-out bounces to sign-in
- [ ] Browser tab shows the "A" favicon on every page
- [ ] /robots.txt and /sitemap.xml load
- [ ] courses.html shows the three Coming Soon cards in matching style

## Notes
- **Dashboard Resources section** ships with a friendly empty state. To
  activate downloads: Supabase → Storage → create PRIVATE bucket
  `course-resources` → upload files → add entries to the RESOURCES array at
  the top of my-aimt.html's script (format is commented in place). Signed
  URLs are generated per-student, 1-hour expiry, entitlement enforced by
  bucket privacy + auth.
- **Domain-day updates** (running tally): robots.txt sitemap URL, sitemap.xml
  locs, verify.html canonical + credential line in cert, og:image URLs,
  Stripe descriptor + website, Worker ALLOWED_ORIGINS, Supabase auth redirect
  allowlist.
- **sitemap/robots use aimt-site.pages.dev** for now, by design.

## What this session closes (audit items)
- ✅ Student dashboard (your #1 ask)
- ✅ #14/#15 partial: favicon, meta descriptions, robots, sitemap, noindex on
  utility pages (image compression still pending your final images)
- ✅ #15 orphaned future-course pages → Coming Soon cards decision
- ✅ Housekeeping: git credentials + decoy archived
