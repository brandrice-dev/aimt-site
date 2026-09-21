#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   AIMT Research Library — ingestion fault-tolerance test
   ---------------------------------------------------------------
   Exercises runImport() (functions/_lib/research/importer.mjs)
   against a mocked Supabase REST layer -- no network, no real
   Supabase project touched. Reproduces exactly the failure mode
   from the external review:

     "a claim can pass JS validation but reference a source that is
      absent both from the submitted batch and the existing database.
      The research_claims FK can then fail the claim upsert and abort
      the whole run."

   Asserts:
     1. A true orphan claim (source missing from batch AND mock DB) is
        quarantined, never sent to the research_claims upsert.
     2. A claim referencing a source that's already in the mock DB
        (not resent in this batch) is NOT falsely flagged as an orphan.
     3. The rest of an otherwise-valid batch still imports when one
        claim is orphaned -- the run reports 'partial', not 'failed'.
     4. A simulated infrastructure failure (mock 500 on the sources
        upsert) still fails the whole run -- i.e. this fix narrows
        failure to bad records without eliminating real failure
        handling.

   Exit code 0 = all assertions passed, nonzero = failure (with detail).
   ═══════════════════════════════════════════════════════════════ */

import { runImport } from '../functions/_lib/research/importer.mjs';

let failures = 0;
function assert(cond, msg) {
  if (!cond) { failures++; console.error(`FAIL: ${msg}`); }
  else console.log(`ok: ${msg}`);
}

