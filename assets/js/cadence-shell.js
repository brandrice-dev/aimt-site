/* ═══════════════════════════════════════════════════════════════
   Cadence full-screen conversation shell — Phase 2 of the Cadence
   launch sweep.

   Governs: docs/course-audit/00-cadence-launch-sweep-build-contract.md
   Section 8 ("one shared component... mounted by the guide panel, any
   future full-screen checkpoint UX, and Module 12 Part III. Authority/
   mode logic stays outside the shell.")

   THIS FILE IS PRESENTATION + TRANSPORT ONLY. It never decides pass/
   revise (that's functions/_lib/cadence/checkpoint-evaluation.mjs's
   decideCheckpointOutcome(), server-side, unchanged by this file) and
   it never invents checkpoint prompts/rubrics (those remain the exact
   M0..M11 config objects in headspa-mastery.html, read through the one
   new accessor window.getCadenceCheckpointDefinition()).

   Production mode implemented here: required_checkpoint only (Phase 2
   scope). The internal engine (session state machine, transcript
   render, composer, voice, mobile handling) is written generically so
   a later phase can add ask_cadence / remediation / certification modes
   without rebuilding this file — see MODE handling in openSession().

   Cross-file access pattern matches this codebase's existing
   convention (module12-certification.js:398's
   `typeof supabaseClient !== 'undefined'` guard, and the explicit
   `window.APP_STATE` exposure in headspa-state.js): this script loads
   at the end of <body>, after headspa-mastery.html's inline script has
   declared APP_STATE-dependent globals, function declarations
   (automatically window-scoped) and the small new
   window.getCadenceCheckpointDefinition() accessor added alongside the
   M0..M11 config objects. Nothing here reaches into internals that
   aren't already deliberately exposed.

   Backend contract consumed (both already built + tested in Phase 1,
   zero changes needed here beyond wiring a real caller):
     GET  /api/cadence/get-thread?moduleId=<id>   -> { thread, messages }
     POST /api/cadence/evaluate-checkpoint         -> { pass, feedback, modelInfo }
   via the existing window.evaluateCheckpointAnswer() (production) and
   window.evaluateCheckpointAnswerReviewMode() (Review Mode only, never
   persists — see REVIEW MODE section below).
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Small local utilities (no dependency on page globals) ──

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function multilineHtml(str) {
    const escaped = escapeHtml(str);
    const lines = escaped.split('\n').filter((l) => l.trim().length);
    if (!lines.length) return '<p></p>';
    return lines.map((l) => '<p>' + l + '</p>').join('');
  }

  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'cshell-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  function getSupabaseClient() {
    // Bare-identifier reference to the page's `const supabaseClient`,
    // guarded exactly like the existing cross-file access pattern in
    // assets/js/module12-certification.js:398.
    // eslint-disable-next-line no-undef
    return typeof supabaseClient !== 'undefined' ? supabaseClient : null;
  }

  async function getBearerToken() {
    try {
      const client = getSupabaseClient();
      if (!client) return '';
      const { data } = await client.auth.getSession();
      return (data && data.session && data.session.access_token) || '';
    } catch (_) {
      return '';
    }
  }

  function safeGet(fn, fallback) {
    try { return fn(); } catch (_) { return fallback; }
  }

  // ── Transient (non-authoritative) client-side state ──
  // Drafts and pending-eval markers are read/written to sessionStorage
  // only — never localStorage, and never treated as authoritative
  // (Supabase, via get-thread/evaluate-checkpoint, remains the
  // authoritative source once a message is actually persisted).

  function draftKey(moduleId, cpId) { return 'cadence_draft_' + moduleId + '_' + cpId; }
  function pendingKey(moduleId, cpId) { return 'cadence_pending_' + moduleId + '_' + cpId; }

  // Ask Cadence has no checkpoint id -- this sentinel keeps its
  // draft/pending sessionStorage keys namespaced separately from any real
  // checkpoint id in the same module (never collides: real checkpoint ids
  // are always alphanumeric like 'm4cp1', never this literal string).
  const ASK_CADENCE_KEY = '__ask_cadence__';

  function readDraft(moduleId, cpId) {
    return safeGet(() => sessionStorage.getItem(draftKey(moduleId, cpId)) || '', '');
  }
  function writeDraft(moduleId, cpId, text) {
    safeGet(() => {
      if (text && text.trim()) sessionStorage.setItem(draftKey(moduleId, cpId), text);
      else sessionStorage.removeItem(draftKey(moduleId, cpId));
    }, null);
  }
  function readPending(moduleId, cpId) {
    return safeGet(() => JSON.parse(sessionStorage.getItem(pendingKey(moduleId, cpId)) || 'null'), null);
  }
  function writePending(moduleId, cpId, value) {
    safeGet(() => {
      if (value) sessionStorage.setItem(pendingKey(moduleId, cpId), JSON.stringify(value));
      else sessionStorage.removeItem(pendingKey(moduleId, cpId));
    }, null);
  }

  // ── Icons (reused visual language from the existing .cp-btn / voice-btn) ──

  const ICON_SEND = '<svg viewBox="0 0 14 14" fill="none"><path d="M7 1.5V12.5M7 1.5L2.5 6M7 1.5L11.5 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_CLOSE = '<svg viewBox="0 0 16 16" fill="none"><path d="M3 3L13 13M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  const ICON_VOICE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>';
  const ICON_CHECK = '<svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  // Continue is navigation, not a repeat of the "Competency demonstrated"
  // success badge above it (which already owns ICON_CHECK) -- a subtle
  // chevron, not a checkmark. Sized explicitly in CSS (.cshell-continue-btn
  // svg), unlike the bug this replaces where ICON_CHECK had no sizing
  // rule at all on that button and rendered at the browser's SVG default.
  const ICON_CHEVRON_RIGHT = '<svg viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ── DOM: built once, reused across opens ──

  let dom = null;

  function ensureMounted() {
    if (dom) return dom;
    const root = document.getElementById('cadenceShellRoot');
    if (!root) return null;

    root.innerHTML =
      '<div class="cshell-overlay" id="cshellOverlay"></div>' +
      '<div class="cshell" id="cshell" role="dialog" aria-modal="true" aria-label="Cadence conversation">' +
        '<div class="cshell-head">' +
          '<div class="cshell-id" aria-hidden="true"><span class="cshell-id-dot"></span><span class="cshell-id-label">Cadence</span></div>' +
          '<div class="cshell-titles">' +
            '<div class="cshell-module" id="cshellModule"></div>' +
            '<div class="cshell-status" id="cshellStatusLine"></div>' +
          '</div>' +
          '<button type="button" class="cshell-close" id="cshellClose" aria-label="Close and return to the lesson">' + ICON_CLOSE + '</button>' +
        '</div>' +
        '<div class="cshell-review-banner" id="cshellReviewBanner">Review Mode — nothing here is saved</div>' +
        '<div class="cshell-fixtures" id="cshellFixtures"></div>' +
        '<div class="cshell-transcript" id="cshellTranscript"><div class="cshell-transcript-inner" id="cshellTranscriptInner"></div></div>' +
        '<div class="cshell-composer" id="cshellComposer">' +
          '<div class="cshell-error-row" id="cshellErrorRow" style="display:none">' +
            '<span class="cshell-error-text" id="cshellErrorText"></span>' +
            '<button type="button" class="cshell-retry-btn" id="cshellRetryBtn">Try again</button>' +
          '</div>' +
          '<div class="cshell-composer-inner" id="cshellComposerInner">' +
            '<textarea id="cshellInput" class="cshell-input" rows="1" placeholder="Type your response…" aria-label="Your response to Cadence"></textarea>' +
            '<button type="button" class="voice-btn" id="cshellVoiceBtn" aria-label="Speak your answer">' + ICON_VOICE + '</button>' +
            '<button type="button" class="cshell-send" id="cshellSend" aria-label="Send response to Cadence">' + ICON_SEND + '</button>' +
          '</div>' +
          '<div class="cshell-continue-row" id="cshellContinueRow" style="display:none">' +
            '<button type="button" class="cshell-continue-btn" id="cshellContinueBtn">Continue' + ICON_CHEVRON_RIGHT + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    dom = {
      root,
      overlay: document.getElementById('cshellOverlay'),
      shell: document.getElementById('cshell'),
      moduleLine: document.getElementById('cshellModule'),
      statusLine: document.getElementById('cshellStatusLine'),
      closeBtn: document.getElementById('cshellClose'),
      reviewBanner: document.getElementById('cshellReviewBanner'),
      fixtures: document.getElementById('cshellFixtures'),
      transcript: document.getElementById('cshellTranscript'),
      transcriptInner: document.getElementById('cshellTranscriptInner'),
      composer: document.getElementById('cshellComposer'),
      composerInner: document.getElementById('cshellComposerInner'),
      input: document.getElementById('cshellInput'),
      voiceBtn: document.getElementById('cshellVoiceBtn'),
      sendBtn: document.getElementById('cshellSend'),
      continueRow: document.getElementById('cshellContinueRow'),
      continueBtn: document.getElementById('cshellContinueBtn'),
      errorRow: document.getElementById('cshellErrorRow'),
      errorText: document.getElementById('cshellErrorText'),
      retryBtn: document.getElementById('cshellRetryBtn'),
    };

    wireStaticHandlers();
    return dom;
  }

  // ── Current open session ──
  let session = null; // { moduleId, cpId, question, system, reviewSystem, label, review, busy, lastFailedText, focusReturnEl }
  let lastFocusedEl = null;
  let isClosing = false;

  function wireStaticHandlers() {
    dom.overlay.addEventListener('click', close);
    dom.closeBtn.addEventListener('click', close);
    dom.sendBtn.addEventListener('click', onSendClick);
    dom.retryBtn.addEventListener('click', onRetryClick);
    dom.continueBtn.addEventListener('click', close);

    dom.input.addEventListener('input', () => {
      autoGrowInput();
      if (session) writeDraft(session.moduleId, session.mode === 'ask_cadence' ? ASK_CADENCE_KEY : session.cpId, dom.input.value);
    });
    dom.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSendClick();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!session) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') trapFocus(e);
    });

    // Voice reuses the page's single global voice implementation as-is
    // (headspa-mastery.html's startVoice()) — same permission handling,
    // same transcript-into-textarea behavior, no separate voice path.
    dom.voiceBtn.addEventListener('click', () => {
      if (typeof window.startVoice === 'function') window.startVoice('cshellInput', dom.voiceBtn);
    });

    // Mobile keyboard / safe-area handling (Section 21). visualViewport
    // reports the actually-visible area once the OS keyboard opens;
    // dvh alone does not react to that on every browser, so this is a
    // deliberate addition, not redundant with the CSS dvh fallback.
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    }
    // Plain window resize as a fallback/supplement: re-evaluates the
    // mobile-vs-device-stage breakpoint (isDeviceStageLayout()) on a
    // desktop browser resize or a tablet rotation, which doesn't always
    // fire a visualViewport event on its own. orientationchange is an
    // extra belt-and-suspenders signal for a real device rotation
    // (fires slightly ahead of resize on some mobile browsers).
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
  }

  // Matches the CSS device-stage breakpoint exactly (cadence-shell.css
  // `@media (min-width: 768px)`) -- below it the shell is full-bleed
  // mobile and needs JS-driven keyboard/safe-area handling; at or above
  // it the shell is a CSS-centered, fixed-size card and must NOT have
  // its `top`/height overridden inline, or the centering transform
  // breaks. Kept as a function (not cached) since a real device can
  // cross this breakpoint via rotation/window resize while open.
  function isDeviceStageLayout() {
    return !!(window.matchMedia && window.matchMedia('(min-width: 768px)').matches);
  }

  function updateViewportHeight() {
    if (!dom || !session) return;
    const chromeOffset = getPageChromeOffsetTop();

    if (isDeviceStageLayout()) {
      // Let CSS own position/size entirely; only tell it how far to
      // nudge the centered card down to clear the review-mode banner
      // (half its height centers the card within the remaining space
      // below the banner rather than the full viewport -- see the CSS
      // comment above .cshell's transform).
      dom.shell.style.removeProperty('top');
      dom.shell.style.removeProperty('--cshell-vh');
      dom.shell.style.setProperty('--cshell-banner-nudge', (chromeOffset / 2) + 'px');
      scrollToBottomIfNearEnd(true);
      return;
    }

    dom.shell.style.removeProperty('--cshell-banner-nudge');
    const vv = window.visualViewport;
    // Guard against a zero/unavailable reading (observed transiently in
    // some environments right at open time) -- setting the custom
    // property to "0px" would defeat the CSS var() fallback, since that
    // fallback only applies when the property is entirely unset, not
    // when it holds a bad value. Leaving it unset here lets the CSS
    // `calc(var(--cshell-vh, 100dvh))` fall through to 100dvh instead.
    const vvOffset = (vv && vv.offsetTop) || 0;
    dom.shell.style.top = (vvOffset + chromeOffset) + 'px';
    if (!vv || !vv.height) { dom.shell.style.removeProperty('--cshell-vh'); return; }
    dom.shell.style.setProperty('--cshell-vh', (vv.height - chromeOffset) + 'px');
    scrollToBottomIfNearEnd(true);
  }

  // The global #reviewModeBanner (headspa-mastery.html, z-index 3000 --
  // deliberately above this shell's 2500 so a QA reviewer never loses
  // the "not being recorded" notice) only exists in Review Mode. In
  // production there is no competing fixed banner, so this is always 0
  // there. Measured live rather than hardcoded so a future banner copy
  // change can't silently desync the offset.
  function getPageChromeOffsetTop() {
    const banner = document.getElementById('reviewModeBanner');
    if (!banner) return 0;
    const cs = getComputedStyle(banner);
    if (cs.display === 'none' || !banner.classList.contains('show')) return 0;
    return banner.getBoundingClientRect().height;
  }

  function autoGrowInput() {
    dom.input.style.height = 'auto';
    dom.input.style.height = Math.min(dom.input.scrollHeight, 168) + 'px';
  }

  function trapFocus(e) {
    // BUG FIX (Cadence Phase 2A accessibility re-verification): the query
    // alone matched elements like #cshellContinueBtn even while its
    // parent .cshell-continue-row is display:none (e.g. mid-conversation,
    // before a pass) -- .focus() on an element with no offsetParent is a
    // silent no-op, so wrapping from the first element with Shift+Tab
    // could land on a hidden "last" element and appear to do nothing.
    // offsetParent === null reliably detects "not visible" (display:none
    // on the element or an ancestor) without walking the ancestor chain
    // by hand; it's not defined for position:fixed elements in some
    // engines, but nothing in this list is itself position:fixed.
    const focusable = Array.prototype.filter.call(
      dom.shell.querySelectorAll('button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      (el) => el.offsetParent !== null
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  // ── Opening / closing ──

  function openCheckpoint(config) {
    const mounted = ensureMounted();
    if (!mounted) return;
    // Reentrancy guard: close() below intentionally moves focus, and
    // focus can synchronously trigger this function again (see the
    // returnFocusEl fix in close() for why) -- this stops any such loop
    // dead regardless of which element ends up focused.
    if (isClosing) return;

    // BUG FIX (Cadence Phase 2A): previously this captured
    // `document.activeElement`, which for the normal open path (student
    // clicks/focuses the checkpoint's own <textarea>) is that exact
    // textarea -- and that textarea has `onfocus = open` (wireCheckpoint()
    // below). close() calling .focus() on it to "restore focus" therefore
    // re-fired `open` synchronously, instantly reopening the shell right
    // after every close -- the reported "X/Escape don't work" bug. Fixed
    // at the source: callers that know their trigger element has a
    // reopening side effect (wireCheckpoint does) now pass an explicit,
    // safe `returnFocusEl` (the checkpoint's own container, which has no
    // such handler) instead of relying on whatever was focused.
    lastFocusedEl = config.returnFocusEl || document.activeElement;
    const isReview = !!(window.ReviewMode && window.ReviewMode.isActive());

    session = {
      moduleId: config.moduleId,
      mode: 'required_checkpoint',
      cpId: config.cpId,
      question: config.question,
      system: config.system,
      reviewSystem: config.reviewSystem,
      label: config.label || '',
      review: isReview,
      busy: false,
      activeFixture: null,
    };

    dom.moduleLine.textContent = safeGet(() => document.getElementById('lessonNavTitle').textContent, '') || ('Module ' + config.moduleId);
    dom.statusLine.textContent = session.label || 'Required checkpoint';
    dom.shell.classList.toggle('review-mode', isReview);
    dom.reviewBanner.style.display = isReview ? 'flex' : 'none';
    setErrorVisible(false);
    dom.continueRow.style.display = 'none';
    dom.input.value = '';
    dom.input.disabled = false;

    document.body.style.overflow = 'hidden';
    hidePageChrome();
    dom.overlay.classList.add('show');
    dom.shell.classList.add('open');
    updateViewportHeight();

    if (isReview) {
      renderFixtureBar();
      renderFixture('live');
    } else {
      dom.fixtures.innerHTML = '';
      loadProductionThread();
    }

    setTimeout(() => { dom.closeBtn.focus(); }, 30);
  }

  // ── Ask Cadence: same shell, non-graded mode (Phase 3) ──
  //
  // Opens the SAME shared shell, the SAME per-module durable thread (get-
  // thread returns every message in the module regardless of mode, so a
  // student sees one coherent module conversation even though checkpoint
  // and ask_cadence turns are internally tagged differently -- build
  // contract Section 19). Never calls commitCheckpointPass/Revise; never
  // shows the pass banner/lock; the composer stays available for as long
  // as the shell is open. activeCheckpointId (if the module currently has
  // an unresolved required checkpoint) is passed through to the server,
  // which independently VERIFIES it against course_progress before
  // deciding whether to add the answer-leakage guardrail -- this file
  // never decides that itself, matching this shell's existing
  // "presentation + transport only" contract.
  function openAskCadence(config) {
    const mounted = ensureMounted();
    if (!mounted) return;
    if (isClosing) return;

    lastFocusedEl = config.returnFocusEl || document.activeElement;
    const isReview = !!(window.ReviewMode && window.ReviewMode.isActive());

    session = {
      moduleId: config.moduleId,
      mode: 'ask_cadence',
      guideSystemPrompt: config.guideSystemPrompt || '',
      activeCheckpointId: config.activeCheckpointId || null,
      label: 'Ask Cadence',
      review: isReview,
      busy: false,
      activeFixture: null,
    };

    dom.moduleLine.textContent = config.moduleLabel || safeGet(() => document.getElementById('lessonNavTitle').textContent, '') || ('Module ' + config.moduleId);
    dom.statusLine.textContent = 'Optional · not graded';
    dom.shell.classList.toggle('review-mode', isReview);
    dom.reviewBanner.style.display = isReview ? 'flex' : 'none';
    setErrorVisible(false);
    dom.continueRow.style.display = 'none';
    dom.input.value = '';
    dom.input.disabled = false;

    document.body.style.overflow = 'hidden';
    hidePageChrome();
    dom.overlay.classList.add('show');
    dom.shell.classList.add('open');
    updateViewportHeight();

    if (isReview) {
      renderAskFixtureBar();
      renderAskFixture('empty');
    } else {
      dom.fixtures.innerHTML = '';
      loadAskCadenceThread();
    }

    setTimeout(() => { dom.closeBtn.focus(); }, 30);
  }

  function close() {
    if (!session || isClosing) return;
    isClosing = true;
    if (dom.input.value.trim()) writeDraft(session.moduleId, session.mode === 'ask_cadence' ? ASK_CADENCE_KEY : session.cpId, dom.input.value);
    document.body.style.overflow = '';
    restorePageChrome();
    dom.overlay.classList.remove('show');
    dom.shell.classList.remove('open');
    dom.shell.style.top = '';
    const returnEl = lastFocusedEl;
    session = null;
    if (returnEl && typeof returnEl.focus === 'function') {
      try { returnEl.focus(); } catch (_) { /* element may no longer be attached */ }
    }
    // Cleared synchronously (not deferred) -- the guard only needs to
    // survive the single synchronous .focus() call above, which is the
    // only thing that could reenter openCheckpoint(). Leaving it set
    // longer would block a legitimate fast re-open (e.g. Continue -> next
    // checkpoint in a later mode).
    isClosing = false;
  }

  // Belt-and-suspenders: the shell's own z-index already sits above every
  // fixed/sticky page surface, but explicitly hiding the surfaces most
  // likely to visually or interactively conflict with a full-screen
  // takeover (the sticky lesson nav bar, the floating Cadence entry
  // button/panel from the still-present guide panel -- Section 25) keeps
  // the experience unambiguous regardless of any stacking edge case.
  let hiddenChrome = [];
  function hidePageChrome() {
    hiddenChrome = [];
    ['.lesson-nav', '#guideBtn', '#guidePanel', '#overlay'].forEach((sel) => {
      const el = document.querySelector(sel);
      if (el && el.style.visibility !== 'hidden') {
        hiddenChrome.push({ el, prev: el.style.visibility });
        el.style.visibility = 'hidden';
      }
    });
  }
  function restorePageChrome() {
    hiddenChrome.forEach(({ el, prev }) => { el.style.visibility = prev; });
    hiddenChrome = [];
  }

  // ── Wiring the existing inline checkpoint widgets to open this shell ──
  // Called from restoreLessonState()'s per-checkpoint loop in
  // headspa-mastery.html (one added line — see that file's diff). Runs
  // every time a module's lesson content is (re)rendered.

  function wireCheckpoint(moduleId, cpId) {
    const def = safeGet(() => window.getCadenceCheckpointDefinition(moduleId, cpId), null);
    if (!def) return;
    const input = safeGet(() => document.getElementById(cpId + 'In'), null);
    const btn = safeGet(() => document.getElementById(cpId + 'Btn'), null);
    if (!input || !btn) return;

    // The checkpoint's own container is the safe close-time focus target
    // (see openCheckpoint()'s BUG FIX comment) -- unlike the textarea/
    // button/voice/status elements below, it has no open-triggering
    // handler of its own, so returning focus to it on close can never
    // reopen the shell. tabIndex=-1 makes it programmatically focusable
    // without joining the page's normal tab order.
    const container = safeGet(() => document.getElementById(cpId), null);
    if (container) container.tabIndex = -1;

    const label = safeGet(() => container && container.querySelector('.cp-label').textContent.trim(), '');
    const open = function () {
      openCheckpoint({ moduleId, cpId, question: def.question, system: def.system, reviewSystem: def.reviewSystem, label, returnFocusEl: container });
    };

    input.readOnly = true;
    input.value = '';
    input.classList.add('cadence-shell-trigger');
    input.setAttribute('data-cadence-placeholder', input.getAttribute('placeholder') || '');
    input.placeholder = 'Tap to talk with Cadence about this…';
    input.onfocus = open;
    input.onclick = open;
    btn.onclick = open;

    const voiceBtn = safeGet(() => input.closest('.cp-input-row').querySelector('.voice-btn'), null);
    if (voiceBtn) voiceBtn.onclick = open;

    const statusEl = safeGet(() => document.getElementById(cpId + 'Status'), null);
    if (statusEl) {
      statusEl.onclick = open;
      statusEl.setAttribute('data-cshell-viewable', '1');
    }
    const resEl = safeGet(() => document.getElementById(cpId + 'Res'), null);
    if (resEl) {
      resEl.onclick = open;
      resEl.setAttribute('data-cshell-viewable', '1');
    }
  }

  // ── Production path: fetch the module thread, reconcile, render ──

  async function apiGetThread(moduleId) {
    const token = await getBearerToken();
    const res = await fetch('/api/cadence/get-thread?moduleId=' + encodeURIComponent(moduleId), {
      headers: token ? { Authorization: 'Bearer ' + token } : {},
    });
    if (!res.ok) throw new Error('thread_fetch_failed');
    return res.json();
  }

  function getLocalMeta(moduleId, cpId) {
    const progress = safeGet(() => window.APP_STATE.getModuleProgress(moduleId), null);
    if (!progress) return null;
    return (progress.checkpointMeta && progress.checkpointMeta[cpId]) || null;
  }

  function isLocallyResolved(moduleId, cpId) {
    const progress = safeGet(() => window.APP_STATE.getModuleProgress(moduleId), null);
    if (!progress) return false;
    const meta = progress.checkpointMeta && progress.checkpointMeta[cpId];
    return !!(safeGet(() => window.APP_STATE.isModuleComplete(moduleId), false) ||
      (progress.checkpoints || []).indexOf(cpId) !== -1 ||
      (meta && meta.status === 'passed'));
  }

  async function loadProductionThread() {
    renderTyping(true, 'Loading your conversation…');
    let data;
    try {
      data = await apiGetThread(session.moduleId);
    } catch (_) {
      renderTyping(false);
      renderTranscriptError();
      return;
    }
    renderTyping(false);
    if (!session) return; // closed while loading

    const messages = (data && data.messages) || [];
    const cpMessages = messages.filter((m) => m.checkpointId === session.cpId);
    const resolved = isLocallyResolved(session.moduleId, session.cpId);
    const meta = getLocalMeta(session.moduleId, session.cpId);

    // Reconcile a pass/revise decision that landed server-side (visible
    // in the transcript's grading metadata is NOT exposed by get-thread
    // by design — see that endpoint's comment — so reconciliation here
    // instead relies on the pending marker + a follow-up read of the
    // authoritative evaluate-checkpoint response when we resend below).
    // What we CAN safely reconcile purely from message shape: an
    // in-flight send that never got a client-side reply.
    const pending = readPending(session.moduleId, session.cpId);
    const lastMsg = cpMessages[cpMessages.length - 1];
    const hasDanglingUserTurn = lastMsg && lastMsg.role === 'user';

    renderModuleHistory(messages, session.cpId);

    if (resolved) {
      renderResolvedState(cpMessages, meta);
      return;
    }

    if (hasDanglingUserTurn && pending && pending.requestId && pending.text === lastMsg.content) {
      // Section 14: refresh-during-evaluation, same tab/session. Safe to
      // resume because the requestId is one we generated ourselves and
      // evaluate-checkpoint.js's idempotency guarantees no duplicate
      // student message and no duplicate model call once a reply exists.
      renderComposerLocked(true);
      renderTyping(true, 'Cadence is reviewing your last response…');
      await submitEvaluation(pending.text, pending.requestId);
      return;
    }

    if (hasDanglingUserTurn) {
      // A dangling turn with no local pending marker (different device/
      // session, or the marker expired) — never auto-resend without the
      // student's explicit action.
      appendAssistantSystemNote('Cadence didn’t get a chance to respond to your last message yet.');
      renderRetryAffordance(lastMsg.content);
      return;
    }

    if (!cpMessages.length) {
      renderActivationTurn();
    }
    renderComposerLocked(false);
    restoreDraftIfAny();
    scrollToBottomIfNearEnd(true);
  }

  function renderTranscriptError() {
    dom.transcriptInner.innerHTML = '';
    appendAssistantSystemNote('Cadence couldn’t load this conversation right now.');
    renderRetryAffordance(null, () => loadProductionThread());
  }

  // ── Ask Cadence: load the full module thread (all modes, one coherent
  //    conversation) and leave the composer permanently available. ──

  async function loadAskCadenceThread() {
    renderTyping(true, 'Loading your conversation…');
    let data;
    try {
      data = await apiGetThread(session.moduleId);
    } catch (_) {
      renderTyping(false);
      dom.transcriptInner.innerHTML = '';
      appendAssistantSystemNote('Cadence couldn’t load this conversation right now.');
      renderRetryAffordance(null, () => loadAskCadenceThread());
      return;
    }
    renderTyping(false);
    if (!session) return; // closed while loading

    const messages = (data && data.messages) || [];
    renderFullModuleHistory(messages);
    if (!messages.length) renderAskActivationTurn();
    renderComposerLocked(false);
    restoreDraftIfAny();
    scrollToBottomIfNearEnd(true);
  }

  function renderFullModuleHistory(messages) {
    clearTranscript();
    let lastCpId = null;
    messages.forEach((m) => {
      if (m.checkpointId && m.checkpointId !== lastCpId) {
        const otherLabel = safeGet(() => document.getElementById(m.checkpointId).querySelector('.cp-label').textContent.trim(), m.checkpointId);
        appendDivider(otherLabel);
        lastCpId = m.checkpointId;
      } else if (!m.checkpointId && lastCpId) {
        appendDivider('Ask Cadence');
        lastCpId = null;
      }
      appendMessageEl(m.role === 'user' ? 'user' : 'assistant', m.content);
    });
  }

  function renderAskActivationTurn() {
    const kicker = document.createElement('div');
    kicker.className = 'cshell-kicker';
    kicker.textContent = 'Ask Cadence';
    dom.transcriptInner.appendChild(kicker);
    appendMessageEl('assistant', 'Ask me anything about this module — this is just between us, nothing here is graded.');
    scrollToBottomIfNearEnd(true);
  }

  async function sendAskCadenceMessage(text) {
    if (!session) return;
    session.busy = true;
    renderComposerLocked(true);
    setErrorVisible(false);
    renderTyping(true, 'Cadence is thinking…');
    const requestId = uuid();
    let data;
    try {
      const token = await getBearerToken();
      const res = await fetch('/api/cadence/ask', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
        body: JSON.stringify({
          moduleId: session.moduleId,
          message: text,
          requestId,
          guideSystemPrompt: session.guideSystemPrompt,
          activeCheckpointId: session.activeCheckpointId,
        }),
      });
      if (!res.ok) throw new Error('ask_cadence_failed');
      data = await res.json();
    } catch (e) {
      renderTyping(false);
      session.busy = false;
      renderComposerLocked(false);
      renderRetryAffordance(text, () => sendAskCadenceMessage(text));
      return;
    }
    renderTyping(false);
    session.busy = false;
    appendMessageEl('assistant', data.reply || '');
    renderComposerLocked(false);
    scrollToBottomIfNearEnd(true);
  }

  // ── Rendering ──

  function clearTranscript() {
    dom.transcriptInner.innerHTML = '';
  }

  function renderModuleHistory(messages, currentCpId) {
    clearTranscript();
    let lastCpId = null;
    messages.forEach((m) => {
      if (m.checkpointId && m.checkpointId !== lastCpId) {
        const otherLabel = safeGet(() => document.getElementById(m.checkpointId).querySelector('.cp-label').textContent.trim(), m.checkpointId);
        appendDivider(otherLabel);
        lastCpId = m.checkpointId;
      }
      appendMessageEl(m.role === 'user' ? 'user' : 'assistant', m.content);
    });
    if (currentCpId && lastCpId !== currentCpId) {
      appendDivider(session.label || 'This checkpoint');
    }
  }

  function appendDivider(text) {
    const div = document.createElement('div');
    div.className = 'cshell-divider';
    div.textContent = text;
    dom.transcriptInner.appendChild(div);
  }

  function appendMessageEl(role, text) {
    const row = document.createElement('div');
    row.className = 'cshell-msg ' + role;
    const av = document.createElement('div');
    av.className = 'cshell-msg-av';
    av.setAttribute('aria-hidden', 'true');
    av.innerHTML = role === 'assistant' ? '<span></span>' : 'You';
    const bub = document.createElement('div');
    bub.className = 'cshell-bub';
    bub.setAttribute('role', 'group');
    bub.setAttribute('aria-label', role === 'assistant' ? 'Cadence' : 'You');
    bub.innerHTML = multilineHtml(text);
    row.appendChild(av);
    row.appendChild(bub);
    dom.transcriptInner.appendChild(row);
    return row;
  }

  function appendAssistantSystemNote(text) {
    appendMessageEl('assistant', text);
    scrollToBottomIfNearEnd(true);
  }

  function renderActivationTurn() {
    const kicker = document.createElement('div');
    kicker.className = 'cshell-kicker';
    kicker.textContent = session.label || 'Checkpoint';
    dom.transcriptInner.appendChild(kicker);
    appendMessageEl('assistant', session.question);
    scrollToBottomIfNearEnd(true);
  }

  function renderResolvedState(cpMessages, meta) {
    if (cpMessages.length) {
      // Real transcript exists for this checkpoint — already rendered by
      // renderModuleHistory(); just lock the composer.
    } else {
      // Section 7: historical pass, no durable transcript. Render an
      // honest read-only fallback — never a fabricated conversation.
      const kicker = document.createElement('div');
      kicker.className = 'cshell-kicker';
      kicker.textContent = session.label || 'Checkpoint';
      dom.transcriptInner.appendChild(kicker);
      appendMessageEl('assistant', session.question);

      const card = document.createElement('div');
      card.className = 'cshell-fallback-card';
      let html = '<div class="cshell-fallback-title">' + ICON_CHECK + ' Checkpoint complete</div>';
      if (meta && meta.answer) {
        html += '<div class="cshell-fallback-label">Your response</div><div class="cshell-fallback-body">' + multilineHtml(meta.answer) + '</div>';
      }
      if (meta && meta.feedback) {
        html += '<div class="cshell-fallback-label">Cadence</div><div class="cshell-fallback-body">' + multilineHtml(meta.feedback) + '</div>';
      }
      if (!meta || (!meta.answer && !meta.feedback)) {
        html += '<div class="cshell-fallback-body">Completed in a previous session.</div>';
      }
      card.innerHTML = html;
      dom.transcriptInner.appendChild(card);
    }
    const banner = document.createElement('div');
    banner.className = 'cshell-pass-banner';
    banner.innerHTML = ICON_CHECK + ' Competency demonstrated';
    dom.transcriptInner.appendChild(banner);

    renderComposerLocked(true, true);
    scrollToBottomIfNearEnd(true);
  }

  function renderTyping(show, label) {
    let el = document.getElementById('cshellTypingRow');
    if (!show) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div');
      el.id = 'cshellTypingRow';
      el.className = 'cshell-msg assistant';
      el.innerHTML = '<div class="cshell-msg-av" aria-hidden="true"><span></span></div>' +
        '<div class="cshell-bub"><div class="cshell-typing" role="status" aria-label="' + escapeHtml(label || 'Cadence is thinking') + '"><span></span><span></span><span></span></div></div>';
      dom.transcriptInner.appendChild(el);
    }
    scrollToBottomIfNearEnd(true);
  }

  function scrollToBottomIfNearEnd(force) {
    const el = dom.transcript;
    const nearEnd = force || (el.scrollHeight - el.scrollTop - el.clientHeight < 160);
    if (nearEnd) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }

  function setErrorVisible(visible, text) {
    dom.errorRow.style.display = visible ? 'flex' : 'none';
    if (text) dom.errorText.textContent = text;
  }

  function renderComposerLocked(locked, hideEntirely) {
    dom.input.disabled = locked;
    dom.sendBtn.disabled = locked;
    dom.voiceBtn.disabled = locked;
    dom.composerInner.style.display = hideEntirely ? 'none' : 'flex';
    dom.continueRow.style.display = hideEntirely ? 'flex' : 'none';
  }

  function renderRetryAffordance(textToRetry, onRetry) {
    setErrorVisible(true, 'Cadence is having trouble responding right now. Your answer is saved.');
    dom.retryBtn.onclick = function () {
      setErrorVisible(false);
      if (onRetry) { onRetry(); return; }
      if (textToRetry) {
        const pending = readPending(session.moduleId, session.cpId);
        const requestId = (pending && pending.text === textToRetry && pending.requestId) || uuid();
        renderTyping(true, 'Cadence is reviewing your response…');
        submitEvaluation(textToRetry, requestId);
      }
    };
  }

  function restoreDraftIfAny() {
    if (!session) return;
    const draft = readDraft(session.moduleId, session.mode === 'ask_cadence' ? ASK_CADENCE_KEY : session.cpId);
    if (draft) { dom.input.value = draft; autoGrowInput(); }
  }

  // ── Sending ──

  function onSendClick() {
    if (!session || session.busy) return;
    const text = dom.input.value.trim();
    if (!text) return;
    dom.input.value = '';
    autoGrowInput();
    writeDraft(session.moduleId, session.mode === 'ask_cadence' ? ASK_CADENCE_KEY : session.cpId, '');

    if (session.mode === 'ask_cadence') {
      if (session.review) { sendAskReviewMessage(text); return; }
      appendMessageEl('user', text);
      scrollToBottomIfNearEnd(true);
      sendAskCadenceMessage(text);
      return;
    }

    if (session.review) { sendReviewMessage(text); return; }

    appendMessageEl('user', text);
    scrollToBottomIfNearEnd(true);
    const requestId = uuid();
    writePending(session.moduleId, session.cpId, { requestId, text });
    renderTyping(true, 'Cadence is reviewing your response…');
    submitEvaluation(text, requestId);
  }

  function onRetryClick() {
    // Default no-op target; renderRetryAffordance() overrides
    // dom.retryBtn.onclick per-context with the correct retry action.
  }

  async function submitEvaluation(text, requestId) {
    if (!session) return;
    session.busy = true;
    renderComposerLocked(true);
    setErrorVisible(false);
    let result;
    try {
      result = await window.evaluateCheckpointAnswer(session.moduleId, session.cpId, session.system, session.question, text, requestId);
    } catch (e) {
      renderTyping(false);
      session.busy = false;
      renderComposerLocked(false);
      renderRetryAffordance(text);
      return;
    }
    renderTyping(false);
    writePending(session.moduleId, session.cpId, null);
    session.busy = false;

    appendMessageEl('assistant', result.feedback || '');

    if (result.pass) {
      commitCheckpointPass(session.moduleId, session.cpId, text, result);
      renderComposerLocked(true, true);
      const banner = document.createElement('div');
      banner.className = 'cshell-pass-banner';
      banner.innerHTML = ICON_CHECK + ' Competency demonstrated';
      dom.transcriptInner.appendChild(banner);
    } else {
      commitCheckpointRevise(session.moduleId, session.cpId, text, result);
      renderComposerLocked(false);
      dom.input.focus();
    }
    scrollToBottomIfNearEnd(true);
  }

  // ── Authority glue (mirrors submitCheckpoint()'s existing .then()
  //    branch byte-for-byte in call sequence — this file never decides
  //    pass/revise itself, it only records what the server already
  //    decided, exactly as the pre-Phase-2 inline widget did). ──

  function commitCheckpointPass(moduleId, cpId, answer, result) {
    window.APP_STATE.setCheckpointResult(moduleId, cpId, { passed: true, feedback: result.feedback, answer, modelInfo: result.modelInfo });
    window.APP_STATE.captureCheckpointMemory(moduleId, cpId);
    window.APP_STATE.addResponse(answer);
    const didComplete = window.APP_STATE._checkModuleComplete(moduleId);
    if (typeof window.renderCheckpointOutcomeLabel === 'function') window.renderCheckpointOutcomeLabel(moduleId, cpId);
    if (typeof window.applyCheckpointInputState === 'function') window.applyCheckpointInputState(moduleId, cpId);
    if (didComplete && typeof window.resolveModuleCompletionUI === 'function') window.resolveModuleCompletionUI(moduleId);
    if (typeof window.renderHomeProgress === 'function') window.renderHomeProgress();
    if (typeof window.updateLessonProgress === 'function') window.updateLessonProgress();
  }

  function commitCheckpointRevise(moduleId, cpId, answer, result) {
    window.APP_STATE.setCheckpointResult(moduleId, cpId, { passed: false, feedback: result.feedback, answer, modelInfo: result.modelInfo });
    if (typeof window.renderCheckpointOutcomeLabel === 'function') window.renderCheckpointOutcomeLabel(moduleId, cpId);
    if (typeof window.applyCheckpointInputState === 'function') window.applyCheckpointInputState(moduleId, cpId);
    if (typeof window.updateLessonProgress === 'function') window.updateLessonProgress();
  }

  // ── Review Mode: entirely separate, non-persisting path ──
  // Structurally mirrors submitCheckpointReviewMode()/
  // evaluateCheckpointAnswerReviewMode() — never calls get-thread,
  // never calls /api/cadence/evaluate-checkpoint, never touches
  // APP_STATE. Provides labeled fixtures for every state Section 24
  // requires, plus a "live" option that exercises real grading (via the
  // existing direct-to-Worker callAI() path) without persisting.

  const FIXTURES = {
    live: null,
    incomplete: { pass: false, feedback: 'You’re close, but this doesn’t yet say what you’d document or why one label for the whole area would be misleading. Add that piece.' },
    clarification: { pass: false, feedback: 'Good — the two regions are clear. What’s still missing is the one question you’d ask before adjusting the service.' },
    pass: { pass: true, feedback: 'That covers it clearly — the regional distinction, the reasoning, and a specific follow-up question.' },
    error: 'error',
  };

  function renderFixtureBar() {
    dom.fixtures.innerHTML = '';
    const options = [
      ['live', 'Live (real grading)'],
      ['incomplete', 'Fixture: incomplete'],
      ['clarification', 'Fixture: clarification'],
      ['pass', 'Fixture: pass'],
      ['historical', 'Fixture: historical / no transcript'],
      ['error', 'Fixture: evaluation error'],
      ['resumed', 'Fixture: resumed unfinished'],
    ];
    options.forEach(([key, label]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cshell-fixture-btn';
      btn.textContent = label;
      btn.dataset.fixture = key;
      btn.onclick = () => renderFixture(key);
      dom.fixtures.appendChild(btn);
    });
  }

  function markActiveFixture(key) {
    session.activeFixture = key;
    Array.prototype.forEach.call(dom.fixtures.querySelectorAll('.cshell-fixture-btn'), (b) => {
      b.classList.toggle('active', b.dataset.fixture === key);
    });
  }

  function renderFixture(key) {
    markActiveFixture(key);
    clearTranscript();
    setErrorVisible(false);
    dom.input.value = '';

    if (key === 'live') {
      renderActivationTurn();
      renderComposerLocked(false);
      return;
    }
    if (key === 'historical') {
      renderResolvedState([], { answer: 'Sample stored answer from a checkpoint passed before this conversation schema existed.', feedback: 'Sample stored Cadence feedback from that earlier pass.' });
      return;
    }
    if (key === 'resumed') {
      renderActivationTurn();
      appendMessageEl('user', 'This is my partial answer from before I left.');
      renderComposerLocked(false);
      dom.input.value = '';
      return;
    }
    if (key === 'error') {
      renderActivationTurn();
      appendMessageEl('user', 'A student answer that will hit a simulated provider failure.');
      renderComposerLocked(false);
      renderRetryAffordance('A student answer that will hit a simulated provider failure.', function () {
        appendAssistantSystemNote('(Fixture) Cadence is still unavailable in this simulation.');
        renderRetryAffordance('A student answer that will hit a simulated provider failure.');
      });
      return;
    }
    // incomplete / clarification / pass
    renderActivationTurn();
    appendMessageEl('user', 'A representative student answer.');
    const fx = FIXTURES[key];
    appendMessageEl('assistant', fx.feedback);
    if (fx.pass) {
      renderComposerLocked(true, true);
      const banner = document.createElement('div');
      banner.className = 'cshell-pass-banner';
      banner.innerHTML = ICON_CHECK + ' Competency demonstrated (fixture)';
      dom.transcriptInner.appendChild(banner);
    } else {
      renderComposerLocked(false);
    }
  }

  async function sendReviewMessage(text) {
    if (session.activeFixture && session.activeFixture !== 'live') {
      // Fixture-driven turns are static demonstrations, not a live loop —
      // sending during a fixture just appends the student's text for
      // inspection without a second model call.
      appendMessageEl('user', text);
      scrollToBottomIfNearEnd(true);
      return;
    }
    appendMessageEl('user', text);
    scrollToBottomIfNearEnd(true);
    session.busy = true;
    renderComposerLocked(true);
    renderTyping(true, 'Cadence is reviewing your response…');
    let result;
    try {
      result = await window.evaluateCheckpointAnswerReviewMode(session.reviewSystem, session.question, text);
    } catch (e) {
      renderTyping(false);
      session.busy = false;
      renderComposerLocked(false);
      renderRetryAffordance(text, function () { sendReviewMessage(text); });
      return;
    }
    renderTyping(false);
    session.busy = false;
    appendMessageEl('assistant', '[Review Mode test — not saved] ' + (result.feedback || ''));
    if (result.pass) {
      renderComposerLocked(true, true);
      const banner = document.createElement('div');
      banner.className = 'cshell-pass-banner';
      banner.innerHTML = ICON_CHECK + ' Competency demonstrated (Review Mode — not saved)';
      dom.transcriptInner.appendChild(banner);
    } else {
      renderComposerLocked(false);
      dom.input.focus();
    }
    scrollToBottomIfNearEnd(true);
  }

  // ── Ask Cadence Review Mode: fixture states (Section 37) ──
  // Never persists production messages, never calls a live model unless
  // the 'live' fixture is explicitly selected -- mirrors the checkpoint
  // fixture bar's own isolation guarantee exactly.

  const ASK_FIXTURE_OPTIONS = [
    ['empty', 'Fixture: empty thread'],
    ['existing', 'Fixture: existing conversation'],
    ['guardrail', 'Fixture: active-checkpoint guardrail'],
    ['error', 'Fixture: error / retry'],
    ['live', 'Live (real Ask Cadence call)'],
  ];

  function renderAskFixtureBar() {
    dom.fixtures.innerHTML = '';
    ASK_FIXTURE_OPTIONS.forEach(([key, label]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cshell-fixture-btn';
      btn.textContent = label;
      btn.dataset.fixture = key;
      btn.onclick = () => renderAskFixture(key);
      dom.fixtures.appendChild(btn);
    });
  }

  function renderAskFixture(key) {
    markActiveFixture(key);
    clearTranscript();
    setErrorVisible(false);
    dom.input.value = '';

    if (key === 'empty') {
      renderAskActivationTurn();
      renderComposerLocked(false);
      return;
    }
    if (key === 'existing') {
      appendMessageEl('assistant', 'Ask me anything about this module — this is just between us, nothing here is graded.');
      appendMessageEl('user', 'Why does the crown region get treated differently from the hairline?');
      appendMessageEl('assistant', 'Because they can present completely differently on the same scalp — treating the whole head like the crown alone would erase that difference and lead to the wrong service decision for the hairline.');
      renderComposerLocked(false);
      return;
    }
    if (key === 'guardrail') {
      appendMessageEl('assistant', 'Ask me anything about this module — this is just between us, nothing here is graded.');
      appendMessageEl('user', 'Just tell me exactly what to type to pass this checkpoint.');
      appendMessageEl('assistant', '(Fixture) I can\'t hand you the checkpoint answer directly — but let\'s talk through what the scan is actually asking you to notice between the two regions. What differences did you observe?');
      renderComposerLocked(false);
      return;
    }
    if (key === 'error') {
      renderAskActivationTurn();
      appendMessageEl('user', 'A question that will hit a simulated failure.');
      renderRetryAffordance('A question that will hit a simulated failure.', function () {
        appendAssistantSystemNote('(Fixture) Cadence is still unavailable in this simulation.');
        renderRetryAffordance('A question that will hit a simulated failure.');
      });
      return;
    }
    // 'live' — real activation turn, composer wired to the real endpoint.
    renderAskActivationTurn();
    renderComposerLocked(false);
  }

  async function sendAskReviewMessage(text) {
    if (session.activeFixture && session.activeFixture !== 'live') {
      appendMessageEl('user', text);
      scrollToBottomIfNearEnd(true);
      return;
    }
    appendMessageEl('user', text);
    scrollToBottomIfNearEnd(true);
    await sendAskCadenceMessage(text);
  }

  window.CadenceShell = { openCheckpoint, wireCheckpoint, openAskCadence };
})();
