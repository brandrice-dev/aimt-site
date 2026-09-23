/* ═══════════════════════════════════════════════════════════════
   AIMT Automated Publication Clearance — evidence-brief fingerprint
   ---------------------------------------------------------------
   PURE (aside from Web Crypto's digest call, which has no side effects
   and is deterministic for a given input -- the same posture this repo
   already takes toward stripe-webhook.js's signature verification).
   Zero I/O, zero database access, zero network calls.

   CRITICAL FINGERPRINT RULE (per the originating request): an AUTO_READY
   clearance applies to ONE EXACT evidence brief. If any of the following
   materially change, the prior clearance is stale and must not silently
   authorize a new page:
     - selected claims
     - core factual points
     - limitations
     - citation map
     - risk tier
     - source set

   Everything else on a page evidence brief (review_timestamp, provenance/
   model-version metadata, page_concept/public_intent prose, excluded-
   claim reasons) is deliberately EXCLUDED from the fingerprint input --
   it can differ between two runs of the same underlying evidence without
   that evidence itself having materially changed. This is also what
   makes two semantically-identical briefs with reordered/extra fields
   hash identically: canonicalization only ever extracts the six
   categories above before hashing anything.

   KNOWN LIMITATION (documented per the originating request's own
   instruction to distinguish enforceable-now from speculative): a
   change in the synthesis MODEL or its version is NOT reflected in this
   fingerprint, only a change in the evidence content itself. A future
   phase could fold `provenance.synthesis_model` into a *separate*
   staleness signal if AIMT decides a model/version change alone should
   also invalidate a prior clearance -- not implemented here because
   nothing in the current evidence-brief shape marks that distinction as
   materially relevant on its own, and speculative invalidation rules are
   explicitly out of scope for this phase.
   ═══════════════════════════════════════════════════════════════ */

export const FINGERPRINT_ALGORITHM = 'sha256-canonical-json-v1';

/** Recursively sorts object keys and array-of-primitive/records so two
    structurally-equivalent-but-differently-ordered inputs canonicalize
    identically. Never mutates the input. */
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = canonicalize(value[key]);
    return out;
  }
  return value;
}

/** Sorts an array of canonicalizable records by their own canonical JSON
    string, so array ORDER (e.g. core_factual_points listed in a
    different sequence) never changes the fingerprint on its own. */
function sortRecordsCanonically(records) {
  return records
    .map(canonicalize)
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

function sortStrings(values) {
  return [...(values || [])].sort();
}

/**
 * Extracts exactly the six materially-relevant categories from a page
 * evidence brief (functions/_lib/research/publication-synthesis-
 * evidence.mjs#buildPageEvidenceBrief's output shape) into a canonical
 * object ready to be stringified and hashed. Exported on its own (not
 * just computeEvidenceFingerprint) so tests and callers can inspect
 * exactly what did/didn't feed the hash.
 *
 * @param {object} brief - a page evidence brief
 * @returns {object} canonical fingerprint input
 */
export function buildFingerprintInput(brief) {
  return {
    risk_tier: brief.risk_tier,
    selected_claim_ids: sortStrings(brief.approved_for_draft_claim_ids),
    core_factual_points: sortRecordsCanonically(
      (brief.core_factual_points || []).map((p) => ({ statement: p.statement, supporting_claim_ids: sortStrings(p.supporting_claim_ids) }))
    ),
    limitations: sortRecordsCanonically(
      (brief.limitations || []).map((p) => ({ statement: p.statement, supporting_claim_ids: sortStrings(p.supporting_claim_ids) }))
    ),
    citation_map: canonicalize(brief.citation_map || {}),
    source_ids: sortStrings(brief.source_ids),
  };
}

/** Deterministic JSON string for a canonicalized value -- same string in,
    same string out, regardless of input key/array order. */
export function canonicalStringify(value) {
  return JSON.stringify(canonicalize(value));
}

/**
 * Computes the deterministic SHA-256 fingerprint of a page evidence
 * brief's materially-relevant content. Uses Web Crypto (globalThis.crypto.
 * subtle), matching this repo's "Web Crypto + fetch only" convention
 * (functions/api/stripe-webhook.js's signature verification) so the same
 * function runs identically in a Cloudflare Pages Function, a Cloudflare
 * Worker, or a local Node script (Node's global crypto.subtle) without a
 * dependency.
 *
 * @param {object} brief - a page evidence brief
 * @returns {Promise<string>} lowercase hex-encoded SHA-256 digest
 */
export async function computeEvidenceFingerprint(brief) {
  const input = buildFingerprintInput(brief);
  const json = canonicalStringify(input);
  const bytes = new TextEncoder().encode(json);
  const digestBuffer = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digestBuffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Checks whether a previously-stored fingerprint still matches a
 * (possibly regenerated) page evidence brief -- the deterministic
 * invalidation check. Never throws; returns a structured result so a
 * caller can log/report exactly what happened.
 *
 * @param {object} brief - the current page evidence brief
 * @param {string} storedFingerprint - the fingerprint recorded on a prior clearance
 * @returns {Promise<{stale: boolean, currentFingerprint: string}>}
 */
export async function isClearanceStale(brief, storedFingerprint) {
  const currentFingerprint = await computeEvidenceFingerprint(brief);
  return { stale: currentFingerprint !== storedFingerprint, currentFingerprint };
}
