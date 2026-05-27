# Costume Rental Frontend Design System

## Status
Draft

## Source
This design system is derived from `docs/prds/costume-rental-platform.md`.

It applies to the greenfield `frontend-v2/` app:

- Public customer booking app at `/`
- Public product detail at `/costumes/:productId`, lookup/change request at `/lookup`, and route-backed checkout sheet at `/checkout`
- Staff management app under `/admin/*`
- React, Vite, React Router, Tailwind v4, shadcn/ui, lucide-react
- TanStack Table for staff data tables
- React Hook Form and Zod for complex forms when useful

## Product Character
Costume Rental is an offline-first boutique rental platform. The UI should feel practical, trusted, and curated, not like a generic ecommerce marketplace or decorative fashion site.

The product has two modes:

- Customer mode: product-first browsing, low-friction booking requests, clear next steps, mobile-first.
- Staff mode: compact mobile-first operations, queues, status decisions, payment proof, delivery coordination, alert popovers, and audit history.

Both modes share one visual language. The customer side may be more spacious and image-led. The staff side should be denser and optimized for scanning.

## Design Principles

1. Make the first screen useful.
   The public homepage is the catalogue entry point, not a marketing landing page. Show search, date availability, categories, and costumes immediately.

2. Keep offline operations visible.
   Status copy must explain that requests wait for staff confirmation, payment proof is staff-verified, and delivery is staff-arranged.

3. Optimize for Indonesian-first clarity.
   Use direct Indonesian labels in the default UI. Avoid ambiguous ecommerce terms that imply automatic confirmation or online payment. Database flags and API enum values remain stable English snake_case values, but visible wording must come from centralized localization maps for Indonesian and English.

4. Separate customer confidence from staff control.
   Customers need confidence, availability feedback, and reference lookup. Staff need control, revalidation, logs, and exception handling.

5. Prefer planned library components before manual UI.
   Use shadcn/ui, Radix primitives through shadcn/ui, TanStack Table, React Hook Form, Zod, and lucide-react before hand-building controls, tables, forms, validation, or icons. Generated shadcn/ui primitives live in `components/ui/`. Feature pages should prefer project-level wrappers from `components/app/`, `components/customer/`, and `components/admin/` when the concept is repeated.

6. Never rely on color alone.
   Statuses, warnings, payment states, and availability must use text plus icons or labels.

7. Centralize user-facing language.
   Product copy, action labels, status badges, table headers, filters, and validation messages must resolve through shared label dictionaries. The default locale is Indonesian (`id`); English (`en`) labels are maintained for future i18n and internal QA. Do not hard-code English status flags such as `requested`, `missing`, or `attached` directly into UI text.

## Visual Direction

Name: Boutique Utility

The visual system combines clean operational UI with restrained boutique cues. Use crisp surfaces, strong text contrast, real costume imagery, and small textile-inspired accents only where they support hierarchy.

### Reference Strategy

Use the references as product behavior and composition cues, not as visual skins.

Airbnb-inspired customer experience:

- Borrow photography-led browsing, clear date/search controls, visible availability, and booking-oriented summaries.
- Apply this as a catalogue-first interface where products appear in the first viewport.
- Keep the customer page warm, direct, and mobile-first, but do not use oversized marketing hero sections.
- Do not copy Airbnb colors, exact component shapes, icons, spacing, or brand patterns.

Notion-inspired calm structure:

- Borrow quiet surfaces, readable content blocks, subtle borders, and low-noise editing/review areas.
- Apply this to request summaries, checkout steps, booking lookup, long forms, settings, and detail panels.
- Do not let every section become a soft card. Use cards only for repeated items, tools, modals, and framed panels.

Airtable-inspired staff operations:

- Borrow structured density, filtered views, status fields, editable records, and direct operational actions.
- Apply this to booking queues, rental lifecycle views, catalogue records, client history, notifications, and activity logs.
- Admin screens should feel like a command surface: compact, aligned, and fast to scan.
- Do not copy Airtable branding, exact table chrome, or decorative KPI dashboards.

