// Centralized, server-side-only Cadence provider/model configuration.
//
// Closes a real drift this repo's own launch-sweep audit found: the live
// deployed `headspa-proxy` Worker was running a different model string than
// the one committed in cadence-worker/worker.js, with no shared source of
// truth to catch it. See docs/course-audit/00-cadence-launch-sweep-audit.md
// Section 4 and docs/course-audit/00-cadence-launch-sweep-build-contract.md.
//
// Both Cloudflare Pages Functions call sites import this module directly
// (functions/_lib/certification/cadence-grader.mjs today; any future
// checkpoint-grading Pages Function later). cadence-worker/worker.js cannot
// import it -- Cloudflare Worker dashboard-paste deploys have no build step
// -- so its model constants are a hand-kept mirror of the CADENCE_CHAT_MODEL
// role below, checked for drift by tests/cadence-phase0.test.mjs.
//
// Promotion discipline: never set a role's `approved` value to "latest" or
// a provider default. To promote a model, add its string as that role's
// `candidate` first (so it can be selected only via an explicit env-var
// override that matches a pre-registered value -- see resolveCadenceModel),
// run it through the regression suite, then move it to a NEW versioned
// config entry's `approved` field. Never mutate an existing version's
// values in place -- same pattern already used by
// functions/_lib/certification/assessment-config.mjs's getAssessmentConfig().

const CONFIG_VERSIONS = {
  'cadence-model-config-v1': {
    roles: {
      // Checkpoints (Modules 0-11) + the guide-panel chat -- today served
      // through cadence-worker/worker.js.
      CADENCE_CHAT_MODEL: {
        approved: 'claude-sonnet-4-20250514',
        candidate: null,
      },
      // Module 12 Part II/III certification grading -- today served
      // through functions/_lib/certification/cadence-grader.mjs, never
      // through the client-facing Worker.
      CADENCE_GRADING_MODEL: {
        approved: 'claude-sonnet-4-20250514',
        candidate: null,
      },
    },
  },
};

const CURRENT_CONFIG_VERSION = 'cadence-model-config-v1';
const PROVIDER = 'anthropic';

export function getCadenceModelConfig(version = CURRENT_CONFIG_VERSION) {
  const config = CONFIG_VERSIONS[version];
  if (!config) throw new Error(`Unknown Cadence model config version: ${version}`);
  return { version, provider: PROVIDER, roles: config.roles };
}

/**
 * Resolves the model string for one logical Cadence role.
 *
 * An environment-variable override (env[roleName], e.g. env.CADENCE_GRADING_MODEL)
 * is honored ONLY when it exactly matches that role's pre-registered `approved`
 * or `candidate` value for this config version -- an arbitrary or unregistered
 * string (including any provider "latest" alias) is never trusted and silently
 * falls back to `approved`. This is what makes "no automatic latest-model
 * switching" a property of the code, not just a policy.
 *
 * @param {Object} env - Cloudflare Pages Function env bindings
 * @param {'CADENCE_CHAT_MODEL'|'CADENCE_GRADING_MODEL'} roleName
 * @param {string} [version]
 * @returns {{provider:string, modelName:string, configVersion:string, role:string, source:'approved-default'|'env-override-candidate'}}
 */
export function resolveCadenceModel(env, roleName, version = CURRENT_CONFIG_VERSION) {
  const config = getCadenceModelConfig(version);
  const role = config.roles[roleName];
  if (!role) throw new Error(`Unknown Cadence model role: ${roleName}`);

  const registered = [role.approved, role.candidate].filter(Boolean);
  const override = env && typeof env[roleName] === 'string' ? env[roleName].trim() : '';
  const useOverride = override && registered.includes(override) && override !== role.approved;

  return {
    provider: config.provider,
    modelName: useOverride ? override : role.approved,
    configVersion: config.version,
    role: roleName,
    source: useOverride ? 'env-override-candidate' : 'approved-default',
  };
}
