import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, type NavigateOptions, type To } from 'react-router-dom';
import { usePersistentState } from '../../../hooks/usePersistentState';
import {
  buildActiveFilterSummaries,
  buildAvailabilityMap,
  emptyFavorites,
  FILTER_KEYS,
  filterCatalogueProducts,
  readCatalogueDates,
  readFilterValue,
  readPriceValue,
  RESULT_BATCH_SIZE,
  uniqueProductValues,
  type AvailabilityByProduct,
  type CatalogueFilters,
  type CatalogueParamUpdates,
} from './catalogueControllerUtils';
import {
  formatDateRange,
  getVariantAvailability,
  validateDates,
} from '../../../lib/rental-utils';
import type {
  AvailabilityRow,
  CartItem,
  DataAdapter,
  DateRange,
  Locale,
  Product,
  Rental,
  Settings,
  TFunction,
} from '../../../types/domain';
import type { StateSetter } from '../../../types/app';

type UseCustomerCatalogueControllerParams = {
  locale: Locale;
  t: TFunction;
  products: Product[];
  rentals: Rental[];
  settings: Settings;
  cart: CartItem[];
  setCart: StateSetter<CartItem[]>;
  dataAdapter?: DataAdapter;
};

export function useCustomerCatalogueController({
  locale,
  t,
  products,
  rentals,
  settings,
  cart,
  setCart,
  dataAdapter,
}: UseCustomerCatalogueControllerParams) {
  const [searchParams, setSearchParams] = useSearchParams();
  const hasSearched = searchParams.get('search') === '1';
  const favoritesOnly = searchParams.get('favorites') === '1';
  const appliedQuery = searchParams.get('q') ?? '';
  const appliedDates = readCatalogueDates(searchParams);
  const filters = useMemo<CatalogueFilters>(() => ({
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
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [visibleCount, setVisibleCount] = useState(RESULT_BATCH_SIZE);
  const [availabilityByProduct, setAvailabilityByProduct] = useState<AvailabilityByProduct>({});
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueError, setCatalogueError] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [favorites] = usePersistentState('cr-v2-favorites', emptyFavorites);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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
  const activeFilterSummaries = useMemo(
    () => buildActiveFilterSummaries({
      filters,
      favoritesOnly,
      favoritesCount: favorites.length,
      t,
    }),
    [favorites.length, favoritesOnly, filters, t],
  );
  const periodLabel = useMemo(() => formatDateRange(appliedDates, locale), [appliedDates, locale]);

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
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
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
    settings,
    rentals,
    t,
    dataAdapter,
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
      .then((rows: AvailabilityRow[]) => setAvailabilityByProduct(buildAvailabilityMap(rows)))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException) || error.name !== 'AbortError') setAvailabilityByProduct({});
      });

    return () => controller.abort();
  }, [hasSearched, displayedProducts, appliedDates.start, appliedDates.end, dataAdapter]);

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

  const updateCatalogueParams = useCallback((updates: CatalogueParamUpdates, options: NavigateOptions = { replace: true }) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'all' || (key === 'sort' && value === 'relevance')) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    setSearchParams(next, options);
  }, [searchParams, setSearchParams]);

  const clearFilters = useCallback(() => {
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
  }, [updateCatalogueParams]);

  const buildDetailTo = useCallback((productId: string): To => {
    const next = new URLSearchParams(searchParams);
    next.set('search', '1');
    next.set('start', appliedDates.start);
    next.set('end', appliedDates.end);
    const search = next.toString();
    return { pathname: `/costumes/${productId}`, search: search ? `?${search}` : '' };
  }, [appliedDates.end, appliedDates.start, searchParams]);

  const applySearch = useCallback(() => {
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
  }, [appliedDates.end, appliedDates.start, cart.length, draftDates, draftQuery, t, updateCatalogueParams]);

  const syncCartDates = useCallback(() => {
    setCart((current) =>
      current.map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        const available = product ? getVariantAvailability(product, item.variantId, draftDates, rentals) : 0;
        return available >= item.qty ? { ...item, start: draftDates.start, end: draftDates.end } : item;
      }),
    );
    setShowSyncPrompt(false);
  }, [draftDates, products, rentals, setCart]);

  return {
    activeFilter,
    activeFilterCount,
    activeFilterSummaries,
    appliedDates,
    applySearch,
    availabilityByProduct,
    buildDetailTo,
    catalogueError,
    catalogueLoading,
    clearFilters,
    displayedProducts,
    draftDates,
    draftQuery,
    favorites,
    favoritesOnly,
    filters,
    hasMoreProducts,
    hasSearched,
    periodLabel,
    regionOptions,
    secondaryFilterCount,
    sentinelRef,
    setActiveFilter,
    setDraftDates,
    setDraftQuery,
    setShowSyncPrompt,
    showSyncPrompt,
    syncCartDates,
    typeOptions,
    updateCatalogueParams,
    visibleProducts,
    dateError,
  };
}
