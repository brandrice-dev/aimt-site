#!/usr/bin/env node
// Backs up AIMT Listen Mode source/production media to the private
// Cloudflare R2 archive, using content-addressed immutable storage
// (blobs/sha256/<aa>/<fullhash>/<filename>) so re-running this script for
// the same content never re-uploads or overwrites anything -- it just
// confirms the blob is already there and reuses it.
//
// Usage:
//   node scripts/aimt-media-backup.mjs --course headspa-mastery --module 01
//
// Requires R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY in the
// environment (an R2 API token scoped to object read/write on the target
// bucket). Fails closed -- prints exactly what's missing and exits
// nonzero -- before making any network call if any of these are absent.
// Never logs a secret value. R2_BUCKET defaults to "aimt-media-archive".
//
// A file marked required:true that doesn't exist locally is a hard error
// (this script never silently skips a critical file). required:false
// entries (e.g. a CapCut export the owner hasn't returned yet) are
// skipped quietly if absent -- see getSourceManifest().

import { existsSync, statSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  sha256File, mimeTypeFor, contentAddressedKey,
  requireR2Config, r2HeadObject, r2PutObject
} from './_lib/r2-s3-client.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCHEMA_VERSION = 1;

// Source manifest: what gets backed up, per course/module. Add a new
// branch here for each future module -- the upload/verify/manifest logic
// below is fully generic.
function getSourceManifest(course, moduleId) {
  if (course === 'headspa-mastery' && moduleId === '01') {
    const entries = [];

    // A. Raw ElevenLabs generations -- critical, irreplaceable without
    // spending credits again.
    for (let i = 1; i <= 14; i++) {
      const id = 'm1-' + String(i).padStart(2, '0');
      entries.push({
        relPath: `assets/audio/listen/headspa-mastery/module-01/raw/${id}.mp3`,
        role: 'raw-elevenlabs-generation',
        required: true
      });
    }

    // B. Existing canonical/generated Module 1 audio (current production
    // state, may later be superseded by the CapCut pipeline).
    for (const id of ['m1-01', 'm1-02', 'm1-03', 'm1-04', 'm1-07']) {
      entries.push({
        relPath: `assets/audio/listen/headspa-mastery/module-01/${id}.mp3`,
        role: 'canonical-production-audio',
        required: true
      });
    }

    // C. Full pre-CapCut module master (deterministic boundary markers).
    entries.push({
      relPath: 'docs/course-audit/listen-mode/capcut-production/module-01/module-01-capcut-master.wav',
      role: 'capcut-pre-processing-master',
      required: true
    });

    // D. Current CapCut proof/R&D evidence -- first historical snapshot
    // only, per the owner's explicit one-time request; not repeated for
    // every future disposable mastering experiment.
    entries.push({
      relPath: 'docs/course-audit/listen-mode/capcut-test/module-01/module-01-capcut-proof-master.wav',
      role: 'capcut-proof-master-4chunk',
      required: true
    });
    entries.push({
      relPath: 'docs/course-audit/listen-mode/capcut-test/module-01/intake/module-01-capcut-proof-processed.flac.FLAC',
      role: 'capcut-proof-processed-export',
      required: true
    });
    for (const id of ['m1-01', 'm1-02', 'm1-03', 'm1-04']) {
      entries.push({
        relPath: `docs/course-audit/listen-mode/capcut-test/module-01/resplit-capcut/${id}-capcut-resplit.wav`,
        role: 'capcut-proof-resplit-lossless',
        required: true
      });
      entries.push({
        relPath: `docs/course-audit/listen-mode/capcut-test/module-01/resplit-capcut/${id}-capcut.mp3`,
        role: 'capcut-proof-resplit-mp3',
        required: true
      });
    }

    // E. Full-module CapCut production directory -- processed export not
    // returned yet (optional; next run picks it up automatically), plus
    // any resplit outputs once they exist.
    entries.push({
      relPath: 'docs/course-audit/listen-mode/capcut-production/module-01/intake/module-01-capcut-master-processed.flac',
      role: 'capcut-full-module-processed-export',
      required: false
    });
    for (let i = 1; i <= 14; i++) {
      const id = 'm1-' + String(i).padStart(2, '0');
      entries.push({
        relPath: `docs/course-audit/listen-mode/capcut-production/module-01/resplit/${id}-capcut.mp3`,
        role: 'capcut-full-module-resplit-canonical-candidate',
        required: false
      });
    }

    // Small recovery metadata -- Git remains the primary home for these;
    // included so the R2 archive is self-describing without opening Git
    // history in an emergency.
    entries.push({ relPath: 'docs/course-audit/listen-mode/capcut-production/module-01/module-01-capcut-boundaries.json', role: 'recovery-metadata', required: true });
    entries.push({ relPath: 'docs/course-audit/listen-mode/module-01-production-standard-LOCKED.md', role: 'recovery-metadata', required: true });
    entries.push({ relPath: 'docs/course-audit/listen-mode/capcut-production/module-01/CAPCUT-MODULE-01-INSTRUCTIONS.md', role: 'recovery-metadata', required: true });
    entries.push({ relPath: 'assets/js/aimt-listen-mode-data.js', role: 'recovery-metadata', required: true });

    return entries;
  }
  throw new Error(`No source manifest configured for course="${course}" module="${moduleId}". Add one to getSourceManifest() in scripts/aimt-media-backup.mjs.`);
}

