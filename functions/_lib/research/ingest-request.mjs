/* ═══════════════════════════════════════════════════════════════
   Research Library — canonical ingestion-request pipeline
   ---------------------------------------------------------------
   The ONE place that turns a raw research-batch request body into a
   validated, imported (or quarantined) result. Every entry point that
   accepts a research batch from an external caller -- the direct Grok
   webhook (functions/api/research-ingest.js) and the MCP connector's
   submit_research_batch tool (functions/api/mcp.js) -- calls this same
   function. Neither may re-implement or weaken any part of it; that is
   the whole point of factoring it here instead of duplicating logic.

   Trust-model guarantees this function inherits from schema.mjs /
   importer.mjs and does not (and must not) alter:
   - A submitted source/claim with verification_status='AIMT_APPROVED'
     is quarantined, never imported (see partitionRecords below).
   - AIMT_APPROVED already in the DB is never downgraded by a re-import
     (importer.mjs's protectedBatch handling).
   - public_eligible / published / aimt_reviewed_by are never written by
     this path (mapSourceRow/mapClaimRow never include them).
   - A genuinely orphaned claim (source missing from both the batch and
     the DB) is quarantined before the upsert, never allowed to abort
     the whole run (importer.mjs step 4a).
   ═══════════════════════════════════════════════════════════════ */

import { validateSource, validateClaim } from './schema.mjs';
import { runImport } from './importer.mjs';

const AIMT_LOGS_TABLE = 'aimt_logs';

/** Splits raw records into {valid, rejected} using the given per-record
    validator, and quarantines (does not import) any record that already
    claims verification_status='AIMT_APPROVED' -- that value is human-only,
    set exclusively through the Owner's Console, never by an external
    submission of any kind (direct webhook or MCP tool call alike). */
export function partitionRecords(records, validateFn, idField) {
  const valid = [];
  const rejected = [];
  for (const rec of Array.isArray(records) ? records : []) {
    const { errors } = validateFn(rec);
    if (rec && rec.verification_status === 'AIMT_APPROVED') {
      errors.push('verification_status=AIMT_APPROVED may not be submitted via ingestion; human-only');
    }
    if (errors.length) rejected.push({ natural_id: rec ? rec[idField] : null, errors, raw: rec });
    else valid.push(rec);
  }
  return { valid, rejected };
}

/** Best-effort observability write to aimt_logs. Never throws, never
    includes a secret/token value -- callers must only pass non-sensitive
    message text. */
export async function logIngestEvent(env, source, type, message) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.info(`[${source}]`, type, message);
    return;
  }
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/${AIMT_LOGS_TABLE}`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ event_type: String(type), source, message: message ? String(message).slice(0, 500) : null })
    });
  } catch (e) {
    console.info(`[${source}-log-fail]`, type, message, e && e.message);
  }
}

/** The canonical pipeline. `body` is the already-JSON-parsed request
    payload (same shape for both callers -- see functions/api/research-
    ingest.js's header comment for the full field list).

    Returns:
      { ok: true, batch_id, status, accepted, inserted, updated, quarantined }
        on a batch that was (at least partially) processed, or
      { ok: false, error: string }
        for a request-shape problem (currently only a missing/blank
        batch_id) -- never touches the database in this case.
    Throws only for genuine infrastructure/database failures; callers
    decide how to surface that (research-ingest.js -> HTTP 500,
    mcp.js -> a tool result with isError: true). */
export async function processIngestionBatch(env, body, { triggeredBy, defaultSourceSystem = 'grok-research-harvester' } = {}) {
  const batchId = body && typeof body.batch_id === 'string' && body.batch_id.trim() ? body.batch_id.trim() : null;
  if (!batchId) return { ok: false, error: 'batch_id_required' };

  const { valid: validSources, rejected: rejectedSources } = partitionRecords(body.sources, validateSource, 'source_id');
  const { valid: validClaims, rejected: rejectedClaims } = partitionRecords(body.claims, validateClaim, 'claim_id');
  /* No batch-local orphan check here: a claim's source may legitimately
     already exist in the DB from an earlier batch without being resent in
     this one. The real orphan check -- against this batch's sources AND
     the existing database -- happens inside runImport() (importer.mjs,
     step 4a) BEFORE any claims upsert, so a genuinely orphaned claim is
     quarantined rather than hitting the (never weakened)
     research_claims.source_id FK and aborting the run. */

  const loaded = {
    sources: validSources,
    claims: validClaims,
    topics: Array.isArray(body.topics) ? body.topics : [],
    relationships: Array.isArray(body.relationships) ? body.relationships : [],
    verificationQueue: Array.isArray(body.verification_queue) ? body.verification_queue : [],
    coverage: Array.isArray(body.coverage) ? body.coverage : [],
    rejected: { sources: rejectedSources, claims: rejectedClaims }
  };

  const result = await runImport(env, {
    loaded, batchId,
    sourceSystem: typeof body.source_system === 'string' ? body.source_system : defaultSourceSystem,
    triggeredBy
  });

  /* Counts below are post-import (result.*), which include orphan claims
     quarantined inside runImport -- NOT just the pre-import JS-validation
     rejects -- so a batch with a stray orphan claim correctly reports
     'partial' with the right count instead of a misleadingly clean 'ok'. */
  const totalRejected = result.rejectedSources + result.rejectedClaims;
  return {
    ok: true,
    batch_id: batchId,
    status: totalRejected > 0 ? 'partial' : 'ok',
    accepted: { sources: result.insertedSources + result.updatedSources, claims: result.insertedClaims + result.updatedClaims },
    inserted: { sources: result.insertedSources, claims: result.insertedClaims },
    updated: { sources: result.updatedSources, claims: result.updatedClaims },
    quarantined: { sources: result.rejectedSources, claims: result.rejectedClaims, orphan_claims: result.orphanClaims }
  };
}
