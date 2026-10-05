// AIMT Readiness prompt — Head Spa sales page (assets/js/aimt-readiness-prompt.js).
//
// Executes the real script in a node:vm sandbox with a minimal fake DOM,
// fake clock, and captured AIMTGrowth.track(), so the trigger, suppression,
// once-per-visit, enrollment-CTA courtesy, and analytics rules are verified
// as shipped. Static checks cover the copy/destination, where the script is
// loaded, mobile CSS bounds, and that enrollment/checkout code is untouched.
//
// Run: node --test tests/readiness-sales-prompt.test.mjs

import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const SRC = read('assets/js/aimt-readiness-prompt.js');
const CSS = read('assets/css/aimt-readiness-prompt.css');
const SALES = read('headspa-mastery.html');
const RING_SRC = read('assets/js/aimt-metric-ring.js');

const DAY = 24 * 60 * 60 * 1000;
const PROFILE = JSON.stringify({ version: 1, score: 62, band: 'Building', pillar_scores: { a: 1 } });

function makeStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map,
  };
}

function makeEl(tag, doc) {
  const listeners = {};
  const attrs = {};
  const el = {
    tagName: String(tag).toUpperCase(),
    id: '',
    className: '',
    textContent: '',
    href: '',
    type: '',
    children: [],
    parentNode: null,
    style: { props: {}, setProperty(k, v) { this.props[k] = v; } },
    scrollTop: 0, scrollHeight: 0, clientHeight: 0,
    isEnroll: false,
    display: 'flex',
    classList: {
      add: (c) => { if (!el.className.split(/\s+/).includes(c)) el.className = `${el.className} ${c}`.trim(); },
      remove: (c) => { el.className = el.className.split(/\s+/).filter((x) => x && x !== c).join(' '); },
      contains: (c) => el.className.split(/\s+/).includes(c),
    },
    setAttribute: (k, v) => { attrs[k] = String(v); },
    getAttribute: (k) => (k in attrs ? attrs[k] : null),
    appendChild: (c) => { c.parentNode = el; el.children.push(c); return c; },
    removeChild: (c) => { el.children = el.children.filter((x) => x !== c); c.parentNode = null; return c; },
    addEventListener: (t, fn) => { (listeners[t] ||= []).push(fn); },
    click: () => { (listeners.click || []).forEach((fn) => fn({ type: 'click', target: el })); },
    focus: () => { doc.activeElement = el; },
    closest: (sel) => (el.isEnroll && sel.includes('startCheckout') ? el : null),
    matches: (sel) => el.isEnroll && sel.includes('startCheckout'),
    getBoundingClientRect: () => ({ top: 0, height: 0 }),
    _attrs: attrs,
  };
  return el;
}

function all(root) {
  return [root, ...root.children.flatMap(all)];
}

