---
name: orchestrator
description: Deterministic TDD FSM for feature/bug ticket execution. Runs one ticket or all review/ready tickets for one plan via SDET RED, developer GREEN, deterministic GREEN rerun, and reviewer audit. Use for /engineering/orchestrator, /productivity/start, /productivity/status, or continuing TDD feature work.
---

# Orchestrator - TDD Workflow Engine

You are a finite state machine. Do not improvise. The build-first workflow is removed; executable `feature` and `bug` tickets use strict TDD only.

Workers:

- `sdet` owns ticket-level acceptance RED.
- `.opencode/scripts/workflow-runner.mjs --run-green` owns official GREEN reruns.
- `developer` implements minimal GREEN and optional bounded refactor.
- `reviewer` is read-only and audits ticket readiness, invalid RED disputes, already-green coverage, and final scope/test integrity.
- `explore` may run read-only discovery in parallel with SDET RED; its result is advisory and never blocks GREEN after valid RED.

## Core Rule

One executable ticket equals one tracer bullet and exactly one `test_case_id`.

- Execute only `type: feature` or `type: bug` tickets.
- `chore` and `spike` remain backlog records unless converted into mapped feature/bug tickets.
- Plan mode is sequential. Finish RED/GREEN/REVIEW for one ticket before starting the next.
- Developer app-code editing starts only after SDET returns `RED_STATUS: failing_expected` or reviewer approves an already-green coverage test.
- Developer must not edit the SDET acceptance test. If the test or ticket appears wrong, developer returns a dispute for reviewer arbitration.

## State Files

| File | Purpose |
|---|---|
| `.opencode/state/orchestrator-progress.json` | Authoritative active-run phase, ticket, branch, checkpoints, RED evidence |
| `.opencode/state/ticket-progress.json` | Plan/ticket summary, audit evidence, and PR post-step state |
| `.opencode/state/checkpoints.json` | Checkpoint SHA ledger |
| `.opencode/state/test-case-manifest.json` | Feature -> AC test case map plus implementation/test hints |
| `.opencode/state.example/*.json` | Tracked versioned example shapes |

Runtime state must include `schemaVersion: 2`. Missing state may be initialized from examples. Existing state with missing, unknown, or old `schemaVersion` blocks with `invalid progress state`; do not migrate it. Treat `orchestrator-progress.json` as the active-run source of truth; ticket-progress and checkpoints must agree with it or the run blocks for stale-state reconciliation.

## TDD States

`idle | selecting-ticket | ticket-audit | red-writing | red-validating | red-arbitrating | already-green-audit | green-building | green-testing | refactoring | final-review | ticket-complete | regression-gating | plan-complete | blocked | escalated`

Default `maxIterations: 4`.

Allowed happy path:

```text
selecting-ticket -> red-writing -> red-validating -> green-building -> green-testing -> final-review -> ticket-complete
ticket-complete -> selecting-ticket     (plan mode only)
ticket-complete -> STOP                 (ticket mode)
selecting-ticket -> regression-gating   (plan mode, all executable/review tickets complete)
regression-gating -> plan-complete      (impacted specs pass)
```

Allowed exception paths:

```text
selecting-ticket -> ticket-audit        (status: review ticket)
ticket-audit -> selecting-ticket        (ticket-ready or ticket-still-ambiguous)
red-validating -> already-green-audit   (RED passes but covers criterion)
already-green-audit -> ticket-complete  (coverage approved)
regression-gating -> selecting-ticket   (opted-in impacted regression created same-plan review bug tickets)
red-validating -> red-arbitrating       (wrong reason, ticket ambiguity, or SDET/developer dispute)
red-arbitrating -> red-writing          (red-test-wrong)
red-arbitrating -> blocked              (ticket-ambiguous)
red-arbitrating -> green-building       (red-approved)
green-testing -> green-building         (product behavior still fails and iteration < maxIterations)
green-building -> red-arbitrating       (developer disputes RED or ticket)
green-testing -> refactoring            (deterministic GREEN pass and developer requested bounded refactor)
refactoring -> green-testing            (same recorded test rerun)
ANY -> blocked                          (clean ticket/setup/ambiguity block)
ANY -> escalated                        (malformed state, dirty disputed work, max iterations, worker contract failure)
```

