import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getClients, deleteClient } from '../api/clientApi';
import { Search, Trash2 } from 'lucide-react';
import {
  Input, Button, Chip,
  Table, Spinner, Modal, Card, Separator
} from '@heroui/react';
import CustomPagination from '../components/CustomPagination';

const ClientListPage = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const selectedClientId = useRef(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchClients();
  }, [debouncedSearch, page, limit]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await getClients({ search: debouncedSearch, page, limit });
      setClients(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteClient(selectedClientId.current);
      setIsDeleteOpen(false);
      fetchClients();
    } catch (error) {
      console.error('Failed to delete client:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card>
      <Card.Header className="flex flex-col gap-4 px-6 py-5">
        {/* Title */}
        <h1 className="text-2xl font-bold">Daftar Klien</h1>

        <Separator />

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          {/* Search */}
          <Input
            placeholder="Cari nama klien..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Cari klien"
            className="w-full sm:w-64"
            startContent={<Search size={18} className="text-[var(--muted)]" />}
          />

          <Button onPress={() => navigate('/clients/new')} variant="primary" size="sm">
            <span className="whitespace-nowrap">Tambah Klien</span>
          </Button>
        </div>

        <Separator />
      </Card.Header>

      <Card.Content>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Spinner />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold">Tidak ada klien</h3>
            <p className="text-sm text-[var(--muted)]">Klien akan muncul setelah membuat peminjaman</p>
          </div>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Client list">
                <Table.Header>
                  <Table.Column isRowHeader>Nama</Table.Column>
                  <Table.Column>Telepon</Table.Column>
                  <Table.Column>Alamat</Table.Column>
                  <Table.Column>Total Pinjaman</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Aksi</Table.Column>
                </Table.Header>
                <Table.Body>
                  {clients.map((client) => (
                    <Table.Row key={client.id}>
                      <Table.Cell>
                        <Link to={`/clients/${client.id}`} className="text-[var(--primary)] hover:underline">
                          {client.name}
                        </Link>
                      </Table.Cell>
                      <Table.Cell>{client.phone || '-'}</Table.Cell>
                      <Table.Cell>{client.address || '-'}</Table.Cell>
                      <Table.Cell>{client.total_rents}</Table.Cell>
                      <Table.Cell>
                        {client.has_overdue && (
                           <Chip size="sm" variant="soft" color="danger">Ada Terlambat</Chip>
                        )}
                        {client.active_rents > 0 && !client.has_overdue && (
                          <Chip size="sm" variant="secondary">{client.active_rents} Aktif</Chip>
                        )}
                        {client.active_rents === 0 && (
                          <Chip size="sm" variant="secondary">Tidak Ada Aktif</Chip>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-col sm:flex-row gap-2">
                           <Button onPress={() => navigate(`/clients/${client.id}`)} variant="bordered" size="sm" aria-label={`Detail klien ${client.name}`}>Detail</Button>
                          <Button variant="danger" size="sm" isIconOnly aria-label="Hapus klien" onPress={() => { selectedClientId.current = client.id; setIsDeleteOpen(true); }}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </Card.Content>

      <Card.Footer>
        <CustomPagination
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
      </Card.Footer>

      <Modal.Backdrop isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Konfirmasi</Modal.Heading>
            </Modal.Header>
            <Modal.Body>Hapus klien ini?</Modal.Body>
            <Modal.Footer>
              <Button variant="bordered" onPress={() => setIsDeleteOpen(false)} aria-label="Batal">Batal</Button>
              <Button variant="danger" onPress={handleDelete} isPending={actionLoading} aria-label="Hapus klien">Hapus</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Card>
  );
};

export default ClientListPage;
