// AIMT Education Operations v1 — deterministic tests for the production
// publication manifest (functions/_lib/education-ops/
// education-publication-state.mjs). PURE aside from the Web-Crypto
// digest helper -- no network, no filesystem, no model call.
//
// Run: node tests/education-publication-state.test.mjs

import {
  PUBLICATION_STATE, PUBLICATION_MANIFEST_CONTRACT_VERSION,
  buildPublicationManifest, advancePublicationManifest, validatePublicationManifestShape,
  isManifestForSameCandidate, computePreparedArtifactDigest, determinePublicationResumeStage,
} from '../functions/_lib/education-ops/education-publication-state.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

function baselineArgs() {
  return {
    runId: 'publish-run-1', topicSlug: 'alopecia-areata', route: '/education/hair-loss/alopecia-areata',
    cluster: 'hair-loss-shedding', generationSourceHash: 'gsh-abc123', preparedArtifactDigest: 'd'.repeat(64),
    candidateOriginatingRunId: 'shadow-run-8',
  };
}

// ─────────────────────────────────────────────────────────────────────────
// computePreparedArtifactDigest
// ─────────────────────────────────────────────────────────────────────────
async function testDigestIsDeterministicAndOrderIndependent() {
  const a = { z: 1, a: { y: 2, x: [3, 4] } };
  const b = { a: { x: [3, 4], y: 2 }, z: 1 }; // same content, different key order
  const digestA = await computePreparedArtifactDigest(a);
  const digestB = await computePreparedArtifactDigest(b);
  check('DIGEST', 'digest is a 64-char lowercase hex string', /^[0-9a-f]{64}$/.test(digestA), digestA);
  check('DIGEST', 'key-order-independent objects hash identically', digestA === digestB);

  const c = { z: 1, a: { y: 2, x: [4, 3] } }; // genuinely different content
  const digestC = await computePreparedArtifactDigest(c);
  check('DIGEST', 'genuinely different content hashes differently', digestC !== digestA);
}

// ─────────────────────────────────────────────────────────────────────────
// buildPublicationManifest / advancePublicationManifest
// ─────────────────────────────────────────────────────────────────────────
function testBuildManifestDefaults() {
  const manifest = buildPublicationManifest(baselineArgs());
  check('BUILD_MANIFEST', 'contract_version is set', manifest.contract_version === PUBLICATION_MANIFEST_CONTRACT_VERSION);
  check('BUILD_MANIFEST', 'starts at PREPARED', manifest.state === PUBLICATION_STATE.PREPARED);
  check('BUILD_MANIFEST', 'publish_originating_run_id is the given runId', manifest.publish_originating_run_id === 'publish-run-1');
  check('BUILD_MANIFEST', 'candidate_originating_run_id is the given candidate run', manifest.candidate_originating_run_id === 'shadow-run-8');
  check('BUILD_MANIFEST', 'generated/merge/deployment/live_verification/clearance/db_publish all start unset', manifest.generated.pr_number === null && manifest.merge.merged === false && manifest.deployment.state === null && manifest.live_verification.passed === null && manifest.clearance.persisted === false && manifest.db_publish.attempted === false);
  check('BUILD_MANIFEST', 'last_failure starts null', manifest.last_failure === null);
}

