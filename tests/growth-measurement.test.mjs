// AIMT Growth — Step 1 (measurement + attribution) coverage.
//
// Runs the REAL handlers (collect, create-checkout-session, stripe-webhook,
// admin growth views) against an in-memory fake of Supabase REST/Auth and
// Stripe, plus the pure taxonomy/report functions. No network leaves the
// process.
//
// Run: node --test tests/growth-measurement.test.mjs

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  STORED_EVENTS, DERIVED_EVENTS, BROWSER_EVENTS, sanitizeTouch, sanitizePath, sanitizeToken,
  channelFor, parseCreativeId, classifyEnrollment, dedupeKeyFor, isPaidKind,
} from '../functions/_lib/growth/taxonomy.mjs';
import { buildGrowthRow } from '../functions/_lib/growth/record.mjs';
import { prepareGrowthData, computeGrowthReport, computeScoreboard, weekStartUtc } from '../functions/_lib/growth/report.mjs';
import { onRequestPost as collect } from '../functions/api/growth/collect.js';
import { onRequestPost as createCheckout } from '../functions/api/create-checkout-session.js';
import { onRequestPost as webhook } from '../functions/api/stripe-webhook.js';
import { onRequestGet as adminGet, onRequestPost as adminPost } from '../functions/api/admin/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const SUPABASE_URL = 'https://supabase.aimt.test';
const SITE = 'https://aimtrichology.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
const VID = '11111111-1111-4111-8111-111111111111';
const SID = '22222222-2222-4222-8222-222222222222';
const DAY = 86400000;

const env = (extra = {}) => ({
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-test',
  STRIPE_SECRET_KEY: 'sk_live_test_dummy',
  STRIPE_PRICE_ID: 'price_headspa',
  STRIPE_WEBHOOK_SECRET: 'whsec_test',
  ...extra,
});

function jsonResponse(body, status = 200) {
  return new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

// ── In-memory Supabase/Stripe fake ─────────────────────────────────────
function makeDb(overrides = {}) {
  return {
    growth: [],
    growthPosts: [],
    entitlements: [],
    adminUsers: [],
    progress: [],
    completions: [],
    cadence: [],
    authUsers: [],
    audit: [],
    tokens: {},
    stripeSessions: {},
    stripeCreates: [],
    growthTableMissing: false,
    ...overrides,
  };
}

function filterRows(rows, url) {
  let out = rows;
  for (const [k, v] of url.searchParams) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'or'].includes(k)) continue;
    if (v.startsWith('eq.')) out = out.filter((r) => String(r[k]) === v.slice(3));
    if (v.startsWith('like.')) { const prefix = v.slice(5).replace(/\*$/, ''); out = out.filter((r) => String(r[k]).startsWith(prefix)); }
  }
  const offset = Number(url.searchParams.get('offset') || 0);
  const limit = Number(url.searchParams.get('limit') || 100000);
  return out.slice(offset, offset + limit);
}

function installFetch(t, db) {
  t.mock.method(globalThis, 'fetch', async (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body && typeof options.body === 'string' ? options.body : null;

    if (url.origin === 'https://api.stripe.com') {
      if (url.pathname === '/v1/checkout/sessions' && method === 'POST') {
        db.stripeCreates.push(String(options.body));
        const id = `cs_live_${db.stripeCreates.length}`;
        return jsonResponse({ id, url: `https://checkout.stripe.com/c/${id}`, client_secret: `${id}_secret` });
      }
      if (url.pathname.endsWith('/line_items')) return jsonResponse({ data: [{ price: { id: 'price_headspa' } }] });
      const m = url.pathname.match(/^\/v1\/checkout\/sessions\/([^/]+)$/);
      if (m) return db.stripeSessions[m[1]] ? jsonResponse(db.stripeSessions[m[1]]) : jsonResponse({ error: { message: 'No such session' } }, 404);
    }

    if (url.origin === 'https://api.resend.com') return jsonResponse({ id: 'email_1' });
    if (url.pathname === '/auth/v1/user') {
      const token = String(options.headers?.Authorization || '').replace('Bearer ', '');
      const user = db.tokens[token];
      return user ? jsonResponse(user) : jsonResponse({ msg: 'bad jwt' }, 401);
    }
    if (url.pathname === '/auth/v1/admin/users') return jsonResponse({ users: db.authUsers });

    const table = url.pathname.replace('/rest/v1/', '');
    if (table === 'growth_events') {
      if (db.growthTableMissing) return jsonResponse({ code: 'PGRST205', message: 'not found' }, 404);
      if (method === 'POST') {
        const row = JSON.parse(body);
        db.growthPosts.push({ row, prefer: options.headers?.Prefer, query: url.search });
        const dup = db.growth.some((r) => r.event_name === row.event_name && r.dedupe_key === row.dedupe_key);
        if (dup) return jsonResponse([], 201);
        const stored = { occurred_at: new Date().toISOString(), ...row };
        db.growth.push(stored);
        return jsonResponse([stored], 201);
      }
      return jsonResponse(filterRows(db.growth, url));
    }
    const tables = {
      course_entitlements: db.entitlements, admin_users: db.adminUsers, course_progress: db.progress,
      completions: db.completions, cadence_messages: db.cadence, admin_audit_log: db.audit, aimt_logs: [],
    };
    if (table in tables) {
      if (method === 'POST') {
        const row = JSON.parse(body);
        if (table === 'course_entitlements' && !tables[table].some((r) => r.checkout_session_id === row.checkout_session_id)) {
          tables[table].push({ granted_at: new Date().toISOString(), ...row });
        } else if (table !== 'course_entitlements') tables[table].push(row);
        return new Response(null, { status: 201 });
      }
      return jsonResponse(filterRows(tables[table], url));
    }
    throw new Error(`Unhandled fetch ${method} ${url}`);
  });
}

