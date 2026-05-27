# Checkout

- Direct `/checkout` renders a full checkout page.
- Route-backed checkout may render as a sheet only when opened with a background location.
- Steps: review items, contact, fulfillment, terms/submit.
- Submit locks during processing, shows errors near the form, and revalidates stock before creating a request.
- No account creation; phone and name are required, email is optional.
