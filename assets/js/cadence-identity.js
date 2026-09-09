/* ═══════════════════════════════════════════════════════════════
   Cadence identity activation — window.CadenceIdentity.activate()
   ---------------------------------------------------------------
   Plays the large Cadence Check mark's activation moment: the owner-
   supplied designer asset assets/brand/cadence/cadence-mark-activation.svg,
   embedded verbatim below (CADENCE_ACTIVATION_SVG) so this critical,
   must-be-visible moment never depends on a network fetch resolving in
   time -- same reasoning as aimt-cadence-intro.js's own hardcoded
   ORBITAL_MARK_PATHS constant.

   WHY THIS EXISTS (replaces an earlier plain-rotate(360deg) approach):
   a bare rotation of the canonical orbital mark is nearly invisible --
   the mark has 8-fold rotational symmetry (nodes every 45°), so a full
   360° turn looks close to identical at every point along the way, and
   the intro shares this exact same symmetric mark/mechanism, so
   reproducing it more literally would not have fixed anything. The
   designer's activation asset solves this with genuine asymmetric
   motion instead of a symmetry-doomed spin:
     - the outer ring + all 8 nodes (.cdact-outerSystem) rotate a full
       360° together (the base turn, same concept as the intro's own
       mark turn)
     - each of the 8 nodes ALSO pulses (scale 1 -> 1.24 -> 1) on its own
       staggered delay (120ms apart), so they visibly light up one after
       another around the ring -- a "traveling signal," not a static
       spin
     - a short comet-like dashed arc (.cdact-trace) sweeps around the
       ring once, fading in and out as it travels
     - the center core scales up and a separate blurred .cdact-bloom
       circle pulses outward -- the glow/bloom moment
   Total authored duration: 2300ms (ACTIVATION_MS below) -- everything
   above is fully resolved by then (the last ~30% of each element's own
   2300ms local timeline, after staggered delays, is just a static hold,
   confirmed by reading the source keyframes directly rather than
   assuming). Stretched up from an original 1600ms (owner QA: wanted the
   activation to read as ~2-3 deliberate seconds, not a fast flash) --
   every duration/delay below is scaled by the same ratio, so the
   choreography's proportions are unchanged, only its pace.

   Every class/keyframe/filter name from the source file is prefixed
   `cdact-` here (SVG <style> blocks are NOT scoped to their own
   fragment when injected inline into an HTML document -- they become
   ordinary global page rules) purely as collision insurance against
   this large, multi-thousand-line site ever independently introducing
   a bare `.core`/`.node`/`.ring` class; this repo currently has none,
   confirmed by grep, but the prefix costs nothing and removes the
   category of bug entirely.

   activate(markEl) injects a FRESH copy of this markup into markEl's
   `.cadence-id-icon` slot every time -- new DOM nodes, not a class
   toggle -- which is what guarantees the animation actually restarts
   from its 0% keyframe on every repeat entry (a class-toggle restart
   can silently no-op if the browser coalesces the reflow). Returns a
   Promise that resolves once the animation's real, authored duration
   has elapsed, so callers (cadence-shell.js's wireCheckpoint()) can
   await the mark being ACTUALLY SEEN before advancing to the next view.

   Respects prefers-reduced-motion: no injected animation for those
   users -- activate() resolves after a short, deliberate pause instead
   (the resting mark never changes), so the handoff still reads as one
   intentional moment rather than an instant jump.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  // Duration bumped from the original 1600ms to 2300ms (owner QA: "spins
  // too fast" / "do not make it a fast flash" -- wanted an activation
  // that reads as ~2-3 seconds of deliberate Cadence focusing, not a
  // loading-spinner blip). Every per-element animation-duration below and
  // every node's animation-delay is scaled by the same 2300/1600 ratio
  // (x1.4375) so the choreography (orbit -> node signal travel -> core
  // bloom -> settle) keeps its original proportions, just stretched.
  var ACTIVATION_MS = 2300;
  var REDUCED_MOTION_PAUSE_MS = 350;

  var CADENCE_ACTIVATION_SVG =
    '<svg class="cadence-id-icon cadence-id-icon-activation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" role="img" aria-hidden="true" style="color:#F2EEE6">' +
      '<defs>' +
        '<filter id="cdact-bloom-filter" x="-120%" y="-120%" width="340%" height="340%" color-interpolation-filters="sRGB">' +
          '<feGaussianBlur stdDeviation="4.6"/>' +
        '</filter>' +
      '</defs>' +
      '<style>' +
        '.cdact-ring{fill:none;stroke:currentColor;vector-effect:non-scaling-stroke}' +
        '.cdact-outer{stroke-width:1.6;opacity:.94}' +
        '.cdact-middle{stroke-width:1.3;opacity:.60;animation:cdact-innerFocus 2300ms cubic-bezier(.22,.61,.36,1) both}' +
        '.cdact-inner{stroke-width:1.15;opacity:.40;animation:cdact-innerFocus 2300ms cubic-bezier(.22,.61,.36,1) both}' +
        '.cdact-node{fill:currentColor;opacity:.92;transform-box:fill-box;transform-origin:center;animation:cdact-nodeSignal 2300ms cubic-bezier(.22,.61,.36,1) both}' +
        '.cdact-core{fill:currentColor;opacity:.98;transform-origin:50px 50px;animation:cdact-coreFocus 2300ms cubic-bezier(.22,.61,.36,1) both}' +
        '.cdact-outerSystem{transform-origin:50px 50px;animation:cdact-outerOrbit 2300ms cubic-bezier(.22,.61,.36,1) both}' +
        '.cdact-trace{fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-dasharray:13 214;opacity:0;vector-effect:non-scaling-stroke;animation:cdact-tracePass 2300ms cubic-bezier(.22,.61,.36,1) both}' +
        '.cdact-bloom{fill:currentColor;opacity:0;filter:url(#cdact-bloom-filter);transform-origin:50px 50px;animation:cdact-bloomPulse 2300ms cubic-bezier(.22,.61,.36,1) both}' +
        '.cdact-n1{animation-delay:173ms}.cdact-n2{animation-delay:295ms}.cdact-n3{animation-delay:417ms}.cdact-n4{animation-delay:539ms}.cdact-n5{animation-delay:661ms}.cdact-n6{animation-delay:784ms}.cdact-n7{animation-delay:906ms}.cdact-n8{animation-delay:1028ms}' +
        '@keyframes cdact-outerOrbit{0%,8%{transform:rotate(0deg)}68%{transform:rotate(360deg)}100%{transform:rotate(360deg)}}' +
        '@keyframes cdact-tracePass{0%,9%{opacity:0;stroke-dashoffset:0}16%{opacity:.72}64%{opacity:.25;stroke-dashoffset:-212}72%,100%{opacity:0;stroke-dashoffset:-212}}' +
        '@keyframes cdact-nodeSignal{0%,12%,78%,100%{opacity:.92;transform:scale(1)}30%{opacity:1;transform:scale(1.24)}42%{opacity:.92;transform:scale(1)}}' +
        '@keyframes cdact-innerFocus{0%,38%,100%{opacity:var(--cdact-rest,.60)}62%{opacity:.88}}' +
        '@keyframes cdact-coreFocus{0%,36%,100%{transform:scale(1);opacity:.98}60%{transform:scale(1.20);opacity:1}72%{transform:scale(1.04);opacity:1}}' +
        /* Bloom peak roughly doubled (.16 -> .32, .05 -> .12) -- owner QA:
           "little/no visible premium glow" against the original's fairly
           faint pulse. Still a soft blurred wash, not a neon ring. */
        '@keyframes cdact-bloomPulse{0%,42%,100%{opacity:0;transform:scale(.65)}59%{opacity:.32;transform:scale(1.15)}76%{opacity:.12;transform:scale(1.55)}}' +
        '@media (prefers-reduced-motion:reduce){.cdact-outerSystem,.cdact-trace,.cdact-node,.cdact-core,.cdact-middle,.cdact-inner,.cdact-bloom{animation:none!important}}' +
      '</style>' +
      '<circle class="cdact-bloom" cx="50" cy="50" r="13"/>' +
      '<circle class="cdact-ring cdact-middle" style="--cdact-rest:.60" cx="50" cy="50" r="24.5"/>' +
      '<circle class="cdact-ring cdact-inner" style="--cdact-rest:.40" cx="50" cy="50" r="13.5"/>' +
      '<circle class="cdact-core" cx="50" cy="50" r="4.2"/>' +
      '<g class="cdact-outerSystem">' +
        '<circle class="cdact-ring cdact-outer" cx="50" cy="50" r="36"/>' +
        '<circle class="cdact-trace" cx="50" cy="50" r="36"/>' +
        '<circle class="cdact-node cdact-n1" cx="50" cy="14" r="3"/><circle class="cdact-node cdact-n2" cx="75.456" cy="24.544" r="3"/>' +
        '<circle class="cdact-node cdact-n3" cx="86" cy="50" r="3"/><circle class="cdact-node cdact-n4" cx="75.456" cy="75.456" r="3"/>' +
        '<circle class="cdact-node cdact-n5" cx="50" cy="86" r="3"/><circle class="cdact-node cdact-n6" cx="24.544" cy="75.456" r="3"/>' +
        '<circle class="cdact-node cdact-n7" cx="14" cy="50" r="3"/><circle class="cdact-node cdact-n8" cx="24.544" cy="24.544" r="3"/>' +
      '</g>' +
    '</svg>';

  function activate(markEl) {
    if (!markEl) return Promise.resolve();
    var icon = markEl.querySelector('.cadence-id-icon');
    if (!icon) return Promise.resolve();

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return new Promise(function (resolve) { setTimeout(resolve, REDUCED_MOTION_PAUSE_MS); });
    }

    // markEl.dataset.cadenceRestingIcon: the resting icon's own markup,
    // captured once (first activation) so it can be restored after --
    // restoreResting() below, called by the caller once the card is no
    // longer visible. Not restored automatically here: while the
    // animation's *final* frame is visually close to resting, swapping
    // mid-visibility would still be a needless extra change; the caller
    // controls exactly when that happens (see cadence-shell.js).
    if (!markEl.hasAttribute('data-cadence-resting-icon-saved')) {
      markEl.setAttribute('data-cadence-resting-icon-html', icon.outerHTML);
      markEl.setAttribute('data-cadence-resting-icon-saved', '1');
    }

    var wrap = document.createElement('div');
    wrap.innerHTML = CADENCE_ACTIVATION_SVG;
    var freshIcon = wrap.firstElementChild;
    icon.replaceWith(freshIcon);

    return new Promise(function (resolve) {
      setTimeout(resolve, ACTIVATION_MS);
    });
  }

  // Restores markEl's original resting <svg class="cadence-id-icon">
  // (the plain canonical-mark <use>), saved by activate() above. Safe
  // to call even if activate() was never invoked (no-op).
  function restoreResting(markEl) {
    if (!markEl) return;
    var savedHtml = markEl.getAttribute('data-cadence-resting-icon-html');
    if (!savedHtml) return;
    var currentIcon = markEl.querySelector('.cadence-id-icon');
    if (!currentIcon) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = savedHtml;
    currentIcon.replaceWith(wrap.firstElementChild);
  }

  window.CadenceIdentity = { activate: activate, restoreResting: restoreResting };
})();
