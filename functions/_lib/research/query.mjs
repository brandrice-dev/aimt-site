/* ═══════════════════════════════════════════════════════════════
   Research Library — shared claim query (single implementation)
   ---------------------------------------------------------------
   The ONE place research_claims is queried for governed evidence
   retrieval. Two callers, same implementation:

     1. functions/api/research-query.js -- the authenticated HTTP
        endpoint (bearer auth + request parsing live there; the query
        itself lives here).
     2. functions/_lib/cadence/research-context.mjs -- Ask Cadence's
        (shadow-stage, not yet wired) research retrieval layer, which
        calls queryResearchClaims() directly with the existing server-
        side Supabase env. It never calls AIMT's own HTTP endpoint and
        needs no new secret.

   Trust semantics are the Research Library's own, unchanged:
     DISCOVERED -> SOURCE_VERIFIED -> CLAIM_VERIFIED -> AIMT_APPROVED
   min_status selects "this rung or higher"; CLAIM_VERIFIED is the
   default. This module is SELECT-only (PostgREST GET) and never writes.

   Behavior is byte-for-byte what research-query.js did inline before
   the extraction -- see tests/research-query-endpoint.test.mjs.
   ═══════════════════════════════════════════════════════════════ */

export const STATUS_RANK = Object.freeze({ DISCOVERED: 0, SOURCE_VERIFIED: 1, CLAIM_VERIFIED: 2, AIMT_APPROVED: 3 });
export const DEFAULT_MIN_STATUS = 'CLAIM_VERIFIED';
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const CLAIM_SELECT_FIELDS = Object.freeze([
  'claim_id', 'claim_text', 'claim_type', 'direction', 'topics',
  'verification_status', 'verification_review_status', 'claim_origin',
  'page_or_section_locator', 'use_status',
  'source:research_sources(source_id,title,authors,year,doi,url,source_venue,evidence_type,source_role,verification_status)'
]);

/** Statuses at or above `minStatus` on the ladder, or null if `minStatus`
    is not a ladder value. */
export function allowedStatusesFor(minStatus) {
  if (!Object.prototype.hasOwnProperty.call(STATUS_RANK, minStatus)) return null;
  const minRank = STATUS_RANK[minStatus];
  return Object.keys(STATUS_RANK).filter((s) => STATUS_RANK[s] >= minRank);
}

export function clampLimit(limit) {
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(limit) || DEFAULT_LIMIT));
}

/**
 * Builds the PostgREST query string for research_claims.
 * @param {{q?: string, topics?: string[], sourceId?: string|null, allowedStatuses: string[], limit: number}} p
 */
export function buildResearchClaimsQueryString({ q = '', topics = [], sourceId = null, allowedStatuses, limit }) {
  const qs = new URLSearchParams();
  qs.set('select', CLAIM_SELECT_FIELDS.join(','));
  qs.set('verification_status', `in.(${allowedStatuses.join(',')})`);
  qs.set('limit', String(limit));
  /* NOT ordered by verification_status text -- alphabetical order on that
     column doesn't match the trust ladder (e.g. "AIMT_APPROVED" < "CLAIM_
     VERIFIED" < "DISCOVERED" < "SOURCE_VERIFIED" alphabetically, which is
     not the ladder order). Most-recently-verified first is the closest
     meaningful ordering PostgREST can do without a rank column/view. */
  qs.set('order', 'verified_on.desc.nullslast');
  if (sourceId) qs.set('source_id', `eq.${sourceId}`);
  if (topics.length) qs.set('topics', `ov.{${topics.map((t) => t.replace(/[{}",]/g, '')).join(',')}}`);
  if (q && q.trim()) {
    /* websearch_to_tsquery via PostgREST's fts operator against the
       generated search_vector column (see the migration). */
    qs.set('search_vector', `wfts.${q.trim()}`);
  }
  return qs.toString();
}

/**
 * Queries governed research claims.
 *
 * Returns one of:
 *   { ok: true, claims }                                   -- rows as PostgREST returned them
 *   { ok: false, error: 'invalid_min_status', allowed }    -- nothing was queried
 *   { ok: false, error: 'query_failed', status, detail }   -- Supabase answered non-2xx
 *
 * Transport errors (fetch rejecting) and an unparseable 2xx body are NOT
 * caught here -- they propagate exactly as they did when this lived inline
 * in the endpoint. Callers that must never fail (Cadence) wrap this call.
 *
 * @param {{SUPABASE_URL: string, SUPABASE_SERVICE_ROLE_KEY: string}} env
 * @param {{q?: string, topics?: string[], sourceId?: string|null, minStatus?: string, limit?: number}} params
 * @param {{fetchImpl?: typeof fetch, signal?: AbortSignal}} [opts]
 */
export async function queryResearchClaims(env, params, { fetchImpl, signal } = {}) {
  const minStatus = params.minStatus === undefined ? DEFAULT_MIN_STATUS : params.minStatus;
  const allowedStatuses = allowedStatusesFor(minStatus);
  if (!allowedStatuses) {
    return { ok: false, error: 'invalid_min_status', allowed: Object.keys(STATUS_RANK) };
  }
  const limit = clampLimit(params.limit === undefined ? DEFAULT_LIMIT : params.limit);
  const qs = buildResearchClaimsQueryString({
    q: params.q || '',
    topics: Array.isArray(params.topics) ? params.topics : [],
    sourceId: params.sourceId || null,
    allowedStatuses,
    limit
  });

  const doFetch = fetchImpl || fetch;
  const init = {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  };
  if (signal) init.signal = signal;
  const res = await doFetch(`${env.SUPABASE_URL}/rest/v1/research_claims?${qs}`, init);
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    return { ok: false, error: 'query_failed', status: res.status, detail: errBody.slice(0, 500) };
  }
  const claims = await res.json();
  return { ok: true, claims };
}
