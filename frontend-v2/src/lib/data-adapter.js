import { defaultDates } from '../mockData.js';
import {
  addDays,
  applyItemHoldDelta,
  dayCount,
  getProductAvailability,
  getProductDayAvailability,
  getVariantAvailability,
  normalizePhone,
  productMeta,
  productName,
  upsertClient,
} from './rental-utils.js';

const PUBLIC_AVAILABILITY_TTL_MS = 45_000;
const MAX_PUBLIC_AVAILABILITY_DAYS = 90;
const RENTALS_STORAGE_KEY = 'cr-v2-rentals';
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

function nextReferenceAt(rentals, offset = 1) {
  const highest = rentals
    .map((rental) => Number(String(rental.reference).replace(/^CR-/i, '')))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 145);
  return `CR-${String(highest + offset).padStart(4, '0')}`;
}

function readStoredRentals(fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(RENTALS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function mergeRentalsByReference(primary = [], secondary = []) {
  const seen = new Set();
  return [...primary, ...secondary].filter((rental) => {
    if (!rental?.reference || seen.has(rental.reference)) return false;
    seen.add(rental.reference);
    return true;
  });
}

function groupCartByDate(cart) {
  const groups = new Map();
  cart.forEach((item) => {
    const key = `${item.start}|${item.end}`;
    const current = groups.get(key) ?? {
      start: item.start,
      end: item.end,
      items: [],
    };
    current.items.push(item);
    groups.set(key, current);
  });
  return [...groups.values()];
}

function toCatalogueItemSearch(product, t) {
  return `${productName(product, t)} ${productMeta(product, t)} ${product.region} ${product.category} ${product.gender ?? 'unisex'}`.toLowerCase();
}

function availabilityRank(value) {
  if (value === 'available') return 0;
  if (value === 'partially_booked' || value === 'limited') return 1;
  if (value === 'fully_booked' || value === 'full') return 2;
  return 3;
}

function sortCatalogueItems(items, sort, dates, rentals) {
  const sorted = [...items];
  if (sort === 'price_asc') return sorted.sort((a, b) => a.price - b.price);
  if (sort === 'price_desc') return sorted.sort((a, b) => b.price - a.price);
  if (sort === 'availability') {
    return sorted.sort((a, b) => availabilityRank(getProductAvailability(a, dates, rentals)) - availabilityRank(getProductAvailability(b, dates, rentals)));
  }
  return sorted;
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
      async list({
        q = '',
        category = 'all',
        region = 'all',
        type = 'all',
        gender = 'all',
        minPrice = '',
        maxPrice = '',
        sort = 'relevance',
        start = defaultDates.start,
        end = defaultDates.end,
        page = 1,
        pageSize = 24,
        signal,
      } = {}) {
        assertActive(signal);
        const { products, settings, rentals } = getState();
        if (!settings.publicCatalogue) return { items: [], total: 0, page, pageSize, dates: { start, end } };

        const normalized = q.trim().toLowerCase();
        const selectedType = type !== 'all' ? type : category;
        const parsedMinPrice = Number(minPrice);
        const parsedMaxPrice = Number(maxPrice);
        const hasMinPrice = Number.isFinite(parsedMinPrice) && minPrice !== '';
        const hasMaxPrice = Number.isFinite(parsedMaxPrice) && maxPrice !== '';
        const filtered = products.filter((product) => {
          const categoryMatches = selectedType === 'all' || product.category === selectedType;
          const regionMatches = region === 'all' || product.region === region;
          const genderMatches = gender === 'all' || (product.gender ?? 'unisex') === gender;
          const minMatches = !hasMinPrice || product.price >= parsedMinPrice;
          const maxMatches = !hasMaxPrice || product.price <= parsedMaxPrice;
          return product.active &&
            categoryMatches &&
            regionMatches &&
            genderMatches &&
            minMatches &&
            maxMatches &&
            (!normalized || toCatalogueItemSearch(product, t).includes(normalized));
        });
        const sorted = sortCatalogueItems(filtered, sort, { start, end }, rentals);
        const offset = Math.max(0, (Number(page) || 1) - 1) * pageSize;
        assertActive(signal);
        return {
          items: sorted.slice(offset, offset + pageSize),
          total: sorted.length,
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
      async create({ values, cart, source = 'customer' }) {
        const { products, rentals } = getState();
        const latestRentals = mergeRentalsByReference(readStoredRentals(rentals), rentals);
        const blockedItem = cart.find((item) => {
          const product = products.find((entry) => entry.id === item.productId);
          if (!product) return true;
          return getVariantAvailability(product, item.variantId, { start: item.start, end: item.end }, latestRentals) < item.qty;
        });

        if (blockedItem) {
          const product = products.find((entry) => entry.id === blockedItem.productId);
          return {
            error: t('customer.checkout.stockChanged', {
              item: product ? productName(product, t) : blockedItem.productId,
            }),
          };
        }

        const createdByStaff = source === 'staff';
        const groupedCart = groupCartByDate(cart);
        const createdRentals = groupedCart.map((group, index) => {
          const reference = groupedCart.length === 1 ? nextReference(latestRentals) : nextReferenceAt(latestRentals, index + 1);
          const rentalItems = group.items.map(({ productId, variantId, qty }) => ({ productId, variantId, qty }));
          return {
            reference,
            customerName: values.name,
            phone: values.phone,
            email: values.email,
            lifecycle: 'requested',
            paymentStatus: 'missing',
            paymentMethod: 'bank_transfer',
            fulfillment: values.fulfillment,
            start: group.start ?? defaultDates.start,
            end: group.end ?? defaultDates.end,
            pickupWindow: values.pickupWindow,
            returnWindow: values.returnWindow,
            deliveryWindow: values.deliveryWindow,
            address: values.address,
            notes: values.notes,
            internalNotes: groupedCart.length > 1
              ? locale === 'id'
                ? 'Checkout pelanggan dipisah otomatis karena item memakai tanggal sewa berbeda.'
                : 'Customer checkout was split automatically because items use different rental dates.'
              : '',
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
                id: `a-${Date.now()}-${index}`,
                time: createdByStaff
                  ? locale === 'id' ? '28 Mei 2026 09.00' : 'May 28, 2026 09:00'
                  : locale === 'id' ? '27 Mei 2026 14.30' : 'May 27, 2026 14:30',
                textId: createdByStaff
                  ? 'Pesanan dibuat staf dari halaman Pesanan.'
                  : groupedCart.length > 1
                    ? 'Pesanan pelanggan dibuat dari checkout dan dipisah berdasarkan tanggal.'
                    : 'Pesanan pelanggan dibuat dari frontend.',
                textEn: createdByStaff
                  ? 'Order created by staff from Orders.'
                  : groupedCart.length > 1
                    ? 'Customer order created from checkout and split by date.'
                    : 'Customer order created from frontend.',
              },
            ],
          };
        });

        const allItems = createdRentals.flatMap((rental) => rental.items);
        setProducts((current) => applyItemHoldDelta(current, allItems, 1));
        setRentals((current) => {
          const currentLatest = mergeRentalsByReference(readStoredRentals(current), current);
          const createdReferences = new Set(createdRentals.map((rental) => rental.reference));
          return [
            ...createdRentals,
            ...currentLatest.filter((rental) => !createdReferences.has(rental.reference)),
          ];
        });
        setClients((current) => createdRentals.reduce((nextClients, rental) => upsertClient(nextClients, rental), current));
        setNotifications((current) => [
          ...createdRentals.map((rental) =>
            makeNotification({
              tone: 'warning',
              titleId: 'Pesanan baru masuk',
              titleEn: 'New order submitted',
              copyId: `${rental.reference} menunggu tinjauan staf.`,
              copyEn: `${rental.reference} is waiting for staff review.`,
              targetRoute: `/admin/requests?reference=${rental.reference}`,
            }),
          ),
          ...current,
        ]);
        availabilityCache.clear();
        return { rental: createdRentals[0], rentals: createdRentals };
      },

      async change({ reference, customerName, phone, changeType, changeNotes }) {
        setNotifications((current) => [
          makeNotification({
            tone: changeType === 'cancel' ? 'warning' : 'info',
            titleId: 'Pelanggan meminta perubahan pesanan',
            titleEn: 'Customer order change',
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
