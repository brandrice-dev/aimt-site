// Behavioral (execution) coverage for the AIMT Admin MVP, complementing the
// static/regex checks in tests/admin-mvp.test.mjs.
//
// These tests import and RUN the real Cloudflare Pages Function handlers
// (functions/api/admin/index.js, functions/_lib/admin/auth.mjs) against a
// mocked `fetch` that simulates Supabase's REST + Auth Admin HTTP surface.
// No source files are modified and no network call ever leaves the process —
// this is not a live Supabase integration test. It exercises the exact
// exported entry points (`onRequestGet`, `onRequestPost`, `resolveAdmin`)
// with crafted Request/env objects, which lets us assert real behavior
// (status codes, database mutations, audit rows) instead of only checking
// that certain substrings exist in the source text.
//
// Scope: authorization/role boundaries, owner bootstrap, manual enrollment
// (including duplicate-grant and existing-Stripe-entitlement scenarios),
// revoke protections, and audit-log completeness. Read-heavy views
// (dashboard/students/student detail) are intentionally left to the
// existing static suite plus manual QA — see the audit doc.

import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestGet, onRequestPost } from '../functions/api/admin/index.js';
import { resolveAdmin } from '../functions/_lib/admin/auth.mjs';

const API_URL = 'https://admin.aimt.test/api/admin';

function makeState(overrides = {}) {
  return {
    adminUsers: [],
    authUsers: [],
    entitlements: [],
    auditLog: [],
    tokenToUser: {},
    calls: [],
    ...overrides,
  };
}

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/**
 * Builds a fetch() replacement that simulates just enough of Supabase's
 * REST (PostgREST) and Auth Admin HTTP surface for the admin handlers to
 * run against. Every call is recorded on `state.calls` so tests can assert
 * on exactly which endpoints were (or were not) touched.
 */
