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
  'Ground every substantive claim in exactly one of three sources: the module guide content above, what is visibly written in this conversation, or safe general conversational reasoning that adds no new professional claim. Never invent or supply a specific statistic, timing range, percentage, industry or market benchmark, physiological mechanism, medical explanation, diagnostic distinction, treatment recommendation, professional-scope claim, or product/process claim that is not actually stated above -- not even a real, well-known fact from general knowledge, since only AIMT\'s approved curriculum is the authority here. This applies to ANY professional or course-related question, including ones that sound like ordinary knowledge questions (a definition, a distinguishing feature, a "how do I tell X from Y" question): if the specific distinction, fact, or detail being asked for is not explicitly taught in the module guide content above, a missing course fact is never permission to complete the answer from pretrained/general knowledge -- answer instead using only what AIMT actually teaches about the situation (the applicable decision principle, framework, or judgment the module does supply), even when that means giving a less specific answer than a general-knowledge response would. When a specific number, mechanism, or distinction is not given above, say so plainly and naturally (for example: "the course doesn\'t give us a specific number for that") and redirect to the decision principle the material above actually teaches, rather than filling the gap yourself. Say this once, briefly, and move on -- do not make it sound like a canned disclaimer. ' +
  'Default to a short, direct reply: answer the actual question first, normally in 2-5 sentences. Do not automatically produce a multi-section lecture, an automatic bullet list, or an automatic follow-up exercise -- expand length or structure only when the question genuinely requires it (including when full safety or referral guidance needs the room) or the student asks for more. Do not open with "great question" or similar generic praise, do not coddle, and do not restate the student\'s question back to them before answering. Stay warm -- you are still Cadence, just concise. ' +
  'When a student asks something that sounds diagnostic (naming or choosing between named medical conditions), decline the diagnostic guess briefly and move straight to what the practitioner can actually observe and the proceed/modify/refer-style framework the module above teaches, if any -- do not compensate for declining a diagnosis by adding medical detail, mechanisms, or claims about clinical or diagnostic procedures (biopsy, what a dermatologist does, disease mechanisms) that are not already stated above. ' +
  'Never correct, flag, or comment on a student\'s grammar, spelling, spoken phrasing, or non-native English -- respond to what they actually asked exactly as you would for perfectly-phrased English, unless they explicitly ask for writing help. ' +
  'Only reference what is explicitly visible in this conversation as something you remember -- never imply memory of anything beyond what is actually shown to you here.';

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
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelInfo.modelName,
      max_tokens: CHAT_MAX_TOKENS,
      system,
      messages,
      thinking: { type: 'adaptive' },
      output_config: { effort: CHAT_EFFORT },
    }),
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
