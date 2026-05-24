---
id: WF-20260524-runner-canonical-refactor
status: implemented-reviewed
owner: workflow-engineer
reviewer_mode: workflow-maintenance
---

# Runner Canonical Workflow Refactor

## Intent

Make the deterministic workflow runner the canonical execution engine, reduce manager-agent overhead, remove repeated launch friction, and block execution when workflow state drifts across plan docs, ticket frontmatter, runtime files, leases, branches, or checkpoints.

## Problems Being Fixed

- The prose orchestrator FSM and `.opencode/scripts/workflow-runner.mjs` both describe execution authority, which creates source-of-truth drift.
- Plan docs, ticket frontmatter, runtime state, checkpoints, and ticket leases can disagree while status still reports runtime consistency.
- Coordinator-managed plan execution claims serialized ticket branch integration, but integration behavior is not implemented in the runner and is not consistently permitted.
- The coordinator requires model review before every dispatch, adding user latency when configured models are already available.
- The normal path can dispatch manager agents and reviewer agents even when deterministic checks are enough.
- The workflow has no structured run ledger for phase duration, outcome, blocker, or worker role evidence.

## Scope

- Add deterministic reconciliation and expose it in status/preflight output.
- Add runner-owned task emission and worker-output ingestion entry points.
- Make model selection exception-based instead of mandatory before every dispatch.
- Clarify parallel plan integration as an explicit runner-owned/manual integration step, not implicit in ticket completion.
- Add lightweight workflow-run telemetry for deterministic runner invocations.
- Shrink and deduplicate workflow docs so durable policy points to the runner, shared constraints, coordinator reference, project adapter, and ADRs.

## Non-Goals

- Do not edit product application code under `backend/**` or `frontend/**`.
- Do not weaken acceptance-test integrity, role path boundaries, or dependency/install approval rules.
- Do not automatically resolve merge conflicts or discard dirty work.
- Do not invent model cost or token metrics that OpenCode does not expose.

## Execution Slices

1. State reconciliation and status surfacing.
   - Add `workflow-runner --reconcile --json`.
   - Compare plan summaries, ticket frontmatter, `orchestrator-progress.json`, `ticket-progress.json`, `checkpoints.json`, `ticket-leases.json`, and known branch/worktree facts where available.
   - Report drift in normal status output and block execution when drift affects the selected target.
2. Runner-owned execution entry points.
   - Add `workflow-runner --next-task --json` to emit exactly one next worker task payload.
   - Add `workflow-runner --ingest-worker-output <file> --json` as a clearer alias for validated phase advancement.
   - Keep subagents only for SDET RED, developer GREEN/refactor, reviewer audits, and optional workflow maintenance.
3. Coordinator and model-selection simplification.
   - Invoke model selection only when configured models are unavailable, the user asks, or a previous dispatch failed for model availability.
   - Keep `explore` advisory and opt-in instead of a default path.
4. Parallel plan integration semantics.
   - Stop implying completed ticket branches are automatically merged unless an integration command owns it.
   - Add explicit status/reporting for completed ticket branches awaiting integration.
   - Defer automatic merge implementation until a narrow runner-owned integration command and validation exist.
5. Observability.
   - Add an append-only JSONL run ledger under `.opencode/logs/workflow-runs/`.
   - Record run id, target, mode, phase, outcome, exit code, blocker count, worker role, and timestamps.
6. Documentation deduplication.
   - Keep durable rules in `.opencode/scripts/workflow-runner.mjs`, `.opencode/skills/shared/constraints.md`, `.opencode/skills/coordinator/REFERENCE.md`, `.opencode/project.json`, and ADRs.
   - Make README, command docs, and agent prompts point to those files instead of duplicating policy.

## Source Of Truth

- Canonical runner behavior: `.opencode/scripts/workflow-runner.mjs`.
- Project paths, commands, protected files, and quality gate: `.opencode/project.json`.
- Shared safety constraints: `.opencode/skills/shared/constraints.md`.
- Coordinator procedure and parallel handoff contract: `.opencode/skills/coordinator/REFERENCE.md`.
- Branch/workspace policy: `docs/adr/0003-ticket-and-workflow-workspaces.md`.
- This record: rationale, rollout, validation, and rollback notes for the refactor.

## Validation Plan

