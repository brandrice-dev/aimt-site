/* ═══════════════════════════════════════════════════════════════
   AIMT Growth — first-party event collector
   POST /api/growth/collect

   Receives browser beacons from assets/js/aimt-growth.js. This endpoint
   is directional measurement, never an authority: it cannot record a
   checkout or a purchase (server-only events), and nothing it stores is
   used for revenue, entitlement, progress, or certification.

   Defences (everything else is rejected with no side effect):
     - same-origin POST only (Origin must match this host)
     - body ≤ 4 KB, JSON only
     - event name must be a browser-allowed event in the taxonomy
     - every field is whitelisted/sanitized by functions/_lib/growth/*
     - known crawlers are dropped
     - in-memory rate limit per visitor and per connecting IP — the IP is
       used only as an in-memory bucket key here and is never stored
     - user-bound events (service_timer_used, resource_used) require a
       valid AIMT session; user_id is resolved server-side, never trusted
       from the body
   Responds 204 for accepted-or-ignored, so the response reveals nothing.
   ═══════════════════════════════════════════════════════════════ */

import { resolveUser, supabaseRest } from '../../_lib/certification/auth.mjs';
import { checkRateLimit } from '../../_lib/cadence/rate-limit.mjs';
import { recordGrowthEvent } from '../../_lib/growth/record.mjs';
import { BROWSER_EVENTS, USER_BOUND_EVENTS, isUuid } from '../../_lib/growth/taxonomy.mjs';

const MAX_BODY_BYTES = 4096;
const BOT_UA_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|whatsapp|telegrambot|discordbot|preview|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|curl|wget|python-requests|httpclient|axios|node-fetch/i;

function noContent(status = 204) {
  return new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function isSameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

async function isAdminUser(env, userId) {
  const params = new URLSearchParams({ select: 'user_id', user_id: `eq.${userId}`, active: 'eq.true', limit: '1' });
  const res = await supabaseRest(env, `admin_users?${params}`);
  return res.ok && Array.isArray(res.body) && res.body.length > 0;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!isSameOrigin(request)) return noContent(403);

  const ua = request.headers.get('User-Agent') || '';
  if (!ua || BOT_UA_RE.test(ua)) return noContent();

  const lengthHeader = Number(request.headers.get('Content-Length') || 0);
  if (lengthHeader > MAX_BODY_BYTES) return noContent(413);
  const text = await request.text().catch(() => '');
  if (!text || text.length > MAX_BODY_BYTES) return noContent(400);

  let body;
  try { body = JSON.parse(text); } catch { return noContent(400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return noContent(400);

  const eventName = String(body.event || '');
  if (!BROWSER_EVENTS.has(eventName)) return noContent(400);
  if (!isUuid(body.visitor_id) || !isUuid(body.session_id)) return noContent(400);

  const ipKey = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (checkRateLimit(`growth:v:${body.visitor_id}`, { perMinute: 30, perDay: 400 })
    || checkRateLimit(`growth:ip:${ipKey}`, { perMinute: 120, perDay: 3000 })) {
    return noContent(429);
  }

  let userId = null;
  let isInternal = body.internal === true;
  if (USER_BOUND_EVENTS.has(eventName)) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return noContent();
    const identity = await resolveUser(env, request);
    if (identity.errorResponse) return noContent(401);
    userId = identity.user.id;
    if (!isInternal && await isAdminUser(env, userId)) isInternal = true;
  }

  await recordGrowthEvent(env, {
    eventName,
    origin: 'browser',
    visitorId: body.visitor_id,
    sessionId: body.session_id,
    userId,
    isInternal,
    pagePath: body.path,
    firstTouch: body.first_touch,
    lastTouch: body.last_touch,
    props: body.props,
  });
  return noContent();
}
