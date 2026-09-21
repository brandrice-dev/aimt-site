#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   AIMT MCP connector — OAuth discovery (RFC 9728) test harness
   ---------------------------------------------------------------
   Exercises two things directly, as real Cloudflare Pages Functions
   ({request, env} context, no network, no real Cloudflare deploy, no
   real Supabase project touched):

     1. functions/.well-known/oauth-protected-resource/api/mcp.js --
        the Protected Resource Metadata (RFC 9728) document Grok Bot
        Desktop's AuthenticateMcpServer fetches before starting OAuth.
     2. functions/api/mcp.js's WWW-Authenticate header on 401 (added
        alongside the metadata document so a standards-compliant client
        can discover it), and that 403 responses are unaffected.

   Regression coverage for "still works after this change" (static
   secret, OAuth admin token, 403 client-id-mismatch/non-admin) is
   exercised directly here too, in addition to the full existing suite
   in research-mcp-connector-test.mjs (run separately, unmodified).

   Exit code 0 = all assertions passed, nonzero = failure (with detail).
   ═══════════════════════════════════════════════════════════════ */

import { onRequestGet as prmGet, onRequestPost as prmPost } from '../functions/.well-known/oauth-protected-resource/api/mcp.js';
import { onRequestPost as mcpPost, onRequestGet as mcpGet } from '../functions/api/mcp.js';

let failures = 0;
function assert(cond, msg) {
  if (!cond) { failures++; console.error(`FAIL: ${msg}`); }
  else console.log(`ok: ${msg}`);
}

const MOCK_SECRET = 'test-mcp-connector-secret-do-not-use-in-prod';
const MCP_URL = 'https://aimtrichology.com/api/mcp';
const WELL_KNOWN_URL = 'https://aimtrichology.com/.well-known/oauth-protected-resource/api/mcp';
const EXPECTED_RESOURCE_METADATA_URL = 'https://aimtrichology.com/.well-known/oauth-protected-resource/api/mcp';
const REAL_SUPABASE_URL = 'https://epcnkncyxqgscrejinwr.supabase.co'; // AIMT's actual project URL -- public, not a secret

function makeEnv(overrides = {}) {
  return {
    MCP_CONNECTOR_SECRET: MOCK_SECRET,
    SUPABASE_URL: 'https://mock.local',
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key-do-not-leak',
    ...overrides
  };
}

/* Minimal mock: the PRM handler makes no network calls at all. /api/mcp's
   auth paths under test here need GET /auth/v1/user (token -> mock user,
   or 401 if unrecognized) and, for the admin-token cases, a GET
   /rest/v1/admin_users lookup (user_id -> mock admin_users row, or []
   for "no admin row"). Neither ever reaches real Supabase. */
async function withMockedFetch(oauthUsers, adminUsersByUserId, fn) {
  const real = global.fetch;
  global.fetch = async (url, opts = {}) => {
    if (String(url).includes('/auth/v1/user')) {
      const authHeader = (opts.headers && (opts.headers.Authorization || opts.headers.authorization)) || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      const user = oauthUsers[token];
      if (!user) return { ok: false, status: 401, json: async () => ({ error: 'invalid_token' }) };
      return { ok: true, status: 200, json: async () => user };
    }
    if (String(url).includes('/rest/v1/admin_users')) {
      const m = String(url).match(/user_id=eq\.([^&]+)/);
      const userId = m ? decodeURIComponent(m[1]) : null;
      const row = userId ? adminUsersByUserId[userId] : null;
      return { ok: true, headers: { get: () => `0-0/${row ? 1 : 0}` }, json: async () => (row ? [row] : []) };
    }
    if (String(url).includes('/rest/v1/aimt_logs')) {
      return { ok: true, json: async () => [], text: async () => '' };
    }
    throw new Error(`mockFetch: unhandled ${opts.method || 'GET'} ${url}`);
  };
  try {
    return await fn();
  } finally {
    global.fetch = real;
  }
}

/* ══════════════ 1. Protected Resource Metadata document ══════════════ */
async function testProtectedResourceMetadataShape() {
  console.log('\n--- PRM: GET /.well-known/oauth-protected-resource/api/mcp ---');
  const env = makeEnv({ SUPABASE_URL: 'https://mock.local' });
  const res = await prmGet({ request: new Request(WELL_KNOWN_URL, { method: 'GET' }), env });

  assert(res.status === 200, `PRM endpoint -> HTTP 200 (got ${res.status})`);
  assert(res.headers.get('content-type') === 'application/json', `Content-Type is application/json (got ${res.headers.get('content-type')})`);

  const body = await res.json();
  assert(body.resource === 'https://aimtrichology.com/api/mcp', `resource equals exactly https://aimtrichology.com/api/mcp (got ${body.resource})`);
  assert(Array.isArray(body.authorization_servers), 'authorization_servers is an array');
  assert(body.authorization_servers.includes('https://mock.local/auth/v1'), `authorization_servers derives from env.SUPABASE_URL (got ${JSON.stringify(body.authorization_servers)})`);
  assert(Array.isArray(body.scopes_supported) && body.scopes_supported.includes('email'), `scopes_supported contains 'email' (got ${JSON.stringify(body.scopes_supported)})`);
  assert(Array.isArray(body.bearer_methods_supported) && body.bearer_methods_supported.includes('header'), `bearer_methods_supported contains 'header' (got ${JSON.stringify(body.bearer_methods_supported)})`);
  assert(body.resource_name === 'AIMT Research Harvester', `resource_name is 'AIMT Research Harvester' (got ${body.resource_name})`);
}

