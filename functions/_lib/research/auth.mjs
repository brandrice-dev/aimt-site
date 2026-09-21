/* ═══════════════════════════════════════════════════════════════
   Research Library — shared bearer-token auth
   ---------------------------------------------------------------
   Single source of truth for the constant-time bearer check used by
   every research-library endpoint (research-ingest.js, research-
   query.js, mcp.js). Each endpoint has its OWN secret (RESEARCH_INGEST_
   SECRET / RESEARCH_QUERY_SECRET / MCP_CONNECTOR_SECRET) -- this module
   only holds the comparison logic, never a secret value itself.
   ═══════════════════════════════════════════════════════════════ */

/** Constant-time string compare (same pattern as stripe-webhook.js's
    verifyStripeSignature). Never short-circuits on the first mismatched
    byte, so response timing doesn't leak how much of the token matched. */
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Checks `Authorization: Bearer <token>` against `expectedSecret` using a
    constant-time compare. Returns false (never throws) for a missing
    header, wrong scheme, or empty token -- callers should treat any
    false as a 401, and must never log the header or token value. */
export function checkBearerAuth(request, expectedSecret) {
  if (!expectedSecret) return false;
  const header = request.headers.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return false;
  return timingSafeEqual(token, expectedSecret);
}
