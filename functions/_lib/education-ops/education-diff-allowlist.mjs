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

   MULTI-CLUSTER: paths under education/ are no longer accepted by bare
   prefix. An education/ path is allowed only when it is a registered
   cluster's hub file (education/<cluster>.html) or a single article
   file directly inside a registered cluster's directory
   (education/<cluster>/<route-slug>.html) -- both derived from the
   authoritative publication registry, so a run can write new-cluster
   artifacts but can never create an unregistered public section.
   ═══════════════════════════════════════════════════════════════ */

import { PUBLICATION_CLUSTERS } from './education-publication-registry.mjs';

const ARTICLE_FILE_SEGMENT = /^[a-z0-9]+(-[a-z0-9]+)*\.html$/;

function isRegisteredEducationPath(path) {
  return Object.values(PUBLICATION_CLUSTERS).some((cluster) => {
    if (path === cluster.hub_file) return true;
    const dir = `${cluster.route_prefix.slice(1)}/`;
    return path.startsWith(dir) && ARTICLE_FILE_SEGMENT.test(path.slice(dir.length));
  });
}

// Exact-path or prefix rules. A path is ALLOWED if it matches one of
// these; every other path is a violation. Kept intentionally narrow --
// widening this list is itself an architecture decision, not something
// a run should do to itself.
const ALLOWLIST_RULES = Object.freeze([
  { kind: 'registered-education', value: 'education/' }, // new article HTML + hub file updates, registered clusters only
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
  return ALLOWLIST_RULES.some((rule) => {
    if (rule.kind === 'exact') return path === rule.value;
    if (rule.kind === 'registered-education') return path.startsWith(rule.value) && isRegisteredEducationPath(path);
    return path.startsWith(rule.value);
  });
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
