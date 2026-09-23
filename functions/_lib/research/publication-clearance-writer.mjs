/* ═══════════════════════════════════════════════════════════════
   AIMT Automated Publication Clearance — write path (I/O layer)
   ---------------------------------------------------------------
   The ONLY module in this feature that writes to Supabase. Requires
   SUPABASE_SERVICE_ROLE_KEY -- never callable anonymously, never
   reachable from a public route (no Cloudflare Pages Function wraps
   this; it is invoked only from the local CLI script,
   scripts/research-publication-clearance-shadow.mjs, exactly like
   Publication Editor v1/v2's read-only loaders and research-library-
   import.mjs's --live upsert path). No client-side Supabase key is ever
   used here.

   SECURITY / SCOPE, enforced in code, not just documented:
     - ALLOWED_COLUMNS is a strict allow-list. Any key on the record
       that isn't in this list -- including published/sitemap_eligible/
       any AIMT_APPROVED-adjacent field -- causes this function to
       refuse the write outright, before any network call is made.
     - This module issues exactly one kind of request: an upsert (POST
       with Prefer: resolution=merge-duplicates) to research_public_pages
       only. It has no code path that touches research_claims,
       research_sources, or any other table.
     - It never sets status = 'published', never sets published_at, and
       ALLOWED_COLUMNS doesn't even include those keys -- there is no
       way to ask this function to publish anything.
     - INTEGRITY GATE (added after review found the CLI's own
       verifyStoredClearanceIntegrity() call was advisory-only -- it
       printed PASS/FAIL but nothing stopped --write from proceeding on
       FAIL): writeClearanceRecord() independently re-verifies the
       record's own stored-clearance integrity
       (publication-clearance-fingerprint.mjs#verifyStoredClearanceIntegrity)
       before any network call, and throws if it fails. This is
       deliberately NOT left to the CLI alone -- this module must protect
       itself regardless of what future code calls it directly.
   ═══════════════════════════════════════════════════════════════ */

import { verifyStoredClearanceIntegrity } from './publication-clearance-fingerprint.mjs';

export const ALLOWED_COLUMNS = Object.freeze([
  'topic_slug',
  'topic',
  'key_claim_ids',
  'source_ids',
  'summary_markdown',
  'limitations_markdown',
  'practitioner_relevance_markdown',
  'status',
  'clearance_mode',
  'generation_source_hash',
  'last_generated_at',
  'publication_clearance',
]);

/** Pure guard: throws if `record` contains any key outside ALLOWED_COLUMNS,
    or if status is anything other than 'ready_for_page_builder' (this
    write path's only legitimate target status -- 'published' is refused
    even if somehow present, since it is not in ALLOWED_COLUMNS at all
    and would already be stripped, but this is a second, explicit check
    against a caller ever trying). Exported so tests can exercise it
    without a network call. */
export function assertWritableClearanceRecord(record) {
  const extraKeys = Object.keys(record).filter((k) => !ALLOWED_COLUMNS.includes(k));
  if (extraKeys.length) {
    throw new Error(`writeClearanceRecord: refusing to write unexpected column(s): ${extraKeys.join(', ')}`);
  }
  if (record.status && record.status !== 'ready_for_page_builder') {
    throw new Error(`writeClearanceRecord: refusing to write status "${record.status}" -- this write path only ever sets 'ready_for_page_builder'.`);
  }
}

/**
 * Re-verifies a record's OWN stored-clearance integrity
 * (verifyStoredClearanceIntegrity -- pure, Web-Crypto-only, no I/O) and
 * throws if it fails. This is the writer's own independent gate: it does
 * not trust that whatever called writeClearanceRecord() already checked
 * this (the CLI does too, for UX, but this function protects the writer
 * even if called directly by future code that skips the CLI entirely).
 * The thrown message lists violation CODES only (e.g. "HASH_MISMATCH",
 * "KEY_CLAIM_IDS_MISMATCH") -- never record contents, env vars, or any
 * secret.
 *
 * @param {object} record
 * @returns {Promise<{valid: true, expected_hash: string, stored_hash: string, violations: []}>}
 */
export async function assertClearanceIntegrityOrThrow(record) {
  const integrity = await verifyStoredClearanceIntegrity(record);
  if (integrity.valid !== true) {
    throw new Error(`writeClearanceRecord: refusing to write -- stored clearance failed integrity verification (${integrity.violations.join(', ')}).`);
  }
  return integrity;
}

/**
 * Upserts one page-level clearance record into research_public_pages via
 * PostgREST, keyed on topic_slug (the table's primary key). Never called
 * automatically by anything in this repo -- always an explicit, manual
 * CLI invocation gated behind an owner go-ahead (see
 * scripts/research-publication-clearance-shadow.mjs's --write flag).
 *
 * @param {Object} env - must carry SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * @param {object} record - output of buildAutoReadyClearanceRecord()
 * @returns {Promise<object[]>} the upserted row(s), per PostgREST's
 *   return=representation
 */
export async function writeClearanceRecord(env, record) {
  if (!env || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('writeClearanceRecord: missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Refusing to write.');
  }
  assertWritableClearanceRecord(record);
  // Integrity gate -- before ANY network call. See assertClearanceIntegrityOrThrow's
  // own header comment for why this can't be left to the CLI alone.
  await assertClearanceIntegrityOrThrow(record);

  const payload = {};
  for (const col of ALLOWED_COLUMNS) {
    if (Object.prototype.hasOwnProperty.call(record, col)) payload[col] = record[col];
  }

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/research_public_pages`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`writeClearanceRecord: upsert failed (${res.status}): ${errBody.slice(0, 500)}`);
  }
  return res.json();
}
