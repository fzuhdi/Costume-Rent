---
name: create-tickets
description: Creates durable staged plan and ticket docs from PRDs, feature requests, bug reports, or implementation notes. Use when the user asks Codex to create tickets, create a tracer bullet, split work into workflow tickets, or prepare a plan for run-plan.
---

# Create Tickets

Use this as the Codex entry point for creating runnable workflow inputs. It is planning-only: create or repair docs, then hand off execution to `run-plan` or `costume-tdd`.

## Workflow

1. Read `.opencode/project.json`, `.opencode/skills/create-tickets/SKILL.md`, and `.opencode/state/test-case-manifest.json`.
2. If the manifest is missing or stale, run:
   ```powershell
   node .opencode/scripts/build-test-case-manifest.mjs --check
   ```
   Rebuild only when needed:
   ```powershell
   node .opencode/scripts/build-test-case-manifest.mjs
   ```
3. Read relevant `docs/acceptance/*.md`, source PRD/bug/request notes, and any existing matching `docs/plans/` or `docs/tickets/` files.
4. Create durable docs under root `docs/` only:
   - `docs/plans/{PLAN_ID}.md`
   - `docs/tickets/{TICKET_ID}.md`
   - `docs/acceptance/*.md` only when a missing acceptance case must be added before ticketing
5. Classify tickets with `workflow_stage` and `quality_policy`:
   - `design-ui` + `exploratory` for UI/layout/state discovery.
   - `integrate-backend` + `light-checks` for UI/API/backend/data wiring.
   - `integrate-backend` + `strict-tdd` for bugs, API contracts, clear acceptance rules, and tracer bullets.
   - `deployment` + `light-checks` for build/env/release/smoke work.
   - `workflow-maintenance` + `light-checks` for `.opencode`, `.codex`, workflow docs, scripts, skills, and runner changes.
6. Make strict-TDD tracer-bullet tickets `type: feature | bug`, `status: ready`, and map each one to exactly one `test_case_id`.
7. Keep unclear or unmapped strict-TDD work as `status: draft`; ready tickets with unmet `depends_on` can remain ready because the runner defers them until prerequisites complete.
8. For repaired ambiguous blocked tickets, preserve the existing ticket id and set `status: review`.
9. Do not launch orchestrators or edit product code.

## Required Ticket Fields

Every ready ticket needs:

- `id`
- `plan_id`
- `type`
- `status: ready`
- `workflow_stage`
- `quality_policy`
- `priority`
- `depends_on: []` or same-plan prerequisites
- `source_plan`

Strict-TDD tickets also need:

- `type: feature | bug`
- `test_case_id`
- `red_expectation`
- `green_expectation`

Non-strict tickets must not use placeholder `test_case_id: TBD`, `red_expectation`, or `green_expectation`; use `Validation`, `Definition Of Done`, and `Artifacts` sections instead.

## Final Response

Report:

```text
OUTCOME: success | partial | blocked
PLAN_ID: {plan-id}
PLAN_FILE: docs/plans/{plan-id}.md
READY_TICKETS: {count}
REVIEW_TICKETS: {count}
DRAFT_TICKETS: {count}
NEXT_COMMAND: use run-plan for {PLAN_ID}
```

## Rules

- Durable docs stay under root `docs/`.
- Do not create `.codex/generated` or `.opencode/generated`.
- Do not invent product decisions to force a ready ticket.
- Do not overwrite `in_progress` or `complete` tickets.
- Do not run mutating execution commands; this skill prepares inputs only.
- Keep user-facing product docs focused on `Design UI -> Integrate Backend -> Deployment`; `workflow-maintenance` is internal-only.
