// AIMT Critical Competency Domain configuration — VERSIONED CONFIGURATION.
//
// Per docs/course-audit/00-aimt-certification-assessment-standard.md Section 5
// and docs/course-audit/modules/module-12-final-exam-raw-blueprint.md Part 1A.
//
// A domain gate does NOT fail from a single missed multiple-choice question.
// It fails only via:
//   TYPE A — an evaluator (case/interview rubric) explicitly flags a criterion
//            as "explicitUnsafe" for that domain on a specific evidence point.
//   TYPE B — a "meaningful repeated pattern": at least `typeBThreshold`
//            independent evidence points share the same `patternTag` for that
//            domain.
//
// This file is the single source of truth for domain identity and gate
// thresholds. Do not scatter one-off domain-gating conditionals elsewhere —
// evaluate gates only through evaluateCriticalDomains() in scoring.mjs, which
// reads this config.

export const CRITICAL_DOMAIN_CONFIG_VERSION = 'headspa-critical-domains-v1';

/**
 * @typedef {Object} CriticalDomain
 * @property {string} id             - Stable domain ID, e.g. "D1".
 * @property {string} name           - Student-facing-safe short name.
 * @property {string} description    - Internal description of what the domain covers.
 * @property {number} typeBThreshold - Minimum count of independent same-pattern
 *                                     evidence points required to trigger a
 *                                     Type B (repeated-pattern) gate failure.
 */

/** @type {CriticalDomain[]} */
export const HEAD_SPA_CRITICAL_DOMAINS = [
  {
    id: 'D1',
    name: 'Professional Scope / Diagnosis / Referral',
    description:
      'Observation vs. diagnosis; not confirming named medical conditions; ' +
      'knowing when a finding requires referral; AI/device output not ' +
      'expanding professional authority; certification not expanding legal scope.',
    typeBThreshold: 2,
  },
  {
    id: 'D2',
    name: 'Contraindication / Client Safety Judgment',
    description:
      'Stop-and-refer findings; safety outranking client preference; client ' +
      'comfort never overriding a visible contraindication; water-temperature ' +
      'confirmation; ordinary discomfort vs. medical-emergency escalation.',
    typeBThreshold: 2,
  },
  {
    id: 'D3',
    name: 'Consent / Touch / Bodywork Authority',
    description:
      'Explicit consent before touch; privacy/autonomy; scope/training/consent ' +
      'requirements for neck, shoulder, hand, or forearm bodywork; a client ' +
      'request never substituting for professional authorization or prior consent.',
    typeBThreshold: 2,
  },
  {
    id: 'D4',
    name: 'Sanitation / Process Integrity',
    description:
      'Clean vs. disinfect vs. reset distinctions; correct item-to-process ' +
      'reasoning; required contact/process time never shortened; contaminated ' +
      'equipment properly reprocessed; recognizing when routine reset is not enough.',
    typeBThreshold: 2,
  },
];

export function getCriticalDomainConfig(domainId) {
  return HEAD_SPA_CRITICAL_DOMAINS.find((d) => d.id === domainId) || null;
}

export function isKnownDomainId(domainId) {
  return HEAD_SPA_CRITICAL_DOMAINS.some((d) => d.id === domainId);
}

// Required per-attempt coverage, per certification standard Section 5.3 / 13.
export const CRITICAL_DOMAIN_COVERAGE_RULE = {
  minEvidencePointsPerDomain: 2,
  minNonPartOneEvidencePointsPerDomain: 1, // must come from Part II or Part III
};
