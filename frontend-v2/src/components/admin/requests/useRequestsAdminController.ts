import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { defaultDates } from '../../../mockData';
import {
  activityText,
  appendActivity,
  applyItemHoldDelta,
  getVariantAvailability,
  hasRentalChanged,
  shouldReleaseHold,
} from '../../../lib/rental-utils';
import { resetMobileDetailScroll } from '../../../lib/mobile-detail';
import type { StateSetter } from '../../../types/app';
import type { DataAdapter, FulfillmentMethod, Product, Rental, TFunction } from '../../../types/domain';
import type { RentalActivity, RentalUpdater, UpdateRental } from '../rentals/rentalWorkflowTypes';
import type {
  NewRequestDraft,
  RequestFulfillmentFilter,
  RequestPaymentFilter,
  RequestSortMode,
  RequestTab,
} from './requestTypes';

export const requestTabs: RequestTab[] = ['all', 'stale', 'delivery'];
export const fulfillmentFilters: RequestFulfillmentFilter[] = ['all', 'pickup', 'delivery'];
export const paymentFilters: RequestPaymentFilter[] = ['all', 'missing', 'attached', 'verified', 'rejected'];
export const sortModes: RequestSortMode[] = ['stale', 'newest', 'date'];

type UseRequestsAdminControllerParams = {
  t: TFunction;
  rentals: Rental[];
  setRentals: StateSetter<Rental[]>;
  setProducts: StateSetter<Product[]>;
  products: Product[];
  dataAdapter: DataAdapter;
};

type SearchParamUpdates = Record<string, string>;

