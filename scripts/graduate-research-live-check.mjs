// Read-only production check. Public Actions logs contain aggregate counts only:
// never tokens, user records, source IDs, claim text, internal fields, or bodies.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseGraduateQuery,queryGraduateLibrary,requireGraduate} from '../functions/_lib/research/graduate-library.mjs';
const env=process.env;
assert.ok(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY,'Existing Supabase test configuration is required.');
for(const q of ['Hair Biology','Scalp Microbiome']) {
 const r=await queryGraduateLibrary(env,parseGraduateQuery(new URLSearchParams({q})));
 assert.ok(r.claims.length>0,`${q} must have eligible real findings.`);
 for(const c of r.claims) {
  assert.equal(c.source_id,c.source.source_id);
  assert.ok(['CLAIM_VERIFIED','AIMT_APPROVED'].includes(c.verification_status));
  assert.ok(c.source.title && c.source.year && c.source.original_url,'Citation metadata must resolve.');
 }
 console.log(`${q}: PASS (${r.claims.length} eligible findings on first page; more=${r.has_more}).`);
}
const anon=readFileSync('assets/js/aimt-graduate-research.js','utf8').match(/const SUPABASE_ANON_KEY = '([^']+)'/)[1];
for(const table of ['research_claims','research_sources','research_topics']) {
 const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`,{headers:{apikey:anon,Authorization:`Bearer ${anon}`}});
 if(response.ok)assert.deepEqual(await response.json(),[],`${table} must not be client readable.`);
 else assert.ok([401,403].includes(response.status),'Raw-table denial must be an authorization denial.');
 console.log(`${table}: PASS anonymous raw-table denial.`);
}
const anonymous=await requireGraduate(env,new Request('https://aimtrichology.com/api/graduate-research'));
assert.equal(anonymous.response.status,401);
console.log('Anonymous protected retrieval: PASS.');
console.log('Real graduate, enrolled, and revoked session tests: NOT RUN (no safe session fixtures configured).');
