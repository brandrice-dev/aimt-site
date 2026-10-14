import {listStudentLearningGaps,markStudentGap} from '../../functions/_lib/education-ops/student-learning-gaps.mjs';
import {PUBLICATION_CONCEPTS} from '../../functions/_lib/education-ops/education-publication-registry.mjs';
import {fetchTopicEvidenceLive} from '../../functions/_lib/research/publication-readiness-loader.mjs';
import {assessTopicReadiness} from '../../functions/_lib/research/publication-readiness.mjs';
import {upsertEvidenceInsufficiencyGap,loadActiveResearchGap} from '../../functions/_lib/education-ops/education-research-gap-queue.mjs';
// Only the existing scientific readiness gate can convert a tentative student
// coverage signal into an existing publication evidence-gap assignment.
export async function triageStudentLearningGaps(env,overrides={}) {
 const io={list:listStudentLearningGaps,mark:markStudentGap,evidence:fetchTopicEvidenceLive,queue:upsertEvidenceInsufficiencyGap,active:loadActiveResearchGap,...overrides};
 const gaps=(await io.list(env)).filter(g=>g.status==='pending_review').slice(0,12);let scientific=0,educational=0,outside=0;
 for(const gap of gaps) {
  if(gap.gap_type==='outside_scope'){await io.mark(env,gap,'outside_scope');outside++;continue;}
  if(gap.gap_type!=='additional_research_needed'){await io.mark(env,gap,'educational_review');educational++;continue;}
  const concept=PUBLICATION_CONCEPTS.find(c=>c.autonomously_selectable && c.topic_slug===gap.topic) || PUBLICATION_CONCEPTS.find(c=>c.autonomously_selectable && c.controlled_topics.includes(gap.topic));
  if(!concept){await io.mark(env,gap,'scientific_review');continue;}
  const evidence=await io.evidence(env,concept.controlled_topics);
  const readiness=assessTopicReadiness({topic_slug:concept.topic_slug,seo_page_concept:concept.seo_page_concept,controlled_topics:concept.controlled_topics,...evidence});
  if(readiness.readiness_status==='NOT_READY' && readiness.risk_tier!=='HIGH') {
   const active=await io.active(env,concept.topic_slug);
   if(!active)await io.queue(env,{topicSlug:concept.topic_slug,cluster:concept.cluster,pageConcept:concept.seo_page_concept,publicIntent:concept.seo_page_concept,inScopeConcepts:concept.controlled_topics,controlledTopics:concept.controlled_topics,gapSummary:'Independent readiness check found insufficient evidence for an existing course-related topic. Student wording is not research evidence.',originatingRunId:env.GITHUB_RUN_ID || 'student-learning-triage',originatingPageIntent:null,baselineCandidateClaimIds:readiness.candidate_claim_ids});
   await io.mark(env,gap,'routed_research');scientific++;
  }else {await io.mark(env,gap,readiness.risk_tier==='HIGH'?'scientific_review':'educational_review');educational++;}
 }
 return {processed:gaps.length,scientific,educational,outside};
}
