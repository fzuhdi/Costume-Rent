import { z } from 'zod';

export const TODAY = '2026-05-27';
export const BLOCKING_LIFECYCLES = ['requested', 'confirmed', 'preparing', 'ready_pickup', 'out_delivery', 'on_rent'];
export const RELEASED_LIFECYCLES = ['returned', 'completed', 'rejected', 'cancelled'];

function toDate(value) {
  return new Date(`${value}T00:00:00`);
}

function toDateKey(value) {
  return value.toISOString().slice(0, 10);
}

export function addDays(value, days) {
  const date = toDate(value);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function dayCount(start, end) {
  return Math.floor((toDate(end) - toDate(start)) / 86400000) + 1;
}

export function makeBookingSchema(t) {
  return z
    .object({
      name: z.string().min(2, t('common.required')),
      phone: z.string().min(8, t('common.required')),
      email: z.string().email().or(z.literal('')),
      fulfillment: z.enum(['pickup', 'delivery']),
      pickupWindow: z.string(),
      returnWindow: z.string().min(3, t('common.required')),
      deliveryWindow: z.string(),
      address: z.string(),
      notes: z.string(),
    })
    .superRefine((value, ctx) => {
      if (value.fulfillment === 'pickup' && !value.pickupWindow.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pickupWindow'], message: t('common.required') });
      }
      if (value.fulfillment === 'delivery' && !value.address.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['address'], message: t('common.required') });
      }
      if (value.fulfillment === 'delivery' && !value.deliveryWindow.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['deliveryWindow'], message: t('common.required') });
      }
    });
}

export function makeLookupSchema(t) {
  return z.object({
    reference: z.string().min(4, t('common.required')),
    phone: z.string().min(8, t('common.required')),
    changeType: z.string(),
    changeNotes: z.string(),
  });
}

export function validateDates(dates) {
  if (dates.start < TODAY) return 'customer.date.errorPast';
  if (dates.end < dates.start) return 'customer.date.errorOrder';
  return '';
}

export function getCartItems(cart, products) {
  return cart
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return product ? { ...item, product } : null;
    })
    .filter(Boolean);
}

export function getProductAvailability(product, dates, rentals) {
  if (!product.active || product.maintenanceBlocks.some((block) => overlaps(dates, block))) return 'unavailable';
  const variantStates = product.variants.map((variant) => ({
    available: getVariantAvailability(product, variant.id, dates, rentals),
    booked: Array.isArray(rentals) ? getVariantBookedQuantity(product.id, variant.id, dates, rentals) : variant.held,
  }));
  if (variantStates.every((variant) => variant.available <= 0)) return 'fully_booked';
  if (variantStates.some((variant) => variant.booked > 0)) return 'partially_booked';
  return 'available';
}

export function getVariantAvailability(product, variantId, dates, rentals) {
  if (product.maintenanceBlocks.some((block) => overlaps(dates, block))) return 0;
  const variant = product.variants.find((entry) => entry.id === variantId);
  if (!variant) return 0;
  if (Array.isArray(rentals)) {
    return Math.max(0, variant.total - getVariantBookedQuantity(product.id, variantId, dates, rentals));
  }
  return Math.max(0, variant.total - variant.held);
}

export function firstAvailableVariant(product, dates, rentals) {
  return product.variants.find((variant) => getVariantAvailability(product, variant.id, dates, rentals) > 0) ?? product.variants[0];
}

export function overlaps(a, b) {
  return a.start <= b.end && b.start <= a.end;
}

export function availabilityTone(value) {
  if (value === 'available') return 'success';
  if (value === 'partially_booked' || value === 'limited') return 'warning';
  return 'danger';
}

export function variantSummary(product, dates, locale, t, rentals) {
  const available = product.variants.filter((variant) => getVariantAvailability(product, variant.id, dates, rentals) > 0);
  if (available.length === 0) return t('customer.product.topeng.action');
  if (available.length === 1) return `${variantLabel(t, available[0].label)} ${locale === 'id' ? 'tersedia' : 'available'}`;
  return `${available.map((variant) => variantLabel(t, variant.label)).join(', ')}`;
}

export function getVariantBookedQuantity(productId, variantId, dates, rentals) {
  return rentals
    .filter((rental) => BLOCKING_LIFECYCLES.includes(rental.lifecycle) && overlaps(dates, rental))
    .flatMap((rental) => rental.items)
    .filter((item) => item.productId === productId && item.variantId === variantId)
    .reduce((sum, item) => sum + item.qty, 0);
}

export function getProductDayAvailability(product, date, rentals = []) {
  const range = { start: date, end: date };
  const unavailable = !product.active || product.maintenanceBlocks.some((block) => overlaps(range, block));
  const rows = product.variants.map((variant) => {
    const booked = Array.isArray(rentals)
      ? getVariantBookedQuantity(product.id, variant.id, range, rentals)
      : variant.held;
    const available = unavailable ? 0 : Math.max(0, variant.total - booked);
    return {
      variantId: variant.id,
      label: variant.label,
      total: variant.total,
      booked,
      available,
      state: unavailable ? 'unavailable' : available <= 0 ? 'fully_booked' : booked > 0 ? 'partially_booked' : 'available',
    };
  });
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const booked = rows.reduce((sum, row) => sum + row.booked, 0);
  const available = rows.reduce((sum, row) => sum + row.available, 0);
  const state = unavailable
    ? 'unavailable'
    : available <= 0
      ? 'fully_booked'
      : booked > 0
        ? 'partially_booked'
        : 'available';

  return { date, productId: product.id, total, booked, available, state, variants: rows };
}