function createFetchMock(state) {
  return async function fetchMock(input, options = {}) {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers || {};
    state.calls.push({ url: url.toString(), pathname: url.pathname, method, body: options.body || null });

    // ── Supabase Auth: resolve caller identity from their own bearer token ──
    if (url.pathname === '/auth/v1/user') {
      const authHeader = headers.Authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      const user = state.tokenToUser[token];
      if (!user) return jsonResponse({ error: 'invalid token' }, 401);
      return jsonResponse(user, 200);
    }

    // ── admin_users (service role) ──
    if (url.pathname === '/rest/v1/admin_users') {
      if (method === 'GET') {
        const userIdParam = url.searchParams.get('user_id');
        if (userIdParam) {
          const id = userIdParam.replace(/^eq\./, '');
          const row = state.adminUsers.find((r) => r.user_id === id);
          return jsonResponse(row ? [row] : []);
        }
        // countAdminRows: select=user_id&limit=1 with Prefer: count=exact
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

    // ── admin_audit_log (service role) — write, plus the minimal read support
    // reactivateManualAccess and (untested-elsewhere) handleAudit need ──
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

    // ── Supabase Auth Admin: list/create/read users ──
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

    // ── course_entitlements ──
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
        const courseFilter = url.searchParams.get('course_slug');
        if (courseFilter) {
          const slug = courseFilter.replace(/^eq\./, '');
          rows = rows.filter((r) => r.course_slug === slug);
        }
        // Minimal support for the "or=(user_id.eq.X,purchaser_email.eq.Y)" shape
        // used by handleStudent/reactivateManualAccess — enough to exercise real
        // identity scoping in tests without implementing full PostgREST or= syntax.
        const orFilter = url.searchParams.get('or');
        if (orFilter) {
          const clauses = orFilter.replace(/^\(|\)$/g, '').split(',');
          rows = rows.filter((r) => clauses.some((clause) => {
            const match = clause.match(/^([^.]+)\.[^.]+\.(.*)$/);
            if (!match) return false;
            return String(r[match[1]]) === match[2];
          }));
        }
        return jsonResponse(rows);
      }
      if (method === 'POST') {
        const row = { granted_at: new Date().toISOString(), ...JSON.parse(options.body) };
        state.entitlements.push(row);
        return jsonResponse([row], 201);
      }
      if (method === 'DELETE') {
        const idFilter = url.searchParams.get('checkout_session_id');
        const id = (idFilter || '').replace(/^eq\./, '');
        state.entitlements = state.entitlements.filter((r) => r.checkout_session_id !== id);
        return new Response(null, { status: 204 });
      }
    }

    // Any other read (course_progress, completions, certification_attempts,
    // certification_review_requests, certification_educator_requests,
    // certification_remediation_assignments, etc.) used by dashboard/student
    // views — default to an empty result set unless a test overrides it.
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

function touchedProtectedTables(state) {
  return state.calls.filter((c) =>
    ['/rest/v1/course_progress', '/rest/v1/certification_attempts', '/rest/v1/completions'].includes(c.pathname)
  );
}

// ---------------------------------------------------------------------------
// Authorization / role boundaries
// ---------------------------------------------------------------------------

test('unauthenticated /api/admin request returns 401', async (t) => {
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const res = await onRequestGet({ request: makeRequest(`${API_URL}?view=me`), env });
  assert.equal(res.status, 401);
});

test('authenticated caller with no admin row and no bootstrap match returns 403', async (t) => {
  const state = makeState({
    adminUsers: [{ user_id: 'someone-else', role: 'owner', active: true }],
    tokenToUser: { 'token-student': { id: 'u-student', email: 'student@example.com' } },
  });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const res = await onRequestGet({ request: makeRequest(`${API_URL}?view=me`, { token: 'token-student' }), env });
  assert.equal(res.status, 403);
});

test('owner bootstrap succeeds only when admin_users is empty and email matches AIMT_OWNER_EMAIL', async (t) => {
  const state = makeState({
    tokenToUser: { 'token-owner': { id: 'u-owner', email: 'owner@aimt.test' } },
  });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ AIMT_OWNER_EMAIL: 'owner@aimt.test' });

  const result = await resolveAdmin(env, makeRequest(API_URL, { token: 'token-owner' }));
  assert.equal(result.errorResponse, undefined);
  assert.equal(result.admin.role, 'owner');
  assert.equal(result.admin.active, true);
  assert.equal(state.adminUsers.length, 1);
  assert.equal(state.adminUsers[0].user_id, 'u-owner');
});

test('owner bootstrap is refused when admin_users already has rows, even with a matching email', async (t) => {
  const state = makeState({
    adminUsers: [{ user_id: 'existing-owner', role: 'owner', active: true }],
    tokenToUser: { 'token-owner': { id: 'u-owner-2', email: 'owner@aimt.test' } },
  });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ AIMT_OWNER_EMAIL: 'owner@aimt.test' });

  const result = await resolveAdmin(env, makeRequest(API_URL, { token: 'token-owner' }));
  assert.ok(result.errorResponse);
  assert.equal(result.errorResponse.status, 403);
  // No second admin row should have been created.
  assert.equal(state.adminUsers.length, 1);
});

test('owner bootstrap is refused when the caller email does not match AIMT_OWNER_EMAIL', async (t) => {
  const state = makeState({
    tokenToUser: { 'token-imposter': { id: 'u-imposter', email: 'not-the-owner@example.com' } },
  });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ AIMT_OWNER_EMAIL: 'owner@aimt.test' });

  const result = await resolveAdmin(env, makeRequest(API_URL, { token: 'token-imposter' }));
  assert.ok(result.errorResponse);
  assert.equal(result.errorResponse.status, 403);
  assert.equal(state.adminUsers.length, 0, 'bootstrap must not create a row for a non-matching email');
  const adminUsersPosts = state.calls.filter((c) => c.pathname === '/rest/v1/admin_users' && c.method === 'POST');
  assert.equal(adminUsersPosts.length, 0);
});

