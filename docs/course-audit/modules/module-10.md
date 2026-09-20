# Module 10 — Approved Audit Specification

**Course:** AIMT Head Spa Certification Course
**Student-facing module number:** 10
**Approved module title:** Sanitation & Reset Systems
**Primary curriculum source:** technical Module 10 (pre-reorder technical Module 9, "Sanitation & Reset Systems"), relocated intact into technical slot 10, `headspa-mastery.html:6557–6710`
**Source reviewed:** `module-10-source.md`
**External audit:** completed and approved — this document converts that audit into the controlling specification
**Audit date:** August 25, 2026
**Implementation:** Implemented in `headspa-mastery.html` August 25, 2026 (see `implementation-log.md` Step 79). Static validation and Review Mode desktop/phone browser QA complete. Between-Client Sanitation & Reset Checklist downloadable installed and link-verified August 25, 2026 (see `implementation-log.md` Step 81). Manually approved by the owner August 25, 2026.
**Status:** **Implemented — manual QA approved**
**Production source of truth:** `headspa-mastery.html` (implemented per this specification)

This document is the approved content and technical authority for a future Module 10 implementation task. It does **not** itself authorize implementation, does not touch any production file, and does not begin the technical work it describes. Per the master instructions' module lifecycle, this closes step 3 (external audit) and step 4 (approved specification) for Module 10 — step 5 (implementation) is the next, separate gate.

It does not authorize changes to authentication, entitlements, payments, database policies, certificate issuance, Module 9 (already manually approved — not reopened by this document), Module 11's future AI/Modern Practice Tools curriculum, the Module 12 Final Exam, persistent Cadence threads, the Guided Completion Path interface, Listen Mode, or the monolithic course-file architecture.

---

## Manual QA approval — August 25, 2026

The owner reviewed the rendered `course-audit-build` branch preview and confirmed Module 10's implementation looks and functions well enough to proceed, and supplied the Between-Client Sanitation & Reset Checklist PDF for installation. This closes the manual-QA gate from the master instructions' module lifecycle for Module 10. The approved implementation is the one recorded in `docs/course-audit/implementation-log.md` Steps 79–81 (curriculum implementation, visual polish, and the downloadable installation).

**Honestly deferred, not resolved by this approval:**

- Live-model checkpoint grading QA (`m9cp1`/`m9cp2` were verified by rubric/config inspection and mocked-`callAI` validation, not by exercising the real model against live student answers).
- Live Cadence response QA (quick-prompt text and the guide-system prompt were verified by source inspection only).
- Screen-reader QA.
- Physical-keyboard QA.
- Real touch-device QA.

**Next gate:** Module 10's own video-source file (see `docs/course-video-sources/module-10-video-source.md`) — the exact next project task after that is Module 11 (AI / Modern Practice Tools), a separate, later, explicitly authorized task.

---

## Audience framing — governs every section below

The student audience is primarily **licensed cosmetologists and/or estheticians** who have already completed state-required sanitation/disinfection education and testing appropriate to their license.

Module 10 must therefore **not** read as "Sanitation 101" and must **not** reteach licensure curriculum from scratch. It teaches **how existing professional sanitation fundamentals apply to the specific realities of a Head Spa environment**: wet systems, halo/water equipment, reusable tools, surfaces, linens, product handling, between-client reset, equipment-specific maintenance, room workflow, and operating under time pressure.

**Approved conceptual framing (meaning must be preserved; wording may be polished for student-facing fit):**

> You already know sanitation fundamentals. This module teaches you how to apply them to the specific realities of a Head Spa.

---

## Licensure / jurisdiction boundary — governs every section below

Requirements differ by license type, state, locality, workplace structure, equipment, disinfectant/product, and manufacturer instructions. AIMT must not present one business's procedure as a universal legal requirement.

The module establishes this once, clearly, near the beginning (not as a disclaimer scattered throughout):

- current state/local board requirements control where applicable;
- disinfectant/product labels control their approved use;
- equipment manufacturer instructions control equipment-specific cleaning/maintenance;
- workplace exposure requirements may vary based on employment/business structure and applicable law.

One clear framing section/callout is enough — this must not become a disclaimer-heavy module.

---

## Basis for corrections

Module 10's corrections rest on three kinds of evidence, the same evidentiary standard already used for Module 9's non-clinical corrections:

