// Coverage for the owner/admin-only System Health view
// (functions/api/admin/index.js's `?view=config-health`, backed by
// functions/_lib/admin/config-health.mjs).
//
// Same self-contained fetch-mock approach as
// tests/admin-manual-grant-invite.test.mjs: a minimal in-memory simulation
// of just the Supabase surfaces resolveAdmin() touches (/auth/v1/user,
// /rest/v1/admin_users), duplicated locally rather than imported from
// tests/admin-mvp-behavior.test.mjs (a different, concurrent workstream's
// file, per that file's own note). No network call ever leaves the
// process. Nothing here reads or asserts against a real secret value --
// every "configured" fixture below uses an obviously-fake placeholder
// string, and several tests assert those placeholders never appear
// unredacted in the response.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { onRequestGet } from '../functions/api/admin/index.js';
import { CONFIG_MANIFEST, computeConfigHealth } from '../functions/_lib/admin/config-health.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API_URL = 'https://admin.aimt.test/api/admin?view=config-health';

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function createFetchMock(state) {
  return async function fetchMock(input, options = {}) {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers || {};

    if (url.pathname === '/auth/v1/user') {
      const authHeader = headers.Authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      const user = state.tokenToUser[token];
      if (!user) return jsonResponse({ error: 'invalid token' }, 401);
      return jsonResponse(user, 200);
    }

    if (url.pathname === '/rest/v1/admin_users' && method === 'GET') {
      const userIdParam = url.searchParams.get('user_id');
      if (userIdParam) {
        const id = userIdParam.replace(/^eq\./, '');
        const row = state.adminUsers.find((r) => r.user_id === id);
        return jsonResponse(row ? [row] : []);
      }
      const count = state.adminUsers.length;
      return jsonResponse(state.adminUsers.slice(0, 1).map((r) => ({ user_id: r.user_id })), 200, {
        'content-range': `0-0/${count}`,
      });
    }

    throw new Error(`Unhandled mock fetch in admin-config-health.test.mjs: ${method} ${url.toString()}`);
  };
}

function makeRequest({ token } = {}) {
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return new Request(API_URL, { method: 'GET', headers });
}

function stateWithActor(role) {
  return {
    adminUsers: [{ user_id: 'u-actor', role, active: true }],
    tokenToUser: { 'token-actor': { id: 'u-actor', email: `${role}@aimt.test` } },
  };
}

// A fully-configured env: every manifest variable present with an
// obviously-fake placeholder value, plus the fixed Supabase vars every
// resolveAdmin() call needs regardless of this feature.
function fullEnv(overrides = {}) {
  const env = {};
  for (const entry of CONFIG_MANIFEST) {
    env[entry.name] = `fake-value-for-${entry.name.toLowerCase()}`;
  }
  // SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are also manifest entries, but
  // must additionally be real, fetch-mock-routable values -- every
  // resolveAdmin() call needs them regardless of this feature, and the
  // mock below matches on `https://fake.supabase.co`. Set after the loop
  // so these two specific overrides win over the generic placeholder.
  env.SUPABASE_URL = 'https://fake.supabase.co';
  env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-role-key';
  return { ...env, ...overrides };
}

function namesWithSeverity(sev) {
  return CONFIG_MANIFEST.filter((e) => e.severity === sev).map((e) => e.name);
}

async function callConfigHealth(env, token) {
  return onRequestGet({ request: makeRequest({ token }), env });
}

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

test('unauthenticated caller cannot read config health', async (t) => {
  const state = stateWithActor('owner');
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const res = await callConfigHealth(fullEnv());
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.status, undefined, 'no health payload on an unauthenticated request');
});

test('support role cannot read config health, even though support can read other admin views', async (t) => {
  const state = stateWithActor('support');
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const res = await callConfigHealth(fullEnv(), 'token-actor');
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.match(data.error, /owner or admin/i);
  assert.equal(data.status, undefined);
  assert.equal(data.checks, undefined, 'a rejected support-role request must carry zero configuration data');
});

test('owner can read config health', async (t) => {
  const state = stateWithActor('owner');
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const res = await callConfigHealth(fullEnv(), 'token-actor');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.status);
  assert.ok(Array.isArray(data.checks));
});

test('admin can read config health', async (t) => {
  const state = stateWithActor('admin');
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const res = await callConfigHealth(fullEnv(), 'token-actor');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.status);
});

