# Module 11 — Approved Audit Specification

**Course:** AIMT Head Spa Certification Course
**Student-facing module number:** 11
**Approved module title:** AI / Modern Practice Tools
**Primary curriculum source:** none — authored fresh (see `module-11-source.md`, which confirms no prior AI curriculum ever existed in this repository)
**Source reviewed:** `module-11-source.md`
**External audit:** the owner's full direction, provided directly as this task's instructions, functions as the external audit for this module
**Audit date:** August 25, 2026
**Correction pass:** August 25, 2026 — the initial implementation drifted from the approved learning/design intent (excessive `✦` usage, an overbuilt five-card checkpoint-style accordion for the B.R.I.E.F. interaction, HEAR/OBSERVE/BOUNDARY/NEXT STEP split into four separate callouts, borrowed section headlines instead of the approved hierarchy). This document has been updated in place to record the **locked, corrected** structure below — it no longer describes the original overbuilt implementation. See `implementation-log.md` for the full before/after record.
**Implementation:** implemented, corrected
**Status:** **Implemented — awaiting resource pass + manual QA**
**Production source of truth:** `headspa-mastery.html`, technical module slot `11`

This document is the approved content and technical authority for Module 11. Per the master instructions' module lifecycle, this closes step 3 (external audit) and step 4 (approved specification) for Module 11 — step 5 (implementation, and the subsequent correction pass) followed in the same and a later authorized task, per the owner's explicit instruction.

It does not authorize changes to authentication, entitlements, payments, database policies beyond the already-completed Module 11 → 12 structural relocation, the Module 12 Final Exam redesign, persistent Cadence threads, the Guided Completion Path interface, or Listen Mode.

---

## Core thesis

**AI should strengthen the practitioner — not replace the practitioner.**

Supporting principle: *If you're going to use AI, learn to use it well.*

AIMT position: **Human-led. AI-assisted.**

Signature question: *What are you asking the tool to do — and what still belongs to you?*

Signature takeaway: *Use AI for leverage. Keep human authority where it matters.*

Learning identity: **Modern Practice Lab.**

This is a **pro-AI module.** It teaches competent use, not fear. Target balance: ~60% capability, ~40% verification/professional judgment/privacy/guardrails. It must not become a generic ChatGPT tutorial, an anti-AI warning lesson, an app directory, a computer-science lesson, or futuristic gimmickry.

---

## Approved outcomes

By the end of Module 11, the student should be able to:

1. Explain, in plain terms, where AI already shows up in modern practice (business systems, marketing, communication, research, education, automation, scalp imaging/analysis, client conversations).
2. Distinguish the durable categories of AI tools (language/reasoning assistants, creative AI, imaging/analysis, automation/practice systems) and what each is and isn't good for.
3. Give an AI tool a well-formed request using the B.R.I.E.F. framework, and identify what still requires human verification.
4. Apply the three-level trust framework (AI leads the draft / AI assists but you verify / final authority stays human) to a real practice task.
5. Explain what an AI-assisted scalp/hair confidence score is — and is not — and why it is information, not a verdict.
6. Respond to a client who has already consulted AI about their scalp/hair, using Hear → Observe → Boundary → Next Step, without ridiculing the client or the tool.
7. Apply a durable, non-brand-specific framework for deciding what client information/images an AI tool actually needs.
8. Identify concrete, low-risk uses of AI across marketing, client communication, business thinking, research, training, and administrative work — and where verification or human ownership still applies.

---

## Section-by-section approved structure (locked, corrected — August 25, 2026)

This section records the **actual implemented and corrected** structure. It supersedes the original draft structure, which used a headline-under-eyebrow pattern, six `✦`-marked category cards per grid, a five-card accordion for B.R.I.E.F., and four separate callouts for HEAR/OBSERVE/BOUNDARY/NEXT STEP — all overbuilt relative to the intended editorial, restrained design. See `implementation-log.md` for the specific correction record.

### Star (`✦`) restraint — governs the whole module

Exactly **two** intentional `✦` moments in the entire module:

1. **AIMT position** (opening, after the Cadence paragraph): *"If you're going to use AI, learn to use it well."*
2. **Closing principle** (end of 11.8, before `m11cp2`): *"Use technology to become more capable — not less present."*