1. **Internal consistency with this course's own already-approved standards** — e.g., the old course name and "nearly two decades" Cadence persona claim in `M9.system`/`MODULE_GUIDE_SYSTEMS['10']` are corrected here for exactly the same reason already corrected in Modules 0–9 (see `00-global-decisions.md`'s "Course name" and Cadence direction sections).
2. **Internal claim-scope accuracy** — several current claims (a universal 15-minute reset target, "halo flush is always first," "logs protect you legally," an implied universal EPA-registration/Barbicide procedure) assert certainty the course cannot actually guarantee across every jurisdiction, license, business structure, and equipment configuration. This is a scope-accuracy correction, not a rewrite of correct curriculum.
3. **The owner's explicit direction on audience framing and curriculum tone**, recorded in this audit — that the module must speak to already-licensed practitioners applying known fundamentals to a new environment, not relearn sanitation from zero.

Per `00-global-decisions.md`'s "Curriculum preservation" principle, the strongest existing practitioner-value content — the cleaning-vs-resetting distinction and the weak-system/strong-system pressure-test framing — is preserved and strengthened, not discarded merely to sound different.

---

## Approved outcomes

By the end of Module 10, the student should be able to:

1. Distinguish cleaning, disinfection, laundering/replacement/disposal, and reset.
2. Apply the correct general processing category to common Head Spa items.
3. Explain why disinfectant labels and equipment instructions control product/equipment-specific procedures.
4. Build a repeatable between-client reset without shortening required processing/contact time.
5. Keep clean and used items appropriately separated.
6. Identify when a normal reset is insufficient and an incident/exposure procedure is needed.
7. Create a room-specific reset flow that remains workable when the schedule is under pressure.
8. Document relevant sanitation/maintenance information without treating documentation as a legal guarantee.
9. Respond professionally to a reported post-service concern without diagnosing or assuming causation.

These are the acceptance bar for the module's curriculum and interactions — a future implementation must be checkable against each one individually, not against a vague "understand sanitation" standard.

---

## Keep unchanged

Preserve the following, exactly as the current post-reorder architecture has them:

- Checkpoint IDs `m9cp1` and `m9cp2` — **do not rename them.** They belong to student-facing Module 10 by the intentional post-reorder architecture already established in `module-09-reorder-migration-plan.md` and confirmed in `module-10-source.md` §4. Renaming would corrupt existing `checkpointMeta` semantics for no benefit.
- The shared `submitCheckpoint()` → Review-Mode-aware pipeline every other module uses — no new checkpoint architecture is needed.
- `MODULE_CHECKPOINTS['10']` = `['m9cp1', 'm9cp2']`, unchanged.
- The wrapper ID `module10Wrap` and the 10.x section-numbering convention.
- The completion card's existing correct handoff naming Module 11 — AI / Modern Practice Tools as locked/unavailable, with no live functional route (already correct per `module-10-source.md` §3 — no change needed here).
- The cleaning-vs-resetting distinction and the weak-system/strong-system pressure-test framing — the module's strongest existing practitioner-value content (see "Preserve / improve list" below).
- Review Mode's unsaved behavior.

---

## Remove or replace

Explicitly remove or replace the following from the current source content:

- `Under 15 minutes. Every time.` as a universal reset-duration claim.
- The nine fixed per-step minute badges functioning as universal AIMT targets.
- The universal "halo flush is always first" sequencing rule.
- The universal BARBICIDE-rinse-then-water halo-line instruction, taught as a required safety step.
- Loose, interchangeable use of clean / sanitize / disinfect / sterilize.
- The decorative fixed-cadence `startResetTimer()` / 2.2-second auto-advancing highlight sequence.
- The unqualified claim that sanitation logs "protect you legally."
- The "check your state board... at minimum once a year" framing when presented as if it alone guarantees compliance.
- The old course identity ("instructor of HeadSpa Mastery") in the checkpoint rubric.
- The "nearly two decades in the head spa industry" personal-practitioner-experience persona in Cadence's guide system.
- The single shared `M9.system` rubric (replaced by per-checkpoint `M9.systems.m9cp1` / `M9.systems.m9cp2`).
- The displayed/evaluated checkpoint question mismatches for both `m9cp1` and `m9cp2`.
- The pre-accessibility-foundation checkpoint markup (`cp-response` class, no `aria-live`, no `aria-label` on voice/submit controls, unlabeled textareas).
- The speed-first Cadence framing ("What is the fastest reliable reset?").
- Any unqualified assumption of causation in the post-service-complaint content (that a reported reaction proves or disproves a specific cause).

---

## Core module thesis

> **Clean correctly. Reset deliberately. Never let speed override the process.**

Supporting operational insight:

> Speed should be the result of a good system — not the safety standard itself.

The module should feel like an **Operations Pressure Test**.

**Signature learning question:** Does your system still work when you're behind?

