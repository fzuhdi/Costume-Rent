# Costume Rental Design System

Source of truth for `frontend-v2`. The older `docs/frontend/design-system.md` points here to avoid drift.

## Direction

Name: Boutique Utility.

The UI is a practical boutique rental surface: product-led for customers, dense and operational for staff. Keep Plus Jakarta Sans, neutral surfaces, teal primary actions, warm accent highlights, real costume imagery, 8px-or-less cards, visible borders, and restrained shadows.

## Design Guardrails

These guardrails are sourced only from this file and the files in `pages/`. If a rule is not in those files, omit it.

### Source Of Truth Files

Use page files for route-specific rules. Use this file for global direction, tokens, component rules, responsive behavior, accessibility, availability/API safety, routes without a page file, and `/admin/settings`.

| File | Use when |
|------|----------|
| [MASTER.md](MASTER.md) | Applying global direction, tokens, component rules, availability/API safety, responsive behavior, accessibility, and `/admin/settings` branding/policy/catalogue/proof toggles with explicit save. |
| [pages/customer-home.md](pages/customer-home.md) | Building or reviewing `/`: customer landing, hero stock search CTA, articles, testimonials, and links into `/catalogue`. |
| [pages/customer-catalogue.md](pages/customer-catalogue.md) | Building or reviewing `/catalogue`: search-gated product results, date range, advanced filters, product grid, catalogue availability, and no full calendar/side panel. |
| [pages/product-detail.md](pages/product-detail.md) | Building or reviewing `/costumes/:productId`: image/name/price before controls, thumbnails, favorite toggle, bounded calendar, and add-to-request gating. |
| [pages/checkout.md](pages/checkout.md) | Building or reviewing `/checkout`: full page vs route-backed sheet, review/contact/fulfillment/terms steps, submit locking, nearby errors, and stock revalidation. |
| [pages/lookup.md](pages/lookup.md) | Building or reviewing `/lookup`: reference plus phone lookup, safe not-found copy, forgot-code recovery, staff-facing change requests, and loading/success/error states. |
| [pages/admin-requests.md](pages/admin-requests.md) | Building or reviewing `/admin/requests`: queue controls, query-param state, metric links, stale indicators, and requested-only accept/edit/reject actions. |
| [pages/admin-rentals.md](pages/admin-rentals.md) | Building or reviewing `/admin/rentals`: lifecycle queues, validation, payment proof gate, visible lifecycle actions, completed-record locking, and admin override reason. |
| [pages/admin-catalogue.md](pages/admin-catalogue.md) | Building or reviewing `/admin/catalogue`: product/variant drafts, status/image/price/variant/maintenance edits, last-variant delete guard, explicit save, success feedback, and cache clearing. |
| [pages/admin-clients.md](pages/admin-clients.md) | Building or reviewing `/admin/clients`: name/visible-phone/normalized-phone search, explicit add/edit save, client detail, rental history, and non-shifting success feedback. |

### Token Quick Reference

| Token | Exact value |
|-------|-------------|
| Background | `#F8FAFC` |
| Surface | `#FFFFFF` |
| Warm surface | `#FFF8ED` |
| Text | `#18212F` |
| Muted | `#64748B` |
| Border | `#D8DEE8` |
| Primary | `#0F766E` |
| Warm accent | `#B45309` |
| Destructive | `#B42318` |
| Success | `#15803D` |
| Info | `#2563EB` |
| Font | `"Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, sans-serif` |
| Control radius | `6px` |
| Card/panel/sheet radius | `8px max` |
| Touch target | `44px minimum for buttons, icon buttons, table header sort controls, and calendar controls` |

### Frontend Architecture Principles

Feature folders are the component source of truth for future `frontend-v2` work:

- Admin components live under `components/admin/common`, `catalogue`, `clients`, `requests`, `rentals`, and `settings`.
- Customer components live under `components/customer/common`, `catalogue`, `checkout`, `home`, `lookup`, and `product`.
- `components/admin/AdminComponents.jsx` and `components/customer/CustomerComponents.jsx` are compatibility barrels only. New internal imports must target the concrete feature module.
- Pages orchestrate route state, query params, persistence, adapter calls, and cross-feature composition. Components render focused UI units. Feature-specific helpers live beside the feature as `*Utils.js`.
- Do not recreate mini-monoliths. Split mixed-responsibility modules into shells, panels/tabs, dialogs/sheets, action bars, cards, calendars, and utilities once responsibilities diverge.
- Cross-domain primitives stay in `components/shared.jsx`; feature modules may import shared primitives, but shared primitives must not import feature modules.
- CSS remains the styling source of truth. Preserve existing tokens, class hooks, route copy, translation keys, data shapes, and storage keys during structural cleanup.

### Component Library Principles

- Use Radix primitives directly for dialogs, sheets, tabs, selects, switches, and radio groups in the current shadcn-like style.
- Do not introduce a generated shadcn/ui component layer or Tailwind migration unless a separate design-system migration is approved.
- Dialogs and sheets must use Radix for focus, Escape handling, overlay semantics, and portal behavior. Preserve existing CSS class hooks such as `dialog-overlay`, `bottom-sheet-panel`, `filter-panel-scrim`, and feature panel classes.
- Use `AdminBottomSheet` for admin sheet/popover surfaces so sidebar, notification, request-filter, and detail-sheet behavior stays consistent.
- Use lucide-react icons for actions and status. Icon-only controls need accessible names.
- Keep custom availability calendars lightweight, bounded, and feature-owned. Do not replace them with `react-day-picker`, shadcn calendar, or another calendar dependency without an approved dependency migration.
- Prefer existing libraries before manual UI logic: Radix for primitives, TanStack Table for staff grids, React Hook Form plus Zod for complex validated forms, and the local data adapter for availability/request contracts.

### Future Update Principles

- Update this design-system whenever a change alters component ownership, route responsibility, interaction patterns, accessibility behavior, responsive behavior, data mutation rules, or library policy.
- Update the relevant `pages/*.md` file when a route gets a new surface, sheet, modal, tab, calendar, save flow, destructive action, or availability/checkout/lookup behavior.
- Keep design-system rules implementation-specific enough to guide future agents: name the folder, wrapper, token, class hook, library, and route when the rule depends on them.
- Structural refactors must preserve public routes, URL params, copy keys, locale behavior, storage keys, adapter contracts, and business rules unless the plan explicitly approves a behavior change.
- Verification for UI structural changes must include a production build, an import scan for compatibility barrel usage, and mobile overflow checks for any touched customer catalogue or admin workspace route.

### Breakpoints And Responsive Order

- Write styles base-first for `320-375px`.
- Use `min-width` breakpoints only, in this order: `320`, `375`, `768`, `1024`, `1440`.
- Do not use `max-width` media queries.
- Customer grids collapse to one column on small phones.
- Admin data tables must have mobile card rows below `768px`; desktop tables start at `768px`.
- Admin workspace collapses the sidebar to a sheet and stacks filters/forms under `820px`.
- No element may cause horizontal body overflow at `320px`.

### Hard Bans And Correct Patterns

#### Mobile-First CSS

```css
/* ❌ Ban: desktop-first layout with max-width overrides. */
.catalogueGrid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

@media (max-width: 767px) {
  .catalogueGrid {
    grid-template-columns: 1fr;
  }
}

/* ✅ Required: mobile base, then min-width enhancements. */
.catalogueGrid {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .catalogueGrid {
    /* Tablet enhancement. */
  }
}

@media (min-width: 1024px) {
  .catalogueGrid {
    /* Desktop enhancement. */
  }
}
```

#### Touch Targets And Inputs

All interactive elements need `44x44px` touch targets. Inputs and selects use `font-size >= 16px`.

```css
/* ❌ Ban: small controls and sub-16px input text. */
.iconButton {
  width: 32px;
  height: 32px;
}

.field,
.select {
  min-height: 36px;
  font-size: 14px;
}

/* ✅ Required: 44px controls and readable input text. */
.iconButton,
.calendarButton,
.sortButton,
button {
  min-width: 44px;
  min-height: 44px;
}

.field,
.select {
  min-height: 44px;
  font-size: 16px;
}
```

#### Admin Table/Card Switch

