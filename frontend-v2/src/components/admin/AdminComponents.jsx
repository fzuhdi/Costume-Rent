import * as Dialog from '@radix-ui/react-dialog';
import { Clock, FileCheck2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Field, InfoBlock, StatusPill } from '../shared.jsx';
import { activityText, formatDateRange, variantLabel } from '../../lib/rental-utils.js';

export function RecordPanel({ rental, products, t, locale, children }) {
  return (
    <aside className="record-panel" aria-label={t('admin.panel.aria')}>
      <div className="record-panel-head">
        <span className="eyebrow">{t('admin.common.selected')}</span>
        <strong>{rental.reference}</strong>
      </div>
      <p>{t('admin.panel.copy')}</p>
      <div className="inline-status">
        <StatusPill type="lifecycle" value={rental.lifecycle} t={t} />
        <StatusPill type="payment" value={rental.paymentStatus} t={t} />
      </div>
      <RentalItems rental={rental} products={products} t={t} />
      <dl className="record-fields">
        <div>
          <dt>{t('admin.panel.date')}</dt>
          <dd>{formatDateRange(rental, locale)}</dd>
        </div>
        <div>
          <dt>{t('admin.panel.fulfillment')}</dt>
          <dd>{t(`enum.fulfillment.${rental.fulfillment}`)}</dd>
        </div>
        <div>
          <dt>{t('common.phone')}</dt>
          <dd>{rental.phone}</dd>
        </div>
        <div>
          <dt>{t('common.notes')}</dt>
          <dd>{rental.notes || '-'}</dd>
        </div>
      </dl>
      {children}
      <ActivityLog rental={rental} locale={locale} t={t} />
    </aside>
  );
}

export function RejectDialog({ open, setOpen, t, onReject }) {
  const [reason, setReason] = useState('');
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>{t('admin.requests.reject')}</Dialog.Title>
          <Field label={t('admin.requests.rejectReason')}>
            <textarea rows="4" value={reason} onChange={(event) => setReason(event.target.value)} />
          </Field>
          <div className="dialog-actions">
            <Dialog.Close asChild>
              <button className="outline-button" type="button">{t('common.cancel')}</button>
            </Dialog.Close>
            <button className="ghost-button" type="button" disabled={!reason.trim()} onClick={() => {
              onReject(reason);
              setReason('');
              setOpen(false);
            }}>
              {t('admin.requests.reject')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function OverrideDialog({ open, setOpen, t, onOverride }) {
  const [reason, setReason] = useState('');
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>{t('admin.rentals.override')}</Dialog.Title>
          <Field label={t('admin.rentals.overrideReason')}>
            <textarea rows="4" value={reason} onChange={(event) => setReason(event.target.value)} />
          </Field>
          <div className="dialog-actions">
            <Dialog.Close asChild>
              <button className="outline-button" type="button">{t('common.cancel')}</button>
            </Dialog.Close>
            <button className="ghost-button" type="button" disabled={!reason.trim()} onClick={() => {
              onOverride(reason);
              setReason('');
              setOpen(false);
            }}>
              {t('admin.rentals.override')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function EditRentalDialog({ open, setOpen, rental, t, onSave }) {
  const [draft, setDraft] = useState(rental ?? {});

  useEffect(() => {
    setDraft(rental ?? {});
  }, [rental]);

  if (!rental) return null;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content wide-dialog">
          <Dialog.Title>{t('admin.requests.editRental')}</Dialog.Title>
          <div className="form-grid">
            <Field label={t('common.name')}>
              <input value={draft.customerName ?? ''} onChange={(event) => setDraft((current) => ({ ...current, customerName: event.target.value }))} />
            </Field>
            <Field label={t('common.phone')}>
              <input value={draft.phone ?? ''} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
            </Field>
            <Field label={t('common.dateStart')}>
              <input type="date" value={draft.start ?? ''} onChange={(event) => setDraft((current) => ({ ...current, start: event.target.value }))} />
            </Field>
            <Field label={t('common.dateEnd')}>
              <input type="date" value={draft.end ?? ''} onChange={(event) => setDraft((current) => ({ ...current, end: event.target.value }))} />
            </Field>
          </div>
          <Field label={t('admin.common.internalNotes')}>
            <textarea rows="3" value={draft.internalNotes ?? ''} onChange={(event) => setDraft((current) => ({ ...current, internalNotes: event.target.value }))} />
          </Field>
          <div className="dialog-actions">
            <Dialog.Close asChild>
              <button className="outline-button" type="button">{t('common.cancel')}</button>
            </Dialog.Close>
            <button className="primary-button" type="button" onClick={() => {
              onSave(draft);
              setOpen(false);
            }}>
              {t('admin.requests.saveEdit')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function PaymentPanel({ rental, t, updateRental }) {
  return (
    <div className="content-panel compact-panel">
      <span className="section-kicker">{t('admin.payment.title')}</span>
      <div className="info-grid compact">
        <InfoBlock title={t('admin.payment.method')} copy={t(`enum.paymentMethod.${rental.paymentMethod}`)} />
        <InfoBlock title={t('admin.payment.proof')} copy={t(`enum.payment.${rental.paymentStatus}`)} />
      </div>
      <div className="record-actions wide">
        <button type="button" onClick={() => updateRental(rental.reference, { paymentStatus: 'attached' }, activityText('Bukti bayar dilampirkan.', 'Payment proof attached.'))}>
          <Upload aria-hidden="true" />
          {t('admin.payment.attach')}
        </button>
        <button type="button" onClick={() => updateRental(rental.reference, { paymentStatus: 'verified' }, activityText('Bukti bayar diverifikasi.', 'Payment proof verified.'))}>
          <FileCheck2 aria-hidden="true" />
          {t('admin.payment.verify')}
        </button>
        <button className="danger-action" type="button" onClick={() => updateRental(rental.reference, { paymentStatus: 'rejected' }, activityText('Bukti bayar ditolak.', 'Payment proof rejected.'))}>
          {t('admin.payment.reject')}
        </button>
      </div>
    </div>
  );
}

export function Checklist({ rental, locale, onToggle, t }) {
  return (
    <div className="checklist">
      <span className="section-kicker">{t('admin.rentals.checklist')}</span>
      {rental.checklist.map((item) => (
        <label className="checkbox-row" key={item.id}>
          <input type="checkbox" checked={item.done} onChange={() => onToggle(item.id)} />
          <span>{locale === 'id' ? item.labelId : item.labelEn}</span>
        </label>
      ))}
    </div>
  );
}

export function ActivityLog({ rental, locale, t }) {
  return (
    <div className="activity-log">
      <span className="section-kicker">{t('admin.common.activity')}</span>
      {rental.activity.map((item) => (
        <div className="activity-item" key={item.id}>
          <Clock aria-hidden="true" />
          <div>
            <strong>{item.time}</strong>
            <p>{locale === 'id' ? item.textId : item.textEn}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RentalItems({ rental, products, t, compact = false }) {
  return (
    <div className={`rental-items ${compact ? 'compact' : ''}`}>
      {rental.items.map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        return product ? (
          <div className="rental-item" key={`${rental.reference}-${item.productId}-${item.variantId}`}>
            {!compact ? <img src={product.image} alt={t(product.altKey)} /> : null}
            <div>
              <strong>{t(product.nameKey)}</strong>
              <small>{variantLabel(t, item.variantId)} x {item.qty}</small>
            </div>
          </div>
        ) : null;
      })}
    </div>
  );
}
