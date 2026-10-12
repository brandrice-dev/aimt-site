/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — shared AI client plumbing
   ---------------------------------------------------------------
   Shared `callStructured()` for the three Education Operations model
   roles (intent planner, writer, reviewer) -- same shape as
   publication-synthesis-client.mjs's own internal helper, factored out
   here because three roles need it instead of one. Every failure mode
   returns a tagged result rather than throwing (never lets a transport/
   parse failure look like an implicit success), and every call uses
   ONLY the dedicated ANTHROPIC_EDUCATION_WRITER_API_KEY credential --
   see education-ops-model-config.mjs's header for why this never falls
   back to Cadence's or Publication Editor's own key.
   ═══════════════════════════════════════════════════════════════ */

import { extractAnthropicTextSafe } from '../cadence/anthropic-response.mjs';
import { fetchPublicationMessages, sanitizePublicationDiagnostics } from '../research/publication-anthropic-transport.mjs';
import { resolveEducationOpsModel, checkEducationOpsCredential, EDUCATION_OPS_API_KEY_ENV_VAR } from './education-ops-model-config.mjs';

export function failure(reason, detail) {
  return { ok: false, reason, detail: detail || null };
}

function parseStructuredOutput(rawText) {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (!fenced) return null;
    try { return JSON.parse(fenced[1]); } catch (_) { return null; }
  }
}

/**
 * @param {Object} env
 * @param {{role: string, system: string, userContent: string, schema: object, maxTokens: number, effort: string, callLabel: string}} args
 */
export async function callEducationOpsModel(env, { role, system, userContent, schema, maxTokens, effort, callLabel }) {
  const credCheck = checkEducationOpsCredential(env);
  if (!credCheck.ok) return failure('missing_api_key', credCheck.reason);

  const modelInfo = resolveEducationOpsModel(env, role);

  let data, diagnostics;
  try {
    ({ data, diagnostics } = await fetchPublicationMessages({
      apiKey: env[EDUCATION_OPS_API_KEY_ENV_VAR],
      costControl: env.publicationCostControl,
      body: {
        model: modelInfo.modelName,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: userContent }],
        thinking: { type: 'adaptive' },
        output_config: { effort, format: { type: 'json_schema', schema } },
      },
    }));
  } catch (err) {
    return { ...failure(['SPEND_LIMIT', 'TOKEN_LIMIT'].includes(err.diagnostics?.code) ? 'budget_exceeded' : 'request_failed', `${callLabel}: provider request failed or blocked by preflight.`), diagnostics: sanitizePublicationDiagnostics(err.diagnostics) };
  }

  if (data && data.stop_reason === 'max_tokens') {
    return failure('truncated', `${callLabel} response was truncated by the token ceiling (max_tokens=${maxTokens}) before it finished.`);
  }

  const rawText = extractAnthropicTextSafe(data);
  const parsed = parseStructuredOutput(rawText);
  if (!parsed) return failure('unparseable_output', `${callLabel} response was not valid JSON and no fenced JSON block fallback was found.`);

  const usage = data && data.usage ? { input_tokens: data.usage.input_tokens ?? null, output_tokens: data.usage.output_tokens ?? null } : null;
  return { ok: true, output: parsed, rawText, modelInfo, usage, diagnostics };
}