- `node --check .opencode/scripts/workflow-runner.mjs`
- `node --check .opencode/scripts/launch-parallel-plan.mjs`
- `node --check .opencode/scripts/ticket-lease.mjs`
- `node .opencode/scripts/build-test-case-manifest.mjs --check`
- `node .opencode/scripts/workflow-runner.mjs --json`
- `node .opencode/scripts/workflow-runner.mjs --reconcile --json`
- `node .opencode/scripts/launch-parallel-plan.mjs --target PLAN-20260517-staff-admin-mobile-first-ui-refresh --parallel 3 --dry-run --json`
- `node .opencode/scripts/test-build-worker-task.mjs`
- `node .opencode/scripts/test-workflow-runner-reconcile.mjs`
- `node .opencode/scripts/test-launch-parallel-plan-leases.mjs`
- `node .opencode/scripts/test-resolve-agent-models.mjs`
- Grep for stale unconditional model-selection, implicit auto-merge, or prose-FSM authority claims.

## Rollback Plan

- Revert this change record and the affected `.opencode/**` workflow files together.
- If runner output changes cause dispatch failures, disable the new `--next-task`, `--ingest-worker-output`, and `--reconcile` usage paths by reverting only `.opencode/scripts/workflow-runner.mjs` and affected docs.
- Runtime logs under `.opencode/logs/workflow-runs/` are append-only diagnostics and can be deleted without changing product behavior.

## Restart Requirement

Yes. OpenCode should be restarted after changes to skills, agents, commands, or `.opencode/opencode.json` are picked up.

## Validation Results

- `node --check .opencode/scripts/workflow-runner.mjs`: passed.
- `node --check .opencode/scripts/launch-parallel-plan.mjs`: passed.
- `node --check .opencode/scripts/ticket-lease.mjs`: passed.
- `node --check .opencode/scripts/resolve-agent-models.mjs`: passed.
- `node --check .opencode/scripts/test-build-worker-task.mjs`: passed.
- JSON parse for `.opencode/opencode.json`, `.opencode/project.json`, and `.opencode/workflow-models.json`: passed.
- `node .opencode/scripts/build-test-case-manifest.mjs --check`: passed (`FRESH`).
- `node .opencode/scripts/test-build-worker-task.mjs`: passed.
- `node .opencode/scripts/test-workflow-runner-reconcile.mjs`: passed; fixture proves pre-RED checkpoint initialization does not self-block the following `--next-task`, and plan regression blocks when completed ticket branches are not confirmed integrated.
- `node .opencode/scripts/test-launch-parallel-plan-leases.mjs`: passed after updating the test to use an isolated temporary workspace root and current ready-ticket expectations.
- `node .opencode/scripts/test-resolve-agent-models.mjs`: passed.
- `node scripts/quality-gate.mjs`: passed.
- `git diff --check`: passed; Git emitted line-ending normalization warnings only.
- Stale-claim grep for unconditional model selection, old orchestrator fallback wording, and implicit auto-merge claims: passed.
- `node .opencode/scripts/workflow-runner.mjs --json`: passed as read-only status and surfaced existing reconciliation drift as warnings.
- `node .opencode/scripts/workflow-runner.mjs --reconcile --json`: correctly blocked on existing runtime/document drift: stale plan summary for `TICKET-20260517-008`, stale `ticket-progress.json` statuses, missing checkpoint ledger entry for `111d839`, and expired ticket leases.
- `node .opencode/scripts/workflow-runner.mjs --target TICKET-20260517-004 --next-task --json`: correctly blocked because target-affecting reconciliation drift exists for the active ticket (`111d839` absent from checkpoints and expired lease).
- `node .opencode/scripts/workflow-runner.mjs --target PLAN-20260517-staff-admin-mobile-first-ui-refresh --json`: passed as read-only preflight and reported completed ticket branches awaiting explicit integration.
- `node .opencode/scripts/launch-parallel-plan.mjs --target PLAN-20260517-staff-admin-mobile-first-ui-refresh --parallel 3 --dry-run --json`: correctly blocked because ready tickets `TICKET-20260517-004` and `TICKET-20260517-010` have expired leases.
- `node .opencode/scripts/resolve-agent-models.mjs --dry-run --json`: passed; all currently configured role models are available, so coordinator can proceed without invoking interactive model selection.

## Review Notes

- First reviewer `MODE: workflow-maintenance` audit rejected the slice because pre-RED checkpoints were not appended to `checkpoints.json`, plan regression could proceed without explicit branch integration, ticket startup could create `ticket-progress.json`/frontmatter drift, and telemetry wrote outside orchestrator permissions.
- Follow-up fixes appended pre-RED checkpoint SHAs before checkpoint persistence, added a runner smoke test for initialization followed by `--next-task`, blocked plan regression/completion on pending integration, stopped mutating nested ticket-progress status to `in_progress` on ticket start, and granted orchestrator write permission for `.opencode/logs/workflow-runs/**`.
- Reviewer re-audit approved the refactor. Verdict: `approved`; outcome: `success`; residual live runtime drift is expected and not a defect in this refactor.
