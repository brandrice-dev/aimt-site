# Module 12 — Final Exam — Raw Blueprint

**Status:** Architecture corrected and locked (August 26, 2026 correction pass, see Revision note below) — exam language still awaiting owner/external rewrite. NOT final student-facing copy, NOT approved for implementation.
**Governed by:** `docs/course-audit/00-aimt-certification-assessment-standard.md` (AIMT Certification & Assessment Standard, Version 1 — architecture locked). This document implements that standard's model for Head Spa specifically; it does not define or alter the standard itself.
**Revision (August 26, 2026):** External review returned the overall architecture approved in principle, with several certification rules corrected/locked before exam rewriting begins. Locked by this pass: Part 1A's four official Head Spa critical competency domains (replacing loose item-level "Critical" tagging); the critical-domain evidence retagging of all 41 previously-Critical items across Parts 2–4 (38 mapped to a domain, 3 correctly downgraded to Standard — see Part 1A); domain-evidence tags added to all 8 applied cases and 8 interview prompts; the locked save/resume model in Part 5's State B; the critical-domain coverage requirement, retake-overlap rule, and the 120/12/9 launch bank-size target in Part 6; and a pruned Part 7 open-decisions list. **No question, case, or interview prompt's wording was rewritten by this pass** — only metadata (tags, domain mappings, coverage notes) changed.
**Wording notice:** Every question, case, and interview prompt below uses plain, utilitarian wording. This is deliberate. The owner has explicitly stated Claude's prose is not intended to ship as final exam language — this document is raw material for external rewrite, not a finished exam.
**Scope of this document:** competency extraction from Modules 1–11, the locked Head Spa critical-domain architecture, an 80-item raw knowledge question bank, an 8-item raw applied case bank, an 8-item raw Cadence exit-interview prompt bank, the Module 12 state-architecture design (States A–D), a randomization approach, and a list of open decisions requiring owner approval. No implementation is authorized by this document.
**Date:** August 26, 2026

---

# PART 1 — COMPETENCY MAP (MODULES 1–11)

Extracted from each module's currently approved specification (`module-01.md` through `module-11.md`) — not from superseded/removed content. Each module's checkpoint IDs, critical-competency flags, and cross-module links are carried forward directly into the question/case/interview banks below via each item's Source/Competency fields.

## Module 1 — Role of the Head Spa Technician