**Signature takeaway:** The process determines the clock. The clock does not determine the process.

---

## Module 10 core direction — locked

The following decisions are settled by this audit and are not open for reconsideration by a future implementation task without a new, explicit review:

1. Module 10 speaks to already-licensed practitioners, not sanitation beginners — see "Audience framing" above.
2. AIMT teaches the decision framework (process categories, workflow, contamination prevention, operational discipline, professional judgment); the student's license/jurisdiction, product labels, and equipment manufacturer instructions supply the procedural specifics.
3. No universal time target, no universal product/brand procedure, and no unqualified legal-protection claim survives into student-facing copy, Cadence, or either checkpoint rubric.
4. The reset-sequence interaction is replaced with one ungraded decision interaction ("Reset Under Pressure") — not preserved as a decorative walkthrough, and not replaced with a second decorative mechanic.
5. Checkpoint IDs, Review Mode behavior, and the Module 11 locked-handoff are preserved exactly as already implemented.
6. One downloadable is approved in concept for a later task (the Between-Client Sanitation & Reset Checklist) — not built now.

---

## Section-by-section approved structure

Supersedes the current 10.1–10.5 structure. Approved order:

1. Opening framing — Building on Your Licensure
2. 10.1 — Use the Right Process for the Job
3. 10.2 — Process the Right Item the Right Way
4. 10.3 — Build a Reset Around What Cannot Be Rushed
5. Reset Under Pressure — ungraded interaction
6. 10.4 — Build the System Before You're Under Pressure
7. 10.5 — When Routine Reset Is Not Enough
8. `m9cp1`
9. `m9cp2`
10. Completion

The current structure (opening frame → 10.1 sanitize grid → 10.2 reset sequence → 10.3 compliance → 10.4 `m9cp1` → 10.5 `m9cp2` → completion) is **not** preserved merely because it exists today — this approved structure supersedes it.

### Opening framing — Building on Your Licensure

Concise student-facing opening concept, equivalent in meaning to:

> **BUILDING ON YOUR LICENSURE**
> This module builds on the sanitation and disinfection fundamentals students already learned through professional licensing education. AIMT's focus is how those fundamentals apply to Head Spa wet systems, halo equipment, reusable tools, linens, product handling, room reset, and workflow under pressure.
>
> Requirements vary by jurisdiction and license. Current state/local requirements, disinfectant labels, and equipment manufacturer instructions remain controlling where they are more specific.

Must not imply AIMT supersedes licensing rules. Final student-facing copy may be polished; this meaning must survive.

### 10.1 — Use the Right Process for the Job

**Purpose:** correct the current loose interchange of clean / sanitize / disinfect / sterilize with concise, transferable distinctions.

- **Cleaning** — removal of soil, residue, and debris. Often necessary before an item can be properly disinfected.
- **Disinfection** — treatment of appropriate inanimate items/surfaces with a disinfectant according to its label, approved use site, dilution where applicable, required contact/wet time, and applicable rules. Must not imply one disinfectant works for every item.
- **Launder / replace / discard** — porous washable goods, disposable/single-use items, and reusable hard nonporous tools do not follow the same processing path.
- **Reset** — the process of preparing the cleaned/processed room, supplies, and equipment for the next service. Reset is not synonymous with disinfection.
- **Sterilization** — mentioned only enough to distinguish it from disinfection. Must not imply Head Spa implements are "sterile" merely because they were disinfected, and must not imply every Head Spa requires sterilization equipment.

### 10.2 — Process the Right Item the Right Way

Replaces the current universal/frequency-style six-card grid with a transferable **ITEM → PROCESS** framework. Categories:

- **Reusable hard, nonporous tools** — remove soil/debris; disinfect before reuse using an appropriate product according to its label; preserve required contact time; keep clean and used tools separated. Do not certify one universal brand/product.
- **Hard, nonporous service surfaces** — clean where needed; disinfect using an appropriate labeled product; respect the required wet/contact time.
- **Linens / washable porous goods** — remove after use; contain away from clean stock; launder before reuse; store clean linens protected from contamination. Do not invent one universal wash temperature unless verified and jurisdictionally appropriate.
- **Single-use items** — discard after intended single use; do not reprocess as reusable implements.
- **Halo / basin / water system / equipment** — follow the specific equipment manufacturer's cleaning, disinfection, and maintenance instructions plus applicable regulatory requirements. Do **not** preserve the current universal "BARBICIDE rinse → water rinse" halo rule, and do **not** teach "halo flush always first" as a universal safety requirement.
- **Product bowls / applicators / supplies** — hygienic product handling: clean applicators; appropriate dispensing/portioning; avoid cross-contaminating clean product; do not simply reuse contaminated leftover product for the next client. Do not overbuild this into a cosmetics-manufacturing lesson.

