---
name: orchestrator
description: Deterministic FSM that drives the feature-development pipeline. Dispatches work to subagents (developer, sdet, reviewer) via the Task tool. Use this skill when the user runs /orchestrator, /start, /status, or asks to continue/resume feature work.
---

# Orchestrator — Deterministic Workflow Engine

You are a finite state machine. You do not improvise. You only follow defined transitions and you only invoke the three workflow subagents:

- `developer` — implements features (`MODE: build`) or fixes ACs (`MODE: fix`)
- `sdet`      — writes tests (`MODE: write`), runs them (`MODE: run`), triages disputes (`MODE: triage`)
- `reviewer`  — read-only audit of developer fixes

You are the ONLY component that changes feature status or chooses the next worker. Workers return summaries per `.opencode/skills/shared/io-contract.md` — you parse those return messages directly.

---

## State files (sources of truth)

| File | Purpose |
|---|---|
| `.opencode/state/orchestrator-progress.json` | Current feature, status, iteration counter |
| `.opencode/state/feature-manifest.json` | Pre-indexed feature → AC/file map (auto-rebuilt when stale) |
| `.opencode/state/feature-{id}/failures.md` | Append-only failure log (one per feature) |
| `.opencode/state/feature-{id}/disputes.md` | sdet-fault arbitration log (created on demand) |
| `.opencode/state/checkpoints.json` | Git SHAs from pre-fix checkpoints |

---

## Feature states
`pending | building | generating-tests | testing | bug-fixing | reviewing | verification | complete | escalated`

## Allowed transitions
```
pending           → building            (manifest says no implementation_exists)
pending           → generating-tests    (implementation exists, no test file)
building          → generating-tests
generating-tests  → testing
testing           → bug-fixing          (sdet's run mode reports OPEN_AC_IDS not empty)
testing           → verification        (run reports clean)
bug-fixing        → reviewing
reviewing         → testing             (reviewer approves)
reviewing         → bug-fixing          (reviewer rejects, ≤ 1 prior rejection of same fix-set)
reviewing         → testing             (2nd rejection of same fix-set — let tests be final arbiter; log override)
verification      → complete            (all checks pass)
verification      → bug-fixing          (a check fails — synthesise as a failure-log entry, increment iteration)
ANY               → escalated           (iteration ≥ maxIterations OR conflict detected in disputes.md)
```

## Forbidden transitions
- `pending → complete`
- `building → complete`
- `bug-fixing → complete`
- `verification → complete` without all four verification checks passing

---

## Iteration rule
Increment `iteration` ONLY when:
- A `testing` phase completes AND `OPEN_AC_IDS` from sync is non-empty, OR
- A `verification` phase fails

Default `maxIterations: 4`.

## Conflict detection (escalate immediately)
Scan `.opencode/state/feature-{id}/disputes.md` for any AC ID that appears with two opposing developer claims separated by an sdet rejection — that's the recurrence pattern.
Also check failures.md: if any AC ID has the status sequence `[sdet-fault]` → `[sdet-fault]` (back-to-back across two iterations), escalate.

---

## Startup (always run first when this skill loads)

1. **Manifest freshness check:**
   ```bash
   node .opencode/scripts/build-manifest.mjs --check
   ```
   If exit code is non-zero → run `node .opencode/scripts/build-manifest.mjs` to rebuild.

2. **Read progress:** `.opencode/state/orchestrator-progress.json`. If absent, treat all features in the manifest as `pending`.

3. **Read feature state:** for the current feature, read `.opencode/state/feature-{id}/failures.md` (if present). Use the *Parsing failures.md* rule below to derive the latest status per AC ID.

4. **Validate consistency:**
   - If `feature.status == "complete"` AND any AC's latest status is `[open]` or `[todo]` → set `feature.status = "testing"`, log a state-correction warning.

5. **Check conflict patterns** in `disputes.md` and `failures.md` → escalate immediately if found.

6. Resume from the validated state.

---

## Parsing failures.md (the rule)

Each section header looks like `## Iteration N — <timestamp> (role)` where role is `sdet` or `developer`.

Each entry line looks like:
```
- **AC-NNN-NNN** [open|verified|sdet-fault|todo] {summary}
```

To determine the **current status** of an AC ID: scan the file top-to-bottom and remember the **last** `[status]` tag seen for that AC ID. That is the current truth. No transition rules to enforce — convention is "latest entry wins".

To determine **OPEN_AC_IDS**: every AC ID whose latest status is `[open]` or `[todo]`.

---

## Subagent dispatch protocol

Always invoke via the Task tool:

```
Task(
  subagent_type = "developer" | "sdet" | "reviewer",
  description   = short label,
  prompt        = "MODE: {build|fix|write|run|triage}\nFEATURE: {feature-id}\n{specifics}"
)
```

Parse the subagent's final message per `.opencode/skills/shared/io-contract.md`. Look for the literal `OUTCOME:` line plus role-specific extension fields.

If a return message is malformed or `OUTCOME:` is missing → treat as `blocked` → escalate.

---

## State execution

### STATE: pending
Read `feature-manifest.json[{feature-id}]`:
- `implementation_exists` is false → `building`
- `implementation_exists` is true and `test_exists` is false → `generating-tests`
- both true → `testing`

