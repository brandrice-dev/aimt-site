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
    'courseSlug', 'moduleId', 'chunkId', 'title', 'sourceSection', 'audioSrc',
    'visualTarget', 'checkpointId', 'gateType', 'resumeAfterPass', 'duration',
    'version', 'qaStatus'
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
      sourceSection: fields.sourceSection,
      audioSrc: fields.audioSrc || audioPath(fields.courseSlug, fields.moduleId, fields.chunkId),
      visualTarget: fields.visualTarget || null,
      checkpointId: fields.checkpointId || null,
      gateType: fields.gateType || 'normal',
      resumeAfterPass: !!fields.resumeAfterPass,
      duration: typeof fields.duration === 'number' ? fields.duration : null,
      version: typeof fields.version === 'number' ? fields.version : 1,
      qaStatus: fields.qaStatus || 'NOT_GENERATED'
    };
    return c;
  }

  // ── HeadSpa Mastery — Module 1 (pilot) ──
  // Source of truth for wording: docs/course-audit/listen-mode/module-01-listen-script-draft.md (v3).
  // TTS production text: docs/course-audit/listen-mode/tts/module-01/*.txt.
  // All qaStatus values start NOT_GENERATED — no audio has been produced yet
  // (Section 6 of the Module 1 pilot task: no ElevenLabs calls were made by
  // this build). The owner updates qaStatus as real audio is generated and
  // reviewed (Section 18).
  var HEADSPA_MODULE_1 = [
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-01',
      title: 'Module Briefing (spoken)', sourceSection: 'Module Briefing',
      visualTarget: 'm1WrittenBriefing'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-02',
      title: '1.1 What is a head spa?', sourceSection: '1.1'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-03',
      title: '1.2 What is a head spa technician?', sourceSection: '1.2'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-04',
      title: '1.3 Observation vs. diagnosis', sourceSection: '1.3',
      visualTarget: 'm1VisualScopeLanguage'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-05',
      title: '1.4 Scope of practice', sourceSection: '1.4',
      visualTarget: 'm1VisualScopeCards'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-06',
      title: 'Practice interaction — "Where is the line?"', sourceSection: 'Practice interaction',
      visualTarget: 'm1LineInteraction'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-07',
      title: 'Checkpoint 1 — m1cp1', sourceSection: '#m1cp1',
      visualTarget: 'm1cp1', checkpointId: 'm1cp1', gateType: 'checkpoint-stop'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-08',
      title: 'Post-pass continuation (m1cp1)', sourceSection: '1.5 transition',
      checkpointId: 'm1cp1', gateType: 'post-pass', resumeAfterPass: true
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-09',
      title: '1.5 Limitations of a head spa service', sourceSection: '1.5',
      visualTarget: 'm1VisualLimitations'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-10',
      title: '1.6 Licensing', sourceSection: '1.6'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-11',
      title: '1.7 Practitioner insight', sourceSection: '1.7'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-12',
      title: '1.8 Mistakes new practitioners make', sourceSection: '1.8'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-13',
      title: 'Checkpoint 2 — m1cp2', sourceSection: '#m1cp2',
      visualTarget: 'm1cp2', checkpointId: 'm1cp2', gateType: 'checkpoint-stop'
    }),
    chunk({
      courseSlug: 'headspa-mastery', moduleId: 1, chunkId: 'm1-14',
      title: 'Post-pass continuation (m1cp2) + completion + recap + handoff',
      sourceSection: 'completion card', visualTarget: 'm1Complete',
      checkpointId: 'm1cp2', gateType: 'post-pass', resumeAfterPass: true
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