// ---------------------------------------------------------------------------
// Status logic (unit-level, against computeConfigHealth directly -- no
// network/auth involved, so these exercise the pure decision table)
// ---------------------------------------------------------------------------

test('all P0 and P1 required variables present -> healthy', () => {
  const result = computeConfigHealth(fullEnv());
  assert.equal(result.status, 'healthy');
  assert.equal(result.p0_missing, 0);
  assert.equal(result.p1_missing, 0);
});

test('any P0 missing -> critical, regardless of P1/P2 state', () => {
  const [firstP0] = namesWithSeverity('P0');
  const env = fullEnv({ [firstP0]: undefined });
  const result = computeConfigHealth(env);
  assert.equal(result.status, 'critical');
  assert.equal(result.p0_missing, 1);
});

test('all P0 present but a P1 required-for-feature variable missing -> degraded, not critical', () => {
  const [firstP1] = namesWithSeverity('P1');
  const env = fullEnv({ [firstP1]: undefined });
  const result = computeConfigHealth(env);
  assert.equal(result.status, 'degraded');
  assert.equal(result.p0_missing, 0);
  assert.equal(result.p1_missing, 1);
});

test('P2 optional/conditional variables missing never lower overall status', () => {
  const env = fullEnv();
  for (const name of namesWithSeverity('P2')) env[name] = undefined;
  const result = computeConfigHealth(env);
  assert.equal(result.status, 'healthy', 'every P2 var absent must still report healthy when all P0/P1 are present');
  assert.equal(result.p0_missing, 0);
  assert.equal(result.p1_missing, 0);
  const p2Checks = result.checks.filter((c) => c.severity === 'P2');
  assert.ok(p2Checks.every((c) => c.configured === false));
});

test('CADENCE_CHAT_MODEL and CADENCE_GRADING_MODEL missing specifically are reported but not treated as unhealthy', () => {
  const env = fullEnv({ CADENCE_CHAT_MODEL: undefined, CADENCE_GRADING_MODEL: undefined });
  const result = computeConfigHealth(env);
  assert.equal(result.status, 'healthy');
  const chat = result.checks.find((c) => c.name === 'CADENCE_CHAT_MODEL');
  const grading = result.checks.find((c) => c.name === 'CADENCE_GRADING_MODEL');
  assert.equal(chat.configured, false);
  assert.equal(chat.severity, 'P2');
  assert.equal(grading.configured, false);
  assert.equal(grading.severity, 'P2');
});

test('empty-string and whitespace-only values are treated as not configured', () => {
  const [name] = namesWithSeverity('P1');
  const empty = computeConfigHealth(fullEnv({ [name]: '' }));
  const whitespace = computeConfigHealth(fullEnv({ [name]: '   ' }));
  assert.equal(empty.checks.find((c) => c.name === name).configured, false);
  assert.equal(whitespace.checks.find((c) => c.name === name).configured, false);
});

// ---------------------------------------------------------------------------
// Secret containment
// ---------------------------------------------------------------------------

test('response never contains any provided secret value', async (t) => {
  const state = stateWithActor('owner');
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = fullEnv();
  const res = await callConfigHealth(env, 'token-actor');
  const raw = await res.text();
  for (const entry of CONFIG_MANIFEST) {
    assert.doesNotMatch(raw, new RegExp(`fake-value-for-${entry.name.toLowerCase()}`), `${entry.name}'s fixture value must never appear in the response body`);
  }
  assert.doesNotMatch(raw, /fake-service-role-key/);
});

test('response contains no length/prefix/suffix/hash-shaped fields for any check', async (t) => {
  const state = stateWithActor('owner');
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const res = await callConfigHealth(fullEnv(), 'token-actor');
  const data = await res.json();
  for (const check of data.checks) {
    const keys = Object.keys(check);
    assert.deepEqual(keys.sort(), ['configured', 'description', 'feature', 'name', 'requirement', 'severity'].sort());
    assert.equal(typeof check.configured, 'boolean');
  }
});