Modernity standard:

- Prefer catalogue/product content over decorative empty space.
- Use purposeful contrast, tight alignment, and clear hierarchy.
- Avoid old website cues such as large static hero banners, generic beige card stacks, heavy shadows, and repeated pill shapes that do not represent controls.

Do:

- Use real product images as the primary visual asset.
- Use warm accents sparingly for boutique feel.
- Keep admin pages quiet, aligned, and information-dense.
- Use 8px or smaller card radius.
- Use clear borders and subtle shadows instead of heavy effects.

Avoid:

- Oversized decorative hero sections.
- Purple-blue gradient themes.
- One-note beige, brown, or dark slate palettes.
- Cards nested inside cards.
- Decorative orbs, blobs, bokeh, or abstract SVG background art.
- Emoji as icons.
- Photo/text mismatch for product cards.

## Color System

Use light mode as the MVP default. Tokens should be dark-mode ready, but a public dark-mode toggle is not required unless separately ticketed.

### Core Tokens

| Token | Hex | Usage |
| --- | --- | --- |
| `background` | `#F8FAFC` | App background, admin workspace |
| `surface` | `#FFFFFF` | Cards, sheets, forms, table surfaces |
| `surface-warm` | `#FFF8ED` | Customer highlight bands, empty states, booking summaries |
| `foreground` | `#18212F` | Primary text |
| `muted-foreground` | `#64748B` | Secondary text and helper copy |
| `border` | `#D8DEE8` | Default borders and dividers |
| `input` | `#CBD5E1` | Form borders |
| `primary` | `#0F766E` | Main CTA, selected states, primary staff actions |
| `primary-foreground` | `#FFFFFF` | Text on primary |
| `secondary` | `#334155` | Secondary commands and admin nav |
| `secondary-foreground` | `#FFFFFF` | Text on secondary |
| `accent` | `#B45309` | Boutique accent, warnings where text contrast is needed |
| `accent-soft` | `#FEF3C7` | Soft warning/accent backgrounds |
| `destructive` | `#B42318` | Reject, cancel, danger actions |
| `success` | `#15803D` | Verified, available, completed-positive states |
| `info` | `#2563EB` | Informational and in-progress states |
| `ring` | `#0F766E` | Focus ring |

### Color Proportions

- 65 percent neutral surfaces and backgrounds.
- 20 percent strong text, borders, and table structure.
- 10 percent primary teal for actions and selected states.
- 5 percent warm accent for boutique highlights and warnings.

This prevents the product from reading as a single-color theme.

### Status Colors

All status components must include a label and an icon. Color is supporting information only. Badges must center their icon and label with stable height on mobile and desktop; lifecycle and catalogue badges must not float to the top of card rows.

| Meaning | Text | Background | Border | Icon |
| --- | --- | --- | --- | --- |
| Waiting/requested | `#92400E` | `#FEF3C7` | `#F59E0B` | Clock |
| Confirmed | `#0F766E` | `#CCFBF1` | `#14B8A6` | CheckCircle |
| Preparing/in progress | `#1D4ED8` | `#DBEAFE` | `#60A5FA` | LoaderCircle or Package |
| On rent/out delivery | `#4338CA` | `#E0E7FF` | `#818CF8` | Truck or ArrowRight |
| Returned | `#166534` | `#DCFCE7` | `#22C55E` | RotateCcw |
| Completed | `#14532D` | `#DCFCE7` | `#16A34A` | BadgeCheck |
| Rejected/cancelled | `#991B1B` | `#FEE2E2` | `#EF4444` | XCircle |
| Payment missing/rejected | `#991B1B` | `#FEE2E2` | `#EF4444` | AlertTriangle |

### Availability Calendar Pattern

Product detail uses the full availability calendar. Catalogue cards do not.

Detail calendar:

- Show one month at a time with previous and next month icon controls.
- Keep the selected variant label visible above the month grid.
- Use a 7-column month grid with readable day numbers and a small available count.
- Include a legend for unavailable/maintenance, fully booked, partially booked, and available.
- Let customers click or tap a date to inspect stock per variant for that date.
- If the selected rental range is blocked, show the next same-duration available range when one exists within 90 days.
- On mobile and inside checkout/sheet-adjacent layouts, stack the calendar header, grid, legend, and stock inspector without horizontal overflow at 320px.

Catalogue card availability:

- Show only the selected-range state: available, limited/partially booked, fully booked, or unavailable.
- Show the next available date/range only when the selected range is blocked.
- Never render a full month calendar per card.
- Do not show a separate catalogue-side availability panel. The product cards and product detail calendar are the availability surfaces.
- Use distinct lucide icons in availability badges: `CheckCircle` for available, `Clock` for partially booked/limited, `CircleSlash` for fully booked, `XCircle` for unavailable, and `Wrench` when the unavailable reason is maintenance.

Availability data:

- Do not request availability per calendar cell.
- Detail availability fetches one product, selected variants, one visible month, and a small buffer with a maximum 62-day query window.
- Catalogue availability fetches visible product IDs for the selected date range only.
- Availability responses contain aggregated stock fields only: date, product ID, variant ID, total, booked, available, and state.
- Short public caching is allowed for 30-60 seconds, but checkout and staff inventory edits must revalidate or clear cached availability.

## Typography

Primary family: `Plus Jakarta Sans`

Fallback:

```css
font-family: "Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Reasons:

- Strong Indonesian readability.
- Friendly enough for customer booking.
- Precise enough for admin tables and forms.
- Works well with tabular numeric values.

Implementation:

- Load `Plus Jakarta Sans` through the app bundle, self-hosted font files, or an approved webfont import.
- Do not rely on the font being installed on the viewer's machine.
- If the font cannot be loaded in a static preview, use a modern metric-compatible fallback and document the difference.

Use `font-variant-numeric: tabular-nums;` for prices, counts, dates, queue age, and table metrics.

### Type Scale

| Role | Mobile | Desktop | Weight | Line height |
| --- | --- | --- | --- | --- |
| Display | 32px | 40px | 700 | 1.1 |
| Page title | 28px | 32px | 700 | 1.2 |
| Section title | 22px | 24px | 650 | 1.25 |
| Card title | 18px | 20px | 650 | 1.3 |
| Body | 16px | 16px | 400 | 1.55 |
| Small body | 14px | 14px | 400 | 1.45 |
| Label | 14px | 14px | 600 | 1.2 |
| Caption | 12px | 12px | 500 | 1.3 |

Do not scale font size with viewport width. Keep letter spacing at `0`.

## Spacing, Radius, And Elevation

Use a 4px base scale with 8px rhythm for layout.

| Token | Value | Usage |
| --- | --- | --- |
| `space-1` | 4px | Tight icon/text gaps |
| `space-2` | 8px | Control internal gaps |
| `space-3` | 12px | Compact groups |
| `space-4` | 16px | Default component padding |
| `space-5` | 20px | Mobile section gutters |
| `space-6` | 24px | Desktop component groups |
| `space-8` | 32px | Section separation |
| `space-12` | 48px | Major page separation |

Radius:

- Inputs, buttons, badges: 6px.
- Cards and panels: 8px maximum.
- Modals and sheets: 8px.
- Avatars or image thumbnails may be circular only when representing a person or logo.
- Fully rounded pills are reserved for search/date capsules, segmented controls, status badges, and compact filter chips. Do not use pill shapes as the default for every command.

Elevation:

- Default surfaces use borders, not shadows.
- Floating headers, sticky summaries, sheets, and popovers may use `0 8px 24px rgb(15 23 42 / 0.12)`.
- Avoid multiple shadow styles per page.

## Layout System

### Breakpoints

| Name | Width | Intent |
| --- | --- | --- |
| `xs` | 320px | Minimum supported mobile width |
| `sm` | 375px | Common small phone |
| `md` | 768px | Tablet and two-column customer layouts |
| `lg` | 1024px | Admin sidebar and data-table layouts |
| `xl` | 1280px | Wide staff workspace |
| `2xl` | 1440px | Large desktop constraints |

### Containers

Customer:

- Mobile gutter: 16px.
- Tablet gutter: 24px.
- Desktop max width: 1180px.
- Product detail max width: 1120px.

Admin:

- Desktop sidebar: 248px.
- Desktop content max width: 1440px.
- Admin page gutter: 24px desktop, 16px mobile.
- Use full-width bands or plain layouts. Do not place full page sections inside decorative cards.

### Mobile Rules

- No horizontal body overflow at 320px.
- Sticky bottom actions must reserve bottom padding with safe-area support.
- Touch targets must be at least 44px high.
- Customer filters open in a sheet or collapsible panel on small screens.
- Admin tables switch to card-list rows below 768px.

## Navigation

### Customer Navigation

Desktop:

- Top app bar with brand, catalogue/search, booking lookup, request summary.
- Request summary is an icon-only `ShoppingCart` button with an accessible label and count badge. Do not duplicate it with a second visible "Permintaan" navigation item.

Mobile:

- Compact top bar with brand, search trigger, and request summary icon with count.
- Bottom action bar appears only for active request or product detail actions.
- Avoid persistent bottom nav unless the customer app grows beyond browse, request, and lookup.

Customer routes must preserve filter, date, and scroll state when navigating back from product detail.

### Admin Navigation

Desktop:

- Persistent left sidebar.
- Top area for page title, notification bell popover, and user actions.
- Sidebar groups:
  - Overview
  - Booking requests
  - Rentals
  - Catalogue
  - Clients
  - Settings

Mobile:

- Top bar with menu button.
- Sidebar opens as a sheet.
- Primary actions stay in the page header or sticky footer, not inside navigation.
- Notification bell stays in the header and opens a popover/sheet-like panel with action links into the related staff context. MVP notification items are not manually resolved.

## Component Architecture

Recommended structure:

```txt
frontend-v2/src/
  components/ui/        # generated shadcn/ui primitives
  components/app/       # product wrappers shared across customer/admin
  components/customer/  # storefront and request components
  components/admin/     # staff workflow components
  components/layout/    # shells and route layouts
  styles/               # global tokens and theme entry
