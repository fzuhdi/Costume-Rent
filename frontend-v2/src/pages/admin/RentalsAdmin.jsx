import { Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ActivityLog, Checklist, OverrideDialog, PaymentPanel, RentalItems } from '../../components/admin/AdminComponents.jsx';
import { InfoBlock, StatusPill } from '../../components/shared.jsx';
import {
  activityText,
  appendActivity,
  applyItemHoldDelta,
  formatDateRange,
  formatRupiah,
  shouldReleaseHold,
} from '../../lib/rental-utils.js';

export default function RentalsAdmin({ t, locale, rentals, setRentals, products, setProducts, settings }) {
  const [searchParams] = useSearchParams();
  const activeRentals = rentals.filter((rental) => rental.lifecycle !== 'requested' && rental.lifecycle !== 'rejected');
  const [selectedRef, setSelectedRef] = useState(searchParams.get('reference') ?? activeRentals[0]?.reference ?? rentals[0]?.reference);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const selected = rentals.find((rental) => rental.reference === selectedRef) ?? activeRentals[0] ?? rentals[0];
  const isCompleted = selected?.lifecycle === 'completed';

  useEffect(() => {
    const targetReference = searchParams.get('reference');
    if (targetReference && targetReference !== selectedRef) setSelectedRef(targetReference);
  }, [searchParams, selectedRef]);

  const updateRental = (reference, updater, activity) => {
    const existing = rentals.find((rental) => rental.reference === reference);
    const preview = existing ? (typeof updater === 'function' ? updater(existing) : { ...existing, ...updater }) : null;
    if (existing && preview && shouldReleaseHold(existing.lifecycle, preview.lifecycle)) {
      setProducts((productsCurrent) => applyItemHoldDelta(productsCurrent, existing.items, -1));
    }

    setRentals((current) =>
      current.map((rental) => {
        if (rental.reference !== reference) return rental;
        const next = typeof updater === 'function' ? updater(rental) : { ...rental, ...updater };
        return activity ? appendActivity(next, activity) : next;
      }),
    );
  };

  const canComplete = selected?.paymentStatus === 'verified' || !settings.requireVerifiedProof;

  return (
    <div className="admin-feature-grid">
      <section className="management-list">
        {activeRentals.map((rental) => (
          <button className={`management-card ${selected?.reference === rental.reference ? 'selected' : ''}`} type="button" key={rental.reference} onClick={() => setSelectedRef(rental.reference)}>
            <div>
              <strong>{rental.reference}</strong>
              <span>{rental.customerName}</span>
            </div>
            <StatusPill type="lifecycle" value={rental.lifecycle} t={t} />
            <small>{formatDateRange(rental, locale)}</small>
          </button>
        ))}
      </section>

      {selected ? (
        <section className="record-panel feature-panel">
          <div className="record-panel-head">
            <span className="eyebrow">{t('admin.rentals.title')}</span>
            <strong>{selected.reference}</strong>
          </div>
          <div className="stage-list">
            {['confirmed', 'preparing', 'ready_pickup', 'on_rent', 'returned', 'completed'].map((status) => (
              <span className={selected.lifecycle === status ? 'current' : selected.lifecycle === 'completed' ? 'done' : ''} key={status}>
                {t(`enum.lifecycle.${status}`)}
              </span>
            ))}
          </div>

          {isCompleted ? (
            <div className="inline-alert warning">
              <div>
                <strong>{t('admin.rentals.completedLockedTitle')}</strong>
                <p>{t('admin.rentals.completedLockedCopy')}</p>
              </div>
            </div>
          ) : null}

          <RentalItems rental={selected} products={products} t={t} />

          <div className="info-grid">
            <InfoBlock title={t('admin.rentals.deliveryFee')} copy={formatRupiah(selected.deliveryFee)} />
            <InfoBlock title={t('admin.rentals.deliveryNotes')} copy={selected.deliveryNotes || '-'} />
            <InfoBlock title={t('admin.payment.method')} copy={t(`enum.paymentMethod.${selected.paymentMethod}`)} />
            <InfoBlock title={t('admin.payment.proof')} copy={t(`enum.payment.${selected.paymentStatus}`)} />
          </div>

          {!isCompleted ? (
            <>
              <Checklist rental={selected} locale={locale} onToggle={(itemId) => updateRental(selected.reference, (rental) => ({
                ...rental,
                checklist: rental.checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
              }), activityText('Checklist diperbarui.', 'Checklist updated.'))} t={t} />

              <div className="record-actions wide">
                <button type="button" onClick={() => updateRental(selected.reference, { lifecycle: 'ready_pickup' }, activityText('Barang siap diambil.', 'Items marked ready.'))}>{t('admin.rentals.ready')}</button>
                <button type="button" onClick={() => updateRental(selected.reference, { lifecycle: selected.fulfillment === 'delivery' ? 'out_delivery' : 'on_rent' }, activityText('Barang keluar ke pelanggan.', 'Items released to customer.'))}>{t('admin.rentals.release')}</button>
                <button type="button" onClick={() => updateRental(selected.reference, { lifecycle: 'returned' }, activityText('Barang kembali.', 'Items returned.'))}>{t('admin.rentals.return')}</button>
                <button type="button" disabled={!canComplete} onClick={() => updateRental(selected.reference, { lifecycle: 'completed' }, activityText('Sewa selesai.', 'Rental completed.'))}>{t('admin.rentals.complete')}</button>
              </div>
              {!canComplete ? <p className="validation-message">{t('admin.rentals.completeBlocked')}</p> : null}

              <PaymentPanel rental={selected} t={t} updateRental={updateRental} />
            </>
          ) : null}

          {isCompleted ? (
            <button className="ghost-button" type="button" onClick={() => setOverrideOpen(true)}>
              <Settings aria-hidden="true" />
              {t('admin.rentals.override')}
            </button>
          ) : null}

          <ActivityLog rental={selected} locale={locale} t={t} />
        </section>
      ) : null}

      <OverrideDialog open={overrideOpen} setOpen={setOverrideOpen} t={t} onOverride={(reason) => updateRental(selected.reference, { lifecycle: 'confirmed', internalNotes: reason }, activityText(`Override admin: ${reason}`, `Admin override: ${reason}`))} />
    </div>
  );
}
