# Module 8 — Source Extraction (Pre-Audit)

**Course:** AIMT Head Spa Certification Course
**Module:** 8 — "The Head Spa Service"
**Status:** Extracted for external audit. Not audited, not approved, not implemented.
**Production source of truth:** `headspa-mastery.html`, `assets/js/headspa-state.js`
**Source commit at extraction time:** `25afcf3654f4144acda027084a10104211d5b062` ("Add Module 7 video production source")
**Branch:** `course-audit-build`

This document is a neutral, verbatim record of the current Module 8 experience as it exists in production code today. It does not propose replacement curriculum, approved outcomes, final copy, implementation instructions, or exact video-player redesign — see the future `module-08.md` for the external-audit specification. Nothing in this document has been implemented, corrected, or approved. No production file was modified to produce this extraction. `module-07-source.md` was read only as structural precedent for this document's format — no Module 7 curriculum, findings, or decisions were imported into this extraction.

**Owner priority recorded for the later audit (not acted on here):** the owner already possesses the final instructional service-step videos and considers them the signature learning experience of this module — the "star of the show." The current video presentation (a dark thumbnail with a play icon and a "Video coming soon" fallback) is flagged by the owner as potentially feeling visually or experientially ordinary next to that intended importance. The external audit must deliberately reconsider the video-learning architecture — player hierarchy, scale, chapter/step identity, numbering, sequence navigation, the heading-to-video relationship, poster/thumbnail system, pre/post-video cues, consistency, transitions, progress awareness, desktop/phone presentation, captions/transcripts, controls, and the balance of demonstration vs. written reasoning. **No redesign, repair, or installation was performed as part of this extraction** — see §13 ("Protected video-player inventory / deferred media installation") below.

---

## 1. Module identity

