# Authentication Acceptance

Feature ID: AUTH

## AUTH-001: Login With Valid Credentials

Status: covered
Test type: e2e
Criterion: Login with valid credentials.
Expected outcome: The system satisfies this behavior: Login with valid credentials.

## AUTH-002: Invalid Credentials Show Error

Status: covered
Test type: e2e
Criterion: Invalid credentials show error.
Expected outcome: The system satisfies this behavior: Invalid credentials show error.

## AUTH-003: Session Persists On Refresh

Status: covered
Test type: e2e
Criterion: Session persists on refresh.
Expected outcome: The system satisfies this behavior: Session persists on refresh.

## AUTH-004: Logout Clears Session

Status: covered
Test type: e2e
Criterion: Logout clears session.
Expected outcome: The system satisfies this behavior: Logout clears session.

## AUTH-005: Login Redirects To /Catalogue

Status: covered
Test type: e2e
Criterion: Login redirects to /catalogue.
Expected outcome: The system satisfies this behavior: Login redirects to /catalogue.

## AUTH-006: Auth Token Stored After Login

Status: covered
Test type: e2e
Criterion: Auth token stored after login.
Expected outcome: The system satisfies this behavior: Auth token stored after login.

## AUTH-007: Wrong Email Shows Error

Status: covered
Test type: e2e
Criterion: Wrong email shows error.
Expected outcome: The system satisfies this behavior: Wrong email shows error.

## AUTH-008: Empty Form Does Not Submit

Status: covered
Test type: e2e
Criterion: Empty form does not submit.
Expected outcome: The system satisfies this behavior: Empty form does not submit.

## AUTH-009: Unauthenticated /Catalogue Redirects To Login

Status: covered
Test type: e2e
Criterion: Unauthenticated /catalogue redirects to login.
Expected outcome: The system satisfies this behavior: Unauthenticated /catalogue redirects to login.

## AUTH-010: Unauthenticated /Rents Redirects To Login

Status: covered
Test type: e2e
Criterion: Unauthenticated /rents redirects to login.
Expected outcome: The system satisfies this behavior: Unauthenticated /rents redirects to login.

## AUTH-011: Unauthenticated /Clients Redirects To Login

Status: covered
Test type: e2e
Criterion: Unauthenticated /clients redirects to login.
Expected outcome: The system satisfies this behavior: Unauthenticated /clients redirects to login.

## AUTH-012: Unauthenticated /Settings Redirects To Login

Status: covered
Test type: e2e
Criterion: Unauthenticated /settings redirects to login.
Expected outcome: The system satisfies this behavior: Unauthenticated /settings redirects to login.

## AUTH-013: Token Removed From LocalStorage After Logout

Status: covered
Test type: e2e
Criterion: Token removed from localStorage after logout.
Expected outcome: The system satisfies this behavior: Token removed from localStorage after logout.

## AUTH-014: Login Uses Theme-Aware Mobile Layout

Status: ready
Test type: e2e
Criterion: The login page uses app theme tokens in light and dark mode, remains usable on mobile, and preserves valid, invalid, and empty credential behavior.
Expected outcome: Staff can authenticate from mobile or desktop with a refreshed theme-aware login experience that does not regress existing auth flows.
