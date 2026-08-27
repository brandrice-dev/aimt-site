// Lightweight per-key rate limiting for server-side Cadence/Anthropic call
// paths inside Cloudflare Pages Functions.
//
// Reuses the same in-memory bucket pattern cadence-worker/worker.js's
// rateLimited() already uses (module-level Maps, resets on isolate recycle —
// "good enough to stop abuse," per that file's own header comment). A
// KV/Durable-Object-backed limiter is future work if this proves
// insufficient; building one now would be exactly the kind of
// distributed-job architecture this Phase 0 pass was told not to build.
//
// Callers must check this BEFORE reading or mutating any attempt/case
// state and BEFORE calling Anthropic — a rate-limited request must have
// zero side effects (no consumed follow-up, no touched transcript, no
// false pass/fail), never look like a failed evaluation.

const buckets = new Map();
const MAX_TRACKED_BUCKETS = 10000; // defensive cap, matches the Worker's pattern

/**
 * @param {string} key - typically `${mode}:${userId}`
 * @param {{perMinute?:number, perDay?:number}} [limits]
 * @returns {'minute'|'day'|null}
 */
export function checkRateLimit(key, { perMinute = 10, perDay = 60 } = {}) {
  const now = Date.now();
  const minuteKey = `${key}:m:${Math.floor(now / 60000)}`;
  const dayKey = `${key}:d:${Math.floor(now / 86400000)}`;

  if (buckets.size > MAX_TRACKED_BUCKETS) buckets.clear();

  const minuteCount = (buckets.get(minuteKey) || 0) + 1;
  const dayCount = (buckets.get(dayKey) || 0) + 1;
  buckets.set(minuteKey, minuteCount);
  buckets.set(dayKey, dayCount);

  if (minuteCount > perMinute) return 'minute';
  if (dayCount > perDay) return 'day';
  return null;
}

// Test-only: clears all buckets so suites don't leak state across cases.
export function _resetRateLimitBucketsForTests() {
  buckets.clear();
}