test('an inactive admin row is rejected even though it resolves', async (t) => {
  const state = makeState({
    adminUsers: [{ user_id: 'u-inactive', role: 'admin', active: false }],
    tokenToUser: { 'token-inactive': { id: 'u-inactive', email: 'former-admin@aimt.test' } },
  });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const result = await resolveAdmin(env, makeRequest(API_URL, { token: 'token-inactive' }));
  assert.ok(result.errorResponse);
  assert.equal(result.errorResponse.status, 403);
});

test('support role can read (view=me) but cannot grant or revoke access', async (t) => {
  const state = makeState({
    adminUsers: [{ user_id: 'u-support', role: 'support', active: true }],
    tokenToUser: { 'token-support': { id: 'u-support', email: 'support@aimt.test' } },
    entitlements: [{ checkout_session_id: 'admin-grant-staff-keep-me', course_slug: 'headspa-mastery', purchaser_email: 'x@example.com', user_id: 'u-x' }],
  });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const meRes = await onRequestGet({ request: makeRequest(`${API_URL}?view=me`, { token: 'token-support' }), env });
  assert.equal(meRes.status, 200);
  const me = await meRes.json();
  assert.equal(me.actor.role, 'support');

  const grantRes = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-support', body: { action: 'grant_access', email: 'blocked@example.com', source: 'staff' } }),
    env,
  });
  assert.equal(grantRes.status, 403);
  assert.equal(state.authUsers.length, 0, 'support role must not be able to create an account via grant');
  assert.equal(state.entitlements.length, 1, 'no entitlement should have been added');

  const revokeRes = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-support', body: { action: 'revoke_manual_access', grantId: 'admin-grant-staff-keep-me' } }),
    env,
  });
  assert.equal(revokeRes.status, 403);
  assert.equal(state.entitlements.length, 1, 'support role must not be able to revoke access');
  assert.equal(state.auditLog.length, 0, 'no privileged action should have been logged for a rejected support call');
});

// ---------------------------------------------------------------------------
// Manual enrollment (grant_access)
// ---------------------------------------------------------------------------

function ownerState(overrides = {}) {
  return makeState({
    adminUsers: [{ user_id: 'u-owner', role: 'owner', active: true }],
    tokenToUser: { 'token-owner': { id: 'u-owner', email: 'owner@aimt.test' } },
    ...overrides,
  });
}

test('grant_access creates a new account, entitlement, and complete audit row', async (t) => {
  const state = ownerState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const res = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'grant_access', email: 'New.Student@Example.com', firstName: 'New', lastName: 'Student', source: 'staff' } }),
    env,
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.accountCreated, true);
  assert.match(data.grantId, /^admin-grant-staff-/);

  assert.equal(state.authUsers.length, 1);
  assert.equal(state.authUsers[0].email, 'new.student@example.com');

  assert.equal(state.entitlements.length, 1);
  const grant = state.entitlements[0];
  assert.equal(grant.checkout_session_id, data.grantId);
  assert.equal(grant.course_slug, 'headspa-mastery');
  assert.equal(grant.purchaser_email, 'new.student@example.com');
  assert.equal(grant.user_id, state.authUsers[0].id);

  assert.equal(state.auditLog.length, 1);
  const audit = state.auditLog[0];
  assert.equal(audit.action, 'grant_course_access');
  assert.equal(audit.actor_user_id, 'u-owner');
  assert.equal(audit.actor_email, 'owner@aimt.test');
  assert.equal(audit.actor_role, 'owner');
  assert.equal(audit.target_user_id, state.authUsers[0].id);
  assert.equal(audit.target_email, 'new.student@example.com');
  assert.equal(audit.course_slug, 'headspa-mastery');
  assert.ok(audit.details && audit.details.source === 'staff' && audit.details.grantId === data.grantId);

  assert.deepEqual(touchedProtectedTables(state), [], 'grant must never touch course_progress/certification_attempts/completions');
});

