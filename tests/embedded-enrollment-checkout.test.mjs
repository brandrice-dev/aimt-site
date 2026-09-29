// Embedded enrollment checkout — Stripe Embedded Checkout inside AIMT
// (enroll.html) instead of redirecting to the hosted checkout.stripe.com
// page.
//
// Exercises the real functions/api/create-checkout-session.js handler with
// a mocked fetch (same approach as tests/stripe-webhook-paid-enrollment-
// email.test.mjs — nothing leaves the process), the real stripe-webhook.js
// handler against an embedded-shaped session, and regex-verifies the
// shipped enroll.html / headspa-mastery.html / success.html source (flat
// HTML site, no DOM runner — see CLAUDE.md).
//
// Run: node --test tests/embedded-enrollment-checkout.test.mjs

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

import { onRequestPost as createCheckoutSession } from '../functions/api/create-checkout-session.js';
import { onRequestPost as stripeWebhook } from '../functions/api/stripe-webhook.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');

const ORIGIN = 'https://aimtrichology.com';
const PRICE_ID = 'price_headspa_live';
const SECRET_KEY = 'sk_test_SERVERSIDEONLY123';
const PUBLISHABLE_KEY = 'pk_test_publicKey123';
const SERVICE_ROLE_KEY = 'service-role-SERVERSIDEONLY';
const WEBHOOK_SECRET = 'whsec_SERVERSIDEONLY';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function makeEnv(overrides = {}) {
  return {
    STRIPE_SECRET_KEY: SECRET_KEY,
    STRIPE_PRICE_ID: PRICE_ID,
    STRIPE_PUBLISHABLE_KEY: PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
    SUPABASE_URL: 'https://fake.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: SERVICE_ROLE_KEY,
    ...overrides,
  };
}

// stripeBehavior: (params, headers, callIndex) => Response
function installFetchMock(t, stripeBehavior) {
  const state = { stripeCalls: [], logs: [] };
  t.mock.method(globalThis, 'fetch', async (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    if (url.origin === 'https://api.stripe.com' && url.pathname === '/v1/checkout/sessions') {
      const params = new URLSearchParams(String(options.body));
      const call = { params, headers: options.headers || {} };
      state.stripeCalls.push(call);
      return stripeBehavior(params, call.headers, state.stripeCalls.length - 1);
    }
    if (url.pathname === '/rest/v1/aimt_logs') {
      state.logs.push(JSON.parse(options.body));
      return new Response(null, { status: 201 });
    }
    throw new Error(`Unhandled mock fetch: ${url}`);
  });
  return state;
}

