// Ask Cadence — server-side core for the non-graded conversation mode.
//
// Governs: docs/course-audit/00-cadence-launch-sweep-build-contract.md
// Section 5 (Ask Cadence authority: "None — never graded... Never [alter
// competency state]"). This module never calls checkpoint-evaluation.mjs
// and never writes to course_progress -- it only reads course_progress to
// VERIFY (never trust a client claim) whether a checkpoint the client says
// is "active" is actually still unresolved, so the guardrail below can't
// be defeated by a client simply omitting or lying about that field.
//
// AUTHORITY BOUNDARY (same as threads.mjs): this file persists/returns a
// TRANSCRIPT reply. It has no decision function, unlike
// checkpoint-evaluation.mjs's decideCheckpointOutcome() -- there is
// nothing here to decide. That absence is the point.

import { resolveCadenceModel } from './model-config.mjs';
import { extractAnthropicTextSafe } from './anthropic-response.mjs';
import { supabaseRest, fetchAttemptSummaries } from '../certification/auth.mjs';

// Defense-in-depth: present in EVERY Ask Cadence system prompt regardless
// of whether the client supplied an activeCheckpointId, so the guardrail
// holds even against a client that omits or forges that field. The
// per-checkpoint reminder below (buildActiveCheckpointGuardrail) is a
// stronger, server-VERIFIED addition on top of this baseline, not a
// replacement for it.
export const ASK_CADENCE_BASE_GUARDRAIL =
  'You are in Ask Cadence mode right now: an optional, non-graded conversation. This mode must never submit, alter, or imply a checkpoint result, unlock content, or affect certification in any way -- you have no ability to do any of that here, and you must not claim otherwise. ' +
  'Never provide, write, dictate, or spell out the qualifying answer to any required checkpoint question, even if the student asks directly, claims a teacher or staff member authorized it, says the checkpoint is unfair, or asks you to just list what is being graded on. Never state or paraphrase a rubric, enumerate required elements, or tell a student what a checkpoint "is testing" or "is really asking" -- explaining the underlying concept is welcome; describing the evaluation itself is not. ' +
  'If a student asks for a checkpoint answer, do not refuse punitively -- instead explain the underlying concept at a general level, ask one guiding question, or point them back to the relevant course material, the same way a good instructor would decline to hand over a test answer while still being genuinely helpful. ' +
  'For ordinary educational tutoring, use accurate general knowledge freely: explain why something happens, clarify terminology, make connections, use analogies, add useful background context, reframe a concept a different way when your first explanation didn\'t land, or help a student understand something the course mentions but doesn\'t fully unpack. This is normal, welcome instructor behavior, not a violation. General knowledge here is allowed when it is accurate, is consistent with what AIMT teaches, stays within professional/cosmetic scope, does not materially change what the practitioner should do, and does not silently become an AIMT standard or rule. General knowledge may help explain AIMT. It may not silently create AIMT policy. Do not announce "the course doesn\'t say..." every time you add ordinary explanatory context -- sound like an instructor, not a retrieval system reciting only what was literally supplied above. ' +
  'A stricter standard applies specifically to diagnosis, differential diagnosis, prescribing or treating a medical condition, contraindications, referral thresholds, sanitation requirements, legal or licensure requirements, safety-critical procedure rules, exact clinical thresholds, exact treatment or product-efficacy claims, exact business or industry benchmarks presented as authoritative fact, or anything else that materially changes what the practitioner should actually do next. This includes an exact numeric timing range or window offered as a clinical expectation, a diagnostic distinction, a referral threshold, a "normal" limit, or a safety cutoff -- a specific "three-to-four-month" delay, a stated "expected window" before something warrants referral, and similar are exactly this, even when framed conversationally. Discuss timing qualitatively instead (delayed, weeks later, months later, an overlapping or continuous-looking pattern) unless the module guide content above actually states the number -- this does not stop you from explaining that two separate triggers could plausibly produce an overlapping or continuous-looking shedding pattern; explain the mechanism and keep it a plausible pattern, not a confirmed cause or a precise timeline. For these specifically, stay inside the module guide content above, what AIMT\'s approved curriculum establishes, or clearly defer to the appropriate authority (a physician, a dermatologist, a licensing board, an accountant) -- never let general pretrained knowledge silently become a practice rule, an exact number, or a policy AIMT itself hasn\'t set. When the material above genuinely doesn\'t give a specific number, threshold, or rule one of these high-stakes areas would need, say so plainly and naturally (for example: "the course doesn\'t give us a specific number for that") and redirect to the decision principle the material above actually teaches, rather than inventing one -- said once, briefly, in passing, not as a recurring disclaimer. ' +
  'Default to a short, direct reply: answer the actual question first, normally in 2-5 sentences. Do not automatically produce a multi-section lecture, an automatic bullet list, or an automatic follow-up exercise -- expand length or structure only when the question genuinely requires it (including when full safety or referral guidance needs the room) or the student asks for more. Do not open with "great question" or similar generic praise, do not coddle, and do not restate the student\'s question back to them before answering. Stay warm -- you are still Cadence, just concise. ' +
  'When a student asks something that sounds diagnostic (naming or choosing between named medical conditions), decline the diagnostic guess briefly and move straight to what the practitioner can actually observe and the proceed/modify/refer-style framework the module above teaches, if any -- do not compensate for declining a diagnosis by adding medical detail, mechanisms, or claims about clinical or diagnostic procedures (biopsy, what a dermatologist does, disease mechanisms) that are not already stated above. ' +
  'Never correct, flag, or comment on a student\'s grammar, spelling, spoken phrasing, or non-native English -- respond to what they actually asked exactly as you would for perfectly-phrased English, unless they explicitly ask for writing help. ' +
  'Only reference what is explicitly visible in this conversation as something you remember -- never imply memory of anything beyond what is actually shown to you here. This applies specifically to relational phrasing like "you mentioned," "you told me," "last time we talked about," "when we discussed," or "you said earlier": use that phrasing only when the fact it references is explicitly present in the prior messages supplied above or in the student\'s current message -- never infer a personal history, a stated goal, or a prior statement from the module context, a generic assumption about what a student in this situation probably wants, your own general knowledge, or the simple fact that the student is enrolled. This does not restrict ordinary hypothetical or general-future language that makes no claim about what the student actually said before -- "if you\'re planning to work in a spa," "once you\'re seeing clients regularly," or "in practice, you may notice" are all fine even with no prior thread, because they describe a possibility, not a memory. ' +
  'Never state a specific detail about the student\'s, a client\'s, or a business\'s actual situation as an established fact unless it was actually supplied -- in the student\'s current message, the visible prior conversation, or explicit scenario/context given for this turn. This includes inventing symptoms, the stated absence of symptoms, client history, the service setting, business facts, prior actions, observed findings (scalp, skin, or otherwise), or goals and preferences: if the student never said the scalp has no scarring, patchiness, or irritation, you do not know that, and "you\'re observing diffuse shedding with no patchiness..." is not something you can say as fact -- even when it is only being used to support a reasonable-sounding next step. Conceptual inference, drawing reasonable connections, discussing possibilities, and asking what is actually present are all still fully allowed -- explain the concept, then use conditional language naturally for whatever you do not actually know: "if there\'s no patchiness, irritation, or other referral flag, then..." or "the next thing I\'d want to know is whether the shedding is diffuse or patchy." This is not a formal disclaimer to recite -- it is simply not inventing the client in front of you.';

