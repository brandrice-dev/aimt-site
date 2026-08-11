# Module Audit Index

Tracks per-module audit progress. Each module gets a `module-XX-source.md`
(verbatim extraction) and a `module-XX.md` (approved specification, filled
in only after external audit). See [`../00-global-decisions.md`](../00-global-decisions.md)
for the decisions every module spec must be checked against.

## Approved student-facing course sequence

Per [`../00-global-decisions.md`](../00-global-decisions.md#course-sequence--final-exam-module-12):

- **Welcome Module** (technical module ID `0`)
- **Modules 1–11** — instructional curriculum
- **Module 12 — Final Exam** — demonstrates course-wide competency before
  certification is issued

Technical module IDs, wrapper IDs, and state keys are not renumbered by this
sequence — only student-facing labels change. Module 12's technical
implementation is undetermined until Module 11 and the certificate flow are
audited.

## Required fields for every future module audit

Per [`../00-global-decisions.md`](../00-global-decisions.md#guided-completion-path),
every `module-XX.md` from this point forward must document a "Guided
completion structure" section containing:

- Estimated learning time
- Estimated hands-on or application time
- Competency demonstrated
- Suggested practice or application task
- Earlier concepts that should be revisited
- Suggested position in the Guided Completion Path

Pacing recorded in these fields must lead toward completion of the Module 12
Final Exam, not merely completion of the instructional modules.

Every `module-XX.md` from this point forward must also document a "Listen
Mode notes" section (introduced starting with the Module 1 audit)
containing: whether narration is appropriate, which sections need
visual-review cues, which content should remain video-only, and an
approximate narration length. No Listen Mode UI or logic is authorized by
documenting these fields — see each module's source file for the
first-pass content assessment.

Every `module-XX.md` from this point forward must also document a
"Downloadable resource opportunity" section (introduced starting with the
Module 4 audit — see
[`../00-global-decisions.md`](../00-global-decisions.md#downloadable-resource-principle)
for the full rule). Downloadables are **selective, not mandatory** — this
section may simply conclude `None recommended`. When a resource is
genuinely useful, record the proposed resource, its practical value,
recommended file format, recommended placement in the lesson, and
recommended placement in the future dashboard resource folder. Building the
dashboard resource folder or any download system is not authorized by
documenting this section.

## Module 0 — Welcome Module (technical module ID `0`)

| Field | Value |
|---|---|
| Student-facing name | **Welcome Module** (never displayed as "Module 0") |
| Source file | [`module-00-source.md`](module-00-source.md) |
| Approved specification file | [`module-00.md`](module-00.md) |
| Wrapper ID | `module0Wrap` |
| Checkpoint IDs | `m0cp1` |
| Current completion requirement | Single checkpoint `m0cp1` must be graded `passed` (no read-percentage minimum) |
| Guided completion structure | Recorded in `module-00.md` — position: first, precedes Module 1 and the Module 12 Final Exam |
| **Status** | **Implemented — manual QA approved** |

Manual QA confirmed correct behavior and appearance for the intro sequence,
the module identity/hero, the "Same steps. Different service." predict-
then-reveal interaction, the checkpoint (`m0cp1`), and the completion
card — across desktop and phone layouts. See Step 28 in
`implementation-log.md`. Deferred, not resolved by this pass: live-model
grading behavior, screen-reader testing, physical-keyboard activation
testing, and real touch-device verification.

## Module 1 — Role of the Head Spa Technician

| Field | Value |
|---|---|
| Student-facing name | **Module 1** (unchanged — Welcome Module naming applies only to technical module `0`) |
| Source file | [`module-01-source.md`](module-01-source.md) |
| Approved specification file | [`module-01.md`](module-01.md) |
| Wrapper ID | `module1Wrap` |
| Checkpoint IDs | `m1cp1`, `m1cp2` |
| Current completion requirement | Both checkpoints must be graded `passed` (no read-percentage minimum) |
| Guided completion structure | Recorded in `module-01.md` — position: foundation block, immediately after the Welcome Module |
| Listen Mode notes | Recorded in `module-01.md` — narration approved as a strong candidate, ~8–10 minutes |
| **Status** | **Implemented — manual QA approved** |

Manual QA confirmed correct behavior and appearance for the module
identity/hero, the license-dependent scope framing, the "Where is the
line?" four-scenario interaction, both checkpoints (`m1cp1`, `m1cp2`), and
the completion card — across desktop and phone layouts. See Step 28 in
`implementation-log.md`. Deferred, not resolved by this pass: live-model
grading behavior, screen-reader testing, physical-keyboard activation
testing, and real touch-device verification (touch-target sizing in
particular was never measured against a specific minimum).

## Module 2 — Welcoming Your Client

| Field | Value |
|---|---|
| Student-facing name | **Module 2** (unchanged — Welcome Module naming applies only to technical module `0`) |
| Source file | [`module-02-source.md`](module-02-source.md) |
| Approved specification file | [`module-02.md`](module-02.md) |
| Wrapper ID | `module2Wrap` |
| Checkpoint IDs | `m2cp1` |
| Current completion requirement | Single checkpoint `m2cp1` must be graded `passed` (no read-percentage minimum) |
| Guided completion structure | Recorded in `module-02.md` — position: client-experience foundation, immediately after Module 1 |
| Listen Mode notes | Recorded in `module-02.md` — narration approved as a partial candidate (after timeline content is made available independent of accordion state), ~9–11 minutes |
| **Status** | **Implemented — manual QA approved** |

Implemented per `module-02.md`. Module 2 has three ungraded interactive
components beyond its required checkpoint (accessible arrival accordion
labeled 2.1–2.5, a retryable "what breaks the moment" judgment check, and
an AI-evaluated script builder) plus a static "Same service. Different
beginning." comparison that replaced the removed feeling slider — see
`module-02.md` for the approved behavior and `module-02-source.md` §5 and
§11 for the prior-state accessibility/interaction concerns that were
corrected.

## Module 3 — Hair & Scalp Anatomy

| Field | Value |
|---|---|
| Student-facing name | **Module 3** (unchanged — Welcome Module naming applies only to technical module `0`) |
| Source file | [`module-03-source.md`](module-03-source.md) |
| Approved specification file | [`module-03.md`](module-03.md) |
| Wrapper ID | **None** — Module 3 is the default `.lesson-wrap` content captured into `module3HTML` at page load, not a hidden `moduleNWrap` template like every other module (see the source extraction, §1) |
| Checkpoint IDs | `cp1`, `cp2` — bare IDs, not the `mNcpX` pattern every other module uses |
| Current completion requirement | Both checkpoints must be graded `passed` (no read-percentage minimum) |
| Guided completion structure | Recorded in `module-03.md` — position: fourth, technical foundation immediately before Module 4 assessment and microscopy |
| Listen Mode notes | Recorded in `module-03.md` — narration approved for most prose, ~14–17 minutes; the five-layer map and supplied cross-section require structured visual-review cues |
| **Status** | **Implemented — manual QA approved** |

Implemented per `module-03.md`. Notable implemented corrections: the
approved headline "The scalp is not a backdrop. It is the environment
everything depends on."; a corrected five-layer scalp map (skin, dense
connective tissue, galea aponeurotica, loose areolar tissue, pericranium)
replacing the removed inline SVG; the supplied
`assets/images/course/module-03/aimt-scalp-cross-section.png` (plus a new
web-optimized `aimt-scalp-cross-section.webp` derivative, served via
`<picture>`) used in the pilosebaceous-unit section with the approved alt
text, caption, and a keyboard-accessible full-size link — not presented as
a complete five-layer diagram; a new ungraded "Anatomy to Action" visual
explorer (four accessible accordion controls) and a predict-then-reveal
hair-cycle timing interaction, both non-persistent; `cp1` moved to the
module's midpoint immediately after the timing interaction, with `cp2`
remaining at the end — both with displayed and evaluated question strings
aligned and separate `M3.systems.cp1`/`M3.systems.cp2` evaluator rubrics;
removal of the nonfunctional video placeholder, the duplicate/conflicting
quick-prompt sets (one dynamic `MODULE_QUICK_PROMPTS[3]` source now
authoritative), and the malformed hidden completion markup and duplicate
dead button; and the same course-name/Cadence-identity/accessibility
corrections already applied to the Welcome Module and Modules 1–2. See
`module-03-source.md` §13 for the full list of pre-existing findings this
implementation resolves.

Manual QA also confirmed two narrowly scoped corrections from Step 19: the
exogen phase-dot now reads `4` (matching the numbered 1–2–3 sequence for
anagen/catagen/telogen, replacing the earlier `+` symbol), and the
predict-before-reveal "The delay tells the story" interaction now labels
the correct answer with a literal `"Correct answer"` text tag and the
student's incorrect selection with `"Not quite"` — correctness is no longer
communicated by color alone. See Step 19 in `implementation-log.md`.

**Still deferred to later production QA (not resolved by manual pass):**
live-model grading behavior against the `cp1`/`cp2` rubrics, screen-reader
testing (VoiceOver/NVDA), physical-keyboard activation testing, real
touch-device verification, and medical subject-matter review of the
corrected shedding/barrier/massage claims.

## Module 4 — Microscopy & Scalp Assessment

| Field | Value |
|---|---|
| Student-facing name | **Module 4** (unchanged — Welcome Module naming applies only to technical module `0`) |
| Asset inventory | [`module-04-assets.md`](module-04-assets.md) — 5 examination-area images, 5 microscopy images |
| Source file | [`module-04-source.md`](module-04-source.md) |
| Approved specification file | [`module-04.md`](module-04.md) — full approved specification |
| Wrapper ID | `module4Wrap` — standard hidden-template pattern (not the Module-3-style capture outlier) |
| Checkpoint IDs | `m4cp1`, `m4cp2` — standard `mNcpX` pattern |
| Current completion requirement | Both checkpoints must be graded `passed` (no read-percentage minimum) |
| **Status** | **Implemented and manually approved** |

Implemented per `module-04.md`. Replaced the five-region colored-dot grid
with an accessible five-point scalp-scan stepper (real photos, previous/
next controls, direct station selection, announced current station);
replaced the five scalp-type protocol cards with an illustrative
appearance-examples gallery (baseline, oil-dominant, fine-scale,
visible-color-change, surface-residue) plus a dedicated oil-versus-residue
comparison section; added a new ungraded "Say only what the image earned"
five-statement classification interaction; added the five-observation-lens
framework and the four-decision (preserve/modify/avoid/refer) framework;
rewrote the do-not-proceed section as four grouped warning categories with
the approved referral script and a device-contamination note; realigned
both checkpoints' displayed and evaluated question strings (same pattern
already corrected in Modules 1–3) with new checkpoint-specific
`M4.systems.m4cp1`/`M4.systems.m4cp2` evaluator rubrics (replacing the one
shared generic `M4.system`); corrected the Cadence guide system and
module-open greeting (old course name and personal-experience claim
removed, "dry scalp vs dandruff" removed, replaced with the approved
visible-feature → missing-context → cosmetic-implication → limit
framing); and applied the same course-name/accessibility corrections
already used in Modules 0–3. See `implementation-log.md` for the full
step entry, including deferred manual QA items.

Manual QA (Step 26) confirmed desktop and phone layouts; the five-point
scalp-assessment controls (direct assessment-point selection, previous/
next navigation, image enlargement); mobile readability and horizontal
overflow; the observation-classification interaction and its correct/
not-quite states; the appearance gallery; the oil-versus-residue
comparison; `m4cp1`; `m4cp2`; Cadence prompts and responses; the
completion card; Module 5 unlock behavior; Module 4 terminology; and
Module 1 semantic red/green baseline consistency. See Step 26 in
`implementation-log.md`.

**Still deferred to later production QA (not resolved by manual pass):**
live-model grading behavior against the `M4.systems.m4cp1`/`m4cp2`
rubrics, screen-reader testing (VoiceOver/NVDA), physical-keyboard
activation testing, real touch-device verification, medical/
dermatological subject-matter review of Module 4's device-framing and
referral language, privacy/legal review of the image-consent workflow, and
future replacement of the illustrative microscopy assets with
authenticated, consented, de-identified clinical captures.

## Module 5 — Scalp Patterns & Service Adaptation

| Field | Value |
|---|---|
| Student-facing name | **Module 5** (unchanged — Welcome Module naming applies only to technical module `0`) |
| Source file | [`module-05-source.md`](module-05-source.md) — full verbatim extraction |
| Approved specification file | [`module-05.md`](module-05.md) — full approved specification, including the visual asset addendum |
| Asset inventory | [`module-05-assets.md`](module-05-assets.md) — 5 source photographs, 4 teaching-moment placements |
| Wrapper ID | `module5Wrap` — standard hidden-template pattern |
| Checkpoint IDs | `m5cp1`, `m5cp2` — standard `mNcpX` pattern |
| Current completion requirement | Both checkpoints must be graded `passed` (no read-percentage minimum) |
| **Status** | **Implemented — manual QA approved** |

Extracted per Step 27. No asset inventory file was created — Module 5
currently contains zero real image/diagram/video/downloadable assets; every
"photo" slot renders a decorative placeholder graphic with no underlying
file (`module-05-source.md` §7).

Notable findings recorded in the extraction (not fixed at extraction time):
Module 5's displayed and evaluated checkpoint questions did not match for
both `m5cp1` and `m5cp2` (same pattern already corrected for Modules 1–4);
`M5.system` was a single shared rubric for both checkpoints rather than the
per-checkpoint `M5.systems.mNcpX` structure Modules 1–4 use; `submitM5CP`
supplied no module-specific network-error text; both checkpoints' voice and
submit buttons lacked `aria-label` and both `.cp-res` regions lacked
`aria-live`, all already present in Modules 0, 1, and 4; `M5.system` still
said "instructor of HeadSpa Mastery" and `MODULE_GUIDE_SYSTEMS[5]` still
framed Cadence as personally "a mentor built from nearly two decades in the
head spa industry" — the old-name and personal-experience-claim patterns
already corrected out of Modules 0, 1, 2, and 4; the curriculum, rubric, and
a quick prompt all taught "compensatory oil production" and
follicular-congestion-impairs-hair-growth as settled fact, both claims
Module 4's own approved spec explicitly required removing for lacking
support; the "↓ Tap each type to see the protocol" hint had no
corresponding interactive behavior; and Module 5 had no explicit
stop-service/refer-out section, unlike Module 1 and Module 4. See
`module-05-source.md` for the complete pre-audit findings list.

**Approved specification added.** `module-05.md` now carries the externally
reviewed, approved specification, approved title **Scalp Patterns & Service
Adaptation**, status **Approved for controlled implementation**, source
reviewed `module-05-source.md`. Major approved corrections: replace the
fixed five-scalp-type labels with current scalp patterns and service
directions; align with Module 4's regional observation framework; remove
the unsupported compensatory-oil, follicular-obstruction, hair-growth,
universal baseline-color, percentage, diet, and diagnostic claims; remove
the dead "Tap each type" hint and the eight fake microscopy placeholders;
add the ungraded "What changes first?" protocol-decision interaction;
replace the shared rubric with checkpoint-specific rubrics for `m5cp1` and
`m5cp2`; correct the displayed/evaluated question mismatch for both
checkpoints; correct Cadence's identity (remove the old course name and the
personal-practitioner-experience claim) and quick prompts; add accessibility
labels/live-region requirements and the shared semantic-color tokens; and
add the required Guided Completion Path and Listen Mode fields.

