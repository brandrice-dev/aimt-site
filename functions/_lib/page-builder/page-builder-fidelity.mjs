/* ═══════════════════════════════════════════════════════════════
   AIMT Page Builder v1 — factual-fidelity check
   ---------------------------------------------------------------
   A claim-ID attachment alone is not enough: a paragraph could cite a
   real, in-scope claim ID while still strengthening, distorting, or
   overstating what that claim actually said. This module's job is to
   reduce that risk BEFORE a draft paragraph is trusted -- deterministic
   first, an isolated small-model check only if a future version needs
   one for genuinely paraphrased prose.

   v1 architecture (this task): every factual paragraph text is a
   VERBATIM reuse of its supporting core_factual_point/limitation
   statement (see page-builder-draft.mjs's header for why). That makes
   the deterministic check here almost trivial by construction --
   exact-string containment -- and it is exercised as a REAL check, not
   skipped, so a future version that stops reusing verbatim text
   (introducing an AI polish/paraphrase pass) inherits a fidelity gate
   that already exists and already has test coverage, rather than
   bolting one on after the fact.

   checkParagraphFidelityWithModel() is defined for that future version
   and is NEVER called by scripts/page-builder-shadow.mjs or any other
   code path in this task -- it exists so the isolated Page Builder
   model adapter (page-builder-model-config.mjs) has something concrete
   to plug into later, without this task making a live Anthropic call.
   Tests exercise it only against a mocked fetch.

   CORRECTION (this revision): checkDraftFidelity() used to only inspect
   draft.sections[] paragraphs. It now runs over
   page-builder-content-units.mjs#collectRenderedFactualUnits() --
   answer_summary and key_takeaways are visible rendered factual content
   too, and a paragraph-only fidelity check was silently not covering
   them. The deterministic single-unit check itself
   (checkParagraphFidelityDeterministic) is unchanged; it accepts any
   {text, supporting_claim_ids, is_framing} shape, which a rendered unit
   already is.
   ═══════════════════════════════════════════════════════════════ */

import { fetchAnthropicMessages, extractAnthropicTextSafe } from '../cadence/anthropic-response.mjs';
import { resolvePageBuilderFidelityModel } from './page-builder-model-config.mjs';
import { collectRenderedFactualUnits } from './page-builder-content-units.mjs';

export const FIDELITY_RESULT = Object.freeze({
  PASS: 'PASS',
  REWRITE_REQUIRED: 'REWRITE_REQUIRED',
  HUMAN_REVIEW: 'HUMAN_REVIEW',
});

/**
 * Deterministic, zero-cost, zero-latency fidelity check. No AI call, no
 * network. Looks up the exact statement text for every one of the
 * paragraph's supporting_claim_ids (by scanning the snapshot's
 * core_factual_points/limitations for a statement whose
 * supporting_claim_ids include that claim ID) and requires the
 * paragraph's own text to be byte-identical to at least one of them.
 *
 * A framing paragraph (is_framing: true, no supporting_claim_ids) always
 * passes trivially -- it makes no factual claim to check fidelity
 * against.
 *
 * @param {{text: string, supporting_claim_ids: string[], is_framing?: boolean}} paragraph
 * @param {object} snapshot - the cleared snapshot
 * @returns {{result: string, reason: string}}
 */
export function checkParagraphFidelityDeterministic(paragraph, snapshot) {
  if (paragraph.is_framing) {
    return { result: FIDELITY_RESULT.PASS, reason: 'framing paragraph, no factual claim to check' };
  }
  if (!paragraph.supporting_claim_ids || paragraph.supporting_claim_ids.length === 0) {
    return { result: FIDELITY_RESULT.HUMAN_REVIEW, reason: 'no supporting_claim_ids to check fidelity against' };
  }

  const candidateStatements = [];
  for (const point of [...snapshot.core_factual_points, ...snapshot.limitations]) {
    const supportsAny = paragraph.supporting_claim_ids.some((id) => (point.supporting_claim_ids || []).includes(id));
    if (supportsAny) candidateStatements.push(point.statement);
  }

  if (candidateStatements.length === 0) {
    return { result: FIDELITY_RESULT.HUMAN_REVIEW, reason: 'no cleared statement in the snapshot references any of these supporting_claim_ids' };
  }
  if (candidateStatements.includes(paragraph.text)) {
    return { result: FIDELITY_RESULT.PASS, reason: 'paragraph text is a verbatim match to a cleared statement' };
  }
  // Not verbatim -- this is where a future paraphrased-prose pass would
  // need a real entailment check. v1 never produces non-verbatim
  // factual paragraphs, so reaching here means something upstream wrote
  // prose this module cannot yet vouch for -- REWRITE_REQUIRED, not a
  // silent pass.
  return { result: FIDELITY_RESULT.REWRITE_REQUIRED, reason: 'paragraph text is not a verbatim match to any cleared statement its claim IDs support' };
}

