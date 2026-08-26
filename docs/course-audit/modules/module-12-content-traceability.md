# Module 12 — Content Traceability Report

**Status:** Internal implementation/QA document. Not student-facing.
**Purpose:** For every scored item in the installed final-assessment bank,
record the approved Module 1–11 source that supports it, per the
institutional rule in `00-aimt-certification-assessment-standard.md`
Section 5 and the master instructions: *"No scored AIMT exam item ships
unless every fact, distinction, decision rule, and expected answer can be
traced to approved course content the student actually received."*

**Method.** All 120 Knowledge items were verified by independently reading
each cited Module 1–11 approved specification (`docs/course-audit/modules/
module-0N.md`) in full and checking the item's premise, marked-correct
answer, and rationale against it — not against the raw pre-rewrite blueprint
and not from memory. All 12 Applied Cases and 9 Practitioner Conversations
were verified against the same specifications, using the frameworks and
exact wording already confirmed during the Knowledge Bank pass (many cases/
interviews test the identical taught framework as a Knowledge item — e.g.
CASE-04/INT-03 and M10-002 all test Module 10's "Reset Under Pressure"
teaching), plus direct, independent re-reading of the primary source text for
the six items the installation task specifically flagged for manual
spot-check (CASE-09, CASE-10, INT-01, INT-02, INT-03, INT-08).

This document does **not** reproduce student-facing question/case/interview
wording — see the LOCKED markdown authority files for that:
`module-12-final-knowledge-bank.md`, `module-12-final-applied-cases.md`,
`module-12-final-interview-bank.md`.

---

## Parsing rules recorded for audit (generator: `scripts/build-module12-assessment-bank.mjs`)

These are documented, deterministic decisions made while converting locked
markdown into structured content — none of them touch student-facing
wording; they only affect internal metadata/data-shape.

1. **Critical-domain evidence recognition.** Only the formal marker
   `Critical-Domain Evidence: Dx[, Dy...]` is parsed into an item's
   `criticalDomainEvidence` array. Informal notes elsewhere in the locked
   banks ("D3 secondary", "D1-adjacent", "Standard with D2/D3 support") are
   deliberately **not** counted as formal evidence — a conservative rule
   that never invents evidence the bank author did not explicitly mark with
   the formal phrase. (Applies to Knowledge, Case, and Interview items.)
2. **Compound difficulty labels.** Two Knowledge items use a compound label
   not in the three-value difficulty enum: `Applied / Synthesis` resolves to
   `advanced-synthesis`; `Foundational / Applied` resolves to `applied`.
   Rule: a compound boundary label resolves to the single heavier-weighted
   tier mentioned (Foundational < Applied < Advanced/Synthesis).
3. **Sourced quotation, not paraphrase.** `sourceSection` for each Knowledge
   item is the bank's own `**Source:**` line, used verbatim (not a fabricated
   numbered section citation) — this avoids inventing citation precision the
   locked bank itself did not assert.
4. **Case/interview part-type detection.** Each Applied Case's `## Part X`
   sections are classified into `single-best-answer` / `multi-select` /
   `sequencing` / `classification` / `structured-short-response` by
   structural signature (presence of `**Correct selections:**`, `**Correct
   order:**`, `**Correct classifications:**`, etc.), not by hand-transcribing
   each case. `classification` is a new `CasePart` type this installation
   added to `content-schema.mjs`/`scoring.mjs` (CASE-08 Part A needed it —
   the prior engine only supported the other four types).
5. **Critical-flag encoding.** See "Critical-flag encoding" section below.

---

## Traceability status legend

- **VERIFIED** — premise, correct answer, and rationale all confirmed against
  the cited approved Module 1–11 specification.
- **BLOCKED** — a specific, named element is not supported by the approved
  specification. The item ships with `status: 'draft'` in `content-bank.mjs`
  (excluded from any real student selection by `isApprovedForProduction()`)
  rather than being silently rewritten or dropped.

---

## Part I — Knowledge Bank (120 items)

### Module 1 — Role of the Head Spa Technician (8 items, all VERIFIED)

| ID | Source teaching point | Competency | Difficulty | Domain evidence | Status |
|---|---|---|---|---|---|
| M01-001 | §F "Scope is determined by the license/authorization, jurisdiction, establishment, exact service, equipment" + outcome 7 | Role vs. license; conditional scope | Foundational | — | VERIFIED |
| M01-002 | §D "a visible pattern is not a medical diagnosis" (outcome 3), extended to a new but consistent fact pattern (prior diagnosis) | Observation vs. diagnosis | Applied | D1 | VERIFIED (reasoned extension of an explicitly taught principle, not an untaught fact) |
| M01-003 | Required Correction #7 / §E referral triggers (new/severe/persistent/painful/spreading) | Referral threshold | Applied | D1, D2 | VERIFIED |
| M01-004 | §G "can support" list + Required Corrections #4/#5 (no circulation/prevention/regrowth claims) | Realistic benefit framing | Applied | — | VERIFIED |
| M01-005 | `m1cp2` documented competency + §C clinical note (observe/communicate/adjust/decide) | Practitioner judgment beyond technique | Applied | — | VERIFIED |
| M01-006 | §F "permitted for one license/state may be prohibited for another" + outcome 7 | Scope reassessment across jurisdictions | Advanced/Synthesis | D1 | VERIFIED |
| M01-007 | §D shedding/thinning script + §E referral copy | Referral communication | Applied | D1 | VERIFIED |
| M01-008 | §F Card 1 "non-prescription cosmetic product guidance" vs. Card 2 "prescribing" | Cosmetic guidance vs. prescribing | Applied | D1 | VERIFIED |

