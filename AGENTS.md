# AGENTS.md — Costume Rental

Tiny project memory. **Skills/subagents/knowledge/commands load on demand — do NOT eagerly read them.**

## Stack
Go + Gin · React 19 + Vite + HeroUI v3 + Tailwind v4 · SQLite (`glebarez/sqlite`, `CGO_ENABLED=0`) · JWT + bcrypt · Playwright · Docker Compose + Nginx.

## Command groups
| Group | Directory | Commands |
|---|---|---|
| Engineering | `.opencode/commands/engineering/` | `/engineering/orchestrator`, `/engineering/developer`, `/engineering/sdet`, `/engineering/reviewer` |
| Productivity | `.opencode/commands/productivity/` | `/productivity/start`, `/productivity/status` |
| Utility | `.opencode/commands/utility/` | (reserved) |

## Key paths
| Path | Purpose |
|---|---|
| `docs/ACCEPTANCE_CRITERIA.md` | Source of truth for features |
| `.opencode/skills/orchestrator/SKILL.md` | FSM definition |
| `.opencode/agents/{developer,sdet,reviewer}.md` | Subagents |
| `.opencode/skills/shared/{constraints,io-contract}.md` | Shared contracts |
| `.opencode/knowledge/runbook.md` | Operational guide |
| `.opencode/knowledge/common-bugs.md` | Recurring bugs (read when user reports an issue) |
| `.opencode/knowledge/heroui-v3-patterns.md` | HeroUI v3 syntax |
| `.opencode/state/orchestrator-progress.json` | Feature + current tracer slice + iteration state |
| `.opencode/state/feature-manifest.json` | Pre-indexed feature → AC/file map (gitignored, auto-built) |
| `.opencode/state/feature-{id}/failures.md` | Append-only failure log per feature |
| `.opencode/state/feature-{id}/disputes.md` | sdet-fault arbitration log |
| `.opencode/state/checkpoints.json` | Git SHAs for pre-fix checkpoints |
| `.opencode/scripts/build-manifest.mjs` | Rebuilds feature-manifest.json |

## Intent classifier (apply silently)
- Status / "where are we" → run `/productivity/status` or `/productivity/start`.
- Bug report / "X doesn't work" → consult `common-bugs.md` first.
- Continue / resume / build / fix a feature → run `/engineering/orchestrator [feature-id]` to select the next tracer slice, or `/engineering/orchestrator [feature-id] [slice-id]` for a specific slice.
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
