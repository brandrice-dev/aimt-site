// AIMT Listen Mode — manifest primitive.
//
// A reusable, course/module-agnostic data shape for Cadence Listen Mode
// narration. This file holds ONLY data (chunk manifests) plus small pure
// helper functions for reading/validating that data — no DOM, no audio
// playback, no course-state mutation. The player primitive
// (assets/js/aimt-listen-mode-player.js) reads from here; nothing writes
// back into it at runtime.
//
// Shape: window.AIMTListenModeData.manifests[courseSlug][moduleId] = [chunk, ...]
//
// Each chunk (see CHUNK_FIELDS below for the full contract):
//   courseSlug        string   — e.g. 'headspa-mastery'
//   moduleId          number   — e.g. 1
//   chunkId           string   — e.g. 'm1-01' (matches the script doc's chunk IDs)
//   title             string   — internal/editorial label, not shown to students verbatim
//   studentLabel      string   — the ONLY text the player's title row ever shows a
//                                student. Real orientation ("Module 1 · Section 1.3 —
//                                Observation vs. diagnosis"), never an internal chunk
//                                id/count ("Chunk 4 of 14") — those stay engineering-only.
//   sourceSection     string   — which on-screen section this chunk narrates
//   audioSrc          string   — stable, versionable asset path (see Section 5 of the
//                                Module 1 pilot task: assets/audio/listen/<course>/<module>/<chunkId>.mp3)
//   visualTarget      string|null — DOM element id to bring into view while this chunk plays
//   checkpointId      string|null — the course checkpoint this chunk is gated by/reports on
//   gateType          'normal' | 'checkpoint-stop' | 'post-pass' | 'interaction-stop'
//                        normal          — plays and advances automatically
//                        checkpoint-stop — after this chunk finishes, the player halts and
//                                          waits; it does NOT auto-advance. The checkpoint
//                                          itself (existing course UI) remains the only way
//                                          to actually pass it.
//                        post-pass       — this chunk may only play once `checkpointId` has
//                                          an authoritative PASS in course state.
//                        interaction-stop — the never-reveal-before-the-student-acts gate for
//                                          UNGRADED, no-APP_STATE-write interactive scenarios
//                                          (the m5Decide/m8Protect/m9Cwp/m10RupSelect-family
//                                          single-select-with-per-option-feedback pattern
//                                          already used across modules). This chunk narrates
//                                          the prompt and the option labels ONLY — never any
//                                          option's rationale/feedback. After it finishes, the
//                                          player halts and polls the DOM (read-only — see
//                                          `interactionId`/`interactionOptionsSelector` below),
//                                          the same way checkpoint-stop polls course state. See
//                                          Section I of docs/course-audit/listen-mode/
//                                          00-listen-mode-editorial-standard.md.
//   interactionId     string|null — required when gateType is 'interaction-stop'. The id of the
//                                DOM container scoping this interaction's option buttons (e.g.
//                                'm8Protect1'), resolved the same duplicate-id-safe way
//                                visualTarget is (scoped under .lesson-wrap).
//   interactionOptionsSelector string|null — CSS selector, scoped inside `interactionId`, for the
//                                option buttons (defaults to '.bq-opt', the existing sitewide
//                                convention). Each matched option must carry `aria-pressed` and
//                                a `data-choice` index — both already true of every existing
//                                m5Decide/m8Protect/m9Cwp/m10RupSelect-style interaction; Listen
//                                Mode only ever reads these attributes, never sets them.
//   interactionFeedback array|null — required when gateType is 'interaction-stop'. One entry per
//                                option: { optionIndex, chunkId, studentLabel, audioSrc,
//                                duration, version, qaStatus }. The player plays exactly the one
//                                entry whose optionIndex matches whichever option the student
//                                actually selected, then resumes the main narration — the other
//                                entries are never played. Each entry is audio-QA-tracked exactly
//                                like a top-level chunk (see isProductionReady below).
//   resumeAfterPass   boolean  — if true, this chunk should not auto-play the instant a pass
//                                is detected; the player should surface a "Continue Listening"
//                                affordance instead (avoids surprising/auto-blasted audio and
//                                respects browser autoplay restrictions).
//   duration          number|null — seconds, once real audio exists; null until measured.
//   version           number   — bump only when a chunk's audio must be regenerated.
//   qaStatus          'NOT_GENERATED' | 'GENERATED' | 'APPROVED' | 'REGENERATE'
//                        Audio QA status (Section 18 of the Module 1 pilot task).
//                        Generated is NOT the same as approved — the player treats only
//                        'APPROVED' chunks as eligible for production playback (Section 17/21:
//                        Listen Mode must never present as available until every required
//                        chunk for that module is APPROVED).
//
// Adding a new module or course: append another array under
// manifests[courseSlug][moduleId]. Nothing else in this file needs to change —
// this is the intentional "same primitive for Modules 0-12 and future
// courses" shape called out in the Module 1 pilot task (Section 3).

