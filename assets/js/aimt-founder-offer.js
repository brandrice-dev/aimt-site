// Public offer presentation only. Availability and purchase eligibility are server-owned.
(function(){
 const root=document.getElementById('landingPage');if(!root)return;
 let section,note,summary;
 function hide(){if(section)section.remove();if(note)note.remove();if(summary)summary.remove();section=note=summary=null;}
 async function refresh(){
  try{
   const response=await fetch('/api/founder-review/offer',{cache:'no-store',signal:AbortSignal.timeout(10000)});
   const data=await response.json();if(!response.ok||data.active!==true||data.capacity!==5||!Number.isInteger(data.remaining)||data.remaining<0||data.remaining>5){hide();return;}
   if(!section){
    const style=document.createElement('link');style.rel='stylesheet';style.href='/assets/css/aimt-founder-offer.css';if(!document.querySelector('link[href="/assets/css/aimt-founder-offer.css"]'))document.head.append(style);
    section=document.createElement('section');section.className='fo-section';section.id='founderOffer';
    section.innerHTML='<div class="fo-inner"><div class="fo-head"><span class="fo-label">Included with your training</span><h2>Tools for your first service.</h2></div><div class="fo-grid"><article class="fo-timer"><img src="/assets/images/marketing/approved-service-timer-live.webp" width="1600" height="862" loading="lazy" alt="AIMT Service Timer with step timing and practitioner cues"><div class="fo-card-copy"><span class="fo-label">Included practitioner tool</span><h3>The AIMT Service Timer</h3><p>Follow the service steps, timing, and client cues while you work. Keep your training close when it is time to put it into practice.</p></div></article><article class="fo-founder"><span class="fo-label">Limited enrollment bonus</span><h3>Exclusive 1-on-1 with AIMT’s founder.</h3><p>A private, 45-minute call with Brandon, focused on your service plan and your questions.</p><ul><li>Personal feedback on your plan.</li><li>Answers to your specific questions.</li><li>Next steps for your first service.</li></ul><p class="fo-availability" role="status"></p><a class="fo-cta" href="/enroll">Begin enrollment →</a><p class="fo-terms">One review after certification and completion of your service plan. Checkout confirms whether the bonus is included. No change to tuition or the refund policy.</p></article></div></div>';
    const pricing=root.querySelector('.lp-pricing-includes');
    const anchor=pricing?.closest('.lp-section-band')||root.querySelector('.lp-final-close');
    if(anchor)anchor.before(section);else root.append(section);
    note=document.createElement('p');note.className='fo-hero-note';
    root.querySelector('.lp-hero-cta-row')?.after(note);
    summary=document.createElement('p');summary.className='fo-price-note';pricing?.append(summary);
   }
   const available=data.remaining>0;
   section.querySelector('.fo-founder').hidden=!available;
   section.querySelector('.fo-grid').classList.toggle('fo-timer-only',!available);
   note.hidden=summary.hidden=!available;
   if(available){
    section.querySelector('.fo-availability').textContent=data.remaining+' of 5 founder review bonuses currently available.';
    note.textContent=data.remaining+' founder review '+(data.remaining===1?'bonus':'bonuses')+' available with qualifying enrollment.';
    summary.textContent='When included at checkout: one private 45-minute founder review after certification.';
   }
  }catch{hide();}
 }
 refresh();
 setInterval(()=>{if(!document.hidden&&root.getClientRects().length)refresh();},60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&root.getClientRects().length)refresh();});
})();