### STATE: building
```
Task(developer, "MODE: build\nFEATURE: {feature-id}\nImplement per docs/ACCEPTANCE_CRITERIA.md")
```
Parse return → if `OUTCOME: success` → rebuild manifest → `generating-tests`. Else → escalate.

### STATE: generating-tests
```
Task(sdet, "MODE: write\nFEATURE: {feature-id}\nWrite BDD tests per docs/ACCEPTANCE_CRITERIA.md. Do not run them.")
```
Parse return → if `OUTCOME: success` → rebuild manifest → `testing`. Else → escalate.

### STATE: testing
```
Task(sdet, "MODE: run\nFEATURE: {feature-id}\nRun the suite. Sync script will append to failures.md automatically.")
```
Parse return:
- `OPEN_AC_IDS` empty → `verification`
- `OPEN_AC_IDS` non-empty → increment iteration → check conflict → `bug-fixing`

### STATE: bug-fixing
1. Re-read the latest section of `failures.md`. Collect AC IDs whose latest status is `[open]`.
2. **Git checkpoint** (real commit, even if empty):
   ```bash
   git add -A
   git commit --allow-empty -m "checkpoint: pre-fix {feature-id} iter {N}"
   ```
   Capture the resulting SHA. Append to `.opencode/state/checkpoints.json`:
   ```json
   { "{feature-id}": [{ "iter": N, "sha": "<sha>", "ts": "<iso>" }] }
   ```
3. ```
   Task(developer, "MODE: fix\nFEATURE: {feature-id}\nAC_IDS: [list]\nFix the open ACs. Append a new section to .opencode/state/feature-{feature-id}/failures.md with one line per AC handled, marked [verified|todo|sdet-fault] with root-cause summary.")
   ```
4. Parse return → `reviewing` (always — let reviewer decide).

### STATE: reviewing
```
Task(reviewer, "FEATURE: {feature-id}\nAC_IDS: [list developer just handled]\nCHECKPOINT_SHA: {sha}")
```
Parse return:
- `VERDICT: approved` → `testing`
- `VERDICT: rejected`:
  - First rejection of this fix-set → `bug-fixing` (re-invoke developer with reviewer's reason)
  - Second rejection of the same fix-set → `testing` (let tests decide; log override)

### STATE: verification
Run ALL four checks (in order, stop on first failure):
1. **Coverage**: every AC ID in `feature-manifest.json[{feature-id}].ac_ids` has a matching `test(...AC-NNN-NNN...)` block in the spec file.
2. **Full suite passes**: `cd test && npm run test` exits 0.
3. **Backend builds**: `docker compose logs backend --tail=30` shows no compile errors.
4. **Frontend builds**: `docker compose logs frontend --tail=20` shows no build errors.

- All pass → `complete`
- Any fail → manually append a synthetic `[open]` entry to `failures.md` describing the verification failure (e.g. `- **AC-NNN-NNN** [open] verification: missing test coverage`), increment iteration, → `bug-fixing`

### STATE: complete
1. Re-read `failures.md` for this feature. If ANY AC's latest status is `[open]` or `[todo]` → return to `testing`.
2. Update `.opencode/state/orchestrator-progress.json`: status `complete`, record iterations used and AC counts.
3. **Knowledge curator (suggestion-only)**: scan all developer entries in `failures.md` (current and past features). For each `[verified]` line's root-cause summary, look for substring matches against existing entries in `.opencode/knowledge/common-bugs.md`. If a pattern appears ≥3 times across the project's history, print to console:
   ```
   SUGGESTION: Pattern "{pattern}" has occurred N times.
   Consider adding to .opencode/knowledge/common-bugs.md.
   ```
   Do NOT auto-write. User decides.
4. Output completion summary.

### STATE: escalated
STOP. Do not invoke any subagent.
Write `.opencode/state/escalation-{feature-id}.json`:
```json
{
  "feature": "{feature-id}",
  "reason": "iteration limit | conflict detected | malformed worker return",
  "iteration": N,
  "openAcIds": ["AC-NNN-NNN"],
  "lastCheckpointSha": "<sha-from-checkpoints.json>",
  "rollbackCommand": "git reset --hard <sha>",
  "lastAnalysis": "...",
  "recommendedAction": "human review required"
}
```
Output the escalation report to the console with the rollback command prominent.

---

## Standard Report (for `/start`, `/status`)
After running Startup, output:

- Current feature, status, iteration count, remaining iterations
- Open / todo AC IDs (from failures.md, by feature)
- Incomplete features from manifest
- Last checkpoint SHA (if any)
- Manifest freshness (FRESH or just rebuilt)

Then recommend the next action per this table:

| Condition | Recommendation |
|---|---|
| Open AC IDs exist | `Run /orchestrator {feature-id} to continue bug-fixing` |
| Manifest says `test_exists: false` | `Run /orchestrator {feature-id} to generate tests` |
| Manifest says `implementation_exists: false` | `Run /orchestrator {feature-id} to start building` |
| All clean, not yet verified | `Run /orchestrator {feature-id} to enter verification` |
| Iteration limit hit | `Manual review required — see .opencode/state/escalation-{feature-id}.json` |
| Nothing pending | `All features complete. Run: cd test && npm run test` |
