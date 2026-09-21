#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   AIMT Research Library — database-constraint preflight
   ---------------------------------------------------------------
   Checks the FULL export against every relevant PostgreSQL CHECK /
   NOT NULL / FK / unique constraint in
   supabase/migrations/20260920_create_research_library.sql -- not
   just the JS enum validation in functions/_lib/research/schema.mjs
   (which runs on the RAW record, before mapping/type-coercion, and
   is a different, looser check than what Postgres will actually
   enforce on the MAPPED row).

   This is intentionally a duplicate, independent re-statement of the
   migration's constraints, kept in sync by hand -- the point is to
   catch drift between the SQL and the JS mapping layer, so it should
   NOT import its constraint lists from schema.mjs's SOURCE_ENUMS/
   CLAIM_ENUMS (those feed validateSource/validateClaim, which is
   exactly the layer this preflight exists to cross-check).

   No live Supabase project is touched -- this only reads the local
   export and the mapped rows the importer would send. If it finds
   anything that would fail at insert time, it prints the exact
   record id(s) and constraint and exits nonzero; it does NOT
   silently change any record's meaning to make it pass.

   Usage:
     node scripts/research-library-preflight.mjs --dir research-import/unpacked/aimt-research-library-export-2026-09-20
   ═══════════════════════════════════════════════════════════════ */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTROLLED_TOPICS, mapSourceRow, mapClaimRow, isControlledTopic } from '../functions/_lib/research/schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function readJsonl(filePath) {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

/* ── Exact re-statement of the migration's CHECK-constrained enum lists
   (supabase/migrations/20260920_create_research_library.sql). Keep these
   in sync with the SQL by hand when either changes -- do not import from
   schema.mjs (see header comment). ── */
const SQL = {
  research_sources_evidence_type_check: ['systematic_review', 'meta_analysis', 'rct', 'clinical_guideline', 'observational',
    'narrative_review', 'textbook_chapter', 'professional_org', 'technical_report', 'other'],
  research_sources_source_role_check: ['primary_research', 'synthesis', 'guideline', 'regulator_safety', 'practice_guidance',
    'preclinical', 'regulatory_standard', 'other'],
  research_sources_verification_depth_check: ['full_text', 'abstract', 'secondary', 'unchecked'],
  research_sources_rights_access_check: ['open', 'paywalled', 'unknown', 'restricted'],
  research_sources_use_status_check: ['active', 'provisional', 'superseded', 'excluded', 'needs_review'],
  research_sources_migration_confidence_check: ['high', 'medium', 'low'],
  research_sources_verification_status_check: ['DISCOVERED', 'SOURCE_VERIFIED'],
  research_sources_full_text_observed_check: ['yes', 'no', 'unknown', 'partial'],
  research_sources_review_status_check: ['not_reviewed', 'reviewed_supported', 'reviewed_unsupported',
    'reviewed_too_specific', 'reviewed_access_limited', 'reviewed_narrowed'],
  research_claims_claim_type_check: ['finding', 'limitation', 'method_note', 'recommendation', 'safety_conclusion', 'other', 'method'],
  research_claims_fidelity_check: ['verbatim_quote', 'close_paraphrase', 'library_summary', 'exact', 'abstract'],
  research_claims_direction_check: ['supports_effect', 'no_effect', 'association', 'descriptive', 'precaution', 'unclear',
    'recommendation', 'limitation', 'safety', 'qualifies'],
  research_claims_extraction_basis_check: ['full_text', 'abstract', 'secondary', 'legacy_entry', 'primary_text', 'library_summary'],
  research_claims_extraction_confidence_check: ['high', 'medium', 'low'],
  research_claims_use_status_check: ['active', 'provisional', 'superseded', 'excluded', 'needs_review'],
  research_claims_claim_origin_check: ['primary_text', 'abstract', 'secondary', 'library_summary', 'full_text'],
  research_claims_verification_status_check: ['DISCOVERED', 'SOURCE_VERIFIED', 'CLAIM_VERIFIED', 'AIMT_APPROVED'],
  research_claims_review_status_check: ['not_reviewed', 'reviewed_supported', 'reviewed_unsupported',
    'reviewed_too_specific', 'reviewed_access_limited', 'reviewed_narrowed'],
  research_claims_parse_mode_check: ['strict', 'tolerant']
};

const FULL_DATE_RE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}:\d{2}.*)?$/;

