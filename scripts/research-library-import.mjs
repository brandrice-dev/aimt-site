#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   AIMT Research Library — idempotent importer
   ---------------------------------------------------------------
   Reads a Grok research-harvester export (unpacked tarball directory)
   and either:
     - validates it and reports counts (default: --dry-run, no network
       calls, safe to run any time), or
     - upserts it into Supabase (--live, requires SUPABASE_URL +
       SUPABASE_SERVICE_ROLE_KEY in env; requires the
       20260920_create_research_library.sql migration to already be
       applied).

   Idempotent: every table is upserted on its natural Grok id
   (source_id / claim_id / topic / relationship_id / queue_id), so
   re-running the same or a newer export never duplicates rows.

   Never writes AIMT-side editorial columns (aimt_reviewed_by,
   public_eligible, published, ...) and never writes
   verification_status = 'AIMT_APPROVED' -- see
   functions/_lib/research/schema.mjs: assertNeverAutoApproves().
   If a claim is already AIMT_APPROVED in the DB, this importer
   refreshes every other field but leaves verification_status alone,
   so a Grok re-sync can never silently downgrade a human approval.

   Usage:
     node scripts/research-library-import.mjs --dir research-import/unpacked/aimt-research-library-export-2026-09-20
     node scripts/research-library-import.mjs --dir <export dir> --live --batch-id grok-2026-09-20

   Zero npm dependencies (Node built-ins + fetch only), matching the
   rest of this repo.
   ═══════════════════════════════════════════════════════════════ */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSource, validateClaim } from '../functions/_lib/research/schema.mjs';
import { runImport } from '../functions/_lib/research/importer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { live: false, dir: null, batchId: null, chunkSize: 200 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--live') args.live = true;
    else if (a === '--dir') args.dir = argv[++i];
    else if (a === '--batch-id') args.batchId = argv[++i];
    else if (a === '--chunk-size') args.chunkSize = Number(argv[++i]);
  }
  return args;
}

function readJsonl(filePath) {
  if (!existsSync(filePath)) return [];
  const text = readFileSync(filePath, 'utf8');
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  return lines.map((line, idx) => {
    try {
      return JSON.parse(line);
    } catch (e) {
      return { __parse_error__: true, __line__: idx + 1, __raw__: line.slice(0, 200) };
    }
  });
}

/* ── Load + validate the export ── */
function loadExport(dir) {
  const dataDir = path.join(dir, 'data');
  const sourcesRaw = readJsonl(path.join(dataDir, 'sources.jsonl'));
  const claimsRaw = readJsonl(path.join(dataDir, 'claims.jsonl'));
  const topicsRaw = readJsonl(path.join(dataDir, 'topics.jsonl'));
  const relationshipsRaw = readJsonl(path.join(dataDir, 'relationships.jsonl'));
  const queueRaw = readJsonl(path.join(dataDir, 'verification_queue.jsonl'));
  const coverageRaw = readJsonl(path.join(dataDir, 'coverage.jsonl'));

  const rejected = { sources: [], claims: [] };
  const validSources = [];
  const validClaims = [];

  const sourceIds = new Set();
  for (const rec of sourcesRaw) {
    if (rec.__parse_error__) { rejected.sources.push({ natural_id: null, errors: [`JSON parse error at line ${rec.__line__}`], raw: rec.__raw__ }); continue; }
    const { errors } = validateSource(rec);
    if (errors.length) { rejected.sources.push({ natural_id: rec.source_id || null, errors, raw: rec }); continue; }
    validSources.push(rec);
    sourceIds.add(rec.source_id);
  }

  for (const rec of claimsRaw) {
    if (rec.__parse_error__) { rejected.claims.push({ natural_id: null, errors: [`JSON parse error at line ${rec.__line__}`], raw: rec.__raw__ }); continue; }
    const { errors } = validateClaim(rec);
    if (!rec.__parse_error__ && rec.source_id && !sourceIds.has(rec.source_id)) {
      errors.push(`source_id ${JSON.stringify(rec.source_id)} not found among sources in this batch (orphan claim)`);
    }
    /* Quarantine rather than crash the whole run: verification_status
       'AIMT_APPROVED' is a legal value on the ladder (so validateClaim
       alone won't flag it) but must never come FROM an export/import --
       it's human-only. assertNeverAutoApproves() in schema.mjs is a
       defense-in-depth backstop for --live, not the primary handling for
       this case; catching it here keeps one bad row from aborting an
       otherwise-clean batch of ~1000 records. */
    if (rec.verification_status === 'AIMT_APPROVED') {
      errors.push('verification_status=AIMT_APPROVED may not come from an import; human-only');
    }
    if (errors.length) { rejected.claims.push({ natural_id: rec.claim_id || null, errors, raw: rec }); continue; }
    validClaims.push(rec);
  }

  return {
    sources: validSources, claims: validClaims,
    topics: topicsRaw, relationships: relationshipsRaw,
    verificationQueue: queueRaw, coverage: coverageRaw,
    rejected
  };
}

