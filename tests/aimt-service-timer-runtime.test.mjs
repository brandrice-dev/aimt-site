// Real production timer script exercised with a deterministic DOM + clock.
// No services, credentials, browser network calls, or third-party packages.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../aimt-service-timer.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
const timerScript=scripts.at(-1)?.[1];
assert.ok(timerScript?.includes('function tick()'),'Expected live inline service timer script');

function harness(format='extended'){
 let ms=0,nextTimer=0;
 const events=new Map(),nodes=new Map(),intervals=new Map();
 class ClassList {
  values=new Set();
  add(...names){for(const name of names)this.values.add(name);}
  remove(...names){for(const name of names)this.values.delete(name);}
  contains(name){return this.values.has(name);}
  toggle(name,force){const wants=force??!this.values.has(name);if(wants)this.values.add(name);else this.values.delete(name);return wants;}
 }
 function el(id) {
  if(!nodes.has(id)) nodes.set(id,{
   id,style:{},classList:new ClassList(),textContent:'',innerHTML:'',
   disabled:false,attributes:{},setAttribute(k,v){this.attributes[k]=String(v);},
   addEventListener(name,fn){events.set(id+':'+name,fn);},
   focus(){},scrollTo(){},scrollIntoView(){},getAttribute(k){return this.attributes[k];}
  });
  return nodes.get(id);
 }
 const document={
  getElementById:el,querySelectorAll:()=>[],addEventListener:(name,fn)=>events.set('document:'+name,fn),
  body:el('body'),documentElement:{requestFullscreen:()=>Promise.resolve()},hidden:false,fullscreenElement:null
 };
 const window={addEventListener:(name,fn)=>events.set('window:'+name,fn)};
 class FakeDate extends Date {static now(){return ms;}}
 const sandbox={window,document,navigator:{},Date:FakeDate,console,
  setInterval:(cb)=>{const id=++nextTimer;intervals.set(id,cb);return id;},
  clearInterval:id=>intervals.delete(id),
  setTimeout:()=>++nextTimer,clearTimeout:()=>{},
 };
 const ctx=vm.createContext(sandbox);
 vm.runInContext(timerScript,ctx,{filename:'aimt-service-timer.html'});
 const run=code=>vm.runInContext(code,ctx);
 const state=()=>run('session');
 const clock=()=>({step:el('step-time').textContent,overall:el('service-remaining').textContent,
  elapsed:el('service-elapsed').textContent,overLabel:el('service-label').textContent});
 function advance(seconds){ms+=seconds*1000;run('tick()');}
 function begin(){run("openTimer('"+format+"');manualNext();manualNext();manualNext()");assert.equal(state().treatmentStarted,true);}
 function currentStep(){return run('stepsFor()[session.currentIndex].id');}
 return {run,state,clock,advance,begin,currentStep,el,events,intervals,
  addWallSeconds(seconds){ms+=seconds*1000;},
  get now(){return ms;}
 };
}

