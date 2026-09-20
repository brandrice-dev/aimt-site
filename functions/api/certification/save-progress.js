/* ═══════════════════════════════════════════════════════════════
   Autosave Part I answers or a Part II case draft — while that part is
   still unlocked. Locked parts silently ignore the write (idempotent,
   never resurrects a locked part).
   ---------------------------------------------------------------
   POST /api/certification/save-progress
   Headers: Authorization: Bearer <supabase access token>
   Body: { attemptId, part: 1|2, responses?: {...}, caseId?, caseResponses? }
   ═══════════════════════════════════════════════════════════════ */

import { json, hasSupabaseEnv, resolveUser, supabaseRest } from '../../_lib/certification/auth.mjs';

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
  const { attemptId, part } = body || {};
  if (!attemptId || ![1, 2].includes(part)) return json({ error: 'Invalid request.' }, 400);

  const params = new URLSearchParams({ select: '*', id: `eq.${attemptId}`, user_id: `eq.${user.id}`, limit: '1' });
  const res = await supabaseRest(env, `certification_attempts?${params}`);
  if (!res.ok || !Array.isArray(res.body) || !res.body.length) return json({ error: 'Attempt not found.' }, 404);
  const attempt = res.body[0];

  if (part === 1) {
    if (attempt.status !== 'in_progress') return json({ saved: false, reason: 'part_locked' });
    const responses = { ...(attempt.part1_responses || {}), ...(body.responses || {}) };
    // Only keep responses for items actually selected into this attempt.
    const allowedIds = new Set(attempt.part1_selected_ids || []);
    for (const key of Object.keys(responses)) if (!allowedIds.has(key)) delete responses[key];
    const update = await supabaseRest(env, `certification_attempts?id=eq.${attemptId}`, {
      method: 'PATCH',
      body: JSON.stringify({ part1_responses: responses }),
    });
    return json({ saved: update.ok });
  }

  // part === 2
  if (attempt.status !== 'part1_locked') return json({ saved: false, reason: 'part_not_active' });
  const { caseId, caseResponses } = body;
  if (!caseId || !(attempt.part2_selected_ids || []).includes(caseId)) return json({ error: 'Unknown case.' }, 400);
  const caseState = { ...(attempt.part2_case_state || {}) };
  if (caseState[caseId] && caseState[caseId].submitted) return json({ saved: false, reason: 'case_locked' });
  caseState[caseId] = { submitted: false, responses: { ...(caseState[caseId] && caseState[caseId].responses), ...(caseResponses || {}) } };
  const update = await supabaseRest(env, `certification_attempts?id=eq.${attemptId}`, {
    method: 'PATCH',
    body: JSON.stringify({ part2_case_state: caseState }),
  });
  return json({ saved: update.ok });
}
