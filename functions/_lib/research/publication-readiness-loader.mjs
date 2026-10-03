/* ═══════════════════════════════════════════════════════════════
   AIMT Publication Editor v1 — read-only evidence loader
   ---------------------------------------------------------------
   SHADOW MODE. Every function in this file is SELECT-only: it reads
   research_claims/research_sources and returns plain arrays. Nothing
   here ever issues an INSERT/UPDATE/DELETE/UPSERT, and nothing here
   is reachable from a public route -- it is imported by
   scripts/research-publication-editor-shadow.mjs (a local CLI) only.

   Two data sources, same output shape ({ claims, sources }):
     - fetchTopicEvidenceLive()   -- live Supabase via PostgREST GET,
       same service-role-over-fetch pattern as
       functions/api/research-query.js. Requires SUPABASE_URL +
       SUPABASE_SERVICE_ROLE_KEY.
     - loadExportFromDisk()       -- the local validated export under
       research-import/unpacked/ (claims.jsonl / sources.jsonl), used
       when live access isn't available/authorized for a given run.

   selectTopicEvidenceFromRows() is the shared, pure filtering step
   that turns either source's full claim/source arrays into the
   per-concept candidate set publication-readiness.mjs consumes.
   ═══════════════════════════════════════════════════════════════ */

import { readFileSync, existsSync } from 'node:fs';
import { PUBLICATION_CONCEPTS } from '../education-ops/education-publication-registry.mjs';

/* ── STEP 7: pilot topic/publication concepts ───────────────────────────
   HISTORICAL / BACKWARDS-COMPATIBLE EXPORT. PILOT_TOPIC_CONCEPTS was the
   original single-cluster (Hair Loss & Shedding) pilot registry. It is
   NO LONGER the operational ceiling on what Education Operations may
   publish: the authoritative, multi-cluster registry is
   functions/_lib/education-ops/education-publication-registry.mjs
   (PUBLICATION_CONCEPTS). This export is now a filtered projection of
   that registry -- the Hair Loss & Shedding cluster's concepts, with
   exactly the original fields and order -- so the two can never drift
   apart. The original mapping rationales live, unchanged, in the
   registry. Kept for older scripts/tests that still import it. */
export const PILOT_TOPIC_CONCEPTS = Object.freeze(
  PUBLICATION_CONCEPTS
    .filter((c) => c.cluster === 'hair-loss-shedding')
    .map((c) => Object.freeze({
      topic_slug: c.topic_slug,
      seo_page_concept: c.seo_page_concept,
      controlled_topics: c.controlled_topics,
      mapping_type: c.mapping_type,
      ...(c.mapping_rationale ? { mapping_rationale: c.mapping_rationale } : {}),
    }))
);

/* claim_text and page_or_section_locator are included for Publication
   Editor v2 (functions/_lib/research/publication-synthesis-evidence.mjs's
   buildSynthesisEvidenceBundle()), which needs the actual verified claim
   wording to synthesize from -- v1's own assessTopicReadiness() never
   reads either field, so their presence here is a pure widening of what
   gets fetched, not a v1 behavior change (v1's 65-test suite exercises
   the engine directly against synthetic fixtures and is unaffected).
   Found via a live v2 pilot run: the model correctly, conservatively
   reported it could not verify claim wording when claim_text came back
   null for every claim in the bundle -- a real live-fetch gap, not a v1
   defect, since v1 never needed this field. */
const CLAIM_SELECT_FIELDS = [
  'claim_id', 'source_id', 'claim_type', 'claim_text', 'direction', 'topics', 'population_or_scope',
  'page_or_section_locator', 'verification_status', 'use_status', 'verification_review_status', 'claim_origin'
];
const SOURCE_SELECT_FIELDS = [
  'source_id', 'title', 'authors', 'year', 'date_published', 'doi', 'url', 'pmid', 'pmcid',
  'evidence_type', 'source_role', 'verification_status', 'use_status'
];

/** Pure filter: given the FULL claims/sources arrays (from either data
    source below), return only what a concept's controlled_topics need.
    No verification_status/use_status filtering here -- that candidacy
    decision belongs to publication-readiness.mjs, not the loader, so a
    caller inspecting the returned arrays sees the same raw material the
    engine will judge, not a pre-filtered subset. */
