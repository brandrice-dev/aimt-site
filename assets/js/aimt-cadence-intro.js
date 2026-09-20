/* ═══════════════════════════════════════════════════════════════
   AIMT Cadence Intro — reusable presentation component
   ---------------------------------------------------------------
   The Cadence pre-course introduction (gate → monologue → Q1 → Q2 → Q3
   → synthesis → "Enter the Welcome Module"), extracted so it has ONE
   source of truth shared by:
     - cadence-intro-preview.html (standalone owner review -- no course
       app, no APP_STATE, no Supabase, no entitlements)
     - headspa-mastery.html (the real course's first-entry flow)
   A pacing/fade/copy change made here is automatically inherited by
   both. Do not fork a second copy into either host page.

   This module OWNS: the Cadence gate, the orbital identity mark, the
   intro script, the thought field (one fixed text element in one fixed
   position where each of Cadence's spoken thoughts breathes in, rests,
   and breathes back out -- see createThoughtField() below; nothing
   stacks, overlaps, or slides), pacing, the three sequential questions
   (asked through that same thought field), the captured-context display,
   the response UI, reduced-motion behavior, Skip presentation, the final
   personalized-response presentation, the "Enter the Welcome Module"
   action, the future audio segment ids on each phrase, and the future
   speaking-intensity hook (which, for now, simply mirrors the thought
   field's own breathing envelope -- see setSpeakingIntensity's call
   sites below).

   This module OWNS NONE of: authentication, entitlements, course
   progress, certification, course gating, Supabase schema, or
   checkpoint state. Those stay entirely in whatever page mounts this --
   see the callback contract on mount() below.

   Depends on assets/css/aimt-cadence-intro.css (same file, both hosts)
   and nothing else page-specific -- no APP_STATE, no Supabase, no
   global functions from headspa-mastery.html. The orbital mark is
   inlined as raw SVG at each usage site (not a shared <symbol>/<use>)
   so this component never depends on markup defined elsewhere in the
   host page, and never risks a duplicate-id collision with one that is.

   ── mount(container, options) → { destroy(), setSpeakingIntensity(v) } ──
   options:
     firstName        (string)   Used for the opening greeting and as the
                                  fallback name when none is detected in
                                  the student's own answers.
     synthesize(context)         REQUIRED for a real personalized reply.
       → Promise<string>         Host builds its own (AIMT-curriculum-
                                  specific) system prompt and calls its
                                  own endpoint (or, in preview, returns a
                                  clearly-labeled mock). If omitted, or if
                                  it rejects/resolves empty, the component
                                  shows its own generic fallback line --
                                  it never fabricates course content.
     requestRuntimeAudio(id,text) Optional. Host calls its own
       → Promise<ArrayBuffer>    authenticated functions/api/cadence/
                                  tts-intro.js (or equivalent) and
                                  resolves the raw MP3 bytes for the
                                  EXACT `text` already shown/about to be
                                  shown -- this component never asks for
                                  audio of different words than what is
                                  displayed. Called for exactly three
                                  segment ids: cadence_intro_01,
                                  cadence_synthesis_response,
                                  cadence_closing_meet. If omitted, or if
                                  it rejects, that segment continues
                                  visually with its exact canonical text
                                  and no audio/orbital response --
                                  silent visual-only continuation, never
                                  a substituted word or a different
                                  voice/clip.
     onSubmitContext(context)    Fired once, synchronously-ish, right
                                  after Q3 is answered and BEFORE
                                  synthesize() is called -- this is where
                                  the host does its real, unconditional
                                  persistence write (matches the existing
                                  approved "unlock before the API call"
                                  timing). Return value ignored.
     onComplete(context)         Fired once the synthesized response has
                                  finished materializing and the final
                                  "Let's begin" state is showing.
     onEnterCourse(context)      Fired when the student clicks "Enter the
                                  Welcome Module" (after this component
                                  has faded itself out). Host does its own
                                  course-entry routing here.
     onSkip()                    Fired when Skip is clicked (after this
                                  component has faded itself out). Host
                                  does its own skip-persistence + routing
                                  here.

   context shape passed to the hooks above:
     { professional, stage, focus, combinedContext, name, detectedName }
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

  function safeDisplay(text) {
    var cleaned = String(text || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return '';
    return cleaned.length > 140 ? cleaned.slice(0, 139).trim() + '…' : cleaned;
  }

  // Only explicit naming language counts as a detected name -- "I'm a
  // licensed cosmetologist" or "I am preparing to launch" is professional
  // context, not a name, and must never be read as one (this used to
  // match "i'm"/"i am" too, which is exactly how it happened: "I'm an
  // esthetician" was misread as the name "an"). See runSynthesis() below,
  // which now also prefers the already-known account name over this
  // fallback rather than the other way around.
  function detectNameFromText(text) {
    var m = String(text || '').match(/(?:my name is|call me|name's)\s+([A-Z][a-z]+)/i);
    return m ? m[1] : '';
  }

  // ── Canonical Cadence dialogue manifest ──────────────────────────────
  // The ONE authoritative source for every piece of text Cadence displays
  // AND speaks -- there is no second, independently-maintained "spoken"
  // script. Runtime template resolution ({firstName} -> "Cady") always
  // happens first; the resolved string IS the canonical displayed
  // dialogue. Pronunciation normalization (normalizeForSpeech(), below)
  // is applied to that exact same resolved string only at the point of
  // synthesis -- it changes how a word is SPOKEN, never what is
  // DISPLAYED, and it is the only kind of change allowed to differ
  // between the two.
  //
  // Each segment's fields:
  //   id                stable id, also used as the audio-production
  //                     filename stem and (for the three runtime
  //                     segments) the tts-intro.js segment allowlist key.
  //   audioType         'static' (externally-produced, cleaned Jane
  //                     audio -- see docs/course-audit/listen-mode/*
  //                     for the production process this reuses) or
  //                     'runtime' (synthesized live via
  //                     functions/api/cadence/tts-intro.js because the
  //                     text depends on the student or the AI reply).
  //   type              thought / question / personalized / closing --
  //                     matches how the segment behaves visually (see
  //                     settlesAfterAudio).
  //   settlesAfterAudio whether the text stays on screen once its audio
  //                     finishes (a question waiting for an answer, or a
  //                     closing/response line that persists) rather than
  //                     breathing back out on its own like an ordinary
  //                     monologue thought. Not yet consumed by any
  //                     audio-timing code -- see this file's header for
  //                     why -- but already true of how each segment
  //                     behaves today under the text-only timing.
  //   pronunciation     only present where the visible text contains a
  //                     word needing TTS normalization (currently just
  //                     "AIMT" -- see normalizeForSpeech()).
  // Two approved continuous Jane performances (Audio Production Phase 1
  // -- owner-approved, generated as ONE take each specifically so tone,
  // pacing, and sibilance stay consistent across every static line; see
  // that phase's own audio-production log for how these were produced
  // and cue-mapped). These files are NEVER re-split, re-encoded, or
  // regenerated by this module -- static playback always decodes the
  // exact approved MP3 and plays an exact [start,end) region of it via
  // AudioBufferSourceNode.start(when, offset, duration), never a
  // separately-exported per-sentence file. `duration` here is each
  // master's own total length, used only to sanity-check decoded
  // buffers at load time, not to derive any cue boundary.
  var CADENCE_AUDIO_MASTERS = {
    intro: { url: 'assets/audio/cadence-intro/intro-monologue-master.mp3', duration: 88.64 },
    questions: { url: 'assets/audio/cadence-intro/questions-begin-master.mp3', duration: 20.24 }
  };

  var CADENCE_DIALOGUE = {
    monologue: [
      { id: 'cadence_intro_01', type: 'thought', audioType: 'runtime', settlesAfterAudio: false,
        named: 'Hi, {firstName}.', unnamed: 'Hi.' },
      { id: 'cadence_intro_01b', type: 'thought', audioType: 'static', settlesAfterAudio: false,
        text: "I'm Cadence.",
        cue: { master: 'intro', start: 0.000, end: 1.145 } },
      { id: 'cadence_intro_02', type: 'thought', audioType: 'static', settlesAfterAudio: false,
        text: "I'll be with you throughout AIMT — not as a replacement for the course or for your own professional judgment, but as the guide built into it.",
        pronunciation: { AIMT: 'A I M T' },
        cue: { master: 'intro', start: 1.145, end: 10.838 } },
      // ── Audio Sync Verification Pass ──────────────────────────────────
      // The cue boundaries below (10.838 through 83.11, i.e. every
      // boundary from cadence_intro_03 onward except 07/08 and 08/09)
      // were re-derived from real transcript evidence -- extracted
      // clips straddling each old boundary, transcribed via ElevenLabs
      // ASR, cross-checked against 2-5ms-resolution RMS silence-gap
      // analysis of this exact approved master (never modified; only
      // read/decoded for measurement). The PREVIOUS values were not a
      // padding-precision issue: RMS-silence-gap detection guided by the
      // old individually-generated clips' durations had picked the
      // WRONG pause -- several boundaries landed 2.5-3.5s away from the
      // real transition, deep inside the FOLLOWING segment's own
      // sentence (confirmed by transcribing the old boundary's
      // neighborhood and getting back the wrong segment's words, e.g.
      // the old 27.166 for 03/04 played cadence_intro_04's entire
      // opening clause while cadence_intro_03 was still the visible
      // thought). cadence_intro_01b/02 and 02/03 (1.145, 10.838) and
      // cadence_intro_07/08, 08/09 (56.928, 60.652) were independently
      // verified as already correct and are unchanged. Each corrected
      // pair below leaves the true inter-sentence silence OUT of both
      // cues (never split at its midpoint) -- ~140ms post-roll after
      // the earlier segment's real speech offset, ~90ms pre-roll before
      // the later segment's real onset, per this pass's own padding
      // guidance. See this pass's report for the full old-vs-new table.
      { id: 'cadence_intro_03', type: 'thought', audioType: 'static', settlesAfterAudio: false,
        text: "You can ask me questions while you learn, use me to work through something when it doesn't quite click, and you'll meet me again at Cadence Checks, where I'll ask you to explain your reasoning in your own words.",
        cue: { master: 'intro', start: 10.838, end: 23.630 } },
      { id: 'cadence_intro_04', type: 'thought', audioType: 'static', settlesAfterAudio: false,
        text: "I'm also the voice behind Listen Mode, so when you choose to listen instead of read, I'll guide you through supported parts of the course.",
        cue: { master: 'intro', start: 24.200, end: 33.060 } },
      // Canonical copy correction (Audio Production Phase 1): the
      // previous "AIMT's curriculum" read awkwardly once AIMT is spoken
      // as separated letters ("A I M T's"). Rewritten to avoid the
      // possessive entirely -- a real dialogue change, not a
      // pronunciation-only fix, so it applies to the visible text too.
      { id: 'cadence_intro_05', type: 'thought', audioType: 'static', settlesAfterAudio: false,
        text: "My guidance is grounded in the AIMT curriculum and the instructor's applied experience.",
        pronunciation: { AIMT: 'A I M T' },
        cue: { master: 'intro', start: 33.890, end: 39.720 } },
      { id: 'cadence_intro_06', type: 'thought', audioType: 'static', settlesAfterAudio: false,
        text: "I won't diagnose for you, decide what your license allows, or simply hand you the answer to a checkpoint.",
        cue: { master: 'intro', start: 40.000, end: 46.670 } },
      { id: 'cadence_intro_07', type: 'thought', audioType: 'static', settlesAfterAudio: false,
        text: "My role is to help you think more clearly, connect what you're learning to the service, and recognize where your reasoning can become stronger.",
        cue: { master: 'intro', start: 47.090, end: 56.928 } },
      { id: 'cadence_intro_08', type: 'thought', audioType: 'static', settlesAfterAudio: false,
        text: "And AIMT doesn't end with the lessons.",
        pronunciation: { AIMT: 'A I M T' },
        cue: { master: 'intro', start: 56.928, end: 60.652 } },
      { id: 'cadence_intro_09', type: 'thought', audioType: 'static', settlesAfterAudio: false,
        text: "As you move through the course, you'll gain access to practitioner tools and resources designed to carry what you're learning into real practice — including the AIMT Service Timer and Resource Library.",
        pronunciation: { AIMT: 'A I M T' },
        cue: { master: 'intro', start: 60.652, end: 74.140 } },
      { id: 'cadence_intro_10', type: 'thought', audioType: 'static', settlesAfterAudio: false,
        text: "We'll get to those when they're useful.",
        cue: { master: 'intro', start: 74.510, end: 76.890 } },
      { id: 'cadence_intro_11', type: 'thought', audioType: 'static', settlesAfterAudio: false,
        text: "Before you begin the Welcome Module, I'd like to know a little about where you're starting.",
        cue: { master: 'intro', start: 77.750, end: 82.380 } },
      { id: 'cadence_intro_12', type: 'thought', audioType: 'static', settlesAfterAudio: false,
        text: "What you share helps me keep my examples and feedback relevant to what you're actually working toward.",
        cue: { master: 'intro', start: 83.110, end: 88.640 } }
    ],
    // Audio Sync Verification Pass: q1's start (0.080) was independently
    // verified already-tight (speech begins ~0.08s in, no leading dead
    // air) and is unchanged. The three internal boundaries below were
    // content-order-correct all along (ASR confirmed no leaked/missing
    // words at any of them) -- unlike Batch 1, this was a padding-only
    // defect: each old boundary split a genuinely large inter-sentence
    // silence (0.58-1.4s) at its midpoint, baking excess dead air into
    // BOTH adjacent cues. Retimed with the same tight pre/post-roll
    // convention as Batch 1, above.
    questions: {
      q1: { id: 'cadence_q1', type: 'question', audioType: 'static', settlesAfterAudio: true,
        text: "What is your current professional role or license, and how much experience do you have behind the chair or in treatment services?",
        placeholder: "I'm a licensed cosmetologist with 5 years behind the chair, and I'm preparing to add head spa services.",
        cue: { master: 'questions', start: 0.080, end: 7.330 } },
      q2: { id: 'cadence_q2', type: 'question', audioType: 'static', settlesAfterAudio: true,
        text: "And where are you with head spa right now?",
        choices: ['Exploring it', 'Preparing to launch', 'Already taking head spa clients', 'Refining an established service'],
        cue: { master: 'questions', start: 8.510, end: 10.670 } },
      q3: { id: 'cadence_q3', type: 'question', audioType: 'static', settlesAfterAudio: true,
        text: "By the time you finish this course, what do you most want to feel stronger at — and what feels least clear to you right now?",
        placeholder: "I want to feel more confident with scalp microscopy and knowing how to adapt the service to what I observe.",
        cue: { master: 'questions', start: 11.010, end: 18.460 } }
    },
    // No fixed text -- resolved at runtime by the host's synthesize()
    // call (or the fallback below when it fails/returns empty). Whatever
    // string ends up shown to the student is exactly what
    // normalizeForSpeech() runs on before tts-intro.js synthesizes it --
    // see runSynthesis() below.
    personalizedResponse: { id: 'cadence_synthesis_response', type: 'personalized', audioType: 'runtime', settlesAfterAudio: true },
    // FALLBACK_REPLY_WITH_NAME is a SUFFIX appended directly after the
    // student's name (see runSynthesis() below), not a standalone
    // sentence -- kept as a suffix here rather than a {firstName}
    // template so the existing concatenation logic doesn't need to
    // change shape, only its wording.
    fallback: {
      withName: { id: 'cadence_fallback_reply_named', type: 'personalized', audioType: 'runtime', settlesAfterAudio: true,
        suffix: ", your introduction has been saved. You can begin the course now, and I'll be available inside each module." },
      noName: { id: 'cadence_fallback_reply_unnamed', type: 'personalized', audioType: 'runtime', settlesAfterAudio: true,
        text: "Your introduction has been saved. You can begin the course now, and I'll be available inside each module." }
    },
    // New (Audio Production Phase 1): a controlled named closing beat
    // between the personalized response and "Let's begin." -- see
    // runSynthesis() below for how it's sequenced and rendered using the
    // SAME breathing mechanism/markup the response itself already uses.
    closingMeet: { id: 'cadence_closing_meet', type: 'closing', audioType: 'runtime', settlesAfterAudio: true,
      named: "It's nice to meet you, {firstName}. I'm glad you're here, and I'm looking forward to helping you connect what you learn here to the work you want to do.",
      unnamed: "It's nice to meet you. I'm glad you're here, and I'm looking forward to helping you connect what you learn here to the work you want to do." },
    // start retimed (Audio Sync Verification Pass): the old shared
    // 18.927 boundary was content-correct (ASR confirmed this cue never
    // contains q3's tail and vice versa -- cadence_begin was already
    // proven to hold only "Let's begin.") but baked ~640ms of true
    // silence into this cue's own start, before "Let's" actually
    // begins. `end` (20.240, the master's own total duration) is
    // already tight -- audio runs right up to the file's end -- and is
    // unchanged.
    begin: { id: 'cadence_begin', type: 'closing', audioType: 'static', settlesAfterAudio: true, text: "Let's begin.",
      cue: { master: 'questions', start: 19.480, end: 20.240 } }
  };

  // {firstName} substitution -- the only template mechanism this
  // manifest needs; the resolved output IS the canonical displayed
  // dialogue (see the manifest comment above).
  function resolveTemplate(template, firstName) {
    return template.split('{firstName}').join(firstName);
  }

  // The ONE place "AIMT" gets rewritten for speech -- approved
  // production pronunciation is space-separated ("A I M T"), confirmed
  // by ear; never hyphenated. Never touches what is displayed. Shared by
  // static production-audio generation and (see
  // functions/_lib/cadence/tts.mjs, which keeps its own copy of this
  // exact rule for the server runtime, a separate JS environment this
  // browser file cannot be imported into) the runtime TTS endpoint --
  // keep both in sync if this rule ever changes. Not a general copy-
  // editing hook: it exists only for this one pronunciation mapping.
  function normalizeForSpeech(text) {
    return String(text || '').replace(/\bAIMT\b/g, 'A I M T');
  }

  // ── TEMPORARY diagnostic instrumentation (Audio Sync Verification Pass) ──
  // Exists only to make an audio/text drift bug immediately visible in the
  // console -- e.g. a later segment's audio starting while the previous
  // segment is still the active visible thought. Verification is now
  // complete (every corrected boundary confirmed drift-free -- see this
  // pass's report), so this is gated off by default; flip
  // CADENCE_DEBUG_TIMING back to true for a quick re-check after any
  // future cue-map change, or delete this block and its call sites
  // entirely once it's no longer needed. Changes no behavior, only what
  // gets logged.
  var CADENCE_DEBUG_TIMING = false;
  function logCadenceTiming(event, data) {
    if (!CADENCE_DEBUG_TIMING) return;
    data.t = Math.round(performance.now());
    console.log('[Cadence timing] ' + event, data);
  }

  // ── Quiet captioned thoughts: the final Cadence timing model ─────────
  // Superseded the earlier "breathe in -> long hold -> breathe out ->
  // quiet beat" choreography, which was designed before Jane had real
  // audio. Now that the orbital reacts to her actual voice, the text
  // itself stays out of the way: it appears quickly, stays perfectly
  // still while she speaks, and cross-dissolves directly into the next
  // thought -- with one small, universal landing beat after her audio
  // ends and before that cross-dissolve begins (Final Pacing Polish
  // Pass, Part 1) so a sentence has a moment to land rather than
  // dissolving away the instant she stops. ONE uniform pace for every
  // ordinary spoken statement (monologue thought or question), short or
  // long -- there is no separate "short clip" profile, because nothing
  // here holds long enough to need one.
  var ENTRY_FADE_IN_MS = 300;         // Part 1: ~200-350ms, whole sentence resolves at once
  var ENTRY_AUDIO_LEAD_MS = 190;      // Part 3: ~170-220ms after the text starts appearing -- kept low in range; the extra calm belongs after the sentence, not before Jane starts
  var CROSS_DISSOLVE_MS = 390;        // Part 2: ~350-425ms total overlap between outgoing and incoming thoughts
  // The ONE universal post-speech landing: Jane's audio ends, the
  // completed thought/question holds fully visible and still for this
  // long, THEN (for an ordinary thought) the next one's own entry
  // cross-dissolves it away, or (for a question) the composer/choices
  // reveal. Applied uniformly -- never tuned per sentence.
  var THOUGHT_LANDING_MS = 300;       // Part 1/4: ~250-350ms
  // Genuine phase changes only -- final monologue -> Q1, an answered
  // question -> the next question/context, Q3 -> synthesis, synthesis ->
  // the personalized reply, and closing -> "Let's begin." A little more
  // deliberate than an ordinary thought's landing, deliberately capped
  // low so it still reads as "moving," not a new loading state.
  var STATE_TRANSITION_MS = 520;      // Part 7: ~450-600ms

  // ── Shared Cadence audio engine (Audio Wiring phase) ─────────────────
  // ONE playback path for both static master-region audio and runtime
  // ElevenLabs clips, so the orbital's voice-responsive illumination
  // (setSpeakingIntensity's live-analyser callers inside mount(), below)
  // behaves identically regardless of audioType -- there is no separate
  // "static visual" vs "runtime visual" code path anywhere in this file.
  // Web Audio (AudioContext/AudioBufferSourceNode), not
  // HTMLAudioElement: static segments play an exact decoded [start,end)
  // region of one of the two approved master buffers via
  // AudioBufferSourceNode.start(when, offset, duration) rather than
  // HTMLAudioElement seeking/timeupdate polling; runtime segments decode
  // a freshly-fetched MP3 ArrayBuffer and play it in full. Both paths
  // run through the same AnalyserNode. The two master files themselves
  // are never re-split, re-encoded, or regenerated by this engine.
  function createCadenceAudioEngine() {
    var ctx = null;
    var analyser = null;
    var masterBuffers = {};
    var masterLoadPromise = null;
    var currentSource = null;
    var currentAnalyserLoop = null;

    function ensureContext() {
      if (!ctx) {
        var Ctor = global.AudioContext || global.webkitAudioContext;
        if (!Ctor) throw new Error('Web Audio API is not available in this browser.');
        ctx = new Ctor();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.75;
        analyser.connect(ctx.destination);
      }
      return ctx;
    }

    // Part L: explicitly ensures the context exists AND is 'running',
    // meant to be called synchronously from beginCadenceIntro() while
    // still inside the Begin click's own user-gesture call stack. The
    // previous call site here (audioEngine.resume()) ran BEFORE anything
    // had ever called ensureContext(), so `ctx` was still null and that
    // check was a silent no-op -- the context only actually got created
    // moments later, inside loadMasters(), with no explicit resume() ever
    // issued for it, leaving playback reliant on the context happening to
    // already be 'running' at construction time rather than guaranteeing
    // it.
    function ensureRunning() {
      var context;
      try {
        context = ensureContext();
      } catch (e) {
        console.warn('[Cadence audio] AudioContext unavailable:', e);
        return Promise.resolve();
      }
      if (context.state === 'running') return Promise.resolve();
      return context.resume().catch(function (e) {
        console.warn('[Cadence audio] AudioContext resume() failed:', e);
      });
    }

    // Decodes both approved master files once, in parallel, on first
    // use -- never re-fetched or re-decoded per segment. A failure here
    // only disables STATIC audio playback (visual-only continuation,
    // per this module's audio-failure rule); it never substitutes
    // different words or a different voice.
    function loadMasters() {
      if (masterLoadPromise) return masterLoadPromise;
      var context;
      try {
        context = ensureContext();
      } catch (e) {
        return (masterLoadPromise = Promise.reject(e));
      }
      masterLoadPromise = Promise.all(Object.keys(CADENCE_AUDIO_MASTERS).map(function (key) {
        var url = CADENCE_AUDIO_MASTERS[key].url;
        return fetch(url).then(function (res) {
          if (!res.ok) throw new Error('Failed to fetch Cadence master audio: ' + url);
          return res.arrayBuffer();
        }).then(function (buf) {
          return context.decodeAudioData(buf);
        }).then(function (audioBuffer) {
          masterBuffers[key] = audioBuffer;
        });
      })).catch(function (e) {
        masterLoadPromise = null; // allow a retry on the next real attempt
        throw e;
      });
      return masterLoadPromise;
    }

    // Runs a smoothed-amplitude sampling loop while a node plays, calling
    // onLevel(0..1) every frame; stops itself the instant playback ends.
    // Strong extra smoothing on top of the analyser's own
    // smoothingTimeConstant, and a modest, restrained output range --
    // "quiet speech: slight illumination, stronger syllable: slightly
    // brighter halo," never an equalizer.
    function startAnalyserLoop(onLevel) {
      var data = new Uint8Array(analyser.fftSize);
      var smoothed = 0;
      var active = true;
      function tick() {
        if (!active) return;
        analyser.getByteTimeDomainData(data);
        var sumSquares = 0;
        for (var i = 0; i < data.length; i++) {
          var v = (data[i] - 128) / 128;
          sumSquares += v * v;
        }
        var rms = Math.sqrt(sumSquares / data.length);
        smoothed = smoothed + (rms - smoothed) * 0.22;
        // Gain calibrated against the actual approved master recordings:
        // typical speech RMS after smoothing lands well under 0.1, so a
        // modest multiplier is needed for "slight illumination" to be
        // perceptible at all -- verified empirically against real
        // playback rather than assumed.
        var level = Math.max(0, Math.min(1, smoothed * 9));
        onLevel(level);
        currentAnalyserLoop = global.requestAnimationFrame(tick);
      }
      currentAnalyserLoop = global.requestAnimationFrame(tick);
      return function stopLoop() {
        active = false;
        if (currentAnalyserLoop) {
          global.cancelAnimationFrame(currentAnalyserLoop);
          currentAnalyserLoop = null;
        }
      };
    }

    // Plays an exact [start,end) region of one approved master. Resolves
    // when that region finishes. onLevel (optional) receives a smoothed
    // 0..1 amplitude value every frame while it plays. `label` (optional)
    // is a segment id, used only for the temporary timing diagnostics below.
    function playStaticCue(masterKey, start, end, onLevel, label) {
      return loadMasters().then(function () {
        var context = ensureContext();
        return new Promise(function (resolve, reject) {
          var buffer = masterBuffers[masterKey];
          if (!buffer) { reject(new Error('Master not loaded: ' + masterKey)); return; }
          var source = context.createBufferSource();
          source.buffer = buffer;
          source.connect(analyser);
          currentSource = source;
          var stopLoop = onLevel ? startAnalyserLoop(onLevel) : null;
          source.onended = function () {
            if (stopLoop) stopLoop();
            if (currentSource === source) currentSource = null;
            logCadenceTiming('audio end', { id: label, source: masterKey });
            resolve();
          };
          logCadenceTiming('audio start', { id: label, source: masterKey, requestedStart: start, requestedDuration: +(end - start).toFixed(3) });
          source.start(0, start, Math.max(0, end - start));
        });
      });
    }

    // Decodes and plays a full runtime MP3 ArrayBuffer (from
    // tts-intro.js) through the exact same analyser path as static cues.
    // Resolves when playback finishes. `label` (optional) is a segment id,
    // used only for the temporary timing diagnostics below.
    function playRuntimeBuffer(arrayBuffer, onLevel, label) {
      var context = ensureContext();
      return context.decodeAudioData(arrayBuffer.slice(0)).then(function (audioBuffer) {
        return new Promise(function (resolve, reject) {
          var source = context.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(analyser);
          currentSource = source;
          var stopLoop = onLevel ? startAnalyserLoop(onLevel) : null;
          source.onended = function () {
            if (stopLoop) stopLoop();
            if (currentSource === source) currentSource = null;
            logCadenceTiming('audio end', { id: label, source: 'runtime' });
            resolve();
          };
          logCadenceTiming('audio start', { id: label, source: 'runtime', requestedStart: 0, requestedDuration: +audioBuffer.duration.toFixed(3) });
          source.start(0);
        });
      });
    }

    // Hard-stops whatever is currently playing and releases the analyser
    // loop -- used by Skip/exit so no audio or animation frame survives
    // past the intro's own lifetime.
    function stopAll() {
      if (currentAnalyserLoop) {
        global.cancelAnimationFrame(currentAnalyserLoop);
        currentAnalyserLoop = null;
      }
      if (currentSource) {
        try { currentSource.onended = null; currentSource.stop(0); } catch (e) {}
        currentSource = null;
      }
    }

    // Fully releases the AudioContext and every node -- called once,
    // from destroy(), never mid-flow (a fresh mount() gets a fresh
    // engine, never a shared/reused AudioContext across mounts).
    function dispose() {
      stopAll();
      if (analyser) { try { analyser.disconnect(); } catch (e) {} analyser = null; }
      if (ctx) { try { ctx.close(); } catch (e) {} ctx = null; }
      masterBuffers = {};
      masterLoadPromise = null;
    }

    return {
      loadMasters: loadMasters,
      ensureRunning: ensureRunning,
      playStaticCue: playStaticCue,
      playRuntimeBuffer: playRuntimeBuffer,
      stopAll: stopAll,
      dispose: dispose
    };
  }

  var Q1 = { id: CADENCE_DIALOGUE.questions.q1.id, text: CADENCE_DIALOGUE.questions.q1.text };
  var Q2 = { id: CADENCE_DIALOGUE.questions.q2.id, text: CADENCE_DIALOGUE.questions.q2.text };
  var Q3 = { id: CADENCE_DIALOGUE.questions.q3.id, text: CADENCE_DIALOGUE.questions.q3.text };
  var Q2_CHOICES = CADENCE_DIALOGUE.questions.q2.choices;

  // Q1/Q3 example answers -- real HTML placeholder text only (Group 3:
  // first-answer anxiety, without letting the example ever become the
  // student's actual answer). Set as the textarea's `placeholder`
  // attribute in showComposer() below: muted, never part of `.value`,
  // never selectable, never submittable, never able to reach Cadence
  // memory. No prefilled value and no submit-guard are needed -- an
  // empty field simply can't be confused with real content.
  var Q1_PLACEHOLDER = CADENCE_DIALOGUE.questions.q1.placeholder;
  var Q3_PLACEHOLDER = CADENCE_DIALOGUE.questions.q3.placeholder;

  var FALLBACK_REPLY_WITH_NAME = CADENCE_DIALOGUE.fallback.withName.suffix;
  var FALLBACK_REPLY_NO_NAME = CADENCE_DIALOGUE.fallback.noName.text;

  // Raw orbital mark circles, inlined at each usage site (no shared
  // <symbol>/<use> -- see file header for why).
  var ORBITAL_MARK_PATHS =
    '<circle cx="22" cy="22" r="20" stroke="currentColor" stroke-width="0.75" opacity="0.6"/>' +
    '<circle cx="22" cy="22" r="13.5" stroke="currentColor" stroke-width="0.5" opacity="0.3"/>' +
    '<circle cx="22" cy="22" r="7" stroke="currentColor" stroke-width="0.5" opacity="0.2"/>' +
    '<circle cx="22" cy="22" r="2" fill="currentColor"/>' +
    '<circle cx="22" cy="2" r="1.5" fill="currentColor" opacity="0.75"/>' +
    '<circle cx="36.1" cy="7.9" r="1.5" fill="currentColor" opacity="0.75"/>' +
    '<circle cx="42" cy="22" r="1.5" fill="currentColor" opacity="0.75"/>' +
    '<circle cx="36.1" cy="36.1" r="1.5" fill="currentColor" opacity="0.75"/>' +
    '<circle cx="22" cy="42" r="1.5" fill="currentColor" opacity="0.75"/>' +
    '<circle cx="7.9" cy="36.1" r="1.5" fill="currentColor" opacity="0.75"/>' +
    '<circle cx="2" cy="22" r="1.5" fill="currentColor" opacity="0.75"/>' +
    '<circle cx="7.9" cy="7.9" r="1.5" fill="currentColor" opacity="0.75"/>';

  function orbitalSvg(className) {
    return '<svg class="' + className + '" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">' + ORBITAL_MARK_PATHS + '</svg>';
  }

  // ONE identity lockup, shared by the gate and the active view alike --
  // it is mounted once and never moves, resizes, or gets a second copy.
  // See runOrbitalActivation() in mount() below.
  function identityMarkHtml() {
    return (
      '<div class="intro-mark" id="introMark" data-el="mark">' +
        '<div class="intro-mark-icon-wrap" data-el="markIconWrap">' +
          '<span class="intro-halo"></span>' +
          orbitalSvg('intro-mark-icon') +
        '</div>' +
        '<div class="intro-mark-text">' +
          '<span class="intro-mark-title">Cadence</span>' +
          '<span class="intro-mark-sub">AIMT Learning Companion</span>' +
        '</div>' +
      '</div>'
    );
  }

  function templateHtml() {
    var choiceButtons = Q2_CHOICES.map(function (label) {
      return '<button type="button" class="intro-choice" data-choice="' + label + '">' + label + ' <span class="intro-choice-arrow">→</span></button>';
    }).join('');

    return (
      '<div class="intro-stage">' +
      identityMarkHtml() +
      '<div class="intro-gate" data-el="gate">' +
        '<button class="intro-begin-gate-btn" data-el="beginGateBtn" type="button">' +
          '<span class="intro-send-dot"></span>Begin Head Spa Certification →' +
        '</button>' +
      '</div>' +
      '<div class="intro-context-stack" data-el="contextStack"></div>' +
      '<div class="intro-inner" data-el="sequence">' +
        '<div class="intro-text-wrap">' +
          '<div class="intro-thought-field">' +
            '<div class="intro-thought" data-el="thoughtA"></div>' +
            '<div class="intro-thought" data-el="thoughtB"></div>' +
          '</div>' +
        '</div>' +
        '<div class="intro-divider" data-el="divider"></div>' +
        '<div class="intro-input-wrap" data-el="inputWrap">' +
          '<span class="intro-input-label">Tell Cadence</span>' +
          '<div class="intro-input-row">' +
            '<textarea class="intro-input" data-el="input" placeholder="Type your response…" data-placeholder="Type your response…" rows="3"></textarea>' +
            '<button class="voice-btn-dark" type="button" data-el="voiceBtn" title="Speak your answer" aria-label="Speak your answer">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>' +
            '</button>' +
          '</div>' +
          '<button class="intro-send" data-el="sendBtn" type="button"><div class="intro-send-dot"></div>Continue</button>' +
        '</div>' +
        '<div class="intro-choice-wrap" data-el="choiceWrap">' + choiceButtons + '</div>' +
        '<div class="intro-synth-wrap" data-el="synthWrap">' +
          '<div class="intro-synth-state" data-el="synthState">' +
            '<span>Cadence · Building your starting context</span>' +
          '</div>' +
          '<div class="intro-response-text" data-el="responseText"></div>' +
          '<div class="intro-response-text" data-el="closingMeet"></div>' +
          '<div class="intro-final-wrap" data-el="finalWrap">' +
            '<div class="intro-final-line" data-el="finalLine" data-audio-id="cadence_begin">Let\'s begin.</div>' +
            '<button class="intro-begin-btn" data-el="enterCourseBtn" type="button"><div class="intro-send-dot"></div>Enter the Welcome Module →</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '</div>' +
      '<button class="intro-skip" data-el="skipBtn" type="button">Skip</button>' +
      '<button class="intro-showfull" data-el="showFullBtn" type="button">Show full intro</button>'
    );
  }

  function mount(container, options) {
    options = options || {};
    var host = container || document.body;

    var root = document.createElement('div');
    root.id = 'introScreen';
    root.innerHTML = templateHtml();
    host.appendChild(root);

    function $(name) { return root.querySelector('[data-el="' + name + '"]'); }
    var gateEl = $('gate');
    var sequenceEl = $('sequence');
    var markEl = $('mark');
    var iconWrapEl = $('markIconWrap');
    var iconEl = iconWrapEl.querySelector('.intro-mark-icon');
    var contextStackEl = $('contextStack');
    var textWrapEl = root.querySelector('.intro-text-wrap');
    var thoughtAEl = $('thoughtA');
    var thoughtBEl = $('thoughtB');
    var dividerEl = $('divider');
    var inputWrapEl = $('inputWrap');
    var inputEl = $('input');
    var sendBtnEl = $('sendBtn');
    var choiceWrapEl = $('choiceWrap');
    var synthWrapEl = $('synthWrap');
    var synthStateEl = $('synthState');
    var responseTextEl = $('responseText');
    var closingMeetEl = $('closingMeet');
    var finalWrapEl = $('finalWrap');
    var finalLineEl = $('finalLine');
    var enterCourseBtnEl = $('enterCourseBtn');
    var skipBtnEl = $('skipBtn');
    var showFullBtnEl = $('showFullBtn');

    var introSkipped = false;
    var introInstantMode = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var introAnswers = { professional: '', stage: '', focus: '' };
    var lastContext = null;
    var answerResolve = null;
    var choiceResolve = null;
    var voiceRecognition = null;
    var activationStarted = false;
    var audioEngine = createCadenceAudioEngine();
    // Requested the instant "Begin Head Spa Certification" is clicked, in
    // parallel with the orbital activation turn, so the greeting's real
    // Jane audio is (ideally) already in hand by the time the activation
    // turn finishes and the greeting thought is about to appear -- see
    // beginCadenceIntro()/speakGreet() below.
    var greetAudioPromise = null;

    // Mirrors the thought field's own breathing envelope -- see
    // createThoughtField()/speakAudioSegment() below, called with a
    // smoothed 0..1 amplitude value sampled live from Jane's actual
    // audio (via audioEngine's AnalyserNode) while a clip is playing,
    // and with 0 the instant it stops -- using the mark's matching CSS
    // transition durations (see .intro-halo in the CSS). Cadence does
    // not "activate" independently of her voice; the halo simply
    // brightens and settles on her actual speech envelope. Identical
    // code path for static and runtime audio -- see
    // createCadenceAudioEngine() above.
    function setSpeakingIntensity(value) {
      var v = Math.max(0, Math.min(1, Number(value) || 0));
      root.querySelectorAll('.intro-mark').forEach(function (mark) {
        mark.style.setProperty('--cadence-speak-intensity', String(v));
        mark.classList.toggle('is-speaking', v > 0.02);
      });
    }

    function fire(name, arg) {
      var fn = options[name];
      if (typeof fn === 'function') {
        try { fn(arg); } catch (e) { /* host callback error must not break the intro */ }
      }
    }

    // The ONE call site for requesting runtime Jane audio -- used for
    // all three runtime segments (cadence_intro_01, cadence_synthesis_
    // response, cadence_closing_meet). `text` is always the exact,
    // already-canonical string this component is about to display --
    // never a template, never a different sentence than what the
    // student sees. Resolves to `null` (never rejects) when
    // options.requestRuntimeAudio is absent or fails, so every caller
    // can treat a null result as "continue visually, no audio" per this
    // module's audio-failure rule -- never a substituted word, never a
    // different voice, never a prerecorded stand-in played over
    // mismatched visible text.
    // A runtime audio request that REJECTS is already handled below (the
    // .catch resolves to null). The deadlock this module actually shipped
    // with was a request that never SETTLES at all -- a stalled fetch, a
    // Cloudflare Function that hangs, a broken host mock -- which left
    // speakAudioSegment's `await playAudioFn(...)` (and, for the
    // personalized response / closing segments, runSynthesis()'s own
    // `await responseAudioPromise` / `await closingMeetAudioPromise`)
    // waiting forever with no recovery path, freezing the whole intro on
    // whatever text was last shown. Reproduced directly during this fix by
    // patching fetch() to never resolve for the greeting's audio request:
    // the intro froze on "Hi." indefinitely with no way forward.
    // RUNTIME_AUDIO_TIMEOUT_MS bounds every runtime-audio request to a
    // single, generous-but-finite ceiling -- not an arbitrary giant wait,
    // but a number sized to a real worst case (a ~700-character
    // personalized reply synthesized via ElevenLabs eleven_v3 through a
    // cold Cloudflare Function). Racing the real request against this
    // timeout is the ONE guarantee that no segment can wait indefinitely;
    // a real request that resolves after losing the race is simply
    // ignored (its own .catch above still fires harmlessly, so nothing
    // becomes an unhandled rejection).
    var RUNTIME_AUDIO_TIMEOUT_MS = 10000;

    function requestRuntimeAudioSafe(segmentId, text) {
      if (typeof options.requestRuntimeAudio !== 'function') return Promise.resolve(null);
      var result;
      try {
        result = options.requestRuntimeAudio(segmentId, text);
      } catch (e) {
        console.warn('[Cadence audio] requestRuntimeAudio threw for ' + segmentId + ':', e);
        return Promise.resolve(null);
      }
      var requestPromise = Promise.resolve(result).catch(function (e) {
        console.warn('[Cadence audio] runtime audio request failed for ' + segmentId + ':', e);
        return null;
      });
      var timeoutPromise = new Promise(function (resolve) {
        setTimeout(function () {
          console.warn('[Cadence audio] runtime audio request for ' + segmentId + ' did not settle within ' + RUNTIME_AUDIO_TIMEOUT_MS + 'ms -- continuing visual-only, no audio for this segment.');
          resolve(null);
        }, RUNTIME_AUDIO_TIMEOUT_MS);
      });
      return Promise.race([requestPromise, timeoutPromise]);
    }

    // ── Gate ──────────────────────────────────────────────────────────
    // The whole environment (see mount()'s tail, below) fades in first;
    // the identity mark becomes perceptible a little after that, and the
    // "Begin Head Spa Certification" control softly reveals itself last -- nothing
    // pops onto the screen at once. The mark (markEl/iconWrapEl/iconEl)
    // is mounted once, here, and is never moved, resized, or reparented
    // for the rest of the intro's life -- see runOrbitalActivation()
    // below.
    function showGate() {
      sequenceEl.style.display = 'none';
      gateEl.style.display = 'flex';
      if (introInstantMode) {
        markEl.classList.add('show');
        $('beginGateBtn').classList.add('show');
        return;
      }
      setTimeout(function () { markEl.classList.add('show'); }, 500);
      setTimeout(function () { $('beginGateBtn').classList.add('show'); }, 1100);
    }

    // One clockwise 360° turn of the mark's icon, in place -- the icon
    // rotates around its own center (transform-origin defaults to 50%
    // 50%); iconWrapEl (its static positioning wrapper) is never touched,
    // never measured, never reparented. This is a plain rotation, not a
    // FLIP: the mark does not travel, resize, or leave the DOM at any
    // point. A soft bloom rises through the back half of the turn and
    // settles again as it lands -- see the CSS's
    // .intro-mark-icon-wrap.is-blooming rule.
    var ORBITAL_TURN_MS = 2600;         // one full, deliberate turn -- spec's 2400-2800ms window
    var ORBITAL_BLOOM_DELAY_MS = 1330;  // just past halfway through the turn
    var ORBITAL_SETTLE_MS = 350;        // glow settling back down before the quiet beat
    var GATE_LANDING_PAUSE_MS = 350;    // brief quiet beat once Cadence has arrived, before the first thought

    function runOrbitalActivation() {
      return new Promise(function (resolve) {
        // Gate content fades down; active content fades in underneath --
        // opacity only, overlapping, nothing moves. The mark itself sits
        // above both and is untouched by either transition.
        gateEl.classList.add('is-deactivating');
        sequenceEl.style.display = 'flex';
        requestAnimationFrame(function () { sequenceEl.classList.add('is-active'); });

        iconEl.style.rotate = '360deg';
        setTimeout(function () { iconWrapEl.classList.add('is-blooming'); }, ORBITAL_BLOOM_DELAY_MS);
        setTimeout(function () { iconWrapEl.classList.remove('is-blooming'); }, ORBITAL_TURN_MS);
        setTimeout(resolve, ORBITAL_TURN_MS + ORBITAL_SETTLE_MS);
      });
    }

    // Fires the exact same runtime-audio request path used everywhere
    // else in this file (see requestRuntimeAudioSafe below) for the
    // resolved greeting sentence -- called the instant "Begin Head Spa
    // Certification" is clicked so the request runs concurrently with
    // the orbital activation turn rather than after it (Audio Wiring
    // step 6). Never stitches a name into a clip: the ENTIRE resolved
    // sentence ("Hi, Cady." / "Hi.") is the one string requested.
    function requestGreetAudio() {
      var seg = CADENCE_DIALOGUE.monologue[0];
      var firstName = options.firstName || '';
      var text = resolveTemplate(firstName ? seg.named : seg.unnamed, firstName);
      return requestRuntimeAudioSafe(seg.id, text);
    }

    function beginCadenceIntro() {
      if (activationStarted) return;
      activationStarted = true;

      $('beginGateBtn').classList.remove('show');
      audioEngine.ensureRunning();
      audioEngine.loadMasters().catch(function (e) {
        console.warn('[Cadence audio] static master audio failed to load -- continuing visual-only:', e);
      });
      greetAudioPromise = requestGreetAudio();

      if (introInstantMode) {
        gateEl.style.display = 'none';
        sequenceEl.style.display = 'flex';
        sequenceEl.classList.add('is-active');
        runFlow();
        return;
      }

      runOrbitalActivation().then(function () {
        return sleep(GATE_LANDING_PAUSE_MS);
      }).then(function () {
        gateEl.style.display = 'none';
        showFullBtnEl.style.display = 'block';
        runFlow();
      });
    }

    // Manual "show full intro" and prefers-reduced-motion both land here:
    // every remaining phrase renders with only a brief opacity transition
    // instead of the full cinematic fade/hold, but the sequence itself --
    // monologue, then Question 1, then Question 2, then Question 3, one
    // at a time -- is unchanged. Accessibility gets the same content and
    // the same sequential questions, not a shortcut past them.
    function showFullIntro() {
      introInstantMode = true;
      showFullBtnEl.style.display = 'none';
    }

    // ── The thought field: quiet captioned thoughts ───────────────────────
    // Two stacked text elements sharing one fixed position (CSS grid
    // overlap -- see .intro-thought-field/.intro-thought in the CSS, both
    // assigned the same grid cell so the container's rendered height
    // always fits whichever one is taller while they cross-dissolve, and
    // the field itself never moves, resizes as a jump, or reparents).
    // At rest exactly one is fully opaque; during a transition BOTH are
    // mid-fade at once -- the outgoing thought dissolving out while the
    // incoming one dissolves in, in the same fixed spot, never a stack of
    // readable text, never a slide. The Cadence mark's halo is driven in
    // exact sync with the incoming thought's own envelope (see
    // setSpeakingIntensity above) so the two feel like one system, not
    // two independently-timed effects.
    function createThoughtField(elA, elB) {
      var activeEl = null; // the element currently visible/entering; null before the first thought

      function otherOf(el) { return el === elA ? elB : elA; }

      // Starts the NEXT thought's text fading in and, if something is
      // already showing, fades THAT one out at the exact same time -- a
      // true overlapping cross-dissolve (Part 3), never a sequential
      // fade-out-then-gap-then-fade-in. Synchronous (no sleep) so callers
      // can decide separately how long to wait before continuing (a
      // purely-visual settle() waits out the full fade-in; the audio path
      // waits only the shorter audio-lead -- see below).
      function beginCrossDissolve(text, id) {
        logCadenceTiming('text transition start', { id: id, text: text });
        var incoming = activeEl ? otherOf(activeEl) : elA;
        var outgoing = activeEl;
        incoming.textContent = text;
        activeEl = incoming;
        if (introSkipped) return;
        incoming.style.setProperty('--cadence-fade-in', ENTRY_FADE_IN_MS + 'ms');
        void incoming.offsetWidth; // force layout so the browser applies opacity:0 before we transition away from it
        incoming.classList.add('is-visible');
        if (outgoing) {
          outgoing.style.setProperty('--cadence-fade-out', CROSS_DISSOLVE_MS + 'ms');
          outgoing.classList.remove('is-visible');
        }
      }

      return {
        // Fades a thought in (cross-dissolving from whatever was
        // showing, if anything) and leaves it resting, visible. Not
        // audio-aware itself -- see speakAudioSegment below for the
        // audio-driven monologue/question path; this stays available for
        // any purely-visual use.
        settle: function (text) {
          beginCrossDissolve(text);
          if (introSkipped || introInstantMode) return Promise.resolve();
          return sleep(ENTRY_FADE_IN_MS);
        },
        // Fades the currently-active thought away with no incoming
        // partner -- used only once, after the LAST question (Q3) has
        // been answered, since nothing else will occupy the thought
        // field afterward (the flow moves on to the synthesis/response
        // UI instead). Every OTHER question-answered transition instead
        // flows straight into the next question's own speakAudioSegment
        // call (see runFlow()), which cross-dissolves this one out AS it
        // fades the next one in -- Part 5: "Do not cross-dissolve it
        // away until the student's answer has been captured," so this is
        // called only once the answer is already in hand.
        release: function () {
          if (!activeEl) return Promise.resolve();
          var outgoing = activeEl;
          activeEl = null;
          outgoing.style.setProperty('--cadence-fade-out', CROSS_DISSOLVE_MS + 'ms');
          outgoing.classList.remove('is-visible');
          setSpeakingIntensity(0);
          if (introInstantMode) return Promise.resolve();
          return sleep(CROSS_DISSOLVE_MS);
        },
        // The audio-authoritative path: cross-dissolves the thought in
        // (fading out whatever was showing, at the same time -- Part 3),
        // starts `playAudioFn` ENTRY_AUDIO_LEAD_MS after the fade begins
        // (Part 1 -- "by the first audible word, the sentence should
        // already be clearly readable"), and waits for the actual audio
        // to finish (never a fixed estimate). Audio's own completion IS
        // the boundary (Part 11) -- there is no artificial post-audio
        // hold or beat here; the text simply stays fully visible and
        // still until the NEXT call to speakAudioSegment/settle cross-
        // dissolves it away, or (for the final question) until release()
        // does. `playAudioFn(onLevel)` must return a Promise that
        // resolves when playback ends; onLevel(0..1) is called
        // continuously while it plays and feeds the orbital's live
        // voice-response illumination via setSpeakingIntensity. A
        // failed/absent playAudioFn still resolves (audio-failure rule:
        // exact canonical text stays on screen, silently, no substituted
        // audio) so the sequence itself is never blocked by an audio
        // problem -- and requestRuntimeAudioSafe above bounds how long a
        // runtime playAudioFn can even take to resolve, so this await
        // can never hang indefinitely.
        speakAudioSegment: async function (text, playAudioFn, id) {
          beginCrossDissolve(text, id);
          if (introSkipped) return;
          setSpeakingIntensity(0.22); // gentle baseline while the thought is still visually arriving, before real audio starts
          if (!introInstantMode) await sleep(ENTRY_AUDIO_LEAD_MS);
          if (introSkipped) return;
          try {
            await playAudioFn(setSpeakingIntensity);
          } catch (e) {
            console.warn('[Cadence audio] segment playback failed -- continuing with text only:', e);
          }
          setSpeakingIntensity(0);
        }
      };
    }

    // Opacity reveal/dissolve durations -- kept in sync with the CSS's
    // matching transition durations (.intro-input-wrap,
    // .intro-choice-wrap/.show) -- and also how long JS waits before
    // switching an element back to display:none, so that switch never
    // lands mid-fade (see hideComposer()/hideChoices() below).
    var COMPOSER_FADE_MS = 750;     // Q1/Q3 composer -- same duration both directions, Final Pacing Polish Pass Part 5/6's 650-850ms window (opacity only; see .intro-input-wrap in the CSS -- no slide/scale/height change)
    var CHOICE_FADE_IN_MS = 1300;   // Q2 options revealing -- spec's 1000-1400ms window
    var CHOICE_FADE_OUT_MS = 1000;  // Q2 options dissolving -- spec's 900-1200ms window
    var CHOICE_SELECTED_HOLD_MS = 550; // the chosen option stays visibly illuminated before Cadence advances

    // ── Composer (shared by Q1 & Q3) ────────────────────────────────────
    // Q1/Q3 show a real example as the textarea's native `placeholder`
    // (muted, never part of `.value`) rather than a prefilled, selectable
    // answer -- the example can never be selected, edited-in-place,
    // submitted, or reach Cadence's memory, because it is never the
    // field's actual content.
    function showComposer(placeholderText) {
      inputEl.value = '';
      inputEl.placeholder = placeholderText || inputEl.getAttribute('data-placeholder') || 'Type your response…';
      inputEl.setAttribute('data-placeholder', inputEl.placeholder);
      inputEl.disabled = false;
      inputEl.style.height = 'auto';
      sendBtnEl.style.display = 'flex';
      dividerEl.classList.add('show');
      inputWrapEl.style.display = 'block';
      requestAnimationFrame(function () {
        inputWrapEl.classList.add('show');
        // Pointer/focus enables once the slow reveal has actually reached
        // its visible end, not partway through the fade.
        setTimeout(function () { inputEl.focus(); }, introInstantMode ? 0 : COMPOSER_FADE_MS);
      });
    }

    // Fades the WHOLE composer (textarea + send button) out together as
    // one unit, only actually leaving the layout/interaction once that
    // fade has visually finished -- previously the send button was
    // hard-hidden the instant submit was clicked (see the old
    // submitComposer()), popping out of an otherwise still-visible,
    // still-fading composer. Nothing here is hidden before its opacity
    // transition completes.
    function hideComposer() {
      dividerEl.classList.remove('show');
      inputWrapEl.classList.remove('show');
      setTimeout(function () {
        inputWrapEl.style.display = 'none';
        sendBtnEl.style.display = 'none';
      }, introInstantMode ? 0 : COMPOSER_FADE_MS);
    }

    function askComposer(placeholderText) {
      showComposer(placeholderText);
      return new Promise(function (resolve) { answerResolve = resolve; });
    }

    function submitComposer() {
      var text = inputEl.value.trim();
      if (!text) { inputEl.focus(); return; }
      inputEl.disabled = true;
      hideComposer();
      var resolveFn = answerResolve;
      answerResolve = null;
      if (resolveFn) setTimeout(function () { resolveFn(text); }, introInstantMode ? 0 : 250);
    }

    // ── Question 2 choices ───────────────────────────────────────────
    function showChoices() {
      choiceWrapEl.style.display = 'flex';
      choiceWrapEl.querySelectorAll('.intro-choice').forEach(function (b) { b.disabled = false; });
      requestAnimationFrame(function () { choiceWrapEl.classList.add('show'); });
    }

    function hideChoices() {
      choiceWrapEl.classList.remove('show');
      setTimeout(function () { choiceWrapEl.style.display = 'none'; }, introInstantMode ? 0 : CHOICE_FADE_OUT_MS);
    }

    function askChoice() {
      showChoices();
      return new Promise(function (resolve) { choiceResolve = resolve; });
    }

    // The clicked option illuminates in place -- same box, same border
    // width, no neighboring option moves -- and holds visibly for
    // CHOICE_SELECTED_HOLD_MS so the student can register their own
    // selection before Cadence advances, rather than the whole group
    // vanishing the instant they click.
    function chooseStage(value, btnEl) {
      var resolveFn = choiceResolve;
      if (!resolveFn) return;
      choiceResolve = null;
      choiceWrapEl.querySelectorAll('.intro-choice').forEach(function (b) { b.disabled = true; });
      if (btnEl) btnEl.classList.add('is-selected');
      setTimeout(function () {
        hideChoices();
        setTimeout(function () { resolveFn(value); }, introInstantMode ? 0 : 250);
      }, introInstantMode ? 0 : CHOICE_SELECTED_HOLD_MS);
    }

    // ── Captured context ─────────────────────────────────────────────
    function appendContext(label, value) {
      var item = document.createElement('div');
      item.className = 'intro-context-item';
      var labelEl = document.createElement('span');
      labelEl.className = 'intro-context-label';
      labelEl.textContent = label;
      var valueEl = document.createElement('span');
      valueEl.className = 'intro-context-value';
      valueEl.textContent = safeDisplay(value);
      item.appendChild(labelEl);
      item.appendChild(valueEl);
      contextStackEl.appendChild(item);
    }

    // ── The full sequence ────────────────────────────────────────────
    // monologue -> Question 1 (composer) -> Question 2 (choices) ->
    // Question 3 (composer) -> one synthesis call -> personalized
    // response -> final transition. Only one interactive control is
    // visible at a time. Every ordinary spoken statement (monologue
    // thought or question) holds for THOUGHT_LANDING_MS once Jane's audio
    // ends, then cross-dissolves into the next (Part 1/4 of the Final
    // Pacing Polish Pass) -- for a question, that same landing beat runs
    // before the composer/choices reveal. The question itself only
    // cross-dissolves away once the student has actually answered -- the
    // NEXT question's own entry supplies that fade for Q1->Q2 and
    // Q2->Q3; field.release() (no incoming partner) handles it only after
    // the LAST question, Q3, since nothing else occupies the thought
    // field afterward. The five genuine phase changes (final monologue ->
    // Q1, an answered question -> the next, Q3 -> synthesis, synthesis ->
    // personalized reply, closing -> "Let's begin.") instead use the
    // slightly larger STATE_TRANSITION_MS -- see each site below and
    // runSynthesis().

    // Plays a static cue through the shared audio engine, wired to the
    // live voice-response callback -- the one shape every static
    // monologue thought and question passes to speakAudioSegment.
    function playCue(cue, onLevel, label) {
      return audioEngine.playStaticCue(cue.master, cue.start, cue.end, onLevel, label);
    }

    function speakGreet(field) {
      var seg = CADENCE_DIALOGUE.monologue[0]; // cadence_intro_01 -- runtime
      var firstName = options.firstName || '';
      var text = resolveTemplate(firstName ? seg.named : seg.unnamed, firstName);
      return field.speakAudioSegment(text, function (onLevel) {
        return greetAudioPromise.then(function (arrayBuffer) {
          if (!arrayBuffer) return; // requested during activation; absent/failed -- visual-only, per audio-failure rule
          return audioEngine.playRuntimeBuffer(arrayBuffer, onLevel, seg.id);
        });
      }, seg.id);
    }

    // Universal landing (Part 1) after every ordinary monologue thought
    // except the last -- final monologue -> Q1 is a genuine phase change
    // and gets its own, slightly larger separation from the caller
    // (runFlow), not this per-thought beat.
    async function speakStaticMonologue(field) {
      var segs = CADENCE_DIALOGUE.monologue.slice(1); // cadence_intro_01b..12, in order
      for (var i = 0; i < segs.length; i++) {
        if (introSkipped) return;
        var seg = segs[i];
        await field.speakAudioSegment(seg.text, function (onLevel) { return playCue(seg.cue, onLevel, seg.id); }, seg.id);
        if (introSkipped) return;
        if (i < segs.length - 1 && !introInstantMode) await sleep(THOUGHT_LANDING_MS);
      }
    }

    async function runFlow() {
      var field = createThoughtField(thoughtAEl, thoughtBEl);

      await speakGreet(field);
      if (introSkipped) return;
      if (!introInstantMode) await sleep(THOUGHT_LANDING_MS);

      await speakStaticMonologue(field);
      if (introSkipped) return;
      if (!introInstantMode) await sleep(STATE_TRANSITION_MS); // final monologue -> Q1

      // Q1/Q2/Q3: the question cross-dissolves in (from cadence_intro_12,
      // or from the previous question), Jane asks it in full (its own
      // cue's real duration -- never an estimate), and stays fully
      // visible with no fade-out once she finishes -- only the one
      // universal THOUGHT_LANDING_MS beat runs before the composer/
      // choices reveal (Part 4).
      await field.speakAudioSegment(Q1.text, function (onLevel) { return playCue(CADENCE_DIALOGUE.questions.q1.cue, onLevel, Q1.id); }, Q1.id);
      if (introSkipped) return;
      if (!introInstantMode) await sleep(THOUGHT_LANDING_MS);
      var professional = await askComposer(Q1_PLACEHOLDER);
      if (introSkipped) return;
      introAnswers.professional = professional;
      appendContext('Professional Context', professional);
      if (!introInstantMode) await sleep(STATE_TRANSITION_MS); // answered question -> next question/context

      await field.speakAudioSegment(Q2.text, function (onLevel) { return playCue(CADENCE_DIALOGUE.questions.q2.cue, onLevel, Q2.id); }, Q2.id);
      if (introSkipped) return;
      if (!introInstantMode) await sleep(THOUGHT_LANDING_MS);
      var stage = await askChoice();
      if (introSkipped) return;
      introAnswers.stage = stage;
      appendContext('Head Spa Stage', stage);
      if (!introInstantMode) await sleep(STATE_TRANSITION_MS); // answered question -> next question/context

      await field.speakAudioSegment(Q3.text, function (onLevel) { return playCue(CADENCE_DIALOGUE.questions.q3.cue, onLevel, Q3.id); }, Q3.id);
      if (introSkipped) return;
      if (!introInstantMode) await sleep(THOUGHT_LANDING_MS);
      var focus = await askComposer(Q3_PLACEHOLDER);
      if (introSkipped) return;
      introAnswers.focus = focus;
      appendContext('Current Focus', focus);
      if (!introInstantMode) await sleep(STATE_TRANSITION_MS); // Q3 -> synthesis
      await field.release();

      // No further thought will ever occupy this field again -- collapse
      // its reserved space so the response doesn't sit behind a tall dead
      // gap where a thought used to breathe (Group 4B).
      textWrapEl.classList.add('is-done');

      await runSynthesis();
    }

    // The personalized response is the one runtime segment with its own
    // slightly distinct pace (Part 8: "quick soft resolve... 250-400ms" --
    // close to, but not identical to, ENTRY_FADE_IN_MS/ENTRY_AUDIO_LEAD_MS
    // above). cadence_closing_meet, by contrast, "behaves like a normal
    // spoken thought" (Part 9), so it reuses ENTRY_FADE_IN_MS/
    // ENTRY_AUDIO_LEAD_MS directly rather than these two.
    var RESPONSE_FADE_IN_MS = 320;        // Part 8: ~250-400ms
    var RESPONSE_AUDIO_LEAD_MS = 180;     // "Jane begins shortly after" the fade starts
    var SYNTH_BREATHE_OUT_MS = 550;       // the "thinking" label's own fade-out -- synthesis is allowed to stay a little more deliberate (Part 7); untouched by the Final Pacing Polish Pass, which does not change synthesis behavior
    // The response's own post-audio landing (Part 8: "a modest natural
    // hold... no theatrical pause") and the response -> closing beat both
    // reuse the SAME universal THOUGHT_LANDING_MS as every other ordinary
    // thought (neither is one of the five genuine phase changes below) --
    // see runSynthesis(). synthesis -> personalized reply and closing ->
    // "Let's begin." ARE genuine phase changes and use STATE_TRANSITION_MS
    // instead, both declared above.

    // The "thinking" orbital: while Cadence is actively connecting the
    // student's answers, the SAME persistent icon (no new element, no
    // spinner, no dots) turns one extremely slow clockwise 360° at a
    // time -- a discrete thought cycle, not a continuous CSS spinner.
    // Each turn's own duration (SYNTH_TURN_MS, always awaited in full via
    // the while-loop below) already establishes a calm minimum synthesis
    // presence on its own; there's no separate minimum-hold timer to
    // track alongside it.
    var SYNTH_TURN_MS = 5200;          // one full contemplative turn -- spec's 4500-6000ms window, materially slower than the 2600ms activation turn
    var SYNTH_TURN_BLOOM_RATIO = 0.55; // glow begins a little past halfway through each turn
    var SYNTH_TURN_PAUSE_MS = 700;     // quiet pause between turns while still waiting -- spec's 500-900ms window

    function currentIconRotateDeg() {
      var raw = iconEl.style.rotate || getComputedStyle(iconEl).rotate || '0deg';
      var m = String(raw).match(/-?[\d.]+/);
      return m ? parseFloat(m[0]) : 0;
    }

    // Runs discrete slow thinking-turns for as long as apiPromise is
    // still pending, then lets the CURRENT turn finish in full before
    // returning -- the orbital is never cut off mid-turn. A no-op wait
    // (no rotation at all) under reduced motion / show-full-intro, same
    // as the rest of the intro's instant-mode branches.
    async function runThinkingTurns(apiPromise) {
      var done = false;
      apiPromise.then(function () { done = true; }, function () { done = true; });

      if (introInstantMode) {
        await apiPromise.catch(function () {});
        return;
      }

      iconWrapEl.classList.add('is-thinking');
      while (true) {
        iconEl.style.rotate = (currentIconRotateDeg() + 360) + 'deg';
        setTimeout(function () { iconWrapEl.classList.add('is-blooming'); }, Math.round(SYNTH_TURN_MS * SYNTH_TURN_BLOOM_RATIO));
        await sleep(SYNTH_TURN_MS);
        iconWrapEl.classList.remove('is-blooming');
        if (done || introSkipped) break;
        await sleep(SYNTH_TURN_PAUSE_MS);
        if (done || introSkipped) break;
      }
      iconWrapEl.classList.remove('is-thinking');
    }

    // The same quick-resolve, audio-authoritative entry used by the
    // thought field (speakAudioSegment), applied to the two
    // .intro-response-text elements directly since they are not part of
    // the thought field (they stay permanently visible afterward, never
    // cross-dissolved away -- see the CSS's matching .intro-response-text
    // transition). `fadeInMs`/`audioLeadMs` let the response (Part 8) and
    // the closing line (Part 9, "a normal spoken thought") use their own
    // slightly different paces through the one shared function.
    async function breatheInWithAudio(el, playAudioFn, fadeInMs, audioLeadMs, id) {
      logCadenceTiming('text transition start', { id: id, text: el.textContent });
      if (introInstantMode) {
        el.classList.add('show');
        try { await playAudioFn(setSpeakingIntensity); } catch (e) { console.warn('[Cadence audio] segment playback failed -- continuing with text only:', e); }
        setSpeakingIntensity(0);
        return;
      }
      el.style.setProperty('--cadence-fade-in', fadeInMs + 'ms');
      void el.offsetWidth;
      el.classList.add('show');
      setSpeakingIntensity(0.22);
      await sleep(audioLeadMs);
      if (introSkipped) return;
      try {
        await playAudioFn(setSpeakingIntensity);
      } catch (e) {
        console.warn('[Cadence audio] segment playback failed -- continuing with text only:', e);
      }
      setSpeakingIntensity(0);
    }

    async function runSynthesis() {
      synthWrapEl.style.display = 'block';
      synthStateEl.style.display = 'flex';
      responseTextEl.classList.remove('show');
      responseTextEl.innerHTML = '';
      closingMeetEl.classList.remove('show');
      closingMeetEl.textContent = '';
      finalLineEl.classList.remove('is-visible');
      enterCourseBtnEl.classList.remove('show');
      finalWrapEl.style.display = 'none';

      // Breathes in exactly like an opening thought -- no spinner, no
      // dots (see .intro-synth-state/.show in the CSS: the same
      // asymmetric-duration technique as .intro-thought/.is-visible).
      // The thinking orbital (below) starts turning alongside this, not
      // after it finishes -- both are the same "Cadence is now thinking"
      // moment.
      void synthStateEl.offsetWidth;
      synthStateEl.classList.add('show');

      var professional = introAnswers.professional;
      var stage = introAnswers.stage;
      var focus = introAnswers.focus;

      // One clearly-labeled combined representation of all three answers.
      // The host's onSubmitContext/synthesize both receive this same
      // shape -- see file header for the full context contract.
      var combinedContext =
        'Professional context: ' + professional +
        '\n\nHead spa stage: ' + stage +
        '\n\nGoal / uncertainty: ' + focus;

      var detectedName = detectNameFromText(combinedContext);
      // The already-known account/profile name wins when it exists --
      // text detection is only a fallback for a first-time student the
      // host doesn't have a name for yet, and only ever fires on
      // explicit naming language (see detectNameFromText above).
      var name = options.firstName || detectedName || '';
      var context = {
        professional: professional,
        stage: stage,
        focus: focus,
        combinedContext: combinedContext,
        name: name,
        detectedName: detectedName
      };
      lastContext = context;

      fire('onSubmitContext', context);

      // cadence_closing_meet's text depends only on the already-known
      // name, not on the AI reply -- so its runtime audio is requested
      // here, concurrently with the personalized-response call below,
      // rather than waiting for the response first. This is what lets
      // the thinking state mask as much runtime latency as safely
      // possible (Audio Wiring step 8) for BOTH runtime clips, not just
      // one.
      var closingMeetText = context.name
        ? resolveTemplate(CADENCE_DIALOGUE.closingMeet.named, context.name)
        : CADENCE_DIALOGUE.closingMeet.unnamed;
      var closingMeetAudioPromise = requestRuntimeAudioSafe(CADENCE_DIALOGUE.closingMeet.id, closingMeetText);

      // apiPromise is consumed twice, independently: runThinkingTurns()
      // below only cares WHEN it settles (to know when to stop turning),
      // while the try/catch here cares what it resolves to -- attaching
      // more than one .then()/await to the same promise is safe, neither
      // consumes it for the other. Wrapped in its own try/catch because
      // options.synthesize(context) could throw synchronously rather
      // than return a rejected promise; either way apiPromise ends up a
      // normal promise safe to hand to runThinkingTurns().
      var apiPromise;
      try {
        apiPromise = typeof options.synthesize === 'function' ? Promise.resolve(options.synthesize(context)) : Promise.resolve(null);
      } catch (e) {
        apiPromise = Promise.reject(e);
      }
      var turnsPromise = runThinkingTurns(apiPromise);

      var replyText;
      try {
        var result = await apiPromise;
        if (typeof result !== 'string' || !result.trim()) throw new Error('empty reply');
        replyText = result;
      } catch (e) {
        replyText = context.name ? context.name + FALLBACK_REPLY_WITH_NAME : FALLBACK_REPLY_NO_NAME;
      }

      // Only now -- once the exact canonical response string is known --
      // can its own runtime audio be requested. This still overlaps with
      // however much of the current thinking turn is still in flight
      // (awaited next), rather than starting only after it.
      var responseAudioPromise = requestRuntimeAudioSafe(CADENCE_DIALOGUE.personalizedResponse.id, replyText);

      // Let the current thinking turn resolve naturally rather than
      // cutting the orbital off mid-turn.
      await turnsPromise;
      if (introSkipped) return;

      // Do not reveal the response merely because its TEXT arrived --
      // also wait for its audio request to settle (success or null)
      // before any fade-in begins, per this module's audio-failure rule.
      var responseAudioBuffer = await responseAudioPromise;
      if (introSkipped) return;

      responseTextEl.innerHTML = replyText.split('\n').filter(function (l) { return l.trim(); }).map(function (l) { return '<p>' + l + '</p>'; }).join('');

      // Synthesis breathes fully out before the response ever begins --
      // never an instant swap; this is the one place Cadence is still
      // allowed to feel deliberate (Part 7).
      synthStateEl.classList.remove('show');
      if (!introInstantMode) await sleep(SYNTH_BREATHE_OUT_MS);
      synthStateEl.style.display = 'none';
      if (introSkipped) return;
      if (!introInstantMode) await sleep(STATE_TRANSITION_MS); // synthesis -> personalized reply

      // The response now behaves like an ordinary spoken thought (Part
      // 8): a quick soft resolve, Jane beginning shortly after, no
      // theatrical breathing entrance.
      await breatheInWithAudio(responseTextEl, function (onLevel) {
        if (!responseAudioBuffer) return Promise.resolve();
        return audioEngine.playRuntimeBuffer(responseAudioBuffer, onLevel, CADENCE_DIALOGUE.personalizedResponse.id);
      }, RESPONSE_FADE_IN_MS, RESPONSE_AUDIO_LEAD_MS, CADENCE_DIALOGUE.personalizedResponse.id);
      if (introSkipped) return;
      if (!introInstantMode) await sleep(THOUGHT_LANDING_MS); // response's own landing (Part 8) -- ordinary, not a phase change

      // cadence_closing_meet -- a controlled named closing beat between
      // the personalized response and "Let's begin," behaving like any
      // other normal spoken thought (Part 9). Its audio was already
      // requested above, concurrently with the response -- by now it
      // should already be settled, so this await is normally instant.
      closingMeetEl.textContent = closingMeetText;
      if (!introInstantMode) await sleep(THOUGHT_LANDING_MS); // response -> closing, ordinary
      if (introSkipped) return;
      var closingMeetAudioBuffer = await closingMeetAudioPromise;
      if (introSkipped) return;
      await breatheInWithAudio(closingMeetEl, function (onLevel) {
        if (!closingMeetAudioBuffer) return Promise.resolve();
        return audioEngine.playRuntimeBuffer(closingMeetAudioBuffer, onLevel, CADENCE_DIALOGUE.closingMeet.id);
      }, ENTRY_FADE_IN_MS, ENTRY_AUDIO_LEAD_MS, CADENCE_DIALOGUE.closingMeet.id);
      if (introSkipped) return;
      if (!introInstantMode) await sleep(STATE_TRANSITION_MS); // closing -> "Let's begin.", genuine phase change

      // "Let's begin." follows the same text-leads-voice entry as every
      // other spoken line (Part 1) instead of playing its audio to
      // completion before any text is visible. cadence_begin is a short
      // static cue (1.313s) and gets no ceremonial pacing (Part 4). The
      // CTA is a SEPARATE fade that only resolves once this line has
      // settled, rather than popping in together with it as one unit
      // (Part 9).
      finalWrapEl.style.display = 'flex';
      if (!introSkipped) {
        logCadenceTiming('text transition start', { id: CADENCE_DIALOGUE.begin.id, text: CADENCE_DIALOGUE.begin.text });
        finalLineEl.style.setProperty('--cadence-fade-in', ENTRY_FADE_IN_MS + 'ms');
        void finalLineEl.offsetWidth;
        finalLineEl.classList.add('is-visible');
        setSpeakingIntensity(0.22);
        if (!introInstantMode) await sleep(ENTRY_AUDIO_LEAD_MS);
        if (!introSkipped) {
          try {
            await playCue(CADENCE_DIALOGUE.begin.cue, setSpeakingIntensity, CADENCE_DIALOGUE.begin.id);
          } catch (e) {
            console.warn('[Cadence audio] cadence_begin playback failed -- continuing visually:', e);
          }
        }
        setSpeakingIntensity(0);
        if (!introInstantMode) await sleep(THOUGHT_LANDING_MS); // "Let's begin." lands before the CTA fades in, ordinary
      }
      if (introSkipped) return;

      requestAnimationFrame(function () { enterCourseBtnEl.classList.add('show'); });

      fire('onComplete', context);
    }

    // ── Leaving the intro ────────────────────────────────────────────
    function hide() {
      root.style.display = 'none';
      skipBtnEl.style.display = 'none';
    }

    // The whole environment fades softly away (same #introScreen.fade-out
    // rule the entry fade-in uses, see the CSS) before the host's own
    // callback runs -- no hard visual cut into the course.
    async function enterCourse() {
      audioEngine.stopAll();
      root.classList.add('fade-out');
      skipBtnEl.style.display = 'none';
      showFullBtnEl.style.display = 'none';
      await sleep(introInstantMode ? 0 : 1450);
      hide();
      fire('onEnterCourse', lastContext);
    }

    function skip() {
      introSkipped = true;
      audioEngine.stopAll();
      root.classList.add('fade-out');
      skipBtnEl.style.display = 'none';
      showFullBtnEl.style.display = 'none';
      setTimeout(function () {
        hide();
        fire('onSkip', null);
      }, introInstantMode ? 0 : 1450);
    }

    // ── Composer helpers ─────────────────────────────────────────────
    function grow() {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + 'px';
    }

    function handleComposerKey(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComposer(); }
    }

    // Self-contained voice input (Web Speech API) -- a private copy, not
    // a dependency on any host page's own voice-input helper, so this
    // component works standalone. Purely additive: typing always works
    // without it, and it never blocks submission if unsupported/denied.
    function startVoiceInput() {
      var SpeechRecognition = global.SpeechRecognition || global.webkitSpeechRecognition;
      var btn = $('voiceBtn');
      if (!SpeechRecognition) {
        alert('Voice input is not supported in this browser. Try Chrome or Safari.');
        return;
      }
      if (voiceRecognition) {
        voiceRecognition.stop();
        voiceRecognition = null;
        btn.classList.remove('listening');
        return;
      }
      voiceRecognition = new SpeechRecognition();
      voiceRecognition.continuous = true;
      voiceRecognition.interimResults = true;
      voiceRecognition.lang = 'en-US';
      btn.classList.add('listening');
      var existingText = inputEl.value;

      voiceRecognition.onresult = function (e) {
        var interim = '';
        var final = '';
        for (var i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript;
          else interim += e.results[i][0].transcript;
        }
        inputEl.value = existingText + (existingText && final ? ' ' : '') + final + interim;
        grow();
      };
      voiceRecognition.onerror = function (e) {
        btn.classList.remove('listening');
        voiceRecognition = null;
        if (e.error === 'not-allowed' || e.error === 'permission-denied') {
          if (!inputEl.value) {
            inputEl.placeholder = 'Microphone access is blocked — tap the camera/mic icon in your browser address bar to allow it, then try again.';
            setTimeout(function () { inputEl.placeholder = inputEl.getAttribute('data-placeholder') || 'Type your response…'; }, 6000);
          }
        } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('Voice error:', e.error);
        }
      };
      voiceRecognition.onend = function () {
        btn.classList.remove('listening');
        voiceRecognition = null;
        inputEl.focus();
      };
      voiceRecognition.start();
    }

    // ── Wire events (was inline onclick/oninput/onkeydown in the host
    // page's old static markup; equivalent behavior via addEventListener
    // now that this markup is injected rather than hand-authored HTML) ──
    $('beginGateBtn').addEventListener('click', beginCadenceIntro);
    showFullBtnEl.addEventListener('click', showFullIntro);
    skipBtnEl.addEventListener('click', skip);
    sendBtnEl.addEventListener('click', submitComposer);
    inputEl.addEventListener('input', grow);
    inputEl.addEventListener('keydown', handleComposerKey);
    $('voiceBtn').addEventListener('click', startVoiceInput);
    choiceWrapEl.querySelectorAll('.intro-choice').forEach(function (btn) {
      btn.addEventListener('click', function () { chooseStage(btn.getAttribute('data-choice'), btn); });
    });
    enterCourseBtnEl.addEventListener('click', enterCourse);

    root.style.display = 'flex';
    skipBtnEl.style.display = 'block';
    showGate();
    // The whole near-black environment gently settles onto the screen
    // rather than snapping to visible.
    if (introInstantMode) {
      root.classList.add('is-visible');
    } else {
      requestAnimationFrame(function () { root.classList.add('is-visible'); });
    }

    return {
      destroy: function () { audioEngine.dispose(); root.remove(); },
      setSpeakingIntensity: setSpeakingIntensity
    };
  }

  global.AimtCadenceIntro = { mount: mount, dialogue: CADENCE_DIALOGUE, normalizeForSpeech: normalizeForSpeech };
})(window);
