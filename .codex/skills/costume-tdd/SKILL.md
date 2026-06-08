---
name: costume-tdd
description: Codex workflow map for the Costume Rental repository. Use when Codex needs to run, adapt, inspect, or explain the repo's TDD plan/ticket workflow, choose Codex role prompts, preserve OpenCode runner boundaries, validate workflow maintenance, or coordinate `.opencode` runtime scripts from Codex.
---

# Costume TDD

## First Reads

Load these before executing workflow work:

- `.opencode/project.json` for paths, protected files, commands, quality gate, and runtime slots.
- `.opencode/skills/orchestrator/SKILL.md` for the authoritative TDD FSM.
- `.opencode/skills/shared/constraints.md` for guardrails.
- `.opencode/skills/shared/io-contract.md` for worker return fields.
- `.opencode/state/test-case-manifest.json` for acceptance-to-test mapping.

## Codex Mapping

- Use Codex built-ins for planning, review, status, permissions, browser/plugin support, model switching, context compaction, app worktrees, and built-in `default`, `worker`, and `explorer` agents.
- Use `.codex/agents/*.toml` for project role prompts when a named role is needed.
- Do not copy OpenCode slash commands, `explore`, model resolver settings, DCP config, or Playwright MCP config into Codex.
- Do not create `.agents/skills` for this repo-local adapter; `AGENTS.md` and `.codex/README.md` point Codex users here.
- Keep durable project docs under root `docs/`; do not create `.codex/generated` or `.opencode/generated` for plans, tickets, acceptance docs, or workflow-change records.

## Runner Use

`.opencode/scripts/workflow-runner.mjs` owns state transitions. Do not advance the FSM in prose.

Normal loop:

1. Run `node .opencode/scripts/workflow-runner.mjs --reconcile --json`.
2. Run `node .opencode/scripts/workflow-runner.mjs --target <plan-or-ticket> --json`.
3. When a worker is needed, run `node .opencode/scripts/workflow-runner.mjs --target <plan-or-ticket> --next-task --json`.
4. Dispatch exactly the returned task payload to the requested role.
5. Save the worker final message under `.opencode/state/worker-outputs/`.
6. Run `node .opencode/scripts/workflow-runner.mjs --target <plan-or-ticket> --ingest-worker-output <saved-output-file> --json`.
7. Continue only while the runner reports a safe next step.

Official GREEN reruns use:

```powershell
node .opencode/scripts/workflow-runner.mjs --target <ticket-id> --run-green --json
```

## Parallel Plans

Use Codex parallel agents only for work that does not need Costume runtime-slot allocation. For plan execution that needs project runtime slots and ticket leases, use:

```powershell
node .opencode/scripts/launch-parallel-plan.mjs --target <PLAN_ID> --parallel 3 --json
```

Use `--dry-run --json` first when previewing a ready plan.

## Role Boundaries

- `orchestrator`: runner dispatcher only; no direct app or test edits.
- `sdet`: writes one acceptance RED under test roots; no app-code edits.
- `developer`: writes GREEN/refactor app code only; no SDET test edits.
- `reviewer`: read-only verdicts only.
- `workflow_engineer`: workflow/config/docs maintenance only; no `backend/**` or `frontend/**`.

## Validation

For adapter-only changes, run:

```powershell
node .opencode/scripts/build-test-case-manifest.mjs --check
node .opencode/scripts/workflow-runner.mjs --json
```

Also confirm `.codex/agents/*.toml` each define `name`, `description`, and `developer_instructions`, and confirm `git diff --stat` is limited to `.codex/**`, `AGENTS.md`, and workflow-maintenance docs/logs.
