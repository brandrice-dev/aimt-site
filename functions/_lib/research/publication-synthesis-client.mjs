/* ═══════════════════════════════════════════════════════════════
   AIMT Publication Editor v2 — AI synthesis client (I/O layer)
   ---------------------------------------------------------------
   The ONLY module in Publication Editor v2 that makes a network call.
   Everything it produces is treated as an untrusted PROPOSAL by
   publication-synthesis-validator.mjs -- this module never decides
   AUTO_READY/HUMAN_REVIEW itself, it only asks the model and reports
   what came back (or that nothing usable came back).

   Reuses functions/_lib/cadence/anthropic-response.mjs's
   fetchAnthropicMessages() (bounded-retry POST) and
   extractAnthropicTextSafe() (content-block-safe text extraction) --
   generic Anthropic Messages API HTTP utilities with zero Cadence
   business logic, imported read-only. See publication-editor-model-
   config.mjs's header for why the MODEL SELECTION itself is not
   likewise reused from Cadence's registry.

   CREDENTIAL: uses its OWN dedicated env var,
   ANTHROPIC_PUBLICATION_EDITOR_API_KEY -- never Cadence's
   ANTHROPIC_API_KEY. Same rationale as the isolated model registry: this
   is a separate subsystem with its own key, its own usage/spend, and its
   own blast radius if ever misconfigured, never sharing or reading
   Cadence's credential.

   STEP 12 (model failure safety): every failure mode here -- missing
   API key, transport/HTTP failure, max_tokens truncation, unparseable
   JSON -- returns a tagged failure result rather than throwing past
   this module uncaught, so the CLI orchestrator can uniformly map any
   of them to SYNTHESIS_FAILED and never accidentally treat a failed
   call as an implicit AUTO_READY.
   ═══════════════════════════════════════════════════════════════ */

import { fetchAnthropicMessages, extractAnthropicTextSafe } from '../cadence/anthropic-response.mjs';
import { resolvePublicationEditorSynthesisModel, PublicationEditorModelConfigError } from './publication-editor-model-config.mjs';
import { SYNTHESIS_OUTPUT_JSON_SCHEMA, SYNTHESIS_OUTPUT_CONTRACT_VERSION, buildSynthesisInstruction } from './publication-synthesis-schema.mjs';
import { getPageSynthesisIntent } from './publication-page-intent.mjs';

// Generous headroom for a topic-wide candidate set the size hair-cycle's
// (128 candidate claims) -- see checkpoint-evaluation.mjs's own
// GRADING_MAX_TOKENS precedent for why this repo prefers a clearly
// oversized round-number ceiling to routine max_tokens termination over a
// tightly-tuned one that risks silently truncating a well-formed response.
//
// CORRECTED TWICE from an initial 16000: a live hair-cycle run against the
// full 128-claim/27-source bundle hit stop_reason:max_tokens at that
// ceiling -- adaptive thinking plus a fully-enumerated per-claim
// disposition output (every one of 128 claims requires its own selected/
// excluded entry, per the validator's full-accounting rule) needs more
// headroom than a several-criterion grading rubric ever did. Raised to
// 32000, then found to still truncate once the evidence bundle actually
// carried real claim_text (see publication-readiness-loader.mjs's
// CLAIM_SELECT_FIELDS fix) -- richer per-claim reasoning grounded in real
// wording produces materially longer selected/excluded reasons than the
// earlier claim_text-less run did. Raised to 64000 rather than reducing
// `thinking`/effort quality to fit a tighter ceiling.
export const SYNTHESIS_MAX_TOKENS = 64000;
export const SYNTHESIS_EFFORT = 'medium';

/** Never throws -- returns a tagged failure object instead, per STEP 12. */
function failure(reason, detail) {
  return { ok: false, reason, detail: detail || null };
}

function parseSynthesisOutput(rawText) {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    // Fallback for a model/config that didn't honor output_config.format
    // (e.g. an override to a model without structured-outputs support) --
    // same one-fenced-block fallback as checkpoint-evaluation.mjs's
    // parseCheckpointEvaluation(), never a greedy brace-scan regex.
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (!fenced) return null;
    try {
      return JSON.parse(fenced[1]);
    } catch (_) {
      return null;
    }
  }
}

/**
 * Calls the AI Publication Editor to synthesize one topic's evidence
 * bundle into a page-evidence proposal. Returns either
 * { ok: true, output, modelInfo, rawText } or
 * { ok: false, reason, detail } -- never throws for an ordinary
 * request/parse failure (STEP 12); a thrown PublicationEditorModelConfigError
 * for a misconfigured/unregistered model override is allowed to propagate,
 * since that is a caller configuration bug, not a runtime synthesis failure.
 *
 * @param {Object} env - must carry ANTHROPIC_PUBLICATION_EDITOR_API_KEY (a
 *   dedicated credential, separate from Cadence's own ANTHROPIC_API_KEY --
 *   see module header) and optionally PUBLICATION_EDITOR_SYNTHESIS_MODEL
 *   to override the resolved model
 * @param {{topic_slug: string, evidenceBundle: {claims: object[], sources: object[]}}} params
 */
export async function synthesizeTopic(env, { topic_slug, evidenceBundle }) {
  if (!env || !env.ANTHROPIC_PUBLICATION_EDITOR_API_KEY) {
    return failure('missing_api_key', 'ANTHROPIC_PUBLICATION_EDITOR_API_KEY not configured in this environment.');
  }

  let modelInfo;
  try {
    modelInfo = resolvePublicationEditorSynthesisModel(env);
  } catch (err) {
    if (err instanceof PublicationEditorModelConfigError) throw err;
    throw err;
  }

  const intent = getPageSynthesisIntent(topic_slug);
  const system = buildSynthesisInstruction({
    pageConcept: intent.page_concept,
    publicIntent: intent.public_intent,
    inScopeConcepts: intent.in_scope_concepts,
    outOfScopeConcepts: intent.out_of_scope_concepts,
  });
  const userContent = JSON.stringify({
    topic_slug,
    page_concept: intent.page_concept,
    evidence_bundle: evidenceBundle,
  });

  let data;
  try {
    data = await fetchAnthropicMessages({
      apiKey: env.ANTHROPIC_PUBLICATION_EDITOR_API_KEY,
      body: {
        model: modelInfo.modelName,
        max_tokens: SYNTHESIS_MAX_TOKENS,
        system,
        messages: [{ role: 'user', content: userContent }],
        thinking: { type: 'adaptive' },
        output_config: { effort: SYNTHESIS_EFFORT, format: { type: 'json_schema', schema: SYNTHESIS_OUTPUT_JSON_SCHEMA } },
      },
    });
  } catch (err) {
    return failure('request_failed', String((err && err.message) || err));
  }

  if (data && data.stop_reason === 'max_tokens') {
    return failure('truncated', `Synthesis response was truncated by the token ceiling (max_tokens=${SYNTHESIS_MAX_TOKENS}) before it finished.`);
  }

  const rawText = extractAnthropicTextSafe(data);
  const parsed = parseSynthesisOutput(rawText);
  if (!parsed) {
    return failure('unparseable_output', 'Synthesis response was not valid JSON and no fenced JSON block fallback was found.');
  }

  return {
    ok: true,
    output: parsed,
    rawText,
    modelInfo,
    contractVersion: SYNTHESIS_OUTPUT_CONTRACT_VERSION,
  };
}
