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

/* ── STEP 7: pilot topic/publication concepts ───────────────────────────
   A "topic_slug" here is a PUBLICATION concept (what an SEO page would be
   about), which is not always one research_topics.topic value. Where the
   originating request's pilot list names a concept that is not literally
   in CONTROLLED_TOPICS (functions/_lib/research/schema.mjs), the mapping
   below constructs it conservatively from the controlled topics it is
   actually built from, and says so in mapping_rationale -- never invented
   silently. This registry is intentionally reusable: a future page
   generator or SEO priority loop can import PILOT_TOPIC_CONCEPTS (or its
   own equivalent list built the same way) instead of hardcoding topic
   strings again. */
export const PILOT_TOPIC_CONCEPTS = Object.freeze([
  {
    topic_slug: 'hair-loss',
    seo_page_concept: 'Hair Loss: A Practitioner Education Overview',
    controlled_topics: ['androgenetic-alopecia', 'telogen-effluvium', 'alopecia-areata'],
    mapping_type: 'constructed_multi_topic_umbrella',
    mapping_rationale: '"hair-loss" is not itself a value in CONTROLLED_TOPICS. Constructed as the union '
      + 'of the three controlled topics that are literally named hair-loss conditions '
      + '(androgenetic-alopecia, telogen-effluvium, alopecia-areata). hair-cycle/hair-biology '
      + '(general physiology, LOWER risk) are deliberately NOT folded in here -- they are their own '
      + 'concept (#6, hair-cycle) below -- so this umbrella is not diluted toward a lower risk tier '
      + "than its condition-specific content actually warrants."
  },
  {
    topic_slug: 'shedding-vs-hair-loss',
    seo_page_concept: 'Shedding vs. Hair Loss: A Practitioner Differential Framing',
    controlled_topics: ['telogen-effluvium', 'hair-cycle'],
    mapping_type: 'constructed_differential_framing',
    mapping_rationale: '"shedding-vs-hair-loss" is not a literal CONTROLLED_TOPICS value. Constructed '
      + 'conservatively from telogen-effluvium (the shedding-pattern condition) plus hair-cycle (the '
      + 'normal-shedding physiological baseline the differential depends on) -- a "shedding vs. hair '
      + 'loss" explainer is inherently a look-alike/differential-framing concept per the originating '
      + "request's own MODERATE-risk examples. androgenetic-alopecia is intentionally NOT included, "
      + 'even though it is the other side of many real differentials in practice, so this concept\'s '
      + 'candidate evidence set stays exactly what a "shedding vs. hair loss" page is built from; a page '
      + 'that also wants to rule in/out androgenetic-alopecia should compose with concept #3 rather than '
      + 'this concept silently absorbing it.'
  },
  {
    topic_slug: 'androgenetic-alopecia',
    seo_page_concept: 'Androgenetic Alopecia: A Practitioner Education Overview',
    controlled_topics: ['androgenetic-alopecia'],
    mapping_type: 'direct'
  },
  {
    topic_slug: 'telogen-effluvium',
    seo_page_concept: 'Telogen Effluvium: A Practitioner Education Overview',
    controlled_topics: ['telogen-effluvium'],
    mapping_type: 'direct'
  },
  {
    topic_slug: 'alopecia-areata',
    seo_page_concept: 'Alopecia Areata: A Practitioner Education Overview',
    controlled_topics: ['alopecia-areata'],
    mapping_type: 'direct'
  },
  {
    topic_slug: 'hair-cycle',
    seo_page_concept: 'The Hair Growth Cycle: A Practitioner Education Overview',
    controlled_topics: ['hair-cycle'],
    mapping_type: 'direct'
  }
]);

const CLAIM_SELECT_FIELDS = [
  'claim_id', 'source_id', 'claim_type', 'direction', 'topics', 'population_or_scope',
  'verification_status', 'use_status', 'verification_review_status', 'claim_origin'
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

  const claimsQs = new URLSearchParams();
  claimsQs.set('select', CLAIM_SELECT_FIELDS.join(','));
  claimsQs.set('topics', topicsFilter);
  claimsQs.set('limit', '2000');

  const claimsRes = await fetch(`${env.SUPABASE_URL}/rest/v1/research_claims?${claimsQs.toString()}`, {
    method: 'GET',
    headers
  });
  if (!claimsRes.ok) {
    throw new Error(`fetchTopicEvidenceLive: research_claims fetch failed (${claimsRes.status}): ${(await claimsRes.text().catch(() => '')).slice(0, 500)}`);
  }
  const claims = await claimsRes.json();

  const sourceIds = [...new Set(claims.map((c) => c.source_id))];
  if (sourceIds.length === 0) return { claims, sources: [] };

  const sourcesQs = new URLSearchParams();
  sourcesQs.set('select', SOURCE_SELECT_FIELDS.join(','));
  sourcesQs.set('source_id', `in.(${sourceIds.map((id) => `"${String(id).replace(/"/g, '\\"')}"`).join(',')})`);
  sourcesQs.set('limit', '2000');

  const sourcesRes = await fetch(`${env.SUPABASE_URL}/rest/v1/research_sources?${sourcesQs.toString()}`, {
    method: 'GET',
    headers
  });
  if (!sourcesRes.ok) {
    throw new Error(`fetchTopicEvidenceLive: research_sources fetch failed (${sourcesRes.status}): ${(await sourcesRes.text().catch(() => '')).slice(0, 500)}`);
  }
  const sources = await sourcesRes.json();

  return { claims, sources };
}
