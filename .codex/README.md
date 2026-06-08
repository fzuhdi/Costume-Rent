# Codex Thin Adapter

This directory makes the existing OpenCode workflow easier to use from Codex. It is an adapter, not a migration. The deterministic project workflow still lives under `.opencode`.

Durable project docs stay at the repository root under `docs/`. Do not create `.codex/generated` for plans, tickets, acceptance docs, or workflow-change records; generated runtime output belongs in ignored `.artifacts/` or `.opencode/state`/`.opencode/logs` paths.

## Source Of Truth

| Area | Source |
|---|---|
| Project paths, protected files, workflow stages/policies, commands, quality gate, runtime slots | `.opencode/project.json` |
| Workflow stages, strict-TDD FSM, and runner procedure | `.opencode/skills/orchestrator/SKILL.md` |
| Shared workflow guardrails | `.opencode/skills/shared/constraints.md` |
| Worker output fields | `.opencode/skills/shared/io-contract.md` |
| Generated test-case manifest | `.opencode/state/test-case-manifest.json` |
| Codex workflow map | `.codex/skills/costume-tdd/SKILL.md` |
| Codex ticket creator | `.codex/skills/create-tickets/SKILL.md` |
| Codex plan launcher | `.codex/skills/run-plan/SKILL.md` |
| Codex role prompts | `.codex/agents/*.toml` |

## What Codex Provides

Use Codex built-ins for planning, review, status, permissions, model switching, browser/plugin support, context compaction, worktrees, and built-in `default`, `worker`, and `explorer` agents. Do not copy OpenCode slash-command wrappers or the OpenCode `explore` role into this adapter.

## What OpenCode Still Owns

Use `.opencode/scripts/workflow-runner.mjs` for all ticket and plan FSM transitions. Use `.opencode/scripts/launch-parallel-plan.mjs` when parallel plan execution needs Costume-specific runtime slots or ticket leases.

Codex subagents and app worktrees may run in parallel, but they do not replace the project allocator.

For plan execution from Codex, say `use run-plan for PLAN-...` or ask to run/preview a `PLAN-*`; the skill wraps the deterministic scripts and dispatches returned orchestrator handoffs.

For plan/ticket creation from Codex, say `use create-tickets` with the PRD, feature request, bug report, or implementation notes. The skill writes durable `docs/plans/` and `docs/tickets/` files only.

## Roles

- `orchestrator` dispatches runner-emitted tasks and never hand-writes state transitions.
- `sdet` owns one acceptance RED and never edits application code.
- `developer` owns GREEN/refactor application changes and never edits SDET tests.
- `reviewer` is read-only and returns verdicts.
- `workflow_engineer` maintains workflow/config/docs only and avoids product code roots.

The role files intentionally omit model settings so they inherit the active Codex model.

## Validation

Useful read-only checks for adapter changes:

```powershell
node .opencode/scripts/build-test-case-manifest.mjs --check
node .opencode/scripts/workflow-runner.mjs --json
```

When a ready plan exists, preview parallel preparation:

```powershell
node .opencode/scripts/launch-parallel-plan.mjs --target <PLAN_ID> --parallel 3 --dry-run --json
```
