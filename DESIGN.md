# KBR Costume Design System

Status: Marketplace modern-heritage direction approved for implementation

Preview: Open [`design-system-alternate2.html`](./design-system-alternate2.html) in a browser

Brand contract: [`docs/BRAND_CONTRACT.md`](./docs/BRAND_CONTRACT.md)

Last updated: 2026-07-26

## 1. Design Intent

KBR Costume has two related product surfaces with different jobs:

| Surface | Audience | Design job | Component system |
| --- | --- | --- | --- |
| Marketplace | Rental customers | Inspire confidence, make costume discovery visual, and keep booking decisions simple | shadcn/ui, scoped to customer route layouts |
| Admin | Store staff | Make operational status, dense records, and frequent actions easy to scan | HeroUI v3, scoped to `/admin` |

The systems share brand identity, status meanings, accessibility rules, and interaction behavior. Marketplace color tokens and component imports remain separate from the admin system.

The visual direction is:

- Photography first, with restrained interface chrome.
- Familiar marketplace structure without imitating another brand.
- Warm ivory and brown neutrals, a burgundy primary, and one restrained gold accent.
- Rounded enough to feel approachable, but not soft or playful.
- Clear rental policy and availability before a customer commits.
- Compact, information-dense admin screens with stronger borders.

Reference balance:

- 70% Airbnb: calm marketplace hierarchy, search prominence, booking rail, and predictable responsive behavior.
- 20% Pinterest: imagery leads, controls stay quiet, and filters remain compact.
- 10% Nike: confident image crops and concise display typography.

KBR should feel local, reliable, and specific to costume rental. Do not copy another product's type, icon, color, or component details.

## 2. Brand Principles

### 2.1 Show the costume before the interface

Product photography carries the visual energy. Interface surfaces stay neutral so costume color and texture are not distorted.

### 2.2 Make availability tangible

Dates, quantity, pickup, return, and hold expiry must be visible near the action they affect. Never hide a material rental constraint in a tooltip.

### 2.3 Use one obvious action

Each view has one primary burgundy action. Secondary actions are neutral. Destructive actions are red only when the action is actually destructive.

### 2.4 Earn trust with explicit states

Use plain language for payment, booking, delivery, and cancellation states. A redirect does not mean payment succeeded. "Processing payment" and "Booking confirmed" must look and read differently.

### 2.5 Separate browsing from operations

Customer pages are spacious and visual. Admin pages are denser and optimized for scanning. Do not make the admin look like a storefront or the storefront look like a back office.

## 3. Component System Boundary

### 3.1 Marketplace

- Use shadcn/ui primitives inside the customer route layout only.
- Scope customer CSS variables under `.marketplace-theme` or its route-group layout.
- Use Radix behavior supplied through shadcn/ui for dialogs, sheets, popovers, tabs, and accessible focus management.
- Do not import HeroUI packages into marketplace components.

### 3.2 Admin

- Use HeroUI v3 for buttons, inputs, selects, radios, checkboxes, tables, modals, and menus.
- Scope HeroUI providers and admin variables to the `/admin` layout.
- Continue to use Lucide React for application icons.
- When editing an admin component built from a raw interactive HTML element, replace it with the equivalent HeroUI component when practical.

### 3.3 Shared

Shared code may contain:

- Logo and brand assets.
- Domain formatting, date formatting, and status labels.
- Semantic token names and accessibility behavior.
- Non-visual data and validation logic.

Marketplace brand assets have separate roles:

- `/brand/bu-risna-seal.webp` is the optimized real marketplace seal used in the header at 48px and in the footer at 96px.
- `/brand/bu-risna-seal.png` supplies the favicon, shortcut icon, Apple touch icon, and print-quality source.
- `/brand/kbr-marketplace-mark-mono.svg` is the single-color and forced-color fallback.
- `/kbr-logo.svg` remains the current admin/settings asset and must not be overwritten by marketplace work.
- The approved customer-facing relationship uses `KBR Costume` as the primary public name and `Kostum Tari Bu Risna` as its descriptor.
- The existing social reference and pickup-location name remain `@kbrcostume` and `KBR Costume`.
- This marketplace decision does not replace admin assets or rename `KBR-...` order references.

