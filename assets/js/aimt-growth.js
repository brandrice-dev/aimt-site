/* ═══════════════════════════════════════════════════════════════
   AIMT Growth — first-party measurement client
   ---------------------------------------------------------------
   Sends a small number of canonical funnel events to AIMT's own
   /api/growth/collect. Definitions: docs/growth/AIMT-Growth-Measurement.md

   What it is:
     - a random first-party visitor id + 30-minute session id in
       localStorage (key `aimt_growth_v1`), created by this script,
       never derived from any device or browser characteristic
     - the first-touch and most-recent-meaningful-touch attribution
       (UTM tags, Google click ids, referring DOMAIN, landing PATH)
   What it never is:
     - no third-party tag, pixel, cookie, fingerprint, or session replay
     - never sends a full URL or query string, a page title, form input,
       an email/name, Readiness answers, course/checkpoint answers, or any
       Cadence content
   Respects Global Privacy Control and Do Not Track: when either is on,
   nothing is stored or sent.

   Pages that already load assets/js/aimt-public-nav.js get this script
   from there; other pages include it directly. Page code may call:
     AIMTGrowth.track('readiness_audit_start' | 'readiness_audit_complete'
                      | 'lead_created' | 'service_timer_used', props?)
     AIMTGrowth.checkoutPayload()  → attribution for create-checkout-session
     AIMTGrowth.markInternal(true) → staff/owner browser, excluded from reports
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.AIMTGrowth) return;

  var STORE_KEY = 'aimt_growth_v1';
  var INTERNAL_KEY = 'aimt_growth_internal';
  var ENDPOINT = '/api/growth/collect';
  var SESSION_IDLE_MS = 30 * 60 * 1000;
  var QUALIFY_VISIBLE_MS = 5000;
  var CAMPAIGN_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var CLICK_PARAMS = ['gclid', 'gbraid', 'wbraid'];
  var USER_BOUND = { service_timer_used: true, resource_used: true };

  // Course / account / tool surfaces are product usage, not acquisition:
  // no site_visit there (attribution is still preserved).
  var APP_PATHS = /^\/(my-aimt|student-access|aimt-service-timer|admin|success|certificate|verify)(\.html)?\/?$/;
  var SALES_PATHS = /^\/(head-spa-certification|headspa-mastery)(\.html)?\/?$/;

  function noop() {}
  function optedOut() {
    try {
      if (navigator.globalPrivacyControl === true) return true;
      var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
      if (dnt === '1' || dnt === 'yes') return true;
      if (navigator.webdriver === true) return true; // automated browsers are not visitors
    } catch (_) {}
    return false;
  }

  if (optedOut()) {
    window.AIMTGrowth = { track: noop, checkoutPayload: function () { return null; }, markInternal: noop, enabled: false };
    return;
  }

  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    var b = new Uint8Array(16);
    window.crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var h = Array.prototype.map.call(b, function (x) { return (x + 0x100).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  function readStore() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) { return {}; }
  }
  function writeStore(s) {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (_) {}
  }

  function cleanToken(v) {
    if (!v) return null;
    var s = String(v).trim().toLowerCase();
    if (!s || s.length > 200 || s.indexOf('@') !== -1) return null;
    s = s.replace(/\s+/g, '_').replace(/[^a-z0-9_.\-+~:]/g, '');
    return s ? s.slice(0, 100) : null;
  }
  function cleanClickId(v) {
    return v && /^[A-Za-z0-9_\-.]{1,255}$/.test(v) ? v : null;
  }

  function externalReferrerDomain() {
    try {
      if (!document.referrer) return null;
      var host = new URL(document.referrer).hostname.toLowerCase().replace(/^www\./, '');
      var own = window.location.hostname.toLowerCase().replace(/^www\./, '');
      if (!host || host === own) return null;
      // Stripe's checkout return and our own preview hosts are not acquisition.
      if (/(^|\.)stripe\.com$/.test(host) || /(^|\.)aimt-site\.pages\.dev$/.test(host) || host === 'aimtrichology.com') return null;
      return host;
    } catch (_) { return null; }
  }

  function currentTouch() {
    var params;
    try { params = new URLSearchParams(window.location.search); } catch (_) { params = new URLSearchParams(''); }
    var t = { landing_path: window.location.pathname, at: new Date().toISOString() };
    CAMPAIGN_PARAMS.forEach(function (p) { var v = cleanToken(params.get(p)); if (v) t[p.slice(4)] = v; });
    CLICK_PARAMS.forEach(function (p) { var v = cleanClickId(params.get(p)); if (v) t[p] = v; });
    var ref = externalReferrerDomain();
    if (ref) t.referrer_domain = ref;
    return t;
  }
  function touchSignature(t) {
    if (!t) return '';
    return ['source', 'medium', 'campaign', 'content', 'term', 'gclid', 'gbraid', 'wbraid', 'referrer_domain']
      .map(function (k) { return t[k] || ''; }).join('|');
  }
  function isMeaningful(t) {
    return !!(t && (t.source || t.medium || t.campaign || t.content || t.term || t.gclid || t.gbraid || t.wbraid || t.referrer_domain));
  }

  // ── Identity + attribution, once per page load ──
  var store = readStore();
  var now = Date.now();
  var touch = currentTouch();
  if (!store.vid) store.vid = uuid();
  if (!store.ft) store.ft = touch;
  // A reload keeps document.referrer and the same UTMs: only a DIFFERENT
  // meaningful touch is a new acquisition (and a new session).
  var newAcquisition = isMeaningful(touch) && touchSignature(touch) !== touchSignature(store.lt);
  if (newAcquisition || !store.lt) store.lt = touch;
  var sessionExpired = !store.sid || !store.sidLast || now - store.sidLast > SESSION_IDLE_MS;
  if (sessionExpired || newAcquisition) {
    store.sid = uuid();
    store.sent = {};
  }
  store.sidLast = now;
  if (!store.sent || typeof store.sent !== 'object') store.sent = {};
  writeStore(store);

  (function applyInternalParam() {
    try {
      var flag = new URLSearchParams(window.location.search).get('aimt_internal');
      if (flag === '1') window.localStorage.setItem(INTERNAL_KEY, '1');
      if (flag === '0') window.localStorage.removeItem(INTERNAL_KEY);
    } catch (_) {}
  })();
  function isInternal() {
    try { return window.localStorage.getItem(INTERNAL_KEY) === '1'; } catch (_) { return false; }
  }

  function accessToken() {
    try {
      for (var i = 0; i < window.localStorage.length; i++) {
        var key = window.localStorage.key(i);
        if (!key || !/^sb-.*-auth-token$/.test(key)) continue;
        var session = JSON.parse(window.localStorage.getItem(key) || 'null');
        var s = session && (session.currentSession || session);
        if (s && s.access_token && (!s.expires_at || s.expires_at * 1000 > Date.now())) return s.access_token;
      }
    } catch (_) {}
    return null;
  }

  function send(eventName, props) {
    try {
      var s = readStore();
      if (!s.vid || !s.sid) return;
      s.sidLast = Date.now();
      writeStore(s);
      var headers = { 'Content-Type': 'application/json' };
      if (USER_BOUND[eventName]) {
        var token = accessToken();
        if (!token) return;
        headers.Authorization = 'Bearer ' + token;
      }
      var body = JSON.stringify({
        event: eventName,
        visitor_id: s.vid,
        session_id: s.sid,
        path: window.location.pathname,
        first_touch: s.ft || {},
        last_touch: s.lt || {},
        internal: isInternal(),
        props: props || {}
      });
      fetch(ENDPOINT, { method: 'POST', keepalive: true, credentials: 'same-origin', headers: headers, body: body }).catch(noop);
    } catch (_) {}
  }

  // Per-session client guard so a reload doesn't even make the request;
  // the server's dedupe key is the real guarantee.
  function sendOncePerSession(eventName, props) {
    var s = readStore();
    if (!s.sent) s.sent = {};
    if (s.sent[eventName]) return;
    s.sent[eventName] = 1;
    writeStore(s);
    send(eventName, props);
  }

  function track(eventName, props) {
    if (eventName === 'readiness_audit_start' || eventName === 'readiness_audit_complete') return sendOncePerSession(eventName, props);
    if (eventName === 'lead_created' || eventName === 'service_timer_used' || eventName === 'resource_used') return send(eventName, props);
  }

  function checkoutPayload() {
    var s = readStore();
    if (!s.vid) return null;
    return {
      visitor_id: s.vid,
      session_id: s.sid,
      first_touch: s.ft || {},
      last_touch: s.lt || {},
      internal: isInternal(),
      path: window.location.pathname
    };
  }

  function markInternal(on) {
    try {
      if (on === false) window.localStorage.removeItem(INTERNAL_KEY);
      else window.localStorage.setItem(INTERNAL_KEY, '1');
    } catch (_) {}
  }

  // ── Qualified visit: page visible for 5s cumulative ──
  var path = window.location.pathname;
  var isApp = APP_PATHS.test(path) && !(/^\/my-aimt/.test(path) && /[?&]preview=readiness\b/.test(window.location.search));
  var isSales = SALES_PATHS.test(path);

  function salesLandingVisible() {
    var el = document.getElementById('landingPage');
    if (!el) return false;
    try { return window.getComputedStyle(el).display !== 'none'; } catch (_) { return false; }
  }

  function onQualified() {
    if (isApp) return;
    if (isSales) {
      if (!salesLandingVisible()) return; // enrolled student in the course app, not a prospect
      sendOncePerSession('site_visit');
      sendOncePerSession('headspa_sales_view');
      return;
    }
    sendOncePerSession('site_visit');
  }

  var visibleMs = 0;
  var visibleSince = document.visibilityState === 'visible' ? Date.now() : null;
  var qualifyTimer = null;
  var qualified = false;
  function checkQualified() {
    if (qualified) return;
    var total = visibleMs + (visibleSince ? Date.now() - visibleSince : 0);
    if (total >= QUALIFY_VISIBLE_MS) {
      qualified = true;
      onQualified();
      return;
    }
    if (visibleSince) {
      clearTimeout(qualifyTimer);
      qualifyTimer = setTimeout(checkQualified, QUALIFY_VISIBLE_MS - total + 50);
    }
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      visibleSince = Date.now();
    } else if (visibleSince) {
      visibleMs += Date.now() - visibleSince;
      visibleSince = null;
      clearTimeout(qualifyTimer);
    }
    checkQualified();
  });
  checkQualified();

  // ── Resource use: downloads from the course resource registry ──
  document.addEventListener('click', function (e) {
    try {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      var registry = window.AIMT_COURSE_RESOURCES;
      if (!a || !registry) return;
      var target = new URL(a.getAttribute('href'), window.location.href).pathname;
      Object.keys(registry).forEach(function (slug) {
        (registry[slug] || []).forEach(function (r) {
          if (r.type !== 'download') return;
          if (new URL(r.href, window.location.href).pathname !== target) return;
          var file = target.split('/').pop().replace(/\.[a-z0-9]+$/i, '').toLowerCase();
          send('resource_used', { resource: file });
        });
      });
    } catch (_) {}
  }, true);

  window.AIMTGrowth = { track: track, checkoutPayload: checkoutPayload, markInternal: markInternal, enabled: true };
})();
