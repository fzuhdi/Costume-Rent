# AGENTS.md -- Costume Rental

Tiny project memory. Skills/subagents/knowledge/commands load on demand.

## Source of truth
- Project Adapter: `.opencode/project.json` defines features, paths, protected files, commands, quality gate, git defaults, and PR provider.
- Acceptance: `docs/acceptance/`; generated manifest: `.opencode/state/test-case-manifest.json`.
- FSM: `.opencode/skills/orchestrator/SKILL.md`; shared guardrails: `.opencode/skills/shared/constraints.md`; I/O: `.opencode/skills/shared/io-contract.md`.
- Workflow model defaults: `.opencode/workflow-models.json`.

## Codex adapter
- Codex overview: `.codex/README.md`.
- Codex workflow map: `.codex/skills/costume-tdd/SKILL.md`.
- Codex plan launcher: `.codex/skills/run-plan/SKILL.md`.
- Codex roles: `.codex/agents/orchestrator.toml`, `.codex/agents/developer.toml`, `.codex/agents/sdet.toml`, `.codex/agents/reviewer.toml`, `.codex/agents/workflow_engineer.toml`.
- `.codex` is a thin adapter only; `.opencode` remains the deterministic runner/source of truth.

## Key commands
- `/create-tickets` -- create plan/ticket docs with `test_case_id`.
- `/coordinator` -- ask for a target, prepare plan targets as max-3 isolated independent tracer-ticket worktrees/runtime slots, then dispatch orchestrator tasks; ticket targets dispatch one orchestrator task.
- `/engineering/orchestrator` -- show runnable plans with empty args, or execute one target ticket/plan through the TDD FSM.
- `/productivity/start`, `/productivity/status` -- resume and inspect workflow state.
- Codex plan trigger: ask to use `run-plan` for a `PLAN-*`.
- Codex read-only checks: `node .opencode/scripts/build-test-case-manifest.mjs --check`, `node .opencode/scripts/workflow-runner.mjs --json`.
- Codex parallel plan preview, when a ready plan exists: `node .opencode/scripts/launch-parallel-plan.mjs --target <PLAN_ID> --parallel 3 --dry-run --json`.

## Guardrails
- Workflow maintenance must not edit `backend/**` or `frontend/**`.
- Durable project docs live under root `docs/`; do not create `.opencode/generated` or `.codex/generated` for project docs.
- Product agents resolve writable paths and commands from `.opencode/project.json`.
- Test titles include exactly one bracketed test_case_id such as `[RENT-001]`.
- Do not duplicate OpenCode `commands/`, `explore`, model resolver settings, DCP config, or Playwright MCP config into `.codex`.
