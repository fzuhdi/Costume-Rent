import { ShoppingBag } from 'lucide-react';
import { CartSummary, CheckoutForm } from '../../components/customer/CustomerComponents.jsx';
import CustomerFrame from './CustomerFrame.jsx';

export default function CheckoutRoutePage({
  locale,
  setLocale,
  t,
  settings,
  cart,
  cartItems,
  cartTotal,
  cartCount,
  onQty,
  onRemove,
  createBooking,
  submittedBooking,
  onOpenCart,
}) {
  return (
    <CustomerFrame
      title={t('document.checkoutTitle')}
      skipTo="checkout-route"
      settings={settings}
      locale={locale}
      setLocale={setLocale}
      t={t}
      cartCount={cart.length}
      onOpenCart={onOpenCart}
    >
      <section className="checkout-route-page" id="checkout-route">
        <div className="shell checkout-route-layout">
          <div className="checkout-route-head">
            <ShoppingBag aria-hidden="true" />
            <span className="section-kicker">{t('customer.checkout.routeKicker')}</span>
            <h1>{t('customer.checkout.routeTitle')}</h1>
            <p>{t('customer.checkout.routeCopy')}</p>
          </div>
          <div className="checkout-modal-layout route-checkout-layout">
            <CheckoutForm t={t} cartCount={cartCount} createBooking={createBooking} submittedBooking={submittedBooking} />
            <CartSummary cartItems={cartItems} cartTotal={cartTotal} t={t} locale={locale} onQty={onQty} onRemove={onRemove} />
          </div>
        </div>
      </section>
    </CustomerFrame>
  );
}
