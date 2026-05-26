# WF-20260523 Remove Starter Setup

## Status

implemented-reviewed

## Intent

Remove reusable-starter bookkeeping that made every workflow refactor update checksum metadata and mirrored agent source files. Reuse in another repository is now a manual copy-and-adapt task.

## Scope

- Delete the starter checksum inventory.
- Delete mirrored agent source-copy files.
- Delete the bootstrap command skill and remove its slash command entry.
- Keep `.opencode/project.json`, active `.opencode/agents/*.md`, manifest generation, workflow runner scripts, and runtime state files.
- Scrub active and historical workflow docs so future searches do not revive the removed setup.

## Affected Files

- `.opencode/opencode.json`
- `.opencode/README.md`
- `.opencode/logs/2026-05-23.md`
- `AGENTS.md`
- `docs/adr/0004-project-adapter.md`
- `docs/workflow-changes/*.md`
- Deleted starter inventory, mirrored agent source-copy files, and bootstrap skill files.

## Source Of Truth

`.opencode/project.json` remains the durable source of truth for project-specific workflow configuration. ADR 0004 now documents manual copy-and-adapt reuse instead of managed starter validation.

## Validation Plan

- Parse `.opencode/opencode.json`.
- Check `.opencode/scripts/workflow-runner.mjs` syntax.
- Run the manifest freshness check.
- Run the deterministic runner status command.
- Grep active markdown/config/scripts for removed starter setup references.

## Validation Results

- `node -e "...JSON.parse..."` for `.opencode/opencode.json` and `.opencode/project.json`: passed.
- `node --check .opencode/scripts/workflow-runner.mjs`: passed.
- `node .opencode/scripts/build-test-case-manifest.mjs --check`: `FRESH`.
- `node .opencode/scripts/workflow-runner.mjs --json`: passed read-only status output; reported the expected dirty-worktree warning only.
- Stale-reference grep for removed starter setup terms: no files found.
- File glob for the removed mirrored source-copy directory: no files found.

## Rollback Plan

Restore the deleted starter inventory, mirrored agent source-copy files, bootstrap skill, slash command, and prior ADR from git history if managed starter validation is needed again.

## Restart Requirement

Yes. OpenCode should be restarted because command and skill files changed.

## Reviewer Notes

Workflow-maintenance reviewer approved with no required fixes. Reviewer confirmed the deletion scope matches the request, no runtime-critical files were removed, active docs/config remain coherent, historical docs were scrubbed, ADR 0004 is an acceptable source-of-truth replacement, and residual risk is limited to intentional manual copy-and-adapt reuse.