export function useRequestsAdminController({
  t,
  rentals,
  setRentals,
  setProducts,
  products,
  dataAdapter,
}: UseRequestsAdminControllerParams) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab: RequestTab = isRequestTab(tabParam) ? tabParam : 'all';
  const [tab, setTab] = useState<RequestTab>(initialTab);
  const [selectedRef, setSelectedRef] = useState<string | undefined>(searchParams.get('reference') ?? rentals.find((rental) => rental.lifecycle === 'requested')?.reference);
  const [filtersOpen, setFiltersOpen] = useState(Boolean(searchParams.get('q') || searchParams.get('fulfillment') || searchParams.get('payment')));
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(Boolean(searchParams.get('reference')));
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const fulfillmentParam = searchParams.get('fulfillment');
  const paymentParam = searchParams.get('payment');
  const sortParam = searchParams.get('sort');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<RequestFulfillmentFilter>(isFulfillmentFilter(fulfillmentParam) ? fulfillmentParam : 'all');
  const [paymentFilter, setPaymentFilter] = useState<RequestPaymentFilter>(isPaymentFilter(paymentParam) ? paymentParam : 'all');
  const [sortMode, setSortMode] = useState<RequestSortMode>(isSortMode(sortParam) ? sortParam : 'stale');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addError, setAddError] = useState('');
  const [newRequest, setNewRequest] = useState<NewRequestDraft>(() => makeBlankRequest(products));
  const rentalsRef = useRef<Rental[]>(rentals);

  const requestCounts = useMemo(() => {
    const requested = rentals.filter((rental) => rental.lifecycle === 'requested');
    return {
      all: requested.length,
      stale: requested.filter((rental) => rental.staleHours >= 24).length,
      delivery: requested.filter((rental) => rental.fulfillment === 'delivery').length,
    };
  }, [rentals]);
  const baseFiltered = rentals.filter((rental) => {
    if (tab === 'stale') return rental.lifecycle === 'requested' && rental.staleHours >= 24;
    if (tab === 'delivery') return rental.lifecycle === 'requested' && rental.fulfillment === 'delivery';
    return rental.lifecycle === 'requested';
  });
  const filtered = baseFiltered
    .filter((rental) => {
      const normalized = query.trim().toLowerCase();
      const matchesQuery =
        !normalized ||
        rental.reference.toLowerCase().includes(normalized) ||
        rental.customerName.toLowerCase().includes(normalized) ||
        rental.phone.toLowerCase().includes(normalized);
      const matchesFulfillment = fulfillmentFilter === 'all' || rental.fulfillment === fulfillmentFilter;
      const matchesPayment = paymentFilter === 'all' || rental.paymentStatus === paymentFilter;
      return matchesQuery && matchesFulfillment && matchesPayment;
    })
    .sort((a, b) => sortRequests(a, b, sortMode));
  const selected = filtered.find((rental) => rental.reference === selectedRef) ?? filtered[0];
  const canMutateRequest = selected?.lifecycle === 'requested';
  const selectedRequestProduct = products.find((product) => product.id === newRequest.productId) ?? products[0];
  const selectedRequestVariant = selectedRequestProduct?.variants.find((variant) => variant.id === newRequest.variantId) ?? selectedRequestProduct?.variants[0];

  useEffect(() => {
    rentalsRef.current = rentals;
  }, [rentals]);

  useEffect(() => {
    if (isDetailViewOpen) resetMobileDetailScroll();
  }, [isDetailViewOpen, selected?.reference]);

  const updateParams = (updates: SearchParamUpdates, options: { replace?: boolean } = { replace: true }) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'all') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    setSearchParams(next, options);
  };

  const handleTabChange = (value: string) => {
    if (!isRequestTab(value)) return;
    setTab(value);
    setIsDetailViewOpen(false);
    updateParams({ tab: value, reference: '' });
  };

  const applyFilters = () => {
    setIsDetailViewOpen(false);
    setFiltersOpen(false);
    updateParams({
      q: query.trim(),
      fulfillment: fulfillmentFilter,
      payment: paymentFilter,
      sort: sortMode,
      reference: '',
    });
  };

  const clearFilters = () => {
    setQuery('');
    setFulfillmentFilter('all');
    setPaymentFilter('all');
    setIsDetailViewOpen(false);
    setFiltersOpen(false);
    updateParams({ q: '', fulfillment: '', payment: '', reference: '' });
  };

  const selectRequest = (reference: string | undefined, { openDetail = true }: { openDetail?: boolean } = {}) => {
    if (!reference) return;
    setSelectedRef(reference);
    if (openDetail) setIsDetailViewOpen(true);
    const next = new URLSearchParams(searchParams);
    next.set('reference', reference);
    setSearchParams(next, { replace: true });
  };

  const closeDetailView = () => {
    setIsDetailViewOpen(false);
    const next = new URLSearchParams(searchParams);
    next.delete('reference');
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const targetTab = searchParams.get('tab');
    const targetReference = searchParams.get('reference');
    const targetFulfillment = searchParams.get('fulfillment');
    const targetPayment = searchParams.get('payment');
    const targetSort = searchParams.get('sort');
    if (isRequestTab(targetTab) && targetTab !== tab) setTab(targetTab);
    if (targetReference && targetReference !== selectedRef) setSelectedRef(targetReference);
    setIsDetailViewOpen(Boolean(targetReference));
    setQuery(searchParams.get('q') ?? '');
    setFulfillmentFilter(isFulfillmentFilter(targetFulfillment) ? targetFulfillment : 'all');
    setPaymentFilter(isPaymentFilter(targetPayment) ? targetPayment : 'all');
    setSortMode(isSortMode(targetSort) ? targetSort : 'stale');
  }, [searchParams, selectedRef, tab]);

  useEffect(() => {
    if (filtered.length > 0 && !filtered.some((rental) => rental.reference === selectedRef)) {
      setSelectedRef(filtered[0].reference);
    }
  }, [filtered, selectedRef]);

  useEffect(() => {
    if (products.length === 0) return;
    setNewRequest((current) => {
      const product = products.find((entry) => entry.id === current.productId) ?? products[0];
      const variantExists = product.variants.some((variant) => variant.id === current.variantId);
      if (current.productId === product.id && variantExists) return current;
      return { ...current, productId: product.id, variantId: product.variants[0]?.id ?? '' };
    });
  }, [products]);

  const updateRental: UpdateRental = (reference: string, updater: RentalUpdater, activity?: RentalActivity) => {
    const currentRentals = rentalsRef.current;
    const existing = currentRentals.find((rental) => rental.reference === reference);
    if (!existing) return;

    const next: Rental = typeof updater === 'function' ? updater(existing) : { ...existing, ...updater };
    if (!hasRentalChanged(existing, next)) return;

    const nextRental = activity ? appendActivity(next, activity) : next;
    const nextRentals = currentRentals.map((rental) => (rental.reference === reference ? nextRental : rental));
    rentalsRef.current = nextRentals;
    setRentals(nextRentals);
  };

  const rejectSelected = (reason: string) => {
    if (!selected) return;
    if (shouldReleaseHold(selected.lifecycle, 'rejected')) {
      setProducts((current) => applyItemHoldDelta(current, selected.items, -1));
    }
    updateRental(selected.reference, { lifecycle: 'rejected', internalNotes: reason }, activityText(`Ditolak: ${reason}`, `Rejected: ${reason}`));
    setSelectedRef('');
    closeDetailView();
  };

  const acceptRequest = (rental: Rental) => {
    if (!rental) return;
    updateRental(rental.reference, { lifecycle: 'confirmed' }, activityText('Pesanan diterima staf.', 'Order accepted by staff.'));
    if (selectedRef === rental.reference || isDetailViewOpen) {
      setSelectedRef('');
      closeDetailView();
    }
  };

  const editRequest = (rental: Rental) => {
    selectRequest(rental.reference);
    setEditOpen(true);
  };

  const rejectRequest = (rental: Rental) => {
    selectRequest(rental.reference);
    setRejectOpen(true);
  };

  const updateNewRequest = (updates: Partial<NewRequestDraft>) => {
    setAddError('');
    setNewRequest((current) => ({ ...current, ...updates }));
  };

  const handleNewRequestProduct = (productId: string) => {
    const product = products.find((entry) => entry.id === productId);
    updateNewRequest({ productId, variantId: product?.variants[0]?.id ?? '' });
  };

  const createRequest = async () => {
    if (!selectedRequestProduct || !selectedRequestVariant) {
      setAddError(t('admin.requests.itemRequired'));
      return;
    }
    if (!newRequest.customerName.trim() || !newRequest.phone.trim()) {
      setAddError(t('admin.requests.requiredCustomer'));
      return;
    }
    if (!newRequest.start || !newRequest.end || newRequest.end < newRequest.start) {
      setAddError(t('admin.requests.invalidDates'));
      return;
    }

    const qty = Math.max(1, Number(newRequest.qty) || 1);
    const available = getVariantAvailability(selectedRequestProduct, selectedRequestVariant.id, { start: newRequest.start, end: newRequest.end }, rentals);
    if (available < qty) {
      setAddError(t('admin.requests.stockLimited'));
      return;
    }

    const result = await dataAdapter.requests.create({
      source: 'staff',
      values: {
        name: newRequest.customerName.trim(),
        phone: newRequest.phone.trim(),
        email: newRequest.email.trim(),
        fulfillment: newRequest.fulfillment,
        pickupWindow: newRequest.fulfillment === 'pickup' ? '10.00-12.00' : '',
        returnWindow: '16.00-18.00',
        deliveryWindow: newRequest.fulfillment === 'delivery' ? '09.00-11.00' : '',
        address: '',
        notes: newRequest.notes.trim(),
      },
      cart: [
        {
          productId: selectedRequestProduct.id,
          variantId: selectedRequestVariant.id,
          qty,
          start: newRequest.start,
          end: newRequest.end,
        },
      ],
    });

    if (result?.error) {
      setAddError(result.error);
      return;
    }

    if (result?.rental) {
      setTab('all');
      setQuery('');
      setFulfillmentFilter('all');
      setPaymentFilter('all');
      setSelectedRef(result.rental.reference);
      setIsDetailViewOpen(true);
      setAddOpen(false);
      setAddError('');
      setNewRequest(makeBlankRequest(products));
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'all');
      next.set('reference', result.rental.reference);
      next.delete('q');
      next.delete('fulfillment');
      next.delete('payment');
      setSearchParams(next, { replace: true });
    }
  };

  const closeAddPanel = () => {
    setAddOpen(false);
    setAddError('');
  };

  return {
    tab,
    requestCounts,
    selected,
    canMutateRequest,
    selectedRequestProduct,
    filtered,
    filtersOpen,
    setFiltersOpen,
    isDetailViewOpen,
    query,
    setQuery,
    fulfillmentFilter,
    setFulfillmentFilter,
    paymentFilter,
    setPaymentFilter,
    sortMode,
    setSortMode,
    rejectOpen,
    setRejectOpen,
    editOpen,
    setEditOpen,
    addOpen,
    setAddOpen,
    addError,
    newRequest,
    handleTabChange,
    applyFilters,
    clearFilters,
    selectRequest,
    closeDetailView,
    updateRental,
    rejectSelected,
    acceptRequest,
    editRequest,
    rejectRequest,
    updateNewRequest,
    handleNewRequestProduct,
    createRequest,
    closeAddPanel,
  };
}

