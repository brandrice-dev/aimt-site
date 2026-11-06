// Presentation only. The course and Sidekick are always included; founder availability is server-owned.
(function(){
 const root=document.getElementById('landingPage');if(!root)return;
 const style=document.createElement('link');style.rel='stylesheet';style.href='/assets/css/aimt-founder-offer.css?v=headstart1';document.head.append(style);
 const section=document.createElement('section');section.className='fo-section';section.id='founderOffer';
 section.innerHTML=`<div class="lp-band-inner">
  <header class="fo-head"><span class="fo-label">One enrollment. Your complete head start.</span>
   <h2 class="section-title">Head Spa Head Start</h2>
   <p class="fo-lead">Learn the service. <em>Bring support into the treatment room.</em></p>
   <p class="fo-body">Your certification course and Smart Service Sidekick, together for $597. While places remain, your enrollment also includes a private session with AIMT’s founder.</p>
  </header>
  <article class="fo-course"><span class="fo-number" aria-hidden="true">01</span><div><span class="fo-label">Your training</span><h3>Head Spa Certification Course</h3><p>The full course, practitioner resources, and lifetime access. Earn your verifiable AIMT credential by passing the certification assessment.</p></div></article>
  <div class="fo-grid">
   <article class="fo-sidekick" aria-labelledby="fo-sidekick-title">
    <div class="fo-card-copy"><span class="fo-label">02 · Included enrollment bonus</span><h3 id="fo-sidekick-title">Smart Service Sidekick</h3>
     <p class="fo-sidekick-lead">Know the service. Forget what comes next?</p><p class="fo-body">Keep your training beside you while you work. Open your Sidekick on a phone, tablet, or computer and follow the service from start to finish.</p></div>
    <img src="/assets/images/marketing/approved-service-timer-live.webp" width="1600" height="862" loading="lazy" alt="Smart Service Sidekick interface showing the current treatment step, countdown, practitioner instructions and client communication cues">
    <ul class="fo-benefits"><li><strong>Know what to do next.</strong><span>See your current step, how to carry it out, and the transition coming up.</span></li><li><strong>Keep the whole service on pace.</strong><span>Follow each step’s countdown alongside overall service timing in the Core 60-minute or Extended 90-minute reference format.</span></li><li><strong>Answer without losing your flow.</strong><span>Find short, step-specific answers when a client asks a question, plus cues for comfort, temperature, and pressure.</span></li><li><strong>Keep your attention on your client.</strong><span>Hands-free scrolling keeps the instructions moving. Pause, resume, or move between steps when you need to.</span></li></ul>
    <p class="fo-sidekick-foot">Included with every enrollment. Yours to rehearse with before a client and use during service. Your judgment and your client’s needs always come first.</p>
   </article>
   <article class="fo-session" hidden aria-labelledby="fo-session-title">
    <span class="fo-label">03 · Limited enrollment bonus</span><div class="fo-session-top"><span class="fo-duration">45 minutes · Private · One-on-one</span></div>
    <h3 id="fo-session-title">Your plan.<br>The founder’s feedback.</h3>
    <p class="fo-session-intro">Work directly with AIMT’s founder and co-owner of ATRIUM Head Spa &amp; Wellness. Get the experience behind your training focused on your business.</p>
    <ul class="fo-benefits"><li><strong>A personal Blueprint review.</strong><span>Bring your service plan. See what’s ready and what needs work.</span></li><li><strong>Your questions, answered.</strong><span>Talk through the decisions you’re still working on.</span></li><li><strong>Clear next steps.</strong><span>Plan what to do before offering your first head spa service.</span></li></ul>
    <div class="fo-allocation"><p class="fo-availability" role="status"></p><p>Only five enrollments include this private session. Once those places are filled, enrollment continues without the founder session.</p></div>
    <p class="fo-terms">Complete your certification and Blueprint, then book in My AIMT. Availability is confirmed at checkout.</p>
   </article>
  </div>
  <div class="fo-package-close"><div><span class="fo-label">Head Spa Head Start bundle</span><p class="fo-package-summary">Your course + Smart Service Sidekick.</p><p class="fo-package-extra" hidden>Plus your private founder session, while places remain.</p></div><div class="fo-buy"><div class="fo-price">$597 <span>One-time enrollment</span></div><a class="fo-cta" href="/enroll">Enroll with Head Start <span aria-hidden="true">→</span></a><p class="fo-price-detail">Bonuses included. No extra charge.</p></div></div>
 </div>`;
 const pricing=root.querySelector('.lp-pricing-includes');
 const anchor=pricing?.closest('.lp-section-band')||root.querySelector('.lp-final-close');
 if(anchor)anchor.before(section);else root.append(section);
 const note=document.createElement('p');note.className='fo-hero-note';root.querySelector('.lp-hero-cta-row')?.after(note);
 const summary=document.createElement('p');summary.className='fo-price-note';pricing?.append(summary);
 root.querySelectorAll('.lp-enroll-btn.lp-enroll-primary').forEach(button=>{button.textContent='Enroll with Head Start — $597';});
 function showAvailability(remaining){
  const available=Number.isInteger(remaining)&&remaining>0;
  section.querySelector('.fo-session').hidden=!available;
  section.querySelector('.fo-package-extra').hidden=!available;
  section.classList.toggle('fo-base-only',!available);
  note.textContent='Head Spa Head Start: your course + Smart Service Sidekick. Bonuses included with enrollment.';
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
