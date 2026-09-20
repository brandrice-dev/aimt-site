# Module 9 — Listen Mode Script (v4, strict-fidelity rebuild)

**Status:** Ready for owner fidelity review. NOT ready for ElevenLabs
generation — awaiting owner sign-off on this text first. Written against
live `#module9Wrap` (`headspa-mastery.html`, lines 9664–10007, read fresh
and in full 2026-09-17/18), superseding v3 (owner review found remaining
targeted violations — see "What v4 corrects" below) and v2 (**REJECTED**
by the owner — archived at
`docs/course-audit/listen-mode/archive-loose-v1/module-09-listen-script-v2-REJECTED.md`,
with its own rejected audit at
`module-09-fidelity-coverage-audit-v2-REJECTED.md`, and v1 further back at
`module-09-listen-script-v1.md` — nothing deleted).

**Why v2 was rejected:** systemic fidelity drift, not a narrow defect. v2's
interaction reveal-timing fix and checkpoint-language fix were structurally
correct, but underneath that, list items, qualifying clauses, and even
whole trailing sentences of body text and client-facing scripts were
silently thinned or dropped throughout — most heavily in the back half of
the module (9.4 onward), the exact "gets looser near the end" pattern
Section G of the editorial standard exists to catch. See the coverage
audit's "Concrete drift found in rejected v2" table for the full,
line-by-line accounting — every drop found there is corrected in v3 and
remains corrected in v4.

**What v4 corrects (v3 was closer but still incomplete):** v3 restored
every dropped *list item*, but the owner found a distinct second failure
mode — visible **teaching architecture** (the module's own title/tagline,
a section headline, labeled notes/callouts, a resource card) not spoken
at all, even where the factual content beneath it was otherwise present.
Eight targeted fixes, no other content touched:
1. M9-01 now speaks the module title and tagline, not just the desc/bullets/attention-note.
2. M9-05 now speaks the 9.4 headline ("Cost base to target price"), not just the eyebrow.
3. M9-05 now opens with the live page's own instruction ("Enter your own numbers — real or illustrative...") before explaining what the calculator does, instead of skipping straight to the explanation.
4. M9-05 now names all 4 calculator input labels explicitly.
5. Four labeled beats restored as spoken labels, not silently folded away: "Business note" (9.4), "Service design note" (9.6), "Practitioner note" (9.7), "Remember" (9.8) — plus "Key point" (9.3), found on the same re-check.
6. M9-06 now narrates the "Head Spa Enhancement Strategy Guide" card's title and body (the card's existence and description, not the PDF's unseen contents) — this was a flagged, undefended gap in v3, now closed.
7. M9-02's quoted Module 8 closing line now preserves "the area or service priority you addressed" (the live page's actual bracketed instruction) instead of narrowing it to "this area."
8. Full headline/label re-accounting against live DOM — see the coverage audit.

