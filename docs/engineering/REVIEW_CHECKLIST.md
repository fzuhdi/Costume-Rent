# Review Checklist

Reviewers must prioritize coverage integrity before implementation style.

## Test Diff Checks
- Did any acceptance test get skipped, deleted, or weakened?
- Did a selector/page-object change preserve the same user-visible behavior?
- Did an assertion change still prove the same acceptance criterion?
- Did the diff add pass-through logic like `|| true`, `catch(() => true)`, broad `try/catch`, or optional assertions?
- Did the diff add broad console/a11y suppressions?
- Did any test require a globally clean database?
- Did any test delete/edit data it did not create?
- Are test-created records namespaced as `E2E_...` or `API_...`?
- Do upload tests use committed fixtures under `test/fixtures/images/` instead of fake buffers or runtime uploads?
- Did `quality:integrity` pass?

## App Diff Checks
- Does the implementation satisfy exactly the selected AC?
- Did it implement sibling ACs opportunistically?
- Did it weaken product behavior to satisfy a test?
- Are errors handled visibly instead of being swallowed?

Reject when coverage integrity is compromised, even if all tests are green.
