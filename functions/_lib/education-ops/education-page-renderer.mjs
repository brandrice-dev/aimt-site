/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — generic Education page renderer
   ---------------------------------------------------------------
   PURE. Turns a VALIDATED Education Page Plan into the same production
   HTML shape as the two hand-built pages (education/hair-loss/
   hair-growth-cycle.html, education/hair-loss/telogen-effluvium.html)
   -- hero, badge, sticky TOC, evidence-forward sections, scope callout,
   key takeaways, sources, related links -- reusing ONLY the existing
   assets/css/aimt-education.css classes, the existing nav/footer
   markup, and the existing orbital-mark SVG symbol. No new CSS, no new
   visual component. If a topic's Page Plan needs something this
   renderer cannot express with the existing class set, that is an
   INFRA_REVIEW signal for the orchestrator to raise -- this module
   itself never invents a new class to route around a limitation.
   ═══════════════════════════════════════════════════════════════ */

const SITE_ORIGIN = 'https://aimtrichology.com';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderUnit(unit) {
  return unit.kind === 'FRAMING'
    ? `<p><em>${escapeHtml(unit.text)}</em></p>`
    : `<p>${escapeHtml(unit.text)}</p>`;
}

function slugForToc(sectionId) {
  return escapeHtml(sectionId);
}

function renderTocLinks(plan) {
  const links = [
    ...plan.sections.map((s) => `<a href="#${slugForToc(s.section_id)}">${escapeHtml(s.heading)}</a>`),
    `<a href="#scope">Scope &amp; limitations</a>`,
    `<a href="#key-takeaways">Key takeaways</a>`,
    `<a href="#sources">Sources</a>`,
    `<a href="#related">Related AIMT</a>`,
  ];
  return links.join('\n      ');
}

function renderSections(plan) {
  return plan.sections.map((s) => `
    <section class="aimt-legal-doc__section" id="${slugForToc(s.section_id)}">
      <h2>${escapeHtml(s.heading)}</h2>
      ${s.units.map(renderUnit).join('\n      ')}
    </section>`).join('\n');
}

function renderSources(sources) {
  return sources.map((s) => {
    const authors = s.authors && s.authors.length ? escapeHtml(s.authors.join(', ')) + '. ' : '';
    const linked = s.url ? `<a href="${escapeHtml(s.url)}" rel="noopener">${escapeHtml(s.title)}</a>` : escapeHtml(s.title);
    const meta = [s.year, s.doi ? `doi: ${escapeHtml(s.doi)}` : null].filter(Boolean).join(' · ');
    return `        <li class="aimt-edu-source"><span><span class="aimt-edu-source-title">${authors}${linked}</span><span class="aimt-edu-source-meta">${meta}</span></span></li>`;
  }).join('\n');
}

function renderRelatedLinks(links) {
  return links.map((l) => `        <li><a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a></li>`).join('\n');
}

function renderTakeaways(units) {
  return units.map((u, i) => `        <li class="aimt-edu-takeaway">
          <span class="aimt-edu-takeaway-index">${String(i + 1).padStart(2, '0')}</span>
          <p>${escapeHtml(u.text)}</p>
        </li>`).join('\n');
}

/**
 * @param {object} plan - a plan that has PASSED
 *   validateEducationPagePlan() (education-page-plan-validator.mjs)
 * @returns {string} a complete, production-shaped HTML document
 */