function histogram(rows, field) {
  const h = {};
  for (const r of rows) {
    const v = r[field] === undefined || r[field] === null ? 'null' : r[field];
    h[v] = (h[v] || 0) + 1;
  }
  return h;
}

function buildReport(loaded) {
  return {
    counts: {
      sources: loaded.sources.length,
      claims: loaded.claims.length,
      topics: loaded.topics.length,
      relationships: loaded.relationships.length,
      verification_queue: loaded.verificationQueue.length,
      coverage: loaded.coverage.length
    },
    rejected_counts: {
      sources: loaded.rejected.sources.length,
      claims: loaded.rejected.claims.length
    },
    source_verification_status: histogram(loaded.sources, 'verification_status'),
    claim_verification_status: histogram(loaded.claims, 'verification_status'),
    claim_verification_review_status: histogram(loaded.claims, 'verification_review_status'),
    aimt_approved_claims_in_export: loaded.claims.filter((c) => c.verification_status === 'AIMT_APPROVED').length,
    rejected_sample: {
      sources: loaded.rejected.sources.slice(0, 10),
      claims: loaded.rejected.claims.slice(0, 10)
    }
  };
}


/* ── Live mode: delegate to the shared, runtime-agnostic importer so the
   CLI and functions/api/research-ingest.js run identical upsert logic. ── */
async function runLiveImport({ loaded, batchId, chunkSize }) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env. Refusing to run --live.');
    process.exit(1);
  }
  return runImport(process.env, { loaded, batchId, triggeredBy: 'cli-import', chunkSize });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.dir) {
    console.error('Usage: node scripts/research-library-import.mjs --dir <unpacked export dir> [--live] [--batch-id <id>]');
    process.exit(1);
  }
  const dir = path.isAbsolute(args.dir) ? args.dir : path.join(ROOT, args.dir);
  if (!existsSync(dir)) {
    console.error(`Export dir not found: ${dir}`);
    process.exit(1);
  }
  const batchId = args.batchId || `local-${path.basename(dir)}-${new Date().toISOString().slice(0, 10)}`;

  const loaded = loadExport(dir);
  const report = buildReport(loaded);

  console.log(`\n=== AIMT Research Library import: ${args.live ? 'LIVE' : 'DRY RUN'} ===`);
  console.log(`export dir: ${dir}`);
  console.log(`batch id:   ${batchId}`);
  console.log(JSON.stringify(report, null, 2));

  if (report.aimt_approved_claims_in_export > 0) {
    console.warn(`\n!! WARNING: ${report.aimt_approved_claims_in_export} claim(s) in this export already carry verification_status=AIMT_APPROVED.`);
    console.warn('   That should only ever happen via a human review action, never an automated export. Investigate before proceeding.');
  }

  if (!args.live) {
    const outDir = path.join(ROOT, 'research-import');
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `import-report-${batchId}.json`);
    writeFileSync(outFile, JSON.stringify(report, null, 2));
    console.log(`\nDry run only -- no network calls made. Full report written to ${path.relative(ROOT, outFile)}`);
    return;
  }

  const result = await runLiveImport({ loaded, batchId, chunkSize: args.chunkSize });
  console.log('\n=== Live import complete ===');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
