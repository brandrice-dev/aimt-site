# AIMT Working Tree Integrity Audit — 2026-09-15

**Branch:** `course-audit-build` (compared against its merge-base with `main`
via the working tree only — no commits made, nothing staged/unstaged was
touched to produce this report).

**Method:** `git status --porcelain=v1`, `git diff` / `git diff --cached` /
`git diff --numstat` per path, `git show HEAD:<path>` for prior versions,
`git log --oneline` / `git log --all -- <path>` for provenance, `.gitignore`
+ `git check-ignore -v` for exclusion behavior, `stat` for file mtimes, and
targeted `grep` sweeps for secrets/tmp-files/duplicate implementations.
No `git stash` was used anywhere in this audit (per standing instruction).
Nothing was deleted, reverted, reset, or edited except this report file.

**Headline finding:** the tree is clean. Every one of the ~56 touched paths
traces to one of five identifiable, coherent workstreams. No duplicate
feature implementations, no secrets, no stray debug/scratch files, and no
evidence of two agents editing the same file in incompatible ways were
found. Two genuine issues worth the owner's attention are listed in
**Flags requiring owner attention** at the end — both minor and both fixable
in under a minute.

---

## 1. Production code — application files

| Path | Workstream | Intentional? | Belongs in commit? | Notes |
|---|---|---|---|---|
| `admin.html` | Admin MVP correction pass: (a) removed a dead/truncated duplicate anon-key variable (`PUBLIC_ANON_KEY`, whose literal value was a truncated placeholder ending `"...";`) in favor of the one real `SUPABASE_ANON_KEY` already used site-wide; (b) added `canMutate()` support-role gating (hides Grant/Revoke/Reactivate for `support` actors — UI polish only, server-side `requireAdminRole` is the real boundary and is untouched); (c) wired the new "Reactivate access" button/flow | Yes | Yes | See §Flags — the removed key was a harmless placeholder, not a live secret |
| `courses.html` | Clean-URL routing: `headspa-mastery.html` → `head-spa-certification` across all nav/CTA/footer links | Yes | Yes | Matches `_redirects` + `docs/course-audit/CLEAN-URL-PREVIEW-DEPLOY-CHECKLIST.md` |
| `index.html` | Same clean-URL routing pass | Yes | Yes | |
| `head-spa-readiness.html` | Same clean-URL routing pass (1 footer link) | Yes | Yes | Smallest diff of the batch (1 line) |
| `my-aimt.html` | **Two workstreams in one diff:** (a) clean-URL routing, (b) new `revealAdminEntry()`/`checkAdminEntryPoint()` — convenience-only "AIMT Admin" nav link shown to signed-in owner/admin/support users, explicitly documented as never the security boundary | Yes (both) | Yes | Not scope creep — both are real, already-tested, non-conflicting features; just two changes sharing a file. See `tests/aimt-dashboard-resources-launch.test.mjs` for coverage of the other half of this file's changes (dashboard refactor: `loadEntitlements`, `loadCertificationState`, `resolveCourseState`, `renderCertification`, `TOOL_DISPLAY`) |
| `privacy.html`, `refunds.html`, `terms.html`, `verify.html` | Clean-URL routing pass (nav + footer links only) | Yes | Yes | Identical mechanical diff pattern across all four |
| `success.html` | Clean-URL routing (`COURSE_ENTRY_URL` constant) | Yes | Yes | 1-line change |
| `student-access.html` | Pre-existing (before this week's Admin/Email/Listen passes) safe `?next=` redirect feature for the Service Timer's login gate, plus the clean-URL `COURSE_ENTRY_URL` update | Yes | Yes | Strict allowlist (`SAFE_NEXT_ROUTES`), blocks protocol-relative/absolute/backslash open-redirect vectors by construction; covered by `tests/service-timer-login-next-route.test.mjs`. Does not touch entitlement/payment logic |
| `headspa-mastery.html` | Rolling Module 8 timer + Cadence Check flow finalization (matches HEAD commit `6b36a58`, still uncommitted continuation) + the same clean-URL rename (3 occurrences: canonical tag, `og:url`, footer self-link — see `docs/course-audit/pending-headspa-mastery-patches.md`) | Yes | Yes, with care | Per CLAUDE.md this file gets surgical-only treatment; diff was read but not touched by this audit. No Listen Mode audio-wiring changes present in the diff — confirms Module 5/6 rebuild audio has *not* been installed into the live file yet |
| `functions/api/admin/index.js` | Admin MVP correction pass: wires the new manual-grant invite email send into `grantAccess()`, and adds the full `reactivateManualAccess()` action (owner/admin-only, `admin-grant-` prefix only, audit-trail-verified, insert-only — never DELETE/UPDATE) | Yes | Yes | Diff read in full; clean, single-author style throughout, matches its own spec doc and its three test files exactly |
| `functions/_lib/admin/manual-grant-invite-email.mjs` | New: Resend-based invite email for brand-new accounts created via manual grant | Yes | Yes | 237 lines. Idempotency key `admin-grant/<grantId>`, dedupes via `admin_audit_log` scan (not just Resend's header), never throws / never rolls back the entitlement on failure. No other implementation of this feature exists anywhere in the repo (verified by grep) — not a duplicate |
| `_redirects` | New: Cloudflare Pages redirect rules for the clean course URL (`/head-spa-certification` rewrite + legacy 301) | Yes | Yes | Referenced consistently by `robots.txt`, `sitemap.xml`, and `pending-headspa-mastery-patches.md` |
| `.gitignore` | Adds the `AIMT-Listen-Mode-Final/**/*.{mp3,wav,flac,FLAC}` exclusion rules for this week's full Listen Mode regeneration staging directory | Yes | Yes | See §Flags — case-sensitivity gap on `.MP3`/`.WAV` |
| `robots.txt` | Disallow `/admin.html`; sitemap URL updated to the real domain | Yes | Yes | |
| `sitemap.xml` | Domain fixed to `aimtrichology.com`; course URL updated to `/head-spa-certification` | Yes | Yes | |

## 2. Tests

| Path | Workstream | Intentional? | Belongs in commit? | Notes |
|---|---|---|---|---|
| `tests/admin-mvp.test.mjs` | Admin MVP: adds coverage for support-role gating (`canMutate()`) and the full reactivation path (role gate, prefix guard, no course_progress/attempts/completions writes, insert-only) | Yes | Yes | |
| `tests/admin-manual-grant-invite.test.mjs` (new) | Coverage for the manual-grant invite email, explicitly cross-referenced to item 7 of `AIMT-STRIPE-EMAIL-BRANDING-AUDIT-2026-09-15.md` | Yes | Yes | 407 lines |
| `tests/admin-mvp-behavior.test.mjs` (new) | Behavioral/execution coverage complementing the static regex checks in `admin-mvp.test.mjs` | Yes | Yes | 754 lines |
| `tests/service-timer-login-next-route.test.mjs` (new, untracked) | Pre-existing (before this week's Admin/Email/Listen passes) — covers the `student-access.html` safe-redirect feature above | Yes | Yes | 242 lines |
| `tests/aimt-dashboard-resources-launch.test.mjs` | Mix of pre-existing dashboard-refactor test updates (new `extractConstSource()` helper, `TOOL_DISPLAY`/`COURSE_STATE` fixtures, split `loadCertificationState`/`resolveCourseState`/`renderCertification`) and this week's clean-URL string updates (`head-spa-certification?enter=1`) | Yes | Yes | Coherent single narrative, not two colliding edits — verified by reading the full diff |
| `tests/cadence-phase1.test.mjs` | Pre-existing test-assertion loosening: accepts either `{text: r}` or `{text}` destructuring spelling, both valid, in `callCadenceFormative()` call sites | Yes | Yes | Comment explains exactly why |
| `tests/cadence-production-path-qa-harness.test.mjs` | Pre-existing fix: replaces a **hardcoded path from a different, now-nonexistent Claude Code session's scratchpad directory** (`/private/tmp/claude-501/.../7fa72925-.../scratchpad/...`) with a portable `os.tmpdir()` + `process.pid` construction | Yes (the fix); the original hardcoded path was accidental residue from an earlier session | Yes (post-fix) | See §Flags — flagging the *evidence*, not the current (already-fixed) state |
| `tests/cadence-worker-migration.test.mjs` | Pre-existing test-assertion fix: updates a stale check that matched a `submitIntro()`/`introProceed()` function pair that no longer exists post-refactor, to instead balanced-brace-extract the real successor `mountCadenceIntro()` | Yes | Yes | Comment explicitly notes the check verified this against git HEAD, not just uncommitted state |

## 3. Documentation

| Path | Workstream | Intentional? | Belongs in commit? | Notes |
|---|---|---|---|---|
| `docs/admin/AIMT-ADMIN-MVP-SPEC.md` | Admin MVP: new §7.6 (Manual reactivation) + spec for the `reactivate_manual_access` action | Yes | Yes | 185 lines added, 0 removed — pure addition, matches the code exactly |
| `docs/admin/AIMT-ADMIN-ACTIVATION-RUNBOOK.md` (new) | Owner-facing runbook for first real Admin MVP activation | Yes | Yes | 772 lines |
| `docs/admin/AIMT-ADMIN-MVP-AUDIT-2026-09-15.md` (new) | Read-and-verify audit pass on the Admin MVP work | Yes | Yes | 324 lines |
| `docs/AIMT-MASTER-LAUNCH-CHECKLIST.md` (new) | Cross-cutting launch checklist, "evening pass" status as of 2026-09-15 | Yes | Yes | mtime (18:41) is later than the ~18:17 batch of code/test files below it — consistent with being updated *after* that work landed |
| `docs/course-audit/CLEAN-URL-PREVIEW-DEPLOY-CHECKLIST.md` (new) | Validates the `_redirects` clean-URL routing on a branch preview before it goes live | Yes | Yes | 125 lines |
| `docs/course-audit/pending-headspa-mastery-patches.md` (new) | Audit trail for the 3 clean-URL patches applied directly to `headspa-mastery.html` (canonical tag, og:url, footer link) while that file was frozen for Listen Mode work; status now marked APPLIED | Yes | Yes (or could be folded into the CLEAN-URL checklist, owner's call) | Explains exactly why `headspa-mastery.html` needed a direct edit despite the "surgical only" rule — legitimate exception, well-documented |
| `docs/email-templates/AIMT-EMAIL-TEMPLATES-SETUP.md` (new) | Setup doc for all Resend/Supabase transactional email templates | Yes | Yes | 547 lines |
| `docs/email-templates/custom-resend/*.html` (6 files, new) | The actual branded email template markup (certification-earned, educator-remediation-request-received, enrollment-confirmation, invite-manual-grant, review-request-received, security-password-changed) | Yes | Yes | `invite-manual-grant.html` is the template `manual-grant-invite-email.mjs` inlines verbatim — confirmed matching, not divergent |
| `docs/email-templates/supabase-auth/*.html` (3 files, new) | Supabase Auth email template overrides (change-email, confirm-signup, reset-password) | Yes | Yes | |
| `docs/email-templates/assets/*.png` (2 files, new) | AIMT mark images for email templates | Yes | Yes | Small brand assets, appropriate to track |
| `docs/stripe-and-email/AIMT-EMAIL-STRIPE-SETUP-CHECKLIST.md` (new) | Consolidated owner setup checklist for Stripe + email | Yes | Yes | 222 lines |
| `docs/stripe-and-email/AIMT-STRIPE-EMAIL-BRANDING-AUDIT-2026-09-15.md` (new) | Audit-and-prepare pass, explicitly "no live Stripe changes" | Yes | Yes | 417 lines; item 6 and item 7 of this doc are what the invite-email idempotency key and its test file cross-reference |
| `docs/stripe-and-email/assets/aimt-stripe-icon-512.png` (new) | Brand asset for Stripe Checkout branding | Yes | Yes | |
| `docs/course-audit/listen-mode/module-05-listen-script.md` | v1 → v2 strict-fidelity rebuild (202 add / 121 del) | Yes | Yes | Matches its own new fidelity-coverage-audit doc |
| `docs/course-audit/listen-mode/module-06-listen-script.md` | v1 → v2 strict-fidelity rebuild (232 add / 91 del) | Yes | Yes | **Owner has not reviewed this yet per your brief — left untouched, read-only, as instructed** |
| `docs/course-audit/listen-mode/module-01-fidelity-coverage-audit.md` (new) | Documents the v5→v6 Module 1 rebuild: owner rejected the first-generated audio, this audit proves 8 concrete narration-drift items are fixed before spending more ElevenLabs credit | Yes | Yes | Legitimate iteration, not duplicate effort — explicitly supersedes and retains v5 for history |
| `docs/course-audit/listen-mode/module-04-fidelity-coverage-audit.md` (new) | Same pattern, Module 4, v6 | Yes | Yes | 125 lines |
| `docs/course-audit/listen-mode/module-05-fidelity-coverage-audit.md` (new) | Same pattern, Module 5, v2 | Yes | Yes | 129 lines |
| `docs/course-audit/listen-mode/module-06-fidelity-coverage-audit.md` (new) | Same pattern, Module 6, v2 | Yes | Yes | 137 lines — part of the module you were told is awaiting owner review; not touched, read-only |
| `docs/course-audit/listen-mode/archive-loose-v1/module-05-listen-script-v1-REJECTED.md` (untracked) | Archived pre-rebuild v1 script, kept for history | Yes | Yes | 215 lines |
| `docs/course-audit/listen-mode/archive-loose-v1/module-06-listen-script-v1-REJECTED.md` (staged, `git add`-ed) | Same, Module 6 | Yes | Yes | 170 lines. **Inconsistently staged vs. its Module 5 sibling** — see §Flags (minor, cosmetic) |
| `docs/course-audit/listen-mode/tts-final/**` (all files: `ALL-MODULES-MANIFEST.json`, `GENERATION-LOG.json`, `REMAINING-BATCHES.json`, `RESUME.md`, `module-00`…`module-12/*.txt` + `manifest.json`, `archive-loose-v1/*`) | This week's full Listen Mode course-wide regeneration pass — validated narration source text + per-batch manifests + generation ledger | Yes | Yes | Text-only, correctly tracked per `.gitignore`'s own explanatory comment ("Text-only production docs... stay tracked"). No audio in this tree |

## 4. Scripts (Listen Mode tooling)

| Path | Purpose | Intentional? | Belongs in commit? |
|---|---|---|---|
| `scripts/aimt-listen-source-extract.mjs`, `-staging-init.mjs`, `-tts-preflight.mjs`, `-batch-build.mjs`, `-log-append.mjs` | Pipeline stages: extract narration source → init staging dirs → preflight-check ElevenLabs payloads → group into generation batches → append to the generation log | Yes | Yes |
| `scripts/aimt-listen-capcut-worklist-build.mjs` | Builds `MASTER-CAPCUT-WORKLIST.md` from the manifests | Yes | Yes |
| `scripts/aimt-listen-edit-wav-build.sh`, `-edit-wav-validate.mjs` | The `afconvert`-based RAW→EDIT.wav lossless-decode fix (works around a CapCut VBR/Xing-header import bug) + per-file duration validation against the generation log | Yes | Yes |
| `scripts/aimt-listen-module01-v6-build.mjs`, `-module04-v6-build.mjs`, `-module05-v2-build.mjs`, `-module06-v2-build.mjs` | Per-module rebuild-batch generators, one per module that needed a fidelity-standard rebuild | Yes | Yes | Version suffixes (`v6`, `v2`) reflect real, documented rebuild iterations (see fidelity-coverage-audits above) — not leftover duplicate attempts. No `-v1`/`-v3`/`-v4`/`-v5` sibling scripts exist anywhere in the tree or git history for these modules |

No secrets, API keys, or credentials found in any script (checked for ElevenLabs/`xi-api-key`/Resend/Supabase-service-role patterns — none present; scripts reference env vars by name only, never values).

## 5. Owner-only assets (audio staging — not for git)

| Path | Status | Notes |
|---|---|---|
| `AIMT-Listen-Mode-Final/**` (254 audio files: RAW.mp3/EDIT.wav/PROCESSED.{wav,MP3,WAV}, ~2.4 GB total, across `00-Welcome` through `12-Module-12` plus `archive-loose-v1/` subfolders) | Untracked, correctly excluded from git by `.gitignore`'s new `AIMT-Listen-Mode-Final/**/*.{mp3,wav,flac,FLAC}` rules | **See §Flags — case-sensitivity gap.** All current files were confirmed via `git check-ignore -v` to actually be excluded, because this machine has `core.ignorecase=true` (macOS default) |
| `AIMT-Listen-Mode-Final/README.md`, `<module>/README.md` (13 files), `MASTER-CAPCUT-WORKLIST.md` | Untracked but **not** gitignored (confirmed via `git check-ignore`, exit 1/not matched) | Deliberate per the directory's own README ("Every `.md` file here... stays tracked in git, same as the rest of `docs/course-audit/`"). Small text files, safe to add if/when the owner commits this directory's docs — total content is a few hundred KB, not the multi-GB audio |
| `AIMT-Listen-Mode-Final/.DS_Store` (top-level + 6 per-module copies) | Untracked, correctly gitignored globally via the repo's pre-existing top-line `.DS_Store` rule | Not a new problem |

## 6. Pre-existing repo hygiene (not part of any of this week's workstreams)

- No tracked `.DS_Store` anywhere in the repo (`git ls-files | grep -i DS_Store` — empty).
- No `node_modules` tracked or untracked at the repo root.
- No file named `tmp`, `scratch`, `debug`, `test-output`, or similar appears anywhere in `git status`.
- `scripts/.module12-review-output.html`, listed in `.gitignore`, does not currently exist on disk — nothing to flag.
- `git config core.ignorecase` is `true` on this machine (standard macOS/APFS default).

---

## Flags requiring owner attention

1. **`.gitignore`'s new Listen Mode exclusion rules are case-sensitive and miss the uppercase variants actually in use.** The four new lines only list `*.mp3`, `*.wav`, `*.flac`, `*.FLAC` — there is no `*.MP3` or `*.WAV` pattern. Real files in `AIMT-Listen-Mode-Final/` use uppercase extensions inconsistently (e.g. `M0-BATCH-A1a-PROCESSED.MP3`, `M1-BATCH-B1-PROCESSED.WAV`, alongside lowercase `-RAW.mp3` and `-EDIT.wav` siblings). On **this** machine it's harmless because `core.ignorecase=true` makes git's ignore-matching case-insensitive — verified directly with `git check-ignore -v` on both cases. But that setting is a per-clone/per-OS default, not a repo property: a Linux CI runner, a Docker build, or any contributor machine with `core.ignorecase=false` would **not** exclude the uppercase files, and a `git add -A`/`git add AIMT-Listen-Mode-Final/` there would stage multi-hundred-MB audio into history. Trivial fix: add `*.MP3`, `*.WAV` (and, for completeness, `*.Mp3`/`*.Wav` if any mixed-case variants ever appear) alongside the existing four lines. Low urgency (owner is on macOS and stages by hand per the runbooks), but worth closing before this ever runs anywhere else.

2. **Evidence of a prior session's accidental residue, already fixed in the current diff, not currently a live problem.** `tests/cadence-production-path-qa-harness.test.mjs`'s working-tree diff removes a hardcoded absolute path pointing at a **different Claude Code session's own scratchpad directory** (`/private/tmp/claude-501/-Users-brand-Documents-GitHub-aimt-site/7fa72925-b934-47ea-8935-adeb1a1b9dd5/scratchpad/qa-harness-test-out.json`) and replaces it with a portable `os.tmpdir()`-based path. This confirms that at some earlier point a session-specific temp path got committed into a test file that ships with the repo — the kind of accidental agent residue you asked me to hunt for. The current uncommitted diff already corrects it, so **no action is needed beyond making sure this fix is included in the eventual checkpoint commit** (it's a normal part of the `tests/cadence-production-path-qa-harness.test.mjs` diff, nothing separate to stage).

3. **Minor, cosmetic staging inconsistency (not a risk).** `docs/course-audit/listen-mode/archive-loose-v1/module-06-listen-script-v1-REJECTED.md` has already been `git add`-ed (shows as `A` in `git status`), while its exact Module-5 sibling, `.../module-05-listen-script-v1-REJECTED.md`, is still fully untracked (`??`). Both are the same kind of file (an archived, superseded v1 script, kept for history) and should probably be staged the same way before the checkpoint commit — purely a consistency nit, no content issue in either file.

**No secrets, API keys, tokens, or credentials were found anywhere in the working tree.** The one hit that looked like a live key at first grep (`SUPABASE_ANON_KEY`/`PUBLIC_ANON_KEY` values inside `admin.html`'s diff) is the project's already-public Supabase anon key — the same literal value already committed at HEAD in six other files (`my-aimt.html`, `student-access.html`, `success.html`, `aimt-service-timer.html`, `headspa-mastery.html`) and protected by RLS per this project's data model, not a new secret. The diff in `admin.html` only removes a second, dead, truncated placeholder variable (`PUBLIC_ANON_KEY`, literal value ending in `..."` — never a real key) and consolidates on the one real variable name.

---

## Summary

- **Total paths audited:** 56 (23 modified-tracked + 1 newly-staged + 32 untracked/new, matching `git status --porcelain`'s full output).
- **Clean / expected (intentional, correctly scoped, ready to commit as-is):** 53.
- **Flagged for owner attention:** 3 (all minor — a `.gitignore` case-sensitivity gap, one already-fixed piece of prior-session residue worth confirming lands in the commit, and one cosmetic staging inconsistency between two archived files). Zero secrets found. Zero duplicate feature implementations found. Zero evidence of two agents corrupting the same file.