### Module 2 — Welcoming Your Client (9 items — 8 VERIFIED, 1 BLOCKED)

| ID | Source teaching point | Competency | Difficulty | Domain evidence | Status |
|---|---|---|---|---|---|
| M02-001 | §7/2.7 "Standards remain consistent... Rituals may adapt: tea, fragrance, changing, first-touch method, pacing" | Standards vs. rituals | Foundational | — | VERIFIED |
| M02-002 | §K "Prior visits, a signed intake form, closed eyes, or silence do not replace permission for a new touch" | Explicit consent before touch | Applied | D3 | VERIFIED |
| M02-003 | §E tea must not be presented as treatment; §5 no health/treatment claims | Hospitality without physiological claims | Applied | — | VERIFIED |
| M02-004 | §4/§D "ask the client to remove only what is necessary... offer an alternative" | Privacy/autonomy | Applied | D3 | VERIFIED |
| **M02-005** | **BLOCKED** — see reason below | Arrival leadership under schedule pressure | Applied | — | **BLOCKED** |
| M02-006 | §K "Prior visits... do not replace permission for a new touch or service choice" | Distinguishing ritual from standard | Advanced/Synthesis | D3 | VERIFIED |
| M02-007 | §C intake review: "should never... override what the client tells you in person" | Verbal intake confirmation | Applied | D3 | VERIFIED |
| M02-008 | Approved judgment-check feedback: "a fragrance-free service is a valid client choice" | Client choice/autonomy | Applied | D3 | VERIFIED |
| M02-009 | §2.5 example script: "let me know at any point if you want pressure/temperature/position/scent/anything adjusted" | Concise orientation | Applied | — | VERIFIED |

**M02-005 — BLOCKED, exact reason.** The locked item's scenario (client 8
minutes late, concern framed around the *next* booking, correct answer
requiring the practitioner to "communicate any genuinely necessary timing
adjustment") is not supported by `module-02.md`. The only late-arrival
scenario documented is checkpoint `m2cp1`, which specifies a **2-minute**
delay with no mention of a subsequent appointment. `module-02.md` teaches
"schedule pressure belongs to the business, not the client" (§K) and that
schedule pressure should be *absorbed*, not communicated to the client
(outcome #8) — the marked-correct answer's core instruction (communicate a
timing adjustment to the client) is not a taught behavior and arguably runs
against the module's actual teaching. The item's own `**Source:**` citation
to checkpoint `m2cp1` is also factually inaccurate (wrong delay length).

### Module 3 — Hair & Scalp Anatomy (12 items, all VERIFIED)

| ID | Source teaching point | Competency | Difficulty | Domain evidence | Status |
|---|---|---|---|---|---|
| M03-001 | Required correction #3: five-layer order Skin→Dense connective→Galea aponeurotica→Loose areolar→Pericranium | Scalp layers (SCALP) | Foundational | — | VERIFIED |
| M03-002 | §D "The strand is the output. The follicle is the living system" | Hair shaft vs. follicle | Applied | — | VERIFIED |
| M03-003 | §F/§G + `cp1`: major physiological events precede visible diffuse shedding by weeks–months | Shedding timeline reasoning | Applied | D1 | VERIFIED |
| M03-004 | §J "stratum corneum is the scalp's principal protective barrier... can look oily and still be irritated" | Barrier vs. surface oil | Applied | — | VERIFIED |
| M03-005 | §I "Pattern requiring medical evaluation": asymmetric/smooth-shiny/pain/burning | Concerning hair-loss presentation | Applied | D1, D2 | VERIFIED |
| M03-006 | `cp2` exact scenario (tightness/flaking after daily strong clarifying) + required elements | Barrier-aware service adaptation | Applied | — | VERIFIED |
| M03-007 | §13/`cp1`: hedged, non-diagnostic timing language; referral for persistent/concerning shedding | Shedding timing + scope | Advanced/Synthesis | D1 | VERIFIED |
| M03-008 | §D pilosebaceous unit = follicle + sebaceous gland + arrector pili | Pilosebaceous anatomy | Foundational | — | VERIFIED |
| M03-009 | §E item 2 / Required Correction #8: "visible material does not prove... cause" | Anatomy does not prove cause | Applied | — | VERIFIED |
| M03-010 | §F anagen=growth, catagen=transition, telogen=rest, exogen=release | Hair-cycle phases | Foundational | — | VERIFIED |
| M03-011 | §I surgery as a recognized delayed-shedding trigger + Required Correction #13 | Timeline reasoning with competing history | Advanced/Synthesis | D1 | VERIFIED |
| M03-012 | §K massage framed via comfort/rhythm/pace, not medicalized; no nutrient-delivery/regrowth claim | Honest massage claims | Applied | D1 | VERIFIED |

