/* ═══════════════════════════════════════════════════════════════
   Cadence AI Proxy — HARDENED
   ---------------------------------------------------------------
   Replaces the open proxy. Every request must now carry a valid
   Supabase session token from an entitled student (or staff).

   Deploy: paste into the headspa-proxy Worker (Quick Edit or wrangler).

   Worker env vars (Settings → Variables, encrypt the secrets):
     ANTHROPIC_API_KEY          (secret)
     SUPABASE_URL               e.g. https://xxxx.supabase.co
     SUPABASE_ANON_KEY          (public anon key — used to verify tokens)
     SUPABASE_SERVICE_ROLE_KEY  (secret — entitlement lookup)
     ALLOWED_ORIGINS            comma-separated, e.g.
                                https://yourdomain.com,https://aimt-site.pages.dev
     STAFF_EMAILS               comma-separated staff emails (optional)
     CADENCE_CHAT_MODEL         optional override — MUST exactly equal
                                APPROVED_CHAT_MODEL or CANDIDATE_CHAT_MODEL
                                below, or the request is REFUSED (503), not
                                silently served on a different model. Never
                                set this to a provider "latest" alias.

   Limits enforced:
     - model allowlist (only the approved/candidate course model — see below)
     - max_tokens clamp (1000)
     - 20 requests/min per user (in-memory; resets on isolate recycle —
       good enough to stop abuse; upgrade to KV/DO later if needed)
     - 300 requests/day per user (in-memory, same caveat)

   ─── MODEL LIFECYCLE (mirrors functions/_lib/cadence/model-config.mjs's
   CADENCE_CHAT_MODEL role, registry version 'cadence-model-registry-v2') ───
   This Worker deploys by dashboard paste and cannot import that module
   directly. Keep the constants below in sync with it BY HAND — a
   repo-internal test (tests/cadence-phase0.test.mjs) fails the local suite
   if this file's values and the Pages Function registry disagree, but it
   cannot see what is actually deployed live. See
   docs/course-audit/00-cadence-launch-sweep-build-contract.md Section 6a.

   LEGACY_CHAT_MODEL is AIMT's original Cadence generation — superseded,
   never used as a fallback of any kind, kept here only so a deliberately
   authored future rollback has something explicit to point at.
   CANDIDATE_CHAT_MODEL is the current Anthropic Sonnet generation,
   registered for controlled regression testing, not yet cleared for
   default traffic. APPROVED_CHAT_MODEL is null: NO model has been promoted
   for default production use yet. This is not an oversight — it is the
   correct, honest state until a model clears the AIMT grading/conversation
   regression suite and a human explicitly promotes it (a new dated value
   here, never a silent substitution). Until then this Worker FAILS SAFE
   (503) rather than silently running checkpoint/guide-panel traffic on the
   legacy generation. ─────────────────────────────────────────────────── */

const LEGACY_CHAT_MODEL = 'claude-sonnet-4-20250514';
const CANDIDATE_CHAT_MODEL = 'claude-sonnet-5';
const APPROVED_CHAT_MODEL = null; // no model promoted yet — see header above

function resolveChatModel(env) {
  const override = typeof env.CADENCE_CHAT_MODEL === 'string' ? env.CADENCE_CHAT_MODEL.trim() : '';
  if (override) {
    if (APPROVED_CHAT_MODEL && override === APPROVED_CHAT_MODEL) return APPROVED_CHAT_MODEL;
    if (override === CANDIDATE_CHAT_MODEL) return CANDIDATE_CHAT_MODEL;
    return null; // unregistered / legacy / retired / arbitrary override — fail safe
  }
  if (APPROVED_CHAT_MODEL) return APPROVED_CHAT_MODEL;
  return null; // no approved model registered — fail safe
}

const MAX_TOKENS_CAP = 1000;
const RATE_PER_MINUTE = 20;
const RATE_PER_DAY = 300;
const COURSE_SLUG = 'headspa-mastery';

