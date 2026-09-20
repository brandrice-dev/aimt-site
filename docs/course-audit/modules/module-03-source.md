# Module 3 — Source Extraction

Extracted verbatim from `headspa-mastery.html` and `assets/js/headspa-state.js`
as they exist on branch `course-audit-build`, commit `3ee006c` (top of
history at extraction time). Wording is copied exactly — nothing here has
been rewritten, corrected, summarized, or improved. This is a record of the
*current* experience, not a proposal.

Confirmed findings are separated from assumptions in section 13.

---

## 1. Module identity

| Field | Value |
|---|---|
| Module number | `3` |
| Student-facing title (`MODULE_TITLES[3]`) | `Module 3 — Hair & Scalp Anatomy` |
| Home-screen dashboard subtitle (`.mr-sub` for row 3) | `The biology behind every service decision` |
| Module hero eyebrow (in-lesson) | `Module 3 · Hair & Scalp Anatomy` |
| Module hero title | `Before you treat,<br>you have to understand.` |
| Module hero description | `Everything you do in a head spa service — every product choice, every protocol decision, every referral — should be rooted in a clear understanding of what you're actually working with. This module gives you that foundation.` |
| Module wrapper | **None** — Module 3 is not a `moduleNWrap` hidden-template div like every other module. It is the *default* content already sitting inside `#lessonView .lesson-wrap` at page load. `document.addEventListener('DOMContentLoaded', ...)` (`headspa-mastery.html:~7963`) captures it into a JS variable: `const wrap = document.querySelector('.lesson-wrap'); if (wrap) module3HTML = wrap.innerHTML;` — this captured string is what `STATIC_MODULES[3]` re-injects on every subsequent visit. |
| JS module identifiers | `M3` (const, questions + system prompt), `MODULE_GUIDE_SYSTEMS[3]`, `MODULE_QUICK_PROMPTS[3]`, `MODULE_TITLES[3]`, `MODULE_CHECKPOINTS['3']`, `MODULE_CP_COUNTS['3']`, `MODULE_MEMORY_TAGS[3]` (`headspa-state.js`) |
| Checkpoint IDs | `cp1`, `cp2` — **bare IDs, not the `m3cp1`/`m3cp2` pattern every other module uses** (container/textarea ids `cp1In`/`cp1Btn`/`cp1Res` and `cp2In`/`cp2Btn`/`cp2Res`) |
| Completion card ID | `lessonComplete`, with a `data-also-id="m3Complete"` attribute (see section 6 and section 13, finding 4) |
| Static routing entry | `STATIC_MODULES[3]` inside `openModuleById()`: `() => { if (wrap && module3HTML) wrap.innerHTML = module3HTML; }` — the only module routing entry that does not read from a hidden template div |
| Guide quick-prompts routing | `updateGuideQuickPrompts(3)` runs unconditionally inside `openModuleById(3)` and overwrites `#quickPs` with `MODULE_QUICK_PROMPTS[3]` (3 prompts) — see section 4 and section 13, finding 3, for the discrepancy with the 5 prompts hardcoded directly in Module 3's static markup |

Module 3 is structurally the outlier among the four modules extracted so
far: no wrapper ID, bare checkpoint IDs, a dedicated capture-on-load
mechanism instead of a hidden template, and a video-intro block none of
the other three modules have.

---

## 2. Module 3 curriculum

Copied exactly from the default `.lesson-wrap` content
(`headspa-mastery.html:2361`–`3006`), in student-encounter order.

### Video intro block

- Eyebrow: `Module intro`
- Duration badge: `4 min`
- Video frame: a placeholder state only — `<!-- PASTE YOUR YOUTUBE/VIMEO EMBED URL HERE -->` comment, no embed present
  - Placeholder title: `Hair & Scalp Anatomy — Intro`
  - Placeholder sub: `Cadence · Module 3 · 4:12`
  - Placeholder badge: `Video coming soon`
- Caption: `Watch this first, then move through the lesson at your own pace. Cadence is available below if anything needs clarifying.`

### Hero

- Eyebrow: `Module 3 · Hair & Scalp Anatomy`
- Title: `Before you treat, you have to understand.`
- Description: `Everything you do in a head spa service — every product choice, every protocol decision, every referral — should be rooted in a clear understanding of what you're actually working with. This module gives you that foundation.`

### Section 1 — The foundation

- Eyebrow: `The foundation`
- Title: `The scalp is skin. Treat it like it.`
- Body 1: `This sounds obvious, but it's worth stating clearly: the scalp is not a separate category of tissue that operates by different rules. It is skin — specifically, one of the most complex and active areas of skin on the entire body. It has a higher density of hair follicles, sebaceous glands, and blood vessels than almost anywhere else, which is exactly why it responds so strongly to the right treatment — and the wrong one.`
- Body 2: `Understanding basic anatomy isn't about memorizing textbook terms. It's about making better decisions at the treatment bed. When you know that the sebaceous gland sits directly alongside the hair follicle, it makes sense why over-stripping the scalp stimulates more oil production. When you understand the hair growth cycle, you can explain postpartum shedding to a client without alarming them. Anatomy is practical knowledge — not academic.`
- Cadence note (`.cadence-note`), label `From Cadence`: `"I didn't love studying anatomy when I was in school. But the moment I started seeing it under the microscope and connecting it to what clients were actually experiencing, everything clicked. That's the goal of this module — to make the biology feel useful, not clinical."`

### Section 2 — Scalp structure (contains the cross-section diagram)

- Eyebrow: `Scalp structure`
- Title: `The layers you're working through`
- Body: `The scalp has five distinct layers. In practice, you'll rarely think about them individually — but understanding them helps explain why certain techniques work, why pressure matters, and what you're actually stimulating during massage.`

**The scalp/hair cross-section diagram — current presentation (`headspa-mastery.html:2424`–`2690`):**

This is **not an image file**. It is a complete, hand-authored **inline
`<svg>`** (`viewBox="0 0 680 520"`), wrapped in a `.diagram-wrap` div with a
`.diagram-label` reading `Scalp anatomy — cross section`. There is no
`<img>` tag, no `src` attribute, and no external asset referenced anywhere
in this section. The SVG draws, from bottom to top: skull bone (with
texture dots), pericranium, loose areolar connective tissue (with texture
dots), epicranial aponeurosis (with fibrous lines), a subcutaneous/fat
layer (with fat-cell ellipses and two blood-vessel paths, one red/arterial-
styled, one blue/venous-styled), a dermis layer (with collagen texture
lines), and an epidermis/stratum-corneum layer at the top with a wavy skin
surface. Three hair follicles are drawn crossing all layers, each with a
sebaceous gland, a hair bulb, and an emerging hair shaft above the skin
surface (plus four additional thinner "extra hair" strands). One dashed
purple nerve-fiber path is drawn through the subcutaneous layer.

Labels are rendered as SVG `<text>` elements connected to their structures
by thin leader lines and small circles. **Right-side callouts:** Hair,
Stratum corneum, Epidermis, Sebaceous gland, Dermis, Nerve, Hair bulb,
Blood vessel, Loose areolar connective tissue. **Left-side callouts:**
Fascia superficialis, Subcutaneous tissue, Epicranial aponeurosis,
Pericranium, Skull bone. A small teal-tinted `SEBUM` tag is drawn directly
over the sebaceous-gland area on follicle 1. Six horizontal `<line>`
elements mark the boundaries between the six drawn layers.

