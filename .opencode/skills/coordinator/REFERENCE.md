# Coordinator Reference

## Execution Model

Use the coordinator checkout for scheduling only. Executable tickets and substantial workflow-maintenance changes run in isolated workspaces per `docs/adr/0003-ticket-and-workflow-workspaces.md`.

```text
discover work
-> build queue
-> provision or reuse isolated workspace
-> run first item through existing workflow engine or workflow-engineer
-> wait for complete, blocked, or escalated state
-> continue only if coordinator checkout, item workspace, and runtime state are clean
-> summarize aggregate status
```

Parallel execution is unsafe in one checkout because branches, runtime state, test output, and uncommitted files are shared. Parallel execution is allowed only when every active item has its own checkout, branch, state files, and test output path.

## Workspace Model

Recommended root:

```text
../Costume-Rent-workspaces/
```

Product ticket workspace:

```text
../Costume-Rent-workspaces/TICKET-YYYYMMDD-001
```

Workflow-change workspace:

```text
../Costume-Rent-workspaces/WF-YYYYMMDD-short-name
```

Ticket branches start from the plan branch when `plan_id` exists. Workflow-change branches use `workflow/{change-id}` from the recorded base branch.

## Discovery Procedure

1. Check `git status --short --branch`.
2. If the worktree is dirty, stop before queueing executable work and report the dirty paths.
3. Read recent `.opencode/logs/*.md` if present.
4. Read `.opencode/state/orchestrator-progress.json`, `.opencode/state/ticket-progress.json`, and `.opencode/state/checkpoints.json` if present.
5. Scan `docs/plans/*.md` and `docs/tickets/*.md`.
6. Group tickets by `plan_id` and status.
7. Identify review tickets, ready executable tickets, plans with queued work, workflow-change records, and plans stuck in regression gating or blocked PR state.

## Queue Rules

Prefer plan-level runs when multiple tickets belong to the same plan, because plan mode preserves review ordering and plan-completion gates.

Queue order:

1. Resume an existing `in_progress` plan or ticket recorded in runtime state.
2. Plans with `status: in_progress` and ready/review tickets.
3. Plans with `status: ready` and ready/review tickets.
4. Individual ready tickets only when they are not part of a better plan-level run.
5. Workflow-maintenance changes requested by the user.
6. Blocked or ambiguous items are report-only unless the user asks to repair planning artifacts.

Within one plan, defer ordering to the existing workflow engine. Do not preemptively reorder tickets in plan mode.

## Launch Rules

Before launching any lower-level run:

- Require a clean worktree.
- Confirm no runtime state indicates a different active run.
- Confirm the target plan or ticket still exists.
- Confirm or create the target workspace before execution.
- Prefer the existing command format already used by the repository.

## Stop Conditions

Stop immediately and report if any of these occur:

- Dirty worktree before or after a lower-level run.
- Missing, reused-for-wrong-item, or dirty item workspace.
- Branch mismatch or unexpected branch switch.
- Runtime state points to a different active plan/ticket.
- A lower-level run returns `blocked` or `escalated`.
- Review rejects a generated regression bug as setup/test noise.
- Impacted regression reports unmapped/setup failures.
- The user asks to pause, inspect, commit, push, or change strategy.

## Relationship To Other Workflow Rules

The coordinator is above the existing workflow engine but below the user. It schedules work; it does not redefine the ticket lifecycle.

Lower-level rules remain binding, including:

- one executable acceptance slice per ticket
- validation before implementation
- developer does not edit SDET-owned acceptance tests
- reviewer rejection is binding
- acceptance integrity gate must pass
- plan-completion impacted regression must pass before completion or PR
