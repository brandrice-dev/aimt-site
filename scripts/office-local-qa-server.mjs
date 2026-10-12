#!/usr/bin/env node
// Local QA only: synthetic owner identity, real public GitHub reads, private DB unavailable.
// No live Supabase auth, writes, student records or model calls. scripts/ remains default-deny.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {onRequest} from '../functions/api/admin/office.js';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const PORT=Number(process.argv[2]||8793);
const realFetch=globalThis.fetch;
globalThis.fetch=async(input, options={})=>{
  const url=new URL(typeof input==='string'?input:input.url);
  if(url.hostname==='office-qa.invalid'){
    if(url.pathname==='/auth/v1/user')return Response.json({id:'local-owner',email:'qa-owner@aimt.test'});
    if(url.pathname==='/rest/v1/admin_users')return Response.json([{role:'owner',active:true}]);
    return Response.json({error:'Private source intentionally unavailable in local QA.'},{status:503});
  }
  if(url.hostname!=='api.github.com'||!url.pathname.startsWith('/repos/brandrice-dev/aimt-site/'))throw new Error('Local QA network boundary');
  if(options.method&&options.method!=='GET')throw new Error('Local QA is read only');
  return realFetch(input,options);
};
const env={SUPABASE_URL:'https://office-qa.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic-local-key'};
http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,`http://127.0.0.1:${PORT}`);
    if(url.pathname==='/api/admin/office'){
      const result=await onRequest({env,request:new Request(url,{method:req.method,headers:req.headers})});res.writeHead(result.status,Object.fromEntries(result.headers));res.end(await result.text());return;
    }
    if(url.pathname==='/api/admin'){
      res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
      if(url.searchParams.get('view')==='me'){res.end(JSON.stringify({actor:{role:'owner',email:'qa-owner@aimt.test'}}));return;}
      res.writeHead(503);res.end(JSON.stringify({error:'Local Office QA: existing Admin data is not connected.'}));return;
    }
    const filename=url.pathname==='/'||url.pathname==='/admin'?'/admin.html':url.pathname;
    if(!(filename==='/admin.html'||filename.startsWith('/assets/')||filename==='/favicon.svg')){res.writeHead(404);res.end();return;}
    const full=path.resolve(ROOT,'.'+filename);if(!full.startsWith(ROOT+path.sep)){res.writeHead(404);res.end();return;}
    let body=await readFile(full);
    if(filename==='/admin.html'){
      body=body.toString().replace(/<script src="https:\/\/cdn.jsdelivr.net[^>]+><\/script>/,'<script>window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{access_token:"local-qa-session"}}}),signOut:async()=>({})}})};</script>').replace('<script src="assets/js/aimt-growth.js"></script>','');
      body=body.replace('<body>','<body><div style="padding:12px 20px;background:#322a20;color:#e8d6bc;font:14px sans-serif">Local QA · synthetic owner session · live public GitHub metadata · private sources unavailable</div>');
    }
    res.setHeader('Content-Type',filename.endsWith('.html')?'text/html':filename.endsWith('.css')?'text/css':filename.endsWith('.js')?'text/javascript':'image/svg+xml');res.end(body);
  }catch{res.writeHead(404);res.end();}
}).listen(PORT,'127.0.0.1',()=>console.log(`Office QA: http://127.0.0.1:${PORT}/admin`));