/* in-memory rate buckets (per isolate) */
const minuteBuckets = new Map();
const dayBuckets = new Map();

function corsHeaders(origin, env) {
  const allowed = String(env.ALLOWED_ORIGINS || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const ok = origin && allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0] || '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors }
  });
}

function rateLimited(userId) {
  const now = Date.now();
  const minKey = `${userId}:${Math.floor(now / 60000)}`;
  const dayKey = `${userId}:${Math.floor(now / 86400000)}`;

  /* prune occasionally so the maps don't grow unbounded */
  if (minuteBuckets.size > 5000) minuteBuckets.clear();
  if (dayBuckets.size > 5000) dayBuckets.clear();

  const m = (minuteBuckets.get(minKey) || 0) + 1;
  const d = (dayBuckets.get(dayKey) || 0) + 1;
  minuteBuckets.set(minKey, m);
  dayBuckets.set(dayKey, d);

  if (m > RATE_PER_MINUTE) return 'minute';
  if (d > RATE_PER_DAY) return 'day';
  return null;
}

async function verifySupabaseToken(token, env) {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) return null;
  const user = await res.json().catch(() => null);
  return user && user.id ? user : null;
}

async function hasEntitlement(user, env) {
  const email = String(user.email || '').trim().toLowerCase();

  /* staff bypass */
  const staff = String(env.STAFF_EMAILS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (email && staff.includes(email)) return true;

  const params = new URLSearchParams({
    select: 'checkout_session_id',
    course_slug: `eq.${COURSE_SLUG}`,
    or: `(user_id.eq.${user.id},purchaser_email.eq.${email})`,
    limit: '1'
  });
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/course_entitlements?${params}`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );
  if (!res.ok) return false;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'POST') {
      return json({ error: { message: 'Method not allowed' } }, 405, cors);
    }

    /* origin must be allowlisted (browser requests) */
    const allowed = String(env.ALLOWED_ORIGINS || '')
      .split(',').map((s) => s.trim()).filter(Boolean);
    if (!allowed.includes(origin)) {
      return json({ error: { message: 'Origin not allowed' } }, 403, cors);
    }

    /* auth: Supabase access token required */
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return json({ error: { message: 'Sign in to use Cadence.' } }, 401, cors);
    }

    const user = await verifySupabaseToken(token, env);
    if (!user) {
      return json({ error: { message: 'Session expired — please sign in again.' } }, 401, cors);
    }

    const entitled = await hasEntitlement(user, env);
    if (!entitled) {
      return json({ error: { message: 'No active enrollment found for this account.' } }, 403, cors);
    }

    const limited = rateLimited(user.id);
    if (limited) {
      return json({
        error: {
          message: limited === 'minute'
            ? 'Cadence needs a short breather — try again in a minute.'
            : 'Daily Cadence limit reached — resets tomorrow.'
        }
      }, 429, cors);
    }

    /* validate + clamp the payload */
    let body;
    try { body = await request.json(); } catch (_) {
      return json({ error: { message: 'Invalid request' } }, 400, cors);
    }

    // Model identity is a server-side decision, never a client one — the
    // client no longer sends a model string at all (see headspa-mastery.
    // html's callAI()); any legacy/unexpected body.model is ignored.
    const model = resolveChatModel(env);
    if (!model) {
      return json({ error: { message: 'Cadence is not currently configured with an approved model. Please try again later.' } }, 503, cors);
    }
    const maxTokens = Math.min(
      Number.isFinite(Number(body.max_tokens)) ? Number(body.max_tokens) : MAX_TOKENS_CAP,
      MAX_TOKENS_CAP
    );
    if (!Array.isArray(body.messages) || !body.messages.length) {
      return json({ error: { message: 'Invalid request' } }, 400, cors);
    }

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: typeof body.system === 'string' ? body.system : undefined,
        messages: body.messages
      })
    });

    const data = await upstream.text();
    return new Response(data, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...cors }
    });
  }
};
