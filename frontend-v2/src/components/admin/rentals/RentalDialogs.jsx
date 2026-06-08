
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Field, InfoBlock, PhoneField, SelectField } from '../../shared.jsx';
import { formatDateRange } from '../../../lib/rental-utils.js';

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

export function DestructiveDialogShell({ open, setOpen, title, description, children, actions }) {
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
