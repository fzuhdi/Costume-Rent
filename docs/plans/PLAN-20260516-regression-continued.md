---
id: PLAN-20260516-regression-continued
status: ready
source_plan: inline-user-request
---

# Remaining Feature Regression Testing

## Outcome
Extend regression coverage to all remaining features (CATALOGUE, RENT, CLIENT, NOTIFICATION, SETTINGS, NAVIGATION, API) by verifying existing product behavior against `docs/ACCEPTANCE_CRITERIA.md` through automated Playwright tests.

## Baseline Test Evidence
- AUTH regression (PLAN-20260516-regression-testing) completed: 3 tickets, all already-green.
- Frontend dev server validated at `http://localhost:5173`.
- All remaining features have existing Playwright test specs (except API which is `test/api/`).

## Regression Strategy
- One slice-level ticket per acceptance criterion, starting with the first criterion for each feature.
- Prefer existing Playwright tests as the regression interface; add or repair tests only when a slice has no reliable coverage.
- Features processed in order: CATALOGUE, RENT, CLIENT, NOTIFICATION, SETTINGS, NAVIGATION, API.

## Tickets
- TICKET-20260516-004 - complete - feature - CATALOGUE display all costumes
- TICKET-20260516-005 - complete - feature - RENT view rental list
- TICKET-20260516-006 - complete - feature - CATALOGUE name/thumbnail/quantity
- TICKET-20260516-007 - complete - feature - CATALOGUE pagination
- TICKET-20260516-008 - complete - feature - CATALOGUE region/category labels
- TICKET-20260516-009 - ready - feature - NAVIGATION sidebar Katalog menu
- TICKET-20260516-010 - ready - feature - API health endpoint

## Draft Ticket Roadmap
- CATALOGUE: remaining AC-003-002 to AC-008-007 (name/quantity display, pagination, add/edit/detail/delete, images, search/filter, available qty)
- RENT: remaining AC-009-002 to AC-014-006 (status filter, create, detail, edit, mark returned, delete, inline client, overdue, qty sync)
- CLIENT: remaining AC-015-002 to AC-017-005 (name/phone display, detail, edit, rent counts, search, overdue indicator, delete)
- NOTIFICATION: remaining AC-018-002 to AC-020-005 (alert display, due-soon, bell dropdown, visual distinction, count sync)
- SETTINGS: remaining AC-021-002 to AC-024-003 (form display, edit name/tagline/logo, persistence, save feedback)
- NAVIGATION: remaining AC-025-002 to AC-027-002 (sidebar links, direct URL, 404, responsive, theme toggle)
- API: remaining AC-028-002 to AC-042-005 (all public, auth, protected endpoints, pagination, validation, CRUD)

## Status Summary
- draft: 0
- review: 0
- ready: 7
- in_progress: 0
- blocked: 0
- complete: 0

## Execution
`/engineering/orchestrator PLAN-20260516-regression-continued`
