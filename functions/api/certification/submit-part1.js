/* ═══════════════════════════════════════════════════════════════
   Intentionally submit + lock Part I (Knowledge & Retention).
   Server-side scoring only — the client never supplies a score.
   ---------------------------------------------------------------
   POST /api/certification/submit-part1
   Headers: Authorization: Bearer <supabase access token>
   Body: { attemptId, responses: { "<itemId>": choiceIndex, ... } }
   ═══════════════════════════════════════════════════════════════ */

import { json, hasSupabaseEnv, resolveUser, supabaseRest } from '../../_lib/certification/auth.mjs';
import { getProductionBanks } from '../../_lib/certification/content-bank.mjs';
import { scoreKnowledgeResponses } from '../../_lib/certification/scoring.mjs';

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
  const { attemptId, responses } = body || {};
  if (!attemptId) return json({ error: 'Invalid request.' }, 400);

  const params = new URLSearchParams({ select: '*', id: `eq.${attemptId}`, user_id: `eq.${user.id}`, limit: '1' });
  const res = await supabaseRest(env, `certification_attempts?${params}`);
  if (!res.ok || !Array.isArray(res.body) || !res.body.length) return json({ error: 'Attempt not found.' }, 404);
  const attempt = res.body[0];

  // Idempotent: if already locked, just return the existing score rather than re-scoring.
  if (attempt.status !== 'in_progress') {
    return json({ locked: true, alreadySubmitted: true, knowledgeScore: attempt.knowledge_score });
  }

  const banks = getProductionBanks();
  const selectedItems = (attempt.part1_selected_ids || []).map((id) => banks.knowledgeBank.find((k) => k.id === id)).filter(Boolean);
  if (selectedItems.length !== (attempt.part1_selected_ids || []).length) {
    return json({ error: 'Assessment content unavailable.' }, 503);
  }

  const finalResponses = { ...(attempt.part1_responses || {}), ...(responses || {}) };
  const result = scoreKnowledgeResponses(selectedItems, finalResponses);

  const update = await supabaseRest(env, `certification_attempts?id=eq.${attemptId}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      status: 'part1_locked',
      part1_responses: finalResponses,
      part1_submitted_at: new Date().toISOString(),
      knowledge_score: result.percent,
    }),
  });
  if (!update.ok) return json({ error: 'Could not submit Part I.' }, 500);

  return json({ locked: true, alreadySubmitted: false, knowledgeScore: result.percent });
}
