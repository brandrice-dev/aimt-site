import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {requireGraduate,queryGraduateLibrary,parseGraduateQuery,searchExpression} from '../functions/_lib/research/graduate-library.mjs';
import {onRequest} from '../functions/api/graduate-research.js';
import {graduateShell} from '../functions/_lib/research/graduate-view.mjs';
const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'PRIVATE_SERVICE_SECRET'};
const request=path=>new Request(`https://aimtrichology.com/api/graduate-research${path}`,{headers:{Authorization:'Bearer user-session'}});
const credential={credential_id:'AIMT-HS-2026-ABC234',course_slug:'headspa-mastery',revoked:false,completed_at:'2026-01-01'};
const source={source_id:'study-1',title:'Source title',authors:['Author'],year:2024,doi:'10.1000/study',url:'javascript:bad()',topics:['hair-biology'],evidence_type:'observational',source_role:'primary_research',verification_status:'SOURCE_VERIFIED',verification_depth:'abstract',verification_review_status:'not_reviewed',rights_access_status:'paywalled',private_notes:'PRIVATE_SOURCE_NOTES'};
const claim={claim_id:'claim-1',source_id:'study-1',claim_text:'Verified scientific statement.',claim_type:'finding',verification_status:'CLAIM_VERIFIED',verification_review_status:'not_reviewed',direction:'association',topics:['hair-biology'],source,extras:'PRIVATE_EXTRAS',body_markdown:'PRIVATE_BODY'};
function mock(t,fn) {const original=global.fetch;global.fetch=async(...args)=>fn(...args);t.after(()=>{global.fetch=original;});}
function authMock(rows,rest=()=>new Response('[]')) {return (url,options)=>{const u=new URL(url);if(u.pathname==='/auth/v1/user'){assert.equal(options.headers.Authorization,'Bearer user-session');return Response.json({id:'user-1'});}if(u.pathname==='/rest/v1/completions'){assert.equal(u.searchParams.get('user_id'),'eq.user-1');assert.equal(u.searchParams.get('revoked'),'eq.false');return Response.json(rows);}return rest(u,options);};}
test('anonymous and expired sessions cannot query research; no shared secret bypass',async t=>{
 let calls=0;mock(t,()=>{calls++;return new Response('{}',{status:401});});
 const anonymous=await onRequest({env,request:new Request('https://aimtrichology.com/api/graduate-research?source_id=study-1')});assert.equal(anonymous.status,401);assert.equal(calls,0);
 assert.equal((await onRequest({env,request:request('?action=filters')})).status,401);assert.equal(calls,1);
});
for(const [name,rows] of [['enrolled but uncertified',[]],['revoked',[{...credential,revoked:true}]],['null revocation',[{...credential,revoked:null}]],['unissued',[{...credential,credential_id:null}]],['future credential',[{...credential,completed_at:'2999-01-01'}]]])test(`${name} cannot enter, search, filter, or directly retrieve findings`,async t=>{
 mock(t,authMock(rows,()=>{assert.fail('Research must not be touched');}));
 for(const path of ['','?q=hair','?source_id=study-1','?action=filters','?action=access']){const r=await onRequest({env,request:request(path)});assert.equal(r.status,403);assert.match(r.headers.get('cache-control'),/no-store/);}
});
test('certified graduate enters; changing registry revocation denies the next request',async t=>{
 let rows=[credential];mock(t,(...args)=>authMock(rows)(...args));assert.equal((await onRequest({env,request:request('?action=access')})).status,200);rows=[];assert.equal((await onRequest({env,request:request('?action=access')})).status,403);
});
test('database and credential lookup failures fail closed without leaking response bodies',async t=>{
 mock(t,authMock([credential],()=>new Response('PRIVATE_BACKEND_FAILURE',{status:500})));
 const r=await onRequest({env,request:request('')});assert.equal(r.status,503);assert.ok(!(await r.text()).includes('PRIVATE'));
});
test('search uses source and claim indexes, keeps verification gates and paginates on server',async t=>{
 const calls=[];mock(t,(url)=>{const u=new URL(url);calls.push(u);if(u.pathname.endsWith('research_sources'))return Response.json([{source_id:'study-1'}]);return Response.json(Array.from({length:21},(_,i)=>({...claim,claim_id:`c${i}`})));});
 const p=parseGraduateQuery(new URLSearchParams('q=What+does+research+suggest+about+scalp+microbiome%3F&topic=scalp-health&year=2024&evidence_type=observational&category=primary_research&page=2'));
 const r=await queryGraduateLibrary(env,p);assert.equal(r.claims.length,20);assert.equal(r.has_more,true);assert.equal(calls.length,2);
 const qs=calls[1].searchParams;assert.equal(qs.get('offset'),'20');assert.equal(qs.get('limit'),'21');assert.equal(qs.get('verified_against_primary_source'),'eq.true');assert.equal(qs.get('use_status'),'in.(active,provisional)');assert.equal(qs.get('source.use_status'),'in.(active,provisional)');assert.equal(qs.get('source.verification_status'),'eq.SOURCE_VERIFIED');assert.equal(qs.get('verification_status'),'in.(CLAIM_VERIFIED,AIMT_APPROVED)');assert.equal(qs.get('source.year'),'eq.2024');assert.equal(qs.get('topics'),'cs.{scalp-health}');assert.match(qs.get('or'),/source_id.in.\(study-1\)/);assert.ok(!qs.get('claim_origin').includes('library_summary'));assert.ok(!qs.get('verification_review_status').includes('reviewed_unsupported'));assert.ok(!qs.get('source.rights_access_status').includes('restricted'));
 assert.equal(r.claims[0].source.original_url,'https://doi.org/10.1000/study');const out=JSON.stringify(r);assert.ok(!out.includes('PRIVATE'));assert.ok(!out.includes('body_markdown'));
});
test('verification filters cannot downgrade; IDs and PostgREST filter injection are rejected',()=>{
 for(const query of ['verification=DISCOVERED','source_id=x),or=(use_status.eq.excluded','topic=x,private','year=2024,2025','page=0','page=2.5','category=made_up','q='+ 'a'.repeat(201)])assert.throws(()=>parseGraduateQuery(new URLSearchParams(query)));
 assert.equal(searchExpression('What does the research suggest about Hair Biology?'),'"hair" "biology"');
});
test('newly eligible rows are queried each time and source/claim IDs remain connected',async t=>{
 let rows=[claim];mock(t,()=>Response.json(rows));const p=parseGraduateQuery(new URLSearchParams());assert.equal((await queryGraduateLibrary(env,p)).claims.length,1);rows.push({...claim,claim_id:'new-claim'});const result=await queryGraduateLibrary(env,p);assert.equal(result.claims.length,2);assert.equal(result.claims[1].source_id,result.claims[1].source.source_id);
});
test('claim drill-down applies the same gates and exact source and claim filters',async t=>{
 mock(t,url=>{const q=new URL(url).searchParams;assert.equal(q.get('claim_id'),'eq.claim-1');assert.equal(q.get('source_id'),'eq.study-1');assert.equal(q.get('use_status'),'in.(active,provisional)');return Response.json([claim]);});
 assert.equal((await queryGraduateLibrary(env,parseGraduateQuery(new URLSearchParams('source_id=study-1&claim_id=claim-1')))).claims.length,1);
});
test('public shell has no findings, no indexing, accessible controls and separate dashboard entry',()=>{
 const html=graduateShell();assert.ok(!html.includes('Verified scientific statement.'));assert.match(html,/noindex,nofollow/);assert.match(html,/role="search"/);assert.match(html,/aria-live="polite"/);assert.match(html,/name="evidence_type"/);assert.match(readFileSync('my-aimt.html','utf8'),/href="\/my-aimt\/research"/);
 const js=readFileSync('assets/js/aimt-graduate-research.js','utf8');assert.match(js,/SIGNED_OUT/);assert.match(js,/pagehide/);assert.match(js,/Separately|separately validated/);assert.ok(!js.includes(env.SUPABASE_SERVICE_ROLE_KEY));
});
