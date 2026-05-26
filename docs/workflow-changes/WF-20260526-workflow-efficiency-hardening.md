# WF-20260526 Workflow Efficiency Hardening

## Status
implemented

## Intent
Reduce repeated permission prompts, avoid known runtime-slot collisions, remove avoidable test-run failures, and make reusable `.opencode` workflow assets portable across projects.

## Scope
- Remove committed `external_directory` rules from project config and agent frontmatter; normal ticket work should run from the prepared ticket worktree instead of granting sibling-directory access from the root session.
- Keep project-specific workflow data in the adapter (`.opencode/project.json`) or `docs/*`, not reusable `.opencode` skills/agents/scripts.
- Move project knowledge files out of `.opencode/knowledge` into `docs/runbooks`, `docs/engineering`, `docs/frontend`, and `docs/project`.
- Derive sibling worktree roots from the current project name (`../<project-name>-workspaces`) and keep worktrees outside the repo.
- Generate dev-only ticket runtime env files from adapter config instead of copying real `.env` files into worktrees; fail fast if an adapter asks `runtime_files` to copy `.env*` files.
- Stop completed Compose stacks that still occupy a runtime slot before preparing a new ticket on the same slot.
- Make workflow-runner Playwright command execution Windows-safe for `npx.cmd`.
- Let individual Playwright tests annotate expected mocked console errors instead of globally ignoring browser network 500 responses.
- Add cleanup and portability audit scripts for generated OpenCode files and reusable `.opencode` bias checks.

## Affected Files
- `.opencode/opencode.json`
- `.opencode/agents/orchestrator.md`
- `.opencode/agents/sdet.md`
- `.opencode/agents/developer.md`
- `.opencode/agents/reviewer.md`
- `.opencode/agents/workflow-engineer.md`
- `.opencode/project.json`
- `.opencode/scripts/launch-parallel-plan.mjs`
- `.opencode/scripts/runtime-slot.mjs`
- `.opencode/scripts/workflow-runner.mjs`
- `.opencode/scripts/cleanup-generated.mjs`
- `.opencode/scripts/audit-opencode-portability.mjs`
- `.opencode/skills/**`
- `.opencode/README.md`
- `docs/runbooks/project-runbook.md`
- `docs/engineering/common-bugs.md`
- `docs/frontend/heroui-v3-patterns.md`
- `docs/project/notes.md`
- `test/fixtures.js`

## Validation Plan
- Parse `.opencode/opencode.json`.
- Parse `.opencode/project.json` and `.opencode/workflow-models.json`.
- Run `node --check` on changed workflow scripts.
- Run `.opencode/scripts/audit-opencode-portability.mjs`.
- Run `.opencode/scripts/cleanup-generated.mjs --json` as a dry-run; it must only list generated workflow-run logs and generated state subfolders by default.
- Run the project quality gate because shared test fixtures changed.
- Run `git diff --check`.

## Rollback Plan
Revert this change record and the affected files above. If needed, manually stop any stale ticket Compose stack with `docker compose -p <project> -f <adapter compose file> down` from the recorded worktree.

## Restart Requirement
OpenCode must be restarted for config, agent, and skill changes to take effect.

## Reviewer Notes
- No project-level or agent-level `external_directory` allow rule is committed. If a transitional root-session workflow still needs sibling worktree access, put a documented home-relative rule in the user's global OpenCode config, not this repo.
- Runtime cleanup only targets leases already marked `complete` and does not stop running, interrupted, failed, or unknown stacks.
- The console guard reports all `console.error` messages by default; expected test-only errors require `test.info().annotations.push({ type: 'allow-console-error', description: '<regex>' })`.
- Product-agent edit frontmatter is generic and conservative because OpenCode frontmatter cannot read adapter paths dynamically; runner phases still enforce adapter-declared `code_roots` and `test_roots` before committing workflow outputs.
- Generated cleanup does not delete top-level `.opencode/logs/*.md` files by default because those may be durable manual workflow notes.
