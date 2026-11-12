# AIMT Free Lead-Generation Products — Build Brief
**Status:** Implementation brief and editorial direction; not launch approval
**Date:** 2026-11-11
**Authority:** Owner's November 11 product-lineup decision; delivery record [Issue #165](https://github.com/brandrice-dev/aimt-site/issues/165).
**Build track:** `feature/head-spa-free-accelerator` branched from current `main`. Independent of the historical `course-audit-build` course-audit branch.

## 1. Product decision
AIMT will create **four free entry experiences** with **one reused readiness assessment**. They serve different search intents but share one educational identity, one user journey and, eventually, the *existing* approved lead capture and attribution infrastructure. This is **not five new lead databases or five new funnels**.

| Product | Demand / first question | Value delivered | Scope / current status |
| --- | --- | --- | --- |
| Free Head Spa Launch Accelerator | "Should I pursue head spa and how do I begin without expensive mistakes?" | Five short lessons, application and a Head Spa Launch Plan | New: curriculum and on-demand experience |
| Head Spa License & Scope Finder | "Which of these services can I legally perform?" | Official board source, activity-by-activity verification checklist, board inquiry draft | New: regulated-content review required |
| AIMT Scalp Observation Lab | "Can I learn what I'm looking at?" | Guided **non-diagnostic** observation and communication practice across suitable skin tones and hair textures | New: licensed/consented reference images required |
| Before You Buy: Head Spa Equipment Clinic | "How do I avoid an expensive purchase or setup error?" | Founder-led live Q&A and recording, equipment buying checklist | New: requires presenter and event logistics |
| Head Spa Readiness Score | "What do I need to work on next?" | Existing 15-question self-assessment and results; course transition | **Existing:** `head-spa-readiness.html`; revise only after safety/data review |

**Existing free tools to retain, not recreate:** `free-tools.html`, `head-spa-service-cost.html` (transparent cost model), `first-service-blueprint.html` (two-page, locally saved business plan), `education.html` / library. Reuse `assets/js/aimt-free-tool-capture.mjs` and the readiness endpoint only after their behavior is audited. Current free-tool contact gate saves name, email, tool type and separate optional marketing consent; it is **not** login/authentication. A shared registration identity or account-backed saved work is **not implemented by this pilot**.

## 2. Buyer promise, audience, conversion
**One buyer question:** "Should I do head spa, and how do I start it the right way without wasting money or getting stuck?"

Audience is **not only established salon owners**. Include cosmetologists, estheticians (within applicable scope), newer graduates, employees evaluating training and independent practitioners exploring a space. Do not assume every learner already has a business, space or clients.

The Accelerator helps a learner decide **whether to proceed and what to verify first**. It does not teach them enough to perform an independent professional head spa safely. The $697 **Head Spa Certification** teaches and assesses service execution, client interaction, cosmetic scalp observation, professional adaptation, operational consistency and documented learning. AIMT certification does not replace a state-issued license.

**Marketing headline direction:** large "DON'T ENROLL IN HEAD SPA CERTIFICATION" and subordinate "Until you can answer these questions." It is a deliberately provocative *invitation to prepare*, not a claim that someone must complete this free product before buying. Identify **FREE** in first viewport and title metadata. Keep language simple, credible and outcome-oriented, not hype or a traditional sales webinar. Do not label learning guides as "AI" in marketing; do not call this a masterclass.

Avoid invented demand/savings/earnings claims. A November 11 buyer research report found strong qualitative signals about licensing, supplier and equipment problems, training trust, cost/viability and camera diagnosis risk. Search suggestions have **no search-volume measurement**.

## 3. Accelerator curriculum — 30 attentive minutes
The content must be **taught**, not delivered as five PDFs. Every lesson has:
**Explain** a grounded concept → **Show** a useful contrast/example → **Reason** through a professional decision → **Apply** to the student's own situation → **Give feedback** → **Retain** a practical takeaway.
Use **different signature activities** in adjacent lessons, not five repeated multiple-choice quizzes. No XP, streak, decorative interaction, fake graded competency, autoplay or premature certificate.