**Implemented per `module-05.md`.** `headspa-mastery.html` was updated:
Module 5's title/subtitle/hero now read "Scalp Patterns & Service
Adaptation" everywhere (dashboard, lesson nav, hero eyebrow, Cadence
prompts); the five permanent "scalp type" cards, the eight fake microscopy
placeholders, and the dead "Tap each type" hint were removed; the module now
follows the approved section order (5.1–5.10) — protocol-is-a-decision
framing, the five service levers, the priority order (safety limit → client
comfort/reactivity → surface tolerance → visible cosmetic need → client
preference), the five service-direction pattern cards (A–E), the new
ungraded "What changes first?" four-scenario decision interaction, the
regional preserve/modify/avoid/pause/refer builder, product-category
decisions, steam/water/pressure/time, client-communication scripts, and the
eight-item common-mistakes list; `M5.questions`/`M5.systems.m5cp1`/
`M5.systems.m5cp2` replaced the single shared `M5.system` rubric, with the
displayed and evaluated question strings verified byte-identical for both
checkpoints; `submitM5CP` now passes the approved Module 5 network-error
text; `MODULE_GUIDE_SYSTEMS[5]` and `MODULE_QUICK_PROMPTS[5]` were replaced
with the approved Cadence identity (no more "HeadSpa Mastery" or "nearly two
decades" personal-experience claim) and the three approved quick prompts;
`aria-label`/`aria-live` were added to both checkpoints' voice/submit
buttons and feedback regions; the shared Module-1-baseline semantic color
tokens (`var(--aimt-success)`/`var(--aimt-error)`/`var(--aimt-warning)`)
replaced the pre-baseline red; and the confirmed-dead `window._m5cpsDone`
assignment was removed (repository-wide search found no reads). Checkpoint
IDs, the wrapper ID, the completion-card ID, the Module 4 prerequisite, and
the Module 6 unlock relationship are all unchanged. This is a
static-and-mocked-validation pass only — see `implementation-log.md` for
the full test list. Module 5 is not yet marked manually approved.

**Visual re-audit completed.** `module-05.md` gained an approved "Amendment
— Module 5 visual asset addendum" adding five real source photographs as
four teaching moments (regional crown/hairline comparison, targeted crown
cleansing, gentle hairline adaptation, and a client-communication scene);
[`module-05-assets.md`](module-05-assets.md) was created recording the full
file inventory. Optimized WebP production derivatives (1360×1020,
downscaled from the 1448×1086 sources, no upscaling) were generated under
`assets/images/course/module-05/` and integrated into `headspa-mastery.html`
at the four approved placements, in a large editorial case-study spread and
full-width photo breaks — deliberately not Module 4's five-point stepper,
appearance gallery, or card-grid treatment. Every image uses `<picture>`
with a WebP source and PNG fallback, explicit `width`/`height`, `loading="lazy"`,
a real `<figcaption>`, and non-diagnostic alt text. The approved
downloadable resource (`AIMT Regional Service Adaptation Guide`) remains
recommended with production deferred — nothing was created or linked. Module
5 remains **Implemented — awaiting manual QA**.

**Manual QA polish (Steps 32–34).** Three focused corrections came out of
manual QA before approval: the standalone post-checkpoint `5.10 — Recap`
section was removed, with its strongest line preserved as new supporting
copy inside the `m5Complete` completion card (Step 32); each of Section
5.9's eight common-mistake cards gained an approved "Better move"
corrective line (Step 33); and the "What changes first?" interaction's
answer-reveal behavior was finalized so an incorrect selection never
reveals, highlights, or tags the approved answer — only the selected
option receives a state, each of the 8 wrong choices shows its own
approved "Not quite." explanation, and the approved answer only turns
green with its "Correct." explanation once actually selected (Step 34).

**Manually approved August 8, 2026.** The owner reviewed the updated
`course-audit-build` branch preview and approved Module 5. See Step 35 in
`implementation-log.md` for the full manual-QA record and the deferred
items (live-model grading/Cadence QA, screen-reader QA, physical-keyboard
QA, real touch-device QA, medical/dermatological review, legal/scope
review). Module 5 status is now **Implemented — manual QA approved**.
Modules 0–5 are approved; Modules 6–11 remain pending.

**Video-source created (Step 36).**
[`docs/course-video-sources/module-05-video-source.md`](../../course-video-sources/module-05-video-source.md)
is now the approved primary authority for a future, separately scoped
video-production task — status **Approved for video production**. This
completes lifecycle step 9 for Module 5. The current gate is Module 6
source extraction; Module 6 extraction has not begun.

## Module 6 — Conditions & Disorders

| Field | Value |
|---|---|
| Student-facing name | **Module 6** (unchanged — Welcome Module naming applies only to technical module `0`) |
| Source file | [`module-06-source.md`](module-06-source.md) — full verbatim extraction |
| Approved specification file | [`module-06.md`](module-06.md) — full approved specification |
| Wrapper ID | `module6Wrap` — standard hidden-template pattern |
| Checkpoint IDs | `m6cp1`, `m6cp2` — standard `mNcpX` pattern |
| Current completion requirement | Both checkpoints must be graded `passed` (no read-percentage minimum) |
| **Status** | **Implemented — manual QA approved** |

**Manual QA approved (August 10, 2026).** Approval combined Claude's independent source/configuration verification against every acceptance criterion in `module-06.md` (section numbering, title consistency, checkpoint question parity and per-checkpoint rubrics with their immediate-correction triggers, accessibility labels/live regions, the `scope-awareness` memory-tag removal, Cadence identity and quick-prompt text, the standalone Section 6.6 referral section/script, "Sort three presentations," the ketoconazole 1%-only correction and scope note, removal of the numeric heat/sebum claim, the Section 6.3 overlap/ambiguity note, the full "Follow the cycle" progressive-sequence behavior, `window._m6cpsDone` removal, Module 7 gating, and a source-level regression smoke test of Modules 0–5) with the owner's own authenticated rendered-preview review on the `course-audit-build` branch preview — desktop visual quality, AIMT quality/tone, the Section 6.3 Visual 1 illustration, the comparison toggle, "Follow the cycle," the three real-time scenario cards, the spectrum slider, the Section 6.6 referral presentation, "Sort three presentations," and Sections 6.7/6.8 — all reported passing with no remaining blocker.

**Section 6.3 Visual 1 — explicitly owner-approved.** Claude's independent review flagged the installed illustration as more photorealistic than the "non-diagnostic illustration/diagram... not styled as clinical microscopy and not photography" the visual asset plan calls for, and raised it as a likely blocker pending the owner's own judgment. The owner reviewed the same image directly on the authenticated preview and explicitly approved it as installed, with its embedded non-diagnostic caption/labeling unchanged — no replacement required.

**Honestly still deferred, not resolved by this approval:** live-model checkpoint grading QA (`m6cp1`/`m6cp2` were verified by rubric/config inspection and the existing mocked-`callAI` validation from Steps 39–41, not by exercising the real model), live Cadence response QA (verified by source inspection only), screen-reader QA, physical-keyboard QA, and real touch-device QA. See `00-aimt-current-course-status.md`'s "Deferred review" for the complete list.

**Current gate is now Module 6 video-source creation** (lifecycle step 9) — Module 7 source extraction remains prohibited until that file exists.

### Prior task (unchanged, recorded for continuity)

**Student-facing language + scenario-block polish (narrow quality pass, August 10, 2026).** Owner review flagged implementation-created microcopy reading as generic/AI-written rather than AIMT's practitioner-education standard. All four instances of bare rating language ("Weak call," "Strong call," "Correct call," "Stronger approach" — all confined to the Section 6.4 "What this looks like in real time" block) are removed. That block was redesigned from a three-sentence paragraph dump into three consistently structured scenario cards (Presentation / Likely direction / What this changes / Service direction), using the approved replacement copy, remaining static content. The "Follow the cycle" final "Where do you break the cycle?" decision's state tag and feedback lead-in now read "Breaks the cycle" / "Keeps the cycle going" instead of a generic "Correct answer"/"Not quite," while its specific explanatory feedback is unchanged in substance. The remaining three interactions and Cadence were reviewed and found already compliant — no further changes were needed there, and the approved "Correct."/"Not quite." pattern used by "Sort three presentations" was left in place per instruction. A bounded comparison against "Approved outcomes," "Practitioner insider value," and "Distinct learning rhythm" in `module-06.md` found no undersold teaching, no lost insight, and no unauthorized terminology — this was implementation microcopy only, so `module-06.md` itself required no edit. Re-verified: checkpoint parity, completion/gating, Module 7 lock/unlock, Review Mode's unsaved path, and mobile overflow (375×812) all intact; Visual 1 remains installed and responsive. See Step 41 in `implementation-log.md`. Module 6 status is unchanged — still **Implemented — awaiting manual QA**.

### Prior task (unchanged, recorded for continuity)

**Visual 1 installed + Section 6.4 upgraded (narrow implementation polish, August 10, 2026).** Two items completed against the prior task's one blocker and one deliberate refinement: (1) the user-supplied Visual 1 asset (`assets/images/course/module-06/module-06-dry-scalp-vs-dandruff-illustration.png`, plus a generated `.webp` performance derivative) is now wired into Section 6.3 via `<picture>`, alongside the `.vs-card` cards, with the mandated alt text — the two Section 6.3 placeholders remain removed and are now actually replaced, closing out acceptance criterion #25; (2) Section 6.4's static six-step cycle was replaced with **"Follow the cycle,"** a progressive causal-sequence interaction — the six approved steps, unchanged in content and order, unlock one at a time as the student activates each in turn (no skipping ahead on first pass; explored steps stay freely reviewable), and a "Where do you break the cycle?" applied-decision card appears only once all six are explored (approved answer: reassess the presentation before choosing the product direction; text-based correct/incorrect feedback; unlimited reselection; built on the same pattern as `m5Decide`/`m6Sort`). Module 6's ungraded-interaction count is now **four**, each with a distinct instructional job (distinguish / sequence+apply / observe a continuum / decide+apply). `docs/course-audit/modules/module-06.md` was narrowly amended — not re-audited — to document this refinement (see its "Post-implementation amendment" note); curriculum content, checkpoints, Cadence, completion/gating, and every other approved decision are unchanged. Verified: no `APP_STATE`/`localStorage` writes from the new interaction, full state reset on module reopen, mobile viewport (375×812) overflow-free for both the image and the interaction, and all prior regression items (question parity, mocked checkpoint paths, completion gating, Module 7 unlock, Review Mode's unsaved path, Cadence quick prompts) re-confirmed intact. See Step 40 in `implementation-log.md`. **All Module 6 implementation acceptance criteria in `module-06.md` now pass** — Module 6 is implemented and this status is confirmed, though still **not manually QA'd and not manually approved.**