test('granting the same email twice reuses the existing account and does not clobber the first grant', async (t) => {
  const state = ownerState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const first = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'grant_access', email: 'twice@example.com', source: 'staff' } }),
    env,
  });
  const firstData = await first.json();
  assert.equal(firstData.accountCreated, true);

  const second = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'grant_access', email: 'twice@example.com', source: 'complimentary' } }),
    env,
  });
  assert.equal(second.status, 200);
  const secondData = await second.json();
  assert.equal(secondData.accountCreated, false, 'second grant must bind to the existing account, not create a duplicate one');
  assert.notEqual(secondData.grantId, firstData.grantId);

  assert.equal(state.authUsers.length, 1, 'only one AIMT account should exist for the email');
  assert.equal(state.entitlements.length, 2, 'both grants persist as separate entitlement rows');
  const firstRow = state.entitlements.find((e) => e.checkout_session_id === firstData.grantId);
  assert.ok(firstRow, 'the first grant must still exist — the second grant must not clobber it');
  assert.equal(state.auditLog.length, 2);
});

test('granting access to an email that already has a Stripe entitlement does not touch the Stripe row', async (t) => {
  const state = ownerState({
    authUsers: [{ id: 'u-paid', email: 'paid@example.com', user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }],
    entitlements: [{ checkout_session_id: 'cs_test_live_abc123', course_slug: 'headspa-mastery', purchaser_email: 'paid@example.com', user_id: 'u-paid', granted_at: '2026-01-01T00:00:00Z' }],
  });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const res = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'grant_access', email: 'paid@example.com', source: 'staff' } }),
    env,
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.accountCreated, false, 'must bind to the existing paid account, not create a second one');
  assert.equal(data.userId, 'u-paid');

  assert.equal(state.authUsers.length, 1, 'no duplicate account was created for the already-paying student');
  assert.equal(state.entitlements.length, 2);
  const stripeRow = state.entitlements.find((e) => e.checkout_session_id === 'cs_test_live_abc123');
  assert.deepEqual(stripeRow, { checkout_session_id: 'cs_test_live_abc123', course_slug: 'headspa-mastery', purchaser_email: 'paid@example.com', user_id: 'u-paid', granted_at: '2026-01-01T00:00:00Z' }, 'the Stripe entitlement row must be byte-for-byte unchanged');

  const deleteCalls = state.calls.filter((c) => c.pathname === '/rest/v1/course_entitlements' && c.method === 'DELETE');
  assert.equal(deleteCalls.length, 0, 'grant must never delete an existing entitlement, Stripe or otherwise');
});

test('grant_access rejects an invalid email and an unrecognized source before writing anything', async (t) => {
  const state = ownerState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const badEmail = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'grant_access', email: 'not-an-email', source: 'staff' } }),
    env,
  });
  assert.equal(badEmail.status, 400);

  const badSource = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'grant_access', email: 'ok@example.com', source: 'founder' } }),
    env,
  });
  assert.equal(badSource.status, 400);

  assert.equal(state.authUsers.length, 0);
  assert.equal(state.entitlements.length, 0);
  assert.equal(state.auditLog.length, 0);
});

// ---------------------------------------------------------------------------
// Revocation (revoke_manual_access)
// ---------------------------------------------------------------------------

test('revoke_manual_access rejects any id not prefixed admin-grant- and deletes nothing', async (t) => {
  const state = ownerState({
    entitlements: [{ checkout_session_id: 'cs_test_live_protected', course_slug: 'headspa-mastery', purchaser_email: 'paid@example.com', user_id: 'u-paid' }],
  });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const res = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'revoke_manual_access', grantId: 'cs_test_live_protected' } }),
    env,
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /Paid Stripe entitlements are protected/);

  assert.equal(state.entitlements.length, 1, 'the Stripe entitlement must remain');
  const deleteCalls = state.calls.filter((c) => c.method === 'DELETE');
  assert.equal(deleteCalls.length, 0, 'no delete request should ever be issued for a non admin-grant- id');
  assert.equal(state.auditLog.length, 0);
});

