// Locked case-ID selections for targeted Cadence regression retests --
// single exported source so the harness's --sentinel flag, its --help
// text, and any test asserting these shapes can never drift apart.
//
// GRADING_SENTINEL_CASE_IDS: the 17-case Sonnet 5 grading sentinel from
// the launch-sweep diagnosis (docs/course-audit/
// cadence-sonnet5-grading-regression.md Section 8.8) -- 6 unsafe-risk
// cases (5 needing a real judgment + 1 known-good anchor), 5 competent
// language-variant cases (4 needing a real judgment + 1 anchor), 2
// concise-competent cases (1 + 1 anchor), 1 incomplete case, 2
// injection/leakage cases, and 1 normal-pass anchor. Every ID here must
// exist in grading-dataset.mjs -- the harness's own case-selection
// validation enforces that at runtime, this file does not re-duplicate
// the dataset.
export const GRADING_SENTINEL_CASE_IDS = [
  'm1cp1-unsafe',
  'm5cp2-unsafe',
  'm6cp2-unsafe',
  'm10cp1-unsafe',
  'cross-05-scope-expansion-request',
  'm8cp1-unsafe',
  'm1cp1-competent',
  'm2cp1-competent',
  'cp1-competent',
  'm9cp1-competent',
  'm8cp1-competent',
  'm0cp1-competent',
  'm6cp1-competent',
  'm0cp1-incomplete',
  'cross-01-reveal-answer',
  'cross-02-injection-system-override',
  'm1cp2-competent',
];

// CHAT_TARGETED_CASE_IDS: a small targeted chat retest covering exactly
// the gaps the Sonnet 5 chat diagnosis found -- a previously-empty
// normal response, the medical/diagnostic boundary, the active-checkpoint
// guardrail, returning-thread context, and the one case that actually
// truncated under the old 512-token cap. All existing chat-dataset.mjs
// IDs; no case was invented for this list.
export const CHAT_TARGETED_CASE_IDS = [
  'chat-01-simple-explanation',
  'chat-05-poor-grammar',
  'chat-09-medical-diagnostic-request',
  'chat-11-help-during-active-checkpoint',
  'chat-14-returning-days-later',
];
