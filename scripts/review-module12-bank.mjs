#!/usr/bin/env node
// AIMT Module 12 — offline content-bank QA viewer for the owner.
//
// WHY THIS IS A LOCAL SCRIPT, NOT A LIVE ENDPOINT: Module 12 Review Mode
// (assets/js/module12-certification.js) is gated only by a client-side
// hostname/query-param check (`?review=1` on a branch-preview URL) -- branch
// preview URLs are not truly private. Serving the full de-keyed bank, or
// even unlimited fresh constrained draws, from a live Cloudflare Pages
// Function reachable by that gate (or by any authenticated enrolled student)
// would meaningfully increase how much of the bank could be scraped before
// ever taking a real attempt (Standard Section 16's "reduce the value of
// scraping the full bank" concern). This script reads content-bank.mjs
// directly (server-side code, never bundled to the browser) and never
// touches Supabase, never creates an attempt, never issues a certificate --
// it satisfies task instruction #14 ("a safe Review Mode method to inspect
// the real final content... without creating production records") by being
// something only someone with local repo access can run, exactly like
// reading this traceability doc or running the test suite.
//
// Usage:
//   node scripts/review-module12-bank.mjs                 sample one seeded attempt (40/4/3)
//   node scripts/review-module12-bank.mjs --seed 42        regenerate a different sample draw
//   node scripts/review-module12-bank.mjs --all            browse the entire approved bank
//   node scripts/review-module12-bank.mjs --out path.html  write to a custom path
//
// Output is an HTML file (default: scripts/.module12-review-output.html,
// gitignored -- never commit generated QA output) with two clearly labeled
// sections: STUDENT VIEW (exactly what a real attempt would render) and
// INTERNAL ANSWER KEY (correct answers/rubrics, for the owner's own QA only
// -- this file must never be published or deployed).

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function mline(s) { return esc(s).replace(/\n/g, '<br>'); }

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function renderKnowledgeItem(item) {
  return `
    <div class="item">
      <div class="item-id">${esc(item.id)} &middot; Module ${item.sourceModule} &middot; ${esc(item.difficulty)}${item.status !== 'approved' ? ' &middot; <span class="draft">DRAFT/BLOCKED — excluded from real attempts</span>' : ''}</div>
      <div class="prompt">${mline(item.prompt)}</div>
      <ol type="A">${item.choices.map((c, i) => `<li${i === item.correctChoice ? ' class="correct"' : ''}>${esc(c)}</li>`).join('')}</ol>
      <div class="key">Correct: ${'ABCD'[item.correctChoice]} &mdash; ${esc(item.rationale)}</div>
      <div class="meta">Domains: ${item.criticalDomainEvidence.join(', ') || 'none'} &middot; Source: ${esc(item.sourceSection)}</div>
    </div>`;
}

function renderCasePart(part) {
  let body = '';
  if (part.type === 'structured-short-response') {
    body = `<div class="prompt">${mline(part.prompt)}</div><div class="key">Rubric: ${esc(JSON.stringify(part.rubric))}</div>`;
  } else if (part.type === 'classification') {
    body = `<div class="prompt">${mline(part.prompt)}</div><ul>${part.items.map((it) => `<li>${esc(it.label)} &rarr; <strong>${esc(part.correctAnswer[it.id])}</strong></li>`).join('')}</ul>`;
  } else {
    body = `<div class="prompt">${mline(part.prompt)}</div><ol type="A">${part.choices.map((c, i) => `<li${(Array.isArray(part.correctAnswer) ? part.correctAnswer.includes(i) : part.correctAnswer === i) ? ' class="correct"' : ''}>${esc(c)}</li>`).join('')}</ol>`;
  }
  return `<div class="part"><div class="item-id">${esc(part.id)} (${esc(part.type)})</div>${body}</div>`;
}

function renderCase(item) {
  return `
    <div class="item">
      <div class="item-id">${esc(item.id)} &middot; Modules ${item.sourceModules.join(', ')}${item.status !== 'approved' ? ' &middot; <span class="draft">DRAFT/BLOCKED</span>' : ''}</div>
      <div class="scenario">${mline(item.scenario)}</div>
      ${item.parts.map(renderCasePart).join('')}
      ${item.criticalFlags && item.criticalFlags.length ? `<div class="key">Critical flags: ${item.criticalFlags.map((f) => esc(f.description || JSON.stringify(f))).join(' | ')}</div>` : ''}
      <div class="meta">Domains: ${item.criticalDomainEvidence.join(', ') || 'none'} &middot; Source: ${esc(item.sourceSection)}</div>
    </div>`;
}

function renderInterview(item) {
  return `
    <div class="item">
      <div class="item-id">${esc(item.id)} &middot; Modules ${item.sourceModules.join(', ')}${item.status !== 'approved' ? ' &middot; <span class="draft">DRAFT/BLOCKED</span>' : ''}</div>
      <div class="prompt">${mline(item.primaryPrompt)}</div>
      <div class="meta">Follow-up: ${mline(item.followUpPrompt || '')}</div>
      <ul>${item.rubricCriteria.map((c) => `<li><strong>${esc(c.label)}</strong>${c.guidance && c.guidance !== c.label ? ' — ' + esc(c.guidance) : ''}${c.explicitUnsafeRule ? ' <em>(Type A: ' + esc(c.explicitUnsafeRule.description) + ')</em>' : ''}</li>`).join('')}</ul>
      <div class="meta">Domains: ${item.criticalDomainEvidence.join(', ') || 'none'} &middot; Source: ${esc(item.sourceSection)}</div>
    </div>`;
}

