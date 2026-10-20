// Lightweight documentation wiring check. Does NOT claim policy enforcement,
// owner approval, independent scientific review, real-world success, or
// configured GitHub administrative rules. Zero provider calls or credentials.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFileSync(path.join(root,relative),'utf8');
const standardPath='docs/ai-delivery/AI-DELIVERY-STANDARD.md';
const standard=read(standardPath);

test('one proposed core standard, not competing current policies',()=>{
  assert.ok(standard.includes('**Activation:**'));
  assert.ok(standard.includes('explicit owner approval'));
  assert.equal(existsSync(path.join(root,'docs/ai-delivery/PROPOSED-DELIVERY-SYSTEM.md')),false);
});

test('both coding-agent entry points reference the same contract',()=>{
  const agents=read('AGENTS.md'),claude=read('CLAUDE.md');
  for(const document of [agents,claude]){
    assert.ok(document.includes(standardPath));
    assert.match(document,/owner.*approv|owner.*authoriz|owner explicitly approves/i);
    assert.ok(document.includes('CODEX_HANDOFF.md')||document.includes('CLAUDE.md'));
  }
  assert.doesNotMatch(claude,/Currently pre-launch\. Target: end of July 2026\./);
  assert.match(claude,/entitlement\/auth\/payment/);
});

test('legacy handoff is clearly historical; never instructs stale pre-launch execution',()=>{
  const legacy=read('CODEX_HANDOFF.md');
  assert.match(legacy.slice(0,500),/ARCHIVED.*HISTORICAL HANDOFF/);
  assert.match(legacy.slice(0,700),/No entitlement/);
  assert.match(legacy.slice(0,700),/AGENTS\.md/);
});

test('single PR record has observable acceptance, total budget, rollback and honest status',()=>{
  const record=read('.github/pull_request_template.md');
  for(const phrase of ['Requested outcome','Out of scope','Risk tier','VERIFIED','Highest-risk assumption',
    'Independent review','total','Rollback','Still unproven']) assert.ok(record.includes(phrase),phrase);
});

test('standard addresses independently found risks; document presence is NOT control enforcement',()=>{
  for(const phrase of ['aggregate task/campaign cap','remote atomic reservation ledger',
    'deployed body matches the reviewed artifact','two attempts','one owner-approved primary outcome',
    'independent architecture challenge','NOT VERIFIED']) assert.ok(standard.includes(phrase),phrase);
  assert.match(standard,/instruction aids, not technical enforcement/i);
});
