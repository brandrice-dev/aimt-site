#!/usr/bin/env node
// Restores AIMT Listen Mode media from an R2 snapshot manifest -- proves
// the backup is actually recoverable, not just "uploaded". Downloads each
// file by its immutable content-addressed key, writes it to disk, and
// requires the restored bytes' SHA-256 to match the manifest's recorded
// hash before considering that file recovered.
//
// Usage:
//   node scripts/aimt-media-restore.mjs --manifest=<path to snapshot .json> --out=<dir> [--overwrite]
//
// By default refuses to overwrite an existing file at the destination
// path (pass --overwrite to allow it). Requires R2_ACCOUNT_ID /
// R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY in the environment, same as the
// backup script -- fails closed if they're absent.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { sha256Hex, requireR2Config, r2GetObject } from './_lib/r2-s3-client.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const eq = a.match(/^--([^=]+)=(.*)$/);
    if (eq) { args[eq[1]] = eq[2]; continue; }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) { args[key] = next; i++; }
    else args[key] = true;
  }
  return args;
}

// `deps.getObject` defaults to the real R2 client call; tests inject a
// fake so overwrite-refusal and checksum validation are verifiable
// without a live R2 connection.
async function restoreFile(config, fileEntry, destPath, { overwrite }, deps = { getObject: r2GetObject }) {
  if (existsSync(destPath) && !overwrite) {
    return { relPath: fileEntry.relPath, status: 'skipped-exists-no-overwrite' };
  }
  const bytes = await deps.getObject(config, fileEntry.objectKey);
  const restoredSha256 = sha256Hex(bytes);
  if (restoredSha256 !== fileEntry.sha256) {
    return {
      relPath: fileEntry.relPath,
      status: 'CHECKSUM_MISMATCH',
      expectedSha256: fileEntry.sha256,
      restoredSha256
    };
  }
  mkdirSync(path.dirname(destPath), { recursive: true });
  writeFileSync(destPath, bytes);
  return { relPath: fileEntry.relPath, status: 'restored-verified', sha256: restoredSha256, sizeBytes: bytes.length };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.manifest) {
    console.error('Usage: node scripts/aimt-media-restore.mjs --manifest=<path> --out=<dir> [--overwrite]');
    process.exit(1);
  }

  let config;
  try {
    config = requireR2Config();
  } catch (e) {
    console.error(String(e.message));
    process.exitCode = 1;
    return;
  }

  const manifestPath = path.resolve(process.cwd(), args.manifest);
  if (!existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}`);
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const outDir = args.out ? path.resolve(process.cwd(), args.out) : ROOT;
  const overwrite = !!args.overwrite;

  console.log(`Restoring ${manifest.files.length} file(s) from snapshot ${manifest.snapshotTimestampUtc} into ${outDir}${overwrite ? ' (overwrite enabled)' : ' (will not overwrite existing files)'}...`);

  const results = [];
  for (const fileEntry of manifest.files) {
    const destPath = path.join(outDir, fileEntry.relPath);
    process.stdout.write(`  ${fileEntry.relPath} ... `);
    const result = await restoreFile(config, fileEntry, destPath, { overwrite });
    results.push(result);
    console.log(result.status);
  }

  const restored = results.filter((r) => r.status === 'restored-verified');
  const mismatches = results.filter((r) => r.status === 'CHECKSUM_MISMATCH');
  const skipped = results.filter((r) => r.status === 'skipped-exists-no-overwrite');

  console.log(`\n--- Summary ---`);
  console.log(`Restored + checksum-verified: ${restored.length}`);
  console.log(`Skipped (already present, no --overwrite): ${skipped.length}`);
  console.log(`CHECKSUM MISMATCHES: ${mismatches.length}`);
  if (mismatches.length > 0) {
    console.log('\nCHECKSUM MISMATCH DETAILS:');
    for (const m of mismatches) console.log(`  ${m.relPath}: expected ${m.expectedSha256}, got ${m.restoredSha256}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('RESTORE FAILED:', err.message);
    process.exitCode = 1;
  });
}

export { restoreFile };
