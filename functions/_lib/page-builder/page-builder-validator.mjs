/* ═══════════════════════════════════════════════════════════════
   AIMT Page Builder v1 — deterministic post-draft validator
   ---------------------------------------------------------------
   PURE. No I/O, no AI call. A draft is UNTRUSTED until this validator
   returns valid=true -- nothing downstream (rendering, SEO/JSON-LD
   generation, or any future write path) should treat an unvalidated
   draft as safe to use.

   Every rule below is a real, syntactic/structural check against the
   draft and the cleared snapshot it claims to be built from -- never an
   LLM judgment call. That is deliberate: this is the layer that must
   keep working even if a future prose-polish pass (see page-builder-
   fidelity.mjs) introduces paraphrased text, so it cannot itself depend
   on trusting the model that produced the draft.
   ═══════════════════════════════════════════════════════════════ */

const TREATMENT_DRIFT_TERMS = Object.freeze([
  'minoxidil', 'prp', 'platelet-rich plasma', 'lllt', 'low-level laser',
  'prescribe', 'prescription', 'diagnos', 'treatment efficacy', 'therapeutic dose',
  'medication guidance', 'disease management', 'cure', 'clinically indicated',
]);

const TRANSACTIONAL_TERMS = Object.freeze([
  'enroll now', 'buy now', 'sign up today', 'purchase', 'add to cart',
  'checkout', '$597', 'limited time', 'certification price',
]);

function allParagraphs(draft) {
  const out = [];
  for (const section of draft.sections) {
    for (const p of section.paragraphs) out.push({ ...p, section_id: section.section_id });
  }
  return out;
}

function containsAny(text, terms) {
  const lower = text.toLowerCase();
  return terms.filter((t) => lower.includes(t));
}

const HAS_DIGIT = /\d/;

/**
 * @param {object} draft - page-builder-draft.mjs#buildPageDraft() output
 * @param {object} snapshot - the cleared snapshot the draft claims to be built from
 * @param {{integrityResult?: {valid: boolean, violations: string[]}}} context
 * @returns {{valid: boolean, violations: string[]}}
 */