Shared code must not contain:

- A shadcn component that imports HeroUI.
- A HeroUI component that imports shadcn.
- Global component styles that silently restyle the other surface.

## 4. Color Tokens

Color contrast must meet WCAG 2.2 AA for the final text size and weight. Status must never rely on color alone.

### 4.1 Marketplace light palette

| Token | Value | Use |
| --- | --- | --- |
| `--mk-canvas` | `#F8F4EC` | Page background and quiet sections |
| `--mk-surface` | `#FFFFFF` | Navigation, forms, booking rail, dialogs |
| `--mk-surface-raised` | `#FFFFFF` | Menus and floating surfaces |
| `--mk-ink` | `#241815` | Primary text |
| `--mk-muted` | `#6F625D` | Secondary copy |
| `--mk-subtle` | `#7B6C66` | Icons, placeholders, and nonessential decoration |
| `--mk-line` | `#DED3C5` | Dividers and card boundaries |
| `--mk-line-strong` | `#A08C82` | Input borders and strong separation |
| `--mk-primary` | `#8F1028` | Primary actions, links, selected controls |
| `--mk-primary-hover` | `#74101F` | Hovered primary actions |
| `--mk-primary-active` | `#5F0C18` | Pressed primary actions |
| `--mk-primary-soft` | `#F8E7EB` | Selected or informative brand surface |
| `--mk-on-primary` | `#FFFFFF` | Content on burgundy |
| `--mk-on-danger` | `#FFFFFF` | Content on filled danger actions |
| `--mk-focus` | `#8F1028` | Focus ring |
| `--mk-gold` | `#D9A441` | Decorative brand accent only |
| `--mk-on-gold` | `#3A2115` | Content on an approved filled gold surface |
| `--mk-media-placeholder` | `#EAE0D4` | Image loading and failure background |

### 4.2 Marketplace dark palette

Dark mode is optional at launch but tokens are defined now so components do not hard-code light values.
Light is the application default regardless of the operating system preference. Dark mode is activated only by an explicit saved user selection, which is applied before first paint to avoid a theme flash.

| Token | Value | Use |
| --- | --- | --- |
| `--mk-canvas` | `#17100F` | Page background |
| `--mk-surface` | `#211716` | Primary surface |
| `--mk-surface-raised` | `#2B1D1C` | Menus and floating surfaces |
| `--mk-ink` | `#FAF4EA` | Primary text |
| `--mk-muted` | `#C9BAB1` | Secondary copy |
| `--mk-subtle` | `#A8968C` | Metadata and placeholders |
| `--mk-line` | `#4A3935` | Dividers |
| `--mk-line-strong` | `#79635C` | Input borders |
| `--mk-primary` | `#E06A78` | Primary actions and selected controls |
| `--mk-primary-hover` | `#EA7E8B` | Hovered primary actions |
| `--mk-primary-active` | `#CB5C69` | Pressed primary actions |
| `--mk-primary-soft` | `#3A1D23` | Selected or informative brand surface |
| `--mk-on-primary` | `#241013` | Content on light burgundy |
| `--mk-on-danger` | `#21100E` | Content on filled danger actions |
| `--mk-focus` | `#E06A78` | Focus ring |
| `--mk-gold` | `#E0B15A` | Decorative brand accent only |
| `--mk-on-gold` | `#3A2115` | Content on an approved filled gold surface |
| `--mk-media-placeholder` | `#352723` | Image loading and failure background |

### 4.3 Shared semantic colors

| Meaning | Light foreground | Light surface | Dark foreground | Dark surface |
| --- | --- | --- | --- | --- |
| Success / booked / returned | `#15803D` | `#ECFDF3` | `#6EE7A0` | `#153521` |
| Warning / pending / expiring | `#A15C07` | `#FFF7E6` | `#F9C56B` | `#3D2B12` |
| Danger / overdue / failed | `#B42318` | `#FFF0EE` | `#FF9B93` | `#411D1B` |
| Info / delivery requested | `#075E8C` | `#EDF8FF` | `#78CDF5` | `#142F3D` |

