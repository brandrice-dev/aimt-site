// Public presentation only. Availability and bonus allocation remain server-owned.
(function(){
 'use strict';
 const root=document.getElementById('nextStepOffer');if(!root)return;
 const name=root.querySelector('[data-next-step-name]');
 const label=root.querySelector('[data-next-step-label]');
 const founder=root.querySelector('[data-next-step-founder]');
 const availability=root.querySelector('[data-next-step-availability]');
 const action=root.querySelector('[data-next-step-action]');
 let sequence=0,last=Symbol('initial');
 function show(remaining){
  if(Object.is(last,remaining))return;last=remaining;
  const active=Number.isInteger(remaining)&&remaining>0;
  name.textContent=active?'Head Spa Head Start':'Head Spa Certification';
  label.textContent=active?'Bonus package · Limited founder sessions':'Your course + included bonus';
  founder.hidden=!active;availability.hidden=!active;
  availability.textContent=active?'Only '+remaining+' '+(remaining===1?'founder session remains.':'founder sessions remain.')+' Availability confirmed at checkout.':'';
  action.textContent=active?'Give me a Head Start':'Start My Training';
 }
 async function refresh(){
  const request=++sequence;
  try{
   const response=await fetch('/api/founder-review/offer',{cache:'no-store',signal:AbortSignal.timeout(10000)});
   const data=await response.json();
   if(request!==sequence)return;
   const valid=response.ok&&data&&data.active===true&&data.capacity===5&&Number.isInteger(data.remaining)&&data.remaining>=0&&data.remaining<=5;
   show(valid?data.remaining:null);
  }catch{if(request===sequence)show(null);}
 }
 show(null);refresh();
 setInterval(()=>{if(!document.hidden)refresh();},60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
})();
