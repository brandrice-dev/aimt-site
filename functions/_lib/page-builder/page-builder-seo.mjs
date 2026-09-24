/* ═══════════════════════════════════════════════════════════════
   AIMT Page Builder v1 — SEO + structured-data (JSON-LD) draft
   ---------------------------------------------------------------
   PURE. Fills in the draft's seo.canonical_url (using the route
   registry, never a hardcoded string duplicated from it) and builds a
   conservative JSON-LD graph. NEVER fabricates:
     - reviews, ratings, or awards (no aggregateRating/review anywhere)
     - medical credentials or authorship claims (no `author` field --
       this is institutional AIMT content, not attributed to an
       invented individual)
     - a publication date that does not exist (no datePublished/
       dateModified -- this page has never been published; a date field
       here would assert a false fact)
   This module never deploys anything -- it only returns a JSON-LD
   object for scripts/page-builder-shadow.mjs to write to a shadow file.
   ═══════════════════════════════════════════════════════════════ */

import { getCanonicalUrl } from './page-builder-route-registry.mjs';

const SITE_ORIGIN = 'https://aimtrichology.com';

/**
 * @param {object} draft - page-builder-draft.mjs#buildPageDraft() output
 * @returns {object} draft with seo.canonical_url filled in
 */
export function finalizeSeo(draft) {
  const canonicalUrl = getCanonicalUrl(draft.topic_slug);
  return { ...draft, seo: { ...draft.seo, canonical_url: canonicalUrl } };
}

/**
 * Conservative JSON-LD for a future Education article page. Only
 * schema.org fields backed by real, known data.
 *
 * @param {object} draft - a draft that has already gone through finalizeSeo()
 * @returns {object} a JSON-LD @graph document
 */
export function buildStructuredData(draft) {
  const pageId = `${draft.seo.canonical_url}#webpage`;
  const orgId = `${SITE_ORIGIN}/#organization`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': orgId,
        name: 'American Institute of Modern Trichology',
        alternateName: 'AIMT',
        url: `${SITE_ORIGIN}/`,
      },
      {
        '@type': 'WebPage',
        '@id': pageId,
        url: draft.seo.canonical_url,
        name: draft.seo.h1,
        description: draft.seo.meta_description,
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        about: { '@id': orgId },
        publisher: { '@id': orgId },
        // No datePublished/dateModified: this page is not published.
        // No author: institutional content, not attributed to an individual.
        // No review/aggregateRating: none exist.
      },
    ],
  };
}
