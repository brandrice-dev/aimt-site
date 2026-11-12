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
    heading:'This state lists the step within the license category',
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
      finding("wash","Esthetician","outside_credential","CA head-spa bulletin excludes shampooing/washing hair from the esthetician license.",["ca-bulletin"],"Licensed barber, cosmetologist or hairstylist hair-service scope is separate."),
      finding("styling","Esthetician","outside_credential","CA head-spa bulletin excludes blow-drying hair from esthetician scope.",["ca-bulletin"],""),
      finding("scalp","Esthetician","credential_scope","CA Board describes cosmetic scalp cleansing/exfoliation as an esthetician scalp service.",["ca-bulletin","ca-2025"],"Does not include washing hair; confirm product, technique and nonmedical limits."),
      finding("scalp-massage","Esthetician","credential_scope","CA Board describes cosmetic scalp massage among esthetician head-spa treatments.",["ca-2025"],"Not a license for medical/therapeutic massage or hair services."),
      finding("wash","Hairstylist","credential_scope","CA Hairstylist scope includes non-prescription hair shampooing.",["ca-2025","ca-bulletin"],"Chemical hair services are separate."),
      finding("styling","Hairstylist","credential_scope","CA Hairstylist scope includes blow-drying and nonchemical styling.",["ca-2025"],"Not chemical hair processes."),
      finding("wash","Cosmetologist","credential_scope","CA Board identifies licensed cosmetologists as able to shampoo hair.",["ca-bulletin"],""),
      finding("styling","Cosmetologist","credential_scope","CA Board identifies licensed cosmetologists as able to blow-dry hair.",["ca-bulletin"],""),
      finding("wash","Barber","credential_scope","CA Board identifies licensed barbers as able to shampoo hair.",["ca-bulletin"],""),
      finding("styling","Barber","credential_scope","CA Board identifies licensed barbers as able to blow-dry hair.",["ca-bulletin"],""),
      finding("wash","No professional license","licensed_role_required","CA head-spa bulletin requires an appropriate hair-service credential for shampooing within a head-spa service.",["ca-bulletin"],"No generic individual shampoo exemption established in this bulletin."),
      finding("styling","No professional license","licensed_role_required","CA head-spa bulletin requires an appropriate hair-service credential for blow-drying.",["ca-bulletin"],""),
      finding("wash","Student / not yet licensed","licensed_role_required","CA head-spa bulletin requires an appropriate hair-service credential for shampooing within a head-spa service.",["ca-bulletin"],"No generic individual shampoo exemption established in this bulletin."),
      finding("styling","Student / not yet licensed","licensed_role_required","CA head-spa bulletin requires an appropriate hair-service credential for blow-drying.",["ca-bulletin"],"")
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
      finding("wash","*","documented_exemption","TDLR states shampooing and conditioning hair do not require an individual license.",["tx-who"],"This is not permission for regulated scalp treatments, styling or an establishment."),
      finding("scalp","Esthetician","credential_scope","TDLR lists cosmetic cleansing treatments on the scalp in esthetician scope.",["tx-esthetician"],"Hair styling services remain outside this credential."),
      finding("scalp-massage","Esthetician","credential_scope","TDLR explicitly lists scalp massage within esthetician scope.",["tx-esthetician"],""),
      finding("styling","Esthetician","outside_credential","TDLR excludes regulated hair styling from esthetician scope.",["tx-esthetician"],""),
      finding("scalp","Cosmetology Operator","credential_scope","TDLR lists scalp cleansing within cosmetology operator scope.",["tx-operator"],""),
      finding("scalp-massage","Cosmetology Operator","credential_scope","TDLR lists scalp massage within cosmetology operator scope.",["tx-operator"],""),
      finding("styling","Cosmetology Operator","credential_scope","TDLR lists hair styling within cosmetology operator scope.",["tx-operator"],""),
      finding("scalp","Cosmetologist","credential_scope","TDLR lists scalp cleansing within cosmetology operator scope.",["tx-operator"],""),
      finding("scalp-massage","Cosmetologist","credential_scope","TDLR lists scalp massage within cosmetology operator scope.",["tx-operator"],""),
      finding("styling","Cosmetologist","credential_scope","TDLR lists hair styling within cosmetology operator scope.",["tx-operator"],""),
      finding("scalp","Class A Barber","credential_scope","TDLR lists this cosmetic hair/scalp activity within Class A Barber scope.",["tx-barber"],"The credential must be Class A Barber, not an unspecified barber title."),
      finding("scalp-massage","Class A Barber","credential_scope","TDLR lists this cosmetic hair/scalp activity within Class A Barber scope.",["tx-barber"],"The credential must be Class A Barber, not an unspecified barber title."),
      finding("styling","Class A Barber","credential_scope","TDLR lists this cosmetic hair/scalp activity within Class A Barber scope.",["tx-barber"],"The credential must be Class A Barber, not an unspecified barber title."),
      finding("styling","No professional license","licensed_role_required","TDLR requires an applicable professional license for regulated hair styling.",["tx-who","tx-operator"],"The shampoo-only exemption does not cover this."),
      finding("scalp-massage","No professional license","licensed_role_required","TDLR regulates scalp massage within licensed barbering/cosmetology services.",["tx-esthetician","tx-operator"],"An unrelated relaxation or healthcare exemption would require separate verification."),
      finding("styling","Student / not yet licensed","licensed_role_required","TDLR requires an applicable professional license for regulated hair styling.",["tx-who","tx-operator"],"The shampoo-only exemption does not cover this."),
      finding("scalp-massage","Student / not yet licensed","licensed_role_required","TDLR regulates scalp massage within licensed barbering/cosmetology services.",["tx-esthetician","tx-operator"],"An unrelated relaxation or healthcare exemption would require separate verification.")
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
      finding("wash","*","documented_exemption","TN head-spa FAQ states shampooing has been deregulated.",["tn-faq"],"Excludes blow-drying, curling and styling tools; facility requirements are separate."),
      finding("scalp-massage","Esthetician","credential_scope","TN head-spa FAQ says licensed aestheticians may massage the scalp.",["tn-faq"],""),
      finding("styling","Esthetician","outside_credential","TN FAQ requires cosmetologist or Master Barber for blow-drying and styling tools.",["tn-faq"],""),
      finding("styling","Cosmetologist","credential_scope","TN head-spa FAQ identifies licensed cosmetologists for blow-drying and styling.",["tn-faq"],""),
      finding("styling","Master Barber","credential_scope","TN head-spa FAQ identifies licensed Master Barbers for blow-drying and styling.",["tn-faq","tn-master"],""),
      finding("scalp-massage","Master Barber","credential_scope","TN Board Master Barber scope includes scalp massage.",["tn-master"],"Medical massage is not implied."),
      finding("styling","Barber","unresolved","TN specifies Master Barber, not a generic Barber title.",["tn-faq"],"Verify exact professional subtype before using the styling scope."),
      finding("styling","No professional license","licensed_role_required","TN head-spa FAQ requires Cosmetologist or Master Barber for blow-drying and styling.",["tn-faq"],""),
      finding("styling","Student / not yet licensed","licensed_role_required","TN head-spa FAQ requires Cosmetologist or Master Barber for blow-drying and styling.",["tn-faq"],"")
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
      finding("wash","*","documented_exemption","Florida DBPR says shampooing or conditioning hair alone does not require an individual cosmetology license.",["fl-faq","fl-required"],"Excludes chemical rinsing and paid blow-drying/styling; does not permit a broader head spa."),
      finding("scalp-massage","Facial Specialist","credential_scope","Florida DBPR identifies cosmetic head/scalp massage within this professional license or specialty registration.",["fl-faq","fl-types"],"No unrestricted therapeutic massage or general hair-styling authorization."),
      finding("scalp-massage","Full Specialist","credential_scope","Florida DBPR identifies cosmetic head/scalp massage within this professional license or specialty registration.",["fl-faq","fl-types"],"No unrestricted therapeutic massage or general hair-styling authorization."),
      finding("scalp-massage","Cosmetologist","credential_scope","Florida DBPR identifies cosmetic head/scalp massage within this professional license or specialty registration.",["fl-faq","fl-types"],"No unrestricted therapeutic massage or general hair-styling authorization."),
      finding("scalp","Facial Specialist","credential_scope","DBPR specialty description includes defined nonmedical scalp treatment with cosmetic preparations.",["fl-types","fl-facial"],"Exact service method, salon and product requirements must be verified."),
      finding("scalp","Full Specialist","credential_scope","DBPR specialty description includes defined nonmedical scalp treatment with cosmetic preparations.",["fl-types","fl-facial"],"Exact service method, salon and product requirements must be verified."),
      finding("scalp","Cosmetologist","credential_scope","Florida DBPR cosmetology definition includes nonmedical treatment of head and scalp.",["fl-types"],"Medical claims, devices and location requirements require review."),
      finding("styling","Cosmetologist","credential_scope","Florida DBPR identifies licensed cosmetologists for paid hair blow-drying and styling.",["fl-faq","fl-required"],""),
      finding("styling","Facial Specialist","outside_credential","Florida specialty registrations do not cover regulated hair styling, which requires cosmetology licensure.",["fl-types","fl-required"],""),
      finding("styling","Full Specialist","outside_credential","Florida specialty registrations do not cover regulated hair styling, which requires cosmetology licensure.",["fl-types","fl-required"],""),
      finding("styling","No professional license","licensed_role_required","Florida requires an appropriate cosmetology license for paid blow-drying and styling.",["fl-faq","fl-required"],""),
      finding("styling","Student / not yet licensed","licensed_role_required","Florida requires an appropriate cosmetology license for paid blow-drying and styling.",["fl-faq","fl-required"],"")
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
      finding("wash","Cosmetologist","credential_scope","PA Cosmetology Act includes cleansing human hair.",["pa-law","pa-cosmo"],"Verify current individual and salon license."),
      finding("scalp-massage","Cosmetologist","credential_scope","PA Cosmetology Act includes cosmetic scalp massage.",["pa-law"],"Not medical/therapeutic bodywork."),
      finding("styling","Cosmetologist","credential_scope","PA Cosmetology Act covers arranging and styling human hair.",["pa-law","pa-cosmo"],""),
      finding("wash","Barber","credential_scope","PA Barber Law includes shampooing hair within licensed barbering.",["pa-barber-law","pa-barber-guide"],""),
      finding("styling","Barber","credential_scope","PA Barber Law includes hair styling within barbering.",["pa-barber-law"],""),
      finding("scalp-massage","Barber","credential_scope","PA Barber Law includes cosmetic scalp massage and treatment.",["pa-barber-law","pa-barber-guide"],""),
      finding("wash","No professional license","conditional_exemption","PA Barber Law §13(a) permits unlicensed persons to shampoo hair under a barber-manager, barber-owner or barber-teacher’s supervision.",["pa-barber-law"],"NOT permission to shampoo independently or operate an unlicensed head spa; shop and supervisor requirements are essential."),
      finding("wash","Student / not yet licensed","conditional_exemption","PA Barber Law §13(a) permits unlicensed persons to shampoo hair under a barber-manager, barber-owner or barber-teacher’s supervision.",["pa-barber-law"],"NOT permission to shampoo independently or operate an unlicensed head spa; shop and supervisor requirements are essential.")
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
      finding("wash","Cosmetologist","credential_scope","NY DOS describes cosmetology as including ordinary services to human hair and scalp.",["ny-cosmo","ny-faq"],"Specific shampoo-related procedures, location and business license must comply with current law."),
      finding("styling","Cosmetologist","credential_scope","NY DOS includes hair styling among cosmetology hair services.",["ny-cosmo","ny-faq"],""),
      finding("scalp","Cosmetologist","credential_scope","NY DOS includes cosmetic head/scalp work in cosmetology scope.",["ny-cosmo"],"Not medical diagnosis or unreviewed devices."),
      finding("styling","Esthetician","outside_credential","NY DOS esthetics focuses on skin of face, neck, shoulders, arms and legs; hair styling requires a suitable hair-service license.",["ny-esthetics","ny-cosmo"],"Unrelated facial services do not grant general hairstyling scope."),
      finding("bodywork","Massage therapist","unresolved","NY’s procedure chart distinguishes light cosmetic massage from therapeutic techniques; neck/shoulder massage is too broad to classify without method and purpose.",["ny-lic-chart"],"Get specific written guidance for actual pressure and technique."),
      finding("styling","No professional license","licensed_role_required","NY DOS states regulated cosmetology services require the relevant professional license.",["ny-cosmo","ny-business"],"Separate unlicensed exemptions, if any, require exact activity review."),
      finding("styling","Student / not yet licensed","licensed_role_required","NY DOS states regulated cosmetology services require the relevant professional license.",["ny-cosmo","ny-business"],"Separate unlicensed exemptions, if any, require exact activity review.")
    ],
    facility:'NY requires an Appearance Enhancement Business license separate from the individual license. An independent area renter needs their own Area Renter business license. The appearance enhancement premises may need a Barber Shop license for barbering. See NY DOS Business FAQ; local safety and insurance rules also apply.',
    nextContact:'Use the DOS license chart and relevant written law; if a row or service is not clear, seek current written authority before providing it.'
  }
});

