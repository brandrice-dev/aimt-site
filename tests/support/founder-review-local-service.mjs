// Test adapter only: real local PostgreSQL, simulated Auth/Storage/Stripe/Resend.
// Never imported by production. Rejects every unrecognized destination.
export async function localReviewServices(db){
 const files=new Map(),sessions=new Map(),users=new Map(),emails=[],logs=[];let sequence=0;
 const env={SUPABASE_URL:'https://review-db.invalid',SUPABASE_SERVICE_ROLE_KEY:'local-service-key',STRIPE_SECRET_KEY:'sk_test_local',STRIPE_PUBLISHABLE_KEY:'pk_test_local',STRIPE_PRICE_ID:'price_local_course',STRIPE_WEBHOOK_SECRET:'whsec_local',RESEND_API_KEY:'local-mail-key',FOUNDER_REVIEW_ENABLED:'true',FOUNDER_REVIEW_SALES_ENABLED:'true'};
 const json=(data,status=200)=>Response.json(data,{status});
 const allowedTables=new Set(['founder_review_campaign','founder_review_reservations','course_entitlements','completions','admin_users']);
 const identifier=name=>{if(!/^[a-z_]+$/.test(name))throw Error('Unexpected identifier');return '"'+name+'"';};
 function where(params,values){
  const parts=[];
  for(const [column,filter] of params){
   if(['select','limit','order','on_conflict','or'].includes(column))continue;
   const field=identifier(column),at=filter.indexOf('.'),op=filter.slice(0,at),value=filter.slice(at+1);
   if(op==='is'&&value==='null'){parts.push(field+' is null');continue;}
   if(op==='not'&&value==='is.null'){parts.push(field+' is not null');continue;}
   if(op==='in'){values.push(value.slice(1,-1).split(','));parts.push(field+`=any($${values.length})`);continue;}
   if(!['eq','neq','lte'].includes(op))throw Error('Unexpected filter '+op);
   values.push(value);parts.push(field+({eq:'=',neq:'<>',lte:'<='}[op])+`$${values.length}`);
  }
  if(params.has('or')){
   const terms=[];for(const expr of params.get('or').slice(1,-1).split(',')){
    const match=expr.match(/^([a-z_]+)\.eq\.(.+)$/);if(!match)throw Error('Unexpected or filter');values.push(match[2]);terms.push(identifier(match[1])+`=$${values.length}`);
   }parts.push('('+terms.join(' or ')+')');
  }
  return parts.length?' where '+parts.join(' and '):'';
 }
 async function rest(url,options){
  const table=url.pathname.slice('/rest/v1/'.length),params=url.searchParams,method=options.method||'GET';
  if(table.startsWith('rpc/')){
   const name=table.slice(4),argMap={founder_review_hold:['p_id','p_request_hash'],founder_review_bind:['p_id','p_session'],founder_review_paid:['p_id','p_session','p_email'],founder_review_release:['p_id','p_session'],founder_review_link:['p_user','p_email']};
   const args=JSON.parse(options.body);if(!argMap[name])throw Error('Unexpected RPC');
   const result=await db.query(`select * from public.${identifier(name)}(${argMap[name].map((_,i)=>'$'+(i+1)).join(',')})`,argMap[name].map(k=>args[k]??null));
   return json(name==='founder_review_hold'?result.rows:result.rows[0][name]);
  }
  if(table==='aimt_logs'){
   if(method==='POST'){logs.push(JSON.parse(options.body));return json([]);}
   return json(logs.filter(row=>[...params].every(([key,value])=>['select','limit','order'].includes(key)||String(row[key])===value.replace(/^eq\./,''))));
  }
  if(['growth_events','admin_audit_log'].includes(table))return json([]);
  if(!allowedTables.has(table))throw Error('Unexpected table '+table);
  if(method==='GET'){
   const values=[],filter=where(params,values),selection=(params.get('select')||'*').split(',').map(k=>k==='*'?'*':identifier(k)).join(',');
   const order=params.get('order')?.split('.');
   const result=await db.query('select '+selection+' from public.'+identifier(table)+filter+(order?' order by '+identifier(order[0])+(order[1]==='desc'?' desc':' asc'):'')+(params.has('limit')?' limit '+Number(params.get('limit')):''),values);return json(result.rows);
  }
  const payload=JSON.parse(options.body),keys=Object.keys(payload),values=keys.map(k=>payload[k]);
  if(method==='POST'){
   const conflict=params.get('on_conflict'),updates=keys.filter(k=>k!==conflict).map(k=>identifier(k)+'=excluded.'+identifier(k)).join(',');
   const result=await db.query('insert into public.'+identifier(table)+'('+keys.map(identifier).join(',')+') values('+keys.map((_,i)=>'$'+(i+1)).join(',')+')'+(conflict?' on conflict('+identifier(conflict)+') do update set '+updates:'')+' returning *',values);return json(result.rows);
  }
  if(method==='PATCH'){
   const assignments=keys.map((k,i)=>identifier(k)+'=$'+(i+1)).join(','),filter=where(params,values);
   return json((await db.query('update public.'+identifier(table)+' set '+assignments+filter+' returning *',values)).rows);
  }
  throw Error('Unexpected method');
 }
 async function fetchLocal(raw,options={}){
  const url=new URL(raw),headers=new Headers(options.headers);
  try{
   if(url.hostname==='review-db.invalid'){
    if(url.pathname==='/auth/v1/user')return users.has(headers.get('Authorization'))?json(users.get(headers.get('Authorization'))):json({},401);
    if(headers.get('Authorization')!=='Bearer '+env.SUPABASE_SERVICE_ROLE_KEY)throw Error('Private service credential required');
    if(url.pathname.startsWith('/rest/v1/'))return await rest(url,options);
    if(url.pathname.includes('/object/list/')){const {prefix}=JSON.parse(options.body);return json([...files.keys()].filter(k=>k.startsWith(prefix+'/')).map(k=>({name:k.split('/').at(-1)})));}
    if(url.pathname.includes('/object/sign/')){const path=url.pathname.split('/object/sign/')[1];return json({signedURL:'/object/sign/'+path+'?token=local-only'});}
    if(url.pathname==='/storage/v1/object/founder-review-materials'&&options.method==='DELETE'){for(const key of JSON.parse(options.body).prefixes)files.delete(key);return json([]);}
    if(url.pathname.startsWith('/storage/v1/object/founder-review-materials/')){files.set(url.pathname.split('/founder-review-materials/')[1],new Uint8Array(options.body));return json({Key:'stored'});}
    throw Error('Unexpected storage URL');
   }
   if(url.hostname==='api.stripe.com'){
    if(url.pathname==='/v1/checkout/sessions'&&options.method==='POST'){
     const params=new URLSearchParams(options.body),id='cs_test_local_'+(++sequence),metadata={};
     for(const [key,value] of params){const match=key.match(/^metadata\[(.+)\]$/);if(match)metadata[match[1]]=value;}
     const session={id,client_secret:id+'_secret_local',url:'https://checkout.stripe.com/local/'+id,metadata,price:params.get('line_items[0][price]'),status:'open',payment_status:'unpaid',expires_at:params.get('expires_at'),success_url:params.get('success_url'),customText:params.get('custom_text[submit][message]')};sessions.set(id,session);return json(session);
    }
    const match=url.pathname.match(/^\/v1\/checkout\/sessions\/([^/]+)(\/line_items)?$/);
    if(match){const session=sessions.get(match[1]);if(!session)return json({},404);return json(match[2]?{data:[{price:{id:session.price}}]}:session);}
   }
   if(url.hostname==='api.resend.com'){emails.push(JSON.parse(options.body));return json({id:'local-mail-'+emails.length});}
   throw Error('Unrecognized destination: '+url.hostname);
  }catch(error){return json({error:error.message},409);}
 }
 return {env,files,sessions,users,emails,logs,fetch:fetchLocal};
}
