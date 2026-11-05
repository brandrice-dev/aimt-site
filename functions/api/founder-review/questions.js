import {requireReview,reply,readJsonBody} from '../../_lib/founder-review/access.mjs';
import {supabaseRest} from '../../_lib/certification/auth.mjs';
export async function onRequestPost({env,request}){
  try{
    const access=await requireReview(env,request,{certified:true});if(access.response)return access.response;
    if(access.reservation.status!=='reserved')return reply({error:'This review is no longer accepting changes.'},409);
    let data;try{data=await readJsonBody(request);}catch(error){return reply({error:error.message==='size'?'Questions are too long.':'Invalid questions.'},error.message==='size'?413:400);}
    if(typeof data?.questions!=='string'||data.questions.length>1000)return reply({error:'Use 1,000 characters or fewer.'},400);
    const params=new URLSearchParams({id:`eq.${access.reservation.id}`,user_id:`eq.${access.user.id}`,status:'eq.reserved'});
    const saved=await supabaseRest(env,`founder_review_reservations?${params}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({questions:data.questions.trim()})});
    if(!saved.ok||!saved.body?.length)return reply({error:'Questions could not be saved.'},503);
    return reply({saved:true});
  }catch{return reply({error:'Questions could not be saved.'},503);}
}
