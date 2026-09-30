/* ═══════════════════════════════════════════════════════════════
   Cadence research shadow eval — local, read-only PostgREST stand-in
   ---------------------------------------------------------------
   Lets the evaluation harness (and tests) exercise the REAL shared
   query (functions/_lib/research/query.mjs) end-to-end without live
   Supabase access: pass `createLocalResearchFetch({claims, sources})` as
   `fetchImpl`. It parses the exact PostgREST URL the shared helper
   builds and applies the same filters over in-memory rows:

     verification_status=in.(...)   exact
     topics=ov.{...}                exact (array overlap)
     source_id=eq.x                 exact
     order=verified_on.desc.nullslast, limit=N   exact
     search_vector=wfts.<q>         APPROXIMATION of Postgres
       websearch_to_tsquery('english') over claim_text + body_markdown:
       "a or b or \"two words\"" -> OR of terms/phrases, matched on a
       simple suffix-stripping stemmer (not Snowball). Good enough to
       measure Cadence's selection logic; a --live run is the ground
       truth for FTS recall.

   GET only. Any other method throws -- this stand-in cannot write.
   ═══════════════════════════════════════════════════════════════ */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { stem, tokenize } from '../../functions/_lib/cadence/research-context.mjs';

export function loadResearchExport(exportDir) {
  const read = (f) => readFileSync(path.join(exportDir, 'data', f), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  return { claims: read('claims.jsonl'), sources: read('sources.jsonl') };
}

function parseWebsearch(q) {
  return String(q).split(/\s+or\s+/i).map((t) => t.replace(/"/g, '').trim()).filter(Boolean)
    .map((t) => tokenize(t).map(stem));
}

function textMatches(parsedTerms, claim) {
  const padded = ' ' + tokenize(`${claim.claim_text || ''} ${claim.body_markdown || ''}`).map(stem).join(' ') + ' ';
  return parsedTerms.some((stems) => stems.length && padded.includes(' ' + stems.join(' ') + ' '));
}

const SOURCE_FIELDS = ['source_id', 'title', 'authors', 'year', 'doi', 'url', 'source_venue', 'evidence_type', 'source_role', 'verification_status'];

export function createLocalResearchFetch({ claims, sources }) {
  const sourceById = new Map(sources.map((s) => [s.source_id, s]));
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    if (init.method && init.method !== 'GET') throw new Error('local research fetch is read-only');
    const u = new URL(url);
    if (!u.pathname.endsWith('/rest/v1/research_claims')) return new Response('not found', { status: 404 });
    const sp = u.searchParams;
    calls.push(sp.toString());
    let rows = claims.slice();
    const vs = sp.get('verification_status');
    if (vs) {
      const allowed = vs.replace(/^in\.\(|\)$/g, '').split(',');
      rows = rows.filter((c) => allowed.includes(c.verification_status));
    }
    const sid = sp.get('source_id');
    if (sid) rows = rows.filter((c) => c.source_id === sid.replace(/^eq\./, ''));
    const topics = sp.get('topics');
    if (topics) {
      const want = topics.replace(/^ov\.\{|\}$/g, '').split(',').filter(Boolean);
      rows = rows.filter((c) => (c.topics || []).some((t) => want.includes(t)));
    }
    const sv = sp.get('search_vector');
    if (sv) {
      const parsed = parseWebsearch(sv.replace(/^wfts\./, ''));
      rows = rows.filter((c) => textMatches(parsed, c));
    }
    rows.sort((a, b) => {
      if (!a.verified_on && !b.verified_on) return 0;
      if (!a.verified_on) return 1;
      if (!b.verified_on) return -1;
      return a.verified_on < b.verified_on ? 1 : a.verified_on > b.verified_on ? -1 : 0;
    });
    const limit = Number(sp.get('limit')) || rows.length;
    rows = rows.slice(0, limit);
    const out = rows.map((c) => {
      const s = sourceById.get(c.source_id);
      return {
        claim_id: c.claim_id, claim_text: c.claim_text, claim_type: c.claim_type ?? null, direction: c.direction ?? null,
        topics: c.topics || [], verification_status: c.verification_status,
        verification_review_status: c.verification_review_status ?? null, claim_origin: c.claim_origin ?? null,
        page_or_section_locator: c.page_or_section_locator ?? null, use_status: c.use_status ?? null,
        source: s ? Object.fromEntries(SOURCE_FIELDS.map((f) => [f, s[f] ?? null])) : null,
      };
    });
    return new Response(JSON.stringify(out), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  return { fetchImpl, calls };
}