**Standard applied:** the Module 4/5/6 controlling precedent
(`module-04-fidelity-coverage-audit.md`, `module-05-...`, `module-06-...`)
— **not** the older "concept represented" compression allowance. The test
for every substantive element is: *did the listening student actually
receive the substantive information visible in the lesson* — not whether
the general idea was gestured at. Numbers, counts, qualifiers, and named
items are not compressed or approximated. A visible "From Cadence"-style
label is adapted to first person; substantive content stays intact. Only
true UI chrome is excluded (see the audit's exclusion list).

**Checkpoint ids on this module (`m10cp1`, `m10cp2`) carry their
historical prefix from the course-audit-build 9↔10 module reorder** —
confirmed fresh this pass at `headspa-mastery.html:12761-12766`
("m10cp1/m10cp2 — historically named; now belong to student-facing
Module 9... after the course-audit-build 9<->10 reorder") and
`submitM10CP()` calling `submitCheckpoint(9, id, ...)` — moduleId `9` is
the literal argument. Not renamed, per `docs/AIMT-AUDIT-RULES.md`.

**Curriculum authority:** Sections 9.1–9.9, one 6-option "Close Without
Pressure" ungraded reflection interaction, an interactive cost/pricing
calculator (concept narrated — no correct answer to spoil, so Section I's
reveal-timing rule does not apply to it), two checkpoints (`m10cp1`,
`m10cp2`), one completion card.

**Player segments (11 narration chunks + 6 interaction-feedback
branches):** Opening (briefing) → 9.1 → [Close Without Pressure:
interaction-stop + 6 feedback branches] → 9.2–9.3 → 9.4–9.5 → 9.6–9.7 →
Checkpoint 1 (`m10cp1`) → post-pass + 9.8 → 9.9 → Checkpoint 2 (`m10cp2`)
→ post-pass recap/handoff. (Same chunk boundaries as v2 — that structure
was sound; the defect was content compression within chunks, not
placement.)

**Reference Voice landmarks:** the checkout shape/sequence and all 5
platform-neutral checkout items (9.1); the "Close Without Pressure" six
option labels and their six feedback texts, verbatim (9.1 interaction);
all 4 real-cost inputs, full definitions (9.2); the markup-vs-margin
worked example (9.3); the 9.4 opening instruction, all 4 calculator input
labels, and the calculator's full business-note caveat, all 5 items
(9.4); the full 6-item market-context list (9.5); the full 7-item
differentiation list and both "don't" clauses (9.6); the full 6-item
enhancement definition and 7-item recommendation-basis list, all 3
practitioner-note "don't" clauses, all 5 enhancement examples with their
exact, unreordered client language, and the Enhancement Strategy Guide
resource card's title and body (9.7); the full 9-item
price-objection-causes list and all 7 "afterward" review questions,
including the final two (9.8); the full 8-item underpricing-causes list
and full 4-item "why this matters" list (9.9).

---

## The script

### M9-01 — Module Briefing (spoken)
**VOICE:** Teaching. **gateType:** normal. **FIXES v4:** module title ("Checkout, Client Closing & Pricing Strategy") and tagline ("Close the experience as intentionally as you opened it.") now explicitly spoken — v3 covered the desc/bullets/attention-note but never spoke the title or tagline themselves.

> Welcome to Module 9 — Checkout, Client Closing and Pricing Strategy. Close the experience as intentionally as you opened it.
>
> The treatment is done — what happens next, how you close the appointment and how you price what you do, is its own skill. This module is a business decision lab: less about performing, more about deciding, from real numbers and calm communication.
>
> Here's what's ahead: you'll close the appointment as intentionally as you opened it. You'll know your real costs, and the difference between margin and markup. You'll price a service using market context, not copycat pricing. You'll design a menu and enhancements that actually earn their place. And you'll respond calmly and confidently when a client says the price felt high.
>
> [warmly] Pay attention to this: pricing conversations go wrong far more often from how they're delivered than from the number itself.

### M9-02 — 9.1 From treatment close to checkout
**SOURCE:** 9.1's full checkout shape, all 3 body paragraphs in full, the Rebooking key-point, and all 5 platform-neutral checkout items. **VOICE:** Teaching for the framing; Reference for the shape sequence and the platform-neutral checkout list. **gateType:** normal. **FIXES v4:** the quoted Module 8 closing line now preserves "the area or service priority you addressed" (the live page's actual bracketed placeholder) — v3 narrowed this to "this area," dropping "service priority" as an option.

> Section 9.1 — From treatment close to checkout. The moment isn't over when the treatment is.
>
> Module 8 ends with one line: "Today I focused a little more on the area or service priority you addressed — how are you feeling?" That's a treatment-closing observation, not a business conversation. What happens after it — checkout, questions, whether to book again — is this module's subject.
>
> Here's the shape, not a script: reorient, then briefly recap, then answer or recommend where relevant, then invite future options without pressure, then complete checkout. This is not a rigid or exact universal order — treat it as a shape you move through naturally, not a script to recite.
>
> Give the client a moment to reorient before you speak further. A quiet, relaxation-first service shouldn't end with an abrupt shift into a rapid sales pitch — speak at a normal, calm pace.
>
> Recap only what you genuinely did during the service. Don't diagnose. Don't exaggerate results — a short, honest sentence is more credible than an impressive one.
>
> Answer questions clearly, but don't unload every possible recommendation at once. A recommendation should have a specific reason tied to the service you just delivered — not exist because it's on the menu. And the flow has to work cleanly for a client who says no to everything — retail, enhancements, rebooking. Declining should never create awkwardness.
>
> [slowly] Remember: rebooking is an available next step, not proof you successfully "closed." If a client wants to plan another visit, help them choose the service or timing that fits their goals, preferences, and schedule — don't teach yourself a universal treatment frequency just to manufacture a future booking.
>
> And checkout itself stays platform-neutral. Confirm what the client is paying for. Communicate the total clearly. Process payment through your business's own normal system. Provide a receipt or confirmation as appropriate. And if your business accepts gratuity, keep the presentation neutral. This course doesn't teach a specific point-of-sale platform, and gratuity is never mandatory or a fixed percentage — both are business decisions.

### M9-03 — Close Without Pressure (interaction prompt + options)
**SOURCE:** the interaction's prompt and all six option labels, verbatim, unchanged from v2 (this part of v2 was already correct — see audit). **VOICE:** Teaching for the framing, Reference (word-for-word) for the six options — no verdict, no hint at which option is strongest. **gateType:** `interaction-stop`. **interactionId:** `m9CwpDecision`. **interactionOptionsSelector:** `.bq-opt` (default).

> Close without pressure — choose the response that keeps the experience intact.
>
> A client has just finished an Extended-format Head Spa service. She's sitting up, taking a slow breath, reorienting to the room. Which response best moves toward checkout without breaking the experience you just built? Six possible responses are on screen.
>
> One: "Take your time. Today I focused a little more on your neck and shoulders — how are you feeling? Whenever you're ready, I can walk you through checkout, and if you'd like to talk about coming back or anything else, I'm happy to."
>
> Two: "That was amazing, right? Before we head to checkout, let's go ahead and get your next appointment booked — I have an opening next week that would be perfect."
>
> Three: "So today I started with the aromatherapy blend, then dry brushing to prep the scalp, then the halo massage with the heated water system, then the exfoliant, then neck and shoulder work, then a deep conditioning mask while I did your hands and arms, then a full rinse, then a cooling mist — that's everything we did today."
>
> Four: "Your scalp was pretty congested today, especially at the crown — that's something to keep an eye on. I really worked on clearing that up for you."
>
> Five: "You should definitely add the deep conditioning upgrade next time, and I'd recommend the scalp serum for home care, and you should really come back in two weeks to keep this going."
>
> Six: "I should mention this time slot is really hard to get, so if you want to lock in the same time next month, you'd want to decide before you leave today."
>
> Choose the response you think best preserves the experience.

#### M9-03-fb0 — feedback for option 1 (strongest response)
**SOURCE:** `M9_CWP_ANSWER.feedback[0]`, verbatim, re-verified fresh against live JS this pass. **gateType:** interaction feedback branch, `optionIndex: 0`.

> This keeps the shape from 9.1: a moment to reorient, a concise truthful recap, an open door for questions, and an invitation to future options without pressure — nothing here is being pushed.

#### M9-03-fb1 — feedback for option 2
**SOURCE:** `M9_CWP_ANSWER.feedback[1]`, verbatim. **gateType:** interaction feedback branch, `optionIndex: 1`.

> This skips reorientation and jumps straight into booking before the client has had a moment to settle. Give the recap and the reorientation moment first — sales pressure, even friendly-sounding pressure, is still pressure.

#### M9-03-fb2 — feedback for option 3
**SOURCE:** `M9_CWP_ANSWER.feedback[2]`, verbatim. **gateType:** interaction feedback branch, `optionIndex: 2`.

> This recites the entire service back step by step instead of a concise, genuine recap. A brief acknowledgment of what mattered is enough — narrating everything can feel like a performance report, not a closing conversation.

#### M9-03-fb3 — feedback for option 4
**SOURCE:** `M9_CWP_ANSWER.feedback[3]`, verbatim. **gateType:** interaction feedback branch, `optionIndex: 3`.

> "Congested" states a conclusion about the client's scalp rather than describing what was done. Recap what you did, not a diagnosis of what you found.

#### M9-03-fb4 — feedback for option 5
**SOURCE:** `M9_CWP_ANSWER.feedback[4]`, verbatim. **gateType:** interaction feedback branch, `optionIndex: 4`.

> Retail, home care, and rebooking are all offered in one breath. A recommendation should have a specific reason tied to the service you just delivered — and shouldn't be unloaded all at once.

#### M9-03-fb5 — feedback for option 6
**SOURCE:** `M9_CWP_ANSWER.feedback[5]`, verbatim. **gateType:** interaction feedback branch, `optionIndex: 5`.

> Implying the client needs to decide immediately creates artificial urgency. Future options should be offered without pressure — the client can always call to book.

### M9-04 — 9.2 Know the real cost + 9.3 Margin vs. markup
**SOURCE:** all 4 cost-input cards in full (term + sub + full definition, including the two sentences v2 dropped) + the full markup/margin worked example. **VOICE:** Reference throughout. **gateType:** normal. **FIXES v4:** the 9.3 "Key point" eyebrow is now spoken as a labeled beat ("Key point: ...") — found on the re-check triggered by the same defect pattern as Business note/Service design note/Practitioner note/Remember below, not separately flagged by the owner but corrected for consistency.
**FIXES v2:** card 3 ("Practitioner time") restores its dropped closing sentence, "Account for your own full time — not someone else's ratio." Card 4 ("Desired profitability") restores its dropped opening clause, "How much margin you want is not a course-prescribed number."

> Section 9.2 — Know the real cost. Four inputs — not a rigid formula, a way of thinking. Real cost isn't a guess, and it isn't one universal number either. It's components you account for deliberately.
>
> One, direct and variable costs: products, consumables, laundry, disposables. These scale with each service. Track your actual use per service — not a rough guess.
>
> Two, allocated overhead: rent, utilities, insurance, software, shared supplies. These exist whether you see a client or not. There's no single universally correct way to allocate them across your services — how you divide them is a business decision, not a course requirement.
>
> Three, practitioner time — broader than treatment time: setup, consultation, treatment, transitions, cleanup, checkout, documentation. A "sixty-minute service" can require meaningfully more than sixty minutes of your capacity. Account for your own full time — not someone else's ratio.
>
> And four, desired profitability: how much margin you want. How much margin you want is not a course-prescribed number. It's a deliberate business decision you make and can explain — not a default you accept without thinking about it.
>
> Section 9.3 — Margin versus markup. Two words. Two different prices.
>
> Markup is calculated from cost: a 30% markup on a $100 cost is $130. Margin is calculated from selling price: a 30% margin means 30% of the selling price is profit, which requires solving price equals cost divided by one minus margin — at a 30% margin, that same $100 cost produces a price of about $143, not $130.
>
> Same $100 cost, two different results. A 30% markup on a $100 cost: $100 times 1.30 equals $130. A 30% margin on a $100 cost: $100 divided by 1 minus 0.30 is approximately $143.
>
> [firmly] Key point: "30% markup" and "30% margin" do not produce the same selling price. Know which one you're using — this course's calculator, next, uses margin.

### M9-05 — 9.4 Price your service + 9.5 Market context
**SOURCE:** the calculator's full business-note caveat (all 5 items, including "locally required charges," which v2 dropped) + the full 6-item market-context list (v2 kept only 3 of 6). **VOICE:** Teaching for the framing; Reference for the business note and the market-context list. **gateType:** normal. **AIMT fix:** "AIMT" (bare, spoken form) → "A I M T". **FIXES v4:** the 9.4 headline ("Cost base to target price") is now spoken, not just the eyebrow; the live page's own opening instruction ("Enter your own numbers — real or illustrative...") now precedes the calculator explanation instead of being replaced by it; all 4 calculator input labels (product cost per service, overhead per service, your full practitioner time cost, target margin) are now named explicitly; "Business note" is now spoken as a labeled beat.
**FIXES v2:** business-note list restores "locally required charges" (v2 had 4 of 5 items). Market-context sentence restores "local price ranges," "service comparison," and "business model" (v2 had only 3 of 6 items — client expectations, positioning, demand — and dropped the other three entirely).

> Section 9.4 — Price your service. Cost base to target price.
>
> Enter your own numbers — real or illustrative — for a service you offer or plan to offer. The calculator uses margin, the concept from 9.3: it solves for the selling price required to hit the target margin you choose, starting from your modeled cost base. The four inputs are product cost per service, overhead per service, your full practitioner time cost, and your target margin.
>
> Business note: this calculator is a planning tool. A business may also need to account for items such as taxes, payroll burden, payment-processing costs, insurance, locally required charges, and other operating expenses, depending on business structure and jurisdiction. A I M T does not prescribe state-specific tax treatment or business or legal structure.
>
> Section 9.5 — Market context, not copycat pricing. Look at the market after you know your own numbers — not instead of them.
>
> A competitor's price may not cover their own actual costs — copying it risks copying a model that's already losing money. Know your own economics first, then look at your local market. Market context can legitimately inform client expectations, positioning, local price ranges, service comparison, demand, and business model — it isn't irrelevant, just secondary.
>
> [slowly] Why this matters: final price sits at the intersection of cost structure, service design, capacity, market context, and business positioning — not any one of these alone.

### M9-06 — 9.6 Design your menu + 9.7 Enhancements that earn their place
**SOURCE:** the full 7-item differentiation list and both "don't" clauses (v2 had 5 items and one clause); the full Core/Extended labeling note; the full 6-item enhancement definition and 7-item recommendation-basis list (v2 dropped 2 and 3 items respectively, and shortened "goals and preferences" to "goals"); all 3 practitioner-note "don't" clauses (v2 had 2); all 5 enhancement examples with exact, unreordered client language and every trailing sentence (v2 reordered one script's two clauses and dropped a trailing sentence from another); the "Head Spa Enhancement Strategy Guide" resource card's title and body (new in v4). **VOICE:** Teaching for the framing; Reference for the differentiation list, the enhancement definition/basis lists, the practitioner note, all 5 client scripts, and the resource card. **gateType:** normal. **AIMT fix:** "AIMT's" (bare, spoken form) → "A I M T's". **FIXES v4:** "Service design note" and "Practitioner note" are now spoken as labeled beats; the Enhancement Strategy Guide card (title + body — not the PDF's own contents) is now narrated at the end of this chunk, in live DOM order, closing a gap v3 flagged but left unfixed.

> Section 9.6 — Design your menu. Make it easy to understand. A concise menu is generally easier for a client to navigate. Two or three clearly differentiated Head Spa options may be a useful structure for some businesses — but the number of services should follow your actual business and protocol design, not a universal rule.
>
> Service design note: require meaningful differentiation. Different menu options should change something real — treatment time, massage or bodywork, processing, included enhancements, service scope, sensory work, or another deliberate component. Don't engineer an artificial "premium" difference just to create an anchor, and don't try to make the higher-priced option feel like the obvious choice.
>
> Remember: Core and Extended are A I M T's teaching labels — not required menu names. Core and Extended, from Module 8's masterclass, are A I M T's own reference-format teaching labels. They are not required client-facing menu names. Your business can name and package its own services differently.
>
> Section 9.7 — Enhancements that earn their place. An enhancement should add something real.
>
> A genuine enhancement has a distinct purpose, a real service difference, a time effect where applicable, a cost effect, clear client-facing positioning, and an appropriate place in the client journey. Base a recommendation on the established service plan, the client's goals and preferences, your observation within scope, product directions, contraindications or modifications already identified, your training, and the appointment time you actually have.
>
> Practitioner note: don't imply "what the scalp needs" — that phrasing crosses into diagnosis. Don't recommend an enhancement merely because it's on the menu. And don't claim an enhancement "converts" because of how it's presented.
>
> Five examples, with real client language for each.
>
> A scalp treatment serum: "Based on what I'm observing today, I'd suggest adding a treatment serum — it takes about 5 minutes and supports what we're already doing."
>
> Extended massage time: "If you'd like, I can extend your massage by 15 minutes — I noticed some tension through your shoulders today."
>
> A deep conditioning upgrade: "Your ends could use extra moisture — I can swap in a protein mask and add steam. It makes a real difference on lengths like yours."
>
> A blow dry — decide in advance whether a blow dry is included or an add-on for your business. Both are valid — just be consistent and clear at booking.
>
> And an aromatherapy enhancement: "We can add a custom aromatherapy blend today, based on your preference."
>
> [firmly] An enhancement recommendation must never override a genuine scalp-presentation safety reason not to add a product — from Module 5 and 6's adaptation and contraindication judgment. If a presentation calls for restraint, restraint wins over the recommendation.
>
> Head Spa Enhancement Strategy Guide. There's also a downloadable guide where you can explore additional enhancement ideas, why they may earn a place on your menu, and how to position them clearly without turning the client experience into a sales pitch.

### M9-07 — Checkpoint 1 (`m10cp1`)
**VOICE:** Teaching. **gateType:** `checkpoint-stop`. **checkpointId:** `m10cp1`. **Question re-verified fresh against `headspa-mastery.html:11546` this pass — exact match, unparaphrased.**

> Here's your first checkpoint — pricing and menu reasoning. Build or evaluate a head spa service menu for your business. For each service, name what it includes and its price, then explain the real costs and practitioner time behind the pricing, and why the differences between the options are clear to a client.
>
> Take your time, and answer below.

### M9-08 — Post-pass (`m10cp1`): 9.8 When a client says the price felt high
**SOURCE:** the full 9-item price-objection-causes list (v2 had 6 of 9 items — dropped "poor menu differentiation" as its own item, "weak positioning," "a service-delivery mismatch," and "a repeated pattern worth addressing"); the full "In the moment" 7-item list (already correct in v2); the model response verbatim (already correct in v2); the full 7-question "Afterward, review the evidence" list (v2 dropped the final two questions — the exact last-item-of-a-sequence drop Section G exists to catch). **VOICE:** Teaching for the framing; Reference for the causes list, the "in the moment" list, the model response, and all 7 review questions. **gateType:** `post-pass`. **checkpointId:** `m10cp1`. **resumeAfterPass:** true. **FIXES v4:** the closing "Remember" eyebrow is now spoken as a labeled beat.

> Nice work — let's keep going.
>
> Section 9.8 — When a client says the price felt high. One comment. Several possible causes.
>
> "That felt expensive" can mean several different things: a price-market mismatch, unclear expectations, unclear inclusions, poor menu differentiation, weak positioning, a service-delivery mismatch, genuine affordability, one client's individual preference, a repeated pattern worth addressing — or, sometimes, that nothing needs to change at all. Don't diagnose the business problem from one sentence.
>
> In the moment: acknowledge. Stay calm. Don't argue. Don't reach for an immediate discount. Don't lecture the client on value. Answer a genuine question clearly. Preserve the client's autonomy.
>
> Here's a model response, not a required script: "Thank you for telling me. I'm glad you enjoyed the service. Our pricing reflects the time and components included, and I'm happy to explain what was included or help you compare options for a future visit."
>
> Afterward, review the evidence. Was the price clear before booking? Were the inclusions clear? Does the price cover your real cost structure? Does the menu communicate meaningful differences? Is this feedback recurring? Does the service experience support the positioning you intend? Is the price appropriate for the market you're actually serving?
>
> [slowly] Remember: don't assume the client is wrong. Don't assume the price is wrong.

### M9-09 — 9.9 Why pricing really goes wrong
**SOURCE:** the full 8-item underpricing-causes list (already essentially complete in v2) + the full 4-item "why this matters" list (v2 dropped "overbooking," 3 of 4 items) + both positioning-language reframe pairs (already correct in v2). **VOICE:** Reference throughout. **gateType:** normal.
**FIXES v2:** "why this matters" restores "overbooking" between "unsustainable workload" and "or inconsistent delivery."

> Section 9.9 — Why pricing really goes wrong. Confidence is not a financial model.
>
> Underpricing has more causes than fear: incomplete cost data, poor overhead allocation, inaccurate time assumptions, competitor copying, an intentional launch strategy, market constraints, weak service differentiation, a lack of pricing knowledge — or, yes, sometimes fear or a lack of confidence. Fear is one cause among several, not the default explanation.
>
> Why this matters: persistent underpricing can contribute to financial strain, unsustainable workload, overbooking, or inconsistent delivery over time — not a guaranteed outcome, but a real pattern worth watching for.
>
> Positioning language matters. "This is our basic option" becomes "this is our core service." "This is more expensive" becomes "this is our extended experience." These describe accurate framing — not engineered pressure.

### M9-10 — Checkpoint 2 (`m10cp2`)
**VOICE:** Teaching. **gateType:** `checkpoint-stop`. **checkpointId:** `m10cp2`. **Question re-verified fresh against `headspa-mastery.html:11547` this pass — exact match, unparaphrased.**

> Here's your final checkpoint — price feedback and client closing. At checkout, a client says, "I loved the service, but the price felt high." What would you say in the moment, and what would you review afterward before deciding whether anything about your pricing, menu, or positioning should change?
>
> Take your time, and answer below.

### M9-11 — Post-pass (`m10cp2`): completion + recap + handoff
**VOICE:** Teaching. **gateType:** `post-pass`. **checkpointId:** `m10cp2`. **resumeAfterPass:** true. **Completion copy re-verified fresh against `headspa-mastery.html:9994-10004` this pass — exact match.**

> Module complete. You can close a service the way you opened it, and price it from real numbers instead of pressure or guesswork.
>
> Up next, Module 10: sanitation and reset systems — the work between every service that separates consistent professionals from inconsistent ones.

---

## Interaction timing map (Section I compliance)

| Point | Chunk | Reveals before student acts? |
|---|---|---|
| Close Without Pressure prompt + 6 option labels | M9-03 (`interaction-stop`) | No — no verdict, no "the pattern that works," no hint which option is strongest. Player halts after this chunk and polls `#m9CwpDecision`'s `.bq-opt[aria-pressed]`/`data-choice` (read-only) until a selection is made. |
| Option 1 feedback (strongest) | M9-03-fb0 | Plays only if option 0 is the one actually selected. |
| Options 2–6 feedback | M9-03-fb1..fb5 | Each plays only if that exact option is the one actually selected — never any other branch. |
| Checkpoint 1 prompt | M9-07 (`checkpoint-stop`, `m10cp1`) | No grading/result narrated; player halts and polls `APP_STATE` (via `engine.isCheckpointPassed`) for a pass. |
| Checkpoint 2 prompt | M9-10 (`checkpoint-stop`, `m10cp2`) | Same. |

## Editorial QA (pre-generation checklist)

1. **Parity** — every named cost input, list item, card field, checkout
   item, client script, and error/cause is present, not gestured at.
2. **Reference completeness** — no list silently thinned anywhere (fixes
   the audit's drift #1 through #9 — see coverage audit).
3. **Teaching voice** used only between landmarks, never inside a
   Reference passage.
4. **No invented claims** — the calculator's own "not tax/legal advice"
   caveat and the "don't diagnose"/"don't imply what the scalp needs"
   boundaries preserved exactly.
5. **No skipped items, no reordered client-facing scripts.**
6. **Checkpoint locations correct** — `m10cp1` after 9.7, before
   checkpoint; `m10cp2` after 9.9, before completion. Matches live DOM
   order, re-verified fresh this pass.
7. **Section order correct**, matches live DOM order throughout.
8. **AIMT normalization** — no standalone "AIMT" spoken as one word, no
   hyphenated "A-I-M-T," no dotted "A.I.M.T" anywhere in this script (2
   occurrences of "AIMT" in the source, both now "A I M T" — see the
   preflight result in the coverage audit).
9. **No "answer above"** anywhere in this script (2 checkpoint closings,
   both "answer below").
10. **Final-third re-read done independently of the coverage-map pass** —
    see the coverage audit's END-OF-MODULE FIDELITY CHECK.

## ElevenLabs generation plan

**Not generated. Awaiting owner text review.** No ElevenLabs call has been
made for this v4 script. Batch map is unchanged in shape from v2/v3 (the
structure was sound; only content within chunks changed), reproduced here
for reference only:

| Piece | Chunks | Notes |
|---|---|---|
| A1 | M9-01 → M9-02 | Briefing + 9.1 |
| A2 | M9-03 | Close Without Pressure — prompt + 6 options only |
| A2-fb0..fb5 | M9-03-fb0 .. M9-03-fb5 | 6 separate tiny batches, one per option's feedback |
| A3 | M9-04 | 9.2 + 9.3 |
| A4 | M9-05 | 9.4 + 9.5 |
| A4b | M9-06 | 9.6 + 9.7 (+ resource card) |
| A5 | M9-07 | Checkpoint 1 alone |
| B1 | M9-08 | Post-pass + 9.8 |
| B2 | M9-09 | 9.9 alone |
| B3 | M9-10 | Checkpoint 2 alone |
| C1 | M9-11 | Post-pass recap/handoff |

16 batches planned (10 narration + 6 interaction-feedback branches) —
**one more than v3's 15**, because v4's restored content (headline,
opening instruction, 4 calculator inputs, labeled notes, resource card)
pushed the old combined A4 batch (M9-05+M9-06) to 4,586 chars, over the
4,500-char safety margin. Split into A4 (M9-05 alone, 1,475 chars) and
A4b (M9-06 alone, 3,109 chars) — no chunk content changed, only the
batch grouping. `Y3ZPRGOSIxbV4Rbb3WiA` / `eleven_v3` — same voice/model
as the rest of the course, **not yet called**.