| Lesson | Time | Core teaching | Signature learning activity | Takeaway |
| --- | --- | --- | --- | --- |
| **01. Can I Actually Offer This?** | ~5 min | A service name does not define legal scope. Verify the *individual activity* (shampoo, wet scalp service, massage/bodywork, styling, use of camera) against state board rules, facility and insurance constraints. | **Guided official-source lookup:** select state/license, find primary board source, label each planned activity as verified / unclear / not permitted **only if official source supports it**; otherwise unresolved; compose board questions. | Scope verification record and unresolved questions |
| **02. What Are You Actually Building?** | ~5 min | Honest differences between focused scalp add-on, dedicated head spa and extended format: promise, client experience, setup, transitions, timing, capacity. A longer service must add purposeful value. Don't claim shampoo-bowl services are universally obsolete. | **Service model decision lab:** observe comparisons; choose a format based on guest, space and real service goal; receive context-specific feedback. | First service model statement and one question to verify |
| **03. Set Up Without Regret** | ~6 min | Understand plumbed / portable / attachment *tradeoffs*, capacity, freshwater and wastewater handling, electrical/hot water requirements, parts, warranty, sanitation, safe installation. | **Equipment mistake scenario + setup planner:** choose first verification before purchasing; discover the missing installation requirement; develop supplier questions. | Setup decision checklist and provisional equipment path |
| **04. What Am I Looking At?** | ~6 min | Distinguish observed location, visible features and distribution from medical interpretation. Frame safely across skin tones, hair density, curls, coils, protective styles and locs. Know when to stop or refer. | **Guided visual observation:** use permissioned, accurately labeled examples with feedback, not arbitrary uploaded skin photos or diagnosis. | Short non-diagnostic observation sentence and practice priority |
| **05. My Next Move** | ~6 min | The right order: scope → concept and cost → setup feasibility → training and practice → readiness for client-facing delivery. Evaluate training honestly, including hands-on limitations, refunds, assessment and verifiable credentials. | **Sequencing exercise + training-vetting choices** followed by existing Readiness Score. | Next three actions and training questions |
| Opening + wrap | ~2 min | Orientation, stakes and what the mini course cannot confer; gather/save final plan. | Review | Head Spa Launch Plan |

**Protect two ideas from the earlier three-lesson draft**: (a) a real service may require more practitioner time than the advertised treatment duration; (b) asking clarifying questions before handling a client concern demonstrates *practitioner judgment*. Add a short cost/viability moment in Lesson 02/05 that links the existing cost worksheet; use an illustrative client-conversation moment in Lesson 04 or 05 without pretending it is full consultation training.

### One connected output, not five unrelated worksheets
A single *Head Spa Launch Plan* accumulates:
- Provisional role, state and planned activities needing board review (never a computer-generated legal clearance).
- Intended clients, chosen first service model and client promise.
- Space/equipment constraints and **unverified** requirements; installation/sanitation questions.
- A working cost assumption or link to the existing service-cost worksheet, explicitly not a profit forecast.
- A sample observation statement and specific practice need (do not store real client or medical data).
- Next three actions and a self-identified training priority.

Reuse/extend the **existing** `first-service-blueprint.html` instead of creating an incompatible data model. Pilot may keep anonymous answers locally; production import/export/save requires review against existing JSON schema and privacy rules.

### Teaching quality gate
Each student-visible block must answer: *What is this teaching? Why does a practitioner care? What should the learner choose or explain? What concrete feedback follows?* If it only requires a tap or copying a checklist, replace it. A working interface without teaching is **not** a completed course.

## 4. Lead magnet-specific build contracts

### A. License & Scope Finder
- First screen: **state** and **license type**, then planned individual activities.
- Show official **primary board** source link, title, jurisdiction, last checked date, limitation; where no verified guidance exists show **"Not determined — verify with your board"**.
- Provide copyable neutral inquiry: "I hold [license] in [state]. I am considering [activities]. Can you identify governing scope, facility, permit and supervision requirements, and point me to the written regulation?"
- No generic state-by-state green checkmarks, no legal advice, no broad "esthetician can do head spa" assertions.
- Requires human legal/regulatory review, monitoring/maintenance owner, and per-jurisdiction coverage ledger before public launch. Begin with five official-source jurisdictions only *after* verified texts are reviewed; others stay unclassified. Refuse unsupported certainty.

### B. Scalp Observation Lab
- Demonstrate **observation → reasoned description → appropriate communication**, not photo diagnosis, treatment selection or hair-growth claims.
- Reference library needs actual provenance (permission/consent, skin tones, hair types, context, nonidentifying capture, correct labels) and qualified medical review where needed; illustrations must be clearly marked illustrative.
- Exercise examples: identify what is *visible*, avoid inferring etiology; distinguish an observation from a diagnosis; practice "I can see [observation], but this picture alone can't establish [condition]."
- **No real-photo upload in version 1.** Explicit approval of data retention, consent, security, review process and non-diagnostic limits required before personal scalp photos are ever accepted.
- Support locs, curly/coily hair and varied scalp pigmentation in examples, do not make "every hair type" guarantees until actual materials prove coverage.

