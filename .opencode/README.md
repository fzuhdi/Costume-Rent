# OpenCode Workflow

This `.opencode` setup uses an Agile backlog with strict TDD tracer-ticket execution. A plan acts like an epic. Ready `feature` and `bug` tickets are executable backlog items. Each executable ticket maps to exactly one generated Test Case Manifest entry, plus a RED expectation and a GREEN expectation.

This Workflow Kit is intended for empty/greenfield product repositories where OpenCode establishes the project structure, acceptance IDs, test strategy, and workflow conventions from the start. It is not an adoption/migration workflow for existing applications, existing tests, existing CI, or existing dependency manifests.

## Model

```text
Plan / Epic
  -> Ticket / Backlog Item
      -> type: feature | bug | chore | spike
      -> exactly one executable acceptance criterion when ready
      -> SDET RED -> developer GREEN -> SDET rerun -> reviewer final audit
```

Use one backlog for features, bugs, chores, and spikes. The orchestrator executes only ready `feature` and `bug` tickets mapped to one tracer test case. `chore` and `spike` tickets remain draft planning records until converted.

## Commands

| Command | Purpose |
|---|---|
| `/init-project <prd-or-plan>` | Initializes or repairs the Project Adapter only after the Greenfield Gate confirms an empty/docs-only product repo. |
| `/plan-to-tickets [plan-file] [plan-id optional]` | Converts or repairs plans/bugs/ask-me output into TDD-ready plan and ticket files. |
| `/coordinator [plan-id|ticket-id]` | Arg-first coordinator entry point. Empty args ask for a target before scanning; explicit plans fan out ready tickets into isolated ticket workspaces with max parallel 3. |
| `/engineering/orchestrator` | Shows TDD status, review/ready tickets, plans, checkpoints, and PR post-step state. |
| `/engineering/orchestrator [ticket-id]` | Runs one ready feature/bug ticket through strict TDD. |
| `/engineering/orchestrator [plan-id]` | Audits review tickets and runs all ready executable tickets for one plan sequentially. |
| `/productivity/start` | Reads TDD progress/logs and recommends the safest recovery or next action. |
| `/productivity/status` | Reports current TDD workflow status without invoking subagents. |

The `coordinator` skill is the preferred user-facing entry point for multiple tickets/plans and workflow-maintenance sequencing. Direct `developer`, `sdet`, and `reviewer` commands are debug-only for normal users.

## TDD Flow

```text
selecting-ticket
-> red-writing          (SDET writes and validates acceptance RED)
-> red-validating       (only failing_expected starts GREEN)
-> green-building       (developer app-code only)
-> green-testing        (SDET reruns recorded RED test)
-> refactoring          (optional, bounded, app-code only)
-> final-review         (reviewer audits scope and test integrity)
-> ticket-complete
```

`explore` may run read-only discovery in parallel with SDET RED. Developer app-code work starts only after valid RED. Developer never edits the SDET acceptance test.

## Ticket Files

Tickets live in `docs/tickets/`.

```yaml
---
id: TICKET-20260516-001
plan_id: PLAN-20260516-catalogue-search
type: feature
status: ready
test_case_id: CATALOGUE-004
priority: 1
source_plan: docs/plans/catalogue-search.md
red_expectation: The acceptance test fails because the behavior is missing.
green_expectation: The same acceptance test passes after minimal implementation.
---
```

Ticket status enum: `draft | review | ready | in_progress | blocked | complete`.

`status: review` means a repaired ambiguous ticket must pass reviewer `ticket-audit` before execution. `status: ready` means the ticket is independently executable and has all required TDD fields.

## Plan Execution

When invoked with a `PLAN_ID`, the orchestrator:

1. Requires a clean worktree and creates/resumes `tdd/{plan-id}`.
2. Audits `status: review` tickets first.
3. Runs ready executable `feature`/`bug` tickets sequentially.
4. Stops on dirty/disputed blocked work.
5. Completes the plan only when all review/executable tickets pass and no executable/review ticket is blocked or escalated.
6. Pushes the branch and creates a PR only after whole-plan success.

Draft chore/spike backlog records do not block PR creation.

Coordinator plan mode is different: `/coordinator PLAN-...` reads only the target plan and its tickets, then runs ready executable tickets in parallel item workspaces when child OpenCode sessions can be launched from those workspace roots. It runs at most 3 ticket orchestrators at once, schedules independent tickets before dependency-bearing tickets, and keeps ticket branch integration plus impacted regression sequential.

## Branches And Commits

- Plan branch: `tdd/{plan-id}`.
- Ticket branch: `tdd/{ticket-id}`.
- Branches are created only from a clean worktree.
- No auto-stash, auto-reset, or dirty-work discard.
- Coordinator-managed tickets and substantial workflow changes use isolated workspaces per `docs/adr/0003-ticket-and-workflow-workspaces.md`.
- Worker agents run from the item workspace root. Do not dispatch worker subagents across absolute paths into another worktree.

Commit convention:

- `checkpoint(tdd): pre-red <ticket-id>`
- `test(tdd): red <ticket-id>`
- `test(tdd): coverage <ticket-id>`
- `feat(tdd): green <ticket-id>` or `fix(tdd): green <ticket-id>`
- `refactor(tdd): <ticket-id>`
- `docs(tdd): block <ticket-id|plan-id>`
- `docs(tdd): complete <plan-id>`

## State Files

| File | Purpose |
|---|---|
| `.opencode/state/orchestrator-progress.json` | Current TDD phase, ticket, branch, checkpoints, and RED evidence. |
| `.opencode/state/ticket-progress.json` | Runtime ticket/plan execution and PR post-step state. |
| `.opencode/state/checkpoints.json` | Recorded checkpoint SHAs. |
| `.opencode/state.example/orchestrator-progress.json` | Tracked example orchestrator state shape. |
| `.opencode/state.example/ticket-progress.json` | Tracked example ticket state shape. |
| `.opencode/state.example/checkpoints.json` | Tracked example checkpoints shape. |
| `.opencode/state/test-case-manifest.json` | Generated feature-to-test case map. |

Runtime state uses `schemaVersion: 2`. Unknown or old versions block with `invalid progress state`; old state is not auto-migrated.

## ADRs

- `docs/adr/0001-tdd-orchestrator-execution.md`
- `docs/adr/0002-tdd-branching-commits-prs.md`
- `docs/adr/0003-ticket-and-workflow-workspaces.md`

## Restart Note

OpenCode loads commands, agents, skills, and config at startup. After changing files under `.opencode/commands/`, `.opencode/agents/`, `.opencode/skills/`, or `.opencode/opencode.json`, quit and restart OpenCode.
