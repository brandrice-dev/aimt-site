/* ═══════════════════════════════════════════════════════════════
   AIMT Page Builder v1 — future public route registry
   ---------------------------------------------------------------
   What FUTURE public route a topic's cleared page belongs at, and what
   real/planned routes it may cross-reference. Separate from Publication
   Editor's PAGE_SYNTHESIS_INTENT registry (publication-page-intent.mjs)
   -- that registry is about what evidence a page should be narrowed to;
   this one is about where the resulting page would live once built, and
   is Page Builder's own concern.

   Per this task's explicit scope: only `hair-cycle` is registered here.
   Page Builder v1 is proving the architecture on one already-cleared
   topic, not being pre-wired for topics with no clearance yet.

   NOTHING in this file creates a live route. It is read by
   page-builder-draft.mjs and page-builder-seo.mjs to label a SHADOW
   artifact with the route it is drafted for -- scripts/page-builder-
   shadow.mjs never writes an actual .html file at this path, and no
   Cloudflare Pages redirect/rewrite exists for it (checked against this
   repo's own _redirects, which has no /education entry at all).
   ═══════════════════════════════════════════════════════════════ */

const SITE_ORIGIN = 'https://aimtrichology.com';

export const PAGE_BUILDER_ROUTES = Object.freeze({
  'hair-cycle': {
    // Not live. Nested under a future /education/hair-loss cluster this
    // page would be the first entry in -- the cluster index itself does
    // not exist yet and is not created or linked here.
    route: '/education/hair-loss/hair-growth-cycle',
    cluster: 'hair-loss',
    // Related-link placeholders: ONLY routes that actually exist in this
    // repo today (verified against _redirects and the top-level .html
    // files), never an invented sibling education page. Each is a
    // distinct informational/transactional intent from this page's own
    // -- see page-builder-validator.mjs's NO_TRANSACTIONAL_CANNIBALIZATION
    // rule for why /head-spa-certification is listed as a related link,
    // never folded into this page's own body copy as a pitch.
    related_links: Object.freeze([
      { href: '/head-spa-certification', label: 'AIMT Head Spa Mastery Certification', relation: 'certification_pathway' },
      { href: '/about/research-standards', label: 'How AIMT reviews research and evidence', relation: 'transparency' },
      { href: '/courses', label: 'All AIMT courses', relation: 'catalog' },
    ]),
  },
});

export class PageBuilderRouteError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PageBuilderRouteError';
  }
}

export function getPageBuilderRoute(topicSlug) {
  const entry = PAGE_BUILDER_ROUTES[topicSlug];
  if (!entry) {
    throw new PageBuilderRouteError(`No Page Builder route registered for "${topicSlug}". Page Builder v1 is scoped to hair-cycle only for this pilot.`);
  }
  return entry;
}

export function getCanonicalUrl(topicSlug) {
  const { route } = getPageBuilderRoute(topicSlug);
  return `${SITE_ORIGIN}${route}`;
}
