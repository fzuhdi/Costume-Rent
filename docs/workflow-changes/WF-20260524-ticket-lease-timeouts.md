# WF-20260524-ticket-lease-timeouts

Status: implemented

## Intent

Prevent a stuck orchestrator or nested worker from silently blocking all plan progress. The task tool does not expose a timeout/cancel parameter, so this change adds deterministic ticket lease state and coordinator guidance for manual interrupt/adopt recovery.

## Scope

- Add `.opencode/scripts/ticket-lease.mjs` for lease start/status/interrupt/timeout/inspect transitions.
- Update `.opencode/scripts/launch-parallel-plan.mjs` to create a default 60-minute lease for each prepared ticket and include `LEASE_MINUTES` plus `LEASE_DEADLINE_AT` in the orchestrator handoff prompt.
- Exclude a ready ticket from prepare when it already has a `running`, `deadline_expired`, or `interrupted` lease unless `--replace-lease` is explicitly passed after inspection. Later ready tickets can refill available slots.
- Keep `ticket-lease status` read-only; use `ticket-lease refresh` when expiry transitions should be persisted.
- Add config-level safeguards supported by the OpenCode schema: provider request timeout/chunk timeout for `opencode` and `openai`, and bounded `steps` for workflow subagents plus built-in `explore`/`general` agents.
- Update coordinator skill docs to treat deadline-expired tasks as stop conditions and require worktree inspection after interrupt.

## Non-Goals

- This does not kill a running subagent. Current task tooling has no cancellation API.
- This does not automatically reuse a worktree after interruption. The checkout must be inspected first.
- Provider `timeout`/`chunkTimeout` and agent `steps` are guardrails for model requests and agent loops; they are not wall-clock ticket cancellation.

## Recovery Flow

1. Check leases with `node .opencode/scripts/ticket-lease.mjs status --json`.
2. If a lease is `deadline_expired`, manually interrupt the blocked task wait when needed.
3. Mark the lease with `node .opencode/scripts/ticket-lease.mjs interrupted --ticket <ticket-id> --json`.
4. Classify the checkout with `node .opencode/scripts/ticket-lease.mjs inspect --ticket <ticket-id> --json`.
5. Reuse or retry only clean `retryable`/`adoptable` checkouts; preserve `orphaned_dirty` checkouts for review.
6. If retrying the same ticket after inspection, rerun prepare with `--replace-lease`.

## Validation

- `node --check .opencode/scripts/ticket-lease.mjs`
- `node --check .opencode/scripts/launch-parallel-plan.mjs`
- `node .opencode/scripts/ticket-lease.mjs status --json --dry-run`
- `node .opencode/scripts/ticket-lease.mjs refresh --json --dry-run`
- `node .opencode/scripts/launch-parallel-plan.mjs --target PLAN-20260517-staff-admin-mobile-first-ui-refresh --parallel 1 --lease-minutes 45 --dry-run --json`
- `node .opencode/scripts/test-launch-parallel-plan-leases.mjs`

## Rollback

Revert this change and remove `.opencode/state/ticket-leases.json` if it was created. Existing runtime slots and worktrees are independent of the lease registry.

## Restart Requirement

OpenCode should be restarted to reload changed coordinator skill instructions.
