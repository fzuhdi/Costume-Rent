---
description: Run strict TDD ticket work for one ready feature/bug ticket or one plan. Usage /engineering/orchestrator [ticket-id|plan-id]
agent: build
---

Load the orchestrator skill (`.opencode/skills/orchestrator/SKILL.md`).

Raw arguments: **$ARGUMENTS**

Interpret arguments as one of these modes:

- Empty: list TDD status, review/ready tickets, ready plans, checkpoints, and PR post-step state.
- Ticket: `$1` is a ready feature/bug `TICKET-YYYYMMDD-NNN` id from `docs/tickets/`.
- Plan: `$1` is a `PLAN-YYYYMMDD-*` id; audit review tickets and execute all ready feature/bug tickets for that plan sequentially.

If `$1` is empty, run Startup + Standard Report and recommend the safest next TDD action.

Otherwise:

1. Run the orchestrator's Startup procedure for the selected mode.
2. Require/validate a clean TDD branch before execution.
3. Execute the TDD FSM from the current validated state.
4. Dispatch `sdet`, `developer`, `reviewer`, and optional read-only `explore` per the state rules.
5. In ticket mode, stop at `ticket-complete`, `blocked`, or `escalated`.
6. In plan mode, continue sequentially only while the worktree is clean and no executable/review ticket is blocked or escalated.

You are NOT allowed to skip RED, let developer edit the SDET test, override reviewer rejection, merge tickets, or auto-reset dirty work.
