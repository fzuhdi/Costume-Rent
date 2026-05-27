import { defaultDates } from '../mockData.js';
import {
  addDays,
  applyItemHoldDelta,
  dayCount,
  getProductDayAvailability,
  getVariantAvailability,
  normalizePhone,
  productMeta,
  productName,
  upsertClient,
} from './rental-utils.js';

const PUBLIC_AVAILABILITY_TTL_MS = 45_000;
const MAX_PUBLIC_AVAILABILITY_DAYS = 90;
const availabilityCache = new Map();

function assertActive(signal) {
  if (signal?.aborted) {
    throw new DOMException('Request cancelled', 'AbortError');
  }
}

function cacheKey({ productIds, variantIds, start, end }) {
  return JSON.stringify({
    productIds: [...new Set(productIds)].sort(),
    variantIds: variantIds ? [...new Set(variantIds)].sort() : [],
    start,
    end,
  });
}

function nextReference(rentals) {
  const highest = rentals
    .map((rental) => Number(String(rental.reference).replace(/^CR-/i, '')))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 145);
  return `CR-${String(highest + 1).padStart(4, '0')}`;
}

function toCatalogueItemSearch(product, t) {
  return `${productName(product, t)} ${productMeta(product, t)} ${product.region} ${product.category}`.toLowerCase();
}

function makeNotification({ tone, titleId, titleEn, copyId, copyEn, targetRoute }) {
  return {
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tone,
    titleId,
    titleEn,
    copyId,
    copyEn,
    targetRoute,
  };
}