- **Core competencies:** head spa = structured cosmetic/wellness service, not medical treatment; "head spa technician" is a performed role, not a license — legal scope derives from the practitioner's own license/jurisdiction, not from AIMT certification; observation vs. diagnosis; referral triggers (new/persistent/severe/painful/spreading/concerning findings); realistic benefit/limit framing (no cure, no diagnosis, no guaranteed regrowth); scope is conditional (license + state/local law + establishment rules + equipment + exact service), not a fixed universal list.
- **Applied decisions:** client asks for a diagnosis → describe, don't diagnose, refer; flaking/oil observed → describe, don't name cause; redness/irritation → avoid aggressive technique, know when to refer; broken/compromised skin or suspected infection → stop cosmetic service, refer.
- **Communication:** approved description-only scripts for buildup, flaking, irritation, shedding/thinning; explaining role vs. license without prompting; framing referral as judgment, not failure.
- **Critical competencies:** the entire observation-vs-diagnosis boundary; no prescribing; referral triggers for severe/persistent/spreading/painful/bleeding findings or compromised/infected skin; certification never implies expanded legal scope; never continuing service over compromised/infected skin.
- **Checkpoints:** `m1cp1` (client asks about alopecia after heavy shedding — describe, don't diagnose, refer); `m1cp2` (explain what distinguishes a practitioner who leads the full experience from one who only executes steps).
- **Cross-module links:** foundational prerequisite for all later assessment/condition/equipment/protocol modules; pairs naturally with Module 3 (timing reasoning) and Module 4 (observation discipline).

## Module 2 — Welcoming Your Client

- **Core competencies:** intake review before arrival *and* verbal confirmation in person; clear prep/changing instructions without requiring more undressing than the service needs; privacy/draping/choice/autonomy; explicit consent before touch; tea/scent as optional experience elements, never physiological claims; guiding a stressed/late client without shaming or rushing; standards (must remain consistent) vs. rituals (may adapt).
- **Applied decisions:** late/stressed client → absorb pressure, don't transfer it; client declines a garment/scent/beverage → offer an alternative, treat as valid; before any touch → ask explicit permission (silence, prior visits, closed eyes, and signed intake forms are not valid consent substitutes); judge trust-impact of a disrupted ritual (minor variation vs. rushing/consent violation).
- **Communication:** approved scent/first-touch consent script; concise orientation line inviting adjustment requests at any point.
- **Critical competencies:** explicit consent before touch (and rejection of implied-consent substitutes); no pressuring clothing removal beyond what the service needs; never ignoring an allergy/sensitivity; no physiological/medical/mental-health claims for tea or aromatherapy; privacy/draping protections.
- **Checkpoints:** `m2cp1` (stressed, two-minutes-late client — walk the first five minutes: intake confirmation, prep/privacy, optional beverage/scent, consent before touch, concise orientation).
- **Cross-module links:** the consent/privacy framework every later hands-on module operates within; pairs with Module 1 (scope) when a mid-arrival finding requires observation language and a referral decision.

## Module 3 — Hair & Scalp Anatomy

- **Core competencies:** the scalp as a specialized skin environment; five anatomical layers in order (Skin, dense Connective tissue, galea Aponeurotica, Loose areolar tissue, Pericranium — SCALP); hair shaft (nonliving, cosmetically addressable) vs. hair follicle (living structure); pilosebaceous unit parts and cosmetic-care relevance; anagen/catagen/telogen/exogen as approximate, individually variable ranges; the weeks-to-months delay between a triggering event and visible shedding; stratum corneum as the actual barrier ("hydrolipid film" is cosmetic shorthand, not a mechanism); massage's honest scope (comfort/technique/temporary local effect, not proven regrowth/nutrient-delivery).
- **Applied decisions:** diffuse shedding beginning weeks-to-months after a major stressor → may describe as "compatible with" a pattern, never diagnose; flaking + oiliness + tightness together → apply the three-question rule (sensation? product history? full pattern?) before adjusting service; patchy/asymmetric/scarring/inflamed findings or brow/lash involvement → document, explain the limit, pause/modify, refer; never massage an area that should be medically evaluated first.
- **Communication:** explaining shedding timing without diagnosing; the module's referral script; explaining barrier/surface-lipid concepts and a conservative service change without diagnostic language.
- **Critical competencies:** observation-vs-diagnosis applied to shedding patterns; correct timeline causal reasoning (never attributing shedding to an event that happened *after* onset — this exact reversed-timeline error was a corrected pre-audit bug and is strong exam material); referral triggers for patchy/asymmetric/scarring/painful/bleeding/inflamed findings; not massaging a concerning area; not implying medicated/prescription treatment.
- **Checkpoints:** `cp1` (shedding began ~10 weeks after a high fever — explain the timing without diagnosing); `cp2` (tightness/flaking after daily strong clarifying shampoo — explain barrier/lipid film and choose a conservative change).
- **Cross-module links:** the structure→pattern→history→service-implication→limit sequence is the explicit foundation for Module 4's assessment work; strong combined-case material with Modules 1 and 2.

## Module 4 — Microscopy & Scalp Assessment

- **Core competencies:** cosmetic scalp-camera use vs. medical trichoscopy; the five-point scan (frontal hairline → top parting → crown/vertex → temporal → occipital/back) plus targeted/comparison views when warranted; the five observation lenses (surface, follicular openings, perifollicular area, hair shafts, distribution) applied at every station; standardized image-collection technique (assess before treatment products, ask product history, part cleanly, light contact, adequate dwell time, consistent conditions); recognizing device/image artifacts (pressure-induced blanching, dirty lens, product mimicking pathology); the four-part observation discipline (what's visible / what context is needed / what may responsibly change / what the image does not prove); the Supported observation / Working question / Unsupported conclusion classification; the five appearance-example labels as descriptive teaching labels only, never diagnoses; device hygiene and reprocessing; layered image-consent (live view ≠ save ≠ marketing/teaching use).
- **Applied decisions:** the four/five terminal decisions — Preserve / Modify conservatively / Avoid or pause an area / Stop and refer; whether to add targeted views beyond the baseline five; whether a before/after comparison is valid (matched region/magnification/light/pressure/orientation); whether to continue when skin is broken/bleeding/weeping/pustular — **client comfort or lack of pain never overrides a visible stop-and-refer finding**; how to handle a contaminated device.
- **Communication:** live-view introduction script (customization support, not diagnosis); image-capture consent script; the referral script; translating magnified observations into calm, non-diagnostic documentation language.
- **Critical competencies:** the entire do-not-proceed content (broken/bleeding/weeping/oozing/pustular/crusted/draining skin, marked pain/heat/swelling, concerning hair-loss patterns) as stop-service/refer-out triggers; client comfort never overriding a stop-and-refer finding; device contamination/reprocessing after contact with compromised skin; the prohibition on diagnosing or claiming the device proves cause; never increasing pressure to "improve" an image; image-consent tiers.
- **Checkpoints:** `m4cp1` (crown shiny with follicular material, frontal hairline matte with fine scale, client denies pain — document, explain why one whole-scalp label is weak, name a needed consultation question); `m4cp2` (crown shows raised lesions with fluid/crusting, client unbothered and asks to continue — what happens to the microscope, the service, and the client conversation).
- **Cross-module links:** the module Module 5 is explicitly built on ("Module 4 teaches you how to gather and describe evidence; Module 5 teaches you how to translate it into a service direction"); m4cp2's stop-and-refer skin finding is a near-direct template match to m5cp2's reactive-presentation-with-client-pressure scenario.

## Module 5 — Scalp Patterns & Service Adaptation

- **Core competencies:** a service plan is built from current findings + client context, never a fixed/permanent label; the five service directions/patterns (Baseline/maintenance; Oil-dominant or residue-present; Fine-scale/dry-appearing; Mixed regional; Reactive/sensitivity-reported), each non-diagnostic; the five service levers (cleansing, exfoliation, water/steam, pressure/tempo, product placement/finish); the five-step decision-priority order — **safety limit → client comfort/reactivity → surface tolerance → visible cosmetic need → client preference**, applied in that fixed order; building a regional protocol (Preserve/Modify/Avoid/Pause/Refer) lever-by-lever and region-by-region; choosing a product category for a stated reason, not a favorite ingredient.
- **Applied decisions:** the recurring core judgment — given a regional/mixed presentation, decide the first responsible direction per lever, per region; when to preserve a stable presentation rather than "improve" it unnecessarily; when a regional finding justifies targeted vs. whole-scalp intensity; when client-reported symptoms should downgrade intensity below what appearance alone would suggest; when to stop/pause/refer vs. modify (broken/moist/draining skin); **how to respond when a client explicitly requests a stronger service than the assessment supports — redirect, don't comply.**
- **Communication:** the mixed-regional script; the lower-intensity/redirection script when a client asks for more than is appropriate; the pause-and-refer script.
- **Critical competencies:** the safety limit and client comfort/reactivity **outrank** an explicit client request for a stronger service — a client's consent does not authorize an unsafe intensity; referral triggers (broken/bleeding/weeping/oozing/draining/pustular/severely painful/rapidly worsening) apply regardless of client preference; never diagnosing the cause of a reactive/oil/dry presentation; never treating exfoliation/steam/pressure as tools to "remove inflammation" or "treat infection"; visible scale is not automatic permission to exfoliate.
- **Checkpoints:** `m5cp1` (crown shows shine/residue, sides/hairline show fine scale, no reactivity reported — adapt by region, name the whole-scalp mistake being avoided); `m5cp2` (client reports stinging/tenderness and a reactive-appearing area but still requests max exfoliation/steam/pressure — what's said, what's modified or paused, what would trigger a referral instead).
- **Cross-module links:** direct continuation of Module 4's assessment vocabulary (must not reverse any Module 4 correction); Module 6 explicitly layers condition-interpretation "on top of" Module 5's adaptation skill.

## Module 6 — Conditions & Disorders

- **Core competencies:** distinguishing dry-scalp from dandruff-spectrum presentations using multiple observable cues together (never one cue alone); appearance is suggestive, not conclusive — other conditions (psoriasis, tinea capitis, contact/atopic dermatitis) can look similar and cannot be ruled out cosmetically; corrected mechanism framing (dry scalp = barrier/moisture; dandruff-spectrum = multifactorial, not oil alone); placing a dandruff-spectrum presentation on a mild-to-more-involved continuum (extent, redness, scale thickness/adherence, spread beyond the scalp margin); recognizing an ambiguous/mixed presentation and favoring history + the gentler direction; within-scope product responses (cleansing support, OTC 1%-strength anti-fungal/zinc-pyrithione/1% selenium-sulfide, anti-inflammatory botanicals, simplifying an over-treated routine); the 1% (OTC) vs. 2% (Rx-only) ketoconazole concentration line — **only 1% may ever be referenced to a client**; the six-step "wrong product cycle" (assumption → wrong product → stripping → worsening → escalation → arrival at the practitioner's table); the Section 6.6 referral criteria; realistic trigger/evidence strength (stress — real flare association; diet — weak/individual; heat/humidity — qualitative only, no numeric rule).
- **Applied decisions:** proceed as usual / proceed with modification / pause and refer — the core triage judgment; choose an OTC category vs. simplify vs. refer, weighing oil + redness + spread together; when a client is escalating anti-dandruff products on an increasingly reactive dry scalp, **reassess the presentation before choosing a product direction** (don't escalate further, don't add exfoliation); when a presentation is too ambiguous to label.
- **Communication:** gently correcting a client's self-diagnosis; explaining why an anti-dandruff product worsened a dry-scalp presentation; the referral script; framing an OTC recommendation as retail literacy, not diagnosis/prescription.
- **Critical competencies:** the Section 6.6 referral criteria as a whole; never diagnosing a named medical condition as confirmed fact; the 1%-only ketoconazole boundary; never promising a cure; the pause-and-refer judgment itself — under-referring a more-involved presentation is the module's central high-consequence failure mode.
- **Checkpoints:** `m6cp1` (fine white powdery flakes, minimal oil, matte surface, three months of worsening anti-dandruff shampoo use — identify dry-scalp pattern, explain the stripping mechanism, offer a within-scope alternative); `m6cp2` (same client, but yellowish clumped flakes near the follicle, oiliness, mild redness, spread to eyebrows/hairline — recognize the more-involved end of the spectrum and make a scope/referral decision).
- **Cross-module links:** applies (does not re-teach) Module 4's observation-vs-conclusion discipline and Module 5's service-lever translation skill; the "Sort three presentations" interaction is a compressed rehearsal of the Module 4→5→6 judgment chain.

## Module 7 — Equipment & Room Setup

- **Core competencies:** evaluating a treatment bed by function-based required categories (basin/head relationship, entry/exit stability, practitioner reach, water management, sanitation compatibility) vs. preference categories (space requirements, armrest configuration); the tool philosophy (essentials-first, upgrades-later; hands create the experience, not tool count); the three-zone reach framework (golden/within-reach, one-step, reserve/off-surface), arranged by service sequence and frequency of use; clean/dirty sanitation-bin separation as an ongoing live-service practice; the ten-step station-prep sequence and its build-logic (sanitation/structure first, then product/tool staging, then comfort, then ambient); the three physical positioning checks (halo alignment, shoulder position, occipital support); the documented (rare) Beauty Parlor Stroke Syndrome basis for avoiding sustained neck hyperextension against a hard basin edge, taught briefly and non-alarmingly; distinguishing ordinary discomfort (a positioning fix) from medical-emergency signals (dizziness, visual changes, slurred speech — stop entirely, treat as medical).
- **Applied decisions:** requirement vs. preference in bed evaluation; what belongs in golden/one-step/reserve zone; what must happen first vs. last in station prep, and why reversing creates rework; which of the three positioning checks failed and what the fix is; **on a discomfort report: stop → adjust (positioning and/or temperature) → communicate → resume only once confirmed comfortable** — never adjust silently, never push through to a stopping point; ordinary strain/discomfort → reposition and reassure, vs. dizziness/visual changes/slurred speech → stop entirely as a medical concern; classifying a setup element as "needs correction" vs. "acceptable variation."
- **Communication:** communicating a setup/positioning adjustment (what's changing, checking in, before resuming); explaining prep-order dependency reasoning to a new student.
- **Critical competencies:** the cervical-hyperextension safety note; the ordinary-discomfort-vs-medical-emergency distinction; the stop→adjust→communicate→resume sequence (failure to pause first is an explicit immediate-fail trigger); sanitation compatibility as a required bed category; the "never mix" clean/dirty bin rule.
- **Checkpoints:** `m7cp1` (what to tell a new student setting up their first room from scratch, and why prep order matters); `m7cp2` (client reports neck strain and feeling cold at the very start of the halo-rinse phase — walk through the response, what's adjusted, in what order).
- **Cross-module links:** reapplies Module 1's referral/stop-service language to a comfort/safety pause rather than a scope boundary; reapplies Module 4's observation-vs-conclusion discipline to spotting setup errors; setup/positioning fluency is a stated prerequisite for Module 8's full service sequence.

## Module 8 — The Head Spa Service

**Status note:** Module 8 is not yet manually approved (owner pass deferred; Video 01 footage and hosted-video verification remain outstanding) — its curriculum content is nonetheless the current approved specification and is extracted normally.

- **Core competencies:** the 17-numbered step sequence organized into 9 video-led chapters (Aromatherapy; Client Positioning + Comfort; Dry Brushing and Hair Play; Halo Activation + Wet Massage; Exfoliant + Scalp Massage; Neck and Shoulder Massage; Shampoo + Rinse; Deep Conditioning/Hand + Arm Massage; Final Rinse + Halo Massage/close); the Core (60-min) vs. Extended (90-min) reference-format model, each a deliberately different structure, not a scaled version of the other; adapting exfoliation by intensity/method/product/pressure/technique (a dial, not a switch) — only a genuine safety/scope reason justifies fully omitting deliberate exfoliation; the exact set of unsupportable physiological/outcome claims (circulation, lymphatic movement, nervous-system activation, cuticle closure, steam-penetration, rebooking-causation) vs. the one preserved legitimate safety practice (confirming water temperature every time — never guessed); "explain intentionally, not continuously" (three communication modes: Communication cue, Keep the flow quiet, If they ask); the neck/shoulder/hand/forearm scope guardrail (performed only within license/training/this client's established consent — course completion never expands licensure); pressure *consistency*, not pressure level, as the real skill signal.
- **Applied decisions:** a strong exfoliation approach is inappropriate today → modify product/pressure/technique/intensity while preserving flow, vs. omitting outright (only for a genuine safety/scope reason); a client's fragrance/touch preference changes mid-service → adjust without treating it as disruption, while recognizing this should normally have been decided at intake; a processing step runs long/short → adjust pacing without visibly scrambling; deciding what, if anything, needs to be said at a given moment.
- **Communication:** the Step 01 fragrance-choice script (all options, including fragrance-free, offered with equal weight); the scalp-massage reassurance language (no physiological claims); the honest sensory framing for the cooling-spray moment (no cuticle/circulatory claim); the verbatim closing script (what was observed, products used and why, one home-care recommendation, "how are you feeling?"); answering "what makes this different from a regular shampoo?" without medical/circulation/lymphatic/growth claims.
- **Critical competencies:** manual water-temperature confirmation every time (never guessed); the neck/shoulder/hand/forearm scope guardrail; the non-diagnostic-language requirement (an explicit immediate-correction trigger on both checkpoints); the prohibition on unsupported medical/circulation/lymphatic/growth claims; consent-before-touch at the very first contact (Step 01).
- **Checkpoints:** `m8cp1` (moving into exfoliation, strong approach isn't appropriate today — walk through the modification, preserving flow, including product/pressure/technique and client communication); `m8cp2` (mid-scalp-massage, client asks what makes this different from a regular salon shampoo — answer in the moment without medical/circulation/lymphatic/growth claims).
- **Cross-module links:** the module ends at an exact closing line that Module 9 begins immediately after; strong combined-case material pairing m8cp1's exfoliation-adaptation reasoning with Module 9's "restraint wins over the sale" enhancement rule, and Module 8's neck/shoulder scope territory with Module 9's checkout enhancement offer.

## Module 9 — Checkout, Client Closing & Pricing Strategy

**Note:** internally, this module's checkpoints are IDed `m10cp1`/`m10cp2` due to a slot-swap migration with Module 10 (Sanitation). This is a code-architecture fact, not curriculum — question/case IDs in this blueprint use `M09` for the student-facing module number regardless of the internal checkpoint-ID quirk.

- **Core competencies:** the four cost components (direct/variable service costs; allocated overhead; practitioner time — broader than treatment time alone; a deliberately chosen margin, not a prescribed number); margin vs. markup as mathematically distinct (markup from cost; margin from price — the same 30% produces different prices from the same $100 cost, $130 vs. ≈$143); the corrected Cost Base → Target Price calculator (three cost inputs, a deliberately chosen margin, three distinct labeled outputs; 0% margin = true break-even); competitor pricing as market context, not formula, inside a five-factor intersection (cost structure + service design + capacity + market context + business positioning); meaningful menu differentiation (not a fixed tier-count rule); evaluating whether an enhancement genuinely belongs (distinct purpose, real service difference, time/cost effect, clear positioning, appropriate placement — grounded in the established plan and any already-identified contraindications); the in-the-moment vs. afterward price-feedback response (two distinct skills); multiple causes of underpricing beyond fear/confidence (incomplete cost data, poor overhead allocation, inaccurate time assumptions, competitor copying, intentional strategy, market constraints, weak differentiation, lack of pricing knowledge — fear is one cause among several); the diagnostic sequence (cost → pricing → menu → positioning → service-delivery → market-fit), checked in order.
- **Applied decisions:** separating the in-the-moment response to a price comment from the afterward multi-factor review; deliberately choosing a margin rather than accepting a default; deciding the specific personalized closing observation; **an enhancement recommendation never overrides a genuine scalp-presentation safety reason from Modules 5–6 — restraint wins over the sale**; deciding menu option count/differentiators without a "three tiers" rule.
- **Communication:** the five-part closing shape (reorient → brief accurate recap → answer/recommend with a specific reason → invite future options without pressure → complete checkout) — must work cleanly for a client who declines everything; the price-feedback in-the-moment model response; checkout mechanics (confirm what's being paid for, communicate total clearly, neutral gratuity presentation, no implied mandatory gratuity).
- **Critical competencies (scope-adjacent, the module's one safety intersection):** enhancement recommendations must never override a genuine safety reason established in Modules 5–6; avoiding implied-diagnosis phrasing in enhancement recommendations (e.g., "what the scalp needs").
- **Checkpoints:** `m10cp1`/internally-named (build/evaluate a service menu — real costs, full practitioner time, deliberate margin, meaningful differentiation, no reliance on competitor-copying alone); `m10cp2`/internally-named (client says "I loved it but the price felt high" — the in-the-moment response and the afterward multi-factor review).
- **Cross-module links:** begins exactly where Module 8 ends; draws directly on Modules 5–6's contraindication/adaptation judgment for the enhancement guardrail; references Module 8's Core/Extended labels as internal vocabulary only, not required client-facing menu names.

## Module 10 — Sanitation & Reset Systems

**Note:** internally, this module retains checkpoint IDs `m9cp1`/`m9cp2` due to the same slot-swap migration noted above. Question/case IDs in this blueprint use `M10` for the student-facing module number.

- **Core competencies:** the five-way distinction — clean (soil/residue removal) vs. disinfect (label-directed treatment with required contact/wet time) vs. launder/replace/discard (porous washables vs. single-use vs. reusable hard tools each follow a different path) vs. reset (preparing the room/supplies/equipment for the next service — not synonymous with disinfection) vs. sterilize (Head Spa implements are not "sterile" merely because disinfected); the ITEM → PROCESS framework applied to any given item (reusable hard tools; hard surfaces; linens/porous washables; single-use items; halo/water equipment — governed by manufacturer instructions and applicable regulation, not a universal rule; product bowls/applicators/supplies); why disinfectant labels and equipment manufacturer instructions — not a memorized AIMT number — control the exact procedural specifics; three operational cadences (between-clients, daily/opening-closing, periodic/manufacturer-directed) without one universal frequency; the water-line/halo maintenance instructor tip's required boundaries (personal tip, not universal — requires equipment compatibility, product label, manufacturer instructions); distinguishing an ordinary reset from a blood/OPIM incident requiring a different, non-routine procedure; sanitation records as an operational/traceability tool, not a legal-protection guarantee; compliance review as recurring, not satisfied by one annual check.
- **Applied decisions:** given an item/surface/tool, which processing category it belongs to; the **Reset Under Pressure** decision — next client has arrived early, a required disinfectant contact/process time is still running: preserve the required time; continue other appropriate tasks in parallel; substitute an already-ready alternative if available; or delay the next service/start — never wipe dry early, never skip remaining contact time, never grab an unprocessed backup; recognizing when a normal reset is insufficient and an incident procedure must trigger instead; responding to a post-service concern without diagnosing or assuming/denying causation; building a room-specific reset order that stays workable under time pressure.
- **Communication:** walking through a between-client reset in order, identifying what's contained, cleaned vs. disinfected, replaced, and which required times are never shortened; responding to a client's reported post-service reaction — acknowledge, document, describe what's reviewed internally, avoid assigning or denying causation, encourage medical evaluation when warranted without diagnosing.
- **Critical competencies:** correctly distinguishing clean/disinfect/reset and applying the right process to the right item (a miscategorization is a direct infection-control failure); **never shortening required disinfectant contact time or equipment-directed process time regardless of schedule pressure** — the module's central thesis; recognizing that blood/OPIM contamination triggers a different, non-routine procedure; never diagnosing or assuming/denying causation when a client reports a post-service reaction (both false denial and false admission are explicit failure modes).
- **Checkpoints:** `m9cp1`/internally-named (walk through a between-client reset in order — what's contained, cleaned/disinfected, replaced, and what required time is never shortened); `m9cp2`/internally-named (a client reports a rash the next day — what's said, documented, and reviewed internally without diagnosing or assuming cause).
- **Cross-module links:** largely self-contained relative to earlier modules (built on the student's existing licensure, not earlier AIMT content); `m9cp2`'s no-diagnosis/no-causation-assumption discipline pairs directly with Module 11's parallel "don't confirm a diagnosis from an AI result" boundary — same underlying scope-of-practice principle, two different information sources.

## Module 11 — AI / Modern Practice Tools

- **Core competencies:** where AI already shows up in modern practice (business, marketing, communication, research, education, automation, scalp imaging/analysis, client conversations); the four durable AI tool categories (language/reasoning assistants, creative AI, scalp/hair imaging analysis, automation/practice systems) taught by function, not by product name; "professional-looking output is not automatically verified output"; the B.R.I.E.F. framework (Background, Request, Instructions, Expected Output, Fact-check) for constructing a well-formed AI request; the three-level AI Use/Authority Matrix (Level 1 — AI leads the draft, human reviews; Level 2 — AI assists, human verifies, "AI can accelerate the search, it does not eliminate verification"; Level 3 — keep final authority human, "the tool does not expand your professional authority"); what an AI confidence score is/is not (system-generated information, not a confirmed diagnosis); the factors that can shift a confidence-score result (training data, image quality/lighting, capture conditions, populations represented, independent validation); the Need/Minimize/Verify framework before sharing any client information/image with an AI tool; the six practice-leverage categories (Marketing, Client Communication, Business Thinking, Research, Training/Staff Development, Administrative Leverage); "research with AI, verify outside AI"; the five ownership pairs closing the module (AI may draft/practitioner owns the message; AI may organize/practitioner owns the judgment; AI may identify patterns/practitioner owns what gets communicated; AI may help build the business/practitioner creates the experience; AI may support education/humans still teach touch, technique, hands-on judgment).
- **Applied decisions:** given a practice task, which of the three authority levels applies; given a drafted AI request, what still needs human fact-checking; **when a client states an AI-derived conclusion about their scalp/hair, how to respond — acknowledge, redirect to today's observable findings, state the professional boundary, choose a next step based on actual findings (not on confirming or denying the AI's claim)**; before uploading client information/an image to an AI tool, whether it's necessary and how to minimize it.
- **Communication:** Hear → Observe → Boundary → Next Step, the module's unified client-response framework for a client who brings an AI-sourced claim; writing a well-formed AI request with context, a clear task, and at least one constraint.
- **Critical competencies (scope-of-practice-adjacent, not clinical-safety-critical):** never confirming a medical diagnosis from an AI result (an explicit immediate-correction trigger on `m11cp1`); never claiming AI expands the practitioner's license/authority (also an explicit trigger); the Need/Minimize/Verify discipline around client images/data.
- **Checkpoints:** `m11cp1` (client says "I asked ChatGPT about my scalp and it says I have dandruff" — how to respond, what to confirm/not confirm, how to decide what happens next); `m11cp2` (choose one real practice task, write the request given to the AI, explain what would be reviewed/verified before use).
- **Cross-module links:** Module 1's scope/referral judgment directly reused in the client-response boundary; Module 4's observation-vs-diagnosis framing directly parallels the confidence-score literacy; Module 10's no-diagnosis/no-causation-assumption discipline (post-service complaint) is the closest direct competency pair — same discipline, different information trigger; positioned as a capstone module immediately before Module 12.

---

# PART 1A — HEAD SPA CRITICAL COMPETENCY DOMAINS (locked, August 26, 2026)

Corrects and supersedes the original item-level "Critical" tagging used throughout Parts 2–4 below. Per `00-aimt-certification-assessment-standard.md` Section 5 (the domain evidence model this implements): an exam item, case, or interview criterion tagged **Critical** does not by itself fail a certification gate. It is tagged either **Standard** or **Critical-Domain Evidence: [Domain]** — evidence contributing to that domain's overall evaluation. A domain gate actually fails only when the standard's Section 5.2 bar is met: (A) explicit unsafe/inappropriate reasoning stated by the student, or (B) a meaningful repeated pattern across more than one assessment point. A single missed domain-evidence multiple-choice question lowers the relevant Part I/II/III score in the ordinary way — it does not, alone, fail a domain.

These four domains are now the **official, locked Head Spa critical-gate architecture** — extracted from the curriculum evidence in Part 1 above and confirmed against the certification standard's bar for domain status (limited, defensible, high-consequence, evidence-based).

### Domain 1 — Professional Scope / Diagnosis / Referral

- observation vs. diagnosis;
- not confirming named medical conditions;
- knowing when a finding requires referral;
- AI/device output not expanding professional authority;
- AIMT certification not expanding legal scope.

**Explicit-unsafe-reasoning example (Type A gate trigger):** a student states they would confirm a named medical condition (client-reported, AI-reported, or self-observed) as established fact, or states that certification/training/an AI tool's output expands their license or legal authority to diagnose.

### Domain 2 — Contraindication / Client Safety Judgment

- stop-and-refer findings;
- safety outranking client preference;
- client comfort not overriding a visible contraindication;
- water-temperature confirmation;
- ordinary discomfort vs. medical-emergency escalation;
- not pushing through an unsafe/inappropriate service condition.

**Explicit-unsafe-reasoning example (Type A gate trigger):** a student states they would continue a cosmetic service over a stop-and-refer finding, proceed with a service intensity a client explicitly should not receive given reported reactivity/tenderness, or treat a medical-emergency signal (dizziness, visual changes, slurred speech) as an ordinary positioning fix.

### Domain 3 — Consent / Touch / Bodywork Authority

- explicit consent before touch;
- privacy/autonomy;
- scope/training/consent requirements for neck, shoulder, hand, forearm, or other bodywork;
- client request not substituting for professional authorization or prior consent.

**Explicit-unsafe-reasoning example (Type A gate trigger):** a student states they would touch a client, extend service into new bodywork territory, or use/share client images without appropriate consent — or treats a client's in-the-moment request as sufficient authorization on its own.

### Domain 4 — Sanitation / Process Integrity

- clean vs. disinfect vs. reset distinctions;
- correct item → process reasoning;
- required contact/process time never shortened;
- contaminated equipment properly removed/reprocessed;
- recognizing when routine reset is not enough (e.g., a blood/OPIM incident).

**Explicit-unsafe-reasoning example (Type A gate trigger):** a student states they would shorten a required disinfectant contact/process time under schedule pressure, reuse a contaminated device/tool without reprocessing, or treat visual cleanliness as equivalent to completed processing.

### Item-to-domain mapping

Every item in Parts 2–4 below that was previously tagged `Critical` has been reviewed against these four domains. Items that clearly provide evidence for one of the four are retagged `Critical-Domain Evidence: [D1–D4]` (question wording unchanged). **Three items did not fit any of the four locked domains** and are retagged `Standard` instead — this is a deliberate narrowing, not an oversight: the four domains above are now the *exclusive* list of critical-gate-relevant competencies for Head Spa, and a previously-loose "high-consequence-sounding" tag is not sufficient grounds for domain status on its own.

- `HS-FE-M02-003` (unsupported physiological/health claims for tea/aromatherapy) — retagged Standard. This is a marketing/claims-accuracy competency, not diagnosis, contraindication, consent, or sanitation.
- `HS-FE-M08-004` (unsupported circulation/lymphatic claims mid-massage) — retagged Standard, same reasoning.
- `HS-FE-M08-009` (unsupported claims framing the cooling-spray moment) — retagged Standard, same reasoning.

**A genuine coverage gap surfaced by this mapping, not resolved by this pass:** the current raw 8-case / 8-interview banks (Parts 3–4) do not contain a case or interview item whose *primary* evidence is Domain 3 (Consent/Touch/Bodywork Authority) — Domain 3 evidence currently exists only as secondary/incidental content inside Case 01's arrival/consent framing and Case 06's neck/shoulder/hand scope-guardrail content. Per the certification standard's Section 5.3 (every domain needs at least one non-MCQ evidence point per attempt), this is a real bank-growth requirement, not just a nice-to-have — see Part 7, item 5.

---

# PART 2 — RAW KNOWLEDGE QUESTION BANK (80 candidates)

Target: ~40 questions selected per attempt from this bank of 80, via the balanced randomization approach in Part 6. Distribution below is weighted by instructional importance, safety relevance, foundational role, and applied complexity — not equal per-module weighting, per the certification standard. Approximate difficulty mix achieved across the 80-item bank: 16 foundational / 49 applied / 15 advanced-synthesis (target ~20/60/20 applies to the assembled 40-question attempt, not rigidly to each module's raw sub-bank). All wording is raw/utilitarian — not final copy. All items use 4 choices unless noted.

Per-module question count in this bank: M1–6, M2–6, M3–7, M4–9, M5–8, M6–8, M7–7, M8–10, M9–6, M10–8, M11–5 (total 80).

## Module 1 questions (6)

### HS-FE-M01-001
- Competency: role vs. license | Tag: Standard | Difficulty: Foundational
- Q: A new head spa technician asks what their AIMT certification legally allows them to do. What is the correct answer?
- A) The certification itself sets a fixed national scope of practice for head spa services.
- B) The certification documents completion of AIMT's training; actual legal scope still comes from the practitioner's existing license, state/local law, and their employer's rules.
- C) The certification allows diagnosis of common scalp conditions as long as the technician stays within head spa services.
- D) The certification functions as a standalone license equivalent to a cosmetology license.
- Correct: B
- Rationale: Module 1 explicitly teaches that "head spa technician" is a performed role, not a license, and that scope is conditional on the practitioner's own license, jurisdiction, and workplace.
- Why others wrong: A) no fixed national scope exists — it's conditional. C) diagnosis is never authorized by this certification. D) certification never substitutes for a required license.
- Source: Module 1, "Core competencies"
- Randomization: eligible

### HS-FE-M01-002
- Competency: observation vs. diagnosis | Tag: Critical-Domain Evidence [D1] | Difficulty: Applied
- Q: During a consultation, a client asks, "Do you think this is eczema?" What is the best response?
- A) "It looks like eczema to me, but let's proceed carefully."
- B) "I can describe what I'm seeing, but I can't diagnose a condition — if it's concerning, a dermatologist can evaluate it."
- C) "It's probably just dryness, nothing to worry about."
- D) "I'll treat it as eczema and adjust the service accordingly."
- Correct: B
- Rationale: This preserves the observation-vs-diagnosis boundary and offers an appropriate referral path without naming a condition.
- Why others wrong: A and D name/imply a diagnosis. C dismisses a client concern with an unsupported conclusion.
- Source: Module 1, "Applied decisions"
- Randomization: eligible

### HS-FE-M01-003
- Competency: referral triggers | Tag: Critical-Domain Evidence [D2] | Difficulty: Applied
- Q: Which of the following findings should prompt a technician to stop a cosmetic service and refer the client for medical evaluation?
- A) Mild, evenly distributed oiliness across the scalp.
- B) A small area of broken, weeping skin near the crown.
- C) Fine, dry-appearing flaking with no other symptoms.
- D) A client mentioning they colored their hair last week.
- Correct: B
- Rationale: Broken/weeping skin is an explicit stop-and-refer trigger regardless of client comfort.
- Why others wrong: A, C, and D describe ordinary, non-urgent findings that do not require stopping service.
- Source: Module 1, "Critical competencies"
- Randomization: eligible

