/* ═══════════════════════════════════════════════════════════════
   Get-or-create a student's one durable thread for a module, and return
   its messages in chronological order.
   ---------------------------------------------------------------
   GET /api/cadence/get-thread?moduleId=<id>
   Headers: Authorization: Bearer <supabase access token>

   Not yet called by any production UI — this is the core read path Phase
   2's shared conversation shell will consume (build contract Section 13).
   Built and tested now so real data (already being written by
   evaluate-checkpoint.js) has somewhere to be read back from once that
   UI exists, per this task's "smallest reusable server API/core layer"
   instruction.
   ═══════════════════════════════════════════════════════════════ */

import { json, hasSupabaseEnv, resolveUser, isEntitled } from '../../_lib/certification/auth.mjs';
import { getOrCreateThread, getThreadMessages } from '../../_lib/cadence/threads.mjs';

const COURSE_SLUG = 'headspa-mastery';

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!hasSupabaseEnv(env)) return json({ error: 'Misconfigured' }, 500);

  const { user, errorResponse } = await resolveUser(env, request);
  if (errorResponse) return errorResponse;

  const entitled = await isEntitled(env, user, COURSE_SLUG);
  if (!entitled) return json({ error: 'No active enrollment found for this account.' }, 403);

  const url = new URL(request.url);
  const moduleId = url.searchParams.get('moduleId');
  if (!moduleId) return json({ error: 'Invalid request.' }, 400);

  const threadResult = await getOrCreateThread(env, { userId: user.id, courseSlug: COURSE_SLUG, moduleId });
  if (!threadResult.ok) return json({ error: 'Could not load conversation thread. Please retry.' }, 500);

  const messagesResult = await getThreadMessages(env, threadResult.thread.id);
  if (!messagesResult.ok) return json({ error: 'Could not load conversation history. Please retry.' }, 500);

  return json({
    thread: { id: threadResult.thread.id, moduleId: threadResult.thread.module_id, createdAt: threadResult.thread.created_at },
    messages: (messagesResult.body || []).map((m) => ({
      id: m.id,
      role: m.role,
      mode: m.mode,
      content: m.content,
      checkpointId: m.checkpoint_id,
      createdAt: m.created_at,
      // grading_metadata is intentionally omitted from this client-facing
      // shape — it may include rubric-adjacent evidence labels that
      // shouldn't be assumed safe to display verbatim; a future UI that
      // wants to show "graded by Cadence" can be given a narrower,
      // explicitly-projected field, not the raw diagnostic blob.
    })),
  });
}
