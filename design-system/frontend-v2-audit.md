# frontend-v2 Audit

Date: 2026-05-27

## Reviewed

- Customer catalogue, product detail, checkout route/sheet, lookup and recovery.
- Admin shell, request queue, notifications popover, catalogue management, rental lifecycle, clients, and settings.
- Shared data table, status badge, field wrapper, metric tile, and core responsive CSS.

## Broken Or Misleading Controls Found

- Product detail favorite button had no effect.
- Product detail rendered a thumbnail button even when there was only one image.
- Direct `/checkout` showed placeholder copy while the modal contained the actual checkout.
- Lookup change request only showed local success and did not alert staff.
- Admin request Filter and Sort buttons were decorative.
- Admin metric tiles linked to `#admin-content` instead of filtered queues.

## Fixes Made

- Added `src/lib/data-adapter.js` with local implementations for catalogue listing, batched availability, request create/change, lookup recovery, and admin save contracts.
- Catalogue listing is debounced and availability is batched by visible products and selected date range.
- Product detail favorite now persists in local storage with selected/undo feedback.
- Single-image products hide the thumbnail rail; multi-image products can use selected thumbnails.
- Product detail calendar reads one product/month availability batch and falls back to local calculation.
- Direct `/checkout` now renders the real checkout; sheet behavior remains for route-backed modal navigation.
- Lookup recovery and change requests create staff notifications through the adapter.
- Admin request filters and sort are functional and query-param backed.
- Admin metric tiles deep-link to filtered request/rental queues.
- Icon buttons, calendar controls, and quantity controls were normalized to 44px hit targets.

## Remaining Known Risks

- Live backend endpoints are not wired; the adapter is intentionally local/mock-backed.
- Admin create flows still use direct local state for new product/client/rental insertion, while saves use the adapter boundary.
- Image assets are large and Vite warns about bundle/chunk size; route-level splitting and image optimization remain future hardening work.
- Full keyboard and axe runs were not automated in this pass; build verification is green.

## Structural Cleanup Update

Date: 2026-06-08

### Reviewed

- Admin component ownership for common, catalogue, clients, requests, rentals, and settings.
- Customer component ownership for common, catalogue, checkout, home, lookup, and product.
- Compatibility barrels, Radix sheet/dialog behavior, catalogue filters, product availability calendar, checkout sheets, and catalogue editor modules.

### Fixes Made

- Reorganized `frontend-v2/src/components` into feature folders while keeping `AdminComponents.jsx` and `CustomerComponents.jsx` as compatibility barrels.
- Split catalogue editor into shell, details/media/variants/maintenance tabs, save bar, switch dialog, and utilities.
- Split customer product components into product card, availability panel, product detail, product availability calendar, and calendar utilities.
- Split checkout components into cart summary, checkout form, step actions, request summary sheet, checkout modal, and checkout link helper.
- Moved catalogue admin clone, validation, save normalization, media, and ID helpers into feature utilities.
- Converted admin bottom sheets and customer catalogue filters to Radix-backed dialog/sheet patterns while preserving existing class hooks.
- Added architecture and future-update principles to `design-system/MASTER.md`.

### Verification

- Production build passed.
- Internal import scan found no `AdminComponents` or `CustomerComponents` usage.
- Old root component-path import scan passed.
- Temporary Playwright smoke checks passed for customer catalogue/product/cart/checkout/lookup and admin requests/catalogue/clients/rentals, including mobile overflow checks.

### Remaining Known Risks

- Browser plugin setup failed in the Windows sandbox during this cleanup; direct Playwright was used for smoke verification.
- Route-level code splitting and image optimization remain future hardening work.