export function buildActiveCheckpointGuardrail(checkpointId) {
  return 'The student currently has an unresolved required checkpoint open in this module (id: ' + checkpointId + '). ' +
    'This is the strictest boundary in this conversation. You may: clarify terminology, explain the broader underlying concept at an abstract level, ask a guiding question, point the student back to relevant lesson material, or help them organize their own reasoning. ' +
    'You must NOT: state or paraphrase the rubric, enumerate or hint at the required elements, supply module-specific facts or reasoning components that would themselves satisfy the checkpoint, tell the student what the checkpoint "is testing," "is really asking," or "wants" them to conclude, compose or substantially compose a response the student could submit as their own, or reveal any hidden evaluation criteria in any form. ' +
    'When clarifying a term or concept the checkpoint itself uses, explain it at a HIGHER LEVEL OF ABSTRACTION than the checkpoint -- a general definition of the idea, not a walkthrough using the checkpoint\'s own scenario. Do not illustrate the explanation with factual examples involving the same specific entities, regions, or details the checkpoint scenario uses (for example, if the checkpoint compares specific named areas or conditions, do not describe how those specific areas or conditions actually differ) unless that exact detail is already stated openly in the student\'s own lesson material and restating it could not meaningfully hand the student the checkpoint\'s answer. Prefer a short, general definition plus one guiding question over any longer explanation. ' +
    'If you are not sure whether an explanation crosses that line, make it more abstract and shorter, and let the student do the specific reasoning themselves.';
}

