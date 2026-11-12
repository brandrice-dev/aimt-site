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
  conditional_exemption:{heading:'Narrow exception with required supervision',explanation:'A specific activity may be exempt only under described work-setting and supervision conditions. Not permission to operate a whole head spa.'},
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
    licenseLookup:{title:'California DCA License Search',url:'https://search.dca.ca.gov/'}, 
    coverage:'Focused agency head-spa guidance for specific roles. Other activities and establishment rules require separate confirmation.',
    sources:[
      link('ca-bulletin','Industry Bulletin — Head Spas (11/1/2024)','https://barbercosmo.ca.gov/forms_pubs/headspas.pdf','Board bulletin, questions 3–5','2024-11-01'),
      link('ca-bulletins','Board industry bulletins','https://barbercosmo.ca.gov/forms_pubs/publications/bulletins.shtml'),
      link('ca-faq','CA Board FAQ — Establishment Owners','https://barbercosmo.ca.gov/forms_pubs/publications/faqs.shtml'),
      link('ca-2025','CA Board 2025 newsletter — Hairstylists and Head Spas','https://barbercosmo.ca.gov/forms_pubs/publications/newsletter_2025_issue_9.pdf','Pages 5 and 8','2025')
    ],
    findings:[
      finding('wash','Esthetician','outside_credential',
        'California’s head-spa bulletin says estheticians are not licensed to shampoo or wash hair.','ca-bulletin'.split(','),'The bulletin identifies barbers, cosmetologists and hairstylists for this step.'),
      finding('scalp','Esthetician','credential_scope','TDLR explicitly includes cosmetic scalp cleansing treatments in the esthetician scope.',['tx-esthetician'],'This is not equivalent to regulated cleansing or styling of hair.'),
      finding('scalp','Cosmetologist','credential_scope','TDLR identifies scalp cleansing among cosmetology operator services.',['tx-operator']),
      finding('scalp','Cosmetology Operator','credential_scope','TDLR identifies scalp cleansing among cosmetology operator services.',['tx-operator']),
      finding('scalp','Class A Barber','credential_scope','TDLR identifies scalp cleansing among Class A barber services.',['tx-barber']),
      finding('styling','Esthetician','outside_credential',
        'California’s head-spa bulletin says estheticians cannot provide blow-drying services.',['ca-bulletin'],'The client may blow-dry their own hair; that does not authorize the esthetician to shampoo it.'),
      finding('scalp','Esthetician','credential_scope','California board guidance identifies non-medical scalp cleansing and exfoliation among esthetician scalp treatments.',['ca-2025','ca-bulletin'],'This does not include shampooing or washing hair; exact products and techniques require separate scope review.'),
      finding('scalp-massage','Esthetician','credential_scope','CA Board 2025 head-spa guidance describes cosmetic scalp massage among esthetician practices.',['ca-2025'],'Not medical/therapeutic bodywork and not an exemption for hair services.'),
      finding('wash','Hairstylist','credential_scope','California licensed hairstylists may shampoo hair, excluding prescription shampoo.',['ca-bulletin','ca-2025'],'This credential differs from esthetics and excludes chemical hair services.'),
      finding('styling','Hairstylist','credential_scope','California hairstylist scope includes blow-drying and nonchemical styling.',['ca-2025','ca-bulletin'],'Chemical hair services remain outside a hairstylist license.'),
      finding('wash','Cosmetologist','credential_scope','The head-spa bulletin identifies licensed cosmetologists as professionals who may shampoo hair.',['ca-bulletin']),
      finding('wash','Barber','credential_scope','The head-spa bulletin identifies licensed barbers as professionals who may shampoo hair.',['ca-bulletin']),
      finding('scalp-massage','Facial Specialist','credential_scope','DBPR states a facial specialist may massage the head, face, scalp and neck in a cosmetic context.',['fl-faq','fl-types','fl-facial'],'Does not confer regulated hair styling or general therapeutic massage; salon and technique rules still apply.'),
      finding('scalp-massage','Full Specialist','credential_scope','DBPR lists full specialists as eligible to provide designated cosmetic scalp/head massage.',['fl-faq','fl-types'],'A Full Specialist is not a full Cosmetologist license for hair services.'),
      finding('scalp-massage','Cosmetologist','credential_scope','DBPR states cosmetologists may provide cosmetic scalp and head massage.',['fl-faq'],'Not a general medical or therapeutic massage license.'),
      finding('scalp','Facial Specialist','credential_scope','Florida defines a Facial Specialist as registered to provide cosmetic treatment of the face or scalp using oils, creams and similar preparations.',['fl-types','fl-facial'],'Specific technique and product must fit the registration; hair shampooing and hair styling are separate activities.'),
      finding('scalp','Full Specialist','credential_scope','Florida Full Specialist registration includes Facial Specialist cosmetic scalp treatments.',['fl-types'],'Exact preparation and nonmedical scope should be verified.'),
      finding('scalp','Cosmetologist','credential_scope','Florida DBPR includes nonmedical mechanical or chemical treatment of head and scalp in Cosmetology.',['fl-types'],'Specific technique, facility and medical limits still apply.'),
      finding('styling','Cosmetologist','credential_scope','The head-spa bulletin identifies licensed cosmetologists as professionals who may blow-dry hair.',['ca-bulletin']),
      finding('styling','Barber','credential_scope','The head-spa bulletin identifies licensed barbers as professionals who may blow-dry hair.',['ca-bulletin']),
      ...NO_LICENSE.flatMap(license=>[
        finding('wash',license,'licensed_role_required','The board says shampooing in a head spa must be provided by a licensed barber, cosmetologist or hairstylist.',['ca-bulletin']),
        finding('styling',license,'licensed_role_required','The board says blow-drying in a head spa must be provided by a licensed barber, cosmetologist or hairstylist.',['ca-bulletin'])
      ])
    ],
    facility:'The California Board FAQ says an establishment license applies to regulated shop, salon and spa premises; a booth renter does not automatically need a second establishment license at the same address. Verify the actual owner, premises, sanitation, water system and local requirements. See CA Establishment Owners FAQ.',
    nextContact:'Contact the Board for the applicable written regulations; if a disputed activity is not expressly covered, request qualified regulatory/legal review.'
  },
  'Texas':{
    authority:'Texas Department of Licensing and Regulation (TDLR)',
    licenseLookup:{title:'TDLR Public License Search',url:'https://www.tdlr.texas.gov/verify.htm'}, 
    coverage:'Individual license scope and an explicit shampoo/conditioning exemption; business establishment requirements must also be checked.',
    sources:[
      link('tx-who','TDLR — Who Regulates What?','https://www.tdlr.texas.gov/barbering-and-cosmetology/who-regulates-what.htm','See Shampooing and Conditioning; Massage; Cleansing Treatments'),
      link('tx-esthetician','TDLR — Esthetician Scope','https://www.tdlr.texas.gov/barbering-and-cosmetology/scope-of-practice/estheticians.htm','See allowed scalp work and excluded hair services'),
      link('tx-operator','TDLR — Cosmetology Operator Scope','https://www.tdlr.texas.gov/barbering-and-cosmetology/scope-of-practice/operators.htm'),
      link('tx-barber','TDLR — Class A Barber Scope','https://www.tdlr.texas.gov/barbering-and-cosmetology/scope-of-practice/barbers.htm'),
      link('tx-facility','TDLR — Barbering & Cosmetology Inspections Guide','https://www.tdlr.texas.gov/barbering-and-cosmetology/inspections-guide/','Licensed establishment, sanitation and equipment rules'),
      link('tx-establish','TDLR — Establishment License Applications','https://www.tdlr.texas.gov/barbering-and-cosmetology/establishments/apply.htm','Business and rented-space rules'),
      link('tx-mobile','TDLR — Mobile Establishment Requirements','https://www.tdlr.texas.gov/barbering-and-cosmetology/establishments/apply-mobile-establishment.htm')
    ],
    findings:[
      finding('wash',ALL,'documented_exemption','TDLR states that shampooing and conditioning hair do not require an individual license in Texas.',['tx-who'],'This does not exempt scalp treatments, hair styling or a regulated establishment.'),
      finding('styling','Esthetician','outside_credential','TDLR’s esthetician guide excludes regulated hair services, including styling.',['tx-esthetician'],'Standalone unregulated shampooing/conditioning is a separate exception.'),
      finding('scalp-massage','Esthetician','credential_scope','TDLR explicitly lists scalp massage within the esthetician scope.',['tx-esthetician'],'Within the cosmetic professional scope and appropriately licensed establishment.'),
      finding('scalp-massage','Cosmetologist','credential_scope','TDLR explicitly lists scalp massage within the cosmetology operator scope.',['tx-operator']),
      finding('scalp-massage','Class A Barber','credential_scope','TDLR explicitly lists scalp massage for Class A barbers.',['tx-barber']),
      finding('styling','Cosmetologist','credential_scope','TDLR includes styling hair in a cosmetology operator’s scope.',['tx-operator']),
      finding('styling','Class A Barber','credential_scope','TDLR includes styling hair in a Class A barber’s scope.',['tx-barber']),
      finding('styling','Cosmetology Operator','credential_scope','TDLR includes hair styling in the operator scope.',['tx-operator']),
      finding('scalp-massage','Cosmetology Operator','credential_scope','TDLR explicitly includes scalp massage in the operator scope.',['tx-operator']),
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
    licenseLookup:{title:'Tennessee Verify Public Search',url:'https://www.tn.gov/commerce/regboards/cosmo/help-support.html'}, 
    coverage:'Official head-spa FAQ addresses shampoo-only deregulation, styling restrictions and aesthetician scalp massage.',
    sources:[
      link('tn-faq','Tennessee — Shampoo and Head Spa FAQ','https://support.commerce.tn.gov/hc/en-us/articles/29894088035987-Shampoo-and-Head-Spa','Official FAQ; last updated September 23, 2026','2026-09-23'),
      link('tn-licenses','Tennessee — Individual Licensing','https://www.tn.gov/commerce/regboards/cosmo/license/individual.html'),
      link('tn-rules','Tennessee — Cosmetology Rules','https://publications.tnsosfiles.com/rules/0440/0440.htm'),
      link('tn-shop','TN Board — Shop Applicant Requirements','https://www.tn.gov/commerce/regboards/cosmo/license/shop-school/info.html','Shop license, inspection and sanitation requirements'),
      link('tn-master','TN Board — Master Barber','https://www.tn.gov/commerce/regboards/cosmo/license/individual/master-barber.html','Exact master barber scope')
    ],
    findings:[
      finding('wash',ALL,'documented_exemption','Tennessee says shampooing has been deregulated and does not require a shampooing license.',['tn-faq'],'The FAQ distinguishes shampoo-only from blow-drying, curling and styling tools.'),
      finding('scalp-massage','Esthetician','credential_scope','The Tennessee FAQ states licensed aestheticians may massage the scalp, hands and feet.',['tn-faq'],'Aesthetician scalp massage does not imply hair styling is permitted.'),
      ...NO_LICENSE.flatMap(license=>[
        finding('styling',license,'licensed_role_required','The Tennessee FAQ says blow-drying, curling and styling tools require a cosmetologist or master barber license.',['tn-faq'])
      ]),
      finding('styling','Esthetician','outside_credential','The Tennessee FAQ says blow-drying and curling/styling tools require a cosmetologist or master barber license.',['tn-faq']),
      finding('styling','Cosmetologist','credential_scope','Tennessee’s FAQ identifies cosmetologists among licensed professionals for blow-drying and styling tools.',['tn-faq']),
      finding('styling','Master Barber','credential_scope','TN head spa FAQ identifies licensed master barbers among providers permitted to blow-dry and style hair.',['tn-faq','tn-master'],'A generic Barber title does not establish Master Barber status.'),
      finding('scalp-massage','Master Barber','credential_scope','TN Board Master Barber description includes scalp massage in barber scope.',['tn-master'],'Medical/therapeutic bodywork remains separate.'),
      finding('styling','Barber','unresolved','The FAQ specifies MASTER barbers; generic Barber does not establish that license level.',['tn-faq'],'Confirm exact credential subtype.')
    ],
    facility:'Tennessee requires a shop license and inspection for regulated cosmetology and aesthetics services. Shop type, qualified manager and sanitation depend on services; a shampoo-only exception cannot clear a full head spa or its premises. See Tennessee Shop Applicant Requirements and check local utilities, codes and insurance.',
    nextContact:'Use the board’s individual-license and rule links for credential-specific detail. Specify whether a barber credential is a master barber license.'
  },
  'Florida':{
    authority:'Florida Department of Business and Professional Regulation (DBPR)',
    licenseLookup:{title:'Florida DBPR Verify a License',url:'https://www2.myfloridalicense.com/online-services/'}, 
    coverage:'Official DBPR FAQ and unlicensed-activity guide describe shampoo-only exemption and limits of other hair services.',
    sources:[
      link('fl-faq','Florida DBPR — Cosmetology FAQs','https://www2.myfloridalicense.com/cosmetology/faqs/','See SCOPE OF WORK — shampooing'),
      link('fl-required','Florida DBPR — What Requires a License','https://ula.myfloridalicense.com/what-requires-a-license/','See Cosmetology Services'),
      link('fl-types','Florida DBPR — License Categories','https://www2.myfloridalicense.com/cosmetology/','Current Facial Specialist and Full Specialist categories'),
      link('fl-facial','Florida DBPR — Facial Specialist Registration','https://www.myfloridalicense.com/CheckListDetail.asp?SID=&XACT_DEFN_ID=5351&clientCode=0508&xactCode=1030','Cosmetic treatments of face/scalp'),
      link('fl-salon','Florida DBPR — Salon License Checklist','https://www.myfloridalicense.com/CheckListDetail.asp?XACT_DEFN_ID=5237&clientCode=0502&xactCode=1030','Salon license, inspection, sanitation')
    ],
    findings:[
      finding('wash',ALL,'documented_exemption','Florida DBPR says hair shampooing alone does not require an individual license.',['fl-faq','fl-required'],'The exemption does not include chemical rinsing, blow-drying, styling or a broader scalp service.'),
      ...NO_LICENSE.flatMap(license=>[
        finding('styling',license,'licensed_role_required','Florida DBPR says blow-drying and styling hair for compensation require an appropriate cosmetology license.',['fl-faq','fl-required'])
      ]),
      finding('styling','Cosmetologist','credential_scope','Florida DBPR identifies cosmetology licensing for paid hair drying and styling.',['fl-faq','fl-required']),
      finding('styling','Esthetician','outside_credential','DBPR says blow-drying and styling hair require cosmetology licensure rather than an esthetics-only credential.',['fl-faq','fl-required'])
    ],
    facility:'Florida requires salon licenses for many compensated cosmetology and facial-specialist services. Certain limited hair services can be performed outside salons. This exception does not cover the whole multi-step head spa. Verify facility license, sanitation, water and local-code rules (DBPR Cosmetology FAQ and Salon License Checklist).',
    nextContact:'Confirm the precise service scope and whether a salon license is required for your combination of activities.'
  },
  'Pennsylvania':{
    authority:'Pennsylvania State Board of Cosmetology / Department of State',
    licenseLookup:{title:'PA PALS — Verify a Professional License',url:'https://www.pa.gov/services/dos/verify-a-professional-or-occupational-license'}, 
    coverage:'Official statute and board guidance describe professional scope and salon licensing; no blanket head-spa exemption has been established in this research.',
    sources:[
      link('pa-law','Pennsylvania Cosmetology Law — Definitions (§1)','https://www.palegis.us/statutes/unconsolidated/law-information/view-statute?act=86&chpt=0&iFrame=true&sctn=1&sessInd=0&smthLwInd=0&subsctn=0&txtType=HTM&yr=1933','Scalp, hair and esthetics definitions'),
      link('pa-cosmo','PA — Cosmetology Licensure Guide','https://www.pa.gov/agencies/dos/resources/professional-licensing-resources/licensure-processing-guides-and-timelines/cosmetology-guide','For compensation scope description'),
      link('pa-board','PA — State Board of Cosmetology','https://www.pa.gov/agencies/dos/department-and-offices/bpoa/boards-commissions/cosmetology','Board does not provide advisory legal opinions'),
      link('pa-salon','PA — Salon Licensure Procedure','https://www.pa.gov/agencies/dos/department-and-offices/bpoa/boards-commissions/cosmetology/application-process','Inspection and licensing of salons'),
      link('pa-barber-law','PA — Barber License Law §13','https://www.pa.gov/content/dam/copapwp-pagov/en/dos/department-and-offices/bpoa/barber/barber-law.pdf','Barber license, scope and supervised shampoo exception'),
      link('pa-barber-guide','PA — Barber Licensure Guide','https://www.pa.gov/agencies/dos/resources/professional-licensing-resources/licensure-processing-guides-and-timelines/barber-guide','Barber shampoo, styling and scalp-care scope')
    ],
    findings:[
      finding('wash','Cosmetologist','credential_scope','Pennsylvania’s cosmetology definition includes cleansing and other work on the hair.',['pa-law','pa-cosmo'],'Practice location and individual credential rules must also be satisfied.'),
      finding('scalp-massage','Cosmetologist','credential_scope','Pennsylvania’s cosmetology statute includes scalp massage and related cosmetic services.',['pa-law'],'This does not authorize medical diagnosis or unrestricted bodywork.'),
      finding('styling','Cosmetologist','credential_scope','Pennsylvania’s cosmetology statute and board guide include arranging and styling human hair.',['pa-law','pa-cosmo']),
      finding('wash','Barber','credential_scope','PA Barber Law defines shampooing hair as part of licensed barbering.',['pa-barber-law','pa-barber-guide'],'Verify current barber credential and shop requirements.'),
      finding('styling','Barber','credential_scope','PA Barber Law includes hair styling in licensed barbering scope.',['pa-barber-law'],'Specific technique and workplace requirements still apply.'),
      finding('scalp-massage','Barber','credential_scope','PA Barber Law includes cosmetic scalp massage and treatments under barbering.',['pa-barber-law','pa-barber-guide'],'No medical diagnosis or unrestricted therapeutic bodywork.'),
      finding('wash','No professional license','conditional_exemption','PA Barber Law §13(a) provides a narrow shampoo-only exception for unlicensed persons supervised by a barber-manager, barber-owner or barber-teacher.',['pa-barber-law'],'This is NOT permission to shampoo independently or offer full head spa services without a license; the required supervision and shop rules must actually be met.'),
      finding('wash','Student / not yet licensed','conditional_exemption','PA Barber Law §13(a) describes a narrow shampoo exception when a nonlicensed person works under specified barber supervision.',['pa-barber-law'],'Other regulated barber/cosmetology steps are not covered; location and supervision are mandatory.')
    ],
    facility:'PA states that salons must be licensed and pass inspection before opening. The specific category of salon for the planned mix of services needs verification.',
    nextContact:'PA board staff and counsel say they cannot issue advisory legal opinions. Review the statute and regulations; for an ambiguous license/scope question, consult a Pennsylvania attorney familiar with professional licensing.'
  },
  'New York':{
    authority:'New York Department of State — Appearance Enhancement',
    licenseLookup:{title:'New York DOS — Licensing Status and Open NY Portal',url:'https://appext20.dos.ny.gov/lcns_public/main_screen'}, 
    coverage:'Current NY DOS official scope pages and procedure licensure chart. Only narrow cosmetology/esthetic distinctions are mapped; specific bodywork and devices need deeper review.',
    sources:[
      link('ny-chart','NY DOS — Appearance Enhancement Service Determinations (Mar 31, 2026)','https://dos.ny.gov/system/files/documents/2026/04/ae-licensees-procedural-service-determinations_3.31.2026.pdf','Current reviewed chart; check specific license columns','2026-03-31'),
      link('ny-cosmo','NY DOS — Cosmetology Scope','https://dos.ny.gov/cosmetology','Hair, head and scalp regulated services'),
      link('ny-esthetics','NY DOS — Esthetics Scope','https://dos.ny.gov/esthetics','Cosmetic services covered by esthetics'),
      link('ny-faq','NY DOS — Cosmetology FAQs','https://dos.ny.gov/frequently-asked-questions-cosmetology'),
      link('ny-business','NY DOS — Appearance Enhancement Business FAQ','https://dos.ny.gov/node/64621','Business and area renter licensing'),
      link('ny-lic-chart','NY DOS — Procedure Licensure Chart','https://dos.ny.gov/med-spa-procedure-licensure-chart','Detailed services and massage categories')
    ],
    findings:[
      finding('wash','Cosmetologist','credential_scope','NY DOS cosmetology scope covers services to human hair and scalp, including ordinary hair cleansing within cosmetology practice.',['ny-cosmo','ny-faq'],'Does not authorize medical scalp diagnosis or bypass business licensing.'),
      finding('styling','Cosmetologist','credential_scope','NY DOS describes hair styling and arranging within cosmetology scope.',['ny-cosmo','ny-faq']),
      finding('scalp','Cosmetologist','credential_scope','NY DOS describes cosmetic head/scalp services within cosmetology scope.',['ny-cosmo'],'Exact device, medical and technique exclusions require review.'),
      finding('styling','Esthetician','outside_credential','NY DOS esthetics defines services for skin of face, neck, arms, legs and shoulders, while hair styling belongs to hair-service credentials.',['ny-esthetics','ny-cosmo'],'An esthetics credential alone is not a general hair-styling license.'),
      finding('bodywork','Massage therapist','unresolved','NY DOS assigns some pressure/massage procedures to Massage Therapy, but neck/shoulder bodywork must be classified by exact technique and purpose.',['ny-lic-chart'],'Deep tissue, acupressure and therapeutic modalities differ from light cosmetic massage.')
    ],
    facility:'NY requires an Appearance Enhancement Business license separate from the individual license. An independent area renter needs their own Area Renter business license. The appearance enhancement premises may need a Barber Shop license for barbering. See NY DOS Business FAQ; local safety and insurance rules also apply.',
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
    licenseLookup:record?.licenseLookup||null,
    researchStatus:record?'PRIMARY SOURCES LOCATED — SELECTED ACTIVITY NOTES':'NOT YET RESEARCHED — NO SCOPE FINDINGS',
    researchDate:record?SCOPE_REVIEW_DATE:null,
    coverage:record?.coverage||'AIMT has not researched this state yet. The absence of a finding is not a statement of permission or prohibition.',
    sources:record?.sources||[],
    facility:record?.facility||'Establishment, local permits, insurance and sanitation obligations have not been researched for this state.',
    nextContact:record?.nextContact||'Find your official state cosmetology/barbering board, read the current statute and regulations, and consult a qualified licensing professional for disputed activities.',
    findings:byActivity
  };
}
