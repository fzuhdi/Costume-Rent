# WF-20260523 Workflow Prompt Deduplication

## Status
implemented

## Intent
Reduce duplicated workflow instructions across OpenCode docs, commands, and agents while preserving the strict TDD workflow behavior and safety guardrails.

## Scope
- Shorten secondary documentation so it points to source-of-truth files.
- Keep the orchestrator FSM behavior in `.opencode/skills/orchestrator/SKILL.md`.
- Keep shared guardrails in `.opencode/skills/shared/constraints.md`.
- Keep workflow I/O fields in `.opencode/skills/shared/io-contract.md`.
- Keep model defaults in `.opencode/workflow-models.json`.
- Keep test-integrity policy in `docs/engineering/`.

## Affected Files
- `AGENTS.md`
- `.opencode/README.md`
- `.opencode/opencode.json`
- `.opencode/agents/*.md`
- `.opencode/skills/coordinator/SKILL.md`
- `.opencode/skills/coordinator/REFERENCE.md`
- `.opencode/knowledge/runbook.md`
- `.opencode/logs/2026-05-23.md`

## Source Of Truth
- FSM: `.opencode/skills/orchestrator/SKILL.md`
- Shared guardrails: `.opencode/skills/shared/constraints.md`
- I/O contract: `.opencode/skills/shared/io-contract.md`
- Project adapter: `.opencode/project.json`
- Model defaults: `.opencode/workflow-models.json`
- Test policy: `docs/engineering/TEST_INTEGRITY_POLICY.md`, `docs/engineering/QUALITY_GATES.md`, `docs/engineering/FORBIDDEN_PATTERNS.md`, `docs/engineering/REVIEW_CHECKLIST.md`

## Validation Plan
- Parse `.opencode/opencode.json` as JSON.
- Run `node .opencode/scripts/build-test-case-manifest.mjs --check`.
- Run duplicate-policy greps for model defaults, dependency/install policy, quality-gate language, and hard-rule phrases.
- Run `git diff --check`.

## Validation Results
- `node -e "...JSON.parse..."` for `.opencode/opencode.json`: passed.
- `node .opencode/scripts/build-test-case-manifest.mjs --check`: initially reported stale generated manifest; `node .opencode/scripts/build-test-case-manifest.mjs` regenerated it, and the rerun reported `FRESH`.
- `node -e "...JSON.parse..."` for `.opencode/state/test-case-manifest.json`: passed.
- `git diff --check`: passed; Git emitted line-ending normalization warnings only.
- Duplicate-policy scans show reduced repeated references in `.opencode/**/*.md`: quality policy references `29`, dependency/install references `24`, explicit model-id references `8`.

## Rollback Plan
Revert this workflow-change record and the prompt/doc edits together. No product code, dependency manifest, or test behavior changes are part of this change.

## Restart Requirement
Yes. OpenCode should be restarted after changes to agents, skills, or commands/config are picked up.

## Reviewer Notes
Workflow-maintenance reviewer approved the prompt-deduplication edits and found that role separation, test integrity, and protected-file guardrails were preserved.
