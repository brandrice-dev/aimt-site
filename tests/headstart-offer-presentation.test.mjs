import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../assets/js/aimt-founder-offer.js',import.meta.url),'utf8');
async function render(payload,ok=true,reject=false){
 const nodes=new Map();let refresh;
 const node=()=>({hidden:false,textContent:'',className:'',classList:{toggle(){}},append(){},after(){},closest(){return {before(section){nodes.set('section',section);}}},querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector);}});
 const root=node();root.getClientRects=()=>[{}];root.querySelectorAll=()=>[];
 const document={hidden:false,head:node(),createElement:node,getElementById:()=>root,addEventListener(){}};
 vm.runInNewContext(source,{document,fetch:async()=>{if(reject)throw Error('offline');return {ok,json:async()=>payload};},AbortSignal:{timeout(){}},setInterval(fn){refresh=fn;}});
 refresh();await new Promise(setImmediate);return nodes;
}
test('permanent Sidekick and bundle remain when the founder offer is disabled, sold out or unavailable',async()=>{
 for(const [data,ok,reject] of [[{active:false},true,false],[{active:true,capacity:5,remaining:0},true,false],[{},false,false],[{},true,true]]){
  const nodes=await render(data,ok,reject);
  assert.equal(nodes.get('.fo-package-title').textContent,'Head Spa Certification Package');
  assert.equal(nodes.get('.fo-package-limit').hidden,true);
  assert.match(nodes.get('section').innerHTML,/Smart Service Sidekick/);
  assert.equal(nodes.get('.fo-session').hidden,true);
  assert.equal(nodes.get('.fo-corner-tab').hidden,true);
  assert.equal(nodes.get('.fo-package-extra').hidden,true);
 }
});
test('only valid server availability adds the limited session and uses correct singular/plural',async()=>{
 for(const remaining of [1,5]){
  const nodes=await render({active:true,capacity:5,remaining});
  assert.equal(nodes.get('.fo-session').hidden,false);
  assert.equal(nodes.get('.fo-corner-tab').hidden,false);
  assert.equal(nodes.get('.fo-package-title').textContent,'Head Spa Head Start Bonus Package');
  assert.equal(nodes.get('.fo-package-limit').hidden,false);
  assert.equal(nodes.get('.fo-package-extra').hidden,false);
  assert.equal(nodes.get('.fo-availability').textContent,remaining+(remaining===1?' founder session left':' founder sessions left'));
 }
 for(const remaining of [-1,6,1.5,'3']){
  const nodes=await render({active:true,capacity:5,remaining});
  assert.equal(nodes.get('.fo-session').hidden,true);
  assert.equal(nodes.get('.fo-corner-tab').hidden,true);
 }
});
