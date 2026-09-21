/* ═══════════════════════════════════════════════════════════════
   AIMT Research Harvester Worker — the one governed pipeline
   ---------------------------------------------------------------
   runHarvest() is called identically by POST /run (index.mjs) and by
   scheduled() (index.mjs) -- no duplicate implementation between the
   manual and cron-triggered paths, and no path that lets either one
   skip a guardrail the other enforces.

   Cost/runaway-execution guardrails (task requirement -- see
   xai-client.mjs for the request-level ones):
     - exactly one xAI Responses API request per call (no internal loop)
     - no retry of a failed xAI request
     - no recursive self-call of this Worker
     - live mode fails closed (outcome: 'failed') if XAI_API_KEY or
       MCP_CONNECTOR_SECRET is absent, rather than silently degrading
       to a dry-run-shaped request
     - dry-run mode is structurally incapable of writing to AIMT: see
       xai-client.mjs's buildTools(), which has no code path that adds
       the MCP tool unless mode === 'live'
   ═══════════════════════════════════════════════════════════════ */

import { HARVESTER_OPERATING_SPEC, HARVESTER_OPERATING_SPEC_VERSION } from '../prompts/harvester-operating-spec.v1.mjs';
import { buildRequestBody, callXaiResponses, summarizeXaiResponse } from './xai-client.mjs';
import { redactSecrets, secretsToRedact, safeErrorSummary } from './observability.mjs';

export const SOURCE_SYSTEM = 'xai-research-harvester';

/* Sensible current default for a research-capable xAI model, matching
   docs.x.ai's own tool-usage examples at the time this worker was
   built -- always overridable via XAI_RESEARCH_MODEL so a future model
   change never requires a code change. */
export const DEFAULT_MODEL = 'grok-4.7';

const VALID_MODES = new Set(['dry-run', 'live']);

/** Resolves HARVESTER_MODE, defaulting safely to 'dry-run' for
    anything absent, blank, or not exactly one of the two valid values
    -- never throws, never defaults to 'live'. */
export function resolveMode(rawMode) {
  const value = typeof rawMode === 'string' ? rawMode.trim().toLowerCase() : '';
  return VALID_MODES.has(value) ? value : 'dry-run';
}

export function resolveModel(rawModel) {
  return typeof rawModel === 'string' && rawModel.trim() ? rawModel.trim() : DEFAULT_MODEL;
}

/** e.g. "20260921T183205Z" -- compact, id-safe UTC timestamp. */
function utcCompactTimestamp(now) {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
}

export function buildBatchId(now = new Date()) {
  return `xai-harvester-${utcCompactTimestamp(now)}`;
}

function buildUserPrompt(batchId) {
  return [
    'This is one automated AIMT Research Harvester run.',
    `batch_id (use exactly this value if and only if you call submit_research_batch): ${batchId}`,
    `source_system (use exactly this value): ${SOURCE_SYSTEM}`,
    '',
    "Research AIMT's domains (scalp health, hair biology/loss, trichology, cosmetic ingredients, treatments, practitioner safety, adjacent dermatology) for genuinely useful new or updated evidence, following the operating spec above exactly. If nothing you found is worth adding, say so plainly in your final answer and do not call any write tool."
  ].join('\n');
}

function nowIso() {
  return new Date().toISOString();
}

function baseFields({ runId, trigger, mode, model, batchId, startedAt }) {
  return {
    run_id: runId,
    trigger: trigger || 'manual',
    mode,
    model,
    batch_id: batchId,
    spec_version: HARVESTER_OPERATING_SPEC_VERSION,
    started_at: startedAt
  };
}

function failResult(fields, { reason, detail }) {
  return {
    ...baseFields(fields),
    finished_at: nowIso(),
    outcome: 'failed',
    reason,
    detail: detail || null,
    xai_response_id: null,
    mcp: null,
    research: null,
    usage: null,
    server_side_tool_usage: null,
    candidate_report: null
  };
}

/**
 * The one governed research-harvester pipeline. Returns a plain,
 * JSON-serializable, secret-free result object -- never throws (every
 * failure path is caught and returned as an outcome: 'failed' result)
 * so both callers (POST /run, scheduled()) get uniform, safe output.
 */
export async function runHarvest(env, { trigger } = {}) {
  const startedAt = nowIso();
  const runId = crypto.randomUUID();
  const mode = resolveMode(env.HARVESTER_MODE);
  const model = resolveModel(env.XAI_RESEARCH_MODEL);
  const batchId = buildBatchId();
  const fields = { runId, trigger, mode, model, batchId, startedAt };

  if (!env.XAI_API_KEY) {
    return failResult(fields, { reason: 'missing_xai_api_key' });
  }
  if (mode === 'live' && !env.MCP_CONNECTOR_SECRET) {
    // Fail closed: live mode must never silently fall back to a
    // dry-run-shaped request and report success under the wrong mode.
    return failResult(fields, { reason: 'missing_mcp_connector_secret_in_live_mode' });
  }

  let requestBody;
  try {
    requestBody = buildRequestBody({
      mode,
      model,
      mcpConnectorSecret: env.MCP_CONNECTOR_SECRET,
      systemPrompt: HARVESTER_OPERATING_SPEC,
      userPrompt: buildUserPrompt(batchId)
    });
  } catch (err) {
    return failResult(fields, { reason: 'request_build_failed', detail: safeErrorSummary(env, err) });
  }

  let xaiResponse;
  try {
    // Exactly one xAI request for this entire run -- no loop, no retry.
    xaiResponse = await callXaiResponses(env.XAI_API_KEY, requestBody);
  } catch (err) {
    return failResult(fields, { reason: 'xai_request_failed', detail: safeErrorSummary(env, err) });
  }

  const summary = summarizeXaiResponse(xaiResponse, { mode });
  const secrets = secretsToRedact(env);
  const candidateReport = summary.candidate_report
    ? redactSecrets(summary.candidate_report.slice(0, 4000), secrets)
    : null;

  return {
    ...baseFields(fields),
    finished_at: nowIso(),
    xai_response_id: (xaiResponse && typeof xaiResponse.id === 'string') ? xaiResponse.id : null,
    outcome: summary.outcome,
    mcp: summary.mcp,
    research: summary.research,
    usage: summary.usage,
    server_side_tool_usage: summary.server_side_tool_usage,
    candidate_report: candidateReport
  };
}
