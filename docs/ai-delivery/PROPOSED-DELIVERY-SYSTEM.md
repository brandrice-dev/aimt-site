# Proposed AI Delivery System — ChatGPT architecture v0.1

**DRAFT ONLY — no policy authority, no automatic enforcement.**
**Design prepared independently of Codex's response.**
First pilot: AIMT. Intended to be reusable in other repositories and projects after independent critique and owner approval.

## Design decision: one standard, lightweight adapters, proof over process

Create **one short, versioned core standard**, then configure each agent's actual entry point to consult it. Every significant project keeps a compact outcome contract in a GitHub issue or version-controlled specification. Evidence of completion is attached to the issue/PR. Do not create a separate bureaucracy or continuously running AI management agents.

### Operating principle

The person requesting the work defines the *outcome, constraints, budget, and unacceptable outcomes*. AI should offer better alternatives, challenge assumptions and recommend simpler solutions. A change is **not done** until there is evidence that the original outcome is achieved. Passing unit tests or merging a PR establishes implementation evidence, never production success.

## Tiering: same principles, different overhead

| Tier | Work | Required controls |
| --- | --- | --- |
| 0 / routine | Reversible content/copy or low-risk visual adjustment | Implement, check diff, verify requested output. No separate architect or formal contract. |
| 1 / moderate | New reversible site feature or internal workflow | Short written outcome + acceptance checks, one architecture sanity check, focused tests, deployment verification and rollback method. Independent reviewer when meaningful. |
| 2 / high | AI autonomy, money, customer access, privacy, scientific claims, security, irreversible actions, or sustained spending | Owner-approved objective and total spend cap, **independent** design critique before major implementation, cheap real-scale pilot of riskiest assumption, explicit fail-closed tests, adversarial security/scientific review as appropriate, rollout gates, rollback, real production evidence. |

When in doubt, classify by the *worst credible failure*, not line count or apparent simplicity. Never make high-risk edits “routine” by splitting them into tiny PRs.

## Seven executable questions per substantial task

1. **Outcome:** What observable user/business change constitutes success? What would clearly disprove success?
2. **Constraints:** What may not change (product, scientific safety, credentials, data, pricing)? What are per-run, per-window, and **total campaign** spending limits?
3. **Alternatives:** Can a simpler architecture meet the outcome? What would be worse about it? State unknowns, not guesses.
4. **Risk-first pilot:** What single production-representative experiment best tests the hardest assumption *before* building the full surrounding system?
5. **Implementation:** What is the smallest reversible change with appropriate deterministic tests and recoverable state?
6. **Independent evidence:** Who/what checks it independently? Which parts are only model opinions, not demonstrated facts?
7. **Production observation:** What real output/event will be checked, for how long or across how many runs, and what evidence can the owner inspect?

If an answer is genuinely unavailable, explicitly mark the stage **BLOCKED**; do not silently infer success.

## Status words with fixed meanings

- **PROPOSED**: written objective / approach, not implemented.
- **PILOTED**: hardest key assumption tested at realistic scale; other components not proven.
- **IMPLEMENTED**: code or documents created.
- **TESTED**: defined tests passed in a controlled environment.
- **DEPLOYED**: change reached its intended environment; behavior not necessarily observed.
- **VERIFIED**: observable acceptance criteria demonstrated in the intended environment.
- **BLOCKED**: stopped with an explicit reason and named next decision.

Never use “finished”, “working end-to-end”, or “published” as synonyms for TESTED or DEPLOYED. Where science is involved, independently grounded review must remain mandatory.

## Independent challenge

For Tier 2, a second architect **first sees only the objective/constraints and real failure evidence**, not the first architect's design. The reviewer supplies at least one better alternative or a reason none exists, failure modes, gaps in testing, cost exposure, and what not to build. Then reconcile in a short architecture decision record containing both positions and unresolved disagreements.

Important: two AI systems may make correlated errors. Independent model agreement does not substitute for tests, an expert when required, or live outcome evidence. Reviewer self-approval is forbidden for high-risk changes.

## Budget, retry, and incident controls

