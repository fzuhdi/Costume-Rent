---
id: PLAN-20260528-local-stage-workflow-refactor
status: ready
source_plan: inline:user-chat-2026-05-28
---

# Local Stage-Based Workflow Refactor

## Outcome
Refactor local workflow tracking around the remembered product flow `Design UI -> Integrate Backend -> Deployment`, while keeping strict TDD as a quality policy and preserving deterministic local runner behavior.

## Create-Tickets Test Finding
Invoking the current `create-tickets` skill against this plan exposes two gaps:

- The current skill is still strict-TDD biased and can only make runner-ready tickets when a `feature` or `bug` maps to exactly one `test_case_id`.
- The proposed stage model covers product delivery work, but this refactor itself is workflow-maintenance work and does not fit cleanly into `design-ui`, `integrate-backend`, or `deployment`.

These tickets are workflow-maintenance backlog records, not strict-TDD product tickets.

## Tickets
- TICKET-20260528-001 - ready - chore - Normalize Workflow Schema To Stages And Quality Policies
- TICKET-20260528-002 - ready - chore - Update Create-Tickets And Run-Plan Skill UX
- TICKET-20260528-003 - ready - chore - Refactor Runner Normalization And Policy Dispatch
- TICKET-20260528-004 - ready - chore - Define Local Completion Gates For Non-Strict Work
- TICKET-20260528-005 - ready - chore - Add Workflow Fixtures, Validation, And Docs

## Status Summary
- draft: 0
- review: 0
- ready: 5
- in_progress: 0
- blocked: 0
- complete: 0

## Execution
`/engineering/orchestrator PLAN-20260528-local-stage-workflow-refactor`

## Open Questions
- none
