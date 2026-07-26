# Marketplace UI/UX Improvement Handoff

> **Brand-direction supersession (2026-07-26):** The functional UX findings,
> accessibility requirements, component boundaries, workflow invariants, and
> route acceptance criteria in this document remain useful. Its indigo brand
> recommendation, optional-logo package, no-accent constraints, and brand
> non-goals are superseded by
> [`MARKETPLACE_BRAND_THEME_HANDOFF.md`](./MARKETPLACE_BRAND_THEME_HANDOFF.md).
> The current code already contains substantial portions of WP0-WP5, so an
> implementation pass must verify the baseline before creating duplicate work.

| Field | Value |
| --- | --- |
| Status | Ready for implementation |
| Prepared | 2026-07-26 |
| Scope | Customer marketplace only |
| Current visual quality | 7.4/10 |
| Primary routes reviewed | `/`, `/catalogue`, `/costumes/[id]`, `/cart`, `/checkout`, `/checkout/processing`, `/account/orders`, `/orders/[id]`, `/masuk` |

## 1. Purpose

This document hands off the findings from a rendered desktop and mobile review of the KBR Costume marketplace at `http://localhost:3000/`.

It translates the audit into:

- Confirmed findings with implementation evidence.
- A prioritized remediation backlog.
- Target interaction and layout behavior.
- Affected files and suggested component seams.
- Acceptance criteria and test coverage.
- Sequencing, risks, non-goals, and definition of done.

This is an implementation plan, not an instruction to redesign the marketplace from scratch.

## 2. Executive Summary

The marketplace already has a coherent and appropriate design direction:

- Costume photography supplies the visual energy.
- Indigo is used mainly for actions and selection.
- Indonesian rental terminology is specific and credible.
- Layout, spacing, radii, icons, and typography are consistent.
- Rental, payment, and delivery states remain distinct.
- Mobile layouts do not exhibit horizontal overflow.

The interface does **not** broadly read as generic “purple AI slop.” The indigo palette is not the root problem. The highest-impact issues are:

1. Dark-mode primary buttons use the wrong foreground color and fail text contrast.
2. Product-detail hierarchy delays the product identity on desktop and the booking action on mobile.
3. Checkout looks actionable before mandatory terms are accepted.
4. Mobile filters have no explicit completion action or visible result count.
5. Product discovery begins later than necessary on the home and catalogue pages.
6. Static informational notices are exposed as assertive alerts.
7. Several supporting links and secondary text treatments need accessibility refinement.

The recommended approach is to keep the approved design system, correct its implementation, and improve the purchase funnel in four focused stages.

## 3. Audit Context

### 3.1 Viewports reviewed

- Desktop: `1280 × 720`
- Mobile: `390 × 844`

Additional implementation validation must cover `320`, `768`, `1024`, and `1440` CSS pixel widths.

### 3.2 Journey reviewed

```text
Home
  -> Catalogue
  -> Costume detail
  -> Add to cart
  -> Cart
  -> Checkout
  -> Payment processing
  -> Order history
  -> Order detail
  -> Cancellation confirmation
```

Authentication was also reviewed at `/masuk`.

### 3.3 Review dimensions

- Visual hierarchy
- Typography and content density
- Color and contrast
- Spacing and depth
- Component consistency
- Interaction states and feedback
- Mobile ergonomics and touch targets
- Keyboard and screen-reader behavior
- Workflow semantics
- Cross-screen consistency
- Perceived performance

## 4. Design Direction Verdict

### 4.1 Keep the indigo system

The current core palette is appropriate for a trusted creative rental product:

- Light primary: `#4F46E5`
- Dark primary: `#8B92FF`
- Neutral light canvas: `#F5F6F8`
- Neutral dark canvas: `#101116`

Indigo should remain the single brand/action color. Do not introduce a second decorative accent during this improvement pass. Costume photography should continue to provide cultural color and visual variety.

### 4.2 Why the marketplace does not look generic

- Copy refers to Event Date, D-2/D+1, downpayment, pickup, return, and delivery requests.
- Product photographs dominate instead of abstract illustrations.
- Surfaces use borders and restrained depth instead of excessive glass effects.
- Primary actions are specific to the rental task.
- Payment, booking, and delivery are not collapsed into one ambiguous state.

### 4.3 Optional brand polish

The logo is the most template-like element because it combines:

- A purple gradient tile.
- Glow.
- Sparkles.
- A generic hanger symbol.

If the brand mark is revised later, prefer a flat indigo KBR/hanger mark with one distinctive costume or textile-derived construction detail. This is optional P3 work and must not block the funnel and accessibility improvements.

Source: [`web/public/kbr-logo.svg`](web/public/kbr-logo.svg)

## 5. What Is Working Well

### 5.1 Product and policy clarity

- Event Date is consistently treated as the customer’s primary date decision.
- Pickup and return dates are derived and shown contextually.
- The cart explicitly states that inventory is not held yet.
- Payment processing correctly says that redirect return does not prove payment.
- Cancellation explicitly communicates downpayment forfeiture.

### 5.2 Responsive structure

- The catalogue becomes a stable two-column grid on mobile.
- Header actions remain understandable at narrow widths.
- Checkout summary becomes an accordion on mobile.
- Cart and order content stack without horizontal scrolling.

### 5.3 Interaction fundamentals

- Primary controls are generally 44–52px high.
- Focus rings are visible.
- Product add-to-cart feedback is clear and includes a route to the cart.
- Destructive cancellation requires explicit acknowledgement.
- Quantity limits are visible near quantity controls.

