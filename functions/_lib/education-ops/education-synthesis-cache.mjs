/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — exact-artifact persistence
   ---------------------------------------------------------------
   THE FIX (originating task, Phase 4): during telogen-effluvium
   development, the hand-run CLI performed one synthesis call while
   previewing a result, then an entirely INDEPENDENT second synthesis
   call when --write was passed -- meaning the exact artifact a human
   validated was not necessarily the exact artifact persisted (two
   separate model calls against the same evidence can legitimately
   produce different output; this was caught and disclosed at the time,
   not silently accepted).

   The contract here is structural, not just disciplinary:
     - prepareTopicArtifact() is the ONLY function in this module that
       can invoke a synthesis call. It runs synthesis EXACTLY ONCE,
       validates the result, and -- only if AUTO_READY -- builds the
       exact clearance record (fingerprint, brief, everything) from
       THAT SAME in-memory pipeline result. It returns one immutable
       "prepared artifact" object.
     - publishPreparedArtifact() NEVER imports or references
       runSynthesisPipeline, publication-synthesis-client.mjs, or any
       other model-calling module. It is physically incapable of
       triggering a new synthesis call -- not because it chooses not
       to, but because the code path does not exist here. It only ever
       re-verifies the ALREADY-BUILT record's own integrity (pure, no
       I/O) and persists exactly that record via the existing guarded
       writers (publication-clearance-writer.mjs).
     - A prepared artifact can be serialized to disk between the
       `--prepare` and `--publish` CLI invocations (see
       scripts/education-operations-cycle.mjs) so the two phases can
       run as separate processes/workflow steps without ever
       re-deriving the artifact -- the file IS the artifact, not a
       description of it.
   ═══════════════════════════════════════════════════════════════ */

import { runSynthesisPipeline } from '../research/publication-synthesis-orchestrator.mjs';
import { buildSynthesisEvidenceBundle, buildPageEvidenceBrief } from '../research/publication-synthesis-evidence.mjs';
import { POST_SYNTHESIS_VALIDATOR_VERSION } from '../research/publication-synthesis-validator.mjs';
import { buildEvidenceFingerprintArtifact, verifyStoredClearanceIntegrity } from '../research/publication-clearance-fingerprint.mjs';
import { buildAutoReadyClearanceRecord, ClearanceIneligibleError } from '../research/publication-clearance.mjs';

export class SynthesisCacheError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SynthesisCacheError';
  }
}

/**
 * Runs synthesis EXACTLY ONCE and, only if the result is a validated
 * AUTO_READY, builds the exact clearance record from that one result.
 * This is the ONLY function in this module (or, by design, in the
 * whole education-ops publish path) that may call a synthesis
 * function.
 *
 * @param {Object} env
 * @param {{topicSlug: string, controlledTopic: string|null, v1Result: object, pageIntent: object, evidenceRows: {claims: object[], sources: object[]}}} args
 * @param {{synthesizeFn?: Function}} [fns] - injectable for tests; defaults
 *   to the real runSynthesisPipeline
 * @returns {Promise<{
 *   ok: boolean,
 *   status: string,
 *   preparedArtifact: object|null,
 *   pipelineMetrics: object,
 *   reason: string|null
 * }>}
 */
export async function prepareTopicArtifact(env, { topicSlug, controlledTopic = null, v1Result, pageIntent, evidenceRows }, fns = {}) {
  const synthesizeFn = fns.synthesizeFn || runSynthesisPipeline;

  const evidenceBundle = buildSynthesisEvidenceBundle(v1Result.synthesis_packet, evidenceRows || { claims: [], sources: [] });
  const pipelineResult = await synthesizeFn(env, { topic_slug: topicSlug, v1Result, evidenceBundle });

  if (pipelineResult.status !== 'AUTO_READY') {
    return {
      ok: false,
      status: pipelineResult.status,
      preparedArtifact: null,
      pipelineMetrics: pipelineResult.metrics,
      reason: pipelineResult.reason || null,
      violations: pipelineResult.violations || null,
      humanReviewJustification: pipelineResult.finalOutput ? pipelineResult.finalOutput.human_review_justification : null,
    };
  }

  const brief = buildPageEvidenceBrief({
    v1Result,
    pageIntent,
    evidenceBundle,
    aiOutput: pipelineResult.finalOutput,
    modelInfo: pipelineResult.metrics.model_info,
    validatorVersion: POST_SYNTHESIS_VALIDATOR_VERSION,
  });
  const fingerprintArtifact = await buildEvidenceFingerprintArtifact(topicSlug, brief);

  let record;
  try {
    record = buildAutoReadyClearanceRecord({
      topicSlug, controlledTopic, v1Result, pipelineStatus: pipelineResult.status,
      pageEvidenceBrief: brief, fingerprintArtifact,
    });
  } catch (err) {
    if (err instanceof ClearanceIneligibleError) {
      return { ok: false, status: 'CLEARANCE_INELIGIBLE', preparedArtifact: null, pipelineMetrics: pipelineResult.metrics, reason: err.message };
    }
    throw err;
  }

  const integrity = await verifyStoredClearanceIntegrity(record);
  if (!integrity.valid) {
    return { ok: false, status: 'INTEGRITY_FAILED', preparedArtifact: null, pipelineMetrics: pipelineResult.metrics, reason: integrity.violations.join(', ') };
  }

  return {
    ok: true,
    status: 'AUTO_READY',
    preparedArtifact: {
      topic_slug: topicSlug,
      record,
      integrity,
      finalOutput: pipelineResult.finalOutput,
      prepared_at: new Date().toISOString(),
    },
    pipelineMetrics: pipelineResult.metrics,
    reason: null,
  };
}

/**
 * Consumes an ALREADY-PREPARED artifact (from prepareTopicArtifact(),
 * possibly round-tripped through JSON on disk between CLI invocations)
 * and persists it. Deliberately does not import runSynthesisPipeline or
 * any synthesis-client module -- see module header.
 *
 * @param {object} preparedArtifact
 * @param {{writeFn: (record: object) => Promise<object[]>}} io - the
 *   caller supplies the actual writer (e.g. writeClearanceRecord for a
 *   first-ever write, or replaceNonPublicClearanceRecord for a replace)
 *   so this module stays agnostic to which guarded writer applies.
 * @returns {Promise<{ok: boolean, written: object[]|null, reason: string|null}>}
 */
export async function publishPreparedArtifact(preparedArtifact, io) {
  if (!preparedArtifact || !preparedArtifact.record) {
    return { ok: false, written: null, reason: 'No prepared artifact supplied.' };
  }
  // Re-verify integrity on the artifact as actually received (e.g. after
  // a disk round-trip) -- pure, no I/O, no model call.
  const integrity = await verifyStoredClearanceIntegrity(preparedArtifact.record);
  if (!integrity.valid) {
    return { ok: false, written: null, reason: `Prepared artifact failed re-verification: ${integrity.violations.join(', ')}` };
  }
  const written = await io.writeFn(preparedArtifact.record);
  return { ok: true, written, reason: null };
}
