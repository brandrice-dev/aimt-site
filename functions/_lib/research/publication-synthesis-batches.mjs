/*
 * Bounded scientific synthesis for large topic corpora.
 * Every eligible claim is dispositioned in a small, independently validated
 * batch. One separate global pass sees ALL original evidence, checks
 * cross-batch conflicts and builds the page framing. Only the ORIGINAL
 * full-corpus validator can authorize AUTO_READY.
 *
 * This module is pure apart from injected model calls and checkpoint I/O.
 * GitHub Actions state persistence lives in scripts/_lib/ and is reused
 * between approved budget windows. No additional credentials or provider.
 */
import { CLAIM_ROLES, EXCLUSION_REASON_CODES, SYNTHESIS_OUTPUT_JSON_SCHEMA } from './publication-synthesis-schema.mjs';
import { validateSynthesisOutput } from './publication-synthesis-validator.mjs';
import { synthesizeEvidenceBatch, synthesizeGlobalEvidence } from './publication-synthesis-client.mjs';

export const BATCH_SYNTHESIS_CONTRACT = 'publication-batches-v1';
export const BATCH_SYNTHESIS_THRESHOLD = 160;
export const BATCH_CLAIMS = 40;
export const BATCH_MAX_CALLS_PER_RUN = 2;
export const MAX_BATCH_FAILURE_ATTEMPTS = 2;

const record = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const string = { type: 'string' };
const stringList = { type: 'array', items: string };
const selectedSchema = record({
  claim_id: string, role: {type:'string',enum:[...CLAIM_ROLES]}, reason: string,
});
const excludedSchema = record({
  claim_id: string, reason_code: {type:'string',enum:[...EXCLUSION_REASON_CODES]}, reason: string,
  related_conflict_claim_ids: stringList,
});
export const BATCH_DECISIONS_SCHEMA = record({
  selected_claims: {type:'array',items:selectedSchema},
  excluded_claims: {type:'array',items:excludedSchema},
});

const {selected_claims: unusedSelected, excluded_claims: unusedExcluded,
  topic_slug: unusedSlug, page_concept: unusedConcept, ...globalProperties} = SYNTHESIS_OUTPUT_JSON_SCHEMA.properties;
export const GLOBAL_SYNTHESIS_SCHEMA = {
  ...SYNTHESIS_OUTPUT_JSON_SCHEMA,
  properties: {
    ...globalProperties,
    disposition_adjustments: {type:'array',items:record({
      claim_id: string,
      disposition: {type:'string',enum:['SELECTED','EXCLUDED']},
      role: {type:'string',enum:[...CLAIM_ROLES,'NOT_APPLICABLE']},
      reason_code: {type:'string',enum:[...EXCLUSION_REASON_CODES,'NOT_APPLICABLE']},
      reason: string,
      related_conflict_claim_ids: stringList,
    })},
  },
  required: [...SYNTHESIS_OUTPUT_JSON_SCHEMA.required.filter(k=>!['topic_slug','page_concept','selected_claims','excluded_claims'].includes(k)),
    'disposition_adjustments'],
};

const validText = t => typeof t === 'string' && t.trim().length > 0;
export function splitSynthesisEvidence(evidenceBundle, batchSize=BATCH_CLAIMS) {
  if(!Number.isInteger(batchSize)||batchSize<1||batchSize>80)throw Error('INVALID_BATCH_SIZE');
  const sorted=[...evidenceBundle.claims].sort((a,b)=>a.claim_id.localeCompare(b.claim_id));
  if(new Set(sorted.map(c=>c.claim_id)).size!==sorted.length)throw Error('DUPLICATE_INPUT_CLAIM_ID');
  const sources=new Map(evidenceBundle.sources.map(s=>[s.source_id,s]));
  if(sources.size!==evidenceBundle.sources.length)throw Error('DUPLICATE_INPUT_SOURCE_ID');
  const chunks=[];
  for(let offset=0;offset<sorted.length;offset+=batchSize) {
    const claims=sorted.slice(offset,offset+batchSize);
    const sourceIds=new Set(claims.map(c=>c.source_id));
    if([...sourceIds].some(id=>!sources.has(id)))throw Error('MISSING_INPUT_SOURCE_ID');
    chunks.push({
      index: chunks.length,
      claim_ids: claims.map(c=>c.claim_id),
      evidence: { claims, sources: [...sourceIds].map(id=>sources.get(id)) },
    });
  }
  return chunks;
}

