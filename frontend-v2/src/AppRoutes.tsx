import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, type Location } from 'react-router-dom';
import { CheckoutModal, RequestSummarySheet } from './components/customer/checkout/CustomerCheckoutComponents';
import { useI18n } from './hooks/useI18n';
import { usePersistentState } from './hooks/usePersistentState';
import {
  defaultDates,
  initialClients,
  initialNotifications,
  initialProducts,
  initialRentals,
  initialSettings,
  normalizeHomeContent,
} from './mockData';
import CustomerCataloguePage from './pages/customer/CustomerCataloguePage';
import CustomerHomePage from './pages/customer/CustomerHomePage';
import CheckoutRoutePage from './pages/customer/CheckoutRoutePage';
import LookupPage from './pages/customer/LookupPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import AdminShell from './pages/admin/AdminShell';
import StaffLoginPage from './pages/admin/StaffLoginPage';
import { createLocalDataAdapter } from './lib/data-adapter';
import {
  contentSource,
  getCartItems,
  getVariantAvailability,
  toSourceContent,
} from './lib/rental-utils';
import type { AppState } from './types/app';
import type { BookingValues, CartItem, DateRange, Product, ProductVariant, Rental, StaffSession } from './types/domain';

function AppRoutes() {
  const i18n = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = location.state as { backgroundLocation?: Location } | null;
  const backgroundLocation = routeState?.backgroundLocation;
  const [products, setProducts] = usePersistentState('cr-v2-products', initialProducts);
  const [rentals, setRentals] = usePersistentState('cr-v2-rentals', initialRentals);
  const [clients, setClients] = usePersistentState('cr-v2-clients', initialClients);
  const [notifications, setNotifications] = usePersistentState('cr-v2-notifications', initialNotifications);
  const [settings, setSettings] = usePersistentState('cr-v2-settings-v2', initialSettings);
  const [staffSession, setStaffSession] = usePersistentState('cr-v2-staff-session', {
    isAuthenticated: false,
    username: '',
  });
  const safeStaffSession =
    staffSession && typeof staffSession === 'object'
      ? { isAuthenticated: Boolean(staffSession.isAuthenticated), username: typeof staffSession.username === 'string' ? staffSession.username : '' }
      : { isAuthenticated: false, username: '' };
  const [cart, setCart] = usePersistentState('cr-v2-request-cart', [
    { productId: 'batik', variantId: 'M', qty: 1, start: defaultDates.start, end: defaultDates.end },
    { productId: 'melayu', variantId: 'L', qty: 1, start: defaultDates.start, end: defaultDates.end },
  ]);

  useEffect(() => {
    setProducts((current) => {
      const byId = new Map(current.map((product) => [product.id, product]));
      let changed = false;
      const normalized = current.map((product) => {
        const initialProduct = initialProducts.find((entry) => entry.id === product.id);
        const nextProduct = normalizeProductContent(product, initialProduct);
        if (stableJson(nextProduct) !== stableJson(product)) changed = true;
        return nextProduct;
      });
      const missing = initialProducts.filter((product) => !byId.has(product.id)).map((product) => normalizeProductContent(product, product));
      if (missing.length > 0) changed = true;
      return changed ? [...normalized, ...missing] : current;
    });
  }, [setProducts]);

  useEffect(() => {
    setSettings((current) => {
      const normalizedHomeContent = normalizeHomeContent(current.homeContent);
      if (stableJson(current.homeContent) === stableJson(normalizedHomeContent)) return current;
      return { ...current, homeContent: normalizedHomeContent };
    });
  }, [setSettings]);
  const [requestSheetOpen, setRequestSheetOpen] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState<Rental | null>(null);
  const cartItems = getCartItems(cart, products);
  const cartTotal = cartItems.reduce((sum, item) => sum + (Number(item.product.price) || 0) * item.qty, 0);
  const dataAdapter = createLocalDataAdapter({
    getState: () => ({ products, rentals, clients, notifications, settings }),
    setProducts,
    setRentals,
    setClients,
    setNotifications,
    setSettings,
    t: i18n.t,
    locale: i18n.locale,
  });

  const addCartItem = (product: Product, variantId: string, dates: DateRange, availability: number) => {
    setSubmittedBooking(null);
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id && item.variantId === variantId);
      if (existing) {
        return current.map((item) =>
          item === existing ? { ...item, qty: Math.min(item.qty + 1, availability), start: dates.start, end: dates.end } : item,
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          variantId,
          qty: 1,
          start: dates.start,
          end: dates.end,
        },
      ];
    });
  };

  const updateCartQty = (target: CartItem, delta: number) => {
    setCart((current) =>
      current
        .map((item) => {
          if (item.productId !== target.productId || item.variantId !== target.variantId) return item;
          const product = products.find((entry) => entry.id === item.productId);
          const max = product ? Math.max(1, getVariantAvailability(product, item.variantId, { start: item.start, end: item.end }, rentals)) : 1;
          return { ...item, qty: Math.max(1, Math.min(max, item.qty + delta)) };
        })
        .filter((item) => item.qty > 0),
    );
  };

  const removeCartItem = (target: CartItem) => {
    setCart((current) => current.filter((item) => item.productId !== target.productId || item.variantId !== target.variantId));
  };

  const createBooking = async (values: BookingValues) => {
    const result = await dataAdapter.requests.create({ values, cart });
    if (result?.rental) {
      const createdRentals = result.rentals ?? [result.rental];
      setSubmittedBooking(
        createdRentals.length > 1
          ? { ...result.rental, groupedReferences: createdRentals.map((rental) => rental.reference) }
          : result.rental,
      );
      setCart([]);
    }
    return result;
  };

  const appState: AppState = {
    ...i18n,
    products,
    setProducts,
    rentals,
    setRentals,
    clients,
    setClients,
    notifications,
    setNotifications,
    settings,
    setSettings,
    staffSession: safeStaffSession,
    setStaffSession,
    cart,
    setCart,
    addCartItem,
    onOpenCart: () => setRequestSheetOpen(true),
    dataAdapter,
  };

  return (
    <>
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<CustomerHomePage {...appState} />} />
        <Route path="/catalogue" element={<CustomerCataloguePage {...appState} />} />
        <Route path="/costumes/:productId" element={<ProductDetailPage {...appState} />} />
        <Route path="/lookup" element={<LookupPage {...appState} />} />
        <Route
          path="/checkout"
          element={
            <CheckoutRoutePage
              {...appState}
              cartItems={cartItems}
              cartTotal={cartTotal}
              cartCount={cart.length}
              onQty={updateCartQty}
              onRemove={removeCartItem}
              createBooking={createBooking}
              submittedBooking={submittedBooking}
            />
          }
        />
        <Route path="/admin/login" element={<StaffLoginPage {...appState} />} />
        <Route path="/admin" element={<AdminIndex staffSession={safeStaffSession} />} />
        <Route
          path="/admin/:section"
          element={
            safeStaffSession.isAuthenticated ? (
              <AdminShell {...appState} />
            ) : (
              <AdminLoginRedirect />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <RequestSummarySheet
        open={requestSheetOpen}
        onOpenChange={setRequestSheetOpen}
        t={i18n.t}
        locale={i18n.locale}
        cartItems={cartItems}
        cartTotal={cartTotal}
        cartCount={cart.length}
        onQty={updateCartQty}
        onRemove={removeCartItem}
        createBooking={createBooking}
        submittedBooking={submittedBooking}
      />

      {location.pathname === '/checkout' && backgroundLocation ? (
        <CheckoutModal
          open
          onOpenChange={(open: boolean) => {
            if (open) return;
            if (backgroundLocation) {
              navigate(-1);
            } else {
              navigate({ pathname: '/catalogue', search: location.search });
            }
          }}
          t={i18n.t}
          locale={i18n.locale}
          cartItems={cartItems}
          cartTotal={cartTotal}
          cartCount={cart.length}
          onQty={updateCartQty}
          onRemove={removeCartItem}
          createBooking={createBooking}
          submittedBooking={submittedBooking}
        />
      ) : null}
    </>
  );
}

