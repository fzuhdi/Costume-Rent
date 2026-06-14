import { AlertTriangle, CalendarDays, Search, UserRound, X } from 'lucide-react';
import AdminBottomSheet, { AdminSheetHeader } from '../common/AdminBottomSheet';
import { AdminCreatePanel } from '../common/AdminManagement';
import { RequestMobileCards, RequestReviewPanel } from './RequestsView';
import { EmptyState, Field, PhoneField, SearchInput, SelectField, StatusPill } from '../../shared';
import { formatDateRange, productName, variantLabel } from '../../../lib/rental-utils';
import type { StateSetter } from '../../../types/app';
import type { Locale, Product, Rental, TFunction } from '../../../types/domain';
import type {
  RequestActiveFilter,
  RequestActiveFilterKey,
  NewRequestDraft,
  RequestFulfillmentFilter,
  RequestPaymentFilter,
  RequestSortMode,
} from './requestTypes';

type RequestFilterSheetProps = {
  open: boolean;
  setOpen: StateSetter<boolean>;
  t: TFunction;
  query: string;
  setQuery: StateSetter<string>;
  fulfillmentFilter: RequestFulfillmentFilter;
  setFulfillmentFilter: StateSetter<RequestFulfillmentFilter>;
  fulfillmentFilters: RequestFulfillmentFilter[];
  paymentFilter: RequestPaymentFilter;
  setPaymentFilter: StateSetter<RequestPaymentFilter>;
  paymentFilters: RequestPaymentFilter[];
  sortMode: RequestSortMode;
  setSortMode: StateSetter<RequestSortMode>;
  sortModes: RequestSortMode[];
  applyFilters: () => void;
  clearFilters: () => void;
};

export function RequestFilterSheet({
  open,
  setOpen,
  t,
  query,
  setQuery,
  fulfillmentFilter,
  setFulfillmentFilter,
  fulfillmentFilters,
  paymentFilter,
  setPaymentFilter,
  paymentFilters,
  sortMode,
  setSortMode,
  sortModes,
  applyFilters,
  clearFilters,
}: RequestFilterSheetProps) {
  return (
    <AdminBottomSheet
      as="div"
      open={open}
      onClose={() => setOpen(false)}
      className="filter-panel request-filter-sheet"
      backdropClassName="request-filter-backdrop"
      ariaLabel={t('admin.requests.filtersAria')}
      closeLabel={t('common.close')}
    >
      <AdminSheetHeader
        kicker={t('admin.tools.filterSort')}
        title={t('admin.requests.filtersTitle')}
        closeLabel={t('common.close')}
        onClose={() => setOpen(false)}
      />
      <Field label={t('admin.requests.filterSearch')}>
        <SearchInput
          as="span"
          value={query}
          onChange={setQuery}
          placeholder={t('admin.requests.filterSearchPlaceholder')}
          clearLabel={t('common.clear')}
        />
      </Field>
      <SelectField
        label={t('admin.table.fulfillment')}
        value={fulfillmentFilter}
        onValueChange={(value) => setFulfillmentFilter(value as RequestFulfillmentFilter)}
        options={fulfillmentFilters.map((value) => ({
          value,
          label: value === 'all' ? t('admin.requests.filterAllFulfillment') : t(`enum.fulfillment.${value}`),
        }))}
      />
      <SelectField
        label={t('admin.table.payment')}
        value={paymentFilter}
        onValueChange={(value) => setPaymentFilter(value as RequestPaymentFilter)}
        options={paymentFilters.map((value) => ({
          value,
          label: value === 'all' ? t('admin.requests.filterAllPayment') : t(`enum.payment.${value}`),
        }))}
      />
      <SelectField
        label={t('admin.tools.sort')}
        value={sortMode}
        onValueChange={(value) => setSortMode(value as RequestSortMode)}
        options={sortModes.map((mode) => ({
          value: mode,
          label: t(`admin.tools.sort.${mode}`),
        }))}
      />
      <div className="filter-actions">
        <button className="secondary-button" type="button" onClick={applyFilters}>
          {t('common.apply')}
        </button>
        <button className="outline-button" type="button" onClick={clearFilters}>
          <X aria-hidden="true" />
          {t('common.clear')}
        </button>
      </div>
    </AdminBottomSheet>
  );
}