export function renderEducationPageHtml(plan) {
  const canonicalUrl = `${SITE_ORIGIN}${plan.route}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(plan.title)}</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="description" content="${escapeHtml(plan.meta_description)}">
<!-- AUTONOMOUSLY GENERATED (AIMT Education Operations v1). Preview-only
     until owner review approves launch: this route is not yet in
     sitemap.xml and this tag remains until launch prep removes it. -->
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="${escapeHtml(canonicalUrl)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="AIMT">
<meta property="og:title" content="${escapeHtml(plan.h1)}">
<meta property="og:description" content="${escapeHtml(plan.meta_description)}">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(plan.h1)}">
<meta name="twitter:description" content="${escapeHtml(plan.meta_description)}">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": "${SITE_ORIGIN}/#organization", "name": "American Institute of Modern Trichology", "alternateName": "AIMT", "url": "${SITE_ORIGIN}/" },
    { "@type": "WebPage", "@id": "${escapeHtml(canonicalUrl)}#webpage", "url": "${escapeHtml(canonicalUrl)}", "name": "${escapeHtml(plan.h1)}", "description": "${escapeHtml(plan.meta_description)}", "isPartOf": { "@id": "${SITE_ORIGIN}/#website" }, "about": { "@id": "${SITE_ORIGIN}/#organization" }, "publisher": { "@id": "${SITE_ORIGIN}/#organization" } }
  ]
}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/aimt-design-system.css">
<link rel="stylesheet" href="/assets/css/aimt-supporting-pages.css">
<link rel="stylesheet" href="/assets/css/aimt-public-nav.css">
<link rel="stylesheet" href="/assets/css/aimt-education.css">
</head>
<body class="aimt-legal-body">
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="aimtOrbitalMark" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="20" stroke="currentColor" stroke-width="0.75" opacity="0.6"/>
    <circle cx="22" cy="22" r="13.5" stroke="currentColor" stroke-width="0.5" opacity="0.3"/>
    <circle cx="22" cy="22" r="7" stroke="currentColor" stroke-width="0.5" opacity="0.2"/>
    <circle cx="22" cy="22" r="2" fill="currentColor"/>
    <circle cx="22" cy="2" r="1.5" fill="currentColor" opacity="0.75"/>
    <circle cx="36.1" cy="7.9" r="1.5" fill="currentColor" opacity="0.75"/>
    <circle cx="42" cy="22" r="1.5" fill="currentColor" opacity="0.75"/>
    <circle cx="36.1" cy="36.1" r="1.5" fill="currentColor" opacity="0.75"/>
    <circle cx="22" cy="42" r="1.5" fill="currentColor" opacity="0.75"/>
    <circle cx="7.9" cy="36.1" r="1.5" fill="currentColor" opacity="0.75"/>
    <circle cx="2" cy="22" r="1.5" fill="currentColor" opacity="0.75"/>
    <circle cx="7.9" cy="7.9" r="1.5" fill="currentColor" opacity="0.75"/>
  </symbol>
</svg>

<nav class="aimt-public-nav aimt-public-nav--sticky">
  <a href="/" class="aimt-public-nav-mark"><svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><use href="#aimtOrbitalMark"></use></svg></a>
  <a href="/" class="aimt-public-nav-wordmark"><span class="aimt-public-nav-name">AIMT</span></a>
  <div class="aimt-public-nav-right">
    <div class="aimt-public-nav-links">
      <a href="/courses" class="aimt-public-nav-link">Courses</a>
      <a href="/about" class="aimt-public-nav-link">About</a>
      <a href="/student-access.html" class="aimt-public-nav-link">Student Access</a>
    </div>
    <button type="button" class="aimt-public-nav-hamburger" id="navHamburger" aria-expanded="false" aria-controls="navMobileMenu" aria-label="Menu">
      <span class="aimt-public-nav-hamburger-line"></span><span class="aimt-public-nav-hamburger-line"></span><span class="aimt-public-nav-hamburger-line"></span>
    </button>
  </div>
</nav>
<div class="aimt-public-nav-mobile-menu" id="navMobileMenu" aria-hidden="true">
  <a href="/courses" class="aimt-public-nav-mobile-link">Courses</a>
  <a href="/about" class="aimt-public-nav-mobile-link">About</a>
  <a href="/student-access.html" class="aimt-public-nav-mobile-link">Student Access</a>
</div>

<div class="aimt-sp-depth-secondary">
  <div class="aimt-edu-hero">
    <span class="aimt-sp-eyebrow">AIMT Education Library</span>
    <h1>${escapeHtml(plan.h1)}</h1>
    <p class="aimt-edu-lede"><strong>${escapeHtml(plan.answer_summary.text)}</strong></p>
    <a href="/about/research-standards" class="aimt-edu-badge"><span class="aimt-edu-badge-dot"></span>Reviewed under the AIMT evidence standard · ${plan.sources.length} cleared sources · Practitioner education</a>
  </div>
</div>

<div class="aimt-legal-wrap">
  <aside class="aimt-legal-toc">
    <span class="aimt-legal-toc-label">On this page</span>
    <div class="aimt-legal-toc-inner">
      ${renderTocLinks(plan)}
    </div>
  </aside>

  <article class="aimt-legal-doc aimt-edu-article">
${renderSections(plan)}

    <section class="aimt-edu-scope" id="scope">
      <h2>What this page can — and cannot — tell you</h2>
      <p class="aimt-legal-flag"><em>Scope: ${escapeHtml(plan.scope_note)}</em></p>
      ${plan.limitations.map(renderUnit).join('\n      ')}
    </section>

    <section class="aimt-legal-doc__section" id="key-takeaways">
      <h2>Key takeaways</h2>
      <ul class="aimt-edu-takeaways">
${renderTakeaways(plan.key_takeaways)}
      </ul>
    </section>

    <section class="aimt-legal-doc__section" id="sources">
      <h2>Sources &amp; references</h2>
      <p class="aimt-edu-sources-note">The cleared source set supporting this page's evidence review.</p>
      <ol class="aimt-edu-sources">
${renderSources(plan.sources)}
      </ol>
    </section>

    <section class="aimt-legal-doc__section" id="related">
      <h2>Related AIMT learning</h2>
      <ul class="aimt-edu-related">
${renderRelatedLinks(plan.related_links)}
      </ul>
    </section>

  </article>
</div>

<footer class="aimt-footer">
  <div class="aimt-footer-bottom is-standalone">
    <a href="/">AIMT</a> · <a href="/about">About</a> · <a href="/about/standards">Standards</a> · <a href="/about/research-standards">Research Standards</a> · <a href="/education">Education</a> · <a href="/courses">Courses</a> · <a href="/verify">Verify Credential</a> · <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a> · <a href="/refunds">Refunds</a>
  </div>
</footer>
<script src="/assets/js/aimt-public-nav.js"></script>
</body>
</html>
`;
}