Use burgundy for marketplace action and selection. Gold is a restricted, non-semantic accent: do not map it to shadcn accent, warning, pending, payment, rental, or delivery states. Costume photography supplies variety.

### 4.4 Admin palette

The current admin palette remains intentionally compatible with `web/src/styles/global.css`:

| Token | Light | Dark |
| --- | --- | --- |
| `--background` | `#F9FAFB` | `#111827` |
| `--surface` | `#FFFFFF` | `#1F2937` |
| `--foreground` | `#111827` | `#F9FAFB` |
| `--muted` | `#6B7280` | `#9CA3AF` |
| `--border` | `#E5E7EB` | `#374151` |
| `--primary` | `#4F46E5` | `#818CF8` |
| `--success` | `#16A34A` | `#4ADE80` |
| `--warning` | `#D97706` | `#FBBF24` |
| `--danger` | `#DC2626` | `#F87171` |
| `--secondary` | `#0891B2` | `#22D3EE` |

## 5. Typography

### 5.1 Font families

| Surface | Primary stack | Reason |
| --- | --- | --- |
| Marketplace | `"Plus Jakarta Sans", "Avenir Next", ui-sans-serif, system-ui, sans-serif` | Friendly geometry with clear numerals |
| Admin | `"Inter", ui-sans-serif, system-ui, sans-serif` | Compact scanning and broad character support |
| Money and order references | Inherit primary font with `font-variant-numeric: tabular-nums` | Stable alignment |

Load Plus Jakarta Sans through `next/font` in the marketplace layout. Do not fetch fonts from CSS at runtime.

### 5.2 Marketplace type scale

| Role | Size / line height | Weight | Notes |
| --- | --- | --- | --- |
| Display | `clamp(2.5rem, 6vw, 5rem)` / `0.98` | 700 | Landing statement only |
| Page title | `clamp(2rem, 4vw, 3.5rem)` / `1.05` | 700 | Use balanced wrapping |
| Section title | `clamp(1.5rem, 2.5vw, 2.25rem)` / `1.12` | 700 | Maximum 16 words |
| Card title | `1rem` / `1.35` | 650 | Clamp to two lines |
| Body large | `1.125rem` / `1.65` | 400 | Introductory copy |
| Body | `1rem` / `1.55` | 400 | Default |
| Small | `0.875rem` / `1.45` | 450 | Metadata and support |
| Label | `0.8125rem` / `1.2` | 650 | Sentence case |
| Micro | `0.75rem` / `1.3` | 600 | Status and timestamps |

Avoid uppercase labels except for short operational identifiers. Never use loose letter spacing in sentence case.

## 6. Spacing, Size, and Shape

### 6.1 Spacing scale

Use a 4px base:

| Token | Value |
| --- | --- |
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |
| `--space-16` | `64px` |
| `--space-20` | `80px` |
| `--space-24` | `96px` |

Customer sections use `64px` to `96px` vertical rhythm on desktop and `40px` to `64px` on mobile. Admin pages keep the existing `16px` mobile and `24px` desktop content padding.

### 6.2 Control size

| Role | Height |
| --- | --- |
| Compact desktop visual | `36px`, inside a `44px` interactive hit area |
| Standard button or input | `44px` minimum |
| Prominent customer action | `48px` minimum |
| Mobile primary action | `52px` recommended |

All interactive targets must be at least `44px` by `44px`, including icon-only controls.

### 6.3 Radius scale

| Token | Value | Use |
| --- | --- | --- |
| `--radius-sm` | `8px` | Badges and compact admin controls |
| `--radius-md` | `12px` | Inputs, buttons, chips |
| `--radius-lg` | `16px` | Costume cards and grouped surfaces |
| `--radius-xl` | `20px` | Booking panels, sheets, dialogs |
| `--radius-pill` | `999px` | Status pills and avatar controls only |

Nested radii must remain concentric. Child radius should approximately equal parent radius minus inset distance.

### 6.4 Borders and depth

Default to borders and tonal separation. Use shadows only for floating or sticky surfaces.

