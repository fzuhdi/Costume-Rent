---
name: orchestrator
description: Runner-dispatched workflow coordinator for project tickets and plans. Use for /engineering/orchestrator, /productivity/start, /productivity/status, strict TDD ticket execution, or workflow status/recovery.
---

# Orchestrator

`.opencode/scripts/workflow-runner.mjs` is the canonical state-transition engine. The orchestrator reports status, dispatches exactly the worker task returned by the runner, captures worker final messages, and ingests them back into the runner.

## Workflow Stages And Policies

Configured in `.opencode/project.json`:

- Product stages shown to users: `design-ui -> integrate-backend -> deployment`.
- Internal stage: `workflow-maintenance` for `.opencode`, `.codex`, workflow docs, scripts, skills, runner changes, and workflow test helpers.
- Quality policies: `exploratory`, `light-checks`, and `strict-tdd`.
- Legacy modes remain readable during migration:
  - `ui-tracer` -> `design-ui` + `exploratory`
  - `light-implementation` -> `integrate-backend` + `light-checks`
  - `strict-tdd` -> `integrate-backend` + `strict-tdd`
  - `parallel-runtime` remains the isolated runtime-slot capability for parallel strict-TDD ticket preparation.

Strict TDD is a quality policy, not a stage. If `strict-tdd` is not enabled, do not run strict-TDD tickets through RED/GREEN/review actions. Non-strict `workflow-maintenance` tickets use the lightweight workflow-engineer handoff.

## Strict TDD Loop

Use only when `workflow.enabled_modes` includes `strict-tdd`.

1. Run `node .opencode/scripts/workflow-runner.mjs --reconcile --json`.
2. Run `node .opencode/scripts/workflow-runner.mjs --target <plan-or-ticket> --json`.
3. When a worker is needed, run `node .opencode/scripts/workflow-runner.mjs --target <plan-or-ticket> --next-task --json`.
4. Dispatch exactly `nextTask.task`; do not hand-write or simulate worker payloads.
5. Save the worker final message under `.opencode/state/worker-outputs/`.
6. Run `node .opencode/scripts/workflow-runner.mjs --target <plan-or-ticket> --ingest-worker-output <saved-output-file> --json`.
7. Continue only while the runner reports a safe next step.

Official GREEN reruns use:

```bash
node .opencode/scripts/workflow-runner.mjs --target <ticket-id> --run-green --json
```

## Hard Rules

- One executable strict-TDD ticket equals one tracer bullet and exactly one `test_case_id`.
- `sdet` owns acceptance RED tests, `developer` owns app-code GREEN/refactor, and `reviewer` is read-only.
- Developer app-code editing starts only after a valid RED or reviewer-approved already-green coverage.
- Never let developer edit the recorded SDET acceptance test.
- Never advance on malformed worker output; validate and ingest through the runner.
- Never auto-stash, auto-reset, discard dirty work, force push, install dependencies, or run browser/runtime installers without explicit user approval.
- Plan completion requires impacted-spec regression to pass.

Detailed states, exception paths, commit policy, contracts, and recovery semantics live in [REFERENCE.md](REFERENCE.md).
