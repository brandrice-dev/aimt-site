#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   AIMT Research Harvester MCP connector — test harness
   ---------------------------------------------------------------
   Exercises functions/api/mcp.js directly (as a Cloudflare Pages
   Function -- calling onRequestPost/onRequestGet/onRequestDelete with a
   {request, env} context, exactly how the Pages runtime would) against a
   mocked Supabase REST layer. No network, no real Cloudflare deploy, no
   real Supabase project touched, no real research batch sent anywhere.

   Covers:
     1. missing auth -> 401
     2. invalid auth -> 401
     3. valid mocked auth can initialize MCP
     4. tools/list exposes submit_research_batch
     5. no unexpected write tools are exposed
     6. tool schema is valid (structural checks, no ajv dependency)
     7. malformed tool payload does not import data
     8. AIMT_APPROVED submission cannot bypass existing protection
     9-10. see the companion re-runs in the same CI-style pass:
       scripts/research-library-ingestion-test.mjs (existing
       research-ingest.js / importer.mjs behavior), and
       scripts/research-library-preflight.mjs + research-library-rls-
       check.mjs (existing DB-constraint / RLS checks) -- unaffected by
       this change, re-run separately to prove nothing regressed.

   Exit code 0 = all assertions passed, nonzero = failure (with detail).
   ═══════════════════════════════════════════════════════════════ */

import { onRequestPost, onRequestGet, onRequestDelete } from '../functions/api/mcp.js';

let failures = 0;
function assert(cond, msg) {
  if (!cond) { failures++; console.error(`FAIL: ${msg}`); }
  else console.log(`ok: ${msg}`);
}

const MOCK_SECRET = 'test-mcp-connector-secret-do-not-use-in-prod';
const MCP_URL = 'https://aimtrichology.com/api/mcp';

function makeEnv(overrides = {}) {
  return {
    MCP_CONNECTOR_SECRET: MOCK_SECRET,
    SUPABASE_URL: 'https://mock.local',
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key',
    ...overrides
  };
}

/* auth: null means "omit the Authorization header entirely" -- distinct
   from omitting the `auth` key/passing undefined, which callers use to
   mean "use rpcCall's default valid token". JS default-parameter values
   kick in on `undefined`, not just on a missing key, so this distinction
   has to be explicit (an earlier version of this test passed
   `{ auth: undefined }` intending "no header" and got the default valid
   token instead -- caught by assertion 1 actually still passing with the
   wrong header, i.e. a false negative in the test itself, not in mcp.js). */
function makeRequest({ method = 'POST', auth, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth !== null && auth !== undefined) headers['Authorization'] = auth;
  return new Request(MCP_URL, {
    method,
    headers,
    body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))
  });
}

/* ── Minimal in-memory PostgREST mock (same shape as
   research-library-ingestion-test.mjs's mock) -- records every call so
   tests can assert whether a write happened at all. ── */