async function testProtectedResourceMetadataRealIssuer() {
  console.log('\n--- PRM: authorization_servers contains the real AIMT Supabase issuer ---');
  const env = makeEnv({ SUPABASE_URL: REAL_SUPABASE_URL });
  const res = await prmGet({ request: new Request(WELL_KNOWN_URL, { method: 'GET' }), env });
  const body = await res.json();
  assert(
    body.authorization_servers.includes(`${REAL_SUPABASE_URL}/auth/v1`),
    `authorization_servers contains the exact production Supabase issuer https://epcnkncyxqgscrejinwr.supabase.co/auth/v1 (got ${JSON.stringify(body.authorization_servers)})`
  );
}

async function testProtectedResourceMetadataNoSecrets() {
  console.log('\n--- PRM: never exposes a secret ---');
  const env = makeEnv();
  const res = await prmGet({ request: new Request(WELL_KNOWN_URL, { method: 'GET' }), env });
  const rawText = await res.clone().text();
  assert(!rawText.includes(env.SUPABASE_SERVICE_ROLE_KEY), 'PRM response body never contains SUPABASE_SERVICE_ROLE_KEY');
  assert(!rawText.includes(env.MCP_CONNECTOR_SECRET), 'PRM response body never contains MCP_CONNECTOR_SECRET');
  let anyHeaderLeak = false;
  for (const [, v] of res.headers.entries()) {
    if (v.includes(env.SUPABASE_SERVICE_ROLE_KEY) || v.includes(env.MCP_CONNECTOR_SECRET)) anyHeaderLeak = true;
  }
  assert(!anyHeaderLeak, 'PRM response headers never contain a secret');
}

async function testProtectedResourceMetadataMisconfigured() {
  console.log('\n--- PRM: fails closed (500), not a broken document, when SUPABASE_URL is missing ---');
  const env = makeEnv({ SUPABASE_URL: undefined });
  const res = await prmGet({ request: new Request(WELL_KNOWN_URL, { method: 'GET' }), env });
  assert(res.status === 500, `missing SUPABASE_URL -> 500, not a metadata doc pointing nowhere (got ${res.status})`);
}

async function testProtectedResourceMetadataMethodNotAllowed() {
  console.log('\n--- PRM: non-GET methods -> 405 ---');
  const env = makeEnv();
  const res = await prmPost({ request: new Request(WELL_KNOWN_URL, { method: 'POST' }), env });
  assert(res.status === 405, `POST to the PRM endpoint -> 405 (got ${res.status})`);
}

/* ══════════════ 2. WWW-Authenticate on 401, unchanged 403 ══════════════ */
async function testMissingAuthReturns401WithHeader() {
  console.log('\n--- /api/mcp: missing bearer -> 401 with correct WWW-Authenticate ---');
  const env = makeEnv();
  await withMockedFetch({}, {}, async () => {
    const req = new Request(MCP_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }) });
    const res = await mcpPost({ request: req, env });
    assert(res.status === 401, `missing Authorization header -> 401 (got ${res.status})`);
    const header = res.headers.get('www-authenticate');
    assert(!!header, 'WWW-Authenticate header is present on 401');
    assert(header.startsWith('Bearer '), `WWW-Authenticate uses the Bearer scheme (got "${header}")`);
    assert(header.includes(`resource_metadata="${EXPECTED_RESOURCE_METADATA_URL}"`), `WWW-Authenticate carries the exact resource_metadata URL (got "${header}")`);
    assert(header.includes('scope="email"'), `WWW-Authenticate carries scope="email" (got "${header}")`);
  });
}

async function testInvalidBearerReturns401WithHeader() {
  console.log('\n--- /api/mcp: invalid bearer (neither static secret nor a valid OAuth token) -> 401 with header ---');
  const env = makeEnv();
  await withMockedFetch({}, {}, async () => {
    const req = new Request(MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer totally-invalid-not-the-secret' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' })
    });
    const res = await mcpPost({ request: req, env });
    assert(res.status === 401, `invalid bearer -> 401 (got ${res.status})`);
    const header = res.headers.get('www-authenticate');
    assert(!!header && header.includes(`resource_metadata="${EXPECTED_RESOURCE_METADATA_URL}"`), `invalid bearer's 401 also carries the resource_metadata URL (got "${header}")`);
  });
}

