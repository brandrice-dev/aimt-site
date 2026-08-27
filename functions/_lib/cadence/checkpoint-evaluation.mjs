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

import { resolveCadenceModel } from './model-config.mjs';

export const CHECKPOINT_EVAL_CONTRACT_VERSION = 'checkpoint-eval-v1';

export const CHECKPOINT_EVAL_INSTRUCTION =
  'In addition to your normal evaluation, return your assessment as a single JSON object (and nothing else) in exactly this shape:\n' +
  '{"requiredElementsDemonstrated": ["short label for each required element from the rubric above that this answer clearly demonstrates"], ' +
  '"requiredElementsMissing": ["short label for each required element from the rubric above that is missing, vague, or incorrect"], ' +
  '"unsafeReasoning": true|false, ' +
  '"unsafeReasoningDescription": "one sentence, only if unsafeReasoning is true, else null", ' +
  '"feedback": "the same short, specific feedback you would give the student"}\n' +
  'Base "required elements" strictly on the numbered/listed requirements already stated in the rubric above -- do not invent, add, or drop a requirement the rubric does not state. ' +
  'Set unsafeReasoning to true only for the specific unsafe, diagnostic, or prohibited response the rubric above already describes as something to correct immediately -- never for an ordinary incomplete or generic answer.';

/** Extracts the first top-level JSON object from free-form model text. */
function extractFirstJsonObject(text) {
  const match = String(text || '').match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (_) {
    return null;
  }
}

/**
 * Parses raw model text into structured evidence. Never throws; an
 * unparseable response becomes evidence with one missing element
 * (`unparseable-response`), which decideCheckpointOutcome() below always
 * treats as REVISE -- a malformed model response can never pass by
 * construction, not by a special case bolted on afterward.
 */
export function parseCheckpointEvaluation(rawText) {
  const parsed = extractFirstJsonObject(rawText);
  if (!parsed || typeof parsed !== 'object') {
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
    requiredElementsDemonstrated: Array.isArray(parsed.requiredElementsDemonstrated)
      ? parsed.requiredElementsDemonstrated.filter((x) => typeof x === 'string')
      : [],
    requiredElementsMissing: Array.isArray(parsed.requiredElementsMissing)
      ? parsed.requiredElementsMissing.filter((x) => typeof x === 'string')
      : [],
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
    body: JSON.stringify({ model: modelInfo.modelName, max_tokens: MAX_TOKENS_CAP, system, messages }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Checkpoint evaluation request failed (${res.status}): ${errBody.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = (data && data.content && data.content[0] && data.content[0].text) || '';
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