**Remove universal cadence labels.** Do not preserve current student-facing rules like "Every client / Daily / Weekly" when they imply AIMT is certifying one universal frequency for equipment maintenance. Instead distinguish operational categories: **Between clients**, **Daily / opening / closing routine**, **Periodic / manufacturer-directed maintenance**. Actual frequency may depend on equipment manufacturer instructions, product label, local/state rules, service use, and business SOP.

**Instructor tip — water-line / halo maintenance.** A restrained INSTRUCTOR TIP, using the neutral callout system only where it visually fits (not required simply because the system exists):

> In our own Head Spa, a whirlpool/jet-system cleaner has worked especially well for periodic cleaning of the halo/water lines. If you choose to use one, first confirm that it is compatible with your specific bed or halo system and follow both the cleaner's label and the equipment manufacturer's instructions. This is a maintenance/cleaning tip; it does not replace any required disinfection procedure.

Required boundaries: framed as a personal/practice tip, not a universal AIMT requirement; requires equipment compatibility confirmation; requires following the product label; requires following equipment manufacturer instructions; does not replace disinfection where disinfection is required. Do not name a specific commercial brand — "whirlpool/jet-system cleaner" is sufficient; no repository/source evidence supports a specific brand endorsement.

### 10.3 — Build a Reset Around What Cannot Be Rushed

Retires the universal nine-step "Under 15 minutes. Every time." model and the nine fixed minute badges. Teaches a flexible five-phase framework:

**CONTAIN → CLEAN → DISINFECT / PROCESS → RESET → VERIFY**

- **Contain** — immediately move used linens, disposable items, and dirty implements into their correct used/dirty handling path.
- **Clean** — remove soil, product residue, and debris before the next required process where applicable.
- **Disinfect / Process** — begin whatever disinfectant contact time, equipment cleaning/disinfection process, or manufacturer-directed process is actually required. Do not shorten required contact/process time.
- **Reset** — rebuild clean linens, protected supplies, necessary products, sensory setup, and service equipment without recontaminating processed items.
- **Verify** — walk the room before the next client. Confirm equipment ready; required process/contact time complete; clean/dirty separation intact; supplies ready; no used-client residue/clutter remains.

**Time / pacing teaching.** The course may teach efficiency; it must not certify 15 minutes as universally correct. Approved teaching:

> Once your process is correct, practice it until it becomes repeatable. Then measure your actual reset time and build enough turnover time into the schedule to complete the process without rushing required cleaning, disinfection, equipment maintenance, or setup.

Independent tasks may happen in parallel while a required contact time, equipment cycle, or other processing requirement runs — but the required process itself cannot be shortened merely because the next client is waiting.

### Reset Under Pressure — ungraded interaction

Replaces the retired `startResetTimer()` / fixed 2.2-second highlight sequence, which is not a real timer and does not meet the approved interaction standard.

**Scenario:** the next client has arrived early. The room is mostly reset, but a reusable item or surface is still completing its required disinfectant contact/process time. Ask the student what they should do.

**Strong reasoning:** preserve required process/contact time; continue other appropriate reset tasks; use another already-clean, ready alternative if available; delay the next service/start if required rather than shortening the process.

**Distractors:** wipe the surface dry early because it looks clean; skip remaining contact time because the next client is waiting; use an unprocessed backup item; otherwise prioritize schedule over processing requirement.

**Interaction behavior (all required):** one decision; clear, text-based feedback (not color alone); revisable; no `APP_STATE` write; no persistence; no completion gate; no autoplay; keyboard/touch accessible.

This is the only new interaction approved for Module 10. Do not build a second one.

### 10.4 — Build the System Before You're Under Pressure

Preserves and strengthens the source's weak-system-vs.-strong-system thinking — one of the existing module's strongest practitioner-value concepts (see `module-10-source.md` §3, "What this looks like under pressure").

Teaches that consistency comes from: clear clean/used zones; known product label/contact-time instructions; equipment instructions available; appropriate clean backups; protected clean linens/supplies; room-specific reset order; adequate turnover time.

**Central principle:** Reduce decisions without reducing standards. Do not frame the solution as "move faster."

**Logs / records.** Keep recordkeeping as an operational tool. Remove "Logs protect you legally." Approved framing:

> Records can support consistency, maintenance history, traceability, and review when a concern occurs. Keep any records required by your jurisdiction and any additional logs your business uses to verify its own procedures.

