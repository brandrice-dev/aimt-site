/* ═══════════════════════════════════════════════════════════════
   AIMT Research Harvester — Cloudflare Worker entry point
   ---------------------------------------------------------------
   Two ways in, ONE pipeline (run.mjs's runHarvest) -- no duplicate
   implementation between the manual trigger and the (not yet enabled;
   see wrangler.toml) scheduled trigger:

     GET  /health   -- no auth, non-sensitive status only
     POST /run      -- Authorization: Bearer <HARVESTER_RUN_SECRET>,
                        constant-time compare, for one controlled
                        dry-run and one controlled live run before Cron
                        is ever enabled
     scheduled()    -- implemented now for when Cron is enabled later;
                        runs the identical pipeline as POST /run
   ═══════════════════════════════════════════════════════════════ */

import { runHarvest, resolveMode, resolveModel } from './run.mjs';
import { checkBearerAuth } from './auth.mjs';
import { jsonResponse, safeErrorSummary } from './observability.mjs';

export const WORKER_VERSION = '0.1.0-foundation';

function buildHealthPayload(env) {
  return {
    service: 'aimt-research-harvester',
    version: WORKER_VERSION,
    mode: resolveMode(env.HARVESTER_MODE),
    model: resolveModel(env.XAI_RESEARCH_MODEL),
    // Simple configured/not-configured booleans only -- never the
    // values themselves, never even their length or a prefix.
    xai_api_key_configured: !!env.XAI_API_KEY,
    mcp_connector_secret_configured: !!env.MCP_CONNECTOR_SECRET,
    harvester_run_secret_configured: !!env.HARVESTER_RUN_SECRET
  };
}

async function handleRun(env, trigger) {
  try {
    const result = await runHarvest(env, { trigger });
    return jsonResponse(result, result.outcome === 'failed' ? 502 : 200);
  } catch (err) {
    // runHarvest() is written to never throw (every internal failure
    // path returns an outcome: 'failed' result) -- this catch exists
    // only as a last-resort safety net against a genuinely unexpected
    // bug, and it stays just as careful never to leak a secret.
    return jsonResponse({ outcome: 'failed', reason: 'unexpected_worker_error', detail: safeErrorSummary(env, err) }, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse(buildHealthPayload(env), 200);
    }

    if (request.method === 'POST' && url.pathname === '/run') {
      if (!checkBearerAuth(request, env.HARVESTER_RUN_SECRET)) {
        return new Response('Unauthorized', { status: 401 });
      }
      return handleRun(env, 'manual');
    }

    return new Response('Not Found', { status: 404 });
  },

  /* Not enabled in wrangler.toml yet (crons = []) -- implemented now so
     turning Cron on later is a config-only change, never a code change,
     and so it is provably the same pipeline POST /run already exercised
     in the two controlled test runs (see README.md). */
  async scheduled(controller, env, ctx) {
    const run = async () => {
      const result = await handleRun(env, 'scheduled');
      const body = await result.json().catch(() => null);
      // Safe: runHarvest()'s result (and this catch's safeErrorSummary
      // fallback) never contains a secret value.
      console.log('[aimt-research-harvester:scheduled]', JSON.stringify({
        run_id: body && body.run_id,
        batch_id: body && body.batch_id,
        mode: body && body.mode,
        outcome: body && body.outcome,
        xai_response_id: body && body.xai_response_id
      }));
    };
    ctx.waitUntil(run());
  }
};
