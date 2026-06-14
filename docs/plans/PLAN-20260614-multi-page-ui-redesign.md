# Multi-Page UI Redesign Plan

## Outcome

Create a coherent admin redesign direction for every current admin page and shared admin component family in `frontend-v2`. The intended end state is a quieter, denser operational workspace: fewer duplicated controls, clearer primary actions, stronger master/detail hierarchy, consistent sheet/dialog behavior, and mobile layouts that keep bottom navigation, sticky actions, and scrollable content from competing.

This plan is based on read-only review of the admin route code, shared UI primitives, CSS layout rules, design-system docs, acceptance docs, Playwright visual-state helpers, and existing screenshots under `.artifacts/admin-polish` and `.artifacts/playwright/screenshots/frontend-v2.visual.spec.js`.

## Target Inventory

| Target | Route/Component | Likely Files | Current Issues |
| --- | --- | --- | --- |
| Admin shell, navigation, and notifications | `/admin/:section`, topbar, sidebar, bottom tabs, notification popover/sheet | `frontend-v2/src/pages/admin/AdminShell.tsx`, `frontend-v2/src/pages/admin/NotificationsAdmin.tsx`, `frontend-v2/src/components/admin/common/AdminBottomSheet.tsx`, `frontend-v2/src/constants/ui.ts`, `frontend-v2/src/components/shared.tsx`, `frontend-v2/styles.css`, `design-system/MASTER.md` | Utility controls repeat across shell surfaces, mobile screenshots show bottom tabbar and sidebar sheet competing, notifications are useful but heavy as a page overlay, and `/admin/notifications` redirects while the inbox component still exists. |
| Staff login | `/admin/login` | `frontend-v2/src/pages/admin/StaffLoginPage.tsx`, `frontend-v2/src/components/shared.tsx`, `frontend-v2/styles.css`, `docs/acceptance/AUTH.md`, `test/specs/auth.spec.js` | Simple and usable, but the nested form/card pattern leaves excessive empty space, error feedback is not visually central, and there is no compact auth utility row for language/help or password visibility. |
| Shared admin components | Admin layouts, sheets, create panels, action bars, data table, search, status, sticky bars | `frontend-v2/src/components/admin/common/AdminManagement.tsx`, `frontend-v2/src/components/admin/common/AdminBottomSheet.tsx`, `frontend-v2/src/components/shared.tsx`, `frontend-v2/src/components/admin/AdminComponents.tsx`, `frontend-v2/styles.css`, `design-system/MASTER.md` | Create buttons, FABs, sheets, dialogs, status badges, and action bars solve the same problems differently per feature. Some icon-only or compact controls need stronger accessible names, focus treatment, and 44px touch consistency. |
| Requests admin | `/admin/requests` | `frontend-v2/src/pages/admin/RequestsAdmin.tsx`, `frontend-v2/src/components/admin/requests/*`, `frontend-v2/src/components/admin/rentals/RentalDialogs.tsx`, `frontend-v2/src/components/admin/rentals/RentalRecordComponents.tsx`, `design-system/pages/admin-requests.md`, `docs/acceptance/RENT.md`, `docs/acceptance/NOTIFICATION.md` | Metrics, tabs, filter/sort, create, record list, selected detail, and actions all compete in the first viewport. Filter state is hidden inside a sheet, selected details carry equal visual weight to the queue, and mobile FAB/actionbar placement risks crowding bottom navigation. |
| Rentals admin | `/admin/rentals` | `frontend-v2/src/pages/admin/RentalsAdmin.tsx`, `frontend-v2/src/components/admin/rentals/*`, `design-system/pages/admin-rentals.md`, `docs/acceptance/RENT.md` | Lifecycle workflow is functionally rich but visually dense. Next action, roadmap, checklist, payment/delivery edits, proof review, manual corrections, override, and activity log sit in one long detail surface without a strong task-first reading order. |
| Catalogue admin | `/admin/catalogue` | `frontend-v2/src/pages/admin/CatalogueAdmin.tsx`, `frontend-v2/src/components/admin/catalogue/*`, `design-system/pages/admin-catalogue.md`, `docs/acceptance/CATALOGUE.md` | Product list is relatively clear, but the editor has dense tab panels, repeated local save/error states, a sticky save bar that must not hide fields, and destructive image removal currently relies on a browser confirm pattern rather than the shared dialog system. |
| Clients admin | `/admin/clients` | `frontend-v2/src/pages/admin/ClientsAdmin.tsx`, `frontend-v2/src/components/admin/clients/ClientManagement.tsx`, `design-system/pages/admin-clients.md`, `docs/acceptance/CLIENT.md` | Directory is simple but detail sheets use tall repeated info blocks, history lacks compact grouping, add/edit forms are visually detached from contact tasks, and acceptance mentions destructive client actions that are not visible in the current inspected component path. |
| Settings admin | `/admin/settings` | `frontend-v2/src/pages/admin/SettingsAdmin.tsx`, `frontend-v2/src/components/admin/settings/SettingsPanels.tsx`, `frontend-v2/src/components/shared.tsx`, `frontend-v2/styles.css`, `design-system/MASTER.md`, `docs/acceptance/SETTINGS.md` | The page is a very long continuous form: brand, policy, home hero, catalogue copy, articles, testimonials, location, toggles, and save state all share one scroll. There is no section index, preview area, or sticky save/status rail to reduce orientation cost. |

