/* ═══════════════════════════════════════════════════════════════
   AIMT Research Library — shared idempotent upsert logic
   ---------------------------------------------------------------
   Runtime-agnostic (env is passed in, never read from process.env
   directly) so the SAME upsert logic runs from both:
     - scripts/research-library-import.mjs   (Node CLI, local export)
     - functions/api/research-ingest.js      (Cloudflare Pages Function,
                                                daily Grok POST)

   `env` must provide SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
   `loaded` is { sources, claims, topics, relationships,
   verificationQueue, coverage, rejected: {sources, claims} } -- see
   loadExport() in the CLI script, or the request-body shape documented
   in functions/api/research-ingest.js.

   Idempotent: every table is upserted on its natural Grok id. Re-running
   the same or a newer batch never duplicates rows. A claim already at
   verification_status='AIMT_APPROVED' in the DB has that one column left
   untouched by the upsert (every other field still refreshes) so a Grok
   re-sync can never silently downgrade a human approval -- see
   assertNeverAutoApproves() in ./schema.mjs.
   ═══════════════════════════════════════════════════════════════ */

import { CONTROLLED_TOPICS, mapSourceRow, mapClaimRow, assertNeverAutoApproves, isControlledTopic } from './schema.mjs';

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function supabaseHeaders(env, extra = {}) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function upsert(env, table, rows, onConflict, { returnRepresentation = false } = {}) {
  if (!rows.length) return [];
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: 'POST',
    headers: supabaseHeaders(env, {
      Prefer: `resolution=merge-duplicates,return=${returnRepresentation ? 'representation' : 'minimal'}`
    }),
    body: JSON.stringify(rows)
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`upsert ${table} failed: HTTP ${res.status} ${body.slice(0, 500)}`);
  }
  return returnRepresentation ? res.json() : [];
}

async function selectIds(env, table, idColumn, extraQuery = '') {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/${table}?select=${idColumn}${extraQuery}`,
    { headers: supabaseHeaders(env) }
  );
  if (!res.ok) throw new Error(`select ${table} failed: HTTP ${res.status}`);
  const rows = await res.json();
  return new Set(rows.map((r) => r[idColumn]));
}

async function countTable(env, table) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, {
    headers: supabaseHeaders(env, { Prefer: 'count=exact' })
  });
  const range = res.headers.get('content-range'); // "0-0/219"
  if (!range) return null;
  const total = range.split('/')[1];
  return total === '*' ? null : Number(total);
}

async function insertQuarantine(env, batchId, recordType, rejectedRows) {
  if (!rejectedRows.length) return;
  const rows = rejectedRows.map((r) => ({
    batch_id: batchId,
    record_type: recordType,
    natural_id: r.natural_id,
    raw_payload: r.raw,
    validation_errors: r.errors
  }));
  for (const c of chunk(rows, 200)) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/research_ingestion_quarantine`, {
      method: 'POST',
      headers: supabaseHeaders(env, { Prefer: 'return=minimal' }),
      body: JSON.stringify(c)
    });
  }
}

const LOGGED_TABLES = ['research_sources', 'research_claims', 'research_topics', 'research_relationships',
  'research_verification_queue', 'research_coverage'];

/** Upsert a validated { sources, claims, topics, relationships,
    verificationQueue, coverage, rejected } batch into Supabase.
    Returns a summary object. Writes a research_ingestion_log row
    (running -> success/partial/failed) for provenance. */
