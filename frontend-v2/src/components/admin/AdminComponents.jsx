import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, Clock, FileCheck2, FileText, Upload, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Field, InfoBlock, PhoneField, SelectField, StatusPill } from '../shared.jsx';
import { activityText, formatDateRange, productAlt, productCoverImage, productName, variantLabel } from '../../lib/rental-utils.js';

const MAX_PAYMENT_PROOF_BYTES = 700 * 1024;

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
    <DestructiveDialogShell
      open={open}
      setOpen={setOpen}
      title={t('admin.requests.reject')}
      description={t('admin.requests.rejectDialogCopy')}
      actions={(
        <>
          <Dialog.Close asChild>
            <button className="outline-button" type="button">{t('common.cancel')}</button>
          </Dialog.Close>
          <button className="danger-button" type="button" disabled={!reason.trim()} onClick={() => {
            onReject(reason);
            setReason('');
            setOpen(false);
          }}>
            {t('admin.requests.reject')}
          </button>
        </>
      )}
    >
      <Field label={t('admin.requests.rejectReason')}>
        <textarea rows="4" value={reason} onChange={(event) => setReason(event.target.value)} />
      </Field>
    </DestructiveDialogShell>
  );
}

export function OverrideDialog({ open, setOpen, t, onOverride, rental, locale }) {
  const [reason, setReason] = useState('');
  const [targetLifecycle, setTargetLifecycle] = useState('confirmed');
  const lifecycleOptions = getOverrideLifecycleOptions(rental, t);

  useEffect(() => {
    if (!open) return;
    const options = getOverrideLifecycleOptions(rental, t);
    setReason('');
    setTargetLifecycle(options[0]?.value ?? 'confirmed');
  }, [open, rental?.fulfillment, rental?.reference, t]);

  return (
    <DestructiveDialogShell
      open={open}
      setOpen={setOpen}
      title={t('admin.rentals.override')}
      description={t('admin.rentals.overrideDialogCopy')}
      actions={(
        <>
          <Dialog.Close asChild>
            <button className="outline-button" type="button">{t('common.cancel')}</button>
          </Dialog.Close>
          <button className="danger-button" type="button" disabled={!reason.trim()} onClick={() => {
            onOverride({ reason, lifecycle: targetLifecycle });
            setOpen(false);
          }}>
            {t('admin.rentals.override')}
          </button>
        </>
      )}
    >
      {rental ? (
        <div className="destructive-summary" aria-label={t('admin.rentals.overrideSummary')}>
          <InfoBlock title={t('common.reference')} copy={rental.reference} />
          <InfoBlock title={t('common.name')} copy={rental.customerName} />
          <InfoBlock title={t('admin.table.dates')} copy={formatDateRange(rental, locale)} />
          <InfoBlock title={t('common.status')} copy={t(`enum.lifecycle.${rental.lifecycle}`)} />
        </div>
      ) : null}
      <p className="destructive-warning">{t('admin.rentals.overrideConsequence')}</p>
      <SelectField
        label={t('admin.rentals.overrideLifecycle')}
        value={targetLifecycle}
        onValueChange={setTargetLifecycle}
        options={lifecycleOptions}
      />
      <div className="override-reason-field">
        <Field label={t('admin.rentals.overrideReason')}>
          <textarea rows="4" value={reason} onChange={(event) => setReason(event.target.value)} />
        </Field>
      </div>
    </DestructiveDialogShell>
  );
}

