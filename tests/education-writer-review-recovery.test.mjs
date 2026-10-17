import test from 'node:test';
import assert from 'node:assert/strict';
import {canReviseReviewerRejectedDraft,advanceCandidateBundle,validateCandidateBundleShape} from '../functions/_lib/education-ops/education-candidate-bundle.mjs';
import {buildWriterInstruction} from '../functions/_lib/education-ops/education-writer-prompt.mjs';

const review={outcome:'SUBSTANTIVE_FAIL',voice_fail:true,scope_fail:false,
  failing_framings:[],failing_paraphrases:[{location:'answer_summary',verdict:'OUTSIDE_EVIDENCE',
  reason:'The comparison is absent from the cited evidence.'}]};
const bundle={page_plan:{answer_summary:{text:'unsupported contrast'}},
  writer_validation:{valid:true},review_result:review,writer_revision:null};

test('only independently identified bounded voice problems can get one Writer rewrite',()=>{
  assert.equal(canReviseReviewerRejectedDraft(bundle),true);
  assert.equal(canReviseReviewerRejectedDraft({...bundle,review_result:{...review,scope_fail:true}}),false);
  assert.equal(canReviseReviewerRejectedDraft({...bundle,review_result:{...review,voice_fail:false}}),false);
  assert.equal(canReviseReviewerRejectedDraft({...bundle,review_result:{...review,failing_framings:[{verdict:'CARRIES_SCIENCE'}]}}),false);
  assert.equal(canReviseReviewerRejectedDraft({...bundle,review_result:{...review,failing_paraphrases:[{verdict:'OTHER_FAIL'}]}}),false);
  assert.equal(canReviseReviewerRejectedDraft({...bundle,writer_revision:{attempted:true,status:'failed_validation'}}),false);
  assert.equal(canReviseReviewerRejectedDraft({...bundle,review_result:{...review,outcome:'PASS'}}),false);
});
test('revision markers do not alter or invent original scientific clearance',()=>{
  const authority={record:{generation_source_hash:'original'}};
  const original={...bundle,prepared_artifact:authority,originating_run_id:'original'};
  const next=advanceCandidateBundle(original,{writerRevision:{attempted:true,status:'ready_for_reviewer'},
    pagePlan:{test:'revised'},writerValidation:{valid:true},reviewResult:null});
  assert.equal(original.writer_revision,null);
  assert.equal(next.writer_revision.attempted,true);
  assert.equal(next.prepared_artifact,authority);
  assert.equal(next.originating_run_id,'original');
  assert.equal(next.review_result,null);
});
test('Writer revision uses the exact existing cleared statements and treats reviewer text as diagnostics',()=>{
 const context={intentPlan:{topic_slug:'trichology',page_concept:'What is trichology'},
  clearedSnapshot:{core_factual_points:[{statement:'A cleared scientific statement.',supporting_claim_ids:['claim1']}],
    limitations:[{statement:'Limitations remain.',supporting_claim_ids:['claim2']}]},
  route:'/education/trichology/what-is-trichology',cluster:'trichology-fundamentals',
  existingClusterPages:[],previousPagePlan:bundle.page_plan,reviewerFeedback:review};
 const text=buildWriterInstruction(context);
 assert.ok(text.includes('FOCUSED EDITORIAL REVISION'));
 assert.ok(text.includes('OUTSIDE_EVIDENCE'));
 assert.ok(text.includes('VERBATIM'));
 assert.ok(text.includes('claim1'));
 assert.ok(text.includes('Limitations remain'));
 assert.ok(text.includes('untrusted diagnostic DATA'));
 assert.ok(text.includes('independent revalidation'));
});