async function postCreate(env, body) {
  const request = new Request(`${ORIGIN}/api/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const response = await createCheckoutSession({ request, env });
  const text = await response.text();
  return { response, text, data: JSON.parse(text) };
}

const embeddedOk = (params) => jsonResponse({
  id: 'cs_test_embedded_1',
  object: 'checkout.session',
  ui_mode: params.get('ui_mode'),
  client_secret: 'cs_test_embedded_1_secret_abc',
  url: null,
});

// ── Session creation ─────────────────────────────────────────────────────

test('embedded request creates an embedded_page session for the configured $597 price with return_url → success.html', async (t) => {
  const state = installFetchMock(t, embeddedOk);
  const { response, data } = await postCreate(makeEnv(), { course: 'headspa-mastery', ui: 'embedded' });

  assert.equal(response.status, 200);
  assert.equal(state.stripeCalls.length, 1);
  const { params, headers } = state.stripeCalls[0];
  assert.equal(params.get('ui_mode'), 'embedded_page');
  assert.equal(params.get('mode'), 'payment');
  assert.equal(params.get('line_items[0][price]'), PRICE_ID);
  assert.equal(params.get('line_items[0][quantity]'), '1');
  assert.equal(params.get('return_url'), `${ORIGIN}/success.html?session_id={CHECKOUT_SESSION_ID}`);
  assert.equal(params.get('success_url'), null, 'success_url is not allowed with embedded_page');
  assert.equal(params.get('cancel_url'), null, 'cancel_url is not allowed with embedded_page');
  assert.equal(headers['Stripe-Version'], '2026-03-25.dahlia', 'API version pinned so embedded_page is valid regardless of account default');
  assert.equal(headers.Authorization, `Bearer ${SECRET_KEY}`);

  assert.deepEqual(data, { clientSecret: 'cs_test_embedded_1_secret_abc', publishableKey: PUBLISHABLE_KEY });
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('embedded response never exposes server-side secrets', async (t) => {
  installFetchMock(t, embeddedOk);
  const { text } = await postCreate(makeEnv(), { ui: 'embedded' });
  for (const secret of [SECRET_KEY, SERVICE_ROLE_KEY, WEBHOOK_SECRET, PRICE_ID, 'sk_', 'whsec_']) {
    assert.ok(!text.includes(secret), `response must not contain ${secret}`);
  }
});

test('embedded branding is applied, and a Stripe rejection of branding retries once without it', async (t) => {
  const state = installFetchMock(t, (params, _headers, i) => {
    if (i === 0) {
      assert.equal(params.get('branding_settings[button_color]'), '#262626');
      return jsonResponse({ error: { message: 'bad', param: 'branding_settings[font_family]' } }, 400);
    }
    assert.equal(params.get('branding_settings[button_color]'), null);
    return embeddedOk(params);
  });
  const { response, data } = await postCreate(makeEnv(), { ui: 'embedded' });
  assert.equal(state.stripeCalls.length, 2);
  assert.equal(response.status, 200);
  assert.equal(data.clientSecret, 'cs_test_embedded_1_secret_abc');
});

test('Stripe failure on the embedded path returns a calm generic error — never the raw Stripe message — and logs it', async (t) => {
  const state = installFetchMock(t, () => jsonResponse({ error: { message: 'No such price: price_xyz; a similar object exists in live mode' } }, 400));
  const { response, text, data } = await postCreate(makeEnv(), { ui: 'embedded' });
  assert.equal(response.status, 502);
  assert.equal(data.error, 'Unable to create checkout session');
  assert.ok(!text.includes('No such price'));
  assert.ok(state.logs.some((row) => row.event_type === 'api_create_checkout_session_failure' && row.message.includes('No such price')));
});

test('missing Stripe secret/price fails safely with a generic 500 and never calls Stripe', async (t) => {
  const state = installFetchMock(t, () => { throw new Error('should not be called'); });
  const { response, data } = await postCreate(makeEnv({ STRIPE_SECRET_KEY: '' }), { ui: 'embedded' });
  assert.equal(response.status, 500);
  assert.equal(data.error, 'Checkout is temporarily unavailable.');
  assert.equal(state.stripeCalls.length, 0);
});

for (const [label, overrides, reason] of [
  ['missing', { STRIPE_PUBLISHABLE_KEY: undefined }, 'stripe_publishable_key_not_configured'],
  ['not a publishable key', { STRIPE_PUBLISHABLE_KEY: 'sk_test_oops' }, 'stripe_publishable_key_invalid'],
  ['live/test mode mismatch', { STRIPE_PUBLISHABLE_KEY: 'pk_live_abc' }, 'stripe_publishable_key_mode_mismatch'],
]) {
  test(`publishable key ${label} → falls back to a hosted session so enrollment keeps working, and logs why`, async (t) => {
    const state = installFetchMock(t, (params) => {
      assert.equal(params.get('ui_mode'), null, 'fallback is the unchanged hosted session');
      assert.ok(params.get('success_url'));
      return jsonResponse({ id: 'cs_test_hosted', url: 'https://checkout.stripe.com/c/pay/cs_test_hosted' });
    });
    const { response, data } = await postCreate(makeEnv(overrides), { ui: 'embedded' });
    assert.equal(response.status, 200);
    assert.deepEqual(data, { url: 'https://checkout.stripe.com/c/pay/cs_test_hosted', fallback: 'hosted' });
    assert.ok(state.logs.some((row) => row.event_type === 'api_create_checkout_session_embedded_fallback' && row.message === reason));
  });
}

test('legacy (non-embedded) request still creates the exact same hosted session as before', async (t) => {
  const state = installFetchMock(t, () => jsonResponse({ id: 'cs_test_hosted', url: 'https://checkout.stripe.com/c/pay/cs_test_hosted' }));
  const { data } = await postCreate(makeEnv(), { course: 'headspa-mastery' });
  const { params, headers } = state.stripeCalls[0];
  assert.deepEqual([...params.keys()].sort(), ['cancel_url', 'line_items[0][price]', 'line_items[0][quantity]', 'mode', 'success_url']);
  assert.equal(params.get('success_url'), `${ORIGIN}/success.html?session_id={CHECKOUT_SESSION_ID}`);
  assert.equal(params.get('cancel_url'), `${ORIGIN}/courses.html?checkout=canceled`);
  assert.equal(headers['Stripe-Version'], undefined, 'hosted path keeps the account default API version');
  assert.deepEqual(data, { url: 'https://checkout.stripe.com/c/pay/cs_test_hosted' });
});

// ── Webhook + entitlement with an embedded-shaped session ────────────────

async function sign(payload, secret) {
  const ts = Math.floor(Date.now() / 1000);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${ts}.${payload}`));
  return `t=${ts},v1=${[...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

test('checkout.session.completed for an embedded session (return_url, no success_url) still writes the paid entitlement and a canonical enrollment link', async (t) => {
  const entitlements = [];
  const emails = [];
  t.mock.method(globalThis, 'fetch', async (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const method = (options.method || 'GET').toUpperCase();
    if (url.origin === 'https://api.stripe.com' && url.pathname.endsWith('/line_items')) {
      return jsonResponse({ data: [{ price: { id: PRICE_ID } }] });
    }
    if (url.pathname === '/rest/v1/course_entitlements' && method === 'POST') {
      entitlements.push(JSON.parse(options.body));
      return new Response(null, { status: 201 });
    }
    if (url.pathname === '/rest/v1/aimt_logs') {
      return method === 'GET' ? jsonResponse([]) : new Response(null, { status: 201 });
    }
    if (url.toString().startsWith('https://api.resend.com/emails')) {
      emails.push(JSON.parse(options.body));
      return jsonResponse({ id: 'resend-1' });
    }
    throw new Error(`Unhandled mock fetch: ${method} ${url}`);
  });

  const event = {
    id: 'evt_embedded_1',
    type: 'checkout.session.completed',
    data: { object: {
      id: 'cs_live_embedded_1',
      ui_mode: 'embedded_page',
      payment_status: 'paid',
      status: 'complete',
      success_url: null,
      return_url: `${ORIGIN}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      customer_details: { email: 'Student@Example.com', name: 'Jamie Rivera' },
    } },
  };
  const payload = JSON.stringify(event);
  const request = new Request('https://aimt-site.pages.dev/api/stripe-webhook', {
    method: 'POST',
    headers: { 'stripe-signature': await sign(payload, WEBHOOK_SECRET) },
    body: payload,
  });
  const response = await stripeWebhook({ request, env: makeEnv({ RESEND_API_KEY: 're_test' }) });

  assert.equal(response.status, 200);
  assert.deepEqual(entitlements, [{
    checkout_session_id: 'cs_live_embedded_1',
    course_slug: 'headspa-mastery',
    purchaser_email: 'student@example.com',
  }]);
  assert.equal(emails.length, 1, 'paid-enrollment email still sent after the entitlement write');
  assert.ok(JSON.stringify(emails[0]).includes(`${ORIGIN}/success.html?session_id=cs_live_embedded_1`));
});

