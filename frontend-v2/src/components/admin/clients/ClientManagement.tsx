import { useEffect, useMemo, useRef, type Dispatch, type MouseEvent, type SetStateAction } from 'react';
import { ChevronRight, Clock3, History, Mail, MessageCircle, MoreHorizontal, Pencil, Phone, PhoneCall, Search, Trash2 } from 'lucide-react';
import AdminBottomSheet, { AdminSheetHeader } from '../common/AdminBottomSheet';
import { AdminCreatePanel, RecordActionBar } from '../common/AdminManagement';
import { RentalItems } from '../rentals/RentalRecordComponents';
import { EmptyState, EntityCard, EntityList, Field, InfoBlock, PhoneField, StatusPill } from '../../shared';
import { formatDateRange, normalizePhone } from '../../../lib/rental-utils';
import type { Client, Locale, Product, Rental, TFunction } from '../../../types/domain';
import type { StateSetter } from '../../../types/app';

export type NewClientDraft = {
  name: string;
  phone: string;
  email: string;
  notes: string;
};

export type ClientRentalSummary = {
  totalRentals: number;
  activeCount: number;
  overdueCount: number;
  latestLifecycle?: Rental['lifecycle'];
};

type ClientCreatePanelProps = {
  t: TFunction;
  newClient: NewClientDraft;
  setNewClient: StateSetter<NewClientDraft>;
  onAdd: () => void;
  onClose: () => void;
};

export function ClientCreatePanel({ t, newClient, setNewClient, onAdd, onClose }: ClientCreatePanelProps) {
  return (
    <AdminCreatePanel
      id="client-add-panel"
      className="client-create-panel"
      kicker={t('admin.clients.add')}
      title={t('admin.clients.addHelp')}
      closeLabel={t('common.close')}
      onClose={onClose}
    >
      <div className="form-grid client-form-grid">
        <Field label={t('common.name')}>
          <input value={newClient.name} onChange={(event) => setNewClient((current) => ({ ...current, name: event.target.value }))} />
        </Field>
        <PhoneField label={t('common.phone')} value={newClient.phone} onChange={(event) => setNewClient((current) => ({ ...current, phone: event.target.value }))} />
        <Field label={t('common.email')}>
          <input type="email" value={newClient.email} onChange={(event) => setNewClient((current) => ({ ...current, email: event.target.value }))} />
        </Field>
        <Field label={t('common.notes')} className="field-wide">
          <textarea rows={3} value={newClient.notes} onChange={(event) => setNewClient((current) => ({ ...current, notes: event.target.value }))} />
        </Field>
      </div>
      <button className="secondary-button full" type="button" onClick={onAdd} disabled={!newClient.name.trim() || !newClient.phone.trim()}>
        {t('common.save')}
      </button>
    </AdminCreatePanel>
  );
}

type ClientListProps = {
  clients: Client[];
  selectedId?: string;
  summariesByClientId: Record<string, ClientRentalSummary>;
  t: TFunction;
  onView: (clientId: string) => void;
};

export function ClientList({ clients, selectedId, summariesByClientId, t, onView }: ClientListProps) {
  return (
    <EntityList className="management-list padded client-directory-list">
      {clients.length === 0 ? (
        <EmptyState title={t('admin.clients.emptyTitle')} copy={t('admin.clients.emptyCopy')} icon={Search} />
      ) : (
        clients.map((client) => {
          const summary = summariesByClientId[client.id];
          const selected = selectedId === client.id;
          const openLabel = `${t('admin.clients.openDetail')} ${client.name}`;

          return (
            <EntityCard
              as="article"
              className={`management-card client-card ${selected ? 'selected' : ''}`}
              selected={selected}
              aria-current={selected ? 'true' : undefined}
              key={client.id}
              avatar={(
                <span className="client-avatar" aria-hidden="true">
                  <span>{clientInitials(client.name)}</span>
                </span>
              )}
              meta={<ClientCardMeta client={client} summary={summary} t={t} />}
              actions={(
                <button className="icon-button client-card-detail-action" type="button" aria-label={openLabel} onClick={() => onView(client.id)}>
                  <ChevronRight aria-hidden="true" />
                </button>
              )}
            >
              <div className="client-card-main">
                <button className="client-card-name" type="button" aria-label={openLabel} onClick={() => onView(client.id)}>
                  <strong>{client.name}</strong>
                </button>
                <PhoneLink phone={client.phone} destination="whatsapp" />
              </div>
            </EntityCard>
          );
        })
      )}
    </EntityList>
  );
}

