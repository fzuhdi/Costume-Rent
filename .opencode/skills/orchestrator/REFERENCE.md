# Orchestrator Reference

This reference preserves the strict-TDD module details while `SKILL.md` stays small enough for active dispatch.

## Source Files

| File | Purpose |
|---|---|
| `.opencode/project.json` | Project adapter, workflow modes, roots, commands, artifacts, runtime, and permissions. |
| `.opencode/state/orchestrator-progress.json` | Authoritative active-run phase, ticket, branch, checkpoints, and RED evidence. |
| `.opencode/state/ticket-progress.json` | Plan/ticket summary, audit evidence, and PR post-step state. |
| `.opencode/state/checkpoints.json` | Checkpoint SHA ledger. |
| `.opencode/state/test-case-manifest.json` | Acceptance test case map. |
| `.opencode/state/worker-outputs/` | Ignored captured worker final messages consumed by `--ingest-worker-output`. |
| `.opencode/logs/workflow-runs/*.jsonl` | Ignored runner telemetry for mutating invocations. |
| `.opencode/state.example/*.json` | Tracked example runtime state shapes. |

Runtime state uses `schemaVersion: 2`. Missing runtime state may be initialized from examples. Unknown, old, or malformed state blocks; do not migrate it silently.

## Strict TDD States

`idle | selecting-ticket | ticket-audit | red-writing | red-validating | red-arbitrating | already-green-audit | green-building | green-testing | refactoring | final-review | ticket-complete | regression-gating | plan-complete | blocked | escalated`

Default `maxIterations: 4`.

Happy path:

```text
selecting-ticket -> red-writing -> red-validating -> green-building -> green-testing -> final-review -> ticket-complete
ticket-complete -> selecting-ticket     (plan mode only)
ticket-complete -> STOP                 (ticket mode)
selecting-ticket -> regression-gating   (plan mode, all executable/review tickets complete)
regression-gating -> plan-complete      (impacted specs pass)
```

Exception paths:

```text
selecting-ticket -> ticket-audit        (status: review ticket)
ticket-audit -> selecting-ticket        (ticket-ready or ticket-still-ambiguous)
red-validating -> already-green-audit   (RED passes but covers criterion)
already-green-audit -> ticket-complete  (coverage approved)
red-validating -> red-arbitrating       (wrong reason, ambiguity, or dispute)
red-arbitrating -> red-writing          (red-test-wrong)
red-arbitrating -> blocked              (ticket-ambiguous)
red-arbitrating -> green-building       (red-approved)
green-testing -> green-building         (product behavior still fails and iteration < maxIterations)
green-building -> red-arbitrating       (developer disputes RED or ticket)
green-testing -> refactoring            (GREEN passes and developer requested bounded refactor)
refactoring -> green-testing            (same recorded test rerun)
ANY -> blocked                          (clean setup/ambiguity block)
ANY -> escalated                        (malformed state, dirty disputed work, max iterations, contract failure)
```

Forbidden:

- `red-writing -> green-building` without `RED_STATUS: failing_expected`.
- Advancing the FSM on worker output that fails deterministic validation.
- Manually simulating `sdet`, `developer`, `reviewer`, or `explore`.
- Developer edits to the recorded SDET acceptance test.
- Treating a targeted run as successful when the project quality gate fails.
- Dependency edits, package-manager add/update commands, Playwright/browser installs, or runtime installers without explicit user approval.
- Continuing plan mode after a dirty or disputed blocked ticket.
- Auto-stash, auto-reset, checkout-discard, or force push.
- Marking a plan complete before impacted-spec regression passes.

## Ticket Contract

Ready executable tickets require frontmatter like:

```yaml
id: TICKET-YYYYMMDD-001
plan_id: PLAN-YYYYMMDD-short-title
type: feature
status: ready
test_case_id: FEATURE-001
priority: 1
depends_on: []
source_plan: docs/plans/example.md
red_expectation: The new acceptance test fails for the expected behavior reason.
green_expectation: The same acceptance test passes after the minimal implementation.
```

