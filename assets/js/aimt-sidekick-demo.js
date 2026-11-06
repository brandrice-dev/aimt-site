// Reused homepage animated preview; not the treatment tool or service controls.
(function() {
  const card = document.getElementById('protocolLiveCard');
  if (!card) return;
  const countdownEl = document.getElementById('plcCountdown');
  const landmarkEl = document.getElementById('plcLandmark');
  const serviceEl = document.getElementById('plcServiceRemaining');
  const elapsedEl = document.getElementById('plcElapsed');
  const trackFill = document.getElementById('plcTrackFill');
  const ring = document.getElementById('plcRingFill');
  const CIRC = 188.5; // 2 * PI * 30 — matches the real timer's own ring radius
  const STEP_DURATION = 600;   // Step 05 runs 10:00
  const SERVICE_TOTAL = 3600;  // Core Format is a 60:00 treatment clock
  const START_STEP_REMAINING = 402;    // 6:42 left in the step
  const START_SERVICE_REMAINING = 2322; // 38:42 left overall, at the same moment
  let stepRemaining = START_STEP_REMAINING;
  let serviceRemaining = START_SERVICE_REMAINING;

  function fmt(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function paint() {
    countdownEl.textContent = fmt(stepRemaining);
    landmarkEl.textContent = fmt(stepRemaining);
    serviceEl.textContent = fmt(serviceRemaining);
    elapsedEl.textContent = fmt(SERVICE_TOTAL - serviceRemaining);
    ring.style.strokeDashoffset = CIRC * (1 - stepRemaining / STEP_DURATION);
    trackFill.style.width = ((SERVICE_TOTAL - serviceRemaining) / SERVICE_TOTAL * 100) + '%';
  }
  paint();

  let timer = null;
  function tick() {
    stepRemaining -= 1;
    serviceRemaining -= 1;
    if (stepRemaining < 0) {
      stepRemaining = START_STEP_REMAINING;
      serviceRemaining = START_SERVICE_REMAINING;
    }
    paint();
  }
  function start() { if (!timer) timer = setInterval(tick, 1000); }
  function stop() { clearInterval(timer); timer = null; }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => { entry.isIntersecting ? start() : stop(); });
  }, { threshold: 0.4 });
  obs.observe(card);
})();
