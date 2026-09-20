// Server-side Cadence evaluation calls for the Module 12 final assessment.
//
// Deliberately calls Anthropic directly from this Cloudflare Pages Function
// (fetch only, matching this repo's "zero npm dependencies" rule) rather than
// routing through the client-facing `headspa-proxy` Worker: certification
// rubrics must never reach the browser (standard Section 16 / task
// instruction #14), and the Worker's contract is designed for client-issued
// checkpoint-grading calls with client-visible system prompts. Requires its
// own `ANTHROPIC_API_KEY` env var on the Pages project (separate from the
// Worker's copy of the same secret — same key value, different binding).
//
// Model identity is resolved through the centralized CADENCE_GRADING_MODEL
// role (functions/_lib/cadence/model-config.mjs) rather than a local
// hardcoded constant — see docs/course-audit/00-cadence-launch-sweep-build-
// contract.md Section 6 for why that constant used to drift silently.

import { resolveCadenceModel } from '../cadence/model-config.mjs';

const MAX_TOKENS_CAP = 1000;

const CADENCE_EXAM_TONE =
  'Tone: warm, direct, clinically aware, and grounded. Supportive without being intimate, cheesy, robotic, or ' +
  'therapist-like. No filler. No coddling. No exaggerated praise. Never reveal a numeric score or rubric detail.';

function extractFirstJsonObject(text) {
  const match = String(text || '').match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (_) {
    return null;
  }
}

async function callAnthropic(env, { system, messages, maxTokens = 600 }) {
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');
  const modelInfo = resolveCadenceModel(env, 'CADENCE_GRADING_MODEL');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelInfo.modelName,
      max_tokens: Math.min(maxTokens, MAX_TOKENS_CAP),
      system,
      messages,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Cadence evaluation request failed (${res.status}): ${errBody.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = (data && data.content && data.content[0] && data.content[0].text) || '';
  return { text, modelInfo };
}

/**
 * Evaluates one turn of a Part III practitioner-conversation interview.
 * @param {Object} params
 * @param {import('./content-schema.mjs').InterviewItem} params.interviewDef - full item, server-side only
 * @param {{role:'user'|'assistant', content:string}[]} params.priorTranscript
 * @param {string} params.studentResponse
 * @param {boolean} params.followUpAlreadyUsed
 * @returns {Promise<{criterionScores:Object<string,number>, explicitUnsafeDomains:string[], needsFollowUp:boolean, followUpPrompt?:string, transitionLine?:string}>}
 */
export async function evaluateInterviewTurn(env, { interviewDef, priorTranscript, studentResponse, followUpAlreadyUsed }) {
  const criteriaDescription = interviewDef.rubricCriteria
    .map((c) => {
      const trigger = c.explicitUnsafeRule ? ` EXPLICIT UNSAFE TRIGGER: ${c.explicitUnsafeRule.description}` : '';
      return `- ${c.id} (${c.label}): ${c.guidance}${trigger}`;
    })
    .join('\n');

  const followUpInstruction = followUpAlreadyUsed
    ? 'The one allowed follow-up has already been used for this conversation. You must finalize now — set needsFollowUp to false regardless of ambiguity.'
    : 'You may request exactly ONE follow-up, and only if a criterion is genuinely ambiguous or incomplete — never for polish or extra detail.';

  const system =
    `You are Cadence, evaluating a certification practitioner-conversation response against this human-authored rubric. ` +
    `Score EACH criterion 0 (not demonstrated / incorrect), 1 (partially demonstrated), or 2 (clearly demonstrated). ` +
    `Never invent new criteria beyond this rubric. Never grade grammar, vocabulary, or polish. ` +
    `If the student's stated reasoning matches a criterion's EXPLICIT UNSAFE TRIGGER description, include that criterion's domain in explicitUnsafeDomains regardless of its numeric score. ` +
    `${followUpInstruction}\n\nRubric:\n${criteriaDescription}\n\n${CADENCE_EXAM_TONE}\n\n` +
    `If a wrong or concerning answer reflects a specific recognizable misunderstanding (not just "incorrect"), name it as a short snake_case tag in patternTags, keyed by the relevant domain — this is used only to detect a MEANINGFUL REPEATED pattern across multiple independent assessment points, never to fail a domain from this single conversation alone.\n\n` +
    `Return valid JSON only in this shape: {"criterionScores": {"<criterionId>": 0|1|2, ...every criterion...}, "explicitUnsafeDomains": ["D1"], "patternTags": {"D1": "short_tag"}, "needsFollowUp": true|false, "followUpPrompt": "string, only if needsFollowUp is true", "transitionLine": "one short natural transition sentence, only if needsFollowUp is false"}`;

  const messages = [...priorTranscript, { role: 'user', content: studentResponse }];
  const { text: raw, modelInfo } = await callAnthropic(env, { system, messages, maxTokens: 700 });
  const parsed = extractFirstJsonObject(raw);
  if (!parsed || typeof parsed.criterionScores !== 'object') {
    throw new Error('Cadence returned an unparseable interview evaluation.');
  }
  return {
    criterionScores: parsed.criterionScores,
    explicitUnsafeDomains: Array.isArray(parsed.explicitUnsafeDomains) ? parsed.explicitUnsafeDomains : [],
    patternTags: parsed.patternTags && typeof parsed.patternTags === 'object' ? parsed.patternTags : {},
    needsFollowUp: !!parsed.needsFollowUp && !followUpAlreadyUsed,
    followUpPrompt: parsed.followUpPrompt || null,
    transitionLine: parsed.transitionLine || null,
    modelInfo,
  };
}

/**
 * Evaluates one structured-short-response case part.
 * @param {Object} params
 * @param {string} params.scenario
 * @param {import('./content-schema.mjs').CasePart} params.part
 * @param {string} params.studentResponse
 * @returns {Promise<{correctnessScore:number, explicitUnsafe:boolean, patternTag:string|null}>}
 */
export async function evaluateStructuredCasePart(env, { scenario, part, studentResponse }) {
  const rubricDescription = part.rubric ? JSON.stringify(part.rubric) : 'Use professional judgment against AIMT curriculum standards.';
  const system =
    'You are Cadence, evaluating one structured written response within an applied practitioner case for a certification exam. ' +
    `Score correctness from 0 to 1 (partial credit allowed) against this rubric: ${rubricDescription}. ` +
    'Set explicitUnsafe to true only if the response states an explicitly unsafe or out-of-scope professional decision, not merely an incomplete answer. ' +
    CADENCE_EXAM_TONE +
    '\n\nReturn valid JSON only: {"correctnessScore": 0-1, "explicitUnsafe": true|false, "patternTag": null or a short snake_case tag naming the specific misunderstanding if present}';
  const messages = [{ role: 'user', content: `Case scenario: ${scenario}\n\nPrompt: ${part.prompt}\n\nStudent response: ${studentResponse}` }];
  const { text: raw, modelInfo } = await callAnthropic(env, { system, messages, maxTokens: 400 });
  const parsed = extractFirstJsonObject(raw);
  if (!parsed || typeof parsed.correctnessScore !== 'number') {
    throw new Error('Cadence returned an unparseable case evaluation.');
  }
  return {
    correctnessScore: Math.max(0, Math.min(1, parsed.correctnessScore)),
    explicitUnsafe: !!parsed.explicitUnsafe,
    patternTag: parsed.patternTag || null,
    modelInfo,
  };
}