**Proposed replacement asset:** `assets/images/course/module-03/aimt-scalp-cross-section.png`
(added to the repo but **not yet referenced by any production file** — see
the Step 15 implementation-log entry). This is a raster PNG, 2304×1852px,
approximately 7.2MB uncompressed. **Its anatomical accuracy and label
accuracy have not been independently verified in this extraction pass and
must not be assumed correct** — it requires the same external audit
described in the task instructions (anatomical accuracy, label accuracy,
relevance to the lesson, alt text, mobile display, and whether any labels
need correction) before any decision is made about using it. Swapping a
scalable, theme-matched inline SVG for a large fixed-resolution PNG would
also be a meaningful presentation change in its own right (loses crispness
at large viewport widths, adds a ~7MB network request, loses the diagram's
current light background matching), independent of whether the anatomical
content is correct — flagged for the Module 3 spec to weigh, not decided
here.

- Body (after diagram): `The outermost layer — the epidermis — is what you're seeing and touching at the scalp surface. Beneath it sits the dermis, where the sebaceous glands live alongside the upper portion of each hair follicle. This is the layer most relevant to oil production, barrier function, and the conditions you'll encounter most often. Below the dermis is the subcutaneous layer, rich in blood vessels — the layer your scalp massage is directly stimulating.`

**Clinical note / placeholder photo** (`.clinical-note`):
- Label: `Why this matters in service`
- Placeholder photo (`.clinical-photo.placeholder` — SVG icon only, no real image; see section 13, finding 6): title `Healthy Scalp — Microscopy`, sub `Clear follicle openings, balanced hydrolipid film, pink tone`
- Text: `The sebaceous gland and the hair follicle share an opening. This is why follicular congestion — buildup inside or around the follicle — is an oil-related issue, not just a surface cleanliness issue. It also explains why aggressive stripping products can overstimulate the sebaceous gland and actually increase oil production as a defensive response.`

### Section 3 — The hair follicle

- Eyebrow: `The hair follicle`
- Title: `Where hair actually comes from`
- Body 1: `The hair follicle is a tunnel-shaped structure that extends from the surface of the scalp down into the dermis. At the base of the follicle is the **hair bulb** — a cluster of actively dividing cells that produces the hair shaft. The bulb sits around a structure called the **dermal papilla**, which connects the follicle directly to the blood supply. This is how nutrients, oxygen, and hormones reach the follicle to support hair growth.`
- Body 2: `The hair shaft itself — the part you can see — is not alive. It's a structure made primarily of keratin, a protein produced within the follicle. This is an important distinction to understand when talking to clients: damage to the visible hair shaft is cosmetic. Damage to the follicle environment — through inflammation, congestion, or compromised blood flow — is what affects actual hair health and growth.`
- Key point (`.key-point`, 💡 icon): `**The visible hair is not the patient. The follicle is.** When a client asks about hair growth, hair loss, or hair health, the conversation should always come back to what's happening at the follicle level — not at the strand level.`

### Section 4 — The hair growth cycle

- Eyebrow: `The hair growth cycle`
- Title: `Why hair grows, rests, and sheds — on purpose`
- Placeholder photo (before the body text, unusual ordering — see section 13, finding 7): title `Hair Growth Cycle — Diagram or Microscopy`, sub `Follicles in different phases: anagen, catagen, telogen`
- Body: `Hair does not grow continuously. Every follicle on the scalp cycles through three distinct phases, and each follicle operates on its own independent schedule. At any given time, different follicles across the scalp are in different phases — which is why normal daily shedding of 50 to 100 hairs is expected and not a cause for concern.`

**Phase timeline (`.phase-timeline`, 4 items):**

1. **Anagen — The growth phase.** `This is the active growth phase. The hair bulb is actively dividing, producing new cells that push the hair shaft upward and out of the follicle. Anagen can last anywhere from two to seven years depending on genetics, health, and hormonal factors.` Detail: `Approximately 85–90% of scalp hair is in anagen at any given time. The length of this phase determines how long a person's hair can grow.`
2. **Catagen — The transition phase.** `A brief transitional phase lasting approximately two to three weeks. The follicle begins to shrink and the hair bulb detaches from the dermal papilla, cutting off its blood and nutrient supply. The hair shaft is now a "club hair" — no longer growing, but not yet shed.` Detail: `Only about 1–2% of hairs are in catagen at any given time, which is why it can be easy to overlook in client discussions.`
3. **Telogen — The resting phase.** `The follicle is dormant. The old hair remains in place while the follicle rests, then a new anagen hair begins forming beneath it, eventually pushing the old shaft out. Telogen lasts approximately two to four months.` Detail: `About 10–15% of hairs are in telogen at any given time. Shedding during washing or brushing is usually telogen hairs being released naturally.`
4. **Exogen — The shedding sub-phase** (`+` icon instead of a number). `Sometimes considered a separate phase within telogen. This is the active shedding event — when the old club hair is physically released from the follicle. Daily hair shedding is exogen activity, not damage.` (No separate detail line — the only phase item without one.)

- Body (after timeline): `Understanding the growth cycle gives you language and context for some of the most common concerns clients bring into the head spa. Most importantly, it allows you to differentiate between normal shedding and something that warrants a closer look or a referral.`

### Section 5 — Common hair loss conditions

- Eyebrow: `Common hair loss conditions`
- Title: `What to recognize — and when to refer`

**Photo pair (`.photo-pair`, both placeholders — no real images):**
1. `Normal Shedding — Example`, sub-label `50–100 hairs/day, club hair roots`
2. `Telogen Effluvium — Example`, sub-label `Diffuse thinning, increased density of shed hairs`

- Body: `Two of the most common hair loss concerns you will encounter in a head spa setting are telogen effluvium and postpartum hair loss. These are not exotic or rare conditions — they are extremely common, often emotionally distressing for clients, and frequently misunderstood. Knowing the basics allows you to provide thoughtful education and appropriate referrals without overstepping your scope.`

**Condition cards (`.condition-cards`, 3 cards):**

**Telogen Effluvium** (badge `#e8a830`)
> Telogen effluvium is a temporary, diffuse increase in hair shedding caused by a significant physiological or psychological stressor. The trigger — which might be illness, surgery, dramatic weight loss, extreme stress, or nutritional deficiency — pushes a larger-than-normal proportion of follicles into the telogen (resting) phase simultaneously. The result is noticeable shedding, typically beginning two to four months after the triggering event.
>
> **What clients experience:** Increased hair in the shower drain, on pillows, or during styling. Often described as "handfuls" of hair coming out. The shedding is typically diffuse — spread across the entire scalp rather than concentrated in one area.
>
> **What you may see:** Diffuse thinning visible through the parting, reduced density across the scalp, possibly short regrowth hairs if the effluvium phase is passing.
>
> **Your role:** Observe and educate. Telogen effluvium is typically self-resolving once the stressor is removed, but recovery takes time — often six to twelve months. Scalp massage that supports healthy circulation may contribute to a supportive environment. You should not promise regrowth outcomes.

Tags: `Diffuse shedding`, `Stress-triggered`, `Usually temporary`, `Refer if severe`

**Postpartum Hair Loss** (badge `#8b6f47`)
> Postpartum hair loss is a specific, extremely common form of telogen effluvium triggered by the hormonal shift after childbirth. During pregnancy, elevated estrogen levels extend the anagen (growth) phase, keeping more hairs actively growing than usual. After delivery, estrogen drops sharply, and those follicles that were held in an extended growth phase transition to telogen and eventually shed — all at once, rather than in the staggered pattern they normally would.
>
> **Timing:** Shedding typically begins two to four months postpartum and peaks around the three to six month mark. Most clients will see significant improvement by twelve months postpartum.
>
> **What clients experience:** Often distressing, especially because it can feel sudden and dramatic. Many new parents are not warned this will happen, which makes the discovery frightening.
>
> **Your role:** This is a condition where client education is genuinely valuable and can provide real emotional relief. Knowing that this is normal, expected, temporary, and not a sign of something wrong makes an enormous difference for a client who is worried. A gentle, supportive scalp service with focus on circulation and scalp health is appropriate. Refer if the loss is patchy rather than diffuse, or if it extends significantly past the twelve-month mark.

