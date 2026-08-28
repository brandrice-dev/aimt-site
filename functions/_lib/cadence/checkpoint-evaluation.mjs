// Structured checkpoint-evaluation contract + deterministic decision layer.
//
// Formalizes the existing Module 0-11 checkpoint standard --
// docs/course-audit/00-cadence-launch-sweep-build-contract.md Section 15
// ("Cadence evaluates. AIMT rules decide.") -- without rewriting a single
// checkpoint's ID, prompt, required elements, or rubric. The human-authored
// rubric text (headspa-mastery.html's M0..M11 objects) is unchanged and is
// still what the model is evaluated against; this module only changes WHO
// computes pass/fail from that evaluation: previously the model's own
// `pass` boolean was trusted directly (functions/api client-side
// normalizeCheckpointEvaluation()); now the model returns structured
// evidence and decideCheckpointOutcome() -- a pure, human-authored,
// independently-testable function -- makes the actual decision.
//
// Contract: the model is asked to identify which of the rubric's own
// stated required elements were demonstrated vs. missing, and whether an
// explicit unsafe/prohibited response (already described in the rubric
// text itself) was given -- never to invent new requirements.
//
// RESPONSE-FORMAT CONTRACT (corrected): the original instruction asked for
// "your normal evaluation" *in addition to* a JSON object "(and nothing
// else)" -- a self-contradictory ask that invited prose, which then broke
// extractFirstJsonObject()'s single greedy brace-match regex (any brace in
// that prose shifted the match boundary). Root-caused in the Sonnet 5 live
// regression -- see docs/course-audit/cadence-sonnet5-grading-regression.md
// Section 8. Fixed two ways, together: (1) the request now sends
// `output_config.format` (JSON Schema structured outputs -- confirmed
// supported for the CADENCE_GRADING_MODEL/CADENCE_CHAT_MODEL candidate on
// the current Messages API, no SDK/beta header needed, works over plain
// fetch), which constrains the entire response text to the schema rather
// than merely asking nicely; (2) parseCheckpointEvaluation() below no
// longer uses a greedy regex at all -- it attempts a direct parse of the
// full (trimmed) response, falls back to one cleanly-fenced ```json block,
// and otherwise fails safe. Both layers matter: structured outputs is the
// primary fix, but refusals/truncation/a fallback model without structured-
// output support can still produce non-conformant text, so the parser
// stays defensive rather than assuming the schema was honored.

import { resolveCadenceModel } from './model-config.mjs';
import { extractAnthropicTextSafe } from './anthropic-response.mjs';

export const CHECKPOINT_EVAL_CONTRACT_VERSION = 'checkpoint-eval-v1';

// JSON Schema for output_config.format -- kept to the documented supported
// subset (basic types, enum/anyOf, additionalProperties:false; no
// minLength/numeric constraints, no recursive $ref).
export const CHECKPOINT_EVALUATION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    requiredElementsDemonstrated: { type: 'array', items: { type: 'string' } },
    requiredElementsMissing: { type: 'array', items: { type: 'string' } },
    unsafeReasoning: { type: 'boolean' },
    unsafeReasoningDescription: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    feedback: { type: 'string' },
  },
  required: ['requiredElementsDemonstrated', 'requiredElementsMissing', 'unsafeReasoning', 'unsafeReasoningDescription', 'feedback'],
  additionalProperties: false,
};

export const CHECKPOINT_EVAL_INSTRUCTION =
  'Evaluate the student answer above against the rubric. The response format is already constrained by the request -- your job is what goes in each field, not how to format the response:\n' +
  '"requiredElementsDemonstrated": a short label for each required element from the rubric above that this answer clearly demonstrates.\n' +
  '"requiredElementsMissing": a short label for each required element from the rubric above that is missing, vague, or incorrect. Grammar, spelling, phrasing style, and non-native or spoken-language patterns are never grounds to list an element here -- judge only whether the required reasoning or content is present, never the writing quality it is expressed in.\n' +
  '"unsafeReasoning": true only when the response contains the specific unsafe, diagnostic, or prohibited position the rubric above already describes as something to correct immediately -- a taught, high-consequence, out-of-scope claim. An answer that is merely incomplete, vague, or generically wrong is never grounds for unsafeReasoning: true on its own.\n' +
  '"unsafeReasoningDescription": one sentence naming the unsafe position, only when unsafeReasoning is true, else null.\n' +
  '"feedback": the same short, specific feedback you would give the student.\n' +
  'Base "required elements" strictly on the numbered/listed requirements already stated in the rubric above -- do not invent, add, or drop a requirement the rubric does not state.';

