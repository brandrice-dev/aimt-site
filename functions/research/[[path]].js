import {loadPublicCatalog,ORIGIN,escapeHtml} from '../_lib/public-research/catalog.mjs';
import {libraryPage,studyPage,shell} from '../_lib/public-research/view.mjs';
export async function onRequestGet({request,env}) {
 const url=new URL(request.url),path=url.pathname.replace(/\/$/,'');
 try {
  const catalog=await loadPublicCatalog(env);
  if(path==='/research/sitemap.xml')return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/research',...catalog.studies.map(s=>s.href)].map(p=>`<url><loc>${ORIGIN}${escapeHtml(p)}</loc></url>`).join('')}</urlset>`,{headers:{'Content-Type':'application/xml;charset=utf-8','Cache-Control':'public,max-age=60'}});
  if(path==='/research' && url.searchParams.has('source')) {
   const source=url.searchParams.get('source'),study=catalog.studies.find(s=>s.doi===source || s.source_url===source);
   if(study)return Response.redirect(ORIGIN+study.href,302);
   url.searchParams.delete('source');url.searchParams.set('q',source.slice(0,200));url.searchParams.set('type','study');
  }
  if(path==='/research')return html(libraryPage(catalog,url.searchParams));
  const match=path.match(/^\/research\/studies\/([a-f0-9]{24})$/),study=match && catalog.studies.find(s=>s.id===match[1]);
  if(study)return html(studyPage(study));
  return html(shell('Reference unavailable','Reference unavailable.','<h1>Reference unavailable</h1><p><a href="/research">Search the Public Research Library</a></p>',{noindex:true}),404);
 } catch { return html(shell('Library temporarily unavailable','Please try again shortly.','<h1>The library is temporarily unavailable</h1><p>Please try again shortly. You can still <a href="/education">browse AIMT Education</a>.</p>',{noindex:true}),503); }
}
const html=(body,status=200)=>new Response(body,{status,headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':status===200?'public,max-age=30':'no-store','X-Content-Type-Options':'nosniff'}});