function load({
  pathname = '/head-spa-certification',
  local = makeStorage(),
  session = makeStorage(),
  landingVisible = true,
  hasLanding = true,
  clock = { now: Date.UTC(2026, 9, 4, 12) },
  growth = true,
  ring = true,
} = {}) {
  const tracked = [];
  let timers = [];
  let seq = 0;
  const docListeners = {};
  const document = {
    readyState: 'complete',
    visibilityState: 'visible',
    activeElement: null,
    addEventListener: (t, fn) => { (docListeners[t] ||= []).push(fn); },
    removeEventListener: (t, fn) => { docListeners[t] = (docListeners[t] || []).filter((f) => f !== fn); },
    createElement: (tag) => makeEl(tag, document),
    getElementById: (id) => {
      if (id === 'landingPage') return hasLanding ? landing : null;
      return all(document.body).find((e) => e.id === id) || null;
    },
  };
  document.body = makeEl('body', document);
  document.activeElement = document.body;
  const landing = makeEl('div', document);
  landing.id = 'landingPage';
  landing.display = landingVisible ? 'flex' : 'none';
  landing.scrollHeight = 10000;
  landing.clientHeight = 800;
  const lpListeners = {};
  landing.addEventListener = (t, fn) => { (lpListeners[t] ||= []).push(fn); };

  const RealDate = Date;
  class FakeDate extends RealDate {
    constructor(...a) { super(...(a.length ? a : [clock.now])); }
    static now() { return clock.now; }
  }
  const window = {
    location: { pathname },
    localStorage: local,
    sessionStorage: session,
    innerHeight: 800,
    getComputedStyle: (el) => ({ display: el.display }),
    requestAnimationFrame: (fn) => fn(),
    addEventListener: () => {},
    AIMTGrowth: growth ? { track: (name, props) => tracked.push({ name, props }) } : undefined,
  };
  const sandbox = {
    window, document, JSON, Math, String, Date: FakeDate,
    setTimeout: (fn, ms) => { seq += 1; timers.push({ id: seq, fn, at: clock.now + (ms || 0) }); return seq; },
    clearTimeout: (id) => { timers = timers.filter((t) => t.id !== id); },
  };
  if (ring) {
    window.matchMedia = () => ({ matches: false });
    sandbox.requestAnimationFrame = () => {};
    vm.runInNewContext(RING_SRC, sandbox);
    window.AIMTMetricRing = sandbox.window.AIMTMetricRing;
  }
  vm.runInNewContext(SRC, sandbox);

  function advance(ms) {
    const end = clock.now + ms;
    for (;;) {
      timers.sort((a, b) => a.at - b.at);
      const next = timers[0];
      if (!next || next.at > end) break;
      timers.shift();
      clock.now = next.at;
      next.fn();
    }
    clock.now = end;
  }
  const prompt = () => document.getElementById('aimtReadinessPrompt');
  const fire = (type, target) => (docListeners[type] || []).slice().forEach((fn) => fn({ type, target, key: target && target.key }));
  return {
    window, document, landing, tracked, local, session, clock, advance, prompt, fire,
    scrollTo(fraction) {
      landing.scrollTop = Math.round(fraction * (landing.scrollHeight - landing.clientHeight));
      (lpListeners.scroll || []).forEach((fn) => fn({}));
    },
    setVisibility(v) { document.visibilityState = v; fire('visibilitychange'); },
    pressKey(key) { (docListeners.keydown || []).slice().forEach((fn) => fn({ type: 'keydown', key })); },
    pressTab(shiftKey) { (docListeners.keydown || []).slice().forEach((fn) => fn({ type: 'keydown', key: 'Tab', shiftKey, preventDefault() {} })); },
    find: (action) => all(prompt()).filter((e) => e.getAttribute('data-rp-action') === action),
  };
}

// ── Trigger ────────────────────────────────────────────────────────────

test('does not appear on page load or before engagement', () => {
  const p = load();
  assert.equal(p.prompt(), null);
  p.advance(29 * 1000);
  assert.equal(p.prompt(), null);
  p.scrollTo(0.3);
  p.advance(500);
  assert.equal(p.prompt(), null);
  assert.deepEqual(p.tracked, []);
});

test('appears after ~30 s of visible page time', () => {
  const p = load();
  p.advance(30 * 1000 + 100);
  assert.ok(p.prompt(), 'prompt visible');
  assert.ok(p.prompt().classList.contains('is-open'));
  assert.equal(p.prompt().getAttribute('role'), 'dialog');
  assert.equal(p.document.activeElement, p.prompt(), 'focus moves to the dialog');
});

test('appears after ≥ 50% scroll depth even before 30 s', () => {
  const p = load();
  p.advance(4000);
  p.scrollTo(0.52);
  p.advance(300);
  assert.ok(p.prompt());
});

test('hidden-tab time does not count toward the 30 s', () => {
  const p = load();
  p.advance(10 * 1000);
  p.setVisibility('hidden');
  p.advance(60 * 1000);
  assert.equal(p.prompt(), null);
  p.setVisibility('visible');
  p.advance(19 * 1000);
  assert.equal(p.prompt(), null);
  p.advance(2 * 1000);
  assert.ok(p.prompt());
});

// ── Copy + destination ─────────────────────────────────────────────────

test('uses the exact copy and the CTA points exactly to /head-spa-readiness', () => {
  const p = load();
  p.advance(31 * 1000);
  const texts = all(p.prompt()).map((e) => e.textContent);
  assert.ok(texts.includes('Not sure if you\u2019re ready for the next step?'));
  assert.ok(texts.includes('Take the free 3-minute AIMT Head Spa Readiness Score to see where you stand now \u2014 and what to strengthen next.'));
  const [cta] = p.find('cta');
  assert.equal(cta.textContent, 'Take the Free Readiness Score \u2192');
  assert.equal(cta.href, '/head-spa-readiness');
  assert.equal(cta.tagName, 'A');
  assert.ok(!cta.classList.contains('lp-enroll-primary'), 'never styled as the primary enroll CTA');
  assert.equal(p.find('dismiss').length, 2, '× close and Not now');
  assert.ok(texts.includes('Not now'));
});