Forbidden:

- `red-writing -> green-building` without `RED_STATUS: failing_expected`.
- Advancing the FSM on malformed worker output that fails deterministic contract validation.
- Manually simulating `sdet`, `developer`, `reviewer`, or `explore` when worker dispatch is unavailable or denied.
- Any developer edit to the recorded SDET acceptance test during GREEN or refactor.
- Treating a targeted test run as successful when the project-configured quality gate fails.
- Running dependency installers, package-manager add/update commands, browser installers, or runtime installers without explicit user approval.
- Continuing plan mode after a dirty/disputed blocked ticket.
- Auto-stash, auto-reset, auto-checkout discard, or force push.
- Auto-PR for partial plans.
- Marking a plan complete before impacted-spec regression passes.
- Generating same-plan regression bug tickets unless the plan, runtime state, or user explicitly opts in.

## Dependency And Installer Approval

Dependency and tool installation is user-approved setup work, not automatic repair. Follow `.opencode/skills/shared/constraints.md`: block before dependency edits, package-manager add/update commands, Playwright/browser installs, runtime installers, or cache repair commands; ask with the exact command and fallback; record approved actions in state or the final summary.

## Ticket Contract

Ticket frontmatter status enum: `draft | review | ready | in_progress | blocked | complete`.

Ready executable tickets require:

```yaml
id: TICKET-YYYYMMDD-001
plan_id: PLAN-YYYYMMDD-short-title
type: feature
status: ready
test_case_id: CATALOGUE-004
priority: 1
depends_on: []
source_plan: docs/plans/example.md
red_expectation: The new acceptance test fails for the expected product-behavior reason.
green_expectation: The same acceptance test passes after the minimal implementation.
```

`test_case_id` resolves feature, criterion, expected outcome, test type, spec files, and targeted command inputs through `.opencode/state/test-case-manifest.json`.

If ticket intent conflicts with `docs/acceptance/*.md`, block as `ticket-ambiguous`.

## Plan Contract

Plan frontmatter status enum: `draft | ready | in_progress | blocked | complete`.

Plan mode processes, in order:

1. `status: review` tickets for the plan via `reviewer MODE: ticket-audit`.
2. Approved ready `feature`/`bug` tickets sorted by priority then id.

Ready tickets must be independently executable. New tickets declare same-plan prerequisites in `depends_on`; dependent work stays `draft` until rewritten or every prerequisite ticket is complete. The parallel plan launcher excludes `ready` tickets with unmet `depends_on` and reports the blocking prerequisite ids.

Plan mode continues past clean audit-only blocks, but the whole plan does not succeed while any review/executable ticket is blocked or escalated. If RED/GREEN/refactor leaves dirty or disputed changes, stop the plan.

Whole plan success means all review tickets became ready or complete, all executable feature/bug tickets are complete, impacted-spec regression passes, and no executable/review ticket is blocked or escalated. Draft chore/spike records do not block PR creation.

Plan completion regression policy:

- Run impacted-spec regression only after all planned executable/review tickets are complete; do not run it after every ticket.
- Derive impacted specs from completed tickets' `test_case_id` values and the test-case manifest. The orchestrator or reviewer may add full spec files when the diff touches shared behavior.
- Run each impacted spec file as a full spec, not only the completed ticket grep.
- If any mapped test case in an impacted spec fails, the plan remains `in_progress` and blocks by default with evidence and rerun command.
- Mapped regression failures create or update same-plan `status: review` bug tickets only when `regression_bug_sync: true` is present in plan frontmatter, runtime state explicitly enables it, or the user explicitly approves it for this run. Deduplicate generated tickets by `test_case_id`.
- Existing/known failures in an impacted spec still block the plan. There is no baseline exemption.
- Unmapped, setup, or environment-looking failures block plan completion and do not create product bug tickets.
- Reviewer audits generated `review` bug tickets before they become executable. If reviewer rejects one as test/setup noise, block for SDET/test repair and rerun impacted regression after repair.
- After opted-in generated bug tickets complete, rerun impacted-spec regression before plan completion.
- Use runtime default `maxRegressionCycles: 3`. Exhausting the cycle budget blocks/escalates the plan with failing test case IDs and regression evidence.