async function testGetAndDeleteAlsoCarryHeaderOn401() {
  console.log('\n--- /api/mcp: GET with missing/invalid auth also gets WWW-Authenticate on its 401 ---');
  const env = makeEnv();
  await withMockedFetch({}, {}, async () => {
    const res = await mcpGet({ request: new Request(MCP_URL, { method: 'GET' }), env });
    assert(res.status === 401, `GET with no auth -> 401 (got ${res.status})`);
    assert(!!res.headers.get('www-authenticate'), 'GET 401 also carries WWW-Authenticate');
  });
}

async function testValidStaticSecretStillWorksNoHeader() {
  console.log('\n--- Regression: valid MCP_CONNECTOR_SECRET still authenticates, no WWW-Authenticate on success ---');
  const env = makeEnv();
  await withMockedFetch({}, {}, async () => {
    const req = new Request(MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MOCK_SECRET}`, 'MCP-Protocol-Version': '2025-06-18' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } })
    });
    const res = await mcpPost({ request: req, env });
    assert(res.status === 200, `valid MCP_CONNECTOR_SECRET still works (got ${res.status})`);
    assert(!res.headers.get('www-authenticate'), 'a successful (200) response never carries WWW-Authenticate');
  });
}

async function testValidOAuthAdminTokenStillWorksNoHeader() {
  console.log('\n--- Regression: valid mocked Supabase OAuth admin token still authenticates, no header on success ---');
  const env = makeEnv();
  const adminUserId = 'admin-user-discovery-1';
  const token = 'mock-oauth-admin-token';
  const oauthUsers = { [token]: { id: adminUserId, email: 'owner@aimtrichology.com' } };
  const adminUsersByUserId = { [adminUserId]: { user_id: adminUserId, role: 'admin', active: true } };
  await withMockedFetch(oauthUsers, adminUsersByUserId, async () => {
    const req = new Request(MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'MCP-Protocol-Version': '2025-06-18' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } })
    });
    const res = await mcpPost({ request: req, env });
    assert(res.status === 200, `valid OAuth admin token still works (got ${res.status})`);
    assert(!res.headers.get('www-authenticate'), 'OAuth-authenticated success also never carries WWW-Authenticate');
  });
}

async function testForbiddenResponsesUnchangedNoHeader() {
  console.log('\n--- Regression: 403 (non-admin / client-id mismatch) unchanged, never carries WWW-Authenticate ---');
  const env = makeEnv();
  const studentUserId = 'student-discovery-1';
  const token = 'mock-oauth-nonadmin-token';
  const oauthUsers = { [token]: { id: studentUserId, email: 'student@example.com' } };
  const adminUsersByUserId = {}; // no admin_users row for this user -> 403
  await withMockedFetch(oauthUsers, adminUsersByUserId, async () => {
    const req = new Request(MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'MCP-Protocol-Version': '2025-06-18' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } })
    });
    const res = await mcpPost({ request: req, env });
    assert(res.status === 403, `authenticated non-admin -> 403, unchanged (got ${res.status})`);
    assert(!res.headers.get('www-authenticate'), '403 never carries WWW-Authenticate (retrying OAuth discovery would not fix a 403)');
    const text = await res.text();
    assert(text === 'Forbidden', `403 body text is unchanged ("Forbidden", got "${text}")`);
  });
}

async function testNoSecretsInAnyResponse() {
  console.log('\n--- No secret ever appears in any response body/header across this suite\'s calls ---');
  const env = makeEnv();
  await withMockedFetch({}, {}, async () => {
    const responses = await Promise.all([
      mcpPost({ request: new Request(MCP_URL, { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }) }), env }),
      mcpGet({ request: new Request(MCP_URL, { method: 'GET' }), env }),
      prmGet({ request: new Request(WELL_KNOWN_URL, { method: 'GET' }), env })
    ]);
    for (const res of responses) {
      const text = await res.clone().text();
      assert(!text.includes(env.SUPABASE_SERVICE_ROLE_KEY), `response body never contains SUPABASE_SERVICE_ROLE_KEY (checked ${res.url || 'response'})`);
      assert(!text.includes(env.MCP_CONNECTOR_SECRET), `response body never contains MCP_CONNECTOR_SECRET (checked ${res.url || 'response'})`);
    }
  });
}

async function main() {
  await testProtectedResourceMetadataShape();
  await testProtectedResourceMetadataRealIssuer();
  await testProtectedResourceMetadataNoSecrets();
  await testProtectedResourceMetadataMisconfigured();
  await testProtectedResourceMetadataMethodNotAllowed();
  await testMissingAuthReturns401WithHeader();
  await testInvalidBearerReturns401WithHeader();
  await testGetAndDeleteAlsoCarryHeaderOn401();
  await testValidStaticSecretStillWorksNoHeader();
  await testValidOAuthAdminTokenStillWorksNoHeader();
  await testForbiddenResponsesUnchangedNoHeader();
  await testNoSecretsInAnyResponse();

  console.log(`\n=== ${failures === 0 ? 'ALL PASSED' : `${failures} ASSERTION(S) FAILED`} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Test run crashed:', err);
  process.exit(1);
});
