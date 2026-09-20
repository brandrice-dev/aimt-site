// Post-launch hotfix — Task B/C coverage: the paid-enrollment welcome email
// wired into functions/api/stripe-webhook.js right after upsertEntitlement()
// succeeds (functions/_lib/enrollment/paid-enrollment-email.mjs).
//
// Mirrors the mocking approach already established in
// tests/admin-manual-grant-invite.test.mjs (t.mock.method(globalThis,
// 'fetch', ...) over a small in-memory fake covering Stripe's REST API,
// Supabase's REST API, and Resend's /emails endpoint) so this exercises the
// real onRequestPost handler end-to-end. No network call ever leaves the
// process; no real email is sent anywhere in this file.
//
// Run: node --test tests/stripe-webhook-paid-enrollment-email.test.mjs

import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestPost } from '../functions/api/stripe-webhook.js';
import { sendPaidEnrollmentEmail, paidEnrollmentEmailIdempotencyKey } from '../functions/_lib/enrollment/paid-enrollment-email.mjs';

const STRIPE_URL = 'https://api.stripe.com';
const RESEND_URL = 'https://api.resend.com/emails';
// Real production value: Stripe's dashboard webhook endpoint for this site
// is configured against the Cloudflare Pages default domain, not the
// custom domain — this is the exact URL that triggered the PR #3 review
// finding (the enrollment email's CTA was being derived from this request's
// own origin). Every test in this file posts to this URL by default so
// the whole suite proves the fix under the real problematic condition,
// not just a hand-picked one.
const WEBHOOK_URL = 'https://aimt-site.pages.dev/api/stripe-webhook';
const CANONICAL_SITE_URL = 'https://aimtrichology.com';
const WEBHOOK_SECRET = 'whsec_test_secret';
const MATCHING_PRICE_ID = 'price_headspa_live';

async function signStripePayload(payload, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `t=${timestamp},v1=${hex}`;
}

