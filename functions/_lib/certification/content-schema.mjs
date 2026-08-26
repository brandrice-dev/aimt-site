// AIMT Head Spa — Module 12 final-exam content data contracts + client-safe
// projections. See docs/course-audit/00-aimt-certification-assessment-standard.md
// Section 16 ("Do not expose the bank") and the task instructions this file
// implements: the client must never receive correct choices, rationales, or
// grading rubrics — only what a given attempt needs to render the question.
//
// This file defines shape ONLY. Actual content lives in content-bank.mjs and
// remains CONTENT PENDING until the externally finalized 120/12/9 bank is
// installed in a later, separate task.

/**
 * @typedef {Object} KnowledgeItem
 * @property {string} id                       - Stable ID, e.g. "HS-FE-M04-003".
 * @property {string} version                  - Item version (bumped on any wording/answer change).
 * @property {number} sourceModule              - 1-11.
 * @property {string} sourceSection             - e.g. "4.6".
 * @property {string} competency                - Short competency label.
 * @property {'foundational'|'applied'|'advanced-synthesis'} difficulty
 * @property {string[]} criticalDomainEvidence  - Zero or more of ['D1','D2','D3','D4'].
 * @property {string} prompt
 * @property {string[]} choices                 - Exactly the answer choices, in bank order.
 * @property {number} correctChoice             - Index into `choices`. NEVER sent to client.
 * @property {string} rationale                 - NEVER sent to client during an attempt.
 * @property {'draft'|'approved'|'retired'} status
 */

/**
 * @typedef {Object} CasePart
 * @property {string} id
 * @property {'single-best-answer'|'multi-select'|'sequencing'|'classification'|'structured-short-response'} type
 * @property {string} prompt
 * @property {string[]} [choices]
 * @property {*} [correctAnswer]                - Shape depends on `type`. NEVER sent to client.
 * @property {Object} [rubric]                  - For structured-short-response only. NEVER sent to client.
 */

/**
 * @typedef {Object} CaseItem
 * @property {string} id
 * @property {string} version
 * @property {number[]} sourceModules
 * @property {string[]} competencies
 * @property {string[]} criticalDomainEvidence
 * @property {string} scenario
 * @property {CasePart[]} parts
 * @property {Object} scoring                   - Aggregation rule across parts. NEVER sent to client.
 * @property {Object[]} [criticalFlags]         - Explicit Type-A trigger definitions. NEVER sent to client.
 * @property {'draft'|'approved'|'retired'} status
 */

/**
 * @typedef {Object} RubricCriterion
 * @property {string} id
 * @property {string} label                      - Human-readable criterion name (internal).
 * @property {string} guidance                    - What 0/1/2 means for this criterion (internal, for Cadence).
 * @property {string[]} criticalDomainEvidence     - Domains this criterion provides evidence for.
 * @property {Object} [explicitUnsafeRule]         - Optional Type-A trigger description (internal).
 */

/**
 * @typedef {Object} InterviewItem
 * @property {string} id
 * @property {string} version
 * @property {number[]} sourceModules
 * @property {string[]} competencies
 * @property {string[]} criticalDomainEvidence
 * @property {string} primaryPrompt
 * @property {boolean} allowedFollowUp
 * @property {RubricCriterion[]} rubricCriteria
 * @property {Object[]} [criticalFlags]
 * @property {'draft'|'approved'|'retired'} status
 */

export function isApprovedForProduction(item) {
  return !!item && item.status === 'approved';
}

/** Strip everything a knowledge item's answer key would leak to the client. */
export function projectKnowledgeItemForClient(item) {
  return {
    id: item.id,
    prompt: item.prompt,
    choices: item.choices,
  };
}

/** Strip scoring/rubric/criticalFlags from a case before sending to the client. */
export function projectCaseForClient(item) {
  return {
    id: item.id,
    scenario: item.scenario,
    parts: item.parts.map((part) => ({
      id: part.id,
      type: part.type,
      prompt: part.prompt,
      choices: part.choices,
      // 'classification' parts render as a fixed category list per named
      // item rather than lettered choices -- categories/items carry no
      // answer-key information (correctAnswer is never included here), so
      // they are safe to send, and the client cannot render this part type
      // without them.
      categories: part.categories,
      items: part.items,
    })),
  };
}

/**
 * Strip rubric guidance/criticalFlags from an interview item before sending
 * to the client. The client only ever needs the primary prompt to render the
 * conversation opener; rubric criteria are evaluated server-side.
 */
export function projectInterviewItemForClient(item) {
  return {
    id: item.id,
    primaryPrompt: item.primaryPrompt,
    allowedFollowUp: item.allowedFollowUp,
  };
}

export function validateKnowledgeItemShape(item) {
  const errors = [];
  if (!item || typeof item !== 'object') return ['not an object'];
  if (!item.id) errors.push('missing id');
  if (!Number.isInteger(item.sourceModule) || item.sourceModule < 1 || item.sourceModule > 11) {
    errors.push('sourceModule out of range 1-11');
  }
  if (!['foundational', 'applied', 'advanced-synthesis'].includes(item.difficulty)) {
    errors.push('invalid difficulty');
  }
  if (!Array.isArray(item.choices) || item.choices.length < 2) {
    errors.push('choices must have at least 2 options');
  }
  if (
    !Number.isInteger(item.correctChoice) ||
    !Array.isArray(item.choices) ||
    item.correctChoice < 0 ||
    item.correctChoice >= (item.choices || []).length
  ) {
    errors.push('correctChoice must index into choices');
  }
  if (!Array.isArray(item.criticalDomainEvidence)) errors.push('criticalDomainEvidence must be an array');
  if (!['draft', 'approved', 'retired'].includes(item.status)) errors.push('invalid status');
  return errors;
}

export function validateCaseItemShape(item) {
  const errors = [];
  if (!item || typeof item !== 'object') return ['not an object'];
  if (!item.id) errors.push('missing id');
  if (!Array.isArray(item.sourceModules) || item.sourceModules.length < 2) {
    errors.push('a case must reference at least 2 source modules (cross-module by definition)');
  }
  if (!Array.isArray(item.parts) || item.parts.length === 0) errors.push('parts must be a non-empty array');
  if (!['draft', 'approved', 'retired'].includes(item.status)) errors.push('invalid status');
  return errors;
}

export function validateInterviewItemShape(item) {
  const errors = [];
  if (!item || typeof item !== 'object') return ['not an object'];
  if (!item.id) errors.push('missing id');
  if (!item.primaryPrompt) errors.push('missing primaryPrompt');
  if (!Array.isArray(item.rubricCriteria) || item.rubricCriteria.length === 0) {
    errors.push('rubricCriteria must be a non-empty array');
  }
  if (!['draft', 'approved', 'retired'].includes(item.status)) errors.push('invalid status');
  return errors;
}