type ClientDetailSheetProps = {
  t: TFunction;
  locale: Locale;
  selected: Client | null;
  draft: Client | null;
  setDraft: Dispatch<SetStateAction<Client | null>>;
  editMode: boolean;
  setEditMode: StateSetter<boolean>;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  saveMessage: string;
  history: Rental[];
  products: Product[];
  summary?: ClientRentalSummary;
  onRequestDelete: (client: Client) => void;
};

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
  summary,
  onRequestDelete,
}: ClientDetailSheetProps) {
  const editButtonRef = useRef<HTMLButtonElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const wasEditingRef = useRef(editMode);
  const recentHistory = useMemo(() => history.slice(0, 2), [history]);
  const olderHistory = useMemo(() => history.slice(2), [history]);
  const recentHistoryGroups = useMemo(() => groupHistoryByLifecycle(recentHistory), [recentHistory]);
  const olderHistoryGroups = useMemo(() => groupHistoryByLifecycle(olderHistory), [olderHistory]);

  useEffect(() => {
    if (editMode) {
      window.requestAnimationFrame(() => firstFieldRef.current?.focus());
    } else if (wasEditingRef.current) {
      window.requestAnimationFrame(() => editButtonRef.current?.focus());
    }
    wasEditingRef.current = editMode;
  }, [editMode]);

  if (!selected || !draft) return null;

  const clientStatus = getClientStatus(summary, t);
  const totalRentals = summary?.totalRentals ?? selected.totalRentals;
  const saveDisabled = !draft.name.trim() || !draft.phone.trim();
  const updateDraftField = (field: 'name' | 'phone' | 'email' | 'notes', value: string) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  return (
    <AdminBottomSheet
      open={open}
      onClose={onClose}
      role="dialog"
      modal={false}
      mountWhenClosed
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
        <div className="content-panel compact-panel client-edit-panel">
          <div className="form-grid client-form-grid">
            <Field label={t('common.name')}>
              <input ref={firstFieldRef} value={draft.name} onChange={(event) => updateDraftField('name', event.target.value)} />
            </Field>
            <PhoneField label={t('common.phone')} value={draft.phone} onChange={(event) => updateDraftField('phone', event.target.value)} />
            <Field label={t('common.email')}>
              <input type="email" value={draft.email || ''} onChange={(event) => updateDraftField('email', event.target.value)} />
            </Field>
            <Field label={t('common.notes')} className="field-wide">
              <textarea rows={4} value={draft.notes || ''} onChange={(event) => updateDraftField('notes', event.target.value)} />
            </Field>
          </div>
          <RecordActionBar
            className="wide client-edit-actions"
            label={t('admin.clients.editDetails')}
            primary={<button type="button" onClick={onSave} disabled={saveDisabled}>{t('common.save')}</button>}
            secondary={<button type="button" onClick={() => { setDraft(selected); setEditMode(false); }}>{t('common.cancel')}</button>}
          />
        </div>
      ) : (
        <>
          <div className="client-relationship-head">
            <div className="client-identity-block">
              <span className="client-avatar client-avatar-large" aria-hidden="true">
                <span>{clientInitials(selected.name)}</span>
              </span>
              <div className="client-identity-copy">
                <strong>{selected.name}</strong>
                <span>{t('admin.clients.totalRentals')}: {totalRentals}</span>
                {clientStatus ? <ClientStatusBadge status={clientStatus} /> : null}
              </div>
            </div>
            <div className="client-contact-actions" aria-label={t('admin.clients.contactActions')}>
              <ContactActionLink phone={selected.phone} destination="whatsapp" label={t('admin.clients.whatsapp')} />
              <ContactActionLink phone={selected.phone} destination="call" label={t('admin.clients.call')} />
              {selected.email ? (
                <a className="outline-button client-contact-link" href={`mailto:${selected.email}`} aria-label={`${t('common.email')} ${selected.email}`}>
                  <Mail aria-hidden="true" />
                  {t('common.email')}
                </a>
              ) : null}
              <button ref={editButtonRef} className="outline-button client-edit-action" type="button" onClick={() => setEditMode(true)}>
                <Pencil aria-hidden="true" />
                {t('common.edit')}
              </button>
            </div>
          </div>

          <div className="info-grid client-info-grid">
            <PhoneInfoBlock title={t('common.phone')} phone={selected.phone} />
            <InfoBlock title={t('common.email')} copy={selected.email || '-'} />
            <InfoBlock title={t('admin.clients.lastContact')} copy={selected.lastContact || '-'} />
            <InfoBlock title={t('admin.clients.recentStatus')} copy={summary?.latestLifecycle ? t(`enum.lifecycle.${summary.latestLifecycle}`) : '-'} />
          </div>

          <section className="client-notes-panel" aria-labelledby="client-notes-heading">
            <div className="client-section-head">
              <span className="section-kicker" id="client-notes-heading">{t('common.notes')}</span>
            </div>
            <p>{selected.notes || '-'}</p>
          </section>

          <section className="client-secondary-actions" aria-label={t('admin.clients.secondaryActions')}>
            <button className="outline-button client-overflow-action" type="button" onClick={() => onRequestDelete(selected)}>
              <MoreHorizontal aria-hidden="true" />
              {t('admin.clients.moreActions')}
            </button>
          </section>
        </>
      )}

      <div className={`client-save-feedback ${saveMessage ? 'visible' : ''}`} role="status" aria-live="polite" aria-atomic="true">
        {saveMessage}
      </div>

      <section className="client-history-section" aria-labelledby="client-history-heading">
        <div className="client-section-head">
          <span className="section-kicker" id="client-history-heading">{t('admin.clients.history')}</span>
          <strong>{history.length}</strong>
        </div>
        {recentHistoryGroups.length === 0 ? (
          <EmptyState title={t('admin.clients.historyEmptyTitle')} copy={t('admin.clients.historyEmptyCopy')} icon={History} />
        ) : (
          recentHistoryGroups.map((group) => (
            <section className="client-history-group" key={group.lifecycle} aria-label={t(`enum.lifecycle.${group.lifecycle}`)}>
              <div className="client-history-group-head">
                <StatusPill type="lifecycle" value={group.lifecycle} t={t} />
                <span>{group.rentals.length}</span>
              </div>
              <div className="client-history-list">
                {group.rentals.map((rental) => (
                  <article className="history-card client-history-card" key={rental.reference}>
                    <div className="history-card-head">
                      <strong>{rental.reference}</strong>
                      <span>{formatDateRange(rental, locale)}</span>
                    </div>
                    <RentalItems rental={rental} products={products} t={t} compact />
                    <div className="history-card-status">
                      <StatusPill type="lifecycle" value={rental.lifecycle} t={t} />
                      <StatusPill type="payment" value={rental.paymentStatus} t={t} />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
        {olderHistoryGroups.length > 0 ? (
          <details className="client-history-older">
            <summary>
              <span>{t('admin.clients.olderRentals')}</span>
              <strong>{olderHistory.length}</strong>
            </summary>
            <div className="client-history-older-content">
              {olderHistoryGroups.map((group) => (
                <section className="client-history-group" key={group.lifecycle} aria-label={t(`enum.lifecycle.${group.lifecycle}`)}>
                  <div className="client-history-group-head">
                    <StatusPill type="lifecycle" value={group.lifecycle} t={t} />
                    <span>{group.rentals.length}</span>
                  </div>
                  <div className="client-history-list">
                    {group.rentals.map((rental) => (
                      <article className="history-card client-history-card" key={rental.reference}>
                        <div className="history-card-head">
                          <strong>{rental.reference}</strong>
                          <span>{formatDateRange(rental, locale)}</span>
                        </div>
                        <RentalItems rental={rental} products={products} t={t} compact />
                        <div className="history-card-status">
                          <StatusPill type="lifecycle" value={rental.lifecycle} t={t} />
                          <StatusPill type="payment" value={rental.paymentStatus} t={t} />
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </details>
        ) : null}
      </section>
    </AdminBottomSheet>
  );
}

type ClientDeleteConfirmSheetProps = {
  t: TFunction;
  target: Client | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ClientDeleteConfirmSheet({ t, target, open, onCancel, onConfirm }: ClientDeleteConfirmSheetProps) {
  if (!target) return null;

  return (
    <AdminBottomSheet
      open={open}
      onClose={onCancel}
      role="dialog"
      className="dialog-content destructive-dialog client-delete-dialog"
      ariaLabel={t('admin.clients.deleteTitle')}
      closeLabel={t('common.close')}
    >
      <AdminSheetHeader
        kicker={t('admin.clients.moreActions')}
        title={t('admin.clients.deleteTitle')}
        closeLabel={t('common.close')}
        onClose={onCancel}
      />
      <div className="destructive-summary client-delete-summary">
        <InfoBlock title={t('common.name')} copy={target.name} />
        <PhoneInfoBlock title={t('common.phone')} phone={target.phone} />
      </div>
      <p className="destructive-warning">{t('admin.clients.deleteCopy')}</p>
      <div className="dialog-actions client-delete-actions">
        <button className="danger-button" type="button" onClick={onConfirm}>
          <Trash2 aria-hidden="true" />
          {t('admin.clients.deleteConfirm')}
        </button>
        <button className="outline-button" type="button" onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
    </AdminBottomSheet>
  );
}

type ClientCardMetaProps = {
  client: Client;
  summary?: ClientRentalSummary;
  t: TFunction;
};

function ClientCardMeta({ client, summary, t }: ClientCardMetaProps) {
  const clientStatus = getClientStatus(summary, t);
  const totalRentals = summary?.totalRentals ?? client.totalRentals;

  return (
    <div className="client-card-meta">
      <span>
        {t('admin.clients.totalRentals')}: <strong>{totalRentals}</strong>
      </span>
      {clientStatus ? <ClientStatusBadge status={clientStatus} /> : null}
    </div>
  );
}

type ClientStatus = {
  label: string;
  tone: 'info' | 'warning';
};

function getClientStatus(summary: ClientRentalSummary | undefined, t: TFunction): ClientStatus | null {
  if (!summary) return null;
  if (summary.overdueCount > 0) {
    return {
      tone: 'warning',
      label: summary.overdueCount > 1 ? `${t('admin.clients.status.overdue')} (${summary.overdueCount})` : t('admin.clients.status.overdue'),
    };
  }
  if (summary.activeCount > 0) {
    return {
      tone: 'info',
      label: summary.activeCount > 1 ? `${t('admin.clients.status.active')} (${summary.activeCount})` : t('admin.clients.status.active'),
    };
  }
  return null;
}

function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span className={`status-badge ${status.tone}`}>
      <Clock3 aria-hidden="true" />
      <span className="status-badge-label">{status.label}</span>
    </span>
  );
}

type PhoneInfoBlockProps = {
  title: string;
  phone: string;
};

function PhoneInfoBlock({ title, phone }: PhoneInfoBlockProps) {
  return (
    <div className="info-block">
      <span>{title}</span>
      <strong>
        <PhoneLink phone={phone} destination="whatsapp" />
      </strong>
    </div>
  );
}

type PhoneDestination = 'whatsapp' | 'call';

type PhoneLinkProps = {
  phone: string;
  destination?: PhoneDestination;
};

function PhoneLink({ phone, destination = 'whatsapp' }: PhoneLinkProps) {
  const visiblePhone = String(phone ?? '').trim();
  if (!visiblePhone) return <span>-</span>;

  const href = phoneHref(visiblePhone, destination);
  const destinationLabel = destination === 'whatsapp' ? 'WhatsApp' : 'Call';
  const Icon = destination === 'whatsapp' ? MessageCircle : Phone;

  return (
    <a
      className="phone-link"
      href={href}
      target={destination === 'whatsapp' ? '_blank' : undefined}
      rel={destination === 'whatsapp' ? 'noreferrer' : undefined}
      aria-label={`${destinationLabel} ${visiblePhone}`}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => event.stopPropagation()}
    >
      <Icon aria-hidden="true" />
      <span>{visiblePhone}</span>
    </a>
  );
}

type ContactActionLinkProps = {
  phone: string;
  destination: PhoneDestination;
  label: string;
};

function ContactActionLink({ phone, destination, label }: ContactActionLinkProps) {
  const visiblePhone = String(phone ?? '').trim();
  if (!visiblePhone) return null;

  const href = phoneHref(visiblePhone, destination);
  const destinationLabel = destination === 'whatsapp' ? 'WhatsApp' : 'Call';
  const Icon = destination === 'whatsapp' ? MessageCircle : PhoneCall;

  return (
    <a
      className={`${destination === 'whatsapp' ? 'secondary-button' : 'outline-button'} client-contact-link`}
      href={href}
      target={destination === 'whatsapp' ? '_blank' : undefined}
      rel={destination === 'whatsapp' ? 'noreferrer' : undefined}
      aria-label={`${destinationLabel} ${visiblePhone}`}
    >
      <Icon aria-hidden="true" />
      {label}
    </a>
  );
}

function phoneHref(phone: string, destination: PhoneDestination) {
  const normalized = normalizePhone(phone);
  if (destination === 'whatsapp' && normalized) return `https://wa.me/${normalized}`;
  if (normalized) return `tel:+${normalized}`;
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

function groupHistoryByLifecycle(history: Rental[]) {
  return history.reduce<Array<{ lifecycle: Rental['lifecycle']; rentals: Rental[] }>>((groups, rental) => {
    const existing = groups.find((group) => group.lifecycle === rental.lifecycle);
    if (existing) {
      existing.rentals.push(rental);
      return groups;
    }
    return [...groups, { lifecycle: rental.lifecycle, rentals: [rental] }];
  }, []);
}

function clientInitials(name = ''): string {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? 'C'}${parts[1]?.[0] ?? ''}`.toUpperCase();
}
