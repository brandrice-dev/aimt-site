# Module 8 — Approved Audit Specification

**Course:** AIMT Head Spa Certification Course
**Module:** 8
**Approved module title:** The Head Spa Service (kept — see "Approved module identity")
**Source reviewed:** `module-08-source.md`
**Audit date:** August 17, 2026
**Status:** Approved for controlled implementation
**Production source of truth:** `headspa-mastery.html`

> **Amendment — August 18, 2026 (owner-directed Phase 1 remediation).** Following owner rendered review of the first Phase 1 implementation (commit `ed4d381`), four corrections were approved that supersede conflicting portions of this document below: (1) a global course-foundation-consistency requirement, recorded in `00-global-decisions.md` and applied to Section 8.2's typography and to both checkpoints' component structure; (2) the 12-chapter presentation is now **one contained masterclass player** showing the active chapter only, not twelve vertically stacked video stages; (3) **video completion is now required for Module 8 completion** — all 12 chapters, not just the two checkpoints; (4) the **AIMT Service Timer becomes a major feature section** with a functional ~3-step preview. Sections below marked "Amended" reflect this; unmarked sections remain controlling as originally approved. All 17 step titles, all 12 chapter labels, the exfoliation framework, the claims corrections, "Explain intentionally, not continuously," "Protect the Flow," and both checkpoints' questions/rubrics are unchanged by this amendment. Real video installation remains deferred to Phase 2.
>
> **Amendment — August 19, 2026 (second owner-review remediation).** Following owner rendered review of the August 18 remediation, three further corrections were approved, superseding conflicting portions below: (1) the hero headline no longer centers an exact step count, and student-facing copy throughout Module 8 minimizes unnecessary fixed-number framing ("17 steps," "all 17 steps") in favor of "full service," "complete service," "service flow," "protocol," "chapters" — the underlying 17-numbered-step / 12-video-chapter data model and every existing step/chapter title are unchanged; (2) the masterclass is repackaged into **one cohesive, contained player shell** (chapter identity, video, guidance, and navigation inside a single visual container) with the chapter list now a **collapsed-by-default drawer** secondary to the video, and "Chapter X of 12"-style text removed from the visible UI (a bare current-chapter numeral remains visible; full position is still exposed to assistive technology via `aria-label`); (3) the **Timer preview is rebuilt to visually and functionally derive from the real owner Timer prototype** (`~/Downloads/AIMT-Service-Timer-clean.html`) — dark palette, ring countdown, timeline, step label/title/description/note, pause overlay, and prev/skip bottom bar all reused from that source, rather than reinterpreted into Module 8's own card styling. Sections marked "Amended" a second time reflect this pass. No step/chapter title, curriculum correction, checkpoint, or completion-gating requirement changed.
>
> **Amendment — August 19, 2026 (third owner-review remediation).** Following owner rendered review of the August 19 remediation, three further polish corrections were approved, superseding conflicting portions below, ahead of real video installation: (1) a restrained **"Reading the pacing markers"** explanation is added to Section 8.2, before the masterclass, teaching students that the per-chapter timing pills (e.g., "1hr: ~5 min") are approximate pacing landmarks showing roughly how much of the selected 60- or 120-minute service a chapter is meant to take — not rigid deadlines, absolute timing rules, or pass/fail stop times — and stating explicitly that the masterclass teaches technique, the pacing markers teach rhythm, and the Service Timer turns that rhythm into a live protocol companion; (2) the Timer preview gains a **phase badge** and an **"Up next" preview line**, both reusing the real Timer prototype's own `phase` field and next-step-preview concept (Steps 01–02 are phase "Opening," Step 03 is phase "Wet Phase," matching the prototype's own `STEPS` data), plus a concise **"How to read the Timer"** guide (ring & clock, top timeline, phase, up next) placed after the preview and before the footer; (3) the **"Start preview" button is removed** — the preview now **auto-starts once, via `IntersectionObserver`, the first time the Timer feature meaningfully enters the viewport** (35% visibility threshold, single-fire then disconnected, so scrolling away and back does not restart it), with no audio and no change to instructional-video autoplay policy (still prohibited). Sections marked "Amended" a third time reflect this pass. No step/chapter title, curriculum correction, checkpoint, or completion-gating requirement changed.

This document is the approved implementation specification for Module 8. It replaces the source extraction as the controlling Module 8 content authority.

It does not authorize changes to authentication, entitlements, payments, database policies, certificate issuance, Modules 0–7, Module 9, the future Module 12 Final Exam, the AIMT Service Timer (a separately audited tool), or the monolithic course-file architecture. Nothing in this document authorizes video installation, image generation, downloadable production, or Service Timer work — those remain separate, later, or explicitly out-of-scope tasks.

Module 7 taught the student to build the physical and procedural system the service happens inside. Module 8 is where that system runs: the complete head spa service, taught as a masterclass built around the owner's own instructional footage, with practitioner judgment as the thing that turns a fixed sequence into a coherent, adaptable service.

---

## Basis for this specification

This specification converts an external audit of `module-08-source.md`, reviewed and approved by the owner, into controlling content. It is not a new external literature review — no new medical, safety, or industry citation was introduced for this pass. The corrections below are owner-directed curriculum and claims corrections, evidence-of-record being the owner's own professional judgment as the course's subject-matter authority, consistent with how the governing audit philosophy treats safety and scope as guardrails: remove or soften claims that are unsupported, absolute, or promise outcomes the course cannot document, without turning the module into a disclaimer-led experience.

Where a claim in the source extraction (`module-08-source.md` §12) asserted a specific physiological mechanism (circulation, lymphatic movement, nervous-system activation, cuticle closure, steam penetration, nerve density) or a guaranteed business outcome (rebooking causation), it is corrected below. Where a claim is a legitimate safety practice (e.g., manually confirming water temperature before client contact), it is preserved — safety instruction and unsupported physiological claims are not the same category, and only the latter required correction.

---

## Approved module identity

**Title: kept — "The Head Spa Service."** Preserved exactly as it exists in production (home-row title, `MODULE_TITLES[8]`, hero eyebrow all already match with no drift). This is the module's full-service masterclass; the title already says exactly that.

**Hero eyebrow:** "Module 8 · The Head Spa Service" — kept verbatim.

**Hero headline — AMENDED August 19, 2026:** "This is not about memorizing steps." is replaced with **"Master the flow, not the script."** Owner rationale: the original headline (and much of the surrounding copy) leaned too heavily on the exact step count, making the module feel rigid and checklist-bound rather than centered on flow and adaptation, which is the module's actual thesis. The hard-coded `<br>` remains removed; the new title wraps naturally at all widths.

**Hero description — AMENDED August 19, 2026:** replaced with: "This module is about understanding how the service moves — from one technique to the next, why each part belongs, and how to adapt in real time without losing the experience." Kept short by design — this is not a long hero paragraph.

**Relationship to Module 7:** no change required. Module 7 ends by previewing Module 8 accurately ("the full 17-step service map... every transition and every micro-teach moment"); Module 8's hero opens its own frame without needing a backward callback sentence, consistent with the pattern already approved for Module 7's relationship to Module 6.

**Transition to Module 9:** the completion card's existing Module 9 preview text ("Sanitation and reset systems...") is retained — nothing in this audit found reason to doubt it, though Module 9 itself has not been separately audited.

**Module-opening Cadence greeting:** kept verbatim — "This is the full picture — every step in sequence. If you have questions about timing or technique for any specific step, I am right here." No old-course-name or personal-experience-claim defect was found in this string; no correction needed.

---

## Student-facing count language — AMENDED August 19, 2026

Throughout Module 8's visible copy, unnecessary fixed-number framing ("17 steps," "all 17 steps," repeated numeric protocol framing) is reduced. Prefer: full service, complete service, service flow, protocol, service sequence, chapters, phases.

**Do not remove the actual numbered step identities from instructional material where they are useful** — the 17-step numbering inside the masterclass chapters (`sms-num`, step ranges like "08–10") and the "12 chapters" data model are unaffected; this is a visible-copy reduction, not a removal of the underlying structure. **Do not rename any existing service-step or video title** — the videos are already produced around those titles.

Confirmed reduced: the 8.1 section title ("Same 17 steps. Different depth." → "Same service. Different depth."), the 8.2 section intro body copy, and the Service Timer feature's body/idle/done/footer copy. The masterclass's "Chapter X of 12" style repetition is addressed separately — see "Video-led chapter architecture — AMENDED (August 19, 2026)."

---

## Approved learning thesis

> **The 17 steps are the map. The videos are the masterclass. Practitioner judgment turns them into a coherent service.**

By the end of Module 8, the student should be able to:

1. Execute the service in a usable sequence.
2. Understand why steps occur where they do.
3. Transition smoothly between service phases.
4. Adjust pressure, intensity, product use, pacing, and communication to what a given client and moment call for.
5. Recognize when a technique needs to become gentler, or otherwise adapted, and do so without breaking the service.
6. Preserve service flow when the original plan changes.
7. Communicate intentionally, not continuously — explain with purpose rather than narrating every movement.
8. Perform within professional scope and client consent.
9. Distinguish a structured head spa service from a standard salon shampoo.
10. Use judgment rather than mechanically reproducing a fixed protocol.

Mastery is **not** rote memorization of 17 rigid steps. An outcome like "the student can recite the 17 steps" is explicitly rejected as a course goal — every outcome above names a judgment, adaptation, or communication skill the student can actually demonstrate.

---

## Keep unchanged