function collectRequest(payload, { origin = SITE, ua = UA, token } = {}) {
  const headers = { 'Content-Type': 'application/json', 'User-Agent': ua, 'CF-Connecting-IP': `ip-${Math.random()}` };
  if (origin) headers.Origin = origin;
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request(`${SITE}/api/growth/collect`, { method: 'POST', headers, body: JSON.stringify(payload) });
}

const basePayload = (extra = {}) => ({
  event: 'site_visit',
  visitor_id: crypto.randomUUID(),
  session_id: crypto.randomUUID(),
  path: '/head-spa-certification',
  first_touch: { source: 'instagram', medium: 'social', campaign: '202610_launch', content: 'reel_scalp-microscopy_myth-bust_v2', landing_path: '/head-spa-certification', at: '2026-10-01T12:00:00Z' },
  last_touch: { source: 'instagram', medium: 'social', campaign: '202610_launch', content: 'reel_scalp-microscopy_myth-bust_v2' },
  ...extra,
});

// ── Taxonomy ────────────────────────────────────────────────────────────

test('taxonomy: stored and derived events are disjoint and match the canonical 13', () => {
  const canonical = ['site_visit', 'headspa_sales_view', 'readiness_audit_start', 'readiness_audit_complete', 'lead_created',
    'checkout_start', 'paid_enrollment', 'course_activated', 'module_completed', 'cadence_used', 'service_timer_used',
    'resource_used', 'certification_issued'];
  const all = [...STORED_EVENTS, ...Object.keys(DERIVED_EVENTS)];
  assert.deepEqual([...all].sort(), [...canonical].sort());
  for (const d of Object.keys(DERIVED_EVENTS)) assert.ok(!STORED_EVENTS.includes(d));
  assert.ok(!BROWSER_EVENTS.has('checkout_start') && !BROWSER_EVENTS.has('paid_enrollment'), 'browser can never assert checkout or purchase');
  const migration = read('supabase/migrations/20261001_create_growth_events.sql');
  for (const e of STORED_EVENTS) assert.match(migration, new RegExp(`'${e}'`));
  for (const d of Object.keys(DERIVED_EVENTS)) assert.doesNotMatch(migration, new RegExp(`^\\s*'${d}'`, 'm'));
});

test('taxonomy: sanitizers drop personal data and query strings', () => {
  assert.equal(sanitizeToken('jane@example.com'), null);
  assert.equal(sanitizeToken('+1 (717) 555-0100'.replace(/[()\s]/g, '')), null);
  assert.equal(sanitizeToken(' Spring Launch '), 'spring_launch');
  assert.equal(sanitizePath('/enroll.html?email=jane@example.com#x'), '/enroll');
  assert.equal(sanitizePath('https://aimtrichology.com/head-spa-certification/?token=abc'), '/head-spa-certification');
  assert.equal(sanitizePath('not-a-path'), null);
  const touch = sanitizeTouch({ source: 'IG', term: 'me@x.com', gclid: 'Cj0K-abc_123', referrer_domain: 'https://www.Instagram.com/p/xyz?igshid=1', landing_path: '/?utm_source=ig', extra: 'nope', answers: [1, 2] });
  assert.deepEqual(touch, { source: 'ig', gclid: 'Cj0K-abc_123', referrer_domain: 'instagram.com', landing_path: '/' });
});

test('taxonomy: channel resolution and creative convention', () => {
  assert.deepEqual(channelFor({}).source, '(direct)');
  assert.equal(channelFor({ referrer_domain: 'google.com' }).medium, 'organic');
  assert.equal(channelFor({ referrer_domain: 'l.instagram.com' }).medium, 'social');
  assert.equal(channelFor({ referrer_domain: 'someblog.com' }).medium, 'referral');
  assert.deepEqual([channelFor({ gclid: 'x' }).source, channelFor({ gclid: 'x' }).medium], ['google', 'cpc']);
  assert.equal(channelFor({ source: 'tiktok', referrer_domain: 'google.com' }).source, 'tiktok', 'explicit UTM wins');
  assert.deepEqual(parseCreativeId('reel_scalp-microscopy_myth-bust_v2'), { conforming: true, raw: 'reel_scalp-microscopy_myth-bust_v2', format: 'reel', topic: 'scalp-microscopy', hook: 'myth-bust', version: 2 });
  assert.equal(parseCreativeId('email_readiness-followup_subject-a_v1').format, 'email');
  assert.equal(parseCreativeId('ad-video_headspa-ritual_ugc-testimonial_v3').format, 'ad-video');
  assert.equal(parseCreativeId('my cool video').conforming, false);
});

test('taxonomy: enrollment classification — full-price and discounted live purchases are paid; staff/manual/comp/test are not', () => {
  const ctx = { adminUserIds: new Set(['admin-1']), adminEmails: new Set(['owner@aimt.test']) };
  const k = (id, extra = {}, c = ctx) => classifyEnrollment({ checkout_session_id: id, purchaser_email: 'buyer@x.com', ...extra }, c);
  assert.equal(k('admin-grant-staff-abc'), 'staff');
  assert.equal(k('admin-grant-complimentary-abc'), 'complimentary');
  assert.equal(k('admin-grant-scholarship-abc'), 'scholarship');
  assert.equal(k('admin-grant-manual-abc'), 'manual');
  assert.equal(k('staff-grant-brandmrice'), 'staff');
  assert.equal(k('cs_test_abc'), 'test');
  assert.equal(k('cs_live_abc'), 'paid');
  assert.equal(k('cs_live_abc', { purchaser_email: 'owner@aimt.test' }), 'owner_test');
  assert.equal(k('cs_live_abc', { user_id: 'admin-1' }), 'owner_test');
  assert.equal(k('cs_live_abc', {}, { ...ctx, paidRecord: { props: { livemode: false } } }), 'test');
  assert.equal(k('cs_live_abc', {}, { ...ctx, paidRecord: { props: { amount_total: 59700, amount_subtotal: 59700, amount_discount: 0, livemode: true } } }), 'paid');
  assert.equal(k('cs_live_abc', {}, { ...ctx, paidRecord: { props: { amount_total: 49700, amount_subtotal: 59700, amount_discount: 10000, livemode: true } } }), 'paid_discounted');
  assert.equal(k('cs_live_abc', {}, { ...ctx, paidRecord: { props: { amount_total: 39700, amount_subtotal: 59700, livemode: true } } }), 'paid_discounted', 'lower total than subtotal is a discount even without a discount field');
  assert.equal(k('cs_live_abc', {}, { ...ctx, paidRecord: { props: { amount_total: 0, amount_subtotal: 59700, amount_discount: 59700, livemode: true } } }), 'zero_cost', '100% coupon = $0 paid, not a paid enrollment');
  assert.equal(k('cs_live_abc', { purchaser_email: 'owner@aimt.test' }, { ...ctx, paidRecord: { props: { amount_total: 49700, amount_discount: 10000 } } }), 'owner_test', 'internal buyers stay excluded even when discounted');
  for (const kind of ['staff', 'complimentary', 'scholarship', 'manual', 'test', 'zero_cost', 'owner_test', 'unknown']) assert.equal(isPaidKind(kind), false, kind);
  for (const kind of ['paid', 'paid_discounted']) assert.equal(isPaidKind(kind), true, kind);
  assert.equal(k('something-else'), 'unknown');
});

