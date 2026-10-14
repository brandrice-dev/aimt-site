import {graduateShell} from '../_lib/research/graduate-view.mjs';
// Public session shell only. All research data is fetched through the separately
// authenticated graduate API; no protected data is ever embedded or cached here.
export function onRequestGet() {
 return new Response(graduateShell(),{headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'}});
}
