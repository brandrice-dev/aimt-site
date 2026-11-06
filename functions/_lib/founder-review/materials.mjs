import {supabaseRest} from '../certification/auth.mjs';
import {objectPath,BUCKET,FILE_SLOTS,storageHeaders} from './access.mjs';
export async function purgeReviewMaterials(env,row){
 if(!['completed','cancelled'].includes(row.status))throw Error('Review is not closed');
 const deleted=await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}`,{method:'DELETE',headers:storageHeaders(env,{'Content-Type':'application/json'}),body:JSON.stringify({prefixes:FILE_SLOTS.map(slot=>objectPath(row,slot))})});
 if(!deleted.ok)throw Error('Materials could not be deleted');
 const cleared=await supabaseRest(env,`founder_review_reservations?${new URLSearchParams({id:'eq.'+row.id,status:'eq.'+row.status})}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({questions:'',materials_delete_after:null,materials_purged_at:new Date().toISOString()})});
 if(!cleared.ok||!cleared.body?.length)throw Error('Deletion could not be recorded');
 return true;
}