### Module 4 — Microscopy & Scalp Assessment (14 items, all VERIFIED)

| ID | Source teaching point | Competency | Difficulty | Domain evidence | Status |
|---|---|---|---|---|---|
| M04-001 | §4.1 "The image can sharpen the question. It cannot answer every question." | Scalp-camera purpose | Foundational | — | VERIFIED |
| M04-002 | §E/Correction 12: Front→Top→Crown→Side→Back | Five-point scan sequence | Foundational | — | VERIFIED |
| M04-003 | `m4cp2` verbatim scenario (fluid/crusting, client insists) + required-pass elements | Stop/refer + device reprocessing | Applied | D1, D2, D4 | VERIFIED |
| M04-004 | §4.3 #4 + Practitioner Insight #1: pressure can blanch/redden and create false findings | Pressure artifact awareness | Applied | — | VERIFIED |
| M04-005 | Approved documentation examples ("diffuse surface shine... adherent yellow-white material") | Observation vs. conclusion | Applied | — | VERIFIED |
| M04-006 | §C "permission to view is not permission to save... to teach from... or use in marketing" + Correction 11 | Permission has layers | Applied | D3 (informal note only; not formally tagged in bank) | VERIFIED |
| M04-007 | Device-contamination note (verbatim): remove from service, manufacturer cleaning/disinfection before reuse | Device contamination | Applied | D4 | VERIFIED |
| M04-008 | "One image is not the scalp" / "One image is a detail. The scan is the pattern." | One image cannot become the client | Applied | — | VERIFIED |
| M04-009 | Correction 9: a before/after comparison requires matching region/light/pressure/orientation | Honest comparison | Applied | — | VERIFIED |
| M04-010 | §F five lenses: surface, follicular openings, perifollicular area, hair shafts, distribution | Five observation lenses | Foundational | — | VERIFIED |
| M04-011 | Sample note covers 3 of 5 lenses; spec singles out distribution for explicit emphasis | What is missing from the observation | Applied | — | VERIFIED |
| M04-012 | Correction 9/§4.3: product/lighting/pressure/magnification differences change the image | Standardize before comparing | Applied | — | VERIFIED |
| M04-013 | Correction 12: "add targeted images based on client concern," never replacing the baseline five | When targeted views earn their place | Applied | — | VERIFIED |
| M04-014 | §G supported-observation/working-question/unsupported-conclusion framework, applied to a new fact pattern | Observation, question, conclusion | Advanced/Synthesis | — | VERIFIED |

### Module 5 — Scalp Patterns & Service Adaptation (11 items, all VERIFIED)

| ID | Source teaching point | Competency | Difficulty | Domain evidence | Status |
|---|---|---|---|---|---|
| M05-001 | Required Correction #1: patterns "are not diagnoses and are not permanent client identities" + §5.4 pattern D | Pattern is not identity | Foundational | — | VERIFIED |
| M05-002 | §5.3 decision order: safety limit, comfort/reactivity outrank cosmetic need, preference | What gets priority | Applied | — | VERIFIED |
| M05-003 | `m5cp2` immediate-correction trigger: flags performing a requested aggressive service "because the client signed consent" as an error | Consent does not make intensity appropriate | Applied | — | VERIFIED |
| M05-004 | Lever 2 (Exfoliation): "Visible scale is not automatic permission to exfoliate" | Scale ≠ automatic exfoliation | Applied | — | VERIFIED |
| M05-005 | `m5cp1` exact checkpoint scenario + approved answer set | Region by region | Applied | — | VERIFIED |
| M05-006 | "What changes first?" Scenario 4 (broken/moist/draining) + §5.3 safety-limit list | Modify vs. stop | Applied | — | VERIFIED |
| M05-007 | §5.2 "Product comes after the decision" | Product follows the decision | Applied | — | VERIFIED |
| M05-008 | Synthesis of §5.3 priority order + §5.5 regional protocol builder | The whole decision chain | Advanced/Synthesis | — | VERIFIED |
| M05-009 | §5.2 / Required Correction #11: exactly five levers (cleansing, exfoliation, water/steam, pressure/tempo, product placement/finish) | Five service levers | Foundational | — | VERIFIED |
| M05-010 | §5.2 intro: customization is "a deliberate change in intensity, placement, duration, or omission" | Change the lever that needs changing | Applied | — | VERIFIED |
| M05-011 | §5.5 "Preserve" protocol-builder entry (verbatim in spirit) | Preserve is an active decision | Applied | — | VERIFIED |

### Module 6 — Conditions & Disorders (11 items, all VERIFIED)