| Field | Value | Source |
|---|---|---|
| Technical module number | `8` | `MODULE_CHECKPOINTS['8']`, `M8`, `module8Wrap` |
| Student-facing title (home-screen row) | **Module 8 — The Head Spa Service** | `headspa-mastery.html:2538` |
| Home-row subtitle | **Step-by-step service map, 1hr and 2hr** | `headspa-mastery.html:2538` |
| `MODULE_TITLES[8]` (lesson nav-bar title) | **Module 8 — The Head Spa Service** | `headspa-mastery.html:6796` |
| Hero eyebrow | **Module 8 · The Head Spa Service** | `headspa-mastery.html:5923` |
| Hero title | **This is not about memorizing steps.** — exact rendered text: "This is not about\<br\>memorizing steps." (hard-coded line break after "about") | `headspa-mastery.html:5924` |
| Hero description | "By this point you understand the scalp, the conditions, and the setup. Now everything comes together. Two people can follow the same steps and deliver completely different services. This module trains the part you can't get from a checklist — flow, timing, decision-making, and control." | `headspa-mastery.html:5925` |
| Wrapper ID | `module8Wrap` — standard hidden-template pattern (matches Modules 0, 1, 2, 4, 5, 6, 7) | `headspa-mastery.html:5919` |
| No wording drift | Home-row title, `MODULE_TITLES[8]`, and hero eyebrow all match exactly ("Module 8 — The Head Spa Service" / "Module 8 · The Head Spa Service") — the same clean, gap-free state already confirmed for Module 7, unlike the eyebrow drift found in Modules 5–6 | cross-check of the three surfaces above |
| JavaScript identifiers | `M8` (questions + single shared `system` function), `submitM8CP(id)`, `m8cpKey(e,id)`, `toggleServiceStep(idx)`, `selectFormat(fmt)`, `loadStepVideo(stepIdx)`, `STEP_VIDEO_IDS` (module-level array, 12 entries) | `headspa-mastery.html:7540, 8479, 8482, 8630, 8649, 9632, 9617` |
| Checkpoint IDs | `m8cp1`, `m8cp2` — standard `mNcpX` pattern | `headspa-mastery.html:6261–6265, 6276–6280`; `MODULE_CHECKPOINTS['8']` at `headspa-mastery.html:6764` |
| Completion-card ID | `m8Complete` | `headspa-mastery.html:6283` |
| Routing entry | `openModuleById(8)` (home row and Module 7's completion-card "Start Module 8 →" button); `STATIC_MODULES[8]` in `openModuleById()` copies `#module8Wrap`'s innerHTML into `.lesson-wrap` — no module-8-specific reset call fires on open (unlike Module 6's spectrum-slider re-sync or Module 7's `resetPrepChecklist()`) | `headspa-mastery.html:2536, 5911, 7793` |
| Module 7 prerequisite | `APP_STATE.canAccessModule(8)` — generic, shared logic requiring `isModuleComplete(7)` (both `m7cp1` and `m7cp2` passed) unless Course Review Mode is active; no module-8-specific override found | `assets/js/headspa-state.js` (shared `canAccessModule`) |
| Module 9 unlock | Module 8's completion card links to `openModuleById(9)`; `APP_STATE.canAccessModule(9)` requires `isModuleComplete(8)` (both `m8cp1` and `m8cp2` passed, no read-percentage minimum) — same generic, shared gating logic as every other module | `headspa-mastery.html:6291`; `assets/js/headspa-state.js` (shared `canAccessModule`/`isModuleComplete`) |
| Completion-card routing special case | `getVisibleCompletionCard(moduleId)` hardcodes only `moduleId === 3` as an exception (`'lessonComplete'`); Module 8 uses the generic `'m' + moduleId + 'Complete'` pattern — confirmed not a structural outlier | `headspa-mastery.html:6890–6893` |
| Relationship to Module 7 | Module 7's own completion card (`#m7Complete`) previews Module 8 by name and topic: "The full 17-step service map. Both formats. Every transition and every micro-teach moment that makes this service worth the price clients pay for it." Module 8's own hero content does not explicitly reference Module 7 or its equipment/setup theme — the hero instead opens a new, self-contained frame ("this is not about memorizing steps") with no backward callback sentence of its own. | `headspa-mastery.html:5908–5910` (Module 7 preview text); `headspa-mastery.html:5922–5926` (Module 8 hero, no Module 7 reference found) |
| Current preview/handoff to Module 9 | Completion card (`#m8Complete`) next-module label "Up next — Module 9" with text: "Sanitation and reset systems. The work between every service that separates consistent professionals from inconsistent ones." Primary button "Start Module 9 →" (`openModuleById(9)`); secondary "Back to course" (`showHome()`). | `headspa-mastery.html:6283–6293` |
| Module-opening Cadence greeting | "This is the full picture — every step in sequence. If you have questions about timing or technique for any specific step, I am right here." | `headspa-mastery.html:7833` |

---

## 2. Source map

| Component | File | Location |
|---|---|---|
| Home-screen module row | `headspa-mastery.html` | lines 2536–2540 |
| Full curriculum block (`#module8Wrap`) | `headspa-mastery.html` | lines 5919–6296 |
| Hero | `headspa-mastery.html` | lines 5922–5926 |
| Unnumbered "Think in phases, not steps" section + 7-phase concept grid | `headspa-mastery.html` | lines 5928–5976 |
| Section 8.1 (the two formats) + format-toggle markup | `headspa-mastery.html` | lines 5980–6002 |
| Section 8.2 (the service map) + 12 service-step accordion/video blocks | `headspa-mastery.html` | lines 6006–6221 |
| Section 8.3 (flow, pressure & transitions) — 4 info-cards + 1 key-point callout | `headspa-mastery.html` | lines 6225–6251 |
| Checkpoint 1 markup (`m8cp1`, Section 8.4) | `headspa-mastery.html` | lines 6255–6266 |
| Checkpoint 2 markup (`m8cp2`, Section 8.5) | `headspa-mastery.html` | lines 6270–6281 |
| Completion card markup (`m8Complete`) | `headspa-mastery.html` | lines 6283–6293 |
| `MODULE_CHECKPOINTS['8']` | `headspa-mastery.html` | line 6764 |
| `MODULE_TITLES[8]` | `headspa-mastery.html` | line 6796 |
| `M8` object (questions + single shared `system` function) | `headspa-mastery.html` | lines 7540–7546 |
| `MODULE_GUIDE_SYSTEMS[8]` | `headspa-mastery.html` | line 7579 |
| `MODULE_QUICK_PROMPTS[8]` | `headspa-mastery.html` | line 7594 |
| `openModuleById()` — `STATIC_MODULES[8]` routing (no reset call) | `headspa-mastery.html` | line 7793 |
| `openModuleById()` — Module 8 greeting (`greetings[8]`) | `headspa-mastery.html` | line 7833 |
| `submitM8CP(id)` | `headspa-mastery.html` | lines 8479–8481 |
| `m8cpKey(e,id)` | `headspa-mastery.html` | lines 8482–8484 |
| `toggleServiceStep(idx)` | `headspa-mastery.html` | lines 8630–8647 |
| `selectFormat(fmt)` | `headspa-mastery.html` | lines 8649–8652 |
| `STEP_VIDEO_IDS` (12-entry array, all `null`) | `headspa-mastery.html` | lines 9617–9630 |
| `loadStepVideo(stepIdx)` | `headspa-mastery.html` | lines 9632–9652 |
| `getVisibleCompletionCard()` (confirms Module 8 uses the generic, non-special-cased pattern) | `headspa-mastery.html` | lines 6890–6893 |
| Shared checkpoint pipeline (`submitCheckpoint`, `evaluateCheckpointAnswer`, `renderCheckpointOutcomeLabel`, `applyCheckpointInputState`, `ensureCheckpointStatusElement`, `restoreLessonState`, `submitCheckpointReviewMode`) | `headspa-mastery.html` | lines 6916+, 6941+, 6968+, 6998+ (shared with every module) |
| `.concept-grid` / `.cc-icon` / `.cc-term` / `.cc-sub` / `.cc-def` CSS (shared class, also used by Modules 9 and 11's static card grids) | `headspa-mastery.html` | lines 339–348 |
| `.grid-2col` / `.format-card` / `.fmt-label` / `.fmt-price-hint` / `.fmt-bullet` CSS | `headspa-mastery.html` | lines 342–343, 1584–1593 |
| `.service-map` / `.sm-step` / `.sms-head` / `.sms-num` / `.sms-info` / `.sms-title` / `.sms-timing` / `.sms-arrow` / `.sms-body` / `.sms-what` / `.sms-note` / `.sms-teach` CSS | `headspa-mastery.html` | lines 1596–1614 |
| `.sms-video` / `.sms-video-thumb` / `.sms-video-play` / `.sms-video-label` / `.sms-video-sublabel` / `.sms-video iframe` / `.sms-video-placeholder` (unused, see §5) CSS | `headspa-mastery.html` | lines 2165–2217 |
| `.info-card` / `.key-point` CSS (shared, used file-wide) | `headspa-mastery.html` | shared, not Module-8-specific |
| `canAccessModule`, `isModuleComplete`, `_hasAllRequiredCheckpoints` | `assets/js/headspa-state.js` | shared (same functions documented in `module-07-source.md` §2) |
| `MODULE_MEMORY_TAGS[8]` | `assets/js/headspa-state.js` | line 140 |
| `getCheckpointMemoryTags` (`moduleId === 8` branch) | `assets/js/headspa-state.js` | lines 335–338 |

State keys touched by Module 8 (all shared, generic per-module state — no module-8-specific key names): `progress['8'].checkpoints`, `progress['8'].checkpointMeta.m8cp1`/`m8cp2`, `progress['8'].complete`, `progress['8'].completedAt`, `progress['8'].startedAt`/`lastVisitedAt`/`lastScrollY`/`maxReadPercent`, `student.cadenceMemory.notableAnswers` (entries tagged `moduleId: 8`), `student.cadenceMemory.patterns.strengths`/`focusAreas` (populated with Module 8's tags on pass/retry). The 7-phase concept grid, the format toggle, and the service-step accordion touch **no** `APP_STATE` key at all — their only state is transient DOM classes (`.selected`, `.open`) and, for video steps, a `.loaded` class plus an injected `<iframe>`, none of which persist across a module reopen.

Selectors: `#module8Wrap`, `#fmt1hr`, `#fmt2hr`, `#sms-0`–`#sms-11`, `#smsb-0`–`#smsb-11`, `#smsvid-0-wrap`–`#smsvid-11-wrap`, `#smsvid-0-thumb`–`#smsvid-11-thumb`, `#m8cp1In`, `#m8cp1Btn`, `#m8cp1Res`, `#m8cp2In`, `#m8cp2Btn`, `#m8cp2Res`, `#m8Complete`, `[data-module-id="8"]`.

---

## 3. Current section structure

Module 8's visible content runs: **Hero → unnumbered "Think in phases, not steps" section → 8.1 → 8.2 → 8.3 → 8.4 → 8.5 → completion**, with clean section numbers (8.1–8.5, no gaps or duplicates) once the numbered sections begin. This is a different shape from every prior module: Module 8 has one full instructional section (the 7-phase concept grid) between the hero and its first numbered section, a structural pattern not seen in Modules 0–7, which all move directly from hero into `N.1`.

| # | Heading | Visible purpose | Key content | Interaction/media dependency | Relationship to adjacent sections |
|---|---|---|---|---|---|
| (unnumbered) | Think in phases, not steps | Reframe the whole service as 7 phases instead of 17 discrete steps, before the step-by-step map appears | 7-phase concept grid (Entry & Regulation → Immersion → Treatment Work → Expansion → Reset & Cleanse → Signature Moments → Exit), each phase named, sub-labeled, and defined in one sentence | `.concept-grid` of 7 `.concept-card` elements — **carries an "↓ Tap each phase to understand its purpose" interaction hint, but no `.concept-card` anywhere in the file has an `onclick` handler or any other interactive wiring; all 7 phase definitions render unconditionally and are fully visible without any tap** (see §6) | Precedes 8.1; the phase framework is not explicitly re-referenced by name anywhere in 8.1–8.5's visible copy |
| 8.1 | The two formats | Establish the 1-hour vs. 2-hour service distinction before the step map | Two format cards (1-Hour / 2-Hour), each listing 4 bullet differences; 2-Hour is pre-selected by default | Format toggle (`selectFormat`) | Independent of the phases section; sets up the format-specific timing badges shown throughout 8.2 |
| 8.2 | The service map | Walk through all 17 numbered service steps in order, each with what-to-do copy, a client-facing micro-teach line, and (for most steps) a video slot | 12 expandable step cards covering 17 numbered steps (several steps are grouped under one card — see §4); each card shows per-format timing badges, "What you do," "Micro-teach," an occasional "Note," and a video thumbnail/play control | Step accordion (`toggleServiceStep`, one-open-at-a-time) + 12 video player slots (`loadStepVideo`) | The module's central, longest section; directly builds on 8.1's format distinction (every step's timing badge is format-specific) |
| 8.3 | Flow, pressure & transitions | Teach four "skills most people never train explicitly" that operate across the whole service rather than at any one step | Four info-cards (Flow control, Pressure consistency, Temperature control, Transitions) + one "pressure test" key-point self-check callout | None — static content, no interactive element | Follows the step-by-step map; reframes the same 17 steps as a continuous performance rather than a checklist, echoing the hero's "not about memorizing steps" framing |
| 8.4 | Checkpoint | First required checkpoint (`m8cp1`) | Micro-teach-writing scenario question | Checkpoint form (`m8cp1`) | Directly tests 8.2's micro-teach content; both 8.4 and 8.5 share the identical section title "Checkpoint" with no distinguishing eyebrow sub-label beyond the bolded section title beneath each ("The micro-teach moment." / "A client asks mid-service.") — the same convention already used for Module 7's two checkpoints |
| 8.5 | Checkpoint | Second required checkpoint (`m8cp2`) | In-service client-question scenario, tied to a specific named step ("Step 5 — the scalp massage") | Checkpoint form (`m8cp2`) | Synthesizes 8.2 (a specific named step) and 8.3 (staying in flow, not breaking the experience) into one live-response scenario; completes the module |

Both checkpoints are placed as their own numbered sections (8.4, 8.5), matching Module 7's convention rather than Module 6's non-numbered inline placement.

---

## 4. Full service sequence

Module 8's curriculum names **17 numbered service steps**, organized into **7 phases** and rendered as **12 expandable step cards** in Section 8.2 (several numbered steps are grouped under a single card and a single video slot — recorded explicitly below). For every step: current step number/order, visible title, current instructional copy, technique, tools/products referenced, positioning/hand-placement/pressure/timing/sectioning/rinsing/transition/client-communication/safety content where present, and the associated video slot. Where a field is not addressed in the current copy, this is stated explicitly rather than inferred.

| Step # | Card ID | Title (as shown) | 1hr timing | 2hr timing | What you do (verbatim) | Micro-teach (verbatim, if any) | Note (verbatim, if any) | Video slot |
|---|---|---|---|---|---|---|---|---|
| 01 | `sms-0` | Aromatherapy selection | ~5 min | ~5 min | "Present three essential oil blends. Client closes eyes. Your hand rests on their shoulder throughout." | "I'm going to have you close your eyes — it heightens your sense of smell. I'll hold my hand here while you sample each one." | "The first touch happens here. This step is covered in depth in Module 2." | Video slot 0 |
| 02 | `sms-1` | Dry brushing & hair play | ~3 min | ~5 min | "Introduce the scalp to stimulation. Distribute natural oils through the lengths. Begin activating circulation before water contact." | "This is just me waking up your scalp a little — distributing your own natural oils before we add anything." | — | Video slot 1 |
| 03 | `sms-2` | Halo activation — wet massage | ~5 min | ~8 min | "Activate the halo. Begin scalp massage under water flow. Check temperature with your hand before any client contact — even when the thermostat is set." | "The water is a closed loop — it recirculates, stays warm, and keeps you completely supported." | "Temperature check is non-negotiable. Equipment fails. Your hand is the safeguard." | Video slot 2 |
| 04 | `sms-3` | Exfoliant application | ~5 min | ~5 min | "Apply exfoliant from mixing bowl using applicator brush. Work in four quadrants — frontal, temporal, crown, occipital." | "This is a scalp exfoliant — same idea as exfoliating your face, formulated for the scalp. It lifts buildup from the follicle openings before we cleanse." | — | Video slot 3 |
| 05 | `sms-4` | Scalp massage | ~15 min | ~30 min | "The heart of the service. Systematic scalp and head massage — cover all regions, vary pressure, work the occipital ridge, temples, and neck junction." | "The massage is doing several things at once — stimulating circulation to the follicles, moving lymph, and activating your parasympathetic nervous system. That's the shift you feel when you start to really relax." | "This is where the 1-hour and 2-hour diverge most. Know your pace for each format." | Video slot 4 |
| 06 | `sms-5` | First rinse | ~3 min | ~3 min | "Rinse the exfoliant thoroughly. Consistent water temperature throughout. Shower head angled slightly — never directly overhead." | "I'm rinsing the exfoliant now — you'll feel the water shift and get clearer." | — | Video slot 5 |
| 07 | `sms-6` | Neck & shoulder massage | ~5 min | ~12 min | "Transition to neck, upper traps, and shoulder work. Extended significantly in the 2-hour format." | "The neck holds a lot — most people carry tension here without realizing how much. I'm going to work through this slowly." | — | Video slot 6 |
| 08–10 | `sms-7` | Second rinse → Shampoo → Rinse | ~10 min | ~10 min | "Second rinse (same method, no over-explanation — client is deeply relaxed). Shampoo applied with therapeutic massage technique, not standard lather. Final rinse at consistent temperature." | (labeled "Micro-teach for shampoo") "I'm using [product] — chosen for your scalp specifically. The way I'm working it in continues the circulation work from the massage." | — | Video slot 7 (one slot covers all three sub-steps) |
| 11 | `sms-8` | Conditioning / treatment | "quick conditioning" | "mask + steam" | "1-hour: conditioning treatment, brief processing, rinse. 2-hour: intensive hair mask, steam hood 15–20 minutes, rinse." | (labeled "Micro-teach (2hr)") "The steam opens the cuticle and drives the treatment deeper than it would penetrate at room temperature." | "Explain the format difference clearly during booking — clients who've had the 2-hour will notice the absence of steam." | Video slot 8 |
| 12 | `sms-9` | Hand massage *(2-hour only)* | — (no 1hr badge; step is 2-hour-only) | ~8 min | "Work hands and forearms while treatment processes. Use massage lotion. Cover both hands fully, fingertips to elbow." | "While that processes, I'm going to work on your hands and forearms — there are more nerve endings in your hands per square inch than almost anywhere else." | — | Video slot 9 |
| 13–15 | `sms-10` | Waterfall rinse → Cooling spray → Hot towel | ~7 min | ~7 min | "Waterfall neck rinse — confirm alignment and temperature before water contacts client. Cooling scalp spray — the temperature contrast closes the cuticle and stimulates a final circulation response. Hot towel press — warm compression, signals transition toward completion." | (labeled "Micro-teach (cooling spray)") "This is a temperature contrast — the coolness after warm water closes the cuticle and gives the scalp a final circulatory boost. It's going to feel slightly startling and then very good." | — | Video slot 10 (one slot covers all three sub-steps) |
| 16–17 | `sms-11` | Towel wrap → Close & checkout | ~6 min | ~6 min | "Wrap hair. Help client sit up slowly — they've been horizontal for up to two hours. Deliver the closing script. Transition to blow dry or checkout. Share one specific observation from the service." | (labeled "Closing script") "Today I focused on [what you observed]. I used [products] because of [reason]. For home care, I'd recommend [one specific thing]. How are you feeling?" | "One specific, personalized observation at close drives rebooking more than any other single moment in the service." | Video slot 11 (one slot covers both sub-steps) |

**Fields not addressed by the current copy, recorded factually per instruction (not evaluated for whether this constitutes a gap):**

- **Hand placement:** never described in specific anatomical terms (e.g., finger position, palm vs. fingertip contact) for any step. The closest language is general technique description ("systematic scalp and head massage," "work in four quadrants," "cover both hands fully, fingertips to elbow" for the hand massage step).
- **Pressure guidance:** Step 5 (scalp massage) says to "vary pressure" without specifying how or when; Section 8.3's "Pressure consistency" info-card (see §3) teaches a general principle (consistency matters more than any specific pressure level) but is not tied to any individual step.
- **Sectioning instructions:** only Step 4 (exfoliant application) names an explicit spatial framework — "four quadrants — frontal, temporal, crown, occipital." No other step describes a sectioning method.
- **Rinsing instructions:** Steps 6, 8–10, and 13–15 all reference rinsing; the most specific technical guidance given anywhere is Step 6's "Shower head angled slightly — never directly overhead."
- **Client positioning:** not re-taught in Module 8 — Module 7's Section 7.4 (per `module-07-source.md` §14) is the only place client positioning is currently addressed; Module 8 does not cross-reference it explicitly.
- **Products referenced by name:** no product is named by brand or specific formula anywhere in the 17-step sequence; product mentions are generic ("exfoliant," "shampoo," "massage lotion," "hair mask," bracketed placeholders like "[product]" and "[products]" in the micro-teach/closing-script copy, meant to be filled in by the practitioner, not the curriculum).
- **Tools referenced:** applicator brush, mixing bowl (Step 4); halo (Step 3); shower head (Step 6); steam hood (Step 11); towel (multiple steps). No dedicated tool list exists for Module 8 — Module 7's Section 7.2 tool inventory is the closest existing content (per `module-07-source.md` §3).
- **Client communication:** present for most steps as a "Micro-teach" line — framed explicitly as "what you say to the client while you do it" (§3 body text) — and, for the closing step, a templated "Closing script." Steps 2 and 6 have no separate client-communication line distinct from their "What you do" copy structure (their micro-teach text is present but brief).
- **Safety/scope language:** two explicit safety statements exist — Step 3's "Temperature check is non-negotiable. Equipment fails. Your hand is the safeguard," and Section 8.3's "Temperature control" info-card, which repeats similar wording almost verbatim ("You do not guess temperature. You confirm it... Equipment fails. Your hand is the safeguard."). No other step contains safety-specific language distinct from technique description.
- **Business-outcome claims:** the closing step's "Note" states "One specific, personalized observation at close drives rebooking more than any other single moment in the service" — a causal claim about what drives rebooking, stated without qualification or citation. Flagged for §11 below.
- **Physiological claims:** Step 5's micro-teach line states the massage is "stimulating circulation to the follicles, moving lymph, and activating your parasympathetic nervous system" as the mechanism behind the client's relaxation response. Flagged for §11 below.

---

## 5. Video player inventory — required and high priority

Module 8 contains **12 individually distinct video-player slots**, one embedded inside each of the 12 expandable step cards in Section 8.2. All 12 share one markup pattern and one JavaScript loading path; none currently has a real video attached. Each is inventoried separately below, per instruction — none are summarized together despite sharing identical structure, since each is a separate element in source with its own IDs and its own entry in `STEP_VIDEO_IDS`.

### Shared structure (applies to all 12 slots)

- **Element type / HTML tags:** an outer `<div class="sms-video" id="smsvid-{n}-wrap">` wrapping a `<div class="sms-video-thumb" id="smsvid-{n}-thumb" onclick="loadStepVideo({n})">`, which itself contains a `<div class="sms-video-play">` (a circular play-button glyph built from an inline `<svg>`), a `<div class="sms-video-label">` (step identifier, e.g. "Step 01 — Aromatherapy Selection"), and a `<div class="sms-video-sublabel">` reading **"Add Vimeo link in admin"** in every one of the 12 slots.
- **Current source URL/path:** none. Each slot's entry in `STEP_VIDEO_IDS` (a 12-element array at `headspa-mastery.html:9617–9630`) is `null`. No `<iframe>`, `<video>`, or embedded source tag exists in the static markup for any slot — the iframe is only constructed and inserted at runtime, and only after a click.
- **Source tag structure:** none present in static HTML. `loadStepVideo(stepIdx)` (`headspa-mastery.html:9632–9652`) is a runtime function, not a `<source>`/`<video>` element: on click, if `STEP_VIDEO_IDS[stepIdx]` is `null`, it replaces the thumb's inner content with the plain text "Video coming soon"; if a Vimeo ID were present, it would instead add a `.loaded` class to the thumb (which sets `display:none` on it via CSS) and append a new `<iframe src="https://player.vimeo.com/video/{id}?autoplay=1&color=a3968d&title=0&byline=0&portrait=0">` to the wrap.
- **Poster/thumbnail:** no real poster image exists for any slot. The "poster" the student currently sees is a flat dark rectangle (`background:#1e1e1e`, 16:9 `aspect-ratio`) with a centered translucent-white circular play icon, a small uppercase step-identifier label, and the "Add Vimeo link in admin" sub-label — not a still frame or photograph from any actual video.
- **Dimensions/aspect-ratio behavior:** `.sms-video-thumb` and the eventual `<video>`/`iframe` are both fixed to `aspect-ratio: 16/9` at `width:100%` — responsive by aspect ratio, not by fixed pixel dimensions.
- **Controls:** none configured in the iframe URL — the Vimeo embed parameters set are `autoplay=1&color=a3968d&title=0&byline=0&portrait=0`; native Vimeo player controls (play/pause/scrub bar/volume) are Vimeo's own default embed chrome and are not suppressed, but no custom controls are built into the site.
- **Autoplay:** **yes, on load-click** — `autoplay=1` is set in the iframe URL, meaning once a student clicks the thumbnail (which is the trigger that creates the iframe), the eventual video would begin playing immediately with no further click required.
- **Muted setting:** not set in the iframe URL — no `muted=1` or `background=1` parameter is present, so a real embed would autoplay with sound (subject to the viewing browser's own autoplay-with-sound policies, which the code does not account for).
- **Loop setting:** not set — no `loop=1` parameter present.
- **`playsinline` behavior:** not explicitly set in the iframe URL; standard Vimeo player embeds play inline by default on modern mobile browsers regardless.
- **Preload behavior:** not applicable to the static markup — nothing loads until the student clicks; the iframe (and therefore the video) is not created or requested until `loadStepVideo` runs.
- **Accessible title/label:** the `<iframe>`, when created, receives no `title` attribute in the `iframe.src`/`iframe.allow`/`iframe.allowFullscreen`/`iframe.style.cssText` assignment sequence in `loadStepVideo` — confirmed by direct reading of the function; no `iframe.title = ...` line exists. The clickable pre-video thumbnail (`.sms-video-thumb`) is a plain `<div onclick="...">`, not a `<button>`, and carries no `aria-label`, `role`, or `tabindex` (see §10).
- **Captions/track elements:** none — no `<track>` element or caption reference exists anywhere in the Module 8 markup or JavaScript; captioning would depend entirely on whatever Vimeo-side caption configuration is set on the eventual uploaded video (external to this repository, not inspectable here).
- **Transcript references:** none found anywhere in Module 8's markup, JavaScript, or surrounding copy.
- **Surrounding heading:** each video sits inside its step's own `.sms-body` (the expanded content of that step's accordion card), directly beneath that step's "What you do" and "Micro-teach" (and, where present, "Note") text — there is no separate heading specifically introducing the video; the video is the last element in the card, positioned as a supplement to the written instruction above it, not the other way around.
- **Surrounding caption:** the `.sms-video-label` ("Step 01 — Aromatherapy Selection," etc.) functions as the video's own caption/identifier text, always visible even before the video is loaded.
- **Surrounding instruction/copy:** the full "What you do" / "Micro-teach" / (optional) "Note" copy for that step, described in full per-step in §4.
- **Current CSS affecting presentation:** `.sms-video` (outer wrap: rounded corners, `overflow:hidden`, dark `#1a1814` background, `margin-top:1rem`), `.sms-video-thumb` (16:9, dark `#1e1e1e` background, centered flex content, `cursor:pointer`, background lightens slightly on `:hover`), `.sms-video-play` (52px circular translucent button, slightly scales and brightens on thumb `:hover`), `.sms-video-label`/`.sms-video-sublabel` (small uppercase mono label / smaller sans sub-label, both low-opacity white), `.sms-video iframe` (100% width, 16:9, no border) — all at `headspa-mastery.html:2165–2217`.
- **Responsive/mobile CSS:** no dedicated `@media` rule targets any `.sms-video*` selector specifically — the 16:9 `aspect-ratio` sizing is inherently responsive (scales with container width) without needing a breakpoint override; a targeted search for `.sms-video` combined with `@media`/`max-width` returned no matches.
- **Current JS handlers:** `onclick="loadStepVideo({n})"` on the thumb `<div>` is the only interaction handler on any video element; there is no separate play/pause/replay control, no keyboard handler, and no handler on the outer `.sms-video-wrap` itself.
- **Playback-linked behavior:** none — nothing in the module (progress tracking, checkpoint gating, completion logic) reads or reacts to whether a video was played, how much of it was watched, or whether it finished. Video interaction is fully decoupled from `APP_STATE` and from completion (confirmed by inspecting `restoreLessonState`, `_hasAllRequiredCheckpoints`, and the completion path — none reference `STEP_VIDEO_IDS`, `smsvid`, or `loadStepVideo`).
- **Whether currently likely functional:** the **click-to-reveal mechanism itself is functional** (clicking any of the 12 thumbnails does run `loadStepVideo` and does change the DOM), but because every one of the 12 `STEP_VIDEO_IDS` entries is `null`, the actual outcome for a student today is always the same: the thumbnail's content is replaced with plain text reading "Video coming soon," and no video ever plays, for all 12 slots without exception.
- **Whether it appears to be an intentional placeholder/production marker:** **yes, explicitly** — the code contains an authored comment directly above `STEP_VIDEO_IDS` reading "Replace each null with a Vimeo video ID (the number from the Vimeo URL) / e.g. https://vimeo.com/123456789 → use '123456789'" (`headspa-mastery.html:9615–9616`), confirming this is deliberate, documented, awaiting-content infrastructure — not dead or abandoned code.

### Per-slot inventory (all 12, individually)

| Slot index | Wrap ID | Thumb ID | Associated step(s) | Label text shown | `STEP_VIDEO_IDS` entry | Status |
|---|---|---|---|---|---|---|
| 0 | `smsvid-0-wrap` | `smsvid-0-thumb` | Step 01 — Aromatherapy selection | "Step 01 — Aromatherapy Selection" | `null` | Empty — awaiting Vimeo ID |
| 1 | `smsvid-1-wrap` | `smsvid-1-thumb` | Step 02 — Dry brushing & hair play | "Step 02 — Dry Brushing & Hair Play" | `null` | Empty — awaiting Vimeo ID |
| 2 | `smsvid-2-wrap` | `smsvid-2-thumb` | Step 03 — Halo activation — wet massage | "Step 03 — Halo Activation & Wet Massage" | `null` | Empty — awaiting Vimeo ID |
| 3 | `smsvid-3-wrap` | `smsvid-3-thumb` | Step 04 — Exfoliant application | "Step 04 — Exfoliant Application" | `null` | Empty — awaiting Vimeo ID |
| 4 | `smsvid-4-wrap` | `smsvid-4-thumb` | Step 05 — Scalp massage | "Step 05 — Scalp Massage" | `null` | Empty — awaiting Vimeo ID |
| 5 | `smsvid-5-wrap` | `smsvid-5-thumb` | Step 06 — First rinse | "Step 06 — First Rinse" | `null` | Empty — awaiting Vimeo ID |
| 6 | `smsvid-6-wrap` | `smsvid-6-thumb` | Step 07 — Neck & shoulder massage | "Step 07 — Neck & Shoulder Massage" | `null` | Empty — awaiting Vimeo ID |
| 7 | `smsvid-7-wrap` | `smsvid-7-thumb` | Steps 08–10 — Second rinse → Shampoo → Rinse | "Steps 08–10 — Second Rinse, Shampoo, Rinse" | `null` | Empty — awaiting Vimeo ID |
| 8 | `smsvid-8-wrap` | `smsvid-8-thumb` | Step 11 — Conditioning & treatment | "Step 11 — Conditioning & Treatment" | `null` | Empty — awaiting Vimeo ID |
| 9 | `smsvid-9-wrap` | `smsvid-9-thumb` | Step 12 — Hand massage | "Step 12 — Hand Massage" | `null` | Empty — awaiting Vimeo ID |
| 10 | `smsvid-10-wrap` | `smsvid-10-thumb` | Steps 13–15 — Waterfall, cooling spray, hot towel | "Steps 13–15 — Waterfall, Cooling Spray, Hot Towel" | `null` | Empty — awaiting Vimeo ID |
| 11 | `smsvid-11-wrap` | `smsvid-11-thumb` | Steps 16–17 — Towel wrap & close | "Steps 16–17 — Towel Wrap & Close" | `null` | Empty — awaiting Vimeo ID |

**Every one of the 12 slots above is marked:**

> **PROTECTED — preserve through audit/initial implementation until final video installation decision.**

**Additional factual finding:** a second, unused CSS class — `.sms-video-placeholder` (with its own `.sms-video-label` color override) — exists in the stylesheet at `headspa-mastery.html:2209–2216` but is never referenced by any element in the current markup (confirmed by a repository-wide search for the class name outside its own CSS rule). This appears to be dead/superseded CSS from an earlier iteration of the placeholder pattern, before the current thumb-plus-`loadStepVideo` approach was implemented. Recorded as a factual observation only — not removed, not evaluated for disposition, since this extraction makes no production changes.

---

## 6. Existing media references

- **Videos:** the 12 Module 8 step-video slots described in §5 — zero real video files exist anywhere in the repository; all 12 are pre-content infrastructure.
- **Images:** **zero.** No `<img>` tag, no `background-image`, and no reference to `assets/images/course/module-08/` (or any `module-08`/`module_08`-named path) exists anywhere in Module 8's markup or JavaScript — confirmed by a targeted grep of the full file for both patterns, zero matches. No `assets/images/course/module-08/` directory exists in the repository (confirmed by listing `assets/images/course/`, which contains only `module-03/` through `module-07/`).
- **Posters/thumbnails:** none real — see §5's description of the flat dark placeholder card used in place of an actual video-frame poster.
- **Diagrams:** none.
- **Icons:** the 7 phase icons in the "Think in phases, not steps" concept grid are Unicode circled-number glyphs (①–⑦), not image files or custom SVG icons; the format-card and info-card sections use no icons; the video play button is an inline `<svg>` (shared triangle "play" glyph markup, not a distinct asset file).
- **Background assets:** none Module-8-specific; the file's shared `--hero-bg` and card backgrounds are reused, not new assets.
- **Downloadable resources:** none referenced anywhere in Module 8's current markup or JavaScript.
- **Broken or missing references:** none in the sense of a dangling file path — there is nothing to be "missing" a file for, since no image path is referenced at all (same category already documented for Modules 5–7's placeholder states). The only "broken" state present is the intentional, documented `STEP_VIDEO_IDS` null-array described in §5.

**Distinguishing repository-existing vs. missing vs. owner-external media, per instruction:**

- **Repository media that actually exists for Module 8:** none — zero image, video, diagram, icon, or downloadable files exist for Module 8 in the repository at extraction time.
- **Empty/missing references:** the 12 `STEP_VIDEO_IDS` entries (all `null`) and the 12 corresponding placeholder thumbnails are the only "reference-shaped" elements, and all are empty by design (see §5's confirmed intentional-placeholder finding).
- **Intentional production placeholders:** the 12 video thumbnails (§5) — confirmed intentional via the authored code comment.
- **Owner-provided future videos known to exist externally but NOT currently in the repository:** per the owner's own stated context for this task, the actual instructional service-step videos already exist and are intended to be installed into these same 12 slots in a later, separate task — **they were not used, referenced, uploaded, or installed as part of this extraction**, consistent with the instruction that actual media installation is deferred.

No claim is made anywhere in this document that any real instructional video currently exists in the repository — none do.

---

## 7. Current interactions

Module 8 has **three distinct ungraded interactive components** in addition to its two required checkpoints: the 7-phase concept grid (non-functional despite its instructional hint — see below), the format toggle, and the 12-item service-step accordion (which also gates the 12 video-load triggers). None writes `APP_STATE` progress, gates completion, or persists state across a module reopen.

### 7-phase concept grid ("Think in phases, not steps")

- **What the student sees:** 7 static cards, each showing a circled-number glyph, a phase name, a short sub-label (e.g. "Aromatherapy + dry work"), and a one-sentence definition — all fully visible at all times.
- **Interaction hint shown to the student:** "↓ Tap each phase to understand its purpose" (`.interaction-hint`, immediately above the grid).
- **What actually happens on tap/click:** **nothing.** A direct grep of the full `#module8Wrap` block, and of the file-wide `.concept-card` usage (7 additional instances exist elsewhere, in Modules 9 and 11, per §2's source-map cross-reference), confirms `.concept-card` never carries an `onclick` attribute anywhere in the file, and no JavaScript function (`togglePhase`, `selectPhase`, or similar) exists to handle a tap on it. `.concept-card`'s CSS (`headspa-mastery.html:344`) also sets no `cursor:pointer`.
- **Judgment vs. decorative:** each phase's full definition is already permanently visible without any interaction — the section functions as ordinary static prose formatted into a card grid, not as a reveal or judgment interaction of any kind.
- **Correct/expected behavior encoded in the implementation:** none exists to encode — there is no interactive behavior implemented for this element.
- **This is a dead interaction hint** — the same defect class already documented and, in Module 5's case, corrected during that module's audit (the "↓ Tap each type to see the protocol" hint that had no corresponding interactive behavior, per `docs/course-audit/modules/README.md`'s Module 5 entry). Recorded here as a confirmed factual finding for Module 8, not evaluated for correction.
- **Progress write / persistence / gates completion:** not applicable — no interactive state exists to write, persist, or gate on.
- **Keyboard/accessibility wiring visible in the code:** not applicable — there is no interactive target for a keyboard user to reach in the first place.

### Format toggle (`selectFormat`)

- **What the student sees:** two side-by-side cards ("1-Hour" / "2-Hour"), each listing 4 bullet differences; the 2-Hour card is visually "selected" (highlighted, filled background) by default on every module open.
- **What the student must do:** click/tap either card to mark it selected.
- **Judgment vs. decorative:** a simple selection toggle — the student chooses which format's card is visually highlighted; no explanation, comparison output, or consequence is attached to the choice beyond the highlight state itself. The `.grid-2col` copy above the cards includes a "↓ Tap to compare" hint; the toggle does not produce any side-by-side comparison beyond what is already statically printed on both cards — clicking only changes which card is highlighted, it does not filter, expand, or reveal additional content.
- **Correct/expected behavior encoded in the implementation:** `selectFormat(fmt)` toggles the `.selected` class on `#fmt1hr` and `#fmt2hr` based on which format number (`1` or `2`) was clicked — exactly one card can be selected at a time; clicking the already-selected card has no additional effect (it simply re-applies the same state).
- **Feedback copy:** none beyond the visual highlight change (background/text-color shift via `.format-card.selected` CSS) — no explanatory text appears or changes when a format is selected.
- **Retry/reset behavior:** unlimited — either card can be reselected freely, any number of times; resets to the 2-Hour default on every module reopen (a fresh copy of `#module8Wrap`'s innerHTML is injected on every `STATIC_MODULES[8]` call).
- **Progress write:** none — `selectFormat` contains no reference to `APP_STATE`.
- **Persistence:** none — selection state is not stored.
- **Gates completion:** no.
- **Keyboard/accessibility wiring visible in the code:** **none.** `.format-card` is a plain `<div onclick="...">` with no `tabindex`, `role="button"`, `aria-pressed`, or `aria-selected` — confirmed by a direct grep of the full `#module8Wrap` markup for `tabindex`, `role=`, and `aria-`: zero matches anywhere in the block, including inside the checkpoints (see §10).
- **Color-only meaning check:** the selected state is communicated by a background-color/text-color shift only (`.format-card.selected` changes `background` and, via child-selector rules, the label/hint/bullet text colors) — no text label, icon, or glyph change accompanies the selection. This is a color-only-meaning gap not present in Module 7's comparable toggles (which used both text and non-color cues).

### Service-step accordion (`toggleServiceStep`) + embedded video triggers (`loadStepVideo`)

- **What the student sees:** 12 step rows (`#sms-0`–`#sms-11`), each showing a step number/range, title, per-format timing badges, and a `+`/`−` arrow.
- **What the student must do:** click/tap a step row to expand it and reveal its "What you do" / "Micro-teach" / (optional) "Note" copy plus its embedded video slot (see §5) beneath.
- **Judgment vs. decorative:** a reveal/reference interaction — organizes 17 numbered steps into 12 browsable cards rather than requiring the student to observe, decide, or sequence anything; comparable in kind to Module 7's tool-category accordion (`toggleToolCat`, per `module-07-source.md` §6).
- **Correct/expected behavior encoded in the implementation:** `toggleServiceStep(idx)` closes every open `.sms-body`/`.sm-step` first (resetting every arrow to `+`), then — if the clicked step was not already open — opens only the clicked step and its body, and swaps its arrow to `−`. Only one step can be expanded at a time; clicking an already-open step closes it (arrow reverts to `+`). This is the identical one-open-at-a-time pattern already used by Module 7's `toggleToolCat`.
- **Feedback copy:** none beyond the revealed content itself — no correct/incorrect framing, since this is a reference/informational interaction, not a judgment interaction.
- **Retry/reset behavior:** unlimited — any step can be reopened/closed freely, in any order, any number of times.
- **Progress write:** none — `toggleServiceStep` contains no reference to `APP_STATE`.
- **Persistence:** none — expanded/collapsed state, and any loaded/clicked video state, is not stored; reopening the module always starts with all 12 steps collapsed and all 12 video thumbnails reset to their unclicked state (a fresh copy of `#module8Wrap`'s innerHTML is injected on every open, discarding any in-session DOM changes `loadStepVideo` made).
- **Gates completion:** no — `MODULE_CHECKPOINTS['8']` lists only `m8cp1` and `m8cp2`; the step accordion and its embedded video triggers are not referenced anywhere in the completion path (confirmed in §5's "Playback-linked behavior" finding).
- **Keyboard/accessibility wiring visible in the code:** **none.** `.sm-step` (the clickable step-row wrapper) and `.sms-video-thumb` (the clickable video trigger) are both plain `<div onclick="...">` elements with no `tabindex`, `role="button"`, or `aria-expanded` — same gap category as the concept-grid and format-toggle elements above, and as three of Module 6's and both of Module 7's ungraded interactions.
- **Touch implications:** step rows use generous padding (`0.9rem 1.1rem` on `.sms-head`) that appears touch-friendly on visual inspection of the CSS; not measured against a specific minimum (e.g. 44×44px).

### Section 8.3 info-cards and key-point callout

Confirmed **static, non-interactive** — the four info-cards (Flow control, Pressure consistency, Temperature control, Transitions) and the "pressure test" key-point callout have no `onclick`, no JavaScript function reference, and no interactive CSS. Recorded here only to confirm they were checked and found non-interactive, not omitted.

### Checkpoints `m8cp1` and `m8cp2`

These are the only elements in Module 8 that write progress or gate completion. Full detail in §8. Summary here for completeness:

- **What the student sees:** an open-response prompt, a growable textarea, a voice-input button, a submit button, and a feedback region — identical structural pattern to every other module's checkpoints, including Module 7's (`module-07-source.md` §6).
- **What the student must do:** type or speak a free-text answer and submit it for AI evaluation.
- **Progress write:** yes — `APP_STATE.setCheckpointResult(8, cpId, {...})` on every submission; `captureCheckpointMemory(8, cpId)` on pass.
- **Gates completion:** yes — both `m8cp1` and `m8cp2` must be `passed` for `isModuleComplete(8)` to return true (no read-percentage minimum).
- **Accessibility:** see §10 — confirmed missing `aria-label` on both voice buttons and both submit buttons, and missing `aria-live` on both `.cp-response` feedback regions.
- **Structural note:** unlike Module 7's checkpoint boxes, which each carry `id="m7cp1"`/`id="m7cp2"` directly on the outer `.cp-box` wrapper, Module 8's two `.cp-box` wrappers carry **no `id` attribute at all** — only the inner `In`/`Btn`/`Res`-suffixed elements are individually `id`-tagged. A targeted search for `id="m8cp1"` or `#m8cp1` (as a CSS or JS selector, not the `In`/`Btn`/`Res` suffixed forms) found zero references anywhere in the file — the shared checkpoint-restoration pipeline (`restoreLessonState`, `applyCheckpointInputState`, `ensureCheckpointStatusElement`, all documented in §12) operates entirely off the `In`/`Btn`/`Res`/`Status`-suffixed child IDs, not the box wrapper's own ID, so this appears to be a naming-convention difference from Module 7 with no confirmed functional effect — recorded factually, not flagged as broken.

---

## 8. Current checkpoints

### `m8cp1`

- **Displayed question** (`.body-text` immediately preceding the `.cp-box`, Section 8.4, `headspa-mastery.html:6257`):
  > "Pick any two steps from the service map above. Write the micro-teach you would deliver at each one — in your own voice, to a real client who has never had a head spa before. Don't copy the examples. Make it yours."
- **Question sent to the evaluator** (`M8.questions.m8cp1`, `headspa-mastery.html:7542`):
  > "Pick any two steps from the 17-step service map. Write the micro-teach you would deliver at each one — in your own voice, to a real client who has never had a head spa before."
- **Byte-identical?** **No — confirmed mismatch, and a larger-magnitude instance of the defect class already found (and, for Modules 1–4 and 7, corrected) in Modules 5–7.** The evaluated string specifies "the **17-step** service map" where the displayed string says only "the service map above"; more significantly, the displayed string's final two sentences ("Don't copy the examples. Make it yours.") are **entirely absent** from the evaluated string — the evaluator is never told about this instruction at all, meaning a student's compliance or non-compliance with "don't copy the examples" cannot factor into how `M8.system` grades the answer, since the rubric text doesn't reference it either (see below).

### `m8cp2`

- **Displayed question** (`.body-text` immediately preceding the `.cp-box`, Section 8.5, `headspa-mastery.html:6272`):
  > "You're in Step 5 — the scalp massage, about twelve minutes in. Your client opens her eyes and asks: 'What exactly is the difference between this and a regular shampoo at the salon?' She's not being critical — she's genuinely curious. What do you say, without breaking the experience?"
- **Question sent to the evaluator** (`M8.questions.m8cp2`, `headspa-mastery.html:7543`):
  > "You are in Step 5 — the scalp massage, about twelve minutes in. Your client opens her eyes and asks: 'What exactly is the difference between this and a regular shampoo at the salon?' She is not being critical. What do you say?"
- **Byte-identical?** **No — confirmed mismatch.** Contractions are expanded ("You're" → "You are"; "She's" → "She is," the same pattern already found in Module 7's `m7cp2`), and two additional clauses present in the displayed version — "she's genuinely curious" and "without breaking the experience" — are dropped entirely from the evaluated version, changing what the evaluated question actually asks the model to grade against.

### Evaluator system / rubric

Module 8 uses **one shared function for both checkpoints** — `M8.system(q)` — not checkpoint-specific rubrics, matching the pre-correction pattern already documented for Modules 5, 6, and (before its own audit) 7:

> "You are Cadence, instructor of HeadSpa Mastery. Module 8 (The Head Spa Service) checkpoint. Question: '\{q\}'. Key concepts: 17 steps, two formats (1hr streamlined, 2hr with extended massage + steam + hand massage). Micro-teach while doing — naming what you are doing and why — is what elevates client perception. Good micro-teach is specific, calm, and does not over-explain. Response to the 'shampoo' question: cover circulation, scalp focus, water immersion, exfoliation, intentional product selection — without sounding clinical. Stay in the service experience. 3-5 sentences, warm and direct."

This is passed into the shared `submitCheckpoint()`/`evaluateCheckpointAnswer()` pipeline, which appends `CADENCE_RESPONSE_CONSISTENCY_ANCHOR`, `CADENCE_SELECTIVE_MEMORY_INSTRUCTION`, `APP_STATE.getCadenceMemoryContext(8,'checkpoint')`, `CADENCE_CHECKPOINT_TONE`, `CADENCE_FEEDBACK_MICRO_RULES`, and `CHECKPOINT_EVAL_FORMAT` before the call — shared code, identical to every other module, not modified for this extraction.

- **Required concepts (as written into the shared rubric, not itemized per checkpoint):** the 17-step/2-format structure; that micro-teach (naming what you're doing and why) elevates client perception; that good micro-teach is specific, calm, and not over-explained; and, specifically for the "shampoo question" (`m8cp2`), that a strong answer covers circulation, scalp focus, water immersion, exfoliation, and intentional product selection without sounding clinical.
- **Checkpoint-specific vs. shared grading behavior:** **fully shared** — `m8cp1` (a micro-teach-writing exercise) and `m8cp2` (a live client-question response) are evaluated against the exact same generic rubric text, with no checkpoint-specific required elements, immediate-correction triggers, or revision-focus guidance — the same uncorrected state already documented for Modules 5, 6, and pre-audit Module 7. Note also: the rubric's "17 steps" language does not itemize the 7-phase framework taught immediately before Section 8.1, so a student's answer could fully satisfy the rubric without ever engaging the phase concept the module opens with.
- **Completion dependency:** both `m8cp1` and `m8cp2` must reach `status: 'passed'` for `_checkModuleComplete(8)`/`isModuleComplete(8)` to return true. No read-percentage minimum. `m8cp1` does not lock Section 8.5 or the rest of the lesson — same non-locking behavior as every other module's midpoint checkpoint.
- **Voice-button behavior:** `startVoice('m8cp1In', this)` / `startVoice('m8cp2In', this)` — the shared voice-input function used by every checkpoint in the file; not module-8-specific.
- **Enter/Shift+Enter behavior:** `m8cpKey(e, id)` — Enter without Shift submits (`submitM8CP(id)`); Shift+Enter is not intercepted, so the textarea's default newline behavior applies. Matches every other module's `cpKey`-style handler.
- **Loading state:** shared `submitCheckpoint()` pipeline — disables the textarea and button, then renders an animated three-dot "thinking" indicator (`.cp-thinking`) into the response region while the evaluator call is in flight. Not module-8-specific.
- **Feedback and live-region behavior:** feedback is rendered into `#m8cp1Res`/`#m8cp2Res` via the shared `submitCheckpoint()` pipeline. **Neither `.cp-response` element carries `aria-live="polite"`** — confirmed absent by direct inspection of `headspa-mastery.html:6265, 6280` — same gap already confirmed for Modules 5–7.
- **Network-failure text:** `submitM8CP(id)` calls `submitCheckpoint(8, id, M8.system, M8.questions[id])` — **four arguments, no 5th `errorMessage` argument.** As with Modules 5–6 and pre-audit Module 7, Module 8 has no module-specific network-failure text; a failed evaluator call falls back to the shared generic text used across every not-yet-corrected module.
- **Saved progress behavior:** identical to every other module — `APP_STATE.setCheckpointResult(8, cpId, {passed, feedback, answer})` on every submission (pass or fail); `captureCheckpointMemory(8, cpId)` only on pass (see §9 for the resulting memory tags); `restoreLessonState(8)` re-applies the stored `passed`/`retry` status, disables the input/button appropriately, and re-renders the stored feedback (or a generic previously-completed string if no feedback text was stored) when the student reopens the module.
- **Review Mode behavior:** Module 8's checkpoints route through the same `submitCheckpoint()` → `submitCheckpointReviewMode()` branch as every other module when `window.ReviewMode.isActive()` is true — test submissions reuse the real question and `M8.system` rubric, are labeled "Review Mode test — not saved," and never call `setCheckpointResult`/`captureCheckpointMemory`/`_checkModuleComplete`. Nothing module-8-specific overrides this.

---

## 9. Current Cadence behavior

- **Module 8 checkpoint identity:** `M8.system` — see §8 for the full string. Refers to itself as "Cadence, instructor of HeadSpa Mastery."
- **Guide system** (`MODULE_GUIDE_SYSTEMS[8]`, `headspa-mastery.html:7579`):
  > "You are Cadence — a mentor built from nearly two decades in the head spa industry. The student is in Module 8 (The Head Spa Service): 17 steps, two formats, micro-teach while doing. If the student has an existing service background, acknowledge that some steps will feel familiar but the intentionality behind each one is specific to the head spa experience. The closing script with one personal scalp observation drives rebooking. 3-5 sentences. No bullet points."
- **Quick prompts** (`MODULE_QUICK_PROMPTS[8]`, `headspa-mastery.html:7594`):
  1. "What makes the micro-teach effective?"
  2. "How do I handle a question mid-service?"
  3. "What is the most important step?"
- **Module-opening greeting** (`greetings[8]` inside `openModuleById()`, `headspa-mastery.html:7833`):
  > "This is the full picture — every step in sequence. If you have questions about timing or technique for any specific step, I am right here."
- **Memory tags:** `MODULE_MEMORY_TAGS[8] = ['client-explanation', 'service-flow', 'client-guidance']` (`assets/js/headspa-state.js:140`) — three tags. `getCheckpointMemoryTags(8, answer)` (`assets/js/headspa-state.js:335–338`) derives, from the student's own passed-checkpoint answer text: `client-explanation` if the answer matches `/\b(micro-teach|explain|say|client)\b/i`; `service-flow` if it matches `/\b(step|sequence|massage|shampoo|service)\b/i`; `client-guidance` if it matches `/\b(calm|specific|without over-explain|guide)\b/i`. Module 8 is one of two modules (with Module 10) explicitly excluded from the file-wide fallback that otherwise adds `client-guidance` to any answer containing the word "client" (`assets/js/headspa-state.js:349`) — instead, Module 8 has its own dedicated `client-guidance` regex branch. All three declared tags have a corresponding, reachable regex condition — no unreachable-tag defect found for Module 8 (the same clean state already confirmed for Module 7, contrasting with Module 6's pre-correction unreachable `scope-awareness` tag).
- **References to the old course name:** **yes, confirmed.** `M8.system` opens with "You are Cadence, instructor of **HeadSpa Mastery**" — identical wording to Modules 6's and 9's current (uncorrected) system strings.
- **Any claim that Cadence has personal human experience:** **yes, confirmed.** `MODULE_GUIDE_SYSTEMS[8]` opens "You are Cadence — **a mentor built from nearly two decades in the head spa industry**" — the same template sentence already found (uncorrected, prior to their own audits) in `MODULE_GUIDE_SYSTEMS[5]`, `[6]`, `[9]`, and `[10]`. **Unlike Module 7**, no comparable first-person personal-history claim was found anywhere in Module 8's **visible, student-facing curriculum body** — Module 8's copy contains no "From Cadence" note of any kind (Section 8.2's "Micro-teach" lines are written as scripted things the *student* would say to *their own* client, not as Cadence speaking in first person about her own past). The personal-experience-claim issue for Module 8 is therefore confined to the two hidden system-prompt strings (`M8.system` and `MODULE_GUIDE_SYSTEMS[8]`), not to any visible lesson text.
- **Any content inconsistency between the curriculum and Cadence guidance:** none of the kind found in Modules 5/6 (no claim in Module 8's Cadence prompts contradicts an already-corrected earlier module's approved spec) was identified in this extraction pass.
- **Duplicated or conflicting prompt sources:** none found for Module 8 specifically — one `MODULE_QUICK_PROMPTS[8]` array, no hardcoded duplicate set found in the static HTML.

---

## 10. Current completion and gating

- **Exact completion requirement:** `m8cp1` and `m8cp2` both graded `passed` (`MODULE_CHECKPOINTS['8'] = ['m8cp1','m8cp2']`; shared `_hasAllRequiredCheckpoints(8)` requires every listed ID to have `status === 'passed'`). No read-percentage/`maxReadPercent` minimum is checked anywhere in the completion path. The concept grid, format toggle, and service-step/video accordion have no bearing on completion — a student could pass both checkpoints without ever expanding a single step card or clicking a single video thumbnail.
- **Completion-card copy:** see §3/§8 for section context (`#m8Complete`). Title: "Module complete." Sub: "You know the map. Now the system that lets you run it back-to-back, every client, every day — without dropping quality." Next-module label: "Up next — Module 9," with next-module preview text ("Sanitation and reset systems. The work between every service that separates consistent professionals from inconsistent ones.") and a "Start Module 9 →" primary button plus a "Back to course" secondary button.
- **Competency language:** the completion card names a general capability in its one `.lc-body` sentence; like Modules 5–7's cards, Module 8 has no separate itemized competency-naming line.
- **Module 9 unlock behavior:** the completion card's primary button calls `openModuleById(9)` directly; independently, `APP_STATE.canAccessModule(9)` (home-screen module list and any direct navigation) requires `isModuleComplete(8)`, which in turn requires both checkpoints passed — the two unlock paths are consistent with each other.
- **Persistence behavior:** identical to every other module — `APP_STATE.save()` is the sole write choke point; `checkpointMeta`, `checkpoints[]`, `complete`, and `completedAt` are stored per-module in `localStorage['levo_app']` (or skipped entirely while Course Review Mode is active).
- **Review Mode behavior:** no module-8-specific override — same shared behavior documented in §8.
- **Mismatch between visible completion and stored state:** none found in the checkpoint-restoration path itself. `restoreLessonState(8)` reconciles `#m8cp1Res`/`#m8cp2Res` display, input/button disabled state, and the status pill against the stored `checkpointMeta` on every module open, using the same shared logic every other module uses.
- **Video/interaction completion mismatch, factual (not evaluated for correction):** the completion card's "You know the map" phrasing is displayed unconditionally upon both checkpoints passing, regardless of whether the student ever expanded any of the 12 step cards or engaged with any of the 12 (currently non-functional) video slots — a structurally similar observation to Module 7's completion-card wording finding (`module-07-source.md` §9, resolved during that module's audit).

---

## 11. Current accessibility state

Only what can be confirmed from the source is reported below; nothing here was verified in a real browser, screen reader, or physical touch device as part of this extraction (see §19-equivalent note at the end of this document).

- **Headings:** Module 8 uses the same non-semantic heading pattern as every other module in the file — section titles are styled `<div>`s (`.sec-eyebrow`, `.sec-title`), not real `<h1>`–`<h6>` elements. File-wide pattern, not specific to Module 8.
- **Semantic controls:** the two checkpoint submit buttons and two voice buttons are real `<button>` elements (good). **The concept-grid cards, the format-toggle cards, the service-step accordion rows, and the video thumbnail triggers are all plain `<div onclick="...">` elements (or, for the concept cards, plain `<div>` with no handler at all) with zero keyboard/screen-reader semantics** — no `tabindex`, `role="button"`, `aria-expanded`, `aria-pressed`, or `aria-selected` anywhere in the `#module8Wrap` block outside the two checkpoints. Confirmed by a direct grep of the full block for `tabindex`, `role=`, and `aria-`: zero matches. The Section 8.3 info-cards and key-point callout are correctly non-interactive `<div>`s with no `onclick` — not an accessibility gap, since nothing there is meant to be actionable.
- **Keyboard access:** the checkpoint textareas/voice buttons/submit buttons inherit the same keyboard behavior as every other module's checkpoints (native `<button>`/`<textarea>` semantics). **The format toggle, the service-step accordion, and every one of the 12 video-load triggers have no keyboard access at all** — a keyboard-only or switch-device user cannot select a format, expand a step card, or attempt to load a video, since `onclick` handlers on non-interactive `<div>` elements do not receive keyboard focus or respond to Enter/Space by default. This is the same category of gap already confirmed for Module 7's tool-category accordion and prep checklist (`module-07-source.md` §10), now additionally confirmed across three separate Module 8 interaction types plus all 12 video triggers.
- **Focus visibility:** not evaluated separately from file-wide `.checkpoint`/`.cp-btn`/`.voice-btn` focus styles; the non-native-control interactions have no focus state to evaluate, since they cannot receive keyboard focus in the first place.
- **Labels and accessible names:** **confirmed gaps**, matching Modules 5–7's current state. `m8cp1In`/`m8cp2In`'s voice buttons carry only `title="Speak your answer"` — no `aria-label`. `m8cp1Btn`/`m8cp2Btn` carry no `aria-label` at all. None of the concept-grid cards, format-toggle cards, step-accordion rows, or video-thumbnail triggers carry any accessible name beyond their own visible text content (which, since they are non-interactive-by-semantics `<div>`s, is not exposed to assistive technology as an actionable control name at all for the toggle/accordion/video elements).
- **Live regions:** **confirmed gap.** `#m8cp1Res` and `#m8cp2Res` (`headspa-mastery.html:6265, 6280`) carry no `aria-live` attribute — same gap as Modules 5–7's current state.
- **Video titles/labels:** as documented in §5, the dynamically created `<iframe>` in `loadStepVideo` receives no `title` attribute — a screen-reader user encountering a loaded video iframe (in a future state where a real Vimeo ID is present) would have no accessible name identifying which service step's video it is, beyond whatever title metadata Vimeo itself embeds in the player chrome (external to this repository).
- **Captions/tracks:** none exist in the current markup (§5) — any future captioning depends entirely on Vimeo-side configuration once a real video is uploaded, not on anything in this repository's code.
- **Transcript availability:** none exist or are referenced anywhere in Module 8 (§5, §6).
- **Color-only meaning:** the format toggle's selected/unselected state (§7) is communicated by a background/text-color shift **only** — no text label, icon, or glyph accompanies the change, a confirmed color-only-meaning gap. The service-step accordion's open/closed state uses both an arrow-character change (`+`/`−`) and a body-visibility change — not color alone. The concept grid has no interactive state to evaluate. The per-format timing badges (`.t-badge`/`.t-badge.t-2hr`) are distinguished by their own text content (the timing value itself, e.g. "1hr: ~5 min" vs. "2hr: ~5 min") in addition to any badge styling — not color alone, based on the markup (badge CSS itself was not separately inspected for color-contrast values as part of this extraction).
- **Reduced motion:** `.sms-body` (the service-step accordion's expand/collapse content) uses a CSS `animation: slideDown 0.2s ease` declaration (`headspa-mastery.html:1608`) with **no corresponding `@media (prefers-reduced-motion: reduce)` override** — confirmed by a targeted search of every `prefers-reduced-motion` block in the stylesheet; none targets `.sms-body`, `.sms-video`, `.format-card`, or `.concept-card`. This is a more direct gap than the lower-severity CSS-`transition`-only gaps already flagged for Module 7's `.tc-body`/`.prep-item` (which used `transition`, not a multi-keyframe `animation`) — `.sms-body`'s `slideDown` is the same `@keyframes` animation already flagged (and, in that case, guarded) for Module 2's `.tl-detail` and Module 6's `.vs-detail`/`.fc-detail`, but here it is **not** guarded.
- **Image enlargement:** N/A — there are no real images to enlarge (§6).
- **Touch targets:** not manually measured against a specific minimum. `.sms-head` (0.9rem 1.1rem padding), `.format-card` (0.9rem 0.75rem padding), and `.sms-video-thumb` (a full 16:9-ratio clickable area) all appear touch-friendly on visual inspection of the CSS, matching the same unmeasured-but-generous pattern already noted for Modules 6–7's interactive `<div>`s.
- **Responsive layout / horizontal overflow:** not verified in a real or simulated viewport as part of this extraction. `.concept-grid` and `.grid-2col` both collapse from a 2-column to a 1-column layout under the existing `@media (max-width:600px)` rule (`headspa-mastery.html:340, 342`) — the same responsive pattern already used elsewhere in the file. `.service-map` is already a single-column `flex-direction:column` layout with no grid to collapse. No dedicated mobile override was found specifically targeting `.sms-video`, `.sms-video-thumb`, or `.format-card` beyond the shared `.grid-2col` collapse — the video slots' own 16:9 `aspect-ratio` sizing is inherently responsive without needing one.
- **Hard-coded line break:** the hero title contains a literal `<br>` after "This is not about" (`headspa-mastery.html:5924`) — matching the same fixed-line-break pattern already found (and not yet corrected) in Module 7's hero (`module-07-source.md` §11). No mobile-specific override was found for `.mh-title`/`.mh-eyebrow` (targeted grep for `.mh-title`/`.mh-eyebrow` combined with `@media`/`max-width` returned no matches, file-wide).
- **No hidden instructional content is inaccessible in a way distinct from the interactions above:** every step's "What you do" and "Micro-teach" text is present in the DOM as soon as its card is expanded (not lazily loaded or fetched); the accordion's only accessibility problem is reaching the expand control itself via keyboard, not the content once revealed.

---

## 12. Existing claims requiring later audit

Without correcting them, the following potentially sensitive or absolute claims are inventoried as audit targets only — no truth/correctness determination is made here.

1. **Physiological/circulation/lymphatic claim (Step 5 micro-teach, §4):** "The massage is doing several things at once — stimulating circulation to the follicles, moving lymph, and activating your parasympathetic nervous system. That's the shift you feel when you start to really relax." — a specific physiological mechanism (follicular circulation, lymphatic movement, autonomic nervous system activation) is stated as the direct, certain cause of the client's relaxation response, delivered as scripted language the student is meant to say to a real client.
2. **Business-outcome/rebooking causation claim (Step 16–17 "Note," §4; repeated near-identically in `MODULE_GUIDE_SYSTEMS[8]`, §9):** "One specific, personalized observation at close drives rebooking more than any other single moment in the service" / "The closing script with one personal scalp observation drives rebooking." — an unqualified causal claim about what most drives a specific business outcome (rebooking), stated as settled fact in both the visible curriculum and the hidden Cadence guide prompt, with no cited basis.
3. **Temperature-contrast/circulation claim (Steps 13–15 micro-teach, §4):** "This is a temperature contrast — the coolness after warm water closes the cuticle and gives the scalp a final circulatory boost." — a specific physiological mechanism (cuticle closure, "circulatory boost") attributed to a temperature-contrast technique, again delivered as client-facing scripted language.
4. **Steam/product-penetration claim (Step 11 micro-teach, §4):** "The steam opens the cuticle and drives the treatment deeper than it would penetrate at room temperature." — a specific mechanism-of-action claim about steam and product penetration.
5. **Nerve-density claim (Step 12 micro-teach, §4):** "there are more nerve endings in your hands per square inch than almost anywhere else" — an anatomical density comparison stated as fact, delivered as client-facing scripted language.
6. **Universal timing/pressure absolutes (Section 8.3, §3):** "You do not guess temperature. You confirm it. Every time," and "Good pressure is predictable, even, and stable. Bad pressure is random, uneven, and disconnected" — both phrased as unconditional rules rather than qualified guidance; not evaluated here for whether an exception exists.
7. **"Non-negotiable" safety framing (Step 3 note, §4; echoed in Section 8.3's "Temperature control" card):** "Temperature check is non-negotiable. Equipment fails. Your hand is the safeguard." — an absolute safety claim; factually recorded as appearing twice in near-identical wording across two different parts of the module.
8. **Universal technique-transfer claim (`MODULE_GUIDE_SYSTEMS[8]`, §9):** "the intentionality behind each one is specific to the head spa experience" — a general claim that the module's step intentionality is unique to head spa service, offered to reassure students with a prior service background; not evaluated here for accuracy.
9. **"Highest skill" and "most overlooked" superlative claims (concept-grid phase 3 definition, §4 footnote content, and Section 8.3's "Pressure consistency" card):** "Your highest skill" (applied to treatment-work massage) and "the most overlooked technical skill in the service" (applied to pressure consistency) — both unqualified superlative claims about which skill matters most, not evaluated here for consistency with each other or with claims made in other modules.

No diagnosis, prescriptive medical claim, contraindication, or anatomy/physiology claim beyond the circulation/lymphatic/nervous-system language in items 1 and 3 above was identified in Module 8's current curriculum.

---

## 13. Protected video-player inventory / deferred media installation

- Module 8 is the full head spa service — the module where all 17 client-facing service steps are taught in sequence.
- The owner already has the final instructional service-step videos for this module.
- The videos are intended to be the signature instructional experience of this module — per the owner's own framing, the "star of the show."
- The 12 existing video-player locations documented in full in §5 are intentional curriculum infrastructure, not dead or decorative code — confirmed by the authored code comment directly above `STEP_VIDEO_IDS` instructing a future maintainer to "Replace each null with a Vimeo video ID."
- **Video-player removal is prohibited during audit and initial implementation.** None of the 12 `.sms-video`/`.sms-video-thumb`/`.sms-video-wrap` elements, their IDs, their `STEP_VIDEO_IDS` array entries, or their `loadStepVideo` wiring may be removed, consolidated, hidden, or replaced with static imagery during the external audit or during Module 8's initial (non-video) implementation pass.
- **The later external audit must reconsider how prominently and effectively the video sequence is presented** — see the owner-priority note at the top of this document for the full list of areas the audit should examine (player hierarchy, scale, chapter/step identity, numbering, sequence navigation, heading-to-video relationship, poster/thumbnail system, pre/post-video cues, player consistency, transitions, progress awareness, desktop/phone presentation, captions/transcripts, playback controls, surrounding text density, and the balance between demonstration and written reasoning).
- **Actual instructional-media installation is intentionally deferred** — no video file, Vimeo ID, or other real media was installed, requested, or referenced as part of this extraction.
- **All approved non-video implementation work should be completed first** — curriculum corrections, checkpoint fixes, accessibility wiring, Cadence corrections, and any approved interaction changes belong to Module 8's implementation phase and do not depend on the videos being installed.
- **Player shells/slots must remain available through that work** — the 12 slots, their IDs, and their current click-to-reveal behavior should continue to exist and function (showing "Video coming soon" where no ID is set) throughout implementation, static/mocked validation, and any interim manual review, exactly as Module 7's placeholder photo slots remained present and labeled through that module's own partial-implementation phase.
- **Wiring the real service videos will be the FINAL major Module 8 implementation sub-step** — after the approved specification's other implementation work is complete, installing the 12 real Vimeo IDs (or whatever final video-delivery mechanism the audit approves) is the last major piece of work before Module 8 can be considered feature-complete.
- **Static/mocked validation must then run with the real videos installed** — the existing static/mocked-validation pattern used for every prior module (in-browser checks, zero-console-error confirmation, structural/tag-balance checks) must be re-run once the real videos are wired in, not only before.
- **Manual QA must occur with the real videos installed** — per the governing manual-approval rule (`00-aimt-course-audit-master-instructions.md`), a module is not approved merely because static/mocked validation passed; the owner's manual QA review must include the actual installed service videos, not the "Video coming soon" placeholder state.
- **Module 8 cannot receive owner manual approval while required service videos are absent** — this is recorded explicitly so a future implementation task cannot mark Module 8 "Implemented — manual QA approved" while any of the 12 video slots remain unwired.

---

## 14. Known future student tool — AIMT Service Timer

- An owner-created interactive **Head Spa Service Timer** already exists **outside** the current Module 8 production implementation — it is not part of `headspa-mastery.html`, `assets/js/headspa-state.js`, or any other file in this repository at extraction time. A repository-wide search for any file or reference matching "timer" confirms the only timer-related code currently in production is Module 9's unrelated `startResetTimer()`/`_resetTimerInterval` reset-walkthrough sequence (`headspa-mastery.html:6380, 8658–8680`) — a different, already-implemented Module 9 feature, not the owner's external Service Timer tool. No path is invented for the Service Timer here, per instruction.
- It is intended as a meaningful companion to the full-service curriculum this module teaches (the 17-step, two-format service sequence documented in §4).
- It will receive a separate, dedicated audit — not part of this Module 8 source extraction or any future Module 8 external audit.
- Its current timing, copy, step structure, UX, branding, safety language, and technical implementation are **not** approved authority for anything in this document or in any future Module 8 specification.
- The likely eventual delivery architecture is a hosted interactive tool on the AIMT site, accessed by students from their dashboard — not a conventional downloadable file (PDF or otherwise).
- The Module 8 external audit should determine how and where the finished tool is eventually introduced to students (placement, linking language, and presentation) — none of that is decided here.
- **No timer implementation, integration, audit, or modification is authorized by this extraction task**, and none was performed.

---

## Summary of confirmed findings (for the external audit's reference — not corrections)

1. `m8cp1`'s displayed and evaluated question strings are **not** byte-identical — the evaluated string omits two full sentences present in the displayed string ("Don't copy the examples. Make it yours.") and changes "the service map above" to "the 17-step service map" (§8).
2. `m8cp2`'s displayed and evaluated question strings are **not** byte-identical — contractions are expanded and two clauses ("she's genuinely curious," "without breaking the experience") are dropped from the evaluated version (§8).
3. `M8.system` is one shared function used for both checkpoints — Module 8 has not moved to the per-checkpoint `MN.systems.mNcpX` structure Modules 1–4 and (post-audit) Module 7 use (§8).
4. `submitM8CP` does not pass a 5th `errorMessage` argument to `submitCheckpoint()`, so Module 8 has no module-specific network-error text (§8).
5. Both checkpoint voice buttons lack `aria-label`; both submit buttons lack `aria-label`; both `.cp-response` feedback regions lack `aria-live` (§11).
6. `M8.system` still says "instructor of **HeadSpa Mastery**" (old course name); `MODULE_GUIDE_SYSTEMS[8]` still frames Cadence as personally "a mentor built from nearly two decades in the head spa industry" — the same pattern already found (uncorrected) in Modules 5, 6, 9, and 10 (§9).
7. The 7-phase concept grid's "↓ Tap each phase to understand its purpose" hint has **no corresponding interactive behavior anywhere in the code** — every phase's content is already permanently visible; this is a dead interaction hint, the same defect class already corrected in Module 5 (§7).
8. The format toggle, the service-step accordion, and all 12 video-thumbnail triggers are plain `<div onclick>` elements with zero keyboard/ARIA semantics — no `tabindex`, `role`, or `aria-*` attributes anywhere in `#module8Wrap` outside the two checkpoints (§7, §11).
9. The format toggle's selected/unselected state is communicated by color alone, with no accompanying text or icon change (§7, §11).
10. `.sms-body`'s expand/collapse `slideDown` animation has no `prefers-reduced-motion` guard, unlike the comparable `.tl-detail`/`.vs-detail`/`.fc-detail` animations elsewhere in the file, which are guarded (§11).
11. All 12 dynamically created video `<iframe>` elements would receive no `title` attribute under the current `loadStepVideo` implementation (§5, §11).
12. All 12 `STEP_VIDEO_IDS` entries are `null` — confirmed intentional, documented placeholder infrastructure awaiting real Vimeo IDs, not a defect (§5).
13. Module 8's two `.cp-box` checkpoint wrappers carry no `id="m8cp1"`/`id="m8cp2"` attribute (unlike Module 7's, which do) — confirmed to have no found functional dependency anywhere in the file; recorded as a structural naming difference only (§7).
14. The hero title contains a hard-coded `<br>` line break with no mobile-specific override found, the same pattern already found (and not yet corrected) in Module 7's hero (§11).
15. Several physiological, business-outcome, and superlative claims are stated as unqualified fact in visible curriculum and/or hidden Cadence prompts — see the full list in §12.
16. Module 8 introduces a structural pattern not seen in Modules 0–7: one full unnumbered instructional section (the 7-phase concept grid) between the hero and the first numbered section (§3).
17. An unused CSS class, `.sms-video-placeholder`, exists in the stylesheet but is never referenced by any current markup — likely dead CSS from an earlier iteration of the video-placeholder pattern (§5).
18. No claim is made, and none should be inferred, that any real Module 8 image, video, or downloadable asset currently exists in the repository — none do (§6).

### Assumptions or external-review questions (not verified here; require further work)

- **Live-model testing:** how the current shared `M8.system` rubric actually grades real student answers — not evaluated here (no live API call was made as part of this documentation-only extraction).
- **Screen-reader testing:** VoiceOver/NVDA behavior around the confirmed missing `aria-label`/`aria-live`/keyboard-access gaps (§11) was not tested with an actual screen reader — the gaps are confirmed from source, not from an assistive-technology session.
- **Physical-keyboard testing:** the checkpoint textareas/buttons should be keyboard-operable per native semantics; the concept grid, format toggle, service-step accordion, and video triggers are confirmed from source to have no keyboard path at all (not merely "unverified" — this is a source-confirmed gap), but the exact real-world behavior was not physically tested.
- **Real touch-device testing:** not performed; no touch-target sizing was measured.
- **Visual manual QA:** rendering of the concept grid, format toggle, service-step accordion, and video thumbnails at desktop and mobile widths was not visually confirmed in a browser as part of this extraction.
- **Video-content and production requirements:** exactly how the owner's existing service-step videos map onto the 12 current slots (whether the grouping of steps 08–10, 13–15, and 16–17 into single video slots matches how the owner's actual footage is organized) was not determined here — deferred to the external audit per instruction.
- **Claims verification:** none of the physiological, business-outcome, or superlative claims inventoried in §12 were evaluated for accuracy, evidence basis, or safety — flagged for the external audit, not resolved here.
