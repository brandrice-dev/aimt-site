// Presentation only. The course and Sidekick are always included; founder availability is server-owned.
(function(){
 const root=document.getElementById('landingPage');if(!root)return;
 const style=document.createElement('link');style.rel='stylesheet';style.href='/assets/css/aimt-founder-offer.css?v=headstart2';document.head.append(style);
 const section=document.createElement('section');section.className='fo-section';section.id='founderOffer';
 section.innerHTML=`<div class="lp-band-inner"><div class="fo-shell">
  <header class="fo-head"><span class="fo-label fo-offer-label">Your course + included bonus</span><h2 class="section-title fo-package-title">Head Spa Certification Package</h2><p class="fo-body">Get certified. Bring a guide into the treatment room. Start with a clear plan.</p><p class="fo-package-limit" hidden role="status"></p></header>
  <article class="fo-course"><span class="fo-number" aria-hidden="true">01</span><div><span class="fo-label">The foundation</span><h3>Head Spa Certification Course</h3><p>Complete training, practitioner resources, and lifetime access. Earn your AIMT credential by passing the assessment.</p></div></article>
  <div class="fo-grid">
   <article class="fo-sidekick" aria-labelledby="fo-sidekick-title"><div class="fo-card-copy"><span class="fo-label">02 · Your included bonus</span><h3 id="fo-sidekick-title">Smart Service Sidekick</h3><p class="fo-sidekick-lead">Know what comes next. Keep your service flowing.</p></div>
    <img src="/assets/images/marketing/approved-service-timer-live.webp" width="1600" height="862" loading="lazy" alt="Smart Service Sidekick showing step instructions, live pacing and client-response cues">
    <ul class="fo-benefits"><li><strong>What to do.</strong> Step-by-step instructions and reminders.</li><li><strong>How to pace it.</strong> Step countdowns, total timing, and upcoming transitions.</li><li><strong>What to say.</strong> Short answers when a client asks a question.</li><li><strong>Help while you work.</strong> Hands-free scrolling, pause, and resume.</li></ul><p class="fo-sidekick-foot">Included with every enrollment. Core 60-minute and Extended 90-minute reference formats. Your judgment and client needs come first.</p>
   </article>
   <article class="fo-session" hidden aria-labelledby="fo-session-title"><span class="fo-label">03 · Your limited bonus</span><h3 id="fo-session-title">A private session<br>with AIMT’s founder.</h3><p class="fo-session-intro">45 minutes, one-on-one with the founder of AIMT and co-owner of ATRIUM Head Spa &amp; Wellness.</p><ul class="fo-benefits"><li><strong>Review your Blueprint.</strong> See what’s ready and what needs work.</li><li><strong>Ask your questions.</strong> Talk through decisions for your business.</li><li><strong>Plan your next steps.</strong> Know what to do before your first service.</li></ul><div class="fo-allocation"><p class="fo-availability"></p><p>Only five enrollments include this session. After those places fill, the course and Sidekick remain available without it.</p></div><p class="fo-terms">Book after completing your certification and Blueprint. Bonus availability is confirmed at checkout.</p></article>
  </div>
  <div class="fo-package-close"><div><p class="fo-package-summary">Your course + Smart Service Sidekick.</p><p class="fo-package-extra" hidden>Plus your private founder session.</p></div><div class="fo-buy"><div class="fo-price">$597 <span>One payment. Bonuses included.</span></div><a class="fo-cta" href="/enroll">Give me a Head Start <span aria-hidden="true">→</span></a></div></div>
 </div></div>`;
 const pricing=root.querySelector('.lp-pricing-includes');
 const anchor=pricing?.closest('.lp-section-band')||root.querySelector('.lp-final-close');
 if(anchor){anchor.before(section);const status=anchor.querySelector?.('#lpCheckoutStatus');if(status)section.querySelector('.fo-buy').append(status);anchor.hidden=true;}else root.append(section);
 const note=document.createElement('p');note.className='fo-hero-note';root.querySelector('.lp-hero-cta-row')?.after(note);
 const summary=document.createElement('p');summary.className='fo-price-note';pricing?.append(summary);
 root.querySelectorAll('.lp-enroll-btn.lp-enroll-primary').forEach(button=>{button.textContent='Enroll with Head Start — $597';});
 function showAvailability(remaining){
  const available=Number.isInteger(remaining)&&remaining>0;
  root.querySelectorAll('.lp-enroll-btn.lp-enroll-primary').forEach(button=>{button.textContent=available?'Give me a Head Start — $597':'Enroll with the Sidekick — $597';});
  section.querySelector('.fo-package-title').textContent=available?'Head Spa Head Start':'Head Spa Certification Package';
  section.querySelector('.fo-offer-label').textContent=available?'Limited enrollment package':'Your course + included bonus';
  section.querySelector('.fo-package-limit').hidden=!available;
  section.querySelector('.fo-package-limit').textContent=available?remaining+' of 5 packages available · Includes your private founder session.':'';
  section.querySelector('.fo-cta').textContent=available?'Give me a Head Start →':'Enroll with the Sidekick →';
  section.querySelector('.fo-session').hidden=!available;
  section.querySelector('.fo-package-extra').hidden=!available;
  section.classList.toggle('fo-base-only',!available);
  note.textContent='Your course + Smart Service Sidekick. Bonus included with enrollment.';
  summary.textContent='Included bonus: Smart Service Sidekick — step-by-step service guidance, live pacing, and client communication cues.';
  if(available){
   const places=remaining+' '+(remaining===1?'founder session':'founder sessions')+' left';
   section.querySelector('.fo-availability').textContent=places;
   note.textContent='Head Spa Head Start: course + Smart Service Sidekick + private founder session. '+places+'.';
   summary.textContent+=' Plus a private 45-minute founder session when confirmed at checkout; book after certification.';
  }
 }
 showAvailability(null);
 async function refresh(){
  try{
   const response=await fetch('/api/founder-review/offer',{cache:'no-store',signal:AbortSignal.timeout(10000)});
   const data=await response.json();
   showAvailability(response.ok&&data.active===true&&data.capacity===5&&Number.isInteger(data.remaining)&&data.remaining>=0&&data.remaining<=5?data.remaining:null);
  }catch{showAvailability(null);}
 }
 refresh();setInterval(()=>{if(!document.hidden&&root.getClientRects().length)refresh();},60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&root.getClientRects().length)refresh();});
})();
