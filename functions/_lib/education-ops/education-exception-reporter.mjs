/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — exception surfacing (GitHub Issues)
   ---------------------------------------------------------------
   A normal NO_OP_SUCCESS or PUBLISHED run must NEVER create an issue --
   only genuine exceptions (HIGH risk, HUMAN_REVIEW, writer/editorial
   fidelity failure, freshness change, missing credential, deployment
   failure, unexpected generated diff) do. This module is deliberately
   I/O-injected (listIssuesFn/createIssueFn), never calling the GitHub
   API directly itself, so it is fully testable with mocks and never
   fires a real request during this branch's own test run.

   Dedup: before creating an issue for (topic, reason_code), search for
   an already-OPEN issue with the same label + a title containing the
   same topic/reason marker. If found, do nothing (return it) rather
   than opening a duplicate.
   ═══════════════════════════════════════════════════════════════ */

export const EXCEPTION_LABELS = Object.freeze({
  RISK_OR_HUMAN_REVIEW: 'education-review',
  INFRA: 'education-infra',
  FRESHNESS: 'education-freshness',
  CONFIG: 'education-config',
});

// Maps a run's final_state (see education-run-ledger.mjs) to the label
// an exception issue for it should carry. States not listed here never
// produce an issue at all.
const FINAL_STATE_TO_LABEL = Object.freeze({
  HUMAN_REVIEW: EXCEPTION_LABELS.RISK_OR_HUMAN_REVIEW,
  EDITORIAL_REVIEW: EXCEPTION_LABELS.RISK_OR_HUMAN_REVIEW,
  INFRA_REVIEW: EXCEPTION_LABELS.INFRA,
  FRESHNESS_FLAGGED: EXCEPTION_LABELS.FRESHNESS,
  CONFIG_BLOCKED: EXCEPTION_LABELS.CONFIG,
  PUBLISH_FAILED: EXCEPTION_LABELS.INFRA,
});

export class ExceptionReporterError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ExceptionReporterError';
  }
}

/** Builds the dedup marker embedded in an issue title -- stable, greppable. */
export function buildDedupMarker(topicSlug, reasonCode) {
  return `[edu-ops:${topicSlug || 'none'}:${reasonCode}]`;
}

/**
 * @param {object} report - a buildRunReport() output (education-run-ledger.mjs)
 * @param {{
 *   listIssuesFn: (label: string) => Promise<Array<{number:number, title:string, state:string}>>,
 *   createIssueFn: (input: {title:string, body:string, labels:string[]}) => Promise<{number:number, title:string, url:string}>
 * }} io
 * @returns {Promise<{action: 'NONE'|'REUSED'|'CREATED', label: string|null, issue: object|null}>}
 */
export async function surfaceExceptionIfNeeded(report, io) {
  const label = FINAL_STATE_TO_LABEL[report.final_state];
  if (!label) return { action: 'NONE', label: null, issue: null };

  const marker = buildDedupMarker(report.selected_topic, report.exception_reason || report.final_state);
  const openIssues = await io.listIssuesFn(label);
  const existing = (openIssues || []).find((i) => i.state === 'open' && i.title.includes(marker));
  if (existing) return { action: 'REUSED', label, issue: existing };

  const title = `[${report.final_state}] ${report.selected_topic || 'education-operations'} ${marker}`;
  const body = [
    `**Run:** ${report.run_id}`,
    `**Final state:** ${report.final_state}`,
    `**Selected topic:** ${report.selected_topic || 'n/a'}`,
    `**Exception reason:** ${report.exception_reason || 'n/a'}`,
    `**Selection reason:** ${report.selection_reason || 'n/a'}`,
    '',
    'This issue was opened automatically by the AIMT Education Operations scheduler. See the run report artifact for full detail.',
  ].join('\n');

  const created = await io.createIssueFn({ title, body, labels: [label] });
  return { action: 'CREATED', label, issue: created };
}
