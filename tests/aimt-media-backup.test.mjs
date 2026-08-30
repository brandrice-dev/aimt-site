// AIMT cloud media backup/restore -- deterministic regression suite.
//
// R2 is not enabled on this Cloudflare account (confirmed: both
// r2_buckets_list and r2_bucket_create return 403 error 10042, "Please
// enable R2 through the Cloudflare Dashboard" -- a one-time interactive
// dashboard action, not something any API token can do). This suite
// therefore covers everything that IS verifiable without a live R2
// connection: content-addressing, hashing, the reuse-vs-upload decision
// (via dependency-injected fakes), the snapshot manifest schema, restore's
// overwrite-refusal and checksum validation (also via injected fakes),
// and repo hygiene (no secrets, no large CapCut binary accidentally
// Git-tracked). It does NOT exercise a live PUT/GET/HEAD against R2 --
// that's the one thing this suite cannot prove until R2 is enabled.
//
// Run: node tests/aimt-media-backup.test.mjs

import { readFileSync, existsSync, statSync, mkdtempSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const {
  sha256Hex, sha256File, contentAddressedKey, mimeTypeFor, requireR2Config
} = await import(path.join(ROOT, 'scripts/_lib/r2-s3-client.mjs'));

const {
  getSourceManifest, backupFile, buildSnapshotManifest, snapshotKeyFor
} = await import(path.join(ROOT, 'scripts/aimt-media-backup.mjs'));

const { restoreFile } = await import(path.join(ROOT, 'scripts/aimt-media-restore.mjs'));

// ─────────────────────────────────────────────────────────────────────────
// A. SHA-256 hashing
// ─────────────────────────────────────────────────────────────────────────
(function hashing() {
  check('A. SHA-256 HASHING', 'known test vector: sha256("") = e3b0c44...', sha256Hex('') === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  check('A. SHA-256 HASHING', 'known test vector: sha256("abc") = ba7816bf...', sha256Hex('abc') === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  const rawPath = path.join(ROOT, 'assets/audio/listen/headspa-mastery/module-01/raw/m1-01.mp3');
  if (existsSync(rawPath)) {
    const viaFile = sha256File(rawPath);
    const viaBuffer = sha256Hex(readFileSync(rawPath));
    check('A. SHA-256 HASHING', 'sha256File() matches sha256Hex() of the same bytes read independently', viaFile === viaBuffer);
    check('A. SHA-256 HASHING', 'sha256File() is deterministic across repeated calls', sha256File(rawPath) === sha256File(rawPath));
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// B. Content-addressed key generation
// ─────────────────────────────────────────────────────────────────────────
(function contentAddressing() {
  const hash = 'a1b2c3d4e5f60000000000000000000000000000000000000000000000000000';
  const key = contentAddressedKey(hash, 'm1-01.mp3');
  check('B. CONTENT-ADDRESSED KEYS', 'key follows blobs/sha256/<first2>/<fullhash>/<filename>', key === `blobs/sha256/a1/${hash}/m1-01.mp3`, key);
  check('B. CONTENT-ADDRESSED KEYS', 'two different hashes produce two different keys for the same filename', contentAddressedKey('aa'.repeat(32), 'x.mp3') !== contentAddressedKey('bb'.repeat(32), 'x.mp3'));
  check('B. CONTENT-ADDRESSED KEYS', 'the same hash + filename always produces the same key (deterministic, dedup-friendly)', contentAddressedKey(hash, 'm1-01.mp3') === contentAddressedKey(hash, 'm1-01.mp3'));
  check('B. CONTENT-ADDRESSED KEYS', 'mimeTypeFor recognizes mp3/wav/flac/json/md, case-insensitively', mimeTypeFor('x.mp3') === 'audio/mpeg' && mimeTypeFor('x.WAV') === 'audio/wav' && mimeTypeFor('x.FLAC') === 'audio/flac' && mimeTypeFor('x.json') === 'application/json' && mimeTypeFor('x.md') === 'text/markdown');
})();

// ─────────────────────────────────────────────────────────────────────────
// C. Duplicate reuse behavior (fake R2 client -- no network)
// ─────────────────────────────────────────────────────────────────────────
await (async function reuseBehavior() {
  const rawPath = path.join(ROOT, 'assets/audio/listen/headspa-mastery/module-01/raw/m1-01.mp3');
  if (!existsSync(rawPath)) { check('C. DUPLICATE REUSE', 'm1-01 raw source exists to test against', false); return; }
  const size = statSync(rawPath).size;

  // Case 1: object already exists at the content-addressed key -> reused,
  // PUT never called. Existence alone is sufficient (no size check --
  // real R2 testing found Cloudflare's edge drops Content-Length on HEAD
  // for gzip-re-encoded compressible content-types like JSON).
  let putCalled = false;
  const reuseDeps = {
    headObject: async () => ({ size, contentType: 'audio/mpeg' }),
    putObject: async () => { putCalled = true; },
    getObject: async () => { throw new Error('should not be called on reuse'); }
  };
  const reuseResult = await backupFile({ bucket: 'test' }, { relPath: 'assets/audio/listen/headspa-mastery/module-01/raw/m1-01.mp3', role: 'raw-elevenlabs-generation', required: true }, reuseDeps);
  check('C. DUPLICATE REUSE', 'existing object at the content-addressed key is reused, not re-uploaded', reuseResult.status === 'reused-existing-blob');
  check('C. DUPLICATE REUSE', 'putObject is never called when the blob already exists', !putCalled);

  // Case 1b: a HEAD response with size 0 (the real, observed shape when
  // Cloudflare's edge gzip-encodes a compressible content-type and drops
  // Content-Length) still counts as "exists" -> reused, not re-uploaded.
  let putCalledForZeroSize = false;
  const zeroSizeHeadDeps = {
    headObject: async () => ({ size: 0, contentType: 'application/json' }),
    putObject: async () => { putCalledForZeroSize = true; },
    getObject: async () => { throw new Error('should not be called on reuse'); }
  };
  const zeroSizeResult = await backupFile({ bucket: 'test' }, { relPath: 'assets/audio/listen/headspa-mastery/module-01/raw/m1-01.mp3', role: 'raw-elevenlabs-generation', required: true }, zeroSizeHeadDeps);
  check('C. DUPLICATE REUSE', 'a HEAD result with an unreliable/zero size (gzip Content-Length loss) still counts as existing, not re-uploaded', zeroSizeResult.status === 'reused-existing-blob' && !putCalledForZeroSize);

  // Case 2: object does not exist -> uploaded, PUT called exactly once,
  // verified via a real GET + SHA-256 comparison (not a HEAD size check).
  let putCallCount = 0;
  let uploadedBytes = null;
  const uploadDeps = {
    headObject: async () => null,
    putObject: async (config, key, bytes) => { putCallCount++; uploadedBytes = bytes; },
    getObject: async () => uploadedBytes
  };
  const uploadResult = await backupFile({ bucket: 'test' }, { relPath: 'assets/audio/listen/headspa-mastery/module-01/raw/m1-01.mp3', role: 'raw-elevenlabs-generation', required: true }, uploadDeps);
  check('C. DUPLICATE REUSE', 'missing object triggers exactly one upload', uploadResult.status === 'uploaded' && putCallCount === 1);

  // Case 3: the post-upload GET returns bytes that don't match the local
  // SHA-256 (simulated transit corruption) -> hard error, not accepted.
  const corruptDeps = {
    headObject: async () => null,
    putObject: async () => {},
    getObject: async () => Buffer.from('corrupted, not the real uploaded bytes')
  };
  let corruptThrew = false;
  try {
    await backupFile({ bucket: 'test' }, { relPath: 'assets/audio/listen/headspa-mastery/module-01/raw/m1-01.mp3', role: 'raw-elevenlabs-generation', required: true }, corruptDeps);
  } catch (e) {
    corruptThrew = /does not match the local file's SHA-256/.test(e.message);
  }
  check('C. DUPLICATE REUSE', 'a post-upload GET whose SHA-256 does not match the local file is a hard error, never silently accepted', corruptThrew);

  // Case 4: a missing required file throws before any network call is attempted.
  let headCalledForMissing = false;
  const missingDeps = { headObject: async () => { headCalledForMissing = true; return null; }, putObject: async () => {}, getObject: async () => Buffer.alloc(0) };
  let missingThrew = false;
  try {
    await backupFile({ bucket: 'test' }, { relPath: 'assets/audio/listen/headspa-mastery/module-01/raw/does-not-exist.mp3', role: 'raw-elevenlabs-generation', required: true }, missingDeps);
  } catch (e) {
    missingThrew = /REQUIRED file missing/.test(e.message);
  }
  check('C. DUPLICATE REUSE', 'a missing REQUIRED file throws before touching the network (never silently skipped)', missingThrew && !headCalledForMissing);

  // Case 5: a missing optional file is skipped cleanly, no network call, no throw.
  let headCalledForOptional = false;
  const optionalDeps = { headObject: async () => { headCalledForOptional = true; return null; }, putObject: async () => {}, getObject: async () => Buffer.alloc(0) };
  const optionalResult = await backupFile({ bucket: 'test' }, { relPath: 'docs/course-audit/listen-mode/capcut-production/module-01/intake/module-01-capcut-master-processed.flac', role: 'capcut-full-module-processed-export', required: false }, optionalDeps);
  check('C. DUPLICATE REUSE', 'a missing OPTIONAL file is skipped cleanly without a network call', optionalResult.status === 'skipped-not-present' && !headCalledForOptional);
})();

// ─────────────────────────────────────────────────────────────────────────
// D. Snapshot manifest schema
// ─────────────────────────────────────────────────────────────────────────
(function snapshotSchema() {
  const files = [{ relPath: 'a/b.mp3', filename: 'b.mp3', role: 'raw-elevenlabs-generation', sha256: 'x'.repeat(64), sizeBytes: 100, mimeType: 'audio/mpeg', objectKey: 'blobs/sha256/xx/x.../b.mp3', status: 'uploaded', timestampUtc: '2026-08-30T00:00:00.000Z' }];
  const manifest = buildSnapshotManifest({ course: 'headspa-mastery', moduleId: '01', bucket: 'aimt-media-archive', snapshotTimestamp: '2026-08-30T12-00-00-000Z', files, totalBytes: 100 });
  const required = ['schemaVersion', 'course', 'module', 'backupProvider', 'bucket', 'snapshotTimestampUtc', 'objectCount', 'totalBytes', 'files'];
  check('D. SNAPSHOT SCHEMA', 'manifest has every required top-level field', required.every((k) => k in manifest), Object.keys(manifest).join(','));
  check('D. SNAPSHOT SCHEMA', 'course/module identify headspa-mastery / 01', manifest.course === 'headspa-mastery' && manifest.module === '01');
  check('D. SNAPSHOT SCHEMA', 'backupProvider is cloudflare-r2', manifest.backupProvider === 'cloudflare-r2');
  check('D. SNAPSHOT SCHEMA', 'objectCount matches files.length', manifest.objectCount === manifest.files.length);
  check('D. SNAPSHOT SCHEMA', 'each file entry carries sha256, sizeBytes, mimeType, objectKey, status, timestampUtc', ['sha256', 'sizeBytes', 'mimeType', 'objectKey', 'status', 'timestampUtc', 'relPath', 'role'].every((k) => k in manifest.files[0]));
  check('D. SNAPSHOT SCHEMA', 'snapshotKeyFor produces the documented R2 key shape', snapshotKeyFor('headspa-mastery', '01', '2026-08-30T12-00-00-000Z') === 'snapshots/headspa-mastery/listen-mode/module-01/2026-08-30T12-00-00-000Z.json');
})();

// ─────────────────────────────────────────────────────────────────────────
// E. Source manifest completeness (all required entries exist locally now)
// ─────────────────────────────────────────────────────────────────────────
(function sourceManifestCompleteness() {
  const entries = getSourceManifest('headspa-mastery', '01');
  check('E. SOURCE MANIFEST', 'includes all 14 raw ElevenLabs chunks', entries.filter((e) => e.role === 'raw-elevenlabs-generation').length === 14);
  const missingRequired = entries.filter((e) => e.required && !existsSync(path.join(ROOT, e.relPath)));
  check('E. SOURCE MANIFEST', 'every required entry exists locally right now (no path typos)', missingRequired.length === 0, missingRequired.map((e) => e.relPath).join(', '));
  check('E. SOURCE MANIFEST', 'includes the full pre-CapCut module master', entries.some((e) => e.relPath.endsWith('module-01-capcut-master.wav') && e.role === 'capcut-pre-processing-master'));
  check('E. SOURCE MANIFEST', 'includes recovery metadata (boundary manifest, locked standard, instructions, listen-mode data)', entries.filter((e) => e.role === 'recovery-metadata').length >= 4);
  check('E. SOURCE MANIFEST', 'an unconfigured course/module throws clearly rather than returning an empty/silent manifest', (() => {
    try { getSourceManifest('headspa-mastery', '02'); return false; } catch (e) { return /No source manifest configured/.test(e.message); }
  })());
})();

// ─────────────────────────────────────────────────────────────────────────
// F. Restore: refuses overwrite by default, validates checksums
// ─────────────────────────────────────────────────────────────────────────
await (async function restoreBehavior() {
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'aimt-restore-test-'));
  try {
    const destRel = 'some/nested/m1-01.mp3';
    const destAbs = path.join(tmpDir, destRel);

    // Case 1: destination doesn't exist yet -> restores and verifies checksum.
    const goodBytes = Buffer.from('hello world');
    const goodSha = sha256Hex(goodBytes);
    const okDeps = { getObject: async () => goodBytes };
    const okResult = await restoreFile({}, { relPath: destRel, objectKey: 'blobs/sha256/aa/aa.../m1-01.mp3', sha256: goodSha }, destAbs, { overwrite: false }, okDeps);
    check('F. RESTORE BEHAVIOR', 'restores a missing file and reports restored-verified', okResult.status === 'restored-verified' && existsSync(destAbs));
    check('F. RESTORE BEHAVIOR', 'restored bytes on disk match the source bytes', existsSync(destAbs) && readFileSync(destAbs).equals(goodBytes));

    // Case 2: destination now exists -> default run refuses to overwrite.
    let getCalledAgain = false;
    const refuseDeps = { getObject: async () => { getCalledAgain = true; return goodBytes; } };
    const refuseResult = await restoreFile({}, { relPath: destRel, objectKey: 'blobs/sha256/aa/aa.../m1-01.mp3', sha256: goodSha }, destAbs, { overwrite: false }, refuseDeps);
    check('F. RESTORE BEHAVIOR', 'refuses to overwrite an existing file by default', refuseResult.status === 'skipped-exists-no-overwrite' && !getCalledAgain);

    // Case 3: --overwrite explicitly allows it.
    const overwriteDeps = { getObject: async () => goodBytes };
    const overwriteResult = await restoreFile({}, { relPath: destRel, objectKey: 'blobs/sha256/aa/aa.../m1-01.mp3', sha256: goodSha }, destAbs, { overwrite: true }, overwriteDeps);
    check('F. RESTORE BEHAVIOR', 'an explicit overwrite flag allows replacing an existing file', overwriteResult.status === 'restored-verified');

    // Case 4: checksum mismatch is reported, not silently accepted.
    const badBytes = Buffer.from('tampered bytes');
    const mismatchDeps = { getObject: async () => badBytes };
    const mismatchResult = await restoreFile({}, { relPath: 'another/file.mp3', objectKey: 'blobs/sha256/bb/bb.../file.mp3', sha256: goodSha }, path.join(tmpDir, 'another/file.mp3'), { overwrite: false }, mismatchDeps);
    check('F. RESTORE BEHAVIOR', 'a checksum mismatch is reported as CHECKSUM_MISMATCH, not written to disk as if valid', mismatchResult.status === 'CHECKSUM_MISMATCH' && !existsSync(path.join(tmpDir, 'another/file.mp3')));
    check('F. RESTORE BEHAVIOR', 'checksum mismatch report includes both expected and actual hashes', mismatchResult.expectedSha256 === goodSha && mismatchResult.restoredSha256 === sha256Hex(badBytes));
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// G. Fail-closed on missing R2 credentials
// ─────────────────────────────────────────────────────────────────────────
(function failClosed() {
  const savedEnv = { R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID, R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY };
  delete process.env.R2_ACCOUNT_ID;
  delete process.env.R2_ACCESS_KEY_ID;
  delete process.env.R2_SECRET_ACCESS_KEY;
  let threw = false;
  let mentionsAllMissing = false;
  try {
    requireR2Config();
  } catch (e) {
    threw = true;
    mentionsAllMissing = /R2_ACCOUNT_ID/.test(e.message) && /R2_ACCESS_KEY_ID/.test(e.message) && /R2_SECRET_ACCESS_KEY/.test(e.message);
    check('G. FAIL CLOSED', 'error message never contains anything resembling an actual secret value', !/[a-f0-9]{32,}/i.test(e.message));
  }
  check('G. FAIL CLOSED', 'requireR2Config() throws when all three credentials are absent', threw);
  check('G. FAIL CLOSED', 'the error names exactly which variables are missing', mentionsAllMissing);
  check('G. FAIL CLOSED', 'default bucket name is aimt-media-archive when R2_BUCKET is unset', (() => {
    process.env.R2_ACCOUNT_ID = 'acct'; process.env.R2_ACCESS_KEY_ID = 'key'; process.env.R2_SECRET_ACCESS_KEY = 'secret'; delete process.env.R2_BUCKET;
    const cfg = requireR2Config();
    return cfg.bucket === 'aimt-media-archive';
  })());
  // Restore original environment exactly as found.
  for (const [k, v] of Object.entries(savedEnv)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  delete process.env.R2_BUCKET;
})();

// ─────────────────────────────────────────────────────────────────────────
// H. No secrets committed anywhere in the new backup/restore code or docs
// ─────────────────────────────────────────────────────────────────────────
(function noSecretsCommitted() {
  const filesToScan = [
    'scripts/_lib/r2-s3-client.mjs',
    'scripts/aimt-media-backup.mjs',
    'scripts/aimt-media-restore.mjs'
  ];
  const cloudBackupDocDir = path.join(ROOT, 'docs/course-audit/listen-mode/cloud-backup');
  if (existsSync(cloudBackupDocDir)) {
    for (const f of readdirSync(cloudBackupDocDir)) {
      if (f.endsWith('.md')) filesToScan.push(path.relative(ROOT, path.join(cloudBackupDocDir, f)));
    }
  }
  const secretPattern = /R2_ACCESS_KEY_ID\s*[:=]\s*['"]?[A-Za-z0-9/+]{16,}|R2_SECRET_ACCESS_KEY\s*[:=]\s*['"]?[A-Za-z0-9/+]{16,}|AKIA[0-9A-Z]{16}/;
  for (const rel of filesToScan) {
    const abs = path.join(ROOT, rel);
    if (!existsSync(abs)) { check('H. NO SECRETS', rel + ' exists to scan', false); continue; }
    const src = readFileSync(abs, 'utf8');
    check('H. NO SECRETS', rel + ' contains no hardcoded R2 credential value', !secretPattern.test(src));
    if (!rel.endsWith('.md')) {
      check('H. NO SECRETS', rel + ' only reads credentials from process.env, never a literal string assignment', !/R2_(ACCOUNT_ID|ACCESS_KEY_ID|SECRET_ACCESS_KEY)\s*=\s*['"][^'"]+['"]/.test(src));
    }
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// I. Repo hygiene: no large CapCut/media binary accidentally became
//    Git-tracked by this task, and the .gitignore rules from the prior
//    hygiene task are still in force.
// ─────────────────────────────────────────────────────────────────────────
(function repoHygiene() {
  let statusOut = '';
  try {
    statusOut = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' });
  } catch (e) {
    check('I. REPO HYGIENE', 'git status is readable', false, String(e));
    return;
  }
  const trackedLargeMediaLines = statusOut.split('\n').filter((l) => /\.(wav|flac|FLAC|mp3)$/.test(l.trim()) && /^[AM]/.test(l.trim()));
  check('I. REPO HYGIENE', 'no .wav/.flac/.mp3 file is staged/added by this task', trackedLargeMediaLines.length === 0, trackedLargeMediaLines.join(' | '));

  const ignoreCheck = (rel) => {
    try {
      execSync(`git check-ignore "${rel}"`, { cwd: ROOT, stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  };
  check('I. REPO HYGIENE', 'the full CapCut master WAV remains git-ignored (not re-tracked)', !existsSync(path.join(ROOT, 'docs/course-audit/listen-mode/capcut-production/module-01/module-01-capcut-master.wav')) || ignoreCheck('docs/course-audit/listen-mode/capcut-production/module-01/module-01-capcut-master.wav'));
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
