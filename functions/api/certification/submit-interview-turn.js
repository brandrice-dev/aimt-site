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

   Phase 0 hotfixes (docs/course-audit/00-cadence-launch-sweep-build-
   contract.md Section 12):

   - Retry-after-failure no longer mutates the persisted transcript. The
     prior implementation appended the student's turn to `transcript` even
     when Anthropic failed, then a retry appended it AGAIN on top of the
     client's own (reverted) local view — producing two consecutive
     user-role transcript entries with no assistant turn between them,
     which reliably fails Anthropic's role-alternation requirement on the
     retry itself. The student's response is now preserved in a separate
     `pendingResponse` field, never inside the graded transcript, so a
     retry is a clean, ordinary evaluation attempt every time.
   - A short server-side in-flight lock (`turnInFlightAt`) prevents two
     near-simultaneous submissions for the same conversation from both
     reaching Anthropic and racing to write the result — the second sees
     the lock and is rejected before any Anthropic call or state mutation.
     The lock self-heals after its timeout so a crashed/stalled request can
     never leave a conversation permanently stuck. The staleness check and
     the timeout constant now live in functions/_lib/cadence/turn-lock.mjs
     (Phase 1) so a future conversational mode does not re-derive the same
     math or pick its own ad hoc number.
   - A per-user rate limit runs before any attempt state is read or
     mutated, so a rejected request never consumes a follow-up, touches the
     transcript, or looks like a failed evaluation.
   ═══════════════════════════════════════════════════════════════ */

import { json, hasSupabaseEnv, resolveUser, supabaseRest } from '../../_lib/certification/auth.mjs';
import { getProductionBanks } from '../../_lib/certification/content-bank.mjs';
import { evaluateInterviewTurn } from '../../_lib/certification/cadence-grader.mjs';
import { scoreInterviewConversation, computeInterviewComponent, interviewEvaluatorFlagsFromState } from '../../_lib/certification/scoring.mjs';
import { checkRateLimit } from '../../_lib/cadence/rate-limit.mjs';
import { isTurnLockActive, claimTurnLock, releaseTurnLock, casPatchSucceeded, jsonLockFieldFilterKey } from '../../_lib/cadence/turn-lock.mjs';

// A real certification interview turn involves reading a prompt, thinking,
// and typing a substantive response — nowhere near this pace even across a
// full attempt (9 turns max). Generous on purpose: a rejection here must
// never be mistaken by a legitimate student for "the exam is broken."
const RATE_LIMIT = { perMinute: 10, perDay: 60 };

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

  // Rate limit before touching any attempt state — a rejection here must
  // have zero side effects on the attempt.
  const limited = checkRateLimit(`interview:${user.id}`, RATE_LIMIT);
  if (limited) {
    return json({
      error: limited === 'minute'
        ? 'Cadence needs a short breather — try again in a minute.'
        : 'Daily practitioner-conversation limit reached — this resets tomorrow. Your progress is saved.',
    }, 429);
  }

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

  if (isTurnLockActive(state.turnInFlightAt)) {
    return json({ error: 'A response is already being evaluated for this conversation. Please wait a moment.', inFlight: true }, 409);
  }

  // Claim the lock atomically before calling Anthropic: the conditional
  // filter below only applies this PATCH if turnInFlightAt still equals what
  // we just read, so a near-simultaneous second request either sees the
  // lock on its own read above, or -- if it raced past that read -- loses
  // this compare-and-swap, rather than both requests reaching Anthropic and
  // racing to write the result. (The prior version of this claim was a
  // read-then-write TOCTOU gap between the read and this PATCH — see
  // docs/course-audit/00-aimt-launch-readiness-gate-1.md P2-4.)
  const priorInFlight = state.turnInFlightAt || null;
  const claimedState = { ...state, turnInFlightAt: claimTurnLock() };
  conversationState[interviewId] = claimedState;
  const claimParams = new URLSearchParams({ id: `eq.${attemptId}` });
  claimParams.set(
    jsonLockFieldFilterKey('part3_conversation_state', interviewId, 'turnInFlightAt'),
    priorInFlight ? `eq.${priorInFlight}` : 'is.null'
  );
  const claim = await supabaseRest(env, `certification_attempts?${claimParams}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ part3_conversation_state: conversationState }),
  });
  if (!casPatchSucceeded(claim)) {
    return json({ error: 'A response is already being evaluated for this conversation. Please wait a moment.', inFlight: true }, 409);
  }

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
    // Preserve the student's response WITHOUT touching the graded
    // transcript — see the file header for why the transcript must never
    // be mutated on a failed evaluation. Release the lock so a retry can
    // proceed immediately.
    conversationState[interviewId] = {
      ...state,
      turnInFlightAt: releaseTurnLock(),
      pendingResponse: studentResponse,
      pendingUpdatedAt: new Date().toISOString(),
    };
    await supabaseRest(env, `certification_attempts?id=eq.${attemptId}`, {
      method: 'PATCH',
      body: JSON.stringify({ part3_conversation_state: conversationState }),
    });
    return json({ error: 'Cadence is temporarily unavailable — your response was saved. Please retry.', preserved: true }, 502);
  }

  const mergedCriterionScores = mergeCriterionScores(state.criterionScores, evaluation.criterionScores);
  const mergedExplicitUnsafeDomains = Array.from(new Set([...(state.explicitUnsafeDomains || []), ...evaluation.explicitUnsafeDomains]));
  const mergedPatternTags = { ...(state.patternTags || {}), ...(evaluation.patternTags || {}) };
  const lastGradedWith = evaluation.modelInfo
    ? { provider: evaluation.modelInfo.provider, modelName: evaluation.modelInfo.modelName, status: evaluation.modelInfo.status, registryVersion: evaluation.modelInfo.registryVersion, at: new Date().toISOString() }
    : (state.lastGradedWith || null);

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
      turnInFlightAt: releaseTurnLock(),
      pendingResponse: null,
      lastGradedWith,
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
    turnInFlightAt: releaseTurnLock(),
    pendingResponse: null,
    lastGradedWith,
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
