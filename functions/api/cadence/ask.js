/* ═══════════════════════════════════════════════════════════════
   Ask Cadence — server-authoritative, non-graded conversation turn.
   ---------------------------------------------------------------
   POST /api/cadence/ask
   Headers: Authorization: Bearer <supabase access token>
   Body: { moduleId, message, requestId, guideSystemPrompt, activeCheckpointId? }

   guideSystemPrompt remains in the request for compatibility, but is not
   trusted as course authority. Server context is generated from the existing
   approved course guide constants and non-assessment lesson paragraphs.
   This endpoint can never grade, unlock modules or issue a certification.

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

import { json as baseJson, hasSupabaseEnv, resolveUser, isEntitled } from '../../_lib/certification/auth.mjs';
import { getOrCreateThread, appendMessage, findMessageByIdempotencyKey, getThreadMessages, buildBoundedContext } from '../../_lib/cadence/threads.mjs';
import { askCadenceServerSide, getVerifiedCheckpointStatus, isModule12AssessmentActive, buildActiveCheckpointGuardrail } from '../../_lib/cadence/ask-cadence.mjs';
import { checkRateLimit } from '../../_lib/cadence/rate-limit.mjs';

import {groundedCourseContext,assessmentContext,retrieveLearningResearch,safeLearningLinks,classifyLearningGap,recordLearningGap,projectLearningResearch,learningConcept} from '../../_lib/cadence/learning-research.mjs';

const COURSE_SLUG = 'headspa-mastery';
const json=(body,status=200)=>{const response=baseJson(body,status);response.headers.set('Cache-Control','private, no-store');response.headers.set('Vary','Authorization');return response;};

// Generous but tighter than checkpoint submission -- Ask Cadence is
// optional back-and-forth chat, not an occasional graded submit.
const RATE_LIMIT = { perMinute: 12, perDay: 120 };

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!hasSupabaseEnv(env)) return json({ error: 'Misconfigured' }, 500);

  const { user, errorResponse } = await resolveUser(env, request);
  if (errorResponse) {
    errorResponse.headers.set('Cache-Control','private, no-store');
    errorResponse.headers.set('Vary','Authorization');
    return errorResponse;
  }

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

  if(!/^(?:[0-9]|1[0-2])$/.test(String(moduleId)) || message.length>4000 || requestId.length>160)return json({error:'Invalid request.'},400);

  // Module 12 exam integrity (Section 21) -- server-side guard, not just a
  // hidden pill. Checked before any thread/message write.
  if (String(moduleId) === '12') {
    const activeExam = await isModule12AssessmentActive(env, user.id);
    if (activeExam) {
      return json({ error: 'Ask Cadence is unavailable during an active certification assessment.' }, 403);
    }
  }

  let assessment;
  try {assessment=await assessmentContext(env,user.id,moduleId);}catch {return json({error:'Could not verify assessment state. Please retry.'},503);}
  // Research is disabled for unresolved required checkpoints, including when a
  // caller omits or falsifies the active-checkpoint hint, and during any exam.

  const threadResult = await getOrCreateThread(env, { userId: user.id, courseSlug: COURSE_SLUG, moduleId });
  if (!threadResult.ok) return json({ error: 'Could not open conversation thread. Please retry.' }, 500);
  const thread = threadResult.thread;

  // Idempotent replay: an assistant reply already exists for this exact
  // submission -> return the cached reply, no second Anthropic call, no
  // duplicate persisted turn.
  const assistantKey = requestId + ':assistant';
  const existingAssistant = await findMessageByIdempotencyKey(env, thread.id, assistantKey);
  if (existingAssistant) {
    return json({ reply: existingAssistant.content, modelInfo: (existingAssistant.grading_metadata || {}).modelInfo || null, research:projectLearningResearch((existingAssistant.grading_metadata || {}).learningResearch), replayed: true });
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

  if(assessment.unresolvedCheckpoint && !activeCheckpointGuardrailText)activeCheckpointGuardrailText=buildActiveCheckpointGuardrail(assessment.unresolvedCheckpoint);
  const priorResearch=[...(existingMessagesResult.body || [])].reverse().find(m=>m.role==='assistant' && m.mode==='ask_cadence')?.grading_metadata?.learningResearch || null;
  const research=await retrieveLearningResearch(env,message,moduleId,{restricted:assessment.restricted,priorResearch});
  const courseGuide=groundedCourseContext(moduleId,message,research);

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

  let reply, modelInfo, scenarioGate, learningResearch, gapType;
  try {
    const result = await askCadenceServerSide(env, { guideSystemPrompt:courseGuide, boundedContext, studentMessage: message, activeCheckpointGuardrailText, research });
    reply = result.text;
    modelInfo = result.modelInfo;
    scenarioGate = result.scenarioGate;
    learningResearch={state:research.state,citations:result.citations || [],links:safeLearningLinks(research,moduleId),grounded:result.researchReview?.supported===true};
    gapType=classifyLearningGap({research,message,reviewGap:result.researchReview?.gapType});
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
    gradingMetadata: { modelInfo, scenarioGate, learningResearch }, // diagnostic only, per threads.mjs -- never authoritative
    idempotencyKey: assistantKey,
  });
  if (!assistantMsg.ok) {
    // Reply was computed and is returned now even though the durable
    // write failed -- same disclosed trade-off evaluate-checkpoint.js
    // makes: a retry with the same requestId simply re-generates and
    // (in the common case) succeeds on the write the second time.
    return json({ reply, modelInfo, research:learningResearch });
  }

  if(gapType) {try {await recordLearningGap(env,{research,moduleId,type:gapType,concept:learningConcept(message,research.routes)});}catch {/* Gap feedback never blocks the student's answer. */}}
  return json({ reply, modelInfo, research:learningResearch });
}
