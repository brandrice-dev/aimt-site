import test from 'node:test';
import assert from 'node:assert/strict';
import {groupWorkflows, departmentBrief, recentDeliverables, projectBrief, ownerTitle, deliverableLabel} from '../assets/js/aimt-office-model.js';
import {ROLES, sourceDiagnostic, buildOfficeSnapshot} from '../functions/_lib/office/snapshot.mjs';

const role=ROLES.find(r=>r.id==='scientific');
const run=(id,status,branch='main')=>({id,role:'scientific',kind:'workflow',title:'Research Feed Ingest',workflowPath:'.github/workflows/aimt-research-feed-ingest.yml',branch,status,time:`2026-10-11T${String(id).padStart(2,'0')}:00:00Z`,detail:'Exact commit and run evidence'});
const snapshot=activities=>({sources:[{id:'github_runs',state:'Connected'}],activities});
test('repeated runs group without mixing departments, branches or workflow identities',()=>{
 const rows=[run(1,'success'),run(2,'failure'),run(3,'in_progress'),run(4,'success','feature'),{...run(5,'success'),role:'education'},{...run(6,'success'),workflowPath:'.github/workflows/another.yml'}];
 const groups=groupWorkflows(rows);assert.equal(groups.length,4);
 const main=groups.find(g=>g.role==='scientific'&&g.branch==='main'&&g.records.length===3);
 assert.equal(main.completed,1);assert.equal(main.attention,1);assert.equal(main.active,1);assert.equal(main.latest.id,3);assert.equal(main.records[0].detail,'Exact commit and run evidence');
});
test('green jobs and dry runs never become delivered research or publications',()=>{
 const rows=[run(1,'success'),{id:2,role:'scientific',kind:'ingestion',status:'success',dryRun:true},{id:3,role:'scientific',kind:'ingestion',status:'success',dryRun:null},{id:4,role:'scientific',kind:'page',status:'draft'}];
 const b=departmentBrief(snapshot(rows),role);assert.equal(b.deliverables.length,0);assert.ok(b.accomplished.includes('could not be verified'));assert.equal(b.current,'No running workflow reported');
 assert.equal(b.availability,'Assignments not connected');
});
test('queues, running database flags and queued jobs never establish current employee execution',()=>{
 const rows=[{id:1,role:'scientific',kind:'queue',status:'claimed'},run(2,'queued'),{id:3,role:'scientific',kind:'ingestion',status:'running'}];
 assert.equal(departmentBrief(snapshot(rows),role).current,'Current work unverified');
 assert.equal(departmentBrief(snapshot([run(3,'in_progress')]),role).current,'Execution observed');
 assert.equal(departmentBrief({...snapshot([]),sources:[{id:'github_runs',state:'Activity unavailable'}]},role).current,'Current work unavailable');
 assert.equal(departmentBrief(snapshot([run(3,'in_progress')]),ROLES.find(r=>r.id==='market')).current,'Current work unavailable');
});
test('deliverables retain evidence and collapse repeated artifact references only',()=>{
 const a={id:1,kind:'artifact',title:'education-report',status:'Available',time:'2026-10-11T01:00:00Z'};
 const newer={...a,id:2,time:'2026-10-11T02:00:00Z'};
 const batch={id:3,kind:'ingestion',status:'success',dryRun:false};
 const page={id:4,kind:'page',status:'published'};
 const rows=recentDeliverables([a,newer,batch,page,{...a,id:5,title:'expired-report',status:'Expired'}]);
 assert.equal(rows.length,3);assert.equal(rows[0].id,2);assert.ok(rows.includes(batch));assert.ok(rows.includes(page));
});
test('projects use exact candidate evidence; green checks cannot certify a preview or blocked project',()=>{
 const pr={id:75,kind:'pull_request',title:'#75 AIMT Office',status:'Draft',sha:'candidate'};
 const unrelated={id:1,kind:'check',status:'success',prNumber:75,candidateSha:'old-head'};
 let p=projectBrief(pr,[unrelated]);assert.equal(p.checks,'Checks unavailable');assert.equal(p.status,'Draft proposal');assert.equal(p.preview,'Preview success unverified');
 p=projectBrief(pr,[{...unrelated,candidateSha:'candidate'}]);assert.equal(p.checks,'Reported checks passed');assert.equal(p.preview,'Preview success unverified');
 p=projectBrief(pr,[{...unrelated,candidateSha:'candidate',status:'failure'}]);assert.equal(p.status,'Check needs attention');assert.ok(p.blocker.includes('not established'));
});
test('owner summaries retain original issue titles for expandable evidence',()=>{
 const r={title:'#55 [HUMAN_REVIEW] education-opportunity UNSUPPORTED_NUMERIC_CLAIM',kind:'issue'};
 assert.equal(ownerTitle(r),'An educational claim needs review');assert.ok(r.title.includes('UNSUPPORTED_NUMERIC_CLAIM'));
});
test('diagnostics distinguish access, schema, column and HTTP failures without copying private values',()=>{
 assert.equal(sourceDiagnostic(403).code,'ACCESS_REJECTED');assert.equal(sourceDiagnostic(404,'PGRST205').code,'RELATION_UNAVAILABLE');assert.equal(sourceDiagnostic(400,'42703').code,'PROJECTION_MISMATCH');assert.equal(sourceDiagnostic(503).code,'SOURCE_HTTP_FAILURE');
 assert.ok(!JSON.stringify(sourceDiagnostic(500,'private-key-value')).includes('private-key-value'));
});
test('empty reads, rate limits, timeouts and malformed data remain distinct and sanitized',async()=>{
 const previous=globalThis.fetch;
 try{
  globalThis.fetch=async input=>{
   const url=String(input);
   if(url.includes('research_ingestion_log'))return Response.json([]);
   if(url.includes('research_verification_queue'))return Response.json({code:'PGRST205',message:'private schema detail'},{status:404});
   if(url.includes('research_ingestion_quarantine')){const e=new Error('private error');e.name='TimeoutError';throw e;}
   if(url.includes('research_public_pages'))return Response.json({unexpected:'private payload'});
   if(url.includes('/actions/runs'))return Response.json({message:'private diagnostics'},{status:403,headers:{'x-ratelimit-remaining':'0'}});
   if(url.includes('/actions/artifacts'))return Response.json({artifacts:[]});
   return Response.json([]);
  };
  const d=await buildOfficeSnapshot({SUPABASE_URL:'https://test.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic-secret'});
  const s=id=>d.sources.find(s=>s.id===id);
  assert.equal(s('research_ingestion_log').state,'Connected');assert.equal(s('research_ingestion_log').records.length,0);
  assert.equal(s('research_verification_queue').diagnostic.code,'RELATION_UNAVAILABLE');assert.equal(s('research_ingestion_quarantine').diagnostic.code,'REQUEST_TIMEOUT');assert.equal(s('research_public_pages').diagnostic.code,'MALFORMED_RESPONSE');assert.equal(s('github_runs').diagnostic.code,'RATE_LIMITED');
  assert.ok(!JSON.stringify(d).includes('private payload'));assert.ok(!JSON.stringify(d).includes('private diagnostics'));assert.ok(!JSON.stringify(d).includes('private schema detail'));assert.ok(!JSON.stringify(d).includes('synthetic-secret'));
 }finally{globalThis.fetch=previous;}
});

