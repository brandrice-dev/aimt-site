// AIMT Growth — canonical event taxonomy, attribution sanitizers, and
// enrollment classification.
//
// This module is the ONE place these definitions live in code. The
// human-readable contract (validity rule, source of truth, formula,
// limitations for every event and metric) is
// docs/growth/AIMT-Growth-Measurement.md — keep the two in step.
//
// Pure functions only: no I/O, no env, no Date.now() unless passed in, so
// every rule is unit-testable (tests/growth-taxonomy.test.mjs).

// ── Event taxonomy ─────────────────────────────────────────────────────
// Stored: written to public.growth_events.
// Derived: computed at report time from an existing authority and NEVER
// written to growth_events (the table's CHECK constraint rejects them).
export const STORED_EVENTS = Object.freeze([
  'site_visit',
  'headspa_sales_view',
  'readiness_audit_start',
  'readiness_audit_complete',
  'lead_created',
  'checkout_start',
  'paid_enrollment',
  'service_timer_used',
  'resource_used',
  'readiness_prompt_shown',
  'readiness_prompt_dismissed',
  'readiness_prompt_clicked',
]);

export const DERIVED_EVENTS = Object.freeze({
  course_activated: 'course_progress.state — first recorded course activity (hasCourseActivity)',
  module_completed: 'course_progress.state.progress[0..11].complete === true (completedAt)',
  cadence_used: 'cadence_messages — at least one student-authored message (metadata only, never content)',
  certification_issued: 'completions — non-revoked credential row (completed_at)',
});

// Accepted from the browser beacon (/api/growth/collect). checkout_start and
// paid_enrollment are server-only: the browser can never assert a checkout
// or a purchase.
export const BROWSER_EVENTS = Object.freeze(new Set([
  'site_visit',
  'headspa_sales_view',
  'readiness_audit_start',
  'readiness_audit_complete',
  'lead_created',
  'service_timer_used',
  'resource_used',
  'readiness_prompt_shown',
  'readiness_prompt_dismissed',
  'readiness_prompt_clicked',
]));

export const SERVER_EVENTS = Object.freeze(new Set(['checkout_start', 'paid_enrollment']));

// Browser events that only count for a signed-in AIMT account. The collector
// requires a valid Supabase session for these and binds user_id server-side.
export const USER_BOUND_EVENTS = Object.freeze(new Set(['service_timer_used', 'resource_used']));

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

// ── Attribution sanitizers ─────────────────────────────────────────────
// Everything here is whitelist-only. A value that is not clearly a short
// campaign token is dropped rather than "cleaned", so personal data pasted
// into a link (an email address in utm_term, a name, a long free-text
// string) never reaches storage.

const TOKEN_MAX = 100;

export function sanitizeToken(value) {
  if (value === null || value === undefined) return null;
  let s = String(value).trim().toLowerCase();
  if (!s || s.length > 200) return null;
  if (s.includes('@')) return null; // looks like an email — never store
  s = s.replace(/\s+/g, '_').replace(/[^a-z0-9_.\-+~:]/g, '');
  if (!s) return null;
  if (/^[\d+\-._]{7,}$/.test(s) && (s.match(/\d/g) || []).length >= 7) return null; // phone-number-like
  return s.slice(0, TOKEN_MAX);
}

export function sanitizeClickId(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s || s.length > 255 || !/^[A-Za-z0-9_\-.]+$/.test(s)) return null;
  return s;
}

export function sanitizeDomain(value) {
  if (value === null || value === undefined) return null;
  let s = String(value).trim().toLowerCase();
  if (!s) return null;
  // Accept a bare host or a URL; keep the hostname only.
  if (s.includes('/')) {
    try { s = new URL(s.includes('://') ? s : `https://${s}`).hostname; } catch { return null; }
  }
  s = s.replace(/^www\./, '');
  if (!/^[a-z0-9.-]{1,100}$/.test(s) || !s.includes('.')) return null;
  return s;
}

