# Module 7 — Source Extraction (Pre-Audit)

**Course:** AIMT Head Spa Certification Course
**Module:** 7 — student-facing title varies by surface (see §1)
**Status:** Extracted for external audit. Not audited, not approved, not implemented.
**Production source of truth:** `headspa-mastery.html`, `assets/js/headspa-state.js`
**Source commit at extraction time:** `6482c8ac4d36418d90d6623a826f0ba977fcb877` ("Add Module 6 video source")
**Branch:** `course-audit-build`

This document is a neutral, verbatim record of the current Module 7 experience as it exists in production code today. It does not propose replacement curriculum, approved outcomes, final copy, implementation instructions, or exact photo requirements — see `module-07.md` (empty scaffold, created alongside this file) for the future external-audit specification. Nothing in this document has been implemented, corrected, or approved. No production file was modified to produce this extraction. `module-06-source.md` was read only as structural precedent for this document's format — no Module 6 curriculum, findings, or decisions were imported into this extraction.

---

## 1. Module identity

| Field | Value | Source |
|---|---|---|
| Technical module number | `7` | `MODULE_CHECKPOINTS['7']`, `M7`, `module7Wrap`, `data-module-id="7"` |
| Student-facing title (home-screen row) | **Module 7 — Equipment & Room Setup** | `headspa-mastery.html:2445` |
| Home-row subtitle | **Tools, bed setup, station prep** | `headspa-mastery.html:2445` |
| `MODULE_TITLES[7]` (lesson nav-bar title) | **Module 7 — Equipment & Room Setup** | `headspa-mastery.html:6503` |
| Hero eyebrow | **Module 7 · Equipment & Room Setup** | `headspa-mastery.html:5429` |
| Hero title | **Before the service starts, your setup is already speaking.** — exact rendered text: "Before the service starts,\<br\>your setup is already speaking." (hard-coded line break after "starts,") | `headspa-mastery.html:5430` |
| Hero description | "By the time your hands touch the client, they've already formed an impression. Not consciously — but they feel whether you're prepared, whether the space is controlled, whether the service will be smooth or interrupted. Your setup is not separate from the service. It is part of it." | `headspa-mastery.html:5431` |
| Wrapper ID | `module7Wrap` — standard hidden-template pattern (matches Modules 0, 1, 2, 4, 5, 6) | `headspa-mastery.html:5425` |
| JavaScript identifiers | `M7` (questions + shared `system` function), `submitM7CP(id)`, `m7cpKey(e,id)`, `toggleToolCat(id)`, `togglePrep(idx)`, `resetPrepChecklist()`, `_prepDone` (module-level `Set`) | `headspa-mastery.html:7210, 8149, 8152, 8184, 8205, 8224, 8204` |
| Checkpoint IDs | `m7cp1`, `m7cp2` — standard `mNcpX` pattern | `headspa-mastery.html:5586–5593, 5601–5608`; `MODULE_CHECKPOINTS['7']` at `headspa-mastery.html:6471` |
| Completion-card ID | `m7Complete` | `headspa-mastery.html:5611` |
| Routing entry | `openModuleById(7)` (home row and Module 6's completion-card "Start Module 7 →" button); `STATIC_MODULES[7]` in `openModuleById()` copies `#module7Wrap`'s innerHTML into `.lesson-wrap`, then (uniquely among the interaction-reset calls in `STATIC_MODULES`) calls `resetPrepChecklist()` synchronously — no `setTimeout` — on every open | `headspa-mastery.html:2443, 5416, 7471` |
| Module 6 prerequisite | `APP_STATE.canAccessModule(7)` — generic, shared logic requiring `isModuleComplete(6)` (both `m6cp1` and `m6cp2` passed) unless Course Review Mode is active; no module-7-specific override found | `assets/js/headspa-state.js:628` region (shared `canAccessModule`) |
| Module 8 unlock | Module 7's completion card links to `openModuleById(8)`; `APP_STATE.canAccessModule(8)` requires `isModuleComplete(7)` (both `m7cp1` and `m7cp2` passed, no read-percentage minimum) — same generic, shared gating logic as every other module | `headspa-mastery.html:5619`; `assets/js/headspa-state.js` (shared `canAccessModule`/`isModuleComplete`) |
| Completion-card routing special case | `getVisibleCompletionCard(moduleId)` hardcodes only `moduleId === 3` as an exception (`'lessonComplete'`); Module 7 uses the generic `'m' + moduleId + 'Complete'` pattern — confirmed not a structural outlier | `headspa-mastery.html:6598–6601` |
| Relationship to Module 6 | Module 6's own completion card (`#m6Complete`, per `module-06-source.md` §2) previews Module 7 by name and topic: "Even the most knowledgeable practitioner cannot deliver a high-level experience in a poorly designed setup. Module 7 covers equipment, tools, room design, and how to build a workspace that makes everything else possible." Module 7's own hero content does not explicitly reference Module 6 or its "interpret before you treat" theme — the hero instead opens a new, self-contained frame ("your setup is already speaking") with no backward callback sentence of its own. | `headspa-mastery.html:5219` (Module 6 preview text, quoted from `module-06-source.md` §2); `headspa-mastery.html:5428–5432` (Module 7 hero, no Module 6 reference found) |
| Current preview/handoff to Module 8 | Completion card (`#m7Complete`) next-module label "Up next — Module 8" with text: "The full 17-step service map. Both formats. Every transition and every micro-teach moment that makes this service worth the price clients pay for it." Primary button "Start Module 8 →" (`openModuleById(8)`); secondary "Back to course" (`showHome()`). | `headspa-mastery.html:5611–5621` |

---

## 2. Source map

| Component | File | Location |
|---|---|---|
| Home-screen module row | `headspa-mastery.html` | lines 2443–2447 |
| Full curriculum block (`#module7Wrap`) | `headspa-mastery.html` | lines 5425–5624 |
| Section 7.1 (treatment bed) markup | `headspa-mastery.html` | lines 5434–5452 |
| Section 7.2 (tools & supplies) + tool-category accordion markup | `headspa-mastery.html` | lines 5456–5511 |
| Section 7.3 (station prep sequence) + prep-checklist markup | `headspa-mastery.html` | lines 5515–5541 |
| Section 7.4 (client positioning) + photo pair + position cards markup | `headspa-mastery.html` | lines 5545–5579 |
| Checkpoint 1 markup (`m7cp1`, Section 7.5) | `headspa-mastery.html` | lines 5583–5594 |
| Checkpoint 2 markup (`m7cp2`, Section 7.6) | `headspa-mastery.html` | lines 5598–5609 |
| Completion card markup (`m7Complete`) | `headspa-mastery.html` | lines 5611–5621 |
| `MODULE_CHECKPOINTS['7']` | `headspa-mastery.html` | line 6471 |
| `MODULE_TITLES[7]` | `headspa-mastery.html` | line 6503 |
| `M7` object (questions + system) | `headspa-mastery.html` | lines 7210–7216 |
| `MODULE_GUIDE_SYSTEMS[7]` | `headspa-mastery.html` | line 7257 |
| `MODULE_QUICK_PROMPTS[7]` | `headspa-mastery.html` | line 7272 |
| `openModuleById()` — `STATIC_MODULES[7]` routing (`resetPrepChecklist()` call) | `headspa-mastery.html` | line 7471 |
| `openModuleById()` — Module 7 greeting (`greetings[7]`) | `headspa-mastery.html` | line 7511 |
| `submitM7CP(id)` | `headspa-mastery.html` | lines 8149–8151 |
| `m7cpKey(e,id)` | `headspa-mastery.html` | lines 8152–8154 |
| `toggleToolCat(id)` | `headspa-mastery.html` | lines 8184–8202 |
| `_prepDone` (module-level `Set`), `togglePrep(idx)` | `headspa-mastery.html` | lines 8204–8222 |
| `resetPrepChecklist()` | `headspa-mastery.html` | lines 8224–8234 |
| `getVisibleCompletionCard()` (confirms Module 7 uses the generic, non-special-cased pattern) | `headspa-mastery.html` | lines 6598–6601 |
| Shared checkpoint pipeline (`submitCheckpoint`, `evaluateCheckpointAnswer`, `renderCheckpointOutcomeLabel`, `restoreLessonState`, `submitCheckpointReviewMode`) | `headspa-mastery.html` | lines 6706+, 6809+ (shared with every module) |
| `.clinical-photo` / `.clinical-photo.placeholder` / `.photo-pair` CSS (+ shared mobile collapse) | `headspa-mastery.html` | lines ~1921–1965 (shared, ported from Module 5/6 precedent), `.photo-pair` rule at line 2006, mobile collapse at line ~2016 |
| `.tool-category` / `.tc-head` / `.tc-body` / `.tc-arrow` CSS | `headspa-mastery.html` | lines 1464–1472 |
| `.prep-checklist` / `.prep-item` / `.pi-check` / `.prep-complete` CSS | `headspa-mastery.html` | lines 1479–1486 |
| `.pos-card` / `.pos-num` CSS | `headspa-mastery.html` | lines 1489–1490 |
| `.key-point` CSS (shared, used file-wide) | `headspa-mastery.html` | line 372 |
| `canAccessModule`, `isModuleComplete`, `_hasAllRequiredCheckpoints` | `assets/js/headspa-state.js` | shared (same functions documented in `module-06-source.md` §12) |
| `MODULE_MEMORY_TAGS[7]` | `assets/js/headspa-state.js` | line 139 |
| `getCheckpointMemoryTags` (`moduleId === 7` branch) | `assets/js/headspa-state.js` | lines 331–334 |

State keys touched by Module 7 (all shared, generic per-module state — no module-7-specific key names): `progress['7'].checkpoints`, `progress['7'].checkpointMeta.m7cp1`/`m7cp2`, `progress['7'].complete`, `progress['7'].completedAt`, `progress['7'].startedAt`/`lastVisitedAt`/`lastScrollY`/`maxReadPercent`, `student.cadenceMemory.notableAnswers` (entries tagged `moduleId: 7`), `student.cadenceMemory.patterns.strengths`/`focusAreas` (populated with Module 7's tags on pass/retry). The tool-category accordion and prep-checklist touch **no** `APP_STATE` key at all — their only state is the in-memory `_prepDone` `Set` and transient DOM classes, both fully reset on every module open.

Selectors: `#module7Wrap`, `#m7cp1`, `#m7cp1In`, `#m7cp1Btn`, `#m7cp1Res`, `#m7cp2`, `#m7cp2In`, `#m7cp2Btn`, `#m7cp2Res`, `#m7Complete`, `#tc-linen`, `#tc-linen-body`, `#tc-tools`, `#tc-tools-body`, `#tc-sanit`, `#tc-sanit-body`, `#tc-ambient`, `#tc-ambient-body`, `#pi-0`–`#pi-9`, `#pic-0`–`#pic-9`, `#prepComplete`, `[data-module-id="7"]`.

---

## 3. Complete student-facing content (verbatim, in student encounter order)

Reproduced exactly as it appears in `headspa-mastery.html:5425–5624` (the full `#module7Wrap` block). Wording is unedited; only structural/HTML scaffolding is summarized where it does not change what the student reads.

### Hero

> **Module 7 · Equipment & Room Setup**
> **Before the service starts, your setup is already speaking.** *(rendered with a line break after "starts,")*
> By the time your hands touch the client, they've already formed an impression. Not consciously — but they feel whether you're prepared, whether the space is controlled, whether the service will be smooth or interrupted. Your setup is not separate from the service. It is part of it.

### 7.1 — "The treatment bed"

> **Your most important equipment decision.**

**Placeholder photo** (see §5): "Halo Wet Bed — Setup Photo" / "Properly configured head spa bed with halo attachment"

> The head spa bed is the foundation of everything. Comfort, positioning, water flow, massage access, client perception — it all builds from this. You can perform a service without the right bed. But you cannot create a premium experience without one.
>
> A halo-equipped wet bed is the foundation of a true head spa service. The halo allows water immersion during massage, which changes the client's physical and psychological state in a way that dry work cannot replicate. When evaluating beds, prioritize models without confining armrests — side rails that tuck in the client are consistently uncomfortable for taller or larger guests, and the discomfort breaks the relaxation response you've spent the whole service building.

**Info card — "What most people get wrong":**

> They choose based on how it looks, not how it performs. A bed with restrictive armrests may photograph beautifully — but larger clients feel confined, taller clients feel compressed, and movement becomes limited. Once comfort breaks, the entire service is affected. Nothing will compensate for it.

**Cadence note ("From Cadence"):**

> "One of the earliest mistakes I made was prioritizing what looked impressive in photos over what felt comfortable to lie in for an hour. Buy the bed your clients will want to come back to — not the one that photographs well."

### 7.2 — "Tools & supplies"

> **Essentials first. Upgrades later.**
>
> Most people overvalue tools. They assume more tools means a better service. That's incorrect. Your hands create the experience. Tools support, enhance, and assist — but they should never replace presence. Overuse of tools leads to a mechanical-feeling service, loss of connection, and inconsistent pressure. Clients may not say it. But they feel it.
>
> Start with everything on the essentials list. Nothing on the upgrades list is necessary to deliver a premium service — add from the upgrade tier when your volume justifies it.

**Interaction hint text:** "↓ Tap each category to expand"

**Four tool categories** (`.tool-category`, tappable — see §6), each Essential/Upgrade badged:

*Linens & comfort* (🛏): Essential — fresh bed sheets (min. 2 sets/station), towels (hand + large, min. 6 each), towel warmer, spa wraps and robes, knee bolster, eye mask. Upgrade — weighted blanket, heated jade eye mask.

*Service tools* (🪮): Essential — rolling cart (stations should be mobile), mixing bowls (3–4 small dishes for product portions), applicator brushes, wide-tooth comb and detangling brush, sectioning clips, blow dryer. Upgrade — scalp microscope/dermatoscope, dry brushing tool, steamer hood attachment.

*Sanitation supplies* (🧴): Essential — Barbicide concentrate and properly sized container, disinfecting wipes (EPA-registered), nitrile gloves, separate bins for clean vs. dirty tools ("never mix"), halo line cleaner (manufacturer-specific). No "Upgrade" items listed for this category.

*Ambient experience* (🕯): Essential — Bluetooth speaker (water-resistant), curated playlist (non-lyric, consistent tone), essential oil diffuser. Upgrade — dimmable overhead lighting, LED bias lighting or backlit panels, ambient sound machine.

### 7.3 — "Station prep sequence"

> **Run this before every single client.**

**Placeholder photo** (see §5): "Fully Prepped Station — Photo" / "Cart loaded, product dishes set, bed made, towel warmer on"

> Inconsistency in setup is invisible to you and obvious to your client. A client who experienced a perfectly set room last visit notices when the towel warmer is cold or the cart is in the wrong place — even if they can't articulate why the experience felt off. Build a prep sequence and run it the same way every time.

**Interaction hint text:** "↓ Tap each step to mark complete"

**Ten-item prep checklist** (`.prep-item`, tappable — see §6):

1. **Halo flush** — Barbicide rinse, then plain water until clear
2. **Product dishes** — Three bowls: shampoo, mask, exfoliant. Applicator brush alongside.
3. **Towel warmer loaded** — Confirm warm to the touch before client arrives
4. **Fresh bed linens** — Sheet, headrest cover, clean pillow if used
5. **Bed warmer on** — Set to appropriate temperature
6. **Room temperature** — Set lower than normal — the client will be wet
7. **Spa wrap, robe, slipper socks** — Folded and ready at station entry
8. **Wrap towel around halo nozzle hose** — Quiets it, prevents spray, maintains atmosphere
9. **Massage oil and lotion** — Ready on cart, easily accessible
10. **Ambient: music, lighting, diffuser** — Running before client enters the room

**Completion state (shown once all 10 are tapped, `#prepComplete`):**

> ✓
> **Station ready.**
> Run this before every single client.

### 7.4 — "Client positioning"

> **Three things to confirm before the water runs.**

**Photo pair** (both placeholder graphics — see §5):

| Slot | Label | Caption below box |
|---|---|---|
| Left | "Correct Positioning — Side View" | "Occipital in headrest, neck relaxed, shoulders at edge" |
| Right | "Correct Positioning — Top View" | "Centered under halo, water hits scalp evenly" |

> Positioning errors are hard to correct mid-service without breaking the experience. Get these right before you start — it takes thirty seconds and prevents a disruption you cannot undo.

**Three numbered position cards** (static, non-interactive):

1. **Halo alignment** — "Client centered under the halo so water hits evenly across the scalp. Adjust the client's position — not the halo."
2. **Shoulder position** — "Top of shoulders sit 1–2 inches off the edge of the bed. This gives you clean access to the neck without the client sliding."
3. **Occipital support** — "The occipital bone rests in the deepest curve of the headrest with the neck naturally relaxed — not extended, not flexed. If the chin is lifting, reposition."

**Cadence note ("From Cadence"):**

> "Cover the client first, then slide the knee bolster into place. Weighted blanket across the chest if using. Eye mask on. Then begin. Doing it out of sequence makes the client feel arranged rather than cared for."

**Key-point callout:**

> **Pressure test your setup:** Ask yourself — if something unexpected happens, can I adjust without breaking flow? Can I reach everything without stepping away? Does this still work when I'm not thinking perfectly? If not, your setup is not ready.

### 7.5 — "Checkpoint"

> **Before the client arrives.**
>
> A new student is setting up their first head spa room from scratch. What would you tell them to do first — and why does the order of prep matter?

See §7 for full checkpoint detail (displayed question quoted verbatim above; evaluated question differs — see §7).

### 7.6 — "Checkpoint"

> **A client says she's uncomfortable.**
>
> You've just begun the halo rinse phase. Your client mentions her neck feels strained and she's a little cold. The service has just started. Walk through how you respond — what you adjust and in what order.

See §7 for full checkpoint detail (displayed question quoted verbatim above; evaluated question differs — see §7).

### Completion card (`m7Complete`)

> **Module complete.**
> Your station is built. Your prep sequence is locked. Now it's time to step into the service itself.
>
> **Up next — Module 8**
> The full 17-step service map. Both formats. Every transition and every micro-teach moment that makes this service worth the price clients pay for it.
>
> [Start Module 8 →] [Back to course]

---

## 4. Current section structure

Module 7's visible section numbering is **7.1 → 7.2 → 7.3 → 7.4 → 7.5 → 7.6**, with no gaps, no merged sections, and no duplicated headings — confirmed by reading the complete block and cross-checking every `.sec-eyebrow` occurrence within `#module7Wrap`. This is a cleaner sequence than Module 6's, which skips "6.2" entirely (`module-06-source.md` §2, §13).

| # | Heading | Visible purpose | Key content | Interaction/media dependency | Relationship to adjacent sections |
|---|---|---|---|---|---|
| 7.1 | The treatment bed | Establish the head spa bed as the foundational equipment decision | Bed/halo rationale, armrest-comfort warning, "what most people get wrong" info card, Cadence first-person anecdote | 1 placeholder photo | Opens the module; no dependency on the hero beyond restating its "setup speaks before you do" theme |
| 7.2 | Tools & supplies | Establish an essentials-vs-upgrades tool philosophy and inventory | Four tappable tool categories (linens, service tools, sanitation, ambient), each Essential/Upgrade badged | Tool-category accordion (`toggleToolCat`) | Independent of 7.1; feeds forward into 7.3's prep sequence, which references items introduced here (towel warmer, product dishes, halo hose) |
| 7.3 | Station prep sequence | Teach a repeatable pre-client prep routine | 10-step prep checklist, "station ready" completion state | 1 placeholder photo; prep checklist (`togglePrep`/`resetPrepChecklist`) | Directly builds on 7.2's tool inventory (several checklist items name specific 7.2 tools/categories) |
| 7.4 | Client positioning | Teach three physical positioning checks before starting the halo | Photo pair, three numbered position cards, Cadence sequencing note, "pressure test" key-point callout | Photo pair (static, non-interactive — unlike 7.1/7.3's single placeholders, no click behavior exists on either image) | Follows 7.3 chronologically (prep the station, then position the client) but is not gated behind checklist completion — a student can reach 7.4 without ever tapping a prep item |
| 7.5 | Checkpoint | First required checkpoint (`m7cp1`) | Prep-logic scenario question | Checkpoint form (`m7cp1`) | Directly tests 7.3's prep-sequence content; both 7.5 and 7.6 share the identical section title "Checkpoint" with no distinguishing eyebrow sub-label beyond the bolded section title beneath each ("Before the client arrives." / "A client says she's uncomfortable.") |
| 7.6 | Checkpoint | Second required checkpoint (`m7cp2`) | Mid-service adjustment scenario question | Checkpoint form (`m7cp2`) | Tests a synthesis of 7.1 (comfort), 7.3 (temperature/prep), and 7.4 (positioning) content together in one scenario; completes the module |

Both checkpoints are placed as their own numbered sections (7.5, 7.6) rather than being visually distinct "Checkpoint 1 / Checkpoint 2" callouts layered after other section content — a different structural convention than Module 6, where the two checkpoints were embedded inline without their own section-number eyebrow at all (`module-06-source.md` §2 places them under "Checkpoint 1 (`m6cp1`) — 'Real scenario'" as sub-headings, not `.sec-eyebrow` numbered sections). Recorded as a factual structural difference, not a defect.

---

## 5. Existing visual and asset inventory

**Module 7 currently contains zero real media assets.** Every "photo" slot in the module (§3) renders `.clinical-photo.placeholder` — the same dashed-border box, generic decorative camera/crop SVG icon (`.cp-placeholder-icon`), and small caps-lock label (`.cp-placeholder-label`) pattern already documented for Modules 5 and 6, with a separate caption line (`.photo-pair-label`) beneath the box for the one photo-pair instance. There is no `<img>` tag, no `background-image`, and no reference to any file under `assets/images/` anywhere inside `#module7Wrap` — confirmed by direct reading of the full block and by grepping the file for any Module-7-scoped reference to `assets/images` or `module-07`/`module_07`: no match found in either case. No file exists at `assets/images/course/module-07/` (directory does not exist; confirmed by listing `assets/images/course/`, which contains only `module-03/`, `module-04/`, `module-05/`, `module-06/`).

Full inventory of placeholder slots (all illustrative-only, decorative, none authenticated or real):

| # | Placement | Label | Caption / sub-line below box |
|---|---|---|---|
| 1 | Section 7.1, single placeholder | "Halo Wet Bed — Setup Photo" | "Properly configured head spa bed with halo attachment" |
| 2 | Section 7.3, single placeholder | "Fully Prepped Station — Photo" | "Cart loaded, product dishes set, bed made, towel warmer on" |
| 3 | Section 7.4 photo pair, left | "Correct Positioning — Side View" | "Occipital in headrest, neck relaxed, shoulders at edge" |
| 4 | Section 7.4 photo pair, right | "Correct Positioning — Top View" | "Centered under halo, water hits scalp evenly" |

- **Inline SVGs:** only the generic placeholder camera-icon SVG, reused identically across all four slots — the same SVG markup already used for Modules 5 and 6's placeholder slots.
- **Diagrams / icons beyond the placeholder icon:** the four tool-category emoji glyphs (🛏, 🪮, 🧴, 🕯) used as `.tc-icon` labels — decorative, not informational beyond restating each category's name.
- **Video blocks:** none.
- **Downloadable resources:** none referenced anywhere in Module 7's current markup or JavaScript.
- **Broken or missing references:** none — as with Modules 5 and 6, there is nothing to be "missing" since no image path is referenced at all.
- **Comparison slots:** the Section 7.4 photo pair is the module's only side-by-side image comparison; unlike Module 6's `.vs-card` comparison pair, the two Section 7.4 images are both framed as "correct" (side view / top view of the same positioning), not a correct-vs-incorrect contrast — no incorrect-positioning image slot currently exists anywhere in Module 7.
- **File formats / dimensions:** N/A — no image files exist for Module 7.
- **Alt text and captions:** N/A for alt text (no `<img>` elements exist to carry it). Visible captions exist as plain text (`.cp-placeholder-label`, `.photo-pair-label`) and are readable by assistive technology as ordinary text content, not as image alternatives.
- **Illustrative / authenticated / unverified / decorative:** every slot is purely decorative placeholder scaffolding — the same category already established for Modules 5 and 6.

Per instruction, the user's own reference photographs (head spa bed, assembled treatment tray) were **not** used, referenced, generated, or added during this extraction. No positioning-comparison, correct/incorrect, or tray-photo imagery was created. The need for imagery at these four slots (and any additional slots the audit may identify) is recorded here as a factual current-state gap only — what exact photograph, angle, framing, count, or demonstrated mistake is required is explicitly deferred to the external audit, per instruction.

Because there are no actual image, diagram, video, or downloadable assets currently in Module 7 to inventory beyond this placeholder-scaffold description, a separate `module-07-assets.md` file was **not** created for this extraction, matching the precedent already set for Modules 5 and 6.

---

## 6. Current interactions

Module 7 has **two distinct ungraded interactive components** in addition to its two required checkpoints — fewer than Module 6's four, and of a different character (one is a reveal accordion; the other is a self-tracking checklist with its own completion state, a pattern not seen in Module 6). Neither writes `APP_STATE` progress, gates completion, or persists state across a module reopen.

### Tool-category accordion (`toggleToolCat`)

- **What the student sees:** four category rows (`#tc-linen`, `#tc-tools`, `#tc-sanit`, `#tc-ambient`), each showing an emoji icon, a category label, and a `+` arrow.
- **What the student must do:** click/tap a category to expand it and reveal its itemized Essential/Upgrade list beneath.
- **Judgment vs. decorative:** a reveal/reference interaction — organizes a long inventory into browsable categories rather than requiring the student to observe, decide, or sequence anything. Comparable in kind to Module 6's comparison-card and trigger-accordion toggles (`module-06-source.md` §3), which were also classified as reveal-style rather than judgment-style.
- **Correct/expected behavior encoded in the implementation:** `toggleToolCat(id)` closes every open `.tc-body`/`.tool-category` first (resetting every arrow to `+`), then — if the clicked category was not already open — opens only the clicked category and its body, and swaps its arrow to `−`. Only one category can be expanded at a time; clicking an already-open category closes it (arrow reverts to `+`).
- **Feedback copy:** none beyond the revealed item list itself — no correct/incorrect framing, since this is a reference/inventory interaction.
- **Retry/reset behavior:** unlimited — any category can be reopened/closed freely, in any order, any number of times.
- **Progress write:** none — `toggleToolCat` contains no reference to `APP_STATE`.
- **Persistence:** none — expanded/collapsed state is not stored; reopening the module always starts with all four categories collapsed (a fresh copy of `#module7Wrap`'s innerHTML is injected on every open).
- **Gates completion:** no.
- **Keyboard/accessibility wiring visible in the code:** **none.** `.tool-category` is a plain `<div onclick="...">` with no `tabindex`, `role="button"`, `aria-expanded`, or `aria-pressed`. Confirmed by a direct grep of the full `#module7Wrap` markup for `tabindex`, `role=`, and `aria-`: zero matches anywhere in the block, including inside the checkpoints (see §10).
- **Touch implications:** category rows use generous padding (`1rem 1.1rem` on `.tc-head`) that appears touch-friendly on visual inspection of the CSS; not measured against a specific minimum (e.g. 44×44px).

### Station prep checklist (`togglePrep` / `resetPrepChecklist`)

- **What the student sees:** ten rows, each with a circular checkbox glyph (`○`) and a bolded step name plus description.
- **What the student must do:** click/tap a row to mark it complete (glyph becomes `✓`, row background shifts to the shared green success-light tint `#e8ede8`); clicking again un-marks it.
- **Judgment vs. decorative:** a self-tracking checklist — the student is applying a fixed, pre-written sequence to themselves rather than being asked to observe, decide, or reconstruct an order. This is a different interaction shape from anything documented in Module 6: it is the first module-extraction-confirmed instance (across Modules 5–7) of an ungraded interaction that surfaces its own "all done" completion message.
- **Correct/expected behavior encoded in the implementation:** `togglePrep(idx)` toggles membership of `idx` in the module-level `_prepDone` `Set` (declared once at module-script scope, not per-module-instance), updates that row's glyph/class accordingly, and — once `_prepDone.size === 10` — reveals `#prepComplete` ("Station ready."). There is no requirement to check items in order; any of the 10 can be toggled in any sequence, and un-checking a previously completed item does not hide `#prepComplete` again once it has been shown (confirmed by reading `togglePrep`: the `size === 10` check only ever sets `display:block`, and no code path sets it back to `none` except `resetPrepChecklist()`).
- **Feedback copy:** the completion message only ("Station ready." / "Run this before every single client.") — no per-item feedback beyond the glyph/color state change.
- **Retry/reset behavior:** unlimited within a session (any item can be toggled on/off freely); fully reset to all-unchecked on every module open via `resetPrepChecklist()`, called synchronously from `STATIC_MODULES[7]` before the greeting timer fires.
- **Progress write:** none — `togglePrep` and `resetPrepChecklist` contain no reference to `APP_STATE`. The `_prepDone` `Set` is the interaction's only state, held in page memory only.
- **Persistence:** none — because `_prepDone` is reset on every `openModuleById(7)` call (not only on a fresh page load), a student who checks all 10 items, navigates away, and returns to Module 7 in the same session will find every item unchecked again, with no completion message. This differs from Module 6, where none of its four interactions had a "your progress was here" state to lose in the first place (`module-06-source.md` §3) — Module 7's checklist is the first documented instance where an interaction actively builds toward a visible completion state that is then silently discarded on reopen.
- **Gates completion:** no — `MODULE_CHECKPOINTS['7']` lists only `m7cp1` and `m7cp2`; the prep checklist is not referenced anywhere in the completion path.
- **Keyboard/accessibility wiring visible in the code:** **none.** `.prep-item` is a plain `<div onclick="...">` with no `tabindex`, `role`, or `aria-*` attributes — same gap category as the tool-category accordion and as three of Module 6's four interactions.
- **Color-only meaning check:** completion state is communicated by both a text-glyph change (`○` → `✓`) and a background-color change (`.prep-item.done`) — not color alone.
- **Touch implications:** rows use `0.85rem 1rem` padding; not measured against a specific minimum.

### Section 7.4 position cards and photo pair

Confirmed **static, non-interactive** — the three numbered position cards (Halo alignment / Shoulder position / Occipital support) and the photo pair have no `onclick`, no JavaScript function reference, and no interactive CSS class (`cursor:pointer` is not present on `.pos-card` or `.photo-pair` in the CSS block, unlike `.tool-category` and `.prep-item`, both of which explicitly set `cursor:pointer`). Recorded here only to confirm they were checked and found non-interactive, not omitted.

### Checkpoints `m7cp1` and `m7cp2`

These are the only elements in Module 7 that write progress or gate completion. Full detail in §7. Summary here for completeness:

- **What the student sees:** an open-response prompt, a growable textarea, a voice-input button, a submit button, and a feedback region — identical structural pattern to every other module's checkpoints and to Module 6's (`module-06-source.md` §3).
- **What the student must do:** type or speak a free-text answer and submit it for AI evaluation.
- **Progress write:** yes — `APP_STATE.setCheckpointResult(7, cpId, {...})` on every submission; `captureCheckpointMemory(7, cpId)` on pass.
- **Gates completion:** yes — both `m7cp1` and `m7cp2` must be `passed` for `isModuleComplete(7)` to return true (no read-percentage minimum).
- **Accessibility:** see §10 — confirmed missing `aria-label` on both voice buttons and both submit buttons, and missing `aria-live` on both `.cp-response` feedback regions.

---

## 7. Current checkpoints

### `m7cp1`

- **Displayed question** (`.body-text` immediately preceding the `.cp-box`, Section 7.5, `headspa-mastery.html:5585`):
  > "A new student is setting up their first head spa room from scratch. What would you tell them to do first — and why does the order of prep matter?"
- **Question sent to the evaluator** (`M7.questions.m7cp1`, `headspa-mastery.html:7212`):
  > "A new student is setting up their first head spa room from scratch. What would you tell them to do first, and why does the order of prep matter?"
- **Byte-identical?** **No — confirmed mismatch.** The displayed question uses an em dash before the second clause ("first — and why"); the evaluator string uses a comma instead ("first, and why"). This is a smaller-magnitude version of the same displayed/evaluated question-parity defect already documented (and, for Modules 1–4, corrected) in Module 5 and Module 6.

### `m7cp2`

- **Displayed question** (`.body-text` immediately preceding the `.cp-box`, Section 7.6, `headspa-mastery.html:5600`):
  > "You've just begun the halo rinse phase. Your client mentions her neck feels strained and she's a little cold. The service has just started. Walk through how you respond — what you adjust and in what order."
- **Question sent to the evaluator** (`M7.questions.m7cp2`, `headspa-mastery.html:7213`):
  > "You have just begun the halo rinse phase. Your client mentions her neck feels strained and she is a little cold. The service has just started. Walk through how you respond — what you adjust and in what order."
- **Byte-identical?** **No — confirmed mismatch.** The evaluator string expands both contractions used in the displayed question ("You've" → "You have"; "she's" → "she is"). Wording and meaning are otherwise identical.

### Evaluator system / rubric

Module 7 uses **one shared function for both checkpoints** — `M7.system(q)` — not checkpoint-specific rubrics, the same pattern already documented for Module 6 (and Module 5) prior to correction:

> "You are Cadence, instructor of HeadSpa Mastery. Module 7 (Equipment & Room Setup) checkpoint. Question: '\{q\}'. Key concepts: prep sequence matters because rushing creates an atmosphere problem before the client arrives. Halo flush (Barbicide then clear water) always first. Room temp should account for the client being wet. Towel warmer loaded. Product dishes set before client arrives. Client positioning: center under halo, shoulders 1-2 inches off bed edge, occipital in headrest curve. If client is uncomfortable mid-service: stop, adjust, communicate, resume — in that order. 3-5 sentences, direct and warm, no bullet points."

This is passed into the shared `submitCheckpoint()`/`evaluateCheckpointAnswer()` pipeline, which appends `CADENCE_RESPONSE_CONSISTENCY_ANCHOR`, `CADENCE_SELECTIVE_MEMORY_INSTRUCTION`, `APP_STATE.getCadenceMemoryContext(7,'checkpoint')`, `CADENCE_CHECKPOINT_TONE`, `CADENCE_FEEDBACK_MICRO_RULES`, and `CHECKPOINT_EVAL_FORMAT` before the call — shared code, identical to every other module, not modified for this extraction.

- **Required concepts (as written into the shared rubric, not itemized per checkpoint):** why prep-sequence order matters (avoiding an "atmosphere problem" before the client arrives); halo flush (Barbicide then clear water) always first; room temperature accounting for a wet client; towel warmer loaded; product dishes set before the client arrives; the three positioning checks (centered under halo, shoulders 1–2 inches off the bed edge, occipital in the headrest curve); and a four-step mid-service discomfort response ("stop, adjust, communicate, resume — in that order").
- **Checkpoint-specific vs. shared grading behavior:** **fully shared** — `m7cp1` (a prep-sequence reasoning question) and `m7cp2` (a mid-service adjustment/communication question) are evaluated against the exact same generic rubric text, with no checkpoint-specific required elements, immediate-correction triggers, or revision-focus guidance — the same uncorrected state already documented for Module 6.
- **Completion dependency:** both `m7cp1` and `m7cp2` must reach `status: 'passed'` for `_checkModuleComplete(7)`/`isModuleComplete(7)` to return true. No read-percentage minimum. `m7cp1` does not lock Section 7.6 or the rest of the lesson — same non-locking behavior as every other module's midpoint checkpoint.
- **Voice-button behavior:** `startVoice('m7cp1In', this)` / `startVoice('m7cp2In', this)` — the shared voice-input function used by every checkpoint in the file; not module-7-specific.
- **Enter/Shift+Enter behavior:** `m7cpKey(e, id)` — Enter without Shift submits (`submitM7CP(id)`); Shift+Enter is not intercepted, so the textarea's default newline behavior applies. Matches every other module's `cpKey`-style handler.
- **Loading state:** shared `submitCheckpoint()` pipeline — disables the textarea and button, then renders an animated three-dot "thinking" indicator (`.cp-thinking`) into the response region while the evaluator call is in flight. Not module-7-specific.
- **Feedback and live-region behavior:** feedback is rendered into `#m7cp1Res`/`#m7cp2Res` via the shared `submitCheckpoint()` pipeline. **Neither `.cp-response` element carries `aria-live="polite"`** — confirmed absent by direct inspection of `headspa-mastery.html:5593, 5608` — same gap already confirmed for Module 5 and Module 6.
- **Network-failure text:** `submitM7CP(id)` calls `submitCheckpoint(7, id, M7.system, M7.questions[id])` — **four arguments, no 5th `errorMessage` argument.** As with Module 6, Module 7 has no module-specific network-failure text; a failed evaluator call falls back to the shared generic text used across every not-yet-corrected module.
- **Saved progress behavior:** identical to every other module — `APP_STATE.setCheckpointResult(7, cpId, {passed, feedback, answer})` on every submission (pass or fail); `captureCheckpointMemory(7, cpId)` only on pass (see §8 for the resulting memory tags); `restoreLessonState(7)` re-applies the stored `passed`/`retry` status, disables the input/button appropriately, and re-renders the stored feedback (or a generic previously-completed string if no feedback text was stored) when the student reopens the module. Note: unlike Module 6's `restoreLessonState`, which was confirmed to not re-run `updateSpectrum` (leaving the spectrum slider visually reset even if a checkpoint had already passed), Module 7's prep checklist and tool-category accordion have no stored value to restore in the first place — `restoreLessonState(7)` reconciling checkpoint state has no analogous effect on either interaction, since both are already unconditionally reset to zero by `resetPrepChecklist()` (called from `STATIC_MODULES[7]`) on every open regardless of checkpoint status.
- **Review Mode behavior:** Module 7's checkpoints route through the same `submitCheckpoint()` → `submitCheckpointReviewMode()` branch as every other module when `window.ReviewMode.isActive()` is true — test submissions reuse the real question and `M7.system` rubric, are labeled "Review Mode test — not saved," and never call `setCheckpointResult`/`captureCheckpointMemory`/`_checkModuleComplete`. Nothing module-7-specific overrides this.

---

## 8. Current Cadence behavior

- **Module 7 checkpoint identity:** `M7.system` — see §7 for the full string. Refers to itself as "Cadence, instructor of HeadSpa Mastery."
- **Guide system** (`MODULE_GUIDE_SYSTEMS[7]`, `headspa-mastery.html:7257`):
  > "You are Cadence — a mentor built from nearly two decades in the head spa industry. The student is in Module 7 (Equipment & Room Setup): halo bed selection, essential tools, prep sequence, client positioning. The room is part of the head spa service. If the student is building a new space or adding head spa to an existing menu, speak to how the setup specifically supports scalp wellness delivery. 3-5 sentences. No bullet points."
- **Quick prompts** (`MODULE_QUICK_PROMPTS[7]`, `headspa-mastery.html:7272`):
  1. "What bed should I get first?"
  2. "How do I set up for back-to-back clients?"
  3. "What is the non-negotiable prep step?"
- **Module-opening greeting** (`greetings[7]` inside `openModuleById()`, `headspa-mastery.html:7511`):
  > "Equipment feels like logistics but it directly affects the service. The setup details here come from real mistakes made early on. Ask me anything."
- **Memory tags:** `MODULE_MEMORY_TAGS[7] = ['service-flow', 'room-prep', 'client-guidance']` (`assets/js/headspa-state.js:139`) — three tags. `getCheckpointMemoryTags(7, answer)` (`assets/js/headspa-state.js:331–334`) derives, from the student's own passed-checkpoint answer text: `room-prep` if the answer matches `/\b(order|first|before|prep|sequence|halo flush)\b/i`; `client-guidance` if it matches `/\b(stop|adjust|communicate|resume)\b/i`; `service-flow` if it matches `/\b(temp|cold|position|towel|dishes)\b/i` (plus the file-wide fallback that adds `client-guidance` whenever the answer contains the word "client," for modules other than 8 and 10). **Unlike Module 6's `scope-awareness` tag** (declared in `MODULE_MEMORY_TAGS[6]` but unreachable from any regex branch — `module-06-source.md` §5, §13), all three of Module 7's declared tags have a corresponding, reachable regex condition in the `moduleId === 7` branch. No unreachable-tag defect found for Module 7.
- **References to the old course name:** **yes, confirmed.** `M7.system` opens with "You are Cadence, instructor of **HeadSpa Mastery**" — identical wording to Module 6's current (uncorrected) `M6.system` opening.
- **Any claim that Cadence has personal human experience:** **yes, confirmed, in two separate places:**
  1. `MODULE_GUIDE_SYSTEMS[7]` opens "You are Cadence — **a mentor built from nearly two decades in the head spa industry**" — the same template sentence already found (uncorrected) in `MODULE_GUIDE_SYSTEMS[5]` and `[6]`.
  2. **Section 7.1's visible, student-facing "From Cadence" curriculum note itself** contains a first-person personal-history claim not present in Module 6's Cadence notes: *"One of the earliest mistakes I made was prioritizing what looked impressive in photos over what felt comfortable to lie in for an hour."* This is qualitatively different from the hidden system-prompt claim above — it is rendered directly in the lesson body that every student reads, not confined to an AI instruction string. Module 6's two Cadence notes (`module-06-source.md` §2) are phrased in second person / general observation ("Sometimes the best thing you can do is simplify," "After enough clients, you start to notice...") rather than first-person autobiographical claims. Module 7's Section 7.4 Cadence note ("Cover the client first, then slide the knee bolster into place...") is instructional, not autobiographical, and does not share this issue — only the Section 7.1 note does.
- **Any content inconsistency between the curriculum and Cadence guidance:** none of the kind found in Module 5/6 (no claim in Module 7's Cadence prompts contradicts an already-corrected earlier module's approved spec) was identified in this extraction pass.
- **Duplicated or conflicting prompt sources:** none found for Module 7 specifically — one `MODULE_QUICK_PROMPTS[7]` array, no hardcoded duplicate set found in the static HTML.

---

## 9. Current completion and gating

- **Exact completion requirement:** `m7cp1` and `m7cp2` both graded `passed` (`MODULE_CHECKPOINTS['7'] = ['m7cp1','m7cp2']`; shared `_hasAllRequiredCheckpoints(7)` requires every listed ID to have `status === 'passed'`). No read-percentage/`maxReadPercent` minimum is checked anywhere in the completion path. The prep checklist and tool-category accordion have no bearing on completion — a student could pass both checkpoints without ever interacting with either.
- **Completion-card copy:** see §3 for the full verbatim text (`#m7Complete`). Title: "Module complete." Sub: "Your station is built. Your prep sequence is locked. Now it's time to step into the service itself." Next-module label: "Up next — Module 8," with next-module preview text and a "Start Module 8 →" primary button plus a "Back to course" secondary button.
- **Wording note (factual, not a correction):** the completion-card sub-line asserts "Your station is built. Your prep sequence is locked" unconditionally on passing both checkpoints — this phrasing is accurate for a student who did work through the ungraded prep checklist, but nothing in the completion path actually verifies that the student engaged with the checklist (or the tool-category accordion) at all, since neither writes progress (§6). Recorded as an observed current-state condition; see §19.
- **Competency language:** the completion card names a general capability in its one `.lc-body` sentence; like Module 5/6's cards, Module 7 has no separate itemized competency-naming line.
- **Module 8 unlock behavior:** the completion card's primary button calls `openModuleById(8)` directly; independently, `APP_STATE.canAccessModule(8)` (home-screen module list and any direct navigation) requires `isModuleComplete(7)`, which in turn requires both checkpoints passed — the two unlock paths are consistent with each other.
- **Persistence behavior:** identical to every other module — `APP_STATE.save()` is the sole write choke point; `checkpointMeta`, `checkpoints[]`, `complete`, and `completedAt` are stored per-module in `localStorage['levo_app']` (or skipped entirely while Course Review Mode is active).
- **Review Mode behavior:** no module-7-specific override — same shared behavior documented in §7.
- **Mismatch between visible completion and stored state:** none found in the checkpoint-restoration path itself. `restoreLessonState(7)` reconciles `#m7cp1Res`/`#m7cp2Res` display, input/button disabled state, and the status pill against the stored `checkpointMeta` on every module open, using the same shared logic every other module uses.

---

## 10. Current accessibility state

Only what can be confirmed from the source is reported below; nothing here was verified in a real browser, screen reader, or physical touch device as part of this extraction (see §19).

- **Headings:** Module 7 uses the same non-semantic heading pattern as every other module in the file — section titles are styled `<div>`s (`.sec-eyebrow`, `.sec-title`), not real `<h1>`–`<h6>` elements. File-wide pattern, not specific to Module 7.
- **Semantic controls:** the two checkpoint submit buttons and two voice buttons are real `<button>` elements (good). **The tool-category accordion and the prep checklist are both plain `<div onclick="...">` elements with zero keyboard/screen-reader semantics** — no `tabindex`, `role="button"`, `aria-expanded`, or `aria-pressed` anywhere in the block. Confirmed by a direct grep of the full `#module7Wrap` markup for `tabindex`, `role=`, and `aria-`: zero matches anywhere, including inside the checkpoints. The Section 7.4 position cards and photo pair are correctly non-interactive `<div>`s with no `onclick` — not an accessibility gap, since nothing there is meant to be actionable.
- **Keyboard access:** the checkpoint textareas/voice buttons/submit buttons inherit the same keyboard behavior as every other module's checkpoints (native `<button>`/`<textarea>` semantics). **The tool-category accordion and prep checklist have no keyboard access at all** — a keyboard-only or switch-device user cannot expand a tool category or check off a prep item, since `onclick` handlers on non-interactive `<div>` elements do not receive keyboard focus or respond to Enter/Space by default. This is the same category of gap already confirmed for three of Module 6's four interactions (`module-06-source.md` §10).
- **Focus visibility:** not evaluated separately from file-wide `.checkpoint`/`.cp-btn`/`.voice-btn` focus styles; the two non-native-control interactions have no focus state to evaluate, since they cannot receive keyboard focus in the first place.
- **Labels and accessible names:** **confirmed gaps**, matching Module 5/6's current state exactly. `m7cp1In`/`m7cp2In`'s voice buttons carry only `title="Speak your answer"` — no `aria-label`. `m7cp1Btn`/`m7cp2Btn` carry no `aria-label` at all. Neither the tool-category rows nor the prep-checklist rows carry any accessible name beyond their own visible text content (which, since they are non-interactive-by-semantics `<div>`s, is not exposed to assistive technology as an actionable control name at all).
- **Live regions:** **confirmed gap.** `#m7cp1Res` and `#m7cp2Res` (`headspa-mastery.html:5593, 5608`) carry no `aria-live` attribute — same gap as Module 5/6's current state.
- **Color-only meaning:** the prep checklist's completed state uses both a glyph change (`○`→`✓`) and a background-color change — not color alone (see §6). The tool-category accordion's open/closed state uses both an arrow-character change (`+`/`−`) and a background-shade change — not color alone. The Essential/Upgrade tool badges (`.ess-badge`/`.upg-badge`) are distinguished by their own text label ("Essential"/"Upgrade") in addition to any badge styling — not color alone, based on the markup (badge CSS itself was not separately inspected for color-contrast values as part of this extraction).
- **Reduced motion:** `.tc-body` and `.prep-item` use CSS `transition` properties (not `@keyframes` animation) for their open/hover/done-state changes; no `@media (prefers-reduced-motion: reduce)` override targeting either class was found in a targeted search of the stylesheet. This is a lower-severity version of the same category of gap flagged for Module 6's `slideDown`-keyframe reveals (`module-06-source.md` §10), since CSS transitions (unlike multi-keyframe animations) are commonly left unguarded across the file and are a smaller motion delta.
- **Image enlargement:** N/A — there are no real images to enlarge (§5).
- **Touch targets:** not manually measured against a specific minimum. `.tc-head` (1rem 1.1rem padding) and `.prep-item` (0.85rem 1rem padding) both appear touch-friendly on visual inspection of the CSS, matching the same unmeasured-but-generous pattern already noted for Module 6's interactive `<div>`s.
- **Responsive layout / horizontal overflow:** not verified in a real or simulated viewport as part of this extraction (see §11, §19). No dedicated `@media (max-width: ...)` rule was found specifically targeting `.tool-category`, `.prep-checklist`, `.prep-item`, or `.pos-card` (a targeted grep for each selector combined with `@media`/`max-width` returned no matches) — these elements rely on the file's general container/typography responsive behavior rather than a component-specific mobile rule. The Section 7.4 photo pair uses the shared `.photo-pair` mobile collapse rule (`headspa-mastery.html:~2016`), the same rule already applied to Modules 5 and 6's photo pairs.
- **Duplicate IDs:** none found specific to Module 7 in a targeted check (`m7cp1`, `m7cp1In`, `m7cp1Btn`, `m7cp1Res`, `m7cp2`, `m7cp2In`, `m7cp2Btn`, `m7cp2Res`, `m7Complete`, `module7Wrap`, `tc-linen`, `tc-linen-body`, `tc-tools`, `tc-tools-body`, `tc-sanit`, `tc-sanit-body`, `tc-ambient`, `tc-ambient-body`, `pi-0`–`pi-9`, `pic-0`–`pic-9`, `prepComplete` each appear exactly once in the file). A full repository-wide duplicate-ID scan was not repeated as part of this task.

---

## 11. Current responsive/mobile state

Not verified in a real or simulated viewport as part of this extraction — the observations below are static/source-observable only.

- **Fixed widths:** none identified specific to Module 7's markup; the module reuses the file's shared `.lesson-wrap` container width.
- **Hard-coded line break:** the hero title contains a literal `<br>` after "Before the service starts," (`headspa-mastery.html:5430`) — this break point is fixed regardless of viewport width, so on a narrow screen the two resulting lines may wrap again unpredictably around the manually inserted break rather than reflowing as a single, naturally wrapping sentence. No mobile-specific override was found for `.mh-title` (targeted grep for `.mh-title`/`.mh-eyebrow` combined with `@media`/`max-width` returned no matches).
- **Overflow risks:** no wide tables exist in Module 7. The four tool-category item lists (each up to 9 items) and the 10-item prep checklist are both single-column, vertically stacked layouts (`display:flex; flex-direction:column`) with no horizontal-scroll risk apparent from the CSS.
- **Wide comparison layouts:** the Section 7.4 photo pair uses the shared `.photo-pair` grid, which collapses to a single column under the existing `@media (max-width:600px)` rule (same rule already applied to Modules 5 and 6's photo pairs) — not a Module-7-specific concern.
- **Large photos:** N/A — no real images exist (§5); the placeholder boxes' sizing was not separately measured.
- **Tables:** none in Module 7.
- **Interaction stacking:** the four tool categories and 10 prep items are already single-column by default (not a grid that would need to collapse) — no stacking-order concern identified from source.
- **Touch-target concerns:** see §10 — not measured against a specific minimum, but paddings are generous by visual inspection.
- **Long headings:** the hero title's forced line break (above) is the most notable long-heading concern; section titles (e.g. "Before the client arrives," "A client says she's uncomfortable.") are shorter and were not flagged.
- **Sticky/fixed components:** none identified specific to Module 7.
- **Image sizing:** N/A — no real images exist.

---

## 12. Current learning rhythm

- **Dominant learning mode:** primarily instructional/reference reading (7.1's bed-selection reasoning, 7.2's essentials/upgrades framing, 7.4's positioning rationale) combined with two self-directed practical tools (7.2's tool-category reference accordion, 7.3's prep checklist) that let the student browse or apply a fixed list rather than make a judgment call. This is a different rhythm from Module 6, which was built around four reveal-style compare/explore interactions layered onto conceptual/diagnostic content (`module-06-source.md` §3, §12) — Module 7's content is procedural/operational (what to buy, what to do, in what order) rather than interpretive.
- **Amount of reading:** four substantive prose sections (7.1, 7.2's intro, 7.3's intro, 7.4's intro/cards) plus two info/Cadence callouts in 7.1 and one Cadence note plus one key-point callout in 7.4 — comparable in density to Module 6's prose load, though organized around lists/checklists rather than paragraphs-with-reveals.
- **Current interaction density:** two ungraded interactions (tool-category accordion, prep checklist) — fewer than Module 6's four, more than Module 5's zero (per `module-05-source.md`/`module-06-source.md` cross-reference).
- **Checkpoint placement:** both checkpoints are placed at the very end of the module, back-to-back (Sections 7.5 and 7.6, with no further instructional content after either) — unlike Module 6's two-stage mid/end placement (post-audit) or its original single-shared-rubric-but-still-embedded placement.
- **Reliance on reveal interactions:** partial — the tool-category accordion is a pure reveal interaction (content is hidden until tapped); the prep checklist is not a reveal in the same sense (its item text is always visible; only the completion state is gated behind interaction).
- **Differs from / repeats Modules 5–6:** Module 7 does not repeat any specific claim, framework, or terminology from Module 5 or Module 6 identified during this extraction — its subject (equipment, room, prep, positioning) is operationally distinct from Modules 5–6's assessment/interpretation focus. No cross-module duplicate claim (of the kind found for the "10% per 1.8°F" sebum claim shared between Modules 5 and 6) was identified for Module 7 in this pass.
- **Where the student actually reasons independently:** primarily in the two checkpoints, which ask the student to explain prep-sequence reasoning (`m7cp1`) and synthesize a mid-service adjustment response (`m7cp2`) in their own words. The two ungraded interactions (tool-category browsing, prep-checklist ticking) do not require the student to reason, predict, or judge — they are reference/self-tracking tools, not decision points. No "predict then reveal," "sort," "spot the mistake," or comparable judgment-requiring interaction exists anywhere in the current Module 7 curriculum.

---

## 13. Current practitioner-value content

What Module 7 currently attempts to teach practitioners, extracted verbatim/faithfully from source, not evaluated for accuracy or completeness:

- **Equipment-selection rule (7.1):** prioritize head spa beds without confining armrests, because side rails that "tuck in" the client are uncomfortable for taller/larger guests and break the relaxation response; choose based on how the bed performs (comfort over an hour-long service), not how it photographs.
- **Tool philosophy (7.2):** more tools do not equal a better service — overuse of tools creates a "mechanical-feeling service," loss of connection, and inconsistent pressure. Essentials should be acquired first; upgrade-tier tools should be added only "when your volume justifies it."
- **Consistency/prep-discipline rule (7.3):** a client who experienced a perfectly set room previously will notice — even without being able to articulate why — when the setup is inconsistent (cold towel warmer, misplaced cart). The stated remedy is building one prep sequence and running it identically every time.
- **Specific prep-sequence content (7.3):** halo flush first (Barbicide then clear water), product dishes set (three bowls: shampoo, mask, exfoliant), towel warmer confirmed warm, fresh linens, bed warmer set, room temperature set lower than normal ("the client will be wet"), robe/wrap/socks staged, halo hose wrapped in a towel ("quiets it, prevents spray, maintains atmosphere"), massage oil/lotion staged, ambient elements (music/lighting/diffuser) running before the client enters.
- **Client-positioning rules (7.4):** three specific checks — halo alignment (center the client, not the halo), shoulder position (1–2 inches off the bed edge for neck access without sliding), and occipital support (bone in the headrest's deepest curve, neck "not extended, not flexed"). Stated rationale: positioning errors are "hard to correct mid-service without breaking the experience," and take "thirty seconds" to get right up front.
- **Sequencing rule for pre-service comfort steps (7.4, Cadence note):** cover the client first, then knee bolster, then weighted blanket (if used), then eye mask, then begin — stated reasoning: "Doing it out of sequence makes the client feel arranged rather than cared for."
- **"Pressure test" self-check framework (7.4, key-point):** before starting, ask whether the setup allows adjustment without breaking flow, whether everything is reachable without stepping away, and whether it still works "when I'm not thinking perfectly."
- **Mid-service discomfort response rule (embedded in `M7.system`'s evaluator rubric, not in the visible curriculum body — see §7):** "stop, adjust, communicate, resume — in that order." This specific four-step sequence is never stated to the student anywhere in the visible Section 7.4 or 7.6 curriculum text; it exists only inside the hidden evaluator rubric used to grade `m7cp2`. Recorded as a factual finding, not evaluated for whether this constitutes a gap (see §19).
- **Common-mistake framing (7.1 info card):** the stated mistake is choosing equipment "based on how it looks, not how it performs," specifically citing bed armrests that "photograph beautifully" but compress or confine larger/taller clients.

---

## 14. Client-positioning content

Module 7 Section 7.4 ("Client positioning") is the module's dedicated positioning section. Full detail, extracted faithfully:

- **Current positioning instructions:** three numbered checks — (1) Halo alignment: client centered under the halo so water hits evenly, with the explicit instruction "Adjust the client's position — not the halo"; (2) Shoulder position: top of shoulders 1–2 inches off the bed edge, stated purpose "clean access to the neck without the client sliding"; (3) Occipital support: occipital bone rests in "the deepest curve of the headrest," neck "naturally relaxed — not extended, not flexed," with the instruction "If the chin is lifting, reposition."
- **Head/neck relationship to basin/halo:** described only in terms of the headrest curve and halo centering (above) — no separate "basin" terminology is used anywhere in Module 7 (the module consistently refers to the "halo," not a basin).
- **Body alignment:** shoulder-to-bed-edge distance (1–2 inches) is the only body-alignment measurement given; no guidance on hip, leg, or overall body position is present in the current curriculum.
- **Bed/pillow/bolster adjustments:** the Section 7.4 Cadence note references a "knee bolster" and "weighted blanket across the chest if using" as part of the pre-service comfort sequence, but does not describe how or where the bolster should be placed beyond "slide the knee bolster into place." No pillow guidance beyond the general "clean pillow if used" line, which appears in Section 7.3's prep checklist (item 4), not in 7.4's positioning section itself.
- **Client comfort language:** "Positioning errors are hard to correct mid-service without breaking the experience" (7.4 body text); the pressure-test key-point frames comfort/adjustability as an ongoing readiness check, not a one-time positioning step.
- **Practitioner access considerations:** the shoulder-position rule is explicitly justified by practitioner access ("This gives you clean access to the neck without the client sliding") — the only place in Section 7.4 where a rule is framed around the practitioner's own working access rather than the client's comfort alone.
- **Warnings:** none phrased as a "if X, stop" or "if X, refer" warning specific to positioning — the closest is the corrective instruction "If the chin is lifting, reposition," which is a technique correction, not a stop/refer instruction.
- **Visual placeholders:** two placeholder photo slots exist for this section — "Correct Positioning — Side View" (caption: "Occipital in headrest, neck relaxed, shoulders at edge") and "Correct Positioning — Top View" (caption: "Centered under halo, water hits scalp evenly") — both are decorative placeholder boxes with no underlying image file (§5).
- **"Correct vs. incorrect" examples:** **none exist in the current source.** Both Section 7.4 placeholder slots are labeled "Correct Positioning" (side view / top view) — there is no incorrect-positioning comparison slot, callout, or description anywhere in the current Module 7 curriculum. This is a factual absence, not a recommendation for what should be added — per instruction, no photograph, comparison, or "misaligned client" concept was generated or proposed as part of this extraction.
- **Whether current imagery actually demonstrates the claimed setup:** not applicable — no real imagery exists to evaluate; both slots are placeholder graphics with only text captions (§5).

---

## 15. Treatment-tray / equipment setup content

Module 7 does not use the term "tray" anywhere in its current curriculum — the closest equivalent concept is the **"rolling cart"** referenced in Section 7.2's Service tools category ("Rolling cart — stations should be mobile") and implicitly staged-upon in Section 7.3's prep checklist. Extracted faithfully:

- **Current cart/tray-adjacent items (Section 7.2, "Service tools" category):** rolling cart, mixing bowls (3–4 small dishes for product portions), applicator brushes, wide-tooth comb and detangling brush, sectioning clips, blow dryer — all marked "Essential." Upgrade-tier items in the same category: scalp microscope/dermatoscope, dry brushing tool, steamer hood attachment.
- **Arrangement guidance:** no specific spatial arrangement, layout order, or "what goes where on the cart" instruction exists anywhere in the current curriculum — Section 7.2 lists items by category (Linens, Service tools, Sanitation, Ambient) but does not describe physical placement on the cart itself. Section 7.3's prep checklist item 2 ("Product dishes — Three bowls: shampoo, mask, exfoliant. Applicator brush alongside.") is the closest the current content comes to arrangement guidance — it specifies which three products go in dishes and that the applicator brush should be "alongside," but does not describe a full cart layout.
- **Sequence of tools/products:** not described as a build-order sequence; Section 7.3's prep checklist is ordered as a numbered list (1–10) but the curriculum does not state whether this numbered order is prescriptive (must be done in this exact order) or simply a presentation convenience — no explicit statement either way was found.
- **Sanitation/storage guidance:** Section 7.2's "Sanitation supplies" category (Essential only, no Upgrade tier) lists Barbicide concentrate and container, EPA-registered disinfecting wipes, nitrile gloves, "Separate bins — clean tools vs dirty tools, never mix," and halo line cleaner. Section 7.3's prep checklist item 1 ("Halo flush — Barbicide rinse, then plain water until clear") is the only sanitation step embedded in the prep sequence itself.
- **What is supposed to be within reach:** the pressure-test key-point callout ("Can I reach everything without stepping away?") implies an accessibility requirement but does not specify which items must be within reach or where the cart should be positioned relative to the bed.
- **What is optional vs. required in current copy:** every tool-category item is explicitly badged "Essential" or "Upgrade" (§3, §6) — this is Module 7's existing optional-vs-required framework, applied to tools/supplies generally, not specifically to a tray/cart layout.
- **Current photographs/placeholders:** none specific to the cart/tray — the two placeholder photo slots in 7.1 and 7.3 depict the bed and "fully prepped station" generally (7.3's caption: "Cart loaded, product dishes set, bed made, towel warmer on") rather than a dedicated tray/cart close-up. No dedicated tray-photo placeholder slot currently exists in Module 7.
- **Relationship to workflow efficiency:** Section 7.2's essentials-first philosophy and Section 7.3's consistency rationale are both framed around efficiency/quality outcomes (avoiding a "mechanical" feel, avoiding invisible-to-you-but-obvious-to-client inconsistency), but neither directly discusses tray-loading speed or turnaround efficiency between clients.

Per instruction, the user's own reference tray photograph was not used, referenced, or incorporated into this extraction.

---

## 16. Guided Completion extraction field

Recorded only what can be inferred from the current lesson — no Guided Completion Path decision is made here.

- **Approximate content volume:** four instructional sections (7.1–7.4) plus two checkpoint sections (7.5–7.6); a word-count-scale estimate was not separately computed for this extraction, but the prose volume is comparable in scale to Module 6's (per visual comparison of the two full curriculum blocks).
- **Number of checkpoints:** 2 (`m7cp1`, `m7cp2`), both required, both placed at the end of the module.
- **Hands-on activity currently expected:** the module's subject matter (equipment, prep sequence, positioning) is inherently physical/practical, but the current implementation contains no explicit "go practice this now" prompt or hands-on task description beyond the two ungraded reference/checklist interactions and the two written checkpoints.
- **Prerequisite language:** none found stating an explicit prerequisite beyond the structural Module 6 → Module 7 unlock gate itself (§1); no in-curriculum sentence states "you should already know X before this module."
- **Next-module handoff:** completion card previews Module 8 as "The full 17-step service map. Both formats. Every transition and every micro-teach moment that makes this service worth the price clients pay for it." (§3, §9).

Future Guided Completion decisions: **To be determined during external audit.**

---

## 17. Listen Mode extraction field

Recorded only what can be inferred from the current lesson — no narration design decision is made here.

- **Text that could be narrated:** the hero, Sections 7.1–7.4's prose (bed rationale, tool philosophy, prep-consistency rationale, positioning rationale), the info card, both Cadence notes, the key-point callout, and both checkpoint prompts are all linear prose/text that would narrate in sequence without requiring a screen.
- **Visuals requiring screen attention:** the four placeholder photo slots (§5) currently carry no informational content beyond their caption text (which could itself be narrated) — since none are real images yet, there is no current visual-only information loss from audio-only narration of this module. If real photography is added in the future (a decision explicitly deferred to the external audit), that would change this assessment.
- **Interactions requiring screen use:** the tool-category accordion (reading item lists after tapping to reveal) and the prep checklist (tapping items, seeing the "Station ready." message) both require on-screen interaction to reveal their content — a purely audio pass would need to either narrate every category's item list and all ten prep steps regardless of interaction state, or omit them if only reading what is visible by default. This is the same class of Listen Mode consideration already flagged for Module 6's four reveal-gated interactions (`module-06-source.md` §11).
- **Whether positioning/equipment content would lose meaning in audio-only form:** the three-point positioning framework (7.4) and the prep-sequence steps (7.3) are both currently text-only (no supporting real imagery), so their audio-only narration would not lose information relative to their current visual presentation — but both are inherently spatial/physical instructions (e.g., "occipital bone rests in the deepest curve of the headrest") that may be harder for a student to apply from audio alone even though no information is technically lost versus the current placeholder-only visual state. Flagged as a consideration for the audit, not resolved here.

Future narration design: **To be determined during external audit.**

---

## 18. Downloadable-resource extraction field

- **Does Module 7 currently have a downloadable?** No — none referenced anywhere in Module 7's markup or JavaScript.
- **Does it reference an absent resource?** No explicit reference to a named downloadable resource (e.g., a PDF title or "download the guide" link) was found anywhere in the current Module 7 curriculum, interactions, or Cadence prompts.
- **Does current UI contain a placeholder/download link?** No — no download-styled button, link, or UI element exists in `#module7Wrap`.

Downloadable resource opportunity: **To be determined during external audit.**

---

## 19. Observed current-state conditions

Tightly factual, for the later audit to inspect. Not labeled as approved corrections; no replacement is proposed for any item below.

1. `m7cp1`'s displayed (`.body-text`) and evaluated (`M7.questions.m7cp1`) question strings are **not** byte-identical — an em dash in the displayed version ("first — and why") is a comma in the evaluated version ("first, and why") (§7).
2. `m7cp2`'s displayed and evaluated question strings are **not** byte-identical — the evaluated version expands both contractions present in the displayed version ("You've" → "You have"; "she's" → "she is") (§7).
3. `M7.system` is one shared function used for both checkpoints — Module 7 has not moved to the per-checkpoint `MN.systems.mNcpX` structure Modules 1–4 use (same current state as Modules 5 and 6).
4. `submitM7CP` does not pass a 5th `errorMessage` argument to `submitCheckpoint()`, so Module 7 has no module-specific network-error text (same current state as Modules 5 and 6).
5. Both checkpoint voice buttons lack `aria-label`; both submit buttons lack `aria-label`; both `.cp-response` feedback regions lack `aria-live` — same gap category already confirmed for Modules 5 and 6.
6. `M7.system` still says "instructor of **HeadSpa Mastery**" (old course name); `MODULE_GUIDE_SYSTEMS[7]` still frames Cadence as personally "a mentor built from nearly two decades in the head spa industry" — the same pattern already found (uncorrected) in Modules 5, 6, 8, 9, and 10.
7. Section 7.1's visible, student-facing Cadence note contains a first-person personal-history claim ("One of the earliest mistakes I made...") rendered directly in the lesson body — a stronger and more visible instance of the personal-experience-claim pattern than the hidden system-prompt template, since students read this text directly rather than only receiving it indirectly through an AI response (§8).
8. The tool-category accordion (`.tool-category`) and the prep checklist (`.prep-item`) are both plain `<div onclick>` elements with zero keyboard/ARIA semantics — no `tabindex`, `role`, or `aria-*` attributes anywhere in `#module7Wrap` outside the checkpoints (§6, §10).
9. The prep checklist's `_prepDone` tracking `Set` and its resulting "Station ready." completion state are unconditionally reset to empty on every `openModuleById(7)` call via `resetPrepChecklist()` — a student who completes all 10 items, navigates away, and returns in the same session will find the checklist and its completion message both reset, with no indication this happened (§6).
10. The mid-service discomfort response sequence ("stop, adjust, communicate, resume — in that order") that `m7cp2` is graded against exists only inside the hidden `M7.system` evaluator rubric — this exact four-step framing is not stated anywhere in the visible Section 7.4 or 7.6 curriculum text the student actually reads before answering (§7, §13).
11. Section 7.4 contains no incorrect-positioning comparison of any kind — both existing placeholder photo slots are labeled "Correct Positioning" (side view / top view); no "what a positioning mistake looks like" slot, callout, or description currently exists (§14).
12. The completion card's sub-line ("Your station is built. Your prep sequence is locked.") is displayed unconditionally upon both checkpoints passing, regardless of whether the student ever interacted with the ungraded prep checklist or tool-category accordion that the sentence implicitly references (§9).
13. The hero title contains a hard-coded `<br>` line break with no mobile-specific override found, meaning the break point does not adapt to narrower viewports (§11).
14. Module 7 currently has zero real image/diagram/video/downloadable assets — all four photo slots are decorative placeholder graphics with no underlying file, the same state already confirmed for Modules 5 and 6 (§5).
15. Both checkpoints are placed as their own numbered sections (7.5, 7.6) with the identical section title "Checkpoint," distinguished only by the bolded sub-line beneath each — a different structural convention from Module 6's non-numbered checkpoint placement (§4).
16. No hero eyebrow/title/home-row wording drift was found for Module 7 — the hero eyebrow ("Module 7 · Equipment & Room Setup"), home-row title, and `MODULE_TITLES[7]` all match exactly, unlike the eyebrow drift already confirmed for Modules 5 and 6's hero eyebrows (§1). Recorded as a neutral factual observation, not an endorsement of the current title.
17. No claims/technical-content inventory of the kind built for Module 6 (§8 of that document, covering physiological/medical claims requiring external review) applies to Module 7 in the same way — Module 7's content is operational/procedural (equipment, prep, positioning) rather than physiological, so no comparable "requires medical/dermatological review" claim was identified. The equipment and positioning recommendations themselves (e.g., "prioritize models without confining armrests," the specific 1–2 inch shoulder measurement) are recorded in §13–§14 as current claims but were not evaluated for accuracy, safety, or completeness as part of this extraction.

### Assumptions or external-review questions (not verified here; require further work)

- **Equipment/ergonomics verification:** whether the specific equipment recommendations (armrest-free bed preference, the exact tool essentials/upgrades split, the 1–2 inch shoulder-position measurement, room-temperature-lower-than-normal guidance) reflect current industry best practice was not evaluated — flagged for the external audit, not resolved here.
- **Live-model testing:** how the current shared `M7.system` rubric actually grades real student answers — not evaluated here (no live API call was made as part of this documentation-only extraction).
- **Screen-reader testing:** VoiceOver/NVDA behavior around the confirmed missing `aria-label`/`aria-live`/keyboard-access gaps (§10) was not tested with an actual screen reader — the gaps are confirmed from source, not from an assistive-technology session.
- **Physical-keyboard testing:** the checkpoint textareas/buttons should be keyboard-operable per native semantics; the tool-category accordion and prep checklist are confirmed from source to have no keyboard path at all (not merely "unverified" — this is a source-confirmed gap), but the exact real-world behavior was not physically tested.
- **Real touch-device testing:** not performed; no touch-target sizing was measured.
- **Visual manual QA:** rendering of the tool-category accordion, prep checklist, position cards, and placeholder photo boxes at desktop and mobile widths was not visually confirmed in a browser as part of this extraction.
- **Photography requirements:** exactly what photograph(s) Module 7 needs (bed setup, tray/cart, correct vs. incorrect positioning, angle, framing, count, what mistake each should demonstrate) is explicitly not decided here — deferred to the external audit per instruction.
