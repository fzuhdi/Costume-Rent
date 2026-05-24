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
| Model capability categories | `.opencode/model-capabilities.md` |
| Model selection procedure | `.opencode/skills/model-selector/SKILL.md` |
| Model resolver script | `.opencode/scripts/resolve-agent-models.mjs` |
| Test integrity and quality gates | `docs/engineering/` |
| Runtime recovery commands | `.opencode/knowledge/runbook.md` |

## Model

```text
Plan / Epic
  -> Ticket / Backlog Item
      -> type: feature | bug | chore | spike
      -> exactly one executable acceptance criterion when ready
      -> runner reconciliation -> SDET RED -> developer GREEN -> deterministic GREEN rerun -> reviewer audit when risk rules require it
```

Executable tickets are ready `feature` or `bug` items mapped to exactly one `test_case_id`. `chore` and `spike` records stay planning-only until converted.

## Commands

| Command | Purpose |
|---|---|
| `/plan-to-tickets [plan-file] [plan-id optional]` | Converts or repairs plans, bugs, ask-me output, or PRDs into TDD-ready plan and ticket files. |
| `/coordinator [plan-id|ticket-id]` | Preferred user-facing coordinator; plan targets prepare up to 3 independent ready tracer-ticket worktrees/runtime slots and dispatch orchestrator tasks, ticket targets dispatch one orchestrator task. |
| `/engineering/orchestrator` | Shows TDD status, reconciliation drift, and runnable plans without invoking subagents. |
| `/engineering/orchestrator [ticket-id]` | Runs one ticket through the runner-owned strict TDD workflow. |
| `/engineering/orchestrator [plan-id]` | Runs one plan inside the current worktree; use `/coordinator <plan-id>` for default max-3 parallel tracer execution. |
| `/productivity/start` | Reads progress and recommends the safest recovery or next action. |
| `/productivity/status` | Reports current TDD workflow status without invoking subagents. |
| `node .opencode/scripts/workflow-runner.mjs --target <plan-id|ticket-id> --dry-run` | Preview-only deterministic preflight; validates state and reports the next step without invoking subagents. |
| `node .opencode/scripts/workflow-runner.mjs --reconcile --json` | Compares plan docs, ticket frontmatter, runtime state, checkpoints, and leases before execution. |
| `node .opencode/scripts/workflow-runner.mjs --target <plan-id|ticket-id> --next-task --json` | Emits exactly one next worker task payload without invoking subagents. |
| `node .opencode/scripts/workflow-runner.mjs --target <plan-id|ticket-id> --ingest-worker-output <path> --json` | Validates a captured worker final message and advances the selected ticket or plan phase when supported. |
| `node .opencode/scripts/launch-parallel-plan.mjs --target <plan-id> --parallel 3 --dry-run --json` | Previews preparation for up to 3 independent ready executable tickets in isolated worktrees and Docker Compose runtime slots. Non-dry-run output includes orchestrator task handoffs. |
| `node .opencode/scripts/workflow-runner.mjs --target <ticket-id> --run-ticket --json` | Deterministic happy-path ticket runner; owns branch/checkpoint commits, quality-gate checks, GREEN verification, optional reviewer skip, and runtime-state advancement while still consuming captured worker outputs. |
| `node .opencode/scripts/workflow-runner.mjs --target <plan-id> --run-plan --json` | Deterministic plan runner; sequences review/ready tickets through the runner-owned ticket path and gates plan completion on impacted-spec regression. |
| `node .opencode/scripts/workflow-runner.mjs --target <ticket-id> --run-green --json` | Deterministic official GREEN rerun for the recorded RED test; replaces `sdet MODE: run-green`. |
| `node .opencode/scripts/workflow-runner.mjs --target <ticket-id> --validate-worker-output <sdet-red|developer-green|developer-refactor|reviewer> --output-file <path> --json` | Deterministic contract validator for one worker final message before the FSM advances. |

Direct `developer`, `sdet`, and `reviewer` commands are debug-only for normal users.

## Runtime Modes

- Default plan mode: up to 3 independent ready tracer tickets run in parallel as orchestrator tasks, each with an isolated worktree, branch, Compose project, host-port slot, Playwright base URL, and `.opencode/state/`. Tickets with unmet `depends_on` prerequisites wait for a later batch. Completed ticket branches require explicit serialized integration before plan regression; do not assume implicit auto-merge.
- Default ticket mode: one orchestrator task, one checkout/worktree, one long-lived dev stack, one Playwright base URL.
- Parallel isolation details are in `docs/adr/0003-ticket-and-workflow-workspaces.md` and `.opencode/knowledge/runbook.md`.

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
| `.opencode/state/worker-outputs/` | Ignored captured worker final messages for runner ingestion. |
| `.opencode/logs/workflow-runs/*.jsonl` | Ignored deterministic runner telemetry for mutating runner invocations. |
| `.opencode/state.example/*.json` | Tracked example runtime state shapes. |

Runtime state uses the schema version required by the orchestrator skill.

## Restart Note

OpenCode loads commands, agents, skills, and config at startup. After changing files under `.opencode/commands/`, `.opencode/agents/`, `.opencode/skills/`, or `.opencode/opencode.json`, quit and restart OpenCode.
