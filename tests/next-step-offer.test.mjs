import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/js/aimt-next-step-offer.js',import.meta.url),'utf8');
function setup(){
 const elements=Object.fromEntries(['name','label','founder','availability','action'].map(k=>[k,{textContent:'',hidden:false}]));
 const pending=[];let interval;
 const root={querySelector:s=>elements[s.match(/data-next-step-(\w+)/)[1]]};
 vm.runInNewContext(source,{document:{hidden:false,getElementById:()=>root,addEventListener(){}},fetch:(url,options)=>{assert.equal(url,'/api/founder-review/offer');assert.equal(options.cache,'no-store');assert.equal(options.method,undefined);return new Promise((resolve,reject)=>pending.push({resolve,reject}));},AbortSignal:{timeout:()=>({})},setInterval:fn=>{interval=fn;}});
 return {elements,pending,refresh:()=>interval(),answer:async(i,data,ok=true)=>{pending[i].resolve({ok,json:async()=>data});await new Promise(setImmediate);}};
}
test('Only confirmed active five-place offers show a founder bonus; permanent bonus does not depend on it',async()=>{
 for(const remaining of [1,5]){const s=setup();assert.equal(s.elements.founder.hidden,true);await s.answer(0,{active:true,capacity:5,remaining});assert.equal(s.elements.founder.hidden,false);assert.match(s.elements.availability.textContent,new RegExp('Only '+remaining));assert.equal(s.elements.name.textContent,'Head Spa Head Start');}
});
test('Sold-out, inactive, malformed, non-integer and HTTP failures hide limited offer',async()=>{
 for(const data of [null,{}, {active:false,capacity:5,remaining:5},...[0,-1,6,1.5,'5'].map(remaining=>({active:true,capacity:5,remaining})),{active:true,capacity:10,remaining:5}]){const s=setup();await s.answer(0,data);assert.equal(s.elements.founder.hidden,true);assert.equal(s.elements.availability.hidden,true);assert.equal(s.elements.action.textContent,'Start My Training');}
 const s=setup();await s.answer(0,{active:true,capacity:5,remaining:5},false);assert.equal(s.elements.founder.hidden,true);
});
test('Refresh removes sold-out bonus and stale responses cannot restore it',async()=>{
 const s=setup();await s.answer(0,{active:true,capacity:5,remaining:5});s.refresh();s.refresh();await s.answer(2,{active:true,capacity:5,remaining:0});await s.answer(1,{active:true,capacity:5,remaining:5});assert.equal(s.elements.founder.hidden,true);
 s.refresh();s.pending[3].reject(new Error('timeout'));await new Promise(setImmediate);assert.equal(s.elements.founder.hidden,true);
});
test('No matching presentation means no request',()=>{vm.runInNewContext(source,{document:{getElementById:()=>null},fetch:()=>assert.fail('unexpected request')});});