export function validateBatchDecisions(output,chunk) {
  const issues=[];
  if(!output||!Array.isArray(output.selected_claims)||!Array.isArray(output.excluded_claims))
    return {valid:false,issues:['INVALID_BATCH_RESPONSE']};
  const expected=new Set(chunk.claim_ids),counts=new Map();
  const seen=(row,isExcluded)=>{
    if(!row||!expected.has(row.claim_id)||!validText(row.reason)) {
      issues.push('BATCH_UNKNOWN_ID_OR_REASON');return;
    }
    counts.set(row.claim_id,(counts.get(row.claim_id)||0)+1);
    if(isExcluded) {
      if(!EXCLUSION_REASON_CODES.includes(row.reason_code) ||
         !Array.isArray(row.related_conflict_claim_ids) ||
         row.related_conflict_claim_ids.some(id=>!expected.has(id)))issues.push('INVALID_BATCH_EXCLUSION');
    } else if(!CLAIM_ROLES.includes(row.role))issues.push('INVALID_BATCH_SELECTION');
  };
  output.selected_claims.forEach(x=>seen(x,false));
  output.excluded_claims.forEach(x=>seen(x,true));
  for(const id of expected)if(counts.get(id)!==1)issues.push('BATCH_MISSING_OR_DOUBLE_DISPOSITION');
  return {valid:issues.length===0,issues};
}

export function validateBatchCheckpoint(progress,chunks,fingerprint) {
  if(!progress || progress.version!==BATCH_SYNTHESIS_CONTRACT ||
      progress.fingerprint!==fingerprint || progress.total!==chunks.length ||
      !Array.isArray(progress.completed) ||
      progress.completed.length>chunks.length || !progress.failures ||
      typeof progress.failures!=='object' || Array.isArray(progress.failures))
    throw Error('INVALID_BATCH_CHECKPOINT');
  for(let i=0;i<progress.completed.length;i++) {
    const stored=progress.completed[i];
    if(!stored||stored.index!==i ||
       JSON.stringify(stored.claim_ids)!==JSON.stringify(chunks[i].claim_ids) ||
       !validateBatchDecisions(stored.output,chunks[i]).valid)
      throw Error('INVALID_BATCH_CHECKPOINT');
  }
  for(const [index,value] of Object.entries(progress.failures)) {
    if(!/^(0|[1-9][0-9]*)$/.test(index)||+index>chunks.length ||
       !Number.isInteger(value)||value<0||value>MAX_BATCH_FAILURE_ATTEMPTS)
      throw Error('INVALID_BATCH_CHECKPOINT');
  }
  if(progress.global &&
     (progress.completed.length!==chunks.length || !progress.global.output ||
      !progress.global.modelInfo))throw Error('INVALID_BATCH_CHECKPOINT');
  return true;
}

