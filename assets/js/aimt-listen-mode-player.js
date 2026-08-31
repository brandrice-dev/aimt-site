// AIMT Listen Mode — reusable player primitive.
//
// Course/module-agnostic. Reads a manifest from AIMTListenModeData and reads
// (never writes) course progress from the page's APP_STATE. This file is
// deliberately split into two halves:
//
//   1. `engine` — pure functions (no DOM, no audio, no storage side effects
//      beyond the explicit storage helpers). These decide *what should
//      happen* given a manifest + course state. They are the part covered
//      by direct unit tests.
//   2. `mount()` / UI rendering — the DOM/audio-element layer that acts on
//      what `engine` decides. This half owns exactly one thing: the
//      student's listening experience (position, playback, chunk
//      transitions). It never calls any APP_STATE method that writes
//      course progress, checkpoints, or completion — see the "READ-ONLY
//      CONTRACT" note below, which is enforced by construction (grep this
//      file for APP_STATE writes and there are none) and proven by
//      tests/aimt-listen-mode-module1-pilot.test.mjs.
//
// READ-ONLY CONTRACT: Listen Mode reads course state. It does not own
// course state. It never calls setCheckpointResult, _checkModuleComplete,
// setReadProgress, setVideoChapterComplete, captureCheckpointMemory, or
// APP_STATE's persistence method. Checkpoint passing/failing remains entirely owned
// by the existing checkpoint UI (submitCheckpoint() in headspa-mastery.html)
// and its grading pipeline. This file only ever calls read accessors
// (getModuleProgress, isModuleComplete, reconcileModuleState).

