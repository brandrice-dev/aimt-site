#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   AIMT Page Builder v1 — shadow-mode run (hair-cycle)
   ---------------------------------------------------------------
   Loads the REAL, already-persisted hair-cycle clearance row (read-
   only), re-verifies its integrity and DB invariants, extracts ONLY the
   cleared fingerprint_input snapshot, builds a structured page draft
   deterministically (no AI call), validates it, runs the deterministic
   factual-fidelity check, finalizes SEO + JSON-LD, renders an HTML
   preview, and writes every artifact under gitignored
   research-import/page-builder-shadow/<topic_slug>/ -- never to a live
   route, never to Supabase.

   SHADOW MODE GUARANTEE:
     - The only network request this script makes is the read-only GET
       against research_public_pages (functions/_lib/page-builder/
       page-builder-loader.mjs). No POST/PATCH/DELETE to Supabase exists
       anywhere in the Page Builder module set.
     - No Anthropic call. page-builder-fidelity.mjs's model-based check
       exists but is never imported or called here.
     - No file is written to any route Cloudflare Pages would serve --
       everything lands under research-import/, which is gitignored and
       not part of the deployed static site.

   Usage:
     node scripts/page-builder-shadow.mjs [--topic hair-cycle]
   ═══════════════════════════════════════════════════════════════ */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { loadClearedSnapshot } from '../functions/_lib/page-builder/page-builder-loader.mjs';