function snapshotKeyFor(course, moduleId, snapshotTimestamp) {
  return `snapshots/${course}/listen-mode/module-${moduleId}/${snapshotTimestamp}.json`;
}

function buildSnapshotManifest({ course, moduleId, bucket, snapshotTimestamp, files, totalBytes }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    course,
    module: moduleId,
    backupProvider: 'cloudflare-r2',
    bucket,
    snapshotTimestampUtc: snapshotTimestamp,
    objectCount: files.length,
    totalBytes,
    files
  };
}

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

// `deps` defaults to the real R2 client calls; tests inject fakes here so
// the reuse-vs-upload decision logic is verifiable without a live R2
// connection (which this environment does not currently have -- R2 is not
// yet enabled on the account, see the backup report).
async function backupFile(config, entry, deps = { headObject: r2HeadObject, putObject: r2PutObject }) {
  const absPath = path.join(ROOT, entry.relPath);
  if (!existsSync(absPath)) {
    if (entry.required) {
      throw new Error(`REQUIRED file missing, cannot proceed: ${entry.relPath}`);
    }
    return { ...entry, status: 'skipped-not-present' };
  }
  const size = statSync(absPath).size;
  const sha256 = sha256File(absPath);
  const filename = path.basename(entry.relPath);
  const key = contentAddressedKey(sha256, filename);
  const mimeType = mimeTypeFor(filename);

  const existing = await deps.headObject(config, key);
  let status;
  if (existing && existing.size === size) {
    status = 'reused-existing-blob';
  } else if (existing && existing.size !== size) {
    // Same hash, different recorded size should never happen (hash
    // collision territory) -- treat as an integrity problem, not a
    // silent overwrite.
    throw new Error(`R2 object at ${key} exists but size mismatch (local ${size} vs remote ${existing.size}) -- refusing to overwrite a content-addressed blob.`);
  } else {
    const bytes = readFileSync(absPath);
    await deps.putObject(config, key, bytes, mimeType);
    const verify = await deps.headObject(config, key);
    if (!verify || verify.size !== size) {
      throw new Error(`Upload verification failed for ${entry.relPath}: HEAD after PUT did not report the expected size.`);
    }
    status = 'uploaded';
  }

  return {
    relPath: entry.relPath,
    filename,
    role: entry.role,
    sha256,
    sizeBytes: size,
    mimeType,
    objectKey: key,
    status,
    timestampUtc: new Date().toISOString()
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const course = args.course;
  const moduleId = args.module;
  if (!course || !moduleId) {
    console.error('Usage: node scripts/aimt-media-backup.mjs --course <slug> --module <NN>');
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

  const entries = getSourceManifest(course, moduleId);
  console.log(`Backing up ${entries.length} configured source(s) for ${course} / module ${moduleId} to bucket "${config.bucket}"...`);

  const results = [];
  for (const entry of entries) {
    process.stdout.write(`  ${entry.relPath} ... `);
    const result = await backupFile(config, entry);
    results.push(result);
    console.log(result.status);
  }

  const present = results.filter((r) => r.status !== 'skipped-not-present');
  const uploaded = present.filter((r) => r.status === 'uploaded');
  const reused = present.filter((r) => r.status === 'reused-existing-blob');
  const totalBytes = present.reduce((sum, r) => sum + (r.sizeBytes || 0), 0);

  const snapshotTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const manifest = buildSnapshotManifest({ course, moduleId, bucket: config.bucket, snapshotTimestamp, files: present, totalBytes });

  const manifestJson = JSON.stringify(manifest, null, 2);
  const snapshotKey = snapshotKeyFor(course, moduleId, snapshotTimestamp);
  await r2PutObject(config, snapshotKey, Buffer.from(manifestJson), 'application/json');

  const localDir = path.join(ROOT, 'docs/course-audit/listen-mode/cloud-backup');
  mkdirSync(localDir, { recursive: true });
  const localManifestPath = path.join(localDir, `module-${moduleId}-snapshot-${snapshotTimestamp}.json`);
  writeFileSync(localManifestPath, manifestJson);

  console.log(`\n--- Summary ---`);
  console.log(`Present: ${present.length} (uploaded: ${uploaded.length}, reused: ${reused.length})`);
  console.log(`Skipped (not present, optional): ${results.length - present.length}`);
  console.log(`Total bytes: ${totalBytes}`);
  console.log(`Snapshot manifest (R2): ${snapshotKey}`);
  console.log(`Snapshot manifest (local): ${path.relative(ROOT, localManifestPath)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('BACKUP FAILED:', err.message);
    process.exitCode = 1;
  });
}

export { getSourceManifest, backupFile, buildSnapshotManifest, snapshotKeyFor, SCHEMA_VERSION };
