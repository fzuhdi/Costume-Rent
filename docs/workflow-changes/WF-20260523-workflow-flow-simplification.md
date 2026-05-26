# WF-20260523 Workflow Flow Simplification

## Status
implemented

## Intent
Reduce workflow cost drivers found in the critique without weakening acceptance-test integrity, role separation, or protected-file guardrails.

## Scope
- Slim the orchestrator FSM text by moving durable policy details to existing source-of-truth docs.
- Make quality-gate checkpoints change-aware instead of repeatedly unconditional.
- Contain plan-completion regression so mapped failures block by default and same-plan bug generation requires explicit opt-in.
- Clarify that runtime state has one authoritative active-run file and secondary files are evidence/summary ledgers.
- Reduce coordinator launch friction by using configured orchestrator model defaults unless an override is needed.

## Affected Files
- `.opencode/skills/orchestrator/SKILL.md`
- `.opencode/skills/shared/constraints.md`
- `.opencode/skills/coordinator/SKILL.md`
- `.opencode/skills/coordinator/REFERENCE.md`
- `.opencode/README.md`
- `.opencode/opencode.json`
- `.opencode/logs/2026-05-23.md`
- `docs/engineering/QUALITY_GATES.md`
- `docs/engineering/TEST_INTEGRITY_POLICY.md`
- `docs/workflow-changes/WF-20260523-workflow-flow-simplification.md`

## Source Of Truth
- FSM transitions and dispatch: `.opencode/skills/orchestrator/SKILL.md`
- Shared guardrails: `.opencode/skills/shared/constraints.md`
- Test integrity: `docs/engineering/TEST_INTEGRITY_POLICY.md`
- Quality gate semantics: `docs/engineering/QUALITY_GATES.md`

## Validation Plan
- Parse `.opencode/opencode.json` as JSON.
- Run `node .opencode/scripts/build-test-case-manifest.mjs --check`.
- Grep for stale `brainstorming-design` references.
- Grep for unconditional regression bug-generation language in workflow docs.
- Run `git diff --check`.
- Run the configured root quality gate if practical after workflow/test-policy edits.

## Validation Results
- `node -e "JSON.parse(...)"` for `.opencode/opencode.json`: passed.
- `node .opencode/scripts/build-test-case-manifest.mjs --check`: `FRESH`.
- Grep for stale `brainstorming-design` references under `.opencode`: no files found.
- Grep for unconditional regression bug-generation language under `.opencode`: no files found.
- `git diff --check`: passed; Git emitted line-ending normalization warnings only.
- `node scripts/quality-gate.mjs`: passed.

## Rollback Plan
Revert this change record and the affected workflow docs/config together. No product code or dependency manifest changes are in scope.

## Restart Requirement
Yes. OpenCode should be restarted after changes to skills/config are picked up.

## Reviewer Notes
Workflow-maintenance reviewer approved the change-aware quality gates, opt-in regression bug sync, authoritative active-run state wording, and coordinator default-model launch behavior.
