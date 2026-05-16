# OpenCode Workflow

This `.opencode` setup uses a lightweight Agile backlog with tracer-bullet execution. A plan acts like an epic. Tickets are executable backlog items. Each ticket proves one small end-to-end behavior through the real system before scope expands.

## Model

```text
Plan / Epic
  -> Ticket / Backlog Item
      -> type: feature | bug | chore | spike
      -> one tracer-bullet slice
      -> acceptance criteria
      -> definition of done
```

Use one ticket workflow for features, bugs, chores, and spikes. Do not create a separate bug-only workflow.

## Commands

| Command | Purpose |
|---|---|
| `/planning/plan-to-tickets [plan-file] [plan-id optional]` | Converts a PRD, bug report, or plan into a plan file plus tracer tickets. |
| `/engineering/orchestrator` | Lists current feature status plus ready tickets and plans. |
| `/engineering/orchestrator [feature-id] [slice-id optional]` | Runs one acceptance-criteria slice directly. |
| `/engineering/orchestrator [ticket-id]` | Runs one ticket from `docs/tickets/`. |
| `/engineering/orchestrator [plan-id]` | Runs all ready tickets for one plan in priority order. |
| `/productivity/start` | Reads progress/logs and recommends the next action. |
| `/productivity/status` | Reports current workflow status. |

## High-Level Flow

```text
/ask-me                         optional future clarification step
  -> plan, PRD, bug batch, or notes

/planning/plan-to-tickets PLAN
  -> docs/plans/PLAN-*.md
  -> docs/tickets/TICKET-*.md

/engineering/orchestrator
  -> lists ready tickets and plans

/engineering/orchestrator PLAN-...
  -> executes every ready ticket for that plan
```

The commands are independent. They communicate through files, not by calling each other.

## Plan Files

Plans live in `docs/plans/` and group related tickets under one `plan_id`.

```yaml
---
id: PLAN-20260516-catalogue-search
status: ready
source_plan: docs/plans/catalogue-search.md
---
```

Plans are planning artifacts, not execution units. The orchestrator executes the ready tickets that belong to a plan.

## Ticket Files

`/planning/plan-to-tickets` writes executable ticket files to `docs/tickets/`.

Each ticket is one tracer bullet:

```yaml
---
id: TICKET-20260516-001
plan_id: PLAN-20260516-catalogue-search
type: feature
status: ready
feature: CATALOGUE
slice_id: AC-004-001
priority: 1
source_plan: docs/plans/catalogue-search.md
test_file: test/specs/catalogue.spec.js
---
```

`status: ready` means the orchestrator can execute it. `status: draft` means the ticket needs clarification first.

Ticket types:

| Type | Meaning |
|---|---|
| `feature` | New user-visible behavior. |
| `bug` | Broken expected behavior with repro, expected result, and actual result. |
| `chore` | Maintenance work with concrete completion criteria. |
| `spike` | Research that produces a decision, prototype, or follow-up tickets. |

## Plan Execution

When invoked with a `PLAN_ID`, the orchestrator:

1. Scans `docs/tickets/*.md`.
2. Selects `status: ready` tickets with that `plan_id`.
3. Sorts by `priority`, then ticket id.
4. Runs one ticket through the normal tracer-slice FSM.
5. Marks the ticket complete in `.opencode/state/ticket-progress.json`.
6. Continues to the next ready ticket for the same plan.

It stops on the first blocked or escalated ticket. This keeps architectural uncertainty visible instead of burying it under a long batch.

## Single-Ticket Execution

When invoked with a `TICKET_ID`, the orchestrator loads `docs/tickets/{TICKET_ID}.md`, reads `type`, `feature`, and `slice_id`, and passes ticket context to the subagents.

The ticket's acceptance criteria are the source of truth for behavior. `docs/ACCEPTANCE_CRITERIA.md` and `.opencode/state/feature-manifest.json` still provide mapping and file hints.

## Tracer FSM

Every ticket or direct slice follows the same core loop:

```text
selecting-slice
-> building
-> writing-test
-> testing
-> bug-fixing, if needed
-> reviewing, if fixed
-> verification
-> slice-complete
```

Developer owns app code. SDET owns tests. Reviewer is read-only. The orchestrator is the only component that chooses state transitions.

## State Files

| File | Purpose |
|---|---|
| `.opencode/state/orchestrator-progress.json` | Current direct feature/slice FSM state. |
| `.opencode/state/ticket-progress.json` | Runtime ticket and plan completion state. |
| `.opencode/state/feature-manifest.json` | Generated feature-to-slice map. |
| `.opencode/state/feature-{id}/failures.md` | Append-only targeted test/fix log. |
| `.opencode/state/feature-{id}/disputes.md` | SDET-fault arbitration log. |
| `.opencode/state/checkpoints.json` | Pre-fix checkpoint commits. |

## Restart Note

OpenCode loads commands, agents, skills, and config at startup. After changing files under `.opencode/commands/`, `.opencode/agents/`, `.opencode/skills/`, or `.opencode/opencode.json`, quit and restart OpenCode.