test('revoke_manual_access deletes exactly the targeted manual entitlement and writes a complete audit row', async (t) => {
  const state = ownerState({
    entitlements: [
      { checkout_session_id: 'admin-grant-staff-aaaa', course_slug: 'headspa-mastery', purchaser_email: 'staffer@example.com', user_id: 'u-staffer' },
      { checkout_session_id: 'cs_test_live_untouched', course_slug: 'headspa-mastery', purchaser_email: 'paid@example.com', user_id: 'u-paid' },
    ],
  });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const res = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'revoke_manual_access', grantId: 'admin-grant-staff-aaaa' } }),
    env,
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);

  assert.equal(state.entitlements.length, 1);
  assert.equal(state.entitlements[0].checkout_session_id, 'cs_test_live_untouched', 'the unrelated Stripe row must survive');

  const deleteCalls = state.calls.filter((c) => c.method === 'DELETE');
  assert.equal(deleteCalls.length, 1);
  assert.match(deleteCalls[0].url, /checkout_session_id=eq\.admin-grant-staff-aaaa/);

  assert.equal(state.auditLog.length, 1);
  const audit = state.auditLog[0];
  assert.equal(audit.action, 'revoke_manual_course_access');
  assert.equal(audit.actor_user_id, 'u-owner');
  assert.equal(audit.actor_email, 'owner@aimt.test');
  assert.equal(audit.actor_role, 'owner');
  assert.equal(audit.target_user_id, 'u-staffer');
  assert.equal(audit.target_email, 'staffer@example.com');
  assert.equal(audit.course_slug, 'headspa-mastery');

  assert.deepEqual(touchedProtectedTables(state), [], 'revoke must never touch course_progress/certification_attempts/completions');
});

test('revoke_manual_access on a nonexistent manual grant id is a 404 and writes no audit row', async (t) => {
  const state = ownerState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const res = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'revoke_manual_access', grantId: 'admin-grant-manual-does-not-exist' } }),
    env,
  });
  assert.equal(res.status, 404);
  assert.equal(state.auditLog.length, 0);
  const deleteCalls = state.calls.filter((c) => c.method === 'DELETE');
  assert.equal(deleteCalls.length, 0);
});

test('admin role (not just owner) can also grant and revoke', async (t) => {
  const state = makeState({
    adminUsers: [{ user_id: 'u-admin', role: 'admin', active: true }],
    tokenToUser: { 'token-admin': { id: 'u-admin', email: 'admin@aimt.test' } },
  });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const grantRes = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-admin', body: { action: 'grant_access', email: 'byadmin@example.com', source: 'manual' } }),
    env,
  });
  assert.equal(grantRes.status, 200);
  const grantData = await grantRes.json();

  const revokeRes = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-admin', body: { action: 'revoke_manual_access', grantId: grantData.grantId } }),
    env,
  });
  assert.equal(revokeRes.status, 200);
  assert.equal(state.entitlements.length, 0);
  assert.equal(state.auditLog.length, 2);
  assert.equal(state.auditLog[1].actor_role, 'admin');
});

// ---------------------------------------------------------------------------
// Reactivation (reactivate_manual_access)
//
// Design under test: reactivation never resurrects the deleted entitlement
// row. It (1) confirms — via the authoritative admin_audit_log, not any
// client-supplied claim — that the given grantId was genuinely revoked
// through Admin MVP, (2) refuses if the student already has an active manual
// entitlement (safe no-op), and otherwise (3) performs exactly the same
// operations grantAccess uses (ensureAuthUser -> insert course_entitlements
// -> writeAdminAudit) to create a brand-new admin-grant- row. It can never
// touch a non admin-grant- (Stripe) id, and never issues a DELETE/UPDATE.
// ---------------------------------------------------------------------------

