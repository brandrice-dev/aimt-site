/* ═══════════════════════════════════════════════════════════════
   AIMT Publication Editor v2 — AI synthesis client (I/O layer)
   ---------------------------------------------------------------
   The ONLY module in Publication Editor v2 that makes network calls.
   Everything it produces is treated as an untrusted PROPOSAL by
   publication-synthesis-validator.mjs / publication-synthesis-
   reconciliation.mjs -- this module never decides AUTO_READY/
   HUMAN_REVIEW/SYNTHESIS_FAILED itself (that's
   publication-synthesis-orchestrator.mjs's job), it only asks the
   model and reports what came back (or that nothing usable came back).

   Three call shapes, same underlying HTTP helper:
     - synthesizeTopic()               -- the initial full synthesis
     - reconcileMissingClaims()        -- STEP 2's targeted, bounded
                                          reconciliation for claims the
                                          initial pass never dispositioned
     - retrySynthesisWithReconciliation() -- STEP 4's ONE bounded full
                                          retry, only reached when
                                          reconciliation itself found a
                                          material change is needed

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
   this module uncaught, so the orchestrator can uniformly map any of
   them to SYNTHESIS_FAILED and never accidentally treat a failed call
   as an implicit AUTO_READY.

   STEP 10 (cost/efficiency): every successful call result includes
   `usage: {input_tokens, output_tokens}` straight from the Anthropic
   response, so the orchestrator can aggregate real spend/volume across
   however many calls one topic's pipeline run actually made -- no
   estimation, no guessing.
   ═══════════════════════════════════════════════════════════════ */

import { fetchAnthropicMessages, extractAnthropicTextSafe } from '../cadence/anthropic-response.mjs';
import { resolvePublicationEditorSynthesisModel, PublicationEditorModelConfigError } from './publication-editor-model-config.mjs';
import { SYNTHESIS_OUTPUT_JSON_SCHEMA, SYNTHESIS_OUTPUT_CONTRACT_VERSION, buildSynthesisInstruction } from './publication-synthesis-schema.mjs';
import { RECONCILIATION_OUTPUT_JSON_SCHEMA, buildReconciliationInstruction, buildFullRetryInstruction, buildHumanReviewJustificationRetryInstruction } from './publication-synthesis-reconciliation.mjs';
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

// The reconciliation/retry calls carry a much smaller payload (a handful
// of claims, not the full candidate set) -- a tighter ceiling than the
// full synthesis call is appropriate, but still generous per the same
// oversized-round-number philosophy.
export const RECONCILIATION_MAX_TOKENS = 8000;
export const RECONCILIATION_EFFORT = 'medium';

/** Never throws -- returns a tagged failure object instead, per STEP 12. */
function failure(reason, detail) {
  return { ok: false, reason, detail: detail || null };
}

function parseStructuredOutput(rawText) {
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

/** Shared call plumbing for all three call shapes. Never throws for an
    ordinary request/parse/truncation failure -- always returns a tagged
    result (STEP 12). */
async function callStructured(env, { system, userContent, schema, maxTokens, effort, callLabel }) {
  if (!env || !env.ANTHROPIC_PUBLICATION_EDITOR_API_KEY) {
    return failure('missing_api_key', 'ANTHROPIC_PUBLICATION_EDITOR_API_KEY not configured in this environment.');
  }

  const modelInfo = resolvePublicationEditorSynthesisModel(env);

  let data;
  try {
    data = await fetchAnthropicMessages({
      apiKey: env.ANTHROPIC_PUBLICATION_EDITOR_API_KEY,
      body: {
        model: modelInfo.modelName,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: userContent }],
        thinking: { type: 'adaptive' },
        output_config: { effort, format: { type: 'json_schema', schema } },
      },
    });
  } catch (err) {
    return failure('request_failed', `${callLabel}: ${String((err && err.message) || err)}`);
  }

  if (data && data.stop_reason === 'max_tokens') {
    return failure('truncated', `${callLabel} response was truncated by the token ceiling (max_tokens=${maxTokens}) before it finished.`);
  }

  const rawText = extractAnthropicTextSafe(data);
  const parsed = parseStructuredOutput(rawText);
  if (!parsed) {
    return failure('unparseable_output', `${callLabel} response was not valid JSON and no fenced JSON block fallback was found.`);
  }

  const usage = data && data.usage ? { input_tokens: data.usage.input_tokens ?? null, output_tokens: data.usage.output_tokens ?? null } : null;
  return { ok: true, output: parsed, rawText, modelInfo, usage };
}

