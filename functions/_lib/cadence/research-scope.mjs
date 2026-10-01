// Ask Cadence — narrow research-augmentation SCOPE (SHADOW STAGE ONLY).
//
// STATUS: NOT WIRED. Nothing in the live Ask Cadence path imports this
// module (enforced by the shadow judge test suite).
//
// Pure, deterministic router written and frozen BEFORE any real Ask
// Cadence question was read (commit message records this). It decides
// whether a question belongs to one of the two families proposed for a
// narrow activation after hold-out v5:
//   A  ingredient / product safety and contact reactions
//   B  evidence about a specifically named treatment, supplement or practice
// Everything else is OUT of scope (research stays off), including the v5
// families that missed the bar: scalp sensation, infection / referral,
// rosacea, systemic/biologic therapy, sex comparisons, broad mechanism and
// traction prognosis. High-stakes questions are always out of scope.
//
// It runs AFTER decideResearchRetrieval(): an ineligible (checkpoint /
// Module 12) or not-useful decision is never in scope.

const EXCLUDED_CONCEPTS = Object.freeze([
  'scalp-pain', 'scalp-sensation', 'infection-signs', 'folliculitis', 'tinea', 'rosacea', 'systemic-therapy', 'heat-exposure', 'contraindications',
]);

// Named products / ingredients whose SAFETY is Family A.
const PRODUCT_CONCEPTS = Object.freeze([
  'essential-oils', 'surfactants', 'conditioning-agents', 'minoxidil', 'antifungals', 'other-actives', 'antiandrogens', 'topical-therapy',
]);

// Named interventions / practices whose EVIDENCE is Family B.
const INTERVENTION_CONCEPTS = Object.freeze([
  'minoxidil', 'antiandrogens', 'antifungals', 'other-actives', 'procedures-devices', 'massage-circulation', 'essential-oils', 'topical-therapy',
]);
// Supplements are named inside the broader nutrition-stress concept.
const RE_NAMED_SUPPLEMENT = /\b(biotin|iron|ferritin|zinc|vitamin\s?[a-z0-9]*|supplements?|supplementation)\b/i;

const RE_BOTH_SEXES = (q) => /\b(men|man|male|males)\b/i.test(q) && /\b(women|woman|female|females)\b/i.test(q);
const EVIDENCE_INTENTS = Object.freeze(['efficacy', 'skeptical', 'comparison', 'treatment', 'safety', 'parameter', 'prevalence', 'recurrence']);

/**
 * Pure.
 * @param {string} question
 * @param {{eligible:boolean, retrieve:boolean, concepts:string[], intents:string[], signals:object}} decision
 *        output of decideResearchRetrieval()
 * @returns {{family: 'A'|'B'|null, reason: string}}
 */
export function classifyResearchScope(question, decision) {
  const q = typeof question === 'string' ? question : '';
  if (!decision || decision.eligible !== true) return { family: null, reason: 'ineligible' };
  if (decision.retrieve !== true) return { family: null, reason: 'decision_off' };
  const concepts = Array.isArray(decision.concepts) ? decision.concepts : [];
  const intents = Array.isArray(decision.intents) ? decision.intents : [];
  const signals = decision.signals || {};
  if (signals.high_stakes) return { family: null, reason: 'high_stakes' };
  const excluded = concepts.find((c) => EXCLUDED_CONCEPTS.includes(c));
  if (excluded) return { family: null, reason: `excluded_concept:${excluded}` };
  if (RE_BOTH_SEXES(q)) return { family: null, reason: 'sex_comparison' };
  if (concepts.includes('traction') && intents.includes('reversibility')) return { family: null, reason: 'traction_prognosis' };

  const namedProduct = concepts.some((c) => PRODUCT_CONCEPTS.includes(c));
  const namedSupplement = concepts.includes('nutrition-stress') && RE_NAMED_SUPPLEMENT.test(q);
  const namedIntervention = concepts.some((c) => INTERVENTION_CONCEPTS.includes(c)) || namedSupplement;

  // A: contact reactions / allergy / irritation, or the safety / side
  // effects (incl. itching) of a named product or ingredient.
  if (concepts.includes('scalp-reactivity')) return { family: 'A', reason: 'contact_reaction' };
  if ((namedProduct || namedSupplement) && (intents.includes('safety') || concepts.includes('scalp-itch'))) return { family: 'A', reason: 'product_safety' };

  // B: evidence about a named intervention, with an evidence-type ask.
  if (namedIntervention && (intents.some((i) => EVIDENCE_INTENTS.includes(i)) || signals.research_cue)) return { family: 'B', reason: 'named_intervention_evidence' };

  return { family: null, reason: namedIntervention ? 'named_intervention_without_evidence_ask' : 'no_family' };
}

export const RESEARCH_SCOPE_FAMILIES = Object.freeze({
  A: 'Ingredient / product safety and contact reactions',
  B: 'Evidence about a specifically named treatment, supplement or practice',
});