## Branch And Commits

Before Ticket or Plan execution, require a clean worktree. Create or resume the TDD branch only after cleanliness is confirmed.

- Plan branch: `tdd/{plan-id}`.
- Ticket branch: `tdd/{ticket-id}`.
- If branch exists, resume only when runtime state records the same plan/ticket; otherwise block for user decision.
- Record the base branch at branch creation and use it as the PR base.

Commit messages:

- `checkpoint(tdd): pre-red <ticket-id>` may be empty.
- `test(tdd): red <ticket-id>` must include the SDET RED test.
- `test(tdd): coverage <ticket-id>` is used for already-green approved coverage.
- `feat(tdd): green <ticket-id>` or `fix(tdd): green <ticket-id>` must include GREEN app-code changes.
- `refactor(tdd): <ticket-id>` is optional and non-empty.
- `docs(tdd): block <ticket-id>` or `docs(tdd): block <plan-id>` records clean durable blocks.
- `docs(tdd): complete <plan-id>` records plan completion before auto-PR.

Create real checkpoint commits before RED and after valid RED. Record SHAs in `.opencode/state/checkpoints.json` and RED evidence in `.opencode/state/ticket-progress.json`.

## Startup

1. Run manifest check and rebuild if needed:
   ```bash
   node .opencode/scripts/build-test-case-manifest.mjs --check
   node .opencode/scripts/build-test-case-manifest.mjs
   ```
2. Load `test-case-manifest.json`, ticket progress, orchestrator progress, and checkpoints. Initialize missing runtime state from `.opencode/state.example/*.json` with `schemaVersion: 2`.
3. Determine mode:
   - `TICKET-YYYYMMDD-NNN` -> Ticket mode.
   - `PLAN-YYYYMMDD-*` -> Plan mode.
   - no argument -> Standard Report.
4. Validate runtime schemas. Unknown/old schemas block with `invalid progress state`.
5. Validate the worktree is clean before creating/resuming a TDD execution branch. Do not stash or reset.

## Dispatch Prompts

Always include:

```text
FEATURE: {feature-id}
TEST_CASE_ID: {test case-id}
DEFERRED_TEST_CASE_IDS: [...]
TICKET_ID: {ticket-id}
TICKET_FILE: docs/tickets/{ticket-id}.md
TICKET_TYPE: feature | bug
TICKET_ACCEPTANCE_CRITERION: {single criterion}
EXPECTED_OUTCOME: {manifest value}
TEST_INTERFACE: {project-configured test type}
RED_EXPECTATION: {frontmatter value}
GREEN_EXPECTATION: {frontmatter value}
```

## Quality Gate Checkpoints

Use `docs/engineering/QUALITY_GATES.md` as the gate source of truth. A successful gate is current only when no gate-relevant files changed since it ran.

- Gate-relevant changes include adapter-declared test roots, product code being reviewed, quality-gate helpers, and engineering test-policy docs.
- Record gate command, exit code, timestamp, and covered diff summary in runtime state or the final report.
- Do not rerun the broad project-configured gate solely because the FSM advanced state when a current successful gate already covers the same diff.
- If there is no current successful gate for the relevant diff, run the project-configured gate and block on failure.

## State Execution

### selecting-ticket

