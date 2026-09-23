/* ═══════════════════════════════════════════════════════════════
   AIMT Publication Editor v2 — isolated model configuration
   ---------------------------------------------------------------
   STEP 1 FINDING (documented per the originating request): this repo
   already has a mature model-lifecycle registry --
   functions/_lib/cadence/model-config.mjs (resolveCadenceModel(),
   APPROVED/CANDIDATE/LEGACY/RETIRED lifecycle, env-override mechanism,
   fail-safe-if-unapproved default). It is NOT reused directly here,
   deliberately: its two roles (CADENCE_CHAT_MODEL, CADENCE_GRADING_
   MODEL) are Cadence-specific, its module is under functions/_lib/
   cadence/, and this task's explicit instruction is "do not change
   Cadence runtime" -- adding a third role to that file would mean
   editing Cadence's own config module for an unrelated subsystem. Per
   the task's own fallback instruction ("if no suitable reusable model
   path exists, implement the smallest isolated adapter required"),
   this file is that smallest isolated adapter: it borrows the SAME
   governance shape (explicit lifecycle status, fail-safe on an
   unregistered override, one exported resolver) without touching or
   importing anything from functions/_lib/cadence/*.

   What IS reused (read-only imports, zero Cadence modification):
     - functions/_lib/cadence/anthropic-response.mjs's
       fetchAnthropicMessages() (bounded-retry POST) and
       extractAnthropicText[Safe]() (content-block-safe text
       extraction). These are generic Anthropic Messages API HTTP
       utilities with no Cadence business logic in them -- reusing them
       avoids "a second unnecessary model stack" for the literal wire
       call, while this file stays the only thing that decides which
       model name Publication Editor v2 asks for.

   Why this role's default resolution is looser than Cadence's: Cadence
   roles serve real student-facing traffic, so resolveCadenceModel()
   refuses to run at all without an explicit, recorded APPROVED
   promotion. Publication Editor v2 is SHADOW MODE ONLY (see
   docs/research/AIMT-Publication-Editor-v2.md) -- nothing it produces
   is ever served to a student or the public, so requiring a completed
   "production validation program" before the shadow tool can even run
   would block the exact pilot this task exists to perform. This
   resolver therefore defaults to the registered CANDIDATE directly
   (clearly labeled as such in every result), and still fails hard --
   never silently falls back -- if an env override names anything not
   registered here.
   ═══════════════════════════════════════════════════════════════ */

export class PublicationEditorModelConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PublicationEditorModelConfigError';
  }
}

const PROVIDER = 'anthropic';
const ROLE_NAME = 'PUBLICATION_EDITOR_SYNTHESIS_MODEL';

// Single registry version. Promotion to a second version (e.g. moving
// claude-sonnet-5 to APPROVED after a validation program, or adding a
// comparison candidate) follows the same append-only, never-mutate-in-
// place convention as functions/_lib/cadence/model-config.mjs and
// functions/_lib/certification/assessment-config.mjs.
const REGISTRY_VERSIONS = {
  'publication-editor-model-registry-v1': {
    models: {
      'claude-sonnet-5': {
        status: 'CANDIDATE',
        label: 'Claude Sonnet 5',
        note: 'Current Anthropic Sonnet generation (this environment\'s own model guidance: default to the latest, most capable Claude model for new AI-application work). Registered CANDIDATE, not APPROVED -- Publication Editor v2 has no independent validation program of its own yet, and per this file\'s header, shadow-mode tooling resolves its candidate directly rather than refusing to run.',
      },
    },
    roles: {
      [ROLE_NAME]: { approved: null, candidate: 'claude-sonnet-5' },
    },
  },
};

const CURRENT_REGISTRY_VERSION = 'publication-editor-model-registry-v1';

export function getPublicationEditorModelRegistry(version = CURRENT_REGISTRY_VERSION) {
  const registry = REGISTRY_VERSIONS[version];
  if (!registry) throw new PublicationEditorModelConfigError(`Unknown Publication Editor model registry version: ${version}`);
  return { version, provider: PROVIDER, models: registry.models, roles: registry.roles };
}

/**
 * Resolves the model Publication Editor v2 should call for topic synthesis.
 *
 * Env override (env.PUBLICATION_EDITOR_SYNTHESIS_MODEL): honored only when
 * it exactly matches a registered model name -- any unregistered/arbitrary
 * string is rejected outright, the same fail-safe posture as
 * resolveCadenceModel(), so there is still no "latest"-string auto-drift
 * even though this role has no required-APPROVED gate.
 *
 * Default (no override): resolves the role's `candidate` model directly,
 * status 'CANDIDATE' -- see module header for why this differs from
 * Cadence's stricter "must be APPROVED" default.
 *
 * @param {Object} env
 * @param {{version?: string}} [options]
 * @returns {{provider:string, modelName:string, status:string, registryVersion:string, role:string, source:string}}
 */
export function resolvePublicationEditorSynthesisModel(env, options = {}) {
  const version = options.version || CURRENT_REGISTRY_VERSION;
  const registry = getPublicationEditorModelRegistry(version);
  const role = registry.roles[ROLE_NAME];

  const override = env && typeof env[ROLE_NAME] === 'string' ? env[ROLE_NAME].trim() : '';
  if (override) {
    const entry = registry.models[override];
    if (!entry) {
      throw new PublicationEditorModelConfigError(
        `${ROLE_NAME} env override "${override}" is not a registered model in registry ${version}. Refusing to silently fall back.`
      );
    }
    return {
      provider: registry.provider,
      modelName: override,
      status: entry.status,
      registryVersion: version,
      role: ROLE_NAME,
      source: 'env-override',
    };
  }

  if (!role.candidate || !registry.models[role.candidate]) {
    throw new PublicationEditorModelConfigError(
      `No candidate model registered for ${ROLE_NAME} in registry ${version}.`
    );
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
