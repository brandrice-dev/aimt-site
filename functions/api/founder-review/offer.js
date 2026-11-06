import {reply} from '../../_lib/founder-review/access.mjs';
import {supabaseRest} from '../../_lib/certification/auth.mjs';
export async function onRequestGet({env}){
 if(env.FOUNDER_REVIEW_SALES_ENABLED!=='true')return reply({active:false});
 try{
  const campaign=await supabaseRest(env,'founder_review_campaign?id=eq.initial-five&select=active,capacity&limit=1');
  const row=campaign.body?.[0];if(!campaign.ok||row?.active!==true||row.capacity!==5)return reply({active:false});
  const reservations=await supabaseRest(env,'founder_review_reservations?campaign_id=eq.initial-five&select=slot&limit=5');
  if(!reservations.ok||!Array.isArray(reservations.body))throw Error();
  return reply({active:true,capacity:5,remaining:Math.max(0,5-reservations.body.length)});
 }catch{return reply({active:false});}
}
