/* ═══════════════════════════════════════════════════════════════
   AIMT Publication Editor v2.1 — bounded reconciliation (STEP 1-4)
   ---------------------------------------------------------------
   PURE. Zero I/O, zero model calls (the two model calls this lane
   needs -- a targeted reconciliation and a bounded full retry -- live
   in publication-synthesis-client.mjs; this module only classifies,
   validates the shape of, and merges their results).

   GOVERNANCE CORRECTION this module exists for: a validator rejection
   is not automatically a human task. `CLAIM_MISSING_DISPOSITION` --
   the model simply forgot to give a handful of the (potentially
   hundreds of) candidate claims an explicit selected/excluded verdict
   -- is a mechanically detectable, mechanically repairable accounting
   defect, not a scientific or safety judgment call. Humans should
   review genuine exceptions (HIGH risk, an unresolved disagreement,
   an already-flagged claim, a hallucinated/ungrounded reference) --
   not a bookkeeping gap this same pipeline can safely close itself.
   ═══════════════════════════════════════════════════════════════ */

import { CLAIM_ROLES, EXCLUSION_REASON_CODES } from './publication-synthesis-schema.mjs';

export const RECONCILIATION_DISPOSITIONS = Object.freeze(['SELECTED', 'EXCLUDED']);

/* ── STEP 1: violation classification ─────────────────────────────────
   Every validator violation code (publication-synthesis-validator.mjs)
   falls into exactly one bucket:

   REPAIRABLE_ACCOUNTING   -- CLAIM_MISSING_DISPOSITION only, for v2.1.
                              A claim the model simply never gave a
                              verdict to. Safe to resolve with a
                              targeted, bounded reconciliation call.
   SUBSTANTIVE             -- a genuine exception: HIGH-risk lockout, a
                              v1-level precondition failure, or the
                              model's own declared inability to
                              proceed cleanly (unresolved_issues
                              present alongside AUTO_READY). These
                              always route to HUMAN_REVIEW, and never
                              enter the reconciliation lane.
   NON_REPAIRABLE_MECHANICAL -- an integrity/grounding defect no
                              targeted reconciliation call could safely
                              fix without re-deriving trust in the
                              whole proposal: a hallucinated claim/
                              source ID, a claim double-dispositioned,
                              a selected claim that fails its own
                              candidacy check, an excluded claim
                              resurfacing as public support, or any
                              other structural defect. These map to
                              SYNTHESIS_FAILED -- automation failed to
                              produce a trustworthy proposal, which is
                              a different thing from a human needing to
                              exercise judgment. */
const REPAIRABLE_CODE = 'CLAIM_MISSING_DISPOSITION';

const SUBSTANTIVE_CODES = new Set([
  'HIGH_RISK_TOPIC_CANNOT_AUTO_CLEAR',
  'HIGH_RISK_TOPIC_IN_PACKET_CONTROLLED_TOPICS',
  'HIGH_RISK_CANNOT_AUTO_READY',
  'V1_RESULT_NOT_NEEDS_SYNTHESIS',
  'V1_EVIDENCE_GAPS_PRESENT',
  'UNRESOLVED_ISSUES_WITH_AUTO_READY',
  'NO_SYNTHESIS_PACKET_ON_V1_RESULT',
]);

function violationCode(violation) {
  const idx = violation.indexOf(':');
  return idx === -1 ? violation : violation.slice(0, idx);
}

/**
 * @param {string[]} violations - from validateSynthesisOutput()'s .violations
 * @returns {{
 *   repairable_accounting_claim_ids: string[],
 *   substantive: string[],
 *   non_repairable_mechanical: string[],
 *   only_repairable_accounting: boolean
 * }}
 */
export function classifyValidatorViolations(violations) {
  const repairableAccountingClaimIds = [];
  const substantive = [];
  const nonRepairableMechanical = [];

  for (const v of violations || []) {
    const code = violationCode(v);
    if (code === REPAIRABLE_CODE) {
      repairableAccountingClaimIds.push(v.slice(REPAIRABLE_CODE.length + 1));
    } else if (SUBSTANTIVE_CODES.has(code)) {
      substantive.push(v);
    } else {
      nonRepairableMechanical.push(v);
    }
  }

  return {
    repairable_accounting_claim_ids: repairableAccountingClaimIds,
    substantive,
    non_repairable_mechanical: nonRepairableMechanical,
    only_repairable_accounting: repairableAccountingClaimIds.length > 0
      && substantive.length === 0
      && nonRepairableMechanical.length === 0,
  };
}

