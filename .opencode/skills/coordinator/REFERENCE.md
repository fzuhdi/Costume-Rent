# Coordinator Reference

## Execution Model

Use the coordinator checkout for scheduling only. A single orchestrator TUI window is launched for the target plan or ticket by default. For plans, the launched orchestrator session handles ticket discovery, sequencing, regression, and plan completion internally.

Model priority defaults for workflow roles live in `.opencode/workflow-models.json`.

```text
route arguments
-> targeted read (plan or ticket)
-> launch `opencode run --interactive --command engineering/orchestrator ...` in a new window
-> pass the user-selected `--model provider/model`
-> report handoff details and keep later status checks read-only
```

Only one orchestrator TUI window runs at a time in the default single-checkout mode. The launched orchestrator session runs in the same checkout but in its own OpenCode CLI session, managing its own state files, checkpoint commits, subagent dispatches, and plan completion. Isolated worktrees are advanced mode only and follow `docs/adr/0003-ticket-and-workflow-workspaces.md`.

## Argument Routing

Route before discovery:

1. Empty args: ask the user for a plan/ticket target or explicit status scan. Do not scan plans/tickets first.
2. `PLAN-YYYYMMDD-*`: targeted plan mode. Read `docs/plans/{plan-id}.md`, then only tickets whose frontmatter `plan_id` equals the target.
3. `TICKET-YYYYMMDD-NNN`: targeted ticket mode. Read `docs/tickets/{ticket-id}.md` and the matching manifest entry.
4. Unknown or malformed args: ask one clarification question. Do not broad-scan to guess.

Targeted mode may read runtime state files to detect active or blocked runs, but it must not scan all plans/tickets unless the user chose a status scan.

For every executable launch, discover models dynamically with:

```text
node .opencode/scripts/launch-orchestrator-tui.mjs --mode list-models --format json
```

Ask the user to choose a model from that discovered list. Recommend the orchestrator default resolved from `.opencode/workflow-models.json`.

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

The launched orchestrator session handles internal ticket sequencing, dependency ordering, regression, and plan completion.

## Dependency And Installer Approval

The coordinator must not repair setup by installing packages or browsers on its own.

- If a run needs `node_modules`, browser caches, package installs, or dependency updates, ask the user before running any installer.
- Approval requests must include the package or tool, requested version when known, reason, affected manifest/lockfile or cache, exact command, and fallback if denied.
- In advanced isolated-worktree mode, prefer reusing, copying, or junctioning an existing dependency directory only when the relevant lockfile hash matches.
- If dependency manifests or lockfiles must change, pause concurrent ticket execution, ask approval, run the install once in a controlled workspace, and refresh the shared cache keyed by lockfile hash.

## Orchestrator TUI Launch

Launch `node .opencode/scripts/launch-orchestrator-tui.mjs --target <id> --model <provider/model>` after targeted validation.

Resolved workflow default priorities:

- `developer`: `opencode/minimax-m2.5-free` -> `opencode/big-pickle`
- `sdet`: `opencode/minimax-m2.5-free` -> `opencode/big-pickle`
- `orchestrator`: `opencode/big-pickle` -> `opencode/minimax-m2.5-free`
- `reviewer`: `opencode/big-pickle` -> `opencode/minimax-m2.5-free`

### Plan Target

```text
MODE: run-plan
PLAN_ID: {plan-id}
PLAN_FILE: docs/plans/{plan-id}.md
```

The launched orchestrator session:
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

The launched orchestrator session runs the full per-ticket TDD lifecycle (RED, GREEN, review) and stops at ticket-complete.

### Session Cleanup

- Each launch uses a unique OpenCode session title and a user-chosen model from the discovered list.
- If the target reaches `ticket-complete` or `plan-complete`, the launcher deletes that session with `opencode session delete <session-id>` after the TUI exits.
- If the run is partial, blocked, escalated, or crashes, the launcher preserves the session for debugging and prints the title or session id.

## Launch Rules

Before launching any lower-level run:

- Require a clean worktree.
- Confirm no runtime state indicates a different active run.
- Confirm the target plan or ticket still exists.
- Confirm `wt.exe`, `opencode`, and the launcher script are available.
- Confirm the chosen model still exists in `opencode models` output.
- Use the repository launcher instead of dispatching `task(subagent_type: "orchestrator")` directly from coordinator.

## Stop Conditions

Stop immediately and report if any of these occur:

- Dirty worktree before or after a lower-level run.
- Launcher cannot open the new orchestrator TUI window.
- The launched orchestrator session leaves the worktree dirty.
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
