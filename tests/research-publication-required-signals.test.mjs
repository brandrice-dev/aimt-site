import test from 'node:test';
import assert from 'node:assert/strict';
import {runSynthesisPipeline} from '../functions/_lib/research/publication-synthesis-orchestrator.mjs';
import {mergeRequiredSignalRepair} from '../functions/_lib/research/publication-synthesis-reconciliation.mjs';
import {buildSynthesisRequest, BOUNDED_SYNTHESIS_OUTPUT_INSTRUCTION, REQUIRED_SIGNAL_REPAIR_SCHEMA} from '../functions/_lib/research/publication-synthesis-client.mjs';

const required='POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS';
function fixture(){
  const claims=[
    {claim_id:'support',claim_text:'Study A observed a favorable association.',source_id:'s1',claim_type:'finding',direction:'supports_effect',verification_status:'CLAIM_VERIFIED',use_status:'active'},
    {claim_id:'opposing',claim_text:'Study B observed no effect in another population.',source_id:'s2',claim_type:'finding',direction:'no_effect',verification_status:'CLAIM_VERIFIED',use_status:'active'},
    {claim_id:'limit',claim_text:'These findings do not establish a causal mechanism.',source_id:'s1',claim_type:'limitation',direction:'descriptive',verification_status:'CLAIM_VERIFIED',use_status:'active'}
  ];
  const sources=['s1','s2'].map(id=>({source_id:id,title:'Scientific evidence '+id,authors:['Study Author'],year:2025,doi:'10.1/'+id,source_venue:'Study Journal'}));
  const packet={controlled_topics:['hair-cycle'],candidate_claim_ids:claims.map(c=>c.claim_id),candidate_source_ids:['s1','s2'],
    supports_effect_claim_ids:['support'],no_effect_claim_ids:['opposing'],safety_claim_ids:[],synthesis_required_flags:[required]};
  const output={topic_slug:'hair-cycle',page_concept:'The Hair Growth Cycle',recommended_disposition:'AUTO_READY',confidence:'medium',
    page_scope:{include:['Hair cycles'],exclude:['Treatments']},
    selected_claims:claims.map(c=>({claim_id:c.claim_id,role:c.claim_type==='limitation'?'limitation':'supporting_context',reason:'Relevant study-grounded finding with suitable scope.'})),
    excluded_claims:[],resolved_synthesis_signals:[],unresolved_issues:[],
    human_review_justification:{reason_code:'NOT_APPLICABLE',reason:'Not applicable',related_claim_ids:[]},
    public_framing:{core_points:[{statement:'Findings differ between populations.',supporting_claim_ids:['support','opposing']}],
      limitations:[{statement:'Neither finding establishes causation.',supporting_claim_ids:['limit']}],scope_note:'Informational only.'}};
  return {topic_slug:'hair-cycle',v1Result:{topic_slug:'hair-cycle',risk_tier:'LOWER',readiness_status:'NEEDS_SYNTHESIS',evidence_gaps:[],synthesis_packet:packet},
    evidenceBundle:{claims,sources},output};
}
const modelResult=output=>({ok:true,output,modelInfo:{modelName:'claude-sonnet-5'},usage:{input_tokens:200,output_tokens:120},diagnostics:{attempts:1}});
const noConcern=()=>({resolved_synthesis_signals:[{signal:required,
    resolution:'The results involve distinct study populations and endpoints; neither can establish causation or clinical consensus.',
    claim_ids:['support','opposing']}],
  requires_human_review:false,concern_reason_code:'NOT_APPLICABLE',concern_reason:'Not applicable',related_claim_ids:[]});

test('the exact evidence risk flag reaches synthesis, with a bounded per-claim response instruction',()=>{
  const f=fixture(),seen=[];
  const request=buildSynthesisRequest({}, {topic_slug:f.topic_slug,evidenceBundle:f.evidenceBundle,pageIntent:{
    page_concept:'The Hair Growth Cycle',public_intent:'Professional learning',in_scope_concepts:['Hair cycles'],out_of_scope_concepts:['Treatment']},
    synthesisRequiredFlags:[required]});
  const body=JSON.parse(request.userContent);
  assert.deepEqual(body.synthesis_required_flags,[required]);
  assert.ok(request.system.includes(BOUNDED_SYNTHESIS_OUTPUT_INSTRUCTION));
  assert.match(request.system,/Every supplied claim still needs exactly one/);
  assert.match(request.system,/HUMAN_REVIEW/);
  assert.ok(REQUIRED_SIGNAL_REPAIR_SCHEMA.properties.requires_human_review);
});

