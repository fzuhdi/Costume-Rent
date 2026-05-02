import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClients, deleteClient } from '../api/clientApi';
import { Search, Trash2 } from 'lucide-react';
import {
  Input, Button, Chip,
  Table, Spinner, Pagination, Card
} from '@heroui/react';

const ClientListPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [search, page]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await getClients({ search, page, limit: 10 });
      setClients(response.data.data || []);
      setTotalPages(response.data.total_pages || 1);
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
      await deleteClient(selectedClientId);
      setIsDeleteOpen(false);
      fetchClients();
    } catch (error) {
      console.error('Failed to delete client:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Daftar Klien</h1>

      <Input
        placeholder="Cari nama klien..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        startContent={<Search size={18} />}
        className="w-64"
      />

      <p className="text-sm text-[var(--muted)]">Ditemukan {total} klien</p>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Spinner />
        </div>
      ) : clients.length === 0 ? (
        <Card>
          <Card.Content className="text-center py-12">
            <h3 className="text-lg font-semibold">Tidak ada klien</h3>
            <p className="text-sm text-[var(--muted)]">Klien akan muncul setelah membuat peminjaman</p>
          </Card.Content>
        </Card>
      ) : (
        <Card>
          <Card.Content>
            <Table aria-label="Client list">
              <Table.ScrollContainer>
                <Table.Content>
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
                            <Chip size="sm" variant="danger-soft">Ada Terlambat</Chip>
                          )}
                          {client.active_rents > 0 && !client.has_overdue && (
                            <Chip size="sm" variant="secondary">{client.active_rents} Aktif</Chip>
                          )}
                          {client.active_rents === 0 && (
                            <Chip size="sm" variant="secondary">Tidak Ada Aktif</Chip>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex gap-2">
                            <Button as={Link} to={`/clients/${client.id}`} variant="bordered" size="sm">Detail</Button>
                            <Button variant="danger" size="sm" isIconOnly aria-label="Hapus klien" onPress={() => { setSelectedClientId(client.id); setIsDeleteOpen(true); }}>
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
          </Card.Content>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination total={totalPages} page={page} onChange={setPage} />
        </div>
      )}

      <Modal>
        <Modal.Backdrop isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Konfirmasi</Modal.Heading>
              </Modal.Header>
              <Modal.Body>Hapus klien ini?</Modal.Body>
              <Modal.Footer>
                <Button variant="bordered" onPress={() => setIsDeleteOpen(false)}>Batal</Button>
                <Button variant="danger" onPress={handleDelete} isPending={actionLoading}>Hapus</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
};

export default ClientListPage;