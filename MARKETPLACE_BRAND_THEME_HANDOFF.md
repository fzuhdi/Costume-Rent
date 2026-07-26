# Marketplace Brand Theme Implementation Handoff

| Field | Value |
| --- | --- |
| Status | Implementation-ready plan; application changes not approved |
| Prepared | 2026-07-26 |
| Scope | Customer marketplace brand and theme only |
| Interim public name | `KBR Costume` |
| Interim descriptor | `Kostum Tari Bu Risna` |
| Admin impact | None in this pass |
| Business-logic impact | None |
| Source logo | `C:\Users\fzuhd\AppData\Local\Temp\codex-clipboard-8761eeef-e74b-48eb-9af7-853f6aa1c155.jpg` |

## 1. Decision Summary

Replace the customer marketplace's indigo identity with a restrained
**modern-heritage** theme derived from the actual “Sewa Kostum Tari ‘Bu Risna’”
seal:

- Warm ivory canvas and white content surfaces.
- Burgundy primary actions and selection.
- Dark brown text and warm neutral borders.
- Gold used only as a controlled brand accent.
- Costume photography remains the main source of color.
- No metallic gradients, glows, ornate borders, gold text effects, or faux
  traditional decoration.

The marketplace remains Next.js/shadcn. The admin remains HeroUI, operationally
focused, and visually unchanged. Rental, payment, and delivery states remain
three separate systems.

The public name is not resolved. Until the business selects a final name, use:

```text
KBR Costume
Kostum Tari Bu Risna
```

Do not create final wordmark artwork, rename order references, or replace
shared/admin assets until that decision is recorded.

## 2. Verified Baseline

### 2.1 Repository state

- Inspected commit: `e89e3f8` (`client-side-app`), detached `HEAD`.
- Working tree was clean at the start of this handoff.
- No application code or brand assets were changed for this document.
- The provided logo was visually inspected. It is a detailed circular seal
  dominated by burgundy, gold, warm ivory, brown, and silver.

### 2.2 Current implementation

Code inspection confirms that the earlier marketplace work is substantially
present:

- Marketplace tokens are scoped in `web/src/styles/marketplace.css`.
- Marketplace routes use shadcn/Radix; admin routes use HeroUI.
- Semantic on-primary and on-danger foregrounds are implemented.
- Skip navigation and a focusable main landmark are implemented.
- Product identity precedes the desktop media/booking split.
- Mobile product, cart, and checkout action bars are implemented.
- Mobile filters use draft, Reset, and Apply behavior.
- Checkout terms recovery moves focus to the checkbox.
- Static Alert content is neutral by default.
- Cart and checkout route metadata exist.
- Playwright now targets port `3000` and includes desktop, mobile, and small
  mobile projects.

Do not recreate those packages from the old handoff. First run the existing
tests and capture a visual baseline, then change only what the brand pass
requires.

### 2.3 Rendered evidence

The prior handoff records a rendered review at `1280 × 720` and `390 × 844`.
This continuation inherits those layout and UX findings. A new theme render
does not exist yet because application implementation is intentionally paused.
Final approval therefore requires the visual QA matrix in section 12.

## 3. Naming and Asset Decision Gate

### 3.1 Decision required

The current marketplace says `KBR Costume`; the supplied seal says
`Sewa Kostum Tari “Bu Risna”`.

Before final asset production, the business must select one public naming
model:

1. `KBR Costume` as the primary name, with `Kostum Tari Bu Risna` as the
   descriptor.
2. `Sewa Kostum Tari Bu Risna` as the primary name, with `KBR Costume` retained
   only as an operational or legacy identifier.
3. Another explicitly approved relationship between the two names.

### 3.2 Safe interim treatment

- Header: `KBR Costume` with `Kostum Tari Bu Risna` below.
- Browser title: retain `KBR Costume`.
- Order IDs: retain the `KBR-...` prefix.
- Customer pickup copy: retain `KBR Costume` until the final store name is
  approved.
- Do not infer that a marketing-name decision requires a backend order-ID
  migration.

### 3.3 Asset hierarchy

