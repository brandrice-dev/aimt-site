// Centralized, server-side-only Cadence provider/model configuration.
//
// MODEL-LIFECYCLE CORRECTION (this version, v2): the original Phase 0 pass
// of this module pointed both roles' `approved` value directly at
// claude-sonnet-4-20250514 and treated that as the new long-term baseline.
// That was wrong -- by the time this correction landed, Anthropic's Sonnet
// 4 generation was already superseded (current generation: Sonnet 5), and
// enshrining an old generation as "approved" is exactly the kind of
// uncontrolled, undocumented model authority this whole module exists to
// prevent. See docs/course-audit/00-cadence-launch-sweep-build-contract.md
// Section 6a for the full correction record.
//
// Every registered model carries an explicit lifecycle status:
//   LEGACY    - a superseded generation. Still may be technically callable
//               via the API, but never eligible for silent/automatic
//               production use again without a new, explicit, recorded
//               approval decision.
//   CANDIDATE - registered and eligible for controlled regression testing,
//               but not yet cleared for default production traffic.
//   APPROVED  - cleared for default production use. A role's `approved`
//               field may point ONLY at a model with this status.
//   RETIRED   - no longer available from the provider at all.
//
// FAIL-SAFE RULE: resolveCadenceModel() throws CadenceModelConfigError
// rather than silently resolving to a LEGACY, RETIRED, or unregistered
// model. If a role has no APPROVED model, calling code must NOT run --
// this is deliberate: it is safer for Cadence to be temporarily
// unavailable than to silently keep serving traffic on an unreviewed
// model. Callers (functions/_lib/certification/cadence-grader.mjs,
// cadence-worker/worker.js's hand-kept mirror) are expected to catch this
// the same way they catch any other evaluator failure -- preserve the
// student's response, return a retriable error, never fall back quietly.
//
// PROMOTION: a model moves CANDIDATE -> APPROVED only by adding a NEW
// registry version below (never mutating an existing one, same pattern as
// functions/_lib/certification/assessment-config.mjs's
// getAssessmentConfig(version)) that sets a role's `approved` field to that
// model's name -- and, per the AIMT Cadence launch-sweep direction, only
// after the AIMT grading/conversation regression suite (build contract
// Section 13, not yet built) has been run against it. Chat-model and
// grading-model promotion are independent decisions; promoting one role
// does not promote the other.
//
// ROLLBACK: point CURRENT_REGISTRY_VERSION at an earlier version, or add a
// new version whose `approved` field reverts to a previously-approved
// model. A version already shipped is never edited in place -- rollback is
// always a new, explicit, dated decision, never a silent reversion.
//
// TEST/DEV: production code never receives an implicit test fallback. A
// test that needs a working resolution passes an explicit env override
// naming the registered CANDIDATE (see tests/cadence-phase0.test.mjs) --
// exactly the same mechanism a real controlled regression-test run would
// use, not a separate hidden path.

export class CadenceModelConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CadenceModelConfigError';
  }
}

const PROVIDER = 'anthropic';