function DestructiveDialogShell({ open, setOpen, title, description, children, actions }) {
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content destructive-dialog">
          <div className="dialog-icon danger">
            <AlertTriangle aria-hidden="true" />
          </div>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description className="dialog-description">{description}</Dialog.Description>
          {children}
          <div className="dialog-actions">
            {actions}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function getOverrideLifecycleOptions(rental, t) {
  const releaseLifecycle = rental?.fulfillment === 'delivery' ? 'out_delivery' : 'on_rent';
  return ['confirmed', 'preparing', 'ready_pickup', releaseLifecycle, 'returned'].map((lifecycle) => ({
    value: lifecycle,
    label: t(`enum.lifecycle.${lifecycle}`),
  }));
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
            <PhoneField label={t('common.phone')} value={draft.phone ?? ''} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
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

export function PaymentPanel({ rental, t, updateRental, readOnly = false }) {
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const canReviewProof = !readOnly && rental.paymentStatus === 'attached';
  const proofName = rental.paymentProof?.name;
  const proofUrl = rental.paymentProof?.dataUrl;
  const proofIsImage = String(rental.paymentProof?.type ?? '').startsWith('image/') || String(proofUrl ?? '').startsWith('data:image/');

  const attachProof = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_PAYMENT_PROOF_BYTES) {
      setError(t('admin.payment.fileTooLarge'));
      event.target.value = '';
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      updateRental(
        rental.reference,
        {
          paymentStatus: 'attached',
          paymentProof: {
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            dataUrl: reader.result,
            uploadedAt: new Date().toISOString(),
          },
        },
        activityText('Bukti bayar dilampirkan.', 'Payment proof attached.'),
      );
      event.target.value = '';
    };
    reader.onerror = () => {
      setError(t('admin.payment.fileReadError'));
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const rejectProof = () => {
    const note = rejectReason.trim();
    if (!note) return;
    updateRental(
      rental.reference,
      {
        paymentStatus: 'rejected',
        internalNotes: rental.internalNotes ? `${rental.internalNotes}\n${note}` : note,
      },
      activityText(`Bukti bayar ditolak: ${note}`, `Payment proof rejected: ${note}`),
    );
    setRejectReason('');
    setRejectOpen(false);
  };

  return (
    <>
      <div className="content-panel compact-panel">
        <span className="section-kicker">{t('admin.payment.title')}</span>
        <div className="info-grid compact">
          <InfoBlock title={t('admin.payment.method')} copy={t(`enum.paymentMethod.${rental.paymentMethod}`)} />
          <InfoBlock title={t('admin.payment.proof')} copy={t(`enum.payment.${rental.paymentStatus}`)} />
        </div>
        {proofName ? (
          <div className="payment-proof-file">
            <FileText aria-hidden="true" />
            <div>
              <strong>{proofName}</strong>
              <span>{formatFileSize(rental.paymentProof.size)}</span>
            </div>
          </div>
        ) : (
          <p className="helper-text">{t('admin.payment.noProof')}</p>
        )}
        {proofUrl ? (
          <a className="payment-proof-preview" href={proofUrl} target="_blank" rel="noreferrer">
            {proofIsImage ? <img src={proofUrl} alt={proofName || t('admin.payment.proof')} /> : <FileText aria-hidden="true" />}
            <span>{t('admin.payment.openProof')}</span>
          </a>
        ) : null}
        {!readOnly ? (
          <>
            <input
              className="visually-hidden"
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={attachProof}
            />
            <div className="record-actions wide payment-review-actions">
              <button type="button" onClick={() => fileInputRef.current?.click()}>
                <Upload aria-hidden="true" />
                {t('admin.payment.attach')}
              </button>
              <button type="button" disabled={!canReviewProof} onClick={() => updateRental(rental.reference, { paymentStatus: 'verified' }, activityText('Bukti bayar diverifikasi.', 'Payment proof verified.'))}>
                <FileCheck2 aria-hidden="true" />
                {t('admin.payment.verify')}
              </button>
              <button className="danger-action" type="button" disabled={!canReviewProof} onClick={() => setRejectOpen(true)}>
                <XCircle aria-hidden="true" />
                {t('admin.payment.reject')}
              </button>
            </div>
          </>
        ) : null}
        {error ? <p className="validation-message" role="alert">{error}</p> : null}
      </div>
      <DestructiveDialogShell
        open={rejectOpen}
        setOpen={setRejectOpen}
        title={t('admin.payment.rejectDialogTitle')}
        description={t('admin.payment.rejectDialogCopy')}
        actions={(
          <>
            <Dialog.Close asChild>
              <button className="outline-button" type="button">{t('common.cancel')}</button>
            </Dialog.Close>
            <button className="danger-button" type="button" disabled={!rejectReason.trim()} onClick={rejectProof}>
              {t('admin.payment.reject')}
            </button>
          </>
        )}
      >
        <div className="destructive-summary">
          <InfoBlock title={t('common.reference')} copy={rental.reference} />
          <InfoBlock title={t('admin.payment.method')} copy={t(`enum.paymentMethod.${rental.paymentMethod}`)} />
          <InfoBlock title={t('admin.payment.proof')} copy={proofName || t(`enum.payment.${rental.paymentStatus}`)} />
        </div>
        <Field label={t('admin.payment.rejectReason')}>
          <textarea rows="4" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} />
        </Field>
      </DestructiveDialogShell>
    </>
  );
}

function formatFileSize(size = 0) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
            {!compact ? <img src={productCoverImage(product, t)} alt={productAlt(product, t)} /> : null}
            <div>
              <strong>{productName(product, t)}</strong>
              <small>{variantLabel(t, item.variantId)} x {item.qty}</small>
            </div>
          </div>
        ) : null;
      })}
    </div>
  );
}
