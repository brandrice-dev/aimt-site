#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   AIMT Automated Publication Clearance — parameterized runner
   ---------------------------------------------------------------
   GENERALIZATION TEST (seo/education-page-2-generalization): this is
   research-publication-clearance-shadow.mjs's exact logic, parameterized
   by `--topic <slug>` instead of a hardcoded TOPIC_SLUG constant. It is a
   NEW file, not a rewrite of that script -- the original hair-cycle
   pilot script stays exactly as it is, as the durable pilot-run record
   docs/research/AIMT-Automated-Publication-Clearance.md refers to. This
   file exists to answer one question: does the governed pipeline
   (v1 readiness -> v2.1 bounded synthesis -> clearance) actually
   generalize to a second, different topic/evidence shape without any
   change to the underlying library modules (publication-readiness.mjs,
   publication-synthesis-*.mjs, publication-clearance*.mjs)? It imports
   the exact same functions those files export -- zero duplicated logic,
   zero forked business rules.

   Every safety property of the original script is preserved unchanged:
     - Read-only against Supabase by default (GET-only loaders).
     - The only network write-shaped requests are the Anthropic synthesis
       calls, which write nothing to any AIMT system.
     - NOTHING is written to research_public_pages, research_claims, or
       research_sources unless --write is explicitly passed.
     - --write requires explicit, in-conversation owner authorization
       before the flag is ever passed, exactly like the original script's
       header documents -- this is a CLI convention this script does not
       relax.
     - --write can only ever produce clearance_mode='AUTO_READY',
       status='ready_for_page_builder' -- never 'published',
       never sitemap_eligible=true (see publication-clearance.mjs /
       publication-clearance-writer.mjs's ALLOWED_COLUMNS allow-list,
       unchanged here).

   Usage:
     node scripts/research-publication-clearance-run.mjs --topic <slug>
       [--live]                 fetch topic evidence from live Supabase
                                 (read-only; requires SUPABASE_URL +
                                 SUPABASE_SERVICE_ROLE_KEY)
       [--export-dir <dir>]     local validated export to read instead
       [--write]                actually persist the clearance record
                                 (requires explicit owner authorization --
                                 see module header). By default this is a
                                 plain upsert (writeClearanceRecord) -- only
                                 safe for a topic's FIRST clearance write.
       [--write --replace-nonpublic]
                                 for REPLACING an existing non-public row
                                 (e.g. after a corrected synthesis intent):
                                 reads the existing row, requires it to
                                 still be status=ready_for_page_builder /
                                 sitemap_eligible=false / published_at=null,
                                 then replaces it via a guarded PATCH
                                 (replaceNonPublicClearanceRecord) keyed on
                                 that row's own generation_source_hash --
                                 refuses if the row changed since it was
                                 read. Never touches a published row.

   <slug> must already have both:
     - a PILOT_TOPIC_CONCEPTS entry (publication-readiness-loader.mjs)
     - a PAGE_SYNTHESIS_INTENT entry (publication-page-intent.mjs)
   ═══════════════════════════════════════════════════════════════ */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import {
  PILOT_TOPIC_CONCEPTS,
  selectTopicEvidenceFromRows,
  loadExportFromDisk,
  fetchTopicEvidenceLive,
} from '../functions/_lib/research/publication-readiness-loader.mjs';
import { assessTopicReadiness, READINESS_STATUS } from '../functions/_lib/research/publication-readiness.mjs';
import { buildSynthesisEvidenceBundle, buildPageEvidenceBrief } from '../functions/_lib/research/publication-synthesis-evidence.mjs';
import { runSynthesisPipeline } from '../functions/_lib/research/publication-synthesis-orchestrator.mjs';
import { POST_SYNTHESIS_VALIDATOR_VERSION } from '../functions/_lib/research/publication-synthesis-validator.mjs';
import { getPageSynthesisIntent } from '../functions/_lib/research/publication-page-intent.mjs';
import { buildEvidenceFingerprintArtifact, verifyStoredClearanceIntegrity } from '../functions/_lib/research/publication-clearance-fingerprint.mjs';
import { buildAutoReadyClearanceRecord, ClearanceIneligibleError } from '../functions/_lib/research/publication-clearance.mjs';
import { writeClearanceRecord, replaceNonPublicClearanceRecord } from '../functions/_lib/research/publication-clearance-writer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_EXPORT_DIR = path.join(ROOT, 'research-import/unpacked/aimt-research-library-export-2026-09-20');

function parseArgs(argv) {
  const args = { topic: null, live: false, write: false, exportDir: DEFAULT_EXPORT_DIR, replaceNonpublic: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--topic') args.topic = argv[++i];
    else if (argv[i] === '--live') args.live = true;
    else if (argv[i] === '--write') args.write = true;
    else if (argv[i] === '--replace-nonpublic') args.replaceNonpublic = true;
    else if (argv[i] === '--export-dir') args.exportDir = path.isAbsolute(argv[i + 1]) ? argv[++i] : path.join(ROOT, argv[++i]);
  }
  return args;
}

