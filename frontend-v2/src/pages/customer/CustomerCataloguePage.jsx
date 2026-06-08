import { ArrowUpDown, Check, ChevronDown, DollarSign, Heart, MapPin, RotateCcw, Search, SlidersHorizontal, Tags, Users, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../../components/customer/CustomerComponents.jsx';
import { EmptyState, Field } from '../../components/shared.jsx';
import { usePersistentState } from '../../hooks/usePersistentState.js';
import { defaultDates } from '../../mockData.js';
import {
  formatDateRange,
  getProductAvailability,
  getVariantAvailability,
  productMeta,
  productName,
  validateDates,
} from '../../lib/rental-utils.js';
import CustomerFrame from './CustomerFrame.jsx';

const RESULT_BATCH_SIZE = 6;
const FILTER_KEYS = ['region', 'type', 'gender', 'minPrice', 'maxPrice', 'sort', 'favorites'];
const GENDER_OPTIONS = ['women', 'men', 'unisex', 'kids'];
const SORT_OPTIONS = ['relevance', 'price_asc', 'price_desc', 'availability'];

function readCatalogueDates(searchParams) {
  return {
    start: searchParams.get('start') || defaultDates.start,
    end: searchParams.get('end') || defaultDates.end,
  };
}

function readFilterValue(searchParams, key, fallback = 'all') {
  return searchParams.get(key) || fallback;
}

function readPriceValue(searchParams, key) {
  return searchParams.get(key) || '';
}

function optionLabel(value, t, prefix) {
  if (!value || value === 'all') return t('customer.filters.all');
  const key = `${prefix}.${value}`;
  const translated = t(key);
  if (translated !== key) return translated;
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function uniqueProductValues(products, key) {
  return [...new Set(products.map((product) => product[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
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
  dataAdapter,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const hasSearched = searchParams.get('search') === '1';
  const favoritesOnly = searchParams.get('favorites') === '1';
  const appliedQuery = searchParams.get('q') ?? '';
  const appliedDates = readCatalogueDates(searchParams);
  const filters = useMemo(() => ({
    region: readFilterValue(searchParams, 'region'),
    type: readFilterValue(searchParams, 'type'),
    gender: readFilterValue(searchParams, 'gender'),
    minPrice: readPriceValue(searchParams, 'minPrice'),
    maxPrice: readPriceValue(searchParams, 'maxPrice'),
    sort: readFilterValue(searchParams, 'sort', 'relevance'),
  }), [searchParams]);
  const [draftQuery, setDraftQuery] = useState(appliedQuery);
  const [draftDates, setDraftDates] = useState(appliedDates);
  const [dateError, setDateError] = useState('');
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);
  const [visibleProducts, setVisibleProducts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(RESULT_BATCH_SIZE);
  const [availabilityByProduct, setAvailabilityByProduct] = useState({});
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueError, setCatalogueError] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [favorites] = usePersistentState('cr-v2-favorites', []);
  const sentinelRef = useRef(null);

  const displayedProducts = useMemo(
    () => visibleProducts.slice(0, visibleCount),
    [visibleProducts, visibleCount],
  );
  const hasMoreProducts = visibleCount < visibleProducts.length;
  const regionOptions = useMemo(() => uniqueProductValues(products, 'region'), [products]);
  const typeOptions = useMemo(() => uniqueProductValues(products, 'category'), [products]);
  const activeFilterCount = FILTER_KEYS.reduce((count, key) => {
    if (key === 'favorites') return count + (favoritesOnly ? 1 : 0);
    const value = filters[key];
    if (key === 'sort') return count + (value && value !== 'relevance' ? 1 : 0);
    return count + (value && value !== 'all' ? 1 : 0);
  }, 0);
  const secondaryFilterCount =
    (favoritesOnly ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.gender !== 'all' ? 1 : 0) +
    (filters.sort !== 'relevance' ? 1 : 0);
  const activeFilterSummaries = buildActiveFilterSummaries({
    filters,
    favoritesOnly,
    favoritesCount: favorites.length,
    t,
  });

  useEffect(() => {
    setDraftQuery(appliedQuery);
  }, [appliedQuery]);

  useEffect(() => {
    setDraftDates(appliedDates);
  }, [appliedDates.start, appliedDates.end]);

  useEffect(() => {
    if (hasSearched) return;

    const error = validateDates(appliedDates);
    if (error) return;

    const next = new URLSearchParams(searchParams);
    next.set('start', appliedDates.start);
    next.set('end', appliedDates.end);
    next.set('search', '1');
    setSearchParams(next, { replace: true });
  }, [hasSearched, appliedDates.start, appliedDates.end, searchParams, setSearchParams]);

  useEffect(() => {
    setVisibleCount(RESULT_BATCH_SIZE);
  }, [
    appliedQuery,
    appliedDates.start,
    appliedDates.end,
    filters.region,
    filters.type,
    filters.gender,
    filters.minPrice,
    filters.maxPrice,
    filters.sort,
    favoritesOnly,
  ]);

  useEffect(() => {
    if (!hasSearched) {
      setCatalogueLoading(false);
      setCatalogueError('');
      setVisibleProducts([]);
      setAvailabilityByProduct({});
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setCatalogueLoading(true);
      setCatalogueError('');
      const listPromise = dataAdapter
        ? dataAdapter.catalogue.list({
            q: appliedQuery,
            region: filters.region,
            type: filters.type,
            gender: filters.gender,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            sort: filters.sort,
            start: appliedDates.start,
            end: appliedDates.end,
            page: 1,
            pageSize: 96,
            signal: controller.signal,
          })
        : Promise.resolve({
            items: filterCatalogueProducts({
              products,
              settings,
              query: appliedQuery,
              filters,
              dates: appliedDates,
              rentals,
              t,
            }),
          });

      listPromise
        .then((result) => {
          const favoriteIds = new Set(favorites);
          setVisibleProducts(favoritesOnly ? result.items.filter((product) => favoriteIds.has(product.id)) : result.items);
        })
        .catch((error) => {
          if (error.name === 'AbortError') return;
          setCatalogueError(t('customer.catalogue.loadError'));
          setVisibleProducts([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setCatalogueLoading(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    hasSearched,
    appliedQuery,
    filters.region,
    filters.type,
    filters.gender,
    filters.minPrice,
    filters.maxPrice,
    filters.sort,
    favoritesOnly,
    favorites,
    appliedDates.start,
    appliedDates.end,
    products,
    settings.publicCatalogue,
    rentals,
    t,
  ]);

  useEffect(() => {
    const productIds = displayedProducts.map((product) => product.id);
    if (!hasSearched || !dataAdapter || productIds.length === 0) {
      setAvailabilityByProduct({});
      return undefined;
    }

    const controller = new AbortController();
    dataAdapter.availability
      .batch({
        productIds,
        start: appliedDates.start,
        end: appliedDates.end,
        signal: controller.signal,
      })
      .then((rows) => setAvailabilityByProduct(buildAvailabilityMap(rows)))
      .catch((error) => {
        if (error.name !== 'AbortError') setAvailabilityByProduct({});
      });

    return () => controller.abort();
  }, [hasSearched, displayedProducts, appliedDates.start, appliedDates.end, rentals]);

  useEffect(() => {
    if (!hasMoreProducts) return undefined;
    const node = sentinelRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((current) => Math.min(current + RESULT_BATCH_SIZE, visibleProducts.length));
        }
      },
      { rootMargin: '220px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreProducts, visibleProducts.length]);

  const updateCatalogueParams = (updates, options = { replace: true }) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'all' || (key === 'sort' && value === 'relevance')) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    setSearchParams(next, options);
  };

  const clearFilters = () => {
    updateCatalogueParams({
      region: undefined,
      type: undefined,
      gender: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sort: undefined,
      favorites: undefined,
    }, { replace: false });
    setActiveFilter('');
  };

  const buildDetailTo = (productId) => {
    const next = new URLSearchParams(searchParams);
    next.set('search', '1');
    next.set('start', appliedDates.start);
    next.set('end', appliedDates.end);
    const search = next.toString();
    return { pathname: `/costumes/${productId}`, search: search ? `?${search}` : '' };
  };

  const applySearch = () => {
    const error = validateDates(draftDates);
    setDateError(error ? t(error) : '');
    if (error) return;

    const changed = draftDates.start !== appliedDates.start || draftDates.end !== appliedDates.end;
    updateCatalogueParams({
      q: draftQuery.trim(),
      start: draftDates.start,
      end: draftDates.end,
      search: '1',
    }, { replace: false });
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
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
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
            <button className="primary-button" type="button" onClick={applySearch}>
              <Search aria-hidden="true" />
              {t('customer.search.submit')}
            </button>
          </div>
          <p className="helper-text catalogue-period-help">{t('customer.search.periodHelp')}</p>
          {dateError ? <p className="validation-message">{dateError}</p> : null}
          {catalogueError ? <p className="validation-message">{catalogueError}</p> : null}
          {showSyncPrompt ? (
            <div className="inline-alert warning date-sync-alert">
              <div>
                <strong>{t('customer.date.syncTitle')}</strong>
                <p>{t('customer.date.syncCopy')}</p>
              </div>
              <div className="inline-alert-actions">
                <button className="outline-button" type="button" onClick={() => setShowSyncPrompt(false)}>
                  {t('customer.date.keep')}
                </button>
                <button className="secondary-button" type="button" onClick={syncCartDates}>
                  {t('customer.date.sync')}
                </button>
              </div>
            </div>
          ) : null}

          <div className="catalogue-toolbar">
            <div className="catalogue-filter-board">
              <div className="filter-board-head">
                <div>
                  <span className="eyebrow">
                    {t('customer.toolbar.kicker')}: {formatDateRange(appliedDates, locale)}
                  </span>
                  <h2>{t('customer.toolbar.title')}</h2>
                </div>
                <button
                  className="filter-reset-inline"
                  type="button"
                  onClick={clearFilters}
                  disabled={activeFilterCount === 0}
                >
                  <RotateCcw aria-hidden="true" />
                  {t('customer.filters.clearAll')}
                </button>
              </div>

              <div className="filter-summary-row" aria-live="polite">
                <span className="filter-count-label">
                  <SlidersHorizontal aria-hidden="true" />
                  {activeFilterCount} {t('customer.filters.kicker')}
                </span>
                <div className="filter-summary-chips">
                  {activeFilterSummaries.length > 0 ? (
                    activeFilterSummaries.map((item) => (
                      <span className="filter-summary-chip" key={item.key}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </span>
                    ))
                  ) : (
                    <span className="filter-summary-chip quiet">
                      <Check aria-hidden="true" />
                      {t('customer.filters.all')}
                    </span>
                  )}
                </div>
              </div>

              <div className="filter-control-grid" aria-label={t('customer.filters.aria')}>
                <FilterButton filterKey="region" activeFilter={activeFilter} setActiveFilter={setActiveFilter} label={t('customer.filters.region')} valueLabel={optionLabel(filters.region, t, 'customer.filters.regionOption')} icon={MapPin} isApplied={filters.region !== 'all'} />
                <FilterButton filterKey="type" activeFilter={activeFilter} setActiveFilter={setActiveFilter} label={t('customer.filters.type')} valueLabel={optionLabel(filters.type, t, 'customer.filters.typeOption')} icon={Tags} isApplied={filters.type !== 'all'} />
                <FilterButton filterKey="more" activeFilter={activeFilter} setActiveFilter={setActiveFilter} label={t('customer.filters.kicker')} valueLabel={secondaryFilterCount > 0 ? `${secondaryFilterCount}` : t('customer.filters.all')} icon={SlidersHorizontal} isApplied={secondaryFilterCount > 0} />
              </div>

              <FilterPanel
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                filters={filters}
                t={t}
                favoritesOnly={favoritesOnly}
                favoritesCount={favorites.length}
                regionOptions={regionOptions}
                typeOptions={typeOptions}
                updateCatalogueParams={updateCatalogueParams}
                clearFilters={clearFilters}
              />
            </div>
          </div>

          {!hasSearched ? (
            <EmptyState title={t('customer.catalogue.preSearchTitle')} copy={t('customer.catalogue.preSearchCopy')} icon={SlidersHorizontal} />
          ) : (
            <>
              <div className="catalogue-result-status" aria-live="polite">
                <span>{t('customer.catalogue.resultCount', { count: visibleProducts.length })}</span>
                <strong>{formatDateRange(appliedDates, locale)}</strong>
              </div>
              {catalogueLoading ? <p className="helper-text">{t('customer.catalogue.loading')}</p> : null}
              {!catalogueLoading && visibleProducts.length === 0 ? (
                <EmptyState
                  title={favoritesOnly ? t('customer.favorites.emptyTitle') : t('customer.catalogue.emptyTitle')}
                  copy={favoritesOnly ? t('customer.favorites.emptyCopy') : t('customer.catalogue.emptyCopy')}
                  icon={favoritesOnly ? Heart : Search}
                />
              ) : (
                <>
                  <div className="product-grid" aria-label={t('customer.grid.aria')}>
                    {displayedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        dates={appliedDates}
                        locale={locale}
                        t={t}
                        detailTo={buildDetailTo(product.id)}
                        rentals={rentals}
                        availabilityOverride={availabilityByProduct[product.id]}
                      />
                    ))}
                  </div>
                  {hasMoreProducts ? (
                    <div className="load-more-sentinel" ref={sentinelRef}>
                      <span>{t('customer.catalogue.loadingMore')}</span>
                    </div>
                  ) : null}
                </>
              )}
            </>
          )}
        </div>
      </section>
    </CustomerFrame>
  );
}

function FilterButton({ filterKey, activeFilter, setActiveFilter, label, valueLabel, icon: Icon, isApplied }) {
  const isOpen = activeFilter === filterKey;
  return (
    <button
      className={`filter-control-card ${isOpen ? 'open' : ''} ${isApplied ? 'selected' : ''}`}
      data-filter-key={filterKey}
      type="button"
      aria-expanded={isOpen}
      onClick={() => setActiveFilter(isOpen ? '' : filterKey)}
    >
      <span className="filter-card-icon">
        <Icon aria-hidden="true" />
      </span>
      <span className="filter-card-copy">
        <span>{label}</span>
        <strong>{valueLabel}</strong>
      </span>
      <ChevronDown className="filter-card-chevron" aria-hidden="true" />
    </button>
  );
}

function FilterPanel({
  activeFilter,
  setActiveFilter,
  filters,
  t,
  favoritesOnly,
  favoritesCount,
  regionOptions,
  typeOptions,
  updateCatalogueParams,
  clearFilters,
}) {
  const [priceDraft, setPriceDraft] = useState({ minPrice: filters.minPrice, maxPrice: filters.maxPrice });

  useEffect(() => {
    setPriceDraft({ minPrice: filters.minPrice, maxPrice: filters.maxPrice });
  }, [filters.minPrice, filters.maxPrice, activeFilter]);

  if (!activeFilter) return null;

  const applyValue = (key, value) => {
    updateCatalogueParams({ [key]: value }, { replace: false });
    setActiveFilter('');
  };
  const applyPrice = () => {
    updateCatalogueParams({
      minPrice: priceDraft.minPrice,
      maxPrice: priceDraft.maxPrice,
    }, { replace: false });
    setActiveFilter('');
  };
  const panelTitle = activeFilter === 'more' ? t('customer.filters.kicker') : t(`customer.filters.panel.${activeFilter}`);

  return (
    <>
      <button className="filter-panel-scrim" type="button" aria-label={t('common.close')} onClick={() => setActiveFilter('')} />
      <div className="catalogue-filter-panel" role="dialog" aria-label={panelTitle}>
        <div className="filter-panel-head">
          <div>
            <span className="section-kicker">{t('customer.filters.kicker')}</span>
            <strong>{panelTitle}</strong>
          </div>
          <button className="icon-button" type="button" aria-label={t('common.close')} onClick={() => setActiveFilter('')}>
            <X aria-hidden="true" />
          </button>
        </div>

        {activeFilter === 'region' ? (
          <FilterOptionList
            options={['all', ...regionOptions]}
            selected={filters.region}
            labelFor={(value) => optionLabel(value, t, 'customer.filters.regionOption')}
            onSelect={(value) => applyValue('region', value)}
          />
        ) : null}

        {activeFilter === 'type' ? (
          <FilterOptionList
            options={['all', ...typeOptions]}
            selected={filters.type}
            labelFor={(value) => optionLabel(value, t, 'customer.filters.typeOption')}
            onSelect={(value) => applyValue('type', value)}
          />
        ) : null}

        {activeFilter === 'gender' ? (
          <FilterOptionList
            options={['all', ...GENDER_OPTIONS]}
            selected={filters.gender}
            labelFor={(value) => optionLabel(value, t, 'enum.gender')}
            onSelect={(value) => applyValue('gender', value)}
          />
        ) : null}

        {activeFilter === 'sort' ? (
          <FilterOptionList
            options={SORT_OPTIONS}
            selected={filters.sort}
            labelFor={(value) => t(`customer.sort.${value}`)}
            onSelect={(value) => applyValue('sort', value)}
          />
        ) : null}

        {activeFilter === 'price' ? (
          <PriceFilterFields t={t} priceDraft={priceDraft} setPriceDraft={setPriceDraft} applyPrice={applyPrice} />
        ) : null}

        {activeFilter === 'more' ? (
          <div className="more-filter-stack">
            <button
              className={`more-filter-toggle ${favoritesOnly ? 'selected' : ''}`}
              type="button"
              aria-pressed={favoritesOnly}
              onClick={() => updateCatalogueParams({ favorites: favoritesOnly ? undefined : '1', search: '1' }, { replace: false })}
            >
              <span className="filter-card-icon">
                <Heart aria-hidden="true" fill={favoritesOnly ? 'currentColor' : 'none'} />
              </span>
              <span>
                <strong>{t('customer.filters.favorites')}</strong>
                <small>{favoritesCount}</small>
              </span>
              <span className="filter-card-state" aria-hidden="true" />
            </button>

            <section className="more-filter-section">
              <div className="more-filter-heading">
                <DollarSign aria-hidden="true" />
                <strong>{t('customer.filters.price')}</strong>
              </div>
              <PriceFilterFields t={t} priceDraft={priceDraft} setPriceDraft={setPriceDraft} applyPrice={applyPrice} />
            </section>

            <section className="more-filter-section">
              <div className="more-filter-heading">
                <Users aria-hidden="true" />
                <strong>{t('customer.filters.gender')}</strong>
              </div>
              <FilterOptionList
                options={['all', ...GENDER_OPTIONS]}
                selected={filters.gender}
                labelFor={(value) => optionLabel(value, t, 'enum.gender')}
                onSelect={(value) => applyValue('gender', value)}
              />
            </section>

            <section className="more-filter-section">
              <div className="more-filter-heading">
                <ArrowUpDown aria-hidden="true" />
                <strong>{t('customer.filters.sort')}</strong>
              </div>
              <FilterOptionList
                options={SORT_OPTIONS}
                selected={filters.sort}
                labelFor={(value) => t(`customer.sort.${value}`)}
                onSelect={(value) => applyValue('sort', value)}
              />
            </section>
          </div>
        ) : null}

        <div className="filter-panel-actions">
          <button className="text-button filter-reset-button" type="button" onClick={clearFilters}>
            <RotateCcw aria-hidden="true" />
            {t('customer.filters.clearAll')}
          </button>
        </div>
      </div>
    </>
  );
}

function PriceFilterFields({ t, priceDraft, setPriceDraft, applyPrice }) {
  return (
    <div className="price-filter-fields">
      <Field label={t('customer.filters.minPrice')}>
        <input
          type="number"
          min="0"
          value={priceDraft.minPrice}
          onChange={(event) => setPriceDraft((current) => ({ ...current, minPrice: event.target.value }))}
        />
      </Field>
      <Field label={t('customer.filters.maxPrice')}>
        <input
          type="number"
          min="0"
          value={priceDraft.maxPrice}
          onChange={(event) => setPriceDraft((current) => ({ ...current, maxPrice: event.target.value }))}
        />
      </Field>
      <button className="secondary-button full" type="button" onClick={applyPrice}>
        {t('common.apply')}
      </button>
    </div>
  );
}

function FilterOptionList({ options, selected, labelFor, onSelect }) {
  return (
    <div className="filter-option-list">
      {options.map((value) => {
        const isSelected = selected === value || (!selected && value === 'all');
        return (
          <button className={isSelected ? 'selected' : ''} type="button" key={value} aria-pressed={isSelected} onClick={() => onSelect(value)}>
            <span>{labelFor(value)}</span>
            {isSelected ? <Check aria-hidden="true" /> : null}
          </button>
        );
      })}
    </div>
  );
}

function buildActiveFilterSummaries({ filters, favoritesOnly, favoritesCount, t }) {
  const items = [];
  if (favoritesOnly) items.push({ key: 'favorites', label: t('customer.filters.favorites'), value: favoritesCount });
  if (filters.region && filters.region !== 'all') items.push({ key: 'region', label: t('customer.filters.region'), value: optionLabel(filters.region, t, 'customer.filters.regionOption') });
  if (filters.type && filters.type !== 'all') items.push({ key: 'type', label: t('customer.filters.type'), value: optionLabel(filters.type, t, 'customer.filters.typeOption') });
  if (filters.minPrice || filters.maxPrice) items.push({ key: 'price', label: t('customer.filters.price'), value: priceLabel(filters, t) });
  if (filters.gender && filters.gender !== 'all') items.push({ key: 'gender', label: t('customer.filters.gender'), value: optionLabel(filters.gender, t, 'enum.gender') });
  if (filters.sort && filters.sort !== 'relevance') items.push({ key: 'sort', label: t('customer.filters.sort'), value: t(`customer.sort.${filters.sort}`) });
  return items;
}

function priceLabel(filters, t) {
  if (!filters.minPrice && !filters.maxPrice) return t('customer.filters.all');
  if (filters.minPrice && filters.maxPrice) return t('customer.filters.priceRange', { min: filters.minPrice, max: filters.maxPrice });
  if (filters.minPrice) return t('customer.filters.priceFrom', { min: filters.minPrice });
  return t('customer.filters.priceTo', { max: filters.maxPrice });
}

function filterCatalogueProducts({ products, settings, query, filters, dates, rentals, t }) {
  if (!settings.publicCatalogue) return [];
  const normalized = query.trim().toLowerCase();
  const minPrice = Number(filters.minPrice);
  const maxPrice = Number(filters.maxPrice);
  const hasMinPrice = Number.isFinite(minPrice) && filters.minPrice !== '';
  const hasMaxPrice = Number.isFinite(maxPrice) && filters.maxPrice !== '';
  const filtered = products.filter((product) => {
    const name = productName(product, t).toLowerCase();
    const meta = productMeta(product, t).toLowerCase();
    const searchText = `${name} ${meta} ${product.region} ${product.category} ${product.gender ?? 'unisex'}`;
    const regionMatches = !filters.region || filters.region === 'all' || product.region === filters.region;
    const typeMatches = !filters.type || filters.type === 'all' || product.category === filters.type;
    const genderMatches = !filters.gender || filters.gender === 'all' || (product.gender ?? 'unisex') === filters.gender;
    const minMatches = !hasMinPrice || product.price >= minPrice;
    const maxMatches = !hasMaxPrice || product.price <= maxPrice;
    return product.active && regionMatches && typeMatches && genderMatches && minMatches && maxMatches && (!normalized || searchText.includes(normalized));
  });
  return sortCatalogueProducts(filtered, filters.sort, dates, rentals);
}

function sortCatalogueProducts(products, sort, dates, rentals) {
  const sorted = [...products];
  if (sort === 'price_asc') return sorted.sort((a, b) => a.price - b.price);
  if (sort === 'price_desc') return sorted.sort((a, b) => b.price - a.price);
  if (sort === 'availability') {
    return sorted.sort((a, b) => availabilityRank(getProductAvailability(a, dates, rentals)) - availabilityRank(getProductAvailability(b, dates, rentals)));
  }
  return sorted;
}

function availabilityRank(value) {
  if (value === 'available') return 0;
  if (value === 'partially_booked' || value === 'limited') return 1;
  if (value === 'fully_booked' || value === 'full') return 2;
  return 3;
}

function buildAvailabilityMap(rows) {
  const byProductAndDate = rows.reduce((map, row) => {
    const key = `${row.productId}:${row.date}`;
    const dayRows = map.get(key) ?? [];
    dayRows.push(row);
    map.set(key, dayRows);
    return map;
  }, new Map());

  return [...byProductAndDate.entries()].reduce((result, [key, dayRows]) => {
    const productId = key.split(':')[0];
    const available = dayRows.reduce((sum, row) => sum + row.available, 0);
    const booked = dayRows.reduce((sum, row) => sum + row.booked, 0);
    const dayState = dayRows.every((row) => row.state === 'unavailable')
      ? 'unavailable'
      : available <= 0
        ? 'fully_booked'
        : booked > 0
          ? 'partially_booked'
          : 'available';

    if (!result[productId]) {
      result[productId] = dayState;
    } else if (dayState === 'unavailable') {
      result[productId] = 'unavailable';
    } else if (dayState === 'fully_booked' && result[productId] !== 'unavailable') {
      result[productId] = 'fully_booked';
    } else if (dayState === 'partially_booked' && result[productId] === 'available') {
      result[productId] = 'partially_booked';
    }
    return result;
  }, {});
}