export async function runImport(env, { loaded, batchId, sourceSystem = 'grok-research-harvester', triggeredBy = 'unknown', chunkSize = 200 }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  }

  const countsBefore = {};
  for (const t of LOGGED_TABLES) countsBefore[t] = await countTable(env, t);

  const logRes = await fetch(`${env.SUPABASE_URL}/rest/v1/research_ingestion_log`, {
    method: 'POST',
    headers: supabaseHeaders(env, { Prefer: 'return=representation' }),
    body: JSON.stringify([{
      batch_id: batchId, source_system: sourceSystem, triggered_by: triggeredBy,
      dry_run: false, status: 'running', counts_before: countsBefore
    }])
  });
  if (!logRes.ok) throw new Error(`could not open research_ingestion_log: HTTP ${logRes.status}`);
  const [logRow] = await logRes.json();

  try {
    /* 1. Topics -- TWO-STAGE upsert so a batch that doesn't report topic
       rollup data can never null out previously-observed counts.

       Stage A (identity/catalog): every controlled topic, plus anything
       observed in the batch's own topics[], plus anything referenced by
       a source/claim but not yet cataloged (so join-table FKs never
       fail on a brand-new tag). Row shape is ONLY {topic,
       in_controlled_vocab} -- PostgREST's upsert only SETs the columns
       present in the JSON body, so this stage structurally cannot touch
       source_count_observed/claim_count_observed.

       Stage B (observed counts): a per-topic PATCH that includes ONLY
       the specific count field(s) that topic's row in THIS batch
       actually provided (checked with `'x' in t`, not `t.x ?? null` --
       a field a batch never mentions must leave the stored value alone,
       not overwrite it with null). A single homogeneous-array upsert
       can't do this safely: PostgREST derives one shared column list
       across the whole array, so a row missing a field would still get
       an explicit NULL for it if any sibling row in the same call
       includes that field. Per-topic PATCH avoids that entirely.
       (See external review: a normal incremental Grok batch with
       sources/claims but no topics payload was nulling all 24
       controlled topics' observed counts every time.) */
    const topicNames = new Set(CONTROLLED_TOPICS);
    for (const t of loaded.topics) if (t && t.topic) topicNames.add(t.topic);
    for (const s of loaded.sources) for (const t of (s.topics || [])) topicNames.add(t);
    for (const c of loaded.claims) for (const t of (c.topics || [])) topicNames.add(t);

    const identityRows = [...topicNames].map((topic) => ({ topic, in_controlled_vocab: isControlledTopic(topic) }));
    await upsert(env, 'research_topics', identityRows, 'topic');

    for (const t of loaded.topics) {
      if (!t || !t.topic) continue;
      const patch = {};
      if ('source_count_observed' in t) patch.source_count_observed = t.source_count_observed;
      if ('claim_count_observed' in t) patch.claim_count_observed = t.claim_count_observed;
      if (Object.keys(patch).length === 0) continue;
      await fetch(`${env.SUPABASE_URL}/rest/v1/research_topics?topic=eq.${encodeURIComponent(t.topic)}`, {
        method: 'PATCH',
        headers: supabaseHeaders(env, { Prefer: 'return=minimal' }),
        body: JSON.stringify(patch)
      });
    }

    /* 2. Sources */
    const sourceRows = loaded.sources.map((s) => mapSourceRow(s, { grokExportBatch: batchId }));
    let insertedSources = 0, updatedSources = 0;
    for (const c of chunk(sourceRows, chunkSize)) {
      const existing = await selectIds(env, 'research_sources', 'source_id',
        `&source_id=in.(${c.map((r) => `"${r.source_id}"`).join(',')})`);
      updatedSources += c.filter((r) => existing.has(r.source_id)).length;
      insertedSources += c.filter((r) => !existing.has(r.source_id)).length;
      await upsert(env, 'research_sources', c, 'source_id');
    }

    /* 3. source <-> topic join rows */
    const sourceTopicRows = [];
    for (const s of loaded.sources) for (const t of (s.topics || [])) sourceTopicRows.push({ source_id: s.source_id, topic: t });
    for (const c of chunk(sourceTopicRows, chunkSize)) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/research_source_topics?on_conflict=source_id,topic`, {
        method: 'POST', headers: supabaseHeaders(env, { Prefer: 'resolution=ignore-duplicates,return=minimal' }),
        body: JSON.stringify(c)
      });
    }

    /* 4a. Quarantine true orphan claims BEFORE any claims upsert. The
       research_claims.source_id FK is real and is never weakened -- a
       genuinely orphaned row (source missing from both this batch and the
       existing database) WOULD be rejected by Postgres at insert time,
       which would abort the whole chunk/run for one bad record. Checking
       here first means that can only still happen for a source this
       function itself just upserted moments ago and Postgres somehow
       doesn't see yet (a real infra/consistency fault, correctly left to
       fail the batch), not for a bad or unknown source_id. */
    const batchSourceIds = new Set(loaded.sources.map((s) => s.source_id));
    const candidateOrphanSourceIds = [...new Set(
      loaded.claims.map((c) => c.source_id).filter((id) => id && !batchSourceIds.has(id))
    )];
    const dbKnownSourceIds = new Set();
    for (const idsChunk of chunk(candidateOrphanSourceIds, chunkSize)) {
      const found = await selectIds(env, 'research_sources', 'source_id',
        `&source_id=in.(${idsChunk.map((id) => `"${id}"`).join(',')})`);
      for (const id of found) dbKnownSourceIds.add(id);
    }
    const orphanClaims = [];
    const claimsToProcess = [];
    for (const c of loaded.claims) {
      if (c.source_id && (batchSourceIds.has(c.source_id) || dbKnownSourceIds.has(c.source_id))) {
        claimsToProcess.push(c);
      } else {
        orphanClaims.push({
          natural_id: c.claim_id || null,
          errors: [`source_id ${JSON.stringify(c.source_id)} not found in this batch or the existing database (orphan claim)`],
          raw: c
        });
      }
    }

    /* 4b. Claims -- protect existing AIMT_APPROVED rows from downgrade */
    const alreadyApproved = await selectIds(env, 'research_claims', 'claim_id', `&verification_status=eq.AIMT_APPROVED`);
    let insertedClaims = 0, updatedClaims = 0;
    for (const rawBatch of chunk(claimsToProcess, chunkSize)) {
      const protectedBatch = rawBatch.filter((c) => alreadyApproved.has(c.claim_id));
      const normalBatch = rawBatch.filter((c) => !alreadyApproved.has(c.claim_id));

      const existingIds = await selectIds(env, 'research_claims', 'claim_id',
        `&claim_id=in.(${rawBatch.map((r) => `"${r.claim_id}"`).join(',')})`);
      insertedClaims += rawBatch.filter((r) => !existingIds.has(r.claim_id)).length;
      updatedClaims += rawBatch.filter((r) => existingIds.has(r.claim_id)).length;

      if (normalBatch.length) {
        const rows = normalBatch.map((c) => mapClaimRow(c, { grokExportBatch: batchId }));
        rows.forEach(assertNeverAutoApproves);
        await upsert(env, 'research_claims', rows, 'claim_id');
      }
      if (protectedBatch.length) {
        const rows = protectedBatch.map((c) => {
          const row = mapClaimRow(c, { grokExportBatch: batchId });
          delete row.verification_status; // never downgrade a human AIMT_APPROVED
          return row;
        });
        await upsert(env, 'research_claims', rows, 'claim_id');
      }
    }

    /* 5. claim <-> topic join rows -- claimsToProcess only: a
       research_claim_topics row for an orphaned (quarantined) claim_id
       would hit that table's own FK to research_claims and fail the same
       way, so it must track whichever claims actually got upserted. */
    const claimTopicRows = [];
    for (const c of claimsToProcess) for (const t of (c.topics || [])) claimTopicRows.push({ claim_id: c.claim_id, topic: t });
    for (const c of chunk(claimTopicRows, chunkSize)) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/research_claim_topics?on_conflict=claim_id,topic`, {
        method: 'POST', headers: supabaseHeaders(env, { Prefer: 'resolution=ignore-duplicates,return=minimal' }),
        body: JSON.stringify(c)
      });
    }

    /* 6. Relationships / verification queue / coverage (straight upserts) */
    if (loaded.relationships.length) await upsert(env, 'research_relationships', loaded.relationships, 'relationship_id');
    if (loaded.verificationQueue.length) {
      const rows = loaded.verificationQueue.map((q) => ({
        queue_id: q.queue_id, lane: q.lane, item_type: q.item_type, item_id: q.item_id,
        priority: q.priority, priority_band: q.priority_band, evidence_type: q.evidence_type ?? null,
        source_role: q.source_role ?? null, topics_raw: q.topics ?? null, status: q.status,
        enqueued_on: q.enqueued_on ?? null, notes: q.notes ?? null
      }));
      await upsert(env, 'research_verification_queue', rows, 'queue_id');
    }
    if (loaded.coverage.length) {
      const rows = loaded.coverage.map((cv) => ({
        topic: cv.topic, source_count: cv.source_count, verified_source_count: cv.verified_source_count,
        claim_count: cv.claim_count, verified_claim_count: cv.verified_claim_count,
        newest_evidence_year: cv.newest_evidence_year, evidence_maturity: cv.evidence_maturity,
        computed_at: new Date().toISOString()
      }));
      await upsert(env, 'research_coverage', rows, 'topic');
    }

    /* 7. Quarantine rejected rows (JS-validation rejects + orphan claims
       caught in step 4a) */
    const allRejectedClaims = [...loaded.rejected.claims, ...orphanClaims];
    await insertQuarantine(env, batchId, 'source', loaded.rejected.sources);
    await insertQuarantine(env, batchId, 'claim', allRejectedClaims);

    const countsAfter = {};
    for (const t of LOGGED_TABLES) countsAfter[t] = await countTable(env, t);

    const rejectedTotal = loaded.rejected.sources.length + allRejectedClaims.length;
    await fetch(`${env.SUPABASE_URL}/rest/v1/research_ingestion_log?id=eq.${logRow.id}`, {
      method: 'PATCH',
      headers: supabaseHeaders(env, { Prefer: 'return=minimal' }),
      body: JSON.stringify({
        status: rejectedTotal > 0 ? 'partial' : 'success',
        finished_at: new Date().toISOString(),
        counts_after: countsAfter,
        inserted_counts: { sources: insertedSources, claims: insertedClaims },
        updated_counts: { sources: updatedSources, claims: updatedClaims },
        rejected_counts: { sources: loaded.rejected.sources.length, claims: allRejectedClaims.length, orphan_claims: orphanClaims.length }
      })
    });

    return {
      logId: logRow.id, countsBefore, countsAfter,
      insertedSources, updatedSources, insertedClaims, updatedClaims,
      rejectedSources: loaded.rejected.sources.length, rejectedClaims: allRejectedClaims.length,
      orphanClaims: orphanClaims.length
    };
  } catch (err) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/research_ingestion_log?id=eq.${logRow.id}`, {
      method: 'PATCH',
      headers: supabaseHeaders(env, { Prefer: 'return=minimal' }),
      body: JSON.stringify({ status: 'failed', finished_at: new Date().toISOString(), error_summary: String(err && err.message || err) })
    });
    throw err;
  }
}
