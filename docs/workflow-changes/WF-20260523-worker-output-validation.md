# WF-20260523-worker-output-validation

## Status
implemented-reviewed

## Intent
Add deterministic validation for captured worker final messages so the workflow can reject malformed or misaligned SDET, developer, or reviewer outputs before the FSM advances.

## Scope
- Add `--validate-worker-output <sdet-red|developer-green|developer-refactor|reviewer>` and `--output-file <path>` to `.opencode/scripts/workflow-runner.mjs`.
- Parse one captured worker final message and validate required base fields, step-specific fields, allowed enums, and ticket/test-case alignment.
- Document validator usage in active workflow docs.
- Do not yet change the ticket FSM execution path to call the validator automatically.

## Affected Files
- `.opencode/scripts/workflow-runner.mjs`
- `.opencode/README.md`
- `.opencode/skills/orchestrator/SKILL.md`
- `.opencode/skills/shared/io-contract.md`
- `.opencode/logs/2026-05-23.md`
- `docs/workflow-changes/WF-20260523-worker-output-validation.md`

## Source Of Truth
- `.opencode/skills/shared/io-contract.md` owns worker return fields and enums.
- `.opencode/scripts/workflow-runner.mjs` owns deterministic validation behavior for captured worker outputs.
- `.opencode/skills/orchestrator/SKILL.md` owns when worker contract failures block or escalate the FSM.

## Validation Plan
- Run `node --check .opencode/scripts/workflow-runner.mjs`.
- Parse `.opencode/opencode.json` and `.opencode/project.json`.
- Run `node .opencode/scripts/build-test-case-manifest.mjs --check`.
- Run `node .opencode/scripts/workflow-runner.mjs --json`.
- Run positive and negative validator smoke tests with sample captured worker-output files.

## Validation Results
- `node --check .opencode/scripts/workflow-runner.mjs`: passed.
- `node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('.opencode/opencode.json','utf8')); JSON.parse(fs.readFileSync('.opencode/project.json','utf8')); console.log('JSON OK')"`: passed.
- `node .opencode/scripts/build-test-case-manifest.mjs --check`: passed (`FRESH`).
- `node .opencode/scripts/workflow-runner.mjs --json`: passed read-only status output with expected dirty-worktree warning only.
- Smoke test: valid captured `developer-green` output in `.opencode/state/worker-output-valid.txt` passed deterministic validation for required fields, enums, and ticket/test-case alignment.
- Smoke test: invalid captured `sdet-red` output in `.opencode/state/worker-output-invalid.txt` correctly failed deterministic validation on mismatched `TEST_CASE_ID` and bracketed `TEST_TITLE`.
- Hardening found during smoke tests: validator mode initially blocked on dirty worktrees like executable modes; runner was updated so read-only target validation warns on dirty worktrees instead of blocking.
- Post-review hardening: base worker-field validation now also requires `FEATURE` and checks it against the target ticket feature.

## Rollback Plan
Remove validator CLI flags and helper logic from `.opencode/scripts/workflow-runner.mjs`, revert the related README/skill/io-contract/log edits, and delete this change record.

## Restart Requirement
OpenCode restart is required before relying on updated runner usage text, skills, and command summaries.

## Reviewer Notes
Workflow-maintenance reviewer approved with no required fixes. Reviewer noted two low risks; the safer follow-up was applied by adding deterministic `FEATURE` validation and target feature matching for all worker outputs. Remaining low risk: reviewer informational fields such as `DIFF_SIZE_LINES` are presence-checked but not format-validated.