function makeMockSupabase({ existingSourceIds = [], existingApprovedClaimIds = [] } = {}) {
  const state = { sources: new Set(existingSourceIds), approvedClaims: new Set(existingApprovedClaimIds), calls: [] };
  function rangeHeader(n) { return { get: (k) => (k.toLowerCase() === 'content-range' ? `0-0/${n}` : null) }; }

  async function mockFetch(url, opts = {}) {
    const method = opts.method || 'GET';
    const body = opts.body ? JSON.parse(opts.body) : null;
    state.calls.push({ method, url, body });

    if (url.includes('/rest/v1/research_ingestion_log') && method === 'POST') {
      return { ok: true, json: async () => [{ id: 'log-1', ...body[0] }] };
    }
    if (url.includes('/rest/v1/research_ingestion_log') && method === 'PATCH') {
      return { ok: true, json: async () => ({}), text: async () => '' };
    }
    if (url.includes('/rest/v1/aimt_logs') && method === 'POST') {
      return { ok: true, json: async () => ([]), text: async () => '' };
    }
    if (method === 'GET' && url.includes('select=*&limit=1')) {
      return { ok: true, headers: rangeHeader(0), json: async () => [] };
    }
    if (method === 'GET' && url.includes('/rest/v1/research_sources') && url.includes('source_id=in.(')) {
      const m = url.match(/source_id=in\.\(([^)]*)\)/);
      const requested = m[1].split(',').map((s) => s.replace(/"/g, ''));
      const found = requested.filter((id) => state.sources.has(id));
      return { ok: true, json: async () => found.map((source_id) => ({ source_id })) };
    }
    if (method === 'GET' && url.includes('/rest/v1/research_claims')) {
      if (url.includes('verification_status=eq.AIMT_APPROVED')) {
        return { ok: true, json: async () => [...state.approvedClaims].map((claim_id) => ({ claim_id })) };
      }
      return { ok: true, json: async () => [] };
    }
    if (method === 'POST' && url.includes('/rest/v1/research_sources?on_conflict=source_id')) {
      for (const row of body) state.sources.add(row.source_id);
      return { ok: true, json: async () => [] };
    }
    if (method === 'POST' && url.includes('/rest/v1/research_claims?on_conflict=claim_id')) {
      return { ok: true, json: async () => [] };
    }
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

async function rpcCall(env, msg, opts = {}) {
  const auth = 'auth' in opts ? opts.auth : `Bearer ${MOCK_SECRET}`;
  const request = makeRequest({ auth, body: msg });
  const res = await onRequestPost({ request, env });
  const status = res.status;
  let json = null;
  const text = await res.text();
  if (text) { try { json = JSON.parse(text); } catch (_) { /* not JSON, e.g. 401 plain text */ } }
  return { status, json, text };
}

/* ── 1 & 2: auth ── */
async function testAuthRejection() {
  console.log('\n--- 1/2: missing/invalid auth -> 401 ---');
  const env = makeEnv();
  const { mockFetch } = makeMockSupabase();
  await withMockedFetch(mockFetch, async () => {
    const noAuth = await rpcCall(env, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }, { auth: null });
    assert(noAuth.status === 401, `missing Authorization header -> 401 (got ${noAuth.status})`);

    const badAuth = await rpcCall(env, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }, { auth: 'Bearer wrong-secret-value' });
    assert(badAuth.status === 401, `wrong bearer token -> 401 (got ${badAuth.status})`);

    const badScheme = await rpcCall(env, { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }, { auth: MOCK_SECRET /* no "Bearer " prefix */ });
    assert(badScheme.status === 401, `missing "Bearer" scheme -> 401 (got ${badScheme.status})`);

    // GET/DELETE also require auth
    const getNoAuth = await onRequestGet({ request: makeRequest({ method: 'GET', auth: null }), env });
    assert(getNoAuth.status === 401, `GET with no auth -> 401 (got ${getNoAuth.status})`);
    const deleteNoAuth = await onRequestDelete({ request: makeRequest({ method: 'DELETE', auth: null }), env });
    assert(deleteNoAuth.status === 401, `DELETE with no auth -> 401 (got ${deleteNoAuth.status})`);
    const deleteWithAuth = await onRequestDelete({ request: makeRequest({ method: 'DELETE', auth: `Bearer ${MOCK_SECRET}` }), env });
    assert(deleteWithAuth.status === 405, `DELETE with valid auth -> 405 (no session to terminate) (got ${deleteWithAuth.status})`);
  });
}

/* ── 3: valid auth can initialize ── */
async function testInitialize() {
  console.log('\n--- 3: valid auth can initialize MCP ---');
  const env = makeEnv();
  const { mockFetch } = makeMockSupabase();
  await withMockedFetch(mockFetch, async () => {
    const res = await rpcCall(env, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'grok', version: '1.0' } } });
    assert(res.status === 200, `initialize returns HTTP 200 (got ${res.status})`);
    assert(res.json && res.json.jsonrpc === '2.0', 'response is JSON-RPC 2.0');
    assert(res.json && res.json.id === 1, 'response echoes request id');
    assert(res.json && res.json.result && res.json.result.protocolVersion === '2025-06-18', 'negotiates the requested supported protocol version');
    assert(res.json && res.json.result && res.json.result.capabilities && typeof res.json.result.capabilities.tools === 'object', 'declares tools capability');
    assert(res.json && res.json.result && res.json.result.serverInfo && res.json.result.serverInfo.name === 'aimt-research-harvester', 'reports serverInfo.name');

    // notifications/initialized (no id) -> 202, empty body
    const notifRequest = makeRequest({ auth: `Bearer ${MOCK_SECRET}`, body: { jsonrpc: '2.0', method: 'notifications/initialized' } });
    const notifRes = await onRequestPost({ request: notifRequest, env });
    assert(notifRes.status === 202, `notifications/initialized -> HTTP 202 (got ${notifRes.status})`);
    const notifBody = await notifRes.text();
    assert(notifBody === '', 'notification response has empty body');

    // ping
    const pingRes = await rpcCall(env, { jsonrpc: '2.0', id: 2, method: 'ping' });
    assert(pingRes.status === 200 && pingRes.json.result && typeof pingRes.json.result === 'object', 'ping returns an empty result object');
  });
}

