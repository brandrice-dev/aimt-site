// Reusable in-flight-turn locking primitive for server-authoritative Cadence
// conversation endpoints.
//
// Extracted from functions/api/certification/submit-interview-turn.js's
// Phase 0C concurrency fix so a future conversational mode (a checkpoint
// conversation, a remediation conversation -- anything that evaluates one
// student turn against a provider call and persists the result) does not
// have to re-derive the same staleness math and pick its own ad hoc
// timeout. Only the pure, genuinely state-shape-independent logic lives
// here; each endpoint still owns its own Supabase read/PATCH of whatever
// jsonb sub-state it locks (submit-interview-turn.js locks
// part3_conversation_state[interviewId], for example) -- that part is not
// generalized, because there is exactly one real caller to generalize from
// today and guessing at a shape a second caller might need would be the
// premature abstraction this codebase's own conventions warn against.
//
// The design principle worth carrying to every future caller, not just the
// code: on a failed evaluation, NEVER mutate the authoritative graded
// record (a transcript, a score) to "preserve" the student's response --
// use a separate, non-graded side-channel field instead (see
// submit-interview-turn.js's `pendingResponse`). This is what makes a
// retry safe by construction rather than by remembering not to break it.

export const DEFAULT_LOCK_TIMEOUT_MS = 20000; // see submit-interview-turn.js header for the reasoning

/**
 * @param {string|null|undefined} lockedAt - ISO timestamp the lock was claimed at, or falsy if unlocked
 * @param {number} [timeoutMs]
 * @returns {boolean} true if the lock is still within its active window
 */
export function isTurnLockActive(lockedAt, timeoutMs = DEFAULT_LOCK_TIMEOUT_MS) {
  if (!lockedAt) return false;
  const claimedAt = Date.parse(lockedAt);
  if (!Number.isFinite(claimedAt)) return false;
  return Date.now() - claimedAt < timeoutMs;
}

/** The value to persist when claiming a lock. */
export function claimTurnLock() {
  return new Date().toISOString();
}

/** The value to persist when releasing a lock (success or failure). */
export function releaseTurnLock() {
  return null;
}