// ── Suppression ────────────────────────────────────────────────────────

test('dismiss (× / Not now / Escape) closes it and suppresses for ~7 days', () => {
  for (const how of ['close', 'later', 'escape']) {
    const local = makeStorage();
    const p = load({ local });
    p.advance(31 * 1000);
    if (how === 'escape') p.pressKey('Escape');
    else p.find('dismiss')[how === 'close' ? 0 : 1].click();
    assert.equal(p.prompt(), null, `${how} closes`);
    const stored = JSON.parse(local.getItem('aimt_readiness_prompt_v1'));
    assert.equal(stored.reason, 'dismiss');

    // New visit (fresh session) 6 days later: still suppressed.
    const later = load({ local, clock: { now: p.clock.now + 6 * DAY } });
    later.advance(120 * 1000);
    later.scrollTo(0.9);
    later.advance(500);
    assert.equal(later.prompt(), null, `${how}: suppressed within 7 days`);

    // 8 days later: eligible again.
    const after = load({ local, clock: { now: p.clock.now + 8 * DAY } });
    after.advance(31 * 1000);
    assert.ok(after.prompt(), `${how}: eligible again after 7 days`);
  }
});

test('CTA click also suppresses repeat display', () => {
  const local = makeStorage();
  const p = load({ local });
  p.advance(31 * 1000);
  p.find('cta')[0].click();
  assert.equal(JSON.parse(local.getItem('aimt_readiness_prompt_v1')).reason, 'cta');
  const next = load({ local, clock: { now: p.clock.now + DAY } });
  next.advance(120 * 1000);
  assert.equal(next.prompt(), null);
});

test('a completed Readiness Profile in this browser suppresses it entirely', () => {
  const p = load({ local: makeStorage({ aimt_readiness_profile_v1: PROFILE }) });
  p.advance(120 * 1000);
  p.scrollTo(0.95);
  p.advance(500);
  assert.equal(p.prompt(), null);
  assert.deepEqual(p.tracked, []);
});

test('a malformed or partial profile does not count as completed', () => {
  for (const bad of ['not json', '{}', JSON.stringify({ score: '62', band: 'x', pillar_scores: {} }), JSON.stringify({ score: 62 })]) {
    const p = load({ local: makeStorage({ aimt_readiness_profile_v1: bad }) });
    p.advance(31 * 1000);
    assert.ok(p.prompt(), `shown for ${bad}`);
  }
});

test('one prompt per visit: never reopens on this load or a reload in the same session', () => {
  const session = makeStorage();
  const local = makeStorage();
  const p = load({ session, local });
  p.advance(31 * 1000);
  assert.ok(p.prompt());
  // Leave without dismissing; reload in the same browsing session.
  const reload = load({ session, local: makeStorage(), clock: { now: p.clock.now + 1000 } });
  reload.advance(120 * 1000);
  reload.scrollTo(0.9);
  reload.advance(500);
  assert.equal(reload.prompt(), null);

  const once = load();
  once.advance(31 * 1000);
  once.find('dismiss')[1].click();
  once.scrollTo(0.9);
  once.advance(120 * 1000);
  assert.equal(once.prompt(), null, 'not reopened after dismissal on the same load');
});

// ── Enrollment courtesy ────────────────────────────────────────────────

test('waits while the visitor is interacting with an enrollment CTA', () => {
  const p = load();
  const enroll = p.document.createElement('button');
  enroll.isEnroll = true;
  p.advance(25 * 1000);
  p.fire('pointerover', enroll);
  p.advance(6 * 1000); // 31 s total, but enroll CTA touched 6 s ago
  assert.equal(p.prompt(), null);
  p.advance(4 * 1000); // quiet window elapsed
  assert.ok(p.prompt());

  const focused = load();
  focused.advance(20 * 1000);
  const btn = focused.document.createElement('button');
  btn.isEnroll = true;
  focused.document.activeElement = btn;
  focused.advance(60 * 1000);
  assert.equal(focused.prompt(), null, 'not while an enroll CTA has focus');
});

