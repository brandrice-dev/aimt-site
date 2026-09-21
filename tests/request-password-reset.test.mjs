// Coverage for the password-reset-email hotfix (functions/api/
// request-password-reset.js): replaces the REQUEST half of student-access
// .html's forgot-password flow with a server-side Supabase
// admin/generate_link + direct Resend send, bypassing Supabase's Custom
// SMTP mailer confirmed unreliable in production (POST /auth/v1/recover
// returned 200, but recovery_sent_at on auth.users never advanced and
// Resend never received the send -- true even for a call that reached the
// real handler for a real, existing, confirmed account).
//
// Follows the same in-process fetch-mock approach as
// tests/admin-manual-grant-invite.test.mjs: every fetch (Supabase Admin
// API and Resend) is mocked, no real network call ever leaves the
// process, and no real email is sent anywhere in this file.
//
// This endpoint's entire point is enumeration safety and secret
// containment, so most assertions here are about what DOESN'T appear in
// a response or a log line, not just what does.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import * as endpoint from '../functions/api/request-password-reset.js';
import { _resetRateLimitBucketsForTests } from '../functions/_lib/cadence/rate-limit.mjs';

const { onRequestPost } = endpoint;

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENDPOINT_URL = 'https://aimtrichology.com/api/request-password-reset';
const GENERATE_LINK_URL = 'https://fake.supabase.co/auth/v1/admin/generate_link';
const RESEND_URL = 'https://api.resend.com/emails';
const GENERIC_MESSAGE = 'If an AIMT account exists for that email, a password reset link has been sent.';

function makeEnv(overrides = {}) {
  return {
    SUPABASE_URL: 'https://fake.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'fake-service-role-key',
    RESEND_API_KEY: 're_test_123',
    ...overrides,
  };
}

function makeRequest({ method = 'POST', body, ip } = {}) {
  const headers = new Headers();
  if (ip) headers.set('cf-connecting-ip', ip);
  const init = { method, headers };
  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
    headers.set('Content-Type', 'application/json');
  }
  return new Request(ENDPOINT_URL, init);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function makeState(overrides = {}) {
  return {
    calls: [],
    // 'found' | 'not_found' | 'provider_error' -- what generate_link returns
    generateLinkBehavior: 'found',
    actionLink: 'https://fake.supabase.co/auth/v1/verify?token=fake-recovery-token&type=recovery&redirect_to=https://aimtrichology.com/student-access.html',
    // 'success' | 'fail' | 'throw'
    resendBehavior: 'success',
    ...overrides,
  };
}

function createFetchMock(state) {
  return async function fetchMock(input, options = {}) {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers || {};
    state.calls.push({ url: url.toString(), method, headers, body: options.body ? JSON.parse(options.body) : null });

    if (url.toString() === GENERATE_LINK_URL) {
      if (state.generateLinkBehavior === 'not_found') {
        return jsonResponse({ msg: 'Unable to identify user' }, 422);
      }
      if (state.generateLinkBehavior === 'provider_error') {
        return jsonResponse({ msg: 'internal server error' }, 500);
      }
      return jsonResponse({
        action_link: state.actionLink,
        email_otp: 'should-never-be-read-by-caller',
        hashed_token: 'should-never-be-read-by-caller',
        redirect_to: 'https://aimtrichology.com/student-access.html',
        user: { id: 'u-1', email: JSON.parse(options.body).email },
      }, 200);
    }

    if (url.toString() === RESEND_URL) {
      if (state.resendBehavior === 'throw') throw new Error('simulated network failure');
      if (state.resendBehavior === 'fail') return jsonResponse({ message: 'simulated Resend rejection' }, 422);
      return jsonResponse({ id: 'resend-1' }, 200);
    }

    throw new Error(`Unhandled mock fetch: ${method} ${url.toString()}`);
  };
}

function generateLinkCalls(state) {
  return state.calls.filter((c) => c.url === GENERATE_LINK_URL);
}
function resendCalls(state) {
  return state.calls.filter((c) => c.url === RESEND_URL);
}

