/* ═══════════════════════════════════════════════════════════════
   AIMT Page Builder v1 — deterministic post-draft validator
   ---------------------------------------------------------------
   PURE. No I/O, no AI call. A draft is UNTRUSTED until this validator
   returns valid=true -- nothing downstream should treat an unvalidated
   draft as safe to use.

   CORRECTIONS (this revision), each fixing a real gap found in review:
   1. Route/page-identity checks used to only verify draft.route STARTS
      WITH "/education/" -- a draft for the wrong education page would
      have passed. Now checks the draft's route/canonical_url/h1/
      topic_slug against the route registry and the snapshot itself,
      exactly.
   2. Claim-support/fidelity/numeric/treatment-drift checks used to only
      inspect draft.sections[] paragraphs -- answer_summary and
      key_takeaways (both rendered as visible factual content) were a
      blind spot. Now every check runs over
      page-builder-content-units.mjs#collectRenderedFactualUnits(), the
      single shared definition of "every rendered factual unit."
   3. New: duplicate exact-text detection across answer_summary + body
      sections (key_takeaways exempt by design -- see
      page-builder-draft.mjs).
   4. New: the cleared scope note is now its own draft field
      (draft.scope_note) and is required to match the snapshot exactly,
      independent of whatever the SEO meta description says -- the two
      no longer have to be equal, but meta_description gets its own
      safety checks (length, no numerics, no treatment/diagnosis
      language, no transactional language).

   Every rule below is a real structural/syntactic check -- never an
   LLM judgment call.
   ═══════════════════════════════════════════════════════════════ */

import { getPageBuilderRoute, getCanonicalUrl } from './page-builder-route-registry.mjs';
import { collectRenderedFactualUnits, computeRenderedSupportClaimIds, findDuplicateFactualText } from './page-builder-content-units.mjs';

const TREATMENT_DRIFT_TERMS = Object.freeze([
  'minoxidil', 'prp', 'platelet-rich plasma', 'lllt', 'low-level laser',
  'prescribe', 'prescription', 'diagnos', 'treatment efficacy', 'therapeutic dose',
  'medication guidance', 'disease management', 'cure', 'clinically indicated',
]);

const TRANSACTIONAL_TERMS = Object.freeze([
  'enroll now', 'buy now', 'sign up today', 'purchase', 'add to cart',
  'checkout', '$597', 'limited time', 'certification price',
]);

const META_DESCRIPTION_MAX_LENGTH = 160;

function containsAny(text, terms) {
  const lower = text.toLowerCase();
  return terms.filter((t) => lower.includes(t));
}

const HAS_DIGIT = /\d/;

/**
 * @param {object} draft - page-builder-draft.mjs#buildPageDraft() output
 * @param {object} snapshot - the cleared snapshot the draft claims to be built from
 * @param {{integrityResult?: {valid: boolean, violations: string[]}}} context
 * @returns {{valid: boolean, violations: string[], report: object}}
 */