```

Generated shadcn/ui primitives may be imported directly only inside shared wrappers or one-off low-level components. Repeated product concepts should have project-owned components.

### Required App Wrappers

| Component | Purpose |
| --- | --- |
| `AppButton` | Button variants, loading state, icon placement, 44px touch target |
| `AppField` | Label, helper, error, required marker, accessible input binding |
| `PageHeader` | Title, subtitle, breadcrumbs, primary and secondary actions |
| `StatusBadge` | Icon plus text status display |
| `BookingStatePill` | Lifecycle status mapped to Indonesian labels |
| `PaymentProofBadge` | Payment proof state mapped to Indonesian labels |
| `AvailabilityBadge` | Available, limited, unavailable, date needed |
| `MoneyText` | Locale-aware Rupiah formatting and per-set wording |
| `DateRangeField` | Start/end date selection, invalid/past-date messaging |
| `DataTable` | TanStack Table wrapper with sorting, pagination, empty/loading/error states |
| `RequestSummary` | Customer request items, dates, quantities, price summary |
| `InlineAlert` | Error, warning, success, info messages with icon and recovery action |
| `ConfirmDialog` | Destructive or irreversible action confirmation |
| `ActivityTimeline` | Staff rent/request audit log |

### Library-First Component Policy

- Use shadcn/ui primitives or project wrappers for buttons, inputs, labels, selects, radio groups, tabs, badges, sheets, dialogs, popovers, calendars, toasts, tables, tooltips, and dropdown menus.
- Use `lucide-react` for UI icons. Do not draw icons with CSS pseudo-elements or ad hoc inline SVG when a lucide icon exists.
- Use TanStack Table for admin data grids once the static preview becomes React. Do not recreate sorting, filtering, pagination, column visibility, or keyboard table behavior by hand.
- Use React Hook Form and Zod for forms with validation, conditional fields, or submit locking.
- A manual component is allowed only when the planned library does not cover the interaction or the project wrapper would be more complex than the use case. Document the reason in the component file.
- Static HTML previews may use simple placeholders to communicate intent, but React implementation must replace them with the planned library components before production tickets are accepted.

## Customer Components

### Catalogue Grid

Use product cards with:

- Image aspect ratio `4 / 5`.
- Costume name.
- Category and region labels when available.
- Price as `Rp ... / set` or `Rp ... / paket`.
- Availability state.
- Selected date range context when applied.
- Variant preview if meaningful.

Grid:

- 1 column at 320px.
- 2 columns from 640px.
- 3 columns from 1024px.
- 4 columns only when card content remains readable.

Cards must have stable image boxes and lazy-loaded images. Missing images use a stable placeholder with a textile-neutral background and text label, not a broken icon.

### Product Detail

Layout:

- Mobile: image carousel, title/status/price, date and variant controls, details, sticky add-to-request footer.
- Desktop: image gallery left, booking controls right, details below.

Required states:

- No date selected: product is browseable, add-to-request disabled with guidance.
- Variant required: add-to-request disabled until selected.
- Unavailable: show reason category where possible and alternate action.
- Added to request: confirm with toast and update request summary count.

### Request Summary

Desktop:

- Sticky side panel on catalogue/product/checkout where useful.

Mobile:

- Bottom sheet triggered by request count.
- Sticky checkout action when items exist.

Each item shows image, costume name, variant, quantity, rental dates, price per set/package, and availability.

### Customer Checkout

Use a short multi-step flow:

1. Review items and dates.
2. Contact and fulfillment.
3. Terms and submit.

Do not require account creation. Use visible labels for all fields.

Fulfillment controls:

- Segmented control for `Ambil di butik` and `Diantar staf`.
- Delivery reveals address and preferred window.
- Pickup shows preferred pickup and return windows.

Submit button must lock during submission and show loading text.

### Booking Lookup

Use a focused form with booking reference and phone.

Add a secondary "Lupa kode?" recovery path. It asks for phone plus identifying hints such as name, approximate date, or item. Submission shows a generic staff-follow-up confirmation and must not reveal whether a booking exists, list matching references, or expose booking details.

Lookup result shows:

- Customer-friendly lifecycle status.
- Payment proof status only if customer-facing.
- Dates and fulfillment method.
- Selected items and variants.
- Staff next steps when available.
- Request cancellation, reschedule, or detail change actions when eligible.

Invalid lookup must use a safe not-found message that does not reveal whether the reference or phone was wrong.

## Admin Components

### Admin Dashboard

The first admin screen should prioritize operational queues:

- New requested bookings.
- Stale requested bookings.
- Returned but not completed.
- Rejected payment proofs.
- Due-soon and overdue rentals.

Use compact metric tiles only when each tile links to a queue. Avoid decorative KPI cards that do not drive action.

### Admin Notifications

Use a top-right bell popover rather than a dedicated notification page in MVP. Each item shows one severity badge plus title/body copy, then opens the related queue, rental, catalogue, or client context. Do not repeat the same wording in both badge and title. Do not show a manual resolve action; alerts clear through the underlying workflow state.

### Pending Booking Queue

Use `DataTable` on desktop and card rows on mobile.

Columns:

- Reference.
- Customer.
- Requested date range.
- Item/variant summary.
- Fulfillment method.
- Age/stale indicator.
- Status.
- Primary action.

Rows must highlight stale requests with warning text and icon. The stale state cannot depend on background color alone.

### Rent Or Booking Detail

Use a two-column admin layout on desktop:

- Main: items, dates, customer details, fulfillment, notes, payment proof.
- Side: lifecycle actions, alerts, totals, activity timeline.

Mobile stacks all sections and uses sticky bottom primary action only where needed.

Lifecycle actions must make the next valid action clear and keep destructive/reject actions visually separate.

### Payment Proof

Use an upload panel with:

- Accepted file helper text.
- Current proof preview or file metadata.
- Status badge.
- Verify and reject actions.
- Rejection reason field when rejecting.

Completion action must be disabled until proof is attached and verified, with visible explanation.

### Data Tables

Admin data tables must support:

- Sorting where useful.
- Filter/search without full page reload.
- Pagination or virtualization for large sets.
- Row actions in an overflow menu.
- Empty, loading, error, and retry states.
- Keyboard focus and `aria-sort` for sortable headers.

Below 768px, data tables become stacked card rows with the primary identifier first and actions at the bottom.

## Language And Status Mapping

Default visible language is Indonesian. English enum values are implementation flags only and must not be rendered directly to customers or staff.

Label source:

- Keep database/API state flags in English snake_case.
- Map every state flag to Indonesian and English labels in shared dictionaries.
- Customer-facing labels can differ from staff-facing labels for the same flag.
- Tests may assert enum values, but UI tests should assert localized visible labels.

Lifecycle labels:

| Flag | Customer label `id` | Staff label `id` | Customer label `en` | Staff label `en` |
| --- | --- | --- | --- | --- |
| `requested` | Menunggu ditinjau | Permintaan baru | Awaiting review | New request |
| `confirmed` | Dikonfirmasi | Dikonfirmasi | Confirmed | Confirmed |
| `preparing` | Sedang disiapkan | Disiapkan | Being prepared | Preparing |
| `ready_pickup` | Siap diambil | Siap diambil | Ready for pickup | Ready for pickup |
| `out_delivery` | Dalam pengantaran | Dalam pengantaran | Out for delivery | Out for delivery |
| `on_rent` | Sedang disewa | Sedang disewa | On rent | On rent |
| `returned` | Dikembalikan | Dikembalikan, belum selesai | Returned | Returned, not closed |
| `completed` | Selesai | Selesai | Completed | Completed |
| `rejected` | Ditolak | Ditolak | Rejected | Rejected |
| `cancelled` | Dibatalkan | Dibatalkan | Cancelled | Cancelled |

Payment proof labels:

| Flag | Label `id` | Label `en` |
| --- | --- | --- |
| `missing` | Bukti pembayaran belum ada | Payment proof missing |
| `attached` | Bukti pembayaran diterima | Payment proof received |
| `verified` | Bukti pembayaran terverifikasi | Payment proof verified |
| `rejected` | Bukti pembayaran ditolak | Payment proof rejected |

Availability labels:

| Flag | Label `id` | Label `en` |
| --- | --- | --- |
| `date_required` | Pilih tanggal untuk cek ketersediaan | Select dates to check availability |
| `available` | Tersedia | Available |
| `limited` | Stok terbatas | Limited stock |
| `partially_booked` | Sebagian terpesan | Partially booked |
| `fully_booked` | Penuh | Fully booked |
| `unavailable` | Tidak tersedia | Unavailable |
| `variant_required` | Pilih ukuran/varian | Select size/variant |

Fulfillment labels:

| Flag | Label `id` | Label `en` |
| --- | --- | --- |
| `pickup` | Ambil di butik | Boutique pickup |
| `delivery` | Diantar staf | Staff-arranged delivery |

## Forms And Validation

Use React Hook Form and Zod for:

- Booking request submission.
- Booking lookup.
- Staff edit forms.
- Payment proof forms.
- Settings forms.
- Catalogue and variant forms when validation spans multiple fields.

Rules:

- Use visible labels, not placeholder-only labels.
- Validate on blur or submit, not every keystroke unless the field is simple and feedback is helpful.
- Place errors below the related field.
- Move focus to the first invalid field after submit failure.
- Use `type="tel"` and `autocomplete="tel"` for phone fields.
- Use `type="email"` and `autocomplete="email"` for optional email fields.
- Use clear helper text for terms, delivery windows, payment proof, and price-per-set semantics.
- Preserve long customer request forms locally until submission succeeds or the user clears them.

## Motion

Motion is functional and restrained.

Timing:

- Hover/focus/press transitions: 150ms.
- Sheet/dialog enter: 200ms.
- Toast enter/exit: 150ms.
- Page content fade: 150ms maximum.

Use transform and opacity. Do not animate width, height, top, or left for routine interactions.

Respect `prefers-reduced-motion`. In reduced-motion mode, remove nonessential transitions and keep state changes immediate.

## Accessibility

Minimum requirements:

- Normal text contrast at least 4.5:1.
- Large text and UI glyph contrast at least 3:1.
- Visible focus ring on every interactive element.
- Skip link to main content.
- Sequential heading order.
- Icon-only buttons require accessible names and tooltips where helpful.
- Form fields require labels and error associations.
- Toasts and async status messages use polite live regions.
- Destructive confirmations use dialogs with initial focus and escape handling.
- Product images have meaningful alt text. Decorative placeholders use empty alt text.
- Customer and staff flows must be usable with keyboard only.

## Performance

Customer catalogue:

- Use responsive images and lazy loading below the first viewport.
- Reserve image dimensions with aspect ratio.
- Debounce search/filter input.
- Keep customer first contentful paint under the PRD target of 1.5 seconds on representative 4G mobile conditions.

Admin:

- Use route-level splitting for heavy admin sections.
- Use pagination or virtualization for large tables.
- Avoid recalculating table columns and filters on every render.

All:

- Avoid layout shift from loading text, dynamic badges, and sticky action bars.
- Use skeletons for loads longer than 300ms.
- Always provide retry actions for network failures.

## Page Blueprints

### Customer Catalogue `/`

First viewport:

- Top app bar.
- Compact brand line and location/service cue.
- Search input.
- Date range field.
- Category/region filters.
- Product grid starts in the first viewport.
- Request summary trigger lives in the top app bar only; do not add a redundant "Draf permintaan" card in the catalogue header.

Do not use a full-screen hero that delays browsing.

### Product Detail

Priority order:

1. Product image and name.
2. Price per set/package.
3. Date and availability.
4. Variant and quantity.
5. Add-to-request.
6. Description, fitting notes, accessory notes.

### Checkout

Priority order:

1. Items and dates.
2. Contact.
3. Fulfillment.
4. Terms.
5. Submit.

### Admin Booking Queue `/admin/*`

Priority order:

1. Queue title and counts.
2. Stale/new filters.
3. Search.
4. Table or card rows.
5. Bulk or row actions only when safe.

### Admin Rent Detail

Priority order:

1. Current lifecycle and blocking alerts.
2. Next valid actions.
3. Items, dates, customer, fulfillment.
4. Payment proof and completion gate.
5. Activity timeline.

## Implementation Notes

Initial shadcn/ui components likely needed:

- `button`
- `input`
- `textarea`
- `label`
- `select`
- `checkbox`
- `radio-group`
- `tabs`
- `badge`
- `card`
- `sheet`
- `dialog`
- `popover`
- `calendar`
- `toast` or `sonner`
- `skeleton`
- `separator`
- `dropdown-menu`
- `table`
- `tooltip`

Preferred icon set:

- `lucide-react`

Icon sizing:

- Inline text icons: 16px.
- Button icons: 18px.
- Navigation icons: 20px.
- Empty-state icons: 32px.

All icon buttons must have at least a 44px hit target.

## Quality Checklist

- Customer and admin screens render without horizontal overflow at 320px.
- Repeated status and payment labels use shared components.
- Lifecycle, notification, and availability badges keep icons centered with labels at mobile and desktop sizes.
- Prices always communicate per set/package, not per day.
- Customer lookup forgot-code recovery never exposes booking existence or matching references.
- Staff notifications are accessible from the header bell and open related work context.
- Staff tables remain readable at desktop density and become card rows on mobile.
- Sticky headers and bottom action bars reserve safe spacing.
- Loading, empty, disabled, error, retry, and success states exist for each core flow.
- Focus states are visible and keyboard order follows visual order.
- The selected shadcn/ui primitives are wrapped or documented before broad feature work starts.
