// AIMT Publication Editor v2 — deterministic unit tests for the
// post-synthesis validator (functions/_lib/research/publication-
// synthesis-validator.mjs). SHADOW MODE, NO LIVE/MODEL CALLS: every
// fixture here is synthetic and inline; the validator is pure, so this
// suite never touches the network, Supabase, or the Anthropic API.
//
// Run: node tests/research-publication-synthesis-validator.test.mjs

import {
  validateSchemaShape,
  validateSynthesisOutput,
  determineShadowDisposition,
} from '../functions/_lib/research/publication-synthesis-validator.mjs';
import { RISK_TIER, READINESS_STATUS } from '../functions/_lib/research/publication-readiness.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

function makeClaim(overrides = {}) {
  return {
    claim_id: 'c1',
    claim_text: 'The hair follicle cycles through anagen, catagen, and telogen phases.',
    source_id: 's1',
    claim_type: 'finding',
    direction: 'descriptive',
    population_or_scope: null,
    page_or_section_locator: null,
    claim_origin: 'primary_text',
    verification_status: 'CLAIM_VERIFIED',
    use_status: 'active',
    ...overrides,
  };
}

function makeSource(overrides = {}) {
  return {
    source_id: 's1',
    title: 'A Reference on Hair Cycling',
    authors: ['Smith J'],
    year: 2022,
    date_published: null,
    source_venue: 'Journal of Trichology',
    doi: '10.1/hair-cycle',
    pmid: null,
    pmcid: null,
    url: null,
    evidence_type: 'narrative_review',
    source_role: 'synthesis',
    ...overrides,
  };
}

function baselineBundle() {
  return {
    claims: [
      makeClaim({ claim_id: 'c1', claim_type: 'finding', source_id: 's1' }),
      makeClaim({ claim_id: 'c2', claim_type: 'limitation', source_id: 's1' }),
      makeClaim({ claim_id: 'c3', claim_type: 'finding', source_id: 's2', direction: 'supports_effect' }),
    ],
    sources: [
      makeSource({ source_id: 's1' }),
      makeSource({ source_id: 's2', title: 'A Treatment-Effect Study' }),
    ],
  };
}

function baselineV1Result(overrides = {}) {
  return {
    topic_slug: 'hair-cycle',
    risk_tier: RISK_TIER.LOWER,
    readiness_status: READINESS_STATUS.NEEDS_SYNTHESIS,
    evidence_gaps: [],
    conflict_flags: ['POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS'],
    synthesis_packet: {
      controlled_topics: ['hair-cycle'],
      candidate_claim_ids: ['c1', 'c2', 'c3'],
      candidate_source_ids: ['s1', 's2'],
      safety_claim_ids: [],
      synthesis_required_flags: ['POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS'],
    },
    ...overrides,
  };
}

function baselineAiOutput(overrides = {}) {
  return {
    topic_slug: 'hair-cycle',
    page_concept: 'The Hair Growth Cycle',
    recommended_disposition: 'AUTO_READY',
    confidence: 'high',
    page_scope: { include: ['follicular cycling'], exclude: ['treatment effects'] },
    selected_claims: [
      { claim_id: 'c1', role: 'core_finding', reason: 'Describes the normal cycle phases.' },
      { claim_id: 'c2', role: 'limitation', reason: 'Notes a caveat on cycle timing variability.' },
    ],
    excluded_claims: [
      { claim_id: 'c3', reason_code: 'OUT_OF_SCOPE_TREATMENT_OR_INTERVENTION', reason: 'Concerns a treatment effect, not normal cycle biology.' },
    ],
    resolved_synthesis_signals: [
      { signal: 'supports_effect finding present', resolution: 'Addresses an unrelated treatment intervention, not normal cycle biology.', claim_ids: ['c3'] },
    ],
    unresolved_issues: [],
    public_framing: {
      core_points: [{ statement: 'Hair follicles cycle through anagen, catagen, and telogen.', supporting_claim_ids: ['c1'] }],
      limitations: [{ statement: 'Cycle timing varies by individual.', supporting_claim_ids: ['c2'] }],
      scope_note: 'This page does not cover treatment efficacy.',
    },
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 1. Valid lower-risk synthesis -> AUTO_READY
// ─────────────────────────────────────────────────────────────────────────
(function testValidLowerRiskAutoReady() {
  const v1Result = baselineV1Result();
  const evidenceBundle = baselineBundle();
  const aiOutput = baselineAiOutput();
  const validation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput });
  const disposition = determineShadowDisposition({ v1Result, callFailed: false, aiOutput, validation });

  check('VALID_LOWER_RISK', 'schema valid', validation.schemaValid);
  check('VALID_LOWER_RISK', 'no violations', validation.valid, JSON.stringify(validation.violations));
  check('VALID_LOWER_RISK', 'disposition is AUTO_READY', disposition.status === 'AUTO_READY', disposition.status);
})();

