// TEST FIXTURE ONLY — NOT PRODUCTION CONTENT.
//
// Synthetic placeholder items for exercising the randomization/scoring
// engines in tests/certification-*.test.mjs. None of this wording is real
// AIMT exam content and none of it may ever be copied into
// functions/_lib/certification/content-bank.mjs. Every prompt below is
// deliberately generic ("Fixture prompt ...") so it cannot be mistaken for
// or reused as actual assessment language.

const DIFFICULTY_CYCLE = ['foundational', 'applied', 'applied', 'applied', 'advanced-synthesis', 'applied', 'applied'];

// Give every module a couple of domain-tagged items so Part-I-only top-up
// paths are exercisable, plus plenty of untagged "standard" items.
const MODULE_DOMAIN_TAGS = {
  1: ['D1'],
  2: ['D3'],
  3: ['D1'],
  4: ['D1', 'D2'],
  5: ['D2'],
  6: ['D1'],
  7: ['D2'],
  8: ['D2', 'D3'],
  9: ['D4'],
  10: ['D4'],
  11: ['D1'],
};

function buildKnowledgeBank() {
  const items = [];
  for (let moduleId = 1; moduleId <= 11; moduleId++) {
    for (let n = 0; n < 7; n++) {
      const id = `FIX-M${String(moduleId).padStart(2, '0')}-${n + 1}`;
      const difficulty = DIFFICULTY_CYCLE[n % DIFFICULTY_CYCLE.length];
      const domainTags = n < 2 ? MODULE_DOMAIN_TAGS[moduleId] || [] : [];
      items.push({
        id,
        version: 1,
        sourceModule: moduleId,
        sourceSection: `${moduleId}.${n + 1}`,
        competency: `fixture-competency-m${moduleId}-${n + 1}`,
        difficulty,
        criticalDomainEvidence: domainTags,
        prompt: `Fixture prompt for module ${moduleId}, item ${n + 1}.`,
        choices: ['Fixture choice A', 'Fixture choice B', 'Fixture choice C', 'Fixture choice D'],
        correctChoice: 0,
        rationale: 'Fixture rationale — not real content.',
        status: 'approved',
      });
    }
  }
  return items;
}

function buildCaseBank() {
  const domainPlan = [
    ['D1', 'D2'],
    ['D2'],
    ['D1'],
    ['D4'],
    ['D2'],
    ['D1'],
    [],
    ['D4'],
    ['D1'],
    ['D2'],
    [],
    ['D4'],
  ];
  return domainPlan.map((domains, idx) => ({
    id: `FIX-CASE-${String(idx + 1).padStart(2, '0')}`,
    version: 1,
    sourceModules: [1 + (idx % 11), 2 + (idx % 10)],
    competencies: [`fixture-case-competency-${idx + 1}`],
    criticalDomainEvidence: domains,
    scenario: `Fixture scenario ${idx + 1} — not real content.`,
    parts: [
      {
        id: `FIX-CASE-${idx + 1}-p1`,
        type: 'single-best-answer',
        prompt: 'Fixture case part prompt.',
        choices: ['Fixture A', 'Fixture B', 'Fixture C'],
        correctAnswer: 0,
      },
    ],
    scoring: { method: 'weighted-parts', weights: [1] },
    criticalFlags: [],
    status: 'approved',
  }));
}

function buildInterviewBank() {
  const domainPlan = [['D1'], ['D2'], ['D3'], ['D1'], ['D2'], ['D3'], [], ['D4'], ['D1']];
  return domainPlan.map((domains, idx) => ({
    id: `FIX-INT-${String(idx + 1).padStart(2, '0')}`,
    version: 1,
    sourceModules: [1 + (idx % 11)],
    competencies: [`fixture-interview-competency-${idx + 1}`],
    criticalDomainEvidence: domains,
    primaryPrompt: `Fixture interview prompt ${idx + 1} — not real content.`,
    allowedFollowUp: true,
    rubricCriteria: [
      { id: 'c1', label: 'Fixture criterion 1', guidance: 'Fixture guidance.', criticalDomainEvidence: domains },
      { id: 'c2', label: 'Fixture criterion 2', guidance: 'Fixture guidance.', criticalDomainEvidence: [] },
      { id: 'c3', label: 'Fixture criterion 3', guidance: 'Fixture guidance.', criticalDomainEvidence: [] },
      { id: 'c4', label: 'Fixture criterion 4', guidance: 'Fixture guidance.', criticalDomainEvidence: [] },
      { id: 'c5', label: 'Fixture criterion 5', guidance: 'Fixture guidance.', criticalDomainEvidence: domains },
    ],
    criticalFlags: [],
    status: 'approved',
  }));
}

export const fixtureKnowledgeBank = buildKnowledgeBank();
export const fixtureCaseBank = buildCaseBank();
export const fixtureInterviewBank = buildInterviewBank();

export function getFixtureBanks() {
  return {
    knowledgeBank: fixtureKnowledgeBank,
    caseBank: fixtureCaseBank,
    interviewBank: fixtureInterviewBank,
  };
}
