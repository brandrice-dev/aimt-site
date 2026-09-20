// MANUAL QA TOOLING ONLY -- never loaded by headspa-mastery.html, never
// shipped to students. Paste into a real (or automated) browser console
// against a loaded headspa-mastery.html page before making ANY claim that
// a Listen Mode (or other in-lesson) interaction "works" or "PASSes".
//
// WHY THIS EXISTS
// headspa-mastery.html layers THREE independent visibility systems on top
// of each other:
//   1. #landingPage -- a `position: fixed; inset: 0; z-index: 999;`
//      full-viewport overlay (the sales/buy page). Hidden ONLY by
//      `document.getElementById('landingPage').style.display = 'none'`,
//      which only happens inside showApp()/enterPurchasedCourseHome() once
//      shouldEnterPurchasedCourse() resolves true -- a REAL, async,
//      network-dependent Supabase-auth-plus-entitlement-row check.
//   2. The `.view`/`.view.active` system (#courseHome, #lessonView) --
//      what openModuleById()/showCourse() toggle. This can be true
//      (lessonView.active) while #landingPage is STILL the visible screen
//      on top of it, because the two systems don't know about each other.
//   3. Each module's hidden `display:none` source template
//      (#module1Wrap, #module2Wrap, ...) vs. the live `.lesson-wrap`,
//      which STATIC_MODULES[id]() populates via
//      `wrap.innerHTML = templateEl.innerHTML`. Any id inside a template
//      collides with the live clone's copy of that same id once cloned.
//
// A prior round of automated QA in this repo called
// `window.APP_STATE.markModuleComplete(0); window.openModuleById(1);`
// directly from the console to reach "Module 1". That genuinely flips
// system #2 (lessonView.active = true, .lesson-wrap populated, Listen
// Mode mount()s for real) -- but it never touches system #1, so
// #landingPage stayed the visible screen (z-index 999) the entire time.
// Every "PASS" from that methodology was validating real, working
// plumbing from a DOM/state angle that a real student can never actually
// look at, because the buy page was still covering the whole viewport.
//
// This assertion makes that impossible to miss again: it fails loudly
// (throws) unless the buy page is genuinely gone AND the module under
// test is genuinely the visible, active lesson, scoped to avoid every
// hidden-template collision in point 3 above.
//
// USAGE
//   assertActiveStudentModule(1)
// Returns a fingerprint object on success; throws with a specific reason
// on failure. Call it AFTER whatever navigation steps you used and BEFORE
// touching any Listen Mode button/state -- if it throws, stop and report
// the failure; do not test further and do not call the result a PASS.
//
// WHAT THIS DOES NOT DO
// It does not, and must not, fabricate real Supabase authentication or a
// real course_entitlements row -- this repo's hard rule is to never touch
// entitlement/auth logic, and browser automation must never create
// accounts or handle credentials. If #landingPage is visible and you have
// no real signed-in session available, that is the correct, honest
// result: report it as missing local test infrastructure, do not force
// #landingPage.style.display = 'none' and call the rest of the page a
// valid "student experience" test without saying so explicitly.

