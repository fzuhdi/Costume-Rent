import {
  AlertTriangle,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  PackageCheck,
  Search,
  Settings,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PaymentPanel } from './PaymentPanel';
import { ActivityLog, Checklist, RentalItems } from './RentalRecordComponents';
import { EmptyState, Field, InfoBlock, MobileDetailShell, SearchInput, SelectField, StatusPill, StepProgress } from '../../shared';
import { activityText, formatDateRange } from '../../../lib/rental-utils';
import type { StateSetter } from '../../../types/app';
import type { FulfillmentMethod, Locale, PaymentMethod, Product, Rental, RentalLifecycle, TFunction } from '../../../types/domain';
import type {
  NextRentalAction,
  PaymentDeliveryDraft,
  RentalFilter,
  RentalTransitionAction,
  UpdateRental,
} from './rentalWorkflowTypes';

type RentalListViewProps = {
  t: TFunction;
  locale: Locale;
  query: string;
  setQuery: StateSetter<string>;
  statusFilter: RentalFilter;
  filterCounts: Record<RentalFilter, number>;
  rentalFilters: RentalFilter[];
  filteredRentals: Rental[];
  selected?: Rental;
  onStatusFilterChange: (status: RentalFilter) => void;
  onSelectRental: (reference: string) => void;
};

export function RentalListView({
  t,
  locale,
  query,
  setQuery,
  statusFilter,
  filterCounts,
  rentalFilters,
  filteredRentals,
  selected,
  onStatusFilterChange,
  onSelectRental,
}: RentalListViewProps) {
  return (
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
              onClick={() => onStatusFilterChange(filter)}
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
            <button className={`management-card rental-record-card ${selected?.reference === rental.reference ? 'selected' : ''}`} type="button" key={rental.reference} onClick={() => onSelectRental(rental.reference)}>
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
  );
}

type RentalWorkflowDetailProps = {
  selected: Rental;
  t: TFunction;
  locale: Locale;
  products: Product[];
  updateRental: UpdateRental;
  onBack: () => void;
  nextAction: NextRentalAction | null;
  manualTransitions: RentalTransitionAction[];
  NextActionIcon: LucideIcon;
  isCompleted: boolean;
  canComplete: boolean;
  correctionOpen: boolean;
  setCorrectionOpen: StateSetter<boolean>;
  setOverrideOpen: StateSetter<boolean>;
  planningEditable: boolean;
  showChecklist: boolean;
};

export function RentalWorkflowDetail({
  selected,
  t,
  locale,
  products,
  updateRental,
  onBack,
  nextAction,
  manualTransitions,
  NextActionIcon,
  isCompleted,
  canComplete,
  correctionOpen,
  setCorrectionOpen,
  setOverrideOpen,
  planningEditable,
  showChecklist,
}: RentalWorkflowDetailProps) {
  return (
    <MobileDetailShell
      className="rental-detail-view rental-detail-shell"
      backLabel={t('admin.nav.rentals')}
      title={selected.reference}
      onBack={onBack}
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
              planningEditable={planningEditable}
            />
          </section>
        </div>

        {!isCompleted && showChecklist ? (
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
  );
}

function getRentalItemCount(rental: Rental): number {
  return rental.items.reduce((sum, item) => sum + item.qty, 0);
}

type PaymentDeliveryEditorProps = {
  rental: Rental;
  t: TFunction;
  updateRental: UpdateRental;
  paymentEditable: boolean;
  planningEditable: boolean;
};

function PaymentDeliveryEditor({ rental, t, updateRental, paymentEditable, planningEditable }: PaymentDeliveryEditorProps) {
  const [draft, setDraft] = useState(() => makePaymentDraft(rental));
  const paymentMethods: PaymentMethod[] = ['bank_transfer', 'qris', 'cash', 'other'];
  const paymentMethodOptions = paymentMethods.map((method) => ({
    value: method,
    label: t(`enum.paymentMethod.${method}`),
  }));
  const fulfillments: FulfillmentMethod[] = ['pickup', 'delivery'];
  const fulfillmentOptions = fulfillments.map((fulfillment) => ({
    value: fulfillment,
    label: t(`enum.fulfillment.${fulfillment}`),
  }));

  useEffect(() => {
    setDraft(makePaymentDraft(rental));
  }, [rental.reference]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(makePaymentDraft(rental));
  const updateDraft = (patch: Partial<PaymentDeliveryDraft>) => setDraft((current) => ({ ...current, ...patch }));
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
          onValueChange={(paymentMethod) => updateDraft({ paymentMethod: paymentMethod as PaymentMethod })}
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
            onValueChange={(fulfillment) => updateDraft({ fulfillment: fulfillment as FulfillmentMethod })}
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

function makePaymentDraft(rental: Rental): PaymentDeliveryDraft {
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

type LifecycleRoadmapProps = {
  rental: Rental;
  t: TFunction;
};

function LifecycleRoadmap({ rental, t }: LifecycleRoadmapProps) {
  const steps: RentalLifecycle[] = ['confirmed', 'preparing', 'ready_pickup', rental.fulfillment === 'delivery' ? 'out_delivery' : 'on_rent', 'returned', 'completed'];
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
