## AIMT CODEX HANDOFF (CLEAN)

You are working on the AIMT (American Institute of Modern Trichology) site.

PROJECT

Premium, minimal, clinically-aware education platform  
Not a generic LMS  
No gamification  
No heavy quiz systems  
Maintain a restrained, institute-level tone  

Prefer lean, static-friendly implementation

STRUCTURE

- index.html → homepage  
- courses.html → certifications listing  
- headspa-mastery.html → course + experience  

Funnel:
index → courses → course → checkout → success → account → direct course entry

CURRENT SYSTEM (DO NOT BREAK)

Course (headspa-mastery.html):
- checkpoint progression (pass / retry)
- persistence + resume
- sequential unlocks
- Cadence memory layer
- purchase block near top

Stripe:
- startCheckout() active
- endpoint: functions/api/create-checkout-session.js
- uses direct HTTP (no npm)
- success → success.html
- cancel → ?checkout=canceled

Supabase:
- signup handled in success.html
- uses CDN + anon key
- redirects to: ?enter=1

Course entry:
- ?enter=1 + valid session → bypass landing
- uses:
  - shouldEnterPurchasedCourse()
  - enterPurchasedCourseHome()

CONSTRAINTS

- Do NOT redesign
- Do NOT add dashboard
- Do NOT add new systems unless required
- Do NOT bloat UX
- Preserve funnel exactly
- Match existing style (premium, minimal, clinical)
- Keep changes small and precise

KNOWN LIMITS (DO NOT FIX UNLESS ASKED)

- No full auth gating yet  
- No dashboard  
- No entitlement system  
- Sign-in flow incomplete  
- QA not fully done  

WORKING RULES

Before making changes:

1. Inspect file first  
2. Preserve its role in funnel  
3. Make minimal edits only  
4. Stay compatible with:
   - Stripe flow  
   - Supabase signup  
   - direct course entry  
5. Do NOT overwrite existing logic  

OUTPUT RULES

- Be concise  
- Only change what is necessary  
- Do not explain unless needed  
- Do not rewrite entire files unless required  

TASK

Proceed with the requested change only.