### 5.4 Domain state design

Order detail correctly separates:

- Rental status.
- Payment status.
- Delivery status.

This separation must be preserved through all visual refactors.

## 6. Prioritized Findings

| ID | Priority | Element | Problem | User impact | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| F-01 | P0 | Dark primary actions | Components hardcode white text over `#8B92FF`. Contrast is approximately `2.74:1`; hover is approximately `2.14:1`. | Main actions are harder to read and fail normal-text contrast. | Use `--mk-on-primary` for every foreground rendered over `--mk-primary` or its hover state. |
| F-02 | P0 | Filled destructive action | The dark danger foreground is light while the cancellation confirmation hardcodes white text on the same light danger fill. | Destructive confirmation may be difficult to read in dark mode. | Add and use an explicit `--mk-on-danger` token for filled destructive buttons. |
| F-03 | P0 | Checkout policy acceptance | The payment button appears enabled before terms are accepted. Submission fails but leaves focus on the payment button. | A high-trust action feels inconsistent and customers must locate the checkbox again. | Make the constraint visible near the CTA and move focus/scroll to the terms control after an invalid attempt. |
| F-04 | P0 | Alert semantics | The shared `Alert` primitive assigns `role="alert"` to static account, stock, payment, and delivery notices. | Screen readers may announce ordinary page content as urgent. | Make Alert neutral by default. Apply `role="alert"` only to newly rendered errors and `role="status"` to polite confirmations. |
| F-05 | P0 | Skip navigation | Marketplace layout has a `<main>` but no skip link or main target ID. | Keyboard users must traverse the full sticky header on every route. | Add a focus-visible “Lewati ke konten utama” link and `id="main-content"`. |
| F-06 | P1 | Desktop product detail | Product name and description appear below the full gallery while the booking rail starts beside the gallery. | Customers see price and controls before confirming the product identity. | Move region, name, description, price, and availability above the media/booking split. |
| F-07 | P1 | Mobile product detail | Booking controls appear after description, specification, set contents, and policies. | The primary action is several screens away from the product impression. | Move core booking controls immediately after the summary and add a contextual sticky bottom action. |
| F-08 | P1 | Mobile catalogue filters | Filter sheet occupies most of the viewport, changes live behind the sheet, and lacks Reset or result-count actions. | Customers cannot tell when filtering is complete or how many results remain. | Use draft state and a sticky sheet footer with “Reset” and “Tampilkan N kostum.” |
| F-09 | P1 | Catalogue density | At `1280 × 720`, customers mostly see product images; names and prices fall near or below the fold. Current grid remains three columns at `xl`. | Comparison information is delayed. | Align the grid with `DESIGN.md`: three columns at `lg`, four at `xl`, while preserving the 4:5 image ratio. |
| F-10 | P1 | Home discovery | The hero uses the entire viewport below the header. Featured products start completely below the first screen. | Browsing customers receive no immediate product preview. | Reduce minimum hero height and vertical padding so the next section is partially visible. |
| F-11 | P1 | Mobile cart and checkout | The primary action is static at the bottom of a long page. | Customers scroll farther and can lose cost/action context. | Add safe-area-aware mobile action bars for cart and checkout. |
| F-12 | P2 | Light subtle text | `--mk-subtle` is approximately `3.03:1` on the light canvas and `3.28:1` on white. It is used for 12px rental/footer copy. | Small supporting text can be difficult to read. | Use `--mk-muted` for meaningful text; reserve `--mk-subtle` for icons or nonessential decoration, or darken the token. |
| F-13 | P2 | Authentication and footer links | “Lupa kata sandi?”, “Daftar”, and footer links have small vertical hit boxes. | Mobile interaction is less comfortable even though the visible type is readable. | Wrap links in inline-flex targets with a minimum 44px interactive height where practical. |
| F-14 | P2 | Order history rows | Only the 44px arrow opens order detail even though the card visually reads as one item. | The perceived interactive area and actual target do not match. | Make the primary order-content area or full card link to order detail. Keep nested actions independent. |
| F-15 | P2 | Disabled quantity controls | A quantity stepper remains visible even when maximum quantity is one and both controls cannot change the value. | The interface presents affordances with no useful action. | Render a simple “Jumlah 1” treatment when `maxQuantity === 1`; use the stepper only when quantity can change. |
| F-16 | P2 | Language consistency | “Rental Fee” appears in otherwise Indonesian customer-facing summaries. | Small terminology inconsistencies reduce polish. | Use the approved domain term consistently, preferably “Biaya sewa” in customer UI. |
| F-17 | P2 | Route metadata | Client-rendered cart and checkout pages fall back to the generic `KBR Costume` title. | Browser history and assistive navigation provide less context. | Add route layouts or server wrappers that export unique metadata. |
| F-18 | P2 | LCP image loading | The browser logged a warning for `/marketplace/tari-pendet.webp` being detected as LCP without eager loading in one reviewed route. | Above-fold imagery may delay perceived completion. | Identify the exact route and mark only its true above-fold LCP image as eager/priority. Verify sizes and avoid over-prioritizing grid images. |

## 7. Measured Color Evidence

### 7.1 Current contrast ratios