## Shared Redesign Principles

- Treat every admin surface as an operational workspace: page heading, current queue/status, one primary action, then details.
- Use the same master/detail grammar across requests, rentals, catalogue, and clients: list pane first, detail pane second, full-screen detail on mobile.
- Consolidate duplicated create, filter, save, destructive, and detail actions into shared admin patterns before adding route-specific polish.
- Keep page-level utility actions in one predictable shell area; do not repeat language, logout, notification, or close controls in competing locations.
- Use icon-only controls only for universally recognized actions, always with `aria-label`, visible focus, and minimum 44px target size.
- Preserve explicit save/submit/confirm behavior. Search, filtering, tab changes, and typing must not mutate records.
- Keep mobile base layouts valid at 320px and 375px, then enhance at 768px, 820px, 1024px, and 1440px using min-width rules. Remove new or existing admin `max-width` responsive rules during implementation when they conflict with `design-system/MASTER.md`.

Each phase below is backed by its own `$ui-refactor` redesign pass. The `ASCII Frame` content comes from that target-specific `$ui-refactor` wireframe.

## Phase 1 - Admin Shell, Navigation, And Notifications

### Target

`/admin/:section` shell and shared notification surfaces in `AdminShell.tsx`, `NotificationsAdmin.tsx`, `AdminBottomSheet.tsx`, `shared.tsx`, `constants/ui.ts`, and admin CSS in `styles.css`.

### Redesign Direction

Make the shell a stable frame around all admin work. Desktop keeps a fixed left sidebar and a compact utility cluster. Mobile keeps one visible bottom tabbar plus a single page utility row; the sidebar is only a menu sheet opened by an explicit control, not an always-competing surface. Notifications become a consistent command surface: popover on desktop/tablet, bottom sheet on mobile, with severity grouping and direct context links.

### Information And Controls

Keep section title/copy visible in the shell only once. Keep language, notifications, and logout in the utility cluster; move rarely used utility details into a menu when mobile width is tight. Keep the notification count on the bell, but make the open panel show grouped critical/warning/info rows with one context action per row. Treat the old `NotificationsAdmin` component as either a documented inactive route surface or convert it into the same notification list body reused by the popover.

### ASCII Frame

```text
+----------------+----------------------------------------------+
| SIDEBAR        | TOPBAR                         [Lang][Bell][Log] |
| CR Brand       | Workspace staff                                  |
| [Requests]     | Current section title                            |
| [Rentals]      | Short operational copy                            |
| [Catalogue]    |                                                  |
| [Clients]      | +--------------------------------------------+   |
| [Settings]     | | Alert/summary strip for current section      |   |
|                | +--------------------------------------------+   |
|                | | Route content owns the primary workflow      |   |
|                | +--------------------------------------------+   |
+----------------+----------------------------------------------+

Mobile:
+--------------------------------------------------+
| [Lang] [Bell 3] [Menu]                           |
| Workspace staff                                  |
| Section title                                    |
| Short operational copy                           |
| +----------------------------------------------+ |
| | Route content                                 | |
| +----------------------------------------------+ |
| [Requests] [Rentals] [Catalogue] [Clients] [Set] |
+--------------------------------------------------+

Notification open:
+--------------------------------------+
| Notifications                  [x]   |
| 3 active                             |
| + Critical: Payment rejected [Open]  |
| + Warning: 2 stale requests [Open]   |
| + Info: 3 delivery schedules [Open]  |
+--------------------------------------+
```

### Accessibility And Responsive Notes

The active nav item needs `aria-current="page"`. The bell needs `aria-expanded`, `aria-controls`, and an accessible count label. Notification rows that navigate should expose meaningful link text, not only "Open context". Mobile sheet focus must move into the sheet and return to the bell/menu trigger on close. Bottom tabs must remain at least 44px tall and must not cover route-level sticky action bars; reserve bottom padding through a single shell token.

### Acceptance Checks

- At 320px, 375px, 768px, 1024px, and 1440px there is no horizontal body overflow and only one mobile navigation surface is visible unless the menu is explicitly opened.
- Keyboard users can tab through skip link, sidebar/bottom tabs, language, bell, notification rows, close, and logout in logical order.
- Notification populated and empty states work as mobile sheet and desktop popover, with Escape and close button returning focus to the bell.
- `/admin/notifications` behavior is documented and intentional: either redirect remains with shared popover body, or the route becomes a real inbox with the same list component.