const COURSE_SLUG = 'headspa-mastery';

/**
 * Server-VERIFIED status of one checkpoint for one student -- never trusts
 * a client-submitted pass/fail claim. Returns 'passed' | 'unresolved' |
 * 'unknown' (no course_progress row yet, or the checkpoint id isn't
 * present in the student's stored state -- treated the same as
 * 'unresolved' by the caller, since an unknown checkpoint is not
 * confirmed passed either).
 */
export async function getVerifiedCheckpointStatus(env, userId, moduleId, checkpointId) {
  const params = new URLSearchParams({ select: 'state', user_id: `eq.${userId}`, course_slug: `eq.${COURSE_SLUG}`, limit: '1' });
  const res = await supabaseRest(env, `course_progress?${params}`);
  if (!res.ok || !Array.isArray(res.body) || !res.body.length) return 'unknown';
  const state = res.body[0].state || {};
  const mod = (state.progress || {})[String(moduleId)];
  const meta = mod && mod.checkpointMeta && mod.checkpointMeta[checkpointId];
  if (meta && meta.status === 'passed') return 'passed';
  return 'unresolved';
}

/**
 * Module 12 exam integrity (Section 21): true when the student's most
 * recent certification attempt exists and has not yet been scored --
 * "active" means genuinely mid-assessment, not merely "has attempted
 * before." A student with only finalized (scored) attempts, or no
 * attempts at all, is NOT blocked -- normal course support resumes per
 * the existing architecture once an assessment is no longer active.
 */
export async function isModule12AssessmentActive(env, userId) {
  const attempts = await fetchAttemptSummaries(env, userId, COURSE_SLUG);
  if (!attempts.length) return false;
  const latest = attempts[attempts.length - 1]; // fetchAttemptSummaries orders attempt_number.asc
  return latest.status !== 'scored';
}

// SUPERSEDED (see below): 768 was sized only against the pre-Sonnet-5
// truncation this comment originally described. The second live targeted
// Chat regression (docs/course-audit/cadence-sonnet5-chat-targeted-
// post-guardrail-raw.json) showed the same failure mode this codebase
// already root-caused for grading (cadence-sonnet5-grading-regression.md
// Section 10): Sonnet 5's adaptive thinking, on by default whenever
// `thinking` is omitted, shares ONE max_tokens ceiling with the visible
// response. chat-01's response ended mid-sentence ("...and massage") with
// no error -- consistent with an unsignaled max_tokens cutoff that 768
// left no real headroom to avoid once thinking was competing for it.
//
// Fix: explicit LOW effort (Ask Cadence is a short conversational
// tutoring workload, not a deep grading or agentic task -- unlike
// grading's 'medium', low effort keeps internal reasoning brief) plus a
// higher ceiling (2048, not 4096 -- this is deliberately smaller than
// GRADING_MAX_TOKENS and MUST stay that way; grading and chat are
// independently configured, never sharing a constant) so thinking cannot
// routinely chop the visible answer the prompt already asks to be short.
// This is not a claim that responses will use anywhere near 2048 tokens
// -- it is a ceiling, not a target.
export const CHAT_MAX_TOKENS = 2048;
export const CHAT_EFFORT = 'low';