Possible log fields: date/time; product used; dilution where applicable; contact time; equipment maintenance; person performing procedure; issues/deviations. Do not require every business to use the exact same log format unless required by law/regulation.

**Compliance review.** Do not teach "check once a year" as if it guarantees compliance. Approved direction:

> Use current state/local requirements and establish a recurring compliance review. Recheck whenever regulations, equipment, disinfectants, services, or procedures change.

An annual review may be suggested as an internal business habit — it must not be framed as a universal regulatory interval.

### 10.5 — When Routine Reset Is Not Enough

Distinguishes ordinary between-client reset from an unexpected contamination/incident response.

If blood or another potentially infectious material is present: stop the normal reset flow; follow the business's applicable exposure/cleanup procedure; use appropriate PPE; contain/remove visible material safely; clean/process affected reusable items/surfaces appropriately; use products according to labels; handle contaminated laundry/disposables appropriately; document/follow applicable workplace and regulatory procedure.

Must **not** state that OSHA's exact requirements automatically apply to every student/business configuration. Boundary phrasing: employee/employer exposure requirements may depend on applicable workplace law and business structure.

**Core principle:** blood/body-fluid contamination is not handled as an ordinary routine reset.

**Post-service reaction / complaint teaching** — the bridge into `m9cp2`. A client reporting a rash the next day does **not** prove sanitation caused it, a product caused it, an allergy caused it, friction caused it, the business is at fault, or the business is not at fault. Teach the practitioner to: acknowledge the concern; document what the client reports; avoid diagnosing; avoid assigning causation; review relevant service facts; review intake/product/service records; review sanitation/equipment/linen/process records where relevant; identify deviations if any; follow business incident/compliance procedure as appropriate; encourage medical evaluation when symptoms warrant it, without attempting to diagnose.

### Checkpoint 1 — `m9cp1`

See "Checkpoint specification" below for the exact question, competency, and rubric requirements.

### Checkpoint 2 — `m9cp2`

See "Checkpoint specification" below for the exact question, competency, and rubric requirements.

### Completion card

Preserve the existing correct behavior: names Module 11 — AI / Modern Practice Tools as locked/unavailable, with no live functional route into it. No change required here beyond whatever incidental copy adjustment keeps it consistent with the corrected module content above.

---

## Checkpoint specification

### `m9cp1` — Between-client reset reasoning

**Exact displayed and evaluated question (byte-identical, both surfaces):**

> Walk me through your between-client reset in the order that works for your setup. Identify what you remove or contain, what you clean and disinfect, what you replace or restock, and any required contact or equipment time you would not shorten.

**Competency:** the student can construct a coherent, safe, room-specific reset using correct process distinctions.

**Passing reasoning should demonstrate:** used/dirty containment; appropriate cleaning/disinfection distinction; clean/used separation; replenishment/reset; respect for required product/equipment process time; coherent return to service-ready.

**Do NOT require:** 15 minutes; halo first; BARBICIDE in halo lines; one universal sequence; exact wording.

Use a checkpoint-specific rubric (`M9.systems.m9cp1`), not the current shared `M9.system`.

### `m9cp2` — Post-service concern response

**Exact displayed and evaluated question (byte-identical, both surfaces):**

> A client contacts you the next day and reports a rash on her neck after the service. What would you say to her, what facts would you document, and what would you review internally without diagnosing or assuming the cause?

**Passing reasoning should demonstrate:** acknowledgment; calm/professional response; no diagnosis; no assumed causation; documentation of client report; review of relevant intake/service/product records; review of sanitation/equipment/linen/process information where relevant; appropriate internal follow-up. Strong answers may appropriately suggest medical evaluation when warranted.

**Do NOT require** the student to admit fault. **Do NOT reward** automatic denial of fault. **Do NOT claim** sanitation necessarily caused the reaction.

Use a checkpoint-specific rubric (`M9.systems.m9cp2`), not the current shared `M9.system`.

### Checkpoint foundation — bring onto the current approved pattern

Required, matching the pattern already implemented for Module 9's own checkpoints:

- byte-identical displayed/evaluated question strings for both checkpoints;
- `M9.systems.m9cp1` and `M9.systems.m9cp2` — per-checkpoint rubrics, replacing the shared `M9.system`;
- current course-name framing (no "HeadSpa Mastery");
- voice input preserved;
- Enter submits, Shift+Enter creates a newline;
- clear loading state;
- Module-10-specific network-error message — suggested copy: *"Cadence couldn't review your sanitation response. Check your connection and try again."* (may be polished, meaning preserved);
- `aria-live="polite"` on both response regions;
- current `cp-res` response class (not the pre-correction `cp-response`);
- accessible `<label>`s for both textareas;
- `aria-label` accessible names for both voice and submit controls;
- Review Mode remains unsaved;
- both checkpoints required for completion;
- grammar/spelling alone must never cause failure.

