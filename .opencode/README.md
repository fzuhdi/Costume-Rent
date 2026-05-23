# OpenCode Workflow

This `.opencode` setup runs strict TDD tracer-ticket execution for plans and tickets. Detailed behavior lives in source-of-truth files; this README is an index for users and agents.

## Source Of Truth

| Area | Source |
|---|---|
| Project adapter, writable roots, commands, quality gate | `.opencode/project.json` |
| FSM and TDD lifecycle | `.opencode/skills/orchestrator/SKILL.md` |
| Shared guardrails | `.opencode/skills/shared/constraints.md` |
| Subagent return fields | `.opencode/skills/shared/io-contract.md` |
| Model defaults | `.opencode/workflow-models.json` |
| Test integrity and quality gates | `docs/engineering/` |
| Runtime recovery commands | `.opencode/knowledge/runbook.md` |

## Model

```text
Plan / Epic
  -> Ticket / Backlog Item
      -> type: feature | bug | chore | spike
      -> exactly one executable acceptance criterion when ready
      -> SDET RED -> developer GREEN -> deterministic GREEN rerun -> reviewer final audit
```

Executable tickets are ready `feature` or `bug` items mapped to exactly one `test_case_id`. `chore` and `spike` records stay planning-only until converted.

## Commands

| Command | Purpose |
|---|---|
| `/plan-to-tickets [plan-file] [plan-id optional]` | Converts or repairs plans, bugs, ask-me output, or PRDs into TDD-ready plan and ticket files. |
| `/coordinator [plan-id|ticket-id]` | Preferred user-facing launcher for targeted workflow runs; uses configured model defaults unless overridden. |
| `/engineering/orchestrator` | Shows TDD status and runnable plans without invoking subagents. |
| `/engineering/orchestrator [ticket-id]` | Runs one ticket through the strict TDD FSM. |
| `/engineering/orchestrator [plan-id]` | Runs review/ready tickets for one plan sequentially, then completes plan-level gates. |
| `/productivity/start` | Reads progress and recommends the safest recovery or next action. |
| `/productivity/status` | Reports current TDD workflow status without invoking subagents. |
| `node .opencode/scripts/workflow-runner.mjs --target <plan-id|ticket-id> --dry-run` | Preview-only deterministic preflight; validates state and reports the next step without invoking subagents. |
| `node .opencode/scripts/workflow-runner.mjs --target <ticket-id> --run-ticket --json` | Deterministic happy-path ticket runner; owns branch/checkpoint commits, quality-gate checks, GREEN verification, optional reviewer skip, and runtime-state advancement while still consuming captured worker outputs. |
| `node .opencode/scripts/workflow-runner.mjs --target <plan-id> --run-plan --json` | Deterministic plan runner; sequences review/ready tickets through the runner-owned ticket path and gates plan completion on impacted-spec regression. |
| `node .opencode/scripts/workflow-runner.mjs --target <ticket-id> --run-green --json` | Deterministic official GREEN rerun for the recorded RED test; replaces `sdet MODE: run-green`. |
| `node .opencode/scripts/workflow-runner.mjs --target <ticket-id> --validate-worker-output <sdet-red|developer-green|developer-refactor|reviewer> --output-file <path> --json` | Deterministic contract validator for one worker final message before the FSM advances. |

Direct `developer`, `sdet`, and `reviewer` commands are debug-only for normal users.

## Runtime Modes

- Default stable mode: one orchestrator, one checkout, one long-lived dev stack, one Playwright base URL.
- Advanced parallel mode: isolated worktree and runtime stack per executable process; see `docs/adr/0003-ticket-and-workflow-workspaces.md` and `.opencode/knowledge/runbook.md`.

Dependency/install approval, runtime setup blocks, role boundaries, and test-state rules are defined in `.opencode/skills/shared/constraints.md`.

## Branches And Commits

- Plan branch: `tdd/{plan-id}`.
- Ticket branch: `tdd/{ticket-id}`.
- Branches are created only from a clean worktree.
- No auto-stash, auto-reset, dirty-work discard, force push, or hidden recovery.
- Commit message conventions are owned by `.opencode/skills/orchestrator/SKILL.md`.

## State Files

| File | Purpose |
|---|---|
| `.opencode/state/orchestrator-progress.json` | Authoritative active-run phase, ticket, branch, checkpoints, and RED evidence. |
| `.opencode/state/ticket-progress.json` | Ticket/plan summary, audit evidence, and PR post-step state. |
| `.opencode/state/checkpoints.json` | Checkpoint SHA ledger. |
| `.opencode/state/test-case-manifest.json` | Generated feature-to-test case map. |
| `.opencode/state.example/*.json` | Tracked example runtime state shapes. |

Runtime state uses the schema version required by the orchestrator skill.

## Restart Note

OpenCode loads commands, agents, skills, and config at startup. After changing files under `.opencode/commands/`, `.opencode/agents/`, `.opencode/skills/`, or `.opencode/opencode.json`, quit and restart OpenCode.
