# ADR 0004: Project Adapter

## Status

Accepted

## Context

The TDD workflow needs project-specific paths, protected files, acceptance locations, test commands, quality gates, git defaults, and PR provider settings. Keeping those values scattered through agents, skills, and command docs makes refactors noisy and increases drift risk.

## Decision

Use `.opencode/project.json` as the single project adapter for repo-specific workflow configuration.

- Project-specific feature registry, paths, protected files, test types, commands, quality gate, git defaults, and PR provider live in `.opencode/project.json`.
- Acceptance criteria live in one markdown file per feature under `docs/acceptance/` and use feature-scoped `test_case_id` values such as `RENT-001`.
- `.opencode/state/test-case-manifest.json` is generated from `.opencode/project.json` and `docs/acceptance/*.md` by `.opencode/scripts/build-test-case-manifest.mjs`.
- Tickets reference only `test_case_id` for acceptance mapping; criterion text and expected outcome are resolved from the manifest.
- Reusing this workflow in another repository is a manual copy-and-adapt operation. Copy the active `.opencode/**`, `docs/engineering/**`, and workflow helper files, then edit `.opencode/project.json` for that repository.

## Consequences

Workflow maintenance edits no longer need to update checksum inventories or mirrored agent source files. Reuse is less automated, but this repo remains simpler and the active runtime files are the only files that need refactoring.

## Validation

Parse `.opencode/project.json`, generate and check the Test Case Manifest, and grep for stale global acceptance IDs or old manifest references after project-adapter changes.
