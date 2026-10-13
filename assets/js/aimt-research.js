import {searchCatalog} from '/assets/js/aimt-research-search.mjs';
const form=document.querySelector('#research-search'),results=document.querySelector('#research-results'),count=document.querySelector('#research-count'),empty=document.querySelector('#research-empty');
let catalog;
const element=(tag,text,className)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(className)el.className=className;return el;};
const link=(text,href)=>{const a=element('a',text);a.href=href;return a;};
function card(item) {
 const li=element('li','', 'research-result');li.append(element('span',item.type==='article'?'AIMT Education':'Study reference','research-kind'));const heading=element('h2');heading.append(link(item.title,item.href));li.append(heading);
 if(item.type==='article')li.append(element('p',item.description));
 else {li.append(element('p',`${item.authors.join(', ')} · ${item.year}`,'research-meta'));if(item.doi)li.append(element('p',`DOI: ${item.doi}`,'research-doi'));const p=element('p');p.append(link('Read the scientific source ↗',item.source_url));li.append(p);const related=element('p','Related AIMT education: ','research-associated');item.articles.forEach((a,i)=>{if(i)related.append(' · ');related.append(link(a.title,a.href));});li.append(related);}return li;
}
function update(push=true) {
 if(!catalog)return;const data=new FormData(form),params={q:data.get('q'),category:data.get('category'),type:data.get('type')};const items=searchCatalog(catalog,params);results.replaceChildren(...items.map(card));count.textContent=`${items.length} result${items.length===1?'':'s'}`;empty.hidden=items.length>0;
 if(push){const query=new URLSearchParams(Object.entries(params).filter(([,v])=>v));history.replaceState(null,'','/research'+(query.size?'?'+query:''));}
}
fetch('/api/public-research').then(r=>r.ok?r.json():Promise.reject()).then(data=>{catalog=data;form.addEventListener('submit',e=>{e.preventDefault();update();});let timer;form.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>update(),150);});form.addEventListener('change',()=>update());}).catch(()=>{/* Server-rendered search and GET form remain fully usable. */});
