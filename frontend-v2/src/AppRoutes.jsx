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
import { createLocalDataAdapter } from './lib/data-adapter.js';
import {
  getCartItems,
  getVariantAvailability,
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

  const createBooking = async (values) => {
    const result = await dataAdapter.requests.create({ values, cart });
    if (result?.rental) {
      setSubmittedBooking(result.rental);
      setCart([]);
    }
    return result;
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
    dataAdapter,
  };

  return (
    <>
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<CustomerCataloguePage {...appState} />} />
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
      />

      {location.pathname === '/checkout' && backgroundLocation ? (
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
