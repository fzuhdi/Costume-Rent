---
id: WF-20260528-local-stage-workflow-refactor
status: implemented
owner: workflow-engineer
reviewer_mode: workflow-maintenance
---

# Local Stage Workflow Refactor

## Intent
Support local workflow tickets with product stages `Design UI -> Integrate Backend -> Deployment`, plus internal-only `workflow-maintenance` for workflow/tooling changes. Keep strict TDD as `quality_policy: strict-tdd`, not as a lifecycle stage.

## Scope
- Add `workflow_stage` and `quality_policy` semantics to project adapter config and ticketing docs.
- Preserve legacy `workflow_mode` readability through adapter normalization.
- Keep strict-TDD RED/GREEN/review runner behavior unchanged.
- Add lightweight `workflow-maintenance` execution through `workflow-engineer`.
- Allow non-strict tickets to omit `test_case_id`, `red_expectation`, and `green_expectation`.

## Source Of Truth
- `.opencode/project.json`
- `.opencode/skills/create-tickets/SKILL.md`
- `.opencode/skills/orchestrator/SKILL.md`
- `.opencode/skills/shared/io-contract.md`
- `.opencode/scripts/workflow-runner.mjs`

## Validation Plan
- `node --check` on changed `.opencode/scripts/*.mjs` and `.opencode/scripts/lib/*.mjs`.
- Workflow fixture tests for build-worker-task, template workflow, and workflow-runner reconciliation.
- `node .opencode/scripts/doctor.mjs --json`
- `node .opencode/scripts/audit-opencode-portability.mjs --json`
- `node .opencode/scripts/build-test-case-manifest.mjs --check`
- `node .opencode/scripts/workflow-runner.mjs --target PLAN-20260528-local-stage-workflow-refactor --json`

## Rollback
Revert the stage/policy config additions, runner workflow-maintenance path, ticket template changes, and generated plan/ticket frontmatter updates together. Legacy strict-TDD tickets remain readable because missing stage/policy with TDD fields is inferred as strict-TDD.

## Restart Requirement
Restart OpenCode/Codex sessions to reload changed skills, commands, agent prompts, and project config.
