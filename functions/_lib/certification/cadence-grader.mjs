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
//
// HARDENING (this version): this module previously carried its own older,
// weaker Anthropic integration pattern instead of the shared infrastructure
// Module 0-11 checkpoint grading already uses (functions/_lib/cadence/
// anthropic-response.mjs, functions/_lib/cadence/checkpoint-evaluation.mjs).
// It independently assumed `data.content[0].text` (silently breaking on any
// response with a leading non-text block, e.g. thinking), parsed model
// output with a greedy `/\{[\s\S]*\}/` regex over arbitrary prose (the same
// bug shape the grading regression writeup at docs/course-audit/
// cadence-sonnet5-grading-regression.md Section 8 root-caused and fixed for
// checkpoint grading), never checked for `stop_reason === 'max_tokens'`
// truncation, and capped output at 1000 tokens — well under the
// GRADING_MAX_TOKENS budget checkpoint grading's own regression proved
// necessary once adaptive thinking is enabled. None of that was a model
// defect; it was this file not yet having been brought onto the same
// infrastructure checkpoint grading already validated. Fixed by importing
// fetchAnthropicMessages/extractAnthropicTextSafe/isTruncatedByMaxTokens
// from anthropic-response.mjs (never reimplementing them here), the exact
// GRADING_MAX_TOKENS/GRADING_EFFORT/adaptive-thinking execution
// configuration checkpoint grading's own validation evidence is recorded
// against (functions/_lib/cadence/checkpoint-evaluation.mjs,
// cross-checked in model-config.mjs's registry), JSON-schema structured
// output narrowly scoped to each of this file's two existing response
// contracts, and the same direct-parse/fenced-fallback/fail-safe defensive
// parsing standard checkpoint grading uses instead of the old greedy regex.
// The two evaluator response contracts (correctnessScore/explicitUnsafe/
// patternTag for applied cases; criterionScores/explicitUnsafeDomains/
// patternTags/needsFollowUp/followUpPrompt/transitionLine for the
// practitioner conversation), every rubric, every scoring rule, and every
// certification threshold are unchanged by this fix.
//
// CORRECTION (post-review): the interview-turn structured-output schema
// initially built patternTags' object keys from rubricCriteria[].id (e.g.
// "c1") -- but patternTags/explicitUnsafeDomains are CRITICAL-DOMAIN-keyed
// (e.g. "D1"), never criterion-keyed, per the existing prompt text below
// and per scoring.mjs's scoreInterviewConversation()/
// interviewEvaluatorFlagsFromState()/evaluateCriticalDomains(), which look
// evaluator flags up by domain id. A criterion-keyed schema didn't reject
// anything -- it just forced well-formed JSON keyed the wrong way, which
// evaluatorFlags[domainId] would then silently fail to find, defeating the
// D1-D4 Type A/B safety gates without ever throwing. Fixed by deriving the
// schema's domain id set from the union of rubricCriteria[].
// criticalDomainEvidence instead. criterionScores is unaffected -- it was
// already, and remains, correctly keyed by criterion id.

import { resolveCadenceModel } from '../cadence/model-config.mjs';
import { fetchAnthropicMessages, extractAnthropicTextSafe, isTruncatedByMaxTokens } from '../cadence/anthropic-response.mjs';
import { GRADING_MAX_TOKENS, GRADING_EFFORT } from '../cadence/checkpoint-evaluation.mjs';

const CADENCE_EXAM_TONE =
  'Tone: warm, direct, clinically aware, and grounded. Supportive without being intimate, cheesy, robotic, or ' +
  'therapist-like. No filler. No coddling. No exaggerated praise. Never reveal a numeric score or rubric detail.';

// Narrow JSON Schema for evaluateStructuredCasePart's existing response
// contract — kept to the same documented supported subset checkpoint
// grading's schema uses (basic types, enum/anyOf, additionalProperties:
// false; no numeric min/max constraints).
const CASE_PART_EVALUATION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    correctnessScore: { type: 'number' },
    explicitUnsafe: { type: 'boolean' },
    patternTag: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  },
  required: ['correctnessScore', 'explicitUnsafe', 'patternTag'],
  additionalProperties: false,
};

