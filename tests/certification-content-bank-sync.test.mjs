// Fails if the generated content-bank.mjs is out of sync with the LOCKED
// markdown authority files -- i.e. if a locked source file changed without
// re-running scripts/build-module12-assessment-bank.mjs, or if the generated
// bank's item counts/IDs/wording drifted from what the parser would produce
// right now. Run: node tests/certification-content-bank-sync.test.mjs

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { SOURCE_HASHES } from '../functions/_lib/certification/content-bank.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

const KNOWLEDGE_MD = path.join(ROOT, 'docs/course-audit/modules/module-12-final-knowledge-bank.md');
const CASES_MD = path.join(ROOT, 'docs/course-audit/modules/module-12-final-applied-cases.md');
const INTERVIEWS_MD = path.join(ROOT, 'docs/course-audit/modules/module-12-final-interview-bank.md');

// ---- Hash check: the generated file's embedded SOURCE_HASHES must match
// the CURRENT locked markdown files on disk right now. ----
(function hashSync() {
  const currentHashes = {
    knowledgeBankMd: sha256(readFileSync(KNOWLEDGE_MD, 'utf8')),
    appliedCasesMd: sha256(readFileSync(CASES_MD, 'utf8')),
    interviewBankMd: sha256(readFileSync(INTERVIEWS_MD, 'utf8')),
  };
  check('SYNC', 'Knowledge bank markdown hash matches the generated bank\'s embedded hash', currentHashes.knowledgeBankMd === SOURCE_HASHES.knowledgeBankMd, 'run: node scripts/build-module12-assessment-bank.mjs');
  check('SYNC', 'Applied cases markdown hash matches the generated bank\'s embedded hash', currentHashes.appliedCasesMd === SOURCE_HASHES.appliedCasesMd, 'run: node scripts/build-module12-assessment-bank.mjs');
  check('SYNC', 'Interview bank markdown hash matches the generated bank\'s embedded hash', currentHashes.interviewBankMd === SOURCE_HASHES.interviewBankMd, 'run: node scripts/build-module12-assessment-bank.mjs');
})();

// ---- Full regeneration check: running the generator with --check must
// report the file as in sync (byte-for-byte). This catches drift the hash
// check alone could miss if someone hand-edited content-bank.mjs directly. ----
(function regenerationCheck() {
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'scripts/build-module12-assessment-bank.mjs'), '--check'], { stdio: 'pipe' });
    check('SYNC', 'scripts/build-module12-assessment-bank.mjs --check reports no drift', true);
  } catch (e) {
    check('SYNC', 'scripts/build-module12-assessment-bank.mjs --check reports no drift', false, (e.stdout || e.message || '').toString().slice(0, 300));
  }
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
