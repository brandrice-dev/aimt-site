import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {renderEducationPageHtml} from '../functions/_lib/education-ops/education-page-renderer.mjs';
import {collectAllProseUnits} from '../functions/_lib/education-ops/education-page-plan-schema.mjs';
test('published Hair Biology revision exactly matches the independently reviewed plan',()=>{
 const bytes=readFileSync(new URL('../functions/_data/education-page-plans/hair-biology.json',import.meta.url));
 const artifact=JSON.parse(bytes),proof=JSON.parse(readFileSync(new URL('../functions/_data/education-page-reviews/hair-biology.json',import.meta.url)));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),proof.plan_sha256);
 assert.equal(proof.verdict.outcome,'PASS');assert.equal(proof.original_snapshot_unchanged,true);
 assert.equal(proof.generation_source_hash,artifact.generation_source_hash);assert.equal(proof.original_candidate_artifact,11848689625);
 assert.deepEqual(collectAllProseUnits(artifact.plan).filter(x=>x.unit.kind==='PARAPHRASE').map(x=>x.location),proof.paraphrase_locations);
 assert.equal(readFileSync(new URL('../education/trichology/hair-biology.html',import.meta.url),'utf8'),renderEducationPageHtml(artifact.plan,{launchReady:true,generationSourceHash:artifact.generation_source_hash}));
 assert.ok(proof.cost_control.requests<=2);assert.ok(proof.cost_control.reserved_cost_estimate_usd<=.5);
});