// ── Frontend source checks ───────────────────────────────────────────────

const enrollSrc = read('enroll.html');
const headspaSrc = read('headspa-mastery.html');

test('enroll.html mounts Stripe Embedded Checkout from js.stripe.com using only the server-provided client secret + publishable key', () => {
  assert.match(enrollSrc, /https:\/\/js\.stripe\.com\/dahlia\/stripe\.js/);
  assert.match(enrollSrc, /ui: 'embedded'/);
  assert.match(enrollSrc, /createEmbeddedCheckoutPage/);
  assert.match(enrollSrc, /fetchClientSecret/);
  assert.match(enrollSrc, /data\.publishableKey/);
  assert.match(enrollSrc, /\.mount\('#enrollCheckout'\)/);
  assert.doesNotMatch(enrollSrc, /\b(sk|rk)_(live|test)_/, 'no secret or restricted keys in the page');
  assert.doesNotMatch(enrollSrc, /pk_(live|test)_[A-Za-z0-9]/, 'publishable key comes from the server env, not hardcoded');
  assert.doesNotMatch(enrollSrc, /whsec_|service_role|SERVICE_ROLE/);
});

test('enroll.html states the exact product and $597 price and links refund/terms/privacy', () => {
  assert.match(enrollSrc, /Complete your enrollment/);
  assert.match(enrollSrc, /American Institute of Modern Trichology/);
  assert.match(enrollSrc, /Head Spa Certification Course/);
  assert.match(enrollSrc, /\$597/);
  assert.doesNotMatch(enrollSrc, /\$(?!597\b)\d/, 'no other price appears');
  assert.match(enrollSrc, /Secure payment processed by Stripe/);
  assert.match(enrollSrc, /AIMT does not receive or store your card details/);
  for (const href of ['/refunds', '/terms', '/privacy']) assert.ok(enrollSrc.includes(`href="${href}"`));
});

