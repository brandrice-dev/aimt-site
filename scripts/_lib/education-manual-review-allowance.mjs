import {estimatedTokenCost,PUBLICATION_INPUT_TOKEN_LIMIT,PUBLICATION_OUTPUT_TOKEN_LIMIT} from '../../functions/_lib/research/publication-cost-control.mjs';
export function createManualReviewAllowance({previous,persist}){
 if(previous?.task!=='manual-article-batch-2026-11-09'||previous.requests!==5||previous.requests_with_unknown_usage!==0)throw Error('EXACT_PRIOR_COST_REQUIRED');
 let state={...previous,budget_usd:5,request_limit:10};
 for(const k of ['requests','reserved_cost_estimate_usd','reported_usage_cost_estimate_usd'])if(!Number.isFinite(state[k])||state[k]<0)throw Error('INVALID_PRIOR_COST');
 const summary=()=>({...state});
 return {summary,
 reserve(body){const input=new TextEncoder().encode(JSON.stringify(body)).length+1024;if(body.model!=='claude-sonnet-5'||!Number.isInteger(body.max_tokens)||body.max_tokens<=0||body.max_tokens>PUBLICATION_OUTPUT_TOKEN_LIMIT||input>PUBLICATION_INPUT_TOKEN_LIMIT)throw Object.assign(Error('Request token limit'),{code:'TOKEN_LIMIT'});const amount=estimatedTokenCost(input,body.max_tokens);if(state.requests>=10||state.reserved_cost_estimate_usd+amount>5)throw Object.assign(Error('Owner task allowance exhausted'),{code:'SPEND_LIMIT'});state={...state,requests:state.requests+1,requests_with_unknown_usage:state.requests_with_unknown_usage+1,reserved_cost_estimate_usd:state.reserved_cost_estimate_usd+amount};persist(summary());return amount;},
 recordUsage(u){if(Number.isSafeInteger(u?.input_tokens)&&Number.isSafeInteger(u?.output_tokens)&&u.input_tokens>=0&&u.output_tokens>=0){state={...state,requests_with_unknown_usage:Math.max(0,state.requests_with_unknown_usage-1),reported_usage_cost_estimate_usd:state.reported_usage_cost_estimate_usd+estimatedTokenCost(u.input_tokens,u.output_tokens)};persist(summary());}}
 };
}