| Combination | Ratio | Result |
| --- | ---: | --- |
| Dark ink on dark canvas | `17.62:1` | Pass |
| Dark muted text on dark canvas | `9.10:1` | Pass |
| Dark subtle text on dark canvas | `5.82:1` | Pass |
| White on dark primary `#8B92FF` | `2.74:1` | Fail for normal text |
| White on dark primary hover `#A5AAFF` | `2.14:1` | Fail |
| `#111222` on dark primary `#8B92FF` | `6.75:1` | Pass |
| Light muted text on light canvas | `5.01:1` | Pass |
| Light subtle text on light canvas | `3.03:1` | Fail for normal text |
| Light subtle text on white surface | `3.28:1` | Fail for normal text |
| White on light primary `#4F46E5` | `6.29:1` | Pass |

### 7.2 Root cause

The palette already defines the correct foreground token:

```css
/* Light */
--mk-primary: #4f46e5;
--mk-on-primary: #fff;

/* Dark */
--mk-primary: #8b92ff;
--mk-on-primary: #111222;
```

The failure occurs because multiple components override the semantic foreground with `text-white`.

Representative sources:

- [`web/src/styles/marketplace.css`](web/src/styles/marketplace.css)
- [`web/src/marketplace/components/HeroSearch.jsx`](web/src/marketplace/components/HeroSearch.jsx)
- [`web/src/marketplace/components/BookingRail.jsx`](web/src/marketplace/components/BookingRail.jsx)
- [`web/src/marketplace/components/CustomerAuthCard.jsx`](web/src/marketplace/components/CustomerAuthCard.jsx)
- [`web/src/app/(marketplace)/cart/page.jsx`](<web/src/app/(marketplace)/cart/page.jsx>)
- [`web/src/app/(marketplace)/checkout/page.jsx`](<web/src/app/(marketplace)/checkout/page.jsx>)
- [`web/src/app/(marketplace)/checkout/processing/page.jsx`](<web/src/app/(marketplace)/checkout/processing/page.jsx>)

### 7.3 Implementation rule

No component should determine foreground color independently when rendered on a semantic fill.

Use:

```text
primary fill      -> --mk-on-primary
danger fill       -> --mk-on-danger
success fill      -> --mk-on-success, only if a filled success action is introduced
warning fill      -> --mk-on-warning, only if a filled warning action is introduced
```

Status foreground colors on soft status surfaces can remain unchanged.

## 8. Target Layouts

### 8.1 Product detail: desktop

```text
+----------------------------------------------------------------------------+
| < Kembali ke katalog                                                       |
|                                                                            |
| BALI                                                                       |
| Set Tari Pendet Bali                         Rp 210.000   [Tersedia]         |
| Full costume summary and essential rental fit information                  |
+---------------------------------------------+------------------------------+
|                                             | TANGGAL ACARA                |
|              MAIN GALLERY                   | [ 17 Agustus 2026 ]          |
|                                             |                              |
|       Full image + two detail images        | Ambil 15 Agt / Kembali 18 Agt|
|                                             |                              |
|                                             | Jumlah          [-] 1 [+]    |
|                                             |                              |
|                                             | (x) Ambil  ( ) Minta antar   |
|                                             |                              |
|                                             | DP 50%          Rp 105.000   |
|                                             | [Tambah ke keranjang]        |
+---------------------------------------------+------------------------------+
| Detail kostum | Termasuk dalam set | Policies                              |
+----------------------------------------------------------------------------+
```

### 8.2 Product detail: mobile

```text
+--------------------------------------+
| < Katalog                            |
|                                      |
| [          PRODUCT IMAGE          ]  |
|                                      |
| BALI                    [Tersedia]    |
| Set Tari Pendet Bali                 |
| Rp 210.000                           |
| Short product summary                |
|                                      |
| TANGGAL ACARA                        |
| [ 17 Agustus 2026                 ]  |
| Ambil 15 Agt  ->  Kembali 18 Agt     |
|                                      |
| Jumlah 1       Ambil / Minta antar   |
|                                      |
| Detail kostum                       v|
| Termasuk dalam set                  v|
| Kebijakan sewa                      v|
+--------------------------------------+
| Rp 210.000   [Tambah ke keranjang]   |  sticky
+--------------------------------------+
```

Sticky action behavior:

- Appears after the inline booking action scrolls out of view.
- Includes safe-area bottom padding.
- Never hides the last page content.
- Opens or focuses the date control if Event Date is missing.
- Adds the item immediately only when all required choices are valid.

### 8.3 Mobile filter sheet

```text
+--------------------------------------+
| Filter katalog                    X  |
+--------------------------------------+
| Daerah                              |
| [Semua daerah                    v] |
|                                      |
| Kategori                            |
| [Semua kategori                  v] |
|                                      |
| Ukuran                              |
| [Semua ukuran                    v] |
|                                      |
|                                      |
+--------------------------------------+
| [Reset]       [Tampilkan 4 kostum]  |  sticky
+--------------------------------------+
```

Filter behavior:

- Opening the sheet copies applied filters into draft state.
- Changing draft filters does not mutate catalogue results behind the overlay.
- “Tampilkan N kostum” commits draft filters and closes the sheet.
- Reset clears draft filters while leaving the sheet open.
- Closing without applying discards draft changes.
- Search and Event Date remain outside the filter draft.

### 8.4 Mobile checkout action

```text
+--------------------------------------+
| Terms acknowledgement               |
| [ ] Saya memahami kebijakan...      |
|                                      |
| Validation message, when needed      |
+--------------------------------------+
| DP Rp 105.000    [Bayar sekarang]   |  sticky
+--------------------------------------+
```

Unavailable state:

- The button remains legible.
- Nearby text says “Setujui ketentuan pembatalan untuk melanjutkan.”
- An attempted activation focuses and scrolls to the terms checkbox.
- `aria-describedby` connects the CTA or checkbox to the constraint/error.