(function (root) {
  'use strict';

  var CHUNK_FIELDS = [
    'courseSlug', 'moduleId', 'chunkId', 'title', 'studentLabel', 'sourceSection', 'audioSrc',
    'visualTarget', 'checkpointId', 'gateType', 'resumeAfterPass', 'duration',
    'version', 'qaStatus', 'transitionGapMs',
    'interactionId', 'interactionOptionsSelector', 'interactionFeedback'
  ];

  var GATE_TYPES = ['normal', 'checkpoint-stop', 'post-pass', 'interaction-stop'];
  var QA_STATUSES = ['NOT_GENERATED', 'GENERATED', 'APPROVED', 'REGENERATE'];

  function audioPath(courseSlug, moduleId, chunkId) {
    var mod = String(moduleId).length < 2 ? '0' + moduleId : String(moduleId);
    return 'assets/audio/listen/' + courseSlug + '/module-' + mod + '/' + chunkId + '.mp3';
  }

  function chunk(fields) {
    var c = {
      courseSlug: fields.courseSlug,
      moduleId: fields.moduleId,
      chunkId: fields.chunkId,
      title: fields.title,
      studentLabel: fields.studentLabel || fields.title,
      sourceSection: fields.sourceSection,
      audioSrc: fields.audioSrc || audioPath(fields.courseSlug, fields.moduleId, fields.chunkId),
      visualTarget: fields.visualTarget || null,
      checkpointId: fields.checkpointId || null,
      gateType: fields.gateType || 'normal',
      interactionId: fields.interactionId || null,
      interactionOptionsSelector: fields.interactionOptionsSelector || null,
      interactionFeedback: Array.isArray(fields.interactionFeedback) ? fields.interactionFeedback : null,
      resumeAfterPass: !!fields.resumeAfterPass,
      duration: typeof fields.duration === 'number' ? fields.duration : null,
      version: typeof fields.version === 'number' ? fields.version : 1,
      qaStatus: fields.qaStatus || 'NOT_GENERATED',
      // Extra silence (ms) the player inserts before autoplaying THIS chunk
      // when it's reached via automatic advance from the chunk immediately
      // before it — i.e. this is a section-opening chunk and the previous
      // chunk's audio just ended. Only set on true numbered-section-start
      // chunks (never checkpoints, practice, or recap — those have their
      // own semantically appropriate timing and use 0/unset). Computed as
      // (locked ~4s target) minus the real trailing+leading silence already
      // present in the canonical audio at that boundary (measured via
      // ffmpeg silencedetect against the actual installed mp3s — see
      // docs/course-audit/listen-mode/module-01-section-gap-measurements.md),
      // never a blind flat 4000. Manual navigation (Start Over, Continue
      // Listening, seek, back/forward) never applies this delay.
      transitionGapMs: typeof fields.transitionGapMs === 'number' ? fields.transitionGapMs : 0
    };
    return c;
  }

  // ── HeadSpa Mastery — Module 1 ──
  // Source of truth for wording: docs/course-audit/listen-mode/module-01-listen-script-draft.md (v5).
  // Pass 2B install: all 14 chunks now point at the continuous-recording-
  // session master (Section 11 architecture) — two full-length Jane/eleven_v3
  // performances (Session A: opening through checkpoint 1's prompt; Session
  // B: post-pass-1 through checkpoint 2's prompt, recap, and handoff), each
  // CapCut-finished (locked preset — see
  // docs/course-audit/listen-mode/module-01-production-standard-LOCKED.md)
  // then cut into these 14 player segments at the owner-approved natural cut
  // map (docs/course-audit/listen-mode/module-01-listen-script-draft.md
  // "Player cut map", cross-verified against real silence-detection on the
  // installed audio — see
  // docs/course-audit/listen-mode/module-01-pass2-raw-sessions-v2-production-log.md).
  // `version: 2` marks every chunk whose audio changed in this pass (v1 was
  // the earlier per-chunk-generation pilot).
  //
  // qaStatus: APPROVED — owner listen-through complete, contingent on two
  // final fixes (section-transition breathing room, full section sync),
  // both implemented and live-QA-verified this pass (see
  // module-01-section-gap-measurements.md). Module 1 is now the frozen
  // AIMT Listen Mode reference implementation — see
  // module-01-reference-implementation-FROZEN.md. isProductionReady() is
  // now true; the player will present Listen Mode to real students.
  var HEADSPA_MODULE_1 = [
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-01',
      title: 'Module Briefing (spoken)', studentLabel: 'Module 1 · Opening',
      sourceSection: 'Module Briefing',
      visualTarget: 'm1WrittenBriefing',
      duration: 78.74, version: 2, qaStatus: 'APPROVED'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-02',
      title: '1.1 What is a head spa?', studentLabel: 'Module 1 · Section 1.1 — What is a head spa?',
      sourceSection: '1.1',
      visualTarget: 'm1VisualWhatIsHeadSpa',
      // Measured: m1-01 trailing 0.345s + m1-02 leading 0.345s = 0.690s
      // natural gap already present. Target 3.6s (not the full 4.0s — the
      // owner's live review found this specific transition already reads
      // as a good pause, "perhaps slightly longer than necessary," so this
      // is nudged to the low end of the locked 3.5-4.5s range rather than
      // the 4.0s used elsewhere).
      transitionGapMs: 2910,
      duration: 87.32, version: 2, qaStatus: 'APPROVED'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-03',
      title: '1.2 What is a head spa technician?', studentLabel: 'Module 1 · Section 1.2 — What is a head spa technician?',
      sourceSection: '1.2',
      visualTarget: 'm1VisualWhatIsTechnician',
      // Measured: m1-02 trailing 0.319s + m1-03 leading 0.319s = 0.638s. Target 4.0s.
      transitionGapMs: 3362,
      duration: 98.00, version: 2, qaStatus: 'APPROVED'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-04',
      title: '1.3 Observation vs. diagnosis', studentLabel: 'Module 1 · Section 1.3 — Observation vs. diagnosis',
      sourceSection: '1.3',
      visualTarget: 'm1VisualScopeLanguage',
      // Measured: m1-03 trailing 0.406s + m1-04 leading 0.406s = 0.812s. Target 4.0s.
      transitionGapMs: 3188,
      duration: 178.85, version: 2, qaStatus: 'APPROVED'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-05',
      title: '1.4 Scope of practice', studentLabel: 'Module 1 · Section 1.4 — Scope of practice',
      sourceSection: '1.4',
      visualTarget: 'm1VisualScopeCards',
      // Measured: m1-04 trailing 0.655s + m1-05 leading 0.649s = 1.304s. Target 4.0s.
      transitionGapMs: 2696,
      duration: 93.88, version: 2, qaStatus: 'APPROVED'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-06',
      title: 'Practice interaction — "Where is the line?"', studentLabel: 'Module 1 · Practice — Where is the line?',
      sourceSection: 'Practice interaction',
      visualTarget: 'm1LineInteraction',
      duration: 136.69, version: 2, qaStatus: 'APPROVED'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-07',
      title: 'Checkpoint 1 — m1cp1', studentLabel: 'Module 1 · Checkpoint 1 — Apply the boundary',
      sourceSection: '#m1cp1',
      visualTarget: 'm1cp1', checkpointId: 'm1cp1', gateType: 'checkpoint-stop',
      duration: 34.55, version: 2, qaStatus: 'APPROVED'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-08',
      title: 'Post-pass continuation (m1cp1)', studentLabel: 'Module 1 · Continuing',
      sourceSection: '1.5 transition',
      checkpointId: 'm1cp1', gateType: 'post-pass', resumeAfterPass: true,
      duration: 27.19, version: 2, qaStatus: 'APPROVED'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-09',
      title: '1.5 Limitations of a head spa service', studentLabel: 'Module 1 · Section 1.5 — Limitations of a head spa service',
      sourceSection: '1.5',
      visualTarget: 'm1VisualLimitations',
      // Measured: m1-08 trailing 0.524s + m1-09 leading 0.518s = 1.042s. Target 4.0s.
      transitionGapMs: 2958,
      duration: 74.74, version: 2, qaStatus: 'APPROVED'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-10',
      title: '1.6 Licensing', studentLabel: 'Module 1 · Section 1.6 — Licensing',
      sourceSection: '1.6',
      visualTarget: 'm1VisualLicensing',
      // Measured: m1-09 trailing 1.117s + m1-10 leading 1.117s = 2.234s. Target 4.0s.
      transitionGapMs: 1766,
      duration: 51.55, version: 2, qaStatus: 'APPROVED'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-11',
      title: '1.7 Practitioner insight', studentLabel: 'Module 1 · Section 1.7 — Practitioner insight',
      sourceSection: '1.7',
      visualTarget: 'm1VisualPractitionerInsight',
      // Measured: m1-10 trailing 0.971s + m1-11 leading 0.971s = 1.942s. Target 4.0s.
      transitionGapMs: 2058,
      duration: 76.99, version: 2, qaStatus: 'APPROVED'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-12',
      title: '1.8 Mistakes new practitioners make', studentLabel: 'Module 1 · Section 1.8 — Mistakes new practitioners make',
      sourceSection: '1.8',
      visualTarget: 'm1VisualMistakes',
      // Measured: m1-11 trailing 0.901s + m1-12 leading 0.901s = 1.802s. Target 4.0s.
      transitionGapMs: 2198,
      duration: 89.26, version: 2, qaStatus: 'APPROVED'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-13',
      title: 'Checkpoint 2 — m1cp2', studentLabel: 'Module 1 · Checkpoint 2 — Demonstrate the role',
      sourceSection: '#m1cp2',
      visualTarget: 'm1cp2', checkpointId: 'm1cp2', gateType: 'checkpoint-stop',
      duration: 32.96, version: 2, qaStatus: 'APPROVED'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-14',
      title: 'Post-pass continuation (m1cp2) + completion + recap + handoff',
      studentLabel: 'Module 1 · Recap',
      sourceSection: 'completion card', visualTarget: 'm1Complete',
      checkpointId: 'm1cp2', gateType: 'post-pass', resumeAfterPass: true,
      duration: 72.86, version: 2, qaStatus: 'APPROVED'
    })
  ];

  // ── HeadSpa Mastery — Module 4 ──
  // Source of truth: docs/course-audit/listen-mode/tts-final/module-04/*.txt
  // (v6-strict-fidelity, owner-approved). Installed this pass by cutting the
  // owner's CapCut-processed batch masters (AIMT-Listen-Mode-Final/04-Module-4/
  // M4-BATCH-*-PROCESSED.WAV) at position-anchored, silence-snapped chunk
  // boundaries (scripts/aimt-listen-install-module.mjs), matching the method
  // in module-01-section-gap-measurements.md. transitionGapMs follows the
  // same rule as Module 1: target ~4.0s at true numbered-section-start
  // chunks reached via normal auto-advance, minus the real leading/trailing
  // silence already present in the installed mp3s; 0/unset on checkpoints,
  // practice/bridge chunks, and manual "Continue Listening" post-pass
  // entries. New id anchors (m4Visual*, m4WrittenBriefing) were added to the
  // corresponding .sec-eyebrow/.mo-section lines in headspa-mastery.html for
  // scroll-sync (additive only, no content changed). qaStatus: APPROVED —
  // owner-approved per docs/AIMT-MASTER-LAUNCH-CHECKLIST.md.
  var HEADSPA_MODULE_4 = [
    chunk({ courseSlug: 'headspa-mastery', moduleId: 4, chunkId: 'm4-01', title: 'Module Briefing (spoken)', studentLabel: 'Module 4 · Opening', sourceSection: 'Module Briefing (spoken)', visualTarget: 'm4WrittenBriefing', duration: 66.72, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 4, chunkId: 'm4-02', title: '4.1 The role of magnification', studentLabel: 'Module 4 · Section 4.1 — The role of magnification', sourceSection: '4.1 The role of magnification', visualTarget: 'm4VisualRoleOfMagnification', transitionGapMs: 2023, duration: 71.31, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 4, chunkId: 'm4-03', title: '4.2 Presenting the assessment', studentLabel: 'Module 4 · Section 4.2 — Presenting the assessment', sourceSection: '4.2 Presenting the assessment', visualTarget: 'm4VisualPresentingAssessment', transitionGapMs: 3379, duration: 94.01, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 4, chunkId: 'm4-04', title: '4.3 Image integrity', studentLabel: 'Module 4 · Section 4.3 — Image integrity', sourceSection: '4.3 Image integrity', visualTarget: 'm4VisualImageIntegrity', transitionGapMs: 4000, duration: 118.47, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 4, chunkId: 'm4-05', title: '4.4 The five-point scalp scan', studentLabel: 'Module 4 · Section 4.4 — The five-point scalp scan', sourceSection: '4.4 The five-point scalp scan', visualTarget: 'm4VisualFivePointScan', transitionGapMs: 2393, duration: 150.36, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 4, chunkId: 'm4-06', title: '4.5 The five observation lenses', studentLabel: 'Module 4 · Section 4.5 — The five observation lenses', sourceSection: '4.5 The five observation lenses', visualTarget: 'm4VisualObservationLenses', transitionGapMs: 2850, duration: 144.88, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 4, chunkId: 'm4-07', title: 'Observation discipline (classification practice, ungraded)', studentLabel: 'Module 4 · Practice — Observation discipline', sourceSection: 'Observation discipline (classification practice, ungraded)', visualTarget: 'm4VisualObservationDiscipline', duration: 125.91, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 4, chunkId: 'm4-08', title: 'Checkpoint 1 — m4cp1', studentLabel: 'Module 4 · Checkpoint 1', sourceSection: 'Checkpoint 1 — m4cp1', visualTarget: 'm4cp1', checkpointId: 'm4cp1', gateType: 'checkpoint-stop', duration: 38.16, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 4, chunkId: 'm4-09', title: 'Post-pass continuation (m4cp1)', studentLabel: 'Module 4 · Continuing', sourceSection: 'Post-pass continuation (m4cp1)', checkpointId: 'm4cp1', gateType: 'post-pass', resumeAfterPass: true, duration: 19.72, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 4, chunkId: 'm4-10', title: '4.6 Appearance examples', studentLabel: 'Module 4 · Section 4.6 — Appearance examples', sourceSection: '4.6 Appearance examples', visualTarget: 'm4VisualAppearanceExamples', transitionGapMs: 2074, duration: 319.79, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 4, chunkId: 'm4-11', title: 'Similar image, different possible story', studentLabel: 'Module 4 · Similar image, different possible story', sourceSection: 'Similar image, different possible story', visualTarget: 'm4VisualSimilarImage', duration: 71.58, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 4, chunkId: 'm4-12', title: '4.7 From image to decision', studentLabel: 'Module 4 · Section 4.7 — From image to decision', sourceSection: '4.7 From image to decision', visualTarget: 'm4VisualImageToDecision', transitionGapMs: 2810, duration: 115.59, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 4, chunkId: 'm4-13', title: '4.8 When not to proceed', studentLabel: 'Module 4 · Section 4.8 — When not to proceed', sourceSection: '4.8 When not to proceed', visualTarget: 'm4VisualWhenNotToProceed', transitionGapMs: 2359, duration: 136.72, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 4, chunkId: 'm4-14', title: '4.9 Practitioner insight', studentLabel: 'Module 4 · Section 4.9 — Practitioner insight', sourceSection: '4.9 Practitioner insight', visualTarget: 'm4VisualPractitionerInsight', transitionGapMs: 4000, duration: 98.98, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 4, chunkId: 'm4-15', title: '4.10 Common mistakes', studentLabel: 'Module 4 · Section 4.10 — Common mistakes', sourceSection: '4.10 Common mistakes', visualTarget: 'm4VisualCommonMistakes', transitionGapMs: 2592, duration: 93.31, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 4, chunkId: 'm4-16', title: 'Checkpoint 2 — m4cp2', studentLabel: 'Module 4 · Checkpoint 2', sourceSection: 'Checkpoint 2 — m4cp2', visualTarget: 'm4cp2', checkpointId: 'm4cp2', gateType: 'checkpoint-stop', duration: 29.36, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 4, chunkId: 'm4-17', title: 'Post-pass continuation (m4cp2) + completion + Module 5 handoff', studentLabel: 'Module 4 · Recap', sourceSection: 'Post-pass continuation (m4cp2) + completion + Module 5 handoff', visualTarget: 'm4Complete', checkpointId: 'm4cp2', gateType: 'post-pass', resumeAfterPass: true, duration: 49.19, version: 1, qaStatus: 'APPROVED' })
  ];

  // ── HeadSpa Mastery — Module 5 ──
  // Source of truth: docs/course-audit/listen-mode/tts-final/module-05/*.txt
  // (v2-strict-fidelity, owner-approved). Same install method as Module 4
  // above (see that block's comment). m5-09 is a genuine 29-character
  // transition line ("Good work — let's keep going."), so its ~2.25s
  // duration is correct, not a mis-cut. qaStatus: APPROVED.
  var HEADSPA_MODULE_5 = [
    chunk({ courseSlug: 'headspa-mastery', moduleId: 5, chunkId: 'm5-01', title: 'Module Briefing (spoken)', studentLabel: 'Module 5 · Opening', sourceSection: 'Module Briefing (spoken)', visualTarget: 'm5WrittenBriefing', duration: 62.38, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 5, chunkId: 'm5-02', title: '5.1 From evidence to action', studentLabel: 'Module 5 · Section 5.1 — From evidence to action', sourceSection: '5.1 From evidence to action', visualTarget: 'm5VisualEvidenceToAction', transitionGapMs: 2596, duration: 91.32, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 5, chunkId: 'm5-03', title: '5.2 What you can actually change', studentLabel: 'Module 5 · Section 5.2 — What you can actually change', sourceSection: '5.2 What you can actually change', visualTarget: 'm5VisualWhatYouCanChange', transitionGapMs: 4000, duration: 123.90, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 5, chunkId: 'm5-04', title: '5.3 Priority order + Cadence note', studentLabel: 'Module 5 · Section 5.3 — Priority order', sourceSection: '5.3 Priority order + Cadence note', visualTarget: 'm5VisualPriorityOrder', transitionGapMs: 3063, duration: 108.38, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 5, chunkId: 'm5-05', title: '5.4 Patterns, not permanent types', studentLabel: 'Module 5 · Section 5.4 — Patterns, not permanent types', sourceSection: '5.4 Patterns, not permanent types', visualTarget: 'm5VisualPatterns', transitionGapMs: 3766, duration: 368.88, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 5, chunkId: 'm5-06', title: 'Signature interaction: What changes first?', studentLabel: 'Module 5 · Signature interaction — What changes first?', sourceSection: 'Signature interaction: What changes first?', visualTarget: 'm5VisualSignatureWhatChanges', duration: 320.39, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 5, chunkId: 'm5-07', title: '5.5 One appointment, more than one approach', studentLabel: 'Module 5 · Section 5.5 — One appointment, more than one approach', sourceSection: '5.5 One appointment, more than one approach', visualTarget: 'm5VisualOneAppointment', transitionGapMs: 4000, duration: 125.99, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 5, chunkId: 'm5-08', title: 'Checkpoint 1 — m5cp1', studentLabel: 'Module 5 · Checkpoint 1', sourceSection: 'Checkpoint 1 — m5cp1', visualTarget: 'm5cp1', checkpointId: 'm5cp1', gateType: 'checkpoint-stop', duration: 27.90, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 5, chunkId: 'm5-09', title: 'Post-pass transition (m5cp1)', studentLabel: 'Module 5 · Continuing', sourceSection: 'Post-pass transition (m5cp1)', checkpointId: 'm5cp1', gateType: 'post-pass', resumeAfterPass: true, duration: 2.25, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 5, chunkId: 'm5-10', title: '5.6 Choose a function, not a fantasy', studentLabel: 'Module 5 · Section 5.6 — Choose a function, not a fantasy', sourceSection: '5.6 Choose a function, not a fantasy', visualTarget: 'm5VisualChooseFunction', transitionGapMs: 2772, duration: 114.86, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 5, chunkId: 'm5-11', title: '5.7 Intensity is part of the protocol', studentLabel: 'Module 5 · Section 5.7 — Intensity is part of the protocol', sourceSection: '5.7 Intensity is part of the protocol', visualTarget: 'm5VisualIntensity', transitionGapMs: 4000, duration: 93.57, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 5, chunkId: 'm5-12', title: '5.8 Client communication + Cadence note', studentLabel: 'Module 5 · Section 5.8 — Client communication', sourceSection: '5.8 Client communication + Cadence note', visualTarget: 'm5VisualClientCommunication', transitionGapMs: 3497, duration: 124.06, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 5, chunkId: 'm5-13', title: '5.9 Errors that make protocols less intelligent', studentLabel: 'Module 5 · Section 5.9 — Errors that make protocols less intelligent', sourceSection: '5.9 Errors that make protocols less intelligent', visualTarget: 'm5VisualErrors', transitionGapMs: 4000, duration: 185.76, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 5, chunkId: 'm5-14', title: 'Checkpoint 2 — m5cp2', studentLabel: 'Module 5 · Checkpoint 2', sourceSection: 'Checkpoint 2 — m5cp2', visualTarget: 'm5cp2', checkpointId: 'm5cp2', gateType: 'checkpoint-stop', duration: 21.63, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 5, chunkId: 'm5-15', title: 'Post-pass: completion + recap + handoff', studentLabel: 'Module 5 · Recap', sourceSection: 'Post-pass: completion + recap + handoff', visualTarget: 'm5Complete', checkpointId: 'm5cp2', gateType: 'post-pass', resumeAfterPass: true, duration: 39.03, version: 1, qaStatus: 'APPROVED' })
  ];

  // ── HeadSpa Mastery — Module 6 ──
  // Source of truth: docs/course-audit/listen-mode/tts-final/module-06/*.txt
  // (v2-strict-fidelity, owner-approved, includes the approved §6.4
  // final-reasoning-card visual move -- narration/audio unaffected by that
  // move). Same install method as Module 4 above. m6-02 covers both 6.1 and
  // 6.2 in one continuous chunk (matches the live page's own chunk
  // boundary), so its visualTarget anchors on 6.1's heading. qaStatus: APPROVED.
  var HEADSPA_MODULE_6 = [
    chunk({ courseSlug: 'headspa-mastery', moduleId: 6, chunkId: 'm6-01', title: 'Module Briefing (spoken)', studentLabel: 'Module 6 · Opening', sourceSection: 'Module Briefing (spoken)', visualTarget: 'm6WrittenBriefing', duration: 62.88, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 6, chunkId: 'm6-02', title: '6.1 Your role here + 6.2 What you can and cannot conclude', studentLabel: 'Module 6 · Section 6.1 — Your role here', sourceSection: '6.1 Your role here + 6.2 What you can and cannot conclude', visualTarget: 'm6VisualYourRole', transitionGapMs: 3286, duration: 128.68, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 6, chunkId: 'm6-03', title: '6.3 The most important distinction in scalp care', studentLabel: 'Module 6 · Section 6.3 — The most important distinction in scalp care', sourceSection: '6.3 The most important distinction in scalp care', visualTarget: 'm6VisualImportantDistinction', transitionGapMs: 4000, duration: 173.69, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 6, chunkId: 'm6-04', title: '6.4 The cycle worth understanding', studentLabel: 'Module 6 · Section 6.4 — The cycle worth understanding', sourceSection: '6.4 The cycle worth understanding', visualTarget: 'm6VisualCycle', transitionGapMs: 4000, duration: 164.39, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 6, chunkId: 'm6-05', title: 'Real-time scenarios + Final reasoning', studentLabel: 'Module 6 · Real-time scenarios', sourceSection: 'Real-time scenarios + Final reasoning', visualTarget: 'm6VisualScenarios', duration: 193.70, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 6, chunkId: 'm6-06', title: 'Checkpoint 1 — m6cp1', studentLabel: 'Module 6 · Checkpoint 1', sourceSection: 'Checkpoint 1 — m6cp1', visualTarget: 'm6cp1', checkpointId: 'm6cp1', gateType: 'checkpoint-stop', duration: 23.33, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 6, chunkId: 'm6-07', title: 'Post-pass transition (m6cp1)', studentLabel: 'Module 6 · Continuing', sourceSection: 'Post-pass transition (m6cp1)', checkpointId: 'm6cp1', gateType: 'post-pass', resumeAfterPass: true, duration: 2.51, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 6, chunkId: 'm6-08', title: '6.5 Malassezia to seborrheic dermatitis: one spectrum', studentLabel: 'Module 6 · Section 6.5 — Malassezia to seborrheic dermatitis', sourceSection: '6.5 Malassezia to seborrheic dermatitis: one spectrum', visualTarget: 'm6VisualSpectrum', transitionGapMs: 2869, duration: 115.91, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 6, chunkId: 'm6-09', title: '6.6 When to pause or refer', studentLabel: 'Module 6 · Section 6.6 — When to pause or refer', sourceSection: '6.6 When to pause or refer', visualTarget: 'm6VisualPauseOrRefer', transitionGapMs: 4000, duration: 72.25, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 6, chunkId: 'm6-10', title: 'Signature interaction: Sort three presentations', studentLabel: 'Module 6 · Signature interaction — Sort three presentations', sourceSection: 'Signature interaction: Sort three presentations', visualTarget: 'm6VisualSignatureSort', duration: 229.33, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 6, chunkId: 'm6-11', title: '6.7 Treatment within scope', studentLabel: 'Module 6 · Section 6.7 — Treatment within scope', sourceSection: '6.7 Treatment within scope', visualTarget: 'm6VisualTreatmentScope', transitionGapMs: 3795, duration: 89.36, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 6, chunkId: 'm6-12', title: '6.8 What makes it worse', studentLabel: 'Module 6 · Section 6.8 — What makes it worse', sourceSection: '6.8 What makes it worse', visualTarget: 'm6VisualWhatMakesWorse', transitionGapMs: 3699, duration: 167.65, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 6, chunkId: 'm6-13', title: 'Checkpoint 2 — m6cp2', studentLabel: 'Module 6 · Checkpoint 2', sourceSection: 'Checkpoint 2 — m6cp2', visualTarget: 'm6cp2', checkpointId: 'm6cp2', gateType: 'checkpoint-stop', duration: 22.78, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 6, chunkId: 'm6-14', title: 'Post-pass: completion + recap + handoff', studentLabel: 'Module 6 · Recap', sourceSection: 'Post-pass: completion + recap + handoff', visualTarget: 'm6Complete', checkpointId: 'm6cp2', gateType: 'post-pass', resumeAfterPass: true, duration: 30.90, version: 1, qaStatus: 'APPROVED' })
  ];

  // ── HeadSpa Mastery — Module 0 (v2, strict-fidelity) ──
  // Source of truth: docs/course-audit/listen-mode/module-00-listen-script.md
  // (v2) + docs/course-audit/listen-mode/tts-final/module-00-v2/*.txt.
  // Audio: owner-approved PROCESSED WAV masters at
  // AIMT-Listen-Mode-Final/00-Welcome-v2-staging/M0-BATCH-*-PROCESSED.WAV,
  // cut into these 15 player chunks via scripts/aimt-listen-install-module.mjs
  // (silence-snapped boundaries, zero STOPs -- course-audit-build launch-
  // integration pass). The old AIMT-Listen-Mode-Final/00-Welcome/ (v1) audio
  // was never used here. qaStatus: APPROVED (derived directly from the
  // owner's own CapCut-processed masters, per the same convention every
  // other APPROVED module in this file already uses).
  var HEADSPA_MODULE_0 = [
    chunk({ courseSlug: 'headspa-mastery', moduleId: 0, chunkId: 'm0-01', title: 'Module Briefing (spoken)', studentLabel: 'Module 0 · Module Briefing (spoken)', sourceSection: 'Module Briefing (spoken)', duration: 70.49, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 0, chunkId: 'm0-02', title: '0.1 Welcome', studentLabel: 'Module 0 · 0.1 Welcome', sourceSection: '0.1 Welcome', duration: 82.69, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 0, chunkId: 'm0-03', title: '0.2 What this course is', studentLabel: 'Module 0 · 0.2 What this course is', sourceSection: '0.2 What this course is', duration: 92.28, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 0, chunkId: 'm0-04', title: '0.3 Who this is for', studentLabel: 'Module 0 · 0.3 Who this is for', sourceSection: '0.3 Who this is for', duration: 35.59, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 0, chunkId: 'm0-05', title: '0.4 What you\'ll learn', studentLabel: 'Module 0 · 0.4 What you\'ll learn', sourceSection: '0.4 What you\'ll learn', duration: 51.97, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 0, chunkId: 'm0-06', title: '0.5 How to use this course', studentLabel: 'Module 0 · 0.5 How to use this course', sourceSection: '0.5 How to use this course', duration: 71.3, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 0, chunkId: 'm0-07', title: 'Practice interaction: "Same steps. Different service."', studentLabel: 'Module 0 · Practice interaction: "Same steps. Different service."', sourceSection: 'Practice interaction: "Same steps. Different service."', duration: 54.18, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 0, chunkId: 'm0-08', title: '0.6 The standard', studentLabel: 'Module 0 · 0.6 The standard', sourceSection: '0.6 The standard', duration: 116.22, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 0, chunkId: 'm0-09', title: '0.7 What makes a great technician', studentLabel: 'Module 0 · 0.7 What makes a great technician', sourceSection: '0.7 What makes a great technician', duration: 92.34, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 0, chunkId: 'm0-10', title: '0.8 Scope and safety', studentLabel: 'Module 0 · 0.8 Scope and safety', sourceSection: '0.8 Scope and safety', duration: 81.05, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 0, chunkId: 'm0-11', title: '0.9 What success looks like', studentLabel: 'Module 0 · 0.9 What success looks like', sourceSection: '0.9 What success looks like', duration: 54.07, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 0, chunkId: 'm0-12', title: '0.10 Practitioner insight', studentLabel: 'Module 0 · 0.10 Practitioner insight', sourceSection: '0.10 Practitioner insight', duration: 37.95, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 0, chunkId: 'm0-13', title: '0.11 Common early mistakes', studentLabel: 'Module 0 · 0.11 Common early mistakes', sourceSection: '0.11 Common early mistakes', duration: 66.36, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 0, chunkId: 'm0-14', title: 'Checkpoint (m0cp1)', studentLabel: 'Module 0 · Checkpoint', sourceSection: 'Checkpoint (m0cp1)', checkpointId: 'm0cp1', gateType: 'checkpoint-stop', duration: 34.33, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 0, chunkId: 'm0-15', title: 'Post-pass continuation: completion + recap + handoff', studentLabel: 'Module 0 · Recap', sourceSection: 'Post-pass continuation: completion + recap + handoff', checkpointId: 'm0cp1', gateType: 'post-pass', resumeAfterPass: true, duration: 33.07, version: 1, qaStatus: 'APPROVED' })
  ];

  // ── HeadSpa Mastery — Module 2 ──
  // Accepted-as-is for launch (strict-fidelity rebuild deferred post-launch,
  // per course-audit-build launch-integration task). Source of truth for the
  // real generated audio: docs/course-audit/listen-mode/tts-final/module-02/
  // *.txt (NOT module-02-listen-script.md, which is a later, never-generated
  // v3 curriculum-polish draft -- confirmed by direct diff against the real
  // frozen .txt payloads before cutting). Known accepted defect, not fixed
  // here per explicit instruction not to reopen production: m2-11's
  // checkpoint closing says "answer above" (pre-Section-F audio). Audio: cut
  // from owner-approved AIMT-Listen-Mode-Final/02-Module-2/
  // M2-BATCH-*-PROCESSED.MP3 via scripts/aimt-listen-install-module.mjs,
  // zero STOPs. qaStatus: APPROVED.
  var HEADSPA_MODULE_2 = [
    chunk({ courseSlug: 'headspa-mastery', moduleId: 2, chunkId: 'm2-01', title: 'Module Briefing (spoken)', studentLabel: 'Module 2 · Module Briefing (spoken)', sourceSection: 'Module Briefing (spoken)', duration: 59.19, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 2, chunkId: 'm2-02', title: 'The governing principle', studentLabel: 'Module 2 · The governing principle', sourceSection: 'The governing principle', duration: 47.53, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 2, chunkId: 'm2-03', title: '2.1 Intake Before Arrival', studentLabel: 'Module 2 · 2.1 Intake Before Arrival', sourceSection: '2.1 Intake Before Arrival', duration: 76.62, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 2, chunkId: 'm2-04', title: '2.2 Remove Preventable Uncertainty', studentLabel: 'Module 2 · 2.2 Remove Preventable Uncertainty', sourceSection: '2.2 Remove Preventable Uncertainty', duration: 97.14, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 2, chunkId: 'm2-05', title: '2.3 Set the Plan Before the Quiet + Before/During', studentLabel: 'Module 2 · 2.3 Set the Plan Before the Quiet + Before/During', sourceSection: '2.3 Set the Plan Before the Quiet + Before/During', duration: 131.82, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 2, chunkId: 'm2-06', title: 'Practitioner resource: Head Spa Intake + Service Plan', studentLabel: 'Module 2 · Practitioner resource: Head Spa Intake + Service Plan', sourceSection: 'Practitioner resource: Head Spa Intake + Service Plan', duration: 49.32, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 2, chunkId: 'm2-07', title: '2.4 First Touch', studentLabel: 'Module 2 · 2.4 First Touch', sourceSection: '2.4 First Touch', duration: 116, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 2, chunkId: 'm2-08', title: '2.5 Protect the Quiet', studentLabel: 'Module 2 · 2.5 Protect the Quiet', sourceSection: '2.5 Protect the Quiet', duration: 96.9, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 2, chunkId: 'm2-09', title: '2.6 When Something Changes + interaction framing', studentLabel: 'Module 2 · 2.6 When Something Changes + interaction framing', sourceSection: '2.6 When Something Changes + interaction framing', duration: 78.02, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 2, chunkId: 'm2-10', title: '2.7 Consistency', studentLabel: 'Module 2 · 2.7 Consistency', sourceSection: '2.7 Consistency', duration: 57.41, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 2, chunkId: 'm2-11', title: 'Checkpoint (`m2cp1`)', studentLabel: 'Module 2 · Checkpoint', sourceSection: 'Checkpoint (`m2cp1`)', checkpointId: 'm2cp1', gateType: 'checkpoint-stop', duration: 53.2, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 2, chunkId: 'm2-12', title: 'Post-pass continuation: completion + handoff', studentLabel: 'Module 2 · Recap', sourceSection: 'Post-pass continuation: completion + handoff', checkpointId: 'm2cp1', gateType: 'post-pass', resumeAfterPass: true, duration: 29.49, version: 1, qaStatus: 'APPROVED' })
  ];

  // ── HeadSpa Mastery — Module 3 ──
  // Accepted-as-is for launch. Owner-approved PROCESSED audio for ALL 6
  // batches (A1, A2, A3, B1, B2, C1) exists at
  // AIMT-Listen-Mode-Final/03-Module-3/ -- A1/A2 were missed in an earlier
  // pass because they're filed on disk as "M3-BATCH-A1-PROCCESSED.MP3" /
  // "M3-BATCH-A2-PROCCESSED.MP3" (owner-side "PROCCESSED" double-C typo,
  // same pre-existing quirk already documented for Module 7's A1 above --
  // not renamed, per instruction not to touch owner audio filenames). All
  // 11 chunks cut from their real PROCESSED masters via
  // scripts/aimt-listen-install-module.mjs, zero STOPs (2 internal
  // boundaries in A1, both silence-snapped within ~1.3s of estimate).
  // qaStatus: APPROVED for all 11 -- isProductionReady() is now true.
  // Known accepted defects, not fixed (reopening production is out of
  // scope): m3-06 and m3-10 both close with "answer above".
  var HEADSPA_MODULE_3 = [
    chunk({ courseSlug: 'headspa-mastery', moduleId: 3, chunkId: 'm3-01', title: 'Module Briefing (spoken)', studentLabel: 'Module 3 · Module Briefing (spoken)', sourceSection: 'Module Briefing (spoken)', duration: 57.37, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 3, chunkId: 'm3-02', title: '3.1 Read beneath the surface', studentLabel: 'Module 3 · 3.1 Read beneath the surface', sourceSection: '3.1 Read beneath the surface', duration: 70.65, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 3, chunkId: 'm3-03', title: '3.2 The scalp map', studentLabel: 'Module 3 · 3.2 The scalp map', sourceSection: '3.2 The scalp map', duration: 114.37, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 3, chunkId: 'm3-04', title: '3.3 The living system beneath the strand + Anatomy to action', studentLabel: 'Module 3 · 3.3 The living system beneath the strand + Anatomy to action', sourceSection: '3.3 The living system beneath the strand + Anatomy to action', duration: 237.14, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 3, chunkId: 'm3-05', title: '3.4 The hair-growth cycle + Predict before you reveal', studentLabel: 'Module 3 · 3.4 The hair-growth cycle + Predict before you reveal', sourceSection: '3.4 The hair-growth cycle + Predict before you reveal', duration: 135.81, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 3, chunkId: 'm3-06', title: 'Checkpoint 1 (`cp1`)', studentLabel: 'Module 3 · Checkpoint', sourceSection: 'Checkpoint 1 (`cp1`)', checkpointId: 'cp1', gateType: 'checkpoint-stop', duration: 24.74, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 3, chunkId: 'm3-07', title: 'Post-pass: 3.5 Read the pattern', studentLabel: 'Module 3 · Continuing', sourceSection: 'Post-pass: 3.5 Read the pattern', checkpointId: 'cp1', gateType: 'post-pass', resumeAfterPass: true, duration: 183.08, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 3, chunkId: 'm3-08', title: '3.6 Barrier and surface lipids', studentLabel: 'Module 3 · 3.6 Barrier and surface lipids', sourceSection: '3.6 Barrier and surface lipids', duration: 122.74, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 3, chunkId: 'm3-09', title: '3.7 Massage and anatomy', studentLabel: 'Module 3 · 3.7 Massage and anatomy', sourceSection: '3.7 Massage and anatomy', duration: 101.86, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 3, chunkId: 'm3-10', title: '3.8 Anatomy in practice + Checkpoint 2 (`cp2`)', studentLabel: 'Module 3 · Checkpoint', sourceSection: '3.8 Anatomy in practice + Checkpoint 2 (`cp2`)', checkpointId: 'cp2', gateType: 'checkpoint-stop', duration: 99.07, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 3, chunkId: 'm3-11', title: 'Post-pass continuation: completion + recap + handoff', studentLabel: 'Module 3 · Continuing', sourceSection: 'Post-pass continuation: completion + recap + handoff', checkpointId: 'cp2', gateType: 'post-pass', resumeAfterPass: true, duration: 44.62, version: 1, qaStatus: 'APPROVED' })
  ];

  // ── HeadSpa Mastery — Module 8 ──
  // CLOSED for launch. Source of truth:
  // docs/course-audit/listen-mode/tts-final/module-08/*.txt (v2-strict-
  // fidelity). Known accepted pronunciation imperfection (course-wide
  // single-spaced "A I M T" convention, m8-16) intentionally NOT repaired
  // per explicit instruction. Audio: cut from owner-approved
  // AIMT-Listen-Mode-Final/08-Module-8/M8-BATCH-*-PROCESSED.WAV via
  // scripts/aimt-listen-install-module.mjs (4 internal boundaries, all
  // silence-snapped within ~1.2s of estimate, zero STOPs). qaStatus:
  // APPROVED.
  var HEADSPA_MODULE_8 = [
    chunk({ courseSlug: 'headspa-mastery', moduleId: 8, chunkId: 'm8-01', title: 'Module Briefing (spoken)', studentLabel: 'Module 8 · Module Briefing (spoken)', sourceSection: 'Module Briefing (spoken)', duration: 68.15, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 8, chunkId: 'm8-02', title: 'Think in phases, not steps', studentLabel: 'Module 8 · Think in phases, not steps', sourceSection: 'Think in phases, not steps', duration: 135.77, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 8, chunkId: 'm8-03', title: '8.1 Core and Extended', studentLabel: 'Module 8 · 8.1 Core and Extended', sourceSection: '8.1 Core and Extended', duration: 144.84, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 8, chunkId: 'm8-04', title: '8.2 The service map', studentLabel: 'Module 8 · 8.2 The service map', sourceSection: '8.2 The service map', duration: 172.29, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 8, chunkId: 'm8-05', title: 'Chapter 01: Opening Rituals + Microscopy', studentLabel: 'Module 8 · Chapter 01: Opening Rituals + Microscopy', sourceSection: 'Chapter 01: Opening Rituals + Microscopy', duration: 261.67, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 8, chunkId: 'm8-06', title: 'Chapter 02: Client Positioning + Comfort, and Chapter 03: Dry Brushing and Hair Play', studentLabel: 'Module 8 · Chapter 02: Client Positioning + Comfort, and Chapter 03: Dry Brushing and Hair Play', sourceSection: 'Chapter 02: Client Positioning + Comfort, and Chapter 03: Dry Brushing and Hair Play', duration: 90.33, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 8, chunkId: 'm8-07', title: 'Chapter 04: Halo Activation + Wet Massage', studentLabel: 'Module 8 · Chapter 04: Halo Activation + Wet Massage', sourceSection: 'Chapter 04: Halo Activation + Wet Massage', duration: 150.99, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 8, chunkId: 'm8-08', title: 'Chapter 05: Exfoliant + Scalp Massage', studentLabel: 'Module 8 · Chapter 05: Exfoliant + Scalp Massage', sourceSection: 'Chapter 05: Exfoliant + Scalp Massage', duration: 217.22, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 8, chunkId: 'm8-09', title: 'Chapter 06: Neck and Shoulder Massage, and Chapter 07: Shampoo + Rinse', studentLabel: 'Module 8 · Chapter 06: Neck and Shoulder Massage, and Chapter 07: Shampoo + Rinse', sourceSection: 'Chapter 06: Neck and Shoulder Massage, and Chapter 07: Shampoo + Rinse', duration: 173.78, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 8, chunkId: 'm8-10', title: 'Chapter 08: Deep Conditioning / Hand + Arm Massage', studentLabel: 'Module 8 · Chapter 08: Deep Conditioning / Hand + Arm Massage', sourceSection: 'Chapter 08: Deep Conditioning / Hand + Arm Massage', duration: 155.25, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 8, chunkId: 'm8-11', title: 'Chapter 09: Final Rinse + Halo Massage, part 1', studentLabel: 'Module 8 · Chapter 09: Final Rinse + Halo Massage, part 1', sourceSection: 'Chapter 09: Final Rinse + Halo Massage, part 1', duration: 130.31, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 8, chunkId: 'm8-12', title: 'Chapter 09: Final Rinse + Halo Massage, part 2', studentLabel: 'Module 8 · Chapter 09: Final Rinse + Halo Massage, part 2', sourceSection: 'Chapter 09: Final Rinse + Halo Massage, part 2', duration: 135.88, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 8, chunkId: 'm8-13', title: '8.3 Flow, pressure & transitions', studentLabel: 'Module 8 · 8.3 Flow, pressure & transitions', sourceSection: '8.3 Flow, pressure & transitions', duration: 138.02, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 8, chunkId: 'm8-14', title: 'Signature interaction: "Protect the Flow"', studentLabel: 'Module 8 · Signature interaction: "Protect the Flow"', sourceSection: 'Signature interaction: "Protect the Flow"', duration: 225.81, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 8, chunkId: 'm8-15', title: 'Checkpoint 1 (m8cp1)', studentLabel: 'Module 8 · Checkpoint', sourceSection: 'Checkpoint 1 (m8cp1)', checkpointId: 'm8cp1', gateType: 'checkpoint-stop', duration: 31.16, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 8, chunkId: 'm8-16', title: 'Post-pass continuation: the A I M T Service Timer', studentLabel: 'Module 8 · Continuing', sourceSection: 'Post-pass continuation: the A I M T Service Timer', checkpointId: 'm8cp1', gateType: 'post-pass', resumeAfterPass: true, duration: 101.66, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 8, chunkId: 'm8-17', title: 'Checkpoint 2 (m8cp2)', studentLabel: 'Module 8 · Checkpoint', sourceSection: 'Checkpoint 2 (m8cp2)', checkpointId: 'm8cp2', gateType: 'checkpoint-stop', duration: 17.79, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 8, chunkId: 'm8-18', title: 'Post-pass continuation: completion + recap + handoff', studentLabel: 'Module 8 · Continuing', sourceSection: 'Post-pass continuation: completion + recap + handoff', checkpointId: 'm8cp2', gateType: 'post-pass', resumeAfterPass: true, duration: 24.03, version: 1, qaStatus: 'APPROVED' })
  ];

  // ── HeadSpa Mastery — Module 9 ──
  // Owner-approved strict-fidelity (v4) production. Source of truth:
  // docs/course-audit/listen-mode/module-09-listen-script.md +
  // tts-final/module-09/*.txt. Preserves the interaction-stop architecture
  // for "Close Without Pressure" (m9CwpDecision) with all 6 choice-specific
  // feedback branches (never played linearly — the player halts after
  // m9-03, polls for the student's selection, then plays exactly one
  // feedback branch). A4b (m9-06) sits between A4 (m9-05) and A5 (m9-07) as
  // required. Audio: cut from owner-approved AIMT-Listen-Mode-Final/
  // 09-Module-9/M9-BATCH-*-PROCESSED.WAV via
  // scripts/aimt-listen-install-module.mjs (1 internal boundary, silence-
  // snapped within 1.2s of estimate; every other batch was already a single
  // chunk). qaStatus: APPROVED.
  var HEADSPA_MODULE_9 = [
    chunk({ courseSlug: 'headspa-mastery', moduleId: 9, chunkId: 'm9-01', title: 'Module Briefing (spoken)', studentLabel: 'Module 9 · Module Briefing (spoken)', sourceSection: 'Module Briefing (spoken)', duration: 71.41, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 9, chunkId: 'm9-02', title: '9.1 From treatment close to checkout', studentLabel: 'Module 9 · 9.1 From treatment close to checkout', sourceSection: '9.1 From treatment close to checkout', duration: 168.41, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 9, chunkId: 'm9-03', title: 'Close Without Pressure (interaction prompt + options)', studentLabel: 'Module 9 · Signature interaction — Close Without Pressure', sourceSection: 'Close Without Pressure (interaction prompt + options)', gateType: 'interaction-stop', interactionId: 'm9CwpDecision', interactionFeedback: [
      { optionIndex: 0, chunkId: 'm9-03-fb0', studentLabel: 'Option 1 feedback', audioSrc: 'assets/audio/listen/headspa-mastery/module-09/m9-03-fb0.mp3', duration: 15.95, version: 1, qaStatus: 'APPROVED' },
      { optionIndex: 1, chunkId: 'm9-03-fb1', studentLabel: 'Option 2 feedback', audioSrc: 'assets/audio/listen/headspa-mastery/module-09/m9-03-fb1.mp3', duration: 15.16, version: 1, qaStatus: 'APPROVED' },
      { optionIndex: 2, chunkId: 'm9-03-fb2', studentLabel: 'Option 3 feedback', audioSrc: 'assets/audio/listen/headspa-mastery/module-09/m9-03-fb2.mp3', duration: 15.16, version: 1, qaStatus: 'APPROVED' },
      { optionIndex: 3, chunkId: 'm9-03-fb3', studentLabel: 'Option 4 feedback', audioSrc: 'assets/audio/listen/headspa-mastery/module-09/m9-03-fb3.mp3', duration: 9.26, version: 1, qaStatus: 'APPROVED' },
      { optionIndex: 4, chunkId: 'm9-03-fb4', studentLabel: 'Option 5 feedback', audioSrc: 'assets/audio/listen/headspa-mastery/module-09/m9-03-fb4.mp3', duration: 11.33, version: 1, qaStatus: 'APPROVED' },
      { optionIndex: 5, chunkId: 'm9-03-fb5', studentLabel: 'Option 6 feedback', audioSrc: 'assets/audio/listen/headspa-mastery/module-09/m9-03-fb5.mp3', duration: 9.66, version: 1, qaStatus: 'APPROVED' }
    ], duration: 119.72, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 9, chunkId: 'm9-04', title: '9.2 Know the real cost + 9.3 Margin vs. markup', studentLabel: 'Module 9 · 9.2 Know the real cost + 9.3 Margin vs. markup', sourceSection: '9.2 Know the real cost + 9.3 Margin vs. markup', duration: 181.16, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 9, chunkId: 'm9-05', title: '9.4 Price your service + 9.5 Market context', studentLabel: 'Module 9 · 9.4 Price your service + 9.5 Market context', sourceSection: '9.4 Price your service + 9.5 Market context', duration: 116.52, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 9, chunkId: 'm9-06', title: '9.6 Design your menu + 9.7 Enhancements that earn their place', studentLabel: 'Module 9 · 9.6 Design your menu + 9.7 Enhancements that earn their place', sourceSection: '9.6 Design your menu + 9.7 Enhancements that earn their place', duration: 255.79, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 9, chunkId: 'm9-07', title: 'Checkpoint 1 (m10cp1)', studentLabel: 'Module 9 · Checkpoint', sourceSection: 'Checkpoint 1 (m10cp1)', checkpointId: 'm10cp1', gateType: 'checkpoint-stop', duration: 24.85, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 9, chunkId: 'm9-08', title: 'Post-pass (m10cp1): 9.8 When a client says the price felt high', studentLabel: 'Module 9 · Continuing', sourceSection: 'Post-pass (m10cp1): 9.8 When a client says the price felt high', checkpointId: 'm10cp1', gateType: 'post-pass', resumeAfterPass: true, duration: 114.82, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 9, chunkId: 'm9-09', title: '9.9 Why pricing really goes wrong', studentLabel: 'Module 9 · 9.9 Why pricing really goes wrong', sourceSection: '9.9 Why pricing really goes wrong', duration: 71.56, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 9, chunkId: 'm9-10', title: 'Checkpoint 2 (m10cp2)', studentLabel: 'Module 9 · Checkpoint', sourceSection: 'Checkpoint 2 (m10cp2)', checkpointId: 'm10cp2', gateType: 'checkpoint-stop', duration: 20.85, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 9, chunkId: 'm9-11', title: 'Post-pass (m10cp2): completion + recap + handoff', studentLabel: 'Module 9 · Continuing', sourceSection: 'Post-pass (m10cp2): completion + recap + handoff', checkpointId: 'm10cp2', gateType: 'post-pass', resumeAfterPass: true, duration: 19.55, version: 1, qaStatus: 'APPROVED' })
  ];

  // ── HeadSpa Mastery — Module 10 ──
  // Owner-approved strict-fidelity (v2) production. Source of truth:
  // docs/course-audit/listen-mode/module-10-listen-script.md +
  // tts-final/module-10/*.txt. Preserves the interaction-stop architecture
  // for "Reset Under Pressure" (m10RupDecision) with all 5 choice-specific
  // feedback branches. Checkpoint architecture preserved exactly: m9cp1
  // (checkpoint-stop) → post-pass transition → m9cp2 (checkpoint-stop,
  // never narrated before m9cp1 resolves) → post-pass completion. Historical
  // checkpoint ids m9cp1/m9cp2 kept unrenamed, matching their real
  // moduleId-10 grading target. Audio: cut from owner-approved
  // AIMT-Listen-Mode-Final/10-Module-10/M10-BATCH-*-PROCESSED.WAV via
  // scripts/aimt-listen-install-module.mjs (1 internal boundary, silence-
  // snapped within 1.2s of estimate). qaStatus: APPROVED.
  var HEADSPA_MODULE_10 = [
    chunk({ courseSlug: 'headspa-mastery', moduleId: 10, chunkId: 'm10-01', title: 'Module Briefing (spoken)', studentLabel: 'Module 10 · Module Briefing (spoken)', sourceSection: 'Module Briefing (spoken)', duration: 71.2, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 10, chunkId: 'm10-02', title: 'Building on Your Licensure + Governing sources + 10.1 Use the Right Process for the Job', studentLabel: 'Module 10 · Building on Your Licensure + Governing sources + 10.1 Use the Right Process for the Job', sourceSection: 'Building on Your Licensure + Governing sources + 10.1 Use the Right Process for the Job', duration: 169.22, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 10, chunkId: 'm10-03', title: '10.2 Process the Right Item the Right Way', studentLabel: 'Module 10 · 10.2 Process the Right Item the Right Way', sourceSection: '10.2 Process the Right Item the Right Way', duration: 183.48, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 10, chunkId: 'm10-04', title: '10.3 Build a Reset Around What Cannot Be Rushed', studentLabel: 'Module 10 · 10.3 Build a Reset Around What Cannot Be Rushed', sourceSection: '10.3 Build a Reset Around What Cannot Be Rushed', duration: 136.28, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 10, chunkId: 'm10-05', title: 'Reset Under Pressure (interaction prompt + options)', studentLabel: 'Module 10 · Signature interaction — Reset Under Pressure', sourceSection: 'Reset Under Pressure (interaction prompt + options)', gateType: 'interaction-stop', interactionId: 'm10RupDecision', interactionFeedback: [
      { optionIndex: 0, chunkId: 'm10-05-fb0', studentLabel: 'Option 1 feedback', audioSrc: 'assets/audio/listen/headspa-mastery/module-10/m10-05-fb0.mp3', duration: 17.62, version: 1, qaStatus: 'APPROVED' },
      { optionIndex: 1, chunkId: 'm10-05-fb1', studentLabel: 'Option 2 feedback', audioSrc: 'assets/audio/listen/headspa-mastery/module-10/m10-05-fb1.mp3', duration: 11.56, version: 1, qaStatus: 'APPROVED' },
      { optionIndex: 2, chunkId: 'm10-05-fb2', studentLabel: 'Option 3 feedback', audioSrc: 'assets/audio/listen/headspa-mastery/module-10/m10-05-fb2.mp3', duration: 10.52, version: 1, qaStatus: 'APPROVED' },
      { optionIndex: 3, chunkId: 'm10-05-fb3', studentLabel: 'Option 4 feedback', audioSrc: 'assets/audio/listen/headspa-mastery/module-10/m10-05-fb3.mp3', duration: 9.73, version: 1, qaStatus: 'APPROVED' },
      { optionIndex: 4, chunkId: 'm10-05-fb4', studentLabel: 'Option 5 feedback', audioSrc: 'assets/audio/listen/headspa-mastery/module-10/m10-05-fb4.mp3', duration: 10.84, version: 1, qaStatus: 'APPROVED' }
    ], duration: 71.73, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 10, chunkId: 'm10-06', title: '10.4 Build the System Before You\'re Under Pressure', studentLabel: 'Module 10 · 10.4 Build the System Before You\'re Under Pressure', sourceSection: '10.4 Build the System Before You\'re Under Pressure', duration: 168.69, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 10, chunkId: 'm10-07', title: '10.5 When Routine Reset Is Not Enough', studentLabel: 'Module 10 · 10.5 When Routine Reset Is Not Enough', sourceSection: '10.5 When Routine Reset Is Not Enough', duration: 133.05, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 10, chunkId: 'm10-08', title: 'Checkpoint 1 (m9cp1)', studentLabel: 'Module 10 · Checkpoint', sourceSection: 'Checkpoint 1 (m9cp1)', checkpointId: 'm9cp1', gateType: 'checkpoint-stop', duration: 27.49, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 10, chunkId: 'm10-09', title: 'Post-pass (m9cp1): transition only', studentLabel: 'Module 10 · Continuing', sourceSection: 'Post-pass (m9cp1): transition only', checkpointId: 'm9cp1', gateType: 'post-pass', resumeAfterPass: true, duration: 2.41, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 10, chunkId: 'm10-10', title: 'Checkpoint 2 (m9cp2)', studentLabel: 'Module 10 · Checkpoint', sourceSection: 'Checkpoint 2 (m9cp2)', checkpointId: 'm9cp2', gateType: 'checkpoint-stop', duration: 22.29, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 10, chunkId: 'm10-11', title: 'Post-pass (m9cp2): completion + recap + handoff', studentLabel: 'Module 10 · Continuing', sourceSection: 'Post-pass (m9cp2): completion + recap + handoff', checkpointId: 'm9cp2', gateType: 'post-pass', resumeAfterPass: true, duration: 29.09, version: 1, qaStatus: 'APPROVED' })
  ];

  // ── HeadSpa Mastery — Module 7 ──
  // Source of truth: docs/course-audit/listen-mode/tts-final/module-07/*.txt
  // (v2-strict-fidelity, owner-approved). Same install method as Module 4
  // above; source master for batch A1 is filed on disk as
  // "M7-BATCH-A1-PROCCESSED.WAV" (pre-existing owner-side typo, extra "C" --
  // not renamed, per instruction not to touch owner audio filenames).
  // m7-08 is a deliberate judgment call carried over from the original
  // build (see scripts/aimt-listen-module07-v2-build.mjs): it is a
  // checkpoint-stop for m7cp2 whose narration opens with the m7cp1 resume
  // transition, since the live page has no numbered section between the two
  // checkpoints. qaStatus: APPROVED.
  var HEADSPA_MODULE_7 = [
    chunk({ courseSlug: 'headspa-mastery', moduleId: 7, chunkId: 'm7-01', title: 'Module Briefing (spoken)', studentLabel: 'Module 7 · Opening', sourceSection: 'Module Briefing (spoken)', visualTarget: 'm7WrittenBriefing', duration: 65.33, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 7, chunkId: 'm7-02', title: '7.1 The treatment bed', studentLabel: 'Module 7 · Section 7.1 — The treatment bed', sourceSection: '7.1 The treatment bed', visualTarget: 'm7VisualTreatmentBed', transitionGapMs: 3538, duration: 225.36, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 7, chunkId: 'm7-03', title: '7.2 Tools and supplies', studentLabel: 'Module 7 · Section 7.2 — Tools and supplies', sourceSection: '7.2 Tools and supplies', visualTarget: 'm7VisualToolsSupplies', transitionGapMs: 3737, duration: 252.71, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 7, chunkId: 'm7-04', title: '7.3 Station prep sequence', studentLabel: 'Module 7 · Section 7.3 — Station prep sequence', sourceSection: '7.3 Station prep sequence', visualTarget: 'm7VisualStationPrep', transitionGapMs: 3707, duration: 129.65, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 7, chunkId: 'm7-05', title: '7.4 Client positioning', studentLabel: 'Module 7 · Section 7.4 — Client positioning', sourceSection: '7.4 Client positioning', visualTarget: 'm7VisualClientPositioning', transitionGapMs: 3394, duration: 199.34, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 7, chunkId: 'm7-06', title: 'Signature interaction: Find the setup mistakes', studentLabel: 'Module 7 · Signature interaction — Find the setup mistakes', sourceSection: 'Signature interaction: Find the setup mistakes', visualTarget: 'm7VisualSignatureMistakes', duration: 138.74, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 7, chunkId: 'm7-07', title: 'Checkpoint 1 — m7cp1', studentLabel: 'Module 7 · Checkpoint 1', sourceSection: 'Checkpoint 1 — m7cp1', visualTarget: 'm7cp1', checkpointId: 'm7cp1', gateType: 'checkpoint-stop', duration: 13.69, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 7, chunkId: 'm7-08', title: 'Checkpoint 2 — m7cp2 (opens with the m7cp1 resume transition)', studentLabel: 'Module 7 · Checkpoint 2', sourceSection: 'Checkpoint 2 — m7cp2 (opens with the m7cp1 resume transition)', visualTarget: 'm7cp2', checkpointId: 'm7cp2', gateType: 'checkpoint-stop', duration: 21.66, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 7, chunkId: 'm7-09', title: 'Post-pass: completion + recap + handoff', studentLabel: 'Module 7 · Recap', sourceSection: 'Post-pass: completion + recap + handoff', visualTarget: 'm7Complete', checkpointId: 'm7cp2', gateType: 'post-pass', resumeAfterPass: true, duration: 28.89, version: 1, qaStatus: 'APPROVED' })
  ];

  // ── HeadSpa Mastery — Module 11 ──
  // Final strict-fidelity v2 rebuild (docs/course-audit/listen-mode/
  // module-11-listen-script.md), after both post-generation owner
  // corrections: (1) Cadence first-person narrator fix, A2 only
  // ("through Cadence...Cadence is" -> "through me...I'm"); (2) B.R.I.E.F.
  // framework-name spoken as the ordinary word "brief", A3/B4 only
  // ("Give AI a Better B.R.I.E.F." -> "Give AI a better brief") --
  // individual-letter teaching sequence in A3 (B, Background... R,
  // Request...) is unchanged, still spelled letter-by-letter. AIMT is
  // spoken comma-separated ("A, I, M, T") throughout this module, NOT the
  // later single-spaced Section L form -- this is a deliberate, documented
  // exception (00-listen-mode-editorial-standard.md Section L: "Not applied
  // retroactively to Modules 10 or 11's already-shipped comma-separated
  // audio -- revisiting that already-shipped audio is a separate,
  // not-yet-decided owner action"), not an oversight. All 12 batches
  // (3 regenerated once each: A2, A3, B4) installed from their current
  // top-level *-PROCESSED.WAV masters via
  // scripts/aimt-listen-install-module.mjs -- every batch is a 1:1 chunk,
  // no internal splitting needed. The Build Your B.R.I.E.F. workspace
  // (m11bBackgroundIn/m11bRequestIn/m11bInstructionsIn/m11bOutputIn/
  // m11bFactcheckIn) is an ungraded free-text exercise, not gated audio --
  // no interaction-stop chunk exists for it, matching the source README's
  // explicit note that no interaction-feedback cut points apply to this
  // module. qaStatus: APPROVED (owner-processed masters, installed as-is,
  // no reprocessing).
  var HEADSPA_MODULE_11 = [
    chunk({ courseSlug: 'headspa-mastery', moduleId: 11, chunkId: 'm11-01', title: 'Module Briefing (spoken)', studentLabel: 'Module 11 · Module Briefing (spoken)', sourceSection: 'Module Briefing (spoken)', duration: 60.28, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 11, chunkId: 'm11-02', title: 'AIMT/Cadence framing + AIMT position + 11.1 Tool literacy', studentLabel: 'Module 11 · 11.1 Tool literacy', sourceSection: 'AIMT/Cadence framing + AIMT position + 11.1', duration: 131.98, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 11, chunkId: 'm11-03', title: '11.2 Better input — the B.R.I.E.F. framework + workspace', studentLabel: 'Module 11 · 11.2 Better input', sourceSection: '11.2, full B.R.I.E.F. framework + workspace + example', duration: 160.68, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 11, chunkId: 'm11-04', title: '11.3 Human authority', studentLabel: 'Module 11 · 11.3 Human authority', sourceSection: '11.3, all 3 authority levels', duration: 93.23, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 11, chunkId: 'm11-05', title: '11.4 Scalp and hair analysis', studentLabel: 'Module 11 · 11.4 Scalp and hair analysis', sourceSection: '11.4, scalp/hair analysis', duration: 80.18, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 11, chunkId: 'm11-06', title: '11.5 Client-supplied AI', studentLabel: 'Module 11 · 11.5 Client-supplied AI', sourceSection: '11.5, client-supplied AI', duration: 111.71, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 11, chunkId: 'm11-07', title: 'Checkpoint 1 — m11cp1', studentLabel: 'Module 11 · Checkpoint 1', sourceSection: 'Checkpoint 1 alone', checkpointId: 'm11cp1', gateType: 'checkpoint-stop', duration: 22.22, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 11, chunkId: 'm11-08', title: 'Post-pass: 11.6 Privacy & client data', studentLabel: 'Module 11 · Continuing', sourceSection: 'Post-pass transition + 11.6', checkpointId: 'm11cp1', gateType: 'post-pass', resumeAfterPass: true, duration: 64.69, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 11, chunkId: 'm11-09', title: '11.7 Practice leverage', studentLabel: 'Module 11 · 11.7 Practice leverage', sourceSection: '11.7, all 6 leverage categories', duration: 66.13, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 11, chunkId: 'm11-10', title: '11.8 Human-led practice + AIMT AI Practice Toolkit', studentLabel: 'Module 11 · 11.8 Human-led practice', sourceSection: '11.8 + Toolkit', duration: 96.60, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 11, chunkId: 'm11-11', title: 'Checkpoint 2 — m11cp2', studentLabel: 'Module 11 · Checkpoint 2', sourceSection: 'Checkpoint 2 alone', checkpointId: 'm11cp2', gateType: 'checkpoint-stop', duration: 27.14, version: 1, qaStatus: 'APPROVED' }),
    chunk({ courseSlug: 'headspa-mastery', moduleId: 11, chunkId: 'm11-12', title: 'Post-pass: completion + recap + handoff', studentLabel: 'Module 11 · Recap', sourceSection: 'Post-pass recap/handoff', checkpointId: 'm11cp2', gateType: 'post-pass', resumeAfterPass: true, duration: 25.89, version: 1, qaStatus: 'APPROVED' })
  ];

  // ── HeadSpa Mastery — Module 12 ──
  // Source of truth: docs/course-audit/listen-mode/module-12-listen-script.md.
  // Module 12's real content is a scored, server-authoritative certification
  // exam (assets/js/module12-certification.js + functions/api/certification/
  // *.js) — this manifest intentionally covers ONLY the pre-exam "State A"
  // orientation screen (how the assessment works, passing requirements,
  // integrity notice), which is the one screen in that flow that isn't
  // scored and doesn't reveal any exam content. Single chunk, no checkpoint,
  // no gate — nothing to wait on. module12-certification.js's onStartExam()
  // unmounts Listen Mode before an attempt is ever created, so this can
  // never overlap with or narrate scored content. AIMT is spoken
  // single-spaced ("A I M T", no punctuation) per the locked Section L rule
  // (00-listen-mode-editorial-standard.md) -- the take that reversed the
  // earlier comma-separated form after the owner found it sounded choppy on
  // this voice; the superseded comma-separated and v1 single-spaced-with-bug
  // takes are archived, not used. Installed from the current top-level
  // M12-BATCH-A1-PROCESSED.WAV (newest of the three candidate takes,
  // confirmed by file timestamp against both archive folders) via
  // scripts/aimt-listen-install-module.mjs, single batch, no splitting.
  // qaStatus: APPROVED (owner-processed master, installed as-is).
  var HEADSPA_MODULE_12 = [
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 12, chunkId: 'm12-01',
      title: 'State A orientation (spoken)', studentLabel: 'Module 12 · Before you begin',
      sourceSection: 'COPY.stateA', visualTarget: null,
      duration: 298.26, version: 1, qaStatus: 'APPROVED'
    })
  ];

  var manifests = {
    'headspa-mastery': {
      0: HEADSPA_MODULE_0,
      1: HEADSPA_MODULE_1,
      2: HEADSPA_MODULE_2,
      3: HEADSPA_MODULE_3,
      4: HEADSPA_MODULE_4,
      5: HEADSPA_MODULE_5,
      6: HEADSPA_MODULE_6,
      7: HEADSPA_MODULE_7,
      8: HEADSPA_MODULE_8,
      9: HEADSPA_MODULE_9,
      10: HEADSPA_MODULE_10,
      11: HEADSPA_MODULE_11,
      12: HEADSPA_MODULE_12
    }
  };

  function getManifest(courseSlug, moduleId) {
    var course = manifests[courseSlug];
    if (!course) return null;
    var list = course[Number(moduleId)];
    return Array.isArray(list) ? list.slice() : null;
  }

  // Returns { valid: boolean, errors: string[] } — pure structural validation,
  // no DOM/network access. Used by tests and can be used defensively by the
  // player before it mounts.
  function validateManifest(chunks) {
    var errors = [];
    if (!Array.isArray(chunks) || chunks.length === 0) {
      return { valid: false, errors: ['manifest is empty or not an array'] };
    }
    var seenIds = {};
    chunks.forEach(function (c, i) {
      CHUNK_FIELDS.forEach(function (field) {
        if (!(field in c)) errors.push('chunk[' + i + '] missing field "' + field + '"');
      });
      if (c.chunkId) {
        if (seenIds[c.chunkId]) errors.push('duplicate chunkId "' + c.chunkId + '"');
        seenIds[c.chunkId] = true;
      }
      if (GATE_TYPES.indexOf(c.gateType) === -1) {
        errors.push('chunk[' + i + '] ("' + c.chunkId + '") has invalid gateType "' + c.gateType + '"');
      }
      if (QA_STATUSES.indexOf(c.qaStatus) === -1) {
        errors.push('chunk[' + i + '] ("' + c.chunkId + '") has invalid qaStatus "' + c.qaStatus + '"');
      }
      if ((c.gateType === 'checkpoint-stop' || c.gateType === 'post-pass') && !c.checkpointId) {
        errors.push('chunk[' + i + '] ("' + c.chunkId + '") has gateType "' + c.gateType + '" but no checkpointId');
      }
      if (c.gateType === 'interaction-stop') {
        if (!c.interactionId) {
          errors.push('chunk[' + i + '] ("' + c.chunkId + '") has gateType "interaction-stop" but no interactionId');
        }
        if (!Array.isArray(c.interactionFeedback) || c.interactionFeedback.length === 0) {
          errors.push('chunk[' + i + '] ("' + c.chunkId + '") has gateType "interaction-stop" but no interactionFeedback entries — every option the student can select must have its own feedback audio, or the player would stall waiting for one that never plays');
        } else {
          var seenOptionIndexes = {};
          c.interactionFeedback.forEach(function (f, fi) {
            var where = 'chunk[' + i + '] ("' + c.chunkId + '") interactionFeedback[' + fi + ']';
            if (typeof f.optionIndex !== 'number') errors.push(where + ' missing numeric optionIndex');
            else if (seenOptionIndexes[f.optionIndex]) errors.push(where + ' duplicate optionIndex ' + f.optionIndex);
            else seenOptionIndexes[f.optionIndex] = true;
            if (typeof f.audioSrc !== 'string' || !/^assets\/audio\/listen\//.test(f.audioSrc)) {
              errors.push(where + ' audioSrc does not follow the assets/audio/listen/ convention');
            }
            if (QA_STATUSES.indexOf(f.qaStatus) === -1) {
              errors.push(where + ' has invalid qaStatus "' + f.qaStatus + '"');
            }
          });
        }
      }
      if (typeof c.audioSrc !== 'string' || !/^assets\/audio\/listen\//.test(c.audioSrc)) {
        errors.push('chunk[' + i + '] ("' + c.chunkId + '") audioSrc does not follow the assets/audio/listen/ convention');
      }
    });
    return { valid: errors.length === 0, errors: errors };
  }

  // Every chunk in the manifest that is APPROVED — the only status the
  // player treats as eligible for real students (Section 17/21: Listen Mode
  // must never present as available until every required chunk is
  // installed and approved). An interaction-stop chunk's own audio being
  // APPROVED is not enough on its own — every one of its per-option
  // interactionFeedback entries must be APPROVED too, or a student could
  // reach a real option whose feedback audio was never actually finished.
  function isProductionReady(chunks) {
    if (!Array.isArray(chunks) || chunks.length === 0) return false;
    return chunks.every(function (c) {
      if (c.qaStatus !== 'APPROVED') return false;
      if (c.gateType === 'interaction-stop') {
        if (!Array.isArray(c.interactionFeedback) || c.interactionFeedback.length === 0) return false;
        return c.interactionFeedback.every(function (f) { return f.qaStatus === 'APPROVED'; });
      }
      return true;
    });
  }

  var api = {
    CHUNK_FIELDS: CHUNK_FIELDS,
    GATE_TYPES: GATE_TYPES,
    QA_STATUSES: QA_STATUSES,
    manifests: manifests,
    getManifest: getManifest,
    validateManifest: validateManifest,
    isProductionReady: isProductionReady,
    audioPath: audioPath
  };

  root.AIMTListenModeData = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
