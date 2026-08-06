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
| Approved specification file | [`module-05.md`](module-05.md) — full approved specification |
| Wrapper ID | `module5Wrap` — standard hidden-template pattern |
| Checkpoint IDs | `m5cp1`, `m5cp2` — standard `mNcpX` pattern |
| Current completion requirement | Both checkpoints must be graded `passed` (no read-percentage minimum) |
| **Status** | **Implemented — awaiting manual QA** |

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

Modules 6–11 have not been extracted yet. Source files for those modules
will be added in later audit passes. Module 12 (Final Exam) has not been
audited — its technical relationship to the existing Module 11 and
certificate flow is still to be determined.
