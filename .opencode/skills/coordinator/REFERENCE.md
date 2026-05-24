# Coordinator Reference

## Source Of Truth

- Workflow model defaults: `.opencode/workflow-models.json`
- TDD lifecycle and plan completion: `.opencode/skills/orchestrator/SKILL.md`
- Shared guardrails: `.opencode/skills/shared/constraints.md`
- Workspace policy: `docs/adr/0003-ticket-and-workflow-workspaces.md`

## Execution Model

The coordinator checkout schedules only. By default, plan targets deterministically prepare up to three ready executable tracer tickets, each in its own git worktree and Docker Compose runtime slot, then dispatch one `orchestrator` task per prepared handoff. Ticket targets dispatch one `orchestrator` task in the active clean worktree. Each orchestrator task manages its own state files, checkpoint commits, worker subagent dispatches, ticket completion, and ticket branch output.

```text
route arguments
-> targeted read
-> for plans: prepare `node .opencode/scripts/launch-parallel-plan.mjs --target <plan-id> --parallel 3 --json`
-> dispatch each returned `dispatch.task` via task(subagent_type="orchestrator")
-> for tickets: dispatch one orchestrator task for the active clean worktree
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
- Load `.opencode/skills/model-selector/SKILL.md` and follow its workflow so the user can confirm or change models for all agent roles.
- Confirm no runtime state indicates a different active run.
- Confirm the target exists.
- Confirm Docker and the relevant prepare script are available for plan targets.
- Do not include secret env file contents in task prompts or summaries; pass only runtime env keys/values emitted by the prepare script.

Prepare plan targets with:

```text
node .opencode/scripts/launch-parallel-plan.mjs --target <plan-id> --parallel 3 --json
```

The prepare script creates or reuses `../Costume-Rent-workspaces/<plan-id>/<ticket-id>` worktrees, reserves slot 1-3 ports, starts `docker compose -p <ticket-project> -f docker-compose.dev.yml up -d backend frontend` unless `--no-start-runtime` is supplied, starts a default 60-minute ticket lease in `.opencode/state/ticket-leases.json`, writes durable handoff snapshots at `.opencode/state/ticket-handoffs/<ticket-id>.json`, and returns `dispatches[].task` objects. Override the lease with `--lease-minutes <n>` when needed. It selects only independent ready tickets: tickets with unmet `depends_on` prerequisites are skipped and reported until the prerequisite tickets are complete. It blocks on review tickets, malformed or cross-plan dependency declarations, dirty coordinator checkout, dirty reused worktrees, unsafe existing ticket leases, slot conflicts, or missing runtime setup.

Existing leases with `running`, `deadline_expired`, or `interrupted` status exclude that ticket from the current batch so later ready tickets can refill available slots. Use `--replace-lease` only after manual interrupt/inspection proves the prior task will not write late into the checkout.

For every successful non-dry-run dispatch, call the task tool with:

```text
subagent_type: orchestrator
description: dispatch.task.description
command: dispatch.task.command
prompt: dispatch.task.prompt
```

Do not rewrite the generated prompt. It is the handoff contract and includes `WORKTREE_ROOT`, `PLAN_ID`, `TICKET_ID`, runtime env keys, branch/base branch, lease deadline, and nested-worker root instructions.

Worker task payloads for nested roles should be generated deterministically with `.opencode/scripts/build-worker-task.mjs` to guarantee required schema keys (`subagent_type`, `description`, `prompt`) and required prompt markers (`WORKTREE_ROOT`, `TICKET_ID`, `TEST_CASE_ID`).

If a task appears stuck, do not wait indefinitely. Check leases with `node .opencode/scripts/ticket-lease.mjs status --json`; this is read-only and reports whether any persisted statuses would change. Persist expiry transitions only with `node .opencode/scripts/ticket-lease.mjs refresh --json`. A `deadline_expired` lease means manual interrupt may be needed for the active task wait. After interrupt, classify the checkout with `node .opencode/scripts/ticket-lease.mjs inspect --ticket <ticket-id> --json`; only reuse the worktree when inspection reports a clean retryable/adoptable state.

Stuck ticket recovery commands:

```text
node .opencode/scripts/ticket-lease.mjs status --json
node .opencode/scripts/ticket-lease.mjs refresh --json
node .opencode/scripts/ticket-lease.mjs interrupted --ticket <ticket-id> --json
node .opencode/scripts/ticket-lease.mjs inspect --ticket <ticket-id> --json
node .opencode/scripts/launch-parallel-plan.mjs --target <plan-id> --parallel 3 --json
```

Use `--replace-lease` on the final command only when inspection proves the same ticket checkout is safe to reuse. Without `--replace-lease`, unsafe leased tickets are skipped so other ready tickets can fill the batch.

For single-ticket targets, dispatch one `orchestrator` task from the active clean root with the same prompt shape: include `WORKTREE_ROOT`, `TICKET_ID`, optional `PLAN_ID`, branch/base branch when known, runtime env keys in scope, and the instruction to run all file/shell operations under `WORKTREE_ROOT` and pass it to nested worker prompts.

Task failures or blocked/partial orchestrator returns are reported as workflow blockers; the coordinator does not simulate the FSM.

## Queue Rules

Queue order:

1. Existing `in_progress` plan or ticket recorded in runtime state.
2. Plans with `status: ready` or `in_progress` and review/ready tickets.
3. Individual ready tickets only when they are not part of a plan-level run.
4. Workflow-maintenance changes requested by the user.
5. Blocked or ambiguous items are report-only unless the user asks to repair planning artifacts.

## Stop Conditions

Stop and report dirty worktrees, prepare/handoff failures, dirty work left by an orchestrator task, deadline-expired leases, or explicit user pause/inspection requests. Dependency and installer blocks follow `.opencode/skills/shared/constraints.md`.