Tags: `Postpartum specific`, `Hormonal trigger`, `Very common`, `Temporary`, `Education is key`

**Conditions That Require Referral** (badge `#c0392b`)
> Not all hair loss falls within the scope of a head spa service. There are conditions where the appropriate response is to observe, gently note what you're seeing, and refer the client to a dermatologist or medical provider — not to proceed with treatment and hope for the best.
>
> **Refer out if you observe:** patchy, circular, or asymmetric hair loss (possible alopecia areata), smooth bald patches with no visible follicle openings, scalp areas that appear scarred or shiny with no hair regrowth, any combination of scalp and eyebrow or eyelash loss, or hair loss that is worsening rapidly despite the client reporting no identifiable stressor.
>
> **How to refer without alarming:** "Based on what I'm seeing today, I think it would be worth having a dermatologist take a look at this area before we continue. Once you've had that checked out, I'd love to support your scalp health here."

Tags: `Alopecia areata`, `Scarring alopecia`, `Rapid or patchy loss`, `Always refer`

- Key point (→ icon): `**What this helps you do:** Understanding the growth cycle lets you explain normal vs abnormal shedding, reduce client anxiety, avoid over-treating something temporary, and recognize when something actually requires referral. Without this, you're guessing — and your clients will sense it.`

### Section 6 — Sebum & the hydrolipid film

- Eyebrow: `Sebum & the hydrolipid film`
- Title: `The protective layer everything depends on`
- Body 1: `Sebum is the natural oil produced by the sebaceous gland. On its own, sebum isn't a problem — it's essential. When sebum mixes with the moisture already present on the scalp's surface, it forms what's called the **hydrolipid film** — a thin, protective layer that acts as a barrier between the scalp and the outside world.`
- Body 2: `This film regulates moisture, protects against environmental irritants, maintains the scalp's natural pH, and creates conditions that support healthy follicle function. It's the reason a neutral, well-balanced scalp has that slight natural sheen without feeling greasy. When the hydrolipid film is intact and functioning well, the scalp generally takes care of itself.`
- Body 3: `Most of the scalp imbalances you'll encounter in practice — excessive oiliness, dryness, flaking, sensitivity — trace back to disruption of this film. Either it's producing too much oil, not enough, or it's been stripped by harsh products, environmental exposure, or chemical processes. Your job as a head spa technician is not to override this system. It's to support it.`

**Info card** — title `What disrupts the hydrolipid film`, an 8-item two-column grid: `Over-cleansing or harsh surfactants`, `Chemical services (color, perms, relaxers)`, `Excessive heat styling at the scalp`, `Aggressive physical exfoliation`, `Hormonal fluctuations`, `Nutritional deficiencies`, `Environmental factors (cold, dry air)`, `Chronic stress`.

- Cadence note, label `From Cadence`: `"This is where a lot of people misread what they're seeing. They see oil and assume 'dirty.' They see flaking and assume 'dandruff.' They see dryness and assume 'needs exfoliation.' Then they treat based on the symptom instead of the cause. A client with flaking, a tight scalp, and no visible oil does not need a clarifying shampoo. She needs barrier support. The difference is understanding what you're actually looking at — not just reacting to what's visible."`

### Checkpoint 1 (`cp1`) — see section 3 for full grading detail

- Label: `Check your understanding`
- Displayed question (`.cp-q`): `A client comes in saying her hair has been shedding heavily for about two months. She also mentions she had a bad flu six weeks ago and has been under a lot of stress at work. Based on what you just learned, what is the most likely explanation — and what would you say to her?`
- Placeholder: `Think it through and write your answer...`

### Section 7 — Circulation & scalp massage

- Eyebrow: `Circulation & scalp massage`
- Title: `Why massage is more than relaxation`
- Body 1: `The scalp has a rich blood supply, and that blood supply is directly connected to follicle health. The dermal papilla at the base of each hair follicle receives all of its nutrition — oxygen, amino acids, vitamins, hormones — through the surrounding capillary network. When circulation is healthy, follicles have access to what they need. When circulation is reduced — due to chronic tension, poor posture, tight hairstyles, or stress — that delivery system is impaired.`
- Body 2: `Scalp massage increases local circulation by stimulating blood flow to the capillary beds in the dermis. This is not a marketing claim — it's a physiological response to mechanical stimulation. Increased blood flow brings more nutrients to follicles and may support a healthier growth environment. It also reduces scalp tension, which can be a contributing factor in certain types of traction-related thinning over time.`
- Cadence note, label `From Cadence`: `"I always tell my clients: I can't promise this will regrow your hair. What I can promise is that I'm creating the best possible environment for your follicles to do their job. That's the honest, accurate version of what we do — and most clients respond really well to that framing."`
- Body 3: `It's important to be accurate when discussing circulation benefits with clients. Improved circulation supports a healthy follicle environment — it does not reverse medical hair loss conditions, it does not directly cause hair growth, and it should not be presented as a medical treatment. The honest framing is always the right framing.`
- Info card — title `What this changes in your service`: `If you understand circulation, you don't rush the massage. You don't treat it as a filler step between product application and rinse. You understand why consistency matters — why returning clients who receive regular massage may see a different environment over time than those who don't. If you don't understand it, massage becomes random. Pressure becomes inconsistent. The step loses its purpose.`

### Section 8 — Putting it all together

- Eyebrow: `Putting it all together`
- Title: `How anatomy informs your service decisions`
- Body 1: `The reason this module exists is not to make you a dermatologist. It's to make you a more precise, more confident technician who can explain what you're doing and why — to your clients, to your colleagues, and to yourself.`
- Body 2: `When you understand that the sebaceous gland is embedded in the dermis alongside the follicle, you understand why you don't want to aggressively strip the scalp of oil. When you know the hydrolipid film is the scalp's first line of defense, you understand why gentle product selection matters. When a client asks why their hair is falling out after having a baby, you have a clear, calm answer that doesn't involve guessing.`
- Body 3: `Every module from here builds on this foundation. The scalp types in Module 5, the microscopy assessment in Module 4, the treatment protocols you'll develop — all of it will make more sense because you understand the biology underneath it.`
- Clinical note, label `Module 3 in practice`: `Before your next service, take a moment to mentally trace what you're doing layer by layer. Where are your hands stimulating circulation? What are you seeing at the follicle opening that tells you about sebaceous gland activity? What does the presence or absence of the hydrolipid sheen tell you about this client's scalp environment? This kind of intentional awareness is what separates a relaxing service from a genuinely skilled one.`
- Key point (→ icon): `**Quick reality check:** You will not think through anatomy step-by-step during a service. But it should be running in the background of every decision you make. That is the goal — not memorization, but internalization.`

### Checkpoint 2 (`cp2`) — see section 3 for full grading detail

- Label: `Final check`
- Displayed question (`.cp-q`): `In your own words — what is the hydrolipid film, why does it matter, and name one thing that can disrupt it that you've actually seen or experienced with a client (or yourself).`
- Placeholder: `Take your time with this one...`

### Completion card

