// The 22 checkpoints, mapped to (a) their real student-facing module slot
// (per docs/course-audit/00-cadence-checkpoint-gate-map.md -- note the
// Module 9<->10 id/slot swap is preserved exactly, not "fixed") and (b)
// which rubric object/key in headspa-mastery.html defines them. Read-only
// map; carries no rubric text itself -- load-checkpoint-rubrics.mjs is the
// only place that touches the real rubric strings.

export const CHECKPOINT_MAP = [
  { checkpointId: 'm0cp1', moduleSlot: '0', rubricVar: 'M0', singleSystem: true },
  { checkpointId: 'm1cp1', moduleSlot: '1', rubricVar: 'M1', singleSystem: false },
  { checkpointId: 'm1cp2', moduleSlot: '1', rubricVar: 'M1', singleSystem: false },
  { checkpointId: 'm2cp1', moduleSlot: '2', rubricVar: 'M2', singleSystem: false },
  { checkpointId: 'cp1', moduleSlot: '3', rubricVar: 'M3', singleSystem: false },
  { checkpointId: 'cp2', moduleSlot: '3', rubricVar: 'M3', singleSystem: false },
  { checkpointId: 'm4cp1', moduleSlot: '4', rubricVar: 'M4', singleSystem: false },
  { checkpointId: 'm4cp2', moduleSlot: '4', rubricVar: 'M4', singleSystem: false },
  { checkpointId: 'm5cp1', moduleSlot: '5', rubricVar: 'M5', singleSystem: false },
  { checkpointId: 'm5cp2', moduleSlot: '5', rubricVar: 'M5', singleSystem: false },
  { checkpointId: 'm6cp1', moduleSlot: '6', rubricVar: 'M6', singleSystem: false },
  { checkpointId: 'm6cp2', moduleSlot: '6', rubricVar: 'M6', singleSystem: false },
  { checkpointId: 'm7cp1', moduleSlot: '7', rubricVar: 'M7', singleSystem: false },
  { checkpointId: 'm7cp2', moduleSlot: '7', rubricVar: 'M7', singleSystem: false },
  { checkpointId: 'm8cp1', moduleSlot: '8', rubricVar: 'M8', singleSystem: false },
  { checkpointId: 'm8cp2', moduleSlot: '8', rubricVar: 'M8', singleSystem: false },
  // Module 9<->10 historical swap, preserved exactly (gate map footnote 1):
  // m10cp1/m10cp2 (authored for the old "Module 10") now belong to
  // student-facing Module 9; m9cp1/m9cp2 now belong to student-facing
  // Module 10. Do not "fix" this mapping.
  { checkpointId: 'm10cp1', moduleSlot: '9', rubricVar: 'M10', singleSystem: false },
  { checkpointId: 'm10cp2', moduleSlot: '9', rubricVar: 'M10', singleSystem: false },
  { checkpointId: 'm9cp1', moduleSlot: '10', rubricVar: 'M9', singleSystem: false },
  { checkpointId: 'm9cp2', moduleSlot: '10', rubricVar: 'M9', singleSystem: false },
  { checkpointId: 'm11cp1', moduleSlot: '11', rubricVar: 'M11', singleSystem: false },
  { checkpointId: 'm11cp2', moduleSlot: '11', rubricVar: 'M11', singleSystem: false },
];

export function findCheckpointMapEntry(checkpointId) {
  const entry = CHECKPOINT_MAP.find((c) => c.checkpointId === checkpointId);
  if (!entry) throw new Error(`Unknown checkpointId in CHECKPOINT_MAP: ${checkpointId}`);
  return entry;
}

/** Resolves { question, system } for one checkpoint from the loaded rubric objects (see load-checkpoint-rubrics.mjs). */
export function resolveCheckpointDefinition(rubrics, checkpointId) {
  const entry = findCheckpointMapEntry(checkpointId);
  const rubricObj = rubrics[entry.rubricVar];
  if (!rubricObj) throw new Error(`Rubric object ${entry.rubricVar} not loaded`);
  const question = rubricObj.questions[checkpointId];
  const system = entry.singleSystem ? rubricObj.system : rubricObj.systems[checkpointId];
  if (!question || !system) throw new Error(`Missing question/system for checkpoint ${checkpointId} in ${entry.rubricVar}`);
  return { moduleSlot: entry.moduleSlot, question, system };
}
