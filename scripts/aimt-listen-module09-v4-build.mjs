#!/usr/bin/env node
// ONE-OFF, Module-9-only batch builder for the v4 targeted-fidelity-fix
// pass (supersedes aimt-listen-module09-v3-build.mjs, kept for history).
// Text/preflight only -- no ElevenLabs calls happen from this script.
//
// Source of truth for wording: docs/course-audit/listen-mode/
// module-09-listen-script.md (v4) -- every payload below is copied
// verbatim from that file's blockquoted script text. If the two ever
// drift, the .md file is authoritative and this script needs re-syncing.
//
// v4 changes vs v3 (8 targeted fixes, everything else byte-identical):
// M9-01 (module title/tagline), M9-02 (Module 8 closing-line quote),
// M9-04 (Key point label), M9-05 (9.4 headline + opening instruction +
// 4 calculator inputs + Business note label), M9-06 (Service design
// note + Practitioner note labels + Enhancement Strategy Guide card),
// M9-08 (Remember label). M9-03/fb0-5, M9-07, M9-09, M9-10, M9-11
// unchanged from v3.
//
// Output: docs/course-audit/listen-mode/tts-final/module-09/M9-BATCH-*.txt
// + manifest.json (v4). The v3 batches/manifest were copied (not moved --
// delete nothing) to this same directory's archive-loose-v3/ before this
// script ran.

import { writeFileSync, mkdirSync } from 'node:fs';

const OUT_DIR = 'docs/course-audit/listen-mode/tts-final/module-09';
mkdirSync(OUT_DIR, { recursive: true });

