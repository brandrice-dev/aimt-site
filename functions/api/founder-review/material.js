import {requireReview,reply,objectPath,storageHeaders,readBoundedPdf,BUCKET,FILE_SLOTS} from '../../_lib/founder-review/access.mjs';
export async function onRequestPut({env,request}){
  try{
    const access=await requireReview(env,request,{certified:true});if(access.response)return access.response;
    if(access.reservation.status!=='reserved')return reply({error:'Materials are closed for this review.'},409);
    const slot=new URL(request.url).searchParams.get('slot');
    if(!FILE_SLOTS.includes(slot))return reply({error:'Choose a valid material slot.'},400);
    let bytes;try{bytes=await readBoundedPdf(request);}catch(e){return reply({error:e.message==='size'?'Each PDF must be 5 MB or smaller.':'Upload a PDF file.'},e.message==='size'?413:400);}
    const response=await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath(access.reservation,slot)}`,{method:'POST',headers:storageHeaders(env,{'Content-Type':'application/pdf','x-upsert':'true','Cache-Control':'no-store'}),body:bytes});
    if(!response.ok)return reply({error:'Upload failed. Please retry.'},503);
    return reply({saved:true,slot});
  }catch{return reply({error:'Materials could not be saved.'},503);}
}