- Technical module ID `8`.
- Wrapper ID `module8Wrap`.
- Checkpoint IDs `m8cp1`, `m8cp2`.
- Completion-card ID `m8Complete`.
- Two required open-response checkpoints.
- Module 7 as the prerequisite; Module 9 as the next module.
- Existing students who have already passed either checkpoint remain passed.
- **All 17 numbered service steps and their existing titles, in existing order** — see "Approved 17-step / 12-video chapter architecture."
- **All 12 video-player chapter positions, their existing chapter labels, and their existing step groupings** (08–10, 13–15, 16–17 grouped; all other numbered steps one-to-one) — see the same section.
- The two-format (1-hour / 2-hour) structure and the per-step timing badges.
- The core "flow, pressure, transitions are skills, not checklist items" framing in Section 8.3 — accurate and valuable, kept, with its absolute-language claims softened (see "Required corrections").
- The 7-phase concept ("Entry & Regulation → Immersion → Treatment Work → Expansion → Reset & Cleanse → Signature Moments → Exit") as a real, useful orientation frame — kept, converted from a dead-interaction hint to a genuine static orientation device (see "Interaction density, phase map, and format toggle").
- Both required checkpoints — they test genuinely different competencies (adaptation reasoning under a live service constraint, and in-the-moment client communication) and are kept as two, not collapsed to one.

Do not rename the module ID, checkpoint IDs, completion-card ID, wrapper ID, progress keys, `STEP_VIDEO_IDS` array, or any of the 12 video-slot element IDs merely to normalize implementation.

Do not add a third required checkpoint.

---

## Required corrections

1. **Fix `m8cp1` displayed/evaluated question mismatch.** Adopt one approved question, used identically for both display and evaluation (see "Checkpoint specification") — resolving the largest-magnitude mismatch found across the audited modules to date (two full sentences dropped from the evaluated string).
2. **Fix `m8cp2` displayed/evaluated question mismatch.** Adopt one approved question, used identically for both display and evaluation.
3. **Replace the shared `M8.system` rubric with `M8.systems.m8cp1` / `M8.systems.m8cp2`**, matching the per-checkpoint structure used in Modules 1–4 and (post-audit) Modules 5–7.
4. **Add module-specific checkpoint network-error text** — `submitM8CP` currently passes no 5th `errorMessage` argument.
5. **Correct Cadence's old course name and personal-experience claims** — `M8.system` ("instructor of HeadSpa Mastery") and `MODULE_GUIDE_SYSTEMS[8]` ("a mentor built from nearly two decades in the head spa industry," and the embedded rebooking-causation claim). See "Cadence behavior."
6. **Remove the dead "Tap each phase" interaction hint.** The 7-phase concept grid becomes a labeled static orientation device with no false interactivity claim.
7. **Give the format toggle real instructional function**, or fix its color-only state — approved direction: give it real function (see "Interaction density, phase map, and format toggle").
8. **Replace the service-step accordion as the primary presentation pattern** with a video-led chapter sequence — see "Video-led chapter architecture." The accordion's one-open-at-a-time reveal mechanic is removed as the module's dominant structure.
9. **Rewrite the exfoliation curriculum** away from a binary "exfoliate / do not exfoliate" framing toward an adaptable-intensity framework — see "Exfoliation framework."
10. **Correct Step 01 (Aromatherapy selection).** Fragrance must be optional, fragrance-free must remain a genuinely valid path, consent must precede touch, eyes-closed must not be required. See "Step-specific approved corrections."
11. **Correct Step 05 (Scalp massage) claims.** Remove the circulation/lymphatic/parasympathetic-activation claim; replace with practitioner-skill framing (rhythm, continuity, pressure, client comfort, pacing, transitions). See "Step-specific approved corrections."
12. **Add scope guardrails to neck/shoulder/hand work (Steps 07, 12).** Concise, non-legal-treatise framing tying this work to applicable scope, training, and consent — course completion does not expand legal scope. See "Step-specific approved corrections."
13. **Correct Step 11 (Conditioning & treatment) steam-penetration claim.** Remove "opens the cuticle and drives the treatment deeper"; replace with product/equipment-direction-based guidance. See "Step-specific approved corrections."
14. **Correct Steps 13–15 (Waterfall, Cooling spray, Hot towel) claims.** Remove "closes the cuticle" and "circulatory boost"; keep the sensory/experiential framing, which is accurate and valuable. See "Step-specific approved corrections."
15. **Correct Steps 16–17 (Close & checkout) rebooking-causation claim.** Remove the unqualified "drives rebooking" claim from both the visible curriculum and `MODULE_GUIDE_SYSTEMS[8]`; retain the value of a specific, intentional closing observation without the guarantee. See "Step-specific approved corrections."
16. **Soften Section 8.3's absolute pressure claim.** "Good pressure is predictable... bad pressure is random..." is corrected to judgment-based language; "You do not guess temperature. You confirm it. Every time" is a legitimate safety instruction and is preserved as-is.
17. **Remove unqualified superlative claims** — "your highest skill," "the most overlooked technical skill" — replace with non-superlative framing.
18. **Replace mandatory per-step narration ("Micro-teach") with "Explain intentionally, not continuously."** Relabel the per-step client-language field; add the governing communication principle. See "Micro-teaching — approved change."
19. **Add scope guardrails to neck/shoulder/hand — see #12** (cross-referenced, not duplicated).
20. **Add the ungraded signature interaction "Protect the Flow"** after the video-led instructional sequence, before `m8cp1`.
21. **Fix accessibility gaps:** `aria-label` on both voice/submit buttons, `aria-live="polite"` on both `.cp-response` regions, native keyboard-operable semantics on the format toggle and chapter-jump navigation, `prefers-reduced-motion` guard on `.sms-body`'s `slideDown` animation (or its replacement), an accessible `title` on each chapter's video element once installed.
22. **Remove the hard-coded hero `<br>`.**
23. **Record the AIMT Service Timer's classification and Module 8 introduction placement** without installing, linking, or auditing it. See "Service Timer."
24. **Record the downloadable-resource decision (not recommended) explicitly**, per the governing policy that every module records this section regardless of outcome.

---

## Approved 17-step / 12-video chapter architecture

Two related but distinct structures are preserved, and this specification keeps them explicitly distinguished (per instruction) rather than collapsing them:

- **17 numbered practitioner service steps** — the actual sequence of what happens in the service, unchanged in number, order, and title.
- **12 video-led instructional chapters** — the presentation structure students learn from. Several numbered steps are grouped under a single chapter because that is how the owner's actual footage is organized; this specification does not force 17 players to match 17 numbers, and does not force separate video files to merge into one chapter beyond what the existing grouping already reflects.

**All 17 step titles and all 12 chapter labels are preserved exactly as extracted** (`module-08-source.md` §4–§5), because the owner's actual service videos have already been produced against these titles. No step is renamed. No chapter is renamed. No new chapter names are invented.

| Chapter | Step(s) | Preserved chapter label | Preserved step title(s) |
|---|---|---|---|
| 1 | 01 | Step 01 — Aromatherapy Selection | Aromatherapy selection |
| 2 | 02 | Step 02 — Dry Brushing & Hair Play | Dry brushing & hair play |
| 3 | 03 | Step 03 — Halo Activation & Wet Massage | Halo activation — wet massage |
| 4 | 04 | Step 04 — Exfoliant Application | Exfoliant application |
| 5 | 05 | Step 05 — Scalp Massage | Scalp massage |
| 6 | 06 | Step 06 — First Rinse | First rinse |
| 7 | 07 | Step 07 — Neck & Shoulder Massage | Neck & shoulder massage |
| 8 | 08–10 | Steps 08–10 — Second Rinse, Shampoo, Rinse | Second rinse → Shampoo → Rinse |
| 9 | 11 | Step 11 — Conditioning & Treatment | Conditioning / treatment |
| 10 | 12 | Step 12 — Hand Massage | Hand massage *(2-hour only)* |
| 11 | 13–15 | Steps 13–15 — Waterfall, Cooling Spray, Hot Towel | Waterfall rinse → Cooling spray → Hot towel |
| 12 | 16–17 | Steps 16–17 — Towel Wrap & Close | Towel wrap → Close & checkout |

If the final supplied footage contains distinct subclips within a grouped chapter (e.g., a separate clip for the shampoo portion of chapter 8), the implementation may present those as subclips within that chapter's player — this does not require or authorize renaming the chapter or splitting it into a new top-level chapter position.

---

## Video-led chapter architecture — AMENDED August 18, 2026, further amended August 19, 2026

**This section supersedes the original "12 vertically stacked chapter stages" design.** Owner rendered review of the first Phase 1 implementation found twelve consecutive full-size video stages visually excessive and too long as a page — rejected. The videos remain the dominant instructional hierarchy, but the module must present them as **one contained masterclass player**, not a scroll of embedded videos.

**Governing requirement:** one primary masterclass component shows the **active chapter only**. The information around the player (title, watch-for cue, guidance, adaptation cue, continuity) changes with the active chapter. The remaining 11 chapters are represented in a compact chapter rail/progress indicator, not as additional full video stages rendered on the page.

**Second amendment (August 19, 2026) — one cohesive player shell, not assembled parts.** Owner review of the August 18 masterclass found it directionally correct but "assembled" rather than a single premium product: a video stage plus disconnected cards, with a large always-visible 12-row chapter list sitting beside/under it competing for attention. Approved correction:

- **One visual shell.** Chapter identity (numeral + title + timing), the watch-for cue, the video stage, guidance, adaptation cue, continuity, and Prev/Next controls all live inside a single bordered/backgrounded container — not separate boxes.
- **Chapter navigation is visually secondary and defaults to collapsed.** The always-visible 12-row list is replaced by a compact "Chapters" toggle inside the shell that opens a drawer (the same full-width, one-row-per-chapter rows as before, with Completed/Current/Locked exposed as text, not color alone) — collapsed by default so it never competes with the video for attention. A small segmented progress bar remains visible (quiet, secondary) as a supplementary, non-textual sense of position.
- **No repeated "Chapter X of 12" text.** The visible chapter numeral (e.g., "05") is sufficient as the visible current-chapter number; full ordinal position ("Chapter 5 of 12 — Scalp Massage") is still exposed to assistive technology via an `aria-label` on the chapter-identity region, so screen-reader users are not shortchanged by the visual simplification.
- Locked chapters remain programmatically non-actionable in the drawer (as before); completed chapters remain replayable; Course Review Mode's non-persisting inspection bypass is unchanged.

