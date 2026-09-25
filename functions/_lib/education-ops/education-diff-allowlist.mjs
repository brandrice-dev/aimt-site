/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — generated-diff allowlist
   ---------------------------------------------------------------
   PURE. Given a list of changed file paths (the caller supplies them --
   e.g. from `git diff --name-only`, so this module never shells out
   itself and stays trivially testable), decides whether a scheduled
   run's file changes are within the narrow set an ORDINARY autonomous
   article run is allowed to touch.

   Anything outside the allowlist -- Publication Editor source, Page
   Builder source, validators, shared CSS, research schema, or any
   unrelated system -- means the run produced changes an ordinary
   article should never require, and the orchestrator must stop as
   INFRA_REVIEW rather than proceed to branch/PR/merge. This is the
   mechanical backstop for the architecture principle: "a normal future
   article run should ideally change only generated/content artifacts."
   ═══════════════════════════════════════════════════════════════ */

// Exact-path or prefix rules. A path is ALLOWED if it matches one of
// these; every other path is a violation. Kept intentionally narrow --
// widening this list is itself an architecture decision, not something
// a run should do to itself.
const ALLOWLIST_RULES = Object.freeze([
  { kind: 'prefix', value: 'education/' }, // new article HTML + hub file updates
  { kind: 'exact', value: 'sitemap.xml' },
  { kind: 'prefix', value: 'functions/_data/education-page-plans/' }, // Page Plan artifacts
  { kind: 'prefix', value: 'research-import/education-ops/' }, // gitignored run reports; harmless if ever staged
]);

export class DiffAllowlistError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DiffAllowlistError';
  }
}

function isAllowedPath(path) {
  return ALLOWLIST_RULES.some((rule) => (rule.kind === 'exact' ? path === rule.value : path.startsWith(rule.value)));
}

/**
 * @param {string[]} changedPaths - repo-relative paths, e.g. from
 *   `git diff --name-only <base>..<head>`
 * @returns {{valid: boolean, allowed: string[], violations: string[]}}
 */
export function checkGeneratedDiffAllowlist(changedPaths) {
  const allowed = [];
  const violations = [];
  for (const path of changedPaths || []) {
    if (isAllowedPath(path)) allowed.push(path);
    else violations.push(path);
  }
  return { valid: violations.length === 0, allowed, violations };
}