Only `type: feature | bug` tickets execute. `chore` and `spike` stay backlog records until converted into mapped executable tickets. `test_case_id` resolves feature, criterion, expected outcome, test type, spec files, and targeted command inputs through `.opencode/state/test-case-manifest.json`.

## Plan Contract

Plan mode processes, in order:

1. `status: review` tickets through `reviewer MODE: ticket-audit`.
2. Ready executable `feature`/`bug` tickets sorted by priority then id.
3. Impacted-spec regression after all review/executable tickets complete.

Ready tickets must be independently executable. Tickets with unmet `depends_on` remain deferred. Parallel plan preparation excludes blocked prerequisites and reports the blocking ticket ids.

Whole plan success means all review tickets became ready or complete, executable tickets are complete, impacted specs pass, and no review/executable ticket is blocked or escalated.

Regression failures block by default. Same-plan review bug ticket sync is opt-in via plan/runtime/user approval. Unmapped, setup, and environment-looking failures block without product bug creation.

## Worker Return Fields

Every worker returns the base fields defined in `.opencode/skills/shared/io-contract.md`.

SDET RED adds:

```text
RED_STATUS: failing_expected | already_green | failing_wrong_reason | blocked
TEST_FILE: test/specs/example.spec.js
TEST_TITLE: {title containing TEST_CASE_ID}
TEST_COMMAND: {targeted command run}
RED_FAILURE_SUMMARY: {why it failed, or why already green/blocked}
```

Developer GREEN adds:

```text
GREEN_STATUS: ready_for_green_rerun | ticket-ambiguous | red-test-wrong | blocked
ROOT_CAUSE: {one-line cause}
TARGETED_TEST_COMMAND: {command run, or not run - reason}
REFACTOR_NEEDED: yes | no
DEFERRED_TEST_CASE_IDS_UNTOUCHED: true | false
```

Reviewer adds:

```text
REVIEW_VERDICT: ticket-ready | ticket-still-ambiguous | red-test-wrong | ticket-ambiguous | red-approved | coverage-approved | coverage-rejected | approved | rejected
REASON: {plain-language explanation citing ticket/test case}
DIFF_SIZE_LINES: N | not_applicable
CHECKPOINT_SHA_REVIEWED: {sha or none}
```

Use `node .opencode/scripts/workflow-runner.mjs --target <ticket-id> --validate-worker-output <kind> --output-file <path> --json` when contract integrity needs deterministic checking outside the main ingest path.

## Branches And Commits

Require a clean worktree before ticket or plan execution. Create or resume TDD branches only after cleanliness is confirmed.

- Plan branch: `tdd/{plan-id}`.
- Ticket branch: `tdd/{ticket-id}`.
- If a branch exists, resume only when runtime state records the same plan/ticket.
- Record the base branch at branch creation and use it as PR base.

Commit messages:

- `checkpoint(tdd): pre-red <ticket-id>` may be empty.
- `test(tdd): red <ticket-id>` contains the SDET RED test.
- `test(tdd): coverage <ticket-id>` records approved already-green coverage.
- `feat(tdd): green <ticket-id>` or `fix(tdd): green <ticket-id>` contains verified GREEN app-code changes.
- `refactor(tdd): <ticket-id>` is optional and non-empty.
- `docs(tdd): block <ticket-id>` or `docs(tdd): block <plan-id>` records clean durable blocks.
- `docs(tdd): complete <plan-id>` records plan completion before PR post-steps.

## Startup And Status

Startup checks:

1. Run manifest check and rebuild only when needed.
2. Load manifest, ticket progress, orchestrator progress, and checkpoints.
3. Determine mode from target: ticket, plan, or read-only status.
4. Validate runtime schemas.
5. Validate clean worktree before branch creation/resume.

Status reports include current plan, ticket, branch, base branch, phase, iteration, last checkpoint, RED evidence, blockers, plan/ticket counts, PR state, and the safest next command.
