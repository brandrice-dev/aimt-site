import {resolveAdmin} from '../../_lib/admin/auth.mjs';
import {supabaseRest} from '../../_lib/certification/auth.mjs';
import {reply,enabled,listMaterials,objectPath,BUCKET,storageHeaders} from '../../_lib/founder-review/access.mjs';
export async function onRequestGet({env,request}){
  try{
    if(!enabled(env))return reply({error:'Founder reviews are not available yet.'},404);
    const actor=await resolveAdmin(env,request,['owner'],{bootstrap:false});
    if(actor.errorResponse)return reply({error:'Owner access required.'},actor.errorResponse.status);
    const result=await supabaseRest(env,'founder_review_reservations?select=id,user_id,purchaser_email,status,appointment_at,questions,created_at,materials_delete_after&order=created_at.asc&status=neq.held&limit=5');
    if(!result.ok)throw Error('Ledger unavailable');
    const reviews=[];
    for(const row of result.body){
      const materials=[];
      for(const slot of await listMaterials(env,row)){
        const signed=await fetch(`${env.SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${objectPath(row,slot)}`,{method:'POST',headers:storageHeaders(env,{'Content-Type':'application/json'}),body:JSON.stringify({expiresIn:60,download:`${slot}.pdf`})});
        if(!signed.ok)throw Error('Material unavailable');
        const data=await signed.json();
        if(typeof data.signedURL!=='string'||!data.signedURL.startsWith('/object/sign/'))throw Error('Invalid material URL');
        materials.push({slot,url:`${env.SUPABASE_URL}/storage/v1${data.signedURL}`});
      }
      reviews.push({...row,materials});
    }
    return reply({reviews});
  }catch{return reply({error:'Founder reviews could not be loaded.'},503);}
}

export async function onRequestPost({env,request}){
 try{
  if(!enabled(env))return reply({error:'Founder reviews are not available yet.'},404);
  const actor=await resolveAdmin(env,request,['owner'],{bootstrap:false});if(actor.errorResponse)return reply({error:'Owner access required.'},actor.errorResponse.status);
  const text=await request.text();if(text.length>4096)return reply({error:'Request too large.'},413);
  const data=JSON.parse(text);if(!/^[a-f0-9-]{36}$/i.test(data.id||''))return reply({error:'Invalid review.'},400);
  const result=await supabaseRest(env,`founder_review_reservations?${new URLSearchParams({id:'eq.'+data.id,select:'id,status,appointment_at,user_id'})}`);
  const row=result.body?.[0];if(!result.ok)throw Error();if(!row)return reply({error:'Review not found.'},404);
  let updates,expected;
  if(data.action==='confirm'){
   if(row.status!=='reserved')return reply({error:'Only a reserved review can be confirmed.'},409);
   const {validReviewTime}=await import('../../_lib/founder-review/schedule.mjs');
   if(!validReviewTime(data.appointmentAt)||typeof data.googleEventId!=='string'||!data.googleEventId.trim()||data.googleEventId.length>512)return reply({error:'Verify the Google booking and choose a Monday or Tuesday time between 9 AM and 2 PM Eastern.'},400);
   updates={status:'scheduled',appointment_at:new Date(data.appointmentAt).toISOString(),appointment_ends_at:new Date(Date.parse(data.appointmentAt)+45*60000).toISOString(),google_event_id:data.googleEventId.trim()};expected='reserved';
  }else if(data.action==='complete'){
   if(row.status!=='scheduled')return reply({error:'Only a scheduled review can be completed.'},409);
   updates={status:'completed',completed_at:new Date().toISOString(),materials_delete_after:new Date(Date.now()+30*86400000).toISOString()};expected='scheduled';
  }else if(data.action==='purge'){
   if(row.status!=='completed')return reply({error:'Complete the review before deleting its materials.'},409);
   const paths=['blueprint','supporting-1','supporting-2'].map(s=>objectPath(row,s));
   const deleted=await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}`,{method:'DELETE',headers:storageHeaders(env,{'Content-Type':'application/json'}),body:JSON.stringify({prefixes:paths})});
   if(!deleted.ok)throw Error();
   const cleared=await supabaseRest(env,`founder_review_reservations?${new URLSearchParams({id:'eq.'+row.id,status:'eq.completed'})}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({questions:'',materials_delete_after:null})});
   if(!cleared.ok||!cleared.body?.length)throw Error();return reply({saved:true});
  }else return reply({error:'Unknown action.'},400);
  const saved=await supabaseRest(env,`founder_review_reservations?${new URLSearchParams({id:'eq.'+row.id,status:'eq.'+expected})}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(updates)});
  if(!saved.ok||!saved.body?.length)return reply({error:'Could not update review. Check for a conflicting booking or refresh.'},409);
  return reply({saved:true});
 }catch{return reply({error:'Review could not be updated.'},503);}
}
