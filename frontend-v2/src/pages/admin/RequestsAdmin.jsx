import * as Tabs from '@radix-ui/react-tabs';
import { ListFilter } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EditRentalDialog, RecordPanel, RejectDialog, RentalItems } from '../../components/admin/AdminComponents.jsx';
import { DataTable, StatusPill } from '../../components/shared.jsx';
import { activityText, appendActivity, applyItemHoldDelta, shouldReleaseHold } from '../../lib/rental-utils.js';

const requestTabs = ['all', 'stale', 'delivery', 'returned'];

export default function RequestsAdmin({ t, locale, rentals, setRentals, setProducts, products }) {
  const [searchParams] = useSearchParams();
  const initialTab = requestTabs.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'all';
  const [tab, setTab] = useState(initialTab);
  const [selectedRef, setSelectedRef] = useState(searchParams.get('reference') ?? rentals.find((rental) => rental.lifecycle === 'requested')?.reference);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const filtered = rentals.filter((rental) => {
    if (tab === 'stale') return rental.lifecycle === 'requested' && rental.staleHours >= 24;
    if (tab === 'delivery') return rental.lifecycle === 'requested' && rental.fulfillment === 'delivery';
    if (tab === 'returned') return rental.lifecycle === 'returned' && rental.paymentStatus !== 'verified';
    return rental.lifecycle === 'requested';
  });
  const selected = filtered.find((rental) => rental.reference === selectedRef) ?? filtered[0];
  const canMutateRequest = selected?.lifecycle === 'requested';

  useEffect(() => {
    const targetTab = searchParams.get('tab');
    const targetReference = searchParams.get('reference');
    if (requestTabs.includes(targetTab) && targetTab !== tab) setTab(targetTab);
    if (targetReference && targetReference !== selectedRef) setSelectedRef(targetReference);
  }, [searchParams, selectedRef, tab]);

  useEffect(() => {
    if (filtered.length > 0 && !filtered.some((rental) => rental.reference === selectedRef)) {
      setSelectedRef(filtered[0].reference);
    }
  }, [filtered, selectedRef]);

  const updateRental = (reference, updater, activity) => {
    setRentals((current) =>
      current.map((rental) => {
        if (rental.reference !== reference) return rental;
        const next = typeof updater === 'function' ? updater(rental) : { ...rental, ...updater };
        return activity ? appendActivity(next, activity) : next;
      }),
    );
  };

  const rejectSelected = (reason) => {
    if (!selected) return;
    if (shouldReleaseHold(selected.lifecycle, 'rejected')) {
      setProducts((current) => applyItemHoldDelta(current, selected.items, -1));
    }
    updateRental(selected.reference, { lifecycle: 'rejected', internalNotes: reason }, activityText(`Ditolak: ${reason}`, `Rejected: ${reason}`));
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: t('admin.table.reference'),
        cell: ({ row }) => (
          <div>
            <strong>{row.original.reference}</strong>
            <small>{row.original.staleHours >= 24 ? t('admin.record.staleAge') : t('admin.record.newAge')}</small>
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
        accessorKey: 'fulfillment',
        header: t('admin.table.fulfillment'),
        cell: ({ row }) => <StatusPill type="fulfillment" value={row.original.fulfillment} t={t} />,
      },
      {
        accessorKey: 'lifecycle',
        header: t('admin.table.lifecycle'),
        cell: ({ row }) => <StatusPill type="lifecycle" value={row.original.lifecycle} t={t} />,
      },
      {
        accessorKey: 'paymentStatus',
        header: t('admin.table.payment'),
        cell: ({ row }) => <StatusPill type="payment" value={row.original.paymentStatus} t={t} />,
      },
    ],
    [products, t],
  );

  return (
    <section className="base-window">
      <Tabs.Root value={tab} onValueChange={setTab}>
        <div className="view-bar">
          <Tabs.List className="view-tabs" aria-label={t('admin.tabs.aria')}>
            {['all', 'stale', 'delivery', 'returned'].map((value) => (
              <Tabs.Trigger className="tab-trigger" value={value} key={value}>
                {value === 'all' ? t('admin.tabs.all') : value === 'returned' ? t('admin.requests.returnedOpen') : t(`admin.requests.${value}`)}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <div className="view-tools">
            <button type="button">
              <ListFilter aria-hidden="true" />
              {t('admin.tools.filter')}
            </button>
            <button type="button">{t('admin.tools.sort')}</button>
          </div>
        </div>
      </Tabs.Root>

      <div className="records-layout">
        <DataTable columns={columns} data={filtered} selectedId={selected?.reference} getRowId={(row) => row.reference} onRowClick={(row) => setSelectedRef(row.reference)} emptyLabel={t('common.empty')} />
        {selected ? (
          <RecordPanel rental={selected} products={products} t={t} locale={locale}>
            {canMutateRequest ? (
              <div className="record-actions">
                <button type="button" onClick={() => updateRental(selected.reference, { lifecycle: 'confirmed' }, activityText('Permintaan diterima staf.', 'Request accepted by staff.'))}>
                  {t('admin.requests.accept')}
                </button>
                <button type="button" onClick={() => setEditOpen(true)}>{t('common.edit')}</button>
                <button className="danger-action" type="button" onClick={() => setRejectOpen(true)}>{t('admin.requests.reject')}</button>
              </div>
            ) : (
              <div className="inline-alert warning">
                <p>{t('admin.requests.notPending')}</p>
              </div>
            )}
          </RecordPanel>
        ) : null}
      </div>

      <RejectDialog open={rejectOpen} setOpen={setRejectOpen} t={t} onReject={rejectSelected} />
      <EditRentalDialog open={editOpen} setOpen={setEditOpen} rental={selected} t={t} onSave={(values) => updateRental(selected.reference, values, activityText('Permintaan diubah staf.', 'Request edited by staff.'))} />
    </section>
  );
}