```css
--mk-shadow-float:
  0 1px 2px rgb(36 24 21 / 0.06),
  0 8px 24px rgb(36 24 21 / 0.08);
--shadow-dialog:
  0 2px 6px rgb(36 24 21 / 0.08),
  0 24px 64px rgb(36 24 21 / 0.18);
```

Images need a subtle outline to stay legible against similar backgrounds:

```css
box-shadow:
  inset 0 0 0 1px rgb(0 0 0 / 0.10),
  inset 0 0 0 2px rgb(255 255 255 / 0.08);
```

Do not add a shadow to every card.

## 7. Layout and Responsive Rules

### 7.1 Containers

- Customer maximum content width: `1280px`.
- Standard customer gutters: `24px` mobile, `32px` tablet, `40px` desktop.
- Admin uses the current sidebar shell and `16px` mobile / `24px` desktop page padding.
- Long text content should not exceed `68ch`.

### 7.2 Marketplace grids

| Viewport | Catalogue | Content behavior |
| --- | --- | --- |
| `< 640px` | 2 columns | 12px gap, compact metadata, filters in a bottom sheet |
| `640px to 899px` | 2 columns | 20px gap, expanded card metadata |
| `900px to 1199px` | 3 columns | 24px gap, inline sort |
| `>= 1200px` | 4 columns | 24px gap, optional filter rail |

Costume images use a consistent `4:5` ratio. Do not use masonry for the catalogue because stable rows make price and availability easier to compare.

### 7.3 Costume detail

- Desktop: approximately `60%` media and `40%` booking information.
- Booking rail may be sticky below the navigation, but must stop before page footer content.
- Mobile: media first, then summary, then policy. The main booking action stays in a sticky bottom bar after the customer scrolls past the inline action.

### 7.4 Checkout and account

- Checkout uses one main column plus one summary rail on wide screens.
- The summary collapses into an accordion on mobile.
- Order detail keeps payment, booking, and delivery states visually separate.
- Tables become stacked labelled rows on narrow screens. Do not force horizontal scrolling for critical customer information.

## 8. Imagery

### 8.1 Product photography

- Use a consistent `4:5` crop for catalogue cards.
- Prefer full costume silhouettes on a clean background.
- Keep the face visible when a model is shown, unless the product is a mask or headpiece.
- Avoid mixing studio photos, screenshots, and heavily filtered phone photos in one grid.
- Preserve costume color. Do not place a brand-color wash over product photos.
- Use `object-fit: cover` for card images and `object-fit: contain` for detail inspection when the source has a clean background.

### 8.2 Loading and failure

- Reserve image dimensions to avoid layout shift.
- Use a neutral skeleton while loading.
- Use the KBR mark and a plain "Photo unavailable" label only when an image fails.
- Do not use generic stock fashion images as a fallback for a specific costume.

## 9. Marketplace Components

### 9.1 Buttons

Variants:

- Primary: burgundy fill through the semantic primary token, with a high-contrast label.
- Secondary: surface fill, strong border, ink label.
- Quiet: transparent, ink or semantic-primary label.
- Destructive: danger fill only for irreversible or forfeiture-confirmed actions.

Rules:

- One primary button per action cluster.
- Use verb-first labels: "Continue to payment", "Check availability", "Cancel booking".
- Pressed buttons scale to `0.96` when motion is allowed.
- Loading buttons keep their width and replace the leading icon with a spinner.
- Disabled buttons remain legible and explain the constraint nearby.

### 9.2 Inputs

An input contains:

1. Persistent label.
2. Optional hint before interaction.
3. Control with 44px minimum height.
4. Error text below the control.

Do not use placeholder text as the only label. Error copy must state what the customer can do next.

### 9.3 Search and Event Date

- Search and Event Date are separate fields on mobile and may share one composed search bar on desktop.
- Event Date is the customer's decision. Pickup and return are derived and shown as read-only outcomes.
- Display the full local date and abbreviated operational dates together.
- Do not allow each cart item to have a different Event Date.

### 9.4 Filter chips

