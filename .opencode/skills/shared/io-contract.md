# Subagent I/O Contract

When invoked via the Task tool, every workflow subagent must end its work by returning a single final message in the format below. The orchestrator parses this directly.

## Required return format (final message)

```text
OUTCOME: success | partial | blocked
FEATURE: {feature-id}
SLICE_ID: {AC-NNN-NNN}
SUMMARY: {one-line plain-text summary}

DETAILS:
- {bullet 1}
- {bullet 2}

FILES_MODIFIED:
- path/to/file - {what changed}

NEW_DEPENDENCIES:
- {package@version} - {why}      # or "none"

NOTES:
{anything orchestrator should know: blockers, follow-ups, recommendations}
```

## Outcome semantics

- `success` - the assigned slice task is complete and ready for the next FSM transition.
- `partial` - some work was done, but the slice still needs another loop.
- `blocked` - cannot proceed without out-of-scope action; orchestrator should escalate.

## Tracer-slice semantics

- `SLICE_ID` is required for all normal workflow calls.
- A worker must operate on exactly one `SLICE_ID`.
- Sibling ACs belong in `DEFERRED_SLICE_IDS`; do not implement or test them opportunistically.
- If a dependency/foundation is needed, build the smallest version that proves the current slice and list the deferred work in `NOTES`.

## Subagent-specific extensions

### developer (build mode)

Add to DETAILS:

```text
SLICE_STATUS: implemented | partial | blocked
DEFERRED_SLICE_IDS_UNTOUCHED: true | false
```

### developer (fix mode)

Add to DETAILS:

```text
LATEST_FAILURE_SECTION: "Iteration N - <timestamp> (developer)"
SLICE_STATUS: fixed | todo | sdet-fault
ROOT_CAUSE: {one-line root cause}
TARGETED_TEST_COMMAND: {command run, or "not run - reason"}
```

Append a new section to `.opencode/state/feature-{feature-id}/failures.md` for the current slice only:

```markdown
## Iteration {N} - {ISO timestamp} (developer)
- **{SLICE_ID}** [fixed|todo|sdet-fault] {root-cause + what changed}
```

Use `[fixed]` when the code change is ready for SDET retest. Do not mark your own work `[verified]`; only the SDET/orchestrator verification loop can establish that.

### sdet (write mode)

Add to DETAILS:

```text
SLICE_TEST_WRITTEN: true | false
TEST_FILE: test/specs/{feature-id}.spec.js
TEST_TITLE: {title containing SLICE_ID}
PAGES_CREATED_OR_UPDATED: [path, ...]   # or "none"
```

### sdet (run mode)

Add to DETAILS:

```text
SLICE_STATUS: verified | open | todo
TEST_COMMAND: cd test && npx playwright test --grep "{SLICE_ID}"
TESTS_RUN: N
TESTS_PASSED: N
TESTS_FAILED: N
FAILURE_SUMMARY: {one-line failure/root symptom, or "none"}
```

Do not write `failures.md` in run mode. The orchestrator records the returned `SLICE_STATUS` in the failure log.

### sdet (triage mode)

Add to DETAILS:

```text
SLICE_STATUS: test-fixed | developer-wrong | blocked
DISPUTES_FILE_PATH: .opencode/state/feature-{feature-id}/disputes.md
TRIAGE_REASON: {one-line explanation}
```

### reviewer

Add to DETAILS:

```text
VERDICT: approved | rejected
REASON: {one-line if rejected; "fix matches root cause" if approved}
DIFF_SIZE_LINES: N
CHECKPOINT_SHA_REVIEWED: {sha}
```
