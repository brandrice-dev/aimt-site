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
//   gateType          'normal' | 'checkpoint-stop' | 'post-pass'
//                        normal          — plays and advances automatically
//                        checkpoint-stop — after this chunk finishes, the player halts and
//                                          waits; it does NOT auto-advance. The checkpoint
//                                          itself (existing course UI) remains the only way
//                                          to actually pass it.
//                        post-pass       — this chunk may only play once `checkpointId` has
//                                          an authoritative PASS in course state.
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
    'version', 'qaStatus', 'transitionGapMs'
  ];

  var GATE_TYPES = ['normal', 'checkpoint-stop', 'post-pass'];
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
  // never overlap with or narrate scored content. qaStatus stays GENERATED
  // until the owner's CapCut pass + listen-through approve it, exactly like
  // every other new module in this pass.
  var HEADSPA_MODULE_12 = [
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 12, chunkId: 'm12-01',
      title: 'State A orientation (spoken)', studentLabel: 'Module 12 · Before you begin',
      sourceSection: 'COPY.stateA', visualTarget: null,
      version: 1, qaStatus: 'GENERATED'
    })
  ];

  var manifests = {
    'headspa-mastery': {
      1: HEADSPA_MODULE_1,
      4: HEADSPA_MODULE_4,
      5: HEADSPA_MODULE_5,
      6: HEADSPA_MODULE_6,
      7: HEADSPA_MODULE_7,
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
      if (typeof c.audioSrc !== 'string' || !/^assets\/audio\/listen\//.test(c.audioSrc)) {
        errors.push('chunk[' + i + '] ("' + c.chunkId + '") audioSrc does not follow the assets/audio/listen/ convention');
      }
    });
    return { valid: errors.length === 0, errors: errors };
  }

  // Every chunk in the manifest that is APPROVED — the only status the
  // player treats as eligible for real students (Section 17/21: Listen Mode
  // must never present as available until every required chunk is
  // installed and approved).
  function isProductionReady(chunks) {
    if (!Array.isArray(chunks) || chunks.length === 0) return false;
    return chunks.every(function (c) { return c.qaStatus === 'APPROVED'; });
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