// ── narration chunks (chunkId -> text) ──
const CHUNKS = {
  'M9-01': `Welcome to Module 9 — Checkout, Client Closing and Pricing Strategy. Close the experience as intentionally as you opened it.

The treatment is done — what happens next, how you close the appointment and how you price what you do, is its own skill. This module is a business decision lab: less about performing, more about deciding, from real numbers and calm communication.

Here's what's ahead: you'll close the appointment as intentionally as you opened it. You'll know your real costs, and the difference between margin and markup. You'll price a service using market context, not copycat pricing. You'll design a menu and enhancements that actually earn their place. And you'll respond calmly and confidently when a client says the price felt high.

[warmly] Pay attention to this: pricing conversations go wrong far more often from how they're delivered than from the number itself.`,

  'M9-02': `Section 9.1 — From treatment close to checkout. The moment isn't over when the treatment is.

Module 8 ends with one line: "Today I focused a little more on the area or service priority you addressed — how are you feeling?" That's a treatment-closing observation, not a business conversation. What happens after it — checkout, questions, whether to book again — is this module's subject.

Here's the shape, not a script: reorient, then briefly recap, then answer or recommend where relevant, then invite future options without pressure, then complete checkout. This is not a rigid or exact universal order — treat it as a shape you move through naturally, not a script to recite.

Give the client a moment to reorient before you speak further. A quiet, relaxation-first service shouldn't end with an abrupt shift into a rapid sales pitch — speak at a normal, calm pace.

Recap only what you genuinely did during the service. Don't diagnose. Don't exaggerate results — a short, honest sentence is more credible than an impressive one.

Answer questions clearly, but don't unload every possible recommendation at once. A recommendation should have a specific reason tied to the service you just delivered — not exist because it's on the menu. And the flow has to work cleanly for a client who says no to everything — retail, enhancements, rebooking. Declining should never create awkwardness.

[slowly] Remember: rebooking is an available next step, not proof you successfully "closed." If a client wants to plan another visit, help them choose the service or timing that fits their goals, preferences, and schedule — don't teach yourself a universal treatment frequency just to manufacture a future booking.

And checkout itself stays platform-neutral. Confirm what the client is paying for. Communicate the total clearly. Process payment through your business's own normal system. Provide a receipt or confirmation as appropriate. And if your business accepts gratuity, keep the presentation neutral. This course doesn't teach a specific point-of-sale platform, and gratuity is never mandatory or a fixed percentage — both are business decisions.`,

  'M9-03': `Close without pressure — choose the response that keeps the experience intact.

A client has just finished an Extended-format Head Spa service. She's sitting up, taking a slow breath, reorienting to the room. Which response best moves toward checkout without breaking the experience you just built? Six possible responses are on screen.

One: "Take your time. Today I focused a little more on your neck and shoulders — how are you feeling? Whenever you're ready, I can walk you through checkout, and if you'd like to talk about coming back or anything else, I'm happy to."

Two: "That was amazing, right? Before we head to checkout, let's go ahead and get your next appointment booked — I have an opening next week that would be perfect."

Three: "So today I started with the aromatherapy blend, then dry brushing to prep the scalp, then the halo massage with the heated water system, then the exfoliant, then neck and shoulder work, then a deep conditioning mask while I did your hands and arms, then a full rinse, then a cooling mist — that's everything we did today."

Four: "Your scalp was pretty congested today, especially at the crown — that's something to keep an eye on. I really worked on clearing that up for you."

Five: "You should definitely add the deep conditioning upgrade next time, and I'd recommend the scalp serum for home care, and you should really come back in two weeks to keep this going."

Six: "I should mention this time slot is really hard to get, so if you want to lock in the same time next month, you'd want to decide before you leave today."

Choose the response you think best preserves the experience.`,

  'M9-03-fb0': `This keeps the shape from 9.1: a moment to reorient, a concise truthful recap, an open door for questions, and an invitation to future options without pressure — nothing here is being pushed.`,
  'M9-03-fb1': `This skips reorientation and jumps straight into booking before the client has had a moment to settle. Give the recap and the reorientation moment first — sales pressure, even friendly-sounding pressure, is still pressure.`,
  'M9-03-fb2': `This recites the entire service back step by step instead of a concise, genuine recap. A brief acknowledgment of what mattered is enough — narrating everything can feel like a performance report, not a closing conversation.`,
  'M9-03-fb3': `"Congested" states a conclusion about the client's scalp rather than describing what was done. Recap what you did, not a diagnosis of what you found.`,
  'M9-03-fb4': `Retail, home care, and rebooking are all offered in one breath. A recommendation should have a specific reason tied to the service you just delivered — and shouldn't be unloaded all at once.`,
  'M9-03-fb5': `Implying the client needs to decide immediately creates artificial urgency. Future options should be offered without pressure — the client can always call to book.`,

  'M9-04': `Section 9.2 — Know the real cost. Four inputs — not a rigid formula, a way of thinking. Real cost isn't a guess, and it isn't one universal number either. It's components you account for deliberately.

One, direct and variable costs: products, consumables, laundry, disposables. These scale with each service. Track your actual use per service — not a rough guess.

Two, allocated overhead: rent, utilities, insurance, software, shared supplies. These exist whether you see a client or not. There's no single universally correct way to allocate them across your services — how you divide them is a business decision, not a course requirement.

Three, practitioner time — broader than treatment time: setup, consultation, treatment, transitions, cleanup, checkout, documentation. A "sixty-minute service" can require meaningfully more than sixty minutes of your capacity. Account for your own full time — not someone else's ratio.

And four, desired profitability: how much margin you want. How much margin you want is not a course-prescribed number. It's a deliberate business decision you make and can explain — not a default you accept without thinking about it.

Section 9.3 — Margin versus markup. Two words. Two different prices.

Markup is calculated from cost: a 30% markup on a $100 cost is $130. Margin is calculated from selling price: a 30% margin means 30% of the selling price is profit, which requires solving price equals cost divided by one minus margin — at a 30% margin, that same $100 cost produces a price of about $143, not $130.

Same $100 cost, two different results. A 30% markup on a $100 cost: $100 times 1.30 equals $130. A 30% margin on a $100 cost: $100 divided by 1 minus 0.30 is approximately $143.

[firmly] Key point: "30% markup" and "30% margin" do not produce the same selling price. Know which one you're using — this course's calculator, next, uses margin.`,

  'M9-05': `Section 9.4 — Price your service. Cost base to target price.

Enter your own numbers — real or illustrative — for a service you offer or plan to offer. The calculator uses margin, the concept from 9.3: it solves for the selling price required to hit the target margin you choose, starting from your modeled cost base. The four inputs are product cost per service, overhead per service, your full practitioner time cost, and your target margin.

Business note: this calculator is a planning tool. A business may also need to account for items such as taxes, payroll burden, payment-processing costs, insurance, locally required charges, and other operating expenses, depending on business structure and jurisdiction. A I M T does not prescribe state-specific tax treatment or business or legal structure.

Section 9.5 — Market context, not copycat pricing. Look at the market after you know your own numbers — not instead of them.

A competitor's price may not cover their own actual costs — copying it risks copying a model that's already losing money. Know your own economics first, then look at your local market. Market context can legitimately inform client expectations, positioning, local price ranges, service comparison, demand, and business model — it isn't irrelevant, just secondary.

[slowly] Why this matters: final price sits at the intersection of cost structure, service design, capacity, market context, and business positioning — not any one of these alone.`,

  'M9-06': `Section 9.6 — Design your menu. Make it easy to understand. A concise menu is generally easier for a client to navigate. Two or three clearly differentiated Head Spa options may be a useful structure for some businesses — but the number of services should follow your actual business and protocol design, not a universal rule.

Service design note: require meaningful differentiation. Different menu options should change something real — treatment time, massage or bodywork, processing, included enhancements, service scope, sensory work, or another deliberate component. Don't engineer an artificial "premium" difference just to create an anchor, and don't try to make the higher-priced option feel like the obvious choice.

Remember: Core and Extended are A I M T's teaching labels — not required menu names. Core and Extended, from Module 8's masterclass, are A I M T's own reference-format teaching labels. They are not required client-facing menu names. Your business can name and package its own services differently.

Section 9.7 — Enhancements that earn their place. An enhancement should add something real.

A genuine enhancement has a distinct purpose, a real service difference, a time effect where applicable, a cost effect, clear client-facing positioning, and an appropriate place in the client journey. Base a recommendation on the established service plan, the client's goals and preferences, your observation within scope, product directions, contraindications or modifications already identified, your training, and the appointment time you actually have.

Practitioner note: don't imply "what the scalp needs" — that phrasing crosses into diagnosis. Don't recommend an enhancement merely because it's on the menu. And don't claim an enhancement "converts" because of how it's presented.

Five examples, with real client language for each.

A scalp treatment serum: "Based on what I'm observing today, I'd suggest adding a treatment serum — it takes about 5 minutes and supports what we're already doing."

Extended massage time: "If you'd like, I can extend your massage by 15 minutes — I noticed some tension through your shoulders today."

A deep conditioning upgrade: "Your ends could use extra moisture — I can swap in a protein mask and add steam. It makes a real difference on lengths like yours."

A blow dry — decide in advance whether a blow dry is included or an add-on for your business. Both are valid — just be consistent and clear at booking.

And an aromatherapy enhancement: "We can add a custom aromatherapy blend today, based on your preference."

[firmly] An enhancement recommendation must never override a genuine scalp-presentation safety reason not to add a product — from Module 5 and 6's adaptation and contraindication judgment. If a presentation calls for restraint, restraint wins over the recommendation.

Head Spa Enhancement Strategy Guide. There's also a downloadable guide where you can explore additional enhancement ideas, why they may earn a place on your menu, and how to position them clearly without turning the client experience into a sales pitch.`,

  'M9-07': `Here's your first checkpoint — pricing and menu reasoning. Build or evaluate a head spa service menu for your business. For each service, name what it includes and its price, then explain the real costs and practitioner time behind the pricing, and why the differences between the options are clear to a client.

Take your time, and answer below.`,

  'M9-08': `Nice work — let's keep going.

Section 9.8 — When a client says the price felt high. One comment. Several possible causes.

"That felt expensive" can mean several different things: a price-market mismatch, unclear expectations, unclear inclusions, poor menu differentiation, weak positioning, a service-delivery mismatch, genuine affordability, one client's individual preference, a repeated pattern worth addressing — or, sometimes, that nothing needs to change at all. Don't diagnose the business problem from one sentence.

In the moment: acknowledge. Stay calm. Don't argue. Don't reach for an immediate discount. Don't lecture the client on value. Answer a genuine question clearly. Preserve the client's autonomy.

Here's a model response, not a required script: "Thank you for telling me. I'm glad you enjoyed the service. Our pricing reflects the time and components included, and I'm happy to explain what was included or help you compare options for a future visit."

Afterward, review the evidence. Was the price clear before booking? Were the inclusions clear? Does the price cover your real cost structure? Does the menu communicate meaningful differences? Is this feedback recurring? Does the service experience support the positioning you intend? Is the price appropriate for the market you're actually serving?

[slowly] Remember: don't assume the client is wrong. Don't assume the price is wrong.`,

  'M9-09': `Section 9.9 — Why pricing really goes wrong. Confidence is not a financial model.

Underpricing has more causes than fear: incomplete cost data, poor overhead allocation, inaccurate time assumptions, competitor copying, an intentional launch strategy, market constraints, weak service differentiation, a lack of pricing knowledge — or, yes, sometimes fear or a lack of confidence. Fear is one cause among several, not the default explanation.

Why this matters: persistent underpricing can contribute to financial strain, unsustainable workload, overbooking, or inconsistent delivery over time — not a guaranteed outcome, but a real pattern worth watching for.

Positioning language matters. "This is our basic option" becomes "this is our core service." "This is more expensive" becomes "this is our extended experience." These describe accurate framing — not engineered pressure.`,

  'M9-10': `Here's your final checkpoint — price feedback and client closing. At checkout, a client says, "I loved the service, but the price felt high." What would you say in the moment, and what would you review afterward before deciding whether anything about your pricing, menu, or positioning should change?

Take your time, and answer below.`,

  'M9-11': `Module complete. You can close a service the way you opened it, and price it from real numbers instead of pressure or guesswork.

Up next, Module 10: sanitation and reset systems — the work between every service that separates consistent professionals from inconsistent ones.`
};

