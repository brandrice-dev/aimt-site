/* ═══════════════════════════════════════════════════════════════
   AIMT Research Library — shared schema / validation
   ---------------------------------------------------------------
   Single source of truth for the controlled vocabularies and field
   mapping used by BOTH:
     - scripts/research-library-import.mjs   (local CLI importer)
     - functions/api/research-ingest.js      (daily Grok ingestion)

   Field names and enums are copied from the Grok research-harvester
   export's own docs/SCHEMA.md + docs/TRUST_MODEL.md, not invented here.
   Zero npm dependencies (Web Crypto + plain JS only), matching the rest
   of functions/api/*.
   ═══════════════════════════════════════════════════════════════ */

export const CONTROLLED_TOPICS = [
  'scalp-health', 'scalp-microbiome', 'seborrheic-dermatitis', 'psoriasis-scalp',
  'dandruff', 'folliculitis', 'hair-biology', 'hair-cycle', 'androgenetic-alopecia',
  'alopecia-areata', 'telogen-effluvium', 'trichology', 'cosmetic-ingredients',
  'surfactants', 'conditioning-agents', 'actives-minoxidil', 'actives-other',
  'essential-oils-botanicals', 'treatment-modalities', 'massage-circulation',
  'practitioner-safety', 'infection-control', 'contraindications', 'adjacent-dermatology'
];

/* NOTE on off-vocabulary values below: cross-checked against the full live
   2026-09-20 export (219 sources / 1081 claims), not just docs/SCHEMA.md.
   A handful of fields carry values outside the documented enum -- real,
   meaningful data (not typos to bounce), most likely from vocabulary drift
   between the original Sept 2026 v1->v2 migration batch and later daily
   harvests. Per WORKFLOW.md ("Keep ALL claims regardless of
   verification_status / verification_review_status") the same fidelity
   bar applies to every other field: widen the accepted set rather than
   silently drop or reinterpret real records. Each addition below is
   commented with its observed frequency so a future audit can tell
   documented-schema values from live-export artifacts at a glance. */
export const SOURCE_ENUMS = {
  evidence_type: ['systematic_review', 'meta_analysis', 'rct', 'clinical_guideline', 'observational',
    'narrative_review', 'textbook_chapter', 'professional_org', 'technical_report', 'other'],
  source_role: ['primary_research', 'synthesis', 'guideline', 'regulator_safety', 'practice_guidance',
    'preclinical', 'regulatory_standard', 'other'],
  verification_depth: ['full_text', 'abstract', 'secondary', 'unchecked'],
  rights_access_status: ['open', 'paywalled', 'unknown', 'restricted'],
  use_status: ['active', 'provisional', 'superseded', 'excluded', 'needs_review'],
  migration_confidence: ['high', 'medium', 'low'],
  /* Sources only ever reach SOURCE_VERIFIED per the export's own schema
     (sources are not CLAIM_VERIFIED / AIMT_APPROVED). */
  verification_status: ['DISCOVERED', 'SOURCE_VERIFIED'],
  /* 'partial' observed once in the live export, outside SCHEMA.md's
     documented yes|no|unknown -- a real fourth state, kept verbatim. Bare
     YAML true/false (142 records; a YAML 1.1 bare yes/no ambiguity, not a
     distinct value) is normalized to 'yes'/'no' in mapSourceRow() below. */
  full_text_access_observed: ['yes', 'no', 'unknown', 'partial'],
  verification_review_status: ['not_reviewed', 'reviewed_supported', 'reviewed_unsupported',
    'reviewed_too_specific', 'reviewed_access_limited', 'reviewed_narrowed']
  /* discovery_lane_status is intentionally NOT enum-validated here -- 3
     live records carry an operational batch label
     ("verified_afternoon_batchA_2026-09-17") instead of one of SCHEMA.md's
     3 states, alongside the 3 documented values. Treated as free text,
     same posture as verification_queue.status / priority_band. */
};

