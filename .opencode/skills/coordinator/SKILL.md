---
name: coordinator
description: Coordinates multiple existing workflow runs without replacing the lower-level workflow engine. Use when the user asks to run/resume multiple plans, continue ready tickets, coordinate workflow maintenance, or batch-check workflow status.
---

# Coordinator

## Quick Start

Use this skill to sequence workflow runs safely. The coordinator schedules and reports; it does not implement product code, write acceptance tests, audit tickets, or bypass the existing workflow engine.

Default execution uses the coordinator checkout for scheduling and isolated workspaces for executable tickets or substantial workflow-maintenance changes:

```text
discover work -> provision workspace -> run one item -> wait -> summarize
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

Do not use this skill for one straightforward ticket or one explicit plan run; use the existing workflow engine directly.

## Responsibility

The coordinator owns:

- queueing and sequencing
- branch/workspace safety checks
- aggregate status reporting
- selecting the next safest workflow command

The existing workflow engine and worker agents still own execution, validation, implementation, and audit.

## Workflow

1. Check `git status --short --branch`.
2. Stop if the coordinator checkout is dirty before executable work.
3. Inspect runtime state, recent logs, plans, and tickets.
4. Build a queue of product tickets/plans or workflow-maintenance changes.
5. Provision or reuse an isolated workspace for each executable item.
6. Launch or recommend one existing workflow command or workflow-engineer handoff at a time.
7. Stop on blocked/escalated state, dirty work, branch conflict, or user input.
8. Report aggregate status and the next safest command.

## Launch Examples

Use the repository's current documented workflow command. Current examples:

```text
/engineering/orchestrator PLAN-YYYYMMDD-name
/engineering/orchestrator TICKET-YYYYMMDD-001
```

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

## Hard Rules

- Do not call `developer`, `sdet`, or `reviewer` directly for normal work.
- Do not run multiple workflow engines in one checkout concurrently.
- Do not execute tickets or substantial workflow-maintenance changes in the coordinator checkout.
- Do not auto-stash, reset, checkout-discard, force push, or hide dirty work.
- Do not mark completion or create PRs unless lower-level completion and regression-gate rules are satisfied.
