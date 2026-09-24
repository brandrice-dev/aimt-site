/* ═══════════════════════════════════════════════════════════════
   AIMT Page Builder v1 — deterministic HTML preview renderer
   ---------------------------------------------------------------
   PURE. Renders a validated draft to an HTML string, reusing this
   repo's existing design system (aimt-design-system.css / aimt-
   supporting-pages.css / aimt-public-nav.css and the same nav/eyebrow
   markup pattern as about/research-standards.html) so the shadow
   preview honestly represents what the page would look like -- not a
   plain unstyled dump.

   This module NEVER writes a file itself and is never pointed at a live
   route path -- scripts/page-builder-shadow.mjs writes its return value
   under gitignored research-import/, and nothing in this repo's routing
   (_redirects, Cloudflare Pages static serving) references that output
   path.
   ═══════════════════════════════════════════════════════════════ */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderParagraph(p) {
  return `<p>${escapeHtml(p.text)}</p>`;
}

function renderSection(section, scopeNote) {
  // The cleared scope note is rendered here, in the limitations/scope
  // section -- a distinct, verbatim block, never merged into or
  // replaced by the SEO meta description (see page-builder-draft.mjs's
  // scope_note field and page-builder-validator.mjs's
  // SCOPE_NOTE_NOT_PRESERVED rule for why the two are kept separate).
  const scopeBlock = section.section_id === 'limitations' && scopeNote
    ? `<p class="aimt-page-builder-scope-note"><em>Scope: ${escapeHtml(scopeNote)}</em></p>\n  `
    : '';
  return `
<section class="aimt-legal-doc__section" id="${escapeHtml(section.section_id)}">
  <h2>${escapeHtml(section.heading)}</h2>
  ${scopeBlock}${section.paragraphs.map(renderParagraph).join('\n  ')}
</section>`;
}

function renderSources(sources) {
  const items = sources.map((s) => {
    const authors = s.authors.length ? s.authors.join(', ') : null;
    const year = s.year ? ` (${s.year})` : '';
    const linked = s.url ? `<a href="${escapeHtml(s.url)}" rel="noopener">${escapeHtml(s.title || s.source_id)}</a>` : escapeHtml(s.title || s.source_id);
    return `<li>${authors ? escapeHtml(authors) + '. ' : ''}${linked}${year}${s.doi ? ` — doi: ${escapeHtml(s.doi)}` : ''}</li>`;
  });
  return `<ol class="aimt-page-builder-sources">${items.join('\n')}</ol>`;
}

function renderRelatedLinks(links) {
  return `<ul class="aimt-page-builder-related">${links.map((l) => `<li><a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a></li>`).join('\n')}</ul>`;
}

/**
 * @param {object} draft - a validated, SEO-finalized draft
 * @param {object} structuredData - page-builder-seo.mjs#buildStructuredData() output
 * @returns {string} a complete HTML document string
 */
export function renderDraftHtml(draft, structuredData) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(draft.seo.title)}</title>
<meta name="description" content="${escapeHtml(draft.seo.meta_description)}">
<link rel="canonical" href="${escapeHtml(draft.seo.canonical_url)}">
<!-- SHADOW PREVIEW ONLY -- not a live route. See research-import/page-builder-shadow/ provenance. -->
<script type="application/ld+json">
${JSON.stringify(structuredData, null, 2)}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/aimt-design-system.css">
<link rel="stylesheet" href="/assets/css/aimt-supporting-pages.css">
<link rel="stylesheet" href="/assets/css/aimt-public-nav.css">
</head>
<body class="aimt-legal-body">
<div class="aimt-legal-wrap">
  <article class="aimt-legal-doc">
    <span class="aimt-sp-eyebrow" style="margin-bottom:0.9rem;">AIMT Education Library</span>
    <h1>${escapeHtml(draft.seo.h1)}</h1>
    <p class="aimt-page-builder-answer-summary"><strong>${escapeHtml(draft.answer_summary.text)}</strong></p>
    ${draft.sections.map((s) => renderSection(s, draft.scope_note)).join('\n')}
    <section class="aimt-legal-doc__section" id="key-takeaways">
      <h2>Key takeaways</h2>
      <ul>${draft.key_takeaways.map((t) => `<li>${escapeHtml(t.text)}</li>`).join('\n')}</ul>
    </section>
    <section class="aimt-legal-doc__section" id="sources">
      <h2>Sources &amp; references</h2>
      ${renderSources(draft.sources)}
    </section>
    <section class="aimt-legal-doc__section" id="related-learning">
      <h2>Related AIMT learning</h2>
      ${renderRelatedLinks(draft.related_links)}
    </section>
  </article>
</div>
</body>
</html>
`;
}
