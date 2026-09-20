# CHECKPOINT COMMIT PLAN

**Branch:** `course-audit-build` · **Prepared:** 2026-09-15, re-verified 2026-09-16 · **Status:** planning only — nothing in this document has been staged, committed, or pushed. This is a plan for the owner to execute (or hand to another session to execute) by hand.

**Scope verified directly against the live tree**, not the (truncated) summary in the task prompt, and **re-verified fresh on 2026-09-16** after a session interruption — `git status --short` / `git status --short --untracked-files=all` were re-run in full and diffed line-by-line against the exact file set this plan was originally built from, since other agents are concurrently active in this repo and real time had passed. That re-check found the tree had moved in two small, concrete ways since the original pass, both folded in below:
- `tests/module-02-rebuild.test.mjs` is now also modified — a third instance of the same stale-assertion pattern as Commit 1's other two files (a `.cp-q` static-div check that no longer matches reality post the already-committed "Cadence Check" redesign, now correctly re-pointed at `cadence-shell.js`'s real mechanism). Added to Commit 1 below.
- `docs/stripe-and-email/AIMT-OWNER-SETUP-SEQUENCE.md` is a new file inside the already-known `docs/stripe-and-email/` directory (a compressed, ordered owner click-through derived from the other two docs in that folder — explicitly instructs the owner to put `RESEND_API_KEY` in Cloudflare, never the repo). Added to Commit 4 below. Re-scanned both new files for secrets — none found.

