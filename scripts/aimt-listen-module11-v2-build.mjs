#!/usr/bin/env node
// Module-11-only batch builder for the v2 strict-fidelity rebuild
// (supersedes the v1 locked-standard script, archived at
// docs/course-audit/listen-mode/archive-loose-v1/module-11-listen-script-v1-REJECTED.md).
// Text/preflight only -- no ElevenLabs calls happen from this script.
//
// Source of truth for wording: docs/course-audit/listen-mode/
// module-11-listen-script.md (v2) -- every payload below is copied
// verbatim from that file's blockquoted script text. If the two ever
// drift, the .md file is authoritative and this script needs re-syncing.
//
// Written directly against live #module11Wrap, headspa-mastery.html
// lines 10009-10424 (read fresh and in full, 2026-09-19).
//
// Output: docs/course-audit/listen-mode/tts-final/module-11/M11-BATCH-*.txt
// + manifest.json (v2). The v1 batches/manifest were moved (git mv, not
// deleted) to this same directory's archive-loose-v1/ before this script
// ran.
//
// Post-generation narrator-perspective fix (2026-09-20): M11-02 originally
// preserved the live page's third-person description of Cadence verbatim
// ("...through Cadence. ...Cadence is an AI learning-support tool...").
// Owner correction: Cadence is the Listen Mode narrator and must never
// refer to herself in third person -- only the narrator's grammatical
// person adapts ("through Cadence" -> "through me", "Cadence is" ->
// "I'm"); no factual content changed. This is the same principle as the
// course-wide "From Cadence" first-person-narrator convention (compare
// Module 0/0-v2's "I'm Cadence" self-introductions). Only M11-02 was
// affected -- grepped against every other module's current batch
// payloads and every other "Cadence" mention course-wide is a legitimate
// named-feature reference ("Listen with Cadence", "Ask Cadence",
// "Practitioner Conversation with Cadence") or a quote attribution
// ("From Cadence:"), not narrator self-reference.
//
// B.R.I.E.F. pronunciation fix (2026-09-20): the framework NAME (as
// opposed to its individual letters, which are correctly spelled out one
// at a time only when Cadence is explicitly teaching what each letter
// stands for) was originally spoken comma-spelled ("B, R, I, E, F") as a
// precaution against the same letter-collision risk AIMT has. Owner
// correction: the framework name should simply be spoken as the real
// word "brief". M11-03's two name references ("Give AI a Better
// B.R.I.E.F." / "Build Your B.R.I.E.F.") and M11-10's "B.R.I.E.F. prompt
// framework" now read "brief" / "your brief" / "brief prompt framework".
// The individual-letter teaching sequence in M11-03 ("B, Background... R,
// Request...") is unchanged -- a different, legitimate use of spelled
// letters. Live lesson UI/written curriculum unchanged; this is a
// TTS-payload-only pronunciation fix, same category as the AIMT
// display-vs-spoken distinction.

import { writeFileSync, mkdirSync } from 'node:fs';

const OUT_DIR = 'docs/course-audit/listen-mode/tts-final/module-11';
mkdirSync(OUT_DIR, { recursive: true });