---

## Approved Cadence behavior

**Role:** sanitation-process and operational-consistency coach — not "instructor of HeadSpa Mastery," and not a personal 20-year-practitioner persona.

Correct: the old course-name rubric identity in `M9.system`; the "nearly two decades" personal-experience persona in `MODULE_GUIDE_SYSTEMS['10']`.

Cadence should help students distinguish **clean → disinfect/process → reset → verify**, and should know when the correct answer depends on the disinfectant label, equipment manufacturer instructions, state/local rule, or workplace exposure procedure.

**Cadence must not invent:** contact times; dilution; equipment chemical compatibility; state-specific law; universal maintenance frequencies; legal guarantees.

### Approved quick prompts

1. `What needs cleaning vs. disinfection?`
2. `How do I build a reset that holds up when I'm behind?`
3. `What should I document after a client concern?`

Replaces `What is the fastest reliable reset?` — speed is not the core competency.

---

## Downloadable resource opportunity

**Installed (August 25, 2026):** **Between-Client Sanitation & Reset Checklist** — the sole approved Module 10 downloadable, per the downloadable-resource policy (one resource is enough; a second Sanitation Quick Reference was not created). File: `assets/images/course/module-10/module-10-between-client-sanitation-reset-checklist-fillable.pdf`, a 2-page fillable PDF, linked from a download card placed after Section 10.5's "How to respond" content, before the divider leading into `m9cp1`. Link verified in Review Mode: `fetch()` returns HTTP 200, `content-type: application/pdf`, byte-exact `content-length` match against the file on disk.

**Actual structure, matching the recommended structure below:**

- **Page 1** — "Between-Client Sanitation & Reset Checklist," the Contain → Clean → Disinfect/Process → Reset → Verify workflow as five checklist steps, framed "Run the process — not the clock," with an "If you are behind" callout matching the approved pacing teaching (continue independent tasks, use an already-clean alternative, or delay start — never shorten the required process).
- **Page 2 — "Verified Details for My Setup"** — fillable fields for business/room/practitioner/last-verified-date; product/disinfectant name, dilution, EPA registration number, labeled contact time, approved use/compatible items, and where the current label is stored; equipment/bed/halo model, manufacturer instructions source, periodic water-line maintenance process, and maintenance-log location; linen handling, clean/used separation, and single-use handling; and a recurring-review-trigger checklist (regulation, product, equipment, service, or workflow changes) with an applicable state/local source and last-check date field.

The course framework stays general; the student fills in the exact details that apply to their business. No universal time target, product/brand requirement, or legal guarantee appears anywhere in the installed file — confirmed by direct read of its content before linking it into production.

**Recommended practical structure (original, superseded by "Actual structure" above once the file was installed):**

- **Page 1** — the student's actual workflow organized around Contain → Clean → Disinfect/Process → Reset → Verify.
- **Page 2 — Verified Details for My Setup** — possible fillable fields: disinfectant/product name; EPA registration number where applicable; dilution; labeled contact time; compatible items/surfaces; equipment manufacturer cleaning/maintenance process; linen handling; clean/used storage; single-use handling; applicable state-board/regulatory source; date guidance was last verified.

---

## Interaction density

Approved: **Reset Under Pressure**, `m9cp1`, `m9cp2`. No decorative reset animation, no scores, no XP, no artificial countdown, no sanitation speed game, and no additional interaction unless a concrete later learning need justifies it.

---

## Guided completion structure

- **Estimated attentive learning time:** 15–20 minutes.
- **Estimated checkpoint time:** 10–15 minutes.
- **Suggested practice or application task:** run the student's actual reset workflow several times only after the procedure is verified; measure the realistic turnover time for their own setup; use the result to inform scheduling. This practice does not currently gate course completion.
- **Competency demonstrated:** the student can build and explain a repeatable Head Spa sanitation/reset system without sacrificing required processing steps to speed.
- **Earlier concepts to revisit:** none explicitly required by current source content.
- **Suggested course-path position:** tenth, immediately after Module 9 (Checkout, Client Closing & Pricing Strategy) and before the not-yet-built Module 11 (AI / Modern Practice Tools).

---

## Listen Mode notes