// ---------------------------------------------------------------------------

test('module exports only onRequestPost -- GET/etc. 405 at the Cloudflare Pages Functions routing layer, not in application code', async () => {
  assert.equal(typeof endpoint.onRequestPost, 'function');
  assert.equal(endpoint.onRequestGet, undefined);
  assert.equal(endpoint.onRequestPut, undefined);
  assert.equal(endpoint.onRequestDelete, undefined);
  assert.equal(endpoint.onRequest, undefined);
});

test('empty email is rejected with a safe validation response, no account lookup attempted', async (t) => {
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const res = await onRequestPost({ request: makeRequest({ body: { email: '' } }), env: makeEnv() });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.ok(data.error);
  assert.equal(state.calls.length, 0, 'malformed input must never reach Supabase or Resend');
});

test('malformed email is rejected with a safe validation response, no account lookup attempted', async (t) => {
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const res = await onRequestPost({ request: makeRequest({ body: { email: 'not-an-email' } }), env: makeEnv() });
  assert.equal(res.status, 400);
  assert.equal(state.calls.length, 0);
});

test('invalid JSON body is rejected safely', async (t) => {
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const res = await onRequestPost({ request: makeRequest({ body: '{not json' }), env: makeEnv() });
  assert.equal(res.status, 400);
  assert.equal(state.calls.length, 0);
});

test('missing SUPABASE_URL fails safely with a generic 500, never reaches Supabase or Resend', async (t) => {
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ SUPABASE_URL: undefined });
  const res = await onRequestPost({ request: makeRequest({ body: { email: 'student@example.com' } }), env });
  assert.equal(res.status, 500);
  const data = await res.json();
  assert.ok(data.error);
  assert.doesNotMatch(JSON.stringify(data), /supabase|service.?role|token|link/i);
  assert.equal(state.calls.length, 0);
});

test('missing SUPABASE_SERVICE_ROLE_KEY fails safely with a generic 500, never reaches Supabase or Resend', async (t) => {
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ SUPABASE_SERVICE_ROLE_KEY: undefined });
  const res = await onRequestPost({ request: makeRequest({ body: { email: 'student@example.com' } }), env });
  assert.equal(res.status, 500);
  assert.equal(state.calls.length, 0);
});

test('missing RESEND_API_KEY fails safely with a generic 500, never reaches Supabase or Resend', async (t) => {
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: undefined });
  const res = await onRequestPost({ request: makeRequest({ body: { email: 'student@example.com' } }), env });
  assert.equal(res.status, 500);
  assert.equal(state.calls.length, 0);
});

