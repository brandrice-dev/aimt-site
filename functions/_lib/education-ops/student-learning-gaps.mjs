// Bounded educational-improvement proposals on the existing operational queue.
// No student identities, messages or assessment answers. No course edits or
// scientific claims are authorized by this lane.
import {supabaseRest} from '../certification/auth.mjs';
import {GAP_TYPES} from '../cadence/learning-research.mjs';
import {CONTROLLED_TOPICS} from '../research/schema.mjs';
export async function listStudentLearningGaps(env) {
 const query=new URLSearchParams({select:'queue_id,status,enqueued_on,extras',lane:'eq.student_learning_gap',status:'in.(pending_review,educational_review,scientific_review)',order:'enqueued_on.asc,queue_id.asc',limit:'30'});
 const result=await supabaseRest(env,`research_verification_queue?${query}`);if(!result.ok)throw Error('LEARNING_GAPS_UNAVAILABLE');
 return (result.body || []).filter(r=>r.extras?.contract_version==='student-learning-gap-v1' && r.extras.course_slug==='headspa-mastery' && /^(?:[0-9]|1[01])$/.test(String(r.extras.module_id)) && CONTROLLED_TOPICS.includes(r.extras.topic) && GAP_TYPES.includes(r.extras.gap_type)).map(r=>({gap_id:r.queue_id,status:r.status,requested_at:r.enqueued_on,course_slug:'headspa-mastery',module_id:String(r.extras.module_id),topic:r.extras.topic,gap_type:r.extras.gap_type,retrieval_state:['available','no_eligible_evidence'].includes(r.extras.retrieval_state)?r.extras.retrieval_state:'unknown'}));
}
export async function markStudentGap(env,gap,status) {
 const qs=new URLSearchParams({queue_id:`eq.${gap.gap_id}`,lane:'eq.student_learning_gap',status:'eq.pending_review'});
 const result=await supabaseRest(env,`research_verification_queue?${qs}`,{method:'PATCH',body:JSON.stringify({status})});
 if(!result.ok)throw Error('LEARNING_GAP_UPDATE_FAILED');
}