### HS-FE-M01-004
- Competency: realistic benefit framing | Tag: Standard | Difficulty: Applied
- Q: A client asks if head spa treatments will cure her thinning hair. Which response stays within AIMT's approved framing?
- A) "Absolutely — most clients see regrowth within a few months."
- B) "Head spa services can support scalp comfort and a healthy-feeling environment, but they don't diagnose or cure hair loss."
- C) "I can't promise anything, but it definitely won't hurt to try."
- D) "This service specifically targets the follicles that cause thinning."
- Correct: B
- Rationale: This is honest about realistic benefits without overstating a claim the course does not support.
- Why others wrong: A and D promise unsupported outcomes. C is evasive and doesn't actually answer the client's question with accurate information.
- Source: Module 1, "Core competencies"
- Randomization: eligible

### HS-FE-M01-005
- Competency: role distinction | Tag: Standard | Difficulty: Applied
- Q: What most clearly distinguishes a practitioner who "leads the full client experience" from one who only performs the physical steps of a head spa service?
- A) Using more expensive products during the service.
- B) Exercising judgment, communication, and adaptation beyond executing the technique itself.
- C) Completing the service faster than average.
- D) Offering the maximum number of add-on enhancements.
- Correct: B
- Rationale: This matches `m1cp2`'s pass criteria — a named responsibility beyond physical technique (observation, communication, pacing, adaptation, comfort, scope, safety, referral).
- Why others wrong: A, C, and D describe surface-level or unrelated factors, not the judgment/communication distinction the module teaches.
- Source: Module 1, `m1cp2`
- Randomization: eligible

### HS-FE-M01-006
- Competency: scope conditionality (synthesis) | Tag: Critical-Domain Evidence [D1] | Difficulty: Synthesis
- Q: A technician moves to a new state and starts a new job at a spa with its own internal policies. Which statement best reflects how their professional scope should now be determined?
- A) Their AIMT certification defines a fixed scope that travels with them regardless of location.
- B) Their scope must be reassessed against their license type, the new state/local law, and the new workplace's rules and equipment — all four together, not any one alone.
- C) As long as their license transferred, no further scope reassessment is needed.
- D) Scope is determined solely by what equipment the new spa provides.
- Correct: B
- Rationale: Module 1 teaches scope as the intersection of license + jurisdiction + workplace rules + equipment + the exact service — not any single factor, and not portable via certification alone.
- Why others wrong: A treats certification as a scope-granting credential, which it explicitly is not. C and D each isolate one factor as sufficient, ignoring the others.
- Source: Module 1, "Core competencies"
- Randomization: eligible

## Module 2 questions (6)

### HS-FE-M02-001
- Competency: standards vs. rituals | Tag: Standard | Difficulty: Foundational
- Q: Which of these is a "standard" that must remain consistent for every client, rather than a "ritual" that may be adapted or dropped?
- A) Offering a specific tea flavor.
- B) Obtaining explicit consent before first touch.
- C) The exact wording used to describe the scent options.
- D) Whether a robe or a cape is offered.
- Correct: B
- Rationale: Consent before touch is a standard — it must always occur. Rituals (tea flavor, exact wording, robe vs. cape) may vary.
- Why others wrong: A, C, and D are all examples of adaptable rituals, not required standards.
- Source: Module 2, "Sequence/process competencies"
- Randomization: eligible

### HS-FE-M02-002
- Competency: valid consent | Tag: Critical-Domain Evidence [D3] | Difficulty: Applied
- Q: Which of the following counts as valid consent before a technician introduces touch (e.g., a hand on the shoulder)?
- A) The client signed a general intake form before arriving.
- B) The client has been to this spa before.
- C) The client's eyes are closed and they haven't objected.
- D) The technician asks directly, and the client verbally agrees in the moment.
- Correct: D
- Rationale: The module explicitly rejects signed forms, prior visits, and silence/closed eyes as valid consent substitutes — only an explicit, in-the-moment agreement counts.
- Why others wrong: A, B, and C are all explicitly named as invalid consent substitutes in the approved curriculum.
- Source: Module 2, "Critical competencies"
- Randomization: eligible

### HS-FE-M02-003
- Competency: hospitality claims | Tag: Standard | Difficulty: Applied
- Q: A technician wants to explain the benefit of the pre-service tea offering to a client. Which explanation is appropriate?
- A) "This tea helps regulate your nervous system before we begin."
- B) "It's a small pause to help you settle in before we start — totally optional."
- C) "This blend reduces cortisol and prepares your body for treatment."
- D) "Most clients say this is what makes the whole experience effective."
- Correct: B
- Rationale: Tea and scent are optional hospitality elements — the module explicitly forbids physiological/medical claims for them.
- Why others wrong: A and C make unsupported physiological/medical claims. D implies the tea itself makes the treatment effective, another unsupported claim.
- Source: Module 2, "Critical competencies"
- Randomization: eligible

### HS-FE-M02-004
- Competency: prep/privacy instructions | Tag: Critical-Domain Evidence [D3] | Difficulty: Applied
- Q: A client seems uncertain about a changing instruction. What is the correct approach?
- A) Require the client to remove any garment that might get wet, regardless of what the service actually needs.
- B) Give clear instructions limited to what the specific licensed service actually requires, and offer an alternative if the client is uncomfortable.
- C) Avoid giving any instructions and let the client figure it out.
- D) Ask the client to fully undress for consistency with spa policy.
- Correct: B
- Rationale: Instructions should be clear and limited to what the service needs, preserving privacy and choice.
- Why others wrong: A and D require more undressing than necessary. C is unhelpfully vague and undermines clarity, which the module also requires.
- Source: Module 2, "Core competencies"
- Randomization: eligible

### HS-FE-M02-005
- Competency: handling a stressed/late client | Tag: Standard | Difficulty: Applied
- Q: A client arrives five minutes late, visibly stressed, and apologizing repeatedly. What is the best first response?
- A) "We're a bit behind now, so let's move quickly to catch up."
- B) "No problem at all — let's get you settled in." (then proceed calmly through the arrival sequence)
- C) "I'll need to shorten your service today because of the delay."
- D) Say nothing about the delay and begin the service immediately without any arrival sequence.
- Correct: B
- Rationale: The technician should absorb schedule pressure professionally, without shaming or rushing the client.
- Why others wrong: A and C transfer schedule pressure onto the client. D skips the required privacy/consent/orientation sequence.
- Source: Module 2, `m2cp1`
- Randomization: eligible

### HS-FE-M02-006
- Competency: trust-impact judgment (synthesis) | Tag: Standard | Difficulty: Synthesis
- Q: Which scenario represents a genuine trust/consent problem, as opposed to a minor, low-impact deviation from the usual ritual?
- A) The spa is out of the client's preferred tea flavor, so water is offered instead.
- B) The technician skips explaining what's about to happen and touches the client's shoulder without asking first, because the client has been in before.
- C) The technician offers a slightly different scent lineup than usual due to a supply issue.
- D) The client is offered a cape instead of a robe because that's what's available that day.
- Correct: B
- Rationale: This is a genuine consent violation (touch without asking, assuming implied consent from a prior visit) — the high-impact category the module explicitly distinguishes from ordinary ritual variation.
- Why others wrong: A, C, and D are all minor ritual substitutions with no consent or privacy impact.
- Source: Module 2, "Applied decisions"
- Randomization: eligible

## Module 3 questions (7)

### HS-FE-M03-001
- Competency: scalp layer anatomy | Tag: Standard | Difficulty: Foundational
- Q: Using the SCALP acronym taught in this course, what is the correct order of the five anatomical scalp layers from the outside in?
- A) Skin, Pericranium, Loose areolar tissue, Aponeurosis, dense Connective tissue
- B) Skin, dense Connective tissue, galea Aponeurotica, Loose areolar tissue, Pericranium
- C) dense Connective tissue, Skin, Aponeurosis, Pericranium, Loose areolar tissue
- D) Skin, Loose areolar tissue, dense Connective tissue, Aponeurosis, Pericranium
- Correct: B
- Rationale: This is the exact SCALP order taught in Module 3.
- Why others wrong: A, C, and D all scramble the correct order.
- Source: Module 3, "Core competencies"
- Randomization: fixed order (sequencing question — do not shuffle beyond the four full-sequence options)

### HS-FE-M03-002
- Competency: hair shaft vs. follicle | Tag: Standard | Difficulty: Applied
- Q: Why is it inaccurate to say a head spa service "treats" the hair follicle directly?
- A) Because the follicle doesn't actually exist beneath the scalp surface.
- B) Because the follicle is living tissue, while a head spa cosmetically addresses the hair shaft, which is nonliving.
- C) Because head spa services only affect the outermost skin layer.
- D) Because the follicle is located too deep for any product to reach.
- Correct: B
- Rationale: This is the exact distinction taught — the hair shaft (nonliving, cosmetically addressable) vs. the follicle (a living structure).
- Why others wrong: A is false — the follicle exists. C and D are not the reasoning the module teaches and overstate/misstate the mechanism.
- Source: Module 3, "Core competencies"
- Randomization: eligible

### HS-FE-M03-003
- Competency: shedding timeline reasoning | Tag: Critical-Domain Evidence [D1] | Difficulty: Applied
- Q: A client reports sudden, heavier-than-usual diffuse shedding. She mentions she had a high fever about two months ago. How should a technician reason about this timing?
- A) The fever is unlikely to be relevant since it happened before the shedding started.
- B) A physiological event like a high fever can trigger diffuse shedding that becomes visible weeks to months later — the earlier event may be the more relevant one.
- C) Only events in the last two weeks are relevant to current shedding.
- D) Shedding always begins immediately after a triggering event, so the fever is unrelated.
- Correct: B
- Rationale: This is the core timeline-reasoning skill Module 3 teaches — a delay between a trigger and visible shedding is expected, not a sign the event is irrelevant.
- Why others wrong: A, C, and D all get the timeline backwards or wrong, the exact reversed-causality error the module corrects.
- Source: Module 3, `cp1`
- Randomization: eligible

### HS-FE-M03-004
- Competency: barrier function | Tag: Standard | Difficulty: Applied
- Q: What is the actual role of the stratum corneum in scalp health, as taught in this course?
- A) It is a decorative outer layer with no functional role.
- B) It is the skin's principal protective and permeability barrier.
- C) It is a synonym for "hydrolipid film" and functions identically.
- D) It only matters for hair color services, not scalp health.
- Correct: B
- Rationale: The stratum corneum is the actual barrier; "hydrolipid film" is cosmetic shorthand for the surface mixture, not the mechanism itself.
- Why others wrong: A dismisses a functional structure. C incorrectly equates two different concepts. D is unrelated to the taught content.
- Source: Module 3, "Core competencies"
- Randomization: eligible

### HS-FE-M03-005
- Competency: referral triggers (anatomy context) | Tag: Critical-Domain Evidence [D1] | Difficulty: Applied
- Q: Which finding during an anatomy-informed consultation should prompt referral rather than continued cosmetic service?
- A) A client mentions occasional, ordinary daily hair shedding.
- B) A patchy, asymmetric area of hair loss with a smooth, shiny appearance.
- C) A client who recently had a haircut.
- D) Mild, generalized thinning that has been stable for years.
- Correct: B
- Rationale: Patchy, asymmetric, scar-like presentations are explicit referral triggers.
- Why others wrong: A, C, and D describe ordinary or stable presentations that do not require referral.
- Source: Module 3, "Critical competencies"
- Randomization: eligible

### HS-FE-M03-006
- Competency: conservative service adjustment | Tag: Standard | Difficulty: Applied
- Q: A client reports scalp tightness and shows visible flaking after daily use of a strong clarifying shampoo. What is an appropriate first response?
- A) Diagnose the flaking as dandruff and recommend a medicated shampoo.
- B) Consider that the barrier may be disrupted, and choose a conservative adjustment like gentler cleansing and reduced heat.
- C) Increase exfoliation intensity to remove the flakes faster.
- D) Tell the client the shampoo is definitely not related to their symptoms.
- Correct: B
- Rationale: This matches `cp2`'s pass criteria — connecting the product history to possible barrier disruption and choosing a conservative adjustment, without diagnosing.
- Why others wrong: A diagnoses and recommends medicated treatment (out of scope). C worsens a barrier-disrupted presentation. D dismisses a relevant history detail with false certainty.
- Source: Module 3, `cp2`
- Randomization: eligible

### HS-FE-M03-007
- Competency: cross-module integration (synthesis) | Tag: Critical-Domain Evidence [D1] | Difficulty: Synthesis
- Q: A client reports diffuse shedding that began about three months after a major illness, and separately asks the technician to confirm she has "telogen effluvium" because she read about it online. What is the single best combined response?
- A) Confirm the diagnosis, since the timing fits the pattern well.
- B) Explain that the timing is compatible with a delayed shedding pattern, without confirming any specific diagnosis, and note that persistent or worsening shedding should be evaluated by a medical professional.
- C) Tell her the timing doesn't matter and any diagnosis question is inappropriate to discuss at all.
- D) Avoid discussing the timing since only a doctor can discuss hair-cycle timing with a client.
- Correct: B
- Rationale: This combines the timeline-reasoning skill with the observation-vs-diagnosis boundary — the technician can discuss timing in general, educational terms without confirming a specific named condition.
- Why others wrong: A confirms a diagnosis. C and D unnecessarily refuse to engage with an educational conversation the technician is equipped to have.
- Source: Module 3, `cp1` + Module 1 observation/diagnosis boundary
- Randomization: eligible

## Module 4 questions (9)

### HS-FE-M04-001
- Competency: tool vs. clinical device | Tag: Standard | Difficulty: Foundational
- Q: How should a head spa scalp camera be described to a client?
- A) As a diagnostic medical device.
- B) As a magnification/observation tool for customizing the service, not a diagnostic device.
- C) As a replacement for a dermatologist visit.
- D) As a device that measures scalp health on a certified scale.
- Correct: B
- Rationale: This is the approved live-view framing — customization support, not diagnosis.
- Why others wrong: A, C, and D all overstate the device's clinical authority.
- Source: Module 4, "Core competencies"
- Randomization: eligible

### HS-FE-M04-002
- Competency: five-point scan sequence | Tag: Standard | Difficulty: Foundational
- Q: What is the correct order of AIMT's five-point scalp scan?
- A) Crown, frontal hairline, occipital, temporal, top parting
- B) Frontal hairline, top parting, crown/vertex, temporal, occipital/back
- C) Occipital, crown, frontal hairline, temporal, top parting
- D) Top parting, temporal, frontal hairline, crown, occipital
- Correct: B
- Rationale: This is the exact taught sequence.
- Why others wrong: A, C, and D all scramble the order.
- Source: Module 4, "Sequence/process competencies"
- Randomization: fixed order (sequencing question)

### HS-FE-M04-003
- Competency: stop-and-refer regardless of comfort | Tag: Critical-Domain Evidence [D2] | Difficulty: Applied
- Q: During a scan, a technician observes an area with visible fluid and crusting. The client says it doesn't bother them and asks to continue. What should the technician do?
- A) Continue, since the client isn't reporting discomfort.
- B) Stop using the device on the area, do not continue the cosmetic service over it, and explain that it needs medical evaluation.
- C) Gently massage around the area to avoid direct contact, but continue the rest of the service as planned.
- D) Apply a soothing product to the area before continuing.
- Correct: B
- Rationale: Client comfort or lack of pain never overrides a visible stop-and-refer finding — this is one of the module's most safety-critical rules.
- Why others wrong: A, C, and D all continue treatment in some form over a finding that requires stopping.
- Source: Module 4, `m4cp2`
- Randomization: eligible

### HS-FE-M04-004
- Competency: image artifact recognition | Tag: Standard | Difficulty: Applied
- Q: A technician presses the scalp camera firmly against the scalp to get a clearer image, and the area appears reddened in the photo. What is the most likely explanation?
- A) This confirms an inflammatory scalp condition.
- B) The pressure itself may be creating a false appearance (blanching/redness), not revealing a genuine finding.
- C) This proves the client has sensitive skin.
- D) The device malfunctioned.
- Correct: B
- Rationale: Excess device pressure is an explicitly named artifact that manufactures false findings.
- Why others wrong: A and C draw unsupported clinical conclusions from an artifact. D is not the taught explanation.
- Source: Module 4, "Core competencies"
- Randomization: eligible

