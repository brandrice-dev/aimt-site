/* ═══════════════════════════════════════════════════════════════
   Cadence identity activation — window.CadenceIdentity.activate()
   ---------------------------------------------------------------
   Plays the exact one-time turn+glow used by the Cadence intro's own
   runOrbitalActivation() (assets/js/aimt-cadence-intro.js) on any
   .cadence-id element elsewhere on the site (Cadence Checks, the Ask
   Cadence panel). Same constants (2600ms turn, bloom at 1330ms, one
   360° step per call), same mechanism (set the CSS `rotate` property,
   let the .cadence-id-icon transition declared in cadence-identity.css
   animate it; toggle .is-blooming for the glow). The intro file itself
   is untouched -- this is a separate, small, additive module.

   Never loops or spins continuously: each call turns once and settles.
   Respects prefers-reduced-motion -- for those users this is a no-op,
   the mark stays in its normal resting state (see cadence-identity.css).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var TURN_MS = 2600;
  var BLOOM_DELAY_MS = 1330;

  function activate(markEl) {
    if (!markEl) return;
    var icon = markEl.querySelector('.cadence-id-icon');
    if (!icon) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var turns = (parseInt(icon.getAttribute('data-cadence-turns'), 10) || 0) + 1;
    icon.setAttribute('data-cadence-turns', String(turns));
    icon.style.rotate = (turns * 360) + 'deg';

    setTimeout(function () { markEl.classList.add('is-blooming'); }, BLOOM_DELAY_MS);
    setTimeout(function () { markEl.classList.remove('is-blooming'); }, TURN_MS);
  }

  window.CadenceIdentity = { activate: activate };
})();
