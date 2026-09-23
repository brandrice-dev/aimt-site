/* ═══════════════════════════════════════════════════════════════
   AIMT Page Builder v1 — read-only production clearance loader
   ---------------------------------------------------------------
   The ONLY module in Page Builder that talks to Supabase, and it only
   ever GETs. No POST/PATCH/DELETE verb appears anywhere in this file.
   Mirrors the exact service-role-over-fetch pattern already used by
   functions/_lib/research/publication-readiness-loader.mjs#fetchTopicEvidenceLive
   and functions/api/research-query.js (apikey + Authorization: Bearer
   <service role key>, GET only).

   GOVERNANCE (do not weaken): Page Builder's source of truth is the
   PERSISTED, IMMUTABLE clearance snapshot -- research_public_pages.
   publication_clearance.fingerprint_input -- never the full topic-wide
   research_claims/research_sources corpus. This module has no code path
   that queries research_claims or research_sources at all; it reads
   exactly one row of research_public_pages, by topic_slug, and hands
   back only the ten fields listed in CLEARED_SNAPSHOT_FIELDS.
   extractClearedSnapshot() is the sole gate a caller can pass through to
   reach evidence content -- there is no second function that reaches
   back into the full record for "just one more field."
   ═══════════════════════════════════════════════════════════════ */

import { verifyStoredClearanceIntegrity } from '../research/publication-clearance-fingerprint.mjs';
import { validatePageInvariants } from '../research/publication-clearance-invariants.mjs';

export class PageBuilderLoadError extends Error {
  constructor(message, { code } = {}) {
    super(message);
    this.name = 'PageBuilderLoadError';
    this.code = code || 'unknown';
  }
}

/** Exactly the categories a page-level clearance snapshot carries --
    functions/_lib/research/publication-clearance-fingerprint.mjs
    #buildFingerprintInput()'s own canonical output shape. Page Builder
    must never silently expand beyond these ten fields. */
export const CLEARED_SNAPSHOT_FIELDS = Object.freeze([
  'topic_slug',
  'page_concept',
  'public_intent',
  'scope_language',
  'risk_tier',
  'selected_claim_ids',
  'core_factual_points',
  'limitations',
  'citation_map',
  'source_ids',
]);

/**
 * Read-only GET of exactly one research_public_pages row, by topic_slug.
 * Never a live Anthropic call, never a write. Mirrors research-readiness-
 * loader.mjs's fetchTopicEvidenceLive() convention.
 *
 * @param {Object} env - must carry SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * @param {string} topicSlug
 * @returns {Promise<object>} the raw research_public_pages row
 */
export async function fetchProductionClearanceRow(env, topicSlug) {
  if (!env || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new PageBuilderLoadError('fetchProductionClearanceRow: missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.', { code: 'missing_credentials' });
  }
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };
  const qs = new URLSearchParams();
  qs.set('select', '*');
  qs.set('topic_slug', `eq.${topicSlug}`);
  qs.set('limit', '1');

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/research_public_pages?${qs.toString()}`, { method: 'GET', headers });
  if (!res.ok) {
    throw new PageBuilderLoadError(`fetchProductionClearanceRow: research_public_pages fetch failed (${res.status}): ${(await res.text().catch(() => '')).slice(0, 500)}`, { code: 'fetch_failed' });
  }
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new PageBuilderLoadError(`fetchProductionClearanceRow: no research_public_pages row found for topic_slug "${topicSlug}".`, { code: 'not_found' });
  }
  return rows[0];
}

/**
 * The mandatory pre-load gate: BOTH stored-clearance integrity and the DB
 * invariant mirror must return valid=true before Page Builder is allowed
 * to touch a row's evidence at all. Throws PageBuilderLoadError (never a
 * silent false) on either failure, naming the exact violations -- Page
 * Builder must refuse to draft from a row it cannot first prove is
 * genuinely, completely cleared.
 *
 * @param {object} record - a research_public_pages row
 * @returns {Promise<{integrity: object, invariants: object}>}
 */
export async function assertClearedRowOrThrow(record) {
  const integrity = await verifyStoredClearanceIntegrity(record);
  if (integrity.valid !== true) {
    throw new PageBuilderLoadError(`assertClearedRowOrThrow: stored clearance failed integrity verification (${integrity.violations.join(', ')}).`, { code: 'integrity_failed' });
  }
  const invariants = validatePageInvariants(record);
  if (invariants.valid !== true) {
    throw new PageBuilderLoadError(`assertClearedRowOrThrow: stored clearance failed the DB invariant mirror (${invariants.violations.join(', ')}).`, { code: 'invariants_failed' });
  }
  if (record.clearance_mode !== 'AUTO_READY' && record.clearance_mode !== 'HUMAN_APPROVED') {
    throw new PageBuilderLoadError(`assertClearedRowOrThrow: clearance_mode "${record.clearance_mode}" is not eligible for Page Builder -- only AUTO_READY or HUMAN_APPROVED rows may be drafted from.`, { code: 'ineligible_clearance_mode' });
  }
  if (record.status !== 'ready_for_page_builder') {
    throw new PageBuilderLoadError(`assertClearedRowOrThrow: status "${record.status}" is not "ready_for_page_builder".`, { code: 'ineligible_status' });
  }
  return { integrity, invariants };
}

/**
 * Extracts ONLY the ten cleared-snapshot fields from a verified row's
 * publication_clearance.fingerprint_input -- the exact object that was
 * hashed to produce generation_source_hash, per
 * publication-clearance.mjs#buildAutoReadyClearanceRecord()'s own
 * "never invent a second representation" contract. Never reads
 * key_claim_ids/source_ids off the row's top-level columns instead of
 * fingerprint_input -- fingerprint_input is the single source of truth
 * Page Builder is authorized to see.
 *
 * @param {object} record - a research_public_pages row that has already
 *   passed assertClearedRowOrThrow()
 * @returns {object} a frozen, exactly-ten-field snapshot
 */
export function extractClearedSnapshot(record) {
  const input = record && record.publication_clearance ? record.publication_clearance.fingerprint_input : null;
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new PageBuilderLoadError('extractClearedSnapshot: record has no usable publication_clearance.fingerprint_input.', { code: 'missing_fingerprint_input' });
  }
  const snapshot = {};
  for (const field of CLEARED_SNAPSHOT_FIELDS) {
    if (!(field in input)) {
      throw new PageBuilderLoadError(`extractClearedSnapshot: fingerprint_input is missing required field "${field}".`, { code: 'incomplete_snapshot' });
    }
    snapshot[field] = input[field];
  }
  return Object.freeze(snapshot);
}

/**
 * Convenience composition: load, verify, and extract in one call. This
 * is the ONLY function scripts/page-builder-shadow.mjs calls to obtain
 * evidence -- it never fetches research_public_pages any other way.
 *
 * @param {Object} env
 * @param {string} topicSlug
 * @returns {Promise<{record: object, snapshot: object, integrity: object, invariants: object}>}
 */
export async function loadClearedSnapshot(env, topicSlug) {
  const record = await fetchProductionClearanceRow(env, topicSlug);
  const { integrity, invariants } = await assertClearedRowOrThrow(record);
  const snapshot = extractClearedSnapshot(record);
  return { record, snapshot, integrity, invariants };
}
