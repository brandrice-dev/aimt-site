#!/usr/bin/env node
/* Read-only snapshot of the LIVE Research Library (claims + sources) for
   coverage comparison against the local export. GET only, through the
   read-only guard. Writes to research-import/ (gitignored). Never prints
   credentials. Usage: node scripts/cadence-research-shadow/live-snapshot.mjs */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createReadOnlyFetch } from './read-only-fetch.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(2); }
const roFetch = createReadOnlyFetch(SUPABASE_URL);
const headers = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` };

async function pageAll(table, select, order) {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const qs = new URLSearchParams({ select, order, limit: '1000', offset: String(offset) });
    const res = await roFetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, { headers });
    if (!res.ok) throw new Error(`${table} read failed: HTTP ${res.status}`);
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

const claims = await pageAll('research_claims',
  'claim_id,source_id,claim_text,claim_type,direction,topics,verification_status,verification_review_status,use_status,claim_origin,page_or_section_locator,verified_on,body_markdown,first_imported_at',
  'claim_id.asc');
const sources = await pageAll('research_sources',
  'source_id,title,authors,year,doi,url,source_venue,evidence_type,source_role,verification_status,first_imported_at',
  'source_id.asc');
const dir = path.join(ROOT, 'research-import/cadence-research-shadow/live-snapshot', 'data');
mkdirSync(dir, { recursive: true });
writeFileSync(path.join(dir, 'claims.jsonl'), claims.map((c) => JSON.stringify(c)).join('\n') + '\n');
writeFileSync(path.join(dir, 'sources.jsonl'), sources.map((s) => JSON.stringify(s)).join('\n') + '\n');
console.log(`live snapshot: ${claims.length} claims, ${sources.length} sources -> ${path.relative(ROOT, dir)}`);
