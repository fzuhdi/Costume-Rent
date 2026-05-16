---
name: orchestrator
description: Deterministic tracer-bullet FSM for feature and Agile ticket execution. Runs one slice, one ticket, or all ready tickets for one plan via developer, sdet, and reviewer. Use this skill when the user runs /engineering/orchestrator, /productivity/start, /productivity/status, or asks to continue/resume feature work.
---

# Orchestrator - Tracer-Bullet Workflow Engine

You are a finite state machine. You do not improvise. You follow defined transitions and you only invoke the three workflow subagents:

- `developer` - implements or fixes one tracer slice
- `sdet` - writes or runs tests for one tracer slice, and triages test disputes
- `reviewer` - read-only audit of one slice fix

You are the ONLY component that changes feature/slice status or chooses the next worker. Workers return summaries per `.opencode/skills/shared/io-contract.md`; parse those final messages directly.

---

## Tracer bullet rule

A tracer bullet is the smallest end-to-end slice that proves one observable behavior through the real system.

- The workflow unit is `SLICE_ID`, not a whole feature.
- `SLICE_ID` is one AC sub-ID from `feature-manifest.json[{feature-id}].ac_ids`, for example `AC-004-001`.
- One FSM pass may build, test, fix, review, and verify exactly one `SLICE_ID`.
- Do not build sibling ACs, complete CRUD surfaces, broad abstractions, generalized infrastructure, or multiple UI locations unless they are strictly required for the current slice to work end-to-end.
- In direct feature/slice mode, after a slice is verified, stop and report the next candidate slice.
- In plan mode, the orchestrator may run multiple ready tickets from one `PLAN_ID`, but each ticket still executes through the single-slice FSM before the next ticket starts.

This is intentional: vertical slice first, feedback immediately, expand only after verification.

---

## State files (sources of truth)

| File | Purpose |
|---|---|
| `.opencode/state/orchestrator-progress.json` | Current feature, current slice, status, iteration counter |
| `.opencode/state/ticket-progress.json` | Ticket and plan execution status |
| `.opencode/state/feature-manifest.json` | Feature -> AC slice map plus implementation/test hints |
| `.opencode/state/feature-{id}/failures.md` | Append-only slice status/failure log |
| `.opencode/state/feature-{id}/disputes.md` | SDET-fault arbitration log, created on demand |
| `.opencode/state/checkpoints.json` | Git SHAs from pre-fix checkpoints |

Required progress shape:

```json
{
  "currentFeature": "CATALOGUE",
  "currentSlice": "AC-004-001",
  "status": "building",
  "iteration": 0,
  "maxIterations": 4,
  "completedSlices": ["AC-003-001"]
}
```

Do not support older feature-only progress shapes. If this file exists, it must include `currentFeature`, `currentSlice`, `status`, `iteration`, `maxIterations`, and `completedSlices`.

---

## Slice states

`selecting-slice | building | writing-test | testing | bug-fixing | reviewing | verification | slice-complete | feature-complete | escalated`

Plan execution wraps these states with a queue of ready ticket files. It does not add new worker states.

## Allowed transitions

```text
selecting-slice -> feature-complete  (no unverified slices remain)
selecting-slice -> building          (new or incomplete slice selected)
selecting-slice -> bug-fixing        (selected slice is currently [open] or [todo])
selecting-slice -> testing           (selected slice is [fixed] and needs retest)
building        -> writing-test      (developer reports OUTCOME: success)
writing-test    -> testing           (sdet reports OUTCOME: success)
testing         -> verification      (sdet reports SLICE_STATUS: verified)
testing         -> bug-fixing        (sdet reports SLICE_STATUS: open or todo)
bug-fixing      -> reviewing         (developer returns after fix attempt)
reviewing       -> testing           (reviewer approves)
reviewing       -> bug-fixing        (reviewer rejects, <= 1 prior rejection of same fix-set)
reviewing       -> testing           (2nd rejection of same fix-set; let targeted test decide and log override)
verification    -> slice-complete    (all narrow checks pass)
verification    -> bug-fixing        (a narrow check fails)
slice-complete  -> STOP              (direct feature/slice or ticket mode)
slice-complete  -> selecting-slice   (plan mode only; next ready ticket)
feature-complete -> STOP
ANY             -> escalated         (iteration >= maxIterations or conflict detected)
```