**Approved masterclass component — the six content fields are unchanged, applied to whichever chapter is currently active:**

1. **Existing service-step title / numbering** — the preserved chapter label (e.g., "Step 05 — Scalp Massage"), always visible for the active chapter.
2. **Concise orientation / "watch for" cue** — one or two sentences priming observation, not narrating the video.
3. **One large, prominent video stage** — see "Video player implementation requirements." **Amended August 19, 2026:** the video stays contained within the single player shell (it no longer breaks out past the standard text column) — the earlier "may exceed the standard column width" allowance is superseded by the "one cohesive player shell" requirement; a video visually spilling past its own container's edges is not "contained." Only one video stage exists in the DOM/renders at a time.
4. **Short practitioner guidance** — text carrying what the demonstration cannot show (per "Step-specific approved corrections"). **Must use the shared course body-text foundation** — see "Course foundation consistency."
5. **Adaptation/mistake/decision cue** — included only where genuinely useful, same per-step judgment as before (Step 04/05, Step 07/12, others where real and specific).
6. **Next-step continuity** — a brief line connecting the active chapter to the next.

**Chapter progression (new, approved):**

- Chapter 1 is available first; later chapters unlock in sequence as the required instructional video for the active chapter reaches genuine completion (a real player "ended"/completion event — not merely opening, starting, or seeking to the end).
- A completed chapter remains available and may be replayed at any time.
- The student can always see, without relying on color alone: the current chapter, which chapters are completed, and which remain locked/upcoming.
- Clicking forward into a chapter that has not yet unlocked must not be possible in normal student mode — a student may not click through all 12 positions to manufacture completion.
- The chapter rail/progress indicator must remain restrained: a simple segmented progress row plus a navigable list of chapter labels with their state is sufficient. No game-like reward styling (no confetti, no XP, no badges beyond a plain "completed" indicator).
- On phone, do not render twelve small, unreadable, individually-tappable rail segments — a segmented progress bar paired with a current-chapter text readout ("Chapter 5 of 12 — Scalp Massage") and a full-width, one-row-per-chapter navigable list satisfies this without crowding.
- **Course Review Mode may include a non-persisting inspection affordance** that lets a reviewer move freely through all 12 chapters without exercising real playback — this must be explicitly gated to Review Mode only, must not write real student progress, and must not be reachable in normal student mode. This is the one authorized exception to "no testing shortcut."

**Phase 1 condition:** the real videos are not installed by this amendment. The masterclass architecture, chapter data, and completion-state plumbing are built now; genuine chapter completion cannot organically occur until Phase 2 wires a real completion event to each installed video. No chapter may be marked complete by loading, starting, or clicking through a video in normal student mode during Phase 1 — this is expected and correct, not a defect to route around with a fake completion.

**What moves from "What you do" prose into which field:** the existing per-step "What you do" copy currently narrates hand movement, technique mechanics, and sectioning in prose (per `module-08-source.md` §4). Per the governing video/text division, movement, hand placement, sectioning, and physical technique become the video's job, not the paragraph's. Each chapter's guidance text (field 4 above) should be trimmed of pure movement narration and should carry forward, or add, the judgment-oriented content the video cannot show: why the step matters here, pressure/intensity reasoning, product/technique decisions, mistakes to avoid, safety/scope, and communication. This is a re-weighting of existing accurate content, not a wholesale rewrite — curriculum preservation still applies; only the specific corrections listed in "Required corrections" change substance.

**Worked example (Chapter 5 — Scalp Massage), showing the shell applied:**

1. Title: "Step 05 — Scalp Massage" (unchanged).
2. Watch-for cue: "Watch how pressure and rhythm shift across regions — this is the section of the service most defined by consistency, not force."
3. Video player (deferred — see "Implementation boundary").
4. Guidance: see the corrected copy in "Step-specific approved corrections" below — rhythm, continuity, pressure, client comfort, pacing, transitions, replacing the removed circulation/lymphatic/nervous-system claim.
5. Adaptation cue: pressure/intensity should be checked against client response, not applied uniformly regardless of what the client's scalp presentation and comfort are telling the practitioner in the moment.
6. Continuity: "First rinse follows directly — client stays in this position; only the water changes."

This one worked example establishes the pattern; other chapters follow the same shell with their own content, trimmed of movement narration per the rule above, without requiring a full rewrite of every chapter's copy in this specification.

---

## Exfoliation framework

