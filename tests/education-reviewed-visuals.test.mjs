import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(read('functions/_data/education-visual-reviews/manifest.json'));
test('each exact illustration has an independent PASS and unchanged reviewed asset',()=>{
 assert.equal(manifest.source_run_id,42654391453);assert.equal(manifest.source_artifact_id,13690823512);
 for(const [asset,proof] of Object.entries(manifest.reviews)){
  const review=JSON.parse(read(proof.review_file));assert.equal(review.ok,true);assert.equal(review.output.outcome,'PASS');assert.equal(review.candidate_head,proof.candidate_head||manifest.candidate_head);
  assert.equal(hash(read('assets/images/education/'+asset)),proof.asset_sha256);
 }
});
test('visual additions preserve every byte of previously published article content',()=>{
 assert.equal(manifest.pages.length,5);
 for(const page of manifest.pages){
  assert.ok(manifest.reviews[page.asset]);const html=read(page.path).toString();assert.equal(hash(html),page.updated_sha256);
  assert.equal(html.split(page.figure_html).length,2,'exact approved figure appears once');
  assert.equal(hash(html.replace(page.figure_html,'')),page.original_sha256,'no prose/citation/metadata drift');
  assert.ok(page.figure_html.includes('/assets/images/education/'+page.asset));
  assert.match(page.figure_html,/alt="[^"]+"/);assert.match(page.figure_html,/width="\d+" height="\d+"/);assert.ok(page.figure_html.includes('Simplified')||page.figure_html.includes('simplified')||page.figure_html.includes('Conceptual')||page.figure_html.includes('Normal-cycle'));
 }
});
