# Module 4 — Asset Inventory

Inventory of every file found under
`assets/images/course/module-04/examination-areas/` and
`assets/images/course/module-04/microscopy/` as of this intake pass
(2026-08-04, branch `course-audit-build`). These assets are **prepared for
audit only** — none are referenced by any production file and none are
approved for use in the course. This document records what exists and what
it visually appears to show. It does not interpret medical or anatomical
accuracy, does not confirm taxonomy, and does not approve any image for a
specific lesson placement.

A stray `assets/images/course/module-04/.DS_Store` (macOS Finder metadata,
6,148 bytes) also exists at the `module-04` root. It is not a course asset,
is not part of this inventory, and is not staged for commit.

---

## Naming convention check

All ten filenames are already lowercase kebab-case with no spaces, no
inconsistent casing, and a correct `.png` extension matching the actual
file type (confirmed via `file`). **No renaming was necessary or
performed.**

---

## examination-areas/ (5 files)

| Field | `exam-area-01-front-hairline.png` | `exam-area-02-top-parting.png` | `exam-area-03-crown-vertex.png` | `exam-area-04-temporal-area.png` | `exam-area-05-occipital-back.png` |
|---|---|---|---|---|---|
| Folder | `examination-areas/` | `examination-areas/` | `examination-areas/` | `examination-areas/` | `examination-areas/` |
| File type | PNG (confirmed via `file`) | PNG | PNG | PNG | PNG |
| Pixel dimensions | 1378 × 1142 | 1374 × 1145 | 1254 × 1254 | 1254 × 1254 | 1254 × 1254 |
| File size | 1,296,235 bytes (~1.24 MB) | 1,489,169 bytes (~1.42 MB) | 1,433,313 bytes (~1.37 MB) | 1,527,670 bytes (~1.46 MB) | 1,412,222 bytes (~1.35 MB) |
| Orientation | Horizontal (landscape) | Horizontal (landscape) | Square | Square | Square |
| Apparent subject | Close crop of a model's forehead/upper face and hairline from the front, hair swept back | Top-down crop of a model's part line, hair falling to both sides | Crop of the back/top of a model's head (hair in a low bun), viewed from directly behind/above | Side-profile crop of a different model (hair in a low bun), viewed from the side, showing temple/ear | Crop of the back of a model's head (hair in a low bun), viewed from directly behind |
| Embedded labels/text | Yes — a bold two-line heading ("Frontal / hairline") baked into the image above the photo, plus a dashed outline and a filled circle marking a specific point on the scalp | Yes — heading ("Top / parting") + dashed line + filled circle marker | Yes — heading ("Crown / vertex") + dashed circular outline + filled circle marker | Yes — heading ("Temporal / area") + dashed teardrop-shaped outline + filled circle marker | Yes — heading ("Occipital / back") + dashed outline + filled circle marker |
| Likely intended lesson use | Marks the frontal-hairline examination point in a scalp-examination sequence | Marks the top-parting examination point | Marks the crown/vertex examination point | Marks the temporal-area examination point | Marks the occipital (back-of-head) examination point |
| Filename/content mismatch | None apparent — label matches filename | None apparent | None apparent | None apparent | None apparent |
| Duplicate/near-duplicate concern | None | None | None — note visual similarity to `exam-area-05` (both low-bun, from-behind crops of what may be the same model) but the marked region differs (top/crown vs. occipital) | **Uses a visibly different model/framing (side-profile, face partly visible) than 01/02/03/05 (front-crop or from-behind, no full face)** — flag for consistency review, not resolved here | Visually similar framing to `exam-area-03` (both low-bun, from-behind); marked region differs |
| Horizontal or vertical | Horizontal | Horizontal | Square (neither strictly horizontal nor vertical) | Square | Square |
| Mobile label readability concern | Possible — baked-in heading text is large/high-contrast and likely legible, but is raster text (does not reflow, cannot resize independently of the image) | Same as above | Same as above | Same as above | Same as above |
| Audit status | Unverified — awaiting Module 4 audit | Unverified — awaiting Module 4 audit | Unverified — awaiting Module 4 audit | Unverified — awaiting Module 4 audit | Unverified — awaiting Module 4 audit |

**Sequence observation (not a decision):** filenames imply an intended
order — `01` front hairline, `02` top parting, `03` crown/vertex, `04`
temporal area, `05` occipital/back — but this is a filename-encoded
assumption only. Whether this is the correct or complete examination
sequence, and whether left/right temporal areas need separate assets (only
one `temporal-area` file exists, side unspecified), is a question for the
Module 4 audit, not decided here.

---

## microscopy/ (5 files)