- Gold mark: `✦`
- Title: `Module complete.`
- Subtitle: `The anatomy gives you the map.`
- Next-up label: `Up next — Module 4`
- Next-up text: `Module 4 teaches you how to read it — in real time, on a real scalp, before you've applied a single product. The microscope, the assessment process, and the decisions that come from actually looking.`
- Primary button: `Start Module 4 →`
- Secondary button: `Back to course`
- **Dead markup immediately after the buttons, inside the same completion-card div** (verbatim, not reformatted): `<div style="display:none">v>` followed by a second, unreachable `<button class="lc-btn" onclick="showHome()">Back to course →</button>`. See section 13, finding 5.

### Guide-panel quick prompts hardcoded in the static markup (distinct from `MODULE_QUICK_PROMPTS[3]` — see section 4 and section 13, finding 3)

- `TE vs normal shedding` → `What's the difference between telogen effluvium and normal shedding?`
- `Hydrolipid film` → `Can you explain the hydrolipid film again?`
- `Postpartum hair loss` → `Why does postpartum hair loss happen exactly?`
- `When to refer` → `When should I refer a client out for hair loss?`
- `Massage & circulation` → `How does scalp massage actually help follicle health?`

---

## 3. Module 3 checkpoints

Two required checkpoints (`MODULE_CHECKPOINTS['3'] = ['cp1', 'cp2']` —
bare IDs, the only module extracted so far that does not use the `mNcpX`
naming convention).

| Field | `cp1` | `cp2` |
|---|---|---|
| Label above question | `Check your understanding` | `Final check` |
| Displayed question (`.cp-q`) | `A client comes in saying her hair has been shedding heavily for about two months. She also mentions she had a bad flu six weeks ago and has been under a lot of stress at work. Based on what you just learned, what is the most likely explanation — and what would you say to her?` | `In your own words — what is the hydrolipid film, why does it matter, and name one thing that can disrupt it that you've actually seen or experienced with a client (or yourself).` |
| Placeholder | `Think it through and write your answer...` | `Take your time with this one...` |

### Do the displayed and evaluated questions match?

**No, for both checkpoints** — the same displayed-vs-evaluated mismatch
pattern already found and corrected in Modules 1 and 2.

`M3.questions.cp1` (`headspa-mastery.html:6518`):
> A client comes in saying her hair has been shedding heavily for about two months. She mentions she had a bad flu six weeks ago and has been under a lot of stress at work. Based on what you just learned, what is the most likely explanation — and what would you say to her?

This omits the word "also" from "She also mentions" — a minor wording
difference.

`M3.questions.cp2` (`headspa-mastery.html:6519`):
> In your own words — what is the hydrolipid film, why does it matter, and name one thing that can disrupt it that you have actually seen or experienced.

This drops "with a client (or yourself)" entirely from the end of the
displayed question — a more substantive omission, since the evaluator
never sees that the disruption may have been personally experienced by
the student rather than observed in a client.

### Complete grading prompt

Built in `submitCheckpoint()` from these pieces, concatenated in order —
identical composition mechanism to every module (see
`module-00-source.md` §4, §8 for the shared machinery):

1. **Base system** (`M3.system`, a function of the question `q`,
   `headspa-mastery.html:6521`):
   > You are Cadence, instructor of HeadSpa Mastery. Module 3 (Hair & Scalp Anatomy) checkpoint. Question: "{q}". Key concepts: scalp layers, follicle structure, anagen/catagen/telogen cycle, telogen effluvium (stress/illness-triggered, 2-4 months after trigger, usually temporary), postpartum hair loss (estrogen drop, begins 2-4 months postpartum), hydrolipid film (sebum-based barrier), what disrupts it (harsh surfactants, over-cleansing, stress, chemical processing), circulation and follicle health. Respond specifically to what they wrote. 3-5 sentences, direct and warm, no bullet points.

   `{q}` here is the (shorter/mismatched) `M3.questions[id]` value, not
   the displayed `.cp-q` text. The same base system + key-concepts string
   is used for **both** `cp1` and `cp2` — there is no per-checkpoint
   system prompt the way Module 1 (`M1.systems`) and the rewritten Module
   2 (`M2.systems`) now have.
2. `CADENCE_RESPONSE_CONSISTENCY_ANCHOR`, `CADENCE_SELECTIVE_MEMORY_INSTRUCTION`,
   and `APP_STATE.getCadenceMemoryContext(3, 'checkpoint')` — shared,
   unchanged.
3. Inside `evaluateCheckpointAnswer()`: `CADENCE_CHECKPOINT_TONE` and the
   generic ambiguous/partial/generic-answer instruction. **No
   Module-3-specific criteria block exists** — confirmed by reading the
   current `evaluateCheckpointAnswer()` function in full
   (`headspa-mastery.html:6242`–`6250`); the only checkpoint-specific
   special case that ever existed there (Module 2's phrase-regex
   trigger) was already removed in the Module 2 implementation step and
   nothing was added in its place for Module 3.
4. `CADENCE_FEEDBACK_MICRO_RULES` and `CHECKPOINT_EVAL_FORMAT` — shared,
   unchanged.

### Pass criteria

None beyond the shared generic instructions — Module 3 has no itemized
pass checklist, no explicit "do not fail for grammar/spelling" carve-out,
and no immediate-correction list. This is the same starting state Modules
0, 1, and 2 were all in before their respective audits.

### Revision / attempt / state behavior

Identical to every other module — governed entirely by the shared
`submitCheckpoint()`, `evaluateCheckpointAnswer()`,
`normalizeCheckpointEvaluation()`, `APP_STATE.setCheckpointResult()`,
`APP_STATE.captureCheckpointMemory()`, `APP_STATE._checkModuleComplete()`,
`resolveModuleCompletionUI()`, `renderCheckpointOutcomeLabel()`, and
`applyCheckpointInputState()` (full mechanics documented in
`module-00-source.md` §4). Both checkpoints use the **old two-argument
key-handler pattern**: markup calls `onkeydown="cpKey(event,'cp1')"` /
`cpKey(event,'cp2')`, which dispatches to the shared `cpKey(e,
moduleIdOrCpId, cpId)` function (`headspa-mastery.html:6380`) — when
`cpId` is `undefined` (2-arg call), it falls through to `submitCP(moduleIdOrCpId)`.
`submitCP(id)` (`headspa-mastery.html:6953`) is a thin wrapper:
`submitCheckpoint(3, id, M3.system, M3.questions[id])` — no custom
`errorMessage` 5th argument, so a network failure shows the shared
default text: `Cadence didn't respond — check your connection and try
again.`

**Dead code found:** a second, unused key handler `cpKey_m3(e, id)`
(`headspa-mastery.html:6956`) exists and correctly wraps `submitCP(id)`,
but nothing in Module 3's markup actually calls it — both textareas call
the older bare `cpKey(event, 'cpN')` pattern instead. See section 13,
finding 2.

### Accessibility

Neither checkpoint has any accessibility labeling: the voice buttons rely
on `title="Speak your answer"` only (no `aria-label`), the submit buttons
have no accessible name beyond the SVG icon, and neither `.cp-res` region
has `aria-live`. Same starting state Modules 0, 1, and 2 were all in
before their accessibility corrections.

---

## 4. Cadence context

### Module-specific guide context (`MODULE_GUIDE_SYSTEMS[3]`, `headspa-mastery.html:6595`, verbatim)

> You are Cadence — a mentor built from nearly two decades in the head spa industry. The student is in Module 3 (Hair & Scalp Anatomy): scalp layers, follicle structure, hair growth phases, telogen effluvium, postpartum hair loss, hydrolipid film, circulation. The visible shaft is not alive — the follicle is where health matters. If the student has cosmetology or esthetics training, build on what they know and connect it directly to scalp health and head spa practice. 3-5 sentences. No bullet points.

