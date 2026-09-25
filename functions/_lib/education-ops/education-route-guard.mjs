/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — route-collision guard
   ---------------------------------------------------------------
   SAFETY-BOUNDARY CORRECTION: the intent planner chooses a route_slug,
   and the orchestrator computes `<cluster route prefix>/<route_slug>`
   as the new page's route -- but nothing previously checked that route
   against routes that ALREADY belong to a live published page. A
   planner choosing, say, "telogen-effluvium" as the route_slug for an
   entirely different topic would compute the SAME route as the real,
   live telogen-effluvium page, and prepareGeneratedArtifacts() would
   overwrite it -- silently, and the generated-diff allowlist would
   still consider `education/hair-loss/telogen-effluvium.html` an
   ALLOWED path, since it's inside `education/**`.

   THIS is the mechanical fix for that specific gap: check the
   orchestrator-computed route against the set of routes that are
   CURRENTLY live (resolved by the caller from trusted route data --
   see scripts/education-operations-cycle.mjs#resolveTrustedSiblingPages,
   never this module's own guess) BEFORE any synthesis call is made, so
   a colliding candidate is caught cheaply and early, not after
   spending the run's Publication Editor/Writer/Reviewer model calls on
   a doomed candidate.

   This is a NEW-PAGE-LANE-ONLY check. The future freshness/update lane
   (re-synthesizing an EXISTING published page on purpose) is an
   explicit, separate, not-yet-built replacement contract -- see
   docs/education/AIMT-EDUCATION-OPERATIONS-v1.md.
   ═══════════════════════════════════════════════════════════════ */

export class RouteGuardError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RouteGuardError';
  }
}

/**
 * PURE. Does the orchestrator-computed route for a NEW page collide
 * with a route that is currently live?
 *
 * @param {string} computedRoute - e.g. "/education/hair-loss/telogen-effluvium"
 * @param {string[]} publishedRoutes - every currently-published route,
 *   already resolved by the caller from trusted data (never guessed)
 * @returns {{valid: boolean, violations: string[]}}
 */
export function checkRouteNotAlreadyPublished(computedRoute, publishedRoutes) {
  if ((publishedRoutes || []).includes(computedRoute)) {
    return { valid: false, violations: [`ROUTE_COLLIDES_WITH_PUBLISHED_PAGE:${computedRoute}`] };
  }
  return { valid: true, violations: [] };
}
