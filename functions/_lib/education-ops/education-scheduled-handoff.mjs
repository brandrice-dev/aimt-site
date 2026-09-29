/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations — scheduled shadow→publish handoff
   ---------------------------------------------------------------
   PURE decision helpers for the final autonomous activation. They do
   not call models, GitHub, Supabase, or the network. Their only job is
   to validate the triggering scheduled source run and decide whether
   one exact shadow run report authorizes publication of one exact topic.
   ═══════════════════════════════════════════════════════════════ */

import { RUN_FINAL_STATE } from './education-run-ledger.mjs';

const VALID_FINAL_STATES = new Set(Object.values(RUN_FINAL_STATE));
const TOPIC_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateScheduledSourceRun(source) {
  const violations = [];
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return { ok: false, violations: ['SOURCE_RUN_NOT_OBJECT'] };
  }
  if (source.workflow_name !== 'AIMT Education Operations') violations.push('SOURCE_WORKFLOW_NAME_MISMATCH');
  if (source.conclusion !== 'success') violations.push('SOURCE_RUN_NOT_SUCCESS');
  if (source.event !== 'schedule') violations.push('SOURCE_RUN_NOT_SCHEDULED');
  if (source.head_branch !== 'main') violations.push('SOURCE_HEAD_BRANCH_NOT_MAIN');
  if (!source.repository || !source.expected_repository || source.repository !== source.expected_repository) {
    violations.push('SOURCE_REPOSITORY_MISMATCH');
  }
  return { ok: violations.length === 0, violations };
}

export function decideScheduledEducationHandoff(report) {
  if (!report || typeof report !== 'object' || Array.isArray(report)) {
    throw new Error('Scheduled handoff report must be one JSON object.');
  }
  if (typeof report.final_state !== 'string' || !VALID_FINAL_STATES.has(report.final_state)) {
    throw new Error(`Scheduled handoff report has unrecognized final_state "${report.final_state}".`);
  }

  if (report.final_state !== RUN_FINAL_STATE.SHADOW_CANDIDATE_READY) {
    return { should_publish: false, topic: null };
  }

  if (typeof report.selected_topic !== 'string' || !TOPIC_SLUG_RE.test(report.selected_topic)) {
    throw new Error('SHADOW_CANDIDATE_READY requires a valid non-empty selected_topic slug.');
  }

  return { should_publish: true, topic: report.selected_topic };
}
