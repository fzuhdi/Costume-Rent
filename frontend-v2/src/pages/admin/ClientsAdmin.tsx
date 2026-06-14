import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AdminCreateAction,
  AdminCreateFab,
  EntityDirectoryLayout,
  AdminListWindow,
  AdminViewBar,
} from '../../components/admin/common/AdminManagement';
import {
  ClientCreatePanel,
  ClientDeleteConfirmSheet,
  ClientDetailSheet,
  ClientList,
  type ClientRentalSummary,
  type NewClientDraft,
} from '../../components/admin/clients/ClientManagement';
import { SearchInput } from '../../components/shared';
import { BLOCKING_LIFECYCLES, normalizePhone } from '../../lib/rental-utils';
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
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState<NewClientDraft>({ name: '', phone: '', email: '', notes: '' });
  const [draft, setDraft] = useState<Client | null>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const normalizedQuery = normalizePhone(query);
  const visibleQuery = query.trim().toLowerCase();
  const summariesByClientId = useMemo(() => buildClientSummaries(clients, rentals), [clients, rentals]);
  const filtered = useMemo(() => clients.filter((client) => {
    const visiblePhone = String(client.phone ?? '').toLowerCase();
    const normalizedPhone = normalizePhone(client.phone);
    return (
      !visibleQuery ||
      client.name.toLowerCase().includes(visibleQuery) ||
      visiblePhone.includes(visibleQuery) ||
      (normalizedQuery.length > 0 && normalizedPhone.includes(normalizedQuery))
    );
  }), [clients, normalizedQuery, visibleQuery]);
  const selected = clients.find((client) => client.id === selectedId) ?? null;
  const selectedSummary = selected ? summariesByClientId[selected.id] : undefined;
  const history = useMemo(() => (
    selected
      ? rentals
          .filter((rental) => normalizePhone(rental.phone) === normalizePhone(selected.phone))
          .sort(compareRentalRecency)
      : []
  ), [rentals, selected?.phone]);

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

  const confirmDeleteClient = () => {
    if (!deleteTarget) return;
    const remainingClients = clients.filter((client) => client.id !== deleteTarget.id);
    setClients(remainingClients);
    if (selectedId === deleteTarget.id) {
      const nextClient = remainingClients[0];
      setSelectedId(nextClient?.id);
      setDraft(nextClient ?? null);
      setEditMode(false);
      setDetailOpen(false);
    }
    setDeleteTarget(null);
    setSaveMessage(t('admin.clients.deleted'));
    window.setTimeout(() => setSaveMessage(''), 2400);
  };

  return (
    <EntityDirectoryLayout className="clients-admin-grid" detailOpen={detailOpen}>
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
        <ClientList
          clients={filtered}
          selectedId={selected?.id}
          summariesByClientId={summariesByClientId}
          t={t}
          onView={viewClient}
        />
      </AdminListWindow>
      {detailOpen ? (
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
          summary={selectedSummary}
          onRequestDelete={setDeleteTarget}
        />
      ) : null}
      <ClientDeleteConfirmSheet
        t={t}
        target={deleteTarget}
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteClient}
      />
    </EntityDirectoryLayout>
  );
}

function buildClientSummaries(clients: Client[], rentals: Rental[]): Record<string, ClientRentalSummary> {
  return clients.reduce<Record<string, ClientRentalSummary>>((summaries, client) => {
    const clientPhone = normalizePhone(client.phone);
    const clientRentals = rentals.filter((rental) => normalizePhone(rental.phone) === clientPhone);
    const activeRentals = clientRentals.filter((rental) => BLOCKING_LIFECYCLES.includes(rental.lifecycle));
    const overdueRentals = clientRentals.filter((rental) => rental.lifecycle === 'on_rent');
    const latestRental = [...clientRentals].sort(compareRentalRecency)[0];

    summaries[client.id] = {
      totalRentals: Math.max(client.totalRentals ?? 0, clientRentals.length),
      activeCount: activeRentals.length,
      overdueCount: overdueRentals.length,
      latestLifecycle: latestRental?.lifecycle,
    };

    return summaries;
  }, {});
}

function compareRentalRecency(a: Rental, b: Rental) {
  return `${b.end}-${b.start}-${b.reference}`.localeCompare(`${a.end}-${a.start}-${a.reference}`);
}
