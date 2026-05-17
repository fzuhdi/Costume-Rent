---
name: coordinator
description: Coordinates multiple existing workflow runs without replacing the lower-level workflow engine. Use when the user asks to run/resume multiple plans, continue ready tickets, coordinate workflow maintenance, or batch-check workflow status.
---

# Coordinator

## Quick Start

Use this skill to sequence workflow runs safely. The coordinator schedules and reports; it does not implement product code, write acceptance tests, audit tickets, or bypass the existing workflow engine.

Default execution is argument-first. Do not scan the whole backlog until the user asks for a status scan or omits arguments and then chooses a scan.

```text
target argument -> targeted read -> launch orchestrator TUI window -> summarize handoff
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

Use explicit arguments to avoid broad discovery.

## Responsibility

The coordinator owns:

- argument routing
- branch/worktree cleanliness checks
- aggregate status reporting
- selecting the next safest workflow command

The launched orchestrator TUI session owns execution, validation, implementation, audit, regression, and plan completion.

Workflow model priority defaults live in `.opencode/workflow-models.json`.

## Workflow

1. Check `git status --short --branch`.
2. Stop if the checkout is dirty before executable work.
3. Route arguments before discovery:
   - Empty args: ask which plan/ticket to run, or whether to do a status scan.
    - `PLAN-YYYYMMDD-*`: read only that plan and tickets with matching `plan_id`, then launch one new orchestrator TUI window for that plan.
    - `TICKET-YYYYMMDD-NNN`: read only that ticket and its manifest entry, then launch one new orchestrator TUI window for that ticket.
4. Before every executable launch, run `node .opencode/scripts/launch-orchestrator-tui.mjs --mode list-models --format json`.
5. Ask the user which discovered model to use for this run. Recommend the resolved orchestrator default from `.opencode/workflow-models.json`.
6. Launch the new orchestrator TUI window with the chosen model.
7. Report the launched window title, target, chosen model, and exact command handoff.
8. Recommend the next safest follow-up command.

## Launch Examples

```text
/coordinator
/coordinator PLAN-YYYYMMDD-name
/coordinator TICKET-YYYYMMDD-001
```

## Orchestrator TUI Launch

Launch a single orchestrator TUI window per target using `node .opencode/scripts/launch-orchestrator-tui.mjs --target <id> --model <provider/model>`.

Before asking, discover models dynamically:

```text
node .opencode/scripts/launch-orchestrator-tui.mjs --mode list-models --format json
```

Recommend the resolved orchestrator default and expose the role defaults:

- `developer`: `opencode/minimax-m2.5-free` -> `opencode/big-pickle`
- `sdet`: `opencode/minimax-m2.5-free` -> `opencode/big-pickle`
- `orchestrator`: `opencode/big-pickle` -> `opencode/minimax-m2.5-free`
- `reviewer`: `opencode/big-pickle` -> `opencode/minimax-m2.5-free`

For explicit plan targets (`PLAN-YYYYMMDD-*`):

```text
MODE: run-plan
PLAN_ID: {plan-id}
PLAN_FILE: docs/plans/{plan-id}.md
```

For explicit ticket targets (`TICKET-YYYYMMDD-NNN`):

```text
MODE: run-ticket
FEATURE: {feature-id from manifest}
TEST_CASE_ID: {test_case_id from ticket frontmatter}
TICKET_ID: {ticket-id}
TICKET_FILE: docs/tickets/{ticket-id}.md
TICKET_TYPE: feature | bug
TICKET_ACCEPTANCE_CRITERION: {manifest criterion}
EXPECTED_OUTCOME: {manifest expected outcome}
TEST_INTERFACE: {project-configured test type}
RED_EXPECTATION: {frontmatter value}
GREEN_EXPECTATION: {frontmatter value}
```

The launched TUI runs `opencode run --interactive --model <chosen-model> --command engineering/orchestrator` with a unique session title. After exit, the launcher deletes the matching OpenCode session only if the target reached `ticket-complete` or `plan-complete`; partial or blocked runs keep the session for debugging.

## Status Report

Include:

- Current branch and worktree cleanliness.
- Active runtime plan/ticket if any.
- Active workflow-change id if any.
- Current or last orchestrator TUI launch.
- Its handoff target, window title, chosen model, resolved role defaults, and any known completion or block state.
- Blocked reasons if applicable.
- Next safest command.

## Hard Rules

- Do not call `developer`, `sdet`, `reviewer`, or `explore` directly.
- Do not dispatch subagents against absolute paths outside the active project root.
- Do not launch more than one orchestrator TUI window at a time for the same checkout.
- Do not auto-stash, reset, checkout-discard, force push, or hide dirty work.
- Do not fall back to manually executing the orchestrator FSM in the coordinator session if the TUI launch fails.
- Do not mark completion or create PRs unless lower-level completion and regression-gate rules are satisfied.