- **Narration-suitable:** licensure framing; terminology (clean/disinfect/reset/sterilize distinctions); system-under-pressure concepts; incident-response principles.
- **Visual-review required:** the item/process (ITEM → PROCESS) framework; the Contain → Clean → Disinfect/Process → Reset → Verify flow; the downloadable/checklist once eventually produced.
- **Screen-required content:** Reset Under Pressure; both checkpoints.
- **Video-only content:** none currently planned beyond the opening video.

Audio alone cannot prove competency.

---

## Opening video direction — record only, not created

Do **not** create the video-source file in this task. Preliminary future direction, for whoever eventually authors `module-10-video-source.md` after Module 10 clears manual QA:

**Opening thesis:** Clients may never watch you reset the room, but they experience the result.

The video should frame: invisible professionalism; room readiness; repeatability; wet-environment operational discipline.

**Do not casually put into the future opening video:** chemical product instructions; contact times; halo cleaning chemistry; regulatory claims. Those remain lesson/reference material, not video-script content.

The opening video remains one concise module-opening video, consistent with the established AIMT video workflow.

---

## Completion and gating

Module 10 completion requires `m9cp1` passed and `m9cp2` passed. **Reset Under Pressure does not gate completion.**

Next module identity: **Module 11 — AI / Modern Practice Tools.** Module 11 is not built. Completion may identify it as locked/unavailable. Do not create a live route into nonexistent Module 11. Review Mode remains unsaved.

---

## Accessibility

Specify, for the future implementation task:

- the current checkpoint accessibility foundation (see "Checkpoint foundation" above);
- the semantic callout system, used selectively — see "Callout restraint" below;
- warning/caution semantics reserved for genuine safety/caution content, using the established `.kp-warn` treatment (e.g., the 10.5 blood/body-fluid section);
- neutral callout (`✦`) used sparingly, only where emphasis genuinely improves learning — good candidates: "Building on Your Licensure," and the water-line/halo instructor tip;
- no color-only meaning;
- accessible interaction feedback for Reset Under Pressure;
- keyboard/touch operation;
- visible focus;
- phone layout with no horizontal overflow.