test('clicking an enrollment CTA cancels the prompt for that page load', () => {
  const p = load();
  const enroll = p.document.createElement('button');
  enroll.isEnroll = true;
  p.advance(5 * 1000);
  p.fire('click', enroll);
  p.advance(120 * 1000);
  assert.equal(p.prompt(), null);
  assert.deepEqual(p.tracked, []);
});

test('does not appear while typing in a form field', () => {
  const p = load();
  p.document.activeElement = p.document.createElement('input');
  p.advance(60 * 1000);
  assert.equal(p.prompt(), null);
});

// ── Scope: sales landing only ──────────────────────────────────────────

test('never appears on other routes or inside the course app', () => {
  for (const pathname of ['/enroll', '/success', '/student-access', '/my-aimt', '/admin', '/head-spa-readiness', '/', '/courses']) {
    const p = load({ pathname });
    p.advance(120 * 1000);
    assert.equal(p.prompt(), null, pathname);
  }
  const student = load({ landingVisible: false }); // enrolled student inside the course app
  student.advance(120 * 1000);
  assert.equal(student.prompt(), null);
  const noLanding = load({ hasLanding: false });
  noLanding.advance(120 * 1000);
  assert.equal(noLanding.prompt(), null);
  for (const pathname of ['/head-spa-certification', '/headspa-mastery.html']) {
    const p = load({ pathname });
    p.advance(31 * 1000);
    assert.ok(p.prompt(), pathname);
  }
});