// ── narration chunks (chunkId -> text) ──
const CHUNKS = {
  'M11-01': `Welcome to Module 11 — AI, or Modern Practice Tools. Human-led. AI-assisted.

AI is already becoming part of modern practice — from business and communication to research, imaging, and the questions clients bring into the room. The goal is not to hand over your judgment. It is to learn how to use these tools well.

Here's what's ahead: you'll build real tool literacy — what AI is actually useful for in practice. You'll learn how better input leads to better, more usable output. You'll keep human authority over every judgment AI helps inform. You'll handle client-supplied AI results and scalp analysis responsibly. And you'll protect client privacy and data whenever AI tools are involved.

[warmly] Pay attention to this: AI can inform your judgment. It can never replace it — the final call is always yours.`,

  'M11-02': `You've already experienced A, I, M, T's philosophy in action through me. This course was built by human practitioners and professionals; I'm an AI learning-support tool built around that curriculum. AI can make education and practice more useful and responsive, but it does not replace the human expertise behind it. Hands-on training, webinars, and clinical or practical education remain human-led.

A, I, M, T position: if you're going to use AI, learn to use it well.

Section 11.1 — Tool literacy. What AI Is Actually Good At.

The specific tools will change. The more durable skill is understanding what kind of job you're giving them — and what kind of output they can realistically produce.

Language and reasoning assistants: drafting, brainstorming, summarizing, organizing, comparison, research, explanation, decision support.

Creative AI: marketing concepts, imagery, educational visuals, promotional creative, content and video workflows.

Scalp and hair imaging analysis: imaging, comparison, density measurement, pattern recognition, tracking, scoring, routine suggestions.

Automation and practice systems: scheduling, C R M, email, workflows, analytics, documentation, customer service.

Professional-looking output is not automatically verified output. Creative AI leaves accuracy, claims, brand fit, and final approval with the practitioner — never the tool.`,

  'M11-03': `Section 11.2 — Better input. Give AI a better brief.

Better input produces more useful output. Prompting isn't magic wording — it's giving the tool a clear job.

B, Background: what does the tool need to know? R, Request: what do you actually want it to do? I, Instructions: what tone, audience, boundaries, or requirements matter? E, Expected Output: what should the finished response look like? And F, Fact-check: what still needs human verification?

On screen there's a "Build your brief" workspace — ungraded practice, nothing here is saved or scored — starting from a deliberately weak prompt: "Write a post about my head spa."

Each field on screen carries its own guiding question. For Background: what should the AI know about your business, service, client, or situation? For Request: what specifically do you want the AI to create or accomplish? For Instructions: add tone, audience, boundaries, claims to avoid, terminology, or anything that must be included. For Expected Output: tell it the format, length, number of options, or structure you want back. And for Fact-check: what will you personally review or verify before using the result?

[slowly] A strong example — not a required script.

Background: I run a solo head spa studio. My clients are mostly working professionals booking a relaxation-focused scalp treatment on their lunch break or after work.

Request: write a 100-word Instagram caption inviting followers to book a 45-minute lunch-break scalp treatment.

Instructions: calm, unhurried tone, not salesy. Don't claim the treatment cures anything or guarantees hair growth.

Expected Output: one caption under 100 words, plus two shorter alternate versions I can pick between.

Fact-check: I'd check that it makes no health or medical claim, that any price or offer mentioned is current, and that the tone actually sounds like my business.`,

  'M11-04': `Section 11.3 — Human authority. Decide How Much Authority to Give the Tool.

"What are you asking the tool to do — and what still belongs to you?"

Level 1, AI can lead the first draft: social copy, brainstorming, content calendars, service-description drafts, email drafts, messages, FAQs, internal organization. A human reviews before anything ships.

Level 2, AI can assist, but you verify: research, ingredient explanations, product comparisons, pricing calculations, regulatory research, educational claims, business forecasting, source gathering. AI can accelerate the search — it does not eliminate verification. Use authoritative sources when facts matter.

Level 3, keep final authority human: diagnosing, establishing a medical condition, prescribing, deciding medical safety, exceeding your professional role, making claims you could not responsibly make yourself. The tool does not expand your professional authority.

[firmly] Use AI for leverage. Keep human authority where it matters.`,

  'M11-05': `Section 11.4 — Scalp and hair analysis. A Confidence Score Is Information — Not a Verdict.

AI-assisted scalp and hair analysis is a legitimate modern tool category — real benefits include consistency, measurement, comparison, tracking, pattern recognition, organization, and client engagement. It also has real limitations you need to hold onto.

On screen, an example interface shows a condition label alongside an 87 percent confidence score.

Human review: a model confidence score is information generated by the system — not a confirmed diagnosis. It may influence what you look at more closely, but it does not become "You have seborrheic dermatitis" in your client language.

What can shift the result: training data, image quality and lighting, capture conditions, the populations represented in that data, and independent validation.

[slowly] You don't need an AI-engineering lesson — you need enough literacy that a polished percentage never reads as universal truth. General conversational AI should not become your scalp diagnostician.`,

  'M11-06': `Section 11.5 — Client-supplied AI. When the Client Brings an AI Answer.

Clients are already arriving with information and conclusions they got from AI. The goal is not to ridicule the client, automatically agree with the result, or prove the software wrong. The professional skill is knowing how to receive the information and bring the conversation back to what you can responsibly establish.

What a client might say: "I asked ChatGPT about my scalp and it says I have dandruff." "I uploaded a photo and AI says this is psoriasis." "AI says my hair loss is hormonal."

Four steps.

One, Hear: acknowledge what they brought in. "Okay — tell me what you were noticing that made you look into it."

Two, Observe: return to the current consultation and what's actually observable today.

Three, Boundary: explain what you can responsibly establish. [firmly] "That may have given you useful information to start with. What I can do here is talk through what we're actually seeing today. I can't confirm a medical diagnosis from an AI result."

Four, Next step: depending on what you actually find — continue or adapt the service, avoid the affected area, pause or decline, or recommend appropriate professional evaluation.

[slowly] "The goal is not to defeat the AI answer. It is to return the conversation to responsible human judgment."`,

  'M11-07': `Here's your first checkpoint — responding to a client's AI result. A client tells you, "I asked ChatGPT about my scalp and it says I have dandruff." Walk me through how you would respond, what you would and would not confirm, and how you would decide what happens next.

Take your time, and answer below.`,

  'M11-08': `Nice work — let's keep going.

Section 11.6 — Privacy and client data. Client Information, Images and AI.

Data and privacy practices differ by tool and change over time. Do not rely on one frozen claim about what "AI" does with information.

Need: does the AI actually need this information or image?

Minimize: can identifying details be removed? Can the task be completed with less client information?

Verify: what are the tool's current data and privacy practices, account settings, permission and consent requirements, and applicable workplace or business requirements?

[firmly] Give the tool what the task needs — not everything you know. Uploading client scalp imagery into a general-purpose AI tool should not be treated as a casual default.`,

  'M11-09': `Section 11.7 — Practice leverage. Where AI Can Strengthen Your Practice.

Marketing: captions, campaigns, emails, web copy, FAQ, repurposing.

Client Communication: appointment messages, difficult-response drafts, policy explanations, rebooking, education.

Business Thinking: pricing scenarios, packages, projections, comparisons, expenses, S O Ps.

Research: terminology, possible sources, summarization, comparisons. Research with AI — verify outside it: open the source, check the date.

Training and Staff Development: outlines, quizzes, scenarios, internal references, exercises.

And Administrative Leverage: reduce repetitive work where useful — don't automate human interaction just because you can.`,

  'M11-10': `Section 11.8 — Human-led practice. Stay Human Where Human Matters.

"Modern does not mean less human."

AI may draft. The practitioner owns the message.

AI may organize information. The practitioner owns the judgment.

AI may identify patterns. The practitioner owns what gets communicated.

AI may help build the business. The practitioner creates the experience.

AI may support education. Human professionals still teach touch, technique, judgment, hands-on skill, client communication, and real-world decision-making.

Closing principle: use technology to become more capable — not less present.

Protect the parts of professional practice whose value comes from being human: trust, touch, empathy, observation, judgment, accountability, hands-on skill, and the practitioner-client relationship.

A, I, M, T AI Practice Toolkit. A practical reference for using AI with more structure and better judgment — including the brief prompt framework, an AI-use and verification matrix, the client-brings-AI response framework, privacy and data checks, and ready-to-customize practice prompts.`,

  'M11-11': `Here's your final checkpoint — a real AI request, with real verification. Choose one real task in your practice where AI could help. Write the request you would give the AI with enough context and direction to make the result useful, then explain what you would review or verify before using the output.

Take your time, and answer below.`,

  'M11-12': `Module complete. You now know how to use AI as leverage without handing over your judgment. That distinction is what separates a practitioner who uses modern tools well from one who either avoids them or defers to them.

Up next, Module 12: course completion and certification. Take a moment — you built something real.`
};