// ─────────────────────────────────────────────────────────────────────────
// 2. Nonexistent claim ID -> reject
// ─────────────────────────────────────────────────────────────────────────
(function testNonexistentClaimIdRejected() {
  const v1Result = baselineV1Result();
  const evidenceBundle = baselineBundle();
  const aiOutput = baselineAiOutput({
    selected_claims: [
      { claim_id: 'c1', role: 'core_finding', reason: 'ok' },
      { claim_id: 'c2', role: 'limitation', reason: 'ok' },
      { claim_id: 'c999-does-not-exist', role: 'core_finding', reason: 'hallucinated' },
    ],
  });
  const validation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput });
  check('NONEXISTENT_CLAIM_ID', 'rejected', !validation.valid);
  check('NONEXISTENT_CLAIM_ID', 'violation names the exact ID', validation.violations.includes('SELECTED_CLAIM_NOT_IN_EVIDENCE_BUNDLE:c999-does-not-exist'), JSON.stringify(validation.violations));
})();

// ─────────────────────────────────────────────────────────────────────────
// 3. Unverified claim selected -> reject
// ─────────────────────────────────────────────────────────────────────────
(function testUnverifiedClaimSelectedRejected() {
  const v1Result = baselineV1Result();
  const evidenceBundle = baselineBundle();
  evidenceBundle.claims[0] = makeClaim({ claim_id: 'c1', verification_status: 'DISCOVERED' });
  const aiOutput = baselineAiOutput();
  const validation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput });
  check('UNVERIFIED_CLAIM_SELECTED', 'rejected', !validation.valid);
  check('UNVERIFIED_CLAIM_SELECTED', 'names candidacy failure', validation.violations.includes('SELECTED_CLAIM_FAILS_CANDIDACY:c1'), JSON.stringify(validation.violations));
})();

// ─────────────────────────────────────────────────────────────────────────
// 4. Excluded (use_status) claim selected -> reject
// ─────────────────────────────────────────────────────────────────────────
(function testExcludedUseStatusClaimSelectedRejected() {
  const v1Result = baselineV1Result();
  const evidenceBundle = baselineBundle();
  evidenceBundle.claims[0] = makeClaim({ claim_id: 'c1', use_status: 'excluded' });
  const aiOutput = baselineAiOutput();
  const validation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput });
  check('EXCLUDED_USE_STATUS_SELECTED', 'rejected', !validation.valid);
  check('EXCLUDED_USE_STATUS_SELECTED', 'names candidacy failure', validation.violations.includes('SELECTED_CLAIM_FAILS_CANDIDACY:c1'), JSON.stringify(validation.violations));
})();

