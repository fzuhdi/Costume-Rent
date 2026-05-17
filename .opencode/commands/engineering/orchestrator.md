---
description: Show runnable plans or dispatch one strict TDD ticket/plan run. Usage /engineering/orchestrator [ticket-id|plan-id]
agent: build
---

Load the orchestrator skill (`.opencode/skills/orchestrator/SKILL.md`).

Raw arguments: **$ARGUMENTS**

Interpret arguments as one of these modes:

- Empty: run Startup + Standard Report, then show existing `status: ready` or `status: in_progress` plans the user can run next. Do not list individual ticket commands in this mode.
- Ticket: `$1` is a ready feature/bug `TICKET-YYYYMMDD-NNN` id from `docs/tickets/`.
- Plan: `$1` is a `PLAN-YYYYMMDD-*` id; audit review tickets and execute all ready feature/bug tickets for that plan sequentially.

If `$1` is empty:

1. Run Startup + Standard Report.
2. Report the active runtime plan/ticket if present.
3. List runnable plans only (`status: ready` or `status: in_progress`) with their recommended launch commands:
   - `/engineering/orchestrator PLAN-YYYYMMDD-name`
4. Do NOT invoke any subagents.

Otherwise:

1. Read only the targeted plan/ticket inputs needed to prepare dispatch.
2. Dispatch exactly one `task(subagent_type: "orchestrator")` with `MODE: run-ticket` or `MODE: run-plan` and the required fields from the orchestrator skill.
3. Wait for the orchestrator subagent to return `OUTCOME: success | partial | blocked`.
4. Summarize the orchestrator subagent result for the user.
5. If orchestrator subagent dispatch is unavailable or denied, stop and report a blocked workflow handoff. Do NOT manually execute the FSM or simulate `sdet`, `developer`, `reviewer`, or `explore`.

You are NOT allowed to skip RED, let developer edit the SDET test, override reviewer rejection, manually simulate worker roles, merge tickets, or auto-reset dirty work.