This is the same "mentor built from nearly two decades in the head spa
industry" framing already found and corrected in Module 2's pre-audit
guide system — Cadence claims personal industry experience here, which
conflicts with the "Cadence direction" / course-name global decision
(Cadence must not claim personal human work experience). Not yet
corrected for Module 3.

Composed at call time (`getGuideSystem()`) with the same
`CADENCE_RESPONSE_CONSISTENCY_ANCHOR` + `CADENCE_SELECTIVE_MEMORY_INSTRUCTION`
+ `getCadenceMemoryContext(3, 'guide')` additions used everywhere.

### Suggested prompts — two different sources (see section 13, finding 3)

**Dynamic (`MODULE_QUICK_PROMPTS[3]`, `headspa-mastery.html:6610`)** — this
is what actually renders in `#quickPs` any time `openModuleById(3)` runs,
because `updateGuideQuickPrompts(id)` unconditionally overwrites the
`#quickPs` container's `innerHTML`:
- `What is the hydrolipid film?`
- `How do I explain shedding to a worried client?`
- `What does massage actually do physiologically?`

**Static (hardcoded directly in Module 3's default HTML,**
`headspa-mastery.html:3030`–`3034`**)** — five buttons, a different set
of prompts and labels than the dynamic list above:
- `TE vs normal shedding` → `What's the difference between telogen effluvium and normal shedding?`
- `Hydrolipid film` → `Can you explain the hydrolipid film again?`
- `Postpartum hair loss` → `Why does postpartum hair loss happen exactly?`
- `When to refer` → `When should I refer a client out for hair loss?`
- `Massage & circulation` → `How does scalp massage actually help follicle health?`

### Module-open Cadence greeting (`headspa-mastery.html:6849`)

> Good to see you in Module 3 — this is where things start clicking. The biology is not just background knowledge, it is the reason every decision at the treatment bed makes sense.

### Memory tags (`MODULE_MEMORY_TAGS[3]`, `assets/js/headspa-state.js:135`)

```
3: ['anatomy-grounding', 'barrier-thinking', 'client-explanation']
```

### References to the old course name

`M3.system` (`headspa-mastery.html:6521`): `"You are Cadence, instructor of HeadSpa Mastery. Module 3 (Hair & Scalp Anatomy) checkpoint..."`

`MODULE_GUIDE_SYSTEMS[3]` does not itself name the course, but (as noted
above) frames Cadence as personally having "nearly two decades in the head
spa industry."

---

## 5. Current interactions

| Interaction | What the student does | Graded? | Persists? | Success/failure behavior | HTML IDs | Related JS |
|---|---|---|---|---|---|---|
| Read curriculum | Scroll and read | No | Read-percent tracked via scroll listener | Contributes 70% of progress-bar weight | `.lesson-wrap` sections | `setReadProgress` |
| Video intro | (Not currently functional) | No | No | Placeholder only — `Video coming soon` badge, no embed, clicking the play icon has no defined handler in the markup shown | `.video-block`, `.video-placeholder` | none |
| Cross-section diagram | View only | No | No | Static inline SVG, no interaction | `.diagram-wrap` | none |
| Checkpoint `cp1` | Free-text answer, submit | Yes (model-graded pass/fail, generic criteria only) | Yes — `checkpointMeta.cp1` | Status pill `Accepted`/`Needs revision`; pass required for module completion | `cp1`, `cp1In`, `cp1Btn`, `cp1Res` | `submitCP`, `cpKey`, `submitCheckpoint`, `evaluateCheckpointAnswer` |
| Checkpoint `cp2` | Free-text answer, submit | Yes (model-graded pass/fail, generic criteria only) | Yes — `checkpointMeta.cp2` | Status pill `Accepted`/`Needs revision`; pass required for module completion | `cp2`, `cp2In`, `cp2Btn`, `cp2Res` | `submitCP`, `cpKey`, `submitCheckpoint`, `evaluateCheckpointAnswer` |
| Voice input on checkpoints | Click mic, speak answer | N/A (fills textarea) | Only once submitted | Text populates the textarea | mic buttons inside `.cp-row` | `startVoice('cp1In'/'cp2In', this)` |
| "Start Module 4 →" | Click after completion | No | Navigates + sets `currentModule` | Opens Module 4 | inside `#lessonComplete` | `openModuleById(4)` |
| "Back to course" | Click after completion | No | Sets view to home | Returns to course home | inside `#lessonComplete` | `showHome()` |
| Guide panel (Cadence chat) | Open panel, ask a question or tap a quick prompt | No | Chat history in-memory only, capped at 16 | Streamed response or shared error fallback | `guideBtn`, `guidePanel`, `gpMsgs`, `gpInput`, `quickPs` | `toggleGuide`, `gpSend`, `qa`, `getGuideSystem` |

### Which interactions are graded / ungraded / persistent / completion-gating

- **Completion-gating (required):** `cp1` and `cp2` — both required
  (`MODULE_CP_COUNTS['3'] === 2`).
- **Graded but not completion-gating:** none.
- **Ungraded and non-persistent:** none — Module 3 currently has **no
  ungraded practice interaction at all**. The video intro and the
  cross-section diagram are both purely instructional/view-only, not
  interactive components in the sense Modules 0–2's practice exercises
  are.
- **Persistent:** only `checkpointMeta.cp1` / `checkpointMeta.cp2` (via
  the shared checkpoint machinery) and the general read-percent/
  scroll-position tracking every module has.

Module 3 is the first module extracted so far with **zero** ungraded
interactive/practice components — every other extracted module (0, 1, 2)
has at least one.

---

## 6. Completion behavior

### Exact completion requirements

- Both required checkpoints `cp1` and `cp2` must reach `status: 'passed'`
  (`MODULE_CHECKPOINTS['3'] = ['cp1', 'cp2']`).
- No read-percentage minimum.

### Completion message (`#lessonComplete`, also addressable as `m3Complete` via `data-also-id`)

- Gold mark: `✦`
- Title: `Module complete.`
- Subtitle: `The anatomy gives you the map.`

No separate eyebrow/status line and no distinct "competencies shown" line
— same pre-rewrite two-line pattern Modules 0, 1, and 2 all had before
their audits.

### Next-module language

- Next-up label: `Up next — Module 4`
- Next-up text: `Module 4 teaches you how to read it — in real time, on a real scalp, before you've applied a single product. The microscope, the assessment process, and the decisions that come from actually looking.`
- Primary button: `Start Module 4 →` → `openModuleById(4)`
- Secondary button: `Back to course` → `showHome()`
- Dead markup immediately following (see section 2 and section 13,
  finding 5): an unreachable second "Back to course →" button nested
  inside a broken `<div style="display:none">v>` tag.

### Relevant state and functions

Same shared completion path as every module —
`setCheckpointResult` → `_checkModuleComplete` → `resolveModuleCompletionUI`.
`resolveModuleCompletionUI` calls `getVisibleCompletionCard(moduleId)`,
which has a **hardcoded special case for module 3**
(`headspa-mastery.html:6064`–`6067`):
`const cardId = moduleId === 3 ? 'lessonComplete' : 'm' + moduleId + 'Complete';`
— this is the only module whose completion-card ID doesn't follow the
`mNComplete` convention, and the code has a special branch to compensate.
`canAccessModule(4)` requires `isModuleComplete(3)` — Module 3 is the sole
gate for unlocking Module 4.

---

## 7. Accessibility behavior (module-wide)

