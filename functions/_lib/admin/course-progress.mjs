// Admin-visible course progress for the Head Spa Certification course.
//
// Progress is completed instructional modules out of 12 (Modules 0–11),
// counted with the same rule as the authoritative completion gate
// (functions/_lib/certification/auth.mjs#hasCompletedInstructionalModules):
// a module counts only when state.progress[id].complete === true. Module 12
// (the Final Certification Assessment) is NOT part of this percentage —
// certification status is reported separately from completions /
// certification_attempts.
//
// course_progress.progress_score is deliberately NOT used here. It is an
// internal, monotonic cross-device sync-ranking metric (see
// assets/js/aimt-progress-sync.js#computeScore: +100 per complete module,
// +5/+1 per passed/attempted checkpoint, +10 intro), not a percentage and
// not a completion authority — e.g. a fully complete student scores ~1320.

export const INSTRUCTIONAL_MODULE_COUNT = 12; // Modules 0–11

export function instructionalProgress(state) {
  const progress = state && typeof state === 'object' && state.progress && typeof state.progress === 'object'
    ? state.progress
    : {};
  let completed = 0;
  for (let moduleId = 0; moduleId < INSTRUCTIONAL_MODULE_COUNT; moduleId++) {
    const mod = progress[String(moduleId)];
    if (mod && mod.complete === true) completed++;
  }
  return {
    completed,
    total: INSTRUCTIONAL_MODULE_COUNT,
    percent: Math.round((completed / INSTRUCTIONAL_MODULE_COUNT) * 100),
  };
}

// "Has the student started?" — real recorded activity in the synced state:
// a completed or started module, any checkpoint attempt, or a completed
// course intro. (The default state pre-creates every module with
// complete:false, so the mere presence of module keys is not activity.)
// Used only for the Admin Enrolled / In progress pill; never eligibility.
export function hasCourseActivity(state) {
  if (!state || typeof state !== 'object') return false;
  if (state.student && state.student.introComplete) return true;
  const progress = state.progress && typeof state.progress === 'object' ? state.progress : {};
  return Object.values(progress).some((mod) => {
    if (!mod || typeof mod !== 'object') return false;
    if (mod.complete === true || mod.startedAt) return true;
    const cps = mod.checkpointMeta && typeof mod.checkpointMeta === 'object' ? mod.checkpointMeta : {};
    return Object.values(cps).some((cp) => cp && cp.status);
  });
}
