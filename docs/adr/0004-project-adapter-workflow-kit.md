# ADR 0004: Project Adapter Workflow Kit

## Status

Accepted

## Context

The TDD workflow was tightly coupled to this repository through global acceptance IDs, hardcoded paths, project-specific agent permissions, and a generated feature manifest. Reusing it as a starter workflow for new projects would require editing many workflow files and would risk weakening branch, workspace, and review rules.

Existing product repositories may already have language-specific unit tests, E2E tests, dependency manifests, CI, and security tooling. Adopting those safely requires a broader migration workflow and risks conflicting with the project's own test architecture.

## Decision

Split the workflow into a greenfield-only Workflow Kit plus a per-project Project Adapter.

- The required Project Adapter path is `.opencode/project.json`.
- Static kit files are tracked conceptually by `.opencode/workflow-kit.json` and carry lightweight `workflow-kit:owned` markers where practical.
- Project-specific feature registry, paths, protected files, test types, commands, quality gate, git defaults, and PR provider live in `.opencode/project.json`.
- Acceptance criteria live in one markdown file per feature under `docs/acceptance/` and use feature-scoped `test_case_id` values such as `RENT-001`.
- `.opencode/state/test-case-manifest.json` is generated from `.opencode/project.json` and `docs/acceptance/*.md` by `.opencode/scripts/build-test-case-manifest.mjs`.
- Tickets reference only `test_case_id` for acceptance mapping; criterion text and expected outcome are resolved from the manifest.
- Generic agent templates live under `.opencode/templates/agents/*.md`; `/init-project` renders `.opencode/agents/*.md` with adapter-specific permissions.
- `/init-project` is the mandatory command for bootstrapping or repairing copied workflow assets in empty/docs-only product repositories.
- `/init-project` must block when existing product code, tests, dependency manifests, or CI configuration are detected. This kit does not adopt or migrate existing applications.

## Consequences

This adds one required adapter file and a generation step, but keeps starter workflow policy generic and moves greenfield project variability into a single source of truth. The manifest validation becomes stricter: covered cases must have exactly one matching primary test title, while draft and ready cases can exist before tests.

## Tradeoffs

- Generic workflow docs must refer to project-configured test types instead of naming specific test frameworks.
- Limiting the kit to greenfield projects avoids conflicting with existing project test frameworks, but existing repos need a separate migration/adoption workflow if support is required later.
- Some rendered files are generated from templates and should be reviewed as adapter outputs, not static kit policy.
- Historical plans and tickets need migration to `test_case_id` values to avoid legacy alias drift.

## Validation

Parse `.opencode/project.json`, generate and check the Test Case Manifest, and grep for stale global acceptance IDs or old manifest references after migration.
