# ADR 0002: TDD Branching, Commits, and PRs

## Status
Accepted

## Context
The TDD orchestrator needs auditable recovery points and predictable PR behavior. Runtime state is gitignored, so branch history and durable ticket/plan metadata must explain what happened.

## Decision
TDD execution uses dedicated branches, real checkpoint commits, and machine-parseable commit messages.

- The orchestrator creates a TDD branch only from a clean worktree.
- Plan mode uses `tdd/{plan-id}`; ticket mode uses `tdd/{ticket-id}`.
- Existing branches resume only when runtime state records the same plan or ticket.
- The base branch is recorded when the TDD branch is created and used as the PR base.
- Checkpoint commits are real commits and are pushed with the PR branch.
- Empty commits are allowed only for `checkpoint(tdd): pre-red <ticket-id>`.
- RED, GREEN, refactor, coverage, and docs status commits must not be empty.
- GREEN and refactor changes are committed before final review so reviewer audits committed branch history from the after-RED checkpoint.
- The orchestrator never auto-stashes, auto-resets, or discards dirty work.
- Plan-mode auto-PR runs only when the whole executable plan succeeds.
- Auto-PR pushes with `git push -u origin <tdd-branch>` and creates the PR from actual completed ticket commits and metadata.

## Commit Convention
- `checkpoint(tdd): pre-red <ticket-id>`
- `test(tdd): red <ticket-id>`
- `test(tdd): coverage <ticket-id>`
- `feat(tdd): green <ticket-id>`
- `fix(tdd): green <ticket-id>`
- `refactor(tdd): <ticket-id>`
- `docs(tdd): block <ticket-id>`
- `docs(tdd): block <plan-id>`
- `docs(tdd): complete <plan-id>`

## Consequences
The PR history is intentionally verbose. It preserves the RED/GREEN proof and recovery points at the cost of extra commits.

Blocked dirty/disputed work stops plan mode and requires human recovery. This avoids destructive automation and makes rollback a reported action, not an automatic action.

## Rejected Alternatives
- Local-only checkpoints: rejected because recovery points should be visible in the PR branch.
- Auto-reset on dispute: rejected because the orchestrator must not discard work without explicit user action.
- Auto-PR for partial plans: rejected because blocked executable or review tickets mean the plan did not fully succeed.
