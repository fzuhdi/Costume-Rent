---
id: PLAN-20260516-regression-testing
status: complete
source_plan: inline-user-request
---

# Full Feature Regression Testing

## Outcome
The project has an orchestrator-ready regression backlog that starts with AUTH and verifies existing product behavior against `docs/acceptance/*.md` through automated Playwright tests.

## Baseline Test Evidence
- Command run: `cd test; npm run test:auth`
- Result: 13 failed before product assertions because `http://localhost:5173/login` returned `net::ERR_CONNECTION_REFUSED`.
- Interpretation: the frontend dev server was not running, so this is setup evidence rather than an AUTH product failure.
- Required before execution: start the dev stack for `localhost:5173` and backend API access.

## Regression Strategy
- Use test case-level tickets so each executable ticket maps to exactly one acceptance criterion.
- Start with AUTH, then continue through CATALOGUE, RENT, CLIENT, NOTIFICATION, SETTINGS, NAVIGATION, and API.
- Prefer the existing Playwright tests as the public regression interface; add or repair tests only when a test case has no reliable coverage.

## Tickets
- TICKET-20260516-001 - complete - feature - AUTH valid login succeeds
- TICKET-20260516-002 - complete - feature - AUTH login redirects to catalogue
- TICKET-20260516-003 - complete - feature - AUTH login stores token

## Deferred Ticket Roadmap
- AUTH: remaining login validation, session persistence, logout, and route protection test cases.
- CATALOGUE: list, create, detail, edit, delete, images, search/filter, and available quantity test cases.
- RENT: list, create, detail, edit, returned flow, delete, inline client, overdue, and quantity sync test cases.
- CLIENT: list, detail, edit, delete, counts, search, overdue indicator, and history ordering test cases.
- NOTIFICATION: overdue, due-soon, badge count, dropdown, ordering, and visual distinction test cases.
- SETTINGS: settings load, app name, tagline, logo, persistence, and save feedback test cases.
- NAVIGATION: sidebar, direct URL access, 404, responsive layout, and theme toggle test cases.
- API: public endpoints, auth endpoints, protected endpoints, pagination, invalid IDs, not found, validation, and duplicate region/category test cases.

## Status Summary
- draft: 0
- review: 0
- ready: 0
- in_progress: 0
- blocked: 0
- complete: 3

## Execution
`/engineering/orchestrator PLAN-20260516-regression-testing`

## Next Command
`/engineering/orchestrator TICKET-20260516-001`