```css
/* ❌ Ban: table-only admin data below 768px. */
.adminTable {
  display: table;
  min-width: 960px;
}

.adminCards {
  display: none;
}

/* ✅ Required: mobile cards below 768px, desktop table at 768px and up. */
.adminTable {
  display: none;
}

.adminCards {
  display: grid;
}

@media (min-width: 768px) {
  .adminCards {
    display: none;
  }

  .adminTable {
    display: table;
    width: 100%;
  }
}
```

#### Hover And Overflow

No interaction may be hover-only. Every hover affordance needs a tap/click equivalent.

```jsx
// ❌ Ban: actions only appear on hover.
<ProductCard className="group">
  <CardActions className="opacity-0 group-hover:opacity-100" />
</ProductCard>

// ✅ Required: tap/click exposes the same actions.
const [actionsOpen, setActionsOpen] = useState(false);

<ProductCard>
  <button
    type="button"
    aria-expanded={actionsOpen}
    onClick={() => setActionsOpen((open) => !open)}
  >
    Actions
  </button>
  {actionsOpen ? <CardActions /> : null}
</ProductCard>
```

```css
/* ❌ Ban: fixed desktop widths that overflow 320px. */
.pageShell {
  width: 1200px;
}

.adminFilters {
  grid-template-columns: repeat(5, 220px);
}

/* ✅ Required: fluid mobile base that fits 320px. */
.pageShell {
  width: 100%;
  max-width: 100%;
}

.adminFilters {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

@media (min-width: 820px) {
  .adminFilters {
    /* Filters can expand once the admin workspace no longer stacks. */
  }
}
```

#### Visual Direction

Do not introduce purple/blue gradient themes, decorative orbs, nested cards, emoji icons, or large marketing heroes. Use lucide-react icons for UI actions and status; icon-only buttons require accessible names.

```jsx
// ❌ Ban: theme drift, nested cards, and emoji UI icons.
<section className="hero purpleGradient">
  <div className="orb" />
  <Card>
    <Card>
      <span aria-hidden="true">✨</span>
      Rent now
    </Card>
  </Card>
</section>

// ✅ Required: boutique utility surface, real imagery, lucide-react icons.
<section className="catalogueSurface">
  <ProductCard imageUrl={costume.imageUrl}>
    <button type="button" className="primaryAction" aria-label="Add costume to request">
      <ShoppingBag aria-hidden="true" />
      Add to request
    </button>
  </ProductCard>
</section>
```

```css
.catalogueSurface {
  background: #F8FAFC;
  color: #18212F;
}

.productCard {
  background: #FFFFFF;
  border: 1px solid #D8DEE8;
  border-radius: 8px;
}

.primaryAction {
  background: #0F766E;
  min-height: 44px;
  border-radius: 6px;
}
```

#### Catalogue Search Viewport

`/catalogue` is catalogue-first after stock search: nav, search, date range, filters, and product grid. `/` is a customer landing page that sends searches into `/catalogue?search=1`. Do not add a full calendar or separate availability side panel to `/catalogue`.

```jsx
// ❌ Ban: marketing-first catalogue and separate availability surface.
<>
  <MarketingHero />
  <AvailabilitySidePanel />
  <FullCalendar />
  <ProductGrid />
</>

// ✅ Required: useful first viewport.
<>
  <CatalogueNav />
  <SearchBox debounceMs={300} />
  <DateRangePicker />
  <CategoryFilters />
  <ProductGrid products={visibleProducts} />
</>
```

#### Status And Color

Status badges include icon plus localized label and never render raw enum values. Stale rows must include text or icon, not color alone.

```jsx
// ❌ Ban: color-only status and raw enum text.
<span className={`status ${request.status}`}>{request.status}</span>
<tr className={isStale ? "staleRed" : ""}>
  <td>{request.reference}</td>
</tr>

// ✅ Required: icon plus localized label or text.
<StatusBadge tone="warning">
  <Clock aria-hidden="true" />
  <span>Needs follow-up</span>
</StatusBadge>

<tr>
  <td>
    {isStale ? (
      <span className="staleMarker">
        <AlertTriangle aria-hidden="true" />
        Stale request
      </span>
    ) : null}
    {request.reference}
  </td>
</tr>
```