Ticket mode selects the requested ticket. Plan mode audits `review` tickets first, then selects the next `ready` executable ticket. Skip `draft`, `complete`, `chore`, and `spike` records.

Set runtime top-level `in_progress` values. Ticket file durable `in_progress` is optional; transient in-progress may remain runtime-only.

### ticket-audit

Invoke `reviewer MODE: ticket-audit` for `status: review` tickets.

- `REVIEW_VERDICT: ticket-ready` -> orchestrator updates ticket frontmatter to `ready` and records audit.
- `REVIEW_VERDICT: ticket-still-ambiguous` -> update ticket to `blocked`; if clean, commit `docs(tdd): block <ticket-id>`.

Reviewer never edits ticket files directly.

### red-writing

In parallel when useful:

- Invoke `sdet MODE: red` to write one primary acceptance test and run the targeted RED validation command.
- Invoke `explore` with medium thoroughness for read-only implementation discovery.

SDET must return `TEST_FILE`, `TEST_TITLE`, `RED_STATUS`, `RED_FAILURE_SUMMARY`, and `TEST_COMMAND`. Commit non-empty RED changes as `test(tdd): red <ticket-id>` when a failing expected RED is produced.

Validate worker outputs deterministically before advancing state. Use `.opencode/scripts/workflow-runner.mjs --target <ticket-id> --validate-worker-output sdet-red --output-file <path> --json` when the worker response was captured to a file or needs contract checking outside the orchestrator prompt loop.

After any SDET edit under adapter-declared test roots, ensure a current successful quality gate covers the test diff. Run the configured gate when coverage is missing or stale. If it fails, block before RED validation; do not continue to audit or GREEN.

### red-validating

Parse SDET RED result:

- `RED_STATUS: failing_expected` -> create after-RED checkpoint commit and continue to `green-building`.
- `RED_STATUS: already_green` -> `already-green-audit`.
- `RED_STATUS: failing_wrong_reason` -> `red-arbitrating`.
- `RED_STATUS: blocked` -> block ticket; if clean, persist `docs(tdd): block <ticket-id>`.

RED setup/environment failures block. Do not start GREEN. Missing dependencies or missing browser/runtime caches require explicit user approval before any install command is run.

Deterministic helper note: `.opencode/scripts/workflow-runner.mjs --target <ticket-id> --run-ticket --output-file <sdet-output> --json` may advance the happy path from `red-writing` to `green-building` once the SDET final message is captured. The runner now owns the post-RED quality-gate check, RED commit, and after-RED checkpoint recording for this path.

### already-green-audit

Ensure a current successful quality gate covers the already-green test/coverage diff before invoking reviewer. Run the configured gate when coverage is missing or stale; block on failure.

Invoke `reviewer MODE: already-green-audit`.

- `REVIEW_VERDICT: coverage-approved` -> commit `test(tdd): coverage <ticket-id>`, mark ticket complete, skip GREEN.
- `REVIEW_VERDICT: coverage-rejected` -> `red-arbitrating` or block with reason.

### red-arbitrating

Invoke `reviewer MODE: red-arbitrate` with SDET evidence and any developer dispute.

- `REVIEW_VERDICT: red-test-wrong` -> SDET rewrites RED; return to `red-writing`.
- `REVIEW_VERDICT: ticket-ambiguous` -> update ticket to `blocked`; no GREEN.
- `REVIEW_VERDICT: red-approved` -> create after-RED checkpoint if missing, then `green-building`.

### green-building

Invoke `developer MODE: green`. Pass RED artifacts and advisory explore findings if available.

Developer may run the exact recorded targeted RED command and narrow supporting commands, but `.opencode/scripts/workflow-runner.mjs --run-green` remains the official pass/fail gate. Developer may author extra tests only in existing infrastructure and never modify the SDET RED test file/title.

Parse:

- `GREEN_STATUS: ready_for_green_rerun` -> `green-testing`.
- `GREEN_STATUS: ticket-ambiguous` or `red-test-wrong` -> `red-arbitrating`.
- `GREEN_STATUS: blocked` -> blocked/escalated depending on cleanliness.

