import { AlertTriangle, CalendarDays, Search, UserRound } from 'lucide-react';
import { RecordPanel } from '../rentals/RentalRecordComponents';
import { EmptyState, MobileDetailShell, StatusPill } from '../../shared';
import { formatDateRange } from '../../../lib/rental-utils';
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
        <>
          <button type="button" onClick={() => onAccept(rental)}>
            {t('admin.requests.accept')}
          </button>
          <button type="button" onClick={() => onEdit(rental)}>{t('common.edit')}</button>
          <button className="danger-action" type="button" onClick={() => onReject(rental)}>{t('admin.requests.reject')}</button>
        </>
      ) : null}
    >
      <RecordPanel rental={rental} products={products} t={t} locale={locale}>
        {!canMutate ? (
          <div className="inline-alert warning">
            <p>{t('admin.requests.notPending')}</p>
          </div>
        ) : null}
      </RecordPanel>
    </MobileDetailShell>
  );
}

type RequestMobileCardsProps = {
  rentals: Rental[];
  selectedRef?: string;
  t: TFunction;
  locale: Locale;
  onSelect: (reference: string) => void;
};

export function RequestMobileCards({ rentals, selectedRef, t, locale, onSelect }: RequestMobileCardsProps) {
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

        return (
          <article className={`request-mobile-card ${isSelected ? 'selected' : ''}`} key={rental.reference}>
            <button className="request-card-summary" type="button" onClick={() => onSelect(rental.reference)}>
              <span className="request-card-head">
                <span className="request-card-title">
                  <strong>{rental.reference}</strong>
                  <small className={isStale ? 'stale-marker' : ''}>
                    {isStale ? <AlertTriangle aria-hidden="true" /> : null}
                    {isStale ? t('admin.record.staleAge') : t('admin.record.newAge')}
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
