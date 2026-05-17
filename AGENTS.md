# AGENTS.md — Costume Rental

Tiny project memory. Skills/subagents/knowledge/commands load on demand.

## Workflow adapter
- Project Adapter: `.opencode/project.json` defines features, paths, protected files, test types, commands, quality gate, git defaults, and PR provider.
- Acceptance source of truth: one file per feature in `docs/acceptance/`, using `FEATURE-001` test_case_id sections.
- Generated Test Case Manifest: `.opencode/state/test-case-manifest.json`, built by `node .opencode/scripts/build-test-case-manifest.mjs`.
- `/init-project <prd-or-plan>` is greenfield-only: use it only in empty/docs-only product repos. It must block existing product code, tests, dependency manifests, or CI configs instead of adopting them.

## Key commands
- `/init-project` — initialize/repair Project Adapter, acceptance skeleton, manifests, rendered agents, and pointers after the Greenfield Gate passes.
- `/plan-to-tickets` — create TDD tickets with `test_case_id`.
- `/engineering/orchestrator` — show runnable plans with empty args, or execute one target ticket/plan through the TDD FSM.
- `/productivity/start`, `/productivity/status` — resume and inspect workflow state.

## Guardrails
- Workflow maintenance must not edit `backend/**` or `frontend/**`.
- Product agents resolve writable paths and commands from `.opencode/project.json`.
- Test titles include exactly one bracketed test_case_id such as `[RENT-001]`.