export function validatePageDraft(draft, snapshot, context = {}) {
  const violations = [];

  // Rule 13: stored clearance integrity must have already been verified
  // (by the loader, before the draft was ever built) and must have
  // passed. The validator does not re-derive the hash itself -- it has
  // no access to the raw production row here, by design (the draft
  // builder only ever sees the extracted ten-field snapshot) -- but it
  // refuses to call anything downstream trustworthy without proof that
  // check already ran and passed.
  if (!context.integrityResult) {
    violations.push('MISSING_INTEGRITY_CONTEXT');
  } else if (context.integrityResult.valid !== true) {
    violations.push('STALE_OR_FAILED_INTEGRITY');
  }

  const allowedClaimIds = new Set(snapshot.selected_claim_ids);
  const allowedSourceIds = new Set(snapshot.source_ids);
  const paragraphs = allParagraphs(draft);

  // Rules 1-2: every supporting_claim_id must belong to the cleared
  // selected_claim_ids. Page Builder's snapshot structurally never
  // contains excluded/unselected claim IDs at all (page-builder-loader.mjs
  // only extracts the ten fingerprint_input fields, which do not include
  // excluded_claim_ids) -- so an "excluded claim used as support" can
  // only happen if a claim ID appearing in a paragraph is NOT in
  // selected_claim_ids, which this same check already catches.
  const unsupportedClaimIds = new Set();
  for (const p of paragraphs) {
    for (const claimId of p.supporting_claim_ids || []) {
      if (!allowedClaimIds.has(claimId)) unsupportedClaimIds.add(claimId);
    }
  }
  if (unsupportedClaimIds.size > 0) {
    violations.push(`UNSUPPORTED_CLAIM_ID:${[...unsupportedClaimIds].sort().join(',')}`);
  }

  // Rule 3: every FACTUAL paragraph (is_framing !== true) must carry at
  // least one supporting claim ID.
  const unsupportedFactualParagraphs = paragraphs.filter((p) => !p.is_framing && (!p.supporting_claim_ids || p.supporting_claim_ids.length === 0));
  if (unsupportedFactualParagraphs.length > 0) {
    violations.push(`FACTUAL_PARAGRAPH_MISSING_SUPPORT:${unsupportedFactualParagraphs.map((p) => p.section_id).join(',')}`);
  }

  // Rule 4: every source the draft actually cites must exist in the
  // cleared source_ids / citation_map.
  const unsupportedSourceIds = draft.sources
    .map((s) => s.source_id)
    .filter((id) => !allowedSourceIds.has(id) || !(id in snapshot.citation_map));
  if (unsupportedSourceIds.length > 0) {
    violations.push(`UNSUPPORTED_SOURCE:${unsupportedSourceIds.join(',')}`);
  }

  // Rule 5: every cleared limitation must be preserved verbatim
  // somewhere in draft.limitations -- exact statement-set match (order
  // independent).
  const draftLimitationTexts = new Set(draft.limitations.map((l) => l.text));
  const missingLimitations = snapshot.limitations.filter((l) => !draftLimitationTexts.has(l.statement));
  if (missingLimitations.length > 0) {
    violations.push(`MISSING_REQUIRED_LIMITATION:${missingLimitations.length}`);
  }

  // Rule 6: scope language (the scope_note actually shown to readers via
  // meta_description) must be preserved verbatim, not paraphrased.
  if (draft.seo.meta_description !== snapshot.scope_language.scope_note) {
    violations.push('SCOPE_LANGUAGE_NOT_PRESERVED');
  }

  // Rule 7: fail closed on HIGH risk, independent of any upstream check
  // -- Page Builder must never treat a HIGH-risk snapshot as draftable
  // even if it somehow reached this far.
  if (snapshot.risk_tier === 'HIGH') {
    violations.push('HIGH_RISK_MATERIAL_INTRODUCED');
  }

  // Rule 8: the draft's route must be the one this topic is actually
  // registered for -- never a route the caller merely asserted.
  if (draft.topic_slug !== snapshot.topic_slug) {
    violations.push('ROUTE_MISMATCH:topic_slug_mismatch');
  }
  if (!draft.route || typeof draft.route !== 'string' || !draft.route.startsWith('/education/')) {
    violations.push('ROUTE_MISMATCH:not_an_education_route');
  }

  // Rule 9: no transactional/course-sales language inside the
  // INFORMATIONAL page's own body copy (related_links referencing the
  // certification page by label/href are fine -- that's a distinct,
  // clearly-labeled related link, not body prose folding the two
  // intents together).
  const transactionalHits = [];
  for (const p of paragraphs) {
    const hits = containsAny(p.text, TRANSACTIONAL_TERMS);
    if (hits.length) transactionalHits.push(...hits);
  }
  if (transactionalHits.length > 0) {
    violations.push(`TRANSACTIONAL_CANNIBALIZATION:${[...new Set(transactionalHits)].join(',')}`);
  }

  // Rule 10: a numeric claim (contains a digit) is only trustworthy if
  // its paragraph text is an EXACT verbatim match to a cleared
  // core_factual_point or limitation statement -- proving the number
  // itself was never altered, rounded differently, or invented during
  // drafting.
  const clearedStatements = new Set([
    ...snapshot.core_factual_points.map((p) => p.statement),
    ...snapshot.limitations.map((l) => l.statement),
  ]);
  const unverifiedNumericParagraphs = paragraphs.filter((p) => !p.is_framing && HAS_DIGIT.test(p.text) && !clearedStatements.has(p.text));
  if (unverifiedNumericParagraphs.length > 0) {
    violations.push(`UNSUPPORTED_NUMERIC_CLAIM:${unverifiedNumericParagraphs.map((p) => p.section_id).join(',')}`);
  }

  // Rule 11: treatment/diagnosis/medication-guidance drift, checked
  // against the whole draft (every paragraph, including framing and
  // takeaways) -- these terms should never appear anywhere on an
  // informational normal-cycle-education page regardless of section.
  const treatmentHits = [];
  for (const p of paragraphs) {
    treatmentHits.push(...containsAny(p.text, TREATMENT_DRIFT_TERMS));
  }
  for (const t of draft.key_takeaways) treatmentHits.push(...containsAny(t.text, TREATMENT_DRIFT_TERMS));
  if (treatmentHits.length > 0) {
    violations.push(`TREATMENT_OR_DIAGNOSIS_DRIFT:${[...new Set(treatmentHits)].join(',')}`);
  }

  // Rule 12: no code/content path may introduce a claim-level
  // AIMT_APPROVED dependency -- this whole draft is built from a
  // page-level AUTO_READY/HUMAN_APPROVED clearance, which is already a
  // sufficient, independent basis for the evidence it uses (see
  // docs/research/AIMT-Automated-Publication-Clearance.md's corrected
  // Page Builder contract). A literal appearance of the string
  // anywhere in the serialized draft would mean something tried to
  // reintroduce that dependency.
  if (JSON.stringify(draft).includes('AIMT_APPROVED')) {
    violations.push('AIMT_APPROVED_DEPENDENCY_INTRODUCED');
  }

  return { valid: violations.length === 0, violations };
}
