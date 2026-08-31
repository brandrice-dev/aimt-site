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
        speed: typeof obj.speed === 'number' ? obj.speed : 1
      };
    } catch (e) {
      return null;
    }
  }

  var engine = {
    isCheckpointPassed: isCheckpointPassed,
    isChunkPlayable: isChunkPlayable,
    resolveAfterEnd: resolveAfterEnd,
    resolveResumeIndex: resolveResumeIndex,
    storageKey: storageKey,
    serializePosition: serializePosition,
    parsePosition: parsePosition
  };

  // ─────────────────────────────────────────────────────────────────────
  // UI / PLAYBACK LAYER
  // ─────────────────────────────────────────────────────────────────────

  var SKIP_SECONDS = 12;
  var SPEEDS = [0.75, 1, 1.25, 1.5];
  var POLL_MS = 1000;
  var STYLE_EL_ID = 'aimt-listen-mode-styles';

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
      '.aimt-lm-entry{display:inline-flex;align-items:center;gap:0.5rem;background:rgba(255,255,255,0.7);',
      'border:0.5px solid var(--border2,rgba(0,0,0,0.09));border-radius:var(--aimt-radius-pill,980px);',
      'padding:0.55rem 1.1rem;font-family:var(--aimt-font-sans,sans-serif);font-size:0.8rem;font-weight:500;',
      'color:var(--text,#262626);cursor:pointer;transition:background 0.2s;margin:0.75rem 0 0.25rem;}',
      '.aimt-lm-entry:hover{background:rgba(255,255,255,0.95);}',
      '.aimt-lm-entry .aimt-lm-dot{width:7px;height:7px;border-radius:50%;background:var(--accent2,#4d403a);}',
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
      'background:var(--aimt-warning-light,#fff4e8);border-radius:4px;padding:0.15rem 0.4rem;flex-shrink:0;}'
    ].join('');
    doc.head.appendChild(style);
  }

  function buildEntryButton(doc, onClick) {
    var btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'aimt-lm-entry';
    btn.setAttribute('aria-label', 'Listen to this module, narrated by Cadence');
    var dot = doc.createElement('span');
    dot.className = 'aimt-lm-dot';
    dot.setAttribute('aria-hidden', 'true');
    var label = doc.createElement('span');
    label.textContent = 'Listen to this module';
    btn.appendChild(dot);
    btn.appendChild(label);
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

    var index = engine.resolveResumeIndex(chunks, appState, readStoredPosition().chunkId);
    var awaitingCheckpointId = null;
    var pollTimer = null;
    var destroyed = false;

    function readStoredPosition() {
      try {
        var raw = win.localStorage && win.localStorage.getItem(engine.storageKey(courseSlug, moduleId));
        return engine.parsePosition(raw) || { chunkId: null, timeSec: 0, speed: 1 };
      } catch (e) {
        return { chunkId: null, timeSec: 0, speed: 1 };
      }
    }

    function persistPosition(timeSec) {
      try {
        if (!win.localStorage) return;
        var chunk = chunks[index];
        win.localStorage.setItem(
          engine.storageKey(courseSlug, moduleId),
          engine.serializePosition({ chunkId: chunk ? chunk.chunkId : null, timeSec: timeSec || 0, speed: audio.playbackRate || 1 })
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

    function setNote(text) { noteEl.textContent = text || ''; }

    function scrollToVisualTarget(chunk) {
      if (!chunk || !chunk.visualTarget) return;
      var el = doc.getElementById(chunk.visualTarget);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    function updateTitle(chunk) {
      title.textContent = chunk ? ('Chunk ' + (index + 1) + ' of ' + chunks.length + ' — ' + chunk.title) : '';
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
          title: chunk ? chunk.title : 'Listen Mode',
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

    function enterAwaitingCheckpoint(checkpointId) {
      awaitingCheckpointId = checkpointId;
      playBtn.disabled = true;
      setNote('Checkpoint reached — answer it above to continue. I’ll pick back up right after.');
      stopPolling();
      pollTimer = win.setInterval(function () {
        if (destroyed) return;
        if (engine.isCheckpointPassed(appState, moduleId, awaitingCheckpointId)) {
          stopPolling();
          offerContinue();
        }
      }, POLL_MS);
    }

    function offerContinue() {
      playBtn.disabled = false;
      body.innerHTML = '';
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
      persistPosition(startAt);
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
      persistPosition(0);
      var decision = engine.resolveAfterEnd(chunks, index, appState);
      if (decision.type === 'awaiting-checkpoint') {
        enterAwaitingCheckpoint(decision.checkpointId);
      } else if (decision.type === 'locked') {
        enterLocked(chunks[decision.index]);
      } else if (decision.type === 'advance') {
        goToChunk(decision.index, { autoplay: true });
      } else {
        enterEnded();
      }
    });
    audio.addEventListener('error', function () {
      setNote('Audio for this section isn’t available right now (development state).');
      playBtn.disabled = true;
    });

    mountEl.innerHTML = '';
    mountEl.appendChild(bar);
    goToChunk(index, { autoplay: false });

    function destroy() {
      destroyed = true;
      stopPolling();
      try { audio.pause(); } catch (e) { /* no-op */ }
      if (bar.parentNode) bar.parentNode.removeChild(bar);
    }

    return { destroy: destroy, goToChunk: goToChunk, _audio: audio };
  }

  var activeInstance = null;

  // Public mount(): call once per module page-open. Course/module-agnostic —
  // it does nothing beyond render "no manifest yet" silence for a module
  // that has no manifest entry (safe no-op for Modules 2-12 today).
  function mount(opts) {
    opts = opts || {};
    var doc = opts.doc || (typeof document !== 'undefined' ? document : null);
    var win = opts.win || (typeof window !== 'undefined' ? window : null);
    if (!doc || !win || typeof doc.createElement !== 'function') return null;

    if (activeInstance) { activeInstance.destroy(); activeInstance = null; }

    var data = win.AIMTListenModeData;
    if (!data) return null;
    var chunks = data.getManifest(opts.courseSlug, opts.moduleId);
    if (!chunks || !chunks.length) return null;

    var validation = data.validateManifest(chunks);
    if (!validation.valid) {
      if (win.console && win.console.warn) win.console.warn('AIMT Listen Mode: invalid manifest', validation.errors);
      return null;
    }

    var productionReady = data.isProductionReady(chunks);
    if (!productionReady && !canUseUnapprovedAudio()) return null; // Section 21: never present as available until every chunk is APPROVED.

    var entryMount = opts.entryMountEl || (opts.entryMountId ? doc.getElementById(opts.entryMountId) : null);
    if (!entryMount) return null;
    ensureStyles(doc);
    entryMount.innerHTML = '';

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
    (doc.body || entryMount).appendChild(playerHost);

    var appState = opts.appState || win.APP_STATE;
    var instance = createPlayerInstance({
      doc: doc, win: win, courseSlug: opts.courseSlug, moduleId: opts.moduleId,
      chunks: chunks, appState: appState, mountEl: playerHost
    });
    activeInstance = instance;

    var entryBtn = buildEntryButton(doc, function () {
      playerHost.style.display = playerHost.style.display === 'none' ? '' : 'none';
    });
    if (inQAMode() && !productionReady) {
      var badge = doc.createElement('span');
      badge.className = 'aimt-lm-qa-badge';
      badge.textContent = 'QA preview';
      entryBtn.appendChild(badge);
    }
    entryMount.appendChild(entryBtn);

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
    canUseUnapprovedAudio: canUseUnapprovedAudio
  };

  root.AIMTListenMode = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
