// AIMT Head Spa — Module 12 final-exam PRODUCTION content bank.
//
// STATUS: CONTENT PENDING.
//
// Per explicit task instruction: the raw Claude-generated exam wording in
// docs/course-audit/modules/module-12-final-exam-raw-blueprint.md is NOT
// approved for student-facing use and must NEVER be copied into this file.
// No substitute questions were generated to fill this bank either. This file
// defines the production loader contract and ships empty until the
// externally finalized 120 Knowledge questions / 12 Applied Cases / 9
// Practitioner Conversations are installed in a separate, later, explicitly
// authorized task.
//
// Every array below must contain only items with status: 'approved' before
// they can be selected into a real student attempt — see
// isApprovedForProduction() in content-schema.mjs and the filtering already
// enforced inside randomization.mjs. An empty bank is a valid, expected state
// that calling code (functions/api/certification/start-attempt.js) must
// handle gracefully rather than assume is a bug.

import { BANK_VERSION_PENDING } from './assessment-config.mjs';

export const CONTENT_STATUS = 'CONTENT_PENDING';

export const bankVersion = BANK_VERSION_PENDING;

/** @type {import('./content-schema.mjs').KnowledgeItem[]} */
export const knowledgeBank = [];

/** @type {import('./content-schema.mjs').CaseItem[]} */
export const caseBank = [];

/** @type {import('./content-schema.mjs').InterviewItem[]} */
export const interviewBank = [];

export function getProductionBanks() {
  return { knowledgeBank, caseBank, interviewBank, bankVersion, status: CONTENT_STATUS };
}

export function isBankReadyForProduction() {
  return knowledgeBank.length > 0 && caseBank.length > 0 && interviewBank.length > 0;
}