/* ── 4 & 5: tools/list ── */
async function testToolsList() {
  console.log('\n--- 4/5: tools/list exposes exactly submit_research_batch ---');
  const env = makeEnv();
  const { mockFetch } = makeMockSupabase();
  await withMockedFetch(mockFetch, async () => {
    const res = await rpcCall(env, { jsonrpc: '2.0', id: 3, method: 'tools/list' });
    assert(res.status === 200, `tools/list -> HTTP 200 (got ${res.status})`);
    const tools = res.json && res.json.result && res.json.result.tools;
    assert(Array.isArray(tools), 'result.tools is an array');
    assert(tools.length === 1, `exactly one tool is exposed (got ${tools && tools.length})`);
    assert(tools[0].name === 'submit_research_batch', `the one tool is named submit_research_batch (got ${tools[0] && tools[0].name})`);
    const names = tools.map((t) => t.name);
    assert(!names.includes('delete_research') && !names.includes('publish') && !names.includes('approve_claim'), 'no unexpected write/publish/approve tool is exposed');
    return tools[0];
  });
}

/* ── 6: tool schema validity (structural, no ajv dependency) ── */
async function testToolSchema() {
  console.log('\n--- 6: tool schema is structurally valid ---');
  const env = makeEnv();
  const { mockFetch } = makeMockSupabase();
  await withMockedFetch(mockFetch, async () => {
    const res = await rpcCall(env, { jsonrpc: '2.0', id: 4, method: 'tools/list' });
    const tool = res.json.result.tools[0];
    assert(typeof tool.description === 'string' && tool.description.length > 20, 'tool has a non-trivial description');
    assert(tool.inputSchema && tool.inputSchema.type === 'object', 'inputSchema.type === "object"');
    assert(tool.inputSchema.properties && typeof tool.inputSchema.properties.batch_id === 'object', 'inputSchema declares batch_id');
    assert(Array.isArray(tool.inputSchema.required) && tool.inputSchema.required.includes('batch_id'), 'batch_id is required');
    for (const field of ['sources', 'claims', 'topics', 'relationships', 'verification_queue', 'coverage']) {
      assert(tool.inputSchema.properties[field] && tool.inputSchema.properties[field].type === 'array', `inputSchema declares ${field} as an array`);
    }
    assert(tool.outputSchema && tool.outputSchema.type === 'object', 'outputSchema.type === "object"');
  });
}