Validate developer final messages deterministically before advancing state when the response was captured to a file or contract integrity is in doubt: `.opencode/scripts/workflow-runner.mjs --target <ticket-id> --validate-worker-output developer-green --output-file <path> --json`.

Record the developer's `REFACTOR_NEEDED: yes | no` value in runtime state before deterministic GREEN rerun. Do not ask the verifier to decide refactor need.

Do not commit failed GREEN work. Commit non-empty app-code changes as `feat(tdd): green <ticket-id>` or `fix(tdd): green <ticket-id>` only after the deterministic GREEN rerun verifies the recorded RED test. This commit must happen before `final-review`; if a refactor will run, commit GREEN before entering `refactoring`.

### green-testing

Run the deterministic GREEN rerun helper. It reruns only the recorded RED test and must not edit tests or invoke a subagent.

```bash
node .opencode/scripts/workflow-runner.mjs --target <ticket-id> --run-green --json
```

The runner emits the GREEN rerun fields from `.opencode/skills/shared/io-contract.md`.

- `TEST_CASE_STATUS: verified` and recorded developer `REFACTOR_NEEDED: no` -> ensure verified GREEN changes are committed, then `final-review`.
- `TEST_CASE_STATUS: verified` and recorded developer `REFACTOR_NEEDED: yes` with no refactor used yet -> ensure verified GREEN changes are committed, then `refactoring`.
- `TEST_CASE_STATUS: verified` after the one allowed refactor pass -> ensure refactor changes are committed, then `final-review`.
- `TEST_CASE_STATUS: open` -> increment iteration; if below `maxIterations`, `green-building`, otherwise `escalated`.
- `TEST_CASE_STATUS: todo` or setup block -> blocked.

Deterministic helper note: `.opencode/scripts/workflow-runner.mjs --target <ticket-id> --run-ticket --json` may advance the happy path through `green-testing`, `refactoring`, `final-review`, and `ticket-complete` when the required worker outputs are captured to files. The runner now owns GREEN/refactor commit creation and may skip the final reviewer only when deterministic checks prove code-root-only changes since after-RED and the configured quality gate passes.

### refactoring

Invoke `developer MODE: refactor` at most once. Refactor is app-code-only, bounded, no test changes, no behavior changes. Commit non-empty changes as `refactor(tdd): <ticket-id>` before returning to `green-testing`.

### final-review

Before invoking reviewer, require a clean worktree. GREEN and refactor changes must already be committed so the reviewer can audit the full implementation diff from the after-RED checkpoint. If app/test changes are still uncommitted, block instead of invoking reviewer.

Ensure a current successful quality gate covers the implementation/test diff before final-review. Run the configured gate when coverage is missing or stale; block on failure even when targeted tests pass.

Invoke `reviewer MODE: final-review` with after-RED checkpoint SHA when deterministic reviewer-skip conditions are not satisfied.

Validate reviewer final messages deterministically before advancing state when needed: `.opencode/scripts/workflow-runner.mjs --target <ticket-id> --validate-worker-output reviewer --output-file <path> --json`.

Reviewer checks minimal scope, no sibling test cases, and no changes to the SDET RED test since after-RED. Rejection is binding; developer fixes or the ticket escalates at `maxIterations`. There is no reviewer override. If the runner proves there are only code-root changes since after-RED, the recorded RED test stayed unchanged, and the configured quality gate passes, the final reviewer may be skipped on the deterministic happy path.

### ticket-complete

Update ticket frontmatter to `complete`, update runtime state, and commit durable completion with the nearest `feat/fix/refactor/coverage` commit if not already committed. In ticket mode, stop. In plan mode, return to `selecting-ticket`.

### regression-gating

This state runs only in plan mode, after all planned review/executable tickets are complete and before durable plan completion.

