# Coordinator Reference

## Execution Model

Use the coordinator checkout for scheduling only. A single orchestrator subagent is dispatched for the target plan or ticket by default. For plans, the orchestrator subagent handles ticket discovery, sequencing, regression, and plan completion internally.

```text
route arguments
-> targeted read (plan or ticket)
-> dispatch task(subagent_type: "orchestrator") with MODE: run-plan or run-ticket
-> wait for OUTCOME: success, partial, or blocked
-> summarize aggregate status
```

Only one orchestrator subagent runs at a time in the default single-checkout mode. The orchestrator subagent runs in the same checkout but in its own agent context, managing its own state files, checkpoint commits, subagent dispatches, and plan completion. Isolated worktrees are advanced mode only and follow `docs/adr/0003-ticket-and-workflow-workspaces.md`.

## Argument Routing

Route before discovery:

1. Empty args: ask the user for a plan/ticket target or explicit status scan. Do not scan plans/tickets first.
2. `PLAN-YYYYMMDD-*`: targeted plan mode. Read `docs/plans/{plan-id}.md`, then only tickets whose frontmatter `plan_id` equals the target.
3. `TICKET-YYYYMMDD-NNN`: targeted ticket mode. Read `docs/tickets/{ticket-id}.md` and the matching manifest entry.
4. Unknown or malformed args: ask one clarification question. Do not broad-scan to guess.

Targeted mode may read runtime state files to detect active or blocked runs, but it must not scan all plans/tickets unless the user chose a status scan.

## Discovery Procedure

1. Check `git status --short --branch`.
2. If the worktree is dirty, stop before queueing executable work and report the dirty paths.
3. Read runtime state files if present.
4. For empty args, ask for a target or explicit status scan before any broad plan/ticket discovery.
5. For explicit targets, read only the target plan/ticket and directly related tickets/manifest entries.
6. For explicit status scans, read recent `.opencode/logs/*.md`, scan `docs/plans/*.md` and `docs/tickets/*.md`, group tickets by `plan_id` and status, and identify blocked/ready/in-progress work.

## Queue Rules

Queue order:

1. Resume an existing `in_progress` plan or ticket recorded in runtime state.
2. Plans with `status: ready` or `in_progress` and ready/review tickets.
3. Individual ready tickets only when they are not part of a plan-level run.
4. Workflow-maintenance changes requested by the user.
5. Blocked or ambiguous items are report-only unless the user asks to repair planning artifacts.

The orchestrator subagent handles internal ticket sequencing, dependency ordering, regression, and plan completion.

## Dependency And Installer Approval

The coordinator must not repair setup by installing packages or browsers on its own.

- If a run needs `node_modules`, browser caches, package installs, or dependency updates, ask the user before running any installer.
- Approval requests must include the package or tool, requested version when known, reason, affected manifest/lockfile or cache, exact command, and fallback if denied.
- In advanced isolated-worktree mode, prefer reusing, copying, or junctioning an existing dependency directory only when the relevant lockfile hash matches.
- If dependency manifests or lockfiles must change, pause concurrent ticket execution, ask approval, run the install once in a controlled workspace, and refresh the shared cache keyed by lockfile hash.

## Orchestrator Subagent Dispatch

Dispatch `task(subagent_type: "orchestrator")` with one of two modes.

### Plan Target

```text
MODE: run-plan
PLAN_ID: {plan-id}
PLAN_FILE: docs/plans/{plan-id}.md
```

The orchestrator subagent:
- Loads the plan and discovers all tickets with matching `plan_id`.
- Audits `review` tickets first via `reviewer MODE: ticket-audit`.
- Runs ready feature/bug tickets through full TDD lifecycle sequentially, ordered by priority and dependency.
- After all tickets complete, runs impacted-spec regression.
- If regression passes, finishes with plan-complete: update plan frontmatter, commit, push, and create PR.
- If regression fails, creates same-plan review bug tickets and runs them (up to `maxRegressionCycles: 3`).

### Ticket Target

```text
MODE: run-ticket
FEATURE: {feature-id}
TEST_CASE_ID: {test_case_id}
TICKET_ID: {ticket-id}
TICKET_FILE: docs/tickets/{ticket-id}.md
TICKET_TYPE: feature | bug
TICKET_ACCEPTANCE_CRITERION: {manifest criterion}
EXPECTED_OUTCOME: {manifest expected outcome}
TEST_INTERFACE: {project-configured test type}
RED_EXPECTATION: {frontmatter value}
GREEN_EXPECTATION: {frontmatter value}
```

The orchestrator subagent runs the full per-ticket TDD lifecycle (RED, GREEN, review) and stops at ticket-complete.

### Return Values

- `OUTCOME: success` — ticket or plan completed successfully.
- `OUTCOME: partial` — progress was made but not complete. The subagent left state files for resumption.
- `OUTCOME: blocked` — blocked or escalated. Report the block reason and stop.

## Launch Rules

Before launching any lower-level run:

- Require a clean worktree.
- Confirm no runtime state indicates a different active run.
- Confirm the target plan or ticket still exists.
- Confirm `task(subagent_type: "orchestrator")` is permitted in `.opencode/opencode.json`.
- Prefer the existing dispatch format already used by the repository.

## Stop Conditions

Stop immediately and report if any of these occur:

- Dirty worktree before or after a lower-level run.
- Orchestrator subagent returns `OUTCOME: blocked`.
- Orchestrator subagent leaves the worktree dirty.
- The user asks to pause, inspect, commit, push, or change strategy.

## Relationship To Other Workflow Rules

The coordinator is above the orchestrator but below the user. It schedules work; it does not redefine the ticket lifecycle.

Lower-level rules remain binding, including:

- one executable acceptance test case per ticket
- validation before implementation
- developer does not edit SDET-owned acceptance tests
- reviewer rejection is binding
- acceptance integrity gate must pass
- dependency and installer commands require explicit user approval
- plan-completion impacted regression must pass before completion or PR
