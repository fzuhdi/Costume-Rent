---
name: plan-to-tickets
description: Convert a PRD, bug report, or implementation plan into an Agile-style plan plus independent tracer-bullet tickets that the orchestrator can execute by ticket or plan.
---

# Plan To Tickets

Use this skill when the user runs `/planning/plan-to-tickets` or asks to turn a PRD, ask-me output, feature request, bug report, or implementation plan into orchestrator-ready backlog tickets.

This skill is planning-only. It creates plan and ticket files; it does not invoke `/engineering/orchestrator`, `developer`, `sdet`, or `reviewer`.

---

## Agile Model

Use one backlog. Do not split features and bugs into separate workflow concepts.

```text
Plan / Epic
  -> Ticket / Backlog Item
      -> type: feature | bug | chore | spike
      -> one tracer-bullet slice
      -> acceptance criteria
      -> definition of done
```

The orchestrator executes tickets. It does not execute nested subtasks inside a giant ticket.

---

## Inputs

The command may provide:

```text
PLAN_FILE: {path}
PLAN_ID: {optional stable id}
RAW_ARGUMENTS: {original command arguments}
```

If `PLAN_FILE` is missing, infer the most likely plan path from the user's message. If no plan path is clear, ask one short question for the path and stop.

`/ask-me` output is allowed input, but not required. Treat any PRD, sketch, note, bug report, or plan as acceptable source material.

---

## Output Locations

Write or update the parent plan summary:

```text
docs/plans/{PLAN_ID}.md
```

Write executable tickets to:

```text
docs/tickets/{TICKET_ID}.md
```

Create `docs/plans/` and `docs/tickets/` if needed.

Ticket IDs use the next available sequence for the current date:

```text
TICKET-YYYYMMDD-001
TICKET-YYYYMMDD-002
```

Do not overwrite existing ticket files. If a ticket already exists for the same plan and same acceptance criterion, leave it unchanged and report it as existing.

---

## Plan ID Rule

Every ticket from one source plan must share the same `plan_id`.

If the caller supplies `PLAN_ID`, use it. Otherwise derive one from the plan filename or title:

```text
PLAN-YYYYMMDD-{short-kebab-title}
```

The orchestrator uses `plan_id` to execute all ready tickets from one plan.

---

## Ticket Rule

One ticket equals one executable tracer bullet.

Each ticket must contain exactly one observable acceptance criterion and one smallest end-to-end path. Do not create broad tickets such as "build catalogue module" or "add all settings screens".

Good ticket shape:

- One user/system outcome
- One `type`: `feature`, `bug`, `chore`, or `spike`
- One `feature`
- One `slice_id`
- One targeted test expectation or spike output
- Deferred sibling work listed explicitly

If a requirement is too vague, create a `status: draft` ticket with the open questions. Do not invent product decisions.

---

## Ticket Types

| Type | Use When | Done Means |
|---|---|---|
| `feature` | New user-visible behavior | Acceptance criterion passes through the real system. |
| `bug` | Existing expected behavior is broken | Repro fails before the fix, passes after the fix, and regression test exists. |
| `chore` | Maintenance or internal change | Concrete operational or code-health outcome is complete. |
| `spike` | Uncertainty reduction | Decision, notes, prototype, or follow-up tickets are produced. |

`bug` tickets still use the same orchestrator path as feature tickets. They just include expected result, actual result, and reproduction path.

---

## Feature And Slice Mapping

Before writing tickets:

1. Run or rely on `.opencode/scripts/build-manifest.mjs` if `.opencode/state/feature-manifest.json` is stale or missing.
2. Read `docs/ACCEPTANCE_CRITERIA.md` and `.opencode/state/feature-manifest.json`.
3. Map each ticket to the nearest existing `feature` and `slice_id` where possible.

If no existing acceptance-criteria slice matches cleanly, still create the ticket but set:

```yaml
status: draft
slice_id: TBD
```

and include the missing AC/slice recommendation in `## Open Questions`.

---

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
- TICKET-YYYYMMDD-002 - draft - bug - {title}

## Execution
`/engineering/orchestrator PLAN-YYYYMMDD-short-title`
```

---

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
---

# {short ticket title}

## User Outcome
{one sentence describing the user/system-visible outcome}

## Acceptance Criteria
- {single observable criterion for this tracer ticket}

## Smallest End-To-End Path
1. {entry point}
2. {minimal backend/frontend/data path}
3. {observable result}

## Definition Of Ready
- Feature and slice are mapped.
- Acceptance criterion is testable.
- Deferred work is explicit.

## Definition Of Done
- Targeted test exists and includes `slice_id`.
- Targeted test passes.
- No deferred sibling scope was implemented.

## Targeted Test
`cd test && npx playwright test --grep "{slice_id}"`

## Deferred Work
- {sibling behavior not included in this ticket}

## Open Questions
- none

## Orchestrator Pickup
`/engineering/orchestrator TICKET-YYYYMMDD-001`
```

For `type: bug`, include:

```markdown
## Bug Details
- Expected: {expected behavior}
- Actual: {actual behavior}
- Repro: {minimal reproduction path}
```

Use `status: ready` only when the ticket has a concrete `feature`, `slice_id`, and acceptance criterion. Use `status: draft` for unclear or unmapped work.

---

## Final Report

End with:

```text
OUTCOME: success | partial | blocked
PLAN_ID: {plan-id}
PLAN_FILE: docs/plans/{plan-id}.md
SOURCE_PLAN: {path}
READY_TICKETS: {count}
DRAFT_TICKETS: {count}

TICKETS_CREATED:
- TICKET-... - ready - feature - {title}

TICKETS_EXISTING:
- TICKET-... - {reason}

NEXT_COMMAND:
/engineering/orchestrator {PLAN_ID}
```

If no ready tickets were created, set `OUTCOME: partial` and explain which decisions are needed before orchestration.
