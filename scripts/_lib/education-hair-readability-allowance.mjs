import {createPublicationCostControl,estimatedTokenCost} from '../../functions/_lib/research/publication-cost-control.mjs';
export const HAIR_READABILITY_TASK='hair-readability-2026-10-13';
// A separate, explicitly approved editorial task. Never resumes or resets the
// exhausted new-publication chain; its own $0.50/two requests survive all heads.
export function createHairReadabilityAllowance({previous=null,persist=()=>{}}={}) {
 if(previous && previous.task!==HAIR_READABILITY_TASK)throw Error('REVIEW_ALLOWANCE_IDENTITY_MISMATCH');
 const ledger=createPublicationCostControl({previous,persist:s=>persist({...s,budget_usd:.5,request_limit:2,task:HAIR_READABILITY_TASK})});
 return {summary:()=>({...ledger.summary(),budget_usd:.5,request_limit:2,task:HAIR_READABILITY_TASK}),
  reserve(body){const s=ledger.summary(),input=new TextEncoder().encode(JSON.stringify(body)).length+1024;
   if(s.requests>=2 || s.reserved_cost_estimate_usd+estimatedTokenCost(input,body.max_tokens)>.5)throw Object.assign(Error('Editorial review allowance exhausted'),{code:'SPEND_LIMIT'});
   return ledger.reserve(body);},recordUsage:u=>ledger.recordUsage(u),
  maxAffordableOutputTokens(body,ceiling){const s=ledger.summary();if(s.requests>=2)return 0;return Math.max(0,Math.min(ceiling,Math.floor((.5-s.reserved_cost_estimate_usd-estimatedTokenCost(new TextEncoder().encode(JSON.stringify({...body,stream:true})).length+1024,0))*100000)));}};
}