test('owner labels move issue codes and artifact run IDs into exact evidence',()=>{
 const issue={kind:'issue',title:'#56 [HUMAN_REVIEW] androgenetic-alopecia [edu-ops:androgenetic-alopecia:UNSUPPORTED_SCOPE_CONTAINS_NUMERIC_CLAIM]'};
 assert.equal(ownerTitle(issue),'Androgenetic alopecia · Claim wording needs review');assert.ok(issue.title.includes('UNSUPPORTED_SCOPE_CONTAINS_NUMERIC_CLAIM'));
 assert.equal(deliverableLabel({kind:'artifact',title:'education-ops-shadow-37979728249'}),'Education operations report reference');
 const records=recentDeliverables([{id:1,kind:'artifact',title:'education-ops-shadow-111111111',status:'Available'},{id:2,kind:'artifact',title:'education-ops-shadow-222222222',status:'Available'}]);assert.equal(records.length,1);
});

test('Cloudflare Pages check runs report preview evidence separately from test checks',async()=>{
 const previous=globalThis.fetch;
 try{
  globalThis.fetch=async input=>{
   const url=String(input);
   if(url.includes('/pulls?'))return Response.json([{number:75,title:'AIMT Office',draft:true,head:{sha:'candidate'}}]);
   if(url.includes('/check-runs?'))return Response.json({check_runs:[{id:1,name:'Cloudflare Pages',status:'completed',conclusion:'success',app:{slug:'cloudflare-pages'}},{id:2,name:'Unit tests',status:'completed',conclusion:'failure'}]});
   if(url.includes('/actions/runs?'))return Response.json({workflow_runs:[]});
   if(url.includes('/actions/artifacts?'))return Response.json({artifacts:[]});
   if(url.includes('/status?'))return Response.json({statuses:[]});
   return Response.json([]);
  };
  const d=await buildOfficeSnapshot({SUPABASE_URL:'https://test.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic-secret'});
  assert.equal(d.activities.find(r=>r.id===1).kind,'preview_check');assert.equal(d.activities.find(r=>r.id===2).kind,'check');
  const p=projectBrief(d.activities.find(r=>r.kind==='pull_request'),d.activities);
  assert.equal(p.checks,'A reported check needs attention');assert.equal(p.preview,'Provider reports preview success');
 }finally{globalThis.fetch=previous;}
});