| Field | `microscopy-dry-depleted-scalp.png` | `microscopy-congested-scalp.png` | `microscopy-sensitive-reactive-scalp.png` | `microscopy-neutral-balanced-scalp.png` | `microscopy-oily-congested-scalp.png` |
|---|---|---|---|---|---|
| Folder | `microscopy/` | `microscopy/` | `microscopy/` | `microscopy/` | `microscopy/` |
| File type | PNG | PNG | PNG | PNG | PNG |
| Pixel dimensions | 1449 × 1085 | 1447 × 1087 | 1447 × 1087 | 1448 × 1086 | 1448 × 1086 |
| File size | 2,145,685 bytes (~2.05 MB) | 2,157,467 bytes (~2.06 MB) | 2,135,630 bytes (~2.04 MB) | 1,913,406 bytes (~1.82 MB) | 1,879,726 bytes (~1.79 MB) |
| Orientation | Horizontal (landscape) | Horizontal (landscape) | Horizontal (landscape) | Horizontal (landscape) | Horizontal (landscape) |
| Apparent subject | Extreme macro/microscope-style close-up of scalp skin with hair shafts emerging from follicle openings; matte, dry-looking surface with fine light flaking | Extreme macro close-up of scalp skin with visible crusty/waxy buildup rimming several follicle openings | Extreme macro close-up of scalp skin with visible pink/red discoloration and inflamed-looking tissue around follicle openings | Extreme macro close-up of scalp skin with a light sheen, open/clear follicle openings, even pink-toned skin | Extreme macro close-up of scalp skin with glistening yellowish material at follicle openings |
| Embedded labels/text | Yes — bordered card with an all-caps title baked in ("DRY / DEPLETED SCALP — MICROSCOPY"), a divider rule, and a descriptive subtitle ("Matte surface, fine white powdery flakes, minimal oil") | Yes — title ("CONGESTED SCALP — MICROSCOPY") + subtitle ("Buildup at follicle openings, coated surface residue") | Yes — title ("SENSITIVE / REACTIVE SCALP — MICROSCOPY") + subtitle ("Visible redness, fragile barrier, inflamed areas") | Yes — title ("NEUTRAL / BALANCED SCALP — MICROSCOPY") + subtitle ("Slight sheen, clear follicle openings, calm pink tone") | Yes — title ("OILY / CONGESTED SCALP — MICROSCOPY") + subtitle ("Visible sebum at follicle openings, yellowish congestion") |
| Likely intended lesson use | One of a set of five scalp-type/appearance reference photos for the microscopy section | Same set | Same set | Same set | Same set |
| Filename/content mismatch | None apparent | None apparent | None apparent | None apparent | None apparent |
| Duplicate/near-duplicate concern | None | **Flag:** shares the word "congested" and a visually similar buildup-at-follicle-openings appearance with `microscopy-oily-congested-scalp.png` — whether these represent two genuinely distinct categories or an overlapping/redundant pair is a taxonomy question for the Module 4 audit, not resolved here | None | None | **Flag:** see `microscopy-congested-scalp.png` above — same concern, mirrored |
| Horizontal or vertical | Horizontal | Horizontal | Horizontal | Horizontal | Horizontal |
| Mobile label readability concern | Possible — baked-in title/subtitle text is smaller relative to image width than the examination-area headings and is raster (cannot reflow or resize independently) | Same as above | Same as above | Same as above | Same as above |
| Audit status | Unverified — awaiting Module 4 audit | Unverified — awaiting Module 4 audit | Unverified — awaiting Module 4 audit | Unverified — awaiting Module 4 audit | Unverified — awaiting Module 4 audit |

**Taxonomy observation (not a decision):** the five microscopy filenames
imply five scalp-appearance categories — dry/depleted, congested,
sensitive/reactive, neutral/balanced, oily/congested. The baked-in
subtitles already use some interpretive language ("congestion," "reactive,"
"depleted") rather than strictly observable/descriptive language. Per the
task's standing instruction, **a filename or baked-in caption does not by
itself establish that this is the correct taxonomy, that the categories are
mutually exclusive, or that the images correctly represent each named
category** — this must be evaluated during the Module 4 audit, including
whether the existing course taxonomy (if any predates these assets) matches
these five categories at all.

---

## General notes for the Module 4 audit (flagged, not resolved)

- Every image in both folders has **text and/or graphic markers baked
  directly into the raster** (headings, subtitles, dashed outlines, filled
  circles). None of this is real DOM text, so none of it is currently
  screen-reader accessible, resizable, or translatable — alt text and/or a
  redesigned presentation will be needed regardless of which images are
  ultimately approved.
- No image currently has any alt text, caption, or source attribution
  associated with it in any production file — none are referenced anywhere
  yet.
- `exam-area-04-temporal-area.png` uses a visibly different model/framing
  (side-profile, partial face visible) than the other four
  examination-area images (front-crop or from-behind, no full face) — flagged
  as a visual-consistency question, not resolved.
- The two "congested" microscopy images
  (`microscopy-congested-scalp.png` and
  `microscopy-oily-congested-scalp.png`) may represent overlapping
  categories — flagged, not resolved.
- No image's anatomical, dermatological, or diagnostic accuracy has been
  evaluated in this pass. Per task instructions, a microscopic image does
  not by itself establish a diagnosis, and a filename does not by itself
  prove the image's medical or anatomical interpretation is correct.
- No image was renamed, cropped, compressed, or otherwise modified in this
  intake pass.