type RequestActiveFilterChipsProps = {
  filters: RequestActiveFilter[];
  t: TFunction;
  onClearFilter: (key: RequestActiveFilterKey) => void;
  onClearAll: () => void;
};

export function RequestActiveFilterChips({ filters, t, onClearFilter, onClearAll }: RequestActiveFilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="request-active-filters" aria-label={t('admin.requests.activeFilters')}>
      <span className="request-active-filters-label">{t('admin.requests.activeFilters')}</span>
      <div className="request-active-filter-list">
        {filters.map((filter) => (
          <button
            className="filter-chip active request-filter-chip"
            type="button"
            aria-label={`${t('admin.requests.clearFilter')} ${filter.label}`}
            onClick={() => onClearFilter(filter.key)}
            key={filter.key}
          >
            <span>
              <strong>{filter.label}</strong>
              {filter.value}
            </span>
            <X aria-hidden="true" />
          </button>
        ))}
        {filters.length > 1 ? (
          <button className="outline-button request-clear-filters" type="button" onClick={onClearAll}>
            <X aria-hidden="true" />
            {t('common.clear')}
          </button>
        ) : null}
      </div>
    </div>
  );
}

type RequestCreatePanelProps = {
  t: TFunction;
  products: Product[];
  newRequest: NewRequestDraft;
  updateNewRequest: (updates: Partial<NewRequestDraft>) => void;
  selectedRequestProduct?: Product;
  handleNewRequestProduct: (productId: string) => void;
  addError: string;
  createRequest: () => void;
  onClose: () => void;
};

export function RequestCreatePanel({
  t,
  products,
  newRequest,
  updateNewRequest,
  selectedRequestProduct,
  handleNewRequestProduct,
  addError,
  createRequest,
  onClose,
}: RequestCreatePanelProps) {
  return (
    <AdminCreatePanel
      id="request-add-panel"
      className="request-add-panel"
      kicker={t('admin.requests.add')}
      title={t('admin.requests.addHelp')}
      closeLabel={t('common.close')}
      onClose={onClose}
    >
      <div className="form-grid">
        <Field label={t('common.name')}>
          <input value={newRequest.customerName} onChange={(event) => updateNewRequest({ customerName: event.target.value })} />
        </Field>
        <PhoneField label={t('common.phone')} value={newRequest.phone} onChange={(event) => updateNewRequest({ phone: event.target.value })} />
        <Field label={t('common.email')}>
          <input type="email" value={newRequest.email} onChange={(event) => updateNewRequest({ email: event.target.value })} />
        </Field>
        <Field label={t('common.dateStart')}>
          <input type="date" value={newRequest.start} onChange={(event) => updateNewRequest({ start: event.target.value })} />
        </Field>
        <Field label={t('common.dateEnd')}>
          <input type="date" value={newRequest.end} onChange={(event) => updateNewRequest({ end: event.target.value })} />
        </Field>
        <SelectField
          label={t('admin.table.item')}
          value={newRequest.productId}
          onValueChange={handleNewRequestProduct}
          options={products.map((product) => ({ value: product.id, label: productName(product, t) }))}
        />
        <SelectField
          label={t('admin.catalogue.variantLabel')}
          value={newRequest.variantId}
          onValueChange={(variantId) => updateNewRequest({ variantId })}
          options={(selectedRequestProduct?.variants ?? []).map((variant) => ({ value: variant.id, label: variant.label }))}
        />
        <Field label={t('common.qty')}>
          <input type="number" min="1" value={newRequest.qty} onChange={(event) => updateNewRequest({ qty: event.target.value })} />
        </Field>
        <SelectField
          label={t('admin.table.fulfillment')}
          value={newRequest.fulfillment}
          onValueChange={(fulfillment) => updateNewRequest({ fulfillment: fulfillment as NewRequestDraft['fulfillment'] })}
          options={[
            { value: 'pickup', label: t('enum.fulfillment.pickup') },
            { value: 'delivery', label: t('enum.fulfillment.delivery') },
          ]}
        />
        <Field label={t('common.notes')}>
          <input value={newRequest.notes} onChange={(event) => updateNewRequest({ notes: event.target.value })} />
        </Field>
      </div>
      {addError ? <p className="validation-message" role="alert">{addError}</p> : null}
      <div className="dialog-actions">
        <button className="outline-button" type="button" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button className="secondary-button" type="button" onClick={createRequest} disabled={!newRequest.customerName.trim() || !newRequest.phone.trim()}>
          {t('admin.requests.createDraft')}
        </button>
      </div>
    </AdminCreatePanel>
  );
}

