/* ═══════════════════════════════════════════════════════════════
   Ask Cadence — server-authoritative, non-graded conversation turn.
   ---------------------------------------------------------------
   POST /api/cadence/ask
   Headers: Authorization: Bearer <supabase access token>
   Body: { moduleId, message, requestId, guideSystemPrompt, activeCheckpointId? }

   guideSystemPrompt is the client-supplied module-aware guide system
   string (headspa-mastery.html's MODULE_GUIDE_SYSTEMS + tone constants —
   the same "client supplies content, server supplies authority" trust
   boundary evaluate-checkpoint.js already uses for rubric text, since
   this flat-HTML site has no server-importable copy of that content —
   see CLAUDE.md's "no build step" constraint). Ask Cadence has NO
   decision to protect (unlike checkpoint grading), so a client-influenced
   system prompt carries no authority risk here: this endpoint can never
   submit a checkpoint evaluation, alter checkpoint pass, alter
   certification, unlock content, or mutate any attempt/progress state —
   it only ever calls askCadenceServerSide() and appends a transcript
   message. No decision function exists in this path to bypass.

   activeCheckpointId, if supplied, is used only to look up a
   SERVER-VERIFIED (course_progress) checkpoint status — the client's own
   claim about whether it's "active" is never trusted; see
   functions/_lib/cadence/ask-cadence.mjs's getVerifiedCheckpointStatus().

   Module 12 exam integrity (Section 21): moduleId '12' is refused
   server-side whenever the student's latest certification attempt is not
   yet scored — never relies on the client hiding the pill alone.

   Durable via the same cadence_threads/cadence_messages schema and
   idempotency pattern evaluate-checkpoint.js uses (Phase 1) — one visible
   thread per (student, module), messages tagged mode='ask_cadence'.
   ═══════════════════════════════════════════════════════════════ */

import { json, hasSupabaseEnv, resolveUser, isEntitled } from '../../_lib/certification/auth.mjs';
import { getOrCreateThread, appendMessage, findMessageByIdempotencyKey, getThreadMessages, buildBoundedContext } from '../../_lib/cadence/threads.mjs';
import { askCadenceServerSide, getVerifiedCheckpointStatus, isModule12AssessmentActive, buildActiveCheckpointGuardrail } from '../../_lib/cadence/ask-cadence.mjs';
import { checkRateLimit } from '../../_lib/cadence/rate-limit.mjs';

const COURSE_SLUG = 'headspa-mastery';

// Generous but tighter than checkpoint submission -- Ask Cadence is
// optional back-and-forth chat, not an occasional graded submit.
const RATE_LIMIT = { perMinute: 12, perDay: 120 };

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!hasSupabaseEnv(env)) return json({ error: 'Misconfigured' }, 500);

  const { user, errorResponse } = await resolveUser(env, request);
  if (errorResponse) return errorResponse;

  const limited = checkRateLimit(`ask_cadence:${user.id}`, RATE_LIMIT);
  if (limited) {
    return json({
      error: limited === 'minute'
        ? 'Cadence needs a short breather — try again in a minute.'
        : 'Daily Ask Cadence limit reached — this resets tomorrow.',
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
  const { moduleId, message, requestId, guideSystemPrompt, activeCheckpointId } = body || {};
  if (
    moduleId === undefined || moduleId === null ||
    typeof message !== 'string' || !message.trim() ||
    !requestId || typeof requestId !== 'string' ||
    typeof guideSystemPrompt !== 'string' || !guideSystemPrompt.trim()
  ) {
    return json({ error: 'Invalid request.' }, 400);
  }

  // Module 12 exam integrity (Section 21) -- server-side guard, not just a
  // hidden pill. Checked before any thread/message write.
  if (String(moduleId) === '12') {
    const activeExam = await isModule12AssessmentActive(env, user.id);
    if (activeExam) {
      return json({ error: 'Ask Cadence is unavailable during an active certification assessment.' }, 403);
    }
  }

  const threadResult = await getOrCreateThread(env, { userId: user.id, courseSlug: COURSE_SLUG, moduleId });
  if (!threadResult.ok) return json({ error: 'Could not open conversation thread. Please retry.' }, 500);
  const thread = threadResult.thread;

  // Idempotent replay: an assistant reply already exists for this exact
  // submission -> return the cached reply, no second Anthropic call, no
  // duplicate persisted turn.
  const assistantKey = requestId + ':assistant';
  const existingAssistant = await findMessageByIdempotencyKey(env, thread.id, assistantKey);
  if (existingAssistant) {
    return json({ reply: existingAssistant.content, modelInfo: (existingAssistant.grading_metadata || {}).modelInfo || null, replayed: true });
  }

  // Bounded context is read BEFORE this turn's student message is
  // persisted below, so the model call below appends the new message
  // itself rather than seeing it twice.
  const existingMessagesResult = await getThreadMessages(env, thread.id);
  const boundedContext = existingMessagesResult.ok ? buildBoundedContext(existingMessagesResult.body) : [];

  // Server-verified guardrail (never trusts the client's claimed status).
  let activeCheckpointGuardrailText = null;
  if (activeCheckpointId && typeof activeCheckpointId === 'string') {
    const status = await getVerifiedCheckpointStatus(env, user.id, moduleId, activeCheckpointId);
    if (status !== 'passed') activeCheckpointGuardrailText = buildActiveCheckpointGuardrail(activeCheckpointId);
  }

  // Persist the student's turn first (durable regardless of what happens
  // next) — idempotent on requestId, so a retry never duplicates it.
  const studentMsg = await appendMessage(env, {
    threadId: thread.id,
    userId: user.id,
    courseSlug: COURSE_SLUG,
    role: 'user',
    mode: 'ask_cadence',
    content: message,
    idempotencyKey: requestId,
  });
  if (!studentMsg.ok) return json({ error: 'Could not save your message. Please retry.' }, 500);

  let reply, modelInfo;
  try {
    const result = await askCadenceServerSide(env, { guideSystemPrompt, boundedContext, studentMessage: message, activeCheckpointGuardrailText });
    reply = result.text;
    modelInfo = result.modelInfo;
  } catch (e) {
    // Preserve-on-failure: the student message is already durably saved
    // above; no assistant message is written. A retry with the same
    // requestId is safe (student message already deduped, re-attempts
    // the model call cleanly).
    return json({ error: 'Cadence is temporarily unavailable — your message was saved. Please retry.', preserved: true }, 502);
  }

  const assistantMsg = await appendMessage(env, {
    threadId: thread.id,
    userId: user.id,
    courseSlug: COURSE_SLUG,
    role: 'assistant',
    mode: 'ask_cadence',
    content: reply,
    gradingMetadata: { modelInfo }, // diagnostic only, per threads.mjs -- never authoritative
    idempotencyKey: assistantKey,
  });
  if (!assistantMsg.ok) {
    // Reply was computed and is returned now even though the durable
    // write failed -- same disclosed trade-off evaluate-checkpoint.js
    // makes: a retry with the same requestId simply re-generates and
    // (in the common case) succeeds on the write the second time.
    return json({ reply, modelInfo });
  }

  return json({ reply, modelInfo });
}
