/* ═══════════════════════════════════════════════════════════════
   Cadence research shadow eval — hard read-only fetch guard
   ---------------------------------------------------------------
   Every live request made by the shadow tooling goes through this
   wrapper. It refuses (throws BEFORE any network I/O) anything that is
   not a body-less GET to an allowlisted research table on the
   configured Supabase REST origin: no POST/PATCH/PUT/DELETE, no /rpc/,
   no auth/storage endpoints, no other tables. Error messages never
   include headers, so the service-role key cannot leak through them.
   ═══════════════════════════════════════════════════════════════ */

export const READ_ONLY_TABLES = Object.freeze(['research_claims', 'research_sources', 'research_topics']);

export class ReadOnlyViolation extends Error {
  constructor(reason) { super(`read-only guard refused request: ${reason}`); this.code = 'read_only_violation'; }
}

export function createReadOnlyFetch(supabaseUrl, { baseFetch = fetch, onRequest } = {}) {
  const origin = new URL(supabaseUrl).origin;
  return async function readOnlyFetch(url, init = {}) {
    const u = new URL(String(url));
    const method = String(init.method || 'GET').toUpperCase();
    if (method !== 'GET') throw new ReadOnlyViolation(`method ${method}`);
    if (init.body !== undefined && init.body !== null) throw new ReadOnlyViolation('request body present');
    if (u.origin !== origin) throw new ReadOnlyViolation('unexpected origin');
    const m = u.pathname.match(/^\/rest\/v1\/([a-z_]+)$/);
    if (!m) throw new ReadOnlyViolation(`path ${u.pathname}`);
    if (!READ_ONLY_TABLES.includes(m[1])) throw new ReadOnlyViolation(`table ${m[1]}`);
    const headers = init.headers || {};
    const prefer = headers.Prefer || headers.prefer;
    if (prefer && /return=|resolution=/.test(prefer)) throw new ReadOnlyViolation('write-style Prefer header');
    if (onRequest) onRequest({ table: m[1], query: u.search });
    return baseFetch(u.toString(), { ...init, method: 'GET' });
  };
}
