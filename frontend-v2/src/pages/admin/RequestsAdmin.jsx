import * as Tabs from '@radix-ui/react-tabs';
import { AlertTriangle, ListFilter } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminCreateAction, AdminCreateFab, AdminViewBar } from '../../components/admin/common/AdminManagement.jsx';
import { EditRentalDialog, RejectDialog } from '../../components/admin/rentals/RentalDialogs.jsx';
import { RentalItems } from '../../components/admin/rentals/RentalRecordComponents.jsx';
import { RequestMobileDetail } from '../../components/admin/requests/RequestsView.jsx';
import { RequestCreatePanel, RequestFilterSheet, RequestRecordsLayout } from '../../components/admin/requests/RequestManagement.jsx';
import { StatusPill } from '../../components/shared.jsx';
import { defaultDates } from '../../mockData.js';
import {
  activityText,
  appendActivity,
  applyItemHoldDelta,
  getVariantAvailability,
  hasRentalChanged,
  shouldReleaseHold,
} from '../../lib/rental-utils.js';
import { resetMobileDetailScroll } from '../../lib/mobile-detail.js';

const requestTabs = ['all', 'stale', 'delivery'];
const fulfillmentFilters = ['all', 'pickup', 'delivery'];
const paymentFilters = ['all', 'missing', 'attached', 'verified', 'rejected'];
const sortModes = ['stale', 'newest', 'date'];

