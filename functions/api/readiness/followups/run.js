// AIMT Readiness: automated marketing follow-ups.
// Invoked by a signed GitHub Actions cron request. No public/manual URL
// can send without the server's existing HMAC secret. There is no browser
// access, no JWT/service-role key in network requests, and no npm dependency.
// Budget and send consent are independently rechecked inside one atomic
// Supabase reservation function, not merely inside this JS worker.
import { supabaseRest } from '../../../_lib/certification/auth.mjs';
import { isValidCronRequest, makeUnsubscribeLink } from '../../../_lib/readiness/followup-security.mjs';
import { FOLLOWUP_SENDER, FOLLOWUP_REPLY_TO, FOLLOWUP_STEPS, renderReadinessFollowup } from '../../../_lib/readiness/followup-emails.mjs';

const COURSE_SLUG='headspa-mastery';
const MAX_LEAD_ROWS=600;
const PAGE_SIZE=200;
const MAX_PER_RUN=8;
const DAY_MS=24*60*60*1000;

function reply(data,status=200) {
  return new Response(JSON.stringify(data),{status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'private, no-store',
    'X-Content-Type-Options':'nosniff',
  }});
}
async function readRows(env,table,params) {
  const result=await supabaseRest(env,table+'?'+new URLSearchParams(params));
  if(!result.ok||!Array.isArray(result.body))throw new Error('Required AIMT data unavailable: '+table);
  return result.body;
}
function localWorkHour(now) {
  const hour=Number(new Intl.DateTimeFormat('en-US',{
    timeZone:'America/New_York',hour:'2-digit',hourCycle:'h23',
  }).format(new Date(now)));
  return Number.isFinite(hour) && hour>=9 && hour<19;
}
async function candidates(env,cfg,now) {
  if(!cfg?.activated_at)return [];
  const eligible=[];
  const activated=Date.parse(cfg.activated_at);
  if(!Number.isFinite(activated))return eligible;
  // Restrict the paginated scan to the live 14-day follow-up window.
  // Otherwise historical leads eventually fill the first 600 rows and
  // newly opted-in subscribers are never reached.
  const since=Math.max(activated,now-14*DAY_MS);
  const sendRows=await readRows(env,'readiness_followup_sends',{
    select:'lead_id,stage,status,sent_at',limit:'2000',order:'reserved_at.desc',
  });
  const sentByKey=new Map(sendRows.map(r=>[r.lead_id+':'+r.stage,r]));
  for(let offset=0;offset<MAX_LEAD_ROWS;offset+=PAGE_SIZE){
    const rows=await readRows(env,'readiness_leads',{
      select:'id,email,first_name,score,band,priority_pillar,marketing_consent,marketing_consented_at,marketing_unsubscribed_at,created_at,result_email_sent_at',
      marketing_consent:'eq.true',
      marketing_unsubscribed_at:'is.null',
      created_at:'gte.'+new Date(since).toISOString(),
      order:'created_at.asc',offset:String(offset),limit:String(PAGE_SIZE),
    });
    for(const lead of rows) {
      const created=Date.parse(lead.created_at);
      if(!Number.isFinite(created)||created<since||now-created>14*DAY_MS)continue;
      if(!lead.marketing_consented_at||!lead.result_email_sent_at)continue;
      const first=sentByKey.get(lead.id+':1');
      const second=sentByKey.get(lead.id+':2');
      if(!first && now>=created+2*DAY_MS){
        eligible.push({lead,stage:1});continue;
      }
      if(first?.status==='sent'&&!second&&Number.isFinite(Date.parse(first.sent_at))&&now>=Date.parse(first.sent_at)+5*DAY_MS)eligible.push({lead,stage:2});
    }
    if(rows.length<PAGE_SIZE)break;
  }
  return eligible;
}
async function stillConsented(env,leadId) {
  const rows=await readRows(env,'readiness_leads',{
    select:'id,marketing_consent,marketing_unsubscribed_at',
    id:'eq.'+leadId,limit:'1',
  });
  return rows.length===1&&rows[0].marketing_consent===true&&!rows[0].marketing_unsubscribed_at;
}
async function stillUnpaid(env,email) {
  // Recheck immediately before the provider call as well as in the atomic
  // reservation; purchasing can happen while a scheduled run is underway.
  const rows=await readRows(env,'course_entitlements',{
    select:'checkout_session_id',course_slug:'eq.'+COURSE_SLUG,
    // Case-insensitive exact comparison, like the atomic SQL claim.
    // Escape SQL LIKE wildcards in email addresses (e.g. underscore).
    purchaser_email:'ilike.'+String(email).replace(/[\\%_]/g,'\\    purchaser_email:'eq.'+email,limit:'1''),limit:'1'
  });
  return rows.length===0;
}
async function updateDelivery(env,id,status,extras={}) {
  const q=new URLSearchParams({id:'eq.'+id,status:'eq.reserved'});
  const r=await supabaseRest(env,'readiness_followup_sends?'+q,{
    method:'PATCH',headers:{Prefer:'return=representation'},
    body:JSON.stringify({status,...extras}),
  });
  return r.ok&&Array.isArray(r.body)&&r.body.length===1;
}
async function reserve(env,lead,stage){
  const r=await supabaseRest(env,'rpc/claim_readiness_followup',{
    method:'POST',body:JSON.stringify({p_lead_id:lead.id,p_stage:stage}),
  });
  if(!r.ok)throw new Error('Reservation store unavailable');
  return typeof r.body==='string'&&/^[a-f0-9-]{36}$/i.test(r.body)?r.body:null;
}
async function sendOne(env,cfg,{lead,stage}) {
  const claim=await reserve(env,lead,stage);
  if(!claim)return {state:'skipped'};
  try{
    if(!await stillConsented(env,lead.id) || !await stillUnpaid(env,lead.email)){
      await updateDelivery(env,claim,'suppressed',{failure_category:'consent_revoked'});
      return {state:'suppressed'};
    }
    if(!env.RESEND_API_KEY)throw new Error('resend_unavailable');
    const url=await makeUnsubscribeLink(env,lead);
    const copy=renderReadinessFollowup({
      stage,lead,unsubscribeUrl:url,postalAddress:cfg.postal_address,
    });
    // Extra provider-level protection; permanent uniqueness lives in DB.
    const response=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{
        Authorization:'Bearer '+env.RESEND_API_KEY,
        'Content-Type':'application/json',
        'Idempotency-Key':'aimt-readiness-followup-v1/'+claim,
      },
      body:JSON.stringify({
        from:FOLLOWUP_SENDER,
        to:[lead.email],
        reply_to:FOLLOWUP_REPLY_TO,
        subject:copy.subject,html:copy.html,text:copy.text,
        headers:{
          'List-Unsubscribe':'<'+url+'>',
          'List-Unsubscribe-Post':'List-Unsubscribe=One-Click',
        },
      }),
    });
    if(!response.ok){
      const ok=await updateDelivery(env,claim,'failed',{failure_category:'provider_http_'+response.status});
      return {state:ok?'failed':'uncertain'};
    }
    const data=await response.json().catch(()=>({}));
    const written=await updateDelivery(env,claim,'sent',{
      sent_at:new Date().toISOString(),
      provider_id:typeof data.id==='string'?data.id.slice(0,150):null,
    });
    return {state:written?'sent':'uncertain'};
  }catch(err) {
    const code=err?.message==='resend_unavailable'?'resend_unavailable':'send_attempt_uncertain';
    // A network error could occur AFTER Resend accepted the message.
    // Deliberately never auto-retry; a unique reservation prevents dupes.
    const updated=await updateDelivery(env,claim,'uncertain',{failure_category:code}).catch(()=>false);
    return {state:updated?'uncertain':'unrecorded'};
  }
}
export async function onRequestPost({request,env}) {
  if(!env.SUPABASE_SERVICE_ROLE_KEY||!env.SUPABASE_URL)return reply({error:'Backend unavailable'},503);
  if(request.headers.get('Content-Type')!=='application/json')return reply({error:'JSON required'},415);
  const data=await request.json().catch(()=>null);
  const mode=data?.mode;
  if(mode!=='dry'&&mode!=='send')return reply({error:'Invalid request'},400);
  if(!await isValidCronRequest(env,request,mode))return reply({error:'Unauthorized'},401);
  try{
    const config=await readRows(env,'readiness_followup_config',{select:'*',id:'eq.true',limit:'1'});
    const cfg=config[0];
    if(!cfg||!cfg.enabled)return reply({status:'paused',sent:0,reason:'Owner activation and campaign limits required'});
    const now=Date.now();
    if(mode==='send'&&!localWorkHour(now))return reply({status:'outside_send_window',sent:0});
    const list=await candidates(env,cfg,now);
    if(mode==='dry')return reply({status:'dry_run',eligible:list.length,sent:0});
    const outcome={status:'completed',considered:list.length,reserved:0,sent:0,failed:0,suppressed:0,uncertain:0,skipped:0};
    for(const item of list.slice(0,Math.min(MAX_PER_RUN,cfg.max_daily_emails))){
      const result=await sendOne(env,cfg,item);
      outcome[result.state]=(outcome[result.state]||0)+1;
      if(result.state!=='skipped')outcome.reserved++;
      if(['uncertain','unrecorded'].includes(result.state))break; // stop on uncertainty
    }
    return reply(outcome);
  }catch(_){return reply({error:'Follow-up cycle failed without sending confirmation'},503);}
}
export async function onRequestGet(){return reply({error:'POST required'},405);}
