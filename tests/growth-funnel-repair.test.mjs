// AIMT Growth repair — mocked behavioral checks. No live database or Stripe calls.
// Run: node --test tests/growth-funnel-repair.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { normalizeSubmission, onRequestPost as submitReadiness } from '../functions/api/readiness/submit.js';
import { onRequest as listLeads } from '../functions/api/admin/readiness-leads.js';
import { onRequest as diagnoseCheckout } from '../functions/api/admin/checkout-diagnostics.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(path.join(ROOT, rel), 'utf8');
const SUPABASE = 'https://mock.supabase.co';
const ENV = {
  SUPABASE_URL: SUPABASE,
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-test',
  STRIPE_SECRET_KEY: 'sk_live_MOCK_KEY',
  RESEND_API_KEY: 'resend-mock',
};
const profile = {
  first_name: 'Alex',
  email: 'Alex@example.com',
  score: 50,
  pillar_scores: { scope: 3, assessment: 3, service: 3, communication: 3, business: 3 },
  marketing_consent: true,
  head_spa_stage: 'Starting',
};
function json(body, status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});}
function request(url, method='GET', body=null, headers={}){
  return new Request(url,{ method, headers:{ ...(body?{'Content-Type':'application/json'}:{}), ...headers }, body:body?JSON.stringify(body):undefined });
}

test('server recomputes readiness band and pillar extremes, validates score and consent',()=>{
  const valid=normalizeSubmission(profile);
  assert.equal(valid.email,'alex@example.com');
  assert.equal(valid.band,'Developing System');
  assert.equal(valid.score,50);
  assert.equal(valid.priority_pillar,'scope');
  assert.equal(valid.strongest_pillar,'scope');
  assert.equal(valid.marketing_consent,true);
  assert.equal(normalizeSubmission({...profile,score:99}),null);
  assert.equal(normalizeSubmission({...profile,email:'bad-email'}),null);
  assert.equal(normalizeSubmission({...profile,pillar_scores:{scope:10,assessment:1,service:1,communication:1,business:1}}),null);
  assert.equal(normalizeSubmission({...profile,marketing_consent:'true'}).marketing_consent,false);
});

test('profile is saved privately before reporting success, transactional email ignores marketing opt-in',async t=>{
  const seen=[];
  t.mock.method(globalThis,'fetch',async (input,opts={})=>{
    const url=new URL(input);seen.push({url:url.href,method:opts.method||'GET',body:opts.body});
    if(url.pathname==='/rest/v1/readiness_leads' && opts.method==='POST'){
      const row=JSON.parse(opts.body);
      return json([{id:'2b4aab77-a7b7-4cc9-8993-3e26fe9489d8',...row,result_email_sent_at:null}]);
    }
    if(url.pathname==='/rest/v1/readiness_leads' && opts.method==='PATCH')return json({});
    if(url.hostname==='api.resend.com')return json({id:'email_test'});
    throw new Error('Unexpected request '+url.href);
  });
  const result=await submitReadiness({request:request('https://aimtrichology.com/api/readiness/submit','POST',{...profile,marketing_consent:false},{Origin:'https://aimtrichology.com'}),env:ENV});
  assert.equal(result.status,200);
  assert.deepEqual(await result.json(),{saved:true,emailSent:true,recentlySent:false});
  const stored=JSON.parse(seen.find(c=>c.method==='POST'&&c.url.includes('readiness_leads')).body);
  assert.equal(stored.marketing_consent,false);
  assert.equal(stored.email,'alex@example.com');
  assert.equal(seen.some(c=>c.url.includes('growth_events')),false);
  assert.equal(seen.some(c=>c.url.includes('api.resend.com')),true);
});
test('database unavailable does not claim lead saved or send email',async t=>{
  t.mock.method(globalThis,'fetch',async()=>json({code:'42P01'},404));
  const result=await submitReadiness({request:request('https://aimtrichology.com/api/readiness/submit','POST',profile),env:ENV});
  assert.equal(result.status,503);
  assert.equal((await result.json()).saved,undefined);
});
test('same-origin submission guard blocks cross-site request',async()=>{
  const result=await submitReadiness({request:request('https://aimtrichology.com/api/readiness/submit','POST',profile,{Origin:'https://untrusted.example'}),env:ENV});
  assert.equal(result.status,403);
});

