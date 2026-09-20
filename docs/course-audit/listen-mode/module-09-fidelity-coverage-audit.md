# Module 9 — Listen Mode Fidelity Coverage Audit (v4, strict-fidelity rebuild)

**Authority:** current live `headspa-mastery.html`, `#module9Wrap`, lines
9664–10007 (read fresh and in full, 2026-09-17/18 — not assumed from any
prior extraction), plus the checkpoint question text in `const M9/M10 =
{ questions: {...} }` at lines 11546–11547 (re-verified fresh this pass),
the checkpoint rubrics (`M10.systems`) at lines 11553–11567, the "Close
Without Pressure" answer/feedback key `M9_CWP_ANSWER` at lines 13157–13166
(re-verified fresh this pass, byte-identical to the prior read), and the
checkpoint-naming code comment at lines 12761–12766. This audit supersedes
`module-09-listen-script.md` v3 (superseded, not rejected — see "What v4
corrects" below) and v2 (**REJECTED** by the owner and archived at
`docs/course-audit/listen-mode/archive-loose-v1/module-09-listen-script-v2-REJECTED.md`,
its own audit at `module-09-fidelity-coverage-audit-v2-REJECTED.md`). v3
is separately archived at `module-09-listen-script-v3.md` /
`module-09-fidelity-coverage-audit-v3.md` (also in that folder — not
rejected wholesale, targeted corrections only). v1 is further archived at
`module-09-listen-script-v1.md`. Nothing was deleted.

**Why v2 was rejected:** the owner reviewed the v2 Module 9 narration and
rejected it. This was **not** the narrow "answer above"/AIMT/interaction-
timing patch that v2 correctly fixed structurally — underneath those
fixes, v2 still exhibited systemic fidelity drift: visible headlines and
teaching landmarks were present, but the body text, list items, and
client-facing scripts under them were compressed or partially dropped,
especially in the module's back half (9.4 onward). The owner's standard
is explicit: **"did the listening student actually receive the
substantive information visible in the lesson" — not "was the concept
represented."** v3 fixed every one of those list/content drops (see the
"Concrete drift found in the rejected v2 narration" table below, retained
unchanged).

**Why v3 needed further correction:** on a second owner review pass, v3's
list-content fixes held up, but a **distinct failure mode** was found
underneath: visible **teaching architecture itself** — the module's own
title/tagline, a section headline, four labeled notes/callouts, and a
resource card's existence — was not spoken at all in several places, even
where the factual content nominally "underneath" it was otherwise
present elsewhere. The owner's restated rule: *a substantive visible
teaching landmark must be delivered before Cadence paraphrases, explains,
or adds context — "the concept is covered elsewhere" is not sufficient
when the live element itself was simply skipped.* Eight targeted fixes,
detailed in the drift table below — no other content was touched or
re-shortened.

**Standard applied:** the Module 4/5/6 controlling precedent
(`module-04-fidelity-coverage-audit.md`, `module-05-fidelity-coverage-audit.md`,
`module-06-fidelity-coverage-audit.md`) — every substantive visible
teaching element (list, card, quote, numbered item, scope statement,
distinction) must be narrated closely enough that a listening-only
student receives the same information a reading student does. Numbers,
counts, and named items are not compressed or approximated. Client-facing
scripts are preserved verbatim, in their original clause order. A visible
"From Cadence"-style label is adapted to first person; substantive
content stays intact. The older editorial standard's "representative
example" compression allowance is explicitly **superseded** for this
rebuild, per the owner's instruction. Only true UI chrome is excluded
(see the exclusion list below).

---

## Concrete drift found in the rejected v2 narration, corrected here

