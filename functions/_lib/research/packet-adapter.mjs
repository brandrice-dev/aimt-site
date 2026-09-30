/* ═══════════════════════════════════════════════════════════════
   Research Library — research-feed packet adapter (pure)
   ---------------------------------------------------------------
   The research worker deposits finished investigations as "research
   packets" (brandrice-dev/aimt-research-feed, inbox/*.json, validated by
   that repo's schema/research-packet.schema.json). The canonical
   ingestion pipeline (ingest-request.mjs#processIngestionBatch ->
   importer.mjs#runImport) accepts a different shape: export-style
   sources[] / claims[] records where every claim has exactly ONE
   source_id FK. Nothing translated one into the other, so every packet
   the worker ever produced sat in inbox/ and never reached Supabase.

   This module is that translation, and ONLY that translation. It makes
   no trust decision of its own and performs no I/O:
     - verification_status is copied verbatim from the packet. The packet
       schema only permits DISCOVERED | CLAIM_VERIFIED; anything else
       (including AIMT_APPROVED) is passed through untouched so the
       canonical pipeline QUARANTINES it -- this adapter never "fixes" or
       launders a status.
     - Nothing here sets aimt_reviewed_by / public_eligible / published
       (mapSourceRow/mapClaimRow never write them anyway).
     - Packet claims are cross-source syntheses, so they are recorded as
       claim_text_fidelity / claim_origin = 'library_summary', with the
       FIRST supporting source as the FK and every supporting /
       contradicting source id, confidence, category, notes and related
       contradictions preserved in the claim's extras (via the schema's
       own "undocumented keys -> extras" rule).
     - A packet source whose DOI already exists in the library is NOT
       re-sent (an existing curated source is never overwritten); the
       packet's claims are linked to the existing source_id instead.
   ═══════════════════════════════════════════════════════════════ */

import { CONTROLLED_TOPICS } from './schema.mjs';

export const FEED_SOURCE_SYSTEM = 'aimt-research-feed';
const ID_PREFIX = 'rf-';

/* ── Packet structural validation (mirror of research-packet.schema.json) ── */

const PACKET_REQUIRED = ['batch_id', 'researched_at', 'research_topic', 'research_reason', 'categories', 'sources',
  'claims', 'verification', 'contradictions', 'evidence_strength', 'gaps_remaining', 'suggested_follow_up'];
const SOURCE_TYPES = ['peer_reviewed_journal', 'clinical_study', 'systematic_review', 'textbook', 'government_health_agency',
  'industry_publication', 'practitioner_report', 'conference_proceedings', 'news_media', 'other'];
const EVIDENCE_STRENGTHS = ['strong', 'moderate', 'weak', 'insufficient', 'mixed'];
const PACKET_CLAIM_STATUSES = ['DISCOVERED', 'CLAIM_VERIFIED'];
const CONFIDENCES = ['low', 'moderate', 'high'];
const FORBIDDEN_STATUS_STRING = 'AIMT_APPROVED';

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isArr = Array.isArray;

/**
 * Structural validation of a whole packet. A packet that fails is not
 * ingested at all (it is reported and left in the inbox untouched);
 * per-record problems inside a VALID packet are left to the canonical
 * pipeline, which quarantines them.
 * @returns {{ok: boolean, errors: string[], warnings: string[]}}
 */