| ID | Source teaching point | Competency | Difficulty | Domain evidence | Status |
|---|---|---|---|---|---|
| M06-001 | §6.1/6.3 dry-scalp bullet list (fine white powdery flakes, matte, minimal oil) | One flake does not make a pattern | Foundational | — | VERIFIED |
| M06-002 | §6.2 + §6.3 correction #4: "don't force a label... favor the gentler service direction" | When the image is mixed | Applied | — | VERIFIED |
| M06-003 | Source 5 / correction #7: 1% OTC vs. 2% Rx-only ketoconazole | OTC literacy vs. prescribing | Foundational/Applied | — | VERIFIED |
| M06-004 | `m6cp1` pass criteria + "Follow the cycle" approved answer | Reassess before escalating | Applied | — | VERIFIED |
| M06-005 | §6.6 referral triggers (spread + active irritation; severe/painful/rapid) | When modification becomes referral | Applied | — | VERIFIED |
| M06-006 | "Malassezia — audit decision": severity, not category, changes the response | What "spectrum" should change | Applied | — | VERIFIED |
| M06-007 | §6.7 closing scope note (correction #7), verbatim in substance | Retail guidance still has a boundary | Applied | — | VERIFIED |
| M06-008 | Module 4 observation discipline + §6.6 referral criteria combined | Observation → interpretation → referral | Applied | — | VERIFIED |
| M06-009 | "Practitioner insider value": combination of features, weighed against history — not one feature alone | Oil is not a diagnosis | Applied | — | VERIFIED |
| M06-010 | §6.2: presentations resembling psoriasis/tinea capitis/dermatitis; cosmetic assessment cannot rule these out | Similar appearance, different possibilities | Applied | — | VERIFIED |
| M06-011 | Correction #8 (stress vs. diet evidence strength) + correction #9 (heat/humidity association, not rule) | Evidence strength is not causation | Advanced/Synthesis | — | VERIFIED |

### Module 7 — Equipment & Room Setup (10 items — 9 VERIFIED, 1 BLOCKED)

| ID | Source teaching point | Competency | Difficulty | Domain evidence | Status |
|---|---|---|---|---|---|
| M07-001 | Treatment-bed teaching standard: cleaning/sanitation compatibility required; armrest configuration labeled preference | Requirement or preference | Foundational | — | VERIFIED |
| M07-002 | Cart-setup standard: zones defined by frequency of use, following actual service-use order | Design around frequency | Applied | — | VERIFIED |
| M07-003 | §7.3: ten-step order is "sanitation-and-structure first, then staging, comfort, ambiance"; `m7cp1` criterion 1 | Build order | Applied | — | VERIFIED |
| M07-004 | §7.4 callout (verbatim): stop → adjust → communicate → resume once client confirms comfort; `m7cp2` exact scenario | Stop before you adjust | Applied | — | VERIFIED |
| M07-005 | §7.4 "Watch for" callout: dizziness/visual changes/slurred speech = medical concern, not positioning fix | Discomfort or medical concern | Applied | D2 | VERIFIED |
| **M07-006** | **BLOCKED** — see reason below | Clean zone integrity | Applied | D4 | **BLOCKED** |
| M07-007 | §7.4 safety-callout distinction (ordinary strain vs. dizziness/visual changes) | What kind of stop is this | Applied | — | VERIFIED |
| M07-008 | §7.4: three positioning checks named verbatim (halo alignment, shoulder position, occipital support) | Three positioning checks | Foundational | — | VERIFIED |
| M07-009 | §7.1 occipital-support/headrest-curve teaching + "chin is visibly lifting" sign | Identify the failed check | Applied | — | VERIFIED |
| M07-010 | §7.2 tool philosophy: "more tools does not equal a better service... essentials-first" | Startup priorities | Applied | — | VERIFIED |

**M07-006 — BLOCKED, exact reason.** `module-07.md` documents only a general
"never mix clean/dirty bins" instruction (Tools/supplies standard;
sanitation separation). It does not teach the specific decision rule this
item tests — that an item of *uncertain* cross-contact status must be
treated as compromised and reprocessed before use, as opposed to an item
that is *known* to be dirty. That ambiguity-resolution rule does not appear
in `module-07.md` as a named rule or worked scenario.

### Module 8 — The Head Spa Service (14 items — 13 VERIFIED, 1 BLOCKED)

| ID | Source teaching point | Competency | Difficulty | Domain evidence | Status |
|---|---|---|---|---|---|
| M08-001 | §8.1 "Designed around the service, not the clock" — each format is its own deliberate structure | Core/Extended structure | Foundational | — | VERIFIED |
| M08-002 | §8.3 temperature card (preserved): "You do not guess temperature. You confirm it. Every time." | Temperature is never assumed | Foundational | D2 | VERIFIED |
| M08-003 | "Exfoliation Framework": adapt by intensity/method/product/pressure/technique, never binary | Exfoliation is a dial | Applied | — | VERIFIED |
| M08-004 | `m8cp2` scenario/pass criteria (structured, scalp-focused, pacing, assessment-informed) | What makes the service different | Applied | — | VERIFIED |
| M08-005 | Steps 07/12 scope guardrail (verbatim): scope/training/consent; course does not expand licensure | Bodywork authority | Applied | D3 | VERIFIED |
| M08-006 | "Micro-teaching" section: speak for consent/comfort/unfamiliar step/meaningful change | Quiet is not the same as silent | Applied | — | VERIFIED |
| M08-007 | §8.3 corrected pressure card: "Consistency... is what a client actually feels as skill" | The pressure problem | Applied | — | VERIFIED |
| M08-008 | "Protect the Flow" Scenario 3: adjust pacing elsewhere without scrambling | When the schedule drifts | Applied/Synthesis | — | VERIFIED |
| M08-009 | Steps 13–15 correction: cooling-spray "temperature contrast," not a circulation/mechanism claim | Describe the sensation, not a mechanism | Applied | — | VERIFIED |
| M08-010 | Retained closing-script pattern ("Today I focused on..."), non-diagnostic, observation-based | The professional close | Applied | — | VERIFIED |
| M08-011 | Approved chapter order (dry opening → wet/treatment → conditioning → final rinse/close) | Broad sequence matters | Applied | — | VERIFIED |
| **M08-012** | **BLOCKED** — see reason below | Equal-weight scent choice | Applied | D3 | **BLOCKED** |
| M08-013 | Governing service-communication model: "The client can always request a change or stop; that is not... re-litigating the protocol" | Consent/preferences remain active | Applied | — | VERIFIED |
| M08-014 | Step 11 correction ("follow product/equipment directions for processing time") + Scenario 3 | Required processing time vs. pacing | Applied | D4 | VERIFIED |

**M08-012 — BLOCKED, exact reason.** The scenario and marked-correct answer
test a live, in-service, equal-weight three-scent-or-skip-entirely
presentation. That script was **superseded** by the August 24, 2026
"relaxation-first communication rebuild" amendment in `module-08.md`, which
moved fragrance-free determination to **intake** ("a predetermined
fragrance-free path is followed instead when intake has already established
one") and changed the live spoken cue to a non-optionalized transition
statement. The item tests the pre-August-24 version of Module 8, which is no
longer the approved, current content.

*(M08-013's finding — "the client can always request a change... that is not
re-litigating the protocol" — was itself used to confirm CASE-09 and
INT-02's "consent can change" premise does not conflict with this same
August 24 doctrine: that doctrine targets the *practitioner* re-offering
optional steps, not a client's own spontaneous request. See CASE-09/INT-02
below.)*

### Module 9 — Checkout, Client Closing & Pricing Strategy (10 items, all VERIFIED)

| ID | Source teaching point | Competency | Difficulty | Domain evidence | Status |
|---|---|---|---|---|---|
| M09-001 | §9.3 exact formula: price = cost / (1 − margin) | Margin is not markup | Foundational | — | VERIFIED |
| M09-002 | §9.2 point 3: practitioner time includes setup/consult/treatment/transitions/cleanup/checkout/documentation | What counts as practitioner time | Applied | — | VERIFIED |
| M09-003 | §9.5: price sits at intersection of cost + service design + capacity + market context + positioning | Competitors are context, not the calculator | Applied | — | VERIFIED |
| M09-004 | §9.8: "in the moment" vs. "afterward" review using actual data | A price comment is not a pricing analysis | Applied | — | VERIFIED |
| M09-005 | §9.7: an enhancement needs distinct purpose/real difference/time+cost effect/clear positioning | Does the enhancement earn its place | Applied | — | VERIFIED |
| M09-006 | §9.7 cross-reference: "restraint wins over the sale" when presentation calls for it | The sale does not erase the service decision | Applied | — | VERIFIED |
| M09-007 | Pricing-calculator correction #4: margin=0 → price=cost (true break-even) | True break-even | Applied | — | VERIFIED |
| M09-008 | §9.2: all four cost inputs required; omitting setup/reset/overhead understates true cost | Missing costs create false confidence | Applied | — | VERIFIED |
| M09-009 | §9.6: rejects fixed tier count, requires "meaningful," non-time-based differentiation | Differentiation has to be real | Applied | — | VERIFIED |
| M09-010 | §9.1 checkout mechanics: clear total, neutral gratuity presentation, no universal percentage | Neutral checkout mechanics | Applied | — | VERIFIED |

### Module 10 — Sanitation & Reset Systems (12 items, all VERIFIED)

| ID | Source teaching point | Competency | Difficulty | Domain evidence | Status |
|---|---|---|---|---|---|
| M10-001 | §10.1: cleaning (soil/residue/debris removal) often necessary before disinfection | Cleaning ≠ disinfectant-sprayed | Foundational/Applied | — | VERIFIED |
| M10-002 | Reset Under Pressure spec (verbatim): preserve contact time; other tasks; alternative; delay start | Three minutes are still three minutes | Applied | D4 | VERIFIED |
| M10-003 | §10.2 ITEM→PROCESS categories (reusable/linens/single-use) | Match the item to the process | Applied | — | VERIFIED |
| M10-004 | Instructor-tip boundaries (verbatim): equipment-specific, label + manufacturer instructions, not a replacement for required disinfection | A maintenance tip is not a sanitation rule | Applied | — | VERIFIED |
| M10-005 | §10.4 "Logs / records" approved framing: consistency/traceability/review tool, not legal protection | Records can help without proving anything | Applied | — | VERIFIED |
| M10-006 | §10.5 post-service teaching: acknowledge, document, avoid diagnosing/assigning causation | A reaction report is not a diagnosis investigation | Applied | — | VERIFIED |
| M10-007 | §10.5 blood/OPIM procedure (stop normal reset, PPE, contain, process, document) | Routine reset ends when the incident is not routine | Applied | D4 | VERIFIED |
| M10-008 | "Compliance review" section: recheck on regulation/equipment/product/procedure change, not merely annually | A yearly review cannot protect a changed system | Applied | — | VERIFIED |
| M10-009 | Verify phase + "The process determines the clock" thesis | Reset can look complete while processing is not | Applied | D4 | VERIFIED |
| M10-010 | §10.1 sterilization bullet: disinfected ≠ sterile | Disinfected is not sterile | Foundational | — | VERIFIED |
| M10-011 | §10.2 "Product bowls/applicators" bullet: avoid cross-contaminating clean product | Product handling | Applied | D4 | VERIFIED |
| M10-012 | Licensure/jurisdiction boundary section: label vs. manufacturer vs. state/local authority | Know which authority answers which question | Applied | — | VERIFIED |

### Module 11 — AI / Modern Practice Tools (9 items, all VERIFIED)

| ID | Source teaching point | Competency | Difficulty | Domain evidence | Status |
|---|---|---|---|---|---|
| M11-001 | §11.1 four tool categories + Approved Outcome #2 | Different tools, different jobs | Foundational | — | VERIFIED |
| M11-002 | §11.2 B.R.I.E.F. key (Background/Request/Instructions/Expected Output/Fact-check), verbatim | Give it enough to do the job | Applied | — | VERIFIED |
| M11-003 | §11.3 Authority Matrix (Level 1/2/3 examples) | Authority depends on the task | Applied | — | VERIFIED |
| M11-004 | §11.4 installed worked example ("Seborrheic dermatitis — 87%") | 87% is not the end of the reasoning | Applied | — | VERIFIED |
| M11-005 | §11.5 Hear→Observe→Boundary→Next Step framework | The client already has an answer | Applied | D1 | VERIFIED — internal citation corrected (see note below) |
| M11-006 | §11.6 Need/Minimize/Verify framework, Need stated first | Need comes first | Applied | D3 (informal note only) | VERIFIED |
| M11-007 | §11.7 Research card: "open the source, read it, check the date, confirm it supports the claim" | A citation is not verification | Applied | — | VERIFIED |
| M11-008 | Same §11.3 Authority Matrix as M11-003, applied to a second scenario set | Different output, different authority | Applied | — | VERIFIED |
| M11-009 | §11.8 "AI may draft. The practitioner owns the message." | Good output still belongs to you | Applied | — | VERIFIED |

**M11-005 — internal metadata correction (not a block).** The locked bank
cites this item to "Module 11 checkpoint `m11cp1`," but `m11cp1`'s
documented scenario is a separate ChatGPT/dandruff example — a different
scenario than this item tests. The competency itself (Hear→Observe→
Boundary→Next Step) **is** genuinely taught in `module-11.md` §11.5, so the
item is not blocked. Only the internal `sourceSection` metadata was
corrected to point at §11.5 instead of the checkpoint — no student-facing
wording changed. See `SOURCE_SECTION_OVERRIDES` in the generator script.

---

## Part II — Applied Practitioner Case Bank (12 cases, all VERIFIED)

| ID | Source modules | Approved teaching point matched | Competencies | Domain evidence | Status |
|---|---|---|---|---|---|
| CASE-01 | 2, 4, 5 | §2.7 consent/ritual standard + `m5cp1`'s exact regional-adaptation scenario shape | Arrival leadership; intake confirmation; regional observation; service adaptation | D3 (secondary, informal) | VERIFIED |
| CASE-02 | 1, 4 | `m4cp2` exact scenario (fluid/crusting, client insists) + device-contamination note (verbatim) | Stop/refer; client communication; device hygiene | D1, D2, D4 | VERIFIED |
| CASE-03 | 5, 6 | §6.1 dry-scalp bullet list (misidentified as dandruff) + Lever 2 exfoliation rule | Wrong-product cycle; reassessment; service redirection | D2 | VERIFIED |
| CASE-04 | 7, 10 | Reset Under Pressure spec matched near-verbatim (preserve contact time / other tasks / alternative / delay) | Required process time; parallel workflow; readiness under pressure | D4 | VERIFIED |
| CASE-05 | 7, 8 | §7.4 stop→adjust→communicate→resume order (exact match); Exfoliation Framework | Comfort response; positioning; exfoliation adaptation | D2 | VERIFIED |
| CASE-06 | 5, 8, 9 | §9.7 "restraint wins over the sale... reassess, don't pre-commit" (near-verbatim) | Carrying service judgment into recommendation; pressure-free close | D2 (secondary, informal) | VERIFIED |
| CASE-07 | 1, 4, 11 | §11.5 Hear→Observe→Boundary→Next Step (the case's own rubric uses these exact framework names) + Module 1/4 observation-vs-diagnosis | Client-supplied AI; observation vs. diagnosis; next-step reasoning | D1 | VERIFIED |
| CASE-08 | 7, 10 | §7's armrest-is-preference/halo-is-required-check standard + §10.2 item/process integrity | Requirement vs. preference; sanitation status; setup priority | D4 | VERIFIED |
| CASE-09 | 2, 8 | Module 2 consent-can-change teaching (§K) + §8.5/M08-013's "client can always request a change... not re-litigating the protocol" | Changing consent; bodywork authority; privacy/positioning | D3 | VERIFIED |
| CASE-10 | 4, 11 | §4 layered-consent quote (verbatim: "Permission to view is not permission to save...") + §11.6 Need/Minimize/Verify (Need first, exact order match) | Layered image consent; Need/Minimize/Verify | D3 | VERIFIED |
| CASE-11 | 9, 11 | §9.5 competitor-pricing-as-context + §11.3/11.7/11.8 AI authority/verification | Pricing judgment; AI verification/authority | — | VERIFIED |
| CASE-12 | 1, 3, 4 | §3 delayed-shedding timing (near-identical shape to M03-007/M03-011) + Module 1/4 observation discipline | Timeline reasoning; observation; no diagnosis/causation certainty | D1 | VERIFIED |

**Manual spot-check confirmation (task-required, performed by direct
re-reading of the primary source, not solely agent citation).** CASE-09 was
independently checked against `module-08.md`'s August 24, 2026 amendment
text in full — the amendment's own line, *"The client can always request a
change or stop; that is not the same as re-litigating the protocol
step by step,"* was read directly and confirms CASE-09's premise (a client's
own spontaneous mid-service request is honored, distinct from the
practitioner re-offering optional steps, which the same amendment restricts).
CASE-10 was independently checked against `module-04.md` line 620 (*"Permission
to view is not permission to save. Permission to save for the client record
is not permission to post, teach from, transmit to another service, or use
in marketing"*) and `module-11.md`'s Need/Minimize/Verify framework (§11.6,
read in full) — both match CASE-10's Part A/B premises essentially verbatim.

---

## Part III — Practitioner Conversation Bank (9 interviews, all VERIFIED)

| ID | Source modules | Approved teaching point matched | Competency | Domain evidence | Status |
|---|---|---|---|---|---|
| INT-01 | 1, 4, 11 | Same Hear→Observe→Boundary→Next Step (§11.5) + Module 1/4 observation-vs-diagnosis as CASE-07/M01-002/M01-007 | Observation vs. diagnosis; tool output vs. practitioner authority | D1 | VERIFIED |
| INT-02 | 2, 8 | Same consent-can-change teaching as CASE-09 (§2 + §8.5/M08-013) | Changing consent; bodywork authority | D3 | VERIFIED |
| INT-03 | 7, 10 | Reset Under Pressure spec (read directly, §10 lines 233–245) matched near-verbatim + §7.3 build order | Sanitation/process integrity under schedule pressure | D4 | VERIFIED |
| INT-04 | 5, 8, 9 | `m5cp2`'s flagged error ("performs requested aggressive service because client signed consent") + §9.7 restraint-over-sale | Safety/appropriateness vs. client preference | D2 | VERIFIED |
| INT-05 | 4, 5, 6 | M04-008 "one image is not the scalp" + §5 regional adaptation + §6 pattern uncertainty | Regional assessment; uncertainty; service translation | — (Standard, informal D1/D2 crossover note) | VERIFIED |
| INT-06 | 2, 7, 8 | §2 active autonomy (M02-008) + §7.4 comfort response + §8 pacing ("Protect the Flow") | Service leadership under changing conditions | — (Standard, informal D2/D3 note) | VERIFIED |
| INT-07 | 9 | §9.1–9.3/9.7 pricing framework directly; "checkpoint `m10cp1` (historical internal ID)" citation confirmed accurate — Module 9's actual checkpoint IDs are `m10cp1`/`m10cp2` per the documented 9↔10 reorder | Business pricing judgment | — | VERIFIED |
| INT-08 | 11, 1 | §11.3/11.7/11.8 authority matrix + verification discipline + human ownership, directly read | AI authority by task; verification | — (D1-adjacent, informal note) | VERIFIED |
| INT-09 | 1, 4, 5, 6, 7 | M05-006 "What changes first?" Scenario 4 (stop/refer) + §7.4 dizziness/visual-change escalation | Modify vs. stop/refer | D2 (crossover D1, informal) | VERIFIED |

**Manual spot-check confirmation.** INT-01, INT-02, INT-03, and INT-08 were
each independently checked against the primary module text quoted above (not
solely against the Knowledge Bank agents' citations) as required by the
installation task's high-value/critical-domain spot-check list. All four
confirmed.

---

## Critical-flag encoding (internal architecture note)

The locked banks describe each Type A ("explicit unsafe reasoning") trigger
in prose, e.g. CASE-02's *"Type A unsafe reasoning if the student explicitly
states they would continue treatment over the finding... or knowingly reuse
the contacted device without required reprocessing."* Two encoding paths
were used, chosen by whether the case/interview has a free-text
(`structured-short-response`) part or conversational turn to evaluate:

- **Cadence-evaluated (10 of 12 cases; all 9 interviews).** The verbatim
  locked flag description is attached as `explicitUnsafeRule.description` on
  the relevant `structured-short-response` part's `rubric` (cases) or on
  every rubric criterion touching the relevant domain (interviews — read by
  `cadence-grader.mjs`, which instructs Cadence: *"If the student's stated
  reasoning matches a criterion's EXPLICIT UNSAFE TRIGGER description,
  include that criterion's domain in explicitUnsafeDomains."*). This is the
  default and matches Standard §5.2(A)'s own language ("a stated intention or
  conclusion" — most reliably captured from free text/conversation).
- **Deterministic (CASE-03 partly, CASE-04 fully — the only two cases whose
  flag text unambiguously names an exact wrong multiple-choice/multi-select
  option and, for CASE-04, has no free-text part to route to Cadence at
  all).** CASE-03's flag maps to Part B's option B ("Use the requested
  intensity because the skin is intact and the client understands what she
  wants") — a verbatim match to "proceeding... solely because the client
  insists." CASE-04's flag maps to Part A options A/D (shortening/
  circumventing contact time) and Part B options D/F (shortening contact
  time; using an unprocessed backup), via a new `choiceIncludes` trigger type
  added to `scoring.mjs` for multi-select parts (the existing `choiceEquals`
  trigger only matched an exact whole-response equality, which cannot
  express "flagged if this option is included among others selected").

No new critical flags were invented beyond what the locked banks state, and
no flag text was rewritten — every `description` field is the bank's exact
wording, copied verbatim.

---

## Engine changes required to install this content (not exam-content changes)

Two small, necessary extensions to the pre-existing engine (built in the
prior task against an empty bank) were required once real content revealed
shapes the engine didn't yet handle. Neither changes any scoring philosophy,
weighting, or gate rule — both are structural support for answer types the
locked banks specify:

1. **`classification` CasePart type** (CASE-08 Part A only) — added to
   `content-schema.mjs`'s type union, `scoring.mjs`'s `scoreDeterministicPart`
   (all-or-nothing credit, consistent with the existing sequencing/
   multi-select precedent), and `content-schema.mjs`'s `projectCaseForClient`
   (categories/items are safe to expose — they carry no answer-key
   information).
2. **`choiceIncludes` critical-flag trigger type** (CASE-04 only) — added to
   `scoring.mjs`'s case-flag matching, alongside the existing `choiceEquals`,
   so a multi-select part can flag one specific unsafe option regardless of
   what else was also selected.
3. **Client UI (`assets/js/module12-certification.js`)** — the Part II
   renderer previously only knew how to render every non-short-response part
   as a generic checkbox list, which would have produced structurally wrong
   controls (checkboxes for single-best-answer, no rendering path at all for
   sequencing/classification) once real cases were loaded. Added per-type
   rendering (radio for single-best-answer, checkboxes for multi-select, an
   accessible up/down-reorderable list for sequencing, a per-item category
   selector for classification) and fixed multi-line question/scenario text
   (several Knowledge items and Case scenarios contain bulleted history
   lists or embedded quotes) that the prior single-line `esc()` rendering
   would have collapsed into a run-on sentence.

---

## Summary

- **Knowledge Bank:** 120 items parsed and installed; **117 VERIFIED /
  approved**, **3 BLOCKED / draft** (M02-005, M07-006, M08-012).
- **Applied Case Bank:** 12 cases, all **VERIFIED / approved**.
- **Practitioner Conversation Bank:** 9 interviews, all **VERIFIED /
  approved**.
- **No raw-blueprint wording was used as a source for verification or
  installation** — `module-12-final-exam-raw-blueprint.md` was not read
  during this task's content installation or traceability pass.
- Blocking M02-005/M07-006/M08-012 leaves Module 2 at 8/9 approved, Module 7
  at 9/10 approved, and Module 8 at 13/14 approved knowledge items — every
  module still clears the engine's `partI.minPerModule: 1` requirement, and
  the 500-seeded-draw randomization test (see traceability-adjacent test
  suite) confirms a valid 40/4/3 attempt still assembles with full critical-
  domain coverage in every draw.
