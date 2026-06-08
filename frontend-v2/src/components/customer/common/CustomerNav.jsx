
import { ShoppingCart } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { LocaleButton } from '../../shared.jsx';

export function CustomerNav({ brandName, tagline, locale, setLocale, t, cartCount, onOpenCart }) {
  const location = useLocation();
  const catalogueTo = {
    pathname: '/catalogue',
    search: location.pathname.startsWith('/costumes/') || location.pathname === '/checkout' ? location.search : '',
  };

  return (
    <header className="customer-nav">
      <div className="shell nav-inner">
        <Link className="brand" to="/" aria-label={t('brand.customerAria')}>
          <span className="brand-mark">CR</span>
          <span>
            <strong>{brandName}</strong>
            <small>{tagline}</small>
          </span>
        </Link>
        <nav className="nav-links" aria-label={t('nav.customerAria')}>
          <NavLink to="/" end>
            {t('nav.home')}
          </NavLink>
          <NavLink to={catalogueTo} end>
            {t('nav.catalogue')}
          </NavLink>
          <NavLink to="/lookup">{t('nav.lookup')}</NavLink>
        </nav>
        <div className="nav-actions">
          <LocaleButton locale={locale} setLocale={setLocale} t={t} />
          <button className="cart-button icon-only" type="button" onClick={onOpenCart} aria-label={t('cart.itemsAria', { count: cartCount })}>
            <ShoppingCart aria-hidden="true" />
            <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
