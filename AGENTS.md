# AGENTS.md — Costume Rental

## Session Start (CRITICAL — run every session)
Read context log FIRST before doing anything:
```bash
cat .opencode/logs/context-log.md
```
Check:
- **TODO List** — incomplete steps from last session (crash recovery)
- **Last Updated** — verify recency
- **Recent Key Actions** — orient yourself before acting

---

## Trigger Commands

### `start`
Run this at the beginning of every session instead of typing the full instruction.

When you see the single word `start`, execute the following sequence automatically:

**If this is the first message of the session** — execute full load:
1. `cat .opencode/logs/context-log.md`
2. Read `.opencode/skills/orchestrator/SKILL.md`
3. Read `.opencode/skills/engineer/SKILL.md`
4. Read `.opencode/skills/sdet/SKILL.md`
5. Read `.opencode/skills/feature-builder/SKILL.md`
6. Read `.opencode/skills/shared/bug-report-schema.md`
7. Read `docs/ACCEPTANCE_CRITERIA.md`
8. Read `.opencode/state/orchestrator-progress.json`
9. `bash ls .opencode/state/bug-reports/` then read individual bug report files as needed

**If `start` is typed again this session** — only refresh state:
1. Read `.opencode/state/orchestrator-progress.json`
2. `bash ls .opencode/state/bug-reports/` then read individual bug report files as needed

Then report using the **Standard Report** below.

---

### `status`
Lightweight refresh — use mid-session to recheck state without reloading skills.

1. Read `.opencode/state/orchestrator-progress.json`
2. `bash ls .opencode/state/bug-reports/` then read individual bug report files as needed

Then report using the **Standard Report** below.

---
### Standard Report
_(used by both `start` and `status`)_

- Current feature and status
- Iteration count and remaining iterations
- Open / todo bugs by feature
- Incomplete features from ACCEPTANCE_CRITERIA.md
- **Next action**: print the exact instruction ready to run, based on current state:
  - If a feature has open bugs → print: `"Fix all open bugs for [feature-id] using /engineer [feature-id]"`
  - If no tests exist for a feature → print: `"Write tests for [feature-id] using /sdet [feature-id]"`
  - If a feature has no implementation → print: `"Implement [feature-id] using /feature-builder [feature-id]"`
  - If all tests pass and no open bugs → print: `"Feature [feature-id] is complete. Next feature: [next-feature-id] — run /orchestrator [next-feature-id]"`
  - If iteration >= maxIterations → print: `"Feature [feature-id] has hit iteration limit. Manual review required. Check .opencode/state/bug-reports/ for open bugs."`
  - If nothing is pending → print: `"All features complete. Run full regression: cd test && npx playwright test"`


## Stack
- Backend: Go (Fiber), SQLite — CGO required, always use `CGO_ENABLED=1 go build`
- Frontend: React + Vite
- UI Library: check `frontend/package.json` — match existing patterns
- Tests: Playwright (JS) for E2E, shell scripts for API smoke tests
- Orchestration: OpenCode with Orchestrator / Feature Builder / Engineer / SDET skills

---

## Agent Skills
Skills live in `.opencode/skills/`. 

| Invocation | Role | When to use |
|---|---|---|
| `/orchestrator [feature-id]` | Workflow engine | Run a full feature dev loop |
| `/feature-builder [feature-id]` | Senior Product Engineer | Implement a feature from AC |
| `/engineer [feature-id]` | Senior Fullstack Engineer | Fix open bugs for a feature |
| `/sdet [feature-id]` | Senior SDET | Write or run tests for a feature |

**Always provide `[feature-id]`** — agents use it to scope bug reports and AC lookup.

Canonical bug report schema: `.opencode/skills/shared/bug-report-schema.md`  
For stack details and known fixes: `.opencode/knowledge/runbook.md`  
For architecture context: `.opencode/knowledge/project-notes.md`

---

## Key Paths
docs/ACCEPTANCE_CRITERIA.md              ← single source of truth for all features
docs/project-plan.md                     ← architecture reference
.opencode/state/orchestrator-progress.json  ← current feature and iteration
.opencode/state/bug-reports/             ← one JSON per open bug
.opencode/state/worker-done/             ← completion signals between agents
.opencode/logs/context-log.md            ← session log and TODO list

---

## Running Tests
```bash
# All E2E tests
cd test && npx playwright test

# Single feature suite
cd test && npx playwright test test/specs/[feature-id].spec.js

# Single AC test
cd test && npx playwright test --grep "[AC-{acceptance_criteria_id}-{unique_test_number}]"

# API smoke tests
cd test && bash api/api-test.sh

# Debug with browser visible
cd test && npx playwright test --headed --slow-mo 500
```

---

## Crash Recovery
If session crashes or context is lost:

1. `cat .opencode/logs/context-log.md`
   - Check TODO List for the last incomplete step
   - Check Recent Key Actions for orientation

2. Read `.opencode/state/orchestrator-progress.json`
   - Identify: current feature-id, status, iteration count
   - If file is missing or corrupted → treat feature status as "pending" and restart

3. `bash ls .opencode/state/bug-reports/` then read individual bug report files for the current feature
    - Count bugs by status: open / todo / sdet-fault / verified
    - If any open or todo bugs exist → status should be "bug-fixing", not "testing"
    - Correct orchestrator-progress.json if inconsistent

4. Resume by re-invoking the orchestrator:
   `/orchestrator [feature-id]`
   The orchestrator startup validation will self-correct any remaining inconsistencies.

5. Update context-log.md TODO list after each step completes.

---

## Structural Known Issues
- **SQLite CGO**: always build with `CGO_ENABLED=1 go build` — never plain `go build`
- **Auth pattern**: reference `frontend/src/context/AuthContext.jsx` for auth hook usage
- **Transient bugs**: check `.opencode/state/bug-reports/` — do not hardcode bugs here

---

## Knowledge Base
- `.opencode/knowledge/heroui-v3-patterns.md` — HeroUI v3 component patterns and known issues