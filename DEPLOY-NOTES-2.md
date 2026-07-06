# Session 2 — Deploy Notes
**Contents:** verifiable certificates (credential IDs + /verify page) · legal pages · staff allowlist removal

**Zero new env vars needed.** Just: files → repo, one migration → Supabase, edits → Claude Code, push.

---

## 1. Files → repo (new, no replacements this time)

| File | Goes to |
|---|---|
| `supabase/migrations/20260706_create_completions.sql` | `supabase/migrations/` — commit AND run in Supabase (step 2) |
| `functions/api/issue-certificate.js` | `functions/api/` |
| `functions/api/verify-credential.js` | `functions/api/` |
| `verify.html` | repo root |
| `terms.html` | repo root |
| `privacy.html` | repo root |
| `refunds.html` | repo root |

## 2. Supabase — run the migration
SQL Editor → paste `20260706_create_completions.sql` → Run.
It creates the `completions` table AND inserts entitlement rows for the three
staff emails (this is what makes removing the client allowlist safe — staff
now pass the same entitlement check as students).
The "destructive operations" warning will appear again (drop policy lines) — same
as last time, safe, click Run query.

## 3. Claude Code edits

### Edit A — headspa-mastery.html: remove the staff allowlist
1. Delete the `const STAFF_EMAIL_ALLOWLIST = [ ... ];` array (near line ~7255).
2. Delete the `function isAllowlistedStaffEmail(email) { ... }` function.
3. At the two call sites (near lines ~7486 and ~7526), replace:
   `const allowlistedStaff = isAllowlistedStaffEmail(user.email);`
   with:
   `const allowlistedStaff = false; // staff access now via entitlement rows (see 20260706 migration)`
   Behavior is preserved: staff emails have entitlement rows, so the normal
   entitlement path admits them.

### Edit B — headspa-mastery.html: server-issued certificate
In `function showCertificate()`, directly AFTER the line
`if (dateEl) dateEl.textContent = dateStr;`
insert:

```javascript
  // Server-issued verifiable credential
  (async () => {
    const credEl = document.getElementById('certCredentialId');
    if (!credEl) return;
    credEl.textContent = 'Issuing credential…';
    try {
      const { data } = await supabaseClient.auth.getSession();
      const token = data?.session?.access_token || '';
      const r = await fetch('/api/issue-certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        },
        body: JSON.stringify({ student_name: name || 'Graduate' })
      });
      const result = await r.json();
      if (r.ok && result.credential_id) {
        credEl.textContent = 'Credential ID: ' + result.credential_id + ' · verify at aimt-site.pages.dev/verify.html';
      } else {
        credEl.textContent = result.error || 'Credential could not be issued — contact support.';
      }
    } catch (_) {
      credEl.textContent = 'Credential could not be issued — check your connection and reopen this certificate.';
    }
  })();
```

Then in the certificate overlay markup (`#certOverlay`), add a credential line
directly after the element with id `certDate`:

```html
<div id="certCredentialId" style="font-family: var(--aimt-font-mono, monospace); font-size: 0.62rem; letter-spacing: 0.08em; opacity: 0.65; margin-top: 0.9rem;"></div>
```

(If `certDate` sits inside a wrapper, place this as a sibling at the same level.
Match surrounding indentation. Keep it subtle — it's the fine print of the cert.)

### Edit C — student-access.html: remove the staff allowlist
Same treatment as Edit A: delete the allowlist array and
`isAllowlistedStaffEmail` function, and neutralize the three call sites
(lines ~738, ~756, ~853) with the smallest change that makes the
staff-allowlist branches inert — e.g. `const allowlistedStaff = false;` and
letting `if (false)` branches or `return { ok: false }` defaults stand.
Do not alter any other sign-in/entitlement logic.

### Edit D — footer links on existing pages
In `index.html`, `courses.html`, `headspa-mastery.html`, `student-access.html`,
`success.html`: add links to Terms (`terms.html`), Privacy (`privacy.html`),
and Refunds (`refunds.html`) in each page's existing footer, matching that
footer's current markup/style. If a page has no footer, add a minimal one
before `</body>` using existing design tokens (muted, small, centered).

### Suggested prompt for Claude Code
> Read CLAUDE.md, then DEPLOY-NOTES-2.md section 3. Apply edits A, B, C, D
> exactly as specified. Smallest possible diffs; touch nothing else. Show me
> the diff summary, then commit with the message
> "Session 2: verifiable certificates, legal pages, allowlist removal" and push.

## 4. Verify (5 min)
- [ ] Visit `/terms.html`, `/privacy.html`, `/refunds.html`, `/verify.html` — render in dark AIMT style
- [ ] Verify page with garbage ID (`AIMT-HSM-2026-ZZZZZZ`) → "Not Found" card
- [ ] Signed in as staff on the course page → still enters course (entitlement row working)
- [ ] View-source on headspa-mastery.html → no Gmail addresses present
- [ ] (After genuinely completing all modules) certificate shows a credential ID; paste it into /verify → "Verified · Authentic"

## Notes & decisions Brandon may want to change
- **Refund window is set to 14 days** (positioned against USTI's non-refundable
  policy). To change: edit refunds.html — the window appears in 3 places.
- **Support email is temporarily brandmrice@gmail.com** on all three legal
  pages (5 mailto links total). Swap to support@<domain> when the custom
  domain + email exist — add to the domain-day checklist.
- **verify.html canonical URL + the credential line in Edit B reference
  aimt-site.pages.dev** — update both on domain day.
- Legal drafts are solid, plain-language standards for an online course
  business, but they're drafts, not legal advice — worth a one-hour attorney
  review before or shortly after launch.

## What this session closes (audit items)
- ✅ #5 Legal pages (terms/privacy/refunds) + support contact
- ✅ #10 Staff allowlist fully out of client code
- ✅ #12 Server-issued verifiable certificates + public /verify page
