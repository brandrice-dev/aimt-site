/* ═══════════════════════════════════════════════════════════════
   Fetch the client-safe content for Part II (cases) or Part III's next
   unfinished conversation, for an already-started attempt.
   ---------------------------------------------------------------
   GET /api/certification/get-part?attemptId=...&part=2|3
   Headers: Authorization: Bearer <supabase access token>
   ═══════════════════════════════════════════════════════════════ */

import { json, hasSupabaseEnv, resolveUser, supabaseRest } from '../../_lib/certification/auth.mjs';
import { getProductionBanks } from '../../_lib/certification/content-bank.mjs';
import { projectCaseForClient, projectInterviewItemForClient } from '../../_lib/certification/content-schema.mjs';

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!hasSupabaseEnv(env)) return json({ error: 'Misconfigured' }, 500);

  const { user, errorResponse } = await resolveUser(env, request);
  if (errorResponse) return errorResponse;

  const url = new URL(request.url);
  const attemptId = url.searchParams.get('attemptId');
  const part = url.searchParams.get('part');
  if (!attemptId || !['2', '3'].includes(part)) return json({ error: 'Invalid request.' }, 400);

  const params = new URLSearchParams({ select: '*', id: `eq.${attemptId}`, user_id: `eq.${user.id}`, limit: '1' });
  const res = await supabaseRest(env, `certification_attempts?${params}`);
  if (!res.ok || !Array.isArray(res.body) || !res.body.length) return json({ error: 'Attempt not found.' }, 404);
  const attempt = res.body[0];

  const banks = getProductionBanks();

  if (part === '2') {
    if (attempt.status === 'in_progress') return json({ error: 'Submit Part I before starting Part II.' }, 409);
    const caseState = attempt.part2_case_state || {};
    const cases = (attempt.part2_selected_ids || [])
      .map((id) => banks.caseBank.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => ({ ...projectCaseForClient(c), submitted: !!(caseState[c.id] && caseState[c.id].submitted) }));
    return json({ cases });
  }

  // part === '3'
  if (attempt.status !== 'part2_locked' && attempt.status !== 'part3_locked' && attempt.status !== 'scored') {
    return json({ error: 'Submit Part II before starting Part III.' }, 409);
  }
  const conversationState = attempt.part3_conversation_state || {};
  const nextInterviewId = (attempt.part3_selected_ids || []).find((id) => !(conversationState[id] && conversationState[id].finalized));
  if (!nextInterviewId) {
    return json({ allConversationsFinalized: true });
  }
  const interviewDef = banks.interviewBank.find((i) => i.id === nextInterviewId);
  if (!interviewDef) return json({ error: 'Assessment content unavailable.' }, 503);

  const state = conversationState[nextInterviewId] || { transcript: [], followUpUsed: false };
  return json({
    conversation: {
      ...projectInterviewItemForClient(interviewDef),
      transcript: state.transcript || [],
      followUpUsed: !!state.followUpUsed,
    },
  });
}