## 9. Implementation Work Packages

### WP0 — Accessibility and Semantic Color Foundation

- Priority: P0
- Expected scope: Small-to-medium
- Blocks: WP1, WP2, WP3

### Goals

- Correct all semantic fill/foreground combinations.
- Correct static and dynamic announcement behavior.
- Add skip navigation.
- Establish reusable accessibility behavior before adding sticky controls.

### Primary files

- [`web/src/styles/marketplace.css`](web/src/styles/marketplace.css)
- [`web/src/components/ui/alert.jsx`](web/src/components/ui/alert.jsx)
- [`web/src/app/(marketplace)/layout.jsx`](<web/src/app/(marketplace)/layout.jsx>)
- [`web/src/marketplace/components/HeroSearch.jsx`](web/src/marketplace/components/HeroSearch.jsx)
- [`web/src/marketplace/components/MarketplaceHeader.jsx`](web/src/marketplace/components/MarketplaceHeader.jsx)
- [`web/src/marketplace/components/MarketplaceFooter.jsx`](web/src/marketplace/components/MarketplaceFooter.jsx)
- All marketplace components using `text-white` over semantic colors.

### Implementation notes

1. Replace hardcoded foregrounds on primary fills with `text-[var(--mk-on-primary)]`.
2. Add `--mk-on-danger` for light and dark themes.
3. Audit any translucent child text on primary fills; derive it from the on-color rather than white.
4. Replace meaningful `--mk-subtle` text with `--mk-muted`, or adjust the token to pass 4.5:1.
5. Remove `role="alert"` from the Alert primitive default.
6. Pass roles intentionally at call sites:
   - Dynamic error: `role="alert"`.
   - Dynamic success/status: `role="status"` with `aria-live="polite"` when necessary.
   - Static notice: no live-region role.
7. Add a skip link before the header and `id="main-content"` on the main landmark.
8. Preserve the existing visible focus-ring treatment.

### Acceptance criteria

- All normal text reaches at least `4.5:1`.
- Large text and meaningful UI graphics reach at least `3:1`.
- Dark primary and hover labels remain readable.
- Static checkout/account notices are not assertively announced.
- New form errors are announced once.
- First Tab on a marketplace route reveals the skip link.
- Activating the skip link moves focus to the main content.
- Light and dark themes both pass manual contrast review.

### Tests

- Add token/utility assertions where practical.
- Add Testing Library coverage for Alert role behavior.
- Add keyboard coverage for skip navigation.
- Add an automated accessibility scan to the E2E flow if axe is introduced.

### WP1 — Product Detail Hierarchy and Mobile Booking Action

- Priority: P1
- Expected scope: Medium
- Depends on: WP0

### Goals

- Put product identity before booking controls.
- Reduce the distance between product evaluation and booking.
- Preserve the approved 60/40 desktop structure.

### Primary files

- [`web/src/app/(marketplace)/costumes/[id]/page.jsx`](<web/src/app/(marketplace)/costumes/[id]/page.jsx>)
- [`web/src/marketplace/components/BookingRail.jsx`](web/src/marketplace/components/BookingRail.jsx)
- [`web/src/marketplace/components/QuantityStepper.jsx`](web/src/marketplace/components/QuantityStepper.jsx)
- Suggested new component: `web/src/marketplace/components/MobileBookingBar.jsx`

### Implementation notes

1. Render region, product name, short description, price, and availability before the main two-column grid.
2. Keep detailed specifications and policy accordions beneath the grid.
3. On mobile, place essential booking controls immediately after the summary.
4. Introduce a sticky booking bar only after the inline CTA is no longer visible.
5. Share add-to-cart validation and action logic between inline and sticky controls.
6. When `maxQuantity === 1`, replace the disabled stepper with a fixed quantity display.
7. Do not imply that delivery is guaranteed.
8. Do not duplicate live regions when inline and sticky actions share state.

### Acceptance criteria

- At `1280 × 720`, product name, price, availability, gallery, and the top of the booking rail are visible without scrolling.
- At `390 × 844`, product name, price, and a clear path to the primary action are visible in the first useful product sequence.
- Sticky action appears only when useful and never overlaps footer or final content.
- Missing Event Date moves focus to the date control with actionable feedback.
- Add-to-cart works identically from inline and sticky actions.
- `maxQuantity === 1` presents no nonfunctional increment/decrement affordance.

### Tests

- Product-detail visual snapshots at mobile and desktop widths.
- Keyboard flow through date, fulfillment, quantity, and add-to-cart.
- Sticky action visibility based on inline-action intersection.
- Missing-date error and focus behavior.
- Quantity-one and quantity-multiple variants.

### WP2 — Catalogue Discovery and Mobile Filters

- Priority: P1
- Expected scope: Medium
- Depends on: WP0

### Goals

- Show complete product decision units sooner.
- Make mobile filtering explicit and reversible.
- Align catalogue breakpoints with `DESIGN.md`.

### Primary files

- [`web/src/marketplace/components/CatalogueClient.jsx`](web/src/marketplace/components/CatalogueClient.jsx)
- [`web/src/marketplace/components/CostumeCard.jsx`](web/src/marketplace/components/CostumeCard.jsx)
- [`web/src/app/(marketplace)/catalogue/page.jsx`](<web/src/app/(marketplace)/catalogue/page.jsx>)

### Implementation notes

1. Keep the stable 4:5 image ratio.
2. Change the result grid to:
   - Two columns below `lg`.
   - Three columns at `lg`.
   - Four columns at `xl`.
