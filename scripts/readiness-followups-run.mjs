// GitHub Actions -> Cloudflare Pages signed Readiness follow-up cycle.
// Server's trusted DB transaction owns consent, purchase and spend gates;
// this script can only request a run. Never prints API keys or lead data.
// Uses built-in Node crypto/fetch, no packages.
import { createHmac } from 'node:crypto';

const secret=process.env.SUPABASE_SERVICE_ROLE_KEY||'';
const mode=process.env.FOLLOWUP_MODE||'dry';
const runId=process.env.GITHUB_RUN_ID+'-'+(process.env.GITHUB_RUN_ATTEMPT||'1');
if(secret.length<32||!['dry','send'].includes(mode)||!/^[1-9]\d{4,}-[1-9]\d{0,3}$/.test(runId)){
  console.error('AIMT follow-up runner is not configured.');
  process.exit(1);
}
const sentAt=String(Math.floor(Date.now()/1000));
const message=['aimt-readiness-followups-run-v1',sentAt,runId,mode].join('\n');
const signature=createHmac('sha256',secret).update(message).digest('hex');
const endpoint='https://aimtrichology.com/api/readiness/followups/run';
const response=await fetch(endpoint,{
  method:'POST',
  headers:{
    'Content-Type':'application/json',
    'X-AIMT-Sent-At':sentAt,
    'X-AIMT-Run-Id':runId,
    'X-AIMT-Signature':signature,
  },
  body:JSON.stringify({mode}),
  signal:AbortSignal.timeout(90000),
});
const body=await response.json().catch(()=>({error:'Invalid server response'}));
if(!response.ok){
  console.error('Readiness follow-up request failed:',response.status,body.error||'unknown');
  process.exit(1);
}
const aggregate={
  status:body.status,
  considered:body.considered??0,
  eligible:body.eligible??0,
  sent:body.sent??0,
  failed:body.failed??0,
  suppressed:body.suppressed??0,
  uncertain:body.uncertain??0,
};
console.log(JSON.stringify(aggregate));
if(aggregate.uncertain>0)process.exit(1);
