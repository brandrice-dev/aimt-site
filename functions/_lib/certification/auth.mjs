// Shared identity/entitlement/REST helpers, originally built for
// functions/api/certification/*.js and now also reused by
// functions/api/cadence/*.js (functions/_lib/cadence/threads.mjs and its
// callers) — same identity/entitlement rules apply to both, so this stays
// the one place that logic lives rather than a second copy. Mirrors the
// exact pattern already established by functions/api/issue-certificate.js
// and cadence-worker/worker.js — bearer token -> GET {SUPABASE_URL}/auth/v1/user
// (service-role apikey, user's own token as Authorization) -> resolve user
// server-side -> entitlement check via course_entitlements. No parallel auth
// system is introduced; this only factors the existing pattern out for reuse.

export const COURSE_SLUG = 'headspa-mastery';

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function supabaseRest(env, path, options = {}) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

export function hasSupabaseEnv(env) {
  return !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Resolves the caller's identity from the Authorization header. Returns
 * `{ user }` on success or `{ errorResponse }` (a ready-to-return Response)
 * on failure — callers should `return result.errorResponse` immediately.
 */
export async function resolveUser(env, request) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return { errorResponse: json({ error: 'Sign in required.' }, 401) };

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!userRes.ok) return { errorResponse: json({ error: 'Session expired — sign in again.' }, 401) };
  const user = await userRes.json().catch(() => null);
  if (!user || !user.id) return { errorResponse: json({ error: 'Session expired — sign in again.' }, 401) };
  return { user };
}

export async function isEntitled(env, user, courseSlug = COURSE_SLUG) {
  const email = String(user.email || '').trim().toLowerCase();
  const params = new URLSearchParams({
    select: 'checkout_session_id',
    course_slug: `eq.${courseSlug}`,
    or: `(user_id.eq.${user.id},purchaser_email.eq.${email})`,
    limit: '1',
  });
  const ent = await supabaseRest(env, `course_entitlements?${params}`);
  return ent.ok && Array.isArray(ent.body) && ent.body.length > 0;
}

/**
 * Reads the student's synced course_progress.state and reports whether
 * Modules 0-11 are all marked complete server-side — the eligibility gate
 * for starting the Module 12 final assessment. Never trusts a client-passed
 * completion flag.
 */
export async function hasCompletedInstructionalModules(env, userId, courseSlug = COURSE_SLUG) {
  const params = new URLSearchParams({
    select: 'state',
    user_id: `eq.${userId}`,
    course_slug: `eq.${courseSlug}`,
    limit: '1',
  });
  const res = await supabaseRest(env, `course_progress?${params}`);
  if (!res.ok || !Array.isArray(res.body) || !res.body.length) return false;
  const state = res.body[0].state || {};
  const progress = state.progress || {};
  for (let moduleId = 0; moduleId <= 11; moduleId++) {
    const mod = progress[String(moduleId)];
    if (!mod || mod.complete !== true) return false;
  }
  return true;
}

/**
 * Fetches every certification_attempts row for this student/course, oldest
 * first, projected to the shape attempt-ladder.mjs expects.
 */
export async function fetchAttemptSummaries(env, userId, courseSlug = COURSE_SLUG) {
  const params = new URLSearchParams({
    select: 'id,attempt_number,certification_decision,critical_domain_results,status',
    user_id: `eq.${userId}`,
    course_slug: `eq.${courseSlug}`,
    order: 'attempt_number.asc',
  });
  const res = await supabaseRest(env, `certification_attempts?${params}`);
  if (!res.ok || !Array.isArray(res.body)) return [];
  return res.body.map((row) => ({
    id: row.id,
    attemptNumber: row.attempt_number,
    decision: row.certification_decision || null,
    criticalDomainResults: row.critical_domain_results || [],
    status: row.status,
  }));
}
