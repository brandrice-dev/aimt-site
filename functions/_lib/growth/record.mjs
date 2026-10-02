// AIMT Growth — the single writer for public.growth_events.
//
// Every caller (the browser beacon, create-checkout-session, the Stripe
// webhook, Admin revenue reconciliation) goes through recordGrowthEvent(),
// which:
//   - re-validates the event name and whitelists every field
//     (functions/_lib/growth/taxonomy.mjs), whatever the caller passed;
//   - computes the dedupe key server-side and inserts with
//     ON CONFLICT (event_name, dedupe_key) DO NOTHING, so reloads, retries
//     and Stripe redeliveries never double-count;
//   - NEVER throws and never blocks longer than WRITE_TIMEOUT_MS. Growth
//     measurement must never be able to break checkout, the webhook's
//     entitlement write, or any page.

import {
  STORED_EVENTS,
  dedupeKeyFor,
  isUuid,
  sanitizePath,
  sanitizeProps,
  sanitizeTouch,
} from './taxonomy.mjs';

export const GROWTH_TABLE = 'growth_events';
const WRITE_TIMEOUT_MS = 4000;

/**
 * Builds the exact row that would be stored, or null if the event is
 * invalid. Exported so tests can assert the privacy whitelist directly.
 */
export function buildGrowthRow(input = {}) {
  const eventName = String(input.eventName || '');
  if (!STORED_EVENTS.includes(eventName)) return null;
  const origin = input.origin === 'server' ? 'server' : 'browser';

  const props = sanitizeProps(eventName, input.props);
  if (props === null) return null;

  const visitorId = isUuid(input.visitorId) ? input.visitorId.toLowerCase() : null;
  const sessionId = isUuid(input.sessionId) ? input.sessionId.toLowerCase() : null;
  const userId = isUuid(input.userId) ? input.userId.toLowerCase() : null;
  const checkoutSessionId = typeof input.checkoutSessionId === 'string' && /^[A-Za-z0-9_\-]{1,255}$/.test(input.checkoutSessionId)
    ? input.checkoutSessionId
    : null;

  const dedupeKey = dedupeKeyFor(eventName, {
    now: input.now,
    sessionId,
    visitorId,
    userId,
    checkoutSessionId,
    resource: props.resource,
  });
  if (!dedupeKey) return null;

  const row = {
    event_name: eventName,
    dedupe_key: dedupeKey,
    origin,
    visitor_id: visitorId,
    session_id: sessionId,
    user_id: userId,
    checkout_session_id: checkoutSessionId,
    is_internal: input.isInternal === true,
    page_path: sanitizePath(input.pagePath),
    first_touch: sanitizeTouch(input.firstTouch),
    last_touch: sanitizeTouch(input.lastTouch),
    props,
  };
  if (input.now) row.occurred_at = new Date(input.now).toISOString();
  return row;
}

/**
 * Inserts one growth event. Resolves to { ok, stored, reason } and never
 * rejects. `stored:false, ok:true` means a duplicate that was ignored.
 */
export async function recordGrowthEvent(env, input) {
  try {
    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, stored: false, reason: 'not_configured' };
    const row = buildGrowthRow(input);
    if (!row) return { ok: false, stored: false, reason: 'invalid_event' };

    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), WRITE_TIMEOUT_MS) : null;
    try {
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${GROWTH_TABLE}?on_conflict=event_name,dedupe_key`, {
        method: 'POST',
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=ignore-duplicates,return=representation',
        },
        body: JSON.stringify(row),
        signal: controller ? controller.signal : undefined,
      });
      if (!res.ok) {
        console.info('[aimt-growth-write-failed]', { event: row.event_name, status: res.status });
        return { ok: false, stored: false, reason: `http_${res.status}` };
      }
      const body = await res.json().catch(() => null);
      return { ok: true, stored: Array.isArray(body) ? body.length > 0 : true, reason: null };
    } finally {
      if (timer) clearTimeout(timer);
    }
  } catch (error) {
    console.info('[aimt-growth-write-failed]', { event: input?.eventName, error: error?.message || 'unknown' });
    return { ok: false, stored: false, reason: 'exception' };
  }
}

/**
 * Runs a growth write without delaying the caller's response when the
 * Pages runtime offers waitUntil(); otherwise awaits it (still never throws).
 */
export async function recordGrowthEventInBackground(context, input) {
  const promise = recordGrowthEvent(context?.env, input);
  if (context && typeof context.waitUntil === 'function') {
    try { context.waitUntil(promise); return; } catch { /* fall through to await */ }
  }
  await promise;
}
