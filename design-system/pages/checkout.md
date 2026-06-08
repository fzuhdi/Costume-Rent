# Checkout

- Direct `/checkout` renders a full checkout page.
- Route-backed checkout may render as a sheet only when opened with a background location.
- Steps: review items, contact, fulfillment, terms/submit.
- Submit locks during processing, shows errors near the form, and revalidates stock before creating a request.
- No account creation; phone and name are required, email is optional.
- Checkout UI modules live under `components/customer/checkout`: cart summary, checkout form, step actions, request summary sheet, checkout modal, and checkout link helper stay separate.
- Checkout sheets and modals use Radix Dialog and preserve existing sheet/modal class hooks.
