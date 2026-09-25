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
     - AUTOMATED WRITER AUTHORITY (added after review found two bypasses:
       a direct caller could hand this writer a hash-consistent record
       whose clearance_mode was 'HUMAN_APPROVED', or whose canonical
       fingerprint_input.risk_tier was 'HIGH', and nothing here stopped
       it -- the DB CHECK constraint allows both values in general, since
       it has to accommodate a FUTURE human-authenticated write path and
       HIGH-risk topics that are simply never automated). THIS module is
       the AUTOMATED AUTO_READY persistence path ONLY.
       assertWritableClearanceRecord() now also throws for anything other
       than clearance_mode === 'AUTO_READY' (so HUMAN_APPROVED,
       HUMAN_REVIEW_REQUIRED, null, and any unknown value are all refused
       by the same check), and assertAutomatedRiskTierAuthority() throws
       for anything other than a canonical (fingerprint_input.risk_tier)
       LOWER/MODERATE risk tier (so HIGH, missing, and unrecognized tiers
       are all refused) -- both before any network call. A future
       HUMAN_APPROVED writer must be built as its own, separate,
       human-authenticated code path -- never a flag or parameter added
       to this one.
   ═══════════════════════════════════════════════════════════════ */

import { verifyStoredClearanceIntegrity } from './publication-clearance-fingerprint.mjs';

const AUTOMATED_ALLOWED_RISK_TIERS = Object.freeze(['LOWER', 'MODERATE']);

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
    if status is anything other than 'ready_for_page_builder' (this write
    path's only legitimate target status -- 'published' is refused even
    if somehow present, since it is not in ALLOWED_COLUMNS at all and
    would already be stripped, but this is a second, explicit check
    against a caller ever trying), or if clearance_mode is anything other
    than 'AUTO_READY'. This module is the AUTOMATED AUTO_READY
    persistence path ONLY -- rejecting anything other than exactly
    'AUTO_READY' also rejects 'HUMAN_APPROVED' (a legitimate DB state,
    reserved for a future, separate, human-authenticated write path this
    module must never be capable of impersonating), 'HUMAN_REVIEW_REQUIRED',
    null/undefined, and any unrecognized value, all with the same check.
    Exported so tests can exercise it without a network call. */
export function assertWritableClearanceRecord(record) {
  const extraKeys = Object.keys(record).filter((k) => !ALLOWED_COLUMNS.includes(k));
  if (extraKeys.length) {
    throw new Error(`writeClearanceRecord: refusing to write unexpected column(s): ${extraKeys.join(', ')}`);
  }
  if (record.status !== 'ready_for_page_builder') {
    throw new Error(`writeClearanceRecord: refusing to write status "${record.status}" -- this write path only ever sets 'ready_for_page_builder'.`);
  }
  if (record.clearance_mode !== 'AUTO_READY') {
    throw new Error(
      `writeClearanceRecord: refusing to write clearance_mode "${record.clearance_mode}" -- this is the automated AUTO_READY writer; it can never persist HUMAN_APPROVED, HUMAN_REVIEW_REQUIRED, or a missing/unrecognized clearance_mode. A human-approved write must go through a separate, human-authenticated path (not built here).`
    );
  }
}

/**
 * Risk-tier authority guard specific to THIS writer -- separate from
 * assertWritableClearanceRecord()'s column/status/clearance_mode
 * allow-list, because the authority here is the persisted CANONICAL
 * evidence snapshot, not a top-level column. Requires
 * record.publication_clearance.fingerprint_input.risk_tier (the
 * evidence snapshot's own authority -- not
 * publication_clearance.risk_tier, the top-level convenience duplicate)
 * to be exactly 'LOWER' or 'MODERATE'. 'HIGH', a missing
 * fingerprint_input, or any unrecognized value is refused.
 * buildAutoReadyClearanceRecord() already refuses to build a HIGH-risk
 * record in the first place, but this writer does not trust that every
 * caller went through that builder -- it fails closed on its own, before
 * any network call.
 *
 * @param {object} record
 */
