# Module 10 — Sanitation & Reset Systems — Source Extraction (Pre-Audit)

**Status:** Neutral pre-audit extraction. **Not** an external audit, not a
rewrite, not an implementation specification, not a polish pass. Per the
master instructions' module lifecycle, this is step 2 (source extraction) —
step 3 (external audit) has not begun.

**Do not treat this file as final content authority.** Per the source
hierarchy in `00-aimt-course-audit-master-instructions.md`, a
`module-XX-source.md` file is never implementation authority — it exists to
locate existing content and technical wiring for the external audit that
comes next.

**Current technical position:** technical module `10`, student-facing
**Module 10**. Content originates from the *pre-reorder* technical module
`9` ("Sanitation & Reset Systems," `headspa-mastery.html:6520–6676` before
the Module 9 reorder), relocated intact into technical slot `10` as a
structural dependency of the Module 9 9↔10 reorder (see
`module-09-reorder-migration-plan.md` and `module-09.md`'s "Structural
reindex boundary"). **The content itself has never been externally
audited** — only its technical slot changed. Checkpoint IDs `m9cp1`/`m9cp2`
were preserved unrenamed through the move and are now required by
`MODULE_CHECKPOINTS['10']`.

---

## 1. Module identity

- Wrapper: `module10Wrap` (`headspa-mastery.html:6557–6710`).
- Hero eyebrow: "Module 10 · Sanitation & Reset Systems."
- Hero title: "This is not<br>behind-the-scenes."
- Hero description (verbatim): *"Most people treat sanitation and reset as
  something separate from the service. It's not. Clients may not watch you
  clean — but they feel freshness, organization, and readiness. And they
  also feel leftover clutter, damp linens, and signs of the previous
  client. That's what breaks a premium experience."*
- No student-facing "Module 9" self-reference remains inside `module10Wrap`
  itself — the wrapper's own copy is internally consistent with its current
  slot-10 identity. (Cadence's own configuration is a separate story — see
  §9 below.)

---

## 2. Source map

| Element | Location |
|---|---|
| Module wrapper | `headspa-mastery.html:6557–6710` |
| `MODULE_TITLES['10']` | reads "Module 10 — Sanitation & Reset Systems" |
| `MODULE_CHECKPOINTS['10']` | `['m9cp1', 'm9cp2']` (`headspa-mastery.html:7163`) |
| Checkpoint questions/data | `M9` object, `headspa-mastery.html:7979–7985` |
| Checkpoint submit functions | `submitM9CP`/`m9cpKey`, `headspa-mastery.html:8957–8968` |
| Cadence guide system | `MODULE_GUIDE_SYSTEMS['10']`, `headspa-mastery.html:8049` |
| Cadence quick prompts | `MODULE_QUICK_PROMPTS[10]`, `headspa-mastery.html:8064` |
| Reset-sequence interaction JS | `startResetTimer()`/`advanceResetStep()`, `headspa-mastery.html:9211–9234` |
| Module-open routing | `9: ... module9Wrap`, `10: ... module10Wrap`, `headspa-mastery.html:8262–8263` |

This is, by a wide margin, the **smallest instructional module in the
course** — 153 lines of markup versus several thousand for Modules 5–9.
There is no dedicated asset folder (`assets/images/course/module-10/` does
not exist) and no downloadable is currently installed.

---

## 3. Complete student-facing content (verbatim, in student-encounter order)

Reproduced in full — not paraphrased — so later external audit can assess
exact claims without re-reading the production file, per the task's
instruction to preserve enough exact wording to audit questionable claims
later.

### Opening frame (unlabeled, precedes 10.1)

> **Cleaning vs resetting — not the same thing**
> **You need both. Most people only do one.**
> Cleaning removes what was used. Resetting prepares for what's next. If
> you only clean, your station looks empty and you start the next service
> unprepared — reaching mid-service, hesitating, scrambling. If you reset
> properly, everything is ready, you move without interruption, and your
> service feels controlled from the first moment.
>
> *(key-point)* **The standard:** After reset, your room should look like
> the next client is about to walk in right now. If it doesn't, reset is
> not complete.

### 10.1 — What you sanitize and when

> **Clean what clients touch. Every time. No exceptions.**
> High-touch surfaces must be sanitized between every single client. There
> is no "it looks clean" exception. Cross-contamination is how clients get
> hurt and how practitioners lose licenses. The standard exists because
> skin-to-surface contact is direct — and your clients are trusting you
> with that.

Six-card grid (`.sanit-grid`):

| Frequency badge | Card title | Card body (verbatim) |
|---|---|---|
| Every client | Halo & water system | "Full flush sequence — Barbicide rinse, then plain water until clear. Never skip this. The halo contacts the client's scalp directly." |
| Every client | Bed vinyl & surfaces | "EPA-registered disinfecting wipe on all vinyl surfaces, handles, cart trays, and anything the client or your hands touched during service." |
| Every client | Tools in Barbicide | "Combs, brushes, clips — fully submerged for the manufacturer's required contact time. Separate bins for clean and dirty. Never place a dirty tool near a clean one." |
| Daily | Bed maintenance check | "Follow manufacturer instructions for your specific model. Heated pump beds and standard models have different requirements. Know yours." |
| Weekly | Deep clean | "Halo line cleaner — manufacturer-specific product, not generic. Run the full recommended sequence. Log it." |
| Weekly ("Log it") | Sanitation records | "Date, time, products used, who performed it. This documentation protects you in an audit and in a client complaint. Keep it current." |

Cadence-note quote box (`.cadence-note`, the course's shared "From Cadence"
component, used identically across every module):

> "Sanitation is not glamorous but it is the most professional thing you
> do. The moment you start skipping steps because you're busy is the
> moment you're working outside your professional standards — regardless
> of how clean it looks."

### 10.2 — The reset sequence

> **Under 15 minutes. Every time.**
> A reliable reset sequence means you are never scrambling between
> clients. The goal is a repeatable series you can complete in under 15
> minutes that returns the room to exactly the state it was in when the
> previous client arrived. The less decision-making required, the faster
> and more consistent it becomes.
>
> *Interaction hint:* "↓ Tap Start to walk through the sequence"

Nine-step sequence (`#resetSequence`, each step has a number, title, body,
and a displayed `~X min` badge):

| # | Title | Body (verbatim) | Displayed time |
|---|---|---|---|
| 01 | Halo flush | "Barbicide rinse immediately after client leaves, then plain water until clear. Start this first — it runs while you do everything else." | ~3 min |
| 02 | Strip the bed | "All linens into the dirty bin. Sheet, headrest cover, towels used. Clean set ready to go." | ~1 min |
| 03 | Wipe all surfaces | "EPA-registered wipe on bed vinyl, cart surfaces, handles, tray. Everything touched — yours or theirs." | ~2 min |
| 04 | Tools to Barbicide | "Combs, brushes, clips — into the dirty bin first, then submerge in Barbicide for required contact time. Do not rush contact time." | ~1 min |
| 05 | Make the bed | "Fresh sheet, headrest cover. Knee bolster in place. Eye mask ready. Bed warmer on." | ~2 min |
| 06 | Restock product dishes | "Three bowls refilled: shampoo, mask, exfoliant. Applicator brush clean and ready. Massage oil and lotion accessible." | ~2 min |
| 07 | Refresh ambient | "Diffuser refreshed if needed. Lighting reset. Music still running. Room temperature checked." | ~1 min |
| 08 | Reload towel warmer | "Fresh towels in and warming. Confirm warm before next client arrives — not just loaded." | ~1 min |
| 09 | Final check | "Walk the room as if you are the client. Anything out of place, anything missing, anything that breaks the experience? Fix it now." | ~1 min |

The nine displayed estimates sum to exactly 15 minutes. Button: "Start
reset walkthrough →" (`onclick="startResetTimer()"`). On completion, a
hidden `#resetComplete` panel displays: "Room reset complete." / "Under 15
minutes. Every time." — see §7 below for exactly what this interaction
does and does not do functionally.

### 10.3 — Compliance

> **Know your state requirements. Check them annually.**
> State regulations regarding sanitation requirements for head spa
> services vary and are updated periodically. What was compliant last year
> may not be this year. Check your state board's current requirements at
> minimum once a year. Keep records of your sanitation practices — date,
> time, products used. This documentation protects you if you are ever
> audited or if a client complaint is filed.

Info-card, "What to keep in your sanitation log": "Date and time of each
sanitation procedure · Products used and dilution ratios · Contact times
for disinfectants · Who performed the sanitation · Any equipment issues
noted · Bed maintenance dates and what was done"

Info-card, "What this looks like under pressure":
> "You are running behind. One client just left. The next client arrives
> early."
> **Weak system:** "rushed cleaning, missing items, scattered tools. Next
> service starts unstable."
> **Strong system:** "automatic reset, no thinking required, everything
> already in place. Next service starts controlled. The difference is not
> discipline in the moment — it's the system you built before the
> moment."

Key-point: "**Pressure test your system:** Can I reset without thinking?
Does this hold up when I'm behind? Is everything always within reach? If
not, the system is not complete."

### 10.4 — Checkpoint (`m9cp1`)

> **Walk me through your reset.**
> After a 2-hour service, walk through your complete reset sequence. Name
> the steps in order and explain what happens if you skip one — any one.
> What is the consequence?

### 10.5 — Checkpoint (`m9cp2`)

> **A client calls the next day.**
> A client calls to say she developed a rash on her neck the day after her
> service. Walk through how you investigate and respond — to her, and
> internally.

### Completion card (`#m10Complete`)

> ✓ **Module complete.**
> "You can deliver a great service. You can reset it cleanly. That
> discipline is what makes the experience repeatable — for every client,
> every time."
> **Up next — Module 11 (locked):** "AI / Modern Practice Tools. This
> module is not yet available — it will unlock once it has been built."
> Button: "Back to course" (`onclick="showHome()"`).

The completion-card handoff already correctly names Module 11 as locked/
unavailable with no live functional route — this satisfies `module-09.md`
acceptance criterion 22(b) as-is; no correction is needed here regardless
of what Module 10's own audit later decides about its curriculum.

---

## 4. Current section structure and structural residue from the 9↔10 move

Rendered order: unlabeled cleaning-vs-resetting frame → 10.1 (sanitize
grid) → 10.2 (reset sequence) → 10.3 (compliance) → 10.4 (`m9cp1`) → 10.5
(`m9cp2`) → completion. No gap or renumbering error was found — the
section numbers (10.1–10.5) are internally consistent with the wrapper's
own slot-10 identity.

**Intentional, documented mismatch (not a bug):** the wrapper is
`module10Wrap` and its section numbers read `10.x`, but its checkpoint
element IDs and JS function names still read `m9cp1`/`m9cp2`/`submitM9CP`/
`m9cpKey` — the pre-reorder Module 9 (Sanitation) naming, kept unrenamed
per `module-09-reorder-migration-plan.md`'s explicit design (checkpoint ID
strings are not renamed by the reorder; only which slot requires them
changes, via `MODULE_CHECKPOINTS`). This is the same class of intentional
wrapper/checkpoint-ID mismatch already documented for Module 9's own
`module9Wrap` (which contains `m10cp1`/`m10cp2`-prefixed markup) — a real,
disclosed residue of the reorder, not something to silently "fix" by
renaming IDs.

