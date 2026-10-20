# AI Delivery Standard — AIMT adoption v1.0

**Status:** PROPOSED. This document is not authoritative until the owner explicitly approves it and PR #110 is merged.
**Scope:** AI-assisted development, research automation, education, content, and operating systems in AIMT. Future projects may adopt a pinned version intentionally; this file does not automatically govern unrelated repositories.
**Evidence:** Independent Codex design challenge (October 20, 2026), separate ChatGPT design, and AIMT production failures. Do not treat AI agreement as proof of correctness.

## 1. North Star and scope discipline

AIMT exists to become a scientifically grounded, continually improving institution: collect *relevant* knowledge, evaluate it, and use it to improve courses, student learning, search performance, professional tools, and graduate value. **This is a prioritization compass, not an invitation to start more projects.**

Work on **one owner-approved primary outcome** at a time. Record adjacent ideas in the existing backlog, do not implement them without authorization. Prefer improving an existing working system to introducing a new platform. Every project must have an end state; ongoing research or monitoring is an explicitly bounded operating service, not an endlessly growing build.

Challenge weak assumptions and recommend simpler alternatives. Agreement with the owner or another AI is not itself success.

## 2. Choose oversight proportional to risk

Determine risk from the worst credible consequence, not the number of files changed. An author cannot reduce risk classification merely by splitting work into small PRs.

| Tier | Examples | Required gates |
| --- | --- | --- |
| **0 — Routine** | Reversible text/layout adjustment | State expected result, inspect exact diff/output, perform relevant check. No separate AI reviewer required. |
| **1 — Material** | New reversible feature, internal workflow | Delivery record; alternatives and riskiest assumption; focused and realistic integration tests; distinct reviewer where meaningful; rollback and outcome check. |
| **2 — Consequential** | Scientific claims, certification rules, student privacy, auth/payments, credentials, automated spending or publication, governance itself | Owner-approved contract, independent architecture challenge, bounded real-scale feasibility probe, explicit per-window AND total spend limits, protected scientific/security checks, independently verified production outcome and authorized release. |
| **3 — Exceptional** | Destructive migration, irreversible bulk action, materially expanded autonomous authority | Tier 2 plus qualified human review, staged/rollback rehearsal and specific owner authorization. |

Existing validated evidence may be reused when still applicable. Don't repeat ceremonial pilots.

## 3. One delivery record per outcome

Use a GitHub issue or PR description (see `.github/pull_request_template.md`), linked from further PRs if work spans several changes. Avoid parallel status documents or chat-specific truth.

Before substantive Tier 1–3 implementation, record:
- **Outcome and exclusions:** concrete user/business result, what is explicitly out of scope, who owns acceptance.
- **Acceptance proof:** tests plus real-environment observations; identify what would falsify a success claim.
- **Risk and alternative:** tier, simplest viable approach, tradeoffs, riskiest hypothesis and representative pilot.
- **Resources:** time/request caps, per-window and **total authorized** spend, third-party charges and approval limits.
- **Safety:** credentials, personal data, scientific scope, affected systems, rollback, stop conditions.
- **Authority:** who may build, independently verify and promote the specific artifact.
- **Receipts:** exact run/commit/deployment IDs, spending reservations and provider usage (or unknown usage), review decisions, remaining blockers.

An acceptance criterion defined *after* the result does not count as pre-agreed proof. Substantive owner decisions are explicit; routine technical details belong to the implementer.

## 4. Build and prove in this order

**Outcome contract → architecture alternatives/challenge → cheapest realistic probe of highest-risk assumption → smallest reversible implementation → tests → independent verification → authorized release → observation of the actual result.**

Never substitute a passing unit test, merged PR, model consensus, successful API response or Cloudflare deployment for a real user-facing result. Verify the *content* of produced artifacts, not only their metadata, marker or URL.

For a scientific output, retain evidence provenance, relevant counterevidence, limits, citations and unresolved conflicts. Deterministic ID accounting is necessary but cannot itself establish scientific truth. Reviewer rejection is a **successful safety control** and a **failed publication attempt**; report both. Follow qualified expert review where the risk requires it.

