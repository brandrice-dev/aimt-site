/* ═══════════════════════════════════════════════════════════════
   AIMT Research Harvester Worker — bearer auth for POST /run
   ---------------------------------------------------------------
   Deliberately self-contained: this worker deploys independently from
   the aimt-site Pages project, so this small, well-understood
   constant-time compare is duplicated here rather than cross-imported
   from functions/_lib/research/auth.mjs (same logic, same shape as
   that module -- see its own comments for why constant-time matters).
   ═══════════════════════════════════════════════════════════════ */

/** Constant-time string compare. Never short-circuits on the first
    mismatched byte, so response timing doesn't leak how much of the
    token matched. */
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Checks `Authorization: Bearer <token>` against `expectedSecret` using
    a constant-time compare. Returns false (never throws) for a missing
    header, wrong scheme, empty token, or missing expectedSecret --
    callers must treat any false as 401 and must never log the header or
    token value. */
export function checkBearerAuth(request, expectedSecret) {
  if (!expectedSecret) return false;
  const header = request.headers.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return false;
  return timingSafeEqual(token, expectedSecret);
}
