/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — deterministic Page Plan validator
   ---------------------------------------------------------------
   PURE. Zero I/O, zero model calls. Generalizes page-builder-
   validator.mjs's core invariants (claim grounding, numeric fidelity,
   scope/limitations protection, no duplicate factual text) to the
   free-form Page Plan shape (education-page-plan-schema.mjs) instead of
   the fixed hair-cycle-shaped bucket taxonomy. This module treats the
   Education Writer's output as an untrusted PROPOSAL, exactly like
   publication-synthesis-validator.mjs treats the Publication Editor's
   output -- nothing here trusts the writer's own confidence, and the
   model-assisted reviewer (education-reviewer-*.mjs) runs ON TOP of
   these checks, never instead of them.
   ═══════════════════════════════════════════════════════════════ */

import { PROSE_UNIT_KINDS, VISUAL_RECOMMENDATIONS, collectAllProseUnits } from './education-page-plan-schema.mjs';

const HAS_DIGIT = /\d/;

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}
function isStringArray(v) {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

/**
 * STEP 1: shape validation. A plan that fails this can never be
 * considered further -- it did not even produce the right structure.
 */
export function validatePagePlanShape(plan) {
  const errors = [];
  if (!plan || typeof plan !== 'object') return { valid: false, errors: ['PLAN_NOT_AN_OBJECT'] };

  for (const key of ['topic_slug', 'cluster', 'route', 'title', 'meta_description', 'h1', 'scope_note']) {
    if (!isNonEmptyString(plan[key])) errors.push(`MISSING_OR_INVALID:${key}`);
  }
  if (!plan.route || !plan.route.startsWith('/')) errors.push('ROUTE_NOT_ABSOLUTE_PATH');

  const checkUnit = (unit, label) => {
    if (!unit || !PROSE_UNIT_KINDS.includes(unit.kind) || !isNonEmptyString(unit.text)
      || !isStringArray(unit.supporting_claim_ids) || !isStringArray(unit.source_statements)) {
      errors.push(`MISSING_OR_INVALID:${label}`);
    }
  };

  checkUnit(plan.answer_summary, 'answer_summary');
  if (!Array.isArray(plan.sections) || plan.sections.length === 0) {
    errors.push('MISSING_OR_INVALID:sections');
  } else {
    plan.sections.forEach((s, i) => {
      if (!s || !isNonEmptyString(s.section_id) || !isNonEmptyString(s.heading) || !Array.isArray(s.units)) {
        errors.push(`MISSING_OR_INVALID:sections[${i}]`);
        return;
      }
      s.units.forEach((u, j) => checkUnit(u, `sections[${i}].units[${j}]`));
    });
  }
  if (!Array.isArray(plan.limitations) || plan.limitations.length === 0) errors.push('MISSING_OR_INVALID:limitations');
  else plan.limitations.forEach((u, i) => checkUnit(u, `limitations[${i}]`));
  if (!Array.isArray(plan.key_takeaways) || plan.key_takeaways.length === 0) errors.push('MISSING_OR_INVALID:key_takeaways');
  else plan.key_takeaways.forEach((u, i) => checkUnit(u, `key_takeaways[${i}]`));

  if (!Array.isArray(plan.sources) || plan.sources.length === 0) errors.push('MISSING_OR_INVALID:sources');
  if (!Array.isArray(plan.related_links)) errors.push('MISSING_OR_INVALID:related_links');

  const vr = plan.visual_recommendation;
  if (!vr || !VISUAL_RECOMMENDATIONS.includes(vr.recommendation) || !isNonEmptyString(vr.rationale)) {
    errors.push('MISSING_OR_INVALID:visual_recommendation');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * STEP 2: semantic (grounding/fidelity) rules. Only meaningful once
 * validatePagePlanShape() has passed.
 *
 * @param {object} plan - a shape-valid Education Page Plan
 * @param {object} clearedSnapshot - the exact fingerprint_input the
 *   plan was supposedly built from: { selected_claim_ids, core_factual_points, limitations, scope_note, source_ids }
 * @param {{expectedTopicSlug?: string, expectedCluster?: string, expectedRoute?: string}} [context]
 *   ROUTE-COLLISION CORRECTION: the plan must never be validated in
 *   isolation from the orchestration decision that produced it -- a
 *   model cannot redirect the page it's building by simply changing its
 *   own topic_slug/cluster/route output. When provided, every field is
 *   required to match EXACTLY; omitting a context field skips that
 *   specific check (used only by tests exercising other rules in
 *   isolation -- the real orchestrator always supplies all three).
 */
export function validatePagePlanSemantics(plan, clearedSnapshot, context = {}) {
  const violations = [];

  if (context.expectedTopicSlug !== undefined && plan.topic_slug !== context.expectedTopicSlug) {
    violations.push(`PLAN_TOPIC_SLUG_MISMATCH:${plan.topic_slug}!=${context.expectedTopicSlug}`);
  }
  if (context.expectedCluster !== undefined && plan.cluster !== context.expectedCluster) {
    violations.push(`PLAN_CLUSTER_MISMATCH:${plan.cluster}!=${context.expectedCluster}`);
  }
  if (context.expectedRoute !== undefined && plan.route !== context.expectedRoute) {
    violations.push(`PLAN_ROUTE_MISMATCH:${plan.route}!=${context.expectedRoute}`);
  }

  const selectedIds = new Set(clearedSnapshot.selected_claim_ids || []);
  const clearedStatements = new Set([
    ...(clearedSnapshot.core_factual_points || []).map((p) => p.statement),
    ...(clearedSnapshot.limitations || []).map((l) => l.statement),
  ]);
  const clearedSourceIds = new Set(clearedSnapshot.source_ids || []);

  const allUnits = collectAllProseUnits(plan);
  const seenText = new Map();

  for (const { location, unit } of allUnits) {
    if (unit.kind === 'FRAMING') {
      // Structural framing rule: a framing unit must carry no claims at
      // all -- whether it ALSO avoids smuggling in unattributed science
      // is a human-editorial-judgment question this deterministic check
      // cannot answer (see AIMT-EDUCATION-EDITORIAL-VOICE-v0.md's
      // "Framing is not a loophole") -- that's exactly what the
      // model-assisted reviewer's NON_FACTUAL/CARRIES_SCIENCE
      // classification exists for (education-reviewer-*.mjs).
      if (unit.supporting_claim_ids.length > 0 || unit.source_statements.length > 0) {
        violations.push(`FRAMING_CARRIES_CLAIM_IDS:${location}`);
      }
      continue;
    }

    // VERBATIM/PARAPHRASE: every supporting claim must be real and
    // actually selected -- never invented, never merely candidate.
    for (const claimId of unit.supporting_claim_ids) {
      if (!selectedIds.has(claimId)) violations.push(`UNGROUNDED_CLAIM_ID:${location}:${claimId}`);
    }
    if (unit.supporting_claim_ids.length === 0) violations.push(`EVIDENCE_UNIT_WITHOUT_SUPPORT:${location}`);

    // Numeric fidelity: any digit-bearing evidence unit must be
    // VERBATIM, and its text must be byte-identical to a real cleared
    // statement -- same UNSUPPORTED_NUMERIC_CLAIM discipline as
    // page-builder-validator.mjs, generalized to this shape.
    if (HAS_DIGIT.test(unit.text)) {
      if (unit.kind !== 'VERBATIM') violations.push(`UNSUPPORTED_NUMERIC_CLAIM:${location}`);
      else if (!clearedStatements.has(unit.text)) violations.push(`VERBATIM_NUMERIC_TEXT_NOT_CLEARED:${location}`);
    }
    if (unit.kind === 'VERBATIM' && !clearedStatements.has(unit.text)) {
      violations.push(`VERBATIM_TEXT_NOT_CLEARED:${location}`);
    }

    // key_takeaways are an explicit, intentional recap (same exemption
    // as page-builder-content-units.mjs#findDuplicateFactualText) -- a
    // takeaway repeating a sentence already used elsewhere on the page
    // is by design, not drift.
    if (!location.startsWith('key_takeaway:')) {
      if (seenText.has(unit.text)) violations.push(`DUPLICATE_FACTUAL_TEXT:${location}==${seenText.get(unit.text)}`);
      else seenText.set(unit.text, location);
    }
  }

  // scope_note is protected, byte-for-byte, exactly like the existing
  // hand-authored pages -- "do not soften, hide, or creatively rewrite
  // away" applies to a model-authored page identically.
  // The real cleared snapshot (fingerprint_input, see
  // publication-clearance-fingerprint.mjs#buildFingerprintInput) nests
  // scope_note under scope_language, not as a flat top-level field --
  // matching that exact real shape here, not a simplified guess at it.
  const clearedScopeNote = clearedSnapshot.scope_language ? clearedSnapshot.scope_language.scope_note : clearedSnapshot.scope_note;
  if (plan.scope_note !== clearedScopeNote) violations.push('SCOPE_NOTE_NOT_PRESERVED');

  // SOURCE AUTHORITY CORRECTION: the rendered source_id set must equal
  // the cleared source_id set EXACTLY -- not merely "every rendered
  // source is cleared" (UNCLEARED_SOURCE_RENDERED, extras) but ALSO
  // "every cleared source is rendered" (MISSING_CLEARED_SOURCE, no
  // silent drops). In the real pipeline `plan.sources` is now always
  // built deterministically from clearedSnapshot itself (see
  // education-source-authority.mjs), so this should be structurally
  // unreachable -- it is kept as an independent, defense-in-depth check
  // that does not trust that every caller went through that builder.
  const renderedSourceIds = new Set();
  for (const s of plan.sources) {
    renderedSourceIds.add(s.source_id);
    if (!clearedSourceIds.has(s.source_id)) violations.push(`UNCLEARED_SOURCE_RENDERED:${s.source_id}`);
  }
  for (const sourceId of clearedSourceIds) {
    if (!renderedSourceIds.has(sourceId)) violations.push(`MISSING_CLEARED_SOURCE:${sourceId}`);
  }

  // RELATED-LINK AUTHORITY CORRECTION: every rendered href must be an
  // internal AIMT route (absolute path, no scheme/host) -- never an
  // arbitrary external destination. Structurally, related_links is now
  // always attached by the orchestrator from trusted route data (see
  // education-related-links.mjs), never authored by the model at all;
  // this is the same kind of defense-in-depth backstop as the source
  // check above, not the primary mechanism.
  for (const link of plan.related_links) {
    if (!link || typeof link.href !== 'string' || !link.href.startsWith('/')) {
      violations.push(`RELATED_LINK_NOT_INTERNAL:${link && link.href}`);
    }
  }

  return { valid: violations.length === 0, violations };
}

/**
 * Full validation: shape, then (only if shape passes) semantics.
 * @param {object} plan
 * @param {object} clearedSnapshot
 * @param {{expectedTopicSlug?: string, expectedCluster?: string, expectedRoute?: string}} [context]
 */
export function validateEducationPagePlan(plan, clearedSnapshot, context = {}) {
  const shape = validatePagePlanShape(plan);
  if (!shape.valid) return { valid: false, shapeValid: false, violations: shape.errors };
  const semantics = validatePagePlanSemantics(plan, clearedSnapshot, context);
  return { valid: semantics.valid, shapeValid: true, violations: semantics.violations };
}
