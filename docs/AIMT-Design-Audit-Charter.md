# AIMT — Design Audit Charter
*Owner's directives, July 6, 2026. This document governs the design audit.
Every audit session (chat or Claude Code) should read this first.
Companion doc: AIMT-Art-Direction-Brief.md (image production specs).*

## The standard
AIMT must be measurably more aesthetic, more modern, and more trustworthy
than ustrichology.com and iattrichology.com. Not incrementally — visibly.
"Institute-grade" is the bar for every decision below.

## Owner directives (verbatim intent, numbered for reference)

**D1 — Hero impact.** The hero must be more impactful. Applies to image
selection (see Art Direction Brief §1), headline strength, and the
first-viewport composition. First impression carries the brand.

**D2 — Navigation & paths to product.** Expand top-nav options and give
visitors multiple routes to the courses from every page. Audit every page
for: can a visitor reach the course catalog / enrollment in one click from
here? Add nav links, mid-page CTAs, and footer paths where missing.
The course is the product; no dead-end pages.

**D3 — Section-by-section justification.** Every section on every page must
be (a) necessary, (b) high-impact, (c) factually true, (d) properly designed.
Sections failing any test get rewritten, redesigned, or removed. Audit output
must list each section with a keep/fix/cut verdict and reasoning.

**D4 — Logo/badge replacement.** New badge replaces the current logo
EVERYWHERE it appears: page headers, favicon, og/social cards, certificate
overlay, email templates (when they exist), and any brand mark in course
content. Not forced or stretched — placed with intention. Deliverables needed
from owner: full badge SVG/PNG, simplified mark (32px-survivable), horizontal
lockup, white one-color versions. STATUS: awaiting asset from Brandon.

**D5 — Total uniformity.** All pages uniform in colors, fonts, spacing, and
overall vibe. Enforced via the Pass 1 consistency audit (see Art Direction
Brief, ready-to-paste prompt) → design-system tokens win every conflict →
one normalization commit.

**D6 — SEO + consumer psychology.** Positioning, ordering, and copy optimized
for both search and persuasion: headline hierarchy that answers intent
(what is it → why trust it → what does it cost → how do I start), social
proof placement, objection handling near price, single primary CTA per
viewport, scannable benefit framing. Page titles/meta/H1s aligned to real
search phrases (e.g. "head spa certification," "head spa training online")
without keyword-stuffing the brand voice.

**D7 — AI claims currency.** All statistics or references about AI must be
current and verifiable. Owner notes recent coverage incl. a Forbes cover
story that may be citable. RULE: every external stat/article on the site
gets verified at its source, cited with publication + date, before shipping.
Nothing secondhand, nothing undated, nothing we can't defend. (Verification
happens during Pass 2 with live web search.)

**D8 — Claim scoping.** Course-specific facts must never read as
institute-wide claims. Example: "12 modules" is true of HeadSpa Mastery only —
it must not appear in blanket statements implying every AIMT course has 12
modules. Audit all copy for scope: institute-level claims (verifiable
credentials, AI study companion, self-paced) vs course-level claims
(module count, hours, price) — and keep each in its lane.

**D9 — Mobile parity.** Full mobile optimization pass. Students on phones get
the SAME experience: readable type without zooming, tap targets ≥44px, no
horizontal scroll, hero art-directed for portrait (separate crop), nav usable
one-handed, course reader + checkpoints + Cadence chat + certificate + dashboard
all tested on a real phone. Mobile is not a shrunken desktop; for course
consumption it's likely the PRIMARY device.

## Execution order
1. **Pass 1 — Consistency (D5):** run the ready-to-paste Claude Code audit →
   review DESIGN-AUDIT.md → normalization commit. No dependencies; run now.
2. **Badge swap (D4):** the moment the asset arrives. Own commit.
3. **Pass 2 — Art direction + copy (D1, D3, D6, D7, D8):** after final images
   land. Page-by-page: hero, section verdicts, nav/CTA additions (D2 overlaps),
   claims verification with sources, SEO alignment.
4. **Mobile pass (D9):** after Pass 2 (so we're not mobile-optimizing sections
   that get cut). Device-tested, not just simulator.
5. Final design QA alongside functional QA, pre-launch.

## Ground rules for all design commits
- Visual/copy changes only — never touch payment, auth, entitlement, or sync
  logic in a design commit.
- Smallest diffs; one concern per commit.
- Factual accuracy outranks persuasion everywhere the two collide (D3, D7, D8).
- Design-system tokens are law; deviations require updating the token, not
  forking the value.
