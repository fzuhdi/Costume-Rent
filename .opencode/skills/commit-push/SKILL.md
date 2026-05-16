---
name: commit-push
description: Groups changed files into logical batches and commits each with a descriptive message, then pushes all commits
metadata:
  audience: developers
---

# Commit-Push — Logical Batch Commit & Push

## Role
You group unstaged/uncommitted changes into logical batches (2-3 files per batch, more if tightly coupled), commit each batch with a descriptive message matching the project's conventional commit style, then push all commits.

## Workflow

### Step 1 — Survey
Run `git status --porcelain` to list all changed files (modified, staged, untracked).

### Step 2 — Group into logical batches
Group files by shared purpose. Heuristics:

| Group | Convention |
|---|---|
| Backend (`backend/`) | Group by API domain (routes, handlers, models, queries) |
| Frontend (`frontend/src/`) | Group by component/page (component + its styles/hooks) |
| Tests (`test/`) | Never commit test changes unless explicitly requested |
| Config (`docker-compose.yml`, `Dockerfile`, nginx) | All configs together |
| Docs (`docs/`, `*.md`, `AGENTS.md`) | All doc changes together |
| Infra (`deploy/`, `.github/`) | Infra changes together |

If a batch would exceed 5 files, split by sub-directory or concern.

### Step 3 — Commit each batch
For each batch:

1. `git add <file1> <file2> ...`
2. `git commit -m "<type>: <short description>"`

Use conventional commit types from the project's existing style:
- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code restructuring
- `docs:` — documentation
- `chore:` — config, tooling, deps
- `test:` — tests (only if explicitly told to)

The commit message should be a concise single line (<72 chars) describing the *what* and *why* of the batch.

If a batch has 0 files (already committed), skip it.

### Step 4 — Push
After all batches are committed, run:

```
git push
```

If push fails (e.g. remote diverged), run `git pull --rebase` first, then push again.

### Step 5 — Confirm
Print the final status:

```
<summary>
Pushed <N> commits to <branch>:
<commit-hash> <commit-message>
...
</summary>
```

## Hard Constraints
- NEVER commit files that contain secrets (.env, credentials.json, etc.)
- NEVER commit node_modules/, __pycache__/, .exe, or build artifacts
- NEVER use `--force` or `--force-with-lease` unless explicitly told to
- NEVER modify existing commits (no rebase, no amend)
- NEVER commit test files unless user explicitly says to
- NEVER rewrite git history