export function validatePacket(packet) {
  const errors = [];
  const warnings = [];
  if (!packet || typeof packet !== 'object' || isArr(packet)) return { ok: false, errors: ['packet is not a JSON object'], warnings };
  for (const k of PACKET_REQUIRED) if (!(k in packet)) errors.push(`missing required field: ${k}`);
  if ('batch_id' in packet && !isStr(packet.batch_id)) errors.push('batch_id: non-empty string required');
  if ('researched_at' in packet && Number.isNaN(Date.parse(packet.researched_at))) errors.push('researched_at: not a date-time');
  if ('evidence_strength' in packet && !EVIDENCE_STRENGTHS.includes(packet.evidence_strength)) errors.push('evidence_strength: invalid');
  if ('categories' in packet && (!isArr(packet.categories) || !packet.categories.length)) errors.push('categories: non-empty array required');
  const sourceIds = new Set();
  if (!isArr(packet.sources) || !packet.sources.length) errors.push('sources: non-empty array required');
  else packet.sources.forEach((s, i) => {
    if (!s || !isStr(s.source_id)) errors.push(`sources[${i}].source_id: required`);
    else if (sourceIds.has(s.source_id)) errors.push(`sources[${i}].source_id: duplicate ${s.source_id}`);
    else sourceIds.add(s.source_id);
    if (!s || !isStr(s.title)) errors.push(`sources[${i}].title: required`);
    if (!s || !SOURCE_TYPES.includes(s.source_type)) errors.push(`sources[${i}].source_type: invalid`);
  });
  const claimIds = new Set();
  if (!isArr(packet.claims) || !packet.claims.length) errors.push('claims: non-empty array required');
  else packet.claims.forEach((c, i) => {
    if (!c || !isStr(c.claim_id)) errors.push(`claims[${i}].claim_id: required`);
    else if (claimIds.has(c.claim_id)) errors.push(`claims[${i}].claim_id: duplicate ${c.claim_id}`);
    else claimIds.add(c.claim_id);
    if (!c || !isStr(c.statement)) errors.push(`claims[${i}].statement: required`);
    if (!c || !isArr(c.source_ids_supporting) || !c.source_ids_supporting.length) errors.push(`claims[${i}].source_ids_supporting: non-empty array required`);
    else for (const sid of c.source_ids_supporting) if (!sourceIds.has(sid)) errors.push(`claims[${i}]: supporting source ${sid} not in packet`);
    if (c && isArr(c.source_ids_contradicting)) for (const sid of c.source_ids_contradicting) if (!sourceIds.has(sid)) errors.push(`claims[${i}]: contradicting source ${sid} not in packet`);
    // Status/confidence problems are RECORD-level: reported as warnings and
    // left for the canonical pipeline to quarantine, never silently fixed.
    if (c && !PACKET_CLAIM_STATUSES.includes(c.verification_status)) warnings.push(`claims[${i}].verification_status ${JSON.stringify(c && c.verification_status)} outside packet enum -> will be quarantined`);
    if (c && c.confidence !== undefined && !CONFIDENCES.includes(c.confidence)) warnings.push(`claims[${i}].confidence invalid`);
  });
  const v = packet.verification;
  if (!v || typeof v !== 'object' || typeof v.cross_checked !== 'boolean' || !Number.isInteger(v.independent_sources_count)) {
    errors.push('verification: {method, cross_checked:boolean, independent_sources_count:int} required');
  }
  if (JSON.stringify(packet).includes(FORBIDDEN_STATUS_STRING)) {
    warnings.push(`packet contains the forbidden institutional status string ${FORBIDDEN_STATUS_STRING}; any claim carrying it is quarantined by the canonical pipeline`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

/* ── Supersession ─────────────────────────────────────────────────── */

/**
 * A packet is superseded when a LATER packet in the same inbox explicitly
 * names its batch_id in research_reason or verification.notes (the
 * worker's documented way of recording a re-test, e.g. "prior packet
 * AIMT-RF-2026-09-21-SDYS retained unchanged"). Superseded packets are
 * never ingested, so a weaker earlier verification pass cannot land.
 * @returns {Map<string,string>} superseded batch_id -> superseding batch_id
 */
export function findSuperseded(packets) {
  const out = new Map();
  const ordered = packets.filter((p) => p && isStr(p.batch_id))
    .slice().sort((a, b) => Date.parse(a.researched_at) - Date.parse(b.researched_at));
  for (const later of ordered) {
    const text = `${later.research_reason || ''} ${(later.verification && later.verification.notes) || ''}`;
    for (const earlier of ordered) {
      if (earlier === later || Date.parse(earlier.researched_at) >= Date.parse(later.researched_at)) continue;
      if (text.includes(earlier.batch_id)) out.set(earlier.batch_id, later.batch_id);
    }
  }
  return out;
}

/* ── Topic assignment (controlled vocabulary only) ─────────────────── */

const TOPIC_RULES = [
  [/dysesth|trichodyni|burning scalp|scalp (pain|burning|sensation)|sensitive scalp|scalp sensitivity|scalp discomfort/i, ['scalp-health', 'adjacent-dermatology']],
  [/trichodyni/i, ['trichology']],
  [/contact dermatitis|contact allerg|allergic contact|irritant|irritation|sensiti[sz]|patch test|allergen|hair dye|phenylenediamine|\bPPD\b|fragrance|preservative/i, ['cosmetic-ingredients', 'adjacent-dermatology']],
  [/hairdresser|hairdressing|salon|stylist|cosmetolog|practitioner|occupational/i, ['practitioner-safety']],
  [/psoria/i, ['psoriasis-scalp']],
  [/traction/i, ['trichology', 'adjacent-dermatology']],
  [/telogen effluvium|\bTE\b|shedding|postpartum|post-partum/i, ['telogen-effluvium']],
  [/hair cycle|anagen|catagen|telogen/i, ['hair-cycle']],
  [/\biron\b|ferritin|biotin|vitamin|\bzinc\b|supplement|nutri|deficien/i, ['actives-other']],
  [/androgenetic|pattern hair loss|\bAGA\b|FPHL/i, ['androgenetic-alopecia']],
  [/alopecia areata/i, ['alopecia-areata']],
  [/seborrh/i, ['seborrheic-dermatitis']],
  [/dandruff/i, ['dandruff']],
  [/massag/i, ['massage-circulation']],
  [/minoxidil/i, ['actives-minoxidil']],
  [/contraindicat/i, ['contraindications']],
  [/essential oil|tea tree|botanical|peppermint|rosemary|lavender/i, ['essential-oils-botanicals']],
  [/surfactant|sulfate|sulphate|shampoo/i, ['surfactants']],
  [/conditioner|silicone|dimethicone/i, ['conditioning-agents']],
  [/folliculitis/i, ['folliculitis']],
  [/disinfect|hygiene|infection control/i, ['infection-control']],
  [/hair loss|alopecia|trichology|hair shaft|follicle/i, ['trichology']],
];

export function topicsFor(...texts) {
  const text = texts.filter(Boolean).join(' ');
  const out = new Set();
  for (const [re, topics] of TOPIC_RULES) if (re.test(text)) for (const t of topics) out.add(t);
  return [...out].filter((t) => CONTROLLED_TOPICS.includes(t));
}

/* ── Field mapping ────────────────────────────────────────────────── */

export function feedId(kind, rawId) {
  const slug = String(rawId).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${ID_PREFIX}${slug.startsWith(kind) ? slug : `${kind}-${slug}`}`;
}

function evidenceTypeFor(src) {
  const notes = `${src.credibility_notes || ''} ${src.title || ''}`;
  switch (src.source_type) {
    case 'systematic_review': return /meta-?analys/i.test(notes) ? 'meta_analysis' : 'systematic_review';
    case 'clinical_study': return /\brandomi[sz]ed|\bRCT\b/i.test(notes) ? 'rct' : 'observational';
    case 'textbook': return 'textbook_chapter';
    case 'government_health_agency': return 'clinical_guideline';
    case 'industry_publication': return 'technical_report';
    case 'peer_reviewed_journal': return /\breview\b/i.test(notes) ? 'narrative_review' : 'other';
    default: return 'other';
  }
}

function sourceRoleFor(src) {
  switch (src.source_type) {
    case 'clinical_study': return 'primary_research';
    case 'systematic_review': return 'synthesis';
    case 'government_health_agency': return 'guideline';
    case 'peer_reviewed_journal': return /\breview\b/i.test(`${src.credibility_notes || ''} ${src.title || ''}`) ? 'synthesis' : 'other';
    default: return 'other';
  }
}

function yearOf(dateStr) {
  const m = /^(\d{4})/.exec(String(dateStr || ''));
  return m ? Number(m[1]) : null;
}

function pmidOf(url) {
  const m = /pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/.exec(String(url || ''));
  return m ? m[1] : null;
}

function pmcidOf(url) {
  const m = /(PMC\d+)/.exec(String(url || ''));
  return m ? m[1] : null;
}

/**
 * Translates one VALID packet into a canonical ingestion batch body for
 * processIngestionBatch(). Pure.
 *
 * @param {object} packet
 * @param {object} [opts]
 * @param {Map<string,string>} [opts.existingSourceIdByDoi]  lowercased DOI -> existing research_sources.source_id
 * @param {string} [opts.packetFile]                          provenance (inbox path)
 * @returns {{ batch: object, stats: object }}
 */
export function packetToBatch(packet, { existingSourceIdByDoi = new Map(), packetFile = null } = {}) {
  const researchedOn = String(packet.researched_at).slice(0, 10);
  const packetTopics = topicsFor(packet.research_topic);
  const packetSourceById = new Map(packet.sources.map((s) => [s.source_id, s]));
  const crossChecked = packet.verification && packet.verification.cross_checked === true;

  // Resolve every packet source to a library source_id (existing by DOI, else new).
  const libraryIdOf = new Map();
  const reusedSources = [];
  for (const s of packet.sources) {
    const existing = s.doi ? existingSourceIdByDoi.get(String(s.doi).toLowerCase()) : null;
    if (existing) { libraryIdOf.set(s.source_id, existing); reusedSources.push({ packet_source_id: s.source_id, source_id: existing }); }
    else libraryIdOf.set(s.source_id, feedId('src', s.source_id));
  }

  const contradictionsByClaim = new Map();
  for (const k of packet.contradictions || []) {
    for (const cid of k.related_claim_ids || []) {
      if (!contradictionsByClaim.has(cid)) contradictionsByClaim.set(cid, []);
      contradictionsByClaim.get(cid).push(k.description);
    }
  }

  const claims = packet.claims.map((c) => {
    const topics = [...new Set([...packetTopics, ...topicsFor(c.statement)])];
    const notes = c.notes || null;
    const contradicting = c.source_ids_contradicting || [];
    return {
      claim_id: feedId('claim', c.claim_id),
      source_id: libraryIdOf.get(c.source_ids_supporting[0]),
      claim_type: 'finding',
      claim_text: c.statement,
      claim_text_fidelity: 'library_summary',
      claim_origin: 'library_summary',
      topics: topics.length ? topics : ['trichology'],
      // Contested claims (named contradicting sources) are marked unclear;
      // otherwise direction is left unset rather than guessed.
      direction: contradicting.length ? 'unclear' : null,
      extraction_confidence: c.confidence === 'moderate' ? 'medium' : (c.confidence || null),
      use_status: 'provisional',
      use_status_reason: `Ingested from research-feed packet ${packet.batch_id}; not yet human-reviewed.`,
      verification_status: c.verification_status,
      verified_on: c.verification_status === 'CLAIM_VERIFIED' ? researchedOn : null,
      verification_review_status: 'not_reviewed',
      body_markdown: [
        `## Claim\n${c.statement}`,
        notes ? `## Verification notes\n${notes}` : null,
        contradictionsByClaim.has(c.claim_id) ? `## Recorded contradictions\n${contradictionsByClaim.get(c.claim_id).map((d) => `- ${d}`).join('\n')}` : null,
      ].filter(Boolean).join('\n\n'),
      // Undocumented keys -> research_claims.extras (schema.mjs extrasOf).
      packet_batch_id: packet.batch_id,
      packet_file: packetFile,
      packet_claim_id: c.claim_id,
      packet_category: c.category || null,
      packet_confidence: c.confidence || null,
      supporting_source_ids: c.source_ids_supporting.map((sid) => libraryIdOf.get(sid)),
      contradicting_source_ids: contradicting.map((sid) => libraryIdOf.get(sid)),
      packet_evidence_strength: packet.evidence_strength,
    };
  });

  // Sources: only NEW ones are sent; topics = union of citing claims' topics.
  const topicsBySource = new Map();
  const verifiedCiting = new Set();
  packet.claims.forEach((c, i) => {
    for (const sid of [...c.source_ids_supporting, ...(c.source_ids_contradicting || [])]) {
      if (!topicsBySource.has(sid)) topicsBySource.set(sid, new Set());
      for (const t of claims[i].topics) topicsBySource.get(sid).add(t);
    }
    if (c.verification_status === 'CLAIM_VERIFIED') for (const sid of c.source_ids_supporting) verifiedCiting.add(sid);
  });
  const sources = packet.sources
    .filter((s) => !reusedSources.some((r) => r.packet_source_id === s.source_id))
    .map((s) => ({
      source_id: libraryIdOf.get(s.source_id),
      title: s.title,
      authors: isArr(s.authors) ? s.authors : null,
      year: yearOf(s.publication_date),
      date_published: s.publication_date || null,
      source_venue: s.publication || null,
      doi: s.doi || null,
      url: s.url || null,
      pmid: pmidOf(s.url),
      pmcid: pmcidOf(s.url),
      evidence_type: evidenceTypeFor(s),
      source_role: sourceRoleFor(s),
      topics: [...(topicsBySource.get(s.source_id) || new Set(packetTopics))],
      verification_notes: s.credibility_notes || null,
      use_status: 'provisional',
      use_status_reason: `Ingested from research-feed packet ${packet.batch_id}.`,
      // Sources only climb the ladder to SOURCE_VERIFIED, and only when
      // the packet was cross-checked AND the source underpins a verified claim.
      verification_status: crossChecked && verifiedCiting.has(s.source_id) ? 'SOURCE_VERIFIED' : 'DISCOVERED',
      verification_review_status: 'not_reviewed',
      date_discovered: researchedOn,
      packet_batch_id: packet.batch_id,
      packet_source_id: s.source_id,
      packet_source_type: s.source_type,
    }));

  return {
    batch: {
      batch_id: packet.batch_id,
      source_system: FEED_SOURCE_SYSTEM,
      sources,
      claims,
    },
    stats: {
      sources_new: sources.length,
      sources_reused: reusedSources,
      claims: claims.length,
      claims_verified: claims.filter((c) => c.verification_status === 'CLAIM_VERIFIED').length,
      claims_discovered: claims.filter((c) => c.verification_status === 'DISCOVERED').length,
      topics: [...new Set(claims.flatMap((c) => c.topics))].sort(),
    },
  };
}