### Status vocabulary (use factual dimensions)

- **PROPOSED:** defined but not built.
- **PILOTED:** an identified assumption passed a representative test; other stages unproven.
- **IMPLEMENTED:** changes written.
- **TESTED:** named tests passed; state their limits.
- **DEPLOYED:** change reached target environment.
- **VERIFIED:** original acceptance evidence observed on the actual target.
- **BLOCKED:** stopped with reason, preserved state and explicit next decision.

A project is **DONE** only when its contracted acceptance is VERIFIED and remaining limitations are recorded. Costs, scientific review, and operational status are reported separately; do not call a partial candidate published.

## 5. Enforce spending and stop repeated failures

Before any newly authorized paid automation campaign, define BOTH its per-window cap and **aggregate task/campaign cap**. Account across agents, diagnostic calls, retries, schedules, and continuations. No total authorization means do not initiate a *new* paid campaign. A new run or day is not an unlimited new total budget. Provider estimates are not invoices; unknown usage remains reserved until reconciled.

For Tier 2–3 paid work, a **trusted credential-owning service and remote atomic reservation ledger** are the target enforcement boundary. Local runner files, prompts and post-run GitHub artifact uploads do **not** guarantee durability after a crash. Do not represent current AIMT local cost controls as equivalent to a hard provider billing limit. Avoid arbitrary raw API keys in low-trust model/agent environments.

**Stop-loss:** after two attempts with the same underlying failure, or immediately after a structural token-size/truncation, safety or authorization failure, suspend that approach. Do not pay for another identical run. Document the cause, a materially changed hypothesis, a bounded test and the required reauthorization. A mere prompt wording change is not proof of a fix. Preserve verified intermediate work, but do not treat partial science as approved content.

Do not weaken payment, access, scientific review, privacy, release checks or input integrity to force a PASS.

## 6. Separate authority and protect the contract

- **Construction:** AI agents can propose code, content, tests and bounded artifacts; they do not automatically approve their own work.
- **Verification:** independent checks inspect the unchanged candidate and pre-agreed acceptance evidence. A verifier controlled by the candidate is not a sufficient independent gate.
- **Spending:** authorized credentials and durable ledger are separate from the creative/model agent; untrusted source text cannot authorize spending or actions.
- **Release:** owner/delegated authority promotes a specific verified artifact. High-risk expansion of release authority requires owner approval.

Owner approval is required to adopt or materially weaken this standard. Change it only via version-controlled proposal, independent review and explicit owner sign-off. Keep a rollback path.

`CLAUDE.md`, `AGENTS.md`, prompts and PR templates are **instruction aids, not technical enforcement**. GitHub required status checks, branch rules, reviewer permissions and Cloudflare/Supabase roles must be verified in actual admin settings. If unverified, label them **NOT VERIFIED**, never “enforced.”

## 7. Minimum receipts and completion

Every Tier 1–3 handoff says: **what was actually observed, what is still unproven, actual/estimated cost and unknown amounts, the next bounded action, and whether release occurred.** Receipts live in the delivery record; do not create separate competing dashboards.

For AIMT's article pipeline, **VERIFIED** means a real article with appropriate scientific review is publicly accessible, its deployed body matches the reviewed artifact, citations work, route/indexing and database state agree, and the approved total budget and recovery conditions are honored. Batching tests alone are **TESTED**, not VERIFIED.

## 8. Adoption and deferred enforcement

This v1 document is a **process and instruction baseline**, not proof that missing technical controls have been implemented. Existing AIMT automation has known outstanding risks in remote spend reservations, project-total budget enforcement, credential isolation, and deployed-body verification. Record those gaps honestly in the relevant existing work; **do not spawn new projects just because a gap is documented.**

The delivery standard project closes when: the owner approves the reconciled version; root Claude and Codex entry points use this same policy; stale instructions are clearly retired; the PR delivery template is usable; documentation wiring checks pass; and remaining unenforced controls are explicitly named. This standard's adoption **does not by itself** reauthorize, pause, or rewrite AIMT publishing or any other existing workflow.