export function validatePageDraft(draft, snapshot, context = {}) {
  const violations = [];

  // Rule: stored clearance integrity must have already been verified
  // and must have passed.
  if (!context.integrityResult) {
    violations.push('MISSING_INTEGRITY_CONTEXT');
  } else if (context.integrityResult.valid !== true) {
    violations.push('STALE_OR_FAILED_INTEGRITY');
  }

  const allowedClaimIds = new Set(snapshot.selected_claim_ids);
  const allowedSourceIds = new Set(snapshot.source_ids);
  const units = collectRenderedFactualUnits(draft);
  const factualUnits = units.filter((u) => !u.is_framing);

  // Rules 1-2: every supporting_claim_id anywhere in RENDERED content
  // (answer_summary, section paragraphs, key_takeaways -- not just
  // section paragraphs) must belong to the cleared selected_claim_ids.
  const unsupportedClaimIds = new Set();
  for (const u of factualUnits) {
    for (const claimId of u.supporting_claim_ids) {
      if (!allowedClaimIds.has(claimId)) unsupportedClaimIds.add(claimId);
    }
  }
  if (unsupportedClaimIds.size > 0) {
    violations.push(`UNSUPPORTED_CLAIM_ID:${[...unsupportedClaimIds].sort().join(',')}`);
  }

  // Rule 3: every rendered factual unit must carry at least one
  // supporting claim ID.
  const unsupportedFactualUnits = factualUnits.filter((u) => u.supporting_claim_ids.length === 0);
  if (unsupportedFactualUnits.length > 0) {
    violations.push(`FACTUAL_PARAGRAPH_MISSING_SUPPORT:${unsupportedFactualUnits.map((u) => u.unit_id).join(',')}`);
  }

  // Rule 4: every source the draft actually cites must exist in the
  // cleared source_ids / citation_map.
  const unsupportedSourceIds = draft.sources
    .map((s) => s.source_id)
    .filter((id) => !allowedSourceIds.has(id) || !(id in snapshot.citation_map));
  if (unsupportedSourceIds.length > 0) {
    violations.push(`UNSUPPORTED_SOURCE:${unsupportedSourceIds.join(',')}`);
  }

  // Rule 5: every cleared limitation must be preserved verbatim.
  const draftLimitationTexts = new Set(draft.limitations.map((l) => l.text));
  const missingLimitations = snapshot.limitations.filter((l) => !draftLimitationTexts.has(l.statement));
  if (missingLimitations.length > 0) {
    violations.push(`MISSING_REQUIRED_LIMITATION:${missingLimitations.length}`);
  }

  // Rule 6 (corrected this revision): the cleared scope note must be
  // preserved verbatim in its OWN field -- no longer coupled to
  // seo.meta_description, which is separate presentation copy.
  const scopeNotePreserved = draft.scope_note === snapshot.scope_language.scope_note;
  if (!scopeNotePreserved) {
    violations.push('SCOPE_NOTE_NOT_PRESERVED');
  }

  // Rule 6b (new this revision): the SEO meta description is framing
  // copy, not a claim -- it gets its own safety checks instead of an
  // equality requirement against the scope note.
  if (typeof draft.seo.meta_description !== 'string' || draft.seo.meta_description.length === 0) {
    violations.push('META_DESCRIPTION_MISSING');
  } else {
    if (draft.seo.meta_description.length > META_DESCRIPTION_MAX_LENGTH) {
      violations.push(`META_DESCRIPTION_TOO_LONG:${draft.seo.meta_description.length}`);
    }
    if (HAS_DIGIT.test(draft.seo.meta_description)) {
      violations.push('META_DESCRIPTION_UNSUPPORTED_NUMERIC');
    }
    const metaTreatmentHits = containsAny(draft.seo.meta_description, TREATMENT_DRIFT_TERMS);
    if (metaTreatmentHits.length) violations.push(`META_DESCRIPTION_TREATMENT_DRIFT:${metaTreatmentHits.join(',')}`);
    const metaTransactionalHits = containsAny(draft.seo.meta_description, TRANSACTIONAL_TERMS);
    if (metaTransactionalHits.length) violations.push(`META_DESCRIPTION_TRANSACTIONAL:${metaTransactionalHits.join(',')}`);
  }

  // Rule 7: fail closed on HIGH risk, independent of any upstream check.
  if (snapshot.risk_tier === 'HIGH') {
    violations.push('HIGH_RISK_MATERIAL_INTRODUCED');
  }

  // Rule 8 (corrected this revision): EXACT route/page-identity
  // enforcement against the route registry and the snapshot itself --
  // "starts with /education/" was not sufficient; a draft for the wrong
  // education page must fail.
  let routeOk = true;
  let canonicalOk = true;
  let h1Ok = true;
  let topicSlugOk = true;
  const registeredRoute = getPageBuilderRoute(snapshot.topic_slug);
  if (draft.topic_slug !== snapshot.topic_slug) {
    violations.push('TOPIC_SLUG_MISMATCH');
    topicSlugOk = false;
  }
  if (draft.route !== registeredRoute.route) {
    violations.push(`ROUTE_MISMATCH:expected_${registeredRoute.route}`);
    routeOk = false;
  }
  const expectedCanonical = getCanonicalUrl(snapshot.topic_slug);
  if (draft.seo.canonical_url !== expectedCanonical) {
    violations.push(`CANONICAL_URL_MISMATCH:expected_${expectedCanonical}`);
    canonicalOk = false;
  }
  if (draft.seo.h1 !== snapshot.page_concept) {
    violations.push('H1_PAGE_CONCEPT_MISMATCH');
    h1Ok = false;
  }

  // Rule 9: no transactional/course-sales language inside rendered
  // factual content.
  const transactionalHits = [];
  for (const u of units) transactionalHits.push(...containsAny(u.text, TRANSACTIONAL_TERMS));
  if (transactionalHits.length > 0) {
    violations.push(`TRANSACTIONAL_CANNIBALIZATION:${[...new Set(transactionalHits)].join(',')}`);
  }

  // Rule 10: a numeric claim (contains a digit) is only trustworthy if
  // its unit's text is an EXACT verbatim match to a cleared
  // core_factual_point or limitation statement. Now checked across ALL
  // rendered factual units, not just section paragraphs.
  const clearedStatements = new Set([
    ...snapshot.core_factual_points.map((p) => p.statement),
    ...snapshot.limitations.map((l) => l.statement),
  ]);
  const unverifiedNumericUnits = factualUnits.filter((u) => HAS_DIGIT.test(u.text) && !clearedStatements.has(u.text));
  if (unverifiedNumericUnits.length > 0) {
    violations.push(`UNSUPPORTED_NUMERIC_CLAIM:${unverifiedNumericUnits.map((u) => u.unit_id).join(',')}`);
  }

  // Rule 11: treatment/diagnosis/medication-guidance drift, checked
  // against every rendered unit (framing included -- these terms should
  // never appear anywhere on this page regardless of section).
  const treatmentHits = [];
  for (const u of units) treatmentHits.push(...containsAny(u.text, TREATMENT_DRIFT_TERMS));
  if (treatmentHits.length > 0) {
    violations.push(`TREATMENT_OR_DIAGNOSIS_DRIFT:${[...new Set(treatmentHits)].join(',')}`);
  }

  // Rule 12: no AIMT_APPROVED dependency anywhere in the serialized draft.
  if (JSON.stringify(draft).includes('AIMT_APPROVED')) {
    violations.push('AIMT_APPROVED_DEPENDENCY_INTRODUCED');
  }

  // Rule 13 (new this revision): no exact-text duplicate across
  // answer_summary + body sections.
  const duplicates = findDuplicateFactualText(draft);
  if (duplicates.length > 0) {
    violations.push(`DUPLICATE_FACTUAL_TEXT:${duplicates.length}`);
  }

  const renderedSupportClaimIds = computeRenderedSupportClaimIds(draft);

  return {
    valid: violations.length === 0,
    violations,
    report: {
      rendered_support_claim_ids: renderedSupportClaimIds,
      rendered_support_claim_count: renderedSupportClaimIds.length,
      selected_claim_count: snapshot.selected_claim_ids.length,
      duplicate_factual_text: duplicates,
      route_check: { route_ok: routeOk, canonical_ok: canonicalOk, h1_ok: h1Ok, topic_slug_ok: topicSlugOk },
      scope_note_preserved: scopeNotePreserved,
    },
  };
}
