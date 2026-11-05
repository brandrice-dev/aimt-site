import {BOOKING_URL} from './api/founder-review/booking.js';
import {bookingLayoutMarkup} from '../assets/js/aimt-founder-review-presentation.mjs';
export function onRequestGet({request}){
 if(new URL(request.url).hostname!=='feat-founder-review-offer.aimt-site.pages.dev')return new Response('Not found',{status:404});
 return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Your private review | AIMT</title><link rel="icon" href="/favicon.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/css/aimt-design-system.css"><link rel="stylesheet" href="/assets/css/aimt-founder-review.css"></head><body class="fr-preview-body"><header class="fr-preview-header"><a class="fr-preview-brand" href="/my-aimt"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" fill="none">
  <g id="aimtOrbitalMark">
    <circle cx="22" cy="22" r="20" stroke="currentColor" stroke-width="0.75" opacity="0.6"/>
    <circle cx="22" cy="22" r="13.5" stroke="currentColor" stroke-width="0.5" opacity="0.3"/>
    <circle cx="22" cy="22" r="7" stroke="currentColor" stroke-width="0.5" opacity="0.2"/>
    <circle cx="22" cy="22" r="2" fill="currentColor"/>
    <circle cx="22" cy="2" r="1.5" fill="currentColor" opacity="0.75"/>
    <circle cx="36.1" cy="7.9" r="1.5" fill="currentColor" opacity="0.75"/>
    <circle cx="42" cy="22" r="1.5" fill="currentColor" opacity="0.75"/>
    <circle cx="36.1" cy="36.1" r="1.5" fill="currentColor" opacity="0.75"/>
    <circle cx="22" cy="42" r="1.5" fill="currentColor" opacity="0.75"/>
    <circle cx="7.9" cy="36.1" r="1.5" fill="currentColor" opacity="0.75"/>
    <circle cx="2" cy="22" r="1.5" fill="currentColor" opacity="0.75"/>
    <circle cx="7.9" cy="7.9" r="1.5" fill="currentColor" opacity="0.75"/>
  </g>
</svg>AIMT</a><span class="fr-preview-status">Your private review</span></header><main class="fr-preview-main">${bookingLayoutMarkup(BOOKING_URL)}<p class="fr-preview-note">Design preview · Please do not submit a test booking.</p></main></body></html>`,{headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex,nofollow'}});
}
