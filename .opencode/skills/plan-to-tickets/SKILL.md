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

Use `status: ready` only when a `feature` or `bug` ticket has all required TDD fields and is independently executable. Use `status: review` for repaired ambiguous tickets that need reviewer audit before execution. Use `status: draft` for unclear, dependent, unmapped, chore, spike, or work with unmet prerequisite tickets.

## Ready Ticket Requirements

A ready executable ticket must have:

- exactly one `test_case_id`
- `red_expectation`
- `green_expectation`
- `depends_on` as a same-plan ticket-id list; it must be empty for independently executable ready tickets, or every listed ticket must already be `complete`
- no conflict with `docs/acceptance/*.md`

If any required field is missing, keep the ticket `draft` with open questions. Do not invent product decisions.

## Test Case Mapping

Before writing tickets:

1. Run or rely on `.opencode/scripts/build-test-case-manifest.mjs` if `.opencode/state/test-case-manifest.json` is stale or missing.
2. Read `docs/acceptance/*.md` and `.opencode/state/test-case-manifest.json`.
3. Map each executable ticket to exactly one existing `test_case_id`, or create a clear new acceptance section before ticketing.

If no test case matches cleanly, set `status: draft`, `test_case_id: TBD`, and include the missing test case recommendation in `## Open Questions`.

If a source requirement conflicts with `docs/acceptance/*.md`, do not choose a winner silently. Create or repair the ticket as `status: review` or `status: draft` with the conflict called out.

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
test_case_id: FEATURE-001
priority: 1
depends_on: []
source_plan: docs/plans/example.md
red_expectation: The acceptance test fails because the behavior is missing.
green_expectation: The same acceptance test passes after the minimal implementation.
---

# {short ticket title}

## Acceptance Mapping
Criterion, expected outcome, test type, and spec files resolve from `.opencode/state/test-case-manifest.json` by `test_case_id`.

## RED Expectation
{the specific expected failing behavior before implementation}

## GREEN Expectation
{the specific passing behavior after implementation}

## Smallest End-To-End Path
1. {entry point}
2. {minimal app/data path}
3. {observable result}

## Definition Of Ready
- Exactly one `test_case_id` maps to the Test Case Manifest.
- RED expectation and GREEN expectation are present.
- Deferred work is explicit.
- `depends_on` is empty, or every prerequisite ticket listed there is already complete.

## Definition Of Done
- SDET RED test exists and includes `test_case_id`.
- RED failed for the expected reason or already-green coverage was reviewer-approved.
- GREEN passes the same recorded test.
- Final reviewer audit approved scope and test integrity.

## Targeted Test
Use the project-configured `commands.test_case` template from `.opencode/project.json` with the manifest entry for `test_case_id`.

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
