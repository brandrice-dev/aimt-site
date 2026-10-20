# Independent architecture review brief — AI project delivery

**Status:** Owner-requested design challenge; NOT an approved policy or implementation.
**Scope:** Reusable across future software, research, content, and automation projects. AIMT is the first pilot, not the only project.
**Reviewer:** Codex, working independently. Do not consult ChatGPT's proposed governance design or treat existing assistant advice as authoritative.

## Objective

Design the *smallest enforceable and reusable* way for AI-assisted projects to move from owner objectives to reliably demonstrated outcomes. The owner wants candid contradiction and better alternatives, not automatic agreement. They should define outcomes, constraints, budget, and major tradeoffs—but should not have to discover elementary system architecture failures or personally inspect thousands of research records.

## Real-world case to learn from (not necessarily the only model)

In AIMT's scientific article automation, earlier iterations attempted to synthesize ~401 claims from ~101 sources in a single large model output. The response repeatedly hit output limits. Multiple passing code test suites and merged pull requests were presented as progress despite zero new successful publications from those attempts. A later independent Reviewer properly rejected unsupported article wording. A system that merely retries the same expensive failure is unacceptable. GitHub/Cloudflare/Supabase are involved; an existing automation has a $2 per authorized window / six-request budget. The technical workflow has since been modified to batch and save research. The *new governance proposal* must be judged independently of whether that batching change ultimately works.

Repository orientation: `CLAUDE.md` currently contains stale pre-launch information. `CODEX_HANDOFF.md` is a legacy handoff. Preserve their valid product/security rules. Do not assume a markdown file automatically enforces behavior, that GitHub branch protections are enabled, or that multiple AI reviewers are independent evidence of correctness.

## Required properties; implementation is your choice

- Outcomes and acceptance evidence are defined **before** substantive work; a green CI run or merged PR never alone proves the business goal was reached.
- A cheap, production-representative pilot tests the riskiest technical assumption *before* large implementation or spending.
- Costs, model requests, retry limits, and irreversible production effects have enforceable limits; paid repetition of the same underlying failure stops rather than looping.
- Plans and decisions remain discoverable across chats, tools, and handoffs without duplicate conflicting documents.
- Scientific, financial, credential, payment, and security boundaries cannot be weakened to obtain a pass.
- Approval, verification, rollback, observability, and owner authority are explicit; one AI does not rubber-stamp its own work.
- Lightweight changes remain fast. High-risk or expensive changes receive deeper scrutiny proportionate to their risk.
- The standard itself is versioned, reviewable, amendable, and cannot be silently weakened by assistants.
- Portability: work with ChatGPT, Codex, Claude and future agents; be honest about what must be configured in each product and what is enforceable only in GitHub or an external service.

## Independent review deliverable — DO NOT implement yet

1. Recommend a minimal viable operating model **and** at least one materially simpler alternative. Explain the tradeoffs and where a multi-agent system would add cost but no trust.
2. Define risk tiers and the mandatory gates for each tier.
3. Identify which controls are enforced by software/CI, which are social policy, and which require GitHub administration or user setup that you cannot verify.
4. Provide a concrete plan for integrating with `CLAUDE.md`, Codex instructions, ChatGPT Project instructions, current repo CI and other projects, with no accidental overwrite of existing valid rules.
5. Propose outcome acceptance, failed-pilot stop conditions, spending constraints, and truthful status labels with an AIMT publishing example.
6. Red-team your recommended architecture with at least five plausible failure scenarios, including stale instructions, correlated AI errors, passing tests with broken production behavior, repeated paid retries, and malicious/untrusted source instructions.
7. List the *few* decisions truly requiring owner sign-off; don't push ordinary implementation choices to the owner.
8. Say explicitly what you would **not** build and which tempting ideas are overengineering.

**Important:** This is an independent design request. No pushes, PRs, merges, real provider calls, purchases, or production modifications. Work read-only. Return an architecture proposal and an adversarial critique with specific evidence from the repository. Do not say "approved" or "done."

## Ground rules for comparison

ChatGPT will prepare a separate proposal without seeing your reply. Once both exist, compare them on enforceability, expected overhead, testability, recovery, portability, independence, and fit for the owner. Disagreement is valuable: record it rather than hiding it. Owner approves before any standard becomes authoritative.
