---
id: PLAN-20260516-regression-testing
status: ready
source_plan: inline-user-request
---

# Full Feature Regression Testing

## Outcome
The project has an orchestrator-ready regression backlog that starts with AUTH and verifies existing product behavior against `docs/ACCEPTANCE_CRITERIA.md` through automated Playwright tests.

## Baseline Test Evidence
- Command run: `cd test; npm run test:auth`
- Result: 13 failed before product assertions because `http://localhost:5173/login` returned `net::ERR_CONNECTION_REFUSED`.
- Interpretation: the frontend dev server was not running, so this is setup evidence rather than an AUTH product failure.
- Required before execution: start the dev stack for `localhost:5173` and backend API access.

## Regression Strategy
- Use slice-level tickets so each executable ticket maps to exactly one acceptance criterion.
- Start with AUTH, then continue through CATALOGUE, RENT, CLIENT, NOTIFICATION, SETTINGS, NAVIGATION, and API.
- Prefer the existing Playwright tests as the public regression interface; add or repair tests only when a slice has no reliable coverage.

## Tickets
- TICKET-20260516-001 - ready - feature - AUTH valid login succeeds
- TICKET-20260516-002 - ready - feature - AUTH login redirects to catalogue
- TICKET-20260516-003 - ready - feature - AUTH login stores token

## Deferred Ticket Roadmap
- AUTH: remaining login validation, session persistence, logout, and route protection slices.
- CATALOGUE: list, create, detail, edit, delete, images, search/filter, and available quantity slices.
- RENT: list, create, detail, edit, returned flow, delete, inline client, overdue, and quantity sync slices.
- CLIENT: list, detail, edit, delete, counts, search, overdue indicator, and history ordering slices.
- NOTIFICATION: overdue, due-soon, badge count, dropdown, ordering, and visual distinction slices.
- SETTINGS: settings load, app name, tagline, logo, persistence, and save feedback slices.
- NAVIGATION: sidebar, direct URL access, 404, responsive layout, and theme toggle slices.
- API: public endpoints, auth endpoints, protected endpoints, pagination, invalid IDs, not found, validation, and duplicate region/category slices.

## Status Summary
- draft: 0
- review: 0
- ready: 3
- in_progress: 0
- blocked: 0
- complete: 0

## Execution
`/engineering/orchestrator PLAN-20260516-regression-testing`

## Next Command
`/engineering/orchestrator TICKET-20260516-001`
