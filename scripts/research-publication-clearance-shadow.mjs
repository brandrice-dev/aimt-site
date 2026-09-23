#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   AIMT Automated Publication Clearance — shadow-mode preview (hair-cycle)
   ---------------------------------------------------------------
   Runs the full v1 -> v2/v2.1 pipeline for hair-cycle, and if (and only
   if) it reaches a validated AUTO_READY result, builds the exact
   page-level clearance record this repo would persist -- and PRINTS it
   rather than writing it, unless --write is explicitly passed.

   SHADOW MODE / READ-ONLY GUARANTEE (default, no flags):
     - Read-only against Supabase (same GET-only loaders v1/v2 already
       use).
     - The only network write-shaped requests are the Anthropic synthesis
       calls (initial/reconciliation/retry), which write nothing to any
       AIMT system.
     - NOTHING is written to research_public_pages, research_claims, or
       research_sources by default.
     - Never sets AIMT_APPROVED, public_eligible, published, or
       sitemap_eligible -- these are not even reachable from this script;
       see functions/_lib/research/publication-clearance.mjs's
       FORBIDDEN_CLEARANCE_FIELDS and publication-clearance-writer.mjs's
       ALLOWED_COLUMNS allow-list.

   WRITE PATH (--write): performs exactly one upsert, to
   research_public_pages only, with status='ready_for_page_builder' and
   clearance_mode='AUTO_READY'. Requires SUPABASE_SERVICE_ROLE_KEY (never
   a client-side key) and is never invoked automatically by anything in
   this repo -- always an explicit, manual, one-off CLI run. Per the
   originating request, this write must not happen without explicit
   owner authorization obtained in conversation before the flag is ever
   passed.

   Usage:
     node scripts/research-publication-clearance-shadow.mjs
       [--live]                 fetch topic evidence from live Supabase
                                 (read-only; requires SUPABASE_URL +
                                 SUPABASE_SERVICE_ROLE_KEY)
       [--export-dir <dir>]     local validated export to read instead
       [--write]                actually upsert the clearance record
                                 (requires explicit owner authorization --
                                 see module header)
   ═══════════════════════════════════════════════════════════════ */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
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
import { computeEvidenceFingerprint } from '../functions/_lib/research/publication-clearance-fingerprint.mjs';
import { buildAutoReadyClearanceRecord, ClearanceIneligibleError } from '../functions/_lib/research/publication-clearance.mjs';
import { writeClearanceRecord } from '../functions/_lib/research/publication-clearance-writer.mjs';

const TOPIC_SLUG = 'hair-cycle'; // hard-scoped, same pilot as Publication Editor v2

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_EXPORT_DIR = path.join(ROOT, 'research-import/unpacked/aimt-research-library-export-2026-09-20');

function parseArgs(argv) {
  const args = { live: false, write: false, exportDir: DEFAULT_EXPORT_DIR };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--live') args.live = true;
    else if (argv[i] === '--write') args.write = true;
    else if (argv[i] === '--export-dir') args.exportDir = path.isAbsolute(argv[i + 1]) ? argv[++i] : path.join(ROOT, argv[++i]);
  }
  return args;
}

async function loadTopicEvidence(concept, args) {
  if (args.live) return fetchTopicEvidenceLive(process.env, concept.controlled_topics);
  if (!existsSync(args.exportDir)) throw new Error(`Export dir not found: ${args.exportDir}. Pass --export-dir or use --live.`);
  const { claims, sources } = loadExportFromDisk(args.exportDir);
  return selectTopicEvidenceFromRows(concept.controlled_topics, { claims, sources });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const concept = PILOT_TOPIC_CONCEPTS.find((c) => c.topic_slug === TOPIC_SLUG);
  if (!concept) throw new Error(`No PILOT_TOPIC_CONCEPTS entry for "${TOPIC_SLUG}".`);

  if (args.live && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env. Refusing to run --live.');
    process.exit(1);
  }
  if (args.write && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env. Refusing --write.');
    process.exit(1);
  }

  console.log('=== AIMT Automated Publication Clearance — shadow preview (hair-cycle) ===');
  console.log(args.write ? '!! --write requested: this run WILL upsert research_public_pages if AUTO_READY.' : 'preview mode (no --write): nothing will be persisted.');

  const { claims, sources } = await loadTopicEvidence(concept, args);
  const v1Result = assessTopicReadiness({
    topic_slug: concept.topic_slug,
    seo_page_concept: concept.seo_page_concept,
    controlled_topics: concept.controlled_topics,
    claims,
    sources,
  });
  console.log(`\n[v1] readiness_status=${v1Result.readiness_status} risk_tier=${v1Result.risk_tier}`);

  if (v1Result.readiness_status !== READINESS_STATUS.NEEDS_SYNTHESIS) {
    console.log(`v1 did not return NEEDS_SYNTHESIS -- nothing for the clearance pipeline to evaluate. Stopping.`);
    return;
  }

  const evidenceBundle = buildSynthesisEvidenceBundle(v1Result.synthesis_packet, { claims, sources });
  const pipelineResult = await runSynthesisPipeline(process.env, { topic_slug: TOPIC_SLUG, v1Result, evidenceBundle });
  console.log(`[v2] pipeline status=${pipelineResult.status} stage=${pipelineResult.stage} reason=${pipelineResult.reason}`);

  if (pipelineResult.status !== 'AUTO_READY') {
    console.log(`\nNot eligible for clearance: pipeline status is "${pipelineResult.status}", not AUTO_READY.`);
    console.log('No clearance record can be built for this run (by design -- see publication-clearance.mjs).');
    return;
  }

  const pageIntent = getPageSynthesisIntent(TOPIC_SLUG);
  const brief = buildPageEvidenceBrief({
    v1Result,
    pageIntent,
    evidenceBundle,
    aiOutput: pipelineResult.finalOutput,
    modelInfo: pipelineResult.metrics.model_info,
    validatorVersion: POST_SYNTHESIS_VALIDATOR_VERSION,
  });

  const fingerprint = await computeEvidenceFingerprint(TOPIC_SLUG, brief);
  console.log(`\n[clearance] evidence fingerprint: ${fingerprint}`);

  let record;
  try {
    record = buildAutoReadyClearanceRecord({
      topicSlug: TOPIC_SLUG,
      controlledTopic: concept.controlled_topics.length === 1 ? concept.controlled_topics[0] : null,
      v1Result,
      pipelineStatus: pipelineResult.status,
      pageEvidenceBrief: brief,
      fingerprint,
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

  if (!args.write) {
    console.log('\nPreview only -- nothing written. Pass --write (with explicit owner authorization) to persist this record.');
    return;
  }

  console.log('\nWriting clearance record to research_public_pages ...');
  const written = await writeClearanceRecord(process.env, record);
  console.log('Write succeeded:', JSON.stringify(written, null, 2));
}

main().catch((err) => {
  console.error('Publication clearance shadow run failed:', err);
  process.exit(1);
});