- Default is a neutral outlined chip.
- Selected uses the primary-soft surface, semantic-primary text, and a visible selected indicator.
- Each chip remains at least 44px high.
- On mobile, show the most important chips and move the complete filter set into a sheet.

### 9.5 Costume card

Required anatomy:

1. `4:5` product image.
2. Availability or low-stock badge only when useful.
3. Costume name, maximum two lines.
4. Category or size summary.
5. Rental price with the standard rental period nearby.

The entire card may link to detail, but nested favorite or quick actions must remain independently keyboard accessible. Do not show exact total inventory.

### 9.6 Availability message

- Available: concise success message.
- Limited: warning with the online quantity limit.
- Unavailable: explain that the Event Date overlaps another booking and offer a date change.
- Unknown or service error: do not display "available"; ask the user to retry.

### 9.7 Booking rail

Required anatomy:

1. Rental price.
2. Selected Event Date.
3. Derived pickup and return dates.
4. Quantity.
5. Fulfillment preference.
6. Downpayment amount.
7. Primary action.
8. Concise cancellation and hold-expiry note.

The booking rail must not imply delivery is guaranteed while its status is only requested.

### 9.8 Cart row

- Thumbnail, costume name, size, price, quantity stepper, and remove action.
- Event Date is controlled at cart level and repeated as contextual text only.
- Quantity changes revalidate the online cap and availability.
- Removing the last item keeps the selected Event Date only for the current browser session.

### 9.9 Order and payment status

Keep three state groups distinct:

- Rental: pending, booked, rented, overdue, returned, inspected, completed, cancelled.
- Payment: created, pending, paid, failed, expired, refund pending, refunded, refund failed.
- Delivery: not requested, requested, confirmed, declined.

Each status treatment includes a label and, where useful, a short next action. Never combine these into one ambiguous "order status".

### 9.10 Feedback and overlays

- Inline alert for validation or state that belongs to a section.
- Static informational alerts have no live-region role.
- Newly rendered errors use `role="alert"`; non-urgent confirmations use `role="status"` with polite announcements.
- Toast for a completed background action that needs no decision.
- Dialog for a consequential confirmation.
- Sheet for mobile filters, cart summary, and supporting controls.
- Full page state for payment processing, booking success, or an unrecoverable provider outage.

### 9.11 Mobile action bar

- Product detail, cart, and checkout reuse one safe-area-aware mobile action pattern.
- The bar reserves matching document space and hides before the marketplace footer enters view.
- Product detail shows the bar only while the inline booking action is outside the viewport.
- Disabled or guarded actions keep a persistent explanation immediately beside the action.

### 9.12 Marketplace theme toggle

- The desktop marketplace header places one 44px light/dark toggle immediately before the account control.
- The control uses moon and sun icons with an accessible action label and a restrained cross-fade.
- Theme selection persists in local storage and a cookie, then initializes before first paint on later visits.

## 10. Admin Components

Admin screens favor clear alignment and compact density:

- Page title and one primary action at the top.
- Filters in a stable toolbar.
- Tables for repeated operational records.
- Status chips with label and color.
- Row actions in a HeroUI menu.
- Detail information in labelled rows, not a field of unrelated cards.
- Empty state inside the data region with a direct recovery action.

Use tabular numerals for money, counts, dates, and order references. Right-align numeric table columns. Keep row height at least `48px`.

## 11. State Patterns

Every route must design these states before implementation is complete:

| State | Required behavior |
| --- | --- |
| Loading | Preserve the final layout with skeletons; never shift the primary action |
| Empty | Say what is empty and offer the next useful action |
| Validation error | Place actionable copy beside the affected control |
| Network error | Preserve entered data and provide retry |
| Auth required | Preserve cart and return the customer to the interrupted step |
| Payment processing | Poll or refresh from authoritative server state; never infer success from redirect data |
| Hold expiring | Show a live, text-labelled countdown when fewer than 15 minutes remain |
| Hold expired | Disable payment continuation and explain that inventory was released |
| Refund pending | State that booking will not be revived and show support guidance |
| Image failure | Keep card dimensions and show a neutral product fallback |

## 12. Motion

