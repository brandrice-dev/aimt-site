/* ═══════════════════════════════════════════════════════════════
   Submit Intro — server-authoritative, non-graded onboarding welcome reply.
   ---------------------------------------------------------------
   POST /api/cadence/submit-intro
   Headers: Authorization: Bearer <supabase access token>
   Body: { system, text }

   Migrated off cadence-worker/worker.js (the legacy headspa-proxy Worker)
   per docs/course-audit/00-aimt-launch-readiness-gate-1.md Finding P0-1 --
   the second of the two remaining student-facing features with no Pages
   Function counterpart. headspa-mastery.html's submitIntro() (the
   new-student onboarding welcome-response generator) unlocks the course
   (APP_STATE.setStudent({introComplete: true, ...}), the local save() that
   aimt-progress-sync.js syncs to course_progress, and
   persistCadenceWelcomeComplete()'s Supabase auth user_metadata write) --
   but does so UNCONDITIONALLY, before this endpoint is ever called and
   independent of whether it succeeds. This endpoint's own reply text is
   shown once in the intro screen and never persisted anywhere -- it has no
   decision function, no course_progress write, and no thread/transcript
   persistence of its own, matching Ask Cadence's non-authority shape
   (build contract Section 5: "None -- never graded. Never [alter
   competency state]"). It is NOT routed through askCadenceServerSide
   itself because it is semantically different from Ask Cadence: no
   conversation thread, no checkpoint-guardrail injection, no scenario-fact
   gate (this is a one-time welcome response to a self-introduction, not
   scenario-based practice guidance) -- it reuses only the shared low-level
   model-call primitive (functions/_lib/cadence/ask-cadence.mjs's
   callCadenceChatModel()), which resolves the same centralized
   CADENCE_CHAT_MODEL authority every other Chat-role call site uses.

   `system` is the client-supplied, per-submission welcome-response
   instruction string (headspa-mastery.html's submitIntro(), unchanged,
   including the student's own name/background already interpolated into
   it client-side) -- the same "client supplies content, server supplies
   authority" trust boundary functions/api/cadence/ask.js and
   evaluate-checkpoint.js already document and rely on, since this
   flat-HTML site has no server-importable copy of that content
   (CLAUDE.md's "no build step" constraint). There is no decision to
   protect here (no pass/fail, no progress write -- unlock already
   happened client-side before this call), so a client-influenced system
   prompt carries no authority risk, exactly as Ask Cadence's
   guideSystemPrompt does not.
   ═══════════════════════════════════════════════════════════════ */

import { json, hasSupabaseEnv, resolveUser, isEntitled } from '../../_lib/certification/auth.mjs';
import { callCadenceChatModel } from '../../_lib/cadence/ask-cadence.mjs';
import { checkRateLimit } from '../../_lib/cadence/rate-limit.mjs';

const COURSE_SLUG = 'headspa-mastery';

// A one-time onboarding step, occasionally retried -- generous but bounded,
// matching the same reasoning as evaluate-script.js's limit.
const RATE_LIMIT = { perMinute: 8, perDay: 60 };

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!hasSupabaseEnv(env)) return json({ error: 'Misconfigured' }, 500);

  const { user, errorResponse } = await resolveUser(env, request);
  if (errorResponse) return errorResponse;

  const limited = checkRateLimit(`submit_intro:${user.id}`, RATE_LIMIT);
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
    // The course is already unlocked client-side regardless of this call's
    // outcome (see header comment) -- the caller's own .catch() shows a
    // safe local fallback welcome message, same as the prior Worker-backed
    // behavior. Nothing here needs to be "preserved" for retry.
    return json({ error: 'Cadence is temporarily unavailable. Please try again.' }, 502);
  }
}
