/* ═══════════════════════════════════════════════════════════════
   AIMT Page Builder v1 — isolated model configuration
   ---------------------------------------------------------------
   Mirrors functions/_lib/research/publication-editor-model-config.mjs's
   own shape (explicit lifecycle status, fail-safe on an unregistered
   override, one exported resolver), deliberately NOT reused directly --
   per this task's explicit instruction, Page Builder must be its own
   isolated adapter so a later cost-optimization pass can choose an
   economical model for Page Builder independently from Publication
   Editor's (ANTHROPIC_PUBLICATION_EDITOR_API_KEY) or Cadence's
   (ANTHROPIC_API_KEY / CADENCE_*) credentials and model choices, without
   editing either of those subsystems' own config modules.

   Dedicated credential: ANTHROPIC_PAGE_BUILDER_API_KEY. Never falls back
   to reading ANTHROPIC_PUBLICATION_EDITOR_API_KEY or any Cadence env var
   -- if that key is absent, resolvePageBuilderFidelityModel() still
   resolves (it is pure config), but page-builder-fidelity.mjs's
   checkParagraphFidelityWithModel() refuses to call out without it.

   WHY THE DEFAULT MODEL IS SMALL: Page Builder's fidelity check is a
   short classification task (one paragraph + 1-3 supporting sentences
   in, one of three words out) -- not a synthesis task. Publication
   Editor's own 128-candidate-claim selection call is the expensive,
   necessary step; Page Builder receives only the already-cleared ~40
   selected claims (for hair-cycle) and should cost materially less per
   page. The registered candidate below is Haiku 4.5, per this
   environment's own guidance to default to the latest capable model
   *for the size of task at hand* -- a full Sonnet-class model is not
   needed to classify PASS/REWRITE_REQUIRED/HUMAN_REVIEW.
   ═══════════════════════════════════════════════════════════════ */

export class PageBuilderModelConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PageBuilderModelConfigError';
  }
}

const PROVIDER = 'anthropic';
const ROLE_NAME = 'PAGE_BUILDER_FIDELITY_MODEL';

const REGISTRY_VERSIONS = {
  'page-builder-model-registry-v1': {
    models: {
      'claude-haiku-4-5-20251001': {
        status: 'CANDIDATE',
        label: 'Claude Haiku 4.5',
        note: 'Small, fast model for a short classification task (paragraph-vs-source-sentence entailment), not a synthesis task. Registered CANDIDATE, not APPROVED -- Page Builder has no independent validation program yet, and per this file\'s header, this adapter resolves its candidate directly rather than refusing to run, matching Publication Editor v2\'s own shadow-mode posture.',
      },
    },
    roles: {
      [ROLE_NAME]: { approved: null, candidate: 'claude-haiku-4-5-20251001' },
    },
  },
};

const CURRENT_REGISTRY_VERSION = 'page-builder-model-registry-v1';

export function getPageBuilderModelRegistry(version = CURRENT_REGISTRY_VERSION) {
  const registry = REGISTRY_VERSIONS[version];
  if (!registry) throw new PageBuilderModelConfigError(`Unknown Page Builder model registry version: ${version}`);
  return { version, provider: PROVIDER, models: registry.models, roles: registry.roles };
}

/**
 * Resolves the model Page Builder's fidelity check should call.
 *
 * Env override (env.PAGE_BUILDER_FIDELITY_MODEL): honored only when it
 * exactly matches a registered model name -- fail-safe, same posture as
 * Cadence's and Publication Editor's own resolvers.
 *
 * @param {Object} env
 * @param {{version?: string}} [options]
 * @returns {{provider:string, modelName:string, status:string, registryVersion:string, role:string, source:string}}
 */
export function resolvePageBuilderFidelityModel(env, options = {}) {
  const version = options.version || CURRENT_REGISTRY_VERSION;
  const registry = getPageBuilderModelRegistry(version);
  const role = registry.roles[ROLE_NAME];

  const override = env && typeof env[ROLE_NAME] === 'string' ? env[ROLE_NAME].trim() : '';
  if (override) {
    const entry = registry.models[override];
    if (!entry) {
      throw new PageBuilderModelConfigError(
        `${ROLE_NAME} env override "${override}" is not a registered model in registry ${version}. Refusing to silently fall back.`
      );
    }
    return { provider: registry.provider, modelName: override, status: entry.status, registryVersion: version, role: ROLE_NAME, source: 'env-override' };
  }

  if (!role.candidate || !registry.models[role.candidate]) {
    throw new PageBuilderModelConfigError(`No candidate model registered for ${ROLE_NAME} in registry ${version}.`);
  }
  return {
    provider: registry.provider,
    modelName: role.candidate,
    status: registry.models[role.candidate].status,
    registryVersion: version,
    role: ROLE_NAME,
    source: 'candidate-default',
  };
}