**No other structural residue was found.** A targeted read of the full
wrapper found no stray "Module 9" text, no orphaned reference to the old
technical position, and no broken internal cross-reference.

---

## 5. Sanitation curriculum topic coverage

Cross-referenced against the task's required capture list. Confirmed
present, confirmed absent, or partial, with location:

| Topic | Coverage |
|---|---|
| Cleaning (general) | Present — the opening frame's cleaning-vs-resetting distinction. |
| Disinfection | Present — Barbicide rinse (halo, tools), EPA-registered wipes (surfaces). No specific EPA registration number, dilution ratio, or contact-time figure is stated in the lesson copy itself (the log-card asks the *student* to record "contact times for disinfectants," implying the student's own product's label, not an AIMT-specified number). |
| Sanitation (as a distinct concept from disinfection/sterilization) | Not explicitly distinguished — "sanitize," "disinfect," and "clean" are used loosely/interchangeably throughout (e.g., "Clean what clients touch" as the 10.1 headline, followed immediately by disinfection-level instructions). See §6. |
| Reset (as distinct from cleaning) | Present, and the module's own strongest distinction — the entire opening frame exists to make this point. |
| Linens | Present — "Strip the bed" (step 02) and "Make the bed" (step 05) in the reset sequence; no linen-laundering method, temperature, or turnaround standard is stated. |
| Tools / implements | Present — Barbicide immersion, "manufacturer's required contact time," separate clean/dirty bins. |
| Basin / equipment | Present — halo & water system, "Halo flush," bed maintenance ("Follow manufacturer instructions... Know yours"). |
| Surfaces | Present — bed vinyl, cart surfaces, handles, tray. |
| Product handling | Partial — "Restock product dishes" (step 06) covers restocking, not product-contamination handling (e.g., double-dipping, single-use vs. multi-use product policy is not addressed anywhere in the module). |
| Laundry | Not addressed beyond "into the dirty bin" — no laundering method, temperature, detergent, or off-site vs. on-site handling is taught. |
| Contaminated items | Partial — "dirty bin" concept exists; no explicit blood/body-fluid or visibly-contaminated-item procedure exists anywhere in the module (see §6, flagged as a possible gap). |
| Storage | Partial — "clean set ready to go," clean/dirty tool bin separation; no explicit closed-container/shelf-height/labeling storage standard is stated. |
| Between-client reset | Present — this is the module's primary subject (10.2's nine-step sequence). |
| Opening/closing procedures | Not addressed — the module covers between-client reset only; no start-of-day or end-of-day procedure (initial room setup before the first client, end-of-day deep-clean/lockup routine) appears anywhere. |
| Timing/sequence | Present — the nine numbered steps, the "under 15 minutes" target, "Start this first — it runs while you do everything else" sequencing logic for the halo flush. |
| Practitioner habits | Present — the "pressure test your system" framing, the weak-system/strong-system contrast card. |

