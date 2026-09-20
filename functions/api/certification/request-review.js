/* ═══════════════════════════════════════════════════════════════
   Request Assessment Review (human review / appeal) — launch-scope MVP
   per docs/course-audit/00-aimt-certification-assessment-standard.md
   Section 9. Staff resolve manually; this endpoint only records the request.
   ---------------------------------------------------------------
   POST /api/certification/request-review
   Headers: Authorization: Bearer <supabase access token>
   Body: { attemptId, studentExplanation, disputedRef?: { part, itemId } }
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
  const { attemptId, studentExplanation, disputedRef } = body || {};
  if (!attemptId || !String(studentExplanation || '').trim()) {
    return json({ error: 'Please describe the issue before submitting.' }, 400);
  }

  const attemptCheck = await supabaseRest(
    env,
    `certification_attempts?${new URLSearchParams({ select: 'id,assessment_version', id: `eq.${attemptId}`, user_id: `eq.${user.id}`, limit: '1' })}`
  );
  if (!attemptCheck.ok || !Array.isArray(attemptCheck.body) || !attemptCheck.body.length) {
    return json({ error: 'Attempt not found.' }, 404);
  }
  const assessmentVersion = attemptCheck.body[0].assessment_version;

  const inserted = await supabaseRest(env, 'certification_review_requests', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      user_id: user.id,
      course_slug: COURSE_SLUG,
      attempt_id: attemptId,
      assessment_version: assessmentVersion,
      disputed_ref: disputedRef || null,
      student_explanation: String(studentExplanation).trim().slice(0, 4000),
      status: 'open',
    }),
  });
  if (!inserted.ok) return json({ error: 'Could not submit review request.' }, 500);

  return json({ requested: true });
}
