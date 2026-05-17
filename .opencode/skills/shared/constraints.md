# Shared Constraints

These constraints apply to ALL workflow agents (developer, sdet, reviewer).

## Universal rules
- Never modify `docker-compose.yml`, Dockerfiles, `nginx.conf` unless explicitly told.
- Never add, update, or remove dependencies without explicit user approval before the change.
- Never run dependency or tool installers such as `npm install`, `npm ci`, `npx playwright install`, package-manager add/update commands, or browser/runtime installers without explicit user approval. Missing dependencies, missing browser caches, or lockfile drift are setup blocks until approved.
- When asking for dependency/install approval, state the package or tool, requested version when known, reason, affected manifest/lockfile or cache, exact command, and fallback if denied.
- In isolated worktrees, reuse an existing dependency directory only when it matches the relevant lockfile hash. If a dependency manifest or lockfile must change, serialize the work, ask approval, install once in a controlled workspace, and refresh the shared cache for that lockfile hash.
- Record approved dependency changes and install commands in your return summary.
- Never weaken assertions, skip tests, or use arbitrary `sleep` to "fix" timing — use proper waits.
- A green suite is invalid if acceptance coverage was weakened. Product gaps must remain honest failures or become explicit product tickets.
- Acceptance tests must be additive and self-scoped. Do not require global clean DB state, reset/truncate/drop data, or mutate records the test did not create.
- Test-created records must use `E2E_...` for browser tests and `API_...` for API tests.
- Run the project-configured quality gate after edits to adapter-declared test roots and before final review/commit when a gate is configured. If it fails, stop and report the findings.
- A plan is not complete until full impacted specs pass. Mapped impacted-regression failures become same-plan `review` bug tickets; unmapped/setup failures block without product bug tickets.
- Substantial workflow-maintenance changes use `workflow-engineer`, `docs/workflow-changes/*.md`, reviewer `MODE: workflow-maintenance`, and isolated workspaces per ADR 0003.
- Use `write-a-skill` whenever creating or modifying skills.
- Never push to `main`/`master`. Never use `--no-verify`. Never use `--force` on shared branches.
- Always log meaningful actions (file changes, fixes, decisions) to `.opencode/logs/YYYY-MM-DD.md`.

## Tracer bullet rule
- Normal workflow owns exactly one `TEST_CASE_ID` at a time.
- Plan execution may process multiple tickets, but each ticket must complete the one-test case FSM before the next ticket starts.
- Build the smallest end-to-end behavior that proves that test case through the real system.
- Defer sibling ACs, broad infrastructure, full CRUD completion, and generalized abstractions until their own test case is selected.
- Verify the test case immediately with the narrowest honest test before expanding scope.

## Role boundaries (system-enforced via permissions, but stated for clarity)
- **developer** — owns `backend/`, `frontend/`. May NOT touch `test/`.
- **sdet**      — owns `test/`. May NOT touch `backend/` or `frontend/`.
- **reviewer**  — read-only. May NOT edit anything.

## Source of truth
- Features: `docs/acceptance/*.md`
- Ticket work: `docs/tickets/*.md` when `TICKET_FILE` is provided
- Architecture: `docs/project-plan.md`
- Test integrity: `docs/engineering/TEST_INTEGRITY_POLICY.md`
- Forbidden patterns: `docs/engineering/FORBIDDEN_PATTERNS.md`
- Review checklist: `docs/engineering/REVIEW_CHECKLIST.md`
- Quality gates: `docs/engineering/QUALITY_GATES.md`
- Workflow I/O contract: `.opencode/skills/shared/io-contract.md`
- Operational runbook: `.opencode/knowledge/runbook.md`
- Known recurring bugs: `.opencode/knowledge/common-bugs.md`
