# API Backend Acceptance

Feature ID: API

## API-001: GET /Api/Health Returns 200

Status: covered
Test type: api
Criterion: GET /api/health returns 200.
Expected outcome: The system satisfies this behavior: GET /api/health returns 200.

## API-002: GET /Api/Settings Returns 200 Without Auth

Status: covered
Test type: api
Criterion: GET /api/settings returns 200 without auth.
Expected outcome: The system satisfies this behavior: GET /api/settings returns 200 without auth.

## API-003: GET /Api/Regions Returns Array (Public)

Status: covered
Test type: api
Criterion: GET /api/regions returns array (public).
Expected outcome: The system satisfies this behavior: GET /api/regions returns array (public).

## API-004: POST /Api/Regions Without Auth Returns 401

Status: covered
Test type: api
Criterion: POST /api/regions without auth returns 401.
Expected outcome: The system satisfies this behavior: POST /api/regions without auth returns 401.

## API-005: POST /Api/Regions With Auth Creates Region

Status: covered
Test type: api
Criterion: POST /api/regions with auth creates region.
Expected outcome: The system satisfies this behavior: POST /api/regions with auth creates region.

## API-006: POST /Api/Regions Duplicate Name Returns Error

Status: covered
Test type: api
Criterion: POST /api/regions duplicate name returns error.
Expected outcome: The system satisfies this behavior: POST /api/regions duplicate name returns error.

## API-007: GET /Api/Categories Returns Array (Public)

Status: covered
Test type: api
Criterion: GET /api/categories returns array (public).
Expected outcome: The system satisfies this behavior: GET /api/categories returns array (public).

## API-008: POST /Api/Categories Without Auth Returns 401

Status: covered
Test type: api
Criterion: POST /api/categories without auth returns 401.
Expected outcome: The system satisfies this behavior: POST /api/categories without auth returns 401.

## API-009: POST /Api/Auth/Login With Valid Credentials

Status: covered
Test type: api
Criterion: POST /api/auth/login with valid credentials.
Expected outcome: The system satisfies this behavior: POST /api/auth/login with valid credentials.

## API-010: POST /Api/Auth/Login With Wrong Password

Status: covered
Test type: api
Criterion: POST /api/auth/login with wrong password.
Expected outcome: The system satisfies this behavior: POST /api/auth/login with wrong password.

## API-011: POST /Api/Auth/Login With Unknown Email

Status: covered
Test type: api
Criterion: POST /api/auth/login with unknown email.
Expected outcome: The system satisfies this behavior: POST /api/auth/login with unknown email.

## API-012: GET /Api/Auth/Me With Token

Status: covered
Test type: api
Criterion: GET /api/auth/me with token.
Expected outcome: The system satisfies this behavior: GET /api/auth/me with token.

## API-013: GET /Api/Auth/Me Without Token

Status: covered
Test type: api
Criterion: GET /api/auth/me without token.
Expected outcome: The system satisfies this behavior: GET /api/auth/me without token.

## API-014: POST /Api/Auth/Logout With Token

Status: covered
Test type: api
Criterion: POST /api/auth/logout with token.
Expected outcome: The system satisfies this behavior: POST /api/auth/logout with token.

## API-015: POST /Api/Auth/Logout Without Token

Status: covered
Test type: api
Criterion: POST /api/auth/logout without token.
Expected outcome: The system satisfies this behavior: POST /api/auth/logout without token.

## API-016: GET /Api/Costumes Returns Paginated List

Status: covered
Test type: api
Criterion: GET /api/costumes returns paginated list.
Expected outcome: The system satisfies this behavior: GET /api/costumes returns paginated list.

## API-017: GET /Api/Costumes With Search Param

Status: covered
Test type: api
Criterion: GET /api/costumes with search param.
Expected outcome: The system satisfies this behavior: GET /api/costumes with search param.

## API-018: GET /Api/Costumes Pagination

Status: covered
Test type: api
Criterion: GET /api/costumes pagination.
Expected outcome: The system satisfies this behavior: GET /api/costumes pagination.

## API-019: GET /Api/Costumes Limit Capped At 100

Status: covered
Test type: api
Criterion: GET /api/costumes limit capped at 100.
Expected outcome: The system satisfies this behavior: GET /api/costumes limit capped at 100.

## API-020: GET /Api/Costumes/Search With Auth

