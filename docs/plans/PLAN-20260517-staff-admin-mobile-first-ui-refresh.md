---
id: PLAN-20260517-staff-admin-mobile-first-ui-refresh
status: in_progress
source_plan: inline-staff-admin-mobile-first-ui-refresh-prd
---

# Staff Admin Mobile-First UI Refresh

## Outcome
Refresh the existing authenticated staff/admin Costume Rental Management UI into a mobile-first boutique atelier operations experience. Preserve current catalogue, rental, client, notification, settings, authentication, and routing behavior while improving mobile usability, responsive layout, dark mode coherence, accessible controls, and operational clarity.

## Source Summary
- Scope is existing staff/admin UI only; public customer booking is out of scope.
- Visual direction is boutique atelier operations: warm ivory surfaces, deep ink text, muted copper/gold accents, tactile cards, refined status badges, and stronger costume imagery.
- Coverage is a full admin pass: app shell, navigation, catalogue, rentals, clients, forms, detail pages, settings, login, notifications, and shared states.
- Mobile navigation uses bottom tabs for Katalog, Peminjaman, and Klien while preserving desktop sidebar behavior.
- Business logic, APIs, route names, authentication, and data validation must not change except where UI behavior requires equivalent presentation improvements.

## Tickets
- TICKET-20260517-001 - complete - feature - Mobile bottom tabs provide core admin navigation
- TICKET-20260517-002 - complete - feature - Responsive admin shell has no horizontal body scroll
- TICKET-20260517-003 - complete - feature - Mobile catalogue uses collapsible filters and inventory cards
- TICKET-20260517-004 - ready - feature - Costume detail and form are mobile usable
- TICKET-20260517-005 - complete - feature - Rental history uses mobile cards
- TICKET-20260517-006 - complete - feature - Rental detail and form are mobile usable
- TICKET-20260517-007 - complete - feature - Client list uses mobile cards
- TICKET-20260517-008 - ready - feature - Client detail and form are mobile usable
- TICKET-20260517-009 - ready - feature - Login uses theme-aware mobile layout
- TICKET-20260517-010 - ready - feature - Settings branding page is mobile usable
- TICKET-20260517-011 - ready - feature - Notification popover is usable on mobile

## Status Summary
- draft: 0
- review: 0
- ready: 5
- in_progress: 0
- blocked: 0
- complete: 6

## Execution
`/engineering/orchestrator PLAN-20260517-staff-admin-mobile-first-ui-refresh`
