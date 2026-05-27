import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../../components/customer/CustomerComponents.jsx';
import { EmptyState } from '../../components/shared.jsx';
import { defaultDates } from '../../mockData.js';
import {
  formatDateRange,
  getVariantAvailability,
  validateDates,
} from '../../lib/rental-utils.js';
import CustomerFrame from './CustomerFrame.jsx';

const filters = ['all', 'bali', 'melayu', 'dance', 'accessory'];

function readCatalogueDates(searchParams) {
  return {
    start: searchParams.get('start') || defaultDates.start,
    end: searchParams.get('end') || defaultDates.end,
  };
}

export default function CustomerCataloguePage({
  locale,
  setLocale,
  t,
  products,
  rentals,
  settings,
  cart,
  setCart,
  onOpenCart,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const categoryParam = searchParams.get('category') ?? 'all';
  const category = filters.includes(categoryParam) ? categoryParam : 'all';
  const appliedDates = readCatalogueDates(searchParams);
  const [draftDates, setDraftDates] = useState(appliedDates);
  const [dateError, setDateError] = useState('');
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);

  useEffect(() => {
    setDraftDates(appliedDates);
  }, [appliedDates.start, appliedDates.end]);

  const visibleProducts = useMemo(() => {
    if (!settings.publicCatalogue) return [];
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const name = t(product.nameKey).toLowerCase();
      const meta = t(product.metaKey).toLowerCase();
      const categoryMatches =
        category === 'all' ||
        product.region === category ||
        product.category === category ||
        (category === 'dance' && product.category === 'accessory');
      return product.active && categoryMatches && (!normalized || name.includes(normalized) || meta.includes(normalized));
    });
  }, [category, products, query, settings.publicCatalogue, t]);

  const updateCatalogueParams = (updates, options = { replace: true }) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    setSearchParams(next, options);
  };

  const buildDetailTo = (productId) => {
    const next = new URLSearchParams(searchParams);
    if (query.trim()) next.set('q', query.trim());
    next.set('category', category);
    next.set('start', appliedDates.start);
    next.set('end', appliedDates.end);
    const search = next.toString();
    return { pathname: `/costumes/${productId}`, search: search ? `?${search}` : '' };
  };

  const applyDates = () => {
    const error = validateDates(draftDates);
    setDateError(error ? t(error) : '');
    if (error) return;

    const changed = draftDates.start !== appliedDates.start || draftDates.end !== appliedDates.end;
    updateCatalogueParams({ start: draftDates.start, end: draftDates.end }, { replace: false });
    if (changed && cart.length > 0) setShowSyncPrompt(true);
  };

  const syncCartDates = () => {
    setCart((current) =>
      current.map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        const available = product ? getVariantAvailability(product, item.variantId, draftDates, rentals) : 0;
        return available >= item.qty ? { ...item, start: draftDates.start, end: draftDates.end } : item;
      }),
    );
    setShowSyncPrompt(false);
  };

  return (
    <CustomerFrame
      title={t('document.catalogueTitle')}
      skipTo="catalogue"
      settings={settings}
      locale={locale}
      setLocale={setLocale}
      t={t}
      cartCount={cart.length}
      onOpenCart={onOpenCart}
    >
      <section className="catalogue-page" id="catalogue">
        <div className="shell">
          <div className="catalogue-header">
            <div className="catalogue-intro">
              <span className="section-kicker">{t('customer.catalogue.kicker')}</span>
              <h1>{t('customer.catalogue.title')}</h1>
              <p>{t('customer.catalogue.copy')}</p>
            </div>
          </div>

          <div className="search-panel" aria-label={t('customer.search.aria')}>
            <label className="search-field search-query">
              <span>{t('customer.search.queryLabel')}</span>
              <input
                value={query}
                onChange={(event) => updateCatalogueParams({ q: event.target.value })}
                placeholder={t('customer.search.queryValue')}
                type="search"
              />
            </label>
            <label className="search-field">
              <span>{t('customer.search.startLabel')}</span>
              <input value={draftDates.start} onChange={(event) => setDraftDates((current) => ({ ...current, start: event.target.value }))} type="date" />
            </label>
            <label className="search-field">
              <span>{t('customer.search.endLabel')}</span>
              <input value={draftDates.end} onChange={(event) => setDraftDates((current) => ({ ...current, end: event.target.value }))} type="date" />
            </label>
            <label className="search-field">
              <span>{t('customer.search.methodLabel')}</span>
              <input value={t('customer.search.methodValue')} readOnly />
            </label>
            <button className="primary-button" type="button" onClick={applyDates}>
              <Search aria-hidden="true" />
              {t('customer.search.submit')}
            </button>
          </div>
          {dateError ? <p className="validation-message">{dateError}</p> : null}
          {showSyncPrompt ? (
            <div className="inline-alert warning">
              <div>
                <strong>{t('customer.date.syncTitle')}</strong>
                <p>{t('customer.date.syncCopy')}</p>
              </div>
              <button className="outline-button" type="button" onClick={() => setShowSyncPrompt(false)}>
                {t('customer.date.keep')}
              </button>
              <button className="secondary-button" type="button" onClick={syncCartDates}>
                {t('customer.date.sync')}
              </button>
            </div>
          ) : null}

          <div className="catalogue-toolbar">
            <div>
              <span className="eyebrow">
                {t('customer.toolbar.kicker')}: {formatDateRange(appliedDates, locale)}
              </span>
              <h2>{t('customer.toolbar.title')}</h2>
            </div>
            <div className="filter-row" aria-label={t('customer.filters.aria')}>
              {filters.map((filter) => (
                <button className={`filter-chip ${category === filter ? 'active' : ''}`} type="button" key={filter} onClick={() => updateCatalogueParams({ category: filter })}>
                  {t(`customer.filters.${filter}`)}
                </button>
              ))}
            </div>
          </div>

          {visibleProducts.length === 0 ? (
            <EmptyState title={t('customer.catalogue.emptyTitle')} copy={t('customer.catalogue.emptyCopy')} icon={Search} />
          ) : (
            <div className="product-grid" aria-label={t('customer.grid.aria')}>
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} dates={appliedDates} locale={locale} t={t} detailTo={buildDetailTo(product.id)} rentals={rentals} />
              ))}
            </div>
          )}
        </div>
      </section>
    </CustomerFrame>
  );
}
