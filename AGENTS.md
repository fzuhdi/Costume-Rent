# AGENTS.md — Costume Rental

Tiny project memory. Skills/subagents/knowledge/commands load on demand.

## Source of truth
- Project Adapter: `.opencode/project.json` defines features, paths, protected files, commands, quality gate, git defaults, and PR provider.
- Acceptance: `docs/acceptance/`; generated manifest: `.opencode/state/test-case-manifest.json`.
- FSM: `.opencode/skills/orchestrator/SKILL.md`; shared guardrails: `.opencode/skills/shared/constraints.md`; I/O: `.opencode/skills/shared/io-contract.md`.
- Workflow model defaults: `.opencode/workflow-models.json`.

## Key commands
- `/plan-to-tickets` — create TDD tickets with `test_case_id`.
- `/coordinator` — ask for a target, prepare plan targets as max-3 isolated independent tracer-ticket worktrees/runtime slots, then dispatch orchestrator tasks; ticket targets dispatch one orchestrator task.
- `/engineering/orchestrator` — show runnable plans with empty args, or execute one target ticket/plan through the TDD FSM.
- `/productivity/start`, `/productivity/status` — resume and inspect workflow state.

## Guardrails
- Workflow maintenance must not edit `backend/**` or `frontend/**`.
- Product agents resolve writable paths and commands from `.opencode/project.json`.
- Test titles include exactly one bracketed test_case_id such as `[RENT-001]`.