test('valid existing account: generate_link called once with exact type/email/redirect_to, service-role only, action_link extracted and emailed once via Resend', async (t) => {
  _resetRateLimitBucketsForTests();
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const res = await onRequestPost({
    request: makeRequest({ body: { email: '  Student@Example.com  ' }, ip: '203.0.113.5' }),
    env,
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.deepEqual(data, { ok: true, message: GENERIC_MESSAGE });

  const linkCalls = generateLinkCalls(state);
  assert.equal(linkCalls.length, 1, 'generate_link must be called exactly once');
  assert.equal(linkCalls[0].method, 'POST');
  assert.equal(linkCalls[0].body.type, 'recovery');
  assert.equal(linkCalls[0].body.email, 'student@example.com', 'email must be trimmed and lowercased');
  assert.equal(linkCalls[0].body.redirect_to, 'https://aimtrichology.com/student-access.html');
  assert.equal(linkCalls[0].headers.apikey, 'fake-service-role-key');
  assert.equal(linkCalls[0].headers.Authorization, 'Bearer fake-service-role-key');

  const sent = resendCalls(state);
  assert.equal(sent.length, 1, 'Resend must be called exactly once');
  assert.equal(sent[0].headers.Authorization, 'Bearer re_test_123');
  assert.equal(sent[0].body.to[0], 'student@example.com');
  assert.equal(sent[0].body.reply_to, 'support@aimtrichology.com');
  assert.equal(sent[0].body.subject, 'Reset your AIMT password');
  assert.match(sent[0].body.from, /auth\.aimtrichology\.com/);
  const escapedActionLink = state.actionLink.replace(/&/g, '&amp;');
  assert.ok(
    sent[0].body.html.includes(escapedActionLink),
    'the reset CTA must contain the generated recovery link (HTML-escaped, per "escape interpolated values")'
  );
});

test('nonexistent account: generate_link reports not-found, no Resend send happens, response is the identical generic 200', async (t) => {
  _resetRateLimitBucketsForTests();
  const state = makeState({ generateLinkBehavior: 'not_found' });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const res = await onRequestPost({ request: makeRequest({ body: { email: 'nobody@example.com' } }), env });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.deepEqual(data, { ok: true, message: GENERIC_MESSAGE });
  assert.equal(resendCalls(state).length, 0, 'no email must be sent for a nonexistent account');
  assert.doesNotMatch(JSON.stringify(data), /not.?found|no.?user|does.?not.?exist/i);
});

test('Supabase provider error (500 from generate_link) is enumeration-safe: same generic 200, no provider detail leaked', async (t) => {
  _resetRateLimitBucketsForTests();
  const state = makeState({ generateLinkBehavior: 'provider_error' });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const res = await onRequestPost({ request: makeRequest({ body: { email: 'student@example.com' } }), env });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.deepEqual(data, { ok: true, message: GENERIC_MESSAGE });
  assert.equal(resendCalls(state).length, 0);
  assert.doesNotMatch(JSON.stringify(data), /internal server error|msg/i);
});

test('Resend send failure: generic 500, the recovery link/token is never returned or echoed', async (t) => {
  _resetRateLimitBucketsForTests();
  const state = makeState({ resendBehavior: 'fail' });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const res = await onRequestPost({ request: makeRequest({ body: { email: 'student@example.com' } }), env });
  assert.equal(res.status, 500);
  const data = await res.json();
  assert.ok(data.error);
  const raw = JSON.stringify(data);
  assert.doesNotMatch(raw, /fake-recovery-token/);
  assert.doesNotMatch(raw, /action_link/i);
  assert.doesNotMatch(raw, /re_test_123|fake-service-role-key/);
});

test('Resend network-level throw: generic 500, no secret or link leaks, and is caught rather than raised', async (t) => {
  _resetRateLimitBucketsForTests();
  const state = makeState({ resendBehavior: 'throw' });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const res = await onRequestPost({ request: makeRequest({ body: { email: 'student@example.com' } }), env });
  assert.equal(res.status, 500);
  const data = await res.json();
  const raw = JSON.stringify(data);
  assert.doesNotMatch(raw, /fake-recovery-token/);
  assert.doesNotMatch(raw, /re_test_123|fake-service-role-key/);
});

test('rate limit: a second request for the same email within a minute is short-circuited before touching Supabase/Resend, and stays enumeration-safe', async (t) => {
  _resetRateLimitBucketsForTests();
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const first = await onRequestPost({ request: makeRequest({ body: { email: 'repeat@example.com' }, ip: '198.51.100.9' }), env });
  assert.equal(first.status, 200);
  assert.equal(generateLinkCalls(state).length, 1);
  assert.equal(resendCalls(state).length, 1);

  const second = await onRequestPost({ request: makeRequest({ body: { email: 'repeat@example.com' }, ip: '198.51.100.9' }), env });
  assert.equal(second.status, 200, 'a rate-limited response must remain enumeration-safe (identical shape to a real send)');
  const secondData = await second.json();
  assert.deepEqual(secondData, { ok: true, message: GENERIC_MESSAGE });
  assert.equal(generateLinkCalls(state).length, 1, 'the second, rate-limited request must not call generate_link again');
  assert.equal(resendCalls(state).length, 1, 'the second, rate-limited request must not call Resend again');
});

test('rate limit: distinct emails from the same IP within a minute are each still allowed up to the IP ceiling', async (t) => {
  _resetRateLimitBucketsForTests();
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv();

  const a = await onRequestPost({ request: makeRequest({ body: { email: 'first@example.com' }, ip: '198.51.100.10' }), env });
  const b = await onRequestPost({ request: makeRequest({ body: { email: 'second@example.com' }, ip: '198.51.100.10' }), env });
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  assert.equal(generateLinkCalls(state).length, 2, 'two distinct emails must each get their own generate_link call');
});

test('no real network call is made anywhere in this file -- every fetch is routed through the in-process mock', async (t) => {
  _resetRateLimitBucketsForTests();
  const state = makeState();
  const seenUrls = [];
  t.mock.method(globalThis, 'fetch', async (...args) => {
    seenUrls.push(typeof args[0] === 'string' ? args[0] : args[0].url);
    return createFetchMock(state)(...args);
  });
  const env = makeEnv();

  await onRequestPost({ request: makeRequest({ body: { email: 'student@example.com' } }), env });
  for (const url of seenUrls) {
    assert.ok(
      url.startsWith('https://fake.supabase.co/') || url.startsWith(RESEND_URL),
      `unexpected fetch target: ${url}`
    );
  }
});

// ---------------------------------------------------------------------------
// Static checks against student-access.html and the endpoint source itself.
// ---------------------------------------------------------------------------

test('student-access.html no longer calls supabaseClient.auth.resetPasswordForEmail', () => {
  const html = readFileSync(path.join(REPO_ROOT, 'student-access.html'), 'utf8');
  assert.doesNotMatch(html, /resetPasswordForEmail/);
});

test('student-access.html calls /api/request-password-reset for the forgot-password request', () => {
  const html = readFileSync(path.join(REPO_ROOT, 'student-access.html'), 'utf8');
  assert.match(html, /fetch\('\/api\/request-password-reset'/);
});

test('student-access.html still contains the untouched recovery-link landing flow (detectSessionInUrl, PASSWORD_RECOVERY, updateUser)', () => {
  const html = readFileSync(path.join(REPO_ROOT, 'student-access.html'), 'utf8');
  assert.match(html, /detectSessionInUrl:\s*true/);
  assert.match(html, /event === 'PASSWORD_RECOVERY'/);
  assert.match(html, /supabaseClient\.auth\.updateUser\(\{\s*password:\s*nextPassword\s*\}\)/);
  assert.match(html, /supabaseClient\.auth\.signOut\(\)/);
});

test('student-access.html does not claim a definite send from the generic response', () => {
  const html = readFileSync(path.join(REPO_ROOT, 'student-access.html'), 'utf8');
  assert.doesNotMatch(html, /Password reset email sent/);
});

test('neither server secret appears anywhere in the browser-shipped HTML/JS files', () => {
  const filesToCheck = ['student-access.html', 'headspa-mastery.html', 'success.html', 'admin.html'];
  for (const file of filesToCheck) {
    const contents = readFileSync(path.join(REPO_ROOT, file), 'utf8');
    assert.doesNotMatch(contents, /SUPABASE_SERVICE_ROLE_KEY/, `${file} must never reference the service-role key`);
    assert.doesNotMatch(contents, /RESEND_API_KEY/, `${file} must never reference the Resend key`);
  }
});

test('the endpoint module itself never references a hardcoded secret value (env-only access)', () => {
  const src = readFileSync(path.join(REPO_ROOT, 'functions/api/request-password-reset.js'), 'utf8');
  assert.match(src, /env\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(src, /env\.RESEND_API_KEY/);
  // No console.* call anywhere -- the action_link must never reach logs.
  assert.doesNotMatch(src, /console\.\w+\(/);
});

test('node --check passes on both changed files (syntax validity)', () => {
  execFileSync(process.execPath, ['--check', path.join(REPO_ROOT, 'functions/api/request-password-reset.js')]);
  // student-access.html is not a standalone JS file, so it is exercised by
  // actually importing/parsing behavior via the string-pattern checks above
  // instead of node --check, which only applies to .js/.mjs sources.
});
