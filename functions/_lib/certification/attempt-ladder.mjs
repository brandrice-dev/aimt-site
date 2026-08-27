// AIMT Head Spa — attempt/remediation ladder gating (pure, testable).
// Implements docs/course-audit/00-aimt-certification-assessment-standard.md
// Section 8. Deliberately has no I/O — functions/api/certification/*.js
// fetches the rows and passes them in, so this logic is unit-testable
// without a live Supabase connection.

/**
 * @typedef {Object} FinalizedAttemptSummary
 * @property {number} attemptNumber
 * @property {'pass'|'not_yet_passed'|null} decision - null means still in progress
 * @property {Array<{domainId:string, cleared:boolean}>} criticalDomainResults
 */

/**
 * @param {Object} params
 * @param {FinalizedAttemptSummary[]} params.attempts
 * @param {Array<{critical_domain:string|null, required_before_next_attempt:boolean, completed:boolean}>} [params.remediationAssignments]
 * @param {Array<{attempt4_authorized:boolean}>} [params.educatorRequests]
 * @param {import('./assessment-config.mjs').AssessmentConfig} params.config
 */
export function determineNextAttemptEligibility({ attempts, remediationAssignments = [], educatorRequests = [], config }) {
  const finalized = attempts
    .filter((a) => a.decision === 'pass' || a.decision === 'not_yet_passed')
    .slice()
    .sort((a, b) => a.attemptNumber - b.attemptNumber);
  const inProgress = attempts.find((a) => a.decision == null);

  if (finalized.some((a) => a.decision === 'pass')) {
    return { canStartNewAttempt: false, alreadyCertified: true };
  }

  if (inProgress) {
    return { canStartNewAttempt: false, resumeAttemptNumber: inProgress.attemptNumber };
  }

  const nextAttemptNumber = finalized.length === 0 ? 1 : finalized[finalized.length - 1].attemptNumber + 1;

  if (nextAttemptNumber > config.attemptRules.maxAutomaticAttempts) {
    return { canStartNewAttempt: false, nextAttemptNumber, blockedReason: 'individual_aimt_review' };
  }

  // Critical-domain remediation is required before the NEXT attempt whenever
  // a prior (eligible) attempt left a domain uncleared — independent of the
  // numbered-attempt gates below (standard Section 8, "Critical-domain
  // remediation is not purely attempt-number-driven").
  const domainsNeedingRemediation = new Set();
  for (const attempt of finalized) {
    if (attempt.attemptNumber < config.attemptRules.criticalDomainRemediationAppliesFromAttempt) continue;
    for (const d of attempt.criticalDomainResults || []) {
      if (!d.cleared) domainsNeedingRemediation.add(d.domainId);
    }
  }
  const outstandingDomainRemediation = Array.from(domainsNeedingRemediation).filter((domainId) => {
    const done = remediationAssignments.some(
      (r) => r.critical_domain === domainId && r.required_before_next_attempt && r.completed
    );
    return !done;
  });
  if (outstandingDomainRemediation.length > 0) {
    return {
      canStartNewAttempt: false,
      nextAttemptNumber,
      blockedReason: 'critical_domain_remediation_required',
      domains: outstandingDomainRemediation,
    };
  }

  if (nextAttemptNumber === config.attemptRules.remediationRequiredBeforeAttempt) {
    const outstanding = remediationAssignments.filter((r) => r.required_before_next_attempt && !r.completed);
    if (outstanding.length > 0) {
      return {
        canStartNewAttempt: false,
        nextAttemptNumber,
        blockedReason: 'remediation_required',
        outstandingCount: outstanding.length,
      };
    }
  }

  if (nextAttemptNumber === config.attemptRules.educatorAuthorizationRequiredBeforeAttempt) {
    const authorized = educatorRequests.some((r) => r.attempt4_authorized === true);
    if (!authorized) {
      return { canStartNewAttempt: false, nextAttemptNumber, blockedReason: 'educator_authorization_required' };
    }
  }

  return { canStartNewAttempt: true, nextAttemptNumber };
}

/**
 * Aggregates already-identified weak spots (a missed Knowledge item, a
 * low-scoring Case, a low-scoring Interview — each already reduced by the
 * caller to competency + source module(s), never the item text/prompt/
 * answer) into deduplicated weak-competency-area records: one per distinct
 * (competency, primary module) pair. Pure — the caller decides what counts
 * as "missed"/"low-scoring" using the real scoring engine and the current
 * assessment config; this function only dedupes and shapes the result for
 * buildRemediationAssignments(), so a student who missed several items in
 * the same competency/module doesn't get several near-identical rows.
 *
 * @param {Array<{competency:string, sourceModules:number[], sectionRef?:string|null}>} weakSpots
 * @returns {Array<{competency:string, moduleRef:string, sectionRef:string|null}>}
 */
export function collectWeakCompetencyAreas(weakSpots) {
  const seen = new Map();
  for (const spot of weakSpots || []) {
    const competency = String(spot && spot.competency ? spot.competency : '').trim();
    const modules = ((spot && spot.sourceModules) || []).filter((m) => Number.isInteger(m));
    if (!competency || !modules.length) continue;
    const primaryModule = modules[0];
    const key = competency + '|' + primaryModule;
    if (seen.has(key)) continue;
    seen.set(key, { competency, moduleRef: String(primaryModule), sectionRef: (spot && spot.sectionRef) || null });
  }
  return Array.from(seen.values());
}

/**
 * Groups deficiencies into remediation assignment records by competency/
 * critical-domain area rather than one row per missed item (standard
 * Section 8 / task instruction #22). Pure — callers persist the result.
 *
 * @param {Object} params
 * @param {Array<{domainId:string, cleared:boolean}>} params.criticalDomainResults
 * @param {Array<{competency:string, moduleRef:string, sectionRef:string}>} params.weakCompetencyAreas
 *   Pre-aggregated by the caller (e.g. from missed-item competency tags) —
 *   this function only converts them into remediation records, it does not
 *   itself decide what counts as "weak."
 */
export function buildRemediationAssignments({ criticalDomainResults, weakCompetencyAreas }) {
  const assignments = [];
  for (const domain of criticalDomainResults || []) {
    if (!domain.cleared) {
      assignments.push({
        competency_area: null,
        critical_domain: domain.domainId,
        module_ref: null,
        section_ref: null,
        remediation_activity: 'CONTENT_PENDING', // authored during the remediation-content phase
        required_before_next_attempt: true,
      });
    }
  }
  for (const area of weakCompetencyAreas || []) {
    assignments.push({
      competency_area: area.competency,
      critical_domain: null,
      module_ref: area.moduleRef || null,
      section_ref: area.sectionRef || null,
      remediation_activity: 'CONTENT_PENDING',
      required_before_next_attempt: true,
    });
  }
  return assignments;
}
