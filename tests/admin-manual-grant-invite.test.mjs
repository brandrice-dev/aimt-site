// Coverage for the manual-grant invite email (item 7 of
// docs/stripe-and-email/AIMT-STRIPE-EMAIL-BRANDING-AUDIT-2026-09-15.md):
// grantAccess() in functions/api/admin/index.js now sends a branded Resend
// invite when — and only when — it creates a brand-new Auth account.
//
// Deliberately a SEPARATE file from tests/admin-mvp.test.mjs and
// tests/admin-mvp-behavior.test.mjs (owned by a different, concurrent
// workstream) rather than folding into either of them. This file builds its
// own small fetch mock (Supabase REST/Auth Admin + Resend's /emails
// endpoint) following the same t.mock.method(globalThis, 'fetch', ...)
// approach admin-mvp-behavior.test.mjs already uses, so it exercises the
// real onRequestPost/grantAccess handlers end-to-end. No network call ever
// leaves the process — every fetch is mocked, including Resend's — and no
// real email is sent anywhere in this file.

import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestPost } from '../functions/api/admin/index.js';
import { sendManualGrantInviteEmail, manualGrantInviteIdempotencyKey } from '../functions/_lib/admin/manual-grant-invite-email.mjs';

const API_URL = 'https://admin.aimt.test/api/admin';
const RESEND_URL = 'https://api.resend.com/emails';

function makeState(overrides = {}) {
  return {
    adminUsers: [],
    authUsers: [],
    entitlements: [],
    auditLog: [],
    tokenToUser: {},
    calls: [],
    resendCalls: [],
    resendBehavior: 'success', // 'success' | 'fail' | 'throw'
    ...overrides,
  };
}

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

// Mocks just enough of Supabase's REST/Auth Admin surface (mirroring the
// pattern in tests/admin-mvp-behavior.test.mjs) plus Resend's /emails POST,
// so grantAccess()'s real code path — including the new invite-email step —
// runs against a fully in-memory fake, never a live network call.
function createFetchMock(state) {
  return async function fetchMock(input, options = {}) {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers || {};
    state.calls.push({ url: url.toString(), pathname: url.pathname, method, body: options.body || null });

    if (url.toString().startsWith(RESEND_URL)) {
      state.resendCalls.push({ headers, body: options.body ? JSON.parse(options.body) : null });
      if (state.resendBehavior === 'throw') throw new Error('simulated network failure');
      if (state.resendBehavior === 'fail') {
        return jsonResponse({ message: 'simulated Resend rejection' }, 422);
      }
      return jsonResponse({ id: `resend-${state.resendCalls.length}` }, 200);
    }

    if (url.pathname === '/auth/v1/user') {
      const authHeader = headers.Authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      const user = state.tokenToUser[token];
      if (!user) return jsonResponse({ error: 'invalid token' }, 401);
      return jsonResponse(user, 200);
    }

    if (url.pathname === '/rest/v1/admin_users') {
      if (method === 'GET') {
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
      if (method === 'POST') {
        const row = { active: true, ...JSON.parse(options.body) };
        state.adminUsers.push(row);
        return jsonResponse([row], 201);
      }
    }

    if (url.pathname === '/rest/v1/admin_audit_log') {
      if (method === 'POST') {
        const row = { created_at: new Date().toISOString(), id: `audit-${state.auditLog.length + 1}`, ...JSON.parse(options.body) };
        state.auditLog.push(row);
        return jsonResponse(undefined, 201);
      }
      if (method === 'GET') {
        let rows = state.auditLog;
        const actionFilter = url.searchParams.get('action');
        if (actionFilter) {
          const action = actionFilter.replace(/^eq\./, '');
          rows = rows.filter((r) => r.action === action);
        }
        return jsonResponse(rows);
      }
    }

    if (url.pathname === '/auth/v1/admin/users' && method === 'GET') {
      return jsonResponse({ users: state.authUsers });
    }
    if (url.pathname === '/auth/v1/admin/users' && method === 'POST') {
      const payload = JSON.parse(options.body);
      const newUser = {
        id: `user-${state.authUsers.length + 1}-${Math.random().toString(36).slice(2, 8)}`,
        email: payload.email,
        user_metadata: payload.user_metadata || {},
        created_at: new Date().toISOString(),
        last_sign_in_at: null,
      };
      state.authUsers.push(newUser);
      return jsonResponse(newUser, 200);
    }
    if (url.pathname.startsWith('/auth/v1/admin/users/')) {
      const id = decodeURIComponent(url.pathname.split('/').pop());
      const user = state.authUsers.find((u) => u.id === id);
      return user ? jsonResponse(user) : jsonResponse({ error: 'not found' }, 404);
    }

    if (url.pathname === '/rest/v1/course_entitlements') {
      if (method === 'GET') {
        let rows = state.entitlements;
        const idFilter = url.searchParams.get('checkout_session_id');
        if (idFilter) {
          const id = idFilter.replace(/^eq\./, '');
          rows = rows.filter((r) => r.checkout_session_id === id);
        }
        const emailFilter = url.searchParams.get('purchaser_email');
        if (emailFilter) {
          const email = emailFilter.replace(/^eq\./, '');
          rows = rows.filter((r) => r.purchaser_email === email);
        }
        return jsonResponse(rows);
      }
      if (method === 'POST') {
        const row = { granted_at: new Date().toISOString(), ...JSON.parse(options.body) };
        state.entitlements.push(row);
        return jsonResponse([row], 201);
      }
    }

    if (url.pathname.startsWith('/rest/v1/') && method === 'GET') {
      return jsonResponse([]);
    }

    throw new Error(`Unhandled mock fetch: ${method} ${url.toString()}`);
  };
}

function makeEnv(overrides = {}) {
  return {
    SUPABASE_URL: 'https://fake.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'fake-service-role-key',
    AIMT_OWNER_EMAIL: 'owner@aimt.test',
    ...overrides,
  };
}

function makeRequest(url, { method = 'GET', token, body } = {}) {
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const init = { method, headers };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers.set('Content-Type', 'application/json');
  }
  return new Request(url, init);
}