### HS-FE-M04-005
- Competency: Supported observation vs. Unsupported conclusion | Tag: Standard | Difficulty: Applied
- Q: Which of the following is a "Supported observation" rather than an "Unsupported conclusion"?
- A) "This client has clogged follicles from not washing enough."
- B) "There is diffuse shine and visible yellow-white material at the crown."
- C) "This is seborrheic dermatitis."
- D) "This client's scalp is congested."
- Correct: B
- Rationale: This describes only what is visible, without assigning cause or naming a condition.
- Why others wrong: A, C, and D all assign an unsupported cause or diagnosis rather than describing what's visible.
- Source: Module 4, "Core competencies"
- Randomization: eligible

### HS-FE-M04-006
- Competency: image consent tiers | Tag: Critical-Domain Evidence [D3] | Difficulty: Applied
- Q: A technician wants to save a client's scalp image for the client's file, and separately wonders if it could be used in a training presentation later. What is required?
- A) One consent covers all uses, since the client already agreed to the live viewing.
- B) Saving for the client record and using the image for training/marketing each require their own separate permission, distinct from consent to view live.
- C) No consent is needed since it's for internal business purposes.
- D) Verbal consent for viewing automatically implies consent to save and reuse the image.
- Correct: B
- Rationale: Live viewing, saving, and marketing/teaching use are three separate consent tiers.
- Why others wrong: A, C, and D all collapse the tiers into one blanket permission, which is incorrect.
- Source: Module 4, "Core competencies"
- Randomization: eligible

### HS-FE-M04-007
- Competency: device hygiene | Tag: Critical-Domain Evidence [D4] | Difficulty: Applied
- Q: A scalp camera contacts an area of broken skin during a scan. What should happen next?
- A) Wipe it with a standard surface wipe and continue using it on the next client.
- B) Remove the device from service and reprocess it per the manufacturer's disinfection instructions before further use.
- C) Continue using it for the rest of this client's service only, then clean it at the end of the day.
- D) No special action is needed since scalp cameras are self-sanitizing.
- Correct: B
- Rationale: Contact with compromised skin requires removing the device from service and following manufacturer-directed reprocessing.
- Why others wrong: A, C, and D all under-respond to a cross-contamination risk.
- Source: Module 4, "Critical competencies"
- Randomization: eligible

### HS-FE-M04-008
- Competency: appearance labels as descriptive, not diagnostic | Tag: Standard | Difficulty: Applied
- Q: How should the five approved "appearance-example" labels (such as "oil-dominant appearance") be used?
- A) As permanent diagnostic categories assigned to each client.
- B) As descriptive teaching labels for a specific observation, understanding a client may show more than one appearance across different areas.
- C) As medical terms equivalent to a dermatological diagnosis.
- D) As a fixed scalp "type" the client keeps for future visits.
- Correct: B
- Rationale: These are explicitly descriptive labels, not diagnoses or permanent identities.
- Why others wrong: A, C, and D all treat the labels as fixed/diagnostic, which the module explicitly rejects.
- Source: Module 4, "Core competencies"
- Randomization: eligible

### HS-FE-M04-009
- Competency: cross-module synthesis (Module 4→5) | Tag: Critical-Domain Evidence [D1] | Difficulty: Synthesis
- Q: A five-point scan finds diffuse shine and follicular material at the crown, with fine dry-appearing scale at the temples. The client reports no pain or sensitivity anywhere. What is the correct combined next step?
- A) Apply one uniform whole-scalp treatment based on the crown finding, since it's the most visible.
- B) Document both regional findings accurately, avoid assigning a cause to either, and plan a regionally differentiated service response.
- C) Diagnose the crown area as oily and the temples as dry, and treat accordingly.
- D) Since there's no reported pain, no further consideration is needed — proceed with the client's preferred product.
- Correct: B
- Rationale: This combines Module 4's documentation discipline with Module 5's regional, non-uniform service adaptation — treating the two regions as distinct without assigning a diagnosis to either.
- Why others wrong: A applies a uniform response the course explicitly warns against. C names diagnoses the assessment cannot support. D ignores the regional finding entirely.
- Source: Module 4 + Module 5 cross-module link
- Randomization: eligible

## Module 5 questions (8)

### HS-FE-M05-001
- Competency: service directions are not diagnoses | Tag: Standard | Difficulty: Foundational
- Q: What is the correct way to think about the five "service direction" patterns taught in Module 5 (e.g., "oil-dominant or residue-present presentation")?
- A) They are medical diagnoses the technician assigns to the client.
- B) They are non-diagnostic descriptions of a current presentation used to guide today's service, not permanent labels.
- C) They replace the need for any consultation questions.
- D) Each client fits exactly one pattern permanently.
- Correct: B
- Rationale: The module explicitly frames these as current-presentation guides, not diagnoses or permanent identities — and a client may show more than one pattern in one visit.
- Why others wrong: A misrepresents them as diagnoses. C and D both overstate their fixedness/sufficiency.
- Source: Module 5, "Core competencies"
- Randomization: eligible

### HS-FE-M05-002
- Competency: five-step decision-priority order | Tag: Standard | Difficulty: Applied
- Q: What is the first factor a technician should weigh when deciding how to adapt a service, according to Module 5's decision-priority order?
- A) Client preference and maintenance goal
- B) Visible cosmetic need
- C) Safety limit
- D) Surface tolerance
- Correct: C
- Rationale: The five-step order is safety limit → client comfort/reactivity → surface tolerance → visible cosmetic need → client preference, in that fixed order.
- Why others wrong: A, B, and D are all later factors in the correct order, not the first.
- Source: Module 5, "Core competencies"
- Randomization: eligible

### HS-FE-M05-003
- Competency: safety outranks client request | Tag: Critical-Domain Evidence [D2] | Difficulty: Applied
- Q: A client with a reactive-appearing area and reported stinging insists on the strongest exfoliation and highest steam setting available. What should the technician do?
- A) Provide what the client requested, since they consented to it.
- B) Explain that the requested intensity isn't appropriate today given what's observed and reported, and offer a gentler, compatible alternative or pause the service.
- C) Perform half the requested intensity as a compromise.
- D) Proceed as requested, but document that the client insisted.
- Correct: B
- Rationale: A client's request or consent does not authorize an unsafe intensity level — the safety limit and reactivity outrank preference.
- Why others wrong: A and C still deliver an inappropriate intensity in some form. D proceeds with an unsafe service and treats documentation as sufficient mitigation, which it is not.
- Source: Module 5, `m5cp2`
- Randomization: eligible

### HS-FE-M05-004
- Competency: exfoliation is not automatic | Tag: Critical-Domain Evidence [D2] | Difficulty: Applied
- Q: A technician observes visible scale during assessment. What does this alone indicate about whether to exfoliate?
- A) Visible scale is automatic permission to exfoliate.
- B) Visible scale alone does not automatically justify exfoliation — the technician must also weigh reactivity, sensitivity, and other findings.
- C) Scale should always be aggressively removed regardless of other findings.
- D) Scale means the service should be stopped entirely.
- Correct: B
- Rationale: "Visible scale is not automatic permission to exfoliate" is an explicit, repeated principle in Module 5.
- Why others wrong: A and C treat scale as sufficient justification on its own. D overreacts — scale alone is not a stop/refer trigger.
- Source: Module 5, "Important distinctions"
- Randomization: eligible

### HS-FE-M05-005
- Competency: regional vs. whole-scalp response | Tag: Standard | Difficulty: Applied
- Q: A crown shows a strong, dramatic presentation while the rest of the scalp appears calm and baseline. What is the correct service approach?
- A) Apply the crown's intensity level to the entire scalp for consistency.
- B) Respond to the crown regionally, without extending its intensity to unrelated, calmer areas.
- C) Skip the crown area entirely to avoid drawing attention to it.
- D) Treat the whole scalp at the lowest intensity to be safe.
- Correct: B
- Rationale: A regional, targeted response avoiding whole-scalp overcorrection based on the most dramatic single region is the module's core lesson.
- Why others wrong: A overcorrects unrelated areas. C avoids a legitimate finding. D under-serves the calm areas' actual needs.
- Source: Module 5, "Applied decisions"
- Randomization: eligible

### HS-FE-M05-006
- Competency: stop/pause/refer vs. modify | Tag: Critical-Domain Evidence [D2] | Difficulty: Applied
- Q: During service, a technician notices an area of moist, broken skin that wasn't visible during the initial assessment. What is the correct response?
- A) Avoid the spot but continue the rest of the service as planned.
- B) Clean the area gently and proceed.
- C) Stop contact with the area, pause the service as needed, and refer for medical evaluation.
- D) Apply a lower-intensity product to the area and continue.
- Correct: C
- Rationale: Broken/moist skin is a stop-and-refer trigger, not a modify-and-continue situation.
- Why others wrong: A, B, and D all continue some form of service delivery over a finding that requires stopping.
- Source: Module 5, "Applied decisions"
- Randomization: eligible

### HS-FE-M05-007
- Competency: product selection reasoning | Tag: Standard | Difficulty: Applied
- Q: What is the correct basis for selecting a product category during a service?
- A) The technician's personal favorite product.
- B) The specific service need identified during assessment, matched to a compatible product category.
- C) Whichever product is most expensive, to justify the price.
- D) Whatever the client used last time, regardless of today's findings.
- Correct: B
- Rationale: Product selection should follow the identified need, not start from a favorite ingredient or default to habit.
- Why others wrong: A, C, and D are all need-independent selection criteria the module explicitly rejects.
- Source: Module 5, "Core competencies"
- Randomization: eligible

### HS-FE-M05-008
- Competency: cross-module synthesis (Module 4/5) | Tag: Critical-Domain Evidence [D2] | Difficulty: Synthesis
- Q: A client's assessment (Module 4 discipline) finds a reactive-appearing area with reported tenderness. The client then asks for the deepest, strongest version of the service (a Module 5 request scenario). What single response correctly integrates both modules' teaching?
- A) Perform the full assessment findings review, then simply comply with the stronger request since the client was informed of the finding.
- B) Acknowledge the client's goal, explain that the tenderness and reactive appearance mean a lower-intensity approach is appropriate today, and offer a gentler compatible plan or pause if needed.
- C) Downplay the reactive finding so the client doesn't feel disappointed, and proceed as requested.
- D) Cancel the appointment entirely rather than address the conflict.
- Correct: B
- Rationale: This combines observation discipline with the safety-outranks-preference rule and appropriate client communication — the intended integration of Modules 4 and 5.
- Why others wrong: A still complies with an inappropriate intensity. C conceals a real finding from the client. D is an overreaction not supported by the finding described.
- Source: Module 4 + Module 5 cross-module link
- Randomization: eligible

## Module 6 questions (8)

### HS-FE-M06-001
- Competency: dry scalp vs. dandruff-spectrum | Tag: Standard | Difficulty: Foundational
- Q: What is the correct way to distinguish a dry-scalp presentation from a dandruff-spectrum presentation?
- A) By a single cue, such as whether any flaking is present.
- B) By combining multiple observable cues together — flake color, size, oiliness, redness, and distribution.
- C) By asking the client which one they think it is.
- D) Dry scalp and dandruff cannot be distinguished without a lab test.
- Correct: B
- Rationale: The module explicitly teaches combining multiple cues, never relying on one in isolation.
- Why others wrong: A oversimplifies to one cue. C substitutes client guesswork for professional observation. D overstates the limitation — informed distinction is possible cosmetically, even though certainty is not.
- Source: Module 6, "Core competencies"
- Randomization: eligible

### HS-FE-M06-002
- Competency: ketoconazole concentration line | Tag: Critical-Domain Evidence [D1] | Difficulty: Applied
- Q: Which statement about ketoconazole is correct for a head spa technician to know and apply?
- A) Both 1% and 2% strength are OTC and may be recommended.
- B) Only 1% strength is OTC; 2% is prescription-only and should never be referenced to a client.
- C) 2% strength is stronger and therefore the better recommendation for stubborn cases.
- D) Concentration doesn't matter — the ingredient name is what determines OTC status.
- Correct: B
- Rationale: This is the exact, explicit concentration-based OTC/Rx line taught — only 1% may ever be referenced.
- Why others wrong: A and C incorrectly treat 2% as available/appropriate to recommend. D incorrectly claims concentration is irrelevant, when concentration is precisely what determines the OTC/Rx line.
- Source: Module 6, "Core competencies"
- Randomization: eligible

### HS-FE-M06-003
- Competency: referral criteria | Tag: Critical-Domain Evidence [D1] | Difficulty: Applied
- Q: Which of the following meets the module's referral criteria for a dandruff-spectrum presentation?
- A) Mild flaking limited to the scalp, with no redness.
- B) Flaking that responds well to a simplified routine.
- C) Redness and flaking that has spread to the eyebrows and hairline.
- D) A client asking general questions about dandruff causes.
- Correct: C
- Rationale: Spread beyond the scalp margin with active redness is an explicit referral trigger.
- Why others wrong: A, B, and D all describe ordinary, non-urgent situations that don't meet the referral bar.
- Source: Module 6, "Critical competencies"
- Randomization: eligible

### HS-FE-M06-004
- Competency: wrong product cycle | Tag: Standard | Difficulty: Applied
- Q: A client has been using an increasingly strong anti-dandruff shampoo for months, and her dry, flaky presentation keeps getting worse. What is happening, according to the "wrong product cycle" taught in this module?
- A) The product simply needs more time to work.
- B) The wrong product (anti-fungal/anti-dandruff) may be stripping an already dry/barrier-compromised scalp, causing escalating worsening rather than improvement.
- C) The client's scalp is becoming resistant to the active ingredient.
- D) This pattern always indicates an underlying medical disorder requiring immediate referral regardless of severity.
- Correct: B
- Rationale: This is the exact mechanism taught — a mismatched product stripping and worsening a dry presentation, prompting further (wrong) escalation.
- Why others wrong: A dismisses a worsening pattern. C is not a taught mechanism. D overstates urgency without regard to actual severity, which the module explicitly cautions against.
- Source: Module 6, "Core competencies"
- Randomization: eligible

### HS-FE-M06-005
- Competency: reassessing before escalating | Tag: Critical-Domain Evidence [D2] | Difficulty: Applied
- Q: A client keeps escalating to stronger anti-dandruff products on an increasingly reactive, dry-appearing scalp. What is the correct next step?
- A) Recommend an even stronger anti-fungal product.
- B) Reassess the actual presentation before choosing any product direction — it may be dry-scalp, not dandruff, and needs a different response.
- C) Add an exfoliation step to speed up flake removal.
- D) Tell the client to stop washing her hair for a week.
- Correct: B
- Rationale: This is the module's explicit "reassess before escalating" correction — the presentation may have been mislabeled from the start.
- Why others wrong: A and C both continue or worsen an inappropriate treatment direction. D is not supported guidance.
- Source: Module 6, "Applied decisions"
- Randomization: eligible

### HS-FE-M06-006
- Competency: mild-to-more-involved continuum | Tag: Standard | Difficulty: Applied
- Q: How should a technician think about dandruff and seborrheic dermatitis, per this module?
- A) As two completely unrelated conditions.
- B) As one spectrum, ranging from mild to more involved, based on extent, redness, scale thickness, and spread.
- C) As the same condition with different names used interchangeably.
- D) As conditions that can only be told apart with lab testing, making cosmetic assessment useless.
- Correct: B
- Rationale: This is the exact spectrum framing taught in Module 6.
- Why others wrong: A treats them as unrelated, which is incorrect. C conflates two distinct points on a spectrum. D overstates the limitation of cosmetic observation.
- Source: Module 6, "Core competencies"
- Randomization: eligible

### HS-FE-M06-007
- Competency: evidence strength for triggers | Tag: Standard | Difficulty: Applied
- Q: Which trigger/contributing factor has the strongest evidence for an association with dandruff-spectrum flares, according to this course?
- A) A specific numeric relationship between temperature and oil production.
- B) Stress and hormonal shifts, associated with flares via combined immune/inflammatory and oil-production changes.
- C) Diet, which has strong, well-established evidence.
- D) Heat and humidity, following a precise percentage-per-degree rule.
- Correct: B
- Rationale: Stress/hormonal shifts have real documented flare-association; diet is comparatively weak evidence; the numeric heat/humidity claim was removed as unsupported.
- Why others wrong: A and D reference a removed, unsupported numeric claim. C overstates diet's evidence strength.
- Source: Module 6, "Core competencies"
- Randomization: eligible

### HS-FE-M06-008
- Competency: cross-module synthesis (Modules 4-6) | Tag: Critical-Domain Evidence [D1] | Difficulty: Synthesis
- Q: An assessment shows yellowish, clumped flakes near the follicle with visible oiliness and mild redness at the crown (Module 4 observation), and the client reports the pattern has spread to her eyebrows (a Module 6 referral trigger). What is the single correct combined action?
- A) Recommend a 2% ketoconazole shampoo since the presentation looks more involved.
- B) Document the observation without diagnosing, recognize the spread as a referral-relevant finding, and recommend she see a medical professional before continuing scalp-focused treatment in that area.
- C) Proceed with the strongest available OTC anti-dandruff treatment immediately.
- D) Since it's "only" flaking, continue the service as normal with no changes.
- Correct: B
- Rationale: This combines Module 4's non-diagnostic documentation with Module 6's referral criteria — spread with redness is an explicit trigger requiring a scope/referral decision.
- Why others wrong: A recommends a prescription-only product. C escalates treatment instead of referring. D ignores an explicit referral trigger.
- Source: Module 4 + Module 6 cross-module link
- Randomization: eligible

## Module 7 questions (7)

### HS-FE-M07-001
- Competency: requirement vs. preference in bed evaluation | Tag: Standard | Difficulty: Foundational
- Q: Which of the following is a functional requirement when evaluating a treatment bed, not a matter of personal preference?
- A) Armrest configuration.
- B) Overall aesthetic style.
- C) Sanitation-compatible surfaces.
- D) Available color options.
- Correct: C
- Rationale: Sanitation compatibility is one of the required, function-based categories; armrests are explicitly labeled a preference.
- Why others wrong: A, B, and D are all preference/aesthetic considerations, not requirements.
- Source: Module 7, "Core competencies"
- Randomization: eligible