export function createLocalDataAdapter({
  getState,
  setProducts,
  setRentals,
  setClients,
  setNotifications,
  setSettings,
  t,
  locale,
}) {
  return {
    catalogue: {
      async list({ q = '', category = 'all', start = defaultDates.start, end = defaultDates.end, page = 1, pageSize = 24, signal } = {}) {
        assertActive(signal);
        const { products, settings } = getState();
        if (!settings.publicCatalogue) return { items: [], total: 0, page, pageSize, dates: { start, end } };

        const normalized = q.trim().toLowerCase();
        const filtered = products.filter((product) => {
          const categoryMatches =
            category === 'all' ||
            product.region === category ||
            product.category === category ||
            (category === 'dance' && product.category === 'accessory');
          return product.active && categoryMatches && (!normalized || toCatalogueItemSearch(product, t).includes(normalized));
        });
        const offset = Math.max(0, (Number(page) || 1) - 1) * pageSize;
        assertActive(signal);
        return {
          items: filtered.slice(offset, offset + pageSize),
          total: filtered.length,
          page,
          pageSize,
          dates: { start, end },
        };
      },
    },

    availability: {
      async batch({ productIds = [], variantIds, start = defaultDates.start, end = defaultDates.end, signal } = {}) {
        assertActive(signal);
        const ids = [...new Set(productIds)].filter(Boolean);
        if (ids.length === 0) return [];

        const days = dayCount(start, end);
        if (days > MAX_PUBLIC_AVAILABILITY_DAYS) {
          throw new Error(`Availability window exceeds ${MAX_PUBLIC_AVAILABILITY_DAYS} days.`);
        }

        const key = cacheKey({ productIds: ids, variantIds, start, end });
        const cached = availabilityCache.get(key);
        if (cached && cached.expiresAt > Date.now()) return cached.rows;

        const { products, rentals } = getState();
        const selectedProducts = products.filter((product) => ids.includes(product.id));
        const selectedVariants = variantIds ? new Set(variantIds) : null;
        const rows = [];

        for (let offset = 0; offset < days; offset += 1) {
          const date = addDays(start, offset);
          selectedProducts.forEach((product) => {
            const dayAvailability = getProductDayAvailability(product, date, rentals);
            dayAvailability.variants
              .filter((variant) => !selectedVariants || selectedVariants.has(variant.variantId))
              .forEach((variant) => {
                rows.push({
                  date,
                  productId: product.id,
                  variantId: variant.variantId,
                  total: variant.total,
                  booked: variant.booked,
                  available: variant.available,
                  state: variant.state,
                });
              });
          });
        }

        assertActive(signal);
        availabilityCache.set(key, { rows, expiresAt: Date.now() + PUBLIC_AVAILABILITY_TTL_MS });
        return rows;
      },

      clear() {
        availabilityCache.clear();
      },
    },

    requests: {
      async create({ values, cart }) {
        const { products, rentals } = getState();
        const blockedItem = cart.find((item) => {
          const product = products.find((entry) => entry.id === item.productId);
          if (!product) return true;
          return getVariantAvailability(product, item.variantId, { start: item.start, end: item.end }, rentals) < item.qty;
        });

        if (blockedItem) {
          const product = products.find((entry) => entry.id === blockedItem.productId);
          return {
            error: t('customer.checkout.stockChanged', {
              item: product ? productName(product, t) : blockedItem.productId,
            }),
          };
        }

        const rentalItems = cart.map(({ productId, variantId, qty }) => ({ productId, variantId, qty }));
        const reference = nextReference(rentals);
        const rental = {
          reference,
          customerName: values.name,
          phone: values.phone,
          email: values.email,
          lifecycle: 'requested',
          paymentStatus: 'missing',
          paymentMethod: 'bank_transfer',
          fulfillment: values.fulfillment,
          start: cart[0]?.start ?? defaultDates.start,
          end: cart[0]?.end ?? defaultDates.end,
          pickupWindow: values.pickupWindow,
          returnWindow: values.returnWindow,
          deliveryWindow: values.deliveryWindow,
          address: values.address,
          notes: values.notes,
          internalNotes: '',
          staleHours: 0,
          deliveryFee: 0,
          deliveryNotes: '',
          items: rentalItems,
          checklist: [
            { id: 'confirm-size', labelId: 'Konfirmasi ukuran', labelEn: 'Confirm size', done: false },
            { id: 'hold-stock', labelId: 'Tahan stok', labelEn: 'Hold stock', done: true },
          ],
          activity: [
            {
              id: `a-${Date.now()}`,
              time: locale === 'id' ? '27 Mei 2026 14.30' : 'May 27, 2026 14:30',
              textId: 'Permintaan pelanggan dibuat dari frontend.',
              textEn: 'Customer request created from frontend.',
            },
          ],
        };

        setProducts((current) => applyItemHoldDelta(current, rental.items, 1));
        setRentals((current) => [rental, ...current]);
        setClients((current) => upsertClient(current, rental));
        setNotifications((current) => [
          makeNotification({
            tone: 'warning',
            titleId: 'Permintaan baru masuk',
            titleEn: 'New request submitted',
            copyId: `${reference} menunggu tinjauan staf.`,
            copyEn: `${reference} is waiting for staff review.`,
            targetRoute: `/admin/requests?reference=${reference}`,
          }),
          ...current,
        ]);
        availabilityCache.clear();
        return { rental };
      },

      async change({ reference, customerName, phone, changeType, changeNotes }) {
        setNotifications((current) => [
          makeNotification({
            tone: changeType === 'cancel' ? 'warning' : 'info',
            titleId: 'Pelanggan meminta perubahan',
            titleEn: 'Customer requested a change',
            copyId: `${reference} - ${customerName || phone}: ${changeNotes || changeType}.`,
            copyEn: `${reference} - ${customerName || phone}: ${changeNotes || changeType}.`,
            targetRoute: `/admin/requests?reference=${encodeURIComponent(reference)}`,
          }),
          ...current,
        ]);
        return { ok: true };
      },
    },

    lookup: {
      async recover({ phone, name, hint }) {
        const displayName = name?.trim() || t('customer.lookup.recoveryUnknownName');
        const normalizedPhone = normalizePhone(phone);
        setNotifications((current) => [
          makeNotification({
            tone: 'info',
            titleId: 'Pelanggan lupa kode',
            titleEn: 'Customer forgot reference',
            copyId: `${displayName} meminta bantuan kode untuk ${phone}${hint ? ` (${hint})` : ''}.`,
            copyEn: `${displayName} asked for reference help for ${phone}${hint ? ` (${hint})` : ''}.`,
            targetRoute: `/admin/clients?phone=${encodeURIComponent(normalizedPhone)}`,
          }),
          ...current,
        ]);
        return { ok: true };
      },
    },

    admin: {
      products: {
        async save(product) {
          setProducts((current) => current.map((entry) => (entry.id === product.id ? product : entry)));
          availabilityCache.clear();
          return { ok: true, product };
        },
      },
      rentals: {
        async save(rental) {
          setRentals((current) => current.map((entry) => (entry.reference === rental.reference ? rental : entry)));
          availabilityCache.clear();
          return { ok: true, rental };
        },
      },
      clients: {
        async save(client) {
          setClients((current) => current.map((entry) => (entry.id === client.id ? client : entry)));
          return { ok: true, client };
        },
      },
      settings: {
        async save(settings) {
          setSettings(settings);
          return { ok: true, settings };
        },
      },
    },
  };
}
