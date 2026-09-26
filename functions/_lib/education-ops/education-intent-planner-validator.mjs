/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — deterministic intent-plan validator
   ---------------------------------------------------------------
   PURE. The planner is choosing PAGE SCOPE, never writing evidence --
   this validator mechanically enforces that boundary. A plan that
   requests unsupported scope (invents a number/statistic, echoes the
   wrong topic_slug, produces an empty scope, or proposes a route
   outside the requested cluster) fails closed to HUMAN_REVIEW rather
   than being silently accepted -- see the originating task's explicit
   "If the planner requests unsupported scope: FAIL / HUMAN_REVIEW."
   ═══════════════════════════════════════════════════════════════ */

const HAS_DIGIT = /\d/;

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}
function isNonEmptyStringArray(v) {
  return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string' && x.trim().length > 0);
}

export function validateIntentPlanShape(plan) {
  const errors = [];
  if (!plan || typeof plan !== 'object') return { valid: false, errors: ['PLAN_NOT_AN_OBJECT'] };
  for (const key of ['topic_slug', 'page_concept', 'public_intent', 'route_slug', 'practitioner_relevance', 'cluster', 'risk_context']) {
    if (!isNonEmptyString(plan[key])) errors.push(`MISSING_OR_INVALID:${key}`);
  }
  if (!isNonEmptyStringArray(plan.in_scope_concepts)) errors.push('MISSING_OR_INVALID:in_scope_concepts');
  if (!Array.isArray(plan.out_of_scope_concepts)) errors.push('MISSING_OR_INVALID:out_of_scope_concepts');
  return { valid: errors.length === 0, errors };
}

/**
 * @param {object} plan - shape-valid intent plan
 * @param {{expectedTopicSlug: string, expectedCluster: string, routePrefix: string}} context
 */
export function validateIntentPlanSemantics(plan, context) {
  const violations = [];

  if (plan.topic_slug !== context.expectedTopicSlug) violations.push('TOPIC_SLUG_MISMATCH');
  if (plan.cluster !== context.expectedCluster) violations.push('CLUSTER_MISMATCH');

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(plan.route_slug)) violations.push('ROUTE_SLUG_NOT_URL_SAFE');

  // Never state a specific number/percentage/statistic in a scope
  // description -- that is evidence content this planner was never
  // given (candidate inventory only, never claim text) and must not
  // invent. A digit anywhere in these fields is treated as unsupported
  // scope, fails to HUMAN_REVIEW.
  const noDigitFields = [plan.public_intent, plan.practitioner_relevance, ...plan.in_scope_concepts, ...plan.out_of_scope_concepts];
  if (noDigitFields.some((s) => HAS_DIGIT.test(s))) violations.push('UNSUPPORTED_SCOPE_CONTAINS_NUMERIC_CLAIM');

  // Out-of-scope must explicitly exclude diagnosis and treatment --
  // the same non-negotiable boundary every hand-registered intent to
  // date has carried (publication-page-intent.mjs).
  const outOfScopeText = plan.out_of_scope_concepts.join(' ').toLowerCase();
  if (!outOfScopeText.includes('diagnos')) violations.push('OUT_OF_SCOPE_MISSING_DIAGNOSIS_EXCLUSION');
  if (!outOfScopeText.includes('treatment') && !outOfScopeText.includes('medication') && !outOfScopeText.includes('prescrib')) {
    violations.push('OUT_OF_SCOPE_MISSING_TREATMENT_EXCLUSION');
  }

  return { valid: violations.length === 0, violations };
}

export function validateIntentPlan(plan, context) {
  const shape = validateIntentPlanShape(plan);
  if (!shape.valid) return { valid: false, shapeValid: false, violations: shape.errors };
  const semantics = validateIntentPlanSemantics(plan, context);
  return { valid: semantics.valid, shapeValid: true, violations: semantics.violations };
}
