---
name: run-plan
description: Launches Costume/OpenCode workflow plans from Codex without remembering script commands. Use when the user says to run, launch, execute, preview, resume, or check a PLAN-* workflow, or asks how to trigger parallel orchestrator agents from Codex.
---

# Run Plan

Use this as the Codex entry point for plan execution. Keep the skill thin: scripts own deterministic preparation, leases, runtime slots, worktrees, and handoff payloads.

## Quick Commands

Preview a plan without writing:

```powershell
node .opencode/scripts/launch-parallel-plan.mjs --target <PLAN_ID> --parallel 3 --dry-run --json
```

Prepare and dispatch a parallel plan:

```powershell
node .opencode/scripts/launch-parallel-plan.mjs --target <PLAN_ID> --parallel 3 --json
```

Check current workflow status:

```powershell
node .opencode/scripts/workflow-runner.mjs --json
```

## Missing Plan ID

If the user asks to run, launch, preview, resume, or check a plan but does not provide a `PLAN-*` id:

1. Run `node .opencode/scripts/workflow-runner.mjs --json`.
2. Inspect `docs/plans/*.md` for frontmatter with `status: ready` or `status: in_progress`.
3. If exactly one runnable plan exists, use that `PLAN-*` id.
4. If multiple runnable plans exist, list the ids and ask the user which one to run.
5. If no runnable plan exists, report that plainly and include the current runtime plan/status from the runner output if present.

## Execution Flow

1. Read `.opencode/project.json` and confirm the target plan contains deterministic tickets: strict-TDD product tickets or internal `workflow-maintenance` tickets. Parallel runtime preparation still requires `parallel-runtime`.
2. If no `PLAN-*` id is present, follow **Missing Plan ID** before running launch commands.
3. Run `node .opencode/scripts/launch-parallel-plan.mjs --target <PLAN_ID> --parallel 3 --dry-run --json` unless the user clearly requested actual execution.
4. If the user says to run, launch, execute, or use this skill for a `PLAN-*`, treat that as actual execution intent and run the same command without `--dry-run`.
5. For each returned `dispatches[].task`, spawn one Codex `orchestrator` subagent and pass the task prompt exactly.
6. Do not rewrite the handoff prompt. The script already includes `WORKTREE_ROOT`, runtime env keys, branch data, lease deadline, and runner commands.
7. Report the selected tickets, worktrees, runtime URLs, blockers, and next safe command.

## Single-Target Fallback

For a single ticket or non-parallel plan status, use the runner directly:

```powershell
node .opencode/scripts/workflow-runner.mjs --target <PLAN_ID_OR_TICKET_ID> --json
```

Only run mutating strict-TDD actions when the selected ticket has `quality_policy: strict-tdd` and `strict-tdd` is enabled. Internal workflow-maintenance tickets use the same runner commands but dispatch `workflow-engineer` instead of SDET/developer:

```powershell
node .opencode/scripts/workflow-runner.mjs --target <TICKET_ID> --run-ticket --json
node .opencode/scripts/workflow-runner.mjs --target <PLAN_ID> --run-plan --json
node .opencode/scripts/workflow-runner.mjs --target <PLAN_ID_OR_TICKET_ID> --next-task --json
```

## Rules

- Do not use `.opencode/skills/coordinator/SKILL.md` as the source of behavior; it is optional UX guidance.
- Do not create `.codex/generated` or `.opencode/generated`; durable docs stay under root `docs/`.
- Do not manually invent worktrees, ports, leases, or orchestrator prompts.
- Do not dispatch more than one orchestrator agent against the same checkout.