Do not overwrite `web/public/kbr-logo.svg`. It is currently used by the admin
sidebar and settings screens.

When asset work is approved, add separate files:

| Asset | Intended use | Requirements |
| --- | --- | --- |
| `web/public/brand/kbr-marketplace-mark.svg` | Header, favicon-scale UI, image fallback | Flat, simplified, legible at 32-40px, no tiny text, glow, gradient, or metallic effect |
| `web/public/brand/bu-risna-seal.webp` | Footer, About, receipts | Optimized full seal, transparent or clean background, preserve detail at 80px and above |
| `web/public/brand/bu-risna-seal.png` | Print/receipt fallback if needed | High-resolution master derived from an approved source asset |
| Monochrome SVG fallback | Single-color and forced-color contexts | Recognizable without burgundy or gold |

The full circular seal must not be squeezed into the current 38-40px header
slot. Use it at approximately 80-112px in the footer or other contexts where
its text and dancers remain readable.

## 4. Theme Principles

### 4.1 Modern heritage, not ornament

Heritage comes from the actual brand colors, clear store naming, and costume
photography. It does not come from decorative excess.

Allowed:

- Warm canvas/surface contrast.
- Burgundy actions, links, selection, and focus.
- A flat gold keyline, dot, or small mark detail when it is decorative.
- The intrinsic detail of the full seal at an appropriate size.

Not allowed:

- Metallic or multicolor gradients.
- Glow, embossed text, bevels, or gold text effects.
- Gold as the primary CTA color.
- Gold as warning, pending, payment, rental, or delivery status.
- Ornate borders, batik-pattern wallpaper, or cultural motifs added without a
  real brand source.
- Burgundy color alone as the indication of an error or destructive action.

### 4.2 Photography remains dominant

- Preserve the existing 4:5 catalogue crop.
- Do not put burgundy or gold washes over costume images.
- Use warm placeholder neutrals instead of the current cool raw grays.
- Keep semantic badges small and text-labelled.

### 4.3 Component and state boundaries

- Marketplace routes continue to use shadcn/Radix only.
- Admin routes continue to use HeroUI only.
- `web/src/styles/global.css` and the admin palette are out of scope.
- Rental, payment, and delivery labels and status tokens remain separate.
- Warning, danger, success, and info tokens remain semantic; gold is not a
  semantic status.

## 5. Exact Marketplace Tokens

### 5.1 Light theme

| Token | Proposed value | Use |
| --- | --- | --- |
| `--mk-canvas` | `#F8F4EC` | Page canvas and quiet sections |
| `--mk-surface` | `#FFFFFF` | Cards, forms, header, footer |
| `--mk-surface-raised` | `#FFFFFF` | Dialogs, sheets, popovers |
| `--mk-ink` | `#241815` | Primary text |
| `--mk-muted` | `#6F625D` | Meaningful secondary text |
| `--mk-subtle` | `#7B6C66` | Icons and tertiary text; passes AA on the canvas |
| `--mk-line` | `#DED3C5` | Quiet dividers |
| `--mk-line-strong` | `#A08C82` | Input/control boundaries |
| `--mk-primary` | `#8F1028` | Primary actions, links, selection |
| `--mk-primary-hover` | `#74101F` | Hover |
| `--mk-primary-active` | `#5F0C18` | Pressed |
| `--mk-primary-soft` | `#F8E7EB` | Selected and branded soft surfaces |
| `--mk-on-primary` | `#FFFFFF` | Content on burgundy |
| `--mk-focus` | `#8F1028` | Focus ring |
| `--mk-gold` | `#D9A441` | Decorative brand accent only |
| `--mk-on-gold` | `#3A2115` | Content on a gold fill, if one is approved |
| `--mk-media-placeholder` | `#EAE0D4` | Image loading/failure background |
| shadcn `--muted` | `#F1EBE2` | Ghost hover and subdued control surfaces |

### 5.2 Dark theme

