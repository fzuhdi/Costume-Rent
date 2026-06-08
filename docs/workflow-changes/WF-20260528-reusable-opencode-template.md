---
id: WF-20260528-reusable-opencode-template
status: complete
owner: workflow-engineer
reviewer_mode: workflow-maintenance
---

# Reusable OpenCode Template

## Intent

Make `.opencode` copyable for future projects by separating reusable workflow plumbing from project-specific strict TDD assumptions.

## Scope

- Add normalized workflow modes and artifact paths to `.opencode/project.json`.
- Declare root `docs/` as the durable project documentation location.
- Add `.opencode/project.example.json` for new project adapters.
- Split reusable script helpers into `.opencode/scripts/lib/`.
- Add `doctor.mjs` and safer generated-artifact cleanup.
- Move detailed strict TDD procedure into orchestrator reference docs.
- Standardize Playwright output under `.artifacts/`.
- Add `.codex/skills/run-plan/SKILL.md` as the memorable Codex plan trigger.
- Rename plan/ticket creation entry points to `create-tickets`.

## Source Of Truth

- `.opencode/project.json`
- `.opencode/project.example.json`
- `.opencode/scripts/lib/`
- `.opencode/skills/orchestrator/SKILL.md`
- `.opencode/skills/orchestrator/REFERENCE.md`
- `.opencode/README.md`

## Validation Plan

- `node --check` on `.opencode/scripts/**/*.mjs`.
- Existing workflow script tests.
- Template tests for config normalization, doctor, cleanup safety, strict-TDD mode gating, and Playwright artifact anchoring.
- `node .opencode/scripts/audit-opencode-portability.mjs --json`.
- `node .opencode/scripts/doctor.mjs --json`.
- `node .opencode/scripts/build-test-case-manifest.mjs --check`.
- `node .opencode/scripts/workflow-runner.mjs --json`.

## Rollback Plan

Revert the `.opencode` script/config/docs changes, restore the previous Playwright config and ignore policy, and remove this workflow-change record. Product code is intentionally out of scope.

## Restart Requirement

yes - OpenCode should be restarted after skill, command, config, or MCP-related files change.

## Review Notes

- Strict TDD remains enabled for this project but defaults off in the example adapter.
- Cleanup is dry-run by default and skips tracked generated-looking files.
- Project docs remain under root `docs/`; adapter-local generated-doc folders are rejected by `doctor.mjs`.
- Codex plan launching is exposed as a thin `run-plan` skill over deterministic scripts, not a second coordinator implementation.
- Ticket creation is exposed as `create-tickets` in both OpenCode and Codex.
