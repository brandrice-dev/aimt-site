#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   AIMT Research Harvester MCP connector — test harness
   ---------------------------------------------------------------
   Exercises functions/api/mcp.js directly (as a Cloudflare Pages
   Function -- calling onRequestPost/onRequestGet/onRequestDelete with a
   {request, env} context, exactly how the Pages runtime would) against a
   mocked Supabase REST layer. No network, no real Cloudflare deploy, no
   real Supabase project touched, no real research batch sent anywhere.

   Covers both protocol eras this dual-era server implements, built
   against the actual fetched spec text (see functions/api/mcp.js's
   header comment for the exact pages read):
     - Modern 2026-07-28: server/discover, tools/list, tools/call, all
       header/`_meta` validation (MCP-Protocol-Version, Mcp-Method,
       Mcp-Name, required _meta.clientCapabilities), unsupported-version
       rejection.
     - Legacy 2025-11-25 / 2025-06-18: initialize handshake negotiation,
       and confirmation that 2024-11-05 is never advertised/accepted on
       this Streamable HTTP implementation.
     - Origin validation (absent -> allowed, canonical -> allowed, other
       -> 403 before any DB activity).
     - Auth, tool discovery, malformed-payload safety, and the
       AIMT_APPROVED quarantine guarantee, exercised through the modern
       path specifically (the legacy-path equivalents were already
       covered before this dual-era rewrite and still pass unchanged).

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
const CANONICAL_ORIGIN = 'https://aimtrichology.com';
const MODERN_VERSION = '2026-07-28';

function makeEnv(overrides = {}) {
  return {
    MCP_CONNECTOR_SECRET: MOCK_SECRET,
    SUPABASE_URL: 'https://mock.local',
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key',
    ...overrides
  };
}

/* null means "omit this header/value entirely"; undefined (i.e. simply
   not passing the option) means "use the helper's own default". */
function makeRequest({ auth, origin, protocolVersion, mcpMethod, mcpName, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth !== null && auth !== undefined) headers['Authorization'] = auth;
  if (origin !== null && origin !== undefined) headers['Origin'] = origin;
  if (protocolVersion !== null && protocolVersion !== undefined) headers['MCP-Protocol-Version'] = protocolVersion;
  if (mcpMethod !== null && mcpMethod !== undefined) headers['Mcp-Method'] = mcpMethod;
  if (mcpName !== null && mcpName !== undefined) headers['Mcp-Name'] = mcpName;
  return new Request(MCP_URL, {
    method: 'POST',
    headers,
    body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))
  });
}

/* Builds a JWT-shaped (but unsigned/fake) access token string for OAuth
   auth tests. The mock /auth/v1/user handler below never checks the
   signature -- it looks the raw token string up in a caller-supplied
   map, exactly standing in for "Supabase verified this token server-
   side and it belongs to this user." functions/_lib/mcp/auth.mjs only
   ever decodes the payload segment AFTER that mocked verification has
   already succeeded, to read the optional client_id claim -- so a fake,
   unsigned token here is a faithful stand-in for what that code path
   actually reads. */
