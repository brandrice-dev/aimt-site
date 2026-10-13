import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildPublicCatalog,searchCatalog,safeSourceUrl,studyIdentity} from '../functions/_lib/public-research/catalog.mjs';
import {libraryPage,studyPage} from '../functions/_lib/public-research/view.mjs';
import {buildEvidenceFingerprintArtifact} from '../functions/_lib/research/publication-clearance-fingerprint.mjs';
import {buildWriterInstruction} from '../functions/_lib/education-ops/education-writer-prompt.mjs';
import {buildReviewerInstruction} from '../functions/_lib/education-ops/education-reviewer-schema.mjs';
const source={title:'Real hair biology study',authors:['Real Author'],year:2024,doi:'10.1/real',url:'https://doi.org/10.1/real'};
const row={topic_slug:'hair-biology',status:'published',sitemap_eligible:true,published_at:'2026-10-13',clearance_mode:'AUTO_READY',generation_source_hash:'abc',publication_clearance:{fingerprint_input:{source_ids:['source1','private'],citation_map:{source1:source,private:{...source,title:'PRIVATE_UNDISPLAYED_REFERENCE',doi:'10.1/private',url:'https://doi.org/10.1/private'}},core_factual_points:[{statement:'PRIVATE_CLEARED_EVIDENCE'}],internal_notes:'PRIVATE_NOTES'}},private_notes:'PRIVATE_NOTES'};
const readArticle=async()=>new Response('<link rel="canonical" href="https://aimtrichology.com/education/trichology/hair-biology"><link rel="canonical" href="https://aimtrichology.com/education/scalp-health/scalp-microbiome"><meta name="aimt-generation-source-hash" content="abc"><h1>Hair Biology</h1><section id="sources"><a href="https://doi.org/10.1/real">Real hair biology study</a></section><section id="related"></section>');
const good={verifyIntegrity:async()=>({valid:true})};
test('only published cleared deployed references pass; private fields are never projected',async()=>{
 const c=await buildPublicCatalog([row,{...row,topic_slug:'scalp-microbiome',status:'draft'},{...row,sitemap_eligible:false}],readArticle,good);
 assert.equal(c.articles.length,1);assert.equal(c.studies.length,1);
 const body=JSON.stringify(c);assert.ok(!body.includes('PRIVATE'));assert.ok(!body.includes('claim_id'));assert.ok(!body.includes('source_ids'));assert.ok(!body.includes('fingerprint'));
 assert.equal((await buildPublicCatalog([row],readArticle,{verifyIntegrity:async()=>({valid:false})})).articles.length,0);
 assert.equal((await buildPublicCatalog([row],async()=>new Response('<meta name="robots" content="noindex"><meta content="abc">'),good)).articles.length,0);
 assert.equal((await buildPublicCatalog([row],async()=>new Response('<meta content="wrong">'),good)).articles.length,0);
});
test('shared DOI references deduplicate and link both articles; search includes associated subjects',async()=>{
 const second={...row,topic_slug:'scalp-microbiome'};const c=await buildPublicCatalog([row,second],readArticle,good);
 assert.equal(c.studies.length,1);assert.equal(c.studies[0].articles.length,2);
 assert.equal(searchCatalog(c,{q:'scalp microbiome'}).length,2);assert.equal(searchCatalog(c,{q:'hair biology',type:'study'}).length,1);
 assert.equal(searchCatalog(c,{q:'Real Author',type:'study'}).length,1);assert.equal(searchCatalog(c,{category:'scalp-health',type:'study'}).length,1);
 assert.equal(await studyIdentity(source),await studyIdentity({...source,doi:'10.1/REAL'}));
 assert.equal(safeSourceUrl('javascript:alert(1)'),null);assert.equal(safeSourceUrl('https://user:secret@x.com'),null);
});
test('crawlable results, accessible GET search, canonical studies and query noindex work without JS',async()=>{
 const c=await buildPublicCatalog([row],readArticle,good),html=libraryPage(c,new URLSearchParams('q=hair+biology'));
 assert.ok(html.includes(c.studies[0].href));assert.ok(html.includes('method="get"'));assert.ok(html.includes('role="status"'));assert.ok(html.includes('noindex,follow'));
 assert.ok(studyPage(c.studies[0]).includes('https://aimtrichology.com'+c.studies[0].href));assert.ok(studyPage(c.studies[0]).includes('/education/trichology/hair-biology'));
 assert.ok(!libraryPage(c,new URLSearchParams()).includes('name="robots"'));
 const evil=libraryPage(c,new URLSearchParams('q=<script>alert(1)</script>'));assert.ok(!evil.includes('value="<script>'));
});
test('the real fingerprint integrity guard refuses mismatching clearance even if an article has the marker',async()=>{
 const c=await buildPublicCatalog([row],readArticle);assert.equal(c.articles.length,0);
});
test('Writer and independent Reviewer require grounded readability without prescribing a literal heading',()=>{
 const w=buildWriterInstruction({intentPlan:{},clearedSnapshot:{},existingClusterPages:[],route:'/test',cluster:'test'}),r=buildReviewerInstruction({plan:{},clearedSnapshot:{},intentPlan:{}});
 assert.match(w,/Explain technical vocabulary naturally/);assert.match(w,/No literal heading is required/);assert.match(w,/source_statements/);assert.match(r,/every substantive plain-language explanation/);
});

import {createHairReadabilityAllowance} from '../scripts/_lib/education-hair-readability-allowance.mjs';
test('editorial allowance persists before requests and cannot reset with another proposal head',()=>{
 let saved;const c=createHairReadabilityAllowance({persist:s=>saved=s});
 const body={model:'claude-sonnet-5',max_tokens:8000,system:'Grounded review'};
 c.reserve(body);assert.equal(saved.requests,1);assert.equal(saved.requests_with_unknown_usage,1);assert.equal(saved.budget_usd,.5);
 const second=createHairReadabilityAllowance({previous:saved});second.reserve(body);
 const third=createHairReadabilityAllowance({previous:second.summary()});assert.throws(()=>third.reserve(body),e=>e.code==='SPEND_LIMIT');
 assert.throws(()=>createHairReadabilityAllowance({previous:{...saved,task:'different'}}),/IDENTITY/);
 assert.equal(third.maxAffordableOutputTokens(body,8000),0);
});

test('legacy published article discovery does not authorize uncaptured study metadata',async()=>{
 const legacy={...row,publication_clearance:null};const c=await buildPublicCatalog([legacy],readArticle);
 assert.equal(c.articles.length,1);assert.equal(c.studies.length,0);
});