---

## 6. Safety / regulatory claims — flagged, not corrected

Per the task's explicit instruction: flagged here as current source claims
for external audit's benefit; **not researched, verified, or corrected in
this extraction.**

- **"Under 15 minutes" as a universal reset-duration target**, stated
  twice as an absolute ("Under 15 minutes. Every time.") and reinforced by
  the nine-step time badges summing to exactly 15. No basis is cited for
  why 15 minutes is the correct or achievable universal figure across
  service types, room layouts, or staffing models — comparable in kind to
  the already-corrected Module 9 universal-benchmark pattern (`$120–150/hr`),
  though the domain here is operational rather than financial.
- **"Halo flush is always first after service"** — stated as an absolute
  sequencing rule ("Start this first"), with a stated rationale (it runs
  unattended while other steps proceed) rather than a cited safety
  requirement. Worth external verification of whether this is genuinely
  universal or a documented AIMT operational preference.
- **Contact-time claims** — "fully submerged for the manufacturer's
  required contact time" (tools) and "Do not rush contact time" are
  appropriately deferred to the manufacturer's own label rather than
  stating a specific number in the lesson — this pattern is *not* flagged
  as a problem, but is noted since it contrasts with other claims below
  that are more specific.
- **"EPA-registered disinfecting wipe"** — names a regulatory category
  (EPA registration) without further qualification (e.g., EPA registration
  for what specific claim — bloodborne pathogens, general disinfection,
  a specific contact time). Worth external verification of whether this
  phrasing accurately represents EPA registration's actual scope.
- **Disinfection vs. sanitation vs. sterilization terminology** — the
  module title says "Sanitation," section 10.1's headline says "Clean,"
  and the actual described procedures (Barbicide immersion, EPA-registered
  wipes) are disinfection-level actions. No explicit definition of
  sanitation vs. disinfection vs. sterilization appears anywhere, and the
  three terms are used loosely. Flagged per the task's explicit "sterilization
  vs. disinfection confusion" category.
