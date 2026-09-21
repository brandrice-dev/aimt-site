/* ═══════════════════════════════════════════════════════════════
   Research Library — daily Grok ingestion endpoint
   ---------------------------------------------------------------
   Authenticated server-to-server endpoint for the Grok research
   harvester to submit new/changed sources and claims. Not public,
   not browser-facing, not linked from any page.

   Cloudflare Pages env vars required:
     RESEARCH_INGEST_SECRET     (new -- long random shared secret; give
                                  this to Grok's harvester, nowhere else)
     SUPABASE_URL                (existing)
     SUPABASE_SERVICE_ROLE_KEY   (existing)

   Auth: header  Authorization: Bearer <RESEARCH_INGEST_SECRET>
   Verified with a constant-time comparison (functions/_lib/research/auth.mjs).

   Request body (JSON):
   {
     "batch_id": "grok-2026-09-21T07:00:00Z-discovery",   // required, unique per submission
     "source_system": "grok-research-harvester",           // optional, defaults as shown
     "sources": [ { ...same shape as the export's sources.jsonl rows... } ],
     "claims":  [ { ...same shape as the export's claims.jsonl rows...  } ],
     "topics": [...],              // optional
     "relationships": [...],       // optional
     "verification_queue": [...],  // optional
     "coverage": [...]             // optional
   }

   Every source/claim record uses the exact field names documented in
   the export's docs/SCHEMA.md (mirrored in functions/_lib/research/
   schema.mjs). Records that fail validation are quarantined into
   research_ingestion_quarantine, NOT rejected as a whole batch -- the
   response reports accepted vs quarantined counts per type.

   The actual validation/import work happens in functions/_lib/research/
   ingest-request.mjs's processIngestionBatch() -- the SAME function
   used by the MCP connector's submit_research_batch tool
   (functions/api/mcp.js), so both entry points share one canonical
   pipeline. This file is only: env/auth checks, body parsing, and
   mapping the pipeline's result onto an HTTP response.

   HARD RULES (enforced in code, not just documentation -- see
   ingest-request.mjs / schema.mjs / importer.mjs):
   - This endpoint NEVER writes verification_status = 'AIMT_APPROVED'.
     If a submitted claim carries that value it is quarantined, not
     imported (see assertNeverAutoApproves in schema.mjs).
   - This endpoint NEVER writes aimt_reviewed_by / public_eligible /
     published on any table. Those columns only ever change through a
     separate, human-authenticated path (the future Owner's Console).
   - A claim already AIMT_APPROVED in the DB has that column left alone
     on re-import, regardless of what this batch says, so a Grok
     re-sync can never downgrade a human approval.
   ═══════════════════════════════════════════════════════════════ */

import { checkBearerAuth } from '../_lib/research/auth.mjs';
import { processIngestionBatch, logIngestEvent } from '../_lib/research/ingest-request.mjs';

const SOURCE = 'api/research-ingest';

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.RESEARCH_INGEST_SECRET || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    await logIngestEvent(env, SOURCE, 'research_ingest_misconfigured', 'missing_env_vars');
    return new Response('Misconfigured', { status: 500 });
  }

  if (!checkBearerAuth(request, env.RESEARCH_INGEST_SECRET)) {
    await logIngestEvent(env, SOURCE, 'research_ingest_bad_auth', null);
    return new Response('Unauthorized', { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const result = await processIngestionBatch(env, body, { triggeredBy: 'research-ingest-endpoint' });

    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    await logIngestEvent(env, SOURCE, 'research_ingest_complete', `batch_${result.batch_id}_status_${result.status}`);

    return new Response(JSON.stringify({
      batch_id: result.batch_id,
      status: result.status,
      accepted: result.accepted,
      inserted: result.inserted,
      updated: result.updated,
      quarantined: result.quarantined
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    await logIngestEvent(env, SOURCE, 'research_ingest_failure', error && error.message ? error.message : 'unknown_error');
    return new Response(JSON.stringify({ error: 'processing_error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
