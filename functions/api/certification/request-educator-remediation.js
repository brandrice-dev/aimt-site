/* ═══════════════════════════════════════════════════════════════
   Request AIMT Educator Remediation Session — launch-scope MVP per
   docs/course-audit/00-aimt-certification-assessment-standard.md Section 8.
   Manual scheduling; an educator later records Attempt 4 authorization
   directly against this row (out of band, not via a student-facing API).
   ---------------------------------------------------------------
   POST /api/certification/request-educator-remediation
   Headers: Authorization: Bearer <supabase access token>
   Body: { attemptId }
   ═══════════════════════════════════════════════════════════════ */

import { json, hasSupabaseEnv, resolveUser, isEntitled, supabaseRest, COURSE_SLUG } from '../../_lib/certification/auth.mjs';

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!hasSupabaseEnv(env)) return json({ error: 'Misconfigured' }, 500);

  const { user, errorResponse } = await resolveUser(env, request);
  if (errorResponse) return errorResponse;

  const entitled = await isEntitled(env, user);
  if (!entitled) return json({ error: 'No active enrollment found.' }, 403);

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: 'Invalid request body.' }, 400);
  }
  const { attemptId } = body || {};
  if (!attemptId) return json({ error: 'Invalid request.' }, 400);

  const attemptCheck = await supabaseRest(
    env,
    `certification_attempts?${new URLSearchParams({ select: 'id', id: `eq.${attemptId}`, user_id: `eq.${user.id}`, limit: '1' })}`
  );
  if (!attemptCheck.ok || !Array.isArray(attemptCheck.body) || !attemptCheck.body.length) {
    return json({ error: 'Attempt not found.' }, 404);
  }

  const existing = await supabaseRest(
    env,
    `certification_educator_requests?${new URLSearchParams({ select: 'id,status', attempt_id: `eq.${attemptId}`, limit: '1' })}`
  );
  if (existing.ok && Array.isArray(existing.body) && existing.body.length) {
    return json({ requested: true, alreadyRequested: true, status: existing.body[0].status });
  }

  const inserted = await supabaseRest(env, 'certification_educator_requests', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ user_id: user.id, course_slug: COURSE_SLUG, attempt_id: attemptId, status: 'requested' }),
  });
  if (!inserted.ok) return json({ error: 'Could not submit request.' }, 500);

  return json({ requested: true, alreadyRequested: false });
}
