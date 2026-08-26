/* ═══════════════════════════════════════════════════════════════
   Intentionally submit + lock one Applied Practitioner Case.
   ---------------------------------------------------------------
   POST /api/certification/submit-case
   Headers: Authorization: Bearer <supabase access token>
   Body: { attemptId, caseId, responses: { "<partId>": ... } }

   Deterministic parts (single-best-answer / multi-select / sequencing) are
   scored here directly. Any structured-short-response part is evaluated via
   Cadence server-side (functions/_lib/certification/cadence-grader.mjs) —
   the rubric never reaches the client. Once every selected case is
   submitted, Part II locks as a whole and the attempt advances toward
   Part III.
   ═══════════════════════════════════════════════════════════════ */

import { json, hasSupabaseEnv, resolveUser, supabaseRest } from '../../_lib/certification/auth.mjs';
import { getProductionBanks } from '../../_lib/certification/content-bank.mjs';
import { scoreCaseSubmission, computeAppliedCasesComponent } from '../../_lib/certification/scoring.mjs';
import { evaluateStructuredCasePart } from '../../_lib/certification/cadence-grader.mjs';

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!hasSupabaseEnv(env)) return json({ error: 'Misconfigured' }, 500);

  const { user, errorResponse } = await resolveUser(env, request);
  if (errorResponse) return errorResponse;

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: 'Invalid request body.' }, 400);
  }
  const { attemptId, caseId, responses } = body || {};
  if (!attemptId || !caseId) return json({ error: 'Invalid request.' }, 400);

  const params = new URLSearchParams({ select: '*', id: `eq.${attemptId}`, user_id: `eq.${user.id}`, limit: '1' });
  const res = await supabaseRest(env, `certification_attempts?${params}`);
  if (!res.ok || !Array.isArray(res.body) || !res.body.length) return json({ error: 'Attempt not found.' }, 404);
  const attempt = res.body[0];

  if (attempt.status !== 'part1_locked') return json({ error: 'Part II is not currently active for this attempt.' }, 409);
  if (!(attempt.part2_selected_ids || []).includes(caseId)) return json({ error: 'Unknown case for this attempt.' }, 400);

  const caseState = { ...(attempt.part2_case_state || {}) };
  if (caseState[caseId] && caseState[caseId].submitted) {
    return json({ locked: true, alreadySubmitted: true, caseScore: caseState[caseId].score });
  }

  const banks = getProductionBanks();
  const caseDef = banks.caseBank.find((c) => c.id === caseId);
  if (!caseDef) return json({ error: 'Assessment content unavailable.' }, 503);

  const finalResponses = { ...((caseState[caseId] && caseState[caseId].responses) || {}), ...(responses || {}) };

  const cadenceEvaluatedParts = {};
  try {
    for (const part of caseDef.parts) {
      if (part.type === 'structured-short-response') {
        const studentText = String(finalResponses[part.id] || '');
        cadenceEvaluatedParts[part.id] = await evaluateStructuredCasePart(env, {
          scenario: caseDef.scenario,
          part,
          studentResponse: studentText,
        });
      }
    }
  } catch (e) {
    // Preserve the student's submitted response; do not lock or falsely score on evaluator failure.
    caseState[caseId] = { submitted: false, responses: finalResponses };
    await supabaseRest(env, `certification_attempts?id=eq.${attemptId}`, {
      method: 'PATCH',
      body: JSON.stringify({ part2_case_state: caseState }),
    });
    return json({ error: 'Evaluation temporarily unavailable — your response was saved. Please retry submitting.' }, 502);
  }

  const scored = scoreCaseSubmission(caseDef, finalResponses, { cadenceEvaluatedParts });
  caseState[caseId] = { submitted: true, responses: finalResponses, score: scored.percent, evidencePoints: scored.evidencePoints, submittedAt: new Date().toISOString() };

  const allSelected = attempt.part2_selected_ids || [];
  const allSubmitted = allSelected.every((id) => caseState[id] && caseState[id].submitted);

  const updateBody = { part2_case_state: caseState };
  if (allSubmitted) {
    const caseResults = allSelected.map((id) => ({ caseId: id, percent: caseState[id].score }));
    const component = computeAppliedCasesComponent(caseResults);
    updateBody.status = 'part2_locked';
    updateBody.part2_submitted_at = new Date().toISOString();
    updateBody.applied_cases_score = component.percent;
  }

  const update = await supabaseRest(env, `certification_attempts?id=eq.${attemptId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateBody),
  });
  if (!update.ok) return json({ error: 'Could not submit case.' }, 500);

  return json({ locked: true, alreadySubmitted: false, caseScore: scored.percent, part2Complete: allSubmitted });
}