test('response contains variable names only -- every manifest entry name appears, count matches exactly', async (t) => {
  const state = stateWithActor('owner');
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const res = await callConfigHealth(fullEnv(), 'token-actor');
  const data = await res.json();
  assert.equal(data.checks.length, CONFIG_MANIFEST.length);
  const returnedNames = data.checks.map((c) => c.name).sort();
  const manifestNames = CONFIG_MANIFEST.map((e) => e.name).sort();
  assert.deepEqual(returnedNames, manifestNames);
});

test('computeConfigHealth never touches env keys outside the manifest, even if extra secrets exist in env', () => {
  const env = fullEnv({ SOME_UNRELATED_SECRET: 'should-never-appear', ANOTHER_TOKEN: 'also-never' });
  const result = computeConfigHealth(env);
  const raw = JSON.stringify(result);
  assert.doesNotMatch(raw, /should-never-appear|also-never|SOME_UNRELATED_SECRET|ANOTHER_TOKEN/);
});

// ---------------------------------------------------------------------------
// admin.html UI
// ---------------------------------------------------------------------------

test('admin.html has a System Health nav entry and renders Configured/Missing from the check list', () => {
  const html = readFileSync(path.join(REPO_ROOT, 'admin.html'), 'utf8');
  assert.match(html, /data-view="config-health"/);
  assert.match(html, /view=config-health/);
  assert.match(html, /id="view-config-health"/);
  assert.match(html, /'Configured':'Missing'|"Configured":"Missing"|configured\?'Configured':'Missing'/);
  assert.match(html, /aimt-site Production runtime only/);
});

test('admin.html hides the System Health nav entry for the support role', () => {
  const html = readFileSync(path.join(REPO_ROOT, 'admin.html'), 'utf8');
  assert.match(html, /healthNavBtn.*style\.display=actor\.role!=='support'/);
});

test('admin.html groups checks by severity into the three named sections', () => {
  const html = readFileSync(path.join(REPO_ROOT, 'admin.html'), 'utf8');
  assert.match(html, /Core production/);
  assert.match(html, /Major features/);
  assert.match(html, /Optional \/ conditional/);
});

test('no browser-shipped file contains a real-looking configured secret value (only manifest variable NAMES may appear)', () => {
  const filesToCheck = ['admin.html', 'student-access.html', 'headspa-mastery.html', 'success.html'];
  for (const file of filesToCheck) {
    const contents = readFileSync(path.join(REPO_ROOT, file), 'utf8');
    assert.doesNotMatch(contents, /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][^'"]/, `${file} must never assign a value to the service-role key name`);
    assert.doesNotMatch(contents, /ANTHROPIC_API_KEY\s*[:=]\s*['"][^'"]/, `${file} must never assign a value to the Anthropic key name`);
    assert.doesNotMatch(contents, /STRIPE_SECRET_KEY\s*[:=]\s*['"][^'"]/, `${file} must never assign a value to the Stripe secret key name`);
  }
});

// ---------------------------------------------------------------------------
// Sanity: config-health.mjs matches the exact P0/P1/P2 sets specified
// ---------------------------------------------------------------------------

test('manifest P0/P1/P2 membership matches the specified inventory exactly', () => {
  assert.deepEqual(
    namesWithSeverity('P0').sort(),
    ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ANTHROPIC_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_ID'].sort()
  );
  assert.deepEqual(
    namesWithSeverity('P1').sort(),
    ['RESEND_API_KEY', 'ELEVENLABS_API_KEY', 'RESEARCH_INGEST_SECRET', 'RESEARCH_QUERY_SECRET'].sort()
  );
  assert.deepEqual(
    namesWithSeverity('P2').sort(),
    ['AIMT_OWNER_EMAIL', 'MCP_CONNECTOR_SECRET', 'GROK_MCP_OAUTH_CLIENT_ID', 'CADENCE_CHAT_MODEL', 'CADENCE_GRADING_MODEL'].sort()
  );
});

test('no real network call is made anywhere in this file -- every fetch is routed through the in-process mock', async (t) => {
  const state = stateWithActor('owner');
  const seenUrls = [];
  t.mock.method(globalThis, 'fetch', async (...args) => {
    seenUrls.push(typeof args[0] === 'string' ? args[0] : args[0].url);
    return createFetchMock(state)(...args);
  });
  await callConfigHealth(fullEnv(), 'token-actor');
  for (const url of seenUrls) {
    assert.ok(url.startsWith('https://fake.supabase.co/'), `unexpected fetch target: ${url}`);
  }
});