/**
 * Calls the AI Publication Editor to synthesize one topic's evidence
 * bundle into a page-evidence proposal. Returns either
 * { ok: true, output, modelInfo, rawText, usage } or
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
  const intent = getPageSynthesisIntent(topic_slug);
  const system = buildSynthesisInstruction({
    pageConcept: intent.page_concept,
    publicIntent: intent.public_intent,
    inScopeConcepts: intent.in_scope_concepts,
    outOfScopeConcepts: intent.out_of_scope_concepts,
  });
  const userContent = JSON.stringify({ topic_slug, page_concept: intent.page_concept, evidence_bundle: evidenceBundle });

  const result = await callStructured(env, {
    system,
    userContent,
    schema: SYNTHESIS_OUTPUT_JSON_SCHEMA,
    maxTokens: SYNTHESIS_MAX_TOKENS,
    effort: SYNTHESIS_EFFORT,
    callLabel: 'Synthesis',
  });
  if (!result.ok) return result;
  return { ...result, contractVersion: SYNTHESIS_OUTPUT_CONTRACT_VERSION };
}

/**
 * STEP 2 -- ONE targeted reconciliation call for exactly the claim_ids
 * the initial synthesis never dispositioned. Sends only those claims'
 * full evidence records (never the whole 100+ claim bundle again) plus
 * the existing synthesis result for context.
 *
 * @param {Object} env
 * @param {{topic_slug: string, evidenceBundle: {claims: object[], sources: object[]}, existingOutput: object, missingClaimIds: string[]}} params
 * @returns {Promise<{ok:true, output:object, modelInfo:object, usage:object} | {ok:false, reason:string, detail:string|null}>}
 */
export async function reconcileMissingClaims(env, { topic_slug, evidenceBundle, existingOutput, missingClaimIds }) {
  const intent = getPageSynthesisIntent(topic_slug);
  const system = buildReconciliationInstruction({
    pageConcept: intent.page_concept,
    publicIntent: intent.public_intent,
    inScopeConcepts: intent.in_scope_concepts,
    outOfScopeConcepts: intent.out_of_scope_concepts,
  });

  const missingClaimIdSet = new Set(missingClaimIds);
  const missingClaims = evidenceBundle.claims.filter((c) => missingClaimIdSet.has(c.claim_id));
  const neededSourceIds = new Set(missingClaims.map((c) => c.source_id));
  const missingClaimSources = evidenceBundle.sources.filter((s) => neededSourceIds.has(s.source_id));

  const existingSynthesisSummary = {
    page_scope: existingOutput.page_scope,
    core_points: existingOutput.public_framing.core_points,
    limitations: existingOutput.public_framing.limitations,
    resolved_synthesis_signals: existingOutput.resolved_synthesis_signals,
    unresolved_issues: existingOutput.unresolved_issues,
    recommended_disposition: existingOutput.recommended_disposition,
    confidence: existingOutput.confidence,
  };

  const userContent = JSON.stringify({
    topic_slug,
    page_concept: intent.page_concept,
    missing_claim_ids: missingClaimIds,
    missing_claims: missingClaims,
    missing_claim_sources: missingClaimSources,
    existing_synthesis: existingSynthesisSummary,
  });

  return callStructured(env, {
    system,
    userContent,
    schema: RECONCILIATION_OUTPUT_JSON_SCHEMA,
    maxTokens: RECONCILIATION_MAX_TOKENS,
    effort: RECONCILIATION_EFFORT,
    callLabel: 'Reconciliation',
  });
}