import { buildPageDraft } from '../functions/_lib/page-builder/page-builder-draft.mjs';
import { validatePageDraft } from '../functions/_lib/page-builder/page-builder-validator.mjs';
import { checkDraftFidelity } from '../functions/_lib/page-builder/page-builder-fidelity.mjs';
import { finalizeSeo, buildStructuredData } from '../functions/_lib/page-builder/page-builder-seo.mjs';
import { renderDraftHtml } from '../functions/_lib/page-builder/page-builder-render.mjs';
import { buildCostMetrics } from '../functions/_lib/page-builder/page-builder-cost.mjs';
import { computeRenderedSupportClaimIds, findDuplicateFactualText } from '../functions/_lib/page-builder/page-builder-content-units.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { topic: 'hair-cycle' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--topic') args.topic = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log('=== AIMT Page Builder v1 — shadow run ===');
  console.log(`topic_slug: ${args.topic}`);

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env. Refusing to run (read-only fetch still requires credentials).');
    process.exit(1);
  }

  console.log('\n[load] fetching the real production clearance row (read-only GET)...');
  const { record, snapshot, integrity, invariants } = await loadClearedSnapshot(process.env, args.topic);
  console.log(`[load] clearance_mode=${record.clearance_mode} status=${record.status}`);
  console.log(`[load] verifyStoredClearanceIntegrity: valid=${integrity.valid}`);
  console.log(`[load] validatePageInvariants: valid=${invariants.valid}`);
  console.log(`[load] cleared snapshot: ${snapshot.selected_claim_ids.length} selected claims, ${snapshot.source_ids.length} sources, ${snapshot.core_factual_points.length} core points, ${snapshot.limitations.length} limitations, risk_tier=${snapshot.risk_tier}`);

  console.log('\n[draft] building the structured draft deterministically (no AI call)...');
  let draft = buildPageDraft(snapshot, {
    generationSourceHash: record.generation_source_hash,
    fingerprintAlgorithm: record.publication_clearance.fingerprint_algorithm,
  });
  draft = finalizeSeo(draft);
  console.log(`[draft] route: ${draft.route}`);
  console.log(`[draft] sections: ${draft.sections.map((s) => s.section_id).join(', ')}`);

  console.log('\n[validate] running the deterministic post-draft validator...');
  const validation = validatePageDraft(draft, snapshot, { integrityResult: integrity });
  console.log(`[validate] valid=${validation.valid}`);
  console.log(`[validate] route_check=${JSON.stringify(validation.report.route_check)}`);
  console.log(`[validate] scope_note_preserved=${validation.report.scope_note_preserved}`);
  console.log(`[validate] duplicate_factual_text=${JSON.stringify(validation.report.duplicate_factual_text)}`);
  console.log(`[validate] rendered_support_claim_count=${validation.report.rendered_support_claim_count} of selected_claim_count=${validation.report.selected_claim_count}`);
  if (!validation.valid) {
    console.error(`[validate] violations: ${validation.violations.join(', ')}`);
    console.error('\nRefusing to emit shadow artifacts for a draft that failed validation.');
    process.exit(1);
  }

  console.log('\n[fidelity] running the deterministic factual-fidelity check (no AI call)...');
  const fidelity = checkDraftFidelity(draft, snapshot);
  console.log(`[fidelity] result=${fidelity.result}`);
  if (fidelity.result !== 'PASS') {
    console.error(`[fidelity] paragraph_results: ${JSON.stringify(fidelity.paragraph_results, null, 2)}`);
    console.error('\nRefusing to emit shadow artifacts for a draft that failed the fidelity check.');
    process.exit(1);
  }

  const structuredData = buildStructuredData(draft);
  const html = renderDraftHtml(draft, structuredData);

  // Never hardcode the candidate pool size -- read it from the actual
  // persisted record (buildAutoReadyClearanceRecord() always writes
  // v1Result.metrics.candidate_claim_count here). null if genuinely
  // absent, never a guessed/carried-over literal.
  const candidateClaimCount = typeof record.publication_clearance.candidate_claim_count === 'number' ? record.publication_clearance.candidate_claim_count : null;
  const renderedSupportClaimIds = computeRenderedSupportClaimIds(draft);
  const duplicateFactualText = findDuplicateFactualText(draft);

  const costMetrics = buildCostMetrics({
    modelCalls: [], // zero model calls in v1 -- deterministic draft + deterministic fidelity check only
    fidelityCheckCalls: fidelity.paragraph_results.length, // deterministic checks, not model calls
    retries: 0,
    candidateClaimCount,
    selectedClaimCount: snapshot.selected_claim_ids.length,
    renderedSupportClaimCount: renderedSupportClaimIds.length,
  });
  console.log('\n[cost] ' + JSON.stringify(costMetrics));

  const outDir = path.join(ROOT, 'research-import', 'page-builder-shadow', args.topic);
  mkdirSync(outDir, { recursive: true });

  const provenance = {
    generated_at: new Date().toISOString(),
    topic_slug: args.topic,
    source_row_generation_source_hash: record.generation_source_hash,
    source_fingerprint_algorithm: record.publication_clearance.fingerprint_algorithm,
    clearance_mode: record.clearance_mode,
    status: record.status,
    integrity_result: integrity,
    invariants_result: invariants,
    validation_result: validation,
    fidelity_result: fidelity,
    rendered_support_claim_ids: renderedSupportClaimIds,
    rendered_support_claim_count: renderedSupportClaimIds.length,
    selected_claim_count: snapshot.selected_claim_ids.length,
    duplicate_factual_text: duplicateFactualText,
    no_anthropic_call_made: true,
    no_production_write_made: true,
  };

  writeFileSync(path.join(outDir, 'draft.json'), JSON.stringify(draft, null, 2));
  writeFileSync(path.join(outDir, 'preview.html'), html);
  writeFileSync(path.join(outDir, 'validator-report.json'), JSON.stringify(validation, null, 2));
  writeFileSync(path.join(outDir, 'fidelity-report.json'), JSON.stringify(fidelity, null, 2));
  writeFileSync(path.join(outDir, 'structured-data.json'), JSON.stringify(structuredData, null, 2));
  writeFileSync(path.join(outDir, 'cost-metrics.json'), JSON.stringify(costMetrics, null, 2));
  writeFileSync(path.join(outDir, 'provenance.json'), JSON.stringify(provenance, null, 2));

  console.log(`\nShadow artifacts written to ${path.relative(ROOT, outDir)}/`);
  console.log('Nothing was written to Supabase. Nothing was published. No /education route was created.');
}

main().catch((err) => {
  console.error('Page Builder shadow run failed:', err);
  process.exit(1);
});