export const CLAIM_ENUMS = {
  /* 'method' (2 records) observed instead of 'method_note'. */
  claim_type: ['finding', 'limitation', 'method_note', 'recommendation', 'safety_conclusion', 'other', 'method'],
  /* 'exact' (59) and 'abstract' (3) observed instead of/alongside the
     documented 3 values -- 'abstract' is extraction_basis's vocabulary
     leaking into this legacy-compat field in older migrated records. */
  claim_text_fidelity: ['verbatim_quote', 'close_paraphrase', 'library_summary', 'exact', 'abstract'],
  /* 'recommendation'/'limitation'/'safety' echo claim_type values, and
     'qualifies' is a claim<->claim relationship predicate (SCHEMA.md §3)
     -- all observed leaking into this field in a small number (<=3 each)
     of older records. */
  direction: ['supports_effect', 'no_effect', 'association', 'descriptive', 'precaution', 'unclear',
    'recommendation', 'limitation', 'safety', 'qualifies'],
  /* 'primary_text' (9) and 'library_summary' (4) are claim_origin's
     vocabulary, leaking into this field the other direction from the
     claim_origin note below -- same migration-era drift. */
  extraction_basis: ['full_text', 'abstract', 'secondary', 'legacy_entry', 'primary_text', 'library_summary'],
  extraction_confidence: ['high', 'medium', 'low'],
  use_status: ['active', 'provisional', 'superseded', 'excluded', 'needs_review'],
  /* 'full_text' (80 records, ~7% of all claims) observed instead of the
     documented primary_text|abstract|secondary|library_summary --
     extraction_basis's vocabulary leaking into claim_origin, almost
     certainly from the Sept 2026 v1->v2 migration batch (SCHEMA.md §7
     documents extraction_basis -> claim_origin as a migration mapping;
     this looks like an unmapped pass-through in a subset of rows). */
  claim_origin: ['primary_text', 'abstract', 'secondary', 'library_summary', 'full_text'],
  /* Full ladder including AIMT_APPROVED. The importer/ingestion path must
     NEVER write 'AIMT_APPROVED' -- see assertNeverAutoApproves() below. */
  verification_status: ['DISCOVERED', 'SOURCE_VERIFIED', 'CLAIM_VERIFIED', 'AIMT_APPROVED'],
  verification_review_status: ['not_reviewed', 'reviewed_supported', 'reviewed_unsupported',
    'reviewed_too_specific', 'reviewed_access_limited', 'reviewed_narrowed']
};

/* Keys documented in the export's MANIFEST.md for sources.jsonl / claims.jsonl.
   Anything outside this set is preserved verbatim in the `extras` jsonb
   column instead of being silently dropped. */
const DOCUMENTED_SOURCE_KEYS = new Set([
  'schema_version', 'record_type', 'source_id', 'title', 'authors', 'year', 'date_published',
  'source_venue', 'doi', 'url', 'pmid', 'evidence_type', 'source_role', 'topics',
  'verification_depth', 'verified_on', 'verification_notes', 'rights_access_status',
  'full_text_held', 'license_or_rights_notes', 'use_status', 'use_status_reason',
  'date_retrieved', 'last_reviewed_on', 'review_due_on', 'version_or_amendment',
  'freshness_notes', 'legacy_entry_file', 'migrated_on', 'migration_confidence',
  'migration_flags', 'verification_status', 'full_text_access_observed', 'reviewed_by',
  'verification_review_status', 'date_discovered', 'discovery_lane_status',
  'body_markdown', 'body_sections', 'source_file', 'pmcid', '_frontmatter_parse_mode'
]);

const DOCUMENTED_CLAIM_KEYS = new Set([
  'schema_version', 'record_type', 'claim_id', 'source_id', 'claim_type', 'claim_text',
  'claim_text_fidelity', 'topics', 'population_or_scope', 'direction', 'extraction_basis',
  'locator', 'extraction_confidence', 'use_status', 'use_status_reason', 'migrated_on',
  'migration_flags', 'claim_origin', 'verification_status', 'verified_against_primary_source',
  'page_or_section_locator', 'verified_on', 'reviewed_by', 'verification_review_status',
  'body_markdown', 'body_sections', 'claim_file', '_frontmatter_parse_mode'
]);

function extrasOf(record, documentedKeys) {
  const out = {};
  for (const [k, v] of Object.entries(record || {})) {
    if (!documentedKeys.has(k)) out[k] = v;
  }
  return out;
}

/* YAML 1.1 parses bare yes/no as booleans in some source records and as
   literal strings in others depending on how the frontmatter was written
   -- not a distinct value, just an artifact of the export's YAML parser.
   Normalize before validating/storing so the same intent (yes vs no)
   round-trips the same way regardless of which form the source file used. */
function normalizeYesNo(v) {
  if (v === true) return 'yes';
  if (v === false) return 'no';
  return v;
}

