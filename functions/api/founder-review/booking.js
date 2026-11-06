import {requireReview,reply,listMaterials} from '../../_lib/founder-review/access.mjs';
export const BOOKING_URL='https://calendar.google.com/calendar/appointments/schedules/AcZssZ1tNgOWBWQFYBczptBaUliONhU_l0xwWb97qNJ4gffg4B-iCCZZXo8a8RSlcdlZ-ea9pcr6s-zN?gv=true';
export async function onRequestPost({env,request}){
  try{
    const access=await requireReview(env,request,{certified:true});if(access.response)return access.response;
    if(access.reservation.status!=='reserved')return reply({error:'This review already has a booking or is closed.'},409);
    if(!(await listMaterials(env,access.reservation)).includes('blueprint'))return reply({error:'Upload your Blueprint PDF before choosing a time.'},409);
    return reply({url:BOOKING_URL,note:'Book with the same email used for AIMT. Your appointment will appear here after the founder verifies it.'});
  }catch{return reply({error:'Booking is temporarily unavailable.'},503);}
}