function assertActiveStudentModule(moduleId) {
  const fail = (reason) => {
    const err = new Error('assertActiveStudentModule(' + moduleId + ') FAILED: ' + reason);
    err.fingerprint = fingerprint();
    throw err;
  };

  function fingerprint() {
    const landingPage = document.getElementById('landingPage');
    const introScreen = document.getElementById('introScreen');
    const courseHome = document.getElementById('courseHome');
    const lessonView = document.getElementById('lessonView');
    const wrap = document.querySelector('.lesson-wrap');
    const hiddenTemplate = document.getElementById('module' + moduleId + 'Wrap');
    return {
      landingPageDisplay: landingPage ? getComputedStyle(landingPage).display : 'no-element',
      introScreenDisplay: introScreen ? getComputedStyle(introScreen).display : 'no-element',
      courseHomeActive: !!(courseHome && courseHome.classList.contains('active')),
      lessonViewActive: !!(lessonView && lessonView.classList.contains('active')),
      appStateCurrentModule: window.APP_STATE && window.APP_STATE.data && window.APP_STATE.data.guide
        ? window.APP_STATE.data.guide.currentModule : undefined,
      wrapExists: !!wrap,
      wrapTextSnippet: wrap ? wrap.innerText.slice(0, 80) : null,
      hiddenTemplateDisplay: hiddenTemplate ? getComputedStyle(hiddenTemplate).display : 'no-element',
      bodyReady: document.body.classList.contains('app-ready')
    };
  }

  const landingPage = document.getElementById('landingPage');
  const introScreen = document.getElementById('introScreen');
  // A. + B. course shell visible, buy/access screen NOT visible.
  if (landingPage && getComputedStyle(landingPage).display !== 'none') {
    fail('#landingPage (the buy/sales overlay, z-index 999) is still visible (display=' +
      getComputedStyle(landingPage).display + '). A real student would be looking at the ' +
      'buy page, not Module ' + moduleId + '. Reaching a genuinely hidden landing page ' +
      'requires real Supabase auth + a real course_entitlements row -- do not fabricate ' +
      'this; report it as missing local test infrastructure instead.');
  }
  if (introScreen && getComputedStyle(introScreen).display !== 'none') {
    fail('#introScreen is still visible -- the welcome/intro overlay has not been dismissed.');
  }

  // D. Module 0 requirement satisfied (canAccessModule(moduleId) already
  // encodes the full prerequisite chain, not just Module 0).
  if (!window.APP_STATE || typeof window.APP_STATE.canAccessModule !== 'function') {
    fail('window.APP_STATE.canAccessModule is not available.');
  }
  if (!window.APP_STATE.canAccessModule(moduleId)) {
    fail('APP_STATE.canAccessModule(' + moduleId + ') is false -- prerequisite modules are not complete.');
  }

  // E. Module `moduleId` is the ACTIVE live lesson (both the .view layer
  // and APP_STATE's own notion of "current module" must agree).
  const lessonView = document.getElementById('lessonView');
  if (!lessonView || !lessonView.classList.contains('active')) {
    fail('#lessonView does not have class="active" -- the course-home or another screen is what is actually showing.');
  }
  const currentModule = window.APP_STATE.data && window.APP_STATE.data.guide
    ? window.APP_STATE.data.guide.currentModule : undefined;
  if (Number(currentModule) !== Number(moduleId)) {
    fail('APP_STATE.data.guide.currentModule is ' + currentModule + ', not ' + moduleId + '.');
  }

  // F. the visible .lesson-wrap actually contains Module `moduleId`'s
  // content (not stale content from a previous module, and not empty).
  const wrap = document.querySelector('.lesson-wrap');
  if (!wrap) fail('.lesson-wrap does not exist in the DOM.');
  const wrapRect = wrap.getBoundingClientRect();
  if (wrapRect.width === 0 && wrapRect.height === 0) {
    fail('.lesson-wrap exists but has zero layout size -- it is not actually being rendered.');
  }

  return { fingerprint: fingerprint() };
}

// Module-1-specific convenience: also confirms the Listen Mode entry
// button being tested is the real, visible, .lesson-wrap-scoped one --
// never the hidden #module1Wrap template's duplicate-id copy (see the
// architecture note above, point 3).
function assertModule1ListenButtonIsLive() {
  assertActiveStudentModule(1);
  const wrap = document.querySelector('.lesson-wrap');
  const btn = wrap.querySelector('#m1ListenWithCadenceButton');
  if (!btn) throw new Error('assertModule1ListenButtonIsLive FAILED: no #m1ListenWithCadenceButton inside the live .lesson-wrap.');
  const rect = btn.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    throw new Error('assertModule1ListenButtonIsLive FAILED: the button exists but is not visibly rendered (zero size).');
  }
  const template = document.getElementById('module1Wrap');
  if (template && template.contains(btn)) {
    throw new Error('assertModule1ListenButtonIsLive FAILED: the resolved button is inside the hidden #module1Wrap template, not the live lesson.');
  }
  return { button: btn, playerHostCount: document.querySelectorAll('#aimtListenModePlayerHost').length };
}
