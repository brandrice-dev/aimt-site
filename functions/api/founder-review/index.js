import {requireReview,reply,listMaterials} from '../../_lib/founder-review/access.mjs';
export async function onRequestGet({env,request}){
  try{
    const access=await requireReview(env,request);if(access.response)return access.response;
    const materials=access.certified?await listMaterials(env,access.reservation):[];
    return reply({status:access.reservation.status,certified:access.certified,appointmentAt:access.reservation.appointment_at||null,materials,questions:access.reservation.questions||'',durationMinutes:45});
  }catch{return reply({error:'Review details are temporarily unavailable.'},503);}
}