| Token | Proposed value | Use |
| --- | --- | --- |
| `--mk-canvas` | `#17100F` | Page canvas |
| `--mk-surface` | `#211716` | Primary surface |
| `--mk-surface-raised` | `#2B1D1C` | Elevated surface |
| `--mk-ink` | `#FAF4EA` | Primary text |
| `--mk-muted` | `#C9BAB1` | Meaningful secondary text |
| `--mk-subtle` | `#A8968C` | Icons and tertiary text |
| `--mk-line` | `#4A3935` | Quiet dividers |
| `--mk-line-strong` | `#79635C` | Input/control boundaries |
| `--mk-primary` | `#E06A78` | Primary actions, links, selection |
| `--mk-primary-hover` | `#EA7E8B` | Hover |
| `--mk-primary-active` | `#CB5C69` | Pressed |
| `--mk-primary-soft` | `#3A1D23` | Selected and branded soft surfaces |
| `--mk-on-primary` | `#241013` | Content on the light burgundy action |
| `--mk-focus` | `#E06A78` | Focus ring |
| `--mk-gold` | `#E0B15A` | Decorative brand accent only |
| `--mk-on-gold` | `#3A2115` | Content on a gold fill, if one is approved |
| `--mk-media-placeholder` | `#352723` | Image loading/failure background |
| shadcn `--muted` | `#302320` | Ghost hover and subdued control surfaces |

### 5.3 Token mappings

Keep the shadcn mappings semantic:

```css
--background: var(--mk-canvas);
--foreground: var(--mk-ink);
--card: var(--mk-surface);
--card-foreground: var(--mk-ink);
--popover: var(--mk-surface-raised);
--popover-foreground: var(--mk-ink);
--primary: var(--mk-primary);
--primary-foreground: var(--mk-on-primary);
--accent: var(--mk-primary-soft);
--accent-foreground: var(--mk-primary);
--border: var(--mk-line);
--input: var(--mk-line-strong);
--ring: var(--mk-focus);
```

Do not map shadcn `--accent` to gold. Doing so would spread gold into hover,
selection, and menu states and make it look semantic.

### 5.4 Semantic colors

Keep the current success, warning, danger, and info token families in the first
brand pass. Revalidate them against the new surfaces, but do not turn brand
colors into workflow states.

Because burgundy and danger red are related hues:

- Keep destructive actions text-labelled.
- Retain the destructive icon or explicit confirmation language.
- Retain acknowledgement gates for cancellation.
- Never rely on the hue difference alone.

### 5.5 Depth

Replace cool, repeated raw shadows such as `rgb(16 24 40 / ...)` with one
marketplace shadow token:

```css
/* Light */
--mk-shadow-float:
  0 1px 2px rgb(36 24 21 / 0.06),
  0 8px 24px rgb(36 24 21 / 0.08);

/* Dark */
--mk-shadow-float:
  0 1px 2px rgb(0 0 0 / 0.22),
  0 12px 30px rgb(0 0 0 / 0.26);
```

Dark elevation must still rely primarily on `--mk-surface-raised`, not shadow.

## 6. Contrast Evidence and Rules

WCAG sRGB calculations for the proposed pairs:

| Pair | Ratio | Rule |
| --- | ---: | --- |
| White on light primary `#8F1028` | `9.24:1` | Pass |
| White on light hover `#74101F` | `11.43:1` | Pass |
| Dark on dark primary `#E06A78` | `5.61:1` | Pass |
| Dark on dark hover `#EA7E8B` | `6.78:1` | Pass |
| Light muted on ivory | `5.35:1` | Pass |
| Light subtle on ivory | `4.58:1` | Pass |
| Light strong line on white | `3.20:1` | Pass for meaningful boundaries |
| Dark strong line on dark surface | `3.13:1` | Pass for meaningful boundaries |
| Dark gold text on light gold fill | `6.63:1` | Pass |
| Dark gold text on dark-theme gold fill | `7.53:1` | Pass |

Independent recalculation gives `#D9A441` on `#F8F4EC` approximately `2.05:1`,
not `3.32:1`. The product decision is unchanged: light-theme gold must not be
used as small text, a functional icon, an input boundary, or the only state
signal. Treat it as decorative unless paired as a filled surface with
`--mk-on-gold`.

## 7. Exact Component and File Changes

### 7.1 Token foundation

#### `web/src/styles/marketplace.css`