function ownerState(overrides = {}) {
  return makeState({
    adminUsers: [{ user_id: 'u-owner', role: 'owner', active: true }],
    tokenToUser: { 'token-owner': { id: 'u-owner', email: 'owner@aimt.test' } },
    ...overrides,
  });
}

// Same shape as touchedProtectedTables() in tests/admin-mvp-behavior.test.mjs
// — duplicated locally rather than imported, since that file is owned by a
// different workstream and is not touched or exported from here.
function touchedProtectedTables(state) {
  return state.calls.filter((c) =>
    ['/rest/v1/course_progress', '/rest/v1/certification_attempts', '/rest/v1/completions'].includes(c.pathname)
  );
}

async function grantNewAccount(state, env, overrides = {}) {
  return onRequestPost({
    request: makeRequest(API_URL, {
      method: 'POST',
      token: 'token-owner',
      body: { action: 'grant_access', email: 'new.student@example.com', firstName: 'New', source: 'staff', ...overrides },
    }),
    env,
  });
}

// ---------------------------------------------------------------------------

test('new account grant sends exactly one invite email with the deterministic admin-grant/<grantId> idempotency key', async (t) => {
  const state = ownerState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  const res = await grantNewAccount(state, env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.accountCreated, true);
  assert.ok(data.inviteEmail);
  assert.equal(data.inviteEmail.attempted, true);
  assert.equal(data.inviteEmail.sent, true);
  assert.equal(data.inviteEmail.idempotencyKey, manualGrantInviteIdempotencyKey(data.grantId));
  assert.equal(data.inviteEmail.idempotencyKey, `admin-grant/${data.grantId}`);

  assert.equal(state.resendCalls.length, 1, 'exactly one Resend send for one new-account grant');
  const sent = state.resendCalls[0];
  assert.equal(sent.body.to[0], 'new.student@example.com');
  assert.equal(sent.body.reply_to, 'support@aimtrichology.com');
  assert.match(sent.body.from, /auth\.aimtrichology\.com/);
  assert.equal(sent.headers.Authorization, 'Bearer re_test_123');
  assert.equal(sent.headers['Idempotency-Key'], data.inviteEmail.idempotencyKey);
  assert.match(sent.body.html, /Welcome to AIMT, New/);
  assert.match(sent.body.html, /student-access\.html/);

  // Exactly one admin_audit_log row for the whole grant — the invite result
  // is folded into it, not written as a second row (see module header notes
  // in functions/_lib/admin/manual-grant-invite-email.mjs for why: keeping
  // row-count invariants intact matters because a different, concurrent
  // workstream's tests assert exact audit-log counts per grant call).
  assert.equal(state.auditLog.length, 1);
  assert.equal(state.auditLog[0].action, 'grant_course_access');
  assert.ok(state.auditLog[0].details.inviteEmail);
  assert.equal(state.auditLog[0].details.inviteEmail.sent, true);
  assert.equal(state.auditLog[0].details.inviteEmail.idempotencyKey, data.inviteEmail.idempotencyKey);
});

test('granting access to an existing account never sends a new-account invite', async (t) => {
  const state = ownerState({
    authUsers: [{ id: 'u-existing', email: 'existing@example.com', user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }],
  });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  const res = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'grant_access', email: 'existing@example.com', source: 'staff' } }),
    env,
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.accountCreated, false);
  assert.equal(data.inviteEmail, null);

  assert.equal(state.resendCalls.length, 0, 'no invite email for a grant that bound to an existing account');
  assert.equal(state.auditLog.length, 1);
  assert.equal(state.auditLog[0].details.inviteEmail, null);
});

