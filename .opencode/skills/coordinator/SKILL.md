---
name: coordinator
description: Coordinates multiple existing workflow runs without replacing the lower-level workflow engine. Use when the user asks to run/resume multiple plans, continue ready tickets, coordinate workflow maintenance, or batch-check workflow status.
---

# Coordinator

## Quick Start

Use this skill to sequence workflow runs safely. The coordinator schedules and reports; it does not implement product code, write acceptance tests, audit tickets, or bypass the existing workflow engine.

Default execution is argument-first. Do not scan the whole backlog until the user asks for a status scan or omits arguments and then chooses a scan.

```text
target argument -> targeted read -> provision workspace(s) -> launch lower-level command(s) -> summarize
```

Executable tickets and substantial workflow-maintenance changes use isolated workspaces:

```text
ticket workspace -> /engineering/orchestrator TICKET-ID
```

For full rules, see [REFERENCE.md](REFERENCE.md).

## Triggers

Use when the user asks to:

- Run or resume multiple plans.
- Continue all ready tickets across one or more plans.
- Coordinate several workflow runs.
- Coordinate workflow-maintenance changes.
- Batch status-check plans, tickets, branches, or blocked work.
- Decide the safest order for multiple executable work items.

Use explicit arguments to avoid broad discovery. For one straightforward ticket, launch the existing workflow engine in that ticket workspace. For one explicit plan, coordinate ticket-level fan-out by default instead of invoking sequential plan mode.

## Responsibility

The coordinator owns:

- argument routing
- queueing and sequencing
- branch/workspace safety checks
- aggregate status reporting
- selecting the next safest workflow command

The existing workflow engine and worker agents still own execution, validation, implementation, and audit.

## Workflow

1. Check `git status --short --branch`.
2. Stop if the coordinator checkout is dirty before executable work.
3. Route arguments before discovery:
   - Empty args: ask which plan/ticket to run, or whether to do a status scan.
   - `PLAN-YYYYMMDD-*`: read only that plan and tickets with matching `plan_id`.
   - `TICKET-YYYYMMDD-NNN`: read only that ticket and its manifest entry.
4. Build a targeted queue.
5. For explicit plans, provision or reuse one isolated ticket workspace per ready executable ticket and launch ticket orchestrators in parallel when each workspace is clean, capped at 3 concurrent ticket runs.
6. For explicit tickets, provision or reuse that ticket workspace and launch one ticket orchestrator.
7. In each parallel batch, run independent tickets first. Tickets that declare dependencies are last priority and wait until prerequisite tickets are complete or no independent tickets remain.
8. Integrate completed ticket branches back to the plan branch sequentially, then run plan regression/completion from the plan integration workspace.
9. Stop on blocked/escalated state, dirty work, branch conflict, missing child-session launcher, or user input.
10. Report aggregate status and the next safest command.

## Launch Examples

Use the repository's current documented workflow command. Current examples:

```text
/coordinator
/coordinator PLAN-YYYYMMDD-name
/coordinator TICKET-YYYYMMDD-001
/engineering/orchestrator PLAN-YYYYMMDD-name
/engineering/orchestrator TICKET-YYYYMMDD-001
```

Use `/engineering/orchestrator PLAN-...` only when the user explicitly asks for sequential plan execution. Coordinator plan mode defaults to parallel ticket fan-out with max concurrency 3.

## Scheduling Rules

- Max parallel ticket orchestrators per explicit plan: 3.
- Independent `ready` feature/bug tickets run before dependency-bearing tickets.
- A ticket is dependency-bearing when its frontmatter or body explicitly declares fields or text such as `depends_on`, `dependencies`, `blocked_by`, `requires`, or a prerequisite other than `none`.
- If dependency metadata references ticket ids, do not schedule the dependent ticket until those tickets are `complete`.
- When dependency metadata is vague, defer the ticket behind all independent ready tickets and report the ambiguity.

## Status Report

Include:

- Current branch and worktree cleanliness.
- Active runtime plan/ticket if any.
- Active workflow-change id if any.
- Queue candidates and chosen order.
- Current or last lower-level run.
- Counts by `draft | review | ready | in_progress | blocked | complete`.
- Blocked reasons and exact files involved.
- Next safest command.

## Child Execution

The coordinator never calls `developer`, `sdet`, or `reviewer` directly. It also never dispatches subagents with absolute paths outside the active project root.

For external Git worktrees, start a lower-level OpenCode session with that worktree as its project root, then run:

```text
/engineering/orchestrator TICKET-YYYYMMDD-001
```

If the coordinator cannot launch child OpenCode sessions from each workspace root, it must stop after printing the exact commands to run. Do not pass external workspace paths to worker subagents from the coordinator checkout.

## Hard Rules

- Do not call `developer`, `sdet`, or `reviewer` directly for normal work.
- Do not run multiple workflow engines in one checkout concurrently.
- Do not execute tickets or substantial workflow-maintenance changes in the coordinator checkout.
- Do not dispatch worker subagents against paths outside the active project root.
- Do not auto-stash, reset, checkout-discard, force push, or hide dirty work.
- Do not mark completion or create PRs unless lower-level completion and regression-gate rules are satisfied.
