// AIMT Scope Finder — selected primary-source guidance, not legal advice.
// IMPORTANT: "Head spa" is not treated as one licensed service. Each finding
// applies only to the activity and credential named, not to the entire visit.
// Every source was inspected against a state agency or current legislative site
// on 2026-11-12. Independent regulatory review is required before public launch.
// States without verified evidence are NOT mapped or presumed permissive.
export const SCOPE_REVIEW_DATE='2026-11-12';

export const SCOPE_FINDINGS=Object.freeze({
  documented_exemption:{
    heading:'Specific activity is exempt from individual licensing',
    explanation:'The cited agency specifically describes this activity as not requiring an individual license. Other steps, facility rules and local requirements may still apply.'
  },
  credential_scope:{
    heading:'Activity is listed in this license’s scope',
    explanation:'The cited agency includes this activity for the selected credential. Confirm the exact technique, facility rules and limitations before providing it.'
  },
  outside_credential:{
    heading:'Not included in this license’s scope',
    explanation:'The cited agency specifically excludes this activity for the selected credential. A separate qualifying credential or practitioner may be needed.'
  },
  licensed_role_required:{
    heading:'Agency identifies a required professional license',
    explanation:'The cited agency requires a designated credential for this activity. An exemption for another step does not cover this one.'
  },
  unresolved:{
    heading:'Further verification required',
    explanation:'No specific finding has been cleared for this activity, license and jurisdiction. Do not assume permission or prohibition.'
  }
});

const link=(id,title,url,detail='',date='')=>({id,title,url,detail,date});
const finding=(activity,license,status,summary,sourceIds,limits='')=>({
  activity,license,status,summary,sourceIds,limits
});
const ALL='*';
const NO_LICENSE=['No professional license','Student / not yet licensed'];

