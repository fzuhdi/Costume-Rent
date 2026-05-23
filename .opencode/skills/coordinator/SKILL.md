---
name: coordinator
description: Coordinates existing workflow runs without replacing the lower-level workflow engine. Use when the user asks to run or resume plans/tickets, continue ready work, coordinate workflow maintenance, or batch-check workflow status.
---

# Coordinator

## Quick Start

Use this skill to route targets, prepare isolated worktrees/runtime slots, dispatch orchestrator tasks, and report handoff/status. The coordinator does not implement product code, write acceptance tests, audit tickets, or execute the orchestrator FSM inline.

Default execution is argument-first. Plan targets use deterministic max-3 isolated tracer-ticket preparation followed by orchestrator task fan-out; ticket targets dispatch one orchestrator task:

```text
target argument -> targeted read -> deterministic preparation -> orchestrator task dispatch -> handoff summary
```

For details, see [REFERENCE.md](REFERENCE.md).

## Triggers

Use when the user asks to:

- Run or resume plans or tickets.
- Continue ready tickets across one or more plans.
- Coordinate several workflow runs.
- Coordinate workflow-maintenance changes.
- Batch status-check plans, tickets, branches, or blocked work.
- Decide the safest order for multiple executable work items.

## Responsibilities

The coordinator owns routing, cleanliness checks, deterministic preparation, orchestrator task dispatch, and aggregate status. Orchestrator subagents own execution, validation, implementation, audit, ticket completion, and ticket branch output. Plan integration/merge/regression remains deterministic and serialized after parallel ticket branches complete.

## Workflow

1. Check `git status --short --branch` and stop before executable work if dirty.
2. Load `.opencode/skills/model-selector/SKILL.md` and follow its workflow to let the user choose models for all agent roles before every dispatch.
3. Route arguments before discovery:
   - Empty args: ask for a plan/ticket target or explicit status scan.
   - `PLAN-YYYYMMDD-*`: read only that plan plus tickets with matching `plan_id`.
   - `TICKET-YYYYMMDD-NNN`: read only that ticket and its manifest entry.
4. For plan targets, run `node .opencode/scripts/launch-parallel-plan.mjs --target <plan-id> --parallel 3 --json` so up to three independent ready executable tickets get isolated worktrees, runtime slots, Compose stacks, bootstrapped state, and structured `dispatch.task` handoffs. The prepare script excludes `depends_on` tickets until their prerequisites are complete.
5. Dispatch each returned `dispatch.task` with subagent type `orchestrator`. Do not edit the task prompt except to add user-approved context; it already contains `WORKTREE_ROOT`, target ids, branch data, runtime env keys, and nested-worker root instructions.
6. For single-ticket targets, dispatch one `orchestrator` task in the active clean worktree using the prompt pattern in `REFERENCE.md`.
7. Report target, slot/worktree/task details, and exact blocker or handoff result.

## Status Report

Include branch/worktree state, active runtime plan/ticket, current or last orchestrator launch, blocked reasons, and next safest command. Status scans may read logs, plans, tickets, and runtime state as described in [REFERENCE.md](REFERENCE.md).

## Hard Rules

- Do not call `developer`, `sdet`, `reviewer`, or `explore` directly; only orchestrator subagents may dispatch those workers.
- Do not dispatch subagents against arbitrary absolute paths; only the coordinator root and prepared worktrees returned by `.opencode/scripts/launch-parallel-plan.mjs` are valid roots.
- Do not dispatch more than one orchestrator task against the same checkout concurrently; plan parallelism must use isolated worktrees/runtime slots.
- Do not auto-stash, reset, checkout-discard, force push, or hide dirty work.
- Do not manually execute the orchestrator FSM if task dispatch fails.
- Do not mark completion or create PRs unless lower-level completion and regression-gate rules are satisfied.
