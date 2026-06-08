import { type ReactNode, useEffect } from 'react';
import { CustomerNav } from '../../components/customer/common/CustomerNav';
import { resolveTagline } from '../../lib/rental-utils';
import type { Locale, Settings, TFunction } from '../../types/domain';
import type { StateSetter } from '../../types/app';

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
}: {
  title: string;
  skipTo: string;
  settings: Settings;
  locale: Locale;
  setLocale: StateSetter<Locale>;
  t: TFunction;
  cartCount: number;
  onOpenCart: () => void;
  children: ReactNode;
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
