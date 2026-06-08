import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  PackageCheck,
  Search,
  Settings,
  Truck,
  Undo2,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ActivityLog, Checklist, OverrideDialog, PaymentPanel, RentalItems } from '../../components/admin/AdminComponents.jsx';
import { EmptyState, Field, InfoBlock, MobileDetailShell, SearchInput, SelectField, StatusPill, StepProgress } from '../../components/shared.jsx';
import {
  activityText,
  appendActivity,
  applyItemHoldDelta,
  formatDateRange,
  hasRentalChanged,
  productName,
  shouldReleaseHold,
} from '../../lib/rental-utils.js';
import { resetMobileDetailScroll } from '../../lib/mobile-detail.js';

const rentalFilters = ['all', 'ready', 'on_rent', 'returned', 'completed'];

export default function RentalsAdmin({ t, locale, rentals, setRentals, products, setProducts, settings }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = rentalFilters.includes(searchParams.get('status')) ? searchParams.get('status') : 'all';
  const [selectedRef, setSelectedRef] = useState(searchParams.get('reference') ?? '');
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(Boolean(searchParams.get('reference')));
  const [query, setQuery] = useState('');
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const rentalsRef = useRef(rentals);
  const lifecycleMutationRef = useRef({ reference: '', at: 0 });

  const operationalRentals = useMemo(
    () => rentals.filter((rental) => rental.lifecycle !== 'requested' && rental.lifecycle !== 'rejected'),
    [rentals],
  );
  const filterCounts = useMemo(
    () => rentalFilters.reduce((counts, filter) => ({
      ...counts,
      [filter]: operationalRentals.filter((rental) => matchesStatusFilter(rental, filter)).length,
    }), {}),
    [operationalRentals],
  );
  const filteredRentals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return operationalRentals
      .filter((rental) => matchesStatusFilter(rental, statusFilter))
      .filter((rental) => {
        if (!normalizedQuery) return true;
        const itemText = rental.items
          .map((item) => productName(products.find((product) => product.id === item.productId) ?? {}, t))
          .join(' ');
        return `${rental.reference} ${rental.customerName} ${rental.phone} ${itemText}`.toLowerCase().includes(normalizedQuery);
      });
  }, [operationalRentals, products, query, statusFilter, t]);

  const selected =
    filteredRentals.find((rental) => rental.reference === selectedRef) ??
    filteredRentals[0];
  const isCompleted = selected?.lifecycle === 'completed';
  const canComplete = selected?.paymentStatus === 'verified' || !settings.requireVerifiedProof;
  const nextAction = selected ? getNextAction({ selected, canComplete, t, updateRental }) : null;
  const manualTransitions = selected
    ? getManualTransitions({ selected, canComplete, t, updateRental }).filter((action) => action.lifecycle !== nextAction?.lifecycle && !action.disabled)
    : [];
  const NextActionIcon = nextAction?.icon ?? CheckCircle2;

  useEffect(() => {
    rentalsRef.current = rentals;
  }, [rentals]);

  useEffect(() => {
    const targetReference = searchParams.get('reference');
    if (targetReference && targetReference !== selectedRef) setSelectedRef(targetReference);
    setIsDetailViewOpen(Boolean(targetReference));
  }, [searchParams, selectedRef]);

  useEffect(() => {
    if (!selected && filteredRentals[0]) setSelectedRef(filteredRentals[0].reference);
  }, [filteredRentals, selected]);

  useEffect(() => {
    setCorrectionOpen(false);
  }, [selected?.reference]);

  useEffect(() => {
    if (isDetailViewOpen) resetMobileDetailScroll();
  }, [isDetailViewOpen, selected?.reference]);

  function updateRental(reference, updater, activity) {
    const currentRentals = rentalsRef.current;
    const existing = currentRentals.find((rental) => rental.reference === reference);
    if (!existing) return;

    const preview = typeof updater === 'function' ? updater(existing) : { ...existing, ...updater };
    if (!hasRentalChanged(existing, preview)) return;

    if (existing.lifecycle !== preview.lifecycle) {
      const now = Date.now();
      const lastMutation = lifecycleMutationRef.current;
      if (lastMutation.reference === reference && now - lastMutation.at < 650) return;
      lifecycleMutationRef.current = { reference, at: now };
    }

    if (shouldReleaseHold(existing.lifecycle, preview.lifecycle)) {
      setProducts((productsCurrent) => applyItemHoldDelta(productsCurrent, existing.items, -1));
    }

    const nextRental = activity ? appendActivity(preview, activity) : preview;
    const nextRentals = currentRentals.map((rental) => (rental.reference === reference ? nextRental : rental));
    rentalsRef.current = nextRentals;
    setRentals(nextRentals);
  }

  const updateStatusFilter = (nextStatus) => {
    const next = new URLSearchParams(searchParams);
    if (nextStatus === 'all') {
      next.delete('status');
    } else {
      next.set('status', nextStatus);
    }
    next.delete('reference');
    setIsDetailViewOpen(false);
    setSearchParams(next, { replace: true });
  };

  const selectRental = (reference) => {
    setSelectedRef(reference);
    setIsDetailViewOpen(true);
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

  return (
    <div className={`admin-feature-grid rentals-admin-grid ${isDetailViewOpen ? 'detail-open' : ''}`}>
      <section className="base-window management-window rental-list-view">
        <div className="view-bar rentals-view-bar">
          <div className="view-title-stack">
            <strong>{t('admin.rentals.title')}</strong>
            <span>{t(`admin.rentals.filter.${statusFilter}`)}</span>
          </div>
        </div>

        <div className="rental-filter-strip" aria-label={t('admin.rentals.filtersAria')}>
          <SearchInput value={query} onChange={setQuery} placeholder={t('admin.rentals.searchPlaceholder')} clearLabel={t('common.clear')} />
          <div className="filter-row rental-filter-row">
            {rentalFilters.map((filter) => (
              <button
                className={`filter-chip ${statusFilter === filter ? 'active' : ''}`}
                type="button"
                onClick={() => updateStatusFilter(filter)}
                key={filter}
              >
                <span>{t(`admin.rentals.filter.${filter}`)}</span>
                <strong className="filter-count">{filterCounts[filter]}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="management-list padded">
          {filteredRentals.length === 0 ? (
            <EmptyState title={t('admin.rentals.emptyTitle')} copy={t('admin.rentals.emptyCopy')} icon={Search} />
          ) : (
            filteredRentals.map((rental) => (
              <button className={`management-card rental-record-card ${selected?.reference === rental.reference ? 'selected' : ''}`} type="button" key={rental.reference} onClick={() => selectRental(rental.reference)}>
                <div className="rental-record-main">
                  <div>
                    <strong>{rental.reference}</strong>
                    <span>{rental.customerName}</span>
                  </div>
                  <StatusPill type="lifecycle" value={rental.lifecycle} t={t} />
                </div>
                <div className="rental-record-meta">
                  <span>
                    <CalendarDays aria-hidden="true" />
                    {formatDateRange(rental, locale)}
                  </span>
                  <span>
                    <PackageCheck aria-hidden="true" />
                    {t('admin.rentals.itemCount', { count: getRentalItemCount(rental) })}
                  </span>
                  <span>
                    <CreditCard aria-hidden="true" />
                    {t(`enum.payment.${rental.paymentStatus}`)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      {selected ? (
        <MobileDetailShell
          className="rental-detail-view rental-detail-shell"
          backLabel={t('admin.nav.rentals')}
          title={selected.reference}
          onBack={closeDetailView}
          actionLabel={t('admin.common.detailActions')}
          actionClassName="rental-detail-actionbar"
          actions={nextAction && !isCompleted ? (
            <button
              type="button"
              disabled={nextAction.disabled}
              title={nextAction.disabled ? nextAction.copy : undefined}
              onClick={nextAction.onClick}
            >
              <NextActionIcon aria-hidden="true" />
              {nextAction.label}
            </button>
          ) : null}
        >
        <section className="record-panel feature-panel rental-workspace" aria-label={t('admin.rentals.workflowAria')}>
          <div className="rental-command-card">
            <div className="rental-command-copy">
              <span className="eyebrow">{t('admin.rentals.currentOrder')}</span>
              <h2>{selected.reference}</h2>
              <p>
                <UserRound aria-hidden="true" />
                {selected.customerName} - {formatDateRange(selected, locale)}
              </p>
              <div className="inline-status">
                <StatusPill type="lifecycle" value={selected.lifecycle} t={t} />
                <StatusPill type="payment" value={selected.paymentStatus} t={t} />
                <StatusPill type="fulfillment" value={selected.fulfillment} t={t} />
              </div>
            </div>

            <div className={`next-action-card ${nextAction?.tone ?? 'info'}`}>
              <span>{t('admin.rentals.nextAction')}</span>
              <strong>{nextAction?.title}</strong>
              <p>{nextAction?.copy}</p>
              {nextAction ? (
                <button
                  className="primary-button rental-primary-action"
                  type="button"
                  disabled={nextAction.disabled}
                  title={nextAction.disabled ? nextAction.copy : undefined}
                  onClick={nextAction.onClick}
                >
                  <NextActionIcon aria-hidden="true" />
                  {nextAction.label}
                </button>
              ) : null}
            </div>
          </div>

          <LifecycleRoadmap rental={selected} t={t} />

          {isCompleted ? (
            <div className="inline-alert warning">
              <AlertTriangle aria-hidden="true" />
              <div>
                <strong>{t('admin.rentals.completedLockedTitle')}</strong>
                <p>{t('admin.rentals.completedLockedCopy')}</p>
              </div>
            </div>
          ) : null}

          <div className="rental-detail-grid">
            <section className="rental-section">
              <div className="rental-section-head">
                <PackageCheck aria-hidden="true" />
                <div>
                  <span className="section-kicker">{t('admin.rentals.itemsTitle')}</span>
                  <p>{t('admin.rentals.itemsHelp')}</p>
                </div>
              </div>
              <RentalItems rental={selected} products={products} t={t} />
            </section>

            <section className="rental-section">
              <div className="rental-section-head">
                <CreditCard aria-hidden="true" />
                <div>
                  <span className="section-kicker">{t('admin.rentals.paymentTitle')}</span>
                  <p>{canComplete ? t('admin.rentals.paymentReady') : t('admin.rentals.paymentBlocked')}</p>
                </div>
              </div>
              <PaymentDeliveryEditor
                rental={selected}
                t={t}
                updateRental={updateRental}
                paymentEditable={!isCompleted}
                planningEditable={!isCompleted && canEditPlanningDetails(selected)}
              />
            </section>
          </div>

          {!isCompleted && canUseChecklist(selected) ? (
              <section className="rental-section">
                <div className="rental-section-head">
                  <ClipboardCheck aria-hidden="true" />
                  <div>
                    <span className="section-kicker">{t('admin.rentals.checklist')}</span>
                    <p>{t('admin.rentals.checklistHelp')}</p>
                  </div>
                </div>
                <Checklist rental={selected} locale={locale} onToggle={(itemId) => updateRental(selected.reference, (rental) => ({
                  ...rental,
                  checklist: rental.checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
                }), activityText('Checklist diperbarui.', 'Checklist updated.'))} t={t} />
              </section>
          ) : null}

          <PaymentPanel rental={selected} t={t} updateRental={updateRental} readOnly={isCompleted} />

          {!isCompleted && manualTransitions.length > 0 ? (
            <div className="manual-correction">
              <button
                className="manual-correction-toggle"
                type="button"
                aria-expanded={correctionOpen}
                onClick={() => setCorrectionOpen((open) => !open)}
              >
                <Settings aria-hidden="true" />
                <span>{t('admin.rentals.manualActions')}</span>
              </button>
              {correctionOpen ? (
                <div className="manual-correction-panel">
                  <p>{t('admin.rentals.manualActionsHelp')}</p>
                  <div className="record-actions wide secondary-action-grid">
                    {manualTransitions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button type="button" disabled={action.disabled} title={action.disabled ? t('admin.rentals.completeBlocked') : undefined} onClick={action.onClick} key={action.key}>
                          <Icon aria-hidden="true" />
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                  {!canComplete && selected.lifecycle === 'returned' ? <p className="validation-message">{t('admin.rentals.completeBlocked')}</p> : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {isCompleted ? (
            <button className="ghost-button" type="button" onClick={() => setOverrideOpen(true)}>
              <Settings aria-hidden="true" />
              {t('admin.rentals.override')}
            </button>
          ) : null}

          <ActivityLog rental={selected} locale={locale} t={t} />
        </section>
        </MobileDetailShell>
      ) : null}

      <OverrideDialog
        open={overrideOpen}
        setOpen={setOverrideOpen}
        t={t}
        rental={selected}
        locale={locale}
        onOverride={({ reason, lifecycle }) => updateRental(selected.reference, { lifecycle, internalNotes: reason }, activityText(`Override admin: ${reason}`, `Admin override: ${reason}`))}
      />
    </div>
  );
}

function matchesStatusFilter(rental, statusFilter) {
  if (statusFilter === 'ready') return ['preparing', 'ready_pickup'].includes(rental.lifecycle);
  if (statusFilter === 'on_rent') return rental.lifecycle === 'on_rent' || rental.lifecycle === 'out_delivery';
  if (statusFilter === 'returned') return rental.lifecycle === 'returned';
  if (statusFilter === 'completed') return rental.lifecycle === 'completed';
  return true;
}

function getRentalItemCount(rental) {
  return rental.items.reduce((sum, item) => sum + item.qty, 0);
}

function canEditPlanningDetails(rental) {
  return ['confirmed', 'preparing', 'ready_pickup'].includes(rental.lifecycle);
}

function canUseChecklist(rental) {
  return ['confirmed', 'preparing', 'ready_pickup'].includes(rental.lifecycle);
}

function getManualTransitions({ selected, canComplete, t, updateRental }) {
  const releaseLifecycle = selected.fulfillment === 'delivery' ? 'out_delivery' : 'on_rent';
  const candidates = [];

  if (['confirmed', 'preparing'].includes(selected.lifecycle)) {
    candidates.push({ lifecycle: 'ready_pickup', label: t('admin.rentals.ready'), icon: PackageCheck });
  }

  if (selected.lifecycle === 'ready_pickup') {
    candidates.push({ lifecycle: releaseLifecycle, label: t('admin.rentals.release'), icon: Truck });
    candidates.push({ lifecycle: 'preparing', label: t(`enum.lifecycle.preparing`), icon: PackageCheck });
  }

  if (selected.lifecycle === 'out_delivery' || selected.lifecycle === 'on_rent') {
    candidates.push({ lifecycle: 'returned', label: t('admin.rentals.return'), icon: Undo2 });
    candidates.push({ lifecycle: 'ready_pickup', label: t(`enum.lifecycle.ready_pickup`), icon: PackageCheck });
  }

  if (selected.lifecycle === 'returned') {
    candidates.push({ lifecycle: 'completed', label: t('admin.rentals.complete'), icon: CheckCircle2, disabled: !canComplete });
  }

  return candidates
    .filter((candidate) => candidate.lifecycle !== selected.lifecycle)
    .map((candidate) => ({
      ...candidate,
      key: candidate.lifecycle,
      onClick: () => updateRental(
        selected.reference,
        { lifecycle: candidate.lifecycle },
        lifecycleActivity(candidate.lifecycle),
      ),
    }));
}

function lifecycleActivity(lifecycle) {
  if (lifecycle === 'ready_pickup') return activityText('Barang siap diambil.', 'Items marked ready.');
  if (lifecycle === 'out_delivery' || lifecycle === 'on_rent') return activityText('Barang keluar ke pelanggan.', 'Items released to customer.');
  if (lifecycle === 'returned') return activityText('Barang kembali.', 'Items returned.');
  if (lifecycle === 'completed') return activityText('Sewa selesai.', 'Rental completed.');
  if (lifecycle === 'preparing') return activityText('Status dikoreksi ke persiapan.', 'Status corrected to preparing.');
  return activityText('Status pesanan dikoreksi.', 'Rental status corrected.');
}

function PaymentDeliveryEditor({ rental, t, updateRental, paymentEditable, planningEditable }) {
  const [draft, setDraft] = useState(() => makePaymentDraft(rental));
  const paymentMethodOptions = ['bank_transfer', 'qris', 'cash', 'other'].map((method) => ({
    value: method,
    label: t(`enum.paymentMethod.${method}`),
  }));
  const fulfillmentOptions = ['pickup', 'delivery'].map((fulfillment) => ({
    value: fulfillment,
    label: t(`enum.fulfillment.${fulfillment}`),
  }));

  useEffect(() => {
    setDraft(makePaymentDraft(rental));
  }, [rental.reference]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(makePaymentDraft(rental));
  const updateDraft = (patch) => setDraft((current) => ({ ...current, ...patch }));
  const saveDraft = () => {
    updateRental(rental.reference, draft, activityText('Detail pembayaran dan pemenuhan diperbarui.', 'Payment and fulfillment details updated.'));
  };

  if (!paymentEditable && !planningEditable) {
    return (
      <div className="info-grid payment-delivery-readout">
        <InfoBlock title={t('admin.payment.method')} copy={t(`enum.paymentMethod.${rental.paymentMethod}`)} />
        <InfoBlock title={t('admin.payment.proof')} copy={t(`enum.payment.${rental.paymentStatus}`)} />
        <InfoBlock title={t('admin.table.fulfillment')} copy={t(`enum.fulfillment.${rental.fulfillment}`)} />
        <InfoBlock title={t('admin.rentals.deliveryFee')} copy={String(rental.deliveryFee ?? 0)} />
        <InfoBlock title={rental.fulfillment === 'delivery' ? t('common.address') : t('customer.checkout.pickupWindow')} copy={rental.fulfillment === 'delivery' ? rental.address || '-' : rental.pickupWindow || '-'} />
        <InfoBlock title={t('customer.checkout.returnWindow')} copy={rental.returnWindow || '-'} />
        {rental.fulfillment === 'delivery' ? <InfoBlock title={t('customer.checkout.deliveryWindow')} copy={rental.deliveryWindow || '-'} /> : null}
        <InfoBlock title={t('admin.rentals.deliveryNotes')} copy={rental.deliveryNotes || '-'} />
      </div>
    );
  }

  return (
    <div className="payment-delivery-form">
      {paymentEditable ? (
        <SelectField
          label={t('admin.payment.method')}
          value={draft.paymentMethod}
          onValueChange={(paymentMethod) => updateDraft({ paymentMethod })}
          options={paymentMethodOptions}
        />
      ) : (
        <InfoBlock title={t('admin.payment.method')} copy={t(`enum.paymentMethod.${rental.paymentMethod}`)} />
      )}
      <InfoBlock title={t('admin.payment.proof')} copy={t(`enum.payment.${rental.paymentStatus}`)} />
      {planningEditable ? (
        <>
          <Field label={t('admin.rentals.deliveryFee')}>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={draft.deliveryFee ?? 0}
              onChange={(event) => updateDraft({ deliveryFee: Math.max(0, Number(event.target.value) || 0) })}
            />
          </Field>
          <SelectField
            label={t('admin.table.fulfillment')}
            value={draft.fulfillment}
            onValueChange={(fulfillment) => updateDraft({ fulfillment })}
            options={fulfillmentOptions}
          />
          {draft.fulfillment === 'delivery' ? (
            <>
              <Field label={t('common.address')}>
                <input value={draft.address ?? ''} onChange={(event) => updateDraft({ address: event.target.value })} />
              </Field>
              <Field label={t('customer.checkout.deliveryWindow')}>
                <input value={draft.deliveryWindow ?? ''} onChange={(event) => updateDraft({ deliveryWindow: event.target.value })} />
              </Field>
            </>
          ) : (
            <Field label={t('customer.checkout.pickupWindow')}>
              <input value={draft.pickupWindow ?? ''} onChange={(event) => updateDraft({ pickupWindow: event.target.value })} />
            </Field>
          )}
          <Field label={t('customer.checkout.returnWindow')}>
            <input value={draft.returnWindow ?? ''} onChange={(event) => updateDraft({ returnWindow: event.target.value })} />
          </Field>
          <Field label={t('admin.rentals.deliveryNotes')}>
            <input value={draft.deliveryNotes ?? ''} onChange={(event) => updateDraft({ deliveryNotes: event.target.value })} />
          </Field>
        </>
      ) : (
        <div className="info-grid payment-delivery-readout payment-delivery-static">
          <InfoBlock title={t('admin.table.fulfillment')} copy={t(`enum.fulfillment.${rental.fulfillment}`)} />
          <InfoBlock title={t('admin.rentals.deliveryFee')} copy={String(rental.deliveryFee ?? 0)} />
          <InfoBlock title={rental.fulfillment === 'delivery' ? t('common.address') : t('customer.checkout.pickupWindow')} copy={rental.fulfillment === 'delivery' ? rental.address || '-' : rental.pickupWindow || '-'} />
          <InfoBlock title={t('customer.checkout.returnWindow')} copy={rental.returnWindow || '-'} />
          {rental.fulfillment === 'delivery' ? <InfoBlock title={t('customer.checkout.deliveryWindow')} copy={rental.deliveryWindow || '-'} /> : null}
          <InfoBlock title={t('admin.rentals.deliveryNotes')} copy={rental.deliveryNotes || '-'} />
        </div>
      )}
      <button className="secondary-button full payment-delivery-save" type="button" disabled={!dirty} onClick={saveDraft}>
        {t('common.save')}
      </button>
    </div>
  );
}

function makePaymentDraft(rental) {
  return {
    paymentMethod: rental.paymentMethod,
    deliveryFee: rental.deliveryFee ?? 0,
    fulfillment: rental.fulfillment,
    address: rental.address ?? '',
    pickupWindow: rental.pickupWindow ?? '',
    deliveryWindow: rental.deliveryWindow ?? '',
    returnWindow: rental.returnWindow ?? '',
    deliveryNotes: rental.deliveryNotes ?? '',
  };
}

function getNextAction({ selected, canComplete, t, updateRental }) {
  if (selected.lifecycle === 'completed') {
    return {
      title: t('admin.rentals.nextLockedTitle'),
      copy: t('admin.rentals.nextLockedCopy'),
      label: t('admin.rentals.override'),
      icon: Settings,
      disabled: true,
      tone: 'warning',
      onClick: () => {},
    };
  }

  if (selected.lifecycle === 'returned' && !canComplete) {
    const canVerifyProof = selected.paymentStatus === 'attached';
    return {
      title: t('admin.rentals.nextPaymentTitle'),
      copy: t('admin.rentals.nextPaymentCopy'),
      label: canVerifyProof ? t('admin.payment.verify') : t('admin.payment.attach'),
      icon: CreditCard,
      disabled: !canVerifyProof,
      tone: 'warning',
      onClick: () => updateRental(selected.reference, { paymentStatus: 'verified' }, activityText('Bukti bayar diverifikasi.', 'Payment proof verified.')),
    };
  }

  if (selected.lifecycle === 'returned') {
    return {
      lifecycle: 'completed',
      title: t('admin.rentals.nextCompleteTitle'),
      copy: t('admin.rentals.nextCompleteCopy'),
      label: t('admin.rentals.complete'),
      icon: CheckCircle2,
      tone: 'success',
      onClick: () => updateRental(selected.reference, { lifecycle: 'completed' }, activityText('Sewa selesai.', 'Rental completed.')),
    };
  }

  if (selected.lifecycle === 'on_rent' || selected.lifecycle === 'out_delivery') {
    return {
      lifecycle: 'returned',
      title: t('admin.rentals.nextReturnTitle'),
      copy: t('admin.rentals.nextReturnCopy'),
      label: t('admin.rentals.return'),
      icon: Undo2,
      tone: 'info',
      onClick: () => updateRental(selected.reference, { lifecycle: 'returned' }, activityText('Barang kembali.', 'Items returned.')),
    };
  }

  if (selected.lifecycle === 'ready_pickup') {
    return {
      lifecycle: selected.fulfillment === 'delivery' ? 'out_delivery' : 'on_rent',
      title: t('admin.rentals.nextReleaseTitle'),
      copy: selected.fulfillment === 'delivery' ? t('admin.rentals.nextReleaseDeliveryCopy') : t('admin.rentals.nextReleasePickupCopy'),
      label: t('admin.rentals.release'),
      icon: Truck,
      tone: 'info',
      onClick: () => updateRental(selected.reference, { lifecycle: selected.fulfillment === 'delivery' ? 'out_delivery' : 'on_rent' }, activityText('Barang keluar ke pelanggan.', 'Items released to customer.')),
    };
  }

  return {
    lifecycle: 'ready_pickup',
    title: t('admin.rentals.nextReadyTitle'),
    copy: t('admin.rentals.nextReadyCopy'),
    label: t('admin.rentals.ready'),
    icon: PackageCheck,
    tone: 'info',
    onClick: () => updateRental(selected.reference, { lifecycle: 'ready_pickup' }, activityText('Barang siap diambil.', 'Items marked ready.')),
  };
}

function LifecycleRoadmap({ rental, t }) {
  const steps = ['confirmed', 'preparing', 'ready_pickup', rental.fulfillment === 'delivery' ? 'out_delivery' : 'on_rent', 'returned', 'completed'];
  const currentIndex = steps.indexOf(rental.lifecycle);

  const roadmapSteps = steps.map((step, index) => ({
    key: step,
    label: t(`enum.lifecycle.${step}`),
    marker: index + 1,
    className: 'lifecycle-step',
    state: currentIndex === -1
      ? 'upcoming'
      : index < currentIndex || rental.lifecycle === 'completed'
        ? 'done'
        : index === currentIndex
          ? 'current'
          : 'upcoming',
  }));

  return <StepProgress steps={roadmapSteps} ariaLabel={t('admin.rentals.lifecycleAria')} className="lifecycle-roadmap" />;
}
