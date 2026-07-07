# AIMT — Domain Day Checklist (aimtrichology.com)
*Self-contained. Run top to bottom — ORDER MATTERS. ~1 hour total.*
*Context: site currently on aimt-site.pages.dev, which Google Safe Browsing
has false-positive flagged. The custom domain is both the launch requirement
and the fix.*

## 0. Prerequisites
- [ ] Click the ICANN verification email from the registrar (REQUIRED — domain
      suspends in ~15 days if ignored)
- [ ] Confirm all pending git commits are pushed (GitHub Desktop shows
      "Fetch origin", no ↑) and Cloudflare's latest deploy is green

## 1. Attach the domain (Cloudflare, ~5 min + DNS propagation)
- [ ] dash.cloudflare.com → Workers & Pages → aimt-site → **Custom domains**
      (or Domains tab) → Add → `aimtrichology.com`
- [ ] Also add `www.aimtrichology.com` (Cloudflare will offer to redirect it)
- [ ] Wait until the domain shows Active/verified, then load
      https://aimtrichology.com — the site should appear with a padlock
      (Cloudflare issues SSL automatically; can take a few minutes)
⚠️ Do NOT test sign-in yet — auth doesn't know this origin exists.

## 2. Supabase — teach auth the new origin (~5 min)
- [ ] supabase.com → project → Authentication → **URL Configuration**
- [ ] Site URL: `https://aimtrichology.com`
- [ ] Redirect URLs: ADD `https://aimtrichology.com/**` (keep the pages.dev
      entries too during transition)

## 3. Cadence Worker — allow the new origin (~3 min)
- [ ] Cloudflare → Workers → headspa-proxy → Settings → Variables
- [ ] `ALLOWED_ORIGINS` → change to:
      `https://aimtrichology.com,https://aimt-site.pages.dev`
- [ ] Save/redeploy the Worker

## 4. Stripe (~5 min)
- [ ] Developers → Webhooks → the AIMT Course Access endpoint → edit URL to
      `https://aimtrichology.com/api/stripe-webhook`
- [ ] Send test event → expect 200 (or 400-signature — see prior notes; either
      proves the endpoint is reachable at the new address)
- [ ] Settings → Business/Public details → update website to
      aimtrichology.com, and NOW update the statement descriptor to AIMT
      (the coherence objection is gone — the account has an AIMT web presence)

## 5. In-repo URL swaps (Claude Code, one commit)
Paste to Claude Code:
> Read CLAUDE.md. Domain cutover: replace every occurrence of
> `https://aimt-site.pages.dev` with `https://aimtrichology.com` across the
> repo — og:image and canonical tags in all pages, sitemap.xml locs,
> robots.txt sitemap line, verify.html canonical, and the credential line in
> headspa-mastery.html's certificate code ("verify at ..."). Also update
> CLAUDE.md's deployment notes to name the new domain. Show diff summary,
> commit as "Domain cutover: aimtrichology.com", push if possible.
Then push via GitHub Desktop if needed; wait for green.

## 6. Full test pass ON THE NEW DOMAIN (~15 min)
- [ ] Homepage loads, padlock, no Chrome warning
- [ ] Sign in at /student-access.html → lands on dashboard
- [ ] Dashboard → Continue → enters course
- [ ] Ask Cadence a question → normal answer (proves Worker origin update)
- [ ] /verify.html garbage ID → "Not Found" card
- [ ] /terms.html, /privacy.html, /refunds.html load
- [ ] Password reset email arrives and its link opens on aimtrichology.com
      (proves Supabase redirect config)

## 7. Safe Browsing cleanup (async, ~10 min to file)
- [ ] search.google.com/search-console → Add property →
      `https://aimtrichology.com` → verify (HTML tag method; Claude Code adds
      the meta tag, push)
- [ ] Add `https://aimt-site.pages.dev` as a second property the same way
- [ ] pages.dev property → Security & Manual Actions → Security Issues →
      Request Review. Note: "Legitimate education business (American
      Institute of Modern Trichology). Site was in pre-launch development on
      the shared pages.dev subdomain; login form is Supabase authentication
      for enrolled students. Production has moved to aimtrichology.com."
- [ ] Optional: submit sitemap for aimtrichology.com in its property

## 8. Aftercare
- [ ] Update Google/Chrome saved passwords entry to the new domain if prompted
- [ ] The pages.dev URL keeps working as an alias — fine during transition;
      post-launch, consider redirecting it entirely to the custom domain
- [ ] Email: when ready, set up support@aimtrichology.com (Cloudflare Email
      Routing forwards to Gmail free, ~10 min) → then swap the 5 mailto links
      on terms/privacy/refunds via Claude Code

## Still-open decisions (carry-over, unrelated to domain)
1. **Certificate signatory** — name + title to replace "Cadence — Program
   Director, AIMT" on all cert mocks and the real overlay. BLOCKS the
   certificate accuracy sweep (prompt already written, waiting on the name).
2. Course rename (with Cady) — clinical direction, phrase bank on file
3. Badge mark approval + palette verdict (Pass 2 gate)
4. Vimeo IDs · final images · Pass 1 report review
