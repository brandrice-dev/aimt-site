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

function harness(format='extended',{mobile=true,reducedMotion=false}={}){
 let ms=0,nextTimer=0;
 const events=new Map(),nodes=new Map(),intervals=new Map(),animations=new Map(),observers=[];
 const motion={value:reducedMotion,listeners:[]};
 class ClassList {
  values=new Set();
  add(...names){for(const name of names)this.values.add(name);}
  remove(...names){for(const name of names)this.values.delete(name);}
  contains(name){return this.values.has(name);}
  toggle(name,force){const wants=force??!this.values.has(name);if(wants)this.values.add(name);else this.values.delete(name);return wants;}
 }
 function el(id) {
  if(!nodes.has(id))nodes.set(id,{
   id,style:{},classList:new ClassList(),textContent:'',innerHTML:'',
   scrollHeight:id==='timer-main'?1500:0,
   clientHeight:id==='timer-main'?600:0,scrollTop:0,
   disabled:false,attributes:{},setAttribute(k,v){this.attributes[k]=String(v);},
   addEventListener(name,fn){events.set(id+':'+name,fn);},
   focus(){},scrollTo({top}){this.scrollTop=top;},scrollIntoView(){},
   getAttribute(k){return this.attributes[k];}
  });
  return nodes.get(id);
 }
 const document={
  getElementById:el,querySelectorAll:()=>[],addEventListener:(name,fn)=>events.set('document:'+name,fn),
  body:el('body'),documentElement:{requestFullscreen:()=>Promise.resolve()},hidden:false,fullscreenElement:null
 };
 const window={
  addEventListener:(name,fn)=>events.set('window:'+name,fn),
  matchMedia:(query)=>query.includes('prefers-reduced-motion')
    ? {get matches(){return motion.value;},addEventListener:(_,fn)=>motion.listeners.push(fn)}
    : {matches:mobile}
 };
 class FakeDate extends Date {static now(){return ms;}}
 class FakeResizeObserver {
   constructor(callback){this.callback=callback;this.observed=[];observers.push(this);}
   observe(element){this.observed.push(element);}
   disconnect(){this.observed=[];}
 }
 const sandbox={window,document,navigator:{},Date:FakeDate,console,ResizeObserver:FakeResizeObserver,
  setInterval:(cb)=>{const id=++nextTimer;intervals.set(id,cb);return id;},
  clearInterval:id=>intervals.delete(id),
  requestAnimationFrame:fn=>{const id=++nextTimer;animations.set(id,fn);return id;},
  cancelAnimationFrame:id=>animations.delete(id),
  setTimeout:()=>++nextTimer,clearTimeout:()=>{}
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
 function drawFrame(msPassed=100){
  ms+=msPassed;
  const pending=[...animations.values()];animations.clear();
  for(const fn of pending)fn(ms);
 }
 function drawFrames(count,msPassed=100){for(let i=0;i<count;i++)drawFrame(msPassed);}
 function setReducedMotion(value){motion.value=value;for(const fn of motion.listeners)fn({matches:value});}
 function notifyLayout(){for(const ob of observers)ob.callback(ob.observed.map(target=>({target})),ob);}
 return {run,state,clock,advance,begin,currentStep,el,events,intervals,animations,observers,
  drawFrame,drawFrames,setReducedMotion,notifyLayout,
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
 assert.equal(t.clock().overall,'89:01'); // Before any manual skip
 for(let i=0;i<4;i++)t.run('manualNext()'); // Step 03 -> Step 07
 assert.equal(t.currentStep(),'07');assert.equal(t.clock().overall,'30:00');
 assert.equal(t.clock().elapsed,'0:59');assert.equal(t.clock().step,'3:00');
 assert.equal(t.state().stepDeadlineElapsed,239);
 assert.match(t.el('step-meta').innerHTML,/3:00 reference/);
 t.advance(179);assert.equal(t.clock().step,'0:01');assert.equal(t.currentStep(),'07');
 t.advance(1);assert.equal(t.currentStep(),'08');assert.equal(t.clock().step,'7:00');
 assert.equal(t.clock().overall,'27:00');
});
test('manual Advance resets the new step without fabricating elapsed service minutes',()=>{
 const t=harness('core');t.begin();t.advance(90);
 const before=t.clock();t.run('manualNext()');
 assert.equal(t.currentStep(),'04');assert.equal(t.clock().step,'3:00');
 assert.equal(t.clock().elapsed,before.elapsed);assert.equal(t.clock().overall,'45:00');
 assert.equal(before.overall,'58:30'); // Step 03's unused 13:30 was skipped
 t.advance(180);assert.equal(t.currentStep(),'05');assert.equal(t.clock().step,'10:00');
 assert.equal(t.clock().overall,'42:00');
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
 assert.equal(t.clock().step,'15:00');assert.equal(t.clock().overall,'90:00');
 assert.equal(t.clock().elapsed,'1:10'); // Back restores step time, never reverses actual elapsed
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
 assert.match(html,/Only unused time left in the step you skipped is deducted/);
 assert.ok(!timerScript.includes('scheduledGlobalIndex'));
 assert.ok(!timerScript.includes('captureRingBaseline'));
});

test('deducts the unused five minutes, never the original 15-minute allocation',()=>{
 const t=harness('extended');t.begin();
 t.advance(10*60);
 assert.equal(t.clock().step,'5:00');
 assert.equal(t.clock().overall,'80:00');
 assert.equal(t.clock().elapsed,'10:00');
 t.run('manualNext()');
 assert.equal(t.currentStep(),'04');
 assert.equal(t.clock().step,'5:00');
 assert.equal(t.clock().overall,'75:00');
 assert.equal(t.clock().elapsed,'10:00');
 assert.match(t.el('transition-toast').textContent,/Skipped 5:00/);
 assert.equal(t.el('timer-track').getAttribute('aria-valuenow'),'17');
 // After working two of Step 04's five minutes, only three are skipped.
 t.advance(2*60);
 assert.equal(t.clock().step,'3:00');
 assert.equal(t.clock().overall,'73:00');
 t.run('manualNext()');
 assert.equal(t.currentStep(),'05');
 assert.equal(t.clock().overall,'70:00');
 assert.equal(t.clock().elapsed,'12:00');
 assert.match(t.el('transition-toast').textContent,/Skipped 3:00/);
});
test('both formats calculate projected remaining from unfinished steps after rapid manual advances',()=>{
 for(const [format,remainingAt07] of [['core','20:00'],['extended','30:00']]){
  const t=harness(format);t.begin();t.advance(60);
  for(let i=0;i<4;i++)t.run('manualNext()');
  assert.equal(t.currentStep(),'07');
  assert.equal(t.clock().overall,remainingAt07);
  assert.equal(t.clock().elapsed,'1:00');
 }
});
test('service time is not subtracted twice when a step auto advances',()=>{
 const t=harness();t.begin();
 t.advance(900);assert.equal(t.currentStep(),'04');
 assert.equal(t.clock().overall,'75:00');
 t.advance(300);assert.equal(t.currentStep(),'05');
 assert.equal(t.clock().overall,'70:00');
 t.advance(1);assert.equal(t.clock().overall,'69:59');
});
test('manual Back restores the full reference step and clearly updates service remaining',()=>{
 const t=harness('extended');t.begin();t.advance(600);t.run('manualNext()');
 assert.equal(t.clock().overall,'75:00');
 t.advance(2*60);assert.equal(t.clock().overall,'73:00');
 t.run('manualBack()');
 assert.equal(t.clock().step,'15:00');
 assert.equal(t.clock().overall,'90:00');
 assert.equal(t.clock().elapsed,'12:00');
});
test('pause freezes projected remaining even after an early manual advance',()=>{
 const t=harness('extended');t.begin();t.advance(600);t.run('manualNext()');
 t.run('pauseSession()');
 const paused=t.clock();t.addWallSeconds(300);t.run('tick()');
 assert.deepEqual(t.clock(),paused);
 t.run('resumeSession()');t.advance(60);
 assert.equal(t.clock().overall,'74:00');
 assert.equal(t.clock().elapsed,'11:00');
});


test('phone enables optional hands-free mode and gently scrolls both directions',()=>{
 const t=harness('core');
 t.run("openTimer('core')");
 const content=t.el('timer-main'),toggle=t.el('auto-scroll-btn');
 assert.equal(toggle.textContent,'Auto-scroll On');
 assert.equal(toggle.getAttribute('aria-pressed'),'true');
 assert.equal(content.scrollTop,0);
 t.drawFrames(18);assert.equal(content.scrollTop,0); // two-second reading pause
 t.drawFrames(12);assert.ok(content.scrollTop>0 && content.scrollTop<100);
 let reachedBottom=false,reversed=false;
 for(let i=0;i<700;i++){
  const old=content.scrollTop;t.drawFrame();
  if(content.scrollTop===900)reachedBottom=true;
  if(reachedBottom && content.scrollTop<old)reversed=true;
 }
 assert.ok(reachedBottom,'It reaches the bottom of the real overflow');
 assert.ok(reversed,'After a dwell it reverses back toward the top');
});
test('manual and automatic step changes restart hands-free reading from top',()=>{
 const t=harness('extended');t.begin();
 t.drawFrames(85);assert.ok(t.el('timer-main').scrollTop>0);
 t.run('manualNext()');
 assert.equal(t.el('timer-main').scrollTop,0);
 assert.equal(t.currentStep(),'04');
 t.drawFrames(85);assert.ok(t.el('timer-main').scrollTop>0);
 // 8.5 seconds of the step passed while reading the panel, so
 // advance by exactly the 291.5 seconds still remaining in this step.
 t.advance(291.5);assert.equal(t.currentStep(),'05');
 assert.equal(t.el('timer-main').scrollTop,0);
 assert.equal(t.clock().step,'10:00');
 assert.equal(t.clock().overall,'70:00');
});
test('pause and resume halt and restore scrolling without resetting the reading position',()=>{
 const t=harness('core');t.begin();t.drawFrames(90);
 const content=t.el('timer-main'),position=content.scrollTop;
 assert.ok(position>0);
 t.run('pauseSession()');assert.equal(t.animations.size,0);
 t.drawFrames(300);assert.equal(content.scrollTop,position);
 t.run('resumeSession()');assert.equal(content.scrollTop,position);
 t.drawFrames(30);assert.ok(content.scrollTop>position);
});
test('manual scrolling pauses the motion temporarily without disabling the mode',()=>{
 const t=harness('core');t.run("openTimer('core')");t.drawFrames(90);
 const content=t.el('timer-main');const position=content.scrollTop;
 t.events.get('timer-main:wheel')();
 t.drawFrames(45);assert.equal(content.scrollTop,position);
 t.drawFrames(20);assert.ok(content.scrollTop>position);
 assert.equal(t.el('auto-scroll-btn').getAttribute('aria-pressed'),'true');
});
test('auto scroll can be disabled, and respects the device reduced-motion setting',()=>{
 const t=harness('core');t.run("openTimer('core')");
 t.run('toggleAutoScroll()');assert.equal(t.el('auto-scroll-btn').textContent,'Auto-scroll Off');
 assert.equal(t.animations.size,0);
 t.drawFrames(100);assert.equal(t.el('timer-main').scrollTop,0);
 t.run('toggleAutoScroll()');t.drawFrames(85);
 assert.ok(t.el('timer-main').scrollTop>0);
 t.setReducedMotion(true);
 assert.equal(t.animations.size,0);
 assert.equal(t.el('auto-scroll-btn').disabled,true);
 assert.equal(t.el('auto-scroll-btn').getAttribute('aria-pressed'),'false');
 const previous=t.el('timer-main').scrollTop;t.drawFrames(100);
 assert.equal(t.el('timer-main').scrollTop,previous);
 const preferred=harness('core',{reducedMotion:true});
 preferred.run("openTimer('core')");
 assert.equal(preferred.el('auto-scroll-btn').disabled,true);
 assert.equal(preferred.animations.size,0);
});
test('desktop starts hands free by default but avoids scrolling if nothing overflows',()=>{
 const t=harness('core',{mobile:false});t.run("openTimer('core')");
 assert.equal(t.el('auto-scroll-btn').getAttribute('aria-pressed'),'true');
 assert.equal(t.el('auto-scroll-btn').textContent,'Auto-scroll On');
 assert.ok(t.animations.size>0);
 t.el('timer-main').scrollHeight=400;
 t.drawFrame();
 assert.equal(t.animations.size,0);
 assert.equal(t.el('timer-main').scrollTop,0);
 t.run('toggleAutoScroll()');
 assert.equal(t.el('auto-scroll-btn').getAttribute('aria-pressed'),'false');
 assert.equal(t.el('auto-scroll-btn').textContent,'Auto-scroll Off');
 assert.equal(t.animations.size,0);
});
test('page hide/return restores hands-free motion without jumping forward',()=>{
 const t=harness();t.run("openTimer('extended')");t.drawFrames(85);
 const content=t.el('timer-main'),before=content.scrollTop;
 assert.ok(before>0);
 t.events.get('window:pagehide')();
 assert.equal(t.animations.size,0);
 t.addWallSeconds(120);
 t.events.get('window:pageshow')();
 assert.ok(t.animations.size>0);
 t.drawFrame(100);
 assert.ok(content.scrollTop>=before && content.scrollTop-before<1);
});
test('completion, exit and discard never leave a hidden motion loop running',()=>{
 const t=harness('core');t.begin();
 assert.ok(t.animations.size>0);
 t.run('openExitDialog()');assert.equal(t.animations.size,0);
 t.run('cancelExit()');assert.ok(t.animations.size>0);
 t.run('confirmExit()');assert.equal(t.animations.size,0);
 t.run("openTimer('core',true)");
 t.run('resumeSession()');
 t.advance(3600);assert.equal(t.state().completed,true);
 assert.equal(t.animations.size,0);
 t.run('discardSession()');assert.equal(t.animations.size,0);
});
test('hands-free movement is confined to content and never changes service timing functions',()=>{
 assert.match(html,/id="auto-scroll-btn"/);
 assert.match(html,/Hands-free auto-scroll/);
 assert.match(timerScript,/ALL\.main\.scrollTop=/);
 assert.doesNotMatch(timerScript,/document\.documentElement\.scrollTop=/);
 assert.match(timerScript,/AUTO_SCROLL_EDGE_DWELL_MS/);
});

test('each new service restores the hands-free default after opt-out',()=>{
 const t=harness('core',{mobile:false});
 t.begin();
 assert.equal(t.el('auto-scroll-btn').getAttribute('aria-pressed'),'true');
 t.run('toggleAutoScroll()');
 assert.equal(t.el('auto-scroll-btn').getAttribute('aria-pressed'),'false');
 t.run('manualNext()');
 assert.equal(t.el('auto-scroll-btn').getAttribute('aria-pressed'),'false');
 t.advance(3600);
 assert.equal(t.state().completed,true);
 t.run('resetToNewService()');
 assert.equal(t.el('auto-scroll-btn').getAttribute('aria-pressed'),'true');
 assert.equal(t.el('auto-scroll-btn').textContent,'Auto-scroll On');
 assert.ok(t.animations.size>0);
});


test('a two-second pause leads to visible scrolling while the actual service clock is independent',()=>{
 const t=harness('core');t.begin();
 const start=t.clock(),main=t.el('timer-main');
 t.drawFrames(18);assert.equal(main.scrollTop,0);
 t.drawFrames(20);assert.ok(main.scrollTop>5 && main.scrollTop<100);
 assert.equal(t.clock().step,start.step); // The harness only ticks the service clock on tick()
 assert.equal(t.el('auto-scroll-btn').getAttribute('aria-pressed'),'true');
});
test('real layout observer restarts scrolling when text begins to overflow after initial render',()=>{
 const t=harness('extended');
 const main=t.el('timer-main');
 main.scrollHeight=main.clientHeight;
 t.run("openTimer('extended')");
 assert.equal(t.animations.size,0);
 assert.equal(t.observers.length,1);
 main.scrollHeight=main.clientHeight+500;
 t.notifyLayout();
 assert.ok(t.animations.size>0,'A resize/layout change must restart scrolling');
 t.drawFrames(30);
 assert.ok(main.scrollTop>0,'Scrolling becomes visible after the two-second dwell');
});
