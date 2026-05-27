import { LookupSection } from '../../components/customer/CustomerComponents.jsx';
import CustomerFrame from './CustomerFrame.jsx';

export default function LookupPage({
  locale,
  setLocale,
  t,
  settings,
  cart,
  rentals,
  products,
  setNotifications,
  onOpenCart,
}) {
  return (
    <CustomerFrame
      title={t('document.lookupTitle')}
      skipTo="lookup-page"
      settings={settings}
      locale={locale}
      setLocale={setLocale}
      t={t}
      cartCount={cart.length}
      onOpenCart={onOpenCart}
    >
      <LookupSection t={t} locale={locale} rentals={rentals} products={products} setNotifications={setNotifications} />
    </CustomerFrame>
  );
}