/* ── Minimal in-memory PostgREST mock ── */
function makeMockSupabase({ existingSourceIds = [], existingApprovedClaimIds = [], failSourcesUpsert = false } = {}) {
  const state = {
    sources: new Set(existingSourceIds),
    approvedClaims: new Set(existingApprovedClaimIds),
    calls: [] // { method, url, body }
  };

  function rangeHeader(n) {
    return { get: (k) => (k.toLowerCase() === 'content-range' ? `0-0/${n}` : null) };
  }

  async function mockFetch(url, opts = {}) {
    const method = opts.method || 'GET';
    const body = opts.body ? JSON.parse(opts.body) : null;
    state.calls.push({ method, url, body });

    // research_ingestion_log
    if (url.includes('/rest/v1/research_ingestion_log') && method === 'POST') {
      return { ok: true, json: async () => [{ id: 'log-1', ...body[0] }] };
    }
    if (url.includes('/rest/v1/research_ingestion_log') && method === 'PATCH') {
      return { ok: true, json: async () => ({}), text: async () => '' };
    }

    // count queries: GET .../TABLE?select=*&limit=1  (Prefer: count=exact)
    if (method === 'GET' && url.includes('select=*&limit=1')) {
      return { ok: true, headers: rangeHeader(0), json: async () => [] };
    }

    // select existing source_ids
    if (method === 'GET' && url.includes('/rest/v1/research_sources') && url.includes('source_id=in.(')) {
      const m = url.match(/source_id=in\.\(([^)]*)\)/);
      const requested = m[1].split(',').map((s) => s.replace(/"/g, ''));
      const found = requested.filter((id) => state.sources.has(id));
      return { ok: true, json: async () => found.map((source_id) => ({ source_id })) };
    }

    // select existing claim_ids (either AIMT_APPROVED filter, or plain claim_id=in.(...))
    if (method === 'GET' && url.includes('/rest/v1/research_claims')) {
      if (url.includes('verification_status=eq.AIMT_APPROVED')) {
        return { ok: true, json: async () => [...state.approvedClaims].map((claim_id) => ({ claim_id })) };
      }
      // No pre-existing claims tracked in this mock beyond approved ones -- fine for this test.
      return { ok: true, json: async () => [] };
    }

    // upsert sources
    if (method === 'POST' && url.includes('/rest/v1/research_sources?on_conflict=source_id')) {
      if (failSourcesUpsert) return { ok: false, status: 500, text: async () => 'simulated infra failure' };
      for (const row of body) state.sources.add(row.source_id);
      return { ok: true, json: async () => [] };
    }

    // upsert claims
    if (method === 'POST' && url.includes('/rest/v1/research_claims?on_conflict=claim_id')) {
      for (const row of body) {
        assert(state.sources.has(row.source_id),
          `claims upsert never receives an orphan (claim_id=${row.claim_id} source_id=${row.source_id} must already be a known source)`);
      }
      return { ok: true, json: async () => [] };
    }

    // topic joins, topics upsert, relationships/queue/coverage upserts -- accept unconditionally
    if (method === 'POST') {
      return { ok: true, json: async () => [] };
    }

    throw new Error(`mockFetch: unhandled ${method} ${url}`);
  }

  return { state, mockFetch };
}

async function withMockedFetch(mockFetch, fn) {
  const real = global.fetch;
  global.fetch = mockFetch;
  try { return await fn(); } finally { global.fetch = real; }
}

/* ── Scenario 1: true orphan + pre-existing-DB source + happy path together ── */
async function testOrphanQuarantine() {
  console.log('\n--- Scenario 1: orphan claim is quarantined, batch still reports partial, rest imports ---');
  const { state, mockFetch } = makeMockSupabase({ existingSourceIds: ['already-in-db-source'] });

  const loaded = {
    sources: [
      { source_id: 'batch-source-1', title: 'A', record_type: 'source', verification_status: 'SOURCE_VERIFIED' }
    ],
    claims: [
      { claim_id: 'batch-source-1--c01', source_id: 'batch-source-1', claim_text: 'valid, source in this batch', record_type: 'claim', verification_status: 'CLAIM_VERIFIED' },
      { claim_id: 'already-in-db-source--c01', source_id: 'already-in-db-source', claim_text: 'valid, source already in DB (not resent)', record_type: 'claim', verification_status: 'CLAIM_VERIFIED' },
      { claim_id: 'ghost-source--c01', source_id: 'ghost-source-not-anywhere', claim_text: 'TRUE ORPHAN: source in neither batch nor DB', record_type: 'claim', verification_status: 'CLAIM_VERIFIED' }
    ],
    topics: [], relationships: [], verificationQueue: [], coverage: [],
    rejected: { sources: [], claims: [] }
  };

  const result = await withMockedFetch(mockFetch, () =>
    runImport({ SUPABASE_URL: 'https://mock.local', SUPABASE_SERVICE_ROLE_KEY: 'mock-key' },
      { loaded, batchId: 'test-batch-1', triggeredBy: 'test' })
  );

  assert(result.orphanClaims === 1, `exactly 1 orphan claim detected (got ${result.orphanClaims})`);
  assert(result.rejectedClaims === 1, `rejectedClaims reflects the orphan (got ${result.rejectedClaims})`);
  assert(result.insertedClaims === 2, `the 2 valid claims (batch-local source + pre-existing-DB source) still import (got ${result.insertedClaims})`);

  const quarantineCall = state.calls.find((c) => c.url.includes('research_ingestion_quarantine') && c.method === 'POST');
  assert(!!quarantineCall, 'a quarantine POST was made');
  assert(quarantineCall && quarantineCall.body.some((r) => r.natural_id === 'ghost-source--c01'),
    'the quarantine payload contains the true orphan claim_id');
  assert(quarantineCall && !quarantineCall.body.some((r) => r.natural_id === 'already-in-db-source--c01'),
    'the claim referencing an already-in-DB source is NOT quarantined (no false positive)');

  const logPatchCall = [...state.calls].reverse().find((c) => c.url.includes('research_ingestion_log') && c.method === 'PATCH');
  assert(logPatchCall && logPatchCall.body.status === 'partial', `research_ingestion_log status is 'partial', not 'failed' (got ${logPatchCall && logPatchCall.body.status})`);
}

/* ── Scenario 2: a real infrastructure failure still fails the whole run ── */
async function testInfraFailureStillAborts() {
  console.log('\n--- Scenario 2: a genuine infra failure (mock 500) still fails the run ---');
  const { mockFetch } = makeMockSupabase({ failSourcesUpsert: true });

  const loaded = {
    sources: [{ source_id: 'src-1', title: 'A', record_type: 'source', verification_status: 'SOURCE_VERIFIED' }],
    claims: [{ claim_id: 'src-1--c01', source_id: 'src-1', claim_text: 'x', record_type: 'claim', verification_status: 'CLAIM_VERIFIED' }],
    topics: [], relationships: [], verificationQueue: [], coverage: [],
    rejected: { sources: [], claims: [] }
  };

  let threw = false;
  try {
    await withMockedFetch(mockFetch, () =>
      runImport({ SUPABASE_URL: 'https://mock.local', SUPABASE_SERVICE_ROLE_KEY: 'mock-key' },
        { loaded, batchId: 'test-batch-2', triggeredBy: 'test' })
    );
  } catch (e) {
    threw = true;
  }
  assert(threw, 'a simulated infra failure (500 on sources upsert) still throws / fails the run, not silently absorbed');
}

async function main() {
  await testOrphanQuarantine();
  await testInfraFailureStillAborts();

  console.log(`\n=== ${failures === 0 ? 'ALL PASSED' : `${failures} ASSERTION(S) FAILED`} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Test run crashed:', err);
  process.exit(1);
});
