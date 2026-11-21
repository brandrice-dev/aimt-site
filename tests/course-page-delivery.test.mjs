import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { publicCoursePage, deliverCoursePage, COURSE_PATHS } from '../functions/_lib/courses/page-delivery.mjs';
const source = readFileSync(new URL('../headspa-mastery.html', import.meta.url), 'utf8');
const req = (path = '/head-spa-certification', token, method = 'GET') => new Request('https://aimtrichology.com' + path, { method, headers: token === undefined ? {} : { Authorization: token } });
const env = { SUPABASE_URL: 'https://auth.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'test-only', ASSETS: { fetch: async () => new Response(source) } };

test('public prefix retains sales, SEO, price and UI but excludes all lesson/app markup and code', () => {
  const html = publicCoursePage(source);
  for (const fragment of ['id="landingPage"', '<title>', 'rel="canonical"', 'application/ld+json', 'Begin Enrollment — $697', 'lpEconYear', '/assets/js/aimt-course-entry.js']) assert.ok(html.includes(fragment), fragment);
  for (const fragment of ['id="lessonView"', 'id="module0Wrap"', 'MODULE_CHECKPOINTS', 'CHECKPOINT_EVAL_FORMAT', 'M8_TIMER_PREVIEW_STEPS', 'reviewModeBanner"', 'HeadSpa Mastery', '$100,800']) assert.ok(!html.includes(fragment), fragment);
  assert.throws(() => publicCoursePage(source.replace('<!-- AIMT PRIVATE COURSE BOUNDARY -->', '')), /boundary/);
  assert.throws(() => publicCoursePage(source + '<!-- AIMT PRIVATE COURSE BOUNDARY -->'), /boundary/);
});

test('canonical/review requests are public; every alias redirects without source; HEAD and methods safe', async () => {
  for (const path of COURSE_PATHS) {
    const response = await deliverCoursePage({ request: req(path + '?review=1&enter=1'), env });
    if (path === '/head-spa-certification') { assert.equal(response.status, 200); assert.doesNotMatch(await response.text(), /id="lessonView"|MODULE_CHECKPOINTS/); }
    else { assert.equal(response.status, 301); assert.equal(new URL(response.headers.get('Location')).pathname, '/head-spa-certification'); assert.equal(await response.text(), ''); }
    assert.match(response.headers.get('Cache-Control'), /no-store/);
  }
  assert.equal(await (await deliverCoursePage({ request: req(undefined, undefined, 'HEAD'), env })).text(), '');
  assert.equal((await deliverCoursePage({ request: req(undefined, undefined, 'POST'), env })).status, 405);
});

test('server identity and exact course entitlement required; failures never expose source or fetch asset', async () => {
  const original = globalThis.fetch;
  let assets = 0;
  const gatedEnv = { ...env, ASSETS: { fetch: async () => { assets++; return new Response(source); } } };
  try {
    for (const scenario of ['invalid', 'no-entitlement', 'other-course', 'entitlement-error', 'network-error', 'valid']) {
      assets = 0;
      globalThis.fetch = async (url, options) => {
        if (scenario === 'network-error') throw new Error('offline');
        if (String(url).includes('/auth/v1/user')) {
          assert.equal(options.headers.Authorization, 'Bearer test-session');
          return scenario === 'invalid' ? new Response('{}', { status: 401 }) : Response.json({ id: 'test-user', email: 'student@example.invalid' });
        }
        const query = new URL(url).searchParams;
        assert.equal(query.get('course_slug'), 'eq.headspa-mastery');
        if (scenario === 'entitlement-error') return Response.json({}, { status: 503 });
        return Response.json(scenario === 'valid' ? [{ checkout_session_id: 'paid' }] : []);
      };
      const response = await deliverCoursePage({ request: req(undefined, 'Bearer test-session'), env: gatedEnv });
      assert.equal(response.headers.get('Vary'), 'Authorization');
      assert.match(response.headers.get('Cache-Control'), /private, no-store/);
      if (scenario === 'valid') { assert.equal(response.status, 200); assert.equal(await response.text(), source); assert.equal(assets, 1); }
      else { assert.ok(response.status >= 400); assert.doesNotMatch(await response.text(), /lessonView|MODULE_CHECKPOINTS/); assert.equal(assets, 0); }
    }
    assert.equal((await deliverCoursePage({ request: req(undefined, 'Bearer test-session'), env: {} })).status, 503);
  } finally { globalThis.fetch = original; }
});

test('missing or redirected internal source fails closed', async () => {
  for (const asset of [new Response('', { status: 404 }), new Response('', { status: 301, headers: { Location: '/' } })]) {
    assert.equal((await deliverCoursePage({ request: req(), env: { ASSETS: { fetch: async () => asset } } })).status, 503);
  }
});

test('calculator requires all inputs and clears invalid results, while allowing explicit zero', () => {
  const script = source.slice(source.indexOf('/* Economics of the Room — interactive'), source.indexOf('<!-- AIMT PRIVATE COURSE BOUNDARY -->')).split('</script>')[0];
  const elements = {};
  for (const id of ['Card', 'Price', 'Clients', 'Days', 'PriceVal', 'ClientsVal', 'DaysVal', 'Day', 'Week', 'Month', 'Year']) elements['lpEcon' + id] = { value: '', textContent: '—', checkValidity() { return this.valid !== false; }, addEventListener(_, fn) { this.input = fn; } };
  vm.runInNewContext(script, { document: { getElementById: id => elements[id] }, window: { matchMedia: () => ({ matches: true }) }, Intl });
  const input = (id, value, valid = true) => { const el = elements['lpEcon' + id]; el.value = value; el.valid = valid; el.input(); };
  assert.equal(elements.lpEconYear.textContent, '—');
  input('Price', '175'); input('Clients', '3'); assert.equal(elements.lpEconYear.textContent, '—');
  input('Days', '4'); assert.equal(elements.lpEconYear.textContent, '$100,800'); assert.equal(elements.lpEconMonth.textContent, '$9,093');
  input('Price', ''); assert.equal(elements.lpEconYear.textContent, '—');
  input('Price', '-1', false); assert.equal(elements.lpEconYear.textContent, '—');
  input('Price', 'NaN'); assert.equal(elements.lpEconYear.textContent, '—');
  input('Price', '0'); assert.equal(elements.lpEconYear.textContent, '$0');
});


test('review mode only activates on loopback, including stale-session attempts', () => {
  const state = readFileSync(new URL('../assets/js/headspa-state.js', import.meta.url), 'utf8');
  const review = state.slice(state.indexOf("  const REVIEW_MODE_SESSION_KEY"), state.indexOf('  /* ══════════════════════════════════════════════════════\n     STUDENT PREVIEW'));
  for (const hostname of ['aimtrichology.com', 'www.aimtrichology.com', 'aimt-site.pages.dev', 'preview.aimt-site.pages.dev', 'arbitrary.example', 'test.local', 'localhost', '127.0.0.1']) {
    const sandbox = { window: { location: { hostname, search: '?review=1' } }, sessionStorage: { getItem: () => '1', setItem() {}, removeItem() {} } };
    vm.runInNewContext(review, sandbox);
    assert.equal(sandbox.window.ReviewMode.isActive(), ['localhost', '127.0.0.1'].includes(hostname), hostname);
  }
});

test('local/hosted edge: every alias and review parameter excludes lesson source', { skip: !process.env.AIMT_SURFACE_BASE_URL }, async () => {
  for (const path of COURSE_PATHS) {
    const response = await fetch(process.env.AIMT_SURFACE_BASE_URL + path + '?review=1&studentpreview=1&enter=1');
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /id="landingPage"/);
    assert.doesNotMatch(html, /id="lessonView"|id="module0Wrap"|MODULE_CHECKPOINTS|M8_TIMER_PREVIEW_STEPS/);
    assert.match(response.headers.get('Cache-Control'), /no-store/);
  }
});
