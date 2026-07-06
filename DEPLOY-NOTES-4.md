# Session 4 — Deploy Notes
**Contents:** claims hygiene (all false/unsourced claims fixed) · badge propagation · rename-proofing · verified AI stats with sources

No migrations. No env vars. Files + edits + push.

---

## 1. Files → repo (drag in, then Claude Code does edits)
| File | Goes to | Action |
|---|---|---|
| `favicon.svg` | repo root | **REPLACES** existing (now the badge mark) |
| `assets/aimt-share.png` | `assets/` | **REPLACES** existing og image (badge on dark; v1 — Pass 2 may refine) |
| `assets/brand/aimt-badge-transparent.png` (+ 600, 240) | `assets/brand/` (new folder) | NEW |
| `DEPLOY-NOTES-4.md` | repo root | NEW |

Because aimt-share.png keeps its filename, all existing og:image tags keep working — zero HTML edits needed for social cards.

## 2. Claude Code edits — CLAIMS HYGIENE (exact replacements)

### Edit A — index.html: "printed and digital certificate"
Find the sentence containing "printed and digital certificate" and replace that claim with:
"Every AIMT graduate receives a digital certificate carrying a unique, independently verifiable credential ID."

### Edit B — "Mobile-first" (index.html + courses.html course cards)
Replace each "Mobile-first" card/pill label with: "Learn on any device"
(Reason: D9 mobile pass not yet performed; claim restored after verification.)

### Edit C — index.html: the AI exposure chart section
Replace the unsourced figures (35.8%, 34.3%, 28.4%, 26.9%, ~4%, 35%) and their
labels with the following verified content, keeping the section's existing
visual design/markup structure:

Headline stat block (replaces the bar figures):
- "50–55%" — "of U.S. jobs projected to be reshaped by AI within 2–3 years (BCG, 2026)"
- "1 in 4" — "workers globally are in occupations with some generative-AI exposure — led by clerical and administrative work (ILO, 2025)"
- "Least exposed" — "hands-on, client-facing personal services rank among the least AI-exposed occupations (Pew Research Center)"
- "56%" — "wage premium commanded by workers who pair their profession with AI skills (PwC, 2025)"

Closing line for the section (replace or add):
"Roles built on touch, trust, and contextual judgment are more likely to be
augmented than automated (BCG, 2026). Skill quality still maps directly to
client outcomes — and training compounds in value where service cannot be
automated away."

Required: add a small muted source line at the bottom of the section:
"Sources: Boston Consulting Group (2026) · International Labour Organization (2025) · Pew Research Center · PwC (2025)"

### Edit D — index.html: "12-module certification programs" (plural blanket claim)
Replace "12-module certification programs that build real competency — not
highlights, not tips." with:
"Focused certification programs that build real competency — not highlights,
not tips." ("12 modules" remains ONLY in HeadSpa-specific contexts: its course
card, its course page.)

### Edit E — the "Aisha M." element (headspa-mastery.html)
Locate the element containing "Aisha M." and the percentage figures (47%, 72%,
58%, 45%, 30%, 18%, 85%). Owner has confirmed: no false claims may remain.
- If it renders as a UI demo/screenshot mock: replace the personal name with a
  neutral placeholder ("Student Dashboard — illustrative") and ensure nothing
  reads as a real person's outcome.
- If it functions as a testimonial: remove the element entirely.
Report which case it was in the diff summary.

### Edit F — index.html: "AIMT · Cohort 01" on the certificate mock
Remove "· Cohort 01" (self-paced product; cohort implies scheduled intakes).

### Edit G — rename-proofing "mastery" as a common noun (NOT the course title)
The course name "HeadSpa Mastery" stays untouched everywhere pending the naming
decision. But replace these common-noun uses:
- index: "a credential designed to signal real mastery" → "a credential built
  on demonstrated clinical-level training"
- courses: "A credential issued for demonstrated mastery" → "A credential
  issued for demonstrated competency"
- courses: "Commercial clarity is part of practitioner mastery" → "Commercial
  clarity is part of practitioner-grade training"
- headspa-mastery.html: section title "Applied Mastery Framework" → "Applied
  Practitioner Framework"

### Edit H — credential prefix (rename-proof before first issuance)
In functions/api/issue-certificate.js change:
`const CREDENTIAL_PREFIX = 'AIMT-HSM';` → `const CREDENTIAL_PREFIX = 'AIMT-HS';`
And in functions/api/verify-credential.js confirm the regex
`/^AIMT-[A-Z]{2,6}-\d{4}-[A-Z2-9]{4,10}$/` already accepts 2-letter course
codes (it does — no change needed, just verify).
Zero credentials exist; this is the last free moment to set this.

## 3. Claude Code edits — BADGE PROPAGATION (D4: intentional, not forced)
1. **Favicon:** already handled by the favicon.svg replacement (file drop).
   Verify every page's <head> still links favicon.svg (Session 3 Edit B did this).
2. **Certificate overlay (headspa-mastery.html):** add the badge above or
   beside the "Certificate of Completion" title in the #certOverlay markup:
   `<img src="assets/brand/aimt-badge-240.png" alt="AIMT seal" style="width:110px;height:auto;display:block;margin:0 auto 0.8rem;">`
   Adjust placement to the overlay's existing structure; the seal should read
   as the certificate's authority mark.
3. **index.html hero/brand area:** IF the page currently displays an image
   logo, replace its src with assets/brand/aimt-badge-600.png (keep display
   size similar). If the brand is text-only (wordmark), do NOT force the badge
   into the header — instead place the badge once in the certificate-preview
   section (it already shows a certificate mock) using aimt-badge-240.png.
4. **my-aimt.html + verify.html:** no badge insertion (keep quiet pages quiet);
   favicon covers them.
Report where the badge landed in the diff summary.

## 4. Suggested Claude Code prompt
> Read CLAUDE.md, then DEPLOY-NOTES-4.md sections 2 and 3. Apply edits A–H and
> the badge propagation exactly as specified. Course name "HeadSpa Mastery"
> must remain unchanged everywhere. Smallest diffs, no logic changes except
> Edit H's one-line constant. Show me the full diff summary including which
> case Edit E was and where the badge landed, then commit as
> "Session 4: claims hygiene, verified AI stats, badge propagation,
> rename-proofing" and push if credentials allow.

## 5. Compliant authority language (phrase bank — for all future copy)
The clinical/standard positioning, legally safe:
✅ "the clinical standard for head spa practice" · "practitioner-grade
certification" · "trichology-informed training" · "checkpoint-verified
competency" · "the standard serious practitioners hold themselves to" ·
"built to outlast trends — and scrutiny"
❌ NEVER: "required to practice" · "licensed" (as adjective for the cert) ·
anything implying legal necessity, state authorization, or that uncertified
practice is improper/illegal. (This is the Terms §2 line; crossing it in
marketing voids the protection the Terms provide.)

## 6. Also queued (run after this session's push)
**Pass 1 consistency audit** — paste the audit prompt from
AIMT-Art-Direction-Brief.md into Claude Code. It outputs DESIGN-AUDIT.md for
owner review; normalization commit comes after approval, separately from
Session 4.

## 7. Standing notes
- Vimeo: 12-slot STEP_VIDEO_IDS array is live and waiting; links wire in any
  time, individually or in batches.
- Domain (aimtrichology.com via Cloudflare Registrar) day-of swap list lives in
  DEPLOY-NOTES-3 §Notes — now also includes: Stripe descriptor/website,
  og:image absolute URLs, sitemap/robots URLs, verify.html canonical +
  certificate credential line, Worker ALLOWED_ORIGINS, Supabase auth redirects.