3. Verify the filter rail and gaps still leave readable card widths.
4. Add mobile draft filter state separate from applied filter state.
5. Add a sticky footer to the sheet with Reset and result-count Apply.
6. Limit the sheet to roughly `65–75dvh` unless content requires more.
7. Announce the applied result count politely after the sheet closes.
8. Preserve search text, Event Date, sort order, and applied filters across navigation where appropriate.
9. Keep card title and quick-add targets independently keyboard accessible.

### Acceptance criteria

- At `1280 × 720`, at least one complete first-row card shows image, name, metadata, and price.
- At `1024px`, the catalogue displays three stable result columns when the filter rail is present.
- At `1280px` and above, the result area displays four columns.
- Mobile sheet includes Reset and “Tampilkan N kostum.”
- Closing without applying does not mutate results.
- Applying filters closes the sheet and moves focus back to the filter trigger.
- Empty results provide an actionable recovery.
- No exact internal inventory data is exposed.

### Tests

- Draft/applied filter state unit tests.
- Reset, cancel, and apply interaction tests.
- Result-count announcement test.
- Desktop and mobile layout screenshots.
- Empty-result flow.

### WP3 — Mobile Cart and Checkout Completion

- Priority: P1
- Expected scope: Medium
- Depends on: WP0

### Goals

- Keep total and primary action available on long mobile pages.
- Make checkout eligibility unambiguous.
- Preserve one obvious action per decision area.

### Primary files

- [`web/src/app/(marketplace)/cart/page.jsx`](<web/src/app/(marketplace)/cart/page.jsx>)
- [`web/src/app/(marketplace)/checkout/page.jsx`](<web/src/app/(marketplace)/checkout/page.jsx>)
- Suggested reusable component: `web/src/marketplace/components/MobileActionBar.jsx`

### Implementation notes

1. Add a cart action bar containing downpayment amount and “Lanjut ke checkout.”
2. Add a checkout action bar containing payable amount and payment action.
3. Use `padding-bottom: env(safe-area-inset-bottom)` and reserve document space equal to the action-bar height.
4. Keep desktop summary rails unchanged.
5. Connect terms errors with `aria-describedby`.
6. On invalid submission:
   - Set the error.
   - Mark the checkbox `aria-invalid`.
   - Scroll the terms card into view.
   - Focus the checkbox.
7. Decide one consistent unavailable-action behavior:
   - Preferred: focusable `aria-disabled` action with explanatory text and guarded activation.
   - Acceptable: native disabled action only if the reason is persistently visible immediately beside it.
8. Change customer-facing “Rental Fee” to “Biaya sewa.”

### Acceptance criteria

- The mobile action remains available without obscuring content.
- The amount in the action bar always matches the summary.
- Checkout cannot navigate to processing until terms are accepted.
- Invalid submission moves attention to the actual problem.
- Screen readers receive one concise error announcement.
- Desktop layout does not gain duplicate primary actions.
- The action bar does not cover the footer or last form control.

### Tests

- Terms-unchecked and terms-checked submission.
- Focus target after invalid submission.
- Mobile action-bar visual test.
- Safe-area and 320px layout check.
- Amount calculation consistency.
- Empty-cart and nonhydrated states.

### WP4 — Navigation, Order History, and Copy Polish

- Priority: P2
- Expected scope: Small
- Depends on: WP0

### Goals

- Improve target sizing and perceived click behavior.
- Normalize terminology and page titles.
- Retain the current restrained component language.

### Primary files

- [`web/src/marketplace/components/CustomerAuthCard.jsx`](web/src/marketplace/components/CustomerAuthCard.jsx)
- [`web/src/marketplace/components/MarketplaceFooter.jsx`](web/src/marketplace/components/MarketplaceFooter.jsx)
- [`web/src/app/(marketplace)/account/orders/page.jsx`](<web/src/app/(marketplace)/account/orders/page.jsx>)
- [`web/src/app/(marketplace)/cart/page.jsx`](<web/src/app/(marketplace)/cart/page.jsx>)
- [`web/src/app/(marketplace)/checkout/page.jsx`](<web/src/app/(marketplace)/checkout/page.jsx>)
- Suggested route metadata files under `cart/` and `checkout/`.

### Implementation notes

1. Expand small text-link hit areas without enlarging visible text.
2. Make order rows/cards open detail while retaining proper accessible names.
3. Avoid nesting interactive controls inside a full-card link. If future row actions are required, use a stretched-link pattern on the primary content area instead.
4. Add unique cart and checkout titles through server layouts or metadata wrappers.
5. Normalize Indonesian customer labels.
6. Preserve the existing order state separation and cancellation hierarchy.

### Acceptance criteria

- Important mobile text links provide comfortable touch targets.
- Clicking the primary area of an order row opens detail.
- Keyboard users can focus and open each order with a descriptive name.
- Cart and checkout have unique browser titles.
- Customer-facing summaries use consistent Indonesian terminology.

### WP5 — Home Discovery and Perceived Performance

- Priority: P2
- Expected scope: Small-to-medium
- Depends on: WP0

### Goals

- Let the first viewport hint at catalogue depth.
- Resolve the observed LCP warning without over-eager loading.
- Avoid layout shift during cart hydration.

### Primary files

- [`web/src/app/(marketplace)/page.jsx`](<web/src/app/(marketplace)/page.jsx>)
- [`web/src/marketplace/components/CostumeCard.jsx`](web/src/marketplace/components/CostumeCard.jsx)
- [`web/src/marketplace/components/MarketplaceHeader.jsx`](web/src/marketplace/components/MarketplaceHeader.jsx)
- Any route identified as the source of the LCP warning.

