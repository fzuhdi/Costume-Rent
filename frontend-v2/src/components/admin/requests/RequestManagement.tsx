import type { ColumnDef } from '@tanstack/react-table';
import { X } from 'lucide-react';
import AdminBottomSheet, { AdminSheetHeader } from '../common/AdminBottomSheet';
import { AdminCreatePanel, RecordActionBar } from '../common/AdminManagement';
import { RecordPanel } from '../rentals/RentalRecordComponents';
import { RequestMobileCards } from './RequestsView';
import { DataTable, Field, PhoneField, SearchInput, SelectField } from '../../shared';
import { productName } from '../../../lib/rental-utils';
import type { StateSetter } from '../../../types/app';
import type { Locale, Product, Rental, TFunction } from '../../../types/domain';
import type {
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
  columns: ColumnDef<Rental, unknown>[];
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
  columns,
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
        t={t}
        locale={locale}
        onSelect={onSelect}
      />
      <div className="desktop-request-table">
        <DataTable<Rental> columns={columns} data={rentals} selectedId={selected?.reference} getRowId={(row) => row.reference} onRowClick={(row) => onSelect(row.reference)} emptyLabel={t('common.empty')} />
      </div>
      {selected ? (
        <div className="desktop-record-panel">
          <RecordPanel rental={selected} products={products} t={t} locale={locale}>
            {canMutateRequest ? (
              <RecordActionBar label={t('admin.common.detailActions')}>
                <button type="button" onClick={() => onAccept(selected)}>
                  {t('admin.requests.accept')}
                </button>
                <button type="button" onClick={() => onEdit(selected)}>{t('common.edit')}</button>
                <button className="danger-action" type="button" onClick={() => onReject(selected)}>{t('admin.requests.reject')}</button>
              </RecordActionBar>
            ) : (
              <div className="inline-alert warning">
                <p>{t('admin.requests.notPending')}</p>
              </div>
            )}
          </RecordPanel>
        </div>
      ) : null}
    </div>
  );
}