### HS-FE-M07-002
- Competency: reach-zone cart arrangement | Tag: Standard | Difficulty: Applied
- Q: Where should a product dish used constantly throughout the service be placed on the cart?
- A) In the reserve/off-surface zone.
- B) In the golden/within-reach zone.
- C) Anywhere, since exact placement doesn't matter for near-constant-use items.
- D) In the one-step zone, to save space near the practitioner.
- Correct: B
- Rationale: Near-constant-use items belong in the golden/within-reach zone, requiring no step to access.
- Why others wrong: A and D place a high-frequency item too far away. C dismisses a deliberate, function-based arrangement principle.
- Source: Module 7, "Core competencies"
- Randomization: eligible

### HS-FE-M07-003
- Competency: prep-sequence logic | Tag: Standard | Difficulty: Applied
- Q: Why does station-prep order matter — specifically, why should sanitation/structural setup happen before ambient/comfort elements?
- A) It doesn't matter — any order works equally well.
- B) Building comfort/ambient elements around a not-yet-sanitized system creates avoidable rework, and client-facing elements should be ready before the client enters.
- C) Ambient elements should always go first to create a good first impression.
- D) Sanitation should happen last, right before the client arrives, to keep it freshest.
- Correct: B
- Rationale: This is the exact dependency logic taught — sanitation/structure first avoids rework, and client-facing elements must be ready before arrival.
- Why others wrong: A dismisses a real dependency. C and D both invert the correct order.
- Source: Module 7, `m7cp1`
- Randomization: eligible

### HS-FE-M07-004
- Competency: ordinary discomfort vs. medical emergency | Tag: Critical-Domain Evidence [D2] | Difficulty: Applied
- Q: A client reports mild neck strain and shifts to lift her chin during the halo rinse. What should the technician do?
- A) Continue the service unchanged, since mild strain is normal.
- B) Stop, adjust her positioning (e.g., shoulder position, occipital support), communicate the change, and resume once she confirms comfort.
- C) Immediately treat this as a medical emergency and stop the appointment entirely.
- D) Tell the client to try to relax and hold the original position.
- Correct: B
- Rationale: Ordinary discomfort signals call for a positioning fix using the stop→adjust→communicate→resume sequence, not dismissal or emergency escalation.
- Why others wrong: A ignores a real discomfort signal. C overreacts to an ordinary (non-emergency) signal. D pushes through discomfort instead of adjusting.
- Source: Module 7, `m7cp2`
- Randomization: eligible

### HS-FE-M07-005
- Competency: medical-emergency escalation | Tag: Critical-Domain Evidence [D2] | Difficulty: Applied
- Q: Mid-service, a client suddenly reports dizziness, blurred vision, and slightly slurred speech. What is the correct response?
- A) Adjust her neck position and continue cautiously.
- B) Stop the service immediately and treat this as a medical concern, not a positioning issue.
- C) Offer her water and continue at a slower pace.
- D) Ask her to describe the dizziness in more detail before deciding what to do.
- Correct: B
- Rationale: Dizziness, visual changes, and slurred speech are explicit medical-emergency signals requiring an immediate stop — this is not a positioning fix.
- Why others wrong: A, C, and D all treat a medical-emergency signal as an ordinary discomfort issue, delaying appropriate action.
- Source: Module 7, "Critical competencies"
- Randomization: eligible

### HS-FE-M07-006
- Competency: sanitation bin separation | Tag: Critical-Domain Evidence [D4] | Difficulty: Applied
- Q: What is the correct practice for clean and dirty sanitation bins during a live service day?
- A) They can be combined temporarily if the station is busy.
- B) They must remain separated throughout the day, not just during initial setup.
- C) Only the dirty bin needs to be clearly labeled.
- D) Bins only need to be separated between different clients, not during a single service.
- Correct: B
- Rationale: The "never mix" clean/dirty bin rule is an ongoing, live-service practice, not a one-time setup step.
- Why others wrong: A allows exactly the mixing the rule prohibits. C and D both understate the requirement.
- Source: Module 7, "Critical competencies"
- Randomization: eligible

### HS-FE-M07-007
- Competency: cross-module synthesis (Module 1/7 stop-and-refer vs. stop-and-adjust) | Tag: Critical-Domain Evidence [D2] | Difficulty: Synthesis
- Q: A client reports discomfort mid-service. In deciding how to respond, what is the correct way to distinguish a Module 7 positioning-adjustment situation from a Module 1 scope/referral situation?
- A) Any reported discomfort should always be treated as a referral situation, to be safe.
- B) Ordinary strain/discomfort signals call for a positioning adjustment (stop→adjust→communicate→resume); signals suggesting a medical concern (e.g., dizziness, visual changes, slurred speech, or a finding matching Module 1's referral criteria) call for stopping and referring instead.
- C) Positioning adjustments and referrals are the same response, just worded differently.
- D) Only the client can decide whether the situation needs a referral.
- Correct: B
- Rationale: This is the correct generalization across Modules 1 and 7 — both teach "some signals mean stop everything," but the specific signal determines whether the right response is a positioning fix or a referral.
- Why others wrong: A over-escalates every discomfort report. C conflates two genuinely different responses. D incorrectly hands the clinical judgment call to the client.
- Source: Module 1 + Module 7 cross-module link
- Randomization: eligible

## Module 8 questions (10)

### HS-FE-M08-001
- Competency: Core vs. Extended format | Tag: Standard | Difficulty: Foundational
- Q: How should a technician understand the relationship between the Core (60-minute) and Extended (90-minute) service formats?
- A) Extended is simply the Core service performed more slowly.
- B) Each is its own deliberately designed structure — the Extended format is not just a stretched-out Core format.
- C) Core is the Extended format with steps removed at random.
- D) The two formats use completely unrelated techniques.
- Correct: B
- Rationale: This is the exact "designed around the service, not the clock" principle taught.
- Why others wrong: A and C both treat one as a simple modification of the other. D overstates the difference — they share a common technique foundation.
- Source: Module 8, "Core competencies"
- Randomization: eligible

### HS-FE-M08-002
- Competency: water temperature confirmation | Tag: Critical-Domain Evidence [D2] | Difficulty: Foundational
- Q: How should water temperature be handled during a head spa service?
- A) Estimated based on experience once the technician is skilled enough.
- B) Manually confirmed every time, never guessed.
- C) Set once at the start of the day and left unchecked afterward.
- D) Left to the client to judge and report if it's wrong.
- Correct: B
- Rationale: This is an explicit, preserved safety practice — water temperature is always confirmed, never assumed.
- Why others wrong: A, C, and D all skip an active, required safety check.
- Source: Module 8, "Critical competencies"
- Randomization: eligible

### HS-FE-M08-003
- Competency: adapting, not eliminating, exfoliation | Tag: Standard | Difficulty: Applied
- Q: A technician determines a strong exfoliation approach isn't appropriate for a client today. What is the correct response?
- A) Skip exfoliation entirely, with no further explanation needed.
- B) Modify the product, pressure, technique, or intensity while preserving the service flow, unless there's a genuine safety/scope reason to omit it entirely.
- C) Proceed with the originally planned strong exfoliation anyway, since changing the plan disrupts the flow.
- D) Ask the client to decide whether to skip or continue as planned.
- Correct: B
- Rationale: This matches `m8cp1` — exfoliation is a dial (intensity/method/product/pressure/technique), not a binary switch, and full omission needs a genuine safety/scope reason.
- Why others wrong: A omits without justification. C ignores the technician's own professional judgment. D inappropriately shifts a technical decision onto the client.
- Source: Module 8, `m8cp1`
- Randomization: eligible

### HS-FE-M08-004
- Competency: unsupported claims | Tag: Standard | Difficulty: Applied
- Q: Mid-massage, a client asks what makes this service different from a regular salon shampoo. Which response is appropriate?
- A) "This service specifically stimulates circulation and lymphatic drainage."
- B) "It's a structured, scalp-focused service with intentional pacing, observation-informed technique, and product decisions specific to you."
- C) "It activates your parasympathetic nervous system for deep relaxation."
- D) "The steam and massage help detoxify your scalp."
- Correct: B
- Rationale: This matches `m8cp2`'s approved answer shape — referencing structure, pacing, and personalization without medical/circulation/lymphatic/detox claims.
- Why others wrong: A, C, and D all make unsupported physiological/medical claims the course explicitly prohibits.
- Source: Module 8, `m8cp2`
- Randomization: eligible

### HS-FE-M08-005
- Competency: scope guardrail | Tag: Critical-Domain Evidence [D3] | Difficulty: Applied
- Q: A client requests hand and forearm massage be added mid-service, which wasn't discussed or consented to at intake. What is correct?
- A) Add it immediately since the client requested it.
- B) This should be decided based on scope, training, and consent established at intake — not simply re-opened as an in-the-moment addition.
- C) Certification from this course automatically covers hand/forearm massage regardless of licensure.
- D) Decline automatically, since add-ons are never appropriate mid-service.
- Correct: B
- Rationale: Neck/shoulder/hand/forearm work is scoped to applicable license, training, and consent established at intake — not freely re-opened mid-service.
- Why others wrong: A skips the scope/consent check. C incorrectly claims certification expands licensure. D is an overcorrection — the module doesn't categorically forbid all mid-service additions, it requires the scope/consent check.
- Source: Module 8, "Critical competencies"
- Randomization: eligible

### HS-FE-M08-006
- Competency: communication modes | Tag: Standard | Difficulty: Applied
- Q: According to Module 8, what is the default communication mode during most of the service?
- A) Continuous narration of every step ("micro-teaching").
- B) Quiet by default, with communication reserved for genuine needs like consent, comfort, a real transition, or a client's question.
- C) Silence at all times, with no exceptions.
- D) Conversation driven entirely by the client's preferences with no technician-initiated cues.
- Correct: B
- Rationale: "Explain intentionally, not continuously" — quiet is the default, with three specific communication modes reserved for genuine needs.
- Why others wrong: A is explicitly rejected (mandatory narration). C overstates "quiet" as absolute, ignoring the legitimate need for proactive cues. D omits the technician's proactive role.
- Source: Module 8, "Communication competencies"
- Randomization: eligible

### HS-FE-M08-007
- Competency: pressure consistency | Tag: Standard | Difficulty: Applied
- Q: What does Module 8 teach as the real signal of massage skill to a client?
- A) Using the highest pressure the client can tolerate.
- B) Consistency of pressure, not any specific absolute pressure level.
- C) Constantly varying pressure to keep the client engaged.
- D) Matching pressure exactly to what the client used at a previous spa.
- Correct: B
- Rationale: The module explicitly removed absolute "good pressure/bad pressure" framing in favor of consistency as the real skill signal.
- Why others wrong: A and D treat a specific pressure level as the goal. C contradicts the consistency principle.
- Source: Module 8, "Important distinctions"
- Randomization: eligible

### HS-FE-M08-008
- Competency: closing script (synthesis) | Tag: Standard | Difficulty: Synthesis
- Q: A technician is closing a service. Which closing best matches the approved five-element structure (observation, products/reason, home-care recommendation, checking in)?
- A) "That's it for today! See you next time."
- B) "Today I focused on the dryness at your temples. I used a lightweight hydrating blend because of that. For home care, I'd suggest a gentle sulfate-free shampoo. How are you feeling?"
- C) "You definitely have a dry scalp condition. I recommend a medicated shampoo, and you should come back weekly."
- D) "I did the usual service. Let me know if anything felt off."
- Correct: B
- Rationale: This follows the exact retained closing structure — a specific observation, a reason tied to products used, one home-care recommendation, and a check-in — without diagnosing.
- Why others wrong: A is too generic to meet the structure. C diagnoses a condition and prescribes a frequency, exceeding scope. D lacks the specific, personalized elements required.
- Source: Module 8, "Communication competencies"
- Randomization: eligible

### HS-FE-M08-009
- Competency: sensory framing without claims (synthesis) | Tag: Standard | Difficulty: Synthesis
- Q: Just before the cooling-spray moment, how should a technician frame what's about to happen?
- A) "This will boost your circulation and close your hair cuticles for shine."
- B) "This is a temperature contrast — it may feel startling for a second, then very good. It's a moment a lot of clients remember."
- C) Say nothing and let the client be surprised.
- D) "This step detoxifies your scalp using cold therapy."
- Correct: B
- Rationale: This is the approved honest sensory framing — describing the experience without an unsupported circulatory/cuticle/detox claim.
- Why others wrong: A and D both make unsupported physiological claims. C skips a legitimate communication cue moment (introducing an unfamiliar sensation), which the module requires.
- Source: Module 8, "Communication competencies"
- Randomization: eligible

### HS-FE-M08-010
- Competency: cross-module synthesis (Module 8/9 handoff) | Tag: Standard | Difficulty: Synthesis
- Q: A service concludes with the approved closing script. The client then says, "I loved it, but I probably won't come back that often." What is the best combined Module 8/9 response?
- A) Push a specific rebooking frequency to try to lock in a return visit.
- B) Accept her stated preference, help her choose whichever future option (if any) fits her goals and schedule, and complete checkout smoothly regardless of whether she rebooks.
- C) Express disappointment to encourage her to reconsider.
- D) Skip the rest of the closing structure since she's already indicated she may not return.
- Correct: B
- Rationale: This combines Module 8's closing structure with Module 9's rebooking framing — future options are offered without pressure, and the closing must work cleanly even when a client declines.
- Why others wrong: A applies pressure the module explicitly rejects. C uses guilt to influence the client. D abandons a required part of the closing structure.
- Source: Module 8 + Module 9 cross-module link
- Randomization: eligible

## Module 9 questions (6)

### HS-FE-M09-001
- Competency: margin vs. markup | Tag: Standard | Difficulty: Foundational
- Q: A service costs $100 to deliver. Using a 30% markup vs. a 30% margin, which statement is correct?
- A) Both produce the same $130 price.
- B) A 30% markup produces $130; a 30% margin produces a different price, about $143.
- C) Margin is always lower than markup at the same percentage.
- D) Margin and markup are two names for the same calculation.
- Correct: B
- Rationale: Markup is calculated from cost ($100 × 1.30 = $130); margin is calculated from price (price = cost / (1 - margin) ≈ $143). They are mathematically distinct.
- Why others wrong: A, C, and D all incorrectly treat margin and markup as equivalent or predictably ordered.
- Source: Module 9, "Core competencies"
- Randomization: eligible

### HS-FE-M09-002
- Competency: four cost components | Tag: Standard | Difficulty: Applied
- Q: Which of the following is part of a complete cost picture for pricing a service, beyond just product cost?
- A) Only the direct product cost.
- B) Direct/variable costs, allocated overhead, the practitioner's full time (not just treatment time), and a deliberately chosen margin.
- C) Whatever a competitor happens to charge.
- D) Only treatment time, since setup and cleanup don't count.
- Correct: B
- Rationale: This is the module's complete four-component cost model.
- Why others wrong: A and D both omit required components. C substitutes competitor pricing for actual cost accounting, which the module rejects as a formula.
- Source: Module 9, "Core competencies"
- Randomization: eligible

### HS-FE-M09-003
- Competency: enhancement recommendation safety guardrail | Tag: Critical-Domain Evidence [D2] | Difficulty: Applied
- Q: At checkout, a technician considers recommending a scalp-treatment enhancement, but earlier in the service a genuine safety-related finding suggested caution in that same area. What should happen?
- A) Recommend the enhancement anyway, since it could increase revenue.
- B) The safety finding takes priority — the enhancement should not be recommended if it conflicts with that earlier judgment.
- C) Ask the client to decide, since it's ultimately their choice.
- D) Recommend a different enhancement instead, to avoid losing the sale entirely.
- Correct: B
- Rationale: "Restraint wins over the sale" — an enhancement recommendation must never override a genuine safety reason established earlier in the service.
- Why others wrong: A and D both still push some enhancement despite the safety concern. C inappropriately shifts a professional judgment call onto the client.
- Source: Module 9, "Critical competencies"
- Randomization: eligible

### HS-FE-M09-004
- Competency: price-feedback response (in-the-moment) | Tag: Standard | Difficulty: Applied
- Q: A client says, "I loved the service, but the price felt high." What is the best in-the-moment response?
- A) Immediately offer a discount to resolve the tension.
- B) Acknowledge the feedback calmly, avoid arguing about value, and answer any genuine question the client has.
- C) Explain in detail why the price is justified until the client agrees.
- D) Say nothing and move on, since the comment doesn't require a response.
- Correct: B
- Rationale: This matches the approved in-the-moment model — acknowledge, stay calm, don't discount reflexively, don't lecture, answer genuine questions.
- Why others wrong: A reflexively discounts. C lectures the client on value. D fails to acknowledge legitimate feedback.
- Source: Module 9, `m10cp2` (internal ID)
- Randomization: eligible

### HS-FE-M09-005
- Competency: causes of underpricing | Tag: Standard | Difficulty: Applied
- Q: A practitioner discovers their prices are consistently below market and below their real costs. What does this course teach about likely causes?
- A) It's almost always because the practitioner lacks confidence.
- B) It could stem from several different causes — incomplete cost data, poor overhead allocation, inaccurate time assumptions, competitor copying, or an intentional strategy, among others.
- C) Underpricing is never a real problem as long as clients are happy.
- D) The only fix is to immediately raise all prices by a fixed percentage.
- Correct: B
- Rationale: The module explicitly names multiple possible causes, with fear/confidence as only one among several — not the default explanation.
- Why others wrong: A singles out one cause as the default. C dismisses a real business problem. D prescribes an arbitrary fix without diagnosing the actual cause.
- Source: Module 9, "Core competencies"
- Randomization: eligible

