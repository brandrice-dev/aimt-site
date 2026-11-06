import {reply,readBoundedBytes} from '../../_lib/founder-review/access.mjs';
import {verifyMaintenance} from '../../_lib/founder-review/maintenance-auth.mjs';
import {purgeReviewMaterials} from '../../_lib/founder-review/materials.mjs';
import {supabaseRest} from '../../_lib/certification/auth.mjs';
export async function onRequestPost({env,request}){
 try{
  const body=new TextDecoder().decode(await readBoundedBytes(request,512));
  if(!await verifyMaintenance(env.SUPABASE_SERVICE_ROLE_KEY,request.headers.get('x-aimt-timestamp'),body,request.headers.get('x-aimt-signature')))return reply({error:'Unauthorized.'},401);
  let input;try{input=JSON.parse(body);}catch{return reply({error:'Invalid request.'},400);}
  if(!input||typeof input!=='object'||Array.isArray(input))return reply({error:'Invalid request.'},400);
  const dryRun=input.dryRun!==false;
  const params=new URLSearchParams({select:'id,status',status:'in.(completed,cancelled)',materials_delete_after:'lte.'+new Date().toISOString(),limit:'5'});
  const due=await supabaseRest(env,'founder_review_reservations?'+params);if(!due.ok||!Array.isArray(due.body))throw Error();
  let deleted=0,failed=0;
  if(!dryRun)for(const row of due.body){try{await purgeReviewMaterials(env,row);deleted++;}catch{failed++;}}
  return reply({dryRun,due:due.body.length,deleted,failed},failed?503:200);
 }catch(error){return reply({error:error.message==='size'?'Request too large.':'Cleanup could not be completed.'},error.message==='size'?413:503);}
}