test('enroll.html has recoverable, accessible loading and error states', () => {
  assert.match(enrollSrc, /role="status" aria-live="polite"/);
  assert.match(enrollSrc, /id="enrollError" role="alert" hidden/);
  assert.match(enrollSrc, /id="enrollRetry"/);
  assert.match(enrollSrc, /els\.retry\.addEventListener\('click', start\)/);
  assert.match(enrollSrc, /embedded\.destroy\(\)/, 'retry tears down the previous Stripe instance (only one may exist)');
  assert.match(enrollSrc, /Your card has not been charged/);
  assert.match(enrollSrc, /\[hidden\] \{ display: none !important; \}/, 'hidden attribute wins over class display rules');
  assert.match(enrollSrc, /data\.fallback === 'hosted' && data\.url/, 'hosted fallback is honored when the server returns it');
  assert.match(enrollSrc, /event\.persisted/, 'bfcache restore starts a fresh session');
  assert.match(enrollSrc, /els\.reload\.addEventListener\('click', start\)/, 'quiet reload offered if Stripe fails inside its own frame');
  assert.match(enrollSrc, /\.enroll-checkout\.is-mounted \{ margin: 0 -0\.85rem; \}/, 'Stripe frame spans the card on phones');
  assert.doesNotMatch(enrollSrc, /error\.message\s*\)\s*;?\s*\n\s*els\.errorCopy/, 'raw error text is never shown to the buyer');
});

test('every enroll CTA on the course page routes to /enroll — no direct hosted-checkout path remains there', () => {
  const fn = headspaSrc.slice(headspaSrc.indexOf('function startCheckout()'), headspaSrc.indexOf('function applyCheckoutStatus()'));
  assert.match(fn, /window\.location\.href = '\/enroll'/);
  assert.doesNotMatch(headspaSrc, /\/api\/create-checkout-session/);
  assert.doesNotMatch(headspaSrc, /data\.url/);
  const ctas = headspaSrc.match(/onclick="startCheckout\(\)"/g) || [];
  assert.equal(ctas.length, 5);
});

test('success.html still claims via the session_id Stripe appends to return_url, then hands off to Student Access', () => {
  const successSrc = read('success.html');
  assert.match(successSrc, /checkoutParams\.get\('session_id'\)/);
  assert.match(successSrc, /fetch\('\/api\/claim-course-access'/);
  assert.match(successSrc, /const COURSE_SIGNIN_URL = 'student-access\.html'/);
});