// Path only — any query string or fragment is discarded. `.html` and
// trailing slashes are normalized so /enroll, /enroll.html, /enroll/ group.
export function sanitizePath(value) {
  if (value === null || value === undefined) return null;
  let s = String(value).trim();
  if (!s) return null;
  if (s.includes('://')) {
    try { s = new URL(s).pathname; } catch { return null; }
  }
  s = s.split(/[?#]/)[0];
  if (!s.startsWith('/')) return null;
  if (!/^[A-Za-z0-9/_\-.~%]+$/.test(s)) return null;
  s = s.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (s.length > 1) s = s.replace(/\/+$/, '');
  return s.slice(0, 200) || '/';
}

function sanitizeIso(value) {
  if (!value) return null;
  const t = Date.parse(String(value));
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

const TOUCH_TOKEN_FIELDS = ['source', 'medium', 'campaign', 'content', 'term'];
const TOUCH_CLICK_FIELDS = ['gclid', 'gbraid', 'wbraid'];

/** Whitelisted attribution snapshot. Returns {} when nothing usable. */
export function sanitizeTouch(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const f of TOUCH_TOKEN_FIELDS) {
    const v = sanitizeToken(raw[f]);
    if (v) out[f] = v;
  }
  for (const f of TOUCH_CLICK_FIELDS) {
    const v = sanitizeClickId(raw[f]);
    if (v) out[f] = v;
  }
  const ref = sanitizeDomain(raw.referrer_domain);
  if (ref) out.referrer_domain = ref;
  const landing = sanitizePath(raw.landing_path);
  if (landing) out.landing_path = landing;
  const at = sanitizeIso(raw.at);
  if (at) out.at = at;
  return out;
}

/** A touch is "meaningful" when it carries a campaign tag, an ad click id,
 *  or an external referrer. Direct/internal navigation is not. */
export function isMeaningfulTouch(touch) {
  if (!touch || typeof touch !== 'object') return false;
  return !!(touch.source || touch.medium || touch.campaign || touch.content || touch.term
    || touch.gclid || touch.gbraid || touch.wbraid || touch.referrer_domain);
}

const SEARCH_DOMAINS = ['google.', 'bing.com', 'duckduckgo.com', 'yahoo.', 'ecosia.org', 'baidu.com', 'yandex.', 'search.brave.com', 'startpage.com'];
const SOCIAL_DOMAINS = ['instagram.com', 'facebook.com', 'fb.com', 'm.facebook.com', 'l.facebook.com', 'lm.facebook.com', 'tiktok.com', 'youtube.com', 'youtu.be', 'pinterest.com', 'pin.it', 'linkedin.com', 'lnkd.in', 't.co', 'x.com', 'twitter.com', 'threads.net', 'reddit.com', 'snapchat.com'];

function domainMatches(domain, list) {
  return list.some((d) => (d.endsWith('.') ? domain.startsWith(d) || domain.includes(`.${d}`) : domain === d || domain.endsWith(`.${d}`)));
}

/**
 * Resolves a touch to the channel used for grouping. Explicit UTMs win;
 * a click id without UTMs is paid search; otherwise the referrer domain is
 * classified (organic search / social / referral); nothing at all is direct.
 */
export function channelFor(touch) {
  const t = touch && typeof touch === 'object' ? touch : {};
  const out = { source: null, medium: null, campaign: t.campaign || '(none)', content: t.content || '(none)' };
  if (t.source || t.medium) {
    out.source = t.source || '(not set)';
    out.medium = t.medium || '(not set)';
  } else if (t.gclid || t.gbraid || t.wbraid) {
    out.source = 'google';
    out.medium = 'cpc';
  } else if (t.referrer_domain) {
    out.source = t.referrer_domain;
    out.medium = domainMatches(t.referrer_domain, SEARCH_DOMAINS)
      ? 'organic'
      : (domainMatches(t.referrer_domain, SOCIAL_DOMAINS) ? 'social' : 'referral');
  } else {
    out.source = '(direct)';
    out.medium = '(none)';
  }
  return out;
}

// ── Creative-level attribution (utm_content convention) ───────────────
// utm_content = <format>_<topic>_<hook>_v<N>
//   format: controlled vocabulary below
//   topic:  the concept, hyphenated words        e.g. scalp-microscopy
//   hook:   the opening/angle/variant label      e.g. myth-bust, subject-a
//   vN:     version of that exact creative       e.g. v1, v2
// The platform is utm_source, so (utm_source, utm_content) is globally
// unique: instagram + reel_scalp-microscopy_myth-bust_v2.
export const CREATIVE_FORMATS = Object.freeze([
  'reel', 'story', 'post', 'carousel', 'short', 'video', 'live', 'email', 'sms',
  'ad-image', 'ad-video', 'ad-carousel', 'ugc', 'blog', 'link', 'podcast', 'qr',
]);

const SEGMENT = '[a-z0-9]+(?:-[a-z0-9]+)*';
const CREATIVE_RE = new RegExp(`^(${CREATIVE_FORMATS.map((f) => f.replace('-', '\\-')).join('|')})_(${SEGMENT})_(${SEGMENT})_v(\\d{1,3})$`);

/** Parses a utm_content value against the AIMT creative convention. */
export function parseCreativeId(content) {
  const s = typeof content === 'string' ? content.trim().toLowerCase() : '';
  const m = CREATIVE_RE.exec(s);
  if (!m) return { conforming: false, raw: s || null };
  return { conforming: true, raw: s, format: m[1], topic: m[2], hook: m[3], version: Number(m[4]) };
}

// ── Event properties (whitelist per event) ────────────────────────────
const RESOURCE_SLUG_RE = /^[a-z0-9][a-z0-9_.-]{0,99}$/;

export function sanitizeProps(eventName, raw) {
  const p = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  if (eventName === 'lead_created') {
    return { marketing_consent: p.marketing_consent === true };
  }
  if (eventName === 'resource_used') {
    const slug = typeof p.resource === 'string' ? p.resource.trim().toLowerCase() : '';
    return RESOURCE_SLUG_RE.test(slug) ? { resource: slug } : null; // null = reject event
  }
  if (eventName === 'service_timer_used') {
    return p.protocol === 'core' || p.protocol === 'extended' ? { protocol: p.protocol } : {};
  }
  if (eventName === 'checkout_start') {
    const out = {};
    if (typeof p.livemode === 'boolean') out.livemode = p.livemode;
    if (p.ui === 'embedded' || p.ui === 'hosted') out.ui = p.ui;
    return out;
  }
  if (eventName === 'paid_enrollment') {
    const out = {};
    for (const k of ['amount_total', 'amount_subtotal', 'amount_discount']) {
      const n = Number(p[k]);
      if (Number.isInteger(n) && n >= 0) out[k] = n;
    }
    if (typeof p.currency === 'string' && /^[a-z]{3}$/.test(p.currency.toLowerCase())) out.currency = p.currency.toLowerCase();
    if (typeof p.livemode === 'boolean') out.livemode = p.livemode;
    if (typeof p.course_slug === 'string' && /^[a-z0-9-]{1,64}$/.test(p.course_slug)) out.course_slug = p.course_slug;
    if (p.reconciled === true) out.reconciled = true;
    return out;
  }
  return {};
}

// ── Idempotency ───────────────────────────────────────────────────────
export function utcDay(date) {
  return new Date(date).toISOString().slice(0, 10);
}

/**
 * Server-computed dedupe key — the definition of "counts once":
 *   site_visit / headspa_sales_view / readiness_audit_start /
 *   readiness_audit_complete /
 *   readiness_prompt_*             → once per browsing session
 *   lead_created                     → once per visitor, ever
 *   checkout_start / paid_enrollment → once per Stripe Checkout Session
 *   service_timer_used               → once per student per UTC day
 *   resource_used                    → once per student per resource per UTC day
 * Returns null when the required identity is missing (event rejected).
 */
export function dedupeKeyFor(eventName, ctx = {}) {
  const day = utcDay(ctx.now || Date.now());
  switch (eventName) {
    case 'site_visit':
    case 'headspa_sales_view':
    case 'readiness_audit_start':
    case 'readiness_audit_complete':
    case 'readiness_prompt_shown':
    case 'readiness_prompt_dismissed':
    case 'readiness_prompt_clicked':
      return isUuid(ctx.sessionId) ? `s:${ctx.sessionId.toLowerCase()}` : null;
    case 'lead_created':
      return isUuid(ctx.visitorId) ? `v:${ctx.visitorId.toLowerCase()}` : null;
    case 'checkout_start':
    case 'paid_enrollment':
      return ctx.checkoutSessionId ? `cs:${String(ctx.checkoutSessionId).slice(0, 190)}` : null;
    case 'service_timer_used':
      return ctx.userId ? `u:${ctx.userId}:${day}` : null;
    case 'resource_used':
      return ctx.userId && ctx.resource ? `u:${ctx.userId}:${ctx.resource}:${day}`.slice(0, 200) : null;
    default:
      return null;
  }
}

// ── Enrollment classification (revenue authority) ────────────────────
// A legitimate live Stripe purchase with a positive amount paid is a paid
// enrollment — full price or discounted (coupon/promotion) alike — and
// counts in paid conversion, gross revenue and attribution. Only zero-cost,
// non-customer and internal enrollments are excluded. Everything is
// classified from server-written data: the entitlement id prefix that the
// webhook / Admin grant flow wrote, the admin_users table, and the
// Stripe-verified paid_enrollment record. Browser data never decides it.
export const ENROLLMENT_KINDS = Object.freeze({
  paid: 'Paid — full price',
  paid_discounted: 'Paid — discounted / promotional',
  zero_cost: 'Live checkout, $0 paid',
  owner_test: 'Owner / staff purchase',
  test: 'Stripe test mode',
  staff: 'Staff access',
  complimentary: 'Complimentary',
  scholarship: 'Scholarship',
  manual: 'Manual grant',
  unknown: 'Unrecognized source',
});

// The kinds that count as paid enrollments in every paid metric.
export const PAID_KINDS = Object.freeze(new Set(['paid', 'paid_discounted']));

export function isPaidKind(kind) {
  return PAID_KINDS.has(kind);
}

export function classifyEnrollment(entitlement, ctx = {}) {
  const id = String(entitlement?.checkout_session_id || '');
  if (id.startsWith('admin-grant-')) {
    const source = id.slice('admin-grant-'.length).split('-')[0];
    if (source === 'staff') return 'staff';
    if (source === 'complimentary') return 'complimentary';
    if (source === 'scholarship') return 'scholarship';
    return 'manual';
  }
  if (id.startsWith('staff-grant-')) return 'staff';
  if (id.startsWith('cs_test_')) return 'test';
  if (id.startsWith('cs_live_')) {
    const email = String(entitlement?.purchaser_email || '').trim().toLowerCase();
    if ((entitlement?.user_id && ctx.adminUserIds?.has(entitlement.user_id))
      || (email && ctx.adminEmails?.has(email))
      || (ctx.resolvedUserId && ctx.adminUserIds?.has(ctx.resolvedUserId))) return 'owner_test';
    const paid = ctx.paidRecord?.props || null;
    if (paid && paid.livemode === false) return 'test';
    if (paid && Number.isInteger(paid.amount_total) && paid.amount_total <= 0) return 'zero_cost';
    const discounted = paid && (Number(paid.amount_discount) > 0
      || (Number.isInteger(paid.amount_subtotal) && Number.isInteger(paid.amount_total) && paid.amount_total < paid.amount_subtotal));
    return discounted ? 'paid_discounted' : 'paid';
  }
  return 'unknown';
}