## Phase 2 - Staff Login

### Target

`/admin/login` in `StaffLoginPage.tsx`, plus `AuthCard`, `Field`, and auth-related CSS.

### Redesign Direction

Make login feel like a staff gate into the operational product rather than a generic centered card. The first viewport should show the brand, concise access copy, credentials form, inline validation, and a compact utility footer. Use one panel, not a card nested inside another card, and keep the form visually balanced on short mobile screens.

### Information And Controls

Keep username, password, submit, and invalid/empty validation. Add a password reveal icon button only if it uses `aria-pressed` and a clear label. Keep username default behavior if it is intentional for demo data, but de-emphasize it as a field value rather than page copy. Keep language access available through the shell-level locale control only if login supports locale outside authentication; otherwise document why it is absent.

### ASCII Frame

```text
+--------------------------------------+
| CR                                   |
| Costume Rental                       |
| Staff access for operational /admin  |
|                                      |
| Username                             |
| [ admin                         ]    |
| Password                       [eye] |
| [                              ]     |
| ! Inline error message               |
|                                      |
| [ Sign in to staff workspace ]       |
|                                      |
| Help text or environment note        |
+--------------------------------------+
```

### Accessibility And Responsive Notes

Use one `<main>` and one `<h1>`. Inputs need explicit labels, `autocomplete`, and visible focus rings. Error feedback should use `role="alert"` or `aria-live="polite"` and should be tied to the invalid field with `aria-describedby`. Submit remains at least 44px tall. At 320px the panel should fit without horizontal overflow and without a large blank middle area.

### Acceptance Checks

- Valid login, invalid login, empty submit, session persistence, and logout behavior remain compatible with `AUTH-001` through `AUTH-014`.
- Mobile login screenshot shows the brand, both fields, validation region, and submit button without nested card borders.
- Keyboard focus order is username, password, password reveal if present, submit, then any utility links.

## Phase 3 - Shared Admin Components

### Target

Common admin primitives in `AdminManagement.tsx`, `AdminBottomSheet.tsx`, shared primitives in `shared.tsx`, compatibility barrel `AdminComponents.tsx`, and related CSS contracts in `styles.css`.

### Redesign Direction

Standardize the building blocks before route-specific redesign. Create one shared grammar for list panes, detail panes, bottom sheets, create panels, sticky action bars, status/readout blocks, destructive dialogs, empty states, search, filters, and record action groups. Components should be visually quiet by default and gain emphasis only when they hold the current primary task.

### Information And Controls

Keep `AdminBottomSheet` as the Radix-backed sheet/dialog wrapper. Keep `AdminCreateAction` and `AdminCreateFab`, but align their placement and active states across features. Make `RecordActionBar` support primary, secondary, and destructive slots. Make `DataTable` expose sort state with accessible `aria-sort` and visible sort affordance. Keep `StatusPill` icon plus localized label and prevent raw enum display. Search clear buttons should meet the 44px touch target or be wrapped in a 44px hit area.

### ASCII Frame

```text
+--------------------------------------------------+
| Shared Admin Primitive Contract                  |
+--------------------------------------------------+
| Page Header: kicker, h1, copy, utility actions   |
| Summary Strip: alert + metric links              |
| View Bar: tabs/search/filter/create              |
| List Pane: card/table rows + empty state         |
| Detail Pane: title, status, fields, activity     |
| Sticky Action Bar: status left, actions right    |
| Sheet/Dialog: title, close, body, fixed actions  |
+--------------------------------------------------+
| Action hierarchy: [Primary] [Secondary] [Danger] |
+--------------------------------------------------+
```

### Accessibility And Responsive Notes

Every icon-only button needs an accessible name and a visible focus style. Dialogs and sheets must trap focus when modal, support Escape, label the title, and restore focus to the trigger. Card rows that act like buttons should be actual buttons or links where possible; if an article stays interactive, keep keyboard handlers and `role="button"` with clear focus. Shared sticky bars must reserve bottom space when mobile bottom tabs exist.

### Acceptance Checks

- All admin create, close, filter, save, discard, destructive, and notification controls use one of the documented shared patterns.
- No new internal imports target `components/admin/AdminComponents.tsx`; feature modules import concrete components directly.
- Shared controls pass 44px target checks, visible focus checks, and icon accessible-name checks.
- Destructive admin flows use Radix dialog or a documented undo pattern, not `window.confirm`.

## Phase 4 - Requests Admin

### Target

`/admin/requests` in `RequestsAdmin.tsx`, `components/admin/requests/*`, selected record components from rentals, request edit/reject dialogs, `design-system/pages/admin-requests.md`, and request visual states.

### Redesign Direction

Turn requests into an intake queue optimized for fast accept, edit, or reject decisions. The redesigned desktop page should read as: queue status, queue controls, request rows, selected request review, then decision actions. Mobile should show cards first, then full-screen request detail with a sticky decision bar. Metrics should summarize work without pushing the active queue too far down.