1. Replace only marketplace light/dark brand and neutral values with section 5.
2. Add `--mk-gold`, `--mk-on-gold`, `--mk-media-placeholder`, and
   `--mk-shadow-float`.
3. Preserve semantic status tokens and shadcn semantic mappings.
4. Change shadcn `--muted` to the warm values in section 5.
5. Leave `.marketplace-theme` scoping, theme persistence, focus behavior,
   safe-area rules, and responsive rules intact.
6. Do not edit `web/src/styles/global.css`.

#### Shared shadcn primitives

`web/src/components/ui/button.jsx`, `badge.jsx`, `alert.jsx`, and the other
primitives should not need brand-specific classes. They should inherit through
the scoped shadcn mappings. Change a primitive only if rendered QA proves a
state is not using its semantic token.

### 7.2 Brand shell

#### `web/src/marketplace/components/MarketplaceHeader.jsx`

- Replace the 38px generic gradient tile with the simplified marketplace mark
  after asset approval.
- Use interim wordmark `KBR Costume`.
- Change the subtitle from `Sewa kostum panggung` to
  `Kostum Tari Bu Risna`.
- Update accessible naming consistently.
- Preserve the 72px header height, navigation, theme toggle, account action,
  cart layout, and mobile sheet behavior.

#### `web/src/marketplace/components/MarketplaceFooter.jsx`

- Use the full seal at a readable 80-112px size, not 40px.
- Keep a text wordmark beside or below it so the seal can remain decorative in
  accessibility terms.
- Apply the final approved public name and social handle only after the naming
  decision.
- Preserve link target sizes and the three-column information structure.

#### `web/src/app/layout.jsx`

- Retain `KBR Costume` metadata during the interim.
- After naming approval, update title template, description, and social/SEO
  metadata in one change.
- Do not change the theme initialization contract.

### 7.3 Marketplace surfaces

The primary and soft-primary consumers will update through tokens. Do not add
route-specific burgundy values.

Replace raw cool image placeholders with
`bg-[var(--mk-media-placeholder)]` in:

- `web/src/app/(marketplace)/page.jsx`
- `web/src/marketplace/components/CostumeCard.jsx`
- `web/src/app/(marketplace)/costumes/[id]/page.jsx`
- `web/src/app/(marketplace)/cart/page.jsx`
- `web/src/app/(marketplace)/checkout/page.jsx`
- `web/src/app/(marketplace)/account/orders/page.jsx`
- `web/src/app/(marketplace)/orders/[id]/page.jsx`

Replace raw cool float shadows with `var(--mk-shadow-float)` in:

- Home hero policy card.
- `BookingRail`.
- Cart summary.
- Checkout desktop summary.
- `CustomerAuthCard`.

Specific copy/brand touchpoints to review after the naming decision:

| File | Current text | Interim/final handling |
| --- | --- | --- |
| `MarketplaceHeader.jsx` | `KBR Costume` / `Sewa kostum panggung` | Use interim wordmark and `Kostum Tari Bu Risna` descriptor |
| `MarketplaceFooter.jsx` | `KBR Costume`, `@kbrcostume` | Keep interim until business confirms name and handle |
| `CustomerAuthCard.jsx` | `Buat akun KBR` | Keep interim or change with approved public name |
| `CatalogueClient.jsx` | `Pilihan KBR` | Prefer brand-neutral `Rekomendasi` |
| `checkout/page.jsx` | `Ambil di KBR Costume` | Keep interim until store name is approved |
| `orders/[id]/page.jsx` | `Pengambilan di KBR Costume` | Same naming rule |
| Processing metadata | `pesanan KBR Costume` | Keep interim, then update centrally |

Do not rename sample or real order references such as `KBR-240725-018` as part
of visual theming.

### 7.4 Status and workflow components

No theme-driven behavior change is planned for:

- `StatusBadge`.
- `CancelBookingDialog` workflow.
- `MobileActionBar` behavior.
- `CartContext`.
- Rental-date calculations.
- Checkout/payment processing logic.

Revalidate their colors, but preserve:

- Rental status.
- Payment status.
- Delivery status.
- Cancellation acknowledgement.
- Downpayment and hold-expiry language.
- Delivery as a request until staff confirms it.

### 7.5 Admin boundary

Do not change:

- `web/src/styles/global.css`.
- HeroUI theme/provider configuration.
- `web/src/components/Sidebar.jsx`.
- Admin settings logo behavior.
- Admin route components.

The existing `/kbr-logo.svg` remains available to admin until a separate admin
brand migration is approved.

## 8. Documentation Corrections

### 8.1 `DESIGN.md`

The following statements contradict this approved planning direction and must
change in the same commit as token implementation:

| Current location/content | Required correction |
| --- | --- |
| Design intent says both surfaces share core indigo | Share identity and accessibility rules, not marketplace color tokens or component imports |
| Visual direction says cool mineral neutrals and one indigo accent | Warm ivory/brown neutrals, burgundy primary, restrained gold accent |
| Brand principle says one primary indigo action | One primary burgundy action |
| Marketplace light/dark token tables | Replace with section 5 values |
| “Use indigo ... Do not introduce decorative accent colors” | Use burgundy for action/selection; gold is a restricted, non-semantic brand accent |
| Button and filter-chip sections say indigo | Replace color name with semantic primary/primary-soft terminology |
| Do list says use indigo | Use burgundy primary through tokens |
| Do-not list forbids beige/terracotta/other accent | Forbid unapproved accents and decorative gold misuse; warm ivory and approved gold are intentional |
| Shared logo wording | Add the two-asset hierarchy and unresolved-name decision |
| Preview points to indigo `design-system.html` | Update the specimen before treating it as current |

Keep the admin palette section unchanged and explicitly label it out of scope.

### 8.2 `UI_UX_IMPROVEMENT_HANDOFF.md`

The supersession notice at the top of that document is authoritative for brand
work. When implementation begins:

- Preserve its functional UX and accessibility acceptance criteria.
- Retire “Keep the indigo system.”
- Retire the flat-indigo-logo recommendation.
- Replace WP6 with the asset hierarchy in section 3.
- Retire the non-goals that prohibit replacing indigo or adding approved
  ivory/gold.
- Update the status because WP0-WP5 are already substantially implemented.
- Remove the obsolete claim that Playwright still targets port `5173` or lacks
  marketplace specs.

### 8.3 `design-system.html`

Update the visual specimen in the same token/docs phase:

- Replace the indigo token specimen with section 5.
- Update all brand copy and swatches.
- Add gold rules and forbidden examples.
- Show the simplified header mark at 38-40px.
- Show the full seal at footer size.
- Preserve the marketplace/admin side-by-side boundary.
- Remove copy claiming both surfaces share one indigo identity.

### 8.4 Other project documents

- `ARCHITECTURE.md` correctly records the marketplace/admin component boundary
  and does not require a schema or API update for this theme.
- Its typography note is stale relative to the implemented
  `Plus Jakarta Sans` marketplace layout and should be reconciled separately.
- `AGENTS.md` still describes a Vite/React Router frontend and legacy route
  paths, while the current project uses Next.js App Router under `web/src/app`.
  Correct that project guidance before implementation so future agents do not
  edit the wrong surface.
- `CONTEXT.md` domain language remains authoritative and unchanged.

## 9. Phased Implementation Plan

### Phase BR0 — Naming and asset gate

Scope: decision/documentation only.

1. Record the chosen public naming relationship.
2. Confirm the official source/ownership of the supplied seal.
3. Confirm whether the current social handle and pickup-location name change.
4. Approve the interim wordmark if the final decision is deferred.

Acceptance:

- One primary public name and one optional descriptor are recorded.
- Order-ID handling is explicitly out of scope or separately decided.
- Header mark and full-seal roles are approved.
- No existing shared/admin asset is overwritten.

### Phase BR1 — Marketplace token and specification foundation

Scope:

- `web/src/styles/marketplace.css`
- `DESIGN.md`
- `design-system.html`
- Token-focused tests

1. Apply section 5 token values.
2. Add media and shadow tokens.
3. Keep status tokens and admin tokens unchanged.
4. Update the design documents and specimen.
5. Add computed-style/contrast regression coverage where practical.

