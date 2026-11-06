import {resolveUser,isEntitled,supabaseRest,COURSE_SLUG} from '../certification/auth.mjs';
export const BUCKET='founder-review-materials';
export const MAX_BYTES=5*1024*1024;
export const FILE_SLOTS=['blueprint','supporting-1','supporting-2'];
export function reply(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function enabled(env){return env.FOUNDER_REVIEW_ENABLED==='true';}
export async function requireReview(env,request,{certified=false}={}){
  if(!enabled(env))return {response:reply({error:'Founder reviews are not available yet.'},404)};
  if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)return {response:reply({error:'Review service unavailable.'},503)};
  const identity=await resolveUser(env,request);
  if(identity.errorResponse)return {response:reply({error:'Sign in required.'},identity.errorResponse.status)};
  const user=identity.user;
  if(!await isEntitled(env,user))return {response:reply({error:'Active enrollment required.'},403)};
  // Never accept a user, reservation, completion flag or file path from the caller.
  const params=new URLSearchParams({select:'id,status,appointment_at,questions',user_id:`eq.${user.id}`,course_slug:`eq.${COURSE_SLUG}`,limit:'1'});
  let reservation=await supabaseRest(env,`founder_review_reservations?${params}`);
  if(reservation.ok&&!reservation.body?.length&&user.email_confirmed_at&&user.email){
    const linked=await supabaseRest(env,'rpc/founder_review_link',{method:'POST',body:JSON.stringify({p_user:user.id,p_email:user.email})});
    if(!linked.ok)return {response:reply({error:'Review availability could not be checked.'},503)};
    reservation=await supabaseRest(env,`founder_review_reservations?${params}`);
  }
  if(!reservation.ok)return {response:reply({error:'Review availability could not be checked.'},503)};
  const row=reservation.body?.[0];
  if(!row)return {response:reply({error:'No founder review is reserved for this account.'},403)};
  const completion=await supabaseRest(env,`completions?${new URLSearchParams({select:'credential_id,completed_at,revoked',user_id:`eq.${user.id}`,course_slug:`eq.${COURSE_SLUG}`,revoked:'eq.false',limit:'1'})}`);
  if(!completion.ok)return {response:reply({error:'Certification could not be checked.'},503)};
  const graduate=(completion.body||[]).some(c=>c.revoked===false&&/^AIMT-[A-Z]{2,6}-\d{4}-[A-Z2-9]{4,10}$/.test(c.credential_id)&&c.completed_at&&Date.parse(c.completed_at)<=Date.now());
  if(certified&&!graduate)return {response:reply({error:'Complete certification before submitting materials.'},403)};
  if(row.status==='cancelled')return {response:reply({error:'This review reservation is no longer active.'},403)};
  return {user,reservation:row,certified:graduate};
}
export function objectPath(reservation,slot){
  if(!/^[a-f0-9-]{36}$/i.test(reservation.id)||!FILE_SLOTS.includes(slot))throw Error('Invalid material slot');
  return `${reservation.id}/${slot}.pdf`;
}
export function storageHeaders(env,extra={}){return {apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,...extra};}
export async function listMaterials(env,reservation){
  const result=await fetch(`${env.SUPABASE_URL}/storage/v1/object/list/${BUCKET}`,{method:'POST',headers:storageHeaders(env,{'Content-Type':'application/json'}),body:JSON.stringify({prefix:reservation.id,limit:4,offset:0})});
  if(!result.ok)throw Error('Materials unavailable');
  const files=await result.json();
  return FILE_SLOTS.filter(slot=>files.some(f=>f.name===`${slot}.pdf`));
}
export async function readBoundedBytes(request,maxBytes){
  const length=request.headers.get('Content-Length');
  if(length&&Number(length)>maxBytes)throw Error('size');
  if(!request.body)return new Uint8Array();
  const reader=request.body.getReader(),chunks=[];let total=0;
  while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>maxBytes){await reader.cancel();throw Error('size');}chunks.push(value);}
  const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return bytes;
}
export async function readJsonBody(request,maxBytes=8192){return JSON.parse(new TextDecoder().decode(await readBoundedBytes(request,maxBytes)));}
export async function readBoundedPdf(request){
  if(request.headers.get('Content-Type')?.split(';')[0]!=='application/pdf')throw Error('type');
  const bytes=await readBoundedBytes(request,MAX_BYTES);
  if(bytes.length<10||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('type');
  return bytes;
}
