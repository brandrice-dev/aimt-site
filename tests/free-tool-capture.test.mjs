import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeContact, onRequestPost } from '../functions/api/free-tools/submit.js';
import { onRequest as listLeads } from '../functions/api/admin/free-tool-leads.js';
import { saveToolContact, bindToolCapture } from '../assets/js/aimt-free-tool-capture.mjs';
const env={SUPABASE_URL:'https://mock.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'mock-server-only'};
const payload={first_name:' Alex ',email:'Alex@example.test',tool:'service-cost',marketing_consent:false};
const json=(b,s=200)=>new Response(JSON.stringify(b),{status:s});
const request=(body=payload,headers={})=>new Request('https://aimt.test/api/free-tools/submit',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://aimt.test',...headers},body:JSON.stringify(body)});
test('contacts are validated, normalized and restricted to known tools',()=>{
  assert.equal(normalizeContact(payload).email,'alex@example.test');
  assert.equal(normalizeContact(payload).first_name,'Alex');
  assert.equal(normalizeContact(payload).marketing_consented_at,null);
  for(const p of [{first_name:' '},{email:'bad'},{tool:'readiness'},{marketing_consent:'true'},{first_name:'x'.repeat(81)},{first_name:'a\nB'}])assert.equal(normalizeContact({...payload,...p}),null);
  assert.ok(normalizeContact({...payload,tool:'first-service-blueprint',marketing_consent:true}).marketing_consented_at);
});
test('persistence is required, stored data excludes business data, duplicates upsert per tool',async t=>{
  let saved;
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    assert.equal(url,'https://mock.supabase.co/rest/v1/free_tool_leads?on_conflict=email,tool');
    assert.equal(options.headers.Authorization,'Bearer mock-server-only');
    saved=JSON.parse(options.body);return json([{id:'id'}]);
  });
  const res=await onRequestPost({request:request({...payload,plan:'PRIVATE PLAN',products:50,score:99}),env});
  assert.deepEqual(await res.json(),{saved:true});
  assert.deepEqual(Object.keys(saved).sort(),['email','first_name','last_submitted_at','marketing_consent','marketing_consented_at','tool']);
  assert.equal(res.headers.get('Cache-Control'),'no-store');
});
test('storage outage never reports saved and client rejects false success',async t=>{
  t.mock.method(globalThis,'fetch',async()=>json({error:'down'},503));
  assert.equal((await onRequestPost({request:request(),env})).status,503);
  await assert.rejects(()=>saveToolContact(payload,async()=>json({saved:false})),/could not be saved/);
  await assert.rejects(()=>saveToolContact(payload,async()=>json({saved:true},503)),/could not be saved/);
  await saveToolContact(payload,async()=>json({saved:true}));
});
test('origin, body limits, content type, honeypot and missing config fail closed',async t=>{
  t.mock.method(globalThis,'fetch',async()=>{throw Error('must not reach storage');});
  for(const [req,status] of [[request(payload,{Origin:'https://other.test'}),403],[request(payload,{'Sec-Fetch-Site':'cross-site'}),403],[request(payload,{'Content-Type':'text/plain'}),415],[request({...payload,website:'spam'}),400],[request({...payload,extra:'x'.repeat(2200)}),413],[request({...payload,email:''}),400]])assert.equal((await onRequestPost({request:req,env})).status,status);
  assert.equal((await onRequestPost({request:request(),env:{}})).status,503);
});
test('admin inbox denies signed-out and support; owner can retrieve private contacts',async t=>{
  let role='owner';
  t.mock.method(globalThis,'fetch',async url=>{
    if(url.includes('/auth/v1/user'))return json({id:'owner-id'});
    if(url.includes('/admin_users?'))return json([{role,active:true}]);
    if(url.includes('/free_tool_leads?'))return json([{...payload,id:'id'}]);
    throw Error('unexpected URL');
  });
  const req=token=>new Request('https://aimt.test/api/admin/free-tool-leads',{headers:token?{Authorization:'Bearer mock-token'}:{}});
  assert.equal((await listLeads({request:req(false),env})).status,401);
  const res=await listLeads({request:req(true),env});assert.equal(res.status,200);assert.equal((await res.json()).leads[0].first_name,payload.first_name);
  role='support';assert.equal((await listLeads({request:req(true),env})).status,403);
});
test('browser gate unlocks only after a successful save, and permits retry',async t=>{
  let handler,focused=false;
  const button={disabled:false}, status={textContent:''},content={hidden:true,querySelector:()=>({focus(){focused=true;}})},gate={hidden:false};
  const form={dataset:{tool:'service-cost'},elements:{first_name:{value:'Alex'},email:{value:'alex@example.test'},marketing_consent:{checked:false},website:{value:''}},querySelector:()=>button,addEventListener:(e,fn)=>handler=fn,reportValidity:()=>true,reset(){}};
  bindToolCapture({getElementById:id=>({freeToolContact:form,freeToolContent:content,freeToolGate:gate,freeToolContactStatus:status})[id]});
  let ok=false;t.mock.method(globalThis,'fetch',async()=>json(ok?{saved:true}:{error:'down'},ok?200:503));
  await handler({preventDefault(){}});assert.equal(content.hidden,true);assert.equal(gate.hidden,false);assert.equal(button.disabled,false);
  ok=true;await handler({preventDefault(){}});assert.equal(content.hidden,false);assert.equal(gate.hidden,true);assert.equal(focused,true);
});
test('every standalone tool includes all controls in a hidden gate; consent is optional',()=>{
  for(const file of ['head-spa-service-cost.html','first-service-blueprint.html']){
    const html=readFileSync(new URL('../'+file,import.meta.url),'utf8');
    assert.match(html,/name="first_name"[^>]+required/);assert.match(html,/name="email"[^>]+required/);
    assert.match(html,/id="freeToolContent" hidden/);assert.match(html,/aimt-free-tool-capture.mjs/);
    assert.doesNotMatch(html.match(/<input id="toolMarketing"[^>]+>/)[0],/checked|required/);
    const split=html.indexOf('id="freeToolContent" hidden');
    for(const id of file.startsWith('head')?['costWorksheet','costPrint']:['bpExport','bpPrint','bpImport','bpForm'])assert.ok(html.indexOf('id="'+id+'"')>split);
  }
  const gate=readFileSync(new URL('../assets/js/aimt-free-tool-capture.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(gate,/localStorage|sessionStorage|sendBeacon|AIMTGrowth/);
});