**Correct the current misuse of error/red styling** for the neutral "Every client" frequency meaning (`module-10-source.md` §11's `freq-every` finding) — unless implementation later determines that visual state genuinely represents a warning/required-safety meaning. Frequency labels should not borrow error/incorrect semantics merely for emphasis.

### Callout restraint

The AIMT callout system exists; use it selectively. Do **not** turn every important paragraph into a `✦` callout. Good candidates in this module: "Building on Your Licensure," and the optional instructor/practice tip about water-line maintenance. Safety/caution material (the 10.5 blood/body-fluid content) should use the established warning/caution treatment instead. Ordinary teaching remains ordinary teaching — preserve visual restraint and hierarchy.

---

## Preserve / improve list (consolidated)

- Cleaning vs. resetting distinction.
- Room-ready-before-next-client principle.
- Clean/used separation.
- Manufacturer-label/contact-time respect.
- Equipment-specific maintenance principle.
- Reusable-tool processing.
- Linens/dirty-containment concept.
- Weak-system/strong-system contrast.
- Pressure-test framing.
- Sanitation records as operational traceability (reframed away from a legal-protection guarantee).
- Checkpoint IDs `m9cp1`/`m9cp2`.
- Review Mode behavior.
- Module 11 locked handoff.

## Remove/replace list (consolidated)

- `Under 15 minutes. Every time.`
- Universal 15-minute time badges (all nine).
- Universal "halo flush first" rule.
- Universal BARBICIDE halo-line rinse instruction.
- Loose clean/sanitize/disinfect interchangeability.
- Decorative fixed-cadence reset "timer" (`startResetTimer()`).
- "Logs protect you legally" claim.
- Annual-check-as-universal-compliance-guarantee framing.
- Old course identity in checkpoint rubric.
- "Nearly two decades" Cadence persona.
- Shared `M9.system` rubric.
- Displayed/evaluated checkpoint mismatches.
- Inaccessible pre-foundation checkpoint markup.
- Speed-first Cadence framing.
- Unqualified assumptions of causation in post-service complaints.

---

## Safety / claims principle

This principle must be unmistakable in the implemented module:

> AIMT teaches the decision framework. The student's current license/jurisdiction rules, product label, and equipment manufacturer instructions provide the exact procedural details where applicable.

This must not become so vague that the lesson stops being useful — AIMT should still teach process categories, workflow, contamination prevention, operational discipline, and professional judgment. It should not invent regulatory universals.

---

## Acceptance criteria

A future implementation task must satisfy all of the following before manual QA:

1. Opening framing establishes the licensure-boundary hierarchy (jurisdiction/product label/equipment instructions) once, without becoming disclaimer-heavy.
2. No "Sanitation 101" framing anywhere in student-facing copy.
3. Section order matches the approved structure exactly (Opening → 10.1 → 10.2 → 10.3 → Reset Under Pressure → 10.4 → 10.5 → `m9cp1` → `m9cp2` → Completion).
4. 10.1 teaches clean/disinfect/launder-replace-discard/reset/sterilize as distinct concepts.
5. 10.2 uses an ITEM → PROCESS framework, not a universal frequency grid; the halo/water-system entry defers to manufacturer instructions and does not teach a universal BARBICIDE/halo-flush-first rule.
6. The water-line instructor tip, if included, is qualified exactly as specified (personal tip, equipment compatibility, product label, manufacturer instructions, does not replace required disinfection) and does not name a specific commercial brand.
7. 10.3 teaches the five-phase Contain → Clean → Disinfect/Process → Reset → Verify framework with no universal 15-minute target and no fixed per-step time badges.
8. Reset Under Pressure is implemented exactly as specified (one decision, clear text feedback, revisable, no persistence, no completion gate, no autoplay, accessible) and is the only new interaction.
9. 10.4 preserves and strengthens the weak-system/strong-system framing; logs are framed as operational/traceability tools, never a legal guarantee; compliance review is framed as recurring, not an annual-checkbox guarantee.
10. 10.5 clearly separates ordinary reset from a blood/body-fluid incident response, without asserting OSHA's exact requirements apply universally.
11. The post-service-complaint teaching avoids assuming or denying causation and bridges coherently into `m9cp2`.
12. `m9cp1` and `m9cp2` displayed and evaluated question strings are byte-identical to the exact text specified above.
13. `M9.systems.m9cp1` and `M9.systems.m9cp2` replace the shared `M9.system`, with the specified pass criteria and prohibited requirements.
14. Checkpoint accessibility foundation matches the pattern already shipped in Module 9 (`cp-res` class, `aria-live`, `aria-label`s, associated `<label>`s).
15. Cadence's guide system and rubric no longer contain the old course name or the "nearly two decades" persona claim; quick prompts match the three approved prompts exactly.
16. The downloadable is recorded as approved-for-later only — not built, not linked.
17. Completion requires both checkpoints; Reset Under Pressure does not gate completion; Module 11 remains named-only/locked with no live route.
18. Callout usage is selective per "Callout restraint" above — not applied to every paragraph.
19. The `freq-every`-style red/error semantic misuse is corrected or deliberately re-justified in the implementation record.
20. No production file (`headspa-mastery.html`, `assets/js/*.js`, `functions/*`) is touched by this specification task itself.

---

## Distinct learning rhythm

Module 10's signature learning moment is the Reset Under Pressure decision point — the module is explicitly framed as an Operations Pressure Test, distinguishing it from Module 9's business-judgment framing and Module 8's masterclass-video rhythm. Interaction density is light-to-moderate (one ungraded interaction, two checkpoints) — appropriate given the module's short, focused content, consistent with `00-global-decisions.md`'s "Varied learning rhythm" (density is a per-module judgment call, not a fixed quota).

---

## Implementation notes

This specification does not resolve any technical migration question — Module 10 already occupies its correct technical slot (10) with correct checkpoint wiring (`MODULE_CHECKPOINTS['10']` = `['m9cp1','m9cp2']`), per the completed Module 9 reorder. No saved-state migration is required for this module's own curriculum rewrite, since no checkpoint IDs, wrapper IDs, or slot numbers change as a result of this specification — only the content within the existing slot, the rubric, Cadence configuration, the interaction, and accessibility markup change.

A future implementation task should:

1. Read this specification and `module-10-source.md` in full before touching `headspa-mastery.html`.
2. Make surgical, minimal edits per `CLAUDE.md`'s standing rule for `headspa-mastery.html`.
3. Replace `startResetTimer()`/`advanceResetStep()` with the Reset Under Pressure interaction, removing the now-dead fixed-cadence JS.
4. Split `M9.system` into `M9.systems.m9cp1`/`m9cp2`.
5. Correct `MODULE_GUIDE_SYSTEMS['10']` and `MODULE_QUICK_PROMPTS[10]`.
6. Apply the current checkpoint accessibility foundation.
7. Run static/mocked validation, then manual QA, per the master instructions' module lifecycle — before any status change to `Implemented — manual QA approved`.

Do not begin this implementation as a consequence of this specification task — it is a separate, later, explicitly authorized task.
