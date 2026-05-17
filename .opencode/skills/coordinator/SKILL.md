---
name: coordinator
description: Coordinates multiple existing workflow runs without replacing the lower-level workflow engine. Use when the user asks to run/resume multiple plans, continue ready tickets, coordinate workflow maintenance, or batch-check workflow status.
---

# Coordinator

## Quick Start

Use this skill to sequence workflow runs safely. The coordinator schedules and reports; it does not implement product code, write acceptance tests, audit tickets, or bypass the existing workflow engine.

Default execution is argument-first. Do not scan the whole backlog until the user asks for a status scan or omits arguments and then chooses a scan.

```text
target argument -> targeted read -> dispatch task(subagent_type: "orchestrator") -> summarize
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

The orchestrator subagent (`task(subagent_type: "orchestrator")`) owns execution, validation, implementation, audit, regression, and plan completion.

## Workflow

1. Check `git status --short --branch`.
2. Stop if the checkout is dirty before executable work.
3. Route arguments before discovery:
   - Empty args: ask which plan/ticket to run, or whether to do a status scan.
   - `PLAN-YYYYMMDD-*`: read only that plan and tickets with matching `plan_id`, then dispatch one orchestrator subagent with `MODE: run-plan`.
   - `TICKET-YYYYMMDD-NNN`: read only that ticket and its manifest entry, then dispatch one orchestrator subagent with `MODE: run-ticket`.
4. Wait for the orchestrator subagent to return.
5. Report aggregate status and the next safest command.

## Launch Examples

```text
/coordinator
/coordinator PLAN-YYYYMMDD-name
/coordinator TICKET-YYYYMMDD-001
```

## Orchestrator Subagent Dispatch

Dispatch a single `task(subagent_type: "orchestrator")` per target.

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

The orchestrator subagent loads the orchestrator skill and runs the full TDD FSM. It returns `OUTCOME: success`, `OUTCOME: partial`, or `OUTCOME: blocked`.

## Status Report

Include:

- Current branch and worktree cleanliness.
- Active runtime plan/ticket if any.
- Active workflow-change id if any.
- Current or last orchestrator subagent run.
- Its result: success / partial / blocked
- Blocked reasons if applicable.
- Next safest command.

## Hard Rules

- Do not call `developer`, `sdet`, `reviewer`, or `explore` directly. Only use `task(subagent_type: "orchestrator")`.
- Do not dispatch subagents against absolute paths outside the active project root.
- Do not run tickets concurrently inside the same OpenCode session.
- Do not auto-stash, reset, checkout-discard, force push, or hide dirty work.
- Do not mark completion or create PRs unless lower-level completion and regression-gate rules are satisfied.