### Implementation notes

1. Replace the full-viewport hero minimum with a constrained height or smaller breakpoint-specific padding.
2. Preserve the large display statement and search prominence.
3. Show a visible edge or beginning of featured products at common laptop heights.
4. Inspect which `tari-pendet.webp` instance becomes LCP.
5. Apply eager/priority only to the actual above-fold LCP image.
6. Keep stable aspect-ratio boxes and accurate `sizes`.
7. Verify the cart badge does not cause measurable layout shift after hydration.

### Acceptance criteria

- At `1280 × 720`, users can see that featured products continue below the hero.
- Hero search remains the dominant task.
- No Next.js LCP image warning occurs in the audited flow.
- LCP remains at or below `2.5s` at p75 under the project’s target test profile.
- CLS remains at or below `0.1`.

### WP6 — Optional Brand Mark Simplification

- Priority: P3
- Expected scope: Separate design decision
- Depends on: None
- Blocks: Nothing

### Goals

- Reduce the only prominent generic gradient/sparkle treatment.
- Retain recognition and indigo continuity.

### Constraints

- Do not add a new decorative accent color.
- Do not modify the marketplace palette.
- Do not use AI-associated sparkle motifs.
- Test the mark at 38px and 40px, its actual header/footer sizes.
- Preserve a simple monochrome fallback.

### Acceptance criteria

- Mark remains legible at 32–40px.
- It works in light and dark modes.
- It does not rely on glow, gradients, or tiny text.
- Header layout dimensions do not change.

## 10. Recommended Sequencing

| Sequence | Package | Reason |
| ---: | --- | --- |
| 1 | WP0 | Establishes correct tokens and accessibility semantics used by every later change. |
| 2 | WP1 | Highest funnel impact and largest hierarchy correction. |
| 3 | WP2 | Improves product discovery and filter completion. |
| 4 | WP3 | Improves cart-to-payment completion and trust. |
| 5 | WP4 | Low-risk consistency and ergonomics polish. |
| 6 | WP5 | Performance and above-fold refinement after layouts stabilize. |
| Optional | WP6 | Brand refinement should remain independent from functional improvements. |

WP1 and WP2 may run in parallel after WP0. WP3 should reuse the mobile action pattern established in WP1 rather than introducing a second incompatible sticky-bar implementation.

## 11. Shared Component Strategy

### 11.1 Recommended reusable seams

#### `MobileActionBar`

Responsibilities:

- Sticky/fixed mobile positioning.
- Safe-area padding.
- Reserved page-bottom spacing.
- Amount or compact context.
- One primary action.
- Optional explanatory/unavailable text.

Consumers:

- Product detail.
- Cart.
- Checkout.

It should not own rental, cart, or payment business logic.

#### `SemanticAction`

This does not need to be a new component if the existing Button variants can express the behavior. The important rule is that semantic fills and foregrounds are paired in one reusable source.

#### Alert role variants

The existing `Alert` visual primitive should allow:

```text
visual variant: default | info | success | warning | destructive
announcement: none | status | alert
```

Visual status and announcement urgency must not be coupled automatically.

### 11.2 Avoid

- Route-specific sticky bars with slightly different padding and z-index.
- New raw color values inside marketplace components.
- Additional decorative card wrappers.
- A second filter state implementation for desktop.
- Separate add-to-cart logic for inline and mobile-sticky actions.
- Mixing HeroUI into marketplace routes.

## 12. Route-by-Route Acceptance Checklist

### `/`

- [ ] Primary search remains immediately understandable.
- [ ] Featured products are hinted at within a 720px-high laptop viewport.
- [ ] Hero image remains the only eager image unless measurement justifies another.
- [ ] Primary CTA uses semantic on-primary text.

### `/catalogue`

- [ ] Two, three, and four-column behavior matches the approved breakpoints.
- [ ] First desktop row exposes complete product decision information.
- [ ] Mobile filters use draft/apply behavior.
- [ ] Applied result count is announced politely.
- [ ] Empty state has a direct recovery action.

### `/costumes/[id]`

- [ ] Product identity precedes gallery and controls.
- [ ] Price and availability are adjacent to product identity.
- [ ] Booking rail remains sticky only on desktop.
- [ ] Mobile action appears contextually and respects safe area.
- [ ] Quantity-one state has no unusable stepper.
- [ ] Delivery continues to read as a request.

### `/cart`

- [ ] Event Date remains cart-wide.
- [ ] Inventory-not-held notice remains visible but is not an assertive alert.
- [ ] Mobile checkout action preserves amount context.
- [ ] Empty and loading states retain layout stability.
- [ ] “Biaya sewa” terminology is consistent.

### `/checkout`

- [ ] Customer, rental period, fulfillment, terms, and summary have one clear reading order.
- [ ] Payment action cannot proceed without acknowledgement.
- [ ] Invalid acknowledgement focuses the checkbox.
- [ ] Static account and delivery notices are not assertively announced.
- [ ] Mobile action does not obscure form content.
- [ ] Page title is unique.

### `/checkout/processing`

- [ ] Processing remains visually different from success.
- [ ] Status changes use a polite live region.
- [ ] The page never infers success from redirect parameters.
- [ ] Retry action preserves stable layout.

### `/account/orders`

- [ ] Primary order row area opens detail.
- [ ] Rental status remains visible.
- [ ] Order reference, Event Date, and total remain scannable.
- [ ] Touch and keyboard targets match the perceived row behavior.

### `/orders/[id]`