function page(title, bodyHtml) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
    body { font-family: -apple-system, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; color: #222; }
    h1 { font-size: 1.3rem; } h2 { font-size: 1.05rem; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 2rem; }
    .item { border: 1px solid #ddd; border-radius: 8px; padding: 0.9rem 1.1rem; margin-bottom: 1rem; }
    .part { border-top: 1px dashed #ccc; margin-top: 0.6rem; padding-top: 0.6rem; }
    .item-id { font-family: monospace; font-size: 0.72rem; color: #666; margin-bottom: 0.4rem; }
    .prompt, .scenario { margin-bottom: 0.5rem; }
    .key { background: #fef6e0; padding: 6px 8px; border-radius: 6px; font-size: 0.85rem; margin-top: 0.4rem; }
    .meta { font-size: 0.72rem; color: #888; margin-top: 0.4rem; }
    .correct { font-weight: 700; color: #2a6b2a; }
    .draft { color: #a33; font-weight: 700; }
    .banner { background: #222; color: #fff; padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.8rem; margin-bottom: 1.5rem; }
  </style></head><body>
  <div class="banner">INTERNAL OWNER QA ONLY — never publish, deploy, or embed this file. Generated locally by scripts/review-module12-bank.mjs. Contains answer keys and rubrics.</div>
  <h1>${esc(title)}</h1>
  ${bodyHtml}
  </body></html>`;
}

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const seedIdx = args.indexOf('--seed');
  const seed = seedIdx !== -1 ? Number(args[seedIdx + 1]) : Math.floor(Math.random() * 1e9);
  const outIdx = args.indexOf('--out');
  const outPath = outIdx !== -1 ? path.resolve(args[outIdx + 1]) : path.join(ROOT, 'scripts/.module12-review-output.html');

  const bankMod = await import(path.join(ROOT, 'functions/_lib/certification/content-bank.mjs'));
  const banks = bankMod.getProductionBanks();

  if (all) {
    const byModule = {};
    for (const item of banks.knowledgeBank) {
      byModule[item.sourceModule] = byModule[item.sourceModule] || [];
      byModule[item.sourceModule].push(item);
    }
    let html = `<h2>Part I — Knowledge Bank (${banks.knowledgeBank.length} total)</h2>`;
    for (const mod of Object.keys(byModule).sort((a, b) => Number(a) - Number(b))) {
      html += `<h3>Module ${mod} (${byModule[mod].length} items)</h3>` + byModule[mod].map(renderKnowledgeItem).join('');
    }
    html += `<h2>Part II — Applied Cases (${banks.caseBank.length} total)</h2>` + banks.caseBank.map(renderCase).join('');
    html += `<h2>Part III — Practitioner Conversations (${banks.interviewBank.length} total)</h2>` + banks.interviewBank.map(renderInterview).join('');
    writeFileSync(outPath, page('Module 12 — Full Bank QA (all items)', html), 'utf8');
    console.log(`Wrote full-bank QA view to ${outPath}`);
    console.log(`Knowledge: ${banks.knowledgeBank.length} (${banks.knowledgeBank.filter((i) => i.status === 'approved').length} approved)`);
    console.log(`Cases: ${banks.caseBank.length} (${banks.caseBank.filter((i) => i.status === 'approved').length} approved)`);
    console.log(`Interviews: ${banks.interviewBank.length} (${banks.interviewBank.filter((i) => i.status === 'approved').length} approved)`);
    return;
  }

  const { assembleAttempt } = await import(path.join(ROOT, 'functions/_lib/certification/randomization.mjs'));
  const { getCurrentAssessmentConfig } = await import(path.join(ROOT, 'functions/_lib/certification/assessment-config.mjs'));
  const config = getCurrentAssessmentConfig();
  const rng = mulberry32(seed);
  const result = assembleAttempt(banks, config, { rng });
  if (!result.ok) {
    console.error('Could not assemble a sample attempt:', result);
    process.exit(1);
  }
  let html = `<p>Seed: <code>${seed}</code> — re-run with <code>--seed ${seed}</code> to reproduce, or omit --seed for a new random draw.</p>`;
  html += `<h2>Part I — Knowledge (${result.partI.length} selected)</h2>` + result.partI.map(renderKnowledgeItem).join('');
  html += `<h2>Part II — Applied Cases (${result.partII.length} selected)</h2>` + result.partII.map(renderCase).join('');
  html += `<h2>Part III — Practitioner Conversations (${result.partIII.length} selected)</h2>` + result.partIII.map(renderInterview).join('');
  html += `<h2>Critical-domain evidence matrix</h2><pre>${esc(JSON.stringify(result.evidenceMatrix, null, 2))}</pre>`;
  writeFileSync(outPath, page(`Module 12 — Sample Attempt (seed ${seed})`, html), 'utf8');
  console.log(`Wrote sample-attempt QA view to ${outPath}`);
  console.log(`Seed: ${seed} (pass --seed ${seed} to reproduce, or a different number for a new draw)`);
}

main();
