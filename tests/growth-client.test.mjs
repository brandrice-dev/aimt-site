// AIMT Growth — browser client (assets/js/aimt-growth.js) behavior.
//
// Executes the real script in a node:vm sandbox with a minimal fake
// window/document/localStorage and a captured fetch, so the attribution,
// session, reload, opt-out, and privacy rules are verified as shipped.
//
// Run: node --test tests/growth-client.test.mjs

import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = readFileSync(path.join(ROOT, 'assets/js/aimt-growth.js'), 'utf8');

function makeStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    get length() { return map.size; },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map,
  };
}

function load({ url, referrer = '', storage = makeStorage(), navigatorExtra = {}, landingVisible = true, clock = { now: Date.UTC(2026, 9, 1, 12) } }) {
  const u = new URL(url);
  const sent = [];
  const timers = [];
  const listeners = {};
  const RealDate = Date;
  class FakeDate extends RealDate {
    constructor(...a) { super(...(a.length ? a : [clock.now])); }
    static now() { return clock.now; }
  }
  const window = {
    location: { href: u.href, pathname: u.pathname, search: u.search, hostname: u.hostname },
    localStorage: storage,
    crypto: globalThis.crypto,
    getComputedStyle: () => ({ display: landingVisible ? 'flex' : 'none' }),
  };
  const document = {
    referrer,
    visibilityState: 'visible',
    addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); },
    getElementById: (id) => (id === 'landingPage' ? {} : null),
  };
  const sandbox = {
    window, document,
    navigator: { ...navigatorExtra },
    URL, URLSearchParams, JSON, Object, Array, String, Number, Uint8Array,
    Date: FakeDate,
    setTimeout: (fn, ms) => { timers.push({ fn, at: clock.now + ms }); return timers.length; },
    clearTimeout: () => {},
    fetch: (endpoint, opts) => { sent.push({ endpoint, opts, body: JSON.parse(opts.body) }); return Promise.resolve({ ok: true }); },
  };
  vm.runInNewContext(SRC, sandbox);
  const advance = (ms) => {
    clock.now += ms;
    for (const t of timers.splice(0)) if (t.at <= clock.now) t.fn(); else timers.push(t);
  };
  return { api: window.AIMTGrowth, sent, storage, advance, clock };
}

test('first visit: captures UTM attribution and sends one qualified site_visit after 5s', () => {
  const page = load({ url: 'https://aimtrichology.com/?utm_source=Instagram&utm_medium=social&utm_campaign=202610_launch&utm_content=reel_scalp-microscopy_myth-bust_v2&utm_term=jane@example.com&fbclid=zzz&email=jane@example.com', referrer: 'https://l.instagram.com/' });
  assert.equal(page.sent.length, 0, 'nothing before the visit qualifies');
  page.advance(5100);
  assert.equal(page.sent.length, 1);
  const b = page.sent[0].body;
  assert.equal(b.event, 'site_visit');
  assert.equal(page.sent[0].endpoint, '/api/growth/collect');
  assert.equal(b.path, '/');
  assert.equal(b.first_touch.source, 'instagram');
  assert.equal(b.first_touch.content, 'reel_scalp-microscopy_myth-bust_v2');
  assert.equal(b.first_touch.referrer_domain, 'l.instagram.com');
  assert.equal(b.first_touch.term, undefined, 'email-like utm_term dropped');
  const raw = JSON.stringify(b);
  assert.ok(!raw.includes('jane@example.com') && !raw.includes('fbclid') && !raw.includes('?'), 'no query string or PII leaves the browser');
});

test('reload: same session, no second site_visit request', () => {
  const storage = makeStorage();
  const clock = { now: Date.UTC(2026, 9, 1, 12) };
  const url = 'https://aimtrichology.com/courses?utm_source=tiktok&utm_medium=social';
  const a = load({ url, referrer: 'https://www.tiktok.com/', storage, clock });
  a.advance(6000);
  const b = load({ url, referrer: 'https://www.tiktok.com/', storage, clock });
  b.advance(6000);
  assert.equal(a.sent.length, 1);
  assert.equal(b.sent.length, 0, 'reload with the same referrer/UTMs is not a new session');
});

