---
description: Run tracer-bullet work by feature slice, ticket, or all ready tickets in one plan. Usage /engineering/orchestrator [feature-id|ticket-id|plan-id] [slice-id optional]
agent: build
---

Load the orchestrator skill (`.opencode/skills/orchestrator/SKILL.md`).

Raw arguments: **$ARGUMENTS**

Interpret arguments as one of these modes:

- Empty: list status, ready tickets, and ready plans.
- Feature/slice: `$1` is a feature id, `$2` is an optional slice id.
- Ticket: `$1` is a `TICKET-YYYYMMDD-NNN` id from `docs/tickets/`.
- Plan: `$1` is a `PLAN-YYYYMMDD-*` id; execute all ready tickets for that plan in priority order.

If `$1` is empty, run Startup + Standard Report (treat as `/productivity/start`) and ask the user which feature, ticket, or plan to work on.

Otherwise:

1. Run the orchestrator's Startup procedure for the selected mode.
2. Select or resume exactly one tracer slice (`SLICE_ID`) for the active feature or ticket.
3. Execute the FSM from the current validated state.
4. Dispatch subagents (`developer`, `sdet`, `reviewer`) via the Task tool per the state-execution rules.
5. In feature/slice or ticket mode, continue only until `slice-complete`, `feature-complete`, `escalated`, or the iteration limit, then stop.
6. In plan mode, after each `slice-complete`, mark the ticket complete and move to the next ready ticket for the same `PLAN_ID` until no ready tickets remain or one ticket blocks/escalates.

You are NOT allowed to skip states, change worker assignments, override transitions, merge tickets together, or expand beyond the selected `SLICE_ID`.