### Information And Controls

Keep all/stale/delivery tabs with counts. Combine filter and sort into one compact control that shows active filter chips after apply. Keep add request as the only create primary action. In the selected panel, emphasize customer, requested items, date range, fulfillment, payment, and stale age before activity log. Accept is primary, edit is secondary, reject is destructive. Non-requested records should show an explanatory locked state instead of disabled-looking random buttons.

### ASCII Frame

```text
+--------------------------------------------------------------+
| Requests                                                     |
| Intake copy                                      [+ Add] [Filter] |
| + Alert: pending decisions | New 1 | Stale 1 | Delivery 0      |
+-------------------------------+------------------------------+
| [All 1] [Stale 1] [Delivery 0] | Selected CR-0142             |
| Search/filter chips            | Customer: Maya Saputra       |
|                                | Items: Batik, Baju Melayu    |
| + CR-0142  Stale 26h          | Dates: 12 Jun - 15 Jun       |
| | Maya Saputra                | Fulfillment: Pickup          |
| | Pickup | Missing proof      | Payment: Missing             |
| +----------------------------+ | Notes                        |
|                                | [Accept] [Edit] [Reject]     |
| Empty/list scroll region       | Activity log                 |
+-------------------------------+------------------------------+

Mobile detail:
+--------------------------------------+
| <- Requests              CR-0142     |
| Customer, stale age, status badges   |
| Items and dates                      |
| Contact and notes                    |
| Activity log                         |
| [Accept] [Edit] [Reject]             |
+--------------------------------------+
```

### Accessibility And Responsive Notes

Tabs need `aria-label`, selected state, and keyboard support from Radix. Filter sheet controls need labels, apply/clear focus order, and an active-filter summary visible after closing. Request cards should be single-focus controls with nested links avoided unless necessary. The mobile decision bar must not cover record notes or activity log; content bottom padding must account for the bar and bottom tabbar.

### Acceptance Checks

- Staff can filter by tab, query, fulfillment, payment, and sort mode; applied state survives URL query params.
- Accept, edit, and reject are visible only for `requested` records and stay available in desktop detail and mobile detail.
- Stale records include both icon/text and visual tone, never color alone.
- Visual states `requests-list`, `requests-filters-open`, `requests-add-panel`, `requests-edit-dialog`, `requests-reject-dialog`, and `requests-notifications-open` fit mobile, tablet, and desktop without horizontal overflow.

## Phase 5 - Rentals Admin

### Target

`/admin/rentals` in `RentalsAdmin.tsx`, `components/admin/rentals/*`, lifecycle/payment/override components, `design-system/pages/admin-rentals.md`, and rental visual states.

### Redesign Direction

Turn rentals into a lifecycle command center. The redesigned detail pane should be organized around the next required action first, then lifecycle progress, then supporting details. Payment and fulfillment edits should be grouped as a planning/payment module, while manual corrections and override remain visibly secondary and gated.

### Information And Controls

Keep filters for all, ready/preparing, out/on rent, returned, completed. Keep search across reference, customer, phone, and item text. In detail, show current order header, next action, proof/complete blocker if any, roadmap, items, payment/fulfillment plan, checklist, proof review, manual corrections, and activity log in that order. Use one sticky action area for the next lifecycle action on mobile; do not duplicate the same action in multiple places.

### ASCII Frame

```text
+--------------------------------------------------------------+
| Rentals                                                      |
| Lifecycle copy                                  Search + filters |
| + Active cycle summary | Ready 1 | Out 0 | Returned 1 | Done 1 |
+-------------------------------+------------------------------+
| Queue                         | CR-0143                      |
| [All 3] [Ready 1] [Out 0]     | Dimas Aditya | date range     |
| + CR-0143 Preparing           | Status badges                 |
| | Date | 1 item | Pending pay | + Next action                 |
| + CR-0144 Returned            | | Mark ready / Return / Close |
| + CR-0145 Completed           | + Lifecycle roadmap           |
|                               | + Items                       |
|                               | + Payment and delivery plan   |
|                               | + Checklist                   |
|                               | + Proof review                |
|                               | + Manual corrections          |
|                               | + Activity log                |
+-------------------------------+------------------------------+

Mobile detail:
+--------------------------------------+
| <- Rentals               CR-0143     |
| Next action card                     |
| Roadmap                              |
| Items                                |
| Payment/proof                        |
| Checklist and activity               |
| [Primary next action]                |
+--------------------------------------+
```

### Accessibility And Responsive Notes

Filter chips should expose `aria-pressed` and counts in accessible text. The lifecycle roadmap should be an ordered list with current step conveyed textually, not only color. Disabled next actions need visible reason text, not only a title tooltip. File upload and proof review controls need label, accepted type/size help, validation `role="alert"`, and focus return after reject dialogs.

