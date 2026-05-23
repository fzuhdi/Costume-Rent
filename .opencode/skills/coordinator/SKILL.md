---
name: coordinator
description: Coordinates existing workflow runs without replacing the lower-level workflow engine. Use when the user asks to run or resume plans/tickets, continue ready work, coordinate workflow maintenance, or batch-check workflow status.
---

# Coordinator

## Quick Start

Use this skill to route targets, launch plan/ticket execution windows, and report handoff/status. The coordinator does not implement product code, write acceptance tests, audit tickets, or execute the orchestrator FSM inline.

Default execution is argument-first. Plan targets use max-3 isolated tracer-ticket fan-out; ticket targets launch one orchestrator TUI:

```text
target argument -> targeted read -> launcher selection -> isolated runtime/worktree launch -> handoff summary
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

The coordinator owns routing, cleanliness checks, model selection, parallel slot/worktree launch handoff, and aggregate status. The launched orchestrator sessions own execution, validation, implementation, audit, ticket completion, and ticket branch output. Plan integration/merge/regression remains deterministic and serialized after parallel ticket branches complete.

## Workflow

1. Check `git status --short --branch` and stop before executable work if dirty.
2. Route arguments before discovery:
   - Empty args: ask for a plan/ticket target or explicit status scan.
   - `PLAN-YYYYMMDD-*`: read only that plan plus tickets with matching `plan_id`.
   - `TICKET-YYYYMMDD-NNN`: read only that ticket and its manifest entry.
3. For plan launches, run `node .opencode/scripts/launch-parallel-plan.mjs --target <plan-id> --parallel 3` so up to three independent ready executable tickets get isolated worktrees, runtime slots, Compose stacks, and orchestrator TUI windows. The launcher excludes `depends_on` tickets until their prerequisites are complete.
4. For single-ticket launches, use the orchestrator default resolved by `.opencode/scripts/launch-orchestrator-tui.mjs` from `.opencode/workflow-models.json`.
5. Ask for a model only when the user requested an override or no configured orchestrator default is available.
6. Report target, slot/worktree/window details, resolved model, and exact handoff command.

## Status Report

Include branch/worktree state, active runtime plan/ticket, current or last orchestrator launch, blocked reasons, and next safest command. Status scans may read logs, plans, tickets, and runtime state as described in [REFERENCE.md](REFERENCE.md).

## Hard Rules

- Do not call `developer`, `sdet`, `reviewer`, or `explore` directly.
- Do not dispatch subagents against absolute paths outside the active project root.
- Do not launch more than one orchestrator TUI window at a time for the same checkout; plan parallelism must use isolated worktrees/runtime slots.
- Do not auto-stash, reset, checkout-discard, force push, or hide dirty work.
- Do not manually execute the orchestrator FSM if the TUI launch fails.
- Do not mark completion or create PRs unless lower-level completion and regression-gate rules are satisfied.