/* ── STEP 2: reconciliation output contract ───────────────────────── */
export const RECONCILIATION_OUTPUT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    resolutions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          claim_id: { type: 'string' },
          disposition: { type: 'string', enum: [...RECONCILIATION_DISPOSITIONS] },
          role: { anyOf: [{ type: 'string', enum: [...CLAIM_ROLES] }, { type: 'null' }] },
          reason_code: { anyOf: [{ type: 'string', enum: [...EXCLUSION_REASON_CODES] }, { type: 'null' }] },
          reason: { type: 'string' },
          materially_changes_existing_synthesis: { type: 'boolean' },
          material_change_reason: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        },
        required: ['claim_id', 'disposition', 'role', 'reason_code', 'reason', 'materially_changes_existing_synthesis', 'material_change_reason'],
        additionalProperties: false,
      },
    },
  },
  required: ['resolutions'],
  additionalProperties: false,
};

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * STEP 2 rules: every supplied missing claim ID must appear exactly
 * once, no other claim IDs allowed, SELECTED requires a valid role,
 * EXCLUDED requires a valid reason_code + reason, and a claim declaring
 * a material change must say why.
 *
 * @param {object} output - parsed reconciliation response
 * @param {string[]} expectedClaimIds - the exact missing-claim set sent
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateReconciliationShape(output, expectedClaimIds) {
  const errors = [];
  if (!output || typeof output !== 'object' || !Array.isArray(output.resolutions)) {
    return { valid: false, errors: ['OUTPUT_NOT_AN_OBJECT_WITH_RESOLUTIONS'] };
  }

  const seenCounts = new Map();
  output.resolutions.forEach((r, i) => {
    if (!r || !isNonEmptyString(r.claim_id)) {
      errors.push(`MISSING_OR_INVALID:resolutions[${i}].claim_id`);
      return;
    }
    seenCounts.set(r.claim_id, (seenCounts.get(r.claim_id) || 0) + 1);

    if (!RECONCILIATION_DISPOSITIONS.includes(r.disposition)) {
      errors.push(`MISSING_OR_INVALID:resolutions[${i}].disposition`);
    }
    if (r.disposition === 'SELECTED' && !CLAIM_ROLES.includes(r.role)) {
      errors.push(`SELECTED_REQUIRES_VALID_ROLE:${r.claim_id}`);
    }
    if (r.disposition === 'EXCLUDED' && !EXCLUSION_REASON_CODES.includes(r.reason_code)) {
      errors.push(`EXCLUDED_REQUIRES_VALID_REASON_CODE:${r.claim_id}`);
    }
    if (!isNonEmptyString(r.reason)) {
      errors.push(`MISSING_OR_INVALID:resolutions[${i}].reason`);
    }
    if (typeof r.materially_changes_existing_synthesis !== 'boolean') {
      errors.push(`MISSING_OR_INVALID:resolutions[${i}].materially_changes_existing_synthesis`);
    }
    if (r.materially_changes_existing_synthesis === true && !isNonEmptyString(r.material_change_reason)) {
      errors.push(`MATERIAL_CHANGE_REQUIRES_REASON:${r.claim_id}`);
    }
  });

  const expectedSet = new Set(expectedClaimIds);
  for (const id of expectedClaimIds) {
    const count = seenCounts.get(id) || 0;
    if (count === 0) errors.push(`RECONCILIATION_MISSING_EXPECTED_CLAIM:${id}`);
    if (count > 1) errors.push(`RECONCILIATION_DUPLICATE_CLAIM:${id}`);
  }
  for (const id of seenCounts.keys()) {
    if (!expectedSet.has(id)) errors.push(`RECONCILIATION_UNEXPECTED_CLAIM:${id}`);
  }

  return { valid: errors.length === 0, errors };
}

/* ── STEP 3/4: safe-merge vs. material-change routing ───────────────── */
/**
 * @param {object[]} resolutions - a SHAPE-VALID reconciliation's .resolutions
 * @returns {'SAFE_MERGE' | 'FULL_RETRY_REQUIRED'}
 */
