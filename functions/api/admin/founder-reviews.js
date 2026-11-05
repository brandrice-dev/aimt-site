import {resolveAdmin} from '../../_lib/admin/auth.mjs';
import {supabaseRest} from '../../_lib/certification/auth.mjs';
import {reply,enabled,listMaterials,objectPath,BUCKET,storageHeaders} from '../../_lib/founder-review/access.mjs';
export async function onRequestGet({env,request}){
  try{
    if(!enabled(env))return reply({error:'Founder reviews are not available yet.'},404);
    const actor=await resolveAdmin(env,request,['owner'],{bootstrap:false});
    if(actor.errorResponse)return reply({error:'Owner access required.'},actor.errorResponse.status);
    const result=await supabaseRest(env,'founder_review_reservations?select=id,user_id,status,appointment_at,questions,created_at&order=created_at.asc&limit=5');
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
