# Forbidden Patterns

The quality gate blocks these patterns because they make test results untrustworthy.

## Acceptance Coverage
- `test.skip(...)`, `test.describe.skip(...)`, `describe.skip(...)`, `test.fixme(...)` in `test/specs/**`.
- `.only(...)` in committed tests.
- Deleting an acceptance test without replacing equivalent or stronger coverage.

## Assertion Escape Hatches
- `expect(value || true)`.
- `expect(condition || true).toBeTruthy()`.
- `catch(() => true)`, `catch(() => null)`, or equivalent pass-on-error fallbacks in acceptance tests.

## Hidden Failures
- `npx playwright test || true` in package scripts.
- Broad console filters for `500`, `Failed to fetch`, or generic network failures.
- Global axe suppressions for semantic/name/ARIA rules such as `label`, `button-name`, `link-name`, `aria-*`, `nested-interactive`, `region`, or landmark rules.

## Debug Artifacts
- Root-level generated files such as `*-snapshot.md` and `*-debug.md`.

## Test State And Data Ownership
- Reset/truncate/drop/delete-all commands in acceptance tests.
- Deleting or editing arbitrary first rows from the UI.
- Test-created data names without the `E2E_` or `API_` namespace prefix.
- E2E upload tests using fake binary buffers instead of committed files from `test/fixtures/images/`.
- Runtime upload files from `backend/uploads` used as test inputs during test execution.

If a pattern is genuinely needed, stop and ask for an explicit policy change. Do not bypass the gate locally.
