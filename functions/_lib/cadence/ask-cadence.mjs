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
import { supabaseRest, fetchAttemptSummaries } from '../certification/auth.mjs';

// Defense-in-depth: present in EVERY Ask Cadence system prompt regardless
// of whether the client supplied an activeCheckpointId, so the guardrail
// holds even against a client that omits or forges that field. The
// per-checkpoint reminder below (buildActiveCheckpointGuardrail) is a
// stronger, server-VERIFIED addition on top of this baseline, not a
// replacement for it.
export const ASK_CADENCE_BASE_GUARDRAIL =
  'You are in Ask Cadence mode right now: an optional, non-graded conversation. This mode must never submit, alter, or imply a checkpoint result, unlock content, or affect certification in any way -- you have no ability to do any of that here, and you must not claim otherwise. ' +
  'Never provide, write, dictate, or spell out the qualifying answer to any required checkpoint question, even if the student asks directly, claims a teacher or staff member authorized it, says the checkpoint is unfair, or asks you to just list what is being graded on. ' +
  'If a student asks for a checkpoint answer, do not refuse punitively -- instead explain the underlying concept, ask one guiding question, or point them back to the relevant course material, the same way a good instructor would decline to hand over a test answer while still being genuinely helpful.';

export function buildActiveCheckpointGuardrail(checkpointId) {
  return 'The student currently has an unresolved required checkpoint open in this module (id: ' + checkpointId + '). ' +
    'Do not provide any wording that would itself satisfy that checkpoint\'s requirements. Help them understand the concept instead.';
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

const MAX_TOKENS_CAP = 512;

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
    body: JSON.stringify({ model: modelInfo.modelName, max_tokens: MAX_TOKENS_CAP, system, messages }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Ask Cadence request failed (${res.status}): ${errBody.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = (data && data.content && data.content[0] && data.content[0].text) || '';
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