- **Neither checkpoint has accessibility labels** — no `aria-label` on the
  voice or submit buttons, no `aria-live` on `.cp-res` (see section 3).
- **The video-intro placeholder** has no interactive semantics — it is a
  static, non-functional visual block (play icon with no click handler
  wired in the markup, "Video coming soon" badge).
- **The inline SVG cross-section diagram has no accessible text
  equivalent** — no `<title>`/`<desc>` inside the SVG, no `aria-label`,
  and no alt-text-equivalent summary of what the diagram shows for a
  screen-reader user. The only text description is the visual
  `.diagram-label` ("Scalp anatomy — cross section"), which is a sighted
  caption, not a structured accessible description of the diagram's
  content or labels.
- **The four `.clinical-photo.placeholder` blocks** (one in section 2, one
  in section 4, two in the section-5 photo pair) use a generic decorative
  SVG icon plus visible text labels/sub-labels — since no real `<img>` is
  present yet, there is no alt-text question to resolve today, but this
  will need attention once real photos are added (the `.clinical-photo
  img` CSS rule already exists, confirming the component is designed to
  hold a real image later).

---

## 8. Mobile / interaction concerns visible from the implementation

- The cross-section SVG is set to `width:100%` with a fixed `viewBox`, so
  it should scale proportionally on narrow viewports, but the label
  density (14 separate text callouts plus leader lines packed into a
  680×520 canvas) has not been checked at mobile width in this extraction
  pass — flagged, not verified.
- No explicit touch-target sizing was found for any interactive element in
  this module beyond the standard checkpoint/voice/submit buttons already
  documented for other modules — not measured against a specific minimum
  in this extraction.
- No `prefers-reduced-motion` handling exists in this module (there is no
  animation to gate in the current static/inline-SVG presentation, so this
  is a non-issue today but would become relevant if the proposed PNG
  replacement or any future interaction introduces motion).

---

## 9. Distinct learning-rhythm assessment

Per `00-global-decisions.md` → "Varied learning rhythm." This is a
first-pass content assessment only — nothing here is a decision or a
redesign.

- **Current interaction density:** **Light.** Beyond the two required
  checkpoints, there is no interactive component at all — no practice
  exercise, no quiz, no accordion, no comparison, no build-a-response
  exercise. The module is read-and-answer only.
- **Current signature learning moment:** The hair growth cycle phase
  timeline (Anagen/Catagen/Telogen/Exogen) is the clearest candidate — it
  is the most structurally distinct piece of content in the module (a
  4-step sequence with percentages and durations) and it directly powers
  the client-facing payoff used throughout the rest of the module
  (explaining normal vs. concerning shedding). The cross-section diagram
  is the most visually distinct element but is currently presented as a
  static, non-interactive reference image rather than a moment the
  student actively works through.
- **Does the module currently feel meaningfully different from Modules
  0–2?** Structurally, yes — it is the only one of the four extracted
  modules built from continuous instructional sections with zero
  ungraded practice interactions, a video-intro block none of the others
  have, and an inline diagram none of the others have. Experientially,
  it reads as a denser, more textbook-style module than 0–2, which each
  have at least one applied/practice moment breaking up the reading.
- **Would a midpoint checkpoint improve learning?** Worth considering —
  the module currently front-loads foundational structure content
  (layers, follicle, growth cycle) before the more client-facing,
  judgment-relevant content (hair loss conditions, referral language,
  hydrolipid film, circulation). `cp1` currently arrives only after the
  hydrolipid section (roughly two-thirds through the module), and `cp2`
  arrives at the very end. Not evaluated further here — this is a
  question for the approved spec, not a decision made in this
  extraction.