Status: covered
Test type: api
Criterion: GET /api/costumes/search with auth.
Expected outcome: The system satisfies this behavior: GET /api/costumes/search with auth.

## API-021: GET /Api/Costumes/:Id Returns Detail

Status: covered
Test type: api
Criterion: GET /api/costumes/:id returns detail.
Expected outcome: The system satisfies this behavior: GET /api/costumes/:id returns detail.

## API-022: GET /Api/Costumes/:Id Not Found

Status: covered
Test type: api
Criterion: GET /api/costumes/:id not found.
Expected outcome: The system satisfies this behavior: GET /api/costumes/:id not found.

## API-023: GET /Api/Costumes/Abc Invalid ID

Status: covered
Test type: api
Criterion: GET /api/costumes/abc invalid ID.
Expected outcome: The system satisfies this behavior: GET /api/costumes/abc invalid ID.

## API-024: POST /Api/Costumes Without Auth Returns 401

Status: covered
Test type: api
Criterion: POST /api/costumes without auth returns 401.
Expected outcome: The system satisfies this behavior: POST /api/costumes without auth returns 401.

## API-025: POST /Api/Costumes With Auth And Valid Body

Status: covered
Test type: api
Criterion: POST /api/costumes with auth and valid body.
Expected outcome: The system satisfies this behavior: POST /api/costumes with auth and valid body.

## API-026: POST /Api/Costumes Missing Name Returns 400

Status: covered
Test type: api
Criterion: POST /api/costumes missing name returns 400.
Expected outcome: The system satisfies this behavior: POST /api/costumes missing name returns 400.

## API-027: PUT /Api/Costumes/:Id Without Auth Returns 401

Status: covered
Test type: api
Criterion: PUT /api/costumes/:id without auth returns 401.
Expected outcome: The system satisfies this behavior: PUT /api/costumes/:id without auth returns 401.

## API-028: PUT /Api/Costumes/:Id Updates Fields

Status: covered
Test type: api
Criterion: PUT /api/costumes/:id updates fields.
Expected outcome: The system satisfies this behavior: PUT /api/costumes/:id updates fields.

## API-029: DELETE /Api/Costumes/:Id Without Auth Returns 401

Status: covered
Test type: api
Criterion: DELETE /api/costumes/:id without auth returns 401.
Expected outcome: The system satisfies this behavior: DELETE /api/costumes/:id without auth returns 401.

## API-030: DELETE /Api/Costumes/:Id With Auth

Status: covered
Test type: api
Criterion: DELETE /api/costumes/:id with auth.
Expected outcome: The system satisfies this behavior: DELETE /api/costumes/:id with auth.

## API-031: GET /Api/Clients Without Auth Returns 401

Status: covered
Test type: api
Criterion: GET /api/clients without auth returns 401.
Expected outcome: The system satisfies this behavior: GET /api/clients without auth returns 401.

## API-032: GET /Api/Clients With Auth Returns Paginated

Status: covered
Test type: api
Criterion: GET /api/clients with auth returns paginated.
Expected outcome: The system satisfies this behavior: GET /api/clients with auth returns paginated.

## API-033: GET /Api/Clients/Search With Auth

Status: covered
Test type: api
Criterion: GET /api/clients/search with auth.
Expected outcome: The system satisfies this behavior: GET /api/clients/search with auth.

## API-034: GET /Api/Clients/:Id With Auth

Status: covered
Test type: api
Criterion: GET /api/clients/:id with auth.
Expected outcome: The system satisfies this behavior: GET /api/clients/:id with auth.

## API-035: GET /Api/Clients/99999999 Returns 404

Status: covered
Test type: api
Criterion: GET /api/clients/99999999 returns 404.
Expected outcome: The system satisfies this behavior: GET /api/clients/99999999 returns 404.

## API-036: POST /Api/Clients With Auth Creates Client

Status: covered
Test type: api
Criterion: POST /api/clients with auth creates client.
Expected outcome: The system satisfies this behavior: POST /api/clients with auth creates client.

## API-037: GET /Api/Clients/:Id/Rents With Auth

Status: covered
Test type: api
Criterion: GET /api/clients/:id/rents with auth.
Expected outcome: The system satisfies this behavior: GET /api/clients/:id/rents with auth.

## API-038: GET /Api/Clients/Abc Invalid ID Returns 400

Status: covered
Test type: api
Criterion: GET /api/clients/abc invalid ID returns 400.
Expected outcome: The system satisfies this behavior: GET /api/clients/abc invalid ID returns 400.

