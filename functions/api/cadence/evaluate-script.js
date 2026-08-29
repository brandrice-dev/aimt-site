/* ═══════════════════════════════════════════════════════════════
   Evaluate Script — server-authoritative, non-graded formative feedback.
   ---------------------------------------------------------------
   POST /api/cadence/evaluate-script
   Headers: Authorization: Bearer <supabase access token>
   Body: { system, text }

   Migrated off cadence-worker/worker.js (the legacy headspa-proxy Worker)
   per docs/course-audit/00-aimt-launch-readiness-gate-1.md Finding P0-1 --
   this was one of the two remaining student-facing features with no Pages
   Function counterpart. headspa-mastery.html's evaluateScript() (Module 2's
   aromatherapy-script feedback tool) is, by its own existing comment,
   "ungraded, formative feedback only. Does not touch APP_STATE, progress,
   or checkpoint state." Confirmed by reading the caller: no decision
   function, no course_progress write, no thread/transcript persistence --
   the reply is shown once and discarded, same non-authority shape Ask
   Cadence has (build contract Section 5: "None -- never graded. Never
   [alter competency state]"). It is NOT routed through askCadenceServerSide
   itself because it is semantically different from Ask Cadence: no
   conversation thread, no checkpoint-guardrail injection, no scenario-fact
   gate (this is feedback on the student's own wording exercise, not
   scenario-based practice guidance) -- it reuses only the shared low-level
   model-call primitive (functions/_lib/cadence/ask-cadence.mjs's
   callCadenceChatModel()), which resolves the same centralized
   CADENCE_CHAT_MODEL authority every other Chat-role call site uses.

   `system` is the client-supplied, fixed evaluation-instruction string
   (headspa-mastery.html's evaluateScript(), unchanged) -- the same
   "client supplies content, server supplies authority" trust boundary
   functions/api/cadence/ask.js and evaluate-checkpoint.js already document
   and rely on, since this flat-HTML site has no server-importable copy of
   that content (CLAUDE.md's "no build step" constraint). There is no
   decision to protect here (no pass/fail, no progress write), so a
   client-influenced system prompt carries no authority risk, exactly as
   Ask Cadence's guideSystemPrompt does not.
   ═══════════════════════════════════════════════════════════════ */

import { json, hasSupabaseEnv, resolveUser, isEntitled } from '../../_lib/certification/auth.mjs';
import { callCadenceChatModel } from '../../_lib/cadence/ask-cadence.mjs';
import { checkRateLimit } from '../../_lib/cadence/rate-limit.mjs';

const COURSE_SLUG = 'headspa-mastery';

// Occasional formative use (one optional exercise in Module 2), not a
// back-and-forth conversation -- tighter than Ask Cadence's own limit.
const RATE_LIMIT = { perMinute: 8, perDay: 60 };

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!hasSupabaseEnv(env)) return json({ error: 'Misconfigured' }, 500);

  const { user, errorResponse } = await resolveUser(env, request);
  if (errorResponse) return errorResponse;

  const limited = checkRateLimit(`evaluate_script:${user.id}`, RATE_LIMIT);
  if (limited) {
    return json({
      error: limited === 'minute'
        ? 'Cadence needs a short breather — try again in a minute.'
        : 'Daily limit reached for this tool — this resets tomorrow.',
    }, 429);
  }

  const entitled = await isEntitled(env, user, COURSE_SLUG);
  if (!entitled) return json({ error: 'No active enrollment found for this account.' }, 403);

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: 'Invalid request body.' }, 400);
  }
  const { system, text } = body || {};
  if (typeof system !== 'string' || !system.trim() || typeof text !== 'string' || !text.trim()) {
    return json({ error: 'Invalid request.' }, 400);
  }

  try {
    const { text: reply, modelInfo } = await callCadenceChatModel(env, {
      system,
      messages: [{ role: 'user', content: text }],
    });
    return json({ text: reply, modelInfo });
  } catch (e) {
    // No student-facing state to preserve beyond the input itself, which
    // headspa-mastery.html leaves in the (never cleared) textarea on any
    // rejected promise -- same as the prior Worker-backed behavior.
    return json({ error: 'Cadence is temporarily unavailable. Please try again.' }, 502);
  }
}
