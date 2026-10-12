import test from 'node:test';
import assert from 'node:assert/strict';
import { runImport } from '../functions/_lib/research/importer.mjs';
import { processIngestionBatch } from '../functions/_lib/research/ingest-request.mjs';

const env = { SUPABASE_URL: 'https://database.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fake-test-key' };
const batch = () => ({
  sources: [{ source_id: 's1', title: 'Fixture', topics: ['hair-cycle'] }],
  claims: [{ claim_id: 'c1', source_id: 's1', claim_text: 'Fixture claim', topics: ['hair-cycle'], verification_status: 'CLAIM_VERIFIED' }],
  topics: [{ topic: 'hair-cycle', source_count_observed: 1 }],
  relationships: [{ relationship_id: 'r1' }],
  verificationQueue: [{ queue_id: 'q1', item_id: 'c1', status: 'pending' }],
  coverage: [{ topic: 'hair-cycle' }],
  rejected: { sources: [{ natural_id: 'bad', raw: {}, errors: ['fixture reject'] }], claims: [] },
});

// In-memory PostgREST stand-in; all records and credentials are fixtures.
function database({ fail = () => false, existing = false, approved = false, emptyPatch = false } = {}) {
  const writes = [];
  const fetchFn = async (url, options = {}) => {
    const u = new URL(url);
    const table = u.pathname.split('/').pop();
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : null;
    if (method !== 'GET') writes.push({ table, method, body });
    if (fail({ table, method, body, url: u })) return new Response('private provider error must not leak', { status: 503 });
    if (method === 'GET') {
      if (u.searchParams.get('select') === '*') return new Response('[]', { headers: { 'content-range': '0-0/1' } });
      const id = u.searchParams.get('select');
      const found = u.searchParams.has('verification_status') ? approved : existing;
      return Response.json(found ? [{ [id]: id === 'source_id' ? 's1' : 'c1' }] : []);
    }
    if (table === 'research_ingestion_log' && method === 'POST') return Response.json([{ id: 'log-fixture' }]);
    if (method === 'PATCH') {
      assert.equal(options.headers.Prefer, 'return=representation');
      return Response.json(emptyPatch ? [] : [{ id: 'log-fixture', ...body }]);
    }
    if (['research_sources', 'research_claims'].includes(table)) {
      assert.equal(u.searchParams.get('on_conflict'), table === 'research_sources' ? 'source_id' : 'claim_id');
      assert.match(options.headers.Prefer, /resolution=merge-duplicates/);
    }
    if (table.endsWith('_topics') && table !== 'research_topics') assert.match(options.headers.Prefer, /resolution=ignore-duplicates/);
    return new Response(null, { status: 204 });
  };
  return { writes, fetchFn };
}

async function withDatabase(db, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = db.fetchFn;
  try { return await fn(); } finally { globalThis.fetch = original; }
}

for (const [table, method] of [
  ['research_topics', 'POST'], ['research_topics', 'PATCH'],
  ['research_sources', 'POST'], ['research_source_topics', 'POST'],
  ['research_claims', 'POST'], ['research_claim_topics', 'POST'],
  ['research_relationships', 'POST'], ['research_verification_queue', 'POST'],
  ['research_coverage', 'POST'], ['research_ingestion_quarantine', 'POST'],
  ['research_ingestion_log', 'POST'], ['research_ingestion_log', 'PATCH'],
]) {
  test(`required ${method} ${table} failure cannot report successful ingestion`, async () => {
    const db = database({ fail: (op) => op.table === table && op.method === method });
    await withDatabase(db, () => assert.rejects(runImport(env, { loaded: batch(), batchId: 'fixture' }), (err) => {
      assert.match(err.message, new RegExp(`${method} ${table} failed`));
      assert.ok(!err.message.includes('private provider error'));
      return true;
    }));
    if (table !== 'research_ingestion_log') {
      const final = db.writes.filter((op) => op.table === 'research_ingestion_log' && op.method === 'PATCH');
      assert.equal(final.at(-1).body.status, 'failed');
      assert.ok(!final.some((op) => ['success', 'partial'].includes(op.body.status)));
    }
  });
}