function checkEnum(errors, record, field, allowed, { normalize } = {}) {
  let v = record[field];
  if (normalize) v = normalize(v);
  if (v === null || v === undefined || v === '') return;
  if (!allowed.includes(v)) errors.push(`${field}: invalid value ${JSON.stringify(v)} (expected one of ${allowed.join('|')})`);
}

/** Validate a raw source record from sources.jsonl. Returns {errors: string[]}. */
export function validateSource(record) {
  const errors = [];
  if (!record || typeof record !== 'object') return { errors: ['not an object'] };
  if (!record.source_id) errors.push('source_id: required');
  if (record.record_type && record.record_type !== 'source') errors.push(`record_type: expected "source", got ${JSON.stringify(record.record_type)}`);
  for (const field of Object.keys(SOURCE_ENUMS)) {
    checkEnum(errors, record, field, SOURCE_ENUMS[field],
      field === 'full_text_access_observed' ? { normalize: normalizeYesNo } : {});
  }
  if (record.topics && !Array.isArray(record.topics)) errors.push('topics: expected array');
  return { errors };
}

/** Validate a raw claim record from claims.jsonl. Returns {errors: string[]}. */
export function validateClaim(record) {
  const errors = [];
  if (!record || typeof record !== 'object') return { errors: ['not an object'] };
  if (!record.claim_id) errors.push('claim_id: required');
  if (!record.source_id) errors.push('source_id: required (FK to sources)');
  if (!record.claim_text) errors.push('claim_text: required');
  if (record.record_type && record.record_type !== 'claim') errors.push(`record_type: expected "claim", got ${JSON.stringify(record.record_type)}`);
  for (const field of Object.keys(CLAIM_ENUMS)) checkEnum(errors, record, field, CLAIM_ENUMS[field]);
  if (record.topics && !Array.isArray(record.topics)) errors.push('topics: expected array');
  return { errors };
}

/* Same YAML 1.1 bare-yes/no ambiguity as normalizeYesNo() above, but this
   field (claims.verified_against_primary_source) maps straight to a
   Postgres boolean column rather than a string enum, so the fix is a
   direct bool passthrough instead of a string. Verified against the live
   2026-09-20 export: 608 raw `true` / 18 raw `false` (58% of all claims)
   alongside 392 'yes' / 63 'no' strings -- an earlier version of this
   function only matched the strings and silently discarded the 626
   boolean-typed values as null. Caught by the DB-constraint preflight
   (scripts/research-library-preflight.mjs), not by JS enum validation,
   since a null boolean doesn't violate any CHECK constraint -- it just
   quietly loses real data. */
function yesNoToBool(v) {
  if (v === true || v === 'yes') return true;
  if (v === false || v === 'no') return false;
  return null;
}

/* Postgres's `date` type input requires day precision (YYYY-MM-DD or a
   full timestamp) -- a reduced-precision value like "2025-03" is not
   something we can pass through without either risking an insert-time
   error or fabricating a day-of-month that isn't in the source data
   (SCHEMA.md: "never invent"). Found exactly once in the live export
   (sobral-oral-vs-topical-minoxidil-ma-2025.date_published) by the
   DB-constraint preflight. Rather than guess how Postgres's parser would
   handle it, values that don't match full day precision are left out of
   the typed date column and preserved verbatim in `extras` under
   `<field>_raw_unparsed` instead -- no information lost, nothing invented,
   nothing that can fail a `date` column's implicit input parsing. */
const FULL_DATE_RE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}:\d{2}.*)?$/;
function safeDateOrNull(v, fieldName, extrasOut) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'string' && FULL_DATE_RE.test(v)) return v;
  extrasOut[`${fieldName}_raw_unparsed`] = v;
  return null;
}