test('the protocols preserve exactly their approved 60- and 90-minute allocations',()=>{
 for(const format of ['core','extended']){
  const t=harness(format);t.begin();
  const s=t.state();assert.equal(s.protocol.timed.reduce((sum,step)=>sum+step.duration,0),format==='core'?3600:5400);
  assert.equal(t.clock().step,'15:00');assert.equal(t.clock().overall,format==='core'?'60:00':'90:00');
 }
});
test('reproduces the technician screenshot without the wrong 62:01 countdown',()=>{
 const t=harness('extended');t.begin();t.advance(59);
 for(let i=0;i<4;i++)t.run('manualNext()'); // Step 03 -> Step 07
 assert.equal(t.currentStep(),'07');assert.equal(t.clock().overall,'89:01');
 assert.equal(t.clock().elapsed,'0:59');assert.equal(t.clock().step,'3:00');
 assert.equal(t.state().stepDeadlineElapsed,239);
 assert.match(t.el('step-meta').innerHTML,/3:00 reference/);
 t.advance(179);assert.equal(t.clock().step,'0:01');assert.equal(t.currentStep(),'07');
 t.advance(1);assert.equal(t.currentStep(),'08');assert.equal(t.clock().step,'7:00');
 assert.equal(t.clock().overall,'86:01');
});
test('manual Advance resets the new step without fabricating elapsed service minutes',()=>{
 const t=harness('core');t.begin();t.advance(90);
 const before=t.clock();t.run('manualNext()');
 assert.equal(t.currentStep(),'04');assert.equal(t.clock().step,'3:00');
 assert.equal(t.clock().elapsed,before.elapsed);assert.equal(t.clock().overall,before.overall);
 t.advance(180);assert.equal(t.currentStep(),'05');assert.equal(t.clock().step,'10:00');
});
test('automatic advancement follows reference timings when not manually changed',()=>{
 const t=harness('extended');t.begin();
 t.advance(899);assert.equal(t.currentStep(),'03');assert.equal(t.clock().step,'0:01');
 t.advance(1);assert.equal(t.currentStep(),'04');assert.equal(t.clock().step,'5:00');
 t.advance(300);assert.equal(t.currentStep(),'05');assert.equal(t.clock().step,'10:00');
 t.advance(600);assert.equal(t.currentStep(),'06');assert.equal(t.clock().step,'30:00');
 t.advance(1800);assert.equal(t.currentStep(),'07');assert.equal(t.clock().step,'3:00');
});
test('automatic catch-up over multiple steps is reliable after pagehide/pageshow',()=>{
 const t=harness();t.begin();
 t.events.get('window:pagehide')();assert.equal(t.intervals.size,0);
 t.addWallSeconds(21*60);
 t.events.get('window:pageshow')();
 assert.equal(t.currentStep(),'05');assert.equal(t.clock().overall,'69:00');
 assert.equal(t.clock().step,'9:00');
 assert.ok(t.intervals.size>0);
});
test('pausing freezes both clocks; resuming preserves exact remaining time',()=>{
 const t=harness('core');t.begin();t.advance(60);
 t.run('pauseSession()');const previous=t.clock();
 t.addWallSeconds(600);t.run('tick()');
 assert.deepEqual(t.clock(),previous);
 t.run('resumeSession()');t.advance(30);
 assert.equal(t.clock().step,'13:30');assert.equal(t.clock().overall,'58:30');
});
test('Back restarts the prior step, not the whole treatment or the wall clock',()=>{
 const t=harness('extended');t.begin();t.advance(70);
 t.run('manualNext()');assert.equal(t.currentStep(),'04');
 t.run('manualBack()');assert.equal(t.currentStep(),'03');
 assert.equal(t.clock().step,'15:00');assert.equal(t.clock().overall,'88:50');
 t.run('manualBack()');assert.equal(t.currentStep(),'03'); // no return to pre-timer while running
});
test('without manual changes both formats finish at the actual reference time',()=>{
 for(const format of ['core','extended']){
  const t=harness(format);t.begin();t.advance(format==='core'?3600:5400);
  assert.equal(t.state().completed,true);assert.equal(t.el('complete-screen').classList.contains('show'),true);
  assert.match(t.el('complete-time').textContent,format==='core'?/Actual 60:00 · Reference 60:00/:/Actual 90:00 · Reference 90:00/);
 }
});
test('manually skipped steps finish early honestly, never claiming 90 elapsed minutes',()=>{
 const t=harness();t.begin();
 for(let i=0;i<8;i++)t.run('manualNext()');
 assert.equal(t.currentStep(),'11');assert.equal(t.clock().step,'2:00');
 t.advance(120);assert.equal(t.state().completed,true);
 assert.match(t.el('complete-time').textContent,/Actual 2:00 · Reference 90:00/);
});
test('repeating or extending a step can run over reference without fake completion',()=>{
 const t=harness();t.begin();t.advance(60);t.run('manualNext()');t.run('manualBack()');
 t.advance(90*60);
 assert.equal(t.state().completed,true);
 assert.equal(t.clock().elapsed,'91:00');
 assert.match(t.el('complete-time').textContent,/Actual 91:00 · Reference 90:00/);
});
test('the page explains manual timing; time-zero step means zero, not a static landmark',()=>{
 assert.match(html,/Manual Advance<\/strong>/);
 assert.match(html,/overall service clock continues uninterrupted/);
 assert.ok(!timerScript.includes('scheduledGlobalIndex'));
 assert.ok(!timerScript.includes('captureRingBaseline'));
});
