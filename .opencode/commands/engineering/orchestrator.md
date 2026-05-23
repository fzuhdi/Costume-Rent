---
description: Show runnable plans or dispatch one strict TDD ticket/plan run. Usage /engineering/orchestrator [ticket-id|plan-id]
agent: orchestrator
---

Load the orchestrator skill (`.opencode/skills/orchestrator/SKILL.md`).

Raw arguments: **$ARGUMENTS**

Interpret arguments as one of these modes:

- Empty: run `node .opencode/scripts/workflow-runner.mjs --json`, summarize the read-only status report, then show existing `status: ready` or `status: in_progress` plans the user can run next. Do not list individual ticket commands in this mode.
- Ticket: `$1` is a ready feature/bug `TICKET-YYYYMMDD-NNN` id from `docs/tickets/`.
- Plan: `$1` is a `PLAN-YYYYMMDD-*` id; audit review tickets and execute all ready feature/bug tickets for that plan sequentially.

If `$1` is empty:

1. Run `node .opencode/scripts/workflow-runner.mjs --json`.
2. Report the active runtime plan/ticket if present from the runner output.
3. List runnable plans only (`status: ready` or `status: in_progress`) with their recommended launch commands:
   - `/engineering/orchestrator PLAN-YYYYMMDD-name`
4. Do NOT invoke any subagents.

Otherwise:

1. Read only the targeted plan/ticket inputs needed to prepare dispatch.
2. This command is already running as the `orchestrator` agent. Execute the requested `MODE: run-ticket` or `MODE: run-plan` directly using the orchestrator skill FSM.
3. Dispatch only the worker subagents required by the FSM (`sdet`, `developer`, `reviewer`, `explore`).
4. Return `OUTCOME: success | partial | blocked` and summarize the result for the user.
5. If worker subagent dispatch is unavailable or denied, stop and report a blocked workflow handoff. Do NOT manually execute or simulate `sdet`, `developer`, `reviewer`, or `explore`.

You are NOT allowed to skip RED, let developer edit the SDET test, override reviewer rejection, manually simulate worker roles, merge tickets, or auto-reset dirty work.
