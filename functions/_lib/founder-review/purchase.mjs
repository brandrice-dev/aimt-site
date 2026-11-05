import {supabaseRest} from '../certification/auth.mjs';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export async function rpc(env,name,args){
 const result=await supabaseRest(env,'rpc/'+name,{method:'POST',body:JSON.stringify(args)});
 if(!result.ok)throw Error('Founder review reservation unavailable');return result.body;
}
export async function holdReview(env,requestKey){
 if(env.FOUNDER_REVIEW_SALES_ENABLED!=='true')return null;
 const args={p_id:crypto.randomUUID()};
 if(requestKey!==undefined){if(!UUID.test(requestKey))throw Error('Invalid checkout request');const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(requestKey)));args.p_request_hash=Array.from(hash,b=>b.toString(16).padStart(2,'0')).join('');}
 const rows=await rpc(env,'founder_review_hold',args);if(!Array.isArray(rows))throw Error('Invalid reservation response');return rows[0]||null;
}
export function applyHold(params,hold,active=false){
 if(!hold){if(active)params['custom_text[submit][message]']='This enrollment does not include a founder review; the limited allocation is currently reserved.';return;}
 params['metadata[founder_review_hold]']=hold.id;
 params.expires_at=String(Math.floor(Date.parse(hold.created_at)/1000)+2100);
 params['custom_text[submit][message]']='Includes one private 45-minute founder review after certification and completion of your service plan. This bonus is reserved for this checkout.';
}
export async function bindHold(env,hold,session){
 if(!hold)return;
 if(!/^cs_(test|live)_/.test(session.id||''))throw Error('Invalid checkout session');
 if(await rpc(env,'founder_review_bind',{p_id:hold.id,p_session:session.id})!==true)throw Error('Could not bind founder review');
}
export async function fulfillReview(env,session){
 const id=session.metadata?.founder_review_hold;if(!id)return false;
 if(!UUID.test(id)||session.payment_status!=='paid')return false;
 const email=String(session.customer_details?.email||session.customer_email||'').trim().toLowerCase();if(!email)throw Error('Missing bonus purchaser email');
 // No environment sales flag here: prior promises survive campaign shutdown.
 if(await rpc(env,'founder_review_paid',{p_id:id,p_session:session.id,p_email:email})!==true)throw Error('Purchased bonus could not be reserved');
 return true;
}
export async function releaseExpiredReview(env,session){
 const id=session.metadata?.founder_review_hold;if(!id||!UUID.test(id)||session.status!=='expired'||session.payment_status==='paid')return false;
 return rpc(env,'founder_review_release',{p_id:id,p_session:session.id});
}

export async function releaseRejectedHold(env,hold,response){
 if(!hold||response.status<400||response.status>=500||[408,409,425,429].includes(response.status))return;
 // Conflicting/retried idempotent requests are not proof that no session exists.
 let error;try{error=(await response.clone().json())?.error;}catch{return;}
 if(error?.type==='idempotency_error')return;
 if(error?.type!=='invalid_request_error'&&error?.type!=='authentication_error'&&error?.type!=='permission_error')return;
 await rpc(env,'founder_review_release',{p_id:hold.id,p_session:null});
 // Never release on timeout, conflict, rate limit or 5xx: a session may exist.
}
