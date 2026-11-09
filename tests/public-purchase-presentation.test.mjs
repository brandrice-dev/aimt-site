import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('checkout package only includes founder call on strict server confirmation, and resets on subsequent load',()=>{
 const name={textContent:''},founder={hidden:false},applied={hidden:false};let marked=false;const panel={classList:{toggle(_,value){marked=value;}}};const window={};
 const elements={enrollPackageName:name,enrollFounderPackage:founder,enrollPackageApplied:applied,enrollPackage:panel};
 vm.runInNewContext(read('assets/js/aimt-enrollment-package.js'),{window,document:{getElementById:id=>elements[id]}});
 assert.equal(founder.hidden,true);assert.equal(applied.hidden,true);assert.equal(marked,false);
 window.AIMTEnrollmentPackage.render(true);
 assert.equal(founder.hidden,false);assert.equal(applied.hidden,false);assert.equal(marked,true);assert.match(name.textContent,/Head Spa Head Start/);
 for(const value of [false,undefined,null,1,'true',{}]){
  window.AIMTEnrollmentPackage.render(value);assert.equal(founder.hidden,true);assert.equal(applied.hidden,true);assert.equal(marked,false);assert.doesNotMatch(name.textContent,/Head Start/);
 }
 window.AIMTEnrollmentPackage.render(true);window.AIMTEnrollmentPackage.render(false);assert.equal(founder.hidden,true);
});
test('sticky bar respects hero, final action and dynamically inserted offer without observing its own button',()=>{
 const source=read('headspa-mastery.html').split('/* Presentation only: show the mobile purchase bar')[1].split('/* Product tour tab switcher')[0];
 const code=source.slice(source.indexOf('(function ()'),source.lastIndexOf('})();')+5);
 const hero={},final={},offer={};let targets=[hero,final],intersect,mutate;const observed=[];let hidden=false;
 const bar={classList:{add(){hidden=true;},toggle(_,value){hidden=value;}}};
 const root={querySelectorAll(selector){assert.match(selector,/lp-hero-cta-row/);assert.match(selector,/fo-cta/);assert.doesNotMatch(selector,/lp-mobile-sticky/);return targets;}};
 class IO{constructor(callback,opts){intersect=callback;assert.equal(opts.root,root);}observe(el){observed.push(el);}}
 class MO{constructor(callback){mutate=callback;}observe(){}}
 vm.runInNewContext(code,{window:{IntersectionObserver:IO},IntersectionObserver:IO,MutationObserver:MO,document:{getElementById:id=>id==='landingPage'?root:bar}});
 assert.equal(hidden,true);assert.deepEqual(observed,[hero,final]);
 intersect([{target:hero,isIntersecting:true}]);assert.equal(hidden,true);
 intersect([{target:hero,isIntersecting:false}]);assert.equal(hidden,false);
 targets=[hero,final,offer];mutate();mutate();assert.deepEqual(observed,[hero,final,offer]);
 intersect([{target:offer,isIntersecting:true}]);assert.equal(hidden,true);
 intersect([{target:offer,isIntersecting:false},{target:final,isIntersecting:true}]);assert.equal(hidden,true);
 intersect([{target:final,isIntersecting:false}]);assert.equal(hidden,false);
});
