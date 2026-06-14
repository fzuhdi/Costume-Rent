import { AlertTriangle, CalendarDays, Clock3, LockKeyhole, Search, UserRound } from 'lucide-react';
import { RecordActionBar } from '../common/AdminManagement';
import { ActivityLog, RentalItems } from '../rentals/RentalRecordComponents';
import { EmptyState, MobileDetailShell, StatusPill } from '../../shared';
import { formatDateRange, productName, variantLabel } from '../../../lib/rental-utils';
import type { Locale, Product, Rental, TFunction } from '../../../types/domain';

type RequestMobileDetailProps = {
  rental: Rental;
  products: Product[];
  t: TFunction;
  locale: Locale;
  canMutate: boolean;
  onBack: () => void;
  onAccept: (rental: Rental) => void;
  onEdit: (rental: Rental) => void;
  onReject: (rental: Rental) => void;
};

export function RequestMobileDetail({ rental, products, t, locale, canMutate, onBack, onAccept, onEdit, onReject }: RequestMobileDetailProps) {
  return (
    <MobileDetailShell
      className="request-mobile-detail-view request-detail-shell"
      backLabel={t('admin.nav.requests')}
      title={rental.reference}
      onBack={onBack}
      actionLabel={t('admin.common.detailActions')}
      actionClassName="request-detail-actionbar"
      actions={canMutate ? (
        <RequestDecisionBar
          rental={rental}
          t={t}
          onAccept={onAccept}
          onEdit={onEdit}
          onReject={onReject}
          className="request-mobile-decisionbar"
          showStatus={false}
        />
      ) : null}
    >
      <RequestReviewPanel
        rental={rental}
        products={products}
        t={t}
        locale={locale}
        canMutate={canMutate}
        showActions={false}
        onAccept={onAccept}
        onEdit={onEdit}
        onReject={onReject}
      />
    </MobileDetailShell>
  );
}

type RequestMobileCardsProps = {
  rentals: Rental[];
  selectedRef?: string;
  products: Product[];
  t: TFunction;
  locale: Locale;
  onSelect: (reference: string) => void;
};

export function RequestMobileCards({ rentals, selectedRef, products, t, locale, onSelect }: RequestMobileCardsProps) {
  if (rentals.length === 0) {
    return (
      <div className="request-mobile-list">
        <EmptyState title={t('common.empty')} copy="" icon={Search} />
      </div>
    );
  }

  return (
    <div className="request-mobile-list" aria-label={t('admin.tabs.aria')}>
      {rentals.map((rental) => {
        const isSelected = selectedRef === rental.reference;
        const isStale = rental.staleHours >= 24;
        const itemSummary = requestItemSummary(rental, products, t);

        return (
          <article className={`record-mobile-card request-mobile-card ${isSelected ? 'selected' : ''} ${isStale ? 'is-stale' : ''}`.trim()} key={rental.reference}>
            <button className="request-card-summary" type="button" aria-current={isSelected ? 'true' : undefined} onClick={() => onSelect(rental.reference)}>
              <span className="request-card-head">
                <span className="request-card-title">
                  <strong>{rental.reference}</strong>
                  <small className={isStale ? 'stale-marker' : ''}>
                    {isStale ? <AlertTriangle aria-hidden="true" /> : null}
                    {requestAgeLabel(rental, locale)}
                  </small>
                </span>
                <StatusPill type="lifecycle" value={rental.lifecycle} t={t} />
              </span>
              <span className="request-card-meta">
                <span>
                  <UserRound aria-hidden="true" />
                  <span>{rental.customerName}</span>
                </span>
                <span>
                  <CalendarDays aria-hidden="true" />
                  <span>{formatDateRange(rental, locale)}</span>
                </span>
              </span>
              <span className="request-card-items">
                <span>{t('admin.requests.requestedItems')}</span>
                <strong>{itemSummary}</strong>
              </span>
              <span className="request-card-badges">
                <StatusPill type="fulfillment" value={rental.fulfillment} t={t} />
                <StatusPill type="payment" value={rental.paymentStatus} t={t} />
              </span>
              <span className="request-card-view">{t('common.view')}</span>
            </button>
          </article>
        );
      })}
    </div>
  );
}

type RequestReviewPanelProps = {
  rental: Rental;
  products: Product[];
  t: TFunction;
  locale: Locale;
  canMutate: boolean;
  showActions?: boolean;
  onAccept: (rental: Rental) => void;
  onEdit: (rental: Rental) => void;
  onReject: (rental: Rental) => void;
};