// ── batch -> chunk grouping (1:1 -- no interaction-feedback branches in
// this module; B.R.I.E.F. is an ungraded free-text workspace, not a
// select-with-feedback interaction, so it gets no interaction-stop gate) ──
const BATCHES = {
  A1: ['M11-01'],
  A2: ['M11-02'],
  A3: ['M11-03'],
  A4: ['M11-04'],
  A5: ['M11-05'],
  A6: ['M11-06'],
  B1: ['M11-07'],
  B2: ['M11-08'],
  B3: ['M11-09'],
  B4: ['M11-10'],
  B5: ['M11-11'],
  C1: ['M11-12']
};

const CHUNK_META = {
  'M11-07': { gateType: 'checkpoint-stop', checkpointId: 'm11cp1' },
  'M11-08': { gateType: 'post-pass', checkpointId: 'm11cp1', resumeAfterPass: true },
  'M11-11': { gateType: 'checkpoint-stop', checkpointId: 'm11cp2' },
  'M11-12': { gateType: 'post-pass', checkpointId: 'm11cp2', resumeAfterPass: true }
};

function firstLine(text) { return text.split('\n')[0].slice(0, 140); }
function lastLine(text) { const l = text.trim().split('\n').filter(Boolean); return l[l.length - 1].slice(-140); }

const manifest = { module: '11', version: 'v2-strict-fidelity', batches: [] };
let totalChars = 0;

for (const [batchId, chunkIds] of Object.entries(BATCHES)) {
  const parts = chunkIds.map((id) => {
    if (!(id in CHUNKS)) throw new Error(`Missing chunk text for ${id}`);
    return { chunkId: id, text: CHUNKS[id] };
  });
  const text = parts.map((p) => p.text).join('\n\n');
  const fileName = `M11-BATCH-${batchId}.txt`;
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
    gateType: CHUNK_META[chunkIds[0]]?.gateType || 'normal',
    resumeAfterPass: CHUNK_META[chunkIds[0]]?.resumeAfterPass || undefined,
    overCeiling: text.length >= 4500
  });
}

manifest.chunkMeta = Object.keys(CHUNKS).map((chunkId) => ({
  chunkId,
  normalizedChars: CHUNKS[chunkId].length,
  ...(CHUNK_META[chunkId] || {})
}));

writeFileSync(`${OUT_DIR}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(`Module 11 v2: ${manifest.batches.length} batches, ${totalChars} total chars`);
manifest.batches.forEach((b) => console.log(`  ${b.batchId}: ${b.normalizedChars} chars, chunks ${b.chunkIds.join(',')}, checkpoint ${b.checkpointRelationship || '--'}, gate ${b.gateType}${b.overCeiling ? ' [FLAG: >=4500]' : ''}`));