// Narrow JSON Schema for evaluateInterviewTurn's existing response
// contract, built per call from interviewDef.rubricCriteria rather than
// hardcoded. Two DIFFERENT id vocabularies are in play here and must not be
// conflated:
//   - criterionScores is keyed by this interview's rubric CRITERION ids
//     (e.g. "c1", "c2" -- interviewDef.rubricCriteria[].id).
//   - explicitUnsafeDomains/patternTags are keyed by CRITICAL DOMAIN ids
//     (e.g. "D1"-"D4" -- interviewDef.rubricCriteria[].criticalDomainEvidence),
//     the exact same domain vocabulary scoring.mjs's
//     scoreInterviewConversation()/interviewEvaluatorFlagsFromState()/
//     evaluateCriticalDomains() key every Type A/Type B certification-gate
//     evidence point by. A domain can be shared by multiple criteria and a
//     criterion can touch zero domains, so the domain id set is the union
//     of every criterion's criticalDomainEvidence, never a reuse of
//     criterion ids. Getting this wrong would not reject bad output -- it
//     would silently produce well-formed JSON keyed the wrong way, which
//     scoreInterviewConversation()'s evaluatorFlags[domainId] lookup would
//     then simply fail to find, defeating the D1-D4 safety gates without
//     ever throwing. This mirrors the existing prompt text below ("keyed by
//     the relevant domain"), which this schema must reinforce, not narrow
//     away from.
function buildInterviewEvaluationJsonSchema(rubricCriteria) {
  const criteria = rubricCriteria || [];
  const criterionIds = criteria.map((c) => c.id);
  const criterionScoreProps = {};
  for (const id of criterionIds) {
    criterionScoreProps[id] = { type: 'integer', enum: [0, 1, 2] };
  }

  const domainIds = Array.from(new Set(criteria.flatMap((c) => c.criticalDomainEvidence || [])));
  const patternTagProps = {};
  for (const id of domainIds) patternTagProps[id] = { type: 'string' };
  // Constrain explicitUnsafeDomains to this interview's own valid domain
  // ids when any exist, so structured output reinforces the domain
  // contract rather than allowing an arbitrary string. When an interview
  // touches no critical domain at all, leave it as a plain string array
  // rather than an enum with zero allowed values (an empty enum is an
  // untested, likely-rejected schema shape, and downstream scoring simply
  // ignores any domain id here that never appears in that interview's own
  // rubric anyway).
  const explicitUnsafeDomainsSchema = domainIds.length
    ? { type: 'array', items: { type: 'string', enum: domainIds } }
    : { type: 'array', items: { type: 'string' } };

  return {
    type: 'object',
    properties: {
      criterionScores: {
        type: 'object',
        properties: criterionScoreProps,
        required: criterionIds,
        additionalProperties: false,
      },
      explicitUnsafeDomains: explicitUnsafeDomainsSchema,
      patternTags: {
        type: 'object',
        properties: patternTagProps,
        additionalProperties: false,
      },
      needsFollowUp: { type: 'boolean' },
      followUpPrompt: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      transitionLine: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    },
    required: ['criterionScores', 'explicitUnsafeDomains', 'patternTags', 'needsFollowUp', 'followUpPrompt', 'transitionLine'],
    additionalProperties: false,
  };
}

/** Extracts the content of one cleanly-fenced ```json ... ``` or ``` ... ``` block, if present. */
function extractFencedJsonBlock(text) {
  const match = String(text || '').match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match ? match[1] : null;
}

/**
 * Defensive parsing standard shared with checkpoint grading
 * (parseCheckpointEvaluation in checkpoint-evaluation.mjs): (1) direct
 * JSON.parse of the full trimmed text — the expected path once
 * output_config.format has constrained the response; (2) one cleanly-fenced
 * ```json block, for an edge case that didn't honor structured outputs;
 * (3) fail safe (returns null — never a greedy regex scan over arbitrary
 * prose, and never a manufactured/guessed result).
 */
function parseStructuredJson(rawText) {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    const fenced = extractFencedJsonBlock(trimmed);
    if (fenced) {
      try {
        return JSON.parse(fenced.trim());
      } catch (_) {
        return null;
      }
    }
    return null;
  }
}

/**
 * Shared Module 12 Anthropic call: resolves the CADENCE_GRADING_MODEL role,
 * calls through the shared fetchAnthropicMessages transport (bounded retry
 * on transient 5xx only — same as checkpoint grading), rejects a response
 * truncated by max_tokens as a recoverable evaluator failure before any
 * parsing is attempted, and extracts text via the shared, thinking-block-
 * safe extractor. Never returns thinking-block content — extractAnthropicTextSafe
 * only ever concatenates `type: 'text'` blocks.
 */
async function callAnthropic(env, { system, messages, jsonSchema }) {
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');
  const modelInfo = resolveCadenceModel(env, 'CADENCE_GRADING_MODEL');
  const data = await fetchAnthropicMessages({
    apiKey: env.ANTHROPIC_API_KEY,
    body: {
      model: modelInfo.modelName,
      max_tokens: GRADING_MAX_TOKENS,
      system,
      messages,
      thinking: { type: 'adaptive' },
      output_config: { effort: GRADING_EFFORT, format: { type: 'json_schema', schema: jsonSchema } },
    },
  });
  if (isTruncatedByMaxTokens(data)) {
    throw new Error('Cadence Module 12 evaluation was truncated before completing — treat as a recoverable evaluator failure, not a grading decision.');
  }
  const text = extractAnthropicTextSafe(data);
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
  const jsonSchema = buildInterviewEvaluationJsonSchema(interviewDef.rubricCriteria);
  const { text: raw, modelInfo } = await callAnthropic(env, { system, messages, jsonSchema });
  const parsed = parseStructuredJson(raw);
  if (!parsed || typeof parsed.criterionScores !== 'object' || parsed.criterionScores === null) {
    throw new Error('Cadence returned an unparseable interview evaluation — treat as a recoverable evaluator failure, not a grading decision.');
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
  const { text: raw, modelInfo } = await callAnthropic(env, { system, messages, jsonSchema: CASE_PART_EVALUATION_JSON_SCHEMA });
  const parsed = parseStructuredJson(raw);
  if (!parsed || typeof parsed.correctnessScore !== 'number') {
    throw new Error('Cadence returned an unparseable case evaluation — treat as a recoverable evaluator failure, not a grading decision.');
  }
  return {
    correctnessScore: Math.max(0, Math.min(1, parsed.correctnessScore)),
    explicitUnsafe: !!parsed.explicitUnsafe,
    patternTag: parsed.patternTag || null,
    modelInfo,
  };
}
