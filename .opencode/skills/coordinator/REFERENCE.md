# Coordinator Reference

## Source Of Truth

- Workflow model defaults: `.opencode/workflow-models.json`
- TDD lifecycle and plan completion: `.opencode/skills/orchestrator/SKILL.md`
- Shared guardrails: `.opencode/skills/shared/constraints.md`
- Workspace policy: `docs/adr/0003-ticket-and-workflow-workspaces.md`

## Execution Model

The coordinator checkout schedules only. By default it launches one visible orchestrator TUI window for the target plan or ticket. The launched session manages ticket discovery, sequencing, state files, checkpoint commits, subagent dispatches, regression, completion, and PR post-steps.

```text
route arguments
-> targeted read
-> resolve default model from `.opencode/workflow-models.json`
-> launch `opencode run --interactive --command engineering/orchestrator ...`
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
- Confirm `opencode` and the launcher script are available. The launcher reports a manual command if Windows Terminal is unavailable.
- Let the launcher resolve the orchestrator model from `.opencode/workflow-models.json`. Use `--mode list-models --format json` and ask the user only when an override is requested or no configured default is available.

Launch with:

```text
node .opencode/scripts/launch-orchestrator-tui.mjs --target <id> --model <provider/model>
```

Omit `--model` for the configured orchestrator default.

The launcher keeps partial, blocked, escalated, or crashed sessions for debugging and cleans up only successful ticket/plan sessions.

## Queue Rules

Queue order:

1. Existing `in_progress` plan or ticket recorded in runtime state.
2. Plans with `status: ready` or `in_progress` and review/ready tickets.
3. Individual ready tickets only when they are not part of a plan-level run.
4. Workflow-maintenance changes requested by the user.
5. Blocked or ambiguous items are report-only unless the user asks to repair planning artifacts.

## Stop Conditions

Stop and report dirty worktrees, launcher failures, dirty work left by a launched run, or explicit user pause/inspection requests. Dependency and installer blocks follow `.opencode/skills/shared/constraints.md`.
