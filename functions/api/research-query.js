/* ═══════════════════════════════════════════════════════════════
   Research Library — internal retrieval endpoint
   ---------------------------------------------------------------
   Authenticated server-to-server READ endpoint over the research
   library. Two intended callers, same data, different filters:

     1. Cadence (headspa-proxy Worker) -- answering a student question:
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

const STATUS_RANK = { DISCOVERED: 0, SOURCE_VERIFIED: 1, CLAIM_VERIFIED: 2, AIMT_APPROVED: 3 };
const DEFAULT_MIN_STATUS = 'CLAIM_VERIFIED';
const MAX_LIMIT = 100;

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function checkAuth(request, env) {
  const header = request.headers.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return false;
  return timingSafeEqual(token, env.RESEARCH_QUERY_SECRET);
}

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
  if (!checkAuth(request, env)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const params = await parseParams(request);
  if (!STATUS_RANK.hasOwnProperty(params.minStatus)) {
    return new Response(JSON.stringify({ error: 'invalid_min_status', allowed: Object.keys(STATUS_RANK) }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }
  const minRank = STATUS_RANK[params.minStatus];
  const allowedStatuses = Object.keys(STATUS_RANK).filter((s) => STATUS_RANK[s] >= minRank);
  const limit = Math.max(1, Math.min(MAX_LIMIT, Math.floor(params.limit) || 20));

  const qs = new URLSearchParams();
  qs.set('select', [
    'claim_id', 'claim_text', 'claim_type', 'direction', 'topics',
    'verification_status', 'verification_review_status', 'claim_origin',
    'page_or_section_locator', 'use_status',
    'source:research_sources(source_id,title,authors,year,doi,url,source_venue,evidence_type,source_role,verification_status)'
  ].join(','));
  qs.set('verification_status', `in.(${allowedStatuses.join(',')})`);
  qs.set('limit', String(limit));
  /* NOT ordered by verification_status text -- alphabetical order on that
     column doesn't match the trust ladder (e.g. "AIMT_APPROVED" < "CLAIM_
     VERIFIED" < "DISCOVERED" < "SOURCE_VERIFIED" alphabetically, which is
     not the ladder order). Most-recently-verified first is the closest
     meaningful ordering PostgREST can do without a rank column/view. */
  qs.set('order', 'verified_on.desc.nullslast');
  if (params.sourceId) qs.set('source_id', `eq.${params.sourceId}`);
  if (params.topics.length) qs.set('topics', `ov.{${params.topics.map((t) => t.replace(/[{}",]/g, '')).join(',')}}`);
  if (params.q && params.q.trim()) {
    /* websearch_to_tsquery via PostgREST's fts operator against the
       generated search_vector column (see the migration). */
    qs.set('search_vector', `wfts.${params.q.trim()}`);
  }

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/research_claims?${qs.toString()}`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    return new Response(JSON.stringify({ error: 'query_failed', detail: errBody.slice(0, 500) }), {
      status: 502, headers: { 'Content-Type': 'application/json' }
    });
  }
  const claims = await res.json();

  return new Response(JSON.stringify({ query: params, count: claims.length, claims }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