export function scopeSummary(review){
 const results=Array.isArray(review?.findings)?review.findings:[];
 const counts={
  documented_exemption:0,conditional_exemption:0,credential_scope:0,
  outside_credential:0,licensed_role_required:0,unresolved:0
 };
 for(const f of results)if(Object.prototype.hasOwnProperty.call(counts,f.status))counts[f.status]++;
 let headline='Review each step before offering your service';
 let message='No complete head spa is approved by this tool. Your professional license and business requirements must still be checked.';
 if(counts.outside_credential+counts.licensed_role_required){
  headline='Some steps need a different professional license';
  message='At least one selected step is identified as outside this credential or requiring licensed personnel. Do not offer those steps until the required professional authorization is confirmed.';
 }else if(counts.conditional_exemption){
  headline='A narrow exception has important conditions';
  message='One of the selected steps may be exempt only in a specified workplace or under a required supervisor. This does not authorize independent head spa services.';
 }else if(counts.unresolved){
  headline='Some steps still need answers';
  message='We found only partial guidance for your proposed service. Follow the linked official rules and check the unresolved steps before purchasing equipment or advertising.';
 }else if(results.length && counts.documented_exemption===results.length){
  headline='Individual licensing exception documented for the selected step';
  message='An official source describes an individual-license exemption for this specific activity. This does not resolve business permits, other services, or whether your full head spa can operate.';
 }else if(results.length && counts.credential_scope===results.length){
  headline='Sources describe these steps for this license type';
  message='This describes the professional license category, not your particular license status or permission to run a business. Verify all remaining establishment and service details.';
 }
 return {headline,message,counts,total:results.length,wholeServiceCleared:false};
}

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