### Acceptance Checks

- Lifecycle filters deep-link and update without leaving stale selected details.
- Next action remains visible on desktop and mobile, and completion stays blocked until proof is verified when required.
- Completed records are read-only except admin override with a required reason.
- Visual states `rentals-list`, `rentals-detail`, `rentals-payment-panel`, and `rentals-override-dialog` fit supported breakpoints and preserve no-overflow checks.

## Phase 6 - Catalogue Admin

### Target

`/admin/catalogue` in `CatalogueAdmin.tsx`, catalogue management/editor tabs, save bar, switch dialog, utilities, `design-system/pages/admin-catalogue.md`, and catalogue visual states.

### Redesign Direction

Keep catalogue as an inventory editor with a clear split between product selection and product editing. The list should prioritize image, name, category/meta, stock health, and unsaved state. The editor should have a compact product summary header, tabbed edit sections, and a single sticky save/discard/status surface. Media, variants, and maintenance should each feel like focused tools instead of long form appendices.

### Information And Controls

Keep search and add product in the list pane. In the editor, keep details, variants, media, and maintenance tabs. Move validation/status into the save bar and field-near errors. Replace browser confirm for image removal with the shared destructive dialog. Keep unsaved switch dialog with Save and switch, Stay, and Discard choices. Make cover image, active status, price, stock fraction, and dirty state visible in the editor header.

### ASCII Frame

```text
+--------------------------------------------------------------+
| Catalogue                                      [+ Add product] |
+-----------------------------+--------------------------------+
| Search inventory            | Selected product                |
| + Batik Pria Premium        | [Thumb] Baju Melayu Pria        |
| | Formal - Men | Low stock  | Active | Rp 150.000 | 1/6 imgs  |
| + Baju Melayu Pria          | [Details] [Variants] [Media] [Maint] |
| + Selendang Songket         |                                |
| + Topeng Bali               | Active tab content              |
|                             | Fields or tool-specific layout  |
|                             | Nearby validation               |
|                             |                                |
|                             | No changes     [Discard] [Save] |
+-----------------------------+--------------------------------+

Mobile editor:
+--------------------------------------+
| [Thumb] Product name            [x]  |
| Active | Stock | Unsaved status       |
| [Details] [Variants] [Media] [Maint] |
| Active tab fields/tool                |
| Sticky: status [Discard] [Save]       |
+--------------------------------------+
```

### Accessibility And Responsive Notes

Editor tabs must support Radix tab keyboard behavior and show selected state beyond color. Media carousel arrows and thumbnails need accurate labels such as previous/next image and selected image index. Destructive media, variant, and maintenance removals need confirmation or undo. Sticky save bar must use `aria-live="polite"` for save status but should not repeatedly announce unchanged state.

### Acceptance Checks

- Product edits remain local until explicit save; discard restores the selected product draft.
- Details, media, variants, and maintenance tabs each fit 320px without clipped controls or hidden sticky save actions.
- Variant delete remains disabled when only one variant exists, and all destructive removals use shared confirmation or undo.
- Visual states for catalogue list, create panel, each editor tab, maintenance form, and unsaved switch dialog remain covered at mobile, tablet, and desktop.

## Phase 7 - Clients Admin

### Target

`/admin/clients` in `ClientsAdmin.tsx`, `ClientManagement.tsx`, `design-system/pages/admin-clients.md`, and client visual states.

### Redesign Direction

Make clients a relationship directory optimized for finding a customer, contacting them, and reviewing rental history. The list pane should stay sparse and scannable. The detail sheet/pane should prioritize contact actions, notes, rental history summary, edit mode, and any destructive actions required by acceptance.

### Information And Controls

Keep search by name, visible phone, and normalized phone. Keep add client as the primary page action. In list cards, show initials, name, phone action, total rentals, and overdue/active indicator if available. In detail, show contact block, notes, last contact, edit action, rental history grouped by recent status, and save feedback that does not shift content. If delete remains in scope, place it behind a secondary overflow/destructive confirmation instead of alongside primary contact actions.

### ASCII Frame

```text
+--------------------------------------------------------------+
| Clients                                        [+ Add client] |
+-----------------------------+--------------------------------+
| Search by name or phone     | Maya Saputra                   |
| + MS Maya Saputra           | Phone: +62 812... [WhatsApp]   |
| | +62... | Total 3 | Active | Email | Last contact | Notes    |
| + DA Dimas Aditya           | [Edit]                         |
| + RW Rani Wibowo            |                                |
|                             | Rental history                 |
|                             | + CR-0142 12 Jun - 15 Jun      |
|                             | | Items | Status | Payment     |
|                             | + Older rentals collapsed      |
+-----------------------------+--------------------------------+

Mobile detail sheet:
+--------------------------------------+
| Clients                         [x]  |
| Maya Saputra                         |
| [WhatsApp] [Call] [Edit]             |
| Contact details                      |
| Notes                                |
| Rental history                       |
+--------------------------------------+
```

