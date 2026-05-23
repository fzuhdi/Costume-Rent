# Coordinator Reference

## Source Of Truth

- Workflow model defaults: `.opencode/workflow-models.json`
- TDD lifecycle and plan completion: `.opencode/skills/orchestrator/SKILL.md`
- Shared guardrails: `.opencode/skills/shared/constraints.md`
- Workspace policy: `docs/adr/0003-ticket-and-workflow-workspaces.md`

## Execution Model

The coordinator checkout schedules only. By default, plan targets launch up to three visible orchestrator TUI windows for ready executable tracer tickets, each in its own git worktree and Docker Compose runtime slot. Ticket targets launch one visible orchestrator TUI window. Each launched ticket session manages its own state files, checkpoint commits, subagent dispatches, ticket completion, and ticket branch output.

```text
route arguments
-> targeted read
-> resolve default model from `.opencode/workflow-models.json`
-> for plans: launch `node .opencode/scripts/launch-parallel-plan.mjs --target <plan-id> --parallel 3`
-> for tickets: launch `opencode run --interactive --command engineering/orchestrator ...`
-> report handoff details
```

## Argument Routing

1. Empty args: ask the user for a plan/ticket target or explicit status scan before broad discovery.
2. `PLAN-YYYYMMDD-*`: read `docs/plans/{plan-id}.md` and tickets whose frontmatter `plan_id` equals the target.
3. `TICKET-YYYYMMDD-NNN`: read `docs/tickets/{ticket-id}.md` and the matching manifest entry.
4. Unknown or malformed args: ask one clarification question.

Targeted mode may read runtime state files to detect active or blocked runs. Explicit status scans may read recent `.opencode/logs/*.md`, scan `docs/plans/*.md` and `docs/tickets/*.md`, group tickets by `plan_id` and status, and identify blocked/ready/in-progress work.

## Launch Procedure

Before launch:

- Require a clean worktree.
- Confirm no runtime state indicates a different active run.
- Confirm the target exists.
- Confirm `opencode`, Docker, and the relevant launcher script are available. Launchers report manual commands if Windows Terminal is unavailable.
- Let the launcher resolve the orchestrator model from `.opencode/workflow-models.json`. Use `--mode list-models --format json` and ask the user only when an override is requested or no configured default is available.

Launch plan targets with:

```text
node .opencode/scripts/launch-parallel-plan.mjs --target <plan-id> --parallel 3
```

Launch ticket targets with:

```text
node .opencode/scripts/launch-orchestrator-tui.mjs --target <id> --model <provider/model>
```

Omit `--model` for the configured orchestrator default.

The parallel plan launcher creates or reuses `../Costume-Rent-workspaces/<plan-id>/<ticket-id>` worktrees, reserves slot 1-3 ports, starts `docker compose -p <ticket-project> -f docker-compose.dev.yml up -d backend frontend`, then launches one orchestrator TUI per ticket. It launches only independent ready tickets: tickets with unmet `depends_on` prerequisites are skipped and reported until the prerequisite tickets are complete. It blocks on review tickets, malformed or cross-plan dependency declarations, dirty coordinator checkout, dirty reused worktrees, slot conflicts, missing runtime setup, or launch failures.

Ticket launchers keep partial, blocked, escalated, or crashed sessions for debugging and clean up only successful ticket sessions.

## Queue Rules

Queue order:

1. Existing `in_progress` plan or ticket recorded in runtime state.
2. Plans with `status: ready` or `in_progress` and review/ready tickets.
3. Individual ready tickets only when they are not part of a plan-level run.
4. Workflow-maintenance changes requested by the user.
5. Blocked or ambiguous items are report-only unless the user asks to repair planning artifacts.

## Stop Conditions

Stop and report dirty worktrees, launcher failures, dirty work left by a launched run, or explicit user pause/inspection requests. Dependency and installer blocks follow `.opencode/skills/shared/constraints.md`.