export const SCOPE_EVIDENCE=Object.freeze({
  'California':{
    authority:'California Board of Barbering and Cosmetology',
    coverage:'Focused agency head-spa guidance for specific roles. Other activities and establishment rules require separate confirmation.',
    sources:[
      link('ca-bulletin','Industry Bulletin — Head Spas (11/1/2024)','https://barbercosmo.ca.gov/forms_pubs/headspas.pdf','Board bulletin, questions 3–5','2024-11-01'),
      link('ca-bulletins','Board industry bulletins','https://barbercosmo.ca.gov/forms_pubs/publications/bulletins.shtml')
    ],
    findings:[
      finding('wash','Esthetician','outside_credential',
        'California’s head-spa bulletin says estheticians are not licensed to shampoo or wash hair.','ca-bulletin'.split(','),'The bulletin identifies barbers, cosmetologists and hairstylists for this step.'),
      finding('styling','Esthetician','outside_credential',
        'California’s head-spa bulletin says estheticians cannot provide blow-drying services.',['ca-bulletin'],'The client may blow-dry their own hair; that does not authorize the esthetician to shampoo it.'),
      finding('wash','Cosmetologist','credential_scope','The head-spa bulletin identifies licensed cosmetologists as professionals who may shampoo hair.',['ca-bulletin']),
      finding('wash','Barber','credential_scope','The head-spa bulletin identifies licensed barbers as professionals who may shampoo hair.',['ca-bulletin']),
      finding('styling','Cosmetologist','credential_scope','The head-spa bulletin identifies licensed cosmetologists as professionals who may blow-dry hair.',['ca-bulletin']),
      finding('styling','Barber','credential_scope','The head-spa bulletin identifies licensed barbers as professionals who may blow-dry hair.',['ca-bulletin']),
      ...NO_LICENSE.flatMap(license=>[
        finding('wash',license,'licensed_role_required','The board says shampooing in a head spa must be provided by a licensed barber, cosmetologist or hairstylist.',['ca-bulletin']),
        finding('styling',license,'licensed_role_required','The board says blow-drying in a head spa must be provided by a licensed barber, cosmetologist or hairstylist.',['ca-bulletin'])
      ])
    ],
    facility:'The head-spa bulletin covers individual scope but is not a comprehensive facility/permit guide. Confirm establishment license, sanitation, water-system rules and the actual work setting.',
    nextContact:'Contact the Board for the applicable written regulations; if a disputed activity is not expressly covered, request qualified regulatory/legal review.'
  },
  'Texas':{
    authority:'Texas Department of Licensing and Regulation (TDLR)',
    coverage:'Individual license scope and an explicit shampoo/conditioning exemption; business establishment requirements must also be checked.',
    sources:[
      link('tx-who','TDLR — Who Regulates What?','https://www.tdlr.texas.gov/barbering-and-cosmetology/who-regulates-what.htm','See Shampooing and Conditioning; Massage; Cleansing Treatments'),
      link('tx-esthetician','TDLR — Esthetician Scope','https://www.tdlr.texas.gov/barbering-and-cosmetology/scope-of-practice/estheticians.htm','See allowed scalp work and excluded hair services'),
      link('tx-operator','TDLR — Cosmetology Operator Scope','https://www.tdlr.texas.gov/barbering-and-cosmetology/scope-of-practice/operators.htm'),
      link('tx-barber','TDLR — Class A Barber Scope','https://www.tdlr.texas.gov/barbering-and-cosmetology/scope-of-practice/barbers.htm'),
      link('tx-facility','TDLR — Barbering & Cosmetology Inspections Guide','https://www.tdlr.texas.gov/barbering-and-cosmetology/inspections-guide/','Licensed establishment, sanitation and equipment rules')
    ],
    findings:[
      finding('wash',ALL,'documented_exemption','TDLR states that shampooing and conditioning hair do not require an individual license in Texas.',['tx-who'],'This does not exempt scalp treatments, hair styling or a regulated establishment.'),
      finding('styling','Esthetician','outside_credential','TDLR’s esthetician guide excludes regulated hair services, including styling.',['tx-esthetician'],'Standalone unregulated shampooing/conditioning is a separate exception.'),
      finding('scalp-massage','Esthetician','credential_scope','TDLR explicitly lists scalp massage within the esthetician scope.',['tx-esthetician'],'Within the cosmetic professional scope and appropriately licensed establishment.'),
      finding('scalp-massage','Cosmetologist','credential_scope','TDLR explicitly lists scalp massage within the cosmetology operator scope.',['tx-operator']),
      finding('scalp-massage','Barber','credential_scope','TDLR explicitly lists scalp massage for Class A barbers.',['tx-barber']),
      finding('styling','Cosmetologist','credential_scope','TDLR includes styling hair in a cosmetology operator’s scope.',['tx-operator']),
      finding('styling','Barber','credential_scope','TDLR includes styling hair in a Class A barber’s scope.',['tx-barber']),
      ...NO_LICENSE.flatMap(license=>[
        finding('styling',license,'licensed_role_required','TDLR treats regulated hair styling as a service requiring an appropriate professional license.',['tx-operator','tx-who'],'The shampoo-only exception does not confer permission for hair styling.'),
        finding('scalp-massage',license,'licensed_role_required','TDLR identifies professional licenses for regulated scalp massage services.',['tx-who'],'Medical, therapy and other-law exceptions require their own separate review.')
      ])
    ],
    facility:'TDLR’s inspections guidance sets establishment and sanitation requirements for regulated barbering/cosmetology practice. An individual shampoo exemption is not an automatic facility exemption.',
    nextContact:'Review your exact license scope, then verify facility license and inspection obligations with TDLR before offering combined services.'
  },
  'Tennessee':{
    authority:'Tennessee State Board of Cosmetology and Barber Examiners / Commerce & Insurance',
    coverage:'Official head-spa FAQ addresses shampoo-only deregulation, styling restrictions and aesthetician scalp massage.',
    sources:[
      link('tn-faq','Tennessee — Shampoo and Head Spa FAQ','https://support.commerce.tn.gov/hc/en-us/articles/29894088035987-Shampoo-and-Head-Spa','Official FAQ; last updated September 23, 2026','2026-09-23'),
      link('tn-licenses','Tennessee — Individual Licensing','https://www.tn.gov/commerce/regboards/cosmo/license/individual.html'),
      link('tn-rules','Tennessee — Cosmetology Rules','https://publications.tnsosfiles.com/rules/0440/0440.htm')
    ],
    findings:[
      finding('wash',ALL,'documented_exemption','Tennessee says shampooing has been deregulated and does not require a shampooing license.',['tn-faq'],'The FAQ distinguishes shampoo-only from blow-drying, curling and styling tools.'),
      finding('scalp-massage','Esthetician','credential_scope','The Tennessee FAQ states licensed aestheticians may massage the scalp, hands and feet.',['tn-faq'],'Aesthetician scalp massage does not imply hair styling is permitted.'),
      ...NO_LICENSE.flatMap(license=>[
        finding('styling',license,'licensed_role_required','The Tennessee FAQ says blow-drying, curling and styling tools require a cosmetologist or master barber license.',['tn-faq'])
      ]),
      finding('styling','Esthetician','outside_credential','The Tennessee FAQ says blow-drying and curling/styling tools require a cosmetologist or master barber license.',['tn-faq']),
      finding('styling','Cosmetologist','credential_scope','Tennessee’s FAQ identifies cosmetologists among licensed professionals for blow-drying and styling tools.',['tn-faq']),
      finding('styling','Barber','unresolved','The FAQ specifies MASTER barbers; the generic “Barber” selection does not establish that credential level.',['tn-faq'],'Confirm that you hold the required license subtype.')
    ],
    facility:'Shampooing being deregulated does not establish zoning, sanitation, establishment, insurance or local approval for a full head spa. Confirm these separately.',
    nextContact:'Use the board’s individual-license and rule links for credential-specific detail. Specify whether a barber credential is a master barber license.'
  },
  'Florida':{
    authority:'Florida Department of Business and Professional Regulation (DBPR)',
    coverage:'Official DBPR FAQ and unlicensed-activity guide describe shampoo-only exemption and limits of other hair services.',
    sources:[
      link('fl-faq','Florida DBPR — Cosmetology FAQs','https://www2.myfloridalicense.com/cosmetology/faqs/','See SCOPE OF WORK — shampooing'),
      link('fl-required','Florida DBPR — What Requires a License','https://ula.myfloridalicense.com/what-requires-a-license/','See Cosmetology Services'),
    ],
    findings:[
      finding('wash',ALL,'documented_exemption','Florida DBPR says hair shampooing alone does not require an individual license.',['fl-faq','fl-required'],'The exemption does not include chemical rinsing, blow-drying, styling or a broader scalp service.'),
      ...NO_LICENSE.flatMap(license=>[
        finding('styling',license,'licensed_role_required','Florida DBPR says blow-drying and styling hair for compensation require an appropriate cosmetology license.',['fl-faq','fl-required'])
      ]),
      finding('styling','Cosmetologist','credential_scope','Florida DBPR identifies cosmetology licensing for paid hair drying and styling.',['fl-faq','fl-required']),
      finding('styling','Esthetician','outside_credential','DBPR says blow-drying and styling hair require cosmetology licensure rather than an esthetics-only credential.',['fl-faq','fl-required'])
    ],
    facility:'The shampoo-only individual exemption does not settle every establishment, water, sanitation or local business requirement. DBPR separates services with different workplace rules.',
    nextContact:'Confirm the precise service scope and whether a salon license is required for your combination of activities.'
  },
  'Pennsylvania':{
    authority:'Pennsylvania State Board of Cosmetology / Department of State',
    coverage:'Official statute and board guidance describe professional scope and salon licensing; no blanket head-spa exemption has been established in this research.',
    sources:[
      link('pa-law','Pennsylvania Cosmetology Law — Definitions (§1)','https://www.palegis.us/statutes/unconsolidated/law-information/view-statute?act=86&chpt=0&iFrame=true&sctn=1&sessInd=0&smthLwInd=0&subsctn=0&txtType=HTM&yr=1933','Scalp, hair and esthetics definitions'),
      link('pa-cosmo','PA — Cosmetology Licensure Guide','https://www.pa.gov/agencies/dos/resources/professional-licensing-resources/licensure-processing-guides-and-timelines/cosmetology-guide','For compensation scope description'),
      link('pa-board','PA — State Board of Cosmetology','https://www.pa.gov/agencies/dos/department-and-offices/bpoa/boards-commissions/cosmetology','Board does not provide advisory legal opinions'),
      link('pa-salon','PA — Salon Licensure Procedure','https://www.pa.gov/agencies/dos/department-and-offices/bpoa/boards-commissions/cosmetology/application-process','Inspection and licensing of salons')
    ],
    findings:[
      finding('wash','Cosmetologist','credential_scope','Pennsylvania’s cosmetology definition includes cleansing and other work on the hair.',['pa-law','pa-cosmo'],'Practice location and individual credential rules must also be satisfied.'),
      finding('scalp-massage','Cosmetologist','credential_scope','Pennsylvania’s cosmetology statute includes scalp massage and related cosmetic services.',['pa-law'],'This does not authorize medical diagnosis or unrestricted bodywork.'),
      finding('styling','Cosmetologist','credential_scope','Pennsylvania’s cosmetology statute and board guide include arranging and styling human hair.',['pa-law','pa-cosmo'])
    ],
    facility:'PA states that salons must be licensed and pass inspection before opening. The specific category of salon for the planned mix of services needs verification.',
    nextContact:'PA board staff and counsel say they cannot issue advisory legal opinions. Review the statute and regulations; for an ambiguous license/scope question, consult a Pennsylvania attorney familiar with professional licensing.'
  },
  'New York':{
    authority:'New York Department of State — Appearance Enhancement',
    coverage:'An official multi-license service-determination chart is available, but no activity-level interpretations are approved in this version.',
    sources:[
      link('ny-chart','NY DOS — Appearance Enhancement Service Determinations (March 2025)','https://dos.ny.gov/system/files/documents/2025/03/ae-licensees-procedural-service-determinations_03.2025.pdf','Review the individual license/service intersection','2025-03')
    ],
    findings:[],
    facility:'The official service-determination chart does not replace a review of specific facility licenses, supervision, devices and local rules.',
    nextContact:'Use the DOS license chart and relevant written law; if a row or service is not clear, seek current written authority before providing it.'
  }
});