type RequestRecordsLayoutProps = {
  rentals: Rental[];
  selected?: Rental;
  products: Product[];
  t: TFunction;
  locale: Locale;
  canMutateRequest: boolean;
  onSelect: (reference: string) => void;
  onAccept: (rental: Rental) => void;
  onEdit: (rental: Rental) => void;
  onReject: (rental: Rental) => void;
};

export function RequestRecordsLayout({
  rentals,
  selected,
  products,
  t,
  locale,
  canMutateRequest,
  onSelect,
  onAccept,
  onEdit,
  onReject,
}: RequestRecordsLayoutProps) {
  return (
    <div className="records-layout request-records-layout">
      <RequestMobileCards
        rentals={rentals}
        selectedRef={selected?.reference}
        products={products}
        t={t}
        locale={locale}
        onSelect={onSelect}
      />
      <div className="desktop-request-queue" role="list" aria-label={t('admin.tabs.aria')}>
        {rentals.length === 0 ? (
          <EmptyState title={t('common.empty')} copy="" icon={Search} />
        ) : (
          rentals.map((rental) => {
            const selectedRow = selected?.reference === rental.reference;
            const stale = rental.staleHours >= 24;
            const ageLabel = requestQueueAge(rental, locale);
            return (
              <button
                className={`request-queue-card ${selectedRow ? 'selected' : ''} ${stale ? 'is-stale' : ''}`.trim()}
                type="button"
                role="listitem"
                aria-current={selectedRow ? 'true' : undefined}
                onClick={() => onSelect(rental.reference)}
                key={rental.reference}
              >
                <span className="request-queue-card-head">
                  <strong>{rental.reference}</strong>
                  <span className={stale ? 'stale-marker' : ''}>
                    {stale ? <AlertTriangle aria-hidden="true" /> : null}
                    {ageLabel}
                  </span>
                </span>
                <span className="request-queue-customer">
                  <UserRound aria-hidden="true" />
                  <span>{rental.customerName}</span>
                </span>
                <span className="request-queue-items">
                  <span>{t('admin.requests.requestedItems')}</span>
                  <strong>{requestQueueItems(rental, products, t)}</strong>
                </span>
                <span className="request-queue-meta">
                  <StatusPill type="fulfillment" value={rental.fulfillment} t={t} />
                  <StatusPill type="payment" value={rental.paymentStatus} t={t} />
                </span>
                <span className="request-queue-date">
                  <CalendarDays aria-hidden="true" />
                  <span>{formatDateRange(rental, locale)}</span>
                </span>
              </button>
            );
          })
        )}
      </div>
      {selected ? (
        <div className="desktop-record-panel">
          <RequestReviewPanel
            rental={selected}
            products={products}
            t={t}
            locale={locale}
            canMutate={canMutateRequest}
            onAccept={onAccept}
            onEdit={onEdit}
            onReject={onReject}
          />
        </div>
      ) : null}
    </div>
  );
}

function requestQueueAge(rental: Rental, locale: Locale) {
  if (rental.staleHours >= 24) {
    return locale === 'id' ? `${rental.staleHours} jam` : `${rental.staleHours}h`;
  }
  return locale === 'id' ? 'Baru' : 'New';
}

function requestQueueItems(rental: Rental, products: Product[], t: TFunction) {
  const labels = rental.items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    const productLabel = product ? productName(product, t) : item.productId;
    return `${productLabel} - ${variantLabel(t, item.variantId)} x ${item.qty}`;
  });
  return labels.length > 2 ? `${labels.slice(0, 2).join(', ')} +${labels.length - 2}` : labels.join(', ');
}
