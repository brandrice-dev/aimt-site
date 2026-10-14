// Student and graduate research read boundary, reusable by a future citation consumer. No ingestion,
// promotion, synthesis, or changes to the internal research-query endpoint.
import { resolveUser, hasSupabaseEnv, isEntitled } from '../certification/auth.mjs';
import { safeSourceUrl } from '../public-research/catalog.mjs';

export const EVIDENCE_TYPES = ['systematic_review','meta_analysis','rct','clinical_guideline','observational','narrative_review','textbook_chapter','professional_org','technical_report','other'];
export const SOURCE_ROLES = ['primary_research','synthesis','guideline','regulator_safety','practice_guidance','preclinical','regulatory_standard','other'];
const CLAIM_FIELDS = 'claim_id,source_id,claim_text,claim_type,direction,topics,population_or_scope,claim_text_fidelity,extraction_basis,claim_origin,page_or_section_locator,locator,verification_status,verification_review_status,verified_on,use_status';
const SOURCE_FIELDS = 'source_id,title,authors,year,doi,url,pmid,pmcid,source_venue,evidence_type,source_role,topics,verification_status,verification_depth,verification_review_status,rights_access_status,use_status';
export const protectedJson = (body,status=200) => Response.json(body,{status,headers:{'Cache-Control':'private, no-store','Vary':'Authorization','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'}});

