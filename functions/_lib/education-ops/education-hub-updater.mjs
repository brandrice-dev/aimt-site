/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — cluster hub card insertion
   ---------------------------------------------------------------
   PURE string transform. Inserts one new `<li>` card into an existing
   cluster hub file's `.aimt-edu-card-grid`, matching the EXACT markup
   pattern the hand-built hair-cycle/telogen-effluvium cards already
   use -- no new CSS class, no new visual pattern. Refuses (throws)
   rather than guessing if the expected grid markup isn't found, so a
   hub file that has drifted from the expected shape becomes an
   INFRA_REVIEW signal instead of a corrupted file.

   MULTI-CLUSTER: the hub for a route is resolved ONLY from the
   authoritative publication registry (resolveHubForRoute) -- never from
   string surgery on the route. insertHubCard() additionally refuses a
   card whose href is outside the hub's own cluster prefix, or a hub file
   whose canonical URL is not that cluster's hub route, so a card can
   never land in the wrong cluster's hub.

   EMPTY HUBS: a newly-created cluster hub with no articles yet carries
   EMPTY_HUB_ROBOTS_META (noindex, follow) so an empty collection page is
   never indexed. Inserting the FIRST card removes that one exact line,
   so the hub becomes indexable at the moment it has real content.
   ═══════════════════════════════════════════════════════════════ */

import { clusterForRoute } from './education-publication-registry.mjs';

const SITE_ORIGIN = 'https://aimtrichology.com';

export const EMPTY_HUB_ROBOTS_META = '<meta name="robots" content="noindex, follow" data-aimt-empty-hub>';

export class HubUpdateError extends Error {
  constructor(message) {
    super(message);
    this.name = 'HubUpdateError';
  }
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * @param {{route: string, h1: string, meta_description: string, sourceCount: number}} plan
 */
export function buildHubCardHtml({ route, h1, meta_description, sourceCount }) {
  return `    <li>
      <a href="${escapeHtml(route)}" class="aimt-edu-card aimt-edu-card--lg">
        <span class="aimt-edu-card-eyebrow">Practitioner Education</span>
        <span class="aimt-edu-card-title">${escapeHtml(h1)} <span class="aimt-edu-card-title-arrow">→</span></span>
        <p class="aimt-edu-card-desc">${escapeHtml(meta_description)}</p>
        <p class="aimt-edu-card-meta">${sourceCount} cleared sources · Practitioner education</p>
      </a>
    </li>`;
}

/**
 * PURE. The registered cluster hub for an article route. Throws (fails
 * closed) when the route is not directly under a registered cluster's
 * route prefix -- a hub is never guessed.
 *
 * @param {string} route - e.g. "/education/scalp-health/scalp-barrier-ph"
 * @returns {{clusterKey: string, hubFile: string, hubRoute: string}}
 */
export function resolveHubForRoute(route) {
  const cluster = clusterForRoute(route);
  if (!cluster) throw new HubUpdateError(`resolveHubForRoute: "${route}" is not under any registered publication cluster -- refusing to guess a hub.`);
  return { clusterKey: cluster.key, hubFile: cluster.hub_file, hubRoute: cluster.route_prefix };
}

/** PURE. True while a hub still carries the empty-hub noindex marker. */
export function isEmptyHub(hubHtml) {
  return typeof hubHtml === 'string' && hubHtml.includes(EMPTY_HUB_ROBOTS_META);
}

/**
 * @param {string} hubHtml - the current hub file's full contents
 * @param {string} cardHtml - buildHubCardHtml() output
 * @param {{hubRoute?: string}} [options] - when supplied (the real
 *   orchestrator always supplies it, from resolveHubForRoute()), the
 *   card's href must be directly under hubRoute and the hub file's
 *   canonical must be exactly hubRoute -- the cross-cluster guard.
 * @returns {string} the updated hub file contents
 */
export function insertHubCard(hubHtml, cardHtml, options = {}) {
  const gridOpen = '<ul class="aimt-edu-card-grid">';
  const gridClose = '</ul>';
  const openIdx = hubHtml.indexOf(gridOpen);
  if (openIdx === -1) throw new HubUpdateError('insertHubCard: could not find <ul class="aimt-edu-card-grid"> in the hub file -- refusing to guess.');
  const closeIdx = hubHtml.indexOf(gridClose, openIdx);
  if (closeIdx === -1) throw new HubUpdateError('insertHubCard: found the grid opening tag but no matching closing </ul> after it.');

  // HREF-DEDUP CORRECTION: check the TARGET ROUTE, not just the whole
  // card's exact text -- two cards for the same href with different
  // surrounding copy (a different h1/description/source count) are
  // still a duplicate card for the same page, and must be refused just
  // as firmly as a byte-identical repeat. Scoped to the grid's own
  // contents only (openIdx..closeIdx), so an unrelated nav/footer link
  // to the same route elsewhere on the hub page never triggers this.
  const hrefMatch = cardHtml.match(/href="([^"]*)"/);
  if (hrefMatch) {
    const hrefAttr = `href="${hrefMatch[1]}"`;
    if (hubHtml.slice(openIdx, closeIdx).includes(hrefAttr)) {
      throw new HubUpdateError(`insertHubCard: the hub already links to "${hrefMatch[1]}" -- refusing to insert a second card for the same route even though the surrounding card text differs.`);
    }
  }

  if (hubHtml.includes(cardHtml.trim())) {
    throw new HubUpdateError('insertHubCard: this exact card already appears in the hub file -- refusing to insert a duplicate.');
  }

  if (options.hubRoute !== undefined) {
    const href = hrefMatch ? hrefMatch[1] : '';
    if (!href.startsWith(`${options.hubRoute}/`)) {
      throw new HubUpdateError(`insertHubCard: card href "${href}" is not under this hub's cluster route "${options.hubRoute}" -- refusing a cross-cluster insertion.`);
    }
    if (!hubHtml.includes(`<link rel="canonical" href="${SITE_ORIGIN}${options.hubRoute}">`)) {
      throw new HubUpdateError(`insertHubCard: hub file's canonical is not "${SITE_ORIGIN}${options.hubRoute}" -- refusing to write a card into what may be the wrong hub.`);
    }
  }

  let updated = hubHtml.slice(0, closeIdx) + cardHtml + '\n  ' + hubHtml.slice(closeIdx);
  if (isEmptyHub(updated)) {
    updated = updated.replace(`${EMPTY_HUB_ROBOTS_META}\n`, '').replace(EMPTY_HUB_ROBOTS_META, '');
  }
  return updated;
}

/**
 * PURE, read-only check used by live verification (step 13): does the
 * CURRENT hub file contents already link to this route? Deliberately the
 * same simple href substring check insertHubCard() itself already uses
 * for its own dedup guard, exposed here for verification rather than
 * insertion.
 *
 * @param {string} hubHtml
 * @param {string} route
 * @returns {boolean}
 */
export function hubContainsRoute(hubHtml, route) {
  return typeof hubHtml === 'string' && hubHtml.includes(`href="${route}"`);
}
