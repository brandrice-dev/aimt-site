/* ═══════════════════════════════════════════════════════════════
   Submit one student turn in a Part III practitioner conversation.
   ---------------------------------------------------------------
   POST /api/certification/submit-interview-turn
   Headers: Authorization: Bearer <supabase access token>
   Body: { attemptId, interviewId, studentResponse }

   Cadence evaluates the turn against that interview's human-authored
   rubric (functions/_lib/certification/cadence-grader.mjs), may request
   exactly ONE follow-up, and the conversation locks once a result is
   finalized. Rubric criteria/scores are never sent to the client mid-
   conversation — only the next prompt or a natural transition line.
   ═══════════════════════════════════════════════════════════════ */

import { json, hasSupabaseEnv, resolveUser, supabaseRest } from '../../_lib/certification/auth.mjs';
import { getProductionBanks } from '../../_lib/certification/content-bank.mjs';
import { evaluateInterviewTurn } from '../../_lib/certification/cadence-grader.mjs';
import { scoreInterviewConversation, computeInterviewComponent, interviewEvaluatorFlagsFromState } from '../../_lib/certification/scoring.mjs';

function mergeCriterionScores(previous, latest) {
  const merged = { ...(previous || {}) };
  for (const [criterionId, score] of Object.entries(latest || {})) {
    merged[criterionId] = Math.max(merged[criterionId] ?? -1, Number(score) || 0);
    if (merged[criterionId] < 0) merged[criterionId] = Number(score) || 0;
  }
  return merged;
}

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
  const { attemptId, interviewId, studentResponse } = body || {};
  if (!attemptId || !interviewId || typeof studentResponse !== 'string' || !studentResponse.trim()) {
    return json({ error: 'Invalid request.' }, 400);
  }

  const params = new URLSearchParams({ select: '*', id: `eq.${attemptId}`, user_id: `eq.${user.id}`, limit: '1' });
  const res = await supabaseRest(env, `certification_attempts?${params}`);
  if (!res.ok || !Array.isArray(res.body) || !res.body.length) return json({ error: 'Attempt not found.' }, 404);
  const attempt = res.body[0];

  if (attempt.status !== 'part2_locked') return json({ error: 'Part III is not currently active for this attempt.' }, 409);
  if (!(attempt.part3_selected_ids || []).includes(interviewId)) return json({ error: 'Unknown conversation for this attempt.' }, 400);

  const conversationState = { ...(attempt.part3_conversation_state || {}) };
  const state = conversationState[interviewId] || { transcript: [], followUpUsed: false, finalized: false, criterionScores: null };
  if (state.finalized) return json({ finalized: true, alreadyFinalized: true });

  const banks = getProductionBanks();
  const interviewDef = banks.interviewBank.find((i) => i.id === interviewId);
  if (!interviewDef) return json({ error: 'Assessment content unavailable.' }, 503);

  const priorTranscript = state.transcript.length ? state.transcript.slice() : [{ role: 'assistant', content: interviewDef.primaryPrompt }];

  let evaluation;
  try {
    evaluation = await evaluateInterviewTurn(env, {
      interviewDef,
      priorTranscript,
      studentResponse,
      followUpAlreadyUsed: state.followUpUsed,
    });
  } catch (e) {
    // Preserve the student's response; do not finalize or falsely score on evaluator failure.
    const transcriptWithPreservedResponse = priorTranscript.concat([{ role: 'user', content: studentResponse }]);
    conversationState[interviewId] = { ...state, transcript: transcriptWithPreservedResponse };
    await supabaseRest(env, `certification_attempts?id=eq.${attemptId}`, {
      method: 'PATCH',
      body: JSON.stringify({ part3_conversation_state: conversationState }),
    });
    return json({ error: 'Cadence is temporarily unavailable — your response was saved. Please retry.' }, 502);
  }

  const mergedCriterionScores = mergeCriterionScores(state.criterionScores, evaluation.criterionScores);
  const mergedExplicitUnsafeDomains = Array.from(new Set([...(state.explicitUnsafeDomains || []), ...evaluation.explicitUnsafeDomains]));
  const mergedPatternTags = { ...(state.patternTags || {}), ...(evaluation.patternTags || {}) };

  let transcript = priorTranscript.concat([{ role: 'user', content: studentResponse }]);

  if (evaluation.needsFollowUp) {
    transcript = transcript.concat([{ role: 'assistant', content: evaluation.followUpPrompt }]);
    conversationState[interviewId] = {
      transcript,
      followUpUsed: true,
      finalized: false,
      criterionScores: mergedCriterionScores,
      explicitUnsafeDomains: mergedExplicitUnsafeDomains,
      patternTags: mergedPatternTags,
    };
    await supabaseRest(env, `certification_attempts?id=eq.${attemptId}`, {
      method: 'PATCH',
      body: JSON.stringify({ part3_conversation_state: conversationState }),
    });
    return json({ finalized: false, needsFollowUp: true, followUpPrompt: evaluation.followUpPrompt });
  }

  // Finalize this conversation.
  conversationState[interviewId] = {
    transcript,
    followUpUsed: state.followUpUsed,
    finalized: true,
    criterionScores: mergedCriterionScores,
    explicitUnsafeDomains: mergedExplicitUnsafeDomains,
    patternTags: mergedPatternTags,
    finalizedAt: new Date().toISOString(),
  };

  const allSelected = attempt.part3_selected_ids || [];
  const allFinalized = allSelected.every((id) => conversationState[id] && conversationState[id].finalized);

  const updateBody = { part3_conversation_state: conversationState };
  if (allFinalized) {
    const interviewResults = allSelected.map((id) => {
      const def = banks.interviewBank.find((i) => i.id === id);
      const cs = conversationState[id];
      const evaluatorFlags = interviewEvaluatorFlagsFromState(cs);
      return scoreInterviewConversation(def, cs.criterionScores, evaluatorFlags);
    });
    const component = computeInterviewComponent(interviewResults);
    updateBody.status = 'part3_locked';
    updateBody.part3_submitted_at = new Date().toISOString();
    updateBody.interview_score = component.percent;
  }

  const update = await supabaseRest(env, `certification_attempts?id=eq.${attemptId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateBody),
  });
  if (!update.ok) return json({ error: 'Could not finalize conversation.' }, 500);

  return json({ finalized: true, needsFollowUp: false, transitionLine: evaluation.transitionLine, allConversationsFinalized: allFinalized });
}
