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

  var manifests = {
    'headspa-mastery': {
      1: HEADSPA_MODULE_1
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