function makeCheckoutSessionEvent(overrides = {}) {
  return {
    id: 'evt_test_1',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        payment_status: 'paid',
        status: 'complete',
        customer_details: { email: 'student@example.com', name: 'Jamie Rivera' },
        // Real Stripe behavior: success_url is stored with the literal
        // {CHECKOUT_SESSION_ID} token unresolved — only the browser redirect
        // substitutes it. This is the real, canonical value
        // create-checkout-session.js sets when a customer checks out from
        // the actual production domain.
        success_url: `${CANONICAL_SITE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        ...overrides,
      },
    },
  };
}

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function makeState(overrides = {}) {
  return {
    entitlements: [],
    aimtLogs: [],
    resendCalls: [],
    resendBehavior: 'success', // 'success' | 'fail' | 'throw'
    lineItemsPriceId: MATCHING_PRICE_ID,
    ...overrides,
  };
}

function createFetchMock(state) {
  return async function fetchMock(input, options = {}) {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const method = (options.method || 'GET').toUpperCase();

    if (url.toString().startsWith(RESEND_URL)) {
      state.resendCalls.push({ headers: options.headers || {}, body: options.body ? JSON.parse(options.body) : null });
      if (state.resendBehavior === 'throw') throw new Error('simulated network failure');
      if (state.resendBehavior === 'fail') return jsonResponse({ message: 'simulated Resend rejection' }, 422);
      return jsonResponse({ id: `resend-${state.resendCalls.length}` }, 200);
    }

    if (url.origin === STRIPE_URL && url.pathname.endsWith('/line_items')) {
      return jsonResponse({ data: [{ price: { id: state.lineItemsPriceId } }] });
    }

    if (url.pathname === '/rest/v1/course_entitlements') {
      if (method === 'POST') {
        state.entitlements.push(JSON.parse(options.body));
        return new Response(null, { status: 201 });
      }
    }

    if (url.pathname === '/rest/v1/aimt_logs') {
      if (method === 'POST') {
        state.aimtLogs.push(JSON.parse(options.body));
        return new Response(null, { status: 201 });
      }
      if (method === 'GET') {
        const eventType = (url.searchParams.get('event_type') || '').replace(/^eq\./, '');
        const message = (url.searchParams.get('message') || '').replace(/^eq\./, '');
        const rows = state.aimtLogs.filter((r) => r.event_type === eventType && r.message === message);
        return jsonResponse(rows);
      }
    }

    throw new Error(`Unhandled mock fetch: ${method} ${url.toString()}`);
  };
}

function makeEnv(overrides = {}) {
  return {
    STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
    STRIPE_SECRET_KEY: 'sk_test_fake',
    STRIPE_PRICE_ID: MATCHING_PRICE_ID,
    SUPABASE_URL: 'https://fake.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'fake-service-role-key',
    ...overrides,
  };
}

async function postWebhook(env, eventOverrides = {}, { badSignature = false } = {}) {
  const event = makeCheckoutSessionEvent(eventOverrides);
  const payload = JSON.stringify(event);
  const sig = badSignature
    ? 't=1700000000,v1=deadbeef'
    : await signStripePayload(payload, env.STRIPE_WEBHOOK_SECRET);
  const request = new Request(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'stripe-signature': sig, 'Content-Type': 'application/json' },
    body: payload,
  });
  return onRequestPost({ request, env });
}

// ---------------------------------------------------------------------------
// A. CORE ENTITLEMENT PATH — UNCHANGED BY THIS PATCH
// ---------------------------------------------------------------------------

test('a valid, paid, known-price session still writes the entitlement and returns 200', async (t) => {
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  const res = await postWebhook(env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.received, true);

  assert.equal(state.entitlements.length, 1);
  assert.equal(state.entitlements[0].checkout_session_id, 'cs_test_123');
  assert.equal(state.entitlements[0].course_slug, 'headspa-mastery');
  assert.equal(state.entitlements[0].purchaser_email, 'student@example.com');
});

test('an invalid signature is rejected with 400 and never writes an entitlement', async (t) => {
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  const res = await postWebhook(env, {}, { badSignature: true });
  assert.equal(res.status, 400);
  assert.equal(state.entitlements.length, 0);
  assert.equal(state.resendCalls.length, 0, 'no email attempt for a rejected signature');
});

test('a session whose price does not match STRIPE_PRICE_ID grants no access and sends no email', async (t) => {
  const state = makeState({ lineItemsPriceId: 'price_some_other_product' });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  const res = await postWebhook(env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.skipped, 'unknown_price');

  assert.equal(state.entitlements.length, 0, 'unknown price must not grant course access');
  assert.equal(state.resendCalls.length, 0);
});

// ---------------------------------------------------------------------------
// B. PAID-ENROLLMENT EMAIL — HAPPY PATH
// ---------------------------------------------------------------------------

test('a successful entitlement write sends exactly one enrollment email with the deterministic enrollment/<sessionId> idempotency key', async (t) => {
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  const res = await postWebhook(env);
  assert.equal(res.status, 200);

  assert.equal(state.resendCalls.length, 1);
  const sent = state.resendCalls[0];
  assert.equal(sent.body.to[0], 'student@example.com');
  assert.equal(sent.body.reply_to, 'support@aimtrichology.com');
  assert.match(sent.body.from, /auth\.aimtrichology\.com/);
  assert.equal(sent.headers['Idempotency-Key'], paidEnrollmentEmailIdempotencyKey('cs_test_123'));
  assert.equal(sent.headers['Idempotency-Key'], 'enrollment/cs_test_123');
  assert.match(sent.body.html, /Welcome to the Head Spa Certification Course, Jamie/);
  assert.match(sent.body.html, new RegExp(`${CANONICAL_SITE_URL.replace(/\./g, '\\.')}/success\\.html\\?session_id=cs_test_123`));
  assert.doesNotMatch(sent.body.html, /pages\.dev/, 'the CTA must never leak the webhook request origin into the email');

  const sentLog = state.aimtLogs.find((r) => r.event_type === 'paid_enrollment_email_sent');
  assert.ok(sentLog, 'a paid_enrollment_email_sent aimt_logs row must be written');
  assert.equal(sentLog.message, 'enrollment/cs_test_123');
  assert.equal(sentLog.email, 'student@example.com');
});

// ---------------------------------------------------------------------------
// B2. PR #3 REVIEW FIX — CTA MUST NEVER BE DERIVED FROM THE WEBHOOK'S OWN
//     REQUEST ORIGIN, WHICH IN PRODUCTION IS THE PAGES.DEV DOMAIN
// ---------------------------------------------------------------------------

test('even though this webhook is posted to the real production pages.dev endpoint, the enrollment email CTA resolves to the canonical aimtrichology.com domain', async (t) => {
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  // postWebhook() posts to WEBHOOK_URL, which is
  // https://aimt-site.pages.dev/api/stripe-webhook — the exact URL flagged
  // in the PR #3 review as the real Stripe dashboard webhook endpoint.
  await postWebhook(env);
  const sent = state.resendCalls[0];
  assert.equal(
    (sent.body.html.match(/https:\/\/aimtrichology\.com\/success\.html\?session_id=cs_test_123/g) || []).length > 0,
    true
  );
  assert.doesNotMatch(sent.body.html, /aimt-site\.pages\.dev/);
});

test('a checkout Session whose success_url was itself created from the pages.dev preview domain still falls back to the canonical aimtrichology.com URL', async (t) => {
  // Simulates the edge case of a real customer completing checkout while
  // browsing the pages.dev preview domain directly (so create-checkout-
  // session.js's own request origin, and therefore success_url, was
  // pages.dev too) — the fallback must still win rather than trusting a
  // non-canonical success_url.
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  await postWebhook(env, {
    success_url: 'https://aimt-site.pages.dev/success.html?session_id={CHECKOUT_SESSION_ID}',
  });
  const sent = state.resendCalls[0];
  assert.match(sent.body.html, /https:\/\/aimtrichology\.com\/success\.html\?session_id=cs_test_123/);
  assert.doesNotMatch(sent.body.html, /aimt-site\.pages\.dev/);
});

test('a missing success_url on the session falls back cleanly to the canonical URL without erroring', async (t) => {
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  await postWebhook(env, { success_url: undefined });
  assert.equal(state.resendCalls.length, 1);
  const sent = state.resendCalls[0];
  assert.match(sent.body.html, /https:\/\/aimtrichology\.com\/success\.html\?session_id=cs_test_123/);
});

test('a malformed success_url falls back cleanly to the canonical URL without erroring or failing the webhook', async (t) => {
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  const res = await postWebhook(env, { success_url: 'not a valid url {CHECKOUT_SESSION_ID}' });
  assert.equal(res.status, 200);
  const sent = state.resendCalls[0];
  assert.match(sent.body.html, /https:\/\/aimtrichology\.com\/success\.html\?session_id=cs_test_123/);
});

// ---------------------------------------------------------------------------
// C. PAYMENT SAFETY — EMAIL FAILURE MUST NEVER TOUCH THE ENTITLEMENT OR THE RESPONSE
// ---------------------------------------------------------------------------

test('missing RESEND_API_KEY is handled safely — entitlement still written, webhook still returns 200', async (t) => {
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv(); // no RESEND_API_KEY

  const res = await postWebhook(env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.received, true);

  assert.equal(state.entitlements.length, 1, 'entitlement must still be created without an API key');
  assert.equal(state.resendCalls.length, 0);
  const skippedLog = state.aimtLogs.find((r) => r.event_type === 'paid_enrollment_email_skipped');
  assert.ok(skippedLog, 'the skip reason must be logged');
  assert.match(skippedLog.message, /missing_api_key/);
});

test('a failed Resend send (non-2xx) preserves the entitlement and still returns 200', async (t) => {
  const state = makeState({ resendBehavior: 'fail' });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  const res = await postWebhook(env);
  assert.equal(res.status, 200, 'the webhook must succeed even though the email send failed');
  const data = await res.json();
  assert.equal(data.received, true);

  assert.equal(state.entitlements.length, 1);
  assert.equal(state.resendCalls.length, 1);
  const failedLog = state.aimtLogs.find((r) => r.event_type === 'paid_enrollment_email_failed');
  assert.ok(failedLog);
  assert.match(failedLog.message, /resend_http_422/);
});

test('a network-level throw from the send attempt is caught and still returns 200', async (t) => {
  const state = makeState({ resendBehavior: 'throw' });
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  const res = await postWebhook(env);
  assert.equal(res.status, 200);
  assert.equal(state.entitlements.length, 1);
  const failedLog = state.aimtLogs.find((r) => r.event_type === 'paid_enrollment_email_failed');
  assert.ok(failedLog);
  assert.match(failedLog.message, /network_error/);
});

// ---------------------------------------------------------------------------
// D. IDEMPOTENCY — A WEBHOOK RETRY MUST NOT SEND A DUPLICATE EMAIL
// ---------------------------------------------------------------------------

test('two deliveries of the same checkout.session.completed event send exactly one enrollment email', async (t) => {
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  const first = await postWebhook(env);
  assert.equal(first.status, 200);
  const second = await postWebhook(env); // Stripe redelivering the identical event
  assert.equal(second.status, 200);

  assert.equal(state.resendCalls.length, 1, 'no duplicate Resend call for a repeated checkout session id');
  // Both deliveries still upsert the entitlement (idempotent by design via
  // on_conflict=checkout_session_id at the real Supabase layer) — this mock
  // doesn't enforce the upsert semantics itself, only that the email layer
  // above it independently dedupes.
});

test('calling sendPaidEnrollmentEmail directly twice for the same session also dedupes (helper-level guarantee, not just the webhook wrapper)', async (t) => {
  const state = makeState();
  t.mock.method(globalThis, 'fetch', createFetchMock(state));
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  const params = {
    checkoutSessionId: 'cs_retry_test',
    email: 'retry@example.com',
    firstName: 'Retry',
    courseEntryUrl: 'https://aimtrichology.com/success.html?session_id=cs_retry_test',
  };

  const first = await sendPaidEnrollmentEmail(env, params);
  assert.equal(first.sent, true);
  assert.equal(first.attempted, true);
  assert.equal(state.resendCalls.length, 1);

  const second = await sendPaidEnrollmentEmail(env, params);
  assert.equal(second.sent, true);
  assert.equal(second.deduped, true);
  assert.equal(second.attempted, false);
  assert.equal(state.resendCalls.length, 1, 'no duplicate Resend call for a repeated idempotency key');
});

test('no real network call is made anywhere in this file — every fetch is routed through the in-process mock', async (t) => {
  const state = makeState();
  const seenUrls = [];
  t.mock.method(globalThis, 'fetch', async (...args) => {
    seenUrls.push(typeof args[0] === 'string' ? args[0] : args[0].url);
    return createFetchMock(state)(...args);
  });
  const env = makeEnv({ RESEND_API_KEY: 're_test_123' });

  await postWebhook(env);
  for (const url of seenUrls) {
    assert.ok(
      url.startsWith('https://api.stripe.com/') || url.startsWith('https://fake.supabase.co/') || url.startsWith(RESEND_URL),
      `unexpected fetch target: ${url}`
    );
  }
});
