// Optional Meta integration — offline. Never calls Meta, Stripe or Supabase.
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMetaPurchase, sendMetaPurchase } from '../functions/_lib/meta/conversions.mjs';

const settings = { META_PIXEL_ID: '123456789012345', META_ACCESS_TOKEN: 'fake_unit_test_token' };
const paid = () => ({
  id: 'cs_live_meta_purchase_1',
  payment_status: 'paid',
  amount_total: 69700,
  currency: 'usd',
  metadata: {
    aimt_meta_consent: '1',
    aimt_meta_fbc: 'fb.1.1795000000000.SomeMetaClick_123',
    aimt_meta_fbp: 'fb.1.1795000000000.987654321',
    aimt_meta_user_agent: 'Mock browser/1'
  }
});

test('CAPI Purchase matches browser Stripe-session eventID and reports verified amount', () => {
  const payload = buildMetaPurchase(paid(), settings, 1795000500000);
  const event = payload.data[0];
  assert.equal(event.event_name, 'Purchase');
  assert.equal(event.event_id, 'cs_live_meta_purchase_1');
  assert.equal(event.event_time, 1795000500);
  assert.equal(event.action_source, 'website');
  assert.equal(event.event_source_url, 'https://aimtrichology.com/success');
  assert.deepEqual(event.custom_data, {
    currency: 'USD', value: 697, content_name: 'Head Spa Certification', content_type: 'product'
  });
  assert.equal(event.user_data.fbc, 'fb.1.1795000000000.SomeMetaClick_123');
  assert.equal(event.user_data.fbp, 'fb.1.1795000000000.987654321');
  const string = JSON.stringify(payload);
  for (const privateField of ['email', 'first_name', 'Cadence', 'answers', 'checkout_session_id']) {
    assert.equal(string.includes(privateField), false);
  }
});

test('CAPI is strictly opt-in and paid-only, with a valid browser identity and secrets', () => {
  for (const variation of [
    { env: { ...settings, META_PIXEL_ID: '' } },
    { env: { ...settings, META_ACCESS_TOKEN: '' } },
    { session: { metadata: { ...paid().metadata, aimt_meta_consent: '0' } } },
    { session: { payment_status: 'unpaid' } },
    { session: { amount_total: 0 } },
    { session: { currency: 'invalid' } },
    { session: { metadata: { ...paid().metadata, aimt_meta_fbc: '', aimt_meta_fbp: '' } } },
    { session: { metadata: { ...paid().metadata, aimt_meta_user_agent: '' } } },
  ]) {
    const session = { ...paid(), ...(variation.session || {}) };
    assert.equal(buildMetaPurchase(session, variation.env || settings), null, JSON.stringify(variation));
  }
});

test('CAPI sends POST body without exposing the access token in a URL', async t => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (input, options) => {
    requests.push({ input, options });
    return new Response('{"events_received":1}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  const result = await sendMetaPurchase(settings, paid());
  assert.equal(result.sent, true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].input, 'https://graph.facebook.com/v26.0/123456789012345/events');
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(JSON.parse(requests[0].options.body).data[0].event_id, paid().id);
  assert.equal(JSON.parse(requests[0].options.body).access_token, settings.META_ACCESS_TOKEN);
  assert.ok(!requests[0].input.includes(settings.META_ACCESS_TOKEN));
});