function makeBlankRequest(products: Product[]): NewRequestDraft {
  const firstProduct = products[0];
  return {
    customerName: '',
    phone: '',
    email: '',
    start: defaultDates.start,
    end: defaultDates.end,
    fulfillment: 'pickup' as FulfillmentMethod,
    productId: firstProduct?.id ?? '',
    variantId: firstProduct?.variants[0]?.id ?? '',
    qty: 1,
    notes: '',
  };
}

function sortRequests(a: Rental, b: Rental, sortMode: RequestSortMode): number {
  if (sortMode === 'date') return a.start.localeCompare(b.start) || b.reference.localeCompare(a.reference);
  if (sortMode === 'newest') return b.reference.localeCompare(a.reference);
  return b.staleHours - a.staleHours || b.reference.localeCompare(a.reference);
}

function isRequestTab(value: string | null): value is RequestTab {
  return requestTabs.includes(value as RequestTab);
}

function isFulfillmentFilter(value: string | null): value is RequestFulfillmentFilter {
  return fulfillmentFilters.includes(value as RequestFulfillmentFilter);
}

function isPaymentFilter(value: string | null): value is RequestPaymentFilter {
  return paymentFilters.includes(value as RequestPaymentFilter);
}

function isSortMode(value: string | null): value is RequestSortMode {
  return sortModes.includes(value as RequestSortMode);
}
