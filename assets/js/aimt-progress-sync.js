/* ═══════════════════════════════════════════════════════════════
   AIMT Progress Sync — cross-device progress + Cadence memory
   ---------------------------------------------------------------
   Hooks APP_STATE.save() (from headspa-state.js) and syncs the full
   state blob to Supabase (course_progress table).

   Load AFTER headspa-state.js and AFTER supabase-js.
   Initialize AFTER the user is authenticated + entitled:

       AIMT_SYNC.init(supabaseClient, 'headspa-mastery');

   Merge policy (protects progress above all):
   1. The state with the HIGHER progress score wins.
   2. On a tie, the newer client_saved_at wins.
   This makes a fresh device pull cloud progress, and prevents a
   stale/empty device from ever wiping real progress — even with
   bad clocks.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var PUSH_DEBOUNCE_MS = 3000;
  var TABLE = 'course_progress';

  var _client = null;
  var _courseSlug = null;
  var _userId = null;
  var _pushTimer = null;
  var _pushing = false;
  var _pushQueued = false;
  var _initialized = false;
  var _originalSave = null;

  function log(msg, extra) {
    try { console.info('[aimt-sync] ' + msg, extra || ''); } catch (_) {}
  }

  /* Progress score: monotonic measure of real progress.
     Completed modules dominate; passed checkpoints refine. */
  function computeScore(state) {
    var score = 0;
    try {
      var progress = (state && state.progress) || {};
      Object.keys(progress).forEach(function (moduleId) {
        var mod = progress[moduleId] || {};
        if (mod.complete) score += 100;
        var cps = mod.checkpointMeta || {};
        Object.keys(cps).forEach(function (cpId) {
          var cp = cps[cpId] || {};
          if (cp.status === 'passed') score += 5;
          else if (cp.status) score += 1; /* attempted */
        });
      });
      var student = (state && state.student) || {};
      if (student.introComplete) score += 10;
    } catch (_) {}
    return score;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function getAccessToken() {
    if (!_client) return Promise.resolve(null);
    return _client.auth.getSession().then(function (res) {
      var session = res && res.data && res.data.session;
      return session ? session.access_token : null;
    }).catch(function () { return null; });
  }

  /* ── Pull remote state, merge, apply ── */
  function pullAndMerge() {
    return _client
      .from(TABLE)
      .select('state, progress_score, client_saved_at, updated_at')
      .eq('user_id', _userId)
      .eq('course_slug', _courseSlug)
      .maybeSingle()
      .then(function (res) {
        if (res.error) {
          log('pull failed: ' + res.error.message);
          return { applied: false };
        }
        var remote = res.data;
        var localState = window.APP_STATE.snapshot();
        var localScore = computeScore(localState);

        if (!remote || !remote.state) {
          log('no remote state — pushing local (score ' + localScore + ')');
          schedulePush(0);
          return { applied: false };
        }

        var remoteScore = typeof remote.progress_score === 'number'
          ? remote.progress_score
          : computeScore(remote.state);

        var remoteWins;
        if (remoteScore !== localScore) {
          remoteWins = remoteScore > localScore;
        } else {
          var rT = Date.parse(remote.client_saved_at || 0) || 0;
          var lT = Date.parse(getLocalSavedAt() || 0) || 0;
          remoteWins = rT >= lT;
        }

        if (remoteWins) {
          log('applying remote state (remote ' + remoteScore + ' vs local ' + localScore + ')');
          applyRemoteState(remote.state);
          return { applied: true };
        }

        log('local ahead (local ' + localScore + ' vs remote ' + remoteScore + ') — pushing');
        schedulePush(0);
        return { applied: false };
      });
  }

  function applyRemoteState(remoteState) {
    try {
      /* Write through localStorage, then let APP_STATE's own
         load() sanitize/migrate/derive — never bypass its rules. */
      localStorage.setItem(window.APP_STATE._key, JSON.stringify(remoteState));
      setLocalSavedAt(nowIso());
      _suppressPush = true;
      window.APP_STATE.load();
      _suppressPush = false;
      if (typeof window.renderHomeProgress === 'function') {
        try { window.renderHomeProgress(); } catch (_) {}
      }
      document.dispatchEvent(new CustomEvent('aimt:progress-restored'));
    } catch (e) {
      _suppressPush = false;
      log('apply failed: ' + (e && e.message));
    }
  }

  /* ── Push local state up ── */
  var _suppressPush = false;

  function getLocalSavedAt() {
    try { return localStorage.getItem('aimt_progress_saved_at') || ''; } catch (_) { return ''; }
  }
  function setLocalSavedAt(iso) {
    try { localStorage.setItem('aimt_progress_saved_at', iso); } catch (_) {}
  }

  function schedulePush(delayMs) {
    if (!_initialized || _suppressPush) return;
    if (_pushTimer) clearTimeout(_pushTimer);
    _pushTimer = setTimeout(doPush, typeof delayMs === 'number' ? delayMs : PUSH_DEBOUNCE_MS);
  }

  function doPush() {
    _pushTimer = null;
    if (!_initialized) return;
    if (_pushing) { _pushQueued = true; return; }
    _pushing = true;

    var state = window.APP_STATE.snapshot();
    var row = {
      user_id: _userId,
      course_slug: _courseSlug,
      state: state,
      progress_score: computeScore(state),
      client_saved_at: getLocalSavedAt() || nowIso()
    };

    _client
      .from(TABLE)
      .upsert(row, { onConflict: 'user_id,course_slug' })
      .then(function (res) {
        _pushing = false;
        if (res.error) log('push failed: ' + res.error.message);
        if (_pushQueued) { _pushQueued = false; schedulePush(500); }
      })
      .catch(function (e) {
        _pushing = false;
        log('push error: ' + (e && e.message));
      });
  }

  /* Best-effort flush when the tab is closing/hiding.
     Uses keepalive fetch (sendBeacon can't set auth headers). */
  function flushOnHide() {
    if (!_initialized || _suppressPush) return;
    getAccessToken().then(function (token) {
      if (!token) return;
      try {
        var state = window.APP_STATE.snapshot();
        var body = JSON.stringify({
          user_id: _userId,
          course_slug: _courseSlug,
          state: state,
          progress_score: computeScore(state),
          client_saved_at: getLocalSavedAt() || nowIso()
        });
        if (body.length > 60000) return; /* keepalive body limit */
        fetch(_client.supabaseUrl + '/rest/v1/' + TABLE + '?on_conflict=user_id,course_slug', {
          method: 'POST',
          keepalive: true,
          headers: {
            apikey: _client.supabaseKey,
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=minimal'
          },
          body: body
        }).catch(function () {});
      } catch (_) {}
    });
  }

  /* ── Public API ── */
  window.AIMT_SYNC = {
    /* Call once, after auth + entitlement are confirmed. */
    init: function (supabaseClient, courseSlug) {
      if (_initialized) return Promise.resolve();
      if (!supabaseClient || !window.APP_STATE) {
        log('init skipped — missing client or APP_STATE');
        return Promise.resolve();
      }
      _client = supabaseClient;
      _courseSlug = courseSlug || 'headspa-mastery';

      return _client.auth.getUser().then(function (res) {
        var user = res && res.data && res.data.user;
        if (!user) { log('init skipped — no user'); return; }
        _userId = user.id;

        /* Hook save(): stamp + debounce push on every local mutation */
        _originalSave = window.APP_STATE.save.bind(window.APP_STATE);
        window.APP_STATE.save = function () {
          _originalSave();
          if (!_suppressPush) {
            setLocalSavedAt(nowIso());
            schedulePush();
          }
        };

        window.addEventListener('pagehide', flushOnHide);
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'hidden') flushOnHide();
        });

        _initialized = true;
        log('initialized for ' + _courseSlug);
        return pullAndMerge();
      });
    },

    /* Manual controls if ever needed */
    pushNow: function () { schedulePush(0); },
    pullNow: function () { return _initialized ? pullAndMerge() : Promise.resolve(); },
    isActive: function () { return _initialized; }
  };
})();