export default function RequestsAdmin({ t, locale, rentals, setRentals, setProducts, products, dataAdapter }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = requestTabs.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'all';
  const [tab, setTab] = useState(initialTab);
  const [selectedRef, setSelectedRef] = useState(searchParams.get('reference') ?? rentals.find((rental) => rental.lifecycle === 'requested')?.reference);
  const [filtersOpen, setFiltersOpen] = useState(Boolean(searchParams.get('q') || searchParams.get('fulfillment') || searchParams.get('payment')));
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(Boolean(searchParams.get('reference')));
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [fulfillmentFilter, setFulfillmentFilter] = useState(fulfillmentFilters.includes(searchParams.get('fulfillment')) ? searchParams.get('fulfillment') : 'all');
  const [paymentFilter, setPaymentFilter] = useState(paymentFilters.includes(searchParams.get('payment')) ? searchParams.get('payment') : 'all');
  const [sortMode, setSortMode] = useState(sortModes.includes(searchParams.get('sort')) ? searchParams.get('sort') : 'stale');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addError, setAddError] = useState('');
  const [newRequest, setNewRequest] = useState(() => makeBlankRequest(products));
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
  const rentalsRef = useRef(rentals);

  useEffect(() => {
    rentalsRef.current = rentals;
  }, [rentals]);

  useEffect(() => {
    if (isDetailViewOpen) resetMobileDetailScroll();
  }, [isDetailViewOpen, selected?.reference]);

  const updateParams = (updates, options = { replace: true }) => {
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

  const handleTabChange = (value) => {
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

  const selectRequest = (reference, { openDetail = true } = {}) => {
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
    if (requestTabs.includes(targetTab) && targetTab !== tab) setTab(targetTab);
    if (targetReference && targetReference !== selectedRef) setSelectedRef(targetReference);
    setIsDetailViewOpen(Boolean(targetReference));
    setQuery(searchParams.get('q') ?? '');
    setFulfillmentFilter(fulfillmentFilters.includes(targetFulfillment) ? targetFulfillment : 'all');
    setPaymentFilter(paymentFilters.includes(targetPayment) ? targetPayment : 'all');
    setSortMode(sortModes.includes(targetSort) ? targetSort : 'stale');
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

  const updateRental = (reference, updater, activity) => {
    const currentRentals = rentalsRef.current;
    const existing = currentRentals.find((rental) => rental.reference === reference);
    if (!existing) return;

    const next = typeof updater === 'function' ? updater(existing) : { ...existing, ...updater };
    if (!hasRentalChanged(existing, next)) return;

    const nextRental = activity ? appendActivity(next, activity) : next;
    const nextRentals = currentRentals.map((rental) => (rental.reference === reference ? nextRental : rental));
    rentalsRef.current = nextRentals;
    setRentals(nextRentals);
  };

  const rejectSelected = (reason) => {
    if (!selected) return;
    if (shouldReleaseHold(selected.lifecycle, 'rejected')) {
      setProducts((current) => applyItemHoldDelta(current, selected.items, -1));
    }
    updateRental(selected.reference, { lifecycle: 'rejected', internalNotes: reason }, activityText(`Ditolak: ${reason}`, `Rejected: ${reason}`));
    setSelectedRef('');
    closeDetailView();
  };

  const acceptRequest = (rental) => {
    if (!rental) return;
    updateRental(rental.reference, { lifecycle: 'confirmed' }, activityText('Pesanan diterima staf.', 'Order accepted by staff.'));
    if (selectedRef === rental.reference || isDetailViewOpen) {
      setSelectedRef('');
      closeDetailView();
    }
  };

  const editRequest = (rental) => {
    selectRequest(rental.reference);
    setEditOpen(true);
  };

  const rejectRequest = (rental) => {
    selectRequest(rental.reference);
    setRejectOpen(true);
  };

  const updateNewRequest = (updates) => {
    setAddError('');
    setNewRequest((current) => ({ ...current, ...updates }));
  };

  const handleNewRequestProduct = (productId) => {
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

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: t('admin.table.reference'),
        cell: ({ row }) => (
          <div>
            <strong>{row.original.reference}</strong>
            {row.original.staleHours >= 24 ? (
              <small className="stale-marker">
                <AlertTriangle aria-hidden="true" />
                {t('admin.record.staleAge')}
              </small>
            ) : (
              <small>{t('admin.record.newAge')}</small>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'customerName',
        header: t('admin.table.customer'),
        cell: ({ row }) => (
          <div>
            <strong>{row.original.customerName}</strong>
            <small>{row.original.phone}</small>
          </div>
        ),
      },
      {
        id: 'items',
        header: t('admin.table.item'),
        cell: ({ row }) => <RentalItems rental={row.original} products={products} t={t} compact />,
      },
      {
        id: 'status',
        header: t('common.status'),
        cell: ({ row }) => (
          <div className="table-status-stack">
            <StatusPill type="fulfillment" value={row.original.fulfillment} t={t} />
            <StatusPill type="lifecycle" value={row.original.lifecycle} t={t} />
            <StatusPill type="payment" value={row.original.paymentStatus} t={t} />
          </div>
        ),
      },
    ],
    [products, t],
  );

  return (
    <section className={`base-window requests-window ${isDetailViewOpen ? 'detail-open' : ''}`}>
      <div className="request-list-view">
      <Tabs.Root value={tab} onValueChange={handleTabChange}>
        <AdminViewBar>
          <Tabs.List className="view-tabs request-tabs" aria-label={t('admin.tabs.aria')}>
            {requestTabs.map((value) => (
              <Tabs.Trigger className="tab-trigger" value={value} key={value}>
                <span>{value === 'all' ? t('admin.tabs.all') : t(`admin.requests.${value}`)}</span>
                <strong className="tab-count">{requestCounts[value]}</strong>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <div className="view-actions">
            <AdminCreateAction
              label={t('admin.requests.add')}
              open={addOpen}
              controls="request-add-panel"
              onToggle={() => setAddOpen((open) => !open)}
            />
            <div className="view-tools">
              <button
                type="button"
                className={filtersOpen ? 'selected' : ''}
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <ListFilter aria-hidden="true" />
                {t('admin.tools.filterSort')}
              </button>
            </div>
          </div>
        </AdminViewBar>
        <RequestFilterSheet
          open={filtersOpen}
          setOpen={setFiltersOpen}
          t={t}
          query={query}
          setQuery={setQuery}
          fulfillmentFilter={fulfillmentFilter}
          setFulfillmentFilter={setFulfillmentFilter}
          fulfillmentFilters={fulfillmentFilters}
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
          paymentFilters={paymentFilters}
          sortMode={sortMode}
          setSortMode={setSortMode}
          sortModes={sortModes}
          applyFilters={applyFilters}
          clearFilters={clearFilters}
        />
      </Tabs.Root>

      <AdminCreateFab
        label={t('admin.requests.add')}
        open={addOpen}
        controls="request-add-panel"
        onToggle={() => setAddOpen((open) => !open)}
      />

      {addOpen ? (
        <RequestCreatePanel
          t={t}
          products={products}
          newRequest={newRequest}
          updateNewRequest={updateNewRequest}
          selectedRequestProduct={selectedRequestProduct}
          handleNewRequestProduct={handleNewRequestProduct}
          addError={addError}
          createRequest={createRequest}
          onClose={closeAddPanel}
        />
      ) : null}

      <RequestRecordsLayout
        rentals={filtered}
        selected={selected}
        columns={columns}
        products={products}
        t={t}
        locale={locale}
        canMutateRequest={canMutateRequest}
        onSelect={selectRequest}
        onAccept={acceptRequest}
        onEdit={editRequest}
        onReject={rejectRequest}
      />
      </div>

      {selected ? (
        <RequestMobileDetail
          rental={selected}
          products={products}
          t={t}
          locale={locale}
          canMutate={canMutateRequest}
          onBack={closeDetailView}
          onAccept={acceptRequest}
          onEdit={editRequest}
          onReject={rejectRequest}
        />
      ) : null}

      <RejectDialog open={rejectOpen} setOpen={setRejectOpen} t={t} onReject={rejectSelected} />
      <EditRentalDialog open={editOpen} setOpen={setEditOpen} rental={selected} t={t} onSave={(values) => updateRental(selected.reference, values, activityText('Pesanan diubah staf.', 'Order edited by staff.'))} />
    </section>
  );
}

function makeBlankRequest(products) {
  const firstProduct = products[0];
  return {
    customerName: '',
    phone: '',
    email: '',
    start: defaultDates.start,
    end: defaultDates.end,
    fulfillment: 'pickup',
    productId: firstProduct?.id ?? '',
    variantId: firstProduct?.variants[0]?.id ?? '',
    qty: 1,
    notes: '',
  };
}

function sortRequests(a, b, sortMode) {
  if (sortMode === 'date') return a.start.localeCompare(b.start) || b.reference.localeCompare(a.reference);
  if (sortMode === 'newest') return b.reference.localeCompare(a.reference);
  return b.staleHours - a.staleHours || b.reference.localeCompare(a.reference);
}