### Accessibility And Responsive Notes

Phone links need specific labels that include the visible number and destination. Interactive client cards should be real buttons or links, or maintain `role="button"` plus Enter/Space handling and clear focus. Edit mode must label every field and return focus to the edit trigger or first changed field after save. Any delete/destructive client action needs confirmation, keyboard support, and focus return.

### Acceptance Checks

- Search finds clients by name, formatted phone, and normalized phone without mutating data.
- Detail opens as a side pane on desktop and a bottom/full sheet on mobile, with contact details, notes, and rental history visible.
- Add/edit saves require explicit save and show success feedback without layout shift.
- Client mobile list/detail states preserve `CLIENT-014` and `CLIENT-015` expectations, including no horizontal scroll.

## Phase 8 - Settings Admin

### Target

`/admin/settings` in `SettingsAdmin.tsx`, `SettingsPanels.tsx`, related shared form primitives, `design-system/MASTER.md` settings rules, and settings visual states.

### Redesign Direction

Reshape settings from one long form into a navigable editor with section anchors and a persistent save/status surface. Brand and policy controls should appear first because they are operationally urgent. Home content should become grouped edit sections with clear headings and optional collapse behavior. Toggles should be promoted near the top or into a policy/status group instead of buried below long marketing content.

### Information And Controls

Keep brand name, customer/staff taglines, policy, home content fields, public catalogue toggle, proof requirement toggle, explicit save, saved status, and dirty-state detection. Add a section index for Brand, Policy, Home Hero, Catalogue Copy, Guide Articles, Testimonials, Location, and Toggles. Add a compact preview/readout for brand and home hero where practical. Keep field labels visible and preserve source-content editing behavior.

### ASCII Frame

```text
+--------------------------------------------------------------+
| Settings                                                     |
| Manage brand, policy, homepage, and rental gates             |
+----------------------+---------------------------------------+
| Section index        | Brand and policy                      |
| > Brand              | Brand name [              ]           |
|   Policy             | Customer tagline [        ]           |
|   Home hero          | Staff tagline [           ]           |
|   Catalogue copy     | Policy textarea                       |
|   Articles           |                                       |
|   Testimonials       | Home content editor                   |
|   Location           | + Hero                                |
|   Toggles            | + Catalogue section                   |
|                      | + Guide articles                      |
| Save status          | + Testimonials                        |
| No changes           | + Location                            |
| [Save all]           |                                       |
+----------------------+---------------------------------------+

Mobile:
+--------------------------------------+
| Settings                             |
| [Brand][Policy][Home][Toggles]       |
| Current section fields               |
| Sticky status: Unsaved [Save all]    |
+--------------------------------------+
```

### Accessibility And Responsive Notes

Section index links should be keyboard reachable and indicate the current section with `aria-current` when feasible. Long textareas need labels and helper text tied with `aria-describedby`. Save status should use a polite live region only when it changes to saved/error/unsaved after interaction. Toggle cards need switch labels and visible checked state beyond color. Sticky save/status should not cover the final fields at 320px or when the mobile bottom tabbar is present.

### Acceptance Checks

- Existing setting values render, edits stay local, and save persists brand/tagline/policy/home/toggle changes through explicit save.
- Dirty, saved, idle, and error states are visible without moving primary fields.
- Mobile settings route has no horizontal overflow and keeps save reachable after editing any section.
- `SETTINGS-014` behavior remains covered, with updated selectors/tests aligned to the redesigned section structure.

## Cross-Page Test Plan

- Run the frontend-v2 deterministic visual states for mobile, tablet, and desktop, covering admin shell, requests, rentals, catalogue, clients, settings, notifications, dialogs, sheets, and login.
- Verify no horizontal overflow at 320, 375, 390, 768, 1024, and 1440 widths for every admin route and every open sheet/dialog state.
- Keyboard-test skip link, sidebar, bottom tabs, topbar utilities, tabs, filters, create panels, detail panes, dialogs, sheets, sticky action bars, and file uploads.
- Run axe or an equivalent accessibility scan after implementation, then manually verify focus return, headings, dialog labels, icon-only labels, `aria-expanded`, `aria-current`, `aria-pressed`, and live regions.
- Preserve acceptance coverage for `AUTH`, `NAVIGATION`, `NOTIFICATION`, `RENT`, `CATALOGUE`, `CLIENT`, and `SETTINGS`; update selectors only where markup intentionally changes.
- For implementation PRs, run `npm run typecheck`, `npm run check:tokens`, and a production build from `frontend-v2`, plus the repo manifest check `node .opencode/scripts/build-test-case-manifest.mjs --check`.
- Compare before/after screenshots from `.artifacts/admin-polish` and `.artifacts/playwright/screenshots/frontend-v2.visual.spec.js` for hierarchy, clipping, sticky-surface overlap, and mobile first-viewport usefulness.

