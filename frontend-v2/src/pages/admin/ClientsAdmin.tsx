import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AdminCreateAction,
  AdminCreateFab,
  AdminFeatureGrid,
  AdminListWindow,
  AdminViewBar,
} from '../../components/admin/common/AdminManagement';
import {
  ClientCreatePanel,
  ClientDetailSheet,
  ClientList,
  type NewClientDraft,
} from '../../components/admin/clients/ClientManagement';
import { SearchInput } from '../../components/shared';
import { normalizePhone } from '../../lib/rental-utils';
import { resetMobileDetailScroll } from '../../lib/mobile-detail';
import type { StateSetter } from '../../types/app';
import type { Client, DataAdapter, Locale, Product, Rental, TFunction } from '../../types/domain';

type ClientsAdminProps = {
  t: TFunction;
  locale: Locale;
  clients: Client[];
  setClients: StateSetter<Client[]>;
  rentals: Rental[];
  products: Product[];
  dataAdapter?: DataAdapter;
};

export default function ClientsAdmin({ t, locale, clients, setClients, rentals, products, dataAdapter }: ClientsAdminProps) {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('phone') ?? '');
  const [selectedId, setSelectedId] = useState<string | undefined>(clients[0]?.id);
  const [editMode, setEditMode] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newClient, setNewClient] = useState<NewClientDraft>({ name: '', phone: '', email: '', notes: '' });
  const [draft, setDraft] = useState<Client | null>(null);
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
    const nextClient: Client = { ...draft };
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
    const client: Client = {
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

  const viewClient = (clientId: string) => {
    setSelectedId(clientId);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    if (selected) setDraft(selected);
    setEditMode(false);
    setDetailOpen(false);
  };

  return (
    <AdminFeatureGrid className="clients-admin-grid" detailOpen={detailOpen}>
      <AdminListWindow>
        <AdminViewBar>
          <SearchInput value={query} onChange={setQuery} placeholder={t('common.search')} clearLabel={t('common.clear')} />
          <AdminCreateAction
            label={t('admin.clients.add')}
            open={addOpen}
            controls="client-add-panel"
            onToggle={() => setAddOpen((open) => !open)}
          />
        </AdminViewBar>
        <AdminCreateFab
          label={t('admin.clients.add')}
          open={addOpen}
          controls="client-add-panel"
          onToggle={() => setAddOpen((open) => !open)}
        />
        {addOpen ? (
          <ClientCreatePanel
            t={t}
            newClient={newClient}
            setNewClient={setNewClient}
            onAdd={addClient}
            onClose={() => setAddOpen(false)}
          />
        ) : null}
        <ClientList clients={filtered} selectedId={selected?.id} t={t} onView={viewClient} />
      </AdminListWindow>
      <ClientDetailSheet
        t={t}
        locale={locale}
        selected={selected}
        draft={draft}
        setDraft={setDraft}
        editMode={editMode}
        setEditMode={setEditMode}
        open={detailOpen}
        onClose={closeDetail}
        onSave={saveClient}
        saveMessage={saveMessage}
        history={history}
        products={products}
      />
    </AdminFeatureGrid>
  );
}
