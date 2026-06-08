---
name: create-tickets
description: Convert PRDs, bug reports, ask-me output, feature requests, or implementation plans into staged local workflow plan files and tickets. Use when the user runs /create-tickets or asks to create tickets, plan tracer bullets, or turn requirements into executable workflow tickets.
---

# Create Tickets

Use this skill when the user runs `/create-tickets` or asks to turn a PRD, ask-me output, feature request, bug report, or implementation plan into backlog tickets.

This skill is planning-only. It creates or repairs plan/ticket files; it does not invoke `/engineering/orchestrator`, `developer`, `sdet`, `workflow-engineer`, or `reviewer`.

## Local Workflow Model

Use one backlog with explicit stage and quality policy:

```text
Product flow:
Design UI -> Integrate Backend -> Deployment

Internal flow:
Workflow Maintenance
```

Ticket frontmatter must include:

```yaml
workflow_stage: design-ui | integrate-backend | deployment | workflow-maintenance
quality_policy: exploratory | light-checks | strict-tdd
```

Keep user-facing product docs focused on `Design UI -> Integrate Backend -> Deployment`. `workflow-maintenance` is internal-only for `.opencode`, `.codex`, workflow docs, scripts, skills, runner changes, and workflow test helpers.

Strict TDD is a quality policy, not a stage. Only tickets with `quality_policy: strict-tdd` need a `test_case_id`, `red_expectation`, and `green_expectation`.

## Stage And Policy Selection

- Workflow/config/script/skill/doc refactors: `workflow_stage: workflow-maintenance`, `quality_policy: light-checks`.
- UI layout, visual exploration, state matrix, or mock-first work: `workflow_stage: design-ui`, `quality_policy: exploratory`.
- UI/API/backend/data wiring after behavior is clear: `workflow_stage: integrate-backend`, `quality_policy: light-checks`.
- Bugs, API contracts, clear acceptance rules, and integration tracer bullets: `workflow_stage: integrate-backend`, `quality_policy: strict-tdd`.
- Build, env, release, deployment, smoke, and runtime-readiness work: `workflow_stage: deployment`, `quality_policy: light-checks`.

Legacy `workflow_mode` remains readable when repairing existing files:

- `ui-tracer` means `design-ui` + `exploratory`.
- `light-implementation` means `integrate-backend` + `light-checks`.
- `strict-tdd` means `integrate-backend` + `strict-tdd`.

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

Use `status: ready` when the ticket has a valid stage, quality policy, clear scope, and either no unmet prerequisite or a `depends_on` list that the runner can defer until prerequisites complete. Use `status: review` for repaired ambiguous tickets that need reviewer audit before execution. Use `status: draft` for unclear, unmapped strict-TDD work, or tickets whose product/workflow decision is still missing.

## Ready Ticket Requirements

Every ready ticket must have:

- `workflow_stage`
- `quality_policy`
- `depends_on` as an inline same-plan ticket-id list, such as `depends_on: []`
- no conflict with source docs or `docs/acceptance/*.md`

Strict-TDD ready tickets additionally require:

- `type: feature | bug`
- exactly one `test_case_id`
- `red_expectation`
- `green_expectation`
- a Test Case Manifest mapping for the selected `test_case_id`

Non-strict ready tickets must not use placeholder `test_case_id: TBD`, `red_expectation`, or `green_expectation`.

## Test Case Mapping

Before writing strict-TDD tickets:

1. Run or rely on `.opencode/scripts/build-test-case-manifest.mjs` if `.opencode/state/test-case-manifest.json` is stale or missing.
2. Read `docs/acceptance/*.md` and `.opencode/state/test-case-manifest.json`.
3. Map the strict-TDD ticket to exactly one existing `test_case_id`, or create a clear new acceptance section before ticketing.

If no test case matches cleanly for strict-TDD work, set `status: draft` and include the missing test case recommendation in `## Open Questions`.

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
{business, product, or workflow outcome}

## Tickets
- TICKET-YYYYMMDD-001 - ready - feature - {title}
- TICKET-YYYYMMDD-002 - ready - chore - {title}

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

Plan status is `ready` when at least one ticket is ready or one repaired ticket awaits review and there are no unresolved plan-level questions that block all work. Otherwise use `draft`.

## Strict-TDD Ticket Template

```markdown
---
id: TICKET-YYYYMMDD-001
plan_id: PLAN-YYYYMMDD-short-title
type: feature
status: ready
workflow_stage: integrate-backend
quality_policy: strict-tdd
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
- `depends_on` is empty, or prerequisites are listed for runner deferral until complete.

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

## Non-Strict Ticket Template

```markdown
---
id: TICKET-YYYYMMDD-002
plan_id: PLAN-YYYYMMDD-short-title
type: chore
status: ready
workflow_stage: workflow-maintenance
quality_policy: light-checks
priority: 2
depends_on: [TICKET-YYYYMMDD-001]
source_plan: docs/plans/example.md
---

# {short ticket title}

## Scope
{smallest coherent change}

## Validation
- {script syntax, focused test, doctor, smoke check, screenshot, or review evidence}

## Definition Of Done
- Intended changes are implemented.
- Validation above passes or any setup block is explicit.
- No out-of-scope files are changed.

## Artifacts
- {logs, screenshots, generated manifest, or none}

## Deferred Work
- {follow-up not included here}

## Open Questions
- none

## Orchestrator Pickup
`/engineering/orchestrator TICKET-YYYYMMDD-002`
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
- TICKET-... - ready - feature - {workflow_stage}/{quality_policy} - {title}

TICKETS_REPAIRED:
- TICKET-... - review - {title}

TICKETS_EXISTING_OR_PROTECTED:
- TICKET-... - {reason}

NEXT_COMMAND:
/engineering/orchestrator {PLAN_ID}
```

If no ready or review tickets exist, set `OUTCOME: partial` and explain which decisions are needed before orchestration.