Default coordinator plan launch fans out independent ready tracer tickets through `.opencode/scripts/launch-parallel-plan.mjs --parallel 3`; this orchestrator skill still owns the strict ticket FSM inside each isolated ticket worktree and the serialized integration/regression rules after ticket branches complete.

1. Ensure a current successful quality gate covers the plan diff before regression. Run the configured gate when coverage is missing or stale; block on failure.
2. Build the impacted spec list from completed ticket `test_case_id` values plus manifest/reviewer shared-impact additions.
3. Increment runtime `regression.cycle` and block/escalate if it exceeds runtime `regression.maxRegressionCycles` (default `3`).
4. Run every impacted spec as a full spec and produce Playwright JSON results. Example from `test/`:
   ```bash
   npx playwright test specs/catalogue.spec.js specs/rental.spec.js
   ```
5. If impacted specs pass, continue to `plan-complete`.
6. If impacted specs fail and regression bug sync is not explicitly enabled, block with mapped/unmapped failure evidence and the exact rerun command.
7. If impacted specs fail and regression bug sync is explicitly enabled, run:
    ```bash
    node helpers/sync-regression-bugs.mjs --plan <plan-id> --results test-results/results.json --run-command "npx playwright test <impacted-specs>"
    ```
8. The sync helper creates or updates same-plan `status: review` bug tickets and leaves the plan `in_progress`. Return to `selecting-ticket` so reviewer audits and executes generated bugs.
9. If the helper reports unmapped/setup failures, block the plan; do not create product bug tickets for untrusted failures.

Deterministic helper note: `.opencode/scripts/workflow-runner.mjs --target <plan-id> --run-plan --json` may own review-ticket audit handoff, ready-ticket sequencing, impacted-spec regression, optional regression bug sync, and plan completion for the deterministic path while still consuming captured reviewer outputs where needed.

### plan-complete

Update plan frontmatter/status summary to `complete` and commit `docs(tdd): complete <plan-id>`. This is allowed only after `regression-gating` passes.

Before plan completion, reuse the current successful quality gate from `regression-gating` when it covers the same diff. Run the configured gate only if completion edits or other gate-relevant changes made that result stale. A plan cannot be complete while the gate fails or impacted-spec regression has open failures.

Push and create PR:

```bash
git push -u origin <tdd-branch>
gh pr create --base <recorded-base-branch> --title "..." --body @'...'
```

If push or PR creation fails, keep local plan completion intact and record PR as a blocked post-step with the exact rerun command.

### blocked / escalated

If clean, persist durable blocked status and commit `docs(tdd): block <ticket-id>` or `docs(tdd): block <plan-id>`. If dirty/disputed, do not auto-reset; record runtime block, stop plan mode, and report checkpoint SHA plus rollback/recovery command.

## Standard Report

For `/productivity/start` and `/productivity/status`, report:

- Current plan, ticket, branch, and base branch.
- Current TDD phase and iteration.
- Last checkpoint SHA.
- RED test file/title/status and failure summary.
- Current blocked reason or next safest command.
- Plan/ticket counts by `draft | review | ready | in_progress | blocked | complete`.
- PR state if plan is complete but push or `gh pr create` failed.

Recommend the safest next step: resume RED validation, continue GREEN, run deterministic GREEN rerun, resolve dirty worktree, audit review tickets, run the next ready ticket, or rerun failed PR creation.

For empty `/engineering/orchestrator`, report the same runtime state plus a runnable plan launcher list:

- Existing plans with `status: ready` or `status: in_progress`.
- For each listed plan: plan id, title, current status, and a short ticket summary such as `review/ready/in_progress/blocked/complete` counts.
- The exact launch command for each plan: `/engineering/orchestrator <plan-id>`.
- Do not enumerate individual ready ticket launch commands in this mode unless the user explicitly asked for ticket-level execution choices.
- If no runnable plans exist, say so explicitly and recommend `/productivity/status` or `/plan-to-tickets` as appropriate.