test('first touch is kept; last touch updates only on a new meaningful acquisition', () => {
  const storage = makeStorage();
  const clock = { now: Date.UTC(2026, 9, 1, 12) };
  load({ url: 'https://aimtrichology.com/?utm_source=youtube&utm_medium=video&utm_content=video_headspa-routine_full_v1', storage, clock });
  clock.now += 60 * 60 * 1000;
  load({ url: 'https://aimtrichology.com/about', storage, clock }); // direct return visit
  let st = JSON.parse(storage.getItem('aimt_growth_v1'));
  assert.equal(st.ft.source, 'youtube');
  assert.equal(st.lt.source, 'youtube', 'direct visit does not overwrite the last meaningful touch');
  load({ url: 'https://aimtrichology.com/enroll?utm_source=email&utm_medium=email&utm_content=email_launch-reminder_subject-b_v1', storage, clock });
  st = JSON.parse(storage.getItem('aimt_growth_v1'));
  assert.equal(st.ft.source, 'youtube');
  assert.equal(st.lt.source, 'email');
  const payload = load({ url: 'https://aimtrichology.com/enroll', storage, clock }).api.checkoutPayload();
  assert.equal(payload.first_touch.source, 'youtube');
  assert.equal(payload.last_touch.content, 'email_launch-reminder_subject-b_v1');
});

test('Global Privacy Control / Do Not Track: nothing stored, nothing sent', () => {
  for (const nav of [{ globalPrivacyControl: true }, { doNotTrack: '1' }]) {
    const storage = makeStorage();
    const page = load({ url: 'https://aimtrichology.com/?utm_source=x', navigatorExtra: nav, storage });
    page.advance(10000);
    page.api.track('lead_created', { marketing_consent: true });
    assert.equal(page.sent.length, 0);
    assert.equal(storage.length, 0);
    assert.equal(page.api.checkoutPayload(), null);
  }
});

test('sales page: counts a sales view only while the public landing is showing', () => {
  const prospect = load({ url: 'https://aimtrichology.com/head-spa-certification', landingVisible: true });
  prospect.advance(5100);
  assert.deepEqual(prospect.sent.map((s) => s.body.event), ['site_visit', 'headspa_sales_view']);
  const student = load({ url: 'https://aimtrichology.com/head-spa-certification?enter=1', landingVisible: false });
  student.advance(5100);
  assert.equal(student.sent.length, 0, 'an enrolled student in the course app is not a marketing visit');
});

test('app pages never send site_visit; internal flag travels with events', () => {
  const app = load({ url: 'https://aimtrichology.com/my-aimt' });
  app.advance(6000);
  assert.equal(app.sent.length, 0);
  const preview = load({ url: 'https://aimtrichology.com/my-aimt?preview=readiness' });
  preview.advance(6000);
  assert.equal(preview.sent.length, 1, 'Readiness Preview is part of the marketing funnel');
  const staff = load({ url: 'https://aimtrichology.com/?aimt_internal=1' });
  staff.advance(6000);
  assert.equal(staff.sent[0].body.internal, true);
});

test('user-bound events attach the Supabase session token, and are skipped without one', () => {
  const token = { access_token: 'jwt-abc', expires_at: Math.floor(Date.UTC(2026, 9, 2) / 1000) };
  const signedIn = load({ url: 'https://aimtrichology.com/aimt-service-timer', storage: makeStorage({ 'sb-epcnkncyxqgscrejinwr-auth-token': JSON.stringify(token) }) });
  signedIn.api.track('service_timer_used', { protocol: 'core' });
  assert.equal(signedIn.sent.length, 1);
  assert.equal(signedIn.sent[0].opts.headers.Authorization, 'Bearer jwt-abc');
  const anonymous = load({ url: 'https://aimtrichology.com/aimt-service-timer' });
  anonymous.api.track('service_timer_used', { protocol: 'core' });
  assert.equal(anonymous.sent.length, 0);
});

test('readiness events count once per session; lead sends only consent', () => {
  const page = load({ url: 'https://aimtrichology.com/head-spa-readiness' });
  page.api.track('readiness_audit_start');
  page.api.track('readiness_audit_start');
  page.api.track('readiness_audit_complete');
  page.api.track('lead_created', { marketing_consent: true });
  page.api.track('checkout_start');
  page.api.track('paid_enrollment');
  assert.deepEqual(page.sent.map((s) => s.body.event), ['readiness_audit_start', 'readiness_audit_complete', 'lead_created'], 'browser cannot send checkout/paid');
  assert.deepEqual(page.sent[2].body.props, { marketing_consent: true });
});