const failures = []; // { record_id, table, constraint, detail }
function fail(table, record_id, constraint, detail) {
  failures.push({ table, record_id, constraint, detail });
}

function checkEnumCol(table, row, idField, col, constraintName) {
  const v = row[col];
  if (v === null || v === undefined) return; // nullable columns: null always satisfies an IN-list CHECK
  if (!SQL[constraintName].includes(v)) {
    fail(table, row[idField], constraintName, `${col} = ${JSON.stringify(v)}, not in (${SQL[constraintName].join('|')})`);
  }
}

function checkDateCol(table, row, idField, col) {
  const v = row[col];
  if (v === null || v === undefined) return;
  if (typeof v !== 'string' || !FULL_DATE_RE.test(v)) {
    fail(table, row[idField], `${col} (date column, Postgres input parsing)`, `${col} = ${JSON.stringify(v)} is not a full-precision ISO date/timestamp`);
  }
}

function main() {
  const dirArgIdx = process.argv.indexOf('--dir');
  const dir = dirArgIdx >= 0 ? process.argv[dirArgIdx + 1] : null;
  if (!dir) {
    console.error('Usage: node scripts/research-library-preflight.mjs --dir <unpacked export dir>');
    process.exit(1);
  }
  const dataDir = path.join(path.isAbsolute(dir) ? dir : path.join(ROOT, dir), 'data');

  const rawSources = readJsonl(path.join(dataDir, 'sources.jsonl'));
  const rawClaims = readJsonl(path.join(dataDir, 'claims.jsonl'));
  const rawTopics = readJsonl(path.join(dataDir, 'topics.jsonl'));
  const rawQueue = readJsonl(path.join(dataDir, 'verification_queue.jsonl'));
  const rawCoverage = readJsonl(path.join(dataDir, 'coverage.jsonl'));
  const rawRelationships = readJsonl(path.join(dataDir, 'relationships.jsonl'));

  const batchId = 'preflight-check';
  const sourceRows = rawSources.map((r) => mapSourceRow(r, { grokExportBatch: batchId }));
  const claimRows = rawClaims.map((r) => mapClaimRow(r, { grokExportBatch: batchId }));

  console.log(`Preflight: ${sourceRows.length} sources, ${claimRows.length} claims, ${rawTopics.length} topics, ${rawQueue.length} queue rows, ${rawCoverage.length} coverage rows, ${rawRelationships.length} relationships\n`);

  /* ── 1. Primary-key NOT NULL + duplicate detection ── */
  const seenSourceIds = new Set();
  for (const r of sourceRows) {
    if (!r.source_id) fail('research_sources', null, 'PRIMARY KEY NOT NULL', 'missing source_id');
    else if (seenSourceIds.has(r.source_id)) fail('research_sources', r.source_id, 'PRIMARY KEY unique', 'duplicate source_id within batch');
    else seenSourceIds.add(r.source_id);
  }
  const seenClaimIds = new Set();
  for (const r of claimRows) {
    if (!r.claim_id) fail('research_claims', null, 'PRIMARY KEY NOT NULL', 'missing claim_id');
    else if (seenClaimIds.has(r.claim_id)) fail('research_claims', r.claim_id, 'PRIMARY KEY unique', 'duplicate claim_id within batch');
    else seenClaimIds.add(r.claim_id);
    if (!r.source_id) fail('research_claims', r.claim_id, 'source_id NOT NULL', 'missing source_id');
    if (r.claim_text === null || r.claim_text === undefined || r.claim_text === '') {
      fail('research_claims', r.claim_id, 'claim_text NOT NULL', 'missing/empty claim_text');
    }
  }

  /* ── 2. doi unique partial index ── */
  const seenDoi = new Map();
  for (const r of sourceRows) {
    if (!r.doi) continue;
    if (seenDoi.has(r.doi)) fail('research_sources', r.source_id, 'research_sources_doi_unique_idx', `doi ${r.doi} duplicated with ${seenDoi.get(r.doi)}`);
    else seenDoi.set(r.doi, r.source_id);
  }

  /* ── 3. Enum CHECK constraints (on the MAPPED row, i.e. after boolean/
     YAML normalization -- this is what Postgres will actually see) ── */
  for (const r of sourceRows) {
    checkEnumCol('research_sources', r, 'source_id', 'evidence_type', 'research_sources_evidence_type_check');
    checkEnumCol('research_sources', r, 'source_id', 'source_role', 'research_sources_source_role_check');
    checkEnumCol('research_sources', r, 'source_id', 'verification_depth', 'research_sources_verification_depth_check');
    checkEnumCol('research_sources', r, 'source_id', 'rights_access_status', 'research_sources_rights_access_check');
    checkEnumCol('research_sources', r, 'source_id', 'use_status', 'research_sources_use_status_check');
    checkEnumCol('research_sources', r, 'source_id', 'migration_confidence', 'research_sources_migration_confidence_check');
    checkEnumCol('research_sources', r, 'source_id', 'verification_status', 'research_sources_verification_status_check');
    checkEnumCol('research_sources', r, 'source_id', 'full_text_access_observed', 'research_sources_full_text_observed_check');
    checkEnumCol('research_sources', r, 'source_id', 'verification_review_status', 'research_sources_review_status_check');
    if (r.full_text_held !== true && r.full_text_held !== false) {
      fail('research_sources', r.source_id, 'full_text_held NOT NULL boolean', `got ${JSON.stringify(r.full_text_held)}`);
    }
    if (!Array.isArray(r.topics)) fail('research_sources', r.source_id, 'topics NOT NULL text[]', `got ${JSON.stringify(r.topics)}`);
    checkDateCol('research_sources', r, 'source_id', 'date_published');
    checkDateCol('research_sources', r, 'source_id', 'verified_on');
    checkDateCol('research_sources', r, 'source_id', 'date_retrieved');
    checkDateCol('research_sources', r, 'source_id', 'last_reviewed_on');
    checkDateCol('research_sources', r, 'source_id', 'review_due_on');
    checkDateCol('research_sources', r, 'source_id', 'migrated_on');
    checkDateCol('research_sources', r, 'source_id', 'date_discovered');
  }

  for (const r of claimRows) {
    checkEnumCol('research_claims', r, 'claim_id', 'claim_type', 'research_claims_claim_type_check');
    checkEnumCol('research_claims', r, 'claim_id', 'claim_text_fidelity', 'research_claims_fidelity_check');
    checkEnumCol('research_claims', r, 'claim_id', 'direction', 'research_claims_direction_check');
    checkEnumCol('research_claims', r, 'claim_id', 'extraction_basis', 'research_claims_extraction_basis_check');
    checkEnumCol('research_claims', r, 'claim_id', 'extraction_confidence', 'research_claims_extraction_confidence_check');
    checkEnumCol('research_claims', r, 'claim_id', 'use_status', 'research_claims_use_status_check');
    checkEnumCol('research_claims', r, 'claim_id', 'claim_origin', 'research_claims_claim_origin_check');
    checkEnumCol('research_claims', r, 'claim_id', 'verification_status', 'research_claims_verification_status_check');
    checkEnumCol('research_claims', r, 'claim_id', 'verification_review_status', 'research_claims_review_status_check');
    checkEnumCol('research_claims', r, 'claim_id', 'frontmatter_parse_mode', 'research_claims_parse_mode_check');
    if (!Array.isArray(r.topics)) fail('research_claims', r.claim_id, 'topics NOT NULL text[]', `got ${JSON.stringify(r.topics)}`);
    if (r.verified_against_primary_source !== null && typeof r.verified_against_primary_source !== 'boolean') {
      fail('research_claims', r.claim_id, 'verified_against_primary_source boolean', `got ${JSON.stringify(r.verified_against_primary_source)}`);
    }
    checkDateCol('research_claims', r, 'claim_id', 'verified_on');
    checkDateCol('research_claims', r, 'claim_id', 'migrated_on');

    /* research_claims_discovered_not_active */
    if (r.verification_status === 'DISCOVERED' && r.use_status === 'active') {
      fail('research_claims', r.claim_id, 'research_claims_discovered_not_active',
        'verification_status=DISCOVERED with use_status=active (both cannot be true)');
    }
    /* public_eligible / published gates -- importer never sets these columns,
       so they take their `default false` and the two CHECK constraints
       (research_claims_public_requires_approved, ...published_requires_eligible)
       are trivially satisfied. Confirm the mapper really omits them (defense
       against a future regression silently reintroducing this risk). */
    if ('public_eligible' in r || 'published' in r) {
      fail('research_claims', r.claim_id, 'importer must never set public_eligible/published', 'mapClaimRow output includes a gate column');
    }
  }
  for (const r of sourceRows) {
    if ('public_eligible' in r || 'published' in r || 'aimt_reviewed_by' in r) {
      fail('research_sources', r.source_id, 'importer must never set public_eligible/published/aimt_reviewed_by', 'mapSourceRow output includes a gate column');
    }
  }

  /* ── 4. claims.source_id -> sources.source_id FK (within this export;
     the live orphan-quarantine logic in runImport() additionally checks
     against the existing DB at import time -- see
     scripts/research-library-ingestion-test.mjs) ── */
  for (const r of claimRows) {
    if (r.source_id && !seenSourceIds.has(r.source_id)) {
      fail('research_claims', r.claim_id, 'research_claims_source_id_fkey', `source_id ${r.source_id} not present among this export's sources`);
    }
  }

  /* ── 5. topics FK completeness for research_source_topics /
     research_claim_topics (mirrors the topic-union logic in
     runImport() step 1) ── */
  const topicUnion = new Set(CONTROLLED_TOPICS);
  for (const t of rawTopics) topicUnion.add(t.topic);
  for (const s of sourceRows) for (const t of (s.topics || [])) topicUnion.add(t);
  for (const c of claimRows) for (const t of (c.topics || [])) topicUnion.add(t);
  for (const t of topicUnion) {
    if (!t || typeof t !== 'string') fail('research_topics', null, 'topic PRIMARY KEY NOT NULL', `invalid topic value ${JSON.stringify(t)}`);
  }
  const seenTopicNames = new Set();
  for (const t of rawTopics) {
    if (seenTopicNames.has(t.topic)) fail('research_topics', t.topic, 'PRIMARY KEY unique', 'duplicate topic row in topics.jsonl');
    seenTopicNames.add(t.topic);
  }

  /* ── 6. verification_queue / coverage / relationships PK + FK ── */
  const seenQueueIds = new Set();
  for (const q of rawQueue) {
    if (!q.queue_id) fail('research_verification_queue', null, 'PRIMARY KEY NOT NULL', 'missing queue_id');
    else if (seenQueueIds.has(q.queue_id)) fail('research_verification_queue', q.queue_id, 'PRIMARY KEY unique', 'duplicate queue_id');
    else seenQueueIds.add(q.queue_id);
  }
  const seenCoverageTopics = new Set();
  for (const cv of rawCoverage) {
    if (!cv.topic) fail('research_coverage', null, 'PRIMARY KEY NOT NULL', 'missing topic');
    else if (seenCoverageTopics.has(cv.topic)) fail('research_coverage', cv.topic, 'PRIMARY KEY unique', 'duplicate coverage row for topic');
    else seenCoverageTopics.add(cv.topic);
    if (cv.topic && !topicUnion.has(cv.topic)) fail('research_coverage', cv.topic, 'research_coverage_topic_fkey', 'topic not present in the topics union that will be upserted first');
  }
  const seenRelIds = new Set();
  for (const rel of rawRelationships) {
    if (!rel.relationship_id) fail('research_relationships', null, 'PRIMARY KEY NOT NULL', 'missing relationship_id');
    else if (seenRelIds.has(rel.relationship_id)) fail('research_relationships', rel.relationship_id, 'PRIMARY KEY unique', 'duplicate relationship_id');
    else seenRelIds.add(rel.relationship_id);
    if (rel.subject_type && !['source', 'claim'].includes(rel.subject_type)) fail('research_relationships', rel.relationship_id, 'research_relationships_subject_type_check', rel.subject_type);
    if (rel.object_type && !['source', 'claim'].includes(rel.object_type)) fail('research_relationships', rel.relationship_id, 'research_relationships_object_type_check', rel.object_type);
    if (rel.confidence && !['high', 'medium', 'low'].includes(rel.confidence)) fail('research_relationships', rel.relationship_id, 'research_relationships_confidence_check', rel.confidence);
  }

  /* ── Report ── */
  if (failures.length === 0) {
    console.log(`PASS -- all ${sourceRows.length} sources and ${claimRows.length} claims (plus topics/queue/coverage/relationships) satisfy every CHECK/FK/NOT NULL constraint in the migration.`);
    process.exit(0);
  }
  console.error(`FAIL -- ${failures.length} record(s) would violate a constraint:\n`);
  for (const f of failures) {
    console.error(`  [${f.table}] ${f.record_id ?? '(no id)'} -- ${f.constraint}: ${f.detail}`);
  }
  process.exit(1);
}

main();