/**
 * STEP 4 -- the ONE bounded full-retry call, only reached when
 * reconciliation found a material change is required. Resends the
 * COMPLETE evidence bundle (not just the formerly-missing claims) plus
 * explicit notice of the previous attempt, per the task's own Step 4
 * requirement -- this is a fresh full synthesis, not a patch.
 *
 * @param {Object} env
 * @param {{topic_slug: string, evidenceBundle: object, previousOutput: object, reconciliation: object, formerlyMissingClaimIds: string[]}} params
 */
export async function retrySynthesisWithReconciliation(env, { topic_slug, evidenceBundle, previousOutput, reconciliation, formerlyMissingClaimIds }) {
  const intent = getPageSynthesisIntent(topic_slug);
  const baseSystem = buildSynthesisInstruction({
    pageConcept: intent.page_concept,
    publicIntent: intent.public_intent,
    inScopeConcepts: intent.in_scope_concepts,
    outOfScopeConcepts: intent.out_of_scope_concepts,
  });
  const materialResolutions = (reconciliation.resolutions || []).filter((r) => r.materially_changes_existing_synthesis);
  const system = buildFullRetryInstruction(baseSystem, { formerlyMissingClaimIds, materialResolutions });

  const userContent = JSON.stringify({
    topic_slug,
    page_concept: intent.page_concept,
    evidence_bundle: evidenceBundle,
    previous_synthesis_attempt: previousOutput,
    reconciliation_findings: reconciliation,
  });

  const result = await callStructured(env, {
    system,
    userContent,
    schema: SYNTHESIS_OUTPUT_JSON_SCHEMA,
    maxTokens: SYNTHESIS_MAX_TOKENS,
    effort: SYNTHESIS_EFFORT,
    callLabel: 'Full retry',
  });
  if (!result.ok) return result;
  return { ...result, contractVersion: SYNTHESIS_OUTPUT_CONTRACT_VERSION };
}

/**
 * GOVERNANCE FIX bounded retry -- reached only when the initial synthesis
 * declared HUMAN_REVIEW without a valid human_review_justification (see
 * publication-synthesis-validator.mjs). A fresh, complete synthesis over
 * the FULL evidence bundle, explicitly told the previous HUMAN_REVIEW
 * lacked justification and given one bounded chance to resolve to
 * AUTO_READY or supply a real, specific reason. Never a third attempt --
 * the orchestrator maps a still-unjustified result here straight to
 * SYNTHESIS_FAILED, never to a permanent, unexplained HUMAN_REVIEW.
 *
 * @param {Object} env
 * @param {{topic_slug: string, evidenceBundle: object, previousOutput: object}} params
 */
export async function retrySynthesisForJustification(env, { topic_slug, evidenceBundle, previousOutput }) {
  const intent = getPageSynthesisIntent(topic_slug);
  const baseSystem = buildSynthesisInstruction({
    pageConcept: intent.page_concept,
    publicIntent: intent.public_intent,
    inScopeConcepts: intent.in_scope_concepts,
    outOfScopeConcepts: intent.out_of_scope_concepts,
  });
  const system = buildHumanReviewJustificationRetryInstruction(baseSystem);

  const userContent = JSON.stringify({
    topic_slug,
    page_concept: intent.page_concept,
    evidence_bundle: evidenceBundle,
    previous_synthesis_attempt: previousOutput,
  });

  const result = await callStructured(env, {
    system,
    userContent,
    schema: SYNTHESIS_OUTPUT_JSON_SCHEMA,
    maxTokens: SYNTHESIS_MAX_TOKENS,
    effort: SYNTHESIS_EFFORT,
    callLabel: 'Human-review justification retry',
  });
  if (!result.ok) return result;
  return { ...result, contractVersion: SYNTHESIS_OUTPUT_CONTRACT_VERSION };
}