### HS-FE-M09-006
- Competency: cross-module synthesis (Module 8 scope + Module 9 pricing) | Tag: Critical-Domain Evidence [D3] | Difficulty: Synthesis
- Q: A client received Extended-format service including shoulder work performed within the technician's scope and the client's intake consent. At checkout, the technician considers offering a hand-massage add-on for a future visit. What is the correct combined consideration?
- A) Since shoulder work was already approved at intake, hand massage can be added automatically to any future visit without reconfirming.
- B) Any future add-on involving hands-on scope-sensitive work should still be confirmed against the technician's scope, training, and the client's consent at that future visit's intake — prior approval for a different service doesn't carry forward automatically.
- C) Since the client enjoyed the service, all future enhancement offers should be treated as pre-approved.
- D) Enhancement offers should never include any service involving direct client contact.
- Correct: B
- Rationale: This combines Module 8's scope/consent-at-intake principle with Module 9's enhancement-fit judgment — each service and visit requires its own scope/consent check, not a carryover assumption.
- Why others wrong: A and C both incorrectly assume consent transfers automatically. D overstates the restriction — direct-contact enhancements are not categorically excluded, they require their own scope/consent check.
- Source: Module 8 + Module 9 cross-module link
- Randomization: eligible

## Module 10 questions (8)

### HS-FE-M10-001
- Competency: clean/disinfect/reset distinctions | Tag: Critical-Domain Evidence [D4] | Difficulty: Foundational
- Q: What is the correct distinction between "cleaning" and "disinfecting" a reusable tool?
- A) They mean the same thing and can be used interchangeably.
- B) Cleaning removes soil/residue/debris; disinfecting is a separate, label-directed process with its own required contact time — cleaning is often a prerequisite to disinfecting, not a substitute for it.
- C) Disinfecting is only needed if the tool looks visibly dirty.
- D) Cleaning is always more thorough than disinfecting.
- Correct: B
- Rationale: This is the exact five-way distinction the module opens with — clean and disinfect are different actions, not interchangeable words.
- Why others wrong: A treats distinct terms as synonyms. C makes disinfection conditional on appearance, which is incorrect. D reverses the actual relationship between the two processes.
- Source: Module 10, "Core competencies"
- Randomization: eligible

### HS-FE-M10-002
- Competency: never shortening required contact time | Tag: Critical-Domain Evidence [D4] | Difficulty: Applied
- Q: The next client has arrived early. A reusable item is still completing its required disinfectant contact time. What is the correct action?
- A) Wipe it dry now since it looks clean, to save time.
- B) Preserve the required contact time — continue other appropriate reset tasks in parallel, use an already-ready alternative if available, or delay the next service if needed.
- C) Skip the remaining contact time just this once, since the client is waiting.
- D) Grab a different tool that hasn't been processed yet, since it's faster.
- Correct: B
- Rationale: This is the exact Reset Under Pressure correct response — the required process time is never shortened for schedule pressure.
- Why others wrong: A and C both shorten a required safety process. D substitutes an unprocessed item, creating a different infection-control risk.
- Source: Module 10, "Applied decisions"
- Randomization: eligible

### HS-FE-M10-003
- Competency: item-to-process categorization | Tag: Critical-Domain Evidence [D4] | Difficulty: Applied
- Q: How should used linens be handled, according to the ITEM → PROCESS framework?
- A) Wiped down and reused for the next client.
- B) Removed after use, contained away from clean stock, and laundered before reuse.
- C) Disinfected with the same product used on hard surfaces.
- D) Discarded after a single use, like a single-use item.
- Correct: B
- Rationale: Linens follow their own correct path — remove, contain, launder before reuse — distinct from hard-tool or single-use-item processes.
- Why others wrong: A skips laundering entirely. C applies the wrong process category (hard-surface disinfection) to porous linens. D incorrectly treats reusable linens as single-use.
- Source: Module 10, "Core competencies"
- Randomization: eligible

### HS-FE-M10-004
- Competency: blood/OPIM incident recognition | Tag: Critical-Domain Evidence [D4] | Difficulty: Applied
- Q: During a service, a minor cut occurs and there is visible blood on a reusable tool. What should happen?
- A) Follow the normal between-client reset process for that tool.
- B) Recognize this as a different situation requiring the business's applicable blood/OPIM exposure procedure, not a routine reset.
- C) Continue the appointment and address it during the normal end-of-day cleaning.
- D) Simply avoid using that specific tool again for the rest of the day.
- Correct: B
- Rationale: Blood/OPIM contamination triggers a distinct, non-routine incident procedure — not an ordinary between-client reset.
- Why others wrong: A, C, and D all treat a genuine incident as routine, delaying appropriate handling.
- Source: Module 10, "Critical competencies"
- Randomization: eligible

### HS-FE-M10-005
- Competency: no diagnosis/no causation assumption | Tag: Critical-Domain Evidence [D1] | Difficulty: Applied
- Q: A client contacts the spa the next day reporting a rash on her neck after her service. What is the correct response?
- A) Assure her the sanitation process couldn't possibly be the cause.
- B) Acknowledge her report, document the facts, review relevant internal records without diagnosing or assuming cause, and suggest medical evaluation if warranted.
- C) Apologize and assume the spa's process caused it.
- D) Ask her to describe her symptoms in detail and diagnose the likely cause based on her description.
- Correct: B
- Rationale: This matches the module's exact required response — no diagnosis, no assumed causation in either direction, appropriate internal review, and medical evaluation encouraged where warranted.
- Why others wrong: A wrongly denies causation with false certainty. C wrongly assumes fault without basis. D attempts a diagnosis, which is out of scope.
- Source: Module 10, `m9cp2` (internal ID)
- Randomization: eligible

### HS-FE-M10-006
- Competency: records as operational tool, not legal guarantee | Tag: Standard | Difficulty: Applied
- Q: What is the correct way to think about sanitation/maintenance records?
- A) They are a legal guarantee that protects the business from all liability.
- B) They are an operational/traceability tool supporting consistency, maintenance history, and review — not an automatic legal shield.
- C) They are unnecessary as long as the practitioner follows good habits.
- D) They only matter if a regulatory inspection is scheduled.
- Correct: B
- Rationale: This is the exact corrected framing — records support operations and traceability, but are not a legal-protection guarantee.
- Why others wrong: A overstates their legal effect. C and D both understate their ongoing operational value.
- Source: Module 10, "Core competencies"
- Randomization: eligible

### HS-FE-M10-007
- Competency: equipment/manufacturer authority | Tag: Standard | Difficulty: Applied
- Q: What actually determines the exact contact time and dilution for a given disinfectant product?
- A) A single AIMT-certified universal number that applies to every product.
- B) The specific product's label instructions and the equipment manufacturer's instructions.
- C) Whatever contact time is fastest and most convenient for the schedule.
- D) The technician's personal preference and experience level.
- Correct: B
- Rationale: Labels and manufacturer instructions — not a memorized AIMT number — control these specifics.
- Why others wrong: A incorrectly implies a universal number exists. C and D both substitute convenience/preference for the actual controlling authority.
- Source: Module 10, "Core competencies"
- Randomization: eligible

### HS-FE-M10-008
- Competency: cross-module synthesis (Module 10/11 no-diagnosis discipline) | Tag: Critical-Domain Evidence [D1] | Difficulty: Synthesis
- Q: A client reports a rash the day after her service and separately mentions she searched her symptoms with an AI tool, which told her it was likely an allergic reaction to a specific product. What is the correct combined response?
- A) Confirm the AI's conclusion since it sounds plausible and matches the timing.
- B) Apply the same discipline in both directions: acknowledge her report, don't diagnose or confirm the AI's claim, document the facts, review relevant records internally, and suggest medical evaluation if warranted.
- C) Dismiss the AI's suggestion entirely and tell her it's definitely not related to the service.
- D) Explain that once an AI has offered an opinion, the practitioner has no further role in the conversation.
- Correct: B
- Rationale: This combines Module 10's no-diagnosis/no-causation-assumption discipline with Module 11's identical rule for AI-sourced claims — the same underlying principle, regardless of where the claim originated.
- Why others wrong: A confirms an unverified diagnosis (from either source). C denies causation with false certainty. D abdicates the practitioner's actual role in the conversation.
- Source: Module 10 + Module 11 cross-module link
- Randomization: eligible

## Module 11 questions (5)

### HS-FE-M11-001
- Competency: four AI tool categories | Tag: Standard | Difficulty: Foundational
- Q: According to Module 11, what is the correct way to think about "AI" as a category of tool?
- A) It is one uniform tool that behaves the same way regardless of the task.
- B) It spans several durable categories — language/reasoning assistants, creative AI, imaging/analysis tools, and automation/practice systems — each suited to different tasks.
- C) All AI tools are equally reliable for any professional task.
- D) AI tools are primarily useful only for scalp/hair imaging.
- Correct: B
- Rationale: This is the exact four-category framework taught, by function rather than by product name.
- Why others wrong: A and C both flatten meaningful distinctions between tool types. D understates the range of legitimate use cases.
- Source: Module 11, "Core competencies"
- Randomization: eligible

### HS-FE-M11-002
- Competency: three-level authority matrix | Tag: Critical-Domain Evidence [D1] | Difficulty: Applied
- Q: A technician is considering using an AI tool to help decide whether a scalp finding requires referral. Which authority level does this fall under?
- A) Level 1 — AI can lead the first draft.
- B) Level 2 — AI can assist, but the practitioner verifies.
- C) Level 3 — final authority stays human; the tool does not expand professional authority.
- D) This task is not appropriate for AI involvement in any form.
- Correct: C
- Rationale: Deciding medical safety/referral is explicitly Level 3 — the tool cannot expand the practitioner's professional authority to make this call.
- Why others wrong: A and B both understate the stakes of a safety/referral decision. D overstates the restriction — AI may still inform research or business tasks, just not this specific authority-level decision.
- Source: Module 11, "Applied decisions"
- Randomization: eligible

### HS-FE-M11-003
- Competency: confidence score is not a diagnosis | Tag: Critical-Domain Evidence [D1] | Difficulty: Applied
- Q: An AI-assisted scalp-imaging tool displays a result with a confidence percentage next to a named condition. What should the practitioner do with this information?
- A) Repeat the result to the client as a confirmed diagnosis.
- B) Treat it as system-generated information that may inform closer observation, but never state it to the client as a confirmed diagnosis.
- C) Ignore the result entirely, since AI tools have no legitimate use in scalp assessment.
- D) Use the score to decide the exact service intensity without further client discussion.
- Correct: B
- Rationale: This is the exact confidence-score literacy taught — information, not a verdict.
- Why others wrong: A directly violates the confirmed-diagnosis prohibition. C dismisses a legitimate tool category entirely. D skips the practitioner's own judgment and client conversation.
- Source: Module 11, "Core competencies"
- Randomization: eligible

### HS-FE-M11-004
- Competency: client-supplied AI response | Tag: Critical-Domain Evidence [D1] | Difficulty: Applied
- Q: A client says, "I uploaded a photo and an AI tool said this is psoriasis." What is the best response?
- A) "That's definitely not psoriasis — AI gets this wrong all the time."
- B) "Okay — tell me what you were noticing. Let's look at what we're actually seeing today; I can't confirm a diagnosis from an AI result, but I can help you decide the right next step."
- C) "If the AI said that, we should treat it as psoriasis for today's service."
- D) "AI tools shouldn't be trusted for anything related to health."
- Correct: B
- Rationale: This follows Hear → Observe → Boundary → Next Step — acknowledging without ridicule, returning to observable findings, stating the boundary, and moving to a next step.
- Why others wrong: A ridicules the tool. C automatically agrees with an unverified AI claim. D dismisses the client's experience rather than engaging professionally.
- Source: Module 11, `m11cp1`
- Randomization: eligible

### HS-FE-M11-005
- Competency: Need/Minimize/Verify + cross-module synthesis | Tag: Critical-Domain Evidence [D3] | Difficulty: Synthesis
- Q: A technician wants to use an AI tool to help draft a client education handout about scalp care, and briefly considers uploading a client's scalp photo as a reference example. What is the correct combined judgment, using Need/Minimize/Verify?
- A) Upload the photo, since it will make the handout more accurate.
- B) Recognize the task (a general handout) doesn't need this specific client's image at all — the photo isn't necessary, so it shouldn't be shared regardless of the tool's stated privacy practices.
- C) Upload the photo but remove the client's name first, which is sufficient regardless of what else the image reveals.
- D) Ask the tool provider whether the image will be kept private before deciding.
- Correct: B
- Rationale: The Need question comes first — a general handout doesn't need a specific client's image at all, so Minimize/Verify don't even need to be reached.
- Why others wrong: A skips the Need question entirely. C treats removing a name as sufficient minimization, when an identifiable photo may carry other identifying information. D jumps to Verify without first asking whether the image is needed at all.
- Source: Module 11, "Core competencies"
- Randomization: eligible

---

# PART 3 — RAW APPLIED CASE BANK (8 candidates)

Target: ~4 selected per attempt. Each case combines at least two modules, most combine three or more. Format proposals below favor deterministic/objective scoring (single-best-answer, multi-select, sequencing) except where the competency genuinely requires evaluating open reasoning — per the certification standard's preference for deterministic assessment wherever it validly tests the competency.

### HS-FE-CASE-01 — "The Late Arrival, Mixed Presentation"