function testAdvanceManifestNeverMutatesAndPreservesIdentity() {
  const manifest = buildPublicationManifest(baselineArgs());
  const before = JSON.stringify(manifest);
  const advanced = advancePublicationManifest(manifest, { state: PUBLICATION_STATE.PR_OPEN, generated: { pr_number: 42, branch: 'education-ops/publish-alopecia-areata' } });
  check('ADVANCE_MANIFEST', 'original manifest never mutated', JSON.stringify(manifest) === before);
  check('ADVANCE_MANIFEST', 'advanced is a different object', advanced !== manifest);
  check('ADVANCE_MANIFEST', 'state updated', advanced.state === PUBLICATION_STATE.PR_OPEN);
  check('ADVANCE_MANIFEST', 'generated merges (not replaces) -- pr_number set', advanced.generated.pr_number === 42);
  check('ADVANCE_MANIFEST', 'generated merges -- branch set', advanced.generated.branch === 'education-ops/publish-alopecia-areata');
  check('ADVANCE_MANIFEST', 'identifying fields never drift on advance', advanced.topic_slug === manifest.topic_slug && advanced.generation_source_hash === manifest.generation_source_hash && advanced.prepared_artifact_digest === manifest.prepared_artifact_digest && advanced.candidate_originating_run_id === manifest.candidate_originating_run_id);

  const advancedAgain = advancePublicationManifest(advanced, { generated: { pr_url: 'https://github.com/x/y/pull/42' } });
  check('ADVANCE_MANIFEST', 'a second advance preserves fields set by the first', advancedAgain.generated.pr_number === 42 && advancedAgain.generated.branch === 'education-ops/publish-alopecia-areata');
  check('ADVANCE_MANIFEST', 'a second advance adds the new field', advancedAgain.generated.pr_url === 'https://github.com/x/y/pull/42');

  const withFailure = advancePublicationManifest(advancedAgain, { lastFailure: { stage: 'DEPLOYMENT', reason: 'timeout', at: '2026-01-01T00:00:00.000Z' } });
  check('ADVANCE_MANIFEST', 'lastFailure sets last_failure', withFailure.last_failure && withFailure.last_failure.stage === 'DEPLOYMENT');
}

// ─────────────────────────────────────────────────────────────────────────
// validatePublicationManifestShape
// ─────────────────────────────────────────────────────────────────────────
async function testShapeValidPassesAndMalformedFailsClosed() {
  const manifest = buildPublicationManifest(baselineArgs());
  check('SHAPE_VALID', 'a freshly built manifest is shape-valid', validatePublicationManifestShape(manifest).valid === true);

  check('SHAPE_MALFORMED', 'null is not an object', validatePublicationManifestShape(null).valid === false);
  check('SHAPE_MALFORMED', 'wrong contract_version fails', validatePublicationManifestShape({ ...manifest, contract_version: 'wrong' }).violations.includes('UNSUPPORTED_CONTRACT_VERSION'));
  check('SHAPE_MALFORMED', 'non-hex digest fails', validatePublicationManifestShape({ ...manifest, prepared_artifact_digest: 'not-hex' }).violations.some((v) => v.includes('prepared_artifact_digest')));
  check('SHAPE_MALFORMED', 'unrecognized state fails', validatePublicationManifestShape({ ...manifest, state: 'MADE_UP' }).violations.some((v) => v.includes('state')));

  // A manifest claiming PR_OPEN-or-later with a half-recorded PR is corrupt.
  const halfRecorded = advancePublicationManifest(manifest, { state: PUBLICATION_STATE.PR_OPEN, generated: { pr_number: 7 } });
  check('SHAPE_MALFORMED', 'PR_OPEN with missing branch/expected_head_sha fails', validatePublicationManifestShape(halfRecorded).violations.includes('INCOMPLETE_GENERATED_PR_IDENTIFIERS_FOR_STATE'));

  const fullyRecorded = advancePublicationManifest(manifest, { state: PUBLICATION_STATE.PR_OPEN, generated: { pr_number: 7, branch: 'b', expected_head_sha: 'a'.repeat(40) } });
  check('SHAPE_VALID', 'PR_OPEN with a fully recorded PR is shape-valid', validatePublicationManifestShape(fullyRecorded).valid === true, JSON.stringify(validatePublicationManifestShape(fullyRecorded)));
}

// ─────────────────────────────────────────────────────────────────────────
// isManifestForSameCandidate
// ─────────────────────────────────────────────────────────────────────────
async function testConsistencyCheckCatchesAnyDrift() {
  const manifest = buildPublicationManifest(baselineArgs());
  const expected = { topicSlug: 'alopecia-areata', route: '/education/hair-loss/alopecia-areata', generationSourceHash: 'gsh-abc123', preparedArtifactDigest: 'd'.repeat(64) };
  check('CONSISTENCY', 'matching candidate matches', isManifestForSameCandidate(manifest, expected).matches === true);

  check('CONSISTENCY', 'a changed generation_source_hash (digest mismatch, section 3 -- artifact digest mismatch fails closed) is caught', isManifestForSameCandidate(manifest, { ...expected, generationSourceHash: 'different-hash' }).matches === false);
  check('CONSISTENCY', 'a changed prepared_artifact_digest is caught', isManifestForSameCandidate(manifest, { ...expected, preparedArtifactDigest: 'e'.repeat(64) }).matches === false);
  check('CONSISTENCY', 'a changed topic_slug is caught', isManifestForSameCandidate(manifest, { ...expected, topicSlug: 'other-topic' }).matches === false);
  check('CONSISTENCY', 'a changed route is caught', isManifestForSameCandidate(manifest, { ...expected, route: '/education/hair-loss/other' }).matches === false);
}