test('reactivate_manual_access restores access for a genuinely revoked manual grant via a new entitlement, with a complete audit row', async (t) => {
  const state = ownerState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const grantRes = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'grant_access', email: 'restore-me@example.com', source: 'staff' } }),
    env,
  });
  const grantData = await grantRes.json();
  assert.equal(grantRes.status, 200);

  const revokeRes = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'revoke_manual_access', grantId: grantData.grantId } }),
    env,
  });
  assert.equal(revokeRes.status, 200);
  assert.equal(state.entitlements.length, 0, 'the revoked entitlement should be gone before reactivation');

  const deleteCallsBefore = state.calls.filter((c) => c.pathname === '/rest/v1/course_entitlements' && c.method === 'DELETE').length;

  const reactivateRes = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'reactivate_manual_access', grantId: grantData.grantId } }),
    env,
  });
  assert.equal(reactivateRes.status, 200);
  const reactivateData = await reactivateRes.json();
  assert.equal(reactivateData.ok, true);
  assert.equal(reactivateData.alreadyActive, undefined);
  assert.equal(reactivateData.userId, grantData.userId, 'reactivation must bind to the same existing account, not create a new one');
  assert.equal(reactivateData.accountCreated, false);
  assert.notEqual(reactivateData.grantId, grantData.grantId, 'reactivation creates a brand-new entitlement id — it does not resurrect the deleted row');
  assert.match(reactivateData.grantId, /^admin-grant-staff-/);

  assert.equal(state.entitlements.length, 1, 'exactly one active entitlement should exist after reactivation');
  assert.equal(state.entitlements[0].checkout_session_id, reactivateData.grantId);
  assert.equal(state.entitlements[0].user_id, grantData.userId);

  const deleteCallsAfter = state.calls.filter((c) => c.pathname === '/rest/v1/course_entitlements' && c.method === 'DELETE').length;
  assert.equal(deleteCallsAfter, deleteCallsBefore, 'reactivate must never issue a DELETE against course_entitlements');

  assert.equal(state.auditLog.length, 3, 'grant, revoke, and reactivate should each produce exactly one audit row');
  const audit = state.auditLog[2];
  assert.equal(audit.action, 'reactivate_manual_course_access');
  assert.equal(audit.actor_user_id, 'u-owner');
  assert.equal(audit.actor_email, 'owner@aimt.test');
  assert.equal(audit.actor_role, 'owner');
  assert.equal(audit.target_user_id, grantData.userId);
  assert.equal(audit.target_email, 'restore-me@example.com');
  assert.equal(audit.course_slug, 'headspa-mastery');
  assert.ok(audit.details && audit.details.source === 'staff' && audit.details.grantId === reactivateData.grantId && audit.details.originalGrantId === grantData.grantId);

  assert.deepEqual(touchedProtectedTables(state), [], 'reactivate must never touch course_progress/certification_attempts/completions');
});

test('reactivate_manual_access is rejected for unauthenticated and support-role callers, even against a genuinely revoked grant', async (t) => {
  const state = ownerState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const grantData = await (await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'grant_access', email: 'guarded@example.com', source: 'manual' } }),
    env,
  })).json();
  await onRequestPost({ request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'revoke_manual_access', grantId: grantData.grantId } }), env });
  const auditCountAfterRevoke = state.auditLog.length;

  const unauthRes = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', body: { action: 'reactivate_manual_access', grantId: grantData.grantId } }),
    env,
  });
  assert.equal(unauthRes.status, 401);

  state.adminUsers.push({ user_id: 'u-support', role: 'support', active: true });
  state.tokenToUser['token-support'] = { id: 'u-support', email: 'support@aimt.test' };
  const supportRes = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-support', body: { action: 'reactivate_manual_access', grantId: grantData.grantId } }),
    env,
  });
  assert.equal(supportRes.status, 403);

  assert.equal(state.entitlements.length, 0, 'neither unauthorized attempt should have created an entitlement');
  assert.equal(state.auditLog.length, auditCountAfterRevoke, 'no additional audit rows from rejected attempts');
});

