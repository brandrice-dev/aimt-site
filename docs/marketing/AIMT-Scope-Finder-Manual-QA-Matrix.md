# AIMT License & Scope Finder — Manual Acceptance Matrix
**Status: MANUAL QA REQUIRED (NOT YET COMPLETED)**
**Prepared:** 2026-11-12
**Source-of-truth:** [Scope Finder primary source ledger](AIMT-Scope-Finder-Source-Ledger.md), `assets/js/aimt-scope-evidence.mjs`.
**Build:** `feature/head-spa-free-accelerator`, draft PR #166; release issue #165.
**Purpose:** Verify that a real visitor understands an individual's professional scope, establishment obligations and open questions **without interpreting the tool as a permission to practice**.

## Test setup

Open the branch preview at `/head-spa-scope-finder`, preferably in an incognito/clean browser profile. Use both desktop and a narrow mobile viewport; repeat keyboard-only navigation and screen-reader reading order. Do not input real names, license numbers or client records. No backend lead collection is expected. Check output after changing the state/license/work setting and after reloading a saved local plan.

## Twenty practitioner scenarios

| # | User situation | Activities / options | Must display | Must **not** do | Manual outcome |
|---:|---|---|---|---|---|
| 1 | California licensed esthetician | shampoo + scalp cleansing | shampoo outside credential; separately sourced cosmetic scalp note | imply entire head spa is allowed | UNTESTED |
| 2 | California cosmetologist | shampoo + blow-dry | limited profession-scope source notes, establishment reminder | claim active license verified | UNTESTED |
| 3 | California hairstylist | shampoo + styling + scalp massage | shampoo/styling licensed category, scalp-massage unresolved | merge hairstylist with full cosmetology | UNTESTED |
| 4 | California unlicensed beginner | shampoo | required licensed hair-service role, government citation | show green "go ahead" | UNTESTED |
| 5 | Texas unlicensed solo operator | shampoo only | documented individual-license shampoo exception; shop obligations unresolved | claim unlicensed head spa allowed | UNTESTED |
| 6 | Texas unlicensed solo operator | shampoo + scalp massage | exemption applies only to shampoo; massage requires suitable credential | generalize exception to combined service | UNTESTED |
| 7 | Texas esthetician with active in-state license | scalp cleansing + hair styling | scalp cleansing source; styling outside esthetician scope | claim mixed service authorized | UNTESTED |
| 8 | Texas Class A Barber | styling + cosmetic scalp massage | specific Class A scope sources; verify premises | treat unspecified barber as Class A | UNTESTED |
| 9 | Tennessee shampoo-only startup | shampoo | clear shampoo deregulation and shop/facility question | assert a stand-alone full-service spa needs no license | UNTESTED |
| 10 | Tennessee esthetician | scalp massage + blow-dry | scalp massage scoped; blow-dry requires a different role | confuse scalp massage with hair styling | UNTESTED |
| 11 | Tennessee master barber | blow-dry / styling | specific Master Barber credential finding | treat a generic barber technician as master | UNTESTED |
| 12 | Tennessee generic barber | hair styling | asks to confirm exact Master Barber subtype | infer generic barber credential grants all styling | UNTESTED |
| 13 | Florida registered Facial Specialist | cosmetic scalp treatment + blow-dry | scalp specialty source; hair styling outside specialty | conflate Facial Specialist with Cosmetologist | UNTESTED |
| 14 | Florida unlicensed provider | shampoo + styling | shampoo-only exemption, licensed styling limitation | call entire service exempt | UNTESTED |
| 15 | Florida registered Full Specialist | scalp massage + hair styling | scoped cosmetic massage, regulated hair styling outside specialty | equate Full Specialist with Cosmetologist | UNTESTED |
| 16 | Pennsylvania unlicensed worker | shampoo, independent location | narrow barber-supervised exception, shop/supervision caveat | say independent shampoo-only head spa is authorized | UNTESTED |
| 17 | Pennsylvania cosmetologist | shampoo + scalp massage | statutory cosmetology scope sources plus salon license | treat license as proof of premises compliance | UNTESTED |
| 18 | Pennsylvania esthetician | scalp treatment | unresolved and statutory links; board cannot issue advisory opinion | invent a precise scalp permission or prohibition | UNTESTED |
| 19 | New York cosmetologist/area renter | hair styling + shampoo | official NY scope findings; separate appearance-enhancement business and area-renter requirements | say operator license alone authorizes suite | UNTESTED |
| 20 | New York esthetician | hair styling + cosmetic scalp care | hair styling outside esthetics; scalp practice marked unresolved | infer esthetics automatically authorizes hair services | UNTESTED |

## High-priority regression: PA licensed cosmetologist is **not** a research gap

A PA cosmetologist selects all seven advertised head spa components. This exact complaint is the highest-priority user acceptance case:

| Activity | Result expected | Why |
| --- | --- | --- |
| Shampooing / cleansing hair | **Included in cosmetologist scope** | Cosmetology Act §1, PA licensure guide |
| Ordinary nonmedical cosmetic scalp cleansing / exfoliation | **Included in broad cosmetologist scope**, with technique/product limits | Cosmetology Act §1 includes cleansing, stimulating and manipulating the scalp using cosmetics and appliances |
| Cosmetic scalp massage | **Included in cosmetologist scope** | Cosmetology Act §1 |
| Cosmetic neck/shoulder (upper-body) massage | **Included in broad cosmetologist scope**, with nontherapeutic limits | Cosmetology Act §1 and §9.3 distinguishes LMT services |
| Blow-drying / styling hair | **Included in cosmetologist scope** | Cosmetology Act §1 |
| Observation-only scalp camera | **Practice-related technique / device questions to verify**, NOT an implied license restriction | The statute does not separately name cameras; no medical diagnosis or imagery-based treatment claims |
| Bed, steamer and water apparatus | **Implementation/sanitation/installation checks**, NOT missing permission for hair cleansing | Cosmetology Act §1 includes appliances; 49 Pa. Code §7.92 covers sanitation; local building and manufacturer requirements still apply |

**Headline must prioritize the positive professional scope:** “Your license category covers core cosmetic services.” Do not lead with “Some steps still need answers” when five are already included in the state’s broad license definition. Separate any **AIMT research gap** from a genuine state prohibition. A camera or equipment check does not make regular cosmetic scalp services sound illegal.

**Negative case:** A PA esthetician selecting the same scalp services must not inherit cosmetologist findings. The tool should say AIMT has not finished researching the specific esthetics scope, not that an esthetician is categorically forbidden without a primary source.

**Language check:** Never state that a research gap means “not allowed,” “probably restricted,” or “permission denied.” However, do not replace genuine primary-source restrictions in CA/TX/FL/TN with reassurance. Source-specific restrictions remain clear and traceable.

**Reviewer evidence:** record a screenshot of (a) PA cosmo all-seven results on mobile; (b) PA cosmo partial result, six supported + equipment questions; (c) PA esthetics unresearched; (d) TX no-license shampoo exemption + restricted styling. All remain UNTESTED in an actual browser until recorded.

## Additional must-pass safety and UX checks (not case count)

- All 51 states selectable. Unmapped state (e.g. Alaska) shows **Not yet researched**, with zero licensed/exempt conclusions; direct official-source guidance is not fabricated.
- **Out-of-state**, **expired**, **pending** and **no license** choices never imply practice clearance even where an activity is in a license category.
- A broad selected activity (neck/shoulder massage, equipment/steam, microscopy) stays unresolved when primary sources do not settle technique, type, medical boundary and permits.
- No source IDs point to another state's board; every non-unresolved status has a named primary source and functioning official URL.
- Choosing a different state updates specific license categories and resets invalid previous credentials. Real credential subtypes include CA Hairstylist, TX Class A Barber/Cosmetology Operator, TN Master Barber, FL Facial/Full Specialist.
- The result summary differentiates individual shampooing exceptions, restricted steps, conditional exceptions, and unknowns; **every result states that a complete head spa is not cleared**.
- The facility section does not silently equate individual credentials with a salon or area-renter business license.
- Students can **copy a detailed source-linked research report** and a separate licensing-board inquiry. Clipboard failure must provide selectable text instead of losing results.
- Tool does not collect PII, license numbers, health data or scalp images, and is not a legal advice service.
- Mobile at 375px and ~320px: no horizontal clipping, readable 12px+ body copy, accessible checkbox labels and links, focus visibility, native select access.
- Keyboard-only: every control and source link accessible; results announced; focus and tab order follow content; no hover-only explanation.
- After return/reload, browser-local plan state should be clear and editable; failure of local storage must be honestly stated.
- Any official rule superseded or inaccessible must be flagged and its previous positive/negative conclusion reverted to **unresolved** pending verification.
- Confirm NO production merged changes and NO marketing emails/scheduled reminders are created from test submissions.

## Acceptance evidence table — to be completed by an independent reviewer

| Surface | Tested device/browser | Reviewer | Date | Pass/fail | Evidence / screenshot / notes |
|---|---|---|---|---|---|
| Desktop functional walkthrough | — | — | — | NOT RUN | — |
| Mobile narrow and standard | — | — | — | NOT RUN | — |
| Keyboard + screen reader | — | — | — | NOT RUN | — |
| Official URLs + source dates | — | — | — | NOT SIGNED OFF | — |
| Activity/credential legal interpretation | — | Qualified independent reviewer required | — | NOT SIGNED OFF | — |
| Lead/consent + launch disclosure | — | — | — | NOT SIGNED OFF | — |

### Release decision

Code/automated tests alone do not establish the legal accuracy of a regulatory answer. A qualified independent reviewer must approve the state-specific interpretations, exclusion language, facility statements and source-change plan before any production promotion as a licensing guide. Owner's explicit merge/release decision is also required. A preliminary six-state tool can be published only if all source/legal, UX, privacy and owner gates have been cleared; nationwide claims require all 51 jurisdictions researched and maintained.
