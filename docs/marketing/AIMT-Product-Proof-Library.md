# AIMT Product-Proof Library

The canonical list of approved AIMT marketing and product-proof assets.
Check here before producing anything new. If an asset is listed as
current, reuse it. If a need isn't covered, add the new asset here when
it ships.

All paths are relative to `assets/`. **Placements:** S = sales page
(`/head-spa-certification`), H = homepage, O = organic social, A = paid
ads, E = email, P = partner materials.

Last updated: 2026-10-02.

## Rules

1. **Real product, real people only.** Every screenshot shows the
   unmodified current AIMT interface. Never use mocked-up UI. Never
   represent AIMT staff or practitioners with AI-generated people.
2. **Sample identities stay labelled as samples.** The certificate and
   verification assets use AIMT's standing demo identity, *Alexandra M.
   Renfield*. The certificate carries the sample ID `AIMT-HS-2026-SAMPLE`;
   the verification capture comes from the page's localhost-only QA
   fixture (`AIMT-HS-2026-DEMO01`, holder shown as "(DEMO)"). Neither ID
   exists in production, and neither will verify. Caption them "Sample
   certificate" or "Sample verification", and never present them as a
   real graduate.
3. **Lesson content is course content, not client results.** Microscopy
   and lesson imagery are illustrative teaching material, labelled as such
   in the course ("Illustrative magnified example — not a clinical
   diagnosis"). Keep that framing in marketing.
4. **Never use** `images/course/module-11/module-11-ai-scalp-analysis-dashboard.png`
   in marketing. It shows a diagnosis-style AI result ("Seborrheic
   dermatitis — 87%") that reads as a clinical claim.
5. Captures of authenticated screens use only the local QA harness
   (`scripts/growth-local-qa-server.mjs`, in-memory data, fictional QA
   student "Jordan Sample") or AIMT's built-in localhost review modes
   (`?review=1`, `?qafixture=`). No production student data appears in
   any asset.

## 1. Practitioner-in-context photography (real AIMT treatment shoot)

| Asset | Proves | Status | S | H | O | A | E | P | Ratios |
|---|---|---|---|---|---|---|---|---|---|
| `images/marketing/approved-aesthietic-service-shot1.png` | Halo rinse, real AIMT treatment | Current | ✓ in use | ✓ | ✓ | ✓ lead | ✓ header | ✓ | 16:9 (1672×941) |
| `images/marketing/approved-aesthetic-service-shot2.png` | Scalp massage | Current | ✓ in use | | ✓ | ✓ | ✓ | ✓ | 16:9 |
| `images/marketing/approved-aesthetic-service-shot3.png` | Lather / cleanse | Current | ✓ in use | | ✓ | ✓ | ✓ | ✓ | 16:9 |
| `images/marketing/head-spa-service-rinse.webp` | Halo rinse, portrait | Current | ✓ in use | | ✓ | ✓ | | ✓ | ~5:7 (1054×1492) |
| `images/marketing/catalog-hero-halo-rinse-desktop.jpg` | Shot 1 extended into dark ground for left-side headline copy (matting only, no added content) | Current, in use as the catalog (`/courses`) desktop hero | | | | | | | 2.6:1 (2437×941) |
| `images/marketing/catalog-hero-halo-rinse-mobile.jpg` | Shot 1 cropped to halo + client | Current, in use as the catalog mobile hero; also a good square-ish social crop | | | ✓ | | | | ~1.1:1 (1036×941) |

## 2. Service Timer

| Asset | Proves | Status | S | H | O | A | E | P | Ratios |
|---|---|---|---|---|---|---|---|---|---|
| `images/marketing/approved-service-timer-live.png` / `.webp` | Full Timer UI: Core 60 min, Step 04 Halo Activation, cues | Current | ✓ in use | | carousel | | | ✓ one-pager | ~16:9 |
| `images/marketing/approved-service-timer1.webp` | Timer on a tablet beside a real treatment | Current | | ✓ in use | ✓ | ✓ | ✓ | ✓ | 9:16 |
| `images/marketing/approved-service-timer2.webp`, `approved-service-timer3.png`, `approved-service-timer4.png` | Same shoot, variants | Current | | | ✓ Reels / Stories | ✓ | | | 9:16 |
| `images/marketing/head-spa-service-basin.webp` | Practitioner working with Timer on the cart ("Dry Brushing + Hair Play") | Current, best "tool in the room" image | add | | ✓ | ✓ | ✓ | ✓ | ~1:1 (1086×1035) |

## 3. Cadence

| Asset | Proves | Status | S | H | O | A | E | P | Ratios |
|---|---|---|---|---|---|---|---|---|---|
| `images/marketing/cadence-conversation.webp` | Ask Cadence panel, Module 8 ("Optional · not graded") | Current | add | ✓ in use | ✓ | ✓ | ✓ | ✓ | ~4:3 (1600×1240) |
| `images/marketing/cadence-phone-editorial.webp` | Ask Cadence on a phone (staged scene; UI is current) | Current | | ✓ in use | ✓ | ✓ | | | 4:5 |
| `images/marketing/product-proof/listen-with-cadence-module-08.webp` | Module 8 opener with the live **Listen with Cadence** entry (~40 min, 2 checkpoint stops) | **New capture**, current | ✓ | | ✓ | | ✓ | | ~7:8 (1232×1418) |
| `audio/cadence-marketing/homepage-teaser.mp3` | Cadence's voice | Current | | ✓ in use | audio for Reels | | | | — |
| **Cadence Check Complete** | A passed required checkpoint | **OWNER CAPTURE REQUIRED** (see §8) | | | | | | | 4:5, 9:16 |

## 4. Course lessons (re-crops of real lesson screenshots, UI unaltered)

All in `images/marketing/product-proof/`, 1080×1350 (4:5) and 1080×1080 (1:1).

| Asset (both ratios) | Proves | S | O | E | P |
|---|---|---|---|---|---|
| `lesson-module-03-hair-scalp-anatomy-{4x5,1x1}.webp` | Anatomy depth (scalp cross-section) | ✓ | ✓ carousel | ✓ | ✓ |
| `lesson-module-04-microscopy-assessment-{4x5,1x1}.webp` | Microscopy assessment card with scope language | ✓ | ✓ | ✓ | ✓ |
| `lesson-module-05-service-adaptation-{4x5,1x1}.webp` | Consultation + adaptation scripts | ✓ | ✓ | ✓ | ✓ |
| `lesson-module-06-dry-scalp-vs-dandruff-{4x5,1x1}.webp` | Dry scalp vs dandruff comparison | ✓ | ✓ | ✓ | |
| `lesson-module-08-halo-activation-{4x5,1x1}.webp` | Module 8 video chapter, Halo Activation, with Core/Extended timing | ✓ | ✓ | ✓ | ✓ |
| `lesson-module-08-dry-brushing-{4x5,1x1}.webp` | Module 8 video chapter, Dry Brushing | ✓ | ✓ | | |

The full-frame sources (`images/marketing/approved-module0X-screenshot*.png`)
stay as masters. Also current: `images/marketing/approved-module08-screenshot1.png`
(in use on the sales page), `images/marketing/course-module-4-editorial.webp`
(laptop scene, catalog) and `images/marketing/head-spa-certification-course-ui.webp`
(Module 4 lesson with a Cadence pull quote, 16:10).

## 5. My AIMT (new captures, QA student "Jordan Sample")

| Asset | Proves | S | O | A | E | P | Ratios |
|---|---|---|---|---|---|---|---|
| `images/marketing/product-proof/my-aimt-dashboard.webp` | Current dashboard: course card with progress ring, certification path, Service Timer tool | ✓ | | ✓ retargeting | ✓ onboarding | | ~6:5 (2264×1906) |
| `images/marketing/product-proof/my-aimt-resource-library.webp` | Resource Library: intake plan, service maps, enhancement guide, sanitation checklist, AI toolkit | ✓ | ✓ | | ✓ | ✓ | ~3:2 (2264×1486) |

Shows the early-course state (8%, "Next up: Module 1") of the QA account,
an honest beginning state. For a mid-course look, capture from a real
progressing account (owner).

## 6. Final Certification Assessment (new captures)

| Asset | Proves | S | O | E | P | Ratios |
|---|---|---|---|---|---|---|
| `images/marketing/product-proof/final-certification-assessment-intro.webp` | Module 12 intro ("no countdown clock") | ✓ | | ✓ | ✓ | ~1.9:1 |
| `images/marketing/product-proof/final-certification-assessment-structure.webp` | Current 3-part structure: 40 questions (50%), 4 cases (30%), **3 conversations** with Cadence (20%) | ✓ | ✓ | ✓ | ✓ | ~2.3:1 |

## 7. Certificate and verification

| Asset | Proves | S | H | O | A | E | P | Ratios |
|---|---|---|---|---|---|---|---|---|---|
| `images/marketing/product-proof/certificate-sample-flat.webp` | The real issued certificate design (production template + production renderer), sample identity | ✓ sample link | ✓ in use | ✓ | ✓ | ✓ | ✓ | √2:1 (2400×1697) |
| `images/marketing/product-proof/certificate-sample-4x3.webp` | Same, on AIMT dark ground | catalog ✓ in use | | ✓ | ✓ | ✓ | ✓ | 4:3 |
| `images/marketing/product-proof/certificate-sample-1x1.webp` | Same | | | ✓ | ✓ | | | 1:1 |
| `images/marketing/product-proof/certificate-sample-4x5.webp` | Same | | | ✓ | ✓ | | | 4:5 |
| `images/marketing/product-proof/verify-credential-demo.webp` | Real verify page in its "Verified · Active" state (QA fixture, holder labelled DEMO) | ✓ | | ✓ | | post-purchase | ✓ salons/employers | ~1:1 |
| `certificates/aimt-head-spa-certificate-template.png` | Production certificate artwork (authority; not a marketing asset itself) | — | | | | | | 1491×1055 |

**VISUAL MOCKUP GENERATION REQUIRED:** a lifestyle certificate (printed on
a desk or framed in a treatment room). Source: `certificate-sample-flat.webp`.
Deliver 4:3, 1:1 and 4:5. Keep the "sample" caption.

## 8. Owner capture required

| Proof | Why it can't be captured here | How to capture |
|---|---|---|
| **Cadence Check Complete** | Needs a genuinely passed required checkpoint, with the student's own answer and Cadence's real feedback. Review Mode intentionally can't produce it, and inventing an answer or feedback would be fake UI. | Sign in as an account that has passed a Module 8 checkpoint (e.g. the owner's staff account) and screenshot the completed checkpoint at 2x. 4:5 and 9:16 crops. |
| My AIMT, mid-course (optional) | The QA account sits at 8% | Same capture from a real account partway through the course, with personal details cropped out |

## 9. Brand primitives (current)

`images/marketing/homepage-hero-aimt-badge-desktop.webp` and `-mobile.webp`
(H, in use), `aimt-share.png` (social share card, 1200×630),
`brand/aimt-badge-*.png`, `brand/cadence/*.svg`, `images/marketing/my-aimt-course-texture.*`
(background texture only, not proof).

## 10. Obsolete: do not use (kept on disk, unreferenced)

None of these is referenced by any page, script, stylesheet or sitemap as
of 2026-10-02. Candidates for deletion in a later cleanup.

| Asset | Why |
|---|---|
| `Cadenceaccept.png`, `Cadencerevision.png` | Pre-redesign Cadence checkpoint UI ("Accepted", "Needs revision", "Retry") |
| `images/marketing/course-module-08-opener.webp`, `images/marketing/module-08-service-training.webp` | Say "Listen with Cadence — coming soon"; Listen Mode is live |
| `aimt-certificate-preview.png` | "HeadSpa Mastery" name, Cadence as "Program Director", March 2025 |
| `images/marketing/approved-certification-image.png` | Beige certificate that no longer matches what graduates receive; replaced site-wide by `certificate-sample-*` |
| `images/marketing/aimt-head-spa-certificate.webp` | Old certificate page design |
| `images/marketing/aimt-verifiable-credential.svg` | Illustrated credential card; superseded by the real verify capture |
| `images/marketing/my-aimt-editorial.webp` | Old My AIMT layout |
| `images/marketing/final-certification-assessment.webp` | Says "2 conversations"; current is 3 |
| `programs-hero-desktop.jpg` | AI-generated person in AIMT-branded clothing; replaced by `catalog-hero-halo-rinse-*` |
| `hero-desktop.jpg`, `hero-mobile.jpg` | AI-generated person in an AIMT-branded lab coat |
| `aimt-hero-image.png` | AI-generated, with a visible generator watermark; 7 MB |
| `headspa-halo-preview.png` | AI-generated halo rinse; the real shot 1 is better |
| `images/marketing/service-timer-interface.webp` | Not stale, but low resolution (543×457); use `head-spa-service-basin.webp` |