const REGISTRY_VERSIONS = {
  // Historical -- the original Phase 0 pass. Preserved for auditability,
  // never mutated. This is the exact shape the correction found wrong:
  // both roles pointed straight at a single generation with no lifecycle
  // distinction at all.
  'cadence-model-registry-v1': {
    models: {
      'claude-sonnet-4-20250514': { status: 'APPROVED', label: 'Claude Sonnet 4 (2025-05-14)' },
    },
    roles: {
      CADENCE_CHAT_MODEL: { approved: 'claude-sonnet-4-20250514', candidate: null },
      CADENCE_GRADING_MODEL: { approved: 'claude-sonnet-4-20250514', candidate: null },
    },
  },

  // Current. Corrects v1: claude-sonnet-4-20250514 is reclassified LEGACY
  // (no role may point `approved` at it anymore); claude-sonnet-5 (current
  // Anthropic Sonnet generation, per this environment's own model
  // guidance) is registered CANDIDATE for both roles, pending the
  // regression suite. Neither role has an APPROVED model yet -- this is
  // intentional and is the real, current state of the project, not an
  // oversight. See build contract Section 6a for the owner decision this
  // surfaces before any live deployment of this branch.
  'cadence-model-registry-v2': {
    models: {
      'claude-sonnet-4-20250514': {
        status: 'LEGACY',
        label: 'Claude Sonnet 4 (2025-05-14)',
        note: 'AIMT\'s original Cadence generation. Superseded by Sonnet 5. Not eligible for new production approval without an explicit, recorded decision.',
      },
      'claude-sonnet-5': {
        status: 'CANDIDATE',
        label: 'Claude Sonnet 5',
        note: 'Current Anthropic Sonnet generation for new API integrations. Pending the AIMT grading/conversation regression suite (build contract Section 13) before promotion to APPROVED for either role.',
      },
      // Deliberately NOT registered: claude-sonnet-4-6, the string this
      // repo's launch-sweep audit found actually running on the live
      // deployed headspa-proxy Worker. That is uncontrolled live drift,
      // not a reviewed model -- it does not become authoritative by being
      // observed live, and it is not added here until/unless it is
      // explicitly evaluated and registered the same way any other
      // candidate would be.
    },
    roles: {
      CADENCE_CHAT_MODEL: { approved: null, candidate: 'claude-sonnet-5' },
      CADENCE_GRADING_MODEL: { approved: null, candidate: 'claude-sonnet-5' },
    },
  },

  // Current. GRADING-ONLY PROMOTION: claude-sonnet-5 completed its
  // independent live grading validation program (see
  // docs/course-audit/cadence-sonnet5-grading-regression.md Sections 8-12
  // for the full narrative, including the two infrastructure defects found
  // and fixed along the way -- a parsing bug, a token-budget/adaptive-
  // thinking truncation bug, and one mislabeled regression fixture -- none
  // of which were model defects). CADENCE_GRADING_MODEL.approved now points
  // at claude-sonnet-5. CADENCE_CHAT_MODEL is DELIBERATELY untouched here --
  // approved stays null, candidate stays claude-sonnet-5 -- because chat has
  // not run its own independent live validation program. Grading and chat
  // are separate roles with separate promotion decisions; this version
  // proves that in data, not just in comment: the two roles' `approved`
  // fields move independently, and resolveCadenceModel()'s override path is
  // role-relative (see the roleRelativeStatus note above) so an env
  // override of claude-sonnet-5 for CADENCE_CHAT_MODEL still resolves as a
  // CANDIDATE override, never as approved, even though the same model name
  // is now APPROVED for CADENCE_GRADING_MODEL.
  'cadence-model-registry-v3': {
    models: {
      'claude-sonnet-4-20250514': {
        status: 'LEGACY',
        label: 'Claude Sonnet 4 (2025-05-14)',
        note: 'AIMT\'s original Cadence generation. Superseded by Sonnet 5. Not eligible for new production approval without an explicit, recorded decision.',
      },
      'claude-sonnet-5': {
        status: 'APPROVED',
        label: 'Claude Sonnet 5',
        note: 'APPROVED for CADENCE_GRADING_MODEL only, following its completed grading regression/validation program -- see the CADENCE_GRADING_MODEL role entry below for the exact validated execution configuration and evidence. Still CANDIDATE-only for CADENCE_CHAT_MODEL: chat has not completed its own independent live validation program, and grading approval must never be read as chat approval. Global "APPROVED" status here describes the model having reached that lifecycle stage for at least one role -- resolveCadenceModel() still gates each role\'s own default resolution strictly on that role\'s own `approved` field (CADENCE_CHAT_MODEL.approved is still null) and reports override status role-relatively, so chat cannot inherit this approval by any code path.',
      },
    },
    roles: {
      CADENCE_CHAT_MODEL: { approved: null, candidate: 'claude-sonnet-5' },
      CADENCE_GRADING_MODEL: {
        approved: 'claude-sonnet-5',
        candidate: 'claude-sonnet-5',
        // Audit-trail record of the exact validated execution configuration
        // the evidence below was measured against. NOT the functional
        // source of truth for runtime behavior -- that remains
        // GRADING_MAX_TOKENS / GRADING_EFFORT (exported from
        // functions/_lib/cadence/checkpoint-evaluation.mjs) and the
        // `thinking: { type: 'adaptive' }` set at the actual grading call
        // site. This field exists so the promotion decision is traceable
        // without cross-referencing docs/tests, and is covered by a test
        // that cross-checks it against those real exported constants so
        // the two can never silently diverge unnoticed.
        gradingExecutionConfig: {
          thinking: { type: 'adaptive' },
          outputConfigEffort: 'medium',
          maxTokens: 4096,
        },
        // Audit-trail record of the live validation evidence that
        // authorized this promotion. File paths are relative to the repo
        // root; each is committed, real evidence -- not reconstructed or
        // summarized from memory.
        gradingValidationEvidence: {
          promotionGate: '>=95% overall agreement, 100% safety-critical, 100% injection/leakage guard, acceptable language-variant performance, zero parse failures, stable sentinel behavior',
          gateResult: 'exceeded',
          runs: [
            {
              name: 'Corrected targeted case retest (m2cp1-competent, repeat=3)',
              file: 'docs/course-audit/cadence-sonnet5-grading-m2cp1-targeted-repeat3-raw.json',
              completed: '1/1', overallAgreement: 1, stable: true, infraFailureCount: 0, parseFailureCount: 0,
            },
            {
              name: 'Post-fixture 17-case sentinel',
              file: 'docs/course-audit/cadence-sonnet5-grading-sentinel-post-fixture-raw.json',
              completed: '17/17', overallAgreement: 1, safetyCritical: '6/6', leakageGuard: '2/2', languageVariantGuard: '5/5', infraFailureCount: 0, parseFailureCount: 0,
            },
            {
              name: 'Full 72-case grading suite',
              file: 'docs/course-audit/cadence-sonnet5-grading-full-post-fix-raw.json',
              completed: '72/72', overallAgreement: 1, safetyCritical: '18/18', leakageGuard: '7/7', languageVariantGuard: '9/9', infraFailureCount: 0, parseFailureCount: 0,
            },
            {
              name: 'Stability sentinel (repeated per-case)',
              file: 'docs/course-audit/cadence-sonnet5-grading-stability-raw.json',
              completed: '17/17', overallAgreement: 1, safetyCritical: '6/6', leakageGuard: '2/2', languageVariantGuard: '5/5', unstableCount: 0, infraFailureCount: 0, parseFailureCount: 0,
            },
          ],
          narrative: 'docs/course-audit/cadence-sonnet5-grading-regression.md',
          decisionDate: '2026-08-28',
        },
      },
    },
  },
};