**Do not teach exfoliation as a binary.** The prior "exfoliate / do not exfoliate" framing (implicit in Step 04's current copy, which gives one fixed application method with no adaptation guidance) is replaced with an adaptable-intensity framework.

**Approved teaching:** exfoliation is adapted by **intensity, method, product, pressure, and technique** — not simply turned on or off. A strong exfoliation approach may be inappropriate for a given scalp presentation without meaning all exfoliative action disappears from the service. Cleansing, scalp manipulation, washing, and friction all carry some inherent, milder exfoliative effect on their own. The student should be able to reason about:

- stronger versus gentler exfoliation;
- product choice;
- pressure;
- frequency/intensity;
- method;
- observed client tolerance;
- scalp presentation;
- when to reduce or modify, versus when a true safety/scope/contraindication reason means a deliberate exfoliation treatment should be fully omitted.

**Language to avoid:** "some clients receive exfoliation and others receive none," or any framing that implies the decision is simply present/absent. Only a genuine safety, scope, or contraindication reason should lead the curriculum to imply full omission of a deliberate exfoliation treatment.

**Step 04 (Exfoliant application) — approved addition.** Add one to two sentences after the existing "What you do" copy: exfoliation intensity, product, and technique should match what the client's scalp is telling the practitioner that day — a stronger application is not the default to be dialed back only when there's a problem; it is one point on a range the practitioner selects from every time. This directly supports `m8cp1` and "Protect the Flow," both of which test this same reasoning.

---

## Step-specific approved corrections

Exact replacement copy for each required correction. All other step copy not listed here is unchanged in substance (only re-weighted per "Video-led chapter architecture" to move movement narration out of the guidance text).

### Step 01 — Aromatherapy selection (opening)

**Corrected guidance (replaces current "What you do" + client-language pairing):**

> Offer the three essential oil blends and a fragrance-free option with equal weight — fragrance-free is a genuinely valid choice, not a fallback. Ask before the first touch. If a client wants to close their eyes while they sample, that's their choice to offer, never an instruction.

**Corrected example client language (replaces the current mandatory-sounding script):**

> "I have three blends today, or we can skip fragrance entirely if you'd prefer — whichever sounds better to you. I'm going to rest my hand here on your shoulder while you sample, if that's alright."

Retain the existing note pointing to Module 2 for consent depth, updated to reflect that eyes-closed is optional: "The first touch happens here, and it's the client's choice how immersive this moment is. Consent and first-touch framing are covered in depth in Module 2."

### Step 05 — Scalp massage

**Corrected example client language (replaces the removed circulation/lymphatic/parasympathetic claim):**

> "This is the part where you can really let go. I'll keep a steady rhythm and check that the pressure feels right as we go."

**Guidance addition:** what makes this step read as skilled is controlled technique — rhythm, continuity, pressure, broad versus targeted contact, and reading client response — not a specific physiological outcome. Pacing and smooth transitions between regions matter more than any single technique choice.

Existing note ("This is where the 1-hour and 2-hour diverge most. Know your pace for each format.") is unchanged.

### Steps 07 and 12 — Neck & shoulder massage / Hand massage

**Approved scope guardrail (concise, added to both chapters' guidance, not a separate disclaimer section):**

> Neck, shoulder, hand, and forearm work is offered only within your applicable professional scope, your training, and this client's consent for this specific service. Completing this course does not expand what you are licensed to perform — confirm your own state and salon requirements before including this work in a service.

No state-specific legal text is added. This single guardrail sentence appears once per chapter, not repeated as a running disclaimer.

### Step 11 — Conditioning / treatment

**Corrected guidance (replaces the steam-penetration claim):**

> Follow the product and equipment directions for processing time and temperature. Steam adds warmth and client comfort during processing — treatment selection and timing follow what the product calls for and how the client's scalp is responding today, not a fixed penetration claim.

Existing note about explaining the format difference during booking is unchanged.

### Steps 13–15 — Waterfall rinse, Cooling spray, Hot towel

**Corrected example client language (cooling spray, replaces the cuticle-closure/circulatory-boost claim):**

> "This is a temperature contrast — it's going to feel slightly startling for a second, and then very good. It's one of the moments clients remember most about this service."

These three moments are taught as **sensory, experiential, positioning- and temperature-comfort-dependent signature service moments** — that framing is accurate and is kept; only the unsupported physiological mechanism is removed.

### Steps 16–17 — Towel wrap, Close & checkout

**Corrected note (replaces the rebooking-causation claim):**

> A specific, personalized observation at close is one of the strongest ways to make a service feel complete and intentional rather than rushed. Clients remember being seen — that's worth doing well regardless of what it does for your schedule.

The closing script (retained, unchanged): "Today I focused on [what you observed]. I used [products] because of [reason]. For home care, I'd recommend [one specific thing]. How are you feeling?"

### Section 8.3 — Flow, pressure & transitions

**Corrected "Pressure consistency" card (replaces the absolute good/bad framing):**

> Consistent pressure reads as intentional. Uneven or unpredictable pressure reads as uncertain — even when the underlying technique is sound. Consistency, not any single pressure level, is what a client actually feels as skill.

**"Temperature control" card:** unchanged — "You do not guess temperature. You confirm it. Every time... Equipment fails. Your hand is the safeguard" is preserved as legitimate safety practice, not an unsupported claim.

**Superlative language removed:** "your highest skill" (concept-grid phase 3) and "the most overlooked technical skill in the service" (pressure-consistency card) are replaced with non-superlative framing — e.g., "one of the more demanding skills to execute well" and "an often-underestimated part of the service" respectively. The underlying teaching point (this deserves deliberate attention) is preserved; the unqualified ranking claim is removed.

---

## Micro-teaching — approved change

**Remove the concept that students should narrate or micro-teach every service step.** Replace with:

> **Explain intentionally, not continuously.**

Communication should have a purpose. Appropriate reasons to speak during the service include: consent, comfort, introducing an unfamiliar step, explaining a meaningful change, answering a client question, sharing an observation, and giving after-service or next-step guidance. Quiet is allowed to remain quiet — a premium relaxation service does not require constant narration.

**Implementation effect:** the per-step field currently labeled "Micro-teach" (implying a mandatory script for every step) is relabeled **"What you might say"** — a labeled example of client-facing language for steps where communication genuinely has a purpose, not an instruction to narrate all 17 steps aloud. This principle is stated once, prominently, before Section 8.2's chapter sequence begins, rather than repeated at every chapter.

This directly corrects `M8.system`'s current framing ("Micro-teach while doing... is what elevates client perception," implying constant narration) and `MODULE_GUIDE_SYSTEMS[8]`'s rebooking-causation echo of the same idea — see "Cadence behavior."

---

## Video player implementation requirements

Applies to the eventual real-video implementation (deferred — see "Implementation boundary"); the shells and requirements below govern player behavior once installed.

- Preserve all 12 legitimate chapter positions, IDs, and `STEP_VIDEO_IDS` entries — these remain the underlying data model even though only the active chapter's player renders at a time (see "Video-led chapter architecture — AMENDED").
- **No autoplay.** Remove `autoplay=1` from the eventual embed configuration. A student's click to start a chapter's video should start that video only — never the next chapter's.
- No forced automatic playback of any kind; no autoplay into the next chapter.
- **Completion event (amended):** Phase 2 must wire the installed player's genuine "ended"/completion event to the video-chapter-completion state (see "Completion behavior — AMENDED"). Do not infer completion from opening, starting, or seeking a video.
- Accessible, chapter-specific player titles/labels (each eventual `<iframe>`/`<video>` receives a `title` naming its preserved chapter label — corrects the current gap where no `title` attribute is ever set).
- Responsive, mobile-comfortable playback at consistent proportions (16:9, matching the existing aspect-ratio approach).
- Native/approved player controls — no custom chrome that hides standard play/pause/scrub/volume/fullscreen behavior.
- Clean loading state — no layout shift when a video is requested; a lightweight loading indicator, not a blank flash.
- No disruptive motion — any load/transition animation respects `prefers-reduced-motion`.
- Captions/subtitles for all spoken content once installed.
- A defined transcript/text-equivalent strategy (see "Listen Mode notes" and "Accessibility requirements") — the videos remain screen-required for the physical technique itself, but spoken content gets a text equivalent.
- Full keyboard operability of every player trigger and control.
- Visible focus wherever a custom control exists (e.g., the pre-play thumbnail trigger).
- No color-only state anywhere in the player UI.
- No inaccessible hidden instructional content — orientation cues, guidance text, and adaptation cues (chapter shell fields 2, 4, 5) are never gated behind playing the video.

**Posters:** should ultimately come from the actual service footage, not decorative generated imagery (see "Visual asset plan"). Do not generate decorative replacement imagery for video posters unless separately, explicitly authorized later.

**Player width — AMENDED August 19, 2026:** the video stage stays within the masterclass player shell's own width; it no longer breaks out past the standard text-reading column. The earlier exception is superseded — video dominance now comes from the video being the largest, most visually prominent element inside one cohesive contained shell, not from exceeding the module's text measure.

---

## Interaction density, phase map, and format toggle

**Module 8 has low interaction density.** The videos are already cognitively and visually rich; the module does not interrupt the student after every video, and does not add interaction for the sake of appearing interactive.

### 7-phase concept grid

**Decision: static orientation map.** Remove the dead "Tap each phase" hint entirely — every phase's definition is already fully visible, so there is nothing to gate behind a false interaction claim. The grid becomes an explicitly labeled static orientation device (e.g., "Seven phases, at a glance" replacing any language implying interactivity), kept as genuinely useful framing for how the 17 steps group conceptually. No click-to-reveal mechanic is added; an actual interaction was considered and rejected as unnecessary — the content is already fully disclosed, so gating it behind a tap would only add friction without adding a judgment task.

### Format toggle

**Decision: give it real instructional function**, rather than leaving it as a color-only highlight with no consequence. Selecting 1-Hour or 2-Hour should visibly emphasize that format's timing badges throughout the 12-chapter sequence and de-emphasize the other format's (e.g., Chapter 10 — Hand Massage, 2-hour-only — is clearly marked as not part of the 1-hour service when 1-Hour is selected, rather than appearing identically weighted regardless of selection). This gives the toggle a genuine "which service am I learning to run today" purpose consistent with the module's per-chapter timing badges, rather than a decorative highlight.

**Color-only fix:** the selected state adds a text/icon indicator (e.g., a "Selected" label or checkmark glyph) alongside the existing background/text-color change — correcting the confirmed color-only-meaning gap.

### Service-step accordion

**Removed as the primary presentation pattern** (correction #8) — see "Video-led chapter architecture." The optional chapter-jump navigation that replaces it for wayfinding is not counted as an interaction, for the same reason Module 7's tool-category accordion was reclassified as a content-organization aid rather than a learning interaction.

**Resulting interaction count:** the 7-phase map (static, not counted), the format toggle (real function, low-stakes utility, not counted as a learning interaction), the chapter-jump navigation (wayfinding utility, not counted), and one new signature interaction — "Protect the Flow" (counted; see below) — plus the two required checkpoints.

---

## Signature interaction — "Protect the Flow"

**Placement:** after the full video-led chapter sequence (Section 8.2), before `m8cp1`.

**Purpose:** test whether the student can preserve the service experience when conditions change. Judgment, not recall.

**Status:** ungraded. Not progress-writing, not completion-gating, not gamified. No `APP_STATE` write, no persistence across a module reopen, no scoring.

**Format:** compare-and-decide / scenario judgment, consistent with the course's established `m5Decide`/`m6Sort`/Module 7 signature-interaction pattern — not drag-and-drop, to keep the module flowing.

**Exact task:** three short scenarios, presented one at a time, each describing a condition change mid-service and asking the student to choose or reason through how they'd preserve the service's flow and experience.

**Approved scenario themes:**

1. **A fragrance or touch preference changes.** A client who initially opted into fragrance mid-service asks to skip it going forward, or vice versa — the student must adjust without treating it as a disruption.
2. **A strong exfoliation approach is too aggressive for the scalp presentation and needs to become gentler.** Directly reinforces the "Exfoliation framework" above — the correct response reduces intensity/pressure/product strength and adapts method, it does not eliminate exfoliative action outright unless there is a genuine safety reason.
3. **A product, timing, or service-plan decision needs adaptation** without making the service feel broken — e.g., a processing step needs more or less time than planned, and the practitioner must adjust pacing for the rest of the service without visibly scrambling.

**Feedback principle, stated at the end of the interaction:**

> The protocol gives structure. Judgment keeps it appropriate.

Feedback for each scenario should reinforce this — naming what adaptation preserved flow, not just whether the student's choice was "correct." No scenario may suggest exfoliation simply vanishes; scenario 2's feedback must explicitly reinforce reduction/adaptation over elimination, consistent with "Exfoliation framework."

**Accessibility:** native controls, `aria-live` feedback region, no color-only state, full keyboard operability, visible focus, meaningful accessible names distinguishing the three scenarios.

---

## Are both checkpoints necessary?

**Yes — kept as two required checkpoints, testing genuinely different competencies.** `m8cp1` tests adaptation reasoning under a live service constraint (the exfoliation-intensity judgment "Protect the Flow" just rehearsed, applied in an open-response format); `m8cp2` tests real-time client communication mid-service, a distinct skill from planning-ahead adaptation. Collapsing these into one checkpoint would lose one of the two competencies.

---

## Checkpoint specification

### Shared technical requirements

**Component (amended August 18, 2026):** both checkpoints must use the canonical, most-recently-approved course checkpoint component — `.checkpoint` / `.cp-head` / `.cp-av` / `.cp-label` / `.cp-q` / `.cp-row` / `.cp-input-row` / `.cp-res` — the same structure used by Modules 0, 1, 2, 4, 5, 6, and 7 (verified identical across 5, 6, and 7; the `.cp-box`/`.cp-response` variant Module 8's first Phase 1 pass used is a pre-audit pattern shared only with the not-yet-audited Modules 9–10 and is not canonical). This is a presentation/component change only — Module 8's own approved questions and per-checkpoint rubrics below are unchanged.

Preserve: IDs `m8cp1` and `m8cp2`; stored passed state; voice input; Enter to submit; Shift+Enter for a new line; Review Mode's unsaved behavior; Module 9 gating only after all 12 video chapters are complete and both checkpoints pass (see "Completion behavior — AMENDED").

Add: checkpoint-specific rubrics; exact displayed/evaluated question equality; module-specific network-error text; `aria-label` on voice/submit buttons; `aria-live="polite"` on both `.cp-response` regions; one focused revision request for an incomplete answer; correction of unsafe or diagnostic reasoning.

Do not require exact wording, a minimum sentence count, or a long response. Do not fail an answer for grammar, spelling, brevity, accent, or non-native phrasing when the reasoning is competent.

### Approved network-error text

> Cadence couldn't review your response. Check your connection and try again.

---

### `m8cp1` — Adaptation checkpoint

**Exact question (displayed and evaluated, byte-identical):**

> You are moving into the exfoliation portion of the service and determine that a strong exfoliation approach is not appropriate for this client today. Walk through how you would modify the treatment while preserving the service flow. Include what you would change about product, pressure, technique, or intensity, and what you would communicate to the client.

**Competency assessed:** the student can adapt exfoliation intensity for a real presentation without breaking service flow, and communicate the adjustment appropriately.

**Pass when the answer demonstrates all of the following, in any natural wording:**

1. Recognizes that adapting the treatment does not automatically mean eliminating all exfoliative action.
2. Reduces or otherwise adjusts intensity, rather than either continuing unchanged or stopping the step outright without cause.
3. Names an appropriate product or method modification (gentler product, less aggressive method, or similar).
4. Addresses pressure or technique adjustment specifically.
5. Preserves a smooth transition — the change reads as part of the service, not a visible break in it.
6. Includes concise client communication where it has a purpose (not a long explanation).
7. Reasoning is non-diagnostic — no medical/dermatological diagnosis is implied or attempted.

**Incomplete when:** the answer treats "adapt" as "skip exfoliation entirely" with no stated safety/scope reason; addresses only one of product/pressure/technique with no other adjustment; or gives no client communication at all where the scenario calls for some.

**Focused revision examples (one per response, not both):**

- "Good instinct to ease off. Now be specific — what would you actually change about the product, pressure, or technique?"
- "You named a solid adjustment. Add a brief line for what you'd say to the client, if anything, while making that change."

**Immediate correction triggers:** any answer stating exfoliation should simply be skipped/removed with no safety or scope reason given; any answer that continues a strong exfoliation approach unchanged despite the stated presentation; any diagnostic language (naming or implying a specific medical condition).

---

### `m8cp2` — Client communication checkpoint

**Exact question (displayed and evaluated, byte-identical):**

> You are in the scalp-massage portion of the service when your client asks, "What makes this different from a regular shampoo at the salon?" What would you say in the moment without breaking the experience?

**Competency assessed:** the student can answer a genuine client question briefly and accurately, in the moment, without resorting to unsupported claims or breaking the relaxation experience.

**Pass when the answer references at least a reasonable subset of the following, in any natural wording:**

1. Structured, scalp-focused service (versus a generic shampoo).
2. Intentional pacing.
3. Assessment or observation informing technique.
4. Product or cleansing decisions made specifically for this client.
5. Scalp-focused massage.
6. The water/technique sequence.
7. Adaptation to what this client's scalp/service needs.
8. The overall client experience.

The answer does not need to be long — a short, in-the-moment response is a pass if it's accurate; this checkpoint should fit the module's own "explain intentionally, not continuously" principle.

**Must not require or reward:** detoxification claims, circulation-enhancement claims, hair-growth claims, medical-treatment framing, diagnosis, or lymphatic-treatment claims. An answer built entirely around one or more of these unsupported claims does not pass, even if fluent and confident.

**Incomplete when:** the answer is generic enough to describe any spa service with no head-spa-specific content, or leans entirely on an unsupported physiological/medical claim.

**Focused revision examples (one per response, not both):**

- "Good start. Now make it specific to this service — what's actually different about the technique or approach, not just that it feels nice?"
- "You're relying on [claim] to explain the difference — that's not something we can promise. Reframe around the structure and technique instead."

**Immediate correction triggers:** any answer asserting a medical, circulatory, lymphatic, or hair-growth outcome as fact; any diagnostic language.

---

## Cadence behavior

### Module-opening greeting

Kept unchanged — no defect found (see "Approved module identity").

### Guide system (replaces `MODULE_GUIDE_SYSTEMS[8]`)

> You are Cadence, AIMT's curriculum-grounded guide for the Head Spa Certification Course. The student is in Module 8, The Head Spa Service — the full 17-step, two-format service, taught through the instructional videos. Your role here is service-flow and practitioner-judgment coach: help the student with smooth transitions, adapting intensity or technique (especially exfoliation, which is adapted by degree, not switched on or off), client communication in the moment, and identifying when context changes the default plan. Communication should be explained as intentional, not continuous — quiet is appropriate during most of the service. Do not state that a specific closing observation guarantees rebooking or any other business outcome. Your guidance is built from AIMT's approved curriculum and the instructor's applied experience; you do not claim that experience as your own. Do not give exact stopwatch pacing advice — timing guidance belongs to the AIMT Service Timer, which has its own separate audit. Be direct, warm, practical, and concise. 3-5 sentences, no bullet points.

### Approved quick prompts

1. `How do I keep transitions smooth?`
2. `How do I adapt a step without breaking the flow?`
3. `What should I say when a client asks what I'm doing?`

### Checkpoint rubric identity (replaces the shared `M8.system` string)

Both `M8.systems.m8cp1` and `M8.systems.m8cp2` open with Cadence's corrected identity ("Cadence, AIMT's curriculum-grounded guide for the Head Spa Certification Course" — no "instructor of HeadSpa Mastery"), reference the exact approved question for that checkpoint, and encode that checkpoint's specific pass criteria from "Checkpoint specification" above — replacing the single shared function and its mandatory-narration/hard-coded-answer-key framing.

### Cadence response requirements

Cadence should help the student:

- keep transitions smooth across the service;
- adapt a step's intensity, pressure, product, or technique — especially exfoliation, by degree rather than binary on/off;
- respond to an in-service client question without breaking the relaxation experience;
- recognize when context (client feedback, presentation, timing) changes the default plan;
- apply "explain intentionally, not continuously" to their own communication choices.

Cadence must not:

- use the old course name;
- present itself as a human practitioner or claim personal industry experience;
- state or imply that a specific technique guarantees a physiological outcome (circulation, lymphatic movement, nervous-system activation, cuticle closure, product penetration);
- state or imply that a specific closing behavior guarantees rebooking or any other business outcome;
- instruct the student to narrate every step;
- give exact stopwatch-level pacing advice ahead of the Service Timer's own audit;
- treat exfoliation as a binary present/absent decision.

Persistent Cadence threads remain deferred.

---

## Service Timer — AMENDED August 18, 2026, further amended August 19, 2026 (twice)

**This section supersedes the original "informational card only" treatment.** Owner rendered review found the informational-card presentation too weak for what the Service Timer actually is — a major, practical, included professional tool, not a minor mention.

**Third amendment (August 19, 2026) — teach the pacing markers and the Timer's own UI, and remove the manual "Start preview" control.** Owner review of the second-amendment preview found it functionally faithful but still assumed the student already understood the masterclass's per-chapter timing pills, and required an unnecessary manual "Start preview" tap. Approved corrections:

- **Pacing-marker explanation, added to Section 8.2.** A restrained explanation, placed before the masterclass, states that the timing pills (e.g., "1hr: ~5 min") are approximate pacing landmarks — not rigid deadlines, absolute timing rules, or pass/fail stop times — showing roughly how much of the selected 60- or 120-minute service a given chapter is meant to occupy, so a student can sense where they should be within the full flow. It makes explicit that client needs, product instructions, technique requirements, and practitioner judgment can all shift the actual pace, and names the connection: the masterclass teaches technique, the pacing markers teach rhythm, the Service Timer turns that rhythm into a live protocol companion.
- **Timer UI taught, not just shown.** The preview widget gains a **phase badge** (reusing the real prototype's own `phase` field — Steps 01–02 are "Opening," Step 03 is "Wet Phase," taken directly from the prototype's `STEPS` array) and an **"Up next" preview line** (reusing the prototype's own `next-preview`/`cd-next-step` concept — hidden on the preview's final step, matching the real Timer's own behavior when no next step exists). A concise **"How to read the Timer"** guide (ring & clock = time left on the active technique; top timeline = position across the whole service; phase = the broader protocol section; up next = what's coming) is added after the preview and before the footer — restrained, not a manual.
- **"Start preview" removed; the preview now auto-starts once.** The manual start button is removed. The preview begins automatically the first time the Timer feature section meaningfully enters the viewport, using `IntersectionObserver` at a 35% visibility threshold, firing once and disconnecting (so scrolling away and back does not restart it). No audio is introduced. Pause/Resume, the real per-second countdown, and manual Back/Skip navigation are unchanged and remain fully functional after auto-start. This does **not** authorize autoplay of the instructional videos, which remain manual-play only.

**Second amendment (August 19, 2026) — the preview must look and behave like the real Timer, not a Module 8 reinterpretation of it.** Owner review of the August 18 preview found it did not sufficiently resemble the actual AIMT Service Timer — rejected. Approved correction: the embedded preview reuses the real prototype's own visual and functional language directly, so a student immediately understands "this is the actual AIMT Service Timer," not a decorative countdown widget:

- **Visual continuity preserved:** the Timer's own dark palette (its exact `--bg`/`--surface`/`--accent`/white-alpha tokens, not Module 8's own card colors), its Montserrat/Outfit type hierarchy, the step-timer ring, the total-service timeline treatment, phase/step-label conventions, current-step title/description/note treatment, pause-overlay behavior, and its nav-button/spacing language are all carried into the preview.
- **The outer feature section** (badge, title, body copy, footer) remains in Module 8's own dark feature-card styling — only the embedded preview widget itself switches to the Timer's own distinct palette, which reinforces (rather than undermines) the "real tool embedded here" impression by making it visually distinct from the surrounding lesson chrome.
- **Genuinely functional, not decorative:** start, a real per-second countdown on both the step ring and the running service timeline, pause/resume (with a paused overlay matching the real Timer's own), forward (skip) and backward (back) step navigation mirroring the real Timer's own manual-navigation behavior, and a clear end-of-preview state.
- Fonts: Module 8 (and the rest of the course) already loads Montserrat and Outfit for its own type system; the existing Google Fonts `<link>` was extended additively (Montserrat 900, Outfit 600) to reach the specific weights the real Timer uses — no new font family was introduced, and no other module's typography is affected.

**Classification:** unchanged — recommended hosted student tool / practice companion, not a conventional downloadable.

**Likely eventual architecture:** unchanged — hosted on the AIMT site, accessible from the student dashboard, introduced in Module 8. The complete Timer still requires its own, separate, dedicated audit before Module 8's final manual approval; nothing in this section substitutes for that audit.

**Module 8 presentation (amended):** a substantial feature section, still working title **"Take the Service Into Practice,"** featuring the **AIMT Service Timer**, positioned near the end of the module (after the video-led instruction and "Protect the Flow"). The visual hierarchy must communicate that this is a meaningful, included tool — a product moment, not a footnote — while avoiding exaggerated marketing language. It explains the Timer:

- is the student's service protocol, available anywhere;
- helps rehearse the full service and build pacing awareness;
- gives students a treatment-room companion once they understand the curriculum;
- reduces the need to repeatedly reopen the full lesson during practice.

**Embedded functional preview (new, approved):** the section must contain an actual, usable, contained preview of the Timer — not a screenshot, not a video, not a decorative mockup — covering approximately the first three service steps (Aromatherapy Selection, Dry Brushing & Hair Play, Halo Activation & Wet Massage). Approved preview functionality: start, an active-step display, real per-second countdown behavior (ring + running timeline), pause/resume, forward (skip) and backward (back) step navigation, and a clear end-of-preview state after Step 3. The preview is a small, contained experience, not a second full application embedded in the page — the complete Timer remains the primary tool.

**Timer source authority.** An owner-created Service Timer prototype exists outside this repository (found at `~/Downloads/AIMT-Service-Timer-clean.html` at the time of this amendment — a local file on the owner's machine, not part of `aimt-site`). The preview is derived from that real source's functional concept (mode/format select → active-step countdown with phase/note/next-step preview → pause/resume → completion state) and its actual Steps 01–03 timing values (5 min/5 min, 3 min/5 min, 5 min/8 min for 1-hour/2-hour respectively), which already match Module 8's own lesson timing badges for those steps. **Step 01's preview copy is reconciled with Module 8's approved consent/fragrance-optional correction** (the prototype's own Step 01 text predates that correction and does not mention the fragrance-free option or consent-before-touch by name) — this is the one substantive content change made to the borrowed source; Steps 02 and 03 needed no correction. **This narrow reconciliation is not a substitute for the Timer's own future dedicated audit**, which still governs the complete 17-step tool.

**Implementation constraint (unchanged in spirit, sharpened):** do not create a fake or dead "Open Full Service Timer" launch control. If no verified hosted destination for the complete Timer exists at implementation time, the feature section and preview still ship; the full-Timer link is recorded as pending and is not rendered as a dead or disabled-looking actionable control in normal student mode.

**Exact final timer allocations remain intentionally not frozen by this specification.** The preview's three step timings are the prototype's own current values, used because they already agree with the lesson's own badges — they are not new curriculum authority, and the complete Timer's full 17-step timing set is still reconciled during its own separate audit, not here.

---

## Practitioner insider value

- **A student who can only run the fixed sequence has memorized a checklist, not learned a service.** The moment a client's preference, tolerance, or the clock changes mid-service, a checklist-only practitioner either freezes or breaks flow visibly — the actual skill is adapting without the client noticing the plan changed.
- **Exfoliation is a dial, not a switch.** Beginners tend to think in binary (do it / skip it); the practitioners clients keep coming back to adjust intensity, product, and method in small increments based on what they're actually feeling under their hands.
- **A specific closing observation matters because it's true, not because it's a growth tactic.** Teaching it as a guaranteed rebooking lever cheapens a genuinely good practice; teaching it as "clients remember being seen" keeps the same behavior for the right reason.
- **Silence is a skill, not an absence of one.** New practitioners often over-narrate out of nervousness; naming "explain intentionally, not continuously" as an explicit skill gives students permission to trust a well-executed quiet stretch of the service.
- **The mistake this knowledge prevents:** a practitioner who either mechanically reproduces 17 steps regardless of what the client needs that day, or over-explains every movement out of uncertainty — both read as less skilled than a practitioner who adapts calmly and explains only when it serves the client.

---

## Distinct learning rhythm

Compared to Module 5 (decision-led adaptation), Module 6 (interpretation-led distinction), and Module 7 (system-led setup):

**Module 8 is video-led and integrative.** Its dominant learning mode is the instructional masterclass itself — watching skilled technique demonstrated at length — with judgment layered on top through one signature scenario interaction and two checkpoints, rather than a series of reveal/comparison interactions.

- **Interaction density:** low, and appropriately so — the videos already carry substantial cognitive and visual load; adding frequent interruption would work against the module's own instructional design.
- **Checkpoint placement:** both at the end, after the full video-led sequence and "Protect the Flow" — the student needs the complete picture before either checkpoint makes sense.
- **Where independent reasoning happens:** "Protect the Flow" and both checkpoints.
- **Where Cadence adds value:** service-flow and practitioner-judgment coaching — transitions, adaptation, and in-the-moment client communication, distinct from every earlier module's Cadence role.
- **Curiosity/payoff structure:** watching the complete, real service performed skillfully, then testing whether the student can preserve that same experience when something changes.
- **Module distinction:** unlike earlier modules that isolate observation, consultation, equipment, or specific techniques, Module 8 integrates those competencies into one complete service.

---

## Guided completion structure

**Estimated attentive learning time (non-video):** approximately **15–20 minutes**, clearly labeled as an estimate — this excludes video runtime, which is not yet known.

**Estimated checkpoint time:** approximately **8–12 minutes** total for both open-response checkpoints, excluding retries or network delay.

**Video runtime:** to be added once the actual installed service videos exist — not estimated here.

**Suggested hands-on practice:** one complete service rehearsal, using the appropriate service format (1-hour or 2-hour), ideally after the AIMT Service Timer is available as a practice companion. Not a required progress gate.

**Competency demonstrated:** the student can execute the service in sequence, adapt intensity and technique (particularly exfoliation) to a real presentation, communicate intentionally rather than continuously, and respond to an in-service client question without breaking the experience.

**Earlier concepts to revisit:**
- Module 1: professional scope, applied here to neck/shoulder/hand work.
- Module 4/6: observation informing technique, applied here to reading client response during the massage and exfoliation steps.
- Module 7: the physical system this service runs inside.

**Suggested course-path position:** immediately after Module 7 and before Module 9. The practitioner builds the system (Module 7), then learns the complete service and the judgment to adapt it (Module 8), then learns what happens between services (Module 9).

Pacing recorded here is an estimate, not a tested guarantee.

---

## Listen Mode notes

**Narration suitability:** the surrounding curriculum (orientation cues, guidance text, adaptation cues, the exfoliation framework, checkpoint prompts) is narration-suitable.

**Approximate narration length:** to be finalized once video runtime is known; the non-video curriculum alone is comparable to the 15–20 minute attentive-learning estimate above.

**Screen-required content:** all 12 chapter videos, "Protect the Flow," and both checkpoints.

**Video-only content:** hand placement, sectioning, movement, positioning, transitions, water technique, and physical service execution — none of this can be adequately conveyed through narration alone, by design (per "Video-led chapter architecture," this content belongs to the video, not the text).

**Captions/transcripts** provide access to spoken video content once installed, but do not substitute for the visual demonstration itself.

Listening alone must never be treated as proof of service competence. Passing both required checkpoints remains necessary; the videos remain screen-required learning regardless of Listen Mode's eventual implementation.

---

## Downloadable resource opportunity

**Not recommended at this stage.**

**Reason:** a conventional static protocol PDF would largely duplicate content that already has a stronger home elsewhere — the video masterclass (which teaches the service far better than a written protocol could), the service sequence (already fully documented in the lesson), and the future hosted AIMT Service Timer (the actual higher-value, repeated-use practice resource once it exists). Producing a duplicate worksheet or protocol sheet merely to satisfy a downloadable-resource checklist item is explicitly not authorized.

If a genuinely distinct resource opportunity emerges later (for example, something the Service Timer's own audit determines it cannot cover), it can be reconsidered at that time — not assumed here.

---

## Visual asset plan

Module 8 is intentionally media-light outside the real videos — the videos are the visual centerpiece, and this module should not compete with its own demonstrations using decorative imagery.

**Required:** approximately 12 video poster/still assets, one per video-led chapter, sourced from the actual installed instructional footage — not generated or decorative imagery. Posters are not required for the initial (non-video) implementation pass; they arrive with the real video installation (see "Implementation boundary").

| Chapter | Placement | What must be visible | Composition/crop intent | Alt-text intent |
|---|---|---|---|---|
| 1 — Aromatherapy Selection | Chapter 1 player | The three blends being presented, practitioner's hand at the client's shoulder | Close/medium, hands and product visible | Describes the presentation moment, not a clinical or diagnostic framing |
| 2 — Dry Brushing & Hair Play | Chapter 2 player | Brush/hand contact with dry hair and scalp | Medium, technique visible | Describes dry-brushing technique |
| 3 — Halo Activation & Wet Massage | Chapter 3 player | Water flow and scalp contact under the halo | Medium-wide, water and hand position visible | Describes wet massage under water flow |
| 4 — Exfoliant Application | Chapter 4 player | Applicator brush and product application, quadrant technique | Close/medium, application visible | Describes exfoliant application technique |
| 5 — Scalp Massage | Chapter 5 player | Hand technique across a scalp region | Close/medium, hand placement visible | Describes scalp massage technique |
| 6 — First Rinse | Chapter 6 player | Water flow and rinse technique | Medium, shower-head angle visible | Describes rinse technique |
| 7 — Neck & Shoulder Massage | Chapter 7 player | Hand technique at neck/shoulder | Close/medium, technique visible | Describes neck/shoulder massage technique |
| 8 — Second Rinse, Shampoo, Rinse | Chapter 8 player | Representative moment from shampoo application (most information-dense sub-step) | Medium, product/lather and hand technique visible | Describes shampoo/rinse technique; may note it represents a grouped sequence |
| 9 — Conditioning & Treatment | Chapter 9 player | Treatment/mask application or steam-hood setup | Medium, product application visible | Describes conditioning/treatment application |
| 10 — Hand Massage | Chapter 10 player | Hand/forearm massage technique | Close/medium, technique visible | Describes hand massage technique; may note 2-hour-only |
| 11 — Waterfall, Cooling Spray, Hot Towel | Chapter 11 player | Representative moment — waterfall rinse recommended as the most visually distinctive of the three grouped moments | Medium-wide, water/technique visible | Describes the grouped sensory sequence; may note it represents multiple moments |
| 12 — Towel Wrap & Close | Chapter 12 player | Towel wrap or closing conversation moment | Medium, practitioner-client interaction visible | Describes the closing moment, not a specific claim about outcome |

**Grouped chapters (8, 11, 12) may use a single representative still, or a restrained multi-frame treatment** if genuinely useful for a grouped chapter — not required to fabricate three separate posters for a three-sub-step chapter.

**No misleading diagnostic or clinical implication** in any poster's composition, caption, or alt text.

**Not recommended:** generic or generated treatment-room imagery added purely to decorate the module; illustrations that compete with the actual demonstrations for visual attention.

**Phase map:** the 7-phase orientation grid should remain native, accessible interface content (styled cards with real text) rather than a rasterized infographic image.

---

## Accessibility requirements

- **Course foundation consistency (amended, new):** Section 8.2's instructional/guidance prose uses the shared `.body-text` treatment (font, size, line-height, color, measure) rather than a bespoke Module 8 size; both checkpoints use the canonical `.checkpoint` component. See `00-global-decisions.md`'s foundation-consistency standard and "Video-led chapter architecture — AMENDED" / "Checkpoint specification" above.
- **Chapter rail/progress state (amended, new):** current, completed, and locked chapter states are each exposed as text/accessible-name information, not color alone; locked chapters are programmatically non-actionable (e.g., `disabled`/`aria-disabled`), not merely visually dimmed; the active chapter's identity is announced/available to assistive technology without requiring the rail itself.
- **Chapter position without visible "X of 12" (amended August 19, 2026):** since the visible UI no longer repeats "Chapter X of 12" text, the full ordinal position is instead exposed via an `aria-label` on the chapter-identity region (e.g., "Chapter 5 of 12 — Scalp Massage"), so screen-reader users are not shortchanged by the visual simplification. The chapter drawer's toggle button uses `aria-expanded`/`aria-controls`.
- Semantic, keyboard-operable chapter navigation (the chapter rail/list) — no plain `<div onclick>`.
- Format toggle converted to a native, keyboard-operable control with correct pressed/selected state semantics (`aria-pressed` or equivalent) and a text/icon indicator in addition to color.
- Full keyboard operability of every pre-play video trigger; visible focus on every interactive control.
- Appropriate accessible names — chapter labels are exposed as real accessible names on their respective players and navigation entries, not only as visible text on a non-semantic `<div>`.
- Chapter-specific player `title` attributes once video is installed.
- Captions/subtitles for all spoken video content once installed.
- A defined transcript/text-equivalent strategy for spoken video content (exact mechanism — inline transcript, expandable text, or linked document — is an implementation decision within these requirements, not fixed here).
- No autoplay of any kind.
- No color-only selection/state anywhere (format toggle, "Protect the Flow," checkpoint states).
- `aria-label="Speak your answer"` on both checkpoint voice buttons; `aria-label="Send response to Cadence"` on both submit buttons; `aria-live="polite"` on both `.cp-response` regions and on "Protect the Flow"'s feedback region.
- `prefers-reduced-motion` guard on any chapter-transition or expand/collapse animation (correcting the current unguarded `slideDown`, or its replacement).
- No inaccessible hidden instructional content — orientation cues, guidance text, and adaptation cues are never gated behind playing a video or expanding a control.

Do not claim manual assistive-technology QA is complete — none has been performed as part of this specification.

---

## Responsive/mobile requirements

Real phone use matters here specifically because students may reference this module near the treatment room.

- Remove the hero's hard-coded `<br>`; let the title wrap naturally at all widths.
- The one active video stage remains dominant but fits the viewport with no horizontal overflow at any width, including 375×812-class widths.
- Chapter identity (label/number) remains visible at all times, including while a video plays.
- **Chapter rail/progress on phone (amended, new):** no small, unreadable, individually-tappable twelve-segment rail — use a segmented progress indicator paired with a current-chapter text readout and a full-width, one-row-per-chapter navigable list; completed/current/locked meaning does not depend on color alone at any width.
- Orientation cues, guidance text, and adaptation cues remain concise and legible on mobile — no truncation that hides judgment-relevant content.
- Every control (format toggle, chapter rail, "Protect the Flow," checkpoints, the Timer preview) is touch-friendly at a comfortable minimum target size.
- No component in this module may introduce horizontal overflow at 375×812.
- Video posters, once installed, must not crop away the technique being demonstrated.
- **The Service Timer feature section and its 3-step preview (amended)** must remain usable on phone — contained, no horizontal overflow, controls touch-friendly.
- Completion and both checkpoints remain comfortable on mobile.

---

## Completion behavior — AMENDED August 18, 2026

**This section supersedes the original checkpoints-only completion rule.** Owner-approved change: video completion is now part of Module 8 competency, not merely a presentation upgrade.

**Required for `isModuleComplete(8)`:**

1. All 12 required instructional video chapters marked complete (genuine player completion event, once Phase 2 installs real video — see "Video-led chapter architecture — AMENDED").
2. `m8cp1` graded `passed`.
3. `m8cp2` graded `passed`.

No read-percentage minimum, no accordion-open count, no interaction-click count, no Service Timer (or Service Timer preview) use requirement. **Does not gate on:** "Protect the Flow," the format toggle, or the Service Timer preview.

**Does "Protect the Flow" gate completion:** no. It remains ungraded; it neither writes progress nor is checked at completion time.

**Approved completion-card competency language** (unchanged from the original amendment):

> **Module complete.**
> You can run the full service, adapt it when conditions change, and communicate with intention — not just recite the steps. Next: what happens between services.

**Module 9 unlock:** `APP_STATE.canAccessModule(9)` requires `isModuleComplete(8)`, which now requires all 12 video chapters complete **and** both checkpoints passed — not checkpoints alone.

**Review Mode:** unchanged for checkpoints — routes through the existing shared unsaved-test-submission path. For video-chapter state, Review Mode may use its own non-persisting inspection affordance (see "Video-led chapter architecture — AMENDED") but must never write real chapter-completion progress.

**Phase 1 implication:** because no real video exists yet, no student can complete all 12 video chapters during Phase 1 — Module 8 (and therefore Module 9) cannot be organically completed by a real student until Phase 2 installs real video. This is an accurate, expected Phase 1 state, not a defect.

---

## Semantic design

Use the course's existing shared semantic tokens — no new styling system.

- **Correct/accepted:** existing green success styling, applied to passed checkpoints and correctly-reasoned "Protect the Flow" feedback.
- **Incorrect/needs revision:** existing red/error styling, applied sparingly — "Protect the Flow" is ungraded and scenario-based, so most of its feedback is explanatory rather than pass/fail-styled.
- **Neutral/informational:** chapter orientation cues, guidance text, adaptation cues, and the Service Timer introduction card.
- **Completion:** existing completion-card styling, unchanged structurally.

Meaning is never communicated by color alone anywhere in this module — the format toggle's corrected state (text/icon plus color) is the specific fix required by this specification.

---

## Implementation boundary

Approved Module 8 implementation proceeds in two major phases, and manual approval cannot occur until both are complete.

### Phase 1 — Non-video implementation

Implement:

- approved curriculum, copy, and claims corrections (Section 8.1–8.5 content, per "Step-specific approved corrections" and "Exfoliation framework");
- the video-led chapter presentation shells (title, cue, player placeholder, guidance, adaptation cue, continuity) for all 12 chapters, with players in their current "Video coming soon" placeholder state — **player shells and slots remain present and functional throughout this phase**, exactly as Module 7's placeholder photo slots remained present through its own partial-implementation phase;
- interaction cleanup (phase map, format toggle, removal of the accordion as primary pattern, optional chapter-jump navigation);
- "Protect the Flow";
- checkpoint corrections (question parity, per-checkpoint rubrics, network-error text, accessibility);
- Cadence corrections;
- accessibility and responsive requirements not dependent on real video;
- completion/gating corrections;
- the Service Timer introduction card, presented without a functional launch control (no dead button).

**Do not install final video media during this phase.**

### Phase 2 — Video installation (final major implementation sub-step)

After Phase 1's other work is complete:

- install/wire the actual instructional videos into all 12 chapter slots;
- verify: correct chapter, correct file, correct order, correct grouped/subclip behavior, no duplicate, no missing media, poster, aspect ratio, controls, loading behavior, captions, chapter-specific labels, responsive behavior, no autoplay;
- install the 12 video posters per "Visual asset plan";
- re-run static/mocked validation with real video installed;
- perform rendered manual QA with real video installed;
- **only then** may owner manual approval occur.

**Module 8 cannot receive final owner manual approval while required service videos are absent**, regardless of how complete Phase 1's work is.

---

## Implementation acceptance criteria

Implementation is not complete until all of the following are verifiable.

**Phase 1 (non-video):**

1. All 17 step titles and all 12 chapter labels are unchanged from `module-08-source.md` §4–§5 — verified by direct string comparison, not visual inspection alone.
2. Hero eyebrow, title, and description are unchanged except for removal of the hard-coded `<br>`.
3. **(Amended)** The service-step accordion is no longer the module's primary presentation pattern; Module 8 presents one contained masterclass player showing the active chapter's orientation cue, guidance text, and adaptation cue, with the remaining 11 chapters represented in a chapter rail/progress list, not as additional full video stages — see "Video-led chapter architecture — AMENDED."
4. The 7-phase concept grid no longer displays the "Tap each phase" (or equivalent) interaction hint.
5. The format toggle has real instructional function (timing-badge emphasis tied to selection) and a non-color-only selected-state indicator.
6. Step 01's guidance and example client language reflect optional fragrance, consent-before-touch, and optional (not required) eyes-closed framing.
7. Step 05's example client language no longer references circulation, lymphatic movement, or parasympathetic activation.
8. Steps 07 and 12 each display the approved scope guardrail sentence.
9. Step 11's guidance no longer claims steam "opens the cuticle" or "drives the treatment deeper."
10. Steps 13–15's example client language no longer claims cuticle closure or a "circulatory boost."
11. Steps 16–17's note no longer claims a specific closing observation "drives rebooking."
12. Section 8.3's pressure card no longer uses the unqualified good/bad-pressure absolute framing; the temperature-safety statement is unchanged.
13. No unqualified superlative ("highest skill," "most overlooked") claim remains.
14. The exfoliation curriculum reflects an adaptable-intensity framework, not a binary present/absent framing, in Step 04's guidance.
15. The per-step "Micro-teach" label is replaced with "What you might say" (or equivalent non-mandatory framing), and the "Explain intentionally, not continuously" principle appears once, prominently, before Section 8.2.
16. "Protect the Flow" is implemented per its full specification (three scenarios, ungraded, no progress write, no persistence, no completion gate, accessible).
17. `.cp-q`/`.body-text` displayed question and `M8.questions.m8cp1`/`m8cp2` (or their replacement) are byte-identical for both checkpoints — verified programmatically.
18. `M8.systems.m8cp1` and `M8.systems.m8cp2` exist as separate rubrics; the single shared `M8.system` function no longer exists.
19. `submitM8CP` passes the approved 5th `errorMessage` argument.
20. Both checkpoint voice buttons carry `aria-label="Speak your answer"`; both submit buttons carry `aria-label="Send response to Cadence"`; both `.cp-response` regions carry `aria-live="polite"`.
21. `M8.systems.*`/`MODULE_GUIDE_SYSTEMS[8]` no longer contain "HeadSpa Mastery," the "nearly two decades" personal-experience claim, or the rebooking-causation claim.
22. `MODULE_QUICK_PROMPTS[8]` matches the three approved prompts exactly.
23. **(Amended)** All 12 video-chapter positions and `STEP_VIDEO_IDS` entries remain present in the data model (showing the existing placeholder state when active) throughout this phase — none removed, consolidated, or replaced with static imagery; only one chapter's player renders/is active in the DOM at a time, per "Video-led chapter architecture — AMENDED."
24. The Service Timer introduction card is present with no functional launch control (no dead button).
25. The completion card no longer contains "You know the map" as an unconditional claim and instead uses the approved replacement copy.
26. Module 9 unlock behavior is unaffected (still requires both `m8cp1` and `m8cp2` passed).
27. No regression to Modules 0–7: reopening each confirms byte-identical content and unaffected checkpoint/progress state.
28. Mobile viewport (375×812) shows no horizontal overflow across the chapter sequence, format toggle, "Protect the Flow," and both checkpoints.
29. Review Mode continues to route Module 8 checkpoint test submissions through the existing unsaved test path.
30. `prefers-reduced-motion` guard exists on any chapter-transition/expand animation.

**Phase 1 remediation acceptance criteria (added August 18, 2026 — owner-directed amendment):**

R1. Section 8.2's instructional/guidance prose uses the shared `.body-text` treatment — verified by class/computed-style comparison, not visual inspection alone.
R2. Both checkpoints use the canonical `.checkpoint`/`.cp-head`/`.cp-av`/`.cp-q`/`.cp-row`/`.cp-res` component structure, matching Modules 5, 6, and 7; the pre-audit `.cp-box`/`.cp-response` pattern is no longer used by Module 8.
R3. Only one video stage renders/is active at a time; all 12 chapter identities and `STEP_VIDEO_IDS` entries remain present in the underlying data/navigation.
R4. A chapter rail/progress indicator exposes current, completed, and locked state via text/accessible name, not color alone; locked chapters are not clickable/reachable in normal student mode.
R5. A video-chapter-completion state architecture exists (12 individually identifiable chapter-completion flags per module, persisted the same way checkpoint state is persisted, respecting Review Mode's unsaved behavior) even though no chapter can organically complete until Phase 2 installs real video.
R6. `isModuleComplete(8)` requires all 12 video chapters complete **and** both checkpoints passed; `canAccessModule(9)` reads this combined state.
R7. No normal-student-mode control can mark a chapter complete without a genuine completion event; any Review-Mode-only inspection affordance is explicitly gated and writes no real progress.
R8. The Service Timer section is a substantial feature presentation (not a small informational card) containing a functional, contained ~3-step preview (start/active step/countdown/pause/resume/end state) with no fake "Open Full Service Timer" control.
R9. No regression to the approved Section 8.2 step-specific corrections, "Protect the Flow," Cadence identity, or claims corrections already implemented in the first Phase 1 pass.

**Second Phase 1 remediation acceptance criteria (added August 19, 2026 — owner-directed amendment):**

R10. Hero headline reads "Master the flow, not the script."; hero description reflects service-flow/adaptation framing, not a checklist framing.
R11. Visible "17 steps"/"all 17 steps"/equivalent fixed-count phrasing is substantially reduced across Module 8's copy (hero, 8.1, 8.2, Service Timer feature); the underlying 17-step numbering and 12-chapter data model, and all existing step/chapter titles, are unchanged.
R12. The masterclass renders as one visually cohesive shell — chapter identity, video, guidance, and Prev/Next controls inside a single container, not separate competing boxes.
R13. The chapter list is a collapsed-by-default drawer, secondary to the video; no "Chapter X of 12" text is visibly repeated outside the drawer (a bare chapter numeral is visible; full position is exposed via `aria-label`).
R14. The Timer preview visually and functionally derives from the real prototype (dark Timer-native palette distinct from Module 8's own card chrome, ring countdown, running timeline, step label/title/description/note, pause overlay, back/skip bottom bar) — confirmed against `~/Downloads/AIMT-Service-Timer-clean.html`.
R15. No regression to any acceptance criterion in the original list (1–30) or the first remediation pass (R1–R9).

**Phase 2 (video installation) — blocks manual QA and manual approval until met:**

31. All 12 chapters have the correct video installed, in the correct order, with correct grouped/subclip behavior, no duplicate, no missing media.
32. No autoplay anywhere; a click starts only its own chapter's video.
33. Each installed video has a chapter-specific accessible `title`.
34. Captions/subtitles are present for spoken content in every installed video.
35. All 12 posters are installed per "Visual asset plan," sourced from real footage.
36. Responsive playback confirmed at 375×812 and desktop widths with no overflow and no cropped-away technique.
37. Static/mocked validation and rendered manual QA are both re-run with real video installed before any manual-approval status is recorded.

No implementation task may mark Module 8 "Implemented — manual QA approved" while acceptance items 31–37 remain unmet.

---

## Implementation notes

- The video-led chapter shell (title, cue, player, guidance, adaptation cue, continuity) is specified once with a worked example (Chapter 5) rather than fully rewritten for all 12 chapters in this document — implementation should apply the same shell and re-weighting rule to the remaining 11 chapters, preserving all curriculum content not explicitly corrected above.
- The chapter-jump navigation is an optional wayfinding aid, not a required element — if implementation finds the video-led sequence sufficiently navigable without it (e.g., because the page is not excessively long once player shells are sized appropriately), it may be omitted without violating this specification.
- Do not silently reintroduce the removed physiological, business-outcome, or superlative claims during implementation "for flavor" — their removal is a deliberate audit decision, not an oversight to be reversed.
- The August 18, 2026 amendment (masterclass single-player, video completion requirement, checkpoint/typography foundation match, Service Timer feature promotion) is owner-directed and supersedes the corresponding original Phase 1 design decisions above; it does not reopen or change the curriculum/claims corrections, "Protect the Flow," or Cadence corrections from the original specification.
- The August 19, 2026 amendment (hero/copy step-count reduction, cohesive masterclass shell with a collapsed chapter drawer, Timer preview visual/functional fidelity to the real prototype) is likewise owner-directed and supersedes only the specific design decisions it names; it does not reopen curriculum, claims, checkpoints, Cadence, or the video-completion requirement.
- Do not begin Module 9 extraction, implementation, or any certificate/completion-flow work as a result of this specification.
- Do not install, link, or modify the AIMT Service Timer as a result of this specification — it remains a separately audited future tool; only its introductory card (with no functional launch control) belongs to this module's implementation.
- Implementation of this specification is a separate, later task. Phase 1 may proceed independently; Phase 2 (video installation) and everything after it (static/mocked validation with real video, rendered manual QA, owner manual approval) are explicitly blocked until Phase 1 is complete and the real service videos are available to install.
