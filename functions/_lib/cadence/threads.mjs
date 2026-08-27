// Cadence thread/message core library — the smallest reusable server layer
// needed for Phase 2 to build a shared conversation shell on top of.
//
// Backs cadence_threads/cadence_messages (supabase/migrations/
// 20260827_create_cadence_threads.sql). Covers three modes only —
// 'checkpoint', 'ask_cadence', 'remediation' — Module 12's certification
// interview is never written here; it stays exclusively in
// certification_attempts.part3_conversation_state (see that migration's
// SCOPE note and docs/course-audit/00-cadence-launch-sweep-build-
// contract.md Section 9).
//
// AUTHORITY BOUNDARY: these functions persist a TRANSCRIPT. Nothing here
// decides or writes checkpoint pass/fail — that remains
// course_progress/APP_STATE's job exactly as today. A caller that wants a
// checkpoint's authoritative decision must compute it separately
// (functions/_lib/cadence/checkpoint-evaluation.mjs) and persist it
// through the existing course_progress path; grading_metadata on a
// message here is diagnostic only.
//
// IDEMPOTENCY: appendMessage() takes an optional idempotencyKey. A second
// call with the same (threadId, idempotencyKey) pair returns the
// already-persisted row instead of inserting a duplicate — enforced first
// at the application level (a pre-check, cheap and avoids most races) and
// always at the database level too (the unique index the migration
// creates on (thread_id, idempotency_key) — the real guarantee; the
// pre-check is just an optimization to skip an unnecessary insert attempt
// in the common case).

import { supabaseRest } from '../certification/auth.mjs';

const VALID_MODES = new Set(['checkpoint', 'ask_cadence', 'remediation']);
const VALID_ROLES = new Set(['user', 'assistant']);

/**
 * Finds or creates the one thread for (user, course, module). Handles the
 * benign race where two near-simultaneous first messages in the same
 * module both attempt to create the thread — the table's own
 * unique(user_id, course_slug, module_id) constraint means only one
 * insert wins; the loser re-fetches and gets the same row.
 */
export async function getOrCreateThread(env, { userId, courseSlug, moduleId }) {
  const params = new URLSearchParams({
    select: '*',
    user_id: `eq.${userId}`,
    course_slug: `eq.${courseSlug}`,
    module_id: `eq.${String(moduleId)}`,
    limit: '1',
  });
  const existing = await supabaseRest(env, `cadence_threads?${params}`);
  if (existing.ok && Array.isArray(existing.body) && existing.body.length) {
    return { ok: true, thread: existing.body[0] };
  }

  const created = await supabaseRest(env, 'cadence_threads', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ user_id: userId, course_slug: courseSlug, module_id: String(moduleId) }),
  });
  if (created.ok && Array.isArray(created.body) && created.body.length) {
    return { ok: true, thread: created.body[0] };
  }

  // Lost the create race (unique-constraint conflict) — the winner's row
  // is now there; fetch it rather than treating this as a failure.
  const refetch = await supabaseRest(env, `cadence_threads?${params}`);
  if (refetch.ok && Array.isArray(refetch.body) && refetch.body.length) {
    return { ok: true, thread: refetch.body[0] };
  }
  return { ok: false };
}

/** Chronological (created_at ascending) messages for one thread. */
export async function getThreadMessages(env, threadId) {
  const params = new URLSearchParams({ select: '*', thread_id: `eq.${threadId}`, order: 'created_at.asc' });
  return supabaseRest(env, `cadence_messages?${params}`);
}

/** Looks up one message by its idempotency key within a thread, or null. */
export async function findMessageByIdempotencyKey(env, threadId, idempotencyKey) {
  if (!idempotencyKey) return null;
  const params = new URLSearchParams({ select: '*', thread_id: `eq.${threadId}`, idempotency_key: `eq.${idempotencyKey}`, limit: '1' });
  const res = await supabaseRest(env, `cadence_messages?${params}`);
  return res.ok && Array.isArray(res.body) && res.body.length ? res.body[0] : null;
}

/**
 * Appends one message. `role` must be 'user' or 'assistant'; callers are
 * responsible for never letting a client-supplied role reach here as
 * 'assistant' without having gone through actual server-side model
 * evaluation first — see functions/api/cadence/evaluate-checkpoint.js for
 * the one place that's currently true.
 */
export async function appendMessage(env, { threadId, userId, courseSlug, role, mode, content, checkpointId, gradingMetadata, idempotencyKey }) {
  if (!VALID_ROLES.has(role)) return { ok: false, error: 'invalid_role' };
  if (!VALID_MODES.has(mode)) return { ok: false, error: 'invalid_mode' };

  if (idempotencyKey) {
    const existing = await findMessageByIdempotencyKey(env, threadId, idempotencyKey);
    if (existing) return { ok: true, message: existing, deduped: true };
  }

  const inserted = await supabaseRest(env, 'cadence_messages', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      thread_id: threadId,
      user_id: userId,
      course_slug: courseSlug,
      role,
      mode,
      content,
      checkpoint_id: checkpointId || null,
      grading_metadata: gradingMetadata || null,
      idempotency_key: idempotencyKey || null,
    }),
  });
  if (inserted.ok && Array.isArray(inserted.body) && inserted.body.length) {
    return { ok: true, message: inserted.body[0], deduped: false };
  }

  // Lost a concurrent-insert race on the same idempotency key — the
  // winner's row is there; treat this exactly like a normal dedupe.
  if (idempotencyKey) {
    const existing = await findMessageByIdempotencyKey(env, threadId, idempotencyKey);
    if (existing) return { ok: true, message: existing, deduped: true };
  }
  return { ok: false };
}

// Recent-turns-only context builder — deliberately simple (build contract
// Section 13/17): no vector retrieval, no cross-module memory. A future
// mode that needs richer context extends this function's options, not its
// callers.
const DEFAULT_MAX_CONTEXT_MESSAGES = 6;

export function buildBoundedContext(messages, { maxMessages = DEFAULT_MAX_CONTEXT_MESSAGES } = {}) {
  if (!Array.isArray(messages)) return [];
  return messages.slice(-maxMessages).map((m) => ({ role: m.role, content: m.content }));
}
