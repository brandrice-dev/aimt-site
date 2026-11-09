// Presentation only. The course and Sidekick are always included; founder availability is server-owned.
(function(){
 const root=document.getElementById('landingPage');if(!root)return;
 const style=document.createElement('link');style.rel='stylesheet';style.href='/assets/css/aimt-founder-offer.css?v=publiccopy1';document.head.append(style);
 const section=document.createElement('section');section.className='fo-section';section.id='founderOffer';
 section.innerHTML=`<div class="lp-band-inner"><div class="fo-shell"><span class="fo-corner-tab" hidden>Limited</span>
  <header class="fo-head"><span class="fo-label fo-offer-label">Your course + included bonus</span><h2 class="section-title fo-package-title"><span class="fo-name-line">Head Spa Certification</span><span class="fo-package-subtitle">Package</span></h2><p class="fo-body">Earn your certification. Know what to do during the service.</p><p class="fo-package-limit" hidden role="status"></p></header>
  <article class="fo-course"><div><span class="fo-label">01 · The foundation</span><h3>Head Spa Certification Course</h3><p>Complete training, practitioner resources, and lifetime access. Earn your AIMT credential by passing the assessment.</p></div></article>
  <div class="fo-grid">
   <article class="fo-sidekick" aria-labelledby="fo-sidekick-title"><div class="fo-card-copy"><span class="fo-label">02 · Your included bonus</span><h3 id="fo-sidekick-title">Smart Service Sidekick</h3><p class="fo-sidekick-lead">Know what comes next. Keep your service flowing.</p></div>
    <details class="fo-demo"><summary>See the Sidekick in motion <span aria-hidden="true">＋</span></summary><p class="fo-demo-note">Animated preview · Sample step. Controls shown for illustration.</p>    <div class="protocol-mini-demo" id="protocolLiveCard" aria-hidden="true">
        <div class="plc-top">
          <div class="plc-id">
            <svg class="plc-mark" viewBox="0 0 44 44" fill="none" aria-hidden="true"><use href="#aimtOrbitalMark"></use></svg>
            <span class="plc-brand">AIMT &middot; Smart Service Sidekick</span>
          </div>
          <span class="plc-format">Core Format</span>
          <div class="plc-controls"><span class="plc-ctrl">Pause</span><span class="plc-ctrl">Exit</span></div>
        </div>

        <div class="plc-ring-panel">
          <div class="plc-ring-wrap">
            <div class="plc-ring-ambient" aria-hidden="true"></div>
            <svg class="plc-ring-svg" viewBox="0 0 72 72" overflow="visible" aria-hidden="true">
              <circle class="plc-ring-bg" cx="36" cy="36" r="30"/>
              <circle class="plc-ring-fill" id="plcRingFill" cx="36" cy="36" r="30" stroke-dasharray="188.5" stroke-dashoffset="62.2"/>
            </svg>
            <div class="plc-clock-text">
              <div class="plc-time" id="plcCountdown">6:42</div>
              <div class="plc-time-label">Step remaining</div>
            </div>
          </div>

          <div class="plc-metrics">
            <div class="plc-service-row">
              <div class="plc-metric-service">
                <span class="plc-service-label">Service remaining</span>
                <span class="plc-service-time" id="plcServiceRemaining">38:42</span>
              </div>
              <div class="plc-metric-elapsed">
                <span class="plc-elapsed-label">Elapsed</span>
                <span class="plc-elapsed-time" id="plcElapsed">21:18</span>
              </div>
            </div>
            <div class="plc-track"><div class="plc-track-fill" id="plcTrackFill"></div><div class="plc-track-marker" aria-hidden="true"></div></div>
          </div>

          <div class="plc-ring-support">Next landmark &middot; <strong id="plcLandmark">6:42</strong> remaining &middot; reference 3:00</div>
        </div>

        <div class="plc-guidance">
          <div class="plc-step-meta-row">
            <div class="plc-step-eyebrow">Step 05 &middot; Treatment</div>
            <div class="plc-phase">Treatment</div>
          </div>
          <div class="plc-step-title">Exfoliation + Scalp Massage + Rinse</div>
          <div class="plc-cue">
            <span class="plc-cue-label">Practitioner cue</span>
            <p class="plc-cue-text">Adapt exfoliation to intake, assessment and product directions. Keep pressure controlled, then rinse thoroughly before the next block.</p>
          </div>
          <div class="plc-comm">
            <div class="plc-comm-head">Client communication</div>
            <div class="plc-comm-row">
              <span class="plc-comm-tag">If they ask</span>
              <p class="plc-comm-copy">&ldquo;It&rsquo;s a scalp exfoliant. I&rsquo;m adjusting the product, pressure, and technique based on what I&rsquo;m seeing and how your scalp feels today.&rdquo;</p>
            </div>
          </div>
          <div class="plc-next"><span>Up next</span><strong>Scalp, Neck + Shoulders</strong></div>
        </div>

        <div class="plc-bottom">
          <span class="plc-nav-btn">&larr; Back</span>
          <span class="plc-nav-btn plc-nav-btn-next">Next &rarr;</span>
        </div>
    </div>
    </details>
    <ul class="fo-benefits"><li><strong>What to do.</strong> Step-by-step instructions and reminders.</li><li><strong>How to pace it.</strong> Step countdowns, total timing, and upcoming transitions.</li><li><strong>What to say.</strong> Short answers when a client asks a question.</li><li><strong>Help while you work.</strong> Hands-free scrolling, pause, and resume.</li></ul><p class="fo-sidekick-foot">Included with every enrollment. Core 60-minute and Extended 90-minute reference formats. Your judgment and client needs come first.</p>
   </article>
   <article class="fo-session" hidden aria-labelledby="fo-session-title"><span class="fo-label">03 · Your limited bonus</span><h3 id="fo-session-title">A private 1-on-1 video call<br>with AIMT’s founder.</h3><p class="fo-session-intro">45 minutes on Google Meet with Brandon Rice, founder of AIMT and co-owner of ATRIUM Head Spa &amp; Wellness. Join from your phone or computer.</p><p class="fo-session-intro">Brandon brings nearly 20 years behind the chair and years of teaching stylists across the country. He designed and built AIMT’s learning platform, personal learning guide, and Smart Service Sidekick, drawing on the experience he and his wife, Cady, developed while building and operating ATRIUM.</p><p class="fo-session-intro"><a href="/about#our-story" style="color:inherit;text-underline-offset:3px;">Meet the founders →</a></p><ul class="fo-benefits"><li><strong>Review your Blueprint.</strong> See what’s ready and what needs work.</li><li><strong>Ask your questions.</strong> Talk through decisions for your business.</li><li><strong>Plan your next steps.</strong> Know what to do before your first service.</li></ul><div class="fo-allocation"><p class="fo-availability"></p><p>Only five enrollments include this call. After those places fill, the course and Sidekick remain available without it.</p></div><p class="fo-terms">Book after completing your certification and Blueprint. Bonus availability is confirmed at checkout.</p></article>
  </div>
  <div class="fo-package-close"><div class="fo-close-recap"><h3>Get certified. Start with support.</h3><ul class="fo-close-list"><li><span aria-hidden="true">✓</span><div><strong>Head Spa Certification Course</strong><small>Training, assessment + lifetime course access.</small></div></li><li><span aria-hidden="true">✓</span><div><span class="fo-close-bonus">Included bonus</span><strong>Smart Service Sidekick</strong><small>Step-by-step guidance while you work.</small></div></li><li class="fo-package-extra" hidden><span aria-hidden="true">✓</span><div><span class="fo-close-bonus">Limited bonus</span><strong>Private 45-minute founder video call</strong><small>Review your plan. Know your next steps.</small></div></li></ul></div><div class="fo-buy"><div class="fo-price">$597 <span>One payment. Bonuses included at no extra cost.</span></div><a class="fo-cta" href="/enroll">Give me a Head Start <span aria-hidden="true">→</span></a><p class="fo-close-availability" hidden></p></div></div>
 </div></div>`;
 const demoScript=document.createElement('script');demoScript.src='/assets/js/aimt-sidekick-demo.js?v=1';
 const pricing=root.querySelector('.lp-pricing-includes');
 const anchor=pricing?.closest('.lp-section-band')||root.querySelector('.lp-final-close');
 if(anchor){anchor.before(section);const status=anchor.querySelector?.('#lpCheckoutStatus');if(status)section.querySelector('.fo-buy').append(status);anchor.hidden=true;}else root.append(section);
 document.head.append(demoScript);
 // Consume this one-time deep link after its first layout. A live countdown
 // must not leave Safari re-targeting the fragment during later DOM updates.
 if(typeof window!=='undefined'&&window.location.hash==='#founderOffer'){
  window.requestAnimationFrame(()=>{if(window.location.hash==='#founderOffer')window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search);});
 }
 const navCTA=document.getElementById('lpNavEnroll');
 const note=document.createElement('p');note.className='fo-hero-note';root.querySelector('.lp-hero-cta-row')?.after(note);
 const summary=document.createElement('p');summary.className='fo-price-note';pricing?.append(summary);
 root.querySelectorAll('.lp-enroll-btn.lp-enroll-primary').forEach(button=>{button.textContent='Enroll with Head Start — $597';});
 let lastRemaining=Symbol('initial');
 function showAvailability(remaining){
  if(Object.is(lastRemaining,remaining))return;lastRemaining=remaining;
  const available=Number.isInteger(remaining)&&remaining>0;
  section.querySelector('.fo-head .fo-body').textContent=available?'Earn your certification. Know what to do during the service. Get personal feedback on your service plan.':'Earn your certification. Know what to do during the service.';
  root.querySelectorAll('.lp-enroll-btn.lp-enroll-primary').forEach(button=>{button.textContent=available?'Give me a Head Start — $597':'Enroll with the Sidekick — $597';});
  if(navCTA)navCTA.textContent=available?'Give me a Head Start — $597':'Enroll with the Sidekick — $597';
  section.querySelector('.fo-name-line').textContent=available?'Head Spa Head Start':'Head Spa Certification';
  section.querySelector('.fo-package-subtitle').textContent=available?'Bonus Package':'Package';
  section.querySelector('.fo-offer-label').textContent=available?'Limited enrollment package':'Your course + included bonus';
  section.querySelector('.fo-package-limit').hidden=!available;
  section.querySelector('.fo-package-limit').textContent=available?remaining+' of 5 packages available · Includes your private 1-on-1 founder video call.':'';
  section.querySelector('.fo-cta').textContent=available?'Give me a Head Start →':'Enroll with the Sidekick →';
  section.querySelector('.fo-session').hidden=!available;
  section.querySelector('.fo-corner-tab').hidden=!available;
  section.querySelector('.fo-package-extra').hidden=!available;
  section.querySelector('.fo-close-availability').hidden=!available;
  section.querySelector('.fo-close-availability').textContent=available?'Only '+remaining+' '+(remaining===1?'founder call remains.':'founder calls remain.')+' Availability confirmed at checkout.':'';
  section.classList.toggle('fo-base-only',!available);
  note.textContent='Your course + Smart Service Sidekick. Bonus included with enrollment.';
  summary.textContent='Included bonus: Smart Service Sidekick — step-by-step service guidance, live pacing, and client communication cues.';
  if(available){
   const places=remaining+' '+(remaining===1?'founder call':'founder calls')+' left';
   section.querySelector('.fo-availability').textContent=places;
   note.textContent='Limited bonus: a private 1-on-1 founder video call. '+places+'.';
   summary.textContent+=' Plus a private 45-minute, 1-on-1 Google Meet video call with AIMT’s founder when confirmed at checkout; book after certification.';
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
