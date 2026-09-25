/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — isolated model configuration
   ---------------------------------------------------------------
   Same isolation discipline as publication-editor-model-config.mjs:
   this file decides which model each Education Operations role calls,
   and nothing else. It is deliberately separate from BOTH Cadence's
   model-config.mjs (student-facing, different credential, different
   lifecycle requirements) AND Publication Editor's own
   publication-editor-model-config.mjs (a different subsystem -- the
   Education Writer/Reviewer/Intent-Planner roles never reuse the
   Publication Editor's own resolved model or credential, per the
   originating task's explicit "Never reuse Cadence credentials...
   Continue isolating Education/research automation credentials").

   Credential: ANTHROPIC_EDUCATION_WRITER_API_KEY, a single dedicated
   key shared by all three Education Operations roles below (intent
   planning, writing, reviewing) -- one credential family for "the
   automated Education authoring layer", distinct from Publication
   Editor's ANTHROPIC_PUBLICATION_EDITOR_API_KEY (evidence synthesis)
   and Cadence's own key (student-facing chat). A run missing this
   credential must become CONFIG_BLOCKED and stop without writes -- see
   scripts/education-operations-cycle.mjs -- never silently fall back
   to another subsystem's key.
   ═══════════════════════════════════════════════════════════════ */

export class EducationOpsModelConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EducationOpsModelConfigError';
  }
}

const PROVIDER = 'anthropic';
export const EDUCATION_OPS_API_KEY_ENV_VAR = 'ANTHROPIC_EDUCATION_WRITER_API_KEY';

export const EDUCATION_OPS_ROLES = Object.freeze({
  INTENT_PLANNER: 'EDUCATION_INTENT_PLANNER_MODEL',
  WRITER: 'EDUCATION_WRITER_MODEL',
  REVIEWER: 'EDUCATION_REVIEWER_MODEL',
});

const REGISTRY_VERSIONS = {
  'education-ops-model-registry-v1': {
    models: {
      'claude-sonnet-5': {
        status: 'CANDIDATE',
        label: 'Claude Sonnet 5',
        note: 'This environment\'s default latest-model guidance. Registered CANDIDATE -- Education Operations v1 is shadow-mode-default and has no independent production validation program yet, same posture as Publication Editor v2.',
      },
    },
    roles: {
      [EDUCATION_OPS_ROLES.INTENT_PLANNER]: { approved: null, candidate: 'claude-sonnet-5' },
      [EDUCATION_OPS_ROLES.WRITER]: { approved: null, candidate: 'claude-sonnet-5' },
      [EDUCATION_OPS_ROLES.REVIEWER]: { approved: null, candidate: 'claude-sonnet-5' },
    },
  },
};

const CURRENT_REGISTRY_VERSION = 'education-ops-model-registry-v1';

export function getEducationOpsModelRegistry(version = CURRENT_REGISTRY_VERSION) {
  const registry = REGISTRY_VERSIONS[version];
  if (!registry) throw new EducationOpsModelConfigError(`Unknown Education Operations model registry version: ${version}`);
  return { version, provider: PROVIDER, models: registry.models, roles: registry.roles };
}

/**
 * @param {Object} env
 * @param {string} role - one of EDUCATION_OPS_ROLES
 * @param {{version?: string}} [options]
 */
export function resolveEducationOpsModel(env, role, options = {}) {
  const version = options.version || CURRENT_REGISTRY_VERSION;
  const registry = getEducationOpsModelRegistry(version);
  const roleEntry = registry.roles[role];
  if (!roleEntry) throw new EducationOpsModelConfigError(`Unknown Education Operations role "${role}".`);

  const override = env && typeof env[role] === 'string' ? env[role].trim() : '';
  if (override) {
    const entry = registry.models[override];
    if (!entry) {
      throw new EducationOpsModelConfigError(`${role} env override "${override}" is not a registered model in registry ${version}. Refusing to silently fall back.`);
    }
    return { provider: registry.provider, modelName: override, status: entry.status, registryVersion: version, role, source: 'env-override' };
  }

  if (!roleEntry.candidate || !registry.models[roleEntry.candidate]) {
    throw new EducationOpsModelConfigError(`No candidate model registered for ${role} in registry ${version}.`);
  }
  return { provider: registry.provider, modelName: roleEntry.candidate, status: registry.models[roleEntry.candidate].status, registryVersion: version, role, source: 'candidate-default' };
}

/**
 * Fail-closed credential check. Never falls back to
 * ANTHROPIC_PUBLICATION_EDITOR_API_KEY, ANTHROPIC_API_KEY (Cadence), or
 * any other key -- a missing dedicated credential is CONFIG_BLOCKED,
 * not a silent substitution.
 *
 * @param {Object} env
 * @returns {{ok: boolean, reason: string|null}}
 */
export function checkEducationOpsCredential(env) {
  if (!env || !env[EDUCATION_OPS_API_KEY_ENV_VAR] || !String(env[EDUCATION_OPS_API_KEY_ENV_VAR]).trim()) {
    return { ok: false, reason: `${EDUCATION_OPS_API_KEY_ENV_VAR} not configured in this environment.` };
  }
  return { ok: true, reason: null };
}
