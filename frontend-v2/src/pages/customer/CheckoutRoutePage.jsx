import { ShoppingBag } from 'lucide-react';
import CustomerFrame from './CustomerFrame.jsx';

export default function CheckoutRoutePage({ locale, setLocale, t, settings, cart, onOpenCart }) {
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
      <section className="checkout-route-placeholder" id="checkout-route">
        <div className="shell checkout-route-copy">
          <ShoppingBag aria-hidden="true" />
          <span className="section-kicker">{t('customer.checkout.routeKicker')}</span>
          <h1>{t('customer.checkout.routeTitle')}</h1>
          <p>{t('customer.checkout.routeCopy')}</p>
        </div>
      </section>
    </CustomerFrame>
  );
}