/** Extracts the content of one cleanly-fenced ```json ... ``` or ``` ... ``` block, if present. */
function extractFencedJsonBlock(text) {
  const match = String(text || '').match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match ? match[1] : null;
}

function isWellShapedEvaluation(parsed) {
  return !!parsed && typeof parsed === 'object' &&
    Array.isArray(parsed.requiredElementsDemonstrated) &&
    Array.isArray(parsed.requiredElementsMissing) &&
    typeof parsed.unsafeReasoning === 'boolean';
}

/**
 * Parses raw model text into structured evidence. Never throws; an
 * unparseable or wrongly-shaped response becomes evidence with one missing
 * element (`unparseable-response`), which decideCheckpointOutcome() below
 * always treats as REVISE -- a malformed model response can never pass by
 * construction, not by a special case bolted on afterward.
 *
 * Order: (1) direct JSON.parse of the full trimmed text -- the expected
 * path when output_config.format constrained the response; (2) one
 * cleanly-fenced ```json block, for a fallback model or edge case that
 * didn't honor structured outputs; (3) fail safe. Deliberately no regex
 * that scans for balanced/arbitrary braces -- that's the exact mechanism
 * that let surrounding prose corrupt extraction before this fix.
 */
export function parseCheckpointEvaluation(rawText) {
  const trimmed = String(rawText || '').trim();

  let parsed = null;
  if (trimmed) {
    try {
      parsed = JSON.parse(trimmed);
    } catch (_) {
      const fenced = extractFencedJsonBlock(trimmed);
      if (fenced) {
        try {
          parsed = JSON.parse(fenced.trim());
        } catch (_) {
          parsed = null;
        }
      }
    }
  }

  if (!isWellShapedEvaluation(parsed)) {
    return {
      requiredElementsDemonstrated: [],
      requiredElementsMissing: ['unparseable-response'],
      unsafeReasoning: false,
      unsafeReasoningDescription: null,
      feedback: '',
      malformed: true,
    };
  }
  return {
    requiredElementsDemonstrated: parsed.requiredElementsDemonstrated.filter((x) => typeof x === 'string'),
    requiredElementsMissing: parsed.requiredElementsMissing.filter((x) => typeof x === 'string'),
    unsafeReasoning: parsed.unsafeReasoning === true,
    unsafeReasoningDescription: typeof parsed.unsafeReasoningDescription === 'string' ? parsed.unsafeReasoningDescription : null,
    feedback: typeof parsed.feedback === 'string' ? parsed.feedback.trim() : '',
    malformed: false,
  };
}

/**
 * The deterministic AIMT decision function. Pure -- no I/O, no Anthropic
 * call, independently unit-testable. This is the human-authored rule the
 * model's evidence is evaluated against:
 *
 *   ALL required elements demonstrated AND no unsafe reasoning -> PASS
 *   any required element missing, OR unsafe reasoning present  -> REVISE
 *
 * Unsafe reasoning always overrides to REVISE regardless of what else was
 * demonstrated (matches e.g. M1cp1's rubric: "Immediately correct -- do
 * not pass -- a response that diagnoses alopecia..."). No evidence at all
 * (neither demonstrated nor missing reported) is never silently treated as
 * a pass.
 *
 * @param {{requiredElementsDemonstrated:string[], requiredElementsMissing:string[], unsafeReasoning:boolean}} evidence
 * @returns {{decision:'pass'|'revise', reason:string}}
 */
