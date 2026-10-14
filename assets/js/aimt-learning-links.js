// Links only. Navigation never grants entitlement, unlocks a module, completes
// a checkpoint, or writes course progress. Use the existing module router.
(()=>{
 const topics={3:'hair-biology',5:'scalp-health',6:'scalp-microbiome',10:'infection-control'};
 function href(mid) {const p=new URLSearchParams();if(/^(?:[0-9]|1[01])$/.test(String(mid)))p.set('return_module',String(mid));if(topics[mid])p.set('topic',topics[mid]);return '/my-aimt/research'+(p.size?'?'+p:'');}
 function update() {
  const home=document.querySelector('#courseHome .ch-topbar');
  if(home && !home.querySelector('[data-aimt-research-link]')) {const link=document.createElement('a');link.dataset.aimtResearchLink='';link.className='brand-dash-link';link.textContent='Research Library';link.href='/my-aimt/research';link.target='_blank';link.rel='noopener';home.append(link);}
  const nav=document.querySelector('#lessonView .lesson-nav');if(!nav)return;
  const mid=window.APP_STATE?.data?.guide?.currentModule;
  let link=nav.querySelector('[data-aimt-research-link]');
  if(!link){link=document.createElement('a');link.dataset.aimtResearchLink='';link.className='ln-dash';link.textContent='Research';link.title='Explore the Research';link.target='_blank';link.rel='noopener';nav.append(link);}
  link.hidden=String(mid)==='12';link.href=href(mid);
 }
 const view=document.getElementById('lessonView'),title=document.getElementById('lessonNavTitle');
 if(view)new MutationObserver(update).observe(view,{attributes:true,attributeFilter:['class']});
 if(title)new MutationObserver(update).observe(title,{childList:true,characterData:true,subtree:true});
 update();
})();
