---
name: init-project
description: Initializes or repairs a greenfield-only Workflow Kit Project Adapter. Use when running /init-project in an empty or docs-only product repo, bootstrapping from an initial PRD/plan, repairing .opencode/project.json, regenerating test-case manifests, or rendering project-specific agent permissions.
---

# Init Project

## Quick start

Run `/init-project <prd-or-plan>` only in an empty or docs-only product repository. This workflow establishes project structure, acceptance IDs, test strategy, and agent permissions for greenfield projects; it does not adopt existing application/test/CI layouts.

## Greenfield Gate

Before initialization, inspect the repo root and block if product code, test infrastructure, dependency manifests, or CI configuration already exist.

Allowed pre-existing files/directories:

- `.git/`
- `README.md`
- `.gitignore`
- `LICENSE`
- `docs/prd/**`
- lightweight planning docs with no application/test implementation

Blocking indicators include:

- application roots such as `backend/`, `frontend/`, `src/`, `app/`, `packages/`, `services/`, or `mobile/`
- test roots or test configs such as `test/`, `tests/`, `__tests__/`, `playwright.config.*`, `vitest.config.*`, `jest.config.*`, `pytest.ini`, or `tox.ini`
- dependency/build manifests such as `package.json`, `go.mod`, `pyproject.toml`, `requirements.txt`, `pom.xml`, `build.gradle`, `Cargo.toml`, `composer.json`, `.csproj`, or `pubspec.yaml`
- CI/deployment configs such as `.github/workflows/**`, `.gitlab-ci.yml`, `docker-compose.yml`, `Dockerfile`, or `k8s/**`

When blocked, stop and tell the user this Workflow Kit is greenfield-only. Do not install test frameworks, edit dependency manifests, migrate existing tests, or rewrite project structure unless the user starts a new empty project for this workflow.

## Responsibilities

1. Enforce the Greenfield Gate before writing project files.
2. Create or repair `.opencode/project.json` with feature registry, acceptance directory, code/test roots, protected paths, allowed test types, command templates, quality gate, git defaults, and PR provider.
3. Create `docs/acceptance/` skeleton files when missing. Empty folders require `/init-project <prd-or-plan>`; suggest `docs/prd/initial.md` and Ask Me or write-a-prd to shape the initial PRD.
4. Generate `.opencode/state/test-case-manifest.json` via `node .opencode/scripts/build-test-case-manifest.mjs`.
5. Render `.opencode/agents/*.md` from `.opencode/templates/agents/*.md` using project-specific permissions from `.opencode/project.json`.
6. Keep `AGENTS.md` as a minimal pointer to the Project Adapter, acceptance docs, Test Case Manifest, and core commands.
7. Do not migrate existing `.claude`, CI, dependency, or test-runner configuration.

## Repair rules

- Keep static Workflow Kit files generic; put project behavior in `.opencode/project.json`.
- Validate `static_kit_files` hashes with the manifest's text normalization rule; `text-lf` means normalize CRLF/CR to LF before sha256.
- Do not hardcode test types in reusable docs; read them from `project.json`.
- Prefer common language/framework test defaults only when creating a greenfield project; never inject or replace a test framework in an existing project.
- Test titles must contain exactly one bracketed `test_case_id` such as `[FEATURE-001]`.
- Covered cases require exactly one primary test title in the mapped project spec files.
- Ready and draft cases do not require tests.

## Validation

- Parse `.opencode/project.json`.
- Run `node .opencode/scripts/build-test-case-manifest.mjs` and `node .opencode/scripts/build-test-case-manifest.mjs --check`.
- Confirm no stale legacy global ID prefixes, `slice_id`, `feature-manifest`, or removed acceptance-source references remain except in historical workflow-change rationale.