### Prior task (unchanged, recorded for continuity)

**Implemented (August 9, 2026).** `headspa-mastery.html` was updated per `module-06.md`: section order now runs 6.1 → 6.2 (new) → 6.3 → 6.4 (static) → `m6cp1` → 6.5 → 6.6 (new, standalone referral) → signature interaction ("Sort three presentations," new) → 6.7 → 6.8 (static) → `m6cp2` → completion, with the hero eyebrow/home-row/`MODULE_TITLES[6]` all standardized on "Conditions & Disorders." The `.cycle-step` and `.trigger-item` click-to-reveal mechanics were removed and their content rendered as static, always-visible copy; the `.vs-card` comparison toggle was converted to native `<button>` elements with `aria-expanded`; the spectrum slider gained an `aria-label` and its position-4 text now points to Section 6.6 instead of being the module's only referral sentence. All approved curriculum corrections were applied, including full removal of the numeric sebum/temperature claim (no replacement figure), the 1%-strength-only ketoconazole correction, and the softened diet/stress/dandruff-mechanism language. `M6.system` (one shared rubric) was replaced with `M6.systems.m6cp1`/`m6cp2`; both checkpoints' displayed and evaluated question strings were verified byte-identical programmatically; `submitM6CP` now passes the approved network-error text; `MODULE_GUIDE_SYSTEMS[6]`, `MODULE_QUICK_PROMPTS[6]`, and the module-open greeting were replaced with the approved Cadence copy; `MODULE_MEMORY_TAGS[6]` (`assets/js/headspa-state.js`) dropped the unreachable `scope-awareness` tag; the dead `window._m6cpsDone` assignment was removed. **Blocked:** the required Visual 1 non-diagnostic comparative illustration for Section 6.3 does not exist as a production asset — it was not fabricated, generated, or substituted with unrelated imagery; Section 6.3 currently ships without it, and the two Section 6.3 placeholders plus the two Section 6.5 placeholders were all removed per the approved disposition (6.5's needed no replacement). Static validation (JavaScriptCore syntax parse of all inline `<script>` content, tag-balance and duplicate-ID checks, programmatic question-parity check) and mocked/browser validation (Course Review Mode on a local static server, `callAI` mocked for pass/weak/network-failure paths, completion gating and Module 7 unlock confirmed, mobile viewport confirmed overflow-free) both passed — see Step 39 in `implementation-log.md` for the full record and the deferred QA list. Module 6 is implemented but **not yet manually QA'd and not manually approved.**

### Prior task (unchanged, recorded for continuity)

**Approved specification added (August 8, 2026).** `module-06.md` now carries the externally reviewed, approved specification, approved title **Conditions & Disorders** (resolved the "Common Conditions & Disorders" hero-eyebrow drift by standardizing on the home-row/`MODULE_TITLES[6]` wording), status **Approved for controlled implementation**, source reviewed `module-06-source.md`. External evidence (AAD, DermNet, a 2015 comprehensive dandruff/seborrheic-dermatitis review, Cunliffe et al. 1970 on sebum/temperature, and current OTC/prescription ketoconazole concentration data) was used to verify factual claims before writing corrections — full citations recorded in the spec's "Research and evidence sources" section.

Major approved decisions: the core dry-scalp-vs-dandruff distinction and the dandruff-to-seborrheic-dermatitis "spectrum" concept are both scientifically supported and were kept, with overstated single-cause mechanisms softened to the multifactorial framing the evidence supports; diet and stress trigger claims were softened to match weaker/more-individual evidence. A new Section 6.2 ("What you can and cannot conclude from appearance alone") and a new standalone, always-visible Section 6.6 ("When to pause or refer," with an approved referral script) were added, resolving the missing-6.2 gap and the previously-buried referral sentence in one move. A new signature ungraded interaction ("Sort three presentations" — proceed/modify/refer triage) was added. Both checkpoints were kept as genuinely distinct competencies, with question-parity fixed, per-checkpoint rubrics added, module-specific network-error text added, and checkpoint placement changed to a two-stage mid/end structure. The unreachable `scope-awareness` memory tag was resolved by removal (redundant with the already-working `referral-judgment` tag) rather than by adding a duplicate regex branch.

**Same-day re-audit, before the commit was pushed, corrected four items:** the "10% per 1.8°F" sebum/temperature statistic was re-examined against its primary source's actual limitations (9 subjects, forehead not scalp, surface excretion not production, the authors' own alternative explanation) and **removed** from student-facing curriculum rather than further hedged — no numeric replacement was substituted. The ketoconazole evidence was upgraded from commercial retail sources (GoodRx/Drugs.com) to primary DailyMed/FDA labeling, correcting the 2%-strength indication description and adding an explicit "a product-category recommendation is not a diagnosis and not a prescription" scope statement to Section 6.7. The visual asset plan was re-opened and now gives each of the four existing placeholder slots an explicit, final disposition — two are replaced with a **required** non-diagnostic comparative illustration in Section 6.3, and two are **removed** from Section 6.5 with no replacement required — rather than the initial pass's unresolved "no imagery required, but recommended later" framing. Interaction density was re-checked against the governing learning-rhythm standard: the cycle-step selector and trigger accordion were found to be revealing information rather than requiring judgment and were **simplified to static content** (all curriculum content preserved, only the click-to-reveal mechanic removed); the comparison toggle and spectrum slider survived re-examination with distinct instructional jobs. Module 6's final ungraded-interaction count is three (comparison toggle, spectrum slider, signature triage), down from the initial pass's five.

