# Shared Constraints

These constraints apply to ALL workflow agents (developer, sdet, reviewer).

## Universal rules
- Never modify `docker-compose.yml`, Dockerfiles, `nginx.conf` unless explicitly told.
- Never introduce new dependencies without recording them in your return summary.
- Never weaken assertions, skip tests, or use arbitrary `sleep` to "fix" timing — use proper waits.
- Never push to `main`/`master`. Never use `--no-verify`. Never use `--force` on shared branches.
- Always log meaningful actions (file changes, fixes, decisions) to `.opencode/logs/YYYY-MM-DD.md`.

## Role boundaries (system-enforced via permissions, but stated for clarity)
- **developer** — owns `backend/`, `frontend/`. May NOT touch `test/`.
- **sdet**      — owns `test/`. May NOT touch `backend/` or `frontend/`.
- **reviewer**  — read-only. May NOT edit anything.

## Source of truth
- Features: `docs/ACCEPTANCE_CRITERIA.md`
- Architecture: `docs/project-plan.md`
- Failure log format: `.opencode/skills/shared/io-contract.md`
- Operational runbook: `.opencode/knowledge/runbook.md`
- Known recurring bugs: `.opencode/knowledge/common-bugs.md`