## API-039: GET /Api/Rents Without Auth Returns 401

Status: covered
Test type: api
Criterion: GET /api/rents without auth returns 401.
Expected outcome: The system satisfies this behavior: GET /api/rents without auth returns 401.

## API-040: GET /Api/Rents With Auth Returns Paginated

Status: covered
Test type: api
Criterion: GET /api/rents with auth returns paginated.
Expected outcome: The system satisfies this behavior: GET /api/rents with auth returns paginated.

## API-041: GET /Api/Rents?Status=Active

Status: covered
Test type: api
Criterion: GET /api/rents?status=active.
Expected outcome: The system satisfies this behavior: GET /api/rents?status=active.

## API-042: POST /Api/Rents With Valid Payload

Status: covered
Test type: api
Criterion: POST /api/rents with valid payload.
Expected outcome: The system satisfies this behavior: POST /api/rents with valid payload.

## API-043: POST /Api/Rents Missing Guarantee_type Returns 400

Status: covered
Test type: api
Criterion: POST /api/rents missing guarantee_type returns 400.
Expected outcome: The system satisfies this behavior: POST /api/rents missing guarantee_type returns 400.

## API-044: POST /Api/Rents Missing Rent_start Returns 400

Status: covered
Test type: api
Criterion: POST /api/rents missing rent_start returns 400.
Expected outcome: The system satisfies this behavior: POST /api/rents missing rent_start returns 400.

## API-045: POST /Api/Rents Empty Items Returns 400

Status: covered
Test type: api
Criterion: POST /api/rents empty items returns 400.
Expected outcome: The system satisfies this behavior: POST /api/rents empty items returns 400.

## API-046: POST /Api/Rents Rent_end Before Rent_start

Status: covered
Test type: api
Criterion: POST /api/rents rent_end before rent_start.
Expected outcome: The system satisfies this behavior: POST /api/rents rent_end before rent_start.

## API-047: POST /Api/Rents Quantity Exceeds Available

Status: covered
Test type: api
Criterion: POST /api/rents quantity exceeds available.
Expected outcome: The system satisfies this behavior: POST /api/rents quantity exceeds available.

## API-048: POST /Api/Rents Invalid Costume_id

Status: covered
Test type: api
Criterion: POST /api/rents invalid costume_id.
Expected outcome: The system satisfies this behavior: POST /api/rents invalid costume_id.

## API-049: PUT /Api/Rents/:Id/Return With Auth

Status: covered
Test type: api
Criterion: PUT /api/rents/:id/return with auth.
Expected outcome: The system satisfies this behavior: PUT /api/rents/:id/return with auth.

## API-050: DELETE /Api/Rents/:Id With Auth

Status: covered
Test type: api
Criterion: DELETE /api/rents/:id with auth.
Expected outcome: The system satisfies this behavior: DELETE /api/rents/:id with auth.

## API-051: GET /Api/Rents/Abc Invalid ID Returns 400

Status: covered
Test type: api
Criterion: GET /api/rents/abc invalid ID returns 400.
Expected outcome: The system satisfies this behavior: GET /api/rents/abc invalid ID returns 400.

## API-052: GET /Api/Notifications Without Auth Returns 401

Status: covered
Test type: api
Criterion: GET /api/notifications without auth returns 401.
Expected outcome: The system satisfies this behavior: GET /api/notifications without auth returns 401.

## API-053: GET /Api/Notifications With Auth

Status: covered
Test type: api
Criterion: GET /api/notifications with auth.
Expected outcome: The system satisfies this behavior: GET /api/notifications with auth.

## API-054: PUT /Api/Settings Without Auth Returns 401

Status: covered
Test type: api
Criterion: PUT /api/settings without auth returns 401.
Expected outcome: The system satisfies this behavior: PUT /api/settings without auth returns 401.

## API-055: PUT /Api/Settings With Auth Updates App_name

Status: covered
Test type: api
Criterion: PUT /api/settings with auth updates app_name.
Expected outcome: The system satisfies this behavior: PUT /api/settings with auth updates app_name.

## API-056: POST /Api/Categories Duplicate Name Returns Error

Status: covered
Test type: api
Criterion: POST /api/categories duplicate name returns error.
Expected outcome: The system satisfies this behavior: POST /api/categories duplicate name returns error.
