import {maintenanceSignature} from '../functions/_lib/founder-review/maintenance-auth.mjs';
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!key){console.error('Founder cleanup requires its server-side signing credential.');process.exit(1);}
const timestamp=String(Math.floor(Date.now()/1000));
const body=JSON.stringify({dryRun:process.env.FOUNDER_CLEANUP_MODE!=='delete'});
const response=await fetch('https://aimtrichology.com/api/founder-review/cleanup',{method:'POST',headers:{'Content-Type':'application/json','x-aimt-timestamp':timestamp,'x-aimt-signature':await maintenanceSignature(key,timestamp,body)},body,signal:AbortSignal.timeout(30000)});
const result=await response.json();
if(!response.ok){console.error('Founder cleanup failed. No successful cleanup is assumed.');process.exit(1);}
console.log(JSON.stringify({dryRun:result.dryRun,due:result.due,deleted:result.deleted,failed:result.failed}));
