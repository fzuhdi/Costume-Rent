# Subagent I/O Contract

When invoked via the Task tool, every workflow subagent must end its work by returning a single final message in the format below. The orchestrator parses this directly — there are no `worker-done/*.json` files.

## Required return format (final message)

```
OUTCOME: success | partial | blocked
FEATURE: {feature-id}
SUMMARY: {one-line plain-text summary}

DETAILS:
- {bullet 1}
- {bullet 2}

FILES_MODIFIED:
- path/to/file — {what changed}

NEW_DEPENDENCIES:
- {package@version} — {why}      # or "none"

NOTES:
{anything orchestrator should know — blockers, follow-ups, recommendations}
```

## Outcome semantics
- `success`  — task fully done, ready for next FSM transition
- `partial`  — some work done, but loop must continue (e.g. some ACs verified, others still open)
- `blocked`  — cannot proceed without out-of-scope action; orchestrator should escalate

## Subagent-specific extensions

### developer (build mode)
Add to DETAILS:
```
AC_IDS_IMPLEMENTED: [AC-NNN-NNN, ...]
```

### developer (fix mode)
Add to DETAILS:
```
LATEST_FAILURE_SECTION: "Iteration N — <timestamp> (developer)"
AC_IDS_VERIFIED:    [AC-NNN-NNN, ...]
AC_IDS_TODO:        [AC-NNN-NNN, ...]
AC_IDS_SDET_FAULT:  [AC-NNN-NNN, ...]
```
Append a new section to `.opencode/state/feature-{feature-id}/failures.md` recording these statuses inline using the convention `- **AC-NNN-NNN** [verified|todo|sdet-fault] {root-cause}` (one line per AC handled).

### sdet (write mode)
Add to DETAILS:
```
TESTS_WRITTEN: N
TEST_FILE: test/specs/{feature-id}.spec.js
PAGES_CREATED: [path, ...]   # or "none"
```

### sdet (run mode)
Add to DETAILS:
```
TESTS_RUN: N
TESTS_PASSED: N
TESTS_FAILED: N
LATEST_FAILURE_SECTION: "Iteration N — <timestamp> (sdet)"   # or "none — clean run"
OPEN_AC_IDS: [AC-NNN-NNN, ...]                               # latest status from failures.md
```
The sync script (`test/helpers/sync-failure-log.mjs`) writes the section automatically when `npm run test` is invoked. Do NOT write it manually.

### sdet (triage mode)
Add to DETAILS:
```
DISPUTES_REVIEWED:    [AC-NNN-NNN, ...]
DISPUTES_AGREED:      [AC-NNN-NNN, ...]   # sdet agrees test was wrong, fixed it
DISPUTES_REJECTED:    [AC-NNN-NNN, ...]   # sdet disagrees, marked back to [open]
DISPUTES_FILE_PATH:   .opencode/state/feature-{feature-id}/disputes.md
```

### reviewer
Add to DETAILS:
```
VERDICT: approved | rejected
REASON: {one-line if rejected; "fix matches root cause" if approved}
DIFF_SIZE_LINES: N
CHECKPOINT_SHA_REVIEWED: {sha}
```
