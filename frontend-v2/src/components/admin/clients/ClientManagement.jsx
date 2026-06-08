import { ChevronRight, Pencil, Phone, Search } from 'lucide-react';
import AdminBottomSheet, { AdminSheetHeader } from '../common/AdminBottomSheet.jsx';
import { AdminCreatePanel } from '../common/AdminManagement.jsx';
import { RentalItems } from '../rentals/RentalRecordComponents.jsx';
import { EmptyState, Field, InfoBlock, PhoneField, StatusPill } from '../../shared.jsx';
import { formatDateRange, normalizePhone } from '../../../lib/rental-utils.js';

export function ClientCreatePanel({ t, newClient, setNewClient, onAdd, onClose }) {
  return (
    <AdminCreatePanel
      id="client-add-panel"
      kicker={t('admin.clients.add')}
      title={t('admin.clients.addHelp')}
      closeLabel={t('common.close')}
      onClose={onClose}
    >
      <div className="form-grid">
        <Field label={t('common.name')}>
          <input value={newClient.name} onChange={(event) => setNewClient((current) => ({ ...current, name: event.target.value }))} />
        </Field>
        <PhoneField label={t('common.phone')} value={newClient.phone} onChange={(event) => setNewClient((current) => ({ ...current, phone: event.target.value }))} />
        <Field label={t('common.email')}>
          <input value={newClient.email} onChange={(event) => setNewClient((current) => ({ ...current, email: event.target.value }))} />
        </Field>
        <Field label={t('common.notes')}>
          <input value={newClient.notes} onChange={(event) => setNewClient((current) => ({ ...current, notes: event.target.value }))} />
        </Field>
      </div>
      <button className="secondary-button full" type="button" onClick={onAdd} disabled={!newClient.name.trim() || !newClient.phone.trim()}>
        {t('common.save')}
      </button>
    </AdminCreatePanel>
  );
}

export function ClientList({ clients, selectedId, t, onView }) {
  return (
    <div className="management-list padded">
      {clients.length === 0 ? (
        <EmptyState title={t('admin.clients.emptyTitle')} copy={t('admin.clients.emptyCopy')} icon={Search} />
      ) : (
        clients.map((client) => (
          <article
            className={`management-card client-card ${selectedId === client.id ? 'selected' : ''}`}
            role="button"
            tabIndex={0}
            key={client.id}
            onClick={() => onView(client.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onView(client.id);
              }
            }}
          >
            <span className="client-avatar" aria-hidden="true">
              <span>{clientInitials(client.name)}</span>
            </span>
            <div className="client-card-main">
              <strong>{client.name}</strong>
              <PhoneLink phone={client.phone} />
            </div>
            <small>{t('admin.clients.totalRentals')}: {client.totalRentals}</small>
            <ChevronRight className="client-card-chevron" aria-hidden="true" />
          </article>
        ))
      )}
    </div>
  );
}

export function ClientDetailSheet({
  t,
  locale,
  selected,
  draft,
  setDraft,
  editMode,
  setEditMode,
  open,
  onClose,
  onSave,
  saveMessage,
  history,
  products,
}) {
  if (!selected || !draft) return null;

  return (
    <AdminBottomSheet
      open={open}
      onClose={onClose}
      role="dialog"
      className="record-panel feature-panel clients-detail-panel"
      backdropClassName="clients-detail-backdrop"
      ariaLabel={t('admin.clients.title')}
      closeLabel={t('common.close')}
    >
      <AdminSheetHeader
        className="record-panel-head"
        kicker={t('admin.clients.title')}
        title={draft.name}
        closeLabel={t('common.close')}
        onClose={onClose}
        closeButtonClassName="client-detail-close"
        groupTitle={false}
      />
      {editMode ? (
        <div className="content-panel compact-panel">
          <div className="form-grid">
            <Field label={t('common.name')}>
              <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
            </Field>
            <PhoneField label={t('common.phone')} value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
            <Field label={t('common.email')}>
              <input value={draft.email || ''} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} />
            </Field>
            <Field label={t('common.notes')}>
              <input value={draft.notes || ''} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
            </Field>
          </div>
          <div className="record-actions wide">
            <button type="button" onClick={onSave}>{t('common.save')}</button>
            <button type="button" onClick={() => { setDraft(selected); setEditMode(false); }}>{t('common.cancel')}</button>
          </div>
        </div>
      ) : (
        <>
          <div className="info-grid">
            <PhoneInfoBlock title={t('common.phone')} phone={selected.phone} />
            <InfoBlock title={t('common.email')} copy={selected.email || '-'} />
            <InfoBlock title={t('admin.clients.lastContact')} copy={selected.lastContact} />
            <InfoBlock title={t('common.notes')} copy={selected.notes} />
          </div>
          <button className="outline-button" type="button" onClick={() => setEditMode(true)}>
            <Pencil aria-hidden="true" />
            {t('common.edit')}
          </button>
        </>
      )}
      {saveMessage ? <p className="success-message">{saveMessage}</p> : null}
      <div className="management-list">
        {history.map((rental) => (
          <article className="history-card" key={rental.reference}>
            <div>
              <strong>{rental.reference}</strong>
              <span> | </span>
              <span>{formatDateRange(rental, locale)}</span>
            </div>
            <RentalItems rental={rental} products={products} t={t} compact />
            <StatusPill type="lifecycle" value={rental.lifecycle} t={t} />
          </article>
        ))}
      </div>
    </AdminBottomSheet>
  );
}

function PhoneInfoBlock({ title, phone }) {
  return (
    <div className="info-block">
      <span>{title}</span>
      <strong>
        <PhoneLink phone={phone} />
      </strong>
    </div>
  );
}

function PhoneLink({ phone }) {
  const visiblePhone = String(phone ?? '').trim();
  if (!visiblePhone) return <span>-</span>;

  const normalized = normalizePhone(visiblePhone);
  const href = normalized ? `https://wa.me/${normalized}` : `tel:${visiblePhone.replace(/\s+/g, '')}`;
  const isWhatsappLink = href.startsWith('https://wa.me/');
  return (
    <a
      className="phone-link"
      href={href}
      target={isWhatsappLink ? '_blank' : undefined}
      rel={isWhatsappLink ? 'noreferrer' : undefined}
      aria-label={`${visiblePhone} ${isWhatsappLink ? 'WhatsApp' : 'telepon'}`}
      onClick={(event) => event.stopPropagation()}
    >
      <Phone aria-hidden="true" />
      {visiblePhone}
    </a>
  );
}

function clientInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? 'C') + (parts[1]?.[0] ?? '');
}
