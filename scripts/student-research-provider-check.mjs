// Read-only live database + real-provider QA using production server functions.
// No auth account, entitlement, certification, transcript or queue mutation.
// Public logs contain aggregate checks, never source text, IDs or model replies.
import assert from 'node:assert/strict';
import {retrieveLearningResearch,groundedCourseContext,classifyLearningGap} from '../functions/_lib/cadence/learning-research.mjs';
import {askCadenceServerSide} from '../functions/_lib/cadence/ask-cadence.mjs';
import {getCadenceModelRegistry} from '../functions/_lib/cadence/model-config.mjs';
const env=process.env;
assert.ok(env.ANTHROPIC_API_KEY && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY,'Existing read-only test configuration is required.');
const original=global.fetch;let providerCalls=0;
global.fetch=async(url,options={})=>{
 const u=new URL(url),method=options.method || 'GET';
 if(u.hostname==='api.anthropic.com'){if(++providerCalls>6)throw Error('LIVE_QA_CALL_CEILING');}
 else assert.equal(method,'GET','Live QA must never mutate Supabase.');
 return original(url,{...options,signal:AbortSignal.timeout(30000)});
};
try {
 for(const [id,question] of [
  ['shedding-versus-breakage','Can you explain the difference between telogen shedding and hair breakage?'],
  ['microbiome','What does the scalp microbiome research mean for understanding scalp health?']
 ]) {
  const research=await retrieveLearningResearch(env,question,3);
  assert.equal(research.state,'available',`${id}: real eligible evidence must be retrieved.`);
  const guide=groundedCourseContext(3,question,research);
  const result=await askCadenceServerSide(env,{guideSystemPrompt:guide,boundedContext:[],studentMessage:question,activeCheckpointGuardrailText:null,research});
  assert.equal(result.modelInfo.modelName,getCadenceModelRegistry().roles.CADENCE_CHAT_MODEL.approved,'Default approved chat role must remain unchanged.');
  assert.equal(result.researchReview?.supported,true,`${id}: independent evidence grounding must pass.`);
  assert.ok(result.citations.length>0,`${id}: source references must be genuine and delivered.`);
  assert.ok(result.text.trim().split(/\s+/).length<350,`${id}: explanation must remain approachable.`);
  assert.ok(result.citations.every(c=>research.claims.some(e=>e.claim_id===c.claim_id && e.source_id===c.source_id && e.source.title===c.title && e.verification_status===c.verification_status)));
  console.log(`${id}: PASS (real eligible findings; independent grounding; genuine citations; concise reply).`);
 }
 // No extra model call: a missing-information proposal is independently
 // tested in isolated queue fixtures, while actual topical availability is
 // rechecked here against the live corpus before its conservative category.
 const q='The scalp microbiome explanation is unclear; I do not understand it.';
 const research=await retrieveLearningResearch(env,q,6);
 assert.equal(classifyLearningGap({research,message:q}),'unclear_explanation');
 console.log('Existing evidence checked before learning-gap classification: PASS (educational clarity; no scientific assignment or production write).');
 console.log(`Bounded provider calls: ${providerCalls}/6. Production account-session and deployed API model execution: NOT VERIFIED (no authorized session fixtures).`);
}finally {global.fetch=original;}
