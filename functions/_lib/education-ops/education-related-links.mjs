/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — deterministic related-link authority
   ---------------------------------------------------------------
   TRUST-BOUNDARY CORRECTION: the Education Writer model was previously
   asked to author `related_links[]` itself, including each href. That
   let a model invent a destination that happened to survive the
   (nonexistent) validation entirely. The model has no schema slot for
   `related_links` at all now (see EDUCATION_WRITER_OUTPUT_JSON_SCHEMA).

   THE FIX: every href a generated page ever carries comes from trusted
   runtime/site data, resolved by the orchestrator (never invented) and
   assembled here, PURELY, into the final related_links[] array:
     - the active cluster's hub route
     - the Education Library home
     - Research Standards
     - each currently-published sibling page in the same cluster, whose
       route the orchestrator already resolved from either the existing
       Page Builder route registry (legacy hair-cycle/telogen-effluvium)
       or a persisted, git-tracked Education Page Plan artifact (a
       future generated/published page) -- see
       scripts/education-operations-cycle.mjs#resolveTrustedSiblingPages
   ═══════════════════════════════════════════════════════════════ */

export const EDUCATION_LIBRARY_HOME = Object.freeze({ href: '/education', label: 'AIMT Education Library', relation: 'library_home' });
export const RESEARCH_STANDARDS_LINK = Object.freeze({ href: '/about/research-standards', label: 'How AIMT reviews research and evidence', relation: 'transparency' });

/**
 * PURE. Assembles the final, trusted related_links[] array. Every
 * `href` here is either one of the two constants above or came from
 * `siblingPages`/`clusterRoutePrefix`, both of which the CALLER must
 * have already resolved from trusted route data -- this function never
 * invents a route itself.
 *
 * @param {{
 *   clusterLabel: string, clusterRoutePrefix: string,
 *   siblingPages: Array<{route: string, label: string}>
 * }} args
 * @returns {Array<{href: string, label: string, relation: string}>}
 */
export function buildEducationRelatedLinks({ clusterLabel, clusterRoutePrefix, siblingPages = [] }) {
  const links = [
    { href: clusterRoutePrefix, label: `${clusterLabel} — AIMT Education Library`, relation: 'topic_hub' },
    { ...EDUCATION_LIBRARY_HOME },
    { ...RESEARCH_STANDARDS_LINK },
  ];
  for (const sibling of siblingPages) {
    links.push({ href: sibling.route, label: sibling.label, relation: 'related_topic' });
  }
  return links;
}