**Module 6 is now implemented, but was not yet manually QA'd or manually approved at the time this specification-approval record was written.** See the implementation record above — manual QA is the current gate.

### Prior extraction record (unchanged, recorded for continuity)

Extracted per the Module 6 source-extraction task. No asset inventory file
was created — Module 6 currently contains zero real image/diagram/video/
downloadable assets; every "photo" slot renders a decorative placeholder
graphic with no underlying file, the same state already documented for
Module 5 (`module-06-source.md` §7).

Notable findings recorded in the extraction (not fixed at extraction time):
Module 6's displayed and evaluated checkpoint questions do not match for
both `m6cp1` and `m6cp2` (same pattern already corrected for Modules 1–4,
not yet corrected for Module 5); `M6.system` is a single shared rubric for
both checkpoints rather than the per-checkpoint `M6.systems.mNcpX`
structure Modules 1–4 use; `submitM6CP` supplies no module-specific
network-error text; both checkpoints' voice and submit buttons lack
`aria-label` and both `.cp-res` regions lack `aria-live`; three of Module
6's four ungraded interactions (a dry-vs-dandruff comparison toggle, a
six-step "wrong product cycle" selector, and a four-item trigger
accordion) are plain `<div onclick>` elements with no keyboard or
screen-reader semantics at all (the fourth, a Malassezia-spectrum range
slider, is a native, keyboard-accessible control but lacks an explicit
`aria-label`); section numbering skips "6.2" entirely; a tap-interaction
hint is duplicated with inconsistent wording; `M6.system` still says
"instructor of HeadSpa Mastery" and `MODULE_GUIDE_SYSTEMS[6]` still frames
Cadence as personally "a mentor built from nearly two decades in the head
spa industry" — the old-name and personal-experience-claim patterns
already corrected out of Modules 0, 1, 2, and 4, still uncorrected in
Module 5; an unverified sebum-production/temperature percentage claim is
duplicated verbatim from Module 5's oily-scalp section; and Module 6 has
no standalone, always-visible stop-service/refer-out section — its only
referral sentence is gated behind manually dragging the spectrum slider to
its final position. See `module-06-source.md` for the complete pre-audit
findings list.

Modules 7–11 have not been extracted yet. Source files for those modules
will be added in later audit passes. Module 12 (Final Exam) has not been
audited — its technical relationship to the existing Module 11 and
certificate flow is still to be determined.
