import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {blueprintPayload,normalizeBlueprint,BLUEPRINT_FIELDS} from '../assets/js/aimt-first-service-blueprint-core.mjs';
const html=readFileSync(new URL('../first-service-blueprint.html',import.meta.url),'utf8');
const source=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import .*;\n/m,'');
function page(storage=new Map(),blocked=false){
  const elements=Object.fromEntries(Object.keys(BLUEPRINT_FIELDS).map(k=>[k,{value:''}]));
  const nodes={bpForm:{elements,reset(){for(const e of Object.values(elements))e.value='';}},bpStatus:{textContent:''}};
  const handlers={};
  for(const id of ['bpForm','bpExport','bpImport','bpClear','bpPrint']){
    nodes[id]??={};nodes[id].addEventListener=(event,fn)=>handlers[id+':'+event]=fn;
  }
  const access=()=>{if(blocked)throw Error('blocked');};
  const context={document:{getElementById:id=>nodes[id]},localStorage:{getItem:k=>{access();return storage.get(k)||null;},setItem:(k,v)=>{access();storage.set(k,v);},removeItem:k=>{access();storage.delete(k);}},window:{addEventListener:(e,fn)=>handlers[e]=fn,confirm:()=>true},blueprintPayload,normalizeBlueprint,BLUEPRINT_FIELDS};
  vm.runInNewContext(source,context);
  return {nodes,handlers,storage};
}
test('editing survives a new page; clear removes the saved draft',()=>{
  const a=page();a.nodes.bpForm.elements.practice.value='My service';a.handlers['bpForm:input']();
  const b=page(a.storage);assert.equal(b.nodes.bpForm.elements.practice.value,'My service');
  b.handlers['bpClear:click']();assert.equal(a.storage.size,0);
  assert.equal(page(a.storage).nodes.bpForm.elements.practice.value,'');
});
test('blocked storage warns and protects unsaved edits on leaving',()=>{
  const p=page(new Map(),true);p.nodes.bpForm.elements.practice.value='Plan';p.handlers['bpForm:input']();
  assert.match(p.nodes.bpStatus.textContent,/could not save/);
  let protectedDraft=false;p.handlers.beforeunload({preventDefault(){protectedDraft=true;}});assert.equal(protectedDraft,true);
});
test('invalid stored content is not restored into fields',()=>{
  const p=page(new Map([['aimt-first-service-blueprint-draft-v1','{"version":100,"fields":{}}']]));
  assert.equal(p.nodes.bpForm.elements.practice.value,'');assert.match(p.nodes.bpStatus.textContent,/could not be restored/);
});
test('autosave adds no upload or network request',()=>{
  assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|sendBeacon/);
});
