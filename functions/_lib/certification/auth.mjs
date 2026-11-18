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

import { requiredModulesForFinalAssessment, resolveAttemptContent } from '../courses/registry.mjs';

export const COURSE_SLUG = 'headspa-mastery';

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * The rules + content banks an EXISTING attempt is held to, derived only
 * from its own persisted row (course_slug / assessment_version /
 * bank_version). Returns `{ content }` or a ready 409 `{ errorResponse }` --
 * an unresolvable attempt is never served or scored with other content.
 */
export function resolveAttemptContentOrError(attempt) {
  const content = resolveAttemptContent(attempt);
  if (content.ok) return { content };
  return { errorResponse: json({ error: 'This attempt’s assessment version is not recognized.', reason: content.reason }, 409) };
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
    select: courseSlug === null ? 'checkout_session_id,course_slug' : 'checkout_session_id',
    or: `(user_id.eq.${user.id},purchaser_email.eq.${email})`,
    limit: '1',
  });
  // null is an explicit server-only opt-in for the included Research Library.
  // Existing course, assessment and Cadence callers retain their scoped gate.
  if(courseSlug !== null)params.set('course_slug',`eq.${courseSlug}`);
  const ent = await supabaseRest(env, `course_entitlements?${params}`);
  return ent.ok && Array.isArray(ent.body) && ent.body.some(row=>courseSlug !== null || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.course_slug || ''));
}

/**
 * Reads the student's synced course_progress.state and reports whether
 * every module the course registry requires before its final assessment
 * (Head Spa: Modules 0-11) is marked complete server-side — the eligibility
 * gate for starting the final assessment. Never trusts a client-passed
 * completion flag. An unknown course is never eligible.
 */
export async function hasCompletedInstructionalModules(env, userId, courseSlug = COURSE_SLUG) {
  const requiredModules = requiredModulesForFinalAssessment(courseSlug);
  if (!requiredModules) return false;
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
  for (const moduleId of requiredModules) {
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

/**
 * Fetches the remediation assignments and educator requests the attempt
 * ladder gates on (standard Section 8): every row for this student/course,
 * not just the latest attempt's. `ok` is false if either read failed -- an
 * empty list would silently open the Attempt 3 remediation gate, so a
 * caller that STARTS attempts must refuse rather than proceed on it.
 */
export async function fetchLadderGateRows(env, userId, courseSlug = COURSE_SLUG) {
  const scope = { user_id: `eq.${userId}`, course_slug: `eq.${courseSlug}` };
  const [remRes, eduRes] = await Promise.all([
    supabaseRest(env, `certification_remediation_assignments?${new URLSearchParams({
      select: 'id,competency_area,critical_domain,module_ref,section_ref,remediation_activity,required_before_next_attempt,completed',
      ...scope,
    })}`),
    supabaseRest(env, `certification_educator_requests?${new URLSearchParams({
      select: 'status,attempt4_authorized,requested_at',
      ...scope,
      order: 'requested_at.desc',
    })}`),
  ]);
  const remOk = remRes.ok && Array.isArray(remRes.body);
  const eduOk = eduRes.ok && Array.isArray(eduRes.body);
  return {
    ok: remOk && eduOk,
    remediationAssignments: remOk ? remRes.body : [],
    educatorRequests: eduOk ? eduRes.body : [],
  };
}
