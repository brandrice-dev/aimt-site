# AIMT — Design Audit: Current State
*Tracking doc for the design-elevation pass following Pass 1 (consistency normalization). Updated as work lands.*

## Done (committed and pushed to origin/main)
- `be71fce` — Add primary nav links, footer product paths, and persistent Enroll CTA (D2): three header nav links (Head Spa Certification / All Certifications / The Institute), footer product links, `#institute` section id, Enroll button reusing `.cta-primary`.
- `4a27fe8` — Community section: honest forward-looking claims, consolidate to 3 cards, replace emoji with monoline icons. Cards 3+4 ("Graduate-to-graduate mentorship" / "Job placement & opportunities") merged into one forward-looking card; emoji replaced with new SVGs built on the existing `.cert-detail-icon` monoline pattern; third card spans full width via `grid-column: 1 / -1` (grid itself left at `1fr 1fr`, per explicit instruction not to restructure it).
- `a1cc9ce` — Nav restructure: brand left (mark + "AIMT" only — tagline "American Institute of Modern Trichology" removed from the nav), links + Student Access + Enroll clustered right under a new `.nav-right` wrapper, Student Access de-buttoned from `.nav-btn.nav-btn-ghost` to a plain `.nav-link` (same color/hover, so legibility unchanged), new `.nav-sep` divider using the `--aimt-border-default` token.

## Committed-but-unpushed locally
None as of this writing — local `main` and `origin/main` are in sync at `a1cc9ce`. (Earlier in this session, a recurring `git push` credential failure in this shell left several commits local-only for a while; those have since been pushed, likely via GitHub Desktop.)

## Next queued task
**Rename pass:** "HeadSpa Mastery" → "Head Spa Practitioner Certification" site-wide. Not yet started — no investigation done yet on scope (which files, how many occurrences, whether it affects the course slug/URLs/Stripe product data, which CLAUDE.md explicitly says must stay `headspa-mastery` everywhere as an internal identifier regardless of any display-name change).

## Standing rules for this design-elevation phase
- **Visual-only.** No payment, auth, entitlement, sync, or Worker code changes under this workstream.
- **Design-system tokens/classes win.** Reuse existing classes and `--aimt-*` tokens; never fork a value or introduce a new color/size/spacing value that isn't already in `assets/css/aimt-design-system.css` or an established local pattern.
- **Smallest diffs.** Touch only what's asked; leave unrelated dead CSS in place unless explicitly told to sweep it.
- **Report, then apply.** For each task: investigate and report findings first (structure, existing patterns, ambiguities) before writing any change, unless told otherwise.
- **Stop before commit.** Show the full diff and wait for explicit approval to commit — never commit or push proactively mid-task.