// ─────────────────────────────────────────────────────────────────────────
// determinePublicationResumeStage
// ─────────────────────────────────────────────────────────────────────────
function testResumeStageReflectsSubFieldsNotTopLevelState() {
  const fresh = buildPublicationManifest(baselineArgs());
  check('RESUME_STAGE', 'fresh manifest resumes at PREPARED', determinePublicationResumeStage(fresh) === PUBLICATION_STATE.PREPARED);

  const prOpen = advancePublicationManifest(fresh, { state: PUBLICATION_STATE.PR_OPEN, generated: { pr_number: 1 } });
  check('RESUME_STAGE', 'PR recorded resumes at PR_OPEN', determinePublicationResumeStage(prOpen) === PUBLICATION_STATE.PR_OPEN);

  const cleared = advancePublicationManifest(prOpen, { clearance: { persisted: true } });
  check('RESUME_STAGE', 'clearance persisted resumes at CLEARANCE_PERSISTED', determinePublicationResumeStage(cleared) === PUBLICATION_STATE.CLEARANCE_PERSISTED);

  const merged = advancePublicationManifest(cleared, { merge: { merged: true, merge_commit_sha: 'a'.repeat(40) } });
  check('RESUME_STAGE', 'merge.merged resumes at MERGED', determinePublicationResumeStage(merged) === PUBLICATION_STATE.MERGED);

  const liveVerified = advancePublicationManifest(merged, { liveVerification: { passed: true } });
  check('RESUME_STAGE', 'live_verification.passed resumes at LIVE_VERIFIED', determinePublicationResumeStage(liveVerified) === PUBLICATION_STATE.LIVE_VERIFIED);

  const published = advancePublicationManifest(liveVerified, { dbPublish: { verified: true } });
  check('RESUME_STAGE', 'db_publish.verified resumes at PUBLISHED', determinePublicationResumeStage(published) === PUBLICATION_STATE.PUBLISHED);

  // CRITICAL: a PUBLISH_FAILED top-level `state` (e.g. a deployment
  // timeout) must resume from where its sub-fields actually got to --
  // NEVER be treated as a dead end.
  const deployTimedOut = advancePublicationManifest(cleared, {
    state: PUBLICATION_STATE.PUBLISH_FAILED,
    merge: { merged: true, merge_commit_sha: 'b'.repeat(40) },
    deployment: { state: 'timeout' },
    lastFailure: { stage: 'DEPLOYMENT', reason: 'DEPLOYMENT_WAIT_TIMEOUT', at: '2026-01-01T00:00:00.000Z' },
  });
  check('RESUME_STAGE', 'a PUBLISH_FAILED manifest with merge.merged=true still resumes at MERGED (retryable, never a dead end)', determinePublicationResumeStage(deployTimedOut) === PUBLICATION_STATE.MERGED);

  const notYetMergedButMarkedFailed = advancePublicationManifest(prOpen, {
    state: PUBLICATION_STATE.PUBLISH_FAILED,
    lastFailure: { stage: 'PRE_MERGE_REVALIDATION', reason: 'PR_HEAD_MOVED', at: '2026-01-01T00:00:00.000Z' },
  });
  check('RESUME_STAGE', 'a PUBLISH_FAILED manifest that never got past PR_OPEN resumes at PR_OPEN', determinePublicationResumeStage(notYetMergedButMarkedFailed) === PUBLICATION_STATE.PR_OPEN);
}

// ---- Report ----
const tests = [
  testDigestIsDeterministicAndOrderIndependent,
  testBuildManifestDefaults,
  testAdvanceManifestNeverMutatesAndPreservesIdentity,
  testShapeValidPassesAndMalformedFailsClosed,
  testConsistencyCheckCatchesAnyDrift,
  testResumeStageReflectsSubFieldsNotTopLevelState,
];
for (const t of tests) await t();

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
