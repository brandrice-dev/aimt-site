/* ═══════════════════════════════════════════════════════════════
   Research Library — internal retrieval endpoint
   ---------------------------------------------------------------
   Authenticated server-to-server READ endpoint over the research
   library. Two intended callers, same data, different filters:

     1. Cadence -- answering a student question (NOTE: Cadence's own
        future retrieval calls the shared helper in functions/_lib/
        research/query.mjs directly, not this HTTP endpoint):
          student question -> query here for relevant evidence
          -> rank/synthesize in the Worker's own prompt
          -> cite the returned source_id/claim_id back to the student
        Cadence must not treat this endpoint's results as clinical
        consensus by itself -- that judgment (evidence vs uncertainty vs
        disagreement) belongs in the Worker's synthesis prompt, using the
        verification_status / verification_review_status / direction
        fields returned here.

     2. A future AIMT course-builder tool -- "give me all AIMT-approved
        evidence relevant to <topic>" -- pass min_status=AIMT_APPROVED
        (or the default CLAIM_VERIFIED for broader draft research).

   NOT public, not browser-facing, not linked from any page. This is
   intentionally a *different* trust boundary than the public Knowledge
   Library (research_public_pages / RLS "published = true"): callers of
   this endpoint may see any CLAIM_VERIFIED-or-better research, which is
   for paid-course/internal synthesis use, not anonymous web visitors.

   Cloudflare Pages env vars required:
     RESEARCH_QUERY_SECRET       (new -- separate secret from
                                   RESEARCH_INGEST_SECRET; least privilege)
     SUPABASE_URL                (existing)
     SUPABASE_SERVICE_ROLE_KEY   (existing)

   Auth: header  Authorization: Bearer <RESEARCH_QUERY_SECRET>

   Request: GET or POST. Params (query string for GET, JSON body for POST):
     q             free-text search (matches claim_text/body_markdown)
     topics        comma-separated (GET) or string[] (POST) topic filter
     source_id     restrict to one source's claims (citation drill-down)
     min_status    'CLAIM_VERIFIED' (default) | 'AIMT_APPROVED' |
                   'SOURCE_VERIFIED' | 'DISCOVERED'
     limit         default 20, max 100

   Response: { query, count, claims: [{
     claim_id, claim_text, claim_type, direction, topics,
     verification_status, verification_review_status, claim_origin,
     page_or_section_locator, use_status,
     source: { source_id, title, authors, year, doi, url, source_venue,
               evidence_type, source_role, verification_status }
   }] }
   ═══════════════════════════════════════════════════════════════ */

import { checkBearerAuth } from '../_lib/research/auth.mjs';
/* The query itself lives in the shared helper so Cadence's research
   layer (functions/_lib/cadence/research-context.mjs) reuses this exact
   implementation instead of a second one. This file keeps only the HTTP
   concerns: method, config, bearer auth, param parsing, response shape. */
import { queryResearchClaims, DEFAULT_MIN_STATUS } from '../_lib/research/query.mjs';

async function parseParams(request) {
  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    return {
      q: typeof body.q === 'string' ? body.q : '',
      topics: Array.isArray(body.topics) ? body.topics : [],
      sourceId: typeof body.source_id === 'string' ? body.source_id : null,
      minStatus: typeof body.min_status === 'string' ? body.min_status : DEFAULT_MIN_STATUS,
      limit: Number.isFinite(body.limit) ? body.limit : 20
    };
  }
  const url = new URL(request.url);
  const sp = url.searchParams;
  return {
    q: sp.get('q') || '',
    topics: (sp.get('topics') || '').split(',').map((t) => t.trim()).filter(Boolean),
    sourceId: sp.get('source_id'),
    minStatus: sp.get('min_status') || DEFAULT_MIN_STATUS,
    limit: Number(sp.get('limit')) || 20
  };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET' && request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  if (!env.RESEARCH_QUERY_SECRET || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response('Misconfigured', { status: 500 });
  }
  if (!checkBearerAuth(request, env.RESEARCH_QUERY_SECRET)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const params = await parseParams(request);
  const result = await queryResearchClaims(env, params);
  if (!result.ok && result.error === 'invalid_min_status') {
    return new Response(JSON.stringify({ error: 'invalid_min_status', allowed: result.allowed }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }
  if (!result.ok) {
    return new Response(JSON.stringify({ error: 'query_failed', detail: result.detail }), {
      status: 502, headers: { 'Content-Type': 'application/json' }
    });
  }
  const claims = result.claims;

  return new Response(JSON.stringify({ query: params, count: claims.length, claims }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