### C. Equipment Clinic
- Founder brings direct operational experience with **plumbed and non-plumbed beds, parts replacement, custom capacity/hot-water modifications, and US distributors versus direct imports**.
- Treat first-hand details as **interview prompts**, not fictionalized testimonials or unverified claims about vendor quality/installation compliance.
- Pilot agenda: 10m equipment tradeoffs; 10m US versus China purchase routes and after-sales support; 10m failures/repairs and what changed; 20–30m audience Q&A.
- Request questions upon event registration; film equipment and parts as available; capture before/after diagrams only when accurate; respect code/licensing/electrical/plumbing/contamination issues. A modification anecdote is not a do-it-yourself installation instruction.
- Outputs: replay, short proof clips, FAQ grouped by issue, honest buyer checklist for warranty/parts/water/electrical/sanitation/service volume.
- **No live event is booked, attendee contacted or platform expenditure authorized here.** That requires presenter availability and release approval.

### D. Readiness Score
- Existing 15 questions across five pillars and existing private submission / marketing-consent pathway are the authority.
- Review adding **state, license, stage and textured-hair service need** as segmentation *only* after verifying purpose, data model, privacy and reporting implications. Never make an automatic scope/legal/medical determination from the score.
- The course should offer a **route to the existing score** as its next step; no duplicate form, lead table or certification-like grading.
- Display educational next-step recommendations from truthful course content, avoiding "ready to treat clients" based on a few clicks.

## 5. Funnel, measurement, release
```
Public discovery: search / short video / Free Tools hub
  ├─> Accelerator: learn → save plan → existing Readiness Score
  ├─> Scope Finder: find source → identify unanswered questions → Accelerator
  ├─> Scalp Lab: observe → learn boundaries → Accelerator / Certification
  └─> Equipment Clinic: register → attend/replay → equipment checklist → Accelerator
       ↓ (where appropriate, one existing lead/consent system)
Head Spa Certification detail page → optional checkout
```
Preserve the existing `assets/js/aimt-growth.js` and `docs/growth/AIMT-Growth-Measurement.md` semantics. Do not send personal notes, photo content, license numbers, legal questions or detailed student responses into analytics. First pilot measures only **anonymous** usability; final production metrics/consent are separate high-risk work. Recommended conversion analysis: visits → enrollment/first lesson → meaningful exercise completed → course finished → readiness view → certification view → verified Stripe enrollment. Measure these only when event taxonomy and privacy are reviewed; do not infer sales from clicks.

**Production release gates:** curricular review and real learning time; verified sources; all interactive controls tested with keyboard/touch; screen reader / mobile QA; meaningful feedback; no PII leakage; lead form and consent review; official scope sources; original image rights; owner acceptance; separate PR/review; deploy to main **only with specific owner approval**.

## 6. Immediate pilot and non-goals
- Build **Lesson 02** first. It relies on existing AIMT service design knowledge and tests actual teaching with minimal legal/scientific ambiguity. Equipment expertise is saved for founder-led clinic instead of invented by the course author.
- A single unlisted self-contained preview page can demonstrate a full lesson (not pretend five are finished). No new signup or backend in preview, no fake enrollment. If local drafts are saved, state that they are device-only and offer a manual copy/export.
- The preview may link to existing **First-Service Blueprint** and **Service Cost Worksheet** but must not alter their established access rules.
- **No** changes to Stripe, Supabase, entitlement/auth, certificate, paid student content, internal research pipelines, marketing emails, live homepage, SEO index, or production.
- $0 newly authorized external provider spend. AI/API usage costs from already-connected tooling are not measured here; do not claim $0 total execution spend.

## 7. Review checklist and next handoff
- [ ] Full Lesson 02 explanation, realistic scenario, independent decision and specific feedback built.
- [ ] Interactive result identifies the model, its reason and unresolved constraint.
- [ ] Browser/mobile/keyboard/readability test completed; record evidence and gaps.
- [ ] Five-lesson story reviewed for real pedagogic value (not PDF-in-a-page).
- [ ] Owner reviews lesson preview and voices/imagery needed.
- [ ] License Finder official source ledger reviewed before code / public pages.
- [ ] Scalp Lab reference media permissions and medical-review process established.
- [ ] Equipment Clinic founder question intake, event platform and recording consent confirmed before any invitations.
- [ ] Readiness and existing capture architecture reviewed before integration.
- [ ] Release approval recorded in issue; only then create/merge deployment PR.

**Status definitions:** editorial brief = **PROPOSED**; functional isolated prototype = **IMPLEMENTED** after commit; **TESTED** only with named checks; **DEPLOYED/VERIFIED** only after permitted live release and observation.
