/* ═══════════════════════════════════════════════════════════════
   Start (or resume) a Module 12 Final Certification Assessment attempt.
   ---------------------------------------------------------------
   POST /api/certification/start-attempt
   Headers: Authorization: Bearer <supabase access token>

   Server-authoritative: resolves identity, checks entitlement, verifies
   Modules 0-11 are actually complete (course_progress.state), enforces the
   attempt/remediation ladder, and — only if a new attempt is warranted —
   assembles a constrained, balanced item selection and persists it as the
   attempt's authoritative record. Returns only the client-safe projection
   of Part I (never a correct choice, rationale, or rubric).
   ═══════════════════════════════════════════════════════════════ */

import { json, hasSupabaseEnv, resolveUser, isEntitled, hasCompletedInstructionalModules, fetchAttemptSummaries, supabaseRest, COURSE_SLUG } from '../../_lib/certification/auth.mjs';
import { getCurrentAssessmentConfig } from '../../_lib/certification/assessment-config.mjs';
import { getProductionBanks } from '../../_lib/certification/content-bank.mjs';
import { assembleAttempt } from '../../_lib/certification/randomization.mjs';
import { projectKnowledgeItemForClient } from '../../_lib/certification/content-schema.mjs';
import { determineNextAttemptEligibility } from '../../_lib/certification/attempt-ladder.mjs';

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!hasSupabaseEnv(env)) return json({ error: 'Misconfigured' }, 500);

  const { user, errorResponse } = await resolveUser(env, request);
  if (errorResponse) return errorResponse;

  const entitled = await isEntitled(env, user);
  if (!entitled) return json({ error: 'No active enrollment found.' }, 403);

  const eligible = await hasCompletedInstructionalModules(env, user.id);
  if (!eligible) {
    return json({ error: 'Complete Modules 1-11 before starting the final certification assessment.' }, 409);
  }

  const config = getCurrentAssessmentConfig();
  const attempts = await fetchAttemptSummaries(env, user.id);
  const ladder = determineNextAttemptEligibility({ attempts, config });

  if (ladder.alreadyCertified) {
    return json({ state: 'certified', message: 'Certification has already been earned.' }, 409);
  }
  if (ladder.resumeAttemptNumber != null) {
    const existing = attempts.find((a) => a.attemptNumber === ladder.resumeAttemptNumber);
    const row = await fetchAttemptRow(env, existing.id, user.id);
    if (!row) return json({ error: 'Could not resume attempt.' }, 500);
    return json({ resumed: true, attempt: projectAttemptForClient(row) });
  }
  if (!ladder.canStartNewAttempt) {
    return json({ error: 'Next attempt is not yet available.', blockedReason: ladder.blockedReason, details: ladder }, 409);
  }

  // Retake-overlap minimization: avoid items this student has already seen.
  const priorSelectedIds = await fetchPriorSelectedIds(env, user.id);

  const banks = getProductionBanks();
  const assembled = assembleAttempt(banks, config, {
    seenKnowledgeIds: priorSelectedIds.knowledge,
    seenCaseIds: priorSelectedIds.cases,
    seenInterviewIds: priorSelectedIds.interviews,
  });

  if (!assembled.ok) {
    // Expected while the production bank remains CONTENT PENDING.
    return json(
      {
        error: 'The final assessment content has not been installed yet. Please check back soon.',
        reason: assembled.reason,
      },
      503
    );
  }

  const insertBody = {
    user_id: user.id,
    course_slug: COURSE_SLUG,
    assessment_version: config.assessmentVersion,
    standard_version: config.standardVersion,
    bank_version: config.bankVersion,
    attempt_number: ladder.nextAttemptNumber,
    status: 'in_progress',
    part1_selected_ids: assembled.partI.map((i) => i.id),
    part1_responses: {},
    part2_selected_ids: assembled.partII.map((i) => i.id),
    part2_case_state: Object.fromEntries(assembled.partII.map((c) => [c.id, { submitted: false, responses: {} }])),
    part3_selected_ids: assembled.partIII.map((i) => i.id),
    part3_conversation_state: Object.fromEntries(
      assembled.partIII.map((i) => [i.id, { finalized: false, followUpUsed: false, transcript: [], criterionScores: null }])
    ),
  };

  const inserted = await supabaseRest(env, 'certification_attempts', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(insertBody),
  });
  if (!inserted.ok || !Array.isArray(inserted.body) || !inserted.body.length) {
    return json({ error: 'Could not start a new attempt.' }, 500);
  }

  return json({ resumed: false, attempt: projectAttemptForClient(inserted.body[0], assembled.partI) });
}

async function fetchAttemptRow(env, attemptId, userId) {
  const params = new URLSearchParams({ select: '*', id: `eq.${attemptId}`, user_id: `eq.${userId}`, limit: '1' });
  const res = await supabaseRest(env, `certification_attempts?${params}`);
  if (!res.ok || !Array.isArray(res.body) || !res.body.length) return null;
  return res.body[0];
}

async function fetchPriorSelectedIds(env, userId) {
  const params = new URLSearchParams({
    select: 'part1_selected_ids,part2_selected_ids,part3_selected_ids',
    user_id: `eq.${userId}`,
  });
  const res = await supabaseRest(env, `certification_attempts?${params}`);
  const rows = res.ok && Array.isArray(res.body) ? res.body : [];
  return {
    knowledge: rows.flatMap((r) => r.part1_selected_ids || []),
    cases: rows.flatMap((r) => r.part2_selected_ids || []),
    interviews: rows.flatMap((r) => r.part3_selected_ids || []),
  };
}

function projectAttemptForClient(row, fullKnowledgeItems) {
  const banks = getProductionBanks();
  const knowledgeItems =
    fullKnowledgeItems || (row.part1_selected_ids || []).map((id) => banks.knowledgeBank.find((k) => k.id === id)).filter(Boolean);
  return {
    id: row.id,
    attemptNumber: row.attempt_number,
    status: row.status,
    partI: {
      items: knowledgeItems.map(projectKnowledgeItemForClient),
      responses: row.part1_responses || {},
      locked: row.status !== 'in_progress',
    },
  };
}
