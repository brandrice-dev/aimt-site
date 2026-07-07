# AIMT — Art Direction Brief (Image Production)
*Prepared July 6, 2026 · for the final pre-launch image folder*

## The one-sentence brief
Every image should feel like it belongs to a **quiet, precise, modern institution** — clinical calm, not spa fluff; editorial, not stocky. If Atrium's imagery is warm water and candlelight, AIMT's is the same world photographed like a medical journal cover: controlled light, negative space, intention.

## Palette & tone rules (apply to every image)
- Images must sit comfortably on the site's near-black warm background (#1a1814). Favor deep shadows, warm neutrals, skin tones, and muted taupe/greige that echoes the accent (#a3968d). Avoid saturated blues/greens/pinks — one cool-toned image will look like a stranger on these pages.
- Consistent grade across ALL images: slightly lifted blacks, warm midtones, low-medium contrast. Pick one grade/preset and run everything through it — grade consistency is 80% of "cohesive design."
- No text baked into images. No borders, no watermarks.

## The shot list

### 1. Hero (index + course sales page) — the money image
- **Content:** one decisive image of the craft — hands on a scalp, the halo rinse, or a composed treatment room. Prefer a moment of *precision* (hand placement, tool detail) over a wide "spa vibes" room shot. One clear subject, generous negative space.
- **Composition:** subject weighted to ONE side (left or right third), leaving the other side quiet — that's where the headline sits. Nothing important in the center-top (nav overlaps) or bottom 15% (fold/CTA zone).
- **Specs:** shoot/export 2400×1350 minimum (16:9). Also crop a 1200×1500 (4:5) vertical of the same image for mobile if possible.
- **Delivery:** highest-quality JPEG/PNG is fine — I compress to WebP/AVIF and handle responsive sizes. Target on-site weight will be ~150–300KB (the current hero is 6.9MB — 20–40× over budget).

### 2. Course card images (4: HeadSpa Mastery + the 3 Coming Soon)
- Same grade, same crop discipline, so the catalog reads as a set: **3:2 landscape, 1200×800.** Subject centered-ish with safe margins (cards crop edges at some widths).
- HeadSpa Mastery: a signature service moment. The three future courses can use abstracted/detail shots (microscope, consultation notebook, pricing/hands-on-calculator styling) — differentiated but clearly the same family.

### 3. Module thumbnails (optional, 12)
- If modules get imagery: uniform **1:1, 800×800**, detail/macro shots (products, tools, close hand work). Uniformity matters more than variety here.

### 4. Social share card (og:image)
- **Exactly 1200×630.** Badge/wordmark + one strong image area. This is what shows when the site is texted or posted — currently a generic share image; worth one deliberate design. Keep critical content in the center 1000×524 (platforms crop edges).

### 5. Certificate artwork
- If the badge redesign lands, the certificate gets the badge at high res. Provide the badge as **SVG (preferred) or PNG ≥1200px on transparent.** Design so it reads in monochrome too (future print/emboss).

### 6. Badge / logo deliverables (for the swap)
Ask your designer (or your own production) for exactly:
- Full badge: SVG + transparent PNG @ 2000px
- Simplified mark (survives at 32px): SVG — becomes the favicon
- Horizontal lockup (badge + wordmark) for headers: SVG
- One-color white version of each (for dark surfaces — this is the one the site will actually use most)

## Claims & headline guardrails (for the copy audit later — keep in mind while designing)
- "Certification," "certificate," "credential" = ✅. Anything implying a *license* or state authorization = ❌ (the Terms page is built on this line).
- Verifiability is a differentiator we can claim hard: "independently verifiable credential" is true and provable.
- Avoid income promises ("6-figure"); "expand your service menu / command premium pricing" style framing is safe and stronger.

## File naming (saves a whole cleanup session)
`hero-desktop.jpg`, `hero-mobile.jpg`, `card-headspa-mastery.jpg`,
`card-scalp-science.jpg`, `card-scalp-assessment.jpg`, `card-price-like-a-pro.jpg`,
`og-share.png`, `module-00.jpg` … `module-11.jpg`, `badge.svg`, `badge-mark.svg`,
`badge-lockup.svg`, `badge-white.svg`
One zip, flat or foldered — named like this, I can wire the entire set in one pass.

---

# READY-TO-PASTE: Pass 1 Consistency Audit (Claude Code)
Run this anytime — it doesn't need new media and doesn't need Claude chat.
Paste into Claude Code in the repo:

> Read CLAUDE.md. Then perform a design-consistency audit across all HTML files
> in this repo (index, courses, headspa-mastery, student-access, success,
> verify, terms, privacy, refunds, my-aimt). Extract and tabulate every:
> font-family declaration, font size used for h1/h2/body/small text, hex/rgba
> color, border-radius, button style, and spacing pattern — from inline styles,
> style blocks, and assets/css/aimt-design-system.css. Produce a drift report:
> (1) values that deviate from the design-system tokens, (2) near-duplicate
> colors (e.g. #a3968d vs #a89a90) and fonts loaded on some pages but not
> others, (3) inconsistent button/radius/spacing treatments between pages,
> (4) any page not loading the design-system stylesheet or the brand fonts.
> Recommend a normalization: which value wins for each conflict (prefer the
> design-system token). DO NOT change anything yet — output the report as
> DESIGN-AUDIT.md in the repo root and show me a summary. I'll review and
> approve the normalization commit separately.

After reviewing DESIGN-AUDIT.md, the follow-up prompt is:
> Apply the approved normalizations from DESIGN-AUDIT.md. Smallest diffs,
> visual-only changes, no logic edits. Diff summary, then commit as
> "Design pass 1: consistency normalization" and push.
