/* AIMT Meta measurement — optional, consent-gated advertising attribution.
   No Meta browser request or cookies before an affirmative choice.
   Privacy: /privacy. Revenue truth remains Stripe + AIMT Growth, not Meta.
*/
(function () {
  'use strict';
  if (window.AIMTMeta) return;

  var CONSENT_KEY = 'aimt_meta_consent_v1';
  var COOKIE_DAYS = 90;
  var pixelId = null;
  var initialized = false;
  var consentPanel = null;
  var pendingCheckout = null;
  var pendingPurchase = null;

  function browserOptOut() {
    try {
      if (navigator.globalPrivacyControl === true) return true;
      var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
      return dnt === '1' || dnt === 'yes';
    } catch (_) { return true; }
  }
  function choice() {
    if (browserOptOut()) return 'blocked';
    try { return localStorage.getItem(CONSENT_KEY) || 'unset'; }
    catch (_) { return 'unset'; }
  }
  function permitted() { return choice() === 'allow'; }
  function readCookie(name) {
    try {
      var matches = document.cookie.split(';').map(function (c) { return c.trim(); });
      var item = matches.find(function (c) { return c.indexOf(name + '=') === 0; });
      return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
    } catch (_) { return null; }
  }
  function clickId() {
    var value = '';
    try { value = new URLSearchParams(window.location.search).get('fbclid') || ''; } catch (_) {}
    if (!value && window.AIMTGrowth && window.AIMTGrowth.checkoutPayload) {
      try {
        var growth = window.AIMTGrowth.checkoutPayload() || {};
        value = growth.last_touch && growth.last_touch.fbclid || growth.first_touch && growth.first_touch.fbclid || '';
      } catch (_) {}
    }
    return /^[A-Za-z0-9_.-]{1,255}$/.test(value) ? value : null;
  }
  function captureFbc() {
    if (!permitted()) return;
    var id = clickId();
    if (!id) return;
    var existing = readCookie('_fbc');
    if (existing && existing.endsWith('.' + id)) return;
    var value = 'fb.1.' + Date.now() + '.' + id;
    try {
      document.cookie = '_fbc=' + encodeURIComponent(value) + '; Path=/; Max-Age=' + COOKIE_DAYS * 86400 +
        '; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    } catch (_) {}
  }
  function eventOnce(prefix, sessionId, callback) {
    if (!permitted() || !initialized || !sessionId || !/^cs_(?:live|test)_[A-Za-z0-9_]+$/.test(sessionId)) return false;
    var key = 'aimt_meta_' + prefix + '_' + sessionId;
    try {
      if (sessionStorage.getItem(key) === 'sent') return false;
    } catch (_) {}
    callback();
    try { sessionStorage.setItem(key, 'sent'); } catch (_) {}
    return true;
  }
  function flushPending() {
    if (pendingCheckout) {
      var id = pendingCheckout;
      pendingCheckout = null;
      eventOnce('checkout', id, function () {
        window.fbq('track', 'InitiateCheckout', { content_name: 'Head Spa Certification', content_type: 'product' });
      });
    }
    if (pendingPurchase) {
      var p = pendingPurchase;
      pendingPurchase = null;
      eventOnce('purchase', p.id, function () {
        window.fbq('track', 'Purchase', { value: p.value, currency: p.currency }, { eventID: p.id });
      });
    }
  }
  function startPixel() {
    if (!permitted() || !pixelId || initialized) return;
    captureFbc();
    if (!window.fbq) {
      var q = function () {
        q.callMethod ? q.callMethod.apply(q, arguments) : q.queue.push(arguments);
      };
      q.push = q; q.loaded = true; q.version = '2.0'; q.queue = [];
      window.fbq = q;
      var script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);
    }
    window.fbq('init', pixelId);
    initialized = true;
    window.fbq('track', 'PageView');
    if (/^\/(?:head-spa-certification|headspa-mastery)(?:\.html)?\/?$/.test(location.pathname)) {
      // This route doubles as the private course shell. Only count the public sales landing.
      var landing = document.getElementById('landingPage');
      if (landing && getComputedStyle(landing).display !== 'none') {
        window.fbq('track', 'ViewContent', { content_name: 'Head Spa Certification', content_type: 'product' });
      }
    }
    flushPending();
  }
  function dismissPanel() {
    if (consentPanel) { consentPanel.remove(); consentPanel = null; }
  }
  function setChoice(next) {
    if (browserOptOut() || (next !== 'allow' && next !== 'deny')) return;
    try { localStorage.setItem(CONSENT_KEY, next); } catch (_) {}
    dismissPanel();
    if (next === 'allow') startPixel();
    // Consent withdrawal takes effect for future traffic; an already-loaded
    // third-party script cannot be unloaded. Revisit with a fresh page.
    if (next === 'deny' && initialized) {
      try { window.fbq('consent', 'revoke'); } catch (_) {}
      initialized = false;
      window.location.reload();
    }
  }
  function showChoices(force) {
    if (browserOptOut() || !pixelId || consentPanel || (!force && choice() !== 'unset')) return;
    var wrap = document.createElement('div');
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'Advertising measurement preferences');
    wrap.style.cssText = 'position:fixed;z-index:2147483000;bottom:16px;left:16px;right:16px;max-width:560px;margin:0 auto;padding:19px 20px;background:#1a1714;color:#f6f0e8;border:1px solid #71675d;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.4);font-family:Arial,sans-serif;font-size:13px;line-height:1.55';
    var label = document.createElement('p');
    label.style.cssText = 'margin:0 0 12px';
    label.textContent = 'AIMT uses optional Meta advertising measurement to understand which ads lead to enrollment. We do not share course answers or student messages. You can decline.';
    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center';
    var allow = document.createElement('button');
    allow.type = 'button'; allow.textContent = 'Allow advertising measurement';
    allow.style.cssText = 'background:#f6f0e8;color:#1a1714;border:0;border-radius:24px;padding:10px 14px;cursor:pointer';
    var deny = document.createElement('button');
    deny.type = 'button'; deny.textContent = 'Decline';
    deny.style.cssText = 'background:transparent;color:#f6f0e8;border:1px solid #8b8075;border-radius:24px;padding:9px 14px;cursor:pointer';
    var privacy = document.createElement('a');
    privacy.href = '/privacy#cookies'; privacy.textContent = 'Privacy details';
    privacy.style.cssText = 'color:#f6f0e8;margin-left:3px;text-underline-offset:3px';
    allow.addEventListener('click', function () { setChoice('allow'); });
    deny.addEventListener('click', function () { setChoice('deny'); });
    actions.append(allow, deny, privacy);
    wrap.append(label, actions);
    document.body.appendChild(wrap);
    consentPanel = wrap;
  }
  function checkoutPayload() {
    if (!permitted()) return null;
    captureFbc();
    return { consent: true, fbc: readCookie('_fbc'), fbp: readCookie('_fbp') };
  }
  function checkoutCreated(sessionId) {
    if (typeof sessionId !== 'string') return;
    pendingCheckout = sessionId;
    if (initialized) flushPending();
  }
  function paidPurchase(sessionId, details) {
    if (!details || !Number.isInteger(Number(details.amount_total)) || Number(details.amount_total) <= 0) return;
    if (!/^[a-z]{3}$/i.test(String(details.currency || ''))) return;
    pendingPurchase = {
      id: String(sessionId || ''),
      value: Number(details.amount_total) / 100,
      currency: String(details.currency).toUpperCase()
    };
    if (initialized) flushPending();
  }
  function wirePreferences() {
    var pref = document.getElementById('aimtMetaPreferences');
    if (pref) pref.addEventListener('click', function () {
      if (browserOptOut()) {
        pref.insertAdjacentText('afterend', ' Advertising measurement is disabled by your browser privacy settings.');
        return;
      }
      showChoices(true);
    });
  }
  async function init() {
    wirePreferences();
    if (browserOptOut()) return;
    try {
      var response = await fetch('/api/meta-config', { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) return;
      var config = await response.json();
      if (!/^\d{6,25}$/.test(String(config.pixelId || ''))) return;
      pixelId = String(config.pixelId);
      if (permitted()) startPixel();
      else showChoices(false);
    } catch (_) { /* Tracking must never prevent access or checkout. */ }
  }

  window.AIMTMeta = {
    checkoutPayload: checkoutPayload,
    checkoutCreated: checkoutCreated,
    paidPurchase: paidPurchase,
    showPreferences: function () { showChoices(true); },
    consent: choice
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