No other drift was found: `docs/email-templates/`, `AIMT-Listen-Mode-Final/`'s non-audio files, and `docs/course-audit/listen-mode/tts-final/` were each re-expanded and matched their original contents exactly, and nothing was removed from the tree. Three more files appeared mid-audit and remain out of this plan's scope, unchanged from the original pass — `docs/course-audit/AIMT-WORKING-TREE-INTEGRITY-AUDIT.md` and `docs/course-audit/OWNER-PREVIEW-QA-SEQUENCE.md` (another concurrent agent's own output) and this plan's own output file. They're addressed under **Concurrent-agent outputs observed**, below, but are not folded into any commit's file list here, per the instruction to touch nothing outside this plan's own output path. Everything else — now 57 paths: 24 modified-tracked, 1 already-staged, 32 untracked/new (one of which gained one additional file inside it) — is this plan's subject and is fully accounted for below.

The independent `AIMT-WORKING-TREE-INTEGRITY-AUDIT.md` produced concurrently by another agent was read and cross-checked against this pass's own independent findings (both passes were run separately; they agree on every point of fact: workstream boundaries, zero secrets beyond the pre-existing public Supabase anon key, zero stray/duplicate files, zero committable audio, and the same three minor flags). That agreement is used below as corroboration, not as a substitute for this plan's own verification (every claim below was independently re-checked with `git diff`, `git show HEAD:<path>`, `git check-ignore -v`, targeted `grep`, and live `node --test` runs).

---

## Recommendation: **B — a small sequence of six logically separated commits**

**Not A.** A single checkpoint commit would bury two changes that specifically deserve their own visible history entry: an open-redirect fix in `student-access.html` (security-adjacent, though not weakening any entitlement/auth check) and an Admin RBAC + audit-log-verified reactivation feature in `functions/api/admin/index.js`. Both are currently easy to point to, test in isolation, and — if ever needed — revert in isolation. Squashing them into one commit alongside ~40 unrelated routing-link edits and Listen Mode production-tooling files would make future `git blame`/audit work strictly harder, for no real benefit — this is exactly the "pretty history at the cost of traceability" the task warned against, just inverted: here, splitting is *free* (no broken dependency window at any commit boundary once the pairs below are respected) and buying it into one commit would be the actual loss.

**The split is safe because the real dependency graph is shallow.** After reading every diff and cross-checking every test file's actual `readFileSync`/`import` targets (not just filename pattern-matching), there are exactly **three hard pairs** that must land in the same commit (a test file asserting on content that only exists in its companion source file), and they naturally each already sit inside the same one of six coherent themes — no file needs to be split across commits, and no commit needs to wait on another to avoid a red intermediate state (with the two pre-existing exceptions documented below, which are unrelated regression fixtures, not dependency problems).

Six commits, in the order below (order 1–5 doesn't matter functionally — all five are mutually independent — but 6 must land last):

| # | Commit | Theme |
|---|---|---|
| 1 | Test hygiene | Stale-assertion + portable-path fixes, unrelated to this week's 3 feature workstreams |
| 2 | Course / buy-page / clean-URL routing | The `/head-spa-certification` rollout |
| 3 | Admin MVP correction pass | RBAC, reactivation, manual-grant invite email |
| 4 | Email/Stripe branding docs & templates | Pure docs + static assets, no code |
| 5 | Listen Mode Module 6 (+1/4/5 audits) | Narration source/docs/tooling only — **no audio** |
| 6 | Cross-cutting session docs | Master launch checklist + owner preview QA sequence |

---

## Commit 1 — Test hygiene: stale-assertion + portable-path fixes

**Purpose:** Fix four pre-existing test-file bugs (three stale regexes/DOM checks that no longer match already-committed refactors, one hardcoded path from a prior Claude Code session's scratchpad) — unrelated to any of this week's three feature workstreams.

**Files:**
- `tests/cadence-phase1.test.mjs`
- `tests/cadence-production-path-qa-harness.test.mjs`
- `tests/cadence-worker-migration.test.mjs`
- `tests/module-02-rebuild.test.mjs` *(added on the 2026-09-16 re-check — same pattern as the other three: its `D. CHECKPOINT` section checked for a static `.cp-q` question `<div>` that was retired course-wide by the already-committed "Cadence Check" redesign (`6b36a58`); the fix re-points the check at the real current mechanism, `cadence-shell.js`'s `appendMessageEl('assistant', session.question)`, preserving the same displayed/evaluated-parity guarantee the original check existed for)*

**Dependencies:** Independent of commits 2–6. Nothing in commits 2–6 touches the code these tests assert against (`headspa-mastery.html`'s already-committed `mountCadenceIntro()` and retired `.cp-q` markup, `assets/js/cadence-shell.js`, the Cadence model registry).

**Tests BEFORE:**
```
node --test tests/cadence-phase1.test.mjs tests/cadence-production-path-qa-harness.test.mjs tests/cadence-worker-migration.test.mjs tests/module-02-rebuild.test.mjs
```
Expected: `cadence-phase1` and `cadence-worker-migration` fully green. `cadence-production-path-qa-harness`'s `14. CHECKPOINT CONTENT UNCHANGED` assertion and `module-02-rebuild`'s `D. CHECKPOINT` section are **already fixed in the current working tree** (see correction note below) — both pass today, before this commit exists. `module-02-rebuild`'s unrelated `I. MODULE 0` section still fails (3/13) — a genuine pre-existing, unrelated failure, see **Known pre-existing failures** below.

**Tests AFTER:**
```
node --test tests/cadence-phase1.test.mjs tests/cadence-production-path-qa-harness.test.mjs tests/cadence-worker-migration.test.mjs tests/module-02-rebuild.test.mjs
```
Expected: identical result to BEFORE (same one pre-existing `I. MODULE 0` failure, nothing newly broken).

**Correction (added by the coordinator, 2026-09-16):** this section originally claimed `cadence-production-path-qa-harness.test.mjs` would still show a `14. CHECKPOINT CONTENT UNCHANGED` failure expecting fingerprint `'rubric-efe55590'`. That was already stale by the time this plan was re-verified — a separate, concurrent test-triage workstream had already re-pinned both this file and `aimt-dashboard-resources-launch.test.mjs` to the correct current fingerprint. The coordinator independently confirmed the ground-truth value by running the actual `rubricVersionTag()`/`loadCheckpointRubrics()` functions from `functions/_lib/cadence/checkpoint-evaluation.mjs` and `scripts/cadence-model-regression/load-checkpoint-rubrics.mjs` directly (not a reimplementation): the real current value is **`rubric-e0ea1714`**, matching the test-triage fix, not the `rubric-5465b825` this plan computed via its own standalone re-implementation (which had a bug). See the corrected **Known pre-existing failures** section below.

---

## Commit 2 — Course / buy-page / clean-URL routing rollout

**Purpose:** Roll out `/head-spa-certification` as the canonical public URL for the course (via new `_redirects` rules), repoint every internal link/nav/footer/sitemap/canonical-tag reference at it, and add a safe allowlisted `?next=` post-login redirect to `student-access.html` for the Service Timer's return trip.

**Files:**
- `headspa-mastery.html` *(canonical/`og:url` tags + 1 footer link only — see note below)*
- `index.html`, `courses.html`, `head-spa-readiness.html`, `privacy.html`, `refunds.html`, `terms.html`, `verify.html`, `success.html` *(nav/footer link renames)*
- `student-access.html` *(`COURSE_ENTRY_URL` rename **+** new `SAFE_NEXT_ROUTES`/`isSafeNextRoute()`/`getSafeNextRoute()`/`decodeNextCandidate()` allowlisted-redirect feature)*
- `robots.txt`, `sitemap.xml` *(domain fix to `aimtrichology.com` + clean-URL sitemap entry + `Disallow: /admin.html`)*
- `_redirects` *(new)*
- `docs/course-audit/CLEAN-URL-PREVIEW-DEPLOY-CHECKLIST.md` *(new)*
- `docs/course-audit/pending-headspa-mastery-patches.md` *(new — audit trail; documents the 3 direct edits made to the frozen `headspa-mastery.html`)*
- `tests/service-timer-login-next-route.test.mjs` *(new)*

**Note on `headspa-mastery.html`:** this file's uncommitted diff contains three genuinely different things: (a) the clean-URL rename above, (b) a Module 12 marketing-preview visual redesign (mirrors the already-shipped `.aimt-metric-ring` component), and (c) a brand-new "Economics of the Room" interactive revenue calculator section. None of (b)/(c) have any test coverage dependency (verified — `tests/certification-results-redesign.test.mjs` reads `assets/js/module12-certification.js`/`functions/api/certification/get-status.js`, not this file), and per CLAUDE.md this file is edited surgically as one diff regardless. All three concerns are included here as one file-level change; see `pending-headspa-mastery-patches.md` for the routing-specific audit trail within it. **Verified the M0–M11 checkpoint rubric content is unchanged by this diff.** This plan's own attempt to prove that via a re-implemented `rubricVersionTag()` fingerprint (originally cited here as `rubric-5465b825` for both HEAD and working tree) had a bug — see the corrected **Known pre-existing failures** section below for the real value. Independently re-confirmed by the coordinator two ways instead: (1) `git diff HEAD -- headspa-mastery.html | grep -E "questions|systems|rubric|checkpoint"` returns zero matching lines — no checkpoint/rubric-bearing content appears in this file's diff at all; (2) the real `rubricVersionTag()`/`loadCheckpointRubrics()` functions (not a re-implementation) were run directly against the current working tree and produced `rubric-e0ea1714`, matching the value a separate concurrent workstream already verified via commit bisection as the correct current fingerprint. Nothing curriculum-bearing was touched.

**Dependencies:**
- **Hard:** `tests/service-timer-login-next-route.test.mjs` must land in the same commit as `student-access.html` — it `readFileSync`s that file directly and extracts/executes `isSafeNextRoute()`/`getSafeNextRoute()` verbatim; it cannot pass without the companion source.
- **Deployment note (not a git dependency):** the link rewrites in this commit point at `/head-spa-certification`, which only resolves correctly once `_redirects` (same commit) is actually deployed to Cloudflare Pages. Since `_redirects` is in this same commit, there's no cross-commit ordering risk — flagging only so this commit isn't split further by a future editor.
- Independent of commits 1, 3, 4, 5, 6.

**Tests BEFORE:**
```
node --test tests/service-timer-login-next-route.test.mjs tests/cadence-phase1.test.mjs tests/cadence-production-path-qa-harness.test.mjs tests/cadence-worker-migration.test.mjs tests/certification-results-redesign.test.mjs
```

**Tests AFTER:**
```
node --test tests/service-timer-login-next-route.test.mjs tests/cadence-phase1.test.mjs tests/cadence-production-path-qa-harness.test.mjs tests/cadence-worker-migration.test.mjs tests/certification-results-redesign.test.mjs
```
Expected both times: everything green except the same one pre-existing `cadence-production-path-qa-harness` checkpoint-fingerprint failure noted above (unaffected by this commit, confirmed via the hash comparison above).

---

## Commit 3 — Admin MVP correction pass (RBAC, reactivation, manual-grant invite email)

**Purpose:** Add support-role UI gating (`canMutate()`) and an audit-log-verified, insert-only "reactivate manually revoked access" action to AIMT Admin, plus a Resend-based welcome-email send for brand-new accounts created via manual grant; wire a convenience-only "AIMT Admin" nav entry into My AIMT for signed-in owner/admin/support users.

**Files:**
- `admin.html`
- `my-aimt.html` *(two concerns in one diff — see note)*
- `functions/api/admin/index.js`
- `functions/_lib/admin/manual-grant-invite-email.mjs` *(new)*
- `docs/admin/AIMT-ADMIN-MVP-SPEC.md`
- `docs/admin/AIMT-ADMIN-ACTIVATION-RUNBOOK.md` *(new)*
- `docs/admin/AIMT-ADMIN-MVP-AUDIT-2026-09-15.md` *(new)*
- `tests/admin-mvp.test.mjs`
- `tests/admin-manual-grant-invite.test.mjs` *(new)*
- `tests/admin-mvp-behavior.test.mjs` *(new)*
- `tests/aimt-dashboard-resources-launch.test.mjs`

**Note on `my-aimt.html`:** most of this file's diff (~30 of ~44 changed lines) is the new admin-entry-point convenience link (`revealAdminEntry()`/`checkAdminEntryPoint()`); the remainder is the same clean-URL string rename as Commit 2. Grouped here (rather than with Commit 2) because the task's own framing lists `my-aimt.html` under the Admin MVP workstream, and because `tests/aimt-dashboard-resources-launch.test.mjs`'s hard dependency (below) is squarely on this file.

**Dependencies (all hard, all already satisfied by keeping this one commit):**
- `functions/api/admin/index.js` **imports** `sendManualGrantInviteEmail` from `functions/_lib/admin/manual-grant-invite-email.mjs` — committing the former without the latter breaks the module at import time.
- `tests/admin-manual-grant-invite.test.mjs` imports both of the above files directly.
- `tests/admin-mvp.test.mjs` does `readFileSync` + string/regex assertions against **both** `admin.html` and `functions/api/admin/index.js` (e.g. `canMutate()` markup, the `reactivateManualAccess` function body) — needs both present.
- `tests/aimt-dashboard-resources-launch.test.mjs` asserts `/entry:\s*'head-spa-certification\?enter=1'/.test(dashboardSrc)` where `dashboardSrc` = `my-aimt.html` — needs `my-aimt.html`'s current diff present. (This assertion does not depend on anything in Commit 2 — `my-aimt.html` carries its own copy of the URL string — so no cross-commit-2 dependency, only intra-commit-3.)
- Verified `functions/_lib/admin/manual-grant-invite-email.mjs` does **not** `readFileSync` `docs/email-templates/custom-resend/invite-manual-grant.html` at runtime (it inlines the HTML directly, per its own header comment — "no bundler/build step... so it is inlined here instead") and `tests/admin-manual-grant-invite.test.mjs`'s one reference to `docs/stripe-and-email/...` is a header **comment**, not a `readFileSync` — so Commit 4 (below) is genuinely independent of this commit, not a hidden fourth hard pair.
- Independent of commits 1, 2, 4, 5, 6.

**Tests BEFORE:**
```
node --test tests/admin-mvp.test.mjs tests/admin-manual-grant-invite.test.mjs tests/admin-mvp-behavior.test.mjs tests/aimt-dashboard-resources-launch.test.mjs
```

**Tests AFTER:**
```
node --test tests/admin-mvp.test.mjs tests/admin-manual-grant-invite.test.mjs tests/admin-mvp-behavior.test.mjs tests/aimt-dashboard-resources-launch.test.mjs
```
Expected both times: fully green, including `aimt-dashboard-resources-launch.test.mjs`'s `N. HISTORICAL PASS UNCHANGED` / `P. 22 CHECKPOINT GATE MAP UNCHANGED` assertions — **correction (coordinator, 2026-09-16):** this section originally listed those two as pre-existing failures; that was stale by the time of re-verification, since the same concurrent test-triage workstream referenced in Commit 1's correction note already fixed this file's fingerprint expectation too. Independently confirmed green — not a pre-existing failure.

---

## Commit 4 — Email/Stripe branding docs & templates

**Purpose:** Land the Resend/Supabase transactional email templates, brand assets, and the Stripe/email setup+branding audit docs — pure documentation and static assets, no code path reads any of it at runtime.

**Files:**
- `docs/email-templates/AIMT-EMAIL-TEMPLATES-SETUP.md` *(new)*
- `docs/email-templates/custom-resend/*.html` *(6 files, new: `certification-earned`, `educator-remediation-request-received`, `enrollment-confirmation`, `invite-manual-grant`, `review-request-received`, `security-password-changed`)*
- `docs/email-templates/supabase-auth/*.html` *(3 files, new: `change-email`, `confirm-signup`, `reset-password`)*
- `docs/email-templates/assets/aimt-mark-email.png`, `docs/email-templates/assets/aimt-mark-email@2x.png` *(new)*
- `docs/stripe-and-email/AIMT-EMAIL-STRIPE-SETUP-CHECKLIST.md` *(new)*
- `docs/stripe-and-email/AIMT-STRIPE-EMAIL-BRANDING-AUDIT-2026-09-15.md` *(new)*
- `docs/stripe-and-email/AIMT-OWNER-SETUP-SEQUENCE.md` *(new — added on the 2026-09-16 re-check; a compressed, ordered owner click-through that explicitly derives from and cites the other two docs in this list rather than re-deriving anything, and explicitly instructs `RESEND_API_KEY` go into Cloudflare, never the repo — re-scanned for secrets, none found)*
- `docs/stripe-and-email/assets/aimt-stripe-icon-512.png` *(new)*

**Dependencies:** None found. Confirmed via `grep -rl "email-templates\|stripe-and-email" tests/*.test.mjs` that the only hit (`tests/admin-manual-grant-invite.test.mjs`) is a header-comment cross-reference, not a `readFileSync`. Fully independent of commits 1, 2, 3, 5, 6 — can land in any position in the sequence, including before Commit 3.

**Tests BEFORE / AFTER:** No automated test reads these files. Recommend an owner visual/manual review of the rendered `.html` templates (e.g. open each in a browser) rather than an automated command — these are meant to be pasted into the Resend/Supabase/Stripe dashboards by hand, the same "code lives in the repo for versioning, deploys separately" pattern CLAUDE.md already establishes for `cadence-worker/`. As a light sanity check that nothing else regressed:
```
node --test tests/admin-manual-grant-invite.test.mjs
```
(confirms the one place in the codebase that mirrors `invite-manual-grant.html`'s markup — `manual-grant-invite-email.mjs` — is still consistent; not a hard requirement for this commit itself).

---

## Commit 5 — Listen Mode Module 6 (+1/4/5 fidelity audits) narration source/docs/tooling

**Purpose:** Land this week's Listen Mode narration rebuild for Modules 1, 4, 5, 6 — updated scripts, fidelity-coverage audits proving each rebuild fixes documented narration-drift items, the full course-wide TTS generation manifest/ledger tree, and the production tooling/scripts that built them. **Contains no audio.** The actual audio lives in the gitignored `AIMT-Listen-Mode-Final/` staging tree and is explicitly excluded — see **Must NOT be committed**, below.

**Files:**
- `.gitignore` *(adds the `AIMT-Listen-Mode-Final/**/*.{mp3,wav,flac,FLAC}` exclusion rules)*
- `AIMT-Listen-Mode-Final/README.md`, `AIMT-Listen-Mode-Final/MASTER-CAPCUT-WORKLIST.md`, `AIMT-Listen-Mode-Final/{00-Welcome,01-Module-1,...,12-Module-12}/README.md` *(14 files total — text only; confirmed none of these paths match a `.gitignore` audio pattern, and the directory's own README states these `.md` files are meant to stay tracked)*
- `docs/course-audit/listen-mode/module-05-listen-script.md` *(v1→v2 rebuild)*
- `docs/course-audit/listen-mode/module-06-listen-script.md` *(v1→v2 rebuild — owner has not reviewed yet per the brief; content untouched by this pass, only being staged for commit)*
- `docs/course-audit/listen-mode/archive-loose-v1/module-05-listen-script-v1-REJECTED.md` *(new, untracked)*
- `docs/course-audit/listen-mode/archive-loose-v1/module-06-listen-script-v1-REJECTED.md` *(new, but see **process note** below — already sitting in the git index)*
- `docs/course-audit/listen-mode/module-01-fidelity-coverage-audit.md`, `module-04-fidelity-coverage-audit.md`, `module-05-fidelity-coverage-audit.md`, `module-06-fidelity-coverage-audit.md` *(new)*
- `docs/course-audit/listen-mode/tts-final/**` *(full tree: `ALL-MODULES-MANIFEST.json`, `GENERATION-LOG.json`, `REMAINING-BATCHES.json`, `RESUME.md`, `module-00/` through `module-12/` batch `.txt` files + `manifest.json`, plus their own `archive-loose-v1/` subfolders — all text/JSON, no audio)*
- `scripts/aimt-listen-source-extract.mjs`, `scripts/aimt-listen-staging-init.mjs`, `scripts/aimt-listen-tts-preflight.mjs`, `scripts/aimt-listen-batch-build.mjs`, `scripts/aimt-listen-log-append.mjs`, `scripts/aimt-listen-capcut-worklist-build.mjs`, `scripts/aimt-listen-edit-wav-build.sh`, `scripts/aimt-listen-edit-wav-validate.mjs`, `scripts/aimt-listen-module01-v6-build.mjs`, `scripts/aimt-listen-module04-v6-build.mjs`, `scripts/aimt-listen-module05-v2-build.mjs`, `scripts/aimt-listen-module06-v2-build.mjs` *(all new)*

**Process note (not a "must not commit" issue, just a staging-consistency nit):** `docs/course-audit/listen-mode/archive-loose-v1/module-06-listen-script-v1-REJECTED.md` is **already sitting in the git index** (`git status` shows it as `A`, not `??`) — likely leftover from a concurrent session's partial `git add`. Its Module-5 sibling is still fully untracked. Both belong in this same commit either way, but whoever executes this commit should run `git status`/`git diff --cached` immediately before committing to confirm the index contains exactly this commit's intended file set (not more, not less) rather than assuming a clean/empty index.

**Dependencies:** None found. Confirmed via `grep -rl "aimt-listen-\|AIMT-Listen-Mode-Final\|tts-final" tests/*.test.mjs` that the only hits are in `tests/aimt-listen-mode-capcut-production.test.mjs` and `tests/aimt-listen-mode-module1-pilot.test.mjs`, and both reference a **different, already-shipped, unrelated feature** — the Listen Mode *player* UI (`assets/js/aimt-listen-mode-data.js`, `assets/js/aimt-listen-mode-player.js`, `scripts/aimt-listen-cut-finder.mjs`) — none of which are touched by this commit's files (this commit is production *source/tooling*, not the player). Fully independent of commits 1, 2, 3, 4, 6.

**Tests BEFORE:**
```
node --test tests/aimt-listen-mode-module1-pilot.test.mjs tests/aimt-listen-mode-capcut-production.test.mjs tests/module-02-rebuild.test.mjs
```
Expected: `aimt-listen-mode-capcut-production` green. `aimt-listen-mode-module1-pilot` and `module-02-rebuild` will show pre-existing failures — see **Known pre-existing failures**, below. Both are failing today, before this commit, for reasons entirely unrelated to any file in this commit (they check for a "Before you begin" Listen Mode orientation UI block in `headspa-mastery.html` that doesn't exist yet — a different, not-yet-built feature).

**Tests AFTER:**
```
node --test tests/aimt-listen-mode-module1-pilot.test.mjs tests/aimt-listen-mode-capcut-production.test.mjs tests/module-02-rebuild.test.mjs
```
Expected: identical to BEFORE — same pre-existing failures, nothing newly broken by this commit.

---

## Commit 6 — Cross-cutting session docs (master launch checklist + owner preview QA sequence)

**Purpose:** Land the two top-level status/runbook docs that summarize and cite the other five commits' work, once they exist to be cited.

**Files:**
- `docs/AIMT-MASTER-LAUNCH-CHECKLIST.md` *(new)*
- `docs/course-audit/OWNER-PREVIEW-QA-SEQUENCE.md` *(new — see note)*

**Note:** `OWNER-PREVIEW-QA-SEQUENCE.md` appeared in `git status` partway through this pass, produced by a different concurrent agent (see **Concurrent-agent outputs observed**, below). It is included here only as a natural home if the owner chooses to commit it — its content (a manual QA runbook for the branch-preview deploy, citing the Admin activation runbook and the clean-URL checklist) fits this "cross-cutting, references everything else" bucket, and it has zero code/test dependencies of its own. This plan does not treat authoring or vetting that file as its job.

**Dependencies:** Must land **after** commits 2, 3, 4, and 5 — both docs narrate those workstreams as already landed ("Admin/Email corrections landed this evening," "Module 6's completion"). Not a hard git dependency (nothing tests either file), but landing it first would make its own content inaccurate at the moment of that commit.

One accuracy note for the owner, not a blocker: `AIMT-MASTER-LAUNCH-CHECKLIST.md`'s current text states "HEAD `6b36a58f` (unchanged all session — nothing committed)" — that line will be stale the moment Commit 1 lands. Consider a one-line touch-up before or after committing; out of scope for this plan to edit.

**Tests BEFORE / AFTER:** None applicable — no code, no test reads these files.

---

## Known pre-existing failures (already broken at `HEAD`, not caused by this plan)

Running the full suite (`node --test tests/*.test.mjs`) against the current working tree today shows **4** failing test files. All 4 are either already broken at committed `HEAD` (verified) or check for content that was never part of this week's work. None should be treated as a reason to hold up any commit above; none of the commits above introduce a new failure.

1. ~~`tests/cadence-production-path-qa-harness.test.mjs` → `14. CHECKPOINT CONTENT UNCHANGED`~~ and ~~`tests/aimt-dashboard-resources-launch.test.mjs` → `N. HISTORICAL PASS UNCHANGED` / `P. 22 CHECKPOINT GATE MAP UNCHANGED`~~ — **CORRECTED, not actually a pre-existing failure (coordinator note, 2026-09-16).** This plan originally claimed these three assertions were still failing against a stale hardcoded `'rubric-efe55590'`, and separately computed the "actual" current fingerprint as `rubric-5465b825` via a standalone re-implementation of the extraction/hash logic in a scratchpad script. **That re-implementation had a bug.** The coordinator independently ran the real, imported functions this repo's own tests use (`rubricVersionTag` from `functions/_lib/cadence/checkpoint-evaluation.mjs`, `loadCheckpointRubrics` from `scripts/cadence-model-regression/load-checkpoint-rubrics.mjs`) directly against the current working tree and got **`rubric-e0ea1714`** — not `rubric-5465b825`. Separately, a concurrent test-triage workstream had already root-caused the same discrepancy correctly (via `git worktree` bisection across `7a78d17..HEAD`, tracing the actual content change to already-committed commit `28e935a`, "Fix bulk-audit launch regressions," which reworded Module 4's `m4cp2` checkpoint question from "crown assessment" to "crown station") and re-pinned both test files to `'rubric-e0ea1714'`. Both numbers now agree, both test files are green in the current working tree, and this was independently re-confirmed by the coordinator running the full suite (112/114 passing, neither file in the remaining-failures list). **Net effect on this plan: unchanged** — these two files were already correctly included in Commit 1 (`cadence-production-path-qa-harness.test.mjs`) and Commit 3 (`aimt-dashboard-resources-launch.test.mjs`) respectively; they just aren't "pre-existing failures" any more, they're already-fixed content riding along in this plan's commits like everything else in those commits.

2. **`tests/aimt-listen-mode-module1-pilot.test.mjs`** and **`tests/module-02-rebuild.test.mjs`** (specifically its `I. MODULE 0` section) — both fail on checks for a "Before you begin" Listen Mode orientation UI block (manual opt-in language, pause/resume controls, etc.) that does not yet exist in `headspa-mastery.html`. Neither test file, nor the `headspa-mastery.html` UI region they check, is touched by anything in this plan — this is a different, not-yet-built Listen Mode *player* feature (separate from the Module 6 narration-source work in Commit 5), already red at `HEAD` before this session started. Note `tests/module-02-rebuild.test.mjs` also appears in Commit 1 above, but for a fully unrelated, already-passing section of the same file (`D. CHECKPOINT`, 7/7) — fixing that stale assertion does not touch, and was verified not to touch, this `I. MODULE 0` failure. The two references are describing two different, independent sections of one test file, not a contradiction.

---

## Concurrent-agent outputs observed (not part of this plan's commits)

Two files appeared in `git status` partway through this pass that this plan did not create and is not claiming ownership of:

- `docs/course-audit/AIMT-WORKING-TREE-INTEGRITY-AUDIT.md` — another agent's independent working-tree audit. Its findings were read and used as corroboration above (it independently reaches the same workstream boundaries, the same "no secrets beyond the pre-existing public anon key" conclusion, and flags the same three minor issues this plan flags). It is that agent's output file, not this plan's; whether/when to commit it is the owner's call.
- `docs/course-audit/OWNER-PREVIEW-QA-SEQUENCE.md` — a manual QA runbook, referenced (not authored) in Commit 6 above as a natural home if the owner wants to commit it.

---

## MUST NOT BE COMMITTED

### 1. Listen Mode audio (Modules 0–12, RAW/EDIT/PROCESSED)
**Verified clean.** `git status --short --untracked-files=all` (which fully expands every untracked directory rather than collapsing it to one line) lists **zero** `.mp3`/`.wav`/`.flac`/`.MP3`/`.WAV`/`.FLAC` files anywhere in the tree — confirmed with a case-insensitive grep across the complete expanded status output. `git check-ignore -v` was run directly against representative uppercase-extension files that exist on disk (`AIMT-Listen-Mode-Final/00-Welcome/M0-BATCH-B1-PROCESSED.MP3`, `AIMT-Listen-Mode-Final/01-Module-1/M1-BATCH-C1-PROCESSED.WAV`) and both resolve as ignored, matching the `.gitignore` rules added in Commit 5, because `core.ignorecase=true` on this machine makes git's ignore-matching case-insensitive.

**One portability flag worth the owner's attention (not a current problem, but a latent one):** the four new `.gitignore` lines only list lowercase `*.mp3`/`*.wav`/`*.flac` plus uppercase `*.FLAC` — there is no `*.MP3` or `*.WAV` line. On this machine that's harmless (verified above). But `core.ignorecase` is a per-clone/per-OS setting, not a repo property — a Linux CI runner or any contributor machine with `core.ignorecase=false` would **not** exclude the uppercase `.MP3`/`.WAV` files actually present in `AIMT-Listen-Mode-Final/`, and a blanket `git add -A` there would stage ~2.4 GB of audio into history. Recommend adding `*.MP3` and `*.WAV` alongside the existing four lines before this repo is ever cloned/built anywhere other than this machine. Not fixed in this plan (out of scope — this plan does not edit `.gitignore`'s content beyond what's already staged for Commit 5), only flagged.

### 2. Secrets / API keys / credentials
**None found.** Grepped every modified/new non-audio file (all 57 in-scope paths, including the two found in the 2026-09-16 re-check) for `sk_live_`, `sk_test_`, `whsec_`, `re_[A-Za-z0-9]{16,}`, `AKIA[0-9A-Z]{16}`, `-----BEGIN ... PRIVATE KEY`, `service_role`, and raw JWT patterns (`eyJhbGciOi...`) — zero matches. The sanity check (grepping a deliberately fake `sk_test_` string first) confirmed the grep patterns actually work, ruling out a silent false-negative.

**One near-hit, resolved as not a secret:** `admin.html`'s diff contains a Supabase JWT-format anon key (`SUPABASE_ANON_KEY`). Verified via `git grep <the exact key> HEAD` that this **exact same literal value** is already committed, unmodified, in five other tracked files today — `aimt-service-timer.html`, `headspa-mastery.html`, `my-aimt.html`, `student-access.html`, `success.html`. It is the project's one published Supabase anon key, designed to ship client-side and protected by RLS (per CLAUDE.md's own data model), not a service-role key. `admin.html`'s diff only *removes* a second, dead, truncated placeholder variable (`PUBLIC_ANON_KEY`, whose literal value ended in `"...";` — never a real key) and consolidates on the one real, already-public variable. Not a new secret, not a leak — no action needed.

`functions/_lib/admin/manual-grant-invite-email.mjs` (new) reads `env.RESEND_API_KEY` from the Cloudflare env at runtime — no literal key anywhere in the file, consistent with CLAUDE.md's "all keys live in Cloudflare env vars" rule.

### 3. Local scratch/debug/temp files
**None found.** No `.tmp`, `.log`, `scratch`, `debug`, or `test-output`-named file appears anywhere in `git status`. No tracked `.DS_Store` exists in the repo (confirmed: `.DS_Store` is caught by the pre-existing top-line `.gitignore` rule everywhere it appears, including inside `AIMT-Listen-Mode-Final/`). `scripts/.module12-review-output.html`, named in `.gitignore`, does not currently exist on disk.

### 4. Duplicated / superseded work
**None found requiring exclusion.** Two categories that look like candidates on first glance turned out, on inspection, to be intentional and correctly scoped:
- `docs/course-audit/listen-mode/archive-loose-v1/module-05-listen-script-v1-REJECTED.md` and `.../module-06-listen-script-v1-REJECTED.md` — explicitly named and located as an **archive** of superseded v1 drafts, kept for history per the Listen Mode workflow's own convention. These are appropriately committed as part of Commit 5 (they are the historical record, not accidental duplicate effort), not excluded.
- `docs/course-audit/pending-headspa-mastery-patches.md` — explicitly marked "APPLIED" in its own header; it is the audit trail for three intentional direct edits to the surgical-only `headspa-mastery.html`, not stale/leftover planning content. Appropriately committed as part of Commit 2.

No evidence was found anywhere in the 57 in-scope paths of two different sessions/agents having edited the same file in conflicting ways, or of a hand-retyped duplicate of logic that already exists elsewhere (e.g. the checkpoint-rubric extraction and Module 12 assessment-bank content are both explicitly built by parsing the one real source file at run/build time, never a separately hand-copied version).
