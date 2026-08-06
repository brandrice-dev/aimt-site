# Module 5 — Asset Inventory

Inventory of the five approved Module 5 teaching photographs, added under
`assets/images/course/module-05/`, and their optimized production
derivatives. See [`module-05.md`](module-05.md#amendment--module-5-visual-asset-addendum-approved)
("Amendment — Module 5 visual asset addendum") for the approved placement,
heading, caption, and alt-text copy this inventory implements. This file
records what exists and where it is used — it is not a separate content
authority.

A stray `assets/images/course/module-05/.DS_Store` (macOS Finder metadata)
also exists at the `module-05` root. It is not a course asset and is not
staged for commit.

---

## Naming convention

Source files use the `-original` suffix (matching how they were supplied)
and live in two subfolders by teaching group: `regional-comparison/` (the
paired case-study images) and `service-adaptation/` (the three single
service-moment images). Production derivatives drop the `-original` suffix
and use `.webp`, matching the existing Module 3/Module 4 convention (e.g.
`aimt-scalp-cross-section.png` → `aimt-scalp-cross-section.webp`;
`exam-area-01-front-hairline.png` → `exam-area-01-front-hairline.webp`).
Module 5 assets are **not** placed inside `assets/images/course/module-04/`.

---

## regional-comparison/

| Field | `mixed-regional-crown-original.png` | `mixed-regional-hairline-original.png` |
|---|---|---|
| Source path | `assets/images/course/module-05/regional-comparison/mixed-regional-crown-original.png` | `assets/images/course/module-05/regional-comparison/mixed-regional-hairline-original.png` |
| Source format | PNG (confirmed via `file`) | PNG |
| Source dimensions | 1448 × 1086 | 1448 × 1086 |
| Source orientation | Horizontal (landscape), 4:3 | Horizontal (landscape), 4:3 |
| Source file size | 2,591,515 bytes (~2.47 MB) | 2,667,225 bytes (~2.54 MB) |
| Derivative path | `assets/images/course/module-05/regional-comparison/mixed-regional-crown.webp` | `assets/images/course/module-05/regional-comparison/mixed-regional-hairline.webp` |
| Derivative dimensions | 1360 × 1020 (downscaled from source; not upscaled) | 1360 × 1020 |
| Derivative format/quality | WebP, quality 82, method 6 (Pillow) | WebP, quality 82, method 6 |
| Derivative file size | 161,868 bytes (~158 KB) | 195,028 bytes (~190 KB) |
| Teaching purpose | Visual 1 (Regional comparison case study) — crown half of the paired comparison | Visual 1 — hairline/temporal half of the paired comparison |
| Lesson placement | After Section 5.4, before "What changes first?" | Same — displayed together with the crown image |
| Heading | "One scalp. Different regional needs." (shared, once, above the pair) | Same heading, shared |
| Caption | "Crown: greater visible shine and surface coating may support more targeted cleansing." | "Hairline or temporal area: a matte, fine-scale appearance may call for a gentler service direction." |
| Alt text | "Close view of a client's crown showing greater visible shine and surface coating than the comparison region." | "Close view of the same client's hairline or temporal region showing a more matte appearance with fine visible scale." |
| Diagnostic/scope caution | Shared caution below the pair: "Illustrative service-planning example. Appearance alone does not establish cause or diagnosis." | Same shared caution |
| Derivative status | Created this task; original preserved unmodified | Created this task; original preserved unmodified |

---

## service-adaptation/

| Field | `targeted-crown-cleansing-original.png` | `gentle-hairline-adaptation-original.png` | `regional-plan-client-conversation-original.png` |
|---|---|---|---|
| Source path | `assets/images/course/module-05/service-adaptation/targeted-crown-cleansing-original.png` | `assets/images/course/module-05/service-adaptation/gentle-hairline-adaptation-original.png` | `assets/images/course/module-05/service-adaptation/regional-plan-client-conversation-original.png` |
| Source format | PNG | PNG | PNG |
| Source dimensions | 1448 × 1086 | 1448 × 1086 | 1448 × 1086 |
| Source orientation | Horizontal (landscape), 4:3 | Horizontal (landscape), 4:3 | Horizontal (landscape), 4:3 |
| Source file size | 1,884,157 bytes (~1.80 MB) | 1,872,468 bytes (~1.79 MB) | 1,967,414 bytes (~1.88 MB) |
| Derivative path | `assets/images/course/module-05/service-adaptation/targeted-crown-cleansing.webp` | `assets/images/course/module-05/service-adaptation/gentle-hairline-adaptation.webp` | `assets/images/course/module-05/service-adaptation/regional-plan-client-conversation.webp` |
| Derivative dimensions | 1360 × 1020 | 1360 × 1020 | 1360 × 1020 |
| Derivative format/quality | WebP, quality 82, method 6 | WebP, quality 82, method 6 | WebP, quality 82, method 6 |
| Derivative file size | 60,902 bytes (~59 KB) | 55,532 bytes (~54 KB) | 73,786 bytes (~72 KB) |
| Teaching purpose | Visual 2 — targeted product placement and crown cleansing as deliberate customization | Visual 3 — restraint as a skilled service modification | Visual 4 — connecting service judgment with client trust and communication |
| Lesson placement | After Section 5.5, following the regional protocol builder | Within/after Section 5.7, "Steam, water, pressure, and time" | Within Section 5.8, "Explain the change without losing the client" |
| Caption | "Regional customization may change product placement and cleansing intensity without changing the entire service." | "Lower pressure, less product, and reduced stimulation can be deliberate protocol decisions." | "Explain what you observed, what the client reported, and why the service plan changed." |
| Alt text | "Practitioner sections the crown and applies cleansing product specifically at the roots while customizing treatment by region." | "Practitioner uses light fingertip contact and minimal product at the client's hairline during a low-stimulation service adjustment." | "Practitioner explains a personalized regional scalp-service plan to a seated client in a treatment room." |
| Diagnostic/scope caution | Illustrative service-planning photography, not diagnostic or authenticated medical evidence (module-level caution; not repeated as a per-image label to avoid a Module-4-style caption stack) | Same. Caption/alt text/nearby copy do not describe the client as inflamed, diseased, or medically sensitive | Same. Background chart/screen props are stock-photography set dressing — see "Note" in `module-05.md`'s addendum; not referenced as approved course terminology, and no private or real client information is depicted |
| Derivative status | Created this task; original preserved unmodified | Created this task; original preserved unmodified | Created this task; original preserved unmodified |

---

## Preflight image inspection notes (recorded, not a curriculum decision)

- All five source PNGs are present, uncorrupted, correctly named to match the approved filenames in `module-05.md`'s addendum, and consistent with their assigned teaching purpose — no file was found missing, corrupt, misnamed, or assigned to the wrong visual purpose.
- All five source images share identical dimensions (1448 × 1086, 4:3 landscape), which matches the existing `.clinical-photo { aspect-ratio: 4/3 }` component already used file-wide — no cropping was required to fit the existing photo containers.
- `regional-plan-client-conversation-original.png` contains baked-in stock-photography set dressing (a wall-mounted display and a handheld printed chart) showing generic mockup scalp-region labels ("Front / Hairline," "Top / Crown," "Back / Nape") with one-word directives. This is prop text from the source photograph, not course copy, is not editable, and does not match Module 5's approved five-pattern framework or Module 4's five-point framework. It is flagged here and in `module-05.md`'s addendum so it is not mistaken for approved terminology; it does not block using the image for its assigned "client communication" teaching purpose, and no real or private client information is depicted (the props are generic, non-identifying mockups).
- No source image contains embedded/baked-in caption or label text of its own (unlike several Module 4 source images) — all caption and alt-text copy for Module 5's photographs is real DOM text, per the accessibility requirement in `module-05.md`'s addendum.
- No face in any image is a real client; all are professional stock-photography subjects, consistent with photography already used elsewhere in this course's marketing and completion assets.

---

## Downstream references

Implemented in `headspa-mastery.html` inside `#module5Wrap` at the four
approved placements. See `implementation-log.md` for the exact markup
change record.