test('reactivate_manual_access refuses a Stripe-style id and issues no write of any kind', async (t) => {
  const state = ownerState({
    entitlements: [{ checkout_session_id: 'cs_test_live_protected', course_slug: 'headspa-mastery', purchaser_email: 'paid@example.com', user_id: 'u-paid' }],
  });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const res = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'reactivate_manual_access', grantId: 'cs_test_live_protected' } }),
    env,
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /Paid Stripe entitlements are protected/);

  assert.equal(state.entitlements.length, 1, 'the Stripe entitlement must be completely untouched');
  assert.deepEqual(state.entitlements[0], { checkout_session_id: 'cs_test_live_protected', course_slug: 'headspa-mastery', purchaser_email: 'paid@example.com', user_id: 'u-paid' });
  const writeCalls = state.calls.filter((c) => c.pathname === '/rest/v1/course_entitlements' && c.method !== 'GET');
  assert.equal(writeCalls.length, 0, 'no write of any kind should be issued for a non admin-grant- id');
  assert.equal(state.auditLog.length, 0);
});

test('reactivate_manual_access returns 404 for a well-formed id with no matching revoke record', async (t) => {
  const state = ownerState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const res = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'reactivate_manual_access', grantId: 'admin-grant-staff-never-revoked' } }),
    env,
  });
  assert.equal(res.status, 404);
  assert.equal(state.entitlements.length, 0);
  assert.equal(state.auditLog.length, 0);
});

test('reactivate_manual_access is a safe no-op — and writes no audit row — when the student already has active manual access', async (t) => {
  const state = ownerState({
    entitlements: [{ checkout_session_id: 'admin-grant-manual-someone-else', course_slug: 'headspa-mastery', purchaser_email: 'unrelated@example.com', user_id: 'u-unrelated' }],
  });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const firstGrant = await (await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'grant_access', email: 'dup@example.com', source: 'staff' } }),
    env,
  })).json();
  await onRequestPost({ request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'revoke_manual_access', grantId: firstGrant.grantId } }), env });

  // The student was already re-granted access through the ordinary grant path
  // (e.g. before reactivate existed, or for any other reason) — this is the
  // "already active" case reactivate must not duplicate.
  const secondGrant = await (await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'grant_access', email: 'dup@example.com', source: 'complimentary' } }),
    env,
  })).json();

  const auditCountBefore = state.auditLog.length;
  const entitlementCountBefore = state.entitlements.length;

  const reactivateRes = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-owner', body: { action: 'reactivate_manual_access', grantId: firstGrant.grantId } }),
    env,
  });
  assert.equal(reactivateRes.status, 200);
  const data = await reactivateRes.json();
  assert.equal(data.ok, true);
  assert.equal(data.alreadyActive, true);
  assert.equal(data.grantId, secondGrant.grantId, 'the no-op response should point at the currently active manual grant');

  assert.equal(state.entitlements.length, entitlementCountBefore, 'no new entitlement should be created');
  assert.equal(state.auditLog.length, auditCountBefore, 'a safe no-op must not write a new audit row');
});

test('admin role (not just owner) can also reactivate', async (t) => {
  const state = makeState({
    adminUsers: [{ user_id: 'u-admin', role: 'admin', active: true }],
    tokenToUser: { 'token-admin': { id: 'u-admin', email: 'admin@aimt.test' } },
  });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const grantData = await (await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-admin', body: { action: 'grant_access', email: 'byadmin2@example.com', source: 'manual' } }),
    env,
  })).json();
  await onRequestPost({ request: makeRequest(API_URL, { method: 'POST', token: 'token-admin', body: { action: 'revoke_manual_access', grantId: grantData.grantId } }), env });

  const reactivateRes = await onRequestPost({
    request: makeRequest(API_URL, { method: 'POST', token: 'token-admin', body: { action: 'reactivate_manual_access', grantId: grantData.grantId } }),
    env,
  });
  assert.equal(reactivateRes.status, 200);
  const data = await reactivateRes.json();
  assert.equal(data.ok, true);
  assert.equal(state.auditLog[state.auditLog.length - 1].actor_role, 'admin');
});
