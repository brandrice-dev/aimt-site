// Real Chromium layout and interaction smoke for the free AIMT classroom.
// No external dependencies, live endpoints, medical data, or production edits.
// On Ubuntu Actions: google-chrome --headless; content served from localhost only.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';

const port=8771;
const origin='http://127.0.0.1:'+port;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{
 cwd:process.cwd(),stdio:'ignore'
});
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
try {
 let ready=false;
 for(let i=0;i<40;i++){
  try {const response=await fetch(origin+'/head-spa-accelerator-classroom.html');if(response.ok){ready=true;break;}}
  catch {}
  await sleep(250);
 }
 assert.ok(ready,'Local static web server did not start');
 const binary=process.env.CHROME_BIN||'google-chrome';
 const sizes=[375,390,430,768,1200];
 for(const width of sizes){
  const flags=[
   '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
   '--disable-background-networking','--no-first-run',
   '--disable-features=Translate,MediaRouter',
   '--window-size=1360,960',
   '--virtual-time-budget=12000',
   '--dump-dom',
   origin+'/tests/aimt-accelerator-browser-smoke.html?width='+width
  ];
  const output=execFileSync(binary,flags,{encoding:'utf8',timeout:45000,
   maxBuffer:8*1024*1024,stdio:['ignore','pipe','ignore']});
  const status=output.match(/<html[^>]*data-smoke="(PASS|FAIL)"/i)?.[1]||'TIMEOUT';
  const excerpt=output.match(/<pre id="report">([\s\S]*?)<\/pre>/i)?.[1]?.replace(/&quot;/g,'"').replace(/&amp;/g,'&').slice(0,12000)||'No embedded results';
  console.log('PHONE-VIEW '+width+'px: '+status);
  if(status!=='PASS')console.error(excerpt);
  assert.equal(status,'PASS','Accelerator browser smoke failed at '+width+'px');
 }
 console.log('All five browser widths and lesson interactions passed.');
}finally {
 server.kill('SIGTERM');
}