- [ ] Rental, payment, and delivery states remain separate.
- [ ] Cancellation remains visually subordinate until invoked.
- [ ] Cancellation acknowledgement still gates the destructive action.
- [ ] Timeline and important dates remain readable at 320px.

### `/masuk`, `/daftar`, `/lupa-kata-sandi`

- [ ] Small supporting links have comfortable targets.
- [ ] Form controls retain visible labels.
- [ ] Errors focus the relevant field.
- [ ] Authentication preserves the interrupted marketplace path and cart.

## 13. Testing and Validation Plan

### 13.1 Current test infrastructure issue

[`web/playwright.config.js`](web/playwright.config.js) still targets:

```js
baseURL: 'http://localhost:5173'
```

The marketplace is currently reviewed at Next.js port `3000`, and no E2E spec files were found under the configured `web/test/e2e` directory.

Before treating E2E validation as authoritative:

1. Update the Playwright base URL or derive it from an environment variable with `http://localhost:3000` as the project default.
2. Add desktop and mobile Chromium projects.
3. Add actual marketplace journey specs.
4. Configure the Next.js web server for local test startup if not supplied externally.

### 13.2 Minimum Playwright projects

```text
Desktop Chrome: 1280 × 720
Mobile Chrome:  390 × 844
Small mobile:   320 × 800
```

### 13.3 Core E2E flow

```text
browse
  -> enter Event Date
  -> filter
  -> open costume
  -> add to cart
  -> review cart
  -> checkout
  -> reject unchecked terms
  -> accept terms
  -> payment processing
  -> order history
  -> order detail
```

### 13.4 Interaction coverage

- [ ] Search and date query propagation.
- [ ] Mobile filter Reset, cancel, and Apply.
- [ ] Quantity cap one and cap greater than one.
- [ ] Add-to-cart status announcement.
- [ ] Cart hydration and empty state.
- [ ] Terms validation and focus movement.
- [ ] Sticky action visibility and safe-area spacing.
- [ ] Order row navigation.
- [ ] Cancellation dialog focus trap and return focus.
- [ ] Payment processing retry status.

### 13.5 Accessibility validation

Automated:

- [ ] axe scan on every primary route.
- [ ] Unique page title check.
- [ ] Landmark and heading checks.
- [ ] Accessible-name checks for icon buttons.
- [ ] Color contrast scan in light and dark modes.

Manual:

- [ ] Complete flow with keyboard only.
- [ ] Screen-reader smoke test with NVDA or VoiceOver.
- [ ] 200% browser zoom.
- [ ] Reduced-motion preference.
- [ ] System high-contrast or forced-colors mode.
- [ ] Focus visibility over every surface.

### 13.6 Responsive validation matrix

| Width | Required review |
| ---: | --- |
| `320px` | No horizontal scroll; compact labels and sticky actions remain usable. |
| `390px` | Primary mobile reference; full customer journey. |
| `768px` | Tablet stacking and grid transition. |
| `1024px` | Three-column catalogue and desktop rail thresholds. |
| `1280px` | Laptop-height composition at `720px` height. |
| `1440px` | Maximum container behavior and four-column catalogue. |

### 13.7 Theme validation

Every route must be checked independently in:

- Light mode.
- Dark mode.
- Reduced motion.

Do not assume a token that passes on one surface passes on another.

## 14. Product and UX Metrics

The improvement pass should be evaluated against funnel and usability outcomes rather than subjective visual preference alone.

Recommended measures:

- Catalogue-to-detail click-through rate.
- Product-detail-to-cart conversion.
- Cart-to-checkout continuation.
- Checkout validation-error rate for terms acceptance.
- Payment-start-to-processing transition.
- Mobile filter open-to-apply rate.
- Mobile filter abandonment rate.
- Average time from product detail open to add-to-cart.
- LCP, INP, and CLS at p75.
- Accessibility violations per primary route.

Target technical thresholds:

- LCP: `≤ 2.5s` at p75.
- INP: `≤ 200ms` at p75.
- CLS: `≤ 0.1` at p75.
- Double booking: zero; unaffected by this UI pass.

## 15. Risks and Tradeoffs

### 15.1 Sticky action duplication

Risk: Product detail may expose both inline and sticky primary actions simultaneously.

Mitigation: Use intersection state so the sticky action only appears after the inline action exits the viewport.

### 15.2 Hidden checkout constraint

Risk: A natively disabled payment button cannot receive focus and may not explain why it is unavailable.

Mitigation: Keep the reason persistently visible. Prefer a guarded, focusable `aria-disabled` pattern if it can be implemented reliably.

### 15.3 Catalogue card width

Risk: Four columns beside a filter rail may compress long costume names.

Mitigation: Validate at 1280px, allow two-line titles, and keep metadata concise. Do not truncate meaningful names to one line.

### 15.4 Alert role regression

Risk: Removing the primitive’s default `role="alert"` could silence real dynamic errors.

Mitigation: Audit every Alert call site and add explicit announcement intent.

### 15.5 Safe-area and footer overlap

Risk: Fixed mobile actions may cover the last controls or footer.

Mitigation: Reserve matching document padding and test iOS-style safe-area insets.

### 15.6 Brand scope expansion

Risk: Logo exploration could delay conversion and accessibility fixes.

Mitigation: Keep WP6 optional and independent.

## 16. Explicit Non-Goals

This UI/UX improvement pass does not include:

