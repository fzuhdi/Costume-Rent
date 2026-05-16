# Shared Constraints

These constraints apply to ALL workflow agents (developer, sdet, reviewer).

## Universal rules
- Never modify `docker-compose.yml`, Dockerfiles, `nginx.conf` unless explicitly told.
- Never introduce new dependencies without recording them in your return summary.
- Never weaken assertions, skip tests, or use arbitrary `sleep` to "fix" timing — use proper waits.
- A green suite is invalid if acceptance coverage was weakened. Product gaps must remain honest failures or become explicit product tickets.
- Acceptance tests must be additive and self-scoped. Do not require global clean DB state, reset/truncate/drop data, or mutate records the test did not create.
- Test-created records must use `E2E_...` for browser tests and `API_...` for API tests.
- Run `node scripts/quality-gate.mjs` after any `test/**` edit and before final review/commit. If it fails, stop and report the findings.
- Never push to `main`/`master`. Never use `--no-verify`. Never use `--force` on shared branches.
- Always log meaningful actions (file changes, fixes, decisions) to `.opencode/logs/YYYY-MM-DD.md`.

## Tracer bullet rule
- Normal workflow owns exactly one `SLICE_ID` at a time.
- Plan execution may process multiple tickets, but each ticket must complete the one-slice FSM before the next ticket starts.
- Build the smallest end-to-end behavior that proves that slice through the real system.
- Defer sibling ACs, broad infrastructure, full CRUD completion, and generalized abstractions until their own slice is selected.
- Verify the slice immediately with the narrowest honest test before expanding scope.

## Role boundaries (system-enforced via permissions, but stated for clarity)
- **developer** — owns `backend/`, `frontend/`. May NOT touch `test/`.
- **sdet**      — owns `test/`. May NOT touch `backend/` or `frontend/`.
- **reviewer**  — read-only. May NOT edit anything.

## Source of truth
- Features: `docs/ACCEPTANCE_CRITERIA.md`
- Ticket work: `docs/tickets/*.md` when `TICKET_FILE` is provided
- Architecture: `docs/project-plan.md`
- Test integrity: `docs/engineering/TEST_INTEGRITY_POLICY.md`
- Forbidden patterns: `docs/engineering/FORBIDDEN_PATTERNS.md`
- Review checklist: `docs/engineering/REVIEW_CHECKLIST.md`
- Quality gates: `docs/engineering/QUALITY_GATES.md`
- Failure log format: `.opencode/skills/shared/io-contract.md`
- Operational runbook: `.opencode/knowledge/runbook.md`
- Known recurring bugs: `.opencode/knowledge/common-bugs.md`