Acceptance:

- No indigo value remains in marketplace brand tokens or the marketplace
  specimen.
- Admin indigo remains unchanged.
- Primary/on-primary pairs pass AA in light and dark modes.
- Gold is not mapped to shadcn accent or any status.
- No raw new burgundy/gold value appears in a route component.

### Phase BR2 — Surface propagation and warm-neutral cleanup

Scope: marketplace files listed in section 7.3.

1. Replace raw cool media placeholders.
2. Centralize float shadows.
3. Check every primary, primary-soft, link, selected, hover, focus, active,
   disabled, and loading state.
4. Keep current layout and functional UX improvements intact.
5. Use gold only if a specific approved decorative location benefits from it.

Acceptance:

- Home, catalogue, detail, cart, checkout, processing, account, order detail,
  and auth pages use the same scoped theme.
- No component imports HeroUI into marketplace code.
- No admin component imports marketplace shadcn components.
- Costume photography remains unfiltered and color-accurate.
- No layout shift is introduced by token or shadow changes.

### Phase BR3 — Digital brand assets and public copy

Depends on BR0.

1. Produce the simplified flat digital mark and monochrome fallback.
2. Export an optimized full seal from an approved source.
3. Update marketplace header/footer asset references.
4. Update public-name copy and metadata.
5. Keep admin on the existing asset unless separately approved.

Acceptance:

- Simplified mark is legible at 32, 38, and 40px.
- Full seal is used only where its details remain readable.
- Both assets work in light, dark, monochrome, and forced-color contexts.
- No gradients, glow, ornate border treatment, or tiny logo text are introduced
  into the digital mark.
- Header height and action positions do not change.

### Phase BR4 — Regression and visual QA

1. Run unit, lint, build, and Playwright flows.
2. Run the project-required code-quality workflow.
3. Capture route/theme/viewport screenshots.
4. Complete keyboard, screen-reader, zoom, forced-color, and contrast checks.
5. Compare rental/payment/delivery displays before and after.

Acceptance is defined in sections 10-12.

## 10. Route Acceptance Criteria

All primary routes:

- [ ] Ivory/burgundy theme is scoped to `.marketplace-theme`.
- [ ] Admin presentation is unchanged.
- [ ] Meaningful normal text reaches `4.5:1`.
- [ ] Functional boundaries and focus indicators reach `3:1`.
- [ ] Gold is not small text or the only functional indicator.
- [ ] Light and dark states retain one obvious primary action.
- [ ] No horizontal overflow at 320px.

`/`:

- [ ] Burgundy replaces indigo without reducing search prominence.
- [ ] Featured costumes remain visible at a 720px laptop height.
- [ ] Gold, if used, remains a minor decorative detail.
- [ ] Hero photography receives no brand-color wash.

`/catalogue`:

- [ ] Selection, sort, Reset, and Apply states remain clear.
- [ ] Product metadata remains more prominent than brand decoration.
- [ ] Result-count announcement behavior is unchanged.

`/costumes/[id]`:

- [ ] Product name, price, availability, and booking hierarchy are unchanged.
- [ ] Inline and mobile actions use the same burgundy semantic tokens.
- [ ] Success/warning availability is not recolored as brand gold.

`/cart` and `/checkout`:

- [ ] Amounts and mobile action context remain synchronized.
- [ ] Terms focus recovery and error announcement still work.
- [ ] Burgundy primary and danger-red cancellation remain distinguishable by
  text, icon, and interaction hierarchy.

`/checkout/processing`:

- [ ] Processing still looks different from success.
- [ ] Theme colors do not imply payment confirmation.

`/account/orders` and `/orders/[id]`:

- [ ] Full-row navigation remains available.
- [ ] Rental, payment, and delivery states remain visibly separate and labelled.
- [ ] Operational `KBR-...` references remain unchanged.

Authentication routes:

- [ ] Interim/final public name is consistent.
- [ ] Form labels, errors, focus, and 44px targets remain unchanged.

## 11. Automated Validation

Update existing tests rather than create a second test stack.

### Unit/component

