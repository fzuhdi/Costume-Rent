import { ChevronRight, Pencil, Phone, Plus, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminBottomSheet from '../../components/admin/AdminBottomSheet.jsx';
import { RentalItems } from '../../components/admin/AdminComponents.jsx';
import { EmptyState, Field, InfoBlock, PhoneField, SearchInput, StatusPill } from '../../components/shared.jsx';
import { formatDateRange, normalizePhone } from '../../lib/rental-utils.js';
import { resetMobileDetailScroll } from '../../lib/mobile-detail.js';

export default function ClientsAdmin({ t, locale, clients, setClients, rentals, products, dataAdapter }) {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('phone') ?? '');
  const [selectedId, setSelectedId] = useState(clients[0]?.id);
  const [editMode, setEditMode] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', notes: '' });
  const [draft, setDraft] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const normalizedQuery = normalizePhone(query);
  const filtered = clients.filter((client) => {
    const text = `${client.name} ${client.phone}`.toLowerCase();
    return text.includes(query.toLowerCase()) || (normalizedQuery && normalizePhone(client.phone).includes(normalizedQuery));
  });
  const selected = clients.find((client) => client.id === selectedId) ?? null;
  const history = selected ? rentals.filter((rental) => normalizePhone(rental.phone) === normalizePhone(selected.phone)) : [];

  useEffect(() => {
    const phone = searchParams.get('phone');
    if (phone) setQuery(phone);
  }, [searchParams]);

  useEffect(() => {
    if (filtered.length > 0 && !filtered.some((client) => client.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setDraft(selected);
    setEditMode(false);
  }, [selected?.id]);

  useEffect(() => {
    if (detailOpen) resetMobileDetailScroll();
  }, [detailOpen, selected?.id]);

  const saveClient = async () => {
    if (!draft?.id) return;
    const nextClient = { ...draft };
    if (dataAdapter) {
      await dataAdapter.admin.clients.save(nextClient);
    } else {
      setClients((current) => current.map((client) => (client.id === draft.id ? nextClient : client)));
    }
    setEditMode(false);
    setSaveMessage(t('admin.clients.saved'));
    window.setTimeout(() => setSaveMessage(''), 2400);
  };

  const addClient = () => {
    if (!newClient.name.trim() || !newClient.phone.trim()) return;
    const client = {
      id: `client-${Date.now()}`,
      name: newClient.name.trim(),
      phone: newClient.phone.trim(),
      email: newClient.email.trim(),
      notes: newClient.notes.trim(),
      totalRentals: 0,
      lastContact: locale === 'id' ? '27 Mei 2026' : 'May 27, 2026',
    };
    setClients((current) => [client, ...current]);
    setSelectedId(client.id);
    setDetailOpen(true);
    setNewClient({ name: '', phone: '', email: '', notes: '' });
    setAddOpen(false);
  };

  const viewClient = (clientId) => {
    setSelectedId(clientId);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    if (selected) setDraft(selected);
    setEditMode(false);
    setDetailOpen(false);
  };

  return (
    <div className={`admin-feature-grid clients-admin-grid ${detailOpen ? 'detail-open' : ''}`}>
      <section className="base-window management-window">
        <div className="view-bar">
          <SearchInput value={query} onChange={setQuery} placeholder={t('common.search')} clearLabel={t('common.clear')} />
          <button className="primary-button desktop-create-action" type="button" aria-expanded={addOpen} aria-controls="client-add-panel" onClick={() => setAddOpen((open) => !open)}>
            <Plus aria-hidden="true" />
            {t('admin.clients.add')}
          </button>
        </div>
        <button className="primary-button mobile-fab" type="button" aria-expanded={addOpen} aria-controls="client-add-panel" aria-label={t('admin.clients.add')} onClick={() => setAddOpen((open) => !open)}>
          <Plus aria-hidden="true" />
          <span className="visually-hidden">{t('admin.clients.add')}</span>
        </button>
        {addOpen ? (
          <div className="content-panel compact-panel" id="client-add-panel">
            <div className="panel-form-head">
              <div>
                <span className="section-kicker">{t('admin.clients.add')}</span>
                <h3>{t('admin.clients.addHelp')}</h3>
              </div>
              <button className="icon-button" type="button" aria-label={t('common.close')} onClick={() => setAddOpen(false)}>
                <X aria-hidden="true" />
              </button>
            </div>
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
            <button className="secondary-button full" type="button" onClick={addClient} disabled={!newClient.name.trim() || !newClient.phone.trim()}>
              {t('common.save')}
            </button>
          </div>
        ) : null}
        <div className="management-list padded">
          {filtered.length === 0 ? (
            <EmptyState title={t('admin.clients.emptyTitle')} copy={t('admin.clients.emptyCopy')} icon={Search} />
          ) : (
            filtered.map((client) => (
              <article
                className={`management-card client-card ${selected?.id === client.id ? 'selected' : ''}`}
                role="button"
                tabIndex={0}
                key={client.id}
                onClick={() => viewClient(client.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    viewClient(client.id);
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
      </section>
      {selected && draft && detailOpen ? (
        <AdminBottomSheet
          open={detailOpen}
          onClose={closeDetail}
          role="dialog"
          className="record-panel feature-panel clients-detail-panel"
          backdropClassName="clients-detail-backdrop"
          ariaLabel={t('admin.clients.title')}
          closeLabel={t('common.close')}
        >
          <div className="record-panel-head">
            <span className="eyebrow">{t('admin.clients.title')}</span>
            <strong>{draft.name}</strong>
            <button className="icon-button client-detail-close" type="button" aria-label={t('common.close')} onClick={closeDetail}>
              <X aria-hidden="true" />
            </button>
          </div>
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
                <button type="button" onClick={saveClient}>{t('common.save')}</button>
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
      ) : null}
    </div>
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
