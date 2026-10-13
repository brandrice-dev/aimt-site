import {loadPublicCatalog} from '../_lib/public-research/catalog.mjs';
export async function onRequestGet({env}) {
 try {return Response.json(await loadPublicCatalog(env),{headers:{'Cache-Control':'public,max-age=30','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'}});}
 catch {return Response.json({error:'The library is temporarily unavailable.'},{status:503,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});}
}