function AdminIndex({ staffSession }: { staffSession: StaffSession }) {
  const location = useLocation();
  return staffSession.isAuthenticated
    ? <Navigate to={`/admin/requests${location.search}`} replace />
    : <Navigate to={`/admin/login${location.search}`} replace />;
}

function AdminLoginRedirect() {
  const location = useLocation();
  return <Navigate to={`/admin/login${location.search}`} replace />;
}

function normalizeProductContent(product: Product, initialProduct: Partial<Product> = {}): Product {
  const {
    descriptionId,
    descriptionEn,
    bundleId,
    bundleEn,
    measurementId,
    measurementEn,
    variantNotesId,
    variantNotesEn,
    nameId,
    nameEn,
    nameKey,
    metaId,
    metaEn,
    metaKey,
    altId,
    altEn,
    altKey,
    copyKey,
    detailAriaKey,
    priceKey,
    unitKey,
    ...rest
  } = product;
  const name = firstContentText(product.name, nameId, nameEn, initialProduct.name, literalFallback(nameKey));
  const meta = firstContentText(product.meta, metaId, metaEn, initialProduct.meta, literalFallback(metaKey));
  const alt = firstContentText(product.alt, altId, altEn, initialProduct.alt, literalFallback(altKey), name);
  const descriptionFallback = firstContentText(
    descriptionId,
    descriptionEn,
    bundleId,
    bundleEn,
    contentSource(initialProduct.description),
    initialProduct.descriptionId,
    initialProduct.descriptionEn,
    initialProduct.bundleId,
    initialProduct.bundleEn,
    literalFallback(copyKey),
  );
  const variants = Array.isArray(product.variants) && product.variants.length > 0 ? product.variants : initialProduct.variants ?? [];
  const maintenanceBlocks = Array.isArray(product.maintenanceBlocks) ? product.maintenanceBlocks : initialProduct.maintenanceBlocks ?? [];

  return {
    ...rest,
    name,
    meta,
    alt,
    unitKey: normalizeUnitKey(unitKey ?? initialProduct.unitKey),
    gender: product.gender ?? initialProduct.gender ?? 'unisex',
    description: toSourceContent(product.description, descriptionFallback),
    variants: variants.map((variant) => normalizeVariantContent(variant, {
      measurementId,
      measurementEn,
      variantNotesId,
      variantNotesEn,
      initialProduct,
    })),
    maintenanceBlocks,
  };
}