export function assembleBatchSynthesis({topic_slug,pageIntent,v1Result,evidenceBundle,chunks,completed,globalOutput}) {
  if(completed.length!==chunks.length || !globalOutput ||
     !Array.isArray(globalOutput.disposition_adjustments))throw Error('INCOMPLETE_GLOBAL_SYNTHESIS');
  const dispositions=new Map();
  for(let i=0;i<chunks.length;i++) {
    if(completed[i]?.index!==i ||
       !validateBatchDecisions(completed[i].output,chunks[i]).valid)throw Error('INCOMPLETE_BATCH_ACCOUNTING');
    for(const c of completed[i].output.selected_claims) {
      if(dispositions.has(c.claim_id))throw Error('DUPLICATE_BATCH_DISPOSITION');
      dispositions.set(c.claim_id,{type:'SELECTED',entry:c});
    }
    for(const c of completed[i].output.excluded_claims) {
      if(dispositions.has(c.claim_id))throw Error('DUPLICATE_BATCH_DISPOSITION');
      dispositions.set(c.claim_id,{type:'EXCLUDED',entry:c});
    }
  }
  if(dispositions.size!==evidenceBundle.claims.length)throw Error('INCOMPLETE_BATCH_ACCOUNTING');

  const changed=new Set();
  for(const a of globalOutput.disposition_adjustments) {
    if(!a||changed.has(a.claim_id)||!dispositions.has(a.claim_id)||
       !['SELECTED','EXCLUDED'].includes(a.disposition)||!validText(a.reason)||
       !Array.isArray(a.related_conflict_claim_ids))throw Error('UNTRUSTED_GLOBAL_ADJUSTMENT');
    changed.add(a.claim_id);
    if(a.disposition==='SELECTED') {
      if(!CLAIM_ROLES.includes(a.role)||a.reason_code!=='NOT_APPLICABLE'||
         a.related_conflict_claim_ids.length)throw Error('UNTRUSTED_GLOBAL_ADJUSTMENT');
      dispositions.set(a.claim_id,{type:'SELECTED',entry:{claim_id:a.claim_id,role:a.role,reason:a.reason}});
    } else {
      if(!EXCLUSION_REASON_CODES.includes(a.reason_code)||a.role!=='NOT_APPLICABLE')
        throw Error('UNTRUSTED_GLOBAL_ADJUSTMENT');
      dispositions.set(a.claim_id,{type:'EXCLUDED',entry:{claim_id:a.claim_id,reason_code:a.reason_code,
        reason:a.reason,related_conflict_claim_ids:a.related_conflict_claim_ids}});
    }
  }
  const required=v1Result.synthesis_packet?.synthesis_required_flags||[];
  const signals=globalOutput.resolved_synthesis_signals;
  const evidenceIds=new Set(evidenceBundle.claims.map(c=>c.claim_id));
  if(!Array.isArray(signals) || (required.length>0 && required.some(flag=>
    !signals.some(s=>s.signal===flag&&validText(s.resolution)&&s.claim_ids?.length>0 &&
     s.claim_ids.every(id=>evidenceIds.has(id))))))throw Error('UNADDRESSED_GLOBAL_SCIENTIFIC_SIGNAL');

  const {disposition_adjustments: ignore, ...globalFields}=globalOutput;
  const finalOutput={
    ...globalFields,
    topic_slug,
    page_concept:pageIntent.page_concept,
    selected_claims:[...dispositions.values()].filter(x=>x.type==='SELECTED').map(x=>x.entry),
    excluded_claims:[...dispositions.values()].filter(x=>x.type==='EXCLUDED').map(x=>x.entry),
  };
  // This is always the unchanged ORIGINAL evidence and eligibility authority.
  const validation=validateSynthesisOutput({v1Result,evidenceBundle,aiOutput:finalOutput});
  return {finalOutput,validation};
}

function makeMetrics() {
  return {model_calls:0,reconciliation_calls:0,full_retries:0,total_input_tokens:0,
    total_output_tokens:0,calls:[],model_info:null};
}
function account(metrics,label,result){
  const attempts=Number.isInteger(result?.diagnostics?.attempts)?result.diagnostics.attempts:1;
  metrics.model_calls+=attempts;
  if(result?.ok) {
    metrics.total_input_tokens+=result.usage?.input_tokens||0;
    metrics.total_output_tokens+=result.usage?.output_tokens||0;
    if(result.modelInfo)metrics.model_info=result.modelInfo;
  }
  metrics.calls.push({label,ok:!!result?.ok,reason:result?.reason||null,attempts});
}
function outcome(progress,metrics,reason='batch_progress'){
  return {status:'SYNTHESIS_IN_PROGRESS',reason,stage:'batched',
    progress:{completed:progress.completed.length,total:progress.total,
      global_ready:!!progress.global},finalOutput:null,reconciliation:null,initial:null,metrics};
}
function failure(progress,metrics,reason,extra={}){
  return {status:'SYNTHESIS_FAILED',reason,stage:'batched',
    progress:{completed:progress.completed.length,total:progress.total},finalOutput:null,metrics,...extra};
}