export function decideCheckpointOutcome(evidence) {
  const missing = Array.isArray(evidence && evidence.requiredElementsMissing) ? evidence.requiredElementsMissing : [];
  const demonstrated = Array.isArray(evidence && evidence.requiredElementsDemonstrated) ? evidence.requiredElementsDemonstrated : [];
  const unsafe = !!(evidence && evidence.unsafeReasoning);

  if (unsafe) return { decision: 'revise', reason: 'unsafe_reasoning' };
  if (missing.length > 0) return { decision: 'revise', reason: 'missing_required_elements' };
  if (demonstrated.length > 0) return { decision: 'pass', reason: 'all_required_elements_demonstrated' };
  return { decision: 'revise', reason: 'no_evidence' };
}

const DEFAULT_PASS_FEEDBACK = 'That answers the checkpoint clearly enough to move forward.';
const DEFAULT_REVISE_FEEDBACK = 'Your answer is not complete yet. Tighten it up and answer the full question directly.';

/**
 * Combines evidence + the decision function into the full structured
 * record. Server-only -- checkpointId/rubricVersion/provider/modelName are
 * known server-side context, never asked of the model.
 */
export function buildCheckpointEvaluationRecord({ checkpointId, rubricVersion, rawText, modelInfo }) {
  const evidence = parseCheckpointEvaluation(rawText);
  const outcome = decideCheckpointOutcome(evidence);
  const feedback = evidence.feedback || (outcome.decision === 'pass' ? DEFAULT_PASS_FEEDBACK : DEFAULT_REVISE_FEEDBACK);
  return {
    contractVersion: CHECKPOINT_EVAL_CONTRACT_VERSION,
    checkpointId,
    rubricVersion: rubricVersion || null,
    decision: outcome.decision,
    reason: outcome.reason,
    requiredElementsDemonstrated: evidence.requiredElementsDemonstrated,
    requiredElementsMissing: evidence.requiredElementsMissing,
    unsafeReasoning: evidence.unsafeReasoning,
    unsafeReasoningDescription: evidence.unsafeReasoningDescription,
    feedback,
    modelInfo: modelInfo || null,
  };
}

/**
 * A short, deterministic, non-cryptographic version tag for a rubric's
 * exact current text -- so a stored evaluation can later be traced back to
 * exactly which rubric wording produced it, without hand-maintaining a
 * version number for each of the ~20 existing checkpoints (none of their
 * text is changing) and without an async Web Crypto call on this hot path.
 * FNV-1a: simple, fast, deterministic, dependency-free.
 */
export function rubricVersionTag(rubricText) {
  const str = String(rubricText || '');
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return 'rubric-' + (hash >>> 0).toString(16).padStart(8, '0');
}

const MAX_TOKENS_CAP = 400;

async function callAnthropicForCheckpoint(env, { system, messages }) {
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
      max_tokens: MAX_TOKENS_CAP,
      system,
      messages,
      output_config: { format: { type: 'json_schema', schema: CHECKPOINT_EVALUATION_JSON_SCHEMA } },
    }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Checkpoint evaluation request failed (${res.status}): ${errBody.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = extractAnthropicTextSafe(data);
  return { text, modelInfo };
}

/**
 * The full server-side evaluation: builds the prompt from the checkpoint's
 * existing (unmodified) rubric + the structured-evidence instruction,
 * calls Anthropic through the centralized CADENCE_CHAT_MODEL role (fails
 * safe -- see model-config.mjs -- if nothing is approved and no override
 * is given, exactly like any other evaluator failure to the caller), and
 * returns the full decided record. Never throws on a malformed model
 * response (that's handled by parseCheckpointEvaluation's safe default);
 * only throws on a genuine request/config failure, which the caller
 * (functions/api/cadence/evaluate-checkpoint.js) already handles the same
 * way submit-interview-turn.js handles an Anthropic outage.
 */
export async function evaluateCheckpointServerSide(env, { checkpointId, systemPrompt, question, studentResponse }) {
  const rubricVersion = rubricVersionTag(systemPrompt);
  const system = systemPrompt + '\n\n' + CHECKPOINT_EVAL_INSTRUCTION;
  const messages = [{ role: 'user', content: 'Checkpoint question: ' + question + '\n\nStudent answer: ' + studentResponse }];
  const { text: rawText, modelInfo } = await callAnthropicForCheckpoint(env, { system, messages });
  return buildCheckpointEvaluationRecord({ checkpointId, rubricVersion, rawText, modelInfo });
}