- Authorize both a **per-window maximum and aggregate project/test ceiling**, including token/API costs, cloud resources and repeated scheduled windows. Reservations are **not** necessarily provider invoices; reconcile actual measured usage when available.
- Spend authorization is a runtime guard where possible, not a sentence in a prompt. Never invent a new renewal mechanism after exhaustion.
- After **two failures sharing an underlying cause**, stop new paid attempts, classify the root cause and write a changed technical hypothesis before resumption. A new prompt phrasing alone is not a demonstrated new architecture.
- Incomplete but verified work must be durable and resumable where the application permits. No success may be inferred from partial scientific clearance.
- Rollbacks and shutdown controls must be demonstrably reachable. If automatic suspension is not implemented, state that the rule is only procedural.
- Never weaken auth, payment, independent scientific review, privacy rules, evidence checks, or security to obtain a passing CI result.

## Minimal artifacts, not a document empire

1. **Core standard**: one short `docs/ai-delivery/AI-DELIVERY-STANDARD.md` after owner approval; a durable *cross-project source*, distributed to other projects intentionally (do not claim a single repo file governs every tool).
2. **Project-specific rules**: retain and correct AIMT `CLAUDE.md`; add `AGENTS.md` for Codex where supported; point to the shared standard while preserving critical project instructions. Add a short pointer in relevant ChatGPT Project instructions through the user's permitted setup.
3. **Outcome contract**: one short GitHub issue or PR section for Tier 1/2 with requested outcome, failure example, acceptance proof, total budget, constraints, and owner sign-offs.
4. **Decision record**: for Tier 2 only, one concise tradeoff entry in that issue/PR, including independent review disagreement.
5. **Evidence record**: link reproducible tests, production run identifiers, measurable outcome, failed cases, and cleanup/rollback information.

Do not create an AI committee, autonomous “project manager” swarm, mandatory multi-approval workflows for low-risk changes, or an opaque scoring formula that replaces judgment.

## Enforcement reality check

- `CLAUDE.md` / `AGENTS.md` can guide agents only when their environments actually load them. ChatGPT cannot be assumed to automatically read a private GitHub file in unrelated chats.
- CI can validate code, docs structure, test existence, and certain acceptance artifacts. It cannot **prove** external business outcomes or scientifically approve an article.
- Protected branches, mandatory reviews, CODEOWNERS approvals, deployment holds and policy-file edit restrictions require explicit GitHub configuration/permissions. Do not claim enforced merely because a PR template mentions them.
- Owner controls changes to this core standard; changes proposed by AI require an independent review and explicit owner approval. The standard must be version-controlled with a change rationale and rollback.

## Minimal implementation sequence (after Codex critique, not before)

**Stage A — align reality.** Inventory existing AIMT rules and current architecture; repair stale “pre-launch” statements without overwriting valid security/payment course instructions. Owner approves v1 scope.

**Stage B — enforce essentials.** Add concise core rules and agent entry-point pointers, PR/issue acceptance template, and CI checks for high-risk scoped requirements where practical. Keep normal low-risk work unblocked.

**Stage C — pilot against known failures.** Apply the standard retrospectively to the AIMT 401-claim auto-publisher: its riskiest assumption, actual scientific review, daily *and cumulative* spend, saved batches, complete live publication evidence, and two-repeat stop-loss. Confirm the new process would have called a halt **before** expensive failed repetitions.

**Stage D — roll out gradually.** Only after proving the standard creates fewer bad decisions without undue process cost, copy the stable core into other repositories and configured agent environments.

## What could make this proposal wrong

- Too much required paperwork may slow routine delivery without improving quality.
- Independent AI reviewers can agree on the same incorrect premise.
- High-quality developer tests may still miss integration effects in production.
- Templates may give a false feeling of enforcement when GitHub protections are absent.
- A rigid two-failure stop rule may be ill-suited to transient outages; classify common root cause, severity and recoverability before stopping.
- Sharing one core standard across unrelated businesses can erase legitimate differences; keep project overlays.
- A governance policy itself can become stale, like the existing AIMT `CLAUDE.md`; assign periodic owner-visible currency checks without unauthorised edits.

**No merging, setting changes, retroactive approvals or new paid model tests until independent Codex design comparison and owner sign-off.**
