# AGENTS.md — Costume Rental

## Trigger Commands

### `start`
**First `start` of session** — full load:
1. `ls -t .opencode/logs/*.md | head -1 | xargs cat`
2. Read `.opencode/skills/orchestrator/SKILL.md`
3. Read `.opencode/skills/engineer/SKILL.md`
4. Read `.opencode/skills/sdet/SKILL.md`
5. Read `.opencode/skills/feature-builder/SKILL.md`
6. Read `.opencode/skills/shared/bug-report-schema.md`
7. Read `docs/ACCEPTANCE_CRITERIA.md`
8. Read `.opencode/state/orchestrator-progress.json`
9. `bash ls .opencode/state/bug-reports/` — read open bug files as needed

**Repeated `start`** — state refresh only:
1. Read `.opencode/state/orchestrator-progress.json`
2. `bash ls .opencode/state/bug-reports/` — read open bug files as needed

Then output **Standard Report**.

---

### `status`
1. Read `.opencode/state/orchestrator-progress.json`
2. `bash ls .opencode/state/bug-reports/` — read open bug files as needed

Then output **Standard Report**.

---

### Standard Report

- Current feature, status, iteration count, remaining iterations
- Open/todo bugs by feature
- Incomplete features from ACCEPTANCE_CRITERIA.md

| State | Print this next action |
|---|---|
| Open bugs exist | `Fix open bugs for [feature-id] — run /engineer [feature-id]` |
| No tests exist | `Write tests for [feature-id] — run /sdet [feature-id]` |
| No implementation | `Implement [feature-id] — run /feature-builder [feature-id]` |
| All pass, no bugs | `[feature-id] complete. Next: /orchestrator [next-feature-id]` |
| Iteration limit hit | `[feature-id] hit iteration limit. Manual review required.` |
| Nothing pending | `All complete. Run: cd test && npx playwright test` |

---

## Agent Skills

| Invocation | Role | When to use |
|---|---|---|
| `/orchestrator [feature-id]` | Workflow engine | Full feature dev loop |
| `/feature-builder [feature-id]` | Product Engineer | Implement feature from AC |
| `/engineer [feature-id]` | Fullstack Engineer | Fix open bugs |
| `/sdet [feature-id]` | SDET | Write or run tests |

**Always provide `[feature-id]`.**

---

## Key Paths
- `docs/ACCEPTANCE_CRITERIA.md` — feature source of truth
- `docs/project-plan.md` — architecture reference
- `.opencode/state/orchestrator-progress.json` — current feature + iteration
- `.opencode/state/bug-reports/` — one JSON per bug
- `.opencode/logs/YYYY-MM-DD.md` — daily log, most recent = source of truth
- `.opencode/knowledge/runbook.md` — known bugs + fixes
- `.opencode/knowledge/project-notes.md` — architecture decisions
- `.opencode/knowledge/heroui-v3-patterns.md` — HeroUI v3 patterns

---

## Stack
- **Backend:** Go + Gin · SQLite via `glebarez/sqlite` · `CGO_ENABLED=0` always
- **Frontend:** React 19 · Vite 5 · HeroUI v3 · Tailwind v4
- **Auth:** JWT (golang-jwt/jwt/v5) + bcrypt
- **Tests:** Playwright JS · specs in `test/specs/` · format `[AC-001-001]`
- **Containers:** Docker + Docker Compose + Nginx

---

## Running Tests (always `cd test` first)
- `npm run test` — full run + sync bug reports ← **use by default**
- `npx playwright test specs/[feature].spec.js` — single feature
- `npx playwright test --grep "[AC-001-001]"` — single AC
- `npx playwright test --headed --slow-mo 500` — debug
- `npx playwright show-report` — HTML report

---

## Activity Logging (MANDATORY)

Log after every meaningful action: feature build, bug fix, test run, file change, blocked state.

### Log file
One file per day: `.opencode/logs/YYYY-MM-DD.md`
Append entries — never overwrite.

### Daily file structure
```
# Log — YYYY-MM-DD

## TODO List
- [ ] pending task
- [x] completed task

---

## HH:MM — {short title}

**Prompt:** {user instruction verbatim or close paraphrase}

**Actions taken:**
- {sub-task and result}

**Files changed:**
- `path/to/file` — {what changed}

**Outcome:** success | partial | blocked
{If partial or blocked: what remains and why}

---
```

### Log retention (3 most recent files)
After each log write:
```bash
ls -t .opencode/logs/*.md | tail -n +4 | xargs -r rm -f
```
Keeps the 3 most recent daily files. Older files deleted automatically.

---

## Crash Recovery
1. `ls -t .opencode/logs/*.md | head -1 | xargs cat` — find last incomplete TODO
2. `cat .opencode/logs/$(date +%Y-%m-%d).md` — check today's last log entry
3. Read `.opencode/state/orchestrator-progress.json` — if missing, treat as pending
4. `bash ls .opencode/state/bug-reports/` — if open/todo bugs exist → status is bug-fixing
5. Correct `orchestrator-progress.json` if inconsistent
6. Resume: `/orchestrator [feature-id]`

---

## Known Issues
| Issue | Fix |
|---|---|
| `pread64 undeclared` build error | Use `glebarez/sqlite` + `CGO_ENABLED=0` |
| `useAuth is not exported` | Add `export const useAuth = () => useContext(AuthContext)` |
| Infinite page reload | Only poll notifications when `isAuthenticated === true` |
| DB `out of memory (14)` | Mount volume to directory `/app/` not file path |
| Docker not picking up changes | `docker compose build --no-cache` |
| Bug reports show `UNKNOWN` feature | Check `AC_FEATURE_MAP` in `sync-bug-reports.js` |
| HeroUI wrong syntax | Scan `frontend/src/components/` — use v3 compound syntax only |