function makeFakeAccessToken(payload) {
  const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.fake-signature-mock-never-verifies-this`;
}

async function readResponse(res) {
  const status = res.status;
  const text = await res.text();
  let json = null;
  if (text) { try { json = JSON.parse(text); } catch (_) { /* plain text, e.g. 401/405 */ } }
  return { status, json, text };
}

/* ── Modern-era call helper: builds a spec-correct request (headers +
   _meta) by default, with every piece independently overridable so
   tests can deliberately break one thing at a time. ── */
async function modernCall(env, method, params = {}, opts = {}) {
  const {
    auth = `Bearer ${MOCK_SECRET}`, origin, id = Math.floor(Math.random() * 1_000_000),
    protocolVersionHeader = MODERN_VERSION, bodyProtocolVersion = MODERN_VERSION,
    mcpMethodHeader = method, mcpNameHeader = (params && params.name) ?? undefined,
    includeClientCapabilities = true, includeMeta = true
  } = opts;

  const meta = includeMeta
    ? { 'io.modelcontextprotocol/protocolVersion': bodyProtocolVersion, ...(includeClientCapabilities ? { 'io.modelcontextprotocol/clientCapabilities': {} } : {}) }
    : undefined;

  const message = { jsonrpc: '2.0', id, method, params: meta ? { ...params, _meta: meta } : params };
  const request = makeRequest({ auth, origin, protocolVersion: protocolVersionHeader, mcpMethod: mcpMethodHeader, mcpName: mcpNameHeader, body: message });
  const res = await onRequestPost({ request, env });
  return readResponse(res);
}

/* ── Legacy-era call helper: no MCP-Protocol-Version header on the
   initial `initialize` (a real 2025-06-18 client doesn't have one yet
   -- it's negotiating), but every SUBSEQUENT legacy request carries it
   (spec MUST), which is also how this stateless server tells legacy
   apart from modern on requests after the handshake. ── */
async function legacyCall(env, method, params = {}, opts = {}) {
  const { auth = `Bearer ${MOCK_SECRET}`, origin, id = 1, protocolVersionHeader } = opts;
  const message = { jsonrpc: '2.0', id, method, params };
  const request = makeRequest({ auth, origin, protocolVersion: protocolVersionHeader, body: message });
  const res = await onRequestPost({ request, env });
  return readResponse(res);
}

/* ── Minimal in-memory PostgREST mock (same shape as
   research-library-ingestion-test.mjs's mock). ──
   `oauthUsers`: map of raw access-token string -> mock Supabase auth user
   object (what GET /auth/v1/user would return for that token). A token
   with no entry simulates an invalid/expired OAuth access token (401).
   `adminUsersByUserId`: map of user_id -> { user_id, role, active } mock
   admin_users row, standing in for the real admin_users table that
   functions/_lib/admin/auth.mjs's resolveAdmin() reads. */
function makeMockSupabase({ existingSourceIds = [], existingApprovedClaimIds = [], oauthUsers = {}, adminUsersByUserId = {} } = {}) {
  const state = { sources: new Set(existingSourceIds), approvedClaims: new Set(existingApprovedClaimIds), calls: [] };
  function rangeHeader(n) { return { get: (k) => (k.toLowerCase() === 'content-range' ? `0-0/${n}` : null) }; }

  async function mockFetch(url, opts = {}) {
    const method = opts.method || 'GET';
    const body = opts.body ? JSON.parse(opts.body) : null;
    const headers = opts.headers || {};
    state.calls.push({ method, url, body, authorization: headers.Authorization || headers.authorization || null });

    if (url.includes('/auth/v1/user')) {
      const authHeader = headers.Authorization || headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      const user = oauthUsers[token];
      if (!user) return { ok: false, status: 401, json: async () => ({ error: 'invalid_token' }), text: async () => 'invalid_token' };
      return { ok: true, status: 200, json: async () => user, text: async () => JSON.stringify(user) };
    }
    if (url.includes('/rest/v1/admin_users')) {
      const m = url.match(/user_id=eq\.([^&]+)/);
      if (m) {
        const userId = decodeURIComponent(m[1]);
        const row = adminUsersByUserId[userId];
        return { ok: true, headers: rangeHeader(row ? 1 : 0), json: async () => (row ? [row] : []) };
      }
      // countAdminRows() path (bootstrap-owner check) -- only reached when
      // no admin_users row matched above and env.AIMT_OWNER_EMAIL is set;
      // none of these tests set it, so this branch exists only so an
      // unexpected hit fails loudly with a real count instead of a crash.
      return { ok: true, headers: rangeHeader(Object.keys(adminUsersByUserId).length), json: async () => [] };
    }
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
    if (method === 'POST' || method === 'PATCH') {
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

/* ══════════════ 1/2/17: modern server/discover, tools/list, tool discovery ══════════════ */
async function testModernDiscoverAndToolsList() {
  console.log('\n--- 1/2/17: modern server/discover + tools/list ---');
  const env = makeEnv();
  const { mockFetch } = makeMockSupabase();
  await withMockedFetch(mockFetch, async () => {
    const discover = await modernCall(env, 'server/discover', {});
    assert(discover.status === 200, `server/discover -> 200 (got ${discover.status})`);
    assert(discover.json.result.resultType === 'complete', 'server/discover result has resultType: complete');
    assert(Array.isArray(discover.json.result.supportedVersions) && discover.json.result.supportedVersions.includes('2026-07-28'), 'supportedVersions includes 2026-07-28');
    assert(discover.json.result.supportedVersions.includes('2025-11-25') && discover.json.result.supportedVersions.includes('2025-06-18'), 'supportedVersions also lists the legacy versions this server accepts');
    assert(!discover.json.result.supportedVersions.includes('2024-11-05'), 'supportedVersions never lists 2024-11-05');
    assert(discover.json.result.ttlMs === 0, `server/discover uses conservative ttlMs: 0 (got ${discover.json.result.ttlMs})`);
    assert(discover.json.result.cacheScope === 'private', `server/discover uses cacheScope: private (got ${discover.json.result.cacheScope})`);
    assert(discover.json.result.capabilities && typeof discover.json.result.capabilities.tools === 'object', 'declares tools capability');

    const list = await modernCall(env, 'tools/list', {});
    assert(list.status === 200, `modern tools/list -> 200 (got ${list.status})`);
    assert(list.json.result.resultType === 'complete', 'tools/list result has resultType: complete');
    assert(list.json.result.ttlMs === 0 && list.json.result.cacheScope === 'private', 'tools/list uses conservative caching (ttlMs:0, cacheScope:private)');
    const tools = list.json.result.tools;
    assert(Array.isArray(tools) && tools.length === 1, `exactly one tool exposed (got ${tools && tools.length})`);
    assert(tools[0].name === 'submit_research_batch', `the one tool is submit_research_batch (got ${tools[0] && tools[0].name})`);
  });
}

/* ══════════════ 3: modern submit_research_batch with mocked ingestion ══════════════ */
async function testModernToolCall() {
  console.log('\n--- 3: modern submit_research_batch protocol handling (mocked ingestion) ---');
  const env = makeEnv();
  const { mockFetch } = makeMockSupabase();
  await withMockedFetch(mockFetch, async () => {
    const res = await modernCall(env, 'tools/call', { name: 'submit_research_batch', arguments: { batch_id: 'modern-test-1', sources: [], claims: [] } });
    assert(res.status === 200, `tools/call -> 200 (got ${res.status})`);
    assert(res.json.result.resultType === 'complete', 'tools/call result has resultType: complete');
    assert(Array.isArray(res.json.result.content) && res.json.result.content[0].type === 'text', 'content is a text block');
    assert(res.json.result.structuredContent && res.json.result.structuredContent.batch_id === 'modern-test-1', 'structuredContent echoes batch_id');
    assert(res.json.result.structuredContent.status === 'ok', `empty valid batch reports status 'ok' (got ${res.json.result.structuredContent.status})`);
    assert(res.json.result._meta && res.json.result._meta['io.modelcontextprotocol/serverInfo'], 'result._meta carries serverInfo per spec (SHOULD on every result)');
  });
}

/* ══════════════ 4: required modern metadata ══════════════ */
async function testRequiredModernMetadata() {
  console.log('\n--- 4: required modern metadata (_meta.protocolVersion / clientCapabilities) ---');
  const env = makeEnv();
  const { mockFetch } = makeMockSupabase();
  await withMockedFetch(mockFetch, async () => {
    const noMeta = await modernCall(env, 'tools/list', {}, { includeMeta: false });
    assert(noMeta.status === 400, `missing _meta entirely -> 400 (got ${noMeta.status})`);
    /* Per spec: "A request missing any required field is malformed; the
       server MUST reject it with JSON-RPC error code -32602 (Invalid
       params)." HeaderMismatch (-32020) is specifically for a header
       that's missing or disagrees with the body -- the header itself IS
       present here (modernCall's default), it's the body's _meta object
       that's entirely absent, so this is the general missing-required-
       field path (-32602), not a header/body disagreement. */
    assert(noMeta.json.error && noMeta.json.error.code === -32602, `missing _meta entirely -> Invalid params -32602, not HeaderMismatch (got ${noMeta.json.error && noMeta.json.error.code})`);

    const noCaps = await modernCall(env, 'tools/list', {}, { includeClientCapabilities: false });
    assert(noCaps.status === 400, `missing _meta.clientCapabilities -> 400 (got ${noCaps.status})`);
    assert(noCaps.json.error && noCaps.json.error.code === -32602, `missing required clientCapabilities -> Invalid params -32602 (got ${noCaps.json.error && noCaps.json.error.code})`);
  });
}

/* ══════════════ 5/8: MCP-Protocol-Version header validation + mismatch ══════════════ */
async function testProtocolVersionHeaderValidation() {
  console.log('\n--- 5/8: MCP-Protocol-Version header required and must match body ---');
  const env = makeEnv();
  const { mockFetch } = makeMockSupabase();
  await withMockedFetch(mockFetch, async () => {
    const missingHeader = await modernCall(env, 'tools/list', {}, { protocolVersionHeader: null });
    // With no header and no matching modern signal via header, classifyEra falls
    // through based on body _meta version -> still modern (body says 2026-07-28),
    // then validateModernRequest itself catches the missing header.
    assert(missingHeader.status === 400 && missingHeader.json.error.code === -32020, `missing MCP-Protocol-Version header -> HeaderMismatch (got status ${missingHeader.status}, code ${missingHeader.json.error && missingHeader.json.error.code})`);

    const mismatched = await modernCall(env, 'tools/list', {}, { protocolVersionHeader: '2026-07-28', bodyProtocolVersion: '2025-06-18' });
    assert(mismatched.status === 400 && mismatched.json.error.code === -32020, `MCP-Protocol-Version header/body mismatch -> HeaderMismatch (got status ${mismatched.status}, code ${mismatched.json.error && mismatched.json.error.code})`);
    assert(mismatched.json.error.message.toLowerCase().includes('mismatch'), 'error message describes the mismatch');
  });
}

/* ══════════════ 6/8: Mcp-Method header validation + mismatch ══════════════ */
async function testMcpMethodHeaderValidation() {
  console.log('\n--- 6/8: Mcp-Method header required and must match body.method ---');
  const env = makeEnv();
  const { mockFetch } = makeMockSupabase();
  await withMockedFetch(mockFetch, async () => {
    const missingMethod = await modernCall(env, 'tools/list', {}, { mcpMethodHeader: null });
    assert(missingMethod.status === 400 && missingMethod.json.error.code === -32020, `missing Mcp-Method header -> HeaderMismatch (got ${missingMethod.status}/${missingMethod.json.error && missingMethod.json.error.code})`);

    const wrongMethod = await modernCall(env, 'tools/list', {}, { mcpMethodHeader: 'tools/call' });
    assert(wrongMethod.status === 400 && wrongMethod.json.error.code === -32020, `Mcp-Method header disagreeing with body.method -> HeaderMismatch (got ${wrongMethod.status}/${wrongMethod.json.error && wrongMethod.json.error.code})`);
  });
}

/* ══════════════ 7: Mcp-Name header validation, scoped correctly ══════════════ */
async function testMcpNameHeaderValidation() {
  console.log('\n--- 7: Mcp-Name required for tools/call only ---');
  const env = makeEnv();
  const { mockFetch } = makeMockSupabase();
  await withMockedFetch(mockFetch, async () => {
    const missingName = await modernCall(env, 'tools/call', { name: 'submit_research_batch', arguments: { batch_id: 'x' } }, { mcpNameHeader: null });
    assert(missingName.status === 400 && missingName.json.error.code === -32020, `tools/call missing Mcp-Name -> HeaderMismatch (got ${missingName.status}/${missingName.json.error && missingName.json.error.code})`);

    const wrongName = await modernCall(env, 'tools/call', { name: 'submit_research_batch', arguments: { batch_id: 'x' } }, { mcpNameHeader: 'some_other_tool' });
    assert(wrongName.status === 400 && wrongName.json.error.code === -32020, `Mcp-Name disagreeing with params.name -> HeaderMismatch (got ${wrongName.status}/${wrongName.json.error && wrongName.json.error.code})`);

    // tools/list has no params.name at all -- Mcp-Name must NOT be required there.
    const listWithoutName = await modernCall(env, 'tools/list', {}, { mcpNameHeader: null });
    assert(listWithoutName.status === 200, `tools/list succeeds with no Mcp-Name header at all (got ${listWithoutName.status})`);
  });
}

/* ══════════════ 9: unsupported modern protocol version ══════════════ */
async function testUnsupportedModernVersion() {
  console.log('\n--- 9: unsupported protocol version value is rejected correctly ---');
  const env = makeEnv();
  const { mockFetch } = makeMockSupabase();
  await withMockedFetch(mockFetch, async () => {
    const res = await modernCall(env, 'tools/list', {}, { protocolVersionHeader: '2099-01-01', bodyProtocolVersion: '2099-01-01' });
    assert(res.status === 400, `unrecognized-but-agreeing version -> 400 (got ${res.status})`);
    assert(res.json.error && res.json.error.code === -32022, `-> UnsupportedProtocolVersionError -32022 (got ${res.json.error && res.json.error.code})`);
    assert(res.json.error.data && res.json.error.data.requested === '2099-01-01', 'error.data.requested echoes what was asked for');
    assert(Array.isArray(res.json.error.data.supported) && res.json.error.data.supported.includes('2026-07-28'), 'error.data.supported lists what we actually support');
  });
}

/* ══════════════ 10/11/12: legacy initialize negotiation + 2024-11-05 never advertised ══════════════ */
async function testLegacyInitializeAndVersionExclusion() {
  console.log('\n--- 10/11/12: legacy initialize (2025-11-25, 2025-06-18); 2024-11-05 never supported ---');
  const env = makeEnv();
  const { mockFetch } = makeMockSupabase();
  await withMockedFetch(mockFetch, async () => {
    const r1125 = await legacyCall(env, 'initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'grok', version: '1.0' } });
    assert(r1125.status === 200 && r1125.json.result.protocolVersion === '2025-11-25', `initialize negotiates 2025-11-25 when requested (got ${r1125.json.result && r1125.json.result.protocolVersion})`);

    const r0618 = await legacyCall(env, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'grok', version: '1.0' } });
    assert(r0618.status === 200 && r0618.json.result.protocolVersion === '2025-06-18', `initialize negotiates 2025-06-18 when requested (got ${r0618.json.result && r0618.json.result.protocolVersion})`);

    // A client asking for 2024-11-05 at handshake time never gets it back --
    // the server falls back to its newest supported legacy version instead.
    const r2411 = await legacyCall(env, 'initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'old-client', version: '1.0' } });
    assert(r2411.status === 200, `initialize with an unsupported requested version still responds 200 with a counter-offer (got ${r2411.status})`);
    assert(r2411.json.result.protocolVersion !== '2024-11-05', '2024-11-05 is never echoed back as the negotiated version');
    assert(r2411.json.result.protocolVersion === '2025-11-25', `falls back to the newest legacy version we support (got ${r2411.json.result.protocolVersion})`);

    // A non-initialize request explicitly claiming 2024-11-05 via the header
    // is rejected outright (this transport never advertises it at all).
    const nonInit2411 = await legacyCall(env, 'tools/list', {}, { protocolVersionHeader: '2024-11-05' });
    assert(nonInit2411.status === 400, `tools/list claiming MCP-Protocol-Version: 2024-11-05 -> 400 (got ${nonInit2411.status})`);
    assert(nonInit2411.json.error && nonInit2411.json.error.code === -32022, `-> UnsupportedProtocolVersionError (got ${nonInit2411.json.error && nonInit2411.json.error.code})`);
    assert(!nonInit2411.json.error.data.supported.includes('2024-11-05'), '2024-11-05 is absent from the supported-versions list in the error');
  });
}

/* ══════════════ 13/14/15: Origin validation ══════════════ */
async function testOriginValidation() {
  console.log('\n--- 13/14/15: Origin validation (absent allowed, canonical allowed, bad -> 403 before DB) ---');
  const env = makeEnv();
  const { state, mockFetch } = makeMockSupabase();
  await withMockedFetch(mockFetch, async () => {
    const noOrigin = await legacyCall(env, 'initialize', { protocolVersion: '2025-06-18' }, { origin: null });
    assert(noOrigin.status === 200, `no Origin header -> request proceeds normally (got ${noOrigin.status})`);

    const goodOrigin = await legacyCall(env, 'initialize', { protocolVersion: '2025-06-18' }, { origin: CANONICAL_ORIGIN });
    assert(goodOrigin.status === 200, `canonical Origin (${CANONICAL_ORIGIN}) -> request proceeds normally (got ${goodOrigin.status})`);

    const badOrigin = await modernCall(env, 'tools/call', { name: 'submit_research_batch', arguments: { batch_id: 'should-never-import', sources: [{ source_id: 'x' }] } }, { origin: 'https://evil.example.com' });
    assert(badOrigin.status === 403, `disallowed Origin -> 403 (got ${badOrigin.status})`);
    /* An Origin rejection is itself logged to aimt_logs (observability),
       which is fine and expected -- what must never happen is the
       request reaching any ingestion-related table. */
    const ingestionCalls = state.calls.filter((c) => /research_sources|research_claims|research_topics|research_ingestion_/.test(c.url));
    assert(ingestionCalls.length === 0, 'a rejected-Origin request never reaches any research/ingestion table (only an aimt_logs observability write, if any, is allowed)');

    // no wildcard / no permissive CORS anywhere in the response
    const badOriginRaw = await onRequestPost({
      request: makeRequest({ auth: `Bearer ${MOCK_SECRET}`, origin: 'https://evil.example.com', body: { jsonrpc: '2.0', id: 1, method: 'ping' } }),
      env
    });
    assert(!badOriginRaw.headers.get('access-control-allow-origin'), 'no Access-Control-Allow-Origin header is ever set (this is Origin validation, not CORS)');
  });
}

/* ══════════════ 16: auth ══════════════ */
async function testAuth() {
  console.log('\n--- 16: missing/invalid auth -> 401 ---');
  const env = makeEnv();
  const { mockFetch } = makeMockSupabase();
  await withMockedFetch(mockFetch, async () => {
    const noAuth = await legacyCall(env, 'initialize', { protocolVersion: '2025-06-18' }, { auth: null });
    assert(noAuth.status === 401, `missing Authorization header -> 401 (got ${noAuth.status})`);
    const badAuth = await legacyCall(env, 'initialize', { protocolVersion: '2025-06-18' }, { auth: 'Bearer wrong-secret' });
    assert(badAuth.status === 401, `wrong bearer token -> 401 (got ${badAuth.status})`);

    const getNoAuth = await onRequestGet({ request: makeRequest({ method: 'GET', auth: null }), env });
    assert(getNoAuth.status === 401, `GET with no auth -> 401 (got ${getNoAuth.status})`);
    const deleteNoAuth = await onRequestDelete({ request: makeRequest({ method: 'DELETE', auth: null }), env });
    assert(deleteNoAuth.status === 401, `DELETE with no auth -> 401 (got ${deleteNoAuth.status})`);
    const deleteWithAuth = await onRequestDelete({ request: makeRequest({ method: 'DELETE', auth: `Bearer ${MOCK_SECRET}` }), env });
    assert(deleteWithAuth.status === 405, `DELETE with valid auth -> 405, no session to terminate (got ${deleteWithAuth.status})`);
  });
}

/* ══════════════ 18: malformed tool payload does not import data (modern path) ══════════════ */
async function testMalformedPayloadModern() {
  console.log('\n--- 18: malformed tool payload does not import data (modern path) ---');
  const env = makeEnv();
  const { state, mockFetch } = makeMockSupabase();
  await withMockedFetch(mockFetch, async () => {
    const noArgs = await modernCall(env, 'tools/call', { name: 'submit_research_batch' });
    assert(noArgs.status === 200, 'malformed call still returns a well-formed response, not a crash');
    assert(noArgs.json.result.isError === true, 'missing batch_id -> tool result isError: true');
    assert(noArgs.json.result.structuredContent.error === 'batch_id_required', 'error explains batch_id is required');

    const unknownTool = await modernCall(env, 'tools/call', { name: 'delete_everything' }, { mcpNameHeader: 'delete_everything' });
    assert(unknownTool.json.error && unknownTool.json.error.code === -32602, 'unknown tool name -> JSON-RPC protocol error -32602');

    const writeUrls = state.calls.filter((c) => c.method === 'POST' && /research_sources|research_claims/.test(c.url));
    assert(writeUrls.length === 0, 'no research_sources/research_claims write was attempted for any malformed payload');
  });
}

/* ══════════════ 19: AIMT_APPROVED cannot bypass protection (modern path) ══════════════ */
async function testAimtApprovedRejectedModern() {
  console.log('\n--- 19: AIMT_APPROVED submission is quarantined, not imported, via modern tools/call ---');
  const env = makeEnv();
  const { state, mockFetch } = makeMockSupabase({ existingSourceIds: ['already-known-source'] });
  await withMockedFetch(mockFetch, async () => {
    const res = await modernCall(env, 'tools/call', {
      name: 'submit_research_batch',
      arguments: {
        batch_id: 'mcp-modern-test-aimt-approved-attempt',
        claims: [{
          claim_id: 'already-known-source--c01', source_id: 'already-known-source',
          claim_text: 'an attempted claim', record_type: 'claim', verification_status: 'AIMT_APPROVED'
        }]
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

/* ── No-data protocol smoke test ── */
async function testProtocolSmokeNoData() {
  console.log('\n--- smoke test: modern discover + tools/list, no research batch sent ---');
  const env = makeEnv();
  const { state, mockFetch } = makeMockSupabase();
  await withMockedFetch(mockFetch, async () => {
    await modernCall(env, 'server/discover', {});
    await modernCall(env, 'tools/list', {});
    const anyDbWrite = state.calls.some((c) => c.method === 'POST' || c.method === 'PATCH');
    assert(!anyDbWrite, 'server/discover + tools/list alone never touch the database (no research batch was sent)');
  });
}

/* ══════════════ OAuth: valid Supabase OAuth token + AIMT admin -> allowed ══════════════
   (functions/_lib/mcp/auth.mjs's Path B, via the canonical resolveAdmin()/
   resolveUser() helpers already used by functions/api/admin/index.js.) */
async function testOAuthAdminAllowed() {
  console.log('\n--- OAuth: valid Supabase OAuth access token + AIMT admin -> allowed ---');
  const env = makeEnv();
  const adminUserId = 'admin-user-uuid-1';
  const token = makeFakeAccessToken({ sub: adminUserId, role: 'authenticated', client_id: 'grok-client-abc' });
  const { mockFetch } = makeMockSupabase({
    oauthUsers: { [token]: { id: adminUserId, email: 'owner@aimtrichology.com' } },
    adminUsersByUserId: { [adminUserId]: { user_id: adminUserId, role: 'admin', active: true } }
  });
  await withMockedFetch(mockFetch, async () => {
    const init = await legacyCall(env, 'initialize', { protocolVersion: '2025-06-18' }, { auth: `Bearer ${token}` });
    assert(init.status === 200, `OAuth admin token -> 200 on initialize (got ${init.status})`);

    const toolCall = await modernCall(env, 'tools/call', { name: 'submit_research_batch', arguments: { batch_id: 'oauth-admin-test', sources: [], claims: [] } }, { auth: `Bearer ${token}` });
    assert(toolCall.status === 200, `OAuth admin token can call submit_research_batch (got ${toolCall.status})`);
    assert(toolCall.json.result.structuredContent.status === 'ok', 'tool call succeeds normally under OAuth admin auth');
  });
}

/* ══════════════ OAuth: authenticated but not an AIMT admin -> 403 ══════════════ */
async function testOAuthNonAdminForbidden() {
  console.log('\n--- OAuth: valid Supabase token, authenticated non-admin -> 403 ---');
  const env = makeEnv();
  const studentUserId = 'student-user-uuid-1';
  const token = makeFakeAccessToken({ sub: studentUserId, role: 'authenticated' });
  const { mockFetch } = makeMockSupabase({
    oauthUsers: { [token]: { id: studentUserId, email: 'student@example.com' } },
    adminUsersByUserId: {} // no admin_users row for this user
  });
  await withMockedFetch(mockFetch, async () => {
    const res = await legacyCall(env, 'initialize', { protocolVersion: '2025-06-18' }, { auth: `Bearer ${token}` });
    assert(res.status === 403, `authenticated non-admin OAuth token -> 403, not 401 (got ${res.status})`);
  });
}

/* ══════════════ OAuth: invalid/expired/garbage token -> 401 ══════════════ */
async function testOAuthInvalidTokenRejected() {
  console.log('\n--- OAuth: invalid/expired Supabase access token -> 401 ---');
  const env = makeEnv();
  const { mockFetch } = makeMockSupabase(); // no oauthUsers registered -> every token is "invalid"
  await withMockedFetch(mockFetch, async () => {
    const unrecognized = makeFakeAccessToken({ sub: 'nobody', role: 'authenticated' });
    const res = await legacyCall(env, 'initialize', { protocolVersion: '2025-06-18' }, { auth: `Bearer ${unrecognized}` });
    assert(res.status === 401, `unrecognized/expired OAuth token -> 401 (got ${res.status})`);

    const garbage = await legacyCall(env, 'initialize', { protocolVersion: '2025-06-18' }, { auth: 'Bearer not-even-a-jwt' });
    assert(garbage.status === 401, `garbage bearer value that also isn't the static secret -> 401 (got ${garbage.status})`);
  });
}

