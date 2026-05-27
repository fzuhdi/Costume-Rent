import { useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { CheckoutModal, RequestSummarySheet } from './components/customer/CustomerComponents.jsx';
import { useI18n } from './hooks/useI18n.js';
import { usePersistentState } from './hooks/usePersistentState.js';
import {
  defaultDates,
  initialClients,
  initialNotifications,
  initialProducts,
  initialRentals,
  initialSettings,
} from './mockData.js';
import CustomerCataloguePage from './pages/customer/CustomerCataloguePage.jsx';
import CheckoutRoutePage from './pages/customer/CheckoutRoutePage.jsx';
import LookupPage from './pages/customer/LookupPage.jsx';
import ProductDetailPage from './pages/customer/ProductDetailPage.jsx';
import AdminShell from './pages/admin/AdminShell.jsx';
import StaffLoginPage from './pages/admin/StaffLoginPage.jsx';
import {
  applyItemHoldDelta,
  getCartItems,
  getVariantAvailability,
  upsertClient,
} from './lib/rental-utils.js';

function AppRoutes() {
  const i18n = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const backgroundLocation = location.state?.backgroundLocation;
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
  const [requestSheetOpen, setRequestSheetOpen] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState(null);
  const cartItems = getCartItems(cart, products);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  const addCartItem = (product, variantId, dates, availability) => {
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

  const updateCartQty = (target, delta) => {
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

  const removeCartItem = (target) => {
    setCart((current) => current.filter((item) => item.productId !== target.productId || item.variantId !== target.variantId));
  };

  const createBooking = (values) => {
    const blockedItem = cart.find((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) return true;
      return getVariantAvailability(product, item.variantId, { start: item.start, end: item.end }, rentals) < item.qty;
    });
    if (blockedItem) {
      const product = products.find((entry) => entry.id === blockedItem.productId);
      return {
        error: i18n.t('customer.checkout.stockChanged', {
          item: product ? i18n.t(product.nameKey) : blockedItem.productId,
        }),
      };
    }

    const rentalItems = cart.map(({ productId, variantId, qty }) => ({ productId, variantId, qty }));
    const reference = `CR-${String(146 + rentals.length).padStart(4, '0')}`;
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
          time: '27 Mei 2026 14.30',
          textId: 'Permintaan pelanggan dibuat dari frontend.',
          textEn: 'Customer request created from frontend.',
        },
      ],
    };

    setProducts((current) => applyItemHoldDelta(current, rental.items, 1));
    setRentals((current) => [rental, ...current]);
    setClients((current) => upsertClient(current, rental));
    setNotifications((current) => [
      {
        id: `n-${Date.now()}`,
        tone: 'warning',
        titleId: 'Permintaan baru masuk',
        titleEn: 'New request submitted',
        copyId: `${reference} menunggu tinjauan staf.`,
        copyEn: `${reference} is waiting for staff review.`,
        targetRoute: `/admin/requests?reference=${reference}`,
      },
      ...current,
    ]);
    setSubmittedBooking(rental);
    setCart([]);
    return { rental };
  };

  const appState = {
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
  };

  return (
    <>
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<CustomerCataloguePage {...appState} />} />
        <Route path="/costumes/:productId" element={<ProductDetailPage {...appState} />} />
        <Route path="/lookup" element={<LookupPage {...appState} />} />
        <Route path="/checkout" element={<CheckoutRoutePage {...appState} />} />
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
      />

      {location.pathname === '/checkout' ? (
        <CheckoutModal
          open
          onOpenChange={(open) => {
            if (open) return;
            if (backgroundLocation) {
              navigate(-1);
            } else {
              navigate({ pathname: '/', search: location.search });
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

function AdminIndex({ staffSession }) {
  const location = useLocation();
  return staffSession.isAuthenticated
    ? <Navigate to={`/admin/requests${location.search}`} replace />
    : <Navigate to={`/admin/login${location.search}`} replace />;
}

function AdminLoginRedirect() {
  const location = useLocation();
  return <Navigate to={`/admin/login${location.search}`} replace />;
}

export default AppRoutes;
