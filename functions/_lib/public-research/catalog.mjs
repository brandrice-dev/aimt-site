import { verifyStoredClearanceIntegrity } from '../research/publication-clearance-fingerprint.mjs';
import { buildTrustedSources } from '../education-ops/education-source-authority.mjs';
import { getPublicationConcept, PUBLICATION_CLUSTERS } from '../education-ops/education-publication-registry.mjs';

export const ORIGIN = 'https://aimtrichology.com';
export const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean = s => typeof s === 'string' ? s.trim() : '';
export function safeSourceUrl(value) {
  try { const u=new URL(value);return u.protocol==='https:' && !u.username && !u.password ? u.href : null; } catch { return null; }
}
export async function studyIdentity(source) {
  const key=source.doi ? `doi:${source.doi.trim().toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi.org\//,'')}` : `url:${source.url}`;
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key)))].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,24);
}
export { searchCatalog } from '../../../assets/js/aimt-research-search.mjs';
// Only the already-public citation projection is returned. Evidence statements,
// internal IDs, review notes, abstracts and graduate records never cross here.
export async function buildPublicCatalog(rows, readArticle, { verifyIntegrity=verifyStoredClearanceIntegrity }={}) {
  const articles=[], studies=new Map();
  for(const row of rows) {
    const concept=getPublicationConcept(row.topic_slug);
    if(!concept || row.status!=='published' || row.sitemap_eligible!==true || !row.published_at)continue;
    const hasClearance=!!row.publication_clearance?.fingerprint_input;
    if(hasClearance && !(await verifyIntegrity(row)).valid)continue;
    const route=`${PUBLICATION_CLUSTERS[concept.cluster].route_prefix}/${concept.route_slug}`;
    const response=await readArticle(route);
    if(response.status!==200)continue;
    const html=await response.text();
    if((hasClearance && !html.includes(`content="${row.generation_source_hash}"`)) || !html.includes(`href="${ORIGIN}${route}"`) || /<meta\b[^>]*(?:name=["']robots["'][^>]*content=["'][^"']*noindex|content=["'][^"']*noindex[^>]*name=["']robots)/i.test(html))continue;
    const h1=html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
    const title=clean(h1?.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"')) || concept.seo_page_concept;
    const subjects=[row.topic_slug.replaceAll('-',' '),...concept.controlled_topics.map(t=>t.replaceAll('-',' ')),PUBLICATION_CLUSTERS[concept.cluster].label];
    const article={type:'article',title,href:route,description:'Reviewed AIMT practitioner education.',categories:[concept.cluster],subjects};
    articles.push(article);
    // Legacy published articles are discoverable from their public HTML, but
    // their study metadata is withheld without an intact clearance snapshot.
    if(!hasClearance)continue;
    for(const s of buildTrustedSources(row.publication_clearance.fingerprint_input)) {
      const url=safeSourceUrl(s.url) || (s.doi ? safeSourceUrl(`https://doi.org/${s.doi}`) : null);
      // A clearance citation must also occur in the deployed page's Sources
      // block. Merely being in an internal citation map does not expose it.
      const sourcesBlock=html.split('id="sources"')[1]?.split('id="related"')[0] || '';
      if(!s.title || !url || !s.authors.length || !Number.isInteger(s.year) || !sourcesBlock.includes(escapeHtml(s.title)) || !sourcesBlock.includes(escapeHtml(url)))continue;
      const id=await studyIdentity({...s,url}), existing=studies.get(id);
      if(existing) { if(!existing.articles.some(a=>a.href===route))existing.articles.push({title,href:route});existing.categories=[...new Set([...existing.categories,concept.cluster])];existing.subjects=[...new Set([...existing.subjects,...subjects])]; }
      else studies.set(id,{type:'study',id,title:s.title,authors:s.authors.filter(x=>typeof x==='string'),year:s.year,doi:s.doi || null,source_url:url,href:`/research/studies/${id}`,categories:[concept.cluster],subjects,articles:[{title,href:route}]});
    }
  }
  return {articles,studies:[...studies.values()],categories:Object.entries(PUBLICATION_CLUSTERS).map(([id,c])=>({id,label:c.label}))};
}
export async function loadPublicCatalog(env) {
  if(!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.ASSETS)throw Error('PUBLIC_LIBRARY_UNAVAILABLE');
  const rows=[];
  // Bounded pagination; never quietly publish a truncated eligibility snapshot.
  for(let offset=0;offset<2000;offset+=200) {
    const query=new URLSearchParams({select:'topic_slug,status,sitemap_eligible,published_at,clearance_mode,generation_source_hash,key_claim_ids,source_ids,publication_clearance',status:'eq.published',sitemap_eligible:'eq.true',order:'topic_slug.asc',limit:'200',offset:String(offset)});
    const r=await fetch(`${env.SUPABASE_URL}/rest/v1/research_public_pages?${query}`,{headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`},signal:AbortSignal.timeout(10000)});
    if(!r.ok)throw Error('PUBLIC_LIBRARY_UNAVAILABLE');const page=await r.json();if(!Array.isArray(page))throw Error('PUBLIC_LIBRARY_UNAVAILABLE');rows.push(...page);
    if(page.length<200)return buildPublicCatalog(rows,route=>env.ASSETS.fetch(new Request(ORIGIN+route)));
  }
  throw Error('PUBLIC_LIBRARY_LIMIT');
}
