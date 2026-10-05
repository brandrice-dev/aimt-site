/* ═══════════════════════════════════════════════════════════════
   AIMT Readiness Prompt — Head Spa sales page only
   ---------------------------------------------------------------
   One quiet, dismissible card that points a hesitant prospect on the
   public Head Spa Certification sales landing to /head-spa-readiness.
   A secondary path only: it never replaces, hides, or restyles an
   enrollment CTA, and it never touches startCheckout() or /enroll.

   Loaded by headspa-mastery.html (served at /head-spa-certification).
   That file also hosts the course app, so the prompt only ever appears
   while the public #landingPage is showing — never to an enrolled
   student inside the course, never on any other route.

   When it shows (all must hold):
     - path is the sales page (/head-spa-certification, or the legacy
       /headspa-mastery path when served locally)
     - #landingPage is visible
     - no completed Readiness Profile in this browser
       (localStorage `aimt_readiness_profile_v1`, written by
       head-spa-readiness.html — the same record My AIMT reads)
     - not dismissed / clicked in the last 7 days
       (localStorage `aimt_readiness_prompt_v1`)
     - not already shown in this browsing session
       (sessionStorage `aimt_readiness_prompt_shown`)
     - engagement: 30 s of visible page time OR ≥ 50% scroll depth of
       the landing, whichever comes first
     - the visitor is not interacting with an enrollment CTA (hovered,
       focused, or touched in the last 8 s) and not typing in a field;
       once an enrollment CTA is clicked it never shows on that load

   Analytics: AIMTGrowth.track('readiness_prompt_shown' |
   'readiness_prompt_dismissed' | 'readiness_prompt_clicked') —
   no properties, no personal data.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.AIMTReadinessPrompt) return;

  var SALES_PATHS = /^\/(head-spa-certification|headspa-mastery)(\.html)?\/?$/;
  var PROFILE_KEY = 'aimt_readiness_profile_v1';
  var PROMPT_KEY = 'aimt_readiness_prompt_v1';
  var SESSION_KEY = 'aimt_readiness_prompt_shown';
  var SUPPRESS_MS = 7 * 24 * 60 * 60 * 1000;
  var ACTIVE_MS = 30 * 1000;
  var SCROLL_DEPTH = 0.5;
  var ENROLL_QUIET_MS = 8 * 1000;
  var RETRY_MS = 2000;
  var DESTINATION = '/head-spa-readiness';
  var ENROLL_SELECTOR = '[onclick*="startCheckout"], a[href^="/enroll"]';

  function track(name) {
    try { if (window.AIMTGrowth && typeof window.AIMTGrowth.track === 'function') window.AIMTGrowth.track(name); } catch (_) {}
  }
  function readLocal(key) {
    try { return window.localStorage.getItem(key); } catch (_) { return null; }
  }
  function writeLocal(key, value) {
    try { window.localStorage.setItem(key, value); } catch (_) {}
  }

  /* A completed profile = the shape head-spa-readiness.html saves after
     the score is revealed (score + band + pillar_scores). Anything else
     — missing, malformed, partial — is treated as not completed. */
  function hasCompletedReadiness() {
    try {
      var p = JSON.parse(readLocal(PROFILE_KEY) || 'null');
      return !!(p && typeof p === 'object' && typeof p.score === 'number' && p.band && p.pillar_scores && typeof p.pillar_scores === 'object');
    } catch (_) { return false; }
  }

  function recentlySuppressed() {
    try {
      var s = JSON.parse(readLocal(PROMPT_KEY) || 'null');
      var t = s && Date.parse(s.suppressed_at);
      return !!(t && Date.now() - t < SUPPRESS_MS && Date.now() >= t);
    } catch (_) { return false; }
  }
  function suppress(reason) {
    writeLocal(PROMPT_KEY, JSON.stringify({ suppressed_at: new Date().toISOString(), reason: reason }));
  }

  function shownThisSession() {
    try { return window.sessionStorage.getItem(SESSION_KEY) === '1'; } catch (_) { return false; }
  }
  function markShownThisSession() {
    try { window.sessionStorage.setItem(SESSION_KEY, '1'); } catch (_) {}
  }

  function landing() { return document.getElementById('landingPage'); }
  function landingVisible() {
    var el = landing();
    if (!el) return false;
    try {
      if (el.classList && el.classList.contains('fade-out')) return false;
      return window.getComputedStyle(el).display !== 'none';
    } catch (_) { return false; }
  }

  function blocked() {
    return !SALES_PATHS.test(window.location.pathname) || hasCompletedReadiness() || recentlySuppressed() || shownThisSession();
  }

  var state = { shown: false, cancelled: false, lastEnrollTouch: 0 };
  var el = null;
  var backdrop = null;
  var returnFocus = null;

  // ── Enrollment-CTA awareness: never interrupt someone about to enroll ──
  function enrollTarget(e) {
    var t = e && e.target;
    return t && t.closest ? t.closest(ENROLL_SELECTOR) : null;
  }
  function onEnrollActivity(e) {
    if (!enrollTarget(e)) return;
    state.lastEnrollTouch = Date.now();
    if (e.type === 'click') state.cancelled = true;
  }
  function busy() {
    if (Date.now() - state.lastEnrollTouch < ENROLL_QUIET_MS) return true;
    var a = document.activeElement;
    if (a && a.matches && a.matches(ENROLL_SELECTOR)) return true;
    var tag = a && a.tagName ? String(a.tagName).toUpperCase() : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    return false;
  }

  // ── Markup ──
  /* Readiness ring preview: the exact AIMT metric ring the Readiness
     result uses (assets/js/aimt-metric-ring.js, already loaded by the
     sales page), with "?" in the center — never a number. The short arc
     is a decorative, continuously rotating "not yet measured" sweep (see
     the CSS); under reduced motion only the empty track shows. */
  var RING_ARC = 22;
  function buildRing() {
    var wrap = document.createElement('div');
    wrap.className = 'aimt-rp-ring';
    var html = '';
    try {
      if (window.AIMTMetricRing && typeof window.AIMTMetricRing.render === 'function') {
        html = window.AIMTMetricRing.render({
          value: RING_ARC,
          display: '?',
          label: '',
          statusText: 'Your Readiness Score',
          accessibleText: 'Your Readiness Score, not yet calculated.'
        });
      }
    } catch (_) { html = ''; }
    if (!html) return null;
    wrap.innerHTML = html;
    return wrap;
  }

  function build() {
    var card = document.createElement('div');
    card.className = 'aimt-rp';
    card.id = 'aimtReadinessPrompt';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-labelledby', 'aimtRpTitle');
    card.setAttribute('aria-describedby', 'aimtRpBody');
    card.setAttribute('tabindex', '-1');

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'aimt-rp-close';
    close.setAttribute('aria-label', 'Close');
    close.setAttribute('data-rp-action', 'dismiss');
    close.textContent = '×';

    var title = document.createElement('h2');
    title.className = 'aimt-rp-title';
    title.id = 'aimtRpTitle';
    title.textContent = 'Not sure if you’re ready for the next step?';

    var body = document.createElement('p');
    body.className = 'aimt-rp-body';
    body.id = 'aimtRpBody';
    body.textContent = 'Take the free 3-minute AIMT Head Spa Readiness Score to see where you stand now — and what to strengthen next.';

    var actions = document.createElement('div');
    actions.className = 'aimt-rp-actions';

    var cta = document.createElement('a');
    cta.className = 'lp-enroll-btn aimt-rp-cta';
    cta.href = DESTINATION;
    cta.setAttribute('data-rp-action', 'cta');
    cta.textContent = 'Take the Free Readiness Score →';

    var later = document.createElement('button');
    later.type = 'button';
    later.className = 'aimt-rp-later';
    later.setAttribute('data-rp-action', 'dismiss');
    later.textContent = 'Not now';

    actions.appendChild(cta);
    actions.appendChild(later);
    var ring = buildRing();
    card.appendChild(close);
    if (ring) card.appendChild(ring);
    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(actions);

    close.addEventListener('click', function () { dismiss(); });
    later.addEventListener('click', function () { dismiss(); });
    cta.addEventListener('click', function () {
      suppress('cta');
      track('readiness_prompt_clicked');
    });
    card._focusables = [close, cta, later];
    return card;
  }

  function buildBackdrop() {
    var b = document.createElement('div');
    b.className = 'aimt-rp-backdrop';
    b.id = 'aimtReadinessPromptBackdrop';
    b.setAttribute('aria-hidden', 'true');
    // Clicking outside the card is one more way out, never a trap.
    b.addEventListener('click', function () { dismiss(); });
    return b;
  }

  // Mobile: sit above the sticky "Enroll · $597" bar while it is showing,
  // so the primary enrollment action is never covered by this card.
  function placeAboveStickyBar() {
    if (!el) return;
    var bar = document.getElementById('lpMobileStickyCta');
    var offset = 0;
    try {
      if (bar && window.getComputedStyle(bar).display !== 'none' && !(bar.classList && bar.classList.contains('lp-sticky-hide'))) {
        // The bar is fixed to bottom:0 and slides via transform, so its
        // layout height (not a mid-transition rect) is the space it takes.
        offset = Math.max(0, Math.round(bar.offsetHeight || 0));
      }
    } catch (_) {}
    el.style.setProperty('--aimt-rp-offset', offset + 'px');
  }

  function onKeydown(e) {
    if (e.key === 'Escape' || e.key === 'Esc') { dismiss(); return; }
    // Keep Tab inside the open dialog (its own × / Not now / Escape /
    // backdrop are always one step away, so this never locks anyone in).
    if (e.key === 'Tab' && el && el._focusables) {
      var f = el._focusables;
      var first = f[0];
      var last = f[f.length - 1];
      var a = document.activeElement;
      if (e.shiftKey && (a === first || a === el)) { if (e.preventDefault) e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && a === last) { if (e.preventDefault) e.preventDefault(); first.focus(); }
      else if (f.indexOf(a) === -1 && a !== el) { if (e.preventDefault) e.preventDefault(); first.focus(); }
    }
  }

  function show() {
    if (state.shown || state.cancelled || blocked() || !landingVisible()) return false;
    state.shown = true;
    markShownThisSession();
    backdrop = buildBackdrop();
    el = build();
    document.body.appendChild(backdrop);
    document.body.appendChild(el);
    placeAboveStickyBar();
    returnFocus = document.activeElement;
    // Next frame so the slide-up transition runs from the hidden state.
    var reveal = function () {
      if (!el) return;
      if (backdrop) backdrop.classList.add('is-open');
      el.classList.add('is-open');
      try { el.focus({ preventScroll: true }); } catch (_) { try { el.focus(); } catch (__) {} }
    };
    if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(reveal); else reveal();
    document.addEventListener('keydown', onKeydown);
    track('readiness_prompt_shown');
    stopWatching();
    return true;
  }

  function teardown() {
    document.removeEventListener('keydown', onKeydown);
    if (el && el.parentNode) el.parentNode.removeChild(el);
    if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    el = null;
    backdrop = null;
    try {
      if (returnFocus && typeof returnFocus.focus === 'function' && returnFocus !== document.body) returnFocus.focus({ preventScroll: true });
    } catch (_) {}
    returnFocus = null;
  }

  function dismiss() {
    if (!el) return;
    suppress('dismiss');
    track('readiness_prompt_dismissed');
    teardown();
  }

  // ── Engagement trigger ──
  var visibleMs = 0;
  var visibleSince = null;
  var timer = null;
  var watching = false;

  function activeMs() {
    return visibleMs + (visibleSince ? Date.now() - visibleSince : 0);
  }
  function scrollDepth() {
    var lp = landing();
    if (!lp) return 0;
    var max = (lp.scrollHeight || 0) - (lp.clientHeight || 0);
    return max > 0 ? (lp.scrollTop || 0) / max : 0;
  }
  function engaged() {
    return activeMs() >= ACTIVE_MS || scrollDepth() >= SCROLL_DEPTH;
  }

  function attempt() {
    clearTimeout(timer);
    timer = null;
    if (!watching || state.shown || state.cancelled) return;
    if (blocked()) { stopWatching(); return; }
    if (!engaged()) { schedule(); return; }
    if (busy() || !landingVisible()) { timer = setTimeout(attempt, RETRY_MS); return; }
    show();
  }
  function schedule() {
    clearTimeout(timer);
    timer = null;
    if (!visibleSince) return; // hidden tab: wait for visibilitychange
    timer = setTimeout(attempt, Math.max(250, ACTIVE_MS - activeMs() + 50));
  }

  var scrollQueued = false;
  function onScroll() {
    if (el) { placeAboveStickyBar(); return; }
    if (scrollQueued || !watching) return;
    scrollQueued = true;
    setTimeout(function () { scrollQueued = false; if (scrollDepth() >= SCROLL_DEPTH) attempt(); }, 200);
  }
  function onVisibility() {
    if (document.visibilityState === 'visible') {
      if (!visibleSince) visibleSince = Date.now();
    } else if (visibleSince) {
      visibleMs += Date.now() - visibleSince;
      visibleSince = null;
    }
    attempt();
  }

  function stopWatching() {
    watching = false;
    clearTimeout(timer);
    timer = null;
    document.removeEventListener('visibilitychange', onVisibility);
  }

  function start() {
    if (blocked()) return;
    watching = true;
    visibleSince = document.visibilityState === 'visible' ? Date.now() : null;
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('pointerdown', onEnrollActivity, true);
    document.addEventListener('focusin', onEnrollActivity, true);
    document.addEventListener('click', onEnrollActivity, true);
    document.addEventListener('pointerover', onEnrollActivity, true);
    var lp = landing();
    if (lp) lp.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { if (el) placeAboveStickyBar(); });
    schedule();
  }

  window.AIMTReadinessPrompt = { destination: DESTINATION, isOpen: function () { return !!el; }, dismiss: dismiss };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
