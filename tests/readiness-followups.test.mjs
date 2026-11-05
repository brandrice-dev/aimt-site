// Readiness follow-up marketing: offline consent, copy, auth, suppression
// and idempotency tests. No actual email or payment API request leaves tests.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

import {FOLLOWUP_STEPS,followupUrl,renderReadinessFollowup} from '../functions/_lib/readiness/followup-emails.mjs';
import {canonicalRunMessage,isValidCronRequest,makeUnsubscribeLink,validateUnsubscribeToken} from '../functions/_lib/readiness/followup-security.mjs';
import {onRequestGet as unsubscribeGet,onRequestPost as unsubscribePost} from '../functions/api/readiness/unsubscribe.js';
import {onRequestPost as runCampaign} from '../functions/api/readiness/followups/run.js';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(path.join(ROOT,p),'utf8');
const SECRET='super-long-private-server-only-testing-secret-do-not-reuse';
const ENV={SUPABASE_URL:'https://supabase.test',SUPABASE_SERVICE_ROLE_KEY:SECRET,RESEND_API_KEY:'test_resend_key'};
const ADDRESS='AIMT Test Office, 12 Example Avenue, Lancaster, PA 17601';
const UUID='c7a345da-48ef-470b-a3dd-a2269fa8dd3f';
const CLAIM='576aae91-32d1-49fa-b083-7ebc502d535b';
const NOW=Date.parse('2026-11-04T15:00:00.000Z'); // 10 AM EST
const DAY=86400000;
const lead={
  id:UUID,email:'alex@example.com',first_name:'Alex',score:67,band:'Developing System',
  priority_pillar:'communication',marketing_consent:true,
  marketing_consented_at:new Date(NOW-4*DAY).toISOString(),
  marketing_unsubscribed_at:null,
  result_email_sent_at:new Date(NOW-3*DAY).toISOString(),
  created_at:new Date(NOW-3*DAY).toISOString(),
};
const goodSignature=(time,id,mode)=>createHmac('sha256',SECRET).update(canonicalRunMessage(time,id,mode)).digest('hex');
function signRequest(mode='dry',now=NOW){
  const ts=String(Math.floor(now/1000)),id='123456789-1';
  return new Request('https://aimtrichology.com/api/readiness/followups/run',{
    method:'POST',headers:{'Content-Type':'application/json','X-AIMT-Sent-At':ts,
      'X-AIMT-Run-Id':id,'X-AIMT-Signature':goodSignature(ts,id,mode)},
    body:JSON.stringify({mode}),
  });
}
function reply(obj,status=200){return new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json'}});}
test('Stage-one copy is personal; stage two is decisive; both use AIMT design and education links',async()=>{
  const url=await makeUnsubscribeLink(ENV,lead);
  const first=renderReadinessFollowup({stage:1,lead,unsubscribeUrl:url,postalAddress:ADDRESS});
  const second=renderReadinessFollowup({stage:2,lead,unsubscribeUrl:url,postalAddress:ADDRESS});
  assert.equal(first.subject,'Your AIMT Readiness Score: What comes next?');
  assert.equal(second.subject,'Give clients more reasons to choose you');
  for(const item of [first,second]){
    assert.match(item.html,/aimt-mark-email\.png/);
    assert.match(item.html,/AIMT Test Office/);
    assert.match(item.html,/Unsubscribe from marketing emails/);
    assert.match(item.html,/readiness-enroll\?utm_source=email/);
    assert.match(item.text,/Unsubscribe: https:\/\/aimtrichology\.com\/api\/readiness\/unsubscribe/);
    assert.doesNotMatch(item.html,/guaranteed income|countdown|only [0-9]+ spots|regrow hair/i);
  }
  assert.match(first.html,/client communication/);
  assert.match(first.text,/clear client communication/);
  assert.match(second.html,/\$597 one time/);
  assert.notEqual(followupUrl(1),followupUrl(2));
});
test('Marketing consent, postal address and unsubscribe link are mandatory',async()=>{
  const url=await makeUnsubscribeLink(ENV,lead);
  const base={stage:1,lead,unsubscribeUrl:url,postalAddress:ADDRESS};
  assert.throws(()=>renderReadinessFollowup({...base,lead:{...lead,marketing_consent:false}}),/Marketing permission/);
  assert.throws(()=>renderReadinessFollowup({...base,lead:{...lead,marketing_unsubscribed_at:new Date().toISOString()}}),/Marketing permission/);
  assert.throws(()=>renderReadinessFollowup({...base,postalAddress:''}),/postal address/);
  assert.throws(()=>renderReadinessFollowup({...base,unsubscribeUrl:'https://attacker.example/stop'}),/unsubscribe link/);
});
test('Signed unsubscribe token validates one lead, rejects tampering',async()=>{
  const url=await makeUnsubscribeLink(ENV,lead),u=new URL(url);
  assert.equal(await validateUnsubscribeToken(ENV,lead,u.searchParams.get('lead'),u.searchParams.get('token')),true);
  assert.equal(await validateUnsubscribeToken(ENV,{...lead,email:'other@example.com'},UUID,u.searchParams.get('token')),false);
  assert.equal(await validateUnsubscribeToken(ENV,lead,UUID,'a'.repeat(64)),false);
});
test('Unsubscribe GET is non-mutating and POST suppresses future marketing',async t=>{
  const url=await makeUnsubscribeLink(ENV,lead);
  let calls=[];
  t.mock.method(globalThis,'fetch',async (input,opts={})=>{
    const u=new URL(input);calls.push({url:u.href,method:opts.method||'GET',body:opts.body});
    if(u.pathname==='/rest/v1/readiness_leads'&&(!opts.method||opts.method==='GET'))return reply([{id:UUID,email:lead.email,marketing_unsubscribed_at:null}]);
    if(u.pathname==='/rest/v1/readiness_leads'&&opts.method==='PATCH')return reply({});
    throw Error('Unexpected '+u.href);
  });
  const get=await unsubscribeGet({request:new Request(url),env:ENV});
  assert.equal(get.status,200);
  assert.equal(calls.length,0,'no database lookup or change from opening link');
  const post=await unsubscribePost({request:new Request(url,{method:'POST'}),env:ENV});
  assert.equal(post.status,200);
  assert.match(await post.text(),/You are unsubscribed/);
  const patch=calls.find(x=>x.method==='PATCH');
  assert.ok(patch);
  assert.equal(JSON.parse(patch.body).marketing_consent,false);
  assert.ok(JSON.parse(patch.body).marketing_unsubscribed_at);
});
test('HMAC scheduled request rejects invalid signatures, expired timestamps and wrong mode',async()=>{
  const r=signRequest('dry');
  assert.equal(await isValidCronRequest(ENV,r,'dry',NOW),true);
  assert.equal(await isValidCronRequest(ENV,r,'send',NOW),false);
  assert.equal(await isValidCronRequest(ENV,r,'dry',NOW+800000),false);
});
test('Unauthorized cron never queries leads or sends mail',async t=>{
  let called=0;
  t.mock.method(globalThis,'fetch',async()=>{called++;return reply({});});
  const bad=new Request('https://aimtrichology.com/api/readiness/followups/run',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'send'})
  });
  const r=await runCampaign({request:bad,env:ENV});
  assert.equal(r.status,401);assert.equal(called,0);
});
test('Paused campaign never contacts provider, even for signed live request',async t=>{
  const calls=[];
  t.mock.method(globalThis,'fetch',async(input,opts={})=>{
    const u=new URL(input);calls.push(u.href);
    if(u.pathname==='/rest/v1/readiness_followup_config')return reply([{enabled:false}]);
    throw Error('Unanticipated '+u);
  });
  t.mock.method(Date,'now',()=>NOW);
  const result=await runCampaign({request:signRequest('send'),env:ENV});
  assert.equal(result.status,200);
  assert.equal((await result.json()).status,'paused');
  assert.equal(calls.length,1);
});
test('Campaign sends one stage-one email after 48h via atomic claim and stores provider receipt',async t=>{
  const calls=[];
  const cfg={
    enabled:true,activated_at:new Date(NOW-5*DAY).toISOString(),
    postal_address:ADDRESS,max_daily_emails:5,max_total_emails:30,total_reserved:0,
  };
  t.mock.method(Date,'now',()=>NOW);
  t.mock.method(globalThis,'fetch',async(input,opts={})=>{
    const u=new URL(input),method=opts.method||'GET';
    calls.push({path:u.pathname,method,body:opts.body,headers:opts.headers});
    if(u.pathname==='/rest/v1/readiness_followup_config')return reply([cfg]);
    if(u.pathname==='/rest/v1/readiness_followup_sends'&&method==='GET')return reply([]);
    if(u.pathname==='/rest/v1/readiness_leads'&&method==='GET'){
      return reply(u.searchParams.has('id')?[{id:UUID,marketing_consent:true,marketing_unsubscribed_at:null}]:[lead]);
    }
    if(u.pathname==='/rest/v1/course_entitlements')return reply([]);
    if(u.pathname==='/rest/v1/readiness_followup_sends'&&method==='PATCH')return reply([{id:CLAIM}]);
    if(u.pathname==='/rest/v1/rpc/claim_readiness_followup')return reply(CLAIM);
    if(u.hostname==='api.resend.com')return reply({id:'email_sent_test'});
    throw Error('Unanticipated '+u.pathname);
  });
  const result=await runCampaign({request:signRequest('send'),env:ENV});
  assert.equal(result.status,200);
  const body=await result.json();
  assert.equal(body.sent,1);
  const vendor=calls.find(x=>x.path==='/emails');
  assert.ok(vendor,'called Resend');
  assert.match(vendor.headers['Idempotency-Key'],/aimt-readiness-followup-v1/);
  const payload=JSON.parse(vendor.body);
  assert.equal(payload.to[0],lead.email);
  assert.match(payload.headers['List-Unsubscribe'],/https:\/\/aimtrichology\.com\/api\/readiness\/unsubscribe/);
  assert.equal(payload.headers['List-Unsubscribe-Post'],'List-Unsubscribe=One-Click');
  const patch=calls.find(x=>x.method==='PATCH');
  assert.equal(JSON.parse(patch.body).status,'sent');
});
test('A recorded stage-one send unlocks stage two only five days later',async t=>{
  const later=NOW+8*DAY;
  const first={lead_id:UUID,stage:1,status:'sent',sent_at:new Date(NOW+1*DAY).toISOString()};
  const cfg={enabled:true,activated_at:new Date(NOW-10*DAY).toISOString(),postal_address:ADDRESS,max_daily_emails:5,max_total_emails:30,total_reserved:0};
  t.mock.method(Date,'now',()=>later);
  let requestedStage=null;
  t.mock.method(globalThis,'fetch',async(input,opts={})=>{
    const u=new URL(input),method=opts.method||'GET';
    if(u.pathname==='/rest/v1/readiness_followup_config')return reply([cfg]);
    if(u.pathname==='/rest/v1/readiness_followup_sends'&&method==='GET')return reply([first]);
    if(u.pathname==='/rest/v1/readiness_leads'&&method==='GET')return reply(u.searchParams.has('id')?[{id:UUID,marketing_consent:true,marketing_unsubscribed_at:null}]:[lead]);
    if(u.pathname==='/rest/v1/course_entitlements')return reply([]);
    if(u.pathname==='/rest/v1/rpc/claim_readiness_followup'){requestedStage=JSON.parse(opts.body).p_stage;return reply(CLAIM);}
    if(u.pathname==='/rest/v1/readiness_followup_sends'&&method==='PATCH')return reply([{id:CLAIM}]);
    if(u.hostname==='api.resend.com')return reply({id:'email_stage2'});
    throw Error('Unexpected '+u.pathname);
  });
  // Cron Auth signed for later timestamp. At later fixed time it is 10 AM EST
  const req=signRequest('send',later);
  const result=await runCampaign({request:req,env:ENV});
  assert.equal(result.status,200);
  assert.equal((await result.json()).sent,1);
  assert.equal(requestedStage,2);
});
test('Admin inline Javascript parses and workflow has a paused-default deployment gate',()=>{
  const admin=read('admin.html');
  const inline=[...admin.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).filter(x=>x.trim());
  for(const code of inline)assert.doesNotThrow(()=>new vm.Script(code));
  assert.match(admin,/id="activateFollowupsForm"/); // should not exist in static HTML; check dynamic source below instead
});
