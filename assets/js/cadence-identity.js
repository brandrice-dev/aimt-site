/* ═══════════════════════════════════════════════════════════════
   Cadence identity activation — window.CadenceIdentity.activate()
   ---------------------------------------------------------------
   Plays the large Cadence Check mark's activation moment. This is the
   SAME mechanism as the frozen Cadence intro's own mark turn
   (runOrbitalActivation() in assets/js/aimt-cadence-intro.js) --
   deliberately reused rather than invented, per explicit owner
   direction: the Check's activation must feel like the intro, not like
   a separate, more elaborate motion system.

   A prior version of this file swapped the resting mark for a
   completely different, more elaborate injected SVG (staggered node
   pulses, a comet-trace arc, a separate blurred bloom shape) on the
   theory that the plain intro-style turn is "nearly invisible" on a
   symmetric mark. That reasoning was backwards: the intro's own mark
   has the exact same 8-fold rotational symmetry and uses a bare turn
   anyway -- the turn was never meant to be the visible motion, the
   color/glow BRIGHTENING during it is. Swapping in a different,
   busier animation was an invented substitute, not a reproduction of
   the intro's actual, approved motion language, and read as cheap/
   frantic instead of premium and restrained.

   The mechanism, copied one-for-one from runOrbitalActivation()/
   runThinkingTurns() in aimt-cadence-intro.js:
     - the SAME resting mark element turns in place via the CSS `rotate`
       property (assets/css/cadence-identity.css already defines
       `transition: rotate 2600ms` on .cadence-id-icon, copied verbatim
       from the intro's own .intro-mark-icon rule) -- no new element, no
       swapped markup, nothing to restore afterward.
     - rotation ACCUMULATES (+360deg per activation) rather than
       resetting to 0 and back, exactly like the intro's
       currentIconRotateDeg() + 360 pattern -- this is what guarantees
       the CSS transition actually fires on every repeat entry (setting
       the same rotate value twice is a no-op; a new, larger value is
       never a no-op).
     - `.is-blooming` (already defined in cadence-identity.css, copied
       verbatim from the intro's own .is-blooming rules) is added just
       past halfway through the turn and removed as it completes --
       this is the ENTIRE glow: the halo's opacity rises, the icon's own
       color brightens, both via plain CSS transitions, nothing else.
   Timing constants below are the intro's own (ORBITAL_TURN_MS/
   ORBITAL_BLOOM_DELAY_MS/ORBITAL_SETTLE_MS in aimt-cadence-intro.js),
   not re-derived -- "copy the same motion inputs" means the same
   numbers too, not just the same category of motion.

   Respects prefers-reduced-motion: no rotation/glow for those users --
   activate() resolves after a short, deliberate pause instead (the
   resting mark never changes), so the handoff still reads as one
   intentional moment rather than an instant jump. Same approach the
   intro itself takes (introInstantMode in aimt-cadence-intro.js).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  // Identical to the intro's own ORBITAL_TURN_MS/ORBITAL_BLOOM_DELAY_MS/
  // ORBITAL_SETTLE_MS (aimt-cadence-intro.js) -- one full, deliberate
  // clockwise turn, a glow that rises just past halfway through it and
  // settles back down as it lands, then a brief quiet beat before the
  // caller advances.
  var ORBITAL_TURN_MS = 2600;
  var ORBITAL_BLOOM_DELAY_MS = 1330;
  var ORBITAL_SETTLE_MS = 350;
  var REDUCED_MOTION_PAUSE_MS = 350;

  // Same parsing the intro uses (currentIconRotateDeg()) to read whatever
  // rotation is already applied and add another full turn on top of it,
  // rather than resetting to 0first -- see file header for why that
  // matters for repeat activations.
  function currentIconRotateDeg(icon) {
    var raw = icon.style.rotate || getComputedStyle(icon).rotate || '0deg';
    var m = String(raw).match(/-?[\d.]+/);
    return m ? parseFloat(m[0]) : 0;
  }

  function activate(markEl) {
    if (!markEl) return Promise.resolve();
    var icon = markEl.querySelector('.cadence-id-icon');
    if (!icon) return Promise.resolve();

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return new Promise(function (resolve) { setTimeout(resolve, REDUCED_MOTION_PAUSE_MS); });
    }

    icon.style.rotate = (currentIconRotateDeg(icon) + 360) + 'deg';

    return new Promise(function (resolve) {
      setTimeout(function () { markEl.classList.add('is-blooming'); }, ORBITAL_BLOOM_DELAY_MS);
      setTimeout(function () { markEl.classList.remove('is-blooming'); }, ORBITAL_TURN_MS);
      setTimeout(resolve, ORBITAL_TURN_MS + ORBITAL_SETTLE_MS);
    });
  }

  // No markup was ever swapped, so there is nothing to restore -- kept
  // as a harmless no-op purely so cadence-shell.js's existing
  // `if (window.CadenceIdentity.restoreResting) ...` call site (which
  // runs while the card is fading, before the next entry) needs no
  // change. Defensively clears the animation classes in case a caller
  // ever invokes it mid-turn.
  function restoreResting(markEl) {
    if (!markEl) return;
    markEl.classList.remove('is-blooming');
  }

  window.CadenceIdentity = { activate: activate, restoreResting: restoreResting };
})();