export function evidenceFor(state,license,activities=[]){
  const record=SCOPE_EVIDENCE[state]||null;
  const selected=Array.isArray(activities)?activities:[];
  const byActivity=selected.map(activity=>{
    const found=record?.findings?.find(f=>f.activity===activity && f.license===license)||
      record?.findings?.find(f=>f.activity===activity && f.license===ALL)||null;
    const sourceIds=Array.isArray(found?.sourceIds)?found.sourceIds:[];
    return {
      activity,status:found?.status||'unresolved',
      heading:SCOPE_FINDINGS[found?.status||'unresolved'].heading,
      generalExplanation:SCOPE_FINDINGS[found?.status||'unresolved'].explanation,
      summary:found?.summary||(record?'Current curated sources do not settle this specific activity for the selected credential.':'This jurisdiction has not yet been researched for this activity.'),
      limits:found?.limits||'Further licensing, facility, technique and local-rule verification may be required.',
      sources:record?.sources?.filter(s=>sourceIds.includes(s.id))||[]
    };
  });
  return {
    state,license,authority:record?.authority||'Relevant state licensing authority not yet mapped',
    researchStatus:record?'PRIMARY SOURCES LOCATED — SELECTED ACTIVITY NOTES':'NOT YET RESEARCHED — NO SCOPE FINDINGS',
    researchDate:record?SCOPE_REVIEW_DATE:null,
    coverage:record?.coverage||'AIMT has not researched this state yet. The absence of a finding is not a statement of permission or prohibition.',
    sources:record?.sources||[],
    facility:record?.facility||'Establishment, local permits, insurance and sanitation obligations have not been researched for this state.',
    nextContact:record?.nextContact||'Find your official state cosmetology/barbering board, read the current statute and regulations, and consult a qualified licensing professional for disputed activities.',
    findings:byActivity
  };
}
