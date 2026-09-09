/* ═══════════════════════════════════════════════════════════════
   Cadence identity activation — window.CadenceIdentity.activate()
   ---------------------------------------------------------------
   Plays the exact one-time turn+glow used by the Cadence intro's own
   runOrbitalActivation() (assets/js/aimt-cadence-intro.js) on any
   .cadence-id element elsewhere on the site (Cadence Checks, the Ask
   Cadence panel) -- same constants (2600ms turn, bloom at 1330ms,
   350ms settle after the glow fades before resolving -- runOrbital-
   Activation()'s own ORBITAL_TURN_MS/BLOOM_DELAY_MS/SETTLE_MS) and the
   exact same three-setTimeout structure (add bloom / remove bloom /
   resolve), just against a generic .cadence-id instead of the intro's
   one hardcoded mark, and turning by (turns * 360) rather than a fixed
   360 since this one gets activated repeatedly across a session (the
   intro only ever plays once). The intro file itself is untouched --
   this is a separate, small, additive module.

   Returns a Promise that resolves once the mark has visibly turned,
   bloomed, and settled back down -- callers that gate further UI on
   the activation being SEEN (e.g. cadence-shell.js's wireCheckpoint(),
   which must not open the checkpoint shell until the large mark's
   turn+glow has actually played, not just been triggered) must await
   it rather than opening on their own fixed timer.

   Never loops or spins continuously: each call turns once and settles.
   Respects prefers-reduced-motion: no rotation/glow for those users
   (mark stays in its normal resting state, matching cadence-
   identity.css's own reduced-motion block) -- but activate() still
   resolves after a short deliberate pause rather than instantly, so a
   caller sequencing "activate -> fade card -> open next view" still
   reads as one intentional transition, not an instant jump.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var TURN_MS = 2600;
  var BLOOM_DELAY_MS = 1330;
  var SETTLE_MS = 350;
  var REDUCED_MOTION_PAUSE_MS = 350;

  function activate(markEl) {
    if (!markEl) return Promise.resolve();
    var icon = markEl.querySelector('.cadence-id-icon');
    if (!icon) return Promise.resolve();

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return new Promise(function (resolve) { setTimeout(resolve, REDUCED_MOTION_PAUSE_MS); });
    }

    var turns = (parseInt(icon.getAttribute('data-cadence-turns'), 10) || 0) + 1;
    icon.setAttribute('data-cadence-turns', String(turns));
    icon.style.rotate = (turns * 360) + 'deg';

    return new Promise(function (resolve) {
      setTimeout(function () { markEl.classList.add('is-blooming'); }, BLOOM_DELAY_MS);
      setTimeout(function () { markEl.classList.remove('is-blooming'); }, TURN_MS);
      setTimeout(resolve, TURN_MS + SETTLE_MS);
    });
  }

  window.CadenceIdentity = { activate: activate };
})();