#### Forms And Mutations

Form fields use visible labels, nearby validation, explicit submit/save actions, and loading/success/error states for core flows. Mutations happen only on submit/save/confirm. Search, filters, and form typing must not mutate catalogue, rental, client, product, or settings data.

```jsx
// ❌ Ban: placeholder-only fields and top-only errors.
<input placeholder="Phone" />
{error ? <Alert>{error}</Alert> : null}

// ✅ Required: visible label and nearby validation.
<label htmlFor="phone">Phone</label>
<input id="phone" name="phone" aria-describedby="phone-error" />
{phoneError ? <p id="phone-error">{phoneError}</p> : null}
```

```jsx
// ❌ Ban: mutating records while typing or filtering.
<input
  value={query}
  onChange={(event) => updateCatalogue({ search: event.target.value })}
/>

<select onChange={(event) => saveRental({ status: event.target.value })} />

// ✅ Required: local draft state; explicit save/submit/confirm mutates.
const [draft, setDraft] = useState(product);

<input
  value={draft.name}
  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
/>

<button type="button" onClick={() => saveProduct(draft)}>
  Save
</button>
```

Search/filter input uses a `300ms` debounce and cancels stale requests through `AbortController`.

```jsx
// ❌ Ban: immediate request fan-out without cancellation.
useEffect(() => {
  fetchCatalogue({ search, filters });
}, [search, filters]);

// ✅ Required: 300ms debounce plus stale request cancellation.
useEffect(() => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    fetchCatalogue({ search, filters, signal: controller.signal });
  }, 300);

  return () => {
    controller.abort();
    window.clearTimeout(timeoutId);
  };
}, [search, filters]);
```

#### Destructive Actions

Destructive actions require confirmation or an undo/recovery pattern. Variant deletes are disabled when only one variant remains.

```jsx
// ❌ Ban: single-click destructive action.
<button type="button" onClick={() => deleteVariant(variant.id)}>
  Delete variant
</button>

// ✅ Required: confirmation or undo/recovery.
<button type="button" onClick={() => setPendingDelete(variant)}>
  Delete variant
</button>

<ConfirmDialog
  open={Boolean(pendingDelete)}
  tone="destructive"
  onConfirm={() => deleteVariant(pendingDelete.id)}
  onCancel={() => setPendingDelete(null)}
/>
```

```jsx
// ❌ Ban: deleting the last variant.
<button type="button" onClick={() => deleteVariant(variant.id)}>
  Delete
</button>

// ✅ Required: disable deletion at one remaining variant.
<button
  type="button"
  disabled={variants.length <= 1}
  onClick={() => setPendingDelete(variant)}
>
  Delete
</button>
```

#### Availability And Checkout

Use batched availability requests and revalidate checkout stock with the API safety limits below.

```jsx
// ❌ Ban: per-cell availability fetches.
calendarDays.map((date) =>
  fetchAvailability({ productIds: [product.id], start: date, end: date })
);

// ✅ Required: one bounded request for the visible range.
fetchAvailability({
  productIds: visibleProducts.map((product) => product.id),
  start: selectedRange.start,
  end: selectedRange.end,
  signal: controller.signal,
});

fetchAvailability({
  productIds: [product.id],
  start: monthWindow.start,
  end: monthWindow.end,
});
```

```jsx
// ❌ Ban: unbounded next-available search and submit without revalidation.
await findNextAvailable({ productId, start, days: 365 });
await createRentalRequest(cart);

// ✅ Required: capped search and stock revalidation before submit.
await findNextAvailable({ productId, start, days: 90 });

const validation = await revalidateAvailability(cart.items);
if (validation.ok) {
  await createRentalRequest(cart);
}
```

#### Product Detail

Hide thumbnail controls when only one image exists. With multiple images, selected thumbnail state must be visible and accessible. Favorite is a persisted local toggle with `aria-pressed` and visible undo copy. Add-to-request is disabled until a valid available variant is selected.

