/* ═══════════════════════════════════════════════════════════════
   Resolve the Module 12 state (A/B/C/D) for the current student. The
   client is a display layer only — every field returned here is derived
   from the server-authoritative record, never from localStorage/APP_STATE.
   ---------------------------------------------------------------
   GET /api/certification/get-status
   Headers: Authorization: Bearer <supabase access token>
   ═══════════════════════════════════════════════════════════════ */

import { json, hasSupabaseEnv, resolveUser, isEntitled, hasCompletedInstructionalModules, supabaseRest, COURSE_SLUG } from '../../_lib/certification/auth.mjs';
import { getCurrentAssessmentConfig } from '../../_lib/certification/assessment-config.mjs';
import { determineNextAttemptEligibility } from '../../_lib/certification/attempt-ladder.mjs';

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!hasSupabaseEnv(env)) return json({ error: 'Misconfigured' }, 500);

  const { user, errorResponse } = await resolveUser(env, request);
  if (errorResponse) return errorResponse;

  const entitled = await isEntitled(env, user);
  if (!entitled) return json({ error: 'No active enrollment found.' }, 403);

  const eligible = await hasCompletedInstructionalModules(env, user.id);

  const attemptsRes = await supabaseRest(
    env,
    `certification_attempts?${new URLSearchParams({
      select: 'id,attempt_number,status,certification_decision,critical_domain_results,knowledge_score,applied_cases_score,interview_score,overall_score,decision_at,started_at',
      user_id: `eq.${user.id}`,
      course_slug: `eq.${COURSE_SLUG}`,
      order: 'attempt_number.asc',
    })}`
  );
  const rows = attemptsRes.ok && Array.isArray(attemptsRes.body) ? attemptsRes.body : [];

  const config = getCurrentAssessmentConfig();
  const ladderInput = rows.map((r) => ({
    attemptNumber: r.attempt_number,
    decision: r.certification_decision || null,
    criticalDomainResults: r.critical_domain_results || [],
  }));
  const ladder = determineNextAttemptEligibility({ attempts: ladderInput, config });

  let state = 'A';
  if (ladder.alreadyCertified) state = 'C';
  else if (ladder.resumeAttemptNumber != null) state = 'B';
  else if (rows.some((r) => r.certification_decision === 'not_yet_passed')) state = 'D';

  const latestFinalized = rows.filter((r) => r.certification_decision).sort((a, b) => b.attempt_number - a.attempt_number)[0] || null;
  const inProgressAttempt = rows.find((r) => r.attempt_number === ladder.resumeAttemptNumber) || null;

  let remediation = null;
  if (state === 'D' && latestFinalized) {
    const remRes = await supabaseRest(
      env,
      `certification_remediation_assignments?${new URLSearchParams({
        select: 'competency_area,critical_domain,module_ref,section_ref,required_before_next_attempt,completed',
        user_id: `eq.${user.id}`,
        course_slug: `eq.${COURSE_SLUG}`,
        attempt_id: `eq.${latestFinalized.id}`,
      })}`
    );
    remediation = remRes.ok && Array.isArray(remRes.body) ? remRes.body : [];
  }

  let educatorRequest = null;
  if (ladder.blockedReason === 'educator_authorization_required' || ladder.blockedReason === 'individual_aimt_review') {
    const eduRes = await supabaseRest(
      env,
      `certification_educator_requests?${new URLSearchParams({
        select: 'status,attempt4_authorized,requested_at',
        user_id: `eq.${user.id}`,
        course_slug: `eq.${COURSE_SLUG}`,
        order: 'requested_at.desc',
        limit: '1',
      })}`
    );
    educatorRequest = eduRes.ok && Array.isArray(eduRes.body) && eduRes.body.length ? eduRes.body[0] : null;
  }

  return json({
    eligible,
    state,
    ladder,
    inProgressAttempt: inProgressAttempt
      ? { id: inProgressAttempt.id, attemptNumber: inProgressAttempt.attempt_number, status: inProgressAttempt.status }
      : null,
    performanceReview: latestFinalized
      ? {
          attemptId: latestFinalized.id,
          attemptNumber: latestFinalized.attempt_number,
          decision: latestFinalized.certification_decision,
          overallScore: latestFinalized.overall_score,
          componentScores: {
            knowledge: latestFinalized.knowledge_score,
            appliedCases: latestFinalized.applied_cases_score,
            interview: latestFinalized.interview_score,
          },
          criticalDomainResults: latestFinalized.critical_domain_results,
          decisionAt: latestFinalized.decision_at,
        }
      : null,
    remediation,
    educatorRequest,
    attemptHistory: rows.map((r) => ({ attemptNumber: r.attempt_number, decision: r.certification_decision, status: r.status })),
  });
}