## Design-System Update Instructions

- Update `design-system/MASTER.md` with shared component patterns, shared controls, tokens, repeated layout rules, and any reusable interaction guidance introduced by this redesign.
- Update relevant `design-system/pages/*.md` files with route-specific frames, page/component behavior, and implementation notes.
- Copy or adapt every phase's ASCII frame into the matching design-system page/component documentation.
- Keep shared component patterns in `MASTER.md`; keep route-specific frames in `design-system/pages/*.md`.

## Phase Status

- Phase 1 - Admin Shell, Navigation, And Notifications: Completed on 2026-06-14.
  - Implemented mobile language/bell/menu utility flow, desktop language/bell/logout utility flow, grouped notification list body, notification trigger/control accessibility, focus return for shell sheets, and shared bottom navigation reserve CSS.
  - Reused the grouped notification body in the inactive notification inbox component while keeping `/admin/notifications` documented as an intentional redirect to `/admin/requests`.
  - Updated `design-system/MASTER.md` with the admin shell, notification surface, and mobile bottom reserve contracts.
  - Verification passed: `npm.cmd run typecheck`, `npm.cmd run check:tokens`, `npm.cmd run build`, `npx.cmd playwright test specs/frontend-v2.visual.spec.js --project=visual`, and `node .opencode\scripts\build-test-case-manifest.mjs --check`.
- Phase 2 - Staff Login: Completed on 2026-06-14.
  - Reworked `/admin/login` into a single `AuthCard` staff gate without a nested `checkout-card`, keeping the prefilled username behavior and local staff-session submit contract.
  - Added explicit input IDs, tied inline error feedback, an `aria-pressed` password reveal icon button, and a compact pre-auth utility footer with the existing locale control.
  - Updated `design-system/MASTER.md` with the staff auth panel contract so future work keeps one panel, visible labels, tied validation, and the utility footer.
  - Verification passed: `npm.cmd run typecheck`, `npm.cmd run check:tokens`, `npm.cmd run build`, direct Playwright staff-login smoke at 320px, 375px, 768px, 1024px, and 1440px, and `node .opencode\scripts\build-test-case-manifest.mjs --check`.
- Phase 3 - Shared Admin Components: Completed on 2026-06-14.
  - Added the shared `DestructiveConfirmDialog`, moved catalogue image, variant, and maintenance removals off `window.confirm`, and kept draft removals behind explicit confirmation before save.
  - Upgraded `RecordActionBar` with primary, secondary, destructive, and status slots; moved the request detail actions onto the slot API while preserving legacy child-button compatibility.
  - Upgraded `DataTable` with localized sort-state labels, visible sort affordances, `aria-sort`, keyboard row selection, and a labeled table region; tightened `SearchInput` with a labeled `type="search"` input and 44px clear target.
  - Updated `AdminCreateAction` and `AdminCreateFab` active semantics, related CSS contracts, localized shared copy, and `design-system/MASTER.md` shared primitive guidance.
  - Verification passed: `npm.cmd run typecheck`, `npm.cmd run check:tokens`, unsandboxed `npm.cmd run build` after sandboxed esbuild ancestor-read failure, `.\\node_modules\\.bin\\playwright.cmd test frontend-v2.visual.spec.js --project=visual`, and `node .opencode\scripts\build-test-case-manifest.mjs --check`.
  - In-app Browser smoke was blocked by the local browser-plugin sandbox setup error `windows sandbox failed: spawn setup refresh`; the existing Playwright visual suite provided browser-level coverage across mobile, tablet, and desktop.
- Phase 4 - Requests Admin: Completed on 2026-06-14.
  - Reworked `/admin/requests` into an intake queue with URL-backed tabs, query, fulfillment, payment, and sort filters plus applied filter chips.
  - Rebuilt request cards and the selected review panel around customer, requested items, date range, fulfillment, payment, stale age, notes, decision actions, and activity.
  - Kept accept, edit, and reject available only for requested records; non-requested records now show a locked explanatory state, and stale records include icon/text/tone indicators.
  - Updated `design-system/pages/admin-requests.md`, localized copy, request visual helpers where needed, and responsive request CSS.
  - Verification passed: `npm.cmd run typecheck`, `npm.cmd run check:tokens`, `npm.cmd run build` outside the sandbox after the known esbuild config-read denial, `npx.cmd playwright test specs/frontend-v2.visual.spec.js --project=visual`, and `node .opencode\scripts\build-test-case-manifest.mjs --check`.