export function determineReconciliationOutcome(resolutions) {
  const anyMaterial = (resolutions || []).some((r) => r.materially_changes_existing_synthesis === true);
  return anyMaterial ? 'FULL_RETRY_REQUIRED' : 'SAFE_MERGE';
}

/**
 * STEP 3: merges shape-valid, non-material resolutions into the
 * existing synthesis output WITHOUT touching its public framing --
 * only selected_claims/excluded_claims grow. Never mutates the input.
 * Caller is responsible for re-running the FULL deterministic validator
 * against the merged result -- this function does not itself decide
 * validity, only produces the candidate merged object.
 *
 * @param {object} originalOutput - the initial (schema-valid) synthesis output
 * @param {object[]} resolutions - shape-valid reconciliation resolutions
 * @returns {object} a new synthesis-output-shaped object
 */
export function mergeReconciliationIntoSynthesis(originalOutput, resolutions) {
  const selected = [...originalOutput.selected_claims];
  const excluded = [...originalOutput.excluded_claims];

  for (const r of resolutions) {
    if (r.disposition === 'SELECTED') {
      selected.push({ claim_id: r.claim_id, role: r.role, reason: r.reason });
    } else {
      excluded.push({ claim_id: r.claim_id, reason_code: r.reason_code, reason: r.reason });
    }
  }

  return { ...originalOutput, selected_claims: selected, excluded_claims: excluded };
}

/* ── prompt builders (used by publication-synthesis-client.mjs) ────── */

/** STEP 2: the targeted reconciliation instruction. Deliberately does
    NOT resend all candidate claims -- only the missing ones plus enough
    context (page intent, existing synthesis) for the model to place
    them correctly and judge whether they change anything already
    decided. */
export function buildReconciliationInstruction({ pageConcept, publicIntent, inScopeConcepts, outOfScopeConcepts }) {
  return [
    `You are the AIMT Publication Editor, performing a TARGETED RECONCILIATION pass, not a fresh synthesis. A prior synthesis pass for this page omitted a disposition for a small number of candidate claims -- your only job is to classify EXACTLY those claims and say whether doing so changes anything about the existing synthesis.`,
    ``,
    `PAGE CONCEPT: ${pageConcept}`,
    `PUBLIC INTENT: ${publicIntent}`,
    `IN-SCOPE for this page: ${inScopeConcepts.join(', ')}.`,
    `OUT OF SCOPE for this page: ${outOfScopeConcepts.join(', ')}.`,
    ``,
    `You are given: the existing synthesis result (its page_scope, core_points, limitations, resolved_synthesis_signals, unresolved_issues, recommended_disposition, confidence) and the FULL evidence record (claim + source) for ONLY the missing claims.`,
    `For every missing claim, decide SELECTED or EXCLUDED using the same rules as an original synthesis pass would: SELECTED needs a role (core_finding/supporting_context/limitation) and a reason; EXCLUDED needs a reason_code and a reason.`,
    `Then compare it against the EXISTING synthesis you were given and decide materially_changes_existing_synthesis: true only if incorporating this claim would change a core factual point, a limitation, the resolution of a synthesis signal, the page scope, or an unresolved issue -- NOT true merely because the claim exists or is interesting. If true, material_change_reason must say specifically what would need to change.`,
    `Every claim_id you were given must appear in your resolutions EXACTLY ONCE. Never include a claim_id you were not given.`,
  ].join('\n');
}

/** STEP 4: the bounded full-retry instruction -- a fresh, complete
    synthesis, but explicitly informed of the previous attempt and the
    material claim(s) reconciliation found, so the model reconsiders
    framing rather than repeating the same omission. */
export function buildFullRetryInstruction(base, { formerlyMissingClaimIds, materialResolutions }) {
  return [
    base,
    ``,
    `THIS IS A BOUNDED RETRY of a previous synthesis attempt for this exact page. That attempt omitted a disposition for these claim_id(s): ${formerlyMissingClaimIds.join(', ')}. A reconciliation pass has already determined that incorporating at least one of them materially changes the synthesis (see the material_change_reason(s) supplied with the evidence bundle below) -- reconsider your public_framing, resolved_synthesis_signals, and unresolved_issues in light of that, not just the omitted claim(s) themselves.`,
    `This is your ONE bounded retry -- there will not be another. Every candidate claim_id in the evidence bundle, including the previously-missing one(s), MUST receive exactly one disposition (selected or excluded) this time.`,
  ].join('\n');
}
