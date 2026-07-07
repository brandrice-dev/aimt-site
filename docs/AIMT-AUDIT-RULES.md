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

## STANDING PROCESS RULES (already in effect)

Visual/copy only — never touch payment/auth/entitlement/sync/Worker or
anything in `cadence-worker/`, `supabase/`, `functions/`; smallest diffs, one
concern per commit; design-system tokens win (fix the token, never fork the
value); report-then-apply and STOP before committing; verify in a real
full-width browser, not the sandbox preview.