test('successful historical replay preserves approval, omitted rollups and idempotent conflict semantics', async () => {
  const db = database({ existing: true, approved: true });
  const loaded = batch();
  loaded.topics = [];
  loaded.rejected = { sources: [], claims: [] };
  const result = await withDatabase(db, () => runImport(env, { loaded, batchId: 'historical-fixture' }));
  assert.equal(result.insertedSources, 0);
  assert.equal(result.updatedSources, 1);
  assert.equal(result.insertedClaims, 0);
  assert.equal(result.updatedClaims, 1);
  assert.equal(result.processedClaims.length, 1);
  assert.ok(!('verification_status' in db.writes.find((op) => op.table === 'research_claims').body[0]));
  assert.ok(!db.writes.some((op) => op.table === 'research_topics' && op.method === 'PATCH'));
  assert.equal(db.writes.at(-1).body.status, 'success');
});

test('quarantined and orphaned records produce an honest partial result', async () => {
  const db = database();
  const loaded = batch();
  loaded.claims.push({ claim_id: 'orphan', source_id: 'missing', topics: ['hair-cycle'] });
  const result = await withDatabase(db, () => runImport(env, { loaded, batchId: 'partial-fixture' }));
  assert.equal(result.orphanClaims, 1);
  assert.deepEqual(result.processedClaims.map((c) => c.claim_id), ['c1']);
  assert.equal(db.writes.at(-1).body.status, 'partial');
  assert.equal(db.writes.filter((op) => op.table === 'research_ingestion_quarantine').length, 2);
});

test('failed counts and zero-row PATCH responses cannot masquerade as success', async () => {
  for (const db of [database({ fail: (op) => op.method === 'GET' }), database({ emptyPatch: true })]) {
    await withDatabase(db, () => assert.rejects(runImport(env, { loaded: batch(), batchId: 'fixture' })));
  }
});

test('failure-log transport error preserves original failure and exposes lost reporting', async () => {
  const db = database({ fail: (op) => op.table === 'research_source_topics' });
  const originalFetch = db.fetchFn;
  db.fetchFn = (url, options) => {
    if (options?.method === 'PATCH' && String(url).includes('research_ingestion_log')) throw new Error('secret-looking transport detail');
    return originalFetch(url, options);
  };
  await withDatabase(db, () => assert.rejects(runImport(env, { loaded: batch(), batchId: 'fixture' }), (err) => {
    assert.match(err.message, /POST research_source_topics failed/);
    assert.match(err.message, /failure reporting also failed: PATCH research_ingestion_log failed: transport error/);
    assert.ok(!err.message.includes('secret-looking'));
    return true;
  }));
});

test('canonical ingestion consumer rejects a required-write failure instead of returning ok', async () => {
  const db = database({ fail: (op) => op.table === 'research_topics' && op.method === 'POST' });
  await withDatabase(db, () => assert.rejects(processIngestionBatch(env, { batch_id: 'fixture', sources: [], claims: [] })));
});

test('approval protection includes rows beyond the REST limit, including a smaller server page cap', async () => {
  for (const pageSize of [1000, 500]) {
    const db = database();
    const originalFetch = db.fetchFn;
    const offsets = [];
    db.fetchFn = (url, options) => {
      const u = new URL(url);
      if (u.searchParams.has('verification_status')) {
        const offset = Number(u.searchParams.get('offset'));
        offsets.push(offset);
        const all = Array.from({ length: 1001 }, (_, i) => ({ claim_id: i === 1000 ? 'c1' : `approved-${i}` }));
        return Response.json(all.slice(offset, offset + pageSize), { headers: { 'content-range': `${offset}-${Math.min(offset + pageSize - 1, 1000)}/1001` } });
      }
      return originalFetch(url, options);
    };
    await withDatabase(db, () => runImport(env, { loaded: batch(), batchId: 'pagination-fixture' }));
    assert.ok(offsets.includes(1000));
    assert.ok(!('verification_status' in db.writes.find((op) => op.table === 'research_claims').body[0]));
  }
});

test('failed pagination and an incomplete page fail closed before claims are written', async () => {
  for (const mode of ['http-failure', 'empty-page']) {
    const db = database();
    const originalFetch = db.fetchFn;
    db.fetchFn = (url, options) => {
      const u = new URL(url);
      if (u.searchParams.has('verification_status')) {
        const offset = Number(u.searchParams.get('offset'));
        if (offset === 0) return Response.json([{ claim_id: 'first' }], { headers: { 'content-range': '0-0/2' } });
        return mode === 'http-failure' ? new Response(null, { status: 503 }) : Response.json([], { headers: { 'content-range': '*/2' } });
      }
      return originalFetch(url, options);
    };
    await withDatabase(db, () => assert.rejects(runImport(env, { loaded: batch(), batchId: 'fixture' })));
    assert.ok(!db.writes.some((op) => op.table === 'research_claims'));
    assert.equal(db.writes.at(-1).body.status, 'failed');
  }
});