// ─────────────────────────────────────────────────────────────────────────
// 5. Core point without supporting claims -> reject
// ─────────────────────────────────────────────────────────────────────────
(function testCorePointWithoutSupportRejected() {
  const v1Result = baselineV1Result();
  const evidenceBundle = baselineBundle();
  const aiOutput = baselineAiOutput({
    public_framing: {
      core_points: [{ statement: 'Unsupported claim about cycling.', supporting_claim_ids: [] }],
      limitations: [{ statement: 'Cycle timing varies.', supporting_claim_ids: ['c2'] }],
      scope_note: 'n/a',
    },
  });
  const validation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput });
  check('CORE_POINT_NO_SUPPORT', 'rejected', !validation.valid);
  check('CORE_POINT_NO_SUPPORT', 'names the rule', validation.violations.includes('CORE_POINT_WITHOUT_SUPPORT'), JSON.stringify(validation.violations));
})();

// ─────────────────────────────────────────────────────────────────────────
// 6. Supporting claim not selected -> reject
// ─────────────────────────────────────────────────────────────────────────
(function testSupportingClaimNotSelectedRejected() {
  const v1Result = baselineV1Result();
  const evidenceBundle = baselineBundle();
  const aiOutput = baselineAiOutput({
    public_framing: {
      core_points: [{ statement: 'Cycling claim.', supporting_claim_ids: ['c3'] }], // c3 was excluded, not selected
      limitations: [{ statement: 'Cycle timing varies.', supporting_claim_ids: ['c2'] }],
      scope_note: 'n/a',
    },
  });
  const validation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput });
  check('SUPPORTING_CLAIM_NOT_SELECTED', 'rejected', !validation.valid);
  check('SUPPORTING_CLAIM_NOT_SELECTED', 'names the rule', validation.violations.includes('SUPPORTING_CLAIM_NOT_SELECTED:c3'), JSON.stringify(validation.violations));
})();

// ─────────────────────────────────────────────────────────────────────────
// 7. Unresolved issue + AUTO_READY -> reject
// ─────────────────────────────────────────────────────────────────────────
(function testUnresolvedIssueWithAutoReadyRejected() {
  const v1Result = baselineV1Result();
  const evidenceBundle = baselineBundle();
  const aiOutput = baselineAiOutput({ unresolved_issues: ['Not sure if c3 truly conflicts.'] });
  const validation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput });
  const disposition = determineShadowDisposition({ v1Result, callFailed: false, aiOutput, validation });
  check('UNRESOLVED_PLUS_AUTO_READY', 'rejected', !validation.valid);
  check('UNRESOLVED_PLUS_AUTO_READY', 'names the rule', validation.violations.includes('UNRESOLVED_ISSUES_WITH_AUTO_READY'), JSON.stringify(validation.violations));
  check('UNRESOLVED_PLUS_AUTO_READY', 'final disposition is HUMAN_REVIEW, never AUTO_READY', disposition.status === 'HUMAN_REVIEW', disposition.status);
})();

// ─────────────────────────────────────────────────────────────────────────
// 8. HIGH-risk v1 input -> cannot AUTO_READY
// ─────────────────────────────────────────────────────────────────────────
(function testHighRiskCannotAutoReady() {
  const v1Result = baselineV1Result({ risk_tier: RISK_TIER.HIGH });
  const evidenceBundle = baselineBundle();
  const aiOutput = baselineAiOutput(); // model still says AUTO_READY -- must not be trusted
  const validation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput });
  const disposition = determineShadowDisposition({ v1Result, callFailed: false, aiOutput, validation });
  check('HIGH_RISK_INPUT', 'validator rejects', !validation.valid);
  check('HIGH_RISK_INPUT', 'names the rule', validation.violations.includes('HIGH_RISK_TOPIC_CANNOT_AUTO_CLEAR') && validation.violations.includes('HIGH_RISK_CANNOT_AUTO_READY'), JSON.stringify(validation.violations));
  check('HIGH_RISK_INPUT', 'final disposition is HUMAN_REVIEW', disposition.status === 'HUMAN_REVIEW', disposition.status);
})();