- **Porous vs. nonporous handling** — not addressed. Linens (porous) and
  vinyl/tools (nonporous) receive different treatment in practice (laundering
  vs. wiping/immersion) but the module never states this as a principle —
  a student could plausibly wonder why linens aren't also wiped with the
  EPA-registered product named for surfaces.
- **Laundry claims** — no laundering method, water temperature, or
  detergent/disinfectant-additive standard is stated anywhere; "into the
  dirty bin" is the full extent of laundry-related instruction.
- **Blood/body-fluid or visibly-contaminated-item procedure** — no
  explicit procedure exists anywhere in the module for a scenario
  involving blood, broken skin, or another body-fluid exposure during
  service (relevant given Module 5/6 already teach stop-service/referral
  judgment for scalp presentations, but the *sanitation-side* procedure
  for what happens to tools/linens/surfaces after such an event is not
  addressed here). Flagged as a possible genuine content gap, not merely
  a wording concern.
- **"Sanitation logs protect you legally"** — an unqualified legal-benefit
  claim (documentation "protects you in an audit and in a client
  complaint," "This documentation protects you if you are ever audited or
  if a client complaint is filed"), stated as settled fact with no
  jurisdiction-dependent qualification. This is the same class of
  unqualified-certainty claim the Module 9 audit corrected elsewhere in
  the course (e.g., the underpricing/burnout causal-guarantee correction).
- **"State regulations vary and are updated periodically... check your
  state board's current requirements at minimum once a year"** — this is
  the module's only acknowledgment that requirements are jurisdiction-
  specific, and it appropriately avoids stating what any specific state
  requires. However, it is the *only* scope qualifier in the entire
  module — every other claim above (15-minute target, halo-flush-first,
  EPA-registered products, contact times, "protects you legally") is
  stated in the same universal, unqualified voice, without being visibly
  tied back to this one compliance caveat.
- **The checkpoint rubric's own restatement of these claims** — `M9.system`
  (see §9 below) repeats several of the above as Cadence's graded "key
  concepts" (15-minute target, halo-flush-first, "logs protect you legally"),
  meaning any correction external audit makes to the lesson content would
  also need to reach the grading rubric, not just the rendered copy.

---

## 7. Current interactions

### Interaction 1 — Reset sequence walkthrough (`#resetSequence`)

- **Name:** Reset sequence walkthrough (unofficial — the module itself
  calls it "the reset sequence," no formal interaction name is given).
- **Location:** Section 10.2, `headspa-mastery.html:6626–6639` (markup),
  `startResetTimer()`/`advanceResetStep()` (`headspa-mastery.html:9211–9234`).
- **Exact student task:** Click one button ("Start reset walkthrough →").
  There is no other student input — no step is individually clickable, no
  choice is made, nothing is typed, ordered, or evaluated.
- **Exact functionality, verified by direct code reading:**
  `startResetTimer()` calls `advanceResetStep()` once immediately, then
  again every 2200ms via `setInterval`. Each call removes the `.active`
  class from every `.rst-step`, adds `.active` to the next step in DOM
  order, and calls `scrollIntoView()` on it. After the ninth step has been
  highlighted, the next call clears the interval and reveals
  `#resetComplete`. **This is a fixed-cadence auto-advancing visual
  highlight, not a timer** — the interval is a constant 2.2 seconds per
  step regardless of the step's own displayed `~1–3 min` estimate; the
  displayed per-step times are decorative text, not functional timer
  values. The whole nine-step sequence auto-completes in ~19.8 seconds
  regardless of what a real reset would take.
- **Timing logic:** none tied to real elapsed time; purely a fixed
  `setInterval` cadence, as above.
- **Student instructions:** "↓ Tap Start to walk through the sequence"
  (interaction hint) and the button's own label, "Start reset walkthrough
  →." No instruction communicates that this is a passive, auto-advancing
  preview rather than a real practice timer a student could use to time
  themselves.
- **Learning purpose (as currently built):** ambiguous. It restates the
  nine steps sequentially with a visual highlight, which has some
  observation/recall value, but does not require the student to recall,
  order, decide, explain, apply, or communicate anything — it is closer to
  animated illustration than to any of the course's approved interaction
  patterns (per `00-global-decisions.md`'s "Interaction standard").
- **Graded/ungraded:** ungraded — confirmed no `APP_STATE` write anywhere
  in `startResetTimer()`/`advanceResetStep()`.
- **Progress behavior / persistence:** none. Nothing is saved; reopening
  the module does not remember whether the walkthrough was ever started.
- **Reset behavior:** the `.active` class and `_resetCurrentStep` counter
  are page-state only (not investigated further whether re-clicking
  "Start" after completion is possible — the button is hidden via
  `this.style.display='none'` on click and never re-shown, so the
  interaction currently **cannot be replayed without reloading the page**).
- **Accessibility:** no `aria-live` region announces step changes to
  assistive technology; the highlighted/active state is conveyed via
  background-color and text-color changes only (`.rst-step.active` — dark
  background, light text) with no textual "current step" indicator beyond
  the visual highlight itself — a color/visual-only state change, not
  paired with a text label announcing which step is active. The single
  "Start reset walkthrough →" button has a clear text label (not a
  color-only-meaning concern), but is not `aria-label`led beyond that text.
- **Whether it still makes sense conceptually:** flagged, not decided, for
  external audit — the interaction currently functions as decoration (an
  auto-playing highlight sequence) rather than a genuine ungraded learning
  interaction meeting the course's "Observe / Recall / Distinguish /
  Sequence / Decide / Explain / Apply / Communicate" standard. Per
  `00-global-decisions.md`'s "Rejected mechanics" list (which explicitly
  rejects "autoplay"), an unprompted auto-advancing sequence is at minimum
  worth external-audit scrutiny against that standing rule, even though
  this interaction requires a single manual click to begin rather than
  playing automatically on page load.

### Interaction 2 — none other found

No second interaction, scenario, sort, compare-and-decide, or any other
mechanic exists anywhere in `module10Wrap` beyond the reset-sequence
walkthrough above and the two required checkpoints (§8). Module 10's
interaction density is the lowest of any inspected module in the course —
comparable to the pre-audit technical Module 10 (Pricing)'s own
"effectively zero beyond the calculator and two checkpoints" finding
recorded in `module-09-source.md` §3.

---

## 8. Current checkpoints

### `m9cp1`

- **Displayed question** (10.4 body text): "After a 2-hour service, walk
  through your complete reset sequence. Name the steps in order and
  explain what happens if you skip one — any one. What is the
  consequence?"
- **Evaluated question** (`M9.questions.m9cp1`): "Walk through your
  complete reset sequence after a 2-hour service. What is the order, and
  what happens if you skip a step?"
- **Displayed/evaluated parity:** **not** byte-identical — reworded, not
  merely reformatted (e.g., "explain what happens if you skip one — any
  one. What is the consequence?" versus "what happens if you skip a
  step?"). This is the same class of displayed/evaluated mismatch already
  corrected in Modules 1–8 and in Module 9's own `m10cp1`/`m10cp2` — never
  corrected here.
- **Rubric:** shared, not per-checkpoint — see `M9.system` in §9.
- **Moduleid used for submission:** `submitCheckpoint(10, id, ...)` inside
  `submitM9CP()` — correctly targets slot 10 (confirmed post-reorder
  correct).
- **Completion dependency:** both `m9cp1` and `m9cp2` must pass for Module
  10 completion (derived via the shared `_syncDerivedState()`/
  `MODULE_CHECKPOINTS['10']` pipeline — not module-specific logic).
- **Error handling:** `submitM9CP` passes the error text "Cadence couldn't
  review your answer. Check your connection and try again." — a generic,
  non-module-specific message (contrast with Module 9's own `submitM10CP`,
  which passes a pricing-specific message — "Cadence couldn't review your
  pricing...").
- **Review Mode behavior:** inherited from the shared `submitCheckpoint()`
  pipeline — not independently re-verified in this extraction (out of
  scope for a documentation-only source extraction; no browser QA was
  performed).
- **Accessibility markup:** `<textarea class="cp-input" id="m9cp1In">` has
  a `placeholder` but no associated `<label>`; the voice button has a
  `title` attribute ("Speak your answer") but no `aria-label`; the submit
  button ("Submit to Cadence →") has no `aria-label`; the response region
  is `<div class="cp-response" id="m9cp1Res">` — the pre-correction class
  name (`cp-response`, not the corrected foundation's `cp-res`) with no
  `aria-live` attribute at all.

### `m9cp2`

- **Displayed question** (10.5 body text): "A client calls to say she
  developed a rash on her neck the day after her service. Walk through how
  you investigate and respond — to her, and internally."
- **Evaluated question** (`M9.questions.m9cp2`): "A client calls to say she
  developed a rash on her neck the day after her service. Walk through how
  you investigate and respond."
- **Displayed/evaluated parity:** **not** byte-identical — the displayed
  version adds "— to her, and internally" with no counterpart in the
  evaluated string.
- **Rubric, moduleId, error handling, accessibility:** identical pattern to
  `m9cp1` above — same shared `M9.system` rubric, same generic error text,
  same `cp-response`/no-`aria-live`/no-`aria-label` gaps.

### Shared rubric — `M9.system`

Full text, verbatim (`headspa-mastery.html:7984`):

> "You are Cadence, instructor of HeadSpa Mastery. Module 10 (Sanitation &
> Reset Systems) checkpoint. Question: '[q]'. Key concepts: reset sequence
> must be repeatable and under 15 minutes. Halo flush is always first
> after service. Separate bins for clean and dirty tools — never mix. Bed
> vinyl wiped between every client. Sanitation logs protect you legally.
> Post-service client complaint: document, review sanitation log, check
> product used, respond with calm and specific information — never
> defensive. State regulations vary and must be checked annually. 3-5
> sentences, direct and warm."

Confirmed findings:

- **Single shared rubric for both checkpoints** — `M9.system` is a
  function taking only the question string, not the per-checkpoint
  `M9.systems.m9cp1`/`m9cp2` structure Modules 1–9 otherwise use. This is
  the same architecture gap `module-09-source.md` §8 already flagged for
  the pre-reorder technical Module 10 (now corrected there as part of
  Module 9's implementation) — never corrected here.
- **Old course identity, uncorrected.** "instructor of HeadSpa Mastery" —
  the pre-audit course name, already corrected out of Modules 0–9's own
  guide systems and rubrics, still present verbatim in this rubric. This
  is a genuine regression risk if left uncorrected once Module 10's own
  audit proceeds, since the standing course-wide rename rule (`00-global-
  decisions.md`, "Course name") applies to student-facing copy generally,
  and a Cadence-generated grading response is student-facing.
- **The rubric restates several of the flagged §6 safety/regulatory claims
  as graded "key concepts"** (15-minute universal target, halo-flush-
  always-first, "logs protect you legally," "state regulations vary and
  must be checked annually" without further qualification) — meaning a
  student could be marked incomplete for not repeating a claim that
  external audit may later revise or remove.
- **`submitM9CP` targets moduleId `10` correctly** — the actual
  progress-slot wiring is correct post-reorder, distinguishing a genuine
  content-currency problem (old course name, unreviewed safety claims)
  from a technical-wiring problem (there is none found here).

---

## 9. Current Cadence behavior

### Guide system — `MODULE_GUIDE_SYSTEMS['10']`

Full text, verbatim (`headspa-mastery.html:8049`):

> "You are Cadence — a mentor built from nearly two decades in the head
> spa industry. The student is in Module 10 (Sanitation & Reset Systems):
> halo flush first always, separate bins, reset under 15 minutes, log
> everything. If the student comes from a licensed background, connect
> this to what is specific about a wet scalp service environment.
> Consistency here makes or breaks the premium head spa experience. 3-5
> sentences. No bullet points."

Confirmed findings:

- **"a mentor built from nearly two decades in the head spa industry"** —
  the exact personal-practitioner-experience persona claim already removed
  from Modules 0–9's own guide systems (replaced there with "AIMT's
  curriculum-grounded guide... your guidance was built from the
  instructor's applied experience; you do not claim that experience as
  your own"). Present here verbatim, uncorrected.
- **No old course name** ("HeadSpa Mastery") appears in this specific
  string — only the `M9.system` checkpoint rubric (§8 above) carries that
  particular defect; the guide system's defect is the personal-experience
  persona claim instead.
- **Compresses the same §6-flagged claims** (halo-flush-always-first,
  reset-under-15-minutes, "log everything") into a conversational
  Cadence-guidance context, meaning a student asking Cadence a question
  mid-module would receive these same unreviewed claims restated back to
  them in a different voice.
- **No explicit boundary statement** comparable to Module 9's "Cadence
  must not provide tax/legal/state-specific-compliance advice as
  professional guidance" — given §6's compliance/legal claims, this may be
  a relevant gap for external audit to weigh, though the guide system does
  correctly avoid stating what any specific state requires.

### Quick prompts — `MODULE_QUICK_PROMPTS[10]`

Verbatim (`headspa-mastery.html:8064`):

1. "What is the fastest reliable reset?"
2. "How do I respond to a post-service complaint?"
3. "What do I log and why?"

No prohibited content (no old course name, no guaranteed-outcome claim, no
diagnostic language) was found in the three prompts themselves. Prompt 1
("fastest reliable reset") is worth flagging only as a framing question for
external audit — whether "fastest" is the module's intended emphasis
versus "reliable"/"repeatable," given the module's own stated standard is
consistency ("Under 15 minutes. Every time," not "as fast as possible").

### Memory-tag mapping after reorder

`MODULE_MEMORY_TAGS`/`getCheckpointMemoryTags()`'s numeric branches were
confirmed corrected as part of the Module 9 reorder implementation (see
`implementation-log.md` Step 74) — `m9cp*`-prefixed checkpoint answers now
map to moduleId `10` in `notableAnswers[].moduleId`. This extraction did
not find any residual mis-mapping; the technical wiring here is
consistent with the completed reorder.

---

## 10. Current completion and gating

- Completion requires both `m9cp1` and `m9cp2` passed — no read-percentage
  minimum, consistent with every other module's completion rule. Derived
  automatically via `_syncDerivedState()`/`MODULE_CHECKPOINTS['10']`, not
  by any module-specific logic.
- The reset-sequence walkthrough (§7) does not gate completion and does
  not need to — it writes no progress.
- The completion card's handoff already correctly names Module 11 as
  locked/unavailable (§3 above) — no correction needed regardless of
  Module 10's own eventual curriculum audit outcome.
- Not independently re-verified end-to-end in a browser as part of this
  extraction (no browser QA was performed or required for this
  documentation-only task) — the gating logic described here is derived
  from direct code reading, consistent with the already-verified,
  general-purpose `_syncDerivedState()` pipeline documented and tested
  during the Module 9 reorder (20/20 migration fixtures passing).

---

## 11. Current accessibility / foundation-consistency state

Compared against the course's current, most-recently-approved foundation
(Module 9's own corrected checkpoint pattern, and the Module 9-only AIMT
callout system rollout — see `00-global-decisions.md`, "Course foundation
consistency" and "AIMT Callout System"):

- **Checkpoint live regions** — absent. Neither `#m9cp1Res` nor `#m9cp2Res`
  carries `aria-live`; a screen-reader user receives no announcement when
  Cadence's graded response arrives.
- **Accessible button labels** — absent. Both voice buttons carry only a
  `title` attribute (not reliably exposed to assistive technology as an
  accessible name); both submit buttons have only their visible text
  ("Submit to Cadence →"), which is itself an accessible name via content,
  but is not the explicit `aria-label="Send response to Cadence"` pattern
  the corrected foundation (Module 9's own checkpoints) now uses.
- **Checkpoint response class** — `cp-response`, the pre-correction class
  name; the corrected foundation uses `cp-res`.
- **Textarea labeling** — both checkpoint `<textarea>` elements rely on
  `placeholder` text alone, with no associated `<label>`. Placeholder text
  is not a reliable accessible-name substitute (it disappears on focus/
  input and is not universally announced the same way a label is).
- **Keyboard behavior** — Enter-submits/Shift+Enter-newline is wired via
  `m9cpKey()`, matching the shared course pattern; not independently
  re-verified in-browser for this extraction.
- **Interaction semantics (reset-sequence walkthrough)** — a single native
  `<button>` (semantically fine) that trigers a purely visual/DOM-class
  state change with no announced text update — see §7's accessibility
  finding.
- **Color-only states** — the reset-sequence's `.active` step highlight is
  a background/text-color change with no accompanying text label change
  (no "current step" text badge); the six `.sanit-grid` frequency badges
  (`freq-every`/`freq-daily`/`freq-weekly`) each pair a color with visible
  text ("Every client," "Daily," "Weekly") — not a color-only-meaning
  violation, but `freq-every` reuses the course's semantic **error/red**
  token pair (`#fde8e8`/`#c0392b`, the same values documented as
  "incorrect / prohibited" in the Module 4 semantic baseline) for a
  frequency label that has no correctness or error meaning — a semantic-
  consistency question worth flagging for external audit even though it
  is not, strictly, a color-only-meaning accessibility violation.
- **Callout/warning treatment** — Module 10's two `.key-point` callouts use
  the bare pre-"AIMT Callout System" markup (`.kp-icon` + `.kp-text`, `→`
  icon, no eyebrow, no `.kp-body`) — expected, since that rollout (Step 76)
  was explicitly scoped to Module 9 only and Modules 0–8/10 are normalized
  later, during the course-wide styling pass, not individually now. Not a
  defect specific to Module 10; recorded for completeness.
- **Mobile behavior** — not independently re-verified in-browser for this
  extraction (documentation-only task, no browser QA performed or
  required). The `.sanit-grid` CSS does include an explicit `max-width:600px`
  single-column fallback (`headspa-mastery.html:1819`), suggesting mobile
  layout was considered during the pre-audit build, but this was not
  re-confirmed live.

---

## 12. Downloadable resource opportunity

Per `00-global-decisions.md`'s downloadable-resource principle and the
task's explicit instruction not to approve one yet — recorded for external
audit's decision, not decided here.

**Whether a downloadable opportunity exists:** plausible. Two candidates
are directly supported by existing source material:

1. **Between-Client Reset Checklist** — the nine-step reset sequence
   (§3/§7) is already structured as a checklist-shaped sequence with named
   steps and estimated times; a printable version would let a practitioner
   glance at the sequence bedside rather than reopening the lesson, which
   is exactly the governing policy's bar (station support, a quick
   reference avoiding reopening the full lesson).
2. **Sanitation & Reset Quick Reference** — the 10.1 six-card
   sanitize-and-when grid plus the 10.3 sanitation-log field list are
   already itemized, reference-shaped content (frequency + item + what to
   log) that a practitioner would plausibly want as a wall-mounted or
   binder reference, similar in kind to Module 8's approved Printable Head
   Spa Service Maps precedent.

**What existing source material supports it:** both candidates above are
drawn directly from already-written, already-approved-for-source-status
content — no new content would need to be invented, only reformatted,
matching the same "already exists, just needs packaging" profile that
justified Module 9's own Enhancement Guide recommendation.

**Why it may be useful:** a practitioner mid-shift, between clients, is a
plausible real use case for a fast physical or printable reference — this
is the same "service-room support" category the governing policy names as
a strong justification.

**Not decided here:** whether one, both, or neither candidate should
actually be recommended; title; exact field list; format; lesson
placement; future dashboard location. All deferred to external audit, per
the task's explicit instruction.

---

## 13. Guided Completion Path — extraction fields

Required per `00-global-decisions.md`'s "Guided Completion Path" section.
First-pass estimate only — not a final specification.

- **Estimated attentive learning time:** the module's non-interactive
  reading content is short relative to every other module in the course
  (153 total lines of markup, no video, six short cards, one nine-step
  list) — roughly 8–12 minutes of reading, well below Module 9's own
  25–35 minute estimate.
- **Estimated checkpoint time:** 10–15 minutes for both free-text
  checkpoints combined, comparable to other modules' two-checkpoint
  estimates.
- **Competency demonstrated (as currently built):** the student can
  narrate a repeatable reset sequence and describe a professional
  response to a post-service client complaint — not independently
  verified against any approved competency statement, since none exists
  yet for this module.
- **Suggested practice or application task:** not specified by the current
  source content; a plausible candidate (running the actual reset sequence
  against a real or simulated station) is not something this extraction
  should propose as final — deferred to external audit.
- **Earlier concepts to revisit:** not stated anywhere in the current
  source content — no explicit cross-reference to any earlier module
  exists in Module 10's rendered copy (contrast with several other modules
  that explicitly name earlier concepts).
- **Suggested course-path position:** tenth, immediately after Module 9
  (Checkout, Client Closing & Pricing Strategy) and before the
  not-yet-built Module 11 (AI / Modern Practice Tools) — consistent with
  the locked future module order.

---

## 14. Listen Mode — extraction fields

Required per `00-global-decisions.md`'s "Listen Mode" section. First-pass
assessment only.

- **Narration-suitable:** the cleaning-vs-resetting framing (opening
  frame), the compliance section (10.3), and the "pressure test your
  system" framing are straightforward prose, narration-suitable as-is.
- **Sections needing visual-review cues:** the 10.1 six-card grid (an
  at-a-glance frequency table) and the 10.2 nine-step sequence both
  benefit from visual/tabular presentation; a narrated version would need
  to either read the full table/sequence aloud (long) or provide a
  visual-review cue directing the student back to the screen.
- **Screen-required content:** the reset-sequence walkthrough (§7) is
  inherently visual (a highlight animation); both checkpoints require
  typed or spoken free-text response either way, matching every other
  module's Listen Mode boundary.
- **Video-only content:** none — no video component exists anywhere in
  this module's current source.
- **Approximate narration length:** given the module's short overall
  content (§13), likely in the 6–9 minute range for the prose portions
  alone, before accounting for how the two tabular/sequential sections are
  handled — not a final estimate.

---

## 15. Video considerations — preliminary only

Per the task's explicit instruction, this is **not** a video-source file
(module-10-video-source.md is explicitly deferred until Module 10 itself
clears manual QA) — recorded only as preliminary observations for whoever
eventually authors that file.

- **Strongest opening-video concept candidate:** the module's own
  installed hero framing — clients never watch the reset happen, but they
  feel its absence (clutter, damp linens, disorganization) or its presence
  (a room that reads as if the next client is about to walk in). This is
  already strong, camera-ready framing drawn directly from approved-status
  source copy, not invented here.
- **What should remain written/interactive:** the nine-step reset sequence
  in full detail (a video should not attempt to teach all nine steps in
  order — that duplicates the lesson's own checklist function), the
  specific EPA/Barbicide/contact-time product claims (subject to §6's
  flagged safety/regulatory verification before being spoken on camera),
  and both checkpoints' content.
- **Safety/regulatory material that should NOT be casually spoken before
  external verification:** every item flagged in §6 above — specifically
  the "under 15 minutes" universal target, "halo flush always first," "logs
  protect you legally," and any implied EPA-registration scope — none of
  these should be treated as confirmed, camera-ready script content until
  external audit has reviewed them.

---

## 16. Audit risk inventory

Prioritized per the task's required order. No correction, rewrite, or
final judgment is made here — this is a labeled list for external audit to
weigh, not a set of conclusions.

1. **Safety accuracy** (highest priority) — the "under 15 minutes"
   universal target, "halo flush always first," unqualified EPA-
   registration references, and the missing blood/body-fluid contaminated-
   item procedure (§6) are the highest-stakes items, since this module's
   subject matter is client and practitioner safety rather than business
   judgment.
2. **Sanitation terminology** — "clean," "sanitize," and "disinfect" are
   used loosely and interchangeably; no explicit sanitation-vs-
   disinfection-vs-sterilization definition exists (§6).
3. **Legal/regulatory universality** — "sanitation logs protect you
   legally" is stated as unqualified fact; the one genuine jurisdiction
   caveat that does exist ("state regulations vary... check annually") is
   not visibly connected to the module's other, more absolute-sounding
   claims (§6).
4. **Sequence clarity** — the nine-step sequence itself is clearly
   ordered and internally consistent; the main clarity risk is the
   reset-sequence *interaction* (§7) misrepresenting itself as timed
   practice when it is a fixed-cadence animation, which could mislead a
   student about how long a real reset actually takes.
5. **Reset practicality** — the "under 15 minutes" target's real-world
   achievability was not independently assessed in this extraction; flagged
   under safety/regulatory accuracy above as the same underlying claim.
6. **Insider/practitioner value** — the "cleaning vs. resetting" distinction
   and the weak-system/strong-system pressure-test framing are the
   module's strongest existing practitioner-judgment content and are
   reasonable candidates to preserve; final judgment deferred to external
   audit's own insider-value assessment.
7. **Interaction usefulness** — the reset-sequence walkthrough (§7) is the
   clearest actionable finding in this extraction: as currently built, it
   functions as a decorative, non-learning, non-graded animation rather
   than a genuine interaction meeting the course's approved interaction
   standard, and is worth deliberate external-audit judgment on whether to
   redesign, replace, or reclassify it.
8. **Checkpoint quality** — both checkpoints have a displayed/evaluated
   question mismatch (§8), a shared (not per-checkpoint) rubric still
   carrying the old course name, and no module-specific error text —
   the same defect class already corrected for every other module in the
   course.
9. **Cadence accuracy** — both the guide system and the checkpoint rubric
   carry pre-audit identity defects (old course name in the rubric, "nearly
   two decades" personal-experience persona in the guide system), and both
   restate several of the §6-flagged safety/regulatory claims as if
   settled.
10. **Course-foundation consistency** — checkpoint accessibility markup
    (`cp-response` class, no `aria-live`, no `aria-label`) lags every other
    approved module's corrected pattern; the callout markup lags the
    Module-9-only AIMT Callout System rollout (expected, not a Module-10-
    specific defect); the `freq-every` badge's reuse of the error/red
    semantic token for a non-error meaning is a minor semantic-consistency
    question.

---

## 17. Observed current-state conditions

- No production file was modified to produce this extraction. `git status
  --short` remains clean apart from this new file and the other
  documentation files this task updated.
- No live-model grading, screen-reader, physical-keyboard, or real
  touch-device testing was performed — this extraction is source-reading
  and direct code inspection only, consistent with the task's own
  instruction not to perform browser QA for a documentation-only
  changeset.
- No external research (regulatory citations, manufacturer product
  verification, EPA registration lookup) was performed, per the task's
  explicit instruction that external verification happens at the audit
  stage, not the extraction stage.
- This file does not itself unlock or authorize any implementation work.
  Per the master instructions' module lifecycle, the next required step
  for Module 10 is external audit (step 3), followed by an approved
  specification (`module-10.md`, step 4) — neither has begun.