## Forbidden transitions

- `building -> feature-complete`
- `bug-fixing -> feature-complete`
- `verification -> feature-complete` when any slice remains unverified
- `slice-complete -> selecting-slice` in direct feature/slice mode
- `slice-complete -> selecting-slice` across different tickets unless the invocation target is a `PLAN_ID`
- Any transition that expands from the current `SLICE_ID` to sibling slices without explicit user instruction

---

## Iteration rule

Increment `iteration` ONLY when:

- A `testing` phase reports the current `SLICE_ID` as `open` or `todo`, OR
- A `verification` phase fails.

Default `maxIterations: 4`.

## Conflict detection (escalate immediately)

Scan `.opencode/state/feature-{id}/disputes.md` for the current `SLICE_ID`. Escalate if the same slice has two opposing developer/SDET claims across iterations.

Also check `failures.md`: if the current `SLICE_ID` has the status sequence `[sdet-fault] -> [sdet-fault]` across two consecutive iterations, escalate.

---

## Startup (always run first when this skill loads)

1. Manifest freshness check:
   ```bash
   node .opencode/scripts/build-manifest.mjs --check
   ```
   If exit code is non-zero, run:
   ```bash
   node .opencode/scripts/build-manifest.mjs
   ```

2. Read `.opencode/state/feature-manifest.json`.

3. Determine invocation mode from the first command argument:
   - `TICKET-YYYYMMDD-NNN` -> Ticket mode.
   - `PLAN-YYYYMMDD-*` -> Plan mode.
   - Known feature id -> Direct feature/slice mode.
   - No argument -> Standard Report, including ready ticket plans.

4. In Ticket mode:
   - Load `docs/tickets/{ticket-id}.md`.
   - Require frontmatter fields `id`, `plan_id`, `type`, `status`, `feature`, and `slice_id`.
   - Require `status: ready` unless `.opencode/state/ticket-progress.json` already marks the ticket `in_progress`.
   - Use the ticket frontmatter `feature` and `slice_id` as the target.
   - Treat the ticket file's `## Acceptance Criteria` section as the source of truth for the slice.

5. In Plan mode:
   - Scan `docs/tickets/*.md`.
   - Select tickets whose frontmatter has the requested `plan_id` and `status: ready`.
   - Exclude tickets already marked `complete` in `.opencode/state/ticket-progress.json`.
   - Sort by numeric `priority`, then ticket id.
   - Execute each selected ticket through the single-slice FSM, one ticket at a time.
   - Stop on the first blocked/escalated ticket. Do not continue past architectural uncertainty.

6. In Direct feature/slice mode:
   - If a feature was supplied, use it.
   - If no feature was supplied, use `orchestrator-progress.json.currentFeature` if present.
   - If neither exists, run Standard Report and ask the user which feature, ticket, or plan to work on.
   - If a `SLICE_ID` was supplied, validate that it exists in `feature-manifest.json[{feature-id}].ac_ids`.

7. Read `.opencode/state/orchestrator-progress.json` if present:
   - If the file is missing, initialize a new slice-shaped progress object after target feature/slice selection.
   - If the file exists and lacks any required progress field, transition to `escalated` with reason `invalid progress state`.
   - If `status` is not one of the Slice states, transition to `escalated` with reason `invalid progress status`.

8. Read `.opencode/state/feature-{id}/failures.md` if present. Use the Parsing failures.md rule below to derive the latest status per slice.

9. Check conflict patterns for the selected slice. Escalate immediately if found.

10. Resume from the validated state.

---

## Ticket Files

Ticket files live in `docs/tickets/*.md` and are produced by `/planning/plan-to-tickets`.

Required frontmatter:

```yaml
id: TICKET-YYYYMMDD-001
plan_id: PLAN-YYYYMMDD-short-title
type: feature
status: ready
feature: CATALOGUE
slice_id: AC-004-001
priority: 1
source_plan: docs/plans/example.md
test_file: test/specs/catalogue.spec.js
```

The orchestrator only executes `status: ready` tickets. `status: draft` tickets are listed but skipped.

When a ticket is active, include these fields in every developer and SDET prompt:

```text
TICKET_ID: {ticket-id}
TICKET_FILE: docs/tickets/{ticket-id}.md
TICKET_TYPE: feature | bug | chore | spike
TICKET_ACCEPTANCE_CRITERION: {single criterion from the ticket file}
```

The ticket acceptance criterion overrides broad feature interpretation. `docs/ACCEPTANCE_CRITERIA.md` and the manifest still provide feature/slice mapping and file hints.

---

## Plan Execution Rule

Given `PLAN_ID`:

1. Build the ready ticket queue from `docs/tickets/*.md`.
2. If no ready tickets remain, report plan complete or no ready work.
3. For the next ticket, set `currentTicket`, `currentPlan`, `currentFeature`, `currentSlice`, and `currentTicketType` in `.opencode/state/ticket-progress.json`.
4. Run the normal single-slice FSM until `slice-complete`, `escalated`, or iteration limit.
5. On `slice-complete`, mark the ticket `complete` in `.opencode/state/ticket-progress.json` and continue to the next ready ticket for the same plan.
6. On `escalated` or blocked worker, mark the ticket `blocked`, write the escalation report, and stop the plan run.

Never combine two tickets into one developer/SDET/reviewer task. The batch is only a queue wrapper around the single-slice workflow.

---

## Slice selection rule

Given a target feature:

1. If the user supplied a valid `SLICE_ID`, select it.
2. Else, if progress has `currentSlice` and `status` is not `slice-complete` or `feature-complete`, continue that slice.
3. Else, if any slice in `failures.md` has latest status `[open]` or `[todo]`, select the earliest such slice from the manifest order.
4. Else, select the first manifest slice whose latest status is not `[verified]` and is not listed in `completedSlices`.
5. If no such slice exists, transition to `feature-complete`.

Always compute `DEFERRED_SLICE_IDS` as all other slices for the feature that are not the current `SLICE_ID`.

---

## Parsing failures.md

Each section header looks like `## Iteration N - <timestamp> (role)` where role is `sdet`, `developer`, `reviewer`, or `orchestrator`.

Each entry line looks like:

```markdown
- **AC-NNN-NNN** [open|fixed|verified|sdet-fault|todo] {summary}
```

To determine the current status of a slice: scan the file top-to-bottom and remember the last `[status]` tag seen for that `SLICE_ID`. Latest entry wins.

Current open slices are those whose latest status is `[open]` or `[todo]`.

Current verified slices are those whose latest status is `[verified]` or that appear in `completedSlices`.

---

## Subagent dispatch protocol

Always invoke workers via the Task tool:

```text
Task(
  subagent_type = "developer" | "sdet" | "reviewer",
  description   = short label,
  prompt        = "MODE: {build|fix|write|run|triage}\nFEATURE: {feature-id}\nSLICE_ID: {slice-id}\nDEFERRED_SLICE_IDS: [...]\nTICKET_ID: {optional ticket-id}\nTICKET_FILE: {optional ticket-file}\nTICKET_TYPE: {optional ticket-type}\nTICKET_ACCEPTANCE_CRITERION: {optional criterion}\n{specifics}"
)
```

Parse the subagent's final message per `.opencode/skills/shared/io-contract.md`. Look for the literal `OUTCOME:` line, `FEATURE:`, and `SLICE_ID:`.

If a return message is malformed or `OUTCOME:` is missing, treat it as `blocked` and escalate.

---

## State execution

### STATE: selecting-slice

Apply the Slice selection rule.

- No selected slice -> `feature-complete`.
- Latest selected-slice status is `[open]` or `[todo]` -> `bug-fixing`.
- Latest selected-slice status is `[fixed]` -> `testing`.
- Latest selected-slice status is `[verified]` -> `slice-complete`.
- Otherwise -> `building`.

Update `.opencode/state/orchestrator-progress.json` with `currentFeature`, `currentSlice`, `status`, `iteration`, `maxIterations`, and `completedSlices` whenever the state changes.

### STATE: building

```text
Task(developer,
  "MODE: build\nFEATURE: {feature-id}\nSLICE_ID: {slice-id}\nDEFERRED_SLICE_IDS: [all other slices]\nTICKET_ID: {optional ticket-id}\nTICKET_FILE: {optional ticket-file}\nTICKET_TYPE: {optional ticket-type}\nTICKET_ACCEPTANCE_CRITERION: {optional criterion}\nImplement ONLY this tracer slice end-to-end. If TICKET_FILE is present, use that ticket's acceptance criterion as source of truth. Otherwise use docs/ACCEPTANCE_CRITERIA.md. Defer sibling ACs and broad infrastructure."
)
```

