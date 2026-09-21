#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   AIMT Research Library — static RLS policy check
   ---------------------------------------------------------------
   No live Supabase project exists to test RLS against yet (the
   migration hasn't been applied), so this is a static assertion
   against the migration SQL itself: parses every `create policy`
   statement and fails unless the set of policies exactly matches
   the intended allowlist below. Re-run this any time the migration
   file changes -- it's the fastest way to catch a future edit that
   accidentally reopens client access to a raw research table.

   Usage:
     node scripts/research-library-rls-check.mjs
   ═══════════════════════════════════════════════════════════════ */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MIGRATION = path.join(ROOT, 'supabase/migrations/20260920_create_research_library.sql');

/* Every table the migration creates. Tables NOT in ALLOWED_POLICIES below
   must have zero `create policy` statements anywhere in the file -- RLS
   enabled, service-role only, no client access of any kind. */
const ALL_TABLES = [
  'research_topics', 'research_sources', 'research_claims',
  'research_source_topics', 'research_claim_topics', 'research_relationships',
  'research_verification_queue', 'research_coverage', 'research_ingestion_log',
  'research_ingestion_quarantine', 'research_embeddings', 'research_public_pages',
  'research_curriculum_links'
];

/* The ONLY client-facing (anon/authenticated) policies this migration
   should ever create. Anything else found in the file is a failure.
   research_sources and research_claims are deliberately absent -- raw
   research rows (verification_notes, body_markdown, extras, reviewer
   names, ...) must never be client-readable, regardless of `published`. */
const ALLOWED_POLICIES = [
  { table: 'research_public_pages', name: 'research_public_pages_select_published', roles: ['anon', 'authenticated'], using: "status = 'published'" }
];

function main() {
  const sql = readFileSync(MIGRATION, 'utf8');
  const failures = [];

  /* Find every `create policy "<name>" on public.<table> ... for select
     to <roles> using (<expr>);` block (single policy shape used throughout
     this migration -- select-only, no insert/update/delete policies exist
     anywhere in the file). */
  const policyRe = /create policy "([^"]+)"\s*\n\s*on public\.(\w+)\s*\n\s*for select\s*\n\s*to ([\w, ]+)\s*\n\s*using \(([^)]+)\)/g;
  const found = [];
  let m;
  while ((m = policyRe.exec(sql))) {
    found.push({
      name: m[1],
      table: m[2],
      roles: m[3].split(',').map((r) => r.trim()),
      using: m[4].trim()
    });
  }

  console.log(`Found ${found.length} create-policy statement(s) in ${path.relative(ROOT, MIGRATION)}:`);
  for (const p of found) console.log(`  - ${p.table}.${p.name}  to ${p.roles.join(',')}  using (${p.using})`);

  // 1. Every found policy must be in the allowlist, exactly.
  for (const p of found) {
    const allowed = ALLOWED_POLICIES.find((a) => a.table === p.table && a.name === p.name);
    if (!allowed) {
      failures.push(`UNEXPECTED policy ${p.table}.${p.name} -- not in ALLOWED_POLICIES. If this is intentional, update the allowlist; if not, a raw table just got exposed.`);
      continue;
    }
    if (JSON.stringify([...p.roles].sort()) !== JSON.stringify([...allowed.roles].sort())) {
      failures.push(`${p.table}.${p.name}: roles ${JSON.stringify(p.roles)} != expected ${JSON.stringify(allowed.roles)}`);
    }
    if (p.using !== allowed.using) {
      failures.push(`${p.table}.${p.name}: using-clause ${JSON.stringify(p.using)} != expected ${JSON.stringify(allowed.using)}`);
    }
  }

  // 2. Every allowlisted policy must actually be present (not silently dropped).
  for (const a of ALLOWED_POLICIES) {
    if (!found.some((p) => p.table === a.table && p.name === a.name)) {
      failures.push(`MISSING expected policy ${a.table}.${a.name} -- research_public_pages should still be publicly readable for status='published'.`);
    }
  }

  // 3. Explicitly confirm the two raw tables have RLS enabled and NO create-policy statement at all.
  for (const table of ['research_sources', 'research_claims']) {
    const enabledRe = new RegExp(`alter table public\\.${table} enable row level security`);
    if (!enabledRe.test(sql)) failures.push(`${table}: RLS not found enabled in the migration`);
    if (found.some((p) => p.table === table)) failures.push(`${table}: has a client policy -- raw research table must be service-role only`);
  }

  // 4. Every table must have RLS enabled (defense against a table added later without it).
  for (const table of ALL_TABLES) {
    const enabledRe = new RegExp(`alter table public\\.${table} enable row level security`);
    if (!enabledRe.test(sql)) failures.push(`${table}: RLS not enabled anywhere in the migration`);
  }

  if (failures.length === 0) {
    console.log('\nPASS -- policy set matches the allowlist exactly. research_sources / research_claims have RLS enabled with zero client policies; research_public_pages is the only client-readable table, published-only.');
    process.exit(0);
  }
  console.error(`\nFAIL -- ${failures.length} issue(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

main();
