/* ═══════════════════════════════════════════════════════════════
   MCP connector — OAuth discovery constants (RFC 9728)
   ---------------------------------------------------------------
   Single source of truth for the Protected Resource Metadata URL, so
   the metadata document itself
   (functions/.well-known/oauth-protected-resource/api/mcp.js) and the
   WWW-Authenticate header /api/mcp sends on a 401
   (functions/api/mcp.js) can never drift out of sync with each other
   -- both import from here instead of each hardcoding the literal URL.

   Per RFC 9728 section 3.1 (verified against the spec text directly):
   for a resource identifier with a path component, the well-known URL
   is formed by inserting "/.well-known/oauth-protected-resource"
   between the host and the resource's path -- i.e. for
   https://aimtrichology.com/api/mcp, the metadata document lives at
   https://aimtrichology.com/.well-known/oauth-protected-resource/api/mcp.
   ═══════════════════════════════════════════════════════════════ */

export const CANONICAL_ORIGIN = 'https://aimtrichology.com';
export const MCP_RESOURCE_URL = `${CANONICAL_ORIGIN}/api/mcp`;
export const PROTECTED_RESOURCE_METADATA_URL = `${CANONICAL_ORIGIN}/.well-known/oauth-protected-resource/api/mcp`;
export const OAUTH_SCOPE = 'email';

/** The exact WWW-Authenticate value /api/mcp sends on 401 (RFC 9728
    section 5.1 / MCP authorization spec's "return proper challenges"
    guidance) -- never sent on a 403 or a successful request. */
export function wwwAuthenticateHeader() {
  return `Bearer resource_metadata="${PROTECTED_RESOURCE_METADATA_URL}", scope="${OAUTH_SCOPE}"`;
}