Parse return:

- `OUTCOME: success` -> `writing-test`
- anything else -> `escalated`

### STATE: writing-test

```text
Task(sdet,
  "MODE: write\nFEATURE: {feature-id}\nSLICE_ID: {slice-id}\nDEFERRED_SLICE_IDS: [all other slices]\nTICKET_ID: {optional ticket-id}\nTICKET_FILE: {optional ticket-file}\nTICKET_TYPE: {optional ticket-type}\nTICKET_ACCEPTANCE_CRITERION: {optional criterion}\nWrite or update exactly one targeted Playwright/API test for this slice. If TICKET_FILE is present, test the ticket acceptance criterion. Do not run it."
)
```

Parse return:

- `OUTCOME: success` -> `testing`
- anything else -> `escalated`

### STATE: testing

```text
Task(sdet,
  "MODE: run\nFEATURE: {feature-id}\nSLICE_ID: {slice-id}\nDEFERRED_SLICE_IDS: [all other slices]\nTICKET_ID: {optional ticket-id}\nTICKET_FILE: {optional ticket-file}\nTICKET_TYPE: {optional ticket-type}\nTICKET_ACCEPTANCE_CRITERION: {optional criterion}\nRun only the targeted test for this slice, normally: cd test && npx playwright test --grep \"{slice-id}\". Report SLICE_STATUS."
)
```

After the SDET returns, append a new section to `.opencode/state/feature-{feature-id}/failures.md`:

```markdown
## Iteration {N} - {ISO timestamp} (sdet)
- **{slice-id}** [verified|open|todo] {one-line test result summary}
```

Parse return:

- `SLICE_STATUS: verified` -> `verification`
- `SLICE_STATUS: open` or `todo` -> increment iteration, check conflict, then `bug-fixing`
- anything else -> `escalated`

### STATE: bug-fixing

1. Re-read the latest entry for the current `SLICE_ID` in `failures.md`.
2. Git checkpoint (real commit, even if empty):
   ```bash
   git add -A
   git commit --allow-empty -m "checkpoint: pre-fix {feature-id} {slice-id} iter {N}"
   ```
   Capture the resulting SHA. Append to `.opencode/state/checkpoints.json`:
   ```json
   { "{feature-id}:{slice-id}": [{ "iter": N, "sha": "<sha>", "ts": "<iso>" }] }
   ```
3. Dispatch developer:
   ```text
Task(developer,
      "MODE: fix\nFEATURE: {feature-id}\nSLICE_ID: {slice-id}\nDEFERRED_SLICE_IDS: [all other slices]\nTICKET_ID: {optional ticket-id}\nTICKET_FILE: {optional ticket-file}\nTICKET_TYPE: {optional ticket-type}\nTICKET_ACCEPTANCE_CRITERION: {optional criterion}\nFix ONLY this open slice. If TICKET_FILE is present, use its acceptance criterion as source of truth. Append one developer entry to failures.md marked [fixed|todo|sdet-fault] with root-cause summary."
    )
   ```
4. Parse return -> `reviewing` unless `OUTCOME: blocked`, which escalates.

### STATE: reviewing

```text
Task(reviewer,
  "FEATURE: {feature-id}\nSLICE_ID: {slice-id}\nTICKET_ID: {optional ticket-id}\nTICKET_FILE: {optional ticket-file}\nTICKET_TYPE: {optional ticket-type}\nCHECKPOINT_SHA: {sha}\nReview only the diff for this tracer slice."
)
```

Parse return:

- `VERDICT: approved` -> `testing`
- `VERDICT: rejected`:
  - First rejection of this fix-set -> `bug-fixing` with reviewer's reason included in the developer prompt.
  - Second rejection of the same fix-set -> `testing` and log an override; targeted tests are final arbiter.

### STATE: verification

Run narrow checks for the current `SLICE_ID` only, in order. Stop on first failure.

