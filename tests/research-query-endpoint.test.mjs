// /api/research-query regression tests (Cadence research shadow stage).
//
// Characterizes the endpoint's externally observable behavior -- status
// codes, error bodies, the exact PostgREST URL it builds, the headers it
// sends and the response envelope -- so the extraction of the query
// implementation into functions/_lib/research/query.mjs is provably a
// no-op for existing callers. These expectations were written against the
// pre-refactor endpoint on main (32e449b) and must keep passing unchanged.
//
// Run: node tests/research-query-endpoint.test.mjs

import { onRequest } from '../functions/api/research-query.js';

const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail });
}

const ENV = {
  RESEARCH_QUERY_SECRET: 'test-query-secret',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key'
};
const SELECT = 'claim_id,claim_text,claim_type,direction,topics,verification_status,verification_review_status,claim_origin,page_or_section_locator,use_status,source:research_sources(source_id,title,authors,year,doi,url,source_venue,evidence_type,source_role,verification_status)';
const ROWS = [{ claim_id: 'c1', claim_text: 'x', verification_status: 'CLAIM_VERIFIED', source: { source_id: 's1' } }];

function mockFetch(responder) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return responder(String(url), init);
  };
  return calls;
}
const okRows = (rows = ROWS) => () => new Response(JSON.stringify(rows), { status: 200 });

function req(method, { query = '', body, auth = `Bearer ${ENV.RESEARCH_QUERY_SECRET}` } = {}) {
  const headers = {};
  if (auth) headers.authorization = auth;
  if (body !== undefined) headers['content-type'] = 'application/json';
  return new Request(`https://aimt.test/api/research-query${query}`, {
    method,
    headers,
    body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))
  });
}

function expectedUrl(parts) {
  const qs = new URLSearchParams();
  qs.set('select', SELECT);
  qs.set('verification_status', `in.(${parts.statuses})`);
  qs.set('limit', String(parts.limit));
  qs.set('order', 'verified_on.desc.nullslast');
  if (parts.sourceId) qs.set('source_id', `eq.${parts.sourceId}`);
  if (parts.topics) qs.set('topics', parts.topics);
  if (parts.q) qs.set('search_vector', `wfts.${parts.q}`);
  return `${ENV.SUPABASE_URL}/rest/v1/research_claims?${qs.toString()}`;
}

