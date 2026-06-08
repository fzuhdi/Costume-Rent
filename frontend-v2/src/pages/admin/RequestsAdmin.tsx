import * as Tabs from '@radix-ui/react-tabs';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, ListFilter } from 'lucide-react';
import { useMemo } from 'react';
import { AdminCreateAction, AdminCreateFab, AdminViewBar } from '../../components/admin/common/AdminManagement';
import { EditRentalDialog, RejectDialog } from '../../components/admin/rentals/RentalDialogs';
import { RentalItems } from '../../components/admin/rentals/RentalRecordComponents';
import { RequestMobileDetail } from '../../components/admin/requests/RequestsView';
import { RequestCreatePanel, RequestFilterSheet, RequestRecordsLayout } from '../../components/admin/requests/RequestManagement';
import {
  fulfillmentFilters,
  paymentFilters,
  requestTabs,
  sortModes,
  useRequestsAdminController,
} from '../../components/admin/requests/useRequestsAdminController';
import { StatusPill } from '../../components/shared';
import { activityText } from '../../lib/rental-utils';
import type { StateSetter } from '../../types/app';
import type { DataAdapter, Locale, Product, Rental, TFunction } from '../../types/domain';

type RequestsAdminProps = {
  t: TFunction;
  locale: Locale;
  rentals: Rental[];
  setRentals: StateSetter<Rental[]>;
  setProducts: StateSetter<Product[]>;
  products: Product[];
  dataAdapter: DataAdapter;
};

export default function RequestsAdmin({ t, locale, rentals, setRentals, setProducts, products, dataAdapter }: RequestsAdminProps) {
  const controller = useRequestsAdminController({ t, rentals, setRentals, setProducts, products, dataAdapter });
  const columns = useMemo<ColumnDef<Rental, unknown>[]>(
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
    <section className={`base-window requests-window ${controller.isDetailViewOpen ? 'detail-open' : ''}`}>
      <div className="request-list-view">
        <Tabs.Root value={controller.tab} onValueChange={controller.handleTabChange}>
          <AdminViewBar>
            <Tabs.List className="view-tabs request-tabs" aria-label={t('admin.tabs.aria')}>
              {requestTabs.map((value) => (
                <Tabs.Trigger className="tab-trigger" value={value} key={value}>
                  <span>{value === 'all' ? t('admin.tabs.all') : t(`admin.requests.${value}`)}</span>
                  <strong className="tab-count">{controller.requestCounts[value]}</strong>
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            <div className="view-actions">
              <AdminCreateAction
                label={t('admin.requests.add')}
                open={controller.addOpen}
                controls="request-add-panel"
                onToggle={() => controller.setAddOpen((open) => !open)}
              />
              <div className="view-tools">
                <button
                  type="button"
                  className={controller.filtersOpen ? 'selected' : ''}
                  aria-expanded={controller.filtersOpen}
                  onClick={() => controller.setFiltersOpen((open) => !open)}
                >
                  <ListFilter aria-hidden="true" />
                  {t('admin.tools.filterSort')}
                </button>
              </div>
            </div>
          </AdminViewBar>
          <RequestFilterSheet
            open={controller.filtersOpen}
            setOpen={controller.setFiltersOpen}
            t={t}
            query={controller.query}
            setQuery={controller.setQuery}
            fulfillmentFilter={controller.fulfillmentFilter}
            setFulfillmentFilter={controller.setFulfillmentFilter}
            fulfillmentFilters={fulfillmentFilters}
            paymentFilter={controller.paymentFilter}
            setPaymentFilter={controller.setPaymentFilter}
            paymentFilters={paymentFilters}
            sortMode={controller.sortMode}
            setSortMode={controller.setSortMode}
            sortModes={sortModes}
            applyFilters={controller.applyFilters}
            clearFilters={controller.clearFilters}
          />
        </Tabs.Root>

        <AdminCreateFab
          label={t('admin.requests.add')}
          open={controller.addOpen}
          controls="request-add-panel"
          onToggle={() => controller.setAddOpen((open) => !open)}
        />

        {controller.addOpen ? (
          <RequestCreatePanel
            t={t}
            products={products}
            newRequest={controller.newRequest}
            updateNewRequest={controller.updateNewRequest}
            selectedRequestProduct={controller.selectedRequestProduct}
            handleNewRequestProduct={controller.handleNewRequestProduct}
            addError={controller.addError}
            createRequest={controller.createRequest}
            onClose={controller.closeAddPanel}
          />
        ) : null}

        <RequestRecordsLayout
          rentals={controller.filtered}
          selected={controller.selected}
          columns={columns}
          products={products}
          t={t}
          locale={locale}
          canMutateRequest={controller.canMutateRequest}
          onSelect={controller.selectRequest}
          onAccept={controller.acceptRequest}
          onEdit={controller.editRequest}
          onReject={controller.rejectRequest}
        />
      </div>

      {controller.selected ? (
        <RequestMobileDetail
          rental={controller.selected}
          products={products}
          t={t}
          locale={locale}
          canMutate={controller.canMutateRequest}
          onBack={controller.closeDetailView}
          onAccept={controller.acceptRequest}
          onEdit={controller.editRequest}
          onReject={controller.rejectRequest}
        />
      ) : null}

      <RejectDialog open={controller.rejectOpen} setOpen={controller.setRejectOpen} t={t} onReject={controller.rejectSelected} />
      <EditRentalDialog
        open={controller.editOpen}
        setOpen={controller.setEditOpen}
        rental={controller.selected}
        t={t}
        onSave={(values) => controller.updateRental(values.reference, values, activityText('Pesanan diubah staf.', 'Order edited by staff.'))}
      />
    </section>
  );
}
