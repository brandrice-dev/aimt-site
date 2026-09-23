/* ═══════════════════════════════════════════════════════════════
   AIMT Automated Publication Clearance — page-level DB invariants
   ---------------------------------------------------------------
   PURE. Exact re-statement of the CHECK constraints added in
   supabase/migrations/20260923_add_publication_clearance_fields.sql --
   kept in sync by hand, the same posture scripts/research-library-
   preflight.mjs already takes toward the research_claims/research_sources
   CHECK constraints (a duplicate, independent statement, deliberately
   NOT sharing code with the writer, so this can catch drift between the
   SQL and the application layer instead of trusting the same logic
   twice). This lets a JS-side dry run -- and this file's own test suite
   -- verify what a live migration would enforce without a live Postgres
   connection.

   Three invariants, matching the migration exactly:
     1. status = 'ready_for_page_builder' requires a COMPLETE clearance:
        clearance_mode in (AUTO_READY, HUMAN_APPROVED), a non-empty
        generation_source_hash, at least one key_claim_id, at least one
        source_id, a non-empty publication_clearance object, AND (added
        this revision) publication_clearance carrying a non-empty
        fingerprint_algorithm string and a non-empty fingerprint_input
        object.
     2. clearance_mode = 'HUMAN_REVIEW_REQUIRED' may never coexist with
        status in (ready_for_page_builder, published).
     3. status = 'published' requires the SAME complete clearance as (1)
        -- forward-looking; this phase never sets status = 'published'
        itself. Hardened in an earlier revision: previously this only
        checked clearance_mode, which would have let a buggy future
        writer mark a row published with clearance_mode = 'AUTO_READY'
        but no hash, no claims, no sources, or an empty
        publication_clearance -- passing the letter of the constraint
        while defeating the auditability it exists to guarantee.

   REPRODUCIBILITY (added this revision): this module only checks that
   fingerprint_input is PRESENT and non-empty -- it does not, and cannot,
   recompute the SHA-256 hash itself (no crypto here, deliberately kept
   pure/sync so it can mirror what a Postgres CHECK constraint can
   actually enforce). The actual "does this hash reproduce from this
   input" check lives in publication-clearance-fingerprint.mjs's
   verifyStoredClearanceIntegrity() -- a SEPARATE, async, crypto-using
   function, not duplicated here. See that function's own header comment
   for the INTEGRITY-vs-FRESHNESS distinction: this module (and the
   migration it mirrors) only ever asks "does the auditable payload
   exist," never "does the underlying research still support it" or "is
   this the same brief a fresh AI run would produce" -- Publication
   Editor's synthesis step is nondeterministic, so neither question can
   be answered by regenerating anything.

   None of these three checks anywhere require or reference
   AIMT_APPROVED, claim-level public_eligible, or claim-level published
   -- deliberately. Page-level clearance (AUTO_READY or HUMAN_APPROVED)
   is a self-sufficient, independent route to 'ready_for_page_builder'/
   'published' eligibility; it does not gate on, and must never be made
   to gate on, a human having separately promoted every underlying
   selected claim.
   ═══════════════════════════════════════════════════════════════ */

function isNonEmptyString(v) {
  return typeof v === 'string' && v.length > 0;
}

function arrayCount(v) {
  return Array.isArray(v) ? v.length : 0;
}

function isNonEmptyPlainObject(v) {
  return (
    v !== null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    Object.keys(v).length > 0
  );
}

// Shared by both the ready and published invariants -- a "complete"
// page-level clearance is the same evidence bar either way (see header).
function pushCompleteClearanceViolations(row, constraintName, violations) {
  const clearanceMode = row.clearance_mode ?? null;
  if (!(clearanceMode === 'AUTO_READY' || clearanceMode === 'HUMAN_APPROVED')) {
    violations.push(`${constraintName}:clearance_mode`);
  }
  if (!isNonEmptyString(row.generation_source_hash)) {
    violations.push(`${constraintName}:generation_source_hash`);
  }
  if (arrayCount(row.key_claim_ids) === 0) {
    violations.push(`${constraintName}:key_claim_ids`);
  }
  if (arrayCount(row.source_ids) === 0) {
    violations.push(`${constraintName}:source_ids`);
  }
  if (!isNonEmptyPlainObject(row.publication_clearance)) {
    violations.push(`${constraintName}:publication_clearance`);
  } else {
    if (!isNonEmptyString(row.publication_clearance.fingerprint_algorithm)) {
      violations.push(`${constraintName}:fingerprint_algorithm`);
    }
    if (!isNonEmptyPlainObject(row.publication_clearance.fingerprint_input)) {
      violations.push(`${constraintName}:fingerprint_input`);
    }
  }
}

/**
 * @param {object} row - a research_public_pages-shaped row (or candidate
 *   record before write)
 * @returns {{valid: boolean, violations: string[]}}
 */
export function validatePageInvariants(row) {
  const violations = [];
  const status = row.status;
  const clearanceMode = row.clearance_mode ?? null;

  // 1. research_public_pages_ready_requires_clearance
  if (status === 'ready_for_page_builder') {
    pushCompleteClearanceViolations(row, 'research_public_pages_ready_requires_clearance', violations);
  }

  // 2. research_public_pages_review_required_not_ready
  if (clearanceMode === 'HUMAN_REVIEW_REQUIRED' && (status === 'ready_for_page_builder' || status === 'published')) {
    violations.push('research_public_pages_review_required_not_ready');
  }

  // 3. research_public_pages_published_requires_clearance (forward-looking)
  if (status === 'published') {
    pushCompleteClearanceViolations(row, 'research_public_pages_published_requires_clearance', violations);
  }

  return { valid: violations.length === 0, violations };
}