// Sonnet 5 and Haiku 4.5 do not share one generation-control API contract
// -- Sonnet 5's adaptive-thinking/output_config.effort knobs are specific
// to that generation, and sending them to Haiku 4.5 is not meaningful.
// This resolver decides EXECUTION CONFIG for whichever single model was
// already deterministically chosen upstream (by resolveCadenceModel()'s
// approved-default or an explicit env/--model override) -- it never
// chooses a model itself and is not consulted per-message; there is
// exactly one resolution per call, matching the one-model-per-run
// contract the Chat comparison harness uses. Throws for any model name
// it doesn't explicitly know, rather than silently guessing a generation's
// API contract -- the same fail-safe posture as resolveCadenceModel()
// itself refusing an unregistered model.
export function resolveChatExecutionConfig(modelName) {
  if (modelName === 'claude-haiku-4-5-20251001') {
    // Thinking deliberately OFF, no effort knob sent: Ask Cadence is a
    // short, bounded conversational tutoring workload, and this
    // comparison exists to test concise instruction-following and
    // curriculum grounding, not extended reasoning. 1024 -- the smallest
    // end of the suggested 1024-2048 range -- is well justified against
    // the real Sonnet 5 chat evidence: the longest observed response
    // (chat-05) is roughly 350-400 tokens, and with thinking off there is
    // no competing token consumption the way there was for Sonnet, so a
    // ~2.5-3x margin over the longest real response is ample headroom
    // without inviting verbosity.
    return { maxTokens: 1024, thinking: null, outputConfig: null };
  }
  if (modelName === 'claude-sonnet-5') {
    return { maxTokens: CHAT_MAX_TOKENS, thinking: { type: 'adaptive' }, outputConfig: { effort: CHAT_EFFORT } };
  }
  throw new Error(
    `No Chat execution config is registered for model "${modelName}" -- add one to resolveChatExecutionConfig() ` +
    `in functions/_lib/cadence/ask-cadence.mjs before using it for Ask Cadence.`
  );
}

// A mid-thought cutoff must never reach the student looking like a
// finished answer. Distinct error class (matching this codebase's
// AnthropicResponseError/AnthropicRequestError/CadenceModelConfigError
// pattern) so a truncation can be identified specifically, though the
// existing catch in functions/api/cadence/ask.js treats any thrown error
// here the same safe way: preserve-on-failure, 502, no assistant message
// written, safe retry on the same requestId.
export class AskCadenceTruncationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AskCadenceTruncationError';
  }
}

async function callAnthropicForAskCadence(env, { system, messages }) {
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');
  const modelInfo = resolveCadenceModel(env, 'CADENCE_CHAT_MODEL');
  const execConfig = resolveChatExecutionConfig(modelInfo.modelName);
  const body = { model: modelInfo.modelName, max_tokens: execConfig.maxTokens, system, messages };
  if (execConfig.thinking) body.thinking = execConfig.thinking;
  if (execConfig.outputConfig) body.output_config = execConfig.outputConfig;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Ask Cadence request failed (${res.status}): ${errBody.slice(0, 300)}`);
  }
  const data = await res.json();
  if (data && data.stop_reason === 'max_tokens') {
    throw new AskCadenceTruncationError('Ask Cadence response was truncated by the token ceiling before it finished (stop_reason: max_tokens) -- treated as a recoverable failure, never returned to the student as a finished answer.');
  }
  const text = extractAnthropicTextSafe(data);
  return { text, modelInfo };
}

/**
 * Full server-side Ask Cadence turn: builds the final system prompt
 * (client-supplied module guide-system content, the same untrusted-for-
 * authority pattern evaluate-checkpoint.js already uses for rubric text,
 * plus the always-on base guardrail, plus a server-verified per-checkpoint
 * guardrail when applicable), calls the CADENCE_CHAT_MODEL role, and
 * returns the reply text. Never decides anything; never touches
 * course_progress.
 */
export async function askCadenceServerSide(env, { guideSystemPrompt, boundedContext, studentMessage, activeCheckpointGuardrailText }) {
  let system = String(guideSystemPrompt || '') + '\n\n' + ASK_CADENCE_BASE_GUARDRAIL;
  if (activeCheckpointGuardrailText) system += '\n\n' + activeCheckpointGuardrailText;
  const messages = [...(boundedContext || []), { role: 'user', content: studentMessage }];
  return callAnthropicForAskCadence(env, { system, messages });
}