/** Map a validated raw source record -> DB row. Never includes AIMT-side gate columns. */
export function mapSourceRow(record, { grokExportBatch } = {}) {
  const extras = extrasOf(record, DOCUMENTED_SOURCE_KEYS);
  return {
    source_id: record.source_id,
    schema_version: record.schema_version ?? null,
    title: record.title ?? null,
    authors: record.authors ?? null,
    year: record.year ?? null,
    date_published: safeDateOrNull(record.date_published, 'date_published', extras),
    source_venue: record.source_venue ?? null,
    doi: record.doi ?? null,
    url: record.url ?? null,
    pmid: record.pmid ?? null,
    pmcid: record.pmcid ?? null,
    evidence_type: record.evidence_type ?? null,
    source_role: record.source_role ?? null,
    topics: record.topics ?? [],
    verification_depth: record.verification_depth ?? null,
    verified_on: safeDateOrNull(record.verified_on, 'verified_on', extras),
    verification_notes: record.verification_notes ?? null,
    rights_access_status: record.rights_access_status ?? null,
    full_text_held: !!record.full_text_held,
    license_or_rights_notes: record.license_or_rights_notes ?? null,
    use_status: record.use_status ?? null,
    use_status_reason: record.use_status_reason ?? null,
    date_retrieved: safeDateOrNull(record.date_retrieved, 'date_retrieved', extras),
    last_reviewed_on: safeDateOrNull(record.last_reviewed_on, 'last_reviewed_on', extras),
    review_due_on: safeDateOrNull(record.review_due_on, 'review_due_on', extras),
    version_or_amendment: record.version_or_amendment ?? null,
    freshness_notes: record.freshness_notes ?? null,
    legacy_entry_file: record.legacy_entry_file ?? null,
    migrated_on: safeDateOrNull(record.migrated_on, 'migrated_on', extras),
    migration_confidence: record.migration_confidence ?? null,
    migration_flags: record.migration_flags ?? [],
    verification_status: record.verification_status ?? null,
    full_text_access_observed: normalizeYesNo(record.full_text_access_observed) ?? null,
    reviewed_by: record.reviewed_by ?? null,
    verification_review_status: record.verification_review_status ?? null,
    date_discovered: safeDateOrNull(record.date_discovered, 'date_discovered', extras),
    discovery_lane_status: record.discovery_lane_status ?? null,
    body_markdown: record.body_markdown ?? null,
    body_sections: record.body_sections ?? {},
    source_file: record.source_file ?? null,
    extras,
    grok_export_batch: grokExportBatch ?? null,
    last_imported_at: new Date().toISOString()
  };
}

/** Map a validated raw claim record -> DB row. Never includes AIMT-side gate columns,
    and never writes verification_status = 'AIMT_APPROVED' (see assertNeverAutoApproves). */
export function mapClaimRow(record, { grokExportBatch } = {}) {
  const extras = extrasOf(record, DOCUMENTED_CLAIM_KEYS);
  return {
    claim_id: record.claim_id,
    source_id: record.source_id,
    schema_version: record.schema_version ?? null,
    claim_type: record.claim_type ?? null,
    claim_text: record.claim_text,
    claim_text_fidelity: record.claim_text_fidelity ?? null,
    topics: record.topics ?? [],
    population_or_scope: record.population_or_scope ?? null,
    direction: record.direction ?? null,
    extraction_basis: record.extraction_basis ?? null,
    locator: record.locator ?? null,
    extraction_confidence: record.extraction_confidence ?? null,
    use_status: record.use_status ?? null,
    use_status_reason: record.use_status_reason ?? null,
    migrated_on: safeDateOrNull(record.migrated_on, 'migrated_on', extras),
    migration_flags: record.migration_flags ?? [],
    claim_origin: record.claim_origin ?? null,
    verification_status: record.verification_status ?? null,
    verified_against_primary_source: yesNoToBool(record.verified_against_primary_source),
    page_or_section_locator: record.page_or_section_locator ?? null,
    verified_on: safeDateOrNull(record.verified_on, 'verified_on', extras),
    reviewed_by: record.reviewed_by ?? null,
    verification_review_status: record.verification_review_status ?? null,
    body_markdown: record.body_markdown ?? null,
    body_sections: record.body_sections ?? {},
    claim_file: record.claim_file ?? null,
    frontmatter_parse_mode: record._frontmatter_parse_mode ?? 'strict',
    extras,
    grok_export_batch: grokExportBatch ?? null,
    last_imported_at: new Date().toISOString()
  };
}

/** Hard safety gate: throws if anything ever tries to make the automated
    path write 'AIMT_APPROVED'. Call this on every outgoing claim row right
    before it is sent to Postgres, from both the CLI importer and the
    ingestion function. AIMT_APPROVED may only be set by a human, through a
    separate authenticated path (the future Owner's Console), never by a
    Grok sync. */
export function assertNeverAutoApproves(claimRow) {
  if (claimRow && claimRow.verification_status === 'AIMT_APPROVED') {
    throw new Error(
      `refusing to auto-write AIMT_APPROVED for claim_id=${claimRow.claim_id}. ` +
      `AIMT_APPROVED is human-only and must be set through the Owner's Console, never an import.`
    );
  }
}

export function isControlledTopic(topic) {
  return CONTROLLED_TOPICS.includes(topic);
}