/* ══════════════ OAuth: the access token value is never logged ══════════════ */
async function testOAuthTokenNeverLogged() {
  console.log('\n--- OAuth: access token value never appears in a logged/persisted write ---');
  const env = makeEnv();
  const studentUserId = 'student-user-uuid-2';
  const adminUserId = 'admin-user-uuid-2';
  const nonAdminToken = makeFakeAccessToken({ sub: studentUserId, role: 'authenticated', marker: 'NON_ADMIN_TOKEN_MUST_NEVER_BE_LOGGED' });
  const adminToken = makeFakeAccessToken({ sub: adminUserId, role: 'authenticated', marker: 'ADMIN_TOKEN_MUST_NEVER_BE_LOGGED' });
  const { state, mockFetch } = makeMockSupabase({
    oauthUsers: {
      [nonAdminToken]: { id: studentUserId, email: 'student2@example.com' },
      [adminToken]: { id: adminUserId, email: 'owner2@aimtrichology.com' }
    },
    adminUsersByUserId: { [adminUserId]: { user_id: adminUserId, role: 'owner', active: true } }
  });
  await withMockedFetch(mockFetch, async () => {
    await legacyCall(env, 'initialize', { protocolVersion: '2025-06-18' }, { auth: `Bearer ${nonAdminToken}` }); // -> 403
    await legacyCall(env, 'initialize', { protocolVersion: '2025-06-18' }, { auth: `Bearer ${adminToken}` }); // -> 200
    await legacyCall(env, 'initialize', { protocolVersion: '2025-06-18' }, { auth: 'Bearer totally-invalid-value' }); // -> 401

    const aimtLogsCalls = state.calls.filter((c) => c.url.includes('/rest/v1/aimt_logs') && c.method === 'POST');
    assert(aimtLogsCalls.length > 0, 'sanity check: a rejected auth attempt actually produced at least one aimt_logs write, so the checks below are meaningful');
    for (const call of aimtLogsCalls) {
      const serialized = JSON.stringify(call.body || {});
      assert(!serialized.includes(nonAdminToken), 'aimt_logs write never contains the raw non-admin OAuth token');
      assert(!serialized.includes(adminToken), 'aimt_logs write never contains the raw admin OAuth token');
      assert(!serialized.includes('totally-invalid-value'), 'aimt_logs write never contains the raw invalid bearer value');
    }
  });
}

