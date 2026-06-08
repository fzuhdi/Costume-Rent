---
id: WF-20260528-codex-thin-adapter
status: complete
owner: workflow-engineer
reviewer_mode: workflow-maintenance
---

# Codex Thin Adapter

## Intent

Make the existing OpenCode TDD workflow usable from Codex without replacing the deterministic runner, project-specific runtime slot allocation, worker-output validation, or manifest rules.

## Scope

- Add `.codex/config.toml` with project agent limits only.
- Add Codex role prompts under `.codex/agents/`.
- Add `.codex/skills/costume-tdd/SKILL.md` as a concise workflow map.
- Add `.codex/README.md` and update `AGENTS.md` discoverability.
- Keep `.opencode/**` runner scripts and source-of-truth workflow files unchanged.

## Source Of Truth

- `.opencode/project.json`
- `.opencode/skills/orchestrator/SKILL.md`
- `.opencode/skills/shared/constraints.md`
- `.opencode/skills/shared/io-contract.md`
- `.codex/README.md`
- `.codex/skills/costume-tdd/SKILL.md`

## Validation Plan

- Confirm every `.codex/agents/*.toml` file defines `name`, `description`, and `developer_instructions`.
- Run `node .opencode/scripts/build-test-case-manifest.mjs --check`.
- Run `node .opencode/scripts/workflow-runner.mjs --json`.
- If a ready plan exists, run `node .opencode/scripts/launch-parallel-plan.mjs --target <PLAN_ID> --parallel 3 --dry-run --json`.
- Confirm `git diff --stat` is limited to `.codex/**`, `AGENTS.md`, and workflow-maintenance docs/logs.

## Rollback Plan

Remove `.codex/**`, revert the Codex-specific `AGENTS.md` additions, and remove this workflow-change record plus its log entry. `.opencode/**` runner behavior remains unaffected.

## Restart Requirement

yes - Codex sessions may need restart or reload to discover new `.codex` agent, skill, and config files.

## Review Notes

- Implemented from the Codex thin-adapter plan on 2026-05-28.
- Parsed `.codex/config.toml` and all five `.codex/agents/*.toml` files with Python `tomllib`.
- Confirmed each agent file defines `name`, `description`, and `developer_instructions`.
- Confirmed `.codex/skills/costume-tdd/SKILL.md` frontmatter defines `name` and `description`.
- `node .opencode/scripts/build-test-case-manifest.mjs --check` returned `FRESH`.
- `node .opencode/scripts/workflow-runner.mjs --json` completed in read-only status mode with existing dirty-worktree and state-reconciliation warnings.
- Parallel plan dry-run was skipped because `docs/plans/` contains no plan files.
