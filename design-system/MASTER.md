# Costume Rental Design System

Source of truth for `frontend-v2`. The older `docs/frontend/design-system.md` points here to avoid drift.

## Direction

Name: Boutique Utility.

The UI is a practical boutique rental surface: product-led for customers, dense and operational for staff. Keep Plus Jakarta Sans, neutral surfaces, teal primary actions, warm accent highlights, real costume imagery, 8px-or-less cards, visible borders, and restrained shadows. Do not introduce purple/blue gradient themes, decorative orbs, nested cards, emoji icons, or large marketing heroes.

## Tokens

- Background: `#F8FAFC`; surface: `#FFFFFF`; warm surface: `#FFF8ED`.
- Text: `#18212F`; muted: `#64748B`; border: `#D8DEE8`.
- Primary: `#0F766E`; warm accent: `#B45309`; destructive: `#B42318`; success: `#15803D`; info: `#2563EB`.
- Font: `"Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, sans-serif`.
- Radius: controls 6px, cards/panels/sheets 8px max.
- Touch targets: 44px minimum for buttons, icon buttons, table header sort controls, and calendar controls.

## Component Rules

- Use lucide-react icons for UI actions and status. Icon-only buttons require accessible names.
- Status badges must include icon plus localized label; never render raw enum values.
- Form fields use visible labels, nearby validation, explicit submit/save actions, and loading/success/error states for core flows.
- Mutations happen only on submit/save/confirm. Search, filters, and form typing must not mutate catalogue, rental, client, or settings data.
- Destructive actions require confirmation or an undo/recovery pattern.
- Admin tables use desktop tables and mobile card rows below 768px.

## Availability And API Safety

- Public availability must be batched by visible product IDs and selected date range.
- Never request availability per calendar cell.
- Product detail requests one product and one month window; keep the requested window under 62 days.
- Next-available search is capped at 90 days.
- Public availability cache TTL is 30-60 seconds by `{productIds, variantIds, start, end}`.
- Search/filter input uses a 300ms debounce and cancels stale requests through `AbortController`.
- Checkout revalidates selected items before request submit.
- Availability payloads expose aggregated fields only: `date`, `productId`, `variantId`, `total`, `booked`, `available`, `state`.

## Routes

- `/`: catalogue-first customer page with search, date range, category filters, visible product grid, and no marketing hero.
- `/costumes/:productId`: image-led detail, variant/date controls, bounded availability calendar, favorite toggle, and request action.
- `/checkout`: direct page checkout; when opened from catalogue/detail it may render as a route-backed sheet over the prior location.
- `/lookup`: safe reference plus phone lookup, forgot-code recovery, and staff-notified change request.
- `/admin/requests`: queue filters, stale/request tabs, sorting, row detail, accept/edit/reject actions.
- `/admin/rentals`: lifecycle queue, payment proof gate, checklist, and filtered deep links from metrics.
- `/admin/catalogue`: create/edit products, variants, image, maintenance blocks, and explicit save.
- `/admin/clients`: customer search, add/edit, rental history, and explicit save.
- `/admin/settings`: branding, policy, catalogue/proof toggles, and explicit save.

## Responsive And Accessibility

- Support 320, 375, 768, 1024, and 1440 widths without horizontal body overflow.
- Customer grids collapse to one column on small phones.
- Admin workspace collapses sidebar to a sheet and stacks filters/forms under 820px.
- Focus rings must remain visible. Dialogs/sheets need clear close actions.
- Respect `prefers-reduced-motion`; transitions should use opacity/transform and avoid layout shifts.