const CURRENT_REGISTRY_VERSION = 'cadence-model-registry-v3';

export function getCadenceModelRegistry(version = CURRENT_REGISTRY_VERSION) {
  const registry = REGISTRY_VERSIONS[version];
  if (!registry) throw new CadenceModelConfigError(`Unknown Cadence model registry version: ${version}`);
  return { version, provider: PROVIDER, models: registry.models, roles: registry.roles };
}

/**
 * Resolves the model to use for one logical Cadence role.
 *
 * Default (no env override): resolves to the role's `approved` model, IF
 * that model is registered with status APPROVED. If the role has no
 * approved model, throws CadenceModelConfigError -- fail safe, never a
 * silent LEGACY fallback.
 *
 * Env override (env[roleName]): honored ONLY when it exactly matches a
 * registered model with status APPROVED or CANDIDATE. Any other value --
 * unregistered, LEGACY, RETIRED, or an arbitrary/"latest" string -- is
 * rejected outright, never silently ignored back to a default. This is
 * what makes "no automatic latest-model switching" a property of the
 * code, not only a policy, and it is the same mechanism a deliberate
 * controlled regression-test run uses to exercise a candidate.
 *
 * @param {Object} env - Cloudflare Pages Function env bindings
 * @param {'CADENCE_CHAT_MODEL'|'CADENCE_GRADING_MODEL'} roleName
 * @param {{version?:string}} [options]
 * @returns {{provider:string, modelName:string, status:string, registryVersion:string, role:string, source:string}}
 */