- Phase 5 - Rentals Admin: Completed on 2026-06-14.
  - Reworked `/admin/rentals` into a lifecycle command center with queue summary, accessible filter chips, search, and selected rental detail ordered by next action, blockers, roadmap, items, payment/fulfillment, checklist, proof review, manual correction, override, and activity.
  - Added visible disabled-action reasons, textual ordered lifecycle roadmap states, mobile sticky next-action behavior, and clearer completed-record override gating.
  - Improved payment proof upload/review labeling, validation, reject-dialog focus return, and supporting copy/CSS.
  - Updated `design-system/pages/admin-rentals.md` with the lifecycle command-center contract.
  - Verification passed: `npm.cmd run typecheck`, `npm.cmd run check:tokens`, `npm.cmd run build` outside the sandbox after the known esbuild config-read denial, `npx.cmd playwright test specs/frontend-v2.visual.spec.js --project=visual`, and `node .opencode\scripts\build-test-case-manifest.mjs --check`.
- Phase 6 - Catalogue Admin: Completed on 2026-06-14.
  - Tightened catalogue as an inventory editor: product rows now foreground image, name/meta, active state, stock health, and unsaved state.
  - Added a compact editor summary with cover image, active state, price, stock fraction, image count, and dirty/save status while preserving explicit save/discard behavior.
  - Improved tab order, media carousel count/thumbnail labels, savebar live-region behavior, and stale save-state clearing on draft changes.
  - Kept destructive media, variant, and maintenance removals behind shared confirmation dialogs or existing disabled/confirmed flows, with no `window.confirm` dependency.
  - Updated `design-system/pages/admin-catalogue.md`, localized copy, and responsive catalogue CSS.
  - Verification passed: `npm.cmd run typecheck`, `npm.cmd run check:tokens`, `npm.cmd run build` outside the sandbox after the known esbuild config-read denial, `git diff --check`, and the consolidated `npx.cmd playwright test specs/frontend-v2.visual.spec.js --project=visual`.
- Phase 7 - Clients Admin: Completed on 2026-06-14.
  - Reworked clients into a relationship directory with normalized search, initials, contact action, rental counts, active/overdue status, and explicit detail/delete actions.
  - Rebuilt detail as a contact-first side pane/mobile sheet with WhatsApp/call/email actions, notes, last contact, edit mode, stable save feedback, grouped rental history, and secondary destructive confirmation.
  - Preserved explicit add/edit saves and mobile no-horizontal-scroll behavior for `CLIENT-014` and `CLIENT-015`.
  - Updated `design-system/pages/admin-clients.md`, localized copy, client visual helpers where needed, and responsive client CSS.
  - Verification passed: `npm.cmd run typecheck`, `npm.cmd run check:tokens`, `npm.cmd run build` outside the sandbox after the known esbuild config-read denial, focused Playwright client smoke across mobile and desktop, `npx.cmd playwright test specs/frontend-v2.visual.spec.js --project=visual`, and `node .opencode\scripts\build-test-case-manifest.mjs --check`.
- Phase 8 - Settings Admin: Completed on 2026-06-14.
  - Reshaped settings into a section-indexed editor with brand, policy, rental gates, home hero, catalogue copy, guide articles, testimonials, and location anchors.
  - Added brand/home preview readouts, promoted public catalogue and proof toggles, active section state with `aria-current`, textarea helper descriptions, visible toggle state labels, and a persistent save/status rail.
  - Preserved local draft behavior, explicit save persistence, dirty/saved/error state handling, and `SETTINGS-014` mobile usability expectations.
  - Updated `design-system/MASTER.md`, localized copy, settings visual helper selector, and responsive settings CSS.
  - Verification passed: `npm.cmd run typecheck`, `npm.cmd run check:tokens`, `npm.cmd run build` outside the sandbox after the known esbuild config-read denial, targeted Playwright settings smoke at 320px, 375px, 768px, 1024px, and 1440px, `npx.cmd playwright test specs/frontend-v2.visual.spec.js --project=visual`, and `node .opencode\scripts\build-test-case-manifest.mjs --check`.
- Corrective ASCII follow-up on 2026-06-14: Completed.
  - Rechecked Phase 4 through Phase 8 against the plan frames after the settings-page review.
  - Corrected Phase 8 settings to combine Brand and Policy first, use compact mobile anchors, keep toggles last in the index, and pin the mobile save/status surface above the bottom tabbar.
  - Corrected Phase 4 request desktop queue from table rows to compact decision queue cards, fixed the mobile edit action visibility, and removed the stray request alert suffix.
  - Corrected Phase 6 catalogue mobile tab copy to fit the `[Detail][Varian][Media][Rawat]` frame without clipped controls.
  - Corrected Phase 7 clients by removing list-level destructive controls and adding a collapsed older-rentals history section.
  - Verification passed on the corrected tree: `npm.cmd run typecheck`, `npm.cmd run check:tokens`, `git diff --check`, `node .opencode\scripts\build-test-case-manifest.mjs --check`, `npm.cmd run build` outside the sandbox after the known esbuild config-read denial, and `npx.cmd playwright test specs/frontend-v2.visual.spec.js --project=visual`.