export function selectTopicEvidenceFromRows(controlledTopics, { claims, sources }) {
  const topicSet = new Set(controlledTopics);
  const matchingClaims = claims.filter((c) => Array.isArray(c.topics) && c.topics.some((t) => topicSet.has(t)));
  const neededSourceIds = new Set(matchingClaims.map((c) => c.source_id));
  const matchingSources = sources.filter((s) => neededSourceIds.has(s.source_id));
  return { claims: matchingClaims, sources: matchingSources };
}

function readJsonl(filePath) {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

/** Read-only: loads the local validated export (research-import/unpacked/
    aimt-research-library-export-2026-09-20/data/{claims,sources}.jsonl or
    an equivalent later export dir). Used as the read-only fallback when
    live Supabase access isn't available/authorized for a given run. */
export function loadExportFromDisk(exportDir) {
  const claims = readJsonl(`${exportDir}/data/claims.jsonl`);
  const sources = readJsonl(`${exportDir}/data/sources.jsonl`);
  return { claims, sources };
}

export const EVIDENCE_PAGE_SIZE = 1000;
export const EVIDENCE_MAX_ROWS = 20000;
export const SOURCE_ID_CHUNK_SIZE = 100;

/** Read-only: live Supabase fetch over PostgREST, mirroring the exact
    service-role-over-fetch pattern functions/api/research-query.js
    already uses (apikey + Authorization: Bearer <service role key>,
    GET only -- never POST/PATCH/DELETE to Supabase's REST endpoint). */
export async function fetchTopicEvidenceLive(env, controlledTopics) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('fetchTopicEvidenceLive: missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  }
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
  };
  const topicsFilter = `ov.{${controlledTopics.map((t) => t.replace(/[{}",]/g, '')).join(',')}}`;

  // MULTI-CLUSTER CORRECTION: Education Operations now fetches evidence
  // for every registered concept's controlled topics in one run, which
  // can exceed a single page of rows. Claims are read in stable
  // claim_id order, one page at a time, until a short page -- never
  // silently truncated at a fixed limit (a truncated pool would make
  // candidate claim sets flicker between runs). Still GET-only.
  const claims = [];
  for (let offset = 0; ; offset += EVIDENCE_PAGE_SIZE) {
    if (offset >= EVIDENCE_MAX_ROWS) {
      throw new Error(`fetchTopicEvidenceLive: research_claims exceeded ${EVIDENCE_MAX_ROWS} rows -- refusing to continue on a possibly truncated evidence pool.`);
    }
    const claimsQs = new URLSearchParams();
    claimsQs.set('select', CLAIM_SELECT_FIELDS.join(','));
    claimsQs.set('topics', topicsFilter);
    claimsQs.set('order', 'claim_id.asc');
    claimsQs.set('limit', String(EVIDENCE_PAGE_SIZE));
    claimsQs.set('offset', String(offset));

    const claimsRes = await fetch(`${env.SUPABASE_URL}/rest/v1/research_claims?${claimsQs.toString()}`, {
      method: 'GET',
      headers
    });
    if (!claimsRes.ok) {
      throw new Error(`fetchTopicEvidenceLive: research_claims fetch failed (${claimsRes.status}): ${(await claimsRes.text().catch(() => '')).slice(0, 500)}`);
    }
    const page = await claimsRes.json();
    claims.push(...page);
    if (page.length < EVIDENCE_PAGE_SIZE) break;
  }

  const sourceIds = [...new Set(claims.map((c) => c.source_id))];
  if (sourceIds.length === 0) return { claims, sources: [] };

  // Source ids are requested in bounded chunks so the in.(...) filter
  // never produces an oversized request URL.
  const sources = [];
  for (let i = 0; i < sourceIds.length; i += SOURCE_ID_CHUNK_SIZE) {
    const chunk = sourceIds.slice(i, i + SOURCE_ID_CHUNK_SIZE);
    const sourcesQs = new URLSearchParams();
    sourcesQs.set('select', SOURCE_SELECT_FIELDS.join(','));
    sourcesQs.set('source_id', `in.(${chunk.map((id) => `"${String(id).replace(/"/g, '\\"')}"`).join(',')})`);
    sourcesQs.set('limit', String(SOURCE_ID_CHUNK_SIZE));

    const sourcesRes = await fetch(`${env.SUPABASE_URL}/rest/v1/research_sources?${sourcesQs.toString()}`, {
      method: 'GET',
      headers
    });
    if (!sourcesRes.ok) {
      throw new Error(`fetchTopicEvidenceLive: research_sources fetch failed (${sourcesRes.status}): ${(await sourcesRes.text().catch(() => '')).slice(0, 500)}`);
    }
    sources.push(...await sourcesRes.json());
  }

  return { claims, sources };
}