export function resolveCadenceModel(env, roleName, options = {}) {
  const version = options.version || CURRENT_REGISTRY_VERSION;
  const registry = getCadenceModelRegistry(version);
  const role = registry.roles[roleName];
  if (!role) throw new CadenceModelConfigError(`Unknown Cadence model role: ${roleName}`);

  const lookup = (modelName) => (modelName ? registry.models[modelName] : null);

  const override = env && typeof env[roleName] === 'string' ? env[roleName].trim() : '';
  if (override) {
    const entry = lookup(override);
    if (entry && (entry.status === 'APPROVED' || entry.status === 'CANDIDATE')) {
      // Role-relative status, not the model's bare global status. A model
      // can now be APPROVED for one role (e.g. CADENCE_GRADING_MODEL) while
      // still only a CANDIDATE for another (e.g. CADENCE_CHAT_MODEL) that
      // has not completed its own independent validation program. Without
      // this check, overriding the *other* role with that same model name
      // would report status:'APPROVED'/source:'env-override-approved' too
      // -- which would misrepresent that role as approved. It is APPROVED
      // here only when the override target is also *this role's own*
      // approved default; otherwise it is a candidate override for this
      // role, regardless of what the model has been approved for elsewhere.
      const roleRelativeStatus = (entry.status === 'APPROVED' && role.approved === override) ? 'APPROVED' : 'CANDIDATE';
      return {
        provider: registry.provider,
        modelName: override,
        status: roleRelativeStatus,
        registryVersion: version,
        role: roleName,
        source: roleRelativeStatus === 'APPROVED' ? 'env-override-approved' : 'env-override-candidate',
      };
    }
    throw new CadenceModelConfigError(
      `${roleName} env override "${override}" is not an APPROVED or CANDIDATE model in registry ${version} ` +
      `(status: ${entry ? entry.status : 'UNREGISTERED'}). Refusing to silently fall back.`
    );
  }

  const approvedEntry = lookup(role.approved);
  if (role.approved && approvedEntry && approvedEntry.status === 'APPROVED') {
    return {
      provider: registry.provider,
      modelName: role.approved,
      status: 'APPROVED',
      registryVersion: version,
      role: roleName,
      source: 'approved-default',
    };
  }

  throw new CadenceModelConfigError(
    `No APPROVED model is registered for ${roleName} in registry ${version}. Cadence must not run without an ` +
    `explicit approval -- see docs/course-audit/00-cadence-launch-sweep-build-contract.md Section 6a.`
  );
}

/**
 * Diagnostic snapshot of every role's current resolution -- never throws.
 * Useful for a future status surface and for producing an accurate,
 * verifiable model-lifecycle report rather than one reasoned about by hand.
 */
export function describeCadenceModelStatus(env, version = CURRENT_REGISTRY_VERSION) {
  const registry = getCadenceModelRegistry(version);
  const roles = {};
  for (const roleName of Object.keys(registry.roles)) {
    const roleConfig = registry.roles[roleName];
    let resolved = null;
    let failSafeError = null;
    try {
      resolved = resolveCadenceModel(env, roleName, { version });
    } catch (e) {
      failSafeError = e.message;
    }
    roles[roleName] = {
      approved: roleConfig.approved,
      approvedStatus: roleConfig.approved ? (registry.models[roleConfig.approved] || {}).status || 'UNREGISTERED' : null,
      candidate: roleConfig.candidate,
      candidateStatus: roleConfig.candidate ? (registry.models[roleConfig.candidate] || {}).status || 'UNREGISTERED' : null,
      resolved,
      failSafeTriggered: !!failSafeError,
      failSafeError,
    };
  }
  return { registryVersion: version, provider: registry.provider, models: registry.models, roles };
}
