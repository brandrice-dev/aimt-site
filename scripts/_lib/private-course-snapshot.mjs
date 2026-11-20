/* Source-of-truth bridge during the public/private course split.
   Tests and authoring scripts read exactly the approved original course blob
   from Git history WITHOUT shipping paid lessons into the public HTML or
   committing a new public copy. Requires checkout fetch-depth: 0.

   Once the repo becomes private, promote the next curriculum revision into
   a controlled private source artifact; do not silently keep testing a
   historical revision. This pinned source is intentional and temporary. */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const PRIVATE_SOURCE_COMMIT = '45d61c704624bd4fedef9bdeabf6e167889c92df';
export const PRIVATE_SOURCE_BLOB = '798a6542c6dcb1a78329e5909316d3997cc6cd34';

export function readPrivateCourseSnapshot() {
  const spec = PRIVATE_SOURCE_COMMIT + ':headspa-mastery.html';
  const blob = execFileSync('git', ['rev-parse', spec], { cwd: ROOT, encoding: 'utf8' }).trim();
  if (blob !== PRIVATE_SOURCE_BLOB) throw new Error('Private course snapshot digest mismatch; do not proceed.');
  const text = execFileSync('git', ['show', spec], { cwd: ROOT, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (!text.includes('id="courseHome"') || !text.includes('id="module12Wrap"')) throw new Error('Private course snapshot incomplete.');
  return text;
}