test('taxonomy: dedupe keys define "counts once"', () => {
  assert.equal(dedupeKeyFor('site_visit', { sessionId: SID }), `s:${SID}`);
  assert.equal(dedupeKeyFor('lead_created', { visitorId: VID }), `v:${VID}`);
  assert.equal(dedupeKeyFor('paid_enrollment', { checkoutSessionId: 'cs_live_1' }), 'cs:cs_live_1');
  assert.equal(dedupeKeyFor('service_timer_used', { userId: 'u1', now: Date.UTC(2026, 9, 1, 23) }), 'u:u1:2026-10-01');
  assert.equal(dedupeKeyFor('site_visit', { sessionId: 'not-a-uuid' }), null);
});

// ── Privacy boundary on the single writer ──────────────────────────────

test('privacy: buildGrowthRow stores only whitelisted fields', () => {
  const row = buildGrowthRow({
    eventName: 'lead_created', origin: 'browser', visitorId: VID, sessionId: SID,
    pagePath: '/head-spa-readiness?email=jane@example.com',
    firstTouch: { source: 'email', content: 'email_readiness-followup_subject-a_v1', email: 'jane@example.com' },
    props: { marketing_consent: true, email: 'jane@example.com', first_name: 'Jane', score: 74, pillar_scores: { scope: 2 }, answers: [2, 1, 0] },
  });
  const serialized = JSON.stringify(row);
  for (const leak of ['jane@example.com', 'Jane', 'pillar_scores', 'answers', '"score"']) assert.ok(!serialized.includes(leak), leak);
  assert.deepEqual(row.props, { marketing_consent: true });
  assert.equal(row.page_path, '/head-spa-readiness');
  assert.deepEqual(Object.keys(row).sort(), ['checkout_session_id', 'dedupe_key', 'event_name', 'first_touch', 'is_internal', 'last_touch', 'origin', 'page_path', 'props', 'session_id', 'user_id', 'visitor_id']);
  assert.equal(buildGrowthRow({ eventName: 'cadence_used', visitorId: VID, sessionId: SID }), null, 'derived events are never written');
  assert.equal(buildGrowthRow({ eventName: 'resource_used', userId: VID, props: { resource: 'Hello World!' } }), null);
});

// ── Collector endpoint ─────────────────────────────────────────────────

test('collect: accepts a same-origin site_visit and stores a sanitized row', async (t) => {
  const db = makeDb();
  installFetch(t, db);
  const res = await collect({ request: collectRequest(basePayload({ path: '/head-spa-certification?utm_source=x&email=a@b.co' })), env: env() });
  assert.equal(res.status, 204);
  assert.equal(db.growth.length, 1);
  const row = db.growth[0];
  assert.equal(row.origin, 'browser');
  assert.equal(row.page_path, '/head-spa-certification');
  assert.equal(row.first_touch.content, 'reel_scalp-microscopy_myth-bust_v2');
  assert.match(db.growthPosts[0].prefer, /ignore-duplicates/);
  assert.match(db.growthPosts[0].query, /on_conflict=event_name,dedupe_key/);
});

test('collect: a reload (same session) is ignored as a duplicate', async (t) => {
  const db = makeDb();
  installFetch(t, db);
  const p = basePayload();
  await collect({ request: collectRequest(p), env: env() });
  await collect({ request: collectRequest(p), env: env() });
  assert.equal(db.growth.length, 1);
});

test('collect: rejects cross-origin, bots, server-only events, and malformed ids with no write', async (t) => {
  const db = makeDb();
  installFetch(t, db);
  assert.equal((await collect({ request: collectRequest(basePayload(), { origin: 'https://evil.example' }), env: env() })).status, 403);
  assert.equal((await collect({ request: collectRequest(basePayload(), { origin: null }), env: env() })).status, 403);
  await collect({ request: collectRequest(basePayload(), { ua: 'Googlebot/2.1' }), env: env() });
  assert.equal((await collect({ request: collectRequest(basePayload({ event: 'paid_enrollment' })), env: env() })).status, 400);
  assert.equal((await collect({ request: collectRequest(basePayload({ event: 'checkout_start' })), env: env() })).status, 400);
  assert.equal((await collect({ request: collectRequest(basePayload({ event: 'cadence_used' })), env: env() })).status, 400);
  assert.equal((await collect({ request: collectRequest(basePayload({ visitor_id: 'abc' })), env: env() })).status, 400);
  assert.equal(db.growth.length, 0);
});

