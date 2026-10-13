export function searchCatalog(catalog,{q='',category='',type=''}={}) {
  const terms=String(q).normalize('NFKD').toLowerCase().split(/\s+/).filter(Boolean);
  return [...catalog.articles,...catalog.studies].filter(item=>(!type || item.type===type) && (!category || item.categories.includes(category))
    && terms.every(t=>[item.title,item.description || '',...(item.authors || []),String(item.year || ''),item.doi || '',...item.subjects].join(' ').normalize('NFKD').toLowerCase().includes(t)))
    .sort((a,b)=>(a.type==='article'?-1:1)-(b.type==='article'?-1:1) || a.title.localeCompare(b.title));
}