export async function runBatchedSynthesisPipeline(env,{
  topic_slug,v1Result,evidenceBundle,pageIntent,batchIo,
  fns={},
}) {
  if(!batchIo?.fingerprint || !batchIo?.load || !batchIo?.save)
    throw Error('BATCH_CHECKPOINT_IO_REQUIRED');
  const chunks=splitSynthesisEvidence(evidenceBundle);
  const fingerprint=batchIo.fingerprint({topic_slug,v1Result,evidenceBundle,pageIntent});
  let progress=await batchIo.load({topic_slug,fingerprint});
  progress ||= {version:BATCH_SYNTHESIS_CONTRACT,fingerprint,total:chunks.length,completed:[],
    failures:{},global:null};
  validateBatchCheckpoint(progress,chunks,fingerprint);
  const metrics=makeMetrics();
  const chunkFn=fns.chunkFn||synthesizeEvidenceBatch;
  const globalFn=fns.globalFn||synthesizeGlobalEvidence;
  let calls=0;
  const persist=async()=>{await batchIo.save({topic_slug,fingerprint,progress});};

  while(progress.completed.length<chunks.length && calls<BATCH_MAX_CALLS_PER_RUN) {
    const current=chunks[progress.completed.length],key=String(current.index);
    if((progress.failures[key]||0)>=MAX_BATCH_FAILURE_ATTEMPTS)
      return failure(progress,metrics,'batch_retry_ceiling');
    // Reserve this attempt durably before the model request, alongside the
    // transport's own persisted cost reservation.
    progress.failures[key]=(progress.failures[key]||0)+1;
    await persist();
    const result=await chunkFn(env,{
      topic_slug,pageIntent,chunk:current,requiredFlags:v1Result.synthesis_packet?.synthesis_required_flags||[],
    });
    account(metrics,'evidence_batch_'+current.index,result);
    if(!result?.ok) {
      if(result?.diagnostics?.code==='SPEND_LIMIT' && result.diagnostics.attempts===0) {
        progress.failures[key]--;
        await persist();
        return outcome(progress,metrics,'budget_pause');
      }
      await persist();
      return failure(progress,metrics,'evidence_batch_'+(result?.reason||'provider_failure'),
        {diagnostics:result?.diagnostics});
    }
    calls++;
    if(!validateBatchDecisions(result.output,current).valid) {
      await persist();
      return failure(progress,metrics,'invalid_evidence_batch');
    }
    progress.completed.push({index:current.index,claim_ids:current.claim_ids,
      output:result.output,modelInfo:result.modelInfo});
    delete progress.failures[key];
    await persist();
  }
  if(progress.completed.length!==chunks.length)return outcome(progress,metrics);

  if(!progress.global && calls<BATCH_MAX_CALLS_PER_RUN) {
    const key=String(chunks.length);
    if((progress.failures[key]||0)>=MAX_BATCH_FAILURE_ATTEMPTS)
      return failure(progress,metrics,'global_retry_ceiling');
    progress.failures[key]=(progress.failures[key]||0)+1;
    await persist();
    const result=await globalFn(env,{
      topic_slug,pageIntent,evidenceBundle,v1Result,completed:progress.completed,
    });
    account(metrics,'global_scientific_synthesis',result);
    if(!result?.ok) {
      if(result?.diagnostics?.code==='SPEND_LIMIT' && result.diagnostics.attempts===0) {
        progress.failures[key]--;
        await persist();
        return outcome(progress,metrics,'budget_pause');
      }
      await persist();
      return failure(progress,metrics,'global_'+(result?.reason||'provider_failure'),
        {diagnostics:result?.diagnostics});
    }
    calls++;
    progress.global={output:result.output,modelInfo:result.modelInfo||{modelName:'claude-sonnet-5'}};
    delete progress.failures[key];
    await persist();
  }
  if(!progress.global)return outcome(progress,metrics);

  let assembled;
  try {
    assembled=assembleBatchSynthesis({topic_slug,pageIntent,v1Result,evidenceBundle,chunks,
      completed:progress.completed,globalOutput:progress.global.output});
  } catch(err) {
    return failure(progress,metrics,'invalid_global_synthesis',{violations:[String(err.message)]});
  }
  if(!assembled.validation.valid) {
    return failure(progress,metrics,'invalid_global_synthesis',{violations:assembled.validation.violations,
      finalOutput:assembled.finalOutput});
  }
  metrics.model_info=progress.global.modelInfo;
  return {
    status:assembled.finalOutput.recommended_disposition==='AUTO_READY'?'AUTO_READY':'HUMAN_REVIEW',
    reason:assembled.finalOutput.recommended_disposition==='AUTO_READY'?'validated':'model_declared_human_review',
    stage:'batched-global-validated',finalOutput:assembled.finalOutput,
    metrics,reconciliation:null,initial:null,
    progress:{completed:progress.completed.length,total:progress.total,global_ready:true},
  };
}
