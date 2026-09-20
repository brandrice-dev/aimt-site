/* ═══════════════════════════════════════════════════════════════
   AIMT Metric Ring — reusable render helper
   ---------------------------------------------------------------
   Generates the markup contract documented in
   assets/css/aimt-metric-ring.css. One place that produces the ring
   so every page that adopts it (My AIMT today; a future Readiness
   result and Module 12 Performance Review) stays visually and
   structurally identical instead of hand-rolling their own SVG.

   AIMTMetricRing.render({
     value,          // 0-100 the arc fills to (independent of what's
                      // shown in the center, so a future "87 / 100"
                      // score can display literally while the arc
                      // still fills to 87%).
     display,        // string shown large in the ring center, e.g. "58%".
                      // May contain a trailing '<span class="aimt-metric-ring-max">/100</span>'
                      // for a "78/100"-style compound value (Readiness).
     label,          // short mono label under the value, e.g. "Coursework".
     statusText,     // optional qualitative line under the ring, e.g. a
                      // future "Strong Foundation" / "Standard Met".
     size,           // optional 'lg' for the larger Readiness-scale
                      // presentation (assets/css/aimt-metric-ring.css's
                      // .aimt-metric-ring--lg). Omit for the default size.
     onLight,        // optional true if this ring sits on a light surface —
                      // applies .aimt-metric-ring--on-light, which turns
                      // down (not recolors) the active-arc glow so it
                      // doesn't read muddy against a light background.
                      // No current caller needs this; all three today
                      // are on dark surfaces.
     accessibleText  // the one sentence assistive tech receives, e.g.
                      // "Coursework progress: 58 percent, 7 of 12
                      // coursework units complete." The SVG and all
                      // visual text nodes are aria-hidden so this is
                      // the only thing announced.
   }) -> HTML string

   Draw-in: renders the arc at 0 and animates to its target value on
   the next frame (the CSS transition on .aimt-metric-ring-fill does
   the actual animating, capped at 550ms). Skipped entirely under
   prefers-reduced-motion — the arc paints at its final value with no
   transition, per assets/css/aimt-metric-ring.css's own reduced-motion
   override.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  let ringInstanceCount = 0;

  function escapeAttr(str) {
    return String(str == null ? '' : str).replace(/"/g, '&quot;');
  }

  function render(opts) {
    const r = 52;
    const circumference = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(100, Number(opts.value) || 0));
    const targetOffset = circumference * (1 - pct / 100);
    const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const initialOffset = reduceMotion ? targetOffset : circumference;
    const fillId = 'aimtMetricRingFill' + (++ringInstanceCount);
    const sizeClass = opts.size === 'lg' ? ' aimt-metric-ring--lg' : '';
    const lightClass = opts.onLight ? ' aimt-metric-ring--on-light' : '';

    const html =
      '<div class="aimt-metric-ring' + sizeClass + lightClass + '" role="img" aria-label="' + escapeAttr(opts.accessibleText) + '">' +
        '<svg class="aimt-metric-ring-svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">' +
          '<circle class="aimt-metric-ring-track" cx="60" cy="60" r="' + r + '"></circle>' +
          '<circle class="aimt-metric-ring-fill" id="' + fillId + '" cx="60" cy="60" r="' + r + '" ' +
            'style="stroke-dasharray:' + circumference.toFixed(2) + ';stroke-dashoffset:' + initialOffset.toFixed(2) + ';"></circle>' +
        '</svg>' +
        '<div class="aimt-metric-ring-center" aria-hidden="true">' +
          '<div class="aimt-metric-ring-value">' + (opts.display == null ? '' : opts.display) + '</div>' +
          '<div class="aimt-metric-ring-label">' + (opts.label == null ? '' : opts.label) + '</div>' +
        '</div>' +
      '</div>' +
      (opts.statusText ? '<div class="aimt-metric-ring-status" aria-hidden="true">' + opts.statusText + '</div>' : '');

    if (!reduceMotion) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          const el = document.getElementById(fillId);
          if (el) el.style.strokeDashoffset = targetOffset.toFixed(2);
        });
      });
    }

    return html;
  }

  window.AIMTMetricRing = { render: render };
})();