/**
 * Runs the deterministic check across EVERY rendered factual unit in a
 * draft -- answer_summary, section paragraphs, AND key_takeaways (see
 * page-builder-content-units.mjs). Returns PASS only if every unit
 * individually passes.
 *
 * @param {object} draft
 * @param {object} snapshot
 * @returns {{result: string, paragraph_results: Array<{unit_id: string, group: string, result: string, reason: string}>}}
 */
export function checkDraftFidelity(draft, snapshot) {
  const paragraphResults = [];
  for (const unit of collectRenderedFactualUnits(draft)) {
    const { result, reason } = checkParagraphFidelityDeterministic(unit, snapshot);
    paragraphResults.push({ unit_id: unit.unit_id, group: unit.group, result, reason });
  }
  const worst = paragraphResults.some((r) => r.result === FIDELITY_RESULT.HUMAN_REVIEW)
    ? FIDELITY_RESULT.HUMAN_REVIEW
    : paragraphResults.some((r) => r.result === FIDELITY_RESULT.REWRITE_REQUIRED)
      ? FIDELITY_RESULT.REWRITE_REQUIRED
      : FIDELITY_RESULT.PASS;
  return { result: worst, paragraph_results: paragraphResults };
}

/**
 * FUTURE / NOT INVOKED IN THIS TASK. A small, isolated model call for
 * the case where a paragraph is a genuine paraphrase of its supporting
 * claim text rather than a verbatim reuse -- e.g. after a future prose-
 * polish pass. Deliberately much smaller than Publication Editor's own
 * synthesis call: one paragraph + its 1-3 supporting statements in, one
 * PASS/REWRITE_REQUIRED/HUMAN_REVIEW classification out, no candidate
 * pool, no page-wide context. Uses the isolated Page Builder model
 * adapter (page-builder-model-config.mjs) -- never Cadence's or
 * Publication Editor's credentials.
 *
 * @param {Object} env - must carry ANTHROPIC_PAGE_BUILDER_API_KEY
 * @param {{text: string, supporting_claim_ids: string[]}} paragraph
 * @param {string[]} supportingStatements - the exact cleared statement text(s)
 * @returns {Promise<{result: string, reason: string, model_info: object, input_tokens: number, output_tokens: number}>}
 */
export async function checkParagraphFidelityWithModel(env, paragraph, supportingStatements) {
  if (!env || !env.ANTHROPIC_PAGE_BUILDER_API_KEY) {
    throw new Error('checkParagraphFidelityWithModel: missing ANTHROPIC_PAGE_BUILDER_API_KEY.');
  }
  const modelInfo = resolvePageBuilderFidelityModel(env);
  const system = 'You check whether a draft sentence is fully entailed by, and no stronger than, its supporting source sentence(s). Respond with exactly one word: PASS, REWRITE_REQUIRED, or HUMAN_REVIEW.';
  const userContent = `Supporting cleared statement(s):\n${supportingStatements.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nDraft sentence to check:\n${paragraph.text}`;

  const data = await fetchAnthropicMessages({
    apiKey: env.ANTHROPIC_PAGE_BUILDER_API_KEY,
    body: {
      model: modelInfo.modelName,
      max_tokens: 16,
      system,
      messages: [{ role: 'user', content: userContent }],
    },
  });
  const text = extractAnthropicTextSafe(data).trim().toUpperCase();
  const result = Object.values(FIDELITY_RESULT).includes(text) ? text : FIDELITY_RESULT.HUMAN_REVIEW;
  const usage = data && data.usage ? data.usage : {};
  return {
    result,
    reason: `model-based fidelity check (${modelInfo.modelName})`,
    model_info: modelInfo,
    input_tokens: usage.input_tokens ?? null,
    output_tokens: usage.output_tokens ?? null,
  };
}