test('only-missing-signals repair uses two bounded calls, preserves every disposition and revalidates all evidence',async()=>{
  const f=fixture(),seen=[];
  const original=structuredClone(f.output);
  const result=await runSynthesisPipeline({}, {...f, fns:{
    synthesizeFn:async(_env,args)=>{seen.push('synthesis');assert.deepEqual(args.synthesisRequiredFlags,[required]);return modelResult(f.output)},
    signalFn:async(_env,args)=>{seen.push('signal');assert.deepEqual(args.synthesisRequiredFlags,[required]);return modelResult(noConcern())},
  }});
  assert.equal(result.status,'AUTO_READY',JSON.stringify(result.violations));
  assert.equal(result.stage,'required_signal_reconciliation');
  assert.deepEqual(seen,['synthesis','signal']);
  assert.equal(result.metrics.model_calls,2);
  assert.equal(result.finalOutput.resolved_synthesis_signals.length,1);
  assert.deepEqual(result.finalOutput.selected_claims,original.selected_claims);
  assert.deepEqual(result.finalOutput.public_framing,original.public_framing);
  assert.deepEqual(f.output,original);
});

test('genuinely unresolved conflict is routed to human review, never silently made publishable',async()=>{
  const f=fixture();
  const proposal={...noConcern(),requires_human_review:true,
    concern_reason_code:'UNRESOLVED_CONTRADICTION',
    concern_reason:'The same clinical question remains unresolved and cannot safely support an unqualified practitioner-facing claim.',
    related_claim_ids:['support','opposing']};
  const result=await runSynthesisPipeline({}, {...f, fns:{
    synthesizeFn:async()=>modelResult(f.output),
    signalFn:async()=>modelResult(proposal)
  }});
  assert.equal(result.status,'HUMAN_REVIEW');
  assert.equal(result.finalOutput.recommended_disposition,'HUMAN_REVIEW');
  assert.equal(result.finalOutput.human_review_justification.reason_code,'UNRESOLVED_CONTRADICTION');
  assert.deepEqual(result.finalOutput.selected_claims,f.output.selected_claims);
});

test('fabricated references and one-sided conflict inspections fail closed',async()=>{
  const f=fixture();
  for(const bad of [
    {...noConcern(),resolved_synthesis_signals:[{...noConcern().resolved_synthesis_signals[0],claim_ids:['support','fabricated']}]},
    {...noConcern(),resolved_synthesis_signals:[{...noConcern().resolved_synthesis_signals[0],claim_ids:['support']}]},
    {...noConcern(),resolved_synthesis_signals:[]},
    {...noConcern(),resolved_synthesis_signals:[{...noConcern().resolved_synthesis_signals[0],signal:'not-the-required-flag'}]}
  ]){
    assert.throws(()=>mergeRequiredSignalRepair(f.output,bad,[required],f.evidenceBundle,f.v1Result.synthesis_packet),/INVALID_REQUIRED_SIGNAL_REPAIR/);
    const result=await runSynthesisPipeline({}, {...f, fns:{
      synthesizeFn:async()=>modelResult(f.output),
      signalFn:async()=>modelResult(bad)
    }});
    assert.equal(result.status,'SYNTHESIS_FAILED');
    assert.equal(result.reason,'invalid_required_signal_repair');
  }
});

test('a missing signal mixed with any other validator failure cannot bypass the original rules',async()=>{
  const f=fixture();f.output.selected_claims=f.output.selected_claims.filter(c=>c.claim_id!=='limit');
  let repaired=false;
  const result=await runSynthesisPipeline({}, {...f,fns:{
    synthesizeFn:async()=>modelResult(f.output),
    signalFn:async()=>{repaired=true;return modelResult(noConcern())}
  }});
  assert.equal(repaired,false);
  assert.equal(result.status,'SYNTHESIS_FAILED');
});

test('a failed or unaffordable signal call is not a synthetic success',async()=>{
  const f=fixture();
  const result=await runSynthesisPipeline({}, {...f,fns:{
    synthesizeFn:async()=>modelResult(f.output),
    signalFn:async()=>({ok:false,reason:'budget_exceeded',diagnostics:{code:'SPEND_LIMIT',attempts:0}})
  }});
  assert.equal(result.status,'SYNTHESIS_FAILED');
  assert.equal(result.reason,'budget_exceeded');
  assert.equal(result.metrics.model_calls,1);
  assert.deepEqual(result.violations,['SYNTHESIS_SIGNAL_NOT_ADDRESSED']);
});