/* ══════════════ Optional client binding: GROK_MCP_OAUTH_CLIENT_ID ══════════════ */
async function testClientIdBinding() {
  console.log('\n--- Optional client binding: GROK_MCP_OAUTH_CLIENT_ID mismatch -> rejected when configured ---');
  const adminUserId = 'admin-user-uuid-3';
  const wrongClientToken = makeFakeAccessToken({ sub: adminUserId, role: 'authenticated', client_id: 'some-other-oauth-client' });
  const rightClientToken = makeFakeAccessToken({ sub: adminUserId, role: 'authenticated', client_id: 'grok-registered-client-id' });
  const noClientClaimToken = makeFakeAccessToken({ sub: adminUserId, role: 'authenticated' });
  const { mockFetch } = makeMockSupabase({
    oauthUsers: {
      [wrongClientToken]: { id: adminUserId, email: 'owner3@aimtrichology.com' },
      [rightClientToken]: { id: adminUserId, email: 'owner3@aimtrichology.com' },
      [noClientClaimToken]: { id: adminUserId, email: 'owner3@aimtrichology.com' }
    },
    adminUsersByUserId: { [adminUserId]: { user_id: adminUserId, role: 'owner', active: true } }
  });
  await withMockedFetch(mockFetch, async () => {
    const envWithBinding = makeEnv({ GROK_MCP_OAUTH_CLIENT_ID: 'grok-registered-client-id' });

    const wrong = await legacyCall(envWithBinding, 'initialize', { protocolVersion: '2025-06-18' }, { auth: `Bearer ${wrongClientToken}` });
    assert(wrong.status === 403, `token issued to a different OAuth client -> 403 when GROK_MCP_OAUTH_CLIENT_ID is set (got ${wrong.status})`);

    const missing = await legacyCall(envWithBinding, 'initialize', { protocolVersion: '2025-06-18' }, { auth: `Bearer ${noClientClaimToken}` });
    assert(missing.status === 403, `token with no client_id claim at all -> 403 when GROK_MCP_OAUTH_CLIENT_ID is set (got ${missing.status})`);

    const right = await legacyCall(envWithBinding, 'initialize', { protocolVersion: '2025-06-18' }, { auth: `Bearer ${rightClientToken}` });
    assert(right.status === 200, `token issued to the configured OAuth client -> allowed (got ${right.status})`);

    // Same "wrong client" token is still accepted when the var isn't set at
    // all -- the binding is opt-in and inert until GROK_MCP_OAUTH_CLIENT_ID exists.
    const envWithoutBinding = makeEnv();
    const unbound = await legacyCall(envWithoutBinding, 'initialize', { protocolVersion: '2025-06-18' }, { auth: `Bearer ${wrongClientToken}` });
    assert(unbound.status === 200, `same token is allowed when GROK_MCP_OAUTH_CLIENT_ID is not configured (got ${unbound.status})`);
  });
}

async function main() {
  await testModernDiscoverAndToolsList();
  await testModernToolCall();
  await testRequiredModernMetadata();
  await testProtocolVersionHeaderValidation();
  await testMcpMethodHeaderValidation();
  await testMcpNameHeaderValidation();
  await testUnsupportedModernVersion();
  await testLegacyInitializeAndVersionExclusion();
  await testOriginValidation();
  await testAuth();
  await testMalformedPayloadModern();
  await testAimtApprovedRejectedModern();
  await testProtocolSmokeNoData();
  await testOAuthAdminAllowed();
  await testOAuthNonAdminForbidden();
  await testOAuthInvalidTokenRejected();
  await testOAuthTokenNeverLogged();
  await testClientIdBinding();

  console.log(`\n=== ${failures === 0 ? 'ALL PASSED' : `${failures} ASSERTION(S) FAILED`} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Test run crashed:', err);
  process.exit(1);
});