/* ── 7: malformed tool payload does not import data ── */
async function testMalformedPayload() {
  console.log('\n--- 7: malformed tool payload does not import data ---');
  const env = makeEnv();
  const { state, mockFetch } = makeMockSupabase();
  await withMockedFetch(mockFetch, async () => {
    // (a) no arguments at all
    const noArgs = await rpcCall(env, { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'submit_research_batch' } });
    assert(noArgs.status === 200, 'malformed call still returns a well-formed JSON-RPC response, not a crash');
    assert(noArgs.json.result.isError === true, 'missing batch_id -> tool result isError: true');
    assert(noArgs.json.result.structuredContent.error === 'batch_id_required', 'error explains batch_id is required');

    // (b) arguments is a string, not an object
    const badArgsType = await rpcCall(env, { jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'submit_research_batch', arguments: 'not-an-object' } });
    assert(badArgsType.json.result.isError === true, 'non-object arguments -> isError: true, not a crash');

    // (c) unknown tool name
    const unknownTool = await rpcCall(env, { jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'delete_everything' } });
    assert(unknownTool.json.error && unknownTool.json.error.code === -32602, 'unknown tool name -> JSON-RPC protocol error -32602');

    const writeUrls = state.calls.filter((c) => c.method === 'POST' && /research_sources|research_claims/.test(c.url));
    assert(writeUrls.length === 0, 'no research_sources/research_claims write was attempted for any malformed payload');
  });
}

/* ── 8: AIMT_APPROVED submission cannot bypass protection, via the MCP path ── */
async function testAimtApprovedRejected() {
  console.log('\n--- 8: AIMT_APPROVED submission is quarantined, not imported, via tools/call ---');
  const env = makeEnv({ SUPABASE_URL: 'https://mock.local' });
  const { state, mockFetch } = makeMockSupabase({ existingSourceIds: ['already-known-source'] });
  await withMockedFetch(mockFetch, async () => {
    const res = await rpcCall(env, {
      jsonrpc: '2.0', id: 8, method: 'tools/call',
      params: {
        name: 'submit_research_batch',
        arguments: {
          batch_id: 'mcp-test-aimt-approved-attempt',
          claims: [{
            claim_id: 'already-known-source--c01',
            source_id: 'already-known-source',
            claim_text: 'an attempted claim',
            record_type: 'claim',
            verification_status: 'AIMT_APPROVED'
          }]
        }
      }
    });
    assert(res.status === 200, `tools/call returns HTTP 200 (got ${res.status})`);
    const payload = res.json.result.structuredContent;
    assert(payload.status === 'partial', `batch reports 'partial' because the claim was quarantined (got ${payload.status})`);
    assert(payload.quarantined.claims === 1, `exactly 1 claim quarantined (got ${payload.quarantined.claims})`);
    assert(payload.accepted.claims === 0, `0 claims accepted/imported (got ${payload.accepted.claims})`);

    const claimUpsertCalls = state.calls.filter((c) => c.method === 'POST' && c.url.includes('/rest/v1/research_claims?on_conflict=claim_id'));
    assert(claimUpsertCalls.length === 0, 'the AIMT_APPROVED claim never reached a research_claims upsert call');

    const quarantineCall = state.calls.find((c) => c.url.includes('research_ingestion_quarantine') && c.method === 'POST');
    assert(!!quarantineCall, 'the claim was written to research_ingestion_quarantine instead');
  });
}

/* ── No-data protocol smoke test: initialize + tools/list only, no batch sent ── */
async function testProtocolSmokeNoData() {
  console.log('\n--- smoke test: initialize + tools/list, no research batch sent ---');
  const env = makeEnv();
  const { state, mockFetch } = makeMockSupabase();
  await withMockedFetch(mockFetch, async () => {
    await rpcCall(env, { jsonrpc: '2.0', id: 100, method: 'initialize', params: { protocolVersion: '2025-06-18' } });
    await rpcCall(env, { jsonrpc: '2.0', id: 101, method: 'tools/list' });
    const anyDbWrite = state.calls.some((c) => c.method === 'POST' || c.method === 'PATCH');
    assert(!anyDbWrite, 'initialize + tools/list alone never touch the database (no research batch was sent)');
  });
}

async function main() {
  await testAuthRejection();
  await testInitialize();
  await testToolsList();
  await testToolSchema();
  await testMalformedPayload();
  await testAimtApprovedRejected();
  await testProtocolSmokeNoData();

  console.log(`\n=== ${failures === 0 ? 'ALL PASSED' : `${failures} ASSERTION(S) FAILED`} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Test run crashed:', err);
  process.exit(1);
});
