# Subagent I/O Contract

Every workflow subagent must end with one parseable final message. The orchestrator reads literal field names.

## Base Return

```text
OUTCOME: success | partial | blocked
FEATURE: {feature-id}
TEST_CASE_ID: {FEATURE-001}
TICKET_ID: {TICKET-YYYYMMDD-NNN or "none"}
SUMMARY: {one-line summary}

DETAILS:
- {bullet 1}

FILES_MODIFIED:
- path/to/file - {what changed, or "none"}

NEW_DEPENDENCIES:
- {package@version} - {why, or "none"}

NOTES:
{blockers, disputes, recommendations, or "none"}
```

## Ticket Semantics

- Normal TDD workflow calls require `TEST_CASE_ID`, `TICKET_ID`, `TICKET_FILE`, `TICKET_TYPE`, `TICKET_ACCEPTANCE_CRITERION`, `EXPECTED_OUTCOME`, `TEST_INTERFACE`, `RED_EXPECTATION`, and `GREEN_EXPECTATION`.
- Executable workflow calls use `TICKET_TYPE: feature | bug`.
- One worker call operates on exactly one ticket and one `TEST_CASE_ID`.
- Sibling test cases belong in `DEFERRED_TEST_CASE_IDS` and must not be implemented or tested opportunistically.

## SDET RED Extension

```text
RED_STATUS: failing_expected | already_green | failing_wrong_reason | blocked
TEST_FILE: test/specs/example.spec.js
TEST_TITLE: {title containing TEST_CASE_ID}
TEST_COMMAND: {targeted command run}
RED_FAILURE_SUMMARY: {why it failed, or why already green/blocked}
PAGES_CREATED_OR_UPDATED: [path, ...] | none
```

## SDET GREEN Rerun Extension

```text
TEST_CASE_STATUS: verified | open | todo
TEST_FILE: {recorded file}
TEST_TITLE: {recorded title}
TEST_COMMAND: {targeted command run}
TESTS_RUN: N
TESTS_PASSED: N
TESTS_FAILED: N
FAILURE_SUMMARY: {one-line symptom, or "none"}
```

## Developer GREEN Extension

```text
GREEN_STATUS: ready_for_sdet | ticket-ambiguous | red-test-wrong | blocked
ROOT_CAUSE: {one-line cause}
TARGETED_TEST_COMMAND: {command run, or "not run - reason"}
REFACTOR_NEEDED: yes | no
DEFERRED_TEST_CASE_IDS_UNTOUCHED: true | false
```

## Developer Refactor Extension

```text
GREEN_STATUS: refactor_ready_for_sdet | blocked
REFACTOR_SUMMARY: {what changed and why}
TESTS_CHANGED: false
```

## Reviewer Extension

```text
REVIEW_VERDICT: ticket-ready | ticket-still-ambiguous | red-test-wrong | ticket-ambiguous | red-approved | coverage-approved | coverage-rejected | approved | rejected
REASON: {plain-language explanation citing ticket/test case}
DIFF_SIZE_LINES: N | not_applicable
CHECKPOINT_SHA_REVIEWED: {sha or "none"}
```

## Outcome Semantics

- `success` means the assigned TDD step completed and the orchestrator can evaluate the step-specific status field.
- `partial` means progress was made but another loop is required.
- `blocked` means the orchestrator must block or escalate; do not continue by guessing.