(function (root) {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────
  // ENGINE (pure — no DOM, no network, no audio)
  // ─────────────────────────────────────────────────────────────────────

  function isCheckpointPassed(appState, moduleId, checkpointId) {
    if (!appState || typeof appState.getModuleProgress !== 'function' || !checkpointId) return false;
    try {
      if (typeof appState.reconcileModuleState === 'function') appState.reconcileModuleState(moduleId);
    } catch (e) { /* best-effort freshness only; fall through to a direct read */ }
    var progress = appState.getModuleProgress(moduleId);
    return !!(progress && Array.isArray(progress.checkpoints) && progress.checkpoints.indexOf(checkpointId) !== -1);
  }

  // A chunk is playable right now if it isn't gated behind a checkpoint that
  // hasn't passed yet. 'normal' and 'checkpoint-stop' chunks are always
  // playable when reached — the checkpoint-stop chunk IS the checkpoint
  // prompt narration, not the checkpoint itself.
  function isChunkPlayable(chunk, appState) {
    if (!chunk) return false;
    if (chunk.gateType !== 'post-pass') return true;
    return isCheckpointPassed(appState, chunk.moduleId, chunk.checkpointId);
  }

  // Decide what happens after the chunk at `index` finishes playing.
  function resolveAfterEnd(chunks, index, appState) {
    var current = chunks[index];
    if (!current) return { type: 'ended' };
    if (current.gateType === 'checkpoint-stop') {
      return { type: 'awaiting-checkpoint', checkpointId: current.checkpointId, afterIndex: index + 1 };
    }
    var nextIndex = index + 1;
    if (nextIndex >= chunks.length) return { type: 'ended' };
    var next = chunks[nextIndex];
    if (!isChunkPlayable(next, appState)) return { type: 'locked', index: nextIndex, checkpointId: next.checkpointId };
    return { type: 'advance', index: nextIndex };
  }

  // Resume position resolution: use the stored chunk if the student
  // genuinely has one AND it's still unlocked. Otherwise start at the
  // beginning (index 0) — Listen Mode is a narration experience, not a
  // progress tracker, so a first-time listener always hears the module
  // from M1-01 regardless of what they may have already passed via the
  // on-screen checkpoint UI. Never returns an index the student isn't
  // authoritatively allowed to hear yet.
  function resolveResumeIndex(chunks, appState, storedChunkId) {
    if (!Array.isArray(chunks) || chunks.length === 0) return 0;
    if (storedChunkId) {
      for (var i = 0; i < chunks.length; i++) {
        if (chunks[i].chunkId === storedChunkId) {
          return isChunkPlayable(chunks[i], appState) ? i : 0;
        }
      }
    }
    return 0;
  }

  function storageKey(courseSlug, moduleId) {
    return 'aimt_listen_position::' + courseSlug + '::' + moduleId;
  }

  function serializePosition(pos) {
    return JSON.stringify({
      chunkId: pos.chunkId || null,
      timeSec: typeof pos.timeSec === 'number' ? pos.timeSec : 0,
      speed: typeof pos.speed === 'number' ? pos.speed : 1,
      // True only when the student's last session reached the natural end
      // of the module's final chunk (see the 'ended' handler in
      // createPlayerInstance). This is the one bit of state that separates
      // "finished listening" from "paused partway through" — both would
      // otherwise look identical (a stored chunkId + a low/zero timeSec),
      // since every chunk transition also persists timeSec:0 for the new
      // chunk. Never inferred from timeSec/duration proximity, so closing
      // the player near-but-not-at the end of the module still resumes
      // normally instead of being mistaken for a finish.
      finished: pos.finished === true,
      updatedAt: new Date().toISOString()
    });
  }

  function parsePosition(raw) {
    if (!raw) return null;
    try {
      var obj = JSON.parse(raw);
      if (!obj || typeof obj !== 'object') return null;
      return {
        chunkId: typeof obj.chunkId === 'string' ? obj.chunkId : null,
        timeSec: typeof obj.timeSec === 'number' ? obj.timeSec : 0,
        speed: typeof obj.speed === 'number' ? obj.speed : 1,
        finished: obj.finished === true
      };
    } catch (e) {
      return null;
    }
  }

  // Reads this module's stored Listen Mode position directly from
  // localStorage. Returns null (not a zeroed placeholder object) when
  // nothing is stored yet, so callers can distinguish "never listened" from
  // "listened, currently at the very start" — resolveEntryState below
  // depends on that distinction. Storage access failures (private
  // browsing, quota, non-browser test environment) fail safe to null;
  // resume/finish state is a convenience, never a requirement for
  // playback.
  function readStoredPosition(win, courseSlug, moduleId) {
    try {
      var raw = win && win.localStorage && win.localStorage.getItem(storageKey(courseSlug, moduleId));
      return parsePosition(raw);
    } catch (e) {
      return null;
    }
  }

  // Course/module completion (APP_STATE) and Listen Mode's own playback
  // position are two different state domains — this function reads ONLY
  // the latter. A module the student finished via the on-screen checkpoint
  // UI but never opened Listen Mode for still resolves to 'never-started'
  // here, and that's correct: the entry button's job is to describe the
  // LISTENING session, not the course-progress state.
  //
  //   'never-started' — no stored position, or its chunkId no longer
  //                      matches any chunk in the current manifest.
  //   'finished'       — the student's last Listen Mode session reached
  //                      the natural end of the module's narration.
  //   'resume'         — a real, unfinished, still-valid position exists.
  function resolveEntryState(chunks, storedPosition) {
    if (!storedPosition || !storedPosition.chunkId) return 'never-started';
    if (storedPosition.finished) return 'finished';
    if (!Array.isArray(chunks)) return 'never-started';
    for (var i = 0; i < chunks.length; i++) {
      if (chunks[i].chunkId === storedPosition.chunkId) return 'resume';
    }
    return 'never-started';
  }

  // The chunk index Listen Mode should open on. 'finished' and
  // 'never-started' both start over at the beginning — a student who
  // finished the module is never dropped back into the closing recap
  // chunk merely because that's where their last session's pointer was
  // left sitting.
  function resolveEntryIndex(chunks, appState, storedPosition) {
    var state = resolveEntryState(chunks, storedPosition);
    if (state === 'resume') return resolveResumeIndex(chunks, appState, storedPosition.chunkId);
    return 0;
  }

  var engine = {
    isCheckpointPassed: isCheckpointPassed,
    isChunkPlayable: isChunkPlayable,
    resolveAfterEnd: resolveAfterEnd,
    resolveResumeIndex: resolveResumeIndex,
    storageKey: storageKey,
    serializePosition: serializePosition,
    parsePosition: parsePosition,
    readStoredPosition: readStoredPosition,
    resolveEntryState: resolveEntryState,
    resolveEntryIndex: resolveEntryIndex
  };

  // ─────────────────────────────────────────────────────────────────────
  // UI / PLAYBACK LAYER
  // ─────────────────────────────────────────────────────────────────────

  var SKIP_SECONDS = 12;
  var SPEEDS = [0.75, 1, 1.25, 1.5];
  var POLL_MS = 1000;
  var STYLE_EL_ID = 'aimt-listen-mode-styles';

  // Student-facing entry-button copy for each engine.resolveEntryState()
  // value. Kept as one small lookup so the button label can never drift
  // out of sync with the state that actually decided where playback starts.
  var ENTRY_LABELS = {
    'never-started': { title: 'Listen with Cadence', verb: 'Press to start listening.' },
    'resume': { title: 'Resume Listening', verb: 'Press to resume where you left off.' },
    'finished': { title: 'Listen Again', verb: 'Press to listen again from the beginning.' }
  };

  function entryLabelForState(state) {
    return ENTRY_LABELS[state] || ENTRY_LABELS['never-started'];
  }

  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // Engineering/QA inspection mode -- drives the "QA preview" badge and
  // anything else that should look visibly different from the real
  // student experience. Deliberately does NOT include Student Preview
  // (below): the owner's product-review experience must render exactly
  // like normal student UI, badge included.
  function inQAMode() {
    try {
      if (root.AIMT_LISTEN_MODE_QA_FORCE === true) return true;
      // The app's general owner Review Mode (?review=1, headspa-state.js
      // ReviewMode, hard-blocked on production) also unlocks GENERATED
      // (not yet APPROVED) Listen Mode audio for review-listening --
      // normal student sessions stay gated on isProductionReady() below.
      if (root.ReviewMode && typeof root.ReviewMode.isActive === 'function' && root.ReviewMode.isActive()) return true;
      var search = (root.location && root.location.search) || '';
      return /[?&]listenQA=1\b/.test(search);
    } catch (e) {
      return false;
    }
  }

  // Whether GENERATED (not yet APPROVED) audio may be treated as playable
  // at all -- true for genuine QA/Review inspection (inQAMode()) AND for
  // the owner's localhost-only Student Preview (headspa-state.js
  // StudentPreview, hostname-allowlisted to 127.0.0.1/localhost). This is
  // the ONLY thing Student Preview relaxes; it must never affect the QA
  // badge (inQAMode() alone still drives that) or anything else.
  function canUseUnapprovedAudio() {
    try {
      if (inQAMode()) return true;
      if (root.StudentPreview && typeof root.StudentPreview.isActive === 'function' && root.StudentPreview.isActive()) return true;
      return false;
    } catch (e) {
      return false;
    }
  }

  function ensureStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_EL_ID)) return;
    var style = doc.createElement('style');
    style.id = STYLE_EL_ID;
    style.textContent = [
      '.aimt-lm-entry{display:flex;align-items:center;gap:0.85rem;width:100%;text-align:left;',
      'background:rgba(255,255,255,0.06);border:0.5px solid rgba(255,255,255,0.16);',
      'border-radius:var(--aimt-radius-md,12px);padding:0.85rem 1rem;',
      'font-family:var(--aimt-font-sans,sans-serif);cursor:pointer;transition:background 0.2s,border-color 0.2s;}',
      '.aimt-lm-entry:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.28);}',
      '.aimt-lm-entry:focus-visible{outline:2px solid rgba(255,255,255,0.65);outline-offset:2px;}',
      '.aimt-lm-entry:disabled{opacity:0.55;cursor:default;pointer-events:none;}',
      '.aimt-lm-entry-play{flex-shrink:0;width:34px;height:34px;border-radius:50%;display:flex;',
      'align-items:center;justify-content:center;color:#fff;background:rgba(255,255,255,0.08);',
      'border:0.5px solid rgba(255,255,255,0.3);}',
      '.aimt-lm-entry-copy{display:flex;flex-direction:column;gap:2px;min-width:0;}',
      '.aimt-lm-entry-title{font-family:var(--aimt-font-mont,inherit);font-size:0.8rem;font-weight:600;',
      'letter-spacing:0.02em;color:#fff;}',
      '.aimt-lm-entry-meta{font-family:var(--aimt-font-mono,inherit);font-size:0.66rem;letter-spacing:0.03em;',
      'color:rgba(255,255,255,0.5);}',
      '.aimt-lm-bar{position:fixed;left:0;right:0;bottom:0;z-index:2400;background:var(--bg,#faf8f5);',
      'border-top:0.5px solid var(--border2,rgba(0,0,0,0.09));box-shadow:0 -6px 24px rgba(0,0,0,0.06);',
      'font-family:var(--aimt-font-sans,sans-serif);display:flex;flex-direction:column;gap:0.55rem;',
      'padding:0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom,0px)) 1rem;}',
      '.aimt-lm-bar.aimt-lm-collapsed .aimt-lm-body{display:none;}',
      '.aimt-lm-row{display:flex;align-items:center;gap:0.6rem;}',
      '.aimt-lm-title{font-size:0.72rem;letter-spacing:0.02em;color:var(--muted,#a3968d);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.aimt-lm-btn{background:#262626;color:#fff;border:none;border-radius:var(--aimt-radius-sm,6px);',
      'width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-size:0.85rem;}',
      '.aimt-lm-btn:disabled{background:var(--muted2,#c4bdb5);cursor:not-allowed;}',
      '.aimt-lm-btn.aimt-lm-ghost{background:transparent;color:var(--text,#262626);border:0.5px solid var(--border2,rgba(0,0,0,0.09));}',
      '.aimt-lm-speed{background:transparent;border:0.5px solid var(--border2,rgba(0,0,0,0.09));border-radius:var(--aimt-radius-sm,6px);',
      'color:var(--text,#262626);font-size:0.72rem;font-family:var(--aimt-font-sans,sans-serif);padding:0.3rem 0.5rem;cursor:pointer;flex-shrink:0;}',
      '.aimt-lm-time{font-size:0.7rem;color:var(--muted,#a3968d);flex-shrink:0;min-width:7.5em;text-align:right;}',
      '.aimt-lm-progress{flex:1;height:3px;background:var(--border2,rgba(0,0,0,0.09));border-radius:2px;position:relative;cursor:pointer;}',
      '.aimt-lm-progress-fill{position:absolute;left:0;top:0;bottom:0;background:var(--accent2,#4d403a);border-radius:2px;}',
      '.aimt-lm-note{font-size:0.72rem;line-height:1.5;color:var(--muted,#a3968d);}',
      '.aimt-lm-resume{background:var(--accent2,#4d403a);color:#fff;border:none;border-radius:var(--aimt-radius-sm,6px);',
      'padding:0.5rem 0.9rem;font-size:0.76rem;font-weight:500;font-family:var(--aimt-font-sans,sans-serif);cursor:pointer;}',
      '.aimt-lm-qa-badge{font-size:0.62rem;letter-spacing:0.06em;text-transform:uppercase;color:var(--aimt-warning,#8b5e00);',
      'background:var(--aimt-warning-light,#fff4e8);border-radius:4px;padding:0.15rem 0.4rem;flex-shrink:0;margin-left:auto;}'
    ].join('');
    doc.head.appendChild(style);
  }

  // Total narration length + checkpoint-stop count, computed from the real
  // manifest rather than hand-typed -- can't silently drift out of sync
  // with the actual chunks the way a hardcoded "~16 min" string could.
  function computeEntrySummary(chunks) {
    var totalSec = 0;
    var checkpointCount = 0;
    for (var i = 0; i < chunks.length; i++) {
      if (typeof chunks[i].duration === 'number') totalSec += chunks[i].duration;
      if (chunks[i].gateType === 'checkpoint-stop') checkpointCount++;
    }
    return { minutes: Math.round(totalSec / 60), checkpointCount: checkpointCount };
  }

  function entryMetaText(summary) {
    return '~' + summary.minutes + ' min · Includes ' + summary.checkpointCount +
      ' checkpoint stop' + (summary.checkpointCount === 1 ? '' : 's');
  }

  // The single real, semantic entry control -- an unmistakable play button,
  // not a decorative row. The entire element is the hit target (native
  // <button>, so click/Enter/Space/focus all work for free); onClick owns
  // starting playback on the very first activation, see mount() below.
  function buildEntryButton(doc, chunks, onClick, entryState) {
    var summary = computeEntrySummary(chunks);
    var meta = entryMetaText(summary);
    var labels = entryLabelForState(entryState);
    var btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'aimt-lm-entry';
    btn.setAttribute('aria-label', labels.title + '. ' + meta + '. ' + labels.verb);

    var playIcon = doc.createElement('span');
    playIcon.className = 'aimt-lm-entry-play';
    playIcon.setAttribute('aria-hidden', 'true');
    playIcon.innerHTML = '<svg viewBox="0 0 32 32" width="20" height="20" fill="none">' +
      '<circle cx="16" cy="16" r="15" stroke="currentColor" stroke-width="1"/>' +
      '<path d="M13 10.5 L22 16 L13 21.5 Z" fill="currentColor"/></svg>';

    var copy = doc.createElement('span');
    copy.className = 'aimt-lm-entry-copy';
    var title = doc.createElement('span');
    title.className = 'aimt-lm-entry-title';
    title.textContent = labels.title;
    var metaEl = doc.createElement('span');
    metaEl.className = 'aimt-lm-entry-meta';
    metaEl.textContent = meta;
    copy.appendChild(title);
    copy.appendChild(metaEl);

    btn.appendChild(playIcon);
    btn.appendChild(copy);
    btn.addEventListener('click', onClick);
    return btn;
  }

  // One player instance per mount() call. Returned object exposes destroy()
  // so a module re-open (openModuleById navigating away and back) can tear
  // down cleanly instead of leaking a second floating bar.
  function createPlayerInstance(opts) {
    var doc = opts.doc;
    var win = opts.win;
    var courseSlug = opts.courseSlug;
    var moduleId = opts.moduleId;
    var chunks = opts.chunks;
    var appState = opts.appState;
    var mountEl = opts.mountEl;

    var audio = doc.createElement('audio');
    audio.preload = 'none';

    var index = engine.resolveEntryIndex(chunks, appState, engine.readStoredPosition(win, courseSlug, moduleId));
    var awaitingCheckpointId = null;
    var pollTimer = null;
    var gapTimer = null;
    var destroyed = false;

    function readStoredPosition() {
      return engine.readStoredPosition(win, courseSlug, moduleId) || { chunkId: null, timeSec: 0, speed: 1, finished: false };
    }

    // `finished` defaults to false — every ordinary progress write (chunk
    // transitions, pause, seek, timeupdate) is an in-progress position.
    // Only the module's true final-chunk 'ended' event (below) ever passes
    // finished:true. Passing it explicitly here rather than inferring it
    // keeps "paused near the end" and "actually finished" from ever being
    // confused, per the owner's restart/replay finding.
    function persistPosition(timeSec, finished) {
      try {
        if (!win.localStorage) return;
        var chunk = chunks[index];
        win.localStorage.setItem(
          engine.storageKey(courseSlug, moduleId),
          engine.serializePosition({ chunkId: chunk ? chunk.chunkId : null, timeSec: timeSec || 0, speed: audio.playbackRate || 1, finished: !!finished })
        );
      } catch (e) { /* localStorage may be unavailable (private mode, quota) — resume is a convenience, never required */ }
    }

    // ── UI shell ──
    ensureStyles(doc);
    var bar = doc.createElement('div');
    bar.className = 'aimt-lm-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Listen Mode player');

    var topRow = doc.createElement('div');
    topRow.className = 'aimt-lm-row';
    var title = doc.createElement('div');
    title.className = 'aimt-lm-title';
    // Restrained/deliberate: a small ghost icon button, same visual weight
    // as minimize/close, gated behind a confirm() prompt so an accidental
    // tap can't wipe out a long module's listening position. Restarts only
    // this module's Listen Mode position — never course progress,
    // checkpoints, or Cadence transcripts (see startOver() below).
    var startOverBtn = doc.createElement('button');
    startOverBtn.type = 'button';
    startOverBtn.className = 'aimt-lm-btn aimt-lm-ghost';
    startOverBtn.setAttribute('aria-label', 'Start over from the beginning');
    startOverBtn.setAttribute('title', 'Start over');
    startOverBtn.textContent = '↺';
    var minimizeBtn = doc.createElement('button');
    minimizeBtn.type = 'button';
    minimizeBtn.className = 'aimt-lm-btn aimt-lm-ghost';
    minimizeBtn.setAttribute('aria-label', 'Minimize player');
    minimizeBtn.textContent = '—';
    var closeBtn = doc.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'aimt-lm-btn aimt-lm-ghost';
    closeBtn.setAttribute('aria-label', 'Close player');
    closeBtn.textContent = '×';
    topRow.appendChild(title);
    topRow.appendChild(startOverBtn);
    topRow.appendChild(minimizeBtn);
    topRow.appendChild(closeBtn);

    var body = doc.createElement('div');
    body.className = 'aimt-lm-body';

    var controlRow = doc.createElement('div');
    controlRow.className = 'aimt-lm-row';
    var backBtn = doc.createElement('button');
    backBtn.type = 'button'; backBtn.className = 'aimt-lm-btn'; backBtn.textContent = '«';
    backBtn.setAttribute('aria-label', 'Back ' + SKIP_SECONDS + ' seconds');
    var playBtn = doc.createElement('button');
    playBtn.type = 'button'; playBtn.className = 'aimt-lm-btn'; playBtn.textContent = '▶';
    playBtn.setAttribute('aria-label', 'Play');
    var fwdBtn = doc.createElement('button');
    fwdBtn.type = 'button'; fwdBtn.className = 'aimt-lm-btn'; fwdBtn.textContent = '»';
    fwdBtn.setAttribute('aria-label', 'Forward ' + SKIP_SECONDS + ' seconds');
    var progress = doc.createElement('div');
    progress.className = 'aimt-lm-progress';
    var progressFill = doc.createElement('div');
    progressFill.className = 'aimt-lm-progress-fill';
    progress.appendChild(progressFill);
    var timeEl = doc.createElement('div');
    timeEl.className = 'aimt-lm-time';
    var speedBtn = doc.createElement('button');
    speedBtn.type = 'button'; speedBtn.className = 'aimt-lm-speed'; speedBtn.textContent = '1×';

    controlRow.appendChild(backBtn);
    controlRow.appendChild(playBtn);
    controlRow.appendChild(fwdBtn);
    controlRow.appendChild(progress);
    controlRow.appendChild(timeEl);
    controlRow.appendChild(speedBtn);

    var noteEl = doc.createElement('div');
    noteEl.className = 'aimt-lm-note';
    noteEl.setAttribute('aria-live', 'polite');

    body.appendChild(controlRow);
    body.appendChild(noteEl);
    bar.appendChild(topRow);
    bar.appendChild(body);
    // Attached (not just held in a closure) for Media Session reliability
    // and iOS Safari, which is inconsistent about detached-element
    // playback. Hidden — the visible transport controls above are what
    // the student actually interacts with.
    audio.style.display = 'none';
    bar.appendChild(audio);

    // Coordinates the fixed-position Ask Cadence pill (#guideBtn in
    // headspa-mastery.html) with this bar so the two never overlap --
    // reusable layout state (a CSS custom property this player owns),
    // not a per-module pixel override. ResizeObserver naturally fires
    // for every case that matters here: the bar's parent going from
    // display:none to visible (reveal), the minimize/expand toggle
    // (.aimt-lm-collapsed hides .aimt-lm-body), a later re-hide via the
    // entry button's toggle-to-hide branch, and viewport-driven reflow --
    // so one observer covers mount, reveal, collapse, and destroy without
    // each of those call sites needing to remember to call this.
    var barOffsetObserver = null;
    function syncBarOffset() {
      try {
        var h = (mountEl.style.display !== 'none') ? bar.offsetHeight : 0;
        doc.documentElement.style.setProperty('--aimt-lm-bar-offset', h > 0 ? (h + 16) + 'px' : '0px');
      } catch (e) { /* layout coordination is an enhancement only, never required for playback */ }
    }
    if (typeof win.ResizeObserver === 'function') {
      barOffsetObserver = new win.ResizeObserver(syncBarOffset);
      barOffsetObserver.observe(bar);
    } else {
      win.addEventListener('resize', syncBarOffset);
      syncBarOffset();
    }

    function setNote(text) { noteEl.textContent = text || ''; }

    function scrollToVisualTarget(chunk) {
      if (!chunk || !chunk.visualTarget) return;
      // Scoped to the live .lesson-wrap, not a bare document-wide
      // getElementById -- a module's hidden `#moduleNWrap` source
      // template (the source wrap.innerHTML is cloned from) carries its
      // own copy of every id inside it, visualTarget ids included, so an
      // unscoped lookup is genuinely ambiguous about which copy it
      // resolves to. .lesson-wrap itself is never duplicated (only its
      // cloned contents are), so it's a safe, stable scoping root.
      var scope = (doc.querySelector && doc.querySelector('.lesson-wrap')) || doc;
      var el = scope.querySelector ? scope.querySelector('[id="' + chunk.visualTarget + '"]') : null;
      if (!el || typeof el.getBoundingClientRect !== 'function') return;
      // Center within the space actually visible above the fixed player
      // bar, not the raw window height -- a naive scrollIntoView({block:
      // 'center'}) centers against the full viewport and can leave a tall
      // card's bottom portion resting behind the bar. --aimt-lm-bar-offset
      // (set by syncBarOffset() above) is the same reusable offset the
      // #guideBtn pill already coordinates against, so this reads it
      // rather than re-deriving the bar's height a second way.
      try {
        var barOffset = parseFloat(win.getComputedStyle(doc.documentElement).getPropertyValue('--aimt-lm-bar-offset')) || 0;
        var visibleHeight = Math.max(win.innerHeight - barOffset, win.innerHeight * 0.5);
        var rect = el.getBoundingClientRect();
        var elMid = rect.top + rect.height / 2;
        var delta = elMid - (visibleHeight / 2);
        if (Math.abs(delta) > 4 && typeof win.scrollBy === 'function') {
          win.scrollBy({ top: delta, behavior: 'smooth' });
        }
      } catch (e) {
        if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    function updateTitle(chunk) {
      // Real student orientation (module + section number + section
      // title, from the manifest's studentLabel) -- never an internal
      // chunk id/count. "Chunk 4 of 14" is production terminology and
      // must never reach a student; chunkId/index stay engineering-only.
      title.textContent = chunk ? (chunk.studentLabel || chunk.title || '') : '';
    }

    function updateProgressUI() {
      var dur = audio.duration || 0;
      var cur = audio.currentTime || 0;
      progressFill.style.width = (dur > 0 ? Math.min(100, (cur / dur) * 100) : 0) + '%';
      timeEl.textContent = fmtTime(cur) + ' / ' + fmtTime(dur);
    }

    function setSpeed(rate) {
      audio.playbackRate = rate;
      speedBtn.textContent = rate + '×';
    }

    function cycleSpeed() {
      var cur = audio.playbackRate || 1;
      var i = SPEEDS.indexOf(cur);
      var next = SPEEDS[(i + 1) % SPEEDS.length];
      setSpeed(next);
      persistPosition(audio.currentTime);
    }

    function updateMediaSession(chunk) {
      try {
        if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
        navigator.mediaSession.metadata = new MediaMetadata({
          title: chunk ? (chunk.studentLabel || chunk.title) : 'Listen Mode',
          artist: 'Cadence — AIMT',
          album: 'HeadSpa Mastery · Module ' + moduleId
        });
        navigator.mediaSession.setActionHandler('play', function () { play(); });
        navigator.mediaSession.setActionHandler('pause', function () { pause(); });
        navigator.mediaSession.setActionHandler('seekbackward', function () { skip(-SKIP_SECONDS); });
        navigator.mediaSession.setActionHandler('seekforward', function () { skip(SKIP_SECONDS); });
      } catch (e) { /* Media Session is an enhancement only — never required for playback */ }
    }

    function stopPolling() {
      if (pollTimer) { win.clearInterval(pollTimer); pollTimer = null; }
    }

    function stopGapTimer() {
      if (gapTimer) { win.clearTimeout(gapTimer); gapTimer = null; }
    }

    // Silence-aware auto-advance: when a chunk's 'ended' event resolves to
    // a natural advance into the next chunk, that next chunk's
    // transitionGapMs (see aimt-listen-mode-data.js and
    // docs/course-audit/listen-mode/module-01-section-gap-measurements.md)
    // is the remaining breathing-room pause to hold before autoplaying it,
    // on top of whatever natural trailing/leading silence the canonical
    // audio already carries at that boundary. Only real numbered-section
    // starts carry a non-zero transitionGapMs; everything else (checkpoint
    // prompts, practice, recap) advances immediately as before. Manual
    // navigation (Start Over, Continue Listening, seek, back/forward) never
    // goes through this function and is never delayed.
    function advanceAfterGap(nextIndex) {
      var nextChunk = chunks[nextIndex];
      var gapMs = (nextChunk && typeof nextChunk.transitionGapMs === 'number') ? nextChunk.transitionGapMs : 0;
      if (gapMs <= 0) { goToChunk(nextIndex, { autoplay: true }); return; }
      stopGapTimer();
      gapTimer = win.setTimeout(function () {
        gapTimer = null;
        if (destroyed) return;
        goToChunk(nextIndex, { autoplay: true });
      }, gapMs);
    }

    // Replaying a module after its checkpoint was already passed (e.g. via
    // "Listen Again"/"Resume Listening") must never re-require competency —
    // isCheckpointPassed is a local read of existing course state, not a
    // grading call, so checking it synchronously here costs nothing and
    // means an already-passed checkpoint never shows the "answer it above"
    // waiting state at all, not even for the ~1s a poll tick would take.
    function enterAwaitingCheckpoint(checkpointId) {
      awaitingCheckpointId = checkpointId;
      if (engine.isCheckpointPassed(appState, moduleId, checkpointId)) {
        offerContinue(true);
        return;
      }
      playBtn.disabled = true;
      setNote('Checkpoint reached — answer it above to continue. I’ll pick back up right after.');
      stopPolling();
      pollTimer = win.setInterval(function () {
        if (destroyed) return;
        if (engine.isCheckpointPassed(appState, moduleId, awaitingCheckpointId)) {
          stopPolling();
          offerContinue(false);
        }
      }, POLL_MS);
    }

    function offerContinue(alreadyPassed) {
      playBtn.disabled = false;
      body.innerHTML = '';
      if (alreadyPassed) {
        var passedNote = doc.createElement('div');
        passedNote.className = 'aimt-lm-note';
        passedNote.textContent = 'You already passed this checkpoint.';
        body.appendChild(passedNote);
      }
      var resumeBtn = doc.createElement('button');
      resumeBtn.type = 'button';
      resumeBtn.className = 'aimt-lm-resume';
      resumeBtn.textContent = 'Continue Listening';
      resumeBtn.addEventListener('click', function () {
        rebuildControlBody();
        var next = index + 1;
        goToChunk(next, { autoplay: true });
      });
      body.appendChild(resumeBtn);
    }

    function rebuildControlBody() {
      body.innerHTML = '';
      body.appendChild(controlRow);
      body.appendChild(noteEl);
      setNote('');
    }

    function enterLocked(nextChunk) {
      setNote('The next part unlocks once you pass this module’s checkpoint above.');
      playBtn.disabled = true;
    }

    function enterEnded() {
      setNote('That’s the end of this module’s narration.');
      playBtn.textContent = '▶';
      playBtn.setAttribute('aria-label', 'Play');
    }

    function loadAudio(chunk) {
      audio.src = win.encodeURI ? win.encodeURI(chunk.audioSrc) : chunk.audioSrc;
    }

    function isChunkQAAvailable(chunk) {
      if (canUseUnapprovedAudio()) return chunk.qaStatus === 'GENERATED' || chunk.qaStatus === 'APPROVED';
      return chunk.qaStatus === 'APPROVED';
    }

    function goToChunk(i, playOpts) {
      var chunk = chunks[i];
      if (!chunk) { enterEnded(); return false; }
      if (!engine.isChunkPlayable(chunk, appState)) {
        enterLocked(chunk);
        return false;
      }
      // Any explicit jump to a chunk (Start Over, the QA "Jump" control,
      // Continue Listening) supersedes whatever the player was previously
      // waiting on — cancel a stray checkpoint-wait poll so it can't fire
      // offerContinue() later and silently rewrite the UI out from under
      // wherever the student actually navigated to. Same for a pending
      // section-gap timer: a student who skips ahead during the silent
      // breathing-room pause must not have that stale timer fire a second,
      // conflicting goToChunk afterward.
      stopPolling();
      stopGapTimer();
      awaitingCheckpointId = null;
      index = i;
      updateTitle(chunk);
      scrollToVisualTarget(chunk);
      updateMediaSession(chunk);
      rebuildControlBody();

      if (!isChunkQAAvailable(chunk)) {
        setNote('Audio for this section isn’t installed yet (development state) — nothing plays here in production until it is.');
        playBtn.disabled = true;
        progressFill.style.width = '0%';
        timeEl.textContent = '0:00 / 0:00';
        return false;
      }

      playBtn.disabled = false;
      loadAudio(chunk);
      var stored = readStoredPosition();
      var startAt = (stored.chunkId === chunk.chunkId && stored.timeSec > 0) ? stored.timeSec : 0;
      audio.addEventListener('loadedmetadata', function onMeta() {
        audio.removeEventListener('loadedmetadata', onMeta);
        if (startAt > 0 && startAt < audio.duration) audio.currentTime = startAt;
        updateProgressUI();
      });
      if (stored.speed) setSpeed(stored.speed);
      if (playOpts && playOpts.autoplay) play();
      // Skipped only for the silent mount-time preload below (persist:
      // false) -- that call exists purely to prime the UI/title/audio src
      // before the student has done anything, and must not re-write
      // storage itself. Without this guard it would immediately flip a
      // just-read finished:true (-> "Listen Again") back to finished:false
      // on every page open, even ones where the student never touches the
      // player -- silently undoing the entry-state fix on the very next
      // visit.
      if (!playOpts || playOpts.persist !== false) persistPosition(startAt);
      return true;
    }

    function play() {
      var p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () {
          // Autoplay was blocked (e.g., resuming after a long pause with no
          // fresh gesture) — fail quietly into a paused, tap-to-play state
          // rather than throwing. The student presses play themselves.
          playBtn.textContent = '▶';
          playBtn.setAttribute('aria-label', 'Play');
        });
      }
      playBtn.textContent = '⏸';
      playBtn.setAttribute('aria-label', 'Pause');
    }

    function pause() {
      audio.pause();
      playBtn.textContent = '▶';
      playBtn.setAttribute('aria-label', 'Play');
      persistPosition(audio.currentTime);
    }

    function skip(deltaSec) {
      if (!audio.duration) return;
      audio.currentTime = Math.max(0, Math.min(audio.duration - 0.25, (audio.currentTime || 0) + deltaSec));
      persistPosition(audio.currentTime);
    }

    // ── wire events ──
    playBtn.addEventListener('click', function () {
      if (audio.paused) play(); else pause();
    });
    backBtn.addEventListener('click', function () { skip(-SKIP_SECONDS); });
    fwdBtn.addEventListener('click', function () { skip(SKIP_SECONDS); });
    speedBtn.addEventListener('click', cycleSpeed);
    progress.addEventListener('click', function (evt) {
      if (!audio.duration) return;
      var rect = progress.getBoundingClientRect ? progress.getBoundingClientRect() : { left: 0, width: 1 };
      var ratio = rect.width ? Math.max(0, Math.min(1, (evt.clientX - rect.left) / rect.width)) : 0;
      audio.currentTime = ratio * audio.duration;
      persistPosition(audio.currentTime);
    });
    startOverBtn.addEventListener('click', function () {
      if (!win.confirm('Start this module\'s narration over from the beginning?')) return;
      try { win.localStorage && win.localStorage.removeItem(engine.storageKey(courseSlug, moduleId)); } catch (e) { /* best-effort only */ }
      rebuildControlBody();
      goToChunk(0, { autoplay: true });
    });
    minimizeBtn.addEventListener('click', function () {
      bar.classList.toggle('aimt-lm-collapsed');
    });
    closeBtn.addEventListener('click', function () {
      pause();
      destroy();
    });
    audio.addEventListener('timeupdate', function () {
      updateProgressUI();
      // Throttled implicitly by the browser's own timeupdate cadence
      // (typically ~4x/sec) — good enough for "convenience" resume state,
      // no need for a separate debounce timer.
      persistPosition(audio.currentTime);
    });
    audio.addEventListener('ended', function () {
      var decision = engine.resolveAfterEnd(chunks, index, appState);
      // Only a genuine 'ended' decision (ran off the end of the module's
      // last chunk) marks the stored position finished:true — that single
      // bit is what lets the entry button correctly offer "Listen Again"
      // next time instead of resuming into the closing recap chunk (the
      // root cause of the owner's "jumps straight to recap" finding).
      persistPosition(0, decision.type === 'ended');
      if (decision.type === 'awaiting-checkpoint') {
        enterAwaitingCheckpoint(decision.checkpointId);
      } else if (decision.type === 'locked') {
        enterLocked(chunks[decision.index]);
      } else if (decision.type === 'advance') {
        advanceAfterGap(decision.index);
      } else {
        enterEnded();
      }
    });
    audio.addEventListener('error', function () {
      // Genuine playback failure (network/decode/missing file) -- student-
      // facing wording only, no technical detail. win.console.warn keeps
      // the real cause available locally for diagnosis without surfacing
      // it in the UI.
      setNote('Audio couldn’t start. Try again.');
      playBtn.disabled = true;
      if (win.console && win.console.warn) win.console.warn('AIMT Listen Mode: audio element error', audio.error, audio.src);
    });

    mountEl.innerHTML = '';
    mountEl.appendChild(bar);
    goToChunk(index, { autoplay: false, persist: false });

    function destroy() {
      destroyed = true;
      stopPolling();
      stopGapTimer();
      try { audio.pause(); } catch (e) { /* no-op */ }
      if (barOffsetObserver) { try { barOffsetObserver.disconnect(); } catch (e) {} }
      else { try { win.removeEventListener('resize', syncBarOffset); } catch (e) {} }
      try { doc.documentElement.style.setProperty('--aimt-lm-bar-offset', '0px'); } catch (e) {}
      if (bar.parentNode) bar.parentNode.removeChild(bar);
    }

    // Starts the currently-resolved chunk (first-time listener: M1-01;
    // returning listener: their resume point) with playback already
    // running -- what the entry button's first click needs, without
    // leaking the private `index` closure variable itself. Returns the
    // same true/false goToChunk does (false only if genuinely locked or
    // no chunk resolves, e.g. a QA-unavailable chunk).
    function playCurrent() {
      return goToChunk(index, { autoplay: true });
    }

    return { destroy: destroy, goToChunk: goToChunk, playCurrent: playCurrent, _audio: audio };
  }

  var activeInstance = null;

  // Public mount(): call once per module page-open. Course/module-agnostic —
  // it does nothing beyond render "no manifest yet" silence for a module
  // that has no manifest entry (safe no-op for Modules 2-12 today).
  // Writes the plain, non-technical failure note next to a static entry
  // button. Shared by the pre-JS inline baseline handler (see the button's
  // own markup in headspa-mastery.html) and every early-bailout branch
  // below, so the message is identical no matter which layer caught it.
  function noteFailure(btn) {
    var note = btn.parentNode && btn.parentNode.querySelector
      ? btn.parentNode.querySelector('[data-aimt-entry-note]') : null;
    if (note) note.textContent = "Audio couldn't start. Try again.";
  }

  function mount(opts) {
    opts = opts || {};
    var doc = opts.doc || (typeof document !== 'undefined' ? document : null);
    var win = opts.win || (typeof window !== 'undefined' ? window : null);
    if (!doc || !win || typeof doc.createElement !== 'function') return null;

    // A pre-rendered, always-visible <button> already in the page's own
    // markup (see headspa-mastery.html) — mount() ATTACHES real playback
    // to it, it never creates or removes it. If any check below bails
    // out, wireStaticFallback() guarantees the button still does
    // something honest on click instead of silently going dead; the real
    // handler (further down) always supersedes this the moment mount()
    // fully succeeds.
    var staticBtn = opts.entryButtonEl || (opts.entryButtonId ? doc.getElementById(opts.entryButtonId) : null);
    // Retry-capable, not a dead end: a later click re-runs mount(opts)
    // from scratch rather than just re-showing the same note, since
    // whatever caused the bailout (Student Preview not yet recognized,
    // a manifest that resolves late) may have resolved by then. mount()
    // always removes this exact handler (tracked via _aimtClickHandler)
    // before attaching whatever comes next, so a retry can never leave
    // both this and the real handler attached at once. If the retry
    // succeeds, this asks mount() to invoke the freshly-wired real
    // handler directly (opts.__autoActivateOnMount) so the SAME click
    // that fixed it also starts playback -- NOT staticBtn.click(): a
    // synthetic re-click on an element from within that same element's
    // own click handler is a documented no-op (the click() spec steps
    // return immediately while "this element is currently being
    // clicked"), which silently swallowed the very first version of
    // this retry.
    function wireStaticFallback() {
      if (!staticBtn) return;
      ensureStyles(doc);
      if (staticBtn._aimtClickHandler) staticBtn.removeEventListener('click', staticBtn._aimtClickHandler);
      var handler = function () {
        opts.__autoActivateOnMount = true;
        var retried = mount(opts);
        delete opts.__autoActivateOnMount;
        if (!retried) noteFailure(staticBtn);
      };
      staticBtn._aimtClickHandler = handler;
      staticBtn.addEventListener('click', handler);
    }

    if (activeInstance) { activeInstance.destroy(); activeInstance = null; }

    var data = win.AIMTListenModeData;
    if (!data) { wireStaticFallback(); return null; }
    var chunks = data.getManifest(opts.courseSlug, opts.moduleId);
    if (!chunks || !chunks.length) { wireStaticFallback(); return null; }

    var validation = data.validateManifest(chunks);
    if (!validation.valid) {
      if (win.console && win.console.warn) win.console.warn('AIMT Listen Mode: invalid manifest', validation.errors);
      wireStaticFallback();
      return null;
    }

    var productionReady = data.isProductionReady(chunks);
    if (!productionReady && !canUseUnapprovedAudio()) { wireStaticFallback(); return null; } // Section 21: never present as available until every chunk is APPROVED.

    // Legacy path: a module with no pre-rendered static button yet (none
    // currently exist — Module 1 has one — kept only so an eventual future
    // module can still opt in via the old entryMountId contract without
    // this file changing again).
    var entryMount = opts.entryMountEl || (opts.entryMountId ? doc.getElementById(opts.entryMountId) : null);
    if (!staticBtn && !entryMount) return null;
    ensureStyles(doc);

    // destroy() (above) only removes the previous instance's bar from
    // its own host div, not the host div itself from document.body --
    // remounting (e.g. re-opening a module already visited this session)
    // would otherwise accumulate orphaned, permanently-hidden
    // #aimtListenModePlayerHost elements, and any later
    // getElementById('aimtListenModePlayerHost') call (including a fresh
    // mount's own bar) could resolve to a stale one instead of the live
    // instance. Remove every existing match before creating the new one.
    var staleHosts = doc.querySelectorAll ? doc.querySelectorAll('#aimtListenModePlayerHost') : [];
    for (var si = 0; si < staleHosts.length; si++) {
      if (staleHosts[si].parentNode) staleHosts[si].parentNode.removeChild(staleHosts[si]);
    }

    var playerHost = doc.createElement('div');
    playerHost.id = 'aimtListenModePlayerHost';
    // Starts hidden — mounting preloads the resume chunk, but the player
    // bar itself only appears once the student taps the entry button below.
    playerHost.style.display = 'none';
    // Player bar is fixed-position (see CSS), so it's appended to the
    // document body rather than nested inside module content that gets
    // wholesale-replaced by openModuleById() on navigation.
    (doc.body || staticBtn || entryMount).appendChild(playerHost);

    var appState = opts.appState || win.APP_STATE;
    // Resolved once, here, from Listen Mode's own stored position — never
    // from course/module completion — and reused for both the button
    // label below and (inside createPlayerInstance) the actual starting
    // chunk, so the two can never disagree about what state this session
    // opens in.
    var storedPosition = engine.readStoredPosition(win, opts.courseSlug, opts.moduleId);
    var entryState = engine.resolveEntryState(chunks, storedPosition);
    var instance = createPlayerInstance({
      doc: doc, win: win, courseSlug: opts.courseSlug, moduleId: opts.moduleId,
      chunks: chunks, appState: appState, mountEl: playerHost
    });
    activeInstance = instance;

    var entryBtn = staticBtn;
    if (entryBtn) {
      // Reusing the pre-rendered static button — refresh its text
      // defensively so it can't drift out of sync with the manifest, and
      // clear anything a previous mount (or the pre-JS baseline handler)
      // left behind.
      var summary = computeEntrySummary(chunks);
      var meta = entryMetaText(summary);
      var labels = entryLabelForState(entryState);
      entryBtn.setAttribute('aria-label', labels.title + '. ' + meta + '. ' + labels.verb);
      var titleEl = entryBtn.querySelector('.aimt-lm-entry-title');
      if (titleEl) titleEl.textContent = labels.title;
      var metaEl = entryBtn.querySelector('.aimt-lm-entry-meta');
      if (metaEl) metaEl.textContent = meta;
      var existingBadge = entryBtn.querySelector('.aimt-lm-qa-badge');
      if (existingBadge && existingBadge.parentNode) existingBadge.parentNode.removeChild(existingBadge);
      var existingNote = entryBtn.parentNode && entryBtn.parentNode.querySelector('[data-aimt-entry-note]');
      if (existingNote) existingNote.textContent = '';
    }

    // First click: reveal the mini-player AND start playback immediately
    // (goToChunk(..., {autoplay:true}) via playCurrent()) -- no second,
    // hidden click on an inner play button required. Once the bar is
    // already open, later clicks on this same entry control are just a
    // visibility convenience toggle, never a second playback start.
    // `activating` guards the brief window between click and the
    // play()/goToChunk work actually landing, so a rapid double-click
    // can't fire two starts. The bar stays visible even if playCurrent()
    // can't start anything (locked / not yet available / genuine media
    // error) -- goToChunk's own enterLocked()/isChunkQAAvailable()/audio
    // 'error' paths each already set an appropriate student-facing note
    // inside the bar itself, which would be invisible if we hid it again.
    var activating = false;
    function realHandler() {
      if (activating) return;
      if (playerHost.style.display !== 'none') {
        playerHost.style.display = 'none';
        return;
      }
      activating = true;
      entryBtn.disabled = true;
      playerHost.style.display = '';
      try {
        instance.playCurrent();
      } catch (e) {
        if (win.console && win.console.warn) win.console.warn('AIMT Listen Mode: entry activation threw', e);
      }
      // Re-enable shortly after so the toggle-to-hide convenience above
      // still works on a later click, without allowing an instant
      // second fire on top of this one.
      win.setTimeout(function () { activating = false; entryBtn.disabled = false; }, 400);
    }

    if (entryBtn) {
      if (entryBtn._aimtClickHandler) entryBtn.removeEventListener('click', entryBtn._aimtClickHandler);
      entryBtn._aimtClickHandler = realHandler;
      entryBtn.addEventListener('click', realHandler);
    } else {
      entryMount.innerHTML = '';
      entryBtn = buildEntryButton(doc, chunks, realHandler, entryState);
      entryMount.appendChild(entryBtn);
    }

    if (inQAMode() && !productionReady) {
      var badge = doc.createElement('span');
      badge.className = 'aimt-lm-qa-badge';
      badge.textContent = 'QA preview';
      entryBtn.appendChild(badge);
    }

    // A retry from wireStaticFallback's handler asks for this: the real
    // handler is now wired, but the click that triggered this mount()
    // call already happened, so nothing will invoke it on its own.
    // Calling it directly (a plain function call, not a synthetic
    // click()) finishes what that same click started.
    if (opts.__autoActivateOnMount) realHandler();

    return instance;
  }

  function unmount() {
    if (activeInstance) { activeInstance.destroy(); activeInstance = null; }
  }

  var api = {
    engine: engine,
    mount: mount,
    unmount: unmount,
    inQAMode: inQAMode,
    canUseUnapprovedAudio: canUseUnapprovedAudio,
    computeEntrySummary: computeEntrySummary,
    entryMetaText: entryMetaText,
    entryLabelForState: entryLabelForState
  };

  root.AIMTListenMode = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