- Keep Alert announcement tests.
- Add a small token contract test or stylesheet assertion for required
  marketplace variables.
- Keep domain/date/order tests unchanged.
- Add header/footer accessible-name tests when new assets land.

### Playwright

Update the current default-theme assertion from the cool canvas to:

```text
rgb(248, 244, 236)
```

Retain:

- Theme persistence.
- Skip link.
- Terms recovery.
- Order-row navigation.
- Mobile draft filters.
- Responsive overflow matrix.

Add:

- Computed primary/on-primary checks in both themes.
- Screenshot coverage for home, catalogue, product detail, and checkout.
- Header mark size/visibility checks.
- Footer seal layout check.
- A scan that ensures the admin canvas/primary token did not change.

## 12. Visual and Accessibility QA Matrix

### 12.1 Viewports

| Viewport | Required focus |
| --- | --- |
| `320 × 800` | No overflow, compact header, sticky actions, long names |
| `390 × 844` | Primary mobile customer journey |
| `768 × 900` | Tablet stacking and theme density |
| `1024 × 900` | Desktop rails and three-column catalogue |
| `1280 × 720` | Above-fold composition and header wordmark |
| `1440 × 900` | Maximum container and four-column catalogue |

### 12.2 Modes

Every route:

- Light.
- Dark.
- Reduced motion.
- 200% zoom.
- Forced colors/high contrast.

### 12.3 Screenshot set

Capture before and after for:

- Home top and featured section.
- Catalogue default, filters open, and empty state.
- Product detail top and mobile sticky action.
- Cart non-empty.
- Checkout terms unchecked and error state.
- Processing.
- Order history and order detail.
- Login.
- Footer at desktop and mobile sizes.
- Admin dashboard as a non-regression reference.

### 12.4 Manual checks

- Keyboard-only full customer flow.
- Focus ring against canvas, surface, primary-soft, and dialog surfaces.
- Screen-reader smoke test for logo naming, Alert behavior, filters, checkout
  errors, processing status, and order states.
- Product-image color comparison to confirm no tint/filter.
- Gold audit: every gold use must be decorative or use `--mk-on-gold` on a
  filled gold surface.
- Logo audit at actual rendered sizes, not a large design-artboard preview.

## 13. Risks and Mitigations

### Burgundy versus danger

Risk: brand primary and destructive red may feel too similar.

Mitigation: keep danger semantic tokens, explicit destructive language, warning
icon, confirmation dialog, and acknowledgement. Validate in grayscale and with
common color-vision simulations.

### Warm canvas overuse

Risk: every surface becomes beige and product photography loses clarity.

Mitigation: canvas is ivory; primary content surfaces remain white. Use borders
and whitespace rather than multiple cream shades.

### Gold semantic leakage

Risk: gold starts to look like warning/pending.

Mitigation: never map gold to shadcn accent or status tokens. Audit every gold
consumer.

### Detailed seal at small size

Risk: illegible text and visual noise in the header.

Mitigation: separate simplified mark and full-seal assets.

### Naming drift

Risk: header, metadata, pickup copy, social handle, receipts, and order IDs use
different names.

Mitigation: record the naming model first and use a centralized brand copy
source during implementation where practical. Do not migrate order IDs as a
side effect.

### Shared-asset regression

Risk: replacing `/kbr-logo.svg` changes the admin unexpectedly.

Mitigation: add marketplace-specific asset paths and leave the shared/admin
fallback untouched.

## 14. Explicit Non-Goals

- Admin redesign or recoloring.
- Component-library migration.
- Rental, inventory, payment, refund, delivery, or cancellation logic changes.
- Backend schema/API changes.
- Order-ID migration.
- Metallic or ornate recreation of the supplied seal.
- New reviews, wishlists, recommendations, delivery pricing, or guest checkout.
- Changes to the 4:5 costume photography ratio.

## 15. Implementation Approval Gate

No application code or production asset work should start until the user
explicitly approves implementation.

Before approval, the only unresolved input that materially changes final asset
and copy work is the public naming relationship in section 3. Token work can
proceed with the safe interim wordmark once implementation is approved, but
final header/footer assets and metadata should wait for that decision.