- Replacing the indigo palette.
- Adding beige, terracotta, gold, or another decorative accent.
- Rebuilding the marketplace component library.
- Mixing HeroUI into customer routes.
- Redesigning admin screens.
- Changing rental, payment, inventory, or delivery business rules.
- Adding guest checkout, flexible rental dates, reviews, wishlists, recommendations, or delivery pricing.
- Changing the standard 4:5 catalogue photography ratio.
- Inferring payment success from a redirect.
- Exposing exact inventory or internal accounting fields.

## 17. Definition of Done

The improvement effort is complete only when:

- [ ] All P0 findings are resolved.
- [ ] WP1, WP2, and WP3 acceptance criteria pass.
- [ ] Light and dark primary actions meet contrast requirements.
- [ ] Meaningful normal text meets `4.5:1`.
- [ ] Static notices are not assertive live regions.
- [ ] Keyboard users can skip navigation and recover from validation errors.
- [ ] Product identity precedes the booking decision on desktop.
- [ ] Mobile product, cart, and checkout actions are reachable without obscuring content.
- [ ] Mobile filtering has explicit Apply and Reset behavior.
- [ ] Catalogue breakpoints match `DESIGN.md`.
- [ ] Primary routes pass at `320`, `390`, `768`, `1024`, and `1440` widths.
- [ ] The marketplace E2E flow runs against port `3000`.
- [ ] Playwright includes at least one desktop and one mobile project.
- [ ] No browser console errors or unresolved LCP warnings remain in the audited flow.
- [ ] Existing rental/payment/delivery status separation is preserved.
- [ ] Documentation is updated if a reusable token or UI pattern changes.
- [ ] The project `code-quality` skill completes successfully and all reported frontend issues are resolved.

## 18. Implementation Handoff Checklist

Before starting:

- [ ] Confirm the working tree contains user changes and do not overwrite unrelated work.
- [ ] Read `CONTEXT.md`, `ARCHITECTURE.md`, and `DESIGN.md`.
- [ ] Capture current desktop and mobile screenshots for comparison.
- [ ] Create implementation tickets by work package, not by route alone.

During implementation:

- [ ] Reuse shadcn/Radix marketplace components.
- [ ] Keep semantic foreground/fill logic centralized.
- [ ] Add tests with each behavior change.
- [ ] Validate both light and dark modes.
- [ ] Keep customer-facing language in Indonesian.

Before handoff:

- [ ] Run unit tests.
- [ ] Run marketplace Playwright flows.
- [ ] Run keyboard and contrast checks.
- [ ] Run the required `code-quality` workflow.
- [ ] Update `DESIGN.md` only for accepted recurring patterns or token changes.
- [ ] Report any remaining limitations explicitly.

## 19. Source Map

| Area | Source |
| --- | --- |
| Marketplace tokens | [`web/src/styles/marketplace.css`](web/src/styles/marketplace.css) |
| Marketplace shell | [`web/src/app/(marketplace)/layout.jsx`](<web/src/app/(marketplace)/layout.jsx>) |
| Home | [`web/src/app/(marketplace)/page.jsx`](<web/src/app/(marketplace)/page.jsx>) |
| Header | [`web/src/marketplace/components/MarketplaceHeader.jsx`](web/src/marketplace/components/MarketplaceHeader.jsx) |
| Footer | [`web/src/marketplace/components/MarketplaceFooter.jsx`](web/src/marketplace/components/MarketplaceFooter.jsx) |
| Hero search | [`web/src/marketplace/components/HeroSearch.jsx`](web/src/marketplace/components/HeroSearch.jsx) |
| Catalogue | [`web/src/marketplace/components/CatalogueClient.jsx`](web/src/marketplace/components/CatalogueClient.jsx) |
| Product card | [`web/src/marketplace/components/CostumeCard.jsx`](web/src/marketplace/components/CostumeCard.jsx) |
| Product detail | [`web/src/app/(marketplace)/costumes/[id]/page.jsx`](<web/src/app/(marketplace)/costumes/[id]/page.jsx>) |
| Booking rail | [`web/src/marketplace/components/BookingRail.jsx`](web/src/marketplace/components/BookingRail.jsx) |
| Quantity | [`web/src/marketplace/components/QuantityStepper.jsx`](web/src/marketplace/components/QuantityStepper.jsx) |
| Cart | [`web/src/app/(marketplace)/cart/page.jsx`](<web/src/app/(marketplace)/cart/page.jsx>) |
| Checkout | [`web/src/app/(marketplace)/checkout/page.jsx`](<web/src/app/(marketplace)/checkout/page.jsx>) |
| Processing | [`web/src/app/(marketplace)/checkout/processing/page.jsx`](<web/src/app/(marketplace)/checkout/processing/page.jsx>) |
| Authentication card | [`web/src/marketplace/components/CustomerAuthCard.jsx`](web/src/marketplace/components/CustomerAuthCard.jsx) |
| Order history | [`web/src/app/(marketplace)/account/orders/page.jsx`](<web/src/app/(marketplace)/account/orders/page.jsx>) |
| Order detail | [`web/src/app/(marketplace)/orders/[id]/page.jsx`](<web/src/app/(marketplace)/orders/[id]/page.jsx>) |
| Cancellation | [`web/src/marketplace/components/CancelBookingDialog.jsx`](web/src/marketplace/components/CancelBookingDialog.jsx) |
| Alert primitive | [`web/src/components/ui/alert.jsx`](web/src/components/ui/alert.jsx) |
| Existing unit coverage | [`web/src/tests/Marketplace.test.jsx`](web/src/tests/Marketplace.test.jsx) |
| Playwright configuration | [`web/playwright.config.js`](web/playwright.config.js) |