Motion level is restrained:

- Micro-interactions: `120ms to 180ms`.
- Popover, sheet, and dialog transitions: `180ms to 240ms`.
- Page content reveal: optional, `240ms` maximum.
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Animate only `transform`, `opacity`, `background-color`, `border-color`, and `box-shadow`.
- Never use `transition: all`.
- Hover transitions must reverse immediately when the pointer leaves.
- Honor `prefers-reduced-motion`.

Do not stagger large catalogue grids. The first useful content should not wait for decoration.

## 13. Accessibility

Target WCAG 2.2 AA:

- Visible `:focus-visible` ring with at least 2px contrast.
- Semantic buttons, links, headings, labels, lists, and tables.
- Keyboard support for menus, dialogs, filters, date selection, quantity controls, and galleries.
- Minimum touch target of `44px`.
- Text alternatives for product images.
- Announce asynchronous payment and availability changes through an appropriate live region.
- Do not use color as the only status signal.
- Do not disable zoom.
- Keep content usable at 200% zoom and at `320px` CSS width.
- Validate light and dark contrast independently.

## 14. Route Patterns

### Marketplace

- `/`: visual discovery, search, Event Date entry, featured categories, trust and policy summary.
- `/catalogue`: filters, sort, stable card grid, persistent Event Date context.
- `/costumes/[id]`: media gallery, details, availability, sticky booking rail.
- `/cart`: single Event Date, item rows, derived operational dates, price summary.
- `/checkout`: identity, fulfillment request, policy acceptance, payment summary.
- `/account/orders`: scan-friendly history with separated rental and payment states.
- `/orders/[id]`: timeline, payment state, fulfillment, cancellation eligibility, support.

### Admin

- `/admin/dashboard`: operational overview and exceptions.
- `/admin/catalogue`: inventory management.
- `/admin/pos`: staff checkout.
- `/admin/calendar`: rental overlap and pickup/return work.
- `/admin/rents`: lifecycle management.
- `/admin/clients`: business client profiles.
- Admin marketplace operations must surface stuck payments, failed refunds, expiring holds, and pending delivery requests.

## 15. Do and Do Not

Do:

- Lead with real costume imagery.
- Show price, Event Date, pickup, return, and downpayment near the decision.
- Use burgundy through semantic primary tokens for marketplace actions and selection.
- Use restrained borders before shadows.
- Keep customer and staff component providers isolated.
- Write plain Indonesian customer-facing status copy.

Do not:

- Add unapproved accent colors or use gold as a semantic workflow color.
- Put gradients on text or large background areas.
- Wrap every section in a floating card.
- use pill shapes for standard buttons, inputs, or containers.
- Use exact inventory or internal accounting data in the marketplace.
- Treat payment redirect parameters as proof of payment.
- Mix rental, payment, and delivery into one status.
- Add custom controls when the surface's component library already provides the behavior.

## 16. Implementation Notes

- Current admin theme source: `web/src/styles/global.css`.
- Customer tokens should live in a marketplace-specific stylesheet imported by the customer route layout.
- Prefer semantic variables such as `--mk-surface` over raw colors in components.
- Bind semantic variables to shadcn color variables inside the marketplace scope.
- Use Tailwind 4 utilities for layout and token references.
- Use `next/image` with explicit dimensions or `fill` plus a stable aspect-ratio container.
- Keep the standalone HTML gallery as a visual specification, not as production component source.

## 17. Agent Checklist

Before accepting a UI change:

1. Confirm whether the route is marketplace or admin.
2. Use only the component system assigned to that surface.
3. Reuse semantic tokens instead of adding raw color values.
4. Verify default, hover, focus, active, disabled, loading, empty, and error states.
5. Check keyboard behavior and 44px targets.
6. Check `320px`, `768px`, `1024px`, and `1440px` layouts.
7. Verify payment, rental, and delivery labels remain distinct.
8. Check that marketplace responses and UI expose no internal inventory or accounting fields.
9. Run the project code-quality workflow for changes inside `web/` or `backend/`.
10. Update this document when a new token or recurring visual pattern is introduced.