```jsx
// ❌ Ban: inaccessible thumbnails, non-persisted favorite, and always-enabled request.
<ThumbnailStrip images={images} />
<button onClick={toggleFavorite}>Favorite</button>
<button>Add to request</button>

// ✅ Required: conditional thumbnails, aria-pressed favorite, availability gate.
{images.length > 1 ? (
  <ThumbnailStrip images={images} selectedId={selectedImageId} aria-label="Product images" />
) : null}

<button type="button" aria-pressed={isFavorite} onClick={toggleFavorite}>
  Favorite
</button>
{undoCopy ? <p>{undoCopy}</p> : null}

<button type="button" disabled={!selectedVariant || !selectedVariant.available}>
  Add to request
</button>
```

#### Lookup And Admin Gates

Lookup recovery never reveals booking existence. Change requests do not mutate rental details; they create staff-facing notifications. Admin request actions are available only for `requested` records. Completed rentals stay locked except admin override with a reason, and completion is blocked until payment proof is verified when required.

```jsx
// ❌ Ban: revealing booking existence or editing rental from lookup.
if (!booking) {
  return "No booking found for that phone.";
}

await updateRentalDetails(reference, changes);

// ✅ Required: safe copy plus staff-facing notification.
showMessage("If the details match, staff will follow up.");

await createStaffNotification({
  reference,
  customer,
  changeType,
  notes,
});
```

```jsx
// ❌ Ban: actions on every request and completion without gates.
<RequestActions request={request} />
<button onClick={() => completeRental(rental.id)}>Complete</button>

// ✅ Required: status, proof, and override gates.
{request.status === "requested" ? <RequestActions request={request} /> : null}

<button
  type="button"
  disabled={proofRequired && !rental.paymentProofVerified}
  onClick={() => completeRental(rental.id)}
>
  Complete
</button>

{rental.status === "completed" ? (
  <AdminOverrideForm requireReason onSubmit={unlockCompletedRental} />
) : null}
```

### Accessibility And Motion

- Focus rings must remain visible.
- Dialogs and sheets need clear close actions.
- Respect `prefers-reduced-motion`.
- Transitions use opacity/transform and avoid layout shifts.

### API Safety Rules

These are non-negotiable:

- Public availability is batched by visible product IDs and selected date range.
- Never request availability per calendar cell.
- Product detail requests one product and one month window; keep the requested window under `62` days.
- Next-available search is capped at `90` days.
- Public availability cache TTL is `30-60 seconds` by `{productIds, variantIds, start, end}`.
- Search/filter input uses a `300ms` debounce and cancels stale requests through `AbortController`.
- Checkout revalidates selected items before request submit.
- Availability payloads expose aggregated fields only: `date`, `productId`, `variantId`, `total`, `booked`, `available`, `state`.

### Pre-PR Self-Check

Before opening a pull request, verify:

- [ ] `design-system/MASTER.md` and the relevant `design-system/pages/*.md` file were checked.
- [ ] Design-system docs were updated if the work changed architecture, component ownership, interaction patterns, library policy, responsive rules, accessibility rules, or route behavior.
- [ ] New internal imports target feature modules directly, not `AdminComponents.jsx` or `CustomerComponents.jsx`.
- [ ] The UI uses the exact tokens above for colors, font, radius, and touch target minimums.
- [ ] CSS is base-first for `320-375px` and uses only `min-width` media queries.
- [ ] The page works at `320`, `375`, `768`, `1024`, and `1440` widths with no horizontal body overflow.
- [ ] Admin tables have mobile card rows below `768px`; admin filters/forms stack under `820px`.
- [ ] Inputs and selects use `font-size >= 16px`; interactive controls are at least `44x44px`.
- [ ] Hover affordances also have tap/click equivalents.
- [ ] Status/stale UI includes icon or text plus localized labels, never color-only or raw enum output.
- [ ] Search, filters, and typing do not mutate data; writes happen only on submit, save, or confirm.
- [ ] Destructive actions require confirmation or undo/recovery.
- [ ] Availability calls are batched, bounded, debounced/cancelable where required, and never per calendar cell.
- [ ] Product detail calendars request one product/month window under `62` days.
- [ ] Checkout revalidates stock before submit and locks submit while processing.
- [ ] Lookup recovery and change flows use safe copy, loading/success/error states, and staff notifications without mutating rental details.
