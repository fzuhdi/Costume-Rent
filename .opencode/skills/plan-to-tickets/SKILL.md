---
name: plan-to-tickets
description: Convert PRDs, bug reports, ask-me output, or implementation plans into Agile plan files and TDD-ready backlog tickets for the orchestrator.
---

# Plan To Tickets

Use this skill when the user runs `/plan-to-tickets` or asks to turn a PRD, ask-me output, feature request, bug report, or implementation plan into backlog tickets.

This skill is planning-only. It creates or repairs plan/ticket files; it does not invoke `/engineering/orchestrator`, `developer`, `sdet`, or `reviewer`.

## Agile TDD Model

Use one backlog:

```text
Plan / Epic
  -> Ticket / Backlog Item
      -> type: feature | bug | chore | spike
      -> exactly one acceptance criterion when executable
      -> explicit expected outcome
      -> explicit RED and GREEN expectations
```

Only mapped `feature` and `bug` tickets with `status: ready` are executable. `chore` and `spike` stay as draft backlog records until converted into mapped feature/bug tickets.

## Inputs

```text
PLAN_FILE: {optional path}
PLAN_ID: {optional stable id}
RAW_ARGUMENTS: {original command arguments}
```

If the user asks to repair ambiguous blocked tickets, scan existing tickets for the requested plan and update only matching `status: blocked` tickets. Do not overwrite `in_progress` or `complete` tickets.

If `PLAN_FILE` is missing and no source is obvious, ask one short question and stop.

## Output Locations

- Plan summary: `docs/plans/{PLAN_ID}.md`
- Tickets: `docs/tickets/{TICKET_ID}.md`

Create directories if missing. New ticket IDs use the next available sequence for today: `TICKET-YYYYMMDD-001`.

Do not overwrite existing ticket files except when explicitly repairing a blocked ambiguous ticket for the same plan and same criterion. Preserve the existing ticket ID during repair and set `status: review`.

## Status Enums

Ticket status: `draft | review | ready | in_progress | blocked | complete`.

Plan status: `draft | ready | in_progress | blocked | complete`.

Use `status: ready` only when a `feature` or `bug` ticket has all required TDD fields and is independently executable. Use `status: review` for repaired ambiguous tickets that need reviewer audit before execution. Use `status: draft` for unclear, dependent, unmapped, chore, or spike work.

## Ready Ticket Requirements

A ready executable ticket must have:

- exactly one acceptance criterion
- concrete `feature` and `slice_id`
- `expected_outcome`
- `test_interface: e2e | api`
- `red_expectation`
- `green_expectation`
- no prerequisite ticket dependency
- no conflict with `docs/ACCEPTANCE_CRITERIA.md`

If any required field is missing, keep the ticket `draft` with open questions. Do not invent product decisions.

## Feature And Slice Mapping

Before writing tickets:

1. Run or rely on `.opencode/scripts/build-manifest.mjs` if `.opencode/state/feature-manifest.json` is stale or missing.
2. Read `docs/ACCEPTANCE_CRITERIA.md` and `.opencode/state/feature-manifest.json`.
3. Map each executable ticket to the nearest existing `feature` and `slice_id`.

If no slice matches cleanly, set `status: draft`, `slice_id: TBD`, and include the missing AC/slice recommendation in `## Open Questions`.

If a source requirement conflicts with `docs/ACCEPTANCE_CRITERIA.md`, do not choose a winner silently. Create or repair the ticket as `status: review` or `status: draft` with the conflict called out.

## Plan File Template

```markdown
---
id: PLAN-YYYYMMDD-short-title
status: ready
source_plan: docs/plans/source.md
---

# {plan title}

## Outcome
{business or product outcome}

## Tickets
- TICKET-YYYYMMDD-001 - ready - feature - {title}
- TICKET-YYYYMMDD-002 - draft - chore - {title}

## Status Summary
- draft: N
- review: N
- ready: N
- in_progress: 0
- blocked: 0
- complete: 0

## Execution
`/engineering/orchestrator PLAN-YYYYMMDD-short-title`
```

Plan status is `ready` when at least one executable ticket is ready or one repaired ticket awaits review and there are no unresolved plan-level questions that block all work. Otherwise use `draft`.

## Ticket File Template

```markdown
---
id: TICKET-YYYYMMDD-001
plan_id: PLAN-YYYYMMDD-short-title
type: feature
status: ready
feature: CATALOGUE
slice_id: AC-004-001
priority: 1
source_plan: docs/plans/example.md
test_file: test/specs/catalogue.spec.js
expected_outcome: User sees the new visible behavior.
test_interface: e2e
red_expectation: The acceptance test fails because the behavior is missing.
green_expectation: The same acceptance test passes after the minimal implementation.
---

# {short ticket title}

## Expected Outcome
{one sentence describing the visible user/system outcome}

## Acceptance Criterion
- {single observable criterion for this tracer ticket}

## Public Test Interface
`e2e` or `api`, with one sentence explaining why this is the highest useful public interface.

## RED Expectation
{the specific expected failing behavior before implementation}

## GREEN Expectation
{the specific passing behavior after implementation}

## Smallest End-To-End Path
1. {entry point}
2. {minimal backend/frontend/data path}
3. {observable result}

## Definition Of Ready
- Feature and slice are mapped.
- Exactly one acceptance criterion is present.
- Expected outcome, public test interface, RED expectation, and GREEN expectation are present.
- Deferred work is explicit.
- No prerequisite ticket dependency remains.

## Definition Of Done
- SDET RED test exists and includes `slice_id`.
- RED failed for the expected reason or already-green coverage was reviewer-approved.
- GREEN passes the same recorded test.
- Final reviewer audit approved scope and test integrity.

## Targeted Test
`cd test && npx playwright test --grep "{slice_id}"`

## Deferred Work
- {sibling behavior not included in this ticket}

## Open Questions
- none

## Orchestrator Pickup
`/engineering/orchestrator TICKET-YYYYMMDD-001`
```

For `type: bug`, also include:

```markdown
## Bug Details
- Expected: {expected behavior}
- Actual: {actual behavior}
- Repro: {minimal reproduction path}
```

## Ambiguous Ticket Repair

When repairing tickets blocked by reviewer as `ticket-ambiguous`:

1. Preserve the existing ticket ID and file path.
2. Update the same ticket with clarified required fields.
3. Set `status: review`, not `ready`.
4. Keep `in_progress` and `complete` tickets unchanged and report them as protected.
5. Update the plan status summary.

The orchestrator reviewer must later return `ticket-ready` before the ticket can become `ready`.

## Final Report

End with:

```text
OUTCOME: success | partial | blocked
PLAN_ID: {plan-id}
PLAN_FILE: docs/plans/{plan-id}.md
SOURCE_PLAN: {path or inline}
READY_TICKETS: {count}
REVIEW_TICKETS: {count}
DRAFT_TICKETS: {count}

TICKETS_CREATED:
- TICKET-... - ready - feature - {title}

TICKETS_REPAIRED:
- TICKET-... - review - {title}

TICKETS_EXISTING_OR_PROTECTED:
- TICKET-... - {reason}

NEXT_COMMAND:
/engineering/orchestrator {PLAN_ID}
```

If no ready or review tickets exist, set `OUTCOME: partial` and explain which decisions are needed before orchestration.