// ── batch -> chunk grouping (same shape as v2/v3 -- structure was sound;
// only content within chunks changed) ──
const BATCHES = {
  A1: ['M9-01', 'M9-02'],
  A2: ['M9-03'],
  A2fb0: ['M9-03-fb0'],
  A2fb1: ['M9-03-fb1'],
  A2fb2: ['M9-03-fb2'],
  A2fb3: ['M9-03-fb3'],
  A2fb4: ['M9-03-fb4'],
  A2fb5: ['M9-03-fb5'],
  A3: ['M9-04'],
  A4: ['M9-05'],
  A4b: ['M9-06'],
  A5: ['M9-07'],
  B1: ['M9-08'],
  B2: ['M9-09'],
  B3: ['M9-10'],
  C1: ['M9-11']
};

const CHUNK_META = {
  'M9-07': { gateType: 'checkpoint-stop', checkpointId: 'm10cp1' },
  'M9-08': { gateType: 'post-pass', checkpointId: 'm10cp1', resumeAfterPass: true },
  'M9-10': { gateType: 'checkpoint-stop', checkpointId: 'm10cp2' },
  'M9-11': { gateType: 'post-pass', checkpointId: 'm10cp2', resumeAfterPass: true },
  'M9-03': { gateType: 'interaction-stop', interactionId: 'm9CwpDecision' },
  'M9-03-fb0': { gateType: 'interaction-feedback', interactionId: 'm9CwpDecision', optionIndex: 0 },
  'M9-03-fb1': { gateType: 'interaction-feedback', interactionId: 'm9CwpDecision', optionIndex: 1 },
  'M9-03-fb2': { gateType: 'interaction-feedback', interactionId: 'm9CwpDecision', optionIndex: 2 },
  'M9-03-fb3': { gateType: 'interaction-feedback', interactionId: 'm9CwpDecision', optionIndex: 3 },
  'M9-03-fb4': { gateType: 'interaction-feedback', interactionId: 'm9CwpDecision', optionIndex: 4 },
  'M9-03-fb5': { gateType: 'interaction-feedback', interactionId: 'm9CwpDecision', optionIndex: 5 }
};