export function assertAutomatedRiskTierAuthority(record) {
  const fingerprintInput = record.publication_clearance && typeof record.publication_clearance === 'object'
    ? record.publication_clearance.fingerprint_input
    : null;
  const canonicalRiskTier = fingerprintInput && typeof fingerprintInput === 'object' ? fingerprintInput.risk_tier : undefined;
  if (!AUTOMATED_ALLOWED_RISK_TIERS.includes(canonicalRiskTier)) {
    throw new Error(
      `writeClearanceRecord: refusing to write -- canonical risk_tier "${canonicalRiskTier}" (from publication_clearance.fingerprint_input.risk_tier) is not eligible for automated persistence; only LOWER or MODERATE may pass through this writer. HIGH, missing, and unrecognized risk tiers are always refused.`
    );
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
 * Guarded REPLACE of an existing NON-PUBLIC clearance row -- for the case
 * where a topic's persisted clearance was built from a since-corrected
 * synthesis intent (e.g. a semantic error found upstream) and must be
 * superseded, without this becoming a general-purpose "overwrite any row"
 * tool. Added for seo/education-page-2-generalization's telogen/exogen
 * correction: the plain writeClearanceRecord() upsert above is a blind
 * merge-duplicates POST with no precondition -- fine for a first write,
 * unsafe for a replace, since it can't tell "the row I read is still the
 * row that's there" from "someone else changed or published it since".
 *
 * This function instead issues a single conditional PATCH whose WHERE
 * clause -- evaluated atomically by Postgres, not read-then-write from
 * this process -- requires ALL of:
 *   - topic_slug matches
 *   - status = 'ready_for_page_builder'   (never touches a published row)
 *   - sitemap_eligible = false            (never touches a public row)
 *   - published_at is null                (never touches a published row)
 *   - generation_source_hash = requireCurrentHash (caller's last-read hash)
 * and refuses (throws) unless exactly one row matched and was replaced.
 * If the live row no longer matches -- because it was published, replaced
 * by a concurrent run, or simply not what the caller thinks it is -- zero
 * rows match and this throws instead of silently doing nothing or falling
 * back to a blind write.
 *
 * Shares every other safety gate with writeClearanceRecord(): same
 * ALLOWED_COLUMNS-only payload, same assertWritableClearanceRecord /
 * assertAutomatedRiskTierAuthority / assertClearanceIntegrityOrThrow
 * checks against the NEW record before any network call.
 *
 * @param {Object} env - must carry SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * @param {object} record - output of buildAutoReadyClearanceRecord() for
 *   the SAME topic_slug as the row being replaced
 * @param {{requireCurrentHash: string}} opts - the generation_source_hash
 *   the caller last read for this row; the guard clause that must still
 *   hold for the replace to proceed
 * @returns {Promise<object[]>} exactly one row (the newly-replaced record)
 */
export async function replaceNonPublicClearanceRecord(env, record, { requireCurrentHash } = {}) {
  if (!env || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('replaceNonPublicClearanceRecord: missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Refusing to write.');
  }
  if (!requireCurrentHash || typeof requireCurrentHash !== 'string') {
    throw new Error('replaceNonPublicClearanceRecord: requireCurrentHash is required -- this is a guarded replace of a specific known row, not a blind upsert.');
  }
  assertWritableClearanceRecord(record);
  assertAutomatedRiskTierAuthority(record);
  await assertClearanceIntegrityOrThrow(record);

  const payload = {};
  for (const col of ALLOWED_COLUMNS) {
    if (Object.prototype.hasOwnProperty.call(record, col) && col !== 'topic_slug') payload[col] = record[col];
  }

  const qs = new URLSearchParams({
    topic_slug: `eq.${record.topic_slug}`,
    status: 'eq.ready_for_page_builder',
    sitemap_eligible: 'eq.false',
    published_at: 'is.null',
    generation_source_hash: `eq.${requireCurrentHash}`,
  });

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/research_public_pages?${qs.toString()}`, {
    method: 'PATCH',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`replaceNonPublicClearanceRecord: guarded PATCH failed (${res.status}): ${errBody.slice(0, 500)}`);
  }
  const rows = await res.json();
  if (rows.length !== 1) {
    throw new Error(
      `replaceNonPublicClearanceRecord: guard failed -- expected exactly 1 row matching topic_slug="${record.topic_slug}", status=ready_for_page_builder, sitemap_eligible=false, published_at=null, generation_source_hash="${requireCurrentHash}", but ${rows.length} matched. The persisted row may have changed since it was last read (published, replaced by a concurrent run, or simply different) -- refusing to overwrite blindly.`
    );
  }
  return rows;
}

/**
 * Upserts one page-level clearance record into research_public_pages via
 * PostgREST, keyed on topic_slug (the table's primary key). Never called
 * automatically by anything in this repo -- always an explicit, manual
 * CLI invocation gated behind an owner go-ahead (see
 * scripts/research-publication-clearance-shadow.mjs's --write flag).
 * Use this ONLY for a topic's first-ever clearance write; to safely
 * REPLACE an existing non-public row, use
 * replaceNonPublicClearanceRecord() above instead, which guards against
 * overwriting a row that changed since it was last read.
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
  // Risk-tier authority gate -- before ANY network call. See
  // assertAutomatedRiskTierAuthority's own header comment: this writer is
  // the AUTOMATED AUTO_READY path only, and never trusts a caller's
  // claimed risk tier without checking the canonical fingerprint_input
  // itself.
  assertAutomatedRiskTierAuthority(record);
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

const PUBLISH_COLUMNS = Object.freeze(['status', 'sitemap_eligible', 'published_at']);

/**
 * THE separate, human-authenticated write path this module's header
 * comment anticipated -- "A future HUMAN_APPROVED writer must be built
 * as its own, separate, human-authenticated code path -- never a flag or
 * parameter added to this one." This is that path, and it is
 * deliberately incapable of doing anything writeClearanceRecord() or
 * replaceNonPublicClearanceRecord() do:
 *   - It can ONLY ever set exactly {status: 'published', sitemap_eligible:
 *     true, published_at: <timestamp>} -- PUBLISH_COLUMNS is not
 *     ALLOWED_COLUMNS, and nothing here ever touches clearance_mode,
 *     generation_source_hash, publication_clearance, key_claim_ids, or
 *     source_ids. Those stay exactly as the automated AUTO_READY writer
 *     left them.
 *   - It never builds or accepts a caller-supplied record -- there is no
 *     way to hand it arbitrary column values. Its only inputs are the
 *     topic_slug being published and the hash the caller last read.
 *   - It re-reads the live row itself (never trusts a caller's cached
 *     copy), re-verifies that row's OWN clearance integrity
 *     (verifyStoredClearanceIntegrity), and requires it to still be in
 *     the exact non-public AUTO_READY state
 *     (status=ready_for_page_builder, clearance_mode=AUTO_READY,
 *     sitemap_eligible=false, published_at=null,
 *     generation_source_hash=requireCurrentHash) before issuing a single
 *     conditional PATCH whose WHERE clause repeats every one of those
 *     conditions server-side, atomically -- exactly
 *     replaceNonPublicClearanceRecord()'s guard pattern, applied to a
 *     publish transition instead of a replace. Zero rows matching (state
 *     changed since read) or more than one row throws rather than
 *     silently doing nothing or succeeding on the wrong row.
 *   - This function is never called automatically by anything in this
 *     repo -- only from an explicit, manual, owner-authorized CLI
 *     invocation, exactly like every other write in this module.
 *
 * @param {Object} env - must carry SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * @param {string} topicSlug
 * @param {{requireCurrentHash: string}} opts
 * @returns {Promise<object[]>} exactly one row (the newly-published record)
 */
export async function publishClearanceRecord(env, topicSlug, { requireCurrentHash } = {}) {
  if (!env || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('publishClearanceRecord: missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Refusing to write.');
  }
  if (!topicSlug || typeof topicSlug !== 'string') {
    throw new Error('publishClearanceRecord: topicSlug is required.');
  }
  if (!requireCurrentHash || typeof requireCurrentHash !== 'string') {
    throw new Error('publishClearanceRecord: requireCurrentHash is required -- this is a guarded transition of a specific known row, not a blind publish.');
  }

  const readRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/research_public_pages?topic_slug=eq.${encodeURIComponent(topicSlug)}&select=*`,
    { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
  );
  if (!readRes.ok) throw new Error(`publishClearanceRecord: pre-publish read failed (${readRes.status})`);
  const [currentRow] = await readRes.json();
  if (!currentRow) throw new Error(`publishClearanceRecord: no row found for topic_slug="${topicSlug}".`);
  if (
    currentRow.status !== 'ready_for_page_builder'
    || currentRow.clearance_mode !== 'AUTO_READY'
    || currentRow.sitemap_eligible !== false
    || currentRow.published_at !== null
    || currentRow.generation_source_hash !== requireCurrentHash
  ) {
    throw new Error('publishClearanceRecord: the live row is not in the expected pre-publish state (status=ready_for_page_builder, clearance_mode=AUTO_READY, sitemap_eligible=false, published_at=null, generation_source_hash matching the caller-supplied value). Refusing to publish.');
  }

  const integrity = await verifyStoredClearanceIntegrity(currentRow);
  if (!integrity.valid) {
    throw new Error(`publishClearanceRecord: refusing to publish -- the live row failed its own integrity verification (${integrity.violations.join(', ')}).`);
  }

  const publishedAt = new Date().toISOString();
  const qs = new URLSearchParams({
    topic_slug: `eq.${topicSlug}`,
    status: 'eq.ready_for_page_builder',
    clearance_mode: 'eq.AUTO_READY',
    sitemap_eligible: 'eq.false',
    published_at: 'is.null',
    generation_source_hash: `eq.${requireCurrentHash}`,
  });
  const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/research_public_pages?${qs.toString()}`, {
    method: 'PATCH',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ status: 'published', sitemap_eligible: true, published_at: publishedAt }),
  });
  if (!patchRes.ok) {
    const errBody = await patchRes.text().catch(() => '');
    throw new Error(`publishClearanceRecord: guarded PATCH failed (${patchRes.status}): ${errBody.slice(0, 500)}`);
  }
  const rows = await patchRes.json();
  if (rows.length !== 1) {
    throw new Error(`publishClearanceRecord: guard failed -- expected exactly 1 row to match the publish precondition for topic_slug="${topicSlug}", but ${rows.length} matched. The row may have changed since it was last read -- refusing to publish blindly.`);
  }
  return rows;
}