- **Learning-mode fit by concept (observations only):**
  - Scalp layers / cross-section: visual exploration and labeling — the
    module already presents this visually; it is not currently
    interactive (no click-to-reveal-layer, no self-test on the labels).
  - Growth cycle phases: sequencing and recall — currently presented as a
    static ordered list; no predict-then-reveal or retrieval-practice
    element exists today.
  - Hair loss conditions (telogen effluvium vs. postpartum vs. refer-out):
    scenario judgment — this is the most "decide what you'd do" content
    in the module, and it currently has no interaction attached to it at
    all, despite being well suited to one (comparable to Module 1's
    "Where is the line?" or Module 2's "What breaks the moment?").
  - Hydrolipid film / what disrupts it: explanation and cause-effect
    reasoning — currently presented as prose plus a static two-column
    grid; no interaction.
- **Where Cadence currently adds value:** the in-line "From Cadence" notes
  reframe textbook facts into practitioner judgment ("they see oil and
  assume 'dirty'... treat based on the symptom instead of the cause") and
  into honest client-facing framing ("I can't promise this will regrow
  your hair..."). The guide panel's dynamic quick prompts also point at
  the module's more applied questions (explaining shedding to a worried
  client, what massage actually does).
- **Where the student should reason independently:** the module does not
  currently ask the student to reason independently before receiving an
  answer anywhere except the two checkpoints — every other concept
  (layers, phases, disruption causes) is explained directly with no
  predict-first or judge-first framing.
- **Any interaction that feels decorative rather than educational:** none
  currently exist to evaluate — flagged as an absence, not a decorative
  interaction to remove.

---

## 10. Insider-value assessment

Per `00-global-decisions.md` → "Insider knowledge and accelerated
mastery." First-pass content assessment only — nothing here is a
decision or a rewrite.

- **Strongest current insider knowledge:** the reframing of massage from
  "relaxation filler" to a physiologically grounded, consistency-dependent
  step ("If you understand circulation, you don't rush the massage...
  pressure becomes inconsistent. The step loses its purpose") and the
  diagnostic-reasoning note about misreading symptoms ("A client with
  flaking, a tight scalp, and no visible oil does not need a clarifying
  shampoo. She needs barrier support").
- **Practical decision rules already present:** the explicit refer-out
  criteria for hair loss (patchy/circular/asymmetric loss, smooth bald
  patches, scarring, eyebrow/eyelash involvement, rapid worsening with no
  identifiable stressor) and the accompanying non-alarming referral
  script are genuinely practitioner-useful, ready-to-use material.
- **Subtle details a beginner would likely miss:** that the visible hair
  shaft is dead keratin and "not the patient" (the follicle is); that
  telogen effluvium shedding begins two to four months *after* the
  triggering stressor, not during it (a beginner might not connect a
  months-old illness to shedding happening now); that postpartum shedding
  is a telogen-effluvium subtype specifically caused by an estrogen drop,
  not a separate phenomenon.
- **Mistakes this module can prevent:** treating a flaky, tight, low-oil
  scalp with a clarifying/stripping product when it actually needs
  barrier support; alarming a postpartum client instead of normalizing an
  expected, temporary pattern; promising hair-regrowth outcomes from
  massage or scalp service (the module explicitly warns against this
  twice); missing referral-worthy presentations (patchy/scarring loss)
  because they were treated as routine shedding.
- **How this reduces trial and error:** the refer-vs-treat criteria and
  the two named common conditions (telogen effluvium, postpartum) give a
  new practitioner an immediate decision framework for the two hair-loss
  conversations they will have most often, rather than needing to
  encounter and misjudge these cases in real services first.
- **Sections that currently read more like generic textbook anatomy than
  practitioner-useful knowledge:** Section 2's layer-by-layer structural
  description (fascia superficialis, epicranial aponeurosis, pericranium,
  skull bone) is presented largely as anatomical inventory — the module
  does not yet connect most of these individual layers to a specific
  service decision the way it does for the dermis/sebaceous gland
  relationship and the subcutaneous/circulation relationship. Section 3's
  keratin/dermal-papilla description is similarly close to textbook
  phrasing before it pivots to the practitioner-relevant "shaft is
  cosmetic, follicle is what matters" distinction.
- **Opportunities to connect anatomy directly to observable scalp or
  service decisions (present, not proposed):** the module already does
  this well in a few places (sebaceous-gland-to-oil-production,
  hydrolipid-film-to-symptom-misreading, circulation-to-massage-
  consistency) — these three connections are the clearest existing
  examples of anatomy translated into a service decision, and could serve
  as the pattern for tightening the more textbook-feeling sections
  identified above. Not a proposal to act on in this extraction.

---

## 11. Guided Completion Path fields

Per `00-global-decisions.md` ("Guided Completion Path" → "Required fields
for every future module audit"). All time estimates below are **unmeasured
approximations derived from content volume**, not timed/tested figures.

- **Estimated attentive learning time:** Module 3's always-visible body
  text (all eight sections, the phase timeline, the three condition
  cards, the info-card grid, all Cadence notes and key points) is
  approximately 1,750 words — the longest of the four modules extracted
  so far. A careful, attentive read is roughly **11–14 minutes**.
  Unmeasured.
- **Estimated checkpoint time:** `cp1` asks for a diagnosis-style
  explanation plus a client-facing response; `cp2` asks for a definition,
  significance, and personal/observed example. Together, likely **6–9
  minutes** to compose both, plus any revision time. Unmeasured.
- **Estimated hands-on or application time:** none required by the
  current curriculum — this module is entirely conceptual/anatomical, not
  a physical technique. There is no practice exercise of any kind (see
  section 9).
- **Competency demonstrated:** the student can explain scalp anatomy
  (layers, follicle, growth cycle) well enough to differentiate normal
  shedding from telogen effluvium and postpartum hair loss, articulate
  the hydrolipid film's role in common scalp imbalances, and connect
  circulation to massage technique — without overstating what a head spa
  service can medically achieve.
- **Suggested practice or application task:** none currently exists in
  the module. The clearest untapped candidate (not a proposal, an
  observation) is the hair-loss-conditions section — a scenario-judgment
  exercise (telogen effluvium vs. postpartum vs. refer-out) would mirror
  the practice-interaction pattern already established in Modules 1 and 2.
- **Earlier concepts that should be revisited:** Module 1's referral
  language and scope framing ("recognize when a cosmetic service is not
  the answer and respond professionally") directly underlies this
  module's refer-out criteria and non-alarming referral script. Module
  2's consent/privacy framing is not directly revisited here.
- **Suggested position in the Guided Completion Path:** fourth — follows
  the Welcome Module, Module 1, and Module 2; precedes Module 4
  (microscopy/assessment, which the module's own closing section
  explicitly sets up: "Module 4 teaches you how to read it — in real
  time, on a real scalp"); precedes the Module 12 Final Exam that all
  pacing leads toward.

---

## 12. Listen Mode planning fields

First-pass content assessment only — no prior decision record defines
Listen Mode's implementation; nothing here is authorized for building.
Wording below describes the *current* module exactly as written — nothing
has been corrected or improved for this section.

- **Whether narration is appropriate:** Largely yes for the prose
  sections (foundation, follicle, growth cycle narrative, hair-loss
  condition cards, hydrolipid film, circulation, putting-it-together) —
  this content is conceptual/explanatory and does not depend on seeing
  anything to be understood in words. The cross-section diagram section
  is the clear exception (see below).
- **Approximate narration length:** Using the ~1,750-word total and a
  ~150 words/minute pace, full narration of all currently-visible text is
  approximately **11–12 minutes**. This does not include the checkpoint
  questions, and is an unmeasured, word-count-derived estimate.
- **Sections requiring visual-review cues:** The cross-section diagram
  (section 2) is the clearest case — the entire point of that section is
  a labeled visual, and narrating "epidermis, dermis, subcutaneous layer"
  as a list would lose the spatial relationship the diagram is built to
  show. The phase timeline (section 4) is secondary — it is currently a
  simple ordered list and could likely be narrated linearly without much
  loss, but a visual-review cue would still help a listener orient to the
  four-phase structure. The two photo-pair "example" placeholders
  (section 5) and the two other clinical-photo placeholders (sections 2
  and 4) are not yet populated with real images, so there is nothing to
  cue toward today — this will need revisiting once real photos exist.
- **Content that should remain video-only:** None currently — the
  module's own "Module intro" video block is a placeholder
  ("Video coming soon"), not populated content, so there is nothing to
  assess as video-only material yet.
- **Whether any interaction or checkpoint prevents audio-only
  completion:** The two required checkpoints (`cp1`, `cp2`) require a
  typed or voice-dictated free-text response either way, consistent with
  every other module's checkpoint pattern — this alone does not block
  audio-only progress through the instructional content. However, full
  comprehension of Section 2 specifically depends on seeing the labeled
  diagram; an audio-only pass would need the diagram's structure and
  labels narrated explicitly (not just cued) to be complete, which is a
  larger lift than the visual-review-cue pattern used for other modules'
  interactive components.

---

## 13. Confirmed implementation concerns

Flagged only — nothing here has been fixed.

### Confirmed

1. **The AI grading prompt does not see the exact question the student
   read**, for both checkpoints. `cp1`'s evaluated question drops the
   word "also"; `cp2`'s evaluated question drops "with a client (or
   yourself)" entirely. Same pattern already flagged and corrected for
   Modules 1 and 2.
2. **Dead key-handler function.** `cpKey_m3(e, id)`
   (`headspa-mastery.html:6956`) is fully wired to call `submitCP(id)`
   correctly, but nothing in Module 3's markup calls it — both
   checkpoint textareas use the older, generic `cpKey(event, 'cpN')`
   2-argument pattern instead, which is handled by a separate shared
   function (`headspa-mastery.html:6380`).
3. **Two different sets of Cadence quick prompts exist for Module 3** —
   five prompts/labels hardcoded directly into the static HTML
   (`headspa-mastery.html:3030`–`3034`) versus three different prompts in
   `MODULE_QUICK_PROMPTS[3]`. Because `updateGuideQuickPrompts(id)` runs
   unconditionally inside `openModuleById()` and unconditionally
   overwrites `#quickPs`'s `innerHTML`, the dynamic three-prompt set is
   what a student actually sees any time `openModuleById(3)` executes —
   the hardcoded five-prompt set would only be visible if a student
   somehow viewed Module 3 without `openModuleById` ever having run for
   any module, which was not confirmed to be reachable in this
   extraction pass (see "Assumptions" below).
4. **Vestigial `data-also-id` attribute.** The completion card carries
   `data-also-id="m3Complete"` (`headspa-mastery.html:2992`), but no code
   in the file reads or references `data-also-id` anywhere — the actual
   mechanism that lets shared completion code find Module 3's completion
   card is a hardcoded `moduleId === 3` special case inside
   `getVisibleCompletionCard()` (`headspa-mastery.html:6064`–`6067`), not
   this attribute.
5. **Broken/dead markup inside the completion card.** Immediately after
   the two real completion buttons, the markup contains
   `<div style="display:none">v>` — an apparent leftover/mistyped
   fragment — followed by a second, unreachable
   `<button class="lc-btn" onclick="showHome()">Back to course →</button>`
   nested inside it (`headspa-mastery.html:3002`–`3004`). Because the
   wrapping div is `display:none`, this is inert in the current build,
   but it is malformed/dead HTML sitting inside production markup.
6. **No real images exist anywhere in Module 3 today.** All five
   "photo"-style elements (the two in the section-5 photo pair, the one
   in section 2, the one in section 4) use `.clinical-photo.placeholder`
   with a generic decorative SVG icon and text labels — none have an
   `<img src>`. The scalp cross-section is a fully inline, hand-authored
   SVG, not an image file at all (see section 2 for full detail). The
   `assets/images/course/module-03/aimt-scalp-cross-section.png` file
   added to the repo in the prior step is a **proposed** replacement for
   the inline SVG specifically — it is not currently referenced by any
   of the five placeholder photo slots, and its anatomical/label accuracy
   has not been verified.
7. **Unusual placeholder-before-body ordering in Section 4.** Every other
   placeholder/photo element in this module appears after its
   introductory body text; the Section 4 "Hair Growth Cycle" placeholder
   photo appears between the section title and the section's body
   paragraph, breaking the pattern used everywhere else in the module.
8. **Module 3 has no wrapper `<div id="module3Wrap">`** and is instead
   the default content of `.lesson-wrap` captured into `module3HTML` at
   `DOMContentLoaded` — structurally different from every other module
   extracted so far (0, 1, 2), each of which is a dedicated hidden
   template div swapped in by `STATIC_MODULES[id]`.
9. **Checkpoint IDs `cp1`/`cp2` do not follow the `mNcpX` convention**
   used by every other module (`m0cp1`, `m1cp1`/`m1cp2`, `m2cp1`) —
   `MODULE_CHECKPOINTS['3'] = ['cp1', 'cp2']` uses bare IDs.
10. **Old course name present.** `M3.system`
    (`headspa-mastery.html:6521`) still says "You are Cadence, instructor
    of HeadSpa Mastery." `MODULE_GUIDE_SYSTEMS[3]` frames Cadence as
    personally having "nearly two decades in the head spa industry,"
    matching the same personal-experience-claim pattern already
    corrected in Module 2.
11. **No accessibility labels on either checkpoint** — no `aria-label` on
    the voice or submit buttons, no `aria-live` on either `.cp-res`,
    matching the pre-audit state already found and corrected in Modules
    0, 1, and 2.
12. **Completion card has no distinct competency-naming line** — same
    pre-rewrite two-line pattern (title + single subtitle) that Modules
    0, 1, and 2 all had before their audits.
13. **No ungraded practice interaction exists anywhere in Module 3**
    (see section 5), despite the hair-loss-conditions section being
    well-suited to a scenario-judgment interaction similar to Module 1's
    "Where is the line?" and Module 2's "What breaks the moment?"

### Assumptions (not independently verified in this pass)

- It's assumed that a real student's very first view of Module 3 (before
  any call to `openModuleById` for any module — e.g., if Module 3's
  default HTML is shown immediately on initial page load prior to the
  app's normal entry/routing flow) could theoretically show the
  hardcoded five-prompt quick-prompts list before it gets overwritten —
  this was not independently re-traced against the full app entry
  sequence (`showApp()`, `enterPurchasedCourseHome()`, resume logic,
  etc.) in this extraction pass, only the routing behavior inside
  `openModuleById()` itself was confirmed.
- It's assumed the video-intro block's play icon has no click handler
  because none was found in the markup read for this extraction — a
  handler could theoretically be attached elsewhere via a selector-based
  listener not tied to an inline `onclick`; this was not exhaustively
  ruled out by searching the entire script for a `.vp-play` or
  `.video-placeholder` click listener.
- The proposed replacement image's dimensions (2304×1852) and file size
  (~7.2MB) were read directly from the file on disk; whether that
  resolution/weight is appropriate for the eventual use case (background
  image, full-width diagram, etc.) depends on decisions not yet made and
  is explicitly deferred to the Module 3 audit.
- The Guided Completion Path and Listen Mode estimates in sections 11–12
  are content-volume-derived approximations, explicitly not measured/
  timed figures — restated here for emphasis.

---

## 14. Source map

| Section | Source file | Line range / marker | Related functions | Related state properties |
|---|---|---|---|---|
| Module identity constants | `headspa-mastery.html` | 5933 (`MODULE_CHECKPOINTS['3']`), 5965 (`MODULE_TITLES[3]`) | — | — |
| Module 3 default content (video, hero, all 8 sections, both checkpoints, completion) | `headspa-mastery.html` | 2361–3006 (default `.lesson-wrap` content inside `#lessonView`) | `module3HTML` capture (`:7967`), `STATIC_MODULES[3]` (`:6806`) | — |
| Cross-section diagram (inline SVG) | `headspa-mastery.html` | 2424–2690 (`.diagram-wrap`) | — (no JS) | — |
| Phase timeline | `headspa-mastery.html` | 2737–2769 (`.phase-timeline`) | — (no JS) | — |
| Hair-loss condition cards | `headspa-mastery.html` | 2800–2857 (`.condition-cards`) | — (no JS) | — |
| Checkpoint 1 markup | `headspa-mastery.html` | 2901–2917 (`#cp1`) | `submitCP`, `cpKey` | `checkpointMeta.cp1` |
| Checkpoint 2 markup | `headspa-mastery.html` | 2973–2989 (`#cp2`) | `submitCP`, `cpKey` | `checkpointMeta.cp2` |
| Completion card markup | `headspa-mastery.html` | 2992–3004 (`#lessonComplete`) | `resolveModuleCompletionUI`, `getVisibleCompletionCard` | `progress['3'].complete`, `.completedAt` |
| Hardcoded guide quick-prompts (static) | `headspa-mastery.html` | 3029–3035 (`#quickPs` initial markup) | — | — |
| `M3` object (questions + grading system) | `headspa-mastery.html` | 6516–6522 | `submitCP` | — |
| `submitCP` / `cpKey_m3` (unused) | `headspa-mastery.html` | 6952–6958 | — | — |
| Shared `cpKey` (old 2-arg pattern, actually used) | `headspa-mastery.html` | 6380–6390 | — | — |
| `MODULE_GUIDE_SYSTEMS[3]` | `headspa-mastery.html` | 6595 | `getGuideSystem` | — |
| `MODULE_QUICK_PROMPTS[3]` (dynamic) | `headspa-mastery.html` | 6610 | `updateGuideQuickPrompts` | — |
| `updateGuideQuickPrompts` | `headspa-mastery.html` | 6739–6747 | — | — |
| `getVisibleCompletionCard` (module-3 special case) | `headspa-mastery.html` | 6064–6067 | `resolveModuleCompletionUI` | — |
| Module-open Cadence greeting for module 3 | `headspa-mastery.html` | 6849 (inside `openModuleById`'s `greetings` map) | `openModuleById` | — |
| Course home markup (module list row 3) | `headspa-mastery.html` | 2303 | `renderHomeProgress` | `progress['3']` |
| `MODULE_MEMORY_TAGS[3]` | `assets/js/headspa-state.js` | 135 | `getCheckpointMemoryTags`, `getModuleFocusTags` | `student.cadenceMemory` |
| Diagram / clinical-photo / phase-timeline / condition-card CSS | `headspa-mastery.html` | ~217–234 (video), ~372–373 (diagram), ~1910–1945 (clinical photo) | — | — |
| Shared checkpoint machinery (`submitCheckpoint`, `evaluateCheckpointAnswer`, `normalizeCheckpointEvaluation`, `APP_STATE.setCheckpointResult`, etc.) | `headspa-mastery.html`, `assets/js/headspa-state.js` | See `module-00-source.md` §4, §8 for exact line numbers | — | — |
| Proposed replacement image (not yet referenced) | `assets/images/course/module-03/aimt-scalp-cross-section.png` | — | — | — |