No other `✦` appears anywhere in Module 11 — not on category cards, not on the B.R.I.E.F. key, not on the HEAR framework, not on the privacy framework, not on the practice-leverage cards. Where a marker helps scanning, use `+` (11.4's confidence-score factor list only) or plain typography — never a blanket icon-per-card default.

### Hero

- Eyebrow: `Module 11 · AI / Modern Practice Tools`
- Title (renders on two lines): **Human-led.** / **AI-assisted.**
- Description: *"AI is already becoming part of modern practice — from business and communication to research, imaging, and the questions clients bring into the room. The goal is not to hand over your judgment. It is to learn how to use these tools well."*
- Opening paragraph (polished AIMT/Cadence framing, unchanged in substance from the original draft): frames Cadence as the student's lived example of the course's human-led/AI-assisted philosophy.
- One `✦` callout: eyebrow **AIMT position**, text *"If you're going to use AI, learn to use it well."*

### 11.1 — Tool Literacy: "What AI Is Actually Good At"

Eyebrow `11.1 — Tool literacy`. Intro: *"The specific tools will change. The more durable skill is understanding what kind of job you're giving them — and what kind of output they can realistically produce."* Four category cards (`.concept-grid`, no icons): Language / reasoning assistants; Creative AI; Scalp / hair imaging analysis; Automation / practice systems — same substance as originally approved. Closing principle rendered as normal bolded prose, not a callout: *"**Professional-looking output is not automatically verified output.** Creative AI leaves accuracy, claims, brand fit, and final approval with the practitioner — never the tool."*

### 11.2 — Better Input: "Give AI a Better B.R.I.E.F."

Eyebrow `11.2 — Better input`. Intro: *"Better input produces more useful output. Prompting isn't magic wording — it's giving the tool a clear job."*

**B.R.I.E.F. compact teaching key** — a five-item reference row (letter + label + one-line description), not five cards or an accordion:

| | Label | Description |
|---|---|---|
| B | Background | What does the tool need to know? |
| R | Request | What do you actually want it to do? |
| I | Instructions | What tone, audience, boundaries, or requirements matter? |
| E | Expected Output | What should the finished response look like? |
| F | Fact-check | What still needs human verification? |

**"Build Your B.R.I.E.F." — one ungraded practice workspace** (the module's single formal interaction): a labeled `Ungraded practice · nothing here is saved or scored` tag, the starting prompt *"Write a post about my head spa."* shown at the top, then five compact rows (label + helper text + a scratch field) inside one visual container — not five accordion cards, not `.cp-input` styling. One optional reveal, **"See a completed example"**, shows a single complete B.R.I.E.F. example broken into B/R/I/E/F, labeled *"A strong example — not a required script."* No separate reflection field — the Fact-check row already asks what requires human review, so the question is not asked twice. Ungraded, revisable, no `APP_STATE` write, no persistence, no completion gate, no autoplay, keyboard + touch accessible, no color-only meaning, no gamification.

### 11.3 — Human Authority: "Decide How Much Authority to Give the Tool"

Eyebrow `11.3 — Human authority`. The module's signature question is surfaced here as a standalone course-authored statement (serif pull-quote typography, no card, no Cadence attribution): *"What are you asking the tool to do — and what still belongs to you?"*

**AI Use / Authority Matrix** — one coherent three-column framework (not three separate floating `.info-card`s), desktop three-column / mobile stacked:

- **Level 1 — AI can lead the first draft:** social copy, brainstorming, content calendars, service-description drafts, email drafts, messages, FAQs, internal organization. Human reviews.
- **Level 2 — AI can assist, but you verify:** research, ingredient explanations, product comparisons, pricing calculations, regulatory research, educational claims, business forecasting, source gathering. Core principle: *AI can accelerate the search. It does not eliminate verification.* Use authoritative sources when facts matter.
- **Level 3 — Keep final authority human:** diagnosing, establishing a medical condition, prescribing, deciding medical safety, exceeding professional role, making claims the practitioner could not responsibly make. Core rule: *the tool does not expand your professional authority.*

Below the matrix, the signature takeaway as a second standalone statement, no Cadence attribution: *"Use AI for leverage. Keep human authority where it matters."*

### 11.4 — Scalp & Hair Analysis: "A Confidence Score Is Information — Not a Verdict"

Eyebrow `11.4 — Scalp & hair analysis`. Title unchanged from the original draft (already strong and clear). Same substantive curriculum, restructured presentation:

- Two-column example (not `.clinical-note`): left column, **AI output** — *"Seborrheic dermatitis — 87%"*; right column, **Human review** — *"A model confidence score is information generated by the system — not a confirmed diagnosis. It may influence what you look at more closely, but it does not become 'You have seborrheic dermatitis' in your client language."*
- A restrained `+`-marked factor list: `+ Training data`, `+ Image quality / lighting`, `+ Capture conditions`, `+ Populations represented`, `+ Independent validation`.
- Closing paragraph unchanged in substance: no AI-engineering lesson needed, just enough literacy that a polished percentage never reads as universal truth; general conversational AI should not become the practitioner's scalp diagnostician.

### 11.5 — Client-Supplied AI: "When the Client Brings an AI Answer"

Eyebrow `11.5 — Client-supplied AI`. Opening meaning (replaces the old headline "Don't defeat the AI answer..." — that principle now closes the section instead): *"Clients are already arriving with information and conclusions they got from AI. The goal is not to ridicule the client, automatically agree with the result, or prove the software wrong. The professional skill is knowing how to receive the information and bring the conversation back to what you can responsibly establish."*

Client-statement examples card unchanged: *"I asked ChatGPT about my scalp and it says I have dandruff." · "I uploaded a photo and AI says this is psoriasis." · "AI says my hair loss is hormonal."*

**HEAR → OBSERVE → BOUNDARY → NEXT STEP — one unified, connected framework** (a single 2×2 grid on desktop, single-column numbered sequence on mobile — not four separate stacked callouts):

- **01 — Hear:** acknowledge what they brought in. *"Okay — tell me what you were noticing that made you look into it."*
- **02 — Observe:** return to the current consultation and what's actually observable today.
- **03 — Boundary:** explain what you can responsibly establish. *"That may have given you useful information to start with. What I can do here is talk through what we're actually seeing today. I can't confirm a medical diagnosis from an AI result."*
- **04 — Next step:** depending on what you actually find — continue/adapt, avoid the affected area, pause/decline, or recommend appropriate professional evaluation.

Closing statement (typographic emphasis, not a callout): *"The goal is not to defeat the AI answer. It is to return the conversation to responsible human judgment."*

Then `m11cp1` — **unchanged**, byte-identical to its original implementation.

### 11.6 — Privacy & Client Data: "Client Information, Images & AI"

Eyebrow `11.6 — Privacy & client data`. Intro (headline "Convenience does not cancel confidentiality" removed as the main title, its idea folded into supporting copy): *"Data and privacy practices differ by tool and change over time. Do not rely on one frozen claim about what 'AI' does with information."*

**Need / Minimize / Verify** — reuses the same three-part framework component as 11.3's authority matrix:

- **Need:** does the AI actually need this information or image?
- **Minimize:** can identifying details be removed? Can the task be completed with less client information?
- **Verify:** what are the tool's current data/privacy practices, account settings, permission/consent requirements, and applicable workplace/business requirements?

Closing note: *"Give the tool what the task needs — not everything you know. Uploading client scalp imagery into a general-purpose AI tool should not be treated as a casual default."*

### 11.7 — Practice Leverage: "Where AI Can Strengthen Your Practice"

Eyebrow `11.7 — Practice leverage`. Six category cards (`.concept-grid`, no icons), exact titles: **Marketing**, **Client Communication**, **Business Thinking**, **Research**, **Training / Staff Development**, **Administrative Leverage**. The "research with AI, verify outside AI" principle (open the source, read it, check the date, confirm it supports the claim) is folded directly into the Research card's own body copy rather than a separate callout.

### 11.8 — Human-Led Practice: "Stay Human Where Human Matters"

Eyebrow `11.8 — Human-led practice`. Opens with a standalone statement: *"Modern does not mean less human."* Then the AI/practitioner relationship, formatted as five short editorial line-pairs rather than one dense paragraph:

- **AI may draft.** The practitioner owns the message.
- **AI may organize information.** The practitioner owns the judgment.
- **AI may identify patterns.** The practitioner owns what gets communicated.
- **AI may help build the business.** The practitioner creates the experience.
- **AI may support education.** Human professionals still teach touch, technique, judgment, hands-on skill, client communication, and real-world decision-making.

The former "From Cadence" quote containing the signature question/takeaway was removed from this section — those two lines now correctly belong to AIMT and are surfaced in 11.3 instead, not attributed to Cadence in-character.

**Closing — the module's second and final `✦` moment:** eyebrow **Closing principle**, text *"Use technology to become more capable — not less present."* Followed by a plain supporting sentence: *"Protect the parts of professional practice whose value comes from being human: trust, touch, empathy, observation, judgment, accountability, hands-on skill, and the practitioner-client relationship."*

Then `m11cp2` — **unchanged**, byte-identical to its original implementation.

### Shared component reuse

- `.concept-grid`/`.concept-card` (11.1, 11.7) — icons removed.
- `.m11-brief-key`, `.m11-brief-workspace` (11.2) — new, Module 11-scoped, deliberately distinct from `.checkpoint`/`.cp-input`.
- `.m11-framework` (11.3, 11.6) — new, one component reused for both three-part frameworks.
- `.m11-hear` (11.5) — new, the unified HEAR grid.
- `.m11-statement` (11.3 ×2, 11.5, 11.8) — new, standalone course-authored statement typography.
- `.key-point` (AIMT Callout System) — used only for the two intentional `✦` moments.
- `.grid-2col`, `.cadence-note`, `.info-card` — existing shared components, reused as-is for 11.4's AI-output/human-review example.
- `.m11-scope` — new, Module 11's own desktop `.sec-title` breathing-room override (`max-width:32ch; line-height:1.08; letter-spacing:-0.008em` at `>=768px`), matching the `.m10-scope` precedent.

---

## Checkpoint specification

Two required checkpoints, `m11cp1` and `m11cp2`. Both must be graded `passed` for module completion, per the existing course-wide completion rule (no read-percentage minimum). Follows the per-checkpoint `M11.systems.m11cp1`/`m11cp2` rubric pattern established in Modules 3–5 and 9–10 (a single shared rubric is the older, superseded pattern) — not the older shared-rubric style.

### `m11cp1`

**Displayed and evaluated question (byte-identical, per the course-wide checkpoint standard):**

> A client tells you, "I asked ChatGPT about my scalp and it says I have dandruff." Walk me through how you would respond, what you would and would not confirm, and how you would decide what happens next.

**Pass criteria:** respectful acknowledgment; no ridicule of the client or the tool; no automatic agreement with the AI result; no diagnosis confirmation from AI alone; a return to observable findings; a stated professional boundary; a reasonable service/continue/modify/refer decision. Does **not** require anti-AI language or an automatic referral — a decision to proceed, with reasoning, can pass.

**Immediate-correction triggers (per `00-global-decisions.md`'s Cadence direction):** the answer confirms a medical diagnosis as fact; the answer mocks the client or AI; the answer claims the practitioner's license/authority is expanded by AI.

### `m11cp2`

**Displayed and evaluated question (byte-identical):**

> Choose one real task in your practice where AI could help. Write the request you would give the AI with enough context and direction to make the result useful, then explain what you would review or verify before using the output.

**Pass criteria:** a realistic, practice-relevant use case; sufficient context in the drafted request; a clear task; at least one meaningful constraint or instruction; human ownership of the final result stated or clearly implied; appropriate verification named for the specific task chosen; no inappropriate diagnostic/medical delegation to the AI. Does **not** require literal B.R.I.E.F. section labels if the underlying competency (context, clear ask, constraints, verification) is present.

Both checkpoints use the current accessibility foundation: `cp-res` feedback region with `aria-live="polite"`, `aria-label`s on voice/submit controls, associated `<label>` elements, Enter-to-submit/Shift+Enter-for-newline, a clear loading state, and the course's standard network-error text. Review Mode remains unsaved; previously passed state restores correctly on return.

---

## Approved Cadence behavior

**Role in Module 11:** AI-literacy and modern-practice coach.

Cadence must not: claim AI is always correct; claim AI is inherently bad; diagnose; invent citations; falsely claim verification; claim human practitioner experience; encourage unnecessary client-data sharing; imply AI expands professional/legal authority; present current platform policies as permanent facts.

Cadence should distinguish a **draft** from an **inference** from a **verified fact** from a **human decision.**

**Approved quick prompts (exact, unchanged by the correction pass):**

1. `Help me turn this into a better AI brief.`
2. `How should I respond when a client brings an AI diagnosis?`
3. `How should I evaluate an AI scalp-analysis result?`

**Module-open greeting (locked, corrected — August 25, 2026):** *"Human-led. AI-assisted. This module is about using AI well — not fearing it or handing it your judgment. Ask me anything as you work through the tools."* — aligned to the corrected hero identity; the system prompt itself (role, must-not list) is unchanged.

---

## Downloadable resource opportunity

**Approved future resource:** AIMT AI Practice Toolkit — B.R.I.E.F. Prompt Builder, weak → stronger prompt examples, the three-level AI Use Matrix, Hear → Observe → Boundary → Next Step, an output-verification checklist, a client-data/image check, and a practice prompt library for marketing, communication, SOPs, research, business, and training.

**Not built during this implementation task**, per the current project workflow's dedicated-resource-pass convention (matching Module 9's and Module 10's own downloadable-installation pattern — implemented as its own later, separate step) and the explicit instruction not to create a dead placeholder. The truthful next-task status after implementation is: *Implemented — awaiting resource pass + manual QA.*

---

## Interaction density

**Light-to-moderate.** One formal ungraded interaction (Build a Better B.R.I.E.F.) plus two required checkpoints. The module's other teaching moments (the three-level trust framework, the confidence-score worked example, Hear → Observe → Boundary → Next Step) are taught through explanation and worked example rather than additional interactive components — consistent with `00-global-decisions.md`'s "Varied learning rhythm": density is a per-module judgment call, not a fixed quota, and this module's signature learning moment is the B.R.I.E.F. interaction itself.

---

## Guided completion structure

- **Estimated learning time:** 18–24 minutes (denser than a pure-conceptual module because of the four AI-category framework, the trust-level matrix, and the Hear/Observe/Boundary/Next Step sequence, but no video content).
- **Estimated checkpoint time:** 8–12 minutes for both checkpoints combined.
- **Hands-on/application time:** 5–10 minutes for the B.R.I.E.F. interaction itself, plus optional real-world application (trying the framework on an actual practice task).
- **Competency demonstrated:** competent, verified AI use in a professional head spa practice — giving AI a well-formed request, applying the right trust level to the right task, and responding professionally when a client brings an AI-sourced claim.
- **Suggested practice:** apply the B.R.I.E.F. framework to one real upcoming task (a client email, a service description, a social post) before the next client day.
- **Earlier concepts to revisit:** Module 1's scope/referral judgment (directly reused in 11.5's boundary-setting); Module 4's observation-vs-diagnosis framing (directly parallels 11.4's confidence-score literacy).
- **Position in the Guided Completion Path:** second-to-last instructional module, immediately before the Module 12 Final Exam — positioned as a capstone modern-practice skill rather than a foundational one, since it draws on judgment built across the whole course.

---

## Listen Mode notes

- **Narration suitability:** strong candidate for most of the module — the four AI-category framework, the B.R.I.E.F. framework, the trust-level matrix, and Hear/Observe/Boundary/Next Step are all prose- and dialogue-driven, not visual.
- **Approximate narration length:** ~10–13 minutes for the instructional content (excluding the interaction and checkpoints, which are not audio-only-completable).
- **Visual-review cues needed:** the B.R.I.E.F. interaction itself (the student edits a prompt in stages) and the confidence-score worked example (a displayed percentage) both need on-screen attention.
- **Screen-required content:** the B.R.I.E.F. interaction UI.
- **Video-only content:** none planned for this module.
- **Listening does not prove competency by itself** — both checkpoints still gate completion regardless of narration use, per the course-wide Listen Mode rule.

---

## Completion and gating

- Module 11 unlocks when Module 10 is complete (existing sequential-unlock rule, unchanged).
- Module 11 is complete when both `m11cp1` and `m11cp2` are graded `passed` (checkpoint-gated, like Modules 1, 4–10 — not manually completed like the former slot 11).
- Completing Module 11 unlocks Module 12 (Course Completion & Certification, relocated per the structural move).
- The completion card should follow the established `m<N>Complete` pattern (see Modules 9–10) and hand off accurately to Module 12 — replacing Module 10's current "Up next — Module 11 (locked) ... not yet available" text, which becomes false once this implementation lands.

---

## Accessibility

Follows the current course-wide foundation (per `00-global-decisions.md`'s "Course foundation consistency"): shared body-text/heading/eyebrow treatment, semantic color tokens (success/error/warning/neutral, no color-only meaning), the shared checkpoint component and textarea/voice/submit treatment, `aria-live` feedback regions, associated `<label>` elements, visible focus, keyboard and touch operability for the B.R.I.E.F. interaction, and no mobile horizontal overflow.

---

## Acceptance criteria

1. Opening section establishes AIMT's rationale for teaching AI and accurately frames Cadence per the approved language — no unsupported "first/only/revolutionary" claims.
2. 11.1–11.8 implemented in the approved order, with the approved headlines/core principles present.
3. The four AI-category framework (language/reasoning, creative, imaging/analysis, automation) is taught by function, not by naming specific current products as required tools.
4. B.R.I.E.F. framework taught in full (Background, Request, Instructions, Expected Output, Fact-check), with the Fact-check list matching the approved items.
5. Build a Better B.R.I.E.F. interaction implemented exactly as specified: starts from the approved seed prompt, is ungraded, revisable, gives text feedback, writes no `APP_STATE`/progress, gates nothing, has no autoplay, and is keyboard + touch accessible.
6. Three-level trust framework (AI-leads / AI-assists-you-verify / human-final-authority) implemented with the approved examples and core principles.
7. 11.4's confidence-score example matches the approved wording and does not present a score as a diagnosis.
8. 11.5 implements Hear → Observe → Boundary → Next Step without requiring an exact script, without ridicule, and without automatic AI-diagnosis agreement.
9. 11.6 avoids blanket claims about "all AI systems" and teaches the durable question framework instead.
10. 11.7 covers all six listed practice-use categories.
11. 11.8 closes on the approved "human + AI, human leading" framing and the "more capable, not less present" principle.
12. `m11cp1`/`m11cp2` displayed and evaluated question strings are byte-identical to this document's exact wording.
13. Each checkpoint uses its own `M11.systems.m11cp1`/`m11cp2` rubric (not a shared rubric), matching the current course pattern.
14. Cadence's role, "must not" list, and the three exact quick prompts match this document.
15. No downloadable is created or falsely linked in this implementation pass.
16. Module 10's stale "Up next — Module 11 ... not yet available" text is corrected.
17. Completion requires both checkpoints; Module 12 unlocks only after Module 11 completes.
18. Desktop and mobile layouts pass the course's standard visual/accessibility checklist; no horizontal overflow; no color-only meaning.
19. **(Correction pass)** Exactly two `✦` moments appear in Module 11 student-facing content — the AIMT position callout and the closing principle callout. No category card, framework, or routine "Remember" note uses a star icon.
20. **(Correction pass)** The B.R.I.E.F. interaction is one workspace with five compact rows (not five accordion cards), uses `.m11-brief-input` (not `.cp-input`), and has exactly one example reveal (not five).
21. **(Correction pass)** HEAR/OBSERVE/BOUNDARY/NEXT STEP renders as one unified, visually connected framework — not four separate `.key-point` callouts.
22. **(Correction pass)** `m11cp1`, `m11cp2`, `M11.systems.m11cp1`/`m11cp2`, the three Cadence quick prompts, checkpoint IDs, and all completion/unlock/migration logic are confirmed byte-identical to the pre-correction implementation.

---

## Implementation notes

Implementation proceeded directly from this document in the original authorized task (structural move → source extraction → this specification → implementation, all in one authorized task). A subsequent, separately authorized **correction pass** (August 25, 2026) corrected the drift documented at the top of this file — this document was updated in place to reflect the corrected, locked structure rather than being left describing the superseded overbuilt version. Static validation and Review Mode desktop/mobile QA are complete for both the original implementation and the correction pass; only the owner's own rendered-preview review can advance status to "manual QA approved," per the master instructions' manual-approval rule — that has not yet occurred.
