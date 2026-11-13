// AIMT Scope Finder — selected primary-source guidance, not legal advice.
// IMPORTANT: "Head spa" is not treated as one licensed service. Each finding
// applies only to the activity and credential named, not to the entire visit.
// Every source was inspected against a state agency or current legislative site
// on 2026-11-12. Independent regulatory review is required before public launch.
// States without verified evidence are NOT mapped or presumed permissive.
export const SCOPE_REVIEW_DATE='2026-11-12';
export const SCOPE_RESEARCH_DISCLAIMER="Educational research only. AIMT summarizes selected official sources but does not provide legal advice, verify your individual license, determine whether a complete head spa is permitted, or guarantee that the information is complete or current. Requirements vary by activity, credential, premises and location and can change. Confirm applicable rules with the official licensing authorities and, when needed, a qualified licensing attorney before providing services.";

export const SCOPE_FINDINGS=Object.freeze({
  documented_exemption:{
    heading:'No individual license required for this specific step',
    explanation:'The cited agency specifically describes this activity as not requiring an individual license. Other steps, facility rules and local requirements may still apply.'
  },
  conditional_exemption:{heading:'This exception has specific conditions',explanation:'A specific activity may be exempt only under described work-setting and supervision conditions. Not permission to operate a whole head spa.'},
  credential_scope:{
    heading:'Covered by this type of license',
    explanation:'The cited law or regulator describes this type of cosmetic service within the professional scope. Specific techniques, health rules and the workplace still matter.'
  },
  implementation_review:{
    heading:'Cosmetic service covered; check equipment or technique',
    explanation:'The source addresses the broader professional service, but additional equipment, installation, recordkeeping or medical-boundary details need to be checked. This is not a finding that the activity is prohibited.'
  },
  outside_credential:{
    heading:'Not covered by this type of license',
    explanation:'The cited agency specifically excludes this activity for the selected credential. A separate qualifying credential or practitioner may be needed.'
  },
  licensed_role_required:{
    heading:'This step requires a licensed professional',
    explanation:'The cited agency requires a designated credential for this activity. An exemption for another step does not cover this one.'
  },
  unresolved:{
    heading:'Find the rule for this exact step',
    explanation:'The official references currently cited here do not establish a conclusion for this exact activity and credential. That is not evidence the activity is prohibited.'
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
    coverage:'Pennsylvania’s Cosmetology Law expressly covers cosmetic hair cleansing, scalp cleansing, massage and stimulation, and cosmetic upper-body work. Professional scope and salon/equipment compliance are separate questions; the specific technique must remain within nonmedical cosmetology practice.' ,
    sources:[
      link('pa-law','Pennsylvania Cosmetology Law — Definitions (§1)','https://www.palegis.us/statutes/unconsolidated/law-information/view-statute?act=86&chpt=0&iFrame=true&sctn=1&sessInd=0&smthLwInd=0&subsctn=0&txtType=HTM&yr=1933','Scalp, hair and esthetics definitions'),
      link('pa-cosmo','PA — Cosmetology Licensure Guide','https://www.pa.gov/agencies/dos/resources/professional-licensing-resources/licensure-processing-guides-and-timelines/cosmetology-guide','For compensation scope description'),
      link('pa-board','PA — State Board of Cosmetology','https://www.pa.gov/agencies/dos/department-and-offices/bpoa/boards-commissions/cosmetology','Board does not provide advisory legal opinions'),
      link('pa-salon','PA — Salon Licensure Procedure','https://www.pa.gov/agencies/dos/department-and-offices/bpoa/boards-commissions/cosmetology/application-process','Inspection and licensing of salons'),
      link('pa-barber-law','PA — Barber License Law §13','https://www.pa.gov/content/dam/copapwp-pagov/en/dos/department-and-offices/bpoa/barber/barber-law.pdf','Barber license, scope and supervised shampoo exception'),
      link('pa-barber-guide','PA — Barber Licensure Guide','https://www.pa.gov/agencies/dos/resources/professional-licensing-resources/licensure-processing-guides-and-timelines/barber-guide','Barber shampoo, styling and scalp-care scope'),
      link('pa-sanitation','49 Pa. Code §7.92 — Sanitization of Equipment','https://www.pacodeandbulletin.gov/secure/pacode/data/049/chapter7/s7.92.html','Sanitation of salon tools, instruments, utensils and appliances'),
      link('pa-salon-rules','49 Pa. Code Chapter 7 — Cosmetology Regulations','https://www.pacodeandbulletin.gov/secure/pacode/data/049/chapter7/chap7toc.html','Salon safety, sanitation, premises and appliances'),
      link('pa-massage-boundary','PA Cosmetology Law §9.3 — Massage Therapy in a Cosmetology Salon','https://www.palegis.us/statutes/unconsolidated/law-information/view-statute?act=86&chpt=0&iFrame=true&sctn=9&sessInd=0&smthLwInd=0&subsctn=3&txtType=HTM&yr=1933','Distinguishes cosmetic services from licensed massage therapy')
    ],
    findings:[
      finding("wash","Cosmetologist","credential_scope",
        "PA Cosmetology Law §1 expressly includes cleansing human hair as cosmetology work.",["pa-law","pa-cosmo"],
        "Professional license must be active; the service must occur in a permitted setting."),
      finding("scalp","Cosmetologist","credential_scope",
        "PA Cosmetology Law §1 expressly includes cleansing, stimulating and manipulating the scalp with cosmetic preparations or appliances. Ordinary nonmedical cosmetic scalp cleansing/exfoliation fits this broad service category.",["pa-law","pa-cosmo"],
        "The exact product, exfoliation method and medical/nonmedical boundary still matter; chemical peels or medical treatment should not be inferred from this description."),
      finding("scalp-massage","Cosmetologist","credential_scope",
        "PA Cosmetology Law §1 expressly includes cosmetic scalp massage, manipulation and stimulation.",["pa-law","pa-cosmo"],
        "Cosmetic scalp massage is different from offering medical or independent licensed massage therapy."),
      finding("bodywork","Cosmetologist","credential_scope",
        "PA Cosmetology Law §1 includes cosmetic massaging and manipulation of the upper part of the body. That supports ordinary nontherapeutic cosmetic neck/shoulder work within cosmetology practice.",["pa-law","pa-cosmo","pa-massage-boundary"],
        "The conclusion is limited to cosmetic upper-body techniques. Deep-tissue/therapeutic massage, treatment claims or holding out as a massage therapist have separate licensure boundaries."),
      finding("styling","Cosmetologist","credential_scope",
        "PA Cosmetology Law §1 includes arranging, dressing and styling human hair.",["pa-law","pa-cosmo"],
        "Individual and premises licensure requirements still apply."),
      finding("camera","Cosmetologist","implementation_review",
        "Pennsylvania cosmetology law broadly covers cosmetic scalp work and the use of mechanical/electrical appliances. It does not separately name scalp cameras; non-diagnostic observation is a service-planning use, not a diagnosis.",["pa-law","pa-cosmo"],
        "Confirm intended device use and any applicable device/recording rules. Do not imply permission for medical diagnosis or image-based treatment claims."),
      finding("wet","Cosmetologist","implementation_review",
        "Pennsylvania cosmetology law encompasses hair/scalp cleansing and cosmetic appliances. Salon regulations require sanitary equipment and safe premises; the exact bed, steamer and water system need an installation/sanitation check.",["pa-law","pa-sanitation","pa-salon-rules"],
        "The professional service and the installation of particular plumbing, electrical or steam equipment are separate compliance questions."),
      finding("wash","Barber","credential_scope","PA Barber Law includes shampooing hair within licensed barbering.",["pa-barber-law","pa-barber-guide"],"Verify current barber credential and shop requirements."),
      finding("styling","Barber","credential_scope","PA Barber Law includes hair styling within barbering.",["pa-barber-law"],"Specific techniques and workplace rules apply."),
      finding("scalp-massage","Barber","credential_scope","PA Barber Law includes cosmetic scalp massage and treatment.",["pa-barber-law","pa-barber-guide"],"Not unrestricted therapeutic bodywork."),
      finding("wash","No professional license","conditional_exemption","PA Barber Law §13(a) permits unlicensed persons to shampoo hair under a barber-manager, barber-owner or barber-teacher’s supervision.",["pa-barber-law"],"NOT permission to shampoo independently or operate an unlicensed head spa; shop and supervisor requirements are essential."),
      finding("wash","Student / not yet licensed","conditional_exemption","PA Barber Law §13(a) permits unlicensed persons to shampoo hair under a barber-manager, barber-owner or barber-teacher’s supervision.",["pa-barber-law"],"NOT permission to shampoo independently or operate an unlicensed head spa; shop and supervisor requirements are essential.")
    ],
    facility:'The Pennsylvania Cosmetology Law §8 requires regulated cosmetology work in a licensed cosmetology salon or barber shop, with a limited client-residence exception. The PA Board states new salons must be licensed and inspected before opening. Once a salon and a cosmetologist are appropriately licensed, the ordinary cosmetic services listed in §1 do not each require a separate named “head spa” license. Confirm equipment sanitation, water/electrical installation and any business/municipal requirements for the chosen premises.',
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
 const counts={documented_exemption:0,conditional_exemption:0,credential_scope:0,
  implementation_review:0,outside_credential:0,licensed_role_required:0,unresolved:0};
 for(const f of results)if(Object.prototype.hasOwnProperty.call(counts,f.status))counts[f.status]++;
 const restricted=counts.outside_credential+counts.licensed_role_required;
 const supported=counts.credential_scope+counts.implementation_review;
 let tone='neutral';
 let headline='See what the official sources say';
 let message='This research tool explains the professional scope and remaining operational details; AIMT does not issue licensing decisions.';
 if(restricted){
  tone='restricted';
  headline='Some selected steps need another professional credential';
  message='The cited guidance identifies certain steps outside the selected license category. Other listed cosmetic services may still be in scope. Review the particular restricted steps and their official sources.';
 }else if(supported){
  tone=counts.credential_scope?'supported':'caution';
  headline=counts.credential_scope>=2
   ?'Your license category covers core cosmetic services'
   :'This activity is supported by your license category';
  message=counts.unresolved
   ?'The cited sources support the activities identified below. For other selected steps, a specific determination is not yet established from the references available here. Those steps are not being classified as prohibited.'
   :'The cited law covers the listed cosmetic services. Any remaining notes concern how to perform them compliantly: active license, nonmedical technique, licensed premises, sanitation or equipment requirements.';
  if(counts.implementation_review){
   message+=' Equipment- or method-specific questions are separate from the underlying professional scope.';
  }
 }else if(counts.conditional_exemption){
  tone='caution';
  headline='A narrow exception exists, with specific conditions';
  message='The law describes a limited exemption for this step. It applies only when the listed conditions are met and does not establish independent head spa authorization.';
 }else if(results.length&&counts.documented_exemption===results.length){
  tone='supported';
  headline='Individual license exemption documented for this step';
  message='The cited state source exempts this particular activity from individual licensure. That does not determine establishment requirements or other services in a head spa.';
 }else if(counts.documented_exemption){
  tone='mixed';
  headline='A specific exemption is documented. Check the remaining steps.';
  message='The cited official source identifies an exemption for one service activity. For the other steps, check the separate licensing and facility provisions linked below; they are not automatically restricted.';
 }else if(results.length&&counts.unresolved===results.length){
  tone='unknown';
  headline='Here’s how to confirm the rules for your service';
  message=review?.sources?.length
   ?'Your state has official licensing resources, but the references shown do not settle this exact combination of activities, credential and workplace. That is not a finding that the services are prohibited. Use the official sources and the tailored questions below.'
   :'“Head spa” is a service name; professional rules address the actual activities, credentials and workplace. We do not have a state-specific source-backed determination for this selection. That does not mean the services are prohibited. Begin with the official government directory and the tailored questions below.';
 }
 return {headline,message,tone,counts,total:results.length,wholeServiceCleared:false};
}

// Plain-language interpretation of what the SOURCES show, not of a
// visitor's personal permission to practice. Never map 'unresolved' to 'no'.
const SUMMARY_STEP_NAMES=Object.freeze({
 wash:'shampooing hair',scalp:'cosmetic scalp care',
 'scalp-massage':'scalp massage',bodywork:'cosmetic neck or shoulder massage',
 styling:'hair styling',camera:'scalp-camera observation',
 wet:'water, steam or sanitation equipment'
});
function stepNames(findings){
 const names=findings.map(f=>SUMMARY_STEP_NAMES[f.activity]||f.activity);
 if(names.length>3)return names.slice(0,2).join(' and ')+' and '+(names.length-2)+' other selected steps';
 if(names.length===3)return names[0]+', '+names[1]+' and '+names[2];
 return names.join(' and ');
}
export function scopePlainEnglish(review){
 const findings=Array.isArray(review?.findings)?review.findings:[];
 const groups=[
  {id:'credential_scope',tone:'supported',title:'What this license type covers',items:findings.filter(f=>f.status==='credential_scope'),
   explain:items=>'The official references describe '+stepNames(items)+' as services within this professional license category.'},
  {id:'documented_exemption',tone:'supported',title:'A specific license exception',items:findings.filter(f=>f.status==='documented_exemption'),
   explain:items=>'The cited state source says '+stepNames(items)+' does not require an individual professional license. That exception is limited to these activities.'},
  {id:'outside_credential',tone:'restricted',title:'What needs another license',items:findings.filter(f=>['outside_credential','licensed_role_required'].includes(f.status)),
   explain:items=>'The official references identify a licensing restriction for '+stepNames(items)+'. See the specific requirement and source below.'},
  {id:'conditional_exemption',tone:'check',title:'An exception with conditions',items:findings.filter(f=>f.status==='conditional_exemption'),
   explain:items=>'A narrow exception may apply to '+stepNames(items)+', but only when the stated supervision or workplace conditions are met.'},
  {id:'implementation_review',tone:'check',title:'Equipment or methods to check',items:findings.filter(f=>f.status==='implementation_review'),
   explain:items=>'The underlying cosmetic service may be in scope; '+stepNames(items)+' still has specific equipment, technique or location requirements to check.'},
  {id:'unresolved',tone:'neutral',title:'What still needs an exact answer',items:findings.filter(f=>f.status==='unresolved'),
   explain:items=>'For '+stepNames(items)+', the references shown do not establish an exact answer for this license type. That does not mean the services are prohibited.'}
 ];
 const items=groups.filter(g=>g.items.length).map(g=>({
  id:g.id,tone:g.tone,title:g.title,text:g.explain(g.items),count:g.items.length
 }));
 const state=review?.state||'your state',license=review?.license||'the selected license';
 const none=items.length===1 && items[0].id==='unresolved';
 const route=scopeResearchPath(review);
 const restricted=groups.find(g=>g.id==='outside_credential'&&g.items.length);
 const firstRestrictedSource=restricted?.items?.flatMap(x=>x.sources||[])[0];
 const next=restricted
  ? {label:'Next: check the restricted service step',text:'Read the specific official rule before offering that step. You may need a professional with a different license or need to change your planned service.',
     href:firstRestrictedSource?.url||route.startingPoint.url,
     linkLabel:firstRestrictedSource?'Read the cited licensing rule':route.startingPoint.title}
  : none || items.some(i=>i.id==='unresolved')
  ? {label:'Next: find the exact rule',text:'Open the government source below, then use the service-specific questions to check what applies to your license and workplace.',
     href:route.startingPoint.url,linkLabel:route.startingPoint.title}
  : items.some(i=>i.id==='conditional_exemption')
  ? {label:'Next: check the required conditions',text:'Read the source for the exemption and confirm you meet its supervision and workplace requirements before using it.',
     href:items.find(i=>i.id==='conditional_exemption')?.items?.[0]?.sources?.[0]?.url||route.startingPoint.url,
     linkLabel:'Read the official conditions'}
  : ['No professional license','Student / not yet licensed'].includes(license)
    && items.some(i=>i.id==='documented_exemption')
  ? {label:'Next: check the work setting and limits',text:'This is an exception for a particular service step, not an exemption for your entire head spa. Check the workplace and any other services separately.',
     href:groups.find(g=>g.id==='documented_exemption')?.items?.[0]?.sources?.[0]?.url||route.startingPoint.url,
     linkLabel:'Read the exact official exemption'}
  : {label:'Next: verify your license and workplace',text:'Check that your individual license is active and that your salon or work location meets its separate requirements.',
     href:review?.licenseLookup?.url||route.startingPoint.url,
     linkLabel:review?.licenseLookup?'Check your license on the official state website':route.startingPoint.title};
 return {
  context:'You selected '+license+' in '+state+'. Here is what the cited government references mean for the services you chose.',
  items,next,
  note:'These results describe written guidance for license types and activities. They do not verify your individual license, business premises, or permission to offer an entire head spa service.',
  hasSourceBackedResult:items.some(x=>x.tone==='supported'||x.tone==='restricted'||x.id==='conditional_exemption')
 };
}

// Source-led next steps for selections without a complete written determination.
// USAGov is an official government directory, NOT a claim that it is a
// cosmetology board or that it decides individual licensing questions.
export const SCOPE_GOVERNMENT_DIRECTORY=Object.freeze({
 title:'Find your state government and licensing agency',
 url:'https://www.usa.gov/state-governments',
 detail:'Official USAGov state-government directory; select your state to locate its professional licensing department.'
});
const STEP_QUESTIONS=Object.freeze({
 wash:'Does this credential cover shampooing and conditioning hair, or is there an individual-license exemption?',
 scalp:'Does the credential include nonmedical cosmetic scalp cleansing or exfoliation? Which techniques and products have limits?',
 'scalp-massage':'Is cosmetic scalp massage included, and how is it distinguished from therapeutic massage?',
 bodywork:'What cosmetic neck or shoulder techniques are covered, and when does massage-therapy licensing apply?',
 styling:'Can this professional credential provide paid hair blow-drying or styling?',
 camera:'May a practitioner use magnified scalp images only for cosmetic observation and referral, without diagnosis?',
 wet:'What sanitation, plumbing, drainage, steaming, electrical and premises rules apply to this equipment?'
});
export function scopeResearchPath(review){
 const unknown=Array.isArray(review?.findings)?review.findings.filter(x=>x.status==='unresolved'):[];
 const available=Array.isArray(review?.sources)?review.sources:[];
 const credential=review?.license||'';
 // Don't send massage therapists or unknown-credential visitors to a
 // cosmetology-only board just because AIMT mapped that state's cosmo law.
 const needsDifferentRegulator=['Massage therapist','Other / unsure'].includes(credential)
   ||(['Florida','New York'].includes(review?.state)&&credential==='Barber');
 const candidates=review?.state==='Pennsylvania'&&credential==='Barber'
   ? available.filter(x=>x.id==='pa-barber-guide'||x.id==='pa-barber-law')
   : needsDifferentRegulator?[]:available;
 const hasStateSources=candidates.length>0;
 const startingPoint=hasStateSources
  ? {title:'Open '+(review?.state||'state')+' official licensing guidance',
     detail:'Begin with '+candidates[0].title+'. Confirm that this is the regulator for your exact credential, then read the service and facility requirements.',
     url:candidates[0].url,sourceTitle:candidates[0].title}
  : {title:'Find the '+(review?.state||'state')+' professional licensing agency',
     detail:'Select '+(review?.state||'your state')+' in the official USAGov directory, then locate the board overseeing your credential.',
     url:SCOPE_GOVERNMENT_DIRECTORY.url,sourceTitle:SCOPE_GOVERNMENT_DIRECTORY.title};
 return {
  hasStateSources,
  startingPoint,
  questions:unknown.map(x=>({
   activity:x.activity,
   question:STEP_QUESTIONS[x.activity]||'Which official regulation governs this specific activity?'
  })),
  steps:[
   {title:'Locate the governing licensing rules',detail:startingPoint.detail},
   {title:'Match your exact credential to the activities',detail:'Check each selected step separately. A shampoo-only exception does not automatically include scalp treatments, massage or styling.'},
   {title:'Check the workplace and equipment',detail:'Confirm salon/shop licensing, sanitation and local plumbing/electrical requirements for the way you plan to operate.'},
   {title:'Keep the source or ask for a rule citation',detail:'Use the prepared questions below. When a regulator cannot give legal interpretations, request the written rule or consult qualified counsel.'}
  ]
 };
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
      summary:found?.summary||'The sources linked here do not establish an activity-specific conclusion for this credential and service step. This is not a restriction or permission.',
      limits:found?.limits||'Next: check the written scope for the exact professional license and the relevant establishment or equipment rules.',
      sources:record?.sources?.filter(s=>sourceIds.includes(s.id))||[]
    };
  });
  return {
    state,license,authority:record?.authority||'Relevant state licensing authority not yet mapped',
    licenseLookup:record?.licenseLookup||null,
    researchStatus:record?'OFFICIAL STATE REFERENCES AVAILABLE':'NO ACTIVITY-SPECIFIC FINDING CITED YET',
    researchDate:record?SCOPE_REVIEW_DATE:null,
    coverage:record?.coverage||'No state-specific determination is cited for the selected activities and credential. Use the official state-government directory and verification steps below. No permission or prohibition is inferred.',
    sources:record?.sources||[],
    facility:record?.facility||'Check whether this workplace requires a licensed salon or shop, inspection, local business or health permits, sanitation controls, and installation approval for water or electrical equipment. These questions are separate from your individual license.',
    nextContact:record?.nextContact||'Use the USAGov state-government directory to locate the official professional licensing agency. Ask for the statute or rule governing your exact proposed steps. If the agency cannot interpret the law, consult a qualified licensing attorney.',
    findings:byActivity
  };
}