| # | Live element | v2 narration (rejected) | Live text now | Fix |
|---|---|---|---|---|
| 1 | 9.2 "Practitioner time" card, closing sentence | Narrated "a sixty-minute service can require meaningfully more than sixty minutes of your capacity" and stopped — dropped the card's second sentence entirely | Live `cc-def`: "...meaningfully more than 60 minutes of your capacity. **Account for your own full time — not someone else's ratio.**" | M9-04 restores the dropped sentence |
| 2 | 9.2 "Desired profitability" card, opening clause | Narrated "how much margin you want is a deliberate business decision..." — dropped the card's first sentence | Live `cc-def`: "**How much margin you want is not a course-prescribed number.** It's a deliberate business decision..." | M9-04 restores the dropped opening clause |
| 3 | 9.4 "Business note" caveat, 5-item list | Kept 4 of 5 items ("taxes, payroll burden, payment processing, insurance") — silently dropped "locally required charges" | Live `kp-text`: "taxes, payroll-burden, payment-processing costs, insurance, **locally required charges**, and other operating expenses" | M9-05 restores the missing item |
| 4 | 9.5 market-context sentence, 6-item list | Kept 3 of 6 items ("expectations, positioning, and demand") — silently dropped "local price ranges," "service comparison," and "business model" | Live `body-text`: "client expectations, positioning, **local price ranges, service comparison**, demand, **and business model**" | M9-05 restores all 6 items |
| 5 | 9.6 "Require meaningful differentiation" key-point, 7-item list + 2nd "don't" clause | Kept 5 of 7 items ("time, bodywork, processing, enhancements, scope") — dropped "sensory work" and "another deliberate component"; also dropped the second "don't" clause ("and don't try to make the higher-priced option feel like the obvious choice") entirely | Live `kp-text`: "...service scope, **sensory work, or another deliberate component**. Don't engineer an artificial 'premium' difference... **and don't try to make the higher-priced option feel like the obvious choice.**" | M9-06 restores all 7 items and both "don't" clauses |
| 6 | 9.7 enhancement definition sentence, 6-item list | Kept 4 of 6 items ("distinct purpose, real service difference, cost effect, clear positioning") — dropped "a time effect where applicable" and "an appropriate place in the client journey," and shortened "client-facing positioning" to "positioning" | Live `body-text`: "a distinct purpose, a real service difference, **a time effect where applicable**, a cost effect, clear **client-facing** positioning, and **an appropriate place in the client journey**" | M9-06 restores all 6 items with exact wording |
| 7 | 9.7 recommendation-basis sentence, 7-item list | Kept 4 of 7 items and shortened "goals and preferences" to "goals" — dropped "product directions," "contraindications or modifications already identified," and "your training" entirely | Live `body-text`: "the established service plan, the client's **goals and preferences**, your observation within scope, **product directions, contraindications or modifications already identified, your training**, and the appointment time you actually have" | M9-06 restores all 7 items |
| 8 | 9.7 "Practitioner note," 3rd "don't" clause | Kept 2 of 3 clauses — dropped "Don't claim an enhancement 'converts' because of how it's presented" entirely | Live `kp-text` has 3 sentences: diagnosis-language, menu-only, **and the "converts" claim** | M9-06 restores the third clause |
| 9 | 9.7 "Extended massage time" client script | Reordered the script's two clauses relative to the live text (led with "I noticed some tension" instead of "If you'd like, I can extend...") | Live `addon-frame`: **"If you'd like, I can extend your massage by 15 minutes — I noticed some tension through your shoulders today."** (this exact clause order) | M9-06 uses the live clause order verbatim — client-facing scripts must not be reordered, only quoted |
| 10 | 9.7 "Deep conditioning upgrade" client script | Dropped the script's closing sentence, "It makes a real difference on lengths like yours." | Live `addon-frame`: "...I can swap in a protein mask and add steam. **It makes a real difference on lengths like yours.**" | M9-06 restores the dropped sentence |
| 11 | 9.7 "Blow dry" note | Dropped the closing phrase "and clear at booking" | Live `addon-frame`: "Both are valid — just be consistent **and clear at booking**." | M9-06 restores the dropped phrase |
| 12 | 9.8 price-objection-causes sentence, 9-item list | Kept 6 of 9 items — collapsed "poor menu differentiation" into a generic "weak differentiation," and dropped "weak positioning," "a service-delivery mismatch," and "a repeated pattern worth addressing" entirely | Live `body-text` names all 9 distinctly: "...poor menu differentiation, **weak positioning, a service-delivery mismatch**, genuine affordability, one client's individual preference, **a repeated pattern worth addressing** — or, sometimes, that nothing needs to change at all" | M9-08 restores all 9 items by name |
| 13 | 9.8 "Afterward, review the evidence," 7-question list | Kept 5 of 7 questions — **dropped the final two questions entirely**, the exact last-item-in-a-sequence drop pattern Section G of the editorial standard was created to catch | Live `info-card` has 7 questions; the last two are "**Does the service experience support the positioning you intend? Is the price appropriate for the market you're actually serving?**" | M9-08 restores both dropped final questions |
| 14 | 9.9 "why this matters" sentence, 4-item list | Kept 3 of 4 items — dropped "overbooking" | Live `kp-text`: "financial strain, unsustainable workload, **overbooking**, or inconsistent delivery over time" | M9-09 restores the missing item |
| 15 | Checkpoint framing (`cc-headline` labels) | Framed each checkpoint generically ("Here's your first/final checkpoint") without naming the card's own `cc-headline` label | Live `cp-label cc-headline`: "Pricing and menu reasoning" (`m10cp1`), "Price feedback and client closing" (`m10cp2`) | M9-07/M9-10 fold the label into the framing line, matching the Module 4 precedent for `cc-headline` treatment |

