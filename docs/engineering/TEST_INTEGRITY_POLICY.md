# Test Integrity Policy

Acceptance tests are executable contracts. A green suite is invalid if acceptance coverage was weakened to get there.

Valid outcomes:
- The test passes while preserving the acceptance criterion.
- The test fails honestly because product behavior is missing or broken.

Invalid outcomes:
- Skipping, deleting, or weakening acceptance checks to make the suite pass.
- Changing expected behavior to match the current broken app.
- Suppressing console, network, or accessibility failures globally to hide product issues.
- Using pass-through assertions such as `expect(value || true).toBeTruthy()`.

Allowed test repairs:
- Selector updates that target the same user-visible behavior.
- Page-object mechanics that preserve the acceptance criterion.
- Setup/import/auth fixes that let the test reach the product behavior.
- Proper waits for real async UI state, not arbitrary sleeps.
- Stronger assertions that improve AC coverage.

When product behavior is missing, keep the test failing and create or select a product ticket. Do not hide the failure with `skip`, `fixme`, broad filters, or weakened assertions.

## Test State Policy

Acceptance tests must be additive and self-scoped by default.

- Do not require global clean database state.
- Do not reset, truncate, drop, or delete all data.
- Do not delete or mutate records that the test did not create.
- Create uniquely named records when test data is needed.
- Assert against the exact records created by the test, not arbitrary first rows or global counts.
- Empty-state checks should use a non-matching search/filter or a dedicated test account/dataset; they must not clean shared data.

Clean-state tests are exceptional. If unavoidable, they must run separately and serially, use only user-facing UI cleanup, and delete only records owned by the test namespace. They must not run in the normal parallel suite.

## Test Data Namespaces

All test-created records must use a prefix that identifies the interface that created them:

```text
E2E_<FEATURE>_<AC>_<PURPOSE>_<TIMESTAMP>
API_<FEATURE>_<AC>_<PURPOSE>_<TIMESTAMP>
```

Examples:

```text
E2E_CATALOGUE_AC007_DELETE_1779000000000
E2E_CLIENT_AC042_DELETE_1779000000000
E2E_RENT_AC012_NOTES_1779000000000
API_COSTUME_AC030_CREATE_1779000000000
API_CLIENT_AC030_UPDATE_1779000000000
API_RENT_AC030_DELETE_1779000000000
```

E2E tests may mutate/delete only `E2E_` records they created. API tests may mutate/delete only `API_` records they created. Tests must never delete seeded/demo data, arbitrary first rows, or records from the other namespace.

## Upload Fixtures

Upload tests must use stable committed fixture files under `test/fixtures/images/`. They must not read mutable runtime files from `backend/uploads` during test execution. Existing runtime images may be copied once into `test/fixtures/images/` as committed fixtures.