function authMock(role, overrides={}){
  return async (input,opts={})=>{
    const url=new URL(typeof input==='string'?input:input.url);
    if(url.pathname==='/auth/v1/user')return json({id:'00000000-0000-4000-8000-000000000111',email:'owner@aimt.example'});
    if(url.pathname==='/rest/v1/admin_users')return json([{role,active:true}]);
    if(url.pathname==='/rest/v1/readiness_leads')return json([{
      id:'lead',first_name:'Alex',email:'alex@example.com',score:50,band:'Developing System',
      priority_pillar:'scope',marketing_consent:true,last_submitted_at:'2026-11-04T12:00:00Z'
    }]);
    if(url.pathname==='/rest/v1/course_entitlements')return json([{checkout_session_id:'cs_live_paid'}]);
    if(url.pathname==='/rest/v1/growth_events'&&url.searchParams.get('event_name')==='eq.paid_enrollment')return json([{checkout_session_id:'cs_live_paid'}]);
    if(url.pathname==='/rest/v1/growth_events'&&url.searchParams.get('event_name')==='eq.checkout_start')return json([
      {checkout_session_id:'cs_live_open',occurred_at:'2026-11-04T12:00:00Z',props:{ui:'embedded'}},
      {checkout_session_id:'cs_live_paid',occurred_at:'2026-11-04T11:00:00Z',props:{ui:'hosted'}},
    ]);
    if(url.hostname==='api.stripe.com')return url.pathname.endsWith('cs_live_paid')
      ?json({status:'complete',payment_status:'paid',amount_total:59700,currency:'usd'})
      :json({status:'open',payment_status:'unpaid',amount_total:59700,currency:'usd'});
    throw new Error('Unexpected fetch '+url.href);
  };
}
test('owner can read saved leads while support cannot',async t=>{
  let role='owner';
  t.mock.method(globalThis,'fetch',(...args)=>authMock(role)(...args));
  const ctx={request:request('https://aimtrichology.com/api/admin/readiness-leads','GET',null,{Authorization:'Bearer mock'}),env:ENV};
  const result=await listLeads(ctx);
  assert.equal(result.status,200);
  assert.equal((await result.json()).leads[0].email,'alex@example.com');
  role='support';
  const denied=await listLeads(ctx);
  assert.equal(denied.status,403);
});
test('checkout diagnostics reconcile Stripe payment status with entitlements without writes',async t=>{
  const calls=[];
  t.mock.method(globalThis,'fetch',async (...args)=>{
    const opts=args[1]||{};calls.push(opts.method||'GET');
    return authMock('owner')(...args);
  });
  const result=await diagnoseCheckout({request:request('https://aimtrichology.com/api/admin/checkout-diagnostics','GET',null,{Authorization:'Bearer mock'}),env:ENV});
  assert.equal(result.status,200);
  const data=await result.json();
  assert.deepEqual(data.sessions.map(x=>x.outcome),['open_unpaid','paid_access_granted']);
  assert.equal(calls.every(method=>method==='GET'),true);
});
test('readiness submission uses same-origin endpoint without a cached configuration script',()=>{
  for (const file of ['head-spa-readiness.html','my-aimt.html']) {
    const source=read(file);
    assert.match(source,/const endpoint = '\/api\/readiness\/submit';/,file);
    assert.doesNotMatch(source,/<script src="assets\/js\/aimt-readiness-config\.js"><\/script>/,file);
    assert.doesNotMatch(source,/if \(!endpoint\) throw new Error\('Readiness submission is not available right now\.'\)/,file);
  }
  const readiness=read('head-spa-readiness.html');
  assert.ok(readiness.indexOf('await submitReadinessProfile(payload)') < readiness.lastIndexOf("track('lead_created'"));
  assert.match(read('admin.html'),/id="checkoutDiagnosticsBody"/);
});

test('all modified HTML inline scripts parse as JavaScript', () => {
  for (const page of ['head-spa-readiness.html', 'my-aimt.html', 'admin.html']) {
    const source=read(page);
    const scripts=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
      .map(match=>match[1]).filter(code=>code.trim().length);
    assert.ok(scripts.length, page + ' has inline scripts');
    for (const code of scripts) {
      assert.doesNotThrow(()=>new vm.Script(code,{filename:page}),page+' inline script syntax');
    }
  }
});