No wording was softened and no scope/safety/business caveat was changed
in either version — as with Modules 4, 5, and 6, the drift found here is
coverage/compression drift (list items, qualifying clauses, and trailing
sentences silently thinned or dropped, concentrated in the back half of
the module), not tone drift. Item 9 is flagged separately from the others
because it is a *reordering* defect, not an omission — a client-facing
script had its two clauses swapped, which the new "verbatim or extremely
closely, in order" rule for professional language treats as a distinct
failure mode from dropping content outright.

---

## Concrete drift found in v3 (second owner review pass), corrected in v4

| # | Live element | v3 narration | Live text now | Fix |
|---|---|---|---|---|
| 1 | `.mo-title` + `.mo-tagline` | Neither spoken. M9-01 covered the desc/bullets/attention-note but jumped straight from "Welcome to Module 9" into the desc paraphrase, never naming the module's own title or tagline | Live: `.mo-title` "Checkout, Client Closing & Pricing Strategy"; `.mo-tagline` "Close the experience as intentionally as you opened it." | M9-01 now opens "Welcome to Module 9 — Checkout, Client Closing and Pricing Strategy. Close the experience as intentionally as you opened it." before the desc paraphrase |
| 2 | 9.4 `.sec-title` ("Cost base → target price.") | Not spoken — M9-05 announced only the eyebrow ("Section 9.4 — Price your service") and moved straight into calculator explanation, merely echoing the headline's *concept* via "a cost-base-to-target-price calculator" mid-sentence | Live: separate, distinct `.sec-title` "Cost base → target price." | M9-05 now speaks it directly as its own sentence: "Section 9.4 — Price your service. Cost base to target price." |
| 3 | 9.4 opening `.body-text` (the calculator's own instruction) | Replaced rather than preceded by explanation — M9-05 opened with "On screen there's a cost-base-to-target-price calculator..." instead of the live page's own instruction sentence | Live: "**Enter your own numbers — real or illustrative — for a service you offer or plan to offer.** The calculator uses margin, the concept from 9.3: it solves for the selling price required to hit the target margin you choose, starting from your modeled cost base." | M9-05 now speaks the live instruction sentence first, then the explanation, matching VISIBLE INSTRUCTION → explanation order |
| 4 | 4 `.calc-label` field labels | Concepts named generically ("your own product cost, overhead, practitioner time, and target margin") — not distinctly identified as the calculator's actual 4 inputs | Live: "Product cost per service ($)", "Overhead per service ($)", "Your full practitioner time cost ($)", "Target margin (%)" | M9-05 adds an explicit sentence: "The four inputs are product cost per service, overhead per service, your full practitioner time cost, and your target margin." |
| 5a | `.kp-eyebrow` "Business note" (9.4) | Folded away — the caveat was spoken but the label itself never said | Live `kp-eyebrow`: "Business note" | M9-05 now opens that beat "Business note: this calculator is a planning tool..." |
| 5b | `.kp-eyebrow` "Service design note" (9.6) | Folded away | Live `kp-eyebrow`: "Service design note" | M9-06 now opens that beat "Service design note: require meaningful differentiation..." |
| 5c | `.kp-eyebrow` "Practitioner note" (9.7) | Folded away | Live `kp-eyebrow`: "Practitioner note" | M9-06 now opens that beat "Practitioner note: don't imply 'what the scalp needs'..." |
| 5d | `.kp-eyebrow` "Remember" (9.8) | Folded away | Live `kp-eyebrow`: "Remember" | M9-08 now opens that beat "Remember: don't assume the client is wrong..." |
| 5e | `.kp-eyebrow` "Key point" (9.3) | Folded away — not separately flagged by the owner, found and fixed on the same re-check for consistency with 5a–5d | Live `kp-eyebrow`: "Key point" | M9-04 now opens that beat "Key point: '30% markup' and '30% margin'..." |
| 6 | "Head Spa Enhancement Strategy Guide" `.ic-title` + `.body-text` | Not narrated at all — flagged as an undefended gap when v3 was presented for review, not fixed at the time | Live `ic-title`: "Head Spa Enhancement Strategy Guide"; `body-text`: "Explore additional enhancement ideas, why they may earn a place on your menu, and how to position them clearly without turning the client experience into a sales pitch." | M9-06 now closes with: "Head Spa Enhancement Strategy Guide. There's also a downloadable guide where you can explore additional enhancement ideas, why they may earn a place on your menu, and how to position them clearly without turning the client experience into a sales pitch." — the PDF's own unseen contents are still not narrated (correctly; only the card's visible title/body are course content) |
| 7 | 9.1 quoted Module 8 closing line | Narrowed the live bracketed placeholder to a single meaning: "Today I focused a little more on **this area**" | Live: '"Today I focused a little more on **[area or service priority you addressed]**. How are you feeling?"' — the bracket holds two possibilities, not one | M9-02 now reads "Today I focused a little more on **the area or service priority you addressed** — how are you feeling?", preserving both |