export function findNextAvailableWindow(product, variantId, dates, rentals, maxDays = 90) {
  const duration = Math.max(1, dayCount(dates.start, dates.end));
  for (let offset = 1; offset <= maxDays - duration + 1; offset += 1) {
    const start = addDays(dates.start, offset);
    const end = addDays(start, duration - 1);
    const everyDayAvailable = Array.from({ length: duration }).every((_, index) => {
      const date = addDays(start, index);
      if (variantId) return getVariantAvailability(product, variantId, { start: date, end: date }, rentals) > 0;
      return getProductDayAvailability(product, date, rentals).available > 0;
    });
    if (everyDayAvailable) return { start, end };
  }
  return null;
}

export function variantLabel(t, variant) {
  return variant === 'package' ? t('variant.package') : variant;
}

export function formatRupiah(value) {
  return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)}`;
}

export function formatDate(value, locale) {
  if (!value) return '-';
  return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

export function formatDateRange(value, locale) {
  return `${formatDate(value.start, locale)} - ${formatDate(value.end, locale)}`;
}

export function normalizePhone(phone) {
  return phone.replace(/\D/g, '').replace(/^0/, '62');
}

export function upsertClient(clients, rental) {
  const existing = clients.find((client) => normalizePhone(client.phone) === normalizePhone(rental.phone));
  if (existing) {
    return clients.map((client) =>
      client === existing
        ? {
            ...client,
            name: rental.customerName,
            email: rental.email,
            totalRentals: client.totalRentals + 1,
            lastContact: '27 Mei 2026',
          }
        : client,
    );
  }
  return [
    {
      id: `client-${Date.now()}`,
      name: rental.customerName,
      phone: rental.phone,
      email: rental.email,
      totalRentals: 1,
      lastContact: '27 Mei 2026',
      notes: rental.notes,
    },
    ...clients,
  ];
}

export function appendActivity(rental, activity) {
  return {
    ...rental,
    activity: [
      {
        id: `a-${Date.now()}`,
        time: '27 Mei 2026 14.45',
        ...activity,
      },
      ...rental.activity,
    ],
  };
}

export function activityText(textId, textEn) {
  return { textId, textEn };
}

export function updateVariantTotal(product, variantId, delta) {
  return {
    ...product,
    variants: product.variants.map((variant) =>
      variant.id === variantId ? { ...variant, total: Math.max(variant.held, variant.total + delta) } : variant,
    ),
  };
}

export function applyItemHoldDelta(products, items, delta) {
  return products.map((product) => {
    const productItems = items.filter((item) => item.productId === product.id);
    if (productItems.length === 0) return product;

    return {
      ...product,
      variants: product.variants.map((variant) => {
        const qtyDelta = productItems
          .filter((item) => item.variantId === variant.id)
          .reduce((sum, item) => sum + item.qty * delta, 0);
        return qtyDelta === 0 ? variant : { ...variant, held: Math.max(0, Math.min(variant.total, variant.held + qtyDelta)) };
      }),
    };
  });
}

export function shouldReleaseHold(previousLifecycle, nextLifecycle) {
  return !['returned', 'completed', 'rejected', 'cancelled'].includes(previousLifecycle) && ['returned', 'rejected', 'cancelled'].includes(nextLifecycle);
}

export function localizedData(item, field, t) {
  const locale = document.documentElement.lang === 'en' ? 'en' : 'id';
  return locale === 'id' ? item[`${field}Id`] : item[`${field}En`] ?? item[`${field}Id`] ?? t('common.empty');
}

export function getAdminMetrics(rentals) {
  return {
    requested: rentals.filter((rental) => rental.lifecycle === 'requested').length,
    ready: rentals.filter((rental) => ['preparing', 'ready_pickup'].includes(rental.lifecycle)).length,
    returnedOpen: rentals.filter((rental) => rental.lifecycle === 'returned' && rental.paymentStatus !== 'verified').length,
    overdue: rentals.filter((rental) => rental.lifecycle === 'on_rent').length || 1,
  };
}

export function getAdminTitle(section, t) {
  const map = {
    requests: 'admin.requests.title',
    rentals: 'admin.rentals.title',
    catalogue: 'admin.catalogue.title',
    clients: 'admin.clients.title',
    notifications: 'admin.notifications.title',
    settings: 'admin.settings.title',
  };
  return t(map[section] ?? 'admin.header.title');
}

export function getAdminCopy(section, t) {
  const map = {
    requests: 'admin.requests.copy',
    rentals: 'admin.rentals.copy',
    catalogue: 'admin.catalogue.copy',
    clients: 'admin.clients.copy',
    notifications: 'admin.notifications.copy',
    settings: 'admin.settings.copy',
  };
  return t(map[section] ?? 'admin.header.copy');
}

export function resolveTagline(settings, scope, t) {
  if (scope === 'customer') return settings.customerTaglineCustom || t(settings.customerTaglineKey);
  return settings.staffTaglineCustom || t(settings.staffTaglineKey);
}
