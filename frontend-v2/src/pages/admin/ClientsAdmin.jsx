import { Pencil, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RentalItems } from '../../components/admin/AdminComponents.jsx';
import { Field, InfoBlock, StatusPill } from '../../components/shared.jsx';
import { formatDateRange, normalizePhone } from '../../lib/rental-utils.js';

export default function ClientsAdmin({ t, locale, clients, setClients, rentals, products, dataAdapter }) {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('phone') ?? '');
  const [selectedId, setSelectedId] = useState(clients[0]?.id);
  const [editMode, setEditMode] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', notes: '' });
  const [draft, setDraft] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const normalizedQuery = normalizePhone(query);
  const filtered = clients.filter((client) => {
    const text = `${client.name} ${client.phone}`.toLowerCase();
    return text.includes(query.toLowerCase()) || (normalizedQuery && normalizePhone(client.phone).includes(normalizedQuery));
  });
  const selected = clients.find((client) => client.id === selectedId) ?? clients[0];
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
    setNewClient({ name: '', phone: '', email: '', notes: '' });
    setAddOpen(false);
  };

  return (
    <div className="admin-feature-grid">
      <section className="base-window management-window">
        <div className="view-bar">
          <label className="search-inline">
            <Search aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('common.search')} />
          </label>
          <button className="primary-button" type="button" onClick={() => setAddOpen((open) => !open)}>
            <Plus aria-hidden="true" />
            {t('admin.clients.add')}
          </button>
        </div>
        {addOpen ? (
          <div className="content-panel compact-panel">
            <div className="form-grid">
              <Field label={t('common.name')}>
                <input value={newClient.name} onChange={(event) => setNewClient((current) => ({ ...current, name: event.target.value }))} />
              </Field>
              <Field label={t('common.phone')}>
                <input value={newClient.phone} onChange={(event) => setNewClient((current) => ({ ...current, phone: event.target.value }))} />
              </Field>
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
          {filtered.map((client) => (
            <button className={`management-card ${selected?.id === client.id ? 'selected' : ''}`} type="button" key={client.id} onClick={() => setSelectedId(client.id)}>
              <div>
                <strong>{client.name}</strong>
                <span>{client.phone}</span>
              </div>
              <small>{t('admin.clients.totalRentals')}: {client.totalRentals}</small>
            </button>
          ))}
        </div>
      </section>
      {selected && draft ? (
        <section className="record-panel feature-panel">
          <div className="record-panel-head">
            <span className="eyebrow">{t('admin.clients.title')}</span>
            <strong>{draft.name}</strong>
          </div>
          {editMode ? (
            <div className="content-panel compact-panel">
              <div className="form-grid">
                <Field label={t('common.name')}>
                  <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
                </Field>
                <Field label={t('common.phone')}>
                  <input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
                </Field>
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
                <InfoBlock title={t('common.phone')} copy={selected.phone} />
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
        </section>
      ) : null}
    </div>
  );
}