test('collect: user-bound events need a real session; admin accounts are marked internal', async (t) => {
  const db = makeDb({
    tokens: { 'student-token': { id: 'aaaaaaaa-0000-4000-8000-000000000001', email: 's@x.com' }, 'owner-token': { id: 'aaaaaaaa-0000-4000-8000-000000000002', email: 'o@x.com' } },
    adminUsers: [{ user_id: 'aaaaaaaa-0000-4000-8000-000000000002', role: 'owner', active: true }],
  });
  installFetch(t, db);
  assert.equal((await collect({ request: collectRequest(basePayload({ event: 'service_timer_used', props: { protocol: 'core' } })), env: env() })).status, 401);
  await collect({ request: collectRequest(basePayload({ event: 'service_timer_used', props: { protocol: 'core' }, user_id: 'spoofed' }), { token: 'student-token' }), env: env() });
  await collect({ request: collectRequest(basePayload({ event: 'resource_used', props: { resource: 'module-10-checklist' } }), { token: 'owner-token' }), env: env() });
  assert.equal(db.growth.length, 2);
  assert.equal(db.growth[0].user_id, 'aaaaaaaa-0000-4000-8000-000000000001');
  assert.equal(db.growth[0].is_internal, false);
  assert.equal(db.growth[1].is_internal, true);
});

// ── Checkout + webhook authority ───────────────────────────────────────

test('checkout: records checkout_start with attribution and leaves the Stripe request unchanged', async (t) => {
  const db = makeDb();
  installFetch(t, db);
  const req = (growth) => new Request(`${SITE}/api/create-checkout-session`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course: 'headspa-mastery', ui: 'embedded', growth }),
  });
  const growth = { visitor_id: VID, session_id: SID, first_touch: { source: 'tiktok', medium: 'social', content: 'short_headspa-asmr_hook-a_v1' }, last_touch: { source: 'email', medium: 'email' }, path: '/enroll', price: 1 };
  const e = env({ STRIPE_PUBLISHABLE_KEY: 'pk_live_dummy' });
  const res = await createCheckout({ request: req(growth), env: e });
  const resNoGrowth = await createCheckout({ request: req(undefined), env: e });
  assert.equal(res.status, 200);
  assert.equal(resNoGrowth.status, 200);
  assert.equal(db.stripeCreates[0], db.stripeCreates[1], 'growth payload never changes the Stripe Checkout request');
  assert.ok(!db.stripeCreates[0].includes('tiktok'));
  const starts = db.growth.filter((r) => r.event_name === 'checkout_start');
  assert.equal(starts.length, 2);
  assert.equal(starts[0].checkout_session_id, 'cs_live_1');
  assert.equal(starts[0].origin, 'server');
  assert.equal(starts[0].visitor_id, VID);
  assert.equal(starts[0].first_touch.content, 'short_headspa-asmr_hook-a_v1');
  assert.deepEqual(starts[0].props, { ui: 'embedded', livemode: true });
});