async function run() {
  // Method / config / auth gates
  {
    const calls = mockFetch(okRows());
    const r = await onRequest({ request: req('PUT'), env: ENV });
    check('PUT -> 405', r.status === 405 && (await r.text()) === 'Method not allowed');
    const r2 = await onRequest({ request: req('GET'), env: { ...ENV, RESEARCH_QUERY_SECRET: '' } });
    check('missing secret -> 500 Misconfigured', r2.status === 500 && (await r2.text()) === 'Misconfigured');
    const r3 = await onRequest({ request: req('GET'), env: { ...ENV, SUPABASE_SERVICE_ROLE_KEY: undefined } });
    check('missing service key -> 500', r3.status === 500);
    const r4 = await onRequest({ request: req('GET', { auth: null }), env: ENV });
    check('no auth -> 401', r4.status === 401 && (await r4.text()) === 'Unauthorized');
    const r5 = await onRequest({ request: req('GET', { auth: 'Bearer wrong-secret-xxxx' }), env: ENV });
    check('wrong auth -> 401', r5.status === 401);
    check('gates never reach Supabase', calls.length === 0, calls.length);
  }

  // Invalid min_status
  {
    const calls = mockFetch(okRows());
    const r = await onRequest({ request: req('GET', { query: '?min_status=BOGUS' }), env: ENV });
    const body = await r.json();
    check('invalid min_status -> 400', r.status === 400);
    check('invalid min_status body unchanged', JSON.stringify(body) === JSON.stringify({
      error: 'invalid_min_status', allowed: ['DISCOVERED', 'SOURCE_VERIFIED', 'CLAIM_VERIFIED', 'AIMT_APPROVED']
    }), JSON.stringify(body));
    check('invalid min_status never queries', calls.length === 0);
  }

  // GET defaults
  {
    const calls = mockFetch(okRows());
    const r = await onRequest({ request: req('GET'), env: ENV });
    const body = await r.json();
    check('GET default -> 200', r.status === 200);
    check('GET default URL', calls[0].url === expectedUrl({ statuses: 'CLAIM_VERIFIED,AIMT_APPROVED', limit: 20 }), calls[0].url);
    check('GET sends service-role apikey + bearer', calls[0].init.headers.apikey === ENV.SUPABASE_SERVICE_ROLE_KEY
      && calls[0].init.headers.Authorization === `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`);
    check('GET uses fetch default method (GET, no body)', !calls[0].init.method && !calls[0].init.body);
    check('GET response envelope', JSON.stringify(body) === JSON.stringify({
      query: { q: '', topics: [], sourceId: null, minStatus: 'CLAIM_VERIFIED', limit: 20 }, count: 1, claims: ROWS
    }), JSON.stringify(body));
    check('GET content-type json', r.headers.get('Content-Type') === 'application/json');
  }

  // GET with every filter
  {
    const calls = mockFetch(okRows([]));
    const r = await onRequest({
      request: req('GET', { query: '?q=%20scalp%20burning%20&topics=scalp-health,%20dandruff&source_id=src-1&min_status=SOURCE_VERIFIED&limit=7' }),
      env: ENV
    });
    const body = await r.json();
    check('GET filtered URL', calls[0].url === expectedUrl({
      statuses: 'SOURCE_VERIFIED,CLAIM_VERIFIED,AIMT_APPROVED', limit: 7, sourceId: 'src-1',
      topics: 'ov.{scalp-health,dandruff}', q: 'scalp burning'
    }), calls[0].url);
    check('GET filtered envelope echoes raw params', JSON.stringify(body.query) === JSON.stringify({
      q: ' scalp burning ', topics: ['scalp-health', 'dandruff'], sourceId: 'src-1', minStatus: 'SOURCE_VERIFIED', limit: 7
    }) && body.count === 0, JSON.stringify(body));
  }

  // Limit clamping (GET and POST)
  {
    const calls = mockFetch(okRows([]));
    await onRequest({ request: req('GET', { query: '?limit=500' }), env: ENV });
    await onRequest({ request: req('GET', { query: '?limit=0' }), env: ENV });
    await onRequest({ request: req('GET', { query: '?limit=abc' }), env: ENV });
    await onRequest({ request: req('POST', { body: { limit: -5 } }), env: ENV });
    await onRequest({ request: req('POST', { body: { limit: 3.9 } }), env: ENV });
    await onRequest({ request: req('POST', { body: { limit: '9' } }), env: ENV });
    const limits = calls.map((c) => new URL(c.url).searchParams.get('limit'));
    check('limit clamping unchanged', JSON.stringify(limits) === JSON.stringify(['100', '20', '20', '1', '3', '20']), limits);
  }

  // POST with filters, DISCOVERED min_status, topic sanitization
  {
    const calls = mockFetch(okRows());
    const r = await onRequest({
      request: req('POST', { body: { q: 'trichodynia', topics: ['scalp-health', 'bad{"x",y}'], source_id: 's9', min_status: 'DISCOVERED', limit: 5 } }),
      env: ENV
    });
    const body = await r.json();
    check('POST filtered URL', calls[0].url === expectedUrl({
      statuses: 'DISCOVERED,SOURCE_VERIFIED,CLAIM_VERIFIED,AIMT_APPROVED', limit: 5, sourceId: 's9',
      topics: 'ov.{scalp-health,badxy}', q: 'trichodynia'
    }), calls[0].url);
    check('POST envelope', JSON.stringify(body.query) === JSON.stringify({
      q: 'trichodynia', topics: ['scalp-health', 'bad{"x",y}'], sourceId: 's9', minStatus: 'DISCOVERED', limit: 5
    }) && body.count === 1, JSON.stringify(body.query));
  }

  // POST malformed JSON / wrong types fall back to defaults
  {
    const calls = mockFetch(okRows([]));
    const r = await onRequest({ request: req('POST', { body: '{not json' }), env: ENV });
    check('POST malformed json -> defaults', r.status === 200 && calls[0].url === expectedUrl({ statuses: 'CLAIM_VERIFIED,AIMT_APPROVED', limit: 20 }), calls[0].url);
    const r2 = await onRequest({ request: req('POST', { body: { q: 5, topics: 'x', source_id: 1, min_status: 3 } }), env: ENV });
    check('POST wrong types -> defaults', r2.status === 200 && calls[1].url === expectedUrl({ statuses: 'CLAIM_VERIFIED,AIMT_APPROVED', limit: 20 }), calls[1].url);
    const r3 = await onRequest({ request: req('GET', { query: '?q=%20%20' }), env: ENV });
    check('whitespace q -> no search_vector filter', r3.status === 200 && !new URL(calls[2].url).searchParams.has('search_vector'));
  }

  // AIMT_APPROVED min_status
  {
    const calls = mockFetch(okRows([]));
    await onRequest({ request: req('GET', { query: '?min_status=AIMT_APPROVED' }), env: ENV });
    check('AIMT_APPROVED only', new URL(calls[0].url).searchParams.get('verification_status') === 'in.(AIMT_APPROVED)');
  }

  // Upstream failure -> 502 with truncated detail
  {
    mockFetch(() => new Response('E'.repeat(900), { status: 500 }));
    const r = await onRequest({ request: req('GET'), env: ENV });
    const body = await r.json();
    check('upstream failure -> 502', r.status === 502);
    check('upstream failure body', body.error === 'query_failed' && body.detail === 'E'.repeat(500) && Object.keys(body).length === 2);
  }

  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? '[PASS]' : '[FAIL]'} ${r.name}${r.ok ? '' : ` -- ${JSON.stringify(r.detail)}`}`);
  console.log(`\nTotal: ${results.length}, Passed: ${results.length - failed.length}, Failed: ${failed.length}`);
  if (failed.length) process.exit(1);
}

run().catch((e) => { console.error(e); process.exit(1); });
