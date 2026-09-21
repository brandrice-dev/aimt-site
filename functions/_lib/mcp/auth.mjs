/* ═══════════════════════════════════════════════════════════════
   MCP connector — dual-mode bearer auth (static secret OR Supabase
   OAuth access token belonging to an AIMT admin)
   ---------------------------------------------------------------
   functions/api/mcp.js accepts exactly ONE Authorization header, but
   the bearer value may be either of two things:

     A) MCP_CONNECTOR_SECRET  -- the existing static, out-of-band
        credential (CLI / internal diagnostics / Grok's original
        server-to-server setup). Checked first, in constant time.

     B) A Supabase OAuth access token issued by AIMT's existing
        Supabase project acting as an OAuth 2.1 authorization server
        (see /oauth/consent.html). Used by clients whose UI requires
        real OAuth (e.g. Grok's web Custom MCP Connector).

   Neither branch trusts an unverified decoded JWT for the actual
   authentication decision. Path (B) is validated the exact same way
   every other AIMT endpoint validates a Supabase bearer token: a
   server-side round trip to Supabase Auth (GET {SUPABASE_URL}/auth/v1/
   user), via the existing resolveAdmin()/resolveUser() helpers
   (functions/_lib/admin/auth.mjs, functions/_lib/certification/
   auth.mjs) -- no second admin system, no separate identity check.
   Supabase itself verifies the JWT signature and expiry; this module
   only decodes the token's payload AFTER that round trip has already
   succeeded, and only to read the supplementary `client_id` claim for
   the optional client-binding check below -- decoding never
   substitutes for verification.

   The access token value itself is never logged, anywhere, by this
   module or by its callers (functions/api/mcp.js logs only the fixed
   `reason`/`mode` strings this module returns).
   ═══════════════════════════════════════════════════════════════ */

import { checkBearerAuth } from '../research/auth.mjs';
import { resolveAdmin } from '../admin/auth.mjs';

/* Mutating MCP access (submit_research_batch writes into the research
   pipeline, even though everything it writes lands in quarantine or
   the trust ladder pending human review) requires the same tier the
   rest of the admin surface requires for mutating actions -- 'owner'
   or 'admin'. 'support' is intentionally excluded, matching
   admin.html's canMutate() / functions/api/admin/index.js's
   requireAdminRole(actor, ['owner','admin']) on every mutating admin
   action. */
const MCP_ADMIN_ROLES = ['owner', 'admin'];

function extractBearerToken(request) {
  const header = request.headers.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

/* Decodes a JWT's payload segment WITHOUT verifying its signature.
   Never call this to decide whether a token is authentic -- only to
   read a supplementary claim off a token whose authenticity was
   already independently confirmed (see module header). Web-standard
   atob/TextDecoder only, matching this repo's zero-npm-dependency
   convention for functions/api/* and its _lib helpers. */
function decodeJwtPayloadUnsafe(token) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder('utf-8').decode(bytes));
    return payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : null;
  } catch (_) {
    return null;
  }
}

/**
 * Resolves MCP connector auth for one request. Returns:
 *   { ok: true,  mode: 'static_secret' | 'oauth', actor?: { user, admin } }
 *   { ok: false, status: 401 | 403, mode, reason }
 * `reason` is always a short, non-secret label -- safe to log verbatim.
 */
export async function resolveMcpAuth(env, request) {
  const token = extractBearerToken(request);
  if (!token) return { ok: false, status: 401, mode: 'none', reason: 'missing_bearer_token' };

  // (A) Static connector secret -- constant-time compare, unchanged from
  // the pre-OAuth implementation.
  if (env.MCP_CONNECTOR_SECRET && checkBearerAuth(request, env.MCP_CONNECTOR_SECRET)) {
    return { ok: true, mode: 'static_secret' };
  }

  // (B) Not the static secret -- treat as a Supabase OAuth access token.
  // resolveAdmin() -> resolveUser() performs the ONLY authoritative check
  // here: GET {SUPABASE_URL}/auth/v1/user with this exact token. Supabase
  // verifies the JWT signature/expiry server-side; a 401 there means an
  // invalid/expired token, which we surface as 401. A verified-but-
  // non-admin (or inactive-admin) user is surfaced as 403 by the same
  // canonical admin_users check every other admin surface uses.
  const actor = await resolveAdmin(env, request, MCP_ADMIN_ROLES);
  if (actor.errorResponse) {
    const status = actor.errorResponse.status === 403 ? 403 : 401;
    return { ok: false, status, mode: 'oauth', reason: status === 403 ? 'not_admin' : 'invalid_token' };
  }

  // (B.1) Optional future client binding: once GROK_MCP_OAUTH_CLIENT_ID is
  // configured (after the Grok OAuth app is registered in Supabase), only
  // accept OAuth tokens issued to that exact client. Supabase's OAuth 2.1
  // server stamps every access token it issues with a `client_id` claim
  // (a standard Supabase JWT claim, alongside sub/role/aud -- see
  // supabase.com/docs/guides/auth/oauth-server/token-security). Reading it
  // here is safe specifically because resolveAdmin() above already proved
  // this token's signature is genuine; this step only narrows WHICH
  // already-authenticated caller is allowed, it does not authenticate.
  if (env.GROK_MCP_OAUTH_CLIENT_ID) {
    const payload = decodeJwtPayloadUnsafe(token);
    const clientId = payload && typeof payload.client_id === 'string' ? payload.client_id : null;
    if (clientId !== env.GROK_MCP_OAUTH_CLIENT_ID) {
      return { ok: false, status: 403, mode: 'oauth', reason: 'client_id_mismatch' };
    }
  }

  return { ok: true, mode: 'oauth', actor };
}
