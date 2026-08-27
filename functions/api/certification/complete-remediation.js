/* ═══════════════════════════════════════════════════════════════
   Mark ONE remediation assignment complete via an explicit student
   action ("Mark Review Complete") -- never automatically because the
   student merely opened the relevant module. Backend-authoritative:
   the attempt ladder (attempt-ladder.mjs) only ever reads this stored
   `completed` flag, never anything the client asserts on its own.
   ---------------------------------------------------------------
   POST /api/certification/complete-remediation
   Headers: Authorization: Bearer <supabase access token>
   Body: { remediationId }
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
  const { remediationId } = body || {};
  if (!remediationId) return json({ error: 'Invalid request.' }, 400);

  // supabaseRest uses the service-role key (bypasses RLS by design, like
  // every other endpoint in this file set) -- ownership is therefore
  // enforced explicitly here via user_id, exactly like certification_attempts
  // lookups elsewhere in this API.
  const params = new URLSearchParams({ select: '*', id: `eq.${remediationId}`, user_id: `eq.${user.id}`, limit: '1' });
  const res = await supabaseRest(env, `certification_remediation_assignments?${params}`);
  if (!res.ok || !Array.isArray(res.body) || !res.body.length) return json({ error: 'Remediation item not found.' }, 404);
  const item = res.body[0];
  if (item.completed) return json({ completed: true, alreadyCompleted: true });

  const update = await supabaseRest(env, `certification_remediation_assignments?id=eq.${remediationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed: true, completed_at: new Date().toISOString() }),
  });
  if (!update.ok) return json({ error: 'Could not update remediation status.' }, 500);

  return json({ completed: true, alreadyCompleted: false });
}
