# AIMT Master Launch Checklist

**Status as of:** 2026-09-17 (Listen Mode integration + Module 0 rebuild
pass), branch `course-audit-build`, HEAD `6b36a58f` (unchanged — still
nothing committed this pass either). Built from the actual current
repository state (code, tests, and file presence), not aspirationally. This
revision reflects: **Modules 1, 4, 5, 6, 7 Listen Mode are now actually wired
into the live player** (previously only narration/audio existed — the app
itself had zero mount calls for anything but Module 1), a full Module 0
strict-fidelity rebuild staged for owner review (generation blocked, see
below), a new employee-pilot readiness checklist, and an Admin-pilot
readiness assessment. See "What changed in this revision" at the bottom for
the full list.

States used: **DONE**, **READY FOR OWNER ACTION**, **READY FOR OWNER
REVIEW**, **READY FOR QA**, **IN SEQUENCE (pre-launch)**, **DEFERRED AFTER
LAUNCH (owner-elected)**.

---

## COURSE

| Item | State | Note |
|---|---|---|
| Module 1 Listen Mode | DONE (integrated) | Owner-approved, strict-fidelity rebuild complete, and (already) the one module actually wired into the live player. LOCKED — do not touch. |
| Module 4 Listen Mode | **DONE — INTEGRATED this pass** | Owner-approved narration was already complete; this pass cut the owner's CapCut-processed batch masters into 17 individual player chunks (silence-snapped, position-anchored boundaries — see `scripts/aimt-listen-install-module.mjs`), installed them at `assets/audio/listen/headspa-mastery/module-04/`, added the `HEADSPA_MODULE_4` manifest entry, and wired the "Listen with Cadence" button + player mount into `headspa-mastery.html`. All 17 chunk URLs verified resolving (200), checkpoint gating verified via the real engine functions, Resume/Close→Resume/Listen Again/speed/minimize all verified live in-browser. LOCKED — do not touch. |
| Module 5 Listen Mode | **DONE — INTEGRATED this pass** | Same integration as Module 4 (15 chunks). **Data-hygiene note carried forward, not yet fixed:** `docs/course-audit/listen-mode/tts-final/module-05/manifest.json` still carries a stale `ownerAudioReviewPending: true` flag from before your approval. LOCKED — do not touch, do not regenerate. |
| Module 6 Listen Mode | **DONE — INTEGRATED this pass** | Same integration as Module 4 (14 chunks). The owner-approved §6.4 visual card-position fix from the prior pass is preserved untouched. LOCKED — do not touch. |
| Module 7 Listen Mode | **DONE — INTEGRATED this pass** | Same integration as Module 4 (9 chunks). **Note:** `M7-BATCH-A1-PROCESSED.WAV` and `M7-BATCH-C1-PROCESSED.WAV` were initially missing/misnamed when this pass started (A1 exists on disk as `M7-BATCH-A1-PROCCESSED.WAV`, a pre-existing owner-side typo — not renamed, per instruction not to touch owner audio filenames; C1 was added mid-session by the owner) — both now present and used as-is. Its `m7-08` chunk is a deliberate carried-over judgment call from the original build (a checkpoint-stop for `m7cp2` whose narration opens with the `m7cp1` resume transition, since the live page has no numbered section between the two checkpoints). LOCKED — do not touch. |
| Module 8 Listen Mode | GENERATED — AWAITING OWNER REVIEW | Strict-fidelity coverage audit (100% substantive coverage, 18 chunks across the module opener, 7-phase overview, Core/Extended, all 9 masterclass chapters, Protect-the-Flow interaction, and both checkpoints) + last-third re-check (PASS). 14 ElevenLabs batches (`A1–A11, B1, B2, C1`; `m8cp1` stops in A11, `m8cp2` stops in B2), 31,745 chars, **$5.24 real cost**, 39m34s runtime, RAW/EDIT WAV exact-duration-validated. Zero "answer above" instances — this module's own rebuild is clean of the bug flagged below. None of the 9 real service videos narrated, per instruction — each screen-cued via its "Watch for" line. Old v1 script/audio (pre-dating the 9-video reconciliation) archived per convention. **Awaiting your listen-through before any CapCut cut or manifest wiring.** Full detail: `docs/course-audit/listen-mode/module-08-fidelity-coverage-audit.md`. |
| Module 0 Listen Mode | **NARRATION REBUILT + AUDIO GENERATED — STAGED FOR OWNER REVIEW** | Full v2 strict-fidelity rebuild (100% substantive coverage, mandatory end-of-module fidelity re-check PASS, Headline Rule disposition for every heading, TTS preflight PASS). All 4 previously-found defects fixed: "answer above" → "answer below"; the orphaned `M0-01b` "Before you begin" chunk removed entirely (content lives only in `#howAimtWorksView` now); the 5-item "In this module" list narrated individually in Reference Voice; the 0.5 "From Cadence" card first-person-adapted, matching Modules 5/6/7's pattern. **Real audio generated this pass** (an ElevenLabs-backed tool became available mid-session): all 6 batches, exactly `Jane`/`Y3ZPRGOSIxbV4Rbb3WiA`/`eleven_v3`/1 generation each — voice/model verified from the raw API response on every batch, not assumed. 15 chunks, 12,801 chars, **$2.10 real cost** (under the pre-generation $2.30–2.35 estimate), 16m15s total narration. RAW mp3 + duration-matched lossless EDIT WAV for every batch, staged at `AIMT-Listen-Mode-Final/00-Welcome-v2-staging/` — a new, separate directory; the old v1 audio in `AIMT-Listen-Mode-Final/00-Welcome/` was never opened or modified (confirmed via mtimes). Full detail: `docs/course-audit/listen-mode/module-00-fidelity-coverage-audit.md`. **Still not integrated into the live player** — per instruction, stops at owner-review staging. **Remaining before integration:** the same CapCut finishing pass + position-anchored chunk-cutting every other module went through (owner-side production step, not yet done for this staged audio). |
| Modules 2, 3 Listen Mode | DEFERRED AFTER LAUNCH (owner-elected) | May remain intentionally deferred until after launch **if** the owner consciously accepts their current (pre-strict-fidelity) narration as-is. Not silently grouped with Modules 8–12 — this is a distinct, lower-stakes case (existing narration, not missing narration). |
| Modules 9–12 Listen Mode | IN SEQUENCE (pre-launch) | **Not after-launch.** Pre-launch owner gates, one module at a time after each prior module's owner approval — Module 9 next, only after Module 8 is reviewed and approved. **Module 9 explicitly not started** (confirmed 2026-09-17). |
| **"Answer above" narration bug in already-shipped audio** | **OWNER DECISION NEEDED** | Material finding, independently verified: the literal phrase "Take your time, and answer above." (backwards — the response field is below the prompt, not above) is present in the real, generated, paid-for, **already-approved** audio for Module 5 (batches A6, B4) and Module 6 (batches A5, B5), plus 11 more instances across Modules 00, 02, 03, 09, 10, 11 — **13 shipped batch files total, down from 15** (Module 8's 2 affected instances no longer apply — that content was fully replaced by the 2026-09-16 rebuild, confirmed clean of the bug). Nothing has been touched (explicit instruction: do not rewrite/regenerate 1/4/5/6). A permanent rule + automated preflight gate now prevents recurrence in Modules 9–12 (see `docs/course-audit/listen-mode/00-listen-mode-editorial-standard.md` §F). **Your call:** accept the remaining 13 as-is, or authorize a future narrow re-generation of just the affected checkpoint-closing batches. |
| **Module 5 generation-log bookkeeping** | **RESOLVED (2026-09-17)** | Repaired using the same verified method as Module 7: the 6 stale entries (matching the archived, rejected v1 audio's file sizes, not the approved v2 audio) were annotated in place — not deleted — and 11 correct entries appended, sourced directly from `module-05/manifest.json`'s own embedded per-batch `generation` records (real `generationId` for every batch, real decoded duration, real cost — cross-checked exactly against the manifest's own `generationSummary` totals: 1813.002s, $3.74). All 11 batches now validate cleanly against the actual approved audio (0.00s difference). Module 5 audio itself was never touched. |
| **Modules 1/4/6 generation-log check** | **Checked, no action needed** | Read-only integrity pass (2026-09-17): these three logs also carry orphaned entries from an even earlier, fully-superseded pass, but — unlike 5/7 — this isn't currently causing any validation failure (Modules 1/4's correct data lives under separate `"01v6"`/`"04v6"` tags; Module 6's correct entries simply resolve correctly as the later array entry). Confirmed via full validator run: **94/94 EDIT.wav files pass across every module in the repo.** Left as-is — messy but not broken, out of scope. |
| Module 8 service videos (Vimeo) | DONE | All 9 `STEP_VIDEO_IDS` slots populated with real Vimeo IDs, no placeholders. |
| Checkpoints (all modules) | READY FOR QA | Checkpoint logic/grading untouched all session; all Listen Mode work for every module (including Module 7's rebuild and Module 6's visual DOM move) explicitly preserved checkpoint IDs/prompts/rubric/gating unmodified. |
| Module 12 Final Certification Assessment / buy-page preview | DONE | Confirmed rendering correctly desktop + mobile in an earlier regression pass; disclaimers present. |
| Certificate issuance path | DONE (verified) | `functions/api/issue-certificate.js` traced: 4 sequential gates (entitlement → idempotency → progress score ≥1200 → certification pass decision). Admin grants cannot satisfy gates 3–4 — verified structurally, cited in the Admin runbook. The runbook's live-POST test of this endpoint was corrected this session (see ADMIN section) — it's no longer treated as safe/read-only. |
| Hero image optimization | DONE (mostly) | Homepage hero already swapped to WebP (2.1–2.4MB). One orphaned 7.2MB unused `assets/aimt-hero-image.png` remains (dead weight, zero references — after-launch cleanup). |
| Module 3 course image (`aimt-scalp-cross-section.png`, 7.5MB) | DEFERRED AFTER LAUNCH | Still actively referenced and unoptimized — real page-weight item, not blocking. |

## STUDENT EXPERIENCE

| Item | State | Note |
|---|---|---|
| Buy page / sales page | DONE | Renders correctly at the clean URL, verified visually this session (screenshot, no console errors). |
| Clean course URL `/head-spa-certification` | READY FOR BRANCH-PREVIEW QA | Routing architecture fixed and verified locally via `wrangler pages dev` (real Cloudflare Pages edge emulation). Not "done" — local emulation is not the production edge; needs one real branch-preview confirmation plus the new post-production-deploy smoke test before this is actually closed. See `docs/course-audit/CLEAN-URL-PREVIEW-DEPLOY-CHECKLIST.md` (now includes a Pages-Functions route-interception check — confirmed clean, no function outside `/api/*` — and a full post-deploy smoke-test section). |
| Checkout (Stripe) | READY FOR QA | Untouched this session; webhook/claim logic out of scope and per CLAUDE.md hard rule #1, never modified without explicit ask. |
| Account setup / entitlement claim | READY FOR QA | Untouched this session. |
| My AIMT dashboard | DONE | Resource-loading test crash fixed earlier; this session added the gated Admin entry link (see ADMIN section) to its nav/account panel. |
| Service Timer + login return path | DONE | Safe `?next=` routing implemented and tested; independently re-verified passing this session (`tests/service-timer-login-next-route.test.mjs`). |
| Review Mode | READY FOR QA (safe) | Confirmed 2026-09-16 by reading `assets/js/aimt-progress-sync.js`: Review Mode (`?review=1`) explicitly skips `AIMT_SYNC.init()` entirely, and is eligible on `*.pages.dev` branch-preview hosts — this is the **safe**, mutation-free way to exercise Module 12/checkpoints on a preview. |
| Authenticated course entry (`?enter=1`) | READY FOR QA — **mutation risk** | New finding, 2026-09-16: confirmed in source that opening the real course while signed in (`?enter=1`) triggers an immediate real `course_progress` upsert via `AIMT_SYNC.init()` — not a passive "just look" action on a shared-Supabase-project preview. Full ordered QA sequence with per-step mutation labeling now in `docs/course-audit/OWNER-PREVIEW-QA-SEQUENCE.md`; this step is marked **requires explicit owner approval before running**. |
| **Employee pilot readiness** | **READY, pending Admin activation** | New this pass: `docs/AIMT-NEW-EMPLOYEE-PILOT-CHECKLIST.md` — an 18-step, concise walkthrough (Admin grant → account setup → orientation → Listen Mode → checkpoints → progress → Service Timer → Module 12 → certificate → public verification), each step labeled automatic vs. requires admin action, plus a 9-question employee feedback section. **Blocked on the same Admin-activation prerequisites as the Admin section below** (migration + `AIMT_OWNER_EMAIL`, both owner-only actions) — the checklist itself is ready to run the moment those are done. Listen Mode step (11) is now fully testable for Modules 1/4/5/6/7 (integrated this pass). |
| Completion / certificate verification (`verify.html`) | READY FOR QA (safe) | Untouched; QA fixture block confirmed hard-gated to localhost, not reachable in production. Confirmed 2026-09-16: `functions/api/verify-credential.js` is a public, unauthenticated, read-only lookup with no write path — safe to QA anytime, including on a preview. |

## ADMIN

| Item | State | Note |
|---|---|---|
| Admin MVP code | DONE | 43/43 deterministic tests passing (`admin-mvp.test.mjs` + `admin-mvp-behavior.test.mjs` + `admin-manual-grant-invite.test.mjs`), independently re-verified twice. |
| Admin docs final pre-activation check | DONE | 2026-09-16 pass verified all 13 required documentation items against the actual code (not just prose) and found 3 real staleness bugs, now fixed: runbook §14 wrongly said the Grant button was still visible to support role (it isn't — corrected with the real test citation); spec §6's audit-log list was missing `reactivate_manual_course_access` (added); runbook §8 still described the manual-grant invite as an unbuilt future workstream (rewritten present-tense, now correctly cites `functions/_lib/admin/manual-grant-invite-email.mjs`). One new minor architecture note found and documented (not fixed): `admin.html`'s grant modal hardcodes "Head Spa Certification Course" in copy, alongside the already-known `COURSE_SLUG` coupling. |
| Migration (`20260905_create_admin_mvp.sql`) | READY FOR OWNER ACTION | Not applied — must be run manually in the Supabase SQL editor per CLAUDE.md. Runbook explicitly now warns this is a real production-database mutation, not an isolated preview action (see next row). |
| Preview ≠ isolated database | **READ THIS FIRST** | Explicit warning in the runbook: a Cloudflare branch preview only isolates the web-app layer. It points at the same (only) Supabase project as production, so migration application, owner bootstrap, account/entitlement creation, revoke/reactivate, and audit-log writes performed against a preview are REAL mutations in that project — never treat them as "safe because it's a preview." **Sharpened 2026-09-16:** the branch-preview readiness pass read the actual code (not assumed) and found the *very first* authenticated `GET /api/admin?view=me` call, while `admin_users` is still empty, silently inserts the real owner row — i.e., simply checking whether the new My AIMT admin link *renders* on a preview can accidentally bootstrap the live owner account. Marked "requires explicit owner approval before running" in the new `docs/course-audit/OWNER-PREVIEW-QA-SEQUENCE.md`. |
| `AIMT_OWNER_EMAIL` env var | READY FOR OWNER ACTION | Exact intended value now documented explicitly: `AIMT_OWNER_EMAIL=brandon@aimtrichology.com`. Not set live — production environment change, owner-only. |
| First-owner bootstrap | READY FOR OWNER ACTION | Explicit-approval item — never done automatically. Controlled validation sequence now documented in the runbook: Brandon bootstraps → signs into Admin → grants a staff-source test enrollment to a test account ("Cady") → verifies normal access, zero artificial progress, checkpoints/certificate still gated, correct audit log → revoke → reactivate. Explicitly noted: staff enrollment does NOT make the test account an Admin; that would be a separate action. |
| Live certificate-POST test corrected | DONE | The runbook previously treated a live `POST /api/issue-certificate` call as safe/read-only when expected to fail. Corrected this session: that endpoint can create certificate/completion state if its gates unexpectedly pass, so it can never be "safe by construction." The lower-risk option was chosen — the live POST test is omitted from the runbook entirely; validation relies on source-reading + existing automated gate tests + UI gating instead. |
| Support-role UI polish | DONE | `admin.html` now hides/disables Grant/Revoke/Reactivate controls for support-role actors (new `canMutate()` gate) — UX only; server-side `requireAdminRole` was already, and remains, the real boundary. New static test added. |
| Authenticated Admin entry link | DONE | `my-aimt.html` now shows an "AIMT Admin" link (desktop nav + mobile panel), revealed only after a real `GET /api/admin?view=me` call confirms an active admin/owner/support row — never gates on "logged in" alone, and never replaces `/admin.html`'s own server-side check. |
| Admin shell future-proofing review | DONE (documented, not rewritten) | Client shell judged already sufficiently modular (single generic `data-view` pattern; centralized role/audit logic). One real single-course coupling found (`COURSE_SLUG` constant, per-`user_id` student summaries) — flagged as a moderate future fix in the spec, not changed now since it's low-urgency and outside a course-content-safe scope for this pass. |
| Manual-grant onboarding email | DONE | Implemented and tested this evening (see EMAIL section) — closes the gap where a manually-granted student previously got no email at all. |
| Admin Activation Runbook | DONE | All corrections above folded in; previously also audited against real code (4 inaccuracies fixed, certification-gating section, A/B/C task categorization, 12-item post-activation verification sequence). |
| Server-side admin gating | DONE (verified) | Confirmed via code and this session's independently-rerun test suite: unauthenticated/non-admin requests get 401/403 before any privileged data is touched; `admin.html` itself carries no privileged data client-side. |

## EMAIL / STRIPE

**Owner-executable sequence (2026-09-16):** everything in this section is
now compressed into one short, ordered click-through —
`docs/stripe-and-email/AIMT-OWNER-SETUP-SEQUENCE.md` — instead of requiring
you to re-derive steps from the full audit docs. The manual-grant invite
code was re-verified against source (not just docs) as part of writing it:
9/9 tests passing, confirmed new-account-only firing, confirmed a send
failure never rolls back the entitlement.

| Item | State | Note |
|---|---|---|
| Google Workspace (info@/support@/hello@) | DONE | Already exists, untouched, correctly referenced everywhere. |
| Root-domain SPF/DKIM verification | READY FOR OWNER ACTION (RECOMMENDED BEFORE LAUNCH) | New this session: verify existing Google Workspace SPF (`v=spf1 include:_spf.google.com ~all`, confirmed live via `dig`) and DKIM before adding DMARC below. Documented exact owner steps; no live DNS touched. |
| Root DMARC (`_dmarc.aimtrichology.com`) | READY FOR OWNER ACTION (RECOMMENDED BEFORE LAUNCH) | Elevated from "optional awareness" this session. Currently no DMARC record at all (confirmed via `dig`). Recommend starting conservatively at `p=none` and monitoring before any future tightening. Kept explicitly separate from `auth.aimtrichology.com`'s own transactional-email DNS — they cannot conflict. |
| `auth.aimtrichology.com` Resend DNS | READY FOR OWNER ACTION | Guidance broadened this session: add **every** DNS record Resend shows at domain-creation time (not just an assumed SPF/DKIM pair — Resend may also show MX/return-path records). Use the exact live values Resend displays, not a hardcoded guess. |
| Supabase auth email templates | READY FOR OWNER ACTION | 3 templates ready to paste into the Supabase dashboard (confirm-signup, reset-password, change-email). Reply-to guidance corrected this session — only document it as a real field if the live dashboard actually exposes it; don't assume. |
| Native Supabase password-changed email | READY FOR OWNER ACTION | Corrected this session: a previously-proposed custom Cloudflare endpoint was removed from the plan. Use Supabase's own native "Password Changed" security notification instead of duplicating it; brand that native template if the dashboard supports it. |
| Manual-grant invite email | DONE | Implemented and tested this evening: `functions/_lib/admin/manual-grant-invite-email.mjs`, wired into `grantAccess()`, fires only on genuine new-account creation, dedupes via an audit-log idempotency check (`admin-grant/<grant-id>`), never blocks or rolls back the entitlement on send failure (surfaces a warning instead). 9 new deterministic tests, all mocked — no real email sent anywhere including tests. Reclassified out of the old "6 custom emails, all blocked" bucket — this one is pre-launch and shipped. |
| Remaining custom AIMT transactional emails (5) | DEFERRED AFTER LAUNCH | Enrollment-confirmation, certification-earned, review-received, educator-remediation-received. Templates are brand-accurate and ready; send-code wiring is separate engineering work, explicitly not done this session (enrollment-confirmation's trigger point is `stripe-webhook.js`, off-limits without explicit ask; the other three sit outside this session's scope). |
| Idempotency for custom sends | DONE (documented + implemented for the one live send) | Deterministic key scheme documented for all 5 future send types (`enrollment/<checkout-session-id>`, `certificate/<credential-id>`, `review/<request-id>`, `remediation/<request-id>`); implemented for the manual-grant invite via an audit-log dedupe check (chosen over trusting Resend's own idempotency header, since that can't be verified without a live call). |
| AIMT mark for email | DONE | Verified genuinely derived from canonical `favicon.svg`, no Cadence-mark mix-up, transparent background confirmed. |
| Email client robustness | DONE | Fallback fonts, mobile width, dark mode, tap targets, footer consistency all verified across all templates. |
| Stripe branding (logo, accent color, receipts) | READY FOR OWNER ACTION | Exact settings documented (`#262626` accent, exported 512×512 icon PNG, business name "AIMT") — no live Stripe change made. |
| `pay.aimtrichology.com` custom domain | DEFERRED AFTER LAUNCH (optional) | Mechanism is realistic (subdomain CNAME + Stripe-issued TLS); this session flagged explicitly that it **may be a paid Stripe feature/tier-gated** — not confirmable from the repo. Not launch-blocking. |

## QA

| Item | State | Note |
|---|---|---|
| Desktop rendering | DONE | Spot-checked across touched pages, no issues. |
| Mobile rendering (375px) | DONE | No horizontal overflow found across all touched pages. |
| Keyboard / accessibility | READY FOR QA | Password-toggle aria-labels verified correct; no dedicated full keyboard-nav pass done. |
| Real-device QA | READY FOR OWNER QA | Corrected this session — not "technically blocked," simply not yet performed. Everything so far used browser emulation (`wrangler pages dev` + headless browser), not a real device. |
| Deterministic test suite | **111/114 — corrected baseline this pass, see note** | **Correction:** this checklist previously stated 113/114 after the 2026-09-16 session; re-running the full suite fresh at the start of this 2026-09-17 pass found **111/114** (3 failing), not 113/114 — two failures (`tests/module-08-course-source-freeze.test.mjs`, `tests/module-08-timer-checkpoint-order.test.mjs`) were already present at committed HEAD `6b36a58f` before this session touched anything (confirmed: both files untouched in the working tree, both check Module 8's Listen Mode script doc against the Module 8 timer/checkpoint reordering landed in that same commit — Module 8 is this pass's off-limits owner-review module, so neither was fixed). This pass also introduced, then fixed, one transient regression: archiving Module 0's v1 script (Workstream B, before its v2 replacement was written) briefly broke `tests/module-02-rebuild.test.mjs`; the v2 script's arrival fixed the crash, and one stale assertion (checking for the old, now-intentionally-reversed "M0-01b must exist" behavior) was re-targeted at the real v2 rebuild's properties — full detail in that file's own updated comments. **Net result of this pass: 111/114, unchanged from this pass's own start** — only the pre-existing, protected `tests/aimt-listen-mode-module1-pilot.test.mjs` (point-in-time snapshot, invalidated by any diff to `headspa-mastery.html` by design, including this pass's legitimate Listen Mode wiring) and the two pre-existing Module 8 failures remain red. Full detail: `docs/course-audit/AIMT-TEST-FAILURE-TRIAGE.md` and `docs/course-audit/AIMT-ORIENTATION-TEST-DECISION.md` (both pre-date this pass; the 113/114 figure they and the prior checklist revision cite has not been reproduced by this session's own fresh runs). |
| `sitemap.xml` / `robots.txt` | DONE | Both correctly point at production, not the Cloudflare staging domain. |

## DEPLOYMENT

| Item | State | Note |
|---|---|---|
| Branch state | READY FOR OWNER REVIEW / CHECKPOINT COMMIT | `course-audit-build`, 61 files touched across both sessions, still fully uncommitted pending owner review; `main` untouched at `be33f50e`. A complete working-tree integrity audit now exists (`docs/course-audit/AIMT-WORKING-TREE-INTEGRITY-AUDIT.md`) — tree judged clean, no secrets, no duplicate work, 3 minor non-blocking flags (a `.gitignore` case-sensitivity gap for uppercase audio extensions, one already-fixed piece of prior agent residue in a test file, one cosmetic git-staging inconsistency between two archive files). |
| Checkpoint commit plan | READY FOR OWNER REVIEW | New this pass: `docs/course-audit/AIMT-CHECKPOINT-COMMIT-PLAN.md` recommends **6 separate commits** (test hygiene; course/routing; Admin MVP; email docs/templates; Listen Mode Module 6 tooling — no audio; cross-cutting session docs) over one squashed commit, with exact file lists, 3 identified hard test/source dependency pairs, and before/after test commands per commit. Explicitly confirms via `git check-ignore -v` that no audio file is committable. One self-check error in the plan's first draft (a buggy hand-reimplemented checkpoint-rubric hash) was caught and corrected against the real project function before this checklist was written. |
| Owner Preview QA Sequence | READY FOR OWNER REVIEW | New this pass: `docs/course-audit/OWNER-PREVIEW-QA-SEQUENCE.md`, 16 ordered steps for the eventual branch-preview deploy, each labeled with login requirement and mutation risk — including the two newly-discovered real-mutation risks above (`?enter=1`, first admin view). |
| Preview verification | READY FOR QA | `docs/course-audit/CLEAN-URL-PREVIEW-DEPLOY-CHECKLIST.md` covers Pages-Functions route interception (confirmed clean), a full post-production-deploy smoke test, and (added this pass) a complete environment-variable inventory (9 vars across all functions) that didn't exist in any single doc before. |
| Owner approval | BLOCKED (by design) | Nothing committed or pushed pending your review of everything in this session, including Module 6's audio. |
| Merge / deploy | BLOCKED (by design) | Explicitly not attempted — only happens after your approval. |

---

## AFTER-LAUNCH LIST (does not block launch)

- Module 4.8 illustrative visual-reference cards for high-value stop/modify/refer scenarios (owner-known item).
- Module 2/3 Listen Mode fidelity rebuild — **only if** the owner elects to defer rather than accept their current narration as-is (see COURSE section; not a blanket "after launch" the way it was previously grouped).
- Remaining 5 custom transactional email send-code wiring (enrollment-confirmation, certification-earned, review-received, educator-remediation-received — templates ready, not yet triggered from app events).
- `pay.aimtrichology.com` custom Stripe domain (optional, possibly paid).
- Module 3's remaining oversized course image (7.5MB PNG).
- Orphaned unused 7.2MB hero PNG cleanup (`assets/aimt-hero-image.png`).
- `student-access.html` (and `headspa-mastery.html`) dead staff-autosignup code — confirmed genuinely unreachable, deliberately left in place since removing it requires also updating a test that pins its presence; narrow, low-risk follow-up.
- Admin shell's single-course coupling (`COURSE_SLUG` constant, per-`user_id` student summaries; plus a newly-found hardcoded "Head Spa Certification Course" string in `admin.html`'s grant modal) in `functions/api/admin/index.js` — flagged as a moderate, additive fix for whenever a second course is actually built; not urgent.
- Listen Mode *player* orientation UI (manual opt-in language, pause/resume controls) referenced by `tests/aimt-listen-mode-module1-pilot.test.mjs` — distinct from the narration-source work done this week; not started, per the "do not integrate Listen Mode into production" boundary.
- `.gitignore`'s new audio-staging rules only exclude lowercase `*.mp3`/`*.wav`/`*.flac` (plus uppercase `*.FLAC`) — missing `*.MP3`/`*.WAV`. Harmless today (this Mac's filesystem is case-insensitive) but would leak large audio into history on a case-sensitive filesystem (Linux CI, a fresh clone elsewhere). Cheap fix, flagged not applied (out of scope for the agent that found it).
- `docs/course-audit/listen-mode/tts-final/module-05/manifest.json`'s stale `ownerAudioReviewPending: true` flag — doesn't block anything, just needs updating to match your actual approval.
- Course seat-time estimate for the buy page — real ledger built this pass (`docs/course-audit/AIMT-COURSE-SEAT-TIME-LEDGER.md`), but not ready to publish: video durations unknown (needs Vimeo dashboard lookup), 9 of 13 modules' audio still pending fidelity rebuild, checkpoint/Module 12 timing is estimated not measured. Provisional range ~5–8 hours, explicitly not for publication yet.

---

## What changed in this revision (2026-09-15 evening pass)

Corrected several classification errors from the same-day morning version of
this checklist, per explicit owner instruction:
- Modules 6–12 Listen Mode were mislabeled "BLOCKED"/grouped with an
  after-launch item; corrected to reflect that they are pre-launch owner
  gates done one at a time, and that Module 6 specifically is now complete
  and awaiting review.
- Module 0 was silently grouped with Modules 2/3/6–12; split out as its own
  row since it needs an explicit owner *decision*, not just a rebuild pass.
- Modules 2/3 were silently grouped with 6–12; split out as owner-electable
  deferrals (existing narration, conscious accept/defer), not "blocked."
- `/head-spa-certification` clean route changed from DONE to READY FOR
  BRANCH-PREVIEW QA — local `wrangler` emulation is not a production-edge
  confirmation.
- Real-device QA changed from BLOCKED to READY FOR OWNER QA — it was never
  technically blocked, simply not yet performed.
- Branch state changed from DONE to READY FOR OWNER REVIEW / CHECKPOINT
  COMMIT — an uncommitted tree is not "done."
- Added explicit ADMIN rows for: `AIMT_OWNER_EMAIL` value, preview≠isolated-
  database warning, the corrected certificate-POST test treatment,
  support-role UI, the authenticated Admin entry link, the Admin shell
  review outcome, and the Cady staff-enrollment test plan.
- Added explicit EMAIL rows for: root-domain SPF/DKIM/DMARC, broadened
  Resend DNS guidance, the native-vs-custom password-changed email
  correction, and reclassified the manual-grant invite email as
  pre-launch/done (previously bucketed as blocked/after-launch alongside
  emails that are genuinely deferred).

## What changed in this revision (2026-09-16 pass)

Background work continued while the owner reviews Module 6, respecting the
explicit boundary of not touching Module 6/1/4/5, not integrating Listen
Mode into production, and not committing/pushing/merging/deploying:

- Full working-tree integrity audit produced and judged clean (no secrets,
  no duplicate work) — `docs/course-audit/AIMT-WORKING-TREE-INTEGRITY-AUDIT.md`.
- Checkpoint commit plan produced, recommending 6 separate commits over one
  squash — `docs/course-audit/AIMT-CHECKPOINT-COMMIT-PLAN.md`. One factual
  error in its first draft (a hand-reimplemented checkpoint-rubric hash that
  didn't match the real function) was caught by independently running the
  actual `rubricVersionTag()`/`loadCheckpointRubrics()` functions, and
  corrected in place before this checklist cited it.
- Branch-preview QA sequence produced with per-step mutation-risk labeling
  — `docs/course-audit/OWNER-PREVIEW-QA-SEQUENCE.md` — and surfaced two
  real, previously-undocumented mutation risks: `?enter=1` triggers a real
  `course_progress` write, and the first authenticated admin `?view=me` call
  silently bootstraps the real owner row. Both are now flagged
  "requires explicit owner approval" rather than treated as passive checks.
- Admin documentation given a final pre-activation pass against the actual
  code: found and fixed 3 real staleness bugs (a wrong claim about
  support-role button visibility, a missing audit-log action in the spec, a
  stale "not yet built" description of the now-shipped invite email).
- Email/Stripe setup compressed into one short, owner-executable sequence
  (`docs/stripe-and-email/AIMT-OWNER-SETUP-SEQUENCE.md`), with the
  manual-grant invite code re-verified against source rather than trusted
  from docs (9/9 tests).
- Test suite triaged from 110/114 to 112/114: two stale checkpoint-rubric
  fingerprints fixed (root-caused via `git worktree` bisection to an
  already-shipped, unrelated Module 4 wording change), one stale `.cp-q`
  markup assertion fixed. The 2 remaining failures are both genuinely
  out-of-scope (a protected Listen Mode snapshot test, and a not-yet-built
  Listen Mode orientation-UI feature) and are documented, not force-fixed.
- Per the owner's explicit new rule, no agent used `git stash`/`git stash
  pop` anywhere this pass — historical-state comparisons used `git show`,
  `git diff`, `git log -p`, and read-only `git worktree` checkouts instead,
  all removed after use.

## What changed in this revision (2026-09-16, Module 7 pass)

- Module 6 marked DONE — owner-approved and locked. Its one approved visual
  fix (moving the §6.4 final-reasoning card) applied by the coordinator
  directly (not delegated, since this is the sensitive shared source file)
  and verified live in a browser via the real `fcActivate`/`fcAnswer`
  functions, not just by reading the diff. Audio not touched.
- Module 7 fully rebuilt to strict fidelity by a single primary agent (per
  the owner's new "no narration-by-committee" rule) in two coordinator
  -gated phases: Phase 1 (audit → narration → mandatory last-third check →
  batch freeze) stopped and was independently re-verified before Phase 2
  (preflight → credit check → generation) was authorized. Now the current
  owner gate.
- **Material finding, independently verified, not acted on:** the literal
  phrase "answer above" (directionally backwards — the response field is
  below the prompt) is present in 15 already-shipped batch files across 9
  modules, including the just-approved Module 5 and Module 6. Surfaced as
  its own decision row above; nothing regenerated. A permanent rule +
  automated preflight gate now prevents recurrence going forward.
- Orientation test failure properly triaged (not blindly patched): 8 of 10
  `module-02-rebuild.test.mjs` failures were stale (content relocated, not
  deleted) and retargeted at current copy; 2 are genuine, still-open copy
  gaps, now precisely documented instead of vaguely bucketed.
- Course seat-time ledger built from real, cited data (Listen Mode
  generation log, live checkpoint counts, Module 12's actual structure) —
  not published, explicitly marked provisional pending video-duration and
  remaining-module-audio data.
- Launch hygiene: `CLAUDE.md`'s stale $497 price corrected to the real live
  $597; the "answer above" prohibition and the mandatory last-third fidelity
  check are now permanent, locked rules (Sections F/G) in the Listen Mode
  editorial standard, enforced automatically by the TTS preflight script.

## What changed in this revision (2026-09-17, Listen Mode integration pass)

- **Modules 1, 4, 5, 6, 7 Listen Mode are now actually wired into the live
  player**, correcting a premise gap this session found on read-only
  investigation: `assets/js/aimt-listen-mode-data.js` previously had
  manifest entries for Module 1 only (plus a single-chunk Module 12 stub) —
  Modules 4/5/6/7's owner-approved narration existed only as CapCut-processed
  audio masters and validated `.txt` scripts, never cut into player chunks,
  never installed, never mounted. This pass built the missing tooling
  (`scripts/aimt-listen-install-module.mjs` — position-anchored, silence-
  snapped batch cutting, generalizing the Module-1-only proof script) and
  used it to cut, install, and wire all four modules: 55 new chunk mp3s
  installed at `assets/audio/listen/headspa-mastery/module-0{4,5,6,7}/`,
  new `HEADSPA_MODULE_{4,5,6,7}` manifest entries (duration and
  `transitionGapMs` measured directly from the real cut audio, same method
  as Module 1's own gap-measurement doc), new "Listen with Cadence" entry
  buttons + `mount()` wiring per module, and ~31 new `id` anchors added to
  existing section headings (additive only, no content changed) for
  scroll-sync `visualTarget`s.
- ffmpeg was not present in this session's environment; fetched a portable
  build via `npm install @ffmpeg-installer/ffmpeg` into the session's own
  scratchpad (never added as a site/repo dependency — the site itself
  remains zero-npm-dependency per `CLAUDE.md`).
- Module 7's integration required two PROCESSED files that were initially
  missing (`A1`, `C1`); `A1` turned out to exist under a pre-existing
  owner-side filename typo (`M7-BATCH-A1-PROCCESSED.WAV`, extra "C" — not
  renamed), and `C1` was supplied by the owner mid-session. Both now used
  as-is.
- **All 70 chunk audio URLs across every wired module (1/4/5/6/7/12) verified
  resolving (200 OK)** via live fetch from the branch preview. Checkpoint
  gating, Resume Listening, Close→Resume, Listen Again, speed control, and
  Minimize/Restore all independently verified live in-browser for the newly
  wired modules, using the same real engine functions Module 1's own
  verification used (not a re-implementation). Modules 2/3 confirmed
  unaffected (load correctly, no Listen Mode button — matches their
  deferred-narration status).
- **Module 0 fully rebuilt to strict-fidelity** (`module-00-listen-script.md`
  v2 + first-ever `module-00-fidelity-coverage-audit.md`), fixing all 4
  previously-flagged defects. Generation blocked — this session has no
  ElevenLabs credential or generate-capable script; per instruction, stopped
  cleanly at the pre-generation gate rather than fabricating audio or
  shortening the narration. Full cost/character estimate and exact resume
  point are in the coverage-audit doc's "Generation gate" section.
- New `docs/AIMT-NEW-EMPLOYEE-PILOT-CHECKLIST.md` (Workstream C).
- Admin MVP re-verified against the real, current code (43/43 tests
  passing, independently re-run) — still fully code-complete; still
  blocked only on the same two owner-only actions (migration + env var)
  already documented in the Activation Runbook. Nothing new found broken.
- One transient test regression, introduced and fixed within this same
  pass: archiving Module 0's v1 script before its v2 replacement was
  written briefly broke `tests/module-02-rebuild.test.mjs` (`ENOENT`); fixed
  by completing the v2 script, then re-targeting one now-stale assertion
  that had been checking for the old, since-reversed "M0-01b must exist"
  behavior. Net effect on the suite: zero — 111/114 before and after this
  pass's own changes (see QA section above for the full baseline
  correction).
