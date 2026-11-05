// Private AIMT Admin controls for the Readiness marketing follow-up program.
// Owner alone may activate/pause the campaign. No messages are sent on
// activation; only NEW leads submitted after activation are eligible.
// Read-only status is visible to owner/admin, never students or support.
import { resolveAdmin, writeAdminAudit } from '../../_lib/admin/auth.mjs';
import { supabaseRest } from '../../_lib/certification/auth.mjs';

function json(data,status=200) {
  return new Response(JSON.stringify(data),{status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'private, no-store','Vary':'Authorization',
    'X-Content-Type-Options':'nosniff',
  }});
}
async function config(env){
  const r=await supabaseRest(env,'readiness_followup_config?select=*&id=eq.true&limit=1');
  if(!r.ok||!Array.isArray(r.body)||r.body.length!==1)throw new Error('Follow-up campaign table unavailable');
  return r.body[0];
}
async function counts(env){
  const r=await supabaseRest(env,'readiness_followup_sends?select=stage,status&limit=2000');
  if(!r.ok||!Array.isArray(r.body))throw new Error('Delivery ledger unavailable');
  return r.body.reduce((stats,row)=>{
    stats.total++;
    if(row.status==='sent')stats.sent++;
    else if(row.status==='failed'||row.status==='uncertain')stats.needsReview++;
    else if(row.status==='reserved')stats.reserved++;
    else if(row.status==='suppressed')stats.suppressed++;
    if(row.status==='sent'&&row.stage===1)stats.firstStepSent++;
    if(row.status==='sent'&&row.stage===2)stats.secondStepSent++;
    return stats;
  },{total:0,sent:0,needsReview:0,reserved:0,suppressed:0,firstStepSent:0,secondStepSent:0});
}
export async function onRequestGet({request,env}){
  const actor=await resolveAdmin(env,request,['owner','admin'],{bootstrap:false});
  if(actor.errorResponse)return actor.errorResponse;
  try{
    const [c,stats]=await Promise.all([config(env),counts(env)]);
    return json({
      enabled:c.enabled===true,
      activatedAt:c.activated_at,
      hasPostalAddress:!!c.postal_address&&c.postal_address.trim().length>=12,
      maxDailyEmails:c.max_daily_emails,
      maxTotalEmails:c.max_total_emails,
      totalReserved:c.total_reserved,
      stats,
      ownerCanConfigure:actor.admin.role==='owner',
    });
  }catch(_){return json({error:'Follow-up reporting is unavailable.'},503);}
}
export async function onRequestPost({request,env}){
  const actor=await resolveAdmin(env,request,['owner'],{bootstrap:false});
  if(actor.errorResponse)return actor.errorResponse;
  const body=await request.json().catch(()=>null);
  if(!body||typeof body!=='object')return json({error:'Invalid request.'},400);
  try {
    const before=await config(env);
    if(body.action==='pause'){
      if(!before.enabled)return json({status:'already_paused'});
      const res=await supabaseRest(env,'readiness_followup_config?id=eq.true',{
        method:'PATCH',headers:{Prefer:'return=minimal'},
        body:JSON.stringify({enabled:false,updated_at:new Date().toISOString()}),
      });
      if(!res.ok)throw new Error('Unable to pause campaign');
      await writeAdminAudit(env,actor,'pause_readiness_followups',{details:{reserved:before.total_reserved}});
      return json({status:'paused'});
    }
    if(body.action!=='activate')return json({error:'Unknown action.'},400);
    if(before.enabled)return json({error:'Already active. Pause before revising campaign limits.'},409);

    const addr=typeof body.postalAddress==='string'?body.postalAddress.trim():'';
    const daily=Number(body.maxDailyEmails),total=Number(body.maxTotalEmails);
    if(addr.length<12||addr.length>400||/[<>]/.test(addr))return json({error:'Enter AIMT’s valid business postal address (12–400 characters).'},400);
    if(!Number.isInteger(daily)||daily<1||daily>100)return json({error:'Daily limit must be between 1 and 100 emails.'},400);
    if(!Number.isInteger(total)||total<Math.max(daily,before.total_reserved+1)||total>10000)return json({error:'Total campaign limit must cover the daily cap and prior reservations.'},400);
    if(body.ownerAcknowledged!==true)return json({error:'Owner approval of the postal address and send caps is required.'},400);
    const now=new Date().toISOString();
    const res=await supabaseRest(env,'readiness_followup_config?id=eq.true',{
      method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({
        enabled:true,activated_at:now,postal_address:addr,
        max_daily_emails:daily,max_total_emails:total,updated_at:now,
      }),
    });
    if(!res.ok)throw new Error('Unable to activate campaign');
    await writeAdminAudit(env,actor,'activate_readiness_followups',{details:{
      max_daily_emails:daily,max_total_emails:total,
      activation_scope:'new_leads_only',
    }});
    return json({status:'active',activatedAt:now});
  }catch(_){return json({error:'Unable to change follow-up campaign.'},503);}
}
