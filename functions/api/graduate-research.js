import {requireResearchMember,protectedJson,parseGraduateQuery,queryGraduateLibrary,graduateTopics,EVIDENCE_TYPES,SOURCE_ROLES} from '../_lib/research/graduate-library.mjs';
export async function onRequest({request,env}) {
 if(request.method!=='GET')return protectedJson({error:'Method not allowed.'},405);
 try {
  const auth=await requireResearchMember(env,request);if(auth.response)return auth.response;
  const params=new URL(request.url).searchParams;
  if(params.get('action')==='access')return protectedJson({eligible:true,access_type:auth.accessType});
  if(params.get('action')==='filters')return protectedJson({topics:await graduateTopics(env),evidence_types:EVIDENCE_TYPES,categories:SOURCE_ROLES});
  let query;try {query=parseGraduateQuery(params);}catch{return protectedJson({error:'Check your search and filters.'},400);}
  return protectedJson(await queryGraduateLibrary(env,query));
 } catch(error) {
  return protectedJson({error:error.message==='SEARCH_TOO_BROAD'?'This search matches too many studies. Try a more specific phrase.':'The research library is temporarily unavailable. Please try again.'},error.message==='SEARCH_TOO_BROAD'?422:503);
 }
}
