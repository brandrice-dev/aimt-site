/* ═══════════════════════════════════════════════════════════════
   Resolve the Module 12 state (A/B/C/D) for the current student. The
   client is a display layer only — every field returned here is derived
   from the server-authoritative record, never from localStorage/APP_STATE.
   ---------------------------------------------------------------
   GET /api/certification/get-status
   Headers: Authorization: Bearer <supabase access token>
   ═══════════════════════════════════════════════════════════════ */

import { json, hasSupabaseEnv, resolveUser, isEntitled, hasCompletedInstructionalModules, fetchLadderGateRows, supabaseRest } from '../../_lib/certification/auth.mjs';
import { resolveAssessmentConfig, resolveCurrentAssessmentConfig, resolveRequestedCourse, requestedCourseFromQuery } from '../../_lib/courses/registry.mjs';
import { determineNextAttemptEligibility } from '../../_lib/certification/attempt-ladder.mjs';

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!hasSupabaseEnv(env)) return json({ error: 'Misconfigured' }, 500);

  const { user, errorResponse } = await resolveUser(env, request);
  if (errorResponse) return errorResponse;

  // ?courseSlug= absent -> Head Spa (existing client); explicit -> must be an
  // active registry course, never a fallback.
  const requested = resolveRequestedCourse(requestedCourseFromQuery(new URL(request.url).searchParams));
  if (!requested.ok) return json({ error: 'Unknown course.', reason: requested.reason }, 400);
  const courseSlug = requested.slug;

  const entitled = await isEntitled(env, user, courseSlug);
  if (!entitled) return json({ error: 'No active enrollment found.' }, 403);

  const eligible = await hasCompletedInstructionalModules(env, user.id, courseSlug);

  const attemptsRes = await supabaseRest(
    env,
    `certification_attempts?${new URLSearchParams({
      select: 'id,attempt_number,status,certification_decision,critical_domain_results,knowledge_score,applied_cases_score,interview_score,overall_score,decision_at,started_at,assessment_version',
      user_id: `eq.${user.id}`,
      course_slug: `eq.${courseSlug}`,
      order: 'attempt_number.asc',
    })}`
  );
  const rows = attemptsRes.ok && Array.isArray(attemptsRes.body) ? attemptsRes.body : [];

  const current = resolveCurrentAssessmentConfig(courseSlug);
  if (!current.ok) return json({ error: 'Assessment configuration unavailable.' }, 500);
  const config = current.config;
  const ladderInput = rows.map((r) => ({
    attemptNumber: r.attempt_number,
    decision: r.certification_decision || null,
    criticalDomainResults: r.critical_domain_results || [],
  }));
  const gate = await fetchLadderGateRows(env, user.id, courseSlug);
  const ladder = determineNextAttemptEligibility({
    attempts: ladderInput,
    remediationAssignments: gate.remediationAssignments,
    educatorRequests: gate.educatorRequests,
    config,
  });
  // Certified (C) and in-progress (B) resolve before the ladder reads any
  // gate row, so they stay valid. Anything else computed from unreadable
  // gate rows could advertise a retake or a missing educator authorization
  // that isn't real -- refuse instead of guessing.
  if (!gate.ok && !ladder.alreadyCertified && ladder.resumeAttemptNumber == null) {
    return json({ error: 'We couldn’t verify your certification status right now. Please try again in a moment.', retryable: true }, 503);
  }

  let state = 'A';
  if (ladder.alreadyCertified) state = 'C';
  else if (ladder.resumeAttemptNumber != null) state = 'B';
  else if (rows.some((r) => r.certification_decision === 'not_yet_passed')) state = 'D';

  const latestFinalized = rows.filter((r) => r.certification_decision).sort((a, b) => b.attempt_number - a.attempt_number)[0] || null;
  const inProgressAttempt = rows.find((r) => r.attempt_number === ladder.resumeAttemptNumber) || null;

  let remediation = null;
  if (state === 'D' && latestFinalized) {
    // Deliberately NOT filtered to latestFinalized's attempt_id: the real
    // ladder gate (determineNextAttemptEligibility, Section 8) evaluates
    // required_before_next_attempt + completed across every remediation row
    // the student has ever been assigned, not just the most recent attempt.
    // A student who left Attempt 1's recommended-review items incomplete
    // and then also failed Attempt 2 must still see and be able to complete
    // those older items -- otherwise Attempt 3 would stay locked for a
    // reason the Remediation Plan screen never showed them.
    remediation = gate.remediationAssignments;
  }

  let educatorRequest = null;
  if (ladder.blockedReason === 'educator_authorization_required' || ladder.blockedReason === 'individual_aimt_review') {
    educatorRequest = gate.educatorRequests[0] || null; // newest first
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
          // Resolved against the SPECIFIC version this attempt was actually
          // scored under (never "whatever's current"), per the versioned-
          // config architecture in assessment-config.mjs -- a future
          // threshold revision must never silently reinterpret what an
          // earlier attempt was actually held to. Added so the results UI
          // can show "you needed X%, you got Y%" from real data instead of
          // a client-side hardcoded duplicate.
          thresholds: (function () {
            // Fails closed (as the unknown-version throw always did) rather
            // than showing another version's or another course's numbers.
            var scoredUnder = resolveAssessmentConfig(courseSlug, latestFinalized.assessment_version);
            if (!scoredUnder.ok) throw new Error('Unresolvable assessment version: ' + latestFinalized.assessment_version);
            var cfg = scoredUnder.config;
            return { weights: cfg.weights, minimums: cfg.minimums };
          })(),
          criticalDomainResults: latestFinalized.critical_domain_results,
          decisionAt: latestFinalized.decision_at,
        }
      : null,
    remediation,
    educatorRequest,
    attemptHistory: rows.map((r) => ({ attemptNumber: r.attempt_number, decision: r.certification_decision, status: r.status })),
  });
}