function normalizeVariantContent(variant: ProductVariant, productContext: {
  measurementId?: string;
  measurementEn?: string;
  variantNotesId?: string;
  variantNotesEn?: string;
  initialProduct?: Partial<Product>;
}): ProductVariant {
  const { notesId, notesEn, ...rest } = variant;
  const initialVariant = productContext.initialProduct?.variants?.find((entry) => entry.id === variant.id);
  const notesFallback = firstContentText(
    notesId,
    notesEn,
    productContext.variantNotesId,
    productContext.variantNotesEn,
    productContext.measurementId,
    productContext.measurementEn,
    contentSource(initialVariant?.notes),
    initialVariant?.notesId,
    initialVariant?.notesEn,
    productContext.initialProduct?.measurementId,
    productContext.initialProduct?.measurementEn,
  );

  return {
    ...rest,
    notes: toSourceContent(variant.notes, notesFallback),
  };
}

function firstContentText(...values: unknown[]) {
  const value = values.map((entry) => contentSource(entry)).find((entry) => String(entry ?? '').trim());
  return String(value ?? '').trim();
}

function literalFallback(value: string | undefined) {
  if (!value || /^[a-z0-9]+(\.[a-z0-9_-]+)+$/i.test(value)) return '';
  return value;
}

function normalizeUnitKey(unitKey: string | undefined) {
  if (unitKey === 'customer.product.batik.unitSet') return 'customer.product.unitSet';
  if (unitKey === 'customer.product.songket.unitPack') return 'customer.product.unitPack';
  return unitKey ?? 'customer.product.unitSet';
}

function stableJson(value: unknown) {
  return JSON.stringify(value);
}

export default AppRoutes;
