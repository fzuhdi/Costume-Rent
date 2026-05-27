import { useEffect } from 'react';
import { CustomerNav } from '../../components/customer/CustomerComponents.jsx';
import { resolveTagline } from '../../lib/rental-utils.js';

export default function CustomerFrame({
  title,
  skipTo,
  settings,
  locale,
  setLocale,
  t,
  cartCount,
  onOpenCart,
  children,
}) {
  useEffect(() => {
    document.body.classList.remove('admin-page');
    document.body.classList.add('customer-page');
    document.title = title;
  }, [title]);

  return (
    <>
      <a className="skip-link" href={`#${skipTo}`}>
        {t('common.skip')}
      </a>
      <CustomerNav
        brandName={settings.brandName}
        tagline={resolveTagline(settings, 'customer', t)}
        locale={locale}
        setLocale={setLocale}
        t={t}
        cartCount={cartCount}
        onOpenCart={onOpenCart}
      />
      <main>{children}</main>
    </>
  );
}
