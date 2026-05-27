import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RentalItems } from '../../components/admin/AdminComponents.jsx';
import { InfoBlock, StatusPill } from '../../components/shared.jsx';
import { formatDateRange, normalizePhone } from '../../lib/rental-utils.js';

export default function ClientsAdmin({ t, locale, clients, rentals, products }) {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('phone') ?? '');
  const [selectedId, setSelectedId] = useState(clients[0]?.id);
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

  return (
    <div className="admin-feature-grid">
      <section className="base-window management-window">
        <div className="view-bar">
          <label className="search-inline">
            <Search aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('common.search')} />
          </label>
        </div>
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
      {selected ? (
        <section className="record-panel feature-panel">
          <div className="record-panel-head">
            <span className="eyebrow">{t('admin.clients.title')}</span>
            <strong>{selected.name}</strong>
          </div>
          <div className="info-grid">
            <InfoBlock title={t('common.phone')} copy={selected.phone} />
            <InfoBlock title={t('common.email')} copy={selected.email || '-'} />
            <InfoBlock title={t('admin.clients.lastContact')} copy={selected.lastContact} />
            <InfoBlock title={t('common.notes')} copy={selected.notes} />
          </div>
          <div className="management-list">
            {history.map((rental) => (
              <article className="history-card" key={rental.reference}>
                <div>
                  <strong>{rental.reference}</strong>
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
