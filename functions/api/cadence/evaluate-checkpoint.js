/* ═══════════════════════════════════════════════════════════════
   Server-authoritative Module 0-11 checkpoint evaluation.
   ---------------------------------------------------------------
   POST /api/cadence/evaluate-checkpoint
   Headers: Authorization: Bearer <supabase access token>
   Body: { moduleId, checkpointId, systemPrompt, question, studentResponse, requestId }

   Replaces the prior architecture (browser -> headspa-proxy Worker ->
   Anthropic -> browser trusts the model's own `pass` field directly) with
   the same evaluate/decide split Module 12 already uses: the model
   returns structured evidence (functions/_lib/cadence/checkpoint-
   evaluation.mjs), and decideCheckpointOutcome() -- a pure, human-authored
   function, never the model's own prose -- computes pass/revise.

   Deliberately NOT rewritten: checkpoint IDs, questions, rubrics, and the
   visible {pass, feedback} response shape are unchanged from what
   normalizeCheckpointEvaluation() already expected client-side -- see
   docs/course-audit/00-cadence-launch-sweep-build-contract.md Section 15.
   This endpoint IS the compatibility adapter Section 7 asked for: same
   outward shape, authority moved server-side underneath it.

   Also durably records the exchange in cadence_threads/cadence_messages
   (mode='checkpoint') as diagnostic transcript -- never authoritative for
   progress, which remains course_progress/APP_STATE exactly as today
   (client-side, unchanged by this endpoint).

   Idempotency: `requestId` (client-generated, stable per logical send, not
   regenerated on an automatic retry) ties one student message to one
   assistant reply. A retry with the same requestId that already has a
   recorded assistant reply returns the cached decision without a second
   Anthropic call; a retry after only the student message succeeded
   re-attempts evaluation cleanly, never creating a duplicate student
   message (enforced by cadence_messages' own unique index, not just this
   endpoint's logic).
   ═══════════════════════════════════════════════════════════════ */

import { json, hasSupabaseEnv, resolveUser, isEntitled } from '../../_lib/certification/auth.mjs';
import { getOrCreateThread, appendMessage, findMessageByIdempotencyKey } from '../../_lib/cadence/threads.mjs';
import { evaluateCheckpointServerSide } from '../../_lib/cadence/checkpoint-evaluation.mjs';
import { checkRateLimit } from '../../_lib/cadence/rate-limit.mjs';

const COURSE_SLUG = 'headspa-mastery';

// A student submits/retries a given checkpoint occasionally, not rapidly;
// generous on purpose, matching submit-interview-turn.js's reasoning.
const RATE_LIMIT = { perMinute: 15, perDay: 150 };

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!hasSupabaseEnv(env)) return json({ error: 'Misconfigured' }, 500);

  const { user, errorResponse } = await resolveUser(env, request);
  if (errorResponse) return errorResponse;

  const limited = checkRateLimit(`checkpoint:${user.id}`, RATE_LIMIT);
  if (limited) {
    return json({
      error: limited === 'minute'
        ? 'Cadence needs a short breather — try again in a minute.'
        : 'Daily checkpoint limit reached — this resets tomorrow. Your progress is saved.',
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
  const { moduleId, checkpointId, systemPrompt, question, studentResponse, requestId } = body || {};
  if (
    moduleId === undefined || moduleId === null ||
    !checkpointId || typeof checkpointId !== 'string' ||
    !systemPrompt || typeof systemPrompt !== 'string' ||
    !question || typeof question !== 'string' ||
    typeof studentResponse !== 'string' || !studentResponse.trim() ||
    !requestId || typeof requestId !== 'string'
  ) {
    return json({ error: 'Invalid request.' }, 400);
  }

  const threadResult = await getOrCreateThread(env, { userId: user.id, courseSlug: COURSE_SLUG, moduleId });
  if (!threadResult.ok) return json({ error: 'Could not open conversation thread. Please retry.' }, 500);
  const thread = threadResult.thread;

  // Idempotent replay: an assistant reply already exists for this exact
  // submission -> return the cached decision, no second Anthropic call.
  const assistantKey = requestId + ':assistant';
  const existingAssistant = await findMessageByIdempotencyKey(env, thread.id, assistantKey);
  if (existingAssistant && existingAssistant.grading_metadata) {
    const cached = existingAssistant.grading_metadata;
    return json({ pass: cached.decision === 'pass', feedback: cached.feedback, modelInfo: cached.modelInfo, replayed: true });
  }

  // Persist the student's turn first (durable regardless of what happens
  // next) — idempotent on requestId, so a retry never duplicates it.
  const studentMsg = await appendMessage(env, {
    threadId: thread.id,
    userId: user.id,
    courseSlug: COURSE_SLUG,
    role: 'user',
    mode: 'checkpoint',
    content: studentResponse,
    checkpointId,
    idempotencyKey: requestId,
  });
  if (!studentMsg.ok) return json({ error: 'Could not save your response. Please retry.' }, 500);

  let record;
  try {
    record = await evaluateCheckpointServerSide(env, { checkpointId, systemPrompt, question, studentResponse });
  } catch (e) {
    // Preserve-on-failure: the student message is already durably saved
    // above; no assistant message is written, no pass/fail is recorded.
    // A retry with the same requestId is safe (finds the student message
    // already there via the idempotency check, re-attempts evaluation).
    return json({ error: 'Cadence is temporarily unavailable — your response was saved. Please retry.', preserved: true }, 502);
  }

  const assistantMsg = await appendMessage(env, {
    threadId: thread.id,
    userId: user.id,
    courseSlug: COURSE_SLUG,
    role: 'assistant',
    mode: 'checkpoint',
    content: record.feedback,
    checkpointId,
    gradingMetadata: record,
    idempotencyKey: assistantKey,
  });
  if (!assistantMsg.ok) {
    // Evaluation succeeded but the assistant-message write failed. The
    // decision is NOT lost — it was computed above and is returned to the
    // client now — but it isn't cached for idempotent replay since it
    // never made it to durable storage. A retry with the same requestId
    // will simply re-evaluate (the student message is still deduped) and
    // succeed on the write the second time in the common case. This is a
    // deliberate, disclosed trade-off, not an unhandled failure: nothing
    // here requires manual database repair.
    return json({ pass: record.decision === 'pass', feedback: record.feedback, modelInfo: record.modelInfo });
  }

  return json({ pass: record.decision === 'pass', feedback: record.feedback, modelInfo: record.modelInfo });
}
