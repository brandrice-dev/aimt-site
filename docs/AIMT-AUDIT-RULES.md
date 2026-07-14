# AIMT Audit Rules — Standing Rules for Design/Copy Audit

These rules are governing for every section/copy edit made during the ongoing
design/copy audit (and after). They persist across sessions — do not
re-litigate them per task; apply them by default.

## STANDING RENAME RULE

In every section/copy edit, any client-facing DISPLAY occurrence of the course
name — "HeadSpa Mastery", "Head Spa Mastery", "Headspa Mastery" — changes to
"Head Spa Certification Course" (one canonical spelling). Also drop stray
concept-uses of "Mastery" in display text (e.g. "Applied Mastery Framework" →
"Applied Practice Framework"). NEVER change the slug `headspa-mastery`, the
filename `headspa-mastery.html`, any href/src value, or any id/class/data
attribute/JS var/JSON key/course ID — only the words a visitor reads. Nav
label stays the short "Head Spa Certification" (already correct, do not
lengthen).

## STANDING COPY DIRECTIVE — identity/aspiration framing

Weave micro-psychological identity framing into subtext, subheads, and CTAs
(NOT the product name) capturing the "practitioner you become" aspect.
Levers: identity ("become the practitioner clients seek out"), in-group/status
("the standard serious practitioners hold themselves to"), present-tense
becoming ("the practitioner you're becoming"), earned distinction ("separates
you from the certificate-of-attendance crowd"). Every aspirational claim must
be backed by real substance on the page (hands-on in-person clinical
training, verifiable credential). Phrase-bank-safe: no licensure implication,
no income promises, no "mastery".

## DEFERRED RENAME CATCHES (to-do, not done yet)

1. `index.html` `<title>` + meta description — small standalone commit before
   launch.
2. Other pages (`courses.html`, `headspa-mastery.html`, certificate template,
   `student-access.html`, `success.html`) — rename client-facing name
   occurrences when each of those pages is audited. Certificate specimen on
   index is covered by the credential-section commit.

## STANDING COLOR RULE — oxblood is seal/diploma-only

Oxblood is a SEAL/DIPLOMA color only, not a site-wide accent. The web page
stays clean cream/white/near-black (monochrome, no color accent). Do NOT add
oxblood accent tokens or recolor hairlines, eyebrows, credential IDs, or CTA
borders. Primary CTAs stay cream. The crest/certificate keeps the deep seal
oxblood (~#38141C) at full richness — that's the one place the color lives.
Canonical seal oxblood for the badge/cert: `#38141C`. Do not define it as a
general-purpose CSS variable or apply it outside the crest/certificate.

## STANDING PROCESS RULES (already in effect)

Visual/copy only — never touch payment/auth/entitlement/sync/Worker or
anything in `cadence-worker/`, `supabase/`, `functions/`; smallest diffs, one
concern per commit; design-system tokens win (fix the token, never fork the
value); report-then-apply and STOP before committing; verify in a real
full-width browser, not the sandbox preview.

## TYPE SYSTEM & SECTION PATTERN (canonical — do not deviate)

Fonts: `--aimt-font-mont` = Montserrat (headlines) · `--aimt-font-serif` =
Playfair Display (editorial intros) · `--aimt-font-sans` = Outfit (body) ·
`--aimt-font-mono` = SF Mono (eyebrows)

Every section below the hero follows this rhythm:

1. **Eyebrow** — `.eyebrow` (dark bg) / `.eyebrow-light` (light bg): mono,
   0.6rem, weight 400, uppercase, 0.16em tracking
2. **Headline** — `.section-title`: Montserrat, `clamp(1.6rem,6vw,2.6rem)`,
   weight 700, UPPERCASE, letter-spacing -0.03em, line-height 1.05. Color set
   inline per background. NEVER create a bespoke headline class for a
   section.
3. **Editorial serif intro** — Playfair italic, `clamp(1.1rem,3.8vw,1.45rem)`,
   line-height 1.6, with `<em>` two-color emphasis (first sentence
   emphasized in full color, remainder muted). This is the polish moment —
   every section should have one. (Reference: `.community-intro` on dark,
   `.institute-intro` on light.)
4. **Body** — `.section-sub`: Outfit, 0.9rem, weight 300, line-height 1.82,
   muted
5. **Cards** — section-appropriate card component

All elements in a section share ONE left edge (align eyebrow, headline,
intro, body, and card content to the same padding).

The hero (`#hero`) is the ONE exception — it has its own distinct treatment
by design.

**RULE:** Before styling any section, read this. Reuse the canonical
classes. Do not invent new heading or intro classes.

**ALIGNMENT (canonical):** All sections use `--aimt-align` (1.4rem) as the
content inset. Every element in a section — eyebrow, headline, editorial
intro, body, grid containers, and card content — must resolve to this same
left edge. NEVER hardcode a padding value for alignment; always reference
`var(--aimt-align)`. When adding a card component, ensure its internal
padding + its container's offset resolves to the token value, not a
coincidentally-matching number.