export async function requireResearchMember(env,request) {
  if (!hasSupabaseEnv(env)) return { response: protectedJson({error:'Library temporarily unavailable.'},503) };
  const identity = await resolveUser(env,request);
  if (identity.errorResponse) return { response: protectedJson({error:'Sign in to My AIMT to continue.'},401) };
  if (await isEntitled(env,identity.user,null)) return {user:identity.user,accessType:'student'};
  const params = new URLSearchParams({select:'credential_id,course_slug,completed_at,revoked',user_id:`eq.${identity.user.id}`,revoked:'eq.false',credential_id:'not.is.null',completed_at:'not.is.null'});
  const rows = await read(env,`completions?${params}`);
  // Match the registry's currently issued AIMT credential convention. Enrollment
  // and client-supplied IDs never participate in the decision.
  const eligible = rows.some(r => r.revoked === false && /^AIMT-[A-Z]{2,6}-\d{4}-[A-Z2-9]{4,10}$/.test(r.credential_id) && r.course_slug && r.completed_at && Date.parse(r.completed_at) <= Date.now());
  return eligible ? {user:identity.user,accessType:'graduate'} : {response:protectedJson({error:'Active AIMT course enrollment or a valid, non-revoked AIMT certification is required.',code:'research_access_required'},403)};
}
async function read(env,path,headers={}) {
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,...headers},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('RESEARCH_UNAVAILABLE');
  const rows=await response.json();if(!Array.isArray(rows))throw Error('RESEARCH_UNAVAILABLE');return rows;
}
const allowed = (value,values) => {if(value && !values.includes(value))throw Error('INVALID_FILTER');return value;};
const identifier = value => {if(value && !/^[a-zA-Z0-9_-]{1,160}$/.test(value))throw Error('INVALID_FILTER');return value;};
export function parseGraduateQuery(params) {
  const q=(params.get('q') || '').trim();if(q.length>200)throw Error('INVALID_FILTER');
  const page=Number(params.get('page') || 1);if(!Number.isInteger(page)||page<1||page>500)throw Error('INVALID_FILTER');
  const year=params.get('year') || '';if(year && !/^\d{4}$/.test(year))throw Error('INVALID_FILTER');
  return {q,page,year,topic:identifier(params.get('topic') || ''),source_id:identifier(params.get('source_id') || ''),claim_id:identifier(params.get('claim_id') || ''),evidence_type:allowed(params.get('evidence_type') || '',EVIDENCE_TYPES),category:allowed(params.get('category') || '',SOURCE_ROLES),verification:allowed(params.get('verification') || '',['CLAIM_VERIFIED','AIMT_APPROVED'])};
}
// websearch syntax is constructed from words, never PostgREST expressions.
export function searchExpression(q) {
 const stop=new Set('what how does do is are the a an of to in on for and with about can tell me research evidence suggest suggests study studies say says show shows explain learn know find regarding scientific available current latest it its this that there we our you your'.split(' '));
 const words=q.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
 return words.filter(w=>!stop.has(w)).map(w=>`"${w}"`).join(' ');
}
// Existing AIMT scientific policy treats provisional as current verified
// evidence awaiting institutional review (publication-readiness.mjs).
// needs_review/excluded/superseded and missing use statuses stay ineligible.
function sourceGates(qs,prefix='') {
 qs.set(`${prefix}use_status`,'in.(active,provisional)');qs.set(`${prefix}verification_status`,'eq.SOURCE_VERIFIED');
 qs.set(`${prefix}rights_access_status`,'in.(open,paywalled,unknown)');
 qs.set(`${prefix}verification_review_status`,'in.(not_reviewed,reviewed_supported,reviewed_access_limited,reviewed_narrowed)');
}
export async function queryGraduateLibrary(env,p) {
 const qs=new URLSearchParams({select:`${CLAIM_FIELDS},source:research_sources!inner(${SOURCE_FIELDS})`,verification_status:p.verification?`eq.${p.verification}`:'in.(CLAIM_VERIFIED,AIMT_APPROVED)',use_status:'in.(active,provisional)',verified_against_primary_source:'eq.true',claim_origin:'in.(primary_text,full_text,abstract)',verification_review_status:'in.(not_reviewed,reviewed_supported,reviewed_access_limited,reviewed_narrowed)',order:'verified_on.desc.nullslast,claim_id.asc',limit:'21',offset:String((p.page-1)*20)});
 sourceGates(qs,'source.');
 if(p.source_id)qs.set('source_id',`eq.${p.source_id}`);
 if(p.claim_id)qs.set('claim_id',`eq.${p.claim_id}`);
 if(p.claim_type==='limitation')qs.set('claim_type','eq.limitation');
 if(p.topic)qs.set('topics',`cs.{${p.topic}}`);
 if(p.year)qs.set('source.year',`eq.${p.year}`);
 if(p.evidence_type)qs.set('source.evidence_type',`eq.${p.evidence_type}`);
 if(p.category)qs.set('source.source_role',`eq.${p.category}`);
 const expression=searchExpression(p.q);
 if(expression) {
  // Sources have their own generated search_vector (title/venue/body). Find
  // matching source IDs first, then apply the same search to verified claims.
  const sources=new URLSearchParams({select:'source_id',search_vector:`wfts.${expression}`,limit:'501'});sourceGates(sources);
  const matches=await read(env,`research_sources?${sources}`);
  if(matches.length>500)throw Error('SEARCH_TOO_BROAD');
  const ids=matches.map(s=>identifier(s.source_id));
  // Quotes protect websearch punctuation from the PostgREST OR grammar.
  const fts=`search_vector.wfts.${JSON.stringify(expression)}`;
  qs.set('or',`(${fts}${ids.length?`,source_id.in.(${ids.join(',')})`:''})`);
 }
 const rows=await read(env,`research_claims?${qs}`);
 const claims=rows.slice(0,20).map(row=>{
  const s=row.source;
  // Explicit second projection prevents accidental widening when selects change.
  const source=Object.fromEntries(SOURCE_FIELDS.split(',').map(k=>[k,s[k] ?? null]));
  source.url=safeSourceUrl(s.url);source.doi_url=s.doi?safeSourceUrl(`https://doi.org/${s.doi.replace(/^https?:\/\/(?:dx\.)?doi.org\//,'')}`):null;
  source.original_url=source.url || source.doi_url || (s.pmid && /^\d+$/.test(s.pmid)?`https://pubmed.ncbi.nlm.nih.gov/${s.pmid}/`:null) || (s.pmcid && /^PMC\d+$/.test(s.pmcid)?`https://pmc.ncbi.nlm.nih.gov/articles/${s.pmcid}/`:null);
  return {...Object.fromEntries(CLAIM_FIELDS.split(',').map(k=>[k,row[k] ?? null])),source};
 });
 return {query:p,claims,page:p.page,has_more:rows.length>20};
}
export async function graduateTopics(env) {
 const rows=await read(env,'research_topics?select=topic&order=topic.asc&limit=1000');
 return rows.map(r=>r.topic).filter(t=>/^[a-zA-Z0-9_-]{1,160}$/.test(t));
}

// Compatibility for existing server consumers; policy is now student OR graduate.
export const requireGraduate = requireResearchMember;
