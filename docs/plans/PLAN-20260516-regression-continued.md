---
id: PLAN-20260516-regression-continued
status: complete
source_plan: inline-user-request
---

# Remaining Feature Regression Testing

## Outcome
Extend regression coverage to all remaining features (CATALOGUE, RENT, CLIENT, NOTIFICATION, SETTINGS, NAVIGATION, API) by verifying existing product behavior against `docs/acceptance/*.md` through automated Playwright tests.

## Baseline Test Evidence
- AUTH regression (PLAN-20260516-regression-testing) completed: 3 tickets, all already-green.
- Frontend dev server validated at `http://localhost:5173`.
- All remaining features have existing Playwright test specs (except API which is `test/api/`).

## Regression Strategy
- One test case-level ticket per acceptance criterion, starting with the first criterion for each feature.
- Prefer existing Playwright tests as the regression interface; add or repair tests only when a test case has no reliable coverage.
- Features processed in order: CATALOGUE, RENT, CLIENT, NOTIFICATION, SETTINGS, NAVIGATION, API.

## Tickets
- TICKET-20260516-004 - complete - feature - CATALOGUE display all costumes
- TICKET-20260516-005 - complete - feature - RENT view rental list
- TICKET-20260516-006 - complete - feature - CATALOGUE name/thumbnail/quantity
- TICKET-20260516-007 - complete - feature - CATALOGUE pagination
- TICKET-20260516-008 - complete - feature - CATALOGUE region/category labels
- TICKET-20260516-009 - complete - feature - NAVIGATION sidebar Katalog menu
- TICKET-20260516-010 - complete - feature - API health endpoint

## Draft Ticket Roadmap
- CATALOGUE: remaining CATALOGUE-002 to CATALOGUE-008 (name/quantity display, pagination, add/edit/detail/delete, images, search/filter, available qty)
- RENT: remaining RENT-002 to RENT-014 (status filter, create, detail, edit, mark returned, delete, inline client, overdue, qty sync)
- CLIENT: remaining CLIENT-002 to CLIENT-017 (name/phone display, detail, edit, rent counts, search, overdue indicator, delete)
- NOTIFICATION: remaining NOTIFICATION-002 to NOTIFICATION-020 (alert display, due-soon, bell dropdown, visual distinction, count sync)
- SETTINGS: remaining SETTINGS-002 to SETTINGS-009 (form display, edit name/tagline/logo, persistence, save feedback)
- NAVIGATION: remaining NAVIGATION-002 to NAVIGATION-009 (sidebar links, direct URL, 404, responsive, theme toggle)
- API: remaining API-002 to CLIENT-042 (all public, auth, protected endpoints, pagination, validation, CRUD)

## Status Summary
- draft: 0
- review: 0
- ready: 0
- in_progress: 0
- blocked: 0
- complete: 7

## Execution
`/engineering/orchestrator PLAN-20260516-regression-continued`