test('calculator and founder review safeguards remain in the public course page', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../headspa-mastery.html', import.meta.url), 'utf8');
  for (const id of ['lpEconPrice', 'lpEconClients', 'lpEconDays']) {
    const tag = src.match(new RegExp('<input[^>]*id="' + id + '"[^>]*>'));
    assert.ok(tag, id);
    assert.match(tag[0], /type="number"/);
    assert.doesNotMatch(tag[0], /value="/);
  }
  for (const id of ['lpEconDay', 'lpEconWeek', 'lpEconMonth', 'lpEconYear']) {
    assert.match(src, new RegExp('id="' + id + '">—</div>'));
  }
  assert.doesNotMatch(src, /\$100,800/);
  assert.match(src, /Read the founder's story/);
});


// Synthetic browser proof: no Meta request without permission, and each
// permitted standard event is emitted once. No browser or Meta API required.
test('browser Pixel is opt-in and fires PageView, ViewContent, Checkout and Purchase once', async () => {
  const { readFileSync } = await import('node:fs');
  const vm = await import('node:vm');
  const js = readFileSync(new URL('../assets/js/aimt-meta.js', import.meta.url), 'utf8');
  async function makeBrowser({ allow = false, gpc = false } = {}) {
    const store = new Map(allow ? [['aimt_meta_consent_v1', 'allow']] : []);
    const sent = new Map();
    const loaded = [];
    const cookieJar = new Map();
    let configFetches = 0;
    const localStorage = { getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v) };
    const sessionStorage = { getItem: k => sent.get(k) || null, setItem: (k, v) => sent.set(k, v) };
    const doc = {
      readyState: 'complete',
      head: { appendChild: el => loaded.push(el.src) },
      body: { appendChild: () => {} },
      getElementById: id => id === 'landingPage' ? { id } : null,
      createElement: tag => ({
        tag, style: {}, setAttribute() {}, addEventListener() {}, append() {}, remove() {}, textContent: '',
      })
    };
    Object.defineProperty(doc, 'cookie', {
      get: () => Array.from(cookieJar, ([k, v]) => k + '=' + v).join('; '),
      set: v => {
        const [k, value] = String(v).split(';')[0].split('=');
        cookieJar.set(k, value);
      }
    });
    const win = {
      AIMTGrowth: { checkoutPayload: () => ({ first_touch: { fbclid: 'Click_123' }, last_touch: { fbclid: 'Click_123' } }) }
    };
    const navigator = { globalPrivacyControl: gpc };
    const location = { protocol: 'https:', pathname: '/head-spa-certification', search: '?fbclid=Click_123' };
    win.navigator = navigator;
    win.location = location;
    vm.runInNewContext(js, {
      window: win, navigator, location, document: doc, localStorage, sessionStorage,
      URLSearchParams, Date,
      getComputedStyle: () => ({ display: 'block' }),
      fetch: async () => { configFetches++; return { ok: true, json: async () => ({ pixelId: '123456789012345' }) }; }
    });
    await new Promise(resolve => setImmediate(resolve));
    return {
      api: win.AIMTMeta, win, loaded, cookieJar,
      configFetches: () => configFetches,
      events: () => win.fbq ? Array.from(win.fbq.queue, args => Array.from(args)) : []
    };
  }
  const unknown = await makeBrowser();
  assert.equal(unknown.configFetches(), 1);
  assert.equal(unknown.loaded.length, 0, 'No Meta scripts before opt-in');
  assert.equal(unknown.cookieJar.size, 0, 'No Meta cookies before opt-in');

  const blocked = await makeBrowser({ allow: true, gpc: true });
  assert.equal(blocked.configFetches(), 0, 'GPC blocks even a stored opt-in');
  assert.equal(blocked.api.checkoutPayload(), null);
  assert.equal(blocked.loaded.length, 0);

  const allowed = await makeBrowser({ allow: true });
  assert.equal(allowed.loaded.filter(v => v === 'https://connect.facebook.net/en_US/fbevents.js').length, 1);
  allowed.api.checkoutCreated('cs_test_purchase_123');
  allowed.api.checkoutCreated('cs_test_purchase_123');
  allowed.api.paidPurchase('cs_test_purchase_123', { amount_total: 69700, currency: 'usd' });
  allowed.api.paidPurchase('cs_test_purchase_123', { amount_total: 69700, currency: 'usd' });
  const events = allowed.events();
  const count = name => events.filter(parts => parts[0] === 'track' && parts[1] === name).length;
  for (const name of ['PageView', 'ViewContent', 'InitiateCheckout', 'Purchase']) {
    assert.equal(count(name), 1, name + ' must emit exactly once per page/session');
  }
  assert.ok(decodeURIComponent(allowed.cookieJar.get('_fbc')).startsWith('fb.1.'));
  const purchase = events.find(parts => parts[1] === 'Purchase');
  assert.equal(purchase[2].value, 697);
  assert.equal(purchase[3].eventID, 'cs_test_purchase_123');
});
