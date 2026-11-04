// On-demand, read-only Stripe Checkout diagnostics for owner/admin.
// Uses the EXISTING server-side Stripe key, never a browser token.
// Does not create, expire, or pay for any Checkout Session.
import { resolveAdmin } from '../../_lib/admin/auth.mjs';
import { supabaseRest } from '../../_lib/certification/auth.mjs';

function reply(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'private, no-store',
    'Vary': 'Authorization',
    'X-Content-Type-Options': 'nosniff',
  } });
}
function stripeMode(key) {
  return /^(?:sk|rk)_(live|test)_/.exec(String(key || ''))?.[1] || null;
}
async function readRecentSessions(env) {
  const q = new URLSearchParams({
    select: 'checkout_session_id,occurred_at,props',
    event_name: 'eq.checkout_start',
    order: 'occurred_at.desc',
    limit: '20',
  });
  const res = await supabaseRest(env, 'growth_events?' + q);
  if (!res.ok || !Array.isArray(res.body)) throw new Error('Growth event store is unavailable.');
  return res.body.filter(row => /^cs_(live|test)_/.test(row.checkout_session_id || ''));
}
async function readEntitlements(env) {
  const q = new URLSearchParams({
    select: 'checkout_session_id',
    course_slug: 'eq.headspa-mastery',
    limit: '2000',
  });
  const res = await supabaseRest(env, 'course_entitlements?' + q);
  if (!res.ok || !Array.isArray(res.body)) throw new Error('Entitlement store unavailable.');
  return new Set(res.body.map(row => row.checkout_session_id).filter(Boolean));
}
async function readPaidEvents(env) {
  const q = new URLSearchParams({
    select: 'checkout_session_id',
    event_name: 'eq.paid_enrollment',
    limit: '2000',
  });
  const res = await supabaseRest(env, 'growth_events?' + q);
  if (!res.ok || !Array.isArray(res.body)) throw new Error('Growth event store unavailable.');
  return new Set(res.body.map(row => row.checkout_session_id).filter(Boolean));
}
async function inspect(env, row, entitlements, paidRows, mode) {
  const id = row.checkout_session_id;
  const info = {
    sessionId: id, startedAt: row.occurred_at, ui: row.props?.ui || null,
    stripeStatus: 'unknown', paymentStatus: 'unknown', outcome: 'unverified',
    hasEntitlement: entitlements.has(id), hasPaidEvent: paidRows.has(id),
    amountTotal: null, currency: null, error: null,
  };
  if (!mode || !id.startsWith('cs_' + mode + '_')) {
    info.error = 'Stripe key mode differs from session mode';
    return info;
  }
  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(id), {
      headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY },
    });
    if (!res.ok) { info.error = 'Stripe lookup HTTP ' + res.status; return info; }
    const data = await res.json();
    info.stripeStatus = data.status || 'unknown';
    info.paymentStatus = data.payment_status || 'unknown';
    info.amountTotal = Number.isFinite(data.amount_total) ? data.amount_total : null;
    info.currency = data.currency || null;
    if (info.paymentStatus === 'paid' && info.hasEntitlement) info.outcome = 'paid_access_granted';
    else if (info.paymentStatus === 'paid') info.outcome = 'paid_missing_access';
    else if (info.stripeStatus === 'expired') info.outcome = 'expired_unpaid';
    else if (info.stripeStatus === 'open') info.outcome = 'open_unpaid';
    else if (info.stripeStatus === 'complete') info.outcome = 'completed_not_paid';
    else info.outcome = 'unverified';
  } catch (_) { info.error = 'Stripe lookup could not complete'; }
  return info;
}

export async function onRequest({ request, env }) {
  if (request.method !== 'GET') return reply({ error: 'GET required.' }, 405);
  const actor = await resolveAdmin(env, request, ['owner', 'admin'], { bootstrap: false });
  if (actor.errorResponse) return actor.errorResponse;
  if (!env.STRIPE_SECRET_KEY) return reply({ error: 'Stripe server key is not configured.' }, 503);
  try {
    const [events, entitlements, paidRows] = await Promise.all([
      readRecentSessions(env), readEntitlements(env), readPaidEvents(env),
    ]);
    const mode = stripeMode(env.STRIPE_SECRET_KEY);
    const sessions = [];
    // Small bounded batches limit concurrent Stripe API calls.
    for (let i = 0; i < events.length; i += 4) {
      sessions.push(...await Promise.all(events.slice(i, i+4).map(row =>
        inspect(env, row, entitlements, paidRows, mode)
      )));
    }
    return reply({
      mode: mode || 'unknown',
      sessions,
      total: sessions.length,
      note: 'Most recent 20 recorded Checkout Sessions; one buyer may have created multiple sessions. Open/unpaid is not proof of payment failure.',
    });
  } catch (error) { return reply({ error: error?.message || 'Could not inspect checkout.' }, 503); }
}
