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
   ═══════════════════════════════════════════════════════════════ */

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
 * @param {string} hubHtml - the current hub file's full contents
 * @param {string} cardHtml - buildHubCardHtml() output
 * @returns {string} the updated hub file contents
 */
export function insertHubCard(hubHtml, cardHtml) {
  const gridOpen = '<ul class="aimt-edu-card-grid">';
  const gridClose = '</ul>';
  const openIdx = hubHtml.indexOf(gridOpen);
  if (openIdx === -1) throw new HubUpdateError('insertHubCard: could not find <ul class="aimt-edu-card-grid"> in the hub file -- refusing to guess.');
  const closeIdx = hubHtml.indexOf(gridClose, openIdx);
  if (closeIdx === -1) throw new HubUpdateError('insertHubCard: found the grid opening tag but no matching closing </ul> after it.');

  if (hubHtml.includes(cardHtml.trim())) {
    throw new HubUpdateError('insertHubCard: this exact card already appears in the hub file -- refusing to insert a duplicate.');
  }

  return hubHtml.slice(0, closeIdx) + cardHtml + '\n  ' + hubHtml.slice(closeIdx);
}
