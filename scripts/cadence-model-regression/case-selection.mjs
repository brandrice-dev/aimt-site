// Pure, dependency-free case-ID selection for the Cadence regression
// harness's --cases/--sentinel filtering. Never mutates the dataset it's
// given -- always returns a new filtered array, so the underlying
// GRADING_DATASET/CHAT_DATASET exports stay exactly as authored.

export class CaseSelectionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CaseSelectionError';
  }
}

/**
 * @param {Array<{id: string}>} dataset
 * @param {string[]|null} ids - null/undefined means "no filter, use the whole dataset"
 * @returns {{selected: Array, filtered: boolean}}
 */
export function selectCases(dataset, ids) {
  if (ids == null) return { selected: dataset, filtered: false };

  const uniqueIds = [...new Set(ids)];
  if (!uniqueIds.length) {
    throw new CaseSelectionError('Case selection is empty -- provide at least one case ID via --cases or --sentinel.');
  }

  const validIds = new Set(dataset.map((c) => c.id));
  const unknownIds = uniqueIds.filter((id) => !validIds.has(id));
  if (unknownIds.length) {
    throw new CaseSelectionError(
      `Unknown case ID(s): ${unknownIds.join(', ')}. Check the "id" field in the dataset this role uses ` +
      `(scripts/cadence-model-regression/grading-dataset.mjs or chat-dataset.mjs).`
    );
  }

  const idSet = new Set(uniqueIds);
  const selected = dataset.filter((c) => idSet.has(c.id));
  return { selected, filtered: true };
}
