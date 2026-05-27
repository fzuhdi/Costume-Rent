import { Plus, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ActivityLog, Checklist, OverrideDialog, PaymentPanel, RentalItems } from '../../components/admin/AdminComponents.jsx';
import { Field, InfoBlock, StatusPill } from '../../components/shared.jsx';
import {
  activityText,
  appendActivity,
  applyItemHoldDelta,
  formatDateRange,
  formatRupiah,
  getVariantAvailability,
  productName,
  shouldReleaseHold,
  upsertClient,
} from '../../lib/rental-utils.js';

export default function RentalsAdmin({ t, locale, rentals, setRentals, products, setProducts, setClients, settings }) {
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') ?? 'all';
  const activeRentals = rentals
    .filter((rental) => rental.lifecycle !== 'requested' && rental.lifecycle !== 'rejected')
    .filter((rental) => {
      if (statusFilter === 'ready') return ['preparing', 'ready_pickup'].includes(rental.lifecycle);
      if (statusFilter === 'on_rent') return rental.lifecycle === 'on_rent' || rental.lifecycle === 'out_delivery';
      return statusFilter === 'all' || rental.lifecycle === statusFilter;
    });
  const [selectedRef, setSelectedRef] = useState(searchParams.get('reference') ?? activeRentals[0]?.reference ?? rentals[0]?.reference);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addError, setAddError] = useState('');
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    phone: '',
    start: '2026-06-12',
    end: '2026-06-15',
    fulfillment: 'pickup',
    productId: products[0]?.id ?? '',
    variantId: products[0]?.variants[0]?.id ?? '',
    qty: 1,
  });
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
  const selectedProduct = products.find((product) => product.id === newOrder.productId) ?? products[0];
  const selectedVariant = selectedProduct?.variants.find((variant) => variant.id === newOrder.variantId) ?? selectedProduct?.variants[0];

  useEffect(() => {
    if (!selectedProduct || selectedVariant) return;
    setNewOrder((current) => ({ ...current, variantId: selectedProduct.variants[0]?.id ?? '' }));
  }, [selectedProduct?.id, selectedVariant?.id]);

  const createOrder = () => {
    if (!selectedProduct || !selectedVariant) return;
    if (!newOrder.customerName.trim() || !newOrder.phone.trim()) return;
    if (!newOrder.start || !newOrder.end || newOrder.end < newOrder.start) return;
    const qty = Math.max(1, Number(newOrder.qty) || 1);
    const available = getVariantAvailability(selectedProduct, selectedVariant.id, { start: newOrder.start, end: newOrder.end }, rentals);
    if (available < qty) {
      setAddError(t('admin.rentals.stockLimited'));
      return;
    }

    setAddError('');
    const currentRefs = rentals
      .map((rental) => Number(String(rental.reference).replace('CR-', '')))
      .filter((value) => Number.isFinite(value));
    const nextNumber = (currentRefs.length ? Math.max(...currentRefs) : 141) + 1;
    const reference = `CR-${String(nextNumber).padStart(4, '0')}`;
    const rental = {
      reference,
      customerName: newOrder.customerName.trim(),
      phone: newOrder.phone.trim(),
      email: '',
      lifecycle: 'confirmed',
      paymentStatus: 'missing',
      paymentMethod: 'bank_transfer',
      fulfillment: newOrder.fulfillment,
      start: newOrder.start,
      end: newOrder.end,
      pickupWindow: '10.00-12.00',
      returnWindow: '16.00-18.00',
      deliveryWindow: newOrder.fulfillment === 'delivery' ? '09.00-11.00' : '',
      address: '',
      notes: '',
      internalNotes: '',
      staleHours: 0,
      deliveryFee: 0,
      deliveryNotes: '',
      items: [{ productId: selectedProduct.id, variantId: selectedVariant.id, qty }],
      checklist: [
        { id: 'confirm-size', labelId: 'Konfirmasi ukuran', labelEn: 'Confirm size', done: false },
        { id: 'hold-stock', labelId: 'Tahan stok', labelEn: 'Hold stock', done: true },
      ],
      activity: [
        {
          id: `a-${Date.now()}`,
          time: '27 Mei 2026 15.05',
          textId: 'Pesanan ditambahkan staf dari riwayat pesanan.',
          textEn: 'Order added by staff from rentals history.',
        },
      ],
    };

    setProducts((current) => applyItemHoldDelta(current, rental.items, 1));
    setRentals((current) => [rental, ...current]);
    setClients((current) => upsertClient(current, rental));
    setSelectedRef(reference);
    setAddOpen(false);
    setNewOrder((current) => ({ ...current, customerName: '', phone: '', qty: 1 }));
  };

  return (
    <div className="admin-feature-grid">
      <section className="base-window management-window">
        <div className="view-bar">
          <div className="view-title-stack">
            <strong>{t('admin.rentals.title')}</strong>
            {statusFilter !== 'all' ? <span>{t(`admin.rentals.filter.${statusFilter}`)}</span> : null}
          </div>
          <button className="primary-button" type="button" onClick={() => setAddOpen((open) => !open)}>
            <Plus aria-hidden="true" />
            {t('admin.rentals.add')}
          </button>
        </div>
        {addOpen ? (
          <div className="content-panel compact-panel">
            <div className="form-grid">
              <Field label={t('common.name')}>
                <input value={newOrder.customerName} onChange={(event) => setNewOrder((current) => ({ ...current, customerName: event.target.value }))} />
              </Field>
              <Field label={t('common.phone')}>
                <input value={newOrder.phone} onChange={(event) => setNewOrder((current) => ({ ...current, phone: event.target.value }))} />
              </Field>
              <Field label={t('common.dateStart')}>
                <input type="date" value={newOrder.start} onChange={(event) => setNewOrder((current) => ({ ...current, start: event.target.value }))} />
              </Field>
              <Field label={t('common.dateEnd')}>
                <input type="date" value={newOrder.end} onChange={(event) => setNewOrder((current) => ({ ...current, end: event.target.value }))} />
              </Field>
              <Field label={t('admin.table.item')}>
                <select value={newOrder.productId} onChange={(event) => {
                  const productId = event.target.value;
                  const product = products.find((entry) => entry.id === productId);
                  setNewOrder((current) => ({ ...current, productId, variantId: product?.variants[0]?.id ?? '' }));
                }}>
                  {products.map((product) => (
                    <option value={product.id} key={product.id}>{productName(product, t)}</option>
                  ))}
                </select>
              </Field>
              <Field label={t('admin.catalogue.variantLabel')}>
                <select value={newOrder.variantId} onChange={(event) => setNewOrder((current) => ({ ...current, variantId: event.target.value }))}>
                  {(selectedProduct?.variants ?? []).map((variant) => (
                    <option value={variant.id} key={variant.id}>{variant.label}</option>
                  ))}
                </select>
              </Field>
              <Field label={t('common.qty')}>
                <input type="number" min="1" value={newOrder.qty} onChange={(event) => setNewOrder((current) => ({ ...current, qty: event.target.value }))} />
              </Field>
              <Field label={t('admin.table.fulfillment')}>
                <select value={newOrder.fulfillment} onChange={(event) => setNewOrder((current) => ({ ...current, fulfillment: event.target.value }))}>
                  <option value="pickup">{t('enum.fulfillment.pickup')}</option>
                  <option value="delivery">{t('enum.fulfillment.delivery')}</option>
                </select>
              </Field>
            </div>
            {addError ? <p className="validation-message">{addError}</p> : null}
            <button className="secondary-button full" type="button" onClick={createOrder} disabled={!newOrder.customerName.trim() || !newOrder.phone.trim()}>
              {t('common.save')}
            </button>
          </div>
        ) : null}
        <div className="management-list padded">
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
        </div>
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
