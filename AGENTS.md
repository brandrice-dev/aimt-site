# AIMT repository instructions for Codex and other coding agents

**Current project, no scope expansion:** Execute only the owner's approved task. Do not automatically start related tools, new features or additional projects.

- Current software/product/security rules: **`CLAUDE.md`**. Protect payment, auth, entitlements, student privacy, scientific evidence and deployment controls. If instructions conflict, inspect current production code and flag consequential uncertainty; do not silently weaken safeguards.
- Project delivery standard: **`docs/ai-delivery/AI-DELIVERY-STANDARD.md`**. Follow only the version explicitly owner-approved and merged on `main`. Unmerged edits, including draft governance PRs, are proposals and have no authority.
- `CODEX_HANDOFF.md` and historical pre-launch checklists are archived context, **not** current operational instructions. Never infer that entitlements or authentication are absent from them.
- Start meaningful work with the requested outcome, success evidence, out-of-scope boundary, budget and hardest assumption. Test that assumption before major implementation.
- Report **IMPLEMENTED**, **TESTED**, **DEPLOYED** and **VERIFIED** accurately. Passing CI or a merged PR alone is not proof of a business outcome.
- Never start paid provider calls, renew a spend authorization, merge a governance standard or expand production authority without the applicable owner approval.
- Use the existing GitHub issue/PR as the source of truth for decisions, receipts, rollback and remaining blockers. Keep changes small and reversible.