/** Read-only GET of the current persisted row for a topic_slug, if any.
    Used only to (a) report the OLD hash before a replace and (b) supply
    replaceNonPublicClearanceRecord()'s required precondition hash -- never
    to decide what to write. */
async function readExistingClearanceRow(env, topicSlug) {
  const url = `${env.SUPABASE_URL}/rest/v1/research_public_pages?topic_slug=eq.${encodeURIComponent(topicSlug)}&select=topic_slug,status,sitemap_eligible,published_at,generation_source_hash`;
  const res = await fetch(url, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } });
  if (!res.ok) throw new Error(`readExistingClearanceRow: GET failed (${res.status})`);
  const rows = await res.json();
  return rows[0] || null;
}

async function loadTopicEvidence(concept, args) {
  if (args.live) return fetchTopicEvidenceLive(process.env, concept.controlled_topics);
  if (!existsSync(args.exportDir)) throw new Error(`Export dir not found: ${args.exportDir}. Pass --export-dir or use --live.`);
  const { claims, sources } = loadExportFromDisk(args.exportDir);
  return selectTopicEvidenceFromRows(concept.controlled_topics, { claims, sources });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.topic) {
    console.error('Usage: node scripts/research-publication-clearance-run.mjs --topic <slug> [--live] [--write]');
    process.exit(1);
  }
  const concept = PILOT_TOPIC_CONCEPTS.find((c) => c.topic_slug === args.topic);
  if (!concept) throw new Error(`No PILOT_TOPIC_CONCEPTS entry for "${args.topic}".`);

  if (args.live && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env. Refusing to run --live.');
    process.exit(1);
  }
  if (args.write && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env. Refusing --write.');
    process.exit(1);
  }

  console.log(`=== AIMT Automated Publication Clearance — runner (topic: ${args.topic}) ===`);
  console.log(args.write ? '!! --write requested: this run WILL upsert research_public_pages if AUTO_READY.' : 'preview mode (no --write): nothing will be persisted.');

  const { claims, sources } = await loadTopicEvidence(concept, args);
  const v1Result = assessTopicReadiness({
    topic_slug: concept.topic_slug,
    seo_page_concept: concept.seo_page_concept,
    controlled_topics: concept.controlled_topics,
    claims,
    sources,
  });
  console.log(`\n[v1] readiness_status=${v1Result.readiness_status} risk_tier=${v1Result.risk_tier} candidates=${v1Result.metrics.candidate_claim_count} sources=${v1Result.metrics.distinct_source_count}`);
  console.log(`[v1] conflict_flags=${JSON.stringify(v1Result.conflict_flags)} evidence_gaps=${JSON.stringify(v1Result.evidence_gaps)}`);

  if (v1Result.readiness_status !== READINESS_STATUS.NEEDS_SYNTHESIS) {
    console.log(`v1 did not return NEEDS_SYNTHESIS -- nothing for the clearance pipeline to evaluate. Stopping.`);
    return;
  }

  const evidenceBundle = buildSynthesisEvidenceBundle(v1Result.synthesis_packet, { claims, sources });
  console.log(`[v2] evidence bundle: ${evidenceBundle.claim_count} claims, ${evidenceBundle.source_count} sources`);
  const pipelineResult = await runSynthesisPipeline(process.env, { topic_slug: args.topic, v1Result, evidenceBundle });
  console.log(`[v2] pipeline status=${pipelineResult.status} stage=${pipelineResult.stage} reason=${pipelineResult.reason}`);
  console.log(`[v2] cost: ${pipelineResult.metrics.model_calls} model call(s) (${pipelineResult.metrics.reconciliation_calls} reconciliation, ${pipelineResult.metrics.full_retries} full retry), ${pipelineResult.metrics.total_input_tokens} input tokens, ${pipelineResult.metrics.total_output_tokens} output tokens`);

  const outDir = path.join(ROOT, 'research-import');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const reportPath = path.join(outDir, `publication-clearance-run-${args.topic}-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(reportPath, JSON.stringify({
    topic_slug: args.topic,
    generated_at: new Date().toISOString(),
    v1_result: v1Result,
    pipeline_status: pipelineResult.status,
    pipeline_stage: pipelineResult.stage,
    pipeline_reason: pipelineResult.reason,
    pipeline_violations: pipelineResult.violations || null,
    initial: pipelineResult.initial || null,
    reconciliation: pipelineResult.reconciliation || null,
    final_output: pipelineResult.finalOutput || null,
    cost_metrics: pipelineResult.metrics,
  }, null, 2));
  console.log(`\nWrote full report: ${path.relative(ROOT, reportPath)}`);

  if (pipelineResult.status !== 'AUTO_READY') {
    console.log(`\nNot eligible for clearance: pipeline status is "${pipelineResult.status}", not AUTO_READY.`);
    console.log('No clearance record can be built for this run (by design -- see publication-clearance.mjs).');
    if (pipelineResult.violations) console.log('violations:', JSON.stringify(pipelineResult.violations));
    if (pipelineResult.initial && pipelineResult.initial.output) {
      console.log('\nModel unresolved_issues:', JSON.stringify(pipelineResult.initial.output.unresolved_issues, null, 2));
      console.log('Model resolved_synthesis_signals:', JSON.stringify(pipelineResult.initial.output.resolved_synthesis_signals, null, 2));
      console.log('Model confidence:', pipelineResult.initial.output.confidence);
    }
    return;
  }

  const pageIntent = getPageSynthesisIntent(args.topic);
  const brief = buildPageEvidenceBrief({
    v1Result,
    pageIntent,
    evidenceBundle,
    aiOutput: pipelineResult.finalOutput,
    modelInfo: pipelineResult.metrics.model_info,
    validatorVersion: POST_SYNTHESIS_VALIDATOR_VERSION,
  });

  console.log(`\n[v2] selected=${pipelineResult.finalOutput.selected_claims.length} excluded=${pipelineResult.finalOutput.excluded_claims.length} sources=${brief.source_ids.length} core_points=${brief.core_factual_points.length} limitations=${brief.limitations.length}`);

  const fingerprintArtifact = await buildEvidenceFingerprintArtifact(args.topic, brief);
  console.log(`\n[clearance] evidence fingerprint algorithm: ${fingerprintArtifact.algorithm}`);
  console.log(`[clearance] evidence fingerprint hash: ${fingerprintArtifact.hash}`);

  let record;
  try {
    record = buildAutoReadyClearanceRecord({
      topicSlug: args.topic,
      controlledTopic: concept.controlled_topics.length === 1 ? concept.controlled_topics[0] : null,
      v1Result,
      pipelineStatus: pipelineResult.status,
      pageEvidenceBrief: brief,
      fingerprintArtifact,
    });
  } catch (err) {
    if (err instanceof ClearanceIneligibleError) {
      console.log(`\nClearance record could not be built: ${err.message}`);
      return;
    }
    throw err;
  }

  console.log('\n[clearance] The exact record that would be upserted into research_public_pages:');
  console.log(JSON.stringify(record, null, 2));

  const integrity = await verifyStoredClearanceIntegrity(record);
  console.log(`\n[clearance] verifyStoredClearanceIntegrity: ${integrity.valid ? 'PASS' : 'FAIL'}`);
  console.log(`[clearance] expected_hash: ${integrity.expected_hash}`);
  console.log(`[clearance] stored_hash:   ${integrity.stored_hash}`);
  if (!integrity.valid) {
    console.log(`[clearance] violations: ${integrity.violations.join(', ')}`);
    console.log('\nRefusing to proceed: this just-built record failed its own integrity check. Not written, regardless of --write.');
    return;
  }

  if (!args.write) {
    console.log('\nPreview only -- nothing written. Pass --write (with explicit owner authorization) to persist this record.');
    if (args.replaceNonpublic) console.log('(--replace-nonpublic was also passed; it has no effect without --write.)');
    return;
  }

  if (!args.replaceNonpublic) {
    console.log('\nWriting clearance record to research_public_pages (writeClearanceRecord upsert) ...');
    const written = await writeClearanceRecord(process.env, record);
    console.log('Write succeeded:', JSON.stringify(written, null, 2));
    return;
  }

  console.log('\n--replace-nonpublic requested: reading the existing persisted row first (read-only) ...');
  const existing = await readExistingClearanceRow(process.env, args.topic);
  if (!existing) {
    console.log(`\nNo existing row found for topic_slug="${args.topic}" -- there is nothing to replace. Re-run with --write alone to create the first row.`);
    return;
  }
  console.log('[replace] existing row:', JSON.stringify(existing, null, 2));
  if (existing.status !== 'ready_for_page_builder' || existing.sitemap_eligible !== false || existing.published_at !== null) {
    console.log('\nRefusing: the existing row is not in the expected non-public state (status=ready_for_page_builder, sitemap_eligible=false, published_at=null). This guarded path never touches a published or otherwise-altered row.');
    return;
  }
  const oldHash = existing.generation_source_hash;
  console.log(`[replace] old generation_source_hash: ${oldHash}`);
  console.log(`[replace] new generation_source_hash: ${record.generation_source_hash}`);
  console.log(`[replace] hash changed: ${oldHash !== record.generation_source_hash}`);

  console.log('\nReplacing clearance record via guarded PATCH (replaceNonPublicClearanceRecord) ...');
  const replaced = await replaceNonPublicClearanceRecord(process.env, record, { requireCurrentHash: oldHash });
  console.log(`Replace succeeded: ${replaced.length} row(s) affected.`);
  console.log(JSON.stringify(replaced, null, 2));
}

main().catch((err) => {
  console.error('Publication clearance run failed:', err);
  process.exit(1);
});
