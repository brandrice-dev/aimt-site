/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — sitemap route insertion
   ---------------------------------------------------------------
   PURE string transform, same posture as education-hub-updater.mjs:
   inserts one new <url><loc>...</loc></url> entry into the existing
   sitemap.xml, refusing (throwing) rather than guessing if the expected
   markup isn't found or the route is already present. A --prepare run
   never calls this (a prepared page is intentionally not yet in the
   sitemap); only the production publish lane's launch-ready commit does.
   ═══════════════════════════════════════════════════════════════ */

const SITE_ORIGIN = 'https://aimtrichology.com';

export class SitemapUpdateError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SitemapUpdateError';
  }
}

/**
 * @param {string} sitemapXml - the current sitemap.xml file contents
 * @param {string} route - an absolute path, e.g. "/education/hair-loss/alopecia-areata"
 * @returns {string} the updated sitemap.xml contents
 */
export function insertSitemapRoute(sitemapXml, route) {
  const closeTag = '</urlset>';
  const closeIdx = sitemapXml.indexOf(closeTag);
  if (closeIdx === -1) {
    throw new SitemapUpdateError('insertSitemapRoute: could not find </urlset> in sitemap.xml -- refusing to guess.');
  }
  const loc = `${SITE_ORIGIN}${route}`;
  if (sitemapXml.includes(`<loc>${loc}</loc>`)) {
    throw new SitemapUpdateError(`insertSitemapRoute: sitemap.xml already contains "${loc}" -- refusing to insert a duplicate entry.`);
  }
  const entry = `  <url><loc>${loc}</loc></url>\n`;
  return sitemapXml.slice(0, closeIdx) + entry + sitemapXml.slice(closeIdx);
}

/**
 * PURE, read-only check used by live verification (step 13): does the
 * CURRENT sitemap.xml contents already contain this exact route?
 *
 * @param {string} sitemapXml
 * @param {string} route
 * @returns {boolean}
 */
export function sitemapContainsRoute(sitemapXml, route) {
  return typeof sitemapXml === 'string' && sitemapXml.includes(`<loc>${SITE_ORIGIN}${route}</loc>`);
}