// ─────────────────────────────────────────────────────────────────────────
// 9. AI marks a claim excluded, then still cites it in public core points -> reject
// ─────────────────────────────────────────────────────────────────────────
(function testExcludedClaimReappearsRejected() {
  const v1Result = baselineV1Result();
  const evidenceBundle = baselineBundle();
  const aiOutput = baselineAiOutput({
    public_framing: {
      core_points: [
        { statement: 'Cycling claim.', supporting_claim_ids: ['c1'] },
        { statement: 'Sneaks in the treatment-effect claim anyway.', supporting_claim_ids: ['c3'] },
      ],
      limitations: [{ statement: 'Cycle timing varies.', supporting_claim_ids: ['c2'] }],
      scope_note: 'n/a',
    },
  });
  const validation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput });
  check('EXCLUDED_CLAIM_REAPPEARS', 'rejected', !validation.valid);
  check('EXCLUDED_CLAIM_REAPPEARS', 'names the rule', validation.violations.includes('EXCLUDED_CLAIM_REAPPEARS_IN_OUTPUT:c3'), JSON.stringify(validation.violations));
})();

// ─────────────────────────────────────────────────────────────────────────
// 10. Missing limitations -> reject
// ─────────────────────────────────────────────────────────────────────────
(function testMissingLimitationsRejected() {
  const v1Result = baselineV1Result();
  const evidenceBundle = baselineBundle();
  const aiOutput = baselineAiOutput({
    selected_claims: [
      { claim_id: 'c1', role: 'core_finding', reason: 'ok' },
      { claim_id: 'c2', role: 'core_finding', reason: 're-roled away from limitation' },
    ],
    public_framing: {
      core_points: [{ statement: 'Cycling claim.', supporting_claim_ids: ['c1'] }],
      limitations: [], // no limitations preserved despite one being available (c2)
      scope_note: 'n/a',
    },
  });
  const validation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput });
  check('MISSING_LIMITATIONS', 'rejected', !validation.valid);
  check('MISSING_LIMITATIONS', 'names the rule', validation.violations.includes('LIMITATIONS_NOT_PRESERVED'), JSON.stringify(validation.violations));
})();

// ─────────────────────────────────────────────────────────────────────────
// 11. Invalid schema -> reject
// ─────────────────────────────────────────────────────────────────────────
(function testInvalidSchemaRejected() {
  const shapeCheck = validateSchemaShape({ topic_slug: 'hair-cycle' }); // missing everything else
  check('INVALID_SCHEMA', 'rejected at shape layer', !shapeCheck.valid);
  check('INVALID_SCHEMA', 'names missing fields', shapeCheck.errors.some((e) => e.includes('recommended_disposition')), JSON.stringify(shapeCheck.errors));

  const v1Result = baselineV1Result();
  const evidenceBundle = baselineBundle();
  const validation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput: null });
  const disposition = determineShadowDisposition({ v1Result, callFailed: false, aiOutput: null, validation });
  check('INVALID_SCHEMA', 'validateSynthesisOutput reports schemaValid:false for null output', validation.schemaValid === false);
  check('INVALID_SCHEMA', 'disposition maps invalid schema to SYNTHESIS_FAILED', disposition.status === 'SYNTHESIS_FAILED', disposition.status);
})();

// ─────────────────────────────────────────────────────────────────────────
// 12. Hallucinated source ID -> reject (a claim's own source_id resolves
// to nothing in the evidence bundle's sources)
// ─────────────────────────────────────────────────────────────────────────
(function testHallucinatedSourceIdRejected() {
  const v1Result = baselineV1Result();
  const evidenceBundle = baselineBundle();
  evidenceBundle.claims[0] = makeClaim({ claim_id: 'c1', source_id: 's-hallucinated-does-not-exist' });
  const aiOutput = baselineAiOutput();
  const validation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput });
  check('HALLUCINATED_SOURCE', 'rejected', !validation.valid);
  check('HALLUCINATED_SOURCE', 'names the rule', validation.violations.includes('CITED_SOURCE_UNRESOLVED:s-hallucinated-does-not-exist'), JSON.stringify(validation.violations));
})();

