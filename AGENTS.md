# AGENTS.md — Costume Rental

Tiny project memory. **Skills/subagents/knowledge/commands load on demand — do NOT eagerly read them.**

## Stack
Go + Gin · React 19 + Vite + HeroUI v3 + Tailwind v4 · SQLite (`glebarez/sqlite`, `CGO_ENABLED=0`) · JWT + bcrypt · Playwright · Docker Compose + Nginx.

## Command groups
| Group | Directory | Commands |
|---|---|---|
| Engineering | `.opencode/commands/engineering/` | `/engineering/orchestrator`, `/engineering/developer`, `/engineering/sdet`, `/engineering/reviewer` |
| Planning | (inline in `opencode.json`) | `/plan-to-tickets` |
| Productivity | `.opencode/commands/productivity/` | `/productivity/start`, `/productivity/status` |
| Utility | `.opencode/commands/utility/` | (reserved) |

## Key paths
| Path | Purpose |
|---|---|
| `docs/ACCEPTANCE_CRITERIA.md` | Source of truth for features |
| `docs/plans/*.md` | Agile plan/epic summaries grouped by `plan_id`; status `draft|ready|in_progress|blocked|complete` |
| `docs/tickets/*.md` | TDD backlog tickets grouped by `plan_id`; ready feature/bug tickets are orchestrator-executable |
| `docs/adr/0001-tdd-orchestrator-execution.md` | TDD execution workflow decision |
| `docs/adr/0002-tdd-branching-commits-prs.md` | TDD branch/commit/PR decision |
| `.opencode/skills/orchestrator/SKILL.md` | Strict TDD FSM definition |
| `.opencode/skills/plan-to-tickets/SKILL.md` | Converts/repairs plans/PRDs/bugs into TDD-ready tickets |
| `.opencode/agents/{developer,sdet,reviewer}.md` | Subagents |
| `.opencode/skills/shared/{constraints,io-contract}.md` | Shared contracts |
| `docs/engineering/TEST_INTEGRITY_POLICY.md` | Acceptance-test integrity contract |
| `docs/engineering/FORBIDDEN_PATTERNS.md` | Patterns the quality gate rejects |
| `docs/engineering/QUALITY_GATES.md` | Tiered quality gate commands and checkpoints |
| `docs/engineering/REVIEW_CHECKLIST.md` | Repo-specific review checklist |
| `.opencode/knowledge/runbook.md` | Operational guide |
| `.opencode/knowledge/common-bugs.md` | Recurring bugs (read when user reports a bug) |
| `.opencode/knowledge/heroui-v3-patterns.md` | HeroUI v3 syntax |
| `.opencode/state/orchestrator-progress.json` | Runtime TDD phase, ticket, branch, checkpoints, and RED evidence |
| `.opencode/state/ticket-progress.json` | Runtime ticket/plan execution and PR post-step state |
| `.opencode/state.example/{orchestrator-progress,ticket-progress,checkpoints}.json` | Tracked versioned example runtime state shapes |
| `.opencode/state/feature-manifest.json` | Pre-indexed feature → AC/file map (gitignored, auto-built) |
| `.opencode/state/checkpoints.json` | Git SHAs for TDD checkpoints |
| `.opencode/scripts/build-manifest.mjs` | Rebuilds feature-manifest.json |

## Intent classifier (apply silently)
- Status / "where are we" → run `/productivity/status` or `/productivity/start`.
- Bug report / "X doesn't work" → consult `common-bugs.md` first.
- Plan / PRD / bug batch to work items → run `/plan-to-tickets [plan-file]`.
- Continue / resume / build / fix a feature → run `/engineering/orchestrator [ticket-id]` for one ready feature/bug ticket, or `/engineering/orchestrator [plan-id]` to audit review tickets and execute all ready feature/bug tickets in one plan.
- General code question → answer directly, load only what you need.

## Logging (lightweight)
After meaningful actions append to `.opencode/logs/YYYY-MM-DD.md`:
```
## HH:MM — {title}
**Prompt:** {instruction}
**Actions:** {bullets}
**Files:** {paths}
**Outcome:** success|partial|blocked
```
Then prune: `ls -t .opencode/logs/*.md | tail -n +4 | xargs -r rm -f`

## Crash recovery
`/productivity/start` reads the latest log + progress + bug list and recommends the next step.

## Quick gotchas
`pread64` build error → `CGO_ENABLED=0` + `glebarez/sqlite` · `useAuth not exported` → add hook export · infinite reload → fetch notifications only when `isAuthenticated` · DB `out of memory` → mount volume to `/app/` not the file · Docker stale → `build --no-cache` · HeroUI syntax → see `heroui-v3-patterns.md`.

## Test integrity
A green suite is invalid if acceptance coverage was weakened. Run `node scripts/quality-gate.mjs` after any `test/**` edit and before final review/commit. Product gaps must stay as honest failures or become explicit tickets; do not hide them with skips, weak assertions, or broad suppressions.