test('retrying the exact same idempotency key never sends a duplicate email', async (t) => {
  // A real grantAccess() call always mints a fresh grantId (crypto.randomUUID()
  // per call), so within the full admin API a genuine key collision can only
  // happen if the send is invoked twice with the same key directly — exactly
  // what this test does, simulating a retried send for one already-recorded
  // grant event (the same admin_audit_log row grantAccess would have written
  // after the first successful send).
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  const params = {
    grantId: 'admin-grant-staff-fixed-test-id',
    email: 'retry@example.com',
    firstName: 'Retry',
    studentAccessUrl: 'https://aimtrichology.com/student-access.html',
  };

  const first = await sendManualGrantInviteEmail(env, params);
  assert.equal(first.sent, true);
  assert.equal(state.resendCalls.length, 1);

  // Simulate the admin_audit_log row grantAccess() would have persisted for
  // that first send.
  state.auditLog.push({
    action: 'grant_course_access',
    details: { grantId: params.grantId, accountCreated: true, inviteEmail: first },
  });

  const second = await sendManualGrantInviteEmail(env, params);
  assert.equal(second.sent, true);
  assert.equal(second.deduped, true);
  assert.equal(second.attempted, false);
  assert.equal(state.resendCalls.length, 1, 'no duplicate Resend call for a repeated idempotency key');
});

test('missing RESEND_API_KEY is handled safely — entitlement is still created, no send is attempted', async (t) => {
  const state = ownerState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv(); // no RESEND_API_KEY

  const res = await grantNewAccount(state, env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.accountCreated, true);
  assert.equal(data.inviteEmail.attempted, false);
  assert.equal(data.inviteEmail.sent, false);
  assert.equal(data.inviteEmail.reason, 'missing_api_key');
  assert.ok(data.inviteEmail.warning);

  assert.equal(state.entitlements.length, 1, 'entitlement must still be created without an API key');
  assert.equal(state.resendCalls.length, 0);
  assert.equal(state.auditLog.length, 1);
  assert.equal(state.auditLog[0].details.inviteEmail.reason, 'missing_api_key');
});

test('a failed Resend send preserves the entitlement and surfaces a warning in the response and audit log', async (t) => {
  const state = ownerState({ resendBehavior: 'fail' });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  const res = await grantNewAccount(state, env);
  assert.equal(res.status, 200, 'the grant itself must succeed even though the send failed');
  const data = await res.json();
  assert.equal(data.accountCreated, true);
  assert.equal(data.inviteEmail.attempted, true);
  assert.equal(data.inviteEmail.sent, false);
  assert.equal(data.inviteEmail.reason, 'resend_error');
  assert.equal(data.inviteEmail.status, 422);
  assert.ok(data.inviteEmail.warning);

  assert.equal(state.entitlements.length, 1, 'entitlement must be preserved after a failed send');
  assert.equal(state.resendCalls.length, 1);
  assert.equal(state.auditLog.length, 1);
  assert.equal(state.auditLog[0].details.inviteEmail.sent, false);
  assert.ok(state.auditLog[0].details.inviteEmail.warning);
});

test('a network-level throw from the send attempt also preserves the entitlement and is caught, not raised', async (t) => {
  const state = ownerState({ resendBehavior: 'throw' });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  const res = await grantNewAccount(state, env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.accountCreated, true);
  assert.equal(data.inviteEmail.sent, false);
  assert.equal(data.inviteEmail.reason, 'network_error');
  assert.equal(state.entitlements.length, 1);
});

test('a support-role actor still cannot call grant_access at all — existing guard, unchanged, no invite side effects', async (t) => {
  const state = makeState({
    adminUsers: [{ user_id: 'u-support', role: 'support', active: true }],
    tokenToUser: { 'token-support': { id: 'u-support', email: 'support@aimt.test' } },
  });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  const res = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-support', body: { action: 'grant_access', email: 'blocked@example.com', source: 'staff' } }),
    env,
  });
  assert.equal(res.status, 403);
  assert.equal(state.authUsers.length, 0);
  assert.equal(state.entitlements.length, 0);
  assert.equal(state.resendCalls.length, 0, 'a rejected grant must never attempt to send an invite');
  assert.equal(state.auditLog.length, 0);
});

test('the manual grant + invite flow never touches course_progress, completions, or certification_attempts', async (t) => {
  const state = ownerState({ resendBehavior: 'fail' });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  await grantNewAccount(state, env);
  assert.deepEqual(touchedProtectedTables(state), []);
});

test('no real network call is made anywhere in this file — every fetch is routed through the in-process mock', async (t) => {
  const state = ownerState();
  const seenUrls = [];
  t.mock.method(globalThis, 'fetch', async (...args) => {
    seenUrls.push(typeof args[0] === 'string' ? args[0] : args[0].url);
    return createFetchMock(state)(...args);
  });
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  await grantNewAccount(state, env);
  for (const url of seenUrls) {
    assert.ok(
      url.startsWith('https://fake.supabase.co/') || url.startsWith(RESEND_URL),
      `unexpected fetch target: ${url}`
    );
  }
});
