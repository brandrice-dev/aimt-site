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

   LAUNCH UPDATE: hair-cycle's route is now LIVE in production
   (education/hair-loss/hair-growth-cycle.html), with education.html
   (/education) and education/hair-loss.html (/education/hair-loss) as
   its real library-landing and topic-hub parents -- see sitemap.xml,
   which lists all three. This file's `related_links` are still
   hand-verified against the actual filesystem/sitemap on every edit,
   never an invented sibling page -- that discipline doesn't relax just
   because a route graduated from planned to live.

   GENERALIZATION TEST (seo/education-page-2-generalization,
   topic_slug=telogen-effluvium): a SECOND route, still preview-only --
   the page file exists on this branch (verified against the actual
   .html file, same discipline as above) but is NOT yet in sitemap.xml,
   NOT linked from the hair-loss hub's production copy, and carries a
   temporary noindex meta tag on the page itself. Its related_links
   correctly cross-links to hair-cycle (now genuinely live) as a real,
   existing sibling page in the same cluster -- the first real test of
   this registry linking two real Education pages to each other.
   ═══════════════════════════════════════════════════════════════ */

const SITE_ORIGIN = 'https://aimtrichology.com';

export const PAGE_BUILDER_ROUTES = Object.freeze({
  'hair-cycle': {
    route: '/education/hair-loss/hair-growth-cycle',
    cluster: 'hair-loss',
    // Related-link placeholders: ONLY routes that actually exist in this
    // repo today (verified against _redirects, sitemap.xml, and the
    // actual .html files), never an invented sibling education page.
    // Each is a distinct informational/transactional intent from this
    // page's own -- see page-builder-validator.mjs's
    // NO_TRANSACTIONAL_CANNIBALIZATION rule for why
    // /head-spa-certification is listed as a related link, never folded
    // into this page's own body copy as a pitch.
    related_links: Object.freeze([
      { href: '/education/hair-loss', label: 'Hair Loss & Shedding — AIMT Education Library', relation: 'topic_hub' },
      { href: '/education', label: 'AIMT Education Library', relation: 'library_home' },
      { href: '/about/research-standards', label: 'How AIMT reviews research and evidence', relation: 'transparency' },
      { href: '/head-spa-certification', label: 'AIMT Head Spa Mastery Certification', relation: 'certification_pathway' },
      { href: '/courses', label: 'All AIMT courses', relation: 'catalog' },
    ]),
  },
  'telogen-effluvium': {
    route: '/education/hair-loss/telogen-effluvium',
    cluster: 'hair-loss',
    related_links: Object.freeze([
      { href: '/education/hair-loss/hair-growth-cycle', label: 'The Hair Growth Cycle: A Practitioner Education Overview', relation: 'related_topic' },
      { href: '/education/hair-loss', label: 'Hair Loss & Shedding — AIMT Education Library', relation: 'topic_hub' },
      { href: '/education', label: 'AIMT Education Library', relation: 'library_home' },
      { href: '/about/research-standards', label: 'How AIMT reviews research and evidence', relation: 'transparency' },
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
