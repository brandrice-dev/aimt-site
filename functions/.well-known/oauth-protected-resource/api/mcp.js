/* ═══════════════════════════════════════════════════════════════
   RFC 9728 OAuth 2.0 Protected Resource Metadata for /api/mcp
   ---------------------------------------------------------------
   Grok Bot Desktop (and any other standards-compliant MCP host) probes
   this exact path before starting OAuth against /api/mcp:
     GET /.well-known/oauth-protected-resource/api/mcp
   Before this file existed, that request fell through to the static
   site's HTML fallback (index.html), so the host's JSON parser choked
   on "<!DOCTYPE ..." -- AuthenticateMcpServer failed before OAuth ever
   started. This file is the fix: a real 200 JSON response.

   Supabase remains the ONLY authorization server -- this file does not
   implement one. It just tells clients where Supabase's OAuth
   endpoints are (authorization_servers), per RFC 9728 section 3.2 and
   the MCP authorization spec's "Protected Resource Metadata Discovery"
   step. The client then fetches Supabase's own OAuth/OIDC discovery
   document directly from Supabase -- never proxied through AIMT.

   Cloudflare Pages note: this file lives at
   functions/.well-known/oauth-protected-resource/api/mcp.js so Pages
   Functions' file-based router maps it to exactly the path above.
   Cloudflare Pages' STATIC ASSET uploader is documented to skip
   dot-prefixed directories (a well-known limitation for a literal
   .well-known/ folder of static files) -- but Pages FUNCTIONS are a
   separate pipeline (source files bundled into routes, not raw static
   uploads), and this route was verified locally with `wrangler pages
   dev` to route correctly and NOT fall through to the static-site
   fallback (see scripts/oauth-discovery-test.mjs and the manual smoke
   test recorded in this branch's commit message).

   No secret of any kind is ever referenced here -- SUPABASE_URL is
   Supabase's public project URL (already published in every AIMT
   browser page), never SUPABASE_SERVICE_ROLE_KEY.
   ═══════════════════════════════════════════════════════════════ */

import { MCP_RESOURCE_URL, OAUTH_SCOPE } from '../../../_lib/mcp/discovery.mjs';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // Discovery metadata is meant to be freely fetchable by any OAuth
      // client regardless of what origin it runs from -- unlike
      // /api/mcp itself, this carries no secret and grants no access by
      // itself, so a permissive CORS policy here is standards-aligned,
      // not a weakening of anything (RFC 9728 Section 3.2 error
      // handling advises Content-Type: application/json, per the
      // primary source verified against the spec text directly). This
      // is unrelated to /api/mcp's own Origin *validation*, which stays
      // untouched.
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.SUPABASE_URL) {
    // Fail closed rather than publish a metadata document pointing
    // nowhere -- mirrors /api/mcp's own "Misconfigured" 500 for the
    // same missing-env-var condition.
    return new Response('Misconfigured', { status: 500 });
  }

  return jsonResponse({
    resource: MCP_RESOURCE_URL,
    authorization_servers: [`${env.SUPABASE_URL}/auth/v1`],
    scopes_supported: [OAUTH_SCOPE],
    bearer_methods_supported: ['header'],
    resource_name: 'AIMT Research Harvester'
  });
}

/* RFC 9728 defines this as a metadata GET endpoint only. Mirrors
   /api/mcp's own explicit-405-over-implicit-404 convention for methods
   this resource deliberately does not support. */
export async function onRequestPost() {
  return new Response('Method Not Allowed', { status: 405 });
}
export async function onRequestPut() {
  return new Response('Method Not Allowed', { status: 405 });
}
export async function onRequestDelete() {
  return new Response('Method Not Allowed', { status: 405 });
}
