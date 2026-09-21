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
   Verified with a constant-time comparison (same pattern as the Stripe
   webhook's signature check in stripe-webhook.js).

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

   HARD RULES (enforced in code, not just documentation):
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

import { validateSource, validateClaim } from '../_lib/research/schema.mjs';
import { runImport } from '../_lib/research/importer.mjs';

const AIMT_LOGS_TABLE = 'aimt_logs';

async function logEvent(env, type, message) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.info('[research-ingest]', type, message);
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
      body: JSON.stringify({ event_type: String(type), source: 'api/research-ingest', message: message ? String(message).slice(0, 500) : null })
    });
  } catch (e) {
    console.info('[research-ingest-log-fail]', type, message, e && e.message);
  }
}

/* Constant-time bearer-token check (same shape as verifyStripeSignature's
   constant-time compare in stripe-webhook.js). */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function checkAuth(request, env) {
  const header = request.headers.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return false;
  return timingSafeEqual(token, env.RESEARCH_INGEST_SECRET);
}

function partitionRecords(records, validateFn, idField) {
  const valid = [];
  const rejected = [];
  for (const rec of Array.isArray(records) ? records : []) {
    const { errors } = validateFn(rec);
    /* Extra ingestion-time guard: quarantine (don't import) anything that
       already claims AIMT_APPROVED -- that value may only ever be set by
       a human through the Owner's Console, never a Grok submission. */
    if (rec && rec.verification_status === 'AIMT_APPROVED') {
      errors.push('verification_status=AIMT_APPROVED may not be submitted via ingestion; human-only');
    }
    if (errors.length) rejected.push({ natural_id: rec ? rec[idField] : null, errors, raw: rec });
    else valid.push(rec);
  }
  return { valid, rejected };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.RESEARCH_INGEST_SECRET || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    await logEvent(env, 'research_ingest_misconfigured', 'missing_env_vars');
    return new Response('Misconfigured', { status: 500 });
  }

  if (!checkAuth(request, env)) {
    await logEvent(env, 'research_ingest_bad_auth', null);
    return new Response('Unauthorized', { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const batchId = body && typeof body.batch_id === 'string' && body.batch_id.trim() ? body.batch_id.trim() : null;
  if (!batchId) {
    return new Response(JSON.stringify({ error: 'batch_id_required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { valid: validSources, rejected: rejectedSources } = partitionRecords(body.sources, validateSource, 'source_id');
  const { valid: validClaims, rejected: rejectedClaims } = partitionRecords(body.claims, validateClaim, 'claim_id');
  /* No orphan-FK check here: a claim's source may legitimately already
     exist in the DB from an earlier batch without being resent in this
     one, so a simple "is source_id in THIS request's sources" check would
     wrongly reject valid claims-only batches. The real orphan check --
     against this batch's sources AND the existing database -- happens
     inside runImport() (functions/_lib/research/importer.mjs, step 4a)
     BEFORE any claims upsert, so a genuinely orphaned claim is quarantined
     rather than hitting the (never weakened) research_claims.source_id FK
     and aborting the run. result.rejectedClaims below is the count AFTER
     that check, not just JS-validation rejects. */

  const loaded = {
    sources: validSources,
    claims: validClaims,
    topics: Array.isArray(body.topics) ? body.topics : [],
    relationships: Array.isArray(body.relationships) ? body.relationships : [],
    verificationQueue: Array.isArray(body.verification_queue) ? body.verification_queue : [],
    coverage: Array.isArray(body.coverage) ? body.coverage : [],
    rejected: { sources: rejectedSources, claims: rejectedClaims }
  };

  try {
    const result = await runImport(env, {
      loaded, batchId,
      sourceSystem: typeof body.source_system === 'string' ? body.source_system : 'grok-research-harvester',
      triggeredBy: 'research-ingest-endpoint'
    });

    const totalRejected = result.rejectedSources + result.rejectedClaims;
    await logEvent(env, 'research_ingest_complete', `batch_${batchId}_status_${totalRejected > 0 ? 'partial' : 'success'}`);

    /* Counts below are post-import (result.*), which include orphan claims
       quarantined inside runImport -- NOT just the pre-import JS-validation
       rejects (rejectedSources/rejectedClaims above), so a batch with a
       stray orphan claim correctly reports 'partial' with the right count
       instead of a misleadingly clean 'ok'. */
    return new Response(JSON.stringify({
      batch_id: batchId,
      status: totalRejected > 0 ? 'partial' : 'ok',
      accepted: { sources: result.insertedSources + result.updatedSources, claims: result.insertedClaims + result.updatedClaims },
      inserted: { sources: result.insertedSources, claims: result.insertedClaims },
      updated: { sources: result.updatedSources, claims: result.updatedClaims },
      quarantined: { sources: result.rejectedSources, claims: result.rejectedClaims, orphan_claims: result.orphanClaims }
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    await logEvent(env, 'research_ingest_failure', error && error.message ? error.message : 'unknown_error');
    return new Response(JSON.stringify({ error: 'processing_error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
