import {bookingLayoutMarkup} from '/assets/js/aimt-founder-review-presentation.mjs';
// Optional dashboard card. Server owns eligibility; no saved local eligibility.
export async function mountFounderReview({container,getToken}){
  container.hidden=true;container.replaceChildren();
  const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
  async function api(path='',options={}){
    const token=await getToken();if(!token)throw Error('Sign in again to continue.');
    const response=await fetch('/api/founder-review'+path,{...options,headers:{Authorization:'Bearer '+token,...options.headers}});
    const data=await response.json();return {response,data};
  }
  let initial;
  try{initial=await api();}catch{return;}
  // An inactive offer or non-recipient must not see an upsell or a fake card.
  if(!initial.response.ok)return;
  const data=initial.data,card=el('section');card.className='empty-card';
  card.setAttribute('aria-labelledby','founderReviewTitle');
  const title=el('h3','Founder review');title.id='founderReviewTitle';card.append(title);
  card.append(el('p','Your private 45-minute review is reserved. Your materials are only used to prepare for this review.'));
  const status=el('p');status.className='meta';status.setAttribute('role','status');card.append(status);
  container.replaceChildren(card);container.hidden=false;
  if(!data.certified){status.textContent='Complete your certification, then return here with your First-Service Blueprint.';return;}
  if(data.status!=='reserved'){
    status.textContent=data.status==='completed'?'Your review is complete.':data.appointmentAt?'Your review is scheduled for '+new Date(data.appointmentAt).toLocaleString()+'.':'Your review is being arranged.';
    return;
  }
  status.textContent='Upload your Blueprint PDF and any extra material you would like reviewed. Do not include client information.';
  const uploadStatus=el('p');uploadStatus.setAttribute('role','status');
  for(const [slot,label] of [['blueprint','Blueprint PDF'],['supporting-1','Extra PDF 1 (optional)'],['supporting-2','Extra PDF 2 (optional)']]){
    const form=el('form'),caption=el('label',label+' — up to 5 MB');
    const input=el('input');input.type='file';input.accept='.pdf,application/pdf';input.required=true;input.id='founder-'+slot;caption.htmlFor=input.id;
    const saved=el('p',data.materials.includes(slot)?'PDF received. You can replace it before scheduling.':'No PDF uploaded.');saved.className='meta';
    const button=el('button','Upload PDF');button.type='submit';button.className='btn';
    form.append(caption,input,button,saved);card.append(form);
    form.addEventListener('submit',async event=>{
      event.preventDefault();const file=input.files?.[0];if(!file)return;
      if(file.size>5*1024*1024){uploadStatus.textContent='Each PDF must be 5 MB or smaller.';return;}
      button.disabled=true;uploadStatus.textContent='Uploading PDF…';
      try{
        const result=await api('/material?slot='+slot,{method:'PUT',headers:{'Content-Type':'application/pdf'},body:file});
        if(!result.response.ok)throw Error(result.data.error||'Upload failed.');
        saved.textContent='PDF received.';uploadStatus.textContent='Your PDF was received.';input.value='';
      }catch(error){uploadStatus.textContent=error.message;}finally{button.disabled=false;}
    });
  }
  card.append(uploadStatus);
  const form=el('form'),label=el('label','What would you like to work through? (optional)'),questions=el('textarea');
  questions.id='founder-questions';label.htmlFor=questions.id;questions.maxLength=1000;questions.rows=4;questions.value=data.questions||'';questions.style.width='100%';
  const save=el('button','Save questions');save.className='btn';save.type='submit';
  form.append(label,questions,save);card.append(form);
  form.addEventListener('submit',async event=>{
    event.preventDefault();save.disabled=true;
    try{const result=await api('/questions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questions:questions.value})});if(!result.response.ok)throw Error(result.data.error||'Could not save questions.');uploadStatus.textContent='Your questions were saved.';}catch(error){uploadStatus.textContent=error.message;}finally{save.disabled=false;}
  });
  const booking=el('button','Choose a time');booking.type='button';booking.className='btn';
  const panel=el('div');panel.hidden=true;panel.style.marginTop='1rem';
  card.append(el('p','After uploading your Blueprint, choose a time. Use the same email as your AIMT account. Google Meet details arrive from Google after booking.'),booking,panel);
  booking.addEventListener('click',async()=>{
    booking.disabled=true;panel.hidden=true;
    try{
      const result=await api('/booking',{method:'POST'});if(!result.response.ok)throw Error(result.data.error||'Booking unavailable.');
      const url=new URL(result.data.url);
      if(url.origin!=='https://calendar.google.com'||url.pathname!=='/calendar/appointments/schedules/AcZssZ1tNgOWBWQFYBczptBaUliONhU_l0xwWb97qNJ4gffg4B-iCCZZXo8a8RSlcdlZ-ea9pcr6s-zN'||url.search!=='?gv=true')throw Error('Booking unavailable.');
      panel.innerHTML=bookingLayoutMarkup(url.href);panel.hidden=false;uploadStatus.textContent=result.data.note;
      panel.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(error){uploadStatus.textContent=error.message;}finally{booking.disabled=false;}
  });
}