- **Modules involved:** 2 (consent/arrival), 4 (assessment), 5 (regional adaptation)
- **Raw scenario:** A client arrives eight minutes late, visibly stressed, apologizing repeatedly. During intake confirmation she mentions a new fragrance sensitivity not on file. During the five-point scan, the crown shows diffuse shine and follicular material; the temples show fine, dry-appearing scale; no pain or tenderness is reported anywhere.
- **Competencies tested:** absorbing schedule pressure without transferring it (M2); confirming intake changes verbally and adjusting hospitality elements for a new sensitivity (M2); five-point scan documentation without diagnosis (M4); regional (not whole-scalp) service adaptation (M5).
- **Critical decisions:** (1) how to greet/settle the client without rushing; (2) whether/how to adjust the aromatherapy offering given the new sensitivity; (3) how to describe the two regional findings without assigning a cause; (4) how to adapt the service by region rather than applying one uniform intensity.
- **Strong reasoning:** absorbs the lateness professionally; confirms and respects the new fragrance sensitivity (offers fragrance-free); documents both regions descriptively; explicitly avoids extending the crown's intensity to the calmer temple region; adapts levers independently per region.
- **Unacceptable reasoning:** shames or rushes the client for lateness; ignores or overrides the newly reported sensitivity; assigns a cause/diagnosis to either region; applies one uniform whole-scalp intensity based on the more dramatic crown finding.
- **Recommended format:** multi-part structured reasoning — Part A multi-select (identify all appropriate actions from a list of ~8, several plausible), Part B short free-response (describe the regional service plan) evaluated by Cadence against a rubric.
- **Scoring proposal:** Part A objectively scored (weighted by which selections are safety/consent-relevant vs. hospitality-relevant); Part B Cadence-evaluated against a human-written rubric requiring regional differentiation and no diagnosis.
- **Critical-domain evidence:** Domain 1 (Part B's regional documentation must avoid diagnosing either region) and Domain 3 (arrival/consent handling of the newly reported sensitivity) — secondary evidence for both, not this case's primary purpose.
- **Critical-domain gate:** No — this case tests integration of standard competencies; no single element here meets the Type A (explicit unsafe reasoning) or Type B (repeated pattern) bar for either domain on its own, though a diagnosis stated in Part B should still be flagged per-item as a correctness failure and folded into that domain's evidence pool.

### HS-FE-CASE-02 — "The Finding the Client Wants to Ignore"

- **Modules involved:** 1 (scope/referral), 4 (assessment/device hygiene)
- **Raw scenario:** Mid-scan, the technician observes an area with visible fluid and mild crusting near the occipital region. The client, who has an early meeting after the appointment, says "it's fine, let's just keep going" and asks the technician not to make a big deal of it.
- **Competencies tested:** stop-and-refer regardless of client comfort or scheduling pressure (M1, M4); device reprocessing after contact with compromised skin (M4); delivering a referral explanation without alarming the client (M1).
- **Critical decisions:** (1) whether to continue the device/service over the area; (2) what to say to the client, who is minimizing the finding and has a time constraint; (3) what happens to the device afterward.
- **Strong reasoning:** stops device use and cosmetic service over the affected area regardless of the client's schedule or minimization; explains the limit calmly without alarming language; removes the device from service for reprocessing per manufacturer instructions; still completes what can safely be done elsewhere on the scalp if appropriate.
- **Unacceptable reasoning:** continues because the client asked to; treats the client's time pressure as a reason to skip the referral conversation; reuses the device on the same or another client without reprocessing; diagnoses the finding to make the referral sound more urgent/legitimate.
- **Recommended format:** single-best-answer sequence (3–4 linked questions: what to do with the device right now; what to say to the client; what to do with the rest of the service; what to do with the device before the next client) — fully deterministic, no open reasoning required since this tests a bright-line rule.
- **Scoring proposal:** objectively scored; each linked question independently correct/incorrect; a wrong answer on "continue despite the finding" or "reuse device without reprocessing" flags the critical gate below.
- **Critical-domain evidence:** Domain 2 (primary — stop-and-refer finding, client/schedule pressure) and Domain 4 (secondary — device reprocessing after contact with compromised skin).
- **Critical-domain gate:** **Yes, Type A** — a response that states it would continue cosmetic service over this stop-and-refer finding, or reuse the contaminated device without reprocessing, is exactly the explicit-unsafe-reasoning example the standard names for Domain 2 (and, on the device-reuse branch, for Domain 4). This is a bright-line gate case, not ordinary applied judgment.

### HS-FE-CASE-03 — "The Escalating Home Routine"

- **Modules involved:** 5 (safety-outranks-request), 6 (wrong product cycle, referral)
- **Raw scenario:** A returning client has been using an increasingly strong OTC anti-dandruff shampoo at home for two months because her flaking has gotten worse. Today's assessment shows fine, dry, powdery flaking with minimal oil and a matte surface — no redness, no spread. She asks the technician to add the strongest available exfoliation to "really get in there."
- **Competencies tested:** recognizing the wrong-product-cycle pattern (M6); reassessing before escalating further (M6); redirecting a client request that doesn't match the presentation (M5); choosing a within-scope, non-diagnostic explanation (M6).
- **Critical decisions:** (1) whether the presentation is dry-scalp or dandruff-spectrum, and what that implies; (2) whether to honor the requested strong exfoliation; (3) what to tell her about her home product routine without diagnosing.
- **Strong reasoning:** recognizes a dry-scalp-compatible pattern being mistreated by an anti-dandruff product; declines to add strong exfoliation (would worsen a barrier issue, not help it); explains gently, without diagnosing, that the current routine may be working against her; suggests a gentler within-scope alternative and/or simplifying the routine.
- **Unacceptable reasoning:** adds the requested strong exfoliation because the client asked; recommends an even stronger anti-fungal product to "match" her home routine; diagnoses a specific medical condition; blames the client for the situation.
- **Recommended format:** single-best-answer for the presentation classification (deterministic), followed by a short free-response for the client conversation (Cadence-evaluated).
- **Scoring proposal:** classification question objectively scored; conversation response scored against a rubric requiring redirection without diagnosis and without complying with the inappropriate request.
- **Critical-domain evidence:** Domain 2 (not pushing through an inappropriate service condition — escalating exfoliation against a barrier-compromised presentation).
- **Critical-domain gate:** No by default — this is ordinary Domain 2 evidence, scored normally. It would become a Type A trigger only if the free-response explicitly recommends escalating exfoliation/product strength against the presentation described; that specific answer should be flagged for targeted Domain 2 remediation review even on attempts where it doesn't independently fail the gate.

### HS-FE-CASE-04 — "Reset Under Real Pressure"

- **Modules involved:** 7 (station prep, positioning), 10 (sanitation/reset integrity)
- **Raw scenario:** The next client has arrived 10 minutes early. The station's halo system finished a required disinfection contact time only 2 minutes ago and the technician hasn't yet completed the comfort/ambient portion of station prep. The waiting client can be seen from the doorway.
- **Competencies tested:** correct reset-phase sequencing under real time pressure (M10 five-phase framework); not skipping/shortening any required process (M10); correctly prioritizing sanitation/structural setup before ambient elements even under visible client pressure (M7 prep-order logic).
- **Critical decisions:** (1) whether the room is actually ready to receive the client; (2) what to complete first with the remaining time; (3) how to communicate a short wait, if needed, without transferring pressure to the client or skipping a step.
- **Strong reasoning:** confirms the disinfection contact time has genuinely completed (it has, per the scenario) before proceeding; completes remaining sanitation/structural items before ambient ones if any remain; if ambient/comfort elements aren't ready, briefly and calmly asks the client to wait rather than skipping them or rushing in an unready room; never treats the client's visible presence as a reason to shortcut a still-incomplete process step.
- **Unacceptable reasoning:** brings the client in before required steps are genuinely complete just because they're visible and waiting; skips ambient/comfort setup silently, changing the experience without acknowledgment; treats "close enough" as sufficient for a safety-relevant step.
- **Recommended format:** sequencing/ranking question (put the remaining tasks in correct priority order) + single-best-answer for the client-communication decision.
- **Scoring proposal:** sequencing objectively scored (exact order or a defined tolerance for interchangeable low-priority items); communication question objectively scored against one correct approach and clearly wrong distractors.
- **Critical-domain evidence:** Domain 4 (primary — required contact time under schedule pressure) and Domain 2 (secondary — the ready-room/positioning check before the next client).
- **Critical-domain gate:** No on its own (the contact time in this scenario has already completed, so there is no Type A trigger available in this exact wording) — but this case is deliberately designed adjacent to the Domain 4 gate line. A variant where contact time has *not* completed and the student proceeds anyway would be a Type A gate scenario for Domain 4, matching Case 02's device-reuse branch. This variant should be added to the bank during the growth phase so Domain 4 has at least one applied-case item that actually exercises the Type A bright line, not only this near-miss version.

### HS-FE-CASE-05 — "Discomfort Mid-Service"

- **Modules involved:** 7 (stop/adjust/communicate/resume, medical-emergency escalation), 8 (exfoliation adaptation, pacing)
- **Raw scenario:** Partway through the exfoliation phase of an Extended-format service, the client mentions her neck feels strained and she's a little cold. A few minutes later — after the technician has made an adjustment — she also mentions the exfoliation intensity feels like "a lot" today.
- **Competencies tested:** the stop→adjust→communicate→resume sequence (M7); distinguishing this from a medical-emergency signal (M7); adapting exfoliation intensity without fully omitting it or ignoring the feedback (M8); sequencing two distinct issues (positioning/temperature, then intensity) rather than addressing only one.
- **Critical decisions:** (1) whether to pause immediately or finish the current step first; (2) what specifically gets adjusted (position, temperature, or both); (3) how to respond to the second piece of feedback about intensity without simply stopping exfoliation entirely.
- **Strong reasoning:** pauses before continuing rather than finishing the step first; addresses both position and temperature; communicates each change and checks in before resuming; on the intensity feedback, reduces/modifies rather than eliminating exfoliation outright, and explains the change briefly.
- **Unacceptable reasoning:** finishes the current step before addressing the complaint; addresses only one of the two issues raised; treats the intensity comment as something to push through since "it's supposed to feel like something"; silently changes the plan without telling the client anything.
- **Recommended format:** sequencing question (order of actions taken) + single-best-answer for the exfoliation-adjustment decision.
- **Scoring proposal:** fully deterministic — both parts have one clearly correct sequence/answer per the approved curriculum.
- **Critical-domain evidence:** Domain 2 (stop→adjust→communicate→resume sequence, ordinary discomfort handling).
- **Critical-domain gate:** No by default — ordinary Domain 2 evidence, scored normally. A response that explicitly ignores the discomfort report entirely, or states it would finish the current step regardless of the complaint, is Domain-2-relevant evidence of a pattern-level concern worth flagging for remediation even though a single case like this does not independently trigger the gate.

### HS-FE-CASE-06 — "The Checkout Enhancement Decision"

- **Modules involved:** 8 (scope guardrail, closing script), 9 (enhancement fit, restraint-wins-over-sale)
- **Raw scenario:** Earlier in the service, the technician noted a mildly reactive-appearing area at the hairline (not a stop-and-refer finding, but a reason for caution) and adapted technique there accordingly. At checkout, the client — unaware of the earlier finding — asks whether she should add a "deep scalp treatment enhancement" focused on that exact area for her next visit.
- **Competencies tested:** carrying an earlier in-service finding into a checkout recommendation (M9 "restraint wins over the sale"); delivering the approved five-part closing shape (M8/M9); giving a business-appropriate, non-diagnostic explanation for declining or modifying the enhancement recommendation.
- **Critical decisions:** (1) whether to recommend the enhancement as requested, decline it, or recommend a modified version; (2) how to explain the recommendation without alarming the client or diagnosing the earlier finding; (3) how to complete the closing shape cleanly regardless of her decision.
- **Strong reasoning:** does not recommend the enhancement as-is over the area of earlier caution; explains in plain, non-diagnostic terms that a gentler approach is recommended there for now; still completes the closing shape professionally; does not use the earlier finding to pressure a different, more expensive add-on instead.
- **Unacceptable reasoning:** recommends the enhancement as requested to close the sale; uses vague alarming language about the earlier finding to redirect toward a different paid add-on; discloses more clinical detail about the finding than appropriate for a checkout conversation.
- **Recommended format:** single-best-answer for the recommendation decision + short free-response for the client-facing explanation (Cadence-evaluated).
- **Scoring proposal:** recommendation decision objectively scored; explanation scored against a rubric requiring restraint-over-sale and non-diagnostic language.
- **Critical-domain evidence:** Domain 2 (secondary — restraint-over-sale is a safety-preference-priority pattern) and Domain 3 (secondary — the underlying finding originates in scope-sensitive bodywork territory from Module 8).
- **Critical-domain gate:** No — this scenario is deliberately calibrated below the gate line ("mildly reactive," not a stop-and-refer finding), so a missed case here is a business/communication quality issue, not a Domain 2 or Domain 3 failure. It would only approach Type A territory if the response actively recommended a service over a genuinely unsafe finding, which this specific scenario does not present.

### HS-FE-CASE-07 — "The Client Who Already Asked AI"

- **Modules involved:** 1 (observation/diagnosis boundary, referral), 11 (Hear/Observe/Boundary/Next Step, AI authority levels)
- **Raw scenario:** Before any hands-on assessment begins, a client says, "I already uploaded a photo to an AI tool and it told me I have early-stage alopecia areata. I just want you to confirm it and tell me what to do." She seems anxious and is looking for reassurance.
- **Competencies tested:** responding to a client-supplied AI claim without ridicule or automatic agreement (M11); returning to the actual, current in-person consultation (M11 Observe step); stating a professional boundary (M1 + M11 Boundary step); choosing an appropriate next step based on actual findings, not the AI's claim (M11 Next Step + M1 referral judgment).
- **Critical decisions:** (1) how to acknowledge her without confirming or ridiculing the AI's claim; (2) whether/how to proceed with an actual assessment; (3) how to decide the next step once real findings are available — and whether that next step should be independent of what the AI said.
- **Strong reasoning:** acknowledges what she brought in without confirming or mocking it; explains she can't confirm a diagnosis from an AI result; proceeds with (or explains the value of) an actual consultation/assessment; bases the eventual next-step recommendation entirely on what is actually observed today, not on the AI's stated conclusion.
- **Unacceptable reasoning:** confirms the AI's claim as fact to reassure her; ridicules the AI tool or her for consulting it; refuses to proceed with any assessment at all; lets the AI's claim substitute for an actual consultation.
- **Recommended format:** short free-response (what the technician says, in sequence) evaluated by Cadence against the Hear/Observe/Boundary/Next Step rubric — this is a case where the reasoning itself needs evaluation, not a fact to be multiple-choice-tested.
- **Scoring proposal:** Cadence-evaluated against a human-written rubric requiring all four HEAR/OBSERVE/BOUNDARY/NEXT STEP elements in substance (not exact wording); immediate-correction trigger if the response confirms the AI's diagnosis as fact.
- **Critical-domain evidence:** Domain 1 (primary — confirming an AI-sourced diagnosis as fact; the tool not expanding the practitioner's authority).
- **Critical-domain gate:** **Yes, Type A** — confirming a diagnosis (whether client-stated, AI-stated, or self-generated) as established fact is exactly the explicit-unsafe-reasoning example the standard names for Domain 1. Module 1 and Module 11 independently flag this same failure mode as an immediate-correction trigger, which is part of why this case was selected as one of the two designated Domain 1 bright-line scenarios in this bank.

### HS-FE-CASE-08 — "The Setup That Isn't Quite Ready"

- **Modules involved:** 7 (bed/equipment evaluation, positioning checks), 10 (item/process categorization)
- **Raw scenario:** A technician inspects their station before a client arrives and finds: the treatment bed's armrests are configured differently than usual (no other issue noted), a clean-labeled bin actually contains one item that looks like it may not have been fully processed, and the halo alignment appears slightly off from the technician's usual setup.
- **Competencies tested:** classifying each finding as "needs correction" or "acceptable variation" (M7); recognizing a possible sanitation-integrity issue and knowing not to assume an item is clean without verification (M10 item/process discipline); correctly prioritizing which finding to resolve before the client enters.
- **Critical decisions:** (1) how to classify each of the three findings; (2) what to do about the possibly-unprocessed item in the clean bin — assume it's fine, or verify/reprocess; (3) whether to proceed with the client before all three are resolved.
- **Strong reasoning:** classifies the armrest difference as acceptable variation (preference, not a requirement); classifies the questionable clean-bin item as needing verification — treats it as needing reprocessing rather than assuming it's clean, since sanitation compatibility/process integrity is a required category, not a preference; classifies the halo alignment issue as needing correction (a required positioning check); resolves the sanitation and positioning issues before bringing the client in, and does not treat the armrest difference as something that needs fixing at all.
- **Unacceptable reasoning:** treats all three findings as equally low-priority; assumes the clean-bin item is fine without verification, given time pressure; "fixes" the armrest configuration as though it were a required correction while leaving the halo alignment unaddressed.
- **Recommended format:** multi-select classification (assign each of the three findings to "needs correction" or "acceptable variation") + single-best-answer for the correct resolution priority.
- **Scoring proposal:** fully deterministic — three independently scored classifications plus one priority-ordering answer.
- **Critical-domain evidence:** Domain 4 (primary — clean-bin item verification) and Domain 2 (secondary — positioning-check classification, not itself safety-critical in this scenario since none of the three findings is a stop-and-refer trigger).
- **Critical-domain gate:** No on its own — but a response that assumes the questionable clean-bin item is fine without verification should be flagged as Domain 4 evidence of a sanitation-discipline concern worth tracking, since it's adjacent to (though not identical to) Case 02's Type A device-reprocessing pattern.

---

# PART 4 — RAW CADENCE EXIT-INTERVIEW BANK (8 candidates)

Target: ~3 primary conversations selected per attempt. Per the certification standard, Cadence asks the primary prompt, evaluates against the human-written rubric below, may ask exactly one targeted follow-up when a competency is unclear or incomplete, and passes the student once the required elements are demonstrated. None of this dialogue is final — the owner will rewrite actual Cadence conversational language before implementation.

### HS-FE-INT-01 — "Where the line actually is"

- **Raw primary prompt:** "Tell me about the line between what you can say to a client and what you can't. Where does that line actually come from, and how do you know when you're near it?"
- **Modules/competencies integrated:** Module 1 (scope/observation-vs-diagnosis), reinforced across nearly every later module's referral/boundary content.
- **Critical-domain evidence:** Domain 1 (primary — this prompt is one of the bank's two clearest Domain 1 non-MCQ sources).
- **Strong-answer indicators:** the line comes from license/jurisdiction/workplace, not from AIMT certification; distinguishes describing/observing from diagnosing or prescribing; gives at least one concrete example of a finding or situation where the line would be tested; can articulate the line without needing a scripted phrase.
- **Critical-failure indicators:** claims certification itself grants diagnostic authority; cannot articulate the observation-vs-diagnosis distinction at all; states the line "doesn't really matter in practice."
- **Possible targeted follow-ups:** "Can you give me a specific example of something you'd describe but never diagnose?" / "What would you do if a client pushed you past that line?"
- **Pass conditions:** demonstrates the scope-is-conditional understanding and the observation-vs-diagnosis boundary, with at least one concrete grounding example, in any natural phrasing.
- **Remediation conditions:** if the student states certification expands scope, or cannot distinguish observation from diagnosis after one follow-up, remediation should point back to Module 1 before reattempt.

### HS-FE-INT-02 — "When the client wants something you don't"

- **Raw primary prompt:** "Walk me through a situation where a client wants something — a stronger treatment, a specific product, a faster appointment — that your professional judgment says isn't right for them today. What do you actually do?"
- **Modules/competencies integrated:** Module 5 (safety-limit-outranks-preference), Module 8 (adapting rather than complying blindly), Module 9 (restraint-over-sale).
- **Critical-domain evidence:** Domain 2 (primary — this prompt is the bank's clearest Domain 2 non-MCQ source, since it directly probes whether a student would ever comply with an unsafe request).
- **Strong-answer indicators:** states plainly that client consent/request doesn't override a safety or appropriateness judgment; describes redirecting rather than simply refusing or simply complying; offers a concrete alternative; keeps the client's trust intact in the description (not adversarial).
- **Critical-failure indicators:** states that client consent or insistence should generally override the practitioner's judgment; describes simply complying to avoid conflict as the default approach.
- **Possible targeted follow-ups:** "What would you actually say to the client in that moment?" / "What's the difference between a client asking for something you'd modify versus something you'd flatly decline?"
- **Pass conditions:** clearly prioritizes professional judgment over client request in an appropriateness/safety conflict, with a plausible redirection approach.
- **Remediation conditions:** if the student defaults to compliance-to-avoid-conflict as their general approach, remediation should revisit Module 5's decision-priority order and Module 9's enhancement guardrail.

### HS-FE-INT-03 — "Keeping standards when you're behind"

- **Raw primary prompt:** "Tell me what happens to your sanitation process on a day when you're running behind schedule. Be honest — what actually changes, and what never changes?"
- **Modules/competencies integrated:** Module 10 (never shortening required process time), Module 7 (prep sequencing under pressure).
- **Critical-domain evidence:** Domain 4 (primary — this prompt is the bank's only dedicated non-MCQ Domain 4 source, which is why the note under "Remediation conditions" below treats it with critical-gate-adjacent severity).
- **Strong-answer indicators:** states plainly that required contact/process times are never shortened regardless of schedule; describes what *can* legitimately flex (pacing of non-safety-relevant tasks, communication with the waiting client) versus what cannot; shows awareness that "looks clean" is not the same as "processed."
- **Critical-failure indicators:** states or implies that a required contact time can be shortened when running behind; states that visual cleanliness is an acceptable substitute for a required process.
- **Possible targeted follow-ups:** "If a client is visibly waiting and a required time isn't done yet, what do you say to them?" / "What's the difference between something you can speed up and something you can't?"
- **Pass conditions:** explicitly and unprompted states that required process/contact times don't get shortened under pressure, with at least one accurate example of what can flex instead.
- **Remediation conditions:** any answer suggesting a required time can be shortened under pressure should route to Module 10's Reset Under Pressure content and be treated with the same severity as a critical-gate-adjacent finding — this is one of the interview's highest-stakes questions.

### HS-FE-INT-04 — "Delivering a limit without losing the client"

- **Raw primary prompt:** "Describe a time you had to tell a client something they didn't want to hear — that you couldn't confirm what they were hoping for, or that the service needed to change. How did you handle it so the client still trusted you?"
- **Modules/competencies integrated:** Module 1 (referral without alarm), Module 4/5/6 (stop/modify/refer communication), Module 11 (Hear/Observe/Boundary/Next Step).
- **Critical-domain evidence:** Domain 1 (primary — delivering a scope/diagnosis limit) and Domain 2 (secondary, if the student's chosen example involves a stop/modify decision rather than a pure communication boundary).
- **Strong-answer indicators:** describes acknowledging the client's concern first; explains the limit calmly and without diagnosing or alarming; offers a next step rather than leaving the client with only a "no"; shows the client remained informed and respected throughout.
- **Critical-failure indicators:** describes avoiding the difficult conversation entirely; describes overstating certainty to make the client feel better; describes dismissively shutting down the client's concern.
- **Possible targeted follow-ups:** "What would you have done differently if the client pushed back?" / "How do you decide how much detail to share in that moment?"
- **Pass conditions:** demonstrates the acknowledge → explain the limit → offer a next step structure, in any natural wording, from a real or realistic example.
- **Remediation conditions:** an answer that avoids delivering the limit, or that overstates certainty to smooth over the conversation, should route to whichever module's referral/communication content is most relevant to the example given.

### HS-FE-INT-05 — "Reasoning about a real price"

- **Raw primary prompt:** "Walk me through how you'd actually price one of your services — not a formula, your real reasoning. What goes into the number?"
- **Modules/competencies integrated:** Module 9 (cost components, margin vs. markup, competitor context vs. formula).
- **Critical-domain evidence:** None. This is a pure business-judgment prompt and does not touch any of the four locked critical domains — it should still be selected for its own component-score value in Part III, just not counted toward critical-domain coverage in the randomization algorithm.
- **Strong-answer indicators:** references real cost components beyond product cost (time, overhead); describes deliberately choosing a margin rather than defaulting to a number; treats competitor pricing as context, not the primary formula; can distinguish margin from markup if asked.
- **Critical-failure indicators:** states a price is chosen primarily by copying a competitor with no own-cost reasoning; cannot name any cost component beyond product cost.
- **Possible targeted follow-ups:** "If your margin and markup were both 30%, would the resulting prices be the same?" / "How does your own time factor into this number?"
- **Pass conditions:** demonstrates real cost-based reasoning with a deliberately chosen margin, using competitor pricing only as context.
- **Remediation conditions:** an answer built entirely on competitor-copying or a memorized universal figure should route to Module 9's cost-components and margin/markup content.

### HS-FE-INT-06 — "Deciding when to trust the tool"

- **Raw primary prompt:** "Tell me about a real task in your practice where you'd use an AI tool, and one where you specifically wouldn't hand it the final decision. What's the difference?"
- **Modules/competencies integrated:** Module 11 (three-level authority matrix, verification discipline).
- **Critical-domain evidence:** Domain 1 (primary — "the tool does not expand your professional authority" is this prompt's direct test).
- **Strong-answer indicators:** gives a concrete example at each end (e.g., drafting marketing copy vs. deciding whether a finding needs referral); explains why the second example requires human final authority in terms of stakes/professional judgment, not just "because AI can be wrong."
- **Critical-failure indicators:** states AI output can be used without any human verification for a task involving client health/safety; states AI should never be used for anything, showing no functional understanding of the matrix.
- **Possible targeted follow-ups:** "What would you personally check before using the AI-assisted example you gave?" / "Where does a scalp-analysis confidence score fit into this?"
- **Pass conditions:** correctly places at least one example at Level 1/2 and one at Level 3, with reasoning grounded in stakes/professional authority rather than a vague "trust/don't trust AI" framing.
- **Remediation conditions:** an answer treating any AI output as automatically trustworthy for a safety-relevant task should route to Module 11's authority matrix and Module 1's scope boundary.

### HS-FE-INT-07 — "What actually makes you a practitioner"

- **Raw primary prompt:** "Beyond the physical steps of the service, what do you think actually makes someone a head spa practitioner rather than just someone who knows the technique?"
- **Modules/competencies integrated:** Module 1 (role vs. license, leading the full experience), a genuinely integrative/capstone prompt drawing on judgment built across the whole course.
- **Critical-domain evidence:** Domain 1, secondary only — a "certification confers authority beyond what's true" answer is Domain 1-relevant, but this prompt's main purpose is holistic judgment quality, not a dedicated domain probe.
- **Strong-answer indicators:** names judgment, observation, communication, adaptation, and/or scope awareness as the actual differentiator, not technique alone; gives at least one concrete example tying the abstraction to a real decision.
- **Critical-failure indicators:** answer is purely about technique/product knowledge with no mention of judgment, communication, or scope; answer claims certification alone confers professional authority beyond what's actually true.
- **Possible targeted follow-ups:** "Can you give me one specific moment from this course where that judgment mattered?"
- **Pass conditions:** identifies at least one non-technical competency (judgment, communication, adaptation, scope awareness) as central to the role, with a grounding example.
- **Remediation conditions:** an answer that is purely technique-focused should prompt a review of Module 1's role-vs-license framing before certification.

### HS-FE-INT-08 — "A moment that didn't go to plan"

- **Raw primary prompt:** "Tell me about a moment in this course — a checkpoint, a scenario, or your own imagined practice — where the situation wasn't perfectly scripted, and you had to figure out the right move yourself. What did you do, and why?"
- **Modules/competencies integrated:** genuinely cross-module; intended as a flexible capstone prompt allowing the student to surface whichever competency they feel strongest about, giving Cadence a broad reasoning sample to evaluate judgment quality directly.
- **Critical-domain evidence:** Flexible/unassigned — this prompt can surface evidence for any of the four domains depending on which example the student chooses, so it should not be counted as a guaranteed source for any one domain's coverage requirement in the randomization algorithm; treat it as a bonus evidence point for whichever domain the actual response touches, not a planned one.
- **Strong-answer indicators:** describes a real decision point (not just a fact); explains the reasoning behind the choice, not just the choice itself; shows awareness of what could have gone wrong with a different choice.
- **Critical-failure indicators:** cannot describe any decision beyond following a script; reasoning given reveals a genuine safety/scope misunderstanding (route to the specific competency's critical-gate handling if so).
- **Possible targeted follow-ups:** "What would you have done if [a specific complicating detail] had also been true?"
- **Pass conditions:** produces a genuine, reasoned account of a non-scripted decision, evaluated holistically for judgment quality rather than against a single fixed answer.
- **Remediation conditions:** an answer revealing no independent reasoning capacity, or revealing a specific safety/scope misunderstanding, should route to targeted remediation in whichever module the example (or its absence) implicates.

---

# PART 5 — MODULE 12 STATE ARCHITECTURE (design only, not implemented)

Current repository truth: `module12Wrap` (technical slot 12) currently holds the **relocated, unchanged Course Completion & Certification experience** — moved intact from its former slot-11 position by the Module 11 → 12 structural relocation (see `implementation-log.md` Step 83). It is not yet the approved Final Exam. The states below describe how that existing content and a new exam flow should relate, once implementation is authorized. No code, markup, or state-engine change is made by this document.

### State A — Exam Ready

Module 12 must **initially open as the Final Exam**, not as course completion. A student who has completed Module 11 and opens Module 12 for the first time (or returns before passing) should see:

- a brief overview of what Module 12 is (the certification assessment, not another instructional module);
- the assessment structure at a plain level (three parts, roughly how each is weighted — no need to restate exact percentages, but the shape should be clear: knowledge questions, applied cases, a conversation with Cadence);
- an honest explanation of the grading approach (Cadence evaluates against AIMT-authored rubrics; the backend records the result; a human-defined standard decides certification — matching Section 3 of the certification standard);
- an explanation that the required module checkpoints throughout the course established readiness to attempt this — not a substitute for it;
- what passing requires, stated plainly (not the exact numeric thresholds necessarily, but the shape: knowledge, applied judgment, and a live conversation, all need to clear their own bar, and a few critical judgment areas must be clean regardless of score elsewhere);
- what happens if the standard isn't met the first time (a review, not a locked door — pointing at the remediation ladder without over-explaining it upfront);
- encouragement that is honest, not falsely hyped;
- a clear "Start Final Exam" action.

**Course Completion & Certification content (the current, relocated `module12Wrap` material) must remain hidden at this state** — a student must not see certificate-adjacent content until they've actually passed.

### State B — Exam In Progress

**Save/resume model — locked (August 26, 2026 correction pass), design only, not implemented:**

- **Structure:** three sequential parts (Knowledge, Applied Cases, Practitioner Interview), matching the certification standard's Part I/II/III. A student should be able to see which part they're in and roughly how much of it remains.
- **Part I — Knowledge:** the student may navigate between questions, revise answers, leave and resume freely, and continue until intentionally submitting Part I. **Once Part I is submitted, it locks** — no post-submission edits, no re-entry into that attempt's Part I.
- **Part II — Applied Cases:** the student completes cases sequentially. Each case locks individually at its own intentional submission — not all-at-once with Part I, and not silently on a timer. Both completed and in-progress case work must persist across a session break.
- **Part III — Practitioner Interview:** each conversation locks once either (a) competency is demonstrated per the rubric, or (b) the one permitted targeted follow-up has been asked and answered and the rubric result is finalized — matching how module checkpoints already behave in this course.
- **No countdown timer, no artificial urgency mechanic, anywhere in State B** — locked explicitly, not merely recommended.
- **Progress indication:** a simple "Part X of 3" and, within Part I, a completed/remaining question count — no percentage-race framing.
- **Authoritative persistence:** ultimately server-side, per the certification standard's Section 16 release requirement — client-side save/resume state during development/prototyping is fine, but the production-release version of this behavior must not trust client-submitted "what I've answered so far" state as authoritative, for the same reason final scoring itself must be server-side.

This resolves the save/resume open decision that a prior pass of this document had left open — mid-part navigation is allowed within Part I and Part II (per-case), locking happens at the granularity described above, not per-question and not per-part-uniformly.

### State C — Passed

Only after all pass conditions in the certification standard (Section 4) are met, reveal the existing **Course Completion & Certification** experience — reusing as much of the current, already-approved `module12Wrap` content as validly applies, rather than rebuilding it from scratch. On top of what's already there, this state should add:

- congratulations that is genuine, not generic ("you actually demonstrated this" framing rather than a stock message);
- certification confirmed, with the certification date;
- a link to or embedded summary of the **AIMT Certification Performance Review** (Section 11 of the certification standard) — strongest areas, 1–3 development areas, framed as forward-looking, never as leftover failure;
- where to find/download the certificate (the current certificate flow, unchanged in its mechanics unless the backend-authority hardening in Part 6/Section 16 of the standard is separately authorized);
- dashboard access;
- next steps and any future AIMT resources/education the owner wants surfaced here (not specified by this document — an open decision).

### State D — Not Yet Passed

New state, not currently built. Must be:

- respectful, clear, direct, encouraging;
- **not falsely congratulatory** — the student should never come away thinking they passed when they didn't;
- **not shame-based** — no punitive language, no implication of failure as a personal or moral shortcoming.

Should show:

- certification status, stated plainly as not yet earned;
- the AIMT Certification Performance Review for a not-yet-passed attempt (Section 11 of the standard) — section performance, competencies already meeting standard, competencies requiring remediation, critical-domain gaps where applicable, exact modules/sections to revisit;
- current attempt number and remediation status (per the ladder in Section 8 of the standard);
- the next permitted step, stated as a concrete action ("Review Sections 5.3–5.5, then retake" — not a bare "Try again" button as the entire strategy, per the standard's explicit prohibition);
- certificate access clearly locked, without being punitive about it.

---

# PART 6 — RANDOMIZATION APPROACH (Head Spa specifics)

Extends the certification standard's Section 13 with Head-Spa-specific detail, since the standard defines the model and this document supplies the course-specific numbers. **Updated by the August 26, 2026 correction pass** to add locked critical-domain coverage requirements, a locked retake-overlap rule, and a locked launch bank-size target.

- **Part I (Knowledge):** ~40 questions drawn from the question bank in Part 2, per attempt. The draw should guarantee: at least one question from every one of the 11 modules (avoiding a scenario where an entire module goes untested in a given attempt); representation proportional to each module's bank size as a floor, not a hard ceiling (e.g., Module 8's question bank should contribute noticeably more than Module 11's, but never zero from any module); the foundational/applied/synthesis mix approximating 20/60/20 on the assembled 40, not just on the source bank.
- **Part II (Applied Cases):** ~4 cases drawn from the case bank in Part 3, per attempt.
- **Part III (Interview):** ~3 conversations drawn from the interview bank in Part 4, per attempt, favoring variety across attempts for a student who reaches Attempt 2/3 (a student should not receive the identical three prompts on a retake).

**Critical-domain coverage (locked, per the certification standard's Section 5.3 and 13):** every assembled attempt must include, for **each** of the four domains in Part 1A:

- at least **two independent evidence points**, drawn from any combination of Parts I–III;
- at least **one of those points from Part II or Part III** — not exclusively from Part I multiple-choice items.

Using the current raw banks' domain tagging (Parts 1A, 2, 3, 4): Domain 1 has 14 Part I items plus Case 07 and Interview 01/04/06/07 as non-MCQ sources — comfortably coverable. Domain 2 has 12 Part I items plus Case 02/03/05/06/08 and Interview 02/04 — comfortably coverable. Domain 4 has 6 Part I items plus Case 02/04/08 and Interview 03 — coverable, though Interview 03 is currently the *only* dedicated Domain 4 interview source, so the algorithm should not depend on Interview 03 alone being selected every time without a backup. **Domain 3 is the genuine gap:** 6 Part I items exist, but no case or interview in the current raw 8/8 banks has Domain 3 as its *primary* evidence source — only secondary/incidental touches in Case 01 and Case 06. Until a dedicated Domain 3 case or interview is added (see Part 7, item 5), the randomization algorithm **cannot yet guarantee** the "at least one non-MCQ evidence point" requirement for Domain 3 on every attempt using only this raw bank — this is a concrete blocker for the coverage requirement, not just a quality concern, and should be resolved before implementation, not discovered during it.

**Retake overlap (locked, per the certification standard's Section 13):** do not require mathematically zero overlap between Attempt 1/2/3. On a retake, prefer previously unseen questions/cases/prompts; avoid repeating an item where an equivalent unseen item satisfies the same competency, difficulty, and critical-domain coverage requirement; permit limited overlap only when necessary to preserve required coverage — never sacrifice coverage or validity merely to hit zero repetition.

- **Answer-choice shuffling:** freely shuffle option order for standard single-best-answer questions; do not shuffle sequencing-question step order (two items in this bank are explicitly marked "fixed order" for this reason); multi-select item order may shuffle.

**Launch bank-size target (locked):** the raw 80 knowledge questions / 8 applied cases / 8 interview prompts in Parts 2–4 remain valid raw starting material — nothing in this correction pass rewrites them. The **locked launch target** for the actual Head Spa question/case/prompt banks is:

- **120 Knowledge questions**
- **12 Applied Practitioner Cases**
- **9 Practitioner Exit Interview prompts**

This larger bank is required to improve retake variation, reduce memorization risk, support difficulty balancing, **make the critical-domain coverage requirement above actually achievable rather than merely probable** (especially closing the Domain 3 gap), and reduce repeat exposure across Attempts 1–3. The additional items are **not created by this document** — they are explicitly reserved for the owner/external exam-content rewrite phase, per this task's instruction not to generate more raw exam content here.

---

# PART 7 — OPEN DECISIONS REQUIRING OWNER APPROVAL

**Pruned by the August 26, 2026 correction pass.** The prior version of this list had 12 items; 8 are now resolved and locked (exact pass thresholds → standard Section 4; the critical-competency/domain list → Part 1A; save/resume granularity → Part 5 State B; the retake-overlap philosophy → Part 6; the Attempt 2→3 remediation gating *principle* → standard Section 8; Educator Remediation Session launch logistics → standard Section 8's MVP; human review/appeal intake → standard Section 9's MVP; backend-authoritative timing → standard Section 16, now a hard release requirement, not a timing question). Only genuinely unresolved issues remain below — nothing here is manufactured to fill space.

1. **Exact student-facing Module 12 language.** Every question, case scenario, interview prompt, state-A/C/D copy block, and Performance Review template in this document (and in the certification standard's own institutional copy examples) is intentionally raw/utilitarian. All of it needs an external rewrite pass before shipping, per this task's explicit instruction — this is not a defect to fix, it's the documented next step.
2. **Exact remediation activities/content per competency/domain gap.** The certification standard now locks the *gating principle* (Attempt 3 doesn't unlock until assigned remediation is complete, grouped by competency/domain, not per missed question) — but the actual remediation activities themselves (a checklist? a required Cadence conversation with its own pass gate? re-completion of specific lesson sections with a tracked completion flag?) are not designed. Needs a decision during implementation.
3. **What appears in the future-course/next-steps section of State C.** Not specified by this document — likely marketing/business content the owner will want to write directly rather than have drafted here.
4. **Whether Guided Completion Path pacing should reference Module 12 attempt status.** The course-wide Guided Completion Path (deferred, per `00-global-decisions.md`) is supposed to lead toward Module 12 completion, not just instructional completion — once Module 12 has attempt/remediation states, that future feature will need to account for them, but that integration isn't decided here.
5. **Domain 3 (Consent / Touch / Bodywork Authority) has no dedicated non-MCQ evidence source.** Surfaced by this correction pass's domain-mapping exercise (see Part 1A and Part 6): the current raw 8-case / 8-interview banks contain no case or interview whose *primary* evidence is Domain 3 — only secondary touches inside Case 01 and Case 06. This is a concrete blocker for the per-attempt critical-domain coverage requirement (standard Section 5.3), not a stylistic gap — at least one new Domain 3–primary case or interview should be added during the bank-growth-to-120/12/9 phase, before the coverage requirement can actually be guaranteed by the randomization algorithm rather than merely hoped for.

---

**Governing document:** `docs/course-audit/00-aimt-certification-assessment-standard.md`
**This document's status:** Module 12 Final Exam Raw Blueprint — architecture corrected and locked by the August 26, 2026 correction pass; exam language still awaiting owner/external rewrite. Raw extraction and candidate content only. No implementation, no student-facing language, no production code change is authorized by this document. Module 12 remains **not approved for implementation.**