// ─────────────────────────────────────────────────────────────────────────
// Additional coverage: model call failure never becomes AUTO_READY
// ─────────────────────────────────────────────────────────────────────────
(function testCallFailureNeverAutoReady() {
  const v1Result = baselineV1Result();
  const disposition = determineShadowDisposition({ v1Result, callFailed: true, callFailureReason: 'missing_api_key' });
  check('CALL_FAILURE', 'maps to SYNTHESIS_FAILED', disposition.status === 'SYNTHESIS_FAILED', disposition.status);
  check('CALL_FAILURE', 'never AUTO_READY', disposition.status !== 'AUTO_READY');
})();

(function testModelDeclaredHumanReviewRespected() {
  const v1Result = baselineV1Result();
  const evidenceBundle = baselineBundle();
  const aiOutput = baselineAiOutput({ recommended_disposition: 'HUMAN_REVIEW', confidence: 'low', unresolved_issues: ['Genuinely ambiguous.'] });
  const validation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput });
  const disposition = determineShadowDisposition({ v1Result, callFailed: false, aiOutput, validation });
  check('MODEL_DECLARED_HUMAN_REVIEW', 'schema/semantics valid on their own terms', validation.schemaValid && validation.valid, JSON.stringify(validation.violations));
  check('MODEL_DECLARED_HUMAN_REVIEW', 'final disposition respects HUMAN_REVIEW', disposition.status === 'HUMAN_REVIEW', disposition.status);
})();

(function testNonNeedsSynthesisV1ResultRejected() {
  const v1Result = baselineV1Result({ readiness_status: READINESS_STATUS.READY });
  const evidenceBundle = baselineBundle();
  const aiOutput = baselineAiOutput();
  const validation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput });
  check('NON_NEEDS_SYNTHESIS_INPUT', 'rejected', !validation.valid);
  check('NON_NEEDS_SYNTHESIS_INPUT', 'names the rule', validation.violations.includes('V1_RESULT_NOT_NEEDS_SYNTHESIS'), JSON.stringify(validation.violations));
})();

(function testUnaddressedSynthesisSignalRejected() {
  const v1Result = baselineV1Result();
  const evidenceBundle = baselineBundle();
  const aiOutput = baselineAiOutput({ resolved_synthesis_signals: [] }); // packet declared a signal, but model addressed nothing
  const validation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput });
  check('UNADDRESSED_SIGNAL', 'rejected', !validation.valid);
  check('UNADDRESSED_SIGNAL', 'names the rule', validation.violations.includes('SYNTHESIS_SIGNAL_NOT_ADDRESSED'), JSON.stringify(validation.violations));
})();

(function testMissingDispositionForABundleClaimRejected() {
  const v1Result = baselineV1Result();
  const evidenceBundle = baselineBundle();
  const aiOutput = baselineAiOutput({
    excluded_claims: [], // c3 never given any disposition at all
  });
  const validation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput });
  check('MISSING_DISPOSITION', 'rejected', !validation.valid);
  check('MISSING_DISPOSITION', 'names the rule', validation.violations.includes('CLAIM_MISSING_DISPOSITION:c3'), JSON.stringify(validation.violations));
})();

// ---- Report ----
const byFixture = new Map();
for (const r of results) {
  if (!byFixture.has(r.fixtureName)) byFixture.set(r.fixtureName, []);
  byFixture.get(r.fixtureName).push(r);
}
let anyFail = false;
for (const [fixtureName, checks] of byFixture) {
  const failed = checks.filter((c) => !c.pass);
  if (failed.length > 0) anyFail = true;
  console.log(`[${failed.length === 0 ? 'PASS' : 'FAIL'}] ${fixtureName} (${checks.length - failed.length}/${checks.length})`);
  for (const f of failed) console.log(`    FAILED: ${f.label}${f.detail ? ' — ' + f.detail : ''}`);
}
console.log(`\nTotal: ${results.length}, Passed: ${results.filter((r) => r.pass).length}, Failed: ${results.filter((r) => !r.pass).length}`);
if (anyFail) process.exitCode = 1;