export function RequestReviewPanel({
  rental,
  products,
  t,
  locale,
  canMutate,
  showActions = true,
  onAccept,
  onEdit,
  onReject,
}: RequestReviewPanelProps) {
  const isStale = rental.staleHours >= 24;
  const requestAge = requestAgeLabel(rental, locale);

  return (
    <aside className={`record-panel request-review-panel ${isStale ? 'is-stale' : ''}`.trim()} aria-label={t('admin.requests.reviewAria')}>
      <div className="record-panel-head request-review-head">
        <span className="eyebrow">{t('admin.requests.reviewKicker')}</span>
        <strong>{rental.reference}</strong>
      </div>

      <section className="request-review-customer" aria-label={t('admin.table.customer')}>
        <span className="section-kicker">{t('admin.table.customer')}</span>
        <strong>{rental.customerName}</strong>
        <span>{rental.phone}</span>
        {rental.email ? <span>{rental.email}</span> : null}
      </section>

      <div className="inline-status request-review-status" aria-label={t('common.status')}>
        <StatusPill type="lifecycle" value={rental.lifecycle} t={t} />
        <StatusPill type="fulfillment" value={rental.fulfillment} t={t} />
        <StatusPill type="payment" value={rental.paymentStatus} t={t} />
        <StatusPill value={requestAge} t={t} tone={isStale ? 'warning' : 'info'} icon={isStale ? AlertTriangle : Clock3} />
      </div>

      <section className="request-review-section request-review-items">
        <span className="section-kicker">{t('admin.requests.requestedItems')}</span>
        <RentalItems rental={rental} products={products} t={t} />
      </section>

      <dl className="record-fields request-review-fields">
        <div>
          <dt>{t('admin.panel.date')}</dt>
          <dd>{formatDateRange(rental, locale)}</dd>
        </div>
        <div>
          <dt>{t('admin.panel.fulfillment')}</dt>
          <dd>{fulfillmentDetail(rental, t)}</dd>
        </div>
        <div>
          <dt>{t('admin.table.payment')}</dt>
          <dd>{paymentDetail(rental, t)}</dd>
        </div>
        <div>
          <dt>{t('admin.requests.staleAge')}</dt>
          <dd>{requestAge}</dd>
        </div>
        <div>
          <dt>{t('common.notes')}</dt>
          <dd>{rental.notes || '-'}</dd>
        </div>
        <div>
          <dt>{t('admin.common.internalNotes')}</dt>
          <dd>{rental.internalNotes || '-'}</dd>
        </div>
      </dl>

      {canMutate && showActions ? (
        <RequestDecisionBar rental={rental} t={t} onAccept={onAccept} onEdit={onEdit} onReject={onReject} />
      ) : null}

      {!canMutate ? <RequestLockedState t={t} /> : null}

      <ActivityLog rental={rental} locale={locale} t={t} />
    </aside>
  );
}

type RequestDecisionBarProps = {
  rental: Rental;
  t: TFunction;
  onAccept: (rental: Rental) => void;
  onEdit: (rental: Rental) => void;
  onReject: (rental: Rental) => void;
  className?: string;
  showStatus?: boolean;
};

export function RequestDecisionBar({
  rental,
  t,
  onAccept,
  onEdit,
  onReject,
  className = '',
  showStatus = true,
}: RequestDecisionBarProps) {
  return (
    <RecordActionBar
      className={`request-decision-bar ${className}`.trim()}
      label={t('admin.common.detailActions')}
      status={showStatus ? t('admin.requests.decisionReady') : undefined}
      primary={(
        <button type="button" onClick={() => onAccept(rental)}>
          {t('admin.requests.accept')}
        </button>
      )}
      secondary={<button type="button" onClick={() => onEdit(rental)}>{t('admin.requests.editRental')}</button>}
      destructive={<button className="danger-action" type="button" onClick={() => onReject(rental)}>{t('admin.requests.reject')}</button>}
    />
  );
}

function RequestLockedState({ t }: { t: TFunction }) {
  return (
    <div className="inline-alert warning request-locked-state">
      <LockKeyhole aria-hidden="true" />
      <div>
        <strong>{t('admin.requests.lockedTitle')}</strong>
        <p>{t('admin.requests.notPending')}</p>
      </div>
    </div>
  );
}

function requestItemSummary(rental: Rental, products: Product[], t: TFunction) {
  const items = rental.items
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) return '';
      return `${productName(product, t)} - ${variantLabel(t, item.variantId)} x ${item.qty}`;
    })
    .filter(Boolean);
  return items.length ? items.join(', ') : '-';
}

function requestAgeLabel(rental: Rental, locale: Locale) {
  const hours = Math.max(0, Number(rental.staleHours) || 0);
  if (locale === 'id') return hours >= 24 ? `Tertahan ${hours} jam` : `Baru ${hours} jam`;
  return hours >= 24 ? `Stale ${hours} hours` : `New ${hours} hours`;
}

function fulfillmentDetail(rental: Rental, t: TFunction) {
  if (rental.fulfillment === 'delivery') {
    const detail = rental.deliveryWindow || rental.address || rental.deliveryNotes;
    return detail ? `${t('enum.fulfillment.delivery')} - ${detail}` : t('enum.fulfillment.delivery');
  }
  return rental.pickupWindow ? `${t('enum.fulfillment.pickup')} - ${rental.pickupWindow}` : t('enum.fulfillment.pickup');
}

function paymentDetail(rental: Rental, t: TFunction) {
  const proofName = rental.paymentProof?.name ?? rental.paymentProofName;
  const status = t(`enum.payment.${rental.paymentStatus}`);
  return proofName ? `${status} - ${proofName}` : status;
}
