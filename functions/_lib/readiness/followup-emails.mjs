// AIMT marketing follow-ups for opt-in Head Spa Readiness participants.
// Copy is approved-concept, not a guaranteed business outcome; the
// promotion is paused until an address and campaign limits are authorized.
import {
  SITE_URL, SUPPORT_EMAIL, COLORS, renderEmail, paragraph, sectionLabel,
  button, divider, row, link, textFooter, escapeHtml,
} from '../email/aimt-email-shell.mjs';

export const FOLLOWUP_SENDER='AIMT <no-reply@auth.aimtrichology.com>';
export const FOLLOWUP_REPLY_TO='support@aimtrichology.com';
const AREAS={
  scope:{name:'professional foundation and scope',next:'Know when a service needs to change, pause, or be referred.'},
  assessment:{name:'scalp observation and assessment',next:'Make every consultation clear, consistent, and useful.'},
  service:{name:'service flow and adaptation',next:'Build services around the client, not just a fixed sequence.'},
  communication:{name:'client communication',next:'Explain your decisions in language clients understand and trust.'},
  business:{name:'business systems',next:'Build offerings that show the value of your professional knowledge.'},
};
const CTA_BASE=SITE_URL+'/readiness-enroll?utm_source=email&utm_medium=email&utm_campaign=202611_readiness_followup';
export const FOLLOWUP_STEPS=Object.freeze({
  1:{ subject:'Your AIMT Readiness Score: What comes next?',slug:'email_readiness_step1_v1' },
  2:{ subject:'Give clients more reasons to choose you',slug:'email_readiness_step2_v1' },
});
export function followupUrl(stage) {
  if(!FOLLOWUP_STEPS[stage])throw new Error('Unknown follow-up stage');
  return CTA_BASE+'&utm_content='+FOLLOWUP_STEPS[stage].slug;
}
function emailFooter(postalAddress,unsubscribeUrl) {
  const address=String(postalAddress||'').trim();
  if(address.length<12)throw new Error('Verified AIMT mailing address required before marketing email');
  const safeAddress=escapeHtml(address).replace(/\r?\n/g,'<br>');
  const safeUrl=escapeHtml(unsubscribeUrl);
  if(!/^https:\/\/aimtrichology\.com\/api\/readiness\/unsubscribe\?/.test(unsubscribeUrl))throw new Error('Valid unsubscribe link required');
  const info='You opted in to AIMT education and certification updates when completing your Head Spa Readiness Assessment.';
  return {
    html:divider({top:25})+
      paragraph(info,{top:18,size:12,color:COLORS.muted})+
      paragraph('AIMT certification information · '+safeAddress,{top:8,size:12,color:COLORS.muted})+
      paragraph(link(safeUrl,'Unsubscribe from marketing emails'),{top:12,size:12,color:COLORS.muted}),
    text:['',info,'AIMT certification information',address,'Unsubscribe: '+unsubscribeUrl].join('\n'),
  };
}
export function renderReadinessFollowup({stage,lead,unsubscribeUrl,postalAddress}) {
  if(!FOLLOWUP_STEPS[stage])throw new Error('Unknown stage');
  if(lead?.marketing_consent!==true || lead.marketing_unsubscribed_at)throw new Error('Marketing permission required');
  const first=escapeHtml(String(lead.first_name||'').trim());
  const intro=first ? 'Hi '+first+',' : 'Hello,';
  const focus=AREAS[lead.priority_pillar] || AREAS.assessment;
  const optOut=emailFooter(postalAddress,unsubscribeUrl);
  const courseUrl=followupUrl(stage);
  const headline=stage===1?'Make your next service stand out.':'Give clients more reasons to choose you.';
  const preheader=stage===1?'Your next step after the Head Spa Readiness Assessment.':'A stronger service starts with what you know.';
  let content,plain;
  if(stage===1){
    content=[
      paragraph(intro,{top:18}),
      paragraph('Your AIMT Readiness Profile pointed to <strong style="color:'+COLORS.ink+';">'+escapeHtml(focus.name)+'</strong> as your next area to strengthen.',{top:12}),
      paragraph(escapeHtml(focus.next),{top:12}),
      paragraph('AIMT Head Spa Certification helps you build the knowledge behind better consultations, intentional service planning, and clear client communication. So you can offer more value—not just another treatment.',{top:14}),
      button({label:'See Your Next Step',href:escapeHtml(courseUrl),width:260,top:22}),
      paragraph('Self-paced training · $697 once · Lifetime course access.',{top:15,size:13,color:COLORS.muted}),
      optOut.html,
    ].join('\n');
    plain=[
      intro,'','Your Readiness Profile highlighted '+focus.name+' as your next area to strengthen.',
      focus.next,'',
      'AIMT Head Spa Certification helps you build the knowledge behind better consultations, intentional service planning, and clear client communication. Offer more value—not just another treatment.','',
      'See your next step:',courseUrl,'',
      'Self-paced training. $697 once. Lifetime course access.',
    ].join('\n');
  }else{
    content=[
      paragraph(intro,{top:18}),
      paragraph('Your clients have choices. Give them a reason to choose you.',{top:12}),
      sectionLabel('What sets your service apart',{top:22}),
      paragraph('<strong style="color:'+COLORS.ink+';">Know what you are seeing. Know how to adapt. Know how to explain it.</strong>',{top:12}),
      paragraph('That is the difference between adding a head spa service and building an offering your clients understand and value.',{top:13}),
      paragraph('<strong style="color:'+COLORS.ink+';">Head Spa Certification · $697 one time · Lifetime access.</strong>',{top:18}),
      button({label:'Start My Training',href:escapeHtml(courseUrl),width:255,top:23}),
      paragraph('Certification is earned by completing the required coursework and passing the final assessment. The course does not expand your professional license.',{top:15,size:12,color:COLORS.muted}),
      optOut.html,
    ].join('\n');
    plain=[
      intro,'','Your clients have choices. Give them a reason to choose you.','',
      'Know what you are seeing. Know how to adapt. Know how to explain it.',
      'That is the difference between adding a head spa service and building an offering your clients understand and value.','',
      'Head Spa Certification. $697 one time. Lifetime access.','',
      'Start my training:',courseUrl,'',
      'Certification is earned through the required coursework and final assessment. This course does not expand your professional license.',
    ].join('\n');
  }
  const subject=FOLLOWUP_STEPS[stage].subject;
  return {
    subject,
    html:renderEmail({
      title:subject,
      preheader,
      eyebrow:'AIMT · Head Spa Education',
      headline,
      content,
    }),
    text:plain+'\n'+optOut.text+'\n\n'+textFooter(),
  };
}