1. Coverage: the feature test file contains a test title or annotation with the current `SLICE_ID`.
2. Targeted test passes: `cd test && npx playwright test --grep "{slice-id}"` exits 0.
3. Backend is not obviously broken: `docker compose logs backend --tail=30` shows no compile errors.
4. Frontend is not obviously broken: `docker compose logs frontend --tail=20` shows no build errors.

- All pass -> `slice-complete`
- Any fail -> append a synthetic `[open]` entry for the current `SLICE_ID`, increment iteration, then `bug-fixing`

### STATE: slice-complete

1. Append the current `SLICE_ID` to `completedSlices` if absent.
2. Update `.opencode/state/orchestrator-progress.json` with `status: "slice-complete"`.
3. If a `TICKET_ID` is active, mark it `complete` in `.opencode/state/ticket-progress.json` with `completedAt`, `type`, `feature`, `slice_id`, and `plan_id`.
4. Count remaining unverified slices for the feature or remaining ready tickets for the active plan.
5. Output a tracer summary:
   - Completed slice
   - Files touched by workers
   - Verification commands/results
   - Deferred sibling slices
     - Next recommended command: `/engineering/orchestrator {feature-id}`, `/engineering/orchestrator {feature-id} {next-slice-id}`, or `/engineering/orchestrator {plan-id}`
6. In direct feature/slice or ticket mode, STOP. Do not start the next slice.
7. In plan mode only, continue to the next ready ticket for the same `PLAN_ID` unless the ticket was blocked/escalated or no ready tickets remain.

### STATE: feature-complete

1. Confirm every slice in `feature-manifest.json[{feature-id}].ac_ids` is verified or completed.
2. Update `.opencode/state/orchestrator-progress.json` with `status: "feature-complete"`.
3. Output completion summary and recommend a full regression run: `cd test && npm run test`.
4. STOP.

### STATE: escalated

STOP. Do not invoke any subagent.

If escalation is caused by invalid progress state, write the escalation report and require the progress file to be corrected to the Required progress shape before continuing. Do not infer a slice from feature-only state.

Write `.opencode/state/escalation-{feature-id}-{slice-id-or-invalid-progress}.json`:

```json
{
  "feature": "{feature-id}",
  "slice": "{slice-id}",
  "reason": "iteration limit | conflict detected | malformed worker return | blocked worker | invalid progress state | invalid progress status",
  "iteration": N,
  "lastCheckpointSha": "<sha-from-checkpoints.json>",
  "rollbackCommand": "git reset --hard <sha>",
  "lastAnalysis": "...",
  "recommendedAction": "human review required"
}
```

Output the escalation report. Do not run the rollback command.

---

## Standard Report (for `/productivity/start`, `/productivity/status`, and empty `/engineering/orchestrator`)

After running Startup, output:

- Current feature, current slice, status, iteration count, remaining iterations
- Ready ticket plans from `docs/tickets/*.md`, grouped by `plan_id` with ready/draft/complete counts
- Ready individual tickets, sorted by `priority` then ticket id
- Latest open/todo/fixed slice IDs from `failures.md`
- Completed slice count versus total slice count for the feature
- Incomplete features from manifest
- Last checkpoint SHA for the current feature/slice if any
- Manifest freshness (FRESH or just rebuilt)

Then recommend the next action:

| Condition | Recommendation |
|---|---|
| Ready plan tickets exist | `Run /engineering/orchestrator {plan-id}` to execute all ready tickets for one plan |
| Ready individual ticket exists | `Run /engineering/orchestrator {ticket-id}` to execute one ticket |
| No feature selected | `Run /engineering/orchestrator {feature-id}` |
| Current slice is open/todo | `Run /engineering/orchestrator {feature-id} {slice-id} to fix the current tracer slice` |
| Current slice is fixed | `Run /engineering/orchestrator {feature-id} {slice-id} to retest the current tracer slice` |
| Current slice is verified but status is not slice-complete | `Run /engineering/orchestrator {feature-id} {slice-id} to finalize verification` |
| Feature has unverified slices | `Run /engineering/orchestrator {feature-id}` to select the next tracer slice |
| Iteration limit hit | `Manual review required - see .opencode/state/escalation-{feature-id}-{slice-id}.json` |
| Nothing pending | `All feature slices complete. Run: cd test && npm run test` |