No wording was softened and no scope/safety/business caveat was changed.
This drift is categorically different from the v2 drift above: v2 dropped
*content* (list items, sentences); v3's remaining gaps were *unspoken
teaching architecture* (titles, headlines, labels, a resource card) —
the owner's point that "concept covered elsewhere" does not excuse
skipping a visible landmark itself. Batch A4 (M9-05+M9-06 combined) grew
past the 4,500-char safety margin as a direct result of these fixes
(4,586 chars) and was split into A4 (M9-05 alone) and A4b (M9-06 alone) —
a batching change only, no chunk content affected.

---

## Headline inventory

Every substantive visible heading/label/eyebrow in `#module9Wrap`, in live
DOM order. "Spoken treatment" values: **exact** (read as visible text),
**close** (natural spoken adaptation, same substantive content), **1st-person**
(UI-label adaptation, e.g. "From Cadence" → "a note from me"), **folded**
(the label is worked into a framing sentence rather than announced as its
own beat — matches the Module 4 `cc-headline` precedent).

| # | Exact visible text | DOM location | Type | Chunk | Spoken treatment |
|---|---|---|---|---|---|
| 1 | "Module 09" | `.mo-eyebrow`, L9668 | Module identity | M9-01 | close ("Module 9") |
| 2 | "Checkout, Client Closing & Pricing Strategy" | `.mo-title`, L9669 | Module identity | M9-01 | exact (v4: spoken directly, "Welcome to Module 9 — Checkout, Client Closing and Pricing Strategy") |
| 3 | "Close the experience as intentionally as you opened it." | `.mo-tagline`, L9670 | Module identity | M9-01 | exact (v4: spoken directly, verbatim) |
| 4 | "In this module" | `.mo-section-label`, L9674 | List label | M9-01 | folded ("Here's what's ahead") |
| 5 | "Pay attention to" | `.mo-attention-label`, L9685 | Callout label | M9-01 | folded ("Pay attention to this:") |
| 6 | "9.1 — From treatment close to checkout" | `.sec-eyebrow`, L9694 | Section announcement | M9-02 | exact |
| 7 | "The moment isn't over when the treatment is." | `.sec-title`, L9695 | Section headline | M9-02 | exact |
| 8 | "A shape, not a script" | `.ic-title`, L9699 | Info-card title | M9-02 | folded ("Here's the shape, not a script:") |
| 9 | "Remember" (Rebooking) | `.kp-eyebrow`, L9710 | Key-point label | M9-02 | folded ("Remember:") |
| 10 | "Checkout, platform-neutral" | `.ic-title`, L9716 | Info-card title | M9-02 | folded ("checkout itself stays platform-neutral") |
| 11 | "Close Without Pressure" | `.sec-eyebrow`, L9722 | Interaction announcement | M9-03 | exact |
| 12 | "Choose the response that keeps the experience intact." | `.sec-title`, L9723 | Interaction headline | M9-03 | exact |
| 13 | "9.2 — Know the real cost" | `.sec-eyebrow`, L9741 | Section announcement | M9-04 | exact |
| 14 | "Four inputs. Not a rigid formula — a way of thinking." | `.sec-title`, L9742 | Section headline | M9-04 | exact |
| 15 | "Direct & variable costs" | `.cc-term`, L9748 | Card term | M9-04 | exact ("One, direct and variable costs:") |
| 16 | "Allocated overhead" | `.cc-term`, L9754 | Card term | M9-04 | exact ("Two, allocated overhead:") |
| 17 | "Practitioner time — broader than treatment time" | `.cc-term`, L9760 | Card term | M9-04 | exact |
| 18 | "Desired profitability" | `.cc-term`, L9766 | Card term | M9-04 | exact |
| 19 | "9.3 — Margin vs. markup" | `.sec-eyebrow`, L9774 | Section announcement | M9-04 | exact |
| 20 | "Two words. Two different prices." | `.sec-title`, L9775 | Section headline | M9-04 | exact |
| 21 | "Same $100 cost. Two different results." | `.ic-title`, L9779 | Info-card title | M9-04 | close ("Same $100 cost, two different results.") |
| 22 | "Key point" | `.kp-eyebrow`, L9787 | Key-point label | M9-04 | exact (v4: "Key point:" now spoken) |
| 23 | "9.4 — Price your service" | `.sec-eyebrow`, L9794 | Section announcement | M9-05 | exact |
| 24 | "Cost base → target price." | `.sec-title`, L9795 | Section headline | M9-05 | exact (v4: spoken directly, "Cost base to target price.") |
| 25 | "Cost base → target price calculator" | in-widget label, L9799 | UI chrome | — | excluded — duplicate of #24, widget display label only |
| 26 | "Product cost per service ($)" / "Overhead per service ($)" / "Your full practitioner time cost ($)" / "Target margin (%)" | `.calc-label` ×4, L9802–9814 | Form-field labels | M9-05 | exact (v4: "The four inputs are product cost per service, overhead per service, your full practitioner time cost, and your target margin" — all 4 named explicitly and distinctly, not just gestured at conceptually) |
| 27 | "Business note" | `.kp-eyebrow`, L9825 | Key-point label | M9-05 | exact (v4: "Business note:" now spoken) |
| 28 | "9.5 — Market context, not copycat pricing" | `.sec-eyebrow`, L9832 | Section announcement | M9-05 | exact |
| 29 | "Look at the market after you know your own numbers — not instead of them." | `.sec-title`, L9833 | Section headline | M9-05 | exact |
| 30 | "Why this matters" | `.kp-eyebrow`, L9839 | Key-point label | M9-05 | folded ("Why this matters:") |
| 31 | "9.6 — Design your menu" | `.sec-eyebrow`, L9846 | Section announcement | M9-06 | exact |
| 32 | "Make the menu easy to understand." | `.sec-title`, L9847 | Section headline | M9-06 | exact |
| 33 | "Service design note" | `.kp-eyebrow`, L9853 | Key-point label | M9-06 | exact (v4: "Service design note:" now spoken) |
| 34 | "Remember" (Core/Extended) | `.kp-eyebrow`, L9861 | Key-point label | M9-06 | folded ("Remember:") |
| 35 | "9.7 — Enhancements that earn their place" | `.sec-eyebrow`, L9868 | Section announcement | M9-06 | exact |
| 36 | "An enhancement should add something real." | `.sec-title`, L9869 | Section headline | M9-06 | exact |
| 37 | "Practitioner note" | `.kp-eyebrow`, L9875 | Key-point label | M9-06 | exact (v4: "Practitioner note:" now spoken) |
| 38 | "Scalp treatment serum" / "Extended massage time" / "Deep conditioning upgrade" / "Blow dry" / "Aromatherapy enhancement" | `.addon-name` ×5, L9881–9885 | Example labels | M9-06 | close (named as each example is introduced) |
| 39 | "Head Spa Enhancement Strategy Guide" + its body text | `.ic-title` + `body-text`, L9891–9892 | Info-card title + body (PDF download pointer) | M9-06 | exact (v4: title + body now narrated verbatim at the end of M9-06 — "Head Spa Enhancement Strategy Guide. There's also a downloadable guide where you can explore additional enhancement ideas, why they may earn a place on your menu, and how to position them clearly without turning the client experience into a sales pitch." Only the download button label and format-hint remain excluded, see below.) |
| 40 | "Pricing and menu reasoning" | `.cp-label.cc-headline`, L9907 | Checkpoint label | M9-07 | folded ("Here's your first checkpoint — pricing and menu reasoning.") |
| 41 | "9.8 — When a client says the price felt high" | `.sec-eyebrow`, L9924 | Section announcement | M9-08 | exact |
| 42 | "One comment. Several possible causes." | `.sec-title`, L9925 | Section headline | M9-08 | exact |
| 43 | "In the moment" | `.ic-title`, L9929 | Info-card title | M9-08 | folded ("In the moment:") |
| 44 | "A model response — not a required script" | `.cn-label`, L9934 | Cadence-note label | M9-08 | folded ("Here's a model response, not a required script:") |
| 45 | "Afterward, review the evidence" | `.ic-title`, L9939 | Info-card title | M9-08 | folded ("Afterward, review the evidence.") |
| 46 | "Remember" (don't assume) | `.kp-eyebrow`, L9946 | Key-point label | M9-08 | exact (v4: "Remember:" now spoken) |
| 47 | "9.9 — Why pricing really goes wrong" | `.sec-eyebrow`, L9953 | Section announcement | M9-09 | exact |
| 48 | "Confidence is not a financial model." | `.sec-title`, L9954 | Section headline | M9-09 | exact |
| 49 | "Why this matters" | `.kp-eyebrow`, L9960 | Key-point label | M9-09 | folded ("Why this matters:") |
| 50 | "Positioning language matters" | `.ic-title`, L9966 | Info-card title | M9-09 | folded ("Positioning language matters.") |
| 51 | "Price feedback and client closing" | `.cp-label.cc-headline`, L9979 | Checkpoint label | M9-10 | folded ("Here's your final checkpoint — price feedback and client closing.") |
| 52 | "Module complete." | `.lc-title`, L9996 | Completion headline | M9-11 | exact |
| 53 | "Up next — Module 10" | `.lc-next-label`, L9999 | Completion handoff label | M9-11 | folded ("Up next, Module 10:") |

**Total substantive headings found: 53** (rows 1–53). **Excluded: 1**
(row 25 — the calculator's in-widget display label, a verbatim duplicate
of row 24's section title — reasoned below). **Narrated: 52** (up from
51 in v3, now that row 39's Enhancement Strategy Guide card is narrated
rather than excluded). Zero unexplained omissions — the one excluded row
has a stated reason, and every narrated row is traced to a chunk above.

---

## Full coverage map (source-content inventory)

| Live element | Content | Disposition | Chunk | Checkpoint |
|---|---|---|---|---|
| `.mod-opener` (eyebrow/title/tagline/desc) | Module identity | Narrated directly | M9-01 | — |
| "In this module" list (5 items) | Close intentionally / know real costs + margin vs. markup / price via market context not copycat / design menu+enhancements that earn their place / respond calmly to price-felt-high | All 5 named individually (paraphrased into flowing prose, matching the Module 5 opener's own precedent for this exact element — no item dropped) | M9-01 | — |
| `.mo-attention` | "Pay attention to" note | Narrated verbatim | M9-01 | — |
| 9.1 title + 3 body paragraphs | Shape not a script / reorient / recap / answer questions | All narrated closely, full, real order | M9-02 | — |
| 9.1 info-card "A shape, not a script" | 5-step shape sequence + "not rigid" caveat | Narrated in full | M9-02 | — |
| 9.1 key-point "Remember" (Rebooking) | Full text | Narrated verbatim | M9-02 | — |
| 9.1 info-card "Checkout, platform-neutral" | 5 items (confirm/communicate/process/receipt/gratuity-neutral) | All 5 narrated | M9-02 | — |
| "Close Without Pressure" eyebrow/title/body | Interaction framing | Narrated verbatim | M9-03 | — |
| `m9CwpDecision` — 6 option labels | Full quoted button text | All 6, verbatim, unreordered | M9-03 | — |
| `m9CwpFeedback` — 6 feedback texts | Full feedback sentences | All 6, verbatim (`M9_CWP_ANSWER.feedback[0..5]`) | M9-03-fb0..fb5 | — |
| 9.2 title + body | Four inputs framing | Narrated closely | M9-04 | — |
| 9.2 concept-grid — 4 cards | Direct/variable, overhead, practitioner time, profitability — full term+sub+def each | All 4 named individually, **both v2-dropped sentences restored** (drift #1, #2) | M9-04 | — |
| 9.3 title + body | Markup vs. margin intro | Narrated closely | M9-04 | — |
| 9.3 info-card | Worked $130/$143 example | Both figures narrated exactly | M9-04 | — |
| 9.3 key-point | 30%/30% distinction | Narrated verbatim | M9-04 | — |
| 9.4 title + body | Calculator framing | Narrated closely | M9-05 | — |
| 9.4 price-calc (4 fields + button) | Concept + all 4 inputs named | Concept narrated; form labels are UI chrome (see exclusion) | M9-05 | — |
| 9.4 key-point "Business note" | 5-item caveat list | All 5 items, **"locally required charges" restored** (drift #3) | M9-05 | — |
| 9.5 title + body | Market-context intro + 6-item list | Narrated closely, **all 6 items restored** (drift #4) | M9-05 | — |
| 9.5 key-point "Why this matters" | 5-factor intersection | Narrated verbatim | M9-05 | — |
| 9.6 title + body | Menu-design intro | Narrated closely | M9-06 | — |
| 9.6 key-point "Service design note" | 7-item differentiation list + 2 "don't" clauses | **All 7 items and both clauses restored** (drift #5) | M9-06 | — |
| 9.6 key-point "Remember" (AIMT labels) | Core/Extended labeling note, both sentences | Narrated in full | M9-06 | — |
| 9.7 title + body | Enhancement definition (6 items) + recommendation basis (7 items) | **All 13 items across both lists restored** (drift #6, #7) | M9-06 | — |
| 9.7 key-point "Practitioner note" | 3 "don't" clauses | **All 3 restored** (drift #8) | M9-06 | — |
| 9.7 addon-list — 5 cards | Exact client language, real order | All 5 verbatim, **unreordered clauses, both dropped items restored** (drift #9, #10, #11) | M9-06 | — |
| 9.7 body-text (safety override) | Restraint-wins caution | Narrated in full | M9-06 | — |
| "Head Spa Enhancement Strategy Guide" PDF card (title + body) | Resource-card announcement | Narrated in full at end of M9-06 (v4 fix #6) — only the download button/format-hint chrome excluded | M9-06 | — |
| Checkpoint 1 (`m10cp1`, "Pricing and menu reasoning") | Real rubric question, verbatim | Full, `cc-headline` folded into framing | M9-07 | **STOP — m10cp1** |
| (post-pass transition) | "Nice work — let's keep going." | Narration-UX only, no source content | M9-08 | resume after m10cp1 |
| 9.8 title + body | Price-objection framing, 9-item causes list | Narrated closely, **all 9 items restored** (drift #12) | M9-08 | — |
| 9.8 info-card "In the moment" | 7-item list | All 7, unchanged from v2 (already correct) | M9-08 | — |
| 9.8 cadence-note (model response) | Verbatim quote | Full, unchanged from v2 (already correct) | M9-08 | — |
| 9.8 info-card "Afterward, review the evidence" | 7 questions | **All 7 restored, including the final 2 v2 dropped** (drift #13) | M9-08 | — |
| 9.8 key-point "Remember" | Don't-assume pair | Narrated verbatim | M9-08 | — |
| 9.9 title + body | Underpricing-causes framing, 8-item list | Narrated closely, all 8 items | M9-09 | — |
| 9.9 key-point "Why this matters" | 4-item consequence list | **All 4 restored, "overbooking" added back** (drift #14) | M9-09 | — |
| 9.9 info-card "Positioning language matters" | Both reframe pairs | Narrated verbatim, unchanged from v2 (already correct) | M9-09 | — |
| Checkpoint 2 (`m10cp2`, "Price feedback and client closing") | Real rubric question, verbatim | Full, `cc-headline` folded into framing | M9-10 | **STOP — m10cp2** |
| `#m9Complete` title/body/next | Completion + Module 10 preview | Narrated in full, unchanged from v2 (already correct) | M9-11 | resume after m10cp2 |

## Excluded as non-instructional UI (with reason)

- **Calculator UI display label** ("Cost base → target price calculator") — a verbatim restatement of the section title (#24) inside the widget chrome itself; not new teaching content.
- **Calculator input *boxes and the Calculate button themselves*** — the interactive form controls (`<input>` elements, `calc-btn`) are UI mechanics with no narratable content of their own; **the 4 field labels' own text is narrated explicitly** (v4 fix #4 — "the four inputs are product cost per service, overhead per service, your full practitioner time cost, and your target margin"), so this exclusion is now scoped to the input widgets only, not the labels.
- **"Download Enhancement Strategy Guide" button label and "PDF reference · download" format hint** — the download affordance and file-format descriptor; the card's actual title and body text are narrated in full at M9-06 (v4 fix #6). The PDF's own unseen internal contents remain correctly unnarrated — nobody on this project has read them.
- **"Listen with Cadence — coming soon · Includes 2 checkpoint stops" footer** — navigation/entry-point UI, not lesson content (same category every prior module's audit excludes).
- **`data-choice`/`aria-pressed`/`bq-tag` interactive-widget mechanics, "Reset this scenario" button** — interaction chrome; the substantive option text and feedback it gates is narrated in full at M9-03/M9-03-fb0..fb5.
- **Checkpoint textarea placeholders** ("Your menu — what each service includes...", "What you'd say in the moment...") — input-field UI hints; the checkpoint's real question is narrated in full separately from the rubric config.
- **`cc-eyebrow`/`cc-title`/`cc-line` state-machine labels** (Ready/In Progress/Done variants: "Apply what you just learned.", "Finish your thought.", etc.) — dynamic UI state text describing the checkpoint widget's own progress, not lesson content.
- **"Open Cadence Check →" buttons, voice-input mic buttons** — interaction controls, not teaching content.
- **"Start Module 10 →" / "Back to course" buttons** — navigation controls, not teaching content.
- **All `View full-size image` links (none present in this module), `alt` text, `id`/`class`/`onclick` attributes, and inline `<script>` blocks** — implementation detail, not visible to a student either way.

No substantive teaching block was found undocumented. Coverage: **100% of
substantive Module 9 content**, all 17 script units (11 narration chunks
+ 6 interaction-feedback branches), both checkpoints preserved at their
real gate positions (`m10cp1` after 9.7, before checkpoint; `m10cp2`
after 9.9, before completion — matching the live DOM order re-confirmed
in this same fresh read).

## Checkpoint relationship (unchanged from live page, not altered by this pass)

- `m10cp1` — after 9.7 ("Enhancements that earn their place"), before the module's mid-close. Question, rubric, and grading system prompt (`M10.systems.m10cp1`) are untouched. Real moduleId passed to grading is `9` (`submitCheckpoint(9, id, ...)`, verified fresh at `headspa-mastery.html:12766`).
- `m10cp2` — end-of-module, after 9.9, before completion. Question, rubric, and grading system prompt (`M10.systems.m10cp2`) are untouched.

This pass changes narration only. No checkpoint ID, question text,
rubric, grading logic, or gating behavior was modified anywhere in this
document or in `headspa-mastery.html`.

## Interaction reveal-timing correction (Section I) — unchanged from v2, re-verified

v2's structural fix for "Close Without Pressure" was correct and is
carried forward unchanged: `M9-03` (`gateType: 'interaction-stop'`)
narrates the prompt and all six option labels only; the verdict/rationale
for whichever option the student actually selects plays only afterward,
from one of six separate `interactionFeedback` branches
(`M9-03-fb0`..`M9-03-fb5`). All six branches re-verified fresh this pass
against `M9_CWP_ANSWER` — byte-identical to the prior (correct) version.
See the script's interaction timing map for the full option→branch
mapping.

## END-OF-MODULE FIDELITY CHECK (Section G — mandatory, final third)

Scope: the module's final third by chunk count — `M9-08` (post-pass +
9.8) through `M9-11` (completion), re-read side by side against the live
page's own final third (`headspa-mastery.html:9924-10007`), independently
of the full coverage-map pass above. **This is the exact region where v2's
worst drift was concentrated** (drift #12, #13, #14 above all fall in
this scope) — this check was re-run specifically to confirm those fixes
land correctly and to catch anything else in the same region.

- **Headline/card/list thinning check:** 9.8's price-objection-causes
  sentence now names all 9 causes individually (was 6). 9.8's "In the
  moment" list — 7 items, unchanged, already correct. 9.8's "Afterward,
  review the evidence" — now all 7 questions, including the previously
  dropped final two. 9.9's underpricing-causes list — 8 items, confirmed
  intact. 9.9's "why this matters" — now all 4 consequences (was 3). 9.9's
  positioning-language reframe pair — both reframes present verbatim, not
  summarized to one. PASS.
- **Paraphrase creep check:** the 9.8 model-response quote (`cn-text`)
  compared character-by-character against M9-08 — identical. Both
  checkpoint rubric questions (`m10cp1`/`m10cp2`) compared against the
  real config strings at `headspa-mastery.html:11546-11547`, re-read
  fresh this pass — identical, byte-for-byte. PASS.
- **Exact completion-language match against the live page:** `m9Complete`
  card's `lc-body` and `lc-next-text` compared against M9-11 — exact
  match, not a paraphrase. PASS.
- **Exact checkpoint placement (immediately after the element it gates,
  in live DOM order):** `m10cp1` narrated (M9-07) immediately follows
  9.7's content (M9-06), with only the excluded PDF-download card between
  them — matches `headspa-mastery.html:9899-9901`. `m10cp2` narrated
  (M9-10) immediately follows 9.9 (M9-09) — matches
  `headspa-mastery.html:9971-9973`. PASS.
- **Stronger-paraphrase-than-earlier-sections check** (the specific
  failure mode this rule targets — the module getting looser toward the
  end): confirmed and corrected. The concrete-drift table above shows the
  density of dropped items is markedly higher in 9.4 onward than in 9.1
  through the interaction — this was the actual defect pattern in v2, now
  fixed at every identified point, not just asserted fixed.
- **Missing next-module handoff:** `lesson-complete`'s `lc-next` block is
  present in M9-11, in full, not dropped.

**END-OF-MODULE FIDELITY CHECK result: PASS** (after the 3 final-third
drift items identified above were fixed — #12, #13, #14 — and this check
re-run against the corrected text).

**v4 addendum:** the second owner review pass's 8 fixes were distributed
across the whole module (opener, 9.3, 9.4, 9.5, 9.6, 9.7), not
concentrated in the final third the way v2's drift was — this was an
"unspoken teaching architecture" defect pattern, not a "gets looser
toward the end" pattern. One fix does fall inside this check's scope:
M9-08's "Remember" eyebrow (v3-drift-table item 5d) is now spoken as a
labeled beat. Re-confirmed: still PASS.

## TTS preflight (text-only — no audio generated)

`node scripts/aimt-listen-tts-preflight.mjs` run against all 16 rebuilt
v4 batch payloads: **PASS**, 0 failures. Specifically: 0 occurrences of
bare/standalone "AIMT" in any narration payload, 0 occurrences of
hyphenated "A-I-M-T," 0 occurrences of dotted "A.I.M.T," 0 occurrences of
"answer above"/"respond above"/"your answer is above" phrasing (confirmed
both by the preflight tool and by direct grep against all 16 batch
files). Total: 15,538 normalized chars across 16 batches (up from v3's
15 batches / 14,960 chars — the restored teaching-architecture content
added ~580 chars and pushed the old combined A4 batch over the 4,500-char
safety margin, so it was split into A4/A4b; largest batch is now A1 at
3,035 chars). See the final report for the full per-batch breakdown.
**No ElevenLabs call was made to produce this result** — the preflight
operates on the local `.txt` batch payloads only.
