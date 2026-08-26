// AIMT Head Spa — Module 12 Final Certification Assessment configuration.
// VERSIONED CONFIGURATION — see docs/course-audit/00-aimt-certification-assessment-standard.md
// and docs/course-audit/modules/module-12-final-exam-raw-blueprint.md.
//
// Historical attempts store the assessmentVersion/standardVersion/bankVersion
// that governed them (see supabase/migrations/*_create_certification_assessment.sql).
// A future revision must be added as a NEW entry in CONFIG_VERSIONS, never by
// mutating an existing version's numbers in place — that would silently rewrite
// what an earlier student was actually held to (standard Section 15).

import { HEAD_SPA_CRITICAL_DOMAINS, CRITICAL_DOMAIN_CONFIG_VERSION, CRITICAL_DOMAIN_COVERAGE_RULE } from './critical-domains.mjs';

export const STANDARD_VERSION_V1 = 'aimt-certification-standard-v1';
export const ASSESSMENT_VERSION_V1 = 'headspa-fe-assessment-v1';

// The bank version is separate from the assessment/standard version because
// the question/case/interview bank can grow (e.g. 80 -> 120 knowledge items)
// without changing the scoring/weighting/gating architecture itself.
export const BANK_VERSION_PENDING = 'headspa-fe-bank-v0-content-pending';

/**
 * @typedef {Object} AssessmentConfig
 * @property {string} courseSlug
 * @property {string} assessmentVersion
 * @property {string} standardVersion
 * @property {string} bankVersion
 * @property {string} criticalDomainConfigVersion
 * @property {{knowledge:number, appliedCases:number, interview:number}} weights
 * @property {{knowledge:number, appliedCases:number, interview:number, overall:number}} minimums
 * @property {import('./critical-domains.mjs').CriticalDomain[]} criticalDomains
 * @property {{foundational:number, applied:number, advancedSynthesis:number}} difficultyTargets
 * @property {number[]} requiredModuleCoverage
 * @property {Object} partI
 * @property {Object} partII
 * @property {Object} partIII
 * @property {Object} criticalDomainCoverage
 * @property {Object} attemptRules
 * @property {Object} randomizationRules
 */

/** @type {AssessmentConfig} */
const HEAD_SPA_ASSESSMENT_CONFIG_V1 = Object.freeze({
  courseSlug: 'headspa-mastery',
  assessmentVersion: ASSESSMENT_VERSION_V1,
  standardVersion: STANDARD_VERSION_V1,
  bankVersion: BANK_VERSION_PENDING,
  criticalDomainConfigVersion: CRITICAL_DOMAIN_CONFIG_VERSION,

  // Section 2 of the certification standard.
  weights: Object.freeze({
    knowledge: 0.5,
    appliedCases: 0.3,
    interview: 0.2,
  }),

  // Section 4 — independent gates, not compensating inputs to one average.
  minimums: Object.freeze({
    knowledge: 0.75,
    appliedCases: 0.75,
    interview: 0.8,
    overall: 0.8,
  }),

  criticalDomains: HEAD_SPA_CRITICAL_DOMAINS,
  criticalDomainCoverage: Object.freeze({ ...CRITICAL_DOMAIN_COVERAGE_RULE }),

  difficultyTargets: Object.freeze({
    foundational: 0.2,
    applied: 0.6,
    advancedSynthesis: 0.2,
  }),

  // Modules 1-11 (instructional). Module 0 (Welcome) carries no exam content.
  requiredModuleCoverage: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],

  partI: Object.freeze({
    label: 'Knowledge & Retention',
    weight: 0.5,
    targetCount: 40,
    minPerModule: 1,
  }),

  partII: Object.freeze({
    label: 'Applied Practitioner Cases',
    weight: 0.3,
    targetCount: 4,
  }),

  partIII: Object.freeze({
    label: 'Practitioner Conversation with Cadence',
    weight: 0.2,
    targetCount: 3,
    // Not hardcoded to "always 5" institutionally — Head Spa's launch content
    // is expected to use 5 criteria per conversation, but the engine reads
    // whatever rubricCriteria array a given interview item actually defines.
    typicalCriteriaPerConversation: 5,
    maxFollowUpsPerConversation: 1,
  }),

  attemptRules: Object.freeze({
    // Attempt ladder — standard Section 8.
    remediationRequiredBeforeAttempt: 3, // Attempt 2 unsuccessful -> gate before Attempt 3
    educatorAuthorizationRequiredBeforeAttempt: 4, // Attempt 3 unsuccessful -> gate before Attempt 4
    maxAutomaticAttempts: 4, // beyond this: Individual AIMT Review, no automatic Attempt 5
    // Critical-domain remediation is required before ANY next attempt starting
    // after Attempt 1, independent of the numbered-attempt gates above.
    criticalDomainRemediationAppliesFromAttempt: 1,
  }),

  randomizationRules: Object.freeze({
    retakeOverlapPolicy: 'minimize-not-zero',
    shuffleAnswerChoices: true,
    neverShuffleFixedOrderSequencing: true,
  }),
});

const CONFIG_VERSIONS = Object.freeze({
  [ASSESSMENT_VERSION_V1]: HEAD_SPA_ASSESSMENT_CONFIG_V1,
});

export function getAssessmentConfig(assessmentVersion) {
  const version = assessmentVersion || ASSESSMENT_VERSION_V1;
  const config = CONFIG_VERSIONS[version];
  if (!config) {
    throw new Error('Unknown assessment configuration version: ' + version);
  }
  return config;
}

export function getCurrentAssessmentConfig() {
  return getAssessmentConfig(ASSESSMENT_VERSION_V1);
}
