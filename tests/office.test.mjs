import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/admin/office.js';
import { buildOfficeSnapshot, classifyRole, ROLES, safeLink } from '../functions/_lib/office/snapshot.mjs';

const env = { SUPABASE_URL: 'https://db.example', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-key', AIMT_OWNER_EMAIL: 'owner@example.test' };
const original = globalThis.fetch;
function mock({ role = 'owner', active = true, missing = false, fail = '', dbRunning = false } = {}) {
  const calls = [];
  globalThis.fetch = async (input, options = {}) => {
    const u = new URL(input);calls.push({u,options});assert.equal(options.method || 'GET','GET','Office cannot mutate sources');
    if(fail && u.pathname.includes(fail)) throw new Error('secret-service-key private error');
    if(u.pathname === '/auth/v1/user') return Response.json({id:'synthetic-owner',email:'owner@example.test'});
    if(u.pathname.endsWith('/admin_users')) return Response.json(missing ? [] : [{role,active}]);
    if(u.hostname === 'db.example') {
      if(u.pathname.endsWith('/research_ingestion_log'))return Response.json([{id:'batch-row',batch_id:'synthetic-batch',status:dbRunning?'running':'failed',started_at:'2026-10-01T00:00:00Z',error_summary:'do not expose',raw_payload:'private'}]);
      if(u.pathname.endsWith('/research_ingestion_quarantine'))return Response.json([{id:'quarantine',batch_id:'synthetic-batch',record_type:'claim',status:'pending',received_at:'2026-10-01T01:00:00Z',raw_payload:'private'}]);
      if(u.pathname.endsWith('/research_public_pages'))return Response.json([{topic_slug:'synthetic-topic',status:'published',seo_title:'Synthetic page',canonical_url:'javascript:alert(1)',updated_at:'2026-10-01T02:00:00Z'}]);
      return Response.json([]);
    }
    assert.equal(u.hostname, 'api.github.com');assert.ok(u.pathname.startsWith('/repos/brandrice-dev/aimt-site/'));assert.ok(!options.headers?.Authorization);
    if(u.pathname.endsWith('/actions/runs'))return Response.json({workflow_runs:[{id:1,name:'Synthetic education workflow',path:'.github/workflows/aimt-education-operations.yml',status:'completed',conclusion:'success',updated_at:'2026-10-01T03:00:00Z',html_url:'https://github.com/brandrice-dev/aimt-site/actions/runs/1'}]});
    if(u.pathname.endsWith('/actions/artifacts'))return Response.json({artifacts:[{id:1,name:'synthetic-report',expired:false,created_at:'2026-10-01T04:00:00Z',workflow_run:{id:1}}]});
    if(u.pathname.endsWith('/pulls'))return Response.json([{number:72,title:'Synthetic draft',draft:true,updated_at:'2026-10-01T05:00:00Z',base:{ref:'main'},head:{sha:'a'.repeat(40)}}]);
    if(u.pathname.endsWith('/issues'))return Response.json([{number:1,title:'Synthetic infra issue',labels:[{name:'education-infra'}]}, {number:2,title:'Unrelated issue',labels:[]},{number:3,title:'PR is not an issue',pull_request:{},labels:[{name:'education-review'}]}]);
    if(u.pathname.endsWith('/check-runs'))return Response.json({check_runs:[{id:1,name:'Unit tests',status:'completed',conclusion:'success',completed_at:'2026-10-01T06:00:00Z'}]});
    if(u.pathname.endsWith('/status'))return Response.json({statuses:[{id:1,context:'Cloudflare Pages',state:'failure',updated_at:'2026-10-01T06:00:00Z',target_url:'https://evil.example/'}]});
    return Response.json([]);
  };
  return calls;
}
const request = (method = 'GET', bearer = true) => new Request('https://aimt.test/api/admin/office',{method,headers:bearer ? {Authorization:'Bearer synthetic-session'}:{}});

test('Office denies anonymous, support, admin, inactive and missing rows; never bootstraps owner',async()=>{
  try {
    let calls=mock();let res=await onRequest({env,request:request('GET',false)});assert.equal(res.status,401);assert.equal(calls.length,0);
    for(const config of [{role:'student'},{role:'support'},{role:'admin'},{active:false},{missing:true}]) {
      calls=mock(config);res=await onRequest({env,request:request()});assert.equal(res.status,403);assert.equal(calls.length,2);assert.ok(calls.every(c=>c.u.hostname==='db.example'));
      assert.equal(res.headers.get('cache-control'),'private, no-store');
    }
  } finally {globalThis.fetch=original;}
});
test('Office permits only GET and handles unavailable authorization without exposing errors',async()=>{
  try {const calls=mock();for(const method of ['POST','PUT','DELETE','PATCH','HEAD']) assert.equal((await onRequest({env,request:request(method)})).status,405);assert.equal(calls.length,0);
    mock({fail:'admin_users'});const res=await onRequest({env,request:request()});assert.equal(res.status,503);assert.ok(!(await res.text()).includes('secret-service-key'));
  }finally{globalThis.fetch=original;}
});
test('owner snapshot is bounded, private, projected and source-linked without raw private payloads',async()=>{
  try {const calls=mock();const res=await onRequest({env,request:request()});assert.equal(res.status,200);const d=await res.json();assert.equal(d.roles.length,7);assert.equal(d.roles.find(r=>r.id==='executive').classification,'Activity unavailable');assert.equal(d.sources.find(s=>s.id==='github_issues').records.length,1);
    assert.ok(d.decisions.some(r=>r.status==='failed'));assert.ok(d.activities.some(r=>r.kind==='artifact'));assert.equal(d.activities.find(r=>r.kind==='page').url,null);
    assert.ok(!JSON.stringify(d).includes('do not expose'));assert.ok(!JSON.stringify(d).includes('raw_payload'));assert.ok(!JSON.stringify(d).includes('synthetic-key'));
    for(const {u} of calls.filter(c=>c.u.pathname.includes('/rest/v1/')&&!c.u.pathname.endsWith('admin_users'))) {assert.equal(u.searchParams.get('limit'),'30');assert.ok(u.searchParams.get('select'));assert.ok(!u.searchParams.get('select').includes('*'));}
    assert.equal(res.headers.get('vary'),'Authorization');
  }finally{globalThis.fetch=original;}
});
test('one source failure does not hide others or turn failure into zero activity',async()=>{
  try {mock({fail:'research_public_pages'});const d=await buildOfficeSnapshot(env);assert.equal(d.sources.find(s=>s.id==='research_public_pages').state,'Activity unavailable');assert.equal(d.sources.find(s=>s.id==='research_ingestion_log').state,'Connected');assert.ok(d.activities.some(r=>r.status==='failed'));assert.ok(!JSON.stringify(d).includes('secret-service-key'));}finally{globalThis.fetch=original;}
});
test('running database flags never become actively working employees; workflow checks differ from previews',async()=>{
  try {mock({dbRunning:true});const d=await buildOfficeSnapshot(env);assert.equal(d.roles.find(r=>r.id==='scientific').classification,'Historical activity verified');assert.ok(d.activities.find(r=>r.kind==='ingestion').detail.includes('no heartbeat'));assert.equal(d.activities.find(r=>r.kind==='check').status,'success');assert.equal(d.activities.find(r=>r.kind==='preview_check').status,'failure');}finally{globalThis.fetch=original;}
  const role=ROLES.find(r=>r.id==='education');assert.equal(classifyRole(role,[{id:'github_runs',records:[{role:'education',kind:'workflow',status:'in_progress',time:'2026-10-01T00:00:00Z'}]}]).classification,'Execution observed');
});
test('only safe authorized source hosts can become links',()=>{
  for(const url of ['javascript:alert(1)','https://github.com.evil.test','http://github.com','https://evil.test'])assert.equal(safeLink(url),null);
  assert.ok(safeLink('https://github.com/brandrice-dev/aimt-site/pull/72'));assert.ok(safeLink('https://preview.aimt.pages.dev/admin'));
});
test('HTTP errors and malformed sources remain unavailable independently',async()=>{
  try {
    mock();const delegate=globalThis.fetch;
    globalThis.fetch=async(input,options)=>{
      if(String(input).includes('/actions/runs'))return Response.json({message:'Rate limited; private diagnostics'},{status:403});
      if(String(input).includes('/research_verification_queue'))return Response.json({unexpected:true});
      return delegate(input,options);
    };
    const d=await buildOfficeSnapshot(env);
    assert.equal(d.sources.find(s=>s.id==='github_runs').state,'Activity unavailable');
    assert.equal(d.sources.find(s=>s.id==='research_verification_queue').state,'Activity unavailable');
    assert.equal(d.sources.find(s=>s.id==='github_prs').state,'Connected');
    assert.ok(!JSON.stringify(d).includes('private diagnostics'));
  }finally{globalThis.fetch=original;}
});
