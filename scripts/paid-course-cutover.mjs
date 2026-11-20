#!/usr/bin/env node
/* AIMT paid course cutover — NO DEFAULT WRITE.
   Reads the exact approved pre-split course source and all premium media
   from git history; uploads only to a VERIFIED NON-PUBLIC Supabase bucket.
   Explicit --upload and byte ceiling required. Never embeds source in PR. */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { adminHeaders } from './_lib/supabase-admin-headers.mjs';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE_COMMIT = '45d61c704624bd4fedef9bdeabf6e167889c92df';
const SOURCE_HTML_BLOB = '798a6542c6dcb1a78329e5909316d3997cc6cd34';
const PRIVATE_ROOT = 'headspa-mastery/';
const args = new Set(process.argv.slice(2));
if (![...args].every(a => ['--inventory','--upload','--verify'].includes(a))) {
  throw new Error('Use --inventory, --upload, or --verify only.');
}
if (args.size !== 1) throw new Error('Choose exactly one mode: --inventory, --upload, or --verify.');

const git = (...argv) => execFileSync('git', argv, { cwd: resolve('.'), maxBuffer: 25 * 1024 * 1024 });
function fromGit(path) {
  return git('show', SOURCE_COMMIT + ':' + path);
}
const blob = git('rev-parse', SOURCE_COMMIT + ':headspa-mastery.html').toString().trim();
if (blob !== SOURCE_HTML_BLOB) throw new Error('Pinned private-course source does not match the approved commit.');
function sha256(data) { return createHash('sha256').update(data).digest('hex'); }
const original = fromGit('headspa-mastery.html').toString('utf8');
if (!original.includes('id="courseHome"') || !original.includes('id="module12Wrap"')) {
  throw new Error('Private HTML source is incomplete.');
}
const enhanced = original.replace('</body>', '<script src="/assets/js/aimt-paid-media-session.js"></script>\n</body>');
if (enhanced === original) throw new Error('Private media session hook was not installed.');
const resourcePaths = Object.freeze({
 'module-02-intake': 'assets/images/course/module-02/module-02-head-spa-intake-service-plan-fillable.pdf',
 'module-08-core-map': 'assets/images/course/module-08/module-08-core-format-service-map.png',
 'module-08-extended-map': 'assets/images/course/module-08/module-08-extended-format-service-map.png',
 'module-09-enhancement-guide': 'assets/images/course/module-09/AIMT-Head-Spa-Enhancement-Strategy-Guide.pdf',
 'module-10-reset': 'assets/images/course/module-10/module-10-between-client-sanitation-reset-checklist-fillable.pdf',
 'module-11-toolkit': 'assets/images/course/module-11/module-11-aimt-ai-practice-toolkit-fillable.pdf'
});
const manifest = [{
  source: 'headspa-mastery.html', key: PRIVATE_ROOT + 'course-app.html',
  mime: 'text/html; charset=utf-8', bytes: Buffer.from(enhanced)
}];
const paidFiles = git('ls-tree', '-r', '--name-only', SOURCE_COMMIT, '--',
  'assets/images/course', 'assets/audio/listen/headspa-mastery')
  .toString().trim().split('\n').filter(Boolean);
for (const path of paidFiles) {
  const bytes = fromGit(path);
  const extension = path.split('.').pop().toLowerCase();
  const types = {
    pdf: 'application/pdf', mp3: 'audio/mpeg', png: 'image/png',
    webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml'
  };
  if (!types[extension]) throw new Error('Unrecognized private media type: ' + path);
  manifest.push({ source: path, key: PRIVATE_ROOT + 'media/' + path, mime: types[extension], bytes });
}
for (const [key, source] of Object.entries(resourcePaths)) {
  const path = PRIVATE_ROOT + key.replace(/^module-/, 'module-') + '/' + source.split('/').pop();
  // The existing deployed course-material API uses module-XX/<filename>.
  const moduleDir = key.match(/^module-\d+/)?.[0];
  const dest = PRIVATE_ROOT + moduleDir + '/' + source.split('/').pop();
  manifest.push({ source, key: dest, mime: source.endsWith('.pdf') ? 'application/pdf' : 'image/png', bytes: fromGit(source) });
}
const keys = manifest.map(x => x.key);
if (new Set(keys).size !== keys.length) throw new Error('Duplicate private storage paths.');
const totalBytes = manifest.reduce((sum, x) => sum + x.bytes.length, 0);
const counts = { courseBundles: 1, premiumMedia: paidFiles.length, resources: Object.keys(resourcePaths).length, objects: manifest.length, totalBytes, sourceCommit: SOURCE_COMMIT, sourceBlob: SOURCE_HTML_BLOB };
if (args.has('--inventory')) {
  process.stdout.write(JSON.stringify(counts, null, 2) + '\n');
  process.exit(0);
}
const base = process.env.SUPABASE_URL;
const role = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.PAID_ASSETS_BUCKET;
if (!base || !/^https:\/\/[a-z0-9.-]+$/.test(base) || !role || !/^[a-z0-9][a-z0-9_-]{2,62}$/.test(bucket || '')) {
  throw new Error('SUPABASE_URL, elevated Supabase secret via SUPABASE_SERVICE_ROLE_KEY, and PAID_ASSETS_BUCKET are required; never paste keys into source files.');
}
if (args.has('--upload')) {
  const cap = Number(process.env.AIMT_PAID_MIGRATION_MAX_BYTES);
  if (!Number.isSafeInteger(cap) || cap < totalBytes) throw new Error('Explicit AIMT_PAID_MIGRATION_MAX_BYTES authorization must cover the complete migration.');
}
const headers = adminHeaders(role);
const apiBase = base.replace(/\/$/, '') + '/storage/v1';
async function request(path, options={}) {
  return fetch(apiBase + path, { ...options, headers: { ...headers, ...options.headers } });
}
const bucketResponse = await request('/bucket/' + encodeURIComponent(bucket));
if (!bucketResponse.ok) throw new Error('Private bucket missing or inaccessible (' + bucketResponse.status + ').');
const details = await bucketResponse.json();
if (details.public !== false) throw new Error('Refusing to upload to a public Supabase bucket.');
const encoded = path => path.split('/').map(encodeURIComponent).join('/');
let verified = 0, uploaded = 0;
for (const item of manifest) {
  const path = '/object/authenticated/' + encodeURIComponent(bucket) + '/' + encoded(item.key);
  async function check() {
    const res = await request(path, { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
    if (res.status === 400 || res.status === 404) return false;
    if (!res.ok) throw new Error('Could not verify storage object: ' + item.key + ' ' + res.status);
    const data = Buffer.from(await res.arrayBuffer());
    if (sha256(data) !== sha256(item.bytes)) throw new Error('Private object checksum mismatch: ' + item.key);
    verified++;
    return true;
  }
  if (await check()) continue;
  if (args.has('--verify')) throw new Error('Missing required private object: ' + item.key);
  const uploadPath = '/object/' + encodeURIComponent(bucket) + '/' + encoded(item.key);
  const res = await request(uploadPath, { method: 'POST', headers: {
    'Content-Type': item.mime, 'cache-control': 'no-store', 'x-upsert': 'false'
  }, body: item.bytes });
  if (!res.ok) throw new Error('Upload failed: ' + item.key + ' (' + res.status + '): ' + (await res.text()).slice(0,160));
  uploaded++;
  if (!(await check())) throw new Error('Upload did not persist: ' + item.key);
}
process.stdout.write(JSON.stringify({ ...counts, verified, uploaded, privateBucket: bucket, integrity: 'SHA-256 bytes matched' }, null, 2) + '\n');