test('the script is loaded only by the Head Spa sales page, never sitewide', () => {
  const html = [];
  const walk = (dir) => {
    for (const ent of readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (ent.name.startsWith('.') || ['node_modules', 'docs', 'tests', 'AIMT-Listen-Mode-Final'].includes(ent.name)) continue;
      const rel = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(rel);
      else if (/\.html$/.test(ent.name)) html.push(rel);
    }
  };
  walk('.');
  const loaders = html.filter((f) => /(src|href)="[^"]*aimt-readiness-prompt\.(js|css)"/.test(read(f)));
  assert.deepEqual(loaders.map((f) => path.normalize(f)), ['headspa-mastery.html']);
  assert.equal((SALES.match(/aimt-readiness-prompt/g) || []).length, 2, 'one stylesheet + one script tag');
  // Not injected by any shared script either.
  for (const shared of ['assets/js/aimt-public-nav.js', 'assets/js/aimt-growth.js', 'assets/js/headspa-state.js']) {
    assert.doesNotMatch(read(shared), /createElement\(['"]script['"]\)[\s\S]{0,200}readiness-prompt|aimt-rp\b/, shared);
  }
});

// ── Analytics ──────────────────────────────────────────────────────────

test('analytics: shown / dismissed / clicked fire only at the matching moment, with no props', () => {
  const p = load();
  p.advance(29 * 1000);
  assert.deepEqual(p.tracked, []);
  p.advance(2 * 1000);
  assert.deepEqual(p.tracked.map((t) => t.name), ['readiness_prompt_shown']);
  p.find('dismiss')[0].click();
  p.pressKey('Escape'); // already closed: no second dismissal
  assert.deepEqual(p.tracked.map((t) => t.name), ['readiness_prompt_shown', 'readiness_prompt_dismissed']);
  assert.ok(p.tracked.every((t) => t.props === undefined));

  const c = load();
  c.advance(31 * 1000);
  c.find('cta')[0].click();
  assert.deepEqual(c.tracked.map((t) => t.name), ['readiness_prompt_shown', 'readiness_prompt_clicked']);

  const quiet = load();
  quiet.pressKey('Escape');
  assert.deepEqual(quiet.tracked, [], 'Escape before the prompt exists tracks nothing');
});

test('analytics: works (silently) without AIMTGrowth, e.g. GPC/DNT opt-out', () => {
  const p = load({ growth: false });
  p.advance(31 * 1000);
  assert.ok(p.prompt());
  p.find('dismiss')[1].click();
  assert.equal(p.prompt(), null);
});

test('analytics: growth client forwards the three prompt events once per session, without props', () => {
  const growth = read('assets/js/aimt-growth.js');
  assert.match(growth, /READINESS_PROMPT_EVENTS\[eventName\]\) return sendOncePerSession\(eventName\);/);
  for (const e of ['readiness_prompt_shown', 'readiness_prompt_dismissed', 'readiness_prompt_clicked']) {
    assert.match(growth, new RegExp(`${e}: true`));
    assert.match(SRC, new RegExp(`track\\('${e}'\\)`));
  }
});

// ── Presentation ───────────────────────────────────────────────────────

test('mobile: compact bottom sheet that cannot overflow the viewport', () => {
  const mobile = CSS.slice(CSS.indexOf('@media (max-width: 640px)'), CSS.indexOf('@media (prefers-reduced-motion'));
  assert.match(mobile, /left:\s*12px/);
  assert.match(mobile, /right:\s*12px/);
  assert.match(mobile, /width:\s*auto/);
  assert.match(mobile, /max-height:\s*calc\(100dvh/);
  assert.match(CSS, /\.aimt-rp \{[^}]*box-sizing:\s*border-box/);
  assert.match(CSS, /\.aimt-rp \{[^}]*overflow-y:\s*auto/);
  assert.match(CSS, /width:\s*min\(432px, calc\(100vw - 48px\)\)/);
  assert.doesNotMatch(CSS, /(?<![-\w])width:\s*([4-9]\d{2}|\d{4,})px/, 'no fixed pixel width wider than a phone');
  assert.match(mobile, /var\(--aimt-rp-offset/, 'sits above the sticky enroll bar');
});

test('respects reduced motion and the existing AIMT type/colour system', () => {
  const reduced = CSS.slice(CSS.indexOf('@media (prefers-reduced-motion: reduce) {'));
  assert.match(reduced, /\.aimt-rp \{ transition: none; transform: none; \}/);
  assert.match(reduced, /\.aimt-rp-backdrop \{ transition: none; \}/);
  assert.match(reduced, /\.aimt-metric-ring-svg \{ animation: none; \}/);
  assert.match(reduced, /\.aimt-metric-ring-fill \{ display: none; \}/, 'no static arc that could read as a score');
  assert.doesNotMatch(CSS, /Playfair|font-serif/);
  assert.match(CSS, /var\(--aimt-font-mont\)/);
  assert.match(CSS, /var\(--aimt-font-sans\)/);
  assert.match(CSS, /var\(--hero-bg2/);
});

test('mobile sheet offset tracks the sticky enroll bar height', () => {
  const p = load();
  const bar = p.document.createElement('div');
  bar.id = 'lpMobileStickyCta';
  bar.display = 'block';
  bar.offsetHeight = 60;
  p.document.body.appendChild(bar);
  p.advance(31 * 1000);
  assert.equal(p.prompt().style.props['--aimt-rp-offset'], '60px');
  bar.classList.add('lp-sticky-hide');
  p.scrollTo(0.6);
  assert.equal(p.prompt().style.props['--aimt-rp-offset'], '0px', 'drops to the bottom when the bar slides away');
});

// ── Enrollment / checkout untouched ────────────────────────────────────

test('enrollment and checkout behaviour are unchanged', () => {
  assert.match(SALES, /function startCheckout\(\) \{\n  window\.location\.href = '\/enroll';\n\}/);
  assert.equal((SALES.match(/onclick="startCheckout\(\)"/g) || []).length, 5, 'all five enroll CTAs intact');
  assert.match(SALES, /Begin Enrollment — \$597/);
  assert.match(SALES, /Enroll · \$597/);
  // The prompt never calls checkout, never links to /enroll, never touches price.
  const code = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(code, /startCheckout\(|location\.href\s*=|\$597|stripe|create-checkout/i);
  assert.doesNotMatch(code, /href\s*=\s*['"]\/enroll/);
  assert.equal((code.match(/\.href = /g) || []).length, 1, 'the only link it creates is the Readiness CTA');
});

// ── Focused presentation: ring preview + backdrop ──────────────────────

test('ring preview reuses the AIMT metric ring with "?" and never a number', () => {
  const p = load();
  p.advance(31 * 1000);
  const ring = all(p.prompt()).find((e) => e.className === 'aimt-rp-ring');
  assert.ok(ring, 'ring preview present');
  assert.match(ring.innerHTML, /class="aimt-metric-ring"/, 'the shared metric-ring markup');
  assert.match(ring.innerHTML, /<div class="aimt-metric-ring-value">\?<\/div>/);
  assert.match(ring.innerHTML, /<div class="aimt-metric-ring-status" aria-hidden="true">Your Readiness Score<\/div>/);
  assert.match(ring.innerHTML, /aria-label="Your Readiness Score, not yet calculated\."/);
  const visibleText = ring.innerHTML.replace(/<[^>]+>/g, ' ');
  assert.doesNotMatch(visibleText, /\d/, 'no digits shown anywhere in the ring');
  assert.match(SALES, /assets\/js\/aimt-metric-ring\.js/, 'sales page already loads the ring primitive');
  assert.match(SALES, /assets\/css\/aimt-metric-ring\.css/);
  // Order: ring → headline → body → actions.
  const order = p.prompt().children.map((c) => c.className);
  assert.deepEqual(order, ['aimt-rp-close', 'aimt-rp-ring', 'aimt-rp-title', 'aimt-rp-body', 'aimt-rp-actions']);

  const noRing = load({ ring: false });
  noRing.advance(31 * 1000);
  assert.ok(noRing.prompt(), 'still works if the ring primitive is unavailable');
  assert.ok(!all(noRing.prompt()).some((e) => e.className === 'aimt-rp-ring'));
});

test('modal backdrop opens with the dialog; clicking it dismisses like Not now', () => {
  const local = makeStorage();
  const p = load({ local });
  p.advance(31 * 1000);
  const backdrop = p.document.getElementById('aimtReadinessPromptBackdrop');
  assert.ok(backdrop && backdrop.classList.contains('is-open'));
  assert.equal(backdrop.getAttribute('aria-hidden'), 'true');
  assert.equal(p.prompt().getAttribute('aria-modal'), 'true');
  backdrop.click();
  assert.equal(p.prompt(), null);
  assert.equal(p.document.getElementById('aimtReadinessPromptBackdrop'), null, 'backdrop removed with the card');
  assert.equal(JSON.parse(local.getItem('aimt_readiness_prompt_v1')).reason, 'dismiss');
  assert.deepEqual(p.tracked.map((t) => t.name), ['readiness_prompt_shown', 'readiness_prompt_dismissed']);

  for (const how of ['close', 'later', 'escape']) {
    const q = load();
    q.advance(31 * 1000);
    if (how === 'escape') q.pressKey('Escape'); else q.find('dismiss')[how === 'close' ? 0 : 1].click();
    assert.equal(q.document.getElementById('aimtReadinessPromptBackdrop'), null, `${how} removes the backdrop`);
  }
});

test('focus: moves into the dialog, Tab cycles its controls, and returns on close', () => {
  const p = load();
  const before = p.document.createElement('a');
  before.focus();
  p.advance(31 * 1000);
  assert.equal(p.document.activeElement, p.prompt());
  const [close, later] = p.find('dismiss');
  const [cta] = p.find('cta');
  later.focus();
  p.pressTab(false);
  assert.equal(p.document.activeElement, close, 'Tab from the last control wraps to ×');
  p.pressTab(true);
  assert.equal(p.document.activeElement, later, 'Shift+Tab from × wraps to Not now');
  cta.focus();
  p.pressTab(false);
  assert.equal(p.document.activeElement, cta, 'middle controls tab natively');
  later.click();
  assert.equal(p.document.activeElement, before, 'focus restored to where it was');
});

test('desktop: small centered modal; mobile keeps the bottom sheet', () => {
  const base = CSS.slice(CSS.indexOf('.aimt-rp {'), CSS.indexOf('.aimt-rp.is-open'));
  assert.match(base, /top:\s*50%/);
  assert.match(base, /left:\s*50%/);
  assert.match(CSS, /\.aimt-rp\.is-open \{ opacity: 1; transform: translate\(-50%, -50%\) scale\(1\); \}/);
  const mobile = CSS.slice(CSS.indexOf('@media (max-width: 640px)'), CSS.indexOf('@media (prefers-reduced-motion'));
  assert.match(mobile, /top:\s*auto/);
  assert.match(mobile, /bottom:\s*calc\(12px \+ var\(--aimt-rp-offset/);
  assert.match(CSS, /\.aimt-rp-backdrop \{[^}]*position:\s*fixed;[^}]*inset:\s*0/);
  assert.match(CSS, /backdrop-filter:\s*blur\(/);
});