function firstLine(text) { return text.split('\n')[0].slice(0, 140); }
function lastLine(text) { const l = text.trim().split('\n').filter(Boolean); return l[l.length - 1].slice(-140); }

const manifest = { module: '09', version: 'v4-strict-fidelity', batches: [] };
let totalChars = 0;

for (const [batchId, chunkIds] of Object.entries(BATCHES)) {
  const parts = chunkIds.map((id) => {
    if (!(id in CHUNKS)) throw new Error(`Missing chunk text for ${id}`);
    return { chunkId: id, text: CHUNKS[id] };
  });
  const text = parts.map((p) => p.text).join('\n\n');
  const fileName = `M9-BATCH-${batchId}.txt`;
  writeFileSync(`${OUT_DIR}/${fileName}`, text + '\n');
  totalChars += text.length;

  manifest.batches.push({
    batchId,
    file: fileName,
    chunkIds,
    normalizedChars: text.length,
    firstSpokenLine: firstLine(parts[0].text),
    lastSpokenLine: lastLine(parts[parts.length - 1].text),
    checkpointRelationship: chunkIds.map((id) => CHUNK_META[id]?.checkpointId).filter(Boolean).join(' / ') || null,
    interactionRelationship: chunkIds.map((id) => CHUNK_META[id]?.interactionId).filter(Boolean).join(' / ') || null,
    overCeiling: text.length >= 4500
  });
}

manifest.chunkMeta = Object.keys(CHUNKS).map((chunkId) => ({
  chunkId,
  normalizedChars: CHUNKS[chunkId].length,
  ...(CHUNK_META[chunkId] || {})
}));

writeFileSync(`${OUT_DIR}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(`Module 9 v4: ${manifest.batches.length} batches, ${totalChars} total chars`);
manifest.batches.forEach((b) => console.log(`  ${b.batchId}: ${b.normalizedChars} chars, chunks ${b.chunkIds.join(',')}, checkpoint ${b.checkpointRelationship || '--'}, interaction ${b.interactionRelationship || '--'}${b.overCeiling ? ' [FLAG: >=4500]' : ''}`));