test('checkout: a failing growth write never breaks checkout', async (t) => {
  const db = makeDb({ growthTableMissing: true });
  installFetch(t, db);
  const res = await createCheckout({ request: new Request(`${SITE}/api/create-checkout-session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ growth: { visitor_id: VID } }) }), env: env() });
  assert.equal(res.status, 200);
  assert.ok((await res.json()).url);
});

async function signedWebhook(event) {
  const payload = JSON.stringify(event);
  const ts = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('whsec_test'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${ts}.${payload}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return new Request(`${SITE}/api/stripe-webhook`, { method: 'POST', headers: { 'stripe-signature': `t=${ts},v1=${hex}` }, body: payload });
}
const paidEvent = (id = 'cs_live_9') => ({
  type: 'checkout.session.completed',
  data: { object: { id, payment_status: 'paid', status: 'complete', amount_total: 59700, amount_subtotal: 59700, total_details: { amount_discount: 0 }, currency: 'usd', livemode: true, customer_details: { email: 'Buyer@Example.com', name: 'Buyer Person' } } },
});

test('webhook: writes one Stripe-verified paid_enrollment per session, idempotent on redelivery, no PII', async (t) => {
  const db = makeDb();
  installFetch(t, db);
  const r1 = await webhook({ request: await signedWebhook(paidEvent()), env: env() });
  const r2 = await webhook({ request: await signedWebhook(paidEvent()), env: env() });
  assert.equal(r1.status, 200);
  assert.equal(r2.status, 200);
  const paid = db.growth.filter((r) => r.event_name === 'paid_enrollment');
  assert.equal(paid.length, 1);
  assert.deepEqual(paid[0].props, { amount_total: 59700, amount_subtotal: 59700, amount_discount: 0, currency: 'usd', livemode: true, course_slug: 'headspa-mastery' });
  assert.ok(!JSON.stringify(paid[0]).toLowerCase().includes('buyer'));
  assert.equal(db.entitlements.length, 1, 'entitlement write unchanged');
});

test('webhook: a growth outage never changes the webhook response or entitlement', async (t) => {
  const db = makeDb({ growthTableMissing: true });
  installFetch(t, db);
  const res = await webhook({ request: await signedWebhook(paidEvent('cs_live_10')), env: env() });
  assert.equal(res.status, 200);
  assert.equal(db.entitlements.length, 1);
});

test('webhook: bad signature writes nothing to growth', async (t) => {
  const db = makeDb();
  installFetch(t, db);
  const res = await webhook({ request: new Request(`${SITE}/api/stripe-webhook`, { method: 'POST', headers: { 'stripe-signature': 't=1,v1=bad' }, body: JSON.stringify(paidEvent()) }), env: env() });
  assert.equal(res.status, 400);
  assert.equal(db.growth.length, 0);
});

// ── Reporting ──────────────────────────────────────────────────────────

const NOW = Date.UTC(2026, 9, 1, 12);
function ev(name, daysAgo, extra = {}) {
  return { occurred_at: new Date(NOW - daysAgo * DAY).toISOString(), event_name: name, origin: ['checkout_start', 'paid_enrollment'].includes(name) ? 'server' : 'browser', is_internal: false, first_touch: {}, last_touch: {}, props: {}, ...extra };
}
const IG = { source: 'instagram', medium: 'social', campaign: '202610_launch', content: 'reel_scalp-microscopy_myth-bust_v2' };

function fixture() {
  const v = (n) => `00000000-0000-4000-8000-00000000000${n}`;
  const s = (n) => `10000000-0000-4000-8000-00000000000${n}`;
  return {
    growthTable: 'present',
    events: [
      ev('site_visit', 5, { visitor_id: v(1), session_id: s(1), first_touch: IG, last_touch: IG }),
      ev('headspa_sales_view', 5, { visitor_id: v(1), session_id: s(1), first_touch: IG, last_touch: IG }),
      ev('readiness_audit_start', 5, { visitor_id: v(1), session_id: s(1), first_touch: IG }),
      ev('readiness_audit_complete', 5, { visitor_id: v(1), session_id: s(1), first_touch: IG }),
      ev('lead_created', 5, { visitor_id: v(1), session_id: s(1), first_touch: IG, props: { marketing_consent: true } }),
      ev('checkout_start', 4, { visitor_id: v(1), session_id: s(1), checkout_session_id: 'cs_live_paid', first_touch: IG, last_touch: { source: 'email', medium: 'email' }, props: { livemode: true } }),
      ev('paid_enrollment', 4, { checkout_session_id: 'cs_live_paid', props: { amount_total: 59700, currency: 'usd', livemode: true } }),
      ev('site_visit', 3, { visitor_id: v(2), session_id: s(2) }),
      ev('checkout_start', 3, { visitor_id: v(2), session_id: s(2), checkout_session_id: 'cs_live_abandoned', props: { livemode: true } }),
      // Owner browsing + owner's own live purchase
      ev('site_visit', 2, { visitor_id: v(3), session_id: s(3), is_internal: true }),
      ev('paid_enrollment', 2, { checkout_session_id: 'cs_live_owner', props: { amount_total: 59700, currency: 'usd', livemode: true } }),
      ev('service_timer_used', 1, { visitor_id: v(1), session_id: s(1), user_id: 'u-student' }),
    ],
    entitlements: [
      { checkout_session_id: 'cs_live_paid', purchaser_email: 'buyer@x.com', user_id: null, granted_at: new Date(NOW - 4 * DAY).toISOString() },
      { checkout_session_id: 'cs_live_owner', purchaser_email: 'owner@aimt.test', user_id: null, granted_at: new Date(NOW - 2 * DAY).toISOString() },
      { checkout_session_id: 'admin-grant-staff-1', purchaser_email: 'staff@aimt.test', user_id: 'u-staff', granted_at: new Date(NOW - 2 * DAY).toISOString() },
      { checkout_session_id: 'admin-grant-complimentary-1', purchaser_email: 'friend@x.com', user_id: 'u-comp', granted_at: new Date(NOW - 1 * DAY).toISOString() },
      { checkout_session_id: 'cs_test_qa', purchaser_email: 'qa@x.com', user_id: null, granted_at: new Date(NOW - 1 * DAY).toISOString() },
    ],
    adminUsers: [{ user_id: 'u-owner', active: true }],
    users: [{ id: 'u-student', email: 'buyer@x.com' }, { id: 'u-owner', email: 'owner@aimt.test' }, { id: 'u-staff', email: 'staff@aimt.test' }, { id: 'u-comp', email: 'friend@x.com' }],
    progress: [{ user_id: 'u-student', updated_at: new Date(NOW - 1 * DAY).toISOString(), progress: { 0: { complete: true, startedAt: NOW - 4 * DAY, completedAt: NOW - 3 * DAY } }, intro_complete: true }],
    completions: [{ user_id: 'u-student', completed_at: new Date(NOW - 1 * DAY).toISOString(), revoked: false }, { user_id: 'u-staff', completed_at: new Date(NOW - 1 * DAY).toISOString(), revoked: false }],
    cadenceMessages: [{ user_id: 'u-student', mode: 'ask_cadence', created_at: new Date(NOW - 2 * DAY).toISOString() }],
    cadenceTable: 'present',
  };
}

test('report: the full funnel with attribution surviving to revenue; non-paid enrollments excluded', () => {
  const prepared = prepareGrowthData(fixture());
  const r = computeGrowthReport(prepared, { start: NOW - 30 * DAY, end: NOW, model: 'first', now: NOW });
  assert.equal(r.acquisition.visitors.value, 2, 'internal owner visitor excluded');
  assert.equal(r.acquisition.salesPageVisitors.value, 1);
  assert.equal(r.leads.readinessStarts.value, 1);
  assert.equal(r.leads.leads.value, 1);
  assert.equal(r.sales.checkoutStarts.value, 2);
  assert.equal(r.sales.paidEnrollments.value, 1, 'owner purchase, staff, complimentary and Stripe test are not paid');
  assert.deepEqual(r.sales.paidEnrollments.excludedByKind, { owner_test: 1, staff: 1, complimentary: 1, test: 1 });
  assert.deepEqual([r.sales.paidEnrollments.fullPrice, r.sales.paidEnrollments.discounted], [1, 0]);
  assert.equal(r.sales.revenue.value, 59700, 'owner purchase revenue is excluded');
  assert.equal(r.sales.checkoutToPaid.value, 0.5);
  assert.equal(r.sales.leadToPurchase.value, 1);
  assert.equal(r.sales.visitToPaid.value, 0.5);
  assert.equal(r.students.cohortSize.value, 1);
  assert.equal(r.students.activationRate.value, 1);
  assert.equal(r.students.certifications.value, 2, 'headline counts every valid credential');
  assert.equal(r.students.certifications.paidStudents, 1);
  assert.equal(r.students.medianDaysToCertification.value, 3);
  assert.equal(r.adoption.cadenceUsers.value, 1);
  assert.equal(r.adoption.serviceTimerUsers.value, 1);
  assert.equal(r.adoption.usage30d.status, 'insufficient', 'nobody enrolled 30+ days → honest insufficient state, not 0');
  const creative = r.attribution.creative.find((x) => x.content === 'reel_scalp-microscopy_myth-bust_v2');
  assert.deepEqual([creative.visitors, creative.leads, creative.paid, creative.revenue], [1, 1, 1, 59700]);
  assert.equal(creative.creative.topic, 'scalp-microscopy');
  const last = computeGrowthReport(prepared, { start: NOW - 30 * DAY, end: NOW, model: 'last', now: NOW });
  assert.equal(last.attribution.channel.find((x) => x.paid === 1).source, 'email', 'last-touch credits the most recent meaningful touch');
});

test('report: uninstrumented metrics are "not measurable", never fake zeroes', () => {
  const data = { ...fixture(), events: [], growthTable: 'missing' };
  const r = computeGrowthReport(prepareGrowthData(data), { start: NOW - 7 * DAY, end: NOW, now: NOW });
  for (const m of [r.acquisition.visitors, r.acquisition.salesPageVisitors, r.leads.leads, r.sales.checkoutStarts, r.adoption.serviceTimerUsers, r.adoption.resourceUsers, r.sales.visitToPaid]) {
    assert.equal(m.status, 'not_measurable');
    assert.equal(m.value, null);
  }
  assert.equal(r.sales.paidEnrollments.value, 1, 'authoritative enrollment counts still work without growth_events');
  assert.equal(r.sales.revenue.status, 'not_measurable', 'paid without a Stripe revenue record is not shown as $0');
  assert.equal(r.attribution, null);
});

test('report: range before instrumentation is flagged partial; scoreboard has the canonical rows', () => {
  const prepared = prepareGrowthData(fixture());
  const all = computeGrowthReport(prepared, { start: -Infinity, end: NOW, now: NOW });
  assert.equal(all.acquisition.visitors.status, 'partial');
  const sb = computeScoreboard(prepared, { weeks: 2, now: NOW });
  assert.equal(sb.columns.length, 3);
  assert.equal(sb.columns[0].partial, true);
  assert.equal(sb.columns[0].weekStart, new Date(weekStartUtc(NOW)).toISOString().slice(0, 10));
  for (const key of ['qualified_visitors', 'sales_page_visitors', 'readiness_starts', 'readiness_completions', 'leads', 'checkout_starts', 'paid_enrollments', 'revenue', 'site_to_purchase', 'lead_to_purchase', 'activation_rate', 'certification_rate', 'median_days_to_certification', 'cadence_adoption', 'service_timer_adoption', 'resource_adoption', 'usage_30d', 'usage_90d', 'referrals']) {
    assert.ok(sb.metrics.some((m) => m.key === key), key);
  }
  assert.equal(sb.columns[1].values.usage_30d.status, 'current_only');
  const preTracking = computeScoreboard(prepared, { weeks: 3, now: NOW }).columns[3];
  for (const key of ['qualified_visitors', 'leads', 'checkout_starts', 'site_to_purchase']) {
    assert.equal(preTracking.values[key].status, 'not_measurable', `${key}: a week before tracking began is not a zero`);
    assert.equal(preTracking.values[key].value, null);
  }
  assert.equal(preTracking.values.paid_enrollments.value, 0, 'authoritative counts stay real zeroes');
  assert.equal(sb.columns[0].values.referrals.status, 'not_measurable');
});

test('report: data loader never selects Cadence content or the full progress blob', () => {
  const src = read('functions/_lib/growth/report.mjs');
  const cadenceSelect = src.match(/'cadence_messages', `select=([^&`]+)/)[1];
  assert.equal(cadenceSelect, 'user_id,mode,created_at');
  const progressSelect = src.match(/'course_progress', `select=([^&`]+)/)[1];
  assert.ok(!/(^|,)state(,|$)/.test(progressSelect), 'never the whole state blob');
  assert.match(progressSelect, /state->progress/);
});

// ── Admin authorization ────────────────────────────────────────────────

function adminRequest(view, token, method = 'GET', body) {
  const url = method === 'GET' ? `${SITE}/api/admin?view=${view}` : `${SITE}/api/admin`;
  return new Request(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
}

test('admin growth: owner/admin only; support and students are refused', async (t) => {
  const f = fixture();
  const db = makeDb({
    growth: f.events,
    entitlements: f.entitlements.map((e) => ({ ...e, course_slug: 'headspa-mastery' })),
    adminUsers: [{ user_id: 'u-owner', role: 'owner', active: true }, { user_id: 'u-support', role: 'support', active: true }],
    authUsers: f.users,
    tokens: { owner: { id: 'u-owner', email: 'owner@aimt.test' }, support: { id: 'u-support', email: 's@aimt.test' }, student: { id: 'u-student', email: 'buyer@x.com' } },
  });
  installFetch(t, db);
  assert.equal((await adminGet({ request: adminRequest('growth&range=all', 'student'), env: env() })).status, 403);
  assert.equal((await adminGet({ request: adminRequest('growth&range=all', 'support'), env: env() })).status, 403);
  assert.equal((await adminGet({ request: adminRequest('growth-scoreboard', 'support'), env: env() })).status, 403);
  const ok = await adminGet({ request: adminRequest('growth&range=all', 'owner'), env: env() });
  assert.equal(ok.status, 200);
  const body = await ok.json();
  assert.equal(body.sales.paidEnrollments.value, 1);
  assert.ok(!JSON.stringify(body).includes('buyer@x.com'), 'growth report exposes no student emails');
  const sb = await adminGet({ request: adminRequest('growth-scoreboard&weeks=4', 'owner'), env: env() });
  assert.equal(sb.status, 200);
});

test('admin growth: Stripe revenue reconciliation backfills only paid sessions, idempotently', async (t) => {
  const db = makeDb({
    entitlements: [
      { checkout_session_id: 'cs_live_old', course_slug: 'headspa-mastery', purchaser_email: 'a@x.com', granted_at: '2026-08-01T00:00:00Z' },
      { checkout_session_id: 'cs_live_unpaid', course_slug: 'headspa-mastery', purchaser_email: 'b@x.com', granted_at: '2026-08-02T00:00:00Z' },
      { checkout_session_id: 'admin-grant-staff-x', course_slug: 'headspa-mastery', purchaser_email: 'c@x.com', granted_at: '2026-08-02T00:00:00Z' },
    ],
    adminUsers: [{ user_id: 'u-owner', role: 'owner', active: true }, { user_id: 'u-support', role: 'support', active: true }],
    tokens: { owner: { id: 'u-owner', email: 'o@x.com' }, support: { id: 'u-support', email: 's@x.com' } },
    stripeSessions: {
      cs_live_old: { id: 'cs_live_old', payment_status: 'paid', amount_total: 59700, amount_subtotal: 59700, currency: 'usd', livemode: true, created: 1754006400 },
      cs_live_unpaid: { id: 'cs_live_unpaid', payment_status: 'unpaid', amount_total: 59700, currency: 'usd', livemode: true },
    },
  });
  installFetch(t, db);
  assert.equal((await adminPost({ request: adminRequest('', 'support', 'POST', { action: 'growth_reconcile_revenue' }), env: env() })).status, 403);
  const r = await (await adminPost({ request: adminRequest('', 'owner', 'POST', { action: 'growth_reconcile_revenue' }), env: env() })).json();
  assert.deepEqual([r.recorded, r.skipped], [1, 1]);
  const again = await (await adminPost({ request: adminRequest('', 'owner', 'POST', { action: 'growth_reconcile_revenue' }), env: env() })).json();
  assert.equal(again.recorded, 0);
  assert.equal(db.growth.filter((x) => x.event_name === 'paid_enrollment').length, 1);
  assert.equal(db.growth[0].props.reconciled, true);
  assert.ok(db.audit.some((a) => a.action === 'growth_reconcile_revenue'));
});

// ── Static guarantees ──────────────────────────────────────────────────

function listHtml(dir = ROOT, out = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.git', 'docs', 'tests', 'scripts', 'AIMT-Listen-Mode-Final', 'research-import', 'supabase', 'cadence-worker'].includes(name)) continue;
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) listHtml(p, out);
    else if (name.endsWith('.html')) out.push(path.relative(ROOT, p));
  }
  return out;
}

test('static: no third-party ad pixels, tag managers, or session replay on any page', () => {
  const forbidden = /fbq\(|connect\.facebook\.net|analytics\.tiktok\.com|ttq\.|googletagmanager\.com|gtag\(|google-analytics\.com|doubleclick\.net|hotjar|fullstory|clarity\.ms|mouseflow|logrocket|smartlook/i;
  for (const f of [...listHtml(), 'assets/js/aimt-growth.js', 'assets/js/aimt-public-nav.js']) {
    assert.doesNotMatch(read(f), forbidden, f);
  }
});

test('static: growth client is wired where the funnel happens', () => {
  assert.match(read('assets/js/aimt-public-nav.js'), /\/assets\/js\/aimt-growth\.js/);
  for (const f of ['head-spa-readiness.html', 'enroll.html', 'aimt-service-timer.html', 'headspa-mastery.html', 'admin.html']) {
    assert.match(read(f), /aimt-growth\.js/, f);
  }
  const readiness = read('head-spa-readiness.html');
  for (const e of ['readiness_audit_start', 'readiness_audit_complete', 'lead_created']) assert.match(readiness, new RegExp(`track\\('${e}'`));
  assert.doesNotMatch(readiness.match(/track\('lead_created'[^;]*;/)[0], /email|first_name|score|answers/);
  assert.match(read('enroll.html'), /growth: window\.AIMTGrowth \? window\.AIMTGrowth\.checkoutPayload\(\) : null/);
  assert.match(read('aimt-service-timer.html'), /track\('service_timer_used'/);
  assert.match(read('admin.html'), /markInternal\(true\)/);
  assert.match(read('privacy.html'), /Website measurement/);
  assert.match(read('privacy.html'), /Global Privacy Control/);
});

test('static: headspa-mastery.html change is the single script tag', () => {
  const src = read('headspa-mastery.html');
  assert.equal((src.match(/aimt-growth/g) || []).length, 1);
});

// ── Discounted purchases are paid (Step 1 closeout) ────────────────────

test('webhook: a discounted live purchase records the actual gross amount paid', async (t) => {
  const db = makeDb();
  installFetch(t, db);
  const event = paidEvent('cs_live_discount');
  Object.assign(event.data.object, { amount_total: 49700, amount_subtotal: 59700, total_details: { amount_discount: 10000 } });
  const res = await webhook({ request: await signedWebhook(event), env: env() });
  assert.equal(res.status, 200);
  const paid = db.growth.find((r) => r.event_name === 'paid_enrollment');
  assert.equal(paid.props.amount_total, 49700);
  assert.equal(paid.props.amount_discount, 10000);
  assert.equal(db.entitlements.length, 1, 'payment authority unchanged: entitlement written exactly as before');
});

test('report: full-price and discounted live purchases are both paid, at actual gross; non-customer grants are not', () => {
  const data = fixture();
  data.events.push(
    ev('checkout_start', 2, { visitor_id: '00000000-0000-4000-8000-000000000009', session_id: '10000000-0000-4000-8000-000000000009', checkout_session_id: 'cs_live_disc', first_touch: { source: 'partner_salon', medium: 'partner', content: 'link_partner-intro_code-a_v1' }, props: { livemode: true } }),
    ev('paid_enrollment', 2, { checkout_session_id: 'cs_live_disc', props: { amount_total: 49700, amount_subtotal: 59700, amount_discount: 10000, currency: 'usd', livemode: true } }),
    ev('paid_enrollment', 1, { checkout_session_id: 'cs_live_free', props: { amount_total: 0, amount_subtotal: 59700, amount_discount: 59700, currency: 'usd', livemode: true } }),
  );
  data.entitlements.push(
    { checkout_session_id: 'cs_live_disc', purchaser_email: 'disc@x.com', user_id: null, granted_at: new Date(NOW - 2 * DAY).toISOString() },
    { checkout_session_id: 'cs_live_free', purchaser_email: 'free@x.com', user_id: null, granted_at: new Date(NOW - 1 * DAY).toISOString() },
    { checkout_session_id: 'admin-grant-scholarship-1', purchaser_email: 'sch@x.com', user_id: null, granted_at: new Date(NOW - 1 * DAY).toISOString() },
    { checkout_session_id: 'admin-grant-manual-1', purchaser_email: 'man@x.com', user_id: null, granted_at: new Date(NOW - 1 * DAY).toISOString() },
  );
  const r = computeGrowthReport(prepareGrowthData(data), { start: NOW - 30 * DAY, end: NOW, model: 'first', now: NOW });
  assert.equal(r.sales.paidEnrollments.value, 2, 'full-price + discounted');
  assert.deepEqual([r.sales.paidEnrollments.fullPrice, r.sales.paidEnrollments.discounted], [1, 1]);
  assert.equal(r.sales.revenue.value, 59700 + 49700, 'gross revenue uses the amount actually paid');
  assert.deepEqual(r.sales.paidEnrollments.excludedByKind, { owner_test: 1, staff: 1, complimentary: 1, scholarship: 1, manual: 1, test: 1, zero_cost: 1 });
  assert.equal(r.sales.checkoutToPaid.value, 2 / 3, 'discounted buyer counts as a converted checkout');
  const partner = r.attribution.creative.find((x) => x.content === 'link_partner-intro_code-a_v1');
  assert.deepEqual([partner.paid, partner.revenue], [1, 49700], 'discounted purchase is attributed to its acquisition source');
  assert.equal(r.students.cohortSize.value, 2, 'discounted buyer is a paid student');
});

// ── Certifications issued = every valid credential (hotfix) ────────────

function certFixture({ completions, entitlements, users }) {
  return {
    growthTable: 'present', events: [], adminUsers: [], progress: [], cadenceMessages: [], cadenceTable: 'present',
    entitlements, users, completions,
  };
}
const iso = (daysAgo) => new Date(NOW - daysAgo * DAY).toISOString();

test('certifications: a staff/manual credential with no paid credential still counts as issued; rate stays paid-cohort', () => {
  const data = certFixture({
    users: [{ id: 'u-staff', email: 'staff@aimt.test' }, { id: 'u-buyer', email: 'buyer@x.com' }],
    entitlements: [
      { checkout_session_id: 'admin-grant-staff-1', purchaser_email: 'staff@aimt.test', user_id: 'u-staff', granted_at: iso(20) },
      { checkout_session_id: 'cs_live_buyer', purchaser_email: 'buyer@x.com', user_id: 'u-buyer', granted_at: iso(10) },
    ],
    completions: [{ user_id: 'u-staff', completed_at: iso(2), revoked: false }],
  });
  const r = computeGrowthReport(prepareGrowthData(data), { start: NOW - 30 * DAY, end: NOW, now: NOW });
  assert.equal(r.students.certifications.value, 1);
  assert.equal(r.students.certifications.paidStudents, 0);
  assert.equal(r.students.certificationRate.value, 0, 'rate = paid cohort certified / paid cohort');
  assert.deepEqual([r.students.certificationRate.numerator, r.students.certificationRate.denominator], [0, 1]);
  assert.equal(r.students.medianDaysToCertification.status, 'insufficient', 'median stays paid-only');
});

test('certifications: one paid + one non-paid credential → headline 2, paid subset 1', () => {
  const data = certFixture({
    users: [{ id: 'u-comp', email: 'comp@x.com' }, { id: 'u-buyer', email: 'buyer@x.com' }],
    entitlements: [
      { checkout_session_id: 'admin-grant-complimentary-1', purchaser_email: 'comp@x.com', user_id: 'u-comp', granted_at: iso(20) },
      { checkout_session_id: 'cs_live_buyer', purchaser_email: 'buyer@x.com', user_id: 'u-buyer', granted_at: iso(10) },
    ],
    completions: [
      { user_id: 'u-comp', completed_at: iso(3), revoked: false },
      { user_id: 'u-buyer', completed_at: iso(1), revoked: false },
    ],
  });
  const r = computeGrowthReport(prepareGrowthData(data), { start: NOW - 30 * DAY, end: NOW, now: NOW });
  assert.equal(r.students.certifications.value, 2);
  assert.equal(r.students.certifications.paidStudents, 1);
  assert.deepEqual([r.students.certificationRate.numerator, r.students.certificationRate.denominator], [1, 1]);
  assert.equal(r.students.medianDaysToCertification.n, 1);
});

test('certifications: revoked credentials and credentials outside the range do not count', () => {
  const data = certFixture({
    users: [{ id: 'u-a', email: 'a@x.com' }, { id: 'u-b', email: 'b@x.com' }, { id: 'u-c', email: 'c@x.com' }],
    entitlements: [
      { checkout_session_id: 'cs_live_a', purchaser_email: 'a@x.com', user_id: 'u-a', granted_at: iso(40) },
      { checkout_session_id: 'admin-grant-manual-b', purchaser_email: 'b@x.com', user_id: 'u-b', granted_at: iso(40) },
    ],
    completions: [
      { user_id: 'u-a', completed_at: iso(2), revoked: true },
      { user_id: 'u-b', completed_at: iso(2), revoked: true },
      { user_id: 'u-c', completed_at: iso(20), revoked: false }, // valid, but outside 7d
    ],
  });
  const prepared = prepareGrowthData(data);
  const r7 = computeGrowthReport(prepared, { start: NOW - 7 * DAY, end: NOW, now: NOW });
  assert.equal(r7.students.certifications.value, 0);
  assert.equal(r7.students.certifications.paidStudents, 0);
  const r30 = computeGrowthReport(prepared, { start: NOW - 30 * DAY, end: NOW, now: NOW });
  assert.equal(r30.students.certifications.value, 1, 'a valid credential counts even with no matching entitlement row');
});